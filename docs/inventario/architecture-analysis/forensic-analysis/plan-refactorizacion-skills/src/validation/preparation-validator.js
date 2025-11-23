#!/usr/bin/env node

/**
 * Preparation Validator - Validación de Preparación para Refactorización
 *
 * Valida que el sistema esté completamente preparado para comenzar
 * la refactorización basada en el análisis forense completado
 */

const fs = require('fs');
const path = require('path');

class PreparationValidator {
  constructor() {
    this.timestamp = new Date().toISOString();
    this.validationResults = [];
    this.criticalIssues = [];
    this.warnings = [];
  }

  /**
   * Valida estructura de directorios requerida
   */
  validateDirectoryStructure() {
    console.log('🔍 Validando estructura de directorios...');

    const requiredDirectories = [
      'dev-docs',
      'config',
      'src/validation',
      'src/planning',
      'src/utils',
      'tests',
      'phases',
      'artifacts',
      'tools'
    ];

    requiredDirectories.forEach(dir => {
      if (!fs.existsSync(dir)) {
        this.addCriticalIssue(
          'DIRECTORY_MISSING',
          `Directorio requerido no encontrado: ${dir}`
        );
      } else {
        console.log(`✅ Directorio encontrado: ${dir}`);
      }
    });
  }

  /**
   * Valida archivos de configuración requeridos
   */
  validateRequiredFiles() {
    console.log('\n🔍 Validando archivos de configuración...');

    const requiredFiles = [
      'package.json',
      'dev-docs/README.md',
      'dev-docs/context.md',
      'dev-docs/plan.md',
      'dev-docs/tasks.md',
      'config/rules_refact.json'
    ];

    requiredFiles.forEach(file => {
      if (!fs.existsSync(file)) {
        this.addCriticalIssue(
          'FILE_MISSING',
          `Archivo requerido no encontrado: ${file}`
        );
      } else {
        console.log(`✅ Archivo encontrado: ${file}`);
        this.validateFileContent(file);
      }
    });
  }

