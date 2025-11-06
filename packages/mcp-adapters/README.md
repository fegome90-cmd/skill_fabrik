# MCP Adapters

MCP (Model Context Protocol) adapters para servicios locales: fs, git, pm2, metrics y MemTech.

## Adapters Disponibles

### Filesystem (fs)
Operaciones de sistema de archivos:
- `readFile(path)` - Leer archivo
- `writeFile(path, content)` - Escribir archivo
- `listDir(path, recursive?)` - Listar directorio
- `fileExists(path)` - Verificar existencia
- `createDir(path, recursive?)` - Crear directorio
- `deleteFile(path)` - Eliminar archivo
- `getFileInfo(path)` - Información del archivo

### Git
Operaciones de Git:
- `status(repoPath?)` - Estado del repositorio
- `diff(repoPath?, staged?)` - Diferencias
- `commit(message, repoPath?, files?)` - Crear commit
- `branchList(repoPath?)` - Listar ramas
- `currentBranch(repoPath?)` - Rama actual
- `log(repoPath?, limit?)` - Historial de commits

### PM2
Gestión de procesos con PM2:
- `start(configPath)` - Iniciar procesos desde ecosystem.config.cjs
- `stop(nameOrId)` - Detener proceso
- `restart(nameOrId)` - Reiniciar proceso
- `list()` - Listar procesos activos
- `logs(nameOrId, lines?)` - Obtener logs
- `describe(nameOrId)` - Información detallada
- `delete(nameOrId)` - Eliminar proceso

### Metrics
Métricas y KPIs:
- `emitEvent(event)` - Emitir evento KPI
- `getEvents(limit?)` - Obtener eventos
- `getMetrics(timeRange?)` - Resumen de métricas

### MemTech (Memory)
Gestión de memoria jerárquica:
- `createPlanSnapshot(input)` - Crear snapshot L1
- `setL1Item`, `getL1Item`, `deleteL1Item` - Operaciones L1
- `testConnection()` - Verificar conexión

## Uso Rápido

```typescript
import { fsAdapter, gitAdapter, pm2Adapter, metricsAdapter } from '@skills-fabrik/mcp-adapters';

// Filesystem
const content = await fsAdapter.readFile('package.json');
await fsAdapter.writeFile('test.txt', 'Hello');

// Git
const status = await gitAdapter.status();
await gitAdapter.commit('feat: add feature');

// PM2
const processes = await pm2Adapter.list();
await pm2Adapter.restart('router-service');

// Metrics
await metricsAdapter.emitEvent({ ts: Date.now(), repo: 'test' });
const metrics = await metricsAdapter.getMetrics();
```

## MemTech Integration

This package provides integration with MemTech multi-layer memory system:
- **L0 (Hot Memory)**: Redis cache - Critical, frequently accessed items
- **L1 (Warm Memory)**: Redis core - Working memory, plan snapshots (✅ Active)
- **L2 (Context Memory)**: PostgreSQL - Structured context and medium-term storage (✅ Active)
- **L3 (Long-term Memory)**: ChromaDB - Large, archival, semantic search (⚠️ Legacy mode disabled)

### Current Status

- ✅ **L0/L1 (Redis)**: Fully functional - Plan snapshots work correctly
- ✅ **L2 (PostgreSQL)**: Fully functional - Context storage active
- ⚠️ **L3 (ChromaDB)**: **Disabled in legacy mode** - ChromaDB 0.3.x with Pydantic 1.x doesn't support CloudClient
  - Items that would go to L3 automatically fallback to L2 (PostgreSQL)
  - To enable L3: Upgrade to ChromaDB >=1.0 with Pydantic 2.x (when available)

### Features

- ✅ **Automatic reconnection**: Redis client automatically reconnects on connection loss (based on ADR-012)
- ✅ **Health checks**: Periodic health checks every 30 seconds (based on ADR-019)
- ✅ **Retry logic**: Automatic retries with exponential backoff for failed operations
- ✅ **Graceful degradation**: Read operations return null instead of throwing errors
- ✅ **Automatic fallback**: L3 → L2 fallback when ChromaDB is unavailable
- ✅ **Configuration validation**: Validates Redis configuration before use (based on ADR-063)
- ✅ **Connection testing**: Utility to test Redis connection status
- ✅ **Error handling**: Comprehensive error handling based on ADR-039 patterns

### Configuration

Set the following environment variables (or copy `.env` from startkit-main):

