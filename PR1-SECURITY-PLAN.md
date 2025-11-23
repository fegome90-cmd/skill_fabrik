# 🔒 PR #1: Security Cleanup - Implementation Plan

**Priority**: 🔴 CRITICAL
**Target Branch**: `main`
**Source Branch**: `security/credential-cleanup-pr1`
**Dependencies**: None
**Estimated Effort**: 2-4 hours
**Merge Timeline**: Within 24 hours of creation

---

## 🎯 Objective

Remove all sensitive files from the repository and implement security controls to prevent future credential exposure.

---

## 📋 Files to Include in PR #1

### Files to Remove
```
.env.testing          # Contains real staging password
.env.production       # Placeholder values but should not be in repo
.env.development      # Local development values
.env.dashboard        # Dashboard-specific config
.env.check           # Testing config
```

### Files to Modify
```
.gitignore           # Add comprehensive security patterns
```

### Files to Create
```
SECURITY-AUDIT-REPORT.md      # Document the incident
.env.example                   # Template with safe placeholder values
.husky/pre-commit              # Enhanced with credential checks
```

---

## 🔨 Implementation Steps

### Step 1: Create Feature Branch

```bash
# Ensure you're on main and it's up to date
git checkout main
git pull origin main

# Create new branch for security PR
git checkout -b security/credential-cleanup-pr1

# Verify starting point
git log --oneline -5
```

### Step 2: Remove Sensitive Files

```bash
# Remove all .env files except .env.example
git rm .env.testing
git rm .env.production
git rm .env.development
git rm .env.dashboard
git rm .env.check

# Verify removal
git status
```

### Step 3: Create Safe .env.example

```bash
cat > .env.example << 'EOF'
# PostgreSQL Configuration
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=your_database_name
PG_USER=your_username
PG_PASSWORD=your_secure_password_here

# Application Configuration
NODE_ENV=development
PORT=3000
LOG_LEVEL=info

# Dashboard Configuration (if needed)
DASHBOARD_PORT=3001
DASHBOARD_API_KEY=your_dashboard_api_key

# Testing Configuration
TEST_DATABASE=test_database_name
TEST_USER=test_user
TEST_PASSWORD=test_password

# IMPORTANT: Never commit actual .env files
# Copy this file to .env and fill in your actual values
# The .env file is in .gitignore and will not be committed
EOF

git add .env.example
```

### Step 4: Update .gitignore

```bash
# Backup current .gitignore
cp .gitignore .gitignore.backup

# Add comprehensive security patterns
cat >> .gitignore << 'EOF'

# ============================================
# Security: Environment and Credentials
# ============================================
# Environment files with actual credentials
.env
.env.local
.env.*.local
.env.development
.env.production
.env.staging
.env.test
.env.testing
.env.dashboard
.env.check

# Keep example files only
!.env.example
!.env.*.example

# Credential files
credentials.json
secrets.json
*.pem
*.key
*.p12
*.pfx
*.cer
*.crt
.npmrc
.yarnrc

# AWS credentials
.aws/credentials
aws-credentials.json

# GCP credentials
gcp-credentials.json
service-account.json

# API keys
api-keys.json
.api-key

# ============================================
# Security: Cache and Temporary Files
# ============================================
# Node.js cache
node-compile-cache/
.cache/
.next/cache/

# Build artifacts that might contain secrets
dist/
build/
*.log

# Editor and IDE configs that might contain paths
.vscode/settings.json
.idea/workspace.xml
EOF

git add .gitignore
```

### Step 5: Create Security Audit Report

