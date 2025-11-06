import { type ActivationConfig, type ActivationContext, type ActivationDecision, type ActivationSignals, type Signal } from './types.js';
import { type ActivationLogger } from './provider.js';
import { SignalOptimizer, type OptimizationConfig } from './optimization/SignalOptimizer.js';
import { PerformanceMonitor, type MonitoringConfig } from './monitoring/PerformanceMonitor.js';

export class ActivationEngine {
  private readonly signals: Signal[];
  private readonly config: ActivationConfig;
  private readonly logger?: ActivationLogger;
  private readonly optimizer: SignalOptimizer;
  private readonly monitor: PerformanceMonitor;

  constructor(
    signals: Signal[],
    config: ActivationConfig,
    options?: {
      logger?: ActivationLogger;
      optimization?: Partial<OptimizationConfig>;
      monitoring?: Partial<MonitoringConfig>;
    }
  ) {
    this.signals = signals;
    this.config = config;
    this.logger = options?.logger;
    this.optimizer = new SignalOptimizer(options?.optimization);
    this.monitor = new PerformanceMonitor(options?.monitoring);
  }

  async evaluate(skillName: string, prompt: string, context: ActivationContext): Promise<ActivationDecision> {
    // Use optimized signal evaluation
    const { scores: signalScores, totalLatency } = await this.optimizer.evaluateSignalsOptimized(
      this.signals,
      { skillName, prompt, context },
      this.config.weights
    );

    // Clamp all scores to 0-1 range
    const clampedScores: Record<string, number> = {};
    for (const [name, score] of Object.entries(signalScores)) {
      clampedScores[name] = clamp01(score);
    }

    const weighted = this.calculateWeightedScore(clampedScores);

    if (matchesAny(prompt, this.config.denyList)) {
      const d = this.makeDecision(false, clampedScores, weighted, 'denyList', totalLatency);
      await this.log(skillName, prompt, d);
      return d;
    }
    if (matchesAny(prompt, this.config.allowList)) {
      const d = this.makeDecision(true, clampedScores, weighted, 'allowList', totalLatency);
      await this.log(skillName, prompt, d);
      return d;
    }

    const shouldActivate = weighted >= this.config.threshold;
    const decision = this.makeDecision(shouldActivate, clampedScores, weighted, 'threshold', totalLatency);

    // Record the activation evaluation for monitoring
    this.monitor.recordActivationEvaluation(
      { skillName, prompt, context },
      clampedScores,
      totalLatency,
      decision,
      true // optimization was used
    );

    await this.log(skillName, prompt, decision);
    return decision;
  }

  private calculateWeightedScore(scores: Record<string, number>): number {
    const weights = this.config.weights;
    let total = 0;
    let weightSum = 0;
    for (const [name, score] of Object.entries(scores)) {
      const w = weights[name] ?? 0;
      total += score * w;
      weightSum += Math.abs(w);
    }
    return weightSum > 0 ? clamp01(total) : 0;
  }

  private async log(skillName: string, prompt: string, decision: ActivationDecision): Promise<void> {
    if (!this.logger) return;
    try {
      await this.logger.logActivation({
        skillName,
        prompt,
        decision,
        timestamp: new Date().toISOString(),
      });
    } catch {
      // swallow logging errors
    }
  }

  private makeDecision(
    activate: boolean,
    signals: ActivationSignals,
    finalScore: number,
    reason: 'allowList' | 'denyList' | 'threshold',
    evaluationLatency?: number
  ): ActivationDecision {
    const explanation: string[] = [];
    const strong = Object.entries(signals).filter(([, s]) => s > 0.7).map(([n]) => n);
    const weak = Object.entries(signals).filter(([, s]) => s < 0.3).map(([n]) => n);

    if (strong.length) explanation.push(`Strong signals: ${strong.join(', ')}`);
    if (weak.length) explanation.push(`Weak signals: ${weak.join(', ')}`);
    explanation.push(`Final score: ${(finalScore * 100).toFixed(1)}% (threshold: ${(this.config.threshold * 100).toFixed(0)}%)`);

    if (evaluationLatency) {
      explanation.push(`Evaluation latency: ${evaluationLatency}ms`);
    }

    explanation.push(activate ? '✅ ACTIVATE' : '❌ DO NOT ACTIVATE');
    return { activate, finalScore, signals, reasoning: explanation, reason };
  }

  // Public methods for optimization management

  getPerformanceStats() {
    return this.optimizer.getPerformanceStats();
  }

  getOptimizationRecommendations(): string[] {
    return this.optimizer.getOptimizationRecommendations();
  }

  updateSignalCost(signalName: string, cost: { estimatedLatency?: number; memoryUsage?: number; cacheHitRate?: number; complexity?: 'low' | 'medium' | 'high' }): void {
    this.optimizer.updateSignalCost(signalName, cost);
  }

  resetOptimization(): void {
    this.optimizer.resetToDefaults();
  }

  // Performance monitoring methods

  getPerformanceMetrics() {
    return this.monitor.getPerformanceMetrics();
  }

  getSignalMetrics(signalName: string) {
    return this.monitor.getSignalMetrics(signalName);
  }

  getRecentEvaluations(limit?: number) {
    return this.monitor.getRecentEvaluations(limit);
  }

  getEvaluationSummary(skillName?: string, timeWindow?: number) {
    return this.monitor.getEvaluationSummary(skillName, timeWindow);
  }

  exportPerformanceData() {
    return {
      optimization: this.optimizer.exportPerformanceData(),
      monitoring: this.monitor.exportMetrics()
    };
  }

  clearPerformanceHistory(signalName?: string): void {
    this.monitor.clearHistory();
    this.optimizer.clearPerformanceHistory(signalName);
  }

  stopMonitoring(): void {
    this.monitor.stop();
  }

  restartMonitoring(): void {
    this.monitor.restart();
  }
}

function matchesAny(text: string, patterns: string[] = []): boolean {
  return patterns.some((p) => new RegExp(p, 'i').test(text));
}

function clamp01(n: number): number {
  if (Number.isNaN(n) || !Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}


