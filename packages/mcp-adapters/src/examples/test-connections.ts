/**
 * Example: Test all database connections
 * Based on ADR patterns for health checks
 */

import { testAllConnections, ensurePostgresTables } from '../memtech/database-clients.js';
import { validateConfig } from '../memtech/config.js';

export async function testConnections() {
  console.log('🔍 Testing all database connections...\n');

  // 1. Validate configuration
  const validation = validateConfig();
  console.log('Configuration:');
  console.log(`  Valid: ${validation.valid ? '✅' : '❌'}`);
  if (validation.errors.length > 0) {
    console.log('  Errors:', validation.errors);
  }
  if (validation.warnings.length > 0) {
    console.log('  Warnings:', validation.warnings);
  }
  console.log('');

  // 2. Test all connections
  const results = await testAllConnections();

  // Redis Cache (L0)
  console.log('Redis Cache (L0):');
  if (results.redisCache.connected) {
    console.log(`  ✅ Connected (latency: ${results.redisCache.latency}ms)`);
  } else {
    console.log(`  ❌ Not connected: ${results.redisCache.error}`);
  }

  // Redis Core (L1)
  console.log('\nRedis Core (L1):');
  if (results.redisCore.connected) {
    console.log(`  ✅ Connected (latency: ${results.redisCore.latency}ms)`);
  } else {
    console.log(`  ❌ Not connected: ${results.redisCore.error}`);
  }

  // PostgreSQL (L2)
  console.log('\nPostgreSQL (L2):');
  if (results.postgresql.connected) {
    console.log(`  ✅ Connected`);
    try {
      await ensurePostgresTables();
      console.log('  ✅ Tables verified/created');
    } catch (error) {
      console.log(`  ⚠️ Table setup failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  } else {
    console.log(`  ❌ Not connected: ${results.postgresql.error}`);
  }

  // ChromaDB (L3)
  console.log('\nChromaDB (L3):');
  if (results.chroma.connected) {
    console.log(`  ✅ Connected`);
  } else {
    console.log(`  ❌ Not connected: ${results.chroma.error}`);
  }

  // Summary
  const total = 4;
  const connected = [
    results.redisCache.connected,
    results.redisCore.connected,
    results.postgresql.connected,
    results.chroma.connected,
  ].filter(Boolean).length;

  console.log(`\n📊 Summary: ${connected}/${total} databases connected`);

  return results;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testConnections()
    .then(() => {
      console.log('\n✅ Connection test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Connection test failed:', error);
      process.exit(1);
    });
}

