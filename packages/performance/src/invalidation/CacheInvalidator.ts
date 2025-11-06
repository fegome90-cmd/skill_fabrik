import { type SignalCache, type CacheKey } from '../cache/SignalCache.js';

export interface InvalidationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: number; // 1-10, higher = more priority
  conditions: {
    triggers: InvalidationTrigger[];
    filters: InvalidationFilter[];
  };
  actions: InvalidationAction[];
  cooldown: number; // ms between invalidations
  metadata?: Record<string, any>;
}

export interface InvalidationTrigger {
  type: 'time' | 'manual' | 'event' | 'dependency' | 'threshold' | 'file_change';
  config: {
    // Time-based triggers
    interval?: number; // ms
    cron?: string;

    // Manual triggers
    requiresConfirmation?: boolean;

    // Event-based triggers
    eventType?: string;
    eventSource?: string;

    // Dependency triggers
    dependencyType?: 'signal' | 'skill' | 'context' | 'config';
    dependencyName?: string;

    // Threshold triggers
    metric?: string;
    threshold?: number;
    operator?: '>' | '<' | '>=' | '<=' | '==';

    // File change triggers
    pathPattern?: string;
    watchRecursive?: boolean;
  };
}

export interface InvalidationFilter {
  type: 'skill' | 'signal' | 'context' | 'pattern' | 'custom';
  config: {
    // Skill filters
    skillNames?: string[];
    skillPatterns?: string[];

    // Signal filters
    signalNames?: string[];

    // Context filters
    contextTypes?: string[];
    contextPatterns?: Record<string, any>;

    // Pattern filters
    keyPattern?: string;
    valuePattern?: string;

    // Custom filters
    customFilter?: (key: CacheKey, value: any) => boolean;
  };
}

export interface InvalidationAction {
  type: 'delete' | 'refresh' | 'revalidate' | 'custom';
  config: {
    // Delete action
    cascade?: boolean;

    // Refresh action
    warmAfterDelete?: boolean;
    warmingStrategy?: string;

    // Revalidate action
    recomputeValue?: boolean;
    backgroundRefresh?: boolean;

    // Custom action
    customAction?: (key: CacheKey, value: any) => Promise<void>;
  };
}

export interface InvalidationResult {
  ruleId: string;
  ruleName: string;
  triggeredAt: number;
  triggerType: string;
  affectedKeys: number;
  actions: {
    type: string;
    success: boolean;
    duration: number;
    details?: any;
  }[];
  duration: number;
  success: boolean;
}

export interface InvalidationMetrics {
  totalInvalidations: number;
  successfulInvalidations: number;
  failedInvalidations: number;
  totalKeysAffected: number;
  averageDuration: number;
  rules: {
    [ruleId: string]: {
      executions: number;
      successRate: number;
      avgDuration: number;
      keysAffected: number;
      lastExecution: number;
    };
  };
  triggers: {
    [triggerType: string]: {
      count: number;
      lastTriggered: number;
    };
  };
  timestamp: number;
}

export class CacheInvalidator {
  private readonly cache: SignalCache;
  private rules: Map<string, InvalidationRule> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private watchers: Map<string, any> = new Map(); // File watchers
  private metrics: InvalidationMetrics;
  private isRunning = false;

  constructor(cache: SignalCache) {
    this.cache = cache;
    this.metrics = this.initializeMetrics();
  }

  // Rule management
  addRule(rule: InvalidationRule): void {
    this.rules.set(rule.id, rule);
    console.log(`🗑️ Added invalidation rule: ${rule.name}`);

    // Set up triggers for the rule
    this.setupRuleTriggers(rule);
  }

  updateRule(ruleId: string, updates: Partial<InvalidationRule>): boolean {
    const existingRule = this.rules.get(ruleId);
    if (!existingRule) return false;

    // Clean up existing triggers
    this.cleanupRuleTriggers(ruleId);

    // Update rule
    const updatedRule = { ...existingRule, ...updates };
    this.rules.set(ruleId, updatedRule);

    // Set up new triggers
    this.setupRuleTriggers(updatedRule);

    console.log(`🔄 Updated invalidation rule: ${updatedRule.name}`);
    return true;
  }

