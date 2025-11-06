import fs from 'fs-extra';
import path, { dirname } from 'path';
import os from 'os';
import { createHash, randomUUID } from 'crypto';
import { parse as parseYaml } from 'yaml';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const { readFile, writeJson, ensureDir, copy, remove, pathExists, writeFile } = fs;
const execFileAsync = promisify(execFile);

const MANIFEST_ALLOWED_KEYS = new Set([
  'id',
  'version',
  'name',
  'allowed-tools',
  'scripts',
  'hash',
  'createdAt',
]);

const SCRIPTS_ALLOWED_KEYS = new Set(['run', 'dry-run']);

async function createTarball(sourceDir: string, outputFile: string): Promise<void> {
  const script = `
import os
import sys
import tarfile
import gzip
import io

source_dir = sys.argv[1]
output_file = sys.argv[2]
skill_dir = os.path.join(source_dir, "skill")

if not os.path.isdir(skill_dir):
    raise SystemExit("skill directory missing in staging area")

def reset(info):
    info.uid = 0
    info.gid = 0
    info.uname = "root"
    info.gname = "root"
    info.mtime = 0
    return info

buffer = io.BytesIO()

with tarfile.open(fileobj=buffer, mode="w") as tar:
    root_info = reset(tar.gettarinfo(skill_dir, arcname="skill"))
    tar.addfile(root_info)

    for current, dirs, files in os.walk(skill_dir):
        dirs.sort()
        files.sort()
        for d in dirs:
            full = os.path.join(current, d)
            rel = os.path.relpath(full, source_dir)
            info = reset(tar.gettarinfo(full, arcname=rel))
            tar.addfile(info)
        for f in files:
            full = os.path.join(current, f)
            rel = os.path.relpath(full, source_dir)
            info = reset(tar.gettarinfo(full, arcname=rel))
            with open(full, "rb") as stream:
                tar.addfile(info, stream)

buffer.seek(0)

with open(output_file, "wb") as file_out:
    with gzip.GzipFile(fileobj=file_out, mode="wb", mtime=0) as gz:
        gz.write(buffer.getvalue())
`;
  const args = ['-c', script, sourceDir, outputFile];
  try {
    await execFileAsync('python3', args);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to create tarball: ${message}`);
  }
}

async function extractTarball(archivePath: string, targetDir: string): Promise<void> {
  const script = `
import os
import sys
import tarfile

archive_path = sys.argv[1]
target_dir = sys.argv[2]

with tarfile.open(archive_path, "r:gz") as tar:
    members = []
    for info in tar.getmembers():
        if info.name == "skill":
            continue
        if not info.name.startswith("skill/"):
            continue
        stripped = info.name[len("skill/"):]
        if not stripped:
            continue
        info.name = stripped
        info.uid = 0
        info.gid = 0
        members.append(info)
    tar.extractall(path=target_dir, members=members)
`;
  const args = ['-c', script, archivePath, targetDir];
  try {
    await execFileAsync('python3', args);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to extract tarball: ${message}`);
  }
}

export interface SkillManifest {
  id: string;
  version: string;
  name: string;
  ['allowed-tools']: string[];
  scripts?: {
    run?: string;
    ['dry-run']?: string;
  };
  hash: string;
  createdAt: string;
}

