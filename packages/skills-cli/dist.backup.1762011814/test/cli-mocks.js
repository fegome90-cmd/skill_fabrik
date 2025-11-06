"use strict";
/**
 * CLI Mock Infrastructure
 * Comprehensive mocking system for CLI interactions during testing
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockScenarios = exports.MockCLIFactory = exports.MockCLI = void 0;
const events_1 = require("events");
/**
 * Mock CLI implementation that simulates real CLI behavior
 */
class MockCLI extends events_1.EventEmitter {
    constructor(responseDelay = 100) {
        super();
        this.commandHistory = [];
        this.responseDelay = 100; // Simulate CLI response time
        this.mockResponses = new Map();
        this.responseDelay = responseDelay;
        this.setupDefaultResponses();
    }
    /**
     * Setup default mock responses for common CLI commands
     */
    setupDefaultResponses() {
        // Skills commands
        this.mockResponses.set('skills lint', {
            stdout: '✓ test-skill\n✓ valid-skill\n✓ another-skill\n\nValidation completed: 3/3 skills válidos',
            stderr: '',
            exitCode: 0,
            duration: 250
        });
        this.mockResponses.set('skills check "implement user auth"', {
            stdout: 'Checking intent: "implement user auth"\n✅ Found 2 matching skills:\n• authentication-flow (0.85 match)\n• security-guidelines (0.72 match)',
            stderr: '',
            exitCode: 0,
            duration: 180
        });
        this.mockResponses.set('skills check "nonexistent query"', {
            stdout: 'Checking intent: "nonexistent query"\n⚠️  No matching skills found',
            stderr: '',
            exitCode: 0,
            duration: 120
        });
        // Plan commands
        this.mockResponses.set('plan create "Test Plan"', {
            stdout: '📋 Creating plan: "Test Plan"\n✅ Plan created successfully\n📁 Saved to: /tmp/test-plan.json',
            stderr: '',
            exitCode: 0,
            duration: 320
        });
        this.mockResponses.set('plan list', {
            stdout: '📋 Available Plans:\n• test-plan (2025-10-31)\n• oauth-implementation (2025-10-30)\n• api-redesign (2025-10-29)',
            stderr: '',
            exitCode: 0,
            duration: 150
        });
        // KPI commands
        this.mockResponses.set('kpi --days 7', {
            stdout: '📊 KPI Dashboard (Last 7 days)\n\n📈 Metrics:\n• Total activations: 245\n• Success rate: 94.2%\n• Average latency: 287ms\n• Error rate: 5.8%',
            stderr: '',
            exitCode: 0,
            duration: 200
        });
        // Error scenarios
        this.mockResponses.set('skills lint /nonexistent', {
            stdout: '',
            stderr: '❌ Error: Directory /nonexistent not found',
            exitCode: 1,
            duration: 50
        });
        this.mockResponses.set('invalid command', {
            stdout: '',
            stderr: '❌ Unknown command: invalid\n💡 Use --help for available commands',
            exitCode: 1,
            duration: 80
        });
    }
    /**
     * Execute a mock CLI command
     */
    async executeCommand(command, args = []) {
        const startTime = Date.now();
        const fullCommand = `${command} ${args.join(' ')}`.trim();
        // Emit command start event
        this.emit('command:start', { command, args });
        // Simulate response delay
        await this.delay(this.responseDelay);
        // Get mock response or create default
        let response = this.mockResponses.get(fullCommand);
        if (!response) {
            response = this.mockResponses.get(command);
        }
        if (!response) {
            response = {
                stdout: '',
                stderr: `❌ Unknown command: ${command}`,
                exitCode: 1,
                duration: 80
            };
        }
        // Record command in history
        this.commandHistory.push({
            command,
            args,
            response: { ...response, duration: Date.now() - startTime },
            timestamp: Date.now()
        });
        // Emit command complete event
        this.emit('command:complete', { command, args, response });
        return response;
    }
    /**
     * Create a mock progress indicator
     */
    createMockProgress(initialMessage = 'Processing...') {
        let currentProgress = 0;
        let isActive = false;
        const progress = {
            start: (message) => {
                isActive = true;
                this.emit('progress:start', { message: message || initialMessage });
            },
            update: (progress, message) => {
                currentProgress = progress;
                if (isActive) {
                    this.emit('progress:update', { progress, message });
                }
            },
            succeed: (message) => {
                isActive = false;
                this.emit('progress:succeed', { message });
            },
            fail: (message) => {
                isActive = false;
                this.emit('progress:fail', { message });
            },
            stop: () => {
                isActive = false;
                this.emit('progress:stop');
            }
        };
        return progress;
    }
    /**
     * Create a mock interactive prompt
     */
    createMockPrompt(config) {
        return new Promise((resolve) => {
            this.emit('prompt:start', config);
            // Simulate user interaction delay
            setTimeout(() => {
                this.emit('prompt:complete', config);
                resolve(config.result);
            }, 200);
        });
    }
    /**
     * Get command execution history
     */
    getCommandHistory() {
        return [...this.commandHistory];
    }
    /**
     * Clear command history
     */
    clearHistory() {
        this.commandHistory = [];
    }
    /**
     * Add custom mock response
     */
    addMockResponse(command, response) {
        this.mockResponses.set(command, response);
    }
    /**
     * Set response delay for testing
     */
    setResponseDelay(delay) {
        this.responseDelay = delay;
    }
    /**
     * Utility delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.MockCLI = MockCLI;
/**
 * Mock CLI factory for creating configured instances
 */
class MockCLIFactory {
    static createFastCLI() {
        return new MockCLI(10); // 10ms delay for fast tests
    }
    static createRealisticCLI() {
        return new MockCLI(150); // 150ms delay for realistic tests
    }
    static createSlowCLI() {
        return new MockCLI(500); // 500ms delay for performance tests
    }
    static createCustomCLI(delay, customResponses) {
        const cli = new MockCLI(delay);
        if (customResponses) {
            Object.entries(customResponses).forEach(([command, response]) => {
                cli.addMockResponse(command, response);
            });
        }
        return cli;
    }
}
exports.MockCLIFactory = MockCLIFactory;
/**
 * Common test scenarios and data generators
 */
class MockScenarios {
    static generateSkillValidationResults(skillCount, errorCount = 0) {
        const validSkills = Math.max(0, skillCount - errorCount);
        const skillList = Array.from({ length: skillCount }, (_, i) => {
            const isValid = i >= errorCount;
            return `${isValid ? '✓' : '❌'} test-skill-${i + 1}`;
        }).join('\n');
        return {
            stdout: `${skillList}\n\nValidation completed: ${validSkills}/${skillCount} skills válidos`,
            stderr: errorCount > 0 ? `⚠️  ${errorCount} skills have validation errors` : '',
            exitCode: errorCount > 0 ? 1 : 0,
            duration: 50 + (skillCount * 10)
        };
    }
    static generateSkillCheckResults(query, matchCount) {
        if (matchCount === 0) {
            return {
                stdout: `Checking intent: "${query}"\n⚠️  No matching skills found`,
                stderr: '',
                exitCode: 0,
                duration: 120
            };
        }
        const skills = Array.from({ length: matchCount }, (_, i) => ({
            name: `matching-skill-${i + 1}`,
            match: 0.9 - (i * 0.1)
        }));
        const skillsList = skills.map(skill => `• ${skill.name} (${(skill.match * 100).toFixed(0)}% match)`).join('\n');
        return {
            stdout: `Checking intent: "${query}"\n✅ Found ${matchCount} matching skills:\n${skillsList}`,
            stderr: '',
            exitCode: 0,
            duration: 150 + (matchCount * 20)
        };
    }
    static generateKPIDashboard(days, activationCount) {
        const successRate = 85 + Math.random() * 14; // 85-99%
        const avgLatency = 150 + Math.random() * 300; // 150-450ms
        const errorRate = 100 - successRate;
        return {
            stdout: `📊 KPI Dashboard (Last ${days} days)\n\n📈 Metrics:\n• Total activations: ${activationCount}\n• Success rate: ${successRate.toFixed(1)}%\n• Average latency: ${Math.round(avgLatency)}ms\n• Error rate: ${errorRate.toFixed(1)}%`,
            stderr: '',
            exitCode: 0,
            duration: 180 + (days * 5)
        };
    }
}
exports.MockScenarios = MockScenarios;
