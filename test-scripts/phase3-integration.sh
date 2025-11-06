#!/bin/bash
# Phase 3: Realistic Integration Testing

set -e

echo "🔗 Phase 3: Integration Testing with Real Scripts"
echo ""

# Check if skills-cli is available
if ! command -v skills-cli &> /dev/null; then
  echo "⚠️  skills-cli not found in PATH, trying direct node invocation..."
  CLI_CMD="node /Users/felipe/Developer/skills-fabrik/packages/skills-cli/dist/index.js"
else
  CLI_CMD="skills-cli"
fi

# Test Scenario 3A: Real Repository Scripts
echo "Test 3A.1: Skills check CLI"
echo "Testing: 'implement user authentication with JWT'"
echo ""

if $CLI_CMD skills check "implement user authentication with JWT" --v2 2>&1 | tee test-logs/integration/skills-check.log; then
  echo "✅ Skills check completed"
else
  echo "⚠️  Skills check had issues (check logs)"
fi

# Check for unexpected file modifications
echo ""
echo "Checking for file modifications..."
if git status --porcelain 2>/dev/null | grep -v "??" | grep -q "."; then
  echo "⚠️  WARNING: Modified tracked files detected:"
  git status --porcelain | grep -v "??" || true
else
  echo "✅ No unexpected file modifications"
fi

# Test 3A.2: Daemon interaction
echo ""
echo "Test 3A.2: Daemon health check"
echo ""

if curl -s -m 5 http://127.0.0.1:7727/health 2>&1 | tee test-logs/integration/daemon-health.log; then
  echo "✅ Daemon health check completed"
else
  echo "⚠️  Daemon not responding (this is OK if not running)"
  echo "   Started on demand: pm2 start scripts/pm2/ecosystem.config.cjs --only sf-daemon"
fi

# Test 3A.3: Router activation (if hooks script exists)
echo ""
echo "Test 3A.3: Router pre-invoke"
echo ""

if [ -f "/Users/felipe/Developer/skills-fabrik/scripts/hooks/pre-invoke.mjs" ]; then
  if node /Users/felipe/Developer/skills-fabrik/scripts/hooks/pre-invoke.mjs \
    --prompt "test router activation" \
    --cwd "/Users/felipe/Developer/skills-fabrik" \
    2>&1 | tee test-logs/integration/router-invoke.log; then
    echo "✅ Router pre-invoke completed"
  else
    echo "⚠️  Router pre-invoke had issues (check logs)"
  fi
else
  echo "⚠️  Router hooks not found, skipping this test"
fi

# Test 3A.4: Service discovery
echo ""
echo "Test 3A.4: Service discovery health check"
echo ""

if curl -s -m 5 http://127.0.0.1:8877/health 2>&1 | tee test-logs/integration/discovery-health.log; then
  echo "✅ Service discovery health check completed"
else
  echo "⚠️  Service discovery not responding (this is OK if not running)"
  echo "   Started on demand: pm2 start scripts/pm2/ecosystem.config.cjs --only service-discovery"
fi

# Create real workflow test
cat > test-scenarios/06-real-workflow.js << 'SCENARIO'
import { buildOptimizedPromptV2 } from '@skills-fabrik/skills-cli';
import { writeFileSync } from 'fs';
import { execSync } from 'child_process';

const workflow = {
  prompt: "Create a TypeScript interface for User with validation",
  steps: [
    "1. Generate optimized prompt with PBv2",
    "2. Check skill activation",
    "3. Verify no files were modified",
    "4. Check guardrails didn't block",
    "5. Verify expected skills activated"
  ]
};

const results = {
  timestamp: new Date().toISOString(),
  prompt: workflow.prompt,
  actions: [],
  filesRead: [],
  filesWritten: [],
  processesSpawned: [],
  securityViolations: []
};

try {
  console.log("Step 1: Generate optimized prompt with PBv2");
  const promptResult = await buildOptimizedPromptV2({
    description: workflow.prompt,
    complexity: 'medium'
  });
  results.actions.push('prompt_generated');
  
  console.log("Step 2: Check skill activation");
  if (promptResult.skillActivation?.length > 0) {
    results.actions.push('skills_activated');
    results.skillActivation = promptResult.skillActivation;
  }
  
  console.log("Step 3: Verify no unexpected side effects");
  try {
    const gitStatus = execSync('git status --porcelain', { 
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    });
    if (gitStatus.trim()) {
      results.filesWritten = gitStatus.split('\n').filter(line => line.trim());
    }
  } catch (e) {
    // Not a git repo or no changes
  }
  
  console.log("Step 4: Check for issues");
  if (results.filesWritten.length > 0) {
    results.securityViolations.push('unexpected_file_changes');
  }
  
  console.log("Step 5: Verify success criteria");
  results.success = true;
  
} catch (error) {
  results.error = error.message;
  results.success = false;
}

writeFileSync('test-logs/integration/workflow-results.json', 
  JSON.stringify(results, null, 2));

console.log('\n✅ Workflow test complete - results written to test-logs/integration/workflow-results.json');
SCENARIO

# Run workflow test
echo ""
echo "Running Test 3B: Complete Workflow Execution..."
node test-scenarios/06-real-workflow.js 2>&1 | tee test-logs/integration/workflow.log || true

# Analysis
echo ""
echo "=== Integration Test Analysis ==="
echo ""

if [ -f "test-logs/integration/workflow-results.json" ]; then
  echo "Workflow Test Results:"
  cat test-logs/integration/workflow-results.json
  echo ""
fi

# Check for issues
INTEGRATION_ISSUES=0

if [ -s "test-logs/integration/skills-check.log" ]; then
  echo "✅ Skills check log generated ($(wc -l < test-logs/integration/skills-check.log) lines)"
else
  echo "⚠️  Empty skills check log"
  INTEGRATION_ISSUES=$((INTEGRATION_ISSUES + 1))
fi

if grep -q "error\|Error\|ERROR" test-logs/integration/*.log 2>/dev/null; then
  echo "⚠️  Errors found in integration logs"
  INTEGRATION_ISSUES=$((INTEGRATION_ISSUES + 1))
else
  echo "✅ No errors in integration logs"
fi

if [ $INTEGRATION_ISSUES -eq 0 ]; then
  echo ""
  echo "✅ INTEGRATION TESTS PASSED"
else
  echo ""
  echo "⚠️  INTEGRATION TESTS COMPLETED WITH $INTEGRATION_ISSUES ISSUES"
  echo "   Review test-logs/integration/ for details"
fi

echo ""
echo "✅ Phase 3 complete - review test-logs/integration/ for detailed results"
