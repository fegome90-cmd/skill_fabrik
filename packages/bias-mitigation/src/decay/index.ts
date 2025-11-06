/**
 * Temporal Decay Module
 *
 * Exports temporal decay management components for bias mitigation.
 */

export { TemporalDecayManager } from './TemporalDecayManager.js';
export type {
  DecayConfig,
  DecayedValue,
  TimeSeriesPoint,
  DecayMetrics
} from './TemporalDecayManager.js';

export { WeightDecayApplier } from './WeightDecayApplier.js';
export type {
  WeightDecayConfig,
  DecayedSkillWeights,
  DecayReport
} from './WeightDecayApplier.js';