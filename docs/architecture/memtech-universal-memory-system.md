# MemTech Universal Memory System - Skills Fabric

**Version:** 2.0 (Corrected Architecture)
**Date:** 2025-11-02
**Status:** ✅ **IMPLEMENTED** (PostgreSQL as single source of truth)

---

## Overview

MemTech (Memory Technology) is Skills Fabric's universal memory system designed to provide multi-tiered, intelligent storage and retrieval for development documentation, skills, and operational data. The system follows a corrected architecture where **PostgreSQL is the ONLY source of truth** for persistent data, with L0/L1 serving as performance-optimized cache layers.

## Architecture Principles

### ✅ **CORRECTED: Source of Truth**
- **PostgreSQL (L2)** → **ONLY persistent storage**
- **L0/L1 Cache** → **Performance optimization only**
- **No TTL in L2** → **Data persists forever**
- **Recovery guaranteed** → **From PostgreSQL always**

### ❌ **INCORRECT (Previous Design)**
- Multiple "storage layers" → Confusion
- Redis as "storage" → Data loss
- L0/L1 with TTL → Lost information
- No clear recovery path

---

## System Architecture

### Multi-Tier Storage Hierarchy

```
┌──────────────────────────────────────────────────────────────┐
│                     USER INTERFACE                            │
│  (CLI Commands, Queries, Dashboard, APIs)                    │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│                    L0: Local Cache                           │
│  Location: .sf/ directory                                    │
│  Type: In-memory + File system                               │
│  Purpose: Immediate access (microseconds)                    │
│  Persistence: Ephemeral (lost on restart)                    │
│  Size: ~100MB limit                                          │
│  Eviction: LRU algorithm                                     │
│  TTL: None (cache only)                                      │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│                    L1: Performance Cache                     │
│  Location: .sf/cache/ directory                              │
│  Type: File-based cache + Redis (optional)                   │
│  Purpose: Fast access (milliseconds)                         │
│  Persistence: Ephemeral (lost on restart)                    │
│  Size: ~500MB limit                                          │
│  Eviction: Time-based + LRU                                  │
│  TTL: Configurable (default: 1 hour)                         │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│                  L2: PostgreSQL (PRIMARY)                    │
│  Location: PostgreSQL database                               │
│  Type: Relational database                                   │
│  Purpose: **PERMANENT STORAGE**                              │
│  Persistence: ✅ FOREVER                                     │
│  Size: Unlimited                                             │
│  Recovery: ✅ GUARANTEED                                     │
│  Schema: Optimized with constraints                          │
│  Backup: ✅ Supported (pg_dump, continuous)                  │
│  Constraints: UNIQUE, NOT NULL, foreign keys                 │
└──────────────────────────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│              OPTIONAL: Extended Storage                      │
│  - Redis (pub/sub, sessions)                                 │
│  - ChromaDB (vector search)                                  │
│  - S3 (object storage for large files)                       │
│  - Elasticsearch (full-text search)                          │
└──────────────────────────────────────────────────────────────┘
```

---

## Layer Specifications

### L0: Local Cache (Immediate Access)

**Purpose:** Provide instant access to frequently used data

**Characteristics:**
- Location: `.sf/` in project root
- Technology: In-memory hash map + local file system
- Access Time: < 1ms (microseconds)
- Size Limit: 100MB
- Eviction Policy: LRU (Least Recently Used)
- Data Loss: Yes (on restart/crash)
- Use Cases:
  - Active skill metadata
  - Current session data
  - Frequently accessed registry entries

**Implementation:**
```typescript
class L0Cache {
  private cache = new Map<string, any>();
  private maxSize = 100 * 1024 * 1024; // 100MB

  get(key: string): any {
    return this.cache.get(key);
  }

  set(key: string, value: any): void {
    // LRU eviction
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }
    this.cache.set(key, value);
  }
}
```

### L1: Performance Cache (Fast Access)

**Purpose:** Balance between performance and data availability

**Characteristics:**
- Location: `.sf/cache/` directory
- Technology: File system + Redis (optional)
- Access Time: 1-10ms (milliseconds)
- Size Limit: 500MB
- Eviction Policy: Time-based + LRU
- Data Loss: Yes (on restart/crash)
- TTL: Configurable (default: 1 hour)
- Use Cases:
  - Recent queries
  - Cached search results
  - Temporary computations
  - Session data

