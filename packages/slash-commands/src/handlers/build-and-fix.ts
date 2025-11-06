/**
 * Build and Fix Handler
 *
 * Handles automatic build, lint, and fix operations for the project
 * Integrates with prettier, TypeScript compiler, and testing frameworks
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import {
  SlashCommandContext,
  ParsedSlashCommand,
  SlashCommandResult,
  BuildAndFixResult,
  ToolResult
} from '../types.js';
import { SlashCommandHandler } from './base.js';

export class BuildAndFixHandler extends SlashCommandHandler {
  constructor(command: any, contextManager?: any) {
    super(command, contextManager);
  }

  /**
   * Validate build-and-fix command arguments and environment
   */
  protected async validateCommand(
    parsedCommand: ParsedSlashCommand,
    context: SlashCommandContext
  ): Promise<{ valid: boolean; message?: string }> {
    // Check if we're in a valid project directory
    const packageJsonPath = join(context.workspace.root, 'package.json');
    if (!existsSync(packageJsonPath)) {
      return {
        valid: false,
        message: 'No package.json found. Please run from a valid project directory.'
      };
    }

    // Validate flags
    const fixFlag = this.getFlag(parsedCommand, 'fix', true);
    const testFlag = this.getFlag(parsedCommand, 'test', false);
    const verboseFlag = this.getFlag(parsedCommand, 'verbose', false);

    if (typeof fixFlag !== 'boolean') {
      return {
        valid: false,
        message: 'Flag --fix must be a boolean value'
      };
    }

    if (typeof testFlag !== 'boolean') {
      return {
        valid: false,
        message: 'Flag --test must be a boolean value'
      };
    }

    return { valid: true };
  }

  /**
   * Handle the build-and-fix command execution
   */
  protected async handle(
    parsedCommand: ParsedSlashCommand,
    context: SlashCommandContext
  ): Promise<Omit<SlashCommandResult, 'context' | 'metadata'>> {
    const startTime = Date.now();
    const workspaceRoot = context.workspace.root;

    // Get command options
    const shouldFix = this.getFlag(parsedCommand, 'fix', true);
    const shouldTest = this.getFlag(parsedCommand, 'test', false);
    const verbose = this.getFlag(parsedCommand, 'verbose', false);
    const dryRun = this.getFlag(parsedCommand, 'dry-run', false);

    try {
      if (verbose) {
        console.log('🔧 Starting build and fix process...');
        console.log(`   Fix mode: ${shouldFix ? 'ON' : 'OFF'}`);
        console.log(`   Test mode: ${shouldTest ? 'ON' : 'OFF'}`);
        console.log(`   Dry run: ${dryRun ? 'ON' : 'OFF'}`);
      }

      const results: BuildAndFixResult = {
        prettier: { success: false, exitCode: -1, output: '', errors: [], warnings: [], duration: 0 },
        typescript: { success: false, exitCode: -1, output: '', errors: [], warnings: [], duration: 0 },
        tests: { success: false, exitCode: -1, output: '', errors: [], warnings: [], duration: 0 },
        totalErrors: 0,
        autoFixed: 0,
        suggestions: [],
        blocked: false
      };

      // Step 1: Prettier formatting
      if (verbose) console.log('\n📝 Running Prettier...');
      results.prettier = await this.runPrettier(workspaceRoot, shouldFix, dryRun, verbose);

      // Step 2: TypeScript compilation and fixes
      if (verbose) console.log('\n📦 Running TypeScript compilation...');
      results.typescript = await this.runTypeScript(workspaceRoot, shouldFix, dryRun, verbose);

      // Step 3: Run tests if requested
      if (shouldTest) {
        if (verbose) console.log('\n🧪 Running tests...');
        results.tests = await this.runTests(workspaceRoot, verbose);
      }

      // Calculate totals
      results.totalErrors = results.prettier.errors.length +
                           results.typescript.errors.length +
                           results.tests.errors.length;

      results.autoFixed = this.countFixedFiles(results);
      results.suggestions = this.generateSuggestions(results);
      results.blocked = results.totalErrors > 0 && !shouldFix;

      // Persist results to MemTech L1
      await this.persistResults(context.sessionId, results);

      const executionTime = Date.now() - startTime;
      const output = this.formatBuildAndFixOutput(results, verbose);

      // Add next actions based on results
      const nextActions = this.generateNextActions(results);

      return {
        success: results.totalErrors === 0 || (shouldFix && results.autoFixed > 0),
        output,
        data: results,
        nextActions
      };

    } catch (error) {
      console.error('❌ Build and fix failed:', error);
      const errorMessage = error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error);
      return this.createErrorResult(
        this.createError('execution', `Build and fix failed: ${errorMessage}`)
      );
    }
  }

  /**
   * Run Prettier formatting
   */
  private async runPrettier(
    root: string,
    shouldFix: boolean,
    dryRun: boolean,
    verbose: boolean
  ): Promise<ToolResult> {
    const startTime = Date.now();

    try {
      const fixFlag = shouldFix && !dryRun ? '--write' : '--check';
      const command = `npx prettier "${root}/**/*.{ts,js,tsx,jsx,json,md}" ${fixFlag}`;

      if (verbose) console.log(`   Running: ${command}`);

      const output = execSync(command, {
        encoding: 'utf-8',
        cwd: root,
        stdio: dryRun ? 'pipe' : 'inherit'
      });

      const duration = Date.now() - startTime;

      return {
        success: true,
        exitCode: 0,
        output: output || 'Prettier formatting completed successfully',
        errors: [],
        warnings: [],
        duration
      };

    } catch (error: any) {
      const duration = Date.now() - startTime;
      const output = error.stdout || (error instanceof Error ? error.message : String(error)) || '';
      const errors = this.parsePrettierErrors(output);

      return {
        success: false,
        exitCode: error.status || 1,
        output,
        errors,
        warnings: [],
        duration
      };
    }
  }

  /**
   * Run TypeScript compilation and fixes
   */
  private async runTypeScript(
    root: string,
    shouldFix: boolean,
    dryRun: boolean,
    verbose: boolean
  ): Promise<ToolResult> {
    const startTime = Date.now();

    try {
      // First, try to compile
      const compileCommand = 'npx tsc --noEmit --pretty';

      if (verbose) console.log(`   Running: ${compileCommand}`);

      const output = execSync(compileCommand, {
        encoding: 'utf-8',
        cwd: root,
        stdio: 'pipe'
      });

      const duration = Date.now() - startTime;

      return {
        success: true,
        exitCode: 0,
        output: 'TypeScript compilation successful',
        errors: [],
        warnings: [],
        duration
      };

    } catch (error: any) {
      const duration = Date.now() - startTime;
      const output = error.stdout || (error instanceof Error ? error.message : String(error)) || '';

      if (shouldFix && !dryRun) {
        if (verbose) console.log('   🔧 Attempting to fix TypeScript errors...');

        // Try to fix common TypeScript errors
        const fixResults = await this.attemptTypeScriptFixes(root, output, verbose);

        return {
          success: fixResults.fixed,
          exitCode: fixResults.fixed ? 0 : error.status || 1,
          output: fixResults.output || output,
          errors: fixResults.errors,
          warnings: fixResults.warnings,
          duration
        };
      }

      const errors = this.parseTypeScriptErrors(output);

      return {
        success: false,
        exitCode: error.status || 1,
        output,
        errors,
        warnings: [],
        duration
      };
    }
  }

  /**
   * Run tests
   */
  private async runTests(root: string, verbose: boolean): Promise<ToolResult> {
    const startTime = Date.now();

    try {
      const testCommand = 'npm test -- --passWithNoTests --watchAll=false';

      if (verbose) console.log(`   Running: ${testCommand}`);

      const output = execSync(testCommand, {
        encoding: 'utf-8',
        cwd: root,
        stdio: verbose ? 'inherit' : 'pipe'
      });

      const duration = Date.now() - startTime;

      return {
        success: true,
        exitCode: 0,
        output: 'All tests passed',
        errors: [],
        warnings: [],
        duration
      };

    } catch (error: any) {
      const duration = Date.now() - startTime;
      const output = error.stdout || (error instanceof Error ? error.message : String(error)) || '';
      const errors = this.parseTestErrors(output);

      return {
        success: false,
        exitCode: error.status || 1,
        output,
        errors,
        warnings: [],
        duration
      };
    }
  }

  /**
   * Attempt to fix common TypeScript errors
   */
  private async attemptTypeScriptFixes(
    root: string,
    errorOutput: string,
    verbose: boolean
  ): Promise<{ fixed: boolean; output: string; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let fixed = false;
    let output = '';

    try {
      // Parse common error patterns and attempt fixes
      const errorLines = errorOutput.split('\n');

      for (const line of errorLines) {
        if (line.includes("Cannot find module") || line.includes("has no exported member")) {
          // Try to install missing dependencies
          const moduleMatch = line.match(/'([^']+)'/);
          if (moduleMatch) {
            const moduleName = moduleMatch[1];
            if (verbose) console.log(`   📦 Attempting to install module: ${moduleName}`);

            try {
              execSync(`npm install ${moduleName}`, { cwd: root, stdio: 'pipe' });
              fixed = true;
              output += `✅ Installed missing module: ${moduleName}\n`;
            } catch (installError) {
              const installErrorMessage = installError instanceof Error ? installError.message : String(installError);
              errors.push(`Failed to install module ${moduleName}: ${installErrorMessage}`);
            }
          }
        } else if (line.includes("Property") && line.includes("does not exist on type")) {
          // Try to add type annotations or fix property access
          warnings.push(`Type error: ${line.trim()}`);
        }
      }

      // Re-run compilation to check if fixes worked
      if (fixed) {
        try {
          execSync('npx tsc --noEmit', { cwd: root, stdio: 'pipe' });
          fixed = true;
          output += '✅ TypeScript compilation successful after fixes\n';
        } catch (recompileError) {
          fixed = false;
          errors.push('TypeScript errors remain after attempted fixes');
        }
      }

    } catch (fixError) {
      const fixErrorMessage = fixError instanceof Error ? fixError.message : String(fixError);
      errors.push(`Fix attempt failed: ${fixErrorMessage}`);
    }

    return { fixed, output, errors, warnings };
  }

  /**
   * Parse prettier errors
   */
  private parsePrettierErrors(output: string): string[] {
    const errors: string[] = [];
    const lines = output.split('\n');

    for (const line of lines) {
      if (line.includes('Code style issues found') ||
          line.includes('error') ||
          line.includes('SyntaxError')) {
        errors.push(line.trim());
      }
    }

    return errors;
  }

  /**
   * Parse TypeScript errors
   */
  private parseTypeScriptErrors(output: string): string[] {
    const errors: string[] = [];
    const lines = output.split('\n');

    for (const line of lines) {
      if (line.includes('error TS') && line.includes(':')) {
        errors.push(line.trim());
      }
    }

    return errors;
  }

  /**
   * Parse test errors
   */
  private parseTestErrors(output: string): string[] {
    const errors: string[] = [];
    const lines = output.split('\n');

    for (const line of lines) {
      if (line.includes('FAIL') ||
          line.includes('✕') ||
          line.includes('Error:') ||
          line.includes('Test suite failed')) {
        errors.push(line.trim());
      }
    }

    return errors;
  }

  /**
   * Count number of fixed files
   */
  private countFixedFiles(results: BuildAndFixResult): number {
    // This is a simplified count - in a real implementation,
    // we would track which files were actually modified
    return (results.prettier.success ? 1 : 0) +
           (results.typescript.success ? 1 : 0);
  }

  /**
   * Generate suggestions based on results
   */
  private generateSuggestions(results: BuildAndFixResult): string[] {
    const suggestions: string[] = [];

    if (results.prettier.errors.length > 0) {
      suggestions.push('Run with --fix flag to auto-format code');
    }

    if (results.typescript.errors.length > 0) {
      suggestions.push('Check TypeScript configuration in tsconfig.json');
      suggestions.push('Install missing type packages with npm install --save-dev @types/*');
    }

    if (results.tests.errors.length > 0) {
      suggestions.push('Fix failing tests before committing changes');
    }

    if (results.totalErrors === 0) {
      suggestions.push('✅ All checks passed! Ready to commit.');
    }

    return suggestions;
  }

  /**
   * Generate next actions based on results
   */
  private generateNextActions(results: BuildAndFixResult): string[] {
    const actions: string[] = [];

    if (results.totalErrors > 0) {
      actions.push('/build-and-fix --fix --test');
      actions.push('/code-review');
    } else {
      actions.push('/git-add');
      actions.push('/git-commit');
    }

    if (results.typescript.errors.length > 0) {
      actions.push('/install-missing-types');
    }

    return actions;
  }

  /**
   * Format output for display
   */
  private formatBuildAndFixOutput(results: BuildAndFixResult, verbose: boolean): string {
    let output = '## Build and Fix Results\n\n';

    // Summary
    output += `### Summary\n`;
    output += `- Total Errors: ${results.totalErrors}\n`;
    output += `- Auto Fixed: ${results.autoFixed}\n`;
    output += `- Status: ${results.blocked ? '🚫 Blocked' : '✅ Ready'}\n\n`;

    // Prettier results
    output += `### Prettier ${results.prettier.success ? '✅' : '❌'}\n`;
    output += `- Duration: ${results.prettier.duration}ms\n`;
    if (results.prettier.errors.length > 0) {
      output += `- Errors: ${results.prettier.errors.length}\n`;
      if (verbose) {
        results.prettier.errors.forEach(error => {
          output += `  - ${error}\n`;
        });
      }
    }
    output += '\n';

    // TypeScript results
    output += `### TypeScript ${results.typescript.success ? '✅' : '❌'}\n`;
    output += `- Duration: ${results.typescript.duration}ms\n`;
    if (results.typescript.errors.length > 0) {
      output += `- Errors: ${results.typescript.errors.length}\n`;
      if (verbose) {
        results.typescript.errors.forEach(error => {
          output += `  - ${error}\n`;
        });
      }
    }
    output += '\n';

    // Test results
    if (results.tests.duration > 0) {
      output += `### Tests ${results.tests.success ? '✅' : '❌'}\n`;
      output += `- Duration: ${results.tests.duration}ms\n`;
      if (results.tests.errors.length > 0) {
        output += `- Errors: ${results.tests.errors.length}\n`;
        if (verbose) {
          results.tests.errors.forEach(error => {
            output += `  - ${error}\n`;
          });
        }
      }
      output += '\n';
    }

    // Suggestions
    if (results.suggestions.length > 0) {
      output += `### Suggestions\n`;
      results.suggestions.forEach(suggestion => {
        output += `- ${suggestion}\n`;
      });
      output += '\n';
    }

    return output;
  }

  /**
   * Persist results to MemTech L1
   */
  private async persistResults(sessionId: string, results: BuildAndFixResult): Promise<void> {
    try {
      await this.contextManager.updateContext(sessionId, {
        state: {
          buildResults: results,
          lastRun: new Date().toISOString(),
          workspaceSnapshot: await this.captureWorkspace()
        },
        metadata: {}
      });
    } catch (error) {
      console.warn('Failed to persist results to MemTech L1:', error);
    }
  }

  /**
   * Get integration type
   */
  protected getIntegrationType(): 'skill' | 'daemon' | 'cli' | 'native' {
    return 'cli';
  }
}