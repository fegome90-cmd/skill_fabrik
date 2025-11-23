#!/usr/bin/env node

/**
 * Forensic Advanced Quality Gates
 * Inspired by router's advanced-quality-gates.ts
 * Implements comprehensive quality validation for forensic analysis
 */

const fs = require('fs');
const path = require('path');
const { PerformanceCache } = require('../utils/performance-cache');

class ForensicAdvancedQualityGates {
  constructor(options = {}) {
    this.cache =
      options.cache || new PerformanceCache({ maxSize: 100, ttl: 120000 });
    this.targetPath = options.targetPath || process.cwd();
    this.configPath = options.configPath || path.join(process.cwd(), 'config');
    this.qualityThresholds = {
      minimumTestCoverage: 70, // %
      maximumComplexity: 10,
      maximumFileCount: 10000,
      maximumDependencyCount: 500,
      minimumDocumentationRatio: 0.1 // 10% of files should have documentation
    };
    this.gateResults = [];
  }

  /**
   * Executes all quality gates
   * @param {Object} context - Analysis context
   * @returns {Object} - Quality gates results
   */
  async executeQualityGates(context = {}) {
    const startTime = Date.now();
    const gateId = `quality-gate-${Date.now()}`;

    console.log(`🚪 Executing Forensic Advanced Quality Gates [${gateId}]`);

    try {
      const gates = [
        'code_quality_gate',
        'architecture_quality_gate',
        'testing_quality_gate',
        'documentation_quality_gate',
        'dependency_quality_gate',
        'performance_quality_gate',
        'security_quality_gate'
      ];

      for (const gate of gates) {
        const result = await this.executeGate(gate, context);
        this.gateResults.push(result);

        // Fail fast on critical gate failure
        if (result.critical && !result.passed) {
          return this.createQualityGateResult(false, context, result);
        }
      }

      // Overall quality decision
      const allPassed = this.gateResults.every(result => result.passed);
      return this.createQualityGateResult(allPassed, context);
    } catch (error) {
      console.error(`❌ Quality gates execution failed: ${error.message}`);
      return {
        success: false,
        gateId,
        error: error.message,
        executionTime: Date.now() - startTime,
        qualityScore: 0,
        decision: 'FAILED_CRITICAL_ERROR'
      };
    }
  }

  /**
   * Executes individual quality gate
   * @param {string} gateName - Name of quality gate
   * @param {Object} context - Execution context
   * @returns {Object} - Gate execution result
   */
  async executeGate(gateName, context) {
    const startTime = Date.now();

    try {
      console.log(`  🔍 Executing ${gateName}...`);

      switch (gateName) {
        case 'code_quality_gate':
          return await this.checkCodeQuality(context);
        case 'architecture_quality_gate':
          return await this.checkArchitectureQuality(context);
        case 'testing_quality_gate':
          return await this.checkTestingQuality(context);
        case 'documentation_quality_gate':
          return await this.checkDocumentationQuality(context);
        case 'dependency_quality_gate':
          return await this.checkDependencyQuality(context);
        case 'performance_quality_gate':
          return await this.checkPerformanceQuality(context);
        case 'security_quality_gate':
          return await this.checkSecurityQuality(context);
        default:
          throw new Error(`Unknown quality gate: ${gateName}`);
      }
    } catch (error) {
      return {
        gate: gateName,
        passed: false,
        critical: true,
        error: error.message,
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        score: 0
      };
    }
  }