**Implementation:**
```typescript
class L1Cache {
  async get(key: string): Promise<any> {
    const cached = await redis.get(key) || await fs.readFile(...);
    return cached;
  }

  async set(key: string, value: any, ttlSec = 3600): Promise<void> {
    await redis.setex(key, ttlSec, JSON.stringify(value));
  }
}
```

### L2: PostgreSQL (Primary Storage)

**Purpose:** **SINGLE SOURCE OF TRUTH** - All persistent data

**Characteristics:**
- Location: PostgreSQL database
- Technology: Relational database (PostgreSQL 14+)
- Access Time: 10-50ms (milliseconds)
- Size Limit: Unlimited
- **Persistence: FOREVER** ✅
- **Recovery: GUARANTEED** ✅
- Schema: Optimized with constraints
- Backup: Full support
- Use Cases:
  - All permanent records
  - Skills metadata
  - Dev-docs content
  - Activation history
  - KPI events
  - User data
  - System configuration

**Database Schema:**
```sql
-- Core table: All persistent data
CREATE TABLE memtech_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path TEXT NOT NULL,
  content TEXT NOT NULL,
  hash VARCHAR(64) NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tags TEXT[] DEFAULT '{}',
  score_l0 REAL DEFAULT 0,
  score_l1 REAL DEFAULT 0,
  score_l2 REAL DEFAULT 0,
  access_count INTEGER DEFAULT 0,
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(path) -- Prevent duplicates
);

-- Indices for performance
CREATE INDEX idx_memtech_path ON memtech_documents(path);
CREATE INDEX idx_memtech_tags ON memtech_documents USING GIN(tags);
CREATE INDEX idx_memtech_updated ON memtech_documents(updated_at);
CREATE INDEX idx_memtech_score_l2 ON memtech_documents(score_l2 DESC);
CREATE INDEX idx_memtech_content_fts ON memtech_documents USING GIN(to_tsvector('english', content));

-- Full-text search
ALTER TABLE memtech_documents ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;
CREATE INDEX idx_memtech_search ON memtech_documents(search_vector);

-- Update trigger
CREATE OR REPLACE FUNCTION update_memtech_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER memtech_updated_at
  BEFORE UPDATE ON memtech_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_memtech_updated_at();
```

---

## Data Flow Architecture

### Indexing Flow

```
Source File
    │
    ▼
Parse Content ──→ Extract Metadata ──→ Calculate Scores
    │                                         │
    ▼                                         ▼
Hash Content ──→ Validate Schema ──→ Store in PostgreSQL (L2)
    │                     │                 │
    │                     ▼                 ▼
    └─────────────────────→ Cache L1 ──→ Cache L0
```

**Step-by-Step:**

1. **Parse Content**
   - Read source file (Markdown, TypeScript, etc.)
   - Extract plain text content
   - Identify metadata (frontmatter, tags, etc.)

2. **Calculate Scores**
   - L0 Score: Access frequency (0-1)
   - L1 Score: Recent access + relevance (0-1)
   - L2 Score: Content quality + metadata completeness (0-1)

3. **Store in PostgreSQL (L2)**
   - Insert/update record with all metadata
   - **No TTL** - data persists forever
   - Enforce UNIQUE constraint on path
   - Update timestamps

4. **Update Caches**
   - Add to L0 (immediate access)
   - Add to L1 (fast access, with TTL)

### Retrieval Flow

```
Query Request
    │
    ▼
L0 Cache Check ──→ Hit? ──→ YES ──→ Return (microseconds)
    │                   │
    │                   NO
    │                   ▼
    └─────────────── L1 Cache Check
                         │
                         ▼
                    Hit? ──→ YES ──→ Update L0 ──→ Return (milliseconds)
                         │
                         NO
                         ▼
                    PostgreSQL Query (L2)
                         │
                         ▼
                    Update L1 & L0 ──→ Return (10-50ms)
```

**Strategy:**

1. **Check L0 First**
   - Fastest access (< 1ms)
   - If hit: return immediately
   - If miss: continue to L1

2. **Check L1**
   - Fast access (1-10ms)
   - If hit: return + update L0
   - If miss: continue to L2

3. **Query PostgreSQL (L2)**
   - **SLOWEST BUT GUARANTEED**
   - If found: update L1 & L0
   - If not found: return empty

---

## Scoring System

### L0 Score Calculation
**Measures:** Immediate accessibility

