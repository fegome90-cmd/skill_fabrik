# Security Testing Tools - Configuración y Uso

## SAST (Static Application Security Testing)

### SonarQube

#### Installation & Setup
```bash
# Docker installation
docker run -d --name sonarqube \
  -p 9000:9000 \
  -v sonarqube_data:/opt/sonarqube/data \
  -v sonarqube_extensions:/opt/sonarqube/extensions \
  sonarqube:8.9-community

# Or using docker-compose
cat > docker-compose.yml << 'EOF'
version: '3'
services:
  sonarqube:
    image: sonarqube:8.9-community
    ports:
      - "9000:9000"
    environment:
      - SONAR_ES_BOOTSTRAP_CHECKS_DISABLE=true
    volumes:
      - sonarqube_data:/opt/sonarqube/data
      - sonarqube_extensions:/opt/sonarqube/extensions
volumes:
  sonarqube_data:
  sonarqube_extensions:
EOF

docker-compose up -d
```

#### Project Analysis
```bash
# Maven project
mvn sonar:sonar \
  -Dsonar.projectKey=my-project \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.login=admin \
  -Dsonar.password=admin

# Gradle project
./gradlew sonarqube \
  -Dsonar.projectKey=my-project \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.login=admin \
  -Dsonar.password=admin

# JavaScript/TypeScript project
npm install -g sonarqube-scanner
sonar-scanner \
  -Dsonar.projectKey=my-project \
  -Dsonar.sources=src \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.login=admin \
  -Dsonar.password=admin
```

#### Quality Gates
```json
// sonar-project.properties
sonar.projectKey=my-project
sonar.projectName=My Security Project
sonar.projectVersion=1.0

sonar.sources=src
sonar.tests=tests
sonar.test.inclusions=**/*.test.js,**/*.spec.js
sonar.javascript.lcov.reportPaths=coverage/lcov.info

# Security rules
sonar.security.hotspots.threshold=0
sonar.vulnerabilities.threshold=0
sonar.newCode.referenceBranch=main
```

### Semgrep

#### Installation
```bash
# Via pip
pip install semgrep

# Via brew
brew install semgrep

# Via npm
npm install -g @semgrep/cli
```

#### Basic Usage
```bash
# Run all rules
semgrep --config=auto src/

# JSON output
semgrep --config=auto --json src/ > semgrep-results.json

# SARIF output (for GitHub)
semgrep --config=auto --sarif --output=semgrep.sarif src/

# Specific rule
semgrep --config=p/security-audit src/

# Custom rule
semgrep --config=my-rules.yml src/
```

#### Custom Rules
```yaml
# my-security-rules.yml
rules:
  - id: sql-injection
    pattern: |
      db.query($QUERY + $USER_INPUT)
    message: Potential SQL injection
    severity: ERROR
    languages: [javascript, typescript]
    metadata:
      category: security
      technology: [node.js, express]

  - id: hardcoded-secret
    pattern-regex: |
      (API_KEY|SECRET|PASSWORD)\s*=\s*['"][^'"]{10,}['"]
    message: Hardcoded secret detected
    severity: ERROR
    languages: [javascript, typescript, python]

  - id: eval-usage
    pattern: eval($INPUT)
    message: Use of eval() is dangerous
    severity: WARNING
    languages: [javascript, typescript]
```

#### CI/CD Integration
```yaml
# .github/workflows/semgrep.yml
name: Semgrep

on:
  pull_request:
  push:
    branches: [main]

jobs:
  semgrep:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Semgrep
        uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            p/security-audit
            p/secrets
            p/owasp-top-ten
          generateSarif: "1"

      - name: Upload SARIF file
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: semgrep.sarif
```

### CodeQL

#### Installation & Setup
```bash
# Install CodeQL CLI
wget https://github.com/github/codeql-cli-binaries/releases/latest/download/codeql-linux64.zip
unzip codeql-linux64.zip

# Initialize database
codeql database create javascript-db --language=javascript

# Analyze database
codeql database analyze javascript-db codeql/javascript-queries --format=sarifv1.0 --output=results.sarif
```

