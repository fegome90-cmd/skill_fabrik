#!/usr/bin/env node

/**
 * Enhanced Service Startup Manager
 *
 * Manages startup ordering, dependencies, and health monitoring for PM2 services
 */

import { execSync } from 'child_process';
import { setTimeout } from 'timers/promises';
import { ServiceDependencyManager } from '../../packages/shared/src/dependency-manager.js';
import { HealthChecker } from '../../packages/shared/src/health-checker.js';

class EnhancedServiceManager {
  constructor() {
    this.dependencyManager = new ServiceDependencyManager({
      defaultTimeout: 30000,
      defaultInterval: 5000
    });
    this.healthChecker = new HealthChecker();

    // Register all services with their dependencies
    this.registerServices();

    // Event listeners
    this.setupEventListeners();
  }

  registerServices() {
    // Core Daemon Service
    this.dependencyManager.registerService({
      name: 'sf-daemon',
      host: '127.0.0.1',
      port: 7727,
      healthEndpoint: '/health',
      dependencies: [],
      startupOrder: 1,
      healthCheckInterval: 5000,
      maxRetries: 5,
      timeout: 30000
    });

    // Router Service (depends on daemon)
    this.dependencyManager.registerService({
      name: 'router-service',
      host: '127.0.0.1',
      port: 3000,
      healthEndpoint: '/health',
      dependencies: ['sf-daemon'],
      startupOrder: 2,
      healthCheckInterval: 5000,
      maxRetries: 3,
      timeout: 15000
    });

    // Skills CLI Service (depends on daemon)
    this.dependencyManager.registerService({
      name: 'skills-cli-service',
      host: '127.0.0.1',
      port: null, // CLI service may not have HTTP endpoint
      healthEndpoint: '',
      dependencies: ['sf-daemon'],
      startupOrder: 3,
      healthCheckInterval: 10000,
      maxRetries: 2,
      timeout: 10000
    });
  }

  setupEventListeners() {
    this.dependencyManager.on('startup-started', (event, data) => {
      console.log(`🚀 Starting all services (${data.env})...`);
    });

    this.dependencyManager.on('service-starting', (event, data) => {
      console.log(`🔄 Starting ${data.service}...`);
    });

    this.dependencyManager.on('service-started', (event, data) => {
      const status = this.dependencyManager.getServiceStatus(data.service);
      console.log(`✅ ${data.service} started (uptime: ${Math.floor(status?.uptime || 0)}s)`);
    });

    this.dependencyManager.on('service-failed', (event, data) => {
      console.error(`❌ ${data.service} failed:`, data.error);
    });

    this.dependencyManager.on('service-unhealthy', (event, data) => {
      console.warn(`⚠️  ${data.service} is unhealthy`, data.error);
    });

    this.dependencyManager.on('service-recovered', (event, data) => {
      console.log(`🔄 ${data.service} recovered`);
    });

    this.dependencyManager.on('startup-completed', (event, data) => {
      console.log('✅ All services started successfully');
      console.log(`📋 Startup order: ${data.order.join(' → ')}`);
    });

    this.dependencyManager.on('startup-failed', (event, data) => {
      console.error('❌ Startup failed:', data.error);
    });
  }

  async startAll(env = 'development') {
    try {
      await this.dependencyManager.startAllServices(env);

      // Perform comprehensive health check
      await this.comprehensiveHealthCheck();

    } catch (error) {
      console.error('❌ Failed to start services:', error.message);
      throw error;
    }
  }

  async startSingleService(serviceName, env = 'development') {
    try {
      await this.dependencyManager.startService(serviceName, env);

      // Health check specific service
      const service = this.dependencyManager.getServiceStatus(serviceName);
      if (service?.status === 'healthy') {
        console.log(`✅ ${serviceName} is healthy and running`);
      }

    } catch (error) {
      console.error(`❌ Failed to start ${serviceName}:`, error.message);
      throw error;
    }
  }

