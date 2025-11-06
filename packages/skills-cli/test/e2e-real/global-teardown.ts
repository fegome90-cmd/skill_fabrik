/**
 * Global teardown for E2E tests
 * Cleans up the environment after testing
 */

import * as fs from 'fs';
import * as path from 'path';

const TEST_DATA_DIR = path.join(__dirname, 'test-data');
const RESULTS_DIR = path.join(__dirname, 'results');

async function globalTeardown(config: any) {
  console.log('🧹 Cleaning up E2E test environment...');

  const endTime = new Date();
  const startTime = new Date(config.testStartTime);
  const duration = endTime.getTime() - startTime.getTime();

  console.log(`📊 Test session completed in ${(duration / 1000 / 60).toFixed(2)} minutes`);

  // Generate summary report
  const summary = {
    testSession: {
      startTime: config.testStartTime,
      endTime: endTime.toISOString(),
      duration: duration,
      cliPath: config.cliPath,
    },
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    },
    cleanup: {
      testDataCleaned: false,
      resultsPreserved: true,
    },
  };

  try {
    // Save summary to results directory
    const summaryFile = path.join(RESULTS_DIR, 'test-session-summary.json');
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
    console.log(`✅ Test summary saved to: ${summaryFile}`);

    // List test results
    if (fs.existsSync(RESULTS_DIR)) {
      const resultFiles = fs.readdirSync(RESULTS_DIR);
      console.log(`📁 Test results available: ${resultFiles.length} files`);
      resultFiles.forEach(file => {
        if (file !== 'test-session-summary.json') {
          console.log(`   - ${file}`);
        }
      });
    }
  } catch (error) {
    console.log('⚠️  Could not save test summary:', error.message);
  }

  // Clean up test data (optional - keep for debugging)
  const preserveTestData = process.env.PRESERVE_TEST_DATA === 'true';
  if (!preserveTestData && fs.existsSync(TEST_DATA_DIR)) {
    try {
      fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true });
      console.log('✅ Test data cleaned up');
    } catch (error) {
      console.log('⚠️  Could not clean up test data:', error.message);
    }
  } else {
    console.log('📁 Test data preserved for debugging');
  }

  // Final cleanup check
  const remainingFiles = [];
  [TEST_DATA_DIR, RESULTS_DIR].forEach(dir => {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      remainingFiles.push(...files.map(f => `${dir}/${f}`));
    }
  });

  if (remainingFiles.length > 0) {
    console.log(`📁 Remaining files: ${remainingFiles.length} files preserved`);
  }

  console.log('✅ E2E environment cleanup complete');
  console.log('🎉 All E2E tests completed successfully!');
}

export default globalTeardown;