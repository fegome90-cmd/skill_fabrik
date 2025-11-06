import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../dist/app.js';

// Force API key requirement for this test
process.env.DAEMON_API_KEY = 'secret-key';

const app = await createApp();

await test('POST /activate requires API key when configured', async () => {
  const payload = { intent: 'lint', context: { workingDirectory: '.' } };
  const resNoKey = await app.inject({ method: 'POST', url: '/activate', payload });
  assert.equal(resNoKey.statusCode, 401);

  const resWithKey = await app.inject({ method: 'POST', url: '/activate', headers: { 'x-api-key': 'secret-key' }, payload });
  assert.notEqual(resWithKey.statusCode, 401);
});

await app.close();
