#!/usr/bin/env node
// Selects the best threshold/weights preset from the latest activate-sweep report

import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

async function main() {
  const dir = resolve('dev/agent-dev-docs');
  const files = (await readdir(dir)).filter(f => f.startsWith('activate-sweep-') && f.endsWith('.json'));
  if (files.length === 0) {
    console.error('No sweep reports found in dev/agent-dev-docs');
    process.exit(2);
  }
  files.sort();
  const latest = files[files.length - 1];
  const report = JSON.parse(await readFile(resolve(dir, latest), 'utf-8'));
  const rows = Array.isArray(report?.results) ? report.results : [];
  if (rows.length === 0) {
    console.error('Sweep report has no results');
    process.exit(2);
  }
  // Pick best by passRate then avgTopConfidence
  rows.sort((a, b) => (b.passRate - a.passRate) || (b.avgTopConfidence - a.avgTopConfidence));
  const best = rows[0];
  const presets = {
    balanced: { keywords: 0.25, intent: 0.25, path: 0.25, content: 0.25 },
    'intent-heavy': { keywords: 0.2, intent: 0.4, path: 0.2, content: 0.2 },
    'path-heavy': { keywords: 0.2, intent: 0.2, path: 0.4, content: 0.2 },
    'content-heavy': { keywords: 0.2, intent: 0.2, path: 0.2, content: 0.4 },
    'keyword-heavy': { keywords: 0.4, intent: 0.2, path: 0.2, content: 0.2 }
  };
  const w = presets[best.preset] || presets['balanced'];

  const suggestion = {
    ts: new Date().toISOString(),
    fromReport: latest,
    threshold: best.threshold,
    preset: best.preset,
    weights: w,
    metrics: { passRate: best.passRate, avgTopConfidence: best.avgTopConfidence, evaluated: best.evaluated }
  };
  const out = resolve(dir, 'activation-calibration-suggestion.json');
  await mkdir(dir, { recursive: true });
  await writeFile(out, JSON.stringify(suggestion, null, 2), 'utf-8');
  console.log(JSON.stringify(suggestion, null, 2));
  console.error(`Saved suggestion: ${out}`);
}

main().catch((e) => { console.error(e); process.exit(1); });

