import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../dist/app.js';

const app = await createApp();

await test('GET /health :: basic shape and endpoints list', async () => {
  const res = await app.inject({ method: 'GET', url: '/health' });
  assert.ok(res.statusCode === 200 || res.statusCode === 503);
  const body = res.json();
  assert.equal(typeof body.status, 'string');
  assert.equal(typeof body.timestamp, 'string');
  assert.equal(typeof body.system, 'object');
  assert.equal(typeof body.endpoints, 'object');
});

await app.close();

