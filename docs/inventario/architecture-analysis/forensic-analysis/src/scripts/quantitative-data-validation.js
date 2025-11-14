#!/usr/bin/env node

/**
 * Script Obligatorio: Validación de Datos Cuantitativos
 *
 * Este script está diseñado para ser usado OBLIGATORIAMENTE por todos los agentes
 * para validar que todos los datos numéricos sean verificables y reproducibles.
 *
 * Regla: MAX-015 (integridad_datos_cuantitativos)
 * Obligación: OBL-007 (VERIFICAR TODOS los datos numéricos con ejecución obligatoria)
 * Quality Gate: QG-011 (data_freshness)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class QuantitativeDataValidator {
  constructor(options = {}) {
    this.targetPath = options.targetPath || process.cwd();
    this.maxAgeMinutes = options.maxAgeMinutes || 5;
    this.timestamp = new Date().toISOString();
    this.validationResults = [];
    this.metrics = {
      total_data_points: 0,
      verified_data_points: 0,
      stale_data_points: 0,
      reproducibility_errors: 0,
      cache_violations: 0
    };
  }

  /**
   * Verifica si un dato es "fresco" (máximo maxAge minutos de antigüedad)
   */
  isDataFresh(dataTimestamp) {
    if (!dataTimestamp) {
      this.metrics.stale_data_points++;
      return false;
    }

    const dataAge = Date.now() - new Date(dataTimestamp).getTime();
    const maxAgeMs = this.maxAgeMinutes * 60 * 1000;

    if (dataAge > maxAgeMs) {
      this.metrics.stale_data_points++;
      this.logValidation(
        'warn',
        `❌ Datos desactualizados: ${dataAge}ms > ${maxAgeMs}ms`
      );
      return false;
    }

    return true;
  }

  /**
   * Ejecuta comando de verificación y valida reproducibilidad
   */
  verifyDataPoint(command, expectedValue, dataPoint) {
    this.metrics.total_data_points++;

    try {
      // Ejecutar comando real
      const startTime = Date.now();
      const actualValue = execSync(command, {
        encoding: 'utf8',
        cwd: this.targetPath,
        timeout: 15000 // 15 segundos timeout
      }).trim();

      const duration = Date.now() - startTime;

      // Validar reproducibilidad
      if (actualValue !== expectedValue) {
        this.metrics.reproducibility_errors++;
        const error = {
          command,
          expected: expectedValue,
          actual: actualValue,
          dataPoint,
          timestamp: this.timestamp,
          error: 'Non-reproducible result',
          success: false
        };

        this.logValidation(
          'error',
          `❌ No reproducible: ${expectedValue} ≠ ${actualValue}`
        );
        this.validationResults.push(error);
        return { success: false, error };
      }

      this.metrics.verified_data_points++;
      const success = {
        command,
        value: actualValue,
        dataPoint,
        timestamp: this.timestamp,
        duration,
        success: true,
        fresh: true
      };

      this.logValidation(
        'success',
        `✅ Verificado: ${dataPoint} = ${actualValue}`
      );
      this.validationResults.push(success);

      return { success: true, value: actualValue };
    } catch (error) {
      this.metrics.reproducibility_errors++;
      const failure = {
        command,
        expected: expectedValue,
        dataPoint,
        timestamp: this.timestamp,
        error: error.message,
        success: false
      };

      this.logValidation(
        'error',
        `❌ Error ejecutando comando: ${error.message}`
      );
      this.validationResults.push(failure);

      return { success: false, error: error.message };
    }
  }

  /**
   * Extrae datos cuantitativos de un informe y los valida contra comandos reales
   */
  validateReportData(reportPath) {
    if (!fs.existsSync(reportPath)) {
      throw new Error(`Report file no existe: ${reportPath}`);
    }

    const content = fs.readFileSync(reportPath, 'utf8');

    // Patrones para extraer datos cuantitativos comunes
    const patterns = [
      {
        regex: /daemon.*?(\d+KB|\d+MB|\d+GB)/gi,
        command:
          'du -sh /packages/daemon/src/ 2>/dev/null | cut -f1 || echo "N/A"',
        description: 'Tamaño daemon'
      },
      {
        regex: /router.*?(\d+KB|\d+MB|\d+GB)/gi,
        command:
          'du -sh /packages/router/src/ 2>/dev/null | cut -f1 || echo "N/A"',
        description: 'Tamaño router'
      },
      {
        regex: /skills-cli.*?(\d+KB|\d+MB|\d+GB)/gi,
        command:
          'du -sh /packages/skills-cli/src/ 2>/dev/null | cut -f1 || echo "N/A"',
        description: 'Tamaño skills-cli'
      },
      {
        regex: /(\d+)\s*test(s)?/gi,
        command: 'find . -name "*.test.*" -o -name "*.spec.*" | wc -l',
        description: 'Conteo tests'
      },
      {
        regex: /(\d+)\s*skill(s)?/gi,
        command: 'find /skills -name "SKILL.md" | wc -l',
        description: 'Conteo skills'
      },
      {
        regex: /(\d+)\s*package(s)?/gi,
        command: 'find /packages -name "package.json" | wc -l',
        description: 'Conteo packages'
      }
    ];

    const validationSummary = {
      reportPath,
      totalPatterns: patterns.length,
      validMatches: 0,
      invalidMatches: 0,
      results: []
    };

    for (const pattern of patterns) {
      const matches = content.match(pattern.regex);
      if (!matches || matches.length === 0) {
        this.logValidation(
          'warn',
          `⚠️ No se encontraron coincidencias para: ${pattern.description}`
        );
        continue;
      }

      // Tomar el primer match significativo
      const match = matches[0];
      const expectedValue = match.match(/(\d+KB|\d+MB|\d+GB|\d+)/i)?.[1];

      if (!expectedValue) {
        this.logValidation('warn', `⚠️ No se pudo extraer valor de: ${match}`);
        continue;
      }

      const result = this.verifyDataPoint(
        pattern.command,
        expectedValue,
        pattern.description
      );

      validationSummary.results.push({
        pattern: pattern.description,
        command: pattern.command,
        expected: expectedValue,
        ...result
      });

      if (result.success) {
        validationSummary.validMatches++;
      } else {
        validationSummary.invalidMatches++;
      }
    }

    return validationSummary;
  }

  /**
   * Valida frescura de datos cacheados si existen
   */
  validateCacheFreshness(cacheDir = './.cache') {
    if (!fs.existsSync(cacheDir)) {
      this.logValidation('info', '📂 No hay directorio cache para validar');
      return { valid: true, files: [] };
    }

    const files = fs.readdirSync(cacheDir);
    const cacheValidation = {
      files: [],
      freshFiles: 0,
      staleFiles: 0
    };

    const now = Date.now();

    for (const file of files) {
      const filePath = path.join(cacheDir, file);
      const stats = fs.statSync(filePath);
      const ageMinutes = (now - stats.mtime.getTime()) / (1000 * 60);

      const isFresh = ageMinutes <= this.maxAgeMinutes;
      const fileInfo = {
        name: file,
        ageMinutes: Math.round(ageMinutes * 100) / 100,
        isFresh,
        lastModified: stats.mtime.toISOString()
      };

      cacheValidation.files.push(fileInfo);

      if (isFresh) {
        cacheValidation.freshFiles++;
      } else {
        cacheValidation.staleFiles++;
        this.metrics.cache_violations++;
        this.logValidation(
          'warn',
          `⚠️ Archivo cache desactualizado: ${file} (${ageMinutes.toFixed(1)} minutos)`
        );
      }
    }

    return {
      valid: cacheValidation.staleFiles === 0,
      ...cacheValidation
    };
  }

  /**
   * Genera reporte completo de validación
   */
  generateReport() {
    const report = {
      timestamp: this.timestamp,
      targetPath: this.targetPath,
      maxAgeMinutes: this.maxAgeMinutes,
      summary: {
        total_data_points: this.metrics.total_data_points,
        verified_data_points: this.metrics.verified_data_points,
        stale_data_points: this.metrics.stale_data_points,
        reproducibility_errors: this.metrics.reproducibility_errors,
        cache_violations: this.metrics.cache_violations,
        success_rate:
          this.metrics.total_data_points > 0
            ? (
              (this.metrics.verified_data_points /
                  this.metrics.total_data_points) *
                100
            ).toFixed(2) + '%'
            : '0%'
      },
      validation_results: this.validationResults,
      compliance: {
        MAX_015_compliant: this.metrics.reproducibility_errors === 0,
        OBL_007_compliant: this.metrics.verified_data_points > 0,
        QG_011_ready:
          this.metrics.stale_data_points === 0 &&
          this.metrics.cache_violations === 0
      }
    };

    return report;
  }

  /**
   * Guarda reporte en archivo JSON con timestamp
   */
  saveReport(outputDir = './reports') {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const report = this.generateReport();
    const filename = `quantitative-validation-${Date.now()}.json`;
    const filepath = path.join(outputDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
    this.logValidation('info', `📄 Reporte guardado en: ${filepath}`);

    return filepath;
  }

  /**
   * Método principal de validación
   */
  async validate(reportPaths = []) {
    this.logValidation(
      'info',
      '🚀 Iniciando validación obligatoria de datos cuantitativos...'
    );

    try {
      const results = {
        reportValidations: [],
        cacheValidation: null
      };

      // 1. Validar datos de cada reporte
      for (const reportPath of reportPaths) {
        try {
          const reportValidation = this.validateReportData(reportPath);
          results.reportValidations.push(reportValidation);
          this.logValidation('info', `📋 Validado reporte: ${reportPath}`);
        } catch (error) {
          this.logValidation(
            'error',
            `❌ Error validando reporte ${reportPath}: ${error.message}`
          );
          results.reportValidations.push({
            reportPath,
            error: error.message,
            success: false
          });
        }
      }

      // 2. Validar frescura de cache
      results.cacheValidation = this.validateCacheFreshness();

      // 3. Generar y guardar reporte
      const reportPath = this.saveReport();

      // 4. Validar compliance con reglas obligatorias
      if (
        this.metrics.reproducibility_errors > 0 ||
        this.metrics.cache_violations > 0
      ) {
        throw new Error(
          `Violaciones detectadas: ${this.metrics.reproducibility_errors} errores de reproducibilidad, ${this.metrics.cache_violations} violaciones de cache`
        );
      }

      this.logValidation(
        'success',
        '✅ Validación de datos cuantitativos completada exitosamente'
      );
      return {
        ...results,
        reportPath,
        metrics: this.metrics
      };
    } catch (error) {
      this.logValidation(
        'error',
        `❌ Falló validación de datos cuantitativos: ${error.message}`
      );

      // Generar reporte de error
      const reportPath = this.saveReport();

      throw error;
    }
  }

  /**
   * Método de logging con timestamps
   */
  logValidation(level, message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    console.log(logMessage);
  }
}

