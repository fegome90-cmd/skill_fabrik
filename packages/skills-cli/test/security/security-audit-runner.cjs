/**
 * Security Audit Runner
 * Orchestrate comprehensive security audits with open source tools
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const EnterpriseSecurityTester = require('./enterprise-security-tester.cjs');

class SecurityAuditRunner {
  constructor() {
    this.auditResults = [];
    this.startTime = Date.now();
    this.projectRoot = path.join(__dirname, '../..');
  }

  async runComprehensiveAudit() {
    console.log('🔒 Starting Comprehensive Security Audit');
    console.log('=====================================');

    const auditPhases = [
      { name: 'Pre-Audit System Check', fn: () => this.preAuditCheck() },
      { name: 'Dependency Security Audit', fn: () => this.dependencyAudit() },
      { name: 'Code Security Analysis', fn: () => this.codeSecurityAudit() },
      { name: 'Infrastructure Security', fn: () => this.infrastructureSecurityAudit() },
      { name: 'Comprehensive Security Testing', fn: () => this.comprehensiveSecurityTesting() },
      { name: 'Security Score Calculation', fn: () => this.calculateSecurityScore() },
      { name: 'Report Generation', fn: () => this.generateAuditReport() }
    ];

    for (const phase of auditPhases) {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`🔍 ${phase.name}`);
      console.log('='.repeat(50));

      try {
        const result = await phase.fn();
        this.auditResults.push({
          phase: phase.name,
          success: true,
          duration: result.duration || 0,
          details: result.details || {},
          timestamp: Date.now()
        });
        console.log(`✅ ${phase.name} completed`);
      } catch (error) {
        this.auditResults.push({
          phase: phase.name,
          success: false,
          duration: 0,
          details: { error: error.message },
          timestamp: Date.now()
        });
        console.log(`❌ ${phase.name} failed: ${error.message}`);
      }
    }
  }

  async preAuditCheck() {
    console.log('Performing pre-audit system checks...');
    const startTime = Date.now();

    const checks = [];

    // Check if we're in the right directory
    try {
      const packageJsonPath = path.join(this.projectRoot, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        checks.push({ name: 'Project Structure', status: '✅ PASS' });
      } else {
        checks.push({ name: 'Project Structure', status: '❌ FAIL', message: 'package.json not found' });
      }
    } catch (error) {
      checks.push({ name: 'Project Structure', status: '❌ FAIL', message: error.message });
    }

    // Check Node.js version
    try {
      const nodeVersion = process.version;
      const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
      if (majorVersion >= 18) {
        checks.push({ name: 'Node.js Version', status: '✅ PASS', version: nodeVersion });
      } else {
        checks.push({ name: 'Node.js Version', status: '⚠️  WARN', version: nodeVersion, message: 'Consider upgrading to Node.js 18+' });
      }
    } catch (error) {
      checks.push({ name: 'Node.js Version', status: '❌ FAIL', message: error.message });
    }

    // Check if npm is available
    try {
      const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
      checks.push({ name: 'npm Available', status: '✅ PASS', version: npmVersion });
    } catch (error) {
      checks.push({ name: 'npm Available', status: '❌ FAIL', message: 'npm not available' });
    }

    // Check for security tools
    const securityTools = ['npm', 'node'];
    const availableTools = [];
    const missingTools = [];

    for (const tool of securityTools) {
      try {
        execSync(`${tool} --version`, { stdio: 'pipe' });
        availableTools.push(tool);
      } catch (error) {
        missingTools.push(tool);
      }
    }

    checks.push({
      name: 'Security Tools',
      status: availableTools.length === securityTools.length ? '✅ PASS' : '⚠️  WARN',
      available: availableTools,
      missing: missingTools
    });

    // Check file permissions for sensitive files
    const sensitiveFiles = ['.env', 'package.json'];
    for (const file of sensitiveFiles) {
      const filePath = path.join(this.projectRoot, file);
      if (fs.existsSync(filePath)) {
        try {
          const stats = fs.statSync(filePath);
          const mode = stats.mode.toString(8);
          const isSecure = !(mode & 0o004); // Not world-readable
          checks.push({
            name: `${file} Permissions`,
            status: isSecure ? '✅ PASS' : '⚠️  WARN',
            permissions: mode
          });
        } catch (error) {
          checks.push({ name: `${file} Permissions`, status: '❌ FAIL', message: error.message });
        }
      }
    }

    return {
      duration: Date.now() - startTime,
      details: { checks, totalChecks: checks.length, passedChecks: checks.filter(c => c.status === '✅ PASS').length }
    };
  }

  async dependencyAudit() {
    console.log('Running dependency security audit...');
    const startTime = Date.now();

    const auditResults = [];

    try {
      // npm audit
      console.log('  Running npm audit...');
      const auditOutput = execSync('npm audit --json', {
        encoding: 'utf8',
        cwd: this.projectRoot,
        timeout: 60000
      });

      const auditData = JSON.parse(auditOutput);
      const vulnerabilities = auditData.metadata?.vulnerabilities || {};

      auditResults.push({
        tool: 'npm audit',
        total: vulnerabilities.total || 0,
        critical: vulnerabilities.critical || 0,
        high: vulnerabilities.high || 0,
        moderate: vulnerabilities.moderate || 0,
        low: vulnerabilities.low || 0,
        info: vulnerabilities.info || 0
      });

      console.log(`  ✅ npm audit completed: ${vulnerabilities.total || 0} vulnerabilities found`);
    } catch (error) {
      // npm audit returns non-zero when vulnerabilities are found
      try {
        const auditData = JSON.parse(error.stdout);
        const vulnerabilities = auditData.metadata?.vulnerabilities || {};

        auditResults.push({
          tool: 'npm audit',
          total: vulnerabilities.total || 0,
          critical: vulnerabilities.critical || 0,
          high: vulnerabilities.high || 0,
          moderate: vulnerabilities.moderate || 0,
          low: vulnerabilities.low || 0,
          info: vulnerabilities.info || 0
        });

        console.log(`  ⚠️  npm audit found ${vulnerabilities.total || 0} vulnerabilities`);
      } catch (parseError) {
        auditResults.push({
          tool: 'npm audit',
          error: error.message,
          status: 'failed'
        });
        console.log(`  ❌ npm audit failed: ${error.message}`);
      }
    }

    // Check for outdated packages
    try {
      console.log('  Checking outdated packages...');
      const outdatedOutput = execSync('npm outdated --json', {
        encoding: 'utf8',
        cwd: this.projectRoot,
        timeout: 30000
      });

      const outdatedData = JSON.parse(outdatedOutput);
      const outdatedCount = Object.keys(outdatedData).length;

      auditResults.push({
        tool: 'npm outdated',
        outdatedPackages: outdatedCount,
        packages: Object.keys(outdatedData)
      });

      console.log(`  ✅ ${outdatedCount} outdated packages found`);
    } catch (error) {
      auditResults.push({
        tool: 'npm outdated',
        outdatedPackages: 0,
        status: 'none'
      });
      console.log(`  ℹ️  No outdated packages or check failed`);
    }

    // Try Snyk if available
    try {
      console.log('  Running Snyk scan...');
      const snykOutput = execSync('snyk test --json', {
        encoding: 'utf8',
        cwd: this.projectRoot,
        timeout: 60000
      });

      const snykData = JSON.parse(snykOutput);
      auditResults.push({
        tool: 'Snyk',
        vulnerabilities: snykData.vulnerabilities?.length || 0,
        summary: snykData.summary
      });

      console.log(`  ✅ Snyk scan completed: ${snykData.vulnerabilities?.length || 0} vulnerabilities`);
    } catch (error) {
      auditResults.push({
        tool: 'Snyk',
        status: 'unavailable',
        message: 'Snyk not installed or configured'
      });
      console.log(`  ⚠️  Snyk not available`);
    }

    return {
      duration: Date.now() - startTime,
      details: { auditResults, toolsRun: auditResults.length }
    };
  }

  async codeSecurityAudit() {
    console.log('Running code security audit...');
    const startTime = Date.now();

    const securityTester = new EnterpriseSecurityTester();

    // Run specific security tests from the comprehensive tester
    const codeTests = [
      { name: 'Code Security Analysis', method: 'testCodeSecurity' },
      { name: 'Secrets Detection', method: 'testSecretsDetection' },
      { name: 'Input Validation Security', method: 'testInputValidation' },
      { name: 'Authentication & Authorization', method: 'testAuthSecurity' }
    ];

    const results = [];

    for (const test of codeTests) {
      try {
        console.log(`  Running ${test.name}...`);
        const result = await securityTester[test.method]();
        results.push({
          test: test.name,
          success: result.success,
          vulnerabilities: result.vulnerabilities?.length || 0,
          details: result.details
        });
        console.log(`  ✅ ${test.name}: ${result.vulnerabilities?.length || 0} issues found`);
      } catch (error) {
        results.push({
          test: test.name,
          success: false,
          error: error.message
        });
        console.log(`  ❌ ${test.name} failed: ${error.message}`);
      }
    }

    return {
      duration: Date.now() - startTime,
      details: { tests: results, totalVulnerabilities: results.reduce((sum, r) => sum + (r.vulnerabilities || 0), 0) }
    };
  }

  async infrastructureSecurityAudit() {
    console.log('Running infrastructure security audit...');
    const startTime = Date.now();

    const infraResults = [];

    // Check file permissions
    const securityTester = new EnterpriseSecurityTester();
    try {
      const permResult = await securityTester.testFilePermissions();
      infraResults.push({
        name: 'File Permissions',
        success: permResult.success,
        issues: permResult.vulnerabilities?.length || 0,
        details: permResult.details
      });
    } catch (error) {
      infraResults.push({
        name: 'File Permissions',
        success: false,
        error: error.message
      });
    }

    // Check network security
    try {
      const netResult = await securityTester.testNetworkSecurity();
      infraResults.push({
        name: 'Network Security',
        success: netResult.success,
        issues: netResult.vulnerabilities?.length || 0,
        details: netResult.details
      });
    } catch (error) {
      infraResults.push({
        name: 'Network Security',
        success: false,
        error: error.message
      });
    }

    // Check security configuration
    try {
      const configResult = await securityTester.testSecurityConfiguration();
      infraResults.push({
        name: 'Security Configuration',
        success: configResult.success,
        issues: configResult.vulnerabilities?.length || 0,
        details: configResult.details
      });
    } catch (error) {
      infraResults.push({
        name: 'Security Configuration',
        success: false,
        error: error.message
      });
    }

    // Check for common security files and configurations
    const securityFiles = [
      '.gitignore',
      '.env.example',
      'package.json',
      'README.md'
    ];

    const missingFiles = [];
    for (const file of securityFiles) {
      const filePath = path.join(this.projectRoot, file);
      if (!fs.existsSync(filePath)) {
        missingFiles.push(file);
      }
    }

    infraResults.push({
      name: 'Security Files Present',
      success: missingFiles.length === 0,
      missingFiles,
      totalFiles: securityFiles.length,
      presentFiles: securityFiles.length - missingFiles.length
    });

    return {
      duration: Date.now() - startTime,
      details: { infrastructure: infraResults, totalChecks: infraResults.length }
    };
  }

  async comprehensiveSecurityTesting() {
    console.log('Running comprehensive security testing...');
    const startTime = Date.now();

    const securityTester = new EnterpriseSecurityTester();

    // Run the full security test suite
    try {
      await securityTester.runAllSecurityTests();

      const testResults = securityTester.testResults;
      const totalVulnerabilities = testResults.reduce((sum, r) => sum + (r.vulnerabilities?.length || 0), 0);
      const criticalVulns = testResults.reduce((sum, r) =>
        sum + (r.vulnerabilities?.filter(v => v.severity === 'critical').length || 0), 0);
      const highVulns = testResults.reduce((sum, r) =>
        sum + (r.vulnerabilities?.filter(v => v.severity === 'high').length || 0), 0);

      return {
        duration: Date.now() - startTime,
        details: {
          totalTests: testResults.length,
          totalVulnerabilities,
          criticalVulnerabilities: criticalVulns,
          highVulnerabilities: highVulns,
          testResults: testResults.map(r => ({
            test: r.test,
            success: r.success,
            vulnerabilities: r.vulnerabilities?.length || 0
          }))
        }
      };
    } catch (error) {
      return {
        duration: Date.now() - startTime,
        details: { error: error.message, status: 'failed' }
      };
    }
  }

  async calculateSecurityScore() {
    console.log('Calculating security score...');
    const startTime = Date.now();

    let score = 100; // Start with perfect score
    const deductions = [];

    // Analyze dependency audit results
    const depAudit = this.auditResults.find(r => r.phase === 'Dependency Security Audit');
    if (depAudit && depAudit.details.auditResults) {
      depAudit.details.auditResults.forEach(result => {
        if (result.tool === 'npm audit') {
          score -= result.critical * 10; // -10 points per critical
          score -= result.high * 5;      // -5 points per high
          score -= result.moderate * 2; // -2 points per moderate
          score -= result.low * 1;       // -1 point per low

          if (result.critical > 0) {
            deductions.push(`Critical dependency vulnerabilities: -${result.critical * 10} points`);
          }
          if (result.high > 0) {
            deductions.push(`High dependency vulnerabilities: -${result.high * 5} points`);
          }
        }
      });
    }

    // Analyze code security results
    const codeAudit = this.auditResults.find(r => r.phase === 'Code Security Audit');
    if (codeAudit && codeAudit.details.tests) {
      const totalCodeVulns = codeAudit.details.tests.reduce((sum, t) => sum + (t.vulnerabilities || 0), 0);
      score -= totalCodeVulns * 3; // -3 points per code vulnerability

      if (totalCodeVulns > 0) {
        deductions.push(`Code security issues: -${totalCodeVulns * 3} points`);
      }
    }

    // Analyze infrastructure security
    const infraAudit = this.auditResults.find(r => r.phase === 'Infrastructure Security Audit');
    if (infraAudit && infraAudit.details.infrastructure) {
      const totalInfraIssues = infraAudit.details.infrastructure.reduce((sum, i) => sum + (i.issues || 0), 0);
      score -= totalInfraIssues * 2; // -2 points per infrastructure issue

      if (totalInfraIssues > 0) {
        deductions.push(`Infrastructure security issues: -${totalInfraIssues * 2} points`);
      }
    }

    // Ensure score doesn't go below 0
    score = Math.max(0, score);

    // Determine security grade
    let grade;
    if (score >= 90) grade = 'A+';
    else if (score >= 80) grade = 'A';
    else if (score >= 70) grade = 'B';
    else if (score >= 60) grade = 'C';
    else if (score >= 50) grade = 'D';
    else grade = 'F';

    return {
      duration: Date.now() - startTime,
      details: {
        score,
        grade,
        maxScore: 100,
        deductions,
        assessment: this.getSecurityAssessment(score, grade)
      }
    };
  }

  getSecurityAssessment(score, grade) {
    if (score >= 90) {
      return {
        level: 'Excellent',
        readiness: 'Production Ready',
        message: 'Outstanding security posture. System meets enterprise security standards.',
        recommendations: ['Continue regular security monitoring', 'Maintain current security practices']
      };
    } else if (score >= 80) {
      return {
        level: 'Good',
        readiness: 'Production Ready with Minor Improvements',
        message: 'Strong security posture with some areas for improvement.',
        recommendations: ['Address remaining security issues', 'Implement additional security controls']
      };
    } else if (score >= 70) {
      return {
        level: 'Fair',
        readiness: 'Needs Improvement Before Production',
        message: 'Adequate security but requires attention before production deployment.',
        recommendations: ['Prioritize fixing high-severity issues', 'Enhance security controls']
      };
    } else if (score >= 60) {
      return {
        level: 'Poor',
        readiness: 'Not Production Ready',
        message: 'Significant security issues that must be addressed.',
        recommendations: ['Immediate action required for critical issues', 'Comprehensive security review needed']
      };
    } else {
      return {
        level: 'Critical',
        readiness: 'Not Production Ready',
        message: 'Critical security vulnerabilities require immediate attention.',
        recommendations: ['Stop and fix all critical issues', 'Complete security overhaul required']
      };
    }
  }

  async generateAuditReport() {
    console.log('Generating comprehensive audit report...');
    const startTime = Date.now();

    const endTime = Date.now();
    const totalDuration = endTime - this.startTime;

    const scoreResult = this.auditResults.find(r => r.phase === 'Security Score Calculation');
    const score = scoreResult?.details.score || 0;
    const grade = scoreResult?.details.grade || 'F';

    console.log('\n' + '='.repeat(80));
    console.log('🔒 COMPREHENSIVE SECURITY AUDIT REPORT');
    console.log('='.repeat(80));
    console.log(`Audit completed in: ${(totalDuration / 1000).toFixed(2)} seconds`);
    console.log(`Overall Security Score: ${score}/100 (${grade})`);
    console.log('');

    // Phase summary
    console.log('📋 Audit Phase Summary:');
    this.auditResults.forEach(result => {
      const status = result.success ? '✅' : '❌';
      const duration = result.duration ? `(${result.duration}ms)` : '';
      console.log(`   ${status} ${result.phase} ${duration}`);
    });

    // Security assessment
    if (scoreResult && scoreResult.details.assessment) {
      const assessment = scoreResult.details.assessment;
      console.log(`\n🎯 Security Assessment: ${assessment.level}`);
      console.log(`🚦 Production Readiness: ${assessment.readiness}`);
      console.log(`💬 ${assessment.message}`);
    }

    // Score breakdown
    if (scoreResult && scoreResult.details.deductions.length > 0) {
      console.log('\n📊 Score Breakdown:');
      console.log('   Starting score: 100');
      scoreResult.details.deductions.forEach(deduction => {
        console.log(`   - ${deduction}`);
      });
      console.log(`   Final score: ${score}/100`);
    }

    // Recommendations
    if (scoreResult && scoreResult.details.assessment.recommendations) {
      console.log('\n💡 Recommendations:');
      scoreResult.details.assessment.recommendations.forEach(rec => {
        console.log(`   • ${rec}`);
      });
    }

    // Save detailed report
    const reportPath = path.join(this.projectRoot, 'test/security/security-reports', `comprehensive-audit-${new Date().toISOString().split('T')[0]}.json`);

    const detailedReport = {
      summary: {
        totalDuration,
        securityScore: score,
        securityGrade: grade,
        phasesCompleted: this.auditResults.length,
        successfulPhases: this.auditResults.filter(r => r.success).length,
        timestamp: new Date().toISOString()
      },
      phases: this.auditResults,
      assessment: scoreResult?.details.assessment,
      recommendations: scoreResult?.details.assessment?.recommendations || []
    };

    try {
      const reportsDir = path.dirname(reportPath);
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }
      fs.writeFileSync(reportPath, JSON.stringify(detailedReport, null, 2));
      console.log(`\n📁 Detailed audit report saved to: ${reportPath}`);
    } catch (error) {
      console.log(`\n⚠️  Could not save detailed report: ${error.message}`);
    }

    return {
      duration: Date.now() - startTime,
      details: { reportGenerated: true, reportPath, score, grade }
    };
  }
}

async function main() {
  const auditRunner = new SecurityAuditRunner();
  await auditRunner.runComprehensiveAudit();
}

if (require.main === module) {
  main().catch(error => {
    console.error('Security audit failed:', error);
    process.exit(1);
  });
}

module.exports = SecurityAuditRunner;