#!/bin/bash

# Simple test script for Prompt Builder v2 Integration

set -e

echo "=========================================="
echo "  Prompt Builder v2 - Quick Test"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check Node.js
echo "📋 Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "Please install Node.js 18+ and try again"
    exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//')
echo -e "${GREEN}✓${NC} Node.js $NODE_VERSION detected"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ package.json not found${NC}"
    echo "Please run this from the mcp-prompt-builder directory"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
fi

echo ""
echo "🚀 Running Prompt Builder v2 test..."
echo ""

# Create a simple test script
cat > simple-test.js << 'EOF'
const { buildOptimizedPromptV2 } = require('@skills-fabrik/skills-cli');

async function test() {
  try {
    console.log('📡 Calling Prompt Builder v2...\n');

    const result = await buildOptimizedPromptV2({
      description: 'Create a complete JWT authentication system with user registration, login, JWT access tokens, refresh token rotation, password hashing with bcrypt, PostgreSQL database integration, authentication middleware, and rate limiting',
      skillIds: [
        'backend-architecture-patterns',
        'security-patterns',
        'database-verification'
      ],
      complexity: 'very-high',
      includeFiles: true,
      includeTags: true,
      includeTemplate: true,
    });

    console.log('✅ SUCCESS! Prompt Builder v2 Response:\n');
    console.log('='.repeat(70));
    console.log('📋 OPTIMIZED PROMPT');
    console.log('='.repeat(70));
    console.log(result.prompt);
    console.log('\n' + '='.repeat(70));
    console.log('📊 METRICS');
    console.log('='.repeat(70));
    console.log(`Expected Score: ${result.expectedScore.toFixed(2)}/1.0`);
    console.log('\n🎯 Activated Skills:');
    result.skillActivation.forEach(skill => {
      console.log(`  • ${skill.skillId}: ${(skill.score * 100).toFixed(0)}%`);
    });
    console.log('\n🏷️  TAGs:');
    if (result.signals.tags) {
      result.signals.tags.forEach(tag => console.log(`  • ${tag}`));
    }
    console.log('\n' + '='.repeat(70));
    console.log('✅ TEST COMPLETED!');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

test();
EOF

# Run the test
node simple-test.js

echo ""
echo -e "${GREEN}🎉 Test completed successfully!${NC}"
echo ""
echo "Next steps:"
echo "  • Read AGENT-SDK-GUIDE.md for production use"
echo "  • Check HOW-TO-RUN-TEST.md for detailed examples"
echo "  • See agent-sdk-example.ts for full implementation"
echo ""

# Cleanup
rm -f simple-test.js
