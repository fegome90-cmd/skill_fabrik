# Plan: Completar Integración Daemon-PM2 - Skills Fabrik

## Overview

Este plan implementa la integración completa del daemon con PM2 para proporcionar gestión robusta de procesos, monitoreo production-ready y alta disponibilidad para el sistema skills-fabrik.

## CLOOP Methodology Application

### **C1 - CLARIFY: Establecer Objetivos**

**Objetivo Principal**: Integrar completamente el daemon con PM2 para gestión robusta de procesos

**Success Criteria**:
- ✅ PM2 instalado y configurado globalmente
- ✅ Todos los servicios (daemon, router, skills-cli) gestionados por PM2
- ✅ Auto-restart automático en fallos
- ✅ Health checks comprehensivos
- ✅ Monitoring y alerting funcional
- ✅ Service discovery dinámico
- ✅ Logs centralizados y estructurados

**Scope**:
- **Incluye**: PM2 setup, daemon integration, enhanced monitoring, health checks
- **No incluye**: Redis cache migration, clustering avanzado, distributed tracing

### **C2 - LAYOUT: Diseño de Implementación**

#### **Arquitectura Target**

```
PM2 Process Manager
├── sf-daemon (Port 7727)
│   ├── Fastify Server + Enhanced Monitoring
│   ├── Health Check Endpoint (/health)
│   ├── Metrics Endpoint (/metrics)
│   └── Auto-restart Policy
├── router-service (Port 3000)
│   ├── Enhanced Configuration
│   ├── Dependency on daemon
│   └── Health Monitoring
└── skills-cli-service
    ├── CLI Wrapper Service
    └── Background Task Management
```

#### **Implementation Phases**

**Phase 1: PM2 Foundation (Priority Critical)**
- PM2 installation y setup básico
- Enhanced ecosystem configuration
- Daemon integration con PM2
- CLI commands actualizados

**Phase 2: Service Integration (Priority High)**
- Health checks comprehensivos
- Service dependency management
- Startup ordering implementation
- Environment configuration

**Phase 3: Advanced Features (Priority Medium)**
- Monitoring y alerting
- Log management y rotation
- Performance optimization
- Documentation y playbooks

### **C3 - OPERATE: Ejecución Detallada**

## **Phase 1: PM2 Foundation Setup (Days 1-2)**

### **Task 1.1: PM2 Installation**
```bash
# Global installation
npm install -g pm2

# Local development dependency
pnpm add -D pm2

# Verification
pm2 --version
pm2 list
```

### **Task 1.2: Enhanced Ecosystem Configuration**

**Archivo**: `scripts/pm2/ecosystem.config.cjs`

```javascript
/**
 * Enhanced PM2 Ecosystem Configuration
 *
 * Complete service management with health checks,
 * dependency ordering, and monitoring.
 */

module.exports = {
  apps: [
    {
      // Daemon Service - Core System Component
      name: 'sf-daemon',
      cwd: './packages/daemon',
      script: 'node',
      args: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',

      // Process Management
      autorestart: true,
      watch: false,
      max_memory_restart: '400M',
      min_uptime: '10s',
      max_restarts: 10,

      // Logging
      error_file: './logs/daemon-error.log',
      out_file: './logs/daemon-out.log',
      log_file: './logs/daemon-combined.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      log_type: 'json',

      // Environment
      env: {
        NODE_ENV: 'development',
        SF_PORT: 7727,
        SF_HOST: '127.0.0.1',
        LOG_LEVEL: 'info'
      },
      env_production: {
        NODE_ENV: 'production',
        SF_PORT: 7727,
        SF_HOST: '0.0.0.0',
        LOG_LEVEL: 'warn'
      },

      // Health Monitoring
      health_check_url: 'http://127.0.0.1:7727/health',
      health_check_grace_period: 3000,
      health_check_interval: 5000,

      // Advanced Options
      kill_timeout: 5000,
      restart_delay: 4000,
      source_map_support: true
    },

    {
      // Router Service - Depends on Daemon
      name: 'router-service',
      cwd: './packages/router',
      script: 'node',
      args: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',

      // Process Management
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      min_uptime: '10s',

      // Logging
      error_file: './logs/router-error.log',
      out_file: './logs/router-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // Environment
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        DAEMON_URL: 'http://127.0.0.1:7727'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        DAEMON_URL: 'http://sf-daemon:7727'
      },

      // Health Monitoring
      health_check_url: 'http://127.0.0.1:3000/health',
      health_check_grace_period: 5000,

      // Dependencies
      dependencies: ['sf-daemon'],
      wait_ready: true,
      listen_timeout: 10000
    },

    {
      // Skills CLI Service - Background Tasks
      name: 'skills-cli-service',
      cwd: './packages/skills-cli',
      script: 'node',
      args: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',

      // Process Management
      autorestart: false, // Manual start for background tasks
      watch: false,
      max_memory_restart: '300M',

      // Logging
      error_file: './logs/skills-cli-error.log',
      out_file: './logs/skills-cli-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // Environment
      env: {
        NODE_ENV: 'development',
        CLI_MODE: 'service'
      },
      env_production: {
        NODE_ENV: 'production',
        CLI_MODE: 'service'
      }
    }
  ],

  // Deploy Configuration
  deploy: {
    production: {
      user: 'deploy',
      host: 'production-server',
      ref: 'origin/main',
      repo: 'git@github.com:username/skills-fabrik.git',
      path: '/var/www/skills-fabrik',
      'pre-deploy-local': '',
      'post-deploy': 'pnpm install && pnpm -w build && pm2 reload ecosystem.config.cjs --env production',
      'pre-setup': ''
    }
  }
};
```

