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
import { pm2Command } from './commands/pm2.js';

const program = new Command();

program
  .name('skills-cli')
  .description('CLI for managing skills, CLOOP workflows, hooks, builds, CI and dev docs')
  .version('0.1.0');

// Register commands
cloopCommand(program);
skillsCommand(program);
hooksCommand(program);
guardrailCommand(program);
buildCommand(program);
ciCommand(program);
devDocsCommand(program);
planCommand(program);
pm2Command(program);

program.parse();
