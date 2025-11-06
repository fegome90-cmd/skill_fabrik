# Performance Testing Tools - Herramientas de Medición

## Frontend Performance Tools

### 1. Lighthouse

#### Installation & Usage
```bash
# Install globally
npm install -g lighthouse

# Run audit
lighthouse https://example.com --output html --output-path report.html

# Chrome flags for consistent results
lighthouse https://example.com \
  --chrome-flags="--headless --no-sandbox --disable-dev-shm-usage"

# Save as JSON
lighthouse https://example.com --output json --output-path report.json

# Only run performance audit
lighthouse https://example.com --only-categories=performance
```

#### Node.js Integration
```javascript
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');

async function runLighthouse(url) {
  const chrome = await chromeLauncher.launch({chromeFlags: ['--headless']});
  const options = {
    logLevel: 'info',
    output: 'json',
    onlyCategories: ['performance'],
    port: chrome.port,
  };
  const runnerResult = await lighthouse(url, options);
  const reportJson = runnerResult.report;
  await chrome.kill();

  return JSON.parse(reportJson);
}

// Usage
runLighthouse('http://localhost:3000').then(results => {
  console.log('LCP:', results.audits['largest-contentful-paint'].displayValue);
  console.log('FID:', results.audits['max-potential-fid'].displayValue);
  console.log('CLS:', results.audits['cumulative-layout-shift'].displayValue);
});
```

#### GitHub Actions Integration
```yaml
name: Lighthouse CI

on: [pull_request]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v9
        with:
          urls: |
            http://localhost:3000/
          uploadArtifacts: true
          temporaryPublicStorage: true
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
```

### 2. WebPageTest

#### API Usage
```bash
# Run test via API
curl -H "Authorization: Bearer YOUR_API_KEY" \
  "https://www.webpagetest.org/runtest.php?url=https://example.com&location=us-east-1&runs=3&f=json"

# Get results
curl "https://www.webpagetest.org/result/ID/?f=json"
```

#### Node.js Client
```javascript
const WebPageTest = require('webpagetest');

const wpt = new WebPageTest('www.webpagetest.org', 'YOUR_API_KEY');

wpt.runTest('https://example.com', {
  location: 'us-east-1',
  connectivity: '4G',
  runs: 3
}, (err, result) => {
  console.log('Load time:', result.data.median.firstView.loadTime);
  console.log('Speed Index:', result.data.median.firstView.SpeedIndex);
});
```

### 3. Core Web Vitals

#### Web Vitals Library
```javascript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

// Log to console
getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);

// Send to analytics
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  const body = JSON.stringify(metric);
  navigator.sendBeacon('/analytics', body);
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

#### Real User Monitoring Setup
```javascript
// Complete RUM implementation
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

class PerformanceMonitor {
  constructor(endpoint) {
    this.endpoint = endpoint;
    this.metrics = [];

    this.setupVitals();
  }

  setupVitals() {
    getCLS(this.onMetric.bind(this));
    getFID(this.onMetric.bind(this));
    getFCP(this.onMetric.bind(this));
    getLCP(this.onMetric.bind(this));
    getTTFB(this.onMetric.bind(this));
  }

  onMetric(metric) {
    const data = {
      name: metric.name,
      value: metric.value,
      id: metric.id,
      delta: metric.delta,
      rating: this.getRating(metric.name, metric.value)
    };

    this.metrics.push(data);
    this.sendMetric(data);
  }

  getRating(metric, value) {
    const thresholds = {
      cls: { good: 0.1, poor: 0.25 },
      fid: { good: 100, poor: 300 },
      fcp: { good: 1800, poor: 3000 },
      lcp: { good: 2500, poor: 4000 },
      ttfb: { good: 800, poor: 1800 }
    };

    const threshold = thresholds[metric.toLowerCase()];
    if (!threshold) return 'unknown';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  sendMetric(metric) {
    // Send via fetch
    fetch(this.endpoint, {
      method: 'POST',
      body: JSON.stringify(metric),
      headers: { 'Content-Type': 'application/json' }
    });

    // Or via sendBeacon
    const body = JSON.stringify(metric);
    navigator.sendBeacon(this.endpoint, body);
  }

  getSummary() {
    const summary = {
      total: this.metrics.length,
      good: this.metrics.filter(m => m.rating === 'good').length,
      needsImprovement: this.metrics.filter(m => m.rating === 'needs-improvement').length,
      poor: this.metrics.filter(m => m.rating === 'poor').length
    };

    summary.score = summary.good / summary.total;
    return summary;
  }
}

// Usage
const monitor = new PerformanceMonitor('/api/vitals');

// Get summary
setTimeout(() => {
  console.log(monitor.getSummary());
}, 10000);
```

### 4. Bundle Analyzers

#### webpack-bundle-analyzer
```bash
# Install
npm install --save-dev webpack-bundle-analyzer

# Generate bundle report
npx webpack-bundle-analyzer dist/bundle.js
```

#### Integration in Webpack
```javascript
// webpack.config.js
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      openAnalyzer: false,
      reportFilename: 'bundle-report.html'
    })
  ]
};
```

#### React Performance Tools
```javascript
// React DevTools Profiler
import { Profiler } from 'react';

