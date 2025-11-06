# Performance Optimization Techniques - Técnicas Detalladas

## Frontend Optimization Techniques

### 1. Critical Rendering Path Optimization

#### Inline Critical CSS
```html
<!-- Extract critical CSS and inline in <head> -->
<head>
  <style>
    /* Critical CSS for above-the-fold content */
    .header { display: flex; padding: 1rem; }
    .hero { background: linear-gradient(to right, #000, #fff); }
  </style>
</head>

<!-- Load non-critical CSS asynchronously -->
<link rel="preload" href="/styles.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="/styles.css"></noscript>
```

#### Preload Key Resources
```html
<!-- Preload critical resources -->
<link rel="preload" href="/font.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/api/data.json" as="fetch" crossorigin>
<link rel="dns-prefetch" href="https://api.example.com">

<!-- Preconnect to external origins -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
```

#### Defer Non-Critical JavaScript
```html
<!-- Load non-critical JS after page load -->
<script defer src="/app.js"></script>

<!-- Or use module script with defer -->
<script type="module" src="/module.js"></script>

<!-- For third-party scripts, use async when possible -->
<script async src="/analytics.js"></script>
```

### 2. JavaScript Optimization

#### Code Splitting Patterns

**Route-Based Splitting:**
```javascript
// React Router with lazy loading
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
```

**Component-Based Splitting:**
```javascript
// Dynamic import heavy components
import { lazy, Suspense } from 'react';

const HeavyChart = lazy(() => import('./components/HeavyChart'));

function Dashboard() {
  const [showChart, setShowChart] = useState(false);

  return (
    <div>
      <button onClick={() => setShowChart(true)}>
        Show Chart
      </button>
      {showChart && (
        <Suspense fallback={<div>Loading chart...</div>}>
          <HeavyChart />
        </Suspense>
      )}
    </div>
  );
}
```

#### Bundle Optimization

**Webpack Configuration:**
```javascript
// webpack.config.js
module.exports = {
  optimization: {
    // Enable tree shaking
    usedExports: true,
    sideEffects: false,

    // Split chunks
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          enforce: true
        }
      }
    },

    // Minimize
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true, // Remove console.logs
            drop_debugger: true
          }
        }
      })
    ]
  }
};
```

#### Tree Shaking
```javascript
// Bad: Import entire library
import _ from 'lodash';
const result = _.chunk([1, 2, 3, 4, 5], 2);

// Good: Import specific functions
import chunk from 'lodash/chunk';
const result = chunk([1, 2, 3, 4, 5], 2);

// Even better: Use native methods where possible
const result = [1, 2, 3, 4, 5].reduce((acc, _, i) => {
  return i % 2 === 0 ? [...acc, [1, 2, 3, 4, 5].slice(i, i + 2)] : acc;
}, []);
```

#### Optimize React Performance

**useMemo for Expensive Calculations:**
```javascript
import { useMemo } from 'react';

function DataTable({ data, filters }) {
  // Expensive calculation only runs when dependencies change
  const filteredData = useMemo(() => {
    return data.filter(item => {
      return Object.keys(filters).every(key => {
        return item[key].toLowerCase().includes(filters[key].toLowerCase());
      });
    });
  }, [data, filters]);

  return (
    <table>
      {/* Render filtered data */}
    </table>
  );
}
```

**useCallback for Event Handlers:**
```javascript
import { useCallback } from 'react';

function TodoList({ todos, onTodoClick }) {
  // Memoize callback to prevent child re-renders
  const handleClick = useCallback((id) => {
    onTodoClick(id);
  }, [onTodoClick]);

  return (
    <ul>
      {todos.map(todo => (
        <TodoItem key={todo.id} todo={todo} onClick={handleClick} />
      ))}
    </ul>
  );
}
```

**React.memo for Component Memoization:**
```javascript
import { memo } from 'react';

const ExpensiveComponent = memo(({ data, onItemClick }) => {
  // This component only re-renders when props change
  return (
    <div>
      {data.map(item => (
        <div key={item.id} onClick={() => onItemClick(item.id)}>
          {item.name}
        </div>
      ))}
    </div>
  );
});
```

