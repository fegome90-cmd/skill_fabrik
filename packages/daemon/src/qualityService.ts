/**
 * Quality Assurance Service
 *
 * Provides code quality checks including ESLint and Prettier formatting
 * with real-time feedback and integration with the file watching system
 */

import { execSync, spawn } from 'child_process';
import { resolve, join } from 'path';
import { existsSync } from 'fs';

export interface QualityResult {
  success: boolean;
  tool: 'prettier' | 'eslint';
  message: string;
  details?: any;
  timestamp: string;
  duration: number;
  filesProcessed?: number;
  errors?: number;
  warnings?: number;
  formatted?: boolean;
}

interface FileQualityIssue {
  file: string;
  line?: number;
  column?: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  rule?: string;
  fixable?: boolean;
}

interface QualityConfig {
  prettier: {
    semi: boolean;
    singleQuote: boolean;
    tabWidth: number;
    trailingComma: 'es5' | 'none';
    printWidth: number;
    bracketSpacing: boolean;
    arrowParens: 'always' | 'avoid';
    endOfLine: 'lf';
  };
  eslint: {
    configFile?: string;
    baseConfig?: any;
    rules?: any;
  };
}

export class QualityService {
  private config: QualityConfig;

  constructor() {
    this.config = {
      prettier: {
        semi: true,
        singleQuote: true,
        tabWidth: 2,
        trailingComma: 'es5',
        printWidth: 80,
        bracketSpacing: true,
        arrowParens: 'always',
        endOfLine: 'lf'
      },
      eslint: {
        configFile: './.eslintrc.json',
        rules: {
          'no-unused-vars': 'warn',
          'no-console': 'warn',
          'prefer-const': 'warn',
          'no-var': 'error'
        }
      }
    };
  }

