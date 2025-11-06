import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const URL = process.env.SF_ENDPOINT || 'http://127.0.0.1:7727';

async function httpActivate() {
  const r = await fetch(`${URL}/activate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ intent: 'lint rápido', cwd: '.', editor: 'cli' })
  });
  return r.json();
}

const http = await httpActivate();
const cli = JSON.parse(
  execFileSync('node', [
    'packages/skills-cli/dist/index.js',
    'skills',
    'activate',
    '--intent',
    'lint rápido',
    '--json'
  ], { encoding: 'utf8' })
);

assert.deepEqual(Object.keys(http).sort(), Object.keys(cli).sort());

