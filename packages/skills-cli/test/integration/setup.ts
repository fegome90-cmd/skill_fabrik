import { execSync } from 'child_process';
import { join } from 'path';

// Global test setup
beforeAll(() => {
  // Ensure CLI is built before running tests
  try {
    execSync('pnpm --filter @skills-fabrik/skills-cli build', {
      stdio: 'pipe',
      cwd: join(__dirname, '../../../..')
    });
  } catch (error) {
    console.warn('CLI build failed, tests may not work correctly');
  }

  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.CI = 'true';
  process.env.SKILLS_FABRIK_TEST_MODE = 'true';

  // Disable colors in test output for consistent snapshots
  process.env.NO_COLOR = '1';
  process.env.FORCE_COLOR = '0';
});

afterAll(() => {
  // Cleanup any global test state
  delete process.env.SKILLS_FABRIK_TEST_MODE;
});

// Global test utilities
global.testUtils = {
  // Helper to create temporary directories
  createTempDir: (prefix: string = 'skills-test-'): string => {
    const tempDir = `/tmp/${prefix}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    execSync(`mkdir -p ${tempDir}`);
    return tempDir;
  },

  // Helper to cleanup temporary directories
  cleanupTempDir: (dir: string): void => {
    try {
      execSync(`rm -rf ${dir}`);
    } catch (error) {
      // Ignore cleanup errors
    }
  },

  // Helper to wait for async operations
  wait: (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};