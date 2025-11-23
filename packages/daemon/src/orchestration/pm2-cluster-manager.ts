/**
 * PM2 Cluster Manager for Daemon V2
 * Advanced clustering, graceful shutdown, and health monitoring
 * Task: SF-DAEMON-2025-V2.1
 * Date: 2025-11-14
 */

import { logger } from '../observability/logger.js';
import { MetricsCollector } from '../../router/src/metrics/metrics-collector.js';

export interface ClusterConfig {
  instances?: number;
  maxMemory?: string;
  execMode?: 'fork' | 'cluster';
  name?: string;
  script?: string;
  watch?: boolean;
  ignoreWatch?: string[];
  env?: Record<string, string>;
  errorFile?: string;
  outFile?: string;
  logFile?: string;
  time?: boolean;
  autorestart?: boolean;
  maxRestarts?: number;
  minUptime?: string;
}

export interface ClusterStatus {
  name: string;
  mode: 'fork' | 'cluster';
  instances: InstanceStatus[];
  totalInstances: number;
  healthyInstances: number;
  cpuUsage: number;
  memoryUsage: number;
  uptime: number;
  lastRestart: number | null;
  restartCount: number;
}

export interface InstanceStatus {
  pid: number;
  name: string;
  status: 'online' | 'stopping' | 'stopped' | 'errored' | 'launching';
  restartTime: number;
  unstableRestarts: number;
  cpu: number;
  memory: number;
  pmId: number;
  pm2Env?: Record<string, string>;
}

export interface ClusterMetrics {
  clusterHealth: number;
  averageResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
  throughput: number;
  uptime: number;
  restartsToday: number;
  memoryEfficiency: number;
  cpuEfficiency: number;
}

/**
 * Advanced PM2 Cluster Manager with intelligent scaling and monitoring
 */
export class PM2ClusterManager {
  private isRunning = false;
  private clusterName: string;
  private instanceCount: number;
  private mode: 'fork' | 'cluster';
  private startTime: number;
  private restartCount = 0;
  private healthChecks: Map<number, NodeJS.Timeout> = new Map();
  private metricsHistory: Array<{ timestamp: number; metrics: ClusterMetrics }> = [];

  // Configuration
  private config: Required<ClusterConfig>;

  constructor(
    config: ClusterConfig = {},
    private metrics?: MetricsCollector
  ) {
    this.config = {
      instances: config.instances || 2,
      maxMemory: config.maxMemory || '1G',
      execMode: config.execMode || 'cluster',
      name: config.name || 'skills-daemon',
      script: config.script || './dist/index.js',
      watch: config.watch || false,
      ignoreWatch: config.ignoreWatch || ['node_modules', 'logs', 'coverage'],
      env: config.env || { NODE_ENV: process.env.NODE_ENV || 'production' },
      errorFile: config.errorFile || './logs/daemon-error.log',
      outFile: config.outFile || './logs/daemon-out.log',
      logFile: config.logFile || './logs/daemon-combined.log',
      time: config.time !== false,
      autorestart: config.autorestart !== false,
      maxRestarts: config.maxRestarts || 10,
      minUptime: config.minUptime || '10s'
    };

    this.clusterName = this.config.name;
    this.instanceCount = this.config.instances;
    this.mode = this.config.execMode;
    this.startTime = Date.now();

    logger.info({
      clusterName: this.clusterName,
      instances: this.instanceCount,
      mode: this.mode,
      maxMemory: this.config.maxMemory
    }, 'PM2 Cluster Manager initialized');
  }

  /**
   * Start the PM2 cluster with advanced configuration
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn({ clusterName: this.clusterName }, 'Cluster already running');
      return;
    }

    try {
      // Create PM2 ecosystem configuration
      const ecosystemConfig = this.generateEcosystemConfig();
      await this.writeEcosystemFile(ecosystemConfig);

      // Start the cluster
      await this.executePM2Command(['start', 'ecosystem.config.js']);
      this.isRunning = true;

      // Wait for instances to initialize
      await this.waitForInstances();

      // Start health monitoring
      this.startHealthMonitoring();

      logger.info({
        clusterName: this.clusterName,
        instances: this.instanceCount,
        mode: this.mode
      }, 'PM2 Cluster started successfully');

      if (this.metrics) {
        this.metrics.incrementCounter('pm2_cluster_starts_total', 1, {
          clusterName: this.clusterName,
          mode: this.mode
        });
      }

    } catch (error) {
      logger.error({
        clusterName: this.clusterName,
        error: error instanceof Error ? error.message : String(error)
      }, 'Failed to start PM2 cluster');
      throw error;
    }
  }

  /**
   * Stop the PM2 cluster gracefully
   */
  public async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      logger.info({ clusterName: this.clusterName }, 'Stopping PM2 cluster');

      // Stop health monitoring
      this.stopHealthMonitoring();

      // Graceful shutdown with timeout
      await Promise.race([
        this.executePM2Command(['stop', this.clusterName]),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Shutdown timeout')), 30000))
      ]);

      this.isRunning = false;

