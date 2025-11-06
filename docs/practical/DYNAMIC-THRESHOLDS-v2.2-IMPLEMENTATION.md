# Dynamic Thresholds v2.2 - ML-Based Optimization
## Technical Implementation Guide

### Document Version: 2.2  
### Status: Proposal  
### Last Updated: 2025-11-02  
### Estimated Implementation Time: 2-3 weeks  

---

## Executive Summary

Dynamic Thresholds v2.2 introduces machine learning-based optimization to the Skills Fabric activation system, extending the successful Fuzzy Matching v1.0 and Contextual Boost v2.0 implementations. This system employs Multi-Armed Bandit algorithms to automatically adjust skill activation thresholds based on contextual features, user patterns, and real-time feedback.

**Expected Impact:**
- **+10-15% improvement** in skill activation precision
- **Reduced false positives** by 23% (estimated)
- **Adaptive thresholds** per skill and context
- **Learning loop** that improves over time

**Technical Approach:**
- Multi-Armed Bandit (MAB) algorithm with Thompson sampling
- Real-time feature extraction and inference
- PostgreSQL + Redis for model persistence
- Context-aware adjustments for project type, user expertise, and recent patterns

**Business Value:**
- Higher developer productivity through more relevant skill activations
- Reduced cognitive load from fewer irrelevant suggestions
- Automated optimization without manual threshold tuning
- Data-driven insights into skill activation patterns

---

## 1. System Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Router Service                           │
│                     (packages/router)                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌──────────────────────────────────┐ │
│  │   Feature Extract   │→│   Context Analyzer               │ │
│  └─────────────────────┘  └──────────────────────────────────┘ │
│            │                        │                           │
│            ▼                        ▼                           │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │          DynamicThresholdManager (Main Orchestrator)      │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐  │ │
│  │  │ThresholdOpt  │  │PerSkillCust  │  │ContextAwareAdj │  │ │
│  │  │(ML Engine)   │  │(Skill Spec.) │  │(Context Feat.) │  │ │
│  │  └──────────────┘  └──────────────┘  └────────────────┘  │ │
│  └───────────────────────────────────────────────────────────┘ │
│            │                                                       
└────────────┼──────────────────────────────────────────────────┘
             │
    ┌────────▼───────────────┐
    │   Model Inference      │
    │  (Redis L1 + PostgreSQL)│
    └────────┬───────────────┘
             │
    ┌────────▼───────────────┐
    │   Feedback Loop        │
    │  (Activation Tracking) │
    └────────────────────────┘
```

### 1.2 Component Descriptions

#### DynamicThresholdManager (Main Orchestrator)
- **Responsibility**: Central coordinator for all ML threshold operations
- **Entry Point**: `getOptimalThreshold(skillId, input, baseThreshold)`
- **Integration**: Hooks into `calculateSkillScore()` in detectors.ts
- **Thread Safety**: Async operations with proper locking

#### ThresholdOptimizer (ML Engine)
- **Algorithm**: Multi-Armed Bandit with Thompson Sampling
- **Decision Making**: Selects optimal threshold from configurable range
- **Learning**: Updates model based on feedback (success/failure)
- **Performance**: <50ms inference time (requirement)

#### PerSkillCustomizer (Skill-Specific Configurations)
- **Purpose**: Handles skill-specific threshold ranges and learning rates
- **Configuration**: Base, min, max thresholds per skill
- **Adaptability**: Different optimization strategies per skill type
- **Override**: Manual configuration support

#### ContextAwareAdjuster (Contextual Features)
- **Features**: Project type, file types, user expertise, recency
- **Adjustment**: Applies contextual modifiers to base threshold
- **Weighting**: Feature importance learned over time
- **Fallback**: Default adjustments if context unavailable

#### ModelPersistor (Persistence Layer)
- **Storage**: PostgreSQL (primary) + Redis (cache)
- **Versioning**: Model version tracking for rollback
- **Recovery**: Automatic model reload on service restart
- **Backup**: Periodic snapshots for disaster recovery

### 1.3 Technology Stack Decision Matrix

| Component | Option 1 | Option 2 | Decision | Rationale |
|-----------|----------|----------|----------|-----------|
| ML Framework | TensorFlow.js | Custom Implementation | **Custom** | Simpler, no heavy dependencies, better control |
| MAB Algorithm | Thompson Sampling | UCB1 | **Thompson** | Better exploration/exploitation balance |
| Feature Storage | Redis | In-Memory | **Redis** | Persistence, faster, shared across instances |
| Model Storage | PostgreSQL | File System | **PostgreSQL** | Already in stack, transactional support |
| Inference Mode | Real-time | Batch | **Real-time** | Required for user-facing features |

---

## 2. Algorithm Design & ML Strategy

### 2.1 Multi-Armed Bandit Implementation

#### Core Concept
We treat each possible threshold value as an "arm" in our bandit:
- **Arms**: Threshold values from 0.1 to 0.9 (configurable granularity)
- **Reward Function**: R = precision_score - λ×latency_penalty - μ×complexity_penalty
- **Context**: Features extracted from input and current state
- **Algorithm**: Thompson Sampling for Bayesian optimization

#### Threshold Space Configuration
```typescript
interface ThresholdSpace {
  granularity: number;        // 0.05 = 16 arms (0.1, 0.15, ..., 0.9)
  minThreshold: number;       // 0.1
  maxThreshold: number;       // 0.9
  explorationRate: number;    // 0.1 = 10% exploration
}
```

#### Reward Calculation
```typescript
function calculateReward(
  activationSuccess: boolean,
  precisionScore: number,
  latencyMs: number,
  userFeedback?: number
): number {
  // Base reward: 1.0 for success, -0.5 for false positive
  let reward = activationSuccess ? 1.0 : -0.5;
  
  // Precision bonus: encourages high-quality matches
  reward += precisionScore * 0.3;
  
  // Latency penalty: discourages slow activations
  reward -= (latencyMs / 1000) * 0.1;
  
  // User feedback bonus: explicit feedback (if available)
  if (userFeedback !== undefined) {
    reward += userFeedback * 0.2;
  }
  
  return reward;
}
```

### 2.2 Feature Engineering

#### 2.2.1 Prompt Features
```typescript
interface PromptFeatures {
  length: number;                    // Character count
  keywordDensity: number;            // Keywords per 100 chars
  fuzzyMatchScore: number;           // Jaro-Winkler score
  fuzzyMatchesCount: number;         // Number of fuzzy matches
  hasCodeBlocks: boolean;            // Contains code
  hasUrls: boolean;                  // Contains URLs
  hasFilePaths: boolean;             // Contains file paths
  technicalTermsRatio: number;       // Technical jargon ratio
}
```

#### 2.2.2 Contextual Features
```typescript
interface ContextFeatures {
  // Project context
  projectType: 'frontend' | 'backend' | 'fullstack' | 'mobile' | 'unknown';
  modifiedFileTypes: string[];       // e.g., ['.ts', '.tsx', '.js']
  teamSize: 'solo' | 'small' | 'large' | 'unknown';
  
  // Historical patterns
  recentSimilarActivations: number;   // Last 10 minutes
  userSuccessRate: number;            // Historical precision
  timeSinceLastActivation: number;    // Seconds
  
  // System state
  currentHour: number;                // 0-23
  dayOfWeek: number;                  // 0-6
  systemLoad: number;                 // 0-1 (normalized)
}
```

#### 2.2.3 User Behavior Features
```typescript
interface UserFeatures {
  expertiseLevel: 'junior' | 'mid' | 'senior' | 'unknown';
  primaryLanguage: string;            // e.g., 'typescript'
  preferredFrameworks: string[];      // e.g., ['react', 'nextjs']
  activationHistory: {
    totalActivations: number;
    successRate: number;
    avgActivationScore: number;
  };
  recentRejections: number;           // Skills user rejected recently
}
```

### 2.3 Feature Extraction Implementation

```typescript
class FeatureExtractor {
  async extractPromptFeatures(input: PreHookInput): Promise<PromptFeatures> {
    const content = input.content || '';
    
    return {
      length: content.length,
      keywordDensity: this.calculateKeywordDensity(content),
      fuzzyMatchScore: input.skillMatches?.[0]?.score || 0,
      fuzzyMatchesCount: input.skillMatches?.length || 0,
      hasCodeBlocks: /```[\s\S]*?```/.test(content),
      hasUrls: /https?:\/\//.test(content),
      hasFilePaths: /[\/\w\-\.]+\.[a-zA-Z]+/.test(content),
      technicalTermsRatio: this.calculateTechnicalTerms(content),
    };
  }
  
  async extractContextFeatures(input: PreHookInput): Promise<ContextFeatures> {
    // Implementation details...
    return {
      projectType: await this.detectProjectType(input),
      modifiedFileTypes: this.extractFileTypes(input),
      teamSize: await this.estimateTeamSize(),
      recentSimilarActivations: await this.getRecentActivations(input),
      userSuccessRate: await this.getUserSuccessRate(input.userId),
      timeSinceLastActivation: await this.getTimeSinceLastActivation(input.userId),
      currentHour: new Date().getHours(),
      dayOfWeek: new Date().getDay(),
      systemLoad: await this.getSystemLoad(),
    };
  }
}
```

### 2.4 Thompson Sampling Algorithm

```typescript
class ThompsonSampling {
  private readonly alpha: Map<string, number> = new Map(); // Successes + 1
  private readonly beta: Map<string, number> = new Map();  // Failures + 1
  
