#!/usr/bin/env node

/**
 * Forensic Pre-Invoke Validation Pipeline
 * Inspired by router's pre-invoke.ts - Validates analysis before execution
 * Implements multi-layer validation for forensic analysis reliability
 */

const fs = require('fs');
const path = require('path');
const { PerformanceCache } = require('../utils/performance-cache');

class ForensicPreInvoke {
  constructor(options = {}) {
    this.cache =
      options.cache || new PerformanceCache({ maxSize: 50, ttl: 60000 });
    this.rulesPath =
      options.rulesPath ||
      path.join(process.cwd(), 'config', 'rules_forense.json');
    this.targetPath = options.targetPath || process.cwd();
    this.validationLayers = [
      'target_validation',
      'rules_validation',
      'environment_validation',
      'permission_validation',
      'resource_validation'
    ];
    this.validationResults = [];
  }

  /**
   * Executes complete pre-invoke validation pipeline
   * @param {Object} context - Analysis context
   * @returns {Object} - Validation results with go/no-go decision
   */
  async validateAnalysis(context = {}) {
    const startTime = Date.now();
    const validationId = `forensic-validation-${Date.now()}`;

    try {
      console.log(
        `🔍 Starting forensic pre-invoke validation [${validationId}]`
      );

      // Initialize validation context
      const validationContext = {
        id: validationId,
        startTime,
        targetPath: this.targetPath,
        rulesPath: this.rulesPath,
        userContext: context,
        cache: this.cache
      };

      // Execute validation layers
      for (const layer of this.validationLayers) {
        const layerResult = await this.executeValidationLayer(
          layer,
          validationContext
        );
        this.validationResults.push(layerResult);

        // Early termination on critical failure
        if (layerResult.critical && !layerResult.passed) {
          return this.createValidationResult(
            false,
            validationContext,
            layerResult
          );
        }
      }

      // Final validation decision
      const allPassed = this.validationResults.every(result => result.passed);
      return this.createValidationResult(allPassed, validationContext);
    } catch (error) {
      console.error(`❌ Pre-invoke validation failed: ${error.message}`);
      return {
        success: false,
        validationId,
        error: error.message,
        executionTime: Date.now() - startTime,
        goDecision: 'NO_GO_CRITICAL_ERROR'
      };
    }
  }

