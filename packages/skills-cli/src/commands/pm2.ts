import { Command } from 'commander';
import { execSync } from 'child_process';
import fs from 'fs-extra';
import * as path from 'path';
import { Logger } from '../utils/logger.js';

const { pathExists } = fs;

// PM2 interfaces for future config parsing (currently unused)
// interface PM2App {
//   name: string;
//   script: string;
//   cwd?: string;
//   args?: string;
//   error_file?: string;
//   out_file?: string;
// }

export function pm2Command(program: Command) {
  program
    .command('pm2:start')
    .alias('pm2-start')
    .description('Start backend services with PM2')
    .argument('[services...]', 'Specific services to start')
    .option('-v, --verbose', 'Verbose output')
    .option(
      '--config <file>',
      'Path to PM2 ecosystem config file',
      'scripts/pm2/ecosystem.config.cjs'
    )
    .option('--no-save', 'Do not save PM2 process list')
    .action(
      async (
        services: string[],
        options: { verbose?: boolean; config?: string; save?: boolean }
      ) => {
        const logger = new Logger(options.verbose);

        try {
          logger.info('Starting PM2 services...');

          // Check if PM2 is installed
          try {
            execSync('pm2 --version', { stdio: 'pipe' });
          } catch {
            throw new Error('PM2 is not installed. Install it with: npm install -g pm2');
          }

          // Load PM2 config
          const configPath = path.resolve(options.config || 'scripts/pm2/ecosystem.config.cjs');

          if (!(await pathExists(configPath))) {
            logger.warning(`PM2 config not found: ${configPath}`);
            logger.info('Please create a PM2 ecosystem config file');
            logger.info(`Expected location: ${configPath}`);
            process.exit(2);
          }

          logger.debug(`Using config: ${configPath}`);

          // Parse config (assuming JS/TS file that exports module.exports)
          // For now, we'll use PM2 directly with the config file

          // Build PM2 command
          const pm2Command = `pm2 start ${configPath}`;

          // If specific services requested, use PM2's --only flag
          if (services.length > 0) {
            const serviceNames = services.join(',');
            logger.info(`Starting specific services: ${serviceNames}`);

            // PM2 ecosystem with --only flag
            for (const service of services) {
              try {
                logger.debug(`Starting: ${service}`);
                execSync(`pm2 start ${configPath} --only ${service}`, {
                  stdio: options.verbose ? 'inherit' : 'pipe',
                  cwd: process.cwd(),
                });
                logger.success(`✓ Started: ${service}`);
              } catch (error) {
                logger.error(`✗ Failed to start: ${service}`);
                if (options.verbose) {
                  logger.error(`${error}`);
                }
              }
            }
          } else {
            // Start all services from config
            logger.info('Starting all services from config...');
            try {
              execSync(pm2Command, {
                stdio: options.verbose ? 'inherit' : 'pipe',
                cwd: process.cwd(),
              });
              logger.success('✓ All services started');
            } catch (error) {
              logger.error('Failed to start services');
              if (options.verbose) {
                logger.error(`${error}`);
              }
              process.exit(1);
            }
          }

          // Save PM2 process list if requested
          if (options.save !== false) {
            try {
              execSync('pm2 save', { stdio: 'pipe' });
              logger.success('✓ PM2 process list saved');
            } catch (error) {
              logger.warning('Failed to save PM2 process list');
            }
          }

          // Show PM2 status
          logger.info('\nPM2 Status:');
          try {
            execSync('pm2 list', { stdio: 'inherit', cwd: process.cwd() });
          } catch {
            // Ignore errors in pm2 list
          }

          logger.success('\n✅ PM2 services started successfully');
          logger.info('Use "pm2 logs" to view logs, "pm2 stop <name>" to stop services');

          process.exit(0);
        } catch (error) {
          logger.error(error instanceof Error ? error.message : String(error));
          process.exit(2);
        }
      }
    );
}
