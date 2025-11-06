import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { createFileEventStore } = require('../../dist/persistence/event-store.js');

const tmp = await mkdtemp(join(tmpdir(), 'sf-events-'));

await test('event-store append and readLast', async () => {
  const store = createFileEventStore(tmp);
  const now = new Date().toISOString();
  await store.append({ kind: 'system', ts: now, message: 'hello', level: 'info' });
  await store.append({ kind: 'system', ts: now, message: 'world', level: 'info' });
  const last = await store.readLast(2);
  assert.equal(last.length, 2);
  assert.equal(last[0].kind, 'system');
});

await rm(tmp, { recursive: true, force: true });

