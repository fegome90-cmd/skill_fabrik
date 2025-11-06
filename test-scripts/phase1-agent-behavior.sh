#!/bin/bash
# Phase 1: Real Agent Behavior Analysis

set -e

echo "🔍 Phase 1: Testing agent behavior..."
echo ""

# Create test scenarios directory if it doesn't exist
mkdir -p test-scenarios

# Test Scenario 1A: Real Prompts
cat > test-scenarios/01-real-prompts.js << 'SCENARIO'
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
SCENARIO

# Test Scenario 1B: Tool Abuse Detection
cat > test-scenarios/02-tool-abuse-detection.js << 'SCENARIO'
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
SCENARIO

echo "Running Test Scenario 1A: Real Prompts..."
echo "Timestamp: $(date -Iseconds)" > test-logs/agent-behavior.log

# Check if strace is available
if ! command -v strace &> /dev/null; then
  echo "⚠️  strace not available - installing..."
  brew install strace 2>/dev/null || echo "Could not install strace - skipping syscall tracing"
fi

# Run the test with monitoring
echo "Executing prompt optimization with syscall tracing..."
if command -v strace &> /dev/null; then
  strace -f -e trace=file,process,network \
    -o test-logs/agent-actions/strace-real-prompts.log \
    node test-scenarios/01-real-prompts.js 2>&1 | tee -a test-logs/agent-behavior.log || true
else
  node test-scenarios/01-real-prompts.js 2>&1 | tee -a test-logs/agent-behavior.log || true
fi

echo ""
echo "Running Test Scenario 1B: Tool Abuse Detection..."
node test-scenarios/02-tool-abuse-detection.js 2>&1 | tee -a test-logs/agent-behavior.log || true

# Analyze results
echo ""
echo "=== Agent Behavior Analysis ==="

if [ -f "test-logs/agent-actions/strace-real-prompts.log" ]; then
  echo "System calls during prompt optimization:"
  echo "  open/openat calls: $(grep -cE "open\(|openat\(" test-logs/agent-actions/strace-real-prompts.log || echo 0)"
  echo "  clone/fork calls: $(grep -cE "clone\(|fork\(" test-logs/agent-actions/strace-real-prompts.log || echo 0)"
  echo "  socket calls: $(grep -cE "socket\(" test-logs/agent-actions/strace-real-prompts.log || echo 0)"
fi

if [ -f "test-logs/agent-behavior/real-prompts-results.json" ]; then
  echo ""
  echo "Prompt optimization results:"
  cat test-logs/agent-behavior/real-prompts-results.json
fi

echo ""
echo "✅ Phase 1 complete - results in test-logs/agent-behavior/"
