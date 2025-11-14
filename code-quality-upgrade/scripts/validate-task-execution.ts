#!/usr/bin/env node
/**
 * Task Execution Validator
 * Valida que antes de ejecutar cualquier tarea se cumplan todos los requisitos
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as yaml from 'yaml';

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

class TaskExecutionValidator {
  private readonly config: ProjectConfig;
  private readonly projectRoot: string;

  constructor() {
    this.projectRoot = process.cwd();
    this.config = this.loadProjectConfig();
  }

  private loadProjectConfig(): ProjectConfig {
    const configPath = path.join(this.projectRoot, 'config', 'project-config.json');
    
    try {
      if (fs.existsSync(configPath)) {
        const configData = fs.readFileSync(configPath, 'utf8');
        return JSON.parse(configData);
      }
    } catch (error) {
      console.warn('Could not load project config, using defaults');
    }

    // Default configuration
    return {
      paths: {
        src: 'src',
        test: 'test',
        config: 'config',
        scripts: 'scripts',
        devDocs: 'dev-docs'
      },
      requirements: {
        nodeVersion: '>=16.0.0',
        dependencies: [
          'typescript',
          'jest',
          'eslint',
          'prettier'
        ]
      }
    };
  }

  async validatePreTaskExecution(taskName: string): Promise<ValidationResult> {
    console.log(`\n🔍 Validating pre-task execution: ${taskName}`);
    console.log('='.repeat(50));

    const checks: ValidationCheck[] = [];
    
    // 1. Rules file validation
    checks.push(await this.validateRulesFile());
    
    // 2. Path validation (no hardcoded paths)
    checks.push(await this.validateNoHardcodedPaths());
    
    // 3. Configuration consistency
    checks.push(await this.validateConfigurationConsistency());
    
    // 4. Environment check
    checks.push(await this.validateEnvironment());
    
    // 5. Dependencies check
    checks.push(await this.validateDependencies());
    
    // 6. Workspace structure
    checks.push(await this.validateWorkspaceStructure());
    
    // 7. Backup availability
    checks.push(await this.validateBackupMechanism());
    
    // 8. Rollback verification
    checks.push(await this.validateRollbackMechanism());

    const result: ValidationResult = {
      passed: checks.filter(c => c.required).every(c => c.passed),
      checks,
      warnings: checks.filter(c => !c.required && !c.passed).map(c => c.message),
      errors: checks.filter(c => c.required && !c.passed).map(c => c.message)
    };

    this.reportValidationResults(result);
    
    return result;
  }

  private async validateRulesFile(): Promise<ValidationCheck> {
    const rulesPath = path.join(this.projectRoot, 'config', 'code-quality-rules.md');
    
    try {
      if (!fs.existsSync(rulesPath)) {
        return {
          name: 'Rules File Check',
          passed: false,
          message: 'code-quality-rules.md not found',
          required: true
        };
      }

      const content = fs.readFileSync(rulesPath, 'utf8');
      const requiredSections = [
        'Task Execution',
        'Mandatory Validations',
        'Path Management Guidelines',
        'Pre-Task Validation Checklist'
      ];

      const hasAllSections = requiredSections.every(section => 
        content.includes(section)
      );

      return {
        name: 'Rules File Check',
        passed: hasAllSections,
        message: hasAllSections ? 
          'All required sections present in rules file' : 
          'Missing required sections in rules file',
        required: true
      };
    } catch (error) {
      return {
        name: 'Rules File Check',
        passed: false,
        message: `Error reading rules file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        required: true
      };
    }
  }

  private async validateNoHardcodedPaths(): Promise<ValidationCheck> {
    const forbiddenPatterns = [
      /\/Users\/[^\/]+\/Developer\/skills-fabrik\//,
      /\/home\/[^\/]+\//,
      /\/usr\/local\//,
      /C:\\Users\\/,
      /D:\\[Pp]rojects\//
    ];

    const searchPaths = [
      path.join(this.config.paths.src),
      path.join(this.config.paths.test),
      path.join(this.config.paths.scripts)
    ];

    let foundHardcodedPaths = 0;
    const hardcodedPaths: string[] = [];

    try {
      for (const searchPath of searchPaths) {
        if (fs.existsSync(searchPath)) {
          const files = this.getAllFiles(searchPath);
          
          for (const file of files) {
            if (file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.json')) {
              const content = fs.readFileSync(file, 'utf8');
              
              for (const pattern of forbiddenPatterns) {
                const matches = pattern.exec(content);
                if (matches) {
                  foundHardcodedPaths++;
                  hardcodedPaths.push(`${file}: ${matches[0]}`);
                }
              }
            }
          }
        }
      }

      return {
        name: 'No Hardcoded Paths Check',
        passed: foundHardcodedPaths === 0,
        message: foundHardcodedPaths === 0 ? 
          'No hardcoded paths found' : 
          `Found ${foundHardcodedPaths} hardcoded paths: ${hardcodedPaths.join(', ')}`,
        required: true
      };
    } catch (error) {
      return {
        name: 'No Hardcoded Paths Check',
        passed: false,
        message: `Error checking paths: ${error instanceof Error ? error.message : 'Unknown error'}`,
        required: true
      };
    }
  }

  private async validateConfigurationConsistency(): Promise<ValidationCheck> {
    const configFiles = [
      'package.json',
      'tsconfig.json',
      'jest.config.ts',
      '.eslintrc.json',
      '.prettierrc.json'
    ];

    const missingConfigs: string[] = [];
    const inconsistentPaths: string[] = [];

    for (const configFile of configFiles) {
      const configPath = path.join(this.projectRoot, configFile);
      
      if (!fs.existsSync(configPath)) {
        missingConfigs.push(configFile);
        continue;
      }

      // Check for hardcoded paths in config files
      try {
        const content = fs.readFileSync(configPath, 'utf8');
        const hasHardcodedPaths = /\/Users\/[^\/]+\//.test(content) ||
                                  /\/home\/[^\/]+\//.test(content);

        if (hasHardcodedPaths) {
          inconsistentPaths.push(configFile);
        }
      } catch (error) {
        // Ignore read errors for this check
      }
    }

    const passed = missingConfigs.length === 0 && inconsistentPaths.length === 0;
    const message = passed ? 
      'All configuration files are consistent' :
      `Missing: ${missingConfigs.join(', ')}${inconsistentPaths.length > 0 ? ' | Inconsistent: ' + inconsistentPaths.join(', ') : ''}`;

    return {
      name: 'Configuration Consistency Check',
      passed,
      message,
      required: true
    };
  }

  private async validateEnvironment(): Promise<ValidationCheck> {
    const requiredEnvVars = [
      'NODE_ENV',
      'PATH'
    ];

    const missingVars: string[] = [];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        missingVars.push(envVar);
      }
    }

    return {
      name: 'Environment Variables Check',
      passed: missingVars.length === 0,
      message: missingVars.length === 0 ? 
        'Required environment variables are set' :
        `Missing environment variables: ${missingVars.join(', ')}`,
      required: true
    };
  }

  private async validateDependencies(): Promise<ValidationCheck> {
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    
    try {
      if (!fs.existsSync(packageJsonPath)) {
        return {
          name: 'Dependencies Check',
          passed: false,
          message: 'package.json not found',
          required: true
        };
      }

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const devDependencies = Object.keys(packageJson.devDependencies || {});
      
      // Bug fix: Ensure requirements.dependencies exists before filtering
      const requiredDeps = this.config.requirements?.dependencies || [];
      const missingDependencies = requiredDeps.filter(
        dep => !devDependencies.includes(dep)
      );

      return {
        name: 'Dependencies Check',
        passed: missingDependencies.length === 0,
        message: missingDependencies.length === 0 ?
          'All required dependencies are installed' :
          `Missing dependencies: ${missingDependencies.join(', ')}`,
        required: true
      };
    } catch (error) {
      return {
        name: 'Dependencies Check',
        passed: false,
        message: `Error checking dependencies: ${error instanceof Error ? error.message : 'Unknown error'}`,
        required: true
      };
    }
  }

  private async validateWorkspaceStructure(): Promise<ValidationCheck> {
    const expectedPaths = [
      this.config.paths.src,
      this.config.paths.test,
      this.config.paths.config,
      this.config.paths.scripts,
      this.config.paths.devDocs
    ];

    const missingPaths: string[] = [];

    for (const expectedPath of expectedPaths) {
      const fullPath = path.join(this.projectRoot, expectedPath);
      if (!fs.existsSync(fullPath)) {
        missingPaths.push(expectedPath);
      }
    }

    return {
      name: 'Workspace Structure Check',
      passed: missingPaths.length === 0,
      message: missingPaths.length === 0 ?
        'Workspace structure is correct' :
        `Missing directories: ${missingPaths.join(', ')}`,
      required: true
    };
  }

  private async validateBackupMechanism(): Promise<ValidationCheck> {
    const backupScriptPath = path.join(this.projectRoot, 'scripts', 'backup-configs.sh');
    
    const exists = fs.existsSync(backupScriptPath);
    const executable = exists ? fs.statSync(backupScriptPath).mode & 0o111 : false;

    const isHealthy = Boolean(exists && executable);
    return {
      name: 'Backup Mechanism Check',
      passed: isHealthy,
      message: isHealthy ?
        'Backup mechanism is available and executable' :
        'Backup mechanism not found',
      required: true
    };
  }

  private async validateRollbackMechanism(): Promise<ValidationCheck> {
    const rollbackScriptPath = path.join(this.projectRoot, 'scripts', 'rollback-configs.sh');
    
    const exists = fs.existsSync(rollbackScriptPath);
    const executable = exists ? fs.statSync(rollbackScriptPath).mode & 0o111 : false;

    const isHealthy = Boolean(exists && executable);
    return {
      name: 'Rollback Mechanism Check',
      passed: isHealthy,
      message: isHealthy ?
        'Rollback mechanism is available and executable' :
        'Rollback mechanism not found',
      required: true
    };
  }

  private getAllFiles(dirPath: string): string[] {
    const files: string[] = [];

    try {
      const items = fs.readdirSync(dirPath);

      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          files.push(...this.getAllFiles(fullPath));
        } else {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Ignore errors in directory traversal
    }

    return files;
  }

  private reportValidationResults(result: ValidationResult): void {
    console.log('\n📋 Validation Results:');
    console.log('-'.repeat(30));

    for (const check of result.checks) {
      const status = check.passed ? '✅' : '❌';
      const required = check.required ? ' [REQUIRED]' : ' [OPTIONAL]';
      console.log(`${status} ${check.name}${required}: ${check.message}`);
    }

    if (result.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      result.warnings.forEach(warning => {
        console.log(`  • ${warning}`);
      });
    }

    if (result.errors.length > 0) {
      console.log('\n❌ Errors:');
      result.errors.forEach(error => {
        console.log(`  • ${error}`);
      });
    }

    if (result.passed) {
      console.log('\n🎉 All required validations passed!');
      console.log('✅ Task execution is APPROVED');
    } else {
      console.log('\n🛑 Validation failed!');
      console.log('❌ Task execution is BLOCKED - Fix errors before proceeding');
    }

    console.log('\n' + '='.repeat(50));
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const taskName = process.argv[2] || 'Unknown Task';
  
  const validator = new TaskExecutionValidator();
  
  validator.validatePreTaskExecution(taskName)
    .then(result => {
      process.exit(result.passed ? 0 : 1);
    })
    .catch(error => {
      console.error('Validation error:', error);
      process.exit(1);
    });
}

export { TaskExecutionValidator };