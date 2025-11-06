import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../../dist/app.js';

const app = await createApp();

await test('app.close() shuts down cleanly', async () => {
  // Inject a request first to ensure routes are registered
  const health = await app.inject({ method: 'GET', url: '/health' });
  assert.ok([200, 503].includes(health.statusCode));
  await app.close();
});

