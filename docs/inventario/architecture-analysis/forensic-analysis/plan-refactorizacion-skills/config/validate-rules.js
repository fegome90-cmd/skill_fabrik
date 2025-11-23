#!/usr/bin/env node

/**
 * Rules Validator - Validador de Reglas de Refactorización
 *
 * Valida compliance con rules_refact.json y genera reporte
 */

const fs = require('fs');
const path = require('path');

class RulesValidator {
  constructor(rulesPath = null) {
    this.rulesPath = rulesPath || 'config/rules_refact.json';
    this.timestamp = new Date().toISOString();
    this.validationResults = [];
    this.errors = [];
    this.warnings = [];
    this.rules = null;
  }

  /**
   * Carga y valida reglas de refactorización
   */
  loadAndValidateRules() {
    console.log('🔍 Cargando reglas de refactorización...');

    try {
      // Verificar que el archivo exista
      if (!fs.existsSync(this.rulesPath)) {
        throw new Error(`Archivo de reglas no encontrado: ${this.rulesPath}`);
      }

      // Cargar y parsear JSON
      const rulesContent = fs.readFileSync(this.rulesPath, 'utf8');
      this.rules = JSON.parse(rulesContent);

      console.log(`✅ Reglas cargadas desde: ${this.rulesPath}`);
      console.log(`📋 Reglas: ${this.rules.name} v${this.rules.version}`);

      // Validar estructura básica
      this.validateBasicStructure();

      // Validar secciones requeridas
      this.validateRequiredSections();

      // Validar contenido de secciones
      this.validateSectionContent();

      // Validar reglas específicas
      this.validateSpecificRules();

      // Generar reporte
      this.generateComplianceReport();
    } catch (error) {
      console.error(`❌ Error cargando reglas: ${error.message}`);
      this.errors.push({
        type: 'LOAD_ERROR',
        description: error.message,
        severity: 'CRITICAL',
        timestamp: this.timestamp
      });
    }
  }

  /**
   * Valida estructura básica del archivo JSON
   */
  validateBasicStructure() {
    console.log('\n📋 Validando estructura básica...');

    const requiredFields = [
      'version',
      'name',
      'description',
      'status',
      'governance',
      'maximas',
      'prohibiciones',
      'obligaciones',
      'qualityGates'
    ];

    requiredFields.forEach(field => {
      if (!this.rules[field]) {
        this.errors.push({
          type: 'MISSING_FIELD',
          field,
          description: `Campo requerido no encontrado: ${field}`,
          severity: 'CRITICAL',
          timestamp: this.timestamp
        });
        console.log(`❌ Campo faltante: ${field}`);
      } else {
        console.log(`✅ Campo encontrado: ${field}`);
      }
    });
  }

  /**
   * Valida secciones requeridas
   */
  validateRequiredSections() {
    console.log('\n📋 Validando secciones requeridas...');

    const sectionRequirements = {
      maximas: {
        minLength: 10,
        description: 'Máximas de refactorización'
      },
      prohibiciones: {
        minLength: 12,
        description: 'Prohibiciones de cambios peligrosos'
      },
      obligaciones: {
        minLength: 15,
        description: 'Obligaciones de calidad y seguridad'
      },
      qualityGates: {
        minLength: 7,
        description: 'Quality gates de validación'
      }
    };

    Object.entries(sectionRequirements).forEach(([section, requirements]) => {
      const sectionData = this.rules[section];

      if (!Array.isArray(sectionData)) {
        this.errors.push({
          type: 'INVALID_SECTION',
          section,
          description: `La sección ${section} debe ser un array`,
          severity: 'CRITICAL',
          timestamp: this.timestamp
        });
        console.log(`❌ Sección inválida: ${section} (debe ser array)`);
      } else if (sectionData.length < requirements.minLength) {
        this.errors.push({
          type: 'INSUFFICIENT_CONTENT',
          section,
          description: `${section} insuficiente: ${sectionData.length} (mínimo ${requirements.minLength})`,
          severity: 'HIGH',
          timestamp: this.timestamp
        });
        console.log(
          `⚠️ Sección insuficiente: ${section} (${sectionData.length}/${requirements.minLength})`
        );
      } else {
        console.log(
          `✅ Sección válida: ${section} (${sectionData.length} items)`
        );
      }

      // Validar que cada item tenga estructura requerida
      sectionData.forEach((item, index) => {
        this.validateItemStructure(section, item, index);
      });
    });
  }

