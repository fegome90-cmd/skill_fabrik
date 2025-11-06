#!/usr/bin/env node
import { createApp } from '../packages/daemon/dist/app.js';
import { resetMetrics } from '../packages/daemon/dist/metrics.js';

async function main() {
  const app = await createApp();
  try {
    resetMetrics();
    const res = await app.inject({ method: 'GET', url: '/metrics' });
    if (res.statusCode !== 200) {
      console.error('Metrics endpoint returned', res.statusCode);
      process.exit(1);
    }
    const body = res.body.toString();
    ['daemon_info', 'skills_activation_latency_ms', 'policy_decisions_total'].forEach(metric => {
      if (!body.includes(metric)) {
        console.error(`Missing metric: ${metric}`);
        process.exit(1);
      }
    });
    console.log('Metrics smoke PASS');
  } finally {
    await app.close();
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
