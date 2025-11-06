#!/usr/bin/env node
// Aggregate dev/agent-dev-docs/activate-activations.jsonl

import { createReadStream } from 'node:fs';
import { resolve } from 'node:path';
import readline from 'node:readline';

async function main() {
  const file = resolve('dev/agent-dev-docs/activate-activations.jsonl');
  const rs = createReadStream(file, { encoding: 'utf-8' });
  const rl = readline.createInterface({ input: rs, crlfDelay: Infinity });
  const skillStats = new Map();
  let total = 0;

  for await (const line of rl) {
    const s = line.trim(); if (!s) continue;
    let ev; try { ev = JSON.parse(s); } catch { continue; }
    if (!Array.isArray(ev?.results)) continue;
    total++;
    for (const r of ev.results) {
      const id = r.skillId;
      const cur = skillStats.get(id) || { count: 0, avg: 0 };
      cur.count++;
      cur.avg += Number(r.confidence || 0);
      skillStats.set(id, cur);
    }
  }

  const skills = Array.from(skillStats.entries()).map(([skillId, s]) => ({
    skillId,
    activations: s.count,
    avgConfidence: s.count ? +(s.avg / s.count).toFixed(2) : 0,
  })).sort((a, b) => b.activations - a.activations || b.avgConfidence - a.avgConfidence);

  console.log(JSON.stringify({ totalRuns: total, skills }, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });

