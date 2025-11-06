#!/usr/bin/env node

/**
 * Fix ES Module Imports - Add .js extensions
 * Fixes compiled JavaScript files to have proper .js extensions for ES modules
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing ES module imports...');

function fixFileImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Fix relative imports by adding .js extension
    content = content.replace(
      /from\s+['"](\.\.?\/[^'"]+)['"]/g,
      (match, importPath) => {
        // Don't add .js if it already has an extension
        if (importPath.match(/\.(js|ts|json|mjs)$/)) {
          return match;
        }
        return `from '${importPath}.js'`;
      }
    );

    // Fix dynamic imports
    content = content.replace(
      /import\s*\(\s*['"](\.\.?\/[^'"]+)['"]\s*\)/g,
      (match, importPath) => {
        if (importPath.match(/\.(js|ts|json|mjs)$/)) {
          return match;
        }
        return `import('${importPath}.js')`;
      }
    );

    fs.writeFileSync(filePath, content);
    return true;
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
    return false;
  }
}

function fixDirectory(dir) {
  const files = fs.readdirSync(dir);
  let fixed = 0;

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      fixed += fixDirectory(filePath);
    } else if (file.endsWith('.js')) {
      if (fixFileImports(filePath)) {
        fixed++;
      }
    }
  });

  return fixed;
}

const distDir = path.join(__dirname, '../dist');
if (fs.existsSync(distDir)) {
  const fixedCount = fixDirectory(distDir);
  console.log(`✅ Fixed ${fixedCount} JavaScript files`);
} else {
  console.log('❌ Dist directory not found');
  process.exit(1);
}