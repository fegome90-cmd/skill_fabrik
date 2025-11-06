import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, rmSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const CLI = ['packages/skills-cli/dist/index.js', 'skills', 'pack', 'skills/repo-auditor', '--out', '.registry'];

function runPack() {
  execFileSync('node', CLI, { stdio: 'inherit' });
  const manifestFile =
    readdirSync('.registry').find(file => file.endsWith('.manifest.json')) ??
    (() => {
      throw new Error('Manifest file not generated');
    })();
  const manifest = JSON.parse(readFileSync(join('.registry', manifestFile), 'utf8'));
  return manifest.hash;
}

test('skills pack generates deterministic archives', () => {
  rmSync('.registry', { recursive: true, force: true });
  const hashA = runPack();
  const hashB = runPack();
  assert.equal(hashA, hashB, 'Packaging must be deterministic (hash mismatch)');
});
