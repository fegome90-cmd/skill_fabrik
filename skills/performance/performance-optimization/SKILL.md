---
id: performance-optimization
version: 0.1.0
type: guideline
summary: 'Guía completa de performance optimization: profiling, caching strategies, database optimization, frontend performance, y monitoring. Mejora velocidad, escalabilidad y user experience.'
audience: developers, performance-engineers, devops, architects
when_to_use: 'Para optimizar aplicaciones slow, escalar sistemas, reducir latency, y mejorar user experience. Usa antes de major releases y después de feature additions.'
provides: 'Aplicaciones faster, mejor user experience, reduced server costs, improved scalability, y better resource utilization.'
resources:
  - resources/techniques.md
  - resources/tools.md
  - resources/metrics.md
  - resources/case-studies.md
scripts:
  - name: profile-app
    run: node --prof src/index.js && node --prof-process isolate-*.log > profile.txt && cat profile.txt
    note: Profile Node.js application performance
  - name: benchmark-api
    run: autocannon -c 100 -p 10 http://localhost:3000/api/health
    note: Benchmark API endpoint con concurrent connections
  - name: analyze-bundle
    run: npx webpack-bundle-analyzer dist/bundle.js
    note: Analizar tamaño y composición del bundle
  - name: lighthouse-audit
    run: npx lighthouse http://localhost:3000 --output html --output-path report.html --chrome-flags="--headless"
    note: Run Lighthouse performance audit
limits: 'Puede complicar architecture. Premature optimization is evil. Requiere measurement antes de optimization. Testing adicional necesario post-optimization.'
---

## Objetivo

Implementar **estrategias de performance optimization** para acelerar aplicaciones, mejorar scalability, y optimizar resource utilization en frontend y backend.

**Cuándo usar**:
- Performance budgets exceeded
- User complaints sobre speed
- High infrastructure costs
- Scaling challenges
- Before major releases
- After adding new features

**Cuándo NO usar**: Para proof-of-concepts, features con low usage, o antes de identifying bottlenecks.

**Qué problema resuelve**: Slow load times, high latency, poor user experience, server overload, y increased costs.

## Performance Optimization Pyramid

### 1. Measurement First
- **Profile applications** - Identify actual bottlenecks
- **Measure current performance** - Establish baseline
- **Monitor continuously** - Track performance over time
- **Set performance budgets** - Define targets

### 2. Low-Hanging Fruit
- **Database queries** - Optimize N+1 queries, missing indexes
- **Network requests** - Reduce round trips, compress responses
- **Images** - Compress, lazy load, modern formats
- **Caching** - Implement appropriate caching strategies

### 3. Code Optimization
- **Algorithm complexity** - O(n²) → O(n log n)
- **Memory usage** - Reduce allocations, garbage collection
- **Rendering** - Minimize DOM manipulations
- **Bundle size** - Tree shaking, code splitting

### 4. Architecture Changes
- **Caching layers** - CDN, Redis, in-memory
- **Database sharding** - Horizontal partitioning
- **Microservices** - Specialized, scalable services
- **Asynchronous processing** - Background jobs, queues

### 5. Infrastructure Optimization
- **Load balancing** - Distribute traffic
- **Auto-scaling** - Scale based on load
- **CDN** - Edge caching globally
- **Database optimization** - Read replicas, connection pooling

## Core Optimization Areas

### Frontend Performance

#### Critical Rendering Path
1. **HTML parsing** - Minimize, inline critical CSS
2. **CSSOM construction** - Optimize CSS delivery
3. **JavaScript parsing** - Defer non-critical JS
4. **Render tree construction** - Reduce DOM complexity
5. **Layout calculation** - Minimize layout thrashing
6. **Painting** - Optimize repaints, use GPU acceleration

#### Core Web Vitals
- **Largest Contentful Paint (LCP)** - Target: <2.5s
- **First Input Delay (FID)** - Target: <100ms
- **Cumulative Layout Shift (CLS)** - Target: <0.1

#### Frontend Optimization Checklist
- [ ] **Minimize HTTP requests**
  - Combine CSS/JS files
  - Use CSS sprites
  - Inline critical resources

- [ ] **Optimize images**
  - Compress images (80-85% quality)
  - Use WebP/AVIF formats
  - Implement lazy loading
  - Responsive images

- [ ] **Reduce JavaScript**
  - Remove unused code (tree shaking)
  - Code splitting
  - Defer non-critical JS
  - Minify and compress

- [ ] **Optimize CSS**
  - Remove unused CSS
  - Inline critical CSS
  - Minify CSS files
  - Use CSS containment

- [ ] **Enable compression**
  - Gzip/Brotli compression
  - Compress text assets
  - Optimize transfer size

- [ ] **Leverage browser caching**
  - Set cache headers
  - Use service workers
  - Implement offline strategies

### Backend Performance

#### Database Optimization
- [ ] **Query optimization**
  - Identify slow queries
  - Add appropriate indexes
  - Optimize JOINs
  - Use query plan analysis

- [ ] **Connection management**
  - Connection pooling
  - Reuse connections
  - Avoid connection leaks
  - Configure pool size

