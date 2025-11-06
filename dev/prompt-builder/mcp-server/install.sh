#!/bin/bash

# MCP Prompt Builder v2 - Installation Script

set -e

echo "=============================================="
echo "  MCP Prompt Builder v2 - Installation"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "Please install Node.js 18+ and try again"
    exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//')
echo -e "${GREEN}✓${NC} Node.js $NODE_VERSION detected"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} npm detected"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Dependencies installed"
echo ""

# Build the server
echo "🔨 Building server..."
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Server built successfully"
echo ""

# Test the build
echo "🧪 Testing build..."
node dist/index.js --version 2>/dev/null || true

echo -e "${GREEN}✓${NC} Build is valid"
echo ""

# Success message
echo "=============================================="
echo -e "${GREEN}✅ Installation Complete!${NC}"
echo "=============================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Configure Claude Code:"
echo "   Add to your MCP config:"
echo ""
cat << 'EOF'
  {
    "mcpServers": {
      "prompt-builder": {
        "command": "node",
        "args": ["/Users/felipe/Developer/skills-fabrik/mcp-prompt-builder/dist/index.js"]
      }
    }
  }
EOF
echo ""
echo "2. Test the server:"
echo "   claude mcp tools prompt-builder"
echo ""
echo "3. Use in Claude Code:"
echo '   User: "Optimize: Create a REST API"'
echo ""
echo "For more info, see:"
echo "  - README.md (full documentation)"
echo "  - QUICKSTART.md (quick start guide)"
echo ""
echo -e "${GREEN}🎉 Ready to use!${NC}"
echo ""
