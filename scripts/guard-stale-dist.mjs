#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const PACKAGES = ['packages/daemon', 'packages/skills-cli'];
const SRC_EXTENSIONS = new Set(['.ts', '.mts', '.cts', '.mjs', '.cjs', '.json', '.md', '.yaml', '.yml']);

function walk(dir, files = []) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name.startsWith('.')) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
    } else if (SRC_EXTENSIONS.has(extname(full))) {
      files.push(full);
    }
  }
  return files;
}

function newestMtime(paths) {
  return paths.reduce((acc, file) => Math.max(acc, statSync(file).mtimeMs), 0);
}

function hashFiles(paths) {
  const hash = createHash('sha256');
  for (const file of paths.sort()) {
    hash.update(readFileSync(file));
  }
  return hash.digest('hex');
}

const stale = [];
const fingerprints = [];

for (const pkg of PACKAGES) {
  const srcDir = join(pkg, 'src');
  let srcFiles;
  try {
    srcFiles = walk(srcDir);
  } catch {
    continue;
  }
  if (srcFiles.length === 0) continue;

  const distDir = join(pkg, 'dist');
  let distMtime = 0;
  try {
    distMtime = statSync(distDir).mtimeMs;
  } catch {
    distMtime = 0;
  }

  const latestSrc = newestMtime(srcFiles);
  if (latestSrc > distMtime) {
    stale.push(pkg);
    continue;
  }

  fingerprints.push(`${pkg}:${hashFiles(srcFiles)}`);
}

if (stale.length > 0) {
  console.error(`Stale dist detected in: ${stale.join(', ')}`);
  console.error('Fix: pnpm build:all (or pnpm clean && pnpm -w build)');
  process.exit(2);
}

if (fingerprints.length > 0) {
  console.log(`fingerprint:${fingerprints.join('|')}`);
}

