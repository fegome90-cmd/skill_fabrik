# Performance Metrics - Colección y Análisis

## Performance Metrics Framework

### 1. Frontend Performance Metrics

#### Core Web Vitals

**Largest Contentful Paint (LCP)**
- **Definition**: Time from page load to largest content element render
- **Good**: < 2.5 seconds
- **Needs Improvement**: 2.5 - 4.0 seconds
- **Poor**: > 4.0 seconds

```javascript
// Measure LCP
import { getLCP } from 'web-vitals';

getLCP(metric => {
  console.log('LCP:', metric.value);
  // Send to analytics
  analytics.track('lcp', {
    value: metric.value,
    id: metric.id,
    rating: getRating(metric.value, 2500, 4000)
  });
});
```

**First Input Delay (FID)**
- **Definition**: Time from first user interaction to browser response
- **Good**: < 100 milliseconds
- **Needs Improvement**: 100 - 300 milliseconds
- **Poor**: > 300 milliseconds

```javascript
// Measure FID
import { getFID } from 'web-vitals';

getFID(metric => {
  console.log('FID:', metric.value);
  analytics.track('fid', {
    value: metric.value,
    id: metric.id,
    rating: getRating(metric.value, 100, 300)
  });
});
```

**Cumulative Layout Shift (CLS)**
- **Definition**: Visual stability metric (sum of all layout shifts)
- **Good**: < 0.1
- **Needs Improvement**: 0.1 - 0.25
- **Poor**: > 0.25

```javascript
// Measure CLS
import { getCLS } from 'web-vitals';

getCLS(metric => {
  console.log('CLS:', metric.value);
  analytics.track('cls', {
    value: metric.value,
    id: metric.id,
    rating: getRating(metric.value, 0.1, 0.25)
  });
});
```

#### Navigation Timing API
```javascript
function getNavigationTiming() {
  const nav = performance.getEntriesByType('navigation')[0];

  return {
    // DNS
    dnsLookup: nav.domainLookupEnd - nav.domainLookupStart,
    // TCP
    tcpConnection: nav.connectEnd - nav.connectStart,
    // Request
    requestTime: nav.responseStart - nav.requestStart,
    // Response
    responseTime: nav.responseEnd - nav.responseStart,
    // DOM Processing
    domProcessing: nav.domComplete - nav.domLoading,
    // Total
    totalLoadTime: nav.loadEventEnd - nav.navigationStart,
    // Time to First Byte
    ttfb: nav.responseStart - nav.navigationStart,
    // DOM Content Loaded
    domContentLoaded: nav.domContentLoadedEventEnd - nav.navigationStart
  };
}
```

#### Resource Timing API
```javascript
function getResourceMetrics() {
  const resources = performance.getEntriesByType('resource');

  const metrics = resources.reduce((acc, resource) => {
    const type = resource.initiatorType;

    if (!acc[type]) {
      acc[type] = { count: 0, totalDuration: 0 };
    }

    acc[type].count++;
    acc[type].totalDuration += resource.duration;

    return acc;
  }, {});

  // Calculate averages
  Object.keys(metrics).forEach(type => {
    metrics[type].avgDuration = metrics[type].totalDuration / metrics[type].count;
  });

  return metrics;
}
```

### 2. Backend Performance Metrics

#### API Response Time
```javascript
const express = require('express');
const app = express();

// Middleware to measure response time
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const route = req.route ? req.route.path : req.path;

    // Log metrics
    console.log(`[${new Date().toISOString()}] ${req.method} ${route} - ${duration}ms - ${res.statusCode}`);

    // Send to monitoring
    metrics.record({
      name: 'api.response_time',
      value: duration,
      labels: {
        method: req.method,
        route: route,
        status_code: res.statusCode
      }
    });
  });

  next();
});
```

#### Database Query Metrics
```javascript
// Instrument database queries
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'mydb'
});

function instrumentQuery(query, params) {
  const start = Date.now();

  return pool.query(query, params)
    .then(result => {
      const duration = Date.now() - start;

      metrics.record({
        name: 'database.query_duration',
        value: duration,
        labels: {
          query_type: query.trim().split(' ')[0].toUpperCase()
        }
      });

      return result;
    })
    .catch(err => {
      const duration = Date.now() - start;

      metrics.record({
        name: 'database.query_error',
        value: duration,
        labels: {
          query_type: query.trim().split(' ')[0].toUpperCase(),
          error: err.code
        }
      });

      throw err;
    });
}

// Usage
async function getUser(id) {
  const result = await instrumentQuery(
    'SELECT * FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0];
}
```

