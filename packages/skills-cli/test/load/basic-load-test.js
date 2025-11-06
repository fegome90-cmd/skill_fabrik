/**
 * Basic Load Testing with k6
 * Tests CLI performance under normal load conditions
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
export let errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up to 10 users
    { duration: '5m', target: 10 }, // Stay at 10 users
    { duration: '2m', target: 50 }, // Ramp up to 50 users
    { duration: '5m', target: 50 }, // Stay at 50 users
    { duration: '2m', target: 0 },  // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.1'],    // Error rate under 10%
    errors: ['rate<0.1'],
  },
};

// Base URL for CLI API (assuming daemon service)
const BASE_URL = 'http://127.0.0.1:7727';

export function setup() {
  console.log('Starting basic load test...');

  // Check if CLI service is available
  let response = http.get(`${BASE_URL}/health`);
  check(response, {
    'CLI service is healthy': (r) => r.status === 200,
  }) || errorRate.add(1);

  return { startTime: Date.now() };
}

export default function(data) {
  // Test 1: CLI Health Check
  let healthResponse = http.get(`${BASE_URL}/health`, {
    tags: { endpoint: 'health', test_type: 'basic_load' },
  });

  let healthOk = check(healthResponse, {
    'health status is 200': (r) => r.status === 200,
    'health response time < 100ms': (r) => r.timings.duration < 100,
  });

  errorRate.add(!healthOk);

  // Test 2: Skills Activation
  let skillsPayload = JSON.stringify({
    content: "implement user authentication with JWT tokens",
    context: {
      user_id: `user_${__VU}`,
      session_id: `session_${__ITER}`,
    },
  });

  let skillsResponse = http.post(`${BASE_URL}/activate`, skillsPayload, {
    headers: { 'Content-Type': 'application/json' },
    tags: { endpoint: 'activate', test_type: 'basic_load' },
  });

  let skillsOk = check(skillsResponse, {
    'skills activation status is 200': (r) => r.status === 200,
    'skills activation time < 500ms': (r) => r.timings.duration < 500,
    'skills response contains data': (r) => r.json('data') !== undefined,
  });

  errorRate.add(!skillsOk);

  // Test 3: Plan Generation
  let planPayload = JSON.stringify({
    description: "Create a comprehensive testing strategy",
    context: {
      complexity: 'medium',
      timeline: '2 weeks',
      team_size: 3,
    },
  });

  let planResponse = http.post(`${BASE_URL}/execute`, planPayload, {
    headers: { 'Content-Type': 'application/json' },
    tags: { endpoint: 'execute', test_type: 'basic_load' },
  });

  let planOk = check(planResponse, {
    'plan generation status is 200': (r) => r.status === 200,
    'plan generation time < 1000ms': (r) => r.timings.duration < 1000,
    'plan response contains result': (r) => r.json('result') !== undefined,
  });

  errorRate.add(!planOk);

  // Test 4: KPI Metrics (if available)
  let kpiResponse = http.get(`${BASE_URL}/metrics`, {
    tags: { endpoint: 'metrics', test_type: 'basic_load' },
  });

  let kpiOk = check(kpiResponse, {
    'kpi metrics status is 200': (r) => r.status === 200 || r.status === 404, // 404 is ok if not implemented
    'kpi response time < 200ms': (r) => r.timings.duration < 200,
  });

  errorRate.add(!kpiOk);

  // Brief pause between iterations
  sleep(0.1);
}

export function teardown(data) {
  console.log('Load test completed');
  console.log(`Total test duration: ${Date.now() - data.startTime}ms`);

  // Final health check
  let response = http.get(`${BASE_URL}/health`);
  check(response, {
    'CLI service is still healthy': (r) => r.status === 200,
  });
}