  /**
   * Code Quality Gate - Validates code standards
   * @param {Object} context - Execution context
   * @returns {Object} - Code quality result
   */
  async checkCodeQuality(context) {
    const startTime = Date.now();
    const result = {
      gate: 'code_quality_gate',
      critical: true,
      metrics: {},
      checks: []
    };

    try {
      const codeFiles = await this.findCodeFiles(this.targetPath);
      result.metrics.codeFiles = codeFiles.length;

      // Check for code formatting (basic check)
      let formattedFiles = 0;
      let totalLines = 0;
      let complexFunctions = 0;
      let longFiles = 0;

      for (const file of codeFiles) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          const lines = content.split('\n');
          totalLines += lines.length;

          // Check file length (basic quality metric)
          if (lines.length > 500) {
            longFiles++;
          }

          // Check for very long functions (basic complexity check)
          const functionMatches = content.match(/function\s+\w+[^{]*\{/g) || [];
          for (const funcMatch of functionMatches) {
            const funcStart = content.indexOf(funcMatch);
            let braceCount = 0;
            let funcLines = 0;
            let inFunction = false;

            for (let i = funcStart; i < content.length; i++) {
              if (content[i] === '{') {
                if (!inFunction) {
                  inFunction = true;
                }
                braceCount++;
              } else if (content[i] === '}') {
                braceCount--;
                if (braceCount === 0 && inFunction) {
                  break;
                }
              }
              funcLines++;
            }

            if (funcLines > 50) {
              complexFunctions++;
            }
          }

          // Basic formatting check (no trailing spaces, proper line endings)
          const hasTrailingSpaces = /\s+$/m.test(content);
          const hasProperLineEndings = !content.includes('\r\n');

          if (!hasTrailingSpaces && hasProperLineEndings) {
            formattedFiles++;
          }
        } catch (error) {
          // Skip files that can't be read
        }
      }

      // Calculate metrics
      result.metrics.totalLines = totalLines;
      result.metrics.averageLinesPerFile =
        codeFiles.length > 0 ? Math.round(totalLines / codeFiles.length) : 0;
      result.metrics.formattingCompliance =
        codeFiles.length > 0 ? (formattedFiles / codeFiles.length) * 100 : 0;
      result.metrics.complexFunctions = complexFunctions;
      result.metrics.longFiles = longFiles;

      // Quality checks
      result.checks.push({
        check: 'file_count_reasonable',
        passed: codeFiles.length <= this.qualityThresholds.maximumFileCount,
        message: `${codeFiles.length} code files (threshold: ${this.qualityThresholds.maximumFileCount})`,
        threshold: this.qualityThresholds.maximumFileCount
      });

      result.checks.push({
        check: 'formatting_compliance',
        passed: result.metrics.formattingCompliance >= 80,
        message: `${result.metrics.formattingCompliance.toFixed(1)}% files properly formatted`,
        threshold: '80%'
      });

      result.checks.push({
        check: 'complexity_control',
        passed: complexFunctions <= codeFiles.length * 0.1, // Max 10% complex functions
        message: `${complexFunctions} complex functions (${((complexFunctions / codeFiles.length) * 100).toFixed(1)}%)`,
        threshold: '<= 10%'
      });

      result.passed = result.checks.every(check => check.passed);
      result.score = this.calculateScore(result.checks);
      result.executionTime = Date.now() - startTime;
      result.timestamp = new Date().toISOString();

      return result;
    } catch (error) {
      result.passed = false;
      result.error = error.message;
      result.executionTime = Date.now() - startTime;
      result.timestamp = new Date().toISOString();
      result.score = 0;
      return result;
    }
  }

