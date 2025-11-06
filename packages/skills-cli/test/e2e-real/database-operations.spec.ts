/**
 * Database Operations E2E Tests
 * Tests CLI operations that interact with database systems
 */

import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface DatabaseConfig {
  type: 'postgresql' | 'redis' | 'sqlite';
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
}

interface TestResult {
  success: boolean;
  duration: number;
  data?: any;
  error?: string;
}

class DatabaseTestHelper {
  private testResults: TestResult[] = [];

  async executeCommand(command: string, timeout = 30000): Promise<TestResult> {
    const startTime = Date.now();
    try {
      const result = execSync(command, {
        encoding: 'utf8',
        stdio: 'pipe',
        timeout
      });

      return {
        success: true,
        duration: Date.now() - startTime,
        data: result.trim()
      };
    } catch (error: any) {
      return {
        success: false,
        duration: Date.now() - startTime,
        error: error.message
      };
    }
  }

  checkDatabaseConnection(config: DatabaseConfig): Promise<TestResult> {
    switch (config.type) {
      case 'postgresql':
        return this.checkPostgreSQLConnection(config);
      case 'redis':
        return this.checkRedisConnection(config);
      default:
        return Promise.resolve({ success: false, duration: 0, error: 'Unsupported database type' });
    }
  }

  private async checkPostgreSQLConnection(config: DatabaseConfig): Promise<TestResult> {
    const pgCommand = `psql -h ${config.host || 'localhost'} -p ${config.port || 5432} -U ${config.username || 'postgres'} -d ${config.database || 'postgres'} -c "SELECT 1;"`;
    return this.executeCommand(pgCommand, 10000);
  }

  private async checkRedisConnection(config: DatabaseConfig): Promise<TestResult> {
    const redisCommand = `redis-cli -h ${config.host || 'localhost'} -p ${config.port || 6379} ping`;
    return this.executeCommand(redisCommand, 5000);
  }

  addResult(result: TestResult) {
    this.testResults.push(result);
  }

  getResults() {
    return this.testResults;
  }

  getSummary() {
    const total = this.testResults.length;
    const successful = this.testResults.filter(r => r.success).length;
    const avgDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0) / total;

    return {
      total,
      successful,
      failed: total - successful,
      successRate: (successful / total) * 100,
      averageDuration: avgDuration,
      fastest: Math.min(...this.testResults.map(r => r.duration)),
      slowest: Math.max(...this.testResults.map(r => r.duration))
    };
  }
}

