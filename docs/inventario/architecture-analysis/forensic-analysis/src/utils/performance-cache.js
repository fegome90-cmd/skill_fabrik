/**
 * Sistema de cache para optimizar rendimiento de validaciones
 * Implementa cache LRU con TTL para evitar procesamiento repetido
 */

const fs = require('fs');

// Constants - Clean Code: Eliminar magic numbers
const DEFAULT_CACHE_SIZE = 100;
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutos por defecto
const THIRTY_SECONDS_MS = 30 * 1000;
const ONE_MINUTE_MS = 60 * 1000;
const FIVE_MINUTES_SECONDS = 300; // 5 minutos para maxAge
const TEN_MINUTES_MS = 10 * 60 * 1000;
const GLOBAL_CACHE_SIZE = 200;
const MS_TO_SECONDS_DIVISOR = 1000; // Conversión de milisegundos a segundos
const BATCH_CACHE_SIZE = 50; // Tamaño específico para BatchOperations
const BATCH_TTL_MS = 5 * 60 * 1000; // 5 minutos TTL para BatchOperations

class PerformanceCache {
  constructor(options = {}) {
    this.cache = new Map();
    this.maxSize = options.maxSize || DEFAULT_CACHE_SIZE;
    this.ttl = options.ttl || DEFAULT_TTL_MS;
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Genera key para cache basado en parámetros
   * @param {string} type - Tipo de operación
   * @param {Array} params - Parámetros para generar key
   * @returns {string} - Key única para cache
   */
  generateKey(type, params) {
    const sortedParams = params
      .map(p => (typeof p === 'object' ? JSON.stringify(p) : p.toString()))
      .sort()
      .join('|');
    return `${type}:${sortedParams}`;
  }

  /**
   * Obtiene valor del cache si está disponible y no ha expirado
   * @param {string} type - Tipo de operación
   * @param {Array} params - Parámetros de la operación
   * @returns {any|null} - Valor cacheado o null
   */
  get(type, params) {
    const key = this.generateKey(type, params);
    const cached = this.cache.get(key);

    if (!cached) {
      this.misses++;
      return null;
    }

    const now = Date.now();
    if (now - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return cached.value;
  }

  /**
   * Almacena valor en cache con timestamp
   * @param {string} type - Tipo de operación
   * @param {Array} params - Parámetros de la operación
   * @param {any} value - Valor a cachear
   */
  set(type, params, value) {
    const key = this.generateKey(type, params);

    // Evitar que expire inmediatamente
    if (typeof value === 'object' && value !== null) {
      // Deep clone para evitar referencias
      value = JSON.parse(JSON.stringify(value));
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });

    // Implementar LRU: eliminar el más antiguo si excede tamaño máximo
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  /**
   * Elimina entrada específica del cache
   * @param {string} type - Tipo de operación
   * @param {Array} params - Parámetros de la operación
   * @returns {boolean} - True si se eliminó la entrada
   */
  delete(type, params) {
    const key = this.generateKey(type, params);
    return this.cache.delete(key);
  }

  /**
   * Limpia todo el cache
   */
  clear() {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Obtiene estadísticas del cache
   * @returns {Object} - Estadísticas de uso
   */
  getStats() {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? ((this.hits / total) * 100).toFixed(2) : '0.00';

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: `${hitRate}%`,
      ttl: this.ttl
    };
  }

  /**
   * Función memoizada wrapper para cualquier función
   * @param {Function} fn - Función a memoizar
   * @param {number} ttl - TTL específico para esta función
   * @returns {Function} - Función memoizada
   */
  memoize(fn, ttl) {
    return (...args) => {
      const cacheKey = ['memoized', fn.name, JSON.stringify(args)];
      let result = this.get('memoize', cacheKey);

      if (result === null) {
        result = fn(...args);

        // Guardar con TTL específico o por defecto
        this.set('memoize', cacheKey, result, ttl);
      }

      return result;
    };
  }
}

/**
 * Cache global singleton para toda la aplicación
 */
const globalCache = new PerformanceCache({
  maxSize: GLOBAL_CACHE_SIZE,
  ttl: TEN_MINUTES_MS
});

/**
 * Funciones memoizadas comúnmente usadas
 */
const memoizedFileRead = globalCache.memoize(
  fs.readFileSync,
  THIRTY_SECONDS_MS
);
const memoizedFileExists = globalCache.memoize(fs.existsSync, ONE_MINUTE_MS);
const memoizedReadJson = globalCache.memoize(filePath => {
  const content = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(content);
}, ONE_MINUTE_MS);

/**
 * Función para cachear análisis de archivos
 * @param {string} filePath - Ruta del archivo
 * @param {number} maxAge - Edad máxima del archivo en segundos
 * @returns {Object} - Metadatos del archivo cacheados
 */
function cacheFileMetadata(filePath, maxAge = FIVE_MINUTES_SECONDS) {
  const cacheKey = ['file-metadata', filePath];
  let cached = globalCache.get('file-metadata', cacheKey);

  if (cached === null) {
    try {
      const stats = fs.statSync(filePath);
      cached = {
        exists: true,
        size: stats.size,
        mtime: stats.mtime.getTime(),
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory()
      };
      globalCache.set('file-metadata', cacheKey, cached);
    } catch (error) {
      cached = { exists: false, error: error.message };
      // No cachear errores, solo éxito
    }
  }

  // Verificar si el archivo es demasiado antiguo
  if (cached.exists && cached.isFile) {
    const age = (Date.now() - cached.mtime) / MS_TO_SECONDS_DIVISOR;
    if (age > maxAge) {
      globalCache.delete('file-metadata', cacheKey);
      cached.exists = false;
    }
  }

  return cached;
}

/**
 * Batch operations con cache
 */
class BatchOperations {
  constructor() {
    this.cache = new PerformanceCache({
      maxSize: BATCH_CACHE_SIZE,
      ttl: BATCH_TTL_MS
    });
  }

  /**
   * Lee múltiples archivos en batch usando cache
   * @param {Array} filePaths - Array de rutas de archivos
   * @returns {Object} - Resultados cacheados
   */
  async batchReadFiles(filePaths) {
    const results = {};
    const uncachedFiles = [];

    // Verificar cache primero
    filePaths.forEach(filePath => {
      const cached = globalCache.get('file-read', [filePath]);
      if (cached !== null) {
        results[filePath] = { content: cached, cached: true };
      } else {
        uncachedFiles.push(filePath);
      }
    });

    // Leer archivos no cacheados
    if (uncachedFiles.length > 0) {
      for (const filePath of uncachedFiles) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          results[filePath] = { content, cached: false };
          globalCache.set('file-read', [filePath], content);
        } catch (error) {
          results[filePath] = { error: error.message, cached: false };
        }
      }
    }

    return results;
  }

  /**
   * Valida múltiples archivos en batch
   * @param {Array} filePaths - Array de rutas de archivos
   * @returns {Object} - Resultados de validación
   */
  batchValidateFiles(filePaths) {
    const results = {};

    filePaths.forEach(filePath => {
      const metadata = cacheFileMetadata(filePath);
      results[filePath] = {
        exists: metadata.exists,
        size: metadata.size,
        cached: true
      };
    });

    return results;
  }
}

module.exports = {
  PerformanceCache,
  globalCache,
  memoizedFileRead,
  memoizedFileExists,
  memoizedReadJson,
  cacheFileMetadata,
  BatchOperations,
  memoize: globalCache.memoize.bind(globalCache)
};
