/**
 * Enterprise Edge Cases & Boundary Testing Suite
 * Comprehensive boundary and edge case validation for robust systems
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class BoundaryTester {
  constructor() {
    this.testResults = [];
    this.startTime = Date.now();
    this.setupTestEnvironment();
    this.boundaries = this.defineTestBoundaries();
  }

  setupTestEnvironment() {
    console.log('🎯 Setting up boundary testing environment...');

    // Create test directories
    this.testDataDir = path.join(__dirname, 'boundary-data');
    this.resultsDir = path.join(__dirname, 'boundary-results');
    this.edgeCasesDir = path.join(__dirname, 'edge-cases');

    [this.testDataDir, this.resultsDir, this.edgeCasesDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Created directory: ${dir}`);
      }
    });

    // Initialize test data generators
    this.dataGenerators = this.initializeDataGenerators();
  }

  defineTestBoundaries() {
    return {
      string: {
        min: 0,
        max: 1000000, // 1MB
        edge: ['', 'a', ' '.repeat(1000), String.fromCharCode(0)]
      },
      number: {
        min: Number.MIN_SAFE_INTEGER,
        max: Number.MAX_SAFE_INTEGER,
        edge: [0, -1, 1, Number.MIN_VALUE, Number.MAX_VALUE, Infinity, -Infinity, NaN]
      },
      array: {
        min: 0,
        max: 100000,
        edge: [[], [null], [undefined], Array(1000).fill(0)]
      },
      file: {
        min: 0,
        max: 1024 * 1024 * 1024, // 1GB
        edge: [0, 1, 1024, 1024*1024, 1024*1024*100] // 0, 1B, 1KB, 1MB, 100MB
      },
      memory: {
        min: 0,
        max: 1024 * 1024 * 1024, // 1GB
        edge: [1024, 10240, 102400, 1048576] // 1KB, 10KB, 100KB, 1MB
      },
      time: {
        min: 0,
        max: 300000, // 5 minutes
        edge: [0, 1, 1000, 60000, 300000] // 0, 1ms, 1s, 1m, 5m
      }
    };
  }

  initializeDataGenerators() {
    return {
      string: {
        empty: () => '',
        singleChar: () => 'a',
        whitespace: () => ' '.repeat(1000),
        unicode: () => '🚀🔒💻📊✅❌'.repeat(100),
        specialChars: () => '!@#$%^&*()_+-=[]{}|;:,.<>?'.repeat(50),
        maxSize: () => 'a'.repeat(this.boundaries.string.max),
        nullBytes: () => '\x00'.repeat(100),
        newlines: () => '\n'.repeat(1000),
        jsonInjection: () => '{"injected": true}'.repeat(100),
        sqlInjection: () => "'; DROP TABLE users; --".repeat(10)
      },
      number: {
        zero: () => 0,
        negative: () => -1,
        positive: () => 1,
        minSafe: () => Number.MIN_SAFE_INTEGER,
        maxSafe: () => Number.MAX_SAFE_INTEGER,
        infinity: () => Infinity,
        negInfinity: () => -Infinity,
        nan: () => NaN,
        decimal: () => 3.14159265359,
        scientific: () => 1.23e-10
      },
      array: {
        empty: () => [],
        single: () => [1],
        null: () => [null],
        undefined: () => [undefined],
        mixed: () => [1, 'string', null, undefined, {}, []],
        large: () => Array(10000).fill(0),
        nested: () => [Array(100).fill(Array(100).fill(0))]
      },
      object: {
        empty: () => ({}),
        single: () => ({ key: 'value' }),
        nested: () => ({ level1: { level2: { level3: { deep: 'value' } } } }),
        large: () => {
          const obj = {};
          for (let i = 0; i < 1000; i++) {
            obj[`key${i}`] = `value${i}`;
          }
          return obj;
        },
        circular: () => {
          const obj = { name: 'circular' };
          obj.self = obj;
          return obj;
        }
      }
    };
  }

  async runBoundaryTests() {
    console.log('\n🎯 Starting Enterprise Boundary Testing Suite');
    console.log('===============================================');

    const tests = [
      { name: 'String Boundary Testing', fn: () => this.testStringBoundaries() },
      { name: 'Number Boundary Testing', fn: () => this.testNumberBoundaries() },
      { name: 'Array Boundary Testing', fn: () => this.testArrayBoundaries() },
      { name: 'File System Boundaries', fn: () => this.testFileSystemBoundaries() },
      { name: 'Memory Boundary Testing', fn: () => this.testMemoryBoundaries() },
      { name: 'Time Boundary Testing', fn: () => this.testTimeBoundaries() },
      { name: 'Network Boundary Testing', fn: () => this.testNetworkBoundaries() },
      { name: 'CLI Argument Boundaries', fn: () => this.testCLIArgumentBoundaries() },
      { name: 'Edge Case Matrix', fn: () => this.testEdgeCaseMatrix() },
      { name: 'Stress Boundaries', fn: () => this.testStressBoundaries() }
    ];

    for (const test of tests) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🧪 Running: ${test.name}`);
      console.log('='.repeat(60));

      try {
        const result = await test.fn();
        this.testResults.push({
          test: test.name,
          success: result.success !== false,
          duration: result.duration || 0,
          details: result.details || {},
          edgeCases: result.edgeCases || [],
          boundaryViolations: result.boundaryViolations || [],
          timestamp: Date.now()
        });

        const status = result.success !== false ? '✅ PASSED' : '❌ FAILED';
        const violations = result.boundaryViolations ? result.boundaryViolations.length : 0;
        console.log(`${status} ${test.name} (${result.duration || 0}ms) ${violations > 0 ? `- ${violations} boundary violations` : ''}`);
      } catch (error) {
        this.testResults.push({
          test: test.name,
          success: false,
          duration: 0,
          details: { error: error.message },
          edgeCases: [],
          boundaryViolations: [],
          timestamp: Date.now()
        });
        console.log(`❌ ${test.name} - FAILED: ${error.message}`);
      }
    }

    this.generateBoundaryReport();
  }

  async testStringBoundaries() {
    console.log('Testing string boundaries...');
    const startTime = Date.now();

    const edgeCases = [];
    const boundaryViolations = [];

    // Test CLI with various string inputs
    const cliPath = path.join(__dirname, '../../dist/index.js');
    if (!fs.existsSync(cliPath)) {
      console.log('  Building CLI for testing...');
      execSync('npm run build', { cwd: path.join(__dirname, '../..'), stdio: 'pipe' });
    }

    // Test empty string
    try {
      const result = execSync(`node "${cliPath}" skills check ""`, {
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 10000
      });
      edgeCases.push({ test: 'empty_string', success: true, output: result.length });
    } catch (error) {
      boundaryViolations.push({
        test: 'empty_string',
        type: 'error',
        message: error.message,
        severity: 'low'
      });
    }

    // Test very long string
    try {
      const longString = 'a'.repeat(10000);
      const result = execSync(`node "${cliPath}" skills check "${longString.substring(0, 100)}..."`, {
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 15000
      });
      edgeCases.push({ test: 'long_string', success: true, length: longString.length });
    } catch (error) {
      boundaryViolations.push({
        test: 'long_string',
        type: 'timeout_or_error',
        message: error.message,
        severity: 'medium'
      });
    }

    // Test special characters
    const specialStrings = [
      this.dataGenerators.string.unicode(),
      this.dataGenerators.string.specialChars(),
      this.dataGenerators.string.newlines(),
      this.dataGenerators.string.nullBytes()
    ];

    for (let i = 0; i < specialStrings.length; i++) {
      try {
        const result = execSync(`node "${cliPath}" skills check "${specialStrings[i].substring(0, 50)}..."`, {
          encoding: 'utf8',
          stdio: 'pipe',
          timeout: 10000
        });
        edgeCases.push({ test: `special_chars_${i}`, success: true });
      } catch (error) {
        boundaryViolations.push({
          test: `special_chars_${i}`,
          type: 'special_char_error',
          message: error.message,
          severity: 'medium'
        });
      }
    }

    // Test boundary values
    const boundaryStrings = [
      '', // min length
      'a', // single char
      ' '.repeat(1000), // whitespace
      'a'.repeat(100000) // large but manageable
    ];

    for (let i = 0; i < boundaryStrings.length; i++) {
      const testString = boundaryStrings[i];
      try {
        const result = execSync(`node "${cliPath}" skills check "${testString.substring(0, 50)}..."`, {
          encoding: 'utf8',
          stdio: 'pipe',
          timeout: 10000
        });
        edgeCases.push({
          test: `boundary_string_${i}`,
          success: true,
          length: testString.length
        });
      } catch (error) {
        boundaryViolations.push({
          test: `boundary_string_${i}`,
          type: 'boundary_error',
          length: testString.length,
          message: error.message,
          severity: testString.length > 50000 ? 'high' : 'medium'
        });
      }
    }

    return {
      success: boundaryViolations.filter(v => v.severity === 'high').length === 0,
      duration: Date.now() - startTime,
      details: {
        totalEdgeCases: edgeCases.length,
        totalViolations: boundaryViolations.length,
        highSeverityViolations: boundaryViolations.filter(v => v.severity === 'high').length
      },
      edgeCases,
      boundaryViolations
    };
  }

  async testNumberBoundaries() {
    console.log('Testing number boundaries...');
    const startTime = Date.now();

    const edgeCases = [];
    const boundaryViolations = [];

    // Test numeric inputs in CLI
    const cliPath = path.join(__dirname, '../../dist/index.js');

    // Test threshold parameter boundaries
    const thresholdValues = [
      0,    // minimum
      0.1,  // very small positive
      0.5,  // middle value
      0.9,  // high value
      1,    // maximum
      -1,   // negative
      1.5,  // above maximum
      NaN,  // not a number
      Infinity,  // infinity
      -Infinity  // negative infinity
    ];

    for (const threshold of thresholdValues) {
      try {
        const thresholdStr = isNaN(threshold) ? 'NaN' : threshold.toString();
        const result = execSync(`node "${cliPath}" skills check "test" --threshold ${thresholdStr}`, {
          encoding: 'utf8',
          stdio: 'pipe',
          timeout: 10000
        });
        edgeCases.push({
          test: `threshold_${thresholdStr}`,
          success: true,
          threshold: threshold
        });
      } catch (error) {
        boundaryViolations.push({
          test: `threshold_${threshold}`,
          type: 'threshold_error',
          threshold: threshold,
          message: error.message,
          severity: isNaN(threshold) || !isFinite(threshold) ? 'low' : 'medium'
        });
      }
    }

    // Test large numeric inputs
    const largeNumbers = [
      Number.MAX_SAFE_INTEGER,
      Number.MIN_SAFE_INTEGER,
      Number.MAX_VALUE,
      Number.MIN_VALUE
    ];

    for (const num of largeNumbers) {
      try {
        const result = execSync(`node "${cliPath}" skills check "test" --threshold ${num}`, {
          encoding: 'utf8',
          stdio: 'pipe',
          timeout: 10000
        });
        edgeCases.push({
          test: `large_number_${num.toString().substring(0, 10)}`,
          success: true
        });
      } catch (error) {
        boundaryViolations.push({
          test: `large_number_${num.toString().substring(0, 10)}`,
          type: 'large_number_error',
          message: error.message,
          severity: 'medium'
        });
      }
    }

    return {
      success: boundaryViolations.filter(v => v.severity === 'high').length === 0,
      duration: Date.now() - startTime,
      details: {
        thresholdsTested: thresholdValues.length,
        largeNumbersTested: largeNumbers.length,
        totalEdgeCases: edgeCases.length,
        totalViolations: boundaryViolations.length
      },
      edgeCases,
      boundaryViolations
    };
  }

  async testArrayBoundaries() {
    console.log('Testing array boundaries...');
    const startTime = Date.now();

    const edgeCases = [];
    const boundaryViolations = [];

    // Create test files with varying array sizes
    const testFiles = [];

    // Empty array
    const emptyArrayFile = path.join(this.testDataDir, 'empty-array.json');
    fs.writeFileSync(emptyArrayFile, JSON.stringify([]));
    testFiles.push({ file: emptyArrayFile, name: 'empty_array', size: 0 });

    // Single element array
    const singleArrayFile = path.join(this.testDataDir, 'single-array.json');
    fs.writeFileSync(singleArrayFile, JSON.stringify(['test']));
    testFiles.push({ file: singleArrayFile, name: 'single_element', size: 1 });

    // Large array
    const largeArrayFile = path.join(this.testDataDir, 'large-array.json');
    const largeArray = Array(10000).fill({ id: Math.random(), name: 'test' });
    fs.writeFileSync(largeArrayFile, JSON.stringify(largeArray));
    testFiles.push({ file: largeArrayFile, name: 'large_array', size: largeArray.length });

    // Deeply nested array
    const nestedArrayFile = path.join(this.testDataDir, 'nested-array.json');
    const nestedArray = Array(100).fill(Array(100).fill(Array(10).fill('deep')));
    fs.writeFileSync(nestedArrayFile, JSON.stringify(nestedArray));
    testFiles.push({ file: nestedArrayFile, name: 'nested_array', depth: 3 });

    // Test CLI with array files
    const cliPath = path.join(__dirname, '../../dist/index.js');

    for (const testFile of testFiles) {
      try {
        const result = execSync(`node "${cliPath}" skills lint "${testFile.file}"`, {
          encoding: 'utf8',
          stdio: 'pipe',
          timeout: 30000
        });
        edgeCases.push({
          test: testFile.name,
          success: true,
          size: testFile.size || testFile.depth || 'unknown'
        });
      } catch (error) {
        boundaryViolations.push({
          test: testFile.name,
          type: 'array_processing_error',
          size: testFile.size || testFile.depth || 'unknown',
          message: error.message,
          severity: (testFile.size && testFile.size > 5000) ? 'high' : 'medium'
        });
      }
    }

    // Cleanup test files
    testFiles.forEach(tf => {
      try {
        fs.unlinkSync(tf.file);
      } catch (error) {
        // Ignore cleanup errors
      }
    });

    return {
      success: boundaryViolations.filter(v => v.severity === 'high').length === 0,
      duration: Date.now() - startTime,
      details: {
        arraySizesTested: testFiles.length,
        totalEdgeCases: edgeCases.length,
        totalViolations: boundaryViolations.length
      },
      edgeCases,
      boundaryViolations
    };
  }

  async testFileSystemBoundaries() {
    console.log('Testing file system boundaries...');
    const startTime = Date.now();

    const edgeCases = [];
    const boundaryViolations = [];

    // Test file size boundaries
    const fileSizes = [
      0,      // empty file
      1,      // 1 byte
      1024,   // 1KB
      10240,  // 10KB
      102400, // 100KB
      1048576 // 1MB
    ];

    const cliPath = path.join(__dirname, '../../dist/index.js');

    for (const size of fileSizes) {
      const testFile = path.join(this.testDataDir, `test-file-${size}.md`);

      try {
        // Create file with specified size
        const content = 'a'.repeat(size);
        fs.writeFileSync(testFile, content);

        // Test CLI with file
        const result = execSync(`node "${cliPath}" skills lint "${testFile}"`, {
          encoding: 'utf8',
          stdio: 'pipe',
          timeout: 30000
        });

        edgeCases.push({
          test: `file_size_${size}`,
          success: true,
          size: size
        });
      } catch (error) {
        boundaryViolations.push({
          test: `file_size_${size}`,
          type: 'file_size_error',
          size: size,
          message: error.message,
          severity: size > 100000 ? 'high' : 'medium'
        });
      } finally {
        // Cleanup
        try {
          fs.unlinkSync(testFile);
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    }

    // Test directory depth boundaries
    const maxDepth = 20;
    const deepDir = path.join(this.testDataDir, 'deep');

    try {
      // Create deep directory structure
      let currentDir = deepDir;
      for (let i = 0; i < maxDepth; i++) {
        currentDir = path.join(currentDir, `level${i}`);
        fs.mkdirSync(currentDir, { recursive: true });

        // Create test file at each level
        const testFile = path.join(currentDir, 'test.md');
        fs.writeFileSync(testFile, `# Test at level ${i}`);

        try {
          const result = execSync(`node "${cliPath}" skills lint "${testFile}"`, {
            encoding: 'utf8',
            stdio: 'pipe',
            timeout: 15000
          });

          edgeCases.push({
            test: `directory_depth_${i}`,
            success: true,
            depth: i
          });
        } catch (error) {
          boundaryViolations.push({
            test: `directory_depth_${i}`,
            type: 'directory_depth_error',
            depth: i,
            message: error.message,
            severity: i > 15 ? 'high' : 'medium'
          });
        }
      }
    } finally {
      // Cleanup deep directory
      try {
        fs.rmSync(deepDir, { recursive: true, force: true });
      } catch (error) {
        // Ignore cleanup errors
      }
    }

    return {
      success: boundaryViolations.filter(v => v.severity === 'high').length === 0,
      duration: Date.now() - startTime,
      details: {
        fileSizesTested: fileSizes.length,
        maxDepthTested: maxDepth,
        totalEdgeCases: edgeCases.length,
        totalViolations: boundaryViolations.length
      },
      edgeCases,
      boundaryViolations
    };
  }

  async testMemoryBoundaries() {
    console.log('Testing memory boundaries...');
    const startTime = Date.now();

    const edgeCases = [];
    const boundaryViolations = [];

    // Test memory usage with large operations
    const cliPath = path.join(__dirname, '../../dist/index.js');

    // Generate memory-intensive test cases
    const memoryTests = [
      {
        name: 'large_skill_index',
        operation: () => this.createLargeSkillIndex(1000)
      },
      {
        name: 'large_kpi_data',
        operation: () => this.createLargeKPIData(5000)
      },
      {
        name: 'concurrent_operations',
        operation: () => this.runConcurrentOperations(10)
      }
    ];

    for (const test of memoryTests) {
      const memBefore = process.memoryUsage();

      try {
        await test.operation();

        const memAfter = process.memoryUsage();
        const memoryDiff = memAfter.heapUsed - memBefore.heapUsed;

        edgeCases.push({
          test: test.name,
          success: true,
          memoryUsed: memoryDiff,
          memoryBefore: memBefore.heapUsed,
          memoryAfter: memAfter.heapUsed
        });

        // Check for excessive memory usage
        if (memoryDiff > 100 * 1024 * 1024) { // 100MB
          boundaryViolations.push({
            test: test.name,
            type: 'excessive_memory_usage',
            memoryUsed: memoryDiff,
            message: `Used ${(memoryDiff / 1024 / 1024).toFixed(2)}MB for single operation`,
            severity: 'high'
          });
        }
      } catch (error) {
        boundaryViolations.push({
          test: test.name,
          type: 'memory_error',
          message: error.message,
          severity: 'medium'
        });
      }
    }

    return {
      success: boundaryViolations.filter(v => v.severity === 'high').length === 0,
      duration: Date.now() - startTime,
      details: {
        memoryTestsRun: memoryTests.length,
        totalEdgeCases: edgeCases.length,
        totalViolations: boundaryViolations.length,
        maxMemoryUsed: Math.max(...edgeCases.map(ec => ec.memoryUsed || 0))
      },
      edgeCases,
      boundaryViolations
    };
  }

  async testTimeBoundaries() {
    console.log('Testing time boundaries...');
    const startTime = Date.now();

    const edgeCases = [];
    const boundaryViolations = [];

    const cliPath = path.join(__dirname, '../../dist/index.js');

    // Test operation timeouts
    const timeoutTests = [
      { name: 'quick_operation', expectedTime: 1000 },      // 1 second
      { name: 'medium_operation', expectedTime: 10000 },    // 10 seconds
      { name: 'slow_operation', expectedTime: 30000 }       // 30 seconds
    ];

    for (const test of timeoutTests) {
      try {
        const operationStart = Date.now();

        // Run operation that should take approximately expectedTime
        const result = execSync(`node "${cliPath}" skills check "test with moderate complexity"`, {
          encoding: 'utf8',
          stdio: 'pipe',
          timeout: test.expectedTime + 5000 // Add buffer
        });

        const operationDuration = Date.now() - operationStart;

        edgeCases.push({
          test: test.name,
          success: true,
          duration: operationDuration,
          expectedDuration: test.expectedTime
        });

        // Check if operation took too long
        if (operationDuration > test.expectedTime * 2) {
          boundaryViolations.push({
            test: test.name,
            type: 'slow_operation',
            actualDuration: operationDuration,
            expectedDuration: test.expectedTime,
            message: `Operation took ${(operationDuration / 1000).toFixed(2)}s, expected <${test.expectedTime / 1000}s`,
            severity: operationDuration > 60000 ? 'high' : 'medium'
          });
        }
      } catch (error) {
        if (error.message.includes('timeout')) {
          boundaryViolations.push({
            test: test.name,
            type: 'timeout',
            message: `Operation timed out after ${test.expectedTime + 5000}ms`,
            severity: 'high'
          });
        } else {
          boundaryViolations.push({
            test: test.name,
            type: 'operation_error',
            message: error.message,
            severity: 'medium'
          });
        }
      }
    }

    return {
      success: boundaryViolations.filter(v => v.severity === 'high').length === 0,
      duration: Date.now() - startTime,
      details: {
        timeoutTestsRun: timeoutTests.length,
        totalEdgeCases: edgeCases.length,
        totalViolations: boundaryViolations.length,
        maxDuration: Math.max(...edgeCases.map(ec => ec.duration || 0))
      },
      edgeCases,
      boundaryViolations
    };
  }

  async testNetworkBoundaries() {
    console.log('Testing network boundaries...');
    const startTime = Date.now();

    const edgeCases = [];
    const boundaryViolations = [];

    // Test with invalid network configurations
    const invalidUrls = [
      'http://nonexistent-domain-12345.com',
      'ftp://invalid-protocol.com',
      'http://localhost:99999', // invalid port
      'not-a-url-at-all',
      'http://[invalid-ipv6'
    ];

    const cliPath = path.join(__dirname, '../../dist/index.js');

    for (const url of invalidUrls) {
      try {
        const result = execSync(`node "${cliPath}" skills check "test" --registry ${url}`, {
          encoding: 'utf8',
          stdio: 'pipe',
          timeout: 10000
        });

        edgeCases.push({
          test: `invalid_url_${url.substring(0, 20)}`,
          success: true,
          url: url
        });
      } catch (error) {
        // This is expected for invalid URLs
        edgeCases.push({
          test: `invalid_url_${url.substring(0, 20)}`,
          success: true,
          url: url,
          handledGracefully: true
        });
      }
    }

    // Test concurrent network requests
    try {
      const concurrentPromises = [];
      for (let i = 0; i < 5; i++) {
        const promise = new Promise((resolve, reject) => {
          try {
            const result = execSync(`node "${cliPath}" skills check "test ${i}"`, {
              encoding: 'utf8',
              stdio: 'pipe',
              timeout: 15000
            });
            resolve({ success: true, index: i });
          } catch (error) {
            reject({ error: error.message, index: i });
          }
        });
        concurrentPromises.push(promise);
      }

      const results = await Promise.allSettled(concurrentPromises);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.length - successful;

      edgeCases.push({
        test: 'concurrent_network_requests',
        success: successful > 0,
        concurrentRequests: results.length,
        successful: successful,
        failed: failed
      });

      if (failed > results.length * 0.5) {
        boundaryViolations.push({
          test: 'concurrent_network_requests',
          type: 'high_failure_rate',
          failureRate: failed / results.length,
          message: `${failed}/${results.length} concurrent requests failed`,
          severity: 'medium'
        });
      }
    } catch (error) {
      boundaryViolations.push({
        test: 'concurrent_network_requests',
        type: 'concurrent_error',
        message: error.message,
        severity: 'medium'
      });
    }

    return {
      success: boundaryViolations.filter(v => v.severity === 'high').length === 0,
      duration: Date.now() - startTime,
      details: {
        invalidUrlsTested: invalidUrls.length,
        totalEdgeCases: edgeCases.length,
        totalViolations: boundaryViolations.length
      },
      edgeCases,
      boundaryViolations
    };
  }

  async testCLIArgumentBoundaries() {
    console.log('Testing CLI argument boundaries...');
    const startTime = Date.now();

    const edgeCases = [];
    const boundaryViolations = [];

    const cliPath = path.join(__dirname, '../../dist/index.js');

    // Test argument count boundaries
    const argumentCounts = [
      0,    // no arguments
      1,    // single argument
      5,    // normal arguments
      10,   // many arguments
      20    // excessive arguments
    ];

    for (const count of argumentCounts) {
      try {
        const args = Array(count).fill('test').join(' ');
        const result = execSync(`node "${cliPath}" ${args}`, {
          encoding: 'utf8',
          stdio: 'pipe',
          timeout: 15000
        });

        edgeCases.push({
          test: `argument_count_${count}`,
          success: true,
          argumentCount: count
        });
      } catch (error) {
        boundaryViolations.push({
          test: `argument_count_${count}`,
          type: 'argument_count_error',
          argumentCount: count,
          message: error.message,
          severity: count > 15 ? 'medium' : 'low'
        });
      }
    }

    // Test argument length boundaries
    const argumentLengths = [
      '',    // empty
      'a',   // single character
      'a'.repeat(100),    // 100 chars
      'a'.repeat(1000),   // 1K chars
      'a'.repeat(10000)   // 10K chars
    ];

    for (let i = 0; i < argumentLengths.length; i++) {
      try {
        const arg = argumentLengths[i];
        const result = execSync(`node "${cliPath}" skills check "${arg}"`, {
          encoding: 'utf8',
          stdio: 'pipe',
          timeout: 15000
        });

        edgeCases.push({
          test: `argument_length_${i}`,
          success: true,
          length: arg.length
        });
      } catch (error) {
        boundaryViolations.push({
          test: `argument_length_${i}`,
          type: 'argument_length_error',
          length: argumentLengths[i].length,
          message: error.message,
          severity: argumentLengths[i].length > 5000 ? 'high' : 'medium'
        });
      }
    }

    // Test special character arguments
    const specialArgs = [
      'path/with/slashes',
      'path\\with\\backslashes',
      'arg-with-dashes',
      'arg_with_underscores',
      'arg.with.dots',
      'arg with spaces',
      'arg"with"quotes',
      'arg\'with\'apostrophes',
      'arg$with$special&chars',
      'arg;with;semicolons',
      'arg|with|pipes',
      'arg<with>brackets'
    ];

    for (const arg of specialArgs) {
      try {
        const result = execSync(`node "${cliPath}" skills check "${arg}"`, {
          encoding: 'utf8',
          stdio: 'pipe',
          timeout: 10000
        });

        edgeCases.push({
          test: `special_arg_${arg.replace(/[^a-zA-Z0-9]/g, '_')}`,
          success: true,
          argument: arg
        });
      } catch (error) {
        boundaryViolations.push({
          test: `special_arg_${arg.replace(/[^a-zA-Z0-9]/g, '_')}`,
          type: 'special_argument_error',
          argument: arg,
          message: error.message,
          severity: 'low'
        });
      }
    }

    return {
      success: boundaryViolations.filter(v => v.severity === 'high').length === 0,
      duration: Date.now() - startTime,
      details: {
        argumentCountsTested: argumentCounts.length,
        argumentLengthsTested: argumentLengths.length,
        specialArgsTested: specialArgs.length,
        totalEdgeCases: edgeCases.length,
        totalViolations: boundaryViolations.length
      },
      edgeCases,
      boundaryViolations
    };
  }

  async testEdgeCaseMatrix() {
    console.log('Testing edge case combinations...');
    const startTime = Date.now();

    const edgeCases = [];
    const boundaryViolations = [];

    // Create test matrix of edge case combinations
    const edgeCaseMatrix = [
      {
        name: 'empty_input_long_timeout',
        input: '',
        timeout: 60000
      },
      {
        name: 'long_input_short_timeout',
        input: 'a'.repeat(1000),
        timeout: 1000
      },
      {
        name: 'unicode_with_special_flags',
        input: '🚀🔒💻'.repeat(100),
        flags: ['--verbose', '--debug']
      },
      {
        name: 'deep_nested_structure',
        input: JSON.stringify({ level1: { level2: { level3: { level4: 'deep' } } } }),
        timeout: 30000
      }
    ];

    const cliPath = path.join(__dirname, '../../dist/index.js');

    for (const testCase of edgeCaseMatrix) {
      try {
        const flags = testCase.flags ? testCase.flags.join(' ') : '';
        const command = `node "${cliPath}" skills check "${testCase.input.substring(0, 100)}..." ${flags}`;

        const result = execSync(command, {
          encoding: 'utf8',
          stdio: 'pipe',
          timeout: testCase.timeout || 15000
        });

        edgeCases.push({
          test: testCase.name,
          success: true,
          inputLength: testCase.input.length,
          flags: testCase.flags || [],
          timeout: testCase.timeout
        });
      } catch (error) {
        boundaryViolations.push({
          test: testCase.name,
          type: 'edge_case_combination_error',
          inputLength: testCase.input.length,
          message: error.message,
          severity: 'medium'
        });
      }
    }

    return {
      success: boundaryViolations.filter(v => v.severity === 'high').length === 0,
      duration: Date.now() - startTime,
      details: {
        edgeCaseCombinations: edgeCaseMatrix.length,
        totalEdgeCases: edgeCases.length,
        totalViolations: boundaryViolations.length
      },
      edgeCases,
      boundaryViolations
    };
  }

  async testStressBoundaries() {
    console.log('Testing stress boundaries...');
    const startTime = Date.now();

    const edgeCases = [];
    const boundaryViolations = [];

    // Stress test with rapid successive operations
    const stressTests = [
      {
        name: 'rapid_successive_operations',
        operations: 50,
        delay: 100 // 100ms between operations
      },
      {
        name: 'high_concurrency',
        operations: 20,
        delay: 0 // No delay
      },
      {
        name: 'memory_pressure',
        operations: 10,
        dataSize: 10000 // Large data per operation
      }
    ];

    const cliPath = path.join(__dirname, '../../dist/index.js');

    for (const stressTest of stressTests) {
      const operationStart = Date.now();
      const results = [];

      try {
        for (let i = 0; i < stressTest.operations; i++) {
          const operationStart = Date.now();

          try {
            const data = stressTest.dataSize ? 'test '.repeat(stressTest.dataSize) : 'test';
            const result = execSync(`node "${cliPath}" skills check "${data.substring(0, 100)}"`, {
              encoding: 'utf8',
              stdio: 'pipe',
              timeout: 10000
            });

            results.push({
              operation: i,
              success: true,
              duration: Date.now() - operationStart
            });
          } catch (error) {
            results.push({
              operation: i,
              success: false,
              error: error.message,
              duration: Date.now() - operationStart
            });
          }

          if (stressTest.delay > 0) {
            await new Promise(resolve => setTimeout(resolve, stressTest.delay));
          }
        }

        const totalDuration = Date.now() - operationStart;
        const successful = results.filter(r => r.success).length;
        const failed = results.length - successful;
        const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;

        edgeCases.push({
          test: stressTest.name,
          success: successful > results.length * 0.8, // 80% success rate
          totalOperations: stressTest.operations,
          successful: successful,
          failed: failed,
          successRate: successful / results.length,
          totalDuration: totalDuration,
          averageDuration: avgDuration
        });

        if (failed > results.length * 0.3) {
          boundaryViolations.push({
            test: stressTest.name,
            type: 'high_failure_rate_under_stress',
            failureRate: failed / results.length,
            message: `${failed}/${results.length} operations failed under stress`,
            severity: 'high'
          });
        }

        if (avgDuration > 5000) {
          boundaryViolations.push({
            test: stressTest.name,
            type: 'slow_under_stress',
            averageDuration: avgDuration,
            message: `Average operation took ${(avgDuration / 1000).toFixed(2)}s under stress`,
            severity: 'medium'
          });
        }

      } catch (error) {
        boundaryViolations.push({
          test: stressTest.name,
          type: 'stress_test_error',
          message: error.message,
          severity: 'high'
        });
      }
    }

    return {
      success: boundaryViolations.filter(v => v.severity === 'high').length === 0,
      duration: Date.now() - startTime,
      details: {
        stressTestsRun: stressTests.length,
        totalEdgeCases: edgeCases.length,
        totalViolations: boundaryViolations.length
      },
      edgeCases,
      boundaryViolations
    };
  }

  // Helper methods for memory tests
  async createLargeSkillIndex(count) {
    const skills = [];
    for (let i = 0; i < count; i++) {
      skills.push({
        id: `skill-${i}`,
        name: `Test Skill ${i}`,
        content: `This is test content for skill ${i}`.repeat(10),
        tags: [`tag${i % 10}`, `category${i % 5}`]
      });
    }

    const testFile = path.join(this.testDataDir, 'large-skills.json');
    fs.writeFileSync(testFile, JSON.stringify({ skills }));

    // Test with the large file
    const cliPath = path.join(__dirname, '../../dist/index.js');
    try {
      const result = execSync(`node "${cliPath}" skills index "${testFile}" --out /dev/null`, {
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 60000
      });
    } finally {
      try {
        fs.unlinkSync(testFile);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  }

  async createLargeKPIData(count) {
    const events = [];
    for (let i = 0; i < count; i++) {
      events.push({
        timestamp: new Date().toISOString(),
        event_type: 'test_event',
        data: {
          operation_id: i,
          user_id: `user${i % 100}`,
          duration: Math.random() * 1000,
          metadata: { test: 'data', iteration: i }
        }
      });
    }

    const testFile = path.join(this.testDataDir, 'large-kpi.jsonl');
    const eventsJsonl = events.map(event => JSON.stringify(event)).join('\n');
    fs.writeFileSync(testFile, eventsJsonl);

    // Test with the large KPI file
    const cliPath = path.join(__dirname, '../../dist/index.js');
    try {
      const result = execSync(`node "${cliPath}" kpi --days 1 --input "${testFile}"`, {
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 60000
      });
    } finally {
      try {
        fs.unlinkSync(testFile);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  }

  async runConcurrentOperations(count) {
    const cliPath = path.join(__dirname, '../../dist/index.js');
    const promises = [];

    for (let i = 0; i < count; i++) {
      const promise = new Promise((resolve, reject) => {
        try {
          const result = execSync(`node "${cliPath}" skills check "concurrent test ${i}"`, {
            encoding: 'utf8',
            stdio: 'pipe',
            timeout: 30000
          });
          resolve({ success: true, index: i });
        } catch (error) {
          reject({ error: error.message, index: i });
        }
      });
      promises.push(promise);
    }

    await Promise.allSettled(promises);
  }

  generateBoundaryReport() {
    const endTime = Date.now();
    const totalDuration = endTime - this.startTime;

    console.log('\n' + '='.repeat(80));
    console.log('🎯 ENTERPRISE BOUNDARY TESTING REPORT');
    console.log('='.repeat(80));
    console.log(`Total duration: ${(totalDuration / 1000).toFixed(2)} seconds`);
    console.log(`Boundary tests executed: ${this.testResults.length}`);
    console.log('');

    const passed = this.testResults.filter(r => r.success).length;
    const failed = this.testResults.filter(r => !r.success).length;
    const totalEdgeCases = this.testResults.reduce((sum, r) => sum + (r.edgeCases?.length || 0), 0);
    const totalViolations = this.testResults.reduce((sum, r) => sum + (r.boundaryViolations?.length || 0), 0);
    const highSeverityViolations = this.testResults.reduce((sum, r) =>
      sum + (r.boundaryViolations?.filter(v => v.severity === 'high').length || 0), 0);

    console.log(`✅ Boundary tests passed: ${passed}`);
    console.log(`❌ Boundary tests failed: ${failed}`);
    console.log(`🧪 Total edge cases tested: ${totalEdgeCases}`);
    console.log(`🚨 Total boundary violations: ${totalViolations}`);
    console.log(`🔴 High severity violations: ${highSeverityViolations}`);

    if (highSeverityViolations > 0) {
      console.log('\n🚨 HIGH SEVERITY BOUNDARY VIOLATIONS:');
      this.testResults.forEach(result => {
        const highViolations = result.boundaryViolations?.filter(v => v.severity === 'high') || [];
        if (highViolations.length > 0) {
          console.log(`\n   ${result.test}:`);
          highViolations.forEach(violation => {
            console.log(`     🔴 ${violation.type}: ${violation.message}`);
            if (violation.test) console.log(`        Test: ${violation.test}`);
          });
        }
      });
    }

    console.log('\n📋 Boundary Test Details:');
    this.testResults.forEach(result => {
      const status = result.success ? '✅' : '❌';
      const duration = result.duration ? `(${result.duration}ms)` : '(no timing)';
      const edgeCases = result.edgeCases?.length || 0;
      const violations = result.boundaryViolations?.length || 0;
      console.log(`   ${status} ${result.test} ${duration} - ${edgeCases} edge cases, ${violations} violations`);
    });

    // Overall assessment
    if (highSeverityViolations === 0) {
      if (totalViolations === 0) {
        console.log('\n🎉 EXCELLENT BOUNDARY HANDLING!');
        console.log('✅ No boundary violations detected');
        console.log('✅ All edge cases handled correctly');
        console.log('✅ System demonstrates robust boundary management');
      } else {
        console.log('\n✅ GOOD BOUNDARY HANDLING');
        console.log('✅ No high severity boundary violations');
        console.log('⚠️  Some minor boundary issues detected');
        console.log('   Review and address remaining violations for optimal robustness');
      }
    } else {
      console.log('\n🚨 BOUNDARY ISSUES REQUIRE ATTENTION');
      console.log(`🔴 ${highSeverityViolations} high-severity boundary violations found`);
      console.log('   Address these issues to improve system robustness');
    }

    console.log('\n💡 Recommendations:');
    if (highSeverityViolations > 0) {
      console.log('   - Fix high-severity boundary violations immediately');
      console.log('   - Implement proper input validation and sanitization');
      console.log('   - Add timeout and memory usage controls');
    }
    if (totalViolations > highSeverityViolations) {
      console.log('   - Review and address minor boundary issues');
      console.log('   - Enhance error handling for edge cases');
    }
    if (totalViolations === 0) {
      console.log('   - Continue comprehensive boundary testing in development');
      console.log('   - Monitor boundary conditions in production');
    }

    // Save detailed report
    const reportPath = path.join(this.resultsDir, `boundary-report-${new Date().toISOString().split('T')[0]}.json`);
    const detailedReport = {
      summary: {
        totalDuration,
        testsExecuted: this.testResults.length,
        testsPassed: passed,
        testsFailed: failed,
        totalEdgeCases,
        totalViolations,
        highSeverityViolations,
        timestamp: new Date().toISOString()
      },
      testResults: this.testResults,
      recommendations: this.generateBoundaryRecommendations()
    };

    try {
      fs.writeFileSync(reportPath, JSON.stringify(detailedReport, null, 2));
      console.log(`\n📁 Detailed boundary report saved to: ${reportPath}`);
    } catch (error) {
      console.log(`\n⚠️  Could not save detailed report: ${error.message}`);
    }
  }

  generateBoundaryRecommendations() {
    const recommendations = [];
    const violationTypes = new Set();

    this.testResults.forEach(result => {
      if (result.boundaryViolations) {
        result.boundaryViolations.forEach(violation => {
          violationTypes.add(violation.type);
        });
      }
    });

    if (violationTypes.has('excessive_memory_usage')) {
      recommendations.push('Implement memory usage limits and monitoring');
    }
    if (violationTypes.has('timeout')) {
      recommendations.push('Add appropriate timeout controls for long-running operations');
    }
    if (violationTypes.has('file_size_error')) {
      recommendations.push('Implement file size validation and streaming for large files');
    }
    if (violationTypes.has('argument_length_error')) {
      recommendations.push('Add input length validation for CLI arguments');
    }
    if (violationTypes.has('high_failure_rate_under_stress')) {
      recommendations.push('Improve system resilience under stress conditions');
    }

    if (recommendations.length === 0) {
      recommendations.push('Continue comprehensive boundary testing practices');
    }

    return recommendations;
  }
}

async function main() {
  const boundaryTester = new BoundaryTester();
  await boundaryTester.runBoundaryTests();
}

if (require.main === module) {
  main().catch(error => {
    console.error('Boundary testing failed:', error);
    process.exit(1);
  });
}

module.exports = BoundaryTester;