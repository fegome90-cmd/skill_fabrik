import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs-extra';
import path from 'node:path';
import os from 'node:os';
import { runCli } from './helpers/run-cli.js';

test('skills verify fails when hash mismatches', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'sf-verify-'));
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