### **Task 1.3: Enhanced CLI Commands**

**Archivo**: `packages/skills-cli/src/commands/daemon.ts`

```typescript
import { Command } from 'commander';
import { execSync, spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';

export function daemonCommand(program: Command) {
  const cmd = program.command('daemon').description('Manage Skill Fabric daemon via PM2');

  // Start daemon with PM2
  cmd
    .command('start')
    .description('Start daemon via PM2')
    .option('-e, --env <environment>', 'Environment (development|production)', 'development')
    .action(async (options) => {
      try {
        console.log(`🚀 Starting sf-daemon (${options.env})...`);

        // Start only daemon service
        execSync(`pm2 start scripts/pm2/ecosystem.config.cjs --only sf-daemon --env ${options.env}`, {
          stdio: 'inherit',
          cwd: process.cwd()
        });

        // Wait and verify health
        setTimeout(async () => {
          try {
            const response = execSync('curl -s http://127.0.0.1:7727/health', {
              encoding: 'utf-8'
            });
            console.log('✅ sf-daemon started successfully');
            console.log('📊 Health:', response.trim());
          } catch {
            console.log('⚠️  sf-daemon started but health check failed');
          }
        }, 3000);

      } catch (error) {
        console.error('❌ Failed to start sf-daemon:', error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  // Stop daemon via PM2
  cmd
    .command('stop')
    .description('Stop daemon via PM2')
    .action(async () => {
      try {
        console.log('🛑 Stopping sf-daemon...');
        execSync('pm2 stop sf-daemon', { stdio: 'inherit' });
        console.log('✅ sf-daemon stopped');
      } catch (error) {
        console.error('❌ Failed to stop sf-daemon:', error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  // Restart daemon via PM2
  cmd
    .command('restart')
    .description('Restart daemon via PM2')
    .action(async () => {
      try {
        console.log('🔄 Restarting sf-daemon...');
        execSync('pm2 restart sf-daemon', { stdio: 'inherit' });

        // Verify health after restart
        setTimeout(async () => {
          try {
            const response = execSync('curl -s http://127.0.0.1:7727/health', {
              encoding: 'utf-8'
            });
            console.log('✅ sf-daemon restarted successfully');
            console.log('📊 Health:', response.trim());
          } catch {
            console.log('⚠️  sf-daemon restarted but health check failed');
          }
        }, 3000);

      } catch (error) {
        console.error('❌ Failed to restart sf-daemon:', error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  // Check daemon status
  cmd
    .command('status')
    .description('Check daemon status and health')
    .action(async () => {
      try {
        // PM2 status
        const pm2Status = execSync('pm2 jlist | jq -r \'.[] | select(.name=="sf-daemon") | {\(.name): .pm2_env.status, "uptime": .pm2_env.pm_uptime, "memory": .monit.memory}\'', {
          encoding: 'utf-8'
        });

        if (pm2Status.trim()) {
          console.log('📊 PM2 Status:');
          console.log(JSON.stringify(JSON.parse(pm2Status), null, 2));
        } else {
          console.log('❌ sf-daemon not found in PM2');
          return;
        }

        // Health check
        try {
          const health = execSync('curl -s http://127.0.0.1:7727/health', {
            encoding: 'utf-8'
          });
          console.log('🏥 Health Check:');
          console.log(JSON.stringify(JSON.parse(health), null, 2));
        } catch {
          console.log('❌ Health check failed - daemon may be unhealthy');
        }

      } catch (error) {
        console.error('❌ Failed to check daemon status:', error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  // View daemon logs
  cmd
    .command('logs')
    .description('View daemon logs')
    .option('-n, --lines <number>', 'Number of lines to show', '100')
    .option('-f, --follow', 'Follow log output')
    .action(async (options) => {
      try {
        const args = ['logs', 'sf-daemon'];
        if (options.lines) args.push('--lines', options.lines);
        if (options.follow) args.push('--raw');

        execSync(`pm2 ${args.join(' ')}`, { stdio: 'inherit' });
      } catch (error) {
        console.error('❌ Failed to view logs:', error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  // Monitor daemon
  cmd
    .command('monit')
    .description('Open PM2 monitoring dashboard')
    .action(async () => {
      try {
        execSync('pm2 monit', { stdio: 'inherit' });
      } catch (error) {
        console.error('❌ Failed to open monitor:', error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });
}
```