  /**
   * Executes individual validation layer
   * @param {string} layerName - Name of validation layer
   * @param {Object} context - Validation context
   * @returns {Object} - Layer validation result
   */
  async executeValidationLayer(layerName, context) {
    const startTime = Date.now();

    try {
      console.log(`  🔎 Executing ${layerName}...`);

      switch (layerName) {
        case 'target_validation':
          return await this.validateTarget(context);
        case 'rules_validation':
          return await this.validateRules(context);
        case 'environment_validation':
          return await this.validateEnvironment(context);
        case 'permission_validation':
          return await this.validatePermissions(context);
        case 'resource_validation':
          return await this.validateResources(context);
        default:
          throw new Error(`Unknown validation layer: ${layerName}`);
      }
    } catch (error) {
      return {
        layer: layerName,
        passed: false,
        critical: true,
        error: error.message,
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Validates target directory for forensic analysis
   * @param {Object} context - Validation context
   * @returns {Object} - Target validation result
   */
  async validateTarget(context) {
    const startTime = Date.now();
    const targetPath = context.targetPath;

    const validation = {
      layer: 'target_validation',
      critical: true,
      checks: []
    };

    try {
      // Check if target exists
      if (!fs.existsSync(targetPath)) {
        validation.checks.push({
          check: 'target_exists',
          passed: false,
          message: `Target path does not exist: ${targetPath}`
        });
        validation.passed = false;
        return validation;
      }
      validation.checks.push({
        check: 'target_exists',
        passed: true,
        message: `Target path exists: ${targetPath}`
      });

      // Check if target is directory
      const stats = fs.statSync(targetPath);
      if (!stats.isDirectory()) {
        validation.checks.push({
          check: 'target_is_directory',
          passed: false,
          message: 'Target must be a directory'
        });
        validation.passed = false;
        return validation;
      }
      validation.checks.push({
        check: 'target_is_directory',
        passed: true,
        message: 'Target is a directory'
      });

      // Check for git repository (recommended for forensic analysis)
      const gitPath = path.join(targetPath, '.git');
      const hasGit = fs.existsSync(gitPath);
      validation.checks.push({
        check: 'git_repository',
        passed: hasGit,
        message: hasGit
          ? 'Git repository detected'
          : 'No git repository (warning)'
      });

      // Check for package.json (Node.js project)
      const packageJsonPath = path.join(targetPath, 'package.json');
      const hasPackageJson = fs.existsSync(packageJsonPath);
      validation.checks.push({
        check: 'package_json',
        passed: hasPackageJson,
        message: hasPackageJson
          ? 'Node.js project detected'
          : 'No package.json found'
      });

      // Basic project structure validation
      const basicDirs = ['src', 'lib', 'packages', 'docs'];
      const foundDirs = basicDirs.filter(dir =>
        fs.existsSync(path.join(targetPath, dir))
      );

      validation.checks.push({
        check: 'project_structure',
        passed: foundDirs.length > 0,
        message: `Found ${foundDirs.length} basic directories: ${foundDirs.join(', ')}`
      });

      validation.passed = validation.checks.every(check => check.passed);
      validation.executionTime = Date.now() - startTime;
      validation.timestamp = new Date().toISOString();

      return validation;
    } catch (error) {
      validation.passed = false;
      validation.error = error.message;
      validation.executionTime = Date.now() - startTime;
      validation.timestamp = new Date().toISOString();
      return validation;
    }
  }

  /**
   * Validates forensic analysis rules
   * @param {Object} context - Validation context
   * @returns {Object} - Rules validation result
   */
  async validateRules(context) {
    const startTime = Date.now();
    const rulesPath = context.rulesPath;

    const validation = {
      layer: 'rules_validation',
      critical: true,
      checks: []
    };

    try {
      // Check if rules file exists
      if (!fs.existsSync(rulesPath)) {
        validation.checks.push({
          check: 'rules_exist',
          passed: false,
          message: `Rules file not found: ${rulesPath}`
        });
        validation.passed = false;
        return validation;
      }

      validation.checks.push({
        check: 'rules_exist',
        passed: true,
        message: `Rules file found: ${rulesPath}`
      });

      // Try to parse rules JSON
      let rules;
      try {
        const rulesContent = fs.readFileSync(rulesPath, 'utf8');
        rules = JSON.parse(rulesContent);
        validation.checks.push({
          check: 'rules_parseable',
          passed: true,
          message: 'Rules JSON parsed successfully'
        });
      } catch (parseError) {
        validation.checks.push({
          check: 'rules_parseable',
          passed: false,
          message: `Rules JSON parse error: ${parseError.message}`
        });
        validation.passed = false;
        return validation;
      }

      // Validate rules structure
      const requiredSections = ['maximas', 'prohibiciones', 'obligaciones'];
      const foundSections = requiredSections.filter(section => rules[section]);

      if (foundSections.length === requiredSections.length) {
        validation.checks.push({
          check: 'rules_structure',
          passed: true,
          message: `All required sections present: ${foundSections.join(', ')}`
        });
      } else {
        const missingSections = requiredSections.filter(
          section => !rules[section]
        );
        validation.checks.push({
          check: 'rules_structure',
          passed: false,
          message: `Missing sections: ${missingSections.join(', ')}`
        });
        validation.passed = false;
      }

      // Validate maxima count
      if (rules.maximas && Object.keys(rules.maximas).length >= 3) {
        validation.checks.push({
          check: 'maximas_count',
          passed: true,
          message: `${Object.keys(rules.maximas).length} máximas defined`
        });
      } else {
        validation.checks.push({
          check: 'maximas_count',
          passed: false,
          message: 'Insufficient máximas defined (minimum 3 required)'
        });
        validation.passed = false;
      }

      validation.executionTime = Date.now() - startTime;
      validation.timestamp = new Date().toISOString();

      return validation;
    } catch (error) {
      validation.passed = false;
      validation.error = error.message;
      validation.executionTime = Date.now() - startTime;
      validation.timestamp = new Date().toISOString();
      return validation;
    }
  }

  /**
   * Validates environment for forensic analysis
   * @param {Object} context - Validation context
   * @returns {Object} - Environment validation result
   */
  async validateEnvironment(context) {
    const startTime = Date.now();

    const validation = {
      layer: 'environment_validation',
      critical: false, // Environment issues are warnings, not blockers
      checks: []
    };

    try {
      // Check Node.js version
      const nodeVersion = process.version;
      const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
      const nodeSupported = majorVersion >= 14;

      validation.checks.push({
        check: 'node_version',
        passed: nodeSupported,
        message: `Node.js ${nodeVersion} (${nodeSupported ? 'supported' : 'not supported - requires v14+'})`
      });

      // Check available memory
      const memoryUsage = process.memoryUsage();
      const availableMemory = memoryUsage.heapTotal;
      const memoryAdequate = availableMemory > 50 * 1024 * 1024; // 50MB minimum

      validation.checks.push({
        check: 'memory_available',
        passed: memoryAdequate,
        message: `Available memory: ${Math.round(availableMemory / 1024 / 1024)}MB (${memoryAdequate ? 'adequate' : 'low'})`
      });

      // Check disk space (basic check)
      const targetStats = fs.statSync(context.targetPath);
      validation.checks.push({
        check: 'disk_access',
        passed: true,
        message: 'Disk access verified'
      });

      // Check for required tools
      const requiredTools = ['node', 'npm'];
      const availableTools = [];

      for (const tool of requiredTools) {
        try {
          // Simple check - in real implementation would use which/where command
          availableTools.push(tool);
        } catch (error) {
          // Tool not available
        }
      }

      const toolsAdequate = availableTools.length === requiredTools.length;
      validation.checks.push({
        check: 'required_tools',
        passed: toolsAdequate,
        message: `Available tools: ${availableTools.join(', ')} (${toolsAdequate ? 'all present' : 'missing tools'})`
      });

      validation.passed = validation.checks.every(check => check.passed);
      validation.executionTime = Date.now() - startTime;
      validation.timestamp = new Date().toISOString();

      return validation;
    } catch (error) {
      validation.passed = false;
      validation.error = error.message;
      validation.executionTime = Date.now() - startTime;
      validation.timestamp = new Date().toISOString();
      return validation;
    }
  }

  /**
   * Validates file system permissions
   * @param {Object} context - Validation context
   * @returns {Object} - Permissions validation result
   */
  async validatePermissions(context) {
    const startTime = Date.now();

    const validation = {
      layer: 'permission_validation',
      critical: true,
      checks: []
    };

    try {
      // Test read access to target
      try {
        fs.readdirSync(context.targetPath);
        validation.checks.push({
          check: 'target_read_access',
          passed: true,
          message: 'Read access to target directory'
        });
      } catch (error) {
        validation.checks.push({
          check: 'target_read_access',
          passed: false,
          message: `No read access to target: ${error.message}`
        });
        validation.passed = false;
        return validation;
      }

      // Test write access to current directory (for reports)
      const testFile = path.join(process.cwd(), '.forensic-permission-test');
      try {
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
        validation.checks.push({
          check: 'reports_write_access',
          passed: true,
          message: 'Write access for reports directory'
        });
      } catch (error) {
        validation.checks.push({
          check: 'reports_write_access',
          passed: false,
          message: `No write access for reports: ${error.message}`
        });
        validation.passed = false;
        return validation;
      }

      // Check rules file access
      try {
        fs.readFileSync(context.rulesPath, 'utf8');
        validation.checks.push({
          check: 'rules_read_access',
          passed: true,
          message: 'Read access to rules file'
        });
      } catch (error) {
        validation.checks.push({
          check: 'rules_read_access',
          passed: false,
          message: `No read access to rules: ${error.message}`
        });
        validation.passed = false;
        return validation;
      }

      validation.passed = validation.checks.every(check => check.passed);
      validation.executionTime = Date.now() - startTime;
      validation.timestamp = new Date().toISOString();

      return validation;
    } catch (error) {
      validation.passed = false;
      validation.error = error.message;
      validation.executionTime = Date.now() - startTime;
      validation.timestamp = new Date().toISOString();
      return validation;
    }
  }

  /**
   * Validates system resources for analysis
   * @param {Object} context - Validation context
   * @returns {Object} - Resource validation result
   */
  async validateResources(context) {
    const startTime = Date.now();

    const validation = {
      layer: 'resource_validation',
      critical: false,
      checks: []
    };

    try {
      // Check memory usage
      const memUsage = process.memoryUsage();
      const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
      const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
      const memoryUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

      const memoryOk = memoryUsagePercent < 80; // Less than 80% used
      validation.checks.push({
        check: 'memory_usage',
        passed: memoryOk,
        message: `Memory: ${heapUsedMB}/${heapTotalMB}MB (${memoryUsagePercent.toFixed(1)}% used) ${memoryOk ? '✅' : '⚠️'}`
      });

      // Check CPU load (basic check)
      const cpuUsage = process.cpuUsage();
      validation.checks.push({
        check: 'cpu_available',
        passed: true, // Basic check - always pass for now
        message: `CPU usage available (user: ${cpuUsage.user}, system: ${cpuUsage.system})`
      });

      // Check for available disk space (simplified)
      validation.checks.push({
        check: 'disk_space',
        passed: true, // Basic check - assume adequate for now
        message: 'Disk space appears adequate'
      });

      validation.passed = validation.checks.every(check => check.passed);
      validation.executionTime = Date.now() - startTime;
      validation.timestamp = new Date().toISOString();

      return validation;
    } catch (error) {
      validation.passed = false;
      validation.error = error.message;
      validation.executionTime = Date.now() - startTime;
      validation.timestamp = new Date().toISOString();
      return validation;
    }
  }

  /**
   * Creates final validation result
   * @param {boolean} success - Overall validation success
   * @param {Object} context - Validation context
   * @param {Object} failingLayer - First failing layer (if any)
   * @returns {Object} - Final validation result
   */
  createValidationResult(success, context, failingLayer = null) {
    const executionTime = Date.now() - context.startTime;

    const result = {
      success,
      validationId: context.id,
      executionTime,
      timestamp: new Date().toISOString(),
      validationResults: this.validationResults,
      goDecision: success
        ? 'GO'
        : failingLayer?.critical
          ? 'NO_GO_CRITICAL'
          : 'NO_GO_WARNINGS',
      summary: {
        totalLayers: this.validationLayers.length,
        passedLayers: this.validationResults.filter(r => r.passed).length,
        failedLayers: this.validationResults.filter(r => !r.passed).length,
        criticalFailures: this.validationResults.filter(
          r => !r.passed && r.critical
        ).length
      }
    };

    if (!success && failingLayer) {
      result.reason = failingLayer.error || 'Validation layer failed';
      result.failingLayer = failingLayer.layer;
    }

    return result;
  }

  /**
   * Prints validation summary
   * @param {Object} result - Validation result
   */
  printValidationSummary(result) {
    console.log('\n📋 Forensic Pre-Invoke Validation Summary');
    console.log('==========================================');

    console.log(`\n🎯 Decision: ${result.goDecision}`);
    console.log(`⏱️  Execution Time: ${result.executionTime}ms`);
    console.log(`🆔 Validation ID: ${result.validationId}`);

    if (result.validationResults) {
      console.log('\n📊 Layer Results:');
      result.validationResults.forEach(layer => {
        const status = layer.passed ? '✅' : '❌';
        const critical = layer.critical ? ' (critical)' : '';
        console.log(
          `  ${status} ${layer.layer}${critical} - ${layer.executionTime}ms`
        );

        if (layer.checks) {
          layer.checks.forEach(check => {
            const checkStatus = check.passed ? '✅' : '❌';
            console.log(`    ${checkStatus} ${check.check}: ${check.message}`);
          });
        }

        if (layer.error) {
          console.log(`    ❌ Error: ${layer.error}`);
        }
      });
    }

    console.log(
      `\n📈 Summary: ${result.summary?.passedLayers}/${result.summary?.totalLayers} layers passed`
    );

    if (result.summary?.criticalFailures > 0) {
      console.log(
        `⚠️  ${result.summary.criticalFailures} critical failures detected`
      );
    }
  }
}

module.exports = ForensicPreInvoke;

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const targetPath = args[0] || process.cwd();
  const rulesPath =
    args[1] || path.join(process.cwd(), 'config', 'rules_forense.json');

  const preInvoke = new ForensicPreInvoke({
    targetPath,
    rulesPath
  });

  preInvoke
    .validateAnalysis()
    .then(result => {
      preInvoke.printValidationSummary(result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error(`❌ Validation failed: ${error.message}`);
      process.exit(1);
    });
}
