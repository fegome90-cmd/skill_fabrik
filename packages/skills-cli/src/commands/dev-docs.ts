import { Command } from 'commander';
import chalk from 'chalk';

export function devDocsCommand(program: Command) {
  const devDocsCmd = program
    .command('dev-docs')
    .description('Manage dev docs (create/update/list)');

  devDocsCmd
    .command('create')
    .description('Create dev docs from approved plan')
    .argument('<task-name>', 'Task name')
    .option('-v, --verbose', 'Verbose output')
    .action(async (taskName: string, _options: { verbose?: boolean }) => {
      console.log(chalk.blue(`Creating dev docs for: ${taskName}`));
      console.log(chalk.yellow('⚠️  Implementation pending - stub command'));
      // TODO: Implement dev-docs create functionality
      process.exit(0);
    });

  devDocsCmd
    .command('update')
    .description('Update dev docs before compaction')
    .option('-v, --verbose', 'Verbose output')
    .action(async (_options: { verbose?: boolean }) => {
      console.log(chalk.blue('Updating dev docs...'));
      console.log(chalk.yellow('⚠️  Implementation pending - stub command'));
      // TODO: Implement dev-docs update functionality
      process.exit(0);
    });

  devDocsCmd
    .command('list')
    .description('List active tasks')
    .option('-v, --verbose', 'Verbose output')
    .action(async (_options: { verbose?: boolean }) => {
      console.log(chalk.blue('Listing active tasks...'));
      console.log(chalk.yellow('⚠️  Implementation pending - stub command'));
      // TODO: Implement dev-docs list functionality
      process.exit(0);
    });
}
