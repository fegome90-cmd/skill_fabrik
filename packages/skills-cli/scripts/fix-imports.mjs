#!/usr/bin/env node

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, extname } from 'path';

const distDir = './dist';

function fixImportsInFile(filePath) {
  const content = readFileSync(filePath, 'utf8');

  // Fix all relative imports by adding .js extensions
  const fixed = content.replace(
    /from\s+['"](\.\.\/[^'"]+|\.[^'"]*)['"];?/g,
    (match, importPath) => {
      if (!importPath.endsWith('.js') && !importPath.endsWith('.json')) {
        return `from '${importPath}.js';`;
      }
      return match;
    }
  );

  if (content !== fixed) {
    writeFileSync(filePath, fixed);
    console.log(`✅ Fixed imports in ${filePath}`);
  }
}

function fixAllImports(dir) {
  const files = readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    const fullPath = join(dir, file.name);

    if (file.isDirectory()) {
      fixAllImports(fullPath);
    } else if (extname(file.name) === '.js') {
      fixImportsInFile(fullPath);
    }
  }
}

console.log('🔧 Fixing ES module imports in compiled files...');
fixAllImports(distDir);
console.log('✅ Import fixing complete!');