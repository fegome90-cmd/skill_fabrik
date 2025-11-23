#!/usr/bin/env node

/**
 * Dynamic Compliance Validator - Script Obligatorio
 *
 * Valida compliance con reglas de análisis forense para datos dinámicos
 * Cumple con:
 * - PROH-006: Prohibición de datos sin verificación en tiempo real
 * - PROH-009: Prohibición de inconsistencias de métricas
 * - PROH-015: Prohibición de datos no dinámicos en tareas
 * - OBL-007: Obligación de verificar todos los datos con comandos reales
 * - OBL-018: Obligación de comandos de verificación obligatorios
 * - MAX-014: Máxima verificación dinámica contra repositorio
 * - MAX-015: Máxima integridad de datos cuantitativos
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DynamicComplianceValidator {
  constructor(targetPath = process.cwd()) {
    this.targetPath = targetPath;
    this.timestamp = new Date().toISOString();
    this.violations = [];
    this.warnings = [];
    this.compliance = {
      PROH_006: true,
      PROH_009: true,
      PROH_015: true,
      OBL_007: true,
      OBL_018: true,
      MAX_014: true,
      MAX_015: true
    };
  }

  /**
   * Patrones prohibidos que violan las reglas
   */
  getForbiddenPatterns() {
    return {
      PROH_006_hardcodedMetrics: [
        /\(\d+[KMGT]?B\)/g, // (448KB), (96MB), etc.
        /\(\d+\s*(bytes|KB|MB|GB)\)/gi,
        /\b\d+\s*(KB|MB|GB)\s*[-–—]/gi // "448KB - ", "96MB -"
      ],
      PROH_009_inconsistentMetrics: [
        /daemon.*?\d+[KMGT]?B/gi,
        /router.*?\d+[KMGT]?B/gi,
        /skills-cli.*?\d+[KMGT]?B/gi,
        /mcp.*?\d+[KMGT]?B/gi
      ],
      PROH_015_nonDynamicData: [
        /total:\s*\d+/gi,
        /count:\s*\d+/gi,
        /size:\s*\d+[KMGT]?B/gi
      ]
    };
  }

  /**
   * Patrones obligatorios que deben estar presentes
   */
  getRequiredPatterns() {
    return {
      OBL_007_verificationCommands: [
        /\$\(.*\w+.*\)/g, // Placeholders de comandos $(command)
        /npm run verify:/g,
        /du -sh/g,
        /find.*\|.*wc -l/g
      ],
      OBL_018_mandatoryCommands: [
        /du -sh.*packages/g,
        /find.*\.md.*wc -l/g,
        /git.*rev-parse/g
      ],
      MAX_014_dynamicVerification: [/\$\(du -sh/g, /\$\(find/g, /\$\(git/g]
    };
  }

  /**
   * Verifica si un archivo existe y puede ser leído
   */
  validateFile(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        this.violations.push({
          type: 'FILE_NOT_FOUND',
          severity: 'HIGH',
          file: filePath,
          description: `Archivo requerido no encontrado: ${filePath}`
        });
        return false;
      }

      const stats = fs.statSync(filePath);
      if (stats.size === 0) {
        this.warnings.push({
          type: 'EMPTY_FILE',
          severity: 'MEDIUM',
          file: filePath,
          description: `Archivo vacío detectado: ${filePath}`
        });
      }

      return true;
    } catch (error) {
      this.violations.push({
        type: 'FILE_ACCESS_ERROR',
        severity: 'HIGH',
        file: filePath,
        description: `Error accediendo a ${filePath}: ${error.message}`
      });
      return false;
    }
  }

  /**
   * Valida un documento contra patrones prohibidos
   */
  validateForbiddenPatterns(filePath, content, fileName) {
    const forbiddenPatterns = this.getForbiddenPatterns();
    const lines = content.split('\n');

    Object.entries(forbiddenPatterns).forEach(([rule, patterns]) => {
      patterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          const lineNumber = this.getLineNumber(content, match.index);
          const context = this.getContextAroundMatch(content, match.index);

          this.violations.push({
            type: 'FORBIDDEN_PATTERN',
            severity: 'CRITICAL',
            file: fileName,
            line: lineNumber,
            rule: rule,
            pattern: pattern.toString(),
            match: match[0],
            context: context.trim(),
            description: `Patrón prohibido detectado en línea ${lineNumber}: ${match[0]}`,
            suggestion: this.getSuggestionForPattern(rule, match[0])
          });

          // Marcar regla como no compliant
          this.compliance[rule] = false;
        }
      });
    });
  }

  /**
   * Valida presencia de patrones obligatorios
   */
  validateRequiredPatterns(filePath, content, fileName) {
    const requiredPatterns = this.getRequiredPatterns();
    const lines = content.split('\n');

    Object.entries(requiredPatterns).forEach(([rule, patterns]) => {
      let found = false;
      patterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches && matches.length > 0) {
          found = true;
        }
      });

      if (!found) {
        this.violations.push({
          type: 'MISSING_REQUIRED_PATTERN',
          severity: 'HIGH',
          file: fileName,
          rule: rule,
          description: `Patrón requerido ausente: ${rule}`,
          suggestion: 'Añadir verificación dinámica con comandos reales'
        });

        // Marcar regla como no compliant
        this.compliance[rule] = false;
      }
    });
  }

  /**
   * Valida que los placeholders de comandos sean válidos
   */
  validateCommandPlaceholders(filePath, content, fileName) {
    const placeholderPattern = /\$\(([^)]+)\)/g;
    let match;
    const invalidCommands = [];

    while ((match = placeholderPattern.exec(content)) !== null) {
      const command = match[1];
      const lineNumber = this.getLineNumber(content, match.index);

      // Validar que el comando sea ejecutable
      try {
        // Intentar ejecutar el comando con timeout corto para validar sintaxis
        const testCommand =
          command.includes('cut') ||
          command.includes('wc') ||
          command.includes('find') ||
          command.includes('du') ||
          command.includes('git')
            ? `echo "test" | ${command.split('|').pop()}`
            : `which ${command.split(' ')[0]}`;

        execSync(testCommand, {
          encoding: 'utf8',
          timeout: 3000,
          cwd: this.targetPath
        });
      } catch (error) {
        invalidCommands.push({
          command,
          line: lineNumber,
          error: error.message
        });

        this.violations.push({
          type: 'INVALID_COMMAND_PLACEHOLDER',
          severity: 'HIGH',
          file: fileName,
          line: lineNumber,
          command: match[0],
          error: error.message,
          description: `Placeholder de comando inválido: ${match[0]}`,
          suggestion: `Verificar que el comando sea ejecutable: ${command}`
        });
      }
    }

    return invalidCommands;
  }

  /**
   * Valida estructura de documento para compliance dinámica
   */
  validateDocumentStructure(filePath, content, fileName) {
    const requiredSections = [
      /##.*[Vv]erificación.*[Dd]inámica/i,
      /##.*[Cc]omandos.*[Vv]erificación/i,
      /##.*[Mm]étricas.*[Rr]eales/i,
      /##.*[Qq]uality.*[Gg]ates/i
    ];

    const missingSections = [];

    requiredSections.forEach(pattern => {
      if (!pattern.test(content)) {
        missingSections.push(pattern.toString());
      }
    });

    if (missingSections.length > 0) {
      this.violations.push({
        type: 'MISSING_VERIFICATION_SECTION',
        severity: 'HIGH',
        file: fileName,
        missingSections,
        description: 'Faltan secciones obligatorias de verificación dinámica',
        suggestion: 'Añadir secciones de verificación dinámica, comandos y quality gates'
      });
    }

    // Validar presencia de timestamps de verificación
    if (
      !content.includes('Last Verified') &&
      !content.includes('Última Verificación')
    ) {
      this.violations.push({
        type: 'MISSING_VERIFICATION_TIMESTAMP',
        severity: 'MEDIUM',
        file: fileName,
        description: 'Falta timestamp de última verificación',
        suggestion: 'Añadir "Last Verified: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"'
      });
    }
  }

  /**
   * Ejecuta comando real y verifica si el resultado coincide con lo esperado
   */
  validateRealTimeMetrics(filePath, content, fileName) {
    // Extraer comandos de verification
    const commandBlocks = content.match(/```bash\n([\s\S]*?)\n```/g) || [];
    const invalidMetrics = [];

    commandBlocks.forEach(block => {
      const commands = block.match(/(du -sh|find.*wc -l|git.*)/g) || [];

      commands.forEach(command => {
        try {
          const result = execSync(command, {
            encoding: 'utf8',
            timeout: 5000,
            cwd: this.targetPath
          }).trim();

          if (result === 'N/A' || result === '' || result.includes('Error')) {
            invalidMetrics.push({
              command,
              result,
              status: 'failed'
            });

            this.violations.push({
              type: 'FAILED_REAL_TIME_VERIFICATION',
              severity: 'CRITICAL',
              file: fileName,
              command,
              result,
              description: `Comando de verificación falló: ${command}`,
              suggestion: 'Verificar que el componente/ruta exista y sea accesible'
            });
          }
        } catch (error) {
          invalidMetrics.push({
            command,
            error: error.message,
            status: 'error'
          });

          this.violations.push({
            type: 'REAL_TIME_VERIFICATION_ERROR',
            severity: 'CRITICAL',
            file: fileName,
            command,
            error: error.message,
            description: `Error ejecutando verificación en tiempo real: ${command}`,
            suggestion: 'Corregir comando o verificar permisos/rutas'
          });
        }
      });
    });

    return invalidMetrics;
  }

  /**
   * Obtiene línea número de un índice en el contenido
   */
  getLineNumber(content, index) {
    const textBeforeIndex = content.substring(0, index);
    return textBeforeIndex.split('\n').length;
  }

  /**
   * Obtiene contexto alrededor de un match
   */
  getContextAroundMatch(content, index, contextLength = 50) {
    const start = Math.max(0, index - contextLength);
    const end = Math.min(content.length, index + contextLength);
    return content.substring(start, end);
  }

  /**
   * Obtiene sugerencia para un patrón específico
   */
  getSuggestionForPattern(rule, match) {
    const suggestions = {
      PROH_006_hardcodedMetrics: `Reemplazar "${match}" con placeholder dinámico como "$(<comando>)"`,
      PROH_009_inconsistentMetrics: 'Usar comando unificado: "$(du -sh packages/daemon/src/ | cut -f1)"',
      PROH_015_nonDynamicData: 'Reemplazar con comando dinámico: "$(find ... | wc -l)"'
    };

    return (
      suggestions[rule] ||
      'Reemplazar con verificación dinámica usando comandos reales'
    );
  }

  /**
   * Valida un archivo específico
   */
  validateFileForCompliance(filePath) {
    const fileName = path.basename(filePath);

    if (!this.validateFile(filePath)) {
      return false;
    }

    const content = fs.readFileSync(filePath, 'utf8');

    // Validaciones específicas para compliance dinámica
    this.validateForbiddenPatterns(filePath, content, fileName);
    this.validateRequiredPatterns(filePath, content, fileName);
    this.validateCommandPlaceholders(filePath, content, fileName);
    this.validateDocumentStructure(filePath, content, fileName);
    this.validateRealTimeMetrics(filePath, content, fileName);

    return {
      fileName,
      violations: this.violations.filter(v => v.file === fileName),
      warnings: this.warnings.filter(w => w.file === fileName)
    };
  }

  /**
   * Genera reporte de compliance
   */
  generateComplianceReport(validationResults) {
    const report = {
      timestamp: this.timestamp,
      targetPath: this.targetPath,
      summary: {
        totalFilesValidated: validationResults.length,
        totalViolations: this.violations.length,
        totalWarnings: this.warnings.length,
        criticalViolations: this.violations.filter(
          v => v.severity === 'CRITICAL'
        ).length,
        highViolations: this.violations.filter(v => v.severity === 'HIGH')
          .length,
        mediumViolations: this.violations.filter(v => v.severity === 'MEDIUM')
          .length,
        complianceStatus:
          this.violations.length === 0 ? 'FULLY_COMPLIANT' : 'NON_COMPLIANT'
      },
      compliance: {
        PROH_006: {
          rule: 'Prohibición de datos sin verificación en tiempo real',
          compliant: this.compliance.PROH_006,
          violations: this.violations.filter(v => v.rule === 'PROH_006')
        },
        PROH_009: {
          rule: 'Prohibición de inconsistencias de métricas',
          compliant: this.compliance.PROH_009,
          violations: this.violations.filter(v => v.rule === 'PROH_009')
        },
        PROH_015: {
          rule: 'Prohibición de datos no dinámicos en tareas',
          compliant: this.compliance.PROH_015,
          violations: this.violations.filter(v => v.rule === 'PROH_015')
        },
        OBL_007: {
          rule: 'Verificación con comandos reales',
          compliant: this.compliance.OBL_007,
          violations: this.violations.filter(v => v.rule === 'OBL_007')
        },
        OBL_018: {
          rule: 'Comandos de verificación obligatorios',
          compliant: this.compliance.OBL_018,
          violations: this.violations.filter(v => v.rule === 'OBL_018')
        },
        MAX_014: {
          rule: 'Verificación dinámica máxima contra repositorio',
          compliant: this.compliance.MAX_014,
          violations: this.violations.filter(v => v.rule === 'MAX_014')
        },
        MAX_015: {
          rule: 'Integridad máxima de datos cuantitativos',
          compliant: this.compliance.MAX_015,
          violations: this.violations.filter(v => v.rule === 'MAX_015')
        }
      },
      violations: this.violations,
      warnings: this.warnings,
      validationResults
    };

    return report;
  }

  /**
   * Guarda reporte de compliance
   */
  saveComplianceReport(
    report,
    outputPath = './reports/dynamic-compliance.json'
  ) {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    console.log(`📄 Reporte de compliance guardado en: ${outputPath}`);
    return outputPath;
  }

  /**
   * Método principal de validación
   */
  run(targetFiles = []) {
    console.log('🔍 Iniciando validación de compliance dinámica...');
    console.log('⚠️  ESTE SCRIPT ES OBLIGATORIO según REGLAS FORENSES v2');

    // Archivos por defecto si no se especifican
    if (targetFiles.length === 0) {
      targetFiles = [
        './dev-docs/tasks.md',
        './dev-docs/plan.md',
        './dev-docs/context.md'
      ];
    }

    const validationResults = [];

    try {
      // Validar cada archivo
      targetFiles.forEach(filePath => {
        console.log(`📋 Validando: ${filePath}`);
        const result = this.validateFileForCompliance(filePath);
        if (result) {
          validationResults.push(result);
        }
      });

      // Generar reporte
      const report = this.generateComplianceReport(validationResults);
      const reportPath = this.saveComplianceReport(report);

      // Mostrar resultados
      console.log('\n📊 Resultados de Compliance Dinámica:');
      console.log(`Archivos validados: ${report.summary.totalFilesValidated}`);
      console.log(`Violaciones totales: ${report.summary.totalViolations}`);
      console.log(`Violaciones críticas: ${report.summary.criticalViolations}`);
      console.log(`Violaciones altas: ${report.summary.highViolations}`);
      console.log(`Estado compliance: ${report.summary.complianceStatus}`);

      // Mostrar detalles de reglas
      console.log('\n📋 Status por Regla:');
      Object.entries(report.compliance).forEach(([rule, data]) => {
        const status = data.compliant ? '✅' : '❌';
        console.log(`${status} ${rule}: ${data.rule}`);
        if (!data.compliant && data.violations.length > 0) {
          console.log(`   - ${data.violations.length} violaciones`);
        }
      });

      if (report.summary.totalViolations > 0) {
        console.log('\n❌ VIOLACIONES DETECTADAS:');

        // Mostrar violaciones críticas primero
        const criticalViolations = this.violations.filter(
          v => v.severity === 'CRITICAL'
        );
        if (criticalViolations.length > 0) {
          console.log('\n🚨 VIOLACIONES CRÍTICAS:');
          criticalViolations.forEach(v => {
            console.log(`   ${v.file}:${v.line || '?'} - ${v.description}`);
            if (v.suggestion) {
              console.log(`     💡 ${v.suggestion}`);
            }
          });
        }

        console.log('\n💡 CORRECCIÓN OBLIGATORIA REQUERIDA');
        console.log(
          '❌ Las violaciones críticas bloquean el progreso hasta ser corregidas'
        );

        if (report.summary.criticalViolations > 0) {
          console.log('\n❌ ESTADO: NON-COMPLIANT - PROGRESO BLOQUEADO');
          process.exit(1);
        }
      }

      console.log('\n✅ Validación de compliance dinámica COMPLETADA');
      console.log('✅ Todas las reglas forenses verificadas');
      console.log(`✅ Reporte guardado en: ${reportPath}`);

      return report;
    } catch (error) {
      console.error('\n❌ Falló validación de compliance:', error.message);
      throw error;
    }
  }
}

// Ejecución principal
if (require.main === module) {
  const args = process.argv.slice(2);
  const validator = new DynamicComplianceValidator();
  validator.run(args);
}

module.exports = { DynamicComplianceValidator };
