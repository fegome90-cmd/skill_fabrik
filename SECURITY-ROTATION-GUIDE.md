# 🔒 Security Credential Rotation Guide

**Date**: November 6, 2025
**Severity**: 🔴 CRITICAL
**Priority**: IMMEDIATE ACTION REQUIRED

---

## 📋 Executive Summary

A real staging database password was exposed in commit `9b5c974` of branch `review/repo-cleanup-and-documentation` in file `.env.testing`. This credential provides full access to the PostgreSQL staging database `surprise_metrics_staging`.

**Compromised Credential**: `surprise_user` password [REDACTED]

---

## ⚡ IMMEDIATE ACTIONS (Execute Now)

### Step 1: Rotate Password on Staging Server

```bash
# SSH into your staging server
ssh user@staging-server.example.com

# Connect to PostgreSQL as superuser
sudo -u postgres psql

# Generate a new secure password (use a password manager)
# Example secure password generation:
# openssl rand -base64 32

# Rotate the password
ALTER USER surprise_user WITH PASSWORD 'NEW_SECURE_RANDOM_PASSWORD_HERE';

# Verify the change
\du surprise_user

# Exit psql
\q
```

### Step 2: Update Application Configurations

Update the password in all services that connect to this database:

```bash
# 1. Update production/staging secrets manager
# (AWS Secrets Manager, HashiCorp Vault, etc.)

# Example for AWS Secrets Manager:
aws secretsmanager update-secret \
  --secret-id staging/postgres/surprise_user \
  --secret-string '{"username":"surprise_user","password":"NEW_PASSWORD"}'

# 2. Update environment variables in deployment
# Update your CI/CD secrets or orchestration configs
# (GitHub Secrets, GitLab CI Variables, Kubernetes Secrets, etc.)

# 3. Restart affected services
kubectl rollout restart deployment/your-app -n staging
# OR
systemctl restart your-application-service
```

### Step 3: Audit Access Logs

```bash
# On staging server, check PostgreSQL logs for suspicious activity
sudo grep 'surprise_user' /var/log/postgresql/*.log | grep -v "$(date +%Y-%m-%d)"

# Check for failed authentication attempts
sudo grep 'FATAL:  password authentication failed' /var/log/postgresql/*.log

# Check for connections from unexpected IPs
sudo grep 'surprise_user' /var/log/postgresql/*.log | grep 'connection authorized'

# Review active connections
sudo -u postgres psql -d surprise_metrics_staging -c "
  SELECT
    pid,
    usename,
    application_name,
    client_addr,
    client_port,
    backend_start,
    state,
    query
  FROM pg_stat_activity
  WHERE datname = 'surprise_metrics_staging'
  ORDER BY backend_start DESC;
"

# Check for unusual queries in the last 7 days
sudo -u postgres psql -d surprise_metrics_staging -c "
  SELECT
    query_start,
    usename,
    query,
    state
  FROM pg_stat_activity
  WHERE datname = 'surprise_metrics_staging'
    AND query_start > NOW() - INTERVAL '7 days'
  ORDER BY query_start DESC;
"
```

---

## 📅 POST-ROTATION ACTIONS (Within 24 Hours)

### Step 4: Verify No Unauthorized Access

Create an incident report if you find:
- Connections from unknown IP addresses
- Unusual queries (DROP, TRUNCATE, mass DELETE/UPDATE)
- Data exfiltration attempts (SELECT * with large result sets)
- New users or permissions created

### Step 5: Update Repository Security

```bash
# Clone the repository (if not already)
cd /path/to/skill_fabrik

# Checkout review branch
git checkout review/repo-cleanup-and-documentation

# Verify .env.testing is already removed (it should be in commit 1124496)
git log --all --full-history -- .env.testing

# If file still exists, remove it
git rm .env.testing
git commit -m "security: remove exposed credentials from .env.testing"
git push origin review/repo-cleanup-and-documentation
```

### Step 6: Clean Git History (Optional but Recommended)

The credential is in Git history. Consider using BFG Repo-Cleaner:

```bash
# CAUTION: This rewrites history - coordinate with team first
# Download BFG Repo-Cleaner
wget https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar

# Clone a fresh bare repository
git clone --mirror git@github.com:fegome90-cmd/skill_fabrik.git

# Remove the credential from all history
java -jar bfg-1.14.0.jar \
  --replace-text passwords.txt \
  skill_fabrik.git

# passwords.txt should contain:
# [REDACTED OF ACTUAL PASSWORD]

# Clean up
cd skill_fabrik.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push (COORDINATE WITH TEAM FIRST)
# git push --force
```

---

## 🛡️ PREVENTION MEASURES (This Week)

### 1. Setup Git Secrets

```bash
# Install git-secrets
# macOS:
brew install git-secrets

# Linux (Ubuntu/Debian):
sudo apt-get install git-secrets

# Initialize in repository
cd /path/to/skill_fabrik
git secrets --install

# Add patterns to detect
git secrets --add 'password.*=.*[^\[]'
git secrets --add 'secret.*=.*[^\[]'
git secrets --add 'api[_-]?key.*=.*[^\[]'
git secrets --add 'PG_PASSWORD.*=.*'
git secrets --add '[a-zA-Z0-9]{32,}'  # Catch long strings that might be keys

# Scan existing repository
git secrets --scan-history
```

