# Code Review Automation - Herramientas y Setup

## Automation Stack

### CI/CD Integration

#### GitHub Actions - Full Workflow

```yaml
# .github/workflows/code-review.yml
name: Code Review Quality Gates

on:
  pull_request:
    branches: [main, develop]

jobs:
  quality-gate:
    runs-on: ubuntu-latest
    name: Quality Checks

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linters
        run: |
          npm run lint
          npm run format:check

      - name: Run type check
        run: npm run type-check

      - name: Run unit tests
        run: npm test -- --coverage

      - name: Run security audit
        run: npm audit --audit-level=moderate

      - name: Run SAST scan
        uses: github/codeql-action/init@v2
        with:
          languages: javascript

      - name: Build application
        run: npm run build

      - name: Comment PR with results
        uses: actions/github-script@v7
        if: always()
        with:
          script: |
            const { data: pr } = await github.rest.pulls.get({
              owner: context.repo.owner,
              repo: context.repo.repo,
              pull_number: context.issue.number
            });

            const checks = [
              '✅ Linting passed',
              '✅ Type checking passed',
              '✅ Unit tests passed',
              '✅ Security audit passed',
              '✅ Build successful'
            ];

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## Quality Gate Results\n\n${checks.join('\n')}\n\n**Reviewer**: @${pr.user.login}\n\n**Ready for review!**`
            });

  code-owners:
    runs-on: ubuntu-latest
    name: Auto-assign Reviewers

    steps:
      - name: Auto-assign reviewers
        uses: actions/github-script@v7
        with:
          script: |
            const { data: pr } = await github.rest.pulls.get({
              owner: context.repo.owner,
              repo: context.repo.repo,
              pull_number: context.issue.number
            });

            const reviewers = [];

            // Auto-assign based on changed files
            const { data: files } = await github.rest.pulls.listFiles({
              owner: context.repo.owner,
              repo: context.repo.repo,
              pull_number: context.issue.number
            });

            const changedPaths = files.map(f => f.filename);

            // Assign backend reviewer for API changes
            if (changedPaths.some(p => p.includes('api/') || p.includes('routes/'))) {
              reviewers.push('senior-backend-dev');
            }

            // Assign frontend reviewer for UI changes
            if (changedPaths.some(p => p.includes('components/') || p.includes('.css'))) {
              reviewers.push('senior-frontend-dev');
            }

            if (reviewers.length > 0) {
              await github.rest.pulls.requestReviewers({
                owner: context.repo.owner,
                repo: context.repo.repo,
                pull_number: context.issue.number,
                reviewers: reviewers
              });
            }
```

#### GitLab CI Integration

```yaml
# .gitlab-ci.yml
stages:
  - lint
  - test
  - security
  - build
  - review

code-quality:
  stage: lint
  image: node:18
  script:
    - npm ci
    - npm run lint
    - npm run type-check
    - npm run format:check
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"

unit-tests:
  stage: test
  image: node:18
  script:
    - npm ci
    - npm test -- --coverage
  coverage: '/All files[^|]*\|[^|]*\s+([\d\.]+)/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"

security-scan:
  stage: security
  image: node:18
  script:
    - npm audit --audit-level=moderate
    - npm run security:scan
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"

notify-reviewers:
  stage: review
  image: alpine:latest
  script:
    - apk add --no-cache curl
    - curl -X POST "$SLACK_WEBHOOK" \
      -H 'Content-Type: application/json' \
      -d "{\"text\":\"New MR requires review: $CI_MERGE_REQUEST_TITLE\"}"
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
      when: on_success
```

### Pre-commit Hooks

#### Husky + lint-staged

```bash
# Install
npm install --save-dev husky lint-staged

# Setup
npx husky install
npx husky add .husky/pre-commit "npx lint-staged"

# Add to package.json
```

```json
{
  "lint-staged": {
    "*.{js,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,yml,yaml}": [
      "prettier --write"
    ]
  }
}
```

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "npm test"
    }
  }
}
```

#### Custom Pre-commit Hook Script

```bash
#!/bin/bash
# .git-hooks/pre-commit

echo "Running pre-commit checks..."

# Check for console.log
if git diff --cached --name-only | grep -E '\.(js|ts|tsx)$' | xargs grep -l 'console\.log' > /dev/null; then
  echo "ERROR: console.log found in committed files. Please remove before committing."
  exit 1
fi

# Check for TODO/FIXME without owner
if git diff --cached --name-only | xargs grep -E '(TODO|FIXME)' | grep -vE 'TODO: @\w+' > /dev/null; then
  echo "WARNING: Found TODO/FIXME without assignee. Consider adding @username."
fi

# Check for secrets
if git diff --cached --name-only | xargs trufflehog git file . --json 2>/dev/null | grep -q '"verified":true'; then
  echo "ERROR: Possible secrets detected. Please review before committing."
  exit 1
fi

# Run tests on changed files
npm test -- --findRelatedTests $(git diff --cached --name-only)

echo "✅ Pre-commit checks passed!"
```

