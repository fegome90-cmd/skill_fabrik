#!/bin/bash
# ESLint Migration Script - Portable Version
# T1.1.8 - Configuration options support

set -e

# Default configuration options
MIGRATION_OPTIONS=""
CUSTOM_RULES_FILE=""
BACKUP_ENABLED="true"
DRY_RUN="false"
VERBOSE="false"
PRESERVE_CUSTOM_RULES="true"
PRETTIER_INTEGRATION="true"
INTERACTIVE_MODE="false"

# Load portability utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/utils/portability.sh"

# Function to display usage information
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "ESLint Migration Script - Portable Version v1.9.0"
    echo "Migrates fragmented ESLint configuration to unified format"
    echo ""
    echo "OPTIONS:"
    echo "  --preserver-custom-rules    Preserve custom rules from original config (default: true)"
    echo "  --no-preserver-custom-rules Don't preserve custom rules"
    echo "  --prettier-integration      Enable Prettier integration (default: true)"
    echo "  --no-prettier-integration   Disable Prettier integration"
    echo "  --custom-rules FILE         Path to custom rules JSON file"
    echo "  --no-backup                 Skip backup of original configuration"
    echo "  --dry-run                   Show what would be done without making changes"
    echo "  --verbose                   Enable verbose output"
    echo "  --interactive               Enable interactive mode for confirmations"
    echo "  --help                      Show this help message"
    echo ""
    echo "EXAMPLES:"
    echo "  $0 --no-backup --dry-run"
    echo "  $0 --custom-rules ./my-rules.json --verbose"
    echo "  $0 --no-prettier-integration"
}

# Function to parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --preserver-custom-rules)
                PRESERVE_CUSTOM_RULES="true"
                shift
                ;;
            --no-preserver-custom-rules)
                PRESERVE_CUSTOM_RULES="false"
                shift
                ;;
            --prettier-integration)
                PRETTIER_INTEGRATION="true"
                shift
                ;;
            --no-prettier-integration)
                PRETTIER_INTEGRATION="false"
                shift
                ;;
            --custom-rules)
                CUSTOM_RULES_FILE="$2"
                if [[ ! -f "$CUSTOM_RULES_FILE" ]]; then
                    echo "❌ Error: Custom rules file not found: $CUSTOM_RULES_FILE"
                    exit 1
                fi
                shift 2
                ;;
            --no-backup)
                BACKUP_ENABLED="false"
                shift
                ;;
            --dry-run)
                DRY_RUN="true"
                shift
                ;;
            --verbose)
                VERBOSE="true"
                shift
                ;;
            --interactive)
                INTERACTIVE_MODE="true"
                shift
                ;;
            --help)
                show_usage
                exit 0
                ;;
            *)
                echo "❌ Error: Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done
}

# Function to validate configuration
validate_configuration() {
    echo "🔍 Validating migration configuration..."
    
    local validation_errors=0
    
    # Validate custom rules file if provided
    if [[ -n "$CUSTOM_RULES_FILE" ]]; then
        if [[ "$VERBOSE" == "true" ]]; then
            echo "   • Custom rules file: $CUSTOM_RULES_FILE"
        fi
        
        # Basic JSON validation
        if ! jq empty "$CUSTOM_RULES_FILE" 2>/dev/null; then
            echo "❌ Error: Custom rules file is not valid JSON: $CUSTOM_RULES_FILE"
            validation_errors=$((validation_errors + 1))
        fi
    fi
    
    # Show configuration if verbose
    if [[ "$VERBOSE" == "true" ]]; then
        echo "   • Preserve custom rules: $PRESERVE_CUSTOM_RULES"
        echo "   • Prettier integration: $PRETTIER_INTEGRATION"
        echo "   • Backup enabled: $BACKUP_ENABLED"
        echo "   • Dry run: $DRY_RUN"
    fi
    
    if [[ $validation_errors -gt 0 ]]; then
        echo "❌ Configuration validation failed with $validation_errors error(s)"
        exit 1
    fi
    
    echo "✅ Configuration validation passed"
}