function onRenderCallback(id, phase, actualDuration, baseDuration, startTime, commitTime, interactions) {
  console.log(id, phase, actualDuration);
}

<Profiler id="Dashboard" onRender={onRenderCallback}>
  <Dashboard />
</Profiler>

// React.memo for components
const ExpensiveComponent = memo(({ data }) => {
  return <div>{data.map(item => <Item key={item.id} item={item} />)}</div>;
});

// useMemo for expensive calculations
function DataProcessor({ items }) {
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => a.value - b.value);
  }, [items]);

  return <div>{sortedItems.map(item => <Item key={item.id} item={item} />)}</div>;
}
```

---

## Backend Performance Tools

### 1. Node.js Profilers

#### Built-in Profiler
```bash
# Profile application
node --prof app.js

# Process isolate logs
node --prof-process isolate-*.log > profile.txt
cat profile.txt
```

#### Flame Graphs
```bash
# Install flamegraph
npm install -g 0x

# Run with 0x
0x app.js

# Generate SVG
0x --on-port node app.js
```

#### V8 Profiler in Chrome DevTools
```javascript
// Enable profiling
const { PerformanceObserver, performance } = require('perf_hooks');

// Create observer
const obs = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log(entry);
  }
});

obs.observe({ entryTypes: ['measure', 'function'] });

// Mark performance points
performance.mark('start-operation');

await expensiveOperation();

performance.mark('end-operation');
performance.measure('operation-duration', 'start-operation', 'end-operation');
```

### 2. Load Testing Tools

#### autocannon (Node.js)
```bash
# Install
npm install -g autocannon

# Basic usage
autocannon http://localhost:3000/api/users

# With options
autocannon -c 100 -p 10 http://localhost:3000/api/data

# JSON output
autocannon -j http://localhost:3000/api/data > results.json
```

#### Programmatic Usage
```javascript
const autocannon = require('autocannon');

async function runLoadTest() {
  const result = await autocannon({
    url: 'http://localhost:3000/api/users',
    connections: 100,      // Concurrent connections
    pipelining: 10,        // HTTP pipelining
    duration: 30,          // Test duration in seconds
    title: 'Load Test',    // Test title
    method: 'GET',
    headers: {
      'Authorization': 'Bearer token123'
    }
  });

  console.log('Total requests:', result.requests.total);
  printResult(result);
}

function printResult(result) {
  console.log('\n=== Results ===');
  console.log('Requests/sec:', result.requests.average);
  console.log('Latency (ms):');
  console.log('  min:', result.latency.min);
  console.log('  max:', result.latency.max);
  console.log('  average:', result.latency.average);
  console.log('  p50:', result.latency.p50);
  console.log('  p75:', result.latency.p75);
  console.log('  p90:', result.latency.p90);
  console.log('  p95:', result.latency.p95);
  console.log('  p99:', result.latency.p99);
}

runLoadTest().catch(console.error);
```

#### Artillery
```bash
# Install
npm install -g artillery

# Run test
artillery run load-test.yml

# Generate report
artillery report report.json

# Quick test
artillery quick --count 50 --num 10 http://localhost:3000/api/data
```

#### Artillery Configuration Files
```yaml
# load-test.yml
config:
  target: 'http://localhost:3000'
  phases:
    # Warm up
    - duration: 30
      arrivalRate: 10
    # Ramp up
    - duration: 60
      arrivalRate: 50
    # Sustained load
    - duration: 120
      arrivalRate: 100
  # Global defaults
  defaults:
    headers:
      Content-Type: 'application/json'
      Authorization: 'Bearer YOUR_TOKEN'

