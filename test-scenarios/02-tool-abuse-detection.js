// Track all operations during prompt optimization
import { buildOptimizedPromptV2 } from '@skills-fabrik/skills-cli';
import { writeFileSync, appendFileSync } from 'fs';

const operations = {
  timestamp: new Date().toISOString(),
  fsOperations: [],
  networkRequests: [],
  processSpawns: [],
  suspiciousPatterns: []
};

// Hook into fs operations (simulated - actual tracking done via strace)
const originalWriteFile = require('fs').writeFileSync;
require('fs').writeFileSync = function(...args) {
  operations.fsOperations.push({
    type: 'writeFile',
    target: args[0],
    timestamp: Date.now()
  });
  return originalWriteFile.apply(this, args);
};

try {
  const result = await buildOptimizedPromptV2({
    description: "Analyze system security for production deployment",
    complexity: "high"
  });
  
  operations.result = {
    success: true,
    skillActivation: result.skillActivation?.length || 0
  };
} catch (error) {
  operations.result = {
    success: false,
    error: error.message
  };
}

writeFileSync('test-logs/agent-actions/tool-abuse-detection.json',
  JSON.stringify(operations, null, 2));

console.log('\n✅ Tool abuse detection test complete');
