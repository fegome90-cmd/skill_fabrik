module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/consolidated-tests'],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    'src/**/*.js',
    'consolidated-tests/**/*.js',
    '!consolidated-tests/**/*.test.js',
    '!consolidated-tests/**/*.spec.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
  testTimeout: 30000,
  setupFilesAfterEnv: ['<rootDir>/consolidated-tests/setup.js'],
  collectCoverage: false
};
