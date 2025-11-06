# Code Review Process - Proceso Paso a Paso

## Proceso Completo de Code Review

### Fase 1: Preparación (Author)

#### Step 1.1: Crear Feature Branch
```bash
# Crear y cambiar a nuevo branch
git checkout -b feature/user-authentication

# Development work...

# Commit changes
git add .
git commit -m "feat: implement user authentication

- Add login/logout functionality
- Implement JWT token management
- Add session management
- Update user model
- Add authentication middleware"
```

#### Step 1.2: Self-Review Pre-PR
- [ ] **Run tests locally**
  ```bash
  npm test                    # Unit tests
  npm run test:integration    # Integration tests
  npm run test:e2e           # E2E tests
  ```

- [ ] **Check code quality**
  ```bash
  npm run lint               # ESLint
  npm run format             # Prettier
  npm run type-check         # TypeScript
  npm run audit              # Security audit
  ```

- [ ] **Verify changes**
  ```bash
  git diff --stat           # Changed files summary
  git diff HEAD~1          # Detailed changes
  ```

#### Step 1.3: Crear Pull Request

**PR Template:**
```markdown
## What
Implement user authentication system with JWT tokens

## Why
User authentication is required for the new dashboard feature. Users need secure login/logout functionality.

## How
- Added JWT token generation and validation
- Implemented login/logout API endpoints
- Added middleware for authentication checks
- Updated database schema for user sessions
- Added password hashing with bcrypt

## Screenshots
[Attach UI screenshots if applicable]

## Testing
- [x] Unit tests added (8 new tests)
- [x] Integration tests added (3 test suites)
- [x] Manual testing completed
- [x] Security review completed

## Checklist
- [x] Self-reviewed code
- [x] Code follows style guidelines
- [x] Comments added for complex logic
- [x] Documentation updated
- [x] No breaking changes (minor version)
```

#### Step 1.4: Assign Reviewers
- **Code owners** - Auto-assigned based on changed files
- **Domain expert** - Select based on feature area
- **Senior developer** - For architecture/patterns review
- **QA engineer** - For testing coverage review

### Fase 2: Review Inicial (Reviewer)

#### Step 2.1: Review Assignment Notification
```
Hi [Author],

I've been assigned to review your PR #123: User Authentication

I'll review it within 24 hours. Please let me know if this is urgent.

Best,
[Reviewer]
```

#### Step 2.2: First Pass - Overview
**Tiempo estimado: 5-10 minutos**

1. **Read PR description**
   - Understand what the PR does
   - Check if description is clear
   - Verify screenshots/diagrams present

2. **Check PR size**
   - Lines changed: Ideal <400
   - Files changed: Ideal <10
   - **If PR is too large, request splitting**

3. **Run automated checks**
   - CI status: All tests passing
   - Linters: No errors
   - Security scan: No critical issues
   - Coverage: Meets threshold (≥80%)

4. **Quick scan of changes**
   ```bash
   # In GitHub UI or CLI
   git fetch origin
   git checkout feature/user-authentication
   git diff --stat main
   ```

#### Step 2.3: Second Pass - Deep Review
**Tiempo estimado: 30-60 minutos**

**Review Order:**
1. Architecture/Design
2. Logic/Correctness
3. Performance
4. Security
5. Testing
6. Code Style

**Use the Checklist** (`resources/checklist.md`)

#### Step 2.4: Leave Comments

**Comment Types:**

✅ **Approve** (No changes needed)
```markdown
Looks good! Clean implementation and good test coverage.

Nit: Consider using `userId` instead of `user_id` for consistency with other endpoints.
```

🔄 **Comment** (Changes requested, but not blocking)
```markdown
**Issue:** Line 45 - No validation for empty password

**Why:** Empty password would pass through and cause a 500 error

**Suggestion:** Add validation:
```javascript
if (!password || password.trim() === '') {
  throw new ValidationError('Password is required');
}
```

**Priority:** Important (3-5 minutes fix)
```

❌ **Request Changes** (Blocking, must fix)
```markdown
**Issue:** Line 67 - SQL Injection vulnerability

**Why:** Using template literals with user input allows SQL injection attack

**Current code:**
```javascript
const query = `SELECT * FROM users WHERE email = '${email}'`;
```

**Suggestion:** Use parameterized queries:
```javascript
const query = 'SELECT * FROM users WHERE email = $1';
const result = await db.query(query, [email]);
```

**Priority:** Critical - This is a security vulnerability that must be fixed before merge.
```

### Fase 3: Discusión y Resolución (Author & Reviewer)

#### Step 3.1: Author Responds to Feedback
**Timeline: Within 24 hours**

**Response patterns:**

**If you agree:**
```markdown
Thanks for catching this! Fixed in commit abc1234.

Added input validation and parameterized query as suggested.
```

**If you disagree (politely):**
```markdown
I understand your concern. Here's why I chose this approach:

[Explanation with reasoning]

However, I can see the benefit of your suggestion. If we [alternative approach], it would [benefits].

Would you be open to implementing this in a follow-up PR since this would be a larger architectural change?
```

