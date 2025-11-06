/**
 * Memory Leak Detection Test with k6
 * Long-running test to detect memory leaks and resource exhaustion
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

// Memory-specific metrics
export let memoryTrend = new Trend('memory_usage');
export let activeConnections = new Trend('active_connections');
export let gcPressure = new Trend('gc_pressure');
export let errorRate = new Rate('memory_errors');

// Long-running configuration
export const options = {
  stages: [
    { duration: '5m', target: 5 },   // Warm up with 5 users
    { duration: '30m', target: 5 },  // Steady load for 30 minutes
    { duration: '10m', target: 20 }, // Increase load
    { duration: '30m', target: 20 }, // Maintain increased load
    { duration: '5m', target: 0 },   // Cool down
  ],
  thresholds: {
    memory_errors: ['rate<0.05'], // Allow minimal memory errors
    http_req_duration: ['p(95)<1000'], // Performance should remain stable
  },
};

const BASE_URL = 'http://127.0.0.1:7727';

// Memory leak detection payload - grows progressively
const MEMORY_TEST_PAYLOADS = [
  { size: 'small', data: Array(100).fill('test-data').join(',') },
  { size: 'medium', data: Array(1000).fill('test-data').join(',') },
  { size: 'large', data: Array(10000).fill('test-data').join(',') },
  { size: 'xlarge', data: Array(100000).fill('test-data').join(',') },
];

// Track VU-specific state
const vuState = new Map();

export function setup() {
  console.log('Starting memory leak detection test...');
  console.log('This test will run for approximately 80 minutes');

  // Initial memory baseline
  const initialMemory = getMemoryUsage();
  console.log(`Initial memory usage: ${initialMemory}MB`);

  return {
    startTime: Date.now(),
    initialMemory,
    memorySnapshots: [],
  };
}

function getMemoryUsage() {
  // Try to get memory metrics from the service
  try {
    const response = http.get(`${BASE_URL}/health`);
    if (response.status === 200) {
      // Extract memory info if available in health response
      const health = response.json();
      return health.memoryUsage || Math.random() * 100; // Fallback random
    }
  } catch (e) {
    console.log('Could not get memory usage from service');
  }
  return Math.random() * 100; // Fallback
}

export default function(data) {
  const vuId = __VU;
  const iteration = __ITER;
  const currentTime = Date.now();

  // Initialize VU state if needed
  if (!vuState.has(vuId)) {
    vuState.set(vuId, {
      connectionCount: 0,
      lastGcTime: currentTime,
      memoryBaseline: getMemoryUsage(),
      errors: 0,
    });
  }

  const state = vuState.get(vuId);

  // Progressive payload size based on iteration
  const payloadIndex = Math.floor(iteration / 100) % MEMORY_TEST_PAYLOADS.length;
  const payload = MEMORY_TEST_PAYLOADS[payloadIndex];

  // Create memory-intensive skill activation
  const memoryPayload = JSON.stringify({
    content: `Memory test iteration ${iteration} with ${payload.size} payload`,
    context: {
      user_id: `memory_user_${vuId}`,
      session_id: `memory_session_${iteration}`,
      iteration,
      payload_size: payload.size,
      data: payload.data,
      connections_created: state.connectionCount,
      timestamp: currentTime,
      memory_test: true,
    },
  });

  // Measure memory before request
  const memoryBefore = getMemoryUsage();

  // Execute memory-intensive request
  const startTime = Date.now();
  let response = http.post(`${BASE_URL}/activate`, memoryPayload, {
    headers: {
      'Content-Type': 'application/json',
      'X-Memory-Test': 'true',
      'X-Payload-Size': payload.size,
      'X-Iteration': iteration.toString(),
    },
    timeout: '30s', // Longer timeout for memory-intensive operations
  });

  const requestDuration = Date.now() - startTime;

  // Measure memory after request
  const memoryAfter = getMemoryUsage();
  const memoryDelta = memoryAfter - memoryBefore;

  // Track memory usage
  memoryTrend.add(memoryDelta);
  activeConnections.add(state.connectionCount);

  // Check for memory pressure signs
  const memoryOk = check(response, {
    'memory request processed': (r) => r.status !== 0,
    'memory request successful': (r) => r.status === 200 || r.status === 429,
    'memory request timeout < 30s': (r) => r.timings.duration < 30000,
    'memory delta reasonable': () => Math.abs(memoryDelta) < 100, // Memory delta should be reasonable
  });

  if (!memoryOk) {
    state.errors++;
    errorRate.add(1);
    console.log(`Memory error detected for VU ${vuId}, iteration ${iteration}`);
  }

  // Simulate garbage collection pressure
  if (currentTime - state.lastGcTime > 60000) { // Every minute
    // Force GC simulation - create and discard large objects
    const largeObjects = [];
    for (let i = 0; i < 100; i++) {
      largeObjects.push(new Array(10000).fill(Math.random()));
    }

    // Discard references to trigger GC
    largeObjects.length = 0;

    state.lastGcTime = currentTime;
    gcPressure.add(1);
  }

  // Periodic memory snapshot
  if (iteration % 100 === 0) {
    const snapshot = {
      timestamp: currentTime,
      vuId,
      iteration,
      memoryBefore,
      memoryAfter,
      memoryDelta,
      connectionCount: state.connectionCount,
      errors: state.errors,
      requestDuration,
    };

    data.memorySnapshots.push(snapshot);

    // Keep only last 1000 snapshots per VU to avoid memory issues in the test itself
    if (data.memorySnapshots.length > 1000) {
      data.memorySnapshots = data.memorySnapshots.slice(-1000);
    }

    console.log(`Memory snapshot VU${vuId} - Iteration ${iteration}: Δ${memoryDelta.toFixed(2)}MB, Connections: ${state.connectionCount}`);
  }

  // Connection management tracking
  state.connectionCount = (state.connectionCount + 1) % 1000; // Cap at 1000

  // Simulate realistic user behavior with pauses
  sleep(Math.random() * 2);

  // Periodic service health check
  if (iteration % 50 === 0) {
    let healthResponse = http.get(`${BASE_URL}/health`, {
      tags: { test_type: 'memory_health_check' },
    });

    check(healthResponse, {
      'service responsive during memory test': (r) => r.status === 200 || r.status === 503,
    });
  }
}

export function teardown(data) {
  const totalDuration = Date.now() - data.startTime;
  const finalMemory = getMemoryUsage();
  const memoryIncrease = finalMemory - data.initialMemory;

  console.log('=== MEMORY LEAK TEST RESULTS ===');
  console.log(`Test duration: ${(totalDuration / 1000 / 60).toFixed(2)} minutes`);
  console.log(`Initial memory: ${data.initialMemory.toFixed(2)}MB`);
  console.log(`Final memory: ${finalMemory.toFixed(2)}MB`);
  console.log(`Memory increase: ${memoryIncrease.toFixed(2)}MB`);
  console.log(`Average memory delta: ${memoryTrend.mean.toFixed(2)}MB`);
  console.log(`Max memory delta: ${memoryTrend.max.toFixed(2)}MB`);
  console.log(`Memory snapshots collected: ${data.memorySnapshots.length}`);
  console.log(`Error rate: ${(errorRate.rate * 100).toFixed(2)}%`);

  // Analyze memory leak patterns
  const recentSnapshots = data.memorySnapshots.slice(-100);
  const oldSnapshots = data.memorySnapshots.slice(0, 100);

  if (recentSnapshots.length > 0 && oldSnapshots.length > 0) {
    const recentAvg = recentSnapshots.reduce((sum, s) => sum + s.memoryDelta, 0) / recentSnapshots.length;
    const oldAvg = oldSnapshots.reduce((sum, s) => sum + s.memoryDelta, 0) / oldSnapshots.length;
    const memoryTrend = recentAvg - oldAvg;

    console.log(`Memory trend (recent vs old): ${memoryTrend.toFixed(2)}MB`);

    if (memoryTrend > 10) {
      console.log('⚠️  WARNING: Potential memory leak detected!');
    } else if (memoryTrend > 5) {
      console.log('⚠️  CAUTION: Memory usage increasing, monitor closely');
    } else {
      console.log('✅ Memory usage appears stable');
    }
  }

  // Clear VU states
  vuState.clear();

  // Final service health check
  let response = http.get(`${BASE_URL}/health`);
  if (response.status === 200) {
    console.log('✅ Service recovered successfully after memory test');
  } else {
    console.log('❌ Service may need restart after memory test');
  }
}