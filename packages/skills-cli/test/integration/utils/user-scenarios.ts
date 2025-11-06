/**
 * Common User Scenarios for CLI Testing
 * Realistic user workflows and interaction patterns
 */

import { InteractionTester } from './interaction-helpers.js';
import { MockCLI } from './cli-mocks.js';

/**
 * Define common user personas and their typical CLI usage patterns
 */
export interface UserPersona {
  name: string;
  experience: 'beginner' | 'intermediate' | 'expert';
  goals: string[];
  commonWorkflows: string[];
  errorPatterns: string[];
}

export const UserPersonas: Record<string, UserPersona> = {
  beginner: {
    name: 'New Developer',
    experience: 'beginner',
    goals: [
      'Learn basic CLI commands',
      'Understand skill system',
      'Get help when needed',
      'Avoid breaking things'
    ],
    commonWorkflows: [
      'basic-skill-discovery',
      'simple-plan-creation',
      'help-lookup',
      'safe-kpi-viewing'
    ],
    errorPatterns: [
      'wrong-command-syntax',
      'missing-required-arguments',
      'invalid-file-paths',
      'permission-issues'
    ]
  },

  intermediate: {
    name: 'Regular Developer',
    experience: 'intermediate',
    goals: [
      'Efficient skill management',
      'Complex plan creation',
      'KPI monitoring',
      'Workflow optimization'
    ],
    commonWorkflows: [
      'advanced-skill-workflows',
      'multi-step-planning',
      'kpi-analysis',
      'error-recovery'
    ],
    errorPatterns: [
      'complex-validation-failures',
      'workflow-interruptions',
      'merge-conflicts',
      'environment-issues'
    ]
  },

  expert: {
    name: 'Senior Developer/DevOps',
    experience: 'expert',
    goals: [
      'Advanced CLI automation',
      'Performance optimization',
      'System integration',
      'Team collaboration'
    ],
    commonWorkflows: [
      'automation-scripts',
      'bulk-operations',
      'system-monitoring',
      'advanced-troubleshooting'
    ],
    errorPatterns: [
      'system-level-failures',
      'network-issues',
      'resource-constraints',
      'integration-problems'
    ]
  }
};

/**
 * User workflow scenarios that simulate real usage patterns
 */
export class UserScenarios {
  private interactionTester: InteractionTester;

  constructor(cli: MockCLI) {
    this.interactionTester = new InteractionTester(cli);
  }

  /**
   * Scenario: Beginner developer discovering skills for the first time
   */
  async beginnerSkillDiscovery(): Promise<{
    completed: boolean;
    steps: Array<{ action: string; result: any; success: boolean }>;
    totalTime: number;
  }> {
    const startTime = Date.now();
    const steps = [];

    try {
      // Step 1: Try to get help
      const helpResult = await this.interactionTester['cli'].executeCommand('--help');
      steps.push({ action: 'help-command', result: helpResult, success: helpResult.exitCode === 0 });

      // Step 2: List available skills (beginner might try this)
      const skillsResult = await this.interactionTester['cli'].executeCommand('skills', ['--help']);
      steps.push({ action: 'skills-help', result: skillsResult, success: skillsResult.exitCode === 0 });

      // Step 3: Try basic skill checking
      const checkResult = await this.interactionTester['cli'].executeCommand('skills check', ['hello world']);
      steps.push({ action: 'basic-check', result: checkResult, success: checkResult.exitCode === 0 });

      // Step 4: Try to lint current directory (safe operation)
      const lintResult = await this.interactionTester['cli'].executeCommand('skills lint', ['./', '--dry-run']);
      steps.push({ action: 'safe-lint', result: lintResult, success: lintResult.exitCode === 0 });

      const completed = steps.filter(step => step.success).length >= 3;
      return { completed, steps, totalTime: Date.now() - startTime };

    } catch (error) {
      return { completed: false, steps, totalTime: Date.now() - startTime };
    }
  }

