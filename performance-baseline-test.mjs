#!/usr/bin/env node

/**
 * Performance Baseline Test for Post-Hooks Pipeline
 * Establishes comprehensive metrics baseline using telemetry system
 * Tests load scenarios, concurrency, and resource utilization
 */

import { execSync } from 'child_process';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { performance } from 'perf_hooks';

const CLI_PATH = './packages/skills-cli/dist/index.js';
const RESULTS_DIR = './performance-baseline-results';
const TEST_ITERATIONS = {
  light: 5,
  medium: 15,
  heavy: 50,
  stress: 100
};

/**
 * Performance test scenarios
 */
const PERF_SCENARIOS = [
  {
    name: 'single-ts-file',
    description: 'Single TypeScript file processing',
    files: ['sample.ts'],
    repos: ['.'],
    expectedLatency: '<3000ms'
  },
  {
    name: 'multiple-ts-files',
    description: 'Multiple TypeScript files processing',
    files: ['sample.ts', 'sample2.ts', 'complex.ts'],
    repos: ['.'],
    expectedLatency: '<5000ms'
  },
  {
    name: 'multi-repo',
    description: 'Multi-repository processing',
    files: ['sample.ts', 'package.json'],
    repos: ['.', 'packages/skills-cli', 'packages/router'],
    expectedLatency: '<7000ms'
  },
  {
    name: 'error-resolution',
    description: 'TypeScript error resolution processing',
    files: ['broken.ts', 'broken2.ts'],
    repos: ['.'],
    expectedLatency: '<8000ms'
  },
  {
    name: 'complex-pipeline',
    description: 'Full 12-step pipeline with all features',
    files: ['sample.ts', 'sample2.ts', 'broken.ts', 'package.json'],
    repos: ['.', 'packages/skills-cli', 'packages/router'],
    expectedLatency: '<10000ms'
  }
];

/**
 * Test files creation
 */
async function setupPerformanceTestFiles() {
  await mkdir(RESULTS_DIR, { recursive: true });

  // Simple TypeScript file
  await writeFile(join(RESULTS_DIR, 'sample.ts'), `
import { execa } from 'execa';
import { readFile } from 'fs/promises';

interface TestInterface {
  name: string;
  data: any;
}

const testObj: TestInterface = {
  name: 'performance-test',
  data: { timestamp: Date.now() }
};

export default testObj;
  `, 'utf-8');

  // Complex TypeScript file
  await writeFile(join(RESULTS_DIR, 'complex.ts'), `
import { EventEmitter } from 'events';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

interface ComplexData {
  id: string;
  payload: unknown;
  metadata: Record<string, unknown>;
  timestamp: number;
}

class PerformanceProcessor extends EventEmitter {
  private cache = new Map<string, ComplexData>();

  async process(data: ComplexData): Promise<ComplexData> {
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100));

    this.cache.set(data.id, data);
    this.emit('processed', data);

    return data;
  }

  getStats(): { cacheSize: number; processedCount: number } {
    return {
      cacheSize: this.cache.size,
      processedCount: this.listenerCount('processed')
    };
  }
}

export { PerformanceProcessor, ComplexData };
export default PerformanceProcessor;
  `, 'utf-8');

  // Broken TypeScript file
  await writeFile(join(RESULTS_DIR, 'broken.ts'), `
// File with multiple TypeScript errors for auto-resolver testing
const broken: string = undefined;
const num: number = 'not a number';

// Missing imports
import { missingModule } from './nonexistent';
import { anotherMissing } from './also-nonexistent';

function brokenFunction(param: any): any {
  return param.undefinedProperty.property;
}

class BrokenClass {
  constructor(public missingType: unknown) {}

  methodWithErrors(): string {
    return this.missingType + 'should error';
  }
}
  `, 'utf-8');

  // Second broken file
  await writeFile(join(RESULTS_DIR, 'broken2.ts'), `
// Additional TypeScript errors
interface BadInterface {
  required: string;
}

const badImplementation: BadInterface = {
  // Missing required property
  optional: 'value'
};

// Type assertion errors
const wrongType = { name: 'test' } as any as number;
const arrayError = ['string'] as number[];

// Async/await errors
async function brokenAsync(): Promise<number> {
  return 'not a number'; // Type mismatch
}
  `, 'utf-8');

  // Package.json
  await writeFile(join(RESULTS_DIR, 'package.json'), JSON.stringify({
    name: 'performance-test-package',
    version: '1.0.0',
    type: 'module',
    scripts: {
      test: 'echo "test"',
      build: 'tsc',
      format: 'prettier --write *.ts'
    },
    dependencies: {
      execa: '^8.0.1',
      typescript: '^5.3.3'
    }
  }, null, 2), 'utf-8');

  console.log('✅ Performance test files created');
}

