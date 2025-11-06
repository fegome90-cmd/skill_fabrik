# CI/CD Monitoring - Observabilidad y Métricas

## Monitoring y Observability en CI/CD

Esta guía cubre el monitoreo de pipelines, aplicaciones y infrastructure durante deployments.

---

## 1. Pipeline Monitoring

### GitHub Actions - Custom Metrics

```yaml
name: Monitor Pipeline

on: [push]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: |
          START_TIME=$(date +%s)
          npm ci
          END_TIME=$(date +%s)
          echo "INSTALL_DURATION=$((END_TIME - START_TIME))" >> $GITHUB_ENV

      - name: Run tests
        run: |
          START_TIME=$(date +%s)
          npm test
          END_TIME=$(date +%s)
          echo "TEST_DURATION=$((END_TIME - START_TIME))" >> $GITHUB_ENV

      - name: Upload metrics
        run: |
          cat << EOF > metrics.json
          {
            "pipeline": "${{ github.workflow }}",
            "run_id": "${{ github.run_id }}",
            "commit": "${{ github.sha }}",
            "branch": "${{ github.ref_name }}",
            "install_duration": ${{ env.INSTALL_DURATION }},
            "test_duration": ${{ env.TEST_DURATION }},
            "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
          }
          EOF

          curl -X POST ${{ secrets.METRICS_WEBHOOK }} \
            -H 'Content-Type: application/json' \
            -d @metrics.json
```

### Prometheus Metrics for Pipelines

```yaml
# Deploy Prometheus monitoring
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s

    scrape_configs:
      - job_name: 'pipeline-metrics'
        static_configs:
          - targets: ['pipeline-api:8080']
        metrics_path: /metrics
        scrape_interval: 30s

      - job_name: 'application-metrics'
        static_configs:
          - targets: ['app:3000']
        metrics_path: /metrics
        scrape_interval: 15s
```

---

## 2. Application Monitoring

### Custom Metrics Endpoint

```javascript
// metrics.js - Custom metrics endpoint
const express = require('express');
const promClient = require('prom-client');

const app = express();

// Create a registry
const register = new promClient.Registry();

// Add default metrics
promClient.collectDefaultMetrics({
  register,
  timeout: 10000,
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5]
});

// Custom metrics
const httpDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const httpRequests = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

const activeUsers = new promClient.Gauge({
  name: 'active_users_total',
  help: 'Number of active users',
  registers: [register]
});

const databaseConnections = new promClient.Gauge({
  name: 'database_connections_active',
  help: 'Active database connections',
  registers: [register]
});

// Middleware to collect metrics
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

// Update metrics periodically
setInterval(() => {
  activeUsers.set(getActiveUsersCount());
  databaseConnections.set(getDatabaseConnections());
}, 10000);

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.listen(3000);
console.log('Metrics server running on port 3000');
```

### Grafana Dashboard Configuration

```json
{
  "dashboard": {
    "title": "CI/CD Pipeline Monitoring",
    "panels": [
      {
        "title": "Pipeline Duration",
        "type": "graph",
        "targets": [
          {
            "expr": "pipeline_duration_seconds",
            "legendFormat": "{{pipeline}} - {{branch}}"
          }
        ]
      },
      {
        "title": "Test Success Rate",
        "type": "stat",
        "targets": [
          {
            "expr": "rate(test_results_total{status=\"success\"}[5m]) / rate(test_results_total[5m]) * 100",
            "legendFormat": "Success Rate"
          }
        ]
      },
      {
        "title": "Deployment Frequency",
        "type": "graph",
        "targets": [
          {
            "expr": "increase(deployments_total[1h])",
            "legendFormat": "Deployments per hour"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total{status_code=~\"5..\"}[5m]) / rate(http_requests_total[5m]) * 100",
            "legendFormat": "Error Rate %"
          }
        ]
      }
    ]
  }
}
```

---

## 3. Deployment Monitoring

### GitHub Actions - Deployment Status

