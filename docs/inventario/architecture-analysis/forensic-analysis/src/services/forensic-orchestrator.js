#!/usr/bin/env node

/**
 * Forensic Orchestrator
 * Inspired by daemon patterns - coordinates forensic analysis workflow
 * Simple service orchestration with event-driven coordination
 */

const path = require('path');
const { ForensicEventService } = require('./forensic-event-service');
const {
  SafeForensicOperations
} = require('../resilience/forensic-circuit-breaker');

class ForensicOrchestrator {
  constructor(options = {}) {
    this.targetPath = options.targetPath || process.cwd();
    this.outputPath = options.outputPath || path.join(process.cwd(), 'reports');
    this.eventService = new ForensicEventService(options.eventService);
    this.safeOperations = new SafeForensicOperations();
    this.analysisPhases = [
      'PRE_VALIDATION',
      'STRUCTURE_ANALYSIS',
      'DEPENDENCY_ANALYSIS',
      'QUALITY_ANALYSIS',
      'REPORT_GENERATION'
    ];
    this.currentPhase = null;
    this.sessionId = null;
  }

  /**
   * Ejecuta análisis forense completo coordinado
   * @param {Object} context - Contexto del análisis
   * @returns {Object} - Resultados del análisis
   */
  async executeForensicAnalysis(context = {}) {
    try {
      console.log('🚀 Starting Forensic Analysis Orchestration');

      // Iniciar sesión
      await this.eventService.startSession({
        targetPath: this.targetPath,
        outputPath: this.outputPath,
        ...context
      });

      // Ejecutar fases coordinadas
      const results = {};

      for (const phase of this.analysisPhases) {
        this.currentPhase = phase;
        await this.eventService.logProgress(phase, 0);

        try {
          results[phase] = await this.executePhase(phase, context);
          await this.eventService.logProgress(phase, 100);

          // Registrar éxito de fase
          await this.eventService.publishEvent(
            'PHASE_COMPLETED',
            {
              phase,
              results: results[phase],
              timestamp: new Date().toISOString()
            },
            {
              category: 'WORKFLOW',
              severity: 'INFO'
            }
          );
        } catch (phaseError) {
          await this.eventService.logError(phaseError, phase, 'HIGH');
          results[phase] = {
            success: false,
            error: phaseError.message,
            timestamp: new Date().toISOString()
          };

          // Decidir si continuar con siguientes fases
          if (!this.shouldContinueAfterError(phase, phaseError)) {
            break;
          }
        }
      }

      // Generar reporte final
      const finalReport = await this.generateFinalReport(results, context);

      // Finalizar sesión
      await this.eventService.endSession({
        success: true,
        results,
        finalReport
      });

      console.log('✅ Forensic Analysis Completed Successfully');
      return finalReport;
    } catch (error) {
      await this.eventService.logError(error, 'ORCHESTRATION', 'CRITICAL');
      await this.eventService.endSession({
        success: false,
        error: error.message
      });

      console.error('❌ Forensic Analysis Failed:', error.message);
      throw error;
    }
  }

  /**
   * Ejecuta una fase específica del análisis
   * @param {string} phase - Fase a ejecutar
   * @param {Object} context - Contexto del análisis
   * @returns {Object} - Resultados de la fase
   */
  async executePhase(phase, context) {
    console.log(`  🔄 Executing phase: ${phase}`);

    switch (phase) {
      case 'PRE_VALIDATION':
        return await this.executePreValidation(context);
      case 'STRUCTURE_ANALYSIS':
        return await this.executeStructureAnalysis(context);
      case 'DEPENDENCY_ANALYSIS':
        return await this.executeDependencyAnalysis(context);
      case 'QUALITY_ANALYSIS':
        return await this.executeQualityAnalysis(context);
      case 'REPORT_GENERATION':
        return await this.executeReportGeneration(context);
      default:
        throw new Error(`Unknown phase: ${phase}`);
    }
  }

