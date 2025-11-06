import test from 'node:test';
import assert from 'node:assert/strict';
import { stat, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { createApp } from '../dist/app.js';
import { clearChallenges } from '../dist/confirm.js';
import { makeToken } from './helpers/confirm.js';

test('Valid confirm token applies sandbox write plan', async () => {
  process.env.CONFIRM_SECRET = 'test-secret';
  process.env.CONFIRM_TEST_EXPOSE_NONCE = 'true';

  const app = await createApp();
  try {
    const preflight = await app.inject({
      method: 'POST',
      url: '/execute',
      payload: {
        skill_id: 'policy-s1',
        args: { files: [{ path: 'out/a.txt', bytes: 12 }] },
        needs: ['fs.write'],
        cwd: '.',
      },
    });
    assert.equal(preflight.statusCode, 403);
    const pre = await preflight.json();
    assert.ok(pre.challenge_id);
    assert.ok(pre.challenge_nonce);

    const token = makeToken(pre.challenge_id, pre.challenge_nonce, process.env.CONFIRM_SECRET);

    const confirm = await app.inject({
      method: 'POST',
      url: '/execute',
      payload: {
        skill_id: 'policy-s1',
        challenge_id: pre.challenge_id,
        confirm_token: token,
        needs: ['fs.write'],
        cwd: '.',
      },
    });

    assert.equal(confirm.statusCode, 200);
    const body = await confirm.json();
    const stdoutObj = JSON.parse(body.stdout);
    assert.equal(stdoutObj.write_scope, 'sandbox');
    assert.equal(Array.isArray(stdoutObj.files) ? stdoutObj.files.length : 0, 1);
    assert.ok(Array.isArray(body.rollback_plan?.files));
    const writtenPath = join('workspace', 'sandbox', 'out', 'a.txt');
    const stats = await stat(writtenPath);
    assert.equal(stats.size, 12);
  } finally {
    await app.close();
    await rm('workspace', { recursive: true, force: true }).catch(() => {});
    clearChallenges();
    delete process.env.CONFIRM_SECRET;
    delete process.env.CONFIRM_TEST_EXPOSE_NONCE;
  }
});
