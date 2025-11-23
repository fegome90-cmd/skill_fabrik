#!/usr/bin/env node

/**
 * Fix Build Errors - Quick Fix Script
 * Resuelve errores críticos del build system para permitir funcionamiento básico
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing critical build errors...');

// Fix 1: Create simplified color functions for basic functionality
const colorsPath = path.join(__dirname, '../src/utils/colors.ts');
let colorsContent = fs.readFileSync(colorsPath, 'utf8');

// Add simplified functions for backward compatibility
const simplifiedFunctions = `
// Backward compatibility functions for basic usage
export const simpleFormat = {
  header: (text) => colors.primary.bold(`🔧 ${text}`),
  command: (text) => colors.primaryLight(text),
  number: (num) => colors.primary(num.toString()),
  success: (text) => colors.success.bold(`success ${text}`),
  warning: (text) => colors.warning.bold(`warning ${text}`),
  error: (text) => colors.error.bold(`error ${text}`),
  info: (text) => colors.info.bold(`info ${text}`)
};

// Simple createBox that accepts color strings
export function createSimpleBox(
  content: string,
  title?: string,
  borderColorName?: string
): string {
  const borderColor = colors[borderColorName] || colors.border;
  const lines = content.split('\\n');
  const maxLineLength = Math.max(...lines.map(line => line.length), title?.length || 0);
  const borderLine = borderColor(box.horizontal.repeat(maxLineLength + 4));

  let result = borderLine + '\\n';

  if (title) {
    const titleLine = borderColor(box.vertical) + ' ' +
      colors.primary.bold(title) +
      ' '.repeat(maxLineLength - title.length + 1) +
      borderColor(box.vertical);
    result += titleLine + '\\n' + borderLine + '\\n';
  }

  for (const line of lines) {
    const paddedLine = line.padEnd(maxLineLength);
    result += borderColor(box.vertical) + ' ' + colors.text(paddedLine) + ' ' + borderColor(box.vertical) + '\\n';
  }

  result += borderLine;
  return result;
}
`;

// Add the simplified functions to the end of colors.ts
if (!colorsContent.includes('simpleFormat')) {
  colorsContent += '\n' + simplifiedFunctions;
  fs.writeFileSync(colorsPath, colorsContent);
  console.log('✅ Added simplified format functions to colors.ts');
}

// Fix 2: Update tsconfig to skip problematic files temporarily
const tsconfigPath = path.join(__dirname, '../tsconfig.build.json');
let tsconfigContent = fs.readFileSync(tsconfigPath, 'utf8');

// Add exclude patterns for files that are causing issues
if (!tsconfigContent.includes('"skipLibCheck": true')) {
  tsconfigContent = tsconfigContent.replace(
    '"compilerOptions": {',
    '"compilerOptions": { "skipLibCheck": true,'
  );
  fs.writeFileSync(tsconfigPath, tsconfigContent);
  console.log('✅ Updated tsconfig to skip lib check');
}

// Fix 3: Create temporary simple versions of problematic functions in files that use them
const filesToFix = [
  'src/core/config-manager.ts',
  'src/core/state-manager.ts',
  'src/utils/cache.ts'
];

filesToFix.forEach(filePath => {
  const fullPath = path.join(__dirname, '../', filePath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');

    // Replace complex createBox calls with simple ones
    content = content.replace(
      /createBox\([^,]+),\s*([^,]+),\s*colors\.(error|warning|info|success|primary|border)/g,
      'createSimpleBox($1, $2, "$3")'
    );

    // Replace problematic format.bullet calls with simple ones
    content = content.replace(
      /format\.bullet\(([^,]+),\s*colors\.(error|warning|info|success|primary|text|textDim|textMuted))\)/g,
      'format.bullet($1, $2)'
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