```yaml
# Monitor deployment status
name: Monitor Deployment

on:
  workflow_run:
    workflows: ["Deploy"]
    types: [completed]

jobs:
  monitor:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install monitoring tools
        run: npm install -g axios

      - name: Monitor application
        run: |
          # Check deployment status
          DEPLOYMENT_STATUS=$(curl -s $PRODUCTION_URL/health)
          echo "Deployment Status: $DEPLOYMENT_STATUS"

          # Verify database connection
          DB_STATUS=$(curl -s $PRODUCTION_URL/api/db-status | jq -r '.status')
          if [ "$DB_STATUS" != "connected" ]; then
            echo "ERROR: Database connection failed"
            exit 1
          fi

          # Check response time
          RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' $PRODUCTION_URL/health)
          echo "Response Time: ${RESPONSE_TIME}s"

          if (( $(echo "$RESPONSE_TIME > 2.0" | bc -l) )); then
            echo "WARNING: Slow response time"
          fi

          # Verify all endpoints
          endpoints=("/api/users" "/api/products" "/api/orders")
          for endpoint in "${endpoints[@]}"; do
            status=$(curl -s -o /dev/null -w "%{http_code}" $PRODUCTION_URL$endpoint)
            if [ "$status" != "200" ]; then
              echo "ERROR: Endpoint $endpoint returned $status"
              exit 1
            fi
          done

      - name: Send metrics
        run: |
          cat << EOF > metrics.json
          {
            "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
            "deployment_id": "${{ github.event.workflow_run.id }}",
            "status": "${{ github.event.workflow_run.conclusion }}",
            "duration": ${{ github.event.workflow_run.run_started_at }},
            "response_time": $RESPONSE_TIME,
            "branch": "${{ github.event.workflow_run.head_branch }}"
          }
          EOF

          curl -X POST ${{ secrets.METRICS_WEBHOOK }} \
            -H 'Content-Type: application/json' \
            -d @metrics.json
```

---

## 4. Error Tracking

### Sentry Integration

```yaml
# GitHub Actions - Sentry deployment tracking
name: Track Deployment

on:
  push:
    branches: [main]

jobs:
  track:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Create Sentry release
        env:
          SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
          SENTRY_ORG: ${{ secrets.SENTRY_ORG }}
          SENTRY_PROJECT: ${{ secrets.SENTRY_PROJECT }}
        run: |
          VERSION="deploy-$(git rev-parse --short HEAD)"
          npx sentry-cli releases new $VERSION \
            --org $SENTRY_ORG \
            --project $SENTRY_PROJECT

      - name: Deploy application
        run: |
          # Your deployment script here

      - name: Finalize Sentry release
        env:
          SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
          SENTRY_ORG: ${{ secrets.SENTRY_ORG }}
          SENTRY_PROJECT: ${{ secrets.SENTRY_PROJECT }}
        run: |
          VERSION="deploy-$(git rev-parse --short HEAD)"
          npx sentry-cli releases finalize $VERSION

      - name: Notify Sentry
        env:
          SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
          SENTRY_ORG: ${{ secrets.SENTRY_ORG }}
          SENTRY_PROJECT: ${{ secrets.SENTRY_PROJECT }}
        run: |
          VERSION="deploy-$(git rev-parse --short HEAD)"
          npx sentry-cli releases set-commits \
            --commit "owner/repo@$VERSION" \
            $VERSION
```

### Application Error Tracking

```javascript
// error-tracking.js - Error tracking middleware
const Sentry = require('@sentry/node');
const { ProfilingIntegration } = require('@sentry/profiling-node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new ProfilingIntegration(),
  ],
  tracesSampleRate: 1.0,
});

// Custom error handler
app.use((err, req, res, next) => {
  // Log to Sentry
  Sentry.captureException(err, {
    tags: {
      endpoint: req.path,
      method: req.method,
    },
    extra: {
      body: req.body,
      query: req.query,
      params: req.params,
    },
  });

  // Log to console
  console.error(err);

  res.status(500).json({
    error: 'Internal server error',
    requestId: req.id,
  });
});

// Error monitoring in CI/CD
app.get('/health', (req, res) => {
  const errorRate = getErrorRate();
  const responseTime = getResponseTime();

  // Add custom metrics
  Sentry.addBreadcrumb({
    category: 'health',
    message: `Health check - Error rate: ${errorRate}%`,
    level: 'info',
  });

  res.json({
    status: 'healthy',
    errorRate,
    responseTime,
    timestamp: new Date().toISOString(),
  });
});
```

---

## 5. Log Aggregation

### ELK Stack Configuration

```yaml
# Logstash configuration
input {
  file {
    path => "/var/log/app/*.log"
    start_position => "beginning"
    codec => json
  }
}

filter {
  if [type] == "application" {
    grok {
      match => {
        "message" => "%{TIMESTAMP_ISO8601:timestamp} %{LOGLEVEL:level} %{DATA:logger} - %{GREEDYDATA:message}"
      }
    }

    date {
      match => [ "timestamp", "yyyy-MM-dd HH:mm:ss.SSS" ]
    }

    if [level] == "ERROR" {
      mutate {
        add_tag => [ "error" ]
      }
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "logs-%{+YYYY.MM.dd}"
  }

  if "error" in [tags] {
    http {
      url => "https://alerts.example.com/webhook"
      http_method => "post"
      format => "message"
      mapping => {
        "message" => "%{message}"
        "level" => "%{level}"
        "@timestamp" => "%{@timestamp}"
      }
    }
  }
}
```