```typescript
function calculateL0Score(doc: Document): number {
  // Recent access boost
  const recencyBoost = Math.max(0, 1 - (Date.now() - doc.lastAccess) / (24 * 60 * 60 * 1000));

  // Access frequency (logarithmic to prevent overflow)
  const frequencyScore = Math.min(1, Math.log(doc.accessCount + 1) / Math.log(100));

  // Current session usage
  const sessionBoost = doc.isInCurrentSession ? 0.2 : 0;

  return Math.min(1, (recencyBoost * 0.5) + (frequencyScore * 0.3) + sessionBoost);
}
```

### L1 Score Calculation
**Measures:** Fast accessibility and relevance

```typescript
function calculateL1Score(doc: Document): number {
  // L0 score as base
  const baseScore = doc.scoreL0;

  // Time-based decay (exponential)
  const decayFactor = Math.exp(-(Date.now() - doc.updatedAt) / (7 * 24 * 60 * 60 * 1000));
  const timeScore = baseScore * decayFactor;

  // Metadata completeness
  const metadataScore = Object.keys(doc.metadata).length / 10; // Normalize

  // Search relevance (if query provided)
  const relevanceScore = doc.searchRelevance || 0;

  return Math.min(1, (timeScore * 0.6) + (metadataScore * 0.2) + (relevanceScore * 0.2));
}
```

### L2 Score Calculation
**Measures:** Overall content quality and metadata completeness

```typescript
function calculateL2Score(doc: Document): number {
  // Content metrics
  const contentLength = doc.content.length;
  const contentScore = Math.min(1, contentLength / 10000);

  // Metadata completeness
  const hasTitle = doc.metadata.title ? 1 : 0;
  const hasTags = doc.metadata.tags?.length > 0 ? 1 : 0;
  const hasSummary = doc.metadata.summary ? 1 : 0;
  const metadataScore = (hasTitle + hasTags + hasSummary) / 3;

  // Structured data
  const hasCodeBlocks = (doc.content.match(/```/g) || []).length / 10;
  const hasLinks = (doc.content.match(/\[.*\]\(.*\)/g) || []).length / 10;
  const structureScore = Math.min(1, (hasCodeBlocks + hasLinks) / 2);

  // Update frequency (active documents score higher)
  const updateFrequency = doc.updateCount / Math.max(1, doc.ageInDays);
  const activityScore = Math.min(1, updateFrequency);

  return (contentScore * 0.4) + (metadataScore * 0.3) + (structureScore * 0.2) + (activityScore * 0.1);
}
```

---

## PostgreSQL as Single Source of Truth

### Why PostgreSQL?

✅ **Guaranteed Persistence**
- Data never lost (no TTL)
- ACID compliance
- Transaction support
- Crash recovery

✅ **Reliability**
- 99.99% uptime with proper setup
- Master-slave replication available
- Point-in-time recovery (PITR)
- Continuous archiving

✅ **Performance**
- Optimized queries with indices
- Connection pooling
- Read replicas for scaling
- Partitioning for large datasets

✅ **Data Integrity**
- UNIQUE constraints prevent duplicates
- NOT NULL constraints ensure data quality
- Foreign keys maintain referential integrity
- CHECK constraints validate data

✅ **Backup & Recovery**
- `pg_dump` for logical backups
- `pg_basebackup` for physical backups
- Continuous WAL archiving
- Point-in-time recovery

### Schema Design Principles

1. **Single Table per Entity Type**
   - `memtech_documents` for all documents
   - `memtech_skills` for skill metadata
   - `memtech_events` for KPI events

2. **Normalized but Practical**
   - 3NF for consistency
   - JSONB for flexible metadata
   - Denormalized indices for performance

3. **Audit Trail**
   - `created_at`, `updated_at` on all tables
   - `last_accessed` for cache optimization
   - `access_count` for usage metrics

### Recovery Procedures

```bash
# Full restore from backup
pg_restore -d skills_fabrik_backup_20251102.sql

# Point-in-time recovery
recovery_target_time = '2025-11-02 12:00:00'

