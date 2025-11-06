# Security Testing Checklists - Listas de Verificación

## Pre-Engagement Checklist

### Authorization & Legal
- [ ] **Written authorization obtained**
  - [ ] Scope clearly defined
  - [ ] Time window established
  - [ ] Contact information provided
  - [ ] Emergency procedures documented

- [ ] **Rules of Engagement (RoE) agreed**
  - [ ] DoS testing prohibited
  - [ ] Social engineering out of scope
  - [ ] Data exfiltration limits defined
  - [ ] Production testing restrictions

- [ ] **Compliance requirements**
  - [ ] GDPR considerations
  - [ ] PCI DSS requirements
  - [ ] SOC 2 Type II controls
  - [ ] ISO 27001 controls

### Environment Setup
- [ ] **Testing environment prepared**
  - [ ] Isolated from production
  - [ ] Test data populated
  - [ ] Monitoring in place
  - [ ] Backup procedures ready

- [ ] **Tools installed and configured**
  - [ ] SAST tools configured
  - [ ] DAST tools configured
  - [ ] Dependency scanners ready
  - [ ] Network scanning tools configured

- [ ] **Credentials and access**
  - [ ] Test accounts created
  - [ ] VPN access configured
  - [ ] API keys obtained
  - [ ] Certificate management set up

---

## Information Gathering Checklist

### Passive Reconnaissance
- [ ] **Domain enumeration**
  - [ ] WHOIS data collected
  - [ ] DNS records harvested
  - [ ] Subdomains discovered
  - [ ] Historical DNS data reviewed

- [ ] **Technology fingerprinting**
  - [ ] Web server identification
  - [ ] Technology stack detected
  - [ ] Version information gathered
  - [ ] CVE database checked

- [ ] **Google dorking**
  - [ ] Sensitive directories searched
  - [ ] Configuration files found
  - [ ] Error pages indexed
  - [ ] Backup files discovered

### Active Reconnaissance
- [ ] **Port scanning**
  - [ ] TCP ports scanned
  - [ ] UDP ports scanned
  - [ ] Service versions identified
  - [ ] OS fingerprinting completed

- [ ] **Web application enumeration**
  - [ ] Directories enumerated
  - [ ] Files discovered
  - [ ] Parameters identified
  - [ ] API endpoints mapped

- [ ] **SSL/TLS analysis**
  - [ ] Certificate details reviewed
  - [ ] Cipher suites analyzed
  - [ ] Protocol versions checked
  - [ ] Security headers evaluated

---

## Authentication Testing Checklist

### Credential Management
- [ ] **Password storage**
  - [ ] Passwords hashed (not stored in plaintext)
  - [ ] Strong hashing algorithm used (bcrypt, Argon2)
  - [ ] Salt applied to passwords
  - [ ] Pepper used for additional security

- [ ] **Password policy enforcement**
  - [ ] Minimum length enforced (≥8 chars)
  - [ ] Complexity requirements active
  - [ ] Common password list checked
  - [ ] Password history maintained

- [ ] **Authentication mechanisms**
  - [ ] Multi-factor authentication (MFA) implemented
  - [ ] Rate limiting on login attempts
  - [ ] Account lockout after failed attempts
  - [ ] CAPTCHA on repeated failures

### Session Management
- [ ] **Session token generation**
  - [ ] Cryptographically secure random tokens
  - [ ] Sufficient entropy (≥128 bits)
  - [ ] Tokens not predictable
  - [ ] No sequential patterns

- [ ] **Session security**
  - [ ] Secure flag set on cookies
  - [ ] HTTPOnly flag set on cookies
  - [ ] SameSite attribute configured
  - [ ] Session fixation protection

- [ ] **Session lifecycle**
  - [ ] Session timeout configured
  - [ ] Session invalidation on logout
  - [ ] Concurrent session limits set
  - [ ] Session storage secure

### Brute Force Protection
- [ ] **Rate limiting**
  - [ ] Login attempts limited per IP
  - [ ] Login attempts limited per account
  - [ ] Exponential backoff implemented
  - [ ] CAPTCHA after threshold

- [ ] **Monitoring and alerting**
  - [ ] Failed login attempts logged
  - [ ] Threshold alerts configured
  - [ ] Automated blocking enabled
  - [ ] SIEM integration active

---

## Authorization Testing Checklist

### Access Control Models
- [ ] **Role-Based Access Control (RBAC)**
  - [ ] Roles clearly defined
  - [ ] Permissions assigned to roles
  - [ ] Users assigned to appropriate roles
  - [ ] Role hierarchy implemented

- [ ] **Attribute-Based Access Control (ABAC)**
  - [ ] Attributes defined for access decisions
  - [ ] Policy engine configured
  - [ ] Context considered (time, location)
  - [ ] Dynamic authorization working

- [ ] **Discretionary Access Control (DAC)**
  - [ ] Resource owners can grant access
  - [ ] Access rights clearly defined
  - [ ] Sharing mechanisms secure
  - [ ] Audit trail maintained

### IDOR (Insecure Direct Object Reference)
- [ ] **Parameter manipulation**
  - [ ] Numeric IDs tested
  - [ ] String IDs tested
  - [ ] GUIDs tested
  - [ ] Alternative parameters tested (user_id, uid, id)

- [ ] **Authorization checks**
  - [ ] User owns resource check
  - [ ] Role-based access check
  - [ ] Organization membership check
  - [ ] Tenant isolation verified

### Privilege Escalation
- [ ] **Horizontal escalation**
  - [ ] Same-level user access tested
  - [ ] Resource sharing tested
  - [ ] API access controls verified
  - [ ] Data isolation confirmed

- [ ] **Vertical escalation**
  - [ ] Admin functions protected
  - [ ] Elevated roles require authentication
  - [ ] Privilege escalation attempts fail
  - [ ] Sensitive operations audited

---

## Input Validation Testing Checklist

