/**
 * Slash Command Registry
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

// Helper to get directory name
const __dirname = dirname(new URL(import.meta.url).pathname);

import {
  SlashCommand,
  SlashCommandRegistry,
  CommandCategory,
  PersistenceLevel,
} from './types.js';

// Import handler classes
import { BuildAndFixHandler } from './handlers/build-and-fix.js';
import { CodeReviewHandler } from './handlers/code-review.js';
import { CompactHandler } from './handlers/compact.js';
import { UndoHandler } from './handlers/undo.js';
import { DevDocsUpdateHandler } from './handlers/dev-docs-update.js';
import { RouteResearchForTestingHandler } from './handlers/route-research-for-testing.js';
import { TestRouteHandler } from './handlers/test-route.js';
import { PluginHandler } from './handlers/plugin.js';
import { KPIAdvancedCommand } from './commands/kpi-advanced.js';

export class SlashCommandRegistryManager {
  private static instance: SlashCommandRegistryManager;
  private registry: SlashCommandRegistry;
  private registryPath: string;

  constructor(registryPath?: string) {
    this.registryPath = registryPath || this.getDefaultRegistryPath();
    this.registry = this.loadRegistry();
    this.initializeDefaultHandlers();
  }

  static getInstance(registryPath?: string): SlashCommandRegistryManager {
    if (!SlashCommandRegistryManager.instance) {
      SlashCommandRegistryManager.instance = new SlashCommandRegistryManager(registryPath);
    }
    return SlashCommandRegistryManager.instance;
  }

  private getDefaultRegistryPath(): string {
    return join(__dirname, '..', '..', 'configs', 'slash-commands.json');
  }

  private loadRegistry(): SlashCommandRegistry {
    if (existsSync(this.registryPath)) {
      try {
        const data = readFileSync(this.registryPath, 'utf-8');
        return JSON.parse(data);
      } catch (error) {
        console.error('Failed to load slash command registry:', error);
        return this.createDefaultRegistry();
      }
    }
    return this.createDefaultRegistry();
  }

  private createDefaultRegistry(): SlashCommandRegistry {
    return {
      version: '1.0.0',
      commands: {},
      categories: {
        [CommandCategory.DEV_DOCS]: [],
        [CommandCategory.QUALITY]: [],
        [CommandCategory.TESTING]: [],
        [CommandCategory.UTILITIES]: [],
      },
      aliases: {},
    };
  }

  private saveRegistry(): void {
    try {
      const dir = dirname(this.registryPath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      writeFileSync(this.registryPath, JSON.stringify(this.registry, null, 2));
    } catch (error) {
      console.error('Failed to save slash command registry:', error);
      throw error;
    }
  }

  /**
   * Register a new slash command
   */
  registerCommand(command: SlashCommand): void {
    // Basic validation
    if (!command.name || !command.description || !command.category || !command.handler) {
      throw new Error('Invalid command definition: missing required fields');
    }

    // Check for conflicts
    if (this.registry.commands[command.name]) {
      throw new Error(`Command '${command.name}' already exists`);
    }

    // Check alias conflicts
    if (command.aliases) {
      for (const alias of command.aliases) {
        if (this.registry.aliases[alias]) {
          throw new Error(`Alias '${alias}' already exists for command '${this.registry.aliases[alias]}'`);
        }
      }
    }

    // Add command
    this.registry.commands[command.name] = command;
    this.registry.categories[command.category].push(command.name);

    // Add aliases
    if (command.aliases) {
      for (const alias of command.aliases) {
        this.registry.aliases[alias] = command.name;
      }
    }

    this.saveRegistry();
  }

  /**
   * Unregister a slash command
   */
  unregisterCommand(name: string): void {
    const command = this.registry.commands[name];
    if (!command) {
      throw new Error(`Command '${name}' not found`);
    }

    // Remove from categories
    const categoryIndex = this.registry.categories[command.category].indexOf(name);
    if (categoryIndex >= 0) {
      this.registry.categories[command.category].splice(categoryIndex, 1);
    }

    // Remove aliases
    if (command.aliases) {
      for (const alias of command.aliases) {
        delete this.registry.aliases[alias];
      }
    }

    // Remove command
    delete this.registry.commands[name];

    this.saveRegistry();
  }

  /**
   * Get a command by name or alias
   */
  getCommand(nameOrAlias: string): SlashCommand | null {
    // Check direct name
    if (this.registry.commands[nameOrAlias]) {
      return this.registry.commands[nameOrAlias];
    }

    // Check alias
    const actualName = this.registry.aliases[nameOrAlias];
    if (actualName && this.registry.commands[actualName]) {
      return this.registry.commands[actualName];
    }

    return null;
  }

  /**
   * Get all commands
   */
  getAllCommands(): SlashCommand[] {
    return Object.values(this.registry.commands);
  }

  /**
   * Get commands by category
   */
  getCommandsByCategory(category: CommandCategory): SlashCommand[] {
    return this.registry.categories[category]
      .map(name => this.registry.commands[name])
      .filter(Boolean);
  }

  /**
   * Get all categories
   */
  getCategories(): CommandCategory[] {
    return Object.values(CommandCategory);
  }

  /**
   * Search commands by name, description, or aliases
   */
  searchCommands(query: string): SlashCommand[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllCommands().filter(command =>
      command.name.toLowerCase().includes(lowerQuery) ||
      command.description.toLowerCase().includes(lowerQuery) ||
      command.aliases?.some(alias => alias.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Get command suggestions for autocomplete
   */
  getCommandSuggestions(partial: string): SlashCommand[] {
    const lowerPartial = partial.toLowerCase();
    return this.getAllCommands().filter(command =>
      command.name.toLowerCase().startsWith(lowerPartial) ||
      command.aliases?.some(alias => alias.toLowerCase().startsWith(lowerPartial))
    );
  }

  /**
   * Check if a command exists
   */
  hasCommand(nameOrAlias: string): boolean {
    return this.getCommand(nameOrAlias) !== null;
  }

  /**
   * Get registry statistics
   */
  getStats(): {
    totalCommands: number;
    commandsByCategory: Record<CommandCategory, number>;
    totalAliases: number;
    commandsRequiringAuth: number;
    persistenceLevelDistribution: Record<PersistenceLevel, number>;
  } {
    const commands = this.getAllCommands();
    const commandsByCategory = {} as Record<CommandCategory, number>;
    const persistenceLevelDistribution = {} as Record<PersistenceLevel, number>;

    // Initialize counters
    for (const category of this.getCategories()) {
      commandsByCategory[category] = 0;
    }
    for (const level of Object.values(PersistenceLevel)) {
      persistenceLevelDistribution[level] = 0;
    }

    // Count commands
    let totalAliases = 0;
    let commandsRequiringAuth = 0;

    for (const command of commands) {
      commandsByCategory[command.category]++;
      persistenceLevelDistribution[command.persistenceLevel]++;

      if (command.requiresAuth) {
        commandsRequiringAuth++;
      }

      if (command.aliases) {
        totalAliases += command.aliases.length;
      }
    }

    return {
      totalCommands: commands.length,
      commandsByCategory,
      totalAliases,
      commandsRequiringAuth,
      persistenceLevelDistribution,
    };
  }

  /**
   * Validate registry integrity
   */
  validateRegistry(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for orphaned category entries
    for (const [category, commandNames] of Object.entries(this.registry.categories)) {
      for (const name of commandNames) {
        if (!this.registry.commands[name]) {
          errors.push(`Orphaned command '${name}' in category '${category}'`);
        }
      }
    }

    // Check for orphaned aliases
    for (const [alias, commandName] of Object.entries(this.registry.aliases)) {
      if (!this.registry.commands[commandName]) {
        errors.push(`Alias '${alias}' points to non-existent command '${commandName}'`);
      }
    }

    // Check for missing category entries
    for (const [name, command] of Object.entries(this.registry.commands)) {
      if (!this.registry.categories[command.category].includes(name)) {
        errors.push(`Command '${name}' missing from category '${command.category}'`);
      }
    }

    // Check for duplicate aliases
    const aliasToCommand = new Map<string, string>();
    for (const [alias, commandName] of Object.entries(this.registry.aliases)) {
      if (aliasToCommand.has(alias) && aliasToCommand.get(alias) !== commandName) {
        errors.push(`Duplicate alias '${alias}' for commands '${aliasToCommand.get(alias)}' and '${commandName}'`);
      }
      aliasToCommand.set(alias, commandName);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Export registry to formatted string
   */
  exportRegistry(format: 'json' | 'markdown' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.registry, null, 2);
    }

    // Markdown format
    let output = '# Slash Commands Registry\n\n';
    output += `Version: ${this.registry.version}\n\n`;

    for (const category of this.getCategories()) {
      const commands = this.getCommandsByCategory(category);
      if (commands.length === 0) continue;

      output += `## ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n`;

      for (const command of commands) {
        output += `### /${command.name}\n\n`;
        output += `${command.description}\n\n`;

        if (command.aliases && command.aliases.length > 0) {
          output += `**Aliases:** ${command.aliases.map(a => `/${a}`).join(', ')}\n\n`;
        }

        if (command.examples && command.examples.length > 0) {
          output += '**Examples:**\n';
          for (const example of command.examples) {
            output += `- \`${example}\`\n`;
          }
          output += '\n';
        }

        output += `**Requires Auth:** ${command.requiresAuth ? 'Yes' : 'No'}\n`;
        output += `**Persistence:** ${command.persistenceLevel}\n\n`;
      }
    }

    return output;
  }

  /**
   * Reload registry from disk
   */
  reload(): void {
    this.registry = this.loadRegistry();
  }

  /**
   * Get raw registry data
   */
  getRawRegistry(): SlashCommandRegistry {
    return { ...this.registry };
  }

  /**
   * Initialize default handlers
   */
  initializeDefaultHandlers(): void {
    // Only initialize if registry is empty
    if (Object.keys(this.registry.commands).length > 0) {
      return;
    }

    try {
      // Initialize all default handlers
      const buildCommand = {
        name: 'build-and-fix',
        description: 'Build and fix code issues automatically',
        category: CommandCategory.QUALITY,
        handler: 'BuildAndFixHandler',
        requiresAuth: false,
        persistenceLevel: PersistenceLevel.SESSION,
        examples: ['/build-and-fix --fix', '/build-and-fix --verbose']
      };

      const codeReviewCommand = {
        name: 'code-review',
        description: 'Review code quality and security',
        category: CommandCategory.QUALITY,
        handler: 'CodeReviewHandler',
        requiresAuth: false,
        persistenceLevel: PersistenceLevel.SESSION,
        examples: ['/code-review', '/code-review --strict']
      };

      const compactCommand = {
        name: 'compact',
        description: 'Compact and optimize workspace',
        category: CommandCategory.UTILITIES,
        handler: 'CompactHandler',
        requiresAuth: false,
        persistenceLevel: PersistenceLevel.SESSION,
        examples: ['/compact', '/compact --verbose']
      };

      const undoCommand = {
        name: 'undo',
        description: 'Undo last command operation',
        category: CommandCategory.UTILITIES,
        handler: 'UndoHandler',
        requiresAuth: false,
        persistenceLevel: PersistenceLevel.SESSION,
        examples: ['/undo', '/undo --last']
      };

      const devDocsUpdateCommand = {
        name: 'dev-docs-update',
        description: 'Update development documentation',
        category: CommandCategory.DEV_DOCS,
        handler: 'DevDocsUpdateHandler',
        requiresAuth: false,
        persistenceLevel: PersistenceLevel.SESSION,
        examples: ['/dev-docs-update', '/dev-docs-update --force']
      };

      const routeResearchCommand = {
        name: 'route-research-for-testing',
        description: 'Research routes for testing',
        category: CommandCategory.TESTING,
        handler: 'RouteResearchForTestingHandler',
        requiresAuth: false,
        persistenceLevel: PersistenceLevel.SESSION,
        examples: ['/route-research-for-testing', '/route-research-for-testing --endpoint']
      };

      const testRouteCommand = {
        name: 'test-route',
        description: 'Test specific routes',
        category: CommandCategory.TESTING,
        handler: 'TestRouteHandler',
        requiresAuth: false,
        persistenceLevel: PersistenceLevel.SESSION,
        examples: ['/test-route', '/test-route --method GET']
      };

      const pluginCommand = {
        name: 'plugin',
        description: 'Manage system plugins',
        category: CommandCategory.UTILITIES,
        handler: 'PluginHandler',
        requiresAuth: false,
        persistenceLevel: PersistenceLevel.SESSION,
        examples: ['/plugin list', '/plugin install']
      };

      // Initialize handlers with command definitions
      const buildAndFixHandler = new BuildAndFixHandler(buildCommand);
      const codeReviewHandler = new CodeReviewHandler(codeReviewCommand);
      const compactHandler = new CompactHandler(compactCommand);
      const undoHandler = new UndoHandler(undoCommand);
      const devDocsUpdateHandler = new DevDocsUpdateHandler();
      const routeResearchHandler = new RouteResearchForTestingHandler(routeResearchCommand);
      const testRouteHandler = new TestRouteHandler(testRouteCommand);
      const pluginHandler = new PluginHandler(pluginCommand);
      const kpiAdvancedHandler = new KPIAdvancedCommand();

      // Create KPI command definition
      const kpiAdvancedCommand = {
        name: 'kpi-advanced',
        description: 'Advanced KPI analytics and reporting',
        category: CommandCategory.UTILITIES,
        handler: 'KPIAdvancedCommand',
        requiresAuth: false,
        persistenceLevel: PersistenceLevel.SESSION,
        examples: ['/kpi-advanced', '/kpi-advanced --detailed']
      };

      // Register all commands
      this.registerCommand(buildCommand);
      this.registerCommand(codeReviewCommand);
      this.registerCommand(compactCommand);
      this.registerCommand(undoCommand);
      this.registerCommand(devDocsUpdateCommand);
      this.registerCommand(routeResearchCommand);
      this.registerCommand(testRouteCommand);
      this.registerCommand(pluginCommand);
      this.registerCommand(kpiAdvancedCommand);

      console.log(`✅ Initialized ${Object.keys(this.registry.commands).length} default slash commands`);
    } catch (error) {
      console.error('❌ Failed to initialize default handlers:', error);
    }
  }
}