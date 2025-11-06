import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const URL = process.env.SF_ENDPOINT || 'http://127.0.0.1:7727';

function shape(o){ if(Array.isArray(o)) return o.map(shape); if(o&&typeof o==='object'){const r={}; for(const k of Object.keys(o).sort()) r[k]=shape(o[k]); return r;} return typeof o; }

const snap = JSON.parse(await readFile('contracts/snapshots/execute.dryrun.json','utf8'));
const r = await fetch(`${URL}/execute`, { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ skill_id:'repo-auditor', args:{}, dry_run:true, cwd:'.' }) });
const live = await r.json();

assert.deepEqual(Object.keys(live).sort(), Object.keys(snap).sort());
assert.deepEqual(shape(live), shape(snap), 'Estructura/tipos difieren del snapshot');

console.log('Snapshot /execute (dry-run): OK');

