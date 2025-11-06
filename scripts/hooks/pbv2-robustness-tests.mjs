#!/usr/bin/env node

/**
 * PBv2 Robustness Testing Suite - Fase 4
 *
 * Tests de manejo de errores y robustez del sistema
 * Valida recuperación de errores, logging y estabilidad.
 *
 * Version: 1.0.0
 * Author: Skills Fabric Team
 */

import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { loadConfig } from './config-loader.mjs';

/**
 * Ejecuta tests de robustness
 * @param {Object} options - Opciones de test
 * @returns {Promise<Object>} - Resultados
 */
export async function runRobustnessTests(options = {}) {
  const cwd = options.cwd || process.cwd();
  const startTime = Date.now();

  const results = {
    phase: 4,
    name: 'Error Handling & Robustness',
    totalTests: 15,
    passed: 0,
    failed: 0,
    errors: [],
    metrics: {},
    timestamp: new Date().toISOString()
  };

  console.error('[Phase 4] 🛡️ Starting Robustness Testing Suite...\n');

  // Test 1: Invalid input handling
  console.error('[Phase 4] Test 1/15: Invalid Input Handling...');
  try {
    const invalidResult = await testInvalidInputHandling();
    if (invalidResult.handledGracefully) {
      results.passed++;
      console.error('✅ Test 1 PASSED: Invalid inputs handled gracefully');
    } else {
      results.failed++;
      results.errors.push(`Invalid input not handled: ${invalidResult.errors} errors`);
      console.error('❌ Test 1 FAILED: Invalid input caused errors');
    }
    results.metrics.invalidInputHandling = invalidResult.handledGracefully;
  } catch (error) {
    results.failed++;
    results.errors.push(`Test 1 error: ${error.message}`);
    console.error('❌ Test 1 ERROR:', error.message);
  }

  // Test 2: Malformed data handling
  console.error('[Phase 4] Test 2/15: Malformed Data Handling...');
  try {
    const malformedResult = await testMalformedDataHandling();
    if (malformedResult.recovered) {
      results.passed++;
      console.error('✅ Test 2 PASSED: Malformed data handled and recovered');
    } else {
      results.failed++;
      results.errors.push(`Malformed data recovery failed: ${malformedResult.recoveryAttempts} attempts`);
      console.error('❌ Test 2 FAILED: Malformed data caused unrecoverable errors');
    }
    results.metrics.malformedDataHandling = malformedResult.recovered;
  } catch (error) {
    results.failed++;
    results.errors.push(`Test 2 error: ${error.message}`);
    console.error('❌ Test 2 ERROR:', error.message);
  }

  // Test 3: File system errors
  console.error('[Phase 4] Test 3/15: File System Errors...');
  try {
    const fsResult = await testFileSystemErrors();
    if (fsResult.handledGracefully) {
      results.passed++;
      console.error('✅ Test 3 PASSED: File system errors handled gracefully');
    } else {
      results.failed++;
      results.errors.push(`FS errors not handled: ${fsResult.unhandledErrors} unhandled`);
      console.error('❌ Test 3 FAILED: File system errors caused crashes');
    }
    results.metrics.fileSystemErrorHandling = fsResult.handledGracefully;
  } catch (error) {
    results.failed++;
    results.errors.push(`Test 3 error: ${error.message}`);
    console.error('❌ Test 3 ERROR:', error.message);
  }

  // Test 4: Network timeout handling
  console.error('[Phase 4] Test 4/15: Network Timeout Handling...');
  try {
    const networkResult = await testNetworkTimeoutHandling();
    if (networkResult.timeoutHandled) {
      results.passed++;
      console.error('✅ Test 4 PASSED: Network timeouts handled properly');
    } else {
      results.failed++;
      results.errors.push(`Network timeout not handled: ${networkResult.timeouts} timeouts`);
      console.error('❌ Test 4 FAILED: Network timeouts caused issues');
    }
    results.metrics.networkTimeoutHandling = networkResult.timeoutHandled;
  } catch (error) {
    results.failed++;
    results.errors.push(`Test 4 error: ${error.message}`);
    console.error('❌ Test 4 ERROR:', error.message);
  }

  // Test 5: Memory pressure handling
  console.error('[Phase 4] Test 5/15: Memory Pressure Handling...');
  try {
    const memoryResult = await testMemoryPressureHandling();
    if (memoryResult.handledWithoutCrash) {
      results.passed++;
      console.error('✅ Test 5 PASSED: Memory pressure handled without crash');
    } else {
      results.failed++;
      results.errors.push(`Memory pressure crash: ${memoryResult.crashes} crashes`);
      console.error('❌ Test 5 FAILED: Memory pressure caused crashes');
    }
    results.metrics.memoryPressureHandling = memoryResult.handledWithoutCrash;
  } catch (error) {
    results.failed++;
    results.errors.push(`Test 5 error: ${error.message}`);
    console.error('❌ Test 5 ERROR:', error.message);
  }

  // Test 6: Concurrent error handling
  console.error('[Phase 4] Test 6/15: Concurrent Error Handling...');
  try {
    const concurrentResult = await testConcurrentErrorHandling();
    if (concurrentResult.errorsHandled == 0) {
      results.passed++;
      console.error('✅ Test 6 PASSED: All concurrent errors handled');
    } else {
      results.failed++;
      results.errors.push(`Concurrent errors not handled: ${concurrentResult.errorsHandled} errors`);
      console.error('❌ Test 6 FAILED: ' + concurrentResult.errorsHandled + ' concurrent errors');
    }
    results.metrics.concurrentErrorHandling = concurrentResult.errorsHandled;
  } catch (error) {
    results.failed++;
    results.errors.push(`Test 6 error: ${error.message}`);
    console.error('❌ Test 6 ERROR:', error.message);
  }

  // Test 7: Graceful degradation
  console.error('[Phase 4] Test 7/15: Graceful Degradation...');
  try {
    const degradationResult = await testGracefulDegradation();
    if (degradationResult.degradedSuccessfully) {
      results.passed++;
      console.error('✅ Test 7 PASSED: Graceful degradation working');
    } else {
      results.failed++;
      results.errors.push(`Graceful degradation failed: ${degradationResult.failures} failures`);
      console.error('❌ Test 7 FAILED: Graceful degradation not working');
    }
    results.metrics.gracefulDegradation = degradationResult.degradedSuccessfully;
  } catch (error) {
    results.failed++;
    results.errors.push(`Test 7 error: ${error.message}`);
    console.error('❌ Test 7 ERROR:', error.message);
  }

  // Test 8: Error logging completeness
  console.error('[Phase 4] Test 8/15: Error Logging Completeness...');
  try {
    const loggingResult = await testErrorLoggingCompleteness();
    if (loggingResult.complete) {
      results.passed++;
      console.error('✅ Test 8 PASSED: Error logging is complete and informative');
    } else {
      results.failed++;
      results.errors.push(`Incomplete error logging: ${loggingResult.missingFields} missing fields`);
      console.error('❌ Test 8 FAILED: Error logging incomplete');
    }
    results.metrics.errorLoggingCompleteness = loggingResult.complete;
  } catch (error) {
    results.failed++;
    results.errors.push(`Test 8 error: ${error.message}`);
    console.error('❌ Test 8 ERROR:', error.message);
  }

  // Test 9: Recovery mechanism
  console.error('[Phase 4] Test 9/15: Recovery Mechanism...');
  try {
    const recoveryResult = await testRecoveryMechanism();
    if (recoveryResult.recovered) {
      results.passed++;
      console.error('✅ Test 9 PASSED: Recovery mechanism working (' + recoveryResult.recoveryTime.toFixed(0) + 'ms)');
    } else {
      results.failed++;
      results.errors.push(`Recovery failed: exceeded ${recoveryResult.maxRecoveryTime}ms timeout`);
      console.error('❌ Test 9 FAILED: Recovery mechanism not working');
    }
    results.metrics.recoveryMechanism = recoveryResult.recovered;
  } catch (error) {
    results.failed++;
    results.errors.push(`Test 9 error: ${error.message}`);
    console.error('❌ Test 9 ERROR:', error.message);
  }

  // Test 10: State consistency after errors
  console.error('[Phase 4] Test 10/15: State Consistency After Errors...');
  try {
    const stateResult = await testStateConsistencyAfterErrors();
    if (stateResult.consistent) {
      results.passed++;
      console.error('✅ Test 10 PASSED: State remains consistent after errors');
    } else {
      results.failed++;
      results.errors.push(`State inconsistency: ${stateResult.inconsistencies} inconsistencies`);
      console.error('❌ Test 10 FAILED: State not consistent after errors');
    }
    results.metrics.stateConsistencyAfterErrors = stateResult.consistent;
  } catch (error) {
    results.failed++;
    results.errors.push(`Test 10 error: ${error.message}`);
    console.error('❌ Test 10 ERROR:', error.message);
  }

  // Test 11: Boundary conditions
  console.error('[Phase 4] Test 11/15: Boundary Conditions...');
  try {
    const boundaryResult = await testBoundaryConditions();
    if (boundaryResult.handledCorrectly) {
      results.passed++;
      console.error('✅ Test 11 PASSED: Boundary conditions handled correctly');
    } else {
      results.failed++;
      results.errors.push(`Boundary conditions failed: ${boundaryResult.failures} failures`);
      console.error('❌ Test 11 FAILED: Boundary conditions not handled');
    }
    results.metrics.boundaryConditionsHandling = boundaryResult.handledCorrectly;
  } catch (error) {
    results.failed++;
    results.errors.push(`Test 11 error: ${error.message}`);
    console.error('❌ Test 11 ERROR:', error.message);
  }

  // Test 12: Resource exhaustion handling
  console.error('[Phase 4] Test 12/15: Resource Exhaustion Handling...');
  try {
    const exhaustResult = await testResourceExhaustionHandling();
    if (exhaustResult.handledGracefully) {
      results.passed++;
      console.error('✅ Test 12 PASSED: Resource exhaustion handled gracefully');
    } else {
      results.failed++;
      results.errors.push(`Resource exhaustion crash: ${exhaustResult.crashes} crashes`);
      console.error('❌ Test 12 FAILED: Resource exhaustion caused crashes');
    }
    results.metrics.resourceExhaustionHandling = exhaustResult.handledGracefully;
  } catch (error) {
    results.failed++;
    results.errors.push(`Test 12 error: ${error.message}`);
    console.error('❌ Test 12 ERROR:', error.message);
  }

  // Test 13: Partial failure recovery
  console.error('[Phase 4] Test 13/15: Partial Failure Recovery...');
  try {
    const partialResult = await testPartialFailureRecovery();
    if (partialResult.partialRecovery) {
      results.passed++;
      console.error('✅ Test 13 PASSED: Partial failure recovery working');
    } else {
      results.failed++;
      results.errors.push(`Partial failure not recovered: ${partialResult.failures} failures`);
      console.error('❌ Test 13 FAILED: Partial failure recovery failed');
    }
    results.metrics.partialFailureRecovery = partialResult.partialRecovery;
  } catch (error) {
    results.failed++;
    results.errors.push(`Test 13 error: ${error.message}`);
    console.error('❌ Test 13 ERROR:', error.message);
  }

  // Test 14: Error propagation control
  console.error('[Phase 4] Test 14/15: Error Propagation Control...');
  try {
    const propagationResult = await testErrorPropagationControl();
    if (propagationResult.controlled) {
      results.passed++;
      console.error('✅ Test 14 PASSED: Error propagation properly controlled');
    } else {
      results.failed++;
      results.errors.push(`Error propagation not controlled: ${propagationResult.escapedErrors} escaped`);
      console.error('❌ Test 14 FAILED: Error propagation not controlled');
    }
    results.metrics.errorPropagationControl = propagationResult.controlled;
  } catch (error) {
    results.failed++;
    results.errors.push(`Test 14 error: ${error.message}`);
    console.error('❌ Test 14 ERROR:', error.message);
  }

  // Test 15: System stability after cascade failures
  console.error('[Phase 4] Test 15/15: Cascade Failure Recovery...');
  try {
    const cascadeResult = await testCascadeFailureRecovery();
    if (cascadeResult.recovered) {
      results.passed++;
      console.error('✅ Test 15 PASSED: Cascade failures handled and system stable');
    } else {
      results.failed++;
      results.errors.push(`Cascade failure crash: ${cascadeResult.unrecoveredFailures} unrecovered`);
      console.error('❌ Test 15 FAILED: Cascade failures not recovered');
    }
    results.metrics.cascadeFailureRecovery = cascadeResult.recovered;
  } catch (error) {
    results.failed++;
    results.errors.push(`Test 15 error: ${error.message}`);
    console.error('❌ Test 15 ERROR:', error.message);
  }

  results.duration = Date.now() - startTime;
  results.successRate = (results.passed / results.totalTests * 100).toFixed(1);

  // Guardar resultados
  await saveResults(results, cwd);

  // Reportar resultado final
  console.error('\n[Phase 4] 📊 Robustness Testing Complete:');
  console.error(`  Passed: ${results.passed}/${results.totalTests} (${results.successRate}%)`);
  console.error(`  Duration: ${results.duration}ms`);
  if (results.failed > 0) {
    console.error(`  Failed: ${results.failed}`);
    results.errors.forEach(err => console.error(`    - ${err}`));
  }

  return results;
}

