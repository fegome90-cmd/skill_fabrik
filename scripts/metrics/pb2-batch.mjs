#!/usr/bin/env node
// PBv2 batch tracker: reads a file with one prompt per line and tracks each

import { createReadStream } from 'node:fs';
import { resolve } from 'node:path';
import readline from 'node:readline';
import { spawn } from 'node:child_process';

function parseArgs(argv) {
  const args = { file: null, skills: null, threshold: '0.6' };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--file') args.file = argv[++i];
    else if (a === '--skills') args.skills = argv[++i];
    else if (a === '--threshold') args.threshold = argv[++i];
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.file) {
    console.error('Usage: pb2-batch --file <prompts.txt> [--skills a,b,c] [--threshold 0.6]');
    process.exit(1);
  }
  const file = resolve(args.file);
  const rs = createReadStream(file, { encoding: 'utf-8' });
  const rl = readline.createInterface({ input: rs, crlfDelay: Infinity });

  let n = 0;
  for await (const line of rl) {
    const prompt = line.trim();
    if (!prompt) continue;
    n++;
    await new Promise((resolveRun) => {
      const child = spawn(process.execPath, [
        'scripts/metrics/pb2-track.mjs',
        '--desc', prompt,
        ...(args.skills ? ['--skills', args.skills] : []),
        ...(args.threshold ? ['--threshold', args.threshold] : []),
      ], { stdio: ['ignore', 'ignore', 'inherit'] });
      child.on('exit', () => resolveRun());
    });
  }
  console.log(JSON.stringify({ status: 'ok', processed: n }, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });

