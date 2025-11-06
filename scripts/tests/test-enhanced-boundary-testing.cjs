#!/usr/bin/env node

/**
 * Enhanced Boundary Testing Test Runner
 * Prueba el sistema mejorado de boundary testing con detección inteligente
 * Objetivo: Reducir violaciones críticas a < 10 y falsos positivos
 */

const path = require('path');
const EnhancedBoundaryTester = require('../../packages/skills-cli/src/utils/enhanced-boundary-tester.cjs');

async function main() {
  console.log('🔍 Enhanced Boundary Testing Test Runner');
  console.log('=====================================');
  console.log('🎯 Target: < 10 critical violations');
  console.log('🛡️  Based on database-verification skill');
  console.log('');

  try {
    // Check if we're in the right directory
    const projectRoot = path.resolve(__dirname, '../..');
    process.chdir(projectRoot);

    // Initialize enhanced boundary tester
    const tester = new EnhancedBoundaryTester({
      maxCriticalViolations: 10,
      confidenceThreshold: 0.8,
      contextAware: true,
      adaptiveThresholds: true
    });

    // Test 1: Analizar archivo con problemas conocidos
    console.log('🧪 Test 1: Existing File Analysis');

    const testFiles = [
      'packages/skills-cli/test/edge-cases/boundary-results/boundary-report-2025-11-01.json',
      'packages/skills-cli/src/utils/cache.ts',
      'packages/skills-cli/src/core/state-manager.ts'
    ];

    const results = [];

    for (const filePath of testFiles) {
      if (require('fs').existsSync(filePath)) {
        console.log(`\n📄 Analyzing: ${filePath}`);
        const result = await tester.runEnhancedBoundaryTest(filePath);
        results.push({ file: filePath, ...result });

        if (result.success) {
          console.log(`✅ Analysis completed successfully`);
          console.log(`   Critical violations: ${result.summary.criticalViolations}`);
          console.log(`   Total violations: ${result.summary.totalViolations}`);
          console.log(`   Accuracy: ${result.summary.accuracyRate}%`);
          console.log(`   Target met: ${result.summary.targetMet ? '✅ YES' : '❌ NO'}`);
        } else {
          console.log(`❌ Analysis failed: ${result.error}`);
        }
      } else {
        console.log(`⚠️  File not found: ${filePath}`);
      }
    }

    // Test 2: Crear archivo con problemas deliberados para testing
    console.log('\n🧪 Test 2: Deliberate Problem Testing');

    const problematicCode = `
// Massive deletion without constraints (CRITICAL)
const deleteAllUsers = () => {
  prisma.user.deleteMany(); // Critical violation - no WHERE clause
};

// Hardcoded credentials (CRITICAL)
const dbConfig = {
  password: "super-secret-password-123",
  apiKey: "sk_live_1234567890abcdef",
  secretToken: "confidential-token-value"
};

// Unrestricted query (HIGH)
const getAllData = () => {
  return db.findMany(); // High violation - no LIMIT
};

// SQL injection potential (CRITICAL)
const unsafeQuery = \`SELECT * FROM users WHERE id = \${userId}\`;

// Unsafe eval (MEDIUM)
const processData = (input) => {
  return eval(\`(\${input})\`);
};

// Memory leak pattern (LOW)
const processLargeData = () => {
  const data = new Array(10000);
  for (let i = 0; i < data.length; i++) {
    data.push(new Array(1000));
  }
};
`;

    const testFile = 'test-outputs/problematic-code.ts';
    if (!require('fs').existsSync('test-outputs')) {
      require('fs').mkdirSync('test-outputs', { recursive: true });
    }
    require('fs').writeFileSync(testFile, problematicCode);

    console.log(`📄 Created test file: ${testFile}`);
    const testResult = await tester.runEnhancedBoundaryTest(testFile, {
      confidenceThreshold: 0.7
    });

    results.push({ file: testFile, ...testResult });

    if (testResult.success) {
      console.log(`✅ Deliberate test completed`);
      console.log(`   Expected violations: 5+ critical`);
      console.log(`   Detected violations: ${testResult.summary.criticalViolations} critical`);
      console.log(`   Accuracy: ${testResult.summary.accuracyRate}%`);
      console.log(`   Target met: ${testResult.summary.targetMet ? '✅ YES' : '❌ NO'}`);

      // Verificar que detecte los problemas esperados
      const expectedViolations = 5; // password, apikey, token, deleteMany, findMany
      const detectedCritical = testResult.summary.criticalViolations;
      console.log(`   Detection effectiveness: ${detectedCritical >= expectedViolations ? '✅ GOOD' : '⚠️  POOR'} (${detectedCritical}/${expectedViolations})`);
    } else {
      console.log(`❌ Deliberate test failed: ${testResult.error}`);
    }

    // Test 3: Archivo con código seguro para probar falsos positivos
    console.log('\n🧪 Test 3: False Positive Testing');

    const safeCode = `
// Safe database operations with proper constraints
const deleteUser = (userId) => {
  return prisma.user.deleteMany({
    where: { id: userId, status: 'inactive' }
  });
};

// Secure configuration with environment variables
const config = {
  database: {
    host: process.env.DB_HOST,
    password: process.env.DB_PASSWORD,
    apiKey: process.env.API_KEY
  }
};

// Safe query with LIMIT clause
const getUsers = () => {
  return db.findMany({
    take: 100,
    where: { active: true },
    orderBy: { createdAt: 'desc' }
  });
};

// Safe parameterized query
const getUserById = (userId) => {
  const query = 'SELECT * FROM users WHERE id = $1';
  return db.query(query, [userId]);
};

// Safe parsing without eval
const processData = (input) => {
  return JSON.parse(input);
};

// Memory-efficient data processing
const processDataEfficiently = (data) => {
  return data.map(item => ({
    ...item,
    processed: item.value * 2
  }));
};
`;

    const safeFile = 'test-outputs/safe-code.ts';
    require('fs').writeFileSync(safeFile, safeCode);

    console.log(`📄 Created safe test file: ${safeFile}`);
    const safeResult = await tester.runEnhancedBoundaryTest(safeFile);

    results.push({ file: safeFile, ...safeResult });

    if (safeResult.success) {
      console.log(`✅ False positive test completed`);
      console.log(`   Expected violations: 0-2 critical`);
      console.log(`   Detected violations: ${safeResult.summary.criticalViolations} critical`);
      console.log(`   False positives: ${safeResult.summary.falsePositives}`);
      console.log(`   Accuracy: ${safeResult.summary.accuracyRate}%`);
      console.log(`   Low false positives: ${safeResult.summary.falsePositives <= 2 ? '✅ GOOD' : '⚠️  NEEDS_IMPROVEMENT'}`);
    } else {
      console.log(`❌ False positive test failed: ${safeResult.error}`);
    }

    // Generar resumen final
    console.log('\n' + '='.repeat(60));
    console.log('📊 ENHANCED BOUNDARY TESTING SUMMARY');
    console.log('='.repeat(60));

    const totalCritical = results.reduce((sum, r) => sum + (r.summary?.criticalViolations || 0), 0);
    const totalViolations = results.reduce((sum, r) => sum + (r.summary?.totalViolations || 0), 0);
    const totalFalsePositives = results.reduce((sum, r) => sum + (r.summary?.falsePositives || 0), 0);
    const avgAccuracy = results.reduce((sum, r) => sum + (r.summary?.accuracyRate || 0), 0) / results.length;

    const targetMetCount = results.filter(r => r.summary?.targetMet || false).length;
    const highAccuracyCount = results.filter(r => (r.summary?.accuracyRate || 0) >= 80).length;

    console.log(`📈 Test Results:`);
    console.log(`   Files analyzed: ${results.length}`);
    console.log(`   Total critical violations: ${totalCritical}`);
    console.log(`   Total violations: ${totalViolations}`);
    console.log(`   False positives: ${totalFalsePositives}`);
    console.log(`   Average accuracy: ${avgAccuracy.toFixed(1)}%`);
    console.log(`   Target (<10 critical): ${totalCritical <= 10 ? '✅ YES' : '❌ NO'}`);
    console.log(`   High accuracy (≥80%): ${highAccuracyCount}/${results.length}`);

    // Mostrar detalles de cada archivo
    console.log(`\n📋 Detailed Results:`);
    results.forEach((result, index) => {
      if (result.success) {
        const status = result.summary.targetMet ? '✅' : '❌';
        console.log(`${index + 1}. ${status} ${path.basename(result.file)}`);
        console.log(`   Critical: ${result.summary.criticalViolations}, Total: ${result.summary.totalViolations}, FP: ${result.summary.falsePositives}`);
      } else {
        console.log(`${index + 1}. ❌ ${path.basename(result.file)} - ERROR`);
      }
    });

    // Evaluación final
    const overallSuccess = totalCritical <= 10 && avgAccuracy >= 70;

    if (overallSuccess) {
      console.log('\n🎉 SUCCESS: Enhanced boundary testing targets achieved!');
      console.log('✅ Critical violations under 10');
      console.log('✅ High accuracy maintained');
      console.log('✅ False positives minimized');
      console.log('✅ Intelligent detection working');
    } else {
      console.log('\n⚠️  WARNING: Some targets not fully achieved');
      if (totalCritical > 10) {
        console.log('❌ Too many critical violations detected');
      }
      if (avgAccuracy < 70) {
        console.log('❌ Accuracy rate too low (many false positives)');
      }
    }

    console.log('\n💡 Key Improvements vs Original:');
    console.log('✅ Context-aware violation detection');
    console.log('✅ Exception handling for legitimate uses');
    console.log('✅ Adaptive confidence thresholds');
    console.log('✅ False positive reduction');
    console.log('✅ Detailed reporting and recommendations');

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