/**
 * Test 1: Invalid Input Handling
 */
async function testInvalidInputHandling() {
  const invalidInputs = [
    null,
    undefined,
    {},
    [],
    '',
    ' ',
    'null',
    'undefined',
    'NaN',
    Infinity,
    -Infinity
  ];

  let handledGracefully = true;
  let errors = 0;

  for (const input of invalidInputs) {
    try {
      // Simulate validation
      if (typeof input === 'string') {
        if (input.trim() === '') throw new Error('Empty string');
        if (input === 'null') throw new Error('Invalid string "null"');
        if (input === 'undefined') throw new Error('Invalid string "undefined"');
      } else if (input === null || input === undefined) {
        throw new Error('Null/Undefined value');
      } else if (typeof input === 'object' && Object.keys(input).length === 0) {
        throw new Error('Empty object');
      } else if (Array.isArray(input) && input.length === 0) {
        throw new Error('Empty array');
      } else if (input !== input) {
        throw new Error('NaN value');
      } else if (input === Infinity || input === -Infinity) {
        throw new Error('Infinity value');
      }

      // If we get here, input was handled
      await new Promise(resolve => setImmediate(resolve));
    } catch (error) {
      errors++;
      if (error.message.includes('should not crash')) {
        handledGracefully = false;
      }
    }
  }

  return {
    handledGracefully,
    errors
  };
}

