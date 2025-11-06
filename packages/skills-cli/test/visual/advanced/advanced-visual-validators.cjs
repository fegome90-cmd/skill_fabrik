/**
 * Advanced Visual Validators for CLI Output
 * Enterprise-level visual validation with comprehensive checks
 */

const { SnapshotManager } = require('../utils/snapshot-manager.cjs');
const fs = require('fs');
const path = require('path');

/**
 * Advanced Visual Validation Result
 */
class AdvancedValidationResult {
  constructor(validatorName, passed, details = {}) {
    this.validatorName = validatorName;
    this.passed = passed;
    this.details = details;
    this.timestamp = Date.now();
    this.score = this.calculateScore(details);
  }

  calculateScore(details) {
    let score = 100;

    // Deduct points for various issues
    if (details.issues) {
      details.issues.forEach(issue => {
        switch (issue.severity) {
          case 'critical': score -= 20; break;
          case 'major': score -= 10; break;
          case 'minor': score -= 5; break;
          case 'info': score -= 1; break;
        }
      });
    }

    return Math.max(0, score);
  }

  get summary() {
    return {
      validator: this.validatorName,
      passed: this.passed,
      score: this.score,
      timestamp: this.timestamp,
      issues: this.details.issues?.length || 0
    };
  }

  getIssues() {
    return this.details.issues || [];
  }

  hasCriticalIssues() {
    return this.getIssues().some(issue => issue.severity === 'critical');
  }

  hasMajorIssues() {
    return this.getIssues().some(issue => issue.severity === 'major');
  }
}

/**
 * Advanced Color Validator
 * Enhanced color validation with accessibility checks
 */
class AdvancedColorValidator {
  constructor() {
    this.name = 'AdvancedColorValidator';
    this.ansiColorPattern = /\x1b\[[0-9;]*m/g;
    this.accessibilityContrast = 4.5; // WCAG AA standard
  }

  validate(output, options = {}) {
    const colorMatches = output.match(this.ansiColorPattern) || [];
    const issues = [];

    // Check color balance
    const resetCount = colorMatches.filter(code => code === '\x1b[0m').length;
    const colorCount = colorMatches.length - resetCount;
    const colorBalance = resetCount === Math.max(0, colorCount);

    if (!colorBalance && colorCount > 0) {
      issues.push({
        type: 'color_balance',
        severity: 'major',
        message: 'Color codes not properly reset',
        suggestion: 'Add reset codes (\\x1b[0m) after color sequences',
        location: this.findColorImbalance(output)
      });
    }

    // Check for accessibility issues
    const colorPairs = this.extractColorPairs(output);
    colorPairs.forEach(pair => {
      if (!this.hasGoodContrast(pair.fg, pair.bg)) {
        issues.push({
          type: 'accessibility',
          severity: 'major',
          message: 'Poor color contrast for accessibility',
          suggestion: 'Use colors with better contrast ratio',
          colors: `${pair.fg} on ${pair.bg}`
        });
      }
    });

    // Check for deprecated color codes
    const deprecatedCodes = this.findDeprecatedColors(output);
    if (deprecatedCodes.length > 0) {
      issues.push({
        type: 'deprecated',
        severity: 'minor',
        message: 'Using deprecated ANSI color codes',
        suggestion: 'Use standard ANSI color codes',
        codes: deprecatedCodes
      });
    }

    // Check for excessive color usage
    const colorDensity = colorCount / output.length;
    if (colorDensity > 0.3) {
      issues.push({
        type: 'color_density',
        severity: 'info',
        message: 'High color density may affect readability',
        suggestion: 'Reduce color usage or use more meaningful color coding',
        density: (colorDensity * 100).toFixed(1) + '%'
      });
    }

    const passed = issues.filter(i => i.severity === 'critical' || i.severity === 'major').length === 0;

    return new AdvancedValidationResult(this.name, passed, {
      hasColors: colorCount > 0,
      colorCount,
      resetCount,
      colorBalance,
      colorPairs: colorPairs.length,
      accessibilityIssues: issues.filter(i => i.type === 'accessibility').length,
      deprecatedCodes: deprecatedCodes.length,
      colorDensity,
      issues
    });
  }

  extractColorPairs(output) {
    // Simple implementation - in real scenario would parse actual colors
    const pairs = [];
    const lines = output.split('\n');

    lines.forEach(line => {
      if (line.includes('\x1b[3') && line.includes('\x1b[4')) {
        // Has both foreground and background colors
        pairs.push({
          fg: 'detected',
          bg: 'detected',
          line: line.substring(0, 50) + '...'
        });
      }
    });

    return pairs;
  }

  hasGoodContrast(fg, bg) {
    // Simplified contrast check
    return !(fg === bg || (fg.includes('90') && bg.includes('90')));
  }

  findDeprecatedColors(output) {
    const deprecated = ['\x1b[90m', '\x1b[91m', '\x1b[92m', '\x1b[93m', '\x1b[94m', '\x1b[95m', '\x1b[96m', '\x1b[97m'];
    return deprecated.filter(code => output.includes(code));
  }

  findColorImbalance(output) {
    const lines = output.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('\x1b[') && !lines[i].includes('\x1b[0m')) {
        return `Line ${i + 1}: ${lines[i].substring(0, 50)}...`;
      }
    }
    return 'Unknown location';
  }
}