### Code Owners Setup

```
# .github/CODEOWNERS
# Global code owners
* @team-leads

# Backend changes
/packages/backend/ @senior-backend-dev @backend-tech-lead
/api/ @backend-team
/routes/ @backend-team
/models/ @backend-team

# Frontend changes
/packages/frontend/ @senior-frontend-dev @frontend-tech-lead
/components/ @frontend-team
/styles/ @frontend-team

# Database changes
/migrations/ @database-admin @senior-backend-dev
/prisma/ @database-admin

# Configuration
/.github/workflows/ @devops-team
/docker-compose.yml @devops-team
/k8s/ @devops-team

# Security-sensitive files
/auth/ @security-team
/payments/ @security-team @finance-team
```

### PR Templates

#### Detailed PR Template

```markdown
<!-- .github/pull_request_template.md -->
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Refactoring (no functional changes)
- [ ] Documentation update

## How Has This Been Tested?
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Manual testing

## Checklist
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published

## Screenshots (if applicable)

## Related Issues
Closes #

## Additional Notes
Add any other context about the PR here
```

#### Quick PR Template (Bug Fixes)

```markdown
<!-- .github/PULL_REQUEST_TEMPLATE.md -->
**Bug Fix**: [Short description]

**Root Cause**: [What was causing the bug]

**Solution**: [How you fixed it]

**Testing**:
- [ ] Verified fix works
- [ ] No regressions
- [ ] Added test case

**Reviewer**: @reviewer-name
```

### GitHub Apps and Integrations

#### Reviewdog - Automated Review Comments

```yaml
# .github/workflows/reviewdog.yml
name: Reviewdog

on:
  pull_request:

jobs:
  reviewdog:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint
        continue-on-error: true

      - name: Run Reviewdog
        uses: reviewdog/action-eslint@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          reporter: github-pr-review
          filter_mode: nofilter
          level: warning
```

#### Danger.js - Automated PR Validation

```javascript
// dangerfile.js
import { danger, warn, fail, message } from 'danger';

const modified = danger.git.modified_files;
const created = danger.git.created_files;
const deleted = danger.github.issue.title;

// Check for large PRs
const bigPRThreshold = 600;
if (danger.github.pr.additions + danger.github.pr.deletions > bigPRThreshold) {
  warn(`This PR adds ${danger.github.pr.additions} and removes ${danger.github.pr.deletions} lines. Consider splitting into smaller PRs.`);
}

// Require tests
const testFiles = [...modified, ...created].filter(file =>
  file.includes('.test.') || file.includes('.spec.')
);

if (testFiles.length === 0 && !danger.github.title.includes('[skip tests]')) {
  fail('Please add tests for this PR.');
}

// Check for console.log
const consoleLogs = [...modified, ...created].some(file => {
  const content = danger.git.staged_files_for_merge.find(f => f.filename === file);
  return content && content.diff.includes('console.log');
});

if (consoleLogs) {
  warn('Please remove console.log statements before merging.');
}

// Check PR description
if (danger.github.pr.body.length < 20) {
  fail('Please provide a detailed description for this PR.');
}

// Add helpful messages
message('Thanks for opening this PR! Remember to update the CHANGELOG.md if needed.');
```

### Code Quality Tools

#### ESLint Configuration

```json
{
  "extends": [
    "eslint:recommended",
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "rules": {
    "no-console": "warn",
    "no-debugger": "error",
    "no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/explicit-function-return-type": "warn"
  }
}
```

#### Prettier Configuration

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

#### SonarQube Integration

```yaml
# .github/workflows/sonarqube.yml
name: SonarQube Analysis

on:
  pull_request:
  push:
    branches: [main]

jobs:
  sonarcloud:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test -- --coverage

      - name: SonarCloud Scan
        uses: SonarSource/sonarcloud-github-action@master
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

### Review Automation Scripts

#### PR Size Checker

```bash
#!/bin/bash
# scripts/check-pr-size.sh

ADDITIONS=$(git diff --stat HEAD~1 HEAD | grep -oP '\d+ insertions' | grep -oP '\d+' || echo 0)
DELETIONS=$(git diff --stat HEAD~1 HEAD | grep -oP '\d+ deletions' | grep -oP '\d+' || echo 0)

echo "PR Size Check:"
echo "Additions: $ADDITIONS lines"
echo "Deletions: $DELETIONS lines"
echo "Total changes: $((ADDITIONS + DELETIONS)) lines"

if [ $((ADDITIONS + DELETIONS)) -gt 600 ]; then
  echo "⚠️  WARNING: PR is large (>$((ADDITIONS + DELETIONS)) lines). Consider splitting."
  exit 1
elif [ $((ADDITIONS + DELETIONS)) -gt 400 ]; then
  echo "⚠️  CAUTION: PR is moderately large. Consider if it can be smaller."
else
  echo "✅ PR size is acceptable."
fi
```

#### Test Coverage Reporter

```bash
#!/bin/bash
# scripts/coverage-reporter.sh