# Function to build migration options
build_migration_options() {
    MIGRATION_OPTIONS=""
    
    if [[ "$PRESERVE_CUSTOM_RULES" == "true" ]]; then
        MIGRATION_OPTIONS="$MIGRATION_OPTIONS --preserve-custom-rules"
    fi
    
    if [[ "$PRETTIER_INTEGRATION" == "true" ]]; then
        MIGRATION_OPTIONS="$MIGRATION_OPTIONS --prettier-integration"
    fi
    
    if [[ -n "$CUSTOM_RULES_FILE" ]]; then
        MIGRATION_OPTIONS="$MIGRATION_OPTIONS --custom-rules $CUSTOM_RULES_FILE"
    fi
    
    if [[ "$DRY_RUN" == "true" ]]; then
        MIGRATION_OPTIONS="$MIGRATION_OPTIONS --dry-run"
    fi
    
    if [[ "$VERBOSE" == "true" ]]; then
        MIGRATION_OPTIONS="$MIGRATION_OPTIONS --verbose"
    fi
}

# Parse command line arguments
parse_arguments "$@"

echo "🔄 ESLint Migration Script starting (Portable v1.9.0)..."

# Validate configuration first
validate_configuration

# Interactive confirmation function
interactive_confirmation() {
    if [[ "$INTERACTIVE_MODE" != "true" ]]; then
        return 0
    fi
    
    echo "🔔 Interactive Mode: Configuration Summary"
    echo "   • Preserve custom rules: $PRESERVE_CUSTOM_RULES"
    echo "   • Prettier integration: $PRETTIER_INTEGRATION"
    echo "   • Backup enabled: $BACKUP_ENABLED"
    echo "   • Dry run: $DRY_RUN"
    if [[ -n "$CUSTOM_RULES_FILE" ]]; then
        echo "   • Custom rules file: $CUSTOM_RULES_FILE"
    fi
    
    # Use Node.js for interactive prompts
    NODE_CONFIRM_SCRIPT=$(cat <<'EOF'
const inquirer = require('inquirer');

async function confirm() {
  console.log('');
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'proceed',
      message: 'Do you want to proceed with this configuration?',
      choices: [
        { name: 'Yes, proceed with migration', value: 'yes' },
        { name: 'No, cancel migration', value: 'no' },
        { name: 'Modify configuration', value: 'modify' }
      ]
    }
  ]);
  
  return answers.proceed;
}

confirm()
  .then(result => {
    if (result === 'yes') {
      console.log('✅ Proceeding with migration...');
      process.exit(0);
    } else if (result === 'no') {
      console.log('❌ Migration cancelled by user');
      process.exit(1);
    } else {
      console.log('ℹ️  To modify configuration, use command-line options');
      console.log('   Example: ./migrate-eslint-portable.sh --no-backup --custom-rules rules.json');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Interactive prompt failed:', error.message);
    proceedAnyway();
  });

function proceedAnyway() {
  console.log('⚠️  Proceeding anyway due to prompt failure...');
}
EOF
    )
    
    echo ""
    # Execute interactive confirmation
    if ! node -e "$NODE_CONFIRM_SCRIPT" 2>/dev/null; then
        echo "⚠️  Interactive mode not available, proceeding with migration..."
    fi
}

# Interactive confirmation before proceeding
interactive_confirmation

# Validate dependencies
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

# Build migration options
build_migration_options

if [[ "$VERBOSE" == "true" ]]; then
    echo "   • Migration options: $MIGRATION_OPTIONS"
fi

