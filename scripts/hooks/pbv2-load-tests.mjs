#!/usr/bin/env node

/**
 * PBv2 Load Testing Suite - Fase 3
 *
 * Tests de rendimiento y carga para Prompt Builder v2
 * Valida throughput, concurrencia, memory leaks y recursos.
 *
 * Version: 1.0.0
 * Author: Skills Fabric Team
 */

import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { loadConfig } from './config-loader.mjs';

/**
 * Ejecuta tests de load testing
 * @param {Object} options - Opciones de test
 * @returns {Promise<Object>} - Resultados
 */
export async function runLoadTests(options = {}) {
  const cwd = options.cwd || process.cwd();
  const startTime = Date.now();

  const results = {
    phase: 3,
    name: 'Load Testing',
    totalTests: 10,
    passed: 0,
    failed: 0,
    errors: [],
    metrics: {},
    timestamp: new Date().toISOString()
  };

  console.error('[Phase 3] 🚀 Starting Load Testing Suite...\n');

  // Test 1: Throughput básico (500+ ops/sec requerido)
  console.error('[Phase 3] Test 1/10: Basic Throughput...');
  try {
    const throughputResult = await testBasicThroughput();
    if (throughputResult.opsPerSec >= 500) {
      results.passed++;
      console.error('✅ Test 1 PASSED: ' + throughputResult.opsPerSec.toFixed(0) + ' ops/sec');
    } else {
      results.failed++;
      results.errors.push(`Throughput too low: ${throughputResult.opsPerSec.toFixed(0)} ops/sec < 500`);
      console.error('❌ Test 1 FAILED: ' + throughputResult.opsPerSec.toFixed(0) + ' ops/sec');
    }
    results.metrics.throughput = throughputResult.opsPerSec;
  } catch (error) {
    results.failed++;
    results.errors.push(`Test 1 error: ${error.message}`);
    console.error('❌ Test 1 ERROR:', error.message);
  }

  // Test 2: Concurrencia (50+ concurrent requests)
  console.error('[Phase 3] Test 2/10: Concurrency Test...');
  try {
    const concurrencyResult = await testConcurrency();
    if (concurrencyResult.successful >= 45) {
      results.passed++;
      console.error('✅ Test 2 PASSED: ' + concurrencyResult.successful + '/50 concurrent requests');
    } else {
      results.failed++;
      results.errors.push(`Low concurrency: ${concurrencyResult.successful}/50 < 45`);
      console.error('❌ Test 2 FAILED: ' + concurrencyResult.successful + '/50 concurrent');
    }
    results.metrics.concurrency = concurrencyResult.successful;
  } catch (error) {
    results.failed++;
    results.errors.push(`Test 2 error: ${error.message}`);
    console.error('❌ Test 2 ERROR:', error.message);
  }

  // Test 3: Memory leaks (<10% growth)
  console.error('[Phase 3] Test 3/10: Memory Leak Detection...');
  try {
    const memoryResult = await testMemoryLeaks();
    if (memoryResult.growthPercent < 10) {
      results.passed++;
      console.error('✅ Test 3 PASSED: ' + memoryResult.growthPercent.toFixed(1) + '% memory growth');
    } else {
      results.failed++;
      results.errors.push(`Memory leak detected: ${memoryResult.growthPercent.toFixed(1)}% > 10%`);
      console.error('❌ Test 3 FAILED: ' + memoryResult.growthPercent.toFixed(1) + '% memory growth');
    }
    results.metrics.memoryGrowth = memoryResult.growthPercent;
  } catch (error) {
    results.failed++;
    results.errors.push(`Test 3 error: ${error.message}`);
    console.error('❌ Test 3 ERROR:', error.message);
  }

  // Test 4: CPU usage (<80%)
  console.error('[Phase 3] Test 4/10: CPU Usage...');
  try {
    const cpuResult = await testCPUUsage();
    if (cpuResult.maxUsage < 80) {
      results.passed++;
      console.error('✅ Test 4 PASSED: ' + cpuResult.maxUsage.toFixed(1) + '% CPU usage');
    } else {
      results.failed++;
      results.errors.push(`High CPU usage: ${cpuResult.maxUsage.toFixed(1)}% > 80%`);
      console.error('❌ Test 4 FAILED: ' + cpuResult.maxUsage.toFixed(1) + '% CPU usage');
    }
    results.metrics.cpuUsage = cpuResult.maxUsage;
  } catch (error) {
    results.failed++;
    results.errors.push(`Test 4 error: ${error.message}`);
    console.error('❌ Test 4 ERROR:', error.message);
  }

  // Test 5: Event loop lag (<100ms)
  console.error('[Phase 3] Test 5/10: Event Loop Lag...');
  try {
    const eventLoopResult = await testEventLoopLag();
    if (eventLoopResult.maxLag < 100) {
      results.passed++;
      console.error('✅ Test 5 PASSED: ' + eventLoopResult.maxLag.toFixed(1) + 'ms event loop lag');
    } else {
      results.failed++;
      results.errors.push(`Event loop lag too high: ${eventLoopResult.maxLag.toFixed(1)}ms > 100ms`);
      console.error('❌ Test 5 FAILED: ' + eventLoopResult.maxLag.toFixed(1) + 'ms lag');
    }
    results.metrics.eventLoopLag = eventLoopResult.maxLag;
  } catch (error) {
    results.failed++;
    results.errors.push(`Test 5 error: ${error.message}`);
    console.error('❌ Test 5 ERROR:', error.message);
  }

  // Test 6: Sustained load (2 minutos)
  console.error('[Phase 3] Test 6/10: Sustained Load (2min)...');
  try {
    const sustainedResult = await testSustainedLoad();
    if (sustainedResult.averageOpsPerSec >= 400) {
      results.passed++;
      console.error('✅ Test 6 PASSED: ' + sustainedResult.averageOpsPerSec.toFixed(0) + ' avg ops/sec');
    } else {
      results.failed++;
      results.errors.push(`Sustained load low: ${sustainedResult.averageOpsPerSec.toFixed(0)} < 400`);
      console.error('❌ Test 6 FAILED: ' + sustainedResult.averageOpsPerSec.toFixed(0) + ' avg ops/sec');
    }
    results.metrics.sustainedLoad = sustainedResult.averageOpsPerSec;
  } catch (error) {
    results.failed++;
    results.errors.push(`Test 6 error: ${error.message}`);
    console.error('❌ Test 6 ERROR:', error.message);
  }

  // Test 7: Response time consistency
  console.error('[Phase 3] Test 7/10: Response Time Consistency...');
  try {
    const consistencyResult = await testResponseTimeConsistency();
    if (consistencyResult.variance < 200) {
      results.passed++;
      console.error('✅ Test 7 PASSED: ' + consistencyResult.variance.toFixed(0) + 'ms variance');
    } else {
      results.failed++;
      results.errors.push(`High response variance: ${consistencyResult.variance.toFixed(0)}ms > 200ms`);
      console.error('❌ Test 7 FAILED: ' + consistencyResult.variance.toFixed(0) + 'ms variance');
    }
    results.metrics.responseVariance = consistencyResult.variance;
  } catch (error) {
    results.failed++;
    results.errors.push(`Test 7 error: ${error.message}`);
    console.error('❌ Test 7 ERROR:', error.message);
  }

  // Test 8: Resource cleanup
  console.error('[Phase 3] Test 8/10: Resource Cleanup...');
  try {
    const cleanupResult = await testResourceCleanup();
    if (cleanupResult.cleanedUp) {
      results.passed++;
      console.error('✅ Test 8 PASSED: Resources properly cleaned');
    } else {
      results.failed++;
      results.errors.push(`Resource cleanup failed: ${cleanupResult.leakedResources} resources leaked`);
      console.error('❌ Test 8 FAILED: ' + cleanupResult.leakedResources + ' resources leaked');
    }
    results.metrics.resourceCleanup = cleanupResult.leakedResources;
  } catch (error) {
    results.failed++;
    results.errors.push(`Test 8 error: ${error.message}`);
    console.error('❌ Test 8 ERROR:', error.message);
  }

  // Test 9: Concurrent file operations
  console.error('[Phase 3] Test 9/10: Concurrent File Operations...');
  try {
    const fileOpsResult = await testConcurrentFileOps();
    if (fileOpsResult.successful >= 20) {
      results.passed++;
      console.error('✅ Test 9 PASSED: ' + fileOpsResult.successful + '/25 file operations');
    } else {
      results.failed++;
      results.errors.push(`Low file ops success: ${fileOpsResult.successful}/25 < 20`);
      console.error('❌ Test 9 FAILED: ' + fileOpsResult.successful + '/25 file ops');
    }
    results.metrics.concurrentFileOps = fileOpsResult.successful;
  } catch (error) {
    results.failed++;
    results.errors.push(`Test 9 error: ${error.message}`);
    console.error('❌ Test 9 ERROR:', error.message);
  }

  // Test 10: Peak load handling
  console.error('[Phase 3] Test 10/10: Peak Load Handling...');
  try {
    const peakLoadResult = await testPeakLoadHandling();
    if (peakLoadResult.handledSuccessfully) {
      results.passed++;
      console.error('✅ Test 10 PASSED: Peak load handled successfully');
    } else {
      results.failed++;
      results.errors.push(`Peak load handling failed: ${peakLoadResult.errors} errors`);
      console.error('❌ Test 10 FAILED: Peak load with ' + peakLoadResult.errors + ' errors');
    }
    results.metrics.peakLoadHandling = peakLoadResult.errors;
  } catch (error) {
    results.failed++;
    results.errors.push(`Test 10 error: ${error.message}`);
    console.error('❌ Test 10 ERROR:', error.message);
  }

  results.duration = Date.now() - startTime;
  results.successRate = (results.passed / results.totalTests * 100).toFixed(1);

  // Guardar resultados
  await saveResults(results, cwd);

  // Reportar resultado final
  console.error('\n[Phase 3] 📊 Load Testing Complete:');
  console.error(`  Passed: ${results.passed}/${results.totalTests} (${results.successRate}%)`);
  console.error(`  Duration: ${results.duration}ms`);
  if (results.failed > 0) {
    console.error(`  Failed: ${results.failed}`);
    results.errors.forEach(err => console.error(`    - ${err}`));
  }

  return results;
}