### Fluentd Configuration

```xml
# fluent.conf
<source>
  @type tail
  path /var/log/app/*.log
  pos_file /var/log/fluentd-app.log.pos
  tag app.logs
  format json
  time_key timestamp
  time_format %Y-%m-%d %H:%M:%S
</source>

<match app.logs>
  @type elasticsearch
  host elasticsearch
  port 9200
  index_name app-logs
  type_name _doc

  <buffer>
    @type file
    path /var/log/fluentd-buffers/app.logs.buffer
    flush_mode interval
    retry_type exponential_backoff
    flush_thread_count 2
    flush_interval 5s
    retry_forever
    retry_max_interval 30
    chunk_limit_size 2M
    total_limit_size 500M
    overflow_action block
  </buffer>
</match>
```

---

## 6. Alerting

### Prometheus Alerting Rules

```yaml
# alerts.yml
groups:
  - name: ci-cd
    rules:
      - alert: PipelineFailure
        expr: increase(pipeline_builds_total{status="failed"}[5m]) > 0
        for: 0m
        labels:
          severity: critical
        annotations:
          summary: "Pipeline build failed"
          description: "Pipeline {{ $labels.pipeline }} has failed"

      - alert: LongDeployment
        expr: pipeline_deployment_duration_seconds > 600
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Deployment taking too long"
          description: "Deployment has been running for more than 10 minutes"

      - alert: HighErrorRate
        expr: rate(http_requests_total{status_code=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }}"

      - alert: SlowResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Slow response time"
          description: "95th percentile response time is {{ $value }}s"

      - alert: DatabaseConnectionFailure
        expr: database_connections_active == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Database connection failure"
          description: "No active database connections detected"
```

### AlertManager Configuration

```yaml
# alertmanager.yml
global:
  slack_api_url: 'YOUR_SLACK_API_URL'

route:
  group_by: ['alertname', 'instance']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'web.hook'

receivers:
  - name: 'web.hook'
    slack_configs:
      - channel: '#alerts'
        title: '{{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'
        send_resolved: true

  - name: 'critical-alerts'
    email_configs:
      - to: 'devops@example.com'
        subject: '[CRITICAL] {{ .GroupLabels.alertname }}'
        body: |
          {{ range .Alerts }}
          Alert: {{ .Annotations.summary }}
          Description: {{ .Annotations.description }}
          {{ end }}

  - name: 'pagerduty'
    pagerduty_configs:
      - routing_key: YOUR_PAGERDUTY_KEY
        description: '{{ .GroupLabels.alertname }}'

inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'instance']
```

---

## 7. APM Integration

### New Relic

```javascript
// newrelic.js - APM setup
require('newrelic');

const express = require('express');
const app = express();

app.get('/health', (req, res) => {
  // This will be automatically traced
  res.json({ status: 'healthy' });
});

app.get('/api/users', async (req, res) => {
  // Database query will be traced
  const users = await User.find();

  // External service call will be traced
  await externalService.getData();

  res.json(users);
});

// Custom metrics
app.use((req, res, next) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;

    // Send custom metric
    require('newrelic').recordMetric(
      'Custom/ResponseTime',
      duration
    );
  });

  next();
});

app.listen(3000);
```

### Datadog

```yaml
# Datadog configuration
datadog:
  metrics:
    enabled: true
    statsd_port: 8125

logs:
  enabled: true
  logs_port: 7777
  process_scan_from: proc
  directory: /var/log/app

apm:
  enabled: true
  env: production
  service_name: myapp
  service_version: v1.0.0
```

---

## 8. Uptime Monitoring

### Health Check Endpoint

```javascript
// health.js - Comprehensive health check
const express = require('express');
const axios = require('axios');
const app = express();

app.get('/health', async (req, res) => {
  const checks = {
    database: 'unknown',
    redis: 'unknown',
    externalApi: 'unknown',
    diskSpace: 'unknown',
    memory: 'unknown'
  };

  // Check database
  try {
    await User.findOne().limit(1);
    checks.database = 'ok';
  } catch (error) {
    checks.database = 'error';
  }

  // Check Redis
  try {
    await redis.ping();
    checks.redis = 'ok';
  } catch (error) {
    checks.redis = 'error';
  }

  // Check external API
  try {
    const response = await axios.get('https://api.example.com/health');
    checks.externalApi = response.status === 200 ? 'ok' : 'error';
  } catch (error) {
    checks.externalApi = 'error';
  }

  // Check disk space
  try {
    const stats = await checkDiskSpace('/');
    checks.diskSpace = stats.free > 1024 * 1024 * 100 ? 'ok' : 'low'; // 100MB
  } catch (error) {
    checks.diskSpace = 'unknown';
  }

  // Check memory
  const used = process.memoryUsage();
  const free = 1000 - (used.heapUsed / 1024 / 1024);
  checks.memory = free > 50 ? 'ok' : 'low';

  const allOk = Object.values(checks).every(v => v === 'ok');

  res.status(allOk ? 200 : 503).json({
    status: allOk ? 'healthy' : 'unhealthy',
    checks,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.APP_VERSION || '1.0.0'
  });
});

// Readiness probe
app.get('/ready', async (req, res) => {
  // Check if app is ready to receive traffic
  const dbConnected = await checkDatabase();
  const cacheConnected = await checkCache();

  if (dbConnected && cacheConnected) {
    res.status(200).json({ status: 'ready' });
  } else {
    res.status(503).json({ status: 'not ready' });
  }
});

// Liveness probe
app.get('/live', (req, res) => {
  res.status(200).json({ status: 'alive' });
});

app.listen(3000);
```

