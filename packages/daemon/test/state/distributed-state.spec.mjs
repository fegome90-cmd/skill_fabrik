import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

// Import from dist without relying on path CWD
const require = createRequire(import.meta.url);
const { createDistributedState } = require('../../dist/state/distributed-state.js');

await test('distributed state (memory) respects TTL', async () => {
  delete process.env.SF_STATE_REDIS;
  const ds = await createDistributedState('sf:test', { ttlSec: 1 });
  await ds.set('foo', { x: 1 }, 1);
  const v1 = await ds.get('foo');
  assert.deepEqual(v1, { x: 1 });
  await new Promise(r => setTimeout(r, 1100));
  const v2 = await ds.get('foo');
  assert.equal(v2, null);
});