#### GitHub Integration
```yaml
# .github/workflows/codeql.yml
name: CodeQL

on:
  push:
    branches: [main]
  pull_request:
  schedule:
    - cron: '0 0 * * 0'

jobs:
  analyze:
    name: Analyze
    runs-on: ubuntu-latest
    permissions:
      actions: read
      contents: read
      security-events: write

    strategy:
      fail-fast: false
      matrix:
        language: [javascript, python]

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Initialize CodeQL
        uses: github/codeql-action/init@v2
        with:
          languages: ${{ matrix.language }}

      - name: Autobuild
        uses: github/codeql-action/autobuild@v2

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v2
```

## DAST (Dynamic Application Security Testing)

### OWASP ZAP

#### Installation
```bash
# Docker installation
docker pull owasp/zap2docker-stable

# Command line usage
docker run -v $(pwd):/zap/wrk/:rw \
  -t owasp/zap2docker-stable zap-baseline.py \
  -t https://target.com

# Full scan
docker run -v $(pwd):/zap/wrk/:rw \
  -t owasp/zap2docker-stable zap-full-scan.py \
  -t https://target.com \
  -r zap-report.html
```

#### Automation Scripts
```bash
#!/bin/bash
# zap-scan.sh

TARGET_URL="${1:-http://localhost:3000}"
REPORT_DIR="${2:-./zap-reports}"

mkdir -p "$REPORT_DIR"

echo "Starting ZAP Baseline Scan..."
docker run -v "$REPORT_DIR:/zap/wrk/:rw" \
  owasp/zap2docker-stable zap-baseline.py \
  -t "$TARGET_URL" \
  -J zap-baseline.json

echo "Starting ZAP Full Scan..."
docker run -v "$REPORT_DIR:/zap/wrk/:rw" \
  owasp/zap2docker-stable zap-full-scan.py \
  -t "$TARGET_URL" \
  -J zap-full.json \
  -r zap-report.html

echo "ZAP scans complete. Reports saved to $REPORT_DIR"
```

#### ZAP API Integration
```python
#!/usr/bin/env python3
import requests
import time

ZAP_BASE = "http://localhost:8080"

def zap_spider_scan(url):
    """Start spider scan"""
    scan_url = f"{ZAP_BASE}/JSON/actioner/action/scan/"
    params = {
        "url": url,
        "recurse": True
    }
    response = requests.get(scan_url, params=params)
    return response.json()

def zap_ascan_scan(url):
    """Start active scan"""
    scan_url = f"{ZAP_BASE}/JSON/ascan/action/scan/"
    params = {
        "url": url,
        "recurse": True
    }
    response = requests.get(scan_url, params=params)
    return response.json()

def zap_get_results(scan_id):
    """Get scan results"""
    status_url = f"{ZAP_BASE}/JSON/ascan/view/status/"
    params = {"scanId": scan_id}
    response = requests.get(status_url, params=params)
    return response.json()

# Usage
if __name__ == "__main__":
    target = "https://target.com"

    # Start scan
    scan = zap_ascan_scan(target)
    scan_id = scan["scan"]

    # Monitor progress
    while True:
        status = zap_get_results(scan_id)
        print(f"Scan status: {status}")

        if status["status"] == "100":
            print("Scan complete!")
            break

        time.sleep(10)
```

### Burp Suite Professional

#### Configuration
```json
// burp-config.json
{
  "proxy": {
    "intercept_client_requests": {
      "enabled": true,
      "rules": [
        {
          "enabled": true,
          "url": ".*",
          "method": "POST",
          "header": "Content-Type",
          "match_condition": "matches_regex",
          "match_text": "application/json"
        }
      ]
    }
  },
  "scanner": {
    "active_scanning": {
      "enabled": true,
      "rules": [
        {
          "enabled": true,
          "name": "SQL injection",
          "type": "vulnerability_type",
          "severity": "high"
        }
      ]
    }
  }
}
```

