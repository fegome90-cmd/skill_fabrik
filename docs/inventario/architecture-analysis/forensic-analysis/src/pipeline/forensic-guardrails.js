#!/usr/bin/env node

/**
 * Forensic Guardrails
 * Inspired by router's guardrails.ts
 * Implements safety mechanisms and compliance validation for forensic analysis
 */

const fs = require('fs');
const path = require('path');
const { PerformanceCache } = require('../utils/performance-cache');

class ForensicGuardrails {
  constructor(options = {}) {
    this.cache =
      options.cache || new PerformanceCache({ maxSize: 50, ttl: 60000 });
    this.targetPath = options.targetPath || process.cwd();
    this.rulesPath =
      options.rulesPath ||
      path.join(process.cwd(), 'config', 'rules_forense.json');
    this.guardrailResults = [];
    this.complianceLevels = {
      CRITICAL: {
        priority: 1,
        block: true,
        description: 'Critical compliance violation - analysis blocked'
      },
      HIGH: {
        priority: 2,
        block: true,
        description: 'High priority compliance issue - analysis blocked'
      },
      MEDIUM: {
        priority: 3,
        block: false,
        description: 'Medium priority compliance issue - warning only'
      },
      LOW: {
        priority: 4,
        block: false,
        description: 'Low priority compliance issue - informational'
      }
    };
  }

  /**
   * Executes all guardrails validation
   * @param {Object} context - Analysis context
   * @returns {Object} - Guardrails validation results
   */
  async executeGuardrails(context = {}) {
    const startTime = Date.now();
    const guardrailId = `guardrail-${Date.now()}`;

    console.log(`🛡️  Executing Forensic Guardrails [${guardrailId}]`);

    try {
      const guardrails = [
        'integrity_guardrail',
        'safety_guardrail',
        'compliance_guardrail',
        'resource_guardrail',
        'ethical_guardrail',
        'data_privacy_guardrail',
        'forensic_standards_guardrail'
      ];

      for (const guardrail of guardrails) {
        const result = await this.executeGuardrail(guardrail, context);
        this.guardrailResults.push(result);

        // Fail fast on critical guardrail violations
        if (result.block && !result.compliant) {
          return this.createGuardrailResult(false, context, result);
        }
      }

      // Overall compliance decision
      const allCompliant = this.guardrailResults.every(
        result => result.compliant
      );
      return this.createGuardrailResult(allCompliant, context);
    } catch (error) {
      console.error(`❌ Guardrails execution failed: ${error.message}`);
      return {
        success: false,
        guardrailId,
        error: error.message,
        executionTime: Date.now() - startTime,
        complianceLevel: 'CRITICAL_VIOLATION',
        blocked: true,
        reason: 'Guardrail system failure'
      };
    }
  }

  /**
   * Executes individual guardrail
   * @param {string} guardrailName - Name of guardrail
   * @param {Object} context - Execution context
   * @returns {Object} - Guardrail execution result
   */
  async executeGuardrail(guardrailName, context) {
    const startTime = Date.now();

    try {
      console.log(`  🔒 Executing ${guardrailName}...`);

      switch (guardrailName) {
        case 'integrity_guardrail':
          return await this.checkIntegrityGuardrail(context);
        case 'safety_guardrail':
          return await this.checkSafetyGuardrail(context);
        case 'compliance_guardrail':
          return await this.checkComplianceGuardrail(context);
        case 'resource_guardrail':
          return await this.checkResourceGuardrail(context);
        case 'ethical_guardrail':
          return await this.checkEthicalGuardrail(context);
        case 'data_privacy_guardrail':
          return await this.checkDataPrivacyGuardrail(context);
        case 'forensic_standards_guardrail':
          return await this.checkForensicStandardsGuardrail(context);
        default:
          throw new Error(`Unknown guardrail: ${guardrailName}`);
      }
    } catch (error) {
      return {
        guardrail: guardrailName,
        compliant: false,
        blocked: true,
        level: 'CRITICAL',
        error: error.message,
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        violations: [
          {
            type: 'SYSTEM_ERROR',
            description: error.message,
            severity: 'CRITICAL'
          }
        ]
      };
    }
  }