COVERAGE=$(npm test -- --coverage --coverageReporters=json | grep -oP '"lines":\{\P*"pct":\K[\d\.]+' || echo 0)

echo "Test Coverage: $COVERAGE%"

if (( $(echo "$COVERAGE < 80" | bc -l) )); then
  echo "❌ FAIL: Test coverage below 80% threshold."
  echo "Current coverage: $COVERAGE%"
  exit 1
else
  echo "✅ PASS: Test coverage meets threshold."
fi

# Comment coverage on PR
if [ "$GITHUB_ACTIONS" == "true" ]; then
  curl -X POST \
    -H "Authorization: token $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    https://api.github.com/repos/$GITHUB_REPOSITORY/issues/$PR_NUMBER/comments \
    -d "{\"body\":\"## Test Coverage: $COVERAGE% ✅\"}"
fi
```

### Metrics and Analytics

#### Review Time Tracker

```javascript
// scripts/review-metrics.js
const fs = require('fs');

function trackReviewMetrics(prNumber, startTime, endTime) {
  const duration = endTime - startTime; // in ms
  const hours = duration / (1000 * 60 * 60);

  const metrics = {
    prNumber,
    startTime: new Date(startTime).toISOString(),
    endTime: new Date(endTime).toISOString(),
    durationHours: hours,
    timestamp: new Date().toISOString()
  };

  // Append to metrics file
  fs.appendFileSync('review-metrics.jsonl', JSON.stringify(metrics) + '\n');

  console.log(`Review completed in ${hours.toFixed(2)} hours`);
}

// Usage
const startTime = Date.now();
// ... review process ...
const endTime = Date.now();
trackReviewMetrics(123, startTime, endTime);
```

#### Review Analytics Dashboard

```bash
#!/bin/bash
# scripts/review-analytics.sh

echo "=== Code Review Analytics ==="
echo ""

# Average review time
echo "Average review time:"
cat review-metrics.jsonl | jq -r '.durationHours' | \
  awk '{ sum += $1; count++ } END { printf "%.2f hours\n", sum/count }'

echo ""

# PRs by size
echo "PRs by size:"
cat review-metrics.jsonl | jq -r '.prSize' | \
  sort | uniq -c | sort -nr

echo ""

# Most active reviewers
echo "Top reviewers:"
cat review-events.jsonl | jq -r '.reviewer' | \
  sort | uniq -c | sort -nr | head -5

echo ""

# Review turnaround time
echo "Review turnaround time:"
cat review-metrics.jsonl | jq -r '.durationHours' | \
  awk '{ if ($1 < 1) print "Same day"; else if ($1 < 24) print "Within 24h"; else print "> 24h" }' | \
  sort | uniq -c
```

### Notification System

#### Slack Integration

```yaml
# .github/workflows/slack-notify.yml
name: Slack Notifications

on:
  pull_request:
    types: [opened, ready_for_review, closed]

jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - name: Notify Slack
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          channel: '#code-reviews'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
          fields: repo,message,commit,author,action,eventName,ref,workflow
        if: always()
```

#### Email Notifications

```javascript
// scripts/email-notifications.js
const nodemailer = require('nodemailer');

async function sendReviewRequest(email, prUrl, author) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  await transporter.sendMail({
    from: 'noreply@company.com',
    to: email,
    subject: 'Code Review Request',
    html: `
      <h2>New Pull Request Requires Review</h2>
      <p><strong>Author:</strong> ${author}</p>
      <p><strong>PR:</strong> <a href="${prUrl}">${prUrl}</a></p>
      <p>Please review and provide feedback.</p>
    `
  });
}
```

### Setup Guide

#### Step 1: Initialize Git Hooks
```bash
# Install husky
npm install --save-dev husky

# Setup hooks
npx husky install

# Add pre-commit hook
npx husky add .husky/pre-commit "npm run pre-commit-check"

# Add commit-msg hook
npx husky add .husky/commit-msg "npx commitlint --edit $1"
```

#### Step 2: Configure Code Owners
```bash
# Create CODEOWNERS file
cat > .github/CODEOWNERS << EOF
# Global owners
* @team-leads

# Backend
/backend/ @backend-lead

# Frontend
/frontend/ @frontend-lead

# Database
/migrations/ @dba
EOF
```

#### Step 3: Setup GitHub Actions
```bash
# Create workflow directory
mkdir -p .github/workflows

# Copy workflow files
cp templates/code-review.yml .github/workflows/
```

#### Step 4: Configure PR Templates
```bash
mkdir -p .github
cat > .github/pull_request_template.md << EOF
<!-- Template content -->
EOF
```

#### Step 5: Install and Configure Tools
```bash
# Install linting and formatting tools
npm install --save-dev eslint prettier husky lint-staged

# Initialize configuration
npx eslint --init
npx prettier --write .prettierrc
```

---

**Estado**: Automation tools configuradas
**Benefits**: Faster reviews, consistent quality, reduced manual work
**Maintenance**: Review and update automation quarterly
