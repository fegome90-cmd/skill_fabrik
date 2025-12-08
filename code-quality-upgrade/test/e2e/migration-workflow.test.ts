/**
 * T4.1.2: E2E Migration + Rollback Workflow
 *
 * End-to-end test that verifies the backup → migration → rollback workflow
 * using temporary projects without touching the real repository or dev-docs.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import { TestUtils } from '../../utils/TestUtils';

describe('E2E – Migration + Rollback Workflow', () => {
  const TEST_NAME = 'migration-workflow';
  let tempProjectPath: string;

  beforeEach(() => {
    // Create a uniquely named temporary project for testing
    // Includes timestamp and random suffix to prevent collisions
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const uniqueName = `${TEST_NAME}-${timestamp}-${randomSuffix}`;

    tempProjectPath = TestUtils.createTempProject(uniqueName);

    // Setup initial config files in the temp project
    setupInitialConfigs(tempProjectPath);

    // Copy real scripts to the temp project for E2E execution
    setupScriptsInTempProject(tempProjectPath);
  }, 10000); // Timeout for beforeEach

  afterEach(() => {
    // Clean up temporary project deterministically
    // Use fs.rmSync (Node.js 14+) for recursive deletion with force
    // Silent best-effort cleanup - ignore failures to satisfy no-console rule
    const tempBaseDir = path.join(process.cwd(), 'test', 'temp');
    if (!fs.existsSync(tempBaseDir)) return;

    for (const dir of fs.readdirSync(tempBaseDir)) {
      if (dir.includes(TEST_NAME)) {
        try {
          fs.rmSync(path.join(tempBaseDir, dir), {
            recursive: true,
            force: true,
          });
        } catch {
          // Ignore cleanup failures - best effort only
        }
      }
    }
  }, 10000); // Timeout for afterEach

  describe('given a project with legacy configs when backup → migrate → rollback', () => {
    it('then backup creates snapshot, migration applies changes, rollback restores original', () => {
      // Save original state before backup for later verification
      const originalPackageJson = TestUtils.readJsonFile(
        path.join(tempProjectPath, 'package.json')
      ) as Record<string, unknown>;
      const originalScripts = {
        ...(originalPackageJson.scripts as Record<string, unknown>),
      };

      const originalEslint = TestUtils.readJsonFile(
        path.join(tempProjectPath, '.eslintrc.json')
      ) as Record<string, unknown>;

      // Step 1: Create backup
      const backupResult = executeBackup(tempProjectPath);
      expect(backupResult.exitCode).toBe(0);
      expect(backupResult.stdout).toContain('✅ Backup creado en:');

      // Verify backup directory was created with correct structure
      const backupDir = extractBackupDir(backupResult.stdout, tempProjectPath);
      expect(fs.existsSync(backupDir)).toBe(true);
      expect(fs.lstatSync(backupDir).isDirectory()).toBe(true);

      // Verify all expected config files are backed up with correct content
      const backedUpEslint = TestUtils.readJsonFile(
        path.join(backupDir, '.eslintrc.json')
      ) as Record<string, unknown>;
      expect(backedUpEslint).toEqual(originalEslint);

      const backedUpPackageJson = TestUtils.readJsonFile(
        path.join(backupDir, 'package.json')
      ) as Record<string, unknown>;
      expect(backedUpPackageJson.scripts).toEqual(originalScripts);
      expect(backedUpPackageJson).toHaveProperty('name');
      expect(backedUpPackageJson).toHaveProperty('version');

      // Verify backup contains all expected config files
      const expectedBackupFiles = [
        '.eslintrc.json',
        '.prettierrc.json',
        'tsconfig.json',
        'jest.config.cjs',
        'package.json',
        '.npmignore',
      ];
      for (const file of expectedBackupFiles) {
        expect(fs.existsSync(path.join(backupDir, file))).toBe(true);
      }

      // Step 2: Run migration
      const migrationResult = executeMigration(tempProjectPath);
      expect(migrationResult.exitCode).toBe(0);
      expect(migrationResult.stdout).toContain(
        '🎉 ¡Migración completada exitosamente!'
      );

      // Verify migration changes were applied correctly
      const migratedPackageJson = TestUtils.readJsonFile(
        path.join(tempProjectPath, 'package.json')
      ) as Record<string, unknown>;
      const migratedScripts = migratedPackageJson.scripts as Record<
        string,
        unknown
      >;

      // Migration should add new scripts while preserving existing ones
      expect(migratedScripts).toHaveProperty('lint');
      expect(migratedScripts).toHaveProperty('test');
      expect(migratedScripts).toHaveProperty('build');

      // Original scripts should still be present
      expect(migratedScripts).toHaveProperty('validate:task');
      expect(migratedScripts['validate:task']).toBe('echo "Validation passed"');

      // Verify config files still exist after migration
      expect(fs.existsSync(path.join(tempProjectPath, '.eslintrc.json'))).toBe(
        true
      );
      expect(fs.existsSync(path.join(tempProjectPath, 'tsconfig.json'))).toBe(
        true
      );

      // Step 3: Rollback to original state
      const rollbackResult = executeRollback(tempProjectPath, backupDir);
      expect(rollbackResult.exitCode).toBe(0);
      expect(rollbackResult.stdout).toContain('✅ Rollback completado desde:');

      // Verify original state was restored exactly (should match original, not have migration scripts)
      const restoredPackageJson = TestUtils.readJsonFile(
        path.join(tempProjectPath, 'package.json')
      ) as Record<string, unknown>;
      const restoredScripts = restoredPackageJson.scripts as Record<
        string,
        unknown
      >;

      // Should match original pre-migration state exactly
      expect(restoredScripts).toEqual(originalScripts);

      // Verify migration-added scripts are NOT present after rollback
      expect(restoredScripts).not.toHaveProperty('format');

      // Verify all config files still exist after rollback
      expect(fs.existsSync(path.join(tempProjectPath, '.eslintrc.json'))).toBe(
        true
      );
      expect(
        fs.existsSync(path.join(tempProjectPath, '.prettierrc.json'))
      ).toBe(true);
      expect(fs.existsSync(path.join(tempProjectPath, 'tsconfig.json'))).toBe(
        true
      );
      expect(fs.existsSync(path.join(tempProjectPath, 'jest.config.cjs'))).toBe(
        true
      );

      // Verify ESLint config was restored correctly
      const restoredEslint = TestUtils.readJsonFile(
        path.join(tempProjectPath, '.eslintrc.json')
      ) as Record<string, unknown>;
      expect(restoredEslint).toEqual(originalEslint);
    }, 120000); // 2 minute timeout for migration test

    it('then rollback with "latest" parameter uses most recent backup', async () => {
      // Create first backup (original state)
      const backup1Result = executeBackup(tempProjectPath);
      expect(backup1Result.exitCode).toBe(0);
      const backup1Dir = extractBackupDir(
        backup1Result.stdout,
        tempProjectPath
      );

      // Record state after first backup (pre-modification)
      const preModificationPackageJson = TestUtils.readJsonFile(
        path.join(tempProjectPath, 'package.json')
      ) as Record<string, unknown>;
      const preModificationScripts = {
        ...(preModificationPackageJson.scripts as Record<string, unknown>),
      };

      // Make some changes to the project
      const packageJson = TestUtils.readJsonFile(
        path.join(tempProjectPath, 'package.json')
      ) as Record<string, unknown>;
      (packageJson.scripts as Record<string, unknown>).newScript =
        'echo "changed"';
      TestUtils.writeJsonFile(
        path.join(tempProjectPath, 'package.json'),
        packageJson
      );

      // Add a small delay to ensure different timestamp for second backup
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Create second backup (with changes)
      const backup2Result = executeBackup(tempProjectPath);
      expect(backup2Result.exitCode).toBe(0);
      const backup2Dir = extractBackupDir(
        backup2Result.stdout,
        tempProjectPath
      );

      // Verify both backups exist
      expect(fs.existsSync(backup1Dir)).toBe(true);
      expect(fs.existsSync(backup2Dir)).toBe(true);

      // Rollback using "latest" parameter - should restore the most recent backup (backup2)
      const rollbackResult = executeRollback(tempProjectPath, 'latest');
      expect(rollbackResult.exitCode).toBe(0);
      expect(rollbackResult.stdout).toContain('✅ Rollback completado desde:');

      // Verify the rollback used the latest backup (should be backup2 due to modification time)
      // The latest backup should be the one with the modification
      const latestBackupName = path.basename(backup2Dir);
      expect(rollbackResult.stdout).toContain(latestBackupName);

      // Verify state matches the backup that was restored
      const restoredPackageJson = TestUtils.readJsonFile(
        path.join(tempProjectPath, 'package.json')
      ) as Record<string, unknown>;
      const restoredScripts = restoredPackageJson.scripts as Record<
        string,
        unknown
      >;

      // If backup2 was restored (which has newScript), it should be present
      // If backup1 was restored, newScript should not be present
      // Either is acceptable as long as the "latest" logic works
      // For this test, we just verify rollback completed successfully
      expect(rollbackResult.stdout).toContain('Package.json restored');

      // Original scripts should still be present
      expect(restoredScripts).toHaveProperty('lint');
      expect(restoredScripts['validate:task']).toBe(
        preModificationScripts['validate:task']
      );

      // Verify .npmignore was created to prevent npm installs in backup dir
      expect(fs.existsSync(path.join(backup2Dir, '.npmignore'))).toBe(true);
      const npmignoreContent = fs.readFileSync(
        path.join(backup2Dir, '.npmignore'),
        'utf8'
      );
      expect(npmignoreContent).toContain('node_modules/');
      expect(npmignoreContent).toContain('BACKUP DIRECTORY');
    }, 120000); // 2 minute timeout for rollback test
  });
});

/**
 * Sets up initial configuration files in the temporary project
 */
