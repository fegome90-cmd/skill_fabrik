#!/usr/bin/env node
// Minimal health smoke for daemon; non-intrusive
const base = process.env.DAEMON_URL || 'http://localhost:3030';

async function main() {
  try {
    const res = await fetch(base + '/health', { method: 'GET' });
    if (!res || res.status !== 200) {
      console.error('❌ /health FAIL', res && res.status);
      process.exit(1);
    }
    console.log('✅ /health OK');
  } catch (err) {
    console.error('❌ /health FAIL', err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

main();

