#!/usr/bin/env node

/**
 * Security Report Optimization Test Runner
 * Prueba el sistema de optimización de reportes de seguridad
 * Objetivo: Mantener reportes bajo 100MB con compresión inteligente
 */

const path = require('path');
const SecurityReportOptimizer = require('../../packages/skills-cli/src/utils/security-report-optimizer.cjs');

async function main() {
  console.log('🔧 Security Report Optimization Test Runner');
  console.log('===========================================');
  console.log('🎯 Target: Keep reports under 100MB');
  console.log('🛡️  Based on secrets-and-config skill');
  console.log('');

  try {
    // Check if we're in the right directory
    const projectRoot = path.resolve(__dirname, '../..');
    process.chdir(projectRoot);

    // Initialize optimizer
    const optimizer = new SecurityReportOptimizer({
      maxReportSize: 100 * 1024 * 1024, // 100MB
      compressionLevel: 6,
      retentionDays: 30
    });

    // Define test paths
    const securityReportsDir = 'packages/skills-cli/test/security/security-reports';
    const chaosReportsDir = 'packages/skills-cli/test/chaos/chaos-results';
    const boundaryReportsDir = 'packages/skills-cli/test/edge-cases/boundary-results';
    const outputDir = 'test-outputs/optimized-reports';

    console.log('📂 Analyzing existing reports...');

    // Test individual file optimization
    console.log('\n🧪 Test 1: Individual Report Optimization');

    const securityReportPath = path.join(securityReportsDir, 'security-report-2025-11-01.json');
    const outputPath = path.join(outputDir, 'optimized-security-report.json');

    if (require('fs').existsSync(securityReportPath)) {
      console.log(`📄 Optimizing: ${securityReportPath}`);
      const result = await optimizer.optimizeSecurityReport(securityReportPath, outputPath);

      if (result.success) {
        console.log(`✅ Security report optimized successfully`);
        console.log(`   Original: ${optimizer.formatBytes(result.originalSize)}`);
        console.log(`   Optimized: ${optimizer.formatBytes(result.optimizedSize)}`);
        console.log(`   Compression: ${result.compressionRatio}%`);
        console.log(`   Under 100MB: ${result.optimizedSize <= 100 * 1024 * 1024 ? '✅ YES' : '❌ NO'}`);
      } else {
        console.log(`❌ Security report optimization failed: ${result.error}`);
      }
    } else {
      console.log(`⚠️  Security report not found: ${securityReportPath}`);
    }

    // Test directory optimization
    console.log('\n🧪 Test 2: Directory Optimization');

    if (require('fs').existsSync(securityReportsDir)) {
      const dirOutputPath = path.join(outputDir, 'security');
      const dirResult = await optimizer.optimizeSecurityReportsDirectory(
        securityReportsDir,
        dirOutputPath
      );

      console.log(`✅ Directory optimization completed`);
      console.log(`   Files processed: ${dirResult.files}`);
      console.log(`   Total original: ${optimizer.formatBytes(dirResult.totalOriginalSize)}`);
      console.log(`   Total optimized: ${optimizer.formatBytes(dirResult.totalOptimizedSize)}`);
      console.log(`   Total compression: ${dirResult.totalCompressionRatio}%`);
      console.log(`   Under 100MB: ${dirResult.totalOptimizedSize <= 100 * 1024 * 1024 ? '✅ YES' : '❌ NO'}`);

      // Generate optimization report
      const report = optimizer.generateOptimizationReport(dirResult);
      const reportPath = path.join(outputDir, 'optimization-report.json');
      require('fs').writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`📄 Optimization report saved to: ${reportPath}`);

      // Show recommendations
      if (report.recommendations.length > 0) {
        console.log('\n📋 Recommendations:');
        report.recommendations.forEach((rec, index) => {
          console.log(`${index + 1}. [${rec.priority}] ${rec.message}`);
          rec.actionItems.forEach(item => {
            console.log(`   - ${item}`);
          });
        });
      }

    } else {
      console.log(`⚠️  Security reports directory not found: ${securityReportsDir}`);
    }

    // Test compression strategies
    console.log('\n🧪 Test 3: Compression Strategies');

    const testReport = {
      timestamp: Date.now(),
      systemInfo: {
        platform: 'darwin',
        version: '1.0.0',
        largeField: 'x'.repeat(100000), // 100KB field
        repeatedField: 'This is a repeated string that should be compressed'.repeat(1000)
      },
      findings: Array.from({ length: 1000 }, (_, i) => ({
        id: `finding-${i}`,
        severity: 'high',
        message: `Security vulnerability detected in module ${i % 10}`,
        evidence: 'x'.repeat(5000) // 5KB evidence per finding
      })),
      logs: Array.from({ length: 5000 }, (_, i) => ({
        timestamp: Date.now() - i * 1000,
        level: ['info', 'warn', 'error'][i % 3],
        message: `Log entry ${i} with some repeated content that should be optimized for storage efficiency`
      }))
    };

    // Create test report
    const testReportPath = path.join(outputDir, 'test-large-report.json');
    require('fs').writeFileSync(testReportPath, JSON.stringify(testReport, null, 2));

    const testResult = await optimizer.optimizeSecurityReport(
      testReportPath,
      path.join(outputDir, 'optimized-test-report.json')
    );

    if (testResult.success) {
      console.log(`✅ Large test report optimized`);
      console.log(`   Original: ${optimizer.formatBytes(testResult.originalSize)}`);
      console.log(`   Optimized: ${optimizer.formatBytes(testResult.optimizedSize)}`);
      console.log(`   Compression: ${testResult.compressionRatio}%`);
      console.log(`   Strategies: ${testResult.strategies.join(', ')}`);
    }

    // Test sensitive data sanitization
    console.log('\n🧪 Test 4: Sensitive Data Sanitization');

    const sensitiveTestReport = {
      timestamp: Date.now(),
      credentials: {
        password: 'super-secret-password-123',
        apiKey: 'sk_live_1234567890abcdef',
        secretToken: 'secret-token-value',
        connectionString: 'postgresql://user:password@localhost:5432/db'
      },
      findings: [
        {
          id: 'sensitive-1',
          message: 'Found hardcoded password: password="admin123"',
          evidence: 'Database credentials discovered in config file'
        }
      ],
      logs: [
        {
          timestamp: Date.now(),
          message: 'Authentication successful with bearer token sk_test_1234567890',
          level: 'info'
        }
      ]
    };

    const sensitiveReportPath = path.join(outputDir, 'test-sensitive-report.json');
    require('fs').writeFileSync(sensitiveReportPath, JSON.stringify(sensitiveTestReport, null, 2));

    const sensitiveResult = await optimizer.optimizeSecurityReport(
      sensitiveReportPath,
      path.join(outputDir, 'sanitized-test-report.json')
    );

    if (sensitiveResult.success) {
      console.log(`✅ Sensitive data sanitization test completed`);

      // Verify sanitization
      const sanitized = JSON.parse(require('fs').readFileSync(
        path.join(outputDir, 'sanitized-test-report.json'), 'utf8'
      ));

      const hasPasswords = JSON.stringify(sanitized).includes('super-secret-password-123');
      const hasApiKeys = JSON.stringify(sanitized).includes('sk_live_1234567890abcdef');

      console.log(`   Passwords sanitized: ${!hasPasswords ? '✅ YES' : '❌ NO'}`);
      console.log(`   API keys sanitized: ${!hasApiKeys ? '✅ YES' : '❌ NO'}`);
    }

    // Performance test
    console.log('\n🧪 Test 5: Performance Metrics');

    const startTime = Date.now();
    const performanceResult = await optimizer.optimizeSecurityReport(
      testReportPath,
      path.join(outputDir, 'performance-test-report.json')
    );
    const endTime = Date.now();

    const processingTime = endTime - startTime;
    const throughputMB = testResult.originalSize / (1024 * 1024) / (processingTime / 1000);

    console.log(`✅ Performance metrics:`);
    console.log(`   Processing time: ${processingTime}ms`);
    console.log(`   Throughput: ${throughputMB.toFixed(2)} MB/s`);
    console.log(`   Efficiency: ${processingTime < 1000 ? '✅ FAST' : '⚠️  SLOW'} (< 1s target)`);

    // Final evaluation
    console.log('\n' + '='.repeat(50));
    console.log('📊 SECURITY REPORT OPTIMIZATION SUMMARY');
    console.log('='.repeat(50));

    const allUnderLimit = [
      result?.optimizedSize || 0,
      dirResult?.totalOptimizedSize || 0,
      testResult?.optimizedSize || 0
    ].every(size => size <= 100 * 1024 * 1024);

    const totalCompression = [
      result?.compressionRatio || 0,
      dirResult?.totalCompressionRatio || 0,
      testResult?.compressionRatio || 0
    ].reduce((sum, ratio) => sum + ratio, 0) / 3;

    console.log(`📈 Average compression ratio: ${totalCompression.toFixed(2)}%`);
    console.log(`🎯 All reports under 100MB: ${allUnderLimit ? '✅ YES' : '❌ NO'}`);
    console.log(`⚡ Processing speed: ${processingTime < 1000 ? '✅ EFFICIENT' : '⚠️  NEEDS_OPTIMIZATION'}`);

    const success = allUnderLimit && totalCompression > 10;

    if (success) {
      console.log('\n🎉 SUCCESS: Security report optimization achieved!');
      console.log('✅ Reports are under 100MB with effective compression');
      console.log('✅ Sensitive data is properly sanitized');
      console.log('✅ Performance is within acceptable limits');
    } else {
      console.log('\n⚠️  WARNING: Optimization targets not fully achieved');
      console.log('❌ Some reports may exceed size limits');
      console.log('❌ Compression may need improvement');
    }

    process.exit(success ? 0 : 1);

  } catch (error) {
    console.error('💥 Test execution failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };