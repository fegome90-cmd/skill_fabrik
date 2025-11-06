/**
 * Jest Test Specifications for Snapshot Testing
 *
 * Comprehensive test suite for manifest.json snapshot validation,
 * ensuring package consistency and deterministic behavior across
 * different environments and platforms.
 */

import { resolve, join } from 'path';
import { ensureDir, remove, writeFile, pathExists } from 'fs-extra';
import { validateManifest, validatePackageHash, validateVersionCompatibility } from '../src/test/manifest-validator.js';
import { SnapshotManager, validateSnapshotName } from '../src/test/snapshot-utils.js';
import { SnapshotTestSuite, runSnapshotTests, validatePackagingDeterminism } from '../src/test/snapshot-testing.js';
import { packSkill, SkillManifest } from '../src/utils/skill-packager.js';

describe('Snapshot Testing Suite', () => {
  const testDir = resolve(process.cwd(), '.tmp', 'jest-snapshot-tests');
  const snapshotsDir = join(testDir, '__snapshots__');
  const fixturesDir = join(testDir, 'fixtures');
  const tempDir = join(testDir, 'temp');

  beforeAll(async () => {
    await ensureDir(testDir);
    await ensureDir(snapshotsDir);
    await ensureDir(fixturesDir);
    await ensureDir(tempDir);
  });

  afterAll(async () => {
    await remove(testDir);
  });

  describe('Manifest Validation', () => {
    test('should validate a correct manifest structure', async () => {
      const validManifest: SkillManifest = {
        id: 'test-skill',
        version: '1.0.0',
        name: 'Test Skill',
        'allowed-tools': ['fs.read', 'fs.write'],
        hash: 'a'.repeat(64),
        createdAt: '2024-01-01T00:00:00.000Z'
      };

      const result = await validateManifest(validManifest);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject manifest with missing required fields', async () => {
      const invalidManifest = {
        id: 'test-skill',
        version: '1.0.0'
        // Missing name, allowed-tools, hash, createdAt
      };

      const result = await validateManifest(invalidManifest);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors).toContain('Missing required field: name');
      expect(result.errors).toContain('Missing required field: allowed-tools');
      expect(result.errors).toContain('Missing required field: hash');
      expect(result.errors).toContain('Missing required field: createdAt');
    });

    test('should reject manifest with invalid version format', async () => {
      const invalidManifest: Partial<SkillManifest> = {
        id: 'test-skill',
        version: 'invalid-version',
        name: 'Test Skill',
        'allowed-tools': ['fs.read'],
        hash: 'a'.repeat(64),
        createdAt: '2024-01-01T00:00:00.000Z'
      };

      const result = await validateManifest(invalidManifest);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('version must follow semver format'))).toBe(true);
    });

    test('should reject manifest with invalid hash format', async () => {
      const invalidManifest: Partial<SkillManifest> = {
        id: 'test-skill',
        version: '1.0.0',
        name: 'Test Skill',
        'allowed-tools': ['fs.read'],
        hash: 'invalid-hash',
        createdAt: '2024-01-01T00:00:00.000Z'
      };

      const result = await validateManifest(invalidManifest);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('hash must be a 64-character lowercase hex string'))).toBe(true);
    });

    test('should reject manifest with invalid timestamp', async () => {
      const invalidManifest: Partial<SkillManifest> = {
        id: 'test-skill',
        version: '1.0.0',
        name: 'Test Skill',
        'allowed-tools': ['fs.read'],
        hash: 'a'.repeat(64),
        createdAt: 'invalid-timestamp'
      };

      const result = await validateManifest(invalidManifest);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('createdAt must be a valid ISO 8601 timestamp');
    });

    test('should validate manifest with scripts', async () => {
      const manifestWithScripts: SkillManifest = {
        id: 'test-skill',
        version: '1.0.0',
        name: 'Test Skill',
        'allowed-tools': ['fs.read'],
        scripts: {
          run: 'node index.js',
          'dry-run': 'node index.js --dry-run'
        },
        hash: 'a'.repeat(64),
        createdAt: '2024-01-01T00:00:00.000Z'
      };

      const result = await validateManifest(manifestWithScripts);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject manifest with invalid scripts', async () => {
      const manifestWithInvalidScripts = {
        id: 'test-skill',
        version: '1.0.0',
        name: 'Test Skill',
        'allowed-tools': ['fs.read'],
        scripts: {
          run: 'node index.js',
          'invalid-script': 'should not be here'
        },
        hash: 'a'.repeat(64),
        createdAt: '2024-01-01T00:00:00.000Z'
      };

      const result = await validateManifest(manifestWithInvalidScripts);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('scripts contains unexpected property: invalid-script');
    });
  });

  describe('Version Compatibility', () => {
    test('should validate standard semver versions', () => {
      const manifest: SkillManifest = {
        id: 'test-skill',
        version: '1.2.3',
        name: 'Test Skill',
        'allowed-tools': ['fs.read'],
        hash: 'a'.repeat(64),
        createdAt: '2024-01-01T00:00:00.000Z'
      };

      const result = validateVersionCompatibility(manifest);
      expect(result.isCompatible).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should validate pre-release versions', () => {
      const manifest: SkillManifest = {
        id: 'test-skill',
        version: '1.2.3-alpha.1',
        name: 'Test Skill',
        'allowed-tools': ['fs.read'],
        hash: 'a'.repeat(64),
        createdAt: '2024-01-01T00:00:00.000Z'
      };

      const result = validateVersionCompatibility(manifest);
      expect(result.isCompatible).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    test('should warn about experimental versions', () => {
      const manifest: SkillManifest = {
        id: 'test-skill',
        version: '0.1.0',
        name: 'Test Skill',
        'allowed-tools': ['fs.read'],
        hash: 'a'.repeat(64),
        createdAt: '2024-01-01T00:00:00.000Z'
      };

      const result = validateVersionCompatibility(manifest);
      expect(result.isCompatible).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    test('should reject invalid version formats', () => {
      const manifest: SkillManifest = {
        id: 'test-skill',
        version: 'not-a-version',
        name: 'Test Skill',
        'allowed-tools': ['fs.read'],
        hash: 'a'.repeat(64),
        createdAt: '2024-01-01T00:00:00.000Z'
      };

      const result = validateVersionCompatibility(manifest);
      expect(result.isCompatible).toBe(false);
      expect(result.errors).toContain('Version does not follow semver format');
    });
  });

  describe('Snapshot Name Validation', () => {
    test('should validate correct snapshot names', () => {
      const validNames = ['test-skill', 'test_skill', 'test123', 'Test-Skill_123'];

      for (const name of validNames) {
        const result = validateSnapshotName(name);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      }
    });

    test('should reject invalid snapshot names', () => {
      const invalidNames = ['', 'test skill', 'test@skill', '-test', 'test-', 'a'.repeat(101)];

      for (const name of invalidNames) {
        const result = validateSnapshotName(name);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Snapshot Manager', () => {
    let snapshotManager: SnapshotManager;

    beforeEach(() => {
      snapshotManager = new SnapshotManager({
        snapshotsDir,
        updateSnapshots: true,
        strictMode: false
      });
    });

    test('should initialize snapshot manager', async () => {
      await expect(snapshotManager.initialize()).resolves.not.toThrow();
    });

    test('should create and load snapshots', async () => {
      await snapshotManager.initialize();

      const testManifest: SkillManifest = {
        id: 'test-snapshot',
        version: '1.0.0',
        name: 'Test Snapshot',
        'allowed-tools': ['fs.read'],
        hash: 'a'.repeat(64),
        createdAt: '2024-01-01T00:00:00.000Z'
      };

      const testSnapshot = {
        manifest: testManifest,
        metadata: {
          packagePath: '/test/package.tgz',
          manifestPath: '/test/manifest.json',
          platform: process.platform,
          nodeVersion: process.version,
          createdAt: new Date().toISOString(),
          computedHash: testManifest.hash,
          fileSize: 1000,
          manifestSize: 500
        },
        validation: {
          isValid: true,
          errors: [],
          warnings: [],
          metadata: {
            validationTime: 10,
            computedHash: testManifest.hash
          }
        }
      };

      const snapshotPath = await snapshotManager.createSnapshot('test-snapshot', testSnapshot);
      expect(await pathExists(snapshotPath)).toBe(true);

      const loadedSnapshot = await snapshotManager.loadSnapshot('test-snapshot');
      expect(loadedSnapshot).not.toBeNull();
      expect(loadedSnapshot!.content.manifest.id).toBe('test-snapshot');
    });

    test('should handle non-existent snapshots', async () => {
      await snapshotManager.initialize();
      const snapshot = await snapshotManager.loadSnapshot('non-existent');
      expect(snapshot).toBeNull();
    });

    test('should check snapshot existence', async () => {
      await snapshotManager.initialize();

      expect(await snapshotManager.hasSnapshot('non-existent')).toBe(false);

      // Create a snapshot
      const testManifest: SkillManifest = {
        id: 'test-existence',
        version: '1.0.0',
        name: 'Test Existence',
        'allowed-tools': ['fs.read'],
        hash: 'a'.repeat(64),
        createdAt: '2024-01-01T00:00:00.000Z'
      };

      await snapshotManager.createSnapshot('test-existence', {
        manifest: testManifest,
        metadata: {
          packagePath: '/test/package.tgz',
          manifestPath: '/test/manifest.json',
          platform: process.platform,
          nodeVersion: process.version,
          createdAt: new Date().toISOString(),
          computedHash: testManifest.hash,
          fileSize: 1000,
          manifestSize: 500
        },
        validation: {
          isValid: true,
          errors: [],
          warnings: [],
          metadata: {
            validationTime: 10,
            computedHash: testManifest.hash
          }
        }
      });

      expect(await snapshotManager.hasSnapshot('test-existence')).toBe(true);
    });
  });

  describe('Packaging Determinism', () => {
    let skillDir: string;

    beforeEach(async () => {
      skillDir = join(fixturesDir, 'test-skill');
      await ensureDir(skillDir);

      // Create a basic skill
      await writeFile(join(skillDir, 'SKILL.md'), `---
id: test-skill
version: 1.0.0
name: Test Skill
allowed-tools:
  - fs.read
---

# Test Skill

A test skill for determinism validation.
`);
    });

    afterEach(async () => {
      await remove(skillDir);
    });

    test('should produce deterministic packages across multiple runs', async () => {
      const result = await validatePackagingDeterminism(skillDir, 3);

      expect(result.errors).toHaveLength(0);
      expect(result.isDeterministic).toBe(true);
      expect(result.hashes).toHaveLength(3);

      // All hashes should be identical
      const uniqueHashes = new Set(result.hashes);
      expect(uniqueHashes.size).toBe(1);
    }, 30000);

    test('should handle invalid skill directory gracefully', async () => {
      const result = await validatePackagingDeterminism('/non-existent/skill', 2);

      expect(result.isDeterministic).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.hashes).toHaveLength(0);
    });
  });

  describe('Integration Tests', () => {
    let skillDir: string;

    beforeEach(async () => {
      skillDir = join(fixturesDir, 'integration-skill');
      await ensureDir(skillDir);

      // Create a comprehensive skill for integration testing
      await writeFile(join(skillDir, 'SKILL.md'), `---
id: integration-skill
version: 2.1.0
name: Integration Test Skill
summary: A comprehensive skill for integration testing
allowed-tools:
  - fs.read
  - fs.write
  - bash
scripts:
  run: node index.js
  dry-run: node index.js --dry-run
---

# Integration Test Skill

This skill is used for comprehensive integration testing of the snapshot system.
`);

      await writeFile(join(skillDir, 'index.js'), `
console.log('Integration test skill executed');
`);
    });

    afterEach(async () => {
      await remove(skillDir);
    });

    test('should pack skill and validate manifest', async () => {
      const outputDir = join(tempDir, 'integration-pack');
      await ensureDir(outputDir);

      const packResult = await packSkill(skillDir, { outDir: outputDir });

      expect(packResult.manifest.id).toBe('integration-skill');
      expect(packResult.manifest.version).toBe('2.1.0');
      expect(packResult.manifest.name).toBe('Integration Test Skill');
      expect(packResult.manifest['allowed-tools']).toEqual(['fs.read', 'fs.write', 'bash']);
      expect(packResult.manifest.scripts?.run).toBe('node index.js');
      expect(packResult.manifest.scripts?.['dry-run']).toBe('node index.js --dry-run');

      // Validate manifest structure
      const validation = await validateManifest(packResult.manifest);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);

      // Validate package hash
      const hashValidation = await validatePackageHash(packResult.packagePath, packResult.manifest);
      expect(hashValidation.isValid).toBe(true);

      // Clean up
      await remove(outputDir);
    }, 15000);

    test('should run complete snapshot test suite', async () => {
      const testSuite = new SnapshotTestSuite({
        testDir,
        snapshotsDir,
        fixturesDir,
        tempDir,
        updateSnapshots: true,
        strictMode: false,
        verbose: false
      });

      await testSuite.initialize();

      // Add our integration test as a test case
      testSuite.addTestCase({
        name: 'integration-test-skill',
        description: 'Integration test skill with all features',
        skillDir: skillDir,
        expectedManifest: {
          id: 'integration-skill',
          version: '2.1.0',
          name: 'Integration Test Skill'
        }
      });

      const result = await testSuite.runTestSuite();

      expect(result.totalTests).toBeGreaterThan(0);
      expect(result.failedTests).toBe(0);
      expect(result.summary).toContain('passed');

      await testSuite.cleanup();
    }, 30000);
  });

  describe('Error Handling', () => {
    test('should handle malformed skill files gracefully', async () => {
      const malformedSkillDir = join(fixturesDir, 'malformed-skill');
      await ensureDir(malformedSkillDir);

      // Create skill with malformed frontmatter
      await writeFile(join(malformedSkillDir, 'SKILL.md'), `---
id: malformed-skill
version: not-a-version
name: Malformed Skill
allowed-tools: not-an-array
hash: short-hash
createdAt: invalid-date
---

# Malformed Skill

This skill has malformed frontmatter.
`);

      const outputDir = join(tempDir, 'malformed-pack');
      await ensureDir(outputDir);

      await expect(packSkill(malformedSkillDir, { outDir: outputDir }))
        .rejects.toThrow();

      await remove(malformedSkillDir);
      await remove(outputDir);
    });

    test('should handle missing skill files', async () => {
      const emptySkillDir = join(fixturesDir, 'empty-skill');
      await ensureDir(emptySkillDir);

      const outputDir = join(tempDir, 'empty-pack');
      await ensureDir(outputDir);

      await expect(packSkill(emptySkillDir, { outDir: outputDir }))
        .rejects.toThrow('SKILL.md not found');

      await remove(emptySkillDir);
      await remove(outputDir);
    });
  });

  describe('Convenience Functions', () => {
    test('should run snapshot tests with default configuration', async () => {
      // This test runs the snapshot testing utility function
      // with default configuration to ensure it works correctly

      const result = await runSnapshotTests({
        fixturesDir,
        updateSnapshots: true,
        strictMode: false,
        verbose: false
      });

      expect(result).toBeDefined();
      expect(typeof result.totalTests).toBe('number');
      expect(typeof result.passedTests).toBe('number');
      expect(typeof result.failedTests).toBe('number');
      expect(typeof result.duration).toBe('number');
      expect(typeof result.summary).toBe('string');
    }, 30000);
  });
});