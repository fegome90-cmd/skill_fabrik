#!/usr/bin/env node

/**
 * Router Service Entry Point
 */

import { startServer } from './index.js';

startServer().catch(error => {
  console.error('Failed to start router service:', error);
  process.exit(1);
});