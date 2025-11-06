#!/usr/bin/env node
/**
 * Script to connect and test all database connections
 * Based on ADR patterns from startkit-main
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env from project root (not package directory)
config({ path: resolve(process.cwd(), '../../.env') });
import { testAllConnections, ensurePostgresTables } from '../memtech/database-clients.js';
import { validateConfig } from '../memtech/config.js';
import { closeAllConnections } from '../memtech/database-clients.js';

async function main() {
  console.log('🔌 Connecting to all MemTech databases...\n');

  // 1. Validate configuration
  console.log('📋 Validating configuration...');
  const validation = validateConfig();
  
  if (!validation.valid) {
    console.error('❌ Configuration errors:');
    validation.errors.forEach(err => console.error(`   - ${err}`));
    process.exit(1);
  }

  if (validation.warnings.length > 0) {
    console.warn('⚠️  Configuration warnings:');
    validation.warnings.forEach(warn => console.warn(`   - ${warn}`));
  }
  console.log('✅ Configuration valid\n');

  // 2. Test all connections
  console.log('🔍 Testing connections...\n');
  const results = await testAllConnections();

  // Redis Cache (L0)
  console.log('┌─────────────────────────────────────┐');
  console.log('│ Redis Cache (L0) - Port 6379       │');
  console.log('└─────────────────────────────────────┘');
  if (results.redisCache.connected) {
    console.log(`✅ Connected successfully`);
    console.log(`   Latency: ${results.redisCache.latency}ms`);
  } else {
    console.log(`❌ Connection failed`);
    console.log(`   Error: ${results.redisCache.error}`);
  }
  console.log('');

  // Redis Core (L1)
  console.log('┌─────────────────────────────────────┐');
  console.log('│ Redis Core (L1) - Port 6381        │');
  console.log('└─────────────────────────────────────┘');
  if (results.redisCore.connected) {
    console.log(`✅ Connected successfully`);
    console.log(`   Latency: ${results.redisCore.latency}ms`);
    
    // Test write/read
    try {
      const { getRedisClient } = await import('../memtech/database-clients.js');
      const client = await getRedisClient('core');
      const testKey = `memtech:test:${Date.now()}`;
      await client.set(testKey, 'test-value', { EX: 10 });
      const value = await client.get(testKey);
      if (value === 'test-value') {
        console.log(`   ✅ Read/Write test passed`);
      }
    } catch (err) {
      console.log(`   ⚠️  Read/Write test: ${err instanceof Error ? err.message : String(err)}`);
    }
  } else {
    console.log(`❌ Connection failed`);
    console.log(`   Error: ${results.redisCore.error}`);
  }
  console.log('');

  // PostgreSQL (L2)
  console.log('┌─────────────────────────────────────┐');
  console.log('│ PostgreSQL (L2) - Port 5433        │');
  console.log('└─────────────────────────────────────┘');
  if (results.postgresql.connected) {
    console.log(`✅ Connected successfully`);
    
    // Ensure tables exist
    try {
      await ensurePostgresTables();
      console.log(`   ✅ Tables verified/created`);
      
      // Test query
      const { getPgPool } = await import('../memtech/database-clients.js');
      const pool = getPgPool();
      const client = await pool.connect();
      try {
        const { rows } = await client.query(
          'SELECT COUNT(*) as count FROM memtech_memory_items'
        );
        console.log(`   ✅ Query test passed (${rows[0].count} items in table)`);
      } finally {
        client.release();
      }
    } catch (err) {
      console.log(`   ⚠️  Table setup/query: ${err instanceof Error ? err.message : String(err)}`);
    }
  } else {
    console.log(`❌ Connection failed`);
    console.log(`   Error: ${results.postgresql.error}`);
  }
  console.log('');

  // ChromaDB (L3)
  console.log('┌─────────────────────────────────────┐');
  console.log('│ ChromaDB (L3) - Cloud               │');
  console.log('└─────────────────────────────────────┘');
  if (results.chroma.connected) {
    console.log(`✅ Connected successfully`);
  } else {
    console.log(`❌ Connection failed`);
    console.log(`   Error: ${results.chroma.error}`);
    if (results.chroma.error?.includes('wrapper not yet integrated')) {
      console.log(`   ℹ️  ChromaDB wrapper requires chroma-wrapper.mjs from startkit-main`);
    }
  }
  console.log('');

  // Summary
  console.log('┌─────────────────────────────────────┐');
  console.log('│ Summary                             │');
  console.log('└─────────────────────────────────────┘');
  const total = 4;
  const connected = [
    results.redisCache.connected,
    results.redisCore.connected,
    results.postgresql.connected,
    results.chroma.connected,
  ].filter(Boolean).length;

  console.log(`Connected: ${connected}/${total} databases`);
  console.log('');
  
  if (connected === total) {
    console.log('✅ All databases connected successfully!');
    process.exit(0);
  } else if (results.redisCore.connected) {
    console.log('✅ Redis Core (L1) connected - Plan snapshots will work');
    process.exit(0);
  } else {
    console.log('❌ Redis Core (L1) not connected - Plan snapshots will fail');
    console.log('   Check your .env configuration and Redis server status');
    process.exit(1);
  }
}

// Cleanup on exit
process.on('SIGINT', async () => {
  console.log('\n\n🛑 Closing connections...');
  await closeAllConnections();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeAllConnections();
  process.exit(0);
});

main()
  .then(async () => {
    await closeAllConnections();
  })
  .catch(async (error) => {
    console.error('\n❌ Fatal error:', error);
    await closeAllConnections();
    process.exit(1);
  });

