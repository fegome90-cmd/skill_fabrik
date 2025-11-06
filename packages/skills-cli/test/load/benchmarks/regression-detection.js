/**
 * Performance Regression Detection
 * Compares current performance against baselines and detects regressions
 */

import http from 'k6/http';
import { check } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Load baseline data
const baselineData = JSON.parse(open('./benchmarks/performance-baselines.json'));

// Custom metrics for regression detection
export let regressionRate = new Rate('performance_regressions');
export let performanceScore = new Trend('performance_score');

// Regression test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 },
    { duration: '5m', target: 25 },
    { duration: '5m', target: 50 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    'performance_regressions': ['rate<0.05'], // Allow max 5% regressions
  },
};

const BASE_URL = 'http://127.0.0.1:7727';

// Test scenarios matching baseline
const TEST_SCENARIOS = [
  {
    name: 'health_check',
    endpoint: '/health',
    method: 'GET',
    payload: null,
    baseline: baselineData.baseline_measurements.health_check,
  },
  {
    name: 'skill_activation_simple',
    endpoint: '/activate',
    method: 'POST',
    payload: {
      content: "implement basic user login",
      context: { complexity: 'simple', user_id: 'regression_test' },
    },
    baseline: baselineData.baseline_measurements.skill_activation.simple,
  },
  {
    name: 'skill_activation_complex',
    endpoint: '/activate',
    method: 'POST',
    payload: {
      content: "implement comprehensive microservices architecture with service mesh, distributed tracing, circuit breakers, API gateway, real-time monitoring, automated deployment pipelines, disaster recovery procedures, and comprehensive security measures including OAuth 2.0, JWT tokens, multi-factor authentication, and extensive audit logging",
      context: {
        complexity: 'complex',
        components: 20,
        dependencies: 50,
        security_level: 'enterprise',
        user_id: 'regression_test'
      },
    },
    baseline: baselineData.baseline_measurements.skill_activation.complex,
  },
  {
    name: 'plan_generation_simple',
    endpoint: '/execute',
    method: 'POST',
    payload: {
      description: "Create basic testing strategy",
      context: { complexity: 'simple', timeline: '1 week' },
    },
    baseline: baselineData.baseline_measurements.plan_generation.simple,
  },
  {
    name: 'plan_generation_complex',
    endpoint: '/execute',
    method: 'POST',
    payload: {
      description: "Design comprehensive enterprise architecture solution",
      context: {
        complexity: 'complex',
        timeline: '6 months',
        team_size: 15,
        budget: 'enterprise',
        stakeholders: 25,
        risk_factors: 30,
        deliverables: 100,
      },
    },
    baseline: baselineData.baseline_measurements.plan_generation.complex,
  },
];

// Store test results for comparison
let testResults = [];

export function setup() {
  console.log('Starting performance regression detection...');
  console.log('Comparing against established baselines...');

  // Validate service availability
  let response = http.get(`${BASE_URL}/health`);
  if (response.status !== 200) {
    throw new Error('CLI service not available for regression testing');
  }

  return {
    startTime: Date.now(),
    regressions: [],
    improvements: [],
    baselineData,
  };
}

