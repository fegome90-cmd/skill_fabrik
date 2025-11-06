import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// Ensure daemon CWD (schemas path)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
process.chdir(resolve(__dirname, '..'));

process.env.DAEMON_JWT_SECRET = 'dev-secret';

const { createApp } = await import('../dist/app.js');
const app = await createApp();

await test('JWT token endpoint issues token and /activate accepts it', async () => {
  const t = await app.inject({ method: 'POST', url: '/api/v1/auth/token', payload: { sub: 'tester', expiresIn: 300 } });
  assert.equal(t.statusCode, 200);
  const { token } = t.json();
  assert.ok(typeof token === 'string' && token.length > 10);

  const act = await app.inject({ method: 'POST', url: '/activate', headers: { authorization: `Bearer ${token}` }, payload: { intent: 'lint', context: { workingDirectory: '.' }, options: { threshold: 0.4 } } });
  assert.equal(act.statusCode, 200);
});

await app.close();