scenarios:
  - name: 'Get Users'
    weight: 50
    flow:
      - get:
          url: '/api/users'
          capture:
            - json: '$.[0].id'
              as: 'userId'
      - get:
          url: '/api/users/{{ userId }}'
          expect:
            - statusCode: 200
            - hasProperty: 'name'

  - name: 'Create User'
    weight: 50
    flow:
      - post:
          url: '/api/users'
          json:
            name: 'Test User'
            email: 'test{{ $randomInt() }}@example.com'
          expect:
            - statusCode: 201
            - hasProperty: 'id'
```

#### wrk (Lua-based)
```bash
# Install wrk
brew install wrk

# Basic test
wrk -t12 -c400 -d30s http://localhost:3000/api/data

# With custom script
wrk -t12 -c400 -d30s -s custom.lua http://localhost:3000/api/data
```

#### k6 (Modern Load Testing)
```bash
# Install
npm install -g k6

# Run test
k6 run test.js
```

#### k6 Script Example
```javascript
// load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'],   // Error rate under 1%
  },
};

export default function () {
  const response = http.get('http://localhost:3000/api/users');

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
    'has users data': (r) => JSON.parse(r.body).length > 0,
  });

  sleep(1);
}

// Run API test
export function apiTest() {
  const payload = JSON.stringify({
    name: 'Test User',
    email: 'test@example.com'
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const createResponse = http.post('http://localhost:3000/api/users', payload, params);
  check(createResponse, {
    'user created': (r) => r.status === 201,
  });
}
```

### 3. Database Performance Tools

#### PostgreSQL Performance

**pg_stat_statements Extension:**
```sql
-- Enable extension
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Find slow queries
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Find most frequently called queries
SELECT query, calls, total_time, (total_time/calls) as avg_time
FROM pg_stat_statements
ORDER BY calls DESC
LIMIT 10;

-- Find queries with most I/O
SELECT query, shared_blks_hit, shared_blks_read
FROM pg_stat_statements
ORDER BY shared_blks_read DESC
LIMIT 10;
```

**Explain Plan Analysis:**
```sql
-- Analyze query plan
EXPLAIN ANALYZE
SELECT u.name, COUNT(p.id) as post_count
FROM users u
LEFT JOIN posts p ON u.id = p.user_id
WHERE u.created_at > '2025-01-01'
GROUP BY u.id, u.name
ORDER BY post_count DESC;

-- Output
EXPLAIN ANALYZE
SELECT u.name, COUNT(p.id) as post_count
FROM users u
LEFT JOIN posts p ON u.id = p.user_id
WHERE u.created_at > '2025-01-01'
GROUP BY u.id, u.name
ORDER BY post_count DESC;
```

#### MySQL Performance
```sql
-- Enable performance schema
SET GLOBAL performance_schema = ON;

-- Find slow queries
SELECT * FROM performance_schema.events_statements_summary_by_digest
ORDER BY AVG_TIMER_WAIT DESC
LIMIT 10;

-- Analyze queries
EXPLAIN FORMAT=JSON
SELECT u.name, COUNT(p.id) as post_count
FROM users u
JOIN posts p ON u.id = p.user_id
GROUP BY u.id, u.name;
```

### 4. APM (Application Performance Monitoring)

#### New Relic Setup
```javascript
// Install
npm install newrelic

// Require at the top of entry file
require('newrelic');

// Or manual initialization
const newrelic = require('newrelic');

app.get('/api/users', async (req, res) => {
  const segment = newrelic.getSegment(async () => {
    const users = await User.findAll();
    return users;
  });

  const users = await segment.trace();

  res.json(users);
});

// Custom metrics
newrelic.addCustomAttribute('userId', req.user.id);
newrelic.addCustomMetric('Custom/API/Duration', duration);
```

#### Datadog Setup
```javascript
// Install
npm install dd-trace

// Initialize at app start
const tracer = require('dd-trace').init({
  service: 'my-app',
  env: 'production',
  version: '1.0.0'
});

// Auto-instrumentation
const express = require('express');
const app = express();

app.get('/api/users', async (req, res) => {
  const users = await User.findAll();
  res.json(users);
});
```

#### OpenTelemetry
```javascript
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: 'http://localhost:14268/api/traces',
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start().then(() => {
  console.log('Tracing initialized');
}).catch((error) => {
  console.log('Error initializing tracing', error);
}).finally(() => {
  sdk.shutdown().then(() => console.log('Tracing terminated'));
});
```

---

## Infrastructure Monitoring

### 1. Server Monitoring

#### Prometheus Setup
```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'node-app'
    static_configs:
      - targets: ['localhost:3000']

  - job_name: 'postgres'
    static_configs:
      - targets: ['localhost:9187']
```

#### Grafana Dashboard Configuration
```json
{
  "dashboard": {
    "title": "API Performance Dashboard",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{status}}"
          }
        ]
      },
      {
        "title": "Response Time (p95)",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "singlestat",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m]) / rate(http_requests_total[5m])",
            "legendFormat": "Error Rate"
          }
        ]
      }
    ]
  }
}
```

### 2. Custom Metrics

#### Node.js Metrics
```javascript
const promClient = require('prom-client');