      logger.info({ clusterName: this.clusterName }, 'PM2 cluster stopped');

      if (this.metrics) {
        this.metrics.incrementCounter('pm2_cluster_stops_total', 1, {
          clusterName: this.clusterName
        });
      }

    } catch (error) {
      logger.error({
        clusterName: this.clusterName,
        error: error instanceof Error ? error.message : String(error)
      }, 'Error during cluster shutdown');
      throw error;
    }
  }

  /**
   * Restart the PM2 cluster
   */
  public async restart(graceful: boolean = true): Promise<void> {
    if (!this.isRunning) {
      await this.start();
      return;
    }

    try {
      if (graceful) {
        // Rolling restart for zero downtime
        await this.executePM2Command(['reload', this.clusterName]);
        logger.info({ clusterName: this.clusterName }, 'PM2 cluster reloaded (zero downtime)');
      } else {
        // Full restart
        await this.executePM2Command(['restart', this.clusterName]);
        logger.info({ clusterName: this.clusterName }, 'PM2 cluster restarted');
      }

      this.restartCount++;

      if (this.metrics) {
        this.metrics.incrementCounter('pm2_cluster_restarts_total', 1, {
          clusterName: this.clusterName,
          graceful: graceful.toString()
        });
      }

    } catch (error) {
      logger.error({
        clusterName: this.clusterName,
        error: error instanceof Error ? error.message : String(error)
      }, 'Failed to restart PM2 cluster');
      throw error;
    }
  }

  /**
   * Scale the cluster up or down
   */
  public async scale(instances: number): Promise<void> {
    if (instances < 1 || instances > 16) {
      throw new Error('Instance count must be between 1 and 16');
    }

    try {
      // Update configuration
      this.config.instances = instances;
      this.instanceCount = instances;

      // Generate new ecosystem config
      const ecosystemConfig = this.generateEcosystemConfig();
      await this.writeEcosystemFile(ecosystemConfig);

      // Apply new configuration
      await this.executePM2Command(['reload', 'ecosystem.config.js']);

      logger.info({
        clusterName: this.clusterName,
        oldInstances: this.instanceCount,
        newInstances: instances
      }, 'PM2 cluster scaled');

      if (this.metrics) {
        this.metrics.setGauge(`pm2_cluster_${this.clusterName}_instances`, instances);
      }

    } catch (error) {
      logger.error({
        clusterName: this.clusterName,
        instances,
        error: error instanceof Error ? error.message : String(error)
      }, 'Failed to scale PM2 cluster');
      throw error;
    }
  }

  /**
   * Get current cluster status
   */
  public async getStatus(): Promise<ClusterStatus> {
    try {
      const { execSync } = await import('child_process');
      const pm2List = execSync('pm2 jlist --json', { encoding: 'utf8' });
      const processes = JSON.parse(pm2List);

      const clusterProcesses = processes.filter((p: any) => p.name === this.clusterName);

      const instances: InstanceStatus[] = clusterProcesses.map((p: any) => ({
        pid: p.pid,
        name: p.name,
        status: p.pm2_env.status,
        restartTime: p.pm2_env.restart_time || 0,
        unstableRestarts: p.pm2_env.unstable_restarts || 0,
        cpu: p.monit?.cpu || 0,
        memory: p.monit?.memory || 0,
        pmId: p.pm_id,
        pm2Env: p.pm2_env
      }));

      const healthyInstances = instances.filter(i =>
        i.status === 'online' && i.unstableRestarts < 3
      ).length;

      const totalCpu = instances.reduce((sum, i) => sum + i.cpu, 0);
      const totalMemory = instances.reduce((sum, i) => sum + i.memory, 0);

      return {
        name: this.clusterName,
        mode: this.mode,
        instances,
        totalInstances: instances.length,
        healthyInstances,
        cpuUsage: totalCpu,
        memoryUsage: totalMemory,
        uptime: Date.now() - this.startTime,
        lastRestart: null, // Would track from logs
        restartCount: this.restartCount
      };

    } catch (error) {
      logger.error({
        clusterName: this.clusterName,
        error: error instanceof Error ? error.message : String(error)
      }, 'Failed to get cluster status');

      // Return default status on error
      return {
        name: this.clusterName,
        mode: this.mode,
        instances: [],
        totalInstances: 0,
        healthyInstances: 0,
        cpuUsage: 0,
        memoryUsage: 0,
        uptime: Date.now() - this.startTime,
        lastRestart: null,
        restartCount: this.restartCount
      };
    }
  }

  /**
   * Get comprehensive cluster metrics
   */
  public async getMetrics(): Promise<ClusterMetrics> {
    const status = await this.getStatus();
    const now = Date.now();

    const clusterHealth = status.totalInstances > 0
      ? (status.healthyInstances / status.totalInstances) * 100
      : 0;

    // Calculate efficiency metrics
    const memoryEfficiency = status.memoryUsage > 0
      ? (status.healthyInstances * 1024 * 1024 * 1024) / status.memoryUsage * 100
      : 0;

    const cpuEfficiency = status.cpuUsage > 0
      ? (status.healthyInstances / status.cpuUsage) * 100
      : 0;

    const metrics: ClusterMetrics = {
      clusterHealth,
      averageResponseTime: 0, // Would get from actual request metrics
      requestsPerSecond: 0,   // Would get from actual request metrics
      errorRate: 0,           // Would get from actual error tracking
      throughput: 0,          // Would get from actual throughput tracking
      uptime: status.uptime,
      restartsToday: status.restartCount,
      memoryEfficiency,
      cpuEfficiency
    };

    // Store metrics history
    this.metricsHistory.push({ timestamp: now, metrics });

    // Keep only last hour of history
    const cutoff = now - 3600000;
    this.metricsHistory = this.metricsHistory.filter(m => m.timestamp >= cutoff);

    return metrics;
  }

  /**
   * Perform health check on all instances
   */
  public async performHealthCheck(): Promise<void> {
    const status = await this.getStatus();

    for (const instance of status.instances) {
      if (instance.status === 'online') {
        try {
          // Perform instance-specific health check
          await this.checkInstanceHealth(instance);
        } catch (error) {
          logger.warn({
            clusterName: this.clusterName,
            instanceId: instance.pmId,
            error: error instanceof Error ? error.message : String(error)
          }, 'Instance health check failed');
        }
      }
    }
  }

  /**
   * Enable auto-scaling based on metrics
   */
  public enableAutoScaling(options: {
    minInstances: number;
    maxInstances: number;
    scaleUpThreshold: number;
    scaleDownThreshold: number;
    scaleUpCooldown?: number;
    scaleDownCooldown?: number;
  }): void {
    // Auto-scaling logic would be implemented here
    logger.info({
      clusterName: this.clusterName,
      options
    }, 'Auto-scaling enabled (placeholder implementation)');
  }

  // Private methods

  private generateEcosystemConfig(): any {
    return {
      apps: [{
        name: this.clusterName,
        script: this.config.script,
        instances: this.config.instances,
        exec_mode: this.config.execMode,
        watch: this.config.watch,
        ignore_watch: this.config.ignoreWatch,
        max_memory_restart: this.config.maxMemory,
        env: this.config.env,
        error_file: this.config.errorFile,
        out_file: this.config.outFile,
        log_file: this.config.logFile,
        time: this.config.time,
        autorestart: this.config.autorestart,
        max_restarts: this.config.maxRestarts,
        min_uptime: this.config.minUptime,
        // Health check configuration
        health_check_grace_period: 3000,
        health_check_fatal_exceptions: true,
        // Performance monitoring
        pmx: true,
        // Kill timeout for graceful shutdown
        kill_timeout: 5000
      }]
    };
  }

  private async writeEcosystemFile(config: any): Promise<void> {
    const { writeFile } = await import('fs/promises');
    const configString = `module.exports = ${JSON.stringify(config, null, 2)};`;

    await writeFile('ecosystem.config.js', configString, 'utf8');
    logger.debug({ clusterName: this.clusterName }, 'Ecosystem config file written');
  }

  private async executePM2Command(args: string[]): Promise<void> {
    const { spawn } = await import('child_process');

    return new Promise((resolve, reject) => {
      const process = spawn('pm2', args, {
        stdio: 'pipe',
        env: { ...process.env }
      });

      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`PM2 command failed: ${args.join(' ')}\n${stderr}`));
        }
      });

      process.on('error', (error) => {
        reject(new Error(`Failed to execute PM2 command: ${error.message}`));
      });
    });
  }

  private async waitForInstances(timeout: number = 30000): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const status = await this.getStatus();

      if (status.healthyInstances === this.instanceCount) {
        logger.info({
          clusterName: this.clusterName,
          healthyInstances: status.healthyInstances,
          totalInstances: status.totalInstances
        }, 'All instances are healthy');
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    throw new Error(`Timeout waiting for instances to start. Only ${await this.getHealthyInstanceCount()}/${this.instanceCount} are healthy`);
  }

  private async getHealthyInstanceCount(): Promise<number> {
    try {
      const status = await this.getStatus();
      return status.healthyInstances;
    } catch {
      return 0;
    }
  }

  private startHealthMonitoring(): void {
    // Check cluster health every 30 seconds
    setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        logger.error({
          clusterName: this.clusterName,
          error: error instanceof Error ? error.message : String(error)
        }, 'Health monitoring check failed');
      }
    }, 30000);
  }

  private stopHealthMonitoring(): void {
    for (const timeout of this.healthChecks.values()) {
      clearInterval(timeout);
    }
    this.healthChecks.clear();
  }

  private async checkInstanceHealth(instance: InstanceStatus): Promise<void> {
    // This would perform actual instance health checks
    // For now, we'll just validate the instance status
    if (instance.unstableRestarts > 5) {
      throw new Error(`Instance ${instance.pmId} has ${instance.unstableRestarts} unstable restarts`);
    }

    if (instance.memory > 2 * 1024 * 1024 * 1024) { // 2GB
      throw new Error(`Instance ${instance.pmId} memory usage too high: ${instance.memory} bytes`);
    }
  }
}