### 3. System Metrics

#### CPU Usage
```javascript
const os = require('os');

// Node.js
function getCPUUsage() {
  const cpus = os.cpus();
  const total = cpus.reduce((acc, cpu) => {
    const times = cpu.times;
    return acc + times.user + times.nice + times.sys + times.irq + times.idle;
  }, 0);

  const idle = cpus.reduce((acc, cpu) => {
    return acc + cpu.times.idle;
  }, 0);

  return {
    usage: ((total - idle) / total) * 100,
    idle: (idle / total) * 100
  };
}
```

#### Memory Usage
```javascript
function getMemoryUsage() {
  const usage = process.memoryUsage();

  return {
    rss: Math.round(usage.rss / 1024 / 1024), // MB
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
    external: Math.round(usage.external / 1024 / 1024), // MB
    arrayBuffers: Math.round((usage.arrayBuffers || 0) / 1024 / 1024) // MB
  };
}

// Log memory usage periodically
setInterval(() => {
  const memory = getMemoryUsage();
  console.log('Memory usage:', memory);

  metrics.record({
    name: 'process.memory.rss',
    value: memory.rss,
    type: 'gauge'
  });

  metrics.record({
    name: 'process.memory.heap_used',
    value: memory.heapUsed,
    type: 'gauge'
  });
}, 30000); // Every 30 seconds
```

#### Event Loop Lag
```javascript
function measureEventLoopLag() {
  const start = process.hrtime.bigint();

  setImmediate(() => {
    const lag = Number(process.hrtime.bigint() - start) / 1e6; // Convert to milliseconds

    metrics.record({
      name: 'event_loop.lag',
      value: lag,
      type: 'gauge'
    });

    if (lag > 100) {
      console.warn('High event loop lag detected:', lag);
    }

    measureEventLoopLag(); // Schedule next measurement
  });
}

measureEventLoopLag();
```

### 4. Custom Metrics Collection

#### Metrics Collector Class
```javascript
class MetricsCollector {
  constructor(options = {}) {
    this.backend = options.backend || 'console';
    this.endpoint = options.endpoint;
    this.buffer = [];
    this.flushInterval = options.flushInterval || 5000; // 5 seconds
    this.maxBufferSize = options.maxBufferSize || 100;

    this.startFlushing();
  }

  record(metric) {
    const timestamp = Date.now();

    this.buffer.push({
      ...metric,
      timestamp
    });

    // Flush if buffer is full
    if (this.buffer.length >= this.maxBufferSize) {
      this.flush();
    }
  }

  async flush() {
    if (this.buffer.length === 0) return;

    const metrics = [...this.buffer];
    this.buffer = [];

    switch (this.backend) {
      case 'prometheus':
        this.sendToPrometheus(metrics);
        break;
      case 'datadog':
        this.sendToDatadog(metrics);
        break;
      case 'console':
        this.logToConsole(metrics);
        break;
      case 'http':
        await this.sendToHTTP(metrics);
        break;
      default:
        this.logToConsole(metrics);
    }
  }

  startFlushing() {
    setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  logToConsole(metrics) {
    metrics.forEach(metric => {
      console.log(`[${new Date(metric.timestamp).toISOString()}] ${metric.name}: ${metric.value}`, metric.labels || {});
    });
  }

  async sendToHTTP(metrics) {
    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metrics)
      });
    } catch (error) {
      console.error('Failed to send metrics:', error);
    }
  }

  sendToPrometheus(metrics) {
    // Implementation would convert to Prometheus format
    const prometheusMetrics = this.convertToPrometheus(metrics);
    // Send to Prometheus pushgateway or similar
  }

  sendToDatadog(metrics) {
    // Implementation would convert to Datadog format
    // Use datadog-metrics library
  }
}

// Usage
const metrics = new MetricsCollector({
  backend: 'http',
  endpoint: 'http://localhost:8080/metrics',
  flushInterval: 5000,
  maxBufferSize: 100
});

// Record a metric
metrics.record({
  name: 'api.response_time',
  value: 125.5,
  labels: {
    route: '/api/users',
    method: 'GET',
    status_code: '200'
  },
  type: 'histogram'
});
```

