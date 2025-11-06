import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../dist/app.js';
import { resetMetrics } from '../dist/metrics.js';

const app = await createApp();

await test('metrics endpoint tracks activation and execute events', async () => {
  resetMetrics();

  const act = await app.inject({
    method: 'POST',
    url: '/activate',
    payload: { intent: 'lint repository', editor: 'cli', cwd: '.' },
  });
  assert.equal(act.statusCode, 200);

  await app.inject({
    method: 'POST',
    url: '/execute',
    payload: { skill_id: 'repo-auditor', args: {}, dry_run: true },
  });

  const metrics = await app.inject({ method: 'GET', url: '/metrics' });
  assert.equal(metrics.statusCode, 200);
  const body = metrics.body.toString();
  assert.ok(body.includes('daemon_info'));
  assert.ok(body.includes('skills_activation_latency_ms_count'));
  assert.ok(body.includes('skills_execute_latency_ms_count'));
  assert.ok(body.includes('policy_decisions_total'));
});

await app.close();
