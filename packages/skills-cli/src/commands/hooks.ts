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
  config: { enabled: boolean; skillRulesPath?: string; [key: string]: unknown }
): Promise<void> {
  const hookScript = `#!/usr/bin/env node
/**
 * UserPromptSubmit Hook
 * Auto-activates skills based on user prompt intent
 */

import { readFile } from 'fs/promises';
import { join } from 'path';

async function main() {
  const prompt = process.argv[2] || '';
  
  if (!prompt) {
    console.error('No prompt provided');
    process.exit(1);
  }
  
  try {
    // Load skill registry
    const registryPath = join(process.cwd(), '${config.skillRulesPath || 'registry/index.json'}');
    const registry = JSON.parse(await readFile(registryPath, 'utf-8'));
    
    // Find matching skills (simplified matching - can be enhanced)
    const matches = registry.skills
      .filter((skill: { triggers?: { keywords?: string[] } }) => {
        const keywords = skill.triggers?.keywords || [];
        return keywords.some((keyword: string) => 
          prompt.toLowerCase().includes(keyword.toLowerCase())
        );
      })
      .map((skill: { name: string; severity?: string }) => ({
        skill: skill.name,
        severity: skill.severity || 'medium',
      }));
    
    // Output matches as JSON for Cursor to process
    if (matches.length > 0) {
      console.log(JSON.stringify({
        matches,
        activated: matches.filter((m: { severity: string }) => m.severity === 'critical' || m.severity === 'high'),
      }));
    }
  } catch (error) {
    console.error('Error in UserPromptSubmit hook:', error);
    process.exit(1);
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
  config: {
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
 * Executes post-response checks: build, prettier, KPI emission
 */

import { execSync } from 'child_process';
import { appendFile, ensureDir } from 'fs/promises';
import { join } from 'path';

async function main() {
  const errors: string[] = [];
  
  try {
    // Build check
    ${
      config.buildCheck !== false
        ? `
    try {
      console.log('Running build check...');
      execSync('pnpm -w run build', { stdio: 'inherit', cwd: process.cwd() });
      console.log('✓ Build check passed');
    } catch (error) {
      errors.push('Build check failed');
      console.error('✗ Build check failed');
    }`
        : ''
    }
    
    // Prettier check
    ${
      config.prettier !== false
        ? `
    try {
      console.log('Running prettier check...');
      execSync('pnpm -w prettier --check .', { stdio: 'inherit', cwd: process.cwd() });
      console.log('✓ Prettier check passed');
    } catch (error) {
      errors.push('Prettier check failed');
      console.error('✗ Prettier check failed');
    }`
        : ''
    }
    
    // Emit KPI
    ${
      config.kpiEmit !== false
        ? `
    try {
      const kpiDir = join(process.cwd(), 'obs', 'kpi');
      const kpiFile = join(kpiDir, 'events.jsonl');
      await ensureDir(kpiDir);
      
      const event = {
        timestamp: new Date().toISOString(),
        type: 'stop-hook-executed',
        data: {
          buildCheck: ${config.buildCheck !== false ? 'true' : 'false'},
          prettier: ${config.prettier !== false ? 'true' : 'false'},
          success: errors.length === 0,
        },
      };
      
      await appendFile(kpiFile, JSON.stringify(event) + '\\n');
      console.log('✓ KPI emitted');
    } catch (error) {
      console.warn('Warning: Failed to emit KPI:', error);
    }`
        : ''
    }
    
    if (errors.length > 0) {
      console.error('\\nStop hook completed with errors:', errors.join(', '));
      process.exit(1);
    } else {
      console.log('\\n✓ Stop hook completed successfully');
      process.exit(0);
    }
  } catch (error) {
    console.error('Error in Stop hook:', error);
    process.exit(2);
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