  /**
   * Architecture Quality Gate - Validates architectural patterns
   * @param {Object} context - Execution context
   * @returns {Object} - Architecture quality result
   */
  async checkArchitectureQuality(context) {
    const startTime = Date.now();
    const result = {
      gate: 'architecture_quality_gate',
      critical: true,
      metrics: {},
      checks: []
    };

    try {
      // Check for architectural directories
      const architectureDirs = [
        'src',
        'lib',
        'packages',
        'components',
        'services',
        'utils'
      ];
      const foundDirs = architectureDirs.filter(dir =>
        fs.existsSync(path.join(this.targetPath, dir))
      );

      result.metrics.architecturalDirectories = foundDirs.length;
      result.metrics.expectedDirectories = architectureDirs.length;

      // Check for configuration management
      const configFiles = [
        'package.json',
        'tsconfig.json',
        'jest.config.js',
        '.eslintrc.json'
      ];
      const foundConfigs = configFiles.filter(config =>
        fs.existsSync(path.join(this.targetPath, config))
      );

      result.metrics.configurationFiles = foundConfigs.length;
      result.metrics.expectedConfigurations = configFiles.length;

      // Check for build/deployment setup
      const buildFiles = [
        'webpack.config.js',
        'vite.config.js',
        'rollup.config.js',
        'gulpfile.js'
      ];
      const hasBuildSetup = buildFiles.some(build =>
        fs.existsSync(path.join(this.targetPath, build))
      );

      result.metrics.hasBuildSetup = hasBuildSetup;

      // Check for documentation structure
      const docDirs = ['docs', 'documentation', 'README.md'];
      const hasDocumentation = docDirs.some(doc =>
        fs.existsSync(path.join(this.targetPath, doc))
      );

      result.metrics.hasDocumentation = hasDocumentation;

      // Quality checks
      result.checks.push({
        check: 'architectural_structure',
        passed: foundDirs.length >= 2, // At least 2 architectural directories
        message: `${foundDirs.length}/${architectureDirs.length} architectural directories found`,
        threshold: '>= 2'
      });

      result.checks.push({
        check: 'configuration_management',
        passed: foundConfigs.length >= 2, // At least 2 config files
        message: `${foundConfigs.length}/${configFiles.length} configuration files found`,
        threshold: '>= 2'
      });

      result.checks.push({
        check: 'documentation_present',
        passed: hasDocumentation,
        message: hasDocumentation
          ? 'Documentation found'
          : 'No documentation found',
        threshold: 'true'
      });

      result.passed = result.checks.every(check => check.passed);
      result.score = this.calculateScore(result.checks);
      result.executionTime = Date.now() - startTime;
      result.timestamp = new Date().toISOString();

      return result;
    } catch (error) {
      result.passed = false;
      result.error = error.message;
      result.executionTime = Date.now() - startTime;
      result.timestamp = new Date().toISOString();
      result.score = 0;
      return result;
    }
  }

  /**
   * Testing Quality Gate - Validates testing setup and coverage
   * @param {Object} context - Execution context
   * @returns {Object} - Testing quality result
   */
  async checkTestingQuality(context) {
    const startTime = Date.now();
    const result = {
      gate: 'testing_quality_gate',
      critical: true,
      metrics: {},
      checks: []
    };

    try {
      // Find test files
      const testFiles = await this.findTestFiles(this.targetPath);
      result.metrics.testFiles = testFiles.length;

      // Find test configuration files
      const testConfigs = [
        'jest.config.js',
        'vitest.config.js',
        'karma.conf.js',
        'mocha.opts'
      ];
      const foundTestConfigs = testConfigs.filter(config =>
        fs.existsSync(path.join(this.targetPath, config))
      );

      result.metrics.testConfigurations = foundTestConfigs.length;
      result.metrics.hasTestConfig = foundTestConfigs.length > 0;

      // Check for test directories
      const testDirs = ['tests', 'test', '__tests__', 'spec'];
      const foundTestDirs = testDirs.filter(
        dir =>
          fs.existsSync(path.join(this.targetPath, dir)) ||
          fs.existsSync(path.join(this.targetPath, dir + 's'))
      );

      result.metrics.testDirectories = foundTestDirs.length;
      result.metrics.hasTestDirectory = foundTestDirs.length > 0;

      // Check code files to test files ratio
      const codeFiles = await this.findCodeFiles(this.targetPath);
      const testCoverageRatio =
        codeFiles.length > 0 ? (testFiles.length / codeFiles.length) * 100 : 0;
      result.metrics.testCoverageRatio = testCoverageRatio;

      // Quality checks
      result.checks.push({
        check: 'test_configuration_present',
        passed: result.metrics.hasTestConfig,
        message: `${foundTestConfigs.length} test configuration files found`,
        threshold: '>= 1'
      });

      result.checks.push({
        check: 'test_structure_organized',
        passed: result.metrics.hasTestDirectory || testFiles.length > 0,
        message: `${testFiles.length} test files found in ${foundTestDirs.length} test directories`,
        threshold: '>= 1 test file'
      });

      result.checks.push({
        check: 'test_coverage_adequate',
        passed: testCoverageRatio >= this.qualityThresholds.minimumTestCoverage,
        message: `Test coverage ratio: ${testCoverageRatio.toFixed(1)}% (${testFiles.length}/${codeFiles.length})`,
        threshold: `>= ${this.qualityThresholds.minimumTestCoverage}%`
      });

      result.passed = result.checks.every(check => check.passed);
      result.score = this.calculateScore(result.checks);
      result.executionTime = Date.now() - startTime;
      result.timestamp = new Date().toISOString();

      return result;
    } catch (error) {
      result.passed = false;
      result.error = error.message;
      result.executionTime = Date.now() - startTime;
      result.timestamp = new Date().toISOString();
      result.score = 0;
      return result;
    }
  }