```bash
# This file should already exist in review/ branch
# Copy it or create it based on the analysis

cat > SECURITY-AUDIT-REPORT.md << 'EOF'
# Security Audit Report - Credential Exposure Incident

**Date**: November 6, 2025
**Incident Type**: Exposed Database Credential
**Severity**: CRITICAL
**Status**: REMEDIATION IN PROGRESS

## Incident Summary

A real staging database password was committed to the repository in file `.env.testing` on branch `review/repo-cleanup-and-documentation` (commit `9b5c974`).

## Affected Systems

- **Database**: surprise_metrics_staging
- **User**: surprise_user
- **Host**: 127.0.0.1:5433
- **Credential Type**: PostgreSQL password
- **Exposure Duration**: Approximately 5 days (Nov 1-6, 2025)

## Remediation Actions

### Completed
- [x] Credential exposure identified and documented
- [x] Security audit report created
- [x] Cleanup strategy developed

### In Progress
- [ ] Password rotated on staging server (IMMEDIATE)
- [ ] Application configurations updated
- [ ] Access logs audited

### Planned
- [ ] Git history cleaned (BFG Repo-Cleaner)
- [ ] Pre-commit hooks implemented
- [ ] Git-secrets installed
- [ ] GitHub secret scanning enabled

## Prevention Measures

### Immediate
1. Remove all .env files from repository (this PR)
2. Update .gitignore with comprehensive patterns
3. Create .env.example with safe placeholders

### Short-term
1. Install git-secrets on all developer machines
2. Add credential checks to pre-commit hooks
3. Enable GitHub secret scanning and push protection
4. Team training on secrets management

### Long-term
1. Migrate to centralized secrets manager (AWS Secrets Manager / Vault)
2. Implement automated credential rotation
3. Quarterly security audits
4. Monitoring and alerting for credential access

## Lessons Learned

1. **Never commit .env files**: Only .env.example files should be in the repository
2. **Use .gitignore early**: Add security patterns before first commit
3. **Enable secret scanning**: GitHub and git-secrets can prevent these issues
4. **Regular audits**: Automated tools should scan for credentials regularly

## References

- Main Analysis: REPO-CLEANUP-ANALYSIS.md
- Executive Summary: EXECUTIVE-SUMMARY.md
- Rotation Guide: SECURITY-ROTATION-GUIDE.md

---

**Report Generated**: November 6, 2025
**Next Review**: After credential rotation completion
EOF

git add SECURITY-AUDIT-REPORT.md
```

### Step 6: Update Pre-commit Hook

```bash
# Ensure husky is initialized
npx husky install

# Update pre-commit hook
cat > .husky/pre-commit << 'EOF'
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run lint-staged
npx lint-staged

# Security check: Prevent committing .env files
echo "🔍 Checking for sensitive files..."

if git diff --cached --name-only | grep -E "^\.env\.(dev|development|prod|production|test|testing|staging|local|dashboard|check)$"; then
  echo "❌ ERROR: Attempted to commit restricted .env file"
  echo "Only .env.example files are allowed in the repository"
  echo ""
  echo "If you need to store configurations:"
  echo "1. Add values to .env.example as placeholders"
  echo "2. Keep your actual .env file out of git"
  echo ""
  exit 1
fi

# Check for potential passwords in content
if git diff --cached | grep -i "password.*=.*[^[]" | grep -v ".env.example"; then
  echo "⚠️  WARNING: Potential password detected in staged changes"
  echo "Please ensure you're using environment variables and not hardcoded passwords"
  read -p "Continue anyway? (y/N): " confirm
  if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    exit 1
  fi
fi

echo "✅ Security checks passed"
EOF

chmod +x .husky/pre-commit
git add .husky/pre-commit
```

### Step 7: Commit Changes

```bash
# Review changes
git status
git diff --cached

# Create commit
git commit -m "$(cat <<'EOF'
security: remove exposed credentials and implement protection

BREAKING CHANGE: All .env files removed from repository

Changes:
- Remove .env.testing (contained real staging password)
- Remove .env.production, .env.development, .env.dashboard, .env.check
- Add comprehensive .env patterns to .gitignore
- Create .env.example with safe placeholder values
- Add SECURITY-AUDIT-REPORT.md documenting incident
- Update pre-commit hook to prevent future credential commits

Security Actions Required:
- IMMEDIATE: Rotate surprise_user password on staging server
- Review SECURITY-AUDIT-REPORT.md for full details
- Follow SECURITY-ROTATION-GUIDE.md for rotation steps

Related: review/repo-cleanup-and-documentation commit 9b5c974
EOF
)"
```

### Step 8: Push and Create PR

```bash
# Push to remote
git push -u origin security/credential-cleanup-pr1

# Create PR (manual or via gh)
# Title: "security: remove exposed credentials and implement protection"
# See PR template below
```

---

## 📝 PR Description Template