// Ejecución principal
if (require.main === module) {
  const args = process.argv.slice(2);
  const reportPaths =
    args.length > 0
      ? args
      : [
        './consolidated-reports/phase-a-inventory.md',
        './consolidated-reports/phase-b-responsibilities.md',
        './consolidated-reports/phase-c-testing.md'
      ];

  const validator = new QuantitativeDataValidator();

  validator
    .validate(reportPaths)
    .then(result => {
      console.log('\n✅ VALIDACIÓN DE DATOS CUANTITATIVOS COMPLETADA');
      console.log(
        `📊 Datos verificados: ${result.metrics.verified_data_points}/${result.metrics.total_data_points}`
      );
      console.log(
        `📊 Errores de reproducibilidad: ${result.metrics.reproducibility_errors}`
      );
      console.log(
        `📊 Violaciones de cache: ${result.metrics.cache_violations}`
      );
      console.log(`📄 Reporte guardado en: ${result.reportPath}`);
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ FALLÓ VALIDACIÓN DE DATOS CUANTITATIVOS');
      console.error(`Error: ${error.message}`);
      console.error(
        '❌ Esto viola MAX-015 y OBL-007 - el agente debe corregir antes de continuar'
      );
      process.exit(1);
    });
}

module.exports = { QuantitativeDataValidator };
