import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs-extra';
import * as path from 'path';
import { Logger } from '../utils/logger.js';
import type { Plan } from '../types/plan.js';
import {
  generatePlanMarkdown,
  generateContextMarkdown,
  generateTasksMarkdown,
} from '../utils/plan-generator.js';

const { ensureDir, writeFile, readdir, pathExists, readFile, readJson, writeJson } = fs;

interface DevDocTask {
  name: string;
  created: string;
  updated: string;
  status: 'active' | 'completed' | 'archived';
  plan?: string;
  planId?: string;
  planPath?: string;
  context?: string;
  tasks?: string[];
}

export function devDocsCommand(program: Command) {
  const devDocsCmd = program
    .command('dev-docs')
    .description('Manage dev docs (create/update/list)');

  devDocsCmd
    .command('create')
    .description('Create dev docs from approved plan')
    .argument('<task-name>', 'Task name')
    .option('--plan <file>', 'Path to approved plan file')
    .option('-v, --verbose', 'Verbose output')
    .action(async (taskName: string, options: { plan?: string; verbose?: boolean }) => {
      const logger = new Logger(options.verbose);

      try {
        logger.info(`Creating dev docs for: ${taskName}`);

        // Dev docs directory structure: dev/active/<task-name>/
        const devDocsBase = path.join(process.cwd(), 'dev', 'active');
        const taskDir = path.join(devDocsBase, taskName);

        // Check if task already exists
        if (await pathExists(taskDir)) {
          logger.warning(`Task directory already exists: ${taskName}`);
          logger.info('Use "dev-docs update" to update existing task');
          process.exit(2);
        }

        await ensureDir(taskDir);
        logger.debug(`Created directory: ${taskDir}`);

        // Create task metadata
        const taskMetadata: DevDocTask = {
          name: taskName,
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          status: 'active',
        };

        // If plan file provided, copy it
        if (options.plan) {
          const planPath = path.resolve(options.plan);
          if (await pathExists(planPath)) {
            const planContent = await readFile(planPath, { encoding: 'utf-8' });
            await writeFile(path.join(taskDir, 'plan.md'), planContent);
            taskMetadata.plan = path.join(taskDir, 'plan.md');
            logger.success(`Plan copied from: ${options.plan}`);
          } else {
            logger.warning(`Plan file not found: ${planPath}`);
          }
        }

        // Create initial context file
        const contextTemplate = `# Context: ${taskName}

## Overview
<!-- Add task overview here -->

## Relevant Files
<!-- List relevant files and their purposes -->

## Dependencies
<!-- List dependencies and relationships -->

## Constraints
<!-- Any constraints or limitations -->
`;
        await writeFile(path.join(taskDir, 'context.md'), contextTemplate);
        taskMetadata.context = path.join(taskDir, 'context.md');
        logger.debug('Created context.md template');

        // Create tasks checklist
        const tasksTemplate = `# Tasks: ${taskName}

## TODO
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

## In Progress
<!-- Tasks currently being worked on -->

## Completed
<!-- Completed tasks -->
`;
        await writeFile(path.join(taskDir, 'tasks.md'), tasksTemplate);
        taskMetadata.tasks = [path.join(taskDir, 'tasks.md')];
        logger.debug('Created tasks.md template');

        // Save metadata
        await writeJson(path.join(taskDir, 'task.json'), taskMetadata, { spaces: 2 });
        logger.success(`Task metadata saved`);

        logger.success(`\n✅ Dev docs created for: ${taskName}`);
        logger.info(`Location: ${taskDir}`);

        process.exit(0);
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(2);
      }
    });

  devDocsCmd
    .command('update')
    .description('Update dev docs before compaction')
    .option('--task <name>', 'Update specific task only')
    .option('-v, --verbose', 'Verbose output')
    .action(async (options: { task?: string; verbose?: boolean }) => {
      const logger = new Logger(options.verbose);

      try {
        logger.info('Updating dev docs...');

        const devDocsBase = path.join(process.cwd(), 'dev', 'active');

        if (!(await pathExists(devDocsBase))) {
          logger.warning('No dev docs directory found');
          process.exit(0);
        }

        const tasks = options.task
          ? [options.task]
          : (await readdir(devDocsBase, { withFileTypes: true }))
              .filter(dirent => dirent.isDirectory())
              .map(dirent => dirent.name);

        if (tasks.length === 0) {
          logger.info('No active tasks found');
          process.exit(0);
        }

        logger.info(`Updating ${tasks.length} task(s)`);

        for (const taskName of tasks) {
          const taskDir = path.join(devDocsBase, taskName);
          const taskJsonPath = path.join(taskDir, 'task.json');

          if (!(await pathExists(taskJsonPath))) {
            logger.warning(`Task metadata not found: ${taskName}`);
            continue;
          }

          const taskMetadata = (await readJson(taskJsonPath)) as DevDocTask;
          taskMetadata.updated = new Date().toISOString();

          // If plan is linked, regenerate triada
          if (taskMetadata.planPath && (await pathExists(taskMetadata.planPath))) {
            try {
              const plan = (await readJson(taskMetadata.planPath)) as Plan;

              // Regenerate plan.md, context.md, tasks.md
              await generatePlanMarkdown(plan, path.join(taskDir, 'plan.md'));
              await generateContextMarkdown(taskName, plan, path.join(taskDir, 'context.md'));
              await generateTasksMarkdown(taskName, plan, path.join(taskDir, 'tasks.md'));

              logger.debug(`Regenerated triada for: ${taskName}`);
            } catch (error) {
              logger.warning(`Failed to regenerate triada for ${taskName}: ${error}`);
            }
          }

          await writeJson(taskJsonPath, taskMetadata, { spaces: 2 });
          logger.debug(`Updated: ${taskName}`);
        }

        logger.success(`✅ Updated ${tasks.length} task(s)`);

        process.exit(0);
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(2);
      }
    });

  devDocsCmd
    .command('list')
    .description('List active tasks')
    .option('-v, --verbose', 'Verbose output')
    .option('--status <status>', 'Filter by status (active/completed/archived)')
    .action(async (options: { verbose?: boolean; status?: string }) => {
      const logger = new Logger(options.verbose);

      try {
        logger.info('Listing active tasks...');

        const devDocsBase = path.join(process.cwd(), 'dev', 'active');

        if (!(await pathExists(devDocsBase))) {
          logger.info('No dev docs directory found');
          process.exit(0);
        }

        const taskDirs = (await readdir(devDocsBase, { withFileTypes: true }))
          .filter(dirent => dirent.isDirectory())
          .map(dirent => dirent.name);

        if (taskDirs.length === 0) {
          logger.info('No tasks found');
          process.exit(0);
        }

        const tasks: DevDocTask[] = [];

        for (const taskName of taskDirs) {
          const taskJsonPath = path.join(devDocsBase, taskName, 'task.json');

          if (await pathExists(taskJsonPath)) {
            const taskMetadata = (await readJson(taskJsonPath)) as DevDocTask;

            // Filter by status if specified
            if (!options.status || taskMetadata.status === options.status) {
              tasks.push(taskMetadata);
            }
          } else {
            // If no metadata, create basic entry
            tasks.push({
              name: taskName,
              created: 'unknown',
              updated: 'unknown',
              status: 'active',
            });
          }
        }

        // Sort by updated date (most recent first)
        tasks.sort((a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime());

        // Display tasks
        console.log(chalk.blue(`\nFound ${tasks.length} task(s)\n`));

        for (const task of tasks) {
          const statusColor =
            task.status === 'active'
              ? chalk.green
              : task.status === 'completed'
                ? chalk.blue
                : chalk.gray;

          console.log(`${statusColor(`[${task.status.toUpperCase()}]`)} ${chalk.bold(task.name)}`);
          console.log(`  Created: ${new Date(task.created).toLocaleDateString()}`);
          console.log(`  Updated: ${new Date(task.updated).toLocaleDateString()}`);

          if (options.verbose && task.plan) {
            console.log(`  Plan: ${task.plan}`);
          }
          console.log('');
        }

        process.exit(0);
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(2);
      }
    });
}