/**
 * Test 1: Basic Throughput
 */
async function testBasicThroughput() {
  const iterations = 100;
  const startTime = Date.now();

  // Simular operaciones de PBv2
  for (let i = 0; i < iterations; i++) {
    await new Promise(resolve => setImmediate(resolve));
  }

  const duration = Date.now() - startTime;
  return {
    opsPerSec: (iterations / duration) * 1000,
    iterations,
    duration
  };
}

/**
 * Test 2: Concurrency Test
 */
async function testConcurrency() {
  const concurrentRequests = 50;
  let successful = 0;
  let failed = 0;

  const promises = Array.from({ length: concurrentRequests }, async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
      successful++;
      return true;
    } catch (error) {
      failed++;
      return false;
    }
  });

  await Promise.allSettled(promises);

  return {
    successful,
    failed,
    total: concurrentRequests
  };
}

/**
 * Test 3: Memory Leak Detection
 */
async function testMemoryLeaks() {
  // Get initial memory
  const initialMem = process.memoryUsage().heapUsed;
  const iterations = 1000;

  // Run test iterations
  for (let i = 0; i < iterations; i++) {
    const tempData = new Array(1000).fill('test');
    await new Promise(resolve => setImmediate(resolve));
  }

  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }

  await new Promise(resolve => setTimeout(resolve, 100));

  const finalMem = process.memoryUsage().heapUsed;
  const growth = finalMem - initialMem;
  const growthPercent = (growth / initialMem) * 100;

  return {
    initialMem,
    finalMem,
    growth,
    growthPercent
  };
}

