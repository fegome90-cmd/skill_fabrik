/**
 * Vitest Configuration for Daemon V2 Tests
 * Enhanced testing setup with coverage and mocking
 * Task: SF-TESTING-2025-V2.2
 * Date: 2025-11-14
 */

import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    // Test configuration
    testTimeout: 60000, // 60 seconds for integration tests
    hookTimeout: 30000,  // 30 seconds for hooks
    isolate: true,       // Isolate test contexts
    allowOnly: false,    // Disallow .only in production
    bail: 1,             // Stop on first test failure

    // Environment
    environment: 'node',
    env: {
      NODE_ENV: 'test',
      SF_DAEMON_MODE: 'test',
      LOG_LEVEL: 'error' // Minimize logging during tests
    },

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'coverage/',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/*.d.ts',
        'src/index.ts',
        'ecosystem.config.js'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        },
        // Higher thresholds for critical components
        'src/orchestration/**/*': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90
        }
      },
      clean: true,
      cleanOnRerun: true,
      all: true
    },

    // Test pattern matching
    include: [
      'src/**/__tests__/**/*.{test,spec}.ts',
      'src/**/*.{test,spec}.ts'
    ],
    exclude: [
      'node_modules/',
      'dist/',
      'coverage/',
      '**/*.d.ts'
    ],

    // Reporting
    reporter: ['verbose', 'json', 'html'],
    outputFile: {
      json: './test-results/daemon-v2-results.json',
      html: './test-results/daemon-v2-report.html'
    },

    // Watch configuration
    watch: false,
    watchExclude: [
      'node_modules/',
      'dist/',
      'coverage/'
    ],

    // Global setup and teardown
    globalSetup: [],
    setupFiles: [],

    // Concurrency
    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: 4,
        minThreads: 1
      }
    },

    // Test organization
    sequence: {
      concurrent: true,
      shuffle: false,
      seed: 42
    },

    // Mocking
    clearMocks: true,
    restoreMocks: true,
    mockReset: true,

    // Logging
    logHeapUsage: true,
    passWithNoTests: false,
    reporters: ['verbose'],

    // Performance
    maxConcurrency: 4,
    cache: {
      dir: './node_modules/.vitest'
    },

    // File dependencies
    deps: {
      external: [
        'pm2',
        'ioredis',
        'node-cron'
      ]
    }
  },

  // Resolve configuration
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/orchestration': resolve(__dirname, './src/orchestration'),
      '@/observability': resolve(__dirname, './src/observability'),
      '@/utils': resolve(__dirname, './src/utils')
    }
  },

  // Build optimization
  optimizeDeps: {
    include: [
      'fastify',
      'zod',
      'prom-client'
    ],
    exclude: [
      'pm2',
      'ioredis',
      'node-cron'
    ]
  },

  // Define constants
  define: {
    __TEST__: 'true',
    __DAEMON_VERSION__: '"2.0.0"',
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  }
});