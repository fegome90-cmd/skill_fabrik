import { type ActivationWeights } from '../router/src/activation/types.js';
import { type ABTestManager, type ExperimentSummary, type ExperimentResult } from './ABTestManager.js';

export interface WeightOptimizationConfig {
  enabled: boolean;
  optimizationStrategy: 'gradient_descent' | 'bayesian' | 'genetic' | 'grid_search';
  learningRate: number;
  maxIterations: number;
  convergenceThreshold: number;
  regularization: {
    enabled: boolean;
    lambda: number; // L2 regularization parameter
    minWeight: number;
    maxWeight: number;
  };
  validation: {
    holdoutRatio: number; // 0..1, ratio of data to hold out for validation
    minValidationSamples: number;
    crossValidationFolds: number;
  };
  optimizationGoals: {
    primary: 'activation_accuracy' | 'precision' | 'recall' | 'f1_score' | 'latency' | 'composite';
    secondary?: string[];
    weights: Record<string, number>; // relative importance of each goal
  };
  constraints: {
    preserveOrder: boolean; // maintain relative importance of signals
    sumToOne: boolean; // ensure weights sum to 1
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
    relativeImprovement: number; // percentage
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
    optimizationTime: number; // ms
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

export class WeightOptimizer {
  private readonly config: WeightOptimizationConfig;
  private abTestManager?: ABTestManager;

  constructor(
    config?: Partial<WeightOptimizationConfig>,
    abTestManager?: ABTestManager
  ) {
    this.config = {
      enabled: true,
      optimizationStrategy: 'gradient_descent',
      learningRate: 0.01,
      maxIterations: 1000,
      convergenceThreshold: 1e-6,
      regularization: {
        enabled: true,
        lambda: 0.01,
        minWeight: 0,
        maxWeight: 1
      },
      validation: {
        holdoutRatio: 0.2,
        minValidationSamples: 50,
        crossValidationFolds: 5
      },
      optimizationGoals: {
        primary: 'activation_accuracy',
        weights: {
          activation_accuracy: 0.6,
          precision: 0.2,
          recall: 0.1,
          latency: 0.1
        }
      },
      constraints: {
        preserveOrder: false,
        sumToOne: true,
        monotonicity: []
      },
      ...config
    };

    this.abTestManager = abTestManager;
  }

  // Main optimization method
  async optimizeWeights(
    currentWeights: ActivationWeights,
    trainingData: TrainingData
  ): Promise<WeightOptimizationResult> {
    if (!this.config.enabled) {
      return this.createNoOptimizationResult(currentWeights);
    }

    const startTime = Date.now();

    // Validate and prepare data
    const preparedData = this.prepareTrainingData(trainingData);
    if (preparedData.inputs.length < this.config.validation.minValidationSamples) {
      throw new Error(`Insufficient training data. Need at least ${this.config.validation.minValidationSamples} samples, got ${preparedData.inputs.length}`);
    }

    // Split data for validation
    const { trainingSet, validationSet } = this.splitData(preparedData);

    // Run optimization based on strategy
    const optimizationResult = await this.runOptimization(currentWeights, trainingSet, validationSet);

    // Post-process results
    const finalWeights = this.applyConstraints(optimizationResult.weights);
    const validationScore = this.evaluateWeights(finalWeights, validationSet);

    return {
      originalWeights: { ...currentWeights },
      optimizedWeights: finalWeights,
      improvement: this.calculateImprovement(currentWeights, finalWeights, trainingSet, validationSet),
      convergence: optimizationResult.convergence,
      validation: {
        trainingScore: optimizationResult.finalScore,
        validationScore,
        overfittingRisk: this.assessOverfittingRisk(optimizationResult.finalScore, validationScore)
      },
      metadata: {
        optimizationTime: Date.now() - startTime,
        samplesUsed: preparedData.inputs.length,
        algorithm: this.config.optimizationStrategy,
        timestamp: Date.now()
      }
    };
  }

  // Optimization strategies
  private async runOptimization(
    initialWeights: ActivationWeights,
    trainingSet: TrainingData,
    validationSet: TrainingData
  ): Promise<{
    weights: ActivationWeights;
    finalScore: number;
    convergence: WeightOptimizationResult['convergence'];
  }> {
    switch (this.config.optimizationStrategy) {
      case 'gradient_descent':
        return this.gradientDescentOptimization(initialWeights, trainingSet);
      case 'bayesian':
        return this.bayesianOptimization(initialWeights, trainingSet);
      case 'genetic':
        return this.geneticOptimization(initialWeights, trainingSet);
      case 'grid_search':
        return this.gridSearchOptimization(initialWeights, trainingSet);
      default:
        throw new Error(`Unsupported optimization strategy: ${this.config.optimizationStrategy}`);
    }
  }

  private gradientDescentOptimization(
    initialWeights: ActivationWeights,
    trainingSet: TrainingData
  ): {
    weights: ActivationWeights;
    finalScore: number;
    convergence: WeightOptimizationResult['convergence'];
  } {
    let weights = { ...initialWeights };
    const optimizationPath: number[] = [];
    let previousLoss = Infinity;

    for (let iteration = 0; iteration < this.config.maxIterations; iteration++) {
      // Calculate gradients
      const gradients = this.calculateGradients(weights, trainingSet);

      // Update weights
      for (const [signalName, gradient] of Object.entries(gradients)) {
        weights[signalName] = weights[signalName] - this.config.learningRate * gradient;
      }

      // Apply constraints
      weights = this.applyConstraints(weights);

      // Calculate loss
      const currentLoss = this.calculateLoss(weights, trainingSet);
      optimizationPath.push(currentLoss);

      // Check convergence
      const lossImprovement = Math.abs(previousLoss - currentLoss);
      if (lossImprovement < this.config.convergenceThreshold) {
        return {
          weights,
          finalScore: this.evaluateWeights(weights, trainingSet),
          convergence: {
            iterations: iteration + 1,
            converged: true,
            finalLoss: currentLoss,
            optimizationPath
          }
        };
      }

      previousLoss = currentLoss;
    }

    return {
      weights,
      finalScore: this.evaluateWeights(weights, trainingSet),
      convergence: {
        iterations: this.config.maxIterations,
        converged: false,
        finalLoss: previousLoss,
        optimizationPath
      }
    };
  }

  private bayesianOptimization(
    initialWeights: ActivationWeights,
    trainingSet: TrainingData
  ): {
    weights: ActivationWeights;
    finalScore: number;
    convergence: WeightOptimizationResult['convergence'];
  } {
    // Simplified Bayesian optimization using random sampling with probabilistic model
    // In a real implementation, this would use Gaussian Processes or similar
    const candidates = this.generateWeightCandidates(initialWeights, 50);
    let bestWeights = initialWeights;
    let bestScore = this.evaluateWeights(initialWeights, trainingSet);
    const optimizationPath: number[] = [bestScore];

    for (const candidate of candidates) {
      const score = this.evaluateWeights(candidate, trainingSet);
      optimizationPath.push(score);

      if (score > bestScore) {
        bestWeights = candidate;
        bestScore = score;
      }
    }

    return {
      weights: bestWeights,
      finalScore: bestScore,
      convergence: {
        iterations: candidates.length,
        converged: true,
        finalLoss: -bestScore, // Convert to loss (negative score)
        optimizationPath
      }
    };
  }

  private geneticOptimization(
    initialWeights: ActivationWeights,
    trainingSet: TrainingData
  ): {
    weights: ActivationWeights;
    finalScore: number;
    convergence: WeightOptimizationResult['convergence'];
  } {
    const populationSize = 20;
    const generations = 50;
    const mutationRate = 0.1;
    const elitismRate = 0.2;

    // Initialize population
    let population = this.initializePopulation(initialWeights, populationSize);
    const optimizationPath: number[] = [];

    for (let generation = 0; generation < generations; generation++) {
      // Evaluate fitness
      const fitnessScores = population.map(weights => ({
        weights,
        fitness: this.evaluateWeights(weights, trainingSet)
      }));

      // Sort by fitness
      fitnessScores.sort((a, b) => b.fitness - a.fitness);

      // Record best fitness
      optimizationPath.push(fitnessScores[0].fitness);

      // Selection and reproduction
      const elites = fitnessScores.slice(0, Math.floor(populationSize * elitismRate));
      const newPopulation = elites.map(individual => individual.weights);

      // Fill rest of population
      while (newPopulation.length < populationSize) {
        const parent1 = this.selectParent(fitnessScores);
        const parent2 = this.selectParent(fitnessScores);
        const child = this.crossover(parent1.weights, parent2.weights);
        const mutatedChild = this.mutate(child, mutationRate);
        newPopulation.push(this.applyConstraints(mutatedChild));
      }

      population = newPopulation;
    }

    const finalWeights = population[0];
    const finalScore = this.evaluateWeights(finalWeights, trainingSet);

    return {
      weights: finalWeights,
      finalScore,
      convergence: {
        iterations: generations,
        converged: true,
        finalLoss: -finalScore,
        optimizationPath
      }
    };
  }

  private gridSearchOptimization(
    initialWeights: ActivationWeights,
    trainingSet: TrainingData
  ): {
    weights: ActivationWeights;
    finalScore: number;
    convergence: WeightOptimizationResult['convergence'];
  } {
    const stepSize = 0.1;
    const signalNames = Object.keys(initialWeights);
    const optimizationPath: number[] = [];

    let bestWeights = initialWeights;
    let bestScore = this.evaluateWeights(initialWeights, trainingSet);
    optimizationPath.push(bestScore);

    // Generate grid points around initial weights
    const gridPoints = this.generateGridPoints(initialWeights, stepSize, 3); // 3 points per dimension

    for (const point of gridPoints) {
      const score = this.evaluateWeights(point, trainingSet);
      optimizationPath.push(score);

      if (score > bestScore) {
        bestWeights = point;
        bestScore = score;
      }
    }

    return {
      weights: bestWeights,
      finalScore: bestScore,
      convergence: {
        iterations: gridPoints.length,
        converged: true,
        finalLoss: -bestScore,
        optimizationPath
      }
    };
  }

  // Helper methods for optimization

  private calculateGradients(weights: ActivationWeights, trainingSet: TrainingData): Record<string, number> {
    const gradients: Record<string, number> = {};
    const epsilon = 1e-5;
    const baseScore = this.evaluateWeights(weights, trainingSet);

    for (const signalName of Object.keys(weights)) {
      const perturbedWeights = { ...weights };
      perturbedWeights[signalName] += epsilon;
      const perturbedScore = this.evaluateWeights(perturbedWeights, trainingSet);
      gradients[signalName] = (perturbedScore - baseScore) / epsilon;
    }

    return gradients;
  }

  private calculateLoss(weights: ActivationWeights, trainingSet: TrainingData): number {
    const score = this.evaluateWeights(weights, trainingSet);
    let loss = -score; // Convert score to loss (minimize negative score)

    // Add regularization
    if (this.config.regularization.enabled) {
      const l2Penalty = Object.values(weights).reduce((sum, weight) => sum + weight * weight, 0);
      loss += this.config.regularization.lambda * l2Penalty;
    }

    return loss;
  }

  private evaluateWeights(weights: ActivationWeights, data: TrainingData): number {
    let totalScore = 0;
    let correctPredictions = 0;

    for (let i = 0; i < data.inputs.length; i++) {
      const input = data.inputs[i];
      const target = data.targets[i];

      // Calculate weighted score
      let weightedSum = 0;
      let weightSum = 0;

      for (const [signalName, signalValue] of Object.entries(input.signals)) {
        const weight = weights[signalName] || 0;
        weightedSum += signalValue * weight;
        weightSum += Math.abs(weight);
      }

      const predictedScore = weightSum > 0 ? weightedSum / weightSum : 0;
      const predictedActivation = predictedScore >= 0.5; // Default threshold

      // Calculate score based on optimization goal
      let sampleScore = 0;
      switch (this.config.optimizationGoals.primary) {
        case 'activation_accuracy':
          sampleScore = predictedActivation === target.shouldActivate ? 1 : 0;
          break;
        case 'precision':
          sampleScore = predictedActivation && target.shouldActivate ? 1 : 0;
          break;
        case 'recall':
          sampleScore = target.shouldActivate ? (predictedActivation ? 1 : 0) : 1;
          break;
        default:
          sampleScore = 1 - Math.abs(predictedScore - target.actualScore);
      }

      totalScore += sampleScore;
      if (predictedActivation === target.shouldActivate) {
        correctPredictions++;
      }
    }

    return totalScore / data.inputs.length;
  }

  private applyConstraints(weights: ActivationWeights): ActivationWeights {
    const constrained = { ...weights };

    // Apply min/max constraints
    for (const [signalName, weight] of Object.entries(constrained)) {
      constrained[signalName] = Math.max(
        this.config.regularization.minWeight,
        Math.min(this.config.regularization.maxWeight, weight)
      );
    }

    // Apply sum-to-one constraint
    if (this.config.constraints.sumToOne) {
      const totalWeight = Object.values(constrained).reduce((sum, weight) => sum + Math.abs(weight), 0);
      if (totalWeight > 0) {
        for (const signalName of Object.keys(constrained)) {
          constrained[signalName] = constrained[signalName] / totalWeight;
        }
      }
    }

    return constrained;
  }

  private generateWeightCandidates(baseWeights: ActivationWeights, count: number): ActivationWeights[] {
    const candidates: ActivationWeights[] = [];
    const signalNames = Object.keys(baseWeights);

    for (let i = 0; i < count; i++) {
      const candidate: ActivationWeights = {};
      for (const signalName of signalNames) {
        // Random perturbation around base weight
        const perturbation = (Math.random() - 0.5) * 0.2; // ±10% perturbation
        candidate[signalName] = Math.max(0, Math.min(1, baseWeights[signalName] + perturbation));
      }
      candidates.push(this.applyConstraints(candidate));
    }

    return candidates;
  }

  private initializePopulation(baseWeights: ActivationWeights, size: number): ActivationWeights[] {
    const population: ActivationWeights[] = [];

    for (let i = 0; i < size; i++) {
      const individual: ActivationWeights = {};
      for (const [signalName, baseWeight] of Object.entries(baseWeights)) {
        // Random variation around base weight
        individual[signalName] = Math.max(0, Math.min(1, baseWeight + (Math.random() - 0.5) * 0.4));
      }
      population.push(this.applyConstraints(individual));
    }

    return population;
  }

  private selectParent(fitnessScores: { weights: ActivationWeights; fitness: number }[]): { weights: ActivationWeights; fitness: number } {
    // Tournament selection
    const tournamentSize = 3;
    let best = fitnessScores[Math.floor(Math.random() * fitnessScores.length)];

    for (let i = 1; i < tournamentSize; i++) {
      const candidate = fitnessScores[Math.floor(Math.random() * fitnessScores.length)];
      if (candidate.fitness > best.fitness) {
        best = candidate;
      }
    }

    return best;
  }

  private crossover(parent1: ActivationWeights, parent2: ActivationWeights): ActivationWeights {
    const child: ActivationWeights = {};
    for (const signalName of Object.keys(parent1)) {
      child[signalName] = Math.random() < 0.5 ? parent1[signalName] : parent2[signalName];
    }
    return child;
  }

  private mutate(weights: ActivationWeights, mutationRate: number): ActivationWeights {
    const mutated = { ...weights };
    for (const [signalName, weight] of Object.entries(mutated)) {
      if (Math.random() < mutationRate) {
        mutated[signalName] = Math.max(0, Math.min(1, weight + (Math.random() - 0.5) * 0.2));
      }
    }
    return mutated;
  }

  private generateGridPoints(center: ActivationWeights, stepSize: number, pointsPerDimension: number): ActivationWeights[] {
    const signalNames = Object.keys(center);
    const points: ActivationWeights[] = [center];

    // Generate all combinations of +/- stepSize around center
    const offsets = [];
    for (let i = -(pointsPerDimension - 1) / 2; i <= (pointsPerDimension - 1) / 2; i++) {
      if (i !== 0) offsets.push(i * stepSize);
    }

    // Generate Cartesian product of offsets
    const generateCombinations = (dimension: number): number[][] => {
      if (dimension === 0) return [[]];
      const rest = generateCombinations(dimension - 1);
      return rest.flatMap(combination => offsets.map(offset => [...combination, offset]));
    };

    const combinations = generateCombinations(signalNames.length);

    for (const combination of combinations) {
      const point: ActivationWeights = {};
      for (let i = 0; i < signalNames.length; i++) {
        point[signalNames[i]] = Math.max(0, Math.min(1, center[signalNames[i]] + combination[i]));
      }
      points.push(this.applyConstraints(point));
    }

    return points;
  }

  // Data preparation and validation

  private prepareTrainingData(data: TrainingData): TrainingData {
    // Filter out invalid entries
    const validInputs = [];
    const validTargets = [];

    for (let i = 0; i < data.inputs.length; i++) {
      const input = data.inputs[i];
      const target = data.targets[i];

      // Validate that input has signal data and target is valid
      if (input.signals && Object.keys(input.signals).length > 0 &&
          target !== undefined && target !== null) {
        validInputs.push(input);
        validTargets.push(target);
      }
    }

    return {
      inputs: validInputs,
      targets: validTargets
    };
  }

  private splitData(data: TrainingData): { trainingSet: TrainingData; validationSet: TrainingData } {
    const shuffledIndices = Array.from({ length: data.inputs.length }, (_, i) => i)
      .sort(() => Math.random() - 0.5);

    const splitIndex = Math.floor(data.inputs.length * (1 - this.config.validation.holdoutRatio));

    const trainingIndices = shuffledIndices.slice(0, splitIndex);
    const validationIndices = shuffledIndices.slice(splitIndex);

    return {
      trainingSet: {
        inputs: trainingIndices.map(i => data.inputs[i]),
        targets: trainingIndices.map(i => data.targets[i])
      },
      validationSet: {
        inputs: validationIndices.map(i => data.inputs[i]),
        targets: validationIndices.map(i => data.targets[i])
      }
    };
  }

  // Result calculation and analysis

  private calculateImprovement(
    originalWeights: ActivationWeights,
    optimizedWeights: ActivationWeights,
    trainingSet: TrainingData,
    validationSet: TrainingData
  ): WeightOptimizationResult['improvement'] {
    const originalScore = this.evaluateWeights(originalWeights, validationSet);
    const optimizedScore = this.evaluateWeights(optimizedWeights, validationSet);
    const relativeImprovement = ((optimizedScore - originalScore) / originalScore) * 100;

    // Calculate secondary metrics
    const secondaryMetrics: Record<string, number> = {};
    for (const goal of Object.keys(this.config.optimizationGoals.weights)) {
      if (goal !== this.config.optimizationGoals.primary) {
        // Temporarily switch primary goal to calculate secondary metric
        const originalPrimary = this.config.optimizationGoals.primary;
        this.config.optimizationGoals.primary = goal as any;

        const originalSecondary = this.evaluateWeights(originalWeights, validationSet);
        const optimizedSecondary = this.evaluateWeights(optimizedWeights, validationSet);
        secondaryMetrics[goal] = ((optimizedSecondary - originalSecondary) / originalSecondary) * 100;

        this.config.optimizationGoals.primary = originalPrimary;
      }
    }

    return {
      primaryMetric: optimizedScore,
      secondaryMetrics,
      relativeImprovement
    };
  }

  private assessOverfittingRisk(trainingScore: number, validationScore: number): 'low' | 'medium' | 'high' {
    const gap = trainingScore - validationScore;

    if (gap > 0.1) return 'high';
    if (gap > 0.05) return 'medium';
    return 'low';
  }

  private createNoOptimizationResult(weights: ActivationWeights): WeightOptimizationResult {
    return {
      originalWeights: { ...weights },
      optimizedWeights: { ...weights },
      improvement: {
        primaryMetric: 0,
        secondaryMetrics: {},
        relativeImprovement: 0
      },
      convergence: {
        iterations: 0,
        converged: false,
        finalLoss: 0,
        optimizationPath: []
      },
      validation: {
        trainingScore: 0,
        validationScore: 0,
        overfittingRisk: 'low'
      },
      metadata: {
        optimizationTime: 0,
        samplesUsed: 0,
        algorithm: 'none',
        timestamp: Date.now()
      }
    };
  }

  // Public API methods

  setABTestManager(abTestManager: ABTestManager): void {
    this.abTestManager = abTestManager;
  }

  getOptimizationConfig(): WeightOptimizationConfig {
    return { ...this.config };
  }

  updateOptimizationConfig(updates: Partial<WeightOptimizationConfig>): void {
    Object.assign(this.config, updates);
  }

  // Integration with A/B testing
  async createWeightOptimizationExperiment(
    skillName: string,
    currentWeights: ActivationWeights,
    targetWeights: ActivationWeights,
    description?: string
  ): Promise<string> {
    if (!this.abTestManager) {
      throw new Error('ABTestManager not configured. Cannot create weight optimization experiment.');
    }

    return this.abTestManager.createExperiment({
      name: `Weight Optimization - ${skillName}`,
      description: description || `A/B test for optimized weights vs current weights for ${skillName}`,
      trafficSplit: this.config.defaultTrafficSplit || { control: 0.5, treatment: 0.5 },
      targetSkills: [skillName],
      minSampleSize: this.config.validation.minValidationSamples,
      confidenceLevel: 0.95,
      statisticalPower: 0.8,
      variants: {
        control: {
          weights: currentWeights,
          description: 'Current weights'
        },
        treatment: {
          weights: targetWeights,
          description: 'Optimized weights'
        }
      },
      successMetrics: [this.config.optimizationGoals.primary]
    });
  }
}