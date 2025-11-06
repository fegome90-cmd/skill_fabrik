#!/usr/bin/env node

/**
 * Script to fix CLI compilation issues
 * Addresses chalk colors, spinner API, and TypeScript errors
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Starting CLI compilation fixes...');

const fixColorImports = (filePath) => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Fix chalk import issues
    if (content.includes('chalk.') && !content.includes('const chalk = require')) {
      content = `const chalk = require('chalk');\n${content}`;
    }

    // Fix missing color properties
    const colorFixes = {
      'chalk.header': 'chalk.cyan.bold',
      'chalk.command': 'chalk.blue',
      'chalk.number': 'chalk.yellow',
      'chalk.path': 'chalk.dim',
      'chalk.flag': 'chalk.magenta'
    };

    Object.entries(colorFixes).forEach(([oldColor, newColor]) => {
      content = content.replace(new RegExp(oldColor, 'g'), newColor);
    });

    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed colors in ${filePath}`);
  } catch (error) {
    console.log(`❌ Error fixing ${filePath}: ${error.message}`);
  }
};

const fixSpinnerAPI = (filePath) => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Fix spinner API calls
    const spinnerFixes = {
      '\\.succeed\\(': '.stop()',
      '\\.fail\\(': '.stop()',
      '\\.stop\\(': '.stop()'
    };

    Object.entries(spinnerFixes).forEach(([oldPattern, newPattern]) => {
      content = content.replace(new RegExp(oldPattern, 'g'), newPattern);
    });

    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed spinner API in ${filePath}`);
  } catch (error) {
    console.log(`❌ Error fixing ${filePath}: ${error.message}`);
  }
};

const fixBoxenAPI = (filePath) => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Fix boxen API calls (remove second parameter)
    content = content.replace(/boxen\([^,]+,\s*{[^}]*}\)/g, (match) => {
      const textOnly = match.match(/boxen\(([^,]+),/)[1];
      return `boxen(${textOnly})`;
    });

    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed boxen API in ${filePath}`);
  } catch (error) {
    console.log(`❌ Error fixing ${filePath}: ${error.message}`);
  }
};

const fixTypeScriptConfig = () => {
  try {
    const configPath = path.join(__dirname, '../tsconfig.build.json');
    let content = fs.readFileSync(configPath, 'utf8');

    // Remove deprecated option
    content = content.replace(/,\s*["']suppressImplicitAnyIndexErrors["']:\s*true/g, '');

    fs.writeFileSync(configPath, content);
    console.log(`✅ Fixed TypeScript config`);
  } catch (error) {
    console.log(`❌ Error fixing TypeScript config: ${error.message}`);
  }
};

// Main execution
const filesToFix = [
  'src/cli/commands/nav.ts',
  'src/commands/skills.ts',
  'src/core/config-manager.ts',
  'src/core/state-manager.ts',
  'src/utils/cache.ts',
  'src/utils/progress.ts'
];

console.log('🔧 Applying fixes...');

// Fix TypeScript config first
fixTypeScriptConfig();

// Fix each file
filesToFix.forEach(file => {
  const fullPath = path.join(__dirname, '..', file);
  if (fs.existsSync(fullPath)) {
    fixColorImports(fullPath);
    fixSpinnerAPI(fullPath);
    fixBoxenAPI(fullPath);
  } else {
    console.log(`⚠️  File not found: ${file}`);
  }
});

console.log('🎉 CLI compilation fixes completed!');
console.log('');
console.log('Next steps:');
console.log('1. Run: pnpm build');
console.log('2. Run: pnpm test');
console.log('3. Verify all tests pass');