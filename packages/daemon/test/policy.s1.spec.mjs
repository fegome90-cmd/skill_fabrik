import test from 'node:test';
import assert from 'node:assert/strict';
import { execute, closeApp } from './helpers/execute.js';

test('policy S1 challenge response includes challenge_id', async () => {
  const { status, body } = await execute('policy-s1', ['fs.write']);
  assert.equal(status, 403);
  assert.equal(body.policy_level, 'S1');
  assert.equal(body.error, 'challenge_required');
  assert.equal(body.requireConfirm, true);
  assert.ok(typeof body.challenge_id === 'string' && body.challenge_id.length > 0);
  assert.deepEqual(body.denied, []);
});

test.after(async () => {
  await closeApp();
});
