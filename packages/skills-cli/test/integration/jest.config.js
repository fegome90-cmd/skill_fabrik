/** @type {import('jest').Config} */
module.exports = {
  // Use Node environment for CLI testing
  testEnvironment: 'node',

  // Extensions to consider
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // Transform TypeScript files
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        target: 'ES2022',
        module: 'ESNext',
        moduleResolution: 'node',
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
        skipLibCheck: true
      }
    }]
  },

  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/*.(test|spec).+(ts|tsx|js)'
  ],

  // Coverage configuration
  collectCoverage: false, // Set to true for coverage reports
  collectCoverageFrom: [
    '../../src/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/setup.ts'],

  // Module resolution
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/../../src/$1'
  },

  // Test timeout (30 seconds for CLI operations)
  testTimeout: 30000,

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Error handling
  errorOnDeprecated: true,

  // Performance
  maxWorkers: 4, // Limit concurrent workers for CLI testing
  detectOpenHandles: true
};