  async stopAll() {
    try {
      console.log('🛑 Stopping all services...');
      await this.dependencyManager.stopAllServices();
      console.log('✅ All services stopped');
    } catch (error) {
      console.error('❌ Failed to stop services:', error.message);
    }
  }

  async stopSingleService(serviceName) {
    try {
      await this.dependencyManager.stopService(serviceName);
      console.log(`✅ ${serviceName} stopped`);
    } catch (error) {
      console.error(`❌ Failed to stop ${serviceName}:`, error.message);
    }
  }

  async comprehensiveHealthCheck() {
    console.log('🔍 Performing comprehensive health check...');

    const allStatus = this.dependencyManager.getAllStatus();
    let healthyCount = 0;
    let degradedCount = 0;
    let unhealthyCount = 0;

    for (const [name, status] of allStatus) {
      switch (status.status) {
        case 'healthy':
          healthyCount++;
          console.log(`✅ ${name}: healthy (uptime: ${Math.floor(status.uptime)}s)`);
          break;
        case 'unhealthy':
          unhealthyCount++;
          console.log(`❌ ${name}: unhealthy (failures: ${status.healthCheckFailures})`);
          break;
        case 'failed':
          unhealthyCount++;
          console.log(`❌ ${name}: failed to start`);
          break;
        case 'starting':
          console.log(`🔄 ${name}: starting...`);
          break;
        case 'pending':
          console.log(`⏳ ${name}: pending...`);
          break;
        default:
          console.log(`❓ ${name}: ${status.status}`);
      }
    }

    // Summary
    const total = allStatus.size;
    const healthPercentage = total > 0 ? Math.round((healthyCount / total) * 100) : 0;

    console.log('\n📊 Health Summary:');
    console.log(`  Healthy: ${healthyCount}/${total} (${healthPercentage}%)`);
    console.log(`  Degraded: ${degradedCount}`);
    console.log(`  Unhealthy: ${unhealthyCount}`);

    if (healthPercentage === 100) {
      console.log('🎉 All services are healthy!');
    } else if (healthPercentage >= 75) {
      console.log('⚠️  Services are mostly healthy');
    } else {
      console.log('🚨 Multiple services are unhealthy');
    }

    return {
      total,
      healthy: healthyCount,
      degraded: degradedCount,
      unhealthy: unhealthyCount,
      percentage: healthPercentage
    };
  }

  async monitorServices(duration = 60000) {
    console.log(`📊 Monitoring services for ${duration/1000} seconds...`);

    const startTime = Date.now();
    const endTime = startTime + duration;

    const checkInterval = setInterval(async () => {
      await this.comprehensiveHealthCheck();

      if (Date.now() >= endTime) {
        clearInterval(checkInterval);
        console.log('📊 Monitoring completed');
      }
    }, 10000);

    return new Promise(resolve => {
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve();
      }, duration);
    });
  }

  async getDetailedStatus() {
    const allStatus = this.dependencyManager.getAllStatus();
    const detailed = {};

    for (const [name, status] of allStatus) {
      detailed[name] = {
        ...status,
        uptimeFormatted: this.formatUptime(status.uptime),
        lastCheckFormatted: status.lastHealthCheck.toISOString(),
        dependencyDetails: status.dependencies.map(dep => {
          const depStatus = this.dependencyManager.getServiceStatus(dep);
          return {
            name: dep,
            status: depStatus?.status || 'unknown',
            healthy: depStatus?.status === 'healthy'
          };
        })
      };
    }

    return detailed;
  }

  formatUptime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  // Legacy methods for backward compatibility
  async waitForService(serviceName) {
    await this.dependencyManager.waitForService(serviceName, 'healthy');
  }

  async healthCheck() {
    await this.comprehensiveHealthCheck();
  }

  // Cleanup
  destroy() {
    this.dependencyManager.destroy();
  }
}

// CLI interface
const command = process.argv[2];
const env = process.argv[3] || 'development';

const manager = new EnhancedServiceManager();

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