  async formatFiles(files: string[] = []): Promise<QualityResult> {
    const startTime = Date.now();

    try {
      // If no files specified, use default patterns
      const filesToFormat = files.length > 0
        ? files
        : [
            'src/**/*.{ts,tsx,js,jsx}',
            'packages/**/*.{ts,tsx,js,jsx}',
            'components/**/*.{ts,tsx,js,jsx}',
            '*.json',
            '*.md'
          ];

      const prettierConfig = JSON.stringify(this.config.prettier, null, 2);
      const cmd = `npx prettier --write --config ${prettierConfig} ${filesToFormat.join(' ')}`;

      const result = execSync(cmd, {
        cwd: process.cwd(),
        encoding: 'utf-8',
        stdio: 'pipe'
      });

      const formattedFiles = result.split('\n')
        .filter(line => line.trim() && !line.includes('No files matching'))
        .map(line => line.replace(/\x1b\[[0-9;]*m/g, '')) // Remove ANSI codes
        .filter(line => line.trim() && !line.includes('Code style issues found'));

      return {
        success: true,
        tool: 'prettier',
        message: `Successfully formatted ${formattedFiles.length} files`,
        details: {
          formattedFiles,
          filesProcessed: formattedFiles.length
        },
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        formatted: true
      };

    } catch (error) {
      return {
        success: false,
        tool: 'prettier',
        message: 'Formatting failed',
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        formatted: false
      };
    }
  }

  async checkLint(files: string[] = []): Promise<QualityResult> {
    const startTime = Date.now();

    try {
      // If no files specified, use default patterns
      const filesToLint = files.length > 0
        ? files
        : [
            'src/**/*.{ts,tsx,js,jsx}',
            'packages/**/*.{ts,tsx,js,jsx}',
            'components/**/*.{ts,tsx,js,jsx}',
            '*.js',
            '*.ts'
          ];

      const eslintConfig = this.config.eslint.configFile
        ? `--config ${this.config.eslint.configFile}`
        : '';

      const cmd = `npx eslint ${eslintConfig} --format=json ${filesToLint.join(' ')}`;

      const result = execSync(cmd, {
        cwd: process.cwd(),
        encoding: 'utf-8',
        stdio: 'pipe'
      });

      const eslintResults = result.split('\n')
        .filter(line => line.trim())
        .map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      const errors = eslintResults.reduce((sum, result) => sum + result.errorCount, 0);
      const warnings = eslintResults.reduce((sum, result) => sum + result.warningCount, 0);
      const fixable = eslintResults.reduce((sum, result) => sum + result.fixableErrorCount, 0);

      const issues: FileQualityIssue[] = [];
      eslintResults.forEach(result => {
        if (result.messages) {
          result.messages.forEach((msg: any) => {
            issues.push({
              file: result.filePath,
              line: msg.line,
              column: msg.column,
              severity: msg.severity as 'error' | 'warning' | 'info',
              message: msg.message,
              rule: msg.ruleId,
              fixable: msg.fixable
            });
          });
        }
      });

      return {
        success: errors === 0,
        tool: 'eslint',
        message: errors === 0
          ? `No issues found in ${eslintResults.length} files`
          : `Found ${errors} errors and ${warnings} warnings`,
        details: {
          issues,
          filesProcessed: eslintResults.length,
          errors,
          warnings,
          fixable
        },
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        errors,
        warnings
      };

    } catch (error) {
      return {
        success: false,
        tool: 'eslint',
        message: 'Lint check failed',
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        errors: 1,
        warnings: 0
      };
    }
  }

  async formatSingleFile(filePath: string): Promise<QualityResult> {
    return this.formatFiles([filePath]);
  }

  async lintSingleFile(filePath: string): Promise<QualityResult> {
    return this.checkLint([filePath]);
  }

  async getProjectStats(): Promise<{
    totalFiles: number;
    fileTypes: { [key: string]: number };
    hasPrettierConfig: boolean;
    hasEslintConfig: boolean;
    lastQualityCheck?: QualityResult;
  }> {
    try {
      // Count files by type
      const extensions: { [key: string]: number } = {};
      const patterns = [
        'src/**/*.{ts,tsx,js,jsx}',
        'packages/**/*.{ts,tsx,js,jsx}',
        '*.ts',
        '*.tsx',
        '*.js',
        '*.jsx',
        '*.json',
        '*.md'
      ];

      let totalFiles = 0;
      for (const pattern of patterns) {
        try {
          const cmd = `find . -name "${pattern.replace('**/*', '')}" -type f | wc -l`;
          const count = parseInt(execSync(cmd, { encoding: 'utf-8' }).trim());
          const ext = pattern.split('.').pop() || pattern;
          extensions[ext] = (extensions[ext] || 0) + count;
          totalFiles += count;
        } catch {
          // Ignore errors for patterns that don't match
        }
      }

      // Check for configuration files
      const hasPrettierConfig = existsSync('.prettierrc') || existsSync('prettier.config.js') || existsSync('prettier.config.json');
      const hasEslintConfig = existsSync('.eslintrc.json') || existsSync('.eslintrc.js');

      return {
        totalFiles,
        fileTypes: extensions,
        hasPrettierConfig,
        hasEslintConfig
      };

    } catch (error) {
      console.error('Error getting project stats:', error);
      return {
        totalFiles: 0,
        fileTypes: {},
        hasPrettierConfig: false,
        hasEslintConfig: false
      };
    }
  }

  async createConfigFiles(): Promise<void> {
    // Create .prettierrc if it doesn't exist
    if (!existsSync('.prettierrc')) {
      const prettierConfig = JSON.stringify(this.config.prettier, null, 2);
      require('fs').writeFileSync('.prettierrc', prettierConfig + '\n');
    }

    // Create .eslintrc.json if it doesn't exist
    if (!existsSync('.eslintrc.json')) {
      const eslintConfig = {
        env: {
          browser: true,
          es2022: true,
          node: true
        },
        extends: [
          'eslint:recommended'
        ],
        parser: '@typescript-eslint/parser',
        parserOptions: {
          ecmaVersion: 'latest',
          sourceType: 'module'
        },
        plugins: [
          '@typescript-eslint'
        ],
        rules: {
          ...this.config.eslint.rules,
          '@typescript-eslint/no-unused-vars': 'warn',
          '@typescript-eslint/no-explicit-any': 'warn'
        }
      };

      require('fs').writeFileSync('.eslintrc.json', JSON.stringify(eslintConfig, null, 2) + '\n');
    }
  }
}

// Singleton instance
let qualityService: QualityService | null = null;

export function getQualityService(): QualityService {
  if (!qualityService) {
    qualityService = new QualityService();
  }
  return qualityService;
}