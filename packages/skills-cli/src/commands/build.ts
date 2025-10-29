import { Command } from 'commander';
import { execSync } from 'child_process';
import { trackEdits, detectRepos } from '../utils/file-tracker.js';
import { Logger } from '../utils/logger.js';
import * as path from 'path';

export interface BuildError {
  file: string;
  line: number;
  column: number;
  message: string;
  code: string;
}

export interface BuildResult {
  repo: string;
  success: boolean;
  errors: BuildError[];
  output: string;
}

export function buildCommand(program: Command) {
  program
    .command('build')
    .description('Check builds and TypeScript errors')
    .option('--fix', 'Suggest fixes for errors')
    .option('-v, --verbose', 'Verbose output')
    .option('--all', 'Check all repos, not just modified ones')
    .action(async (options: { fix?: boolean; verbose?: boolean; all?: boolean }) => {
      const logger = new Logger(options.verbose);

      try {
        logger.info('Checking builds...');

        let repos: string[] = [];

        if (options.all) {
          // Find all packages in workspace
          repos = await findAllPackages();
          logger.debug(`Checking all repos: ${repos.join(', ')}`);
        } else {
          // Track edits and detect affected repos
          const edits = await trackEdits();
          repos = detectRepos(edits);

          if (repos.length === 0) {
            logger.info('No modified repos detected');
            process.exit(0);
          }

          logger.debug(`Modified repos detected: ${repos.join(', ')}`);
        }

        const results: BuildResult[] = [];
        let totalErrors = 0;

        for (const repo of repos) {
          logger.info(`Building: ${repo}`);

          try {
            // Try to build using pnpm workspace filter
            const buildCmd =
              repo === 'root' ? 'pnpm run build' : `pnpm -w --filter "${repo}" run build`;

            logger.debug(`Executing: ${buildCmd}`);
            const output = execSync(buildCmd, {
              encoding: 'utf-8',
              stdio: 'pipe',
              cwd: process.cwd(),
            });

            results.push({
              repo,
              success: true,
              errors: [],
              output,
            });

            logger.success(`✓ ${repo}: Build successful`);
          } catch (error: unknown) {
            const errorOutput = error instanceof Error ? error.message : String(error);
            const execError = error as { stdout?: string; stderr?: string };
            const fullOutput = execError.stdout || execError.stderr || errorOutput;

            // Parse TypeScript errors
            const errors = parseTypeScriptErrors(fullOutput);
            totalErrors += errors.length;

            results.push({
              repo,
              success: false,
              errors,
              output: fullOutput,
            });

            logger.error(`✗ ${repo}: ${errors.length} error(s) found`);

            // Show errors if < 5 or verbose mode
            if (errors.length < 5 || options.verbose) {
              errors.forEach(err => {
                logger.error(`  ${err.file}:${err.line}:${err.column} - ${err.message}`);
              });
            }
          }
        }

        // Summary
        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;

        logger.info(`\nBuild Summary: ${successCount} successful, ${failCount} failed`);

        // If errors found and fix mode
        if (totalErrors > 0 && options.fix) {
          if (totalErrors >= 5) {
            logger.warning(
              `\n⚠️  ${totalErrors} errors detected. Consider launching auto-error-resolver agent.`
            );
            logger.info('Recommendation: Use build-error-resolver agent for systematic fixes');
          } else {
            logger.info(`\n${totalErrors} error(s) need to be fixed manually`);
          }
        }

        // Exit with appropriate code
        const hasErrors = results.some(r => !r.success);
        process.exit(hasErrors ? 1 : 0);
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(2);
      }
    });
}

async function findAllPackages(): Promise<string[]> {
  try {
    // Try to find packages from pnpm workspace
    const output = execSync('pnpm list --depth=0 --json', {
      encoding: 'utf-8',
      stdio: 'pipe',
    });

    const workspace = JSON.parse(output);
    if (workspace && Array.isArray(workspace)) {
      return workspace
        .filter((pkg: { name?: string }) => pkg.name)
        .map((pkg: { name: string }) => pkg.name);
    }

    // Fallback: look for package.json in packages/
    const packagesDir = path.join(process.cwd(), 'packages');
    const fs = await import('fs-extra');
    if (await fs.pathExists(packagesDir)) {
      const entries = await fs.readdir(packagesDir, { withFileTypes: true });
      return entries.filter(dirent => dirent.isDirectory()).map(dirent => dirent.name);
    }

    return [];
  } catch {
    return [];
  }
}

function parseTypeScriptErrors(output: string): BuildError[] {
  const errors: BuildError[] = [];

  // TypeScript error format: file(line,col): error TS####: message
  const errorRegex = /(.+?)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.+)/g;

  let match;
  while ((match = errorRegex.exec(output)) !== null) {
    errors.push({
      file: match[1].trim(),
      line: parseInt(match[2], 10),
      column: parseInt(match[3], 10),
      message: match[5].trim(),
      code: match[4],
    });
  }

  return errors;
}
