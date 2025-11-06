/**
 * Visual Regression Testing - Visual Validators
 * Validates specific visual elements and formatting in CLI output
 */

export interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
  metadata: {
    elementsFound: Record<string, number>;
    elementsExpected: Record<string, number>;
    missingElements: string[];
    unexpectedElements: string[];
  };
}

/**
 * Visual validation rules and patterns
 */
export const VISUAL_RULES = {
  // Color patterns (ANSI escape codes)
  colors: {
    primary: /\x1b\[94m/g,      // Bright blue
    success: /\x1b\[92m/g,      // Bright green
    warning: /\x1b\[93m/g,      // Bright yellow
    error: /\x1b\[91m/g,        // Bright red
    info: /\x1b\[96m/g,         // Bright cyan
    reset: /\x1b\[0m/g,         // Reset
    bold: /\x1b\[1m/g,          // Bold
    dim: /\x1b\[2m/g,           // Dim
  },

  // Structural elements
  structure: {
    headers: /^#{1,6}\s+.+$/gm,
    lists: /^[\s]*[-*+]\s+.+$/gm,
    numberedLists: /^[\s]*\d+\.\s+.+$/gm,
    tables: /\|.*\|/g,
    codeBlocks: /```[\s\S]*?```/g,
    inlineCode: /`[^`]+`/g,
    horizontalRules: /^[-*_]{3,}$/gm,
  },

  // Icons and symbols
  icons: {
    success: /[✓✅]/g,
    error: /[✗❌]/g,
    warning: /[⚠️⚠]/g,
    info: /[ℹℹ]/g,
    arrow: /[→←↑↓]/g,
    bullet: /[•·]/g,
    star: /[★☆]/g,
    check: /[✔]/g,
    cross: /[✘]/g,
  },

  // Progress indicators
  progress: {
    progressBar: /\[[█░]+\]/g,
    percentage: /\d+%/g,
    spinner: /[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏]/g,
    loading: /\.\.\./g,
  },

  // Metadata patterns
  metadata: {
    timestamps: /\d{4}-\d{2}-\d{2}T?\d{2}:\d{2}:\d{2}/g,
    dates: /\d{4}-\d{2}-\d{2}/g,
    times: /\d{2}:\d{2}:\d{2}/g,
    durations: /\d+ms/g,
    fileSizes: /\d+(?:\.\d+)?\s*[KMGT]?B/g,
    percentages: /\d+(?:\.\d+)?%/g,
    versionNumbers: /\d+\.\d+\.\d+/g,
    paths: /\/[^\s\/]+(?:\/[^\s\/]+)*/g,
    urls: /https?:\/\/[^\s]+/g,
    emails: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  },

  // CLI-specific patterns
  cli: {
    commandPrompts: />|\$|#|%/g,
    errorCodes: /\b(E\d+|Error\s+\d+)\b/g,
    exitCodes: /\b(exit\s+code\s*:?\s*\d+)\b/g,
    stackTraces: /at\s+.*\([^)]+\)/g,
    debugInfo: /\[DEBUG\]|\[INFO\]|\[WARN\]|\[ERROR\]/gi,
  }
};

/**
 * Visual Validator class
 */
export class VisualValidator {
  private rules: typeof VISUAL_RULES;

  constructor(customRules?: Partial<typeof VISUAL_RULES>) {
    this.rules = { ...VISUAL_RULES, ...customRules };
  }

  /**
   * Validate color usage in output
   */
  validateColors(output: string, expectedColors?: string[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const elementsFound: Record<string, number> = {};

    // Count color occurrences
    Object.entries(this.rules.colors).forEach(([name, pattern]) => {
      const matches = output.match(pattern);
      elementsFound[name] = matches ? matches.length : 0;
    });

    // Check for color reset issues
    const colorOpens = (output.match(/\x1b\[[\d;]+m/g) || []).length;
    const colorResets = (output.match(/\x1b\[0m/g) || []).length;

    if (colorOpens > colorResets + 1) {
      errors.push(`Unclosed color codes detected (${colorOpens} opens, ${colorResets} resets)`);
    }

    // Check for expected colors
    if (expectedColors) {
      expectedColors.forEach(colorName => {
        if (!elementsFound[colorName] || elementsFound[colorName] === 0) {
          warnings.push(`Expected color '${colorName}' not found in output`);
        }
      });
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings,
      metadata: {
        elementsFound,
        elementsExpected: expectedColors ?
          expectedColors.reduce((acc, color) => ({ ...acc, [color]: 1 }), {}) : {},
        missingElements: [],
        unexpectedElements: []
      }
    };
  }

  /**
   * Validate structural elements
   */
  validateStructure(output: string, expectedStructure?: {
    headers?: number;
    lists?: number;
    tables?: number;
    codeBlocks?: number;
  }): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const elementsFound: Record<string, number> = {};

    // Count structural elements
    Object.entries(this.rules.structure).forEach(([name, pattern]) => {
      const matches = output.match(pattern);
      elementsFound[name] = matches ? matches.length : 0;
    });

    // Validate expected structure
    if (expectedStructure) {
      Object.entries(expectedStructure).forEach(([element, expectedCount]) => {
        const actualCount = elementsFound[element] || 0;

        if (expectedCount > 0 && actualCount === 0) {
          errors.push(`Expected ${expectedCount} ${element}, found ${actualCount}`);
        } else if (expectedCount > 0 && actualCount < expectedCount) {
          warnings.push(`Expected at least ${expectedCount} ${element}, found ${actualCount}`);
        }
      });
    }

    // Check for malformed tables
    const tables = output.match(this.rules.structure.tables) || [];
    tables.forEach((table, index) => {
      const rows = table.split('|').filter(cell => cell.trim()).length;
      if (rows < 3) {
        warnings.push(`Table ${index + 1} appears malformed (only ${rows} columns)`);
      }
    });

    return {
      passed: errors.length === 0,
      errors,
      warnings,
      metadata: {
        elementsFound,
        elementsExpected: expectedStructure || {},
        missingElements: [],
        unexpectedElements: []
      }
    };
  }

  /**
   * Validate icons and symbols
   */
  validateIcons(output: string, expectedIcons?: string[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const elementsFound: Record<string, number> = {};

    // Count icon occurrences
    Object.entries(this.rules.icons).forEach(([name, pattern]) => {
      const matches = output.match(pattern);
      elementsFound[name] = matches ? matches.length : 0;
    });

    // Check for inconsistent icon usage
    const successCount = elementsFound.success || 0;
    const errorCount = elementsFound.error || 0;

    if (successCount > 0 && errorCount > 0) {
      // Check if success/error icons are used appropriately
      const hasErrorKeywords = /\b(error|fail|invalid|wrong|exception)\b/i.test(output);
      const hasSuccessKeywords = /\b(success|complete|valid|done|finished)\b/i.test(output);

      if (hasErrorKeywords && successCount > errorCount) {
        warnings.push('Success icons found in error-related output');
      }
      if (hasSuccessKeywords && errorCount > successCount) {
        warnings.push('Error icons found in success-related output');
      }
    }

    // Check for expected icons
    if (expectedIcons) {
      expectedIcons.forEach(iconName => {
        if (!elementsFound[iconName] || elementsFound[iconName] === 0) {
          warnings.push(`Expected icon '${iconName}' not found in output`);
        }
      });
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings,
      metadata: {
        elementsFound,
        elementsExpected: expectedIcons ?
          expectedIcons.reduce((acc, icon) => ({ ...acc, [icon]: 1 }), {}) : {},
        missingElements: [],
        unexpectedElements: []
      }
    };
  }

  /**
   * Validate progress indicators
   */
  validateProgressIndicators(output: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const elementsFound: Record<string, number> = {};

    // Count progress elements
    Object.entries(this.rules.progress).forEach(([name, pattern]) => {
      const matches = output.match(pattern);
      elementsFound[name] = matches ? matches.length : 0;
    });

    // Validate progress bars
    const progressBars = output.match(this.rules.progress.progressBar) || [];
    progressBars.forEach((bar, index) => {
      const filled = (bar.match(/█/g) || []).length;
      const empty = (bar.match(/░/g) || []).length;
      const total = filled + empty;

      if (total === 0) {
        errors.push(`Progress bar ${index + 1} appears empty`);
      } else if (filled > total) {
        errors.push(`Progress bar ${index + 1} has invalid filled count`);
      } else {
        const percentage = Math.round((filled / total) * 100);
        const percentageInText = bar.match(/(\d+)%/);

        if (percentageInText) {
          const textPercentage = parseInt(percentageInText[1]);
          if (Math.abs(textPercentage - percentage) > 5) {
            warnings.push(`Progress bar ${index + 1}: visual (${percentage}%) doesn't match text (${textPercentage}%)`);
          }
        }
      }
    });

    // Validate percentages
    const percentages = output.match(this.rules.progress.percentage) || [];
    percentages.forEach((percentage, index) => {
      const value = parseInt(percentage);
      if (value < 0 || value > 100) {
        errors.push(`Invalid percentage value: ${value}% (index ${index})`);
      }
    });

    return {
      passed: errors.length === 0,
      errors,
      warnings,
      metadata: {
        elementsFound,
        elementsExpected: {},
        missingElements: [],
        unexpectedElements: []
      }
    };
  }

  /**
   * Validate metadata consistency
   */
  validateMetadata(output: string, expectedMetadata?: {
    timestamps?: boolean;
    durations?: boolean;
    fileSizes?: boolean;
    paths?: boolean;
  }): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const elementsFound: Record<string, number> = {};

    // Count metadata elements
    Object.entries(this.rules.metadata).forEach(([name, pattern]) => {
      const matches = output.match(pattern);
      elementsFound[name] = matches ? matches.length : 0;
    });

    // Validate expected metadata
    if (expectedMetadata) {
      Object.entries(expectedMetadata).forEach(([type, shouldExist]) => {
        const count = elementsFound[type] || 0;

        if (shouldExist && count === 0) {
          warnings.push(`Expected ${type} metadata not found`);
        } else if (!shouldExist && count > 0) {
          warnings.push(`Unexpected ${type} metadata found (${count} occurrences)`);
        }
      });
    }

    // Validate timestamp formats
    const timestamps = output.match(this.rules.metadata.timestamps) || [];
    timestamps.forEach((timestamp, index) => {
      if (timestamp.includes('T') && !timestamp.endsWith('Z')) {
        warnings.push(`Timestamp ${index + 1} might be missing timezone info`);
      }
    });

    // Validate file size formats
    const fileSizes = output.match(this.rules.metadata.fileSizes) || [];
    fileSizes.forEach((size, index) => {
      if (!/^\d+(?:\.\d+)?\s*[KMGT]?B$/i.test(size.trim())) {
        errors.push(`Invalid file size format: ${size} (index ${index})`);
      }
    });

    return {
      passed: errors.length === 0,
      errors,
      warnings,
      metadata: {
        elementsFound,
        elementsExpected: expectedMetadata || {},
        missingElements: [],
        unexpectedElements: []
      }
    };
  }

  /**
   * Validate CLI-specific elements
   */
  validateCLIElements(output: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const elementsFound: Record<string, number> = {};

    // Count CLI elements
    Object.entries(this.rules.cli).forEach(([name, pattern]) => {
      const matches = output.match(pattern);
      elementsFound[name] = matches ? matches.length : 0;
    });

    // Check for potential issues
    if (elementsFound.stackTraces > 0) {
      warnings.push('Stack traces found in output (might be error output)');
    }

    if (elementsFound.errorCodes > 0 && elementsFound.errorCodes > 5) {
      warnings.push('Multiple error codes found (might indicate system issues)');
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings,
      metadata: {
        elementsFound,
        elementsExpected: {},
        missingElements: [],
        unexpectedElements: []
      }
    };
  }

  /**
   * Run comprehensive visual validation
   */
  validateAll(
    output: string,
    config: {
      expectColors?: string[];
      expectIcons?: string[];
      expectStructure?: any;
      expectMetadata?: any;
    } = {}
  ): ValidationResult {
    const results = [
      this.validateColors(output, config.expectColors),
      this.validateStructure(output, config.expectStructure),
      this.validateIcons(output, config.expectIcons),
      this.validateProgressIndicators(output),
      this.validateMetadata(output, config.expectMetadata),
      this.validateCLIElements(output)
    ];

    const allErrors = results.flatMap(r => r.errors);
    const allWarnings = results.flatMap(r => r.warnings);
    const allElementsFound = results.reduce((acc, r) => ({ ...acc, ...r.metadata.elementsFound }), {});

    return {
      passed: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
      metadata: {
        elementsFound: allElementsFound,
        elementsExpected: {},
        missingElements: [],
        unexpectedElements: []
      }
    };
  }
}