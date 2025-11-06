/**
 * Simplified Security Report Optimizer
 * Versión simplificada para optimizar reportes de seguridad
 * Basado en secrets-and-config skill
 */

const fs = require('fs');
const zlib = require('zlib');

class SimpleSecurityOptimizer {
  constructor(options = {}) {
    this.maxReportSize = options.maxReportSize || 100 * 1024 * 1024; // 100MB
  }

  /**
   * Optimiza un reporte de seguridad
   */
  async optimizeReport(inputPath, outputPath) {
    try {
      console.log(`🔧 Optimizing: ${inputPath}`);

      // Leer reporte original
      const originalReport = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
      const originalSize = fs.statSync(inputPath).size;

      // Optimización básica
      const optimized = {
        ...originalReport,
        // Eliminar datos grandes
        logs: this.compressLogs(originalReport.logs || []),
        // Sanitizar datos sensibles
        findings: this.sanitizeFindings(originalReport.findings || []),
        // Eliminar duplicados
        vulnerabilities: this.removeDuplicates(originalReport.vulnerabilities || [])
      };

      // Guardar optimizado
      const optimizedContent = JSON.stringify(optimized, null, 2);
      fs.writeFileSync(outputPath, optimizedContent);

      const optimizedSize = fs.statSync(outputPath).size;
      const compressionRatio = ((originalSize - optimizedSize) / originalSize * 100).toFixed(2);

      console.log(`✅ Optimized:`);
      console.log(`   Original: ${this.formatBytes(originalSize)}`);
      console.log(`   Optimized: ${this.formatBytes(optimizedSize)}`);
      console.log(`   Compression: ${compressionRatio}%`);
      console.log(`   Under 100MB: ${optimizedSize <= this.maxReportSize ? '✅ YES' : '❌ NO'}`);

      return {
        success: true,
        originalSize,
        optimizedSize,
        compressionRatio: parseFloat(compressionRatio),
        underLimit: optimizedSize <= this.maxReportSize
      };

    } catch (error) {
      console.error(`❌ Optimization failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  compressLogs(logs) {
    if (!logs || logs.length === 0) return [];

    return logs.map(log => {
      if (log.message && log.message.length > 1000) {
        return {
          ...log,
          message: '[COMPRESSED] ' + zlib.gzipSync(log.message).toString('base64').substring(0, 100) + '...',
          originalLength: log.message.length
        };
      }
      return log;
    });
  }

  sanitizeFindings(findings) {
    if (!findings || findings.length === 0) return [];

    return findings.map(finding => ({
      ...finding,
      evidence: finding.evidence ?
        finding.evidence.replace(/password["\s]*[:=]["\s]*[^"\s]+/gi, '[REDACTED_PASSWORD]')
                   .replace(/secret["\s]*[:=]["\s]*[^"\s]+/gi, '[REDACTED_SECRET]')
                   .replace(/api[_-]?key["\s]*[:=]["\s]*[^"\s]+/gi, '[REDACTED_API_KEY]')
        : finding.evidence
    }));
  }

  removeDuplicates(items) {
    const seen = new Set();
    return items.filter(item => {
      const key = item.id || JSON.stringify(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

module.exports = SimpleSecurityOptimizer;