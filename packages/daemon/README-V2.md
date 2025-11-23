# Skills Fabrik Daemon V2

**Enhanced orchestration system with PM2 clustering, graceful shutdown, and comprehensive health monitoring**

## 🚀 Overview

Daemon V2 represents a significant evolution from the original daemon, providing enterprise-grade reliability, scalability, and observability. Built with TDD methodology and clean architecture principles, Daemon V2 delivers zero-downtime deployments and predictive health analytics.

### Key Features

- **🔄 PM2 Clustering**: Advanced process management with auto-scaling
- **🛡️ Graceful Shutdown**: Zero-downtime shutdowns with phase-based approach
- **🏥 Health Monitoring**: Predictive analytics and comprehensive diagnostics
- **📊 Metrics Collection**: Real-time performance monitoring and alerting
- **⚡ High Performance**: Optimized for production workloads
- **🔧 Configurable**: Flexible configuration for different environments

## 📋 Architecture

```
Daemon V2 Core
├── 🏗️ Orchestration Layer
│   ├── PM2 Cluster Manager
│   ├── Graceful Shutdown Manager
│   └── Health Check System
├── 📊 Observability Layer
│   ├── Metrics Collector
│   ├── Performance Monitor
│   └── Logger
├── 🌐 API Layer
│   ├── REST Endpoints
│   ├── WebSocket Support
│   └── Status APIs
└── 🔧 Core Services
    ├── Original Daemon Functionality
    ├── Enhanced Request Processing
    └── Background Services
```

## 🚀 Quick Start

### Prerequisites

```bash
# Install PM2 globally
npm install -g pm2

# Install dependencies
pnpm install
```

### Basic Usage

```bash
# Development mode
pnpm run dev:v2

# Production build
pnpm run build:v2

# Start with clustering
pnpm run start:v2

# PM2 cluster management
pnpm run cluster:start    # Start with PM2
pnpm run cluster:stop     # Stop cluster
pnpm run cluster:restart  # Restart cluster
pnpm run cluster:monitor  # Open PM2 monitor
```

### Health Checks

```bash
# Perform health check
pnpm run health:check

# View detailed health report
curl http://localhost:7730/health/v2
```

### Testing

```bash
# Run all V2 tests
pnpm run test:v2

# Run tests with coverage
pnpm run test:v2:coverage

# Watch mode for development
pnpm run test:v2:watch
```

## ⚙️ Configuration

### Environment Variables

```bash
# Daemon Configuration
SF_DAEMON_MODE=production          # Mode: development|staging|production
SF_PORT=7730                       # Daemon port

# Clustering
SF_CLUSTER_SIZE=max                # Number of instances (max for auto)
SF_MAX_MEMORY=2G                   # Memory limit per instance

# Health Monitoring
SF_HEALTH_CHECK_INTERVAL=30000     # Health check interval (ms)
SF_HEALTH_TIMEOUT=5000             # Health check timeout (ms)
SF_ENABLE_PREDICTIVE_ANALYSIS=true # Enable predictive health analysis

# Graceful Shutdown
SF_GRACEFUL_SHUTDOWN_TIMEOUT=30000 # Total shutdown timeout (ms)
SF_WAIT_ACTIVE_REQUESTS=true       # Wait for active requests
SF_SAVE_STATE_ON_SHUTDOWN=true     # Save state before shutdown

# Metrics
SF_METRICS_ENABLED=true            # Enable metrics collection
SF_METRICS_PORT=9090               # Metrics endpoint port
SF_METRICS_PATH=/metrics           # Metrics endpoint path
```

### Custom Configuration

