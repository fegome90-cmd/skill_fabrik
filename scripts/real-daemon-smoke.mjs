#!/usr/bin/env node
// Real HTTP smoke: starts the Fastify app on a real port and performs HTTP requests.
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// Ensure CWD is the daemon package so relative paths work (schemas/ etc.)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
process.chdir(resolve(__dirname, '..', 'packages', 'daemon'));

const { createApp } = await import('./../packages/daemon/dist/app.js');

const app = await createApp();
const host = '127.0.0.1';
const port = 3031;
await app.listen({ host, port });

const base = `http://${host}:${port}`;

async function main() {
  // Health
  const h = await fetch(`${base}/health`).then(r => r.json());
  console.log('HEALTH:', h.status, h.system?.nodeVersion);

  // Activate
  const actRes = await fetch(`${base}/activate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      intent: 'lint repository quickly',
      context: { workingDirectory: '.' },
      options: { threshold: 0.4, maxResults: 5 }
    })
  });
  const act = await actRes.json();
  console.log('ACTIVATE:', actRes.status, Array.isArray(act.results) ? act.results.length : 0);

  // Metrics
  const m = await fetch(`${base}/metrics`).then(r => r.text());
  console.log('METRICS sample:', m.split('\n').slice(0, 3).join('\n'));
}

try {
  await main();
} finally {
  await app.close();
}