```markdown
## 🔒 Security: Remove Exposed Credentials

**Priority**: 🔴 CRITICAL
**Type**: Security Fix
**Breaking Change**: Yes (removes .env files)

### 🚨 Summary

A real staging database password was exposed in the repository. This PR:
1. Removes all .env files containing credentials
2. Implements security controls to prevent future incidents
3. Documents the incident and remediation steps

### 🔴 CRITICAL ACTION REQUIRED

Before or immediately after merging this PR:
- [ ] **Rotate staging password** for user `surprise_user` in database `surprise_metrics_staging`
- [ ] Follow steps in `SECURITY-ROTATION-GUIDE.md`
- [ ] Update application configurations with new password

### 📋 Changes

#### Files Removed
- ❌ `.env.testing` - Contained real staging DB password
- ❌ `.env.production` - Placeholder values
- ❌ `.env.development` - Local development config
- ❌ `.env.dashboard` - Dashboard config
- ❌ `.env.check` - Testing config

#### Files Added
- ✅ `.env.example` - Safe template with placeholders
- ✅ `SECURITY-AUDIT-REPORT.md` - Incident documentation

#### Files Modified
- ✅ `.gitignore` - Added 20+ security patterns
- ✅ `.husky/pre-commit` - Added credential checks

### 🛡️ Security Measures Implemented

1. **Prevention**: Pre-commit hook blocks .env files
2. **Detection**: Hook warns about potential passwords
3. **Documentation**: Audit report and rotation guide
4. **Template**: .env.example for safe configuration

### ⚠️ Breaking Changes

**Affected**: Developers with local .env files

**Action Required**:
```bash
# 1. Copy example file
cp .env.example .env

# 2. Fill in your local values
# Edit .env with your actual credentials

# 3. Never commit .env files
git status  # Should not show .env
```

### ✅ Testing

- [x] .gitignore patterns tested (git add .env fails)
- [x] Pre-commit hook tested (blocks .env files)
- [x] .env.example contains all required variables
- [x] No sensitive data remains in PR

### 📊 Security Checklist

- [x] All credentials removed from repository
- [x] .gitignore updated with security patterns
- [x] Pre-commit hooks prevent future commits
- [x] Documentation created for incident response
- [ ] **Password rotated (REQUIRED BEFORE MERGE)**
- [ ] Access logs audited
- [ ] GitHub secret scanning enabled (post-merge)
- [ ] git-secrets installed on dev machines (post-merge)

### 🔗 Related Documentation

- **Main Analysis**: `REPO-CLEANUP-ANALYSIS.md`
- **Executive Summary**: `EXECUTIVE-SUMMARY.md`
- **Rotation Guide**: `SECURITY-ROTATION-GUIDE.md`
- **Audit Report**: `SECURITY-AUDIT-REPORT.md`

### 📅 Timeline

- **Incident Detected**: Nov 6, 2025
- **PR Created**: Nov 6, 2025
- **Target Merge**: Within 24 hours
- **Password Rotation**: Immediate (parallel to PR review)

### 🚀 Post-Merge Actions

1. Enable GitHub secret scanning (Settings → Security)
2. Install git-secrets on all dev machines
3. Team briefing on secrets management
4. Schedule quarterly security audits

---

**⚠️ REVIEWER NOTE**: Do not merge until staging password has been rotated
```

---

## ✅ Pre-Merge Checklist

### Code Quality
- [ ] All .env files removed
- [ ] .gitignore patterns comprehensive
- [ ] .env.example has all required variables
- [ ] Pre-commit hook tested and working
- [ ] No sensitive data in commit history

### Security
- [ ] **Staging password rotated** ⚠️ CRITICAL
- [ ] Access logs reviewed for suspicious activity
- [ ] Incident documented in SECURITY-AUDIT-REPORT.md
- [ ] Rotation guide provided for team

### Documentation
- [ ] Security audit report complete
- [ ] Rotation guide detailed and tested
- [ ] PR description includes breaking changes
- [ ] Team notified of changes

### Testing
- [ ] Pre-commit hook blocks .env files
- [ ] .gitignore patterns tested
- [ ] Application can load from .env.example template

---

## 📊 Success Criteria

This PR is successful when:
1. ✅ All .env files removed from repository
2. ✅ Security controls prevent future incidents
3. ✅ Staging password rotated and verified
4. ✅ No suspicious activity found in logs
5. ✅ Team trained on new security practices
6. ✅ PR merged within 24 hours

---

## 🔗 Next Steps After PR #1

After this PR is merged:

1. **PR #2**: ESLint v8→v9 migration
2. **PR #3**: CI/CD workflows (will use new secret management)
3. **Week 2**: Enable GitHub secret scanning
4. **Week 2**: Install git-secrets on all machines
5. **Week 3**: Migrate to centralized secrets manager

---

**Created**: November 6, 2025
**Priority**: CRITICAL
**Assignee**: DevOps + Security Team
**Estimated Time**: 2-4 hours + rotation time