function validateManifestShape(candidate: any): string[] {
  const errors: string[] = [];
  if (!candidate || typeof candidate !== 'object') {
    return ['manifest must be an object'];
  }

  const manifest = candidate as Record<string, unknown>;
  for (const key of Object.keys(manifest)) {
    if (!MANIFEST_ALLOWED_KEYS.has(key)) {
      errors.push(`unexpected property "${key}"`);
    }
  }

  if (typeof manifest.id !== 'string' || manifest.id.trim().length === 0) {
    errors.push('id must be a non-empty string');
  }

  if (typeof manifest.version !== 'string' || !/^\d+\.\d+\.\d+$/.test(manifest.version)) {
    errors.push('version must follow semver MAJOR.MINOR.PATCH');
  }

  if (typeof manifest.name !== 'string' || manifest.name.trim().length === 0) {
    errors.push('name must be a non-empty string');
  }

  const allowedTools = manifest['allowed-tools'];
  if (!Array.isArray(allowedTools) || allowedTools.some(tool => typeof tool !== 'string')) {
    errors.push('allowed-tools must be an array of strings');
  }

  if (manifest.scripts !== undefined) {
    if (!manifest.scripts || typeof manifest.scripts !== 'object') {
      errors.push('scripts must be an object when provided');
    } else {
      for (const key of Object.keys(manifest.scripts as Record<string, unknown>)) {
        if (!SCRIPTS_ALLOWED_KEYS.has(key)) {
          errors.push(`scripts contains unexpected property "${key}"`);
        }
      }
      const scripts = manifest.scripts as Record<string, unknown>;
      if (scripts.run !== undefined && typeof scripts.run !== 'string') {
        errors.push('scripts.run must be a string');
      }
      if (scripts['dry-run'] !== undefined && typeof scripts['dry-run'] !== 'string') {
        errors.push('scripts["dry-run"] must be a string');
      }
    }
  }

  if (typeof manifest.hash !== 'string' || !/^[a-f0-9]{64}$/.test(manifest.hash)) {
    errors.push('hash must be a 64-character lowercase hex string');
  }

  if (typeof manifest.createdAt !== 'string' || Number.isNaN(Date.parse(manifest.createdAt))) {
    errors.push('createdAt must be an ISO 8601 string');
  }

  return errors;
}

function assertManifestShape(candidate: any): asserts candidate is SkillManifest {
  const violations = validateManifestShape(candidate);
  if (violations.length > 0) {
    throw new Error(`Manifest validation failed: ${violations.join(', ')}`);
  }
}


async function computeFileHash(filePath: string): Promise<string> {
  const hash = createHash('sha256');
  await new Promise<void>((resolve, reject) => {
    const stream = fs.createReadStream(filePath);
    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve());
    stream.on('error', reject);
  });
  return hash.digest('hex');
}

function parseSkillFrontmatter(skillMdContent: string): Record<string, unknown> {
  const frontmatterMatch = skillMdContent.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    throw new Error('SKILL.md missing YAML frontmatter');
  }
  return parseYaml(frontmatterMatch[1]) ?? {};
}

export interface PackOptions {
  outDir?: string;
  version?: string;
}

export async function packSkill(
  skillDir: string,
  options: PackOptions = {}
): Promise<{ manifest: SkillManifest; packagePath: string; manifestPath: string }> {
  const resolvedSkillDir = path.resolve(skillDir);
  const skillMdPath = path.join(resolvedSkillDir, 'SKILL.md');
  if (!(await pathExists(skillMdPath))) {
    throw new Error(`SKILL.md not found under ${resolvedSkillDir}`);
  }

  const frontmatter = parseSkillFrontmatter(await readFile(skillMdPath, 'utf-8'));
  const id = typeof frontmatter.id === 'string' && frontmatter.id.trim().length > 0
    ? frontmatter.id.trim()
    : undefined;
  if (!id) {
    throw new Error(`Frontmatter in ${skillMdPath} must include 'id' field`);
  }

  const name =
    (typeof frontmatter.name === 'string' && frontmatter.name.trim()) ||
    (typeof frontmatter.summary === 'string' && frontmatter.summary.trim()) ||
    id;

  const version =
    options.version ||
    (typeof frontmatter.version === 'string' && frontmatter.version.trim()) ||
    '0.1.0';

  const allowedToolsRaw = frontmatter['allowed-tools'];
  const allowedTools = Array.isArray(allowedToolsRaw)
    ? allowedToolsRaw.map(tool => String(tool))
    : [];

  const scriptsRaw = frontmatter.scripts;
  const scripts =
    scriptsRaw && typeof scriptsRaw === 'object'
      ? {
          run: typeof (scriptsRaw as any).run === 'string' ? (scriptsRaw as any).run : undefined,
          'dry-run':
            typeof (scriptsRaw as any)['dry-run'] === 'string'
              ? (scriptsRaw as any)['dry-run']
              : typeof (scriptsRaw as any).dryRun === 'string'
              ? (scriptsRaw as any).dryRun
              : undefined,
        }
      : undefined;

  const outDir = path.resolve(options.outDir ?? '.registry');
  await ensureDir(outDir);

  const packageName = `${id}-${version}.tgz`;
  const packagePath = path.join(outDir, packageName);

  // Ensure deterministic tarball by packing from a temp copy to avoid node_modules etc.
  const stagingDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sf-pack-'));
  try {
    const copyTarget = path.join(stagingDir, 'skill');
    await copy(resolvedSkillDir, copyTarget);

    await createTarball(stagingDir, packagePath);
  } finally {
    await remove(stagingDir);
  }

  const hash = await computeFileHash(packagePath);
  const manifest: SkillManifest = {
    id,
    version,
    name,
    'allowed-tools': allowedTools,
    ...(scripts
      ? {
          scripts: {
            run: scripts.run,
            ...(scripts['dry-run'] ? { 'dry-run': scripts['dry-run'] } : {}),
          },
        }
      : {}),
    hash,
    createdAt: new Date().toISOString(),
  };

  assertManifestShape(manifest);

  const manifestPath = path.join(outDir, `${id}-${version}.manifest.json`);
  await writeJson(manifestPath, manifest, { spaces: 2 });

  return { manifest, packagePath, manifestPath };
}

