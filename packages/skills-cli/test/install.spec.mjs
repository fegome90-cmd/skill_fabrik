import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs-extra';
import path from 'node:path';
import os from 'node:os';
import { runCli } from './helpers/run-cli.js';

test('skills install writes manifest and loadSkillMeta can read it', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'sf-install-'));
  const outDir = path.join(tmp, 'registry');
  await fs.ensureDir(outDir);

  await runCli([
    'skills',
    'pack',
    'skills/policy-s1',
    '--out',
    outDir,
    '--manifest-version',
    '0.3.0',
  ]);

  const packagePath = path.join(outDir, 'policy-s1-0.3.0.tgz');
  const manifestPath = path.join(outDir, 'policy-s1-0.3.0.manifest.json');
  const targetDir = path.join(tmp, 'skills');

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

  const manifestCopy = path.join(targetDir, 'policy-s1', 'skill-manifest.json');
  assert.ok(await fs.pathExists(manifestCopy), 'installed manifest should be present');

  const originalCwd = process.cwd();
  try {
    process.chdir(tmp);
    const { loadSkillMeta } = await import('../../daemon/dist/skills.js');
    const meta = await loadSkillMeta('policy-s1');
    assert.deepEqual(meta.allowedTools, ['fs.write']);
    assert.equal(meta.scripts?.dryRun, 'node exec-scripts/plan.js');
  } finally {
    process.chdir(originalCwd);
  }
});