### 3. CSS Optimization

#### CSS Containment
```css
/* Enable layout, style, and paint containment */
.component {
  contain: layout style paint;
}

/* Layout containment - isolate internal layout */
.list {
  contain: layout;
}

/* Paint containment - clip overflow */
.card {
  contain: paint;
}
```

#### Optimize Animations
```css
/* Use transform and opacity for GPU acceleration */
.slide-in {
  transform: translateX(-100%);
  transition: transform 0.3s ease;
}

.slide-in.active {
  transform: translateX(0);
}

/* Avoid animating layout properties */
.shake {
  animation: shake 0.5s;
}

/* This is BAD - layout property */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}
```

#### Reduce CSS Bundle Size
```javascript
// Purge unused CSS with PurgeCSS
// webpack.config.js
const PurgeCSSPlugin = require('purgecss-webpack-plugin');
const glob = require('glob');
const path = require('path');

module.exports = {
  plugins: [
    new PurgeCSSPlugin({
      paths: glob.sync(`${path.join(__dirname, 'src')}/**/*`, { nodir: true }),
      whitelist: ['dark-mode', 'active'], // Keep these classes
    }),
  ],
};
```

### 4. Image Optimization

#### Responsive Images
```html
<!-- Modern formats with fallbacks -->
<picture>
  <source srcset="/image.webp" type="image/webp">
  <source srcset="/image.avif" type="image/avif">
  <img src="/image.jpg" alt="Description" width="800" height="600">
</picture>

<!-- Different sizes for different viewports -->
<img
  src="/image-800.jpg"
  srcset="
    /image-400.jpg 400w,
    /image-800.jpg 800w,
    /image-1200.jpg 1200w,
    /image-1600.jpg 1600w
  "
  sizes="(max-width: 400px) 400px,
         (max-width: 800px) 800px,
         (max-width: 1200px) 1200px,
         1600px"
  alt="Description"
/>
```

#### Lazy Loading Implementation
```javascript
// Intersection Observer for lazy loading
const lazyImages = document.querySelectorAll('img[data-src]');

const imageObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
      imageObserver.unobserve(img);
    }
  });
});

lazyImages.forEach(img => imageObserver.observe(img));
```

#### Image Compression
```bash
# Using Sharp for Node.js
const Sharp = require('sharp');

async function optimizeImage(inputPath, outputPath) {
  await Sharp(inputPath)
    .resize(800, 600, {
      fit: 'inside',
      withoutEnlargement: true
    })
    .webp({ quality: 80 })
    .toFile(outputPath);
}

// Using ImageOptim or similar tools
# Install: npm install -g imagemin-cli imagemin-webp
# Run: imagemin src/images/*.jpg --out-dir=dist/images --plugin=webp
```

### 5. Font Optimization

#### Font Loading Strategy
```css
/* Preload critical fonts */
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter.woff2') format('woff2');
  font-weight: 400;
  font-display: swap; /* Show fallback text immediately */
}

/* Use font-display: swap for faster rendering */
```

```html
<!-- Preload fonts -->
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>
```

#### Font Subsetting
```bash
# Extract only needed characters
pip install fonttools
pyftsubset fonts/inter.woff2 --unicodes=U+0020-007F,U+00A0-00FF,U+0100-017F
```

---

## Backend Optimization Techniques

### 1. Database Optimization

#### Query Optimization

**Identify N+1 Queries:**
```javascript
// Problem: N+1 queries
const users = await User.findAll(); // 1 query

for (const user of users) {
  const posts = await Post.findAll({ // Runs N times!
    where: { userId: user.id }
  });
  user.posts = posts;
}

// Solution: Eager loading
const users = await User.findAll({
  include: [{
    model: Post,
    required: false // LEFT JOIN
  }]
});
```

**Optimize JOINs:**
```sql
-- Bad: No index on join columns
SELECT u.*, p.*
FROM users u
JOIN posts p ON u.id = p.user_id;

-- Good: Add indexes
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_users_email ON users(email);

-- Optimized query
SELECT u.id, u.name, p.title, p.content
FROM users u
USE INDEX (idx_users_email)
JOIN posts p USE INDEX (idx_posts_user_id)
ON u.id = p.user_id
WHERE u.email = 'user@example.com';
```