```typescript
import { DaemonV2 } from './dist/daemon-v2.js';

const daemon = new DaemonV2({
  // Clustering configuration
  enableClustering: true,
  clusterConfig: {
    instances: 'max',              // Number of instances
    maxMemory: '2G',               // Memory limit per instance
    execMode: 'cluster',           // 'fork' or 'cluster'
    autoRestart: true,
    maxRestarts: 10,
    minUptime: '10s'
  },

  // Health monitoring configuration
  enableHealthMonitoring: true,
  healthConfig: {
    checkInterval: 30000,          // Check every 30 seconds
    timeoutThreshold: 5000,        // Individual check timeout
    enablePredictiveAnalysis: true,
    customChecks: [],              // Custom health checks
    alertThresholds: {
      memoryUsage: 85,             // Alert at 85% memory usage
      cpuUsage: 80,                // Alert at 80% CPU usage
      errorRate: 5                 // Alert at 5% error rate
    }
  },

  // Graceful shutdown configuration
  enableGracefulShutdown: true,
  shutdownConfig: {
    timeout: 30000,                // Total shutdown timeout
    gracefulTimeout: 15000,        // Graceful period timeout
    drainTimeout: 10000,           // Connection drain timeout
    waitActiveRequests: true,      // Wait for active requests
    enableMetrics: true,           // Collect shutdown metrics
    saveState: true,               // Save application state
    cleanupTempFiles: true         // Cleanup temporary files
  },

  // Metrics configuration
  enableMetrics: true,
  metricsConfig: {
    collectPerformanceMetrics: true,
    collectBusinessMetrics: true,
    exportFormat: 'prometheus',     // 'prometheus' or 'json'
    exportInterval: 30000         // Export every 30 seconds
  }
});
```

## 🔧 API Endpoints

### Health Monitoring

```bash
# Basic health status
GET /health

# Enhanced V2 health status
GET /health/v2
GET /health/detailed
GET /health/report
GET /health/predictions

# Component-specific health
GET /health/cluster
GET /health/memory
GET /health/database
```

### Cluster Management

```bash
# Cluster status
GET /cluster/status
GET /cluster/metrics
GET /cluster/instances

# Cluster operations
POST /cluster/scale
POST /cluster/restart
POST /cluster/health-check
```

### Metrics and Monitoring

```bash
# Prometheus metrics
GET /metrics

# Performance metrics
GET /metrics/performance
GET /metrics/business

# System statistics
GET /stats
GET /stats/v2
GET /stats/detailed
```

## 📊 Health Monitoring

### Built-in Health Checks

1. **Memory Usage**: Monitors heap and overall memory consumption
2. **CPU Usage**: Tracks CPU utilization and trends
3. **Database Connection**: Validates database connectivity
4. **External Services**: Checks dependency health
5. **Disk Space**: Monitors available disk space
6. **Event Loop Lag**: Measures event loop performance

### Custom Health Checks

```typescript
import { HealthCheckSystem } from './dist/orchestration/health-check-system.js';

const healthSystem = new HealthCheckSystem();

// Add custom health check
healthSystem.addHealthCheck('custom-api', async () => {
  const response = await fetch('https://api.example.com/health');
  const data = await response.json();

  return {
    status: data.status === 'ok' ? 'healthy' : 'unhealthy',
    message: 'External API health',
    value: data.response_time,
    threshold: 1000,
    metadata: data
  };
});
```

### Health Predictions

Daemon V2 includes predictive health analytics:

```typescript
const predictions = await daemon.getHealthPredictions();

// Example prediction
{
  type: 'memory-leak',
  severity: 'high',
  confidence: 0.85,
  timeToImpact: '2h 15m',
  recommendation: 'Restart process or investigate memory usage',
  affectedComponent: 'main-process'
}
```

## 🔄 Clustering with PM2

### Cluster Strategies

1. **Cluster Mode**: Multiple instances with shared port
2. **Fork Mode**: Separate processes with individual ports
3. **Auto-scaling**: Dynamic scaling based on load