  selectArm(thresholdSpace: ThresholdSpace, context: ContextFeatures): number {
    const thresholds: number[] = [];
    const samples: number[] = [];
    
    // Generate all possible thresholds
    for (let t = thresholdSpace.minThreshold; 
         t <= thresholdSpace.maxThreshold; 
         t += thresholdSpace.granularity) {
      thresholds.push(Number(t.toFixed(3)));
    }
    
    // Sample from Beta distribution for each threshold
    for (const threshold of thresholds) {
      const alpha = this.alpha.get(threshold) || 1;
      const beta = this.beta.get(threshold) || 1;
      
      // Beta distribution sampling (simplified approximation)
      const sample = this.betaSample(alpha, beta);
      samples.push(sample);
    }
    
    // Select threshold with highest sample value
    const maxIndex = samples.indexOf(Math.max(...samples));
    return thresholds[maxIndex];
  }
  
  update(threshold: number, reward: number): void {
    const currentAlpha = this.alpha.get(threshold) || 1;
    const currentBeta = this.beta.get(threshold) || 1;
    
    if (reward > 0) {
      // Successful activation
      this.alpha.set(threshold, currentAlpha + reward);
    } else {
      // False positive
      this.beta.set(threshold, currentBeta + Math.abs(reward));
    }
  }
  
  private betaSample(alpha: number, beta: number): number {
    // Simplified Beta distribution approximation
    // In production, use proper Beta distribution implementation
    const x = this.gammaSample(alpha, 1);
    const y = this.gammaSample(beta, 1);
    return x / (x + y);
  }
  
  private gammaSample(shape: number, rate: number): number {
    // Simplified Gamma distribution sampling
    // For Thompson Sampling, we need Beta distribution
    // This is a placeholder - implement proper sampling
    return Math.random() * shape;
  }
}
```

---

## 3. Implementation Details

### 3.1 Directory Structure

```
packages/router/src/ml/
├── DynamicThresholdManager.ts      # Main orchestrator
├── ThresholdOptimizer.ts            # ML engine (MAB algorithm)
├── PerSkillCustomizer.ts            # Skill-specific configs
├── ContextAwareAdjuster.ts          # Contextual adjustments
├── ModelPersistor.ts                # Persistence layer
├── types/
│   ├── ml-types.ts                  # Type definitions
│   └── thresholds.ts                # Threshold types
├── features/
│   ├── PromptFeatures.ts            # Prompt feature extraction
│   ├── ContextFeatures.ts           # Context feature extraction
│   └── UserFeatures.ts              # User behavior features
├── models/
│   ├── ThresholdModel.ts            # Model state
│   └── PersistedModel.ts            # Serialization logic
├── algorithms/
│   ├── ThompsonSampling.ts          # Thompson sampling implementation
│   └── MultiArmedBandit.ts          # MAB wrapper
└── __tests__/
    ├── threshold-manager.spec.ts
    ├── feature-extraction.spec.ts
    └── model-persistence.spec.ts
```

### 3.2 Core Classes Implementation

#### DynamicThresholdManager

```typescript
import { ThresholdOptimizer } from './ThresholdOptimizer.js';
import { PerSkillCustomizer } from './PerSkillCustomizer.js';
import { ContextAwareAdjuster } from './ContextAwareAdjuster.js';
import { ModelPersistor } from './ModelPersistor.js';
import { FeatureExtractor } from './features/FeatureExtractor.js';

export class DynamicThresholdManager {
  private optimizer: ThresholdOptimizer;
  private customizer: PerSkillCustomizer;
  private adjuster: ContextAwareAdjuster;
  private persistor: ModelPersistor;
  private extractor: FeatureExtractor;
  
  constructor(
    optimizer: ThresholdOptimizer,
    customizer: PerSkillCustomizer,
    adjuster: ContextAwareAdjuster,
    persistor: ModelPersistor
  ) {
    this.optimizer = optimizer;
    this.customizer = customizer;
    this.adjuster = adjuster;
    this.persistor = persistor;
  }
  
  /**
   * Get optimal threshold for a skill activation
   * @param skillId Skill identifier
   * @param input Pre-hook input
   * @param baseThreshold Base threshold from skill configuration
   * @returns Optimized threshold value (0.0 - 1.0)
   */
  async getOptimalThreshold(
    skillId: string,
    input: PreHookInput,
    baseThreshold: number
  ): Promise<number> {
    try {
      // 1. Extract features
      const features = await this.extractor.extractAllFeatures(input);
      
      // 2. Apply skill-specific customization
      const skillConfig = this.customizer.getConfig(skillId);
      let adjustedThreshold = this.customizer.applyBaseThreshold(
        baseThreshold,
        skillConfig
      );
      
      // 3. Apply contextual adjustments
      adjustedThreshold = this.adjuster.adjustForContext(
        adjustedThreshold,
        features.context
      );
      
      // 4. Apply ML optimization
      const mlThreshold = await this.optimizer.optimizeThreshold(
        skillId,
        adjustedThreshold,
        features
      );
      
      // 5. Ensure within bounds
      return this.clampThreshold(mlThreshold, skillConfig);
      
    } catch (error) {
      console.error('Error computing optimal threshold:', error);
      // Fallback to base threshold
      return baseThreshold;
    }
  }
  
  /**
   * Update model with feedback
   * @param skillId Skill identifier
   * @param input Input context
   * @param threshold Threshold used
   * @param success Whether activation was successful
   * @param metrics Additional metrics
   */
  async updateModel(
    skillId: string,
    input: PreHookInput,
    threshold: number,
    success: boolean,
    metrics: ActivationMetrics
  ): Promise<void> {
    try {
      const features = await this.extractor.extractAllFeatures(input);
      const reward = this.calculateReward(success, metrics);
      
      await this.optimizer.updateModel(skillId, threshold, reward, features);
      
      // Persist to database
      await this.persistor.recordFeedback({
        skillId,
        contextHash: this.hashContext(input.content),
        threshold,
        activationScore: metrics.score,
        success,
        latencyMs: metrics.latencyMs,
        features,
      });
      
    } catch (error) {
      console.error('Error updating model:', error);
      // Non-blocking - don't fail on model update errors
    }
  }
  
  private clampThreshold(
    threshold: number,
    config: SkillThresholdConfig
  ): number {
    return Math.min(
      Math.max(threshold, config.min),
      config.max
    );
  }
  
  private calculateReward(
    success: boolean,
    metrics: ActivationMetrics
  ): number {
    let reward = success ? 1.0 : -0.5;
    reward += metrics.precisionScore * 0.3;
    reward -= (metrics.latencyMs / 1000) * 0.1;
    
    if (metrics.userFeedback !== undefined) {
      reward += metrics.userFeedback * 0.2;
    }
    
    return reward;
  }
  
  private hashContext(content: string): string {
    // Simple hash - in production use crypto.createHash('sha256')
    return Buffer.from(content).toString('base64').slice(0, 16);
  }
}
```

#### ThresholdOptimizer (ML Engine)

```typescript
import { ThompsonSampling } from './algorithms/ThompsonSampling.js';
import { ThresholdSpace, ContextFeatures, SkillModel } from '../types/ml-types.js';

export class ThresholdOptimizer {
  private bandit: ThompsonSampling;
  private modelStore: Map<string, SkillModel> = new Map();
  
  constructor() {
    this.bandit = new ThompsonSampling();
  }
  
  /**
   * Optimize threshold using Multi-Armed Bandit
   * @param skillId Skill identifier
   * @param baseThreshold Starting threshold
   * @param features Current features
   * @returns Optimized threshold
   */
  async optimizeThreshold(
    skillId: string,
    baseThreshold: number,
    features: ExtractedFeatures
  ): Promise<number> {
    // Get or create model for skill
    let model = this.modelStore.get(skillId);
    if (!model) {
      model = await this.loadModel(skillId);
      this.modelStore.set(skillId, model);
    }
    
    // Get threshold space configuration
    const thresholdSpace = model.config.thresholdSpace;
    
    // Select optimal threshold using Thompson Sampling
    const selectedThreshold = this.bandit.selectArm(
      thresholdSpace,
      features.context
    );
    
    // Apply exploration/exploitation strategy
    const shouldExplore = Math.random() < thresholdSpace.explorationRate;
    const finalThreshold = shouldExplore
      ? this.randomThreshold(thresholdSpace)
      : selectedThreshold;
    
    return finalThreshold;
  }
  
  /**
   * Update model with new feedback
   * @param skillId Skill identifier
   * @param threshold Threshold used
   * @param reward Reward value
   * @param features Features from activation
   */
  async updateModel(
    skillId: string,
    threshold: number,
    reward: number,
    features: ExtractedFeatures
  ): Promise<void> {
    // Get or create model
    let model = this.modelStore.get(skillId);
    if (!model) {
      model = await this.loadModel(skillId);
      this.modelStore.set(skillId, model);
    }
    
    // Update Thompson Sampling parameters
    this.bandit.update(threshold, reward);
    
    // Update model metrics
    model.performance.totalUpdates++;
    if (reward > 0) {
      model.performance.successCount++;
    }
    model.performance.successRate = 
      model.performance.successCount / model.performance.totalUpdates;
    
    // Check if model needs persistence
    if (model.performance.totalUpdates % 100 === 0) {
      await this.saveModel(skillId, model);
    }
  }
  
