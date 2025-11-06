#!/usr/bin/env node
// Compare PBv2 predictions vs daemon /activate for a single prompt

import { writeFile, mkdir, appendFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

function parseArgs(argv) {
  const args = { threshold: 0.6, daemon: process.env.DAEMON_URL || 'http://127.0.0.1:7727', file: null, desc: null };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--desc') args.desc = argv[++i];
    else if (a === '--file') args.file = argv[++i];
    else if (a === '--threshold') args.threshold = parseFloat(argv[++i]);
    else if (a === '--daemon') args.daemon = argv[++i];
  }
  return args;
}

async function loadDesc(args) {
  if (args.desc) return args.desc;
  if (args.file) return readFile(resolve(args.file), 'utf-8');
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf-8');
}

async function main() {
  const args = parseArgs(process.argv);
  const cwd = process.cwd();
  const desc = (await loadDesc(args)).trim();
  if (!desc) {
    console.error('✗ Provide --desc, --file or stdin');
    process.exit(2);
  }

  const { buildOptimizedPromptV2 } = await import('../../packages/skills-cli/dist/utils/prompt-builder-v2.js');
  const pb = await buildOptimizedPromptV2({
    description: desc,
    includeFiles: true,
    includeContent: true,
    includeTemplate: false,
    includeTags: false,
    complexity: 'medium',
  });
  const threshold = isFinite(args.threshold) ? args.threshold : 0.6;
  const pbSkills = pb.skillActivation
    .filter(a => a.score >= threshold)
    .map(a => a.skillId);

  let daemonSkills = [];
  try {
    const body = {
      intent: desc,
      context: { files: [], activeFile: '', activeFileContent: '', workingDirectory: cwd, editor: 'cli' },
      options: { threshold, maxResults: 5, includeMetadata: true },
    };
    const res = await fetch(`${args.daemon}/activate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(process.env.SF_API_KEY ? { 'x-api-key': process.env.SF_API_KEY } : {}) },
      body: JSON.stringify(body)
    });
    if (res.ok) {
      const json = await res.json();
      daemonSkills = Array.isArray(json?.results) ? json.results.map(r => r.skillId).filter(Boolean) : [];
    }
  } catch {}

  const overlap = pbSkills.filter(s => daemonSkills.includes(s));
  const summary = {
    ts: new Date().toISOString(),
    kind: 'pb2_vs_daemon',
    threshold,
    daemon: args.daemon,
    descLength: desc.length,
    pb: { activated: pbSkills, total: (pb.skillActivation || []).length },
    daemon: { activated: daemonSkills, total: daemonSkills.length },
    overlap,
  };
  console.log(JSON.stringify(summary, null, 2));

  try {
    const dir = resolve('dev/agent-dev-docs');
    await mkdir(dir, { recursive: true });
    await appendFile(resolve(dir, 'pb2-vs-activate.jsonl'), JSON.stringify(summary) + '\n', 'utf-8');
  } catch {}
}

main().catch((e) => { console.error(e); process.exit(1); });

