import { type ActivationConfig, type ActivationWeights } from '../router/src/activation/types.js';

export interface ExperimentConfig {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'paused' | 'completed' | 'failed';
  trafficSplit: {
    control: number; // 0..1
    treatment: number; // 0..1
  };
  targetSkills?: string[]; // If empty, applies to all skills
  targetContexts?: string[]; // If empty, applies to all contexts
  startTime?: number; // timestamp
  endTime?: number; // timestamp
  minSampleSize: number;
  confidenceLevel: number; // 0..1 (typically 0.95)
  statisticalPower: number; // 0..1 (typically 0.8)
  variants: {
    control: {
      weights: ActivationWeights;
      description: string;
    };
    treatment: {
      weights: ActivationWeights;
      description: string;
    };
  };
  successMetrics: string[]; // Which metrics to optimize for
  createdAt: number;
  updatedAt: number;
}

export interface ExperimentResult {
  experimentId: string;
  variant: 'control' | 'treatment';
  skillName: string;
  prompt: string;
  activationDecision: {
    activate: boolean;
    finalScore: number;
    signals: Record<string, number>;
    reasoning: string[];
  };
  latency: number;
  timestamp: number;
  userContext?: string;
}

export interface ExperimentSummary {
  experimentId: string;
  name: string;
  status: ExperimentConfig['status'];
  totalSamples: number;
  controlSamples: number;
  treatmentSamples: number;
  controlMetrics: {
    activationRate: number;
    averageScore: number;
    averageLatency: number;
    successRate: number;
  };
  treatmentMetrics: {
    activationRate: number;
    averageScore: number;
    averageLatency: number;
    successRate: number;
  };
  statisticalSignificance: {
    pValue: number;
    isSignificant: boolean;
    confidenceInterval: [number, number];
    effect: 'positive' | 'negative' | 'neutral';
    lift: number; // percentage
  };
  recommendation: 'continue' | 'rollout' | 'rollback' | 'inconclusive';
  summary: string;
  generatedAt: number;
}

export interface ABTestConfig {
  enabled: boolean;
  storageMode: 'memory' | 'file' | 'database';
  storagePath?: string;
  autoCleanup: boolean;
  retentionPeriod: number; // ms
  defaultTrafficSplit: { control: number; treatment: number };
  maxConcurrentExperiments: number;
  enableRealtimeAnalysis: boolean;
}

export class ABTestManager {
  private readonly config: ABTestConfig;
  private experiments: Map<string, ExperimentConfig> = new Map();
  private results: ExperimentResult[] = [];
  private userAssignments: Map<string, Map<string, 'control' | 'treatment'>> = new Map();

  constructor(config?: Partial<ABTestConfig>) {
    this.config = {
      enabled: true,
      storageMode: 'memory',
      autoCleanup: true,
      retentionPeriod: 30 * 24 * 60 * 60 * 1000, // 30 days
      defaultTrafficSplit: { control: 0.5, treatment: 0.5 },
      maxConcurrentExperiments: 10,
      enableRealtimeAnalysis: false,
      ...config
    };
  }

  // Experiment Management

  createExperiment(config: Omit<ExperimentConfig, 'id' | 'createdAt' | 'updatedAt' | 'status'>): string {
    const experimentId = this.generateExperimentId();
    const now = Date.now();

    const experiment: ExperimentConfig = {
      ...config,
      id: experimentId,
      status: 'draft',
      createdAt: now,
      updatedAt: now
    };

    this.experiments.set(experimentId, experiment);
    return experimentId;
  }

  updateExperiment(experimentId: string, updates: Partial<Omit<ExperimentConfig, 'id' | 'createdAt'>>): boolean {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return false;

    this.experiments.set(experimentId, {
      ...experiment,
      ...updates,
      updatedAt: Date.now()
    });

    return true;
  }

  startExperiment(experimentId: string): boolean {
    const experiment = this.experiments.get(experimentId);
    if (!experiment || experiment.status !== 'draft') return false;

    if (this.getActiveExperiments().length >= this.config.maxConcurrentExperiments) {
      throw new Error(`Maximum concurrent experiments (${this.config.maxConcurrentExperiments}) reached`);
    }

    return this.updateExperiment(experimentId, {
      status: 'running',
      startTime: Date.now()
    });
  }

  pauseExperiment(experimentId: string): boolean {
    const experiment = this.experiments.get(experimentId);
    if (!experiment || experiment.status !== 'running') return false;

    return this.updateExperiment(experimentId, {
      status: 'paused'
    });
  }

