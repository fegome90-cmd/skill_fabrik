#!/usr/bin/env node

/**
 * Load Test Runner
 * Orchestrate and manage load testing workflows
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class LoadTestRunner {
  constructor() {
    this.testDir = __dirname;
    this.resultsDir = path.join(this.testDir, 'results');
    this.reportsDir = path.join(this.testDir, 'reports');
    this.ensureDirectories();
  }

  ensureDirectories() {
    [this.resultsDir, this.reportsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  checkK6Installation() {
    try {
      execSync('k6 version', { stdio: 'pipe' });
      console.log('✅ k6 is installed and available');
      return true;
    } catch (error) {
      console.log('❌ k6 is not installed or not in PATH');
      console.log('Please install k6: https://k6.io/docs/getting-started/installation/');
      return false;
    }
  }

  checkServiceHealth() {
    try {
      const response = execSync('curl -s http://127.0.0.1:7727/health', {
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 5000
      });
      const health = JSON.parse(response);
      console.log('✅ CLI service is healthy and ready');
      return true;
    } catch (error) {
      console.log('❌ CLI service is not available at http://127.0.0.1:7727');
      console.log('Please start the CLI service before running load tests');
      return false;
    }
  }

  runTest(testName, testFile, options = {}) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultFile = path.join(this.resultsDir, `${testName}_${timestamp}.json`);
    const reportFile = path.join(this.reportsDir, `${testName}_${timestamp}.html`);

    console.log(`\n🚀 Starting ${testName}...`);
    console.log(`Results will be saved to: ${resultFile}`);

    const k6Cmd = [
      'k6 run',
      `--out json=${resultFile}`,
      options.html ? `--out html=${reportFile}` : '',
      testFile
    ].filter(Boolean).join(' ');

    try {
      console.log(`Executing: ${k6Cmd}`);
      const startTime = Date.now();

      execSync(k6Cmd, {
        stdio: 'inherit',
        cwd: this.testDir
      });

      const duration = Date.now() - startTime;
      console.log(`✅ ${testName} completed successfully in ${(duration / 1000).toFixed(2)}s`);

      if (options.html && fs.existsSync(reportFile)) {
        console.log(`📊 HTML report available at: ${reportFile}`);
      }

      // Parse and display summary
      this.displaySummary(resultFile, testName);

      return { success: true, resultFile, reportFile, duration };
    } catch (error) {
      console.log(`❌ ${testName} failed`);
      console.log(`Error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  displaySummary(resultFile, testName) {
    try {
      if (!fs.existsSync(resultFile)) {
        console.log('No result file generated');
        return;
      }

      const data = fs.readFileSync(resultFile, 'utf8');
      const lines = data.trim().split('\n');
      const metrics = {};

      lines.forEach(line => {
        try {
          const entry = JSON.parse(line);
          if (entry.metric && entry.type === 'Point') {
            const metricName = entry.metric;
            if (!metrics[metricName]) {
              metrics[metricName] = [];
            }
            metrics[metricName].push(entry.data.value);
          }
        } catch (e) {
          // Skip malformed JSON lines
        }
      });

      console.log(`\n📊 ${testName} Summary:`);

      // Display key metrics
      const keyMetrics = {
        'http_req_duration': 'Response Time',
        'http_req_failed': 'Error Rate',
        'http_reqs': 'Total Requests',
        'vus': 'Virtual Users',
      };

      Object.entries(keyMetrics).forEach(([metric, label]) => {
        if (metrics[metric] && metrics[metric].length > 0) {
          const values = metrics[metric];
          const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
          const max = Math.max(...values);
          const min = Math.min(...values);

          if (metric.includes('duration')) {
            console.log(`  ${label}: Avg ${(avg).toFixed(2)}ms, Min ${min.toFixed(2)}ms, Max ${max.toFixed(2)}ms`);
          } else if (metric.includes('failed')) {
            console.log(`  ${label}: ${(avg * 100).toFixed(2)}%`);
          } else {
            console.log(`  ${label}: Avg ${avg.toFixed(0)}, Min ${min}, Max ${max}`);
          }
        }
      });

    } catch (error) {
      console.log(`Could not parse results: ${error.message}`);
    }
  }

  runBasicLoadTest() {
    console.log('=== Basic Load Test ===');
    console.log('Testing normal operational load conditions');

    if (!this.checkServiceHealth()) {
      return { success: false, error: 'Service not available' };
    }

    return this.runTest('basic-load-test', './basic-load-test.js', { html: true });
  }

  runStressTest() {
    console.log('=== Stress Test ===');
    console.log('Testing system limits and breaking points');

    if (!this.checkServiceHealth()) {
      return { success: false, error: 'Service not available' };
    }

    return this.runTest('stress-test', './stress-test.js', { html: true });
  }

  runMemoryLeakTest() {
    console.log('=== Memory Leak Test ===');
    console.log('Long-running test to detect memory issues');

    if (!this.checkServiceHealth()) {
      return { success: false, error: 'Service not available' };
    }

    return this.runTest('memory-leak-test', './memory-leak-test.js', { html: true });
  }

  runRegressionTest() {
    console.log('=== Performance Regression Test ===');
    console.log('Comparing against established baselines');

    if (!this.checkServiceHealth()) {
      return { success: false, error: 'Service not available' };
    }

    // Check if baseline file exists
    const baselineFile = path.join(this.testDir, 'benchmarks/performance-baselines.json');
    if (!fs.existsSync(baselineFile)) {
      console.log('❌ Performance baseline file not found');
      console.log('Please run basic tests first to establish baselines');
      return { success: false, error: 'Baseline file missing' };
    }

    return this.runTest('regression-detection', './benchmarks/regression-detection.js', { html: true });
  }

  runAllTests() {
    console.log('=== Complete Load Test Suite ===');
    console.log('Running all load tests in sequence');

    if (!this.checkK6Installation()) {
      return { success: false, error: 'k6 not installed' };
    }

    if (!this.checkServiceHealth()) {
      return { success: false, error: 'Service not available' };
    }

    const results = {};

    // Run tests in order of complexity
    const tests = [
      { name: 'basic-load', fn: () => this.runBasicLoadTest() },
      { name: 'regression-detection', fn: () => this.runRegressionTest() },
      { name: 'stress-test', fn: () => this.runStressTest() },
      { name: 'memory-leak-test', fn: () => this.runMemoryLeakTest() },
    ];

    for (const test of tests) {
      console.log(`\n${'='.repeat(50)}`);
      results[test.name] = test.fn();

      // Brief pause between tests to allow system recovery
      if (test !== tests[tests.length - 1]) {
        console.log('⏸️  Pausing for 30 seconds before next test...');
        setTimeout(() => {}, 30000);
      }
    }

    // Generate summary report
    this.generateSuiteSummary(results);

    return results;
  }

  generateSuiteSummary(results) {
    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 LOAD TEST SUITE SUMMARY');
    console.log('='.repeat(60));

    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter(r => r.success).length;
    const failedTests = totalTests - passedTests;

    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests} ✅`);
    console.log(`Failed: ${failedTests} ❌`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

    if (failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      Object.entries(results).forEach(([name, result]) => {
        if (!result.success) {
          console.log(`  ${name}: ${result.error}`);
        }
      });
    }

    // Performance summary for passed tests
    const performanceSummary = {};
    Object.entries(results).forEach(([name, result]) => {
      if (result.success && result.duration) {
        performanceSummary[name] = {
          duration: result.duration,
          resultFile: result.resultFile,
        };
      }
    });

    if (Object.keys(performanceSummary).length > 0) {
      console.log('\n⚡ Performance Summary:');
      Object.entries(performanceSummary).forEach(([name, info]) => {
        console.log(`  ${name}: ${(info.duration / 1000).toFixed(2)}s`);
      });
    }

    console.log('\n📁 Detailed results available in:');
    console.log(`  Results: ${this.resultsDir}`);
    console.log(`  Reports: ${this.reportsDir}`);
  }
}

// CLI interface
function main() {
  const runner = new LoadTestRunner();
  const command = process.argv[2];

  console.log('🚀 Skills Fabric Load Test Runner');
  console.log('================================');

  switch (command) {
    case 'basic':
      runner.runBasicLoadTest();
      break;
    case 'stress':
      runner.runStressTest();
      break;
    case 'memory':
      runner.runMemoryLeakTest();
      break;
    case 'regression':
      runner.runRegressionTest();
      break;
    case 'all':
      runner.runAllTests();
      break;
    case 'health':
      runner.checkK6Installation();
      runner.checkServiceHealth();
      break;
    default:
      console.log('Usage: node load-test-runner.js [command]');
      console.log('');
      console.log('Commands:');
      console.log('  basic      - Run basic load test');
      console.log('  stress     - Run stress test');
      console.log('  memory     - Run memory leak test');
      console.log('  regression - Run performance regression test');
      console.log('  all        - Run all tests');
      console.log('  health     - Check system health');
      console.log('');
      console.log('Examples:');
      console.log('  node load-test-runner.js basic');
      console.log('  node load-test-runner.js all');
      break;
  }
}

if (require.main === module) {
  main();
}

module.exports = LoadTestRunner;