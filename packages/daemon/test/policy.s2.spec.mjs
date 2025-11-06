import test from 'node:test';
import assert from 'node:assert/strict';
import { execute, closeApp } from './helpers/execute.js';

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