  resumeExperiment(experimentId: string): boolean {
    const experiment = this.experiments.get(experimentId);
    if (!experiment || experiment.status !== 'paused') return false;

    return this.updateExperiment(experimentId, {
      status: 'running'
    });
  }

  completeExperiment(experimentId: string): boolean {
    const experiment = this.experiments.get(experimentId);
    if (!experiment || !['running', 'paused'].includes(experiment.status)) return false;

    return this.updateExperiment(experimentId, {
      status: 'completed',
      endTime: Date.now()
    });
  }

  deleteExperiment(experimentId: string): boolean {
    // Remove experiment and all associated results
    const deleted = this.experiments.delete(experimentId);
    if (deleted) {
      this.results = this.results.filter(r => r.experimentId !== experimentId);
    }
    return deleted;
  }

  // User Assignment and Variant Selection

  assignVariant(experimentId: string, userId: string, context?: any): 'control' | 'treatment' | null {
    const experiment = this.experiments.get(experimentId);
    if (!experiment || experiment.status !== 'running') return null;

    // Check if user is already assigned
    const userAssignments = this.userAssignments.get(experimentId) || new Map();
    const existingAssignment = userAssignments.get(userId);
    if (existingAssignment) {
      return existingAssignment;
    }

    // Check if experiment applies to this context
    if (experiment.targetSkills && context?.skillName) {
      if (!experiment.targetSkills.includes(context.skillName)) {
        return null;
      }
    }

    // Assign variant based on traffic split
    const variant = this.selectVariant(experiment.trafficSplit);
    userAssignments.set(userId, variant);
    this.userAssignments.set(experimentId, userAssignments);

    return variant;
  }

  private selectVariant(trafficSplit: { control: number; treatment: number }): 'control' | 'treatment' {
    const random = Math.random();
    return random < trafficSplit.control ? 'control' : 'treatment';
  }

  // Result Recording and Analysis

  recordResult(result: Omit<ExperimentResult, 'timestamp'>): void {
    const fullResult: ExperimentResult = {
      ...result,
      timestamp: Date.now()
    };

    this.results.push(fullResult);
    this.maintainResultsSize();

    if (this.config.enableRealtimeAnalysis) {
      this.performRealtimeAnalysis(result.experimentId);
    }
  }

  private maintainResultsSize(): void {
    if (this.config.autoCleanup) {
      const cutoff = Date.now() - this.config.retentionPeriod;
      this.results = this.results.filter(r => r.timestamp >= cutoff);
    }
  }

  getExperimentSummary(experimentId: string): ExperimentSummary | null {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return null;

    const experimentResults = this.results.filter(r => r.experimentId === experimentId);
    const controlResults = experimentResults.filter(r => r.variant === 'control');
    const treatmentResults = experimentResults.filter(r => r.variant === 'treatment');

    if (experimentResults.length === 0) {
      return this.createEmptySummary(experiment);
    }

    const controlMetrics = this.calculateMetrics(controlResults);
    const treatmentMetrics = this.calculateMetrics(treatmentResults);
    const statisticalSignificance = this.calculateStatisticalSignificance(
      controlResults,
      treatmentResults,
      experiment.confidenceLevel
    );

    const recommendation = this.generateRecommendation(
      controlMetrics,
      treatmentMetrics,
      statisticalSignificance,
      experiment
    );

    return {
      experimentId,
      name: experiment.name,
      status: experiment.status,
      totalSamples: experimentResults.length,
      controlSamples: controlResults.length,
      treatmentSamples: treatmentResults.length,
      controlMetrics,
      treatmentMetrics,
      statisticalSignificance,
      recommendation,
      summary: this.generateSummary(controlMetrics, treatmentMetrics, statisticalSignificance, recommendation),
      generatedAt: Date.now()
    };
  }

  private calculateMetrics(results: ExperimentResult[]): {
    activationRate: number;
    averageScore: number;
    averageLatency: number;
    successRate: number;
  } {
    if (results.length === 0) {
      return { activationRate: 0, averageScore: 0, averageLatency: 0, successRate: 0 };
    }

    const activations = results.filter(r => r.activationDecision.activate);
    const activationRate = activations.length / results.length;
    const averageScore = results.reduce((sum, r) => sum + r.activationDecision.finalScore, 0) / results.length;
    const averageLatency = results.reduce((sum, r) => sum + r.latency, 0) / results.length;
    const successRate = 1; // Assuming all recorded results are successful for now

    return {
      activationRate,
      averageScore,
      averageLatency,
      successRate
    };
  }

