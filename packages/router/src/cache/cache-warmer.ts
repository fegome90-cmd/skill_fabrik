/**
 * Advanced Cache Warming System
 * Preloads and maintains cache for optimal performance
 * Task: SF-PERFORMANCE-2025-T2.4
 * Date: 2025-11-14
 */

import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { logger } from '../logger.js';
import { LRUCache } from './lru-cache.js';
import { MetricsCollector } from '../metrics/metrics-collector.js';

export interface CacheWarmerOptions {
  warmupInterval?: number;        // Cache warmup interval (ms)
  preloadRules?: boolean;         // Preload skill rules on startup
  preloadCommonSkills?: boolean;   // Preload frequently used skills
  maxConcurrentWarmups?: number;   // Max concurrent warmup operations
  warmupTimeout?: number;          // Timeout per warmup operation (ms)
  enableMetrics?: boolean;         // Enable metrics collection
  adaptiveWarming?: boolean;       // Enable adaptive cache warming
}

export interface WarmupTask {
  id: string;
  type: 'rules' | 'skill' | 'pattern' | 'custom';
  priority: number;
  data: any;
  createdAt: number;
  attempts: number;
  maxAttempts: number;
  timeout: number;
}

export interface CacheWarmingStats {
  totalWarmups: number;
  successfulWarmups: number;
  failedWarmups: number;
  warmupsInProgress: number;
  averageWarmupTime: number;
  lastWarmupTime: number;
  cacheHitRate: number;
  adaptiveScore: number;
}

export interface CacheEntryMetadata {
  key: string;
  accessCount: number;
  lastAccess: number;
  lastUpdated: number;
  size: number;
  priority: number;
  frequency: number;
  warmth: 'cold' | 'warming' | 'warm' | 'hot';
}

/**
 * Advanced Cache Warming with Adaptive Intelligence
 */
export class CacheWarmer {
  private warmupQueue: WarmupTask[] = [];
  private activeWarmups: Map<string, Promise<void>> = new Map();
  private cacheMetadata: Map<string, CacheEntryMetadata> = new Map();
  private warmupHistory: Array<{ timestamp: number; task: WarmupTask; success: boolean; duration: number }> = [];

  private stats = {
    totalWarmups: 0,
    successfulWarmups: 0,
    failedWarmups: 0,
    lastWarmupTime: 0,
    totalWarmupTime: 0
  };

  private warmupTimer: NodeJS.Timeout | null = null;
  private isRunning = false;

  // Configuration
  private options: Required<CacheWarmerOptions>;
  private adaptivePatterns = new Map<string, number>(); // Pattern frequency tracking

  constructor(
    private cache: LRUCache<any>,
    private metrics: MetricsCollector,
    options: CacheWarmerOptions = {}
  ) {
    this.options = {
      warmupInterval: options.warmupInterval || 300000, // 5 minutes
      preloadRules: options.preloadRules !== false,
      preloadCommonSkills: options.preloadCommonSkills !== false,
      maxConcurrentWarmups: options.maxConcurrentWarmups || 5,
      warmupTimeout: options.warmupTimeout || 10000, // 10 seconds
      enableMetrics: options.enableMetrics !== false,
      adaptiveWarming: options.adaptiveWarming !== false
    };

    // Start background warming
    this.startBackgroundWarming();

    // Initial warmup
    if (this.options.preloadRules || this.options.preloadCommonSkills) {
      this.performInitialWarmup();
    }

    logger.info({
      warmupInterval: this.options.warmupInterval,
      maxConcurrentWarmups: this.options.maxConcurrentWarmups,
      adaptiveWarming: this.options.adaptiveWarming
    }, 'Cache warmer initialized');
  }

  /**
   * Queue a custom warmup task
   */
  public queueWarmup(
    type: WarmupTask['type'],
    data: any,
    priority: number = 1,
    maxAttempts: number = 3,
    timeout?: number
  ): string {
    const taskId = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const task: WarmupTask = {
      id: taskId,
      type,
      priority,
      data,
      createdAt: Date.now(),
      attempts: 0,
      maxAttempts,
      timeout: timeout || this.options.warmupTimeout
    };

    this.warmupQueue.push(task);
    this.sortWarmupQueue();

    logger.debug({
      taskId,
      type,
      priority,
      queueLength: this.warmupQueue.length
    }, 'Warmup task queued');

    return taskId;
  }

