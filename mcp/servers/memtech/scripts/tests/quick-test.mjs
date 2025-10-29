#!/usr/bin/env node

/**
 * Quick smoke test: verify Memory module loads and basic short memory works.
 */

import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(process.cwd(), '..', '..', '..');

const { Memory } = await import(path.join(projectRoot, 'memtech', 'memory', 'index.js'));

async function main() {
  const memory = new Memory({
    store: async () => ({}),
    search: async () => []
  });

  memory.short.push({ content: 'quick-test-entry', meta: { ts: Date.now() } });
  const context = await memory.injectContext('quick-test-entry');
  if (!context.includes('quick-test-entry')) {
    throw new Error('Context injection failed');
  }
  console.log('✅ quick-test: Memory short buffer operational');
}

main().catch((error) => {
  console.error('❌ quick-test failed:', error.message);
  process.exit(1);
});
