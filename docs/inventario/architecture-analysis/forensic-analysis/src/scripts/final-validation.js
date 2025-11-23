#!/usr/bin/env node

/**
 * Final Validation Script - Validación Completa del Sistema
 *
 * Este script ejecuta TODAS las validaciones obligatorias para asegurar
 * 0 violaciones de las reglas forenses y full compliance dinámico
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class FinalValidator {
  constructor() {
    this.timestamp = new Date().toISOString();
    this.results = {
      passed: 0,
      failed: 0,
      violations: [],
      critical: [],
      high: [],
      summary: {}
    };
  }

  /**
   * Ejecuta un comando y registra resultado
   */
  runCommand(command, description, critical = true) {
    console.log(`\n🔍 ${description}...`);

    try {
      const output = execSync(command, {
        encoding: 'utf8',
        timeout: 30000
      });

      console.log(`✅ ${description} - PASSED`);
      this.results.passed++;
      return { success: true, output };
    } catch (error) {
      console.log(`❌ ${description} - FAILED`);
      console.log(`   Error: ${error.message}`);

      const violation = {
        type: critical ? 'CRITICAL' : 'HIGH',
        command,
        description,
        error: error.message,
        timestamp: this.timestamp
      };

      this.results.violations.push(violation);
      if (critical) {
        this.results.critical.push(violation);
      } else {
        this.results.high.push(violation);
      }

      this.results.failed++;
      return { success: false, error: error.message };
    }
  }

  /**
   * Valida que no existan métricas hardcodeadas
   */
  validateNoHardcodedMetrics() {
    console.log('\n🔍 Validando ausencia de métricas hardcodeadas...');

    const forbiddenPatterns = [
      {
        pattern: /\([0-9]+[KMGT]?B\)/g,
        description: 'Tamaños hardcodeados (ej: 448KB)'
      },
      { pattern: /3,510/, description: 'Conteo específico hardcodeado' },
      { pattern: /33 skills/, description: 'Conteo de skills hardcodeado' },
      { pattern: /96MB/, description: 'MCP size hardcodeado' },
      { pattern: /405MB/, description: 'chromadb size hardcodeado' }
    ];

    const devDocsFiles = [
      'dev-docs/tasks.md',
      'dev-docs/plan.md',
      'dev-docs/context.md'
    ];

    let hardcodedFound = 0;

    devDocsFiles.forEach(file => {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');

        forbiddenPatterns.forEach(({ pattern, description }) => {
          const matches = content.match(pattern);
          if (matches) {
            console.log(
              `❌ ${description} encontrado en ${file}: ${matches.join(', ')}`
            );
            this.results.violations.push({
              type: 'CRITICAL',
              rule: 'PROH-006',
              file,
              pattern: description,
              matches,
              timestamp: this.timestamp
            });
            this.results.critical.push({
              type: 'CRITICAL',
              rule: 'PROH-006',
              file,
              pattern: description,
              matches,
              timestamp: this.timestamp
            });
            hardcodedFound++;
          }
        });
      }
    });

    if (hardcodedFound === 0) {
      console.log('✅ No se encontraron métricas hardcodeadas');
      this.results.passed++;
    } else {
      console.log(`❌ Se encontraron ${hardcodedFound} métricas hardcodeadas`);
      this.results.failed++;
    }
  }

  /**
   * Valida presencia de placeholders dinámicos
   */
  validateDynamicPlaceholders() {
    console.log('\n🔍 Validando presencia de placeholders dinámicos...');

    const requiredPatterns = [
      {
        pattern: /\$\(du -sh.*\|.*cut -f1\)/g,
        description: 'Placeholders de tamaño dinámico'
      },
      {
        pattern: /\$\(find.*\|.*wc -l\)/g,
        description: 'Placeholders de conteo dinámico'
      },
      { pattern: /\$\(git.*\)/g, description: 'Placeholders de git dinámicos' },
      {
        pattern: /\$\(date.*\)/g,
        description: 'Placeholders de timestamp dinámico'
      }
    ];

    const devDocsFiles = [
      'dev-docs/tasks.md',
      'dev-docs/plan.md',
      'dev-docs/context.md'
    ];

    let missingPlaceholders = 0;

    devDocsFiles.forEach(file => {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');

        requiredPatterns.forEach(({ pattern, description }) => {
          const matches = content.match(pattern);
          if (!matches || matches.length === 0) {
            console.log(`⚠️ ${description} no encontrado en ${file}`);
            this.results.violations.push({
              type: 'HIGH',
              rule: 'OBL-007',
              file,
              missing: description,
              timestamp: this.timestamp
            });
            this.results.high.push({
              type: 'HIGH',
              rule: 'OBL-007',
              file,
              missing: description,
              timestamp: this.timestamp
            });
            missingPlaceholders++;
          } else {
            console.log(
              `✅ ${description} encontrado en ${file} (${matches.length} ocurrencias)`
            );
          }
        });
      }
    });

    if (missingPlaceholders === 0) {
      console.log('✅ Todos los placeholders dinámicos presentes');
      this.results.passed++;
    } else {
      console.log(
        `❌ Faltan ${missingPlaceholders} tipos de placeholders dinámicos`
      );
      this.results.failed++;
    }
  }

  /**
   * Ejecuta todas las validaciones
   */
  async runAllValidations() {
    console.log('🚀 Iniciando Validación Final Completa del Sistema');
    console.log(
      '⚠️  ESTA VALIDACIÓN ES OBLIGATORIA antes de cualquier commit o deployment'
    );
    console.log(`📅 Timestamp: ${this.timestamp}`);

    // 1. Validaciones de scripts obligatorios
    this.runCommand(
      'node src/scripts/validate-dynamic-compliance.js',
      'Validación de Compliance Dinámico (PROH-006, PROH-009, OBL-007, OBL-018, MAX-014, MAX-015)',
      true
    );

    this.runCommand(
      'node src/scripts/consistency-validator.js',
      'Validación de Consistencia Cruzada (PROH-009, MAX-007, QG-010)',
      true
    );

    this.runCommand(
      'node src/scripts/dynamic-metrics-collector.js',
      'Colector de Métricas Dinámicas (MAX-014, OBL-018)',
      true
    );

    this.runCommand(
      'node src/scripts/check-metrics-consistency.js',
      'Validación de Consistencia de Métricas (PROH-009, MAX-014)',
      true
    );

    // 2. Validaciones manuales de contenido
    this.validateNoHardcodedMetrics();
    this.validateDynamicPlaceholders();

    // 3. Validaciones de calidad de código
    this.runCommand('npm run lint', 'Linting de código', false);
    this.runCommand('npm run format:check', 'Format check', false);

    // 4. Generar resumen
    this.generateSummary();

    // 5. Determinar resultado final
    if (this.results.critical.length > 0) {
      console.log('\n🚨 VALIDACIÓN FALLIDA - VIOLACIONES CRÍTICAS DETECTADAS');
      console.log('❌ PROGRESO BLOQUEADO hasta corregir violaciones críticas');

      console.log('\n🔥 VIOLACIONES CRÍTICAS:');
      this.results.critical.forEach((violation, index) => {
        console.log(
          `   ${index + 1}. ${violation.description || violation.rule} en ${violation.file}`
        );
      });

      console.log('\n💡 CORRECCIÓN OBLIGATORIA:');
      console.log(
        '1. Reemplazar todas las métricas hardcodeadas con placeholders dinámicos'
      );
      console.log('2. Añadir comandos de verificación en tiempo real');
      console.log('3. Ejecutar scripts de validación hasta que pasen');
      console.log('4. Asegurar compliance con rules_forense_v2.json');

      process.exit(1);
    } else if (this.results.high.length > 0) {
      console.log(
        '\n⚠️ VALIDACIÓN CON WARNINGS - VIOLACIONES ALTAS DETECTADAS'
      );
      console.log('⚠️ Se recomienda corregir antes de continuar');

      console.log('\n⚠️ VIOLACIONES ALTAS:');
      this.results.high.forEach((violation, index) => {
        console.log(
          `   ${index + 1}. ${violation.description || violation.rule} en ${violation.file}`
        );
      });

      console.log('\n💡 RECOMENDACIONES:');
      console.log('1. Añadir placeholders dinámicos faltantes');
      console.log('2. Mejorar calidad de código');
      console.log('3. Ejecutar validación nuevamente');

      process.exit(1);
    } else {
      console.log('\n✅ VALIDACIÓN COMPLETADA EXITOSAMENTE');
      console.log('✅ 0 violaciones detectadas');
      console.log('✅ Full compliance con rules_forense_v2.json');
      console.log('✅ Sistema listo para commit/deployment');

      console.log('\n📊 Resumen Final:');
      console.log(`   Validaciones pasadas: ${this.results.passed}`);
      console.log(`   Validaciones fallidas: ${this.results.failed}`);
      console.log(`   Violaciones críticas: ${this.results.critical.length}`);
      console.log(`   Violaciones altas: ${this.results.high.length}`);
      console.log('   Estado: FULLY COMPLIANT');

      return this.results;
    }
  }

  /**
   * Genera resumen de validación
   */
  generateSummary() {
    this.results.summary = {
      timestamp: this.timestamp,
      totalValidations: this.results.passed + this.results.failed,
      passed: this.results.passed,
      failed: this.results.failed,
      criticalViolations: this.results.critical.length,
      highViolations: this.results.high.length,
      overallStatus:
        this.results.critical.length === 0
          ? this.results.high.length === 0
            ? 'FULLY_COMPLIANT'
            : 'COMPLIANT_WITH_WARNINGS'
          : 'NON_COMPLIANT',
      complianceWithRules: {
        PROH_006:
          this.results.violations.filter(v => v.rule === 'PROH-006').length ===
          0,
        PROH_009:
          this.results.violations.filter(v => v.rule === 'PROH-009').length ===
          0,
        OBL_007:
          this.results.violations.filter(v => v.rule === 'OBL-007').length ===
          0,
        OBL_018:
          this.results.violations.filter(v => v.rule === 'OBL-018').length ===
          0,
        MAX_014:
          this.results.violations.filter(v => v.rule === 'MAX-014').length ===
          0,
        MAX_015:
          this.results.violations.filter(v => v.rule === 'MAX-015').length === 0
      }
    };

    // Guardar reporte
    const reportPath = './reports/final-validation.json';
    const dir = path.dirname(reportPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`📄 Reporte guardado en: ${reportPath}`);
  }
}

// Ejecución principal
if (require.main === module) {
  const validator = new FinalValidator();
  validator.runAllValidations();
}

module.exports = { FinalValidator };