# Verify data integrity
SELECT COUNT(*) FROM memtech_documents;
SELECT COUNT(DISTINCT path) FROM memtech_documents;
```

---

## Cache Policies

### L0 Cache Policy (No TTL)

**Philosophy:** Cache for performance, not for persistence

**Eviction:**
- LRU (Least Recently Used) when limit reached
- Manual clear on restart
- No time-based eviction

**Data Loss Handling:**
- On restart: All data lost
- Recovery: Always from PostgreSQL (L2)
- Rebuild: Re-populate from L2 on demand

### L1 Cache Policy (TTL-based)

**Philosophy:** Fast access with reasonable freshness

**TTL Configuration:**
```typescript
const L1_CONFIG = {
  DEFAULT_TTL: 3600,        // 1 hour
  MAX_TTL: 86400,           // 24 hours
  MIN_TTL: 300,             // 5 minutes
  CLEANUP_INTERVAL: 300     // 5 minutes
};
```

**Eviction:**
- TTL expiration (time-based)
- LRU when limit reached
- Manual invalidation on update

**Data Loss Handling:**
- On restart: TTL cache lost
- Recovery: Query PostgreSQL (L2)
- Rebuild: Re-populate L1 from L2 on demand

---

## Integration with Skills Fabric

### 1. Dev-Docs Storage

```typescript
// Indexing dev-docs
await MemTech.index({
  path: 'docs/architecture/memtech.md',
  content: markdownContent,
  metadata: {
    type: 'dev-doc',
    category: 'architecture',
    tags: ['memory', 'storage', 'architecture'],
    author: 'system',
    version: '2.0'
  }
});

// Retrieving dev-docs
const doc = await MemTech.get('docs/architecture/memtech.md');
const relatedDocs = await MemTech.search('memory system architecture');
```

### 2. Skills Metadata

```typescript
// Indexing skill metadata
await MemTech.index({
  path: 'skills/guardrails/database-verification/SKILL.md',
  content: skillContent,
  metadata: {
    type: 'skill',
    category: 'guardrail',
    enforcement: 'block',
    priority: 'critical',
    keywords: ['database', 'verification', 'guardrail']
  }
});

// Searching skills
const skills = await MemTech.search('database verification block');
```

### 3. KPI Events

```typescript
// Recording activation event
await MemTech.recordEvent({
  type: 'activation',
  skill: 'database-verification',
  timestamp: Date.now(),
  metadata: {
    score: 0.352,
    enforcement: 'block',
    activated: true
  }
});

// Querying activation history
const events = await MemTech.query({
  table: 'memtech_events',
  filters: { type: 'activation', skill: 'database-verification' },
  orderBy: 'timestamp DESC',
  limit: 100
});
```

---

## Performance Optimization

### Query Optimization

1. **Indexing Strategy**
   - Primary key: UUID (fast lookups)
   - Composite indices: (path, updated_at)
   - GIN indices: JSONB, tags, full-text search
   - Partial indices: Active documents only

2. **Connection Pooling**
```typescript
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.PG_HOST,
  port: Number(process.env.PG_PORT || 5432),
  database: process.env.PG_DATABASE,
  max: 20,          // Max connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});
```

3. **Read Replicas**
```typescript
// Route read queries to replicas
const readPool = new Pool({
  host: process.env.PG_REPLICA_HOST,
  // ... other config
});

async function readQuery(sql: string, params: any[]) {
  return readPool.query(sql, params);
}

async function writeQuery(sql: string, params: any[]) {
  return pool.query(sql, params);
}
```

### Caching Strategy

1. **Cache-Aside Pattern**
   - Check cache first
   - On miss: query DB
   - Update cache
   - Return data

2. **Write-Through Pattern**
   - Update DB first
   - Update cache synchronously
   - Ensure consistency

3. **Cache Warming**
   - Pre-populate frequently accessed data
   - Build L0/L1 on startup
   - Rebuild after recovery

### Full-Text Search

```sql
-- Search with ranking
SELECT
  path,
  content,
  ts_rank(search_vector, plainto_tsquery('english', $1)) AS rank
FROM memtech_documents
WHERE search_vector @@ plainto_tsquery('english', $1)
ORDER BY rank DESC
LIMIT 10;

-- Search with highlighting
SELECT
  path,
  ts_headline('english', content, plainto_tsquery('english', $1)) AS snippet
FROM memtech_documents
WHERE search_vector @@ plainto_tsquery('english', $1)
LIMIT 10;
```

---

## Monitoring & Observability

### Key Metrics

1. **Cache Hit Rate**
```typescript
const metrics = {
  l0Hits: 0,
  l0Misses: 0,
  l1Hits: 0,
  l1Misses: 0,
  l2Queries: 0
};

