#!/usr/bin/env node
// PBv2 daily runner: batch track prompts.txt and persist a daily report in dev/agent-dev-docs

import { spawnSync } from 'node:child_process';
import { writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

function run(cmd, args) {
  const r = spawnSync(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
  return { code: r.status ?? 0, stdout: r.stdout?.toString?.() || '', stderr: r.stderr?.toString?.() || '' };
}

async function main() {
  // 1) Batch track prompts.txt
  const batch = run(process.execPath, ['scripts/metrics/pb2-batch.mjs', '--file', 'dev/agent-dev-docs/prompts.txt', '--skills', 'backend-dev-guidelines,frontend-dev-guidelines,database-verification,secrets-and-config', '--threshold', '0.6']);
  if (batch.code !== 0) {
    console.error(batch.stderr || batch.stdout);
  }

  // 2) Generate report JSON from pb2-report
  const report = run(process.execPath, ['scripts/metrics/pb2-report.mjs']);
  const outDir = resolve('dev/agent-dev-docs');
  await mkdir(outDir, { recursive: true });
  const ts = new Date().toISOString().split('T')[0];
  const outFile = resolve(outDir, `pb2-daily-${ts}.json`);
  await writeFile(outFile, report.stdout || '{}', 'utf-8');
  console.log(`Saved daily PBv2 report: ${outFile}`);
}

main().catch((e) => { console.error(e); process.exit(1); });

