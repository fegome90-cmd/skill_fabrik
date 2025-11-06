import { type ActivationWeights } from '../router/src/activation/types.js';
import { type ABTestManager } from './ABTestManager.js';
export interface WeightOptimizationConfig {
    enabled: boolean;
    optimizationStrategy: 'gradient_descent' | 'bayesian' | 'genetic' | 'grid_search';
    learningRate: number;
    maxIterations: number;
    convergenceThreshold: number;
    regularization: {
        enabled: boolean;
        lambda: number;
        minWeight: number;
        maxWeight: number;
    };
    validation: {
        holdoutRatio: number;
        minValidationSamples: number;
        crossValidationFolds: number;
    };
    optimizationGoals: {
        primary: 'activation_accuracy' | 'precision' | 'recall' | 'f1_score' | 'latency' | 'composite';
        secondary?: string[];
        weights: Record<string, number>;
    };
    constraints: {
        preserveOrder: boolean;
        sumToOne: boolean;
        monotonicity: {
            signalName: string;
            direction: 'increasing' | 'decreasing';
        }[];
    };
}
export interface WeightOptimizationResult {
    originalWeights: ActivationWeights;
    optimizedWeights: ActivationWeights;
    improvement: {
        primaryMetric: number;
        secondaryMetrics: Record<string, number>;
        relativeImprovement: number;
    };
    convergence: {
        iterations: number;
        converged: boolean;
        finalLoss: number;
        optimizationPath: number[];
    };
    validation: {
        trainingScore: number;
        validationScore: number;
        overfittingRisk: 'low' | 'medium' | 'high';
    };
    metadata: {
        optimizationTime: number;
        samplesUsed: number;
        algorithm: string;
        timestamp: number;
    };
}
export interface TrainingData {
    inputs: {
        skillName: string;
        prompt: string;
        context: any;
        signals: Record<string, number>;
    }[];
    targets: {
        shouldActivate: boolean;
        actualScore: number;
        success: boolean;
    }[];
}
export declare class WeightOptimizer {
    private readonly config;
    private abTestManager?;
    constructor(config?: Partial<WeightOptimizationConfig>, abTestManager?: ABTestManager);
    optimizeWeights(currentWeights: ActivationWeights, trainingData: TrainingData): Promise<WeightOptimizationResult>;
    private runOptimization;
    private gradientDescentOptimization;
    private bayesianOptimization;
    private geneticOptimization;
    private gridSearchOptimization;
    private calculateGradients;
    private calculateLoss;
    private evaluateWeights;
    private applyConstraints;
    private generateWeightCandidates;
    private initializePopulation;
    private selectParent;
    private crossover;
    private mutate;
    private generateGridPoints;
    private prepareTrainingData;
    private splitData;
    private calculateImprovement;
    private assessOverfittingRisk;
    private createNoOptimizationResult;
    setABTestManager(abTestManager: ABTestManager): void;
    getOptimizationConfig(): WeightOptimizationConfig;
    updateOptimizationConfig(updates: Partial<WeightOptimizationConfig>): void;
    createWeightOptimizationExperiment(skillName: string, currentWeights: ActivationWeights, targetWeights: ActivationWeights, description?: string): Promise<string>;
}
//# sourceMappingURL=WeightOptimizer.d.ts.map