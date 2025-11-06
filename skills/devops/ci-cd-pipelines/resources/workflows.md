# CI/CD Workflows - Ejemplos Avanzados

## Workflows y Patterns Avanzados

Esta guía cubre workflows complejos, matrix builds, y patterns de deployment.

---

## 1. Matrix Builds

### Multi-Version Testing

```yaml
# GitHub Actions - Matrix build
name: Matrix Tests

on: [push, pull_request]

jobs:
  test:
    name: Test Node ${{ matrix.node-version }} on ${{ matrix.os }}
    runs-on: ${{ matrix.os }}

    strategy:
      fail-fast: false
      matrix:
        node-version: [16.x, 18.x, 20.x]
        os: [ubuntu-latest, windows-latest, macos-latest]
        exclude:
          # Exclude unsupported combinations
          - node-version: 16.x
            os: macos-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          node-version: ${{ matrix.node-version }}
```

### Multi-Database Testing

```yaml
# GitHub Actions - Database matrix
name: Database Tests

jobs:
  test:
    name: Test with ${{ matrix.database }}
    runs-on: ubuntu-latest

    strategy:
      matrix:
        database: [postgres-13, postgres-14, mysql-8, mariadb-10.6]
        node-version: [16, 18]

    services:
      postgres:
        image: postgres:${{ matrix.database }}
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      mysql:
        image: mysql:${{ matrix.database }}
        env:
          MYSQL_ROOT_PASSWORD: root
        options: >-
          --health-cmd="mysqladmin ping"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=3
        ports:
          - 3306:3306

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test
        env:
          DATABASE_URL: ${{ matrix.database == 'postgres-13' && 'postgres://postgres:postgres@localhost:5432/test' || '' }}
```

---

## 2. Monorepo Workflows

### Lerna Monorepo

```yaml
# .github/workflows/monorepo.yml
name: Monorepo CI

on:
  push:
    branches: [main]
    paths:
      - 'packages/**'
      - 'package.json'
      - 'package-lock.json'
      - 'lerna.json'
  pull_request:
    paths:
      - 'packages/**'

jobs:
  # Install and build all packages
  setup:
    runs-on: ubuntu-latest
    outputs:
      changed-packages: ${{ steps.changed-packages.outputs.packages }}
    steps:
      - name: Checkout
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

      - name: Install Lerna
        run: npm install -g lerna

      - name: Bootstrap packages
        run: lerna bootstrap --hoist

      - name: Get changed packages
        id: changed-packages
        run: |
          CHANGED_PACKAGES=$(lerna changed --json | jq -r '[.[].name] | join(",")')
          echo "packages=$CHANGED_PACKAGES" >> $GITHUB_OUTPUT

  # Test changed packages only
  test:
    needs: setup
    runs-on: ubuntu-latest
    strategy:
      matrix:
        package: ${{ fromJson(needs.setup.outputs.changed-packages) }}
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci && npm install -g lerna

      - name: Bootstrap packages
        run: lerna bootstrap --hoist

      - name: Test package ${{ matrix.package }}
        run: lerna run test --scope=${{ matrix.package }}
```

---

## 3. Feature Branch Workflows

### Branch-Specific Deployments

```yaml
# GitHub Actions - Feature branch deploy
name: Feature Branch Deploy

on:
  push:
    branches:
      - 'feature/*'
      - 'hotfix/*'

jobs:
  deploy-preview:
    name: Deploy Preview
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/feature/new-dashboard'

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Deploy preview
        run: |
          BRANCH_NAME=${GITHUB_REF#refs/heads/}
          PREVIEW_URL="https://preview-$BRANCH_NAME.example.com"
          echo "Deploying preview to $PREVIEW_URL"
          # Deployment script here

      - name: Comment PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const previewUrl = `https://preview-${context.ref.replace('refs/heads/', '')}.example.com`;
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `🚀 Preview deployed to: ${previewUrl}`
            })
```

---

## 4. Release Workflows

### Automated Releases

```yaml
# GitHub Actions - Automated releases
name: Release

on:
  push:
    branches: [main]
    tags: ['v*']

