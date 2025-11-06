/**
 * Snapshot Testing Utilities for Skills Fabric
 *
 * Provides utilities for creating, managing, and validating snapshots
 * of skill manifests and packages across different environments and
 * ensuring deterministic behavior.
 */

import { writeFile, readFile, ensureDir, pathExists, remove } from 'fs-extra';
import { join, resolve, relative, dirname } from 'path';
import { createHash } from 'crypto';
import { ManifestSnapshot, compareManifestSnapshots } from './manifest-validator.js';
import { SkillManifest } from '../utils/skill-packager.js';

export interface SnapshotConfig {
  snapshotsDir: string;
  updateSnapshots: boolean;
  strictMode: boolean;
  platform: string;
  nodeVersion: string;
  environment: 'test' | 'ci' | 'development';
}

export interface SnapshotFile {
  name: string;
  path: string;
  content: any;
  hash: string;
  metadata: {
    createdAt: string;
    platform: string;
    nodeVersion: string;
    testSuite: string;
    description?: string;
  };
}

export interface SnapshotTestResult {
  snapshotName: string;
  passed: boolean;
  differences: string[];
  isNew: boolean;
  isUpdated: boolean;
  snapshotFile: string;
  testFile: string;
}

/**
 * Snapshot testing manager class
 */
export class SnapshotManager {
  private config: SnapshotConfig;
  private snapshots: Map<string, SnapshotFile> = new Map();