### **Task 1.4: Environment Setup**

**Archivo**: `.env.example`

```bash
# Skills Fabrik Environment Configuration

# Daemon Configuration
SF_HOST=127.0.0.1
SF_PORT=7727
SF_LOG_LEVEL=info

# Database Configuration (Optional)
PG_HOST=localhost
PG_PORT=5432
PG_USER=username
PG_PASSWORD=password
PG_DATABASE=skills_fabrik

# Redis Configuration (Future caching)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_URL=redis://localhost:6379

# Router Configuration
PORT=3000
DAEMON_URL=http://127.0.0.1:7727

# PM2 Configuration
PM2_HOME=.pm2
PM2_LOG_DATE_FORMAT=YYYY-MM-DD HH:mm:ss Z

# Monitoring
METRICS_ENABLED=true
HEALTH_CHECK_INTERVAL=5000

# Environment
NODE_ENV=development
LOG_LEVEL=info
```

## **Phase 2: Service Integration (Days 3-4)**

### **Task 2.1: Enhanced Health Checks**

**Daemon Health Enhancement** - `packages/daemon/src/app.ts`

```typescript
// Enhanced health endpoint
app.get('/health', async (request, reply) => {
  const startedAt = app.startedAt || Date.now();
  const uptime = Date.now() - startedAt;

  // Database health check
  let dbStatus = 'not_configured';
  if (db) {
    try {
      await db.query('SELECT 1');
      dbStatus = 'healthy';
    } catch {
      dbStatus = 'unhealthy';
    }
  }

  // Cache health check
  const cacheSize = actCache.size;
  const cacheHitRate = activationLatencies.length > 0
    ? (activationLatencies.reduce((a, b) => a + b, 0) / activationLatencies.length).toFixed(2)
    : '0';

  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime,
    version: process.env.npm_package_version || '0.1.0',
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: dbStatus,
      cache: {
        status: 'healthy',
        size: cacheSize,
        hitRate: `${cacheHitRate}ms`
      }
    },
    metrics: {
      totalActivations: activationLatencies.length,
      averageLatency: `${cacheHitRate}ms`,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage()
    }
  };

  // Return appropriate HTTP status based on health
  const statusCode = dbStatus === 'unhealthy' ? 503 : 200;
  reply.code(statusCode).send(health);
});
```

### **Task 2.2: Router Health Endpoint**

**Archivo**: `packages/router/src/health.ts`

