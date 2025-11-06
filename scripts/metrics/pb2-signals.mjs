#!/usr/bin/env node
// Calls /debug/signals for prompts.txt and persists JSONL in dev/agent-dev-docs/pb2-signals.jsonl

import { createReadStream } from 'node:fs';
import { resolve } from 'node:path';
import readline from 'node:readline';
import { appendFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';

function parseArgs(argv) {
  const args = { file: 'dev/agent-dev-docs/prompts.txt', daemon: process.env.DAEMON_URL || 'http://127.0.0.1:7727', useShared: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--file') args.file = argv[++i];
    else if (a === '--daemon') args.daemon = argv[++i];
    else if (a === '--shared') args.useShared = true;
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

  for await (const line of rl) {
    const prompt = line.trim(); if (!prompt) continue;
    const url = `${args.daemon}/debug/signals?intent=${encodeURIComponent(prompt)}${args.useShared ? '&useShared=1' : ''}`;
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const json = await res.json();
      const evt = {
        ts: new Date().toISOString(),
        kind: 'debug_signals',
        desc_hash: createHash('sha256').update(prompt).digest('hex'),
        daemon: args.daemon,
        using: json.using,
        weights: json.weights,
        local: json.local,
        shared: json.shared || null,
      };
      await appendFile(resolve(outDir, 'pb2-signals.jsonl'), JSON.stringify(evt) + '\n', 'utf-8');
    } catch {}
  }
  console.log('Saved: dev/agent-dev-docs/pb2-signals.jsonl');
}

main().catch((e) => { console.error(e); process.exit(1); });

