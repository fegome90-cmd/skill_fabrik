import assert from 'node:assert/strict';

const URL = process.env.SF_ENDPOINT || 'http://127.0.0.1:7727';

const r = await fetch(`${URL}/execute`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ skill_id: 'repo-auditor-deny', args: {}, dry_run: false }),
});
assert.equal(r.status, 403);
const j = await r.json();
assert.ok(Array.isArray(j.denied) && j.denied.length > 0);

console.log('Policy deny: OK');
