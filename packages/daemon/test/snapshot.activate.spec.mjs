import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const ENDPOINT = process.env.SF_ENDPOINT || 'http://127.0.0.1:7727';

function shape(o) {
  if (Array.isArray(o)) return o.map(shape);
  if (o && typeof o === 'object') {
    const out = {};
    for (const k of Object.keys(o).sort()) out[k] = shape(o[k]);
    return out;
  }
  return typeof o;
}

const snap = JSON.parse(await readFile('contracts/snapshots/activate.json', 'utf8'));
const r = await fetch(`${ENDPOINT}/activate`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ intent: 'lint rápido', cwd: '.', editor: 'cli' }),
});
const live = await r.json();

assert.deepEqual(Object.keys(live).sort(), Object.keys(snap).sort(), 'Claves raíz difieren');
assert.deepEqual(shape(live), shape(snap), 'Estructura/tipos difieren del snapshot');

console.log('Snapshot /activate: OK');

