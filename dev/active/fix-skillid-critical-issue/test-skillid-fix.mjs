
import { activatePBv2 } from '/Users/felipe/Developer/skills-fabrik/scripts/hooks/pbv2-activator.mjs';

const testCases = [
  'Create a React component for user dashboard',
  'Implement database migration for user table',
  'Set up CI/CD pipeline for deployment',
  'Add authentication middleware to API'
];

console.log('Testing skillId auto-detection...\n');

for (const testCase of testCases) {
  console.log(`Testing: "${testCase}"`);
  try {
    const result = await activatePBv2(testCase, '/Users/felipe/Developer/skills-fabrik');
    console.log(`  ✅ Success in ${result.latency_ms}ms`);
    console.log(`  Skills: ${result.skillActivation?.join(', ') || 'auto-detected'}`);
    console.log(`  Score: ${result.expectedScore}`);
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
  }
  console.log('');
}