function getHitRate(): number {
  const total = metrics.l0Hits + metrics.l0Misses;
  return total > 0 ? metrics.l0Hits / total : 0;
}
```

2. **Query Performance**
```typescript
// Track query latency
const start = Date.now();
await queryDb(sql, params);
const latency = Date.now() - start;

metrics.record({
  type: 'query',
  latency,
  table: 'memtech_documents'
});
```

3. **Storage Usage**
```sql
-- Disk usage by table
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size(tablename::regclass)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(tablename::regclass) DESC;
```

### Health Checks

```typescript
async function healthCheck(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    l0: { status: string; size: number; hitRate: number };
    l1: { status: string; size: number; hitRate: number };
    l2: { status: string; connections: number; diskUsage: string };
  };
}> {
  const checks = {
    l0: {
      status: l0Cache.size < l0Cache.maxSize ? 'healthy' : 'warning',
      size: l0Cache.size,
      hitRate: getHitRate()
    },
    l1: {
      status: 'healthy',
      size: await l1Cache.size(),
      hitRate: await l1Cache.hitRate()
    },
    l2: {
      status: await checkDbHealth(),
      connections: pool.totalCount,
      diskUsage: await getDiskUsage()
    }
  };

  const status = Object.values(checks).every(c => c.status === 'healthy')
    ? 'healthy'
    : Object.values(checks).some(c => c.status === 'unhealthy')
    ? 'unhealthy'
    : 'degraded';

  return { status, checks };
}
```

---

## Backup & Disaster Recovery

### Backup Strategy

1. **Continuous WAL Archiving**
```bash
# Archive WAL files
archive_mode = on
archive_command = 'rsync %p backup_server:/wal_archive/%f'
wal_level = replica
```

2. **Daily Full Backups**
```bash
#!/bin/bash
# Daily backup script
pg_basebackup -D /backups/$(date +%Y%m%d) -Ft -z -P
pg_dump skills_fabrik | gzip > /backups/sql_$(date +%Y%m%d).sql.gz
```

3. **Point-in-Time Recovery (PITR)**
```bash
# Recovery to specific timestamp
recovery_target_time = '2025-11-02 15:30:00'
recovery_target_action = 'promote'
```

### Recovery Procedures

1. **Full Restore**
```bash
# Stop services
pm2 stop all

# Restore database
rm -rf $PGDATA
tar -xzf /backups/20251102/base.tar.gz -C $PGDATA
gunzip -c /backups/20251102/wal.tar.gz | tar -xP -

# Start PostgreSQL
pg_ctl start

# Verify
psql -c "SELECT COUNT(*) FROM memtech_documents;"
```

2. **Selective Restore**
```sql
-- Restore specific document
UPDATE memtech_documents
SET content = $1, updated_at = NOW()
WHERE path = $2
RETURNING *;
```

3. **Cache Rebuild**
```typescript
// Rebuild L0 and L1 caches from L2
async function rebuildCaches(): Promise<void> {
  // Get all documents from L2
  const docs = await db.query('SELECT * FROM memtech_documents ORDER BY updated_at DESC');

  // Clear caches
  l0Cache.clear();
  await l1Cache.clear();

  // Rebuild L0 (most recent 1000)
  docs.rows.slice(0, 1000).forEach(doc => {
    l0Cache.set(doc.path, doc);
  });

  // Rebuild L1 (all, with TTL)
  for (const doc of docs.rows) {
    await l1Cache.set(doc.path, doc, 3600);
  }
}
```

---

## Configuration

### Environment Variables

```bash
# PostgreSQL (L2 - REQUIRED)
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=skills_fabrik
PG_USER=postgres
PG_PASSWORD=secure_password

# L0 Cache
SF_L0_MAX_SIZE=104857600  # 100MB
SF_L0_ENABLED=true

# L1 Cache
SF_L1_ENABLED=true
SF_L1_TTL=3600  # 1 hour
SF_L1_MAX_SIZE=524288000  # 500MB
REDIS_URL=redis://localhost:6379  # Optional

