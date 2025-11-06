import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../dist/app.js';

const app = await createApp();

await test('POST /activate :: returns schema-like shape with boosted results', { skip: true }, async () => {
  const payload = {
    intent: 'lint rápido en frontend',
    context: {
      files: ['src/components/App.tsx', 'package.json'],
      workingDirectory: '.',
    },
    options: { threshold: 0.4, maxResults: 5 },
  };

  const res = await app.inject({ method: 'POST', url: '/activate', payload });
  assert.equal(res.statusCode, 200, 'status must be 200');

  const body = res.json();
  assert.equal(typeof body.success, 'boolean');
  assert.equal(typeof body.timestamp, 'string');
  assert.ok(Array.isArray(body.results));
  // Basic contract: at least one result should meet threshold (when any available)
  if (body.results.length > 0) {
    const hasScores = body.results.some(r => typeof r.confidence === 'number' && r.confidence >= 0.4);
    assert.ok(hasScores, 'at least one result should meet threshold');
  }
});

await app.close();
