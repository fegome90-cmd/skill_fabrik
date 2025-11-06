import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../../dist/app.js';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// Ensure CWD is the daemon package so schema paths resolve
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
process.chdir(resolve(__dirname, '..', '..'));
import { DaemonClient } from '../../dist/client/daemon-client.js';

const app = await createApp();

function injectTransport(app) {
  return async (path, body, headers) => {
    const res = await app.inject({ method: 'POST', url: path, payload: body, headers });
    const text = res.body.toString();
    let json; try { json = JSON.parse(text); } catch { json = { raw: text }; }
    return { ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, json };
  };
}

await test('DaemonClient.activate works against in-memory app via transport', async () => {
  const client = new DaemonClient({ baseURL: 'http://daemon.local', transport: injectTransport(app) });
  const res = await client.activate({ intent: 'lint repo', context: { workingDirectory: '.' }, options: { threshold: 0.4 } });
  assert.equal(typeof res.success, 'boolean');
  assert.equal(typeof res.timestamp, 'string');
});

await app.close();
