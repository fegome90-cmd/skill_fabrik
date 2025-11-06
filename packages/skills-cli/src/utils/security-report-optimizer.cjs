/**
 * Security Report Optimizer
 * Optimiza y comprime reportes de seguridad para mantenerlos bajo 100MB
 * Basado en secrets-and-config skill para manejo seguro de datos sensibles
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');

class SecurityReportOptimizer {
  constructor(options = {}) {
    this.maxReportSize = options.maxReportSize || 100 * 1024 * 1024; // 100MB
    this.compressionLevel = options.compressionLevel || 6;
    this.retentionDays = options.retentionDays || 30;
    this.optimizationStrategies = this.initializeOptimizationStrategies();
  }

  initializeOptimizationStrategies() {
    return {
      // Eliminar datos redundantes
      removeRedundancy: (report) => this.removeRedundantData(report),

      // Comprimir datos binarios y grandes
      compressLargeData: (report) => this.compressLargeObjects(report),

      // Sanitizar datos sensibles
      sanitizeSensitiveData: (report) => this.sanitizeSensitiveData(report),

      // Optimizar estructura JSON
      optimizeJSONStructure: (report) => this.optimizeJSONStructure(report),

      // Implementar paginación
      implementPagination: (report) => this.paginateLargeReport(report),

      // Caching inteligente
      implementSmartCaching: (report) => this.implementSmartCaching(report),

      // Eliminar logs antiguos
      cleanupOldLogs: (report) => this.cleanupOldLogs(report)
    };
  }

  /**
   * Optimiza un reporte de seguridad completo
   */
  async optimizeSecurityReport(reportPath, outputPath) {
    console.log(`🔧 Optimizing security report: ${reportPath}`);

    try {
      // Leer reporte original
      const originalReport = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
      const originalSize = fs.statSync(reportPath).size;

      console.log(`📊 Original size: ${this.formatBytes(originalSize)}`);

      // Aplicar estrategias de optimización
      let optimizedReport = { ...originalReport };
      const optimizationSteps = [];

      // 1. Eliminar datos redundantes
      optimizedReport = this.optimizationStrategies.removeRedundancy(optimizedReport);
      optimizationSteps.push('Redundancy removal');

      // 2. Sanitizar datos sensibles (secrets-and-config skill)
      optimizedReport = this.optimizationStrategies.sanitizeSensitiveData(optimizedReport);
      optimizationSteps.push('Sensitive data sanitization');

      // 3. Comprimir datos grandes
      optimizedReport = this.optimizationStrategies.compressLargeData(optimizedReport);
      optimizationSteps.push('Large data compression');

      // 4. Optimizar estructura JSON
      optimizedReport = this.optimizationStrategies.optimizeJSONStructure(optimizedReport);
      optimizationSteps.push('JSON structure optimization');

      // 5. Limpiar logs antiguos
      optimizedReport = this.optimizationStrategies.cleanupOldLogs(optimizedReport);
      optimizationSteps.push('Old logs cleanup');

      // Añadir metadatos de optimización
      optimizedReport.optimization = {
        timestamp: Date.now(),
        originalSize,
        strategies: optimizationSteps,
        compressed: true,
        version: '2.0.0'
      };

      // Guardar reporte optimizado
      const optimizedContent = JSON.stringify(optimizedReport, null, 2);
      fs.writeFileSync(outputPath, optimizedContent);

      const optimizedSize = fs.statSync(outputPath).size;
      const compressionRatio = ((originalSize - optimizedSize) / originalSize * 100).toFixed(2);

      console.log(`✅ Optimization completed:`);
      console.log(`   Original size: ${this.formatBytes(originalSize)}`);
      console.log(`   Optimized size: ${this.formatBytes(optimizedSize)}`);
      console.log(`   Compression: ${compressionRatio}%`);
      console.log(`   Strategies applied: ${optimizationSteps.join(', ')}`);

      return {
        success: true,
        originalSize,
        optimizedSize,
        compressionRatio: parseFloat(compressionRatio),
        strategies: optimizationSteps,
        outputPath
      };

    } catch (error) {
      console.error(`❌ Optimization failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Elimina datos redundantes del reporte
   */
  removeRedundantData(report) {
    const optimized = { ...report };

    // Eliminar duplicados en arrays
    if (optimized.findings) {
      optimized.findings = this.removeDuplicates(optimized.findings, 'id');
    }

    if (optimized.vulnerabilities) {
      optimized.vulnerabilities = this.removeDuplicates(optimized.vulnerabilities, 'id');
    }

    // Eliminar metadata redundante
    if (optimized.systemInfo && optimized.systemInfo.duplicateData) {
      delete optimized.systemInfo.duplicateData;
    }

    // Consolidar entradas de logs similares
    if (optimized.logs) {
      optimized.logs = this.consolidateLogs(optimized.logs);
    }

    return optimized;
  }

  /**
   * Comprime objetos grandes y datos binarios
   */
  compressLargeObjects(report) {
    const optimized = { ...report };

    // Comprimir screenshots y evidencia binaria
    if (optimized.evidence) {
      optimized.evidence = optimized.evidence.map(item => {
        if (item.type === 'screenshot' && item.data && item.data.length > 1024 * 100) { // > 100KB
          return {
            ...item,
            data: zlib.gzipSync(Buffer.from(item.data)).toString('base64'),
            compressed: true,
            originalSize: item.data.length
          };
        }
        return item;
      });
    }

    // Comprimir logs largos
    if (optimized.logs) {
      optimized.logs = optimized.logs.map(log => {
        if (log.message && log.message.length > 1024 * 10) { // > 10KB
          return {
            ...log,
            message: zlib.gzipSync(log.message).toString('base64'),
            compressed: true,
            originalSize: log.message.length
          };
        }
        return log;
      });
    }

    return optimized;
  }

  /**
   * Sanitiza datos sensibles basado en secrets-and-config skill
   */
  sanitizeSensitiveData(report) {
    const optimized = JSON.parse(JSON.stringify(report)); // Deep clone

    // Patrones de datos sensibles a detectar
    const sensitivePatterns = [
      /password["\s]*[:=]["\s]*[^"\s]+/gi,
      /secret["\s]*[:=]["\s]*[^"\s]+/gi,
      /token["\s]*[:=]["\s]*[^"\s]+/gi,
      /key["\s]*[:=]["\s]*[^"\s]+/gi,
      /api[_-]?key["\s]*[:=]["\s]*[^"\s]+/gi,
      /connection[_-]?string["\s]*[:=]["\s]*[^"\s]+/gi,
      /bearer\s+[a-zA-Z0-9\-._~+\/]+=*/gi,
      /sk_[a-zA-Z0-9]{24,}/g, // Stripe keys
      /[a-zA-Z0-9]{32,}/g // Large hex strings (potential keys)
    ];

    // Función recursiva para sanitizar objeto
    const sanitizeObject = (obj, path = '') => {
      if (typeof obj === 'string') {
        let sanitized = obj;
        sensitivePatterns.forEach(pattern => {
          sanitized = sanitized.replace(pattern, '[REDACTED_SENSITIVE_DATA]');
        });
        return sanitized;
      }

      if (Array.isArray(obj)) {
        return obj.map((item, index) => sanitizeObject(item, `${path}[${index}]`));
      }

      if (obj && typeof obj === 'object') {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
          // Omitir campos claramente sensibles
          if (this.isSensitiveField(key)) {
            sanitized[key] = '[REDACTED_SENSITIVE_FIELD]';
          } else {
            sanitized[key] = sanitizeObject(value, `${path}.${key}`);
          }
        }
        return sanitized;
      }

      return obj;
    };

    return sanitizeObject(optimized);
  }

  /**
   * Verifica si un campo es potencialmente sensible
   */
  isSensitiveField(fieldName) {
    const sensitiveFields = [
      'password', 'secret', 'token', 'key', 'credential',
      'auth', 'private', 'confidential', 'sensitive'
    ];

    return sensitiveFields.some(sensitive =>
      fieldName.toLowerCase().includes(sensitive)
    );
  }

  /**
   * Optimiza la estructura JSON para reducir tamaño
   */
  optimizeJSONStructure(report) {
    const optimized = { ...report };

    // Eliminar campos undefined o null
    const removeNullish = (obj) => {
      if (Array.isArray(obj)) {
        return obj.map(removeNullish).filter(val => val !== null && val !== undefined);
      }

      if (obj && typeof obj === 'object') {
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
          if (value !== null && value !== undefined) {
            result[key] = removeNullish(value);
          }
        }
        return result;
      }

      return obj;
    };

    // Acortar timestamps a formato compacto
    const compactTimestamps = (obj) => {
      if (obj && typeof obj === 'object') {
        for (const [key, value] of Object.entries(obj)) {
          if (key.includes('timestamp') && typeof value === 'number') {
            obj[key] = value; // Mantener como número para ahorrar espacio
          } else if (typeof value === 'object') {
            compactTimestamps(value);
          }
        }
      }
      return obj;
    };

    optimized = removeNullish(optimized);
    optimized = compactTimestamps(optimized);

    return optimized;
  }

  /**
   * Implementa paginación para reportes muy grandes
   */
  paginateLargeReport(report) {
    const serialized = JSON.stringify(report);

    if (serialized.length <= this.maxReportSize) {
      return report;
    }

    console.log(`📄 Report too large (${this.formatBytes(serialized.length)}), implementing pagination...`);

    // Dividir en páginas
    const pageSize = Math.floor(this.maxReportSize * 0.8); // Usar 80% del máximo
    const pages = [];

    // Estrategia simple: dividir findings y logs
    const paginatedReport = {
      ...report,
      paginated: true,
      totalPages: 0,
      currentPage: 1
    };

    // Mover datos grandes a archivos separados
    if (report.findings && report.findings.length > 100) {
      paginatedReport.findingsPage1 = report.findings.slice(0, 100);
      paginatedReport.totalFindings = report.findings.length;
      delete paginatedReport.findings;
    }

    if (report.logs && report.logs.length > 1000) {
      paginatedReport.logsPage1 = report.logs.slice(0, 1000);
      paginatedReport.totalLogs = report.logs.length;
      delete paginatedReport.logs;
    }

    return paginatedReport;
  }

  /**
   * Implementa caching inteligente para datos repetitivos
   */
  implementSmartCaching(report) {
    const optimized = { ...report };

    // Cache de patrones comunes
    const commonPatterns = new Map();

    // Reemplazar strings repetitivas con referencias
    const compressStrings = (obj) => {
      if (typeof obj === 'string' && obj.length > 50) {
        if (commonPatterns.has(obj)) {
          return { _ref: commonPatterns.get(obj) };
        } else {
          const ref = `str_${commonPatterns.size + 1}`;
          commonPatterns.set(obj, ref);
          return { _ref: ref, _value: obj };
        }
      }

      if (Array.isArray(obj)) {
        return obj.map(compressStrings);
      }

      if (obj && typeof obj === 'object') {
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
          result[key] = compressStrings(value);
        }
        return result;
      }

      return obj;
    };

    // Solo aplicar si hay suficientes patrones repetitivos
    if (this.hasRepetitiveData(report)) {
      optimized.stringCache = Array.from(commonPatterns.entries()).map(([value, ref]) => ({ ref, value }));
      optimized.compressedStrings = true;
    }

    return optimized;
  }

  /**
   * Limpia logs antiguos basado en retención
   */
  cleanupOldLogs(report) {
    const optimized = { ...report };
    const cutoffTime = Date.now() - (this.retentionDays * 24 * 60 * 60 * 1000);

    if (optimized.logs) {
      const originalCount = optimized.logs.length;
      optimized.logs = optimized.logs.filter(log =>
        log.timestamp > cutoffTime || log.level === 'error' || log.level === 'critical'
      );

      const removedCount = originalCount - optimized.logs.length;
      if (removedCount > 0) {
        console.log(`🧹 Cleaned up ${removedCount} old log entries`);
      }

      optimized.logCleanup = {
        timestamp: Date.now(),
        originalCount,
        remainingCount: optimized.logs.length,
        removedCount,
        retentionDays: this.retentionDays
      };
    }

    return optimized;
  }

  /**
   * Verifica si hay datos repetitivos
   */
  hasRepetitiveData(report) {
    const strings = this.extractStrings(report);
    const uniqueStrings = new Set(strings);
    return strings.length > uniqueStrings.size * 1.5; // 50% de repetición
  }

  /**
   * Extrae todas las strings de un objeto
   */
  extractStrings(obj, strings = []) {
    if (typeof obj === 'string' && obj.length > 20) {
      strings.push(obj);
    } else if (Array.isArray(obj)) {
      obj.forEach(item => this.extractStrings(item, strings));
    } else if (obj && typeof obj === 'object') {
      Object.values(obj).forEach(value => this.extractStrings(value, strings));
    }
    return strings;
  }

  /**
   * Elimina duplicados de un array basado en una clave
   */
  removeDuplicates(array, key) {
    const seen = new Set();
    return array.filter(item => {
      const id = item[key];
      if (seen.has(id)) {
        return false;
      }
      seen.add(id);
      return true;
    });
  }

  /**
   * Consolida logs similares
   */
  consolidateLogs(logs) {
    const consolidated = new Map();

    logs.forEach(log => {
      const key = `${log.level}:${log.message.substring(0, 100)}`;

      if (consolidated.has(key)) {
        const existing = consolidated.get(key);
        existing.count++;
        existing.lastOccurrence = Math.max(existing.lastOccurrence, log.timestamp);
        existing.examples = existing.examples.slice(0, 2); // Mantener solo 2 ejemplos
      } else {
        consolidated.set(key, {
          ...log,
          count: 1,
          lastOccurrence: log.timestamp,
          examples: [log]
        });
      }
    });

    return Array.from(consolidated.values());
  }

  /**
   * Formatea bytes para lectura humana
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Optimiza todos los reportes de seguridad en un directorio
   */
  async optimizeSecurityReportsDirectory(inputDir, outputDir) {
    console.log(`🔧 Optimizing security reports in directory: ${inputDir}`);

    if (!fs.existsSync(inputDir)) {
      throw new Error(`Input directory does not exist: ${inputDir}`);
    }

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const reportFiles = fs.readdirSync(inputDir)
      .filter(file => file.endsWith('.json'))
      .filter(file => file.includes('security') || file.includes('report'));

    const results = [];

    for (const file of reportFiles) {
      const inputPath = path.join(inputDir, file);
      const outputPath = path.join(outputDir, file);

      console.log(`\n📄 Processing: ${file}`);
      const result = await this.optimizeSecurityReport(inputPath, outputPath);
      results.push({ file, ...result });
    }

    // Generar resumen
    const totalOriginalSize = results.reduce((sum, r) => sum + (r.originalSize || 0), 0);
    const totalOptimizedSize = results.reduce((sum, r) => sum + (r.optimizedSize || 0), 0);
    const totalCompressionRatio = totalOriginalSize > 0
      ? ((totalOriginalSize - totalOptimizedSize) / totalOriginalSize * 100).toFixed(2)
      : 0;

    console.log(`\n📊 Directory Optimization Summary:`);
    console.log(`   Files processed: ${results.length}`);
    console.log(`   Total original size: ${this.formatBytes(totalOriginalSize)}`);
    console.log(`   Total optimized size: ${this.formatBytes(totalOptimizedSize)}`);
    console.log(`   Total compression: ${totalCompressionRatio}%`);

    return {
      files: results.length,
      totalOriginalSize,
      totalOptimizedSize,
      totalCompressionRatio: parseFloat(totalCompressionRatio),
      results
    };
  }

  /**
   * Genera un reporte de optimización
   */
  generateOptimizationReport(results) {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalFiles: results.length,
        totalOriginalSize: results.totalOriginalSize,
        totalOptimizedSize: results.totalOptimizedSize,
        totalCompressionRatio: results.totalCompressionRatio,
        targetSize: this.maxReportSize,
        targetAchieved: results.totalOptimizedSize <= this.maxReportSize
      },
      details: results.results,
      recommendations: this.generateRecommendations(results)
    };

    return report;
  }

  /**
   * Genera recomendaciones basadas en resultados
   */
  generateRecommendations(results) {
    const recommendations = [];

    if (results.totalCompressionRatio < 20) {
      recommendations.push({
        priority: 'MEDIUM',
        type: 'COMPRESSION',
        message: 'Low compression ratio achieved. Consider more aggressive optimization strategies.',
        actionItems: [
          'Implement data deduplication',
          'Use binary compression for large objects',
          'Remove unnecessary metadata'
        ]
      });
    }

    const largeFiles = results.results.filter(r => r.optimizedSize > 50 * 1024 * 1024); // > 50MB
    if (largeFiles.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        type: 'FILE_SIZE',
        message: `${largeFiles.length} files are still larger than 50MB.`,
        actionItems: [
          'Implement pagination for large reports',
          'Archive old data separately',
          'Consider data retention policies'
        ]
      });
    }

    if (results.totalOptimizedSize > this.maxReportSize) {
      recommendations.push({
        priority: 'HIGH',
        type: 'SIZE_LIMIT',
        message: 'Total size exceeds 100MB limit.',
        actionItems: [
          'Implement automatic cleanup',
          'Use external storage for archives',
          'Reduce retention period'
        ]
      });
    }

    return recommendations;
  }
}

module.exports = SecurityReportOptimizer;