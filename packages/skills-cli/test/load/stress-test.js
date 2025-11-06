/**
 * Stress Testing with k6
 * Tests CLI performance under extreme load to find system limits
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
export let errorRate = new Rate('errors');
export let responseTime = new Trend('response_time');
export let memoryUsage = new Trend('memory_usage');

// Stress test configuration - progressive load increase
export const options = {
  stages: [
    { duration: '1m', target: 10 },   // Warm up
    { duration: '2m', target: 50 },   // Load to 50 users
    { duration: '2m', target: 100 },  // Load to 100 users
    { duration: '2m', target: 200 },  // Load to 200 users
    { duration: '2m', target: 500 },  // Load to 500 users
    { duration: '5m', target: 1000 }, // Peak load - 1000 users
    { duration: '2m', target: 500 },  // Scale down
    { duration: '2m', target: 100 },  // Scale down more
    { duration: '1m', target: 0 },    // Cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // Allow higher latency under stress
    http_req_failed: ['rate<0.3'],     // Allow 30% error rate under stress
    errors: ['rate<0.3'],
  },
  throw: true, // Stop on errors to identify breaking points
};

const BASE_URL = 'http://127.0.0.1:7727';

// Complex payloads for stress testing
const COMPLEX_SKILLS = [
  {
    content: "implement comprehensive microservices architecture with service mesh, circuit breakers, distributed tracing, and real-time monitoring",
    context: { complexity: 'high', components: 20, dependencies: 50 },
  },
  {
    content: "create enterprise-grade authentication system with OAuth 2.0, JWT refresh tokens, multi-factor authentication, and SSO integration",
    context: { complexity: 'high', security_level: 'enterprise', providers: 5 },
  },
  {
    content: "build scalable data processing pipeline with ETL operations, stream processing, machine learning integration, and real-time analytics",
    context: { complexity: 'high', data_volume: 'TB', processing_type: 'streaming' },
  },
];

export function setup() {
  console.log('Starting stress test - finding system limits...');

  // Baseline health check
  let response = http.get(`${BASE_URL}/health`);
  if (response.status !== 200) {
    throw new Error('CLI service not available for stress testing');
  }

  return {
    startTime: Date.now(),
    successfulRequests: 0,
    failedRequests: 0,
  };
}

export default function(data) {
  const vuId = __VU;
  const iteration = __ITER;

  // Complex skill activation - most resource intensive
  const skillIndex = iteration % COMPLEX_SKILLS.length;
  const skillPayload = JSON.stringify({
    ...COMPLEX_SKILLS[skillIndex],
    context: {
      ...COMPLEX_SKILLS[skillIndex].context,
      user_id: `stress_user_${vuId}`,
      session_id: `stress_session_${iteration}`,
      timestamp: Date.now(),
      stress_test: true,
    },
  });

  const startTime = Date.now();

  let skillsResponse = http.post(`${BASE_URL}/activate`, skillPayload, {
    headers: {
      'Content-Type': 'application/json',
      'X-Stress-Test': 'true',
      'X-VU-ID': vuId.toString(),
      'X-Iteration': iteration.toString(),
    },
    tags: {
      endpoint: 'activate',
      test_type: 'stress',
      payload_size: skillPayload.length.toString(),
    },
  });

  const requestDuration = Date.now() - startTime;
  responseTime.add(requestDuration);

  let skillsOk = check(skillsResponse, {
    'skills activation under stress': (r) => r.status === 200 || r.status === 429 || r.status === 503,
    'response received': (r) => r.status !== 0,
    'response time < 5s': (r) => r.timings.duration < 5000,
  });

  if (skillsOk) {
    data.successfulRequests++;
  } else {
    data.failedRequests++;
    errorRate.add(1);
  }

  // Memory stress test - create large plan
  if (iteration % 10 === 0) {
    const largePlanPayload = JSON.stringify({
      description: "Generate comprehensive enterprise architecture plan with detailed implementation phases, resource allocation, risk assessment, and success metrics",
      context: {
        complexity: 'extreme',
        team_size: 50,
        timeline_months: 24,
        budget: 'enterprise',
        stakeholders: 100,
        deliverables: 500,
        risk_factors: 50,
      },
    });

    let planResponse = http.post(`${BASE_URL}/execute`, largePlanPayload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Stress-Test': 'true',
        'X-Large-Payload': 'true',
      },
      tags: {
        endpoint: 'execute',
        test_type: 'stress',
        payload_size: largePlanPayload.length.toString(),
      },
    });

    check(planResponse, {
      'large plan generation handled': (r) => r.status !== 0,
      'large plan response time < 10s': (r) => r.timings.duration < 10000,
    });

    // Estimate memory usage (simple heuristic)
    const estimatedMemory = (skillPayload.length + largePlanPayload.length) / 1024; // KB
    memoryUsage.add(estimatedMemory);
  }

  // Rapid health checks during stress
  if (iteration % 5 === 0) {
    let healthResponse = http.get(`${BASE_URL}/health`, {
      tags: { endpoint: 'health', test_type: 'stress_monitor' },
    });

    check(healthResponse, {
      'service responsive under stress': (r) => r.status === 200 || r.status === 503,
    });
  }

  // Minimal sleep to allow system recovery
  sleep(Math.random() * 0.5);
}

export function teardown(data) {
  const totalDuration = Date.now() - data.startTime;
  const totalRequests = data.successfulRequests + data.failedRequests;
  const successRate = totalRequests > 0 ? (data.successfulRequests / totalRequests) * 100 : 0;

  console.log('=== STRESS TEST RESULTS ===');
  console.log(`Total test duration: ${totalDuration}ms`);
  console.log(`Successful requests: ${data.successfulRequests}`);
  console.log(`Failed requests: ${data.failedRequests}`);
  console.log(`Success rate: ${successRate.toFixed(2)}%`);
  console.log(`Average response time: ${responseTime.mean.toFixed(2)}ms`);
  console.log(`Estimated memory usage: ${memoryUsage.mean.toFixed(2)}KB`);

  // Final system health check
  let response = http.get(`${BASE_URL}/health`);
  if (response.status === 200) {
    console.log('✅ System recovered successfully after stress test');
  } else {
    console.log('❌ System may need manual recovery after stress test');
  }
}