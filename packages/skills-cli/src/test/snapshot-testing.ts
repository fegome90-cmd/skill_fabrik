/**
 * Comprehensive Snapshot Testing Suite for Skills Fabric
 *
 * Provides a complete testing framework for validating manifest.json
 * files and ensuring package consistency across different environments.
 *
 * Features:
 * - Manifest structure validation
 * - Hash computation consistency
 * - Cross-platform compatibility
 * - Deterministic packaging verification
 * - Error handling for malformed manifests
 * - Version compatibility testing
 * - Integration testing for pack/verify workflow
 */

import { readFile, writeFile, ensureDir, remove, copy, pathExists } from 'fs-extra';
import { join, resolve, relative, dirname } from 'path';
import { createHash } from 'crypto';
import { packSkill, verifyPackage, SkillManifest } from '../utils/skill-packager.js';
import { validateManifest, validatePackageHash, createManifestSnapshot, validateVersionCompatibility } from './manifest-validator.js';
import { SnapshotManager, createDeterministicSnapshot, validateSnapshotName } from './snapshot-utils.js';

export interface SnapshotTestConfig {
  testDir: string;
  snapshotsDir: string;
  fixturesDir: string;
  tempDir: string;
  updateSnapshots: boolean;
  strictMode: boolean;
  verbose: boolean;
}

export interface SnapshotTestCase {
  name: string;
  description: string;
  skillDir: string;
  expectedManifest?: Partial<SkillManifest>;
  expectFailure?: boolean;
  expectedErrors?: string[];
  platform?: string;
}

export interface SnapshotTestSuiteResult {
  suiteName: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  duration: number;
  results: SnapshotTestResult[];
  summary: string;
}

export interface SnapshotTestResult {
  testName: string;
  passed: boolean;
  skipped: boolean;
  error?: string;
  differences: string[];
  snapshotCreated: boolean;
  snapshotUpdated: boolean;
  duration: number;
  details: {
    manifest: SkillManifest;
    packagePath: string;
    manifestPath: string;
    validation: any;
  };
}

/**
 * Main snapshot testing suite class
 */
export class SnapshotTestSuite {
  private config: SnapshotTestConfig;
  private snapshotManager: SnapshotManager;
  private testCases: SnapshotTestCase[] = [];
  private results: SnapshotTestResult[] = [];

  constructor(config: Partial<SnapshotTestConfig> = {}) {
    const defaultConfig: SnapshotTestConfig = {
      testDir: resolve(process.cwd(), 'test', 'snapshot'),
      snapshotsDir: resolve(process.cwd(), 'test', '__snapshots__'),
      fixturesDir: resolve(process.cwd(), 'test', 'fixtures', 'sample-skills'),
      tempDir: resolve(process.cwd(), '.tmp', 'snapshot-testing'),
      updateSnapshots: process.env.UPDATE_SNAPSHOTS === 'true',
      strictMode: process.env.NODE_ENV === 'ci',
      verbose: process.env.VERBOSE === 'true'
    };

    this.config = { ...defaultConfig, ...config };
    this.snapshotManager = new SnapshotManager({
      snapshotsDir: this.config.snapshotsDir,
      updateSnapshots: this.config.updateSnapshots,
      strictMode: this.config.strictMode
    });
  }

  /**
   * Initialize the test suite
   */
  async initialize(): Promise<void> {
    await ensureDir(this.config.testDir);
    await ensureDir(this.config.snapshotsDir);
    await ensureDir(this.config.tempDir);
    await this.snapshotManager.initialize();

    // Load built-in test cases
    await this.loadBuiltinTestCases();
  }

  /**
   * Add a custom test case
   */
  addTestCase(testCase: SnapshotTestCase): void {
    this.testCases.push(testCase);
  }