/**
 * Advanced Format Validator
 * Enhanced formatting validation with layout checks
 */
class AdvancedFormatValidator {
  constructor() {
    this.name = 'AdvancedFormatValidator';
  }

  validate(output, options = {}) {
    const lines = output.split('\n');
    const issues = [];

    // Check line length consistency
    const lineLengths = lines.map(line => line.length);
    const avgLength = lineLengths.reduce((sum, len) => sum + len, 0) / lineLengths.length;
    const maxLineLength = Math.max(...lineLengths);
    const minLineLength = Math.min(...lineLengths.filter(len => len > 0));

    if (maxLineLength > 120) {
      issues.push({
        type: 'line_length',
        severity: 'minor',
        message: 'Lines too long for terminal display',
        suggestion: 'Keep lines under 120 characters for better readability',
        maxLength: maxLineLength,
        avgLength: Math.round(avgLength)
      });
    }

    // Check inconsistent indentation
    const indentations = lines
      .filter(line => line.trim().length > 0)
      .map(line => line.match(/^(\s*)/)[1].length);

    if (indentations.length > 1) {
      const uniqueIndents = [...new Set(indentations)];
      if (uniqueIndents.length > 3) {
        issues.push({
          type: 'indentation',
          severity: 'info',
          message: 'Inconsistent indentation detected',
          suggestion: 'Use consistent indentation (2 or 4 spaces)',
          uniqueIndents: uniqueIndents.length,
          indentations: uniqueIndents
        });
      }
    }

    // Check for proper spacing
    const trailingSpaces = lines.filter(line => line.endsWith(' ')).length;
    if (trailingSpaces > 0) {
      issues.push({
        type: 'trailing_spaces',
        severity: 'minor',
        message: 'Trailing spaces detected',
        suggestion: 'Remove trailing spaces from lines',
        count: trailingSpaces
      });
    }

    // Check for empty lines usage
    const emptyLines = lines.filter(line => line.trim() === '').length;
    const consecutiveEmpty = this.findConsecutiveEmptyLines(lines);
    if (consecutiveEmpty > 3) {
      issues.push({
        type: 'empty_lines',
        severity: 'info',
        message: 'Too many consecutive empty lines',
        suggestion: 'Use empty lines sparingly for better structure',
        consecutive: consecutiveEmpty
      });
    }

    // Check for structure patterns
    const structureIssues = this.validateStructure(lines);
    issues.push(...structureIssues);

    const passed = issues.filter(i => i.severity === 'critical' || i.severity === 'major').length === 0;

    return new AdvancedValidationResult(this.name, passed, {
      lineCount: lines.length,
      emptyLines,
      maxLineLength,
      avgLength: Math.round(avgLength),
      trailingSpaces,
      consecutiveEmpty,
      structureValidated: structureIssues.length === 0,
      issues
    });
  }

  findConsecutiveEmptyLines(lines) {
    let maxConsecutive = 0;
    let currentConsecutive = 0;

    lines.forEach(line => {
      if (line.trim() === '') {
        currentConsecutive++;
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      } else {
        currentConsecutive = 0;
      }
    });

    return maxConsecutive;
  }

