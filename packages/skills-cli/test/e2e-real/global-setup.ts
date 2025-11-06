/**
 * Global setup for E2E tests
 * Prepares the environment for testing
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const TEST_DATA_DIR = path.join(__dirname, 'test-data');
const RESULTS_DIR = path.join(__dirname, 'results');

async function globalSetup() {
  console.log('🚀 Setting up E2E test environment...');

  // Create necessary directories
  [TEST_DATA_DIR, RESULTS_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ Created directory: ${dir}`);
    }
  });

  // Check if CLI is built
  const cliPath = path.join(__dirname, '../../dist/index.js');
  if (!fs.existsSync(cliPath)) {
    console.log('📦 Building CLI for E2E tests...');
    try {
      execSync('npm run build', {
        cwd: path.join(__dirname, '../..'),
        stdio: 'inherit'
      });
      console.log('✅ CLI built successfully');
    } catch (error) {
      console.error('❌ Failed to build CLI:', error);
      throw error;
    }
  }

  // Check if CLI is working
  try {
    const version = execSync(`node ${cliPath} --version`, {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    console.log(`✅ CLI available: ${version.trim()}`);
  } catch (error) {
    console.error('❌ CLI not working:', error);
    throw error;
  }

  // Clean up any old test data
  if (fs.existsSync(TEST_DATA_DIR)) {
    try {
      fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true });
      fs.mkdirSync(TEST_DATA_DIR, { recursive: true });
      console.log('✅ Cleaned up old test data');
    } catch (error) {
      console.log('⚠️  Could not clean up test data:', error.message);
    }
  }

  // Prepare test environment variables
  process.env.TEST_MODE = 'e2e';
  process.env.CLI_TEST_TIMEOUT = '120000'; // 2 minutes

  console.log('✅ E2E environment setup complete');
  return {
    testStartTime: new Date().toISOString(),
    cliPath,
    testDataDir: TEST_DATA_DIR,
    resultsDir: RESULTS_DIR,
  };
}

export default globalSetup;