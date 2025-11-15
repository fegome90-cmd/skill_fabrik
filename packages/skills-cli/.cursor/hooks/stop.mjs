#!/usr/bin/env node
/**
 * Stop Hook
 * Executes post-response checks using router package: guardrails, prettier, typecheck, KPI
 */

import { stopHook } from '../../packages/router/dist/index.js';
import { execSync } from 'child_process';
import { readFile } from 'fs/promises';

async function getEditLog() {
  try {
    // Try to get git diff to track edited files
    const { execSync: execSyncSync } = await import('child_process');
    const output = execSyncSync('git diff --name-only', { encoding: 'utf-8', stdio: 'pipe' }).trim();
    
    const files = output.split('\n').filter(Boolean);
    const reposChanged = new Set<string>();
    
    const editLog = files.map(file => {
      // Detect repo from file path
      const parts = file.split('/');
      const packagesIndex = parts.indexOf('packages');
      const repo = packagesIndex !== -1 && parts.length > packagesIndex + 1
        ? parts[packagesIndex + 1]
        : 'root';
      
      reposChanged.add(repo);
      
      return {
        file,
        repo,
        ts: Date.now(),
      };
    });
    
    return editLog;
  } catch {
    // If git command fails, return empty log
    return [];
  }
}

async function main() {
  try {
    // Get edit log from git
    const editLog = await getEditLog();
    const reposChanged = new Set(editLog.map(e => e.repo));
    
    if (editLog.length === 0) {
      // No edits, exit silently
      process.exit(0);
    }
    
    // Call router stop hook
    const result = await stopHook({
      editLog,
      reposChanged,
      cwd: process.cwd(),
    });
    
    // Display hints if available
    if (result.hints && result.hints.length > 0) {
      console.log('\n' + result.hints.join('\n'));
    }
    
    // Check if blocked by guardrails
    const blocked = result.typecheck.some(tc => tc.errors < 0) || result.hints?.some(h => h.includes('🚫'));
    
    if (blocked) {
      console.error('\n⚠️  Blocked by guardrails or errors detected');
      process.exit(1);
    }
    
    // Success
    if (result.formatted.length > 0) {
      console.log(`\n✓ Formatted ${result.formatted.length} file(s)`);
    }
    
    if (result.typecheck.length > 0) {
      const totalErrors = result.typecheck.reduce((sum, tc) => sum + Math.max(0, tc.errors), 0);
      if (totalErrors === 0) {
        console.log('✓ All type checks passed');
      } else {
        console.error(`✗ ${totalErrors} TypeScript error(s) found`);
      }
    }
    
    // Notificaciones ya manejadas por stopHook, no es necesario duplicar aquí
    
    process.exit(0);
  } catch (error) {
    // Silently fail - hooks should not break editor workflow
    console.error('Hook error:', error);
    process.exit(0);
  }
}

main();
