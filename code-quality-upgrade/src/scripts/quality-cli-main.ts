/**
 * Quality System CLI Main Entry Point
 *
 * Main entry point for CLI commands handling command line arguments.
 *
 * Usage: npm run cli:generate-report | cli:check-alerts | cli:system-status
 */

/* eslint-disable no-console */
import {
  checkQualityAlerts,
  generateQualityReport,
  qualitySystemStatus,
} from './quality-system-cli';

/**
 * Main CLI entry point - handles command line arguments
 */
export function main(): void {
  const args = process.argv.slice(2);
  const command = args[0] || '--help';

  try {
    switch (command) {
      case '--generate-report':
        generateQualityReport();
        break;
      case '--check-alerts':
        checkQualityAlerts();
        break;
      case '--system-status':
        qualitySystemStatus();
        break;
      case '--help':
      default:
        console.log('Quality System CLI');
        console.log('Usage:');
        console.log('  npm run cli:generate-report    Generate quality report');
        console.log('  npm run cli:check-alerts       Check quality alerts');
        console.log('  npm run cli:system-status      Show system status');
        break;
    }
  } catch (error) {
    console.error('CLI Error:', error);
    process.exit(1);
  }
}

// Execute main function if this file is run directly
if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
