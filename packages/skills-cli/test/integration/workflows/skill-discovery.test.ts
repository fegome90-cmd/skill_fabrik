/**
 * Skill Discovery Workflow Tests
 * Tests for user interactions related to skill discovery and validation
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { MockCLI, MockCLIFactory, MockScenarios } from '../utils/cli-mocks.js';
import { InteractionTester } from '../utils/interaction-helpers.js';
import { UserScenarios, UserPersonas } from '../utils/user-scenarios.js';

describe('Skill Discovery Workflow Tests', () => {
  let mockCLI: MockCLI;
  let interactionTester: InteractionTester;
  let userScenarios: UserScenarios;

  beforeAll(() => {
    mockCLI = MockCLIFactory.createRealisticCLI();
    interactionTester = new InteractionTester(mockCLI);
    userScenarios = new UserScenarios(mockCLI);
  });

  afterAll(() => {
    mockCLI.clearHistory();
  });

  describe('Basic Skill Discovery', () => {
    test('should help beginners discover available skills', async () => {
      // Simulate beginner skill discovery workflow
      const result = await userScenarios.beginnerSkillDiscovery();

      expect(result.completed).toBe(true);
      expect(result.steps.length).toBeGreaterThan(0);
      expect(result.totalTime).toBeGreaterThan(0);

      // Verify help command was successful
      const helpStep = result.steps.find(step => step.action === 'help-command');
      expect(helpStep?.success).toBe(true);

      // Verify at least 3 steps were successful
      const successfulSteps = result.steps.filter(step => step.success);
      expect(successfulSteps.length).toBeGreaterThanOrEqual(3);
    });

    test('should provide relevant skill matches for user queries', async () => {
      const testQueries = [
        'implement user authentication',
        'create REST API',
        'setup database',
        'write unit tests'
      ];

      for (const query of testQueries) {
        const result = await mockCLI.executeCommand('skills check', [query]);

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('Checking intent');
        expect(result.stdout).toContain(query);

        if (result.stdout.includes('No matching skills')) {
          expect(result.stdout).toContain('⚠️');
        } else {
          expect(result.stdout).toContain('✅');
          expect(result.stdout).toContain('matching skills');
        }
      }
    });

    test('should handle skill validation workflow end-to-end', async () => {
      const result = await interactionTester.simulateSkillValidationWorkflow();

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('steps');
      expect(result).toHaveProperty('totalDuration');

      expect(Array.isArray(result.steps)).toBe(true);
      expect(result.totalTime).toBeGreaterThan(0);

      // Check that key workflow steps are present
      const stepNames = result.steps.map(step => step.step);
      expect(stepNames).toContain('skills lint');
      expect(stepNames).toContain('skills index');
      expect(stepNames).toContain('skills check');

      // Validate each step has proper structure
      result.steps.forEach(step => {
        expect(step).toHaveProperty('step');
        expect(step).toHaveProperty('result');
        expect(step).toHaveProperty('success');
        expect(step.result).toHaveProperty('stdout');
        expect(step.result).toHaveProperty('stderr');
        expect(step.result).toHaveProperty('exitCode');
        expect(step.result).toHaveProperty('duration');
      });
    });
  });

  describe('Error Handling in Skill Discovery', () => {
    test('should handle invalid skill directories gracefully', async () => {
      const result = await interactionTester.simulateSkillValidationWorkflow('/nonexistent/directory');

      expect(result.success).toBe(false);
      expect(result.steps.length).toBeGreaterThan(0);

      // Find the failing step
      const failingStep = result.steps.find(step => !step.success);
      expect(failingStep).toBeDefined();
      expect(failingStep?.result.exitCode).toBeGreaterThan(0);
      expect(failingStep?.result.stderr).toContain('not found');
    });

    test('should recover from skill validation errors', async () => {
      const recoveryResult = await interactionTester.simulateErrorRecovery('invalid_directory');

      expect(recoveryResult).toHaveProperty('recovered');
      expect(recoveryResult).toHaveProperty('attempts');
      expect(recoveryResult).toHaveProperty('finalResult');

      expect(recoveryResult.attempts).toBeGreaterThan(1);
      expect(recoveryResult.finalResult.exitCode).toBe(0);
    });

    test('should provide helpful error messages for skill queries', async () => {
      const invalidQueries = [
        '',
        'very specific nonexistent query that should match nothing',
        'invalid characters: !@#$%^&*()'
      ];

      for (const query of invalidQueries) {
        const result = await mockCLI.executeCommand('skills check', [query]);

        expect(result.exitCode).toBe(0); // Should not crash
        expect(result.stdout).toContain('Checking intent');

        if (query.trim() === '') {
          // Empty query should still be handled gracefully
          expect(result.stdout.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('Performance in Skill Discovery', () => {
    test('should complete skill discovery within reasonable time', async () => {
      const startTime = Date.now();

      const result = await interactionTester.simulateSkillValidationWorkflow();
      const totalTime = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(totalTime).toBeLessThan(2000); // Should complete within 2 seconds
      expect(result.totalTime).toBeLessThan(2000);
    });

    test('should handle multiple concurrent skill checks', async () => {
      const queries = [
        'authentication system',
        'database design',
        'API development',
        'testing strategy',
        'deployment process'
      ];

      const startTime = Date.now();
      const results = await Promise.all(
        queries.map(query => mockCLI.executeCommand('skills check', [query]))
      );
      const totalTime = Date.now() - startTime;

      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('Checking intent');
      });

      // Should handle concurrent requests efficiently
      expect(totalTime).toBeLessThan(1000);
    });

    test('should maintain performance with large skill sets', async () => {
      // Generate mock results for large skill set
      const largeSkillSetResult = MockScenarios.generateSkillValidationResults(100, 5);
      mockCLI.addMockResponse('skills lint ./large-skills', largeSkillSetResult);

      const result = await mockCLI.executeCommand('skills lint', ['./large-skills']);

      expect(result.exitCode).toBeGreaterThan(0); // Should have some validation errors
      expect(result.stdout).toContain('95/100'); // 95 valid skills out of 100
      expect(result.duration).toBeLessThan(1000); // Should process quickly
    });
  });

  describe('User Experience Patterns', () => {
    test('should support progressive skill discovery', async () => {
      const result = await userScenarios.progressiveDiscovery();

      expect(result).toHaveProperty('completed');
      expect(result).toHaveProperty('featuresDiscovered');
      expect(result).toHaveProperty('interactions');
      expect(result).toHaveProperty('totalTime');

      expect(Array.isArray(result.featuresDiscovered)).toBe(true);
      expect(result.interactions).toBeGreaterThan(0);
      expect(result.totalTime).toBeGreaterThan(0);

      // Should discover multiple features
      expect(result.featuresDiscovered.length).toBeGreaterThanOrEqual(3);
    });

    test('should adapt to different user experience levels', async () => {
      // Test beginner user experience
      const beginnerResult = await userScenarios.beginnerSkillDiscovery();
      expect(beginnerResult.completed).toBe(true);
      expect(beginnerResult.steps.some(step => step.action === 'help-command')).toBe(true);

      // Test intermediate user experience
      const intermediateResult = await userScenarios.intermediatePlanCreation('web-app');
      expect(intermediateResult.completed).toBe(true);
      expect(intermediateResult.planId).toBeDefined();

      // Test expert user experience
      const expertResult = await userScenarios.expertBulkOperations('system-health');
      expect(expertResult.processed).toBeGreaterThan(0);
      expect(expertResult.errors / expertResult.processed).toBeLessThan(0.1);
    });

    test('should provide consistent output formatting', async () => {
      const commands = [
        'skills check "test query"',
        'skills lint ./skills',
        'skills rules',
        'kpi --days 7'
      ];

      const results = await Promise.all(
        commands.map(cmd => {
          const [command, ...args] = cmd.split(' ');
          return mockCLI.executeCommand(command, args);
        })
      );

      // All successful commands should have structured output
      results.forEach(result => {
        if (result.exitCode === 0) {
          expect(result.stdout.length).toBeGreaterThan(0);
          // Should contain some structured information
          expect(result.stdout).toMatch(/[✓✅⚠️❌📊]/); // Contains indicators
        }
      });
    });
  });

  describe('Interactive Elements', () => {
    test('should handle interactive skill selection workflows', async () => {
      const result = await interactionTester.simulateInteractiveWorkflow();

      expect(result.completed).toBe(true);
      expect(result.prompts).toHaveLength(3);

      // Verify all prompt types were handled
      const promptTypes = result.prompts.map(p => p.type);
      expect(promptTypes).toContain('skill-selection');
      expect(promptTypes).toContain('confirmation');
      expect(promptTypes).toContain('input');

      // All prompts should succeed
      result.prompts.forEach(prompt => {
        expect(prompt.success).toBe(true);
      });
    });

    test('should provide context-aware help during skill discovery', async () => {
      // Test help during skill checking
      const skillCheckHelp = await mockCLI.executeCommand('skills check', ['--help']);
      expect(skillCheckHelp.exitCode).toBe(0);
      expect(skillCheckHelp.stdout).toContain('usage');

      // Test help during skill linting
      const lintHelp = await mockCLI.executeCommand('skills lint', ['--help']);
      expect(lintHelp.exitCode).toBe(0);
      expect(lintHelp.stdout).toContain('options');
    });

    test('should handle user input validation gracefully', async () => {
      // Test various invalid inputs
      const invalidInputs = [
        { command: 'skills check', args: [''] }, // Empty query
        { command: 'skills lint', args: [''] }, // Empty path
        { command: 'kpi', args: ['--days', 'invalid'] }, // Invalid number
        { command: 'skills', args: ['invalid-subcommand'] } // Invalid subcommand
      ];

      for (const input of invalidInputs) {
        const result = await mockCLI.executeCommand(input.command, input.args);

        // Should not crash
        expect(result).toBeDefined();
        expect(typeof result.exitCode).toBe('number');

        // Should provide some feedback
        expect(result.stdout.length + result.stderr.length).toBeGreaterThan(0);
      }
    });
  });
});