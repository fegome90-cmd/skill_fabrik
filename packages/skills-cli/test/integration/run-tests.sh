#!/bin/bash
# CLI Integration Tests Runner

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"

echo "🧪 Running CLI Integration Tests..."

# Ensure dependencies are installed
echo "📦 Installing dependencies..."
cd "$PROJECT_ROOT"
pnpm install

# Build CLI
echo "🔨 Building CLI..."
pnpm --filter @skills-fabrik/skills-cli build

# Run tests based on arguments
TEST_TYPE=${1:-"all"}

case "$TEST_TYPE" in
  "skills")
    echo "🎯 Running Skills Command Tests..."
    cd "$SCRIPT_DIR"
    npx jest commands/skills.test.ts --config=jest.config.js
    ;;

  "plan")
    echo "📋 Running Plan Command Tests..."
    cd "$SCRIPT_DIR"
    npx jest commands/plan.test.ts --config=jest.config.js
    ;;

  "kpi")
    echo "📊 Running KPI Command Tests..."
    cd "$SCRIPT_DIR"
    npx jest commands/kpi.test.ts --config=jest.config.js
    ;;

  "visual")
    echo "👁️  Running Visual Regression Tests..."
    cd "$SCRIPT_DIR"
    npx jest visual/ --config=jest.config.js
    ;;

  "workflows")
    echo "🔄 Running Workflow Tests..."
    cd "$SCRIPT_DIR"
    npx jest workflows/ --config=jest.config.js
    ;;

  "all"|*)
    echo "🚀 Running All Integration Tests..."
    cd "$SCRIPT_DIR"
    npx jest --config=jest.config.js --coverage
    ;;
esac

echo "✅ Integration tests completed!"

# Generate test report if coverage was collected
if [[ "$TEST_TYPE" == "all" ]] && [[ -d "$SCRIPT_DIR/coverage" ]]; then
  echo "📈 Test coverage report generated in: $SCRIPT_DIR/coverage"
  echo "📄 Open $SCRIPT_DIR/coverage/lcov-report/index.html to view detailed report"
fi