**Use Query Plan Analysis:**
```sql
-- PostgreSQL
EXPLAIN ANALYZE
SELECT u.name, COUNT(p.id) as post_count
FROM users u
JOIN posts p ON u.id = p.user_id
WHERE u.created_at > '2025-01-01'
GROUP BY u.id, u.name;

-- MySQL
EXPLAIN
SELECT u.name, COUNT(p.id) as post_count
FROM users u
JOIN posts p ON u.id = p.user_id
WHERE u.created_at > '2025-01-01'
GROUP BY u.id, u.name;
```

#### Database Indexing Strategy

**Single Column Index:**
```sql
-- Index for equality queries
CREATE INDEX idx_users_email ON users(email);

-- Index for range queries
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
```

**Composite Index:**
```sql
-- Index for multi-column queries
CREATE INDEX idx_orders_user_status ON orders(user_id, status, created_at DESC);

-- Usage in queries
SELECT * FROM orders
WHERE user_id = 123
  AND status = 'pending'
ORDER BY created_at DESC
LIMIT 10;
```

**Partial Index:**
```sql
-- Index only active records
CREATE INDEX idx_active_users ON users(email)
WHERE active = true;
```

#### Connection Pool Optimization
```javascript
// PostgreSQL with node-postgres
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'mydb',
  user: 'user',
  password: 'password',
  max: 20,              // Max pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  maxUses: 7500,        // Recycle connections after 7500 uses
});

// Best practice: Use pool in queries
async function getUser(id) {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0];
  } finally {
    client.release(); // Always release back to pool
  }
}
```

### 2. Caching Strategies

#### Application-Level Caching

**Cache-Aside Pattern:**
```javascript
// Simple in-memory cache
class Cache {
  constructor() {
    this.cache = new Map();
  }

  async get(key, fetcher, ttl = 3600000) {
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.value;
    }

    const value = await fetcher();
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });

    return value;
  }

  async set(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  async delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }
}

// Usage
const cache = new Cache();

async function getUser(id) {
  return await cache.get(
    `user:${id}`,
    () => database.users.findById(id),
    3600000 // 1 hour TTL
  );
}
```

**Write-Through Pattern:**
```javascript
async function updateUser(id, data) {
  // Update database first
  await database.users.update(id, data);

  // Then update cache
  await cache.set(`user:${id}`, data);
}
```

**Write-Behind Pattern:**
```javascript
class WriteBehindCache {
  constructor(cache, queue) {
    this.cache = cache;
    this.queue = queue;
  }

  async set(key, value) {
    await this.cache.set(key, value);
    await this.queue.enqueue({ key, value });
  }

  async flush() {
    while (!this.queue.isEmpty()) {
      const { key, value } = this.queue.dequeue();
      await database.users.update(key, value);
    }
  }
}
```

#### Redis Caching
```javascript
const redis = require('redis');
const client = redis.createClient();

async function getCachedUser(id) {
  const cached = await client.get(`user:${id}`);
  if (cached) {
    return JSON.parse(cached);
  }

  const user = await database.users.findById(id);
  if (user) {
    await client.setex(
      `user:${id}`,
      3600, // TTL in seconds
      JSON.stringify(user)
    );
  }

  return user;
}

async function updateUser(id, data) {
  // Update database
  await database.users.update(id, data);

  // Update cache
  await client.setex(
    `user:${id}`,
    3600,
    JSON.stringify(data)
  );
}
```

#### HTTP Caching Headers
```javascript
// Express with proper caching
app.get('/api/users/:id', async (req, res) => {
  const user = await getUser(req.params.id);

  // Set caching headers
  res.set('Cache-Control', 'public, max-age=3600'); // 1 hour
  res.set('ETag', `"${user.version}"`); // For conditional requests

  res.json(user);
});

// Handle conditional requests
app.get('/api/users/:id', async (req, res) => {
  const user = await getUser(req.params.id);
  const etag = `"${user.version}"`;

  // Check if client has this version
  if (req.headers['if-none-match'] === etag) {
    return res.status(304).end(); // Not Modified
  }

  res.set('Cache-Control', 'public, max-age=3600');
  res.set('ETag', etag);
  res.json(user);
});
```