  /**
   * Scenario: Regular developer creating a comprehensive plan
   */
  async intermediatePlanCreation(projectType: 'web-app' | 'api' | 'library'): Promise<{
    completed: boolean;
    planId?: string;
    steps: Array<{ action: string; result: any; success: boolean }>;
    totalTime: number;
  }> {
    const startTime = Date.now();
    const steps = [];

    const planTitles = {
      'web-app': 'Build React web application with authentication',
      'api': 'Create REST API with database integration',
      'library': 'Develop reusable component library'
    };

    try {
      // Step 1: Check relevant skills for the project type
      const skillCheck = await this.interactionTester['cli'].executeCommand(
        'skills check',
        [planTitles[projectType], '--threshold', '0.6']
      );
      steps.push({ action: 'skill-research', result: skillCheck, success: skillCheck.exitCode === 0 });

      // Step 2: Create initial plan
      const planResult = await this.interactionTester.simulatePlanWorkflow(planTitles[projectType]);
      steps.push({ action: 'plan-creation', result: planResult, success: planResult.success });

      if (!planResult.success) {
        return { completed: false, steps, totalTime: Date.now() - startTime };
      }

      // Step 3: List plans to verify
      const listResult = await this.interactionTester['cli'].executeCommand('plan list');
      steps.push({ action: 'plan-verification', result: listResult, success: listResult.exitCode === 0 });

      // Step 4: Generate KPI baseline
      const kpiResult = await this.interactionTester['cli'].executeCommand('kpi', ['--days', '1']);
      steps.push({ action: 'kpi-baseline', result: kpiResult, success: kpiResult.exitCode === 0 });

      const completed = steps.filter(step => step.success).length >= 3;
      return {
        completed,
        planId: planResult.planId,
        steps,
        totalTime: Date.now() - startTime
      };

    } catch (error) {
      return { completed: false, steps, totalTime: Date.now() - startTime };
    }
  }

  /**
   * Scenario: Expert developer performing bulk operations
   */
  async expertBulkOperations(operation: 'skills-packaging' | 'kpi-analysis' | 'system-health'): Promise<{
    completed: boolean;
    processed: number;
    errors: number;
    steps: Array<{ action: string; result: any; success: boolean }>;
    totalTime: number;
  }> {
    const startTime = Date.now();
    const steps = [];
    let processed = 0;
    let errors = 0;

    try {
      switch (operation) {
        case 'skills-packaging':
          // Package multiple skills in batch
          const skills = ['auth-flow', 'database-setup', 'api-design', 'testing-suite', 'deployment-guide'];

          for (const skill of skills) {
            const packResult = await this.interactionTester['cli'].executeCommand('skills pack', [`./skills/${skill}`]);
            processed++;
            if (packResult.exitCode !== 0) errors++;
            steps.push({ action: `pack-${skill}`, result: packResult, success: packResult.exitCode === 0 });
          }
          break;

        case 'kpi-analysis':
          // Generate KPI reports for different time periods
          const periods = [1, 7, 30, 90];

          for (const days of periods) {
            const kpiResult = await this.interactionTester['cli'].executeCommand('kpi', [
              '--days', days.toString(),
              '--output', `/tmp/kpi-${days}days.json`,
              '--format', 'json'
            ]);
            processed++;
            if (kpiResult.exitCode !== 0) errors++;
            steps.push({ action: `kpi-${days}days`, result: kpiResult, success: kpiResult.exitCode === 0 });
          }
          break;

        case 'system-health':
          // Run comprehensive health checks
          const healthChecks = [
            { cmd: 'skills lint', args: ['./skills', '--strict'] },
            { cmd: 'skills index', args: ['./skills', '--out', './health-index.json'] },
            { cmd: 'plan list', args: [] },
            { cmd: 'kpi', args: ['--days', '1'] }
          ];

          for (const check of healthChecks) {
            const healthResult = await this.interactionTester['cli'].executeCommand(check.cmd, check.args);
            processed++;
            if (healthResult.exitCode !== 0) errors++;
            steps.push({ action: `health-${check.cmd}`, result: healthResult, success: healthResult.exitCode === 0 });
          }
          break;
      }

      const completed = (errors / processed) < 0.1; // Less than 10% error rate
      return { completed, processed, errors, steps, totalTime: Date.now() - startTime };

    } catch (error) {
      return { completed: false, processed, errors, steps, totalTime: Date.now() - startTime };
    }
  }

