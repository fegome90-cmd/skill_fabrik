#!/usr/bin/env node

/**
 * Validador de encoding UTF-8
 * Previene inserción de caracteres no-ASCII problemáticos
 */

const fs = require('fs');
const path = require('path');

// Caracteres problemáticos detectados
const PROBLEMATIC_CHARS = [
  '·', // Caracteres de formato incorrectos
  '\u2022', // Bullet characters
  '\u25ca', // Diamond characters
  /[\u4e00-\u9fff]/, // Chino characters
  /[\u3040-\u309f]/, // Hiragana
  /[\u30a0-\u30ff]/ // Katakana
];

function checkEncoding(file) {
  const content = fs.readFileSync(file, 'utf8');
  const issues = [];

  // Detectar caracteres problemáticos
  PROBLEMATIC_CHARS.forEach(char => {
    if (typeof char === 'string') {
      if (content.includes(char)) {
        issues.push(`Caracter problemático "${char}" encontrado`);
      }
    } else if (char instanceof RegExp) {
      const matches = content.match(char);
      if (matches) {
        issues.push(
          `Caracteres no-ASCII detectados: ${matches.slice(0, 3).join(', ')}`
        );
      }
    }
  });

  // Verificar BOM UTF-8
  const hasBOM = content.charCodeAt(0) === 0xfeff;
  if (hasBOM) {
    issues.push('BOM UTF-8 detectado (debe ser eliminado)');
  }

  return issues;
}

// Validar archivos pasados como argumentos
const args = process.argv.slice(2);
let hasErrors = false;

function processFiles(fileList) {
  if (!Array.isArray(fileList)) {
    console.error('❌ Error: fileList is not an array');
    hasErrors = true;
    return;
  }

  fileList.forEach(file => {
    if (!fs.existsSync(file)) return;

    const stat = fs.statSync(file);
    if (stat.isDirectory()) {
      // Procesar recursivamente directorios
      const files = fs.readdirSync(file);
      files.forEach(childFile => {
        processFiles(path.join(file, childFile));
      });
    } else if (file.match(/\.(js|ts|json|md)$/)) {
      // Solo procesar archivos relevantes
      try {
        const issues = checkEncoding(file);
        if (issues.length > 0) {
          console.error(`❌ ${file}:`);
          issues.forEach(issue => console.error(`   - ${issue}`));
          hasErrors = true;
        }
      } catch (error) {
        console.error(`❌ Error verificando ${file}: ${error.message}`);
        hasErrors = true;
      }
    }
  });
}

processFiles(args.length > 0 ? args : ['.']);

if (hasErrors) {
  console.error('\n❌ Encoding validation failed');
  console.error(
    'Por favor corrija los caracteres problemáticos antes de hacer commit'
  );
  process.exit(1);
}

console.log('✅ UTF-8 encoding validation passed');
process.exit(0);
