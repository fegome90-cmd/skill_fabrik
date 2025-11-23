#!/usr/bin/env node
/**
 * Evidence CLI Automation Wrapper
 * Clean Architecture: CLI Interface Layer
 * TDD Implementation for T3.1.2 Evidence Script Automation
 */

/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

// eslint-disable-next-line simple-import-sort/imports
import { accessSync, constants, existsSync } from 'node:fs';

import { Command } from 'commander';

import { ProjectOptions } from '../types/validation';

import { validateProject } from './validate-evidence';

export interface CLIOptions {
  timeout?: number;
  verbose?: boolean;
  exclude?: string[];
  json?: boolean;
  noInteractive?: boolean;
}

export interface CLIConfig {
  defaultTimeout: number;
  defaultExcludePatterns: string[];
  maxExecutionTime: number;
}

export class EvidenceCLI {
  private readonly config: CLIConfig;
  private readonly cli: Command;

  constructor(config: Partial<CLIConfig> = {}) {
    this.config = {
      defaultTimeout: 30000,
      defaultExcludePatterns: [
        'node_modules/**',
        'coverage/**',
        'dist/**',
        'build/**',
      ],
      maxExecutionTime: 60000,
      ...config,
    };

    this.cli = this.setupCLI();
  }

  private setupCLI(): Command {
    const cli = new Command()
      .name(`evidence-cli-${Date.now()}`)
      .description('Evidence Validation CLI - Automated project validation')
      .exitOverride()
      .configureOutput({
        writeErr: () => {}, // Suppress stderr output to avoid pollution during tests
        writeOut: () => {}, // Suppress stdout output to avoid pollution during tests
      });

    cli
      .argument('<path>', 'Project path to validate')
      .option('-e, --exclude <patterns...>', 'Exclude patterns (glob)')
      .option(
        '-t, --timeout <ms>',
        'Validation timeout in milliseconds',
        '30000'
      )
      .option('--verbose', 'Verbose output')
      .option('--json', 'Output results in JSON format')
      .option('--no-interactive', 'Disable interactive prompts')
      .action(async (path: string, options: CLIOptions) => {
        await this.execute(path, options);
      });

    return cli;
  }

  public async run(argv: string[] = process.argv): Promise<void> {
    try {
      await this.cli.parseAsync(argv);
    } catch (error) {
      console.error(
        '❌ CLI Error:',
        error instanceof Error ? error.message : String(error)
      );
      process.exit(1);
    }
  }

  private async execute(
    projectPath: string,
    options: CLIOptions
  ): Promise<void> {
    const startTime = Date.now();

    if (options.verbose) {
      console.log('🔍 Evidence Validation CLI');
      console.log(`📁 Project: ${projectPath}`);
      console.log(
        `⏱️ Timeout: ${options.timeout || this.config.defaultTimeout}ms`
      );
    }

    // Validate project path
    this.validateProjectPath(projectPath);

    // Convert CLI options to project validation options
    const validationOptions: ProjectOptions = {
      excludePatterns: [
        ...this.config.defaultExcludePatterns,
        ...(options.exclude || []),
      ],
      timeout: parseInt(String(options.timeout ?? this.config.defaultTimeout)),
      verbose: options.verbose || false,
    };

    const parsedTimeout: number = Number.isFinite(validationOptions.timeout)
      ? Number(validationOptions.timeout)
      : /* istanbul ignore next */ this.config.defaultTimeout;
    const timeoutMs =
      parsedTimeout > 0 ? parsedTimeout : this.config.defaultTimeout;

    try {
      // Execute validation with timeout
      const results = await this.withTimeout(
        validateProject(projectPath, validationOptions),
        timeoutMs
      );

      const executionTime = Date.now() - startTime;

      if (options.verbose) {
        console.log(`⏱️ Execution time: ${executionTime}ms`);
      }

      // Output results
      this.outputResults(results, options.json);

      // Exit with appropriate code
      process.exit(results.summary.valid ? 0 : 1);
    } catch (error) {
      const executionTime = Date.now() - startTime;

      if (options.verbose) {
        console.log(`⏱️ Execution time: ${executionTime}ms`);
      }

      console.error(
        '❌ VALIDATION FAILED:',
        error instanceof Error ? error.message : String(error)
      );
      process.exit(1);
    }
  }

  private validateProjectPath(path: string): void {
    if (!path) {
      throw new Error('Project path is required');
    }

    if (!existsSync(path)) {
      throw new Error(`Project path not found: ${path}`);
    }

    try {
      accessSync(path, constants.R_OK);
    } catch {
      throw new Error(`Project path not accessible: ${path}`);
    }
  }

  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    let timeoutId: NodeJS.Timeout | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`Validation timeout exceeded: ${timeoutMs}ms`));
      }, timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]).finally(() => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    });
  }

  private outputResults(results: any, isJson: boolean = false): void {
    if (isJson) {
      console.log(JSON.stringify(results, null, 2));
      return;
    }

    console.log('\n🔍 EVIDENCE VALIDATION RESULTS');
    console.log('='.repeat(50));

    // Encoding Results
    console.log(
      `\n📝 Encoding Validation: ${results.encoding?.valid ? '✅ PASS' : '❌ FAIL'}`
    );
    if (results.encoding?.issues?.length > 0) {
      console.log(`   Issues: ${results.encoding.issues.length}`);
      results.encoding.issues.forEach((issue: any) => {
        console.log(`   - ${issue.file}: ${issue.issue}`);
      });
    }

    // Links Results
    console.log(
      `\n🔗 Links Validation: ${results.links?.valid ? '✅ PASS' : '❌ FAIL'}`
    );
    if (results.links?.issues?.length > 0) {
      console.log(`   Issues: ${results.links.issues.length}`);
      results.links.issues.forEach((issue: any) => {
        console.log(`   - ${issue.file}: ${issue.issue}`);
      });
    }

    // Package Results
    console.log(
      `\n📦 Package Validation: ${results.package?.valid ? '✅ PASS' : '❌ FAIL'}`
    );
    if (results.package?.issues?.length > 0) {
      console.log(`   Issues: ${results.package.issues.length}`);
      results.package.issues.forEach((issue: any) => {
        console.log(`   - ${issue.issue}`);
      });
    }

    // Summary
    console.log(`\n📊 SUMMARY:`);
    console.log(`   Total Issues: ${results.summary?.totalIssues || 0}`);
    console.log(
      `   Overall Status: ${results.summary?.valid ? '✅ VALIDATION COMPLETED' : '❌ VALIDATION FAILED'}`
    );
  }
}

// Export main function for npm script integration
export async function main(): Promise<void> {
  const cli = new EvidenceCLI();
  await cli.run();
}

export function runIfMain(
  entryModule: NodeModule,
  mainRef: NodeModule | undefined = require.main,
  mainFn?: () => Promise<void>
): Promise<void> | void {
  const runner = mainFn ?? /* istanbul ignore next */ main;
  /* istanbul ignore next */
  if (mainRef === entryModule) {
    return runner().catch(error => {
      console.error('Fatal error:', error);
      /* istanbul ignore next -- process termination not measurable in unit tests */
      process.exit(1);
    });
  }
  return undefined;
}

// Execute if called directly
void runIfMain(module, require.main, main);