jobs:
  release:
    name: Create Release
    runs-on: ubuntu-latest
    if: startsWith(github.ref, 'refs/tags/v')

    steps:
      - name: Checkout
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

      - name: Build
        run: npm run build

      - name: Run tests
        run: npm test

      - name: Create dist artifact
        uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist/

      - name: Create Release
        id: create_release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
          draft: false
          prerelease: false

      - name: Upload Release Asset
        uses: actions/upload-release-asset@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          upload_url: ${{ steps.create_release.outputs.upload_url }}
          asset_path: ./dist/release.zip
          asset_name: release-${{ github.ref }}.zip
          asset_content_type: application/zip

      - name: Update package.json version
        run: |
          NEW_VERSION=${GITHUB_REF#refs/tags/v}
          npm version $NEW_VERSION --no-git-tag-version
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add package.json package-lock.json
          git commit -m "chore: bump version to $NEW_VERSION"
          git push

  # Docker image release
  docker-release:
    name: Release Docker Image
    runs-on: ubuntu-latest
    needs: release
    if: startsWith(github.ref, 'refs/tags/v')

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: myapp
          tags: |
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=semver,pattern={{major}}
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
```

---

## 5. Staging Deployment Workflows

### Blue-Green Deployment

```yaml
# GitLab CI - Blue-Green deployment
stages:
  - build
  - test
  - deploy-staging
  - deploy-production

build:
  stage: build
  image: alpine:latest
  script:
    - echo "Building application..."
    - docker build -t myapp:$CI_COMMIT_SHA .
  services:
    - docker:dind
  only:
    - main

deploy-staging:
  stage: deploy-staging
  image: alpine:latest
  script:
    - apk add --no-cache curl
    # Deploy to staging (green)
    - echo "Deploying to staging (green environment)"
    - curl -X POST $STAGING_GREEN_DEPLOY_HOOK
    # Run smoke tests
    - curl -f $STAGING_GREEN_URL/health || exit 1
  environment:
    name: staging
    url: $STAGING_GREEN_URL
  only:
    - main

deploy-production:
  stage: deploy-production
  image: alpine:latest
  script:
    - apk add --no-cache curl
    # Get current production environment (blue or green)
    - CURRENT_ENV=$(curl -s $PRODUCTION_STATUS_URL | jq -r '.current_env')
    # Deploy to the other environment
    - if [ "$CURRENT_ENV" == "blue" ]; then DEPLOY_ENV="green"; else DEPLOY_ENV="blue"; fi
    - echo "Deploying to production ($DEPLOY_ENV environment)"
    - curl -X POST $PRODUCTION_${DEPLOY_ENV}_DEPLOY_HOOK
    # Verify deployment
    - sleep 30
    - curl -f $PRODUCTION_${DEPLOY_ENV}_URL/health || exit 1
    # Switch traffic
    - curl -X POST $PRODUCTION_SWITCH_HOOK -d "env=$DEPLOY_ENV"
    # Run health checks
    - curl -f $PRODUCTION_URL/health
  environment:
    name: production
    url: $PRODUCTION_URL
  when: manual
  only:
    - main
```

---

## 6. Canary Deployment

```yaml
# Jenkins - Canary deployment
pipeline {
  agent any

  stages {
    stage('Deploy Canary') {
      steps {
        script {
          // Deploy to 10% of servers
          sh '''
            # Deploy to subset of servers
            for server in server1 server2; do
              ssh $server "cd /var/www/app && git pull && npm ci"
            done
          '''
        }
      }
    }

    stage('Monitor Canary') {
      steps {
        timeout(time: 15, unit: 'MINUTES') {
          // Monitor for 15 minutes
          script {
            def canaryHealthy = sh(
              script: '''
                # Check error rate and response time
                ERROR_RATE=$(curl -s $METRICS_URL | jq '.error_rate')
                RESPONSE_TIME=$(curl -s $METRICS_URL | jq '.response_time')

                if (( $(echo "$ERROR_RATE < 0.01" | bc -l) )) && \
                   (( $(echo "$RESPONSE_TIME < 500" | bc -l) )); then
                  echo "Canary healthy"
                  exit 0
                else
                  echo "Canary unhealthy - Error rate: $ERROR_RATE, Response time: $RESPONSE_TIME"
                  exit 1
                fi
              ''',
              returnStatus: true
            )

            if (canaryHealthy != 0) {
              error("Canary deployment failed health checks")
            }
          }
        }
      }
    }

    stage('Full Rollout') {
      when {
        allOf {
          branch 'main'
          expression { currentBuild.resultIsBetterOrEqualTo('SUCCESS') }
        }
      }
      steps {
        script {
          // Deploy to remaining servers
          sh '''
            for server in server3 server4 server5; do
              ssh $server "cd /var/www/app && git pull && npm ci"
            done
          '''
        }
      }
    }

    stage('Rollback Canary') {
      when {
        expression { currentBuild.resultIsBetterOrEqualTo('FAILURE') }
      }
      steps {
        script {
          // Rollback canary deployment
          sh '''
            echo "Rolling back canary deployment..."
            for server in server1 server2; do
              ssh $server "cd /var/www/app && git reset --hard HEAD~1"
            done
          '''
        }
      }
    }
  }
}
```

---

## 7. Database Migration Workflows

### Safe Migrations

```yaml
# GitHub Actions - Database migrations
name: Database Migrations

on:
  push:
    branches: [main]
    paths:
      - 'migrations/**'
      - 'prisma/schema.prisma'

jobs:
  migrate-production:
    name: Migrate Production
    runs-on: ubuntu-latest
    environment: production

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run migrations with backup
        run: |
          # Create backup before migration
          DATABASE_URL=${{ secrets.PRODUCTION_DATABASE_URL }}
          BACKUP_URL=${{ secrets.BACKUP_DATABASE_URL }}

          # Backup database
          pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

          # Run migrations
          npx prisma migrate deploy

          # Verify migration
          npx prisma migrate validate

      - name: Run post-migration tests
        run: |
          # Run smoke tests to verify migration
          curl -f $PRODUCTION_URL/health
          curl -f $PRODUCTION_URL/api/status
```

---

## 8. Security Workflows

### Supply Chain Security

```yaml
# GitHub Actions - Security scan
name: Security Scan

on:
  push:
    branches: [main]
  pull_request:

jobs:
  sast:
    name: SAST Scan
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Run Semgrep
        uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            p/security-audit
            p/secrets
            p/owasp-top-ten
        env:
          SEMGREP_APP_TOKEN: ${{ secrets.SEMGREP_APP_TOKEN }}

  dependency-scan:
    name: Dependency Scan
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Run Snyk
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

  secret-scan:
    name: Secret Scan
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Run TruffleHog
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: main
          head: HEAD
          extra_args: --debug --only-verified

  container-scan:
    name: Container Scan
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    steps:
      - name: Build Docker image
        run: docker build -t myapp:${{ github.sha }} .

      - name: Run Trivy
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'myapp:${{ github.sha }}'
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
```

---

## 9. Rollback Workflows

### Automated Rollback

```yaml
# GitLab CI - Rollback workflow
stages:
  - monitor
  - rollback

monitor-rollout:
  stage: monitor
  image: alpine:latest
  script:
    - apk add --no-cache curl
    # Monitor production for 30 minutes
    - |
      for i in {1..60}; do
        ERROR_RATE=$(curl -s $PRODUCTION_METRICS_URL | jq '.error_rate')
        RESPONSE_TIME=$(curl -s $PRODUCTION_METRICS_URL | jq '.response_time')

        echo "Error rate: $ERROR_RATE, Response time: $RESPONSE_TIME"

        if (( $(echo "$ERROR_RATE > 0.05" | bc -l) )) || \
           (( $(echo "$RESPONSE_TIME > 1000" | bc -l) )); then
          echo "ALERT: High error rate or response time detected!"
          curl -X POST $ALERT_WEBHOOK -d "message=Production issues detected"
          exit 1
        fi

        sleep 30
      done
  environment:
    name: production
    url: $PRODUCTION_URL
  when: on_success
  only:
    - main

rollback:
  stage: rollback
  image: alpine:latest
  script:
    - apk add --no-cache curl git
    - echo "Rolling back to previous version..."
    - curl -X POST $ROLLBACK_WEBHOOK
  when: on_failure
  allow_failure: false
  only:
    - main
```

---

**Estado**: Workflows avanzados completados
**Matrix Builds**: Multi-version, multi-OS, multi-database testing
**Monorepo**: Lerna-based workflows, package changes detection
**Feature Branches**: Preview deployments, branch-specific logic
**Releases**: Automated releases, Docker images, version bumps
**Staging**: Blue-green deployments, canary releases
**Database**: Safe migrations, backups, rollback strategies
**Security**: SAST, dependency scanning, secret detection
**Rollback**: Automated monitoring, rollback triggers
