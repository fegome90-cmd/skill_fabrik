#!/usr/bin/env node

/**
 * Utilidades consolidadas para validación
 * Funciones comunes usadas por multiple scripts de validación
 */

const fs = require('fs');
const path = require('path');
const { memoizedReadJson, cacheFileMetadata } = require('./performance-cache');

/**
 * Componentes críticos que deben ser consistentes entre fases
 * Centralizados para evitar duplicación
 */
const CRITICAL_COMPONENTS = {
  daemon: 'packages/daemon/src/',
  router: 'packages/router/src/',
  'skills-cli': 'packages/skills-cli/src/',
  mcp: 'mcp/'
};

/**
 * Lee y parsea un archivo JSON con manejo de errores
 * @param {string} filePath - Ruta del archivo JSON
 * @returns {Object|null} - Objeto parseado o null si hay error
 */
function readJsonFile(filePath) {
  return memoizedReadJson(filePath);
}

/**
 * Verifica existencia de archivo con cache y logging opcional
 * @param {string} filePath - Ruta del archivo a verificar
 * @param {boolean} verbose - Si debe mostrar logs
 * @returns {boolean} - True si el archivo existe
 */
function fileExists(filePath, verbose = false) {
  const metadata = cacheFileMetadata(filePath);
  const exists = metadata.exists;

  if (verbose && !exists) {
    console.warn(`⚠️  Archivo no encontrado: ${filePath}`);
  }

  return exists;
}

/**
 * Lee contenido de archivo con manejo de errores
 * @param {string} filePath - Ruta del archivo
 * @param {string} encoding - Encoding (por defecto 'utf8')
 * @returns {string|null} - Contenido del archivo o null si hay error
 */
function readFileContent(filePath, encoding = 'utf8') {
  try {
    return fs.readFileSync(filePath, encoding);
  } catch (error) {
    console.error(`Error leyendo archivo ${filePath}: ${error.message}`);
    return null;
  }
}

/**
 * Valida si un archivo Markdown contiene una métrica específica
 * @param {string} filePath - Ruta del archivo MD
 * @param {string} component - Nombre del componente
 * @param {string} size - Métrica esperada
 * @returns {boolean} - True si contiene la métrica
 */
function hasMetricInMarkdown(filePath, component, size) {
  const content = readFileContent(filePath);
  if (!content) return false;

  const hasComponent = content.toLowerCase().includes(component);
  const hasSize = content.includes(size);

  return hasComponent && hasSize;
}

/**
 * Busca archivos en directorio con filtrado
 * @param {string} dirPath - Ruta del directorio
 * @param {string} pattern - Patrón de nombre de archivo
 * @returns {Array} - Array de rutas de archivos encontrados
 */
function findFilesByPattern(dirPath, pattern) {
  try {
    const files = fs.readdirSync(dirPath);
    return files
      .filter(file => file.includes(pattern))
      .map(file => path.join(dirPath, file));
  } catch (error) {
    console.error(`Error leyendo directorio ${dirPath}: ${error.message}`);
    return [];
  }
}

/**
 * Cuenta archivos por tipo en un directorio
 * @param {string} dirPath - Ruta del directorio
 * @param {Array} extensions - Extensiones a contar
 * @returns {Object} - Conteo por extensión
 */
function countFilesByType(dirPath, extensions = ['js', 'ts', 'json', 'md']) {
  const counts = {};

  extensions.forEach(ext => {
    counts[ext] = 0;
  });

  try {
    const files = fs.readdirSync(dirPath);
    files.forEach(file => {
      const ext = file.split('.').pop();
      if (extensions.includes(ext)) {
        counts[ext]++;
      }
    });
  } catch (error) {
    console.error(`Error contando archivos en ${dirPath}: ${error.message}`);
  }

  return counts;
}

/**
 * Genera reporte de validación estandarizado
 * @param {string} title - Título del reporte
 * @param {Array} issues - Lista de issues encontrados
 * @param {Object} metrics - Métricas adicionales
 * @returns {string} - Reporte formateado
 */
function generateValidationReport(title, issues, metrics = {}) {
  let report = `\n## ${title}\n`;

  if (issues.length === 0) {
    report += '✅ No se encontraron problemas\n';
  } else {
    report += `❌ Se encontraron ${issues.length} problemas:\n`;
    issues.forEach((issue, index) => {
      report += `   ${index + 1}. ${issue}\n`;
    });
  }

  if (Object.keys(metrics).length > 0) {
    report += '\n📊 Métricas:\n';
    Object.entries(metrics).forEach(([key, value]) => {
      report += `   - ${key}: ${value}\n`;
    });
  }

  return report;
}

/**
 * Función de logging centralizada
 * @param {string} level - Nivel de log (info, warn, error)
 * @param {string} message - Mensaje
 * @param {boolean} verbose - Si debe mostrar el log
 */
function log(level, message, verbose = true) {
  if (!verbose) return;

  const icons = {
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌',
    success: '✅'
  };

  console.log(`${icons[level] || '📋'} ${message}`);
}

// Exportar todas las utilidades
module.exports = {
  CRITICAL_COMPONENTS,
  readJsonFile,
  fileExists,
  readFileContent,
  hasMetricInMarkdown,
  findFilesByPattern,
  countFilesByType,
  generateValidationReport,
  log
};
