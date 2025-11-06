#!/usr/bin/env node
// Redis connectivity smoke. Exits 0 on success or if SF_STATE_REDIS != 1.
// Exits 1 on failure when SF_STATE_REDIS=1.

const flag = process.env.SF_STATE_REDIS === '1';
if (!flag) {
  console.log('SKIP: SF_STATE_REDIS not set');
  process.exit(0);
}

const url = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
let Redis;
try {
  const { createRequire } = await import('node:module');
  const req = createRequire(import.meta.url);
  Redis = req('ioredis');
} catch (e) {
  console.error('❌ ioredis not installed. Install with: pnpm add ioredis');
  process.exit(1);
}

const client = new Redis(url);
const key = `sf:smoke:${Date.now()}`;
try {
  const setRes = await client.set(key, 'ok', 'EX', 5);
  if (!setRes) throw new Error('SET failed');
  const got = await client.get(key);
  if (got !== 'ok') throw new Error('GET mismatch');
  await client.del(key);
  console.log('✅ Redis smoke OK');
  process.exit(0);
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  if (process.env.REDIS_WARN_ONLY === '1') {
    console.warn('⚠️  Redis smoke WARN (REDIS_WARN_ONLY=1):', msg);
    process.exit(0);
  }
  console.error('❌ Redis smoke FAIL:', msg);
  process.exit(1);
} finally {
  try { client.disconnect(); } catch {}
}
