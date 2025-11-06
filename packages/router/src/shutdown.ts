/**
 * Graceful Shutdown Handler for Router
 * Task: SF-STABILITY-2025-T1.2
 * Date: 2025-11-05
 */

import type { FastifyInstance } from 'fastify';

interface ShutdownOptions {
  timeout?: number;
  logger?: any;
}

export class GracefulShutdown {
  private isShuttingDown = false;
  private shutdownTimeout: NodeJS.Timeout | null = null;
  
  constructor(
    private server: FastifyInstance,
    private options: ShutdownOptions = {}
  ) {
    this.setupSignalHandlers();
  }
  
  private setupSignalHandlers(): void {
    // Handle SIGTERM (Docker, Kubernetes)
    process.on('SIGTERM', () => this.shutdown('SIGTERM'));
    
    // Handle SIGINT (Ctrl+C)
    process.on('SIGINT', () => this.shutdown('SIGINT'));
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      const logger = this.options.logger || console;
      logger.error('Uncaught exception:', error);
      this.shutdown('uncaughtException', 1);
    });
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      const logger = this.options.logger || console;
      logger.error('Unhandled rejection at:', promise, 'reason:', reason);
      this.shutdown('unhandledRejection', 1);
    });
  }
  
  private async shutdown(signal: string, exitCode: number = 0): Promise<void> {
    if (this.isShuttingDown) {
      const logger = this.options.logger || console;
      logger.warn(`Shutdown already in progress (signal: ${signal})`);
      return;
    }
    
    this.isShuttingDown = true;
    const logger = this.options.logger || console;
    logger.info(`🛑 Received ${signal}, shutting down gracefully...`);
    
    // Set timeout for forced shutdown
    const timeout = this.options.timeout || 30000; // 30 segundos por defecto
    this.shutdownTimeout = setTimeout(() => {
      logger.error('⏰ Shutdown timeout exceeded, forcing exit');
      process.exit(1);
    }, timeout);
    
    try {
      // 1. Stop accepting new connections
      logger.info('📡 Closing server...');
      await this.server.close();
      logger.info('✅ Server closed');
      
      // 2. Clear caches (if daemonCache is exported)
      logger.info('🗑️  Clearing caches...');
      try {
        // Import and clear daemon cache
        const { clearDaemonCache } = await import('./pre-invoke.js');
        if (clearDaemonCache) {
          clearDaemonCache();
        }
      } catch (err) {
        // Cache clearing is optional
        logger.debug('Cache clearing not available or failed:', err);
      }
      logger.info('✅ Caches cleared');
      
      logger.info('✅ Shutdown complete');
      
      // Clear timeout
      if (this.shutdownTimeout) {
        clearTimeout(this.shutdownTimeout);
      }
      
      process.exit(exitCode);
    } catch (error) {
      logger.error('❌ Error during shutdown:', error);
      
      if (this.shutdownTimeout) {
        clearTimeout(this.shutdownTimeout);
      }
      
      process.exit(1);
    }
  }
  
  /**
   * Check if server is healthy (not shutting down)
   */
  isHealthy(): boolean {
    return !this.isShuttingDown;
  }
  
  /**
   * Get shutdown status
   */
  getStatus(): { isShuttingDown: boolean } {
    return {
      isShuttingDown: this.isShuttingDown
    };
  }
}