  /**
   * Valida contenido de archivos específicos
   */
  validateFileContent(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');

      if (filePath.endsWith('.json')) {
        this.validateJsonFile(filePath, content);
      } else if (filePath.endsWith('.md')) {
        this.validateMarkdownFile(filePath, content);
      }
    } catch (error) {
      this.addCriticalIssue(
        'FILE_READ_ERROR',
        `Error leyendo archivo ${filePath}: ${error.message}`
      );
    }
  }

  /**
   * Valida archivo JSON
   */
  validateJsonFile(filePath, content) {
    try {
      const parsed = JSON.parse(content);

      if (filePath.includes('rules_refact.json')) {
        this.validateRulesRefact(parsed);
      } else if (filePath.includes('package.json')) {
        this.validatePackageJson(parsed);
      }
    } catch (error) {
      this.addCriticalIssue(
        'JSON_INVALID',
        `JSON inválido en ${filePath}: ${error.message}`
      );
    }
  }

  /**
   * Valida rules_refact.json
   */
  validateRulesRefact(rules) {
    console.log('🔍 Validando rules_refact.json...');

    const requiredSections = [
      'maximas',
      'prohibiciones',
      'obligaciones',
      'qualityGates'
    ];
    requiredSections.forEach(section => {
      if (!rules[section] || !Array.isArray(rules[section])) {
        this.addCriticalIssue(
          'RULES_SECTION_MISSING',
          `Sección requerida no encontrada: ${section}`
        );
      } else {
        console.log(`✅ Sección ${section}: ${rules[section].length} reglas`);
      }
    });

    // Validar counts mínimos
    if (rules.maximas && rules.maximas.length < 10) {
      this.addWarning(
        'RULES_MAXIMAS_INSUFFICIENT',
        `Máximas insuficientes: ${rules.maximas.length} (mínimo 10)`
      );
    }

    if (rules.prohibiciones && rules.prohibiciones.length < 12) {
      this.addWarning(
        'RULES_PROHIBICIONES_INSUFFICIENT',
        `Prohibiciones insuficientes: ${rules.prohibiciones.length} (mínimo 12)`
      );
    }

    if (rules.obligaciones && rules.obligaciones.length < 15) {
      this.addWarning(
        'RULES_OBLIGACIONES_INSUFFICIENT',
        `Obligaciones insuficientes: ${rules.obligaciones.length} (mínimo 15)`
      );
    }

    if (rules.qualityGates && rules.qualityGates.length < 7) {
      this.addWarning(
        'RULES_QUALITY_GATES_INSUFFICIENT',
        `Quality gates insuficientes: ${rules.qualityGates.length} (mínimo 7)`
      );
    }
  }

  /**
   * Valida package.json
   */
  validatePackageJson(packageJson) {
    const requiredScripts = [
      'validate:refactor',
      'validate:preparation',
      'validate:gates'
    ];

    requiredScripts.forEach(script => {
      if (!packageJson.scripts || !packageJson.scripts[script]) {
        this.addCriticalIssue(
          'SCRIPT_MISSING',
          `Script requerido no encontrado: ${script}`
        );
      } else {
        console.log(`✅ Script encontrado: ${script}`);
      }
    });
  }

  /**
   * Valida archivo Markdown
   */
  validateMarkdownFile(filePath, content) {
    if (filePath.includes('dev-docs/')) {
      // Validar que contenga placeholders dinámicos
      const hasPlaceholders =
        content.includes('$(') || content.includes('date -u');
      if (!hasPlaceholders) {
        this.addWarning(
          'MISSING_DYNAMIC_CONTENT',
          `Archivo ${filePath} no contiene contenido dinámico`
        );
      }

      // Validar que tenga verificación dinámica
      if (
        !content.includes('Verificación Dinámica') &&
        !content.includes('Comandos de Verificación')
      ) {
        this.addWarning(
          'MISSING_VERIFICATION',
          `Archivo ${filePath} no tiene sección de verificación dinámica`
        );
      }
    }
  }

  /**
   * Valida conexión con análisis forense
   */
  validateForensicAnalysisConnection() {
    console.log('\n🔍 Validando conexión con análisis forense...');

    const forensicPath = '../';
    const forensicFiles = [
      '../dev-docs/tasks.md',
      '../dev-docs/plan.md',
      '../config/rules_forense_v2.json',
      '../consolidated-tests/'
    ];

    let forensicAnalysisComplete = true;
    forensicFiles.forEach(file => {
      if (!fs.existsSync(file)) {
        console.log(`⚠️ Archivo forense no encontrado: ${file}`);
        forensicAnalysisComplete = false;
      } else {
        console.log(`✅ Análisis forense disponible: ${file}`);
      }
    });

    if (forensicAnalysisComplete) {
      console.log('✅ Conexión con análisis forense validada');
    } else {
      this.addWarning(
        'FORENSIC_ANALYSIS_INCOMPLETE',
        'Análisis forense no está completamente disponible'
      );
    }
  }

  /**
   * Valida disponibilidad de herramientas
   */
  validateToolAvailability() {
    console.log('\n🔍 Validando disponibilidad de herramientas...');

    const requiredTools = ['node', 'npm'];
    requiredTools.forEach(tool => {
      try {
        const { execSync } = require('child_process');
        execSync(`${tool} --version`, { stdio: 'ignore' });
        console.log(`✅ Herramienta disponible: ${tool}`);
      } catch (error) {
        this.addCriticalIssue(
          'TOOL_UNAVAILABLE',
          `Herramienta no disponible: ${tool}`
        );
      }
    });
  }

  /**
   * Valida consistencia entre documentos
   */
  validateDocumentConsistency() {
    console.log('\n🔍 Validando consistencia entre documentos...');

    try {
      const tasksContent = fs.readFileSync('dev-docs/tasks.md', 'utf8');
      const planContent = fs.readFileSync('dev-docs/plan.md', 'utf8');
      const contextContent = fs.readFileSync('dev-docs/context.md', 'utf8');

      // Validar que todos mencionen rules_refact.json
      const documents = [tasksContent, planContent, contextContent];
      documents.forEach((content, index) => {
        const docName = ['tasks.md', 'plan.md', 'context.md'][index];
        if (!content.includes('rules_refact.json')) {
          this.addWarning(
            'INCONSISTENT_REFERENCE',
            `${docName} no menciona rules_refact.json`
          );
        }
      });

      console.log('✅ Consistencia básica validada');
    } catch (error) {
      this.addCriticalIssue(
        'CONSISTENCY_CHECK_ERROR',
        `Error en validación de consistencia: ${error.message}`
      );
    }
  }

  /**
   * Agrega issue crítico
   */
  addCriticalIssue(type, description) {
    const issue = {
      type: 'CRITICAL',
      category: type,
      description,
      timestamp: this.timestamp,
      severity: 'BLOCKING'
    };

    this.criticalIssues.push(issue);
    this.validationResults.push(issue);
    console.log(`❌ CRÍTICO: ${description}`);
  }

  /**
   * Agrega warning
   */
  addWarning(type, description) {
    const warning = {
      type: 'WARNING',
      category: type,
      description,
      timestamp: this.timestamp,
      severity: 'ATTENTION'
    };

    this.warnings.push(warning);
    this.validationResults.push(warning);
    console.log(`⚠️ ADVERTENCIA: ${description}`);
  }

  /**
   * Genera reporte de validación
   */
  generateValidationReport() {
    const report = {
      timestamp: this.timestamp,
      summary: {
        totalIssues: this.validationResults.length,
        criticalIssues: this.criticalIssues.length,
        warnings: this.warnings.length,
        preparationStatus:
          this.criticalIssues.length === 0 ? 'READY' : 'NOT_READY'
      },
      validationResults: this.validationResults,
      criticalIssues: this.criticalIssues,
      warnings: this.warnings,
      recommendation: this.getRecommendation()
    };

    return report;
  }

  /**
   * Determina recomendación basada en validación
   */
  getRecommendation() {
    if (this.criticalIssues.length > 0) {
      return {
        action: 'BLOCK',
        message:
          'Preparación incompleta - Corregir issues críticos antes de continuar',
        priorityIssues: this.criticalIssues.slice(0, 3)
      };
    } else if (this.warnings.length > 5) {
      return {
        action: 'PROCEED_WITH_CAUTION',
        message:
          'Preparación completa con advertencias - Monitorear continuamente',
        priorityWarnings: this.warnings.slice(0, 3)
      };
    } else {
      return {
        action: 'PROCEED',
        message: 'Preparación completa y validada - Listo para Phase 1',
        status: 'READY'
      };
    }
  }

  /**
   * Ejecuta validación completa
   */
  run() {
    console.log('🚀 Iniciando Validación de Preparación para Refactorización');
    console.log('⚠️  ESTA VALIDACIÓN ES OBLIGATORIA antes de comenzar Phase 1');
    console.log(`📅 Timestamp: ${this.timestamp}`);

    try {
      // Validaciones obligatorias
      this.validateDirectoryStructure();
      this.validateRequiredFiles();
      this.validateForensicAnalysisConnection();
      this.validateToolAvailability();
      this.validateDocumentConsistency();

      // Generar reporte
      const report = this.generateValidationReport();

      // Mostrar resultados
      console.log('\n📊 Resultados de Validación:');
      console.log(`Total de Issues: ${report.summary.totalIssues}`);
      console.log(`Issues Críticos: ${report.summary.criticalIssues}`);
      console.log(`Advertencias: ${report.summary.warnings}`);
      console.log(`Estado de Preparación: ${report.summary.preparationStatus}`);

      // Mostrar recomendación
      console.log('\n💡 Recomendación:');
      console.log(`${report.recommendation.message}`);

      if (report.recommendation.action === 'BLOCK') {
        console.log('\n🚨 ACCIÓN REQUERIDA:');
        console.log(
          '❌ Corregir los siguientes issues críticos antes de continuar:'
        );
        report.recommendation.priorityIssues.forEach((issue, index) => {
          console.log(`   ${index + 1}. ${issue.description}`);
        });
        console.log('\n💡 Ejecutar correcciones:');
        console.log('1. Crear archivos o directorios faltantes');
        console.log('2. Completar configuración requerida');
        console.log('3. Validar conexión con análisis forense');
        console.log('4. Ejecutar nuevamente: npm run validate:preparation');

        process.exit(1);
      } else if (report.recommendation.action === 'PROCEED_WITH_CAUTION') {
        console.log('\n⚠️ ACCIÓN RECOMENDADA:');
        console.log(
          '✅ Preparación completa, pero monitorear las advertencias:'
        );
        report.recommendation.priorityWarnings.forEach((warning, index) => {
          console.log(`   ${index + 1}. ${warning.description}`);
        });

        console.log('\n✅ Listo para comenzar Phase 1: Analysis & Planning');
        console.log('💡 Ejecutar: npm run phase:1-start');

        process.exit(0);
      } else {
        console.log('\n✅ VALIDACIÓN COMPLETADA EXITOSAMENTE');
        console.log('✅ Sistema completamente preparado para refactorización');
        console.log('✅ Conexión con análisis forense validada');
        console.log('✅ Todas las herramientas disponibles');
        console.log('✅ Documentación consistente');

        console.log('\n🚀 LISTO PARA COMENZAR PHASE 1');
        console.log('💡 Ejecutar: npm run phase:1-start');

        return report;
      }
    } catch (error) {
      console.error('\n❌ Error en validación de preparación:', error.message);
      process.exit(1);
    }
  }
}

// Ejecución principal
if (require.main === module) {
  const validator = new PreparationValidator();
  validator.run();
}

module.exports = { PreparationValidator };