  /**
   * Load model from persistence
   */
  private async loadModel(skillId: string): Promise<SkillModel> {
    // Try to load from Redis cache first
    const cached = await this.redis.get(`ml:model:${skillId}`);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Load from database
    const dbModel = await this.db.getSkillModel(skillId);
    if (dbModel) {
      // Cache in Redis
      await this.redis.setex(`ml:model:${skillId}`, 3600, JSON.stringify(dbModel));
      return dbModel;
    }
    
    // Create new model
    return this.createDefaultModel(skillId);
  }
  
  /**
   * Save model to persistence
   */
  private async saveModel(skillId: string, model: SkillModel): Promise<void> {
    model.lastUpdated = new Date();
    
    // Save to database
    await this.db.saveSkillModel(skillId, model);
    
    // Update Redis cache
    await this.redis.setex(`ml:model:${skillId}`, 3600, JSON.stringify(model));
    
    console.log(`[ML] Saved model for skill ${skillId}, success rate: ${model.performance.successRate.toFixed(3)}`);
  }
  
  /**
   * Create default model for new skill
   */
  private createDefaultModel(skillId: string): SkillModel {
    return {
      skillId,
      config: {
        thresholdSpace: {
          granularity: 0.05,
          minThreshold: 0.1,
          maxThreshold: 0.9,
          explorationRate: 0.1,
        },
      },
      performance: {
        totalUpdates: 0,
        successCount: 0,
        successRate: 0,
        avgPrecision: 0,
        avgLatency: 0,
      },
      lastUpdated: new Date(),
      version: '1.0.0',
    };
  }
  
  private randomThreshold(space: ThresholdSpace): number {
    const steps = Math.floor(
      (space.maxThreshold - space.minThreshold) / space.granularity
    );
    const randomStep = Math.floor(Math.random() * steps);
    return Number(
      (space.minThreshold + randomStep * space.granularity).toFixed(3)
    );
  }
}
```

#### PerSkillCustomizer

```typescript
import { SkillThresholdConfig } from '../types/thresholds.js';

export class PerSkillCustomizer {
  private configs: Map<string, SkillThresholdConfig> = new Map();
  
  constructor() {
    this.loadDefaultConfigs();
  }
  
  /**
   * Get configuration for skill
   */
  getConfig(skillId: string): SkillThresholdConfig {
    return this.configs.get(skillId) || this.getDefaultConfig();
  }
  
  /**
   * Apply base threshold with skill-specific adjustments
   */
  applyBaseThreshold(
    baseThreshold: number,
    config: SkillThresholdConfig
  ): number {
    // Start with base threshold
    let adjusted = baseThreshold;
    
    // Apply skill-specific minimum/maximum bounds
    adjusted = Math.max(adjusted, config.min);
    adjusted = Math.min(adjusted, config.max);
    
    // Apply learning rate bias (skills with higher learning rates adapt faster)
    // This is handled through the ML model, not here
    
    return adjusted;
  }
  
  /**
   * Update configuration for skill
   */
  updateConfig(skillId: string, config: Partial<SkillThresholdConfig>): void {
    const current = this.configs.get(skillId) || this.getDefaultConfig();
    this.configs.set(skillId, { ...current, ...config });
  }
  
  /**
   * Load default threshold configurations per skill type
   */
  private loadDefaultConfigs(): void {
    const configs = {
      // Guardrail skills - lower thresholds for safety
      'database-verification': {
        base: 0.20,
        min: 0.10,
        max: 0.50,
        learningRate: 0.01,
        adjustmentStrategy: 'conservative',
      },
      'secrets-and-config': {
        base: 0.15,
        min: 0.10,
        max: 0.40,
        learningRate: 0.01,
        adjustmentStrategy: 'conservative',
      },
      
      // Guideline skills - medium thresholds
      'backend-dev-guidelines': {
        base: 0.55,
        min: 0.30,
        max: 0.80,
        learningRate: 0.05,
        adjustmentStrategy: 'balanced',
      },
      'frontend-dev-guidelines': {
        base: 0.52,
        min: 0.28,
        max: 0.78,
        learningRate: 0.05,
        adjustmentStrategy: 'balanced',
      },
      
      // Testing skills - higher thresholds to avoid noise
      'cli-integration-testing': {
        base: 0.65,
        min: 0.40,
        max: 0.85,
        learningRate: 0.03,
        adjustmentStrategy: 'precision-focused',
      },
      'webapp-testing': {
        base: 0.62,
        min: 0.38,
        max: 0.82,
        learningRate: 0.03,
        adjustmentStrategy: 'precision-focused',
      },
      
      // Policy skills - high thresholds
      'policy-net': {
        base: 0.75,
        min: 0.50,
        max: 0.90,
        learningRate: 0.02,
        adjustmentStrategy: 'high-precision',
      },
      
      // Workflow skills - balanced
      'workflow-automation': {
        base: 0.58,
        min: 0.32,
        max: 0.80,
        learningRate: 0.04,
        adjustmentStrategy: 'balanced',
      },
    };
    
    Object.entries(configs).forEach(([skillId, config]) => {
      this.configs.set(skillId, {
        base: config.base,
        min: config.min,
        max: config.max,
        learningRate: config.learningRate,
        adjustmentStrategy: config.adjustmentStrategy,
        thresholdSpace: {
          granularity: 0.05,
          minThreshold: config.min,
          maxThreshold: config.max,
          explorationRate: 0.1,
        },
      });
    });
  }
  
  private getDefaultConfig(): SkillThresholdConfig {
    return {
      base: 0.5,
      min: 0.1,
      max: 0.9,
      learningRate: 0.03,
      adjustmentStrategy: 'balanced',
      thresholdSpace: {
        granularity: 0.05,
        minThreshold: 0.1,
        maxThreshold: 0.9,
        explorationRate: 0.1,
      },
    };
  }
}
```

#### ContextAwareAdjuster

```typescript
import { ContextFeatures, ExtractedFeatures } from '../types/ml-types.js';

export class ContextAwareAdjuster {
  /**
   * Apply contextual adjustments to threshold
   * @param baseThreshold Base threshold (after skill customization)
   * @param context Context features
   * @returns Adjusted threshold
   */
  adjustForContext(
    baseThreshold: number,
    context: ContextFeatures
  ): number {
    let adjustment = 0;
    let reasons: string[] = [];
    
    // Project type adjustment
    const projectAdjustment = this.getProjectTypeAdjustment(context.projectType);
    adjustment += projectAdjustment.value;
    if (projectAdjustment.reason) {
      reasons.push(projectAdjustment.reason);
    }
    
    // Team size adjustment
    const teamAdjustment = this.getTeamSizeAdjustment(context.teamSize);
    adjustment += teamAdjustment.value;
    if (teamAdjustment.reason) {
      reasons.push(teamAdjustment.reason);
    }
    
    // Recent similar activations (recency bias)
    const recencyAdjustment = this.getRecencyAdjustment(
      context.recentSimilarActivations
    );
    adjustment += recencyAdjustment.value;
    if (recencyAdjustment.reason) {
      reasons.push(recencyAdjustment.reason);
    }
    
    // Time-based adjustment (user patterns)
    const timeAdjustment = this.getTimeAdjustment(
      context.currentHour,
      context.dayOfWeek
    );
    adjustment += timeAdjustment.value;
    if (timeAdjustment.reason) {
      reasons.push(timeAdjustment.reason);
    }
    
    // User success rate (user expertise proxy)
    const userRateAdjustment = this.getUserSuccessRateAdjustment(
      context.userSuccessRate
    );
    adjustment += userRateAdjustment.value;
    if (userRateAdjustment.reason) {
      reasons.push(userRateAdjustment.reason);
    }
    
    // System load adjustment (reduce threshold under high load)
    const loadAdjustment = this.getSystemLoadAdjustment(context.systemLoad);
    adjustment += loadAdjustment.value;
    if (loadAdjustment.reason) {
      reasons.push(loadAdjustment.reason);
    }
    
    // Log adjustments for debugging
    if (reasons.length > 0) {
      console.log(
        `[ML] Context adjustments for threshold ${baseThreshold}: ` +
        `${adjustment >= 0 ? '+' : ''}${adjustment.toFixed(3)} ` +
        `(from ${reasons.join(', ')})`
      );
    }
    
    return baseThreshold + adjustment;
  }
  
  private getProjectTypeAdjustment(
    projectType: string
  ): { value: number; reason?: string } {
    switch (projectType) {
      case 'security-critical':
        return {
          value: -0.10,
          reason: 'security-critical project (lower threshold)',
        };
      case 'frontend':
        return {
          value: +0.03,
          reason: 'frontend project (UI/UX focus)',
        };
      case 'backend':
        return {
          value: +0.02,
          reason: 'backend project (architecture focus)',
        };
      case 'fullstack':
        return {
          value: 0,
          reason: undefined,
        };
      case 'mobile':
        return {
          value: +0.05,
          reason: 'mobile project (platform-specific)',
        };
      default:
        return { value: 0, reason: undefined };
    }
  }
  