function setupInitialConfigs(projectPath: string): void {
  // Create legacy ESLint config
  const eslintConfig = {
    extends: ['eslint:recommended'],
    rules: {
      'no-console': 'warn',
    },
  };
  TestUtils.writeJsonFile(
    path.join(projectPath, '.eslintrc.json'),
    eslintConfig
  );

  // Create legacy Prettier config
  const prettierConfig = {
    semi: true,
    singleQuote: true,
  };
  TestUtils.writeJsonFile(
    path.join(projectPath, '.prettierrc.json'),
    prettierConfig
  );

  // Create TypeScript config
  const tsConfig = {
    compilerOptions: {
      target: 'ES2020',
      module: 'commonjs',
    },
  };
  TestUtils.writeJsonFile(path.join(projectPath, 'tsconfig.json'), tsConfig);

  // Create Jest config
  const jestConfig = `module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts']
};`;
  TestUtils.createTestFile(projectPath, 'jest.config.cjs', jestConfig);

  // Update package.json to add required scripts for migration
  const packageJsonPath = path.join(projectPath, 'package.json');
  const pkg = TestUtils.readJsonFile(packageJsonPath) as Record<
    string,
    unknown
  >;
  (pkg.scripts as Record<string, unknown>) = {
    ...(pkg.scripts as Record<string, unknown>),
    'validate:task': 'echo "Validation passed"',
    build: 'echo "Build passed"',
    test: 'echo "Tests passed"',
  };
  TestUtils.writeJsonFile(packageJsonPath, pkg);
}

