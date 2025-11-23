#!/usr/bin/env node

/**
 * Consistency Validator - Script Obligatorio
 *
 * Valida consistencia cruzada entre documentos y contra estado real del repositorio
 * Cumple con:
 * - PROH-009: NO tener inconsistencias de métricas entre informes y fases
 * - OBL-008: Validación cruzada dinámica entre todas las fases
 * - MAX-007: Verificación dinámica contra estado actual del repositorio
 * - QG-010: VERIFICACIÓN OBLIGATORIA de existencia y estado real
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const {
  readFileContent,
  findFilesByPattern,
  log
} = require('./validation-helpers');

class ConsistencyValidator {
  constructor(reportsDir = './dev-docs') {
    this.reportsDir = reportsDir;
    this.timestamp = new Date().toISOString();
    this.inconsistencies = [];
    this.warnings = [];
    this.documentMetrics = {};
  }

  /**
   * Extrae métricas cuantitativas de un documento
   */
  extractMetricsFromDocument(filePath) {
    const content = readFileContent(filePath);
    if (!content) {
      this.log('error', `No se pudo leer el archivo: ${filePath}`);
      return null;
    }

    const metrics = {
      componentSizes: {},
      fileCounts: {},
      configuration: {},
      hardcodedValues: []
    };

    // Patrones para extraer métricas
    const patterns = {
      componentSize: /([a-zA-Z-]+\/[^()]*)\s*\(([^)]+)\)/g,
      fileCount: /(\d+)\s*(archivos?|files?|documentos?)/gi,
      configurationSize: /(\w+\.(json|yaml|yml|toml))\s*\(([^)]+)\)/g,
      hardcodedMetric: /\((\d+[KMGT]?B)\)/g,
      skillCount: /(\d+)\s*skills?/gi,
      packageCount: /(\d+)\s*packages?/gi
    };

    // Extraer tamaños de componentes
    let match;
    while ((match = patterns.componentSize.exec(content)) !== null) {
      const component = match[1].trim();
      const size = match[2].trim();
      metrics.componentSizes[component] = size;
    }

    // Extraer conteos de archivos
    while ((match = patterns.fileCount.exec(content)) !== null) {
      const count = parseInt(match[1]);
      const type = match[2];
      metrics.fileCounts[type] = count;
    }

    // Extraer configuraciones
    while ((match = patterns.configurationSize.exec(content)) !== null) {
      const configFile = match[1];
      const size = match[2];
      metrics.configuration[configFile] = size;
    }

    // Detectar valores hardcodeados
    while ((match = patterns.hardcodedMetric.exec(content)) !== null) {
      metrics.hardcodedValues.push({
        value: match[1],
        context: this.getContextAroundMatch(content, match.index),
        line: this.getLineNumber(content, match.index)
      });
    }

    // Extraer conteos específicos
    while ((match = patterns.skillCount.exec(content)) !== null) {
      metrics.skillCount = parseInt(match[1]);
    }

    while ((match = patterns.packageCount.exec(content)) !== null) {
      metrics.packageCount = parseInt(match[1]);
    }

    this.documentMetrics[path.basename(filePath)] = metrics;
    return metrics;
  }

  getContextAroundMatch(content, index, contextLength = 50) {
    const start = Math.max(0, index - contextLength);
    const end = Math.min(content.length, index + contextLength);
    return content.substring(start, end);
  }

  getLineNumber(content, index) {
    const textBeforeIndex = content.substring(0, index);
    return textBeforeIndex.split('\n').length;
  }

  /**
   * Obtiene métricas reales del repositorio usando comandos obligatorios
   */
  getRealRepositoryMetrics() {
    this.log('info', 'Obteniendo métricas reales del repositorio...');

    const realMetrics = {
      componentSizes: {},
      fileCounts: {},
      configuration: {}
    };

    try {
      // Tamaños reales de componentes
      const components = [
        {
          name: 'daemon',
          path: 'packages/daemon/src/',
          command:
            'du -sh packages/daemon/src/ 2>/dev/null | cut -f1 || echo "N/A"'
        },
        {
          name: 'router',
          path: 'packages/router/src/',
          command:
            'du -sh packages/router/src/ 2>/dev/null | cut -f1 || echo "N/A"'
        },
        {
          name: 'skills-cli',
          path: 'packages/skills-cli/src/',
          command:
            'du -sh packages/skills-cli/src/ 2>/dev/null | cut -f1 || echo "N/A"'
        },
        {
          name: 'mcp',
          path: 'mcp/',
          command: 'du -sh mcp/ 2>/dev/null | cut -f1 || echo "N/A"'
        },
        {
          name: 'skills',
          path: 'skills/',
          command: 'du -sh skills/ 2>/dev/null | cut -f1 || echo "N/A"'
        },
        {
          name: 'docs',
          path: 'docs/',
          command: 'du -sh docs/ 2>/dev/null | cut -f1 || echo "N/A"'
        }
      ];

      components.forEach(component => {
        try {
          const result = execSync(component.command, {
            encoding: 'utf8'
          }).trim();
          realMetrics.componentSizes[component.name] = result;
          realMetrics.componentSizes[component.path] = result;
        } catch (error) {
          this.log(
            'error',
            `Error obteniendo tamaño de ${component.name}: ${error.message}`
          );
          realMetrics.componentSizes[component.name] = 'N/A';
          realMetrics.componentSizes[component.path] = 'N/A';
        }
      });

      // Conteos reales
      const counts = [
        {
          name: 'markdownFiles',
          command: 'find docs/ -name "*.md" 2>/dev/null | wc -l'
        },
        {
          name: 'skillDirectories',
          command:
            'find skills/ -maxdepth 1 -type d 2>/dev/null | tail -n +2 | wc -l'
        },
        {
          name: 'typescriptFiles',
          command: 'find packages/*/src/ -name "*.ts" 2>/dev/null | wc -l'
        },
        {
          name: 'javascriptFiles',
          command: 'find packages/*/src/ -name "*.js" 2>/dev/null | wc -l'
        },
        {
          name: 'testFiles',
          command:
            'find . -name "*.test.*" -o -name "*.spec.*" 2>/dev/null | wc -l'
        }
      ];

      counts.forEach(count => {
        try {
          const result = execSync(count.command, { encoding: 'utf8' }).trim();
          realMetrics.fileCounts[count.name] = result;
        } catch (error) {
          this.log(
            'error',
            `Error obteniendo conteo de ${count.name}: ${error.message}`
          );
          realMetrics.fileCounts[count.name] = 'N/A';
        }
      });

      // Configuraciones reales
      const configs = [
        {
          name: 'skill-rules.json',
          command:
            'du -sh configs/skill-rules.json 2>/dev/null | cut -f1 || echo "N/A"'
        },
        {
          name: 'slash-commands.json',
          command:
            'du -sh configs/slash-commands.json 2>/dev/null | cut -f1 || echo "N/A"'
        }
      ];

      configs.forEach(config => {
        try {
          const result = execSync(config.command, { encoding: 'utf8' }).trim();
          realMetrics.configuration[config.name] = result;
        } catch (error) {
          this.log(
            'error',
            `Error obteniendo tamaño de ${config.name}: ${error.message}`
          );
          realMetrics.configuration[config.name] = 'N/A';
        }
      });
    } catch (error) {
      this.log(
        'error',
        `Error general obteniendo métricas reales: ${error.message}`
      );
    }

    return realMetrics;
  }

  /**
   * Valida consistencia entre documentos
   */
  validateCrossDocumentConsistency() {
    this.log('info', 'Validando consistencia cruzada entre documentos...');

    const documents = Object.keys(this.documentMetrics);

    for (let i = 0; i < documents.length; i++) {
      for (let j = i + 1; j < documents.length; j++) {
        const doc1 = documents[i];
        const doc2 = documents[j];
        const metrics1 = this.documentMetrics[doc1];
        const metrics2 = this.documentMetrics[doc2];

        this.validateMetricsConsistency(doc1, doc2, metrics1, metrics2);
      }
    }
  }

  validateMetricsConsistency(doc1, doc2, metrics1, metrics2) {
    // Validar tamaños de componentes
    Object.entries(metrics1.componentSizes).forEach(([component, size1]) => {
      if (
        metrics2.componentSizes[component] &&
        metrics2.componentSizes[component] !== size1
      ) {
        this.inconsistencies.push({
          type: 'COMPONENT_SIZE_INCONSISTENCY',
          severity: 'HIGH',
          document1: doc1,
          document2: doc2,
          component,
          value1: size1,
          value2: metrics2.componentSizes[component],
          description: `El componente ${component} tiene tamaños inconsistentes: ${size1} vs ${metrics2.componentSizes[component]}`
        });
      }
    });

    // Validar conteos de archivos
    Object.entries(metrics1.fileCounts).forEach(([type, count1]) => {
      if (metrics2.fileCounts[type] && metrics2.fileCounts[type] !== count1) {
        this.inconsistencies.push({
          type: 'FILE_COUNT_INCONSISTENCY',
          severity: 'HIGH',
          document1: doc1,
          document2: doc2,
          fileType: type,
          value1: count1,
          value2: metrics2.fileCounts[type],
          description: `El conteo de ${type} es inconsistente: ${count1} vs ${metrics2.fileCounts[type]}`
        });
      }
    });

    // Validar configuraciones
    Object.entries(metrics1.configuration).forEach(([config, size1]) => {
      if (
        metrics2.configuration[config] &&
        metrics2.configuration[config] !== size1
      ) {
        this.inconsistencies.push({
          type: 'CONFIG_SIZE_INCONSISTENCY',
          severity: 'HIGH',
          document1: doc1,
          document2: doc2,
          configFile: config,
          value1: size1,
          value2: metrics2.configuration[config],
          description: `El archivo ${config} tiene tamaños inconsistentes: ${size1} vs ${metrics2.configuration[config]}`
        });
      }
    });
  }

  /**
   * Valida consistencia contra repositorio real
   */
  validateAgainstRealRepository(realMetrics) {
    this.log(
      'info',
      'Validando métricas contra estado real del repositorio...'
    );

    Object.entries(this.documentMetrics).forEach(([documentName, metrics]) => {
      this.validateDocumentAgainstRealRepo(documentName, metrics, realMetrics);
    });
  }

  validateDocumentAgainstRealRepo(documentName, metrics, realMetrics) {
    // Validar tamaños de componentes contra repositorio
    Object.entries(metrics.componentSizes).forEach(
      ([component, reportedSize]) => {
        const realSize = realMetrics.componentSizes[component];

        if (realSize && realSize !== 'N/A' && reportedSize !== realSize) {
          this.inconsistencies.push({
            type: 'REAL_REPO_MISMATCH',
            severity: 'CRITICAL',
            document: documentName,
            component,
            reportedValue: reportedSize,
            realValue: realSize,
            description: `El tamaño reportado de ${component} (${reportedSize}) no coincide con el tamaño real (${realSize})`,
            violation: 'PROH-006'
          });
        }
      }
    );

    // Detectar valores hardcodeados (violación de PROH-006)
    metrics.hardcodedValues.forEach(hardcoded => {
      this.inconsistencies.push({
        type: 'HARDCODED_VALUE',
        severity: 'CRITICAL',
        document: documentName,
        value: hardcoded.value,
        context: hardcoded.context,
        line: hardcoded.line,
        description: `Valor hardcodeado detectado: ${hardcoded.value} en línea ${hardcoded.line}`,
        violation: 'PROH-006',
        suggestion: 'Reemplazar con comando dinámico o placeholder $(comando)'
      });
    });
  }

  /**
   * Genera reporte de validación
   */
  generateValidationReport(realMetrics) {
    const report = {
      timestamp: this.timestamp,
      summary: {
        totalDocumentsValidated: Object.keys(this.documentMetrics).length,
        totalInconsistencies: this.inconsistencies.length,
        totalWarnings: this.warnings.length,
        criticalInconsistencies: this.inconsistencies.filter(
          i => i.severity === 'CRITICAL'
        ).length,
        highInconsistencies: this.inconsistencies.filter(
          i => i.severity === 'HIGH'
        ).length,
        validationStatus:
          this.inconsistencies.length === 0 ? 'COMPLIANT' : 'NON-COMPLIANT'
      },
      inconsistencies: this.inconsistencies,
      warnings: this.warnings,
      documentMetrics: this.documentMetrics,
      realRepositoryMetrics: realMetrics,
      compliance: {
        PROH_006_compliant:
          this.inconsistencies.filter(i => i.violation === 'PROH-006')
            .length === 0,
        PROH_009_compliant:
          this.inconsistencies.filter(
            i => i.type === 'COMPONENT_SIZE_INCONSISTENCY'
          ).length === 0,
        OBL_008_compliant:
          this.inconsistencies.filter(
            i => i.type === 'CROSS_DOCUMENT_INCONSISTENCY'
          ).length === 0,
        MAX_007_compliant:
          this.inconsistencies.filter(i => i.type === 'REAL_REPO_MISMATCH')
            .length === 0,
        QG_010_ready:
          this.inconsistencies.filter(i => i.severity === 'CRITICAL').length ===
          0
      }
    };

    return report;
  }

  /**
   * Guarda reporte de validación
   */
  saveValidationReport(
    report,
    outputPath = './reports/consistency-validation.json'
  ) {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    this.log('info', `📄 Reporte de validación guardado en: ${outputPath}`);
    return outputPath;
  }

  /**
   * Método de logging con timestamps
   */
  log(level, message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    console.log(logMessage);
  }

  /**
   * Método principal de validación
   */
  run() {
    console.log('🔍 Iniciando validación de consistencia cruzada...');
    console.log(
      '⚠️  ESTE SCRIPT ES OBLIGATORIO según PROH-009, OBL-008 y MAX-007'
    );

    try {
      // 1. Extraer métricas de todos los documentos dev-docs
      const devDocsFiles = ['tasks.md', 'plan.md', 'context.md'];
      devDocsFiles.forEach(file => {
        const filePath = path.join(this.reportsDir, file);
        if (fs.existsSync(filePath)) {
          this.extractMetricsFromDocument(filePath);
          this.log('info', `📋 Métricas extraídas de: ${file}`);
        } else {
          this.log('warn', `⚠️ Documento no encontrado: ${filePath}`);
        }
      });

      // 2. Obtener métricas reales del repositorio
      const realMetrics = this.getRealRepositoryMetrics();

      // 3. Validar consistencia cruzada entre documentos
      this.validateCrossDocumentConsistency();

      // 4. Validar contra estado real del repositorio
      this.validateAgainstRealRepository(realMetrics);

      // 5. Generar reporte
      const report = this.generateValidationReport(realMetrics);
      const reportPath = this.saveValidationReport(report);

      // 6. Mostrar resultados
      console.log('\n📊 Resultados de Validación:');
      console.log(
        `Documentos validados: ${report.summary.totalDocumentsValidated}`
      );
      console.log(
        `Inconsistencias totales: ${report.summary.totalInconsistencies}`
      );
      console.log(
        `Inconsistencias críticas: ${report.summary.criticalInconsistencies}`
      );
      console.log(
        `Inconsistencias altas: ${report.summary.highInconsistencies}`
      );

      if (report.summary.totalInconsistencies > 0) {
        console.log('\n❌ VIOLACIONES DETECTADAS:');
        this.inconsistencies.forEach(inconsistency => {
          const icon = inconsistency.severity === 'CRITICAL' ? '🚨' : '⚠️';
          console.log(`${icon} ${inconsistency.description}`);
          if (inconsistency.violation) {
            console.log(`   Violación: ${inconsistency.violation}`);
          }
        });

        console.log('\n💡 CORRECCIÓN OBLIGATORIA REQUERIDA');
        console.log(
          '❌ Esto viola las reglas obligatorias del sistema de análisis forense'
        );

        if (report.summary.criticalInconsistencies > 0) {
          console.log('\n❌ ESTO BLOQUEA EL PROGRESO HASTA CORREGIR');
        }

        process.exit(1);
      }

      console.log('\n✅ Validación de consistencia cruzada COMPLETADA');
      console.log(
        '✅ Todos los documentos son consistentes con el repositorio real'
      );
      console.log(
        '✅ PROH-009, OBL-008, MAX-007 y QG-010 compliance verificado'
      );
      console.log(`✅ Reporte guardado en: ${reportPath}`);

      return report;
    } catch (error) {
      console.error('\n❌ Falló validación de consistencia:', error.message);
      throw error;
    }
  }
}

// Ejecución principal
if (require.main === module) {
  const validator = new ConsistencyValidator();
  validator.run();
}

module.exports = { ConsistencyValidator };
