"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.packSkill = packSkill;
exports.loadManifest = loadManifest;
exports.verifyPackage = verifyPackage;
exports.installPackage = installPackage;
exports.createChallengeId = createChallengeId;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const crypto_1 = require("crypto");
const yaml_1 = require("yaml");
const node_child_process_1 = require("node:child_process");
const node_util_1 = require("node:util");
const { readFile, writeJson, ensureDir, copy, remove, pathExists } = fs_extra_1.default;
const execFileAsync = (0, node_util_1.promisify)(node_child_process_1.execFile);
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
async function createTarball(sourceDir, outputFile) {
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
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to create tarball: ${message}`);
    }
}
async function extractTarball(archivePath, targetDir) {
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
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to extract tarball: ${message}`);
    }
}
function validateManifestShape(candidate) {
    const errors = [];
    if (!candidate || typeof candidate !== 'object') {
        return ['manifest must be an object'];
    }
    const manifest = candidate;
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
        }
        else {
            for (const key of Object.keys(manifest.scripts)) {
                if (!SCRIPTS_ALLOWED_KEYS.has(key)) {
                    errors.push(`scripts contains unexpected property "${key}"`);
                }
            }
            const scripts = manifest.scripts;
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
function assertManifestShape(candidate) {
    const violations = validateManifestShape(candidate);
    if (violations.length > 0) {
        throw new Error(`Manifest validation failed: ${violations.join(', ')}`);
    }
}
async function computeFileHash(filePath) {
    const hash = (0, crypto_1.createHash)('sha256');
    await new Promise((resolve, reject) => {
        const stream = fs_extra_1.default.createReadStream(filePath);
        stream.on('data', chunk => hash.update(chunk));
        stream.on('end', () => resolve());
        stream.on('error', reject);
    });
    return hash.digest('hex');
}
function parseSkillFrontmatter(skillMdContent) {
    const frontmatterMatch = skillMdContent.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
        throw new Error('SKILL.md missing YAML frontmatter');
    }
    return (0, yaml_1.parse)(frontmatterMatch[1]) ?? {};
}
async function packSkill(skillDir, options = {}) {
    const resolvedSkillDir = path_1.default.resolve(skillDir);
    const skillMdPath = path_1.default.join(resolvedSkillDir, 'SKILL.md');
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
    const name = (typeof frontmatter.name === 'string' && frontmatter.name.trim()) ||
        (typeof frontmatter.summary === 'string' && frontmatter.summary.trim()) ||
        id;
    const version = options.version ||
        (typeof frontmatter.version === 'string' && frontmatter.version.trim()) ||
        '0.1.0';
    const allowedToolsRaw = frontmatter['allowed-tools'];
    const allowedTools = Array.isArray(allowedToolsRaw)
        ? allowedToolsRaw.map(tool => String(tool))
        : [];
    const scriptsRaw = frontmatter.scripts;
    const scripts = scriptsRaw && typeof scriptsRaw === 'object'
        ? {
            run: typeof scriptsRaw.run === 'string' ? scriptsRaw.run : undefined,
            'dry-run': typeof scriptsRaw['dry-run'] === 'string'
                ? scriptsRaw['dry-run']
                : typeof scriptsRaw.dryRun === 'string'
                    ? scriptsRaw.dryRun
                    : undefined,
        }
        : undefined;
    const outDir = path_1.default.resolve(options.outDir ?? '.registry');
    await ensureDir(outDir);
    const packageName = `${id}-${version}.tgz`;
    const packagePath = path_1.default.join(outDir, packageName);
    // Ensure deterministic tarball by packing from a temp copy to avoid node_modules etc.
    const stagingDir = await fs_extra_1.default.mkdtemp(path_1.default.join(os_1.default.tmpdir(), 'sf-pack-'));
    try {
        const copyTarget = path_1.default.join(stagingDir, 'skill');
        await copy(resolvedSkillDir, copyTarget);
        await createTarball(stagingDir, packagePath);
    }
    finally {
        await remove(stagingDir);
    }
    const hash = await computeFileHash(packagePath);
    const manifest = {
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
    const manifestPath = path_1.default.join(outDir, `${id}-${version}.manifest.json`);
    await writeJson(manifestPath, manifest, { spaces: 2 });
    return { manifest, packagePath, manifestPath };
}
async function loadManifest(manifestPath) {
    const raw = await readFile(manifestPath, 'utf-8');
    const manifest = JSON.parse(raw);
    assertManifestShape(manifest);
    return manifest;
}
async function verifyPackage(packagePath, manifest) {
    assertManifestShape(manifest);
    const actualHash = await computeFileHash(packagePath);
    if (actualHash !== manifest.hash) {
        throw new Error(`Package hash mismatch. Expected ${manifest.hash}, got ${actualHash}`);
    }
}
async function installPackage(packagePath, manifest, options = {}) {
    const targetRoot = path_1.default.resolve(options.targetDir ?? 'skills');
    await ensureDir(targetRoot);
    const installDir = path_1.default.join(targetRoot, manifest.id);
    const exists = await pathExists(installDir);
    if (exists && !options.force) {
        throw new Error(`Skill ${manifest.id} already installed. Use --force to override.`);
    }
    if (exists) {
        await remove(installDir);
    }
    await ensureDir(installDir);
    await extractTarball(packagePath, installDir);
    await writeJson(path_1.default.join(installDir, 'skill-manifest.json'), manifest, { spaces: 2 });
    return installDir;
}
function createChallengeId() {
    return (0, crypto_1.randomUUID)();
}
