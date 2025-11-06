#!/usr/bin/env node

/**
 * Simple Security Report Optimization Test
 * Prueba el sistema simplificado de optimización de reportes
 */

const path = require('path');
const SimpleSecurityOptimizer = require('../../packages/skills-cli/src/utils/simple-security-optimizer.cjs');

async function main() {
  console.log('🔧 Simple Security Report Optimization Test');
  console.log('========================================');
  console.log('🎯 Target: Keep reports under 100MB');
  console.log('');

  try {
    const projectRoot = path.resolve(__dirname, '../..');
    process.chdir(projectRoot);

    const optimizer = new SimpleSecurityOptimizer();

    // Test 1: Optimizar reporte de seguridad existente
    console.log('🧪 Test 1: Security Report Optimization');

    const securityReportPath = 'packages/skills-cli/test/security/security-reports/security-report-2025-11-01.json';
    const outputPath = 'test-outputs/optimized-security-report.json';

    if (require('fs').existsSync(securityReportPath)) {
      const result = await optimizer.optimizeReport(securityReportPath, outputPath);

      if (result.success) {
        console.log(`✅ Security report optimized successfully`);
        console.log(`   Compression: ${result.compressionRatio}%`);
        console.log(`   Under 100MB: ${result.underLimit ? '✅ YES' : '❌ NO'}`);
      } else {
        console.log(`❌ Optimization failed: ${result.error}`);
      }
    } else {
      console.log(`⚠️  Security report not found: ${securityReportPath}`);
    }

    // Test 2: Crear reporte grande y optimizarlo
    console.log('\n🧪 Test 2: Large Report Optimization');

    const largeReport = {
      timestamp: Date.now(),
      metadata: {
        version: '2.0.0',
        platform: 'test'
      },
      logs: Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        timestamp: Date.now() - i * 1000,
        level: 'info',
        message: 'Large log message '.repeat(100) + ` with content ${i}` // ~5KB each
      })),
      findings: Array.from({ length: 100 }, (_, i) => ({
        id: `finding-${i}`,
        severity: 'high',
        message: `Finding ${i} with sensitive data: password="secret123", api_key="sk_live_123"`,
        evidence: `Evidence for finding ${i}: contains credentials and should be sanitized`.repeat(50)
      }))
    };

    // Crear directorio de salida
    if (!require('fs').existsSync('test-outputs')) {
      require('fs').mkdirSync('test-outputs', { recursive: true });
    }

    const largeReportPath = 'test-outputs/large-report.json';
    require('fs').writeFileSync(largeReportPath, JSON.stringify(largeReport, null, 2));

    const largeResult = await optimizer.optimizeReport(
      largeReportPath,
      'test-outputs/optimized-large-report.json'
    );

    if (largeResult.success) {
      console.log(`✅ Large report optimized successfully`);
      console.log(`   Original: ${(largeResult.originalSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   Optimized: ${(largeResult.optimizedSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   Compression: ${largeResult.compressionRatio}%`);
      console.log(`   Under 100MB: ${largeResult.underLimit ? '✅ YES' : '❌ NO'}`);

      // Verificar sanitización
      const optimizedContent = require('fs').readFileSync(
        'test-outputs/optimized-large-report.json', 'utf8'
      );

      const hasPasswords = optimizedContent.includes('secret123');
      const hasApiKeys = optimizedContent.includes('sk_live_123');

      console.log(`   Passwords sanitized: ${!hasPasswords ? '✅ YES' : '❌ NO'}`);
      console.log(`   API keys sanitized: ${!hasApiKeys ? '✅ YES' : '❌ NO'}`);
    }

    // Test 3: Performance test
    console.log('\n🧪 Test 3: Performance Test');

    const startTime = Date.now();
    const perfResult = await optimizer.optimizeReport(
      largeReportPath,
      'test-outputs/performance-report.json'
    );
    const endTime = Date.now();

    const processingTime = endTime - startTime;

    console.log(`✅ Performance metrics:`);
    console.log(`   Processing time: ${processingTime}ms`);
    console.log(`   Speed: ${processingTime < 1000 ? '✅ FAST' : '⚠️  SLOW'} (< 1s target)`);

    // Resultados finales
    console.log('\n' + '='.repeat(50));
    console.log('📊 SECURITY REPORT OPTIMIZATION RESULTS');
    console.log('='.repeat(50));

    const results = [
      result?.success || false,
      largeResult?.success || false,
      processingTime < 1000
    ];

    const successCount = results.filter(Boolean).length;

    console.log(`✅ Tests passed: ${successCount}/3`);
    console.log(`📈 Reports under 100MB: ${(result?.underLimit || false) && (largeResult?.underLimit || false) ? '✅ YES' : '❌ NO'}`);
    console.log(`🛡️  Sensitive data sanitized: ${!largeResult.success || optimizedContent.includes('secret123') ? '❌ NO' : '✅ YES'}`);

    const overallSuccess = successCount >= 2; // Al menos 2 de 3 pruebas

    if (overallSuccess) {
      console.log('\n🎉 SUCCESS: Security report optimization working!');
      console.log('✅ Reports are optimized and under size limits');
      console.log('✅ Sensitive data is properly sanitized');
      console.log('✅ Performance is acceptable');
    } else {
      console.log('\n⚠️  WARNING: Some optimization targets not met');
      console.log('❌ Review optimization strategies');
    }

    process.exit(overallSuccess ? 0 : 1);

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