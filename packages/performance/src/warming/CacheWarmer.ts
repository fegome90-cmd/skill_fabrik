import { type SignalCache, type CacheKey } from '../cache/SignalCache.js';
import { type ScoreInput } from '../../../router/src/activation/types.js';

export interface WarmingStrategy {
  name: string;
  description: string;
  priority: number; // 1-10, higher = more important
  enabled: boolean;
}

export interface PrecomputedWarmingConfig extends WarmingStrategy {
  strategy: 'precomputed';
  datasets: {
    skillName: string;
    prompts: string[];
    contexts: any[];
    expectedScores?: number[];
  }[];
  refreshInterval: number; // ms
  batchSize: number;
}

export interface PredictiveWarmingConfig extends WarmingStrategy {
  strategy: 'predictive';
  model: {
    algorithm: 'frequency' | 'ml' | 'hybrid';
    lookbackWindow: number; // ms
    predictionWindow: number; // ms
    confidenceThreshold: number; // 0..1
  };
  dataSources: ('recent_activations' | 'usage_patterns' | 'seasonal')[];
  warmupThreshold: number; // minimum confidence to warm
}

export interface PeriodicWarmingConfig extends WarmingStrategy {
  strategy: 'periodic';
  schedule: {
    cron: string; // cron expression
    timezone: string;
  };
  tasks: {
    name: string;
    skillPatterns: string[];
    contextPatterns: any[];
    promptTemplates: string[];
  }[];
}

export interface WarmingMetrics {
  totalWarmed: number;
  successfulWarmed: number;
  failedWarmed: number;
  warmingTime: number; // ms
  hitRateImprovement: number; // percentage
  strategies: {
    [strategyName: string]: {
      executions: number;
      successRate: number;
      avgTime: number;
      itemsWarmed: number;
    };
  };
  timestamp: number;
}

export class CacheWarmer {
  private readonly cache: SignalCache;
  private strategies: Map<string, WarmingStrategy & {
    config: PrecomputedWarmingConfig | PredictiveWarmingConfig | PeriodicWarmingConfig;
  }> = new Map();
  private metrics: WarmingMetrics;
  private warmingTimer?: NodeJS.Timeout;
  private isWarming = false;

  constructor(cache: SignalCache) {
    this.cache = cache;
    this.metrics = this.initializeMetrics();
  }

  // Strategy management
  addPrecomputedStrategy(config: PrecomputedWarmingConfig): void {
    this.strategies.set(config.name, {
      ...config,
      config
    });
  }

  addPredictiveStrategy(config: PredictiveWarmingConfig): void {
    this.strategies.set(config.name, {
      ...config,
      config
    });
  }

  addPeriodicStrategy(config: PeriodicWarmingConfig): void {
    this.strategies.set(config.name, {
      ...config,
      config
    });
  }

  removeStrategy(name: string): boolean {
    return this.strategies.delete(name);
  }

  // Warming execution
  async executeWarming(strategies?: string[]): Promise<WarmingMetrics> {
    if (this.isWarming) {
      console.warn('Cache warming already in progress');
      return this.metrics;
    }

    this.isWarming = true;
    const startTime = Date.now();
    this.resetMetrics();

    try {
      const strategiesToExecute = strategies ||
        Array.from(this.strategies.keys())
          .filter(name => this.strategies.get(name)?.enabled)
          .sort((a, b) => {
            const priorityA = this.strategies.get(a)?.priority || 0;
            const priorityB = this.strategies.get(b)?.priority || 0;
            return priorityB - priorityA;
          });

      for (const strategyName of strategiesToExecute) {
        const strategy = this.strategies.get(strategyName);
        if (!strategy) continue;

        console.log(`🔥 Executing warming strategy: ${strategyName}`);
        const strategyStartTime = Date.now();

        try {
          await this.executeStrategy(strategy);
          const strategyTime = Date.now() - strategyStartTime;
          this.updateStrategyMetrics(strategyName, true, strategyTime);
          console.log(`✅ Strategy ${strategyName} completed in ${strategyTime}ms`);
        } catch (error) {
          const strategyTime = Date.now() - strategyStartTime;
          this.updateStrategyMetrics(strategyName, false, strategyTime);
          console.error(`❌ Strategy ${strategyName} failed:`, error);
        }
      }

      const totalTime = Date.now() - startTime;
      this.metrics.warmingTime = totalTime;
      this.metrics.timestamp = Date.now();

      console.log(`🔥 Cache warming completed in ${totalTime}ms`);
      console.log(`📊 Warmed ${this.metrics.totalWarmed} items (${this.metrics.successfulWarmed} successful)`);

    } finally {
      this.isWarming = false;
    }

    return this.metrics;
  }

  private async executeStrategy(strategy: WarmingStrategy & {
    config: PrecomputedWarmingConfig | PredictiveWarmingConfig | PeriodicWarmingConfig;
  }): Promise<void> {
    switch (strategy.config.strategy) {
      case 'precomputed':
        await this.executePrecomputedWarming(strategy.config as PrecomputedWarmingConfig);
        break;
      case 'predictive':
        await this.executePredictiveWarming(strategy.config as PredictiveWarmingConfig);
        break;
      case 'periodic':
        await this.executePeriodicWarming(strategy.config as PeriodicWarmingConfig);
        break;
    }
  }

  private async executePrecomputedWarming(config: PrecomputedWarmingConfig): Promise<void> {
    for (const dataset of config.datasets) {
      console.log(`  📊 Warming precomputed data for: ${dataset.skillName}`);

      for (let i = 0; i < dataset.prompts.length; i += config.batchSize) {
        const batch = dataset.prompts.slice(i, i + config.batchSize);
        const batchPromises = batch.map(async (prompt, batchIndex) => {
          const globalIndex = i + batchIndex;
          const context = dataset.contexts[globalIndex] || {};

          const cacheKey: CacheKey = {
            signalName: 'warming_precomputed',
            skillName: dataset.skillName,
            prompt,
            contextHash: this.hashContext(context),
            version: 'v1'
          };

          // Simulate computing the value (in reality, this would be actual signal evaluation)
          const simulatedValue = dataset.expectedScores?.[globalIndex] || Math.random();

          try {
            await this.cache.set(cacheKey, simulatedValue, {
              ttl: config.refreshInterval,
              source: 'L1'
            });
            this.metrics.successfulWarmed++;
          } catch (error) {
            console.warn(`Failed to warm cache key for ${dataset.skillName}:`, error);
            this.metrics.failedWarmed++;
          }

          this.metrics.totalWarmed++;
        });

        await Promise.all(batchPromises);

        // Small delay between batches to avoid overwhelming the system
        if (i + config.batchSize < dataset.prompts.length) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }
    }
  }

  private async executePredictiveWarming(config: PredictiveWarmingConfig): Promise<void> {
    console.log(`  🔮 Executing predictive warming with ${config.model.algorithm} model`);

    // Collect recent activation data
    const recentData = await this.collectRecentActivations(config.model.lookbackWindow);

    if (recentData.length === 0) {
      console.log('  ℹ️ No recent data found for predictive warming');
      return;
    }

    // Analyze patterns and predict future needs
    const predictions = await this.generatePredictions(recentData, config);

    console.log(`  📈 Generated ${predictions.length} predictions`);

    // Warm high-confidence predictions
    for (const prediction of predictions) {
      if (prediction.confidence >= config.model.confidenceThreshold) {
        const cacheKey: CacheKey = {
          signalName: 'warming_predictive',
          skillName: prediction.skillName,
          prompt: prediction.prompt,
          contextHash: this.hashContext(prediction.context),
          version: 'v1'
        };

        try {
          // Simulate predicted value
          const predictedValue = prediction.predictedScore;

          await this.cache.set(cacheKey, predictedValue, {
            ttl: config.model.predictionWindow,
            source: 'L1'
          });

          this.metrics.successfulWarmed++;
        } catch (error) {
          console.warn(`Failed to warm predicted cache key:`, error);
          this.metrics.failedWarmed++;
        }

        this.metrics.totalWarmed++;
      }
    }
  }

  private async executePeriodicWarming(config: PeriodicWarmingConfig): Promise<void> {
    console.log(`  ⏰ Executing periodic warming with ${config.tasks.length} tasks`);

    for (const task of config.tasks) {
      console.log(`  📋 Processing task: ${task.name}`);

      // Generate cache keys from templates and patterns
      const cacheKeys = await this.generateCacheKeysFromTask(task);

      console.log(`  🔑 Generated ${cacheKeys.length} cache keys for task: ${task.name}`);

      for (const cacheKey of cacheKeys) {
        try {
          // Simulate value (in reality, this would evaluate the actual signals)
          const simulatedValue = Math.random() * 0.8 + 0.2; // 0.2-1.0 range

          await this.cache.set(cacheKey, simulatedValue, {
            ttl: 3600000, // 1 hour
            source: 'L1'
          });

          this.metrics.successfulWarmed++;
        } catch (error) {
          console.warn(`Failed to warm periodic cache key:`, error);
          this.metrics.failedWarmed++;
        }

        this.metrics.totalWarmed++;
      }
    }
  }

