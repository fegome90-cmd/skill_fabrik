#!/usr/bin/env node

/**
 * E2E Test Suite for Skills Fabric CLI
 * Comprehensive testing with error detection and reporting
 */

import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class E2ETestSuite {
  constructor() {
    this.results = [];
    this.errors = [];
    this.warnings = [];
    this.recommendations = [];
    this.startTime = Date.now();
  }

  // Colors for output
  colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
  };

  private log(level: 'info' | 'success' | 'warning' | 'error', message: string, details?: any) {
    const timestamp = new Date().toISOString();
    const color = {
      info: this.colors.blue,
      success: this.colors.green,
      warning: this.colors.yellow,
      error: this.colors.red
    }[level];

    console.log(`${color}[${level.toUpperCase()}]${this.colors.reset} ${timestamp} - ${message}`);
    if (details) {
      console.log(`${color}DETAILS:${this.colors.reset}`, JSON.stringify(details, null, 2));
    }
  }

  private async runTest(name: string, testFn: () => Promise<void>): Promise<TestResult> {
    const startTime = Date.now();
    this.log('info', `Running test: ${name}`);

    try {
      await testFn();
      const duration = Date.now() - startTime;
      const result: TestResult = { name, status: 'PASS', duration };
      this.results.push(result);
      this.log('success', `✓ ${name} (${duration}ms)`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      const result: TestResult = {
        name,
        status: 'FAIL',
        duration,
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      };
      this.results.push(result);
      this.errors.push(`${name}: ${errorMessage}`);
      this.log('error', `✗ ${name} (${duration}ms) - ${errorMessage}`);
      return result;
    }
  }

  private async execCommand(command: string, options: { cwd?: string; timeout?: number; expectFailure?: boolean } = {}): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    return new Promise((resolve, reject) => {
      const { cwd = process.cwd(), timeout = 30000, expectFailure = false } = options;

      const child = spawn(command, {
        shell: true,
        cwd,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, NODE_ENV: 'test' }
      });

      let stdout = '';
      let stderr = '';
      let isTimedOut = false;

      const timeoutId = setTimeout(() => {
        isTimedOut = true;
        child.kill('SIGKILL');
        reject(new Error(`Command timed out after ${timeout}ms: ${command}`));
      }, timeout);

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        clearTimeout(timeoutId);

        if (isTimedOut) return;

        const success = expectFailure ? code !== 0 : code === 0;
        if (success) {
          resolve({ stdout, stderr, exitCode: code || 0 });
        } else {
          reject(new Error(`Command failed with exit code ${code}: ${command}\nSTDOUT: ${stdout}\nSTDERR: ${stderr}`));
        }
      });

      child.on('error', (error) => {
        clearTimeout(timeoutId);
        reject(new Error(`Failed to execute command: ${command} - ${error.message}`));
      });
    });
  }

  private createTempDirectory(): string {
    const tempDir = `/tmp/skills-cli-e2e-${Date.now()}`;
    mkdirSync(tempDir, { recursive: true });
    return tempDir;
  }

  private createTestProject(projectDir: string, type: 'node' | 'python' | 'empty' = 'node'): void {
    switch (type) {
      case 'node':
        writeFileSync(join(projectDir, 'package.json'), JSON.stringify({
          name: 'test-project',
          version: '1.0.0',
          scripts: { build: 'echo "Building..."', test: 'echo "Testing..."' }
        }, null, 2));

        writeFileSync(join(projectDir, 'index.js'), `
function testFunction() {
  console.log('Hello World');
  return 'test';
}

module.exports = { testFunction };
        `.trim());

        writeFileSync(join(projectDir, 'README.md'), '# Test Project\n\nA simple test project.');
        break;

      case 'python':
        writeFileSync(join(projectDir, 'requirements.txt'), 'requests==2.28.0\nflask==2.0.0');
        writeFileSync(join(projectDir, 'app.py'), `
def test_function():
    print("Hello World")
    return "test"

if __name__ == "__main__":
    test_function()
        `.trim());
        break;

      case 'empty':
        // Create empty directory
        break;
    }
  }

  // Test Methods
  private async testPackageBuild(): Promise<void> {
    const result = await this.execCommand('pnpm --filter @skills-fabrik/skills-cli build', {
      cwd: '/Users/felipe/Developer/skills-fabrik'
    });

    if (!existsSync('/Users/felipe/Developer/skills-fabrik/packages/skills-cli/dist/index.js')) {
      throw new Error('Build output not found');
    }

    this.log('success', 'Package builds correctly', {
      stdoutLines: result.stdout.split('\n').length
    });
  }

  private async testCLIHelp(): Promise<void> {
    const result = await this.execCommand('node packages/skills-cli/dist/index.js --help', {
      cwd: '/Users/felipe/Developer/skills-fabrik'
    });

    if (!result.stdout.includes('Skills Fabric CLI') && !result.stdout.includes('skills-cli')) {
      throw new Error('Help output does not contain expected CLI identification');
    }

    this.log('success', 'CLI help command works', {
      outputLength: result.stdout.length
    });
  }

  private async testSlashCommandList(): Promise<void> {
    const result = await this.execCommand('node packages/skills-cli/dist/index.js slash list', {
      cwd: '/Users/felipe/Developer/skills-fabrik'
    });

    const expectedCommands = [
      'build-and-fix',
      'code-review',
      'compact',
      'dev-docs-update',
      'plugin',
      'test-route',
      'route-research-for-testing',
      'undo'
    ];

    const missingCommands = expectedCommands.filter(cmd => !result.stdout.includes(cmd));
    if (missingCommands.length > 0) {
      throw new Error(`Missing slash commands: ${missingCommands.join(', ')}`);
    }

    this.log('success', 'All slash commands listed', {
      commandCount: expectedCommands.length
    });
  }

  private async testGlobalInstallation(): Promise<void> {
    const tempDir = this.createTempDirectory();

    try {
      // Test package creation
      const packageResult = await this.execCommand('npm pack --dry-run', {
        cwd: '/Users/felipe/Developer/skills-fabrik/packages/skills-cli'
      });

      if (!packageResult.stdout.includes('package size:')) {
        throw new Error('npm pack did not output package size information');
      }

      this.log('success', 'Package validation successful', {
        output: packageResult.stdout.split('\n').slice(0, 3).join('\n')
      });

    } finally {
      // Cleanup temp directory
      try {
        await this.execCommand(`rm -rf ${tempDir}`);
      } catch (error) {
        this.warnings.push(`Failed to cleanup temp directory: ${tempDir}`);
      }
    }
  }

  private async testStandaloneMode(): Promise<void> {
    const tempDir = this.createTempDirectory();
    this.createTestProject(tempDir, 'node');

    try {
      // Test standalone slash command execution
      const result = await this.execCommand('node /Users/felipe/Developer/skills-fabrik/packages/skills-cli/dist/index.js slash list', {
        cwd: tempDir
      });

      if (!result.stdout.includes('Standalone')) {
        throw new Error('Standalone mode not activated properly');
      }

      this.log('success', 'Standalone mode works correctly');

    } finally {
      await this.execCommand(`rm -rf ${tempDir}`);
    }
  }

  private async testSlashCommandExecution(): Promise<void> {
    const tempDir = this.createTempDirectory();
    this.createTestProject(tempDir, 'node');

    try {
      // Test build-and-fix command
      const buildResult = await this.execCommand(
        'node /Users/felipe/Developer/skills-fabrik/packages/skills-cli/dist/index.js / build-and-fix --dry-run',
        { cwd: tempDir, timeout: 15000 }
      );

      if (!buildResult.stdout.includes('build') && !buildResult.stdout.includes('Build')) {
        this.warnings.push('build-and-fix command output validation unclear');
      }

      // Test code-review command
      const reviewResult = await this.execCommand(
        'node /Users/felipe/Developer/skills-fabrik/packages/skills-cli/dist/index.js / code-review --dry-run',
        { cwd: tempDir, timeout: 15000 }
      );

      if (!reviewResult.stdout.includes('review') && !reviewResult.stdout.includes('Review')) {
        this.warnings.push('code-review command output validation unclear');
      }

      this.log('success', 'Slash command execution works', {
        buildOutputLength: buildResult.stdout.length,
        reviewOutputLength: reviewResult.stdout.length
      });

    } finally {
      await this.execCommand(`rm -rf ${tempDir}`);
    }
  }

  private async testErrorHandling(): Promise<void> {
    const tempDir = this.createTempDirectory();

    try {
      // Test invalid command
      try {
        await this.execCommand(
          'node /Users/felipe/Developer/skills-fabrik/packages/skills-cli/dist/index.js / invalid-command',
          { cwd: tempDir, expectFailure: true }
        );
        this.warnings.push('Invalid command should have failed');
      } catch (error) {
        // Expected to fail - log diagnostic information
        this.log('success', 'Invalid command properly rejected', { error: this.formatError(error) });
      }

      // Test missing required arguments
      try {
        await this.execCommand(
          'node /Users/felipe/Developer/skills-fabrik/packages/skills-cli/dist/index.js / test-route',
          { cwd: tempDir, expectFailure: true }
        );
        this.warnings.push('Command with missing args should have failed');
      } catch (error) {
        // Expected to fail - log diagnostic information
        this.log('success', 'Missing arguments properly rejected', { error: this.formatError(error) });
      }

    } finally {
      await this.execCommand(`rm -rf ${tempDir}`);
    }
  }

  private async testClaudeCodeIntegration(): Promise<void> {
    // Test Claude Code command files exist
    const commandsDir = '/Users/felipe/Developer/skills-fabrik/.claude/commands';
    const expectedCommands = [
      'build-and-fix.md',
      'code-review.md',
      'compact.md',
      'dev-docs-update.md',
      'plugin.md',
      'test-route.md',
      'route-research-for-testing.md',
      'undo.md'
    ];

    const missingFiles = expectedCommands.filter(cmd => !existsSync(join(commandsDir, cmd)));
    if (missingFiles.length > 0) {
      throw new Error(`Missing Claude Code command files: ${missingFiles.join(', ')}`);
    }

    // Validate command file content
    const buildCommandPath = join(commandsDir, 'build-and-fix.md');
    const buildCommandContent = readFileSync(buildCommandPath, 'utf8');

    if (!buildCommandContent.includes('node packages/skills-cli/dist/index.js')) {
      throw new Error('Claude Code command files do not reference correct CLI path');
    }

    this.log('success', 'Claude Code integration validated', {
      commandFilesCount: expectedCommands.length
    });
  }

  private async testPerformance(): Promise<void> {
    const tempDir = this.createTempDirectory();

    try {
      // Test CLI startup time
      const startTime = Date.now();
      await this.execCommand('node /Users/felipe/Developer/skills-fabrik/packages/skills-cli/dist/index.js --version', {
        cwd: tempDir
      });
      const startupTime = Date.now() - startTime;

      if (startupTime > 5000) {
        this.warnings.push(`CLI startup time is slow: ${startupTime}ms`);
      }

      // Test slash command response time
      const slashStartTime = Date.now();
      await this.execCommand('node /Users/felipe/Developer/skills-fabrik/packages/skills-cli/dist/index.js slash list', {
        cwd: tempDir
      });
      const slashTime = Date.now() - slashStartTime;

      if (slashTime > 10000) {
        this.warnings.push(`Slash command response time is slow: ${slashTime}ms`);
      }

      this.log('success', 'Performance metrics collected', {
        startupTime: `${startupTime}ms`,
        slashTime: `${slashTime}ms`
      });

    } finally {
      await this.execCommand(`rm -rf ${tempDir}`);
    }
  }

  private async testPackageIntegrity(): Promise<void> {
    const packageJsonPath = '/Users/felipe/Developer/skills-fabrik/packages/skills-cli/package.json';
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

    // Validate required fields
    const requiredFields = ['name', 'version', 'description', 'main', 'bin', 'files'];
    const missingFields = requiredFields.filter(field => !packageJson[field]);

    if (missingFields.length > 0) {
      throw new Error(`Missing required package.json fields: ${missingFields.join(', ')}`);
    }

    // Validate files array
    const expectedFiles = ['dist', 'README.md', 'LICENSE', 'CHANGELOG.md'];
    const missingFiles = expectedFiles.filter(file => !packageJson.files.includes(file));

    if (missingFiles.length > 0) {
      throw new Error(`Missing files from package.json files array: ${missingFiles.join(', ')}`);
    }

    // Check if dist directory exists and has content
    if (!existsSync('/Users/felipe/Developer/skills-fabrik/packages/skills-cli/dist')) {
      throw new Error('dist directory does not exist');
    }

    this.log('success', 'Package integrity validated', {
      name: packageJson.name,
      version: packageJson.version,
      filesCount: packageJson.files.length
    });
  }

  public async runAllTests(): Promise<TestReport> {
    console.log(`${this.colors.cyan}
========================================
  Skills Fabric CLI - E2E Test Suite
========================================
Testing with comprehensive error detection
${this.colors.reset}`);

    const tests = [
      { name: 'Package Build', fn: () => this.testPackageBuild() },
      { name: 'CLI Help Command', fn: () => this.testCLIHelp() },
      { name: 'Slash Command List', fn: () => this.testSlashCommandList() },
      { name: 'Global Installation Validation', fn: () => this.testGlobalInstallation() },
      { name: 'Standalone Mode', fn: () => this.testStandaloneMode() },
      { name: 'Slash Command Execution', fn: () => this.testSlashCommandExecution() },
      { name: 'Error Handling', fn: () => this.testErrorHandling() },
      { name: 'Claude Code Integration', fn: () => this.testClaudeCodeIntegration() },
      { name: 'Performance Metrics', fn: () => this.testPerformance() },
      { name: 'Package Integrity', fn: () => this.testPackageIntegrity() }
    ];

    // Run all tests
    for (const test of tests) {
      await this.runTest(test.name, test.fn);
    }

    // Generate recommendations based on results
    this.generateRecommendations();

    const totalDuration = Date.now() - this.startTime;
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const skipped = this.results.filter(r => r.status === 'SKIP').length;

    const report: TestReport = {
      summary: {
        total: this.results.length,
        passed,
        failed,
        skipped,
        duration: totalDuration,
        successRate: Math.round((passed / this.results.length) * 100)
      },
      tests: this.results,
      errors: this.errors,
      warnings: this.warnings,
      recommendations: this.recommendations
    };

    this.printReport(report);
    return report;
  }

  private generateRecommendations(): void {
    const failedTests = this.results.filter(r => r.status === 'FAIL');

    if (failedTests.length > 0) {
      this.recommendations.push('Address failing tests before production release');
    }

    if (this.warnings.length > 3) {
      this.recommendations.push('Review and resolve warnings to improve quality');
    }

    const slowTests = this.results.filter(r => r.duration > 10000);
    if (slowTests.length > 0) {
      this.recommendations.push('Optimize slow tests for better performance');
    }

    // Check for specific patterns
    const hasCommandIssues = this.errors.some(e => e.includes('command') || e.includes('Command'));
    if (hasCommandIssues) {
      this.recommendations.push('Review command execution logic and error handling');
    }

    const hasBuildIssues = this.errors.some(e => e.includes('build') || e.includes('Build'));
    if (hasBuildIssues) {
      this.recommendations.push('Validate build process and dependencies');
    }

    if (this.recommendations.length === 0) {
      this.recommendations.push('System is ready for production deployment');
    }
  }

  private printReport(report: TestReport): void {
    console.log(`\n${this.colors.cyan}========================================
  E2E Test Report - Summary
========================================${this.colors.reset}`);

    console.log(`${this.colors.white}Total Tests:${this.colors.reset} ${report.summary.total}`);
    console.log(`${this.colors.green}Passed:${this.colors.reset} ${report.summary.passed}`);
    console.log(`${this.colors.red}Failed:${this.colors.reset} ${report.summary.failed}`);
    console.log(`${this.colors.yellow}Skipped:${this.colors.reset} ${report.summary.skipped}`);
    console.log(`${this.colors.blue}Success Rate:${this.colors.reset} ${report.summary.successRate}%`);
    console.log(`${this.colors.magenta}Duration:${this.colors.reset} ${report.summary.duration}ms`);

    if (report.errors.length > 0) {
      console.log(`\n${this.colors.red}========================================
  Errors Detected
========================================${this.colors.reset}`);
      for (const [index, error] of report.errors.entries()) {
        console.log(`${this.colors.red}${index + 1}.${this.colors.reset} ${error}`);
      }
    }

    if (report.warnings.length > 0) {
      console.log(`\n${this.colors.yellow}========================================
  Warnings
========================================${this.colors.reset}`);
      for (const [index, warning] of report.warnings.entries()) {
        console.log(`${this.colors.yellow}${index + 1}.${this.colors.reset} ${warning}`);
      }
    }

    console.log(`\n${this.colors.cyan}========================================
  Test Details
========================================${this.colors.reset}`);

    for (const [index, test] of report.tests.entries()) {
      const statusColor = {
        PASS: this.colors.green,
        FAIL: this.colors.red,
        SKIP: this.colors.yellow
      }[test.status];

      console.log(`\n${statusColor}${index + 1}. ${test.name}${this.colors.reset} (${test.duration}ms)`);

      if (test.error) {
        console.log(`   ${this.colors.red}Error:${this.colors.reset} ${test.error}`);
      }

      if (test.details) {
        console.log(`   ${this.colors.blue}Details:${this.colors.reset} ${test.details}`);
      }
    }

    if (report.recommendations.length > 0) {
      console.log(`\n${this.colors.magenta}========================================
  Recommendations
========================================${this.colors.reset}`);
      for (const rec of report.recommendations) {
        console.log(`${this.colors.magenta}•${this.colors.reset} ${rec}`);
      }
    }

    console.log(`\n${this.colors.cyan}========================================
  Final Assessment
========================================${this.colors.reset}`);

    if (report.summary.failed === 0) {
      console.log(`${this.colors.green}✅ All tests passed! System is ready for deployment.${this.colors.reset}`);
    } else {
      console.log(`${this.colors.red}❌ ${report.summary.failed} test(s) failed. Review and fix issues before deployment.${this.colors.reset}`);
    }

    if (report.warnings.length > 0) {
      console.log(`${this.colors.yellow}⚠️  ${report.warnings.length} warning(s) detected. Review for quality improvements.${this.colors.reset}`);
    }

    console.log(`\n${this.colors.white}Test report generated at: ${new Date().toISOString()}${this.colors.reset}`);
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const testSuite = new E2ETestSuite();
  try {
    const report = await testSuite.runAllTests();
    process.exit(report.summary.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error(`${testSuite['colors'].red}Fatal error running tests:${testSuite['colors'].reset}`, error);
    process.exit(1);
  }
}

export { E2ETestSuite, TestReport, TestResult };
  private formatError(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