  private getTeamSizeAdjustment(
    teamSize: string
  ): { value: number; reason?: string } {
    switch (teamSize) {
      case 'solo':
        return {
          value: +0.05,
          reason: 'solo developer (more guidance)',
        };
      case 'small':
        return {
          value: +0.02,
          reason: 'small team (some collaboration)',
        };
      case 'large':
        return {
          value: -0.03,
          reason: 'large team (well-documented)',
        };
      default:
        return { value: 0, reason: undefined };
    }
  }
  
  private getRecencyAdjustment(
    recentSimilar: number
  ): { value: number; reason?: string } {
    if (recentSimilar === 0) {
      return { value: 0, reason: undefined };
    }
    
    if (recentSimilar >= 5) {
      return {
        value: +0.08,
        reason: 'high recency (pattern detected)',
      };
    }
    
    if (recentSimilar >= 3) {
      return {
        value: +0.05,
        reason: 'moderate recency',
      };
    }
    
    return {
      value: +0.02,
      reason: 'low recency',
    };
  }
  
  private getTimeAdjustment(
    hour: number,
    dayOfWeek: number
  ): { value: number; reason?: string } {
    // Early morning hours (6-9 AM) - higher threshold (less context switching)
    if (hour >= 6 && hour <= 9) {
      return {
        value: +0.03,
        reason: 'morning hours (focus time)',
      };
    }
    
    // Late evening hours (10 PM - 2 AM) - lower threshold (more experimentation)
    if (hour >= 22 || hour <= 2) {
      return {
        value: -0.05,
        reason: 'late hours (exploration mode)',
      };
    }
    
    // Weekend - slightly higher threshold
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return {
        value: +0.02,
        reason: 'weekend (leisurely coding)',
      };
    }
    
    return { value: 0, reason: undefined };
  }
  
  private getUserSuccessRateAdjustment(
    userSuccessRate: number
  ): { value: number; reason?: string } {
    if (userSuccessRate === undefined || userSuccessRate === null) {
      return { value: 0, reason: undefined };
    }
    
    // High success rate (experienced user) - lower threshold
    if (userSuccessRate >= 0.85) {
      return {
        value: -0.05,
        reason: 'high user success rate (experienced)',
      };
    }
    
    // Low success rate (learning) - higher threshold
    if (userSuccessRate <= 0.60) {
      return {
        value: +0.08,
        reason: 'low user success rate (learning)',
      };
    }
    
    return { value: 0, reason: undefined };
  }
  
  private getSystemLoadAdjustment(
    systemLoad: number
  ): { value: number; reason?: string } {
    if (systemLoad >= 0.8) {
      return {
        value: -0.05,
        reason: 'high system load (reduce activations)',
      };
    }
    
    if (systemLoad <= 0.3) {
      return {
        value: +0.02,
        reason: 'low system load (can handle more)',
      };
    }
    
    return { value: 0, reason: undefined };
  }
}
```

### 3.3 Model Persistence Implementation

#### ModelPersistor

```typescript
import pg from 'pg';
import redis from 'redis';

export class ModelPersistor {
  private pgPool: pg.Pool;
  private redisClient: redis.RedisClientType;
  
  constructor(pgPool: pg.Pool, redisClient: redis.RedisClientType) {
    this.pgPool = pgPool;
    this.redisClient = redisClient;
  }
  
  /**
   * Record feedback for ML model training
   */
  async recordFeedback(feedback: FeedbackRecord): Promise<void> {
    const query = `
      INSERT INTO sf_ml_feedback 
        (skill_id, context_hash, threshold_used, activation_score, 
         success, latency_ms, features, created_at)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, NOW())
    `;
    
    await this.pgPool.query(query, [
      feedback.skillId,
      feedback.contextHash,
      feedback.threshold,
      feedback.activationScore,
      feedback.success,
      feedback.latencyMs,
      JSON.stringify(feedback.features),
    ]);
    
    // Cache in Redis for real-time analytics
    await this.redisClient.lpush(
      `ml:feedback:${feedback.skillId}`,
      JSON.stringify(feedback)
    );
    
    // Trim Redis list to last 1000 entries
    await this.redisClient.ltrim(
      `ml:feedback:${feedback.skillId}`,
      0,
      999
    );
  }
  
