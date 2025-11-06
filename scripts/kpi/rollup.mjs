#!/usr/bin/env node
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';

async function main() {
  const root = process.cwd();
  const src = path.resolve(root, 'obs/kpi/events.jsonl');
  const outDir = path.resolve(root, 'obs/kpi/daily');
  await mkdir(outDir, { recursive: true });

  const lines = (await readFile(src, 'utf8'))
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);

  const byDay = new Map();
  for (const line of lines) {
    try {
      const evt = JSON.parse(line);
      const ts = evt.ts || evt.timestamp;
      if (!ts) continue;
      const day = new Date(ts).toISOString().slice(0, 10);
      if (!byDay.has(day)) byDay.set(day, []);
      byDay.get(day).push(evt);
    } catch {}
  }

  for (const [day, events] of byDay.entries()) {
    const summary = {
      day,
      total: events.length,
      bySkill: events.reduce((acc, e) => {
        const key = e.skill || (Array.isArray(e.skills) ? e.skills.join(',') : 'n/a');
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {}),
      errors_ts_sum: events.reduce((acc, e) => acc + (e.errors_ts || 0), 0),
      zero_ok_rate:
        events.length === 0
          ? 1
          : events.filter(e => e.zero_errors_left_behind === true).length / events.length,
    };

    const outfile = path.resolve(outDir, `${day}.json`);
    await writeFile(outfile, JSON.stringify(summary, null, 2), 'utf8');
  }

  // small index
  const files = await readdir(outDir);
  await writeFile(
    path.resolve(outDir, 'index.json'),
    JSON.stringify({ files }, null, 2),
    'utf8'
  );
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});


