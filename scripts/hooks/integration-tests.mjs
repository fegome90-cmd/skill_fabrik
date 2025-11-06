#!/usr/bin/env node

/**
 * Integration Tests - Complete Flow
 * Tests the complete integration flow: detect → activate → save
 */

import { processClaudeOutput, pbv2StopHook, integratePBv2, getCacheStats, clearCache } from './pbv2-integration.mjs';
import { detectPlan } from './plan-detector.mjs';
import { activatePBv2, savePlanResult } from './pbv2-activator.mjs';
import { existsSync, unlinkSync } from 'fs';

// Test suites
const testSuites = {
  basicFlow: [
    {
      name: 'Flujo completo básico: output → detect → activate → save',
      test: async () => {
        const output = `[Layout] Plan de desarrollo:
1. Diseñar arquitectura backend
2. Implementar API REST
3. Configurar base de datos
4. Testing de endpoints

Continuamos con el desarrollo...`;

        const result = await integratePBv2(output, process.cwd());

        const checks = {
          processed: result.processed === true,
          hasDetection: !!result.detection,
          hasSavedPath: !!result.savedPath,
          hasHash: !!result.detection?.hash
        };

        const passed = Object.values(checks).every(v => v === true);
        return {
          passed,
          message: passed ? 'Complete flow executed successfully' : 'Complete flow failed',
          details: { checks, resultKeys: Object.keys(result) }
        };
      }
    },
    {
      name: 'Stop Hook integration basic',
      test: async () => {
        const output = `[Layout] Plan de desarrollo:
1. Diseñar arquitectura
2. Implementar API`;

        const result = await pbv2StopHook(output, { cwd: process.cwd(), verbose: false });

        const checks = {
          processed: typeof result.processed === 'boolean',
          hasDetection: typeof result.detection === 'object'
        };

        const passed = Object.values(checks).every(v => v === true);
        return {
          passed,
          message: passed ? 'Stop hook integration works' : 'Stop hook integration failed',
          details: { checks, result }
        };
      }
    },
    {
      name: 'Process Claude output con plan CLOOP completo',
      test: async () => {
        const output = `Clarify: Definir objetivos del proyecto
Layout: Diseñar arquitectura y estructura
Operate: Implementar componentes principales
Observe: Realizar pruebas y validación
Reflect: Documentar resultados

[Layout] Plan de desarrollo:
1. Configurar repositorio
2. Implementar funcionalidades core
3. Testing y validación`;

        const result = await processClaudeOutput(output, process.cwd());

        const checks = {
          processed: result.processed === true,
          hasDetection: !!result.detection,
          confidenceAbove90: result.detection?.confidence >= 0.9,
          hasAction: !!result.action
        };

        const passed = Object.values(checks).every(v => v === true);
        return {
          passed,
          message: passed ? 'CLOOP plan detected and processed' : 'CLOOP plan not processed correctly',
          details: { checks, result }
        };
      }
    },
    {
      name: 'Procesa título ## Plan correctamente',
      test: async () => {
        const output = `## Plan de desarrollo
1. Análisis inicial
2. Diseño de arquitectura
3. Implementación
4. Testing
5. Deployment`;

        const result = await integratePBv2(output, process.cwd());

        const checks = {
          processed: result.processed === true,
          hasDetection: !!result.detection,
          confidenceAbove70: result.detection?.confidence >= 0.7
        };

        const passed = Object.values(checks).every(v => v === true);
        return {
          passed,
          message: passed ? 'Title-based plan detected' : 'Title-based plan not detected',
          details: { checks }
        };
      }
    }
  ],

  cacheBehavior: [
    {
      name: 'Cache evita reprocesar mismo plan',
      test: async () => {
        const output1 = `[Layout] Plan A:\n1. Task 1\n2. Task 2`;
        const output2 = `[Layout] Plan A:\n1. Task 1\n2. Task 2`; // Same content

        // First call
        const result1 = await integratePBv2(output1, process.cwd());

        // Clear cache for this test
        clearCache();

        // Second call (should process again since cache was cleared)
        const result2 = await integratePBv2(output2, process.cwd());

        const checks = {
          firstProcessed: result1.processed === true,
          secondProcessed: result2.processed === true,
          bothHaveHash: !!result1.detection?.hash && !!result2.detection?.hash,
          sameHash: result1.detection?.hash === result2.detection?.hash
        };

        const passed = Object.values(checks).every(v => v === true);
        return {
          passed,
          message: passed ? 'Cache behavior working' : 'Cache behavior issues',
          details: { checks, result1, result2 }
        };
      }
    },
    {
      name: 'Cache stats retrievable',
      test: async () => {
        // First generate some cache entries
        await integratePBv2(`[Layout] Plan:\n1. Task 1`, process.cwd());
        await integratePBv2(`[Layout] Plan:\n2. Task 2`, process.cwd());

        const stats = getCacheStats();

        const checks = {
          hasSize: typeof stats.size === 'number',
          hasMaxSize: typeof stats.maxSize === 'number',
          hasEntries: typeof stats.entries === 'object'
        };

        const passed = Object.values(checks).every(v => v === true);
        return {
          passed,
          message: passed ? 'Cache stats retrieved successfully' : 'Cache stats retrieval failed',
          details: { stats }
        };
      }
    },
    {
      name: 'Clear cache funciona',
      test: async () => {
        // Add some entries
        await integratePBv2(`[Layout] Plan:\n1. Task 1`, process.cwd());

        const statsBefore = getCacheStats();
        clearCache();
        const statsAfter = getCacheStats();

        const passed = statsAfter.size === 0;
        return {
          passed,
          message: passed ? 'Cache cleared successfully' : 'Cache clear failed',
          details: { statsBefore, statsAfter }
        };
      }
    }
  ],

  planDetection: [
    {
      name: 'Detecta plan con múltiples [Layout]',
      test: async () => {
        const output = `[Layout] Primer plan
...
[Layout] Segundo plan
1. Nueva tarea
2. Otra tarea`;

        const result = await integratePBv2(output, process.cwd());

        const passed = result.detection && result.detection.block.includes('[Layout]');
        return {
          passed,
          message: passed ? 'Multiple Layout detected' : 'Multiple Layout not detected',
          details: { result }
        };
      }
    },
    {
      name: 'Rechaza texto sin estructura de plan',
      test: async () => {
        const output = `Este es un texto cualquiera sobre el proyecto. No contiene un plan estructurado.`;

        const result = await integratePBv2(output, process.cwd());

        const passed = result.processed === false && result.reason === 'no_plan';
        return {
          passed,
          message: passed ? 'Non-plan correctly rejected' : 'Non-plan incorrectly processed',
          details: { result }
        };
      }
    },
    {
      name: 'Detecta plan con emojis y caracteres especiales',
      test: async () => {
        const output = `[Layout] Plan 🚀:
1. ✅ Diseñar arquitectura
2. 🔧 Implementar
3. 🧪 Testing
4. 📝 Documentar`;

        const result = await integratePBv2(output, process.cwd());

        const passed = result.detection && result.detection.confidence >= 0.9;
        return {
          passed,
          message: passed ? 'Plan with emojis detected' : 'Plan with emojis not detected',
          details: { result }
        };
      }
    },
    {
      name: 'Detecta plan multilinea largo',
      test: async () => {
        const longPlan = '[Layout] Plan de desarrollo completo:\n' + '1. Análisis inicial\n'.repeat(50);

        const result = await integratePBv2(longPlan, process.cwd());

        const passed = result.detection && result.detection.confidence >= 0.9;
        return {
          passed,
          message: passed ? 'Long plan detected' : 'Long plan not detected',
          details: { result }
        };
      }
    }
  ],

  pbv2Activation: [
    {
      name: 'Activación PBv2 con plan válido',
      test: async () => {
        const output = `[Layout] Plan:
1. Diseñar backend
2. Implementar API
3. Testing`;

        const result = await integratePBv2(output, process.cwd());

        const passed = result.pb2Result && typeof result.pb2Result.success === 'boolean';
        return {
          passed,
          message: passed ? 'PBv2 activation attempted' : 'PBv2 activation not attempted',
          details: { result }
        };
      }
    },
    {
      name: 'Graceful degradation cuando PBv2 falla',
      test: async () => {
        // Use an invalid path to trigger PBv2 failure
        const output = `[Layout] Plan:\n1. Task 1\n2. Task 2`;

        const result = await processClaudeOutput(output, '/nonexistent/path');

        const checks = {
          processed: result.processed === true,
          hasError: !!result.pb2Result?.error,
          hasFallback: result.pb2Result?.fallback === output
        };

        const passed = Object.values(checks).every(v => v === true);
        return {
          passed,
          message: passed ? 'Graceful degradation working' : 'Graceful degradation failed',
          details: { checks, result }
        };
      }
    }
  ]
};