  /**
   * Integrity Guardrail - Ensures analysis doesn't modify target
   * @param {Object} context - Execution context
   * @returns {Object} - Integrity guardrail result
   */
  async checkIntegrityGuardrail(context) {
    const startTime = Date.now();
    const result = {
      guardrail: 'integrity_guardrail',
      compliant: true,
      blocked: true,
      level: 'CRITICAL',
      violations: []
    };

    try {
      // Get initial state snapshot
      const snapshot = await this.createSnapshot(this.targetPath);
      result.initialSnapshot = snapshot;

      // Check for write permissions (should be read-only for analysis)
      const testWritePath = path.join(
        this.targetPath,
        '.forensic-integrity-test'
      );
      let hasWritePermission = false;

      try {
        fs.writeFileSync(testWritePath, 'integrity-test');
        fs.unlinkSync(testWritePath);
        hasWritePermission = true;

        result.violations.push({
          type: 'WRITE_PERMISSION_DETECTED',
          description:
            'Write permissions detected in target directory - risk of modification',
          severity: 'HIGH',
          recommendation: 'Set target directory to read-only mode for analysis'
        });
      } catch (error) {
        // No write permission - this is good for forensic analysis
      }

      // Check for running processes that might modify files
      const suspiciousProcesses = [
        'npm install',
        'npm run build',
        'npm run dev',
        'git add',
        'git commit',
        'webpack',
        'vite',
        'rollup'
      ];

      result.violations.push({
        type: 'PROCESS_MONITORING',
        description: 'Monitor for processes that might modify target files',
        severity: 'MEDIUM',
        recommendation:
          'Ensure no build/development processes are running during analysis'
      });

      // Check for recent file modifications (within last hour)
      const recentModifications = await this.checkRecentModifications(
        this.targetPath,
        3600000
      ); // 1 hour
      if (recentModifications.length > 0) {
        result.violations.push({
          type: 'RECENT_MODIFICATIONS',
          description: `${recentModifications.length} files modified within the last hour`,
          severity: 'MEDIUM',
          details: recentModifications.slice(0, 5), // Show first 5
          recommendation: 'Ensure target is stable before beginning analysis'
        });
      }

      result.compliant =
        result.violations.filter(v => v.severity === 'CRITICAL').length === 0;
      result.blocked = result.violations.some(
        v => v.severity === 'CRITICAL' || v.severity === 'HIGH'
      );
      result.level = result.compliant ? 'COMPLIANT' : 'VIOLATION_DETECTED';
      result.executionTime = Date.now() - startTime;
      result.timestamp = new Date().toISOString();

      return result;
    } catch (error) {
      result.compliant = false;
      result.error = error.message;
      result.executionTime = Date.now() - startTime;
      result.timestamp = new Date().toISOString();
      return result;
    }
  }

  /**
   * Safety Guardrail - Ensures safe analysis practices
   * @param {Object} context - Execution context
   * @returns {Object} - Safety guardrail result
   */
  async checkSafetyGuardrail(context) {
    const startTime = Date.now();
    const result = {
      guardrail: 'safety_guardrail',
      compliant: true,
      blocked: false,
      level: 'HIGH',
      violations: []
    };

    try {
      // Check for potentially dangerous analysis patterns
      const dangerousPatterns = [
        'eval(',
        'Function(',
        'require(',
        'import(',
        'exec(',
        'subprocess',
        'child_process'
      ];

      // Check analysis scripts for dangerous patterns
      const scriptFiles = await this.findAnalysisScripts();
      for (const script of scriptFiles) {
        try {
          const content = fs.readFileSync(script, 'utf8');
          for (const pattern of dangerousPatterns) {
            if (content.includes(pattern)) {
              result.violations.push({
                type: 'DANGEROUS_CODE_PATTERN',
                description: `Potentially dangerous code pattern '${pattern}' found in ${path.basename(script)}`,
                severity: 'HIGH',
                file: script,
                recommendation:
                  'Review and validate dynamic code execution patterns'
              });
            }
          }
        } catch (error) {
          // Skip files that can't be read
        }
      }

      // Check for external network access patterns
      const networkPatterns = [
        'http://',
        'https://',
        'fetch(',
        'axios',
        'request',
        'curl'
      ];

      result.violations.push({
        type: 'NETWORK_ACCESS_MONITORING',
        description: 'Monitor for external network access during analysis',
        severity: 'MEDIUM',
        recommendation: 'Limit network access to prevent data exfiltration'
      });

      // Check for file system access patterns
      result.violations.push({
        type: 'FILE_SYSTEM_ACCESS',
        description: 'Monitor file system access beyond target directory',
        severity: 'MEDIUM',
        recommendation: 'Restrict file system access to target directory only'
      });

      result.compliant =
        result.violations.filter(v => v.severity === 'CRITICAL').length === 0;
      result.blocked = result.violations.some(v => v.severity === 'CRITICAL');
      result.level = result.compliant ? 'COMPLIANT' : 'SAFETY_CONCERNS';
      result.executionTime = Date.now() - startTime;
      result.timestamp = new Date().toISOString();

      return result;
    } catch (error) {
      result.compliant = false;
      result.error = error.message;
      result.executionTime = Date.now() - startTime;
      result.timestamp = new Date().toISOString();
      return result;
    }
  }