### 3. API Optimization

#### Pagination
```javascript
// Bad: Return all records
app.get('/api/users', async (req, res) => {
  const users = await User.findAll(); // Could be thousands!
  res.json(users);
});

// Good: Implement pagination
app.get('/api/users', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const { rows, count } = await User.findAndCountAll({
    limit,
    offset,
    order: [['created_at', 'DESC']]
  });

  res.json({
    data: rows,
    pagination: {
      page,
      limit,
      total: count,
      pages: Math.ceil(count / limit)
    }
  });
});

// Cursor-based pagination (better for large datasets)
app.get('/api/users', async (req, res) => {
  const cursor = req.query.cursor; // Last ID from previous request
  const limit = parseInt(req.query.limit) || 20;

  const users = await User.findAll({
    where: cursor ? { id: { [Op.gt]: cursor } } : undefined,
    limit: limit + 1, // Get one extra to determine if more exists
    order: [['id', 'ASC']]
  });

  const hasMore = users.length > limit;
  const data = hasMore ? users.slice(0, -1) : users;
  const nextCursor = hasMore ? data[data.length - 1].id : null;

  res.json({ data, hasMore, nextCursor });
});
```

#### Response Compression
```javascript
// Express with compression
const compression = require('compression');
app.use(compression());

// Or Brotli compression (better compression)
const express = require('express');
const app = express();

app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));
```

#### Batch Requests
```javascript
// GraphQL-style batching
app.post('/api/batch', async (req, res) => {
  const queries = req.body.queries;

  // Execute all queries in parallel
  const results = await Promise.all(
    queries.map(query => executeQuery(query))
  );

  res.json(results);
});

// Usage
POST /api/batch
[
  { query: 'getUser', params: { id: 1 } },
  { query: 'getPosts', params: { userId: 1 } },
  { query: 'getComments', params: { postId: 1 } }
]
```

### 4. Async Processing

#### Queue-Based Processing
```javascript
const Bull = require('bull');

// Create queue
const imageProcessingQueue = new Bull('image processing', 'redis://localhost:6379');

// Add job to queue
async function uploadImage(file) {
  // Store file metadata in database
  const image = await Image.create({ filename: file.filename });

  // Add to processing queue
  await imageProcessingQueue.add(
    { imageId: image.id, filename: file.filename },
    { attempts: 3, backoff: { type: 'exponential', delay: 5000 } }
  );

  return image;
}

// Process job
imageProcessingQueue.process(async (job) => {
  const { imageId, filename } = job.data;

  // Resize image
  await sharp(`./uploads/${filename}`)
    .resize(800, 600)
    .jpeg({ quality: 80 })
    .toFile(`./processed/${filename}`);

  // Update status
  await Image.update({ status: 'processed' }, { where: { id: imageId } });
});
```

#### WebSocket for Real-time Updates
```javascript
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('Client connected');

  // Send real-time data
  const interval = setInterval(() => {
    ws.send(JSON.stringify({
      type: 'update',
      data: getLatestData()
    }));
  }, 5000);

  ws.on('close', () => {
    clearInterval(interval);
    console.log('Client disconnected');
  });
});
```

---

## Infrastructure Optimization

### 1. Load Balancing

#### Nginx Load Balancing
```nginx
upstream backend {
    least_conn;  # Load balancing method
    server backend1.example.com weight=3 max_fails=3 fail_timeout=30s;
    server backend2.example.com weight=2 max_fails=3 fail_timeout=30s;
    server backend3.example.com weight=1 max_fails=3 fail_timeout=30s;
}

server {
    location /api {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Health checks
        proxy_next_upstream error timeout http_500 http_502 http_503;
        proxy_connect_timeout 5s;
        proxy_read_timeout 30s;
    }
}
```