```typescript
import { FastifyInstance } from 'fastify';

export async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/health', async (request, reply) => {
    const startTime = Date.now();

    try {
      // Check daemon dependency
      const daemonHealthy = await checkDaemonHealth();

      const health = {
        status: daemonHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '0.1.0',
        environment: process.env.NODE_ENV || 'development',
        dependencies: {
          daemon: {
            url: process.env.DAEMON_URL || 'http://127.0.0.1:7727',
            status: daemonHealthy ? 'healthy' : 'unhealthy',
            responseTime: `${Date.now() - startTime}ms`
          }
        },
        metrics: {
          memoryUsage: process.memoryUsage(),
          cpuUsage: process.cpuUsage()
        }
      };

      const statusCode = daemonHealthy ? 200 : 503;
      reply.code(statusCode).send(health);

    } catch (error) {
      reply.code(503).send({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
}

async function checkDaemonHealth(): Promise<boolean> {
  try {
    const daemonUrl = process.env.DAEMON_URL || 'http://127.0.0.1:7727';
    const response = await fetch(`${daemonUrl}/health`, {
      method: 'GET',
      timeout: 5000
    });
    return response.ok;
  } catch {
    return false;
  }
}
```

### **Task 2.3: Service Dependency Scripts**

**Archivo**: `scripts/pm2/startup-manager.mjs`

```javascript
#!/usr/bin/env node

/**
 * Service Startup Manager
 *
 * Manages startup ordering and dependencies for PM2 services
 */

import { execSync } from 'child_process';
import { setTimeout } from 'timers/promises';

class ServiceManager {
  constructor() {
    this.services = [
      { name: 'sf-daemon', port: 7727, dependencies: [] },
      { name: 'router-service', port: 3000, dependencies: ['sf-daemon'] },
      { name: 'skills-cli-service', port: null, dependencies: ['sf-daemon'] }
    ];
  }

  async startAll(env = 'development') {
    console.log('🚀 Starting all services...');

    for (const service of this.services) {
      await this.startService(service, env);
    }

    console.log('✅ All services started successfully');
    await this.healthCheck();
  }

  async startService(service, env) {
    console.log(`Starting ${service.name}...`);

    // Wait for dependencies
    for (const dep of service.dependencies) {
      await this.waitForService(dep);
    }

    try {
      execSync(`pm2 start scripts/pm2/ecosystem.config.cjs --only ${service.name} --env ${env}`, {
        stdio: 'inherit'
      });

      if (service.port) {
        await this.waitForService(service.name);
      }

      console.log(`✅ ${service.name} started`);
    } catch (error) {
      console.error(`❌ Failed to start ${service.name}:`, error.message);
      throw error;
    }
  }

  async waitForService(serviceName) {
    const service = this.services.find(s => s.name === serviceName);
    if (!service?.port) return;

    console.log(`Waiting for ${serviceName} to be healthy...`);

    const maxAttempts = 30;
    const interval = 2000;

    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = execSync(`curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:${service.port}/health`, {
          encoding: 'utf-8'
        });

        if (response.trim() === '200') {
          console.log(`✅ ${serviceName} is healthy`);
          return;
        }
      } catch {
        // Service not ready yet
      }

      await setTimeout(interval);
    }

    throw new Error(`${serviceName} failed to become healthy after ${maxAttempts * interval / 1000}s`);
  }

  async healthCheck() {
    console.log('🔍 Performing health check...');

    for (const service of this.services) {
      if (!service.port) continue;

      try {
        const response = execSync(`curl -s http://127.0.0.1:${service.port}/health`, {
          encoding: 'utf-8'
        });

        const health = JSON.parse(response);
        console.log(`✅ ${service.name}: ${health.status}`);
      } catch {
        console.log(`❌ ${service.name}: unhealthy`);
      }
    }
  }
}

// CLI interface
const command = process.argv[2];
const env = process.argv[3] || 'development';

const manager = new ServiceManager();

switch (command) {
  case 'start':
    await manager.startAll(env);
    break;
  case 'health':
    await manager.healthCheck();
    break;
  default:
    console.log('Usage: node startup-manager.mjs <start|health> [environment]');
    process.exit(1);
}
```

## **Phase 3: Advanced Features (Days 5-6)**

### **Task 3.1: Monitoring Dashboard**

**Archivo**: `scripts/monitoring/dashboard.mjs`

```javascript
#!/usr/bin/env node