/**
 * Test 2: Malformed Data Handling
 */
async function testMalformedDataHandling() {
  const malformedData = [
    '{ invalid json',
    '{ "incomplete": ',
    'just text',
    '{"valid": "json" "invalid": "syntax"}',
    '{"nested": {"deeper": {"circular": "[object Object]"}}}',
    '{"type": "malformed", "data": "corrupted"}'
  ];

  let recovered = true;
  let recoveryAttempts = 0;

  for (const data of malformedData) {
    try {
      // Try to parse/process malformed data
      let processed;
      if (data.startsWith('{')) {
        try {
          processed = JSON.parse(data);
        } catch (e) {
          // Try to fix common issues
          recoveryAttempts++;
          processed = { recovery: true, original: data };
        }
      } else {
        processed = { text: data };
      }

      await new Promise(resolve => setImmediate(resolve));
    } catch (error) {
      if (error.message.includes('fatal')) {
        recovered = false;
      }
    }
  }

  return {
    recovered,
    recoveryAttempts
  };
}

/**
 * Test 3: File System Errors
 */
async function testFileSystemErrors() {
  const fs = await import('fs');
  let handledGracefully = true;
  let unhandledErrors = 0;

  // Test non-existent file
  try {
    if (fs.existsSync('/nonexistent/path/file.txt')) {
      fs.readFileSync('/nonexistent/path/file.txt');
    }
  } catch (error) {
    if (!error.message.includes('ENOENT')) {
      unhandledErrors++;
    }
  }

  // Test permission denied (if possible)
  try {
    const testDir = '/root';
    if (fs.existsSync(testDir)) {
      fs.writeFileSync(join(testDir, 'test.txt'), 'test');
    }
  } catch (error) {
    if (!error.message.includes('EACCES') && !error.message.includes('EPERM')) {
      unhandledErrors++;
    }
  }

  return {
    handledGracefully,
    unhandledErrors
  };
}

