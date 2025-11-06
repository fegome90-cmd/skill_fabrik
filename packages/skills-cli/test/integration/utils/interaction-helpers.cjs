/**
 * Interaction Helpers for CLI Testing
 * Simplified JavaScript version for testing CLI interactions
 */

const { MockCLI } = require('./cli-mocks.cjs');

/**
 * Interaction Tester
 * Helps test CLI interactions and user workflows
 */
class InteractionTester {
  constructor(mockCLI) {
    this.cli = mockCLI;
    this.testResults = [];
    this.currentScenario = null;
  }

  /**
   * Start a new test scenario
   */
  startScenario(name, description) {
    this.currentScenario = {
      name,
      description,
      startTime: Date.now(),
      steps: [],
      errors: []
    };
    return this;
  }

  /**
   * Execute a command in the current scenario
   */
  async executeCommand(command, args = [], expectedSuccess = true) {
    if (!this.currentScenario) {
      throw new Error('No active scenario. Call startScenario() first.');
    }

    const step = {
      command,
      args,
      expectedSuccess,
      startTime: Date.now()
    };

    try {
      const response = await this.cli.executeCommand(command, args);

      step.actualSuccess = response.success;
      step.response = response;
      step.duration = Date.now() - step.startTime;
      step.passed = response.success === expectedSuccess;

      if (!step.passed) {
        const error = `Expected ${expectedSuccess ? 'success' : 'failure'}, got ${response.success ? 'success' : 'failure'}`;
        step.error = error;
        this.currentScenario.errors.push(error);
      }

      this.currentScenario.steps.push(step);
      return response;

    } catch (error) {
      step.actualSuccess = false;
      step.error = error.message;
      step.duration = Date.now() - step.startTime;
      step.passed = false;

      this.currentScenario.steps.push(step);
      this.currentScenario.errors.push(error.message);
      throw error;
    }
  }

  /**
   * End current scenario and get results
   */
  endScenario() {
    if (!this.currentScenario) {
      throw new Error('No active scenario to end.');
    }

    const scenario = {
      ...this.currentScenario,
      endTime: Date.now(),
      duration: Date.now() - this.currentScenario.startTime,
      totalSteps: this.currentScenario.steps.length,
      passedSteps: this.currentScenario.steps.filter(step => step.passed).length,
      failedSteps: this.currentScenario.errors.length,
      success: this.currentScenario.errors.length === 0
    };

    this.testResults.push(scenario);
    this.currentScenario = null;

    return scenario;
  }

  /**
   * Simulate skill validation workflow
   */
  async simulateSkillValidationWorkflow(skillsPath) {
    return this.startScenario('Skill Validation Workflow', `Validate skills in ${skillsPath}`)
      .then(() => this.executeCommand('skills', ['lint', skillsPath]))
      .then(() => this.executeCommand('skills', ['check', skillsPath]))
      .then(() => this.executeCommand('skills', ['index', skillsPath]))
      .then(() => this.endScenario());
  }

  /**
   * Simulate plan creation workflow
   */
  async simulatePlanCreationWorkflow(planDescription) {
    return this.startScenario('Plan Creation Workflow', `Create plan: ${planDescription}`)
      .then(() => this.executeCommand('plan', ['create', planDescription]))
      .then(() => this.executeCommand('plan', ['save']))
      .then(() => this.endScenario());
  }

  /**
   * Simulate KPI monitoring workflow
   */
  async simulateKPIWorkflow(days = 7) {
    return this.startScenario('KPI Monitoring Workflow', `Get KPIs for ${days} days`)
      .then(() => this.executeCommand('kpi', ['--days', days.toString()]))
      .then(() => this.executeCommand('kpi', ['--generate-dashboard']))
      .then(() => this.endScenario());
  }

  /**
   * Simulate error recovery workflow
   */
  async simulateErrorRecoveryWorkflow() {
    return this.startScenario('Error Recovery Workflow', 'Test error handling and recovery')
      .then(() => this.executeCommand('test', ['invalid-command'], false))
      .then(() => this.executeCommand('test', ['--invalid-flag'], false))
      .then(() => this.executeCommand('test', [], true)) // Should succeed
      .then(() => this.endScenario());
  }

  /**
   * Simulate user onboarding workflow
   */
  async simulateUserOnboardingWorkflow() {
    return this.startScenario('User Onboarding Workflow', 'Test new user experience')
      .then(() => this.executeCommand('help'))
      .then(() => this.executeCommand('version'))
      .then(() => this.executeCommand('skills', ['list']))
      .then(() => this.executeCommand('plan', ['list']))
      .then(() => this.endScenario());
  }

  /**
   * Get all test results
   */
  getAllResults() {
    return this.testResults;
  }

  /**
   * Get summary statistics
   */
  getSummary() {
    const total = this.testResults.length;
    const passed = this.testResults.filter(r => r.success).length;
    const failed = total - passed;
    const totalSteps = this.testResults.reduce((sum, r) => sum + r.totalSteps, 0);
    const totalDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0);

    return {
      total,
      passed,
      failed,
      passRate: total > 0 ? (passed / total) * 100 : 0,
      totalSteps,
      averageStepsPerScenario: total > 0 ? totalSteps / total : 0,
      totalDuration,
      averageDurationPerScenario: total > 0 ? totalDuration / total : 0
    };
  }

  /**
   * Clear all test results
   */
  clearResults() {
    this.testResults = [];
    this.currentScenario = null;
  }
}

/**
 * Mock Scenarios
 * Predefined test scenarios for common CLI workflows
 */
class MockScenarios {
  constructor() {
    this.scenarios = new Map();
    this.setupDefaultScenarios();
  }

  setupDefaultScenarios() {
    // Basic functionality scenarios
    this.scenarios.set('basic-commands', {
      name: 'Basic Commands',
      description: 'Test basic CLI commands',
      steps: [
        { command: 'help', args: [], expectedSuccess: true },
        { command: 'version', args: [], expectedSuccess: true },
        { command: 'test', args: [], expectedSuccess: true }
      ]
    });

    // Error handling scenarios
    this.scenarios.set('error-handling', {
      name: 'Error Handling',
      description: 'Test CLI error handling',
      steps: [
        { command: 'invalid-command', args: [], expectedSuccess: false },
        { command: 'test', args: ['--invalid-flag'], expectedSuccess: false },
        { command: 'help', args: [], expectedSuccess: true }
      ]
    });

    // Performance scenarios
    this.scenarios.set('performance-test', {
      name: 'Performance Test',
      description: 'Test CLI performance under load',
      steps: [
        { command: 'test', args: [], expectedSuccess: true },
        { command: 'test', args: ['--with-args'], expectedSuccess: true },
        { command: 'test', args: ['--multiple', 'args'], expectedSuccess: true },
        { command: 'test', args: [], expectedSuccess: true },
        { command: 'test', args: [], expectedSuccess: true }
      ]
    });
  }

  /**
   * Get scenario by name
   */
  getScenario(name) {
    return this.scenarios.get(name);
  }

  /**
   * Get all available scenarios
   */
  getAllScenarios() {
    return Array.from(this.scenarios.keys());
  }

  /**
   * Execute scenario automatically
   */
  async executeScenario(name, interactionTester) {
    const scenario = this.getScenario(name);
    if (!scenario) {
      throw new Error(`Scenario '${name}' not found`);
    }

    await interactionTester.startScenario(scenario.name, scenario.description);

    for (const step of scenario.steps) {
      await interactionTester.executeCommand(step.command, step.args, step.expectedSuccess);
    }

    return interactionTester.endScenario();
  }
}

module.exports = {
  InteractionTester,
  MockScenarios
};