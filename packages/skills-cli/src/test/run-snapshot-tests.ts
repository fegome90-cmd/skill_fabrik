#!/usr/bin/env node

/**
 * Run Snapshot Tests Script
 *
 * A simple script to run the P6 snapshot testing system for manifest.json validation.
 * This script can be used to manually test the snapshot testing functionality.
 */

import { resolve } from 'path';
import { runSnapshotTests } from './snapshot-testing.js';

async function main() {
  console.log('🧪 P6 Snapshot Testing for manifest.json');
  console.log('='.repeat(50));

  try {
    const result = await runSnapshotTests({
      testDir: resolve(process.cwd(), 'test', 'snapshot'),
      fixturesDir: resolve(process.cwd(), 'test', 'fixtures', 'sample-skills'),
      updateSnapshots: process.env.UPDATE_SNAPSHOTS === 'true',
      strictMode: process.env.NODE_ENV === 'ci',
      verbose: process.env.VERBOSE === 'true'
    });

    console.log('\n' + '='.repeat(50));
    console.log('📊 Test Results Summary:');
    console.log(`Total Tests: ${result.totalTests}`);
    console.log(`Passed: ${result.passedTests} ✅`);
    console.log(`Failed: ${result.failedTests} ${result.failedTests > 0 ? '❌' : '✅'}`);
    console.log(`Skipped: ${result.skippedTests} ${result.skippedTests > 0 ? '⏭️' : ''}`);
    console.log(`Duration: ${result.duration}ms`);
    console.log(`Success Rate: ${((result.passedTests / result.totalTests) * 100).toFixed(1)}%`);

    if (result.failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      for (const testResult of result.results.filter(r => !r.passed && !r.skipped)) {
        console.log(`  - ${testResult.testName}: ${testResult.error}`);
        if (testResult.differences.length > 0) {
          console.log(`    Differences: ${testResult.differences.join(', ')}`);
        }
      }
    }

    console.log('\n' + result.summary);

    if (result.failedTests > 0) {
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Snapshot testing failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main as runSnapshotTestsScript };