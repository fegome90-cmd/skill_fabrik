---
id: security-testing-guide
version: 0.1.0
type: guideline
summary: 'Guía completa de security testing: SAST, DAST, penetration testing, OWASP Top 10, herramientas, y metodologías. Implementa security testing integral para aplicaciones.'
audience: security-engineers, developers, qa-engineers, devops
when_to_use: 'Para testing de security en desarrollo, CI/CD, pre-production, y post-deployment. Usa en every release cycle y después de major changes.'
provides: 'Security vulnerabilities detection, compliance assurance, risk mitigation, security posture improvement, y incident prevention.'
resources:
  - resources/methodologies.md
  - resources/tools.md
  - resources/checklists.md
  - resources/reporting.md
scripts:
  - name: init-security-scan
    run: npx @secscan/cli init && npm install --save-dev @secscan/sast @secscan/dast
    note: Inicializa security scanning en proyecto
  - name: run-sast-scan
    run: npx @secscan/sast --source ./src --output sarif
    note: Ejecuta SAST scan (Static Analysis Security Testing)
  - name: run-dast-scan
    run: npx @secscan/dast --target https://localhost:3000 --output report.html
    note: Ejecuta DAST scan (Dynamic Analysis Security Testing)
  - name: generate-report
    run: npx security-report-gen --input security-results.json --format html,pdf
    note: Genera security testing report
limits: 'Requiere security expertise. Puede generar false positives. Time-consuming process. Algunas herramientas son de pago.'
---

## Objetivo

Establecer un **programa integral de security testing** para detectar y mitigar vulnerabilidades a través de múltiples metodologías y herramientas.

**Cuándo usar**:
- Cada PR que modify authentication, authorization, o data handling
- Antes de cada production deployment
- Después de major architectural changes
- Quarterly security audits
- Post-incident security validation

**Cuándo NO usar**: Para internal tools de bajo riesgo, prototypes sin real data, o experiments temporales.

**Qué problema resuelve**: Security breaches, data leaks, compliance violations, reputation damage, y financial losses.

## Security Testing Pyramid

### SAST (Static Application Security Testing)
- **Qué**: Analysis del source code sin ejecutar
- **Cuándo**: Durante development, PR review, CI pipeline
- **Ventajas**: Early detection, no runtime needed
- **Limitaciones**: False positives, no runtime context

### DAST (Dynamic Application Security Testing)
- **Qué**: Testing de running application
- **Cuándo**: Staging, pre-production, runtime analysis
- **Ventajas**: Real context, actual behavior
- **Limitaciones**: Late detection, requiere infrastructure

### IAST (Interactive Application Security Testing)
- **Qué**: Hybrid approach, instrumentación en runtime
- **Cuándo**: Integration testing, staging
- **Ventajas**: Best of both SAST y DAST
- **Limitaciones**: Performance overhead

### Penetration Testing
- **Qué**: Manual testing por security experts
- **Cuándo**: Major releases, annual audits
- **Ventajas**: Deep analysis, creative attack vectors
- **Limitaciones**: Expensive, time-consuming

## OWASP Top 10 (2021)

### A01: Broken Access Control
- **Riesgo**: Unauthorized access, privilege escalation
- **Testing**: Role-based access, IDOR checks, privilege testing
- **Fix**: Proper authorization checks, deny-by-default

### A02: Cryptographic Failures
- **Riesgo**: Data exposure, man-in-the-middle
- **Testing**: TLS/SSL configuration, encryption at rest
- **Fix**: Strong cryptography, proper key management

### A03: Injection
- **Riesgo**: SQL, NoSQL, OS command injection
- **Testing**: Input validation, parameterized queries
- **Fix**: Input sanitization, ORM usage

### A04: Insecure Design
- **Riesgo**: Architectural weaknesses
- **Testing**: Threat modeling, design review
- **Fix**: Security by design, threat modeling

### A05: Security Misconfiguration
- **Riesgo**: Default credentials, open ports
- **Testing**: Configuration audit, penetration testing
- **Fix**: Hardening, least privilege, security baselines

### A06: Vulnerable Components
- **Riesgo**: Known CVEs, unpatched dependencies
- **Testing**: Dependency scanning, version audit
- **Fix**: Regular updates, dependency management

