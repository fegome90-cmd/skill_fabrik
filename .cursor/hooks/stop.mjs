#!/usr/bin/env node
/**
 * Stop Hook
 * Executes post-response checks: build, prettier, KPI emission
 */

import { execSync } from 'child_process';
import { appendFile, ensureDir } from 'fs/promises';
import { join } from 'path';

async function main() {
  const errors: string[] = [];
  
  try {
    // Build check
    
    try {
      console.log('Running build check...');
      execSync('pnpm -w run build', { stdio: 'inherit', cwd: process.cwd() });
      console.log('✓ Build check passed');
    } catch (error) {
      errors.push('Build check failed');
      console.error('✗ Build check failed');
    }
    
    // Prettier check
    
    try {
      console.log('Running prettier check...');
      execSync('pnpm -w prettier --check .', { stdio: 'inherit', cwd: process.cwd() });
      console.log('✓ Prettier check passed');
    } catch (error) {
      errors.push('Prettier check failed');
      console.error('✗ Prettier check failed');
    }
    
    // Emit KPI
    
    try {
      const kpiDir = join(process.cwd(), 'obs', 'kpi');
      const kpiFile = join(kpiDir, 'events.jsonl');
      await ensureDir(kpiDir);
      
      const event = {
        timestamp: new Date().toISOString(),
        type: 'stop-hook-executed',
        data: {
          buildCheck: true,
          prettier: true,
          success: errors.length === 0,
        },
      };
      
      await appendFile(kpiFile, JSON.stringify(event) + '\n');
      console.log('✓ KPI emitted');
    } catch (error) {
      console.warn('Warning: Failed to emit KPI:', error);
    }
    
    if (errors.length > 0) {
      console.error('\nStop hook completed with errors:', errors.join(', '));
      process.exit(1);
    } else {
      console.log('\n✓ Stop hook completed successfully');
      process.exit(0);
    }
  } catch (error) {
    console.error('Error in Stop hook:', error);
    process.exit(2);
  }
}

main();
