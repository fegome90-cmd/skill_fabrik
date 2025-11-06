/**
 * MCP Adapters - Main Export
 * 
 * Proporciona adapters locales para fs, git, pm2, memory y metrics.
 * Todos los adapters son ejecutables localmente sin requerir servidor MCP.
 */

// Filesystem Adapter
export * from './fs/index.js';
export { fsAdapter } from './fs/index.js';

// Git Adapter
export * from './git/index.js';
export { gitAdapter } from './git/index.js';

// PM2 Adapter
export * from './pm2/index.js';
export { pm2Adapter } from './pm2/index.js';

// Metrics Adapter
export * from './metrics/index.js';
export { metricsAdapter } from './metrics/index.js';

// MemTech Adapter (already exists)
export * from './memtech/index.js';

/**
 * Test all adapters connectivity
 */
export async function testAllAdapters(): Promise<{
  fs: boolean;
  git: boolean;
  pm2: boolean;
  metrics: boolean;
  memory: boolean;
}> {
  const results = {
    fs: false,
    git: false,
    pm2: false,
    metrics: false,
    memory: false,
  };

  try {
    // Test FS
    const { fsAdapter } = await import('./fs/index.js');
    await fsAdapter.fileExists('package.json');
    results.fs = true;
  } catch {
    results.fs = false;
  }

  try {
    // Test Git
    const { gitAdapter } = await import('./git/index.js');
    await gitAdapter.currentBranch();
    results.git = true;
  } catch {
    results.git = false;
  }

  try {
    // Test PM2 (check if pm2 is available)
    const { execSync } = await import('child_process');
    execSync('pm2 --version', { encoding: 'utf-8', stdio: 'pipe' });
    results.pm2 = true;
  } catch {
    results.pm2 = false;
  }

  try {
    // Test Metrics
    const { metricsAdapter } = await import('./metrics/index.js');
    await metricsAdapter.getEvents(1);
    results.metrics = true;
  } catch {
    results.metrics = false;
  }

  try {
    // Test Memory (MemTech)
    const { testConnection } = await import('./memtech/index.js');
    const health = await testConnection();
    results.memory = health.connected;
  } catch {
    results.memory = false;
  }

  return results;
}


