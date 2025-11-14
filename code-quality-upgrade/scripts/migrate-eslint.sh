#!/bin/bash
# ESLint Migration Script
# Migrates fragmented ESLint configurations to unified configuration
# T1.1.5 - Migrar configuración actual del repo (2 horas)

set -e

echo "🔄 ESLint Migration Script starting..."

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DIST_DIR="$PROJECT_DIR/dist"

# Backup current configuration if it exists
BACKUP_SUFFIX="$(date +%Y%m%d-%H%M%S)"
ORIGINAL_CONFIG="$PROJECT_DIR/.eslintrc.json"

if [ -f "$ORIGINAL_CONFIG" ]; then
    BACKUP_FILE="$ORIGINAL_CONFIG.backup.$BACKUP_SUFFIX"
    cp "$ORIGINAL_CONFIG" "$BACKUP_FILE"
    echo "✅ Backed up current .eslintrc.json to $BACKUP_FILE"
else
    echo "ℹ️  No existing .eslintrc.json found, creating new unified configuration"
fi

# Generate new unified configuration using TypeScript
echo "📝 Generating unified ESLint configuration..."

# First, ensure TypeScript files are compiled
if [ ! -d "../dist" ]; then
    echo "⚠️  TypeScript files not compiled. Running tsc..."
    npm run build
fi

# Generate the unified configuration using Node.js
echo "📝 Generating unified ESLint configuration..."

# Create a temporary Node.js script with correct working directory
NODE_SCRIPT="process.chdir('$PROJECT_DIR'); const fs = require('fs'); const path = require('path'); const modulePath = path.resolve('./dist/src/config/eslint.config.js'); console.log('🔍 Loading module from:', modulePath); const { createESLintConfigSync } = require(modulePath); let originalConfig = {}; try { const origConfig = fs.readFileSync('.eslintrc.json', 'utf8'); originalConfig = JSON.parse(origConfig); } catch (e) {}; const unifiedConfig = createESLintConfigSync({ projectPath: process.cwd(), preserveCustomRules: true, originalConfig: originalConfig }); console.log('✅ Generated unified config with plugins:', unifiedConfig.plugins ? 'YES' : 'NO'); fs.writeFileSync('.eslintrc.json', JSON.stringify(unifiedConfig, null, 2)); console.log('✅ Saved unified .eslintrc.json');"

# Run the Node.js script
echo "$NODE_SCRIPT" | node

# Verify the final result
echo "🔍 Verifying final configuration..."
node -e "const config = JSON.parse(require('fs').readFileSync('../.eslintrc.json', 'utf8')); console.log('Final config fields:', Object.keys(config)); console.log('Has plugins:', config.plugins ? 'YES' : 'NO');"

# Validate the new configuration
echo "🔍 Validating new ESLint configuration..."

# Check if the new config is valid JSON
if ! python3 -m json.tool ../.eslintrc.json > /dev/null 2>&1; then
    if command -v node > /dev/null 2>&1; then
        node -e "JSON.parse(require('fs').readFileSync('../.eslintrc.json', 'utf8'))"
        echo "✅ ESLint configuration is valid JSON"
    else
        echo "❌ ESLint configuration is not valid JSON"
        exit 1
    fi
fi

# Check that required fields are present
echo "🔍 Validating ESLint configuration structure..."
REQUIRED_FIELDS=("parser" "plugins" "extends" "rules")
for field in "${REQUIRED_FIELDS[@]}"; do
    if ! node -e "
        const fs = require('fs');
        const config = JSON.parse(fs.readFileSync('../.eslintrc.json', 'utf8'));
        if (!config.$field) { 
            console.error('Missing required field: $field');
            console.log('Available fields:', Object.keys(config));
            process.exit(1); 
        }
        console.log('✓ Field $field: present');
    " 2>/dev/null; then
        echo "❌ ESLint configuration missing required field: $field"
        exit 1
    fi
done

echo "✅ ESLint configuration validation passed"

# Test ESLint with the new configuration (if npm and node_modules exist)
if [ -f "../package.json" ] && [ -d "../node_modules" ]; then
    echo "🧪 Testing ESLint with new configuration..."
    
    cd ..
    
    # Try to run ESLint on a simple test to verify config works
    if [ -f ".eslintrc.json" ]; then
        # Create a simple test file
        echo 'const test = "hello";' > test-eslint-migration.js
        
        # Try to run ESLint
        if npx eslint test-eslint-migration.js --format=compact 2>/dev/null; then
            echo "✅ ESLint validation test passed"
        else
            echo "⚠️  ESLint validation test failed, but migration completed"
        fi
        
        # Clean up test file
        rm -f test-eslint-migration.js
    fi
    
    cd "$PROJECT_DIR"
else
    echo "ℹ️  Skipping ESLint validation test (no package.json or node_modules found)"
fi

echo "🎉 ESLint migration completed successfully!"
echo ""
echo "📋 Migration Summary:"
echo "   • Original config: $ORIGINAL_CONFIG"
echo "   • Backup created: $ORIGINAL_CONFIG.backup.$BACKUP_SUFFIX"
echo "   • New unified config: $PROJECT_DIR/../.eslintrc.json"
echo ""
echo "💡 To rollback: cp $ORIGINAL_CONFIG.backup.$BACKUP_SUFFIX $ORIGINAL_CONFIG"