### 5. Performance Budgets

#### Budget Configuration
```javascript
// budgets.config.js
module.exports = {
  frontend: {
    // Timing budgets (milliseconds)
    'first-contentful-paint': { budget: 1800, weight: 0.2 },
    'largest-contentful-paint': { budget: 2500, weight: 0.3 },
    'cumulative-layout-shift': { budget: 0.1, weight: 0.2 },
    'speed-index': { budget: 3000, weight: 0.1 },
    'time-to-interactive': { budget: 3800, weight: 0.2 },

    // Size budgets (kilobytes)
    'total-blocking-time': { budget: 200, weight: 0.15 },
    'network-requests': { budget: 50, weight: 0.1 },
    'resource-count': { budget: 50, weight: 0.1 },
    'javascript': { budget: 170, weight: 0.2, unit: 'KB gzip' },
    'css': { budget: 80, weight: 0.15, unit: 'KB gzip' },
    'images': { budget: 1000, weight: 0.1, unit: 'KB total' }
  },

  backend: {
    // Response time budgets (milliseconds)
    'api.response_time.p50': { budget: 100, weight: 0.2 },
    'api.response_time.p95': { budget: 500, weight: 0.3 },
    'api.response_time.p99': { budget: 1000, weight: 0.2 },

    // Error rates (percentage)
    'api.error_rate': { budget: 1, weight: 0.2 },

    // Database query budgets
    'database.query_time.p95': { budget: 50, weight: 0.1 }
  },

  infrastructure: {
    // CPU usage (percentage)
    'cpu.usage': { budget: 70, weight: 0.3 },

    // Memory usage (MB)
    'memory.heap_used': { budget: 512, weight: 0.3 },

    // Disk I/O
    'disk.read_ops': { budget: 1000, weight: 0.1 },
    'disk.write_ops': { budget: 500, weight: 0.1 },

    // Network
    'network.bandwidth': { budget: 100, weight: 0.2, unit: 'MB/s' }
  }
};
```

#### Budget Monitoring
```javascript
class BudgetMonitor {
  constructor(config) {
    this.config = config;
    this.metrics = {};
    this.violations = [];
  }

  record(metricName, value) {
    this.metrics[metricName] = value;
    this.checkBudget(metricName, value);
  }

  checkBudget(metricName, value) {
    const budget = this.findBudget(metricName);

    if (!budget) return;

    const exceeds = value > budget.budget;

    if (exceeds) {
      const violation = {
        metric: metricName,
        actual: value,
        budget: budget.budget,
        deviation: ((value - budget.budget) / budget.budget * 100).toFixed(2),
        timestamp: Date.now()
      };

      this.violations.push(violation);

      console.warn(`🚨 Budget violation: ${metricName}`);
      console.warn(`   Actual: ${value}${budget.unit ? ' ' + budget.unit : ''}`);
      console.warn(`   Budget: ${budget.budget}${budget.unit ? ' ' + budget.unit : ''}`);
      console.warn(`   Deviation: +${violation.deviation}%`);

      // Alert or notification
      this.sendAlert(violation);
    }
  }

  findBudget(metricName) {
    const allBudgets = {
      ...this.config.frontend,
      ...this.config.backend,
      ...this.config.infrastructure
    };

    return allBudgets[metricName];
  }

  sendAlert(violation) {
    // Implement alerting logic
    // - Send to Slack
    // - Create incident
    // - Notify team
  }

  getScore() {
    const allBudgets = {
      ...this.config.frontend,
      ...this.config.backend,
      ...this.config.infrastructure
    };

    let totalScore = 0;
    let totalWeight = 0;

    Object.entries(this.metrics).forEach(([metric, value]) => {
      const budget = allBudgets[metric];
      if (!budget) return;

      const ratio = value / budget.budget;
      const score = Math.max(0, 100 * (2 - ratio)); // Scale 0-100 with penalty for exceeding budget

      totalScore += score * budget.weight;
      totalWeight += budget.weight;
    });

    return totalWeight > 0 ? (totalScore / totalWeight).toFixed(2) : 0;
  }

  getReport() {
    return {
      score: this.getScore(),
      totalMetrics: Object.keys(this.metrics).length,
      violations: this.violations.length,
      details: this.metrics,
      violations_list: this.violations
    };
  }
}
```

### 6. Analytics Integration

