/**
 * Mock CLI System for Testing
 * Simplified JavaScript version that doesn't depend on TypeScript compilation
 */

const EventEmitter = require('events');

/**
 * Mock CLI Response
 */
class MockCLIResponse {
  constructor(success = true, data = null, error = null, duration = 0) {
    this.success = success;
    this.data = data;
    this.error = error;
    this.duration = duration;
    this.timestamp = Date.now();
  }

  toJSON() {
    return {
      success: this.success,
      data: this.data,
      error: this.error,
      duration: this.duration,
      timestamp: this.timestamp
    };
  }
}

/**
 * Mock CLI Class
 * Simulates CLI behavior for testing
 */
class MockCLI extends EventEmitter {
  constructor() {
    super();
    this.commandHistory = [];
    this.mockResponses = new Map();
    this.performanceMetrics = {
      totalCommands: 0,
      averageResponseTime: 0,
      errorRate: 0
    };

    this.setupDefaultResponses();
  }

  setupDefaultResponses() {
    // Default mock responses for common commands
    this.mockResponses.set('test', new MockCLIResponse(true, { message: 'Test successful' }, null, 10));
    this.mockResponses.set('help', new MockCLIResponse(true, { help: 'Available commands...' }, null, 5));
    this.mockResponses.set('version', new MockCLIResponse(true, { version: '1.0.0' }, null, 3));
    this.mockResponses.set('error', new MockCLIResponse(false, null, 'Mock error for testing', 100));
  }

  /**
   * Execute a mock command
   */
  async executeCommand(command, args = []) {
    const startTime = Date.now();
    this.performanceMetrics.totalCommands++;

    try {
      // Simulate command processing time
      await this.simulateProcessing(command, args);

      const response = this.getMockResponse(command, args);
      const duration = Date.now() - startTime;

      // Update metrics
      this.updateMetrics(duration, !response.success);

      // Record in history
      this.recordCommand(command, args, response);

      // Emit events
      this.emit('command:executed', { command, args, response, duration });

      return response;

    } catch (error) {
      const errorResponse = new MockCLIResponse(false, null, error.message, Date.now() - startTime);
      this.recordCommand(command, args, errorResponse);
      this.emit('command:error', { command, args, error: errorResponse });
      return errorResponse;
    }
  }

  /**
   * Simulate command processing
   */
  async simulateProcessing(command, args) {
    // Simulate realistic processing times
    const baseDelay = Math.random() * 50 + 10; // 10-60ms base
    const complexityDelay = args.length * 5; // 5ms per argument
    const totalDelay = baseDelay + complexityDelay;

    await new Promise(resolve => setTimeout(resolve, totalDelay));
  }

  /**
   * Get mock response for command
   */
  getMockResponse(command, args) {
    // Check for specific command responses
    if (this.mockResponses.has(command)) {
      return this.mockResponses.get(command);
    }

    // Generate dynamic responses based on command patterns
    if (command.includes('list') || command.includes('show')) {
      return new MockCLIResponse(true, {
        items: [
          { id: 1, name: 'Item 1' },
          { id: 2, name: 'Item 2' }
        ]
      }, null, 20);
    }

    if (command.includes('create') || command.includes('add')) {
      return new MockCLIResponse(true, {
        id: Math.floor(Math.random() * 1000),
        created: true
      }, null, 30);
    }

    // Default success response
    return new MockCLIResponse(true, {
      command,
      args,
      processed: true
    }, null, 15);
  }

  /**
   * Update performance metrics
   */
  updateMetrics(duration, isError) {
    const { totalCommands, averageResponseTime, errorRate } = this.performanceMetrics;

    this.performanceMetrics.averageResponseTime =
      (averageResponseTime * (totalCommands - 1) + duration) / totalCommands;

    if (isError) {
      this.performanceMetrics.errorRate =
        (errorRate * (totalCommands - 1) + 1) / totalCommands;
    }
  }

  /**
   * Record command in history
   */
  recordCommand(command, args, response) {
    const historyEntry = {
      command,
      args: [...args],
      response: response.toJSON(),
      timestamp: Date.now()
    };

    this.commandHistory.push(historyEntry);

    // Keep only last 100 commands in memory
    if (this.commandHistory.length > 100) {
      this.commandHistory.shift();
    }
  }

  /**
   * Get command history
   */
  getCommandHistory(limit = 10) {
    return this.commandHistory.slice(-limit);
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    return {
      ...this.performanceMetrics,
      historySize: this.commandHistory.length,
      uptime: Date.now() - (this.commandHistory[0]?.timestamp || Date.now())
    };
  }

  /**
   * Clear history and metrics
   */
  reset() {
    this.commandHistory = [];
    this.performanceMetrics = {
      totalCommands: 0,
      averageResponseTime: 0,
      errorRate: 0
    };
    this.emit('reset');
  }

  /**
   * Set custom mock response
   */
  setMockResponse(command, response) {
    this.mockResponses.set(command, response);
  }

  /**
   * Remove mock response
   */
  removeMockResponse(command) {
    return this.mockResponses.delete(command);
  }

  /**
   * Get all available mock responses
   */
  getAvailableResponses() {
    return Array.from(this.mockResponses.keys());
  }
}

module.exports = {
  MockCLI,
  MockCLIResponse
};