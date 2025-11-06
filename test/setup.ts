/**
 * Test Setup File
 *
 * Global setup for all test suites
 */

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to suppress console.log during tests
  // log: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';

// Global test utilities
global.testUtils = {
  delay: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  generateMockSignal: (overrides = {}) => ({
    id: 'mock-signal',
    cost: 5,
    strength: 0.8,
    ...overrides
  }),

  generateMockSkillData: (count = 10) =>
    Array.from({ length: count }, (_, i) => ({
      skillId: `skill-${i}`,
      timestamp: new Date(Date.now() - Math.random() * 86400000),
      userId: `user-${i % 100}`,
      success: Math.random() > 0.2,
      latency: 50 + Math.random() * 200,
      score: Math.random()
    })),

  generateMockActivationRequest: (overrides = {}) => ({
    intent: 'test intent',
    context: { files: ['test.js'] },
    userId: 'test-user',
    timestamp: new Date(),
    ...overrides
  }),

  expectPerformance: (result: any, maxTime: number, description: string) => {
    if (result.duration > maxTime) {
      throw new Error(`${description} exceeded performance threshold: ${result.duration}ms > ${maxTime}ms`);
    }
  },

  expectSuccessRate: (results: any[], minRate: number, description: string) => {
    const successCount = results.filter(r => r.success !== false).length;
    const successRate = successCount / results.length;
    if (successRate < minRate) {
      throw new Error(`${description} success rate below threshold: ${(successRate * 100).toFixed(2)}% < ${(minRate * 100).toFixed(2)}%`);
    }
  }
};

// Extend Jest matchers
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },

  toBeValidTimestamp(received: any) {
    const pass = typeof received === 'number' && received > 0 && received <= Date.now() + 86400000;
    return {
      message: () => pass
        ? `expected ${received} not to be a valid timestamp`
        : `expected ${received} to be a valid timestamp`,
      pass,
    };
  },

  toHaveValidMetrics(received: any) {
    const requiredMetrics = ['totalTime', 'success', 'timestamp'];
    const hasAllMetrics = requiredMetrics.every(metric => received.hasOwnProperty(metric));
    const hasValidTimestamp = this.equals(received.timestamp, expect.any(Number));

    return {
      message: () => hasAllMetrics && hasValidTimestamp
        ? `expected ${received} not to have valid metrics`
        : `expected ${received} to have valid metrics`,
      pass: hasAllMetrics && hasValidTimestamp,
    };
  }
});

// Declare global extensions
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithinRange(floor: number, ceiling: number): R;
      toBeValidTimestamp(): R;
      toHaveValidMetrics(): R;
    }
  }
}

export {};