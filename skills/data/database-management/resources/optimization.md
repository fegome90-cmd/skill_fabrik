# Database Query Optimization - Performance Tuning

## Query Performance Analysis

### Identifying Slow Queries

#### PostgreSQL - pg_stat_statements
```sql
-- Enable extension
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Find slowest queries
SELECT
  query,
  calls,
  total_time,
  mean_time,
  min_time,
  max_time,
  stddev_time,
  rows,
  100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Most frequently called queries
SELECT
  query,
  calls,
  total_time,
  (total_time / calls) AS avg_time
FROM pg_stat_statements
ORDER BY calls DESC
LIMIT 10;

-- Queries with most I/O
SELECT
  query,
  shared_blks_read,
  shared_blks_hit,
  (shared_blks_hit + shared_blks_read) AS total_reads
FROM pg_stat_statements
ORDER BY shared_blks_read DESC
LIMIT 10;
```

#### MySQL - Slow Query Log
```sql
-- Enable slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;
SET GLOBAL log_queries_not_using_indexes = 'ON';

-- Check slow query log
SHOW VARIABLES LIKE 'slow_query%';

-- Analyze with pt-query-digest
pt-query-digest /var/log/mysql/mysql-slow.log
```

### EXPLAIN Analysis

#### PostgreSQL
```sql
-- Basic EXPLAIN
EXPLAIN SELECT * FROM users WHERE email = 'test@example.com';

-- EXPLAIN ANALYZE (actual execution)
EXPLAIN ANALYZE
SELECT u.name, COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.created_at > '2025-01-01'
GROUP BY u.id, u.name
ORDER BY order_count DESC;

-- EXPLAIN (FORMAT JSON) for programmatic use
EXPLAIN (FORMAT JSON)
SELECT * FROM products WHERE category_id = 5 AND price > 100;
```

#### Query Plan Interpretation

**Sequential Scan (Seq Scan)**
```sql
-- Bad: Full table scan
EXPLAIN SELECT * FROM orders WHERE YEAR(order_date) = 2025;
-- Result: Seq Scan on orders (cost=0.00..1000.00 rows=10000)

-- Why bad: Has to read entire table
```

**Index Scan (Index Scan)**
```sql
-- Good: Using index
EXPLAIN SELECT * FROM users WHERE email = 'test@example.com';
-- Result: Index Scan using idx_users_email on users
--         (cost=0.42..8.44 rows=1)
--         Index Cond: (email = 'test@example.com')

-- Why good: Direct lookup via index
```

**Bitmap Heap Scan**
```sql
-- Uses multiple indexes
EXPLAIN SELECT * FROM orders
WHERE user_id = 5 AND order_date > '2025-01-01';
-- Result: Bitmap Heap Scan on orders
--         Recheck Cond: ((user_id = 5) AND (order_date > '2025-01-01'))
--         -> Bitmap Index Scan on idx_orders_user_id
--         -> Bitmap Index Scan on idx_orders_date
```

#### Query Cost Analysis
```
Cost = (disk_page_reads * seq_page_cost) + (cpu_tuple_cost * rows)

Default costs:
- seq_page_cost: 1.0 (cost to read sequential page)
- random_page_cost: 4.0 (cost to read random page)
- cpu_tuple_cost: 0.01 (cost to process each row)
- cpu_operator_cost: 0.0025 (cost to execute operator)
```

## Index Optimization

### Index Types and When to Use

#### B-Tree Indexes (Default)
```sql
-- Equality queries
CREATE INDEX idx_users_email ON users(email);

-- Range queries
CREATE INDEX idx_orders_date ON orders(order_date DESC);

-- Multi-column (left-to-right)
CREATE INDEX idx_orders_user_date ON orders(user_id, order_date DESC);

-- Composite index usage
-- Good for: WHERE user_id = ? AND order_date > ?
-- Good for: WHERE user_id = ?
-- Bad for: WHERE order_date > ?  (can't use index)
```

**Index Selectivity**
```sql
-- High selectivity (good for indexing)
-- Cardinality: 100,000 distinct values for 100,000 rows
-- Selectivity: 100%

-- Low selectivity (poor for indexing)
-- Cardinality: 2 distinct values for 100,000 rows
-- Selectivity: 0.002%

-- Check selectivity
SELECT
  column_name,
  n_distinct,
  n_live_tup,
  ROUND(100.0 * n_distinct / n_live_tup, 2) AS selectivity_percent
FROM pg_stats
WHERE tablename = 'users';
```

