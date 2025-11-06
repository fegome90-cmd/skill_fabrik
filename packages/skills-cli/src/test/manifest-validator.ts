/**
 * Manifest Validator Utilities for Snapshot Testing
 *
 * Provides comprehensive validation for skill manifests including:
 * - Schema validation against expected structure
 * - Hash computation verification
 * - Cross-platform consistency checks
 * - Version compatibility validation
 * - Error handling for malformed manifests
 */

import { createHash } from 'crypto';
import { readFile, statSync } from 'fs-extra';
import { resolve } from 'path';
import { SkillManifest } from '../utils/skill-packager.js';

export interface ManifestValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata: {
    computedHash?: string;
    fileSize?: number;
    manifestSize?: number;
    validationTime: number;
  };
}

export interface SnapshotValidationOptions {
  strictMode?: boolean;
  allowExtraFields?: boolean;
  validateHash?: boolean;
  validateTimestamps?: boolean;
  platform?: 'darwin' | 'linux' | 'win32' | 'all';
}

export interface ManifestSnapshot {
  manifest: SkillManifest;
  metadata: {
    packagePath: string;
    manifestPath: string;
    platform: string;
    nodeVersion: string;
    createdAt: string;
    computedHash: string;
    fileSize: number;
    manifestSize: number;
  };
  validation: ManifestValidationResult;
}

/**
 * Validates a skill manifest against the expected schema and business rules
 */
