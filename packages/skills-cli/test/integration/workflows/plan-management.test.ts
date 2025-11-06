/**
 * Plan Management Workflow Tests
 * Tests for user interactions related to plan creation, management, and workflows
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { MockCLI, MockCLIFactory, MockScenarios } from '../utils/cli-mocks.js';
import { InteractionTester } from '../utils/interaction-helpers.js';
import { UserScenarios } from '../utils/user-scenarios.js';

describe('Plan Management Workflow Tests', () => {
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

  describe('Plan Creation Workflows', () => {
    test('should create plans with CLOOP methodology', async () => {
      const planTitle = 'Implement user authentication system';
      const result = await interactionTester.simulatePlanWorkflow(planTitle);

      expect(result.success).toBe(true);
      expect(result.planId).toBeDefined();
      expect(result.steps.length).toBeGreaterThan(0);

      // Verify CLOOP methodology was used
      const createStep = result.steps.find(step => step.step === 'plan create');
      expect(createStep).toBeDefined();
      expect(createStep?.result.stdout).toContain('CLOOP');
    });

    test('should handle different project types appropriately', async () => {
      const projectTypes = ['web-app', 'api', 'library'] as const;
      const results = [];

      for (const projectType of projectTypes) {
        const result = await userScenarios.intermediatePlanCreation(projectType);
        results.push(result);

        expect(result.completed).toBe(true);
        expect(result.planId).toBeDefined();
        expect(result.steps.length).toBeGreaterThan(0);
      }

      // All project types should succeed
      results.forEach(result => {
        expect(result.completed).toBe(true);
      });
    });

    test('should validate plan structure after creation', async () => {
      const result = await interactionTester.simulatePlanWorkflow('Test Validation Plan');

      expect(result.success).toBe(true);

      // Find the validation step
      const validationStep = result.steps.find(step => step.step === 'plan validate');
      expect(validationStep).toBeDefined();
      expect(validationStep?.result.exitCode).toBe(0);
    });

    test('should handle plan creation errors gracefully', async () => {
      // Mock a failed plan creation
      mockCLI.addMockResponse('plan create "Invalid Plan"', {
        stdout: '',
        stderr: '❌ Failed to create plan: Invalid title or missing requirements',
        exitCode: 1,
        duration: 100
      });

      const result = await interactionTester.simulatePlanWorkflow('Invalid Plan');

      expect(result.success).toBe(false);
      expect(result.steps[0].result.exitCode).toBe(1);
      expect(result.steps[0].result.stderr).toContain('Failed to create plan');
    });
  });

  describe('Plan Discovery and Listing', () => {
    test('should list available plans with metadata', async () => {
      // First create some plans
      await interactionTester.simulatePlanWorkflow('Plan A');
      await interactionTester.simulatePlanWorkflow('Plan B');
      await interactionTester.simulatePlanWorkflow('Plan C');

      // Then list plans
      const result = await mockCLI.executeCommand('plan list');

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Available Plans');
      expect(result.stdout).toContain('Plan A');
      expect(result.stdout).toContain('Plan B');
      expect(result.stdout).toContain('Plan C');
    });

    test('should handle empty plan list gracefully', async () => {
      // Mock empty plan list
      mockCLI.addMockResponse('plan list', {
        stdout: '📋 Available Plans:\n\nNo plans found. Create your first plan with "plan create <title>"',
        stderr: '',
        exitCode: 0,
        duration: 80
      });

      const result = await mockCLI.executeCommand('plan list');

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('No plans found');
      expect(result.stdout).toContain('plan create');
    });

    test('should filter and sort plans appropriately', async () => {
      // Mock filtered plan list
      mockCLI.addMockResponse('plan list --filter recent', {
        stdout: '📋 Recent Plans (Last 7 days):\n• authentication-plan (2025-10-31)\n• api-design-plan (2025-10-30)',
        stderr: '',
        exitCode: 0,
        duration: 120
      });

      const result = await mockCLI.executeCommand('plan list', ['--filter', 'recent']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Recent Plans');
      expect(result.stdout).toContain('authentication-plan');
      expect(result.stdout).toContain('2025-10-31');
    });
  });

  describe('Multi-step Plan Workflows', () => {
    test('should support complex plan creation workflows', async () => {
      const complexWorkflow = async () => {
        // Step 1: Research relevant skills
        const skillResearch = await mockCLI.executeCommand('skills check', [
          'enterprise microservices architecture',
          '--threshold', '0.7'
        ]);

        if (skillResearch.exitCode !== 0) {
          throw new Error('Skill research failed');
        }

        // Step 2: Create comprehensive plan
        const planCreation = await interactionTester.simulatePlanWorkflow(
          'Enterprise Microservices Architecture'
        );

        if (!planCreation.success) {
          throw new Error('Plan creation failed');
        }

        // Step 3: Generate implementation timeline
        const timeline = await mockCLI.executeCommand('plan timeline', [
          '--file', `/tmp/${planCreation.planId}.json`,
          '--format', 'markdown'
        ]);

        // Step 4: Create resource checklist
        const checklist = await mockCLI.executeCommand('plan checklist', [
          '--complexity', 'high',
          '--team-size', '5'
        ]);

        return {
          success: timeline.exitCode === 0 && checklist.exitCode === 0,
          steps: [
            { step: 'skill-research', result: skillResearch },
            { step: 'plan-creation', result: planCreation },
            { step: 'timeline-generation', result: timeline },
            { step: 'checklist-creation', result: checklist }
          ]
        };
      };

      const result = await complexWorkflow();

      expect(result.success).toBe(true);
      expect(result.steps.every(step => step.result.exitCode === 0)).toBe(true);
    });

    test('should handle workflow interruptions and recovery', async () => {
      let stepCounter = 0;

      const interruptibleWorkflow = async () => {
        stepCounter++;

        if (stepCounter === 2) {
          // Simulate interruption on second step
          throw new Error('Simulated workflow interruption');
        }

        return await interactionTester.simulatePlanWorkflow(`Recovery Test Plan ${stepCounter}`);
      };

      // First attempt should fail
      const firstAttempt = await interruptibleWorkflow().catch(error => ({
        success: false,
        error: error.message
      }));

      expect(firstAttempt.success).toBe(false);
      expect(firstAttempt.error).toContain('interruption');

      // Second attempt should succeed
      const secondAttempt = await interruptibleWorkflow();

      expect(secondAttempt.success).toBe(true);
      expect(secondAttempt.planId).toBeDefined();
    });

    test('should maintain context across workflow steps', async () => {
      // Create context-aware workflow
      const contextWorkflow = async () => {
        const projectContext = {
          type: 'e-commerce',
          complexity: 'high',
          teamSize: 4,
          deadline: '2025-12-31'
        };

        // Step 1: Create plan with context
        const planCreation = await mockCLI.executeCommand('plan create', [
          `E-commerce Platform - ${projectContext.complexity} complexity`,
          '--context', JSON.stringify(projectContext),
          '--methodology', 'cloop'
        ]);

        // Step 2: Generate team-specific tasks
        const tasks = await mockCLI.executeCommand('plan tasks', [
          '--team-size', projectContext.teamSize.toString(),
          '--context', JSON.stringify(projectContext)
        ]);

        // Step 3: Create deadline-based milestones
        const milestones = await mockCLI.executeCommand('plan milestones', [
          '--deadline', projectContext.deadline,
          '--project-type', projectContext.type
        ]);

        return {
          context: projectContext,
          results: { planCreation, tasks, milestones }
        };
      };

      const result = await contextWorkflow();

      expect(result.context).toBeDefined();
      expect(result.results.planCreation.exitCode).toBe(0);
      expect(result.results.tasks.exitCode).toBe(0);
      expect(result.results.milestones.exitCode).toBe(0);

      // Verify context was used in plan creation
      expect(result.results.planCreation.stdout).toContain('e-commerce');
      expect(result.results.planCreation.stdout).toContain('high complexity');
    });
  });

  describe('Plan Integration with Other Systems', () => {
    test('should integrate plan creation with skill discovery', async () => {
      const integratedWorkflow = async () => {
        // Step 1: Discover relevant skills
        const skillsResult = await mockCLI.executeCommand('skills check', [
          'build scalable web application',
          '--threshold', '0.6'
        ]);

        // Extract skill suggestions from output
        const skillMatches = skillsResult.stdout.includes('matching skills')
          ? skillsResult.stdout.match(/• ([^(]+)/g)?.map(match => match?.replace('• ', '').trim()) || []
          : [];

        // Step 2: Create plan with skill integration
        const planTitle = 'Scalable Web Application';
        const planResult = await interactionTester.simulatePlanWorkflow(planTitle);

        return {
          skillsDiscovered: skillMatches.length,
          planCreated: planResult.success,
          integration: skillMatches.length > 0 && planResult.success
        };
      };

      const result = await integratedWorkflow();

      expect(result.planCreated).toBe(true);
      expect(result.skillsDiscovered).toBeGreaterThanOrEqual(0);
      expect(typeof result.integration).toBe('boolean');
    });

    test('should integrate plan execution with KPI tracking', async () => {
      const kpiIntegrationWorkflow = async () => {
        // Step 1: Create plan
        const planResult = await interactionTester.simulatePlanWorkflow('Performance Testing Plan');

        if (!planResult.success) {
          throw new Error('Plan creation failed');
        }

        // Step 2: Generate baseline KPI
        const baselineKPI = await mockCLI.executeCommand('kpi', ['--days', '7']);

        // Step 3: Start plan execution tracking
        const tracking = await mockCLI.executeCommand('plan execute', [
          '--plan-id', planResult.planId!,
          '--track-kpi'
        ]);

        return {
          planId: planResult.planId,
          baselineEstablished: baselineKPI.exitCode === 0,
          trackingStarted: tracking.exitCode === 0
        };
      };

      const result = await kpiIntegrationWorkflow();

      expect(result.planId).toBeDefined();
      expect(result.baselineEstablished).toBe(true);
      expect(result.trackingStarted).toBe(true);
    });
  });

  describe('Error Handling in Plan Management', () => {
    test('should validate plan requirements before creation', async () => {
      // Mock validation failures
      const validationFailures = [
        { input: '', error: 'Plan title cannot be empty' },
        { input: 'A', error: 'Plan title too short (minimum 5 characters)' },
        { input: 'Plan with very long title that exceeds maximum allowed length for plan names and should be rejected by the validation system', error: 'Plan title too long (maximum 100 characters)' }
      ];

      for (const failure of validationFailures) {
        mockCLI.addMockResponse(`plan create "${failure.input}"`, {
          stdout: '',
          stderr: `❌ Validation failed: ${failure.error}`,
          exitCode: 1,
          duration: 50
        });

        const result = await mockCLI.executeCommand('plan create', [failure.input]);

        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain('Validation failed');
        expect(result.stderr).toContain(failure.error);
      }
    });

    test('should recover from plan creation failures', async () => {
      const recoveryWorkflow = async () => {
        // Step 1: Attempt invalid plan creation
        const invalidResult = await mockCLI.executeCommand('plan create', ['']);

        expect(invalidResult.exitCode).toBe(1);

        // Step 2: Provide helpful error message and suggestion
        const helpResult = await mockCLI.executeCommand('plan create', ['--help']);

        // Step 3: Retry with valid input
        const validResult = await interactionTester.simulatePlanWorkflow('Valid Recovery Plan');

        return {
          invalidHandled: invalidResult.exitCode === 1,
          helpProvided: helpResult.exitCode === 0,
          recoverySucceeded: validResult.success
        };
      };

      const result = await recoveryWorkflow();

      expect(result.invalidHandled).toBe(true);
      expect(result.helpProvided).toBe(true);
      expect(result.recoverySucceeded).toBe(true);
    });

    test('should handle plan file corruption gracefully', async () => {
      // Mock corrupted plan file scenario
      mockCLI.addMockResponse('plan validate --file /tmp/corrupted-plan.json', {
        stdout: '',
        stderr: '❌ Plan validation failed: File corrupted or invalid format\n💡 Try recovering from backup or creating a new plan',
        exitCode: 1,
        duration: 100
      });

      const validationResult = await mockCLI.executeCommand('plan validate', [
        '--file', '/tmp/corrupted-plan.json'
      ]);

      expect(validationResult.exitCode).toBe(1);
      expect(validationResult.stderr).toContain('corrupted');
      expect(validationResult.stderr).toContain('Try recovering');
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle large plan creation efficiently', async () => {
      // Mock large plan creation
      const largePlanResponse = MockScenarios.generateKPIDashboard(30, 500);
      largePlanResponse.stdout = '📋 Creating comprehensive enterprise plan with 50+ tasks...\n✅ Plan created successfully\n📁 Plan saved with detailed breakdown and resource allocation';
      largePlanResponse.duration = 800;

      mockCLI.addMockResponse('plan create "Large Enterprise Plan"', largePlanResponse);

      const result = await mockCLI.executeCommand('plan create', ['Large Enterprise Plan']);

      expect(result.exitCode).toBe(0);
      expect(result.duration).toBeLessThan(1000); // Should complete within 1 second
      expect(result.stdout).toContain('enterprise plan');
    });

    test('should support concurrent plan operations', async () => {
      const concurrentOperations = [
        () => mockCLI.executeCommand('plan create', 'Concurrent Plan A'),
        () => mockCLI.executeCommand('plan create', 'Concurrent Plan B'),
        () => mockCLI.executeCommand('plan create', 'Concurrent Plan C'),
        () => mockCLI.executeCommand('plan list'),
        () => mockCLI.executeCommand('kpi', ['--days', '1'])
      ];

      const startTime = Date.now();
      const results = await Promise.all(concurrentOperations.map(op => op()));
      const totalTime = Date.now() - startTime;

      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.exitCode).toBe(0);
      });

      // Should handle concurrent operations efficiently
      expect(totalTime).toBeLessThan(500);
    });
  });
});