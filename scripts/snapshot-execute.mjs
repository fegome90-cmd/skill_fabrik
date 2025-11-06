import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const ENDPOINT = process.env.SF_ENDPOINT || 'http://127.0.0.1:7727';
const OUT = resolve('contracts/snapshots/execute.dryrun.json');

const body = { skill_id: 'repo-auditor', args: {}, dry_run: true, cwd: '.' };
const r = await fetch(`${ENDPOINT}/execute`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
});
if (!r.ok) {
  console.error('execute ->', r.status);
  process.exit(2);
}
const json = await r.json();
await mkdir(resolve('contracts/snapshots'), { recursive: true });
await writeFile(OUT, JSON.stringify(json, null, 2), 'utf8');
console.log('Snapshot escrito en', OUT);