function checkRegression(scenario, actualMetrics, baseline) {
  const regressionThresholds = baselineData.performance_regression_thresholds;
  let regressions = [];
  let improvements = [];

  // Check response time regressions
  const responseTimeRegression = regressionThresholds.response_time_regression;
  if (actualMetrics.p95 > baseline.p95 * (1 + responseTimeRegression / 100)) {
    regressions.push({
      type: 'response_time_p95',
      current: actualMetrics.p95,
      baseline: baseline.p95,
      increase: ((actualMetrics.p95 - baseline.p95) / baseline.p95 * 100).toFixed(2),
    });
  } else if (actualMetrics.p95 < baseline.p95 * (1 - responseTimeRegression / 100)) {
    improvements.push({
      type: 'response_time_p95',
      current: actualMetrics.p95,
      baseline: baseline.p95,
      improvement: ((baseline.p95 - actualMetrics.p95) / baseline.p95 * 100).toFixed(2),
    });
  }

  // Check max response time
  if (actualMetrics.max > baseline.max * (1 + responseTimeRegression / 100)) {
    regressions.push({
      type: 'response_time_max',
      current: actualMetrics.max,
      baseline: baseline.max,
      increase: ((actualMetrics.max - baseline.max) / baseline.max * 100).toFixed(2),
    });
  }

  // Check throughput regression
  const throughputRegression = regressionThresholds.throughput_regression;
  if (baseline.throughput && actualMetrics.throughput < baseline.throughput * (1 - throughputRegression / 100)) {
    regressions.push({
      type: 'throughput',
      current: actualMetrics.throughput,
      baseline: baseline.throughput,
      decrease: ((baseline.throughput - actualMetrics.throughput) / baseline.throughput * 100).toFixed(2),
    });
  } else if (baseline.throughput && actualMetrics.throughput > baseline.throughput * (1 + throughputRegression / 100)) {
    improvements.push({
      type: 'throughput',
      current: actualMetrics.throughput,
      baseline: baseline.throughput,
      improvement: ((actualMetrics.throughput - baseline.throughput) / baseline.throughput * 100).toFixed(2),
    });
  }

  // Calculate performance score (0-100)
  let score = 100;

  // Response time impact (40% weight)
  const rtScore = Math.max(0, 100 - ((actualMetrics.p95 - baseline.p95) / baseline.p95 * 100));
  score = score * 0.4 + rtScore * 0.4;

  // Throughput impact (30% weight)
  if (baseline.throughput) {
    const tpScore = Math.min(100, (actualMetrics.throughput / baseline.throughput) * 100);
    score = score * 0.7 + tpScore * 0.3;
  }

  // Error rate impact (30% weight)
  if (actualMetrics.errorRate !== undefined) {
    const errorScore = Math.max(0, 100 - actualMetrics.errorRate * 1000); // Penalize errors heavily
    score = score * 0.7 + errorScore * 0.3;
  }

  return {
    scenario: scenario.name,
    regressions,
    improvements,
    score: Math.round(score),
    passed: regressions.length === 0,
  };
}

export default function(data) {
  const vuId = __VU;
  const iteration = __ITER;

  // Test each scenario
  TEST_SCENARIOS.forEach((scenario, index) => {
    const scenarioIndex = `${vuId}-${iteration}-${index}`;

    let response;
    const startTime = Date.now();

    if (scenario.method === 'GET') {
      response = http.get(`${BASE_URL}${scenario.endpoint}`, {
        tags: {
          scenario: scenario.name,
          test_type: 'regression',
        },
      });
    } else {
      response = http.post(`${BASE_URL}${scenario.endpoint}`, JSON.stringify(scenario.payload), {
        headers: { 'Content-Type': 'application/json' },
        tags: {
          scenario: scenario.name,
          test_type: 'regression',
        },
      });
    }

    const requestDuration = Date.now() - startTime;

    // Calculate metrics for this request
    const metrics = {
      p50: response.timings.duration, // Single request, so all percentiles are the same
      p95: response.timings.duration,
      p99: response.timings.duration,
      max: response.timings.duration,
      throughput: 1000 / response.timings.duration, // Requests per second
      errorRate: response.status === 200 ? 0 : 1,
    };

    // Check against baseline
    const regressionResult = checkRegression(scenario, metrics, scenario.baseline);

    // Update custom metrics
    performanceScore.add(regressionResult.score);
    regressionRate.add(!regressionResult.passed);

    // Store result for final analysis
    testResults.push({
      timestamp: Date.now(),
      vuId,
      iteration,
      scenario: scenario.name,
      ...regressionResult,
      actualMetrics: metrics,
    });

    // Log regressions in real-time
    if (regressionResult.regressions.length > 0) {
      console.log(`🚨 REGRESSION DETECTED - ${scenario.name}:`);
      regressionResult.regressions.forEach(reg => {
        console.log(`   ${reg.type}: ${reg.current}ms vs baseline ${reg.baseline}ms (${reg.increase}% increase)`);
      });
    }

    // Log improvements
    if (regressionResult.improvements.length > 0) {
      console.log(`✅ IMPROVEMENT - ${scenario.name}:`);
      regressionResult.improvements.forEach(imp => {
        console.log(`   ${imp.type}: ${imp.current}ms vs baseline ${imp.baseline}ms (${imp.improvement}% improvement)`);
      });
    }

    // Check basic request success
    check(response, {
      [`${scenario.name} request successful`]: (r) => r.status === 200,
      [`${scenario.name} response reasonable`]: (r) => r.timings.duration < scenario.baseline.max * 2,
    });

    // Brief pause between scenarios
    sleep(0.1);
  });
}

