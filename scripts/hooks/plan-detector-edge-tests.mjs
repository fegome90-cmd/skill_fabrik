#!/usr/bin/env node

/**
 * Edge Case Tests for Plan Detector
 *
 * Comprehensive test suite covering edge cases and unusual scenarios
 */

import { detectPlan, analyzePlanContent } from './plan-detector.mjs';

// Test cases categorized by type
const testSuites = {
  basic: [
    {
      name: 'Plan con [Layout] estándar',
      input: '[Layout] Plan de desarrollo:\n1. Diseñar arquitectura\n2. Implementar endpoints\n3. Testing',
      expected: true,
      minConfidence: 0.9
    },
    {
      name: 'CLOOP completo con dos puntos',
      input: 'Clarify: objetivos. Layout: arquitectura. Operate: implementación. Observe: testing.',
      expected: true,
      minConfidence: 0.9
    },
    {
      name: 'Título ## Plan',
      input: '## Plan\n1. Paso uno\n2. Paso dos\n3. Paso tres',
      expected: true,
      minConfidence: 0.7
    }
  ],

  multipleLayouts: [
    {
      name: 'Dos [Layout] en el texto',
      input: '[Layout] Primer plan\n...\n[Layout] Segundo plan\n1. Nueva tarea',
      expected: true,
      description: 'Debe detectar el primero'
    },
    {
      name: 'Tres [Layout] consecutivos',
      input: '[Layout] Plan A\n[Layout] Plan B\n[Layout] Plan C\n1. Última tarea',
      expected: true,
      description: 'Debe detectar el primero'
    }
  ],

  longText: [
    {
      name: 'Plan muy largo (2000 chars)',
      input: '[Layout] Plan de desarrollo completo:\n' + '1. Análisis inicial\n'.repeat(100),
      expected: true,
      description: 'Debe manejar textos largos'
    },
    {
      name: 'Plan con líneas muy largas (500 chars)',
      input: '[Layout] Plan:\n1. ' + 'a'.repeat(500),
      expected: true,
      description: 'Debe manejar líneas largas'
    }
  ],

  specialChars: [
    {
      name: 'Emojis en el plan',
      input: '[Layout] Plan 🚀:\n1. ✅ Diseñar\n2. 🔧 Implementar\n3. 🧪 Testing',
      expected: true
    },
    {
      name: 'Caracteres especiales',
      input: '[Layout] Plan: @#$%^&*()\n1. Tarea 1\n2. Tarea 2',
      expected: true
    },
    {
      name: 'Unicode y acentos',
      input: '[Layout] Plan español:\n1. Tárea contém accent\n2. Operación ñ',
      expected: true
    },
    {
      name: 'Caracteres no-UTF8 simulados',
      input: '[Layout] Plan:\n1. \u0000\u0001\u0002 tarea',
      expected: true,
      description: 'Debe manejar null bytes'
    }
  ],

  differentLanguages: [
    {
      name: 'Plan en inglés',
      input: '[Layout] Development Plan:\n1. Design architecture\n2. Implement features',
      expected: true
    },
    {
      name: 'Plan en francés',
      input: '[Layout] Plan de développement:\n1. Concevoir\n2. Implémenter',
      expected: true
    },
    {
      name: 'Plan en alemán',
      input: '[Layout] Entwicklungsplan:\n1. Architektur entwerfen\n2. Implementieren',
      expected: true
    },
    {
      name: 'Plan en portugués',
      input: '[Layout] Plano de desenvolvimento:\n1. Projetar\n2. Implementar',
      expected: true
    }
  ],

  falsePositives: [
    {
      name: 'Palabra "plan" sin estructura',
      input: 'Hablamos del plan para el futuro. Es una buena idea.',
      expected: false,
      description: 'No debe detectar sin estructura'
    },
    {
      name: 'Objetivos genéricos',
      input: 'Nuestros objetivos son claros y ambiciosos.',
      expected: false,
      description: 'No debe detectar como plan'
    },
    {
      name: 'Layout como parte de otra palabra',
      input: 'El layout de la página está bien. También tenemos un plan.',
      expected: false,
      description: '[Layout] debe estar aislado'
    },
    {
      name: 'Clarify sin Layout',
      input: 'Clarify: primero definimos objetivos.',
      expected: false,
      description: 'Debe tener al menos Layout + Operate'
    }
  ],

  noStructure: [
    {
      name: 'Solo [Layout] sin pasos',
      input: '[Layout] Plan de desarrollo',
      expected: false,
      description: 'Debe tener estructura'
    },
    {
      name: 'Solo 1 punto numerado',
      input: '[Layout] Plan:\n1. Solo una tarea',
      expected: true,
      description: 'CLOOP con 1 punto es válido para edge cases'
    },
    {
      name: 'Texto muy corto',
      input: '[Layout] P',
      expected: false,
      description: 'Mínimo 30 caracteres'
    },
    {
      name: 'CLOOP incompleto',
      input: 'Clarify objetivos. Layout arquitectura.',
      expected: false,
      description: 'Debe tener Clarify+Layout+Operate'
    }
  ],

  malformed: [
    {
      name: 'Bracket mal formado',
      input: '[Layout Plan:\n1. Tarea',
      expected: false,
      description: 'Bracket debe cerrarse'
    },
    {
      name: 'Markdown incompleto',
      input: '## Plan\nSin contenido',
      expected: false,
      description: 'Debe tener contenido después del título'
    },
    {
      name: 'Regex injection attempt',
      input: '[Layout] Plan: [A-Z]+\n1. Test [0-9]+',
      expected: false,
      description: 'Debe ser safe contra regex injection'
    }
  ],

  whitespace: [
    {
      name: 'Espacios extra',
      input: '   [Layout]   Plan:\n  1. Tarea  \n  2. Otra  ',
      expected: true,
      description: 'Debe manejar whitespace'
    },
    {
      name: 'Tabs en lugar de espacios',
      input: '[Layout]\tPlan:\n1.\tTarea',
      expected: true,
      description: 'Debe manejar tabs'
    },
    {
      name: 'Líneas en blanco múltiples',
      input: '[Layout] Plan:\n\n\n1. Tarea\n\n\n2. Otra',
      expected: true,
      description: 'Debe manejar múltiples newlines'
    }
  ],

  edgeNumbers: [
    {
      name: 'Número cero',
      input: '[Layout] Plan:\n0. Inicio\n1. Primera tarea',
      expected: true,
      description: 'Debe manejar 0 como número'
    },
    {
      name: 'Número alto',
      input: '[Layout] Plan:\n1. Primera\n999. Última',
      expected: true,
      description: 'Debe manejar números altos'
    },
    {
      name: 'Listado sin números',
      input: '[Layout] Plan:\nPrimer paso\nSegundo paso\nTercer paso',
      expected: false,
      description: 'Debe tener estructura de lista'
    }
  ]
};