  validateStructure(lines) {
    const issues = [];

    // Check for headers
    const headers = lines.filter(line =>
      line.startsWith('#') ||
      line.match(/^[A-Z][A-Z\s-_]+$/) ||
      line.match(/^=+$/) ||
      line.match(/-+$/)
    );

    if (headers.length === 0 && lines.length > 5) {
      issues.push({
        type: 'structure',
        severity: 'info',
        message: 'No clear document structure detected',
        suggestion: 'Add headers or structural elements'
      });
    }

    // Check for list consistency
    const listLines = lines.filter(line =>
      line.match(/^\s*[-*+]\s+/) ||
      line.match(/^\s*\d+\.\s+/) ||
      line.match(/^\s*[a-zA-Z]\.\s+/)
    );

    const listPatterns = listLines.map(line => {
      if (line.match(/^\s*[-*+]\s+/)) return 'bullet';
      if (line.match(/^\s*\d+\.\s+/)) return 'numbered';
      if (line.match(/^\s*[a-zA-Z]\.\s+/)) return 'letter';
      return 'unknown';
    });

    const uniqueListPatterns = [...new Set(listPatterns)];
    if (uniqueListPatterns.length > 1 && listLines.length > 3) {
      issues.push({
        type: 'list_consistency',
        severity: 'minor',
        message: 'Inconsistent list formatting',
        suggestion: 'Use consistent list formatting throughout document',
        patterns: uniqueListPatterns
      });
    }

    return issues;
  }
}

/**
 * Advanced Content Validator
 * Enhanced content validation with semantic checks
 */
class AdvancedContentValidator {
  constructor() {
    this.name = 'AdvancedContentValidator';
  }

  validate(output, options = {}) {
    const issues = [];
    const contentAnalysis = this.analyzeContent(output);

    // Check for required content
    if (options.requiredContent) {
      const missingContent = options.requiredContent.filter(required =>
        !output.toLowerCase().includes(required.toLowerCase())
      );

      if (missingContent.length > 0) {
        issues.push({
          type: 'missing_content',
          severity: 'major',
          message: 'Required content missing',
          suggestion: 'Include all required content elements',
          missing: missingContent
        });
      }
    }

    // Check for forbidden content
    if (options.forbiddenContent) {
      const foundForbidden = options.forbiddenContent.filter(forbidden =>
        output.toLowerCase().includes(forbidden.toLowerCase())
      );

      if (foundForbidden.length > 0) {
        issues.push({
          type: 'forbidden_content',
          severity: 'critical',
          message: 'Forbidden content detected',
          suggestion: 'Remove all forbidden content',
          found: foundForbidden
        });
      }
    }

    // Check for content quality
    if (contentAnalysis.readabilityScore < 60) {
      issues.push({
        type: 'readability',
        severity: 'minor',
        message: 'Content readability could be improved',
        suggestion: 'Use shorter sentences and clearer language',
        score: contentAnalysis.readabilityScore
      });
    }

    // Check for semantic consistency
    const semanticIssues = this.checkSemanticConsistency(output);
    issues.push(...semanticIssues);

    // Check for completeness
    if (options.expectedSections) {
      const missingSections = options.expectedSections.filter(section =>
        !output.toLowerCase().includes(section.toLowerCase())
      );

      if (missingSections.length > 0) {
        issues.push({
          type: 'missing_sections',
          severity: 'major',
          message: 'Required sections missing',
          suggestion: 'Include all required document sections',
          missing: missingSections
        });
      }
    }

    const passed = issues.filter(i => i.severity === 'critical' || i.severity === 'major').length === 0;

    return new AdvancedValidationResult(this.name, passed, {
      wordCount: contentAnalysis.wordCount,
      charCount: contentAnalysis.charCount,
      readabilityScore: contentAnalysis.readabilityScore,
      hasContent: contentAnalysis.wordCount > 0,
      complexity: contentAnalysis.complexity,
      semanticConsistency: semanticIssues.length === 0,
      issues
    });
  }