#### Partial Indexes
```sql
-- Index only active rows
CREATE INDEX idx_active_customers ON customers(email)
WHERE active = true;

-- Index only recent data
CREATE INDEX idx_recent_orders ON orders(created_at DESC)
WHERE created_at > CURRENT_DATE - INTERVAL '90 days';

-- Index specific values
CREATE INDEX idx_pending_orders ON orders(id)
WHERE status = 'pending';

-- Usage analysis
SELECT
  schemaname,
  tablename,
  indexname,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE indexname LIKE 'idx_active_%';
```

#### Expression Indexes
```sql
-- Index on function results
CREATE INDEX idx_users_lower_email ON users(LOWER(email));

-- Query using expression index
SELECT * FROM users
WHERE LOWER(email) = LOWER('Test@Example.Com');

-- Index on JSON field
CREATE INDEX idx_users_preferences_theme ON users
USING GIN (preferences);

-- Query JSON
SELECT * FROM users
WHERE preferences->>'theme' = 'dark';
```

#### Unique Indexes
```sql
-- Enforce uniqueness and speed up lookups
CREATE UNIQUE INDEX idx_users_email ON users(email);

-- Unique partial index
CREATE UNIQUE INDEX idx_unique_active_customer
ON customers(email)
WHERE active = true;
```

### Index Maintenance

#### Monitor Index Usage
```sql
-- Find unused indexes (that were never read)
SELECT
  schemaname,
  tablename,
  indexname,
  idx_tup_read,
  idx_tup_fetch,
  pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
WHERE idx_tup_read = 0
ORDER BY pg_relation_size(indexrelid) DESC;

-- Find duplicate indexes
SELECT
  t.tablename,
  array_agg(i.indexname) AS indexes,
  array_agg(i.indexdef) AS definitions
FROM pg_tables t
JOIN pg_indexes i ON t.tablename = i.tablename
WHERE t.schemaname = 'public'
GROUP BY t.tablename
HAVING COUNT(*) > 1;

-- Find indexes with low usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_tup_read,
  idx_tup_fetch,
  pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
WHERE idx_tup_read < 100  -- Arbitrary threshold
ORDER BY idx_tup_read ASC;
```

#### Rebuild Indexes
```sql
-- Concurrent rebuild (no table lock)
REINDEX INDEX CONCURRENTLY idx_users_email;

-- Rebuild all indexes on table
REINDEX TABLE CONCURRENTLY users;

-- Analyze table statistics after rebuild
ANALYZE users;

-- Check index bloat
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) AS size,
  pg_size_pretty(pg_total_relation_size(indexrelid)) AS total_size
FROM pg_stat_user_indexes
ORDER BY pg_relation_size(indexrelid) DESC;
```

### Covering Indexes (Index-Only Scans)
```sql
-- Index that includes all needed columns
CREATE INDEX idx_orders_covering ON orders(user_id, order_date, status, total);

-- Now this query can be answered entirely from index
EXPLAIN SELECT user_id, order_date, status, total
FROM orders
WHERE user_id = 5
  AND order_date > '2025-01-01';
-- Result: Index Only Scan using idx_orders_covering on orders
```

## Query Optimization Techniques

### 1. Eliminate N+1 Query Problem

#### Before (N+1 Queries)
```javascript
// JavaScript/Node.js example
const users = await User.findAll();  // 1 query

for (const user of users) {
  const orders = await Order.findAll({  // Runs N times!
    where: { userId: user.id }
  });
  user.orders = orders;
}

// Total: 1 + N queries
```

#### After (Eager Loading)
```javascript
// Single query with JOIN
const users = await User.findAll({
  include: [{
    model: Order,
    required: false
  }]
});

// Total: 1 query
```

#### SQL Example
```sql
-- Bad: Multiple queries
SELECT * FROM users;
-- For each user:
SELECT * FROM orders WHERE user_id = ?

-- Good: Single query with JOIN
SELECT u.*, o.*
FROM users u
LEFT JOIN orders o ON u.id = o.user_id;

-- Or aggregate
SELECT u.id, u.name, COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.name;
```

### 2. Optimize JOINs

#### Proper Join Order
```sql
-- Start with smallest table
EXPLAIN
SELECT u.name, COUNT(o.id) as order_count
FROM orders o
JOIN users u ON o.user_id = u.id  -- Start with orders (smaller result set after filters)
WHERE o.created_at > '2025-01-01'
GROUP BY u.id, u.name;

-- Force join order (if needed)
SELECT /*+ ORDERED */ u.name, COUNT(o.id) as order_count
FROM users u
JOIN orders o ON o.user_id = u.id
WHERE o.created_at > '2025-01-01'
GROUP BY u.id, u.name;
```

