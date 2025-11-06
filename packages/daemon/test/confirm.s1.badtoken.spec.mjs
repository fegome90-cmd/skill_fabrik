import test from 'node:test';
import assert from 'node:assert/strict';
import { rm } from 'node:fs/promises';
import { createApp } from '../dist/app.js';
import { clearChallenges } from '../dist/confirm.js';

test('Invalid confirm token is rejected', async () => {
  process.env.CONFIRM_SECRET = 'test-secret';
  process.env.CONFIRM_TEST_EXPOSE_NONCE = 'true';

  const app = await createApp();
  try {
    const preflight = await app.inject({
      method: 'POST',
      url: '/execute',
      payload: {
        skill_id: 'policy-s1',
        args: { files: [{ path: 'out/a.txt', bytes: 10 }] },
        needs: ['fs.write'],
        cwd: '.',
      },
    });
    const body = await preflight.json();
    assert.equal(preflight.statusCode, 403);
    assert.ok(body.challenge_id);

    const confirm = await app.inject({
      method: 'POST',
      url: '/execute',
      payload: {
        skill_id: 'policy-s1',
        challenge_id: body.challenge_id,
        confirm_token: 'invalid-token',
        needs: ['fs.write'],
        cwd: '.',
      },
    });

    assert.equal(confirm.statusCode, 401);
    const confirmBody = await confirm.json();
    assert.equal(confirmBody.error, 'invalid_confirm_token');
  } finally {
    await app.close();
    await rm('workspace', { recursive: true, force: true }).catch(() => {});
    clearChallenges();
    delete process.env.CONFIRM_SECRET;
    delete process.env.CONFIRM_TEST_EXPOSE_NONCE;
  }
});
