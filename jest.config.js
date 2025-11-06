/**
 * Jest Configuration
 */

export default {
  // Test environment
  testEnvironment: 'node',

  // Test file patterns
  testMatch: [
    '**/test/**/*.test.ts',
    '**/test/**/*.spec.ts'
  ],

  // TypeScript configuration
  preset: 'ts-jest',
  extensionsToTreatAsEsm: ['.ts'],
  globals: {
    'ts-jest': {
      useESM: true,
      tsconfig: {
        target: 'es2020',
        module: 'esnext'
      }
    }
  },

  // Module path mapping
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@skills-fabrik/(.*)$': '<rootDir>/packages/$1/src'
  },

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],

  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'packages/*/src/**/*.ts',
    'src/**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/test/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],

  // Test timeout
  testTimeout: 60000,

  // Verbose output
  verbose: true,

  // Transform configuration
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        module: 'esnext',
        target: 'es2020'
      }
    }]
  },

  // Module file extensions
  moduleFileExtensions: ['ts', 'js', 'json'],

  // Test runner options
  maxWorkers: 4,

  // Reporting
  reporters: [
    'default',
    ['jest-junit', { outputDirectory: 'test-results', outputName: 'junit.xml' }]
  ]
};