export function teardown(data) {
  const totalDuration = Date.now() - data.startTime;

  console.log('=== PERFORMANCE REGRESSION ANALYSIS ===');
  console.log(`Test duration: ${(totalDuration / 1000 / 60).toFixed(2)} minutes`);
  console.log(`Total test executions: ${testResults.length}`);

  // Aggregate results by scenario
  const scenarioResults = {};
  testResults.forEach(result => {
    if (!scenarioResults[result.scenario]) {
      scenarioResults[result.scenario] = {
        scores: [],
        regressions: [],
        improvements: [],
        totalTests: 0,
        passedTests: 0,
      };
    }

    const scenario = scenarioResults[result.scenario];
    scenario.scores.push(result.score);
    scenario.totalTests++;
    if (result.passed) {
      scenario.passedTests++;
    }
    scenario.regressions.push(...result.regressions);
    scenario.improvements.push(...result.improvements);
  });

  console.log('\n--- Results by Scenario ---');
  let overallRegressions = 0;
  let overallImprovements = 0;

  Object.entries(scenarioResults).forEach(([scenarioName, results]) => {
    const avgScore = results.scores.reduce((sum, score) => sum + score, 0) / results.scores.length;
    const passRate = (results.passedTests / results.totalTests * 100).toFixed(2);

    console.log(`\n${scenarioName}:`);
    console.log(`  Average Score: ${avgScore.toFixed(1)}/100`);
    console.log(`  Pass Rate: ${passRate}%`);
    console.log(`  Regressions: ${results.regressions.length}`);
    console.log(`  Improvements: ${results.improvements.length}`);

    overallRegressions += results.regressions.length;
    overallImprovements += results.improvements.length;
  });

  console.log('\n--- Overall Summary ---');
  console.log(`Total Regressions: ${overallRegressions}`);
  console.log(`Total Improvements: ${overallImprovements}`);
  console.log(`Overall Performance Score: ${(performanceScore.mean).toFixed(1)}/100`);
  console.log(`Regression Rate: ${(regressionRate.rate * 100).toFixed(2)}%`);

  // Determine final result
  const maxAllowedRegressions = Math.floor(testResults.length * 0.05); // 5% threshold
  const passed = overallRegressions <= maxAllowedRegressions;

  if (passed) {
    console.log('\n✅ PERFORMANCE REGRESSION TEST PASSED');
    console.log('Performance is within acceptable limits');
  } else {
    console.log('\n❌ PERFORMANCE REGRESSION TEST FAILED');
    console.log(`Too many regressions detected: ${overallRegressions} > ${maxAllowedRegressions}`);
  }

  // Store results for historical tracking
  const reportData = {
    timestamp: new Date().toISOString(),
    duration: totalDuration,
    scenarios: scenarioResults,
    summary: {
      totalTests: testResults.length,
      overallRegressions,
      overallImprovements,
      averageScore: performanceScore.mean,
      regressionRate: regressionRate.rate,
      passed,
    },
    baseline: baselineData.test_metadata,
  };

  // Write report to file (would normally be saved)
  console.log(`\nReport data generated (${JSON.stringify(reportData).length} characters)`);
}