#### HAProxy Configuration
```
global
    daemon
    maxconn 4096

defaults
    mode http
    timeout connect 5000ms
    timeout client 50000ms
    timeout server 50000ms

frontend http_front
    bind *:80
    default_backend http_back

backend http_back
    balance roundrobin
    option httpchk GET /health
    server web1 192.168.1.10:80 check
    server web2 192.168.1.11:80 check
    server web3 192.168.1.12:80 check backup
```

### 2. CDN Configuration

#### CloudFront Distribution
```json
{
  "DistributionConfig": {
    "Origins": [
      {
        "Id": "S3Origin",
        "DomainName": "mybucket.s3.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        }
      }
    ],
    "DefaultCacheBehavior": {
      "TargetOriginId": "S3Origin",
      "ViewerProtocolPolicy": "redirect-to-https",
      "TrustedSigners": {
        "Enabled": false,
        "SignerQuantity": 0
      },
      "ForwardedValues": {
        "QueryString": false,
        "Cookies": {
          "Forward": "none"
        }
      },
      "MinTTL": 86400,
      "DefaultTTL": 86400,
      "MaxTTL": 31536000,
      "Compress": true
    },
    "Comment": "My CDN Distribution",
    "Enabled": true,
    "PriceClass": "PriceClass_All"
  }
}
```

### 3. Database Optimization

#### Read Replicas
```javascript
// PostgreSQL with read replicas
const { Pool } = require('pg');

const primaryPool = new Pool({
  host: 'primary-db.example.com',
  database: 'mydb'
});

const replicaPool = new Pool({
  host: 'replica-db.example.com',
  database: 'mydb'
});

// Route writes to primary, reads to replica
async function createUser(userData) {
  const result = await primaryPool.query(
    'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
    [userData.name, userData.email]
  );
  return result.rows[0];
}

async function getUser(id) {
  const result = await replicaPool.query(
    'SELECT * FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0];
}
```

#### Database Sharding
```javascript
// Simple sharding by user ID
function getShardId(userId) {
  return userId % 4; // 4 shards
}

function getConnection(userId) {
  const shardId = getShardId(userId);
  return pools[shardId];
}

// Usage
async function getUserData(userId) {
  const pool = getConnection(userId);
  const result = await pool.query('SELECT * FROM user_data WHERE user_id = $1', [userId]);
  return result.rows[0];
}
```

---

## Memory Optimization

### 1. Garbage Collection Optimization

#### Node.js GC Tuning
```bash
# Increase heap size
node --max-old-space-size=4096 app.js

# Enable concurrent GC
node --incremental app.js

# Profile GC
node --trace-gc --trace-gc-verbose app.js
```

#### Memory Leak Detection
```javascript
// Heap snapshot comparison
const heapdump = require('heapdump');

process.on('SIGUSR2', () => {
  heapdump.writeSnapshot((err, filename) => {
    console.log('Heap snapshot written to', filename);
  });
});

// Using clinic.js for memory analysis
npm install -g clinic
clinic doctor -- node app.js
clinic heap -- node app.js
```

### 2. Stream Processing

#### Large File Processing
```javascript
const fs = require('fs');
const stream = require('stream');
const { Transform } = stream;

// Transform stream to process data
class CSVProcessor extends Transform {
  constructor(options) {
    super(options);
    this.lineCount = 0;
  }

  _transform(chunk, encoding, callback) {
    const lines = chunk.toString().split('\n');
    this.lineCount += lines.length;

    const processed = lines
      .filter(line => line.trim())
      .map(line => `PROCESSED: ${line}`)
      .join('\n');

    this.push(processed);
    callback();
  }
}

// Stream processing (memory efficient)
const readStream = fs.createReadStream('large-file.csv');
const writeStream = fs.createWriteStream('output.csv');
const processor = new CSVProcessor();

readStream
  .pipe(processor)
  .pipe(writeStream);
```

---

**Estado**: Técnicas documentadas para optimización completa
**Frontend**: Rendering, JS, CSS, images, fonts
**Backend**: Database, caching, API, async processing
**Infrastructure**: Load balancing, CDN, sharding
**Memory**: GC optimization, stream processing
