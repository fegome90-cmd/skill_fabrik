#!/usr/bin/env node

/**
 * Basic test exercising MemoryManager add/resolve with local fallback storage.
 */

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MemoryManagerModule = await import(path.resolve(__dirname, '../memtech/memory.js'));
const MemoryManager = MemoryManagerModule.default;

async function main() {
  const projectRoot = path.resolve(__dirname, '..', '..', '..');
  const storagePath = path.join(projectRoot, '.memtech', 'test-memory');
  const manager = new MemoryManager({ storage_path: storagePath });
  const title = `basic-test-${Date.now()}`;
  const content = 'memtech basic test payload';

  const created = await manager.addItem({ title, content, tags: ['basic', 'test'] });
  if (!created?.success) {
    throw new Error('Failed to add memory item');
  }

  const uri = created.uri;
  const resolved = await manager.resolve(uri);
  if (!resolved?.content?.includes(content)) {
    throw new Error('Resolved content mismatch');
  }

  console.log('✅ basic-test: MemoryManager add/resolve operational');
}

main().catch((error) => {
  console.error('❌ basic-test failed:', error.message);
  process.exit(1);
});