  analyzeContent(output) {
    const words = output.split(/\s+/).filter(word => word.length > 0);
    const sentences = output.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgWordsPerSentence = sentences.length > 0 ? words.length / sentences.length : 0;

    // Simple readability score
    let readabilityScore = 100;
    if (avgWordsPerSentence > 20) readabilityScore -= 20;
    if (avgWordsPerSentence > 30) readabilityScore -= 30;
    if (words.length < 10) readabilityScore -= 50;

    // Complexity analysis
    const complexWords = words.filter(word => word.length > 8).length;
    const complexity = complexWords / words.length;

    return {
      wordCount: words.length,
      charCount: output.length,
      readabilityScore: Math.max(0, readabilityScore),
      avgWordsPerSentence,
      complexity
    };
  }

  checkSemanticConsistency(output) {
    const issues = [];

    // Check for inconsistent terminology
    const commonTerms = ['CLI', 'command', 'user', 'system'];
    commonTerms.forEach(term => {
      const variations = [term, term.toLowerCase(), term.toUpperCase()];
      const usedVariations = variations.filter(variation =>
        output.includes(variation)
      );

      if (usedVariations.length > 1) {
        issues.push({
          type: 'terminology',
          severity: 'minor',
          message: `Inconsistent terminology for "${term}"`,
          suggestion: 'Use consistent terminology throughout',
          variations: usedVariations
        });
      }
    });

    return issues;
  }
}

/**
 * Advanced Performance Validator
 * Enhanced performance validation with detailed metrics
 */
class AdvancedPerformanceValidator {
  constructor() {
    this.name = 'AdvancedPerformanceValidator';
  }

  validate(output, options = {}) {
    const processingTime = options.processingTime || 0;
    const memoryUsage = options.memoryUsage || 0;
    const outputSize = output.length;

    const issues = [];
    const metrics = {
      processingTime,
      memoryUsage,
      outputSize,
      throughput: outputSize / Math.max(processingTime, 1) * 1000, // chars per second
      efficiency: this.calculateEfficiency(processingTime, outputSize, memoryUsage)
    };

    // Performance threshold checks
    const thresholds = {
      maxProcessingTime: options.maxProcessingTime || 5000,
      maxMemoryUsage: options.maxMemoryUsage || 100 * 1024 * 1024, // 100MB
      maxOutputSize: options.maxOutputSize || 1024 * 1024, // 1MB
      minThroughput: options.minThroughput || 1000 // chars per second
    };

    if (processingTime > thresholds.maxProcessingTime) {
      issues.push({
        type: 'performance',
        severity: 'major',
        message: 'Processing time exceeds threshold',
        suggestion: 'Optimize algorithms or reduce complexity',
        actual: processingTime,
        threshold: thresholds.maxProcessingTime
      });
    }

    if (memoryUsage > thresholds.maxMemoryUsage) {
      issues.push({
        type: 'memory',
        severity: 'major',
        message: 'Memory usage exceeds threshold',
        suggestion: 'Implement memory optimization or streaming',
        actual: memoryUsage,
        threshold: thresholds.maxMemoryUsage
      });
    }

    if (outputSize > thresholds.maxOutputSize) {
      issues.push({
        type: 'output_size',
        severity: 'minor',
        message: 'Output size exceeds threshold',
        suggestion: 'Consider pagination or compression',
        actual: outputSize,
        threshold: thresholds.maxOutputSize
      });
    }

    if (metrics.throughput < thresholds.minThroughput) {
      issues.push({
        type: 'throughput',
        severity: 'major',
        message: 'Throughput below threshold',
        suggestion: 'Optimize I/O operations',
        actual: Math.round(metrics.throughput),
        threshold: thresholds.minThroughput
      });
    }

    // Efficiency analysis
    if (metrics.efficiency < 50) {
      issues.push({
        type: 'efficiency',
        severity: 'info',
        message: 'Resource efficiency could be improved',
        suggestion: 'Review algorithm efficiency',
        score: Math.round(metrics.efficiency)
      });
    }

    const passed = issues.filter(i => i.severity === 'critical' || i.severity === 'major').length === 0;

    return new AdvancedValidationResult(this.name, passed, {
      metrics,
      thresholds,
      performanceScore: this.calculatePerformanceScore(metrics, thresholds),
      issues
    });
  }

  calculateEfficiency(processingTime, outputSize, memoryUsage) {
    if (processingTime === 0) return 100;

    // Simple efficiency calculation
    const timeEfficiency = Math.max(0, 100 - (processingTime / 100));
    const memoryEfficiency = memoryUsage > 0 ? Math.max(0, 100 - (memoryUsage / (1024 * 1024))) : 100;
    const sizeEfficiency = outputSize > 0 ? Math.min(100, (outputSize / 1000)) : 100;

    return (timeEfficiency + memoryEfficiency + sizeEfficiency) / 3;
  }