  /**
   * Documentation Quality Gate - Validates documentation presence and quality
   * @param {Object} context - Execution context
   * @returns {Object} - Documentation quality result
   */
  async checkDocumentationQuality(context) {
    const startTime = Date.now();
    const result = {
      gate: 'documentation_quality_gate',
      critical: false, // Documentation issues are warnings, not blockers
      metrics: {},
      checks: []
    };

    try {
      // Find documentation files
      const docFiles = await this.findDocumentationFiles(this.targetPath);
      result.metrics.documentationFiles = docFiles.length;

      // Find code files for ratio calculation
      const codeFiles = await this.findCodeFiles(this.targetPath);
      const docRatio =
        codeFiles.length > 0 ? docFiles.length / codeFiles.length : 0;
      result.metrics.documentationRatio = docRatio;

      // Check for README
      const hasReadme =
        fs.existsSync(path.join(this.targetPath, 'README.md')) ||
        fs.existsSync(path.join(this.targetPath, 'README')) ||
        fs.existsSync(path.join(this.targetPath, 'readme.md'));

      result.metrics.hasReadme = hasReadme;

      // Check for API documentation
      const apiDocs = [
        'API.md',
        'api.md',
        'docs/api.md',
        'documentation/api.md'
      ];
      const hasApiDocs = apiDocs.some(doc =>
        fs.existsSync(path.join(this.targetPath, doc))
      );

      result.metrics.hasApiDocumentation = hasApiDocs;

      // Quality checks
      result.checks.push({
        check: 'readme_present',
        passed: hasReadme,
        message: hasReadme ? 'README file found' : 'No README file found',
        threshold: 'true'
      });

      result.checks.push({
        check: 'documentation_adequate',
        passed: docRatio >= this.qualityThresholds.minimumDocumentationRatio,
        message: `Documentation ratio: ${(docRatio * 100).toFixed(1)}% (${docFiles.length}/${codeFiles.length})`,
        threshold: `>= ${this.qualityThresholds.minimumDocumentationRatio * 100}%`
      });

      result.checks.push({
        check: 'api_documentation',
        passed: hasApiDocs || docFiles.length >= 3, // Either API docs or substantial general docs
        message: hasApiDocs
          ? 'API documentation found'
          : `${docFiles.length} documentation files found`,
        threshold: 'API docs or >= 3 doc files'
      });

      result.passed = result.checks.every(check => check.passed);
      result.score = this.calculateScore(result.checks);
      result.executionTime = Date.now() - startTime;
      result.timestamp = new Date().toISOString();

      return result;
    } catch (error) {
      result.passed = false;
      result.error = error.message;
      result.executionTime = Date.now() - startTime;
      result.timestamp = new Date().toISOString();
      result.score = 0;
      return result;
    }
  }

