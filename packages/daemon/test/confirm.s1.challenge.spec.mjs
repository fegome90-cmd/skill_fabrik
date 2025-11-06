import test from 'node:test';
import assert from 'node:assert/strict';
import { rm } from 'node:fs/promises';
import { createApp } from '../dist/app.js';
import { clearChallenges } from '../dist/confirm.js';

test('S1 write request produces challenge with write plan', async () => {
  process.env.CONFIRM_SECRET = 'test-secret';
  process.env.CONFIRM_TEST_EXPOSE_NONCE = 'true';

  const app = await createApp();
  try {
    const res = await app.inject({
      method: 'POST',
      url: '/execute',
      payload: {
        skill_id: 'policy-s1',
        args: { files: [{ path: 'out/a.txt', bytes: 10 }] },
        needs: ['fs.write'],
        cwd: '.',
      },
    });

    assert.equal(res.statusCode, 403);
    const body = await res.json();
    assert.equal(body.requireConfirm, true);
    assert.equal(body.policy_level, 'S1');
    assert.ok(typeof body.challenge_id === 'string' && body.challenge_id.length > 0);
    assert.ok(Array.isArray(body.write_plan?.files));
    assert.ok(body.write_plan.files.length > 0);
  } finally {
    await app.close();
    await rm('workspace', { recursive: true, force: true }).catch(() => {});
    clearChallenges();
    delete process.env.CONFIRM_SECRET;
    delete process.env.CONFIRM_TEST_EXPOSE_NONCE;
  }
});