```bash
# Redis Cache (L0) - Optional
REDIS_URL_CACHE=redis://127.0.0.1:6379
MEMTECH_REDIS_HOST=localhost
MEMTECH_REDIS_PORT=6379

# Redis Core (L1) - Required for snapshots
REDIS_URL_CORE=redis://127.0.0.1:6381
MEMTECH_REDIS_CORE_HOST=localhost
MEMTECH_REDIS_CORE_PORT=6381
MEMTECH_REDIS_CORE_PASSWORD=

# PostgreSQL (L2) - Optional
PG_HOST=127.0.0.1
PG_PORT=5433
PG_USER=postgres
PG_PASSWORD=your_password
PG_DATABASE=surprise_metrics

# ChromaDB (L3) - Optional (requires chroma-wrapper.mjs)
CHROMA_URL=https://api.trychroma.com
CHROMA_API_KEY=ck-...
CHROMA_TENANT=your_tenant
CHROMA_DATABASE=memtech
CHROMA_COLLECTION=memtech_memory
```

### Usage

```typescript
import { createPlanSnapshot, testConnection } from '@skills-fabrik/mcp-adapters';

// Test connection before use
const health = await testConnection();
if (!health.connected) {
  console.error('Redis not available:', health.error);
}

// Create snapshot (automatically handles retries and errors)
const snapshot = await createPlanSnapshot({
  id: 'plan-123',
  task: 'Implement feature X',
  phases: [...],
  status: 'APPROVED',
  approved_at: '2025-10-29T...',
  risks: [...],
  metrics: {...}
});

// snapshot contains:
// - id: UUID of snapshot
// - uri: mem://<id>
// - metadata: Full metadata including storage reference
```

### Architecture

- **MemoryStore**: Simplified L1-only storage handler
- **MemoryManager**: High-level API for adding/retrieving items
- **Redis Client**: Enhanced connection with auto-reconnect, health checks, and retry logic
- **Plan Snapshot**: Utility for creating L1 snapshots from plans

### Storage

L1 snapshots are stored in Redis with:
- Prefix: `memtech:L1:`
- TTL: 24 hours (86400 seconds)
- Format: JSON with `MemoryItemPayload` structure

### Error Handling

The implementation follows patterns from startkit-main ADRs:

- **ADR-012**: Redis optimization with automatic reconnection (max 10 attempts)
- **ADR-014**: Connection repair procedures with validation
- **ADR-019**: Health checks and status monitoring
- **ADR-039**: Legacy compatibility with graceful fallbacks
- **ADR-063**: Configuration validation before use

### Resilience Features

1. **Automatic Reconnection**: Up to 10 reconnection attempts with exponential backoff
2. **Health Monitoring**: Periodic ping every 30 seconds to detect connection loss
3. **Retry Logic**: Operations retry up to 3 times with delays (200ms, 400ms)
4. **Graceful Degradation**: Read operations return null instead of crashing
5. **Connection Pooling**: Reuses connections when available

### Testing Connections

Test all database connections at once:

```typescript
import { testAllConnections, validateConfig } from '@skills-fabrik/mcp-adapters';

// Validate configuration
const validation = validateConfig();
if (!validation.valid) {
  console.error('Configuration errors:', validation.errors);
}

// Test all connections
const results = await testAllConnections();
console.log('Redis Cache:', results.redisCache);
console.log('Redis Core:', results.redisCore);
console.log('PostgreSQL:', results.postgresql);
console.log('ChromaDB:', results.chroma);
```

Or use the example script:
```bash
cd packages/mcp-adapters
pnpm build
node dist/examples/test-connections.js
```

### Troubleshooting

```typescript
import { testConnection, validateConfig } from '@skills-fabrik/mcp-adapters';

// Validate configuration
const validation = validateConfig();
if (!validation.valid) {
  console.error('Configuration errors:', validation.errors);
}

// Test Redis Core connection
const health = await testConnection();
console.log('Connection status:', health);
```

### Examples

See `src/examples/usage-example.ts` for complete usage examples:
- Creating plan snapshots
- Health checks
- Configuration validation
- Error handling

Run example:
```bash
cd packages/mcp-adapters
pnpm build
node dist/examples/usage-example.js
```

### References

This implementation is based on ADRs from startkit-main:
- ADR-001: Memory System Recovery
- ADR-012: Redis Optimization Solution
- ADR-014: Qdrant Connection Repair Procedures
- ADR-019: PostgreSQL Disconnected Status Resolution
- ADR-039: Legacy Compatibility in Error Handling
- ADR-063: MCP Config Validation Script
- ADR-064: MCP Troubleshooting Documentation
- ADR-065: MCP Automated Repair Scripts