### A07: Identification and Authentication Failures
- **Riesgo**: Weak authentication, session management
- **Testing**: Brute force protection, MFA testing
- **Fix**: Strong auth, secure session handling

### A08: Software and Data Integrity Failures
- **Riesgo**: Supply chain attacks, tampered updates
- **Testing**: Supply chain security, integrity checks
- **Fix**: Code signing, verified dependencies

### A09: Security Logging and Monitoring Failures
- **Riesgo**: Undetected attacks, delayed response
- **Testing**: Log coverage, alerting, monitoring
- **Fix**: Comprehensive logging, SIEM integration

### A10: Server-Side Request Forgery (SSRF)
- **Riesgo**: Internal network access, data exfiltration
- **Testing**: URL validation, SSRF scenarios
- **Fix**: Input validation, network segmentation

## Security Testing Methodologies

### NIST Cybersecurity Framework
1. **Identify** - Asset inventory, risk assessment
2. **Protect** - Access controls, data security
3. **Detect** - Anomaly detection, monitoring
4. **Respond** - Incident response procedures
5. **Recover** - Recovery planning, improvements

### OWASP Testing Guide
- **Information Gathering** - Reconnaissance
- **Configuration Management** - Infrastructure testing
- **Authentication** - Auth mechanisms testing
- **Session Management** - Session handling
- **Authorization** - Access control testing
- **Data Validation** - Input validation
- **Denial of Service** - DoS resilience
- **Web Services** - API security testing
- **AJAX** - Client-side security

### PTES (Penetration Testing Execution Standard)
1. **Pre-engagement** - Scoping, rules of engagement
2. **Intelligence Gathering** - OSINT, target mapping
3. **Threat Modeling** - Attack scenarios
4. **Vulnerability Analysis** - Automated y manual testing
5. **Exploitation** - Proof of concept
6. **Post-Exploitation** - Impact assessment
7. **Reporting** - Documentation y recommendations

## Security Testing en CI/CD

### Pre-commit Hooks
```bash
# .git-hooks/pre-commit
# Secret detection
trufflehog git file . --json 2>/dev/null || exit 0

# Dependency scanning
npm audit --audit-level=moderate || exit 1

# Basic SAST
semgrep --config=auto src/ || exit 1
```

### GitHub Actions Workflow
```yaml
name: Security Testing

on: [push, pull_request]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run SAST
        uses: securecodewarrior/github-action-add-sarif@v1
        with:
          sarif-file: 'security-results.sarif'

      - name: Dependency Scan
        uses: actions/dependency-review-action@v3
        with:
          fail-on-severity: moderate

      - name: Secret Scan
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: main
          head: HEAD
```

## Security Test Planning

### Test Scope Definition
1. **Assets to Test**
   - Web applications
   - APIs (REST, GraphQL)
   - Mobile applications
   - Infrastructure
   - Third-party integrations

2. **Testing Environment**
   - Development
   - Staging
   - Production (read-only)
   - Separate test environments

3. **Test Types**
   - Automated scanning
   - Manual testing
   - Code review
   - Configuration audit

4. **Testing Schedule**
   - Continuous (automated)
   - Weekly (comprehensive scans)
   - Monthly (manual testing)
   - Quarterly (penetration testing)

### Risk Assessment Matrix

| Impact  | Probability | Priority | Testing Depth |
|---------|-------------|----------|---------------|
| Critical | High        | P0       | Full          |
| Critical | Medium      | P1       | Comprehensive |
| High     | High        | P1       | Comprehensive |
| High     | Medium      | P2       | Standard      |
| Medium   | High        | P2       | Standard      |
| Medium   | Medium      | P3       | Basic         |
| Low      | Any         | P3       | Basic         |

## Vulnerability Management

### Severity Levels

#### Critical (CVSS 9.0-10.0)
- **Response Time**: Immediate (<4 hours)
- **Examples**: SQL injection, remote code execution
- **Action**: Hotfix, emergency patch

#### High (CVSS 7.0-8.9)
- **Response Time**: 24 hours
- **Examples**: XSS, authentication bypass
- **Action**: Urgent fix, accelerated release

#### Medium (CVSS 4.0-6.9)
- **Response Time**: 1 week
- **Examples**: CSRF, weak crypto
- **Action**: Scheduled fix, next release