  /**
   * Preload skill rules
   */
  public async preloadSkillRules(rulesPath: string): Promise<void> {
    const taskId = this.queueWarmup('rules', { rulesPath }, 10, 1, 15000);

    return new Promise((resolve, reject) => {
      const checkStatus = () => {
        const warmup = this.activeWarmups.get(taskId);
        if (!warmup) {
          // Task completed
          const history = this.warmupHistory.find(h => h.task.id === taskId);
          if (history && history.success) {
            resolve();
          } else {
            reject(new Error('Skill rules preload failed'));
          }
        } else {
          setTimeout(checkStatus, 100);
        }
      };
      checkStatus();
    });
  }

  /**
   * Get cache warming statistics
   */
  public getStats(): CacheWarmingStats {
    const cacheStats = this.cache.getStats();
    const inProgress = this.activeWarmups.size;
    const averageTime = this.stats.totalWarmups > 0
      ? this.stats.totalWarmupTime / this.stats.totalWarmups
      : 0;

    return {
      totalWarmups: this.stats.totalWarmups,
      successfulWarmups: this.stats.successfulWarmups,
      failedWarmups: this.stats.failedWarmups,
      warmupsInProgress: inProgress,
      averageWarmupTime: averageTime,
      lastWarmupTime: this.stats.lastWarmupTime,
      cacheHitRate: cacheStats.hitRate,
      adaptiveScore: this.calculateAdaptiveScore()
    };
  }

  /**
   * Get cache metadata
   */
  public getCacheMetadata(): CacheEntryMetadata[] {
    return Array.from(this.cacheMetadata.values());
  }

  /**
   * Force warmup of specific cache keys
   */
  public async forceWarmup(keys: string[]): Promise<void> {
    const warmupPromises = keys.map(key =>
      this.queueWarmup('custom', { key }, 5, 1)
    ).map(taskId => {
      return new Promise<void>((resolve, reject) => {
        const checkStatus = () => {
          const warmup = this.activeWarmups.get(taskId);
          if (!warmup) {
            const history = this.warmupHistory.find(h => h.task.id === taskId);
            if (history?.success) {
              resolve();
            } else {
              reject(new Error(`Force warmup failed for key: ${taskId}`));
            }
          } else {
            setTimeout(checkStatus, 100);
          }
        };
        checkStatus();
      });
    });

    await Promise.allSettled(warmupPromises);
  }

  /**
   * Shutdown cache warmer
   */
  public shutdown(): void {
    this.isRunning = false;

    if (this.warmupTimer) {
      clearInterval(this.warmupTimer);
      this.warmupTimer = null;
    }

    // Wait for active warmups to complete
    Promise.allSettled(Array.from(this.activeWarmups.values())).then(() => {
      logger.info('Cache warmer shutdown completed');
    });
  }

  // Private methods