export async function validateManifest(
  manifest: any,
  options: SnapshotValidationOptions = {}
): Promise<ManifestValidationResult> {
  const startTime = Date.now();
  const {
    strictMode = true,
    allowExtraFields = false,
    validateHash = true,
    validateTimestamps = false,
    platform = process.platform as any
  } = options;

  const errors: string[] = [];
  const warnings: string[] = [];
  const metadata: any = {};

  // Basic structure validation
  if (!manifest || typeof manifest !== 'object') {
    errors.push('Manifest must be an object');
    return {
      isValid: false,
      errors,
      warnings,
      metadata: { validationTime: Date.now() - startTime }
    };
  }

  // Required fields validation
  const requiredFields = ['id', 'version', 'name', 'allowed-tools', 'hash', 'createdAt'];
  for (const field of requiredFields) {
    if (!(field in manifest)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Field type validation
  if (manifest.id && (typeof manifest.id !== 'string' || manifest.id.trim().length === 0)) {
    errors.push('id must be a non-empty string');
  }

  if (manifest.version && typeof manifest.version !== 'string') {
    errors.push('version must be a string');
  } else if (manifest.version && !/^\d+\.\d+\.\d+(-[a-zA-Z0-9-]+)?(\+[a-zA-Z0-9-]+)?$/.test(manifest.version)) {
    errors.push('version must follow semver format (MAJOR.MINOR.PATCH[-PRERELEASE][+BUILD])');
  }

  if (manifest.name && (typeof manifest.name !== 'string' || manifest.name.trim().length === 0)) {
    errors.push('name must be a non-empty string');
  }

  if (manifest['allowed-tools'] && !Array.isArray(manifest['allowed-tools'])) {
    errors.push('allowed-tools must be an array');
  } else if (manifest['allowed-tools']) {
    for (const [index, tool] of manifest['allowed-tools'].entries()) {
      if (typeof tool !== 'string') {
        errors.push(`allowed-tools[${index}] must be a string`);
      }
    }
  }

  // Hash validation
  if (manifest.hash) {
    if (typeof manifest.hash !== 'string') {
      errors.push('hash must be a string');
    } else if (!/^[a-f0-9]{64}$/.test(manifest.hash)) {
      errors.push('hash must be a 64-character lowercase hex string (SHA-256)');
    }
    metadata.computedHash = manifest.hash;
  }

  // Timestamp validation
  if (manifest.createdAt) {
    if (typeof manifest.createdAt !== 'string') {
      errors.push('createdAt must be a string');
    } else {
      const timestamp = Date.parse(manifest.createdAt);
      if (Number.isNaN(timestamp)) {
        errors.push('createdAt must be a valid ISO 8601 timestamp');
      } else if (validateTimestamps) {
        const now = Date.now();
        const diff = Math.abs(now - timestamp);
        if (diff > 60000) { // 1 minute tolerance
          warnings.push(`createdAt timestamp is ${(diff / 1000).toFixed(1)}s old`);
        }
      }
    }
  }

  // Scripts validation
  if (manifest.scripts) {
    if (typeof manifest.scripts !== 'object' || Array.isArray(manifest.scripts)) {
      errors.push('scripts must be an object when provided');
    } else {
      const allowedScriptKeys = ['run', 'dry-run'];
      for (const [key, value] of Object.entries(manifest.scripts)) {
        if (!allowedScriptKeys.includes(key)) {
          if (!allowExtraFields) {
            errors.push(`scripts contains unexpected property: ${key}`);
          } else {
            warnings.push(`scripts contains unexpected property: ${key}`);
          }
        }
        if (value && typeof value !== 'string') {
          errors.push(`scripts.${key} must be a string`);
        }
      }
    }
  }

  // Additional fields validation
  const allowedFields = new Set([
    'id', 'version', 'name', 'allowed-tools', 'scripts', 'hash', 'createdAt'
  ]);

  if (!allowExtraFields) {
    for (const key of Object.keys(manifest)) {
      if (!allowedFields.has(key)) {
        errors.push(`Unexpected property: ${key}`);
      }
    }
  } else {
    for (const key of Object.keys(manifest)) {
      if (!allowedFields.has(key)) {
        warnings.push(`Additional property detected: ${key}`);
      }
    }
  }

  // Platform-specific validations
  if (platform !== 'all') {
    // Add platform-specific checks if needed
    if (platform === 'win32' && manifest.id && /[<>:"/\\|?*]/.test(manifest.id)) {
      errors.push('id contains invalid characters for Windows platform');
    }
  }

  const isValid = errors.length === 0 && (!strictMode || warnings.length === 0);

  return {
    isValid,
    errors,
    warnings,
    metadata: {
      ...metadata,
      validationTime: Date.now() - startTime
    }
  };
}

/**
 * Validates that a package file hash matches the manifest hash
 */
export async function validatePackageHash(
  packagePath: string,
  manifest: SkillManifest
): Promise<{ isValid: boolean; error?: string; computedHash: string }> {
  try {
    const fileBuffer = await readFile(packagePath);
    const computedHash = createHash('sha256').update(fileBuffer).digest('hex');

    if (computedHash !== manifest.hash) {
      return {
        isValid: false,
        error: `Hash mismatch: expected ${manifest.hash}, got ${computedHash}`,
        computedHash
      };
    }

    return { isValid: true, computedHash };
  } catch (error) {
    throw new Error(`Failed to validate package hash: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Creates a comprehensive snapshot of a manifest and its validation
 */
export async function createManifestSnapshot(
  packagePath: string,
  manifestPath: string,
  options: SnapshotValidationOptions = {}
): Promise<ManifestSnapshot> {
  const manifest = await readFile(manifestPath, 'utf-8').then(JSON.parse);
  const packageStats = statSync(packagePath);
  const manifestStats = statSync(manifestPath);

  const validation = await validateManifest(manifest, options);
  const { computedHash } = await validatePackageHash(packagePath, manifest);

  return {
    manifest,
    metadata: {
      packagePath: resolve(packagePath),
      manifestPath: resolve(manifestPath),
      platform: process.platform,
      nodeVersion: process.version,
      createdAt: new Date().toISOString(),
      computedHash,
      fileSize: packageStats.size,
      manifestSize: manifestStats.size
    },
    validation
  };
}

/**
 * Compares two manifest snapshots for consistency
 */
export function compareManifestSnapshots(
  snapshot1: ManifestSnapshot,
  snapshot2: ManifestSnapshot,
  options: { ignoreTimestamps?: boolean; ignoreMetadata?: boolean } = {}
): { isConsistent: boolean; differences: string[] } {
  const { ignoreTimestamps = true, ignoreMetadata = true } = options;
  const differences: string[] = [];

  // Compare manifest content (excluding timestamp if requested)
  const manifest1 = { ...snapshot1.manifest } as any;
  const manifest2 = { ...snapshot2.manifest } as any;

  if (ignoreTimestamps) {
    delete manifest1.createdAt;
    delete manifest2.createdAt;
  }

  const manifestDiff = compareObjects(manifest1, manifest2);
  if (manifestDiff.length > 0) {
    differences.push(...manifestDiff.map(diff => `Manifest: ${diff}`));
  }

  // Compare validation results
  if (snapshot1.validation.isValid !== snapshot2.validation.isValid) {
    differences.push(`Validation status differs: ${snapshot1.validation.isValid} vs ${snapshot2.validation.isValid}`);
  }

  if (snapshot1.validation.errors.length !== snapshot2.validation.errors.length) {
    differences.push(`Error count differs: ${snapshot1.validation.errors.length} vs ${snapshot2.validation.errors.length}`);
  }

  // Compare metadata (if not ignored)
  if (!ignoreMetadata) {
    if (snapshot1.metadata.platform !== snapshot2.metadata.platform) {
      differences.push(`Platform differs: ${snapshot1.metadata.platform} vs ${snapshot2.metadata.platform}`);
    }

    if (snapshot1.metadata.computedHash !== snapshot2.metadata.computedHash) {
      differences.push(`Computed hash differs: ${snapshot1.metadata.computedHash} vs ${snapshot2.metadata.computedHash}`);
    }
  }

  return {
    isConsistent: differences.length === 0,
    differences
  };
}

/**
 * Deep comparison utility for objects
 */
function compareObjects(obj1: any, obj2: any, path = ''): string[] {
  const differences: string[] = [];

  const keys1 = Object.keys(obj1).sort();
  const keys2 = Object.keys(obj2).sort();

  const allKeys = new Set([...keys1, ...keys2]);

  for (const key of allKeys) {
    const currentPath = path ? `${path}.${key}` : key;

    if (!(key in obj1)) {
      differences.push(`Missing key in first object: ${currentPath}`);
      continue;
    }

    if (!(key in obj2)) {
      differences.push(`Missing key in second object: ${currentPath}`);
      continue;
    }

    const val1 = obj1[key];
    const val2 = obj2[key];

    if (typeof val1 !== typeof val2) {
      differences.push(`Type mismatch at ${currentPath}: ${typeof val1} vs ${typeof val2}`);
      continue;
    }

    if (val1 === null && val2 === null) {
      continue;
    }

    if (val1 === undefined && val2 === undefined) {
      continue;
    }

    if (Array.isArray(val1) && Array.isArray(val2)) {
      if (val1.length !== val2.length) {
        differences.push(`Array length mismatch at ${currentPath}: ${val1.length} vs ${val2.length}`);
      } else {
        for (let i = 0; i < val1.length; i++) {
          if (val1[i] !== val2[i]) {
            differences.push(`Array element mismatch at ${currentPath}[${i}]: ${JSON.stringify(val1[i])} vs ${JSON.stringify(val2[i])}`);
          }
        }
      }
      continue;
    }

    if (typeof val1 === 'object' && typeof val2 === 'object') {
      differences.push(...compareObjects(val1, val2, currentPath));
      continue;
    }

    if (val1 !== val2) {
      differences.push(`Value mismatch at ${currentPath}: ${JSON.stringify(val1)} vs ${JSON.stringify(val2)}`);
    }
  }

  return differences;
}

/**
 * Validates manifest version compatibility
 */
export function validateVersionCompatibility(manifest: SkillManifest): {
  isCompatible: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check version format - support pre-release versions like 1.2.3-alpha.1
  const versionRegex = /^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?(?:\+[a-zA-Z0-9.-]+)?$/;
  if (!versionRegex.test(manifest.version)) {
    errors.push('Version does not follow semver format');
  }

  // Parse version - support pre-release versions like 1.2.3-alpha.1
  // Use a simple regex that just extracts the numeric parts
  const versionMatch = manifest.version.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (versionMatch) {
    const [, major, minor, patch] = versionMatch;
    const majorNum = Number(major);
    const minorNum = Number(minor);
    const patchNum = Number(patch);

    // Version compatibility rules
    if (majorNum === 0) {
      // 0.x.x versions are pre-release
      warnings.push('0.x.x versions are considered experimental');
    } else if (majorNum >= 1) {
      // Stable versions
      if (patchNum === 0) {
        // Major/minor releases
        warnings.push(`Version ${manifest.version} is a feature release - ensure compatibility`);
      }
    }

    // Check for suspicious version numbers
    if (majorNum > 99 || minorNum > 99 || patchNum > 99) {
      warnings.push('Version numbers above 99 are unusual');
    }
  }

  return {
    isCompatible: errors.length === 0,
    errors,
    warnings
  };
}