### Cluster Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'skills-daemon',
      script: './dist/daemon-v2.js',
      instances: 'max',
      exec_mode: 'cluster',
      max_memory_restart: '2G',
      env: {
        NODE_ENV: 'production',
        SF_DAEMON_MODE: 'cluster'
      },
      // Health checks
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,
      // Logging
      log_file: './logs/daemon-combined.log',
      out_file: './logs/daemon-out.log',
      error_file: './logs/daemon-error.log'
    }
  ]
};
```

### Scaling Operations

```bash
# Scale to 4 instances
curl -X POST http://localhost:7730/cluster/scale \
  -H "Content-Type: application/json" \
  -d '{"instances": 4}'

# Enable auto-scaling
curl -X POST http://localhost:7730/cluster/autoscale \
  -H "Content-Type: application/json" \
  -d '{
    "minInstances": 2,
    "maxInstances": 8,
    "scaleUpThreshold": 75,
    "scaleDownThreshold": 25
  }'
```

## 🛡️ Graceful Shutdown

### Shutdown Phases

1. **Notify**: Inform systems of impending shutdown
2. **Drain**: Stop accepting new requests
3. **Wait**: Allow active requests to complete
4. **Save State**: Persist critical application state
5. **Cleanup**: Release resources and temporary files
6. **Close Connections**: Close database and external connections
7. **Stop Listeners**: Terminate event listeners and timers

### Shutdown Configuration

```typescript
// Configure graceful shutdown behavior
const shutdownManager = new GracefulShutdownManager({
  timeout: 30000,           // 30 seconds total
  gracefulTimeout: 15000,   // 15 seconds for graceful period
  drainTimeout: 10000,      // 10 seconds to drain connections
  waitActiveRequests: true, // Wait for requests to complete
  saveState: true,         // Save application state
  cleanupTempFiles: true,   // Cleanup temporary files
  notifyBeforeShutdown: 5000 // Notify 5 seconds before shutdown
});
```

### Request Tracking

```typescript
// Track requests during shutdown
shutdownManager.registerRequest('request-123');

// Process request...
try {
  // Handle request
} finally {
  // Unregister when complete
  shutdownManager.unregisterRequest('request-123');
}
```

## 📈 Performance Monitoring

### Metrics Collection

Daemon V2 automatically collects:

- **System Metrics**: CPU, memory, disk usage
- **Application Metrics**: Requests, response times, error rates
- **Business Metrics**: Skill activations, user activity
- **Cluster Metrics**: Instance health, load distribution

### Prometheus Integration

```bash
# Access Prometheus metrics
curl http://localhost:7730/metrics

# Example metrics output
# HELP sf_daemon_uptime_seconds Uptime in seconds
# TYPE sf_daemon_uptime_seconds counter
sf_daemon_uptime_seconds{instance="skills-daemon-0"} 123456.789

# HELP sf_daemon_requests_total Total number of requests
# TYPE sf_daemon_requests_total counter
sf_daemon_requests_total{method="GET",status="200"} 1234
```

### Performance Alerts

Configure performance alerts:

```typescript
const daemon = new DaemonV2({
  performanceConfig: {
    alertThresholds: {
      responseTime: 1000,        // Alert if > 1s
      errorRate: 5,              // Alert if > 5%
      memoryUsage: 85,           // Alert if > 85%
      cpuUsage: 80,              // Alert if > 80%
      queueDepth: 100           // Alert if > 100 queued
    },
    alertChannels: ['console', 'file', 'webhook'],
    alertWebhook: 'https://alerts.example.com/webhook'
  }
});
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
pnpm run test:v2

# Run specific test suites
pnpm run test:v2 -- clustering
pnpm run test:v2 -- health
pnpm run test:v2 -- shutdown

# Run with coverage
pnpm run test:v2:coverage

