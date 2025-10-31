#!/usr/bin/env node
/**
 * CLI entry point for Router Service
 * Starts the HTTP server for router functionality
 */

import { startServer } from '../server.js';

async function main() {
  try {
    await startServer();
  } catch (error) {
    console.error('❌ Failed to start router service:', error);
    process.exit(1);
  }
}

main();