  calculatePerformanceScore(metrics, thresholds) {
    let score = 100;

    // Time score (40% weight)
    const timeScore = Math.max(0, 100 - (metrics.processingTime / thresholds.maxProcessingTime * 100));
    score = score * 0.6 + timeScore * 0.4;

    // Memory score (30% weight)
    const memoryScore = Math.max(0, 100 - (metrics.memoryUsage / thresholds.maxMemoryUsage * 100));
    score = score * 0.7 + memoryScore * 0.3;

    // Throughput score (30% weight)
    const throughputScore = Math.min(100, (metrics.throughput / thresholds.minThroughput * 100));
    score = score * 0.7 + throughputScore * 0.3;

    return Math.round(score);
  }
}

/**
 * Advanced Visual Validation Suite
 * Orchestrates multiple advanced validators
 */
class AdvancedVisualValidationSuite {
  constructor() {
    this.validators = new Map();
    this.setupDefaultValidators();
  }

  setupDefaultValidators() {
    this.addValidator(new AdvancedColorValidator());
    this.addValidator(new AdvancedFormatValidator());
    this.addValidator(new AdvancedContentValidator());
    this.addValidator(new AdvancedPerformanceValidator());
  }

  addValidator(validator) {
    this.validators.set(validator.name, validator);
  }

  removeValidator(name) {
    return this.validators.delete(name);
  }

  validateOutput(output, options = {}) {
    const results = [];

    for (const validator of this.validators.values()) {
      try {
        const validatorOptions = options[validator.name] || {};
        const result = validator.validate(output, validatorOptions);
        results.push(result);
      } catch (error) {
        results.push(new AdvancedValidationResult(validator.name, false, {
          error: error.message,
          issues: [{
            type: 'validation_error',
            severity: 'critical',
            message: `Validator error: ${error.message}`
          }]
        }));
      }
    }

    return new AdvancedVisualValidationResult(results);
  }
}

/**
 * Advanced Visual Validation Result
 * Comprehensive result from advanced validation suite
 */
class AdvancedVisualValidationResult {
  constructor(results) {
    this.results = results;
    this.timestamp = Date.now();
  }

  get passed() {
    return this.results.every(result => result.passed);
  }

  get passedCount() {
    return this.results.filter(result => result.passed).length;
  }

  get failedCount() {
    return this.results.filter(result => !result.passed).length;
  }

  get totalScore() {
    const scores = this.results.map(r => r.score);
    return scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
  }

  getCriticalIssues() {
    return this.results.flatMap(result =>
      result.getIssues().filter(issue => issue.severity === 'critical')
    );
  }

  getMajorIssues() {
    return this.results.flatMap(result =>
      result.getIssues().filter(issue => issue.severity === 'major')
    );
  }

  getMinorIssues() {
    return this.results.flatMap(result =>
      result.getIssues().filter(issue => issue.severity === 'minor')
    );
  }

  getAllIssues() {
    return this.results.flatMap(result => result.getIssues());
  }

  get summary() {
    return {
      passed: this.passed,
      passedCount: this.passedCount,
      failedCount: this.failedCount,
      totalCount: this.results.length,
      totalScore: this.totalScore,
      criticalIssues: this.getCriticalIssues().length,
      majorIssues: this.getMajorIssues().length,
      minorIssues: this.getMinorIssues().length,
      totalIssues: this.getAllIssues().length,
      timestamp: this.timestamp
    };
  }

  getDetailedReport() {
    return {
      summary: this.summary,
      results: this.results.map(result => ({
        validator: result.validatorName,
        passed: result.passed,
        score: result.score,
        issues: result.getIssues(),
        details: result.details
      })),
      issues: {
        critical: this.getCriticalIssues(),
        major: this.getMajorIssues(),
        minor: this.getMinorIssues()
      }
    };
  }
}

module.exports = {
  AdvancedVisualValidationResult,
  AdvancedColorValidator,
  AdvancedFormatValidator,
  AdvancedContentValidator,
  AdvancedPerformanceValidator,
  AdvancedVisualValidationSuite
};