**If you need clarification:**
```markdown
Could you clarify what you mean by "inconsistent with patterns"?

Looking at other authentication files, I see:
- File A uses approach X
- File B uses approach Y

Which pattern would you prefer I follow?
```

#### Step 3.2: Implement Changes
```bash
# Make the requested changes
git checkout feature/user-authentication
git pull origin main  # Keep branch up to date

# Make changes
vim src/auth.js

# Commit changes
git add .
git commit -m "fix: address review feedback

- Add password validation
- Use parameterized queries
- Update error messages"

# Push changes
git push origin feature/user-authentication
```

#### Step 3.3: Re-request Review
```markdown
## Updates

Addressed all review comments:
✅ Added password validation (line 45)
✅ Fixed SQL injection vulnerability (line 67)
✅ Updated variable naming (line 89)
✅ Added error handling (line 123)

Ready for re-review.
```

### Fase 4: Final Approval y Merge

#### Step 4.1: Final Review (Reviewer)
**Review the changes made:**

1. **Check diff of changes**
   ```bash
   # See only the new changes
   git diff main...HEAD -- src/auth.js
   ```

2. **Verify all comments addressed**
   - [ ] All critical issues fixed
   - [ ] Important issues addressed or agreed upon
   - [ ] Suggestions considered

3. **Run tests on updated code**
   - [ ] All tests still passing
   - [ ] No new regressions

#### Step 4.2: Approve PR
```markdown
## Approval

Thanks for addressing the feedback quickly!

**Status:** ✅ Approved

**Summary:**
- All critical issues resolved
- Good test coverage maintained
- Code follows patterns
- Security concerns addressed

**Ready to merge.**
```

#### Step 4.3: Merge PR
**Author or Maintainer merges:**

```bash
# Option 1: Merge commit (preserves history)
git checkout main
git pull origin main
git merge feature/user-authentication
git push origin main

# Option 2: Squash and merge (clean history) - PREFERRED
# Use GitHub UI "Squash and merge" button
```

**Post-merge:**
- [ ] Delete feature branch
- [ ] Update related documentation
- [ ] Add changelog entry
- [ ] Close related issues

### Fase 5: Post-Review

#### Step 5.1: Learning and Improvement
**For Author:**
- [ ] Review all feedback received
- [ ] Identify patterns in feedback
- [ ] Improve for next PR

**For Reviewer:**
- [ ] Log time spent reviewing
- [ ] Note interesting patterns found
- [ ] Share learnings with team

#### Step 5.2: Metrics Tracking
```bash
# Calculate review metrics
REVIEW_TIME=$((END_TIME - START_TIME))
COMMENTS_COUNT=$(git log --oneline PR_123 | wc -l)
REVIEW_ROUNDS=$(git log --oneline --grep="review" | wc -l)

echo "PR #123 Metrics:"
echo "- Review time: ${REVIEW_TIME}h"
echo "- Review rounds: ${REVIEW_ROUNDS}"
echo "- Status: Merged ✓"
```

---

## Proceso Acelerado (Small Changes)

Para cambios menores (<100 líneas, 1-2 archivos):

### Quick Review Process
1. **Author self-review** (5 min)
2. **Automated checks** - All green
3. **Reviewer deep dive** (10-15 min)
4. **One round of feedback** max
5. **Merge** - Same day if possible

### Criteria para Quick Review:
- [ ] Bug fix (not feature)
- [ ] Documentation update
- [ ] Small refactor
- [ ] Test addition
- [ ] Configuration change

---

## Proceso Extenso (Large Changes)

Para cambios mayores (>400 líneas, 5+ archivos):

### Staged Review Process

#### Stage 1: Architecture Review (1-2 days)
- **Reviewer**: Tech Lead / Senior Dev
- **Focus**: High-level design, patterns, architecture
- **Output**: Architecture approved or changes requested

#### Stage 2: Implementation Review (2-3 days)
- **Reviewer**: Team members
- **Focus**: Code quality, logic, testing
- **Output**: Implementation approved or changes requested

#### Stage 3: Final Review (1 day)
- **Reviewer**: All stakeholders
- **Focus**: Final check, integration
- **Output**: Ready to merge

### Large PR Guidelines:
- [ ] Split into smaller PRs where possible
- [ ] Provide detailed documentation
- [ ] Include diagrams for architecture
- [ ] Schedule design review meeting
- [ ] Plan extra time for review

---

## Review Templates

### Initial Review Assignment
```
Subject: Review Requested - PR #[NUMBER]: [TITLE]

Hi [REVIEWER],

Could you please review PR #[NUMBER]?

**What**: [Brief description]
**Why**: [Business justification]
**When**: [Target merge date]
**Reviewers**: [List]

**Link**: [PR URL]

Thanks!
```

### Review Completion
```
Subject: Review Complete - PR #[NUMBER]

Hi [AUTHOR],

I've completed my review of PR #[NUMBER].

**Status**: [APPROVED / CHANGES REQUESTED / BLOCKED]

**Summary**:
- [Key points from review]
- [Outstanding items if any]

**Next Steps**:
- [Actions required]
- [Timeline]

Thanks for your work!
```

---

**Estado**: Proceso documentado y validado
**Usage**: Seguir para cada code review
**Duration**: Typical PR: 1-2 days
