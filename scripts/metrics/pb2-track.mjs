#!/usr/bin/env node
// PBv2 activation tracker: evaluates a prompt against a set of skills and logs stats

import { readFile, mkdir, appendFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

function parseArgs(argv) {
  const args = { threshold: 0.6, skills: null, file: null, desc: null };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--desc') args.desc = argv[++i];
    else if (a === '--file') args.file = argv[++i];
    else if (a === '--skills') args.skills = argv[++i];
    else if (a === '--threshold') args.threshold = parseFloat(argv[++i]);
  }
  return args;
}

async function loadDesc(args) {
  if (args.desc) return args.desc;
  if (args.file) return await readFile(resolve(args.file), 'utf-8');
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf-8');
}

async function loadSkills(cwd, list) {
  if (list) return list.split(',').map(s => s.trim()).filter(Boolean);
  const rulesPath = resolve(cwd, 'configs/skill-rules.json');
  const json = JSON.parse(await readFile(rulesPath, 'utf-8'));
  return Object.keys(json);
}

function sha256(s) {
  return createHash('sha256').update(s).digest('hex');
}

async function main() {
  const args = parseArgs(process.argv);
  const cwd = process.cwd();
  const desc = (await loadDesc(args)).trim();
  if (!desc) {
    console.error('✗ Provide --desc, --file or stdin');
    process.exit(2);
  }
  const skills = await loadSkills(cwd, args.skills);

  const { buildOptimizedPromptV2 } = await import('../../packages/skills-cli/dist/utils/prompt-builder-v2.js');
  const out = await buildOptimizedPromptV2({
    skillIds: skills,
    description: desc,
    includeFiles: true,
    includeContent: true,
    includeTemplate: false,
    includeTags: false,
    complexity: 'medium',
  });

  const threshold = isFinite(args.threshold) ? args.threshold : 0.6;
  const results = out.skillActivation.map(a => ({
    skillId: a.skillId,
    score: Number(a.score.toFixed(4)),
    activated: a.score >= threshold,
    reasons: a.reasons,
  }));
  const summary = {
    ts: new Date().toISOString(),
    kind: 'pb2_eval',
    threshold,
    desc_hash: sha256(desc),
    skills: results.length,
    pass: results.filter(r => r.activated).length,
    results,
    signals: {
      keywords: out.signals.keywords.length,
      intent: out.signals.intent.length,
      paths: out.signals.paths.length,
      content: out.signals.content.length,
    }
  };

  console.log(JSON.stringify(summary, null, 2));

  // Persist as JSONL event
  try {
    const dir = resolve(cwd, 'dev/agent-dev-docs');
    await mkdir(dir, { recursive: true });
    const line = JSON.stringify(summary) + '\n';
    await appendFile(resolve(dir, 'pb2-activations.jsonl'), line, 'utf-8');
  } catch {
    // ignore persistence errors in tracker
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