  // Data collection and analysis
  private async collectRecentActivations(lookbackWindow: number): Promise<any[]> {
    // This would integrate with the performance monitoring system
    // For now, simulate recent activation data
    const now = Date.now();
    const cutoff = now - lookbackWindow;

    // Simulate recent activations
    const simulatedData = [];
    for (let i = 0; i < 50; i++) {
      const timestamp = cutoff + Math.random() * lookbackWindow;
      if (timestamp < now) {
        simulatedData.push({
          timestamp,
          skillName: this.getRandomSkillName(),
          prompt: this.getRandomPrompt(),
          context: this.getRandomContext(),
          score: Math.random()
        });
      }
    }

    return simulatedData.sort((a, b) => b.timestamp - a.timestamp);
  }

  private async generatePredictions(recentData: any[], config: PredictiveWarmingConfig): Promise<any[]> {
    const predictions: any[] = [];

    switch (config.model.algorithm) {
      case 'frequency':
        // Frequency-based prediction: find most common patterns
        const frequencyMap = new Map();

        for (const data of recentData) {
          const key = `${data.skillName}:${this.extractPattern(data.prompt)}`;
          frequencyMap.set(key, (frequencyMap.get(key) || 0) + 1);
        }

        // Generate predictions for high-frequency patterns
        for (const [key, frequency] of frequencyMap.entries()) {
          if (frequency >= 3) { // Minimum frequency threshold
            const [skillName, pattern] = key.split(':');
            predictions.push({
              skillName,
              prompt: this.generatePromptFromPattern(pattern),
              context: this.getRandomContext(),
              confidence: Math.min(frequency / 10, 0.9),
              predictedScore: 0.7 + Math.random() * 0.2
            });
          }
        }
        break;

      case 'hybrid':
        // Combine frequency and temporal patterns
        const hourlyPattern = new Map();
        const skillFrequency = new Map();

        for (const data of recentData) {
          const hour = new Date(data.timestamp).getHours();
          const key = `${data.skillName}:${hour}`;

          hourlyPattern.set(key, (hourlyPattern.get(key) || 0) + 1);
          skillFrequency.set(data.skillName, (skillFrequency.get(data.skillName) || 0) + 1);
        }

        // Generate hybrid predictions
        for (const [key, frequency] of hourlyPattern.entries()) {
          const [skillName, hourStr] = key.split(':');
          const confidence = Math.min(frequency / 5, 0.8) * (skillFrequency.get(skillName) / 10);

          if (confidence >= config.warmupThreshold) {
            predictions.push({
              skillName,
              prompt: this.getRandomPrompt(),
              context: this.getRandomContext(),
              confidence,
              predictedScore: 0.6 + Math.random() * 0.3
            });
          }
        }
        break;

      default:
        // Simple random predictions for demo
        for (let i = 0; i < 10; i++) {
          predictions.push({
            skillName: this.getRandomSkillName(),
            prompt: this.getRandomPrompt(),
            context: this.getRandomContext(),
            confidence: 0.5 + Math.random() * 0.3,
            predictedScore: 0.5 + Math.random() * 0.4
          });
        }
    }

    return predictions.sort((a, b) => b.confidence - a.confidence);
  }

  private async generateCacheKeysFromTask(task: PeriodicWarmingConfig['tasks'][0]): Promise<CacheKey[]> {
    const cacheKeys: CacheKey[] = [];

    for (const skillPattern of task.skillPatterns) {
      for (const promptTemplate of task.promptTemplates) {
        const prompt = this.expandTemplate(promptTemplate, {
          skill: skillPattern,
          time: new Date().toISOString(),
          random: Math.random()
        });

        const context = this.generateContextFromPatterns(task.contextPatterns);

        cacheKeys.push({
          signalName: 'warming_periodic',
          skillName: skillPattern,
          prompt,
          contextHash: this.hashContext(context),
          version: 'v1'
        });
      }
    }

    return cacheKeys;
  }

  // Utility methods
  private hashContext(context: any): string {
    return Buffer.from(JSON.stringify(context)).toString('base64').substring(0, 16);
  }