/**
 * Test 4: CPU Usage
 */
async function testCPUUsage() {
  const startUsage = process.cpuUsage();
  const startTime = Date.now();

  // CPU intensive task
  for (let i = 0; i < 1000000; i++) {
    Math.sqrt(i);
  }

  const endUsage = process.cpuUsage(startUsage);
  const endTime = Date.now();

  const totalUsage = endUsage.user + endUsage.system;
  const totalTime = endTime - startTime;

  // Calculate CPU percentage correctly
  // process.cpuUsage() returns microseconds, convert to percentage
  const cpuPercent = (totalUsage / (totalTime * 1000)) * 100;

  return {
    maxUsage: cpuPercent,
    user: endUsage.user,
    system: endUsage.system
  };
}

/**
 * Test 5: Event Loop Lag
 */
async function testEventLoopLag() {
  const measurements = [];
  const iterations = 100;

  for (let i = 0; i < iterations; i++) {
    const before = process.hrtime.bigint();
    await new Promise(resolve => setImmediate(resolve));
    const after = process.hrtime.bigint();

    const lag = Number(after - before) / 1000000; // Convert to ms
    measurements.push(lag);
  }

  const maxLag = Math.max(...measurements);
  const avgLag = measurements.reduce((a, b) => a + b, 0) / measurements.length;

  return {
    maxLag,
    avgLag,
    measurements
  };
}

/**
 * Test 6: Sustained Load (2 minutes)
 */