#### Google Analytics 4
```javascript
// Send performance metrics to GA4
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToGA4(metric) {
  // Using gtag
  gtag('event', 'web_vitals', {
    event_category: 'Web Vitals',
    event_label: metric.name,
    value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
    non_interaction: true
  });

  // Using Measurement Protocol (server-side)
  fetch('https://www.google-analytics.com/mp/collect', {
    method: 'POST',
    body: JSON.stringify({
      client_id: 'client_id',
      events: [{
        name: 'web_vitals',
        params: {
          metric_name: metric.name,
          metric_value: metric.value,
          metric_id: metric.id
        }
      }]
    })
  });
}

getCLS(sendToGA4);
getFID(sendToGA4);
getFCP(sendToGA4);
getLCP(sendToGA4);
getTTFB(sendToGA4);
```

#### Custom Analytics Dashboard
```javascript
class AnalyticsDashboard {
  constructor() {
    this.metrics = [];
    this.startTime = Date.now();
  }

  record(metric) {
    this.metrics.push({
      ...metric,
      timestamp: Date.now()
    });

    // Keep only last 24 hours
    const cutoff = Date.now() - (24 * 60 * 60 * 1000);
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
  }

  getAverage(metricName) {
    const values = this.metrics
      .filter(m => m.name === metricName)
      .map(m => m.value);

    if (values.length === 0) return 0;

    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  getPercentile(metricName, percentile) {
    const values = this.metrics
      .filter(m => m.name === metricName)
      .map(m => m.value)
      .sort((a, b) => a - b);

    if (values.length === 0) return 0;

    const index = Math.ceil(values.length * percentile) - 1;
    return values[index];
  }

  getTimeSeries(metricName, period = 3600000) { // Last hour
    const cutoff = Date.now() - period;

    return this.metrics
      .filter(m => m.name === metricName && m.timestamp > cutoff)
      .map(m => ({
        timestamp: m.timestamp,
        value: m.value
      }));
  }

  generateReport() {
    return {
      summary: {
        total_metrics: this.metrics.length,
        period_hours: (Date.now() - this.startTime) / (60 * 60 * 1000),
        uptime_hours: ((Date.now() - this.startTime) / (60 * 60 * 1000)).toFixed(2)
      },
      averages: {
        lcp: this.getAverage('lcp'),
        fid: this.getAverage('fid'),
        cls: this.getAverage('cls'),
        api_response: this.getAverage('api.response_time')
      },
      percentiles: {
        lcp_p95: this.getPercentile('lcp', 0.95),
        fid_p95: this.getPercentile('fid', 0.95),
        api_response_p95: this.getPercentile('api.response_time', 0.95)
      }
    };
  }
}

// Usage
const dashboard = new AnalyticsDashboard();

dashboard.record({ name: 'api.response_time', value: 125.5, labels: { route: '/api/users' } });
dashboard.record({ name: 'api.response_time', value: 98.3, labels: { route: '/api/posts' } });

console.log(dashboard.generateReport());
```

### 7. Alerting & Thresholds

