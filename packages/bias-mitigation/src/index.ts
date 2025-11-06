/**
 * Bias Mitigation Package
 *
 * Comprehensive bias detection and mitigation system for skill activation
 * to ensure fair and unbiased recommendations.
 */

// Detection components
export { TemporalBiasDetector } from './detection/TemporalBiasDetector.js';
export { BiasedPatternDetector } from './detection/BiasedPatternDetector.js';
export type {
  BiasAlert,
  BiasMetrics,
  TimeWindow,
  SeasonalPattern,
  UserBiasProfile,
  ContextBiasProfile
} from './detection/TemporalBiasDetector.js';
export type {
  BiasPattern,
  PatternDetectionConfig,
  SkillActivationData,
  UserBehaviorData,
  SystemPerformanceData,
  DetectionReport
} from './detection/BiasedPatternDetector.js';

// Decay components
export { TemporalDecayManager, WeightDecayApplier } from './decay/index.js';
export type {
  DecayConfig,
  DecayedValue,
  TimeSeriesPoint,
  DecayMetrics,
  WeightDecayConfig,
  DecayedSkillWeights,
  DecayReport
} from './decay/index.js';

// Normalization components
export { TemporalNormalizer } from './normalization/index.js';
export type {
  NormalizationConfig,
  NormalizationResult,
  TemporalBaseline,
  NormalizationReport
} from './normalization/index.js';

// Correction components
export { BiasCorrectionEngine } from './correction/index.js';
export type {
  CorrectionStrategy,
  CorrectionContext,
  CorrectionResult,
  CorrectionConfig,
  CorrectionReport
} from './correction/index.js';

// Core types
export type {
  SkillWeights,
  ActivationMetrics,
  BiasMitigationConfig
} from './types/index.js';

// Main Bias Mitigation Manager
export { BiasMitigationManager } from './BiasMitigationManager.js';
export type {
  BiasMitigationReport,
  BiasMitigationStatus
} from './BiasMitigationManager.js';