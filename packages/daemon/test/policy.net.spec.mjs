import test from 'node:test';
import assert from 'node:assert/strict';
import { execute, closeApp } from './helpers/execute.js';

test('policy NET denies network operations', async () => {
  const { status, body } = await execute('policy-net', ['net.request']);
  assert.equal(status, 403);
  assert.equal(body.policy_level, 'NET');
  assert.equal(body.error, 'operation_denied');
  assert.ok(Array.isArray(body.denied) && body.denied.includes('net.request'));
  assert.equal(body.requireConfirm, false);
});

test.after(async () => {
  await closeApp();
});