#### Low (CVSS 0.1-3.9)
- **Response Time**: 1 month
- **Examples**: Information disclosure
- **Action**: Backlog, regular sprint

### Vulnerability Lifecycle
1. **Discovery** - Automated scan o manual testing
2. **Triage** - Verify, classify, prioritize
3. **Assignment** - Assign to developer/team
4. **Remediation** - Fix implementation
5. **Verification** - Re-test vulnerability
6. **Closure** - Document fix, close ticket
7. **Post-mortem** - Learn, improve process

## Compliance y Standards

### SOC 2 Type II
- **Security** - Access controls, encryption
- **Availability** - Uptime, disaster recovery
- **Processing Integrity** - Data accuracy
- **Confidentiality** - Data protection
- **Privacy** - Personal data handling

### ISO 27001
- **Information Security Management**
- **Risk Assessment**
- **Security Controls**
- **Continuous Improvement**

### PCI DSS
- **Payment Card Industry Data Security Standard**
- **Credit card data protection**
- **Network security**
- **Access control**
- **Regular testing**

## Security Testing Tools

### SAST Tools
- **SonarQube** - Multi-language code analysis
- **Checkmarx** - Enterprise SAST
- **Veracode** - Cloud-based SAST
- **Semgrep** - Lightweight static analysis
- **CodeQL** - Semantic code analysis

### DAST Tools
- **OWASP ZAP** - Open source web app scanner
- **Burp Suite** - Web app testing platform
- **Acunetix** - Automated vulnerability scanner
- **Nessus** - Network vulnerability scanner

### IAST Tools
- **Contrast Security** - Runtime analysis
- **Seeker** - Interactive testing
- **Synopsys IAST** - Code to runtime visibility

### Dependency Scanners
- **npm audit** - Node.js security audit
- **Snyk** - Vulnerability scanner
- **WhiteSource** - Open source security
- **Dependabot** - Automated dependency updates

## Security Test Execution

### Automated Scanning
```bash
# Run comprehensive security scan
npx security-scanner --type all --format json --output results.json

# SAST scan
npx semgrep --config=auto --json --output=sast-results.json src/

# DAST scan
npx zap-baseline.py -t https://localhost:3000 -J dast-results.json

# Dependency scan
npm audit --json > dependency-results.json
```

### Manual Testing
- **Authentication testing**
  - Brute force protection
  - Multi-factor authentication
  - Password policies
  - Session management

- **Authorization testing**
  - Role-based access control (RBAC)
  - Direct object references (IDOR)
  - Privilege escalation
  - Business logic flaws

- **Input validation testing**
  - SQL injection
  - NoSQL injection
  - XSS (reflected, stored, DOM-based)
  - Command injection
  - File upload vulnerabilities

### Configuration Review
- **Security headers** - CSP, HSTS, X-Frame-Options
- **TLS/SSL configuration** - Cipher suites, protocols
- **Default credentials** - Admin panels, databases
- **Error handling** - Information disclosure
- **Debug mode** - Development features disabled

## False Positives Management

### Identification
- **Context analysis** - Business logic understanding
- **Exploitability assessment** - Real attack potential
- **Environment validation** - Test vs production differences
- **Version checking** - Vulnerability applicability

### Handling
1. **Document rationale** - Why it's a false positive
2. **Add to allowlist** - Mark for future scans
3. **Suppress with comments** - Code-level annotation
4. **Update tool configuration** - Tune for project

### Best Practices
- Don't suppress without investigation
- Review suppressed findings quarterly
- Keep suppression list documented
- Explain business justification

## Security Metrics

### Coverage Metrics
- **Code coverage** - % of code tested
- **API coverage** - % of endpoints tested
- **Dependency coverage** - % of dependencies scanned
- **Infrastructure coverage** - % of assets tested

### Quality Metrics
- **Vulnerability density** - Vulnerabilities per KLOC
- **Mean time to detect (MTTD)**
- **Mean time to fix (MTTR)**
- **False positive rate**
- **Regressions** - Returning vulnerabilities

### Trend Metrics
- **Vulnerability trend** - Over time
- **Severity distribution** - Critical/High/Medium/Low
- **Remediation velocity** - Fix rate
