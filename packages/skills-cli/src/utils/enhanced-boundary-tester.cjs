/**
 * Enhanced Boundary Testing System
 * Sistema mejorado para testing de casos límite con detección inteligente
 * Objetivo: Reducir violaciones críticas a < 10 y falsos positivos
 * Basado en database-verification skill
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class EnhancedBoundaryTester {
  constructor(options = {}) {
    this.maxCriticalViolations = options.maxCriticalViolations || 10;
    this.confidenceThreshold = options.confidenceThreshold || 0.8;
    this.contextAware = options.contextAware || true;
    this.adaptiveThresholds = options.adaptiveThresholds || true;
    this.testScenarios = this.defineEnhancedTestScenarios();
    this.violationPatterns = this.initializeViolationPatterns();
    this.contextAnalyzer = new ContextAnalyzer();
  }

  defineEnhancedTestScenarios() {
    return [
      {
        name: 'Database Operation Boundaries',
        category: 'database',
        critical: true,
        tests: [
          {
            name: 'Massive Delete Detection',
            pattern: /deleteMany\(\s*\{[^}]*\}\s*\)|\.deleteMany\(\)/gi,
            contextRequired: true,
            confidence: 0.95,
            exceptions: [
              'WHERE clause present',
              'Soft delete pattern',
              'Transactional context'
            ]
          },
          {
            name: 'Unrestricted Query Detection',
            pattern: /\.(findMany|findAll)\(\s*(\{[^}]*\})?\s*\);?\s*$/gi,
            contextRequired: true,
            confidence: 0.85,
            exceptions: [
              'Limit clause present',
              'Service layer abstraction',
              'Read-only operation'
            ]
          }
        ]
      },
      {
        name: 'Security Boundary Testing',
        category: 'security',
        critical: true,
        tests: [
          {
            name: 'Hardcoded Secret Detection',
            pattern: /(password|secret|token|key|credential)[\s]*[:=][\s]*["'][^"']+["']/gi,
            contextRequired: false,
            confidence: 0.98,
            exceptions: [
              'Environment variable pattern',
              'Example or test code',
              'Template placeholder'
            ]
          },
          {
            name: 'Unsafe Eval Detection',
            pattern: /eval\s*\(|Function\s*\(/gi,
            contextRequired: true,
            confidence: 0.90,
            exceptions: [
              'JSON parsing context',
              'Template engine',
              'Configuration parsing'
            ]
          }
        ]
      },
      {
        name: 'Performance Boundary Testing',
        category: 'performance',
        critical: false,
        tests: [
          {
            name: 'Infinite Loop Detection',
            pattern: /for\s*\([^)]*\)\s*\{[^}]*\}[^}]*\{[^}]*\}/gi,
            contextRequired: true,
            confidence: 0.70,
            exceptions: [
              'Nested iteration with different indices',
              'Map/Reduce pattern'
            ]
          },
          {
            name: 'Memory Leak Pattern',
            pattern: /new\s+Array\s*\(\s*\d*\s*\)\s*\.\s*push.*for\s+loop/gi,
            contextRequired: true,
            confidence: 0.75,
            exceptions: [
              'Fixed-size buffer pattern',
              'Memory management context'
            ]
          }
        ]
      },
      {
        name: 'Input Validation Boundaries',
        category: 'validation',
        critical: true,
        tests: [
          {
            name: 'SQL Injection Vulnerability',
            pattern: /\$\{[^}]*\}.*SELECT|SELECT.*\$\{[^}]*\}/gi,
            contextRequired: true,
            confidence: 0.95,
            exceptions: [
              'Parameterized query',
              'ORM abstraction',
              'String concatenation with proper escaping'
            ]
          },
          {
            name: 'Path Traversal Detection',
            pattern: /\.\.[\.\/]*\/etc\/passwd|\.\.[\.\/]*\/windows\/system32/gi,
            contextRequired: true,
            confidence: 0.90,
            exceptions: [
              'Sanitized input pattern',
              'Path validation present'
            ]
          }
        ]
      }
    ];
  }

  initializeViolationPatterns() {
    return {
      // High severity patterns
      critical: [
        {
          name: 'Massive Data Deletion',
          pattern: /deleteMany\(\s*\{[^}]*\}\s*\)/gi,
          description: 'Potential massive data deletion without constraints',
          severity: 'critical'
        },
        {
          name: 'Unrestricted Database Access',
          pattern: /\.(findMany|findAll)\(\s*(\{[^}]*\})?\s*\);?\s*$/gi,
          description: 'Database access without proper constraints',
          severity: 'critical'
        },
        {
          name: 'Hardcoded Credentials',
          pattern: /(password|secret|token|key)[\s]*[:=][\s]*["'][^"']+["']/gi,
          description: 'Hardcoded sensitive credentials in code',
          severity: 'critical'
        }
      ],
      // Medium severity patterns
      warning: [
        {
          name: 'Complex Query Without Optimization',
          pattern: /SELECT\s+\*.*FROM.*WHERE.*ORDER\s+BY/gi,
          description: 'Complex query without proper optimization',
          severity: 'warning'
        },
        {
          name: 'Potential Memory Issue',
          pattern: /new\s+Array\s*\(\s*\d+\s*\)/gi,
          description: 'Large array allocation that may cause memory issues',
          severity: 'warning'
        }
      ],
      // Low severity patterns
      info: [
        {
          name: 'Debug Code Present',
          pattern: /(console\.log|debugger|alert)\(/gi,
          description: 'Debug code found in production',
          severity: 'info'
        }
      ]
    };
  }

  /**
   * Ejecuta prueba mejorada de boundary testing
   */
  async runEnhancedBoundaryTest(filePath, options = {}) {
    console.log(`🔍 Running Enhanced Boundary Testing: ${filePath}`);
    console.log(`🎯 Target: < ${this.maxCriticalViolations} critical violations`);

    const startTime = Date.now();

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const context = this.contextAnalyzer.analyzeFile(content, filePath);

      const testResults = [];

      for (const scenario of this.testScenarios) {
        console.log(`\n🧪 Testing: ${scenario.name}`);

        const scenarioResults = {
          scenario: scenario.name,
          category: scenario.category,
          critical: scenario.critical,
          tests: [],
          totalViolations: 0,
          criticalViolations: 0,
          falsePositives: 0,
          duration: 0
        };

        const scenarioStartTime = Date.now();

        for (const test of scenario.tests) {
          const testResult = await this.executeBoundaryTest(content, test, context, filePath);
          scenarioResults.tests.push(testResult);

          if (testResult.violations.length > 0) {
            scenarioResults.totalViolations += testResult.violations.length;

            // Clasificar violaciones
            testResult.violations.forEach(violation => {
              if (violation.severity === 'critical') {
                scenarioResults.criticalViolations++;
              }
            });
          }

          scenarioResults.falsePositives += testResult.falsePositives || 0;
        }

        scenarioResults.duration = Date.now() - scenarioStartTime;

        console.log(`   Violations: ${scenarioResults.totalViolations} (${scenarioResults.criticalViolations} critical)`);
        console.log(`   False Positives: ${scenarioResults.falsePositives}`);
        console.log(`   Duration: ${scenarioResults.duration}ms`);

        testResults.push(scenarioResults);
      }

      const totalDuration = Date.now() - startTime;
      const summary = this.generateTestSummary(testResults, totalDuration);

      console.log(`\n📊 Enhanced Boundary Testing Summary:`);
      console.log(`   Total Tests: ${summary.totalTests}`);
      console.log(`   Total Violations: ${summary.totalViolations}`);
      console.log(`   Critical Violations: ${summary.criticalViolations}`);
      console.log(`   False Positives: ${summary.falsePositives}`);
      console.log(`   Accuracy Rate: ${summary.accuracyRate}%`);
      console.log(`   Duration: ${summary.totalDuration}ms`);
      console.log(`   Status: ${summary.success ? '✅ TARGET MET' : '❌ TARGET NOT MET'}`);

      // Generar reporte detallado
      const report = this.generateEnhancedReport(filePath, testResults, summary, context);
      this.saveReport(report, filePath);

      return {
        success: summary.success,
        summary,
        testResults,
        context,
        report
      };

    } catch (error) {
      console.error(`❌ Enhanced boundary testing failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Ejecuta una prueba de boundary específica
   */
  async executeBoundaryTest(content, test, context, filePath) {
    const results = {
      test: test.name,
      violations: [],
      falsePositives: 0,
      confidence: 0,
      details: []
    };

    // Encontrar todas las coincidencias del patrón
    const matches = [];
    let match;
    const pattern = new RegExp(test.pattern, 'gi');

    while ((match = pattern.exec(content)) !== null) {
      const lineInfo = this.getLineInfo(content, match.index);
      matches.push({
        index: match.index,
        line: lineInfo.line,
        column: lineInfo.column,
        match: match[0],
        context: this.extractContext(content, match.index, 3)
      });
    }

    // Analizar cada coincidencia
    for (const match of matches) {
      const analysis = await this.analyzeViolation(match, test, context, filePath);

      if (analysis.isViolation) {
        results.violations.push({
          type: test.name,
          severity: this.determineSeverity(test, analysis),
          line: match.line,
          column: match.column,
          pattern: match.match,
          context: match.context,
          confidence: analysis.confidence,
          explanation: analysis.explanation,
          recommendation: analysis.recommendation
        });

        results.confidence = Math.max(results.confidence, analysis.confidence);
      } else {
        results.falsePositives++;
      }

      results.details.push(analysis);
    }

    return results;
  }

  /**
   * Analiza una posible violación
   */
  async analyzeViolation(match, test, context, filePath) {
    const analysis = {
      isViolation: true,
      confidence: test.confidence,
      explanation: '',
      recommendation: '',
      mitigatingFactors: [],
      riskLevel: 'medium'
    };

    // Verificar excepciones
    for (const exception of test.exceptions || []) {
      if (this.exceptionApplies(match.context, exception)) {
        analysis.isViolation = false;
        analysis.confidence *= 0.3; // Reducir confianza
        analysis.explanation = `Exception applies: ${exception}`;
        return analysis;
      }
    }

    // Análisis contextual si se requiere
    if (test.contextRequired) {
      const contextAnalysis = this.contextAnalyzer.analyzeContext(match, context);

      if (contextAnalysis.isSafeContext) {
        analysis.isViolation = false;
        analysis.confidence *= 0.4;
        analysis.explanation = `Safe context detected: ${contextAnalysis.reason}`;
        analysis.mitigatingFactors.push(contextAnalysis.reason);
      } else {
        analysis.confidence *= 1.2; // Aumentar confianza en contexto no seguro
        analysis.explanation = `Unsafe context: ${contextAnalysis.reason}`;
      }
    }

    // Análisis de contenido circundante
    const surroundingContent = this.extractSurroundingContent(
      context.fullContent,
      match.index,
      500 // 500 caracteres alrededor
    );

    if (this.hasMitigatingFactors(surroundingContent)) {
      analysis.confidence *= 0.7;
      analysis.mitigatingFactors.push('Mitigating patterns detected');
    }

    // Generar recomendación
    analysis.recommendation = this.generateRecommendation(test, analysis);

    return analysis;
  }

  /**
   * Verifica si una excepción aplica
   */
  exceptionApplies(context, exception) {
    const lowerContext = context.toLowerCase();
    const lowerException = exception.toLowerCase();

    return lowerContext.includes(lowerException) ||
           this.patternMatches(context, exception);
  }

  /**
   * Verifica si hay factores mitigantes
   */
  hasMitigatingFactors(content) {
    const mitigatingPatterns = [
      /validate\s+input/gi,
      /escape\s+string/gi,
      /parameterized/gi,
      /prepared\s+statement/gi,
      /sanitiz/gi,
      /check\s+permission/gi
    ];

    return mitigatingPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Genera recomendación basada en el análisis
   */
  generateRecommendation(test, analysis) {
    if (test.name.includes('Delete')) {
      return 'Add WHERE clause constraints or soft delete pattern';
    }
    if (test.name.includes('Secret')) {
      return 'Move credentials to environment variables or secure configuration';
    }
    if (test.name.includes('Query')) {
      return 'Add LIMIT clause and optimize with indexes';
    }
    if (test.name.includes('Eval')) {
      return 'Use safer alternatives like JSON.parse or specific parsers';
    }

    return 'Review and implement proper security controls';
  }

  /**
   * Determina la severidad de la violación
   */
  determineSeverity(test, analysis) {
    // Si el test es crítico y alta confianza
    if (test.critical && analysis.confidence > 0.8) {
      return 'critical';
    }

    // Basado en el tipo de patrón
    if (test.name.includes('Delete') || test.name.includes('Secret') || test.name.includes('Injection')) {
      return analysis.confidence > 0.7 ? 'critical' : 'high';
    }

    if (test.name.includes('Query') || test.name.includes('Loop')) {
      return analysis.confidence > 0.8 ? 'medium' : 'low';
    }

    return 'info';
  }

  /**
   * Genera resumen de la prueba
   */
  generateTestSummary(testResults, totalDuration) {
    const totalTests = testResults.length;
    const totalViolations = testResults.reduce((sum, result) => sum + result.totalViolations, 0);
    const criticalViolations = testResults.reduce((sum, result) => sum + result.criticalViolations, 0);
    const falsePositives = testResults.reduce((sum, result) => sum + result.falsePositives, 0);

    // Calcular tasa de precisión
    const totalDetections = totalViolations + falsePositives;
    const accuracyRate = totalDetections > 0
      ? Math.round(((totalDetections - falsePositives) / totalDetections) * 100)
      : 100;

    const success = criticalViolations <= this.maxCriticalViolations && accuracyRate >= 80;

    return {
      totalTests,
      totalViolations,
      criticalViolations,
      falsePositives,
      accuracyRate,
      totalDuration,
      success,
      targetMet: criticalViolations <= this.maxCriticalViolations,
      accuracyTargetMet: accuracyRate >= 80
    };
  }

  /**
   * Genera reporte mejorado
   */
  generateEnhancedReport(filePath, testResults, summary, context) {
    return {
      metadata: {
        testType: 'Enhanced Boundary Testing',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        targetCriticalViolations: this.maxCriticalViolations,
        confidenceThreshold: this.confidenceThreshold,
        contextAware: this.contextAware,
        adaptiveThresholds: this.adaptiveThresholds
      },
      file: {
        path: filePath,
        size: fs.statSync(filePath).size,
        lines: context.lineCount,
        languages: context.languages
      },
      summary,
      testResults,
      context,
      recommendations: this.generateRecommendations(summary),
      patterns: this.getPatternStatistics(testResults),
      improvements: this.getImprovementSuggestions(testResults)
    };
  }

  /**
   * Genera recomendaciones basadas en los resultados
   */
  generateRecommendations(summary) {
    const recommendations = [];

    if (summary.criticalViolations > this.maxCriticalViolations) {
      recommendations.push({
        priority: 'HIGH',
        type: 'CRITICAL_VIOLATIONS',
        message: `${summary.criticalViolations} critical violations exceed target of ${this.maxCriticalViolations}`,
        actionItems: [
          'Review and fix all critical security issues',
          'Implement proper input validation',
          'Add security controls and monitoring'
        ]
      });
    }

    if (summary.accuracyRate < 80) {
      recommendations.push({
        priority: 'MEDIUM',
        type: 'ACCURACY_IMPROVEMENT',
        message: `Low accuracy rate (${summary.accuracyRate}%) indicates false positives or missed violations`,
        actionItems: [
          'Fine-tune detection patterns',
          'Add more contextual analysis',
          'Review exception handling logic'
        ]
      });
    }

    const highFailureScenarios = testResults.filter(r => r.criticalViolations > 0);
    if (highFailureScenarios.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        type: 'SCENARIO_IMPROVEMENT',
        message: `${highFailureScenarios.length} scenarios have critical violations`,
        actionItems: highFailureScenarios.map(sc => `Improve ${sc.category} boundary testing logic`)
      });
    }

    return recommendations;
  }

  /**
   * Obtiene estadísticas de patrones
   */
  getPatternStatistics(testResults) {
    const patternStats = {};

    testResults.forEach(result => {
      result.tests.forEach(test => {
        const testName = test.test;
        if (!patternStats[testName]) {
          patternStats[testName] = {
            category: result.category,
            violations: 0,
            critical: 0,
            averageConfidence: 0
          };
        }

        patternStats[testName].violations += test.violations.length;
        patternStats[testName].critical += test.violations.filter(v => v.severity === 'critical').length;

        if (test.violations.length > 0) {
          const avgConfidence = test.violations.reduce((sum, v) => sum + v.confidence, 0) / test.violations.length;
          patternStats[testName].averageConfidence = avgConfidence;
        }
      });
    });

    return patternStats;
  }

  /**
   * Obtiene sugerencias de mejora
   */
  getImprovementSuggestions(testResults) {
    const suggestions = [];

    // Analizar patrones con baja precisión
    Object.entries(this.getPatternStatistics(testResults)).forEach(([pattern, stats]) => {
      if (stats.violations > 0 && stats.averageConfidence < 0.7) {
        suggestions.push({
          pattern,
          issue: 'Low confidence detection',
          suggestion: 'Improve pattern matching and add more contextual analysis',
          potentialImpact: 'Reduce false positives'
        });
      }
    });

    return suggestions;
  }

  /**
   * Guarda reporte en archivo
   */
  saveReport(report, filePath) {
    const reportsDir = path.join(path.dirname(filePath), 'boundary-results');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const reportPath = path.join(reportsDir, `enhanced-boundary-report-${timestamp}.json`);

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Report saved to: ${reportPath}`);

    // También guardar versión markdown
    const markdownPath = path.join(reportsDir, `enhanced-boundary-summary-${timestamp}.md`);
    const markdown = this.generateMarkdownSummary(report);
    fs.writeFileSync(markdownPath, markdown);
    console.log(`📄 Summary saved to: ${markdownPath}`);

    return reportPath;
  }

  /**
   * Genera resumen en Markdown
   */
  generateMarkdownSummary(report) {
    return `# Enhanced Boundary Testing Report
**File:** ${report.file.path}
**Date:** ${new Date(report.metadata.timestamp).toLocaleString()}
**Duration:** ${report.summary.totalDuration}ms

## Executive Summary

- **Target Critical Violations:** ${report.metadata.targetCriticalViolations}
- **Critical Violations Found:** ${report.summary.criticalViolations}
- **Total Violations:** ${report.summary.totalViolations}
- **False Positives:** ${report.summary.falsePositives}
- **Accuracy Rate:** ${report.summary.accuracyRate}%
- **Status:** ${report.summary.success ? '✅ TARGET MET' : '❌ TARGET NOT MET'}

## Test Results

| Scenario | Category | Critical | Total | False Positives |
|----------|----------|----------|--------|-----------------|
${report.testResults.map(r =>
  `| ${r.scenario} | ${r.category} | ${r.criticalViolations} | ${r.totalViolations} | ${r.falsePositives} |`
).join('\n')}

## Pattern Statistics

| Pattern | Category | Violations | Critical | Avg Confidence |
|---------|----------|------------|----------|----------------|
${Object.entries(report.patterns).map(([pattern, stats]) =>
  `| ${pattern} | ${stats.category} | ${stats.violations} | ${stats.critical} | ${(stats.averageConfidence * 100).toFixed(1)}% |`
).join('\n')}

## Recommendations

${report.recommendations.map(rec => `
### ${rec.priority} - ${rec.type}

**Issue:** ${rec.message}

**Action Items:**
${rec.actionItems.map(item => `- ${item}`).join('\n')}
`).join('\n')}

## Improvement Suggestions

${report.improvements.map(sugg => `
- **${sugg.pattern}**: ${sugg.suggestion} (Potential impact: ${sugg.potentialImpact})
`).join('\n')}

---

*Generated by Enhanced Boundary Testing System v2.0.0*
`;
  }

  // Métodos de utilidad
  getLineInfo(content, index) {
    const lines = content.substring(0, index).split('\n');
    const line = lines.length;
    const column = lines[lines.length - 1].length + 1;
    return { line, column };
  }

  extractContext(content, index, lines = 3) {
    const start = Math.max(0, index - 100);
    const end = Math.min(content.length, index + 100);
    return content.substring(start, end);
  }

  extractSurroundingContent(content, index, window) {
    const start = Math.max(0, index - window);
    const end = Math.min(content.length, index + window);
    return content.substring(start, end);
  }

  patternMatches(content, pattern) {
    try {
      const regex = new RegExp(pattern, 'gi');
      return regex.test(content);
    } catch {
      return content.includes(pattern);
    }
  }
}

/**
 * Context Analyzer for Enhanced Testing
 */
class ContextAnalyzer {
  constructor() {
    this.safeContexts = [
      'test', 'spec', 'mock', 'example', 'sample',
      'validate', 'sanitize', 'escape', 'prepare'
    ];
  }

  analyzeFile(content, filePath) {
    return {
      filePath,
      fullContent: content,
      lineCount: content.split('\n').length,
      languages: this.detectLanguages(content, filePath),
      fileType: path.extname(filePath),
      hasTests: this.containsTestPatterns(content),
      hasValidation: this.containsValidationPatterns(content)
    };
  }

  analyzeContext(match, context) {
    const surrounding = match.context.toLowerCase();

    // Verificar contextos seguros
    const isSafeContext = this.safeContexts.some(safe =>
      surrounding.includes(safe)
    );

    // Verificar patrones de seguridad
    const hasSecurityPatterns = this.containsSecurityPatterns(surrounding);
    const hasValidation = this.containsValidationPatterns(surrounding);

    return {
      isSafeContext,
      hasSecurityPatterns,
      hasValidation,
      confidence: this.calculateContextConfidence(isSafeContext, hasSecurityPatterns, hasValidation),
      reason: this.getContextReason(isSafeContext, hasSecurityPatterns, hasValidation)
    };
  }

