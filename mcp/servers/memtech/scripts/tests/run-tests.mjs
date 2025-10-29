#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runScript(script) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn('node', [resolve(__dirname, script)], {
      stdio: 'inherit'
    });
    child.on('exit', (code) => {
      if (code === 0) {
        resolvePromise();
      } else {
        rejectPromise(new Error(`${script} exited with code ${code}`));
      }
    });
  });
}

async function main() {
  await runScript('quick-test.mjs');
  await runScript('basic-test.mjs');
  console.log('✅ MemTech tests completed');
}

main().catch((error) => {
  console.error('❌ MemTech tests failed:', error.message);
  process.exit(1);
});
