/**
 * CLI Interaction Testing Helpers
 * Utilities for testing CLI user interactions and workflows
 */

import { MockCLI, MockCLIResponse, MockProgressIndicator } from './cli-mocks.js';

/**
 * Helper class for testing CLI workflows and user interactions
 */
export class InteractionTester {
  private cli: MockCLI;
  private sessionHistory: Array<{
    action: string;
    details: any;
    timestamp: number;
  }> = [];

  constructor(cli: MockCLI) {
    this.cli = cli;
  }

  /**
   * Simulate a typical skill validation workflow
   */
  async simulateSkillValidationWorkflow(skillDir: string = './skills'): Promise<{
    success: boolean;
    steps: Array<{ step: string; result: MockCLIResponse; success: boolean }>;
    totalDuration: number;
  }> {
    const startTime = Date.now();
    const steps = [];

    this.recordAction('workflow:start', { type: 'skill-validation', skillDir });

    try {
      // Step 1: Lint skills
      const lintResult = await this.cli.executeCommand('skills lint', [skillDir, '--strict']);
      steps.push({ step: 'skills lint', result: lintResult, success: lintResult.exitCode === 0 });

      if (lintResult.exitCode !== 0) {
        this.recordAction('workflow:fail', { step: 'skills lint', error: lintResult.stderr });
        return { success: false, steps, totalDuration: Date.now() - startTime };
      }

      // Step 2: Check skills indexing
      const indexResult = await this.cli.executeCommand('skills index', [skillDir, '--out', './registry/index.json']);
      steps.push({ step: 'skills index', result: indexResult, success: indexResult.exitCode === 0 });

      // Step 3: Test skill checking
      const checkResult = await this.cli.executeCommand('skills check', ['implement user authentication', '--threshold', '0.6']);
      steps.push({ step: 'skills check', result: checkResult, success: checkResult.exitCode === 0 });

      const success = steps.every(step => step.success);
      this.recordAction('workflow:complete', { type: 'skill-validation', success, steps: steps.length });

      return {
        success,
        steps,
        totalDuration: Date.now() - startTime
      };

    } catch (error) {
      this.recordAction('workflow:error', { type: 'skill-validation', error });
      return {
        success: false,
        steps,
        totalDuration: Date.now() - startTime
      };
    }
  }

  /**
   * Simulate a plan creation and management workflow
   */
  async simulatePlanWorkflow(planTitle: string): Promise<{
    success: boolean;
    planId?: string;
    steps: Array<{ step: string; result: MockCLIResponse; success: boolean }>;
    totalDuration: number;
  }> {
    const startTime = Date.now();
    const steps = [];

    this.recordAction('workflow:start', { type: 'plan-management', planTitle });

    try {
      // Step 1: Create plan
      const createResult = await this.cli.executeCommand('plan create', [planTitle, '--methodology', 'cloop']);
      steps.push({ step: 'plan create', result: createResult, success: createResult.exitCode === 0 });

      if (createResult.exitCode !== 0) {
        this.recordAction('workflow:fail', { step: 'plan create', error: createResult.stderr });
        return { success: false, steps, totalDuration: Date.now() - startTime };
      }

      // Extract plan ID from result (mock implementation)
      const planId = `plan-${Date.now()}`;

      // Step 2: List plans to verify creation
      const listResult = await this.cli.executeCommand('plan list');
      steps.push({ step: 'plan list', result: listResult, success: listResult.exitCode === 0 });

      // Step 3: Validate plan structure
      const validateResult = await this.cli.executeCommand('plan validate', ['--file', `/tmp/${planId}.json`]);
      steps.push({ step: 'plan validate', result: validateResult, success: validateResult.exitCode === 0 });

      const success = steps.every(step => step.success);
      this.recordAction('workflow:complete', { type: 'plan-management', success, planId });

      return {
        success,
        planId: success ? planId : undefined,
        steps,
        totalDuration: Date.now() - startTime
      };

    } catch (error) {
      this.recordAction('workflow:error', { type: 'plan-management', error });
      return {
        success: false,
        steps,
        totalDuration: Date.now() - startTime
      };
    }
  }

  /**
   * Simulate a KPI generation and viewing workflow
   */
  async simulateKPIWorkflow(days: number = 7): Promise<{
    success: boolean;
    steps: Array<{ step: string; result: MockCLIResponse; success: boolean }>;
    totalDuration: number;
  }> {
    const startTime = Date.now();
    const steps = [];

    this.recordAction('workflow:start', { type: 'kpi-operations', days });

    try {
      // Step 1: Generate KPI report
      const kpiResult = await this.cli.executeCommand('kpi', ['--days', days.toString()]);
      steps.push({ step: 'kpi generation', result: kpiResult, success: kpiResult.exitCode === 0 });

      if (kpiResult.exitCode !== 0) {
        this.recordAction('workflow:fail', { step: 'kpi generation', error: kpiResult.stderr });
        return { success: false, steps, totalDuration: Date.now() - startTime };
      }

      // Step 2: Generate dashboard (output file)
      const dashboardResult = await this.cli.executeCommand('kpi', [
        '--days', days.toString(),
        '--output', `/tmp/kpi-dashboard-${Date.now()}.md`
      ]);
      steps.push({ step: 'dashboard generation', result: dashboardResult, success: dashboardResult.exitCode === 0 });

      const success = steps.every(step => step.success);
      this.recordAction('workflow:complete', { type: 'kpi-operations', success, days });

      return {
        success,
        steps,
        totalDuration: Date.now() - startTime
      };

    } catch (error) {
      this.recordAction('workflow:error', { type: 'kpi-operations', error });
      return {
        success: false,
        steps,
        totalDuration: Date.now() - startTime
      };
    }
  }

