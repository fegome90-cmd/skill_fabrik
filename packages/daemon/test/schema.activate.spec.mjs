import assert from 'node:assert/strict';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { readFile } from 'node:fs/promises';

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

async function load(name) {
  return JSON.parse(await readFile(`schemas/${name}`, 'utf8'));
}

const reqSchema = await load('activate.request.schema.json');
const resSchema = await load('activate.response.schema.json');
const vReq = ajv.compile(reqSchema);
const vRes = ajv.compile(resSchema);

const body = { intent: 'lint rápido', cwd: '.', editor: 'cli' };
if (!vReq(body)) throw new Error('Request no cumple schema');

const r = await fetch((process.env.SF_ENDPOINT || 'http://127.0.0.1:7727') + '/activate', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
});
const json = await r.json();
assert.equal(r.ok, true);
if (!vRes(json)) throw new Error('Response no cumple schema');
console.log('Schemas /activate: OK');