  private async performInitialWarmup(): Promise<void> {
    logger.info('Starting initial cache warmup');

    const warmupTasks: Array<Promise<void>> = [];

    if (this.options.preloadRules) {
      warmupTasks.push(this.warmupSkillRules());
    }

    if (this.options.preloadCommonSkills) {
      warmupTasks.push(this.warmupCommonSkills());
    }

    try {
      await Promise.allSettled(warmupTasks);
      logger.info('Initial cache warmup completed');
    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : String(error)
      }, 'Initial cache warmup failed');
    }
  }

  private startBackgroundWarming(): void {
    this.isRunning = true;

    this.warmupTimer = setInterval(async () => {
      if (this.isRunning && this.warmupQueue.length > 0) {
        await this.processWarmupQueue();
      }

      // Adaptive warming
      if (this.options.adaptiveWarming) {
        this.performAdaptiveWarming();
      }

    }, this.options.warmupInterval);

    if (this.warmupTimer.unref) {
      this.warmupTimer.unref();
    }
  }

  private async processWarmupQueue(): Promise<void> {
    while (this.activeWarmups.size < this.options.maxConcurrentWarmups && this.warmupQueue.length > 0) {
      const task = this.warmupQueue.shift();
      if (!task) break;

      const warmupPromise = this.executeWarmup(task);
      this.activeWarmups.set(task.id, warmupPromise);

      // Clean up when done
      warmupPromise.finally(() => {
        this.activeWarmups.delete(task.id);
      });
    }
  }

  private async executeWarmup(task: WarmupTask): Promise<void> {
    const startTime = Date.now();
    task.attempts++;

    logger.debug({
      taskId: task.id,
      type: task.type,
      attempt: task.attempts
    }, 'Executing warmup task');

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Warmup timeout')), task.timeout);
      });

      const warmupPromise = this.performWarmupOperation(task);

      await Promise.race([warmupPromise, timeoutPromise]);

      const duration = Date.now() - startTime;
      this.recordWarmupSuccess(task, duration);

      logger.debug({
        taskId: task.id,
        duration
      }, 'Warmup task completed successfully');

    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordWarmupFailure(task, duration, error as Error);

      // Retry if max attempts not reached
      if (task.attempts < task.maxAttempts) {
        logger.debug({
          taskId: task.id,
          attempt: task.attempts,
          maxAttempts: task.maxAttempts,
          error: error instanceof Error ? error.message : String(error)
        }, 'Retrying warmup task');

        // Add back to queue with lower priority
        task.priority = Math.max(1, task.priority - 1);
        this.warmupQueue.push(task);
        this.sortWarmupQueue();
      } else {
        logger.error({
          taskId: task.id,
          error: error instanceof Error ? error.message : String(error)
        }, 'Warmup task failed after max attempts');
      }
    }
  }

  private async performWarmupOperation(task: WarmupTask): Promise<void> {
    switch (task.type) {
      case 'rules':
        return this.warmupSkillRulesOperation(task.data);
      case 'skill':
        return this.warmupSkillOperation(task.data);
      case 'pattern':
        return this.warmupPatternOperation(task.data);
      case 'custom':
        return this.warmupCustomOperation(task.data);
      default:
        throw new Error(`Unknown warmup task type: ${task.type}`);
    }
  }

  private async warmupSkillRules(): Promise<void> {
    // This would implement the actual skill rules warming
    // For now, it's a placeholder implementation
    logger.debug('Warming skill rules cache');

    // Simulate warming delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Update cache metadata
    this.updateCacheMetadata('skill-rules', 'hot', 10);
  }

  private async warmupCommonSkills(): Promise<void> {
    // This would implement warming of commonly used skills
    logger.debug('Warming common skills cache');

    // Simulate warming delay
    await new Promise(resolve => setTimeout(resolve, 200));

    // Update cache metadata
    this.updateCacheMetadata('common-skills', 'hot', 8);
  }

  private async warmupSkillRulesOperation(data: { rulesPath: string }): Promise<void> {
    try {
      const rulesContent = await readFile(data.rulesPath, 'utf-8');
      const rules = JSON.parse(rulesContent);

      // Cache the rules
      this.cache.set('skill-rules', rules, 300000); // 5 minutes TTL

      logger.debug('Skill rules cached successfully');
    } catch (error) {
      throw new Error(`Failed to warm skill rules: ${error}`);
    }
  }

  private async warmupSkillOperation(data: { skillId: string }): Promise<void> {
    // Placeholder for skill-specific warming
    logger.debug({ skillId: data.skillId }, 'Warming skill cache');

    // Simulate skill loading
    await new Promise(resolve => setTimeout(resolve, 50));

    this.cache.set(`skill-${data.skillId}`, { loaded: true }, 600000);
  }

  private async warmupPatternOperation(data: { pattern: string }): Promise<void> {
    // Warm up cache for specific patterns
    logger.debug({ pattern: data.pattern }, 'Warming pattern cache');

    // Track pattern frequency for adaptive warming
    const currentFreq = this.adaptivePatterns.get(data.pattern) || 0;
    this.adaptivePatterns.set(data.pattern, currentFreq + 1);

    await new Promise(resolve => setTimeout(resolve, 30));

    this.cache.set(`pattern-${data.pattern}`, { warmed: true }, 900000);
  }

  private async warmupCustomOperation(data: { key: string }): Promise<void> {
    // Custom cache warming
    logger.debug({ key: data.key }, 'Warming custom cache');

    await new Promise(resolve => setTimeout(resolve, 20));

    this.cache.set(data.key, { custom: true, warmedAt: Date.now() });
  }

  private sortWarmupQueue(): void {
    this.warmupQueue.sort((a, b) => {
      // Sort by priority (higher first), then by creation time (older first)
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return a.createdAt - b.createdAt;
    });
  }

  private recordWarmupSuccess(task: WarmupTask, duration: number): void {
    this.stats.totalWarmups++;
    this.stats.successfulWarmups++;
    this.stats.lastWarmupTime = Date.now();
    this.stats.totalWarmupTime += duration;

    this.warmupHistory.push({
      timestamp: Date.now(),
      task,
      success: true,
      duration
    });

    // Update metadata
    this.updateCacheMetadata(task.id, 'warm', task.priority);

    if (this.options.enableMetrics) {
      this.metrics.incrementCounter('cache_warmup_success_total', 1, { type: task.type });
      this.metrics.recordTimer('cache_warmup_duration', duration, { type: task.type });
      this.metrics.setGauge('cache_warmup_queue_size', this.warmupQueue.length);
    }
  }

  private recordWarmupFailure(task: WarmupTask, duration: number, error: Error): void {
    this.stats.totalWarmups++;
    this.stats.failedWarmups++;
    this.stats.lastWarmupTime = Date.now();
    this.stats.totalWarmupTime += duration;

    this.warmupHistory.push({
      timestamp: Date.now(),
      task,
      success: false,
      duration
    });

    // Update metadata
    this.updateCacheMetadata(task.id, 'cold', 0);

    if (this.options.enableMetrics) {
      this.metrics.incrementCounter('cache_warmup_failure_total', 1, { type: task.type });
      this.metrics.recordTimer('cache_warmup_duration', duration, { type: task.type });
      this.metrics.setGauge('cache_warmup_queue_size', this.warmupQueue.length);
    }

    logger.warn({
      taskId: task.id,
      type: task.type,
      error: error.message
    }, 'Cache warmup failed');
  }

  private updateCacheMetadata(key: string, warmth: CacheEntryMetadata['warmth'], priority: number): void {
    const existing = this.cacheMetadata.get(key);
    const now = Date.now();

    if (existing) {
      existing.lastAccess = now;
      existing.warmth = warmth;
      existing.priority = priority;
      existing.frequency++;
    } else {
      this.cacheMetadata.set(key, {
        key,
        accessCount: 1,
        lastAccess: now,
        lastUpdated: now,
        size: 0, // Would calculate actual size
        priority,
        frequency: 1,
        warmth
      });
    }
  }

  private calculateAdaptiveScore(): number {
    // Calculate adaptive warming score based on hit rates and warmup success
    const cacheStats = this.cache.getStats();
    const warmupSuccessRate = this.stats.totalWarmups > 0
      ? this.stats.successfulWarmups / this.stats.totalWarmups
      : 0;

    return (cacheStats.hitRate * 0.6) + (warmupSuccessRate * 0.4);
  }

  private performAdaptiveWarming(): void {
    // Analyze access patterns and warm up proactively
    const recentHistory = this.warmupHistory.slice(-20);

    // Identify frequently accessed patterns
    const patternFrequency = new Map<string, number>();
    recentHistory.forEach(entry => {
      if (entry.task.type === 'pattern') {
        const pattern = entry.task.data.pattern;
        patternFrequency.set(pattern, (patternFrequency.get(pattern) || 0) + 1);
      }
    });

    // Queue warmup for high-frequency patterns
    for (const [pattern, frequency] of patternFrequency) {
      if (frequency >= 3 && !this.cache.has(`pattern-${pattern}`)) {
        this.queueWarmup('pattern', { pattern }, frequency);
      }
    }
  }
}