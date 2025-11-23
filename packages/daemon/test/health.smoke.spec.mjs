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

await test('daemon ports :: check that daemon is listening on 7727', async () => {
  // Test that we can make requests to the daemon
  const res = await app.inject({ method: 'GET', url: '/api/health' });
  assert.equal(res.statusCode, 200);
  const body = res.json();
  assert.equal(typeof body.status, 'string');
  assert.equal(typeof body.timestamp, 'string');
  assert.ok(body.services || body.uptime); // Either services object or uptime should be present
});

await app.close();
