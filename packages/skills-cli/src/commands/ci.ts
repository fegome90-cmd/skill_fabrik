import { Command } from 'commander';
import fs from 'fs-extra';
import { execSync } from 'child_process';
import * as path from 'path';
import * as yaml from 'yaml';
import { Logger } from '../utils/logger.js';

const { readFile, pathExists } = fs;

interface CIGate {
  name: string;
  command: string;
  required: boolean;
  description?: string;
}

export function ciCommand(program: Command) {
  program
    .command('ci')
    .description('Run CI gates locally')
    .option('--gate <name>', 'Run specific gate only')
    .option('-v, --verbose', 'Verbose output')
    .action(async (options: { gate?: string; verbose?: boolean }) => {
      const logger = new Logger(options.verbose);

      try {
        logger.info('Running CI gates locally...');

        // Load CI gates configuration
        const gatesConfigPath = path.join(process.cwd(), 'ci', 'GATES.yml');

        if (!(await pathExists(gatesConfigPath))) {
          throw new Error(`CI gates config not found: ${gatesConfigPath}`);
        }

        const configContent = await readFile(gatesConfigPath, { encoding: 'utf-8' });
        const config = yaml.parse(configContent) as { gates: Record<string, CIGate> };

        if (!config.gates || typeof config.gates !== 'object') {
          throw new Error('Invalid CI gates configuration format');
        }

        // Convert to array and filter if specific gate requested
        const gates: CIGate[] = Object.entries(config.gates)
          .map(([name, gate]) => ({ ...gate, name }))
          .filter(gate => !options.gate || gate.name === options.gate);

        if (gates.length === 0) {
          logger.error(`No gates found${options.gate ? ` matching: ${options.gate}` : ''}`);
          process.exit(2);
        }

        logger.info(`Found ${gates.length} gate(s) to run`);

        const results: Array<{ gate: string; success: boolean; output?: string; error?: string }> =
          [];
        let hasFailures = false;

        // Run each gate
        for (const gate of gates) {
          logger.info(`\nRunning gate: ${gate.name}`);
          if (gate.description) {
            logger.debug(`  Description: ${gate.description}`);
          }

          try {
            logger.debug(`  Command: ${gate.command}`);
            const output = execSync(gate.command, {
              encoding: 'utf-8',
              stdio: options.verbose ? 'inherit' : 'pipe',
              cwd: process.cwd(),
            });

            results.push({
              gate: gate.name,
              success: true,
              output: options.verbose ? undefined : output,
            });

            logger.success(`✓ ${gate.name}: Passed`);
          } catch (error: unknown) {
            const execError = error as { stdout?: string; stderr?: string };
            const errorOutput = execError.stdout || execError.stderr || String(error);

            results.push({
              gate: gate.name,
              success: false,
              error: errorOutput,
            });

            logger.error(`✗ ${gate.name}: Failed`);

            if (options.verbose) {
              logger.error(`  Output: ${errorOutput.substring(0, 500)}`);
            }

            if (gate.required) {
              hasFailures = true;
            }
          }
        }

        // Summary
        const passed = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;

        logger.info(`\nCI Gates Summary: ${passed} passed, ${failed} failed`);

        if (hasFailures) {
          logger.error('Required gates failed - CI check failed');
          process.exit(1);
        } else if (failed > 0) {
          logger.warning('Some non-required gates failed');
          process.exit(0);
        } else {
          logger.success('All gates passed!');
          process.exit(0);
        }
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(2);
      }
    });
}
