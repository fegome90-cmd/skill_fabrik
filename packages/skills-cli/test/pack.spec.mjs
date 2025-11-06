import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs-extra';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { runCli } from './helpers/run-cli.js';

test('skills pack generates manifest with sha256 hash', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'sf-pack-'));
  const outDir = path.join(tmp, 'registry');
  await fs.ensureDir(outDir);

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

  const manifest = await fs.readJson(manifestPath);
  assert.equal(manifest.id, 'policy-s1');
  assert.equal(manifest.version, '0.1.0');
  assert.deepEqual(manifest['allowed-tools'], ['fs.write']);

  const hash = createHash('sha256');
  hash.update(await fs.readFile(packagePath));
  assert.equal(manifest.hash, hash.digest('hex'), 'manifest hash must match package content');
});