// Test runner
async function runTests() {
  console.log('🧪 PLAN DETECTOR - EDGE CASE TESTS\n');
  console.log('='.repeat(70));

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  for (const [suiteName, tests] of Object.entries(testSuites)) {
    console.log(`\n📦 Suite: ${suiteName.toUpperCase()}`);
    console.log('-'.repeat(70));

    for (const test of tests) {
      totalTests++;
      const result = detectPlan(test.input);

      const passed = test.expected
        ? result !== null && (test.minConfidence ? result.confidence >= test.minConfidence : true)
        : result === null;

      if (passed) {
        passedTests++;
        console.log(`  ✅ ${test.name}`);
        if (result && test.expected) {
          console.log(`     Confidence: ${(result.confidence * 100).toFixed(0)}%`);
        }
      } else {
        failedTests++;
        console.log(`  ❌ ${test.name}`);
        console.log(`     Expected: ${test.expected ? 'DETECTED' : 'NOT DETECTED'}`);
        console.log(`     Got: ${result ? 'DETECTED' : 'NOT DETECTED'}`);
        if (result) {
          console.log(`     Confidence: ${(result.confidence * 100).toFixed(0)}%`);
        }
        if (test.description) {
          console.log(`     Note: ${test.description}`);
        }
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

  const iterations = 1000;
  const testInput = '[Layout] Plan:\n1. Tarea 1\n2. Tarea 2\n3. Tarea 3';

  console.log(`Running ${iterations} iterations...`);
  const start = Date.now();

  for (let i = 0; i < iterations; i++) {
    detectPlan(testInput);
  }

  const duration = Date.now() - start;
  const avgTime = (duration / iterations).toFixed(3);

  console.log(`Total time: ${duration}ms`);
  console.log(`Average per detection: ${avgTime}ms`);
  console.log(`Throughput: ${(iterations / (duration / 1000)).toFixed(0)} ops/sec`);

  if (avgTime < 5) {
    console.log('✅ Performance: EXCELLENT (<5ms)');
  } else if (avgTime < 10) {
    console.log('⚠️ Performance: GOOD (<10ms)');
  } else {
    console.log('❌ Performance: SLOW (>10ms)');
  }
}

// Memory tests
function memoryTests() {
  console.log('\n💾 MEMORY TESTS');
  console.log('-'.repeat(70));

  const iterations = 10000;
  const results = [];

  console.log(`Allocating ${iterations} plan detections...`);

  const memBefore = process.memoryUsage();

  for (let i = 0; i < iterations; i++) {
    const result = detectPlan('[Layout] Plan:\n1. Test ' + i);
    if (result) {
      results.push(result);
    }
  }

  const memAfter = process.memoryUsage();

  console.log(`Heap used before: ${(memBefore.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Heap used after: ${(memAfter.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Heap growth: ${((memAfter.heapUsed - memBefore.heapUsed) / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Memory per detection: ${((memAfter.heapUsed - memBefore.heapUsed) / results.length).toFixed(0)} bytes`);

  results.length = 0; // Clear array

  const memAfterClear = process.memoryUsage();
  console.log(`Heap after clear: ${(memAfterClear.heapUsed / 1024 / 1024).toFixed(2)} MB`);
}

// Main execution
async function main() {
  const testsPassed = await runTests();
  await performanceTests();
  memoryTests();

  process.exit(testsPassed ? 0 : 1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { testSuites, runTests };