  /**
   * Compliance Guardrail - Ensures compliance with forensic standards
   * @param {Object} context - Execution context
   * @returns {Object} - Compliance guardrail result
   */
  async checkComplianceGuardrail(context) {
    const startTime = Date.now();
    const result = {
      guardrail: 'compliance_guardrail',
      compliant: true,
      blocked: true,
      level: 'CRITICAL',
      violations: []
    };

    try {
      // Check if rules_forense.json exists and is valid
      if (!fs.existsSync(this.rulesPath)) {
        result.violations.push({
          type: 'MISSING_FORENSIC_RULES',
          description: 'Forensic analysis rules file not found',
          severity: 'CRITICAL',
          recommendation:
            'Create rules_forense.json with forensic analysis guidelines'
        });
      } else {
        try {
          const rulesContent = fs.readFileSync(this.rulesPath, 'utf8');
          const rules = JSON.parse(rulesContent);

          // Validate rules structure
          const requiredSections = ['maximas', 'prohibiciones', 'obligaciones'];
          const missingSections = requiredSections.filter(
            section => !rules[section]
          );

          if (missingSections.length > 0) {
            result.violations.push({
              type: 'INCOMPLETE_FORENSIC_RULES',
              description: `Missing rule sections: ${missingSections.join(', ')}`,
              severity: 'HIGH',
              recommendation:
                'Complete all required sections in rules_forense.json'
            });
          }

          // Check for clean code validation in rules
          const hasCleanCodeRules = rules.maximas && rules.maximas.clean_code;
          if (!hasCleanCodeRules) {
            result.violations.push({
              type: 'MISSING_CLEAN_CODE_RULES',
              description: 'Clean code validation rules not found',
              severity: 'HIGH',
              recommendation: 'Add clean_code maximum to rules_forense.json'
            });
          }
        } catch (parseError) {
          result.violations.push({
            type: 'INVALID_FORENSIC_RULES',
            description: `Invalid JSON in forensic rules: ${parseError.message}`,
            severity: 'CRITICAL',
            recommendation: 'Fix JSON syntax in rules_forense.json'
          });
        }
      }

      // Check for evidence collection mechanisms
      const evidenceCollectorPath = path.join(
        __dirname,
        '../scripts/validate-evidence.js'
      );
      if (!fs.existsSync(evidenceCollectorPath)) {
        result.violations.push({
          type: 'MISSING_EVIDENCE_COLLECTOR',
          description: 'Evidence validation script not found',
          severity: 'HIGH',
          recommendation: 'Implement validate-evidence.js script'
        });
      }

      // Check for report generation capability
      const reportsDir = path.join(process.cwd(), 'reports');
      if (!fs.existsSync(reportsDir)) {
        result.violations.push({
          type: 'MISSING_REPORTS_DIRECTORY',
          description: 'Reports directory not found',
          severity: 'MEDIUM',
          recommendation:
            'Create reports directory for forensic analysis output'
        });
      }

      result.compliant =
        result.violations.filter(v => v.severity === 'CRITICAL').length === 0;
      result.blocked = result.violations.some(
        v => v.severity === 'CRITICAL' || v.severity === 'HIGH'
      );
      result.level = result.compliant ? 'COMPLIANT' : 'COMPLIANCE_VIOLATIONS';
      result.executionTime = Date.now() - startTime;
      result.timestamp = new Date().toISOString();

      return result;
    } catch (error) {
      result.compliant = false;
      result.error = error.message;
      result.executionTime = Date.now() - startTime;
      result.timestamp = new Date().toISOString();
      return result;
    }
  }

