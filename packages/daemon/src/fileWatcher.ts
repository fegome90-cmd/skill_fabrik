/**
 * File Watching Service
 *
 * Monitors file changes in skills-fabrik project and provides real-time updates
 * to the Skill Manager Dashboard via WebSocket
 */

import * as chokidar from 'chokidar';
import { WebSocket, WebSocketServer } from 'ws';
import { resolve, join } from 'path';
import { existsSync } from 'fs';
import { getQualityService, QualityResult } from './qualityService.js';
import { getLogger } from './observability/logger.js';

interface FileChangeEvent {
  type: 'add' | 'change' | 'unlink' | 'addDir' | 'unlinkDir';
  path: string;
  timestamp: string;
  size?: number;
  relativePath: string;
  category: 'skill' | 'config' | 'code' | 'docs' | 'other';
  qualityCheck?: QualityResult;
}

interface FileWatcherConfig {
  watchPaths: string[];
  ignored: string[];
  categories: { [key: string]: string[] };
  qualityCheck: {
    enabled: boolean;
    autoFormat: boolean;
    autoLint: boolean;
    fileTypes: string[];
    debounceMs: number;
  };
}

export class FileWatcherService {
  private watchers: Map<string, chokidar.FSWatcher> = new Map();
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();
  private config: FileWatcherConfig;
  private changeHistory: FileChangeEvent[] = [];
  private maxHistorySize = 1000;
  private qualityService = getQualityService();
  // Task: SF-STABILITY-2025-T2.3 - Store both debouncer and failsafe timers
  private qualityCheckDebouncers: Map<string, { debouncer: NodeJS.Timeout; failsafe: NodeJS.Timeout }> = new Map();
  private logger = getLogger({ svc: 'file-watcher' });

