import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Skills Fabric CLI E2E tests
 * Optimized for enterprise testing with realistic scenarios
 */

export default defineConfig({
  testDir: './',
  testMatch: '**/*.spec.ts',
  testIgnore: '**/node_modules/**',

  // Global timeout for tests
  timeout: 5 * 60 * 1000, // 5 minutes

  // Expect timeout
  expect: {
    timeout: 30 * 1000, // 30 seconds
  },

  // Retry failed tests
  retries: process.env.CI ? 2 : 1,

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: './playwright-report' }],
    ['json', { outputFile: './test-results.json' }],
    ['junit', { outputFile: './test-results.xml' }],
    process.env.CI ? 'github' : 'list',
  ],

  // Global setup and teardown
  globalSetup: require.resolve('./global-setup.ts'),
  globalTeardown: require.resolve('./global-teardown.ts'),

  // Use projects for different test environments
  projects: [
    {
      name: 'cli-tests',
      testMatch: '**/user-workflows.spec.ts',
      use: {
        // CLI-specific configuration
        actionTimeout: 60 * 1000, // 60 seconds for CLI operations
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
      },
    },

    // Chrome desktop tests
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // CLI doesn't need browser, but we might for web interfaces
        viewport: null,
        ignoreHTTPSErrors: true,
      },
      testIgnore: '**/user-workflows.spec.ts',
    },

    // WebKit tests (Safari)
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        viewport: null,
        ignoreHTTPSErrors: true,
      },
      testIgnore: '**/user-workflows.spec.ts',
    },

    // Firefox tests
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: null,
        ignoreHTTPSErrors: true,
      },
      testIgnore: '**/user-workflows.spec.ts',
    },
  ],

  // Development server configuration (if needed for web interfaces)
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  // Output directories
  outputDir: './test-results',

  // Test isolation
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,

  // Environment variables
  env: {
    CLI_PATH: './dist/index.js',
    TEST_DATA_DIR: './test-data',
    RESULTS_DIR: './results',
    NODE_ENV: 'test',
  },
});