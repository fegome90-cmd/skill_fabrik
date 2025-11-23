/**
 * Migration Options Integration Tests
 * T1.1.8 - Configuration options support
 * Tests for the new configuration options in the migration script
 */

/* eslint-disable no-console */

import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('ESLint Migration - Configuration Options', () => {
  const TEMP_PROJECT_NAME = 'migration-options-test';
  const SCRIPT_BASE = process.cwd();
  const MIGRATION_SCRIPT = 'migrate-eslint-portable.sh';
  let tempProjectPath: string;

  beforeEach(() => {
    // Create temporary project directory
    const testBaseDir = path.join(SCRIPT_BASE, 'test', 'temp');
    if (!fs.existsSync(testBaseDir)) {
      fs.mkdirSync(testBaseDir, { recursive: true });
    }

    tempProjectPath = path.join(
      testBaseDir,
      `${TEMP_PROJECT_NAME}-${Date.now()}`
    );
    fs.mkdirSync(tempProjectPath, { recursive: true });

    // Create basic project structure
    fs.writeFileSync(
      path.join(tempProjectPath, 'package.json'),
      JSON.stringify(
        {
          name: 'temp-test-project',
          version: '1.0.0',
          devDependencies: {
            eslint: '^8.0.0',
            typescript: '^4.0.0',
          },
        },
        null,
        2
      )
    );

    // Create dist directory
    fs.mkdirSync(path.join(tempProjectPath, 'dist'), { recursive: true });
    fs.mkdirSync(path.join(tempProjectPath, 'dist', 'src', 'config'), {
      recursive: true,
    });

    // Create legacy ESLint configuration for testing migration
    fs.writeFileSync(
      path.join(tempProjectPath, '.eslintrc.json'),
      JSON.stringify(
        {
          extends: ['eslint:recommended'],
          parser: '@typescript-eslint/parser',
          plugins: ['@typescript-eslint'],
          rules: {
            'no-console': 'warn',
            'prefer-const': 'error',
            // Custom rule that needs to be preserved
            '@typescript-eslint/no-explicit-any': 'warn',
          },
        },
        null,
        2
      )
    );

    // Create .eslintignore
    fs.writeFileSync(
      path.join(tempProjectPath, '.eslintignore'),
      `node_modules/
dist/
coverage/
*.config.js
`
    );

    // Copy eslint config module
    const eslintConfigSrc = path.join(
      SCRIPT_BASE,
      'dist',
      'src',
      'config',
      'eslint.config.js'
    );
    if (fs.existsSync(eslintConfigSrc)) {
      fs.copyFileSync(
        eslintConfigSrc,
        path.join(tempProjectPath, 'dist', 'src', 'config', 'eslint.config.js')
      );
    }

    // Create scripts directory to match expected script structure
    fs.mkdirSync(path.join(tempProjectPath, 'scripts'), { recursive: true });
    fs.mkdirSync(path.join(tempProjectPath, 'scripts', 'utils'), {
      recursive: true,
    });

    // Copy migration script to scripts/ directory
    const scriptSrc = path.join(SCRIPT_BASE, 'scripts', MIGRATION_SCRIPT);
    const scriptDest = path.join(tempProjectPath, 'scripts', MIGRATION_SCRIPT);
    fs.copyFileSync(scriptSrc, scriptDest);
    fs.chmodSync(scriptDest, 0o755);

    // Copy utils directory to scripts/utils/ (required by migration script)
    const utilsSrc = path.join(SCRIPT_BASE, 'scripts', 'utils');
    const utilsDest = path.join(tempProjectPath, 'scripts', 'utils');
    if (fs.existsSync(utilsSrc)) {
      const files = fs.readdirSync(utilsSrc);
      for (const file of files) {
        const srcFile = path.join(utilsSrc, file);
        const destFile = path.join(utilsDest, file);
        fs.copyFileSync(srcFile, destFile);
        if (fs.statSync(srcFile).mode & 0o111) {
          fs.chmodSync(destFile, 0o755);
        }
      }
    }
  });

  afterEach(() => {
    // Clean up temporary project
    if (fs.existsSync(tempProjectPath)) {
      fs.rmSync(tempProjectPath, { recursive: true, force: true });
    }
  });

  const runMigrationScript = (
    args: string
  ): { exitCode: number; stdout: string } => {
    try {
      const result = execSync(
        `cd ${tempProjectPath} && ./scripts/${MIGRATION_SCRIPT} ${args}`,
        {
          encoding: 'utf8',
          stdio: 'pipe',
          timeout: 30000, // 30 second timeout
        }
      );
      return {
        exitCode: 0,
        stdout: result,
      };
    } catch (error: unknown) {
      const execError = error as {
        status?: number;
        stdout?: string;
        signal?: string;
        code?: number;
      };
      return {
        exitCode: execError.status || execError.code || 1,
        stdout: execError.stdout || '',
      };
    }
  };

  describe('Help Option', () => {
    it('should show usage information with --help', () => {
      const result = runMigrationScript('--help');

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Usage:');
      expect(result.stdout).toContain('OPTIONS:');
      expect(result.stdout).toContain('EXAMPLES:');
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown options gracefully', () => {
      const result = runMigrationScript('--unknown-option');

      expect(result.exitCode).toBe(1);
      expect(result.stdout).toContain('Unknown option: --unknown-option');
      expect(result.stdout).toContain('Use --help for usage information');
    });
  });

  describe('Dry Run Mode', () => {
    it('should show what would be done without making changes in dry run mode', () => {
      // Run migration in dry run mode
      const result = runMigrationScript('--dry-run');

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('[DRY RUN]');
    });
  });

  describe('Verbose Mode', () => {
    it('should show detailed output in verbose mode', () => {
      // Run migration with verbose output
      const result = runMigrationScript('--verbose');

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Preserve custom rules: true');
      expect(result.stdout).toContain('Prettier integration: true');
      expect(result.stdout).toContain('Backup enabled: true');
    });
  });

  describe('Custom Rules File', () => {
    it('should handle missing custom rules file gracefully', () => {
      const result = runMigrationScript('--custom-rules ./nonexistent.json');

      expect(result.exitCode).toBe(1);
      expect(result.stdout).toContain('not found');
    });

    it('should handle invalid custom rules JSON', () => {
      // Create invalid JSON file
      const invalidRulesPath = path.join(tempProjectPath, 'invalid-rules.json');
      fs.writeFileSync(invalidRulesPath, '{ "rules": { "no-console": "error" '); // Missing closing brace

      const result = runMigrationScript(`--custom-rules ${invalidRulesPath}`);

      expect(result.exitCode).toBe(1);
      // Check for appropriate error message
    });
  });

  describe('Option Combinations', () => {
    it('should handle multiple options correctly', () => {
      const customRules = {
        rules: {
          'no-console': 'error',
        },
      };

      const customRulesPath = path.join(tempProjectPath, 'custom-rules.json');
      fs.writeFileSync(customRulesPath, JSON.stringify(customRules, null, 2));

      // Run migration with multiple options
      const result = runMigrationScript(
        `--custom-rules ${customRulesPath} --no-backup --verbose`
      );

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Custom rules file:');
      expect(result.stdout).toContain('Backup enabled: false');
    });
  });
});