### 2. Update Pre-commit Hook

```bash
# Edit .husky/pre-commit
cat >> .husky/pre-commit << 'EOF'

# Prevent .env files (except .env.example)
if git diff --cached --name-only | grep -E "^\.env\.(dev|prod|production|test|testing|staging|local)$"; then
  echo "❌ ERROR: Attempted to commit restricted .env file"
  echo "Only .env.example files are allowed"
  exit 1
fi

# Check for potential passwords in staged files
if git diff --cached | grep -i "password.*=.*[^[]"; then
  echo "⚠️  WARNING: Potential password detected in staged changes"
  echo "Please review and use environment variables instead"
  exit 1
fi
EOF

# Test the hook
git add .env.testing  # Should fail
```

### 3. Enable GitHub Secret Scanning

```bash
# Via GitHub UI:
# 1. Go to: https://github.com/fegome90-cmd/skill_fabrik/settings/security_analysis
# 2. Enable "Secret scanning"
# 3. Enable "Push protection"
# 4. Configure notifications for security team

# Via GitHub API:
curl -X PATCH \
  -H "Authorization: token YOUR_GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/fegome90-cmd/skill_fabrik \
  -d '{"security_and_analysis":{"secret_scanning":{"status":"enabled"},"secret_scanning_push_protection":{"status":"enabled"}}}'
```

### 4. Setup Secrets Manager

```bash
# Example: Migrate to AWS Secrets Manager

# 1. Create secret
aws secretsmanager create-secret \
  --name staging/postgres/credentials \
  --description "Staging PostgreSQL credentials" \
  --secret-string '{
    "username": "surprise_user",
    "password": "NEW_SECURE_PASSWORD",
    "host": "127.0.0.1",
    "port": "5433",
    "database": "surprise_metrics_staging"
  }'

# 2. Update application code to fetch from Secrets Manager
# Instead of: const password = process.env.PG_PASSWORD_DEV
# Use: const password = await fetchSecret('staging/postgres/credentials')
```

---

## 📊 Security Checklist

### Immediate (0-24 hours)
- [ ] Password rotated on staging server
- [ ] Application configurations updated
- [ ] Services restarted with new credentials
- [ ] Access logs audited for suspicious activity
- [ ] Incident report created (if unauthorized access found)
- [ ] Security team notified

### Short-term (1-7 days)
- [ ] Git secrets installed and configured
- [ ] Pre-commit hooks updated
- [ ] GitHub secret scanning enabled
- [ ] Team trained on secret management best practices
- [ ] .env.example updated with dummy values only
- [ ] Documentation updated with secrets management guidelines

### Long-term (1-4 weeks)
- [ ] Migrate to centralized secrets manager (Vault/AWS/GCP)
- [ ] Git history cleaned with BFG (coordinate with team)
- [ ] Quarterly security audit scheduled
- [ ] Automated credential rotation implemented
- [ ] Monitoring alerts configured for credential access

---

## 📞 Incident Response Contacts

If you discover unauthorized access:

1. **Immediately**: Rotate password again with a different secure password
2. **Within 1 hour**: Notify security team and DevOps lead
3. **Within 4 hours**: Review all data modifications in the last 7 days
4. **Within 24 hours**: Complete incident report with timeline
5. **Within 1 week**: Implement all prevention measures above

---

## 🔗 Related Documentation

- **Main Analysis**: `REPO-CLEANUP-ANALYSIS.md`
- **Executive Summary**: `EXECUTIVE-SUMMARY.md`
- **Security Audit**: `SECURITY-AUDIT-REPORT.md` (in `review/` branch)
- **GitHub Security Best Practices**: https://docs.github.com/en/code-security

---

## 📝 Rotation Confirmation Template

After completing the rotation, document it:

```markdown
## Security Credential Rotation - Confirmation

**Date**: [DATE]
**Rotated by**: [NAME]
**Credential**: surprise_user password for surprise_metrics_staging
**Reason**: Exposed in Git commit 9b5c974

### Actions Completed:
- [x] Password rotated on staging server
- [x] Application configurations updated (list services)
- [x] Services restarted successfully
- [x] Access logs reviewed (findings: NONE / see attached)
- [x] New password stored securely in [SECRETS MANAGER NAME]

### Access Log Review:
- Period reviewed: 2025-11-01 to 2025-11-06
- Suspicious activity: YES / NO
- Details: [DESCRIPTION]

### Next Steps:
- [ ] Schedule git-secrets installation (assigned to: [NAME])
- [ ] Update pre-commit hooks (assigned to: [NAME])
- [ ] Enable GitHub secret scanning (assigned to: [NAME])

**Status**: ✅ COMPLETE / ⚠️ PARTIAL / 🔴 ISSUES FOUND
```

---

**Generated**: November 6, 2025
**Severity**: CRITICAL
**Action Required**: IMMEDIATE