/**
 * PM2 Monitoring Dashboard
 *
 * Real-time monitoring for all services
 */

import { execSync } from 'child_process';
import { setInterval } from 'timers';

class MonitoringDashboard {
  constructor() {
    this.services = ['sf-daemon', 'router-service', 'skills-cli-service'];
  }

  async start() {
    console.clear();
    console.log('🔍 Skills Fabrik - PM2 Monitoring Dashboard');
    console.log('=' .repeat(60));

    // Update every 5 seconds
    setInterval(() => this.update(), 5000);

    // Initial update
    await this.update();
  }

  async update() {
    console.clear();
    console.log('🔍 Skills Fabrik - PM2 Monitoring Dashboard');
    console.log(`Last updated: ${new Date().toLocaleString()}`);
    console.log('=' .repeat(60));

    try {
      await this.showServiceStatus();
      console.log();
      await this.showHealthChecks();
      console.log();
      await this.showResourceUsage();
      console.log();
      this.showCommands();
    } catch (error) {
      console.error('❌ Error updating dashboard:', error.message);
    }
  }

  async showServiceStatus() {
    console.log('📊 Service Status:');
    console.log('-' .repeat(40));

    try {
      const output = execSync('pm2 jlist', { encoding: 'utf-8' });
      const processes = JSON.parse(output);

      processes
        .filter(p => this.services.includes(p.name))
        .forEach(process => {
          const status = this.getStatusIcon(process.pm2_env.status);
          const memory = this.formatMemory(process.monit.memory);
          const cpu = process.monit.cpu || 'N/A';

          console.log(`${status} ${process.name.padEnd(20)} ${memory.padEnd(10)} CPU: ${cpu}%`);
        });
    } catch (error) {
      console.log('❌ Unable to fetch PM2 status');
    }
  }

  async showHealthChecks() {
    console.log('🏥 Health Checks:');
    console.log('-' .repeat(40));

    // Daemon health
    try {
      const response = execSync('curl -s http://127.0.0.1:7727/health', {
        encoding: 'utf-8'
      });
      const health = JSON.parse(response);
      console.log(`✅ Daemon: ${health.status} (Uptime: ${Math.floor(health.uptime/1000)}s)`);
    } catch {
      console.log('❌ Daemon: Unhealthy');
    }

    // Router health
    try {
      const response = execSync('curl -s http://127.0.0.1:3000/health', {
        encoding: 'utf-8'
      });
      const health = JSON.parse(response);
      console.log(`✅ Router: ${health.status}`);
    } catch {
      console.log('❌ Router: Unhealthy');
    }
  }

  async showResourceUsage() {
    console.log('💻 System Resources:');
    console.log('-' .repeat(40));

    try {
      const memInfo = execSync('free -h', { encoding: 'utf-8' });
      const loadAvg = execSync('uptime', { encoding: 'utf-8' });

      console.log(loadAvg.trim());

      if (process.platform === 'darwin') {
        const memUsage = execSync('vm_stat | grep "Pages free"', { encoding: 'utf-8' });
        console.log(`Memory: ${memUsage.trim()}`);
      } else {
        const lines = memInfo.split('\n');
        const memLine = lines.find(l => l.startsWith('Mem:'));
        if (memLine) {
          console.log(`Memory: ${memLine.trim()}`);
        }
      }
    } catch (error) {
      console.log('❌ Unable to fetch system info');
    }
  }

  showCommands() {
    console.log('⚡ Quick Commands:');
    console.log('-' .repeat(40));
    console.log('• restart: pm2 restart <service>');
    console.log('• logs: pm2 logs <service>');
    console.log('• monit: pm2 monit');
    console.log('• status: skills-cli daemon status');
    console.log('\nPress Ctrl+C to exit');
  }

  getStatusIcon(status) {
    const icons = {
      'online': '✅',
      'stopped': '⏹️ ',
      'errored': '❌',
      'launching': '🔄',
      'restart': '🔄'
    };
    return icons[status] || '❓';
  }

  formatMemory(bytes) {
    return (bytes / 1024 / 1024).toFixed(1) + 'MB';
  }
}

