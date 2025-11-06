import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { CLIHelper } from '../utils/test-helpers';
import { join } from 'path';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';

describe('CLI Plan Commands Integration Tests', () => {
  const testPlansDir = join(__dirname, '../../../test-plans');
  const planFile = join(testPlansDir, 'test-plan.json');

  beforeAll(() => {
    mkdirSync(testPlansDir, { recursive: true });
  });

  afterAll(() => {
    rmSync(testPlansDir, { recursive: true, force: true });
  });

  describe('plan create command', () => {
    test('should create a new plan successfully', async () => {
      const result = await CLIHelper.planCommand('create', [
        'Implement user authentication system',
        '--output', planFile
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Plan created');
      expect(existsSync(planFile)).toBe(true);
    });

    test('should create plan with CLOOP methodology', async () => {
      const result = await CLIHelper.planCommand('create', [
        'Build REST API with CRUD operations',
        '--methodology', 'cloop',
        '--output', planFile
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('CLOOP');

      if (existsSync(planFile)) {
        const planContent = JSON.parse(require('fs').readFileSync(planFile, 'utf8'));
        expect(planContent.methodology).toBe('cloop');
      }
    });

    test('should handle plan creation with complexity estimation', async () => {
      const result = await CLIHelper.planCommand('create', [
        'Microservices architecture with event-driven communication',
        '--estimate-complexity',
        '--output', planFile
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('complexity');
    });
  });

  describe('plan save command', () => {
    test('should save current plan state', async () => {
      // First create a plan
      await CLIHelper.planCommand('create', [
        'Test plan for saving',
        '--output', planFile
      ]);

      const result = await CLIHelper.planCommand('save', [
        '--file', planFile
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('saved');
    });
  });

  describe('plan list command', () => {
    test('should list available plans', async () => {
      // Create a few test plans
      for (let i = 1; i <= 3; i++) {
        const testPlan = join(testPlansDir, `plan-${i}.json`);
        await CLIHelper.planCommand('create', [
          `Test plan ${i}`,
          '--output', testPlan
        ]);
      }

      const result = await CLIHelper.planCommand('list', [
        '--directory', testPlansDir
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('plan-1');
      expect(result.stdout).toContain('plan-2');
      expect(result.stdout).toContain('plan-3');
    });

    test('should handle empty plans directory', async () => {
      const emptyDir = join(testPlansDir, 'empty');
      mkdirSync(emptyDir);

      const result = await CLIHelper.planCommand('list', [
        '--directory', emptyDir
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('No plans found');
    });
  });

  describe('plan validate command', () => {
    test('should validate plan structure', async () => {
      // Create a valid plan
      await CLIHelper.planCommand('create', [
        'Valid test plan',
        '--output', planFile
      ]);

      const result = await CLIHelper.planCommand('validate', [
        '--file', planFile
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('valid');
    });

    test('should detect invalid plan structure', async () => {
      // Create an invalid plan file
      const invalidPlan = {
        invalid: 'structure',
        missing: 'required fields'
      };
      writeFileSync(planFile, JSON.stringify(invalidPlan));

      const result = await CLIHelper.planCommand('validate', [
        '--file', planFile
      ]);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('invalid');
    });
  });

  describe('Error handling and edge cases', () => {
    test('should handle missing plan file gracefully', async () => {
      const result = await CLIHelper.planCommand('validate', [
        '--file', '/nonexistent/plan.json'
      ]);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('not found');
    });

    test('should handle empty plan description', async () => {
      const result = await CLIHelper.planCommand('create', [
        '',
        '--output', planFile
      ]);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('description');
    });

    test('should handle very long plan description', async () => {
      const longDescription = 'Complex system '.repeat(1000);
      const result = await CLIHelper.planCommand('create', [
        longDescription,
        '--output', planFile
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Plan created');
    });

    test('should handle malformed JSON in plan file', async () => {
      writeFileSync(planFile, '{ invalid json structure }');

      const result = await CLIHelper.planCommand('validate', [
        '--file', planFile
      ]);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('JSON');
    });
  });

  describe('Plan integration with CLOOP methodology', () => {
    test('should create plan with proper CLOOP phases', async () => {
      const result = await CLIHelper.planCommand('create', [
        'Implement OAuth 2.0 authentication',
        '--methodology', 'cloop',
        '--output', planFile
      ]);

      expect(result.exitCode).toBe(0);

      if (existsSync(planFile)) {
        const planContent = JSON.parse(require('fs').readFileSync(planFile, 'utf8'));
        expect(planContent.phases).toBeDefined();
        expect(planContent.phases.length).toBeGreaterThan(0);

        // Check for CLOOP phases
        const phaseNames = planContent.phases.map((p: any) => p.id.toLowerCase());
        expect(phaseNames).toContain('clarify');
        expect(phaseNames).toContain('layout');
        expect(phaseNames).toContain('operate');
        expect(phaseNames).toContain('observe');
        expect(phaseNames).toContain('reflect');
      }
    });

    test('should handle plan phase tracking', async () => {
      await CLIHelper.planCommand('create', [
        'Multi-phase development plan',
        '--methodology', 'cloop',
        '--output', planFile
      ]);

      const result = await CLIHelper.planCommand('status', [
        '--file', planFile
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('phase');
    });
  });

  describe('Performance tests', () => {
    test('should handle plan creation efficiently', async () => {
      const startTime = Date.now();
      const result = await CLIHelper.planCommand('create', [
        'Complex enterprise system with microservices, databases, and authentication',
        '--estimate-complexity',
        '--methodology', 'cloop',
        '--output', planFile
      ]);
      const duration = Date.now() - startTime;

      expect(result.exitCode).toBe(0);
      // Should complete within reasonable time (3 seconds)
      expect(duration).toBeLessThan(3000);
    });

    test('should handle multiple plan operations efficiently', async () => {
      const startTime = Date.now();

      // Create multiple plans
      for (let i = 0; i < 5; i++) {
        const testPlan = join(testPlansDir, `perf-plan-${i}.json`);
        await CLIHelper.planCommand('create', [
          `Performance test plan ${i}`,
          '--output', testPlan
        ]);
      }

      const duration = Date.now() - startTime;

      // 5 plans should be created within reasonable time (10 seconds)
      expect(duration).toBeLessThan(10000);
    });
  });
});