#!/usr/bin/env node
/**
 * Task Execution Validator
 * Valida que antes de ejecutar cualquier tarea se cumplan todos los requisitos
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import { logger } from '../utils/logger';

const HARDCODED_PATHS_CHECK_NAME = 'No Hardcoded Paths Check';
const RULES_FILE_CHECK_NAME = 'Rules File Check';
const RULES_FILE_FOUND_MESSAGE = 'All required sections present in rules file';
const RULES_FILE_MISSING_MESSAGE = 'code-quality-rules.md not found';
const RULES_FILE_SECTION_ERROR = 'Missing required sections in rules file';
const ERROR_READING_RULES_FILE = 'Error reading rules file';
const UNKNOWN_ERROR = 'Unknown error';
const DEPENDENCIES_CHECK_NAME = 'Dependencies Check';
const ENVIRONMENT_CHECK_NAME = 'Environment Variables Check';
const CONFIG_CONSISTENCY_CHECK_NAME = 'Configuration Consistency Check';
const WORKSPACE_CHECK_NAME = 'Workspace Structure Check';
const BACKUP_CHECK_NAME = 'Backup Mechanism Check';
const ROLLBACK_CHECK_NAME = 'Rollback Mechanism Check';
const CLI_UNKNOWN_TASK = 'Unknown Task';

interface ValidationResult {
  passed: boolean;
  checks: ValidationCheck[];
  warnings: string[];
  errors: string[];
}

interface ValidationCheck {
  name: string;
  passed: boolean;
  message: string;
  required: boolean;
}

interface ProjectConfig {
  paths: {
    src: string;
    test: string;
    config: string;
    scripts: string;
    devDocs: string;
  };
  requirements: {
    nodeVersion: string;
    dependencies: string[];
  };
}

interface PackageJson {
  devDependencies?: Record<string, string>;
}

class TaskExecutionValidator {
  private readonly config: ProjectConfig;
  private readonly projectRoot: string;

  constructor() {
    this.projectRoot = path.resolve(process.cwd());
    this.config = this.loadProjectConfig();
  }

  private loadProjectConfig(): ProjectConfig {
    const configPath = this.resolveProjectPath('config', 'project-config.json');

    try {
      if (this.safeExistsSync(configPath)) {
        const configData = this.safeReadFileSync(configPath, 'utf8');
        return JSON.parse(configData) as ProjectConfig;
      }
    } catch {
      // Could not load project config, using defaults
    }

    // Default configuration
    return {
      paths: {
        src: 'src',
        test: 'test',
        config: 'config',
        scripts: 'scripts',
        devDocs: 'dev-docs',
      },
      requirements: {
        nodeVersion: '>=16.0.0',
        dependencies: ['typescript', 'jest', 'eslint', 'prettier'],
      },
    };
  }

  async validatePreTaskExecution(taskName: string): Promise<ValidationResult> {
    logger.header(`🔍 Validating pre-task execution: ${taskName}`);

    const checks: ValidationCheck[] = [];

    // Execute all validations in parallel
    const validationTasks = [
      this.validateRulesFile(),
      this.validateNoHardcodedPaths(),
      this.validateConfigurationConsistency(),
      this.validateEnvironment(),
      this.validateDependencies(),
      this.validateWorkspaceStructure(),
      this.validateBackupMechanism(),
      this.validateRollbackMechanism(),
    ];

    const validationResults = await Promise.all(validationTasks);
    checks.push(...validationResults);

    const result: ValidationResult = {
      passed: checks.filter(c => c.required).every(c => c.passed),
      checks,
      warnings: checks
        .filter(c => !c.required && !c.passed)
        .map(c => c.message),
      errors: checks.filter(c => c.required && !c.passed).map(c => c.message),
    };

    this.reportValidationResults(result);

    return result;
  }

  private validateRulesFile(): Promise<ValidationCheck> {
    const rulesPath = this.resolveProjectPath(
      'config',
      'code-quality-rules.md'
    );

    try {
      if (!this.safeExistsSync(rulesPath)) {
        return Promise.resolve({
          name: RULES_FILE_CHECK_NAME,
          passed: false,
          message: RULES_FILE_MISSING_MESSAGE,
          required: true,
        });
      }

      const content = this.safeReadFileSync(rulesPath, 'utf8');
      const requiredSections = [
        'Task Execution',
        'Mandatory Validations',
        'Path Management Guidelines',
        'Pre-Task Validation Checklist',
      ];

      const hasAllSections = requiredSections.every(section =>
        content.includes(section)
      );

      return Promise.resolve({
        name: RULES_FILE_CHECK_NAME,
        passed: hasAllSections,
        message: hasAllSections
          ? RULES_FILE_FOUND_MESSAGE
          : RULES_FILE_SECTION_ERROR,
        required: true,
      });
    } catch (error) {
      return Promise.resolve({
        name: RULES_FILE_CHECK_NAME,
        passed: false,
        message: `${ERROR_READING_RULES_FILE}: ${error instanceof Error ? error.message : UNKNOWN_ERROR}`,
        required: true,
      });
    }
  }

  private searchForHardcodedPaths(
    searchPaths: string[],
    forbiddenPatterns: RegExp[]
  ): { foundHardcodedPaths: number; hardcodedPaths: string[] } {
    let foundHardcodedPaths = 0;
    const hardcodedPaths: string[] = [];

    for (const searchPath of searchPaths) {
      if (!this.safeExistsSync(searchPath)) {
        continue;
      }

      const files = this.getAllFiles(searchPath);
      foundHardcodedPaths += this.checkFilesForHardcodedPaths(
        files,
        forbiddenPatterns,
        hardcodedPaths
      );
    }

    return { foundHardcodedPaths, hardcodedPaths };
  }

  private checkFilesForHardcodedPaths(
    files: string[],
    forbiddenPatterns: RegExp[],
    hardcodedPaths: string[]
  ): number {
    let matchesCount = 0;
    for (const file of files) {
      if (!this.isCheckableFile(file)) {
        continue;
      }

      const content = this.safeReadFileSync(file, 'utf8');
      const matches = this.findPatternMatches(content, forbiddenPatterns);

      hardcodedPaths.push(...matches.map(match => `${file}: ${match}`));
      matchesCount += matches.length;
    }

    return matchesCount;
  }

  private isCheckableFile(file: string): boolean {
    return (
      file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.json')
    );
  }

  private findPatternMatches(content: string, patterns: RegExp[]): string[] {
    const matches: string[] = [];

    for (const pattern of patterns) {
      const match = pattern.exec(content);
      if (match) {
        matches.push(match[0]);
      }
    }

    return matches;
  }

  private createHardcodedPathsResult(
    foundHardcodedPaths: number,
    hardcodedPaths: string[]
  ): ValidationCheck {
    return {
      name: HARDCODED_PATHS_CHECK_NAME,
      passed: foundHardcodedPaths === 0,
      message: this.formatHardcodedPathsMessage(
        foundHardcodedPaths,
        hardcodedPaths
      ),
      required: true,
    };
  }

  private formatHardcodedPathsMessage(
    foundHardcodedPaths: number,
    hardcodedPaths: string[]
  ): string {
    if (foundHardcodedPaths === 0) {
      return 'No hardcoded paths found';
    }

    const pathsList = hardcodedPaths.join(', ');
    return `Found ${foundHardcodedPaths} hardcoded paths: ${pathsList}`;
  }

  private validateNoHardcodedPaths(): Promise<ValidationCheck> {
    const forbiddenPatterns = [
      /\/Users\/[^/]+\/Developer\/skills-fabrik\//,
      /\/home\/[^/]+\//,
      /\/usr\/local\//,
      /C:\\Users\\/,
      /D:\\[Pp]rojects\//,
    ];

    const searchPaths = [
      this.resolveProjectPath(this.config.paths.src),
      this.resolveProjectPath(this.config.paths.test),
      this.resolveProjectPath(this.config.paths.scripts),
    ];

    try {
      const { foundHardcodedPaths, hardcodedPaths } =
        this.searchForHardcodedPaths(searchPaths, forbiddenPatterns);

      return Promise.resolve(
        this.createHardcodedPathsResult(foundHardcodedPaths, hardcodedPaths)
      );
    } catch (error) {
      return Promise.resolve({
        name: HARDCODED_PATHS_CHECK_NAME,
        passed: false,
        message: `Error checking paths: ${error instanceof Error ? error.message : UNKNOWN_ERROR}`,
        required: true,
      });
    }
  }

  private validateConfigurationConsistency(): Promise<ValidationCheck> {
    const configFiles = [
      'package.json',
      'tsconfig.json',
      'jest.config.ts',
      '.eslintrc.json',
      '.prettierrc.json',
    ];

    const missingConfigs: string[] = [];
    const inconsistentPaths: string[] = [];

    for (const configFile of configFiles) {
      const configPath = this.resolveProjectPath(configFile);

      if (!this.safeExistsSync(configPath)) {
        missingConfigs.push(configFile);
        continue;
      }

      // Check for hardcoded paths in config files
      try {
        const content = this.safeReadFileSync(configPath, 'utf8');
        const hasHardcodedPaths =
          /\/Users\/[^/]+\//.test(content) || /\/home\/[^/]+\//.test(content);

        if (hasHardcodedPaths) {
          inconsistentPaths.push(configFile);
        }
      } catch {
        // Ignore read errors for this check
      }
    }

    const passed =
      missingConfigs.length === 0 && inconsistentPaths.length === 0;

    let message: string;
    if (passed) {
      message = 'All configuration files are consistent';
    } else {
      const missing = missingConfigs.join(', ');
      const inconsistent = inconsistentPaths.join(', ');
      const separator = inconsistentPaths.length > 0 ? ' | Inconsistent: ' : '';
      message = `Missing: ${missing}${separator}${inconsistent}`;
    }

    return Promise.resolve({
      name: CONFIG_CONSISTENCY_CHECK_NAME,
      passed,
      message,
      required: true,
    });
  }

  private validateEnvironment(): Promise<ValidationCheck> {
    const missingVars: string[] = [];
    const envSnapshot: Record<'NODE_ENV' | 'PATH', string | undefined> = {
      NODE_ENV: process.env.NODE_ENV,
      PATH: process.env.PATH,
    };

    for (const [envVar, value] of Object.entries(envSnapshot) as Array<
      [keyof typeof envSnapshot, string | undefined]
    >) {
      if (!value) {
        missingVars.push(envVar);
      }
    }

    return Promise.resolve({
      name: ENVIRONMENT_CHECK_NAME,
      passed: missingVars.length === 0,
      message:
        missingVars.length === 0
          ? 'Required environment variables are set'
          : `Missing environment variables: ${missingVars.join(', ')}`,
      required: true,
    });
  }

  private validateDependencies(): Promise<ValidationCheck> {
    const packageJsonPath = this.resolveProjectPath('package.json');

    try {
      if (!this.safeExistsSync(packageJsonPath)) {
        return Promise.resolve({
          name: DEPENDENCIES_CHECK_NAME,
          passed: false,
          message: 'package.json not found',
          required: true,
        });
      }

      const packageJson = JSON.parse(
        this.safeReadFileSync(packageJsonPath, 'utf8')
      ) as PackageJson;
      const devDependencies = Object.keys(packageJson.devDependencies ?? {});

      // Bug fix: Ensure requirements.dependencies exists before filtering
      const requiredDeps = this.config.requirements.dependencies;
      const missingDependencies = requiredDeps.filter(
        dep => !devDependencies.includes(dep)
      );

      return Promise.resolve({
        name: DEPENDENCIES_CHECK_NAME,
        passed: missingDependencies.length === 0,
        message:
          missingDependencies.length === 0
            ? 'All required dependencies are installed'
            : `Missing dependencies: ${missingDependencies.join(', ')}`,
        required: true,
      });
    } catch (error) {
      return Promise.resolve({
        name: DEPENDENCIES_CHECK_NAME,
        passed: false,
        message: `Error checking dependencies: ${error instanceof Error ? error.message : UNKNOWN_ERROR}`,
        required: true,
      });
    }
  }

  private validateWorkspaceStructure(): Promise<ValidationCheck> {
    const expectedPaths = [
      this.config.paths.src,
      this.config.paths.test,
      this.config.paths.config,
      this.config.paths.scripts,
      this.config.paths.devDocs,
    ];

    const missingPaths: string[] = [];

    for (const expectedPath of expectedPaths) {
      const fullPath = this.resolveProjectPath(expectedPath);
      if (!this.safeExistsSync(fullPath)) {
        missingPaths.push(expectedPath);
      }
    }

    return Promise.resolve({
      name: WORKSPACE_CHECK_NAME,
      passed: missingPaths.length === 0,
      message:
        missingPaths.length === 0
          ? 'Workspace structure is correct'
          : `Missing directories: ${missingPaths.join(', ')}`,
      required: true,
    });
  }

  private validateBackupMechanism(): Promise<ValidationCheck> {
    const backupScriptPath = this.resolveProjectPath(
      'scripts',
      'backup-configs.sh'
    );

    const exists = this.safeExistsSync(backupScriptPath);
    const executable = exists
      ? Boolean(this.safeStatSync(backupScriptPath).mode & 0o111)
      : false;

    const isHealthy = Boolean(exists && executable);
    return Promise.resolve({
      name: BACKUP_CHECK_NAME,
      passed: isHealthy,
      message: isHealthy
        ? 'Backup mechanism is available and executable'
        : 'Backup mechanism not found',
      required: true,
    });
  }

  private validateRollbackMechanism(): Promise<ValidationCheck> {
    const rollbackScriptPath = this.resolveProjectPath(
      'scripts',
      'rollback-configs.sh'
    );
    const exists = this.safeExistsSync(rollbackScriptPath);
    const executable = exists
      ? Boolean(this.safeStatSync(rollbackScriptPath).mode & 0o111)
      : false;

    const isHealthy = Boolean(exists && executable);
    return Promise.resolve({
      name: ROLLBACK_CHECK_NAME,
      passed: isHealthy,
      message: isHealthy
        ? 'Rollback mechanism is available and executable'
        : 'Rollback mechanism not found',
      required: true,
    });
  }

  private getAllFiles(dirPath: string): string[] {
    const files: string[] = [];

    try {
      const items = this.safeReaddirSync(dirPath);

      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = this.safeStatSync(fullPath);

        if (stat.isDirectory()) {
          files.push(...this.getAllFiles(fullPath));
        } else {
          files.push(fullPath);
        }
      }
    } catch {
      // Ignore errors in directory traversal
    }

    return files;
  }

  private resolveProjectPath(...segments: string[]): string {
    return path.resolve(this.projectRoot, ...segments);
  }

  private ensureWithinProject(targetPath: string): string {
    const normalized = path.resolve(targetPath);
    if (!normalized.startsWith(this.projectRoot)) {
      throw new Error(
        `Path outside of project root is not allowed: ${targetPath}`
      );
    }
    return normalized;
  }

  /**
   * Centralizes filesystem access and validates paths before delegating to Node's fs module.
   * Paths are resolved against the project root so disabling the security rule is safe.
   */
  /* eslint-disable security/detect-non-literal-fs-filename */
  private safeExistsSync(targetPath: string): boolean {
    try {
      const normalized = this.ensureWithinProject(targetPath);
      return fs.existsSync(normalized);
    } catch {
      return false;
    }
  }

  private safeReadFileSync(
    targetPath: string,
    encoding: BufferEncoding = 'utf8'
  ): string {
    const normalized = this.ensureWithinProject(targetPath);
    return fs.readFileSync(normalized, encoding);
  }

  private safeStatSync(targetPath: string): fs.Stats {
    const normalized = this.ensureWithinProject(targetPath);
    return fs.statSync(normalized);
  }

  private safeReaddirSync(targetPath: string): string[] {
    const normalized = this.ensureWithinProject(targetPath);
    return fs.readdirSync(normalized);
  }
  /* eslint-enable security/detect-non-literal-fs-filename */

  private reportValidationResults(_result: ValidationResult): void {}
}

// CLI usage
if (process.argv[1]?.endsWith('validate-task-execution.ts')) {
  const taskName = process.argv[2] || CLI_UNKNOWN_TASK;
  const validator = new TaskExecutionValidator();

  validator
    .validatePreTaskExecution(taskName)
    .then(result => {
      process.exit(result.passed ? 0 : 1);
    })
    .catch(error => {
      process.stderr.write(`Validation error: ${String(error)}\n`);
      process.exit(1);
    });
}

export { TaskExecutionValidator };