// Start dashboard
const dashboard = new MonitoringDashboard();
dashboard.start().catch(console.error);
```

### **Task 3.2: Log Management Configuration**

**Archivo**: `scripts/pm2/log-rotation.config.js`

```javascript
/**
 * PM2 Log Rotation Configuration
 */

module.exports = {
  PM2_HOME: process.cwd() + '/.pm2',
  LOG_DATE_FORMAT: 'YYYY-MM-DD HH:mm:ss Z',
  LOG_MAX_SIZE: '10M',
  LOG_RETENTION: '30d',
  LOG_FILE_PATTERN: './logs/*.log',

  // Log rotation settings
  rotate: {
    interval: '1d',
    maxSize: '10M',
    retain: 30,
    compress: true,
    createEmpty: false
  }
};
```

### **Task 3.3: Installation Scripts**

**Archivo**: `scripts/install-pm2.sh`

```bash
#!/bin/bash

# PM2 Installation Script for Skills Fabrik

set -e

echo "🚀 Installing PM2 for Skills Fabrik..."

# Check if PM2 is already installed
if command -v pm2 &> /dev/null; then
    echo "✅ PM2 is already installed ($(pm2 --version))"
    echo "🔄 Updating PM2..."
    npm update -g pm2
else
    echo "📦 Installing PM2 globally..."
    npm install -g pm2
fi

# Install PM2 locally for development
echo "📦 Installing PM2 locally..."
pnpm add -D pm2

# Verify installation
echo "🔍 Verifying installation..."
pm2 --version
pm2 list

# Create logs directory
echo "📁 Creating logs directory..."
mkdir -p logs

# Set up PM2 startup script
echo "🔧 Setting up PM2 startup..."
pm2 startup | tail -n 1 | bash

echo "✅ PM2 installation completed!"
echo ""
echo "Next steps:"
echo "1. Start services: node scripts/pm2/startup-manager.mjs start"
echo "2. Monitor dashboard: node scripts/monitoring/dashboard.mjs"
echo "3. Check status: skills-cli daemon status"
```

## **C4 - OBSERVE: Monitoring y Validación**

### **Test Suite Implementation**

**Archivo**: `test/pm2-integration.test.ts`

```typescript
/**
 * PM2 Integration Test Suite
 */

import { execSync, spawn } from 'child_process';
import { setTimeout } from 'timers/promises';