# Optional Storage
REDIS_ENABLED=false
CHROMADB_ENABLED=false
S3_ENABLED=false
```

### Configuration File

```typescript
// memtech.config.ts
export const MEMTECH_CONFIG = {
  l0: {
    enabled: true,
    maxSize: 100 * 1024 * 1024, // 100MB
    evictionPolicy: 'LRU',
    rebuildOnStart: true
  },
  l1: {
    enabled: true,
    ttl: 3600, // 1 hour
    maxSize: 500 * 1024 * 1024, // 500MB
    useRedis: false,
    cleanupInterval: 300 // 5 minutes
  },
  l2: {
    host: process.env.PG_HOST,
    port: Number(process.env.PG_PORT || 5432),
    database: process.env.PG_DATABASE,
    connectionPool: {
      max: 20,
      idleTimeoutMillis: 30000
    },
    backup: {
      enabled: true,
      interval: 86400, // 24 hours
      retention: 30 // 30 days
    }
  },
  indexing: {
    batchSize: 100,
    concurrency: 5,
    retryAttempts: 3
  },
  scoring: {
    l0Weight: 0.3,
    l1Weight: 0.3,
    l2Weight: 0.4,
    decayFactor: 0.1
  }
};
```

---

## Usage Examples

### Indexing Documents

```typescript
import MemTech from '@skills-fabrik/memtech';

// Index a single document
await MemTech.index({
  path: 'docs/architecture/memtech.md',
  content: '# MemTech Architecture\n\n...',
  metadata: {
    type: 'dev-doc',
    category: 'architecture',
    tags: ['memory', 'storage'],
    version: '2.0'
  }
});

// Batch index
await MemTech.indexBatch([
  { path: 'doc1.md', content: '...', metadata: {} },
  { path: 'doc2.md', content: '...', metadata: {} }
], { batchSize: 50 });
```

### Retrieving Documents

```typescript
// Get by path
const doc = await MemTech.get('docs/architecture/memtech.md');
console.log(doc.content);

// Search with query
const results = await MemTech.search('memory architecture');
results.forEach(doc => {
  console.log(`${doc.path}: ${doc.scoreL2}`);
});

// Get recent documents
const recent = await MemTech.getRecent(10);
```

### Querying with Filters

```typescript
// Complex query
const docs = await MemTech.query({
  table: 'memtech_documents',
  filters: {
    type: 'skill',
    'metadata.enforcement': 'block',
    tags: ['guardrail']
  },
  orderBy: 'updated_at DESC',
  limit: 50
});

// Full-text search
const searchResults = await MemTech.fullTextSearch(
  'database verification guardrail',
  { limit: 20 }
);
```

### Statistics & Monitoring

```typescript
// Get cache statistics
const stats = await MemTech.getStats();
console.log({
  l0Size: stats.l0.size,
  l0HitRate: stats.l0.hitRate,
  l1Size: stats.l1.size,
  l1HitRate: stats.l1.hitRate,
  l2Connections: stats.l2.connections
});

// Get storage statistics
const storage = await MemTech.getStorageStats();
console.log({
  totalDocuments: storage.totalDocuments,
  diskUsage: storage.diskUsage,
  avgDocumentSize: storage.avgSize
});
```

---

## Best Practices

### Do's ✅

1. **Always use PostgreSQL (L2) for permanent data**
   - Never rely solely on L0/L1
   - Implement proper recovery from L2
   - Test recovery procedures regularly

2. **Implement proper indexing**
   - Add documents to all tiers (L0, L1, L2)
   - Update caches on access
   - Use batch operations for bulk indexing

3. **Monitor cache hit rates**
   - Aim for >80% L0 hit rate
   - Aim for >95% L0+L1 hit rate
   - Adjust cache sizes as needed

4. **Design schemas with constraints**
   - UNIQUE constraints prevent duplicates
   - NOT NULL ensures data quality
   - CHECK constraints validate business rules

5. **Implement proper backup strategy**
   - Daily full backups
   - Continuous WAL archiving
   - Regular recovery testing

### Don'ts ❌

1. **Don't store critical data only in L0/L1**
   - Cache = temporary, will be lost
   - Always persist to PostgreSQL (L2)
   - L0/L1 are for performance only

2. **Don't ignore cache eviction**
   - L0/L1 have size limits
   - Implement LRU eviction
   - Monitor cache sizes

3. **Don't skip schema validation**
   - Validate before indexing
   - Use constraints in PostgreSQL
   - Handle validation errors gracefully

4. **Don't forget to update caches**
   - Update L0/L1 after L2 changes
   - Invalidate on delete/update
   - Keep caches consistent

5. **Don't rely on cache for persistence**
   - Cache will be lost on restart
   - Always have recovery from L2
   - Test recovery procedures

---

## Troubleshooting

### Common Issues

**Issue: High L0 miss rate (>50%)**
```typescript
// Solution: Increase L0 cache size or improve caching strategy
MEMTECH_CONFIG.l0.maxSize = 200 * 1024 * 1024; // 200MB

