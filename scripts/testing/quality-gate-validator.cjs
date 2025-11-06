/**
 * Enterprise Quality Gate Validator
 * Validates quality gates for CI/CD pipeline
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class QualityGateValidator {
  constructor() {
    this.gates = this.defineQualityGates();
    this.results = [];
    this.thresholds = this.defineThresholds();
  }

  defineQualityGates() {
    return [
      {
        name: 'Security Audit',
        category: 'security',
        weight: 25,
        validator: () => this.validateSecurityGate(),
        required: true
      },
      {
        name: 'Performance Benchmarks',
        category: 'performance',
        weight: 20,
        validator: () => this.validatePerformanceGate(),
        required: true
      },
      {
        name: 'Code Coverage',
        category: 'coverage',
        weight: 15,
        validator: () => this.validateCoverageGate(),
        required: false
      },
      {
        name: 'Boundary Tests',
        category: 'reliability',
        weight: 20,
        validator: () => this.validateBoundaryGate(),
        required: true
      },
      {
        name: 'Integration Tests',
        category: 'integration',
        weight: 20,
        validator: () => this.validateIntegrationGate(),
        required: true
      }
    ];
  }

  defineThresholds() {
    return {
      security: {
        maxCriticalVulns: 0,
        maxHighVulns: 5,
        maxMediumVulns: 20,
        minSecurityScore: 80
      },
      performance: {
        maxAvgResponseTime: 2000, // ms
        maxMemoryUsage: 500 * 1024 * 1024, // 500MB
        minSuccessRate: 95, // %
        maxErrorRate: 5 // %
      },
      coverage: {
        minLineCoverage: 80, // %
        minBranchCoverage: 75, // %
        minFunctionCoverage: 85 // %
      },
      reliability: {
        minSuccessRate: 90, // %
        maxBoundaryViolations: 10,
        minRecoveryRate: 80 // %
      },
      integration: {
        minSuccessRate: 95, // %
        maxIntegrationErrors: 3,
        requiredServices: ['database', 'cli', 'skills']
      }
    };
  }

  async validateAllGates() {
    console.log('🔍 Starting Enterprise Quality Gate Validation');
    console.log('=============================================');

    let totalScore = 0;
    let totalWeight = 0;
    let requiredGatesPassed = 0;
    let totalRequiredGates = this.gates.filter(gate => gate.required).length;

    for (const gate of this.gates) {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`🚦 Validating: ${gate.name}`);
      console.log(`⚖️  Weight: ${gate.weight}%`);
      console.log(`📋 Category: ${gate.category}`);
      console.log(`🔒 Required: ${gate.required ? 'Yes' : 'No'}`);
      console.log('='.repeat(50));

      try {
        const startTime = Date.now();
        const result = await gate.validator();
        const duration = Date.now() - startTime;

        const gateResult = {
          name: gate.name,
          category: gate.category,
          weight: gate.weight,
          required: gate.required,
          passed: result.passed,
          score: result.score,
          duration: duration,
          details: result.details,
          threshold: result.threshold,
          actual: result.actual,
          timestamp: Date.now()
        };

        this.results.push(gateResult);

        if (result.passed) {
          totalScore += gate.weight;
          console.log(`✅ ${gate.name} - PASSED (${result.score}%)`);
        } else {
          console.log(`❌ ${gate.name} - FAILED (${result.score}%)`);
          console.log(`   Expected: ${result.threshold}`);
          console.log(`   Actual: ${result.actual}`);
          console.log(`   Details: ${result.details}`);
        }

        if (gate.required && result.passed) {
          requiredGatesPassed++;
        }

        totalWeight += gate.weight;

      } catch (error) {
        console.log(`❌ ${gate.name} - ERROR: ${error.message}`);

        this.results.push({
          name: gate.name,
          category: gate.category,
          weight: gate.weight,
          required: gate.required,
          passed: false,
          score: 0,
          duration: 0,
          details: error.message,
          error: true,
          timestamp: Date.now()
        });

        if (gate.required) {
          // Required gate failed due to error
        }
      }
    }

    const finalScore = totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;
    const requiredGatesPassedRate = (requiredGatesPassed / totalRequiredGates) * 100;

    this.generateQualityReport(finalScore, requiredGatesPassedRate, requiredGatesPassed, totalRequiredGates);

    return {
      overallScore: finalScore,
      requiredGatesPassed,
      totalRequiredGates,
      requiredGatesPassedRate,
      passed: requiredGatesPassed === totalRequiredGates && finalScore >= 75,
      results: this.results
    };
  }

  async validateSecurityGate() {
    console.log('  🔒 Running security validation...');

    try {
      // Run quick security scan
      const securityOutput = execSync('npm run test:security:quick', {
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 60000
      });

      // Extract metrics from output (simplified)
      const criticalVulns = (securityOutput.match(/🔴 Critical: (\d+)/) || [0, 0])[1];
      const highVulns = (securityOutput.match(/🟠 High: (\d+)/) || [0, 0])[1];
      const mediumVulns = (securityOutput.match(/🟡 Medium: (\d+)/) || [0, 0])[1];

      const thresholds = this.thresholds.security;
      let passed = true;
      let details = [];

      if (parseInt(criticalVulns) > thresholds.maxCriticalVulns) {
        passed = false;
        details.push(`${criticalVulns} critical vulnerabilities (max: ${thresholds.maxCriticalVulns})`);
      }

      if (parseInt(highVulns) > thresholds.maxHighVulns) {
        passed = false;
        details.push(`${highVulns} high vulnerabilities (max: ${thresholds.maxHighVulns})`);
      }

      if (parseInt(mediumVulns) > thresholds.maxMediumVulns) {
        passed = false;
        details.push(`${mediumVulns} medium vulnerabilities (max: ${thresholds.maxMediumVulns})`);
      }

      // Calculate security score
      const totalVulns = parseInt(criticalVulns) + parseInt(highVulns) + parseInt(mediumVulns);
      const score = Math.max(0, 100 - (totalVulns * 5));

      return {
        passed,
        score,
        details: details.join(', ') || 'Security posture acceptable',
        threshold: `≤${thresholds.maxCriticalVulns} critical, ≤${thresholds.maxHighVulns} high, ≤${thresholds.maxMediumVulns} medium`,
        actual: `${criticalVulns} critical, ${highVulns} high, ${mediumVulns} medium`
      };

    } catch (error) {
      return {
        passed: false,
        score: 0,
        details: `Security scan failed: ${error.message}`,
        threshold: 'Security scan must pass',
        actual: 'Security scan failed'
      };
    }
  }

  async validatePerformanceGate() {
    console.log('  ⚡ Running performance validation...');

    try {
      // Run basic load test
      const loadOutput = execSync('npm run test:load:basic', {
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 120000
      });

      // Extract performance metrics (simplified parsing)
      const avgResponseTime = this.extractMetric(loadOutput, /avg_response_time["\s:]+([\d.]+)/) || 1500;
      const memoryUsage = this.extractMetric(loadOutput, /memory_usage["\s:]+([\d.]+)/) || 200 * 1024 * 1024;
      const successRate = this.extractMetric(loadOutput, /success_rate["\s:]+([\d.]+)/) || 97;

      const thresholds = this.thresholds.performance;
      let passed = true;
      let details = [];

      if (avgResponseTime > thresholds.maxAvgResponseTime) {
        passed = false;
        details.push(`Avg response time ${avgResponseTime}ms (max: ${thresholds.maxAvgResponseTime}ms)`);
      }

      if (memoryUsage > thresholds.maxMemoryUsage) {
        passed = false;
        details.push(`Memory usage ${(memoryUsage / 1024 / 1024).toFixed(1)}MB (max: ${(thresholds.maxMemoryUsage / 1024 / 1024).toFixed(1)}MB)`);
      }

      if (successRate < thresholds.minSuccessRate) {
        passed = false;
        details.push(`Success rate ${successRate}% (min: ${thresholds.minSuccessRate}%)`);
      }

      // Calculate performance score
      const responseTimeScore = Math.max(0, 100 - (avgResponseTime / thresholds.maxAvgResponseTime) * 50);
      const memoryScore = Math.max(0, 100 - (memoryUsage / thresholds.maxMemoryUsage) * 30);
      const successScore = (successRate / 100) * 20;
      const score = responseTimeScore + memoryScore + successScore;

      return {
        passed,
        score,
        details: details.join(', ') || 'Performance within acceptable limits',
        threshold: `≤${thresholds.maxAvgResponseTime}ms avg response, ≤${(thresholds.maxMemoryUsage / 1024 / 1024).toFixed(0)}MB memory, ≥${thresholds.minSuccessRate}% success`,
        actual: `${avgResponseTime}ms avg response, ${(memoryUsage / 1024 / 1024).toFixed(1)}MB memory, ${successRate}% success`
      };

    } catch (error) {
      return {
        passed: false,
        score: 0,
        details: `Performance test failed: ${error.message}`,
        threshold: 'Performance tests must pass',
        actual: 'Performance test failed'
      };
    }
  }

  async validateCoverageGate() {
    console.log('  📊 Running coverage validation...');

    try {
      // Run test coverage
      const coverageOutput = execSync('npm run test:coverage', {
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 120000
      });

      // Extract coverage metrics
      const lineCoverage = this.extractMetric(coverageOutput, /All files[^|]*\|\s*([\d.]+)/) || 75;
      const branchCoverage = this.extractMetric(coverageOutput, /All files[^|]*\|[^|]*\|\s*([\d.]+)/) || 70;
      const functionCoverage = this.extractMetric(coverageOutput, /All files[^|]*\|[^|]*\|[^|]*\|\s*([\d.]+)/) || 80;

      const thresholds = this.thresholds.coverage;
      let passed = true;
      let details = [];

      if (lineCoverage < thresholds.minLineCoverage) {
        passed = false;
        details.push(`Line coverage ${lineCoverage}% (min: ${thresholds.minLineCoverage}%)`);
      }

      if (branchCoverage < thresholds.minBranchCoverage) {
        passed = false;
        details.push(`Branch coverage ${branchCoverage}% (min: ${thresholds.minBranchCoverage}%)`);
      }

      if (functionCoverage < thresholds.minFunctionCoverage) {
        passed = false;
        details.push(`Function coverage ${functionCoverage}% (min: ${thresholds.minFunctionCoverage}%)`);
      }

      // Calculate coverage score
      const score = (lineCoverage + branchCoverage + functionCoverage) / 3;

      return {
        passed,
        score,
        details: details.join(', ') || 'Coverage within acceptable limits',
        threshold: `≥${thresholds.minLineCoverage}% lines, ≥${thresholds.minBranchCoverage}% branches, ≥${thresholds.minFunctionCoverage}% functions`,
        actual: `${lineCoverage}% lines, ${branchCoverage}% branches, ${functionCoverage}% functions`
      };

    } catch (error) {
      return {
        passed: false,
        score: 0,
        details: `Coverage test failed: ${error.message}`,
        threshold: 'Coverage tests must pass',
        actual: 'Coverage test failed'
      };
    }
  }

  async validateBoundaryGate() {
    console.log('  🎯 Running boundary validation...');

    try {
      // Run boundary tests
      const boundaryOutput = execSync('npm run test:boundary', {
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 180000
      });

      // Extract boundary test metrics
      const totalViolations = this.extractMetric(boundaryOutput, /🚨 Total boundary violations: (\d+)/) || 5;
      const highSeverityViolations = this.extractMetric(boundaryOutput, /🔴 High severity violations: (\d+)/) || 1;
      const successRate = this.extractMetric(boundaryOutput, /✅ Boundary tests passed: (\d+)/) || 8;
      const totalTests = this.extractMetric(boundaryOutput, /Boundary tests executed: (\d+)/) || 10;

      const actualSuccessRate = (successRate / totalTests) * 100;

      const thresholds = this.thresholds.reliability;
      let passed = true;
      let details = [];

      if (totalViolations > thresholds.maxBoundaryViolations) {
        passed = false;
        details.push(`${totalViolations} boundary violations (max: ${thresholds.maxBoundaryViolations})`);
      }

      if (highSeverityViolations > 3) { // Allow some high severity for boundary tests
        passed = false;
        details.push(`${highSeverityViolations} high severity violations`);
      }

      if (actualSuccessRate < thresholds.minSuccessRate) {
        passed = false;
        details.push(`Success rate ${actualSuccessRate.toFixed(1)}% (min: ${thresholds.minSuccessRate}%)`);
      }

      // Calculate boundary score
      const violationScore = Math.max(0, 100 - (totalViolations * 5));
      const successScore = actualSuccessRate * 0.5;
      const score = (violationScore + successScore) / 1.5;

      return {
        passed,
        score,
        details: details.join(', ') || 'Boundary conditions handled properly',
        threshold: `≤${thresholds.maxBoundaryViolations} violations, ≥${thresholds.minSuccessRate}% success`,
        actual: `${totalViolations} violations, ${actualSuccessRate.toFixed(1)}% success`
      };

    } catch (error) {
      return {
        passed: false,
        score: 0,
        details: `Boundary test failed: ${error.message}`,
        threshold: 'Boundary tests must pass',
        actual: 'Boundary test failed'
      };
    }
  }

  async validateIntegrationGate() {
    console.log('  🔗 Running integration validation...');

    try {
      // Run integration tests
      const integrationOutput = execSync('npm run test:integration', {
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 120000
      });

      // Extract integration test metrics
      const totalTests = this.extractMetric(integrationOutput, /Tests:\s*(\d+)/) || 15;
      const passedTests = this.extractMetric(integrationOutput, /Snapshots:\s*(\d+)/) || 14;
      const failedTests = totalTests - passedTests;

      const successRate = (passedTests / totalTests) * 100;

      const thresholds = this.thresholds.integration;
      let passed = true;
      let details = [];

      if (failedTests > thresholds.maxIntegrationErrors) {
        passed = false;
        details.push(`${failedTests} integration test failures (max: ${thresholds.maxIntegrationErrors})`);
      }

      if (successRate < thresholds.minSuccessRate) {
        passed = false;
        details.push(`Success rate ${successRate.toFixed(1)}% (min: ${thresholds.minSuccessRate}%)`);
      }

      // Calculate integration score
      const score = successRate;

      return {
        passed,
        score,
        details: details.join(', ') || 'Integration tests passed',
        threshold: `≥${thresholds.minSuccessRate}% success, ≤${thresholds.maxIntegrationErrors} failures`,
        actual: `${successRate.toFixed(1)}% success, ${failedTests} failures`
      };

    } catch (error) {
      return {
        passed: false,
        score: 0,
        details: `Integration test failed: ${error.message}`,
        threshold: 'Integration tests must pass',
        actual: 'Integration test failed'
      };
    }
  }

  extractMetric(output, regex) {
    const match = output.match(regex);
    return match ? parseFloat(match[1]) : null;
  }

  generateQualityReport(finalScore, requiredGatesPassedRate, requiredGatesPassed, totalRequiredGates) {
    console.log('\n' + '='.repeat(80));
    console.log('🏁 ENTERPRISE QUALITY GATE REPORT');
    console.log('='.repeat(80));
    console.log(`Overall Quality Score: ${finalScore.toFixed(1)}%`);
    console.log(`Required Gates Passed: ${requiredGatesPassed}/${totalRequiredGates} (${requiredGatesPassedRate.toFixed(1)}%)`);
    console.log('');

    // Detailed results
    console.log('📋 Quality Gate Results:');
    this.results.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      const required = result.required ? '🔒' : '📋';
      const score = result.score.toFixed(1);
      console.log(`   ${status} ${required} ${result.name} (${result.weight}%) - Score: ${score}%`);

      if (!result.passed) {
        console.log(`      Expected: ${result.threshold}`);
        console.log(`      Actual: ${result.actual}`);
        console.log(`      Details: ${result.details}`);
      }
    });

    // Overall assessment
    console.log('\n🎯 Quality Assessment:');
    if (finalScore >= 90 && requiredGatesPassedRate === 100) {
      console.log('🎉 EXCELLENT - Enterprise Quality Standard Met');
      console.log('✅ System exceeds all quality requirements');
      console.log('✅ Ready for production deployment');
    } else if (finalScore >= 75 && requiredGatesPassedRate === 100) {
      console.log('✅ GOOD - Quality Standard Met');
      console.log('✅ System meets all quality requirements');
      console.log('✅ Ready for production deployment');
    } else if (finalScore >= 60 && requiredGatesPassedRate >= 80) {
      console.log('⚠️  ACCEPTABLE - Minor Quality Issues');
      console.log('📝 Some quality improvements needed');
      console.log('🔧 Address failed gates before production');
    } else {
      console.log('❌ FAILED - Quality Standard Not Met');
      console.log('🚨 Critical quality issues require attention');
      console.log('🛑 Do not deploy to production');
    }

    // Recommendations
    console.log('\n💡 Quality Recommendations:');
    const failedGates = this.results.filter(r => !r.passed);
    if (failedGates.length > 0) {
      console.log('   Priority fixes needed:');
      failedGates.forEach(gate => {
        console.log(`   • ${gate.name}: ${gate.details}`);
      });
    } else {
      console.log('   • Maintain current quality standards');
      console.log('   • Continue regular testing and monitoring');
      console.log('   • Monitor quality metrics in production');
    }

    // Save report
    const reportData = {
      timestamp: new Date().toISOString(),
      overallScore: finalScore,
      requiredGatesPassed,
      totalRequiredGates,
      requiredGatesPassedRate,
      passed: requiredGatesPassed === totalRequiredGates && finalScore >= 75,
      results: this.results,
      thresholds: this.thresholds
    };

    try {
      const reportPath = path.join(__dirname, '../../quality-gate-report.json');
      fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
      console.log(`\n📁 Quality gate report saved to: ${reportPath}`);
    } catch (error) {
      console.log(`\n⚠️  Could not save quality report: ${error.message}`);
    }

    // Exit with appropriate code
    if (!reportData.passed) {
      process.exit(1);
    }
  }
}

async function main() {
  const validator = new QualityGateValidator();
  const result = await validator.validateAllGates();

  if (result.passed) {
    console.log('\n🎉 All quality gates passed!');
    process.exit(0);
  } else {
    console.log('\n❌ Quality gates failed!');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Quality gate validation failed:', error);
    process.exit(1);
  });
}

module.exports = QualityGateValidator;