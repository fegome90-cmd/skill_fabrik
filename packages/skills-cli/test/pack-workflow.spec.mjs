import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { runCli } from './helpers/run-cli.js';

test('pack/verify/install workflow succeeds', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'sf-pack-workflow-'));
  const outDir = path.join(tmp, 'registry');
  await fs.ensureDir(outDir);

  // Pack skill
  await runCli([
    'skills',
    'pack',
    'skills/policy-s1',
    '--out',
    outDir,
    '--manifest-version',
    '0.1.0',
  ]);

  const packagePath = path.join(outDir, 'policy-s1-0.1.0.tgz');
  const manifestPath = path.join(outDir, 'policy-s1-0.1.0.manifest.json');

  assert.ok(await fs.pathExists(packagePath), 'package file should exist');
  assert.ok(await fs.pathExists(manifestPath), 'manifest file should exist');

  // Verify package
  await runCli(['skills', 'verify', packagePath]);

  // Install package into isolated target
  const targetDir = path.join(tmp, 'install');
  await runCli([
    'skills',
    'install',
    packagePath,
    '--manifest',
    manifestPath,
    '--target',
    targetDir,
    '--force',
  ]);

  const installedSkill = path.join(targetDir, 'policy-s1', 'SKILL.md');
  assert.ok(await fs.pathExists(installedSkill), 'skill should be installed in target directory');
});

test('verify fails when hash mismatches', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'sf-pack-verify-'));
  const outDir = path.join(tmp, 'registry');
  await fs.ensureDir(outDir);

  await runCli([
    'skills',
    'pack',
    'skills/policy-s1',
    '--out',
    outDir,
    '--manifest-version',
    '0.2.0',
  ]);

  const packagePath = path.join(outDir, 'policy-s1-0.2.0.tgz');
  const manifestPath = path.join(outDir, 'policy-s1-0.2.0.manifest.json');

  const manifest = await fs.readJson(manifestPath);
  manifest.hash = manifest.hash.replace(/^./, manifest.hash[0] === 'a' ? 'b' : 'a');
  await fs.writeJson(manifestPath, manifest, { spaces: 2 });

  await assert.rejects(
    () => runCli(['skills', 'verify', packagePath, '--manifest', manifestPath]),
    /hash mismatch/i,
    'verify should throw when hash mismatches'
  );
});
