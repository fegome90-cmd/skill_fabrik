#!/usr/bin/env node
import { Command } from 'commander';
import { cloopCommand } from './commands/cloop.js';
import { skillsCommand } from './commands/skills.js';
import { hooksCommand } from './commands/hooks.js';
import { guardrailCommand } from './commands/guardrail.js';
import { buildCommand } from './commands/build.js';
import { ciCommand } from './commands/ci.js';
import { devDocsCommand } from './commands/dev-docs.js';
import { planCommand } from './commands/plan.js';
import { activationCommand } from './commands/activation.js';
import { pm2Command } from './commands/pm2.js';
import { kpiCommand } from './commands/kpi.js';
import { daemonCommand } from './commands/daemon.js';
import { promptBuilderCommand } from './commands/prompt-builder.js';
import { dashboardCommand } from './commands/dashboard.js';
import { slashCommandCommand } from './commands/slash-commands.js';
import { preflightCheck } from './core/preflight.js';
import { initCloop } from './cli/commands/init.js';
import { memCLI } from './cli/commands/mem.js';
import { navCLI } from './cli/commands/nav.js';
import { CloopError } from './core/errors.js';
import { Logger } from './core/logger.js';
const program = new Command();
program
    .name('skills-cli')
    .description('CLI for managing skills, CLOOP workflows, hooks, builds, CI and dev docs')
    .version('0.1.0');
// Preflight check hook
program.hook('preAction', async () => {
    try {
        await preflightCheck();
    }
    catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        if (err.message.startsWith('E_')) {
            Logger.error(err.message);
            process.exit(1);
        }
    }
});
// Register existing commands
cloopCommand(program);
skillsCommand(program);
hooksCommand(program);
guardrailCommand(program);
buildCommand(program);
ciCommand(program);
devDocsCommand(program);
planCommand(program);
pm2Command(program);
kpiCommand(program);
daemonCommand(program);
promptBuilderCommand(program);
dashboardCommand(program);
activationCommand(program);
slashCommandCommand(program);
// Register new SAFE core commands
program
    .command('init')
    .description('Initialize CLOOP configuration')
    .argument('[subcommand]', 'Subcommand: cloop')
    .action(async (subcommand) => {
    if (subcommand === 'cloop') {
        try {
            await initCloop();
        }
        catch (error) {
            if (error instanceof CloopError) {
                Logger.error(`${error.userMessage}`);
                Logger.info(error.solution);
            }
            else {
                Logger.error(`Error: ${error}`);
            }
            process.exit(1);
        }
    }
    else {
        console.log('Usage: init cloop');
        process.exit(1);
    }
});
program
    .command('mem')
    .description('Memory system management')
    .action(async () => {
    try {
        await memCLI(process.argv);
    }
    catch (error) {
        if (error instanceof CloopError) {
            Logger.error(`${error.userMessage}`);
            Logger.info(error.solution);
        }
        else {
            Logger.error(`Error: ${error}`);
        }
        process.exit(1);
    }
});
program
    .command('nav')
    .description('Navigation system management')
    .action(async () => {
    try {
        await navCLI(process.argv);
    }
    catch (error) {
        if (error instanceof CloopError) {
            Logger.error(`${error.userMessage}`);
            Logger.info(error.solution);
        }
        else {
            Logger.error(`Error: ${error}`);
        }
        process.exit(1);
    }
});
// Error handling
program.configureOutput({
    writeErr: (str) => {
        Logger.error(str);
    }
});
program.parse();
//# sourceMappingURL=index.js.map