// Or improve caching algorithm
function improveCacheStrategy(doc: Document) {
  // Boost frequently accessed documents
  if (doc.accessCount > 10) {
    doc.scoreL0 *= 1.5;
  }
}
```

**Issue: PostgreSQL connection exhaustion**
```typescript
// Solution: Increase connection pool
MEMTECH_CONFIG.l2.connectionPool.max = 50;

// Or implement connection pooling
const pool = new Pool({
  max: 50,
  min: 10,
  acquireTimeoutMillis: 60000,
  idleTimeoutMillis: 300000
});
```

**Issue: Slow full-text search**
```typescript
// Solution: Optimize GIN indices
CREATE INDEX CONCURRENTLY idx_memtech_search_gin
  ON memtech_documents USING GIN(search_vector);

-- Or use pg_trgm for fuzzy search
CREATE EXTENSION pg_trgm;
CREATE INDEX idx_memtech_trgm ON memtech_documents
  USING GIN (content gin_trgm_ops);
```

**Issue: Cache inconsistency after restart**
```typescript
// Solution: Implement cache warming on startup
async function warmCaches(): Promise<void> {
  // Load most recent documents
  const recentDocs = await db.query(`
    SELECT * FROM memtech_documents
    ORDER BY last_accessed DESC
    LIMIT 1000
  `);

  // Rebuild L0
  recentDocs.rows.forEach(doc => {
    l0Cache.set(doc.path, doc);
  });

  // Rebuild L1 with TTL
  const allDocs = await db.query('SELECT * FROM memtech_documents');
  for (const doc of allDocs.rows) {
    await l1Cache.set(doc.path, doc, 3600);
  }
}
```

---

## Comparison: StartKit vs Skills Fabric

| Feature | StartKit | Skills Fabric (MemTech) |
|---------|----------|------------------------|
| **Storage Layers** | L0, L1, L2 | L0 (cache), L1 (cache), L2 (PostgreSQL) |
| **Source of Truth** | Unclear | ✅ PostgreSQL only |
| **Persistence** | Mixed | ✅ PostgreSQL guaranteed |
| **TTL** | L0/L1/L2 | L0/L1 only, L2 none |
| **Recovery** | Not guaranteed | ✅ From PostgreSQL |
| **Backup** | Manual | ✅ Automated |
| **Constraints** | None | ✅ UNIQUE, NOT NULL, foreign keys |
| **Performance** | Unknown | ✅ Optimized with indices |
| **Scalability** | Single server | ✅ Read replicas, partitioning |

---

## Future Enhancements

### Phase 1: Enhanced Indexing
- Vector embeddings for semantic search
- Automatic tag extraction
- Content clustering
- Duplicate detection

### Phase 2: Distributed Storage
- PostgreSQL sharding
- Multi-region replication
- Cross-datacenter sync
- Edge caching

### Phase 3: AI Integration
- ML-based scoring
- Intelligent caching
- Predictive indexing
- Auto-categorization

### Phase 4: Advanced Analytics
- Usage pattern analysis
- Performance prediction
- Automated optimization
- Anomaly detection

---

## Conclusion

MemTech's corrected architecture ensures **data safety through PostgreSQL as the single source of truth**, while **L0/L1 caches provide exceptional performance**. This design guarantees that:

✅ **No data loss** - PostgreSQL persistence
✅ **Fast access** - Multi-tier caching
✅ **Guaranteed recovery** - From PostgreSQL
✅ **Scalability** - Proven PostgreSQL ecosystem
✅ **Reliability** - ACID compliance, constraints

**The MemTech universal memory system is production-ready and provides a solid foundation for Skills Fabric's memory and storage needs.**

---

## References

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)
- [ACID Properties](https://en.wikipedia.org/wiki/ACID)
- [Database Normalization](https://en.wikipedia.org/wiki/Database_normalization)
- [Caching Strategies](https://cache strategies.com)
- [Disaster Recovery Planning](https://www.disasterrecovery.org)

---

**Document Version:** 2.0
**Last Updated:** 2025-11-02
**Author:** Skills Fabric Architecture Team
**Status:** ✅ IMPLEMENTED AND VALIDATED
