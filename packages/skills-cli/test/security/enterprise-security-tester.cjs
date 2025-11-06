/**
 * Enterprise Security Testing Suite
 * Comprehensive security validation using open source tools
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class EnterpriseSecurityTester {
  constructor() {
    this.testResults = [];
    this.startTime = Date.now();
    this.vulnerabilityDatabase = new Map();
    this.setupSecurityEnvironment();
  }

  setupSecurityEnvironment() {
    console.log('🔒 Setting up enterprise security testing environment...');

    // Create security test directories
    this.securityDataDir = path.join(__dirname, 'security-data');
    this.reportsDir = path.join(__dirname, 'security-reports');
    this.scansDir = path.join(__dirname, 'security-scans');

    [this.securityDataDir, this.reportsDir, this.scansDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Created security directory: ${dir}`);
      }
    });

    // Initialize vulnerability patterns database
    this.initializeVulnerabilityPatterns();
  }

  initializeVulnerabilityPatterns() {
    // Common vulnerability patterns for detection
    this.vulnerabilityPatterns = {
      'sql_injection': {
        patterns: [
          /SELECT\s+\*\s+FROM\s+\w+\s+WHERE\s+.+/gi,
          /UNION\s+SELECT\s+/gi,
          /OR\s+1\s*=\s*1/gi,
          /DROP\s+TABLE/gi
        ],
        severity: 'critical',
        description: 'Potential SQL injection vulnerability'
      },
      'xss': {
        patterns: [
          /<script[^>]*>.*?<\/script>/gi,
          /javascript:/gi,
          /on\w+\s*=\s*["'][^"']*["']/gi,
          /eval\s*\(/gi
        ],
        severity: 'high',
        description: 'Cross-site scripting vulnerability'
      },
      'path_traversal': {
        patterns: [
          /\.\.[\/\\]/g,
          /%2e%2e[\/\\]/gi,
          /\.\.%2f/gi,
          /etc\/passwd/gi
        ],
        severity: 'high',
        description: 'Path traversal vulnerability'
      },
      'command_injection': {
        patterns: [
          /\$\([^)]*\)/g,
          /`[^`]*`/g,
          /\|\s*\w+/g,
          /;\s*\w+/g,
          /&&\s*\w+/g
        ],
        severity: 'critical',
        description: 'Command injection vulnerability'
      },
      'hardcoded_secrets': {
        patterns: [
          /password\s*=\s*["'][^"']+["']/gi,
          /api_key\s*=\s*["'][^"']+["']/gi,
          /secret\s*=\s*["'][^"']+["']/gi,
          /token\s*=\s*["'][^"']+["']/gi,
          /[A-Za-z0-9]{32,}/g // Long strings that might be keys
        ],
        severity: 'critical',
        description: 'Hardcoded secrets or credentials'
      },
      'insecure_deserialization': {
        patterns: [
          /deserialize\s*\(/gi,
          /unserialize\s*\(/gi,
          /JSON\.parse\s*\(/gi,
          /eval\s*\(\s*JSON/gi
        ],
        severity: 'medium',
        description: 'Insecure deserialization'
      }
    };
  }

  async runAllSecurityTests() {
    console.log('\n🚀 Starting Enterprise Security Testing Suite');
    console.log('===============================================');

    const tests = [
      { name: 'Dependency Vulnerability Scanning', fn: () => this.testDependencyVulnerabilities() },
      { name: 'Code Security Analysis', fn: () => this.testCodeSecurity() },
      { name: 'Secrets Detection', fn: () => this.testSecretsDetection() },
      { name: 'File Permission Security', fn: () => this.testFilePermissions() },
      { name: 'Input Validation Security', fn: () => this.testInputValidation() },
      { name: 'Authentication & Authorization', fn: () => this.testAuthSecurity() },
      { name: 'Network Security', fn: () => this.testNetworkSecurity() },
      { name: 'Compliance & Best Practices', fn: () => this.testCompliance() },
      { name: 'Security Configuration', fn: () => this.testSecurityConfiguration() }
    ];

    for (const test of tests) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🔍 Running: ${test.name}`);
      console.log('='.repeat(60));

      try {
        const result = await test.fn();
        this.testResults.push({
          test: test.name,
          success: result.success !== false,
          duration: result.duration || 0,
          details: result.details || {},
          vulnerabilities: result.vulnerabilities || [],
          timestamp: Date.now()
        });

        const status = result.success !== false ? '✅ PASSED' : '❌ FAILED';
        const vulnCount = result.vulnerabilities ? result.vulnerabilities.length : 0;
        console.log(`${status} ${test.name} (${result.duration || 0}ms) ${vulnCount > 0 ? `- ${vulnCount} vulnerabilities found` : ''}`);
      } catch (error) {
        this.testResults.push({
          test: test.name,
          success: false,
          duration: 0,
          details: { error: error.message },
          vulnerabilities: [],
          timestamp: Date.now()
        });
        console.log(`❌ ${test.name} - FAILED: ${error.message}`);
      }
    }

    this.generateSecurityReport();
  }

  async testDependencyVulnerabilities() {
    console.log('Testing dependency vulnerabilities...');
    const startTime = Date.now();

    const vulnerabilities = [];

    try {
      // Test npm audit
      console.log('  Running npm audit...');
      const auditResult = execSync('npm audit --json', {
        encoding: 'utf8',
        cwd: path.join(__dirname, '../..'),
        timeout: 60000
      });

      const auditData = JSON.parse(auditResult);
      const vulnCount = auditData.metadata?.vulnerabilities?.total || 0;

      if (vulnCount > 0) {
        vulnerabilities.push({
          type: 'dependency',
          severity: 'medium',
          count: vulnCount,
          details: auditData.vulnerabilities || {},
          recommendation: 'Run npm audit fix to resolve vulnerabilities'
        });
      }

      console.log(`  ✅ npm audit completed - ${vulnCount} vulnerabilities found`);
    } catch (error) {
      // npm audit returns non-zero exit code when vulnerabilities are found
      try {
        const auditData = JSON.parse(error.stdout);
        const vulnCount = auditData.metadata?.vulnerabilities?.total || 0;

        if (vulnCount > 0) {
          vulnerabilities.push({
            type: 'dependency',
            severity: 'medium',
            count: vulnCount,
            details: auditData.vulnerabilities || {},
            recommendation: 'Run npm audit fix to resolve vulnerabilities'
          });
        }

        console.log(`  ⚠️  npm audit found ${vulnCount} vulnerabilities`);
      } catch (parseError) {
        console.log(`  ❌ npm audit failed: ${error.message}`);
      }
    }

    try {
      // Test Snyk if available (free tier)
      console.log('  Running Snyk security scan...');
      const snykResult = execSync('snyk test --json', {
        encoding: 'utf8',
        cwd: path.join(__dirname, '../..'),
        timeout: 60000
      });

      const snykData = JSON.parse(snykResult);
      if (snykData.vulnerabilities && snykData.vulnerabilities.length > 0) {
        vulnerabilities.push({
          type: 'dependency',
          source: 'Snyk',
          severity: 'medium',
          count: snykData.vulnerabilities.length,
          details: snykData.vulnerabilities,
          recommendation: 'Update vulnerable dependencies or apply patches'
        });
      }

      console.log(`  ✅ Snyk scan completed`);
    } catch (error) {
      console.log(`  ⚠️  Snyk not available or failed: ${error.message}`);
    }

    // Check for outdated packages
    try {
      console.log('  Checking for outdated packages...');
      const outdatedResult = execSync('npm outdated --json', {
        encoding: 'utf8',
        cwd: path.join(__dirname, '../..'),
        timeout: 30000
      });

      const outdatedData = JSON.parse(outdatedResult);
      const outdatedCount = Object.keys(outdatedData).length;

      if (outdatedCount > 0) {
        vulnerabilities.push({
          type: 'outdated',
          severity: 'low',
          count: outdatedCount,
          details: outdatedData,
          recommendation: 'Update outdated packages to latest versions'
        });
      }

      console.log(`  ✅ Outdated packages check completed - ${outdatedCount} outdated packages`);
    } catch (error) {
      console.log(`  ℹ️  No outdated packages or check failed`);
    }

    return {
      success: vulnerabilities.filter(v => v.severity === 'critical' || v.severity === 'high').length === 0,
      duration: Date.now() - startTime,
      details: {
        totalVulnerabilities: vulnerabilities.length,
        criticalVulns: vulnerabilities.filter(v => v.severity === 'critical').length,
        highVulns: vulnerabilities.filter(v => v.severity === 'high').length
      },
      vulnerabilities
    };
  }

  async testCodeSecurity() {
    console.log('Testing code security...');
    const startTime = Date.now();

    const vulnerabilities = [];
    const sourceDir = path.join(__dirname, '../../src');

    // Scan source files for security patterns
    this.scanDirectory(sourceDir, (filePath, content) => {
      const fileVulns = this.analyzeCodeForVulnerabilities(content, filePath);
      vulnerabilities.push(...fileVulns);
    });

    // Check for insecure imports
    const insecureImports = [
      'eval(',
      'Function(',
      'setTimeout(',
      'setInterval(',
      'child_process.exec',
      'child_process.spawn',
      'fs.unlink',
      'fs.rmdir'
    ];

    this.scanDirectory(sourceDir, (filePath, content) => {
      insecureImports.forEach(pattern => {
        if (content.includes(pattern)) {
          vulnerabilities.push({
            type: 'insecure_import',
            file: filePath,
            severity: 'medium',
            pattern: pattern,
            line: this.findLineNumber(content, pattern),
            recommendation: `Review usage of ${pattern} for security implications`
          });
        }
      });
    });

    return {
      success: vulnerabilities.filter(v => v.severity === 'critical' || v.severity === 'high').length === 0,
      duration: Date.now() - startTime,
      details: {
        filesScanned: this.getFilesScanned(sourceDir),
        vulnerabilitiesFound: vulnerabilities.length
      },
      vulnerabilities
    };
  }

  async testSecretsDetection() {
    console.log('Testing secrets detection...');
    const startTime = Date.now();

    const vulnerabilities = [];
    const sourceDir = path.join(__dirname, '../..');

    // Common secret patterns
    const secretPatterns = [
      { name: 'AWS Access Key', pattern: /AKIA[0-9A-Z]{16}/g, severity: 'critical' },
      { name: 'GitHub Token', pattern: /ghp_[a-zA-Z0-9]{36}/g, severity: 'critical' },
      { name: 'JWT Token', pattern: /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g, severity: 'high' },
      { name: 'Private Key', pattern: /-----BEGIN [A-Z]+ KEY-----[\s\S]*?-----END [A-Z]+ KEY-----/g, severity: 'critical' },
      { name: 'Password in URL', pattern: /:\/\/[^:]+:[^@]+@/g, severity: 'high' },
      { name: 'API Key Generic', pattern: /api[_-]?key\s*[:=]\s*["\']?[a-zA-Z0-9_-]{16,}["\']?/gi, severity: 'high' },
      { name: 'Secret Token', pattern: /secret[_-]?token\s*[:=]\s*["\']?[a-zA-Z0-9_-]{16,}["\']?/gi, severity: 'critical' }
    ];

    this.scanDirectory(sourceDir, (filePath, content) => {
      // Skip node_modules and other non-source directories
      if (filePath.includes('node_modules') || filePath.includes('.git') || filePath.includes('dist')) {
        return;
      }

      secretPatterns.forEach(secretType => {
        const matches = content.match(secretType.pattern);
        if (matches) {
          matches.forEach(match => {
            vulnerabilities.push({
              type: 'secret',
              name: secretType.name,
              file: filePath,
              severity: secretType.severity,
              matchedText: this.maskSensitiveData(match),
              line: this.findLineNumber(content, match),
              recommendation: `Remove ${secretType.name} from source code and use environment variables`
            });
          });
        }
      });
    });

    return {
      success: vulnerabilities.filter(v => v.severity === 'critical').length === 0,
      duration: Date.now() - startTime,
      details: {
        secretsFound: vulnerabilities.length,
        criticalSecrets: vulnerabilities.filter(v => v.severity === 'critical').length
      },
      vulnerabilities
    };
  }

  async testFilePermissions() {
    console.log('Testing file permissions...');
    const startTime = Date.now();

    const vulnerabilities = [];
    const projectRoot = path.join(__dirname, '../..');

    // Check sensitive file permissions
    const sensitiveFiles = [
      '.env',
      '.env.*',
      'package.json',
      'tsconfig.json',
      '.gitignore'
    ];

    for (const filePattern of sensitiveFiles) {
      const files = this.findFiles(projectRoot, filePattern);
      files.forEach(filePath => {
        try {
          const stats = fs.statSync(filePath);
          const mode = stats.mode;

          // Check if file is world-readable or world-writable
          if (mode & 0o004) { // world-readable
            vulnerabilities.push({
              type: 'file_permission',
              file: filePath,
              severity: 'medium',
              permission: 'world-readable',
              mode: mode.toString(8),
              recommendation: 'Remove world-read permissions from sensitive files'
            });
          }

          if (mode & 0o002) { // world-writable
            vulnerabilities.push({
              type: 'file_permission',
              file: filePath,
              severity: 'high',
              permission: 'world-writable',
              mode: mode.toString(8),
              recommendation: 'Remove world-write permissions from all files'
            });
          }
        } catch (error) {
          // File might not exist or be accessible
        }
      });
    }

    // Check for executable permissions on scripts that shouldn't be executable
    const scriptFiles = this.findFiles(projectRoot, '*.js');
    scriptFiles.forEach(filePath => {
      if (!filePath.includes('node_modules') && !filePath.includes('test')) {
        try {
          const stats = fs.statSync(filePath);
          if (stats.mode & 0o111) { // executable
            vulnerabilities.push({
              type: 'file_permission',
              file: filePath,
              severity: 'low',
              permission: 'executable',
              mode: stats.mode.toString(8),
              recommendation: 'Remove execute permissions from non-executable JavaScript files'
            });
          }
        } catch (error) {
          // File might not be accessible
        }
      }
    });

    return {
      success: vulnerabilities.filter(v => v.severity === 'high' || v.severity === 'critical').length === 0,
      duration: Date.now() - startTime,
      details: {
        filesChecked: sensitiveFiles.length + scriptFiles.length,
        permissionIssues: vulnerabilities.length
      },
      vulnerabilities
    };
  }

  async testInputValidation() {
    console.log('Testing input validation security...');
    const startTime = Date.now();

    const vulnerabilities = [];
    const sourceDir = path.join(__dirname, '../../src');

    // Test for proper input validation patterns
    const validationPatterns = [
      {
        name: 'User input sanitization',
        pattern: /req\.body|req\.query|req\.params/g,
        shouldHave: ['sanitize', 'validate', 'escape', 'clean'],
        severity: 'high'
      },
      {
        name: 'File upload validation',
        pattern: /multer|upload|file/g,
        shouldHave: ['fileFilter', 'limits', 'mimetype', 'validate'],
        severity: 'medium'
      },
      {
        name: 'SQL query parameters',
        pattern: /SELECT|INSERT|UPDATE|DELETE/gi,
        shouldHave: ['parameterized', 'prepared', 'escape', 'sanitize'],
        severity: 'critical'
      }
    ];

    this.scanDirectory(sourceDir, (filePath, content) => {
      validationPatterns.forEach(validation => {
        const matches = content.match(validation.pattern);
        if (matches) {
          const hasValidation = validation.shouldHave.some(check => content.includes(check));

          if (!hasValidation) {
            vulnerabilities.push({
              type: 'input_validation',
              name: validation.name,
              file: filePath,
              severity: validation.severity,
              pattern: validation.pattern.source,
              recommendation: `Add proper input validation using ${validation.shouldHave.join(', ')}`
            });
          }
        }
      });
    });

    return {
      success: vulnerabilities.filter(v => v.severity === 'critical').length === 0,
      duration: Date.now() - startTime,
      details: {
        validationChecks: validationPatterns.length,
        validationIssues: vulnerabilities.length
      },
      vulnerabilities
    };
  }

  async testAuthSecurity() {
    console.log('Testing authentication & authorization security...');
    const startTime = Date.now();

    const vulnerabilities = [];
    const sourceDir = path.join(__dirname, '../../src');

    // Check for authentication patterns
    const authPatterns = [
      {
        name: 'Password hashing',
        pattern: /password|pwd/g,
        shouldHave: ['hash', 'bcrypt', 'scrypt', 'argon'],
        severity: 'critical'
      },
      {
        name: 'Session management',
        pattern: /session|cookie/g,
        shouldHave: ['secure', 'httpOnly', 'expire', 'signed'],
        severity: 'high'
      },
      {
        name: 'JWT handling',
        pattern: /jwt|token/g,
        shouldHave: ['verify', 'sign', 'expire', 'secret'],
        severity: 'medium'
      }
    ];

    this.scanDirectory(sourceDir, (filePath, content) => {
      authPatterns.forEach(auth => {
        const matches = content.match(auth.pattern);
        if (matches) {
          const hasSecurity = auth.shouldHave.some(check => content.toLowerCase().includes(check.toLowerCase()));

          if (!hasSecurity) {
            vulnerabilities.push({
              type: 'auth_security',
              name: auth.name,
              file: filePath,
              severity: auth.severity,
              recommendation: `Implement proper ${auth.name} using ${auth.shouldHave.join(', ')}`
            });
          }
        }
      });
    });

    return {
      success: vulnerabilities.filter(v => v.severity === 'critical').length === 0,
      duration: Date.now() - startTime,
      details: {
        authChecks: authPatterns.length,
        authIssues: vulnerabilities.length
      },
      vulnerabilities
    };
  }

  async testNetworkSecurity() {
    console.log('Testing network security...');
    const startTime = Date.now();

    const vulnerabilities = [];

    // Check for insecure protocols
    const insecurePatterns = [
      { pattern: /http:\/\/localhost/g, severity: 'low', recommendation: 'Use HTTPS in production' },
      { pattern: /ftp:\/\//g, severity: 'medium', recommendation: 'Use SFTP instead of FTP' },
      { pattern: /telnet:\/\//g, severity: 'high', recommendation: 'Use SSH instead of Telnet' }
    ];

    const sourceDir = path.join(__dirname, '../..');
    this.scanDirectory(sourceDir, (filePath, content) => {
      if (filePath.includes('node_modules') || filePath.includes('.git')) return;

      insecurePatterns.forEach(insecure => {
        const matches = content.match(insecure.pattern);
        if (matches) {
          vulnerabilities.push({
            type: 'network_security',
            file: filePath,
            severity: insecure.severity,
            pattern: insecure.pattern.source,
            recommendation: insecure.recommendation
          });
        }
      });
    });

    // Check CORS configuration
    try {
      const configFiles = this.findFiles(sourceDir, '*{config,conf,json}*');
      configFiles.forEach(configFile => {
        try {
          const content = fs.readFileSync(configFile, 'utf8');
          if (content.includes('cors') && !content.includes('origin')) {
            vulnerabilities.push({
              type: 'network_security',
              name: 'CORS configuration',
              file: configFile,
              severity: 'medium',
              recommendation: 'Configure proper CORS origins for security'
            });
          }
        } catch (error) {
          // Skip files that can't be read
        }
      });
    } catch (error) {
      console.log('  ⚠️  Could not check CORS configuration');
    }

    return {
      success: vulnerabilities.filter(v => v.severity === 'critical' || v.severity === 'high').length === 0,
      duration: Date.now() - startTime,
      details: {
        networkIssues: vulnerabilities.length
      },
      vulnerabilities
    };
  }

  async testCompliance() {
    console.log('Testing compliance & best practices...');
    const startTime = Date.now();

    const vulnerabilities = [];

    // Check for required security files
    const requiredFiles = [
      { file: '.gitignore', severity: 'medium', reason: 'Version control security' },
      { file: '.env.example', severity: 'low', reason: 'Environment variable documentation' },
      { file: 'package.json', severity: 'high', reason: 'Dependency management' },
      { file: 'README.md', severity: 'low', reason: 'Documentation' }
    ];

    const projectRoot = path.join(__dirname, '../..');
    requiredFiles.forEach(required => {
      if (!fs.existsSync(path.join(projectRoot, required.file))) {
        vulnerabilities.push({
          type: 'compliance',
          name: 'Missing security file',
          file: required.file,
          severity: required.severity,
          recommendation: `Add ${required.file} for ${required.reason}`
        });
      }
    });

    // Check package.json for security scripts
    try {
      const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
      const securityScripts = ['audit', 'security', 'test:security'];
      const hasSecurityScripts = securityScripts.some(script => packageJson.scripts && packageJson.scripts[script]);

      if (!hasSecurityScripts) {
        vulnerabilities.push({
          type: 'compliance',
          name: 'Missing security scripts',
          file: 'package.json',
          severity: 'low',
          recommendation: 'Add security testing scripts to package.json'
        });
      }
    } catch (error) {
      vulnerabilities.push({
        type: 'compliance',
        name: 'Invalid package.json',
        file: 'package.json',
        severity: 'high',
        recommendation: 'Fix package.json syntax or structure'
      });
    }

    // Check for license compliance
    try {
      const licenseFiles = this.findFiles(projectRoot, 'LICENSE*');
      if (licenseFiles.length === 0) {
        vulnerabilities.push({
          type: 'compliance',
          name: 'Missing license file',
          severity: 'low',
          recommendation: 'Add a license file for compliance'
        });
      }
    } catch (error) {
      console.log('  ⚠️  Could not check for license files');
    }

    return {
      success: vulnerabilities.filter(v => v.severity === 'high').length === 0,
      duration: Date.now() - startTime,
      details: {
        complianceChecks: requiredFiles.length + 3,
        complianceIssues: vulnerabilities.length
      },
      vulnerabilities
    };
  }

  async testSecurityConfiguration() {
    console.log('Testing security configuration...');
    const startTime = Date.now();

    const vulnerabilities = [];
    const projectRoot = path.join(__dirname, '../..');

    // Check environment configuration
    const envFiles = ['.env', '.env.local', '.env.development', '.env.production'];
    envFiles.forEach(envFile => {
      const envPath = path.join(projectRoot, envFile);
      if (fs.existsSync(envPath)) {
        try {
          const content = fs.readFileSync(envPath, 'utf8');

          // Check for default or weak secrets
          const weakPatterns = [
            { pattern: /password\s*=\s*(password|123456|admin|root)/gi, severity: 'critical' },
            { pattern: /secret\s*=\s*(secret|test|dev|default)/gi, severity: 'critical' },
            { pattern: /key\s*=\s*(key|test|dev|default)/gi, severity: 'high' }
          ];

          weakPatterns.forEach(weak => {
            if (weak.pattern.test(content)) {
              vulnerabilities.push({
                type: 'security_config',
                file: envFile,
                severity: weak.severity,
                issue: 'Weak credentials detected',
                recommendation: 'Use strong, unique credentials in environment variables'
              });
            }
          });
        } catch (error) {
          // Skip files that can't be read
        }
      }
    });

    // Check for development configurations in production
    const configFiles = this.findFiles(projectRoot, '*.{json,js,ts}');
    configFiles.forEach(configFile => {
      if (configFile.includes('node_modules') || configFile.includes('dist')) return;

      try {
        const content = fs.readFileSync(configFile, 'utf8');
        const devInProdPatterns = [
          { pattern: /NODE_ENV\s*=\s*development/gi, severity: 'medium' },
          { pattern: /debug\s*=\s*true/gi, severity: 'low' },
          { pattern: /verbose\s*=\s*true/gi, severity: 'low' }
        ];

        devInProdPatterns.forEach(dev => {
          if (dev.pattern.test(content)) {
            vulnerabilities.push({
              type: 'security_config',
              file: configFile,
              severity: dev.severity,
              issue: 'Development setting detected',
              recommendation: 'Ensure development settings are not used in production'
            });
          }
        });
      } catch (error) {
        // Skip files that can't be read
      }
    });

    return {
      success: vulnerabilities.filter(v => v.severity === 'critical').length === 0,
      duration: Date.now() - startTime,
      details: {
        configsChecked: envFiles.length + configFiles.length,
        configIssues: vulnerabilities.length
      },
      vulnerabilities
    };
  }

  // Helper methods
  scanDirectory(dir, callback) {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        this.scanDirectory(filePath, callback);
      } else if (stat.isFile() && (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.json'))) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          callback(filePath, content);
        } catch (error) {
          // Skip files that can't be read
        }
      }
    });
  }

  analyzeCodeForVulnerabilities(content, filePath) {
    const vulnerabilities = [];

    Object.entries(this.vulnerabilityPatterns).forEach(([vulnType, vulnInfo]) => {
      vulnInfo.patterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
          matches.forEach(match => {
            vulnerabilities.push({
              type: vulnType,
              file: filePath,
              severity: vulnInfo.severity,
              pattern: match,
              line: this.findLineNumber(content, match),
              description: vulnInfo.description,
              recommendation: `Review and fix ${vulnType} vulnerability`
            });
          });
        }
      });
    });

    return vulnerabilities;
  }

  findLineNumber(content, pattern) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(pattern)) {
        return i + 1;
      }
    }
    return 0;
  }

  findFiles(dir, pattern) {
    const files = [];

    if (!fs.existsSync(dir)) return files;

    const items = fs.readdirSync(dir);
    items.forEach(item => {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        files.push(...this.findFiles(itemPath, pattern));
      } else if (stat.isFile() && this.matchesPattern(item, pattern)) {
        files.push(itemPath);
      }
    });

    return files;
  }

  matchesPattern(filename, pattern) {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(filename);
    }
    return filename === pattern;
  }

  maskSensitiveData(data) {
    if (data.length > 8) {
      return data.substring(0, 4) + '***' + data.substring(data.length - 4);
    }
    return '***';
  }

  getFilesScanned(dir) {
    let count = 0;
    this.scanDirectory(dir, () => count++);
    return count;
  }

  generateSecurityReport() {
    const endTime = Date.now();
    const totalDuration = endTime - this.startTime;

    console.log('\n' + '='.repeat(80));
    console.log('🔒 ENTERPRISE SECURITY TESTING REPORT');
    console.log('='.repeat(80));
    console.log(`Total duration: ${(totalDuration / 1000).toFixed(2)} seconds`);
    console.log(`Security tests executed: ${this.testResults.length}`);
    console.log('');

    const passed = this.testResults.filter(r => r.success).length;
    const failed = this.testResults.filter(r => !r.success).length;
    const allVulnerabilities = this.testResults.reduce((sum, r) => sum + (r.vulnerabilities?.length || 0), 0);
    const criticalVulns = this.testResults.reduce((sum, r) =>
      sum + (r.vulnerabilities?.filter(v => v.severity === 'critical').length || 0), 0);
    const highVulns = this.testResults.reduce((sum, r) =>
      sum + (r.vulnerabilities?.filter(v => v.severity === 'high').length || 0), 0);

    console.log(`✅ Security tests passed: ${passed}`);
    console.log(`❌ Security tests failed: ${failed}`);
    console.log(`🚨 Total vulnerabilities found: ${allVulnerabilities}`);
    console.log(`🔴 Critical vulnerabilities: ${criticalVulns}`);
    console.log(`🟠 High vulnerabilities: ${highVulns}`);

    if (criticalVulns > 0 || highVulns > 0) {
      console.log('\n🚨 CRITICAL SECURITY ISSUES FOUND:');
      this.testResults.forEach(result => {
        const criticalIssues = result.vulnerabilities?.filter(v => v.severity === 'critical' || v.severity === 'high') || [];
        if (criticalIssues.length > 0) {
          console.log(`\n   ${result.test}:`);
          criticalIssues.forEach(vuln => {
            const icon = vuln.severity === 'critical' ? '🔴' : '🟠';
            console.log(`     ${icon} ${vuln.type || vuln.name}: ${vuln.description || vuln.recommendation}`);
            if (vuln.file) console.log(`        File: ${vuln.file}:${vuln.line || 'unknown'}`);
          });
        }
      });
    }

    console.log('\n📋 Security Test Details:');
    this.testResults.forEach(result => {
      const status = result.success ? '✅' : '❌';
      const duration = result.duration ? `(${result.duration}ms)` : '(no timing)';
      const vulnCount = result.vulnerabilities?.length || 0;
      console.log(`   ${status} ${result.test} ${duration} ${vulnCount > 0 ? `- ${vulnCount} issues` : ''}`);
    });

    // Overall security assessment
    if (criticalVulns === 0 && highVulns === 0) {
      if (allVulnerabilities === 0) {
        console.log('\n🎉 EXCELLENT SECURITY POSTURE!');
        console.log('✅ No security vulnerabilities found');
        console.log('✅ All security tests passed');
        console.log('✅ System meets enterprise security standards');
      } else {
        console.log('\n✅ GOOD SECURITY POSTURE');
        console.log('✅ No critical or high-severity vulnerabilities found');
        console.log('⚠️  Some low/medium severity issues should be addressed');
        console.log('   Review and fix remaining issues for optimal security');
      }
    } else {
      console.log('\n🚨 SECURITY ISSUES REQUIRE IMMEDIATE ATTENTION');
      console.log(`🔴 ${criticalVulns} critical vulnerabilities must be fixed immediately`);
      console.log(`🟠 ${highVulns} high vulnerabilities should be fixed urgently`);
      console.log('   Address these issues before production deployment');
    }

    // Save detailed report
    const reportPath = path.join(this.reportsDir, `security-report-${new Date().toISOString().split('T')[0]}.json`);
    const detailedReport = {
      summary: {
        totalDuration,
        testsExecuted: this.testResults.length,
        testsPassed: passed,
        testsFailed: failed,
        totalVulnerabilities: allVulnerabilities,
        criticalVulnerabilities: criticalVulns,
        highVulnerabilities: highVulns,
        timestamp: new Date().toISOString()
      },
      testResults: this.testResults,
      recommendations: this.generateRecommendations()
    };

    try {
      fs.writeFileSync(reportPath, JSON.stringify(detailedReport, null, 2));
      console.log(`\n📁 Detailed security report saved to: ${reportPath}`);
    } catch (error) {
      console.log(`\n⚠️  Could not save detailed report: ${error.message}`);
    }
  }

  generateRecommendations() {
    const recommendations = [];

    this.testResults.forEach(result => {
      if (result.vulnerabilities) {
        result.vulnerabilities.forEach(vuln => {
          if (!recommendations.includes(vuln.recommendation)) {
            recommendations.push(vuln.recommendation);
          }
        });
      }
    });

    return recommendations;
  }
}

async function main() {
  const securityTester = new EnterpriseSecurityTester();
  await securityTester.runAllSecurityTests();
}

if (require.main === module) {
  main().catch(error => {
    console.error('Security testing failed:', error);
    process.exit(1);
  });
}

module.exports = EnterpriseSecurityTester;