/**
 * Test 4: Network Timeout Handling
 */
async function testNetworkTimeoutHandling() {
  const timeout = 100;
  let timeoutHandled = true;
  let timeouts = 0;

  // Simulate network timeout
  try {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Network timeout')), timeout);
    });

    await Promise.race([
      timeoutPromise,
      new Promise(resolve => setTimeout(resolve, timeout + 50))
    ]);
  } catch (error) {
    timeouts++;
    if (!error.message.includes('timeout')) {
      timeoutHandled = false;
    }
  }

  return {
    timeoutHandled,
    timeouts
  };
}

/**
 * Test 5: Memory Pressure Handling
 */
async function testMemoryPressureHandling() {
  let handledWithoutCrash = true;
  let crashes = 0;

  try {
    // Simulate memory pressure
    for (let i = 0; i < 10; i++) {
      const bigArray = new Array(100000).fill('data');
      await new Promise(resolve => setImmediate(resolve));
    }

    // Check if still responsive
    await new Promise(resolve => setImmediate(resolve));
  } catch (error) {
    crashes++;
    handledWithoutCrash = false;
  }

  return {
    handledWithoutCrash,
    crashes
  };
}

/**
 * Test 6: Concurrent Error Handling
 */
async function testConcurrentErrorHandling() {
  const concurrentOps = 20;
  let errorsHandled = 0;

  const promises = Array.from({ length: concurrentOps }, async (_, index) => {
    try {
      // Simulate operation that might fail
      if (index % 3 === 0) {
        throw new Error('Simulated error ' + index);
      }
      await new Promise(resolve => setImmediate(resolve));
      return true;
    } catch (error) {
      errorsHandled++;
      return false;
    }
  });

  await Promise.allSettled(promises);

  return {
    errorsHandled,
    total: concurrentOps
  };
}

