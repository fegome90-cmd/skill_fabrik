#!/usr/bin/env node

/**
 * Utilidad consolidada de validación de encoding UTF-8
 * Combina funcionalidad de check-encoding.js y check-encoding-simple.js
 * Previene inserción de caracteres no-ASCII problemáticos
 */

const fs = require('fs');
const path = require('path');

// Caracteres problemáticos detectados (consolidado de ambos scripts)
const PROBLEMATIC_PATTERNS = {
  // Caracteres específicos del script simple
  specificChars: [
    '·', // Caracteres de formato incorrectos
    '\u2022', // Bullet characters
    '\u25ca', // Diamond characters
    '\u00B7' // Middle dot
  ],
  // Rangos de caracteres del script completo
  charRanges: [
    /[\u4e00-\u9fff]/, // Chino characters
    /[\u3040-\u309f]/, // Hiragana
    /[\u30a0-\u30ff]/ // Katakana
  ],
  // Patrón de 6+ caracteres no-imprimibles (versión mejorada)
  nonPrintable: /[^\x20-\x7E\xC0-\xFF]{6,}/
};

/**
 * Valida encoding de un archivo específico
 * @param {string} filePath - Ruta del archivo a validar
 * @returns {Array} - Lista de issues encontrados
 */
function validateFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];

    // Validar caracteres específicos (del script simple)
    PROBLEMATIC_PATTERNS.specificChars.forEach(char => {
      if (content.includes(char)) {
        issues.push(`Caracter problemático "${char}" encontrado`);
      }
    });

    // Validar rangos de caracteres (del script completo)
    PROBLEMATIC_PATTERNS.charRanges.forEach((regex, index) => {
      const matches = content.match(regex);
      if (matches) {
        const rangeNames = ['Chino', 'Hiragana', 'Katakana'];
        issues.push(
          `Caracteres ${rangeNames[index]} detectados: ${matches.slice(0, 3).join(', ')}`
        );
      }
    });

    // Validar patrones no-imprimibles (mejorado)
    if (PROBLEMATIC_PATTERNS.nonPrintable.test(content)) {
      issues.push('Patrones de caracteres no-imprimibles detectados');
    }

    // Verificar BOM UTF-8
    const hasBOM = content.charCodeAt(0) === 0xfeff;
    if (hasBOM) {
      issues.push('BOM UTF-8 detectado (debe ser eliminado)');
    }

    return issues;
  } catch (error) {
    return [`Error leyendo archivo: ${error.message}`];
  }
}

/**
 * Valida encoding de un directorio completo
 * @param {string} dirPath - Ruta del directorio a validar
 * @param {Array} extensions - Extensiones de archivo a validar (por defecto: js, ts, json, md)
 * @returns {Array} - Lista de issues encontrados por archivo
 */
function validateDirectory(dirPath, extensions = ['js', 'ts', 'json', 'md']) {
  const issues = [];

  try {
    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);

      // Ignorar archivos de documentación temporales que no son parte del análisis
      if (item.match(/^(ESTADO|FALLENCIAS).*\.md$/)) {
        continue;
      }

      if (stat.isFile() && extensions.some(ext => item.endsWith(`.${ext}`))) {
        const fileIssues = validateFile(fullPath);
        if (fileIssues.length > 0) {
          issues.push(`${fullPath}: ${fileIssues.join(', ')}`);
        }
      }
    }
  } catch (error) {
    issues.push(`Error procesando directorio ${dirPath}: ${error.message}`);
  }

  return issues;
}

/**
 * Función principal CLI - compatible con ambos scripts originales
 * @param {Array} args - Argumentos de línea de comandos
 * @param {Object} options - Opciones adicionales
 * @returns {number} - Exit code (0 para éxito, 1 para errores)
 */
function main(args = process.argv.slice(2), options = {}) {
  const targetPaths = args.length > 0 ? args : ['.'];
  const { verbose = false, simple = false } = options;

  let totalIssues = 0;

  for (const targetPath of targetPaths) {
    if (!fs.existsSync(targetPath)) {
      console.error(`❌ Ruta no encontrada: ${targetPath}`);
      continue;
    }

    const stat = fs.statSync(targetPath);
    let issues = [];

    if (stat.isDirectory()) {
      if (verbose) console.log(`🔍 Validando directorio: ${targetPath}`);
      issues = validateDirectory(targetPath);
    } else if (stat.isFile()) {
      if (verbose) console.log(`🔍 Validando archivo: ${targetPath}`);
      issues = validateFile(targetPath).map(issue => `${targetPath}: ${issue}`);
    }

    if (issues.length > 0) {
      totalIssues += issues.length;
      console.error(`❌ UTF-8 encoding validation failed for ${targetPath}:`);
      issues.forEach(issue => console.error(`   - ${issue}`));
    } else if (verbose) {
      console.log(`✅ UTF-8 encoding validation passed for ${targetPath}`);
    }
  }

  if (totalIssues > 0) {
    console.error('\n💡 Para corregir caracteres problemáticos:');
    console.error(
      '   tr -d "·" < archivo > archivo.limpio && mv archivo.limpio archivo'
    );

    if (simple) {
      console.error('   Reemplazar caracteres no-ASCII manualmente');
    }

    process.exit(1);
  }

  if (!verbose) {
    console.log('✅ UTF-8 encoding validation passed');
  }

  process.exit(0);
}

// Export para uso como módulo y compatibilidad CLI
module.exports = {
  validateFile,
  validateDirectory,
  main,
  PROBLEMATIC_PATTERNS
};

// Ejecutar como script si se llama directamente
if (require.main === module) {
  main();
}