  /**
   * Run all test cases
   */
  async runTestSuite(): Promise<SnapshotTestSuiteResult> {
    const startTime = Date.now();
    this.results = [];

    if (this.config.verbose) {
      console.log(`\n🧪 Running Snapshot Test Suite with ${this.testCases.length} tests\n`);
    }

    for (const testCase of this.testCases) {
      const result = await this.runSingleTest(testCase);
      this.results.push(result);

      if (this.config.verbose) {
        const status = result.passed ? '✅' : result.skipped ? '⏭️' : '❌';
        console.log(`${status} ${result.testName} (${result.duration}ms)`);
        if (result.error) {
          console.log(`   Error: ${result.error}`);
        }
        if (result.differences.length > 0) {
          console.log(`   Differences: ${result.differences.length}`);
        }
      }
    }

    const duration = Date.now() - startTime;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = this.results.filter(r => !r.passed && !r.skipped).length;
    const skippedTests = this.results.filter(r => r.skipped).length;

    const summary = `Snapshot Test Suite completed: ${passedTests}/${this.results.length} passed, ${failedTests} failed, ${skippedTests} skipped (${duration}ms)`;

    return {
      suiteName: 'Manifest Snapshot Testing',
      totalTests: this.testCases.length,
      passedTests,
      failedTests,
      skippedTests,
      duration,
      results: this.results,
      summary
    };
  }

  /**
   * Run a single test case
   */
  private async runSingleTest(testCase: SnapshotTestCase): Promise<SnapshotTestResult> {
    const startTime = Date.now();
    const result: SnapshotTestResult = {
      testName: testCase.name,
      passed: false,
      skipped: false,
      differences: [],
      snapshotCreated: false,
      snapshotUpdated: false,
      duration: 0,
      details: {
        manifest: {} as SkillManifest,
        packagePath: '',
        manifestPath: '',
        validation: {}
      }
    };

    try {
      // Skip test if platform doesn't match
      if (testCase.platform && testCase.platform !== process.platform) {
        result.skipped = true;
        result.passed = true;
        result.duration = Date.now() - startTime;
        return result;
      }

      // Validate test case name
      const nameValidation = validateSnapshotName(testCase.name);
      if (!nameValidation.isValid) {
        throw new Error(`Invalid test case name: ${nameValidation.errors.join(', ')}`);
      }

      // Check if skill directory exists
      if (!(await pathExists(testCase.skillDir))) {
        throw new Error(`Skill directory not found: ${testCase.skillDir}`);
      }

      // Create temporary output directory
      const tempOutputDir = join(this.config.tempDir, testCase.name);
      await ensureDir(tempOutputDir);

      // Pack the skill
      const packResult = await packSkill(testCase.skillDir, {
        outDir: tempOutputDir,
        version: testCase.expectedManifest?.version
      });

      result.details = {
        manifest: packResult.manifest,
        packagePath: packResult.packagePath,
        manifestPath: packResult.manifestPath,
        validation: {}
      };

      // Validate manifest structure
      const manifestValidation = await validateManifest(packResult.manifest, {
        strictMode: this.config.strictMode,
        validateHash: true
      });

      result.details.validation = manifestValidation;

      // Check for expected failures
      if (testCase.expectFailure) {
        if (manifestValidation.isValid) {
          throw new Error('Expected test to fail but manifest validation passed');
        }
        if (testCase.expectedErrors) {
          for (const expectedError of testCase.expectedErrors) {
            if (!manifestValidation.errors.some(error => error.includes(expectedError))) {
              throw new Error(`Expected error not found: ${expectedError}`);
            }
          }
        }
        result.passed = true;
      } else {
        // Test should pass
        if (!manifestValidation.isValid) {
          throw new Error(`Manifest validation failed: ${manifestValidation.errors.join(', ')}`);
        }

        // Validate package hash
        const hashValidation = await validatePackageHash(packResult.packagePath, packResult.manifest);
        if (!hashValidation.isValid) {
          throw new Error(`Package hash validation failed: ${hashValidation.error}`);
        }

        // Compare with snapshot
        const snapshotName = `manifest-${testCase.name}`;
        const currentSnapshot = await createManifestSnapshot(
          packResult.packagePath,
          packResult.manifestPath,
          { strictMode: this.config.strictMode }
        );

        const snapshotResult = await this.snapshotManager.compareSnapshot(
          snapshotName,
          currentSnapshot,
          {
            ignoreTimestamps: true,
            ignoreMetadata: false,
            allowNewSnapshot: this.config.updateSnapshots
          }
        );

        result.differences = snapshotResult.differences;
        result.snapshotCreated = snapshotResult.isNew;
        result.snapshotUpdated = snapshotResult.isUpdated;
        result.passed = snapshotResult.passed;

        // Validate version compatibility
        const versionCompatibility = validateVersionCompatibility(packResult.manifest);
        if (!versionCompatibility.isCompatible) {
          throw new Error(`Version compatibility check failed: ${versionCompatibility.errors.join(', ')}`);
        }
      }

    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error);
      result.passed = false;
    } finally {
      result.duration = Date.now() - startTime;
    }