### Continuous Monitoring Script

```bash
#!/bin/bash
# monitor.sh - Uptime monitoring
set -e

BASE_URL="${BASE_URL:-http://localhost:3000}"
CHECK_INTERVAL="${CHECK_INTERVAL:-30}"
MAX_RESPONSE_TIME="${MAX_RESPONSE_TIME:-5}"
LOG_FILE="${LOG_FILE:-/var/log/health-check.log}"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

while true; do
  # Health check
  RESPONSE=$(curl -s -w '\n%{http_code}' $BASE_URL/health)
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | head -n-1)

  if [ "$HTTP_CODE" != "200" ]; then
    log "ERROR: Health check failed with status $HTTP_CODE"
    log "$BODY"

    # Send alert
    curl -X POST $ALERT_WEBHOOK \
      -H 'Content-Type: application/json' \
      -d "{\"text\":\"Health check failed: $HTTP_CODE\"}"
  fi

  # Response time check
  RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' $BASE_URL/health)
  if (( $(echo "$RESPONSE_TIME > $MAX_RESPONSE_TIME" | bc -l) )); then
    log "WARNING: Slow response time: ${RESPONSE_TIME}s (threshold: ${MAX_RESPONSE_TIME}s)"
  fi

  log "Health check OK - Response time: ${RESPONSE_TIME}s"

  sleep $CHECK_INTERVAL
done
```

---

## 9. DORA Metrics

### Deployment Frequency

```yaml
# GitHub Actions - DORA metrics collection
name: Collect DORA Metrics

on:
  push:
    branches: [main]

jobs:
  collect:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Collect metrics
        run: |
          # Deployment frequency (deploys per day)
          DEPLOYMENTS_TODAY=$(git log --since="24 hours" --oneline | grep -c "deploy" || echo "0")

          # Lead time for changes (time from commit to production)
          COMMIT_TIME=$(git log -1 --format=%ct)
          DEPLOY_TIME=$(date +%s)
          LEAD_TIME=$((DEPLOY_TIME - COMMIT_TIME))

          # Mean time to recovery (time from incident to recovery)
          # This would be calculated from incident management system

          # Change failure rate
          TOTAL_DEPLOYS=$(git log --since="7 days" --oneline | grep -c "deploy" || echo "0")
          FAILED_DEPLOYS=$(git log --since="7 days" --grep="rollback" --oneline | wc -l)
          FAILURE_RATE=0
          if [ $TOTAL_DEPLOYS -gt 0 ]; then
            FAILURE_RATE=$(echo "scale=2; $FAILED_DEPLOYS * 100 / $TOTAL_DEPLOYS" | bc)
          fi

          cat << EOF > dora-metrics.json
          {
            "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
            "deployment_frequency_per_day": $DEPLOYMENTS_TODAY,
            "lead_time_for_changes_hours": $((LEAD_TIME / 3600)),
            "change_failure_rate_percent": $FAILURE_RATE,
            "total_deployments_7d": $TOTAL_DEPLOYS,
            "failed_deployments_7d": $FAILED_DEPLOYS
          }
          EOF

          # Send to metrics system
          curl -X POST $METRICS_API \
            -H 'Content-Type: application/json' \
            -d @dora-metrics.json
```

---

**Estado**: Monitoring y observabilidad completados
**Pipeline**: Custom metrics, Prometheus integration
**Application**: Prometheus client, Grafana dashboards
**Deployment**: Status monitoring, verification
**Error Tracking**: Sentry integration, custom handlers
**Log Aggregation**: ELK stack, Fluentd configuration
**Alerting**: Prometheus rules, AlertManager
**APM**: New Relic, Datadog integration
**Uptime**: Health checks, continuous monitoring
**DORA Metrics**: Deployment frequency, lead time, failure rate