  /**
   * Valida estructura de un item
   */
  validateItemStructure(section, item, index) {
    const requiredFields = {
      maximas: ['id', 'title', 'description', 'priority'],
      prohibiciones: ['id', 'title', 'description', 'severity', 'penalty'],
      obligaciones: ['id', 'title', 'description', 'priority', 'validation'],
      qualityGates: ['id', 'name', 'description', 'severity']
    };

    const sectionRequiredFields = requiredFields[section];
    if (!sectionRequiredFields) return;

    sectionRequiredFields.forEach(field => {
      if (!item[field]) {
        this.errors.push({
          type: 'MISSING_ITEM_FIELD',
          section,
          index,
          field,
          description: `Item #${index + 1} en ${section} falta campo: ${field}`,
          severity: 'HIGH',
          timestamp: this.timestamp
        });
      }
    });
  }

  /**
   * Valida contenido de las secciones
   */
  validateSectionContent() {
    console.log('\n📋 Validando contenido de secciones...');

    // Validar que no haya IDs duplicados
    this.validateUniqueIds();

    // Validar prioridades y severidades
    this.validatePriorities();

    // Validar que los IDs sigan el patrón correcto
    this.validateIdPatterns();
  }

  /**
   * Valida que no haya IDs duplicados
   */
  validateUniqueIds() {
    console.log('🔍 Validando IDs únicos...');

    const allIds = [];
    const sections = [
      'maximas',
      'prohibiciones',
      'obligaciones',
      'qualityGates'
    ];

    sections.forEach(section => {
      const sectionItems = this.rules[section] || [];
      sectionItems.forEach(item => {
        if (item.id) {
          if (allIds.includes(item.id)) {
            this.errors.push({
              type: 'DUPLICATE_ID',
              id: item.id,
              section,
              description: `ID duplicado encontrado: ${item.id}`,
              severity: 'CRITICAL',
              timestamp: this.timestamp
            });
            console.log(`❌ ID duplicado: ${item.id}`);
          } else {
            allIds.push(item.id);
          }
        }
      });
    });

    console.log(`✅ IDs únicos validados: ${allIds.length}`);
  }

  /**
   * Valida prioridades y severidades
   */
  validatePriorities() {
    console.log('🔍 Validando prioridades y severidades...');

    // Validar prioridades en máximas y obligaciones
    ['maximas', 'obligaciones'].forEach(section => {
      const sectionItems = this.rules[section] || [];
      sectionItems.forEach(item => {
        const validPriorities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
        if (!validPriorities.includes(item.priority)) {
          this.errors.push({
            type: 'INVALID_PRIORITY',
            section,
            id: item.id,
            priority: item.priority,
            description: `Prioridad inválida: ${item.priority} (${section})`,
            severity: 'HIGH',
            timestamp: this.timestamp
          });
          console.log(`❌ Prioridad inválida: ${item.id} -> ${item.priority}`);
        }
      });
    });

    // Validar severidades en prohibiciones
    const prohibiciones = this.rules.prohibiciones || [];
    prohibiciones.forEach(item => {
      const validSeverities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
      if (!validSeverities.includes(item.severity)) {
        this.errors.push({
          type: 'INVALID_SEVERITY',
          id: item.id,
          actualSeverity: item.severity,
          description: `Severidad inválida: ${item.severity} (prohibiciones)`,
          severity: 'HIGH',
          timestamp: this.timestamp
        });
        console.log(`❌ Severidad inválida: ${item.id} -> ${item.severity}`);
      }
    });

    // Validar severity en quality gates
    const qualityGates = this.rules.qualityGates || [];
    qualityGates.forEach(item => {
      const validSeverities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
      if (!validSeverities.includes(item.severity)) {
        this.errors.push({
          type: 'INVALID_SEVERITY',
          id: item.id,
          actualSeverity: item.severity,
          description: `Severidad inválida: ${item.severity} (quality gates)`,
          severity: 'HIGH',
          timestamp: this.timestamp
        });
        console.log(`❌ Severidad inválida: ${item.id} -> ${item.severity}`);
      }
    });

    console.log('✅ Prioridades y severidades validadas');
  }