  private getRandomSkillName(): string {
    const skills = ['backend-dev-guidelines', 'frontend-dev-guidelines', 'database-verification', 'project-catalog-developer'];
    return skills[Math.floor(Math.random() * skills.length)];
  }

  private getRandomPrompt(): string {
    const prompts = [
      'Create new API endpoint',
      'Build React component',
      'Fix database schema',
      'Implement authentication',
      'Write documentation',
      'Deploy application',
      'Optimize performance',
      'Add unit tests'
    ];
    return prompts[Math.floor(Math.random() * prompts.length)];
  }

  private getRandomContext(): any {
    return {
      currentFile: `/project/src/${Math.random() > 0.5 ? 'controllers' : 'components'}/file${Math.floor(Math.random() * 100)}.ts`,
      openFiles: [`/project/package.json`, `/project/src/app.ts`],
      projectType: Math.random() > 0.5 ? 'backend' : 'frontend',
      gitDiff: Math.random() > 0.5 ? 'diff --git a/src/file.ts b/src/file.ts' : undefined
    };
  }

  private extractPattern(prompt: string): string {
    // Extract a simple pattern from the prompt
    const words = prompt.toLowerCase().split(' ');
    return words.slice(0, 2).join('_');
  }

  private generatePromptFromPattern(pattern: string): string {
    const templates = {
      'create_new': 'Create new {feature}',
      'build_react': 'Build React {component}',
      'fix_database': 'Fix {issue}',
      'implement_auth': 'Implement {feature}'
    };

    return templates[pattern as keyof typeof templates] || `Create ${pattern}`;
  }

  private expandTemplate(template: string, variables: Record<string, any>): string {
    return template.replace(/\{(\w+)\}/g, (match, key) => variables[key] || match);
  }

  private generateContextFromPatterns(patterns: any[]): any {
    if (patterns.length === 0) return this.getRandomContext();

    const context: any = {};
    for (const pattern of patterns) {
      if (typeof pattern === 'object') {
        Object.assign(context, pattern);
      }
    }

    return context;
  }

  // Metrics management
  private initializeMetrics(): WarmingMetrics {
    return {
      totalWarmed: 0,
      successfulWarmed: 0,
      failedWarmed: 0,
      warmingTime: 0,
      hitRateImprovement: 0,
      strategies: {},
      timestamp: Date.now()
    };
  }

  private resetMetrics(): void {
    this.metrics = this.initializeMetrics();
  }

  private updateStrategyMetrics(strategyName: string, success: boolean, time: number): void {
    if (!this.metrics.strategies[strategyName]) {
      this.metrics.strategies[strategyName] = {
        executions: 0,
        successRate: 0,
        avgTime: 0,
        itemsWarmed: 0
      };
    }

    const metrics = this.metrics.strategies[strategyName];
    metrics.executions++;

    if (success) {
      const successCount = Math.floor(metrics.successRate * (metrics.executions - 1)) + 1;
      metrics.successRate = successCount / metrics.executions;
      metrics.itemsWarmed += this.metrics.totalWarmed;
    } else {
      const successCount = Math.floor(metrics.successRate * (metrics.executions - 1));
      metrics.successRate = successCount / metrics.executions;
    }

    metrics.avgTime = (metrics.avgTime * (metrics.executions - 1) + time) / metrics.executions;
  }

  // Public API
  getMetrics(): WarmingMetrics {
    return { ...this.metrics };
  }

  getStrategies(): Array<{ name: string; enabled: boolean; priority: number }> {
    return Array.from(this.strategies.entries()).map(([name, strategy]) => ({
      name,
      enabled: strategy.enabled,
      priority: strategy.priority
    }));
  }

  async startPeriodicWarming(interval: number = 300000): Promise<void> {
    if (this.warmingTimer) {
      clearInterval(this.warmingTimer);
    }

    this.warmingTimer = setInterval(async () => {
      if (!this.isWarming) {
        console.log('🔥 Starting periodic cache warming...');
        await this.executeWarming();
      }
    }, interval);

    console.log(`🔥 Periodic cache warming started (interval: ${interval}ms)`);
  }

  stopPeriodicWarming(): void {
    if (this.warmingTimer) {
      clearInterval(this.warmingTimer);
      this.warmingTimer = undefined;
      console.log('🔥 Periodic cache warming stopped');
    }
  }

  isCurrentlyWarming(): boolean {
    return this.isWarming;
  }

  // Cleanup
  cleanup(): void {
    this.stopPeriodicWarming();
    this.strategies.clear();
    this.resetMetrics();
  }
}