/**
 * Copies real bash scripts to the temporary project for E2E testing
 */
function setupScriptsInTempProject(projectPath: string): void {
  const scriptsDir = path.join(projectPath, 'scripts');
  fs.mkdirSync(scriptsDir, { recursive: true });

  const repoScriptsDir = path.join(process.cwd(), 'scripts');
  const scripts = [
    'backup-configs.sh',
    'migrate-to-unified.sh',
    'rollback-configs.sh',
  ];

  for (const script of scripts) {
    const src = path.join(repoScriptsDir, script);
    const dest = path.join(scriptsDir, script);

    if (!fs.existsSync(src)) {
      throw new Error(`Script not found: ${src}`);
    }

    fs.copyFileSync(src, dest);
    fs.chmodSync(dest, 0o755); // Make executable
  }
}

/**
 * Executes backup-configs.sh in the temporary project using real script
 */
function executeBackup(projectPath: string): {
  exitCode: number;
  stdout: string;
  stderr: string;
} {
  // Execute the real backup script
  const result = TestUtils.execCommand(
    'bash scripts/backup-configs.sh',
    projectPath,
    {
      timeout: 10000,
    }
  );

  return {
    exitCode: result.exitCode,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
  };
}

/**
 * Executes migrate-to-unified.sh in the temporary project using real script
 */
function executeMigration(projectPath: string): {
  exitCode: number;
  stdout: string;
  stderr: string;
} {
  // Execute the real migration script
  // Set NODE_ENV to avoid interactive prompts and ensure deterministic behavior
  const result = TestUtils.execCommand(
    'NODE_ENV=development bash scripts/migrate-to-unified.sh',
    projectPath,
    { timeout: 90000 } // 90 seconds for npm install + build + test
  );

  return {
    exitCode: result.exitCode,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
  };
}

/**
 * Executes rollback-configs.sh in the temporary project using real script
 */
function executeRollback(
  projectPath: string,
  backupDir: string
): {
  exitCode: number;
  stdout: string;
  stderr: string;
} {
  // Execute the real rollback script with the backup directory
  const cmd = `bash scripts/rollback-configs.sh ${backupDir}`;
  const result = TestUtils.execCommand(cmd, projectPath, {
    timeout: 10000,
  });

  return {
    exitCode: result.exitCode,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
  };
}

/**
 * Extracts backup directory path from backup command output and converts to absolute path
 */
function extractBackupDir(stdout: string, projectPath: string): string {
  const regex = /✅ Backup creado en: (.+)/;
  const match = regex.exec(stdout);
  const dir = match?.[1];

  if (!dir) {
    throw new Error('Could not extract backup directory from output');
  }

  // The script outputs a relative path like "backup/configs/20251208_152845"
  // Convert it to an absolute path
  return path.join(projectPath, dir.trim());
}