#### Extension Development
```python
from burp import IBurpExtender
from burp import IHttpListener

class BurpExtender(IBurpExtender, IHttpListener):
    def registerExtenderCallbacks(self, callbacks):
        self._callbacks = callbacks
        self._helpers = callbacks.getHelpers()

        callbacks.setExtensionName("Security Scanner")
        callbacks.registerHttpListener(self)

    def processHttpMessage(self, toolFlag, messageIsRequest, messageInfo):
        if messageIsRequest:
            return

        # Analyze response
        response = messageInfo.getResponse()
        analyzed = self._helpers.analyzeResponse(response)

        # Check for security headers
        headers = analyzed.getHeaders()
        if "X-Frame-Options" not in headers:
            self._callbacks.issueAlert("Missing X-Frame-Options header")
```

### Nikto

#### Basic Scanning
```bash
# Basic scan
nikto -h https://target.com

# Save output
nikto -h https://target.com -Format xml -output nikto-scan.xml

# Specific ports
nikto -h https://target.com -p 80,443,8080

# Aggressive scan
nikto -h https://target.com -Tuning 1234567890abcdef

# Full HTTP options
nikto -h https://target.com -ssl -useproxy
```

#### Custom Plugins
```perl
# custom-check.nasl
if(description)
{
  script_oid("1.3.6.1.4.1.25623.1.0.000000");
  script_version("2023-10-10");
  name["english"] = "Custom Security Check";

  script_name(english:name["english"]);
  script_category(ACT_GATHER_INFO);

  script_copyright(english:"This script is Copyright (C) 2023");

  script_family(english:"Web application abuses");

  script_dependencies("http_version.nasl");

  script_require_ports("Services/www", 80);

  exit(0);
}

port = get_http_port(default:80);

req = http_get(item:"/", port:port);
res = http_send_recv(port:port, data:req);

if("X-Powered-By" >< res)
{
  report = string(
    "\n",
    "The remote web server appears to be using a legacy version\n",
    "of a technology stack that may have known vulnerabilities.\n"
  );
  security_hole(port:port, data:report);
}
```

## IAST (Interactive Application Security Testing)

### Contrast Security

#### Agent Installation (Java)
```bash
# Download Contrast agent
wget https://contrastsecurity.s3.amazonaws.com/contrast-agent.zip
unzip contrast-agent.zip

# Add to JVM arguments
JAVA_OPTS="-javaagent:/path/to/contrast-agent.jar -Dcontrast.config=/path/to/contrast.yaml"

# Run application
java $JAVA_OPTS -jar application.jar
```

#### Configuration
```yaml
# contrast.yaml
contrast:
  server:
    name: Production Server 1
    environment: production
  security:
    log:
      level: info
  teamserver:
    url: https://app.contrastsecurity.com
    api_key: YOUR_API_KEY
    api_secret: YOUR_API_SECRET
    proxy:
      host: proxy.company.com
      port: 8080
  contrast:
    org_uuid: YOUR_ORG_UUID
    username: yourname@company.com
```

### Seeker (Synopsys)

#### Java Agent
```bash
# Start application with Seeker agent
java -javaagent:/path/to/seeker-agent.jar \
  -Dseeker.project.name=MyWebApp \
  -Dseeker.server.url=http://seeker.company.com:8080 \
  -jar application.jar
```

#### .NET Agent
```xml
<!-- web.config -->
<configuration>
  <appSettings>
    <add key="Seeker.Project.Name" value="MyWebApp" />
    <add key="Seeker.Server.Url" value="http://seeker.company.com:8080" />
    <add key="Seeker.Api.Key" value="YOUR_API_KEY" />
  </appSettings>
</configuration>
```

## Dependency Scanners

### npm audit

#### Basic Usage
```bash
# Audit dependencies
npm audit

# JSON output
npm audit --json > audit-results.json

# Fix vulnerabilities
npm audit fix

# Fix specific vulnerability
npm audit fix --force

# Production dependencies only
npm audit --production
```

#### CI/CD Integration
```bash
#!/bin/bash
# audit-check.sh

# Run npm audit
npm audit --json > audit-results.json

# Check for vulnerabilities
VULNS=$(jq '.vulnerabilities | length' audit-results.json)

if [ "$VULNS" -gt 0 ]; then
  echo "❌ Found $VULNS vulnerabilities"
  jq '.vulnerabilities | to_entries[] | "\(.key): \(.value.severity)"' audit-results.json
  exit 1
else
  echo "✅ No vulnerabilities found"
  exit 0
fi
```

