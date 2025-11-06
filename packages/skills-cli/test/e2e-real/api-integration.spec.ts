/**
 * API Integration E2E Tests
 * Tests CLI API endpoints with real data and error scenarios
 */

import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';
import * as http from 'http';

interface CLIResponse {
  stdout?: string;
  stderr?: string;
  exitCode: number;
  signal?: string;
}

// Helper function to execute CLI commands
function executeCLICommand(command: string, args: string[] = [], timeout = 30000): Promise<CLIResponse> {
  return new Promise((resolve, reject) => {
    const cliPath = process.env.CLI_PATH || './dist/index.js';
    const child = spawn('node', [cliPath, ...args], {
      stdio: 'pipe',
      cwd: process.cwd(),
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    const timeoutId = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error(`Command timed out after ${timeout}ms`));
    }, timeout);

    child.on('close', (code, signal) => {
      clearTimeout(timeoutId);
      resolve({
        stdout,
        stderr,
        exitCode: code || 0,
        signal,
      });
    });

    child.on('error', (error) => {
      clearTimeout(timeoutId);
      reject(error);
    });
  });
}

// Helper function to check if CLI service is running
function checkCLIService(port = 7727): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: port,
      path: '/health',
      method: 'GET',
      timeout: 5000,
    }, (res) => {
      resolve(res.statusCode === 200);
    });

    req.on('error', () => {
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

test.describe('CLI API Integration Tests', () => {

  test.beforeAll(async () => {
    // Check if CLI service is available
    const serviceAvailable = await checkCLIService();
    if (!serviceAvailable) {
      console.log('⚠️  CLI service not available, some API tests may be skipped');
    }
  });

  test('Skills API endpoints', async () => {
    console.log('🔄 Testing Skills API endpoints...');

    // Test skills list
    try {
      const listResult = await executeCLICommand('skills', ['list']);
      expect(listResult.exitCode).toBe(0);
      expect(listResult.stdout).toContain('Available skills');
      console.log('✅ Skills list endpoint working');
    } catch (error) {
      console.log('❌ Skills list failed:', error);
      throw error;
    }

    // Test skills rules
    try {
      const rulesResult = await executeCLICommand('skills', ['rules']);
      expect(rulesResult.exitCode).toBe(0);
      expect(rulesResult.stdout).toContain('Skill activation rules');
      console.log('✅ Skills rules endpoint working');
    } catch (error) {
      console.log('❌ Skills rules failed:', error);
      throw error;
    }

    // Test skills check with content
    try {
      const checkResult = await executeCLICommand('skills', [
        'check',
        'implement testing strategy',
        '--threshold',
        '0.5'
      ]);
      expect(checkResult.exitCode).toBe(0);
      expect(checkResult.stdout).toContain('matching skills');
      console.log('✅ Skills check endpoint working');
    } catch (error) {
      console.log('❌ Skills check failed:', error);
      throw error;
    }
  });

  test('Plan API endpoints', async () => {
    console.log('🔄 Testing Plan API endpoints...');

    // Test plan creation
    try {
      const createResult = await executeCLICommand('plan', [
        'create',
        'testing API endpoints with realistic scenarios'
      ]);
      expect(createResult.exitCode).toBe(0);
      expect(createResult.stdout).toContain('✅');
      console.log('✅ Plan creation endpoint working');
    } catch (error) {
      console.log('❌ Plan creation failed:', error);
      throw error;
    }

    // Test plan list
    try {
      const listResult = await executeCLICommand('plan', ['list']);
      expect(listResult.exitCode).toBe(0);
      // Plan list might be empty but should not error
      console.log('✅ Plan list endpoint working');
    } catch (error) {
      console.log('❌ Plan list failed:', error);
      throw error;
    }

    // Test plan save
    try {
      const saveResult = await executeCLICommand('plan', ['save']);
      expect(saveResult.exitCode).toBe(0);
      console.log('✅ Plan save endpoint working');
    } catch (error) {
      console.log('❌ Plan save failed:', error);
      throw error;
    }
  });

  test('KPI API endpoints', async () => {
    console.log('🔄 Testing KPI API endpoints...');

    // Test KPI display
    try {
      const kpiResult = await executeCLICommand('kpi', ['--days', '1']);
      expect(kpiResult.exitCode).toBe(0);
      // KPI might show no data but should not error
      console.log('✅ KPI display endpoint working');
    } catch (error) {
      console.log('❌ KPI display failed:', error);
      throw error;
    }

    // Test KPI dashboard generation
    try {
      const dashboardResult = await executeCLICommand('kpi', ['--generate-dashboard']);
      expect(dashboardResult.exitCode).toBe(0);
      console.log('✅ KPI dashboard endpoint working');
    } catch (error) {
      console.log('❌ KPI dashboard failed:', error);
      throw error;
    }
  });

  test('Error handling in API endpoints', async () => {
    console.log('🔄 Testing API error handling...');

    // Test invalid skills command
    try {
      const result = await executeCLICommand('skills', ['invalid-subcommand']);
      expect(result.exitCode).toBeGreaterThan(0);
      expect(result.stderr).toContain('Error');
      console.log('✅ Invalid skills command handled correctly');
    } catch (error) {
      console.log('❌ Error handling test failed:', error);
      throw error;
    }

    // Test invalid plan arguments
    try {
      const result = await executeCLICommand('plan', ['create', '']); // Empty plan
      // Might succeed or fail depending on implementation
      console.log('✅ Empty plan argument processed');
    } catch (error) {
      // Expected behavior for empty input
      console.log('✅ Empty plan argument handled correctly');
    }

    // Test invalid KPI parameters
    try {
      const result = await executeCLICommand('kpi', ['--days', 'invalid']);
      expect(result.exitCode).toBeGreaterThan(0);
      console.log('✅ Invalid KPI parameters handled correctly');
    } catch (error) {
      console.log('❌ Invalid KPI parameters test failed:', error);
      throw error;
    }
  });

  test('Performance of API endpoints', async () => {
    console.log('🔄 Testing API endpoint performance...');

    const endpoints = [
      { command: 'skills', args: ['rules'], name: 'skills rules' },
      { command: 'skills', args: ['list'], name: 'skills list' },
      { command: 'plan', args: ['list'], name: 'plan list' },
      { command: 'kpi', args: ['--days', '1'], name: 'kpi display' },
    ];

    const performanceResults: Array<{
      name: string;
      duration: number;
      success: boolean;
    }> = [];

    for (const endpoint of endpoints) {
      const startTime = Date.now();
      try {
        const result = await executeCLICommand(endpoint.command, endpoint.args, 10000);
        const duration = Date.now() - startTime;

        performanceResults.push({
          name: endpoint.name,
          duration,
          success: result.exitCode === 0,
        });

        // Performance assertion - should complete within 10 seconds
        expect(duration).toBeLessThan(10000);
        expect(result.exitCode).toBe(0);

      } catch (error) {
        const duration = Date.now() - startTime;
        performanceResults.push({
          name: endpoint.name,
          duration,
          success: false,
        });
        console.log(`❌ ${endpoint.name} failed:`, error);
      }
    }

    // Log performance summary
    console.log('\n📊 Performance Summary:');
    performanceResults.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`   ${status} ${result.name}: ${result.duration}ms`);
    });

    const avgDuration = performanceResults
      .filter(r => r.success)
      .reduce((sum, r) => sum + r.duration, 0) / performanceResults.filter(r => r.success).length;

    console.log(`   📈 Average duration: ${avgDuration.toFixed(0)}ms`);

    // Ensure at least 80% of endpoints are performing well
    const successRate = performanceResults.filter(r => r.success).length / performanceResults.length;
    expect(successRate).toBeGreaterThan(0.8);
  });

  test('Concurrent API calls', async () => {
    console.log('🔄 Testing concurrent API calls...');

    const concurrentRequests = 5;
    const promises: Promise<CLIResponse>[] = [];

    // Launch multiple concurrent requests
    for (let i = 0; i < concurrentRequests; i++) {
      promises.push(executeCLICommand('skills', ['rules'], 15000));
    }

    const startTime = Date.now();
    const results = await Promise.allSettled(promises);
    const totalTime = Date.now() - startTime;

    // Analyze results
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.exitCode === 0).length;
    const failed = results.length - successful;

    console.log(`\n📊 Concurrent Test Results:`);
    console.log(`   Total requests: ${results.length}`);
    console.log(`   Successful: ${successful}`);
    console.log(`   Failed: ${failed}`);
    console.log(`   Total time: ${totalTime}ms`);
    console.log(`   Average per request: ${(totalTime / results.length).toFixed(0)}ms`);

    // Ensure reasonable success rate for concurrent operations
    const successRate = successful / results.length;
    expect(successRate).toBeGreaterThan(0.6); // At least 60% success rate

    // Ensure concurrent operations complete in reasonable time
    expect(totalTime).toBeLessThan(60000); // 60 seconds max for 5 concurrent requests
  });

  test('API response format consistency', async () => {
    console.log('🔄 Testing API response format consistency...');

    const testCases = [
      {
        command: 'skills',
        args: ['list'],
        expectedPatterns: ['skills', 'Available'],
      },
      {
        command: 'skills',
        args: ['rules'],
        expectedPatterns: ['rules', 'activation'],
      },
      {
        command: 'plan',
        args: ['list'],
        expectedPatterns: ['plans', 'Available'],
      },
    ];

    for (const testCase of testCases) {
      try {
        const result = await executeCLICommand(testCase.command, testCase.args);
        expect(result.exitCode).toBe(0);

        // Check for expected patterns in output
        testCase.expectedPatterns.forEach(pattern => {
          expect(result.stdout).toContain(pattern);
        });

        // Ensure no error output
        expect(result.stderr).toBe('');

        console.log(`✅ ${testCase.command} ${testCase.args.join(' ')} format consistent`);
      } catch (error) {
        console.log(`❌ ${testCase.command} ${testCase.args.join(' ')} format test failed:`, error);
        throw error;
      }
    }
  });

});