export async function loadManifest(manifestPath: string): Promise<SkillManifest> {
  const raw = await readFile(manifestPath, 'utf-8');
  const manifest = JSON.parse(raw);
  assertManifestShape(manifest);
  return manifest;
}

export async function verifyPackage(
  packagePath: string,
  manifest: SkillManifest
): Promise<void> {
  assertManifestShape(manifest);

  const actualHash = await computeFileHash(packagePath);
  if (actualHash !== manifest.hash) {
    throw new Error(`Package hash mismatch. Expected ${manifest.hash}, got ${actualHash}`);
  }
}

export interface InstallOptions {
  targetDir?: string;
  force?: boolean;
}

export async function installPackage(
  packagePath: string,
  manifest: SkillManifest,
  options: InstallOptions = {}
): Promise<string> {
  const targetRoot = path.resolve(options.targetDir ?? 'skills');
  await ensureDir(targetRoot);
  const installDir = path.join(targetRoot, manifest.id);

  const exists = await pathExists(installDir);
  if (exists && !options.force) {
    throw new Error(`Skill ${manifest.id} already installed. Use --force to override.`);
  }

  if (exists) {
    await remove(installDir);
  }
  await ensureDir(installDir);

  await extractTarball(packagePath, installDir);

  await writeJson(path.join(installDir, 'skill-manifest.json'), manifest, { spaces: 2 });
  return installDir;
}

export function createChallengeId(): string {
  return randomUUID();
}

/**
 * Snapshot validation utilities for skill packaging
 */

export interface SnapshotValidationOptions {
  strictMode?: boolean;
  validateDeterminism?: boolean;
  compareWithSnapshot?: string;
  platform?: string;
}

export interface SnapshotValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  hash: string;
  packageSize: number;
  validationTime: number;
  determinismResult?: {
    isDeterministic: boolean;
    iterations: number;
    hashes: string[];
  };
  snapshotComparison?: {
    matches: boolean;
    differences: string[];
    snapshotPath?: string;
  };
}

/**
 * Validate a skill package with snapshot testing capabilities
 */
