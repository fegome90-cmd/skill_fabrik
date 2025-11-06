import test from 'node:test';
import assert from 'node:assert/strict';
import { execute, closeApp } from './helpers/execute.js';

test('policy S1 requires challenge', async () => {
  const { status, body } = await execute('policy-s1', ['fs.write']);
  assert.equal(status, 403);
  assert.equal(body.policy_level, 'S1');
  assert.equal(body.error, 'challenge_required');
  assert.ok(typeof body.challenge_id === 'string' && body.challenge_id.length > 0);
  assert.equal(body.requireConfirm, true);
  assert.deepEqual(body.denied, []);
});

test('policy S2 denies destructive operations', async () => {
  const { status, body } = await execute('policy-s2', ['fs.rm']);
  assert.equal(status, 403);
  assert.equal(body.policy_level, 'S2');
  assert.equal(body.error, 'operation_denied');
  assert.ok(Array.isArray(body.denied) && body.denied.includes('fs.rm'));
  assert.equal(body.requireConfirm, false);
});

test.after(async () => {
  await closeApp();
});

test('policy NET denies network operations', async () => {
  const { status, body } = await execute('policy-net', ['net.request']);
  assert.equal(status, 403);
  assert.equal(body.policy_level, 'NET');
  assert.equal(body.error, 'operation_denied');
  assert.ok(Array.isArray(body.denied) && body.denied.includes('net.request'));
  assert.equal(body.requireConfirm, false);
});