#### Reduce JOIN columns
```sql
-- Bad: Join all columns
SELECT u.*, o.*  -- Unnecessary data transfer
FROM users u
JOIN orders o ON u.id = o.user_id;

-- Good: Select only needed columns
SELECT u.id, u.name, o.id, o.total
FROM users u
JOIN orders o ON u.id = o.user_id;
```

### 3. Use Appropriate WHERE Clauses

#### Filter Early
```sql
-- Bad: Join first, then filter
SELECT u.name, o.total
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE o.total > 1000;

-- Good: Filter before JOIN (smaller intermediate result)
SELECT u.name, o.total
FROM (SELECT * FROM orders WHERE total > 1000) o
JOIN users u ON u.id = o.user_id;
```

#### SARGable Predicates
```sql
-- Bad: Non-SARGable (can't use index)
SELECT * FROM orders
WHERE YEAR(order_date) = 2025;  -- Function on column

-- Good: SARGable (can use index)
SELECT * FROM orders
WHERE order_date >= '2025-01-01'
  AND order_date < '2026-01-01';
```

#### Avoid OR in WHERE
```sql
-- Bad: OR prevents index usage
SELECT * FROM users
WHERE status = 'active' OR status = 'pending';

-- Good: UNION uses indexes
SELECT * FROM users WHERE status = 'active'
UNION
SELECT * FROM users WHERE status = 'pending';

-- Better: IN clause
SELECT * FROM users
WHERE status IN ('active', 'pending');
```

### 4. Optimize Aggregation

#### Early Aggregation
```sql
-- Bad: Aggregate after JOIN
SELECT u.name, COUNT(o.id) as order_count
FROM users u
JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.name;

-- Good: Aggregate before JOIN (smaller dataset)
SELECT u.name, order_counts.order_count
FROM users u
LEFT JOIN (
  SELECT user_id, COUNT(*) as order_count
  FROM orders
  GROUP BY user_id
) order_counts ON u.id = order_counts.user_id;
```

#### Partial Aggregation
```sql
-- Track counts incrementally instead of recalculating
CREATE TABLE user_stats (
  user_id INT PRIMARY KEY REFERENCES users(id),
  order_count INT DEFAULT 0,
  total_spent DECIMAL(10, 2) DEFAULT 0,
  last_order_at TIMESTAMP
);

-- Update incrementally
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO user_stats (user_id, order_count, total_spent, last_order_at)
    VALUES (NEW.user_id, 1, NEW.total, NEW.created_at)
    ON CONFLICT (user_id)
    DO UPDATE SET
      order_count = user_stats.order_count + 1,
      total_spent = user_stats.total_spent + NEW.total,
      last_order_at = NEW.created_at;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

### 5. Optimize LIMIT and Pagination

#### Offset Performance Problem
```sql
-- Bad: OFFSET with large value
SELECT * FROM orders
ORDER BY created_at DESC
OFFSET 1000000
LIMIT 20;

-- Why bad: Has to skip 1,000,000 rows

-- Good: Cursor-based pagination
SELECT * FROM orders
WHERE created_at < '2025-01-01 12:00:00'
ORDER BY created_at DESC
LIMIT 20;

-- Store last timestamp from previous page
-- Next page uses: WHERE created_at < last_timestamp
```

#### Keyset Pagination
```sql
-- Create index for pagination
CREATE INDEX idx_orders_created_at_desc ON orders(created_at DESC, id DESC);

-- First page
SELECT * FROM orders
ORDER BY created_at DESC, id DESC
LIMIT 20;

-- Second page (cursor is last row)
SELECT * FROM orders
WHERE (created_at, id) < (TIMESTAMP '2025-11-02 14:30:00', 999)
ORDER BY created_at DESC, id DESC
LIMIT 20;
```

### 6. Avoid SELECT *

```sql
-- Bad: SELECT *
SELECT * FROM users WHERE id = 123;

-- Good: Specific columns
SELECT id, name, email FROM users WHERE id = 123;

-- Why good:
-- - Less data transfer
-- - Can use covering indexes
-- - Better cache utilization
```

### 7. Use EXISTS Instead of IN for Subqueries

```sql
-- Bad: IN with subquery
SELECT * FROM users
WHERE id IN (
  SELECT user_id FROM orders WHERE total > 1000
);