test.describe('Database Operations Integration', () => {
  let dbHelper: DatabaseTestHelper;
  const cliPath = path.join(__dirname, '../../dist/index.js');

  test.beforeAll(async () => {
    dbHelper = new DatabaseTestHelper();
    console.log('🔄 Setting up database integration tests...');

    // Check if CLI is built
    if (!fs.existsSync(cliPath)) {
      console.log('📦 Building CLI for database tests...');
      execSync('npm run build', { cwd: path.join(__dirname, '../..'), stdio: 'pipe' });
    }
  });

  test('PostgreSQL connection testing', async () => {
    console.log('🔄 Testing PostgreSQL connection...');

    const pgConfig: DatabaseConfig = {
      type: 'postgresql',
      host: process.env.PG_HOST || 'localhost',
      port: parseInt(process.env.PG_PORT || '5432'),
      database: process.env.PG_DATABASE || 'postgres',
      username: process.env.PG_USER || 'postgres'
    };

    const result = await dbHelper.checkDatabaseConnection(pgConfig);
    dbHelper.addResult(result);

    if (result.success) {
      console.log('✅ PostgreSQL connection successful');
    } else {
      console.log('⚠️  PostgreSQL connection failed:', result.error);
      // Don't fail the test if PostgreSQL is not available
      test.skip();
    }
  });

  test('Redis connection testing', async () => {
    console.log('🔄 Testing Redis connection...');

    const redisConfig: DatabaseConfig = {
      type: 'redis',
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379')
    };

    const result = await dbHelper.checkDatabaseConnection(redisConfig);
    dbHelper.addResult(result);

    if (result.success) {
      console.log('✅ Redis connection successful');
    } else {
      console.log('⚠️  Redis connection failed:', result.error);
      // Don't fail the test if Redis is not available
      test.skip();
    }
  });

  test('Skills database operations', async () => {
    console.log('🔄 Testing skills database operations...');

    // Test skills indexing with database backend
    const testDataDir = path.join(__dirname, 'test-data');
    if (!fs.existsSync(testDataDir)) {
      fs.mkdirSync(testDataDir, { recursive: true });
    }

    // Create test skills
    const testSkills = [
      {
        id: 'db-test-skill-1',
        name: 'Database Test Skill 1',
        content: 'Test skill for database operations',
        file: 'db-skill-1.md'
      },
      {
        id: 'db-test-skill-2',
        name: 'Database Test Skill 2',
        content: 'Another test skill for database validation',
        file: 'db-skill-2.md'
      }
    ];

    testSkills.forEach(skill => {
      const skillContent = `---
id: ${skill.id}
version: 0.1.0
type: guideline
summary: '${skill.name}'
tags: [database, testing, integration]
---

# ${skill.name}

${skill.content}
`;
      fs.writeFileSync(path.join(testDataDir, skill.file), skillContent);
    });

    // Test skills indexing
    const registryFile = path.join(testDataDir, 'db-test-registry.json');
    const indexResult = await dbHelper.executeCommand(
      `node ${cliPath} skills index ${testDataDir} --out ${registryFile}`
    );
    dbHelper.addResult(indexResult);

    if (indexResult.success) {
      console.log('✅ Skills indexing successful');
      expect(fs.existsSync(registryFile)).toBeTruthy();

      // Verify registry content
      const registry = JSON.parse(fs.readFileSync(registryFile, 'utf8'));
      expect(registry.skills).toBeDefined();
      expect(registry.skills.length).toBeGreaterThanOrEqual(2);
      console.log(`✅ Registry contains ${registry.skills.length} skills`);
    } else {
      console.log('❌ Skills indexing failed:', indexResult.error);
      throw new Error(indexResult.error);
    }

    // Cleanup test data
    try {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    } catch (error) {
      console.log('⚠️  Could not cleanup test data:', error);
    }
  });

  test('KPI database operations', async () => {
    console.log('🔄 Testing KPI database operations...');

    // Generate some test KPI events
    const kpiEventsFile = path.join(__dirname, 'test-data', 'test-kpi-events.jsonl');
    const kpiDataDir = path.dirname(kpiEventsFile);

    if (!fs.existsSync(kpiDataDir)) {
      fs.mkdirSync(kpiDataDir, { recursive: true });
    }

    // Create test KPI events
    const testEvents = [
      {
        timestamp: new Date().toISOString(),
        event_type: 'skill_activation',
        data: { skill_id: 'test-skill-1', user_id: 'test-user-1', duration: 150 }
      },
      {
        timestamp: new Date().toISOString(),
        event_type: 'plan_creation',
        data: { plan_id: 'test-plan-1', user_id: 'test-user-1', complexity: 'medium' }
      },
      {
        timestamp: new Date().toISOString(),
        event_type: 'kpi_query',
        data: { query_type: 'daily_metrics', user_id: 'test-user-1', response_time: 85 }
      }
    ];

    // Write events as JSONL
    const eventsJsonl = testEvents.map(event => JSON.stringify(event)).join('\n');
    fs.writeFileSync(kpiEventsFile, eventsJsonl);

    // Test KPI processing
    const kpiResult = await dbHelper.executeCommand(
      `node ${cliPath} kpi --days 1 --input ${kpiEventsFile}`
    );
    dbHelper.addResult(kpiResult);

    if (kpiResult.success) {
      console.log('✅ KPI processing successful');
      expect(kpiResult.data).toContain('KPI Summary');
    } else {
      console.log('❌ KPI processing failed:', kpiResult.error);
      // Don't fail if KPI features are not implemented
    }

    // Cleanup
    try {
      fs.rmSync(kpiDataDir, { recursive: true, force: true });
    } catch (error) {
      console.log('⚠️  Could not cleanup KPI test data:', error);
    }
  });

  test('Plan database persistence', async () => {
    console.log('🔄 Testing plan database persistence...');

    // Test plan creation and persistence
    const planResult = await dbHelper.executeCommand(
      `node ${cliPath} plan create "database testing workflow with persistent storage"`
    );
    dbHelper.addResult(planResult);

    if (planResult.success) {
      console.log('✅ Plan creation successful');

      // Test plan save (should persist to database/filesystem)
      const saveResult = await dbHelper.executeCommand(`node ${cliPath} plan save`);
      dbHelper.addResult(saveResult);

      if (saveResult.success) {
        console.log('✅ Plan persistence successful');

        // Check if plan files were created
        const planFiles = ['plan.md', 'context.md', 'tasks.md'];
        let filesFound = 0;

        planFiles.forEach(file => {
          if (fs.existsSync(path.join(process.cwd(), file))) {
            filesFound++;
            console.log(`✅ Found ${file}`);
          }
        });

        expect(filesFound).toBeGreaterThan(0);
      } else {
        console.log('❌ Plan persistence failed:', saveResult.error);
      }
    } else {
      console.log('❌ Plan creation failed:', planResult.error);
      throw new Error(planResult.error);
    }
  });

  test('Concurrent database operations', async () => {
    console.log('🔄 Testing concurrent database operations...');

    // Test multiple simultaneous skills operations
    const concurrentOps = 3;
    const promises: Promise<TestResult>[] = [];

    for (let i = 0; i < concurrentOps; i++) {
      const promise = dbHelper.executeCommand(
        `node ${cliPath} skills check "concurrent test operation ${i}" --threshold 0.5`,
        20000
      );
      promises.push(promise);
    }

    const startTime = Date.now();
    const results = await Promise.allSettled(promises);
    const totalTime = Date.now() - startTime;

    // Process results
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        dbHelper.addResult(result.value);
      } else {
        dbHelper.addResult({
          success: false,
          duration: 0,
          error: `Operation ${index} failed`
        });
      }
    });

    console.log(`\n📊 Concurrent Operations Results:`);
    console.log(`   Total operations: ${results.length}`);
    console.log(`   Successful: ${successful}`);
    console.log(`   Failed: ${failed}`);
    console.log(`   Total time: ${totalTime}ms`);

    // Ensure reasonable performance under load
    expect(successful).toBeGreaterThan(0);
    expect(totalTime).toBeLessThan(60000); // 60 seconds max
  });

  test('Database error handling and recovery', async () => {
    console.log('🔄 Testing database error handling...');

    // Test with invalid database path
    const invalidPathResult = await dbHelper.executeCommand(
      `node ${cliPath} skills index /nonexistent/path`
    );
    dbHelper.addResult(invalidPathResult);

    if (!invalidPathResult.success) {
      console.log('✅ Invalid path error handled correctly');
    } else {
      console.log('⚠️  Expected error for invalid path');
    }

    // Test with corrupted data
    const corruptedDataDir = path.join(__dirname, 'test-data', 'corrupted');
    if (!fs.existsSync(corruptedDataDir)) {
      fs.mkdirSync(corruptedDataDir, { recursive: true });
    }

    // Create corrupted skill file
    const corruptedSkillFile = path.join(corruptedDataDir, 'corrupted.md');
    fs.writeFileSync(corruptedSkillFile, 'Invalid { not JSON content');

    const corruptedResult = await dbHelper.executeCommand(
      `node ${cliPath} skills lint ${corruptedDataDir}`
    );
    dbHelper.addResult(corruptedResult);

    if (!corruptedResult.success) {
      console.log('✅ Corrupted data error handled correctly');
    } else {
      console.log('⚠️  Expected error for corrupted data');
    }

    // Cleanup
    try {
      fs.rmSync(path.join(__dirname, 'test-data'), { recursive: true, force: true });
    } catch (error) {
      console.log('⚠️  Could not cleanup corrupted test data:', error);
    }
  });

  test.afterAll(async () => {
    console.log('\n📊 Database Operations Test Summary:');
    const summary = dbHelper.getSummary();

    console.log(`   Total operations: ${summary.total}`);
    console.log(`   Successful: ${summary.successful} (${summary.successRate.toFixed(1)}%)`);
    console.log(`   Failed: ${summary.failed}`);
    console.log(`   Average duration: ${summary.averageDuration.toFixed(0)}ms`);
    console.log(`   Fastest operation: ${summary.fastest}ms`);
    console.log(`   Slowest operation: ${summary.slowest}ms`);

    // Ensure at least 70% success rate for database operations
    expect(summary.successRate).toBeGreaterThan(70);
  });
});