### SQL Injection (SQLi)
- [ ] **Classic SQL injection**
  - [ ] Single quote (') bypass tested
  - [ ] UNION attacks tested
  - [ ] Boolean-based blind tested
  - [ ] Time-based blind tested

- [ ] **SQL injection types**
  - [ ] Error-based injection tested
  - [ ] Union-based injection tested
  - [ ] Blind injection tested
  - [ ] Out-of-band injection tested

- [ ] **Mitigations verified**
  - [ ] Parameterized queries used
  - [ ] Stored procedures implemented
  - [ ] Input sanitization active
  - [ ] Least privilege database accounts

### NoSQL Injection
- [ ] **MongoDB injection**
  - [ ] $ne operator tested
  - [ ] $where operator tested
  - [ ] JavaScript injection tested
  - [ ] $regex injection tested

- [ ] **NoSQL-specific tests**
  - [ ] Array injection tested
  - [ ] JSON injection tested
  - [ ] Operator manipulation tested
  - [ ] Type confusion tested

### Cross-Site Scripting (XSS)
- [ ] **Reflected XSS**
  - [ ] URL parameters tested
  - [ ] POST parameters tested
  - [ ] HTTP headers tested
  - [ ] Different contexts tested (HTML, JS, URL)

- [ ] **Stored XSS**
  - [ ] Database injection tested
  - [ ] File upload tested
  - [ ] Comment system tested
  - [ ] Profile fields tested

- [ ] **DOM-based XSS**
  - [ ] Client-side JavaScript tested
  - [ ] URL fragments tested
  - [ ] DOM manipulation tested
  - [ ] InnerHTML usage tested

- [ ] **XSS Protection**
  - [ ] Content Security Policy (CSP) implemented
  - [ ] Output encoding applied
  - [ ] HttpOnly cookies used
  - [ ] X-XSS-Protection header set

### Command Injection
- [ ] **OS command injection**
  - [ ] Shell metacharacters tested
  - [ ] Command chaining tested
  - [ ] Background commands tested
  - [ ] Output redirection tested

- [ ] **Mitigations verified**
  - [ ] Input validation implemented
  - [ ] Whitelist approach used
  - [ ] Command execution sandboxed
  - [ ] No user input in commands

### File Upload Vulnerabilities
- [ ] **File type validation**
  - [ ] MIME type checked
  - [ ] File extension validated
  - [ ] Magic numbers verified
  - [ ] Double extensions blocked

- [ ] **File content validation**
  - [ ] Malware scanning active
  - [ ] File size limits enforced
  - [ ] Image validation implemented
  - [ ] PDF sanitization active

- [ ] **File storage security**
  - [ ] Files stored outside web root
  - [ ] Random filenames generated
  - [ ] Directory traversal blocked
  - [ ] Execution permissions removed

### LDAP Injection
- [ ] **LDAP query injection**
  - [ ] Special characters tested
  - [ ] Wildcard injection tested
  - [ ] Filter manipulation tested
  - [ ] Meta-characters escaped

### XML Injection
- [ ] **XML External Entity (XXE)**
  - [ ] External entity processing tested
  - [ ] Billion laughs attack tested
  - [ ] XXE blind testing completed
  - [ ] XML parser hardened

---

## Error Handling & Information Disclosure

### Error Messages
- [ ] **No sensitive data in errors**
  - [ ] Stack traces hidden
  - [ ] Database errors sanitized
  - [ ] System paths hidden
  - [ ] Internal IPs hidden

- [ ] **Consistent error responses**
  - [ ] Generic error messages
  - [ ] Same error format
  - [ ] Error codes used
  - [ ] Logging implemented

### Information Disclosure
- [ ] **Debug information**
  - [ ] Debug mode disabled
  - [ ] Verbose errors disabled
  - [ ] Development info removed
  - [ ] Test accounts removed

- [ ] **Sensitive files**
  - [ ] Backup files removed
  - [ ] Configuration files secured
  - [ ] Log files protected
  - [ ] Temporary files cleaned

---

## Business Logic Testing Checklist

### Workflow Bypass
- [ ] **Multi-step processes**
  - [ ] Step skipping tested
  - [ ] Order manipulation tested
  - [ ] State bypass tested
  - [ ] Concurrency issues tested

- [ ] **State management**
  - [ ] Session state validated
  - [ ] Token validation working
  - [ ] Nonce verification active
  - [ ] CSRF tokens validated

### Race Conditions
- [ ] **Concurrent transactions**
  - [ ] Double booking tested
  - [ ] Balance manipulation tested
  - [ ] Race window exploited
  - [ ] Transaction isolation tested

### Price Manipulation
- [ ] **Pricing logic**
  - [ ] Negative prices tested
  - [ ] Zero prices tested
  - [ ] Currency manipulation tested
  - [ ] Discount stacking tested

---

## API Security Testing Checklist

### REST API
- [ ] **Authentication**
  - [ ] API key security verified
  - [ ] Token-based auth implemented
  - [ ] OAuth flow tested
  - [ ] JWT validation checked

- [ ] **Authorization**
  - [ ] Resource-level auth tested
  - [ ] Method-level auth tested
  - [ ] API key scoping verified
  - [ ] Rate limiting implemented

- [ ] **Input validation**
  - [ ] Parameter validation active
  - [ ] Data type validation working
  - [ ] Range validation implemented
  - [ ] Format validation active

### GraphQL
- [ ] **Schema introspection**
  - [ ] Introspection enabled in production
  - [ ] Sensitive types exposed
  - [ ] Admin queries protected
  - [ ] Field-level auth tested

- [ ] **Query complexity**
  - [ ] Depth limiting implemented
  - [ ] Amount limiting set
  - [ ] Query cost analysis active
  - [ ] Timeout handling implemented

### Rate Limiting
- [ ] **API rate limiting**
  - [ ] Per-IP limits set
  - [ ] Per-user limits set
  - [ ] Per-endpoint limits set
  - [ ] Bypass methods checked

---

## Infrastructure Testing Checklist

### SSL/TLS Configuration
- [ ] **Certificate validation**
  - [ ] Certificate chain verified
  - [ ] Valid certificate dates
  - [ ] Subject Alternative Names configured
  - [ ] Certificate pinning implemented

- [ ] **Protocol configuration**
  - [ ] SSLv2 disabled
  - [ ] SSLv3 disabled
  - [ ] TLS 1.0 disabled
  - [ ] TLS 1.1 disabled
  - [ ] TLS 1.2+ enabled

- [ ] **Cipher suites**
  - [ ] Weak ciphers disabled
  - [ ] Anonymous cipher suites disabled
  - [ ] Perfect Forward Secrecy enabled
  - [ ] Strong cipher suites preferred

### HTTP Security Headers
- [ ] **Security headers present**
  - [ ] Strict-Transport-Security set
  - [ ] X-Frame-Options configured
  - [ ] X-Content-Type-Options set
  - [ ] X-XSS-Protection enabled
  - [ ] Content-Security-Policy configured
  - [ ] Referrer-Policy set

### Web Server Configuration
- [ ] **Default configurations**
  - [ ] Default pages removed
  - [ ] Directory listing disabled
  - [ ] Default credentials changed
  - [ ] Sample files removed

- [ ] **Server information**
  - [ ] Server signature removed
  - [ ] Server tokens minimized
  - [ ] Error pages customized
  - [ ] Banner grabbing prevented

---

## Mobile Security Testing Checklist

### Android
- [ ] **Application security**
  - [ ] Certificate pinning implemented
  - [ ] Root detection active
  - [ ] Debug mode disabled
  - [ ] Sensitive data encrypted

- [ ] **Data storage**
  - [ ] SharedPreferences secured
  - [ ] SQLite databases encrypted
  - [ ] Files stored securely
  - [ ] Cache cleared appropriately

- [ ] **Network security**
  - [ ] TLS validation enforced
  - [ ] Certificate pinning verified
  - [ ] HTTP traffic restricted
  - [ ] API security tested

### iOS
- [ ] **Application security**
  - [ ] App transport security configured
  - [ ] Keychain usage validated
  - [ ] Secure enclave utilized
  - [ ] Jailbreak detection active

- [ ] **Data protection**
  - [ ] Data at rest encrypted
  - [ ] Data in transit secured
  - [ ] Temporary files managed
  - [ ] Logging configured securely

---

## Cloud Security Testing Checklist

### AWS
- [ ] **IAM Configuration**
  - [ ] Least privilege enforced
  - [ ] MFA enabled for admins
  - [ ] Access keys rotated
  - [ ] Unused permissions removed

- [ ] **S3 Bucket Security**
  - [ ] Public access blocked
  - [ ] Encryption at rest enabled
  - [ ] Versioning configured
  - [ ] Lifecycle policies set

- [ ] **EC2 Security**
  - [ ] Security groups configured
  - [ ] Key pairs secured
  - [ ] VPC isolation verified
  - [ ] Patch management active

### Azure
- [ ] **Identity management**
  - [ ] Conditional access configured
  - [ ] MFA enforced
  - [ ] Privileged identity managed
  - [ ] Guest access controlled

- [ ] **Network security**
  - [ ] NSG rules configured
  - [ ] DDoS protection enabled
  - [ ] Private endpoints used
  - [ ] Traffic encrypted

### GCP
- [ ] **IAM policies**
  - [ ] Roles properly assigned
  - [ ] Service accounts secured
  - [ ] Organization policies enforced
  - [ ] Audit logging enabled

- [ ] **Data security**
  - [ ] Encryption keys managed
  - [ ] CMEK implemented
  - [ ] DLP configured
  - [ ] VPC controls verified

---

## DevSecOps Integration Checklist

### CI/CD Pipeline Security
- [ ] **Source code security**
  - [ ] SAST scanning integrated
  - [ ] Secrets scanning active
  - [ ] Dependency checking automated
  - [ ] License compliance verified

- [ ] **Build security**
  - [ ] Build environment hardened
  - [ ] Artifact signing implemented
  - [ ] SBOM generation automated
  - [ ] Supply chain security verified

- [ ] **Deployment security**
  - [ ] Infrastructure as Code (IaC) scanning
  - [ ] Container security verified
  - [ ] Runtime protection active
  - [ ] Secrets management implemented

### Monitoring & Alerting
- [ ] **Security monitoring**
  - [ ] SIEM integration complete
  - [ ] Log aggregation active
  - [ ] Real-time alerts configured
  - [ ] Threat intelligence integrated

- [ ] **Incident response**
  - [ ] Playbooks documented
  - [ ] Response team defined
  - [ ] Communication channels ready
  - [ ] Recovery procedures tested

---

## Compliance Testing Checklist

### GDPR
- [ ] **Data protection**
  - [ ] Consent mechanisms implemented
  - [ ] Data minimization enforced
  - [ ] Right to be forgotten supported
  - [ ] Data portability provided

- [ ] **Privacy by design**
  - [ ] Privacy impact assessments done
  - [ ] Data protection officer assigned
  - [ ] Breach notification process ready
  - [ ] Cross-border transfers secured

### PCI DSS
- [ ] **Payment security**
  - [ ] Cardholder data protected
  - [ ] Network security implemented
  - [ ] Vulnerability management active
  - [ ] Access controls enforced

- [ ] **Regular testing**
  - [ ] Quarterly ASV scans completed
  - [ ] Annual penetration testing done
  - [ ] Internal security scans monthly
  - [ ] Change control process followed

### SOC 2 Type II
- [ ] **Security controls**
  - [ ] Logical access controls implemented
  - [ ] System operations monitored
  - [ ] Change management documented
  - [ ] Risk assessment completed

- [ ] **Availability**
  - [ ] System capacity monitored
  - [ ] Disaster recovery planned
  - [ ] Incident response ready
  - [ ] Backup and recovery tested

---

## Vulnerability Management Checklist

### Vulnerability Discovery
- [ ] **Automated scanning**
  - [ ] SAST scans scheduled
  - [ ] DAST scans configured
  - [ ] Dependency scans active
  - [ ] Infrastructure scans running

- [ ] **Manual testing**
  - [ ] Code review completed
  - [ ] Configuration audit done
  - [ ] Penetration testing scheduled
  - [ ] Social engineering tested

### Vulnerability Triage
- [ ] **Classification**
  - [ ] CVSS score calculated
  - [ ] Exploitability assessed
  - [ ] Impact analysis completed
  - [ ] Business context considered

- [ ] **Prioritization**
  - [ ] Severity level assigned
  - [ ] Remediation SLA set
  - [ ] Resource allocation planned
  - [ ] Timeline established

### Remediation Tracking
- [ ] **Fix implementation**
  - [ ] Patch developed
  - [ ] Testing completed
  - [ ] Deployment scheduled
  - [ ] Rollback plan ready

- [ ] **Verification**
  - [ ] Fix validated
  - [ ] Re-scan performed
  - [ ] Documentation updated
  - [ ] Lessons learned captured

---

## Post-Testing Checklist

### Reporting
- [ ] **Technical report prepared**
  - [ ] Findings documented
  - [ ] Proof of concept included
  - [ ] Remediation steps detailed
  - [ ] Risk ratings assigned

- [ ] **Executive summary created**
  - [ ] Business impact explained
  - [ ] Compliance status summarized
  - [ ] Recommendations prioritized
  - [ ] Roadmap provided

### Knowledge Transfer
- [ ] **Team briefing completed**
  - [ ] Findings presented
  - [ ] Q&A session conducted
  - [ ] Documentation shared
  - [ ] Questions addressed

- [ ] **Process improvement**
  - [ ] Lessons learned documented
  - [ ] Best practices identified
  - [ ] Tool recommendations provided
  - [ ] Training needs identified

---

**Estado**: Checklist completa para security testing
**Coverage**: All OWASP Top 10, compliance frameworks, DevSecOps
**Usage**: Use for each security testing engagement
**Update**: Review y update quarterly based on new threats