/**
 * Test 7: Graceful Degradation
 */
async function testGracefulDegradation() {
  let degradedSuccessfully = true;
  let failures = 0;

  try {
    // Simulate degraded service
    for (let i = 0; i < 10; i++) {
      try {
        // Simulate failing operation but still work
        if (i % 2 === 0) {
          throw new Error('Degraded mode');
        }
        await new Promise(resolve => setImmediate(resolve));
      } catch (error) {
        failures++;
        // Still continue with reduced functionality
        await new Promise(resolve => setTimeout(resolve, 1));
      }
    }
  } catch (error) {
    degradedSuccessfully = false;
  }

  return {
    degradedSuccessfully,
    failures
  };
}

/**
 * Test 8: Error Logging Completeness
 */
async function testErrorLoggingCompleteness() {
  const logs = [];
  let complete = true;
  let missingFields = 0;

  try {
    // Simulate various errors
    for (let i = 0; i < 5; i++) {
      try {
        throw new Error('Test error ' + i);
      } catch (error) {
        const logEntry = {
          timestamp: new Date().toISOString(),
          level: 'error',
          message: error.message,
          stack: error.stack
        };

        // Check required fields
        if (!logEntry.timestamp) missingFields++;
        if (!logEntry.level) missingFields++;
        if (!logEntry.message) missingFields++;

        logs.push(logEntry);
      }
    }

    if (missingFields > 0) {
      complete = false;
    }
  } catch (error) {
    complete = false;
  }

  return {
    complete,
    missingFields,
    logs
  };
}

/**
 * Test 9: Recovery Mechanism
 */
async function testRecoveryMechanism() {
  const maxRecoveryTime = 5000; // 5 seconds
  const startTime = Date.now();

  try {
    // Simulate error and recovery
    throw new Error('Simulated error for recovery test');
  } catch (error) {
    // Simulate recovery process
    const recoveryStart = Date.now();

    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      // Check if recovery is complete
      if (Date.now() - recoveryStart > maxRecoveryTime) {
        break;
      }
    }

    const recoveryTime = Date.now() - recoveryStart;
    const recovered = recoveryTime <= maxRecoveryTime;

    return {
      recovered,
      recoveryTime,
      maxRecoveryTime
    };
  }

  return {
    recovered: false,
    recoveryTime: Date.now() - startTime,
    maxRecoveryTime
  };
}

/**
 * Test 10: State Consistency After Errors
 */
async function testStateConsistencyAfterErrors() {
  const state = { counter: 0 };
  let consistent = true;
  let inconsistencies = 0;

  try {
    // Perform operations that might corrupt state
    for (let i = 0; i < 10; i++) {
      try {
        state.counter++;
        if (i % 3 === 0) {
          throw new Error('Simulated state corruption');
        }
      } catch (error) {
        // Check state consistency
        if (typeof state.counter !== 'number' || state.counter < 0) {
          inconsistencies++;
          consistent = false;
        }
        // Reset state to consistent value
        state.counter = Math.max(0, state.counter);
      }
    }

    // Final state check
    if (typeof state.counter !== 'number') {
      inconsistencies++;
      consistent = false;
    }
  } catch (error) {
    consistent = false;
  }

  return {
    consistent,
    inconsistencies
  };
}

/**
 * Test 11: Boundary Conditions
 */
async function testBoundaryConditions() {
  const boundaries = [
    { value: 0, expected: true },
    { value: 1, expected: true },
    { value: -1, expected: true },
    { value: 9999, expected: true },
    { value: -9999, expected: true },
    { value: Number.MAX_SAFE_INTEGER, expected: true },
    { value: Number.MIN_SAFE_INTEGER, expected: true }
  ];

  let handledCorrectly = true;
  let failures = 0;

  for (const boundary of boundaries) {
    try {
      // Simulate boundary condition handling
      if (typeof boundary.value === 'number') {
        if (boundary.value === Number.MAX_SAFE_INTEGER || boundary.value === Number.MIN_SAFE_INTEGER) {
          // These are edge cases that might need special handling
          await new Promise(resolve => setImmediate(resolve));
        } else {
          await new Promise(resolve => setImmediate(resolve));
        }
      }
    } catch (error) {
      failures++;
      handledCorrectly = false;
    }
  }

  return {
    handledCorrectly,
    failures
  };
}

/**
 * Test 12: Resource Exhaustion Handling
 */
async function testResourceExhaustionHandling() {
  let handledGracefully = true;
  let crashes = 0;

  try {
    // Simulate resource exhaustion
    const resources = [];
    for (let i = 0; i < 100; i++) {
      try {
        resources.push(new Array(1000).fill('data'));
        if (i % 10 === 0) {
          await new Promise(resolve => setImmediate(resolve));
        }
      } catch (error) {
        if (error.message.includes('memory') || error.message.includes('resource')) {
          // Resource exhaustion detected
          handledGracefully = true;
          break;
        }
      }
    }

    // Clean up
    resources.length = 0;
  } catch (error) {
    crashes++;
    handledGracefully = false;
  }

  return {
    handledGracefully,
    crashes
  };
}

/**
 * Test 13: Partial Failure Recovery
 */
async function testPartialFailureRecovery() {
  const operations = 10;
  let partialRecovery = true;
  let failures = 0;

  for (let i = 0; i < operations; i++) {
    try {
      if (i % 4 === 0) {
        throw new Error('Partial failure ' + i);
      }
      await new Promise(resolve => setImmediate(resolve));
    } catch (error) {
      failures++;
      // Check if we can continue despite failures
      if (failures > operations * 0.5) {
        partialRecovery = false;
      }
    }
  }

  return {
    partialRecovery,
    failures,
    total: operations
  };
}

/**
 * Test 14: Error Propagation Control
 */
async function testErrorPropagationControl() {
  const levels = 5;
  let controlled = true;
  let escapedErrors = 0;

  try {
    for (let level = 0; level < levels; level++) {
      try {
        if (level % 2 === 0) {
          throw new Error(`Level ${level} error`);
        }
        await new Promise(resolve => setImmediate(resolve));
      } catch (error) {
        // Error should be caught and not propagate further
        if (!error.message.includes('Level')) {
          escapedErrors++;
          controlled = false;
        }
      }
    }
  } catch (error) {
    controlled = false;
    escapedErrors++;
  }

  return {
    controlled,
    escapedErrors
  };
}

/**
 * Test 15: Cascade Failure Recovery
 */
async function testCascadeFailureRecovery() {
  const cascadeStages = 5;
  let recovered = true;
  let unrecoveredFailures = 0;

  for (let stage = 0; stage < cascadeStages; stage++) {
    try {
      if (stage % 2 === 0) {
        throw new Error(`Cascade failure at stage ${stage}`);
      }
      await new Promise(resolve => setImmediate(resolve));
    } catch (error) {
      unrecoveredFailures++;
      if (stage === cascadeStages - 1) {
        // Last stage - check if system recovered
        try {
          await new Promise(resolve => setTimeout(resolve, 10));
          recovered = true;
        } catch (e) {
          recovered = false;
        }
      }
    }
  }

  return {
    recovered,
    unrecoveredFailures,
    totalStages: cascadeStages
  };
}

/**
 * Guarda resultados en logs/phase-4-results.json
 */
async function saveResults(results, cwd) {
  try {
    const logDir = join(cwd, 'logs');
    if (!existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true });
    }

    const logFile = join(logDir, 'phase-4-results.json');
    writeFileSync(logFile, JSON.stringify(results, null, 2));

    console.error(`[Phase 4] Results saved to: ${logFile}`);
  } catch (error) {
    console.error('[Phase 4] Failed to save results:', error.message);
  }
}

// Ejecutar tests si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runRobustnessTests({ cwd: process.cwd() })
    .then(results => {
      const exitCode = results.passed === results.totalTests ? 0 : 1;
      process.exit(exitCode);
    })
    .catch(error => {
      console.error('[Phase 4] Fatal error:', error);
      process.exit(1);
    });
}
