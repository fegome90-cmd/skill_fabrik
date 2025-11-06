/**
 * Auto-register all slash commands
 */

import { SlashCommandRegistryManager } from './registry.js';
import {
  SlashCommand,
  CommandCategory,
  PersistenceLevel
} from './types.js';

export function registerAllCommands(): void {
  const registry = SlashCommandRegistryManager.getInstance();

  // Foundation Commands
  const buildAndFixCommand: SlashCommand = {
    name: 'build-and-fix',
    description: 'Auto-build, lint, and fix project issues',
    category: CommandCategory.QUALITY,
    handler: 'BuildAndFixHandler',
    requiresAuth: false,
    persistenceLevel: PersistenceLevel.SESSION,
    examples: [
      '/build-and-fix',
      '/build-and-fix --fix',
      '/build-and-fix --test',
      '/build-and-fix --verbose'
    ],
    aliases: ['bf', 'build-fix']
  };

  const codeReviewCommand: SlashCommand = {
    name: 'code-review',
    description: 'Perform comprehensive code review and analysis',
    category: CommandCategory.QUALITY,
    handler: 'CodeReviewHandler',
    requiresAuth: false,
    persistenceLevel: PersistenceLevel.SESSION,
    examples: [
      '/code-review',
      '/code-review . --strict',
      '/code-review src/ --verbose',
      '/code-review --fix-suggestions'
    ],
    aliases: ['cr', 'review']
  };

  const compactCommand: SlashCommand = {
    name: 'compact',
    description: 'Optimize workspace by cleaning cache and artifacts',
    category: CommandCategory.UTILITIES,
    handler: 'CompactHandler',
    requiresAuth: false,
    persistenceLevel: PersistenceLevel.NONE,
    examples: [
      '/compact',
      '/compact --aggressive',
      '/compact --dry-run',
      '/compact --backup'
    ],
    aliases: ['clean', 'cleanup']
  };

  const undoCommand: SlashCommand = {
    name: 'undo',
    description: 'Safely rollback recent changes',
    category: CommandCategory.UTILITIES,
    handler: 'UndoHandler',
    requiresAuth: false,
    persistenceLevel: PersistenceLevel.SESSION,
    examples: [
      '/undo',
      '/undo --last 1',
      '/undo --list',
      '/undo --confirm'
    ],
    aliases: ['rollback', 'revert']
  };

  // Intermediate Commands
  const devDocsUpdateCommand: SlashCommand = {
    name: 'dev-docs-update',
    description: 'Update existing development documentation',
    category: CommandCategory.DEV_DOCS,
    handler: 'DevDocsUpdateHandler',
    requiresAuth: false,
    persistenceLevel: PersistenceLevel.PERMANENT,
    examples: [
      '/dev-docs-update test --type status --status completed',
      '/dev-docs-update phase1 --append',
      '/dev-docs-update api --type progress --progress 75',
      '/dev-docs-update research --prepend --urgent'
    ],
    aliases: ['ddu', 'docs-update']
  };

  // Advanced Commands
  const routeResearchCommand: SlashCommand = {
    name: 'route-research-for-testing',
    description: 'Research routes and generate comprehensive testing strategies',
    category: CommandCategory.TESTING,
    handler: 'RouteResearchForTestingHandler',
    requiresAuth: false,
    persistenceLevel: PersistenceLevel.SESSION,
    examples: [
      '/route-research-for-testing api/users',
      '/route-research-for-testing auth/login --depth 5',
      '/route-research-for-testing orders --generate-tests',
      '/route-research-for-testing products --coverage --verbose'
    ],
    aliases: ['rrt', 'route-research']
  };

  const testRouteCommand: SlashCommand = {
    name: 'test-route',
    description: 'Execute comprehensive automated tests on specific routes',
    category: CommandCategory.TESTING,
    handler: 'TestRouteHandler',
    requiresAuth: false,
    persistenceLevel: PersistenceLevel.SESSION,
    examples: [
      '/test-route api/users',
      '/test-route auth/login --method POST',
      '/test-route orders --host http://localhost:8080 --coverage',
      '/test-route products --method POST --data \'{"name":"test"}\' --verbose'
    ],
    aliases: ['tr', 'route-test']
  };

  const pluginCommand: SlashCommand = {
    name: 'plugin',
    description: 'Manage plugin system operations (install, uninstall, configure, activate, deactivate)',
    category: CommandCategory.UTILITIES,
    handler: 'PluginHandler',
    requiresAuth: false,
    persistenceLevel: PersistenceLevel.PERMANENT,
    examples: [
      '/plugin install @skills-fabrik/analyzer',
      '/plugin uninstall @skills-fabrik/analyzer --force',
      '/plugin activate @skills-fabrik/analyzer',
      '/plugin configure @skills-fabrik/analyzer --config \'{"enabled": true}\'',
      '/plugin list',
      '/plugin status'
    ],
    aliases: ['plug', 'plugins']
  };

  // Register commands (only if not already registered)
  const commands = [
    buildAndFixCommand,
    codeReviewCommand,
    compactCommand,
    undoCommand,
    devDocsUpdateCommand,
    routeResearchCommand,
    testRouteCommand,
    pluginCommand
  ];

  for (const command of commands) {
    try {
      if (!registry.hasCommand(command.name)) {
        registry.registerCommand(command);
        console.log(`✅ Registered command: /${command.name}`);
      } else {
        console.log(`ℹ️  Command already registered: /${command.name}`);
      }
    } catch (error) {
      console.error(`❌ Failed to register command /${command.name}:`, error);
    }
  }

  // Validate registry
  const validation = registry.validateRegistry();
  if (validation.valid) {
    console.log('✅ Registry validation passed');
  } else {
    console.log('⚠️ Registry validation issues:');
    validation.errors.forEach(error => console.log(`   - ${error}`));
  }

  // Show stats
  const stats = registry.getStats();
  console.log(`📊 Registry Stats: ${stats.totalCommands} commands, ${stats.totalAliases} aliases`);
}

// Auto-register when imported
if (import.meta.url === `file://${process.argv[1]}`) {
  registerAllCommands();
}