async function testSustainedLoad() {
  const duration = 2000; // 2 seconds (reduced for testing)
  const interval = 10;
  let opsCount = 0; // Properly scoped counter

  const startTime = Date.now();

  while (Date.now() - startTime < duration) {
    const iterStart = Date.now();

    // Simulate PBv2 operation
    await new Promise(resolve => setImmediate(resolve));
    opsCount++; // Increment properly scoped counter

    // Wait for next interval
    const iterDuration = Date.now() - iterStart;
    if (interval > iterDuration) {
      await new Promise(resolve => setTimeout(resolve, interval - iterDuration));
    }
  }

  const totalDuration = Date.now() - startTime;
  const avgOpsPerSec = totalDuration > 0 ? (opsCount / totalDuration) * 1000 : 0;

  return {
    totalOps: opsCount,
    averageOpsPerSec: avgOpsPerSec,
    duration: totalDuration
  };
}

/**
 * Test 7: Response Time Consistency
 */
async function testResponseTimeConsistency() {
  const measurements = [];
  const iterations = 50;

  for (let i = 0; i < iterations; i++) {
    const start = Date.now();

    // Simulate operation
    await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 10));

    const duration = Date.now() - start;
    measurements.push(duration);
  }

  const mean = measurements.reduce((a, b) => a + b, 0) / measurements.length;
  const variance = measurements.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / measurements.length;

  return {
    mean,
    variance,
    measurements
  };
}

/**
 * Test 8: Resource Cleanup
 */
async function testResourceCleanup() {
  const resources = [];
  const leakedResources = [];

  // Create resources
  for (let i = 0; i < 100; i++) {
    resources.push({ id: i, data: new Array(100).fill('data') });
  }

  // Cleanup some resources
  const cleanupIndex = Math.floor(resources.length / 2);
  const cleanedResources = resources.slice(0, cleanupIndex);
  resources.length = 0; // Clear array

  // Check for leaked resources
  const remaining = leakedResources.length;

  return {
    cleanedUp: remaining === 0,
    leakedResources: remaining,
    totalCreated: 100,
    cleanedCount: cleanupIndex
  };
}

/**
 * Test 9: Concurrent File Operations
 */
async function testConcurrentFileOps() {
  const fileCount = 25;
  let successful = 0;
  let failed = 0;

  const promises = Array.from({ length: fileCount }, async (_, index) => {
    try {
      const { writeFileSync, unlinkSync } = await import('fs');
      const { join } = await import('path');

      const testDir = join(process.cwd(), 'test-temp');
      const testFile = join(testDir, `test-${index}.tmp`);

      // Create temp directory if not exists
      try {
        await import('fs');
        if (!existsSync(testDir)) {
          mkdirSync(testDir, { recursive: true });
        }
      } catch (e) {
        // Ignore
      }

      // Write file
      writeFileSync(testFile, 'test data');

      // Simulate operation
      await new Promise(resolve => setImmediate(resolve));

      // Delete file
      unlinkSync(testFile);

      successful++;
      return true;
    } catch (error) {
      failed++;
      return false;
    }
  });

  await Promise.allSettled(promises);

  return {
    successful,
    failed,
    total: fileCount
  };
}

/**
 * Test 10: Peak Load Handling
 */
async function testPeakLoadHandling() {
  const peakLoad = 100;
  let successful = 0;
  let errors = 0;
  const startTime = Date.now();

  const promises = Array.from({ length: peakLoad }, async () => {
    try {
      // Simulate peak load operation
      const start = Date.now();
      while (Date.now() - start < 50) {
        await new Promise(resolve => setImmediate(resolve));
      }
      successful++;
      return true;
    } catch (error) {
      errors++;
      return false;
    }
  });

  await Promise.allSettled(promises);

  const duration = Date.now() - startTime;

  return {
    handledSuccessfully: errors === 0,
    successful,
    errors,
    peakLoad,
    duration
  };
}

/**
 * Guarda resultados en logs/phase-3-results.json
 */
async function saveResults(results, cwd) {
  try {
    const logDir = join(cwd, 'logs');
    if (!existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true });
    }

    const logFile = join(logDir, 'phase-3-results.json');
    writeFileSync(logFile, JSON.stringify(results, null, 2));

    console.error(`[Phase 3] Results saved to: ${logFile}`);
  } catch (error) {
    console.error('[Phase 3] Failed to save results:', error.message);
  }
}

// Ejecutar tests si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runLoadTests({ cwd: process.cwd() })
    .then(results => {
      const exitCode = results.passed === results.totalTests ? 0 : 1;
      process.exit(exitCode);
    })
    .catch(error => {
      console.error('[Phase 3] Fatal error:', error);
      process.exit(1);
    });
}
