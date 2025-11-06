#!/usr/bin/env node
// Batch calls daemon /activate with context from a JSONL file and persists JSONL of results

import { createReadStream } from 'node:fs';
import { resolve } from 'node:path';
import readline from 'node:readline';
import { mkdir, appendFile } from 'node:fs/promises';

function parseArgs(argv) {
  const args = { file: 'dev/agent-dev-docs/prompts-context.jsonl', daemon: process.env.DAEMON_URL || 'http://127.0.0.1:7727', threshold: 0.6 };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--file') args.file = argv[++i];
    else if (a === '--daemon') args.daemon = argv[++i];
    else if (a === '--threshold') args.threshold = parseFloat(argv[++i]);
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv);
  const file = resolve(args.file);
  const rs = createReadStream(file, { encoding: 'utf-8' });
  const rl = readline.createInterface({ input: rs, crlfDelay: Infinity });
  const outDir = resolve('dev/agent-dev-docs');
  await mkdir(outDir, { recursive: true });
  let processed = 0;

  for await (const line of rl) {
    const s = line.trim(); if (!s) continue;
    let rec; try { rec = JSON.parse(s); } catch { continue; }
    const desc = String(rec.desc || '').trim(); if (!desc) continue;
    const ctx = {
      files: Array.isArray(rec.openFiles) ? rec.openFiles : [],
      activeFile: rec.activeFile || '',
      activeFileContent: rec.activeFileContent || '',
      workingDirectory: process.cwd(),
      editor: 'cli'
    };
    const body = { intent: desc, context: ctx, options: { threshold: args.threshold, maxResults: 5, includeMetadata: true } };
    try {
      const res = await fetch(`${args.daemon}/activate`, { method: 'POST', headers: { 'content-type': 'application/json', ...(process.env.SF_API_KEY ? { 'x-api-key': process.env.SF_API_KEY } : {}) }, body: JSON.stringify(body) });
      const json = await res.json().catch(()=>({}));
      const evt = { ts: new Date().toISOString(), kind: 'activate_batch', ok: res.ok, status: res.status, threshold: args.threshold, desc, ctx: { files: ctx.files, activeFile: ctx.activeFile }, results: Array.isArray(json?.results) ? json.results : [], metrics: json?.metrics || {} };
      await appendFile(resolve(outDir, 'activate-activations.jsonl'), JSON.stringify(evt) + '\n', 'utf-8');
      processed++;
    } catch {}
  }
  console.log(JSON.stringify({ status: 'ok', processed }, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });

