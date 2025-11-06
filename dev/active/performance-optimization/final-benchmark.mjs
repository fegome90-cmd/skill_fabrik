#!/usr/bin/env node

import { activatePBv2 } from '/Users/felipe/Developer/skills-fabrik/scripts/hooks/pbv2-activator.mjs';

const testCases = [
  'Create a React component',
  'Implement database migration',
  'Set up CI/CD pipeline',
  'Add security testing'
];

async function benchmark() {
  console.log('Running performance benchmark (optimized)...\n');

  const results = [];
  for (const testCase of testCases) {
    const start = Date.now();
    try {
      const result = await activatePBv2(testCase, '/Users/felipe/Developer/skills-fabrik');
      const latency = Date.now() - start;
      results.push({ testCase: testCase, latency: latency, success: result.success });
      console.log(testCase + ': ' + latency + 'ms ✅');
    } catch (error) {
      const latency = Date.now() - start;
      results.push({ testCase: testCase, latency: latency, success: false });
      console.log(testCase + ': ' + latency + 'ms ❌');
    }
  }

  const avgLatency = results.reduce((a, b) => a + b.latency, 0) / results.length;
  const successRate = (results.filter(r => r.success).length / results.length) * 100;

  console.log('\n=== BENCHMARK RESULTS ===');
  console.log('Average Latency: ' + avgLatency.toFixed(0) + 'ms');
  console.log('Success Rate: ' + successRate.toFixed(1) + '%');

  console.log('\n=== BEFORE vs AFTER ===');
  console.log('Before: 411ms average');
  console.log('After:  ' + avgLatency.toFixed(0) + 'ms average');
  const improvement = ((411 - avgLatency) / 411 * 100);
  console.log('Improvement: ' + improvement.toFixed(1) + '%');

  return { avgLatency, successRate, results };
}

benchmark().catch(console.error);