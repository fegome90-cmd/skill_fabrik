import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const ENDPOINT = process.env.SF_ENDPOINT || 'http://127.0.0.1:7727';
const OUT_DIR = resolve('contracts/snapshots');
const OUT_FILE = resolve(OUT_DIR, 'activate.json');

const body = { intent: 'lint rápido', cwd: '.', editor: 'cli' };
const r = await fetch(`${ENDPOINT}/activate`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
});
if (!r.ok) {
  console.error('activate ->', r.status);
  process.exit(2);
}
const json = await r.json();
await mkdir(OUT_DIR, { recursive: true });
await writeFile(OUT_FILE, JSON.stringify(json, null, 2), 'utf8');

console.log(`Snapshot escrito en ${OUT_FILE}`);