  removeRule(ruleId: string): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;

    // Clean up triggers
    this.cleanupRuleTriggers(ruleId);

    // Remove rule
    this.rules.delete(ruleId);
    console.log(`🗑️ Removed invalidation rule: ${rule.name}`);
    return true;
  }

  // Manual invalidation
  async invalidateByRule(ruleId: string, triggerType: string = 'manual'): Promise<InvalidationResult> {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      throw new Error(`Rule not found: ${ruleId}`);
    }

    return this.executeInvalidation(rule, triggerType);
  }

  async invalidateByPattern(pattern: string, options?: {
    dryRun?: boolean;
    cascade?: boolean;
  }): Promise<{
    matchedKeys: number;
    invalidatedKeys: number;
    duration: number;
    details?: any;
  }> {
    const startTime = Date.now();

    if (options?.dryRun) {
      // Just count matched keys without invalidating
      const matchedKeys = await this.countMatchingKeys(pattern);
      return {
        matchedKeys,
        invalidatedKeys: 0,
        duration: Date.now() - startTime
      };
    }

    const invalidatedCount = await this.cache.invalidatePattern(pattern);

    return {
      matchedKeys: invalidatedCount, // Assume matched = invalidated for simplicity
      invalidatedKeys: invalidatedCount,
      duration: Date.now() - startTime
    };
  }

  async invalidateByKey(cacheKey: Partial<CacheKey>): Promise<boolean> {
    const fullKey: CacheKey = {
      signalName: cacheKey.signalName || '*',
      skillName: cacheKey.skillName || '*',
      prompt: cacheKey.prompt || '*',
      contextHash: cacheKey.contextHash || '*',
      version: cacheKey.version || '*'
    };

    const pattern = Object.values(fullKey).join(':');
    const result = await this.cache.invalidatePattern(pattern);
    return result > 0;
  }

  // Trigger setup and management
  private setupRuleTriggers(rule: InvalidationRule): void {
    for (const trigger of rule.conditions.triggers) {
      switch (trigger.type) {
        case 'time':
          this.setupTimeTrigger(rule.id, trigger);
          break;
        case 'event':
          this.setupEventTrigger(rule.id, trigger);
          break;
        case 'dependency':
          this.setupDependencyTrigger(rule.id, trigger);
          break;
        case 'threshold':
          this.setupThresholdTrigger(rule.id, trigger);
          break;
        case 'file_change':
          this.setupFileChangeTrigger(rule.id, trigger);
          break;
        // Manual triggers don't need setup
      }
    }
  }

  private cleanupRuleTriggers(ruleId: string): void {
    // Clear timer
    const timer = this.timers.get(ruleId);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(ruleId);
    }

    // Clear file watcher
    const watcher = this.watchers.get(ruleId);
    if (watcher) {
      watcher.close();
      this.watchers.delete(ruleId);
    }
  }

  private setupTimeTrigger(ruleId: string, trigger: InvalidationTrigger): void {
    if (trigger.config.interval) {
      const timer = setInterval(async () => {
        const rule = this.rules.get(ruleId);
        if (rule && rule.enabled && this.canExecuteRule(rule)) {
          await this.executeInvalidation(rule, 'time_interval');
        }
      }, trigger.config.interval);

      this.timers.set(ruleId, timer);
      console.log(`⏰ Set up time interval trigger for rule: ${ruleId}`);
    }

    // TODO: Implement cron-based triggers
  }

  private setupEventTrigger(ruleId: string, trigger: InvalidationTrigger): void {
    // TODO: Implement event-based triggers
    // This would integrate with the event system
    console.log(`📡 Event trigger setup not yet implemented for rule: ${ruleId}`);
  }

  private setupDependencyTrigger(ruleId: string, trigger: InvalidationTrigger): void {
    // TODO: Implement dependency-based triggers
    // This would monitor changes in dependent signals/skills
    console.log(`🔗 Dependency trigger setup not yet implemented for rule: ${ruleId}`);
  }

  private setupThresholdTrigger(ruleId: string, trigger: InvalidationTrigger): void {
    if (!trigger.config.metric || !trigger.config.threshold) return;

    const monitorInterval = 60000; // Check every minute
    const timer = setInterval(async () => {
      const rule = this.rules.get(ruleId);
      if (!rule || !rule.enabled) return;

      try {
        const currentValue = await this.getMetricValue(trigger.config.metric);
        const threshold = trigger.config.threshold;
        const operator = trigger.config.operator || '>';

        const shouldTrigger = this.evaluateThreshold(currentValue, threshold, operator);

        if (shouldTrigger && this.canExecuteRule(rule)) {
          await this.executeInvalidation(rule, 'threshold');
        }
      } catch (error) {
        console.warn(`Threshold trigger monitoring failed for rule ${ruleId}:`, error);
      }
    }, monitorInterval);

    this.timers.set(`${ruleId}_threshold`, timer);
    console.log(`📊 Set up threshold trigger for rule: ${ruleId} (${trigger.config.metric} ${trigger.config.operator} ${trigger.config.threshold})`);
  }

  private setupFileChangeTrigger(ruleId: string, trigger: InvalidationTrigger): void {
    // TODO: Implement file change triggers
    // This would use file system watchers
    console.log(`📁 File change trigger setup not yet implemented for rule: ${ruleId}`);
  }

  // Invalid execution
  private async executeInvalidation(rule: InvalidationRule, triggerType: string): Promise<InvalidationResult> {
    const startTime = Date.now();
    console.log(`🗑️ Executing invalidation rule: ${rule.name} (trigger: ${triggerType})`);

    // Find matching cache keys
    const matchingKeys = await this.findMatchingKeys(rule);

    if (matchingKeys.length === 0) {
      console.log(`ℹ️ No cache keys matched for rule: ${rule.name}`);
      return {
        ruleId: rule.id,
        ruleName: rule.name,
        triggeredAt: startTime,
        triggerType,
        affectedKeys: 0,
        actions: [],
        duration: Date.now() - startTime,
        success: true
      };
    }

    const result: InvalidationResult = {
      ruleId: rule.id,
      ruleName: rule.name,
      triggeredAt: startTime,
      triggerType,
      affectedKeys: matchingKeys.length,
      actions: [],
      duration: 0,
      success: false
    };

    // Execute actions
    for (const action of rule.actions) {
      const actionStartTime = Date.now();
      let actionSuccess = false;
      let actionDetails: any;

      try {
        switch (action.type) {
          case 'delete':
            await this.executeDeleteAction(matchingKeys, action);
            actionSuccess = true;
            actionDetails = { deletedKeys: matchingKeys.length };
            break;

          case 'refresh':
            await this.executeRefreshAction(matchingKeys, action);
            actionSuccess = true;
            actionDetails = { refreshedKeys: matchingKeys.length };
            break;

          case 'revalidate':
            await this.executeRevalidateAction(matchingKeys, action);
            actionSuccess = true;
            actionDetails = { revalidatedKeys: matchingKeys.length };
            break;

          case 'custom':
            if (action.config.customAction) {
              for (const key of matchingKeys) {
                await action.config.customAction(key, null); // We don't have the cached value here
              }
              actionSuccess = true;
            }
            break;
        }
      } catch (error) {
        console.error(`Invalidation action failed:`, error);
        actionDetails = { error: error.message };
      }

      result.actions.push({
        type: action.type,
        success: actionSuccess,
        duration: Date.now() - actionStartTime,
        details: actionDetails
      });
    }

    result.duration = Date.now() - startTime;
    result.success = result.actions.every(action => action.success);

    // Update metrics
    this.updateMetrics(rule, triggerType, result);

    console.log(`✅ Invalidated ${matchingKeys.length} keys in ${result.duration}ms (rule: ${rule.name})`);
    return result;
  }

  private async executeDeleteAction(keys: CacheKey[], action: InvalidationAction): Promise<void> {
    for (const key of keys) {
      await this.cache.delete(key);
    }
  }

  private async executeRefreshAction(keys: CacheKey[], action: InvalidationAction): Promise<void> {
    // Delete and optionally warm up
    await this.executeDeleteAction(keys, { type: 'delete', config: {} });

    if (action.config.warmAfterDelete && action.config.warmingStrategy) {
      // TODO: Trigger cache warming with the specified strategy
      console.log(`🔥 Cache warming requested for ${keys.length} keys`);
    }
  }

  private async executeRevalidateAction(keys: CacheKey[], action: InvalidationAction): Promise<void> {
    // In a real implementation, this would recompute the values
    // For now, just delete them to force recomputation on next access
    await this.executeDeleteAction(keys, { type: 'delete', config: {} });
  }

  // Key matching and filtering
  private async findMatchingKeys(rule: InvalidationRule): Promise<CacheKey[]> {
    const matchingKeys: CacheKey[] = [];

    // This is a simplified implementation
    // In a real system, we'd need to scan the actual cache
    for (const [signalName] of [
      'keywordMatch', 'intentMatch', 'filePathMatch',
      'contentMatch', 'recentActivity', 'contextRelevance'
    ]) {
      for (const skillName of [
        'backend-dev-guidelines', 'frontend-dev-guidelines',
        'database-verification', 'project-catalog-developer'
      ]) {
        const key: CacheKey = {
          signalName,
          skillName,
          prompt: '*',
          contextHash: '*',
          version: 'v1'
        };

        if (this.matchesFilters(key, rule.conditions.filters)) {
          matchingKeys.push(key);
        }
      }
    }

    return matchingKeys;
  }

  private matchesFilters(key: CacheKey, filters: InvalidationFilter[]): boolean {
    if (filters.length === 0) return true;

    return filters.every(filter => {
      switch (filter.type) {
        case 'skill':
          if (filter.config.skillNames && !filter.config.skillNames.includes(key.skillName)) {
            return false;
          }
          if (filter.config.skillPatterns) {
            const matches = filter.config.skillPatterns.some(pattern =>
              new RegExp(pattern).test(key.skillName)
            );
            if (!matches) return false;
          }
          break;

        case 'signal':
          if (filter.config.signalNames && !filter.config.signalNames.includes(key.signalName)) {
            return false;
          }
          break;

        case 'pattern':
          if (filter.config.keyPattern) {
            const keyString = `${key.signalName}:${key.skillName}:${key.prompt}:${key.contextHash}`;
            if (!new RegExp(filter.config.keyPattern).test(keyString)) {
              return false;
            }
          }
          break;

        case 'custom':
          if (filter.config.customFilter && !filter.config.customFilter(key, null)) {
            return false;
          }
          break;
      }
      return true;
    });
  }

  private async countMatchingKeys(pattern: string): Promise<number> {
    // Simplified implementation - in reality, we'd scan the actual cache
    const mockKeys = [
      'keywordMatch:backend-dev-guidelines:*:*:v1',
      'intentMatch:frontend-dev-guidelines:*:*:v1',
      'filePathMatch:database-verification:*:*:v1'
    ];

    return mockKeys.filter(key => new RegExp(pattern.replace(/\*/g, '.*')).test(key)).length;
  }

  // Utility methods
  private canExecuteRule(rule: InvalidationRule): boolean {
    // Check cooldown
    const lastExecution = this.metrics.rules[rule.id]?.lastExecution || 0;
    return (Date.now() - lastExecution) >= rule.cooldown;
  }

  private evaluateThreshold(currentValue: number, threshold: number, operator: string): boolean {
    switch (operator) {
      case '>': return currentValue > threshold;
      case '<': return currentValue < threshold;
      case '>=': return currentValue >= threshold;
      case '<=': return currentValue <= threshold;
      case '==': return currentValue === threshold;
      default: return false;
    }
  }

  private async getMetricValue(metric: string): Promise<number> {
    // This would integrate with the monitoring system
    // For now, return mock values
    const mockMetrics: Record<string, number> = {
      'cache_hit_rate': 0.85,
      'cache_size_mb': 50,
      'memory_usage_percent': 60,
      'error_rate': 0.02
    };

    return mockMetrics[metric] || 0;
  }

  // Metrics management
  private initializeMetrics(): InvalidationMetrics {
    return {
      totalInvalidations: 0,
      successfulInvalidations: 0,
      failedInvalidations: 0,
      totalKeysAffected: 0,
      averageDuration: 0,
      rules: {},
      triggers: {},
      timestamp: Date.now()
    };
  }

  private updateMetrics(rule: InvalidationRule, triggerType: string, result: InvalidationResult): void {
    this.metrics.totalInvalidations++;
    if (result.success) {
      this.metrics.successfulInvalidations++;
    } else {
      this.metrics.failedInvalidations++;
    }

    this.metrics.totalKeysAffected += result.affectedKeys;
    this.metrics.averageDuration =
      (this.metrics.averageDuration * (this.metrics.totalInvalidations - 1) + result.duration) /
      this.metrics.totalInvalidations;

    // Update rule-specific metrics
    if (!this.metrics.rules[rule.id]) {
      this.metrics.rules[rule.id] = {
        executions: 0,
        successRate: 0,
        avgDuration: 0,
        keysAffected: 0,
        lastExecution: 0
      };
    }

    const ruleMetrics = this.metrics.rules[rule.id];
    ruleMetrics.executions++;
    ruleMetrics.successRate = (ruleMetrics.successRate * (ruleMetrics.executions - 1) + (result.success ? 1 : 0)) / ruleMetrics.executions;
    ruleMetrics.avgDuration = (ruleMetrics.avgDuration * (ruleMetrics.executions - 1) + result.duration) / ruleMetrics.executions;
    ruleMetrics.keysAffected += result.affectedKeys;
    ruleMetrics.lastExecution = Date.now();

    // Update trigger metrics
    if (!this.metrics.triggers[triggerType]) {
      this.metrics.triggers[triggerType] = {
        count: 0,
        lastTriggered: 0
      };
    }

    this.metrics.triggers[triggerType].count++;
    this.metrics.triggers[triggerType].lastTriggered = Date.now();
  }

  // Public API
  getMetrics(): InvalidationMetrics {
    return { ...this.metrics };
  }

  getRules(): Array<{ id: string; name: string; enabled: boolean; priority: number }> {
    return Array.from(this.rules.entries()).map(([id, rule]) => ({
      id,
      name: rule.name,
      enabled: rule.enabled,
      priority: rule.priority
    }));
  }

  enableRule(ruleId: string): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;

    rule.enabled = true;
    this.setupRuleTriggers(rule);
    console.log(`✅ Enabled invalidation rule: ${rule.name}`);
    return true;
  }

  disableRule(ruleId: string): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;

    rule.enabled = false;
    this.cleanupRuleTriggers(ruleId);
    console.log(`⏸️ Disabled invalidation rule: ${rule.name}`);
    return true;
  }

  start(): void {
    this.isRunning = true;
    console.log('🚀 Cache invalidator started');
  }

  stop(): void {
    this.isRunning = false;

    // Clean up all timers and watchers
    for (const ruleId of this.rules.keys()) {
      this.cleanupRuleTriggers(ruleId);
    }

    console.log('🛑 Cache invalidator stopped');
  }

  isStarted(): boolean {
    return this.isRunning;
  }

  // Cleanup
  cleanup(): void {
    this.stop();
    this.rules.clear();
    this.metrics = this.initializeMetrics();
  }
}