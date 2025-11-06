/**
 * Ejemplo de uso de todos los adapters MCP locales
 */

import { fsAdapter, gitAdapter, pm2Adapter, metricsAdapter } from '../index.js';
import { createPlanSnapshot } from '../memtech/index.js';

async function exampleFS() {
  console.log('=== Filesystem Adapter ===');
  
  // Leer archivo
  const content = await fsAdapter.readFile('package.json');
  console.log('package.json length:', content.length);
  
  // Listar directorio
  const files = await fsAdapter.listDir('packages', false);
  console.log('Packages:', files);
  
  // Verificar existencia
  const exists = await fsAdapter.fileExists('README.md');
  console.log('README.md exists:', exists);
}

async function exampleGit() {
  console.log('\n=== Git Adapter ===');
  
  // Estado del repositorio
  const status = await gitAdapter.status();
  console.log('Git status:', {
    branch: status.branch,
    clean: status.clean,
    modified: status.modified.length,
    untracked: status.untracked.length,
  });
  
  // Branch actual
  const branch = await gitAdapter.currentBranch();
  console.log('Current branch:', branch);
  
  // Últimos commits
  const log = await gitAdapter.log(undefined, 3);
  console.log('Last 3 commits:', log.map(e => ({ hash: e.hash.substring(0, 7), message: e.message })));
}

async function examplePM2() {
  console.log('\n=== PM2 Adapter ===');
  
  try {
    // Listar procesos
    const processes = await pm2Adapter.list();
    console.log('PM2 processes:', processes.length);
    processes.forEach(p => {
      console.log(`  - ${p.name} (${p.id}): ${p.status}, CPU: ${p.cpu}%, Mem: ${p.memory}MB`);
    });
    
    if (processes.length > 0) {
      // Logs del primer proceso
      const logs = await pm2Adapter.logs(processes[0].name, 10);
      console.log(`Logs (${processes[0].name}):`, logs.substring(0, 200));
    }
  } catch (error) {
    console.log('PM2 not available or no processes:', error instanceof Error ? error.message : String(error));
  }
}

async function exampleMetrics() {
  console.log('\n=== Metrics Adapter ===');
  
  // Emitir evento
  await metricsAdapter.emitEvent({
    ts: Date.now(),
    repo: 'skills-fabrik',
    skills: ['fs-adapter', 'git-adapter'],
    latency_ms: 150,
    zero_errors_left_behind: true,
  });
  console.log('Event emitted');
  
  // Obtener métricas
  const metrics = await metricsAdapter.getMetrics();
  console.log('Metrics summary:', {
    totalEvents: metrics.totalEvents,
    averageLatency: metrics.averageLatency,
    skillActivations: Object.keys(metrics.skillActivations).length,
    errorRate: metrics.errorRate,
  });
  
  // Últimos eventos
  const events = await metricsAdapter.getEvents(5);
  console.log('Last 5 events:', events.length);
}

async function exampleMemory() {
  console.log('\n=== Memory Adapter (MemTech) ===');
  
  try {
    // Crear snapshot de plan
    const snapshot = await createPlanSnapshot({
      id: 'test-plan-123',
      task: 'Test plan snapshot',
      phases: [
        {
          name: 'Test Phase',
          description: 'Testing memory adapter',
        },
      ],
      status: 'APPROVED',
      approved_at: new Date().toISOString(),
      risks: [],
      metrics: {},
    });
    
    console.log('Snapshot created:', {
      id: snapshot.id,
      uri: snapshot.uri,
    });
  } catch (error) {
    console.log('Memory adapter not available:', error instanceof Error ? error.message : String(error));
  }
}

async function main() {
  console.log('🧪 Testing MCP Adapters Examples\n');
  
  await exampleFS();
  await exampleGit();
  await examplePM2();
  await exampleMetrics();
  await exampleMemory();
  
  console.log('\n✅ Examples completed');
}

main().catch(console.error);