### Snyk

#### Installation & Setup
```bash
# Install Snyk CLI
npm install -g snyk

# Authenticate
snyk auth

# Test for vulnerabilities
snyk test

# Monitor project
snyk monitor
```

#### CI/CD Integration
```yaml
# .github/workflows/snyk.yml
name: Snyk Security

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Snyk
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high
```

### WhiteSource

#### Agent Installation
```bash
# Download agent
wget https://github.com/whitesource/whitesource-agent/releases/latest/download/wss-agent.sh

# Make executable
chmod +x wss-agent.sh

# Run scan
./wss-agent.sh \
  -c whitesource.config \
  -apiKey $WHITESOURCE_API_KEY
```

#### Configuration
```properties
# whitesource.config
apiKey=YOUR_API_KEY
projectName=MyProject
productName=SecurityTesting
wss.url=https://saas.whitesourcesoftware.com/agent
```

## Secret Scanners

### TruffleHog

#### Installation
```bash
# Via pip
pip install truffleHog

# Binary download
wget https://github.com/trufflesecurity/trufflehog/releases/latest/download/trufflehog_Darwin_x86_64.tar.gz
tar -xzf trufflehog_Darwin_x86_64.tar.gz
```

#### Usage
```bash
# Scan Git repository
trufflehog git file . --json > secrets-found.json

# Scan specific files
trufflehog filesystem path/to/directory

# Scan URL
trufflehog git https://github.com/user/repo.git --json

# S3 bucket scan
trufflehog s3 --bucket my-bucket --access-key=KEY --secret-key=SECRET

# GitHub org scan
trufflehog github --org=myorg --token=GITHUB_TOKEN
```

### GitLeaks

#### Installation
```bash
# Via brew
brew install gitleaks

# Via go
go install github.com/zricethezav/gitleaks/v8@latest

# Docker
docker pull zricethezav/gitleaks:latest
```

#### Configuration
```toml
# .gitleaks.toml
title = "Gitleaks config"

[[rules]]
id = "AWS Access Key"
regex = '''AKIA[0-9A-Z]{16}'''
description = "AWS Access Key"

[[rules]]
id = "Private Key"
regex = '''-----BEGIN (EC|RSA|OPENSSH) PRIVATE KEY-----'''
description = "Private Key"

[allowlist]
regexes = [
  '''test-token-123''',
  '''example-key-fake'''
]

paths = [
  '''tests/.*\.py$''',
  '''docs/.*\.md$'''
]
```

#### Usage
```bash
# Scan current directory
gitleaks detect --source .

# Scan specific path
gitleaks detect --source path/to/repo

# With config
gitleaks detect --source . --config .gitleaks.toml

# JSON output
gitleaks detect --source . --json > leaks.json

# Baseline file (suppress known issues)
gitleaks detect --source . --baseline leaks-baseline.json
```

## Infrastructure Scanners

### Nmap

#### Basic Scanning
```bash
# Port scan
nmap target.com

# Service version detection
nmap -sV target.com

# OS detection
nmap -O target.com

# Aggressive scan
nmap -A target.com

# Fast scan
nmap -T4 -F target.com

# Script scanning
nmap --script vuln target.com
```

#### NSE Scripts
```bash
# SSL/TLS testing
nmap --script ssl-enum-ciphers -p 443 target.com

# HTTP security headers
nmap --script http-headers target.com

# Brute force
nmap --script ftp-brute --script-args userdb=users.txt,passdb=pass.txt target.com

# SQL injection
nmap --script http-sql-injection target.com
```

### OpenVAS

#### Installation
```bash
# Docker
docker pull greenbone/openvas

# Or native installation (Ubuntu)
apt-get update
apt-get install openvas

# Setup
openvas-setup
openvas-start
```

#### Usage
```bash
# List available scans
openvas --list-scan-configs

# Create scan target
omp -u admin -w admin -h localhost -p 9390 \
  -c "Create scan" \
  '<create_target><name>Target Scan</name><host>target.com</host></create_target>'

# Start scan
omp -u admin -w admin -h localhost -p 9390 \
  -c "Start scan" \
  '<start_task task_id="TASK_ID"/>'
```

