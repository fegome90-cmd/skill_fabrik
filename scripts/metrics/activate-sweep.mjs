#!/usr/bin/env node
// Sweeps thresholds and weight sets over prompts-context.jsonl and writes a summary JSON

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const WEIGHT_PRESETS = [
  { name: 'balanced', w: { keywords: 0.25, intent: 0.25, path: 0.25, content: 0.25 } },
  { name: 'intent-heavy', w: { keywords: 0.2, intent: 0.4, path: 0.2, content: 0.2 } },
  { name: 'path-heavy', w: { keywords: 0.2, intent: 0.2, path: 0.4, content: 0.2 } },
  { name: 'content-heavy', w: { keywords: 0.2, intent: 0.2, path: 0.2, content: 0.4 } },
  { name: 'keyword-heavy', w: { keywords: 0.4, intent: 0.2, path: 0.2, content: 0.2 } }
];

const THRESHOLDS = [0.5, 0.55, 0.6, 0.65, 0.7];

async function main() {
  const daemon = process.env.DAEMON_URL || 'http://127.0.0.1:7727';
  const file = resolve('dev/agent-dev-docs/prompts-context.jsonl');
  const text = await readFile(file, 'utf-8');
  const lines = text.split('\n').filter(Boolean);
  const prompts = lines.map(s => { try { return JSON.parse(s); } catch { return null; } }).filter(Boolean);

  const results = [];
  for (const t of THRESHOLDS) {
    for (const preset of WEIGHT_PRESETS) {
      let total = 0, activations = 0, sumConf = 0;
      for (const rec of prompts) {
        const body = {
          intent: rec.desc,
          context: {
            files: Array.isArray(rec.openFiles) ? rec.openFiles : [],
            activeFile: rec.activeFile || '',
            activeFileContent: rec.activeFileContent || '',
            workingDirectory: process.cwd(),
            editor: 'cli'
          },
          options: { threshold: t, maxResults: 5, includeMetadata: false, signalWeights: preset.w }
        };
        try {
          const res = await fetch(`${daemon}/activate`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
          const json = await res.json();
          if (Array.isArray(json?.results)) {
            total++;
            activations += json.results.length > 0 ? 1 : 0;
            if (json.results.length > 0) sumConf += Number(json.results[0].confidence || 0);
          }
        } catch {}
      }
      results.push({ threshold: t, preset: preset.name, passRate: total ? +(activations / total).toFixed(2) : 0, avgTopConfidence: activations ? +(sumConf / activations).toFixed(2) : 0, evaluated: total });
    }
  }

  const outDir = resolve('dev/agent-dev-docs');
  await mkdir(outDir, { recursive: true });
  const outFile = resolve(outDir, `activate-sweep-${Date.now()}.json`);
  await writeFile(outFile, JSON.stringify({ ts: new Date().toISOString(), daemon, results }, null, 2), 'utf-8');
  console.log(`Saved sweep report: ${outFile}`);
}

main().catch((e) => { console.error(e); process.exit(1); });

