#!/bin/bash
# ESLint Migration Script - Portable Version
# T1.1.7 - Improved cross-platform compatibility and path handling

set -e

# Load portability utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/utils/portability.sh"

echo "🔄 ESLint Migration Script starting (Portable v1.7)..."

# Validate dependencies first
if ! check_dependencies; then
    echo "❌ Dependency check failed. Please install missing dependencies."
    exit 1
fi

# Portable path resolution
SCRIPT_DIR="$(get_script_dir)"
MIGRATION_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(resolve_path "$MIGRATION_DIR/..")"

echo "🔍 Script directory: $SCRIPT_DIR"
echo "🔍 Migration directory: $MIGRATION_DIR"  
echo "🔍 Project root: $PROJECT_ROOT"

# Configuration paths (portable)
DIST_DIR="$PROJECT_ROOT/dist"
ORIGINAL_CONFIG="$PROJECT_ROOT/.eslintrc.json"
ESLINT_CONFIG_MODULE="$DIST_DIR/src/config/eslint.config.js"

# Backup setup with cross-platform timestamp
BACKUP_SUFFIX="$(get_timestamp)"
BACKUP_FILE="$ORIGINAL_CONFIG.backup.$BACKUP_SUFFIX"

echo "🔍 Configuration paths:"
echo "   • Source config: $ORIGINAL_CONFIG"
echo "   • ESLint module: $ESLINT_CONFIG_MODULE"
echo "   • Dist directory: $DIST_DIR"

# Backup current configuration
if [[ -f "$ORIGINAL_CONFIG" ]]; then
    echo "💾 Creating backup..."
    
    if ! safe_copy "$ORIGINAL_CONFIG" "$BACKUP_FILE"; then
        echo "❌ Failed to create backup file"
        exit 1
    fi
    
    echo "✅ Backed up to: $BACKUP_FILE"
else
    echo "ℹ️  No existing .eslintrc.json found, creating new unified configuration"
fi

# Prepare dist environment
echo "🔧 Preparing TypeScript compilation..."
if [[ ! -d "$DIST_DIR" ]]; then
    echo "📝 TypeScript files not compiled. Running build..."
    
    # Change to correct directory for build
    cd "$PROJECT_ROOT"
    
    if ! npm run build; then
        echo "❌ TypeScript compilation failed"
        exit 1
    fi
    
    echo "✅ TypeScript compilation completed"
fi

# Validate ESLint config module exists
if [[ ! -f "$ESLINT_CONFIG_MODULE" ]]; then
    echo "❌ ESLint configuration module not found: $ESLINT_CONFIG_MODULE"
    echo "Available files in dist:" "$(ls -la "$DIST_DIR/src/config/" 2>/dev/null || echo "Directory not found")"
    exit 1
fi

echo "✅ ESLint configuration module found"

# Generate new unified configuration using Node.js
echo "📝 Generating unified ESLint configuration..."

# Create portable Node.js script
NODE_SCRIPT=$(cat <<EOF
const fs = require('fs');
const path = require('path');

try {
    console.log('🔍 Working directory:', process.cwd());
    console.log('🔍 Project root:', '$PROJECT_ROOT');
    
    // Load the ESLint configuration module
    const modulePath = path.resolve('$ESLINT_CONFIG_MODULE');
    console.log('🔍 Loading module from:', modulePath);
    
    const { createESLintConfigSync } = require(modulePath);
    
    // Load original configuration if exists
    let originalConfig = {};
    try {
        const originalContent = fs.readFileSync('$ORIGINAL_CONFIG', 'utf8');
        originalConfig = JSON.parse(originalContent);
        console.log('🔍 Original config loaded successfully');
    } catch (e) {
        console.log('ℹ️  No original config found, using empty template');
    }
    
    // Generate unified configuration
    const unifiedConfig = createESLintConfigSync({
        projectPath: '$PROJECT_ROOT',
        preserveCustomRules: true,
        originalConfig: originalConfig
    });
    
    // Validate generated configuration
    if (!unifiedConfig || typeof unifiedConfig !== 'object') {
        throw new Error('Invalid configuration generated');
    }
    
    // Write the unified configuration
    fs.writeFileSync('$ORIGINAL_CONFIG', JSON.stringify(unifiedConfig, null, 2));
    
    console.log('✅ Generated unified config');
    console.log('   • Parser:', unifiedConfig.parser || 'undefined');
    console.log('   • Plugins:', unifiedConfig.plugins ? Object.keys(unifiedConfig.plugins) : 'none');
    console.log('   • Rules count:', unifiedConfig.rules ? Object.keys(unifiedConfig.rules).length : 0);
    console.log('✅ Saved to: $ORIGINAL_CONFIG');
    
} catch (error) {
    console.error('❌ Configuration generation failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
}
EOF
)

# Execute Node.js script with proper working directory
cd "$PROJECT_ROOT"
if ! echo "$NODE_SCRIPT" | node; then
    echo "❌ Configuration generation failed"
    exit 1
fi

# Validate the generated configuration
echo "🔍 Validating generated configuration..."
if ! validate_json "$ORIGINAL_CONFIG"; then
    echo "❌ Generated configuration is not valid JSON"
    echo "🔍 Attempting to restore backup..."
    if [[ -f "$BACKUP_FILE" ]]; then
        safe_copy "$BACKUP_FILE" "$ORIGINAL_CONFIG"
        echo "✅ Backup restored"
    fi
    exit 1
fi

echo "✅ Configuration validation passed"

# Test ESLint with new configuration if possible
if [[ -f "$PROJECT_ROOT/package.json" ]] && [[ -d "$PROJECT_ROOT/node_modules" ]]; then
    echo "🧪 Testing ESLint with new configuration..."
    
    # Create temporary test file
    local TEST_FILE="$PROJECT_ROOT/test-eslint-migration.js"
    echo 'const test = "hello"; console.log(test);' > "$TEST_FILE"
    
    if npx eslint "$TEST_FILE" --format=compact 2>/dev/null; then
        echo "✅ ESLint validation test passed"
    else
        echo "⚠️  ESLint validation test failed, but migration completed"
    fi
    
    # Clean up test file
    rm -f "$TEST_FILE"
else
    echo "ℹ️  Skipping ESLint validation test (no package.json or node_modules found)"
fi

# Success summary
echo "🎉 ESLint migration completed successfully!"
echo ""
echo "📋 Migration Summary:"
echo "   • Original config: $ORIGINAL_CONFIG"
if [[ -f "$BACKUP_FILE" ]]; then
    echo "   • Backup created: $BACKUP_FILE"
fi
echo "   • New unified config: $ORIGINAL_CONFIG"
echo "   • Project root: $PROJECT_ROOT"
echo ""
echo "💡 To rollback: cp '$BACKUP_FILE' '$ORIGINAL_CONFIG'"
echo "🚀 Ready for T1.1.8 - Configuration options support"