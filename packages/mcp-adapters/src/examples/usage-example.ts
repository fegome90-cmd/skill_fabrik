/**
 * Example usage of MemTech MCP Adapter
 */

import { 
  createPlanSnapshot, 
  testConnection, 
  validateConfig,
  getL1Item,
} from '../memtech/index.js';

/**
 * Example: Create a plan snapshot
 */
export async function exampleCreateSnapshot() {
  // 1. Validate configuration first
  const validation = validateConfig();
  if (!validation.valid) {
    console.error('Configuration errors:', validation.errors);
    return;
  }

  if (validation.warnings.length > 0) {
    console.warn('Configuration warnings:', validation.warnings);
  }

  // 2. Test connection
  const health = await testConnection();
  if (!health.connected) {
    console.error('Redis not available:', health.error);
    console.warn('Snapshot creation will be skipped');
    return;
  }

  console.log(`✅ Redis connected (latency: ${health.latency}ms)`);

  // 3. Create snapshot
  try {
    const snapshot = await createPlanSnapshot({
      id: 'plan-example-123',
      task: 'Example task: Integrate MemTech L1 snapshots',
      phases: [
        {
          name: 'Phase 1: Setup',
          description: 'Configure Redis and dependencies',
        },
        {
          name: 'Phase 2: Integration',
          description: 'Integrate snapshot creation in plan workflow',
        },
      ],
      status: 'APPROVED',
      approved_at: new Date().toISOString(),
      risks: [],
      metrics: {},
    });

    console.log('✅ Snapshot created:');
    console.log(`  ID: ${snapshot.id}`);
    console.log(`  URI: ${snapshot.uri}`);
    console.log(`  Created: ${snapshot.created_at}`);

    // 4. Verify retrieval
    const retrieved = await getL1Item(snapshot.id);
    if (retrieved) {
      console.log('✅ Snapshot verified in Redis');
    } else {
      console.warn('⚠️ Snapshot not found in Redis');
    }

    return snapshot;
  } catch (error) {
    console.error('❌ Failed to create snapshot:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

/**
 * Example: Check system health
 */
export async function exampleHealthCheck() {
  console.log('🔍 Checking MemTech system health...\n');

  // Validate config
  const validation = validateConfig();
  console.log('Configuration:');
  console.log(`  Valid: ${validation.valid ? '✅' : '❌'}`);
  if (validation.errors.length > 0) {
    console.log('  Errors:', validation.errors);
  }
  if (validation.warnings.length > 0) {
    console.log('  Warnings:', validation.warnings);
  }

  // Test connection
  const health = await testConnection();
  console.log('\nConnection:');
  console.log(`  Status: ${health.connected ? '✅ Connected' : '❌ Disconnected'}`);
  if (health.latency) {
    console.log(`  Latency: ${health.latency}ms`);
  }
  if (health.error) {
    console.log(`  Error: ${health.error}`);
  }

  return {
    configValid: validation.valid,
    connected: health.connected,
  };
}

// Run example if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  exampleHealthCheck()
    .then(() => exampleCreateSnapshot())
    .catch(console.error);
}