    return result;
  }

  /**
   * Load built-in test cases
   */
  private async loadBuiltinTestCases(): Promise<void> {
    const builtInCases: SnapshotTestCase[] = [
      {
        name: 'basic-skill-manifest',
        description: 'Test basic skill manifest structure and validation',
        skillDir: join(this.config.fixturesDir, 'basic-skill'),
        expectedManifest: {
          id: 'basic-skill',
          version: '1.0.0',
          name: 'Basic Skill'
        }
      },
      {
        name: 'skill-with-scripts',
        description: 'Test skill manifest with scripts configuration',
        skillDir: join(this.config.fixturesDir, 'skill-with-scripts'),
        expectedManifest: {
          id: 'skill-with-scripts',
          version: '1.0.0',
          name: 'Skill with Scripts'
        }
      },
      {
        name: 'skill-with-allowed-tools',
        description: 'Test skill manifest with allowed-tools configuration',
        skillDir: join(this.config.fixturesDir, 'skill-with-tools'),
        expectedManifest: {
          id: 'skill-with-tools',
          version: '1.0.0',
          name: 'Skill with Tools',
          'allowed-tools': ['fs.read', 'fs.write']
        }
      },
      {
        name: 'minimal-skill',
        description: 'Test minimal valid skill manifest',
        skillDir: join(this.config.fixturesDir, 'minimal-skill'),
        expectedManifest: {
          id: 'minimal-skill',
          version: '0.1.0',
          name: 'Minimal Skill'
        }
      },
      {
        name: 'complex-skill',
        description: 'Test complex skill with all features',
        skillDir: join(this.config.fixturesDir, 'complex-skill'),
        expectedManifest: {
          id: 'complex-skill',
          version: '2.1.0',
          name: 'Complex Skill with All Features'
        }
      },
      {
        name: 'malformed-manifest',
        description: 'Test handling of malformed manifests',
        skillDir: join(this.config.fixturesDir, 'malformed-skill'),
        expectFailure: true,
        expectedErrors: ['Missing required field']
      },
      {
        name: 'invalid-version',
        description: 'Test invalid version format handling',
        skillDir: join(this.config.fixturesDir, 'invalid-version'),
        expectFailure: true,
        expectedErrors: ['version must follow semver format']
      },
      {
        name: 'invalid-hash',
        description: 'Test invalid hash format handling',
        skillDir: join(this.config.fixturesDir, 'invalid-hash'),
        expectFailure: true,
        expectedErrors: ['hash must be a 64-character lowercase hex string']
      }
    ];

    // Filter out test cases for which fixtures don't exist
    for (const testCase of builtInCases) {
      if (await pathExists(testCase.skillDir)) {
        this.testCases.push(testCase);
      } else if (this.config.verbose) {
        console.log(`⚠️  Skipping test case '${testCase.name}' - fixture not found: ${testCase.skillDir}`);
      }
    }
  }

  /**
   * Generate detailed test report
   */
  generateReport(): string {
    let report = `# Snapshot Testing Report\n\n`;
    report += `**Configuration:**\n`;
    report += `- Test Directory: ${this.config.testDir}\n`;
    report += `- Snapshots Directory: ${this.config.snapshotsDir}\n`;
    report += `- Fixtures Directory: ${this.config.fixturesDir}\n`;
    report += `- Strict Mode: ${this.config.strictMode}\n`;
    report += `- Update Snapshots: ${this.config.updateSnapshots}\n\n`;

    report += `## Test Results Summary\n\n`;
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = this.results.filter(r => !r.passed && !r.skipped).length;
    const skippedTests = this.results.filter(r => r.skipped).length;

    report += `- **Total Tests:** ${totalTests}\n`;
    report += `- **Passed:** ${passedTests}\n`;
    report += `- **Failed:** ${failedTests}\n`;
    report += `- **Skipped:** ${skippedTests}\n`;
    report += `- **Success Rate:** ${((passedTests / totalTests) * 100).toFixed(1)}%\n\n`;

    if (failedTests > 0) {
      report += `## Failed Tests\n\n`;
      for (const result of this.results.filter(r => !r.passed && !r.skipped)) {
        report += `### ${result.testName}\n`;
        report += `- **Error:** ${result.error}\n`;
        report += `- **Duration:** ${result.duration}ms\n`;
        if (result.differences.length > 0) {
          report += `- **Differences:**\n`;
          for (const diff of result.differences) {
            report += `  - ${diff}\n`;
          }
        }
        report += '\n';
      }
    }

    if (this.results.some(r => r.snapshotCreated || r.snapshotUpdated)) {
      report += `## Snapshot Changes\n\n`;
      for (const result of this.results.filter(r => r.snapshotCreated || r.snapshotUpdated)) {
        report += `### ${result.testName}\n`;
        if (result.snapshotCreated) {
          report += `- **Status:** New snapshot created\n`;
        }
        if (result.snapshotUpdated) {
          report += `- **Status:** Snapshot updated\n`;
        }
        report += '\n';
      }
    }

    return report;
  }

  /**
   * Clean up temporary files
   */
  async cleanup(): Promise<void> {
    try {
      await remove(this.config.tempDir);
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  /**
   * Get test configuration
   */
  getConfig(): SnapshotTestConfig {
    return { ...this.config };
  }

  /**
   * Update test configuration
   */
  updateConfig(updates: Partial<SnapshotTestConfig>): void {
    this.config = { ...this.config, ...updates };
    this.snapshotManager = new SnapshotManager({
      snapshotsDir: this.config.snapshotsDir,
      updateSnapshots: this.config.updateSnapshots,
      strictMode: this.config.strictMode
    });
  }
}

/**
 * Utility function to run snapshot tests with default configuration
 */
export async function runSnapshotTests(options: {
  testDir?: string;
  fixturesDir?: string;
  updateSnapshots?: boolean;
  strictMode?: boolean;
  verbose?: boolean;
} = {}): Promise<SnapshotTestSuiteResult> {
  const testSuite = new SnapshotTestSuite(options);
  await testSuite.initialize();

  try {
    const result = await testSuite.runTestSuite();

    if (options.verbose) {
      console.log(`\n${result.summary}\n`);
      console.log(testSuite.generateReport());
    }

    return result;
  } finally {
    await testSuite.cleanup();
  }
}

/**
 * Utility to validate determinism across multiple runs
 */
export async function validatePackagingDeterminism(
  skillDir: string,
  iterations: number = 3
): Promise<{ isDeterministic: boolean; hashes: string[]; errors: string[] }> {
  const hashes: string[] = [];
  const errors: string[] = [];

  for (let i = 0; i < iterations; i++) {
    try {
      const tempDir = join(process.cwd(), '.tmp', `determinism-test-${i}`);
      await ensureDir(tempDir);

      const result = await packSkill(skillDir, { outDir: tempDir });
      hashes.push(result.manifest.hash);

      await remove(tempDir);
    } catch (error) {
      errors.push(`Iteration ${i + 1}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const uniqueHashes = new Set(hashes);
  const isDeterministic = uniqueHashes.size <= 1 && errors.length === 0;

  return { isDeterministic, hashes, errors };
}