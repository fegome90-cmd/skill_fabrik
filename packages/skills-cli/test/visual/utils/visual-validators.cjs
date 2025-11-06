/**
 * Visual Validators for CLI Output
 * Validates visual aspects of CLI output including colors, formatting, and structure
 */

const { SnapshotManager } = require('./snapshot-manager.cjs');

/**
 * Visual Validation Result
 */
class ValidationResult {
  constructor(validatorName, passed, details = {}) {
    this.validatorName = validatorName;
    this.passed = passed;
    this.details = details;
    this.timestamp = Date.now();
  }

  get summary() {
    return {
      validator: this.validatorName,
      passed: this.passed,
      timestamp: this.timestamp
    };
  }
}

/**
 * Visual Validator
 * Base class for visual validators
 */
class VisualValidator {
  constructor(name, description) {
    this.name = name;
    this.description = description;
  }

  validate(output, options = {}) {
    throw new Error('validate() method must be implemented by subclasses');
  }

  createResult(passed, details = {}) {
    return new ValidationResult(this.name, passed, details);
  }
}

/**
 * Color Validator
 * Validates ANSI color codes in CLI output
 */
class ColorValidator extends VisualValidator {
  constructor() {
    super('ColorValidator', 'Validates ANSI color codes and formatting');
    this.ansiColorPattern = /\x1b\[[0-9;]*m/g;
    this.colorCodes = {
      reset: '\x1b[0m',
      bright: '\x1b[1m',
      dim: '\x1b[2m',
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      magenta: '\x1b[35m',
      cyan: '\x1b[36m',
      white: '\x1b[37m'
    };
  }

  validate(output, options = {}) {
    const colorMatches = output.match(this.ansiColorPattern) || [];
    const colorCount = colorMatches.length;
    const hasColors = colorCount > 0;

    // Check for color balance (opening and closing tags)
    const resetCount = colorMatches.filter(code => code === this.colorCodes.reset).length;
    const colorBalance = resetCount === Math.max(0, colorCount - resetCount);

    // Check for expected colors
    const expectedColors = options.expectedColors || [];
    const foundColors = colorMatches.filter(code => Object.values(this.colorCodes).includes(code));
    const hasExpectedColors = expectedColors.length === 0 ||
      expectedColors.every(color => foundColors.includes(color));

    // Check for invalid color sequences
    const invalidColors = colorMatches.filter(code =>
      !Object.values(this.colorCodes).includes(code) &&
      !code.match(/\x1b\[[0-9;]+m/)
    );

    const passed = hasColors && colorBalance && hasExpectedColors && invalidColors.length === 0;

    return this.createResult(passed, {
      hasColors,
      colorCount,
      resetCount,
      colorBalance,
      hasExpectedColors,
      expectedColors,
      foundColors: foundColors.length,
      invalidColors: invalidColors.length,
      allColors: colorMatches
    });
  }
}

/**
 * Format Validator
 * Validates text formatting and structure
 */
class FormatValidator extends VisualValidator {
  constructor() {
    super('FormatValidator', 'Validates text formatting and structure');
  }

  validate(output, options = {}) {
    const lines = output.split('\n');
    const lineCount = lines.length;
    const emptyLines = lines.filter(line => line.trim() === '').length;
    const nonEmptyLines = lineCount - emptyLines;

    // Check for consistent indentation
    const indentations = lines
      .filter(line => line.trim().length > 0)
      .map(line => line.match(/^(\s*)/)[1].length);

    const hasConsistentIndentation = indentations.length <= 1 ||
      new Set(indentations).size <= Math.max(1, Math.floor(indentations.length / 2));

    // Check for line length limits
    const maxLineLength = Math.max(...lines.map(line => line.length));
    const exceedsLengthLimit = options.maxLineLength && maxLineLength > options.maxLineLength;

    // Check for proper spacing
    const hasTrailingSpaces = lines.some(line => line.endsWith(' '));
    const hasMultipleSpaces = lines.some(line => /\s{3,}/.test(line));

    // Check for structure patterns
    const hasHeaders = options.expectHeaders && lines.some(line =>
      /^#+\s+|^[A-Z][A-Z\s]+$|^=+$|^-.+$/.test(line)
    );

    const hasLists = options.expectLists && lines.some(line =>
      /^\s*[-*+]\s+|^\s*\d+\.\s+|^\s*[a-zA-Z]\.\s+/.test(line)
    );

    const passed = !exceedsLengthLimit && !hasTrailingSpaces &&
      (!options.requireConsistentIndentation || hasConsistentIndentation);

    return this.createResult(passed, {
      lineCount,
      emptyLines,
      nonEmptyLines,
      maxLineLength,
      exceedsLengthLimit: !!exceedsLengthLimit,
      hasConsistentIndentation,
      hasTrailingSpaces,
      hasMultipleSpaces,
      hasHeaders: !!hasHeaders,
      hasLists: !!hasLists,
      averageLineLength: lines.reduce((sum, line) => sum + line.length, 0) / lineCount
    });
  }
}

/**
 * Content Validator
 * Validates content presence and patterns
 */
class ContentValidator extends VisualValidator {
  constructor() {
    super('ContentValidator', 'Validates content presence and patterns');
  }

  validate(output, options = {}) {
    const requiredPatterns = options.requiredPatterns || [];
    const forbiddenPatterns = options.forbiddenPatterns || [];
    const expectedKeywords = options.expectedKeywords || [];

    // Check for required patterns
    const foundRequired = requiredPatterns.map(pattern => ({
      pattern,
      found: new RegExp(pattern).test(output)
    }));

    const allRequiredFound = requiredPatterns.length === 0 ||
      foundRequired.every(result => result.found);

    // Check for forbidden patterns
    const foundForbidden = forbiddenPatterns.map(pattern => ({
      pattern,
      found: new RegExp(pattern).test(output)
    }));

    const anyForbiddenFound = foundForbidden.some(result => result.found);

    // Check for expected keywords
    const foundKeywords = expectedKeywords.filter(keyword =>
      output.toLowerCase().includes(keyword.toLowerCase())
    );

    const keywordMatchRate = expectedKeywords.length > 0 ?
      foundKeywords.length / expectedKeywords.length : 1;

    // Content statistics
    const wordCount = output.split(/\s+/).filter(word => word.length > 0).length;
    const charCount = output.length;
    const hasContent = wordCount > 0;

    const passed = hasContent && allRequiredFound && !anyForbiddenFound &&
      (!options.minKeywordMatchRate || keywordMatchRate >= options.minKeywordMatchRate);

    return this.createResult(passed, {
      hasContent,
      wordCount,
      charCount,
      allRequiredFound,
      foundRequired,
      anyForbiddenFound,
      foundForbidden,
      keywordMatchRate,
      foundKeywords,
      expectedKeywords
    });
  }
}

/**
 * Performance Validator
 * Validates performance characteristics
 */
class PerformanceValidator extends VisualValidator {
  constructor() {
    super('PerformanceValidator', 'Validates performance characteristics of CLI output');
  }

  validate(output, options = {}) {
    const processingTime = options.processingTime || 0;
    const memoryUsage = options.memoryUsage || 0;
    const outputSize = output.length;

    // Performance thresholds
    const maxProcessingTime = options.maxProcessingTime || 1000; // 1 second
    const maxMemoryUsage = options.maxMemoryUsage || 50 * 1024 * 1024; // 50MB
    const maxOutputSize = options.maxOutputSize || 100 * 1024; // 100KB

    const processingTimeOk = processingTime <= maxProcessingTime;
    const memoryUsageOk = memoryUsage <= maxMemoryUsage;
    const outputSizeOk = outputSize <= maxOutputSize;

    // Calculate performance score
    let performanceScore = 100;
    if (!processingTimeOk) performanceScore -= 40;
    if (!memoryUsageOk) performanceScore -= 30;
    if (!outputSizeOk) performanceScore -= 30;

    const passed = processingTimeOk && memoryUsageOk && outputSizeOk;

    return this.createResult(passed, {
      processingTime,
      memoryUsage,
      outputSize,
      processingTimeOk,
      memoryUsageOk,
      outputSizeOk,
      performanceScore,
      thresholds: {
        maxProcessingTime,
        maxMemoryUsage,
        maxOutputSize
      }
    });
  }
}

/**
 * Visual Validation Suite
 * Runs multiple validators and provides comprehensive results
 */
class VisualValidationSuite {
  constructor() {
    this.validators = new Map();
    this.setupDefaultValidators();
  }

  setupDefaultValidators() {
    this.addValidator(new ColorValidator());
    this.addValidator(new FormatValidator());
    this.addValidator(new ContentValidator());
    this.addValidator(new PerformanceValidator());
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
        results.push(new ValidationResult(validator.name, false, {
          error: error.message
        }));
      }
    }

    return new VisualValidationResult(results);
  }
}

/**
 * Visual Validation Result
 * Comprehensive result from validation suite
 */
class VisualValidationResult {
  constructor(results) {
    this.results = results;
    this.timestamp = Date.now();
  }

  get passed() {
    return this.results.every(result => result.passed);
  }

  get failed() {
    return !this.passed;
  }

  get passedCount() {
    return this.results.filter(result => result.passed).length;
  }

  get failedCount() {
    return this.results.filter(result => !result.passed).length;
  }

  get passRate() {
    return this.results.length > 0 ? (this.passedCount / this.results.length) * 100 : 0;
  }

  get summary() {
    return {
      passed: this.passed,
      passedCount: this.passedCount,
      failedCount: this.failedCount,
      totalCount: this.results.length,
      passRate: this.passRate,
      timestamp: this.timestamp
    };
  }

  getFailedResults() {
    return this.results.filter(result => !result.passed);
  }

  getResultsByValidator(name) {
    return this.results.find(result => result.validatorName === name);
  }
}

module.exports = {
  VisualValidator,
  ColorValidator,
  FormatValidator,
  ContentValidator,
  PerformanceValidator,
  VisualValidationSuite,
  VisualValidationResult,
  ValidationResult
};