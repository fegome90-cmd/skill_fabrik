/**
 * Quick Security Scan
 * Fast security assessment for development workflow
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class QuickSecurityScan {
  constructor() {
    this.projectRoot = path.join(__dirname, '../..');
    this.issues = [];
  }

  async runQuickScan() {
    console.log('🔍 Running Quick Security Scan');
    console.log('==============================');

    const startTime = Date.now();

    // Quick dependency check
    await this.quickDependencyCheck();

    // Quick secrets scan
    await this.quickSecretsScan();

    // Quick file permissions check
    await this.quickFilePermissionsCheck();

    // Quick configuration check
    await this.quickConfigurationCheck();

    const duration = Date.now() - startTime;
    this.generateQuickReport(duration);
  }

  async quickDependencyCheck() {
    console.log('\n📦 Checking dependencies...');

    try {
      // Fast npm audit check
      const auditResult = execSync('npm audit --json', {
        encoding: 'utf8',
        cwd: this.projectRoot,
        timeout: 30000
      });

      const auditData = JSON.parse(auditResult);
      const vulns = auditData.metadata?.vulnerabilities || {};

      if (vulns.total > 0) {
        this.issues.push({
          type: 'dependency',
          severity: vulns.critical > 0 ? 'critical' : vulns.high > 0 ? 'high' : 'medium',
          count: vulns.total,
          details: `${vulns.critical} critical, ${vulns.high} high, ${vulns.moderate} moderate vulnerabilities`
        });
        console.log(`  ❌ ${vulns.total} vulnerabilities found`);
      } else {
        console.log('  ✅ No vulnerabilities found');
      }
    } catch (error) {
      // npm audit returns non-zero when vulnerabilities are found
      try {
        const auditData = JSON.parse(error.stdout);
        const vulns = auditData.metadata?.vulnerabilities || {};

        if (vulns.total > 0) {
          this.issues.push({
            type: 'dependency',
            severity: vulns.critical > 0 ? 'critical' : vulns.high > 0 ? 'high' : 'medium',
            count: vulns.total,
            details: `${vulns.critical} critical, ${vulns.high} high, ${vulns.moderate} moderate vulnerabilities`
          });
          console.log(`  ⚠️  ${vulns.total} vulnerabilities found`);
        } else {
          console.log('  ✅ No vulnerabilities found');
        }
      } catch (parseError) {
        console.log('  ❌ Could not check dependencies');
      }
    }
  }

  async quickSecretsScan() {
    console.log('\n🔑 Scanning for secrets...');

    const secretPatterns = [
      { pattern: /AKIA[0-9A-Z]{16}/g, name: 'AWS Access Key' },
      { pattern: /ghp_[a-zA-Z0-9]{36}/g, name: 'GitHub Token' },
      { pattern: /-----BEGIN [A-Z]+ KEY-----/g, name: 'Private Key' },
      { pattern: /password\s*=\s*["'][^"']+["']/gi, name: 'Password Assignment' },
      { pattern: /api[_-]?key\s*[:=]\s*["'][a-zA-Z0-9_-]{16,}["']?/gi, name: 'API Key' }
    ];

    let secretsFound = 0;
    const sourceDirs = ['src', 'scripts', 'test'];

    sourceDirs.forEach(dir => {
      const dirPath = path.join(this.projectRoot, dir);
      if (fs.existsSync(dirPath)) {
        this.scanDirectory(dirPath, (filePath, content) => {
          if (filePath.includes('node_modules')) return;

          secretPatterns.forEach(secretType => {
            const matches = content.match(secretType.pattern);
            if (matches) {
              secretsFound += matches.length;
              this.issues.push({
                type: 'secret',
                severity: 'critical',
                name: secretType.name,
                file: path.relative(this.projectRoot, filePath),
                count: matches.length
              });
            }
          });
        });
      }
    });

    if (secretsFound > 0) {
      console.log(`  ❌ ${secretsFound} potential secrets found`);
    } else {
      console.log('  ✅ No secrets detected');
    }
  }

  async quickFilePermissionsCheck() {
    console.log('\n🔒 Checking file permissions...');

    const sensitiveFiles = ['.env', '.env.local', '.env.production'];
    let permissionIssues = 0;

    sensitiveFiles.forEach(file => {
      const filePath = path.join(this.projectRoot, file);
      if (fs.existsSync(filePath)) {
        try {
          const stats = fs.statSync(filePath);
          const mode = stats.mode;

          // Check for world-readable
          if (mode & 0o004) {
            permissionIssues++;
            this.issues.push({
              type: 'permissions',
              severity: 'medium',
              file,
              issue: 'world-readable'
            });
          }
        } catch (error) {
          // Skip files that can't be accessed
        }
      }
    });

    if (permissionIssues > 0) {
      console.log(`  ⚠️  ${permissionIssues} file permission issues found`);
    } else {
      console.log('  ✅ File permissions look good');
    }
  }

  async quickConfigurationCheck() {
    console.log('\n⚙️  Checking security configuration...');

    let configIssues = 0;

    // Check for .gitignore
    const gitignorePath = path.join(this.projectRoot, '.gitignore');
    if (!fs.existsSync(gitignorePath)) {
      configIssues++;
      this.issues.push({
        type: 'configuration',
        severity: 'medium',
        issue: 'Missing .gitignore file'
      });
    }

    // Check package.json for security scripts
    try {
      const packageJson = JSON.parse(fs.readFileSync(path.join(this.projectRoot, 'package.json'), 'utf8'));
      const hasSecurityScripts = packageJson.scripts && (
        packageJson.scripts['test:security'] ||
        packageJson.scripts['security'] ||
        packageJson.scripts['audit']
      );

      if (!hasSecurityScripts) {
        this.issues.push({
          type: 'configuration',
          severity: 'low',
          issue: 'No security scripts in package.json'
        });
      }
    } catch (error) {
      configIssues++;
      this.issues.push({
        type: 'configuration',
        severity: 'high',
        issue: 'Invalid package.json'
      });
    }

    // Check for environment files
    const envFiles = ['.env.example', '.env.sample'];
    const hasEnvExample = envFiles.some(file => fs.existsSync(path.join(this.projectRoot, file)));

    if (!hasEnvExample) {
      this.issues.push({
        type: 'configuration',
        severity: 'low',
        issue: 'Missing environment example file'
      });
    }

    if (configIssues > 0) {
      console.log(`  ⚠️  ${configIssues} configuration issues found`);
    } else {
      console.log('  ✅ Security configuration looks good');
    }
  }

  scanDirectory(dir, callback) {
    if (!fs.existsSync(dir)) return;

    const items = fs.readdirSync(dir);
    items.forEach(item => {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        this.scanDirectory(itemPath, callback);
      } else if (stat.isFile() && (item.endsWith('.js') || item.endsWith('.ts') || item.endsWith('.json') || item.endsWith('.md'))) {
        try {
          const content = fs.readFileSync(itemPath, 'utf8');
          callback(itemPath, content);
        } catch (error) {
          // Skip files that can't be read
        }
      }
    });
  }

  generateQuickReport(duration) {
    console.log('\n' + '='.repeat(50));
    console.log('🚀 QUICK SECURITY SCAN RESULTS');
    console.log('='.repeat(50));
    console.log(`Scan completed in: ${(duration / 1000).toFixed(2)} seconds`);

    const criticalIssues = this.issues.filter(i => i.severity === 'critical').length;
    const highIssues = this.issues.filter(i => i.severity === 'high').length;
    const mediumIssues = this.issues.filter(i => i.severity === 'medium').length;
    const lowIssues = this.issues.filter(i => i.severity === 'low').length;

    console.log(`\n📊 Issues Found:`);
    console.log(`   🔴 Critical: ${criticalIssues}`);
    console.log(`   🟠 High: ${highIssues}`);
    console.log(`   🟡 Medium: ${mediumIssues}`);
    console.log(`   🔵 Low: ${lowIssues}`);

    if (this.issues.length === 0) {
      console.log('\n🎉 EXCELLENT! No security issues found.');
      console.log('✅ Your project appears to be secure');
      return;
    }

    if (criticalIssues > 0 || highIssues > 0) {
      console.log('\n🚨 CRITICAL ISSUES REQUIRING IMMEDIATE ATTENTION:');
      this.issues
        .filter(i => i.severity === 'critical' || i.severity === 'high')
        .forEach(issue => {
          const icon = issue.severity === 'critical' ? '🔴' : '🟠';
          console.log(`   ${icon} ${issue.type}: ${issue.name || issue.issue}`);
          if (issue.file) console.log(`      File: ${issue.file}`);
          if (issue.details) console.log(`      Details: ${issue.details}`);
        });
    }

    if (mediumIssues > 0) {
      console.log('\n⚠️  Medium Priority Issues:');
      this.issues
        .filter(i => i.severity === 'medium')
        .forEach(issue => {
          console.log(`   🟡 ${issue.type}: ${issue.name || issue.issue}`);
          if (issue.file) console.log(`      File: ${issue.file}`);
        });
    }

    console.log('\n💡 Quick Recommendations:');
    if (criticalIssues > 0) {
      console.log('   - STOP: Fix critical security issues immediately');
      console.log('   - Remove any hardcoded secrets or API keys');
      console.log('   - Update vulnerable dependencies');
    }
    if (highIssues > 0) {
      console.log('   - Address high-severity issues before deployment');
    }
    if (mediumIssues > 0) {
      console.log('   - Review and fix medium-severity issues');
    }
    if (lowIssues > 0) {
      console.log('   - Consider addressing low-severity issues for best practices');
    }

    console.log('\n🔧 To run a comprehensive security audit:');
    console.log('   npm run test:security:comprehensive');

    // Exit with appropriate code
    if (criticalIssues > 0) {
      process.exit(1); // Critical issues found
    } else if (highIssues > 0) {
      process.exit(2); // High issues found
    } else if (mediumIssues > 0) {
      process.exit(3); // Medium issues found
    } else {
      process.exit(0); // All good or only low issues
    }
  }
}

async function main() {
  const scanner = new QuickSecurityScan();
  await scanner.runQuickScan();
}

if (require.main === module) {
  main().catch(error => {
    console.error('Quick security scan failed:', error);
    process.exit(1);
  });
}

module.exports = QuickSecurityScan;