# MemTech Universal Memory System - Quick Reference

**Status:** ✅ **IMPLEMENTED** (2025-11-02)

## 📚 Documentation Location

### Primary Documents

1. **Comprehensive Guide**
   - **File:** [`memtech-universal-memory-system.md`](./memtech-universal-memory-system.md)
   - **Size:** 31KB, 1,175 lines
   - **Content:** Complete architecture, schemas, code examples, best practices

2. **Architecture Overview**
   - **File:** [`../ARCHITECTURE.md`](../ARCHITECTURE.md#3-multi-tier-storage-memtech-universal-memory-system)
   - **Section:** Multi-Tier Storage (MemTech)
   - **Content:** High-level overview with link to comprehensive guide

## 🎯 Key Concepts

### Core Principle
```
PostgreSQL (L2) = SINGLE SOURCE OF TRUTH
L0/L1 = Performance Cache ONLY
```

### Three-Tier Architecture

```
┌─────────────────────────────────────┐
│  L0: Local Cache (< 1ms)            │
│  .sf/ directory                     │
│  Ephemeral (lost on restart)        │
└─────────────────────────────────────┘
                ↓
┌─────────────────────────────────────┐
│  L1: Performance Cache (1-10ms)     │
│  .sf/cache/ directory               │
│  TTL-based (1 hour default)         │
└─────────────────────────────────────┘
                ↓
┌─────────────────────────────────────┐
│  L2: PostgreSQL (10-50ms)           │
│  **PERMANENT STORAGE**              │
│  NO TTL - Data persists FOREVER     │
│  Guaranteed recovery                │
└─────────────────────────────────────┘
```

## ✅ Architecture Highlights

### Corrected Design (v2.0)
- ✅ PostgreSQL = **ONLY** persistent storage
- ✅ L0/L1 = **ONLY** for performance
- ✅ **NO TTL** in L2 - data forever
- ✅ Recovery **guaranteed** from PostgreSQL
- ✅ **ACID compliance** ensures integrity

### Benefits
| Benefit | Description |
|---------|-------------|
| **Zero Data Loss** | PostgreSQL guarantees persistence |
| **High Performance** | < 1ms access to hot data via L0 |
| **Scalability** | PostgreSQL ecosystem (replicas, sharding) |
| **Data Integrity** | UNIQUE constraints, foreign keys |
| **Recovery** | Guaranteed from PostgreSQL backups |

## 📊 Quick Stats

- **Document Size:** 31KB
- **Total Lines:** 1,175
- **Words:** 3,629
- **Code Examples:** 25+
- **Sections:** 15
- **Sub-sections:** 45+

## 🔗 Key Sections

1. **Overview** - Architecture principles
2. **System Architecture** - Multi-tier diagram
3. **Layer Specifications** - L0/L1/L2 details
4. **Data Flow** - Indexing & retrieval flows
5. **Scoring System** - L0/L1/L2 algorithms
6. **PostgreSQL Schema** - Complete DDL
7. **Performance Optimization** - Indices, pooling
8. **Cache Policies** - TTL, eviction strategies
9. **Integration** - Skills Fabric use cases
10. **Monitoring** - Metrics & health checks
11. **Backup & Recovery** - WAL, PITR procedures
12. **Configuration** - Env vars, config files
13. **Usage Examples** - TypeScript snippets
14. **Best Practices** - Do's and Don'ts
15. **Troubleshooting** - Common issues

## 🎯 Use Cases in Skills Fabric

### 1. Dev-Docs Storage
```typescript
// Index documentation
await MemTech.index({
  path: 'docs/architecture/memtech.md',
  content: markdownContent,
  metadata: { type: 'dev-doc', category: 'architecture' }
});

// Retrieve with fast cache access
const doc = await MemTech.get('docs/architecture/memtech.md');
```

### 2. Skills Metadata
```typescript
// Index skill info
await MemTech.index({
  path: 'skills/guardrails/database-verification/SKILL.md',
  content: skillContent,
  metadata: { type: 'skill', enforcement: 'block' }
});

// Search skills
const skills = await MemTech.search('database verification');
```

### 3. KPI Events
```typescript
// Record event
await MemTech.recordEvent({
  type: 'activation',
  skill: 'database-verification',
  timestamp: Date.now(),
  metadata: { score: 0.352 }
});

// Query history
const events = await MemTech.query({
  table: 'memtech_events',
  filters: { type: 'activation' },
  limit: 100
});
```

## 🔧 Configuration

### Environment Variables
```bash
# PostgreSQL (L2) - REQUIRED
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=skills_fabrik

# L0 Cache
SF_L0_MAX_SIZE=104857600  # 100MB

# L1 Cache
SF_L1_TTL=3600  # 1 hour
REDIS_URL=redis://localhost:6379  # Optional
```

### PostgreSQL Schema
```sql
CREATE TABLE memtech_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path TEXT NOT NULL UNIQUE,  -- Prevent duplicates
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tags TEXT[] DEFAULT '{}',
  score_l0 REAL DEFAULT 0,
  score_l1 REAL DEFAULT 0,
  score_l2 REAL DEFAULT 0
);

-- Indices
CREATE INDEX idx_memtech_path ON memtech_documents(path);
CREATE INDEX idx_memtech_tags ON memtech_documents USING GIN(tags);
CREATE INDEX idx_memtech_search ON memtech_documents USING GIN(search_vector);
```

## 📈 Performance

### Query Flow
```
Request → L0 Cache (< 1ms)
           ↓ (miss)
        L1 Cache (1-10ms)
           ↓ (miss)
        PostgreSQL (10-50ms)
           ↓
        Update L1 & L0
           ↓
        Return + Cache
```

### Cache Hit Rates
- **L0 Target:** >80% hit rate
- **L0+L1 Target:** >95% combined hit rate
- **Monitoring:** `MemTech.getStats()`

## 💾 Backup Strategy

### 1. Continuous WAL Archiving
```bash
archive_mode = on
archive_command = 'rsync %p backup_server:/wal_archive/%f'
```

### 2. Daily Full Backups
```bash
pg_basebackup -D /backups/$(date +%Y%m%d) -Ft -z -P
pg_dump skills_fabrik | gzip > /backups/sql_$(date +%Y%m%d).sql.gz
```

### 3. Point-in-Time Recovery (PITR)
```bash
recovery_target_time = '2025-11-02 15:30:00'
recovery_target_action = 'promote'
```

## 🚨 Troubleshooting

### High L0 Miss Rate
```typescript
// Solution: Increase cache size
MEMTECH_CONFIG.l0.maxSize = 200 * 1024 * 1024; // 200MB
```

### Slow Queries
```sql
-- Solution: Add missing index
CREATE INDEX CONCURRENTLY idx_memtech_search_gin
  ON memtech_documents USING GIN(search_vector);
```

### Cache Inconsistency
```typescript
// Solution: Rebuild caches on startup
async function warmCaches() {
  const docs = await db.query('SELECT * FROM memtech_documents');
  // Rebuild L0 with recent docs
  docs.rows.slice(0, 1000).forEach(doc => {
    l0Cache.set(doc.path, doc);
  });
}
```

## ✅ Best Practices

### Do's ✅
1. Always persist to PostgreSQL (L2)
2. Implement proper recovery from L2
3. Monitor cache hit rates
4. Use constraints in PostgreSQL
5. Implement proper backup strategy

### Don'ts ❌
1. Don't rely solely on L0/L1 for persistence
2. Don't ignore cache eviction
3. Don't skip schema validation
4. Don't forget to update caches
5. Don't use cache for critical data

## 🔄 StartKit vs Skills Fabric

| Feature | StartKit | Skills Fabric |
|---------|----------|---------------|
| **Source of Truth** | Unclear | ✅ PostgreSQL only |
| **Persistence** | Mixed | ✅ Guaranteed |
| **TTL** | All layers | ✅ L0/L1 only |
| **Recovery** | Not guaranteed | ✅ From PostgreSQL |
| **Constraints** | None | ✅ Full schema |

## 📞 Quick Commands

### Health Check
```bash
curl http://127.0.0.1:7727/health
```

### Index Documents
```bash
# Using skills-cli
skills-cli dev-docs create "feature" --v2

# Or direct API
node -e "MemTech.index({path: 'test.md', content: '...', metadata: {}})"
```

### Query Documents
```bash
# Search
node -e "MemTech.search('memory system').then(console.log)"

# Get by path
node -e "MemTech.get('docs/architecture/memtech.md').then(console.log)"
```

### View Statistics
```bash
node -e "MemTech.getStats().then(console.log)"
```

## 🎓 Learning Path

1. **Start Here:** [`memtech-universal-memory-system.md`](./memtech-universal-memory-system.md)
   - Read sections 1-3 for overview
   - Sections 4-7 for deep architecture

2. **Implementation:** Look at code examples
   - TypeScript integration snippets
   - PostgreSQL schema DDL
   - Configuration examples

3. **Operations:** Review best practices
   - Backup & recovery procedures
   - Monitoring & health checks
   - Troubleshooting guide

## 📚 Additional Resources

- **PostgreSQL Documentation:** https://www.postgresql.org/docs/
- **Redis Documentation:** https://redis.io/documentation
- **Database Normalization:** https://en.wikipedia.org/wiki/Database_normalization
- **ACID Properties:** https://en.wikipedia.org/wiki/ACID

---

**Status:** ✅ **IMPLEMENTED AND VALIDATED**
**Version:** 2.0 (Corrected Architecture)
**Last Updated:** 2025-11-02