describe('PM2 Integration Tests', () => {
  const services = ['sf-daemon', 'router-service'];

  beforeAll(async () => {
    // Ensure PM2 is installed
    try {
      execSync('pm2 --version');
    } catch {
      throw new Error('PM2 is not installed. Run: npm install -g pm2');
    }
  });

  afterAll(async () => {
    // Clean up
    execSync('pm2 delete all', { stdio: 'pipe' });
  });

  describe('Service Management', () => {
    test('PM2 should be available', () => {
      const version = execSync('pm2 --version', { encoding: 'utf-8' });
      expect(version).toMatch(/\d+\.\d+\.\d+/);
    });

    test('Should start daemon service', async () => {
      execSync('pm2 start scripts/pm2/ecosystem.config.cjs --only sf-daemon', { stdio: 'pipe' });

      // Wait for service to be healthy
      await setTimeout(5000);

      const response = execSync('curl -s http://127.0.0.1:7727/health', { encoding: 'utf-8' });
      const health = JSON.parse(response);

      expect(health.status).toBe('healthy');
      expect(health.uptime).toBeGreaterThan(0);
    });

    test('Should restart daemon service', async () => {
      execSync('pm2 restart sf-daemon', { stdio: 'pipe' });

      await setTimeout(3000);

      const response = execSync('curl -s http://127.0.0.1:7727/health', { encoding: 'utf-8' });
      const health = JSON.parse(response);

      expect(health.status).toBe('healthy');
    });

    test('Should stop daemon service', async () => {
      execSync('pm2 stop sf-daemon', { stdio: 'pipe' });

      // Verify service is stopped
      expect(() => {
        execSync('curl -s http://127.0.0.1:7727/health', {
          stdio: 'pipe',
          timeout: 2000
        });
      }).toThrow();
    });
  });

  describe('Health Checks', () => {
    beforeAll(async () => {
      execSync('pm2 start scripts/pm2/ecosystem.config.cjs --only sf-daemon', { stdio: 'pipe' });
      await setTimeout(5000);
    });

    afterAll(() => {
      execSync('pm2 stop sf-daemon', { stdio: 'pipe' });
    });

    test('Daemon health endpoint should return detailed status', async () => {
      const response = execSync('curl -s http://127.0.0.1:7727/health', { encoding: 'utf-8' });
      const health = JSON.parse(response);

      expect(health).toHaveProperty('status', 'healthy');
      expect(health).toHaveProperty('timestamp');
      expect(health).toHaveProperty('uptime');
      expect(health).toHaveProperty('version');
      expect(health).toHaveProperty('services');
      expect(health.services).toHaveProperty('cache');
      expect(health.services).toHaveProperty('database');
      expect(health).toHaveProperty('metrics');
    });

    test('Health check should respond within 100ms', async () => {
      const start = Date.now();
      execSync('curl -s http://127.0.0.1:7727/health', { encoding: 'utf-8' });
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    });
  });

  describe('CLI Integration', () => {
    test('Daemon CLI commands should work with PM2', async () => {
      // Test daemon status command
      const status = execSync('node packages/skills-cli/dist/index.js daemon status', {
        encoding: 'utf-8'
      });

      expect(status).toContain('sf-daemon');
    });

    test('Should handle service restarts via CLI', async () => {
      const restart = execSync('node packages/skills-cli/dist/index.js daemon restart', {
        encoding: 'utf-8'
      });

      expect(restart).toContain('successfully');

      await setTimeout(3000);

      const response = execSync('curl -s http://127.0.0.1:7727/health', { encoding: 'utf-8' });
      const health = JSON.parse(response);

      expect(health.status).toBe('healthy');
    });
  });

  describe('Performance Metrics', () => {
    beforeAll(async () => {
      execSync('pm2 start scripts/pm2/ecosystem.config.cjs --only sf-daemon', { stdio: 'pipe' });
      await setTimeout(5000);
    });

    afterAll(() => {
      execSync('pm2 stop sf-daemon', { stdio: 'pipe' });
    });

    test('Memory usage should stay within limits', async () => {
      const jlist = execSync('pm2 jlist', { encoding: 'utf-8' });
      const processes = JSON.parse(jlist);
      const daemon = processes.find(p => p.name === 'sf-daemon');

      expect(daemon.monit.memory).toBeLessThan(400 * 1024 * 1024); // 400MB limit
    });

    test('Service should maintain uptime after restarts', async () => {
      // Get initial uptime
      let health1 = JSON.parse(execSync('curl -s http://127.0.0.1:7727/health', { encoding: 'utf-8' }));
      const initialUptime = health1.uptime;

      // Restart service
      execSync('pm2 restart sf-daemon', { stdio: 'pipe' });
      await setTimeout(3000);

      // Check uptime after restart
      let health2 = JSON.parse(execSync('curl -s http://127.0.0.1:7727/health', { encoding: 'utf-8' }));
      const finalUptime = health2.uptime;

      expect(finalUptime).toBeLessThan(initialUptime);
      expect(finalUptime).toBeGreaterThan(0);
    });
  });
});
```

## **C5 - REFLECT: Risk Assessment**

### **Risk Mitigation Strategies**

1. **PM2 Installation Issues**
   - **Risk**: Global installation conflicts
   - **Mitigation**: Provide Docker alternative
   - **Fallback**: Local PM2 execution

2. **Service Startup Failures**
   - **Risk**: Services failing to start
   - **Mitigation**: Retry logic with exponential backoff
   - **Monitoring**: Startup health checks

3. **Port Conflicts**
   - **Risk**: Port already in use
   - **Mitigation**: Dynamic port allocation
   - **Validation**: Port availability checks

### **Success Metrics**

- **Availability**: >99% uptime
- **Recovery Time**: <30s auto-restart
- **Performance**: <100ms health check response
- **Memory**: <400MB per service
- **Coverage**: 100% test coverage

## Timeline

- **Week 1**: Phase 1 (PM2 Foundation)
- **Week 2**: Phase 2 (Service Integration)
- **Week 3**: Phase 3 (Advanced Features)
- **Week 4**: Testing, Documentation, Deployment

Este plan proporciona una implementación robusta y production-ready para la integración daemon-PM2.