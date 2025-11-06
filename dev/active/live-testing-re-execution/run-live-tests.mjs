#!/usr/bin/env node

/**
 * Live Testing Re-Execution - CLOOP Phase 3
 * Tests all 10 plans with skillId activation and captures comprehensive metrics
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';

const WORKSPACE = '/Users/felipe/Developer/skills-fabrik';
const TEST_PLANS_DIR = resolve(WORKSPACE, 'dev/active/test-plans-skillids');

// Import activatePBv2
async function importActivator() {
  const { activatePBv2 } = await import(resolve(WORKSPACE, 'scripts/hooks/pbv2-activator.mjs'));
  return { activatePBv2 };
}

const testResults = {
  summary: {
    totalTests: 0,
    successfulTests: 0,
    failedTests: 0,
    totalLatency: 0,
    averageLatency: 0,
    minLatency: Infinity,
    maxLatency: 0
  },
  categories: {
    backend: { tests: 0, successes: 0, avgLatency: 0 },
    frontend: { tests: 0, successes: 0, avgLatency: 0 },
    database: { tests: 0, successes: 0, avgLatency: 0 },
    security: { tests: 0, successes: 0, avgLatency: 0 },
    performance: { tests: 0, successes: 0, avgLatency: 0 },
    testing: { tests: 0, successes: 0, avgLatency: 0 },
    devops: { tests: 0, successes: 0, avgLatency: 0 }
  },
  skillIds: {},
  quality: {
    scores: [],
    coherencia: 0,
    completitud: 0,
    claridad: 0,
    overall: 0
  },
  individualResults: [],
  timestamp: new Date().toISOString()
};

async function runSingleTest(plan, activator) {
  const startTime = Date.now();
  let result = null;
  let error = null;

  try {
    console.log(`\n🧪 Testing: ${plan.id} - ${plan.name}`);
    console.log(`   SkillId: ${plan.skillId}`);
    console.log(`   Complexity: ${plan.complexity}`);

    result = await activator.activatePBv2(plan.description, WORKSPACE, {
      skillIds: [plan.skillId]
    });

    const latency = Date.now() - startTime;

    if (result.success) {
      console.log(`   ✅ Success in ${latency}ms`);
      console.log(`   Score: ${result.expectedScore || 'N/A'}`);
      console.log(`   Activations: ${result.skillActivation?.length || 0}`);
    } else {
      console.log(`   ❌ Failed: ${result.error || 'Unknown error'}`);
    }

    return {
      plan,
      success: result.success,
      latency,
      error: result.error || null,
      score: result.expectedScore || 0,
      skillActivation: result.skillActivation || [],
      pbv2Result: result,
      timestamp: new Date().toISOString()
    };

  } catch (err) {
    const latency = Date.now() - startTime;
    error = err.message;
    console.log(`   ❌ Error: ${error}`);

    return {
      plan,
      success: false,
      latency,
      error,
      score: 0,
      skillActivation: [],
      pbv2Result: null,
      timestamp: new Date().toISOString()
    };
  }
}

async function runAllTests() {
  console.log('🚀 [Live Testing Re-Execution] Starting comprehensive test suite...\n');

  // Load test plans
  const masterPlanPath = resolve(TEST_PLANS_DIR, 'master-test-plan.json');
  if (!existsSync(masterPlanPath)) {
    throw new Error('Master test plan not found. Run create-test-plans.mjs first.');
  }

  const masterPlan = JSON.parse(readFileSync(masterPlanPath, 'utf8'));
  const plans = masterPlan.plans;

  console.log(`📋 Loaded ${plans.length} test plans\n`);

  // Import activator
  const { activatePBv2 } = await importActivator();

  // Run tests sequentially with detailed logging
  const results = [];
  for (let i = 0; i < plans.length; i++) {
    const plan = plans[i];
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Test ${i + 1}/${plans.length}`);
    console.log('='.repeat(60));

    const result = await runSingleTest(plan, { activatePBv2 });
    results.push(result);

    // Update summary stats
    testResults.summary.totalTests++;
    testResults.summary.totalLatency += result.latency;
    testResults.summary.minLatency = Math.min(testResults.summary.minLatency, result.latency);
    testResults.summary.maxLatency = Math.max(testResults.summary.maxLatency, result.latency);

    if (result.success) {
      testResults.summary.successfulTests++;
    } else {
      testResults.summary.failedTests++;
    }

    // Update category stats
    const category = plan.metadata?.category || 'general';
    if (testResults.categories[category]) {
      testResults.categories[category].tests++;
      if (result.success) {
        testResults.categories[category].successes++;
      }
      // Track latencies for category
      if (!testResults.categories[category].latencies) {
        testResults.categories[category].latencies = [];
      }
      testResults.categories[category].latencies.push(result.latency);
    }

    // Update skillId stats
    const skillId = plan.skillId;
    if (!testResults.skillIds[skillId]) {
      testResults.skillIds[skillId] = { tests: 0, successes: 0, latencies: [] };
    }
    testResults.skillIds[skillId].tests++;
    if (result.success) {
      testResults.skillIds[skillId].successes++;
    }
    testResults.skillIds[skillId].latencies.push(result.latency);

    // Update quality scores
    testResults.quality.scores.push(result.score);
  }

  // Calculate final metrics
  testResults.summary.averageLatency = testResults.summary.totalLatency / testResults.summary.totalTests;
  testResults.quality.coherencia = calculateCoherencia(results);
  testResults.quality.completitud = calculateCompletitud(results);
  testResults.quality.claridad = calculateClaridad(results);
  testResults.quality.overall = (testResults.quality.coherencia + testResults.quality.completitud + testResults.quality.claridad) / 3;

  // Calculate category averages
  for (const category in testResults.categories) {
    const cat = testResults.categories[category];
    if (cat.tests > 0) {
      cat.avgLatency = cat.latencies ? cat.latencies.reduce((a, b) => a + b, 0) / cat.latencies.length : 0;
      cat.successRate = (cat.successes / cat.tests) * 100;
    }
  }

  // Calculate skillId averages
  for (const skillId in testResults.skillIds) {
    const sid = testResults.skillIds[skillId];
    sid.successRate = (sid.successes / sid.tests) * 100;
    sid.avgLatency = sid.latencies.reduce((a, b) => a + b, 0) / sid.latencies.length;
    delete sid.latencies; // Remove raw latencies from output
  }

  testResults.individualResults = results;

  return testResults;
}

function calculateCoherencia(results) {
  // Coherencia based on skillId activation success
  const successfulActivations = results.filter(r => r.success && r.skillActivation.length > 0).length;
  return (successfulActivations / results.length) * 10;
}

function calculateCompletitud(results) {
  // Completitud based on plan coverage
  const completedPlans = results.filter(r => r.success).length;
  return (completedPlans / results.length) * 10;
}

function calculateClaridad(results) {
  // Claridad based on score distribution
  const scores = results.filter(r => r.success).map(r => r.score);
  if (scores.length === 0) return 0;

  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  return avgScore * 10;
}

function generateReport(testResults) {
  const outputDir = resolve(WORKSPACE, 'dev/active/live-testing-re-execution');
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const reportPath = resolve(outputDir, 'live-test-results.json');
  writeFileSync(reportPath, JSON.stringify(testResults, null, 2));

  console.log('\n\n📊 FINAL TEST RESULTS');
  console.log('='.repeat(70));
  console.log(`Total Tests: ${testResults.summary.totalTests}`);
  console.log(`Successful: ${testResults.summary.successfulTests}`);
  console.log(`Failed: ${testResults.summary.failedTests}`);
  console.log(`Success Rate: ${((testResults.summary.successfulTests / testResults.summary.totalTests) * 100).toFixed(1)}%`);
  console.log(`\nLatency:`);
  console.log(`  Average: ${testResults.summary.averageLatency.toFixed(0)}ms`);
  console.log(`  Min: ${testResults.summary.minLatency.toFixed(0)}ms`);
  console.log(`  Max: ${testResults.summary.maxLatency.toFixed(0)}ms`);
  console.log(`\nQuality Scores:`);
  console.log(`  Coherencia: ${testResults.quality.coherencia.toFixed(1)}/10`);
  console.log(`  Completitud: ${testResults.quality.completitud.toFixed(1)}/10`);
  console.log(`  Claridad: ${testResults.quality.claridad.toFixed(1)}/10`);
  console.log(`  Overall: ${testResults.quality.overall.toFixed(1)}/10`);

  console.log('\n\n📋 CATEGORY BREAKDOWN');
  console.log('='.repeat(70));
  for (const [category, stats] of Object.entries(testResults.categories)) {
    if (stats.tests > 0) {
      console.log(`${category}:`);
      console.log(`  Tests: ${stats.tests}, Successes: ${stats.successes} (${stats.successRate?.toFixed(1)}%)`);
      console.log(`  Avg Latency: ${stats.avgLatency?.toFixed(0)}ms`);
    }
  }

  console.log('\n\n🏷️ SKILL ID PERFORMANCE');
  console.log('='.repeat(70));
  for (const [skillId, stats] of Object.entries(testResults.skillIds)) {
    console.log(`${skillId}:`);
    console.log(`  Success Rate: ${stats.successRate.toFixed(1)}%`);
    console.log(`  Avg Latency: ${stats.avgLatency.toFixed(0)}ms`);
  }

  console.log(`\n\n✅ Detailed results saved to: ${reportPath}`);

  return reportPath;
}

async function main() {
  try {
    const results = await runAllTests();
    const reportPath = generateReport(results);

    console.log('\n🎯 Live Testing Complete!');
    console.log(`   Report: ${reportPath}`);

    // Validate against expected results
    const expected = {
      detectionLatency: 50,
      activationLatency: 200,
      successRate: 90,
      qualityScore: 8
    };

    console.log('\n📈 EXPECTED vs ACTUAL:');
    console.log(`  Detection: < ${expected.detectionLatency}ms vs ${results.summary.averageLatency.toFixed(0)}ms`);
    console.log(`  Activation: < ${expected.activationLatency}ms vs actual`);
    console.log(`  Success Rate: > ${expected.successRate}% vs ${((results.summary.successfulTests / results.summary.totalTests) * 100).toFixed(1)}%`);
    console.log(`  Quality Score: > ${expected.qualityScore}/10 vs ${results.quality.overall.toFixed(1)}/10`);

    const passed = {
      detection: results.summary.averageLatency < expected.detectionLatency,
      successRate: ((results.summary.successfulTests / results.summary.totalTests) * 100) > expected.successRate,
      quality: results.quality.overall > expected.qualityScore
    };

    console.log('\n✅ VALIDATION RESULTS:');
    console.log(`  Detection Latency: ${passed.detection ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Success Rate: ${passed.successRate ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Quality Score: ${passed.quality ? '✅ PASS' : '❌ FAIL'}`);

    return results;

  } catch (error) {
    console.error('❌ Live testing failed:', error.message);
    throw error;
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});