  /**
   * Resource Guardrail - Ensures adequate resources for analysis
   * @param {Object} context - Execution context
   * @returns {Object} - Resource guardrail result
   */
  async checkResourceGuardrail(context) {
    const startTime = Date.now();
    const result = {
      guardrail: 'resource_guardrail',
      compliant: true,
      blocked: false,
      level: 'MEDIUM',
      violations: []
    };

    try {
      // Check memory usage
      const memoryUsage = process.memoryUsage();
      const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
      const heapTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
      const memoryUsagePercent =
        (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

      if (memoryUsagePercent > 80) {
        result.violations.push({
          type: 'HIGH_MEMORY_USAGE',
          description: `High memory usage: ${memoryUsagePercent.toFixed(1)}% (${heapUsedMB}/${heapTotalMB}MB)`,
          severity: 'MEDIUM',
          recommendation: 'Free memory or increase available memory'
        });
      }

      // Check disk space in target directory
      try {
        const targetStats = fs.statSync(this.targetPath);
        const targetSize = await this.calculateDirectorySize(this.targetPath);
        const targetSizeMB = Math.round(targetSize / 1024 / 1024);

        if (targetSizeMB > 1000) {
          // Larger than 1GB
          result.violations.push({
            type: 'LARGE_TARGET_SIZE',
            description: `Large target directory: ${targetSizeMB}MB`,
            severity: 'MEDIUM',
            recommendation: 'Consider analysis strategies for large codebases'
          });
        }
      } catch (error) {
        // Skip if can't access target
      }

      // Check for available file descriptors (Unix-like systems)
      if (process.platform !== 'win32') {
        try {
          const { execSync } = require('child_process');
          const ulimit = execSync('ulimit -n', { encoding: 'utf8' }).trim();
          const maxFiles = parseInt(ulimit);

          if (maxFiles < 1024) {
            result.violations.push({
              type: 'LOW_FILE_DESCRIPTOR_LIMIT',
              description: `Low file descriptor limit: ${maxFiles}`,
              severity: 'MEDIUM',
              recommendation:
                'Increase file descriptor limit for large analysis'
            });
          }
        } catch (error) {
          // Skip if can't check ulimit
        }
      }

      result.compliant =
        result.violations.filter(v => v.severity === 'CRITICAL').length === 0;
      result.blocked = result.violations.some(v => v.severity === 'CRITICAL');
      result.level = result.compliant ? 'COMPLIANT' : 'RESOURCE_CONCERNS';
      result.executionTime = Date.now() - startTime;
      result.timestamp = new Date().toISOString();

      return result;
    } catch (error) {
      result.compliant = false;
      result.error = error.message;
      result.executionTime = Date.now() - startTime;
      result.timestamp = new Date().toISOString();
      return result;
    }
  }

  /**
   * Ethical Guardrail - Ensures ethical analysis practices
   * @param {Object} context - Execution context
   * @returns {Object} - Ethical guardrail result
   */
  async checkEthicalGuardrail(context) {
    const startTime = Date.now();
    const result = {
      guardrail: 'ethical_guardrail',
      compliant: true,
      blocked: false,
      level: 'LOW',
      violations: []
    };

    try {
      // Check for personal data patterns in target
      const personalDataPatterns = [
        /\b\d{3}-\d{2}-\d{4}\b/, // SSN pattern
        /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/, // Credit card pattern
        /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email pattern
        /\b(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/ // Phone pattern
      ];

      const filesWithPersonalData = [];
      const allFiles = await this.getAllTextFiles(this.targetPath);

      for (const file of allFiles.slice(0, 100)) {
        // Limit to first 100 files for performance
        try {
          const content = fs.readFileSync(file, 'utf8');
          for (const pattern of personalDataPatterns) {
            if (pattern.test(content)) {
              filesWithPersonalData.push(path.basename(file));
              break;
            }
          }
        } catch (error) {
          // Skip files that can't be read
        }
      }

      if (filesWithPersonalData.length > 0) {
        result.violations.push({
          type: 'POTENTIAL_PERSONAL_DATA',
          description: `Potential personal data patterns found in ${filesWithPersonalData.length} files`,
          severity: 'HIGH',
          details: filesWithPersonalData.slice(0, 5),
          recommendation:
            'Review files for personal data and ensure compliance with privacy regulations'
        });
      }

      // Check for proprietary/confidential markers
      const confidentialityMarkers = [
        'confidential',
        'proprietary',
        'trade secret',
        'internal use only',
        'do not distribute'
      ];

      const filesWithConfidentialMarkers = [];
      for (const file of allFiles.slice(0, 50)) {
        // Limit to first 50 files
        try {
          const content = fs.readFileSync(file, 'utf8').toLowerCase();
          for (const marker of confidentialityMarkers) {
            if (content.includes(marker)) {
              filesWithConfidentialMarkers.push(path.basename(file));
              break;
            }
          }
        } catch (error) {
          // Skip files that can't be read
        }
      }

      if (filesWithConfidentialMarkers.length > 0) {
        result.violations.push({
          type: 'CONFIDENTIALITY_MARKERS',
          description: `Confidentiality markers found in ${filesWithConfidentialMarkers.length} files`,
          severity: 'MEDIUM',
          details: filesWithConfidentialMarkers.slice(0, 5),
          recommendation:
            'Ensure proper authorization for analyzing confidential materials'
        });
      }

      // Add ethical analysis guidelines
      result.violations.push({
        type: 'ETHICAL_ANALYSIS_GUIDELINES',
        description:
          'Ensure analysis respects intellectual property and privacy',
        severity: 'LOW',
        recommendation:
          'Review and comply with organizational policies on code analysis'
      });

      result.compliant =
        result.violations.filter(v => v.severity === 'CRITICAL').length === 0;
      result.blocked = result.violations.some(v => v.severity === 'CRITICAL');
      result.level = result.compliant ? 'COMPLIANT' : 'ETHICAL_CONCERNS';
      result.executionTime = Date.now() - startTime;
      result.timestamp = new Date().toISOString();

      return result;
    } catch (error) {
      result.compliant = false;
      result.error = error.message;
      result.executionTime = Date.now() - startTime;
      result.timestamp = new Date().toISOString();
      return result;
    }
  }

  /**
   * Data Privacy Guardrail - Ensures data privacy compliance
   * @param {Object} context - Execution context
   * @returns {Object} - Data privacy guardrail result
   */
  async checkDataPrivacyGuardrail(context) {
    const startTime = Date.now();
    const result = {
      guardrail: 'data_privacy_guardrail',
      compliant: true,
      blocked: false,
      level: 'MEDIUM',
      violations: []
    };

    try {
      // Check for .gitignore to ensure sensitive files are not committed
      const gitignorePath = path.join(this.targetPath, '.gitignore');
      if (!fs.existsSync(gitignorePath)) {
        result.violations.push({
          type: 'MISSING_GITIGNORE',
          description: 'No .gitignore file found',
          severity: 'MEDIUM',
          recommendation:
            'Add .gitignore to exclude sensitive files from version control'
        });
      } else {
        const gitignoreContent = fs
          .readFileSync(gitignorePath, 'utf8')
          .toLowerCase();
        const sensitiveEntries = [
          '.env',
          '.key',
          'secret',
          'password',
          'token'
        ];
        const hasSensitiveIgnores = sensitiveEntries.some(entry =>
          gitignoreContent.includes(entry)
        );

        if (!hasSensitiveIgnores) {
          result.violations.push({
            type: 'INADEQUATE_GITIGNORE',
            description: '.gitignore does not exclude common sensitive files',
            severity: 'MEDIUM',
            recommendation:
              'Add entries for .env, .key, secret, password, token files'
          });
        }
      }

      // Check for environment files that might contain sensitive data
      const envFiles = [
        '.env',
        '.env.local',
        '.env.production',
        '.env.development'
      ];
      const foundEnvFiles = envFiles.filter(env =>
        fs.existsSync(path.join(this.targetPath, env))
      );

      if (foundEnvFiles.length > 0) {
        result.violations.push({
          type: 'ENVIRONMENT_FILES_FOUND',
          description: `Environment files found: ${foundEnvFiles.join(', ')}`,
          severity: 'HIGH',
          recommendation:
            'Ensure environment files are properly secured and not committed'
        });
      }

      // Check for API keys or secrets in configuration files
      const configFiles = [
        'config.json',
        'settings.json',
        'config.js',
        'settings.js'
      ];
      for (const configFile of configFiles) {
        const configPath = path.join(this.targetPath, configFile);
        if (fs.existsSync(configPath)) {
          try {
            const content = fs.readFileSync(configPath, 'utf8');
            const secretPatterns = [
              /api[_-]?key/i,
              /secret/i,
              /password/i,
              /token/i,
              /private[_-]?key/i
            ];

            for (const pattern of secretPatterns) {
              if (pattern.test(content)) {
                result.violations.push({
                  type: 'POTENTIAL_SECRETS_IN_CONFIG',
                  description: `Potential secrets found in ${configFile}`,
                  severity: 'HIGH',
                  recommendation:
                    'Review configuration files for hardcoded secrets'
                });
                break;
              }
            }
          } catch (error) {
            // Skip files that can't be read
          }
        }
      }

      result.compliant =
        result.violations.filter(v => v.severity === 'CRITICAL').length === 0;
      result.blocked = result.violations.some(v => v.severity === 'CRITICAL');
      result.level = result.compliant ? 'COMPLIANT' : 'PRIVACY_CONCERNS';
      result.executionTime = Date.now() - startTime;
      result.timestamp = new Date().toISOString();

      return result;
    } catch (error) {
      result.compliant = false;
      result.error = error.message;
      result.executionTime = Date.now() - startTime;
      result.timestamp = new Date().toISOString();
      return result;
    }
  }

  /**
   * Forensic Standards Guardrail - Ensures compliance with forensic standards
   * @param {Object} context - Execution context
   * @returns {Object} - Forensic standards guardrail result
   */
  async checkForensicStandardsGuardrail(context) {
    const startTime = Date.now();
    const result = {
      guardrail: 'forensic_standards_guardrail',
      compliant: true,
      blocked: true,
      level: 'HIGH',
      violations: []
    };

    try {
      // Check for evidence collection methodology
      const evidenceMethods = [
        'validate-evidence.js',
        'collect-evidence.js',
        'evidence-collector.js'
      ];

      const hasEvidenceMethod = evidenceMethods.some(method =>
        fs.existsSync(path.join(__dirname, '..', 'scripts', method))
      );

      if (!hasEvidenceMethod) {
        result.violations.push({
          type: 'MISSING_EVIDENCE_METHODOLOGY',
          description: 'No evidence collection methodology found',
          severity: 'HIGH',
          recommendation: 'Implement standardized evidence collection scripts'
        });
      }

      // Check for chain of custody tracking
      result.violations.push({
        type: 'CHAIN_OF_CUSTODY',
        description:
          'Implement chain of custody tracking for forensic evidence',
        severity: 'MEDIUM',
        recommendation: 'Add evidence tracking and metadata collection'
      });

      // Check for reproducible analysis
      const analysisScripts = await this.findAnalysisScripts();
      if (analysisScripts.length === 0) {
        result.violations.push({
          type: 'NO_ANALYSIS_SCRIPTS',
          description: 'No analysis scripts found for reproducible analysis',
          severity: 'HIGH',
          recommendation: 'Create standardized analysis scripts'
        });
      }

      // Check for validation mechanisms
      const validationScripts = [
        'validate-rules.js',
        'validate-completeness.js',
        'clean-code-validation.test.js'
      ];

      const validationCount = validationScripts.filter(
        script =>
          fs.existsSync(path.join(__dirname, '..', 'scripts', script)) ||
          fs.existsSync(
            path.join(__dirname, '..', 'consolidated-tests', script)
          )
      ).length;

      if (validationCount < 2) {
        result.violations.push({
          type: 'INSUFFICIENT_VALIDATION',
          description: `Only ${validationCount} validation scripts found (need at least 2)`,
          severity: 'MEDIUM',
          recommendation: 'Implement comprehensive validation mechanisms'
        });
      }

      result.compliant =
        result.violations.filter(v => v.severity === 'CRITICAL').length === 0;
      result.blocked = result.violations.some(
        v => v.severity === 'CRITICAL' || v.severity === 'HIGH'
      );
      result.level = result.compliant
        ? 'COMPLIANT'
        : 'FORENSIC_STANDARDS_VIOLATIONS';
      result.executionTime = Date.now() - startTime;
      result.timestamp = new Date().toISOString();

      return result;
    } catch (error) {
      result.compliant = false;
      result.error = error.message;
      result.executionTime = Date.now() - startTime;
      result.timestamp = new Date().toISOString();
      return result;
    }
  }

  /**
   * Creates a snapshot of the target directory
   * @param {string} dirPath - Directory path
   * @returns {Object} - Snapshot object
   */
  async createSnapshot(dirPath) {
    const snapshot = {
      timestamp: new Date().toISOString(),
      fileCount: 0,
      directoryCount: 0,
      totalSize: 0,
      files: []
    };

    try {
      const walkDir = (dir, relativePath = '') => {
        try {
          const items = fs.readdirSync(dir);
          for (const item of items) {
            const fullPath = path.join(dir, item);
            const relativeItemPath = path.join(relativePath, item);

            try {
              const stats = fs.statSync(fullPath);
              if (stats.isDirectory()) {
                snapshot.directoryCount++;
                walkDir(fullPath, relativeItemPath);
              } else if (stats.isFile()) {
                snapshot.fileCount++;
                snapshot.totalSize += stats.size;
                snapshot.files.push({
                  path: relativeItemPath,
                  size: stats.size,
                  mtime: stats.mtime.getTime(),
                  hash: this.quickHash(fullPath)
                });
              }
            } catch (error) {
              // Skip files that can't be accessed
            }
          }
        } catch (error) {
          // Skip directories that can't be accessed
        }
      };

      walkDir(dirPath);
    } catch (error) {
      // Return partial snapshot if error occurs
    }

    return snapshot;
  }

  /**
   * Checks for recent file modifications
   * @param {string} dirPath - Directory path
   * @param {number} timeWindowMs - Time window in milliseconds
   * @returns {Array} - Array of recently modified files
   */
  async checkRecentModifications(dirPath, timeWindowMs) {
    const recentFiles = [];
    const cutoffTime = Date.now() - timeWindowMs;

    const walkDir = dir => {
      try {
        const items = fs.readdirSync(dir);
        for (const item of items) {
          const fullPath = path.join(dir, item);
          try {
            const stats = fs.statSync(fullPath);
            if (
              stats.isDirectory() &&
              !item.startsWith('.') &&
              item !== 'node_modules'
            ) {
              walkDir(fullPath);
            } else if (stats.isFile() && stats.mtime.getTime() > cutoffTime) {
              recentFiles.push({
                path: path.relative(dirPath, fullPath),
                mtime: stats.mtime,
                size: stats.size
              });
            }
          } catch (error) {
            // Skip files that can't be accessed
          }
        }
      } catch (error) {
        // Skip directories that can't be accessed
      }
    };

    walkDir(dirPath);
    return recentFiles;
  }

  /**
   * Finds analysis scripts in the project
   * @returns {Array} - Array of script file paths
   */
  async findAnalysisScripts() {
    const scriptDirs = [
      path.join(__dirname, '../scripts'),
      path.join(__dirname, '../src'),
      path.join(__dirname, '../consolidated-tests')
    ];

    const scripts = [];
    for (const dir of scriptDirs) {
      if (fs.existsSync(dir)) {
        try {
          const files = fs.readdirSync(dir);
          for (const file of files) {
            if (file.endsWith('.js') && !file.endsWith('.test.js')) {
              scripts.push(path.join(dir, file));
            }
          }
        } catch (error) {
          // Skip directories that can't be accessed
        }
      }
    }

    return scripts;
  }

  /**
   * Gets all text files from target directory
   * @param {string} dirPath - Directory path
   * @returns {Array} - Array of text file paths
   */
  async getAllTextFiles(dirPath) {
    const textExtensions = [
      '.js',
      '.ts',
      '.json',
      '.md',
      '.txt',
      '.yml',
      '.yaml',
      '.xml',
      '.csv'
    ];
    const files = [];

    const walkDir = dir => {
      try {
        const items = fs.readdirSync(dir);
        for (const item of items) {
          const fullPath = path.join(dir, item);
          try {
            const stats = fs.statSync(fullPath);
            if (
              stats.isDirectory() &&
              !item.startsWith('.') &&
              item !== 'node_modules'
            ) {
              walkDir(fullPath);
            } else if (stats.isFile()) {
              const ext = path.extname(item);
              if (textExtensions.includes(ext)) {
                files.push(fullPath);
              }
            }
          } catch (error) {
            // Skip files that can't be accessed
          }
        }
      } catch (error) {
        // Skip directories that can't be accessed
      }
    };

    walkDir(dirPath);
    return files;
  }

  /**
   * Calculates directory size
   * @param {string} dirPath - Directory path
   * @returns {number} - Total size in bytes
   */
  async calculateDirectorySize(dirPath) {
    let totalSize = 0;

    const walkDir = dir => {
      try {
        const items = fs.readdirSync(dir);
        for (const item of items) {
          const fullPath = path.join(dir, item);
          try {
            const stats = fs.statSync(fullPath);
            if (
              stats.isDirectory() &&
              !item.startsWith('.') &&
              item !== 'node_modules'
            ) {
              walkDir(fullPath);
            } else if (stats.isFile()) {
              totalSize += stats.size;
            }
          } catch (error) {
            // Skip files that can't be accessed
          }
        }
      } catch (error) {
        // Skip directories that can't be accessed
      }
    };

    walkDir(dirPath);
    return totalSize;
  }

  /**
   * Creates a quick hash of a file
   * @param {string} filePath - File path
   * @returns {string} - Quick hash
   */
  quickHash(filePath) {
    try {
      const stats = fs.statSync(filePath);
      return `${stats.size}-${stats.mtime.getTime()}`;
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Creates final guardrail result
   * @param {boolean} success - Overall success
   * @param {Object} context - Execution context
   * @param {Object} failingGuardrail - First failing guardrail
   * @returns {Object} - Final result
   */
  createGuardrailResult(success, context, failingGuardrail = null) {
    const executionTime = Date.now() - (context.startTime || Date.now());

    // Calculate overall compliance level
    const criticalViolations = this.guardrailResults.filter(
      g => g.violations && g.violations.some(v => v.severity === 'CRITICAL')
    ).length;

    const highViolations = this.guardrailResults.filter(
      g => g.violations && g.violations.some(v => v.severity === 'HIGH')
    ).length;

    let complianceLevel = 'COMPLIANT';
    if (criticalViolations > 0) complianceLevel = 'CRITICAL_VIOLATIONS';
    else if (highViolations > 0) complianceLevel = 'HIGH_VIOLATIONS';
    else if (!success) complianceLevel = 'VIOLATIONS_DETECTED';

    const result = {
      success,
      guardrailId: context.guardrailId || `guardrail-${Date.now()}`,
      executionTime,
      complianceLevel,
      timestamp: new Date().toISOString(),
      guardrailResults: this.guardrailResults,
      blocked: !success || this.guardrailResults.some(g => g.block),
      summary: {
        totalGuardrails: this.guardrailResults.length,
        compliantGuardrails: this.guardrailResults.filter(g => g.compliant)
          .length,
        violatedGuardrails: this.guardrailResults.filter(g => !g.compliant)
          .length,
        criticalViolations,
        highViolations,
        totalViolations: this.guardrailResults.reduce(
          (sum, g) => sum + (g.violations?.length || 0),
          0
        )
      }
    };

    if (!success && failingGuardrail) {
      result.reason =
        failingGuardrail.violations?.[0]?.description || 'Guardrail violation';
      result.failingGuardrail = failingGuardrail.guardrail;
      result.blockingViolation = failingGuardrail.violations?.[0];
    }

    return result;
  }

  /**
   * Prints guardrail summary
   * @param {Object} result - Guardrail result
   */
  printGuardrailSummary(result) {
    console.log('\n🛡️  Forensic Guardrails Summary');
    console.log('================================');

    console.log(`\n🎯 Compliance Level: ${result.complianceLevel}`);
    console.log(`🚫 Blocked: ${result.blocked ? 'YES' : 'NO'}`);
    console.log(`⏱️  Execution Time: ${result.executionTime}ms`);

    if (result.guardrailResults) {
      console.log('\n📋 Guardrail Results:');
      result.guardrailResults.forEach(guardrail => {
        const status = guardrail.compliant ? '✅' : '❌';
        const blocked = guardrail.block ? ' (BLOCKED)' : '';
        console.log(
          `  ${status} ${guardrail.guardrail}${blocked} - ${guardrail.executionTime}ms`
        );

        if (guardrail.violations && guardrail.violations.length > 0) {
          guardrail.violations.forEach(violation => {
            const severity = violation.severity || 'UNKNOWN';
            console.log(
              `    ⚠️  [${severity}] ${violation.type}: ${violation.description}`
            );
            if (violation.recommendation) {
              console.log(`    💡 Recommendation: ${violation.recommendation}`);
            }
          });
        }
      });
    }

    console.log(
      `\n📊 Summary: ${result.summary?.compliantGuardrails}/${result.summary?.totalGuardrails} guardrails compliant`
    );
    console.log(`🚨 Total Violations: ${result.summary?.totalViolations}`);

    if (result.summary?.criticalViolations > 0) {
      console.log(
        `🔥 Critical violations: ${result.summary.criticalViolations} (BLOCKING)`
      );
    }
    if (result.summary?.highViolations > 0) {
      console.log(`⚠️  High violations: ${result.summary.highViolations}`);
    }
  }
}

module.exports = ForensicGuardrails;

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const targetPath = args[0] || process.cwd();

  const guardrails = new ForensicGuardrails({
    targetPath
  });

  guardrails
    .executeGuardrails()
    .then(result => {
      guardrails.printGuardrailSummary(result);
      process.exit(result.success && !result.blocked ? 0 : 1);
    })
    .catch(error => {
      console.error(`❌ Guardrails failed: ${error.message}`);
      process.exit(1);
    });
}
