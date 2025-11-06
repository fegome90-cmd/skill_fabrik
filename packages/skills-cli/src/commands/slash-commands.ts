/**
 * Slash Commands CLI Integration
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { Logger } from '../core/logger.js';

let slashCommandSystem: any = null;

async function loadSlashCommandSystem() {
  if (!slashCommandSystem) {
    try {
      // Try to load the full slash commands system (workspace mode)
      slashCommandSystem = await import('@skills-fabrik/slash-commands');
    } catch (error) {
      try {
        // Fallback to standalone system (global mode)
        slashCommandSystem = await import('../standalone-slash-commands.js');
        console.log('🌐 Using standalone slash commands (global mode)');
      } catch (standaloneError) {
        throw new Error('Slash commands system not available. Please install @skills-fabrik/skills-cli with proper dependencies.');
      }
    }
  }
  return slashCommandSystem;
}

export function slashCommandCommand(program: Command) {
  program
    .command('/')
    .description('Execute slash commands for persistent context and automation')
    .argument('<command>', 'Slash command to execute (e.g., dev-docs, build-and-fix)')
    .allowUnknownOption(true) // Pass through to slash command handlers
    .option('-f, --format <format>', 'Output format (json, markdown, text)', 'text')
    .option('-v, --verbose', 'Verbose output')
    .option('--dry-run', 'Show what would be executed without running')
    .action(async (commandName: string, options, commandObj) => {
      try {
        const system = await loadSlashCommandSystem();

        // Reconstruct the full command string from remaining arguments
        const fullCommand = `/${commandName} ${commandObj.args.join(' ')}`;

        // Check if we're using standalone or full system
        const isStandalone = system.executeStandaloneSlashCommand ? true : false;

        let result: any;
        let duration: number;

        if (isStandalone) {
          // Standalone execution
          Logger.info(`⚡ Executing standalone slash command: /${fullCommand.slice(1)}`);
          const startTime = Date.now();
          result = await system.executeStandaloneSlashCommand(fullCommand);
          duration = Date.now() - startTime;
        } else {
          // Full system execution
          const parsedCommand = system.SlashCommandParser.parse(fullCommand);
          if (!parsedCommand) {
            Logger.error(`Invalid slash command: ${fullCommand}`);
            process.exit(1);
          }

          // Check for help flags
          const { showHelp, showExamples } = system.SlashCommandParser.extractHelpFlags(parsedCommand);

          if (showHelp || showExamples) {
            await showCommandHelp(system, parsedCommand.command, { showExamples, verbose: options.verbose });
            return;
          }

          // Get command registry
          const registry = system.SlashCommandRegistryManager.getInstance();
          const commandDefinition = registry.getCommand(parsedCommand.command);

          if (!commandDefinition) {
            Logger.error(`Unknown slash command: /${parsedCommand.command}`);
            await listAvailableCommands(registry);
            process.exit(1);
          }

          // Show command info in dry run mode
          if (options.dryRun) {
            Logger.info(`🔍 Dry run: Would execute /${parsedCommand.command}`);
            Logger.info(`Description: ${commandDefinition.description}`);
            Logger.info(`Category: ${commandDefinition.category}`);
            Logger.info(`Arguments: ${parsedCommand.args.join(', ') || 'none'}`);
            Logger.info(`Flags: ${JSON.stringify(parsedCommand.flags)}`);
            Logger.info(`Options: ${JSON.stringify(parsedCommand.options)}`);
            return;
          }

          // Execute the command
          Logger.info(`⚡ Executing slash command: /${parsedCommand.command}`);

          const startTime = Date.now();
          result = await executeSlashCommand(system, parsedCommand, commandDefinition);
          duration = Date.now() - startTime;
        }

        // Display results
        if (result.success) {
          Logger.success(`✅ Command completed successfully (${duration}ms)`);

          if (result.output) {
            console.log(formatOutput(result.output, options.format));
          }

          if (result.nextActions && result.nextActions.length > 0) {
            Logger.info('\n📋 Suggested next actions:');
            result.nextActions.forEach((action: string, index: number) => {
              console.log(`  ${index + 1}. ${action}`);
            });
          }

          if (options.verbose && result.context) {
            Logger.info(`\n🔗 Context: ${result.context.sessionId}`);
            Logger.info(`📊 Execution time: ${result.metadata?.executionTimeMs}ms`);
            Logger.info(`🔧 Integration: ${result.metadata?.integrationType}`);
          }
        } else {
          Logger.error(`❌ Command failed: ${result.error?.message || 'Unknown error'}`);

          if (result.error?.suggestions && result.error.suggestions.length > 0) {
            Logger.info('\n💡 Suggestions:');
            result.error.suggestions.forEach((suggestion: string) => {
              console.log(`  • ${suggestion}`);
            });
          }

          if (options.verbose && result.error?.details) {
            Logger.info('\n🔍 Error details:');
            console.log(JSON.stringify(result.error.details, null, 2));
          }

          process.exit(1);
        }

      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        Logger.error(`Failed to execute slash command: ${err.message}`);

        if (options.verbose && err.stack) {
          Logger.info('\nStack trace:');
          console.log(err.stack);
        }

        process.exit(1);
      }
    });

  // Add help subcommand
  program
    .command('slash')
    .description('Manage slash commands')
    .argument('[action]', 'Action: list, stats, validate')
    .option('--category <category>', 'Filter by category')
    .action(async (action = 'list', options) => {
      try {
        const system = await loadSlashCommandSystem();
        const isStandalone = system.executeStandaloneSlashCommand ? true : false;

        if (isStandalone) {
          // Standalone system handling
          const registry = system.StandaloneSlashCommandRegistry.getInstance();

          switch (action) {
            case 'list':
              await listStandaloneCommands(registry, options.category);
              break;
            case 'stats':
              await showStandaloneStats(registry);
              break;
            case 'validate':
              Logger.success('✅ Standalone registry validation passed');
              break;
            default:
              Logger.error(`Unknown action: ${action}`);
              Logger.info('Available actions: list, stats, validate');
              process.exit(1);
          }
        } else {
          // Full system handling
          const registry = system.SlashCommandRegistryManager.getInstance();

          switch (action) {
            case 'list':
              await listAvailableCommands(registry, options.category);
              break;
            case 'stats':
              await showRegistryStats(registry);
              break;
            case 'validate':
              await validateRegistry(registry);
              break;
            default:
              Logger.error(`Unknown action: ${action}`);
              Logger.info('Available actions: list, stats, validate');
              process.exit(1);
          }
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        Logger.error(`Failed to ${action} slash commands: ${err.message}`);
        process.exit(1);
      }
    });
}

async function executeSlashCommand(
  system: any,
  parsedCommand: any,
  commandDefinition: any
): Promise<any> {
  // Create appropriate handler based on command
  const HandlerClass = getHandlerClass(system, commandDefinition.handler);
  const handler = new HandlerClass(commandDefinition);

  return await handler.execute(parsedCommand);
}

function getHandlerClass(system: any, handlerName: string): any {
  // Map handler names to handler classes
  const handlerMap: Record<string, string> = {
    'dev-docs.ts': 'DevDocsHandler',
    'create-dev-docs.ts': 'CreateDevDocsHandler',
    'dev-docs-update.ts': 'DevDocsUpdateHandler',
    'build-and-fix.ts': 'BuildAndFixHandler',
    'code-review.ts': 'CodeReviewHandler',
    'route-research-for-testing.ts': 'RouteResearchHandler',
    'test-route.ts': 'TestRouteHandler',
    'compact.ts': 'CompactHandler',
    'undo.ts': 'UndoHandler',
    'plugin.ts': 'PluginHandler',
  };

  const className = handlerMap[handlerName];
  if (!className) {
    throw new Error(`Unknown handler: ${handlerName}`);
  }

  // Get handler class from the handlers index
  const handlers = system.handlers || {};
  const HandlerClass = handlers[className];

  if (!HandlerClass) {
    throw new Error(`Handler class not found: ${className}`);
  }

  return HandlerClass;
}

async function showCommandHelp(
  system: any,
  commandName: string,
  options: { showExamples: boolean; verbose: boolean }
) {
  const registry = system.SlashCommandRegistryManager.getInstance();
  const command = registry.getCommand(commandName);

  if (!command) {
    Logger.error(`Unknown command: /${commandName}`);
    await listAvailableCommands(registry);
    return;
  }

  console.log(chalk.bold(`\n/${commandName}`));
  console.log(`${command.description}\n`);

  console.log(chalk.yellow('Category:'), command.category);
  console.log(chalk.yellow('Requires Auth:'), command.requiresAuth ? 'Yes' : 'No');
  console.log(chalk.yellow('Persistence:'), command.persistenceLevel);

  if (command.aliases && command.aliases.length > 0) {
    console.log(chalk.yellow('Aliases:'), command.aliases.map(a => `/${a}`).join(', '));
  }

  if (command.examples && command.examples.length > 0) {
    console.log(chalk.yellow('\nExamples:'));
    command.examples.forEach(example => {
      console.log(`  ${chalk.cyan(example)}`);
    });
  }

  if (options.showExamples && command.integration) {
    console.log(chalk.yellow('\nIntegration:'));
    if (command.integration.skillId) {
      console.log(`  Skill: ${command.integration.skillId}`);
    }
    if (command.integration.daemonEndpoint) {
      console.log(`  Daemon: ${command.integration.daemonEndpoint}`);
    }
    if (command.integration.cliCommand) {
      console.log(`  CLI: ${command.integration.cliCommand}`);
    }
  }

  if (options.verbose) {
    console.log(chalk.yellow('\nHandler:'), command.handler);
    console.log(chalk.yellow('MemTech L1:'), command.integration?.memTechL1 ? 'Yes' : 'No');
  }
}

async function listAvailableCommands(registry: any, categoryFilter?: string) {
  const commands = categoryFilter
    ? registry.getCommandsByCategory(categoryFilter as any)
    : registry.getAllCommands();

  if (commands.length === 0) {
    if (categoryFilter) {
      Logger.info(`No commands found in category: ${categoryFilter}`);
    } else {
      Logger.info('No slash commands available');
    }
    return;
  }

  console.log(chalk.bold('\n📚 Available Slash Commands\n'));

  const categories = registry.getCategories();
  for (const cat of categories) {
    const catCommands = commands.filter(c => c.category === cat);
    if (catCommands.length === 0) continue;

    console.log(chalk.underline(`${cat.charAt(0).toUpperCase() + cat.slice(1)} Commands:`));

    catCommands.forEach(command => {
      const aliases = command.aliases && command.aliases.length > 0
        ? ` (${command.aliases.map(a => `/${a}`).join(', ')})`
        : '';

      console.log(`  ${chalk.cyan(`/${command.name}`)}${aliases}`);
      console.log(`    ${command.description}`);

      if (command.requiresAuth) {
        console.log(`    ${chalk.yellow('🔒 Requires authentication')}`);
      }

      if (command.examples && command.examples.length > 0) {
        console.log(`    Example: ${chalk.gray(command.examples[0])}`);
      }

      console.log('');
    });
  }

  console.log(chalk.gray('Use "skills-cli / <command> --help" for detailed help on any command.'));
}

async function showRegistryStats(registry: any) {
  const stats = registry.getStats();
  const contextStats = await registry.getContextManager().getStats();

  console.log(chalk.bold('\n📊 Slash Commands Registry Statistics\n'));

  console.log(chalk.yellow('Commands:'));
  console.log(`  Total: ${stats.totalCommands}`);
  console.log(`  Requiring Auth: ${stats.commandsRequiringAuth}`);

  console.log(chalk.yellow('\nBy Category:'));
  for (const [category, count] of Object.entries(stats.commandsByCategory)) {
    console.log(`  ${category}: ${count}`);
  }

  console.log(chalk.yellow('\nPersistence Levels:'));
  for (const [level, count] of Object.entries(stats.persistenceLevelDistribution)) {
    console.log(`  ${level}: ${count}`);
  }

  console.log(chalk.yellow('\nAliases:'));
  console.log(`  Total: ${stats.totalAliases}`);

  console.log(chalk.yellow('\nContexts:'));
  console.log(`  Total: ${contextStats.totalContexts}`);
  console.log(`  Active: ${contextStats.activeContexts}`);
  console.log(`  Expired: ${contextStats.expiredContexts}`);
  console.log(`  Average Size: ${Math.round(contextStats.averageContextSize)} bytes`);

  if (contextStats.oldestContext) {
    console.log(`  Oldest: ${contextStats.oldestContext.toLocaleDateString()}`);
  }
  if (contextStats.newestContext) {
    console.log(`  Newest: ${contextStats.newestContext.toLocaleDateString()}`);
  }
}

async function validateRegistry(registry: any) {
  const validation = registry.validateRegistry();

  if (validation.valid) {
    Logger.success('✅ Registry validation passed');
  } else {
    Logger.error('❌ Registry validation failed:');
    validation.errors.forEach(error => {
      console.log(`  • ${error}`);
    });
  }
}

function formatOutput(output: string, format: string): string {
  switch (format) {
    case 'json':
      try {
        return JSON.stringify(JSON.parse(output), null, 2);
      } catch {
        return JSON.stringify({ output }, null, 2);
      }
    case 'markdown':
      return `\n${output}\n`;
    default:
      return output;
  }
}

// Standalone system functions
async function listStandaloneCommands(registry: any, categoryFilter?: string) {
  const commands = categoryFilter
    ? registry.getCommandsByCategory(categoryFilter)
    : registry.getAllCommands();

  if (commands.length === 0) {
    if (categoryFilter) {
      Logger.info(`No commands found in category: ${categoryFilter}`);
    } else {
      Logger.info('No slash commands available');
    }
    return;
  }

  console.log(chalk.bold('\n📚 Available Slash Commands (Standalone Mode)\n'));

  const categories = registry.getCategories();
  for (const cat of categories) {
    const catCommands = commands.filter(c => c.category === cat);
    if (catCommands.length === 0) continue;

    console.log(chalk.underline(`${cat.charAt(0).toUpperCase() + cat.slice(1)} Commands:`));

    catCommands.forEach(command => {
      const aliases = command.aliases && command.aliases.length > 0
        ? ` (${command.aliases.map(a => `/${a}`).join(', ')})`
        : '';

      console.log(`  ${chalk.cyan(`/${command.name}`)}${aliases}`);
      console.log(`    ${command.description}`);

      if (command.examples && command.examples.length > 0) {
        console.log(`    Example: ${chalk.gray(command.examples[0])}`);
      }

      console.log('');
    });
  }

  console.log(chalk.gray('Use "skills-cli / <command> --help" for detailed help on any command.'));
  console.log(chalk.blue('🌐 Running in standalone mode - full workspace features available when in Skills Fabric repository.'));
}

async function showStandaloneStats(registry: any) {
  const commands = registry.getAllCommands();
  const categories = registry.getCategories();

  console.log(chalk.bold('\n📊 Standalone Slash Commands Statistics\n'));

  console.log(chalk.yellow('Commands:'));
  console.log(`  Total: ${commands.length}`);

  console.log(chalk.yellow('\nBy Category:'));
  const categoryCounts = categories.reduce((acc: Record<string, number>, cat: string) => {
    acc[cat] = registry.getCommandsByCategory(cat).length;
    return acc;
  }, {});

  for (const [category, count] of Object.entries(categoryCounts)) {
    console.log(`  ${category}: ${count}`);
  }

  console.log(chalk.blue('\n🌐 Standalone Mode: Running globally without workspace dependencies'));
  console.log(chalk.gray('Note: Full features available when used within Skills Fabric repository'));
}