## Custom Security Testing Frameworks

### Python Security Testing Framework

```python
#!/usr/bin/env python3
"""
Custom Security Testing Framework
"""
import requests
import json
import argparse
from urllib.parse import urljoin

class SecurityTester:
    def __init__(self, target_url, headers=None):
        self.target_url = target_url
        self.session = requests.Session()
        if headers:
            self.session.headers.update(headers)
        self.findings = []

    def test_sqli(self, param="id"):
        """Test for SQL injection"""
        payloads = [
            "' OR '1'='1",
            "' UNION SELECT NULL--",
            "'; WAITFOR DELAY '00:00:05'--"
        ]

        for payload in payloads:
            try:
                url = urljoin(self.target_url, "/api/user")
                params = {param: payload}
                response = self.session.get(url, params=params)

                if self._check_sqli_error(response.text):
                    self.findings.append({
                        "type": "SQL Injection",
                        "payload": payload,
                        "parameter": param,
                        "severity": "Critical"
                    })
            except Exception as e:
                print(f"Error testing SQLi: {e}")

    def test_xss(self):
        """Test for XSS"""
        payloads = [
            "<script>alert('XSS')</script>",
            "javascript:alert('XSS')",
            "'><script>alert('XSS')</script>"
        ]

        for payload in payloads:
            try:
                data = {"comment": payload}
                response = self.session.post(
                    urljoin(self.target_url, "/comments"),
                    data=data
                )

                if payload in response.text:
                    self.findings.append({
                        "type": "XSS",
                        "payload": payload,
                        "severity": "High"
                    })
            except Exception as e:
                print(f"Error testing XSS: {e}")

    def test_csrf(self):
        """Test for CSRF protection"""
        try:
            response = self.session.get(
                urljoin(self.target_url, "/transfer")
            )

            # Check for CSRF token
            if "csrf_token" not in response.text.lower():
                self.findings.append({
                    "type": "CSRF Protection Missing",
                    "severity": "High"
                })

            # Try to perform action without token
            data = {"amount": 1000, "to": "attacker"}
            response = self.session.post(
                urljoin(self.target_url, "/transfer"),
                data=data
            )

            if response.status_code == 200:
                self.findings.append({
                    "type": "CSRF Bypass",
                    "severity": "Critical"
                })
        except Exception as e:
            print(f"Error testing CSRF: {e}")

    def _check_sqli_error(self, text):
        """Check if response contains SQL error"""
        errors = [
            "mysql_fetch_array",
            "ORA-01756",
            "PostgreSQL",
            "Warning.*pg_",
            "valid MySQL result",
            "MySQLSyntaxErrorException",
            "sqlite_master"
        ]
        return any(error.lower() in text.lower() for error in errors)

    def generate_report(self):
        """Generate JSON report"""
        report = {
            "target": self.target_url,
            "findings": self.findings,
            "summary": {
                "critical": len([f for f in self.findings if f["severity"] == "Critical"]),
                "high": len([f for f in self.findings if f["severity"] == "High"]),
                "medium": len([f for f in self.findings if f["severity"] == "Medium"]),
                "low": len([f for f in self.findings if f["severity"] == "Low"])
            }
        }

        with open("security-report.json", "w") as f:
            json.dump(report, f, indent=2)

        return report

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Security Testing Framework")
    parser.add_argument("--target", required=True, help="Target URL")
    parser.add_argument("--header", action="append", help="Custom headers (key:value)")
    args = parser.parse_args()

    headers = {}
    if args.header:
        for header in args.header:
            key, value = header.split(":", 1)
            headers[key.strip()] = value.strip()

    tester = SecurityTester(args.target, headers)
    tester.test_sqli()
    tester.test_xss()
    tester.test_csrf()

    report = tester.generate_report()
    print(json.dumps(report, indent=2))
```

---

**Estado**: Herramientas documentadas con configuración completa
**Coverage**: SAST, DAST, IAST, Dependency Scanners, Secret Scanners
**Automation**: CI/CD integration examples included
