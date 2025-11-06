#!/usr/bin/env node

/**
 * Config Loader Unit Tests
 * Comprehensive unit test suite for the config loader module
 */

import { loadConfig, isDebugMode, isVerboseMode, getDetectionConfig, getActivationConfig, getPBv2Config, getOutputConfig } from './config-loader.mjs';
import { writeFileSync, existsSync, unlinkSync } from 'fs';
import { join } from 'path';

// Test suites
const testSuites = {
  loadConfig: [
    {
      name: 'Carga config por defecto cuando archivo no existe',
      test: async () => {
        const { existsSync, renameSync } = await import('fs');
        const configPath = '/Users/felipe/Developer/skills-fabrik/scripts/hooks/pbv2-config.json';
        const backupPath = '/Users/felipe/Developer/skills-fabrik/scripts/hooks/pbv2-config.json.backup';

        // Backup the config file
        let backedUp = false;
        if (existsSync(configPath)) {
          renameSync(configPath, backupPath);
          backedUp = true;
        }

        try {
          const config = loadConfig('/tmp/nonexistent');

          const checks = {
            hasVersion: config.version === '2.0.0',
            hasDetection: config.detection && config.detection.enabled === true,
            hasActivation: !!config.activation && !!config.activation.mode,
            hasPBv2: !!config.pbv2 && !!config.pbv2.defaultComplexity
          };

          const passed = Object.values(checks).every(v => v === true);
          return {
            passed,
            message: passed ? 'Default config loaded correctly' : 'Missing default config fields',
            details: { checks, configKeys: Object.keys(config) }
          };
        } finally {
          // Restore the config file
          if (backedUp && existsSync(backupPath)) {
            renameSync(backupPath, configPath);
          }
        }
      }
    },
    {
      name: 'Carga config desde archivo existente',
      test: async () => {
        // Create a test config file
        const testConfig = {
          version: '2.0.0',
          detection: {
            enabled: false
          }
        };

        const configPath = '/tmp/test-pbv2-config.json';
        writeFileSync(configPath, JSON.stringify(testConfig));

        try {
          const config = loadConfig('/tmp');

          const passed = config.detection.enabled === false;
          return {
            passed,
            message: passed ? 'Config loaded from file' : 'Config not loaded from file',
            details: { config }
          };
        } finally {
          if (existsSync(configPath)) {
            unlinkSync(configPath);
          }
        }
      }
    },
    {
      name: 'Maneja JSON inválido gracefully',
      test: async () => {
        // Create an invalid config file
        const configPath = '/tmp/test-invalid-config.json';
        writeFileSync(configPath, '{ invalid json }');

        try {
          const config = loadConfig('/tmp');

          // Should fall back to defaults
          const passed = config.detection && config.detection.enabled === true;
          return {
            passed,
            message: passed ? 'Fell back to defaults for invalid JSON' : 'Did not fall back to defaults',
            details: { config }
          };
        } finally {
          if (existsSync(configPath)) {
            unlinkSync(configPath);
          }
        }
      }
    },
    {
      name: 'Merge config personalizado con defaults',
      test: async () => {
        const { existsSync, renameSync, writeFileSync, unlinkSync } = await import('fs');
        const configPath = '/Users/felipe/Developer/skills-fabrik/scripts/hooks/pbv2-config.json';
        const backupPath = '/Users/felipe/Developer/skills-fabrik/scripts/hooks/pbv2-config.json.backup';

        // Backup and create test config
        let backedUp = false;
        if (existsSync(configPath)) {
          renameSync(configPath, backupPath);
          backedUp = true;
        }

        try {
          // Create a partial config
          const testConfig = {
            activation: {
              mode: 'customMode'
            },
            output: {
              compactMessage: 'Custom message'
            }
          };

          writeFileSync(configPath, JSON.stringify(testConfig, null, 2));

          const config = loadConfig('/tmp');

          const checks = {
            hasCustomMode: config.activation.mode === 'customMode',
            hasCustomMessage: config.output.compactMessage === 'Custom message',
            hasDefaultDetection: config.detection.enabled === true
          };

          const passed = Object.values(checks).every(v => v === true);
          return {
            passed,
            message: passed ? 'Config merged correctly' : 'Config merge failed',
            details: { checks, config }
          };
        } finally {
          // Cleanup
          if (existsSync(configPath)) {
            unlinkSync(configPath);
          }
          if (backedUp && existsSync(backupPath)) {
            renameSync(backupPath, configPath);
          }
        }
      }
    }
  ],

  validation: [
    {
      name: 'Valida campos críticos - detection.enabled',
      test: async () => {
        const { existsSync, renameSync, writeFileSync, unlinkSync } = await import('fs');
        const configPath = '/Users/felipe/Developer/skills-fabrik/scripts/hooks/pbv2-config.json';
        const backupPath = '/Users/felipe/Developer/skills-fabrik/scripts/hooks/pbv2-config.json.backup';

        // Backup and create test config
        let backedUp = false;
        if (existsSync(configPath)) {
          renameSync(configPath, backupPath);
          backedUp = true;
        }

        try {
          const testConfig = {
            detection: 'not a boolean'
          };

          writeFileSync(configPath, JSON.stringify(testConfig, null, 2));

          const config = loadConfig('/tmp');

          const passed = typeof config.detection.enabled === 'boolean' && config.detection.enabled === true;
          return {
            passed,
            message: passed ? 'Invalid detection.enabled fixed' : 'Invalid detection.enabled not fixed',
            details: { config }
          };
        } finally {
          // Cleanup
          if (existsSync(configPath)) {
            unlinkSync(configPath);
          }
          if (backedUp && existsSync(backupPath)) {
            renameSync(backupPath, configPath);
          }
        }
      }
    },
    {
      name: 'Valida campos críticos - activation.mode',
      test: async () => {
        const testConfig = {
          activation: {
            enabled: true
            // mode missing
          }
        };

        const configPath = '/tmp/test-mode-validation-config.json';
        writeFileSync(configPath, JSON.stringify(testConfig));

        try {
          const config = loadConfig('/tmp');

          const passed = config.activation.mode === 'logOnly'; // default
          return {
            passed,
            message: passed ? 'Missing activation.mode defaulted' : 'Missing activation.mode not defaulted',
            details: { config }
          };
        } finally {
          if (existsSync(configPath)) {
            unlinkSync(configPath);
          }
        }
      }
    },
    {
      name: 'Rellena campos pbv2 faltantes',
      test: async () => {
        const testConfig = {
          detection: { enabled: true }
        };

        const configPath = '/tmp/test-pbv2-missing-config.json';
        writeFileSync(configPath, JSON.stringify(testConfig));

        try {
          const config = loadConfig('/tmp');

          const passed = config.pbv2 && config.pbv2.defaultComplexity === 'medium';
          return {
            passed,
            message: passed ? 'pbv2 defaults added' : 'pbv2 defaults not added',
            details: { config }
          };
        } finally {
          if (existsSync(configPath)) {
            unlinkSync(configPath);
          }
        }
      }
    }
  ],

  helperFunctions: [
    {
      name: 'isDebugMode detecta debug correctamente',
      test: async () => {
        const config = {
          development: {
            debugMode: true
          }
        };

        const passed = isDebugMode(config) === true;
        return {
          passed,
          message: passed ? 'Debug mode detected' : 'Debug mode not detected',
          details: { isDebugMode: isDebugMode(config) }
        };
      }
    },
    {
      name: 'isDebugMode retorna false cuando no está configurado',
      test: async () => {
        const config = {
          development: {}
        };

        const passed = isDebugMode(config) === false;
        return {
          passed,
          message: passed ? 'Debug mode defaults to false' : 'Debug mode incorrect default',
          details: { isDebugMode: isDebugMode(config) }
        };
      }
    },
    {
      name: 'isVerboseMode detecta verbose correctamente',
      test: async () => {
        const config = {
          development: {
            verboseLogging: true
          }
        };

        const passed = isVerboseMode(config) === true;
        return {
          passed,
          message: passed ? 'Verbose mode detected' : 'Verbose mode not detected',
          details: { isVerboseMode: isVerboseMode(config) }
        };
      }
    },
    {
      name: 'getDetectionConfig retorna sección correcta',
      test: async () => {
        const config = {
          detection: {
            enabled: false,
            patterns: { strong: ['pattern1'] }
          }
        };

        const detection = getDetectionConfig(config);

        const passed = detection.enabled === false && detection.patterns.strong[0] === 'pattern1';
        return {
          passed,
          message: passed ? 'Detection config retrieved' : 'Detection config incorrect',
          details: { detection }
        };
      }
    },
    {
      name: 'getActivationConfig retorna sección correcta',
      test: async () => {
        const config = {
          activation: {
            mode: 'custom',
            enabled: false
          }
        };

        const activation = getActivationConfig(config);

        const passed = activation.mode === 'custom' && activation.enabled === false;
        return {
          passed,
          message: passed ? 'Activation config retrieved' : 'Activation config incorrect',
          details: { activation }
        };
      }
    },
    {
      name: 'getPBv2Config retorna sección correcta',
      test: async () => {
        const config = {
          pbv2: {
            defaultComplexity: 'high',
            timeoutMs: 10000
          }
        };

        const pbv2 = getPBv2Config(config);

        const passed = pbv2.defaultComplexity === 'high' && pbv2.timeoutMs === 10000;
        return {
          passed,
          message: passed ? 'PBv2 config retrieved' : 'PBv2 config incorrect',
          details: { pbv2 }
        };
      }
    },
    {
      name: 'getOutputConfig retorna sección correcta',
      test: async () => {
        const config = {
          output: {
            saveToDevPlans: false,
            showInTerminal: true
          }
        };

        const output = getOutputConfig(config);

        const passed = output.saveToDevPlans === false && output.showInTerminal === true;
        return {
          passed,
          message: passed ? 'Output config retrieved' : 'Output config incorrect',
          details: { output }
        };
      }
    }
  ],

  defaults: [
    {
      name: 'Estructura completa de defaults',
      test: async () => {
        const config = loadConfig('/nonexistent');

        const requiredSections = [
          'version', 'detection', 'activation', 'pbv2', 'output', 'cache', 'metrics', 'fallback', 'development'
        ];

        const passed = requiredSections.every(section => section in config);
        return {
          passed,
          passed,
          message: passed ? 'All default sections present' : 'Missing default sections',
          details: { sections: Object.keys(config) }
        };
      }
    },
    {
      name: 'Valores por defecto correctos',
      test: async () => {
        const config = loadConfig('/nonexistent');

        const checks = {
          version: config.version === '2.0.0',
          detectionEnabled: config.detection.enabled === true,
          activationEnabled: config.activation.enabled === true,
          activationMode: config.activation.mode === 'logOnly',
          pbv2Timeout: config.pbv2.timeoutMs === 5000,
          outputSaveToDevPlans: config.output.saveToDevPlans === true,
          cacheEnabled: config.cache.enabled === true,
          metricsEnabled: config.metrics.enabled === true,
          fallbackOnError: config.fallback.onError === 'logOnly',
          debugMode: config.development.debugMode === false,
          verboseMode: config.development.verboseLogging === false
        };

        const passed = Object.values(checks).every(v => v === true);
        return {
          passed,
          message: passed ? 'All default values correct' : 'Some default values incorrect',
          details: { checks }
        };
      }
    }
  ]
};

// Test runner
async function runTests() {
  console.log('🧪 CONFIG LOADER - UNIT TESTS\n');
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
            console.log(`    Details:`, JSON.stringify(result.details, null, 2).split('\n').join('\n    '));
          }
        } else {
          failedTests++;
          console.log(`    ❌ FAILED`);
          console.log(`    ${result.message}`);
          if (result.details) {
            console.log(`    Details:`, JSON.stringify(result.details, null, 2).split('\n').join('\n    '));
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

  const iterations = 1000;
  console.log(`Running ${iterations} config loads...`);
  const start = Date.now();

  for (let i = 0; i < iterations; i++) {
    loadConfig('/nonexistent');
  }

  const duration = Date.now() - start;
  const avgTime = (duration / iterations).toFixed(3);

  console.log(`Total time: ${duration}ms`);
  console.log(`Average per load: ${avgTime}ms`);
  console.log(`Throughput: ${(iterations / (duration / 1000)).toFixed(0)} ops/sec`);

  if (avgTime < 5) {
    console.log('✅ Performance: EXCELLENT (<5ms)');
  } else if (avgTime < 10) {
    console.log('⚠️ Performance: GOOD (<10ms)');
  } else {
    console.log('❌ Performance: SLOW (>10ms)');
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
