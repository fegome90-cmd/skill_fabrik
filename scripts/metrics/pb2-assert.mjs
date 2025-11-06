#!/usr/bin/env node
// PBv2 assertion runner: ensures selected skills pass a threshold for given prompts

import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

function parseArgs(argv) {
  const args = { file: 'dev/agent-dev-docs/p1-assert.json' };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--file') args.file = argv[++i];
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv);
  const cfgPath = resolve(args.file);
  const cfg = JSON.parse(await readFile(cfgPath, 'utf-8'));
  const threshold = typeof cfg.threshold === 'number' ? cfg.threshold : 0.6;
  const cases = Array.isArray(cfg.cases) ? cfg.cases : [];
  if (cases.length === 0) {
    console.error('✗ No assertion cases found');
    process.exit(2);
  }

  const { buildOptimizedPromptV2 } = await import('../../packages/skills-cli/dist/utils/prompt-builder-v2.js');
  const results = [];
  for (const c of cases) {
    const out = await buildOptimizedPromptV2({
      skillIds: [c.skillId],
      description: c.desc,
      includeFiles: true,
      includeContent: true,
      includeTemplate: false,
      includeTags: false,
      complexity: 'medium',
    });
    const pass = out.expectedScore >= threshold;
    results.push({
      skillId: c.skillId,
      desc: c.desc,
      expectedScore: Number(out.expectedScore.toFixed(2)),
      pass,
      signals: {
        keywords: out.signals.keywords.length,
        intent: out.signals.intent.length,
        paths: out.signals.paths.length,
        content: out.signals.content.length,
      },
    });
  }
  const summary = {
    ts: new Date().toISOString(),
    threshold,
    pass: results.filter(r => r.pass).length,
    total: results.length,
    results,
  };
  console.log(JSON.stringify(summary, null, 2));

  try {
    const outDir = resolve('dev/agent-dev-docs');
    await mkdir(outDir, { recursive: true });
    const outFile = resolve(outDir, `pb2-assert-${Date.now()}.json`);
    await writeFile(outFile, JSON.stringify(summary, null, 2), 'utf-8');
  } catch {}

  if (summary.pass !== summary.total) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });

