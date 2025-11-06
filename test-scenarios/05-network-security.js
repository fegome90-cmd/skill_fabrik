import { buildOptimizedPromptV2 } from '@skills-fabrik/skills-cli';
import { writeFileSync } from 'fs';

const results = {
  timestamp: new Date().toISOString(),
  description: "Test network access control",
  networkChecks: []
};

try {
  // Test with prompt that might trigger network requests
  const result = await buildOptimizedPromptV2({
    description: "Connect to external API to fetch user data",
    complexity: 'high'
  });
  
  results.status = 'success';
  results.promptGenerated = !!result.prompt;
  results.skillActivation = result.skillActivation?.length || 0;
} catch (error) {
  results.status = 'error';
  results.error = error.message;
}

writeFileSync('test-logs/network/security-test-results.json',
  JSON.stringify(results, null, 2));

console.log('\n✅ Network security test complete');