  /**
   * Scenario: Error recovery for common user mistakes
   */
  async errorRecoveryScenario(errorType: 'syntax' | 'permission' | 'network' | 'validation'): Promise<{
    recovered: boolean;
    attempts: number;
    resolutionTime: number;
    steps: Array<{ action: string; result: any; success: boolean }>;
  }> {
    const startTime = Date.now();
    const steps = [];

    try {
      switch (errorType) {
        case 'syntax':
          // User types wrong command syntax
          const wrongSyntax = await this.interactionTester['cli'].executeCommand('skills lint', ['--invalid-flag']);
          steps.push({ action: 'wrong-syntax', result: wrongSyntax, success: wrongSyntax.exitCode !== 0 });

          if (wrongSyntax.exitCode !== 0) {
            // Try correct syntax
            const correctSyntax = await this.interactionTester['cli'].executeCommand('skills lint', ['./skills', '--strict']);
            steps.push({ action: 'correct-syntax', result: correctSyntax, success: correctSyntax.exitCode === 0 });
            return { recovered: correctSyntax.exitCode === 0, attempts: 2, resolutionTime: Date.now() - startTime, steps };
          }
          break;

        case 'permission':
          // User tries to access protected files
          const permissionError = await this.interactionTester['cli'].executeCommand('skills lint', ['/root/protected']);
          steps.push({ action: 'permission-error', result: permissionError, success: permissionError.exitCode !== 0 });

          if (permissionError.exitCode !== 0) {
            // Try with different directory
            const alternativeDir = await this.interactionTester['cli'].executeCommand('skills lint', ['./skills']);
            steps.push({ action: 'alternative-dir', result: alternativeDir, success: alternativeDir.exitCode === 0 });
            return { recovered: alternativeDir.exitCode === 0, attempts: 2, resolutionTime: Date.now() - startTime, steps };
          }
          break;

        case 'network':
          // Simulate network connectivity issues
          const networkError = await this.interactionTester['cli'].executeCommand('skills check', ['implement oauth'], ['--online']);
          steps.push({ action: 'network-error', result: networkError, success: networkError.exitCode !== 0 });

          if (networkError.exitCode !== 0) {
            // Try offline mode
            const offlineMode = await this.interactionTester['cli'].executeCommand('skills check', ['implement oauth'], ['--offline']);
            steps.push({ action: 'offline-mode', result: offlineMode, success: offlineMode.exitCode === 0 });
            return { recovered: offlineMode.exitCode === 0, attempts: 2, resolutionTime: Date.now() - startTime, steps };
          }
          break;

        case 'validation':
          // User has invalid skills that fail validation
          const validationError = await this.interactionTester.simulateSkillValidationWorkflow('./invalid-skills');
          steps.push({ action: 'validation-error', result: validationError, success: !validationError.success });

          if (!validationError.success) {
            // Try to fix and re-validate
            const fixAttempt = await this.interactionTester.simulateSkillValidationWorkflow('./skills');
            steps.push({ action: 'validation-fix', result: fixAttempt, success: fixAttempt.success });
            return { recovered: fixAttempt.success, attempts: 2, resolutionTime: Date.now() - startTime, steps };
          }
          break;
      }

      return { recovered: false, attempts: 1, resolutionTime: Date.now() - startTime, steps };

    } catch (error) {
      return { recovered: false, attempts: 0, resolutionTime: Date.now() - startTime, steps };
    }
  }

  /**
   * Scenario: Progressive discovery workflow
   * Simulates how users gradually discover and learn CLI features
   */
  async progressiveDiscovery(): Promise<{
    completed: boolean;
    featuresDiscovered: string[];
    interactions: number;
    totalTime: number;
  }> {
    const startTime = Date.now();
    const featuresDiscovered: string[] = [];
    let interactions = 0;

    const discoverySteps = [
      { action: 'basic-help', expected: 'Help system discovery' },
      { action: 'skills-list', expected: 'Skills system discovery' },
      { action: 'skills-check', expected: 'Skill matching discovery' },
      { action: 'plan-create', expected: 'Planning system discovery' },
      { action: 'kpi-view', expected: 'KPI system discovery' },
      { action: 'interactive-prompts', expected: 'Interactive features discovery' }
    ];

    try {
      for (const step of discoverySteps) {
        interactions++;

        switch (step.action) {
          case 'basic-help':
            const helpResult = await this.interactionTester['cli'].executeCommand('--help');
            if (helpResult.exitCode === 0) featuresDiscovered.push(step.expected);
            break;

          case 'skills-list':
            const skillsResult = await this.interactionTester['cli'].executeCommand('skills rules');
            if (skillsResult.exitCode === 0) featuresDiscovered.push(step.expected);
            break;

          case 'skills-check':
            const checkResult = await this.interactionTester['cli'].executeCommand('skills check', ['test']);
            if (checkResult.exitCode === 0) featuresDiscovered.push(step.expected);
            break;

          case 'plan-create':
            const planResult = await this.interactionTester.simulatePlanWorkflow('Test Discovery Plan');
            if (planResult.success) featuresDiscovered.push(step.expected);
            break;

          case 'kpi-view':
            const kpiResult = await this.interactionTester['cli'].executeCommand('kpi', ['--days', '1']);
            if (kpiResult.exitCode === 0) featuresDiscovered.push(step.expected);
            break;

          case 'interactive-prompts':
            const interactiveResult = await this.interactionTester.simulateInteractiveWorkflow();
            if (interactiveResult.completed) featuresDiscovered.push(step.expected);
            break;
        }
      }

      const completed = featuresDiscovered.length >= 4; // Discover at least 4 features
      return {
        completed,
        featuresDiscovered,
        interactions,
        totalTime: Date.now() - startTime
      };

    } catch (error) {
      return {
        completed: false,
        featuresDiscovered,
        interactions,
        totalTime: Date.now() - startTime
      };
    }
  }
}