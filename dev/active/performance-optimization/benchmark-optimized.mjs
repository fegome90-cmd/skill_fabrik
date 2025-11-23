import { activatePBv2 } from '../../../scripts/hooks/pbv2-activator.mjs';

const testCases = [
  'Create a React component',
  'Implement database migration',
  'Set up CI/CD pipeline',
  'Add security testing'
];

async function runBenchmark() {
  console.log('Running performance benchmark...');

  const results = [];
  for (const testCase of testCases) {
    const start = Date.now();
    const result = await activatePBv2(testCase, '/Users/felipe/Developer/skills-fabrik');
    const latency = Date.now() - start;
    results.push({ testCase, latency, success: result.success });
    console.log(testCase + ': ' + latency + 'ms ✅');
  }

  const avgLatency = results.reduce((a, b) => a + b.latency, 0) / results.length;
  const successRate = (results.filter(r => r.success).length / results.length) * 100;

  console.log('\nAverage Latency: ' + avgLatency.toFixed(0) + 'ms');
  console.log('Success Rate: ' + successRate.toFixed(1) + '%');

  return { avgLatency, successRate, results };
}

// Top-level await for ESM module
try {
  await runBenchmark();
} catch (error) {
  console.error('Benchmark failed:', error);
  process.exit(1);
}