  private calculateStatisticalSignificance(
    controlResults: ExperimentResult[],
    treatmentResults: ExperimentResult[],
    confidenceLevel: number
  ): ExperimentSummary['statisticalSignificance'] {
    if (controlResults.length < 30 || treatmentResults.length < 30) {
      return {
        pValue: 1,
        isSignificant: false,
        confidenceInterval: [0, 0],
        effect: 'neutral',
        lift: 0
      };
    }

    // Calculate activation rates
    const controlRate = controlResults.filter(r => r.activationDecision.activate).length / controlResults.length;
    const treatmentRate = treatmentResults.filter(r => r.activationDecision.activate).length / treatmentResults.length;

    // Perform two-proportion z-test
    const n1 = controlResults.length;
    const n2 = treatmentResults.length;
    const p1 = controlRate;
    const p2 = treatmentRate;
    const pooledP = (p1 * n1 + p2 * n2) / (n1 + n2);
    const standardError = Math.sqrt(pooledP * (1 - pooledP) * (1/n1 + 1/n2));
    const zScore = (p2 - p1) / standardError;

    // Calculate p-value (two-tailed test)
    const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)));

    // Calculate confidence interval
    const zCritical = this.normalQuantile(1 - (1 - confidenceLevel) / 2);
    const marginOfError = zCritical * standardError;
    const difference = p2 - p1;
    const confidenceInterval: [number, number] = [
      difference - marginOfError,
      difference + marginOfError
    ];

    const isSignificant = pValue < (1 - confidenceLevel);
    const lift = n1 > 0 ? ((p2 - p1) / p1) * 100 : 0;

    let effect: 'positive' | 'negative' | 'neutral';
    if (lift > 1) effect = 'positive';
    else if (lift < -1) effect = 'negative';
    else effect = 'neutral';

    return {
      pValue,
      isSignificant,
      confidenceInterval,
      effect,
      lift
    };
  }

  private normalCDF(x: number): number {
    // Approximation of normal CDF
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.sqrt(2);

    const t = 1 / (1 + p * x);
    const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return 0.5 * (1 + sign * y);
  }

  private normalQuantile(p: number): number {
    // Approximation of normal quantile function
    const a1 = -3.969683028665376e+01;
    const a2 = 2.209460984245205e+02;
    const a3 = -2.759285104469687e+02;
    const a4 = 1.383577518672690e+02;
    const a5 = -3.066479806614716e+01;
    const a6 = 2.506628277459239e+00;

    const b1 = -5.447609879822406e+01;
    const b2 = 1.615858368580409e+02;
    const b3 = -1.556989798598866e+02;
    const b4 = 6.680131188771972e+01;
    const b5 = -1.328068155288572e+01;

    const c1 = -7.784894002430293e-03;
    const c2 = -3.223964580411365e-01;
    const c3 = -2.400758277161838e+00;
    const c4 = -2.549732539343734e+00;
    const c5 = 4.374664141464968e+00;
    const c6 = 2.938163982698783e+00;

    const d1 = 7.784695709041462e-03;
    const d2 = 3.224671290700398e-01;
    const d3 = 2.445134137142996e+00;
    const d4 = 3.754408661907416e+00;

    const pLow = 0.02425;
    const pHigh = 1 - pLow;
    let q, r;

    if (p < pLow) {
      q = Math.sqrt(-2 * Math.log(p));
      r = (((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) / ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
    } else if (p <= pHigh) {
      q = p - 0.5;
      r = q * q;
      r = (((((a1 * r + a2) * r + a3) * r + a4) * r + a5) * r + a6) * q / (((((b1 * r + b2) * r + b3) * r + b4) * r + b5) * r + 1);
    } else {
      q = Math.sqrt(-2 * Math.log(1 - p));
      r = -(((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) / ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
    }

    return r;
  }

  private generateRecommendation(
    controlMetrics: ExperimentSummary['controlMetrics'],
    treatmentMetrics: ExperimentSummary['treatmentMetrics'],
    statisticalSignificance: ExperimentSummary['statisticalSignificance'],
    experiment: ExperimentConfig
  ): ExperimentSummary['recommendation'] {
    const minSamplesReached = Math.min(
      controlMetrics.activationRate > 0 ? 100 : 0,
      treatmentMetrics.activationRate > 0 ? 100 : 0
    ) >= experiment.minSampleSize;

    if (!minSamplesReached) {
      return 'continue';
    }

    if (!statisticalSignificance.isSignificant) {
      return 'inconclusive';
    }

    if (statisticalSignificance.effect === 'positive' && statisticalSignificance.lift > 5) {
      return 'rollout';
    } else if (statisticalSignificance.effect === 'negative' && statisticalSignificance.lift < -5) {
      return 'rollback';
    } else {
      return 'inconclusive';
    }
  }

  private generateSummary(
    controlMetrics: ExperimentSummary['controlMetrics'],
    treatmentMetrics: ExperimentSummary['treatmentMetrics'],
    statisticalSignificance: ExperimentSummary['statisticalSignificance'],
    recommendation: ExperimentSummary['recommendation']
  ): string {
    const liftText = statisticalSignificance.lift > 0 ? `+${statisticalSignificance.lift.toFixed(1)}%` : `${statisticalSignificance.lift.toFixed(1)}%`;
    const significanceText = statisticalSignificance.isSignificant ? 'statistically significant' : 'not statistically significant';

    return `Treatment variant shows ${statisticalSignificance.effect} effect with ${liftText} lift. Results are ${significanceText} (p=${statisticalSignificance.pValue.toFixed(3)}). Recommendation: ${recommendation}.`;
  }

  private createEmptySummary(experiment: ExperimentConfig): ExperimentSummary {
    return {
      experimentId: experiment.id,
      name: experiment.name,
      status: experiment.status,
      totalSamples: 0,
      controlSamples: 0,
      treatmentSamples: 0,
      controlMetrics: { activationRate: 0, averageScore: 0, averageLatency: 0, successRate: 0 },
      treatmentMetrics: { activationRate: 0, averageScore: 0, averageLatency: 0, successRate: 0 },
      statisticalSignificance: {
        pValue: 1,
        isSignificant: false,
        confidenceInterval: [0, 0],
        effect: 'neutral',
        lift: 0
      },
      recommendation: 'continue',
      summary: 'No data available yet.',
      generatedAt: Date.now()
    };
  }

  private performRealtimeAnalysis(experimentId: string): void {
    // This could trigger automatic actions based on results
    // For now, it's a placeholder for future enhancement
    const summary = this.getExperimentSummary(experimentId);
    if (summary && summary.recommendation === 'rollback') {
      console.warn(`Experiment ${experimentId} shows negative results. Consider rolling back.`);
    }
  }

  // Utility Methods

  getExperiment(experimentId: string): ExperimentConfig | undefined {
    return this.experiments.get(experimentId);
  }

  getActiveExperiments(): ExperimentConfig[] {
    return Array.from(this.experiments.values()).filter(e => e.status === 'running');
  }

  getAllExperiments(): ExperimentConfig[] {
    return Array.from(this.experiments.values());
  }

  getResults(experimentId: string): ExperimentResult[] {
    return this.results.filter(r => r.experimentId === experimentId);
  }

  private generateExperimentId(): string {
    return `exp_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }

  // Export and Import

  exportData(): {
    experiments: Record<string, ExperimentConfig>;
    results: ExperimentResult[];
    userAssignments: Record<string, Record<string, 'control' | 'treatment'>>;
    exportedAt: string;
  } {
    const experiments: Record<string, ExperimentConfig> = {};
    this.experiments.forEach((exp, id) => { experiments[id] = exp; });

    const userAssignments: Record<string, Record<string, 'control' | 'treatment'>> = {};
    this.userAssignments.forEach((assignments, expId) => {
      userAssignments[expId] = Object.fromEntries(assignments);
    });

    return {
      experiments,
      results: [...this.results],
      userAssignments,
      exportedAt: new Date().toISOString()
    };
  }

  importData(data: {
    experiments: Record<string, ExperimentConfig>;
    results: ExperimentResult[];
    userAssignments?: Record<string, Record<string, 'control' | 'treatment'>>;
  }): void {
    // Clear existing data
    this.experiments.clear();
    this.results = [];
    this.userAssignments.clear();

    // Import experiments
    Object.entries(data.experiments).forEach(([id, config]) => {
      this.experiments.set(id, config);
    });

    // Import results
    this.results = [...data.results];

    // Import user assignments
    if (data.userAssignments) {
      Object.entries(data.userAssignments).forEach(([expId, assignments]) => {
        const assignmentMap = new Map(Object.entries(assignments));
        this.userAssignments.set(expId, assignmentMap);
      });
    }
  }

  // Cleanup

  cleanup(): void {
    if (this.config.autoCleanup) {
      const cutoff = Date.now() - this.config.retentionPeriod;

      // Clean up old experiments
      for (const [id, experiment] of this.experiments.entries()) {
        if (experiment.status === 'completed' && experiment.endTime && experiment.endTime < cutoff) {
          this.deleteExperiment(id);
        }
      }

      // Clean up old results
      this.maintainResultsSize();
    }
  }
}