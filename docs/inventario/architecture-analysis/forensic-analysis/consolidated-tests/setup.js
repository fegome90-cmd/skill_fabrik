// Setup file for Jest tests
// Global configuration and test utilities

global.testEnvironment = {
  forensicAnalysisRoot: process.cwd(),
  reportsPath: `${process.cwd()}/consolidated-reports`,
  testsPath: `${process.cwd()}/consolidated-tests`,
  devDocsPath: `${process.cwd()}/dev-docs`,
  configPath: `${process.cwd()}/config`,
  srcPath: `${process.cwd()}/src`,
  rulesPath: `${process.cwd()}/config/rules_forense.json`
};

// Mock console methods to avoid noise during tests
global.originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info
};

// Importar utilidades consolidadas para evitar duplicación
const {
  readJsonFile,
  fileExists,
  readFileContent
} = require('../src/utils/validation-helpers');

// Helper function to read rules (usando utilidad consolidada)
global.readRules = () => {
  return readJsonFile(global.testEnvironment.rulesPath);
};

// Helper function to validate file exists (usando utilidad consolidada)
global.fileExists = filePath => {
  return fileExists(filePath);
};

// Helper function to read file content (usando utilidad consolidada)
global.readFile = filePath => {
  return readFileContent(filePath);
};

beforeEach(() => {
  // Reset console before each test
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
  console.info = jest.fn();
});

afterEach(() => {
  // Restore console after each test
  Object.assign(console, global.originalConsole);
});
