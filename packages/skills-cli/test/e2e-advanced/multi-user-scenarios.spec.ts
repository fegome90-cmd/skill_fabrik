/**
 * Advanced Multi-User E2E Scenarios
 * Enterprise-level testing with concurrent users and large datasets
 */

import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface MultiUserTestConfig {
  concurrentUsers: number;
  testDataSize: number;
  operationsPerUser: number;
  thinkTime: number; // milliseconds
  rampUpTime: number; // milliseconds
}

interface UserScenario {
  userId: string;
  scenario: string;
  operations: Operation[];
  results: OperationResult[];
}

interface Operation {
  type: 'skill_activation' | 'plan_creation' | 'kpi_query' | 'file_processing' | 'database_operation';
  parameters: Record<string, any>;
  expectedOutcome: 'success' | 'error' | 'timeout';
}

interface OperationResult {
  operation: Operation;
  success: boolean;
  duration: number;
  error?: string;
  responseData?: any;
  timestamp: number;
}

class MultiUserTestRunner {
  private cliPath: string;
  private testDataDir: string;
  private results: UserScenario[] = [];

  constructor() {
    this.cliPath = path.join(__dirname, '../../dist/index.js');
    this.testDataDir = path.join(__dirname, 'test-data');
    this.setupTestEnvironment();
  }

  private setupTestEnvironment() {
    console.log('🚀 Setting up multi-user test environment...');

    // Create test directories
    const dirs = [
      this.testDataDir,
      path.join(this.testDataDir, 'skills'),
      path.join(this.testDataDir, 'plans'),
      path.join(this.testDataDir, 'kpi'),
      path.join(this.testDataDir, 'users')
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Created directory: ${dir}`);
      }
    });

    // Generate test data
    this.generateTestData();
  }

  private generateTestData() {
    console.log('📊 Generating test data...');

    // Generate test skills
    for (let i = 0; i < 100; i++) {
      const skill = {
        id: `test-skill-${i}`,
        name: `Test Skill ${i}`,
        version: '0.1.0',
        type: ['guideline', 'guardrail', 'workflow'][Math.floor(Math.random() * 3)],
        summary: `Test skill for multi-user scenario ${i}`,
        content: `This is test content for skill ${i} `.repeat(50),
        tags: [`tag${i % 10}`, `category${i % 5}`]
      };

      const skillFile = path.join(this.testDataDir, 'skills', `${skill.id}.md`);
      const skillContent = `---
id: ${skill.id}
version: ${skill.version}
type: ${skill.type}
summary: '${skill.summary}'
tags: [${skill.tags.join(', ')}]
---

# ${skill.name}

${skill.content}
`;
      fs.writeFileSync(skillFile, skillContent);
    }

    // Generate test KPI events
    const kpiEvents = [];
    for (let i = 0; i < 1000; i++) {
      kpiEvents.push({
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        event_type: ['skill_activation', 'plan_creation', 'kpi_query'][Math.floor(Math.random() * 3)],
        data: {
          user_id: `user-${Math.floor(Math.random() * 20)}`,
          skill_id: `test-skill-${Math.floor(Math.random() * 100)}`,
          duration: Math.floor(Math.random() * 5000),
          success: Math.random() > 0.1
        }
      });
    }

    const kpiFile = path.join(this.testDataDir, 'kpi', 'events.jsonl');
    const kpiContent = kpiEvents.map(event => JSON.stringify(event)).join('\n');
    fs.writeFileSync(kpiFile, kpiContent);

    console.log(`✅ Generated ${100} test skills and ${1000} KPI events`);
  }

  async runMultiUserTest(config: MultiUserTestConfig): Promise<UserScenario[]> {
    console.log(`👥 Starting multi-user test with ${config.concurrentUsers} concurrent users`);

    const userScenarios: UserScenario[] = [];
    const startTime = Date.now();

    // Create user scenarios
    for (let i = 0; i < config.concurrentUsers; i++) {
      const scenario = this.createUserScenario(i, config);
      userScenarios.push(scenario);
    }

    // Execute scenarios with ramp-up
    const rampUpDelay = config.rampUpTime / config.concurrentUsers;

    const promises = userScenarios.map((scenario, index) =>
      this.executeUserScenario(scenario, index * rampUpDelay)
    );

    const results = await Promise.allSettled(promises);

    // Process results
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        this.results.push(result.value);
      } else {
        console.error(`User ${index} scenario failed:`, result.reason);
      }
    });

    const totalDuration = Date.now() - startTime;
    console.log(`🏁 Multi-user test completed in ${(totalDuration / 1000).toFixed(2)} seconds`);

    return this.results;
  }

  private createUserScenario(userId: number, config: MultiUserTestConfig): UserScenario {
    const scenarios = [
      'developer_workflow',
      'analyst_workflow',
      'admin_workflow',
      'power_user_workflow'
    ];

    const selectedScenario = scenarios[userId % scenarios.length];

    const operations: Operation[] = [];
    for (let i = 0; i < config.operationsPerUser; i++) {
      operations.push(this.generateOperation(selectedScenario, i, config.testDataSize));
    }

    return {
      userId: `user-${userId}`,
      scenario: selectedScenario,
      operations,
      results: []
    };
  }

  private generateOperation(scenario: string, index: number, dataSize: number): Operation {
    const operationTypes: Operation['type'][] = [
      'skill_activation',
      'plan_creation',
      'kpi_query',
      'file_processing',
      'database_operation'
    ];

    const type = operationTypes[index % operationTypes.length];
    const baseParameters = this.getBaseParameters(type, scenario, dataSize);

    return {
      type,
      parameters: baseParameters,
      expectedOutcome: Math.random() > 0.1 ? 'success' : 'error'
    };
  }

  private getBaseParameters(type: Operation['type'], scenario: string, dataSize: number): Record<string, any> {
    const base = {
      user_id: scenario,
      timestamp: Date.now(),
      data_size: dataSize
    };

    switch (type) {
      case 'skill_activation':
        return {
          ...base,
          skill_id: `test-skill-${Math.floor(Math.random() * 100)}`,
          threshold: 0.5 + Math.random() * 0.5,
          context: { scenario, request_id: `req-${Math.random().toString(36).substring(7)}` }
        };

      case 'plan_creation':
        return {
          ...base,
          plan_name: `Test Plan for ${scenario}`,
          description: `Test plan description `.repeat(dataSize / 100),
          complexity: ['simple', 'medium', 'complex'][Math.floor(Math.random() * 3)]
        };

      case 'kpi_query':
        return {
          ...base,
          days: Math.floor(Math.random() * 7) + 1,
          event_types: ['skill_activation', 'plan_creation'],
          aggregation: ['daily', 'weekly'][Math.floor(Math.random() * 2)]
        };

      case 'file_processing':
        return {
          ...base,
          file_path: path.join(this.testDataDir, 'skills', `test-skill-${Math.floor(Math.random() * 100)}.md`),
          operation: ['lint', 'index', 'validate'][Math.floor(Math.random() * 3)]
        };

      case 'database_operation':
        return {
          ...base,
          operation: ['insert', 'update', 'query', 'delete'][Math.floor(Math.random() * 4)],
          table: 'skills',
          record_count: Math.floor(Math.random() * dataSize) + 1
        };

      default:
        return base;
    }
  }

  private async executeUserScenario(scenario: UserScenario, delay: number): Promise<UserScenario> {
    // Wait for ramp-up delay
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    console.log(`🔄 Executing scenario for ${scenario.userId} (${scenario.scenario})`);

    for (const operation of scenario.operations) {
      const result = await this.executeOperation(operation, scenario.userId);
      scenario.results.push(result);

      // Think time between operations
      if (scenario.operations.indexOf(operation) < scenario.operations.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      }
    }

    console.log(`✅ Completed scenario for ${scenario.userId}`);
    return scenario;
  }

  private async executeOperation(operation: Operation, userId: string): Promise<OperationResult> {
    const startTime = Date.now();

    try {
      let command = '';
      let args: string[] = [];

      switch (operation.type) {
        case 'skill_activation':
          command = 'skills check';
          args = [
            `"${operation.parameters.skill_id}"`,
            `--threshold ${operation.parameters.threshold}`
          ];
          break;

        case 'plan_creation':
          command = 'plan create';
          args = [`"${operation.parameters.plan_name}"`];
          break;

        case 'kpi_query':
          command = 'kpi';
          args = [`--days ${operation.parameters.days}`];
          if (operation.parameters.event_types) {
            args.push(`--event-types ${operation.parameters.event_types.join(',')}`);
          }
          break;

        case 'file_processing':
          command = `skills ${operation.parameters.operation}`;
          args = [`"${operation.parameters.file_path}"`];
          break;

        case 'database_operation':
          // Database operations are simulated through file operations for testing
          command = 'skills check';
          args = [`"database operation simulation"`, `--context ${JSON.stringify(operation.parameters)}`];
          break;

        default:
          throw new Error(`Unknown operation type: ${operation.type}`);
      }

      const fullCommand = `node "${this.cliPath}" ${command} ${args.join(' ')}`;

      const result = execSync(fullCommand, {
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 30000
      });

      const duration = Date.now() - startTime;

      return {
        operation,
        success: true,
        duration,
        responseData: result,
        timestamp: Date.now()
      };

    } catch (error: any) {
      const duration = Date.now() - startTime;

      return {
        operation,
        success: false,
        duration,
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  generateMultiUserReport(): void {
    console.log('\n' + '='.repeat(80));
    console.log('👥 MULTI-USER E2E TEST REPORT');
    console.log('='.repeat(80));

    const totalUsers = this.results.length;
    const totalOperations = this.results.reduce((sum, user) => sum + user.results.length, 0);
    const successfulOperations = this.results.reduce((sum, user) =>
      sum + user.results.filter(r => r.success).length, 0);
    const failedOperations = totalOperations - successfulOperations;

    const durations = this.results.flatMap(user => user.results.map(r => r.duration));
    const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const maxDuration = Math.max(...durations);
    const minDuration = Math.min(...durations);

    console.log(`👥 Total users: ${totalUsers}`);
    console.log(`🔧 Total operations: ${totalOperations}`);
    console.log(`✅ Successful operations: ${successfulOperations} (${(successfulOperations/totalOperations*100).toFixed(1)}%)`);
    console.log(`❌ Failed operations: ${failedOperations} (${(failedOperations/totalOperations*100).toFixed(1)}%)`);
    console.log(`⏱️  Average operation duration: ${avgDuration.toFixed(0)}ms`);
    console.log(`⏱️  Max operation duration: ${maxDuration}ms`);
    console.log(`⏱️  Min operation duration: ${minDuration}ms`);

    // Performance analysis by operation type
    console.log('\n📊 Performance by Operation Type:');
    const operationTypes = ['skill_activation', 'plan_creation', 'kpi_query', 'file_processing', 'database_operation'];

    operationTypes.forEach(type => {
      const typeOperations = this.results.flatMap(user =>
        user.results.filter(r => r.operation.type === type)
      );

      if (typeOperations.length > 0) {
        const successCount = typeOperations.filter(r => r.success).length;
        const avgDuration = typeOperations.reduce((sum, r) => sum + r.duration, 0) / typeOperations.length;

        console.log(`   ${type}:`);
        console.log(`     Operations: ${typeOperations.length}`);
        console.log(`     Success rate: ${(successCount/typeOperations.length*100).toFixed(1)}%`);
        console.log(`     Avg duration: ${avgDuration.toFixed(0)}ms`);
      }
    });

    // Performance analysis by user scenario
    console.log('\n🎭 Performance by User Scenario:');
    const scenarioTypes = ['developer_workflow', 'analyst_workflow', 'admin_workflow', 'power_user_workflow'];

    scenarioTypes.forEach(scenario => {
      const userResults = this.results.filter(user => user.scenario === scenario);

      if (userResults.length > 0) {
        const userOperations = userResults.flatMap(user => user.results);
        const successCount = userOperations.filter(r => r.success).length;
        const avgDuration = userOperations.reduce((sum, r) => sum + r.duration, 0) / userOperations.length;

        console.log(`   ${scenario}:`);
        console.log(`     Users: ${userResults.length}`);
        console.log(`     Operations: ${userOperations.length}`);
        console.log(`     Success rate: ${(successCount/userOperations.length*100).toFixed(1)}%`);
        console.log(`     Avg duration: ${avgDuration.toFixed(0)}ms`);
      }
    });

    // Error analysis
    const errors = this.results.flatMap(user =>
      user.results.filter(r => !r.success).map(r => r.error)
    );

    if (errors.length > 0) {
      console.log('\n❌ Error Analysis:');
      const errorCounts = errors.reduce((acc, error) => {
        const key = error?.substring(0, 50) || 'Unknown error';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      Object.entries(errorCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .forEach(([error, count]) => {
          console.log(`   ${count}x: ${error}`);
        });
    }

    // Cleanup
    this.cleanupTestData();
  }

  private cleanupTestData(): void {
    try {
      fs.rmSync(this.testDataDir, { recursive: true, force: true });
      console.log('\n🧹 Test data cleaned up');
    } catch (error) {
      console.log('\n⚠️  Could not clean up test data:', error);
    }
  }
}

test.describe('Multi-User Advanced E2E Scenarios', () => {
  let testRunner: MultiUserTestRunner;

  test.beforeAll(async () => {
    testRunner = new MultiUserTestRunner();
    console.log('🔄 Setting up multi-user E2E tests...');

    // Check if CLI is built
    const cliPath = path.join(__dirname, '../../dist/index.js');
    if (!fs.existsSync(cliPath)) {
      console.log('📦 Building CLI for multi-user tests...');
      execSync('npm run build', { cwd: path.join(__dirname, '../..'), stdio: 'pipe' });
    }
  });

  test('Light Load Multi-User Test', async () => {
    console.log('🚀 Running light load multi-user test...');

    const config: MultiUserTestConfig = {
      concurrentUsers: 5,
      testDataSize: 10,
      operationsPerUser: 3,
      thinkTime: 1000,
      rampUpTime: 5000
    };

    const results = await testRunner.runMultiUserTest(config);

    // Verify results
    expect(results.length).toBe(config.concurrentUsers);

    const totalOperations = results.reduce((sum, user) => sum + user.results.length, 0);
    expect(totalOperations).toBe(config.concurrentUsers * config.operationsPerUser);

    const successfulOperations = results.reduce((sum, user) =>
      sum + user.results.filter(r => r.success).length, 0);
    const successRate = successfulOperations / totalOperations;

    console.log(`✅ Light load test: ${successRate.toFixed(1)}% success rate`);
    expect(successRate).toBeGreaterThan(0.7); // At least 70% success rate

    testRunner.generateMultiUserReport();
  });

  test('Medium Load Multi-User Test', async () => {
    console.log('🚀 Running medium load multi-user test...');

    const config: MultiUserTestConfig = {
      concurrentUsers: 10,
      testDataSize: 50,
      operationsPerUser: 5,
      thinkTime: 500,
      rampUpTime: 10000
    };

    const results = await testRunner.runMultiUserTest(config);

    // Verify results
    expect(results.length).toBe(config.concurrentUsers);

    const totalOperations = results.reduce((sum, user) => sum + user.results.length, 0);
    const successfulOperations = results.reduce((sum, user) =>
      sum + user.results.filter(r => r.success).length, 0);
    const successRate = successfulOperations / totalOperations;

    console.log(`✅ Medium load test: ${successRate.toFixed(1)}% success rate`);
    expect(successRate).toBeGreaterThan(0.6); // At least 60% success rate under higher load

    // Performance validation
    const durations = results.flatMap(user => user.results.map(r => r.duration));
    const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;

    console.log(`✅ Medium load test: ${avgDuration.toFixed(0)}ms average operation duration`);
    expect(avgDuration).toBeLessThan(15000); // Average should be under 15 seconds
  });

  test('Heavy Load Multi-User Test', async () => {
    console.log('🚀 Running heavy load multi-user test...');

    const config: MultiUserTestConfig = {
      concurrentUsers: 20,
      testDataSize: 100,
      operationsPerUser: 8,
      thinkTime: 200,
      rampUpTime: 20000
    };

    const results = await testRunner.runMultiUserTest(config);

    // Verify results
    expect(results.length).toBe(config.concurrentUsers);

    const totalOperations = results.reduce((sum, user) => sum + user.results.length, 0);
    const successfulOperations = results.reduce((sum, user) =>
      sum + user.results.filter(r => r.success).length, 0);
    const successRate = successfulOperations / totalOperations;

    console.log(`✅ Heavy load test: ${successRate.toFixed(1)}% success rate`);
    expect(successRate).toBeGreaterThan(0.4); // At least 40% success rate under heavy load

    // Check for system stability
    const failedOperations = results.reduce((sum, user) =>
      sum + user.results.filter(r => !r.success).length, 0);
    const failureRate = failedOperations / totalOperations;

    console.log(`✅ Heavy load test: ${failureRate.toFixed(1)}% failure rate`);
    expect(failureRate).toBeLessThan(0.8); // Failure rate should be under 80%
  });

  test('Large Dataset Processing', async () => {
    console.log('🚀 Running large dataset processing test...');

    const config: MultiUserTestConfig = {
      concurrentUsers: 5,
      testDataSize: 1000, // Large dataset
      operationsPerUser: 10,
      thinkTime: 100,
      rampUpTime: 5000
    };

    const results = await testRunner.runMultiUserTest(config);

    // Verify large dataset handling
    expect(results.length).toBe(config.concurrentUsers);

    const totalOperations = results.reduce((sum, user) => sum + user.results.length, 0);
    const successfulOperations = results.reduce((sum, user) =>
      sum + user.results.filter(r => r.success).length, 0);
    const successRate = successfulOperations / totalOperations;

    console.log(`✅ Large dataset test: ${successRate.toFixed(1)}% success rate`);
    expect(successRate).toBeGreaterThan(0.3); // At least 30% success rate with large datasets

    // Memory usage validation
    const durations = results.flatMap(user => user.results.map(r => r.duration));
    const maxDuration = Math.max(...durations);

    console.log(`✅ Large dataset test: ${maxDuration}ms max operation duration`);
    expect(maxDuration).toBeLessThan(60000); // Max operation should be under 60 seconds
  });

  test('Stress Multi-User Test', async () => {
    console.log('🚀 Running stress multi-user test...');

    const config: MultiUserTestConfig = {
      concurrentUsers: 50, // High concurrency
      testDataSize: 200,
      operationsPerUser: 5,
      thinkTime: 50, // Minimal think time
      rampUpTime: 30000
    };

    const results = await testRunner.runMultiUserTest(config);

    // Stress test validation
    expect(results.length).toBe(config.concurrentUsers);

    const totalOperations = results.reduce((sum, user) => sum + user.results.length, 0);
    const successfulOperations = results.reduce((sum, user) =>
      sum + user.results.filter(r => r.success).length, 0);
    const successRate = successfulOperations / totalOperations;

    console.log(`✅ Stress test: ${successRate.toFixed(1)}% success rate`);
    expect(successRate).toBeGreaterThan(0.2); // At least 20% success rate under stress

    // System resilience check
    const completedUsers = results.filter(user =>
      user.results.filter(r => r.success).length > 0
    ).length;
    const completionRate = completedUsers / config.concurrentUsers;

    console.log(`✅ Stress test: ${completionRate.toFixed(1)}% user completion rate`);
    expect(completionRate).toBeGreaterThan(0.5); // At least 50% of users should complete some operations
  });

  test('Real-World Scenario Simulation', async () => {
    console.log('🚀 Running real-world scenario simulation...');

    // Simulate a realistic mix of user types and operations
    const scenarios = [
      {
        name: 'Morning Rush - Developers',
        users: 15,
        operations: 8,
        thinkTime: 2000,
        config: { testDataSize: 50, rampUpTime: 60000 }
      },
      {
        name: 'Analytics Team - Data Processing',
        users: 5,
        operations: 12,
        thinkTime: 5000,
        config: { testDataSize: 500, rampUpTime: 30000 }
      },
      {
        name: 'Admin Team - System Management',
        users: 3,
        operations: 6,
        thinkTime: 3000,
        config: { testDataSize: 100, rampUpTime: 15000 }
      }
    ];

    const allResults: any[] = [];

    for (const scenario of scenarios) {
      console.log(`🔄 Running ${scenario.name}...`);

      const config: MultiUserTestConfig = {
        concurrentUsers: scenario.users,
        testDataSize: scenario.config.testDataSize,
        operationsPerUser: scenario.operations,
        thinkTime: scenario.thinkTime,
        rampUpTime: scenario.config.rampUpTime
      };

      const results = await testRunner.runMultiUserTest(config);
      allResults.push(...results);
    }

    // Real-world scenario validation
    expect(allResults.length).toBeGreaterThan(0);

    const totalOperations = allResults.reduce((sum, user) => sum + user.results.length, 0);
    const successfulOperations = allResults.reduce((sum, user) =>
      sum + user.results.filter(r => r.success).length, 0);
    const successRate = successfulOperations / totalOperations;

    console.log(`✅ Real-world simulation: ${successRate.toFixed(1)}% overall success rate`);
    expect(successRate).toBeGreaterThan(0.5); // At least 50% success rate in real-world scenarios

    // Performance consistency check
    const scenarioPerformance = scenarios.map((scenario, index) => {
      const startIdx = index * scenario.users;
      const endIdx = startIdx + scenario.users;
      const scenarioResults = allResults.slice(startIdx, endIdx);

      const operations = scenarioResults.flatMap(user => user.results);
      const successCount = operations.filter(r => r.success).length;
      const avgDuration = operations.reduce((sum, r) => sum + r.duration, 0) / operations.length;

      return {
        name: scenario.name,
        successRate: successCount / operations.length,
        avgDuration
      };
    });

    console.log('\n📊 Real-world Scenario Performance:');
    scenarioPerformance.forEach(perf => {
      console.log(`   ${perf.name}: ${(perf.successRate * 100).toFixed(1)}% success, ${perf.avgDuration.toFixed(0)}ms avg`);
    });

    // Validate performance consistency
    const successRates = scenarioPerformance.map(p => p.successRate);
    const maxSuccessRateVariance = Math.max(...successRates) - Math.min(...successRates);

    expect(maxSuccessRateVariance).toBeLessThan(0.5); // Success rates should be within 50% of each other
  });
});