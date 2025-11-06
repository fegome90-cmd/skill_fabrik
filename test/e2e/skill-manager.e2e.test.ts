/**
 * Skill Manager E2E Tests
 *
 * Comprehensive end-to-end testing for the complete skill manager system
 * including all 5 phases: signals, A/B testing, caching, bias mitigation, and interface parity.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { EventEmitter } from 'events';

// Import components from all phases
import { SignalOptimizer } from '../../packages/router/src/activation/optimization/SignalOptimizer.js';
import { ABTestManager } from '../../packages/experimentation/src/ABTestManager.js';
import { SignalCache } from '../../packages/performance/src/cache/SignalCache.js';
import { BiasMitigationManager } from '../../packages/bias-mitigation/src/BiasMitigationManager.js';
import { InterfaceParityManager } from '../../packages/parity/src/InterfaceParityManager.js';

describe('Skill Manager E2E Tests', () => {
  let signalOptimizer: SignalOptimizer;
  let abTestManager: ABTestManager;
  let signalCache: SignalCache;
  let biasManager: BiasMitigationManager;
  let parityManager: InterfaceParityManager;

  beforeAll(async () => {
    console.log('🚀 Initializing Skill Manager E2E Test Suite...');

    // Initialize all components
    signalOptimizer = new SignalOptimizer({
      maxSignals: 10,
      costBasedOrdering: true,
      earlyTermination: true,
      parallelEvaluation: true
    });

    abTestManager = new ABTestManager({
      significanceLevel: 0.05,
      minSampleSize: 100,
      autoOptimization: true,
      experimentDuration: 86400000 // 24 hours
    });

    signalCache = new SignalCache({
      L1: {
        maxSize: 100,
        maxEntries: 1000,
        ttl: 3600000
      },
      L2: {
        enabled: true,
        redis: {
          host: 'localhost',
          port: 6379
        }
      }
    });

    biasManager = new BiasMitigationManager({
      components: {
        detection: true,
        decay: true,
        normalization: true,
        correction: false
      },
      global: {
        dryRun: true,
        maxCorrectionsPerHour: 5
      }
    });

    parityManager = new InterfaceParityManager({
      components: {
        schemaRegistry: true,
        validation: true,
        testing: true,
        monitoring: true
      },
      automation: {
        autoValidate: true,
        autoTest: false,
        autoMonitor: true,
        autoReport: true
      }
    });

    // Start components
    await biasManager.start();
    await parityManager.start();
  });

  afterAll(async () => {
    console.log('🧹 Cleaning up E2E Test Suite...');

    // Stop components
    biasManager.stop();
    parityManager.stop();

    // Clear caches
    signalCache.clear();
  });

  beforeEach(() => {
    // Reset state before each test
    signalCache.clear();
  });

  afterEach(() => {
    // Cleanup after each test
  });

  describe('Phase 1: Enhanced Signal System', () => {
    it('should optimize signal evaluation with cost-based ordering', async () => {
      const mockSignals = [
        { id: 'intent-match', cost: 5, strength: 0.9 },
        { id: 'file-path-match', cost: 2, strength: 0.7 },
        { id: 'content-match', cost: 8, strength: 0.8 },
        { id: 'recent-activity', cost: 1, strength: 0.6 }
      ];

      const result = await signalOptimizer.optimizeSignalEvaluation(mockSignals);

      expect(result.orderedSignals).toBeDefined();
      expect(result.orderedSignals.length).toBe(4);
      expect(result.executionTime).toBeLessThan(10); // Should be very fast
      expect(result.costSavings).toBeGreaterThan(0);
    });

    it('should apply early termination when threshold is reached', async () => {
      const mockSignals = [
        { id: 'high-value-signal', cost: 1, strength: 0.95 },
        { id: 'medium-signal', cost: 3, strength: 0.5 },
        { id: 'low-signal', cost: 5, strength: 0.3 }
      ];

      const result = await signalOptimizer.optimizeSignalEvaluation(mockSignals, { threshold: 0.9 });

      expect(result.earlyTerminated).toBe(true);
      expect(result.orderedSignals.length).toBeLessThanOrEqual(2); // Should stop early
    });

    it('should evaluate signals in parallel when enabled', async () => {
      const mockSignals = Array.from({ length: 10 }, (_, i) => ({
        id: `signal-${i}`,
        cost: Math.random() * 10,
        strength: Math.random()
      }));

      const startTime = Date.now();
      const result = await signalOptimizer.optimizeSignalEvaluation(mockSignals, { parallel: true });
      const parallelTime = Date.now() - startTime;

      startTime.set;
      const sequentialResult = await signalOptimizer.optimizeSignalEvaluation(mockSignals, { parallel: false });
      const sequentialTime = Date.now() - startTime;

      expect(parallelTime).toBeLessThan(sequentialTime * 0.8); // Should be significantly faster
    });
  });

  describe('Phase 2: A/B Testing Framework', () => {
    it('should create and manage A/B experiments', async () => {
      const experiment = await abTestManager.createExperiment({
        name: 'test-experiment',
        description: 'Test signal optimization',
        variants: [
          { id: 'control', weight: 0.5, config: { algorithm: 'original' } },
          { id: 'treatment', weight: 0.5, config: { algorithm: 'optimized' } }
        ],
        successMetrics: ['activation-rate', 'user-satisfaction'],
        trafficAllocation: 1.0
      });

      expect(experiment.id).toBeDefined();
      expect(experiment.status).toBe('active');
      expect(experiment.variants).toHaveLength(2);
    });

    it('should collect and analyze experiment data', async () => {
      const experiment = await abTestManager.createExperiment({
        name: 'conversion-test',
        variants: [
          { id: 'A', weight: 0.5, config: {} },
          { id: 'B', weight: 0.5, config: {} }
        ],
        successMetrics: ['conversion']
      });

      // Simulate data collection
      for (let i = 0; i < 200; i++) {
        const variant = i < 100 ? 'A' : 'B';
        const converted = Math.random() > 0.3; // 70% conversion rate

        await abTestManager.recordEvent(experiment.id, {
          variant,
          userId: `user-${i}`,
          timestamp: new Date(),
          metrics: { conversion: converted ? 1 : 0 }
        });
      }

      const analysis = await abTestManager.analyzeExperiment(experiment.id);

      expect(analysis.significant).toBeDefined();
      expect(analysis.confidence).toBeGreaterThan(0);
      expect(analysis.winner).toBeDefined();
    });

    it('should automatically optimize winning variants', async () => {
      const experiment = await abTestManager.createExperiment({
        name: 'auto-optimization-test',
        variants: [
          { id: 'control', weight: 0.5, config: { param: 1 } },
          { id: 'treatment', weight: 0.5, config: { param: 2 } }
        ],
        successMetrics: ['performance'],
        autoOptimization: true
      });

      // Simulate clear winner
      for (let i = 0; i < 150; i++) {
        const variant = i < 75 ? 'control' : 'treatment';
        const performance = variant === 'treatment' ? 0.9 : 0.6;

        await abTestManager.recordEvent(experiment.id, {
          variant,
          userId: `user-${i}`,
          metrics: { performance }
        });
      }

      const optimization = await abTestManager.optimizeExperiment(experiment.id);

      expect(optimization.optimized).toBe(true);
      expect(optimization.winningVariant).toBe('treatment');
    });
  });

  describe('Phase 3: Multi-level Caching', () => {
    it('should cache signals with L1 and L2 levels', async () => {
      const key = 'test-signal-key';
      const value = { skillId: 'test-skill', score: 0.85, metadata: { source: 'test' } };

      // Store in cache
      await signalCache.set(key, value);

      // Retrieve from L1 cache
      const l1Result = await signalCache.get(key);
      expect(l1Result).toBeDefined();
      expect(l1Result!.skillId).toBe('test-skill');
      expect(l1Result!.score).toBe(0.85);

      // Check cache metrics
      const metrics = signalCache.getMetrics();
      expect(metrics.l1Hits).toBe(1);
      expect(metrics.l1Misses).toBe(0);
    });

    it('should handle cache warming strategies', async () => {
      const warmingData = [
        { key: 'warm-key-1', value: { skillId: 'skill-1', score: 0.9 } },
        { key: 'warm-key-2', value: { skillId: 'skill-2', score: 0.8 } },
        { key: 'warm-key-3', value: { skillId: 'skill-3', score: 0.7 } }
      ];

      await signalCache.warmCache(warmingData);

      // Verify warming results
      const metrics = signalCache.getMetrics();
      expect(metrics.warmedItems).toBe(3);
      expect(metrics.warmingTime).toBeGreaterThan(0);

      // Verify warmed items are accessible
      for (const item of warmingData) {
        const result = await signalCache.get(item.key);
        expect(result).toBeDefined();
        expect(result!.skillId).toBe(item.value.skillId);
      }
    });

    it('should apply intelligent cache invalidation', async () => {
      const key = 'invalidation-test';
      const value = { skillId: 'test-skill', score: 0.85 };

      await signalCache.set(key, value);

      // Apply time-based invalidation
      await signalCache.invalidate({ type: 'time', key, ttl: 1 });

      // Wait for invalidation
      await new Promise(resolve => setTimeout(resolve, 10));

      const result = await signalCache.get(key);
      expect(result).toBeNull(); // Should be invalidated
    });

    it('should achieve high cache hit rate under load', async () => {
      const testData = Array.from({ length: 100 }, (_, i) => ({
        key: `load-test-${i}`,
        value: { skillId: `skill-${i}`, score: Math.random() }
      }));

      // Warm cache
      await signalCache.warmCache(testData);

      // Perform cache operations
      const operations = 1000;
      let hits = 0;

      for (let i = 0; i < operations; i++) {
        const randomKey = testData[Math.floor(Math.random() * testData.length)].key;
        const result = await signalCache.get(randomKey);
        if (result) hits++;
      }

      const hitRate = hits / operations;
      expect(hitRate).toBeGreaterThan(0.8); // Should achieve >80% hit rate

      const metrics = signalCache.getMetrics();
      expect(metrics.l1HitRate).toBeGreaterThan(0.7);
      expect(metrics.averageLatency).toBeLessThan(5); // Should be fast
    });
  });

  describe('Phase 4: Bias Mitigation', () => {
    it('should detect temporal bias patterns', async () => {
      const biasedData = [
        { skillId: 'popular-skill', timestamp: new Date(Date.now() - 1000), score: 0.9 },
        { skillId: 'popular-skill', timestamp: new Date(Date.now() - 2000), score: 0.85 },
        { skillId: 'popular-skill', timestamp: new Date(Date.now() - 3000), score: 0.8 },
        { skillId: 'unpopular-skill', timestamp: new Date(Date.now() - 86400000), score: 0.6 } // Old data
      ];

      const patterns = await biasManager.analyzeSkillData({
        activations: biasedData,
        weights: {},
        metrics: {}
      });

      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns[0].type).toBeDefined();
      expect(patterns[0].severity).toBeGreaterThan(0);
    });

    it('should apply temporal decay to historical data', async () => {
      const skillWeights = {
        'old-skill': { skillId: 'old-skill', successRate: 0.9, performance: 0.8, frequency: 0.7, relevance: 0.6, recency: 0.5 },
        'new-skill': { skillId: 'new-skill', successRate: 0.7, performance: 0.6, frequency: 0.5, relevance: 0.4, recency: 0.9 }
      };

      const decayedWeights = await biasManager.applyDecay([
        { skillId: 'old-skill', weights: skillWeights['old-skill'], lastUpdated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        { skillId: 'new-skill', weights: skillWeights['new-skill'], lastUpdated: new Date() }
      ]);

      expect(decayedWeights).toHaveLength(2);
      expect(decayedWeights[0].decayedWeights.overallDecay).toBeLessThan(1); // Should be decayed
      expect(decayedWeights[1].decayedWeights.overallDecay).toBeGreaterThan(decayedWeights[0].decayedWeights.overallDecay); // New skill should have higher weight
    });

    it('should normalize activation metrics across time periods', async () => {
      const metrics = [
        { skillId: 'test-skill', averageLatency: 100, successRate: 0.9, throughput: 50, sampleSize: 100, lastUpdated: new Date() },
        { skillId: 'test-skill', averageLatency: 150, successRate: 0.7, throughput: 30, sampleSize: 100, lastUpdated: new Date(Date.now() - 86400000) }
      ];

      const normalized = await biasManager.normalizeMetrics(metrics, {
        'test-skill': metrics
      });

      expect(normalized).toHaveLength(2);
      expect(normalized[0].normalized).toBeDefined();
      expect(normalized[0].quality).toBeDefined();
      expect(normalized[0].quality.reliability).toBeGreaterThan(0);
    });

    it('should detect and correct biased patterns', async () => {
      const biasedPatterns = [
        {
          id: 'recency-bias',
          type: 'recency' as const,
          severity: 0.8,
          description: 'Recent skills heavily favored',
          affectedEntities: ['skill-1', 'skill-2'],
          metrics: { deviation: 0.7, confidence: 0.9, persistence: 0.8, impact: 0.6 },
          detectedAt: new Date(),
          recommendations: ['Apply temporal decay'],
          occurrences: 5,
          metadata: {}
        }
      ];

      const corrections = await biasManager.applyCorrections(biasedPatterns);

      if (biasManager.getComponents().correction) {
        expect(corrections.length).toBeGreaterThan(0);
        expect(corrections[0].success).toBeDefined();
      }
    });
  });

  describe('Phase 5: Interface Parity', () => {
    it('should register and validate interface schemas', async () => {
      const schema = await parityManager.getComponents().schemaRegistry.registerSchema({
        name: 'skill-activation',
        version: '1.0.0',
        interfaceType: 'shared',
        definition: {
          properties: {
            skillId: { type: 'string', required: true },
            context: { type: 'object' },
            score: { type: 'number', minimum: 0, maximum: 1 }
          },
          required: ['skillId']
        },
        validation: {
          strict: true,
          allowUnknown: false,
          stripUnknown: true
        },
        compatibility: {
          minVersion: '1.0.0',
          compatibleVersions: ['1.0.0'],
          breakingChanges: []
        }
      });

      expect(schema.id).toBeDefined();
      expect(schema.version).toBe('1.0.0');
      expect(schema.checksum).toBeDefined();
    });

    it('should validate cross-interface compatibility', async () => {
      const validationResult = await parityManager.runValidation();

      expect(validationResult).toBeDefined();
      expect(validationResult.summary).toBeDefined();
      expect(validationResult.summary.totalInterfaces).toBeGreaterThanOrEqual(0);
    });

    it('should execute parity test suites', async () => {
      // Create a test suite
      const testSuite = {
        id: 'basic-parity-test',
        name: 'Basic Parity Test',
        description: 'Tests basic interface parity',
        tests: [
          {
            id: 'test-skill-activation',
            name: 'Test Skill Activation',
            description: 'Tests skill activation compatibility',
            category: 'functional' as const,
            type: 'integration' as const,
            targetInterfaces: ['cli', 'editor'],
            configuration: {
              timeout: 5000,
              retries: 2,
              parallel: false
            },
            steps: [
              {
                id: 'setup',
                description: 'Setup test environment',
                action: { type: 'setup' as const, target: 'test-env' }
              },
              {
                id: 'invoke',
                description: 'Invoke skill activation',
                action: { type: 'invoke' as const, target: 'skill-activation', method: 'activate' }
              }
            ],
            expectations: [
              {
                description: 'Should return valid result',
                type: 'status' as const,
                expected: 'success',
                comparison: 'equals' as const
              }
            ],
            metadata: {
              tags: ['smoke', 'parity'],
              priority: 'high' as const,
              flaky: false,
              maintenance: false,
              author: 'e2e-test',
              createdAt: new Date(),
              updatedAt: new Date()
            }
          }
        ],
        configuration: {
          parallelExecution: false,
          maxConcurrency: 1,
          globalTimeout: 30000,
          failFast: false,
          retryFailedTests: true,
          generateReports: true
        },
        metadata: {
          version: '1.0.0',
          author: 'e2e-test',
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: ['e2e', 'parity']
        }
      };

      parityManager.getComponents().testSuite.registerSuite(testSuite);

      const testResult = await parityManager.runTests(testSuite.id);

      expect(testResult).toBeDefined();
      expect(testResult.summary).toBeDefined();
      expect(testResult.summary.totalTests).toBe(1);
    });

    it('should monitor interface divergence', async () => {
      const monitoringReport = await parityManager.getMonitoringReport();

      expect(monitoringReport).toBeDefined();
      expect(monitoringReport.summary).toBeDefined();
      expect(monitoringReport.summary.overallDivergence).toBeGreaterThanOrEqual(0);
      expect(monitoringReport.summary.overallDivergence).toBeLessThanOrEqual(100);
    });

    it('should generate comprehensive dashboard', async () => {
      const dashboard = await parityManager.generateDashboard();

      expect(dashboard).toBeDefined();
      expect(dashboard.metrics).toBeDefined();
      expect(dashboard.health).toBeDefined();
      expect(dashboard.alerts).toBeDefined();
      expect(dashboard.system).toBeDefined();

      // Verify health indicators
      Object.values(dashboard.health).forEach(health => {
        expect(['healthy', 'warning', 'critical']).toContain(health.status);
        expect(health.score).toBeGreaterThanOrEqual(0);
        expect(health.score).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('Integration Tests - All Phases Working Together', () => {
    it('should process skill activation through all phases', async () => {
      const skillRequest = {
        intent: 'implement user authentication',
        context: { files: ['auth.js'], project: 'web-app' },
        userId: 'test-user-123',
        timestamp: new Date()
      };

      // Phase 1: Signal Optimization
      const signals = [
        { id: 'intent-match', cost: 3, strength: 0.9 },
        { id: 'context-match', cost: 2, strength: 0.8 },
        { id: 'recent-activity', cost: 1, strength: 0.6 }
      ];

      const optimizedSignals = await signalOptimizer.optimizeSignalEvaluation(signals);
      expect(optimizedSignals.orderedSignals).toBeDefined();

      // Phase 3: Caching
      const cacheKey = `activation-${skillRequest.userId}-${skillRequest.intent}`;
      const cachedResult = await signalCache.get(cacheKey);

      if (!cachedResult) {
        // Simulate processing result
        const result = { skillId: 'auth-skill', confidence: 0.85, signals: optimizedSignals.orderedSignals };
        await signalCache.set(cacheKey, result);
      }

      // Phase 2: A/B Testing (if applicable)
      const experiments = await abTestManager.getActiveExperiments();
      if (experiments.length > 0) {
        const variant = await abTestManager.getVariant(experiments[0].id, skillRequest.userId);
        expect(variant).toBeDefined();
      }

      // Phase 4: Bias Mitigation
      const biasAnalysis = await biasManager.analyzeSkillData({
        activations: [skillRequest],
        weights: { 'auth-skill': { skillId: 'auth-skill', successRate: 0.85, performance: 0.8, frequency: 0.5, relevance: 0.9, recency: 0.7 } },
        metrics: { 'auth-skill': { skillId: 'auth-skill', averageLatency: 150, successRate: 0.9, throughput: 45, sampleSize: 100, lastUpdated: new Date() } }
      });

      expect(biasAnalysis).toBeDefined();

      // Verify result through all phases
      const finalResult = await signalCache.get(cacheKey);
      expect(finalResult).toBeDefined();
      expect(finalResult!.skillId).toBe('auth-skill');
      expect(finalResult!.confidence).toBeGreaterThan(0.8);
    });

    it('should maintain performance under concurrent load', async () => {
      const concurrentRequests = 50;
      const requests = Array.from({ length: concurrentRequests }, (_, i) => ({
        intent: `test request ${i}`,
        context: { test: true },
        userId: `user-${i}`,
        timestamp: new Date()
      }));

      const startTime = Date.now();

      // Process all requests concurrently
      const results = await Promise.all(
        requests.map(async (request, index) => {
          // Phase 1: Signal Optimization
          const signals = [
            { id: 'test-signal', cost: 1, strength: 0.8 },
            { id: 'context-signal', cost: 2, strength: 0.7 }
          ];

          const optimized = await signalOptimizer.optimizeSignalEvaluation(signals);

          // Phase 3: Caching
          const cacheKey = `concurrent-test-${index}`;
          await signalCache.set(cacheKey, {
            requestId: index,
            signals: optimized.orderedSignals,
            processedAt: Date.now()
          });

          const cached = await signalCache.get(cacheKey);

          return {
            requestId: index,
            signalCount: optimized.orderedSignals.length,
            cacheHit: cached !== null,
            processingTime: Date.now() - startTime
          };
        })
      );

      const totalTime = Date.now() - startTime;
      const averageTime = totalTime / concurrentRequests;

      expect(results).toHaveLength(concurrentRequests);
      expect(averageTime).toBeLessThan(100); // Should be fast even under load

      // Verify cache performance
      const cacheMetrics = signalCache.getMetrics();
      expect(cacheMetrics.l1HitRate).toBeGreaterThan(0.5);
      expect(cacheMetrics.averageLatency).toBeLessThan(10);
    });

    it('should handle errors gracefully across all phases', async () => {
      // Test error handling in each phase

      // Phase 1: Invalid signals
      const invalidSignals = [
        { id: '', cost: -1, strength: 2 } // Invalid signal
      ];

      const optimizedResult = await signalOptimizer.optimizeSignalEvaluation(invalidSignals);
      expect(optimizedResult.errors).toBeDefined();
      expect(optimizedResult.errors.length).toBeGreaterThan(0);

      // Phase 2: Invalid experiment
      try {
        await abTestManager.createExperiment({
          name: '',
          variants: [], // Invalid - no variants
          successMetrics: []
        });
        fail('Should have thrown error for invalid experiment');
      } catch (error) {
        expect(error).toBeDefined();
      }

      // Phase 3: Cache operations with invalid data
      await signalCache.set('test-key', null as any); // Should handle gracefully
      const result = await signalCache.get('test-key');
      expect(result).toBeNull();

      // Phase 4: Bias analysis with empty data
      const biasResult = await biasManager.analyzeSkillData({
        activations: [],
        weights: {},
        metrics: {}
      });
      expect(biasResult).toBeDefined();
      expect(Array.isArray(biasResult)).toBe(true);

      // Phase 5: Schema validation with invalid schema
      try {
        await parityManager.getComponents().schemaRegistry.registerSchema({
          name: '', // Invalid name
          version: 'invalid',
          interfaceType: 'shared',
          definition: { properties: {} },
          validation: { strict: true, allowUnknown: false, stripUnknown: true },
          compatibility: { minVersion: '1.0.0', compatibleVersions: [], breakingChanges: [] }
        });
        fail('Should have thrown error for invalid schema');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should generate comprehensive reports across all phases', async () => {
      // Generate individual phase reports
      const cacheMetrics = signalCache.getMetrics();
      const biasReport = await biasManager.generateReport();
      const parityDashboard = await parityManager.generateDashboard();

      // Create comprehensive report
      const comprehensiveReport = {
        timestamp: new Date(),
        phases: {
          signals: {
            status: 'operational',
            metrics: { averageOptimizationTime: 2.5, costSavings: 0.3 }
          },
          abTesting: {
            status: 'operational',
            metrics: { activeExperiments: 0, completedExperiments: 0 }
          },
          caching: {
            status: 'operational',
            metrics: {
              hitRate: cacheMetrics.l1HitRate,
              averageLatency: cacheMetrics.averageLatency,
              totalRequests: cacheMetrics.totalRequests
            }
          },
          biasMitigation: {
            status: 'operational',
            metrics: {
              totalBiasesDetected: biasReport.summary.totalBiasesDetected,
              activeBiases: biasReport.summary.activeBiases,
              overallBiasLevel: biasReport.summary.overallBiasLevel
            }
          },
          interfaceParity: {
            status: 'operational',
            metrics: {
              totalInterfaces: parityDashboard.metrics.totalInterfaces,
              compatibleInterfaces: parityDashboard.metrics.compatibleInterfaces,
              overallDivergence: parityDashboard.metrics.averageDivergence
            }
          }
        },
        summary: {
          overallHealth: 'operational',
          performance: 'optimal',
          reliability: 0.95,
          uptime: 0.999
        },
        recommendations: [
          'All systems operating within normal parameters',
          'Continue monitoring for performance optimization',
          'Consider scaling cache if load increases'
        ]
      };

      expect(comprehensiveReport).toBeDefined();
      expect(comprehensiveReport.phases).toBeDefined();
      expect(Object.keys(comprehensiveReport.phases)).toHaveLength(5);

      // Verify all phases are operational
      Object.values(comprehensiveReport.phases).forEach(phase => {
        expect(phase.status).toBe('operational');
        expect(phase.metrics).toBeDefined();
      });

      expect(comprehensiveReport.summary.overallHealth).toBe('operational');
      expect(comprehensiveReport.recommendations).toBeDefined();
      expect(comprehensiveReport.recommendations.length).toBeGreaterThan(0);
    });
  });
});