  /**
   * Simulate error recovery scenarios
   */
  async simulateErrorRecovery(errorScenario: 'invalid_directory' | 'invalid_command' | 'permission_denied'): Promise<{
    recovered: boolean;
    attempts: number;
    finalResult: MockCLIResponse;
  }> {
    let attempts = 0;
    let finalResult: MockCLIResponse;
    let recovered = false;

    this.recordAction('error-recovery:start', { scenario: errorScenario });

    switch (errorScenario) {
      case 'invalid_directory':
        // Try to lint non-existent directory, then fall back to current directory
        attempts = 2;

        // First attempt - should fail
        finalResult = await this.cli.executeCommand('skills lint', ['/nonexistent']);

        if (finalResult.exitCode !== 0) {
          // Second attempt - should succeed
          finalResult = await this.cli.executeCommand('skills lint', ['./skills']);
          recovered = finalResult.exitCode === 0;
        }
        break;

      case 'invalid_command':
        // Try invalid command, then use help
        attempts = 2;

        finalResult = await this.cli.executeCommand('invalid_command');

        if (finalResult.exitCode !== 0) {
          // Follow up with help command
          finalResult = await this.cli.executeCommand('--help');
          recovered = finalResult.exitCode === 0;
        }
        break;

      case 'permission_denied':
        // Simulate permission error and recovery
        attempts = 3;

        finalResult = await this.cli.executeCommand('skills lint', ['/root/protected']);

        if (finalResult.exitCode !== 0) {
          // Try with different permissions
          finalResult = await this.cli.executeCommand('skills lint', ['./skills', '--no-strict']);
          recovered = finalResult.exitCode === 0;
        }
        break;

      default:
        finalResult = { stdout: '', stderr: 'Unknown error scenario', exitCode: 1, duration: 0 };
        break;
    }

    this.recordAction('error-recovery:complete', { scenario: errorScenario, recovered, attempts });

    return { recovered, attempts, finalResult };
  }

  /**
   * Test interactive prompt scenarios
   */
  async simulateInteractiveWorkflow(): Promise<{
    completed: boolean;
    prompts: Array<{ type: string; response: any; success: boolean }>;
  }> {
    const prompts = [];

    this.recordAction('interactive:start', {});

    try {
      // Simulate skill selection prompt
      const skillPrompt = await this.cli.createMockPrompt({
        question: 'Select a skill to execute:',
        type: 'select',
        options: ['authentication-flow', 'database-setup', 'api-design'],
        result: 'authentication-flow'
      });
      prompts.push({ type: 'skill-selection', response: skillPrompt, success: true });

      // Simulate confirmation prompt
      const confirmPrompt = await this.cli.createMockPrompt({
        question: 'Execute selected skill?',
        type: 'confirm',
        result: true
      });
      prompts.push({ type: 'confirmation', response: confirmPrompt, success: true });

      // Simulate input prompt
      const inputPrompt = await this.cli.createMockPrompt({
        question: 'Enter project name:',
        type: 'input',
        result: 'my-awesome-project'
      });
      prompts.push({ type: 'input', response: inputPrompt, success: true });

      const completed = prompts.every(prompt => prompt.success);
      this.recordAction('interactive:complete', { completed, prompts: prompts.length });

      return { completed, prompts };

    } catch (error) {
      this.recordAction('interactive:error', { error });
      return { completed: false, prompts };
    }
  }

  /**
   * Get session history for analysis
   */
  getSessionHistory(): Array<{
    action: string;
    details: any;
    timestamp: number;
  }> {
    return [...this.sessionHistory];
  }

  /**
   * Clear session history
   */
  clearSessionHistory(): void {
    this.sessionHistory = [];
  }

  /**
   * Record an action in the session history
   */
  private recordAction(action: string, details: any): void {
    this.sessionHistory.push({
      action,
      details,
      timestamp: Date.now()
    });
  }
}

/**
 * Performance testing helper for CLI interactions
 */
export class PerformanceTester {
  private cli: MockCLI;

  constructor(cli: MockCLI) {
    this.cli = cli;
  }

  /**
   * Test CLI response performance
   */
  async testResponsePerformance(command: string, args: string[] = [], iterations: number = 10): Promise<{
    averageTime: number;
    minTime: number;
    maxTime: number;
    successRate: number;
    results: Array<{ time: number; success: boolean; exitCode: number }>;
  }> {
    const results = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      const result = await this.cli.executeCommand(command, args);
      const duration = Date.now() - startTime;

      results.push({
        time: duration,
        success: result.exitCode === 0,
        exitCode: result.exitCode
      });
    }

    const times = results.map(r => r.time);
    const successes = results.filter(r => r.success);

    return {
      averageTime: times.reduce((a, b) => a + b, 0) / times.length,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      successRate: (successes.length / results.length) * 100,
      results
    };
  }

  /**
   * Test workflow performance
   */
  async testWorkflowPerformance(workflowFn: () => Promise<any>, iterations: number = 5): Promise<{
    averageTime: number;
    minTime: number;
    maxTime: number;
    successRate: number;
    results: Array<{ time: number; success: boolean }>;
  }> {
    const results = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();

      try {
        const result = await workflowFn();
        const duration = Date.now() - startTime;

        results.push({
          time: duration,
          success: result && (result.success !== false)
        });
      } catch (error) {
        results.push({
          time: Date.now() - startTime,
          success: false
        });
      }
    }

    const times = results.map(r => r.time);
    const successes = results.filter(r => r.success);

    return {
      averageTime: times.reduce((a, b) => a + b, 0) / times.length,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      successRate: (successes.length / results.length) * 100,
      results
    };
  }
}