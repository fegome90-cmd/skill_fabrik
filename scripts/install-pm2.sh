#!/bin/bash

# PM2 Installation Script for Skills Fabrik

set -e

echo "🚀 Installing PM2 for Skills Fabrik..."

# Check if PM2 is already installed
if command -v pm2 &> /dev/null; then
    echo "✅ PM2 is already installed ($(pm2 --version))"
    echo "🔄 Updating PM2..."
    npm update -g pm2
else
    echo "📦 Installing PM2 globally..."
    npm install -g pm2
fi

# Install PM2 locally for development
echo "📦 Installing PM2 locally..."
pnpm add -D pm2

# Verify installation
echo "🔍 Verifying installation..."
pm2 --version
pm2 list

# Create logs directory
echo "📁 Creating logs directory..."
mkdir -p logs

# Set up PM2 startup script
echo "🔧 Setting up PM2 startup..."
pm2 startup | tail -n 1 | bash

echo "✅ PM2 installation completed!"
echo ""
echo "Next steps:"
echo "1. Start services: node scripts/pm2/startup-manager.mjs start"
echo "2. Monitor dashboard: node scripts/monitoring/dashboard.mjs"
echo "3. Check status: skills-cli daemon status"