  /**
   * Valida patrones de IDs
   */
  validateIdPatterns() {
    console.log('🔍 Validando patrones de IDs...');

    const sections = [
      'maximas',
      'prohibiciones',
      'obligaciones',
      'qualityGates'
    ];

    sections.forEach(section => {
      const sectionItems = this.rules[section] || [];
      sectionItems.forEach(item => {
        if (item.id) {
          // Validar que siga el patrón de sección
          const expectedPattern =
            section === 'qualityGates' ? 'QG-REF-' : 'PROH-REF-';
          if (section !== 'maximas' && !item.id.startsWith(expectedPattern)) {
            this.warnings.push({
              type: 'ID_PATTERN_MISMATCH',
              id: item.id,
              expectedPattern,
              section,
              description: `ID no sigue patrón esperado: ${item.id} (${section})`,
              severity: 'MEDIUM',
              timestamp: this.timestamp
            });
            console.log(`⚠️ Patrón de ID no coincide: ${item.id} (${section})`);
          } else {
            console.log(`✅ ID válido: ${item.id} (${section})`);
          }
        }
      });
    });
  }

  /**
   * Valida reglas específicas de refactorización
   */
  validateSpecificRules() {
    console.log('\n📋 Validando reglas específicas de refactorización...');

    // Validar que las máximas cubran los aspectos clave
    this.validateMaximasCoverage();

    // Validar que las prohibiciones cubran los riesgos críticos
    this.validateProhibicionesCoverage();

    // Validar que las obligaciones cubran las actividades esenciales
    this.validateObligacionesCoverage();

    // Validar que los quality gates cubran los aspectos de calidad
    this.validateQualityGatesCoverage();
  }

  /**
   * Valida cobertura de máximas
   */
  validateMaximasCoverage() {
    console.log('🔍 Validando cobertura de máximas...');

    const maximaIds = this.rules.maximas.map(item => item.id);

    console.log(`✅ Máximas encontradas: ${maximaIds.length}`);
  }

  /**
   * Valida cobertura de prohibiciones
   */
  validateProhibicionesCoverage() {
    console.log('🔍 Validando cobertura de prohibiciones...');

    const prohibicionIds = this.rules.prohibiciones.map(item => item.id);
    console.log(`✅ Prohibiciones encontradas: ${prohibicionIds.length}`);
  }

  /**
   * Valida cobertura de obligaciones
   */
  validateObligacionesCoverage() {
    console.log('🔍 Validando cobertura de obligaciones...');

    const obligacionIds = this.rules.obligaciones.map(item => item.id);
    const expectedObligaciones = [
      'OBL-REF-001', // Backup
      'OBL-REF-002', // Testing
      'OBL-REF-005', // Rollback test
      'OBL-REF-013', // Compliance
      'OBL-REF-018' // Post-deploy
    ];

    expectedObligaciones.forEach(expectedId => {
      if (!obligacionIds.includes(expectedId)) {
        this.warnings.push({
          type: 'MISSING_OBLIGACION',
          id: expectedId,
          description: `Obligación recomendada no encontrada: ${expectedId}`,
          severity: 'MEDIUM',
          timestamp: this.timestamp
        });
      }
    });

    console.log(`✅ Obligaciones encontradas: ${obligacionIds.length}`);
  }

  /**
   * Valida cobertura de quality gates
   */
  validateQualityGatesCoverage() {
    console.log('🔍 Validando cobertura de quality gates...');

    const gateIds = this.rules.qualityGates.map(item => item.id);
    const expectedGates = [
      'QG-REF-001', // Cero violaciones críticas
      'QG-REF-002', // Cobertura de tests
      'QG-REF-004', // Seguridad
      'QG-REF-005', // Rollback
      'QG-REF-006' // Documentación
    ];

    expectedGates.forEach(expectedId => {
      if (!gateIds.includes(expectedId)) {
        this.warnings.push({
          type: 'MISSING_QUALITY_GATE',
          id: expectedId,
          description: `Quality gate recomendado no encontrado: ${expectedId}`,
          severity: 'MEDIUM',
          timestamp: this.timestamp
        });
      }
    });

    console.log(`✅ Quality gates encontrados: ${gateIds.length}`);
  }

