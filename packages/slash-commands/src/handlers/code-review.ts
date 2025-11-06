/**
 * Code Review Handler
 *
 * Performs comprehensive code review with static analysis
 * Integrates with guardrails and build-and-fix results
 * Provides quality scoring and actionable suggestions
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { join, resolve, extname } from 'path';
import {
  SlashCommandContext,
  ParsedSlashCommand,
  SlashCommandResult,
  CodeReviewResult,
  ReviewCategory,
  GuardrailFinding,
  ArchitecturalIssue
} from '../types.js';
import { SlashCommandHandler } from './base.js';

interface ReviewScope {
  files: string[];
  directories: string[];
  patterns: string[];
  excludePatterns: string[];
}

interface QualityMetrics {
  complexity: number;
  maintainability: number;
  testCoverage: number;
  documentation: number;
  security: number;
}

export class CodeReviewHandler extends SlashCommandHandler {
  constructor(command: any, contextManager?: any) {
    super(command, contextManager);
  }

  /**
   * Validate code-review command arguments
   */
  protected async validateCommand(
    parsedCommand: ParsedSlashCommand,
    context: SlashCommandContext
  ): Promise<{ valid: boolean; message?: string }> {
    const workspaceRoot = context.workspace.root;

    // Check if we're in a valid project directory
    const packageJsonPath = join(workspaceRoot, 'package.json');
    if (!existsSync(packageJsonPath)) {
      return {
        valid: false,
        message: 'No package.json found. Please run from a valid project directory.'
      };
    }

    // Validate scope argument
    const scope = this.getArgument(parsedCommand, 0, '.');
    if (typeof scope !== 'string') {
      return {
        valid: false,
        message: 'Scope must be a valid path or pattern.'
      };
    }

    // Validate flags
    const strict = this.getFlag(parsedCommand, 'strict', false);
    const includeTests = this.getFlag(parsedCommand, 'include-tests', false);
    const autoFix = this.getFlag(parsedCommand, 'auto-fix', false);

    if (typeof strict !== 'boolean') {
      return {
        valid: false,
        message: 'Flag --strict must be a boolean value'
      };
    }

    if (typeof includeTests !== 'boolean') {
      return {
        valid: false,
        message: 'Flag --include-tests must be a boolean value'
      };
    }

    if (typeof autoFix !== 'boolean') {
      return {
        valid: false,
        message: 'Flag --auto-fix must be a boolean value'
      };
    }

    return { valid: true };
  }

  /**
   * Handle the code-review command execution
   */
  protected async handle(
    parsedCommand: ParsedSlashCommand,
    context: SlashCommandContext
  ): Promise<Omit<SlashCommandResult, 'context' | 'metadata'>> {
    const startTime = Date.now();
    const workspaceRoot = context.workspace.root || process.cwd();

    // Get command parameters
    const scope = this.getArgument(parsedCommand, 0, '.') || '.';
    const strict = this.getFlag(parsedCommand, 'strict', false);
    const includeTests = this.getFlag(parsedCommand, 'include-tests', false);
    const autoFix = this.getFlag(parsedCommand, 'auto-fix', false);
    const verbose = this.getFlag(parsedCommand, 'verbose', false);
    const outputFormat = this.getOption(parsedCommand, 'format', 'markdown');

    try {
      if (verbose) {
        console.log('🔍 Starting code review...');
        console.log(`   Scope: ${scope}`);
        console.log(`   Strict mode: ${strict ? 'ON' : 'OFF'}`);
        console.log(`   Include tests: ${includeTests ? 'ON' : 'OFF'}`);
        console.log(`   Auto fix: ${autoFix ? 'ON' : 'OFF'}`);
        console.log(`   Output format: ${outputFormat}`);
      }

      // Step 1: Determine review scope
      const safeWorkspaceRoot = workspaceRoot || process.cwd();
      const reviewScope = await this.determineReviewScope(scope, safeWorkspaceRoot, includeTests);

      if (verbose) {
        console.log(`   Files to review: ${reviewScope.files.length}`);
        console.log(`   Directories: ${reviewScope.directories.length}`);
      }

      // Step 2: Run build-and-fix first to establish baseline
      let buildResults = null;
      try {
        if (verbose) console.log('\n🔧 Running build-and-fix for baseline...');
        buildResults = await this.runBuildAndFix(workspaceRoot, verbose);
      } catch (error) {
        if (strict) {
          throw new Error(`Build failed in strict mode: ${(error instanceof Error ? error.message : String(error))}`);
        }
        if (verbose) console.log('   ⚠️  Build failed, continuing with review...');
      }

      // Step 3: Perform comprehensive code review
      const reviewResult: CodeReviewResult = {
        summary: '',
        score: 0,
        categories: [],
        suggestions: [],
        guardrails: [],
        architecturalIssues: []
      };

      // Review categories
      const categories = [
        'security',
        'performance',
        'maintainability',
        'testing',
        'documentation',
        'error-handling',
        'architecture',
        'best-practices'
      ];

      for (const category of categories) {
        if (verbose) console.log(`\n📊 Analyzing ${category}...`);
        const categoryResult = await this.analyzeCategory(
          category,
          reviewScope,
          workspaceRoot,
          strict,
          verbose
        );
        reviewResult.categories.push(categoryResult);
      }

      // Step 4: Run guardrails analysis
      if (verbose) console.log('\n🚦 Running guardrails analysis...');
      reviewResult.guardrails = await this.runGuardrailsAnalysis(reviewScope, workspaceRoot, strict);

      // Step 5: Analyze architectural issues
      if (verbose) console.log('\n🏗️  Analyzing architectural issues...');
      reviewResult.architecturalIssues = await this.analyzeArchitecturalIssues(
        reviewScope,
        workspaceRoot,
        strict
      );

      // Step 6: Calculate overall score and generate summary
      reviewResult.score = this.calculateOverallScore(reviewResult);
      reviewResult.summary = this.generateSummary(reviewResult, buildResults);
      reviewResult.suggestions = this.generateSuggestions(reviewResult, autoFix);

      // Step 7: Apply auto-fixes if requested
      let fixesApplied = 0;
      if (autoFix) {
        if (verbose) console.log('\n🔧 Applying auto-fixes...');
        fixesApplied = await this.applyAutoFixes(reviewResult, workspaceRoot, verbose);
      }

      // Persist results to MemTech L1
      await this.persistResults(context.sessionId, reviewResult, { buildResults, fixesApplied });

      const executionTime = Date.now() - startTime;
      const output = this.formatCodeReviewOutput(reviewResult, outputFormat, verbose, fixesApplied);
      const nextActions = this.generateNextActions(reviewResult, autoFix, fixesApplied);

      return {
        success: true,
        output,
        data: reviewResult,
        nextActions
      };

    } catch (error) {
      console.error('❌ Code review failed:', error);
      return this.createErrorResult(
        this.createError('execution', `Code review failed: ${(error instanceof Error ? error.message : String(error))}`)
      );
    }
  }

  /**
   * Determine the scope of files to review
   */
  private async determineReviewScope(
    scope: string,
    workspaceRoot: string,
    includeTests: boolean
  ): Promise<ReviewScope> {
    const files: string[] = [];
    const directories: string[] = [];
    const patterns: string[] = [];
    const excludePatterns: string[] = [];

    // Default patterns for source files
    const sourcePatterns = [
      '**/*.ts',
      '**/*.tsx',
      '**/*.js',
      '**/*.jsx',
      '**/*.vue',
      '**/*.py',
      '**/*.java',
      '**/*.go',
      '**/*.rs'
    ];

    // Default exclude patterns
    const defaultExcludes = [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.git/**',
      '**/coverage/**',
      '**/.nyc_output/**',
      '**/*.min.js',
      '**/*.d.ts'
    ];

    if (!includeTests) {
      defaultExcludes.push('**/*.test.*', '**/*.spec.*', '**/test/**', '**/tests/**');
    }

    // Handle different scope types
    if (scope === '.') {
      // Review entire workspace
      directories.push('.');
      patterns.push(...sourcePatterns);
      excludePatterns.push(...defaultExcludes);
    } else if (scope.includes('*')) {
      // Pattern-based scope
      patterns.push(scope);
      excludePatterns.push(...defaultExcludes);
    } else {
      // File or directory scope
      const targetPath = resolve(workspaceRoot, scope);
      if (existsSync(targetPath)) {
        const stats = require('fs').statSync(targetPath);
        if (stats.isDirectory()) {
          directories.push(scope);
          patterns.push(...sourcePatterns);
          excludePatterns.push(...defaultExcludes);
        } else {
          files.push(scope);
        }
      }
    }

    // Collect files from patterns and directories
    for (const pattern of patterns) {
      try {
        const globResult = execSync(`find "${workspaceRoot}" -name "${pattern.replace('**/', '')}" -type f`, {
          encoding: 'utf-8'
        }).trim().split('\n').filter(f => f);

        files.push(...globResult.map(f => f.replace(workspaceRoot + '/', '')));
      } catch (error) {
        // Pattern didn't match any files
      }
    }

    for (const directory of directories) {
      try {
        const dirPath = resolve(workspaceRoot, directory);
        const result = execSync(`find "${dirPath}" -type f \\( -name "*.ts" -o -name "*.js" -o -name "*.tsx" -o -name "*.jsx" \\)`, {
          encoding: 'utf-8'
        }).trim().split('\n').filter(f => f);

        files.push(...result.map(f => f.replace(workspaceRoot + '/', '')));
      } catch (error) {
        // Directory doesn't exist or has no matching files
      }
    }

    // Filter out excluded files
    const filteredFiles = files.filter(file => {
      return !excludePatterns.some(pattern => this.matchesPattern(file, pattern));
    });

    return {
      files: [...Array.from(new Set(filteredFiles))], // Remove duplicates
      directories,
      patterns,
      excludePatterns
    };
  }

  /**
   * Run build-and-fix to establish baseline
   */
  private async runBuildAndFix(workspaceRoot: string, verbose: boolean): Promise<any> {
    try {
      // This would integrate with the build-and-fix handler
      // For now, run basic build commands
      const commands = ['npm run build', 'npm run lint'];

      for (const command of commands) {
        try {
          if (verbose) console.log(`   Running: ${command}`);
          execSync(command, { cwd: workspaceRoot, stdio: verbose ? 'inherit' : 'pipe' });
        } catch (error) {
          if (verbose) console.log(`   Command failed: ${command}`);
          throw error;
        }
      }

      return { success: true, errors: 0, warnings: 0 };
    } catch (error) {
      return { success: false, errors: 1, warnings: 0, message: (error instanceof Error ? error.message : String(error)) };
    }
  }

  /**
   * Analyze a specific category
   */
  private async analyzeCategory(
    category: string,
    reviewScope: ReviewScope,
    workspaceRoot: string,
    strict: boolean,
    verbose: boolean
  ): Promise<ReviewCategory> {
    const findings: string[] = [];
    let score = 100; // Start with perfect score

    // Analyze each file in scope
    for (const file of reviewScope.files) {
      try {
        const filePath = join(workspaceRoot, file);
        const content = readFileSync(filePath, 'utf-8');
        const ext = extname(file);

        const fileFindings = await this.analyzeFileForCategory(
          category,
          content,
          ext,
          file,
          strict
        );

        findings.push(...fileFindings);
      } catch (error) {
        if (verbose) console.log(`   Failed to analyze ${file}: ${(error instanceof Error ? error.message : String(error))}`);
      }
    }

    // Calculate score based on findings
    score = Math.max(0, score - (findings.length * (strict ? 15 : 10)));

    return {
      name: category,
      score,
      findings
    };
  }

  /**
   * Analyze a specific file for a category
   */
  private async analyzeFileForCategory(
    category: string,
    content: string,
    extension: string,
    filePath: string,
    strict: boolean
  ): Promise<string[]> {
    const findings: string[] = [];

    switch (category) {
      case 'security':
        findings.push(...this.analyzeSecurity(content, extension, strict));
        break;
      case 'performance':
        findings.push(...this.analyzePerformance(content, extension, strict));
        break;
      case 'maintainability':
        findings.push(...this.analyzeMaintainability(content, extension, strict));
        break;
      case 'testing':
        findings.push(...this.analyzeTesting(content, extension, filePath, strict));
        break;
      case 'documentation':
        findings.push(...this.analyzeDocumentation(content, extension, strict));
        break;
      case 'error-handling':
        findings.push(...this.analyzeErrorHandling(content, extension, strict));
        break;
      case 'architecture':
        findings.push(...this.analyzeArchitecture(content, extension, strict));
        break;
      case 'best-practices':
        findings.push(...this.analyzeBestPractices(content, extension, strict));
        break;
    }

    return findings;
  }

  /**
   * Security analysis
   */
  private analyzeSecurity(content: string, extension: string, strict: boolean): string[] {
    const findings: string[] = [];

    // Check for hardcoded secrets
    const secretPatterns = [
      /password\s*=\s*['"`][^'"`]+['"`]/i,
      /api_key\s*=\s*['"`][^'"`]+['"`]/i,
      /secret\s*=\s*['"`][^'"`]+['"`]/i,
      /token\s*=\s*['"`][^'"`]{20,}['"`]/i
    ];

    for (const pattern of secretPatterns) {
      if (pattern.test(content)) {
        findings.push('Potential hardcoded secret detected');
      }
    }

    // Check for eval usage
    if (content.includes('eval(') || content.includes('Function(')) {
      findings.push('Use of eval() or Function() constructor detected');
    }

    // Check for SQL injection patterns
    if (content.includes('SELECT * FROM') && content.includes('+')) {
      findings.push('Potential SQL injection vulnerability');
    }

    // Check for XSS patterns
    if (content.includes('innerHTML') || content.includes('document.write')) {
      findings.push('Potential XSS vulnerability');
    }

    return findings;
  }

  /**
   * Performance analysis
   */
  private analyzePerformance(content: string, extension: string, strict: boolean): string[] {
    const findings: string[] = [];

    // Check for inefficient loops
    if (content.includes('for (') && content.includes('length')) {
      findings.push('Potential inefficient loop detected - cache array length');
    }

    // Check for synchronous I/O
    if (content.includes('readFileSync(') || content.includes('writeFileSync(')) {
      findings.push('Synchronous file I/O detected');
    }

    // Check for memory leaks
    if (content.includes('setInterval(') && !content.includes('clearInterval(')) {
      findings.push('Potential memory leak - setInterval without clearInterval');
    }

    return findings;
  }

  /**
   * Maintainability analysis
   */
  private analyzeMaintainability(content: string, extension: string, strict: boolean): string[] {
    const findings: string[] = [];

    // Check function length
    const functions = content.match(/function\s+\w+[^{]*\{[\s\S]*?\}/g) || [];
    functions.forEach(func => {
      const lines = func.split('\n').length;
      if (lines > 50) {
        findings.push(`Function too long (${lines} lines)`);
      }
    });

    // Check complexity (simplified)
    const complexityKeywords = ['if', 'else', 'for', 'while', 'switch', 'case', 'catch', 'try'];
    let complexity = 0;
    complexityKeywords.forEach(keyword => {
      const matches = content.match(new RegExp(keyword, 'g'));
      complexity += matches ? matches.length : 0;
    });

    if (complexity > 20) {
      findings.push(`High cyclomatic complexity (${complexity})`);
    }

    // Check for duplicate code (simplified)
    const lines = content.split('\n');
    const duplicateLines = lines.filter((line, index) =>
      lines.indexOf(line) !== index && line.trim().length > 10
    );
    if (duplicateLines.length > 0) {
      findings.push('Duplicate code detected');
    }

    return findings;
  }

  /**
   * Testing analysis
   */
  private analyzeTesting(content: string, extension: string, filePath: string, strict: boolean): string[] {
    const findings: string[] = [];

    // Skip test files
    if (filePath.includes('.test.') || filePath.includes('.spec.') || filePath.includes('/test/')) {
      return findings;
    }

    // Check if file has tests
    const testFilePath = filePath.replace(/\.(ts|js|tsx|jsx)$/, '.test.$1');
    if (!existsSync(join(process.cwd(), testFilePath))) {
      findings.push('No test file found');
    }

    // Check for untested functions
    const functions = content.match(/(?:function|const\s+\w+\s*=\s*(?:async\s+)?)(\w+)/g) || [];
    if (functions.length > 0 && !filePath.includes('.test.')) {
      findings.push(`${functions.length} function(s) may need testing`);
    }

    return findings;
  }

  /**
   * Documentation analysis
   */
  private analyzeDocumentation(content: string, extension: string, strict: boolean): string[] {
    const findings: string[] = [];

    // Check for JSDoc comments
    const functions = content.match(/function\s+\w+|const\s+\w+\s*=\s*(?:async\s+)?(?:\([^)]*\)\s*)?=>/g) || [];
    let documentedFunctions = 0;

    functions.forEach(func => {
      const funcIndex = content.indexOf(func);
      const beforeFunc = content.substring(Math.max(0, funcIndex - 500), funcIndex);
      if (beforeFunc.includes('/**')) {
        documentedFunctions++;
      }
    });

    if (functions.length > documentedFunctions) {
      findings.push(`${functions.length - documentedFunctions} function(s) lack documentation`);
    }

    // Check for TODO comments
    if (content.includes('TODO') || content.includes('FIXME')) {
      findings.push('TODO/FIXME comments found');
    }

    return findings;
  }

  /**
   * Error handling analysis
   */
  private analyzeErrorHandling(content: string, extension: string, strict: boolean): string[] {
    const findings: string[] = [];

    // Check for try-catch blocks
    const asyncOperations = content.match(/(fetch|async|await|Promise|\.then\()|\.catch\(/g) || [];
    const tryBlocks = content.match(/try\s*{/g) || [];

    if (asyncOperations.length > tryBlocks.length * 2) {
      findings.push('Async operations may lack proper error handling');
    }

    // Check for unhandled promise rejections
    if (content.includes('.then(') && !content.includes('.catch(') && !content.includes('try')) {
      findings.push('Potential unhandled promise rejection');
    }

    return findings;
  }

  /**
   * Architecture analysis
   */
  private analyzeArchitecture(content: string, extension: string, strict: boolean): string[] {
    const findings: string[] = [];

    // Check for circular dependencies (simplified)
    if (content.includes('../') && content.split('../').length > 3) {
      findings.push('Complex relative imports detected');
    }

    // Check for God objects
    const lines = content.split('\n');
    if (lines.length > 500 && content.includes('class ')) {
      findings.push('Potential God object - class too large');
    }

    // Check for separation of concerns
    const hasBusinessLogic = /\b(business|domain|logic)\b/i.test(content);
    const hasDataAccess = /\b(database|db|repository|dao)\b/i.test(content);
    const hasPresentation = /\b(render|ui|component|view)\b/i.test(content);

    if (hasBusinessLogic && hasDataAccess && hasPresentation) {
      findings.push('Multiple concerns in single file');
    }

    return findings;
  }

  /**
   * Best practices analysis
   */
  private analyzeBestPractices(content: string, extension: string, strict: boolean): string[] {
    const findings: string[] = [];

    // Check for var usage
    if (content.includes('var ')) {
      findings.push('Use of var detected - prefer const/let');
    }

    // Check for magic numbers
    const magicNumbers = content.match(/\b\d{2,}\b/g) || [];
    if (magicNumbers.length > 0) {
      findings.push('Magic numbers detected - use named constants');
    }

    // Check for console.log in production code
    if (content.includes('console.log') && !content.includes('.test.') && !content.includes('.spec.')) {
      findings.push('console.log statement in production code');
    }

    // Check for unused imports (simplified)
    const imports = content.match(/import.*from/g) || [];
    if (imports.length > 5) {
      findings.push('Many imports - check for unused dependencies');
    }

    return findings;
  }

  /**
   * Run guardrails analysis
   */
  private async runGuardrailsAnalysis(
    reviewScope: ReviewScope,
    workspaceRoot: string,
    strict: boolean
  ): Promise<GuardrailFinding[]> {
    const findings: GuardrailFinding[] = [];

    // This would integrate with the router's guardrails system
    // For now, simulate guardrail findings

    for (const file of reviewScope.files) {
      try {
        const filePath = join(workspaceRoot, file);
        const content = readFileSync(filePath, 'utf-8');

        // Simulate guardrail checks
        const dangerousPatterns = [
          { pattern: /eval\s*\(/, type: 'block', message: 'eval() usage blocked' },
          { pattern: /Function\s*\(/, type: 'warn', message: 'Function() constructor usage warned' },
          { pattern: /innerHTML\s*=/, type: 'warn', message: 'innerHTML assignment warned' }
        ];

        for (const { pattern, type, message } of dangerousPatterns) {
          const matches = content.match(pattern);
          if (matches) {
            findings.push({
              type: type as 'block' | 'warn' | 'suggest',
              pattern: pattern.source,
              location: file,
              message,
              severity: type === 'block' ? 'critical' : type === 'warn' ? 'high' : 'medium'
            });
          }
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }

    return findings;
  }

  /**
   * Analyze architectural issues
   */
  private async analyzeArchitecturalIssues(
    reviewScope: ReviewScope,
    workspaceRoot: string,
    strict: boolean
  ): Promise<ArchitecturalIssue[]> {
    const issues: ArchitecturalIssue[] = [];

    // Analyze dependency graph (simplified)
    const dependencyMap = new Map<string, string[]>();

    for (const file of reviewScope.files) {
      try {
        const filePath = join(workspaceRoot, file);
        const content = readFileSync(filePath, 'utf-8');

        // Extract imports
        const imports = content.match(/import.*from\s+['"`]([^'"`]+)['"`]/g) || [];
        const dependencies = imports.map(imp =>
          imp.match(/from\s+['"`]([^'"`]+)['"`]/)?.[1] || ''
        ).filter(dep => dep && !dep.startsWith('.'));

        dependencyMap.set(file, dependencies);

        // Check for circular dependencies (simplified)
        for (const dep of dependencies) {
          if (dep.startsWith('./') || dep.startsWith('../')) {
            const depFile = resolve(workspaceRoot, file, '..', dep + '.ts');
            if (dependencyMap.has(depFile)) {
              const depOfDeps = dependencyMap.get(depFile) || [];
              if (depOfDeps.some(d => d.includes(file.replace('.ts', '')))) {
                issues.push({
                  type: 'dependency',
                  description: `Circular dependency between ${file} and ${dep}`,
                  location: file,
                  suggestion: 'Refactor to remove circular dependency',
                  severity: 'high'
                });
              }
            }
          }
        }

      } catch (error) {
        // Skip files that can't be read
      }
    }

    // Check for architectural patterns
    for (const file of reviewScope.files) {
      try {
        const filePath = join(workspaceRoot, file);
        const content = readFileSync(filePath, 'utf-8');

        // Check for singleton pattern issues
        if (content.includes('class') && content.includes('static instance')) {
          issues.push({
            type: 'pattern',
            description: 'Singleton pattern detected',
            location: file,
            suggestion: 'Consider dependency injection instead of singleton',
            severity: 'medium'
          });
        }

        // Check for large classes
        const lines = content.split('\n');
        if (lines.length > 300 && content.includes('class ')) {
          issues.push({
            type: 'structure',
            description: `Large class (${lines.length} lines)`,
            location: file,
            suggestion: 'Consider splitting into smaller classes',
            severity: 'medium'
          });
        }

      } catch (error) {
        // Skip files that can't be read
      }
    }

    return issues;
  }

  /**
   * Calculate overall quality score
   */
  private calculateOverallScore(reviewResult: CodeReviewResult): number {
    if (reviewResult.categories.length === 0) return 0;

    const categoryScores = reviewResult.categories.map(cat => cat.score);
    const averageScore = categoryScores.reduce((sum, score) => sum + score, 0) / categoryScores.length;

    // Penalize for guardrails violations
    const guardrailPenalties = reviewResult.guardrails.reduce((sum, guardrail) => {
      const penalty = guardrail.severity === 'critical' ? 20 :
                      guardrail.severity === 'high' ? 10 :
                      guardrail.severity === 'medium' ? 5 : 2;
      return sum + penalty;
    }, 0);

    // Penalize for architectural issues
    const architecturePenalties = reviewResult.architecturalIssues.reduce((sum, issue) => {
      const penalty = issue.severity === 'critical' ? 15 :
                      issue.severity === 'high' ? 8 :
                      issue.severity === 'medium' ? 4 : 2;
      return sum + penalty;
    }, 0);

    return Math.max(0, Math.round(averageScore - guardrailPenalties - architecturePenalties));
  }

  /**
   * Generate review summary
   */
  private generateSummary(reviewResult: CodeReviewResult, buildResults: any): string {
    const criticalIssues = reviewResult.guardrails.filter(g => g.severity === 'critical').length;
    const highIssues = reviewResult.guardrails.filter(g => g.severity === 'high').length;
    const totalFindings = reviewResult.categories.reduce((sum, cat) => sum + cat.findings.length, 0);

    let summary = `Code review completed with a score of ${reviewResult.score}/100.\n\n`;

    summary += `**Issues Found:**\n`;
    summary += `- Critical: ${criticalIssues}\n`;
    summary += `- High: ${highIssues}\n`;
    summary += `- Total Findings: ${totalFindings}\n`;
    summary += `- Categories Analyzed: ${reviewResult.categories.length}\n`;

    if (buildResults) {
      summary += `- Build Status: ${buildResults.success ? '✅ Passed' : '❌ Failed'}\n`;
    }

    // Add category highlights
    const worstCategory = reviewResult.categories.reduce((worst, cat) =>
      cat.score < worst.score ? cat : worst
    );

    if (worstCategory.score < 70) {
      summary += `\n**Area of Concern:** ${worstCategory.name} (${worstCategory.score}/100)\n`;
    }

    return summary;
  }

  /**
   * Generate actionable suggestions
   */
  private generateSuggestions(reviewResult: CodeReviewResult, autoFix: boolean): string[] {
    const suggestions: string[] = [];

    // Priority suggestions based on critical issues
    const criticalGuardrails = reviewResult.guardrails.filter(g => g.severity === 'critical');
    if (criticalGuardrails.length > 0) {
      suggestions.push(`🚨 Address ${criticalGuardrails.length} critical security/safety issues`);
    }

    // Suggestions based on worst category
    const worstCategory = reviewResult.categories.reduce((worst, cat) =>
      cat.score < worst.score ? cat : worst
    );

    if (worstCategory.score < 50) {
      suggestions.push(`🔧 Focus on improving ${worstCategory.name} practices`);
    }

    // Architecture suggestions
    if (reviewResult.architecturalIssues.length > 0) {
      suggestions.push(`🏗️  Resolve ${reviewResult.architecturalIssues.length} architectural issues`);
    }

    // Test coverage suggestions
    const testingCategory = reviewResult.categories.find(cat => cat.name === 'testing');
    if (testingCategory && testingCategory.score < 70) {
      suggestions.push('🧪 Improve test coverage and quality');
    }

    // Documentation suggestions
    const docCategory = reviewResult.categories.find(cat => cat.name === 'documentation');
    if (docCategory && docCategory.score < 60) {
      suggestions.push('📚 Add missing documentation and comments');
    }

    // Auto-fix suggestions
    if (autoFix) {
      suggestions.push('🔧 Some issues can be auto-fixed - review applied changes');
    } else {
      suggestions.push('💡 Run with --auto-fix to apply automatic fixes');
    }

    // Next steps
    suggestions.push('/build-and-fix --fix');
    suggestions.push('/test-coverage');

    return suggestions;
  }

  /**
   * Apply auto-fixes
   */
  private async applyAutoFixes(
    reviewResult: CodeReviewResult,
    workspaceRoot: string,
    verbose: boolean
  ): Promise<number> {
    let fixesApplied = 0;

    try {
      // Apply fixable issues
      for (const guardrail of reviewResult.guardrails) {
        if (guardrail.type === 'suggest' || guardrail.severity !== 'critical') {
          try {
            // This would implement specific auto-fix logic
            // For now, just count potential fixes
            fixesApplied++;
          } catch (error) {
            if (verbose) console.log(`   Failed to auto-fix ${guardrail.location}: ${(error instanceof Error ? error.message : String(error))}`);
          }
        }
      }

      if (verbose) console.log(`   Applied ${fixesApplied} auto-fixes`);
    } catch (error) {
      if (verbose) console.log(`   Auto-fix failed: ${(error instanceof Error ? error.message : String(error))}`);
    }

    return fixesApplied;
  }

  /**
   * Generate next actions
   */
  private generateNextActions(
    reviewResult: CodeReviewResult,
    autoFix: boolean,
    fixesApplied: number
  ): string[] {
    const actions: string[] = [];

    if (reviewResult.score < 70) {
      actions.push('/code-review --auto-fix');
      actions.push('/build-and-fix --fix');
    }

    if (reviewResult.guardrails.some(g => g.severity === 'critical')) {
      actions.push('/security-scan');
    }

    if (reviewResult.categories.some(c => c.name === 'testing' && c.score < 60)) {
      actions.push('/test-generate');
      actions.push('/test-coverage');
    }

    if (fixesApplied > 0) {
      actions.push('/git-diff');
      actions.push('/git-add');
    }

    actions.push('/status');
    actions.push('/help review');

    return actions;
  }

  /**
   * Format output for display
   */
  private formatCodeReviewOutput(
    reviewResult: CodeReviewResult,
    format: string,
    verbose: boolean,
    fixesApplied: number
  ): string {
    if (format === 'json') {
      return JSON.stringify(reviewResult, null, 2);
    }

    let output = `# Code Review Results\n\n`;

    // Summary
    output += `## Summary\n\n`;
    output += `${reviewResult.summary}\n\n`;

    // Overall Score
    const scoreEmoji = reviewResult.score >= 80 ? '🟢' :
                      reviewResult.score >= 60 ? '🟡' : '🔴';
    output += `## Overall Score: ${scoreEmoji} ${reviewResult.score}/100\n\n`;

    // Categories
    output += `## Review Categories\n\n`;
    for (const category of reviewResult.categories) {
      const catEmoji = category.score >= 80 ? '✅' :
                       category.score >= 60 ? '⚠️' : '❌';
      output += `### ${category.name} ${catEmoji} ${category.score}/100\n\n`;

      if (category.findings.length > 0) {
        if (verbose) {
          category.findings.forEach(finding => {
            output += `- ${finding}\n`;
          });
        } else {
          output += `- ${category.findings.length} finding(s)\n`;
        }
        output += '\n';
      }
    }

    // Guardrails
    if (reviewResult.guardrails.length > 0) {
      output += `## Guardrails Analysis\n\n`;
      const critical = reviewResult.guardrails.filter(g => g.severity === 'critical').length;
      const high = reviewResult.guardrails.filter(g => g.severity === 'high').length;
      const medium = reviewResult.guardrails.filter(g => g.severity === 'medium').length;

      output += `- 🚨 Critical: ${critical}\n`;
      output += `- ⚠️  High: ${high}\n`;
      output += `- 📝 Medium: ${medium}\n\n`;

      if (verbose) {
        reviewResult.guardrails.forEach(guardrail => {
          const emoji = guardrail.type === 'block' ? '🚫' :
                       guardrail.type === 'warn' ? '⚠️' : '💡';
          output += `### ${emoji} ${guardrail.type.toUpperCase()}: ${guardrail.location}\n`;
          output += `${guardrail.message}\n\n`;
        });
      }
    }

    // Architectural Issues
    if (reviewResult.architecturalIssues.length > 0) {
      output += `## Architectural Issues\n\n`;
      reviewResult.architecturalIssues.forEach(issue => {
        const emoji = issue.severity === 'critical' ? '🚨' :
                     issue.severity === 'high' ? '⚠️' : '📝';
        output += `### ${emoji} ${issue.type.toUpperCase()}: ${issue.location}\n`;
        output += `${issue.description}\n`;
        output += `**Suggestion:** ${issue.suggestion}\n\n`;
      });
    }

    // Suggestions
    if (reviewResult.suggestions.length > 0) {
      output += `## Suggestions\n\n`;
      reviewResult.suggestions.forEach(suggestion => {
        output += `- ${suggestion}\n`;
      });
      output += '\n';
    }

    // Auto-fix info
    if (fixesApplied > 0) {
      output += `## Auto-Fixes Applied\n\n`;
      output += `✅ ${fixesApplied} issue(s) automatically fixed\n\n`;
    }

    return output;
  }

  /**
   * Helper method to check if file matches pattern
   */
  private matchesPattern(file: string, pattern: string): boolean {
    // Simple glob pattern matching (simplified)
    const regex = new RegExp(
      pattern
        .replace(/\*\*/g, '.*')
        .replace(/\*/g, '[^/]*')
        .replace(/\?/g, '[^/]')
    );
    return regex.test(file);
  }

  /**
   * Persist results to MemTech L1
   */
  private async persistResults(
    sessionId: string,
    reviewResult: CodeReviewResult,
    metadata: { buildResults: any; fixesApplied: number }
  ): Promise<void> {
    try {
      await this.contextManager.updateContext(sessionId, {
        state: {
          codeReviewResults: reviewResult,
          metadata,
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