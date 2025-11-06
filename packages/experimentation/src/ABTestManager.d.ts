import { type ActivationWeights } from '../router/src/activation/types.js';
export interface ExperimentConfig {
    id: string;
    name: string;
    description: string;
    status: 'draft' | 'running' | 'paused' | 'completed' | 'failed';
    trafficSplit: {
        control: number;
        treatment: number;
    };
    targetSkills?: string[];
    targetContexts?: string[];
    startTime?: number;
    endTime?: number;
    minSampleSize: number;
    confidenceLevel: number;
    statisticalPower: number;
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
    successMetrics: string[];
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
        lift: number;
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
    retentionPeriod: number;
    defaultTrafficSplit: {
        control: number;
        treatment: number;
    };
    maxConcurrentExperiments: number;
    enableRealtimeAnalysis: boolean;
}
export declare class ABTestManager {
    private readonly config;
    private experiments;
    private results;
    private userAssignments;
    constructor(config?: Partial<ABTestConfig>);
    createExperiment(config: Omit<ExperimentConfig, 'id' | 'createdAt' | 'updatedAt' | 'status'>): string;
    updateExperiment(experimentId: string, updates: Partial<Omit<ExperimentConfig, 'id' | 'createdAt'>>): boolean;
    startExperiment(experimentId: string): boolean;
    pauseExperiment(experimentId: string): boolean;
    resumeExperiment(experimentId: string): boolean;
    completeExperiment(experimentId: string): boolean;
    deleteExperiment(experimentId: string): boolean;
    assignVariant(experimentId: string, userId: string, context?: any): 'control' | 'treatment' | null;
    private selectVariant;
    recordResult(result: Omit<ExperimentResult, 'timestamp'>): void;
    private maintainResultsSize;
    getExperimentSummary(experimentId: string): ExperimentSummary | null;
    private calculateMetrics;
    private calculateStatisticalSignificance;
    private normalCDF;
    private normalQuantile;
    private generateRecommendation;
    private generateSummary;
    private createEmptySummary;
    private performRealtimeAnalysis;
    getExperiment(experimentId: string): ExperimentConfig | undefined;
    getActiveExperiments(): ExperimentConfig[];
    getAllExperiments(): ExperimentConfig[];
    getResults(experimentId: string): ExperimentResult[];
    private generateExperimentId;
    exportData(): {
        experiments: Record<string, ExperimentConfig>;
        results: ExperimentResult[];
        userAssignments: Record<string, Record<string, 'control' | 'treatment'>>;
        exportedAt: string;
    };
    importData(data: {
        experiments: Record<string, ExperimentConfig>;
        results: ExperimentResult[];
        userAssignments?: Record<string, Record<string, 'control' | 'treatment'>>;
    }): void;
    cleanup(): void;
}
//# sourceMappingURL=ABTestManager.d.ts.map