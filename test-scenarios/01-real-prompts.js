import { buildOptimizedPromptV2 } from '@skills-fabrik/skills-cli';
import { writeFileSync } from 'fs';

const testCases = [
  {
    name: "Backend API Development",
    description: "Create a REST API with authentication, JWT tokens, and PostgreSQL integration",
    complexity: "high"
  },
  {
    name: "Database Migration",
    description: "Generate migration scripts for user table with relations",
    complexity: "medium"
  },
  {
    name: "Frontend Component",
    description: "Build React component with state management and hooks",
    complexity: "medium"
  }
];

const results = {
  timestamp: new Date().toISOString(),
  tests: []
};

for (const testCase of testCases) {
  console.log(`\nRunning test: ${testCase.name}`);
  const result = await buildOptimizedPromptV2({
    description: testCase.description,
    complexity: testCase.complexity,
    cwd: process.cwd()
  });
  
  results.tests.push({
    name: testCase.name,
    description: testCase.description,
    activatedSkills: result.skillActivation?.length || 0,
    expectedScore: result.expectedScore,
    hasPrompt: !!result.prompt
  });
}

writeFileSync('test-logs/agent-behavior/real-prompts-results.json', 
  JSON.stringify(results, null, 2));

console.log('\n✅ Real prompts test complete');
console.log('Results written to test-logs/agent-behavior/real-prompts-results.json');
