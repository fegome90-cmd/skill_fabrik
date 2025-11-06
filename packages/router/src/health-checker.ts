/**
 * Daemon Health Checker
 * Task: SF-STABILITY-2025-T3.2
 * Date: 2025-11-05
 */

import { logger } from './logger.js';

export interface HealthStatus {
  healthy: boolean;
  lastCheck: number;
  lastSuccess: number | null;
  consecutiveFailures: number;
  latencyMs: number | null;
}

export class DaemonHealthChecker {
  private healthy = true;
  private lastCheck = 0;
  private lastSuccess: number | null = null;
  private consecutiveFailures = 0;
  private latencyMs: number | null = null;
  private checkInterval: NodeJS.Timeout | null = null;
  private maxFailures = 3;
  
  constructor(
    private daemonUrl: string,
    private intervalMs: number = 30000 // 30 seconds
  ) {}
  
  /**
   * Start periodic health checks
   */
  start(): void {
    if (this.checkInterval) {
      return; // Already started
    }
    
    logger.info({
      daemonUrl: this.daemonUrl,
      intervalMs: this.intervalMs
    }, 'Starting daemon health checker');
    
    // Do initial check
    this.check();
    
    // Start periodic checks
    this.checkInterval = setInterval(() => {
      this.check();
    }, this.intervalMs);
    
    // Don't prevent process from exiting
    if (this.checkInterval.unref) {
      this.checkInterval.unref();
    }
  }
  
  /**
   * Stop health checks
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      logger.info('Stopped daemon health checker');
    }
  }
  
  /**
   * Perform health check
   */
  private async check(): Promise<void> {
    const startTime = Date.now();
    this.lastCheck = startTime;
    
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout
      
      const response = await fetch(`${this.daemonUrl}/health`, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      
      this.latencyMs = Date.now() - startTime;
      
      if (response.ok) {
        // Health check passed
        this.healthy = true;
        this.lastSuccess = Date.now();
        this.consecutiveFailures = 0;
        
        logger.debug({
          daemonUrl: this.daemonUrl,
          latencyMs: this.latencyMs
        }, 'Daemon health check passed');
      } else {
        // Health check failed
        this.handleFailure(`HTTP ${response.status}`);
      }
    } catch (error) {
      // Health check failed
      this.handleFailure(error instanceof Error ? error.message : String(error));
    }
  }
  
  /**
   * Handle health check failure
   */
  private handleFailure(reason: string): void {
    this.consecutiveFailures++;
    
    if (this.consecutiveFailures >= this.maxFailures) {
      this.healthy = false;
      
      logger.warn({
        daemonUrl: this.daemonUrl,
        consecutiveFailures: this.consecutiveFailures,
        reason
      }, 'Daemon marked as unhealthy');
    } else {
      logger.debug({
        daemonUrl: this.daemonUrl,
        consecutiveFailures: this.consecutiveFailures,
        reason
      }, 'Daemon health check failed');
    }
  }
  
  /**
   * Check if daemon is healthy
   */
  isHealthy(): boolean {
    return this.healthy;
  }
  
  /**
   * Get health status
   */
  getStatus(): HealthStatus {
    return {
      healthy: this.healthy,
      lastCheck: this.lastCheck,
      lastSuccess: this.lastSuccess,
      consecutiveFailures: this.consecutiveFailures,
      latencyMs: this.latencyMs
    };
  }
}

