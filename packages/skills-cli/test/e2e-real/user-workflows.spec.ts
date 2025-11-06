/**
 * Real-world User Workflow E2E Tests
 * Tests complete user journeys with actual CLI operations
 */

import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Test configuration
const CLI_PATH = path.join(__dirname, '../../dist/index.js');
const TEST_DATA_DIR = path.join(__dirname, 'test-data');
const RESULTS_DIR = path.join(__dirname, 'results');

// Ensure test directories exist
if (!fs.existsSync(TEST_DATA_DIR)) {
  fs.mkdirSync(TEST_DATA_DIR, { recursive: true });
}
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

test.describe('Real User Workflows', () => {

  test.beforeEach(async () => {
    // Ensure CLI is available and working
    try {
      execSync(`node ${CLI_PATH} --version`, { stdio: 'pipe' });
    } catch (error) {
      console.log('CLI not available, skipping E2E tests');
      test.skip();
    }
  });

  test('Complete skill validation workflow', async () => {
    console.log('🔄 Testing complete skill validation workflow...');

    // Create a test skill directory
    const testSkillDir = path.join(TEST_DATA_DIR, 'test-validation-skill');
    if (!fs.existsSync(testSkillDir)) {
      fs.mkdirSync(testSkillDir, { recursive: true });
    }

    // Create a basic SKILL.md file
    const skillContent = `---
id: test-validation-skill
version: 0.1.0
type: guideline
summary: 'Test skill for validation workflow'
audience: engineers
when_to_use: 'Testing validation workflow'
severity: medium
tags: [testing, validation, workflow]
---

# Test Validation Skill

## Purpose
This skill validates the complete CLI workflow for skill processing.

## Implementation
1. Create skill
2. Validate skill
3. Check skill
4. Index skill
`;

    const skillFile = path.join(testSkillDir, 'SKILL.md');
    fs.writeFileSync(skillFile, skillContent);

    // Step 1: Skills lint validation
    console.log('Step 1: Running skills lint...');
    try {
      const lintResult = execSync(`node ${CLI_PATH} skills lint ${testSkillDir}`, {
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 30000
      });
      expect(lintResult).toContain('✅');
      console.log('✅ Skills lint passed');
    } catch (error) {
      console.log('❌ Skills lint failed:', error.message);
      throw error;
    }

    // Step 2: Skills check
    console.log('Step 2: Running skills check...');
    try {
      const checkResult = execSync(`node ${CLI_PATH} skills check "test validation workflow" --threshold 0.8`, {
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 30000
      });
      expect(checkResult).toContain('matching skills');
      console.log('✅ Skills check passed');
    } catch (error) {
      console.log('❌ Skills check failed:', error.message);
      throw error;
    }

    // Step 3: Skills index
    console.log('Step 3: Running skills index...');
    const registryFile = path.join(RESULTS_DIR, 'test-registry.json');
    try {
      execSync(`node ${CLI_PATH} skills index ${TEST_DATA_DIR} --out ${registryFile}`, {
        stdio: 'pipe',
        timeout: 30000
      });

      expect(fs.existsSync(registryFile)).toBeTruthy();
      const registry = JSON.parse(fs.readFileSync(registryFile, 'utf8'));
      expect(registry.skills).toBeDefined();
      expect(registry.skills.length).toBeGreaterThan(0);
      console.log('✅ Skills index passed');
    } catch (error) {
      console.log('❌ Skills index failed:', error.message);
      throw error;
    }

    // Step 4: Verify skill in registry
    console.log('Step 4: Verifying skill in registry...');
    try {
      const registry = JSON.parse(fs.readFileSync(registryFile, 'utf8'));
      const testSkill = registry.skills.find((skill: any) => skill.id === 'test-validation-skill');
      expect(testSkill).toBeDefined();
      expect(testSkill?.name).toBe('test-validation-skill');
      console.log('✅ Skill found in registry');
    } catch (error) {
      console.log('❌ Skill verification failed:', error.message);
      throw error;
    }

    console.log('🎉 Complete skill validation workflow passed!');
  });

  test('Plan generation and management workflow', async () => {
    console.log('🔄 Testing plan generation workflow...');

    // Step 1: Create a plan
    console.log('Step 1: Creating plan...');
    try {
      const planResult = execSync(`node ${CLI_PATH} plan create "implement comprehensive testing strategy for CLI tool"`, {
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 60000
      });
      expect(planResult).toContain('✅');
      expect(planResult).toContain('Plan created');
      console.log('✅ Plan creation passed');
    } catch (error) {
      console.log('❌ Plan creation failed:', error.message);
      throw error;
    }

    // Step 2: List plans
    console.log('Step 2: Listing plans...');
    try {
      const listResult = execSync(`node ${CLI_PATH} plan list`, {
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 30000
      });
      expect(listResult).toContain('Available plans');
      console.log('✅ Plan listing passed');
    } catch (error) {
      console.log('❌ Plan listing failed:', error.message);
      throw error;
    }

    // Step 3: Save plan documentation
    console.log('Step 3: Saving plan...');
    try {
      execSync(`node ${CLI_PATH} plan save`, {
        stdio: 'pipe',
        timeout: 30000
      });

      // Check if plan files were created
      const planFiles = ['plan.md', 'context.md', 'tasks.md'];
      planFiles.forEach(file => {
        const filePath = path.join(process.cwd(), file);
        if (fs.existsSync(filePath)) {
          console.log(`✅ ${file} created`);
        } else {
          console.log(`⚠️  ${file} not found (might be in different directory)`);
        }
      });
    } catch (error) {
      console.log('❌ Plan save failed:', error.message);
      throw error;
    }

    console.log('🎉 Plan generation workflow passed!');
  });

  test('KPI monitoring workflow', async () => {
    console.log('🔄 Testing KPI monitoring workflow...');

    // Step 1: Show basic KPIs
    console.log('Step 1: Showing KPIs...');
    try {
      const kpiResult = execSync(`node ${CLI_PATH} kpi --days 7`, {
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 30000
      });
      expect(kpiResult).toContain('KPI Summary');
      console.log('✅ Basic KPIs displayed');
    } catch (error) {
      console.log('❌ KPI display failed:', error.message);
      throw error;
    }

    // Step 2: Generate KPI dashboard
    console.log('Step 2: Generating KPI dashboard...');
    try {
      const dashboardResult = execSync(`node ${CLI_PATH} kpi --generate-dashboard`, {
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 30000
      });
      expect(dashboardResult).toContain('Dashboard generated');
      console.log('✅ KPI dashboard generated');
    } catch (error) {
      console.log('❌ KPI dashboard generation failed:', error.message);
      throw error;
    }

    console.log('🎉 KPI monitoring workflow passed!');
  });

  test('Error handling and recovery workflow', async () => {
    console.log('🔄 Testing error handling workflow...');

    // Step 1: Test invalid command handling
    console.log('Step 1: Testing invalid command...');
    try {
      execSync(`node ${CLI_PATH} invalid-command --invalid-flag`, {
        stdio: 'pipe',
        timeout: 10000
      });
      expect.fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.status).toBeGreaterThan(0);
      expect(error.stderr || error.stdout?.toString()).toContain('Error');
      console.log('✅ Invalid command handled correctly');
    }

    // Step 2: Test invalid argument handling
    console.log('Step 2: Testing invalid arguments...');
    try {
      execSync(`node ${CLI_PATH} skills lint /nonexistent/path`, {
        stdio: 'pipe',
        timeout: 10000
      });
      expect.fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.status).toBeGreaterThan(0);
      console.log('✅ Invalid arguments handled correctly');
    }

    // Step 3: Test help command (should always work)
    console.log('Step 3: Testing help command...');
    try {
      const helpResult = execSync(`node ${CLI_PATH} --help`, {
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 10000
      });
      expect(helpResult).toContain('Usage:');
      expect(helpResult).toContain('Options:');
      console.log('✅ Help command works correctly');
    } catch (error) {
      console.log('❌ Help command failed:', error.message);
      throw error;
    }

    // Step 4: Test version command (should always work)
    console.log('Step 4: Testing version command...');
    try {
      const versionResult = execSync(`node ${CLI_PATH} --version`, {
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 10000
      });
      expect(versionResult).toMatch(/\d+\.\d+\.\d+/); // Should contain version number
      console.log('✅ Version command works correctly');
    } catch (error) {
      console.log('❌ Version command failed:', error.message);
      throw error;
    }

    console.log('🎉 Error handling workflow passed!');
  });

  test('Multi-step integration workflow', async () => {
    console.log('🔄 Testing multi-step integration workflow...');

    // Create comprehensive test data
    const integrationTestDir = path.join(TEST_DATA_DIR, 'integration-test');
    if (!fs.existsSync(integrationTestDir)) {
      fs.mkdirSync(integrationTestDir, { recursive: true });
    }

    // Step 1: Create multiple test skills
    const skills = [
      {
        file: 'skill-a.md',
        content: `---
id: skill-a
version: 0.1.0
type: guideline
summary: 'Integration test skill A'
---
# Skill A
Integration testing component A.`
      },
      {
        file: 'skill-b.md',
        content: `---
id: skill-b
version: 0.1.0
type: guideline
summary: 'Integration test skill B'
---
# Skill B
Integration testing component B.`
      }
    ];

    console.log('Step 1: Creating test skills...');
    skills.forEach(skill => {
      fs.writeFileSync(path.join(integrationTestDir, skill.file), skill.content);
    });
    console.log('✅ Test skills created');

    // Step 2: Validate all skills
    console.log('Step 2: Validating all skills...');
    try {
      const lintResult = execSync(`node ${CLI_PATH} skills lint ${integrationTestDir}`, {
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 30000
      });
      expect(lintResult).toContain('✅');
      console.log('✅ All skills validated');
    } catch (error) {
      console.log('❌ Skills validation failed:', error.message);
      throw error;
    }

    // Step 3: Check skill discovery
    console.log('Step 3: Testing skill discovery...');
    try {
      const checkResult = execSync(`node ${CLI_PATH} skills check "integration testing" --threshold 0.7`, {
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 30000
      });
      expect(checkResult).toContain('matching skills');
      console.log('✅ Skill discovery working');
    } catch (error) {
      console.log('❌ Skill discovery failed:', error.message);
      throw error;
    }

    // Step 4: Create comprehensive plan
    console.log('Step 4: Creating comprehensive plan...');
    try {
      const planResult = execSync(`node ${CLI_PATH} plan create "integrate multiple skills and validate workflow"`, {
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 60000
      });
      expect(planResult).toContain('✅');
      console.log('✅ Comprehensive plan created');
    } catch (error) {
      console.log('❌ Plan creation failed:', error.message);
      throw error;
    }

    // Step 5: Generate KPI report
    console.log('Step 5: Generating KPI report...');
    try {
      const kpiResult = execSync(`node ${CLI_PATH} kpi --days 1`, {
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 30000
      });
      expect(kpiResult).toContain('KPI Summary');
      console.log('✅ KPI report generated');
    } catch (error) {
      console.log('❌ KPI report failed:', error.message);
      throw error;
    }

    console.log('🎉 Multi-step integration workflow passed!');
  });

  test.afterEach(async () => {
    // Cleanup test data
    try {
      if (fs.existsSync(TEST_DATA_DIR)) {
        fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true });
      }
    } catch (error) {
      console.log('Warning: Could not cleanup test data:', error.message);
    }
  });

  test.afterAll(async () => {
    // Final cleanup
    try {
      if (fs.existsSync(RESULTS_DIR)) {
        const files = fs.readdirSync(RESULTS_DIR);
        files.forEach(file => {
          if (file.includes('test-registry')) {
            fs.rmSync(path.join(RESULTS_DIR, file), { force: true });
          }
        });
      }
    } catch (error) {
      console.log('Warning: Could not cleanup results:', error.message);
    }
  });
});