  constructor() {
    // Get watch paths from environment or use defaults
    const envWatchPaths = process.env.SF_WATCH_PATHS;
    const defaultPaths = this.resolveProjectPaths(['skills', 'packages']);
    const watchPaths = envWatchPaths
      ? envWatchPaths.split(':').map(path => this.resolveProjectPath(path.trim()))
      : defaultPaths;

    this.config = {
      watchPaths,
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        '**/build/**',
        '**/.next/**',
        '**/coverage/**',
        '**/*.log',
        '**/*.d.ts',
        '**/*.map',
        '**/logs/**',
        '**/test/**',
        '**/e2e/**',
        '**/coverage/**',
        '**/*.min.js',
        '**/*.bundle.js',
        '**/vendor/**',
        '**/.pnpm/**',
        '**/pnpm-lock.yaml',
        '**/package-lock.json',
        '**/yarn.lock',
        '**/.DS_Store',
        '**/Thumbs.db'
      ],
      categories: {
        skill: ['skills/**/*.md', 'skills/**/*.js', 'skills/**/*.ts', 'skills/**/*.json'],
        config: ['*.json', '*.config.*', '.env*', '**/tsconfig.json'],
        code: ['src/**/*.ts', 'src/**/*.js'],
        docs: ['**/*.md'],
        other: ['*']
      },
      qualityCheck: {
        enabled: false,
        autoFormat: false,
        autoLint: false,
        fileTypes: ['.ts', '.js'],
        // Task: SF-STABILITY-2025-T2.3 - Reduced from 10000ms to 2000ms for faster feedback
        debounceMs: parseInt(process.env.SF_WATCH_DEBOUNCE_MS || '2000')
      }
    };
  }

  /**
   * Resolve project paths relative to the project root
   */
  private resolveProjectPaths(paths: string[]): string[] {
    return paths.map(path => this.resolveProjectPath(path));
  }

  /**
   * Resolve a single path relative to the project root
   */
  private resolveProjectPath(path: string): string {
    // If the path is already absolute, return as-is
    if (resolve(path) === path) {
      return path;
    }

    // Resolve relative to project root (2 levels up from daemon package)
    const projectRoot = resolve(process.cwd(), '../..');
    const resolvedPath = resolve(projectRoot, path);

    this.logger.debug({
      inputPath: path,
      resolvedPath,
      projectRoot
    }, 'Resolved project path');

    return resolvedPath;
  }

  start(): void {
    this.logger.info('Starting file watching service...');

    // Initialize WebSocket server
    this.initializeWebSocket();

    // Start periodic cleanup tasks
    this.startPeriodicCleanup();

    // Start file watchers for each path
    const validPaths: string[] = [];
    this.config.watchPaths.forEach(watchPath => {
      if (this.startWatcher(watchPath)) {
        validPaths.push(watchPath);
      }
    });

    this.logger.info({
      totalPaths: this.config.watchPaths.length,
      validPaths: validPaths.length,
      paths: validPaths
    }, 'File watching service started');

    if (validPaths.length === 0) {
      this.logger.warn('No valid paths to watch - file watching will be limited');
    }
  }

  /**
   * Stop file watching service gracefully
   * Task: SF-STABILITY-2025-T1.3
   * Updated: 2025-11-05 - Made async to prevent race conditions
   */
  async stop(): Promise<void> {
    this.logger.info('Stopping file watching service...');

    // 1. Clear all debouncers (Task: SF-STABILITY-2025-T2.3 - Clear both timers)
    const debouncerCount = this.qualityCheckDebouncers.size;
    this.qualityCheckDebouncers.forEach((timers, path) => {
      clearTimeout(timers.debouncer);
      clearTimeout(timers.failsafe);
      this.logger.debug({ path }, 'Cleared quality check debouncer and failsafe');
    });
    this.qualityCheckDebouncers.clear();
    this.logger.info({ clearedDebouncers: debouncerCount }, 'Cleared all debouncers');

    // 2. Wait for event loop to clear pending callbacks
    await new Promise(resolve => setImmediate(resolve));

    // 3. Stop all file watchers
    const watcherPaths = Array.from(this.watchers.keys());
    this.logger.info({ watcherCount: watcherPaths.length }, 'Stopping file watchers...');

    const watcherClosePromises = watcherPaths.map(async (path) => {
      const watcher = this.watchers.get(path);
      if (!watcher) return;

      try {
        // chokidar's close() returns a Promise
        await watcher.close();
        this.logger.debug({ path }, 'Stopped file watcher');
      } catch (error) {
        this.logger.warn({
          path,
          error: error instanceof Error ? error.message : String(error)
        }, 'Error stopping file watcher');
      }
    });

    const watcherResults = await Promise.allSettled(watcherClosePromises);
    const failedWatchers = watcherResults.filter(r => r.status === 'rejected').length;

    this.watchers.clear();
    this.logger.info({
      stoppedWatchers: watcherPaths.length - failedWatchers,
      failedWatchers
    }, 'File watchers stopped');

    // 4. Close WebSocket server
    if (this.wss) {
      this.logger.info('Closing WebSocket server...');

      try {
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Timeout closing WebSocket server'));
          }, 5000);

          this.wss!.close((err) => {
            clearTimeout(timeout);
            if (err) reject(err);
            else resolve();
          });
        });

        this.logger.info('WebSocket server closed');
      } catch (error) {
        this.logger.warn({
          error: error instanceof Error ? error.message : String(error)
        }, 'Error closing WebSocket server');
      }

      this.wss = null;
    }

    // 5. Close all WebSocket clients
    const clientCount = this.clients.size;
    if (clientCount > 0) {
      this.logger.info({ clientCount }, 'Closing WebSocket clients...');

      const clientClosePromises = Array.from(this.clients).map(client => {
        return new Promise<void>((resolve) => {
          if (client.readyState === WebSocket.OPEN) {
            client.close(1000, 'Server shutting down');

            const timeout = setTimeout(() => {
              client.terminate();
              resolve();
            }, 1000);

            client.once('close', () => {
              clearTimeout(timeout);
              resolve();
            });
          } else {
            resolve();
          }
        });
      });

      await Promise.allSettled(clientClosePromises);
    }

    this.clients.clear();
    this.logger.info({
      disconnectedClients: clientCount
    }, 'File watching service stopped successfully');
  }

  private initializeWebSocket(): void {
    // Use a different port for WebSocket server
    const wsPort = 7729; // Different port to avoid conflicts

    try {
      this.wss = new WebSocketServer({ port: wsPort });

      this.wss.on('connection', (ws: WebSocket) => {
        console.log('[FileWatcher] New WebSocket client connected');
        this.clients.add(ws);

        // Send initial data
        ws.send(JSON.stringify({
          type: 'initial',
          data: {
            history: this.changeHistory.slice(-50), // Last 50 changes
            watching: this.config.watchPaths,
            timestamp: new Date().toISOString()
          }
        }));

        ws.on('close', () => {
          this.logger.debug('WebSocket client disconnected');
          this.clients.delete(ws);
        });

        ws.on('error', (error) => {
          this.logger.warn({ error: error instanceof Error ? error.message : String(error) }, 'WebSocket error');
          this.clients.delete(ws);
        });

        // Set connection timeout to prevent zombie connections
        const connectionTimeout = setTimeout(() => {
          if (ws.readyState === WebSocket.OPEN) {
            this.logger.warn('WebSocket connection timeout - closing');
            ws.close(1000, 'Connection timeout');
          }
        }, 300000); // 5 minutes timeout

        ws.on('close', () => {
          clearTimeout(connectionTimeout);
        });
      });

      console.log(`[FileWatcher] WebSocket server started on port ${wsPort}`);

    } catch (error) {
      console.error('[FileWatcher] Failed to start WebSocket server:', error);
    }
  }

  private startWatcher(watchPath: string): boolean {
    try {
      const resolvedPath = resolve(process.cwd(), watchPath);

      if (!existsSync(resolvedPath)) {
        this.logger.warn({ watchPath, resolvedPath }, 'Path does not exist, skipping watcher');
        return false;
      }

      // Task: SF-STABILITY-2025-T3.5 - Enhanced error handling for permissions
      const watcher = chokidar.watch(resolvedPath, {
        ignored: [/node_modules/],
        persistent: true,
        ignoreInitial: false,
        followSymlinks: false,
        // Ignore permission errors instead of crashing
        ignorePermissionErrors: true,
        // Use polling as fallback for permission issues
        usePolling: false,
        awaitWriteFinish: {
          stabilityThreshold: 2000,
          pollInterval: 100
        }
      });

      // Event handlers
      watcher.on('all', (eventType: string, path: string) => {
        try {
          this.handleFileChange(eventType as any, path, watchPath);
        } catch (error) {
          // Task: SF-STABILITY-2025-T3.5 - Handle permission errors gracefully
          if (this.isPermissionError(error)) {
            this.logger.warn({
              watchPath,
              path,
              error: error instanceof Error ? error.message : String(error)
            }, 'Permission denied for file, skipping');
          } else {
            this.logger.error({
              watchPath,
              path,
              error: error instanceof Error ? error.message : String(error)
            }, 'Error handling file change');
          }
        }
      });

      watcher.on('error', (error) => {
        // Task: SF-STABILITY-2025-T3.5 - Enhanced error logging
        if (this.isPermissionError(error)) {
          this.logger.warn({
            watchPath,
            resolvedPath,
            error: error instanceof Error ? error.message : String(error)
          }, 'Permission error in file watcher, continuing with limited access');
        } else {
          this.logger.error({
            watchPath,
            resolvedPath,
            error: error instanceof Error ? error.message : String(error)
          }, 'Error in file watcher');
        }
      });

      watcher.on('ready', () => {
        this.logger.info({ watchPath, resolvedPath }, 'File watcher ready');
      });

      this.watchers.set(watchPath, watcher);
      this.logger.info({ watchPath, resolvedPath }, 'Started file watcher');
      return true;

    } catch (error) {
      this.logger.error({ watchPath, error: error instanceof Error ? error.message : String(error) }, 'Failed to start file watcher');
      return false;
    }
  }

  private handleFileChange(
    eventType: 'add' | 'change' | 'unlink' | 'addDir' | 'unlinkDir',
    path: string,
    watchPath: string
  ): void {
    const relativePath = path.replace(resolve(process.cwd(), watchPath) + '/', '');
    const category = this.categorizeFile(relativePath);

    const changeEvent: FileChangeEvent = {
      type: eventType,
      path,
      timestamp: new Date().toISOString(),
      relativePath,
      category
    };

    // Trigger quality check if enabled and file type matches
    if (this.config.qualityCheck.enabled && this.shouldRunQualityCheck(relativePath)) {
      this.debouncedQualityCheck(path, changeEvent);
    }

    // Add to history
    this.changeHistory.push(changeEvent);

    // Trim history if too large
    if (this.changeHistory.length > this.maxHistorySize) {
      this.changeHistory = this.changeHistory.slice(-this.maxHistorySize);
    }

    // Broadcast to all WebSocket clients
    this.broadcastChange(changeEvent);

    this.logger.debug({ eventType, relativePath, category }, 'File change detected');
  }

  /**
   * Clean up old entries from change history
   */
  private cleanupChangeHistory(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    // Remove entries older than 24 hours
    const beforeCount = this.changeHistory.length;
    this.changeHistory = this.changeHistory.filter(
      event => now - new Date(event.timestamp).getTime() < maxAge
    );

    // Still enforce max size limit
    if (this.changeHistory.length > this.maxHistorySize) {
      this.changeHistory = this.changeHistory.slice(-this.maxHistorySize);
    }

    const removedCount = beforeCount - this.changeHistory.length;
    if (removedCount > 0) {
      this.logger.debug({
        removedEntries: removedCount,
        totalEntries: this.changeHistory.length
      }, 'Change history cleanup completed');
    }
  }

  private startPeriodicCleanup(): void {
    // Run cleanup every hour
    const cleanupInterval = 60 * 60 * 1000; // 1 hour

    setInterval(() => {
      try {
        this.cleanupChangeHistory();

        // Clean up stale debouncers
        const beforeCount = this.qualityCheckDebouncers.size;
        this.qualityCheckDebouncers.clear(); // Clear all debouncers periodically
        if (beforeCount > 0) {
          this.logger.debug({ clearedDebouncers: beforeCount }, 'Periodic debouncer cleanup');
        }

        // Log memory stats
        const memUsage = process.memoryUsage();
        this.logger.debug({
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
          changeHistorySize: this.changeHistory.length,
          connectedClients: this.clients.size
        }, 'Memory and usage statistics');

      } catch (error) {
        this.logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Periodic cleanup failed');
      }
    }, cleanupInterval);

    this.logger.info({ interval: cleanupInterval }, 'Periodic cleanup timer started');
  }

  private categorizeFile(relativePath: string): 'skill' | 'config' | 'code' | 'docs' | 'other' {
    for (const [category, patterns] of Object.entries(this.config.categories)) {
      if (patterns.some(pattern => this.matchPattern(relativePath, pattern))) {
        return category as any;
      }
    }
    return 'other';
  }

  private matchPattern(path: string, pattern: string): boolean {
    // Simple glob pattern matching
    const regexPattern = pattern
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\?/g, '[^/]');

    return new RegExp(`^${regexPattern}$`).test(path);
  }

  private broadcastChange(changeEvent: FileChangeEvent): void {
    const message = JSON.stringify({
      type: 'fileChange',
      data: changeEvent
    });

    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(message);
        } catch (error) {
          console.error('[FileWatcher] Failed to send message to client:', error);
          this.clients.delete(client);
        }
      }
    });
  }

  private shouldRunQualityCheck(relativePath: string): boolean {
    const extension = relativePath.substring(relativePath.lastIndexOf('.'));
    return this.config.qualityCheck.fileTypes.includes(extension);
  }

  private debouncedQualityCheck(filePath: string, changeEvent: FileChangeEvent): void {
    // Task: SF-STABILITY-2025-T2.3 - Clear both existing timers
    const existingTimers = this.qualityCheckDebouncers.get(filePath);
    if (existingTimers) {
      clearTimeout(existingTimers.debouncer);
      clearTimeout(existingTimers.failsafe);
    }

    // Set new debouncer with automatic cleanup
    const debouncer = setTimeout(async () => {
      try {
        await this.runQualityCheck(filePath, changeEvent);
      } catch (error) {
        this.logger.error({
          filePath,
          error: error instanceof Error ? error.message : String(error)
        }, 'Quality check failed');
      } finally {
        // Always clean up the debouncer
        this.qualityCheckDebouncers.delete(filePath);
      }
    }, this.config.qualityCheck.debounceMs);

    // Task: SF-STABILITY-2025-T2.3 - Reduced failsafe from 10x to 3x debounce time
    const failsafeCleanup = setTimeout(() => {
      if (this.qualityCheckDebouncers.has(filePath)) {
        this.logger.warn({ filePath }, 'Cleaning up stale quality check debouncer');
        this.qualityCheckDebouncers.delete(filePath);
      }
    }, this.config.qualityCheck.debounceMs * 3); // 3x the normal debounce time (6s with 2s debounce)

    // Task: SF-STABILITY-2025-T2.3 - Store both timers
    this.qualityCheckDebouncers.set(filePath, { debouncer, failsafe: failsafeCleanup });
  }

  private async runQualityCheck(filePath: string, changeEvent: FileChangeEvent): Promise<void> {
    try {
      console.log(`[FileWatcher] Running quality check for: ${filePath}`);

      let qualityResult: QualityResult | null = null;

      // Run formatting check first
      if (this.config.qualityCheck.autoFormat) {
        const formatResult = await this.qualityService.formatSingleFile(filePath);
        if (formatResult.success && formatResult.formatted) {
          qualityResult = formatResult;
          console.log(`[FileWatcher] Formatted file: ${filePath}`);
        }
      }

      // Run lint check
      if (this.config.qualityCheck.autoLint) {
        const lintResult = await this.qualityService.lintSingleFile(filePath);
        if (!qualityResult && (lintResult.errors && lintResult.errors > 0)) {
          qualityResult = lintResult;
        }

        if (lintResult.errors && lintResult.errors > 0) {
          console.log(`[FileWatcher] Lint issues found in ${filePath}: ${lintResult.errors} errors, ${lintResult.warnings} warnings`);
        } else if (lintResult.success) {
          console.log(`[FileWatcher] No lint issues in ${filePath}`);
        }
      }

      // Update change event with quality result
      if (qualityResult) {
        changeEvent.qualityCheck = qualityResult;

        // Broadcast quality update
        this.broadcastQualityUpdate(filePath, qualityResult);
      }

    } catch (error) {
      console.error(`[FileWatcher] Quality check failed for ${filePath}:`, error);
    }
  }

  private broadcastQualityUpdate(filePath: string, qualityResult: QualityResult): void {
    const message = JSON.stringify({
      type: 'qualityUpdate',
      data: {
        filePath,
        quality: qualityResult,
        timestamp: new Date().toISOString()
      }
    });

    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(message);
        } catch (error) {
          console.error('[FileWatcher] Failed to send quality update to client:', error);
          this.clients.delete(client);
        }
      }
    });
  }

  getChangeHistory(limit: number = 50): FileChangeEvent[] {
    return this.changeHistory.slice(-limit);
  }

  getStats(): {
    watchedPaths: string[];
    connectedClients: number;
    totalChanges: number;
    changesByCategory: { [key: string]: number };
    changesByType: { [key: string]: number };
    qualityConfig: {
      enabled: boolean;
      autoFormat: boolean;
      autoLint: boolean;
      fileTypes: string[];
      debounceMs: number;
    };
  } {
    const changesByCategory: { [key: string]: number } = {};
    const changesByType: { [key: string]: number } = {};

    this.changeHistory.forEach(change => {
      changesByCategory[change.category] = (changesByCategory[change.category] || 0) + 1;
      changesByType[change.type] = (changesByType[change.type] || 0) + 1;
    });

    return {
      watchedPaths: this.config.watchPaths,
      connectedClients: this.clients.size,
      totalChanges: this.changeHistory.length,
      changesByCategory,
      changesByType,
      qualityConfig: this.config.qualityCheck
    };
  }

  updateQualityConfig(config: Partial<typeof this.config.qualityCheck>): void {
    this.config.qualityCheck = { ...this.config.qualityCheck, ...config };
    console.log('[FileWatcher] Quality configuration updated:', this.config.qualityCheck);
  }

  getQualityConfig(): typeof this.config.qualityCheck {
    return { ...this.config.qualityCheck };
  }

  /**
   * Add a new path to watch
   */
  addWatchPath(path: string): boolean {
    const resolvedPath = this.resolveProjectPath(path);

    if (this.config.watchPaths.includes(resolvedPath)) {
      this.logger.warn({ path: resolvedPath }, 'Path already being watched');
      return false;
    }

    const success = this.startWatcher(resolvedPath);
    if (success) {
      this.config.watchPaths.push(resolvedPath);
      this.logger.info({ path: resolvedPath }, 'Added new watch path');
    }

    return success;
  }

  /**
   * Remove a watch path
   */
  removeWatchPath(path: string): boolean {
    const resolvedPath = this.resolveProjectPath(path);
    const index = this.config.watchPaths.indexOf(resolvedPath);

    if (index === -1) {
      this.logger.warn({ path: resolvedPath }, 'Path not being watched');
      return false;
    }

    const watcher = this.watchers.get(resolvedPath);
    if (watcher) {
      try {
        watcher.close();
        this.watchers.delete(resolvedPath);
        this.config.watchPaths.splice(index, 1);
        this.logger.info({ path: resolvedPath }, 'Removed watch path');
        return true;
      } catch (error) {
        this.logger.error({ path: resolvedPath, error: error instanceof Error ? error.message : String(error) }, 'Error removing watch path');
      }
    }

    return false;
  }

  /**
   * Restart the file watching service with new configuration
   */
  restart(newWatchPaths?: string[]): boolean {
    try {
      this.logger.info('Restarting file watching service...');

      // Stop existing watchers
      this.watchers.forEach((watcher, path) => {
        try {
          watcher.close();
          this.logger.debug({ path }, 'Stopped existing watcher');
        } catch (error) {
          this.logger.warn({ path, error: error instanceof Error ? error.message : String(error) }, 'Error stopping existing watcher');
        }
      });
      this.watchers.clear();

      // Update configuration if new paths provided
      if (newWatchPaths) {
        this.config.watchPaths = newWatchPaths.map(path => this.resolveProjectPath(path));
      }

      // Start new watchers
      let successCount = 0;
      this.config.watchPaths.forEach(watchPath => {
        if (this.startWatcher(watchPath)) {
          successCount++;
        }
      });

      this.logger.info({
        totalPaths: this.config.watchPaths.length,
        successfulPaths: successCount,
        paths: this.config.watchPaths
      }, 'File watching service restarted');

      return successCount > 0;

    } catch (error) {
      this.logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Failed to restart file watching service');
      return false;
    }
  }

  /**
   * Get current watch paths configuration
   */
  getWatchPaths(): string[] {
    return [...this.config.watchPaths];
  }

  /**
   * Update ignored patterns
   */
  updateIgnoredPatterns(patterns: string[]): void {
    this.config.ignored = [...this.config.ignored, ...patterns];
    this.logger.info({ addedPatterns: patterns }, 'Updated ignored patterns');
  }

  async triggerManualQualityCheck(files?: string[]): Promise<{
    results: QualityResult[];
    summary: { total: number; passed: number; failed: number; errors: number; warnings: number };
  }> {
    const filesToCheck = files || this.changeHistory
      .filter(change => change.type === 'change' && this.shouldRunQualityCheck(change.relativePath))
      .slice(-20) // Last 20 changes
      .map(change => change.path);

    const results: QualityResult[] = [];
    let totalErrors = 0;
    let totalWarnings = 0;
    let passed = 0;
    let failed = 0;

    for (const filePath of filesToCheck) {
      try {
        // Run both format and lint checks
        const [formatResult, lintResult] = await Promise.all([
          this.qualityService.formatSingleFile(filePath),
          this.qualityService.lintSingleFile(filePath)
        ]);

        results.push(formatResult, lintResult);

        if (lintResult.success) {
          passed++;
        } else {
          failed++;
        }

        totalErrors += lintResult.errors || 0;
        totalWarnings += lintResult.warnings || 0;

      } catch (error) {
        console.error(`[FileWatcher] Manual quality check failed for ${filePath}:`, error);
        failed++;
      }
    }

    const summary = {
      total: results.length,
      passed,
      failed,
      errors: totalErrors,
      warnings: totalWarnings
    };

    // Broadcast manual check results
    this.broadcastManualQualityCheckResults(results, summary);

    return { results, summary };
  }

  private broadcastManualQualityCheckResults(results: QualityResult[], summary: any): void {
    const message = JSON.stringify({
      type: 'manualQualityCheckResults',
      data: {
        results,
        summary,
        timestamp: new Date().toISOString()
      }
    });

    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(message);
        } catch (error) {
          console.error('[FileWatcher] Failed to send manual quality check results to client:', error);
          this.clients.delete(client);
        }
      }
    });
  }

  /**
   * Check if error is a permission error
   * Task: SF-STABILITY-2025-T3.5
   */
  private isPermissionError(error: unknown): boolean {
    if (error instanceof Error) {
      const errorCode = (error as any).code;
      const permissionCodes = ['EACCES', 'EPERM', 'ENOENT'];

      if (permissionCodes.includes(errorCode)) {
        return true;
      }

      // Check error message
      const message = error.message.toLowerCase();
      return message.includes('permission') ||
             message.includes('eacces') ||
             message.includes('eperm');
    }

    return false;
  }
}

// Singleton instance
let fileWatcherService: FileWatcherService | null = null;

export function getFileWatcherService(): FileWatcherService {
  if (!fileWatcherService) {
    fileWatcherService = new FileWatcherService();
  }
  return fileWatcherService;
}