  /**
   * Dependency Quality Gate - Validates dependency management
   * @param {Object} context - Execution context
   * @returns {Object} - Dependency quality result
   */
  async checkDependencyQuality(context) {
    const startTime = Date.now();
    const result = {
      gate: 'dependency_quality_gate',
      critical: true,
      metrics: {},
      checks: []
    };

    try {
      // Check package.json
      const packageJsonPath = path.join(this.targetPath, 'package.json');
      let hasPackageJson = false;
      let dependencyCount = 0;
      let devDependencyCount = 0;
      let hasDependencyManagement = false;

      if (fs.existsSync(packageJsonPath)) {
        hasPackageJson = true;
        try {
          const packageJson = JSON.parse(
            fs.readFileSync(packageJsonPath, 'utf8')
          );
          dependencyCount = Object.keys(packageJson.dependencies || {}).length;
          devDependencyCount = Object.keys(
            packageJson.devDependencies || {}
          ).length;

          // Check for lock files
          hasDependencyManagement =
            fs.existsSync(path.join(this.targetPath, 'package-lock.json')) ||
            fs.existsSync(path.join(this.targetPath, 'yarn.lock')) ||
            fs.existsSync(path.join(this.targetPath, 'pnpm-lock.yaml'));
        } catch (error) {
          // Invalid package.json
        }
      }

      result.metrics.hasPackageJson = hasPackageJson;
      result.metrics.dependencyCount = dependencyCount;
      result.metrics.devDependencyCount = devDependencyCount;
      result.metrics.totalDependencies = dependencyCount + devDependencyCount;
      result.metrics.hasDependencyManagement = hasDependencyManagement;

      // Quality checks
      result.checks.push({
        check: 'package_json_present',
        passed: hasPackageJson,
        message: hasPackageJson
          ? 'package.json found'
          : 'No package.json found',
        threshold: 'true'
      });

      result.checks.push({
        check: 'dependency_count_reasonable',
        passed:
          result.metrics.totalDependencies <=
          this.qualityThresholds.maximumDependencyCount,
        message: `${result.metrics.totalDependencies} total dependencies (threshold: ${this.qualityThresholds.maximumDependencyCount})`,
        threshold: `<= ${this.qualityThresholds.maximumDependencyCount}`
      });

      result.checks.push({
        check: 'dependency_management_present',
        passed: hasDependencyManagement || !hasPackageJson, // No lock file needed if no package.json
        message: hasDependencyManagement
          ? 'Dependency lock file found'
          : 'No dependency lock file',
        threshold: 'true'
      });

      result.passed = result.checks.every(check => check.passed);
      result.score = this.calculateScore(result.checks);
      result.executionTime = Date.now() - startTime;
      result.timestamp = new Date().toISOString();

      return result;
    } catch (error) {
      result.passed = false;
      result.error = error.message;
      result.executionTime = Date.now() - startTime;
      result.timestamp = new Date().toISOString();
      result.score = 0;
      return result;
    }
  }