  /**
   * Load model for skill
   */
  async loadModel(skillId: string): Promise<SkillModel | null> {
    // Try Redis cache first
    const cached = await this.redisClient.get(`ml:model:${skillId}`);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Load from PostgreSQL
    const query = `
      SELECT 
        id, skill_id, model_type, features, performance_metrics,
        version, last_updated, created_at
      FROM sf_ml_models
      WHERE skill_id = $1 AND model_type = 'threshold_mab'
      ORDER BY last_updated DESC
      LIMIT 1
    `;
    
    const result = await this.pgPool.query(query, [skillId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    const model: SkillModel = {
      skillId: row.skill_id,
      config: row.features,
      performance: row.performance_metrics,
      version: row.version,
      lastUpdated: row.last_updated,
      createdAt: row.created_at,
    };
    
    // Cache in Redis
    await this.redisClient.setex(
      `ml:model:${skillId}`,
      3600, // 1 hour
      JSON.stringify(model)
    );
    
    return model;
  }
  
  /**
   * Save model to persistence
   */
  async saveModel(model: SkillModel): Promise<void> {
    const query = `
      INSERT INTO sf_ml_models
        (skill_id, model_type, features, performance_metrics, version, 
         last_updated, created_at)
      VALUES 
        ($1, $2, $3, $4, $5, NOW(), NOW())
      ON CONFLICT (skill_id, model_type)
      DO UPDATE SET
        features = EXCLUDED.features,
        performance_metrics = EXCLUDED.performance_metrics,
        version = EXCLUDED.version,
        last_updated = NOW()
      RETURNING id
    `;
    
    await this.pgPool.query(query, [
      model.skillId,
      'threshold_mab',
      model.config,
      model.performance,
      model.version,
    ]);
    
    // Update Redis cache
    await this.redisClient.setex(
      `ml:model:${model.skillId}`,
      3600,
      JSON.stringify(model)
    );
  }
  
  /**
   * Get aggregated performance metrics for skill
   */
  async getPerformanceMetrics(
    skillId: string,
    days: number = 30
  ): Promise<AggregatedMetrics> {
    const query = `
      SELECT 
        COUNT(*) as total_activations,
        SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful_activations,
        AVG(CASE WHEN success THEN activation_score END) as avg_score_success,
        AVG(CASE WHEN NOT success THEN activation_score END) as avg_score_failure,
        AVG(latency_ms) as avg_latency,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY threshold_used) as median_threshold,
        PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY threshold_used) as p90_threshold
      FROM sf_ml_feedback
      WHERE skill_id = $1
        AND created_at >= NOW() - INTERVAL '${days} days'
    `;
    
    const result = await this.pgPool.query(query, [skillId]);
    const row = result.rows[0];
    
    return {
      totalActivations: parseInt(row.total_activations),
      successfulActivations: parseInt(row.successful_activations),
      successRate: parseFloat(row.successful_activations) / parseFloat(row.total_activations),
      avgScoreOnSuccess: parseFloat(row.avg_score_success) || 0,
      avgScoreOnFailure: parseFloat(row.avg_score_failure) || 0,
      avgLatency: parseFloat(row.avg_latency) || 0,
      medianThreshold: parseFloat(row.median_threshold) || 0,
      p90Threshold: parseFloat(row.p90_threshold) || 0,
    };
  }
  
  /**
   * Clean up old feedback data
   */
  async cleanupOldFeedback(retentionDays: number = 90): Promise<void> {
    const query = `
      DELETE FROM sf_ml_feedback
      WHERE created_at < NOW() - INTERVAL '${retentionDays} days'
    `;
    
    const result = await this.pgPool.query(query);
    console.log(`[ML] Cleaned up ${result.rowCount} old feedback records`);
  }
}
```

---

## 4. Integration Points

### 4.1 Integration with Current System

#### Updated matchRulesFor() in detectors.ts

```typescript
import { DynamicThresholdManager } from './ml/DynamicThresholdManager.js';
import { ThresholdOptimizer } from './ml/ThresholdOptimizer.js';

// Initialize ML threshold manager
const thresholdManager = new DynamicThresholdManager(
  new ThresholdOptimizer(),
  new PerSkillCustomizer(),
  new ContextAwareAdjuster(),
  new ModelPersistor(pgPool, redisClient)
);

/**
 * Core skill matching function with ML thresholds
 */
export async function matchRulesFor(input: PreHookInput): Promise<SkillMatch[]> {
  const rules = getSkillRules();
  const activated: string[] = [];
  const startTime = Date.now();
  
  for (const [skillId, rule] of Object.entries(rules)) {
    try {
      // Get enforcement threshold
      const enforcementThreshold = getEnforcementThreshold(rule.enforcement);
      
      // NEW: Apply ML optimization to threshold
      const mlThreshold = await thresholdManager.getOptimalThreshold(
        skillId,
        input,
        enforcementThreshold
      );
      
      // Calculate skill score (existing logic)
      const { score, matches, fuzzyScore } = calculateSkillScore(rule, input);
      
      // Check if score meets ML-optimized threshold
      if (score >= mlThreshold) {
        activated.push(skillId);
        
        // NEW: Track activation for ML feedback
        trackActivationForFeedback(
          skillId,
          score,
          mlThreshold,
          input,
          Date.now() - startTime
        );
        
        console.log(
          `[ML] Activated ${skillId}: score=${score.toFixed(3)}, ` +
          `threshold=${mlThreshold.toFixed(3)}, ` +
          `improvement=${((mlThreshold - enforcementThreshold) / enforcementThreshold * 100).toFixed(1)}%`
        );
      }
      
    } catch (error) {
      console.error(`Error processing rule for ${skillId}:`, error);
    }
  }
  
  return activated.map(skillId => ({
    skillId,
    score: 0, // Will be populated by calculateSkillScore
    rule: rules[skillId],
  }));
}

/**
 * Track activation for ML feedback loop
 */
function trackActivationForFeedback(
  skillId: string,
  score: number,
  threshold: number,
  input: PreHookInput,
  latencyMs: number
): void {
  // Store temporary activation record
  // This will be converted to feedback when we know if user accepted/rejected
  const activationRecord: ActivationRecord = {
    skillId,
    score,
    threshold,
    input,
    timestamp: new Date(),
    latencyMs,
    resolved: false, // Will be set to true when we get user feedback
  };
  
  // Store in memory (or Redis for distributed systems)
  pendingActivations.push(activationRecord);
  
  // Clean up old records
  const cutoff = Date.now() - (10 * 60 * 1000); // 10 minutes
  pendingActivations = pendingActivations.filter(
    a => a.timestamp.getTime() > cutoff
  );
}

/**
 * Report activation result (for feedback loop)
 */
export async function reportActivationResult(
  skillId: string,
  userAccepted: boolean,
  userRating?: number
): Promise<void> {
  // Find pending activation record
  const record = pendingActivations.findLast(
    r => r.skillId === skillId && !r.resolved
  );
  
  if (!record) {
    console.warn(`[ML] No pending activation found for ${skillId}`);
    return;
  }
  
  // Mark as resolved
  record.resolved = true;
  
  // Update ML model with feedback
  await thresholdManager.updateModel(
    skillId,
    record.input,
    record.threshold,
    userAccepted,
    {
      score: record.score,
      latencyMs: record.latencyMs,
      userFeedback: userRating,
    }
  );
  
  console.log(
    `[ML] Feedback recorded for ${skillId}: ` +
    `${userAccepted ? 'accepted' : 'rejected'} ` +
    `(score=${record.score.toFixed(3)})`
  );
}
```

### 4.2 Database Schema Setup

```sql
-- ML Models storage
CREATE TABLE IF NOT EXISTS sf_ml_models (
  id SERIAL PRIMARY KEY,
  skill_id VARCHAR(100) NOT NULL,
  model_type VARCHAR(50) NOT NULL, -- 'threshold_mab'
  features JSONB NOT NULL,
  performance_metrics JSONB DEFAULT '{}',
  version VARCHAR(20) DEFAULT '1.0.0',
  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_skill_model UNIQUE (skill_id, model_type)
);

-- Feedback data for model training
CREATE TABLE IF NOT EXISTS sf_ml_feedback (
  id SERIAL PRIMARY KEY,
  skill_id VARCHAR(100) NOT NULL,
  context_hash VARCHAR(64), -- Hash of input context for deduplication
  threshold_used DECIMAL(4,3) NOT NULL, -- Threshold value used (0.000-1.000)
  activation_score DECIMAL(4,3) NOT NULL, -- Calculated skill score
  success BOOLEAN NOT NULL, -- Whether activation was relevant/successful
  latency_ms INTEGER, -- Time taken for activation
  features JSONB, -- Extracted features for analysis
  user_feedback INTEGER, -- Optional explicit user rating (1-5)
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_feedback_skill_time (skill_id, created_at),
  INDEX idx_feedback_hash (context_hash)
);

-- Performance aggregation view
CREATE OR REPLACE VIEW ml_performance_daily AS
SELECT 
  skill_id,
  DATE(created_at) as date,
  COUNT(*) as total_activations,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful_activations,
  AVG(CASE WHEN success THEN activation_score END) as avg_success_score,
  AVG(CASE WHEN NOT success THEN activation_score END) as avg_failure_score,
  AVG(threshold_used) as avg_threshold,
  AVG(latency_ms) as avg_latency,
  SUM(CASE WHEN success THEN 1 ELSE 0 END)::DECIMAL / COUNT(*) as success_rate
FROM sf_ml_feedback
GROUP BY skill_id, DATE(created_at)
ORDER BY date DESC, skill_id;

-- Retention policy (90 days for feedback data)
CREATE OR REPLACE FUNCTION cleanup_old_ml_feedback()
RETURNS void AS $$
BEGIN
  DELETE FROM sf_ml_feedback 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  RAISE NOTICE 'Cleaned up old ML feedback data';
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (run weekly)
SELECT cron.schedule('cleanup-ml-feedback', '0 2 * * 0', 'SELECT cleanup_old_ml_feedback();');
```

### 4.3 Environment Configuration

```bash
# .env file additions

# ML Thresholds Configuration
ML_THRESHOLDS_ENABLED=true
ML_THRESHOLDS_MODE=production  # 'shadow' | 'canary' | 'production'

# Multi-Armed Bandit settings
ML_MAB_EXPLORATION_RATE=0.1
ML_MAB_GRANULARITY=0.05

# Performance settings
ML_CACHE_TTL=3600  # seconds
ML_BATCH_SIZE=100
ML_UPDATE_FREQUENCY=100  # updates before persisting

# Feature extraction settings
ML_MAX_CONTEXT_HASHES=1000
ML_FEATURE_CACHE_ENABLED=true

# A/B Testing (canary deployment)
ML_CANARY_PERCENTAGE=10
ML_CANARY_USER_COOKIE=ml_canary_user

# Monitoring
ML_METRICS_ENABLED=true
ML_ALERT_THRESHOLD_ACCURACY=0.85
ML_ALERT_THRESHOLD_CONVERGENCE=1000  # iterations without improvement
```

---

## 5. Feature Extraction Deep Dive

### 5.1 Prompt Feature Extraction

```typescript
export class PromptFeatureExtractor {
  async extract(content: string): Promise<PromptFeatures> {
    const [keywordDensity, technicalTermsRatio] = await Promise.all([
      this.calculateKeywordDensity(content),
      this.calculateTechnicalTermsRatio(content),
    ]);
    
    return {
      length: content.length,
      keywordDensity,
      fuzzyMatchScore: 0, // Will be filled by caller
      fuzzyMatchesCount: 0, // Will be filled by caller
      hasCodeBlocks: /```[\s\S]*?```/.test(content),
      hasUrls: /https?:\/\/[^\s]+/.test(content),
      hasFilePaths: /[\/\w\-\.]+\.[a-zA-Z]+/.test(content),
      technicalTermsRatio,
    };
  }
  
  private calculateKeywordDensity(content: string): number {
    // Extract potential keywords (technical terms)
    const keywords = content
      .toLowerCase()
      .match(/\b[a-z]{4,}\b/g) || [];
    
    const uniqueKeywords = new Set(keywords);
    return uniqueKeywords.size / (content.length / 100); // per 100 chars
  }
  
  private calculateTechnicalTermsRatio(content: string): number {
    // Common technical terms dictionary
    const technicalTerms = [
      'api', 'database', 'endpoint', 'authentication', 'authorization',
      'middleware', 'framework', 'component', 'hook', 'context',
      'async', 'await', 'promise', 'callback', 'event', 'listener',
      // Add more based on your domain
    ];
    
    const words = content.toLowerCase().split(/\W+/);
    const technicalCount = words.filter(w => technicalTerms.includes(w)).length;
    
    return technicalCount / words.length;
  }
}
```

### 5.2 Context Feature Extraction

```typescript
export class ContextFeatureExtractor {
  async extract(input: PreHookInput): Promise<ContextFeatures> {
    const [
      projectType,
      modifiedFileTypes,
      teamSize,
      recentSimilar,
      userSuccessRate,
      timeSinceLast,
      systemLoad,
    ] = await Promise.all([
      this.detectProjectType(input),
      this.extractFileTypes(input),
      this.estimateTeamSize(input),
      this.getRecentActivations(input),
      this.getUserSuccessRate(input.userId),
      this.getTimeSinceLastActivation(input.userId),
      this.getSystemLoad(),
    ]);
    
    const now = new Date();
    
    return {
      projectType,
      modifiedFileTypes,
      teamSize,
      recentSimilarActivations: recentSimilar,
      userSuccessRate,
      timeSinceLastActivation: timeSinceLast,
      currentHour: now.getHours(),
      dayOfWeek: now.getDay(),
      systemLoad,
    };
  }
  
  private async detectProjectType(input: PreHookInput): Promise<string> {
    // Detect based on modified files, dependencies, etc.
    // This is a simplified version
    
    const files = input.filesModified || [];
    const fileTypes = files.map(f => f.split('.').pop()?.toLowerCase());
    
    if (fileTypes.includes('tsx') || fileTypes.includes('jsx')) {
      return 'frontend';
    }
    
    if (fileTypes.includes('py') || fileTypes.includes('go')) {
      return 'backend';
    }
    
    if (fileTypes.includes('swift') || fileTypes.includes('kt')) {
      return 'mobile';
    }
    
    if (fileTypes.includes('yaml') || fileTypes.includes('yml')) {
      return 'devops';
    }
    
    return 'unknown';
  }
  
  private async getRecentActivations(input: PreHookInput): Promise<number> {
    // Check activation history in last 10 minutes
    const cutoff = Date.now() - (10 * 60 * 1000);
    
    const recentActivations = await db.query(
      `SELECT COUNT(*) 
       FROM skill_activations 
       WHERE user_id = $1 
         AND created_at > $2`,
      [input.userId, new Date(cutoff)]
    );
    
    return parseInt(recentActivations.rows[0].count);
  }
  
  private async getUserSuccessRate(userId: string): Promise<number | undefined> {
    // Get user's historical success rate
    const result = await db.query(
      `SELECT 
         SUM(CASE WHEN success THEN 1 ELSE 0 END)::DECIMAL / COUNT(*) as rate
       FROM sf_ml_feedback fe
       JOIN skill_activations sa ON fe.skill_id = sa.skill_id
       WHERE sa.user_id = $1
         AND fe.created_at > NOW() - INTERVAL '30 days'`,
      [userId]
    );
    
    const rate = result.rows[0]?.rate;
    return rate ? parseFloat(rate) : undefined;
  }
  
  private async getSystemLoad(): Promise<number> {
    // Get CPU load average (0-1 normalized)
    const loadAvg = os.loadavg()[0]; // 1-minute load average
    const cpuCount = os.cpus().length;
    return Math.min(loadAvg / cpuCount, 1.0);
  }
}
```

---

## 6. Testing Strategy

### 6.1 Unit Tests

#### DynamicThresholdManager Tests

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { DynamicThresholdManager } from '../DynamicThresholdManager.js';
import { ThresholdOptimizer } from '../ThresholdOptimizer.js';

describe('DynamicThresholdManager', () => {
  let manager: DynamicThresholdManager;
  let optimizer: ThresholdOptimizer;
  
  beforeEach(() => {
    optimizer = new ThresholdOptimizer();
    manager = new DynamicThresholdManager(
      optimizer,
      new PerSkillCustomizer(),
      new ContextAwareAdjuster(),
      new ModelPersistor(mockPgPool, mockRedisClient)
    );
  });
  
  describe('getOptimalThreshold', () => {
    it('should return threshold within bounds', async () => {
      const input = createMockInput('database verification');
      const baseThreshold = 0.5;
      
      const threshold = await manager.getOptimalThreshold(
        'database-verification',
        input,
        baseThreshold
      );
      
      expect(threshold).toBeGreaterThanOrEqual(0.1);
      expect(threshold).toBeLessThanOrEqual(0.9);
    });
    
    it('should apply contextual adjustments', async () => {
      const input = createMockInput('implement auth');
      const baseThreshold = 0.5;
      
      const threshold = await manager.getOptimalThreshold(
        'backend-dev-guidelines',
        input,
        baseThreshold
      );
      
      // Should be adjusted for backend context
      expect(threshold).not.toBe(baseThreshold);
    });
  });
  
  describe('updateModel', () => {
    it('should update model with positive feedback', async () => {
      const input = createMockInput('check database connection');
      const threshold = 0.5;
      
      await manager.updateModel(
        'database-verification',
        input,
        threshold,
        true,
        { score: 0.8, latencyMs: 100 }
      );
      
      // Verify model was updated (check internal state or database)
      const model = await optimizer.getModel('database-verification');
      expect(model.performance.successCount).toBe(1);
    });
  });
});

function createMockInput(content: string): PreHookInput {
  return {
    content,
    userId: 'test-user',
    filesModified: [],
    timestamp: new Date(),
  };
}
```

#### Thompson Sampling Tests

```typescript
describe('ThompsonSampling', () => {
  it('should converge to optimal arm over time', async () => {
    const bandit = new ThompsonSampling();
    
    // Simulate 1000 trials with arm 0.5 having highest reward
    for (let i = 0; i < 1000; i++) {
      const arm = bandit.selectArm(thresholdSpace, mockContext);
      
      // Reward arm 0.5 more frequently
      const reward = arm === 0.5 ? 1.0 : 0.3;
      bandit.update(arm, reward);
    }
    
    // After many trials, should select optimal arm (0.5) more often
    let optimalCount = 0;
    for (let i = 0; i < 100; i++) {
      const arm = bandit.selectArm(thresholdSpace, mockContext);
      if (arm === 0.5) optimalCount++;
    }
    
    expect(optimalCount).toBeGreaterThan(50); // Should pick optimal >50% of time
  });
});
```

### 6.2 Integration Tests

#### End-to-End Activation Test

```typescript
describe('ML Threshold Integration', () => {
  it('should improve activation precision over time', async () => {
    const skillId = 'backend-dev-guidelines';
    
    // Simulate multiple activations with feedback
    for (let i = 0; i < 200; i++) {
      const input = createBackendContext();
      const threshold = await thresholdManager.getOptimalThreshold(
        skillId,
        input,
        0.55
      );
      
      // Simulate activation result (50% success rate)
      const success = Math.random() > 0.5;
      
      await thresholdManager.updateModel(
        skillId,
        input,
        threshold,
        success,
        {
          score: success ? 0.7 : 0.4,
          latencyMs: 50,
        }
      );
    }
    
    // After learning, precision should improve
    const metrics = await persistor.getPerformanceMetrics(skillId, 1);
    
    expect(metrics.successRate).toBeGreaterThan(0.65);
  });
});
```

### 6.3 A/B Testing Framework

```typescript
export class ABTestFramework {
  async isInTestGroup(userId: string): Promise<boolean> {
    // Hash user ID to determine test group
    const hash = crypto.createHash('md5').update(userId).digest('hex');
    const hashInt = parseInt(hash.substring(0, 8), 16);
    const percentage = parseInt(process.env.ML_CANARY_PERCENTAGE || '10');
    
    return (hashInt % 100) < percentage;
  }
  
  async recordTestMetrics(
    testGroup: 'control' | 'variant',
    skillId: string,
    success: boolean,
    latency: number
  ): Promise<void> {
    await db.query(
      `INSERT INTO ab_test_metrics 
         (test_group, skill_id, success, latency, created_at)
       VALUES 
         ($1, $2, $3, $4, NOW())`,
      [testGroup, skillId, success, latency]
    );
  }
  
  async compareTestResults(
    skillId: string,
    days: number = 14
  ): Promise<ABTestResult> {
    const result = await db.query(
      `SELECT 
         test_group,
         COUNT(*) as total,
         SUM(CASE WHEN success THEN 1 ELSE 0 END) as success_count,
         AVG(latency) as avg_latency
       FROM ab_test_metrics
       WHERE skill_id = $1
         AND created_at > NOW() - INTERVAL '${days} days'
       GROUP BY test_group`,
      [skillId]
    );
    
    // Calculate statistical significance, etc.
    return {
      control: extractMetrics(result.rows, 'control'),
      variant: extractMetrics(result.rows, 'variant'),
      // ... statistical analysis
    };
  }
}
```

---

## 7. Monitoring & Observability

### 7.1 Key Metrics Dashboard

```typescript
export class MLMetricsCollector {
  private metrics: Map<string, MetricCounter> = new Map();
  
  async recordThresholdOptimization(
    skillId: string,
    baseThreshold: number,
    mlThreshold: number,
    success: boolean
  ): Promise<void> {
    // Track threshold adjustment amount
    const adjustment = mlThreshold - baseThreshold;
    this.increment('threshold_adjustments_total', skillId);
    this.record('threshold_adjustment_amount', adjustment, { skillId });
    
    // Track success rate
    if (success) {
      this.increment('ml_activations_success_total', skillId);
    } else {
      this.increment('ml_activations_failure_total', skillId);
    }
  }
  
  async recordModelPerformance(
    skillId: string,
    accuracy: number,
    convergence: number
  ): Promise<void> {
    this.record('model_accuracy', accuracy, { skillId });
    this.record('model_convergence', convergence, { skillId });
  }
  
  async getMetricsSummary(skillId: string): Promise<MetricsSummary> {
    // Query Prometheus or time-series DB
    // This is a simplified version
    return {
      totalActivations: await this.getCounter('ml_activations_total', skillId),
      successRate: await this.getSuccessRate(skillId),
      avgThresholdAdjustment: await this.getAvgAdjustment(skillId),
      modelAccuracy: await this.getLatestValue('model_accuracy', skillId),
      cacheHitRate: await this.getCacheHitRate(),
    };
  }
}

// PromQL queries for Grafana dashboard
const PROMETHEUS_QUERIES = {
  mlActivationSuccessRate: `
    sum(rate(ml_activations_success_total[5m])) by (skill_id)
    / 
    sum(rate(ml_activations_total[5m])) by (skill_id)
  `,
  
  avgThresholdAdjustment: `
    avg(threshold_adjustment_amount) by (skill_id)
  `,
  
  modelAccuracy: `
    avg(model_accuracy) by (skill_id)
  `,
  
  cacheHitRate: `
    rate(redis_cache_hits_total[5m]) 
    / (rate(redis_cache_hits_total[5m]) + rate(redis_cache_misses_total[5m]))
  `,
};
```

### 7.2 Alerting Rules

```yaml
# alerts.yml
groups:
  - name: ml-threshold-alerts
    rules:
      - alert: MLModelAccuracyLow
        expr: avg(model_accuracy) < 0.85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "ML Model accuracy degraded"
          description: "Model accuracy for {{ $labels.skill_id }} is {{ $value }}"
      
      - alert: MLThresholdStagnation
        expr: increase(model_convergence_total[1h]) == 0
        for: 15m
        labels:
          severity: warning
        annotations:
          summary: "ML Model not learning"
          description: "Model {{ $labels.skill_id }} hasn't converged in 1 hour"
      
      - alert: MLSkillSuccessRateDrop
        expr: |
          (
            sum(rate(ml_activations_success_total[5m])) by (skill_id)
            / 
            sum(rate(ml_activations_total[5m])) by (skill_id)
          ) < 0.60
        for: 10m
        labels:
          severity: critical
        annotations:
          summary: "Skill activation success rate dropped"
          description: "Success rate for {{ $labels.skill_id }}: {{ $value }}"
      
      - alert: MLExcessiveThresholdAdjustments
        expr: abs(avg(threshold_adjustment_amount)) > 0.2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Large threshold adjustments detected"
          description: "Avg adjustment for {{ $labels.skill_id }}: {{ $value }}"
```

---

## 8. Deployment Strategy

### 8.1 Phased Rollout Plan

#### Phase 1: Shadow Mode (Week 1)
```typescript
// Configuration
ML_THRESHOLDS_MODE=shadow

// In DynamicThresholdManager
async getOptimalThreshold(skillId, input, baseThreshold) {
  if (ML_THRESHOLDS_MODE === 'shadow') {
    // Calculate ML threshold but don't apply it
    const mlThreshold = await this.calculateMLThreshold(skillId, input, baseThreshold);
    
    // Log the decision for analysis
    this.logShadowDecision(skillId, baseThreshold, mlThreshold, input);
    
    // Return base threshold
    return baseThreshold;
  }
  
  // Normal operation
  return await this.calculateMLThreshold(skillId, input, baseThreshold);
}
```

**Goals:**
- Collect 1000+ samples per skill
- Validate feature extraction
- Tune hyper-parameters

**Success Criteria:**
- No performance degradation
- Shadow decisions logged correctly
- Feature extraction working

#### Phase 2: Canary Deployment (Week 2)
```typescript
// Configuration
ML_THRESHOLDS_MODE=canary
ML_CANARY_PERCENTAGE=10

// User assignment
async getOptimalThreshold(skillId, input, baseThreshold) {
  const isCanaryUser = await abTestFramework.isInTestGroup(input.userId);
  
  if (ML_THRESHOLDS_MODE === 'canary' && !isCanaryUser) {
    return baseThreshold;
  }
  
  // Canaries use ML thresholds
  return await this.calculateMLThreshold(skillId, input, baseThreshold);
}
```

**Goals:**
- Deploy to 10% of users
- Monitor closely for issues
- Compare success rates

**Success Criteria:**
- ≥95% uptime
- Success rate improvement >5%
- No error rate increase

#### Phase 3: Gradual Expansion (Week 3)
```typescript
// Gradually increase percentage
ML_CANARY_PERCENTAGE=50
// Monitor for 3 days, then:
ML_CANARY_PERCENTAGE=100
```

**Goals:**
- Expand to 50%, then 100%
- Monitor metrics closely
- Prepare rollback

**Success Criteria:**
- Stable metrics at 50%
- No incidents during expansion
- Rollback plan tested

#### Phase 4: Full Production (Week 4)
```typescript
ML_THRESHOLDS_MODE=production
ML_CANARY_PERCENTAGE=100
```

**Goals:**
- Full deployment
- Continuous monitoring
- Performance optimization

**Success Criteria:**
- All metrics green
- 10-15% improvement achieved
- Documentation complete

### 8.2 Rollback Strategy

```typescript
export class RollbackManager {
  async rollbackToStaticThresholds(skillId?: string): Promise<void> {
    // Update feature flag
    await featureFlags.setFlag('ml_thresholds_enabled', false);
    
    // Restore static thresholds
    if (skillId) {
      await this.restoreStaticThreshold(skillId);
    } else {
      await this.restoreAllStaticThresholds();
    }
    
    // Invalidate ML models
    await redis.del('ml:models:*');
    
    console.log(`[ML] Rollback completed for ${skillId || 'all skills'}`);
  }
  
  private async restoreStaticThreshold(skillId: string): Promise<void> {
    const staticThreshold = STATIC_THRESHOLDS[skillId];
    
    await db.query(
      `UPDATE sf_ml_models 
       SET features = $2, last_updated = NOW()
       WHERE skill_id = $1`,
      [skillId, { fallbackToStatic: true, staticValue: staticThreshold }]
    );
  }
}

// Emergency rollback command
// skills-cli daemon rollback-ml --skill <skillId> --reason "description"
```

### 8.3 Configuration Management

```typescript
// config/ml-config.ts
export const ML_CONFIG = {
  enabled: process.env.ML_THRESHOLDS_ENABLED === 'true',
  mode: process.env.ML_THRESHOLDS_MODE || 'shadow', // shadow | canary | production
  
  // Model settings
  modelVersion: '2.2.0',
  persistenceInterval: 100, // updates before persisting
  
  // Multi-Armed Bandit
  mab: {
    explorationRate: parseFloat(process.env.ML_MAB_EXPLORATION_RATE || '0.1'),
    granularity: parseFloat(process.env.ML_MAB_GRANULARITY || '0.05'),
    minThreshold: 0.1,
    maxThreshold: 0.9,
  },
  
  // Performance
  cache: {
    ttl: parseInt(process.env.ML_CACHE_TTL || '3600'),
    enabled: process.env.ML_FEATURE_CACHE_ENABLED === 'true',
  },
  
  // A/B Testing
  abTest: {
    canaryPercentage: parseInt(process.env.ML_CANARY_PERCENTAGE || '10'),
    testDuration: '14d',
    minSampleSize: 1000,
  },
  
  // Monitoring
  monitoring: {
    enabled: process.env.ML_METRICS_ENABLED === 'true',
    alertAccuracy: parseFloat(process.env.ML_ALERT_THRESHOLD_ACCURACY || '0.85'),
    alertConvergence: parseInt(process.env.ML_ALERT_THRESHOLD_CONVERGENCE || '1000'),
  },
};
```

---

## 9. Performance Considerations

### 9.1 Latency Optimization

```typescript
export class ThresholdManagerOptimized extends DynamicThresholdManager {
  private featureCache: LRUCache<string, ExtractedFeatures>;
  private modelCache: LRUCache<string, SkillModel>;
  
  constructor() {
    super(...);
    this.featureCache = new LRUCache({ max: 10000, ttl: 60000 }); // 1 min cache
    this.modelCache = new LRUCache({ max: 1000, ttl: 3600000 }); // 1 hour cache
  }
  
  async getOptimalThreshold(
    skillId: string,
    input: PreHookInput,
    baseThreshold: number
  ): Promise<number> {
    // Check cache first
    const cacheKey = this.getCacheKey(input);
    const cachedFeatures = this.featureCache.get(cacheKey);
    
    if (cachedFeatures) {
      return this.getThresholdFromCachedFeatures(
        skillId,
        cachedFeatures,
        baseThreshold
      );
    }
    
    // Only compute if not cached
    return await super.getOptimalThreshold(skillId, input, baseThreshold);
  }
  
  private getCacheKey(input: PreHookInput): string {
    // Hash content for cache key
    return crypto
      .createHash('sha256')
      .update(input.content)
      .digest('hex')
      .substring(0, 16);
  }
}
```

**Performance Targets:**
- Feature extraction: <20ms
- ML inference: <30ms
- Total overhead: <50ms per activation

### 9.2 Memory Management

```typescript
// Limit in-memory model storage
class ThresholdOptimizer {
  private maxCachedModels = 100;
  private modelAccessOrder: string[] = [];
  
  async cacheModel(skillId: string, model: SkillModel): Promise<void> {
    if (this.modelStore.size >= this.maxCachedModels) {
      // Remove least recently used model
      const lruSkillId = this.modelAccessOrder.shift();
      if (lruSkillId) {
        await this.persistor.saveModel(this.modelStore.get(lruSkillId));
        this.modelStore.delete(lruSkillId);
      }
    }
    
    this.modelStore.set(skillId, model);
    this.modelAccessOrder.push(skillId);
  }
}
```

---

## 10. Risk Mitigation

### 10.1 Model Degradation

**Risk:** Model accuracy degrades over time  
**Probability:** Medium  
**Impact:** High  

**Mitigation:**
```typescript
// Monitor model accuracy continuously
async checkModelHealth(skillId: string): Promise<HealthStatus> {
  const metrics = await this.persistor.getPerformanceMetrics(skillId, 7);
  
  if (metrics.successRate < 0.85) {
    return {
      status: 'degraded',
      action: 'retrain',
      reason: `Success rate ${metrics.successRate} below threshold`,
    };
  }
  
  return { status: 'healthy' };
}

// Auto-retrain on degradation
async handleModelDegradation(skillId: string): Promise<void> {
  console.warn(`[ML] Model degradation detected for ${skillId}`);
  
  // 1. Increase exploration rate
  await this.increaseExplorationRate(skillId);
  
  // 2. Retrain model from recent data
  await this.retrainModel(skillId);
  
  // 3. If still degraded, fallback to static thresholds
  if (await this.checkModelHealth(skillId).status === 'degraded') {
    await this.rollbackToStatic(skillId);
    await this.alertOperations(skillId);
  }
}
```

### 10.2 Cold Start Problem

**Risk:** New skills have no training data  
**Probability:** High  
**Impact:** Medium  

**Mitigation:**
```typescript
class PerSkillCustomizer {
  // Use similar skill's model as starting point
  async getStartingModel(skillId: string): Promise<SkillModel> {
    // Find similar skill based on category/enforcement level
    const similarSkill = await this.findSimilarSkill(skillId);
    
    if (similarSkill) {
      const baseModel = await this.loadModel(similarSkill);
      return this.adaptModelForSkill(baseModel, skillId);
    }
    
    // Fallback to default model
    return this.createDefaultModel(skillId);
  }
  
  // Use conservative defaults initially
  private createDefaultModel(skillId: string): SkillModel {
    return {
      skillId,
      config: {
        thresholdSpace: {
          granularity: 0.05,
          minThreshold: 0.1,
          maxThreshold: 0.9,
          explorationRate: 0.3, // High exploration for new skills
        },
      },
      performance: { /* zeros */ },
      version: '1.0.0',
    };
  }
}
```

### 10.3 Feedback Loop Delays

**Risk:** User feedback delayed, model updates lag  
**Probability:** Medium  
**Impact:** Low  

**Mitigation:**
```typescript
// Use proxy signals when explicit feedback unavailable
async calculateProxyReward(
  skillId: string,
  activation: ActivationRecord
): Promise<number> {
  // 1. Check if user actioned on the skill suggestion
  if (activation.userActioned) {
    return activation.userActioned === 'accepted' ? 1.0 : -0.5;
  }
  
  // 2. Check for rapid rejection (within 5 seconds)
  const timeToDismiss = activation.timeToDismiss || 0;
  if (timeToDismiss < 5000) {
    return -0.7; // Strong rejection
  }
  
  // 3. Check if similar skills activated in succession
  if (activation.followedBySimilar) {
    return 0.8; // Likely relevant
  }
  
  // 4. Default: small positive reward
  return 0.2;
}
```

### 10.4 Data Privacy

**Risk:** User content in ML feedback data  
**Probability:** Low  
**Impact:** High  

**Mitigation:**
```typescript
// Hash content before storing
class ModelPersistor {
  async recordFeedback(feedback: FeedbackRecord): Promise<void> {
    // Hash the content to avoid storing actual text
    feedback.contextHash = this.hashContent(feedback.input.content);
    
    // Don't store full content
    delete feedback.input.content;
    
    await db.query(/* insert with hashed context only */);
  }
  
  private hashContent(content: string): string {
    // Use SHA-256 hash
    return crypto.createHash('sha256').update(content).digest('hex');
  }
}

// Data retention policy
const RETENTION_POLICY = {
  feedbackData: '90 days',
  modelSnapshots: '1 year',
  aggregatedMetrics: '2 years',
};
```

---

## 11. Success Metrics & KPIs

### 11.1 Primary KPIs

| Metric | Current | Target | Measurement |
|--------|---------|---------|-------------|
| Activation Precision | 78% | **90%+** | `successful_activations / total_activations` |
| False Positive Rate | 22% | **<10%** | `rejected_activations / total_activations` |
| Average Threshold Adjustment | N/A | **±15%** | `avg(abs(ml_threshold - base_threshold))` |
| Model Convergence Time | N/A | **<500 iterations** | `iterations_until_stable_threshold` |
| User Satisfaction | 7.2/10 | **8.5+/10** | User rating after activation |

### 11.2 Secondary Metrics

- **Latency Overhead**: <50ms per activation
- **Cache Hit Rate**: >80%
- **Model Accuracy**: >85%
- **Feature Extraction Time**: <20ms
- **Error Rate**: <0.1%

### 11.3 A/B Test Metrics

```sql
-- Compare control vs variant
SELECT 
  test_group,
  COUNT(*) as total,
  SUM(CASE WHEN success THEN 1 ELSE 0 END)::DECIMAL / COUNT(*) as success_rate,
  AVG(latency_ms) as avg_latency,
  STDDEV(threshold_used) as threshold_stddev
FROM ab_test_metrics
WHERE skill_id = $1
  AND created_at > NOW() - INTERVAL '14 days'
GROUP BY test_group;
```

Expected Results:
- Control: 78% success rate
- Variant: 88% success rate (+10 percentage points)
- p-value < 0.05 (statistically significant)

---

## 12. Implementation Timeline

### Week 1: Foundation
**Days 1-2: Database Setup**
- [ ] Create `sf_ml_models` and `sf_ml_feedback` tables
- [ ] Set up indexes and constraints
- [ ] Create aggregation views
- [ ] Test schema with sample data

**Days 3-4: Core Classes**
- [ ] Implement `DynamicThresholdManager`
- [ ] Implement `ThresholdOptimizer` with Thompson Sampling
- [ ] Implement `PerSkillCustomizer`
- [ ] Unit tests for core classes (>90% coverage)

**Days 5-7: Feature Extraction**
- [ ] Implement `PromptFeatureExtractor`
- [ ] Implement `ContextFeatureExtractor`
- [ ] Test feature extraction with real data
- [ ] Performance optimization (<20ms)

### Week 2: Integration
**Days 8-9: System Integration**
- [ ] Integrate with `detectors.ts`
- [ ] Add ML threshold hooks to `matchRulesFor()`
- [ ] Test integration with existing tests
- [ ] Performance testing

**Days 10-12: Persistence Layer**
- [ ] Implement `ModelPersistor`
- [ ] Set up Redis caching
- [ ] Test save/load operations
- [ ] Implement model versioning

**Days 13-14: Shadow Mode**
- [ ] Deploy to shadow mode
- [ ] Monitor shadow decisions
- [ ] Collect baseline metrics
- [ ] Validate data pipeline

### Week 3: Testing & Deployment
**Days 15-17: Testing**
- [ ] End-to-end integration tests
- [ ] A/B test framework
- [ ] Performance testing under load
- [ ] Chaos engineering tests

**Days 18-19: Monitoring**
- [ ] Set up Prometheus metrics
- [ ] Configure Grafana dashboards
- [ ] Set up alerting rules
- [ ] Create runbooks

**Days 20-21: Canary Deployment**
- [ ] Deploy to 10% canary
- [ ] Monitor closely
- [ ] Gradual rollout to 50%, then 100%
- [ ] Success criteria validation

### Week 4: Production & Optimization
**Days 22-28: Production**
- [ ] Full production deployment
- [ ] Continuous monitoring
- [ ] Performance tuning
- [ ] Documentation completion

---

## 13. Resource Requirements

### Development Effort
- **Senior Developer**: 3 weeks full-time
- **DevOps Engineer**: 1 week (setup, monitoring)
- **QA Engineer**: 1 week (testing)

### Infrastructure
- **Database**: Additional ~1GB storage per month
- **Redis**: ~512MB cache
- **CPU**: +5% router service
- **Monitoring**: 2 Grafana dashboards, 5 alerts

### Costs
- **Development**: 5 person-weeks
- **Infrastructure**: +$50/month (minimal impact)
- **Total**: ~$15K (conservative estimate)

---

## 14. Post-Launch Activities

### 14.1 Continuous Monitoring
- Daily metrics review (success rate, latency)
- Weekly model health checks
- Monthly performance reports

### 14.2 Model Retraining
- Automatic weekly retraining
- A/B testing for new features
- Hyperparameter tuning

### 14.3 User Feedback Collection
- In-app rating system
- User interviews (quarterly)
- NPS surveys

---

## 15. Conclusion

Dynamic Thresholds v2.2 represents a significant advancement in skill activation optimization for the Skills Fabric system. By leveraging Multi-Armed Bandit algorithms and contextual features, we expect to achieve:

1. **+10-15% improvement** in activation precision
2. **Automated optimization** without manual tuning
3. **Adaptive thresholds** that learn and improve
4. **Better user experience** with fewer false positives

The implementation is designed to be:
- **Low-risk**: Phased rollout with rollback capability
- **High-impact**: Significant improvement in core metric
- **Maintainable**: Clear architecture with comprehensive tests
- **Scalable**: Redis caching and efficient algorithms

**Next Steps:**
1. Review and approve this document
2. Set up development environment
3. Begin Week 1 implementation
4. Weekly check-ins with stakeholders

---

## References

- [Multi-Armed Bandit Algorithms](https://arxiv.org/abs/1209.3087)
- [Thompson Sampling for Contextual Bandits](https://arxiv.org/abs/1301.1938)
- [Fuzzy Matching v1.0 Documentation](../IMPLEMENTED/fuzzy-matching-v1.0.md)
- [Contextual Boost v2.0 Documentation](../IMPLEMENTED/contextual-boost-v2.0.md)
- [Skills Fabric Architecture Overview](../../architecture/README.md)

---

**Document Status**: ✅ Complete  
**Review Required**: Engineering Lead, DevOps Lead  
**Approval Required**: Technical Steering Committee  
**Implementation Start Date**: TBD  
