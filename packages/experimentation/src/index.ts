export {
  ABTestManager,
  type ExperimentConfig,
  type ExperimentResult,
  type ExperimentSummary,
  type ABTestConfig
} from './ABTestManager.js';

export {
  WeightOptimizer,
  type WeightOptimizationConfig,
  type WeightOptimizationResult,
  type TrainingData
} from './WeightOptimizer.js';

// Re-export activation types for convenience
export type {
  ActivationWeights,
  ActivationSignals
} from '../router/src/activation/types.js';