/**
 * Execute single performance test
 */
async function executePerformanceTest(scenario, iteration = 1) {
  console.log(`\n🧪 [${iteration}/${TEST_ITERATIONS.light}] Testing: ${scenario.name}`);

  const startTime = performance.now();

  try {
    // Import and execute stopHook
    const { stopHook } = await import('./packages/router/dist/stop.js');

    const input = {
      editLog: scenario.files.map(file => ({
        file: join(RESULTS_DIR, file),
        changeType: 'modified',
        timestamp: Date.now()
      })),
      reposChanged: new Set(scenario.repos),
      cwd: process.cwd()
    };

    // Optimizations for testing
    process.env.SKILLS_FABRIK_NMLB_DISABLE = 'true';
    process.env.SKILLS_FABRIK_OPTIMIZE_SIMPLE = 'true';
    process.env.TEST_MODE = 'true';

    const result = await stopHook(input);

    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);

    return {
      success: true,
      iteration,
      scenario: scenario.name,
      duration,
      formatted: result.formatted?.length || 0,
      typecheck: result.typecheck?.length || 0,
      autoResolved: result.autoResolved || false,
      metrics: result.metrics || {},
      cacheHits: result.metrics?.cacheHits || 0,
      memoryUsage: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);

    return {
      success: false,
      iteration,
      scenario: scenario.name,
      duration,
      error: error.message,
      memoryUsage: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Run performance test suite
 */
async function runPerformanceSuite(scenarios, iterations) {
  console.log(`\n🚀 Starting Performance Suite: ${iterations} iterations per scenario`);

  const results = [];

  for (const scenario of scenarios) {
    console.log(`\n📊 === ${scenario.name.toUpperCase()} ===`);
    console.log(`📝 Description: ${scenario.description}`);
    console.log(`🎯 Expected latency: ${scenario.expectedLatency}`);

    const scenarioResults = [];

    for (let i = 1; i <= iterations; i++) {
      const result = await executePerformanceTest(scenario, i);
      scenarioResults.push(result);

      // Show progress
      if (i % 5 === 0 || i === iterations) {
        const avgDuration = Math.round(
          scenarioResults.reduce((sum, r) => sum + r.duration, 0) / scenarioResults.length
        );
        const successRate = scenarioResults.filter(r => r.success).length / scenarioResults.length * 100;
        console.log(`   Progress: ${i}/${iterations} | Avg: ${avgDuration}ms | Success: ${successRate}%`);
      }

      // Small delay between iterations
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    results.push(...scenarioResults);
  }

  return results;
}

/**
 * Analyze performance results
 */
function analyzeResults(results, testType) {
  console.log(`\n📈 === ${testType.toUpperCase()} PERFORMANCE ANALYSIS ===`);

  // Group by scenario
  const byScenario = {};
  results.forEach(result => {
    if (!byScenario[result.scenario]) {
      byScenario[result.scenario] = [];
    }
    byScenario[result.scenario].push(result);
  });

  const analysis = {
    testType,
    totalTests: results.length,
    timestamp: new Date().toISOString(),
    scenarios: {}
  };

  Object.entries(byScenario).forEach(([scenario, scenarioResults]) => {
    const successful = scenarioResults.filter(r => r.success);
    const durations = successful.map(r => r.duration);
    const memoryUsage = successful.map(r => r.memoryUsage);

    const stats = {
      totalRuns: scenarioResults.length,
      successRate: Math.round((successful.length / scenarioResults.length) * 100),
      latency: {
        min: Math.min(...durations),
        max: Math.max(...durations),
        avg: Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length),
        p95: calculatePercentile(durations, 95),
        p99: calculatePercentile(durations, 99)
      },
      memory: {
        avgHeapUsed: Math.round(memoryUsage.reduce((sum, m) => sum + m.heapUsed, 0) / memoryUsage.length / 1024 / 1024),
        avgHeapTotal: Math.round(memoryUsage.reduce((sum, m) => sum + m.heapTotal, 0) / memoryUsage.length / 1024 / 1024),
        avgExternal: Math.round(memoryUsage.reduce((sum, m) => sum + m.external, 0) / memoryUsage.length / 1024 / 1024)
      },
      features: {
        autoResolverUsed: successful.some(r => r.autoResolved),
        avgFormatted: Math.round(successful.reduce((sum, r) => sum + (r.formatted || 0), 0) / successful.length),
        avgTypecheck: Math.round(successful.reduce((sum, r) => sum + (r.typecheck || 0), 0) / successful.length),
        avgCacheHits: Math.round(successful.reduce((sum, r) => sum + (r.cacheHits || 0), 0) / successful.length)
      }
    };

    analysis.scenarios[scenario] = stats;

    console.log(`\n📊 ${scenario}:`);
    console.log(`   Success Rate: ${stats.successRate}%`);
    console.log(`   Latency: ${stats.latency.min}ms - ${stats.latency.max}ms (avg: ${stats.latency.avg}ms)`);
    console.log(`   P95: ${stats.latency.p95}ms | P99: ${stats.latency.p99}ms`);
    console.log(`   Memory: ${stats.memory.avgHeapUsed}MB heap | ${stats.memory.avgExternal}MB external`);
    console.log(`   Features: Auto-resolver ${stats.features.autoResolverUsed ? '✅' : '❌'} | Cache: ${stats.features.avgCacheHits} hits`);
  });

  return analysis;
}

/**
 * Calculate percentile
 */
function calculatePercentile(values, percentile) {
  const sorted = values.sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

/**
 * Save performance baseline
 */
async function saveBaseline(analysis) {
  const filename = join(RESULTS_DIR, `baseline-${analysis.testType}-${Date.now()}.json`);
  await writeFile(filename, JSON.stringify(analysis, null, 2));
  console.log(`\n💾 Baseline saved: ${filename}`);

  // Also save as latest
  const latestFile = join(RESULTS_DIR, 'baseline-latest.json');
  await writeFile(latestFile, JSON.stringify(analysis, null, 2));
  console.log(`💾 Latest baseline updated: ${latestFile}`);
}

/**
 * Cleanup test files
 */
async function cleanup() {
  try {
    execSync(`rm -rf "${RESULTS_DIR}"`, { cwd: '.' });
    console.log('🧹 Performance test files cleaned up');
  } catch (error) {
    console.warn('⚠️ Failed to cleanup:', error.message);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting Performance Baseline Test for Post-Hooks Pipeline\n');

  try {
    // Setup
    await setupPerformanceTestFiles();

    // Light tests (quick baseline)
    console.log('\n=== LIGHT PERFORMANCE TESTS ===');
    const lightResults = await runPerformanceSuite(PERF_SCENARIOS, TEST_ITERATIONS.light);
    const lightAnalysis = analyzeResults(lightResults, 'light');
    await saveBaseline(lightAnalysis);

    // Medium tests (realistic load)
    console.log('\n=== MEDIUM PERFORMANCE TESTS ===');
    const mediumResults = await runPerformanceSuite(PERF_SCENARIOS, TEST_ITERATIONS.medium);
    const mediumAnalysis = analyzeResults(mediumResults, 'medium');
    await saveBaseline(mediumAnalysis);

    // Generate summary report
    console.log('\n📊 === PERFORMANCE BASELINE SUMMARY ===');
    console.log(`✅ Light tests: ${lightAnalysis.totalTests} completed`);
    console.log(`✅ Medium tests: ${mediumAnalysis.totalTests} completed`);

    const overallStats = {
      avgLatencyLight: Object.values(lightAnalysis.scenarios).reduce((sum, s) => sum + s.latency.avg, 0) / Object.keys(lightAnalysis.scenarios).length,
      avgLatencyMedium: Object.values(mediumAnalysis.scenarios).reduce((sum, s) => sum + s.latency.avg, 0) / Object.keys(mediumAnalysis.scenarios).length,
      memoryUsageLight: Object.values(lightAnalysis.scenarios).reduce((sum, s) => sum + s.memory.avgHeapUsed, 0) / Object.keys(lightAnalysis.scenarios).length,
      memoryUsageMedium: Object.values(mediumAnalysis.scenarios).reduce((sum, s) => sum + s.memory.avgHeapUsed, 0) / Object.keys(mediumAnalysis.scenarios).length
    };

    console.log(`\n🎯 Baseline Metrics Established:`);
    console.log(`   Light Load Latency: ${Math.round(overallStats.avgLatencyLight)}ms`);
    console.log(`   Medium Load Latency: ${Math.round(overallStats.avgLatencyMedium)}ms`);
    console.log(`   Light Memory Usage: ${Math.round(overallStats.memoryUsageLight)}MB`);
    console.log(`   Medium Memory Usage: ${Math.round(overallStats.memoryUsageMedium)}MB`);

    // Cleanup
    await cleanup();

    console.log('\n🎉 Performance baseline completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('💥 Performance test failed:', error);
    await cleanup();
    process.exit(1);
  }
}

// Run the performance baseline test
main().catch(error => {
  console.error('💥 Execution failed:', error);
  process.exit(1);
});