#!/usr/bin/env node
// PBv2 activation report: aggregates obs/kpi/pb2-activations.jsonl

import { createReadStream } from 'node:fs';
import { resolve } from 'node:path';
import readline from 'node:readline';

async function main() {
  const file = process.argv[2] || resolve('dev/agent-dev-docs/pb2-activations.jsonl');
  const rs = createReadStream(file, { encoding: 'utf-8' });
  const rl = readline.createInterface({ input: rs, crlfDelay: Infinity });

  const perSkill = new Map();
  let total = 0; let passes = 0;

  for await (const line of rl) {
    const s = line.trim(); if (!s) continue;
    let ev; try { ev = JSON.parse(s); } catch { continue; }
    if (!ev || ev.kind !== 'pb2_eval' || !Array.isArray(ev.results)) continue;
    total++;
    passes += ev.results.filter(r => r.activated).length;
    for (const r of ev.results) {
      const cur = perSkill.get(r.skillId) || { count: 0, activated: 0, sum: 0 };
      cur.count++; cur.sum += r.score; if (r.activated) cur.activated++;
      perSkill.set(r.skillId, cur);
    }
  }

  const skills = Array.from(perSkill.entries()).map(([skillId, s]) => ({
    skillId,
    evals: s.count,
    pass: s.activated,
    passRate: s.count ? +(s.activated / s.count).toFixed(2) : 0,
    avgScore: s.count ? +(s.sum / s.count).toFixed(2) : 0,
  })).sort((a, b) => b.passRate - a.passRate || b.avgScore - a.avgScore);

  const summary = {
    totalRuns: total,
    totalSkillEvals: skills.reduce((acc, x) => acc + x.evals, 0),
    reportGeneratedAt: new Date().toISOString(),
    skills,
  };
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
