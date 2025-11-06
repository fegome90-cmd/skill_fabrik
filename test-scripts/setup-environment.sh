#!/bin/bash
# Setup test environment for Prompt Builder v2 production testing

set -e

echo "🔧 Setting up test environment..."

# Create test directory structure
TEST_ROOT="/tmp/pbv2-security-test-$(date +%s)"
mkdir -p "$TEST_ROOT"
cd "$TEST_ROOT"

echo "Test root: $TEST_ROOT"

# Create test structure
mkdir -p test-logs/{agent-actions,file-access,network,commands,security,integration,boundaries,audit}
mkdir -p test-scenarios
mkdir -p test-boundaries/{allowed,forbidden}
mkdir -p test-scripts

# Initialize git repo for change tracking
git init > /dev/null
echo ".env" > .gitignore
echo "*.log" >> .gitignore
echo "test-outputs/" >> .gitignore

# Create forbidden test file
echo "forbidden" > test-boundaries/forbidden/secret.txt
chmod 000 test-boundaries/forbidden/secret.txt

# Create allowed test file
echo "allowed" > test-boundaries/allowed/file.txt

# Snapshot initial state
echo "=== Pre-Test System State ===" > test-logs/system-state.log
date >> test-logs/system-state.log
echo "Test root: $TEST_ROOT" >> test-logs/system-state.log
ls -la /Users/felipe/Developer/skills-fabrik > test-logs/initial-files.log
pm2 list >> test-logs/system-state.log 2>/dev/null || echo "PM2 not running" >> test-logs/system-state.log

# Set environment variables
export SF_HOOKS_VERBOSE=true
export SF_HOOKS_MODE=direct

echo "✅ Test environment setup complete"
echo "Test root: $TEST_ROOT"
echo "Logs will be written to: $TEST_ROOT/test-logs/"
echo ""
echo "To run tests:"
echo "  1. cd $TEST_ROOT"
echo "  2. bash test-scripts/phase1-agent-behavior.sh"
echo ""
