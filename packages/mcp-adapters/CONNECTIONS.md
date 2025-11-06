# Database Connections Guide

This package supports connections to all MemTech layers based on ADR patterns from startkit-main.

## Architecture Layers

```
L0: Redis Cache (6379)    - Hot cache, <1ms latency
L1: Redis Core (6381)      - Working memory, <5ms latency  
L2: PostgreSQL (5433)      - Context memory, <50ms latency
L3: ChromaDB Cloud         - Long-term memory, <100ms latency
```

## Connection Status

All connections are optional and gracefully degrade:

- **L1 (Redis Core)**: Required for plan snapshots
- **L0 (Redis Cache)**: Optional, for hot cache
- **L2 (PostgreSQL)**: Optional, for persistent storage
- **L3 (ChromaDB)**: Optional, requires chroma-wrapper.mjs from startkit-main

## Environment Variables

The `.env` file from startkit-main has been copied and contains all necessary credentials:

- Redis URLs and ports
- PostgreSQL connection details
- ChromaDB API keys and configuration
- Other MemTech settings

**Note**: `.env` is gitignored - never commit it to version control.

## Usage Examples

### Test All Connections

```typescript
import { testAllConnections } from '@skills-fabrik/mcp-adapters';

const results = await testAllConnections();

// Results include:
// - redisCache: { connected: boolean, latency?: number, error?: string }
// - redisCore: { connected: boolean, latency?: number, error?: string }
// - postgresql: { connected: boolean, error?: string }
// - chroma: { connected: boolean, error?: string }
```

### Use Specific Database

```typescript
import { getRedisClient, getPgPool, ensurePostgresTables } from '@skills-fabrik/mcp-adapters';

// Redis Core (L1)
const redis = await getRedisClient('core');
await redis.set('key', 'value');

// PostgreSQL (L2)
await ensurePostgresTables(); // Create tables if needed
const pool = getPgPool();
const client = await pool.connect();
const result = await client.query('SELECT * FROM memtech_memory_items LIMIT 10');
client.release();

// ChromaDB (L3) - requires chroma-wrapper.mjs
const chroma = await getChromaWrapper();
const heartbeat = await chroma.heartbeat();
```

## Health Checks

Based on ADR-019 patterns:

1. **Redis**: Automatic ping checks every 30 seconds
2. **PostgreSQL**: Connection pool health checks
3. **ChromaDB**: Heartbeat via Python bridge

## Error Handling

All connections implement:

- **Automatic reconnection** (ADR-012)
- **Retry logic** with exponential backoff
- **Graceful degradation** if unavailable
- **Health monitoring** (ADR-019)

## References

- ADR-012: Redis Optimization Solution
- ADR-014: Connection Repair Procedures  
- ADR-019: PostgreSQL Disconnected Status Resolution
- ADR-029: Arquitectura de Memoria Jerárquica
- ADR-090: ChromaDB JS Client Limitation
- ADR-091: ChromaDB Integration in MCP

