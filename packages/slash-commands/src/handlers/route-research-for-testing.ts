/**
 * Route Research for Testing Handler
 *
 * Advanced handler for automated testing research and route validation
 * Integrates with testing frameworks and provides intelligent testing suggestions
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, statSync, readdirSync } from 'fs';
import { join, resolve, extname } from 'path';
import {
  SlashCommandContext,
  ParsedSlashCommand,
  SlashCommandResult,
  RouteResearchResult,
  ToolResult
} from '../types.js';
import { SlashCommandHandler } from './base.js';

export class RouteResearchForTestingHandler extends SlashCommandHandler {
  constructor(command: any, contextManager?: any) {
    super(command, contextManager);
  }

  /**
   * Validate route-research-for-testing command arguments and environment
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

    // Validate route argument
    const route = this.getArgument(parsedCommand, 0);
    if (!route) {
      return {
        valid: false,
        message: 'Route argument is required. Usage: /route-research-for-testing <route> [options]'
      };
    }

    // Validate depth flag
    const depthFlag = this.getFlag(parsedCommand, 'depth', 3);
    if (typeof depthFlag !== 'number' || depthFlag < 1 || depthFlag > 10) {
      return {
        valid: false,
        message: 'Flag --depth must be a number between 1 and 10'
      };
    }

    return { valid: true };
  }

  /**
   * Handle the route-research-for-testing command execution
   */
  protected async handle(
    parsedCommand: ParsedSlashCommand,
    context: SlashCommandContext
  ): Promise<Omit<SlashCommandResult, 'context' | 'metadata'>> {
    const startTime = Date.now();
    const workspaceRoot = context.workspace.root;

    // Get command options
    const route = this.requireArgument(parsedCommand, 0, 'route');
    const depth = this.getFlag(parsedCommand, 'depth', 3);
    const verbose = this.getFlag(parsedCommand, 'verbose', false);
    const generateTests = this.getFlag(parsedCommand, 'generate-tests', false);
    const analyzeCoverage = this.getFlag(parsedCommand, 'coverage', false);

    try {
      if (verbose) {
        console.log('🔍 Starting route research for testing...');
        console.log(`   Route: ${route}`);
        console.log(`   Analysis depth: ${depth}`);
        console.log(`   Generate tests: ${generateTests ? 'ON' : 'OFF'}`);
        console.log(`   Analyze coverage: ${analyzeCoverage ? 'ON' : 'OFF'}`);
      }

      const results: RouteResearchResult = {
        route,
        routeAnalysis: { success: false, exitCode: -1, output: '', errors: [], warnings: [], duration: 0 },
        dependencies: { success: false, exitCode: -1, output: '', errors: [], warnings: [], duration: 0 },
        testSuggestions: [],
        coverageGap: [],
        testFiles: [],
        complexity: 0,
        blocked: false
      };

      // Step 1: Route Analysis
      if (verbose) console.log('\n📡 Analyzing route...');
      results.routeAnalysis = await this.analyzeRoute(workspaceRoot, route, depth, verbose);

      // Step 2: Dependency Analysis
      if (verbose) console.log('\n🔗 Analyzing dependencies...');
      results.dependencies = await this.analyzeDependencies(workspaceRoot, route, verbose);

      // Step 3: Test File Discovery
      if (verbose) console.log('\n📄 Discovering test files...');
      results.testFiles = await this.discoverTestFiles(workspaceRoot, route, verbose);

      // Step 4: Generate Test Suggestions
      if (verbose) console.log('\n💡 Generating test suggestions...');
      results.testSuggestions = await this.generateTestSuggestions(workspaceRoot, route, results, verbose);

      // Step 5: Coverage Analysis
      if (analyzeCoverage) {
        if (verbose) console.log('\n📊 Analyzing test coverage...');
        results.coverageGap = await this.analyzeCoverageGap(workspaceRoot, route, results.testFiles, verbose);
      }

      // Step 6: Complexity Analysis
      results.complexity = this.calculateComplexity(results);

      // Determine if blocked
      results.blocked = results.routeAnalysis.errors.length > 0 ||
                       results.dependencies.errors.length > 0;

      // Generate test files if requested
      if (generateTests && !results.blocked) {
        if (verbose) console.log('\n📝 Generating test files...');
        await this.generateTestFiles(workspaceRoot, route, results.testSuggestions, verbose);
      }

      // Persist results to MemTech L1
      await this.persistResults(context.sessionId, results);

      const executionTime = Date.now() - startTime;
      const output = this.formatRouteResearchOutput(results, verbose);

      // Add next actions based on results
      const nextActions = this.generateNextActions(results);

      return {
        success: !results.blocked,
        output,
        data: results,
        nextActions
      };

    } catch (error) {
      console.error('❌ Route research failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return this.createErrorResult(
        this.createError('execution', `Route research failed: ${errorMessage}`)
      );
    }
  }

  /**
   * Analyze the specified route
   */
  private async analyzeRoute(
    root: string,
    route: string,
    depth: number,
    verbose: boolean
  ): Promise<ToolResult> {
    const startTime = Date.now();

    try {
      // Try to find route definition files
      const routeFiles = this.findRouteFiles(root, route, verbose);

      let output = `Route analysis for: ${route}\n`;
      const errors: string[] = [];
      const warnings: string[] = [];

      if (routeFiles.length === 0) {
        errors.push(`No route definition found for: ${route}`);
      } else {
        output += `Found ${routeFiles.length} route file(s):\n`;
        routeFiles.forEach(file => {
          output += `  - ${file}\n`;
          if (verbose) {
            const content = readFileSync(file, 'utf-8');
            output += `    Size: ${content.length} characters\n`;
            output += `    Lines: ${content.split('\n').length}\n`;
          }
        });
      }

      // Analyze route structure
      const routeStructure = this.analyzeRouteStructure(routeFiles, verbose);
      output += `\nRoute Structure:\n${routeStructure}`;

      const duration = Date.now() - startTime;

      return {
        success: routeFiles.length > 0,
        exitCode: routeFiles.length > 0 ? 0 : 1,
        output,
        errors,
        warnings,
        duration
      };

    } catch (error: any) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      return {
        success: false,
        exitCode: 1,
        output: `Route analysis failed: ${errorMessage}`,
        errors: [errorMessage],
        warnings: [],
        duration
      };
    }
  }

  /**
   * Analyze route dependencies
   */
  private async analyzeDependencies(
    root: string,
    route: string,
    verbose: boolean
  ): Promise<ToolResult> {
    const startTime = Date.now();

    try {
      const routeFiles = this.findRouteFiles(root, route, verbose);
      const dependencies = new Set<string>();
      const errors: string[] = [];
      const warnings: string[] = [];

      for (const file of routeFiles) {
        try {
          const content = readFileSync(file, 'utf-8').toString();
          const fileDeps = this.extractDependencies(content, verbose);
          fileDeps.forEach(dep => dependencies.add(dep));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          errors.push(`Failed to analyze ${file}: ${errorMessage}`);
        }
      }

      let output = `Dependency analysis for route: ${route}\n`;
      output += `Found ${dependencies.size} dependencies:\n`;

      Array.from(dependencies).sort().forEach(dep => {
        output += `  - ${dep}\n`;
      });

      // Check for missing dependencies
      const missingDeps = this.checkMissingDependencies(root, Array.from(dependencies));
      if (missingDeps.length > 0) {
        warnings.push(`Missing dependencies: ${missingDeps.join(', ')}`);
      }

      const duration = Date.now() - startTime;

      return {
        success: errors.length === 0,
        exitCode: errors.length === 0 ? 0 : 1,
        output,
        errors,
        warnings,
        duration
      };

    } catch (error: any) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      return {
        success: false,
        exitCode: 1,
        output: `Dependency analysis failed: ${errorMessage}`,
        errors: [errorMessage],
        warnings: [],
        duration
      };
    }
  }

  /**
   * Discover existing test files
   */
  private async discoverTestFiles(
    root: string,
    route: string,
    verbose: boolean
  ): Promise<string[]> {
    const testFiles: string[] = [];

    try {
      const testDirectories = [
        'test',
        'tests',
        '__tests__',
        'spec',
        'specs'
      ];

      // Search for test files
      for (const testDir of testDirectories) {
        const testDirPath = join(root, testDir);
        if (existsSync(testDirPath)) {
          const files = this.findTestFilesRecursive(testDirPath, route, verbose);
          testFiles.push(...files);
        }
      }

      if (verbose) {
        console.log(`   Found ${testFiles.length} test file(s) for route: ${route}`);
        testFiles.forEach(file => {
          console.log(`     - ${file}`);
        });
      }

    } catch (error) {
      if (verbose) {
        console.log(`   Warning: Failed to discover test files: ${error}`);
      }
    }

    return testFiles;
  }

  /**
   * Generate test suggestions
   */
  private async generateTestSuggestions(
    root: string,
    route: string,
    results: RouteResearchResult,
    verbose: boolean
  ): Promise<string[]> {
    const suggestions: string[] = [];

    try {
      // Basic test case suggestions
      suggestions.push(`Test route ${route} for successful response`);
      suggestions.push(`Test route ${route} with invalid parameters`);
      suggestions.push(`Test route ${route} authentication/authorization`);
      suggestions.push(`Test route ${route} error handling`);

      // Based on dependencies
      if (results.dependencies.success) {
        suggestions.push('Mock external dependencies for isolated testing');
        suggestions.push('Test dependency failure scenarios');
      }

      // Based on complexity
      if (results.complexity > 5) {
        suggestions.push('Create comprehensive test suite for complex route logic');
        suggestions.push('Consider integration tests in addition to unit tests');
      }

      // Based on existing test coverage
      if (results.testFiles.length === 0) {
        suggestions.push('Create unit tests for route handler');
        suggestions.push('Create integration tests for end-to-end flow');
        suggestions.push('Add performance/load testing for critical routes');
      } else {
        suggestions.push('Enhance existing test coverage');
        suggestions.push('Add edge case testing');
      }

      // Based on route type
      if (route.includes('create') || route.includes('POST')) {
        suggestions.push('Test data validation and sanitization');
        suggestions.push('Test duplicate data handling');
      }

      if (route.includes('update') || route.includes('PUT')) {
        suggestions.push('Test partial updates');
        suggestions.push('Test concurrent updates');
      }

      if (route.includes('delete') || route.includes('DELETE')) {
        suggestions.push('Test soft delete vs hard delete');
        suggestions.push('Test cascade delete behavior');
      }

      if (verbose) {
        console.log(`   Generated ${suggestions.length} test suggestions`);
      }

    } catch (error) {
      if (verbose) {
        console.log(`   Warning: Failed to generate test suggestions: ${error}`);
      }
    }

    return suggestions;
  }

  /**
   * Analyze test coverage gap
   */
  private async analyzeCoverageGap(
    root: string,
    route: string,
    testFiles: string[],
    verbose: boolean
  ): Promise<string[]> {
    const gaps: string[] = [];

    try {
      // Check for common test coverage gaps
      if (testFiles.length === 0) {
        gaps.push('No test files found for route');
        gaps.push('Missing unit tests');
        gaps.push('Missing integration tests');
        return gaps;
      }

      // Analyze existing test coverage
      let hasHappyPath = false;
      let hasErrorTests = false;
      let hasAuthTests = false;
      let hasValidationTests = false;

      for (const testFile of testFiles) {
        try {
          const content = readFileSync(testFile, 'utf-8').toString().toLowerCase();

          if (content.includes('200') || content.includes('success')) {
            hasHappyPath = true;
          }

          if (content.includes('400') || content.includes('500') || content.includes('error')) {
            hasErrorTests = true;
          }

          if (content.includes('auth') || content.includes('token') || content.includes('permission')) {
            hasAuthTests = true;
          }

          if (content.includes('valid') || content.includes('schema') || content.includes('joi')) {
            hasValidationTests = true;
          }
        } catch (error) {
          // Skip files that can't be read
        }
      }

      // Identify gaps
      if (!hasHappyPath) gaps.push('Missing happy path tests');
      if (!hasErrorTests) gaps.push('Missing error handling tests');
      if (!hasAuthTests) gaps.push('Missing authentication/authorization tests');
      if (!hasValidationTests) gaps.push('Missing input validation tests');

      // Additional gap analysis
      gaps.push(...this.analyzeSpecificGaps(root, route, testFiles, verbose));

    } catch (error) {
      gaps.push(`Failed to analyze coverage gap: ${error}`);
    }

    return gaps;
  }

  /**
   * Calculate route complexity
   */
  private calculateComplexity(results: RouteResearchResult): number {
    let complexity = 0;

    // Base complexity from route analysis
    if (results.routeAnalysis.success) {
      complexity += 2;
    }

    // Dependency complexity
    if (results.dependencies.success) {
      const depCount = results.dependencies.output.split('\n').filter(line => line.includes('  - ')).length;
      complexity += Math.min(depCount, 5);
    }

    // Test coverage complexity
    if (results.testFiles.length > 0) {
      complexity += Math.min(results.testFiles.length, 3);
    }

    // Suggestions complexity (more suggestions = more complex)
    complexity += Math.min(results.testSuggestions.length / 2, 3);

    return Math.round(complexity);
  }

  /**
   * Generate test files
   */
  private async generateTestFiles(
    root: string,
    route: string,
    suggestions: string[],
    verbose: boolean
  ): Promise<void> {
    try {
      const testDir = join(root, 'test');
      if (!existsSync(testDir)) {
        // Create test directory
        execSync(`mkdir -p "${testDir}"`, { cwd: root });
      }

      const testName = route.replace(/[^a-zA-Z0-9]/g, '-');
      const testFile = join(testDir, `${testName}.test.js`);

      const testContent = this.generateTestFileContent(route, suggestions);

      // Write test file
      execSync(`cat > "${testFile}" << 'EOF'\n${testContent}\nEOF`, { cwd: root });

      if (verbose) {
        console.log(`   Generated test file: ${testFile}`);
      }

    } catch (error) {
      if (verbose) {
        console.log(`   Warning: Failed to generate test files: ${error}`);
      }
    }
  }

  /**
   * Helper methods
   */
  private findRouteFiles(root: string, route: string, verbose: boolean): string[] {
    const routeFiles: string[] = [];
    const extensions = ['.js', '.ts', '.jsx', '.tsx'];

    // Common route directories
    const routeDirs = [
      'routes',
      'src/routes',
      'app/routes',
      'server/routes',
      'api/routes',
      'controllers',
      'src/controllers',
      'pages/api',
      'src/pages/api'
    ];

    for (const routeDir of routeDirs) {
      const routeDirPath = join(root, routeDir);
      if (existsSync(routeDirPath)) {
        try {
          const files = readdirSync(routeDirPath, { recursive: true });
          for (const file of files) {
            const filePath = join(routeDirPath, file.toString());
            if (statSync(filePath).isFile() &&
                extensions.includes(extname(filePath)) &&
                file.toString().toLowerCase().includes(route.toLowerCase())) {
              routeFiles.push(filePath);
            }
          }
        } catch (error) {
          // Skip directories that can't be read
        }
      }
    }

    return routeFiles;
  }

  private analyzeRouteStructure(routeFiles: string[], verbose: boolean): string {
    if (routeFiles.length === 0) {
      return '  No route files found\n';
    }

    let structure = '';
    for (const file of routeFiles) {
      try {
        const content = readFileSync(file, 'utf-8').toString();
        const lines = content.split('\n');

        structure += `  ${file}:\n`;
        structure += `    Functions: ${this.extractFunctionNames(content).join(', ')}\n`;
        structure += `    Exports: ${this.extractExports(content).join(', ')}\n`;
        structure += `    Lines: ${lines.length}\n\n`;
      } catch (error) {
        structure += `  ${file}: Failed to analyze\n`;
      }
    }

    return structure;
  }

  private extractDependencies(content: string, verbose: boolean): string[] {
    const dependencies: string[] = [];

    // Extract require/import statements
    const importRegex = /(?:require\(|import\s+.*?\s+from\s+)(['"])([^'"]+)\1/g;
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      const dep = match[2];
      if (!dep.startsWith('.') && !dep.startsWith('/')) {
        dependencies.push(dep);
      }
    }

    return dependencies;
  }

  private checkMissingDependencies(root: string, dependencies: string[]): string[] {
    const missing: string[] = [];

    try {
      const packageJsonPath = join(root, 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

      const allDeps = new Set([
        ...Object.keys(packageJson.dependencies || {}),
        ...Object.keys(packageJson.devDependencies || {})
      ]);

      dependencies.forEach(dep => {
        const depName = dep.split('/')[0]; // Get main package name
        if (!allDeps.has(depName)) {
          missing.push(dep);
        }
      });
    } catch (error) {
      // Can't check dependencies
    }

    return missing;
  }

  private findTestFilesRecursive(dir: string, route: string, verbose: boolean): string[] {
    const testFiles: string[] = [];
    const extensions = ['.test.js', '.test.ts', '.spec.js', '.spec.ts'];

    try {
      const files = readdirSync(dir, { recursive: true });
      for (const file of files) {
        const fileName = file.toString();
        const filePath = join(dir, fileName);
        if (statSync(filePath).isFile() &&
            extensions.some(ext => fileName.endsWith(ext)) &&
            fileName.toLowerCase().includes(route.toLowerCase())) {
          testFiles.push(filePath);
        }
      }
    } catch (error) {
      // Skip directories that can't be read
    }

    return testFiles;
  }

  private extractFunctionNames(content: string): string[] {
    const functions: string[] = [];
    const functionRegex = /(?:function\s+(\w+)|(\w+)\s*=\s*(?:function|\([^)]*\)\s*=>))/g;
    let match;

    while ((match = functionRegex.exec(content)) !== null) {
      functions.push(match[1] || match[2]);
    }

    return functions;
  }

  private extractExports(content: string): string[] {
    const exports: string[] = [];
    const exportRegex = /(?:module\.exports|exports)\.(\w+)|export\s+(?:const|function|class)\s+(\w+)/g;
    let match;

    while ((match = exportRegex.exec(content)) !== null) {
      exports.push(match[1] || match[2]);
    }

    return exports;
  }

  private analyzeSpecificGaps(root: string, route: string, testFiles: string[], verbose: boolean): string[] {
    const gaps: string[] = [];

    // Add specific gap analysis based on project structure
    // This is a placeholder for more sophisticated analysis

    return gaps;
  }

  private generateTestFileContent(route: string, suggestions: string[]): string {
    const testName = route.replace(/[^a-zA-Z0-9]/g, '-');

    return `/**
 * Generated tests for route: ${route}
 * Generated on: ${new Date().toISOString()}
 */

const request = require('supertest');
const app = require('../app'); // Adjust path as needed

describe('${route} Route Tests', () => {
  describe('GET /${route}', () => {
    it('should return success response', async () => {
      const response = await request(app)
        .get('/${route}')
        .expect(200);

      expect(response.body).toBeDefined();
      // Add more specific assertions based on your route
    });

    it('should handle errors gracefully', async () => {
      // Test error scenarios
    });
  });

  describe('POST /${route}', () => {
    it('should create new resource', async () => {
      const testData = {
        // Add test data based on your route schema
      };

      const response = await request(app)
        .post('/${route}')
        .send(testData)
        .expect(201);

      expect(response.body).toBeDefined();
      // Add specific assertions
    });

    it('should validate input data', async () => {
      const invalidData = {
        // Add invalid test data
      };

      await request(app)
        .post('/${route}')
        .send(invalidData)
        .expect(400);
    });
  });

  // Add more test cases based on suggestions
  ${suggestions.map(suggestion => `// TODO: ${suggestion}`).join('\n  ')}
});
`;
  }

  private generateNextActions(results: RouteResearchResult): string[] {
    const actions: string[] = [];

    if (results.blocked) {
      actions.push('/build-and-fix --fix');
      actions.push('/code-review --strict');
    } else {
      if (results.testFiles.length === 0) {
        actions.push('/route-research-for-testing ' + results.route + ' --generate-tests');
      }

      if (results.coverageGap.length > 0) {
        actions.push('/test-route ' + results.route + ' --coverage');
      }

      actions.push('/compact');
      actions.push('/test --all');
    }

    return actions;
  }

  private formatRouteResearchOutput(results: RouteResearchResult, verbose: boolean): string {
    let output = `## Route Research Results: ${results.route}\n\n`;

    // Summary
    output += `### Summary\n`;
    output += `- Route: ${results.route}\n`;
    output += `- Complexity: ${results.complexity}/10\n`;
    output += `- Test Files Found: ${results.testFiles.length}\n`;
    output += `- Test Suggestions: ${results.testSuggestions.length}\n`;
    output += `- Status: ${results.blocked ? '🚫 Blocked' : '✅ Ready'}\n\n`;

    // Route Analysis
    output += `### Route Analysis ${results.routeAnalysis.success ? '✅' : '❌'}\n`;
    output += `- Duration: ${results.routeAnalysis.duration}ms\n`;
    if (results.routeAnalysis.errors.length > 0) {
      output += `- Errors: ${results.routeAnalysis.errors.length}\n`;
      if (verbose) {
        results.routeAnalysis.errors.forEach(error => {
          output += `  - ${error}\n`;
        });
      }
    }
    output += '\n';

    // Dependencies
    output += `### Dependencies ${results.dependencies.success ? '✅' : '❌'}\n`;
    output += `- Duration: ${results.dependencies.duration}ms\n`;
    if (results.dependencies.warnings.length > 0) {
      output += `- Warnings: ${results.dependencies.warnings.length}\n`;
      if (verbose) {
        results.dependencies.warnings.forEach(warning => {
          output += `  - ${warning}\n`;
        });
      }
    }
    output += '\n';

    // Test Suggestions
    if (results.testSuggestions.length > 0) {
      output += `### Test Suggestions 💡\n`;
      results.testSuggestions.forEach(suggestion => {
        output += `- ${suggestion}\n`;
      });
      output += '\n';
    }

    // Coverage Gap
    if (results.coverageGap.length > 0) {
      output += `### Coverage Gap Analysis 📊\n`;
      results.coverageGap.forEach(gap => {
        output += `- ${gap}\n`;
      });
      output += '\n';
    }

    return output;
  }

  /**
   * Persist results to MemTech L1
   */
  private async persistResults(sessionId: string, results: RouteResearchResult): Promise<void> {
    try {
      await this.contextManager.updateContext(sessionId, {
        state: {
          routeResearchResults: results,
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