  detectLanguages(content, filePath) {
    const languages = [];

    if (content.includes('class ') || content.includes('function ') || content.includes('const ')) {
      languages.push('javascript');
    }

    if (content.includes('SELECT ') || content.includes('INSERT ') || content.includes('UPDATE ')) {
      languages.push('sql');
    }

    if (content.includes('import ') || content.includes('from ')) {
      languages.push('javascript');
    }

    return languages;
  }

  containsTestPatterns(content) {
    const testPatterns = [
      /describe\s*\(/gi,
      /it\s*\(/gi,
      /test\(/gi,
      /expect\s*\(/gi
    ];

    return testPatterns.some(pattern => pattern.test(content));
  }

  containsValidationPatterns(content) {
    const validationPatterns = [
      /validate/gi,
      /sanitize/gi,
      /escape/gi,
      /check\s*permission/gi,
      /isAuthorized/gi
    ];

    return validationPatterns.some(pattern => pattern.test(content));
  }

  containsSecurityPatterns(content) {
    const securityPatterns = [
      /where\s+[^;]+/gi,
      /\$\{[^}]*\}/gi,
      /prepareStatement/gi,
      /createParameterizedQuery/gi
    ];

    return securityPatterns.some(pattern => pattern.test(content));
  }

  calculateContextConfidence(isSafe, hasSecurity, hasValidation) {
    let confidence = 0.5;

    if (isSafe) confidence += 0.3;
    if (hasSecurity) confidence += 0.2;
    if (hasValidation) confidence += 0.2;

    return Math.min(confidence, 1.0);
  }

  getContextReason(isSafe, hasSecurity, hasValidation) {
    const reasons = [];

    if (isSafe) reasons.push('Safe context indicators');
    if (hasSecurity) reasons.push('Security patterns detected');
    if (hasValidation) reasons.push('Validation patterns present');

    return reasons.join(', ');
  }
}

module.exports = EnhancedBoundaryTester;