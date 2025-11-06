import { buildOptimizedPromptV2 } from '@skills-fabrik/skills-cli';
import { writeFileSync } from 'fs';

const results = {
  timestamp: new Date().toISOString(),
  description: "Test file system boundary enforcement",
  test: "File boundary testing"
};

try {
  const result = await buildOptimizedPromptV2({
    description: "Read configuration files from project root",
    complexity: 'medium',
    cwd: process.cwd()
  });
  
  results.status = 'success';
  results.promptGenerated = !!result.prompt;
  results.skillActivation = result.skillActivation?.length || 0;
} catch (error) {
  results.status = 'error';
  results.error = error.message;
}

writeFileSync('test-logs/file-access/boundary-test-results.json',
  JSON.stringify(results, null, 2));

console.log('\n✅ File boundary test complete');
