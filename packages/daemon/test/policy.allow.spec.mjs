import assert from 'node:assert/strict';

const URL = process.env.SF_ENDPOINT || 'http://127.0.0.1:7727';

const r = await fetch(`${URL}/execute`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ skill_id: 'repo-auditor', args: {}, dry_run: false, cwd: '.' }),
});

const j = await r.json().catch(() => ({}));
if (r.status !== 200) {
  console.error('policy allow failed', r.status, j);
}
assert.equal(r.status, 200);
assert.ok(/status|diff/.test(j.stdout));

console.log('Policy allow: OK');
