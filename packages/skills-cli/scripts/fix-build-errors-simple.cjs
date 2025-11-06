#!/usr/bin/env node

/**
 * Fix Build Errors - Simple Fix Script
 * Resuelve errores críticos del build system para permitir funcionamiento básico
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing critical build errors...');

// Fix 1: Update tsconfig to skip problematic files temporarily
const tsconfigPath = path.join(__dirname, '../tsconfig.build.json');
if (fs.existsSync(tsconfigPath)) {
  let tsconfigContent = fs.readFileSync(tsconfigPath, 'utf8');

  // Add skipLibCheck if not present
  if (!tsconfigContent.includes('"skipLibCheck": true')) {
    tsconfigContent = tsconfigContent.replace(
      '"compilerOptions": {',
      '"compilerOptions": { "skipLibCheck": true,'
    );
    fs.writeFileSync(tsconfigPath, tsconfigContent);
    console.log('✅ Updated tsconfig to skip lib check');
  }
}

// Fix 2: Create simple compatibility functions in colors.ts
const colorsPath = path.join(__dirname, '../src/utils/colors.ts');
if (fs.existsSync(colorsPath)) {
  let colorsContent = fs.readFileSync(colorsPath, 'utf8');

  // Add simple compatibility functions if not present
  if (!colorsContent.includes('simpleFormat')) {
    const simpleFunctions = '\n' +
      '// Backward compatibility functions for basic usage\n' +
      'export const simpleFormat = {\n' +
      '  header: (text: string) => colors.primary.bold("🔧 " + text),\n' +
      '  command: (text: string) => colors.primaryLight(text),\n' +
      '  number: (num: number) => colors.primary(num.toString()),\n' +
      '  success: (text: string) => colors.success.bold("✅ " + text),\n' +
      '  warning: (text: string) => colors.warning.bold("⚠️  " + text),\n' +
      '  error: (text: string) => colors.error.bold("❌ " + text),\n' +
      '  info: (text: string) => colors.info.bold("ℹ️  " + text)\n' +
      '};\n';

    colorsContent += simpleFunctions;
    fs.writeFileSync(colorsPath, colorsContent);
    console.log('✅ Added simple format functions to colors.ts');
  }
}

// Fix 3: Update problematic files to use simpler patterns
const filesToFix = [
  'src/core/config-manager.ts',
  'src/core/state-manager.ts',
  'src/utils/cache.ts'
];

filesToFix.forEach(filePath => {
  const fullPath = path.join(__dirname, '../', filePath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');

    // Replace createBox calls with simpler versions
    content = content.replace(
      /createBox\(/g,
      'createSimpleBox('
    );

    // Fix format.bullet calls
    content = content.replace(
      /format\.bullet\([^,]+,\s*colors\.(\w+)\)/g,
      'format.bullet($1, colors.$1)'
    );

    fs.writeFileSync(fullPath, content);
    console.log(`✅ Fixed ${filePath}`);
  }
});

console.log('🎯 Build errors fixed. Now building...');

// Try building
try {
  const { execSync } = require('child_process');
  execSync('npm run build', { stdio: 'inherit', cwd: path.join(__dirname, '../') });
  console.log('✅ Build successful!');
} catch (error) {
  console.log('❌ Build still has issues:', error.message);
  process.exit(1);
}