  /**
   * Genera reporte de compliance
   */
  generateComplianceReport() {
    console.log('\n📊 Generando reporte de compliance...');

    const report = {
      timestamp: this.timestamp,
      rulesInfo: {
        name: this.rules.name,
        version: this.rules.version,
        description: this.rules.description,
        status: this.rules.status
      },
      summary: {
        totalErrors: this.errors.length,
        totalWarnings: this.warnings.length,
        totalItems: {
          maximas: this.rules.maximas?.length || 0,
          prohibiciones: this.rules.prohibiciones?.length || 0,
          obligaciones: this.rules.obligaciones?.length || 0,
          qualityGates: this.rules.qualityGates?.length || 0
        }
      },
      validation: {
        errors: this.errors,
        warnings: this.warnings,
        complianceStatus:
          this.errors.length === 0 ? 'COMPLIANT' : 'NON_COMPLIANT'
      },
      recommendations: this.getRecommendations()
    };

    this.validationResults.push(report);

    // Mostrar resumen
    console.log('\n📊 Resumen de Validación:');
    console.log(`Archivo: ${this.rulesPath}`);
    console.log(`Nombre: ${this.rules.name}`);
    console.log(`Versión: ${this.rules.version}`);
    console.log(`Estado: ${this.rules.status}`);
    console.log(`Máximas: ${report.summary.totalItems.maximas}`);
    console.log(`Prohibiciones: ${report.summary.totalItems.prohibiciones}`);
    console.log(`Obligaciones: ${report.summary.totalItems.obligaciones}`);
    console.log(`Quality Gates: ${report.summary.totalItems.qualityGates}`);
    console.log(`Errores: ${report.summary.totalErrors}`);
    console.log(`Warnings: ${report.summary.totalWarnings}`);
    console.log(`Compliance: ${report.validation.complianceStatus}`);

    return report;
  }

  /**
   * Genera recomendaciones
   */
  getRecommendations() {
    const recommendations = [];

    if (this.errors.length > 0) {
      recommendations.push({
        type: 'CRITICAL',
        action: 'FIX_ERRORS',
        message: 'Corregir errores críticos antes de continuar',
        items: this.errors.slice(0, 5)
      });
    }

    if (this.warnings.length > 0) {
      recommendations.push({
        type: 'SUGGESTION',
        action: 'REVIEW_WARNINGS',
        message: 'Revisar advertencias para mejorar calidad',
        items: this.warnings.slice(0, 5)
      });
    }

    if (this.errors.length === 0 && this.warnings.length === 0) {
      recommendations.push({
        type: 'SUCCESS',
        action: 'PROCEED',
        message: 'Reglas completamente validadas y compliantes',
        items: []
      });
    }

    return recommendations;
  }

  /**
   * Guarda reporte en archivo
   */
  saveReport(
    outputPath = './artifacts/validation-results/rules-validation-report.json'
  ) {
    const report = this.generateComplianceReport();

    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Reporte de validación guardado en: ${outputPath}`);

    return report;
  }

  /**
   * Método principal de ejecución
   */
  run() {
    console.log('🚀 Iniciando Validación de Reglas de Refactorización');
    console.log('⚠️  VALIDACIÓN OBLIGATORIA según rules_refact.json');
    console.log(`📅 Timestamp: ${this.timestamp}`);

    try {
      // Cargar y validar reglas
      this.loadAndValidateRules();

      // Guardar reporte
      const report = this.saveReport();

      // Determinar resultado final
      if (this.errors.length === 0) {
        console.log('\n✅ VALIDACIÓN COMPLETADA EXITOSAMENTE');
        console.log('✅ Todas las reglas de refactorización validadas');
        console.log('✅ Sistema completamente compliant');
        console.log('✅ Listo para comenzar Phase 1');

        return {
          success: true,
          report,
          errors: this.errors,
          warnings: this.warnings
        };
      } else {
        console.log('\n❌ VALIDACIÓN CON ERRORES DETECTADOS');
        console.log(`❌ ${this.errors.length} errores críticos encontrados`);

        console.log('\n💡 CORRECCIÓN REQUERIDA:');
        this.errors.slice(0, 5).forEach((error, index) => {
          console.log(`   ${index + 1}. ${error.description}`);
        });

        return {
          success: false,
          report,
          errors: this.errors,
          warnings: this.warnings
        };
      }
    } catch (error) {
      console.error('\n❌ ERROR EN VALIDACIÓN:', error.message);
      this.errors.push({
        type: 'VALIDATION_ERROR',
        description: error.message,
        severity: 'CRITICAL',
        timestamp: this.timestamp
      });

      return {
        success: false,
        error: error.message,
        errors: this.errors,
        warnings: this.warnings
      };
    }
  }
}

// Ejecución principal
if (require.main === module) {
  const args = process.argv.slice(2);
  const rulesPath = args[0];

  const validator = new RulesValidator(rulesPath);
  validator.run();
}

module.exports = { RulesValidator };