-- Good: EXISTS (can stop early)
SELECT u.* FROM users u
WHERE EXISTS (
  SELECT 1 FROM orders
  WHERE orders.user_id = u.id
    AND orders.total > 1000
);
```

### 8. Optimize ORMs

#### Prisma Optimization
```javascript
// Bad: Multiple queries
const users = await prisma.user.findMany();
const orders = await prisma.order.findMany();

// Good: Single query with include
const users = await prisma.user.findMany({
  include: {
    orders: true
  }
});

// Bad: N+1 in loop
for (const user of users) {
  const orders = await prisma.order.findMany({
    where: { userId: user.id }
  });
  console.log(user.name, orders.length);
}

// Good: Include with where
const users = await prisma.user.findMany({
  include: {
    orders: {
      where: { total: { gt: 1000 } }
    }
  }
});
```

## Database Configuration Tuning

### PostgreSQL Configuration

#### Key Parameters in postgresql.conf
```ini
# Memory
shared_buffers = 256MB                    # 25% of total RAM
effective_cache_size = 1GB                # 75% of total RAM
work_mem = 4MB                            # Per operation
maintenance_work_mem = 64MB               # For maintenance operations

# Checkpoints
checkpoint_completion_target = 0.9        # Spread checkpoint writes
wal_buffers = 16MB                        # WAL buffer size

# Query planner
random_page_cost = 1.1                    # For SSD (lower than default 4.0)
cpu_tuple_cost = 0.01
cpu_operator_cost = 0.0025

# Connections
max_connections = 100

# Logging
log_min_duration_statement = 1000         # Log queries > 1 second
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
```

#### Query Planner Statistics
```sql
-- Adjust statistics for better cardinality estimates
ALTER TABLE orders ALTER COLUMN status SET STATISTICS 1000;

-- Increase default statistics
ALTER SYSTEM SET default_statistics_target = 1000;
SELECT pg_reload_conf();

-- Analyze table
ANALYZE orders;

-- Check statistics
SELECT attname, n_distinct, correlation
FROM pg_stats
WHERE tablename = 'orders';
```

### Connection Pooling

#### PgBouncer Configuration
```ini
[databases]
mydb = host=127.0.0.1 port=5432 dbname=mydb

[pgbouncer]
listen_addr = 127.0.0.1
listen_port = 6432
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt

# Pool modes
# session: one server connection per client session (default)
# transaction: one server connection per transaction
# statement: one server connection for multiple statements

pool_mode = transaction
max_client_conn = 1000
default_pool_size = 100

# Timeouts
server_idle_timeout = 600
client_login_timeout = 60

# Reserve connections for emergencies
reserve_pool_size = 5
reserve_pool_timeout = 3
```

#### Application Connection Pooling
```javascript
// Node.js with pg
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 6432,  // PgBouncer port
  database: 'mydb',
  user: 'postgres',
  password: 'password',
  max: 20,              // Max pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Don't forget to release connections!
async function getUser(id) {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0];
  } finally {
    client.release();
  }
}
```

## Performance Monitoring

### Query Performance Monitoring

```sql
-- Monitor active queries
SELECT
  pid,
  usename,
  application_name,
  client_addr,
  state,
  query_start,
  query,
  EXTRACT(EPOCH FROM (now() - query_start)) AS duration_seconds
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY query_start;

-- Find blocking queries
SELECT
  blocked_locks.pid AS blocked_pid,
  blocked_activity.usename AS blocked_user,
  blocking_locks.pid AS blocking_pid,
  blocking_activity.usename AS blocking_user,
  blocked_activity.query AS blocked_statement,
  blocking_activity.query AS blocking_statement
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
WHERE NOT blocked_locks.granted;

-- Kill long-running query
SELECT pg_terminate_backend(pid) FROM pg_stat_activity
WHERE pid = 12345;
```

### Monitoring with Prometheus

```javascript
// PostgreSQL exporter metrics
const promClient = require('prom-client');

// Custom metrics
const dbConnections = new promClient.Gauge({
  name: 'db_connections_active',
  help: 'Active database connections',
  registers: [register]
});

const slowQueries = new promClient.Counter({
  name: 'db_slow_queries_total',
  help: 'Total number of slow queries',
  labelNames: ['query_type'],
  registers: [register]
});

// Monitor periodically
setInterval(() => {
  // Get connection count
  pool.query('SELECT count(*) FROM pg_stat_activity', (err, res) => {
    if (!err) {
      dbConnections.set(parseInt(res.rows[0].count));
    }
  });
}, 10000);
```

---

**Estado**: Query optimization techniques documentadas
**Coverage**: Indexing, query patterns, configuration, monitoring
**Best Practices**: EXPLAIN analysis, avoid N+1, proper indexing