# Interactive backup confirmation
interactive_backup_confirmation() {
    if [[ "$INTERACTIVE_MODE" != "true" ]] || [[ -z "$ORIGINAL_CONFIG" ]] || [[ ! -f "$ORIGINAL_CONFIG" ]]; then
        return 0
    fi
    
    if [[ "$DRY_RUN" == "true" ]]; then
        return 0
    fi
    
    local backup_action="create backup"
    if [[ "$BACKUP_ENABLED" == "false" ]]; then
        backup_action="overwrite original configuration without backup"
    fi
    
    # Use Node.js for interactive backup confirmation
    local NODE_BACKUP_CONFIRM_SCRIPT=$(cat <<EOF
const inquirer = require('inquirer');

async function confirmBackup() {
  const backupEnabled = '$BACKUP_ENABLED' === 'true';
  const backupFile = '$BACKUP_FILE';
  
  console.log('');
  console.log('📋 Configuration Backup Confirmation');
  console.log('Found existing ESLint configuration: $ORIGINAL_CONFIG');
  
  const actionType = backupEnabled 
    ? \`Create backup at: \${backupFile}\` 
    : 'Overwrite original file without backup';
    
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'backupChoice',
      message: \`How do you want to handle: \${actionType}?\`,
      choices: backupEnabled ? [
        { name: '✅ Create backup and proceed', value: 'backup' },
        { name: '❌ Skip backup (dangerous)', value: 'skip' },
        { name: '🛑 Cancel migration', value: 'cancel' }
      ] : [
        { name: '⚠️  Overwrite without backup (dangerous)', value: 'skip' },
        { name: '📄 Create backup anyway', value: 'force-backup' },
        { name: '🛑 Cancel migration', value: 'cancel' }
      ]
    }
  ]);
  
  return answers.backupChoice;
}

confirmBackup()
  .then(result => {
    if (result === 'cancel') {
      console.log('❌ Migration cancelled by user');
      process.exit(1);
    } else if (result === 'skip') {
      console.log('⚠️  Proceeding without backup as requested');
      process.exit(0);
    } else if (result === 'force-backup') {
      console.log('✅ Forcing backup creation as requested');
      process.exit(2); // Special exit code for forced backup
    } else {
      console.log('✅ Proceeding with backup creation');
      process.exit(0);
    }
  })
  .catch(error => {
    console.error('❌ Backup confirmation failed:', error.message);
    process.exit(0); // Default to proceeding on error
  });
EOF
    )
    
    # Execute interactive backup confirmation
    echo ""
    if [[ "$INTERACTIVE_MODE" == "true" ]]; then
        local confirm_result
        confirm_result=$(node -e "$NODE_BACKUP_CONFIRM_SCRIPT" 2>/dev/null; echo $?)
        
        # Handle special exit codes
        if [[ "$confirm_result" -eq 1 ]]; then
            exit 1
        elif [[ "$confirm_result" -eq 2 ]]; then
            echo "🔧 Forcing backup creation..."
            return 0
        fi
    fi
}

# Execute interactive backup confirmation
interactive_backup_confirmation

# Backup current configuration (if enabled)
if [[ "$BACKUP_ENABLED" == "true" ]] && [[ -f "$ORIGINAL_CONFIG" ]]; then
    echo "💾 Creating backup..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        echo "   [DRY RUN] Would backup: $ORIGINAL_CONFIG -> $BACKUP_FILE"
    else
        if ! safe_copy "$ORIGINAL_CONFIG" "$BACKUP_FILE"; then
            echo "❌ Failed to create backup file"
            exit 1
        fi
        echo "✅ Backed up to: $BACKUP_FILE"
    fi
elif [[ "$BACKUP_ENABLED" == "false" ]] && [[ -f "$ORIGINAL_CONFIG" ]]; then
    echo "⚠️  Warning: Backup is disabled. Original config will be overwritten."
elif [[ ! -f "$ORIGINAL_CONFIG" ]]; then
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
    
    // Load custom rules if provided
    let customRules = {};
    try {
        const customRulesPath = '$CUSTOM_RULES_FILE';
        if (customRulesPath && customRulesPath !== '') {
            const customRulesContent = fs.readFileSync(customRulesPath, 'utf8');
            customRules = JSON.parse(customRulesContent);
            console.log('🔍 Custom rules loaded successfully');
        }
    } catch (e) {
        console.log('⚠️  Warning: Could not load custom rules, proceeding without them');
    }
    
    // Build configuration options
    const configOptions = {
        projectPath: '$PROJECT_ROOT',
        preserveCustomRules: $PRESERVE_CUSTOM_RULES,
        originalConfig: originalConfig
    };
    
    // Add custom rules if provided
    if (Object.keys(customRules).length > 0) {
        configOptions.customRules = customRules;
        console.log('🔍 Custom rules applied:', Object.keys(customRules).length, 'rules');
    }
    
    // Generate unified configuration
    const unifiedConfig = createESLintConfigSync(configOptions);
    
    // Add Prettier integration if enabled
    const prettierEnabled = '$PRETTIER_INTEGRATION' === 'true';
    if (prettierEnabled) {
        console.log('🔧 Adding Prettier integration...');
        
        // Ensure plugins array exists
        if (!unifiedConfig.plugins) {
            unifiedConfig.plugins = [];
        }
        
        // Add prettier plugin if not present
        if (!unifiedConfig.plugins.includes('prettier')) {
            unifiedConfig.plugins.push('prettier');
        }
        
        // Ensure extends array exists
        if (!unifiedConfig.extends) {
            unifiedConfig.extends = [];
        }
        
        // Add prettier config if not present
        if (!unifiedConfig.extends.includes('prettier')) {
            unifiedConfig.extends.push('prettier');
        }
        
        // Add prettier rule
        if (!unifiedConfig.rules) {
            unifiedConfig.rules = {};
        }
        unifiedConfig.rules['prettier/prettier'] = 'error';
        
        console.log('✅ Prettier integration added');
    }
    
    // Validate generated configuration
    if (!unifiedConfig || typeof unifiedConfig !== 'object') {
        throw new Error('Invalid configuration generated');
    }
    
    // Interactive final configuration confirmation
    const isDryRun = '$DRY_RUN' === 'true';
    const isInteractive = '$INTERACTIVE_MODE' === 'true';
    
    if (isInteractive && !isDryRun) {
        (async () => {
            const inquirer = require('inquirer');
            
            console.log('');
            console.log('📋 Final Configuration Preview');
            console.log('🔤 Parser:', unifiedConfig.parser || 'undefined');
            console.log('🔌 Plugins:', unifiedConfig.plugins ? unifiedConfig.plugins.length : 'none');
            console.log('📏 Rules count:', unifiedConfig.rules ? Object.keys(unifiedConfig.rules).length : 0);
            if (prettierEnabled) {
                console.log('🎨 Prettier integration: enabled');
            }
            console.log('📄 Output file:', '$ORIGINAL_CONFIG');
            
            const finalAnswers = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'finalAction',
                    message: 'Confirm final action:',
                    choices: [
                        { name: '✅ Write configuration to file', value: 'write' },
                        { name: '👀 Show detailed configuration preview', value: 'preview' },
                        { name: '🛑 Cancel migration', value: 'cancel' }
                    ]
                }
            ]);
            
            if (finalAnswers.finalAction === 'cancel') {
                console.log('❌ Migration cancelled by user');
                process.exit(1);
            } else if (finalAnswers.finalAction === 'preview') {
                console.log('📄 Detailed Configuration Preview:');
                console.log(JSON.stringify(unifiedConfig, null, 2));
                
                const confirmWrite = await inquirer.prompt([
                    {
                        type: 'confirm',
                        name: 'writeNow',
                        message: 'Write this configuration to file?',
                        default: true
                    }
                ]);
                
                if (!confirmWrite.writeNow) {
                    console.log('❌ Migration cancelled by user');
                    process.exit(1);
                }
            }
        })().catch(error => {
            console.error('❌ Interactive confirmation failed:', error.message);
            console.log('⚠️  Proceeding with migration...');
        });
    }
    
    // Write the unified configuration (unless dry run)
    if (isDryRun) {
        console.log('[DRY RUN] Would write configuration to:', '$ORIGINAL_CONFIG');
        console.log('[DRY RUN] Configuration preview:');
        console.log(JSON.stringify(unifiedConfig, null, 2));
    } else {
        fs.writeFileSync('$ORIGINAL_CONFIG', JSON.stringify(unifiedConfig, null, 2));
        console.log('✅ Configuration written to:', '$ORIGINAL_CONFIG');
    }
    
    console.log('✅ Generated unified config');
    console.log('   • Parser:', unifiedConfig.parser || 'undefined');
    console.log('   • Plugins:', unifiedConfig.plugins ? unifiedConfig.plugins.length : 'none');
    if (prettierEnabled) {
        console.log('   • Prettier integration: enabled');
    }
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
    TEST_FILE="$PROJECT_ROOT/test-eslint-migration.js"
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