- [ ] **Data access patterns**
  - Eliminate N+1 queries
  - Use eager loading
  - Implement pagination
  - Batch operations

#### API Performance
- [ ] **Response optimization**
  - Compress responses (Gzip/Brotli)
  - Minimize JSON payload
  - Use compression middleware
  - Enable HTTP/2

- [ ] **Caching strategy**
  - HTTP caching headers
  - CDN caching
  - Redis caching
  - Application-level cache

- [ ] **API design**
  - Implement pagination
  - Use filtering and sorting
  - Batch requests
  - Async processing

#### Server Optimization
- [ ] **Resource management**
  - Monitor CPU usage
  - Track memory consumption
  - Optimize garbage collection
  - Use worker threads

- [ ] **Concurrency**
  - Implement async/await
  - Use message queues
  - Background job processing
  - Rate limiting

## Performance Measurement

### Metrics to Track

#### Core Metrics
```javascript
// Frontend performance metrics
const metrics = {
  // Navigation timing
  TTFB: 0, // Time to First Byte
  FCP: 0,  // First Contentful Paint
  LCP: 0,  // Largest Contentful Paint
  FID: 0,  // First Input Delay
  CLS: 0,  // Cumulative Layout Shift

  // Custom metrics
  APIResponseTime: 0,
  DatabaseQueryTime: 0,
  BundleSize: 0
};
```

#### Performance Budgets
- **JavaScript**: <170KB gzipped
- **CSS**: <80KB gzipped
- **Images**: <1MB total
- **API Response**: <200ms p95
- **Database Query**: <50ms p95
- **Page Load**: <3s on 3G

### Monitoring Tools

#### Application Performance Monitoring (APM)
- **New Relic** - Full-stack monitoring
- **Datadog** - Infrastructure y APM
- **AppDynamics** - Business transaction tracking
- **Dynatrace** - AI-powered monitoring
- **OpenTelemetry** - Open source alternative

#### Real User Monitoring (RUM)
```javascript
// Track real user performance
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

## Caching Strategies

### Caching Layers

#### 1. Browser Cache
```http
# Cache static assets for 1 year
Cache-Control: public, max-age=31536000, immutable
ETag: "abc123"

# Cache API responses for 5 minutes
Cache-Control: private, max-age=300
```

#### 2. CDN Cache
- **Static assets** - Cache at edge locations
- **Images** - Transform y cache variants
- **API responses** - Cache frequently requested data
- **Geographic distribution** - Reduce latency globally

#### 3. Application Cache
```javascript
// In-memory cache
const cache = new Map();

function getCachedData(key) {
  if (cache.has(key)) {
    return cache.get(key);
  }
  const data = fetchFromDatabase(key);
  cache.set(key, data);
  return data;
}

// LRU Cache implementation
class LRUCache {
  constructor(maxSize = 100) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return undefined;

    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
}
```

#### 4. Database Cache
- **Query result cache** - Cache expensive queries
- **Connection pool** - Reuse database connections
- **Read replicas** - Distribute read load
- **Materialized views** - Pre-compute complex aggregations

### Cache Invalidation Strategies

#### Time-Based Invalidation
```javascript
// Cache with TTL
const cacheWithTTL = new Map();

function getOrSet(key, fetcher, ttl = 300000) { // 5 minutes
  const cached = cacheWithTTL.get(key);

  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.value;
  }

  const value = fetcher();
  cacheWithTTL.set(key, {
    value,
    timestamp: Date.now()
  });

  return value;
}
```

#### Event-Based Invalidation
```javascript
// Invalidate cache on data changes
async function updateUser(id, data) {
  await database.users.update(id, data);

  // Invalidate related caches
  cache.delete(`user:${id}`);
  cache.delete(`user:${id}:profile`);
  cache.delete(`users:list`);
}
```

#### Cache-Aside Pattern
```javascript
async function getUser(id) {
  const cacheKey = `user:${id}`;
  let user = await cache.get(cacheKey);

  if (!user) {
    user = await database.users.findById(id);
    await cache.set(cacheKey, user, 3600);
  }

  return user;
}
```

## Database Optimization

### Query Optimization

#### Identify Slow Queries
```sql
-- PostgreSQL
SELECT query, mean_time, calls
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- MySQL
SELECT * FROM performance_schema.events_statements_summary_by_digest
ORDER BY AVG_TIMER_WAIT DESC
LIMIT 10;
```

#### Add Indexes
```sql
-- Single column index
CREATE INDEX idx_users_email ON users(email);

-- Composite index
CREATE INDEX idx_orders_user_date ON orders(user_id, created_at DESC);

-- Partial index
CREATE INDEX idx_active_users ON users(email)
WHERE active = true;
```

#### Optimize Queries
```javascript
// Before: N+1 query problem
const users = await User.findAll();
for (const user of users) {
  user.posts = await Post.findAll({ where: { userId: user.id } });
}

// After: Eager loading
const users = await User.findAll({
  include: [{
    model: Post,
    required: false
  }]
});
```