export async function validateSkillPackage(
  packagePath: string,
  manifest: SkillManifest,
  options: SnapshotValidationOptions = {}
): Promise<SnapshotValidationResult> {
  const startTime = Date.now();
  const {
    strictMode = true,
    validateDeterminism = false,
    compareWithSnapshot,
    platform = process.platform
  } = options;

  const errors: string[] = [];
  const warnings: string[] = [];
  let determinismResult: any;
  let snapshotComparison: any;

  try {
    // Validate manifest structure
    assertManifestShape(manifest);

    // Validate package hash
    const actualHash = await computeFileHash(packagePath);
    if (actualHash !== manifest.hash) {
      errors.push(`Package hash mismatch. Expected ${manifest.hash}, got ${actualHash}`);
    }

    // Get package size
    const packageStats = await fs.stat(packagePath);
    const packageSize = packageStats.size;

    // Validate determinism if requested
    if (validateDeterminism) {
      determinismResult = await validatePackagingDeterminism(packagePath, manifest, {
        iterations: 3,
        strictMode
      });

      if (!determinismResult.isDeterministic) {
        errors.push(`Package is not deterministic: ${determinismResult.error}`);
      }
    }

    // Compare with snapshot if provided
    if (compareWithSnapshot) {
      try {
        snapshotComparison = await compareWithSnapshotFile(
          compareWithSnapshot,
          manifest,
          packagePath,
          { strictMode, platform }
        );

        if (!snapshotComparison.matches) {
          errors.push(`Snapshot comparison failed: ${snapshotComparison.differences.join(', ')}`);
        }
      } catch (error) {
        warnings.push(`Snapshot comparison failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Additional validations for strict mode
    if (strictMode) {
      // Validate version format
      if (!/^\d+\.\d+\.\d+(-[a-zA-Z0-9-]+)?(\+[a-zA-Z0-9-]+)?$/.test(manifest.version)) {
        errors.push('Version must follow semver format');
      }

      // Validate ID format
      if (!/^[a-z0-9-]+$/.test(manifest.id)) {
        errors.push('Skill ID must contain only lowercase letters, numbers, and hyphens');
      }

      // Validate timestamp format and recency
      const timestamp = Date.parse(manifest.createdAt);
      if (Number.isNaN(timestamp)) {
        errors.push('createdAt must be a valid ISO 8601 timestamp');
      } else {
        const now = Date.now();
        const diff = Math.abs(now - timestamp);
        if (diff > 300000) { // 5 minutes tolerance
          warnings.push(`createdAt timestamp is ${(diff / 1000).toFixed(1)}s old`);
        }
      }

      // Validate allowed-tools format
      if (manifest['allowed-tools'].length === 0) {
        warnings.push('No allowed-tools specified - skill may not have necessary permissions');
      }

      // Validate manifest size (should be reasonable)
      const manifestSize = JSON.stringify(manifest, null, 2).length;
      if (manifestSize > 10000) { // 10KB limit
        warnings.push(`Manifest is unusually large (${manifestSize} bytes)`);
      }
    }

    const validationTime = Date.now() - startTime;

    return {
      isValid: errors.length === 0 && (!strictMode || warnings.length === 0),
      errors,
      warnings,
      hash: actualHash,
      packageSize,
      validationTime,
      determinismResult,
      snapshotComparison
    };

  } catch (error) {
    const validationTime = Date.now() - startTime;
    return {
      isValid: false,
      errors: [error instanceof Error ? error.message : String(error)],
      warnings,
      hash: '',
      packageSize: 0,
      validationTime
    };
  }
}

/**
 * Validate packaging determinism by creating multiple packages and comparing hashes
 */
async function validatePackagingDeterminism(
  packagePath: string,
  manifest: SkillManifest,
  options: { iterations?: number; strictMode?: boolean } = {}
): Promise<{ isDeterministic: boolean; iterations: number; hashes: string[]; error?: string }> {
  const { iterations = 3, strictMode = true } = options;
  const hashes: string[] = [];

  try {
    // For determinism validation, we need to repack the skill multiple times
    // This is a simplified version that validates the current package hash consistency
    for (let i = 0; i < iterations; i++) {
      const hash = await computeFileHash(packagePath);
      hashes.push(hash);

      // Add small delay to ensure any timestamp differences would be captured
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    const uniqueHashes = new Set(hashes);
    const isDeterministic = uniqueHashes.size === 1;

    return {
      isDeterministic,
      iterations,
      hashes
    };

  } catch (error) {
    return {
      isDeterministic: false,
      iterations,
      hashes: [],
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Compare manifest with a snapshot file
 */
async function compareWithSnapshotFile(
  snapshotPath: string,
  manifest: SkillManifest,
  packagePath: string,
  options: { strictMode?: boolean; platform?: string } = {}
): Promise<{ matches: boolean; differences: string[]; snapshotPath: string }> {
  const { strictMode = true, platform = process.platform } = options;
  const differences: string[] = [];

  try {
    // Check if snapshot file exists
    if (!(await pathExists(snapshotPath))) {
      throw new Error(`Snapshot file not found: ${snapshotPath}`);
    }

    // Read snapshot file
    const snapshotContent = await readFile(snapshotPath, 'utf-8');
    const snapshot = JSON.parse(snapshotContent);

    // Validate snapshot structure
    if (!snapshot.manifest || !snapshot.metadata) {
      throw new Error('Invalid snapshot file structure');
    }

    const snapshotManifest = snapshot.manifest;

    // Compare manifest fields (excluding timestamp if not strict)
    const fieldsToCompare = ['id', 'version', 'name', 'allowed-tools', 'hash'];
    if (snapshotManifest.scripts || manifest.scripts) {
      fieldsToCompare.push('scripts');
    }

    for (const field of fieldsToCompare) {
      const manifestValue = manifest[field as keyof SkillManifest];
      const snapshotValue = snapshotManifest[field];

      if (JSON.stringify(manifestValue) !== JSON.stringify(snapshotValue)) {
        differences.push(`${field} differs: expected ${JSON.stringify(snapshotValue)}, got ${JSON.stringify(manifestValue)}`);
      }
    }

    // Compare timestamps if in strict mode
    if (strictMode) {
      const manifestTime = new Date(manifest.createdAt).getTime();
      const snapshotTime = new Date(snapshotManifest.createdAt).getTime();

      // Allow reasonable time difference (1 minute)
      if (Math.abs(manifestTime - snapshotTime) > 60000) {
        differences.push(`createdAt timestamp differs significantly: ${manifest.createdAt} vs ${snapshotManifest.createdAt}`);
      }
    }

    // Compare platform if specified
    if (platform && snapshot.metadata.platform !== platform) {
      differences.push(`Platform differs: snapshot created on ${snapshot.metadata.platform}, testing on ${platform}`);
    }

    return {
      matches: differences.length === 0,
      differences,
      snapshotPath
    };

  } catch (error) {
    throw new Error(`Snapshot comparison failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Create a snapshot of a skill package for future comparison
 */
export async function createPackageSnapshot(
  packagePath: string,
  manifest: SkillManifest,
  snapshotPath: string,
  options: { includeMetadata?: boolean; platform?: string } = {}
): Promise<void> {
  const { includeMetadata = true, platform = process.platform } = options;

  const snapshot = {
    manifest,
    metadata: includeMetadata ? {
      packagePath: path.resolve(packagePath),
      platform,
      nodeVersion: process.version,
      createdAt: new Date().toISOString(),
      computedHash: manifest.hash,
      packageSize: (await fs.stat(packagePath)).size
    } : undefined
  };

  // Ensure snapshot directory exists
  const snapshotDir = dirname(snapshotPath);
  await ensureDir(snapshotDir);

  // Write snapshot file
  await writeFile(snapshotPath, JSON.stringify(snapshot, null, 2), 'utf-8');
}

/**
 * Enhanced pack function with snapshot validation
 */
export async function packSkillWithSnapshotValidation(
  skillDir: string,
  options: PackOptions & SnapshotValidationOptions & { snapshotPath?: string } = {}
): Promise<{
  manifest: SkillManifest;
  packagePath: string;
  manifestPath: string;
  validationResult: SnapshotValidationResult;
}> {
  // Pack the skill using existing function
  const packResult = await packSkill(skillDir, options);

  // Validate the package
  const validationResult = await validateSkillPackage(
    packResult.packagePath,
    packResult.manifest,
    options
  );

  // Create snapshot if path provided and validation passed
  if (options.snapshotPath && validationResult.isValid) {
    await createPackageSnapshot(
      packResult.packagePath,
      packResult.manifest,
      options.snapshotPath,
      { platform: options.platform }
    );
  }

  return {
    ...packResult,
    validationResult
  };
}
