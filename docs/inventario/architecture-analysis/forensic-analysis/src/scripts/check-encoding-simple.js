#!/usr/bin/env node

/**
 * Validador simple de encoding UTF-8
 * Versión simplificada y robusta
 */

const fs = require('fs');
const path = require('path');

function checkFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];

    // Detectar caracteres problemáticos específicos
    if (content.includes('·')) {
      issues.push('Contiene caracteres "·" problemáticos');
    }

    // Detectar caracteres chinos
    if (/[\u4e00-\u9fff]/.test(content)) {
      issues.push('Contiene caracteres chinos');
    }

    // Detectar otros caracteres no-ASCII problemáticos
    if (/[\u00B7\u2022\u25ca]/.test(content)) {
      issues.push('Contiene caracteres de formato no-ASCII');
    }

    return issues;
  } catch (error) {
    return [`Error leyendo archivo: ${error.message}`];
  }
}

function checkDirectory(dir) {
  const issues = [];

  try {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      // Ignorar archivos de documentación temporales que no son parte del análisis
      if (item.match(/^(ESTADO|FALLENCIAS).*\.md$/)) {
        continue;
      }

      if (stat.isFile() && /\.(js|ts|json|md)$/.test(item)) {
        const fileIssues = checkFile(fullPath);
        if (fileIssues.length > 0) {
          issues.push(`${fullPath}: ${fileIssues.join(', ')}`);
        }
      }
    }
  } catch (error) {
    issues.push(`Error procesando directorio ${dir}: ${error.message}`);
  }

  return issues;
}

// Directorio a verificar (default: current dir)
const targetDir = process.argv[2] || '.';
const issues = checkDirectory(targetDir);

if (issues.length > 0) {
  console.error('❌ UTF-8 encoding validation failed:');
  issues.forEach(issue => console.error(`   - ${issue}`));
  console.error('\n💡 Para corregir caracteres problemáticos:');
  console.error(
    '   tr -d "·" < archivo > archivo.limpio && mv archivo.limpio archivo'
  );
  process.exit(1);
} else {
  console.log('✅ UTF-8 encoding validation passed');
  process.exit(0);
}