  /**
   * Performance Quality Gate - Validates performance characteristics
   * @param {Object} context - Execution context
   * @returns {Object} - Performance quality result
   */
  async checkPerformanceQuality(context) {
    const startTime = Date.now();
    const result = {
      gate: 'performance_quality_gate',
      critical: false,
      metrics: {},
      checks: []
    };

    try {
      // Check file sizes
      const allFiles = await this.getAllFiles(this.targetPath);
      let largeFiles = 0;
      let totalSize = 0;

      for (const file of allFiles) {
        try {
          const stats = fs.statSync(file);
          const sizeKB = Math.round(stats.size / 1024);
          totalSize += sizeKB;

          if (sizeKB > 1000) {
            // Files larger than 1MB
            largeFiles++;
          }
        } catch (error) {
          // Skip files that can't be accessed
        }
      }

      result.metrics.totalFiles = allFiles.length;
      result.metrics.totalSizeKB = totalSize;
      result.metrics.largeFiles = largeFiles;
      result.metrics.averageFileSizeKB =
        allFiles.length > 0 ? Math.round(totalSize / allFiles.length) : 0;

      // Check for performance optimization files
      const perfFiles = [
        'webpack.config.js',
        'vite.config.js',
        'rollup.config.js',
        '.babelrc',
        'tsconfig.json'
      ];
      const hasOptimization = perfFiles.some(file =>
        fs.existsSync(path.join(this.targetPath, file))
      );

      result.metrics.hasOptimizationConfig = hasOptimization;

      // Quality checks
      result.checks.push({
        check: 'file_size_reasonable',
        passed: largeFiles <= 5, // Max 5 large files
        message: `${largeFiles} large files (>1MB) found`,
        threshold: '<= 5'
      });

      result.checks.push({
        check: 'total_size_reasonable',
        passed: totalSize <= 500000, // Max 500MB total
        message: `Total size: ${Math.round(totalSize / 1024)}MB`,
        threshold: '<= 500MB'
      });

      result.checks.push({
        check: 'performance_optimization',
        passed: hasOptimization || allFiles.length < 50, // Either optimization or small project
        message: hasOptimization
          ? 'Performance optimization config found'
          : 'Small project (no optimization needed)',
        threshold: 'optimization config or < 50 files'
      });

      result.passed = result.checks.every(check => check.passed);
      result.score = this.calculateScore(result.checks);
      result.executionTime = Date.now() - startTime;
      result.timestamp = new Date().toISOString();

      return result;
    } catch (error) {
      result.passed = false;
      result.error = error.message;
      result.executionTime = Date.now() - startTime;
      result.timestamp = new Date().toISOString();
      result.score = 0;
      return result;
    }
  }

  /**
   * Security Quality Gate - Validates security practices
   * @param {Object} context - Execution context
   * @returns {Object} - Security quality result
   */
  async checkSecurityQuality(context) {
    const startTime = Date.now();
    const result = {
      gate: 'security_quality_gate',
      critical: true,
      metrics: {},
      checks: []
    };

    try {
      // Check for security configuration files
      const securityFiles = [
        '.gitignore',
        '.env.example',
        'SECURITY.md',
        '.eslintrc.json'
      ];
      const foundSecurityFiles = securityFiles.filter(file =>
        fs.existsSync(path.join(this.targetPath, file))
      );

      result.metrics.securityFiles = foundSecurityFiles.length;

      // Check for .gitignore presence and quality
      const gitignorePath = path.join(this.targetPath, '.gitignore');
      let hasGitignore = false;
      let gitignoreQuality = false;

      if (fs.existsSync(gitignorePath)) {
        hasGitignore = true;
        const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
        const essentialIgnores = [
          'node_modules',
          '.env',
          'dist',
          'build',
          'coverage'
        ];
        gitignoreQuality = essentialIgnores.some(ignore =>
          gitignoreContent.includes(ignore)
        );
      }

      result.metrics.hasGitignore = hasGitignore;
      result.metrics.gitignoreQuality = gitignoreQuality;

      // Check for environment variables management
      const envExamplePath = path.join(this.targetPath, '.env.example');
      const hasEnvExample = fs.existsSync(envExamplePath);
      result.metrics.hasEnvExample = hasEnvExample;

      // Check for package.json scripts security
      let packageJsonScripts = [];
      const packageJsonPath = path.join(this.targetPath, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        try {
          const packageJson = JSON.parse(
            fs.readFileSync(packageJsonPath, 'utf8')
          );
          packageJsonScripts = Object.keys(packageJson.scripts || {});
        } catch (error) {
          // Invalid package.json
        }
      }

      result.metrics.packageJsonScripts = packageJsonScripts.length;

      // Quality checks
      result.checks.push({
        check: 'gitignore_present',
        passed: hasGitignore,
        message: hasGitignore ? '.gitignore found' : 'No .gitignore file',
        threshold: 'true'
      });

      result.checks.push({
        check: 'gitignore_effective',
        passed: gitignoreQuality,
        message: gitignoreQuality
          ? 'Effective .gitignore (ignores essential files)'
          : 'Ineffective .gitignore',
        threshold: 'true'
      });

      result.checks.push({
        check: 'environment_management',
        passed:
          hasEnvExample || !fs.existsSync(path.join(this.targetPath, '.env')),
        message: hasEnvExample
          ? '.env.example found'
          : 'No .env file or .env.example missing',
        threshold: 'true'
      });

      result.passed = result.checks.every(check => check.passed);
      result.score = this.calculateScore(result.checks);
      result.executionTime = Date.now() - startTime;
      result.timestamp = new Date().toISOString();

      return result;
    } catch (error) {
      result.passed = false;
      result.error = error.message;
      result.executionTime = Date.now() - startTime;
      result.timestamp = new Date().toISOString();
      result.score = 0;
      return result;
    }
  }

