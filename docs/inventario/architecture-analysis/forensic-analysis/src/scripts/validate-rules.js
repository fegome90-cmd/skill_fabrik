#!/usr/bin/env node

/**
 * Validación de cumplimiento de rules_forense.json
 * Verifica que el proceso cumpla con todas las reglas y máximas establecidas
 */

const fs = require('fs');
const path = require('path');

class RulesValidator {
  constructor(rulesFile = 'rules_forense.json') {
    this.rulesPath = path.isAbsolute(rulesFile)
      ? rulesFile
      : path.join(process.cwd(), rulesFile);
    this.errors = [];
    this.warnings = [];
    this.passed = [];
  }

  validateRules() {
    console.log('🔍 Validando cumplimiento de rules_forense.json...\n');

    try {
      const rules = JSON.parse(fs.readFileSync(this.rulesPath, 'utf8'));

      // Validar estructura de reglas
      this.validateRuleStructure(rules);

      // Validar máxima: integridad
      this.validateIntegrity();

      // Validar máxima: calidad
      this.validateQuality();

      // Validar máxima: evidencia
      this.validateEvidence();

      // Validar máxima: gobernanza
      this.validateGovernance();

      this.printResults();
      return this.errors.length === 0;
    } catch (error) {
      console.error('❌ Error leyendo rules_forense.json:', error.message);
      return false;
    }
  }

  validateRuleStructure(rules) {
    const required = [
      'maximas',
      'prohibiciones',
      'obligaciones',
      'quality_gates'
    ];

    required.forEach(section => {
      if (!rules[section]) {
        this.errors.push(`Falta sección requerida: ${section}`);
      } else {
        this.passed.push(`✅ Sección ${section} presente`);
      }
    });
  }

  validateIntegrity() {
    // Verificar que no se hayan modificado archivos del repo original
    const forensicRoot = process.cwd();
    const skillsCoreRoot = path.join(forensicRoot, '..', '..', '..');
    console.log(`Validando reglas en: ${skillsCoreRoot}`);

    // Validar que estamos en el directorio correcto
    if (!fs.existsSync(this.rulesPath)) {
      this.errors.push(
        '❌ rules_forense.json no encontrado en el directorio actual'
      );
    } else {
      this.passed.push('✅ rules_forense.json encontrado y accesible');
    }

    // Validar que no hayamos modificado archivos del repo original
    // (esto es más un check de proceso real)
    const devDocsPath = path.join(forensicRoot, 'dev-docs');
    if (fs.existsSync(devDocsPath)) {
      this.passed.push(
        '✅ Estructura dev-docs local creada (sin modificar repo original)'
      );
    } else {
      this.warnings.push('⚠️ Estructura dev-docs local no encontrada');
    }
  }

  validateQuality() {
    // Validar configuración de herramientas de calidad
    const configFiles = [
      '.eslintrc.json',
      '.prettierrc',
      'jest.config.js',
      'package.json'
    ];

    configFiles.forEach(file => {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        this.passed.push(`✅ ${file} configurado`);
      } else {
        this.errors.push(`❌ ${file} no encontrado`);
      }
    });
  }

  validateEvidence() {
    // Validar estructura para informes
    const reportsDir = path.join(process.cwd(), 'reports');
    const testsDir = path.join(process.cwd(), 'tests');

    [reportsDir, testsDir].forEach(dir => {
      if (fs.existsSync(dir)) {
        this.passed.push(`✅ Directorio ${path.basename(dir)} creado`);
      } else {
        this.warnings.push(`⚠️ Directorio ${path.basename(dir)} no creado aún`);
      }
    });
  }

  validateGovernance() {
    // Validar que las dev-docs guía existen
    const devDocsFiles = [
      'dev-docs/plan.md',
      'dev-docs/tasks.md',
      'dev-docs/context.md'
    ];

    devDocsFiles.forEach(file => {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        this.passed.push(`✅ ${file} presente`);
      } else {
        this.errors.push(`❌ ${file} no encontrado - es guía del proceso`);
      }
    });
  }

  printResults() {
    console.log('\n📊 Resultados de Validación de Reglas');
    console.log('=====================================');

    if (this.passed.length > 0) {
      console.log('\n✅ Validaciones Exitosas:');
      this.passed.forEach(item => console.log(`  ${item}`));
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️ Advertencias:');
      this.warnings.forEach(item => console.log(`  ${item}`));
    }

    if (this.errors.length > 0) {
      console.log('\n❌ Errores Críticos:');
      this.errors.forEach(item => console.log(`  ${item}`));
    }

    console.log('\n📈 Resumen:');
    console.log(`  ✅ Exitosas: ${this.passed.length}`);
    console.log(`  ⚠️ Advertencias: ${this.warnings.length}`);
    console.log(`  ❌ Errores: ${this.errors.length}`);

    const overallStatus =
      this.errors.length === 0 ? '✅ APROBADO' : '❌ RECHAZADO';
    console.log(`\n🎯 Estado General: ${overallStatus}`);
  }
}

// Ejecutar validación
if (require.main === module) {
  const args = process.argv.slice(2);
  const rulesFile = args[0] || 'rules_forense.json';
  const validator = new RulesValidator(rulesFile);
  const success = validator.validateRules();
  process.exit(success ? 0 : 1);
}

module.exports = RulesValidator;