// Create a Registry
const register = new promClient.Registry();

// Add default metrics
promClient.collectDefaultMetrics({ register });

// Custom metrics
const httpDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const httpRequests = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

// Express middleware
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;

    httpDuration
      .labels(req.method, route, res.statusCode.toString())
      .observe(duration);

    httpRequests
      .labels(req.method, route, res.statusCode.toString())
      .inc();
  });

  next();
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

### 3. Performance Testing CI/CD

#### GitHub Actions Workflow
```yaml
# .github/workflows/performance.yml
name: Performance Tests

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  load-test:
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    steps:
      - uses: actions/checkout@v4

      - name: Start application
        run: |
          npm install
          npm run build
          npm start &
          sleep 30

      - name: Run load test
        run: |
          npm install -g autocannon
          autocannon -c 50 -d 60 http://localhost:3000/api/health > load-test-results.txt

      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: load-test-results
          path: load-test-results.txt

  lighthouse:
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4

      - name: Run Lighthouse
        run: |
          npm install -g lighthouse
          lighthouse http://localhost:3000 --output json --output-path lighthouse-report.json

      - name: Check performance budget
        run: |
          node scripts/check-budget.js lighthouse-report.json

      - name: Upload Lighthouse report
        uses: actions/upload-artifact@v3
        with:
          name: lighthouse-report
          path: lighthouse-report.json
```

#### Performance Budget Check
```javascript
// scripts/check-budget.js
const fs = require('fs');
const lighthouseResult = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));

const budgets = {
  'first-contentful-paint': 1800,
  'largest-contentful-paint': 2500,
  'cumulative-layout-shift': 0.1,
  'speed-index': 3000,
};

let passed = true;

Object.keys(budgets).forEach(metric => {
  const actual = lighthouseResult.audits[metric].numericValue;
  const budget = budgets[metric];
  const passed_check = actual <= budget;

  console.log(`${metric}: ${Math.round(actual)}ms (budget: ${budget}ms) ${passed_check ? '✅' : '❌'}`);

  if (!passed_check) {
    passed = false;
  }
});

if (!passed) {
  console.log('\n❌ Performance budget exceeded!');
  process.exit(1);
} else {
  console.log('\n✅ All performance budgets passed!');
}
```

---

## Monitoring & Alerting

### 1. Uptime Monitoring

#### Basic Health Check Script
```bash
#!/bin/bash
# monitor.sh

URL="${1:-http://localhost:3000}"
THRESHOLD="${2:-2}"
LOG_FILE="${3:-/var/log/health-check.log}"

check_health() {
  response=$(curl -o /dev/null -s -w '%{time_total}' "$URL")
  http_code=$(curl -o /dev/null -s -w '%{http_code}' "$URL")

  if [ "$http_code" != "200" ]; then
    echo "[$(date)] ERROR: Health check failed with status $http_code" | tee -a "$LOG_FILE"
    return 1
  fi

  if (( $(echo "$response > $THRESHOLD" | bc -l) )); then
    echo "[$(date)] WARNING: Slow response time: ${response}s (threshold: ${THRESHOLD}s)" | tee -a "$LOG_FILE"
    return 1
  fi

  echo "[$(date)] OK: Response time: ${response}s" | tee -a "$LOG_FILE"
  return 0
}

check_health
```

### 2. Alert Management

#### Prometheus Alerting Rules
```yaml
# alerts.yml
groups:
  - name: api-performance
    rules:
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time detected"
          description: "95th percentile response time is {{ $value }}s"

      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }}"

      - alert: SlowDatabaseQueries
        expr: histogram_quantile(0.95, rate(database_query_duration_seconds_bucket[5m])) > 0.5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Slow database queries"
          description: "95th percentile query time is {{ $value }}s"
```

---

**Estado**: Herramientas documentadas y configuradas
**Frontend**: Lighthouse, WebPageTest, Web Vitals, Bundle analyzers
**Backend**: Node profilers, load testing (autocannon, artillery, k6, wrk)
**Database**: PostgreSQL/MySQL performance tools
**APM**: New Relic, Datadog, OpenTelemetry
**Infrastructure**: Prometheus, Grafana, custom metrics