  constructor(config: Partial<SnapshotConfig> = {}) {
    const defaultConfig: SnapshotConfig = {
      snapshotsDir: resolve(process.cwd(), 'test', '__snapshots__'),
      updateSnapshots: process.env.UPDATE_SNAPSHOTS === 'true',
      strictMode: process.env.NODE_ENV === 'ci',
      platform: process.platform,
      nodeVersion: process.version,
      environment: (process.env.NODE_ENV as any) || 'test'
    };

    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Initialize snapshot directory and load existing snapshots
   */
  async initialize(): Promise<void> {
    await ensureDir(this.config.snapshotsDir);
    await this.loadExistingSnapshots();
  }

  /**
   * Create a snapshot of a manifest with validation metadata
   */
  async createSnapshot(
    name: string,
    snapshot: ManifestSnapshot,
    options: {
      testSuite?: string;
      description?: string;
      overwrite?: boolean;
    } = {}
  ): Promise<string> {
    const { testSuite = 'default', description, overwrite = this.config.updateSnapshots } = options;

    const snapshotFile: SnapshotFile = {
      name,
      path: join(this.config.snapshotsDir, `${name}.snapshot.json`),
      content: snapshot,
      hash: this.computeSnapshotHash(snapshot),
      metadata: {
        createdAt: new Date().toISOString(),
        platform: this.config.platform,
        nodeVersion: this.config.nodeVersion,
        testSuite,
        description
      }
    };

    // Check if snapshot already exists
    if (await pathExists(snapshotFile.path) && !overwrite) {
      throw new Error(`Snapshot '${name}' already exists. Use overwrite option to update.`);
    }

    await writeFile(snapshotFile.path, JSON.stringify(snapshotFile, null, 2), 'utf-8');
    this.snapshots.set(name, snapshotFile);

    return snapshotFile.path;
  }

  /**
   * Load a snapshot from disk
   */
  async loadSnapshot(name: string): Promise<SnapshotFile | null> {
    const snapshotPath = join(this.config.snapshotsDir, `${name}.snapshot.json`);

    if (!await pathExists(snapshotPath)) {
      return null;
    }

    try {
      const content = await readFile(snapshotPath, 'utf-8');
      const snapshotFile: SnapshotFile = JSON.parse(content);

      // Validate snapshot structure
      this.validateSnapshotFile(snapshotFile);

      this.snapshots.set(name, snapshotFile);
      return snapshotFile;
    } catch (error) {
      throw new Error(`Failed to load snapshot '${name}': ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Compare a manifest snapshot against stored snapshot
   */
  async compareSnapshot(
    name: string,
    currentSnapshot: ManifestSnapshot,
    options: {
      ignoreTimestamps?: boolean;
      ignoreMetadata?: boolean;
      allowNewSnapshot?: boolean;
    } = {}
  ): Promise<SnapshotTestResult> {
    const { ignoreTimestamps = true, ignoreMetadata = true, allowNewSnapshot = false } = options;

    const storedSnapshot = await this.loadSnapshot(name);
    const isNew = !storedSnapshot;
    const isUpdated = false;

    if (isNew) {
      if (allowNewSnapshot || this.config.updateSnapshots) {
        await this.createSnapshot(name, currentSnapshot);
        return {
          snapshotName: name,
          passed: true,
          differences: [],
          isNew: true,
          isUpdated: false,
          snapshotFile: join(this.config.snapshotsDir, `${name}.snapshot.json`),
          testFile: 'current'
        };
      } else {
        return {
          snapshotName: name,
          passed: false,
          differences: ['No stored snapshot found'],
          isNew: true,
          isUpdated: false,
          snapshotFile: join(this.config.snapshotsDir, `${name}.snapshot.json`),
          testFile: 'current'
        };
      }
    }

    // Compare snapshots
    const { isConsistent, differences } = compareManifestSnapshots(
      storedSnapshot!.content,
      currentSnapshot,
      { ignoreTimestamps, ignoreMetadata }
    );

    // Update snapshot if needed and enabled
    if (!isConsistent && this.config.updateSnapshots) {
      await this.createSnapshot(name, currentSnapshot, { overwrite: true });
      return {
        snapshotName: name,
        passed: true,
        differences,
        isNew: false,
        isUpdated: true,
        snapshotFile: storedSnapshot!.path,
        testFile: 'current'
      };
    }

    return {
      snapshotName: name,
      passed: isConsistent,
      differences,
      isNew: false,
      isUpdated,
      snapshotFile: storedSnapshot!.path,
      testFile: 'current'
    };
  }

  /**
   * Load all existing snapshots from disk
   */
  private async loadExistingSnapshots(): Promise<void> {
    // Implementation would scan the snapshots directory and load all .snapshot.json files
    // For now, this is a placeholder
  }

  /**
   * Compute hash of snapshot content for integrity checking
   */
  private computeSnapshotHash(snapshot: ManifestSnapshot): string {
    const normalizedSnapshot = this.normalizeSnapshot(snapshot);
    const content = JSON.stringify(normalizedSnapshot, Object.keys(normalizedSnapshot).sort());
    return createHash('sha256').update(content).digest('hex');
  }

  /**
   * Normalize snapshot for consistent hashing
   */
  private normalizeSnapshot(snapshot: ManifestSnapshot): any {
    return {
      manifest: snapshot.manifest,
      validation: {
        isValid: snapshot.validation.isValid,
        errors: snapshot.validation.errors.sort(),
        warnings: snapshot.validation.warnings.sort()
      }
    };
  }

  /**
   * Validate snapshot file structure
   */
  private validateSnapshotFile(snapshotFile: any): void {
    const requiredFields = ['name', 'path', 'content', 'hash', 'metadata'];
    for (const field of requiredFields) {
      if (!(field in snapshotFile)) {
        throw new Error(`Snapshot file missing required field: ${field}`);
      }
    }

    if (typeof snapshotFile.content !== 'object' || !snapshotFile.content.manifest) {
      throw new Error('Snapshot file has invalid content structure');
    }
  }

  /**
   * Clean up old snapshots
   */
  async cleanup(options: { olderThan?: Date; keepCount?: number } = {}): Promise<void> {
    // Implementation would clean up old snapshots based on criteria
    // Placeholder for now
  }

  /**
   * Get all snapshot names
   */
  getSnapshotNames(): string[] {
    return Array.from(this.snapshots.keys());
  }

  /**
   * Check if snapshot exists
   */
  async hasSnapshot(name: string): Promise<boolean> {
    const snapshotPath = join(this.config.snapshotsDir, `${name}.snapshot.json`);
    return await pathExists(snapshotPath);
  }

  /**
   * Remove a snapshot
   */
  async removeSnapshot(name: string): Promise<void> {
    const snapshotPath = join(this.config.snapshotsDir, `${name}.snapshot.json`);
    if (await pathExists(snapshotPath)) {
      await remove(snapshotPath);
      this.snapshots.delete(name);
    }
  }

  /**
   * Generate snapshot report
   */
  generateReport(): string {
    const snapshotNames = this.getSnapshotNames();
    const totalSnapshots = snapshotNames.length;

    let report = `# Snapshot Testing Report\n\n`;
    report += `**Total Snapshots**: ${totalSnapshots}\n`;
    report += `**Platform**: ${this.config.platform}\n`;
    report += `**Node Version**: ${this.config.nodeVersion}\n`;
    report += `**Environment**: ${this.config.environment}\n\n`;

    if (snapshotNames.length > 0) {
      report += `## Snapshots\n\n`;
      for (const name of snapshotNames.sort()) {
        const snapshot = this.snapshots.get(name);
        if (snapshot) {
          report += `- **${name}** (${snapshot.metadata.testSuite})\n`;
          report += `  - Created: ${snapshot.metadata.createdAt}\n`;
          report += `  - Platform: ${snapshot.metadata.platform}\n`;
          if (snapshot.metadata.description) {
            report += `  - Description: ${snapshot.metadata.description}\n`;
          }
        }
      }
    }

    return report;
  }
}

/**
 * Utility function to create deterministic test snapshots
 */
export async function createDeterministicSnapshot(
  snapshotManager: SnapshotManager,
  testName: string,
  skillManifest: SkillManifest,
  packagePath: string,
  manifestPath: string,
  options: {
    testSuite?: string;
    description?: string;
  } = {}
): Promise<ManifestSnapshot> {
  const { testSuite = 'manifest-testing', description } = options;

  // Create a snapshot with normalized timestamps
  const normalizedManifest: SkillManifest = {
    ...skillManifest,
    createdAt: '2024-01-01T00:00:00.000Z' // Fixed timestamp for determinism
  };

  const snapshot: ManifestSnapshot = {
    manifest: normalizedManifest,
    metadata: {
      packagePath: resolve(packagePath),
      manifestPath: resolve(manifestPath),
      platform: process.platform,
      nodeVersion: process.version,
      createdAt: new Date().toISOString(),
      computedHash: skillManifest.hash,
      fileSize: 0, // Would be populated in real implementation
      manifestSize: JSON.stringify(normalizedManifest, null, 2).length
    },
    validation: {
      isValid: true,
      errors: [],
      warnings: [],
      metadata: {
        validationTime: 0,
        computedHash: skillManifest.hash
      }
    }
  };

  return snapshot;
}

/**
 * Utility to validate snapshot naming conventions
 */
export function validateSnapshotName(name: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!name || typeof name !== 'string') {
    errors.push('Snapshot name must be a non-empty string');
    return { isValid: false, errors };
  }

  if (name.length > 100) {
    errors.push('Snapshot name must be 100 characters or less');
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    errors.push('Snapshot name can only contain letters, numbers, hyphens, and underscores');
  }

  if (name.startsWith('-') || name.endsWith('-')) {
    errors.push('Snapshot name cannot start or end with a hyphen');
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Utility to create snapshot file paths
 */
export function getSnapshotFilePath(snapshotsDir: string, testName: string): string {
  const { isValid, errors } = validateSnapshotName(testName);
  if (!isValid) {
    throw new Error(`Invalid snapshot name: ${errors.join(', ')}`);
  }

  return join(snapshotsDir, `${testName}.snapshot.json`);
}

/**
 * Utility to read and parse snapshot files with error handling
 */
export async function readSnapshotFile(filePath: string): Promise<SnapshotFile> {
  try {
    const content = await readFile(filePath, 'utf-8');
    const snapshotFile: SnapshotFile = JSON.parse(content);

    // Validate that the file path matches the snapshot name
    const expectedName = filePath.split('/').pop()?.replace('.snapshot.json', '');
    if (expectedName && snapshotFile.name !== expectedName) {
      throw new Error(`Snapshot name mismatch: expected '${expectedName}', got '${snapshotFile.name}'`);
    }

    return snapshotFile;
  } catch (error) {
    throw new Error(`Failed to read snapshot file '${filePath}': ${error instanceof Error ? error.message : String(error)}`);
  }
}