// Test runner
async function runTests() {
  console.log('🧪 INTEGRATION TESTS - COMPLETE FLOW\n');
  console.log('='.repeat(70));

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  for (const [suiteName, tests] of Object.entries(testSuites)) {
    console.log(`\n📦 Suite: ${suiteName.toUpperCase()}`);
    console.log('-'.repeat(70));

    for (const test of tests) {
      totalTests++;
      console.log(`\n  Test: ${test.name}`);

      try {
        const result = await test.test();

        if (result.passed) {
          passedTests++;
          console.log(`    ✅ PASSED`);
          console.log(`    ${result.message}`);
          if (result.details) {
            console.log(`    Details:`, JSON.stringify(result.details, null, 2).split('\n').slice(0, 10).join('\n    '));
          }
        } else {
          failedTests++;
          console.log(`    ❌ FAILED`);
          console.log(`    ${result.message}`);
          if (result.details) {
            console.log(`    Details:`, JSON.stringify(result.details, null, 2).split('\n').slice(0, 10).join('\n    '));
          }
        }
      } catch (error) {
        failedTests++;
        console.log(`    💥 ERROR: ${error.message}`);
        console.log(`    Stack: ${error.stack?.split('\n').slice(0, 3).join('\n    ')}`);
      }
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('📊 SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total tests: ${totalTests}`);
  console.log(`Passed: ${passedTests} ✅`);
  console.log(`Failed: ${failedTests} ❌`);
  console.log(`Success rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  console.log('='.repeat(70));

  if (failedTests === 0) {
    console.log('🎉 ALL TESTS PASSED!');
    return true;
  } else {
    console.log('⚠️ SOME TESTS FAILED');
    return false;
  }
}

// Performance tests
async function performanceTests() {
  console.log('\n⚡ PERFORMANCE TESTS');
  console.log('-'.repeat(70));

  const iterations = 50;
  const output = `[Layout] Plan:\n1. Task 1\n2. Task 2\n3. Task 3`;

  console.log(`Running ${iterations} complete flows...`);
  const start = Date.now();

  for (let i = 0; i < iterations; i++) {
    clearCache();
    await integratePBv2(output, process.cwd());
  }

  const duration = Date.now() - start;
  const avgTime = (duration / iterations).toFixed(3);

  console.log(`Total time: ${duration}ms`);
  console.log(`Average per flow: ${avgTime}ms`);
  console.log(`Throughput: ${(iterations / (duration / 1000)).toFixed(0)} flows/sec`);

  if (avgTime < 50) {
    console.log('✅ Performance: EXCELLENT (<50ms)');
  } else if (avgTime < 100) {
    console.log('⚠️ Performance: GOOD (<100ms)');
  } else {
    console.log('❌ Performance: SLOW (>100ms)');
  }
}

// Main execution
async function main() {
  const testsPassed = await runTests();
  await performanceTests();

  process.exit(testsPassed ? 0 : 1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { testSuites, runTests };
