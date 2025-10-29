/**
 * Plan command: /plan, /plan-save, etc.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as path from 'path';
import fs from 'fs-extra';
import { Logger } from '../utils/logger.js';
import type { Plan } from '../types/plan.js';
import { validatePlan, validateStatusTransition } from '../utils/plan-validator.js';
import {
  createPlanFromTask,
  generatePlanMarkdown,
  generateContextMarkdown,
  generateTasksMarkdown,
} from '../utils/plan-generator.js';

const { ensureDir, pathExists, writeJson, readJson } = fs;

/**
 * Plans are stored in dev/plans/<plan-id>.json
 * Dev docs are in dev/active/<task-name>/
 */
const PLANS_DIR = 'dev/plans';
const ACTIVE_DIR = 'dev/active';

export function planCommand(program: Command) {
  const planCmd = program.command('plan').description('Manage plans: create, save, approve, list');

  // /plan "<tarea>" → crea plan y genera draft
  planCmd
    .command('create')
    .alias('new')
    .description('Create a new plan from task description')
    .argument('<task>', 'Task description')
    .option('--output <dir>', 'Output directory for plan', PLANS_DIR)
    .option('-v, --verbose', 'Verbose output')
    .action(async (task: string, options: { output?: string; verbose?: boolean }) => {
      const logger = new Logger(options.verbose);

      try {
        logger.info(`Creating plan for: "${task}"`);

        // Create plan from task
        const plan = createPlanFromTask(task);
        logger.debug(`Plan ID: ${plan.id}`);

        // Validate
        const validation = validatePlan(plan);
        if (!validation.valid) {
          logger.error('Plan validation failed:');
          validation.errors.forEach(err => logger.error(`  - ${err}`));
          process.exit(1);
        }

        if (validation.warnings.length > 0) {
          validation.warnings.forEach(warn => logger.warning(`  - ${warn}`));
        }

        // Save plan JSON
        const plansBase = path.resolve(options.output || PLANS_DIR);
        await ensureDir(plansBase);
        const planPath = path.join(plansBase, `${plan.id}.json`);
        await writeJson(planPath, plan, { spaces: 2 });
        logger.success(`Plan saved: ${planPath}`);

        // Generate plan.md
        const planMdPath = path.join(plansBase, `${plan.id}.md`);
        await generatePlanMarkdown(plan, planMdPath);
        logger.success(`Plan markdown: ${planMdPath}`);

        logger.success(`\n✅ Plan created: ${plan.id}`);
        logger.info(`Status: ${plan.status}`);
        logger.info(`\nNext steps:`);
        logger.info(`  1. Review and edit plan: ${planPath}`);
        logger.info(`  2. Save workflow: skills plan save ${plan.id}`);

        process.exit(0);
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  // /plan-save <plan-id> → guarda tríada + snapshot MemTech L1
  planCmd
    .command('save')
    .description('Save plan workflow: generate dev-docs triada + MemTech snapshot')
    .argument('<plan-id>', 'Plan ID to save')
    .option('--plans-dir <dir>', 'Plans directory', PLANS_DIR)
    .option('--task-name <name>', 'Task name (if different from plan.task)')
    .option('--approve', 'Approve plan automatically')
    .option('-v, --verbose', 'Verbose output')
    .action(
      async (
        planId: string,
        options: {
          plansDir?: string;
          taskName?: string;
          approve?: boolean;
          verbose?: boolean;
        }
      ) => {
        const logger = new Logger(options.verbose);

        try {
          logger.info(`Saving plan workflow: ${planId}`);

          // Load plan
          const plansBase = path.resolve(options.plansDir || PLANS_DIR);
          const planPath = path.join(plansBase, `${planId}.json`);

          if (!(await pathExists(planPath))) {
            logger.error(`Plan not found: ${planPath}`);
            process.exit(1);
          }

          const plan = (await readJson(planPath)) as Plan;

          // Validate plan
          const validation = validatePlan(plan);
          if (!validation.valid) {
            logger.error('Plan validation failed:');
            validation.errors.forEach(err => logger.error(`  - ${err}`));
            process.exit(1);
          }

          // Approve if requested
          if (options.approve) {
            if (plan.status !== 'APPROVED') {
              const transition = validateStatusTransition(plan.status, 'APPROVED');
              if (!transition.valid) {
                logger.error(`Cannot approve: ${transition.error}`);
                process.exit(1);
              }
              plan.status = 'APPROVED';
              plan.approvedBy = 'user'; // TODO: Get from environment
              plan.approvedAt = new Date().toISOString();
              plan.updated = new Date().toISOString();
              await writeJson(planPath, plan, { spaces: 2 });
              logger.success('Plan approved');
            }
          }

          // Check if approved
          if (plan.status !== 'APPROVED') {
            logger.warning(`Plan is not approved (status: ${plan.status})`);
            logger.info('Use --approve to approve automatically, or approve manually first');
            logger.info(`Plan location: ${planPath}`);
            process.exit(2);
          }

          // Generate dev-docs triada
          const taskName = options.taskName || plan.task.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          const activeBase = path.resolve(ACTIVE_DIR);
          const taskDir = path.join(activeBase, taskName);

          await ensureDir(taskDir);
          logger.debug(`Task directory: ${taskDir}`);

          // Generate plan.md, context.md, tasks.md
          await generatePlanMarkdown(plan, path.join(taskDir, 'plan.md'));
          logger.success('Generated plan.md');

          await generateContextMarkdown(taskName, plan, path.join(taskDir, 'context.md'));
          logger.success('Generated context.md');

          await generateTasksMarkdown(taskName, plan, path.join(taskDir, 'tasks.md'));
          logger.success('Generated tasks.md');

          // Save plan reference in task.json
          const taskMetadata = {
            name: taskName,
            planId: plan.id,
            planPath: planPath,
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            status: 'active' as const,
          };
          await writeJson(path.join(taskDir, 'task.json'), taskMetadata, { spaces: 2 });

          // TODO: MemTech L1 snapshot integration
          logger.info('MemTech L1 snapshot (TODO: integrate)');

          logger.success(`\n✅ Dev-docs triada created: ${taskDir}`);
          logger.info(`\nFiles:`);
          logger.info(`  - plan.md`);
          logger.info(`  - context.md`);
          logger.info(`  - tasks.md`);

          process.exit(0);
        } catch (error) {
          logger.error(error instanceof Error ? error.message : String(error));
          process.exit(1);
        }
      }
    );

  // List plans
  planCmd
    .command('list')
    .description('List all plans')
    .option('--plans-dir <dir>', 'Plans directory', PLANS_DIR)
    .option('--status <status>', 'Filter by status')
    .option('-v, --verbose', 'Verbose output')
    .action(async (options: { plansDir?: string; status?: string; verbose?: boolean }) => {
      const logger = new Logger(options.verbose);

      try {
        const plansBase = path.resolve(options.plansDir || PLANS_DIR);

        if (!(await pathExists(plansBase))) {
          logger.info('No plans directory found');
          process.exit(0);
        }

        // Read all .json files
        const files = await fs.readdir(plansBase);
        const planFiles = files.filter(f => f.endsWith('.json'));

        if (planFiles.length === 0) {
          logger.info('No plans found');
          process.exit(0);
        }

        const plans: Plan[] = [];
        for (const file of planFiles) {
          try {
            const plan = (await readJson(path.join(plansBase, file))) as Plan;
            if (!options.status || plan.status === options.status) {
              plans.push(plan);
            }
          } catch {
            // Skip invalid files
          }
        }

        // Sort by updated date
        plans.sort((a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime());

        console.log(chalk.blue(`\nFound ${plans.length} plan(s)\n`));

        for (const plan of plans) {
          const statusColor =
            plan.status === 'APPROVED'
              ? chalk.green
              : plan.status === 'COMPLETED'
                ? chalk.blue
                : plan.status === 'EXECUTING'
                  ? chalk.yellow
                  : chalk.gray;

          console.log(`${statusColor(`[${plan.status}]`)} ${chalk.bold(plan.id)}`);
          console.log(`  Task: ${plan.task.substring(0, 60)}${plan.task.length > 60 ? '...' : ''}`);
          console.log(`  Updated: ${new Date(plan.updated).toLocaleDateString()}`);
          if (plan.approvedBy) {
            console.log(`  Approved by: ${plan.approvedBy}`);
          }
          console.log('');
        }

        process.exit(0);
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  // Approve plan
  planCmd
    .command('approve')
    .description('Approve a plan')
    .argument('<plan-id>', 'Plan ID to approve')
    .option('--plans-dir <dir>', 'Plans directory', PLANS_DIR)
    .option('--by <name>', 'Approver name', 'user')
    .option('-v, --verbose', 'Verbose output')
    .action(
      async (planId: string, options: { plansDir?: string; by?: string; verbose?: boolean }) => {
        const logger = new Logger(options.verbose);

        try {
          const plansBase = path.resolve(options.plansDir || PLANS_DIR);
          const planPath = path.join(plansBase, `${planId}.json`);

          if (!(await pathExists(planPath))) {
            logger.error(`Plan not found: ${planPath}`);
            process.exit(1);
          }

          const plan = (await readJson(planPath)) as Plan;

          // Validate transition
          const transition = validateStatusTransition(plan.status, 'APPROVED');
          if (!transition.valid) {
            logger.error(`Cannot approve: ${transition.error}`);
            logger.info(`Current status: ${plan.status}`);
            process.exit(1);
          }

          // Update plan
          plan.status = 'APPROVED';
          plan.approvedBy = options.by;
          plan.approvedAt = new Date().toISOString();
          plan.updated = new Date().toISOString();

          // Validate updated plan
          const validation = validatePlan(plan);
          if (!validation.valid) {
            logger.error('Plan validation failed after approval:');
            validation.errors.forEach(err => logger.error(`  - ${err}`));
            process.exit(1);
          }

          await writeJson(planPath, plan, { spaces: 2 });
          logger.success(`✅ Plan approved: ${planId}`);

          // Regenerate plan.md
          const planMdPath = path.join(plansBase, `${planId}.md`);
          await generatePlanMarkdown(plan, planMdPath);
          logger.success('Plan markdown updated');

          process.exit(0);
        } catch (error) {
          logger.error(error instanceof Error ? error.message : String(error));
          process.exit(1);
        }
      }
    );
}