#### Alert Rules
```javascript
class AlertManager {
  constructor() {
    this.rules = [];
    this.activeAlerts = new Map();
  }

  addRule(rule) {
    this.rules.push(rule);
  }

  evaluate(metric) {
    this.rules.forEach(rule => {
      if (rule.name !== metric.name) return;

      const value = this.extractValue(metric, rule.metric);

      const shouldAlert = this.checkCondition(value, rule.threshold, rule.operator);

      const alertKey = `${rule.name}:${rule.id}`;

      if (shouldAlert && !this.activeAlerts.has(alertKey)) {
        // Alert triggered
        this.triggerAlert(rule, value);
        this.activeAlerts.set(alertKey, {
          triggeredAt: Date.now(),
          value: value
        });
      } else if (!shouldAlert && this.activeAlerts.has(alertKey)) {
        // Alert resolved
        this.resolveAlert(rule, value);
        this.activeAlerts.delete(alertKey);
      }
    });
  }

  extractValue(metric, metricPath) {
    if (typeof metricPath === 'string' && metricPath.includes('.')) {
      const parts = metricPath.split('.');
      let value = metric;
      for (const part of parts) {
        value = value[part];
      }
      return value;
    }
    return metric[metricPath] || metric.value;
  }

  checkCondition(value, threshold, operator) {
    switch (operator) {
      case '>': return value > threshold;
      case '<': return value < threshold;
      case '>=': return value >= threshold;
      case '<=': return value <= threshold;
      case '==': return value === threshold;
      case '!=': return value !== threshold;
      default: return false;
    }
  }

  triggerAlert(rule, value) {
    const alert = {
      name: rule.name,
      message: rule.message,
      severity: rule.severity,
      value: value,
      threshold: rule.threshold,
      triggeredAt: new Date().toISOString()
    };

    console.error('🚨 ALERT:', alert);

    // Send notifications
    if (rule.notifications) {
      rule.notifications.forEach(notification => {
        this.sendNotification(notification, alert);
      });
    }

    // Store in database
    this.storeAlert(alert);
  }

  resolveAlert(rule, value) {
    const alert = {
      name: rule.name,
      resolvedAt: new Date().toISOString(),
      currentValue: value
    };

    console.log('✅ ALERT RESOLVED:', alert);

    this.storeResolvedAlert(alert);
  }

  sendNotification(notification, alert) {
    switch (notification.type) {
      case 'slack':
        this.sendSlackMessage(notification, alert);
        break;
      case 'email':
        this.sendEmail(notification, alert);
        break;
      case 'webhook':
        this.sendWebhook(notification, alert);
        break;
    }
  }

  async sendSlackMessage(config, alert) {
    // Implementation
  }

  async sendEmail(config, alert) {
    // Implementation
  }

  async sendWebhook(config, alert) {
    await fetch(config.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alert)
    });
  }

  storeAlert(alert) {
    // Store in database
  }

  storeResolvedAlert(alert) {
    // Update database
  }
}

// Setup alert rules
const alertManager = new AlertManager();

alertManager.addRule({
  id: 'high-response-time',
  name: 'api.response_time',
  threshold: 1000, // 1 second
  operator: '>',
  severity: 'warning',
  message: 'API response time is above 1 second',
  notifications: [
    { type: 'slack', channel: '#alerts' },
    { type: 'webhook', url: 'http://localhost:8080/alerts' }
  ]
});

alertManager.addRule({
  id: 'critical-error-rate',
  name: 'api.error_rate',
  threshold: 5, // 5%
  operator: '>',
  severity: 'critical',
  message: 'API error rate is above 5%',
  notifications: [
    { type: 'slack', channel: '#critical' },
    { type: 'email', to: 'devops@company.com' }
  ]
});
```

---

## Metrics Dashboard Configuration

### Grafana Dashboard JSON
```json
{
  "dashboard": {
    "title": "Performance Metrics Dashboard",
    "panels": [
      {
        "title": "API Response Time (p50, p95, p99)",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.50, rate(api_response_time_seconds_bucket[5m]))",
            "legendFormat": "p50"
          },
          {
            "expr": "histogram_quantile(0.95, rate(api_response_time_seconds_bucket[5m]))",
            "legendFormat": "p95"
          },
          {
            "expr": "histogram_quantile(0.99, rate(api_response_time_seconds_bucket[5m]))",
            "legendFormat": "p99"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "singlestat",
        "targets": [
          {
            "expr": "rate(api_requests_total{status=~\"5..\"}[5m]) / rate(api_requests_total[5m]) * 100",
            "legendFormat": "Error Rate"
          }
        ]
      },
      {
        "title": "Core Web Vitals",
        "type": "table",
        "targets": [
          {
            "expr": "avg(web_vitals_lcp)",
            "legendFormat": "LCP"
          },
          {
            "expr": "avg(web_vitals_fid)",
            "legendFormat": "FID"
          },
          {
            "expr": "avg(web_vitals_cls) * 1000",
            "legendFormat": "CLS"
          }
        ]
      },
      {
        "title": "Memory Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "process_memory_heap_used_bytes / 1024 / 1024",
            "legendFormat": "Heap Used (MB)"
          },
          {
            "expr": "process_memory_heap_total_bytes / 1024 / 1024",
            "legendFormat": "Heap Total (MB)"
          }
        ]
      }
    ]
  }
}
```

---

**Estado**: Métricas documentadas con collection y analysis
**Frontend**: Core Web Vitals, Navigation Timing, Resource Timing
**Backend**: API metrics, Database metrics, System metrics
**Analytics**: Custom dashboards, GA4 integration, alerting
**Budgets**: Performance budgets, monitoring, score calculation
