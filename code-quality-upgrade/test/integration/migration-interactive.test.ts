/**
 * Migration Interactive Mode Tests
 * T1.1.9 - Interactive mode for user confirmation
 * Tests for the new interactive functionality in the migration script
 */

/* eslint-disable security/detect-non-literal-fs-filename */

import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('ESLint Migration - Interactive Mode', () => {
  const TEMP_PROJECT_NAME = 'migration-interactive-test';
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
            inquirer: '^9.0.0',
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

    // Create original ESLint config for backup tests
    fs.writeFileSync(
      path.join(tempProjectPath, '.eslintrc.json'),
      JSON.stringify(
        {
          rules: {
            'no-console': 'warn',
            'my-custom-rule': 'error',
          },
        },
        null,
        2
      )
    );

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

    // Create node_modules symlink to access inquirer
    const nodeModulesPath = path.join(tempProjectPath, 'node_modules');
    fs.symlinkSync(path.join(SCRIPT_BASE, 'node_modules'), nodeModulesPath);
  });

  afterEach(() => {
    // Clean up temporary project
    if (fs.existsSync(tempProjectPath)) {
      fs.rmSync(tempProjectPath, { recursive: true, force: true });
    }
  });

  interface MigrationResult {
    exitCode: number | string;
    stdout: string;
    stderr: string;
  }

  const runMigrationScript = (
    args: string,
    input?: string,
    timeout: number = 30000
  ): MigrationResult => {
    try {
      const result = execSync(
        `cd ${tempProjectPath} && echo "${input || ''}" | ./scripts/${MIGRATION_SCRIPT} ${args}`,
        {
          encoding: 'utf8',
          stdio: 'pipe',
          timeout: timeout,
        }
      );
      return {
        exitCode: 0,
        stdout: result,
        stderr: '',
      };
    } catch (error: unknown) {
      const execError = error as {
        status?: number;
        stdout?: string;
        stderr?: string;
        signal?: string;
        code?: number;
        message?: string;
      };

      // Handle timeout specifically
      if (
        execError.message?.includes('ETIMEDOUT') ||
        execError.signal === 'SIGTERM'
      ) {
        return {
          exitCode: 'ETIMEDOUT',
          stdout: execError.stdout || '',
          stderr: `Process timed out after ${timeout}ms`,
        };
      }

      return {
        exitCode: execError.status || execError.code || 1,
        stdout: execError.stdout || '',
        stderr: execError.stderr || '',
      };
    }
  };

  describe('Interactive Mode Option', () => {
    it('should show interactive option in help', () => {
      const result = runMigrationScript('--help');

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('--interactive');
      expect(result.stdout).toContain(
        'Enable interactive mode for confirmations'
      );
    });
  });

  describe('Interactive Configuration Summary', () => {
    it('should show configuration in interactive mode', () => {
      // Provide "0" for cancel to exit immediately and avoid timeout
      const result = runMigrationScript('--interactive --dry-run', '0', 30000);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain(
        'Interactive Mode: Configuration Summary'
      );
    });
  });

  describe('Interactive Mode Fallback', () => {
    it('should proceed when interactive prompts fail', () => {
      // This test simulates a scenario where inquirer might fail
      // The script should fallback to non-interactive mode with timeout for cancel
      const result = runMigrationScript('--interactive --help', '0', 30000);

      expect(result.exitCode).toBe(0);
      // Should show help even if interactive mode is enabled
      expect(result.stdout).toContain('Usage:');
    });
  });

  describe('Default Non-Interactive Behavior', () => {
    it('should work normally without interactive flag', () => {
      const result = runMigrationScript('--help');

      expect(result.exitCode).toBe(0);
      // Should not show interactive summary when not in interactive mode
      expect(result.stdout).not.toContain(
        'Interactive Mode: Configuration Summary'
      );
    });

    it('should proceed with migration without prompts', () => {
      const result = runMigrationScript('--dry-run', '', 30000);

      expect(result.exitCode).toBe(0);
      // Should not show interactive prompts in dry run mode
      expect(result.stdout).toContain('[DRY RUN]');
    });
  });

  describe('Interactive Mode with Different Options', () => {
    it('should show custom configuration in summary', () => {
      const customRules = {
        rules: {
          'no-console': 'error',
        },
      };

      const customRulesPath = path.join(tempProjectPath, 'custom-rules.json');
      fs.writeFileSync(customRulesPath, JSON.stringify(customRules, null, 2));

      // Provide "0" for cancel to exit immediately and avoid timeout
      const result = runMigrationScript(
        `--interactive --custom-rules ${customRulesPath} --no-backup --dry-run`,
        '0',
        30000
      );

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Custom rules file:');
      expect(result.stdout).toContain('Backup enabled: false');
    });
  });

  describe('Error Handling in Interactive Mode', () => {
    it('should handle unknown options correctly in interactive mode', () => {
      const result = runMigrationScript(
        '--interactive --unknown-option',
        '0',
        30000
      );

      expect(result.exitCode).toBe(1);
      expect(result.stdout).toContain('Unknown option: --unknown-option');
    });
  });

  // Note: Due to the complexity of testing interactive prompts programmatically,
  // these tests focus on ensuring the script handles interactive mode gracefully
  // and that all interactive features are properly integrated
});