  /**
   * Fase de pre-validación
   * @param {Object} context - Contexto
   * @returns {Object} - Resultados de pre-validación
   */
  async executePreValidation(context) {
    const startTime = Date.now();

    try {
      // Validar existencia del target
      const fs = require('fs');
      if (!fs.existsSync(this.targetPath)) {
        throw new Error(`Target path does not exist: ${this.targetPath}`);
      }

      // Validar que sea un directorio
      const stats = fs.statSync(this.targetPath);
      if (!stats.isDirectory()) {
        throw new Error(`Target is not a directory: ${this.targetPath}`);
      }

      // Validar acceso de lectura
      fs.readdirSync(this.targetPath);

      // Validar espacio en disco para reportes
      this.ensureOutputDirectory();

      return {
        success: true,
        targetValidated: true,
        outputDirectoryValidated: true,
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Fase de análisis estructural
   * @param {Object} context - Contexto
   * @returns {Object} - Resultados del análisis estructural
   */
  async executeStructureAnalysis(context) {
    const startTime = Date.now();

    try {
      // Usar detector simple de arquitectura
      const {
        SimpleArchitecturalDetector
      } = require('../detection/simple-architectural-detector');
      const detector = new SimpleArchitecturalDetector({
        targetPath: this.targetPath
      });

      const structureResults = await detector.detectArchitecturalIssues();

      // Registrar hallazgos como eventos
      if (structureResults.issues) {
        for (const issue of structureResults.issues) {
          await this.eventService.logFinding(issue, issue.severity);
        }
      }

      // Registrar métricas
      await this.eventService.logMetrics(structureResults.metrics);

      return {
        success: true,
        issues: structureResults.issues,
        metrics: structureResults.metrics,
        summary: structureResults.summary,
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Fase de análisis de dependencias
   * @param {Object} context - Contexto
   * @returns {Object} - Resultados del análisis de dependencias
   */
  async executeDependencyAnalysis(context) {
    const startTime = Date.now();

    try {
      // Usar operaciones seguras para análisis de dependencias
      const depAnalysis = await this.safeOperations.safeAnalyzeDependencies(
        this.targetPath
      );

      const dependencyIssues = [];

      // Validar número de dependencias
      if (depAnalysis.total > 100) {
        dependencyIssues.push({
          type: 'HIGH_DEPENDENCY_COUNT',
          severity: 'HIGH',
          description: `Too many dependencies: ${depAnalysis.total}`,
          value: depAnalysis.total,
          recommendation: 'Review and reduce dependencies'
        });
      }

      // Registrar hallazgos
      for (const issue of dependencyIssues) {
        await this.eventService.logFinding(issue, issue.severity);
      }

      return {
        success: true,
        dependencies: depAnalysis,
        issues: dependencyIssues,
        totalDependencies: depAnalysis.total,
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Fase de análisis de calidad
   * @param {Object} context - Contexto
   * @returns {Object} - Resultados del análisis de calidad
   */
  async executeQualityAnalysis(context) {
    const startTime = Date.now();

    try {
      const qualityResults = {
        codeQuality: 'UNKNOWN',
        documentationQuality: 'UNKNOWN',
        testingQuality: 'UNKNOWN',
        securityQuality: 'UNKNOWN'
      };

      // Análisis simple de calidad
      const fs = require('fs');
      const path = require('path');

      // Verificar archivos de configuración de calidad
      const qualityConfigs = [
        '.eslintrc.json',
        '.prettierrc',
        'jest.config.js',
        'tsconfig.json'
      ];
      const foundConfigs = qualityConfigs.filter(config =>
        fs.existsSync(path.join(this.targetPath, config))
      );

      if (foundConfigs.length >= 2) {
        qualityResults.codeQuality = 'GOOD';
      } else if (foundConfigs.length === 1) {
        qualityResults.codeQuality = 'FAIR';
      } else {
        qualityResults.codeQuality = 'POOR';
      }

      // Verificar documentación
      const readmePath = path.join(this.targetPath, 'README.md');
      if (fs.existsSync(readmePath)) {
        qualityResults.documentationQuality = 'GOOD';
      } else {
        qualityResults.documentationQuality = 'POOR';
      }

      // Verificar configuración de tests
      const testConfigs = [
        'jest.config.js',
        'vitest.config.js',
        'karma.conf.js'
      ];
      const hasTestConfig = testConfigs.some(config =>
        fs.existsSync(path.join(this.targetPath, config))
      );

      if (hasTestConfig) {
        qualityResults.testingQuality = 'FAIR'; // Podríamos analizar archivos de tests
      } else {
        qualityResults.testingQuality = 'POOR';
      }

      // Verificar seguridad básica
      const gitignorePath = path.join(this.targetPath, '.gitignore');
      if (fs.existsSync(gitignorePath)) {
        qualityResults.securityQuality = 'FAIR';
      } else {
        qualityResults.securityQuality = 'POOR';
      }

      // Generar issues de calidad
      const qualityIssues = [];
      Object.entries(qualityResults).forEach(([aspect, quality]) => {
        if (quality === 'POOR') {
          qualityIssues.push({
            type: 'POOR_QUALITY',
            severity: 'MEDIUM',
            description: `${aspect} quality is ${quality}`,
            value: quality,
            recommendation: `Improve ${aspect} practices`
          });
        }
      });

      // Registrar hallazgos
      for (const issue of qualityIssues) {
        await this.eventService.logFinding(issue, issue.severity);
      }

      return {
        success: true,
        qualityResults,
        issues: qualityIssues,
        foundConfigs,
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Fase de generación de reportes
   * @param {Object} context - Contexto
   * @returns {Object} - Resultados de la generación
   */
  async executeReportGeneration(context) {
    const startTime = Date.now();

    try {
      // Generar reporte combinado
      const reportPath = await this.generateCombinedReport(context);

      return {
        success: true,
        reportPath,
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Genera reporte final combinado
   * @param {Object} analysisResults - Resultados de todas las fases
   * @param {Object} context - Contexto original
   * @returns {string} - Ruta del reporte generado
   */
  async generateCombinedReport(analysisResults, context) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportFileName = `forensic-analysis-${timestamp}.md`;
    const reportPath = path.join(this.outputPath, reportFileName);

    // Generar contenido del reporte
    let reportContent = '# Forensic Analysis Report\n\n';
    reportContent += `**Generated**: ${new Date().toISOString()}\n`;
    reportContent += `**Target**: ${this.targetPath}\n`;
    reportContent += `**Session**: ${this.eventService.sessionId}\n\n`;

    // Resumen ejecutivo
    reportContent += '## Executive Summary\n\n';

    const successfulPhases = Object.entries(analysisResults).filter(
      ([_, result]) => result.success
    ).length;
    const totalPhases = Object.keys(analysisResults).length;

    reportContent += `- **Analysis Status**: ${successfulPhases}/${totalPhases} phases completed\n`;
    reportContent += `- **Overall Health**: ${successfulPhases === totalPhases ? 'GOOD' : 'NEEDS_ATTENTION'}\n\n`;

    // Resultados por fase
    reportContent += '## Phase Results\n\n';

    for (const [phase, result] of Object.entries(analysisResults)) {
      reportContent += `### ${phase.replace('_', ' ')}\n\n`;

      if (result.success) {
        reportContent += '✅ **Status**: Completed\n';
        reportContent += `⏱️ **Execution Time**: ${result.executionTime}ms\n`;

        if (result.issues && result.issues.length > 0) {
          reportContent += `⚠️ **Issues Found**: ${result.issues.length}\n`;

          result.issues.forEach((issue, index) => {
            const icon =
              issue.severity === 'HIGH'
                ? '🔴'
                : issue.severity === 'MEDIUM'
                  ? '🟡'
                  : '🟢';
            reportContent += `  ${icon} ${issue.type}: ${issue.description}\n`;
          });
        }

        if (result.metrics) {
          reportContent += '\n**Metrics**:\n';
          Object.entries(result.metrics).forEach(([key, value]) => {
            reportContent += `- ${key}: ${value}\n`;
          });
        }
      } else {
        reportContent += '❌ **Status**: Failed\n';
        reportContent += `🚫 **Error**: ${result.error}\n`;
        reportContent += `⏱️ **Execution Time**: ${result.executionTime}ms\n`;
      }

      reportContent += '\n';
    }

    // Recomendaciones
    reportContent += '## Recommendations\n\n';

    const allIssues = Object.values(analysisResults)
      .filter(result => result.issues)
      .flatMap(result => result.issues);

    if (allIssues.length === 0) {
      reportContent +=
        '🎉 **No issues found** - The project appears to be in good condition!\n\n';
    } else {
      const highSeverity = allIssues.filter(i => i.severity === 'HIGH');
      const mediumSeverity = allIssues.filter(i => i.severity === 'MEDIUM');
      const lowSeverity = allIssues.filter(i => i.severity === 'LOW');

      if (highSeverity.length > 0) {
        reportContent += '### 🔴 High Priority (Immediate Action Required)\n\n';
        highSeverity.forEach(issue => {
          reportContent += `- **${issue.type}**: ${issue.description}\n`;
          reportContent += `  - **Recommendation**: ${issue.recommendation}\n\n`;
        });
      }

      if (mediumSeverity.length > 0) {
        reportContent += '### 🟡 Medium Priority (Address Soon)\n\n';
        mediumSeverity.forEach(issue => {
          reportContent += `- **${issue.type}**: ${issue.description}\n`;
          reportContent += `  - **Recommendation**: ${issue.recommendation}\n\n`;
        });
      }

      if (lowSeverity.length > 0) {
        reportContent += '### 🟢 Low Priority (Nice to Have)\n\n';
        lowSeverity.forEach(issue => {
          reportContent += `- **${issue.type}**: ${issue.description}\n`;
          reportContent += `  - **Recommendation**: ${issue.recommendation}\n\n`;
        });
      }
    }

    // Usar safe operations para generar el reporte
    await this.safeOperations.safeGenerateReport(
      { content: reportContent, analysisResults },
      reportPath
    );

    console.log(`📄 Report generated: ${reportPath}`);
    return reportPath;
  }

  /**
   * Determina si continuar después de un error
   * @param {string} phase - Fase actual
   * @param {Error} error - Error ocurrido
   * @returns {boolean} - True si continuar
   */
  shouldContinueAfterError(phase, error) {
    // Fases críticas que detienen el análisis
    const criticalPhases = ['PRE_VALIDATION'];

    if (criticalPhases.includes(phase)) {
      return false;
    }

    // Errores de sistema críticos
    if (error.message.includes('EACCES') || error.message.includes('ENOENT')) {
      return false;
    }

    // Continuar con otras fases para recolectar la máxima información posible
    return true;
  }

  /**
   * Asegura que el directorio de salida exista
   */
  ensureOutputDirectory() {
    const fs = require('fs');
    if (!fs.existsSync(this.outputPath)) {
      fs.mkdirSync(this.outputPath, { recursive: true });
    }
  }

  /**
   * Imprime resumen de orquestación
   */
  async printOrchestrationSummary() {
    const sessionReport = await this.eventService.generateSessionReport();

    console.log('\n🎯 Forensic Orchestration Summary');
    console.log('==================================');

    console.log(`\n🆔 Session: ${sessionReport.sessionId}`);
    console.log(`⏱️  Duration: ${Math.round(sessionReport.duration / 1000)}s`);
    console.log(`📋 Total Events: ${sessionReport.totalEvents}`);

    if (sessionReport.findings.total > 0) {
      console.log(`\n🔍 Issues Found: ${sessionReport.findings.total}`);
    }

    if (sessionReport.errors.total > 0) {
      console.log(`\n❌ Errors: ${sessionReport.errors.total}`);
    }

    console.log('\n📊 Phase Status:');
    this.analysisPhases.forEach(phase => {
      const phaseEvent = sessionReport.phases[phase];
      const status = phaseEvent ? '✅' : '❌';
      console.log(`  ${status} ${phase}`);
    });
  }
}

module.exports = ForensicOrchestrator;

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const targetPath = args[0] || process.cwd();
  const outputPath = args[1] || path.join(process.cwd(), 'reports');

  const orchestrator = new ForensicOrchestrator({
    targetPath,
    outputPath
  });

  orchestrator
    .executeForensicAnalysis({ user: process.env.USER })
    .then(() => orchestrator.printOrchestrationSummary())
    .catch(error => {
      console.error('❌ Orchestration failed:', error.message);
      process.exit(1);
    });
}
