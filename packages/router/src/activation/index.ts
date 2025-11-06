export { ActivationEngine } from './ActivationEngine.js';
export { buildActivationConfig } from './config.js';
export type {
  ActivationConfig,
  ActivationContext,
  ActivationDecision,
  ActivationSignals,
  ActivationWeights,
  ScoreInput,
  Signal,
} from './types.js';

// Signals
export { KeywordMatchSignal } from './signals/keywordMatch.js';
export { HistoricalAccuracySignal } from './signals/historicalAccuracy.js';
export { IntentMatchSignal } from './signals/intentMatch.js';
export { FilePathMatchSignal } from './signals/filePathMatch.js';
export { ContentMatchSignal } from './signals/contentMatch.js';
export { RecentActivitySignal } from './signals/recentActivity.js';
export { ContextRelevanceSignal } from './signals/contextRelevance.js';

// Signal types
export type { IntentPattern } from './signals/intentMatch.js';
export type { FilePathPattern } from './signals/filePathMatch.js';
export type { ContentPattern, ContentAnalysisOptions } from './signals/contentMatch.js';
export type { ActivityEvent, ActivityConfig } from './signals/recentActivity.js';
export type { ProjectContext, ContextPattern, ContextConfig } from './signals/contextRelevance.js';

// Optimization
export { SignalOptimizer } from './optimization/SignalOptimizer.js';
export type { OptimizationConfig, SignalCost } from './optimization/SignalOptimizer.js';

// Monitoring
export { PerformanceMonitor } from './monitoring/PerformanceMonitor.js';
export type {
  PerformanceMetrics,
  SignalMetrics,
  SystemMetrics,
  EvaluationRecord,
  MonitoringConfig
} from './monitoring/PerformanceMonitor.js';

// Provider types
export type { HistoricalDataProvider, ActivationLogger } from './provider.js';


