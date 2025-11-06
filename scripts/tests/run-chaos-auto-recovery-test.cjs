#!/usr/bin/env node

/**
 * Chaos Engineering Auto-Recovery Test Runner
 * Ejecuta pruebas de chaos engineering con sistema de auto-recuperación
 * Objetivo: Alcanzar 80% de recovery rate
 */

const path = require('path');
const EnhancedChaosTest = require('../../packages/skills-cli/test/chaos/enhanced-chaos-test.cjs');

async function main() {
  console.log('🌪️  Chaos Engineering Auto-Recovery Test Runner');
  console.log('================================================');
  console.log('🎯 Target: 80% Recovery Rate');
  console.log('');

  try {
    // Check if we're in the right directory
    const projectRoot = path.resolve(__dirname, '../..');
    process.chdir(projectRoot);

    // Initialize enhanced chaos test
    const chaosTest = new EnhancedChaosTest();

    // Run the test
    const report = await chaosTest.runEnhancedChaosTest();

    // Display results
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(60));

    const { summary } = report;

    console.log(`📈 Final Recovery Rate: ${summary.finalRecoveryRate}%`);
    console.log(`🎯 Target Recovery Rate: ${summary.targetRecoveryRate}%`);
    console.log(`✅ Successful Recoveries: ${summary.successfulRecoveries}/${summary.totalTests}`);

    // Determine success
    const success = summary.finalRecoveryRate >= summary.targetRecoveryRate;

    if (success) {
      console.log('\n🎉 SUCCESS: Target recovery rate achieved!');
      console.log('✅ Auto-recovery system is working effectively');
    } else {
      console.log('\n⚠️  WARNING: Target recovery rate not achieved');
      console.log('❌ Auto-recovery system needs improvement');

      // Show recommendations
      if (report.recommendations.length > 0) {
        console.log('\n📋 Recommendations:');
        report.recommendations.forEach((rec, index) => {
          console.log(`${index + 1}. [${rec.priority}] ${rec.message}`);
        });
      }
    }

    // Show detailed results
    console.log('\n📋 Detailed Results:');
    report.testResults.forEach((result, index) => {
      const status = result.recovered ? '✅' : '❌';
      const time = result.recovered ? ` (${result.recoveryTime}ms)` : '';
      console.log(`${index + 1}. ${status} ${result.scenario}${time}`);
    });

    // Show performance metrics
    console.log('\n⚡ Performance Metrics:');
    console.log(`   Average Recovery Time: ${Math.round(report.performanceMetrics.averageRecoveryTime)}ms`);
    console.log(`   Fastest Recovery: ${report.performanceMetrics.fastestRecovery}ms`);
    console.log(`   Slowest Recovery: ${report.performanceMetrics.slowestRecovery}ms`);

    // Show auto-recovery stats
    const autoStats = report.autoRecoveryStats;
    console.log('\n🔄 Auto-Recovery Stats:');
    console.log(`   Total Attempts: ${autoStats.totalAttempts}`);
    console.log(`   Successful: ${autoStats.successfulRecoveries}`);
    console.log(`   Recovery Rate: ${autoStats.recoveryRate}%`);

    // Exit with appropriate code
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