  /**
   * Finds all code files in the target directory
   * @param {string} dirPath - Directory to search
   * @returns {Promise<Array>} - Array of code file paths
   */
  async findCodeFiles(dirPath) {
    const codeExtensions = [
      '.js',
      '.ts',
      '.jsx',
      '.tsx',
      '.vue',
      '.py',
      '.java',
      '.cpp',
      '.c',
      '.h'
    ];
    const files = [];

    const searchDir = dir => {
      try {
        const items = fs.readdirSync(dir);
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stats = fs.statSync(fullPath);

          if (
            stats.isDirectory() &&
            !item.startsWith('.') &&
            item !== 'node_modules'
          ) {
            searchDir(fullPath);
          } else if (stats.isFile()) {
            const ext = path.extname(item);
            if (codeExtensions.includes(ext)) {
              files.push(fullPath);
            }
          }
        }
      } catch (error) {
        // Skip directories that can't be accessed
      }
    };

    searchDir(dirPath);
    return files;
  }

  /**
   * Finds all test files in the target directory
   * @param {string} dirPath - Directory to search
   * @returns {Promise<Array>} - Array of test file paths
   */
  async findTestFiles(dirPath) {
    const testPatterns = [
      /\.test\./,
      /\.spec\./,
      /test\./,
      /spec\./,
      /__tests__\//
    ];
    const files = await this.findCodeFiles(dirPath);

    return files.filter(file =>
      testPatterns.some(pattern => pattern.test(file))
    );
  }

  /**
   * Finds all documentation files in the target directory
   * @param {string} dirPath - Directory to search
   * @returns {Promise<Array>} - Array of documentation file paths
   */
  async findDocumentationFiles(dirPath) {
    const docExtensions = ['.md', '.txt', '.rst', '.adoc'];
    const files = [];

    const searchDir = dir => {
      try {
        const items = fs.readdirSync(dir);
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stats = fs.statSync(fullPath);

          if (
            stats.isDirectory() &&
            !item.startsWith('.') &&
            item !== 'node_modules'
          ) {
            searchDir(fullPath);
          } else if (stats.isFile()) {
            const ext = path.extname(item);
            const baseName = path.basename(item, ext);

            if (
              docExtensions.includes(ext) ||
              baseName.toLowerCase().includes('readme') ||
              baseName.toLowerCase().includes('doc') ||
              baseName.toLowerCase().includes('guide')
            ) {
              files.push(fullPath);
            }
          }
        }
      } catch (error) {
        // Skip directories that can't be accessed
      }
    };

    searchDir(dirPath);
    return files;
  }

  /**
   * Gets all files in the target directory
   * @param {string} dirPath - Directory to search
   * @returns {Promise<Array>} - Array of all file paths
   */
  async getAllFiles(dirPath) {
    const files = [];

    const searchDir = dir => {
      try {
        const items = fs.readdirSync(dir);
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stats = fs.statSync(fullPath);

          if (
            stats.isDirectory() &&
            !item.startsWith('.') &&
            item !== 'node_modules'
          ) {
            searchDir(fullPath);
          } else if (stats.isFile()) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Skip directories that can't be accessed
      }
    };

    searchDir(dirPath);
    return files;
  }

  /**
   * Calculates quality score based on check results
   * @param {Array} checks - Array of check results
   * @returns {number} - Quality score (0-100)
   */
  calculateScore(checks) {
    if (checks.length === 0) return 0;

    const passedChecks = checks.filter(check => check.passed).length;
    return Math.round((passedChecks / checks.length) * 100);
  }

  /**
   * Creates final quality gate result
   * @param {boolean} success - Overall success
   * @param {Object} context - Execution context
   * @param {Object} failingGate - First failing gate
   * @returns {Object} - Final result
   */
  createQualityGateResult(success, context, failingGate = null) {
    const executionTime = Date.now() - (context.startTime || Date.now());
    const overallScore =
      this.gateResults.length > 0
        ? Math.round(
          this.gateResults.reduce((sum, gate) => sum + (gate.score || 0), 0) /
              this.gateResults.length
        )
        : 0;

    const result = {
      success,
      gateId: context.gateId || `quality-gate-${Date.now()}`,
      executionTime,
      qualityScore: overallScore,
      timestamp: new Date().toISOString(),
      gateResults: this.gateResults,
      decision: success
        ? overallScore >= 90
          ? 'EXCELLENT'
          : overallScore >= 75
            ? 'GOOD'
            : 'ACCEPTABLE'
        : failingGate?.critical
          ? 'FAILED_CRITICAL'
          : 'FAILED_WARNINGS',
      summary: {
        totalGates: this.gateResults.length,
        passedGates: this.gateResults.filter(g => g.passed).length,
        failedGates: this.gateResults.filter(g => !g.passed).length,
        criticalFailures: this.gateResults.filter(g => !g.passed && g.critical)
          .length
      }
    };

    if (!success && failingGate) {
      result.reason = failingGate.error || 'Quality gate failed';
      result.failingGate = failingGate.gate;
    }

    return result;
  }

  /**
   * Prints quality gate summary
   * @param {Object} result - Quality gate result
   */
  printQualityGateSummary(result) {
    console.log('\n🚪 Forensic Advanced Quality Gates Summary');
    console.log('==========================================');

    console.log(`\n🎯 Decision: ${result.decision}`);
    console.log(`📊 Quality Score: ${result.qualityScore}/100`);
    console.log(`⏱️  Execution Time: ${result.executionTime}ms`);

    if (result.gateResults) {
      console.log('\n📋 Gate Results:');
      result.gateResults.forEach(gate => {
        const status = gate.passed ? '✅' : '❌';
        const critical = gate.critical ? ' (critical)' : ' (warning)';
        const score = gate.score !== undefined ? ` (${gate.score}/100)` : '';
        console.log(
          `  ${status} ${gate.gate}${critical}${score} - ${gate.executionTime}ms`
        );

        if (gate.metrics && Object.keys(gate.metrics).length > 0) {
          Object.entries(gate.metrics).forEach(([key, value]) => {
            console.log(`    📈 ${key}: ${value}`);
          });
        }

        if (gate.checks) {
          gate.checks.forEach(check => {
            const checkStatus = check.passed ? '✅' : '❌';
            console.log(`    ${checkStatus} ${check.check}: ${check.message}`);
          });
        }
      });
    }

    console.log(
      `\n📈 Summary: ${result.summary?.passedGates}/${result.summary?.totalGates} gates passed`
    );

    if (result.summary?.criticalFailures > 0) {
      console.log(
        `⚠️  ${result.summary.criticalFailures} critical failures detected`
      );
    }
  }
}

module.exports = ForensicAdvancedQualityGates;

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const targetPath = args[0] || process.cwd();

  const qualityGates = new ForensicAdvancedQualityGates({
    targetPath
  });

  qualityGates
    .executeQualityGates()
    .then(result => {
      qualityGates.printQualityGateSummary(result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error(`❌ Quality gates failed: ${error.message}`);
      process.exit(1);
    });
}
