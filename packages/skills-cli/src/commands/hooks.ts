import { Command } from 'commander';
import fs from 'fs-extra';
import * as path from 'path';
import { Logger } from '../utils/logger.js';

const { ensureDir, writeFile, pathExists, readJson } = fs;

export interface HookInstallationResult {
  success: boolean;
  hooksInstalled: string[];
  errors: string[];
}

export function hooksCommand(program: Command) {
  program
    .command('hooks')
    .description('Setup hooks for skills auto-activation and build checks')
    .option('--hook-name <name>', 'Setup specific hook only')
    .option('-v, --verbose', 'Verbose output')
    .action(async (options: { hookName?: string; verbose?: boolean }) => {
      const logger = new Logger(options.verbose);

      try {
        logger.info('Setting up hooks for Cursor editor...');

        // Determine hooks directory (Cursor uses .cursor/hooks/)
        const hooksDir = path.join(process.cwd(), '.cursor', 'hooks');
        await ensureDir(hooksDir);

        // Load hooks configuration template
        const hooksConfigPath = path.join(process.cwd(), 'configs', 'templates', 'hooks.json');

        let hooksConfig: Record<string, { enabled: boolean; [key: string]: unknown }>;
        if (await pathExists(hooksConfigPath)) {
          hooksConfig = await readJson(hooksConfigPath);
        } else {
          // Default configuration
          hooksConfig = {
            userPromptSubmit: {
              enabled: true,
              skillRulesPath: 'registry/index.json',
            },
            stop: {
              enabled: true,
              buildCheck: true,
              prettier: true,
              kpiEmit: true,
            },
          };
        }

        const hooksToInstall = options.hookName
          ? [options.hookName]
          : Object.keys(hooksConfig).filter(name => hooksConfig[name].enabled);

        const results: HookInstallationResult = {
          success: true,
          hooksInstalled: [],
          errors: [],
        };

        // Install each hook
        for (const hookName of hooksToInstall) {
          try {
            logger.info(`Installing hook: ${hookName}`);

            if (hookName === 'userPromptSubmit') {
              await installUserPromptSubmitHook(hooksDir, hooksConfig[hookName]);
            } else if (hookName === 'stop') {
              await installStopHook(hooksDir, hooksConfig[hookName]);
            } else {
              throw new Error(`Unknown hook type: ${hookName}`);
            }

            results.hooksInstalled.push(hookName);
            logger.success(`✓ Installed: ${hookName}`);
          } catch (error) {
            results.success = false;
            results.errors.push(
              `${hookName}: ${error instanceof Error ? error.message : String(error)}`
            );
            logger.error(`✗ Failed to install ${hookName}`);
          }
        }

        // Summary
        logger.info(`\nHooks installed: ${results.hooksInstalled.join(', ')}`);
        if (results.errors.length > 0) {
          logger.error(`Errors: ${results.errors.join('; ')}`);
        }

        // Save hook configuration
        const localConfigPath = path.join(hooksDir, 'hooks-config.json');
        await writeFile(localConfigPath, JSON.stringify(hooksConfig, null, 2));
        logger.success(`Configuration saved: ${localConfigPath}`);

        process.exit(results.success ? 0 : 2);
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(2);
      }
    });
}

async function installUserPromptSubmitHook(
  hooksDir: string,
  _config: { enabled: boolean; skillRulesPath?: string; [key: string]: unknown }
): Promise<void> {
  const hookScript = `#!/usr/bin/env node
/**
 * UserPromptSubmit Hook
 * Auto-activates skills based on user prompt intent using router package
 */

import { userPromptSubmitHook } from '../../packages/router/dist/index.js';
import { resolve } from 'path';

async function main() {
  const prompt = process.argv[2] || '';
  const openFilesArg = process.argv[3] || '[]';
  
  if (!prompt) {
    // No prompt provided, exit silently (hook is optional)
    process.exit(0);
  }
  
  try {
    const openFiles = JSON.parse(openFilesArg);
    
    // Get active file content if available (max 2KB)
    let activeFileContent = '';
    if (openFiles.length > 0) {
      try {
        const { readFile } = await import('fs/promises');
        const firstFile = resolve(process.cwd(), openFiles[0]);
        const content = await readFile(firstFile, { encoding: 'utf-8' });
        activeFileContent = content.substring(0, 2048); // Limit to 2KB
      } catch {
        // Ignore errors reading file
      }
    }
    
    // Call router hook
    const result = await userPromptSubmitHook({
      prompt,
      openFiles: Array.isArray(openFiles) ? openFiles : [],
      activeFileContent,
      cwd: process.cwd(),
    });
    
    // Output injected note if skills activated
    if (result.injectedNote) {
      console.log(result.injectedNote);
    }
    
    // Exit with success
    process.exit(0);
  } catch (error) {
    // Silently fail - hooks should not break editor workflow
    console.error('Hook error:', error);
    process.exit(0);
  }
}

main();
`;

  const hookPath = path.join(hooksDir, 'userPromptSubmit.mjs');
  await writeFile(hookPath, hookScript);
  // Make executable (Unix-like systems)
  if (process.platform !== 'win32') {
    const { execSync } = await import('child_process');
    execSync(`chmod +x ${hookPath}`);
  }
}

async function installStopHook(
  hooksDir: string,
  _config: {
    enabled: boolean;
    buildCheck?: boolean;
    prettier?: boolean;
    kpiEmit?: boolean;
    [key: string]: unknown;
  }
): Promise<void> {
  const hookScript = `#!/usr/bin/env node
/**
 * Stop Hook
 * Executes post-response checks using router package: guardrails, prettier, typecheck, KPI
 */

import { stopHook } from '../../packages/router/dist/index.js';
import { execSync } from 'child_process';
import { readFile } from 'fs/promises';

async function getEditLog(): Promise<Array<{ file: string; repo: string; ts: number }>> {
  try {
    // Try to get git diff to track edited files
    const { execSync: execSyncSync } = await import('child_process');
    const output = execSyncSync('git diff --name-only', { encoding: 'utf-8', stdio: 'pipe' }).trim();
    
    const files = output.split('\\n').filter(Boolean);
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
      console.log('\\n' + result.hints.join('\\n'));
    }
    
    // Check if blocked by guardrails
    const blocked = result.typecheck.some(tc => tc.errors < 0) || result.hints?.some(h => h.includes('🚫'));
    
    if (blocked) {
      console.error('\\n⚠️  Blocked by guardrails or errors detected');
      process.exit(1);
    }
    
    // Success
    if (result.formatted.length > 0) {
      console.log(\`\\n✓ Formatted \${result.formatted.length} file(s)\`);
    }
    
    if (result.typecheck.length > 0) {
      const totalErrors = result.typecheck.reduce((sum, tc) => sum + Math.max(0, tc.errors), 0);
      if (totalErrors === 0) {
        console.log('✓ All type checks passed');
      } else {
        console.error(\`✗ \${totalErrors} TypeScript error(s) found\`);
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
`;

  const hookPath = path.join(hooksDir, 'stop.mjs');
  await writeFile(hookPath, hookScript);
  // Make executable
  if (process.platform !== 'win32') {
    const { execSync } = await import('child_process');
    execSync(`chmod +x ${hookPath}`);
  }
}