# Generate test report
pnpm run test:v2 -- --reporter=html
```

### Test Coverage

Daemon V2 maintains comprehensive test coverage:

- **Overall Coverage**: >95%
- **Critical Components**: >98%
- **Integration Tests**: Full end-to-end scenarios
- **Performance Tests**: Load and stress testing
- **Error Scenarios**: Comprehensive error handling

### Test Structure

```
src/__tests__/
├── daemon-v2.test.ts           # Main integration tests
├── orchestration/
│   ├── pm2-cluster-manager.test.ts
│   ├── graceful-shutdown-manager.test.ts
│   └── health-check-system.test.ts
├── observability/
│   ├── metrics-collector.test.ts
│   └── performance-monitor.test.ts
└── utils/
    └── daemon-utils.test.ts
```

## 📁 Logging and Debugging

### Log Levels

```bash
# Set log level
SF_LOG_LEVEL=debug              # debug|info|warn|error

# Configure log outputs
SF_LOG_FORMAT=json              # json|text
SF_LOG_FILE=./logs/daemon.log   # Log file path
SF_LOG_MAX_SIZE=100M            # Max log file size
SF_LOG_MAX_FILES=10             # Max number of log files
```

### Debug Mode

```bash
# Enable debug logging
NODE_ENV=development SF_LOG_LEVEL=debug pnpm run start:v2

# PM2 debugging
pnpm run cluster:monitor        # Open PM2 monitor
pnpm run cluster:logs          # View cluster logs
pm2 show skills-daemon         # Show detailed process info
```

### Structured Logging

```typescript
import { logger } from './dist/observability/logger.js';

logger.info({
  component: 'ClusterManager',
  operation: 'scale',
  instances: 4,
  duration: 1250,
  success: true
}, 'Cluster scaled successfully');
```

## 🚀 Deployment

### Production Deployment

```bash
# Build for production
pnpm run build:v2

# Start with PM2
pnpm run cluster:start

# Verify deployment
curl http://localhost:7730/health/v2
```

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy source and build
COPY . .
RUN pnpm run build:v2

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:7730/health || exit 1

EXPOSE 7730

CMD ["pnpm", "run", "start:v2"]
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: skills-daemon
spec:
  replicas: 3
  selector:
    matchLabels:
      app: skills-daemon
  template:
    metadata:
      labels:
        app: skills-daemon
    spec:
      containers:
      - name: daemon
        image: skills-fabrik/daemon:v2
        ports:
        - containerPort: 7730
        env:
        - name: SF_DAEMON_MODE
          value: "production"
        - name: SF_CLUSTER_SIZE
          value: "3"
        livenessProbe:
          httpGet:
            path: /health
            port: 7730
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 7730
          initialDelaySeconds: 5
          periodSeconds: 5
```

## 🔧 Troubleshooting

### Common Issues

1. **Cluster Won't Start**
   ```bash
   # Check PM2 installation
   pm2 --version

   # Verify ecosystem config
   pm2 start ecosystem.config.js --env development
   ```

2. **Health Checks Failing**
   ```bash
   # Check individual health components
   curl http://localhost:7730/health/detailed

   # Review logs
   pnpm run cluster:logs
   ```

3. **Performance Issues**
   ```bash
   # Monitor resources
   pnpm run cluster:monitor

   # Check metrics
   curl http://localhost:7730/metrics
   ```

### Debug Commands

```bash
# Process information
pm2 show skills-daemon
pm2 describe skills-daemon

# Resource monitoring
pm2 monit
pm2 logs skills-daemon --lines 100

# Restart specific instance
pm2 restart skills-daemon --only 0
```

## 📚 References

- [Router V2 Documentation](../router/README-V2.md)
- [KPI Events System](../kpi/README.md)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Fastify Documentation](https://www.fastify.io/docs/latest/)
- [Vitest Documentation](https://vitest.dev/guide/)

## 🤝 Contributing

When contributing to Daemon V2:

1. Follow TDD methodology - write tests first
2. Maintain >95% test coverage
3. Update documentation for new features
4. Use semantic versioning for releases
5. Follow the established code patterns

## 📄 License

MIT License - see LICENSE file for details.

---

**Daemon V2**: Production-ready orchestration with enterprise-grade reliability and observability.

*Built with ❤️ using TDD methodology and clean architecture principles.*