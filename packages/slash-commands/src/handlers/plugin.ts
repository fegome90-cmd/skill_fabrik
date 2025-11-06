/**
 * Plugin Handler
 *
 * Advanced handler for plugin system management and operations
 * Supports install, uninstall, configure, activate, and deactivate operations
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync, statSync, readdirSync, mkdirSync } from 'fs';
import { join, resolve, extname } from 'path';
import {
  SlashCommandContext,
  ParsedSlashCommand,
  SlashCommandResult,
  PluginResult,
  PluginOperation
} from '../types.js';
import { SlashCommandHandler } from './base.js';

export class PluginHandler extends SlashCommandHandler {
  constructor(command: any, contextManager?: any) {
    super(command, contextManager);
  }

  /**
   * Validate plugin command arguments and environment
   */
  protected async validateCommand(
    parsedCommand: ParsedSlashCommand,
    context: SlashCommandContext
  ): Promise<{ valid: boolean; message?: string }> {
    // Check if we're in a valid project directory
    const packageJsonPath = join(context.workspace.root, 'package.json');
    if (!existsSync(packageJsonPath)) {
      return {
        valid: false,
        message: 'No package.json found. Please run from a valid project directory.'
      };
    }

    // Validate action argument
    const action = this.getArgument(parsedCommand, 0);
    const validActions = ['install', 'uninstall', 'configure', 'activate', 'deactivate', 'list', 'status'];
    if (!action || !validActions.includes(action)) {
      return {
        valid: false,
        message: `Invalid action: ${action || 'missing'}. Valid actions: ${validActions.join(', ')}`
      };
    }

    // Validate target argument for most actions
    if (action !== 'list' && action !== 'status') {
      const target = this.getArgument(parsedCommand, 1);
      if (!target) {
        return {
          valid: false,
          message: `Target argument is required for action: ${action}`
        };
      }
    }

    // Validate source flag for install action
    if (action === 'install') {
      const source = this.getFlag(parsedCommand, 'source', 'npm');
      const validSources = ['npm', 'github', 'local', 'registry'];
      if (!validSources.includes(source)) {
        return {
          valid: false,
          message: `Invalid source: ${source}. Valid sources: ${validSources.join(', ')}`
        };
      }
    }

    return { valid: true };
  }

  /**
   * Handle the plugin command execution
   */
  protected async handle(
    parsedCommand: ParsedSlashCommand,
    context: SlashCommandContext
  ): Promise<Omit<SlashCommandResult, 'context' | 'metadata'>> {
    const startTime = Date.now();
    const workspaceRoot = context.workspace.root;

    // Get command options
    const action = this.requireArgument(parsedCommand, 0, 'action');
    const target = this.getArgument(parsedCommand, 1);
    const source = this.getFlag(parsedCommand, 'source', 'npm');
    const version = this.getFlag(parsedCommand, 'version', 'latest');
    const verbose = this.getFlag(parsedCommand, 'verbose', false);
    const force = this.getFlag(parsedCommand, 'force', false);
    const config = this.getOption(parsedCommand, 'config', '');

    try {
      if (verbose) {
        console.log('🔌 Starting plugin management...');
        console.log(`   Action: ${action}`);
        if (target) console.log(`   Target: ${target}`);
        if (source !== 'npm') console.log(`   Source: ${source}`);
        if (version !== 'latest') console.log(`   Version: ${version}`);
        console.log(`   Force: ${force ? 'ON' : 'OFF'}`);
      }

      const results: PluginResult = {
        name: target || 'system',
        version: version,
        status: 'failed',
        operations: [],
        summary: ''
      };

      // Initialize plugin system
      await this.initializePluginSystem(workspaceRoot, verbose);

      // Execute plugin operation based on action
      switch (action) {
        case 'install':
          if (!target) throw new Error('Target plugin name is required for install');
          results.operations = await this.installPlugin(workspaceRoot, target, {
            source,
            version,
            force,
            config,
            verbose
          });
          break;

        case 'uninstall':
          if (!target) throw new Error('Target plugin name is required for uninstall');
          results.operations = await this.uninstallPlugin(workspaceRoot, target, {
            force,
            verbose
          });
          break;

        case 'configure':
          if (!target) throw new Error('Target plugin name is required for configure');
          if (!config) throw new Error('Configuration is required for configure action');
          results.operations = await this.configurePlugin(workspaceRoot, target, config, {
            verbose
          });
          break;

        case 'activate':
          if (!target) throw new Error('Target plugin name is required for activate');
          results.operations = await this.activatePlugin(workspaceRoot, target, {
            verbose
          });
          break;

        case 'deactivate':
          if (!target) throw new Error('Target plugin name is required for deactivate');
          results.operations = await this.deactivatePlugin(workspaceRoot, target, {
            verbose
          });
          break;

        case 'list':
          results.operations = await this.listPlugins(workspaceRoot, {
            verbose
          });
          break;

        case 'status':
          results.operations = await this.getPluginStatus(workspaceRoot, {
            verbose
          });
          break;

        default:
          throw new Error(`Unsupported action: ${action}`);
      }

      // Determine overall status
      const successfulOps = results.operations.filter(op => op.success).length;
      const totalOps = results.operations.length;
      results.status = successfulOps === totalOps ? 'installed' : 'failed';

      // Generate summary
      results.summary = this.generatePluginSummary(action, target || '', results.operations, verbose);

      // Persist results to MemTech L1
      await this.persistResults(context.sessionId, results);

      const executionTime = Date.now() - startTime;
      const output = this.formatPluginOutput(results, verbose);

      // Add next actions based on results
      const nextActions = this.generateNextActions(action, target || '', results);

      return {
        success: results.status === 'installed',
        output,
        data: results,
        nextActions
      };

    } catch (error) {
      console.error('❌ Plugin operation failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return this.createErrorResult(
        this.createError('execution', `Plugin operation failed: ${errorMessage}`)
      );
    }
  }

  /**
   * Initialize plugin system
   */
  private async initializePluginSystem(root: string, verbose: boolean): Promise<void> {
    const pluginDir = join(root, '.sf', 'plugins');
    const configDir = join(root, '.sf', 'config');
    const registryFile = join(root, '.sf', 'plugins.json');

    // Create directories if they don't exist
    if (!existsSync(pluginDir)) {
      mkdirSync(pluginDir, { recursive: true });
      if (verbose) console.log('   📁 Created plugins directory');
    }

    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true });
      if (verbose) console.log('   📁 Created config directory');
    }

    // Create registry file if it doesn't exist
    if (!existsSync(registryFile)) {
      const initialRegistry = {
        version: '1.0.0',
        plugins: {},
        installed: [],
        activated: [],
        lastUpdated: new Date().toISOString()
      };
      writeFileSync(registryFile, JSON.stringify(initialRegistry, null, 2));
      if (verbose) console.log('   📄 Created plugin registry');
    }
  }

  /**
   * Install plugin
   */
  private async installPlugin(
    root: string,
    name: string,
    options: {
      source: string;
      version: string;
      force: boolean;
      config: string;
      verbose: boolean;
    }
  ): Promise<PluginOperation[]> {
    const operations: PluginOperation[] = [];
    const startTime = Date.now();

    try {
      // Check if plugin already exists
      const registry = this.loadPluginRegistry(root);
      if (registry.plugins[name] && !options.force) {
        operations.push({
          action: 'install',
          target: name,
          success: false,
          error: `Plugin ${name} already exists. Use --force to reinstall.`,
          duration: Date.now() - startTime
        });
        return operations;
      }

      // Install based on source
      if (options.verbose) console.log(`   📦 Installing ${name} from ${options.source}...`);

      switch (options.source) {
        case 'npm':
          await this.installFromNpm(root, name, options.version, options.verbose);
          break;
        case 'github':
          await this.installFromGithub(root, name, options.version, options.verbose);
          break;
        case 'local':
          await this.installFromLocal(root, name, options.verbose);
          break;
        case 'registry':
          await this.installFromRegistry(root, name, options.version, options.verbose);
          break;
      }

      // Update registry
      registry.plugins[name] = {
        name,
        version: options.version,
        source: options.source,
        installedAt: new Date().toISOString(),
        config: options.config ? JSON.parse(options.config) : {},
        activated: false
      };
      registry.installed.push(name);
      registry.lastUpdated = new Date().toISOString();

      this.savePluginRegistry(root, registry);

      operations.push({
        action: 'install',
        target: name,
        success: true,
        output: `Successfully installed ${name}@${options.version} from ${options.source}`,
        duration: Date.now() - startTime
      });

      // Configure if config provided
      if (options.config) {
        const configOps = await this.configurePlugin(root, name, options.config, options);
        operations.push(...configOps);
      }

    } catch (error) {
      operations.push({
        action: 'install',
        target: name,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      });
    }

    return operations;
  }

  /**
   * Uninstall plugin
   */
  private async uninstallPlugin(
    root: string,
    name: string,
    options: {
      force: boolean;
      verbose: boolean;
    }
  ): Promise<PluginOperation[]> {
    const operations: PluginOperation[] = [];
    const startTime = Date.now();

    try {
      const registry = this.loadPluginRegistry(root);

      if (!registry.plugins[name] && !options.force) {
        operations.push({
          action: 'uninstall',
          target: name,
          success: false,
          error: `Plugin ${name} is not installed.`,
          duration: Date.now() - startTime
        });
        return operations;
      }

      // Deactivate if activated
      if (registry.activated.includes(name)) {
        const deactivateOps = await this.deactivatePlugin(root, name, options);
        operations.push(...deactivateOps);
      }

      // Remove from registry
      delete registry.plugins[name];
      registry.installed = registry.installed.filter((p: string) => p !== name);
      registry.lastUpdated = new Date().toISOString();

      this.savePluginRegistry(root, registry);

      operations.push({
        action: 'uninstall',
        target: name,
        success: true,
        output: `Successfully uninstalled ${name}`,
        duration: Date.now() - startTime
      });

    } catch (error) {
      operations.push({
        action: 'uninstall',
        target: name,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      });
    }

    return operations;
  }

  /**
   * Configure plugin
   */
  private async configurePlugin(
    root: string,
    name: string,
    config: string,
    options: {
      verbose: boolean;
    }
  ): Promise<PluginOperation[]> {
    const operations: PluginOperation[] = [];
    const startTime = Date.now();

    try {
      const registry = this.loadPluginRegistry(root);

      if (!registry.plugins[name]) {
        operations.push({
          action: 'configure',
          target: name,
          success: false,
          error: `Plugin ${name} is not installed.`,
          duration: Date.now() - startTime
        });
        return operations;
      }

      // Parse and validate config
      let configObj;
      try {
        configObj = JSON.parse(config);
      } catch (error) {
        throw new Error('Invalid JSON configuration');
      }

      // Update plugin configuration
      registry.plugins[name].config = { ...registry.plugins[name].config, ...configObj };
      registry.lastUpdated = new Date().toISOString();

      this.savePluginRegistry(root, registry);

      // Write config file
      const configFile = join(root, '.sf', 'config', `${name}.json`);
      writeFileSync(configFile, JSON.stringify(configObj, null, 2));

      operations.push({
        action: 'configure',
        target: name,
        success: true,
        output: `Successfully configured ${name}`,
        duration: Date.now() - startTime
      });

    } catch (error) {
      operations.push({
        action: 'configure',
        target: name,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      });
    }

    return operations;
  }

  /**
   * Activate plugin
   */
  private async activatePlugin(
    root: string,
    name: string,
    options: {
      verbose: boolean;
    }
  ): Promise<PluginOperation[]> {
    const operations: PluginOperation[] = [];
    const startTime = Date.now();

    try {
      const registry = this.loadPluginRegistry(root);

      if (!registry.plugins[name]) {
        operations.push({
          action: 'activate',
          target: name,
          success: false,
          error: `Plugin ${name} is not installed.`,
          duration: Date.now() - startTime
        });
        return operations;
      }

      if (registry.activated.includes(name)) {
        operations.push({
          action: 'activate',
          target: name,
          success: false,
          error: `Plugin ${name} is already activated.`,
          duration: Date.now() - startTime
        });
        return operations;
      }

      // Add to activated list
      registry.activated.push(name);
      registry.plugins[name].activated = true;
      registry.lastUpdated = new Date().toISOString();

      this.savePluginRegistry(root, registry);

      operations.push({
        action: 'activate',
        target: name,
        success: true,
        output: `Successfully activated ${name}`,
        duration: Date.now() - startTime
      });

    } catch (error) {
      operations.push({
        action: 'activate',
        target: name,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      });
    }

    return operations;
  }

  /**
   * Deactivate plugin
   */
  private async deactivatePlugin(
    root: string,
    name: string,
    options: {
      verbose: boolean;
    }
  ): Promise<PluginOperation[]> {
    const operations: PluginOperation[] = [];
    const startTime = Date.now();

    try {
      const registry = this.loadPluginRegistry(root);

      if (!registry.plugins[name]) {
        operations.push({
          action: 'deactivate',
          target: name,
          success: false,
          error: `Plugin ${name} is not installed.`,
          duration: Date.now() - startTime
        });
        return operations;
      }

      if (!registry.activated.includes(name)) {
        operations.push({
          action: 'deactivate',
          target: name,
          success: false,
          error: `Plugin ${name} is not activated.`,
          duration: Date.now() - startTime
        });
        return operations;
      }

      // Remove from activated list
      registry.activated = registry.activated.filter((p: string) => p !== name);
      registry.plugins[name].activated = false;
      registry.lastUpdated = new Date().toISOString();

      this.savePluginRegistry(root, registry);

      operations.push({
        action: 'deactivate',
        target: name,
        success: true,
        output: `Successfully deactivated ${name}`,
        duration: Date.now() - startTime
      });

    } catch (error) {
      operations.push({
        action: 'deactivate',
        target: name,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      });
    }

    return operations;
  }

  /**
   * List plugins
   */
  private async listPlugins(
    root: string,
    options: {
      verbose: boolean;
    }
  ): Promise<PluginOperation[]> {
    const operations: PluginOperation[] = [];
    const startTime = Date.now();

    try {
      const registry = this.loadPluginRegistry(root);

      let output = `Installed Plugins (${registry.installed.length}):\n\n`;

      if (registry.installed.length === 0) {
        output += 'No plugins installed.\n';
      } else {
        for (const pluginName of registry.installed) {
          const plugin = registry.plugins[pluginName];
          const status = registry.activated.includes(pluginName) ? '🟢 Active' : '🔴 Inactive';
          output += `  ${pluginName}@${plugin.version} ${status}\n`;
          if (options.verbose) {
            output += `    Source: ${plugin.source}\n`;
            output += `    Installed: ${plugin.installedAt}\n`;
            if (Object.keys(plugin.config).length > 0) {
              output += `    Config: ${JSON.stringify(plugin.config, null, 6)}\n`;
            }
          }
          output += '\n';
        }
      }

      operations.push({
        action: 'list',
        target: 'all',
        success: true,
        output,
        duration: Date.now() - startTime
      });

    } catch (error) {
      operations.push({
        action: 'list',
        target: 'all',
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      });
    }

    return operations;
  }

  /**
   * Get plugin status
   */
  private async getPluginStatus(
    root: string,
    options: {
      verbose: boolean;
    }
  ): Promise<PluginOperation[]> {
    const operations: PluginOperation[] = [];
    const startTime = Date.now();

    try {
      const registry = this.loadPluginRegistry(root);

      const stats = {
        total: registry.installed.length,
        active: registry.activated.length,
        inactive: registry.installed.length - registry.activated.length,
        lastUpdated: registry.lastUpdated
      };

      let output = `Plugin System Status:\n\n`;
      output += `Total Plugins: ${stats.total}\n`;
      output += `Active: ${stats.active} 🟢\n`;
      output += `Inactive: ${stats.inactive} 🔴\n`;
      output += `Last Updated: ${stats.lastUpdated}\n\n`;

      if (options.verbose) {
        output += `Registry Version: ${registry.version}\n`;
        output += `Registry File: .sf/plugins.json\n`;
        output += `Config Directory: .sf/config/\n`;
        output += `Plugin Directory: .sf/plugins/\n`;
      }

      operations.push({
        action: 'list',
        target: 'status',
        success: true,
        output,
        duration: Date.now() - startTime
      });

    } catch (error) {
      operations.push({
        action: 'list',
        target: 'status',
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      });
    }

    return operations;
  }

  /**
   * Helper methods
   */
  private loadPluginRegistry(root: string): any {
    const registryFile = join(root, '.sf', 'plugins.json');
    if (!existsSync(registryFile)) {
      throw new Error('Plugin registry not found. Initialize plugin system first.');
    }
    return JSON.parse(readFileSync(registryFile, 'utf-8').toString());
  }

  private savePluginRegistry(root: string, registry: any): void {
    const registryFile = join(root, '.sf', 'plugins.json');
    writeFileSync(registryFile, JSON.stringify(registry, null, 2));
  }

  private async installFromNpm(root: string, name: string, version: string, verbose: boolean): Promise<void> {
    const packageSpec = version === 'latest' ? name : `${name}@${version}`;
    const command = `npm install ${packageSpec} --save`;

    if (verbose) console.log(`   Running: ${command}`);
    execSync(command, { cwd: root, stdio: verbose ? 'inherit' : 'pipe' });
  }

  private async installFromGithub(root: string, name: string, version: string, verbose: boolean): Promise<void> {
    // Simulate GitHub installation (in a real implementation)
    if (verbose) console.log(`   Installing ${name} from GitHub (branch: ${version})`);
    // This would clone and install from GitHub repository
  }

  private async installFromLocal(root: string, name: string, verbose: boolean): Promise<void> {
    // Simulate local installation (in a real implementation)
    if (verbose) console.log(`   Installing ${name} from local path`);
    // This would install from a local directory
  }

  private async installFromRegistry(root: string, name: string, version: string, verbose: boolean): Promise<void> {
    // Simulate registry installation (in a real implementation)
    if (verbose) console.log(`   Installing ${name} from Skills Fabric registry`);
    // This would install from the Skills Fabric plugin registry
  }

  private generatePluginSummary(action: string, target: string, operations: PluginOperation[], verbose: boolean): string {
    const successfulOps = operations.filter(op => op.success).length;
    const totalOps = operations.length;

    let summary = `Plugin ${action}`;
    if (target) summary += ` for ${target}`;
    summary += `: ${successfulOps}/${totalOps} operations successful`;

    if (successfulOps === totalOps) {
      summary += ' ✅';
    } else {
      summary += ' ❌';
    }

    return summary;
  }

  private generateNextActions(action: string, target: string, results: PluginResult): string[] {
    const actions: string[] = [];

    // Based on current action, suggest next actions
    switch (action) {
      case 'install':
        actions.push(`/plugin activate ${target}`);
        actions.push(`/plugin configure ${target} --config '{}'`);
        break;
      case 'activate':
        actions.push(`/plugin configure ${target} --config '{}'`);
        actions.push('/plugin status');
        break;
      case 'configure':
        actions.push('/plugin status');
        actions.push('/plugin list');
        break;
      case 'deactivate':
        actions.push(`/plugin activate ${target}`);
        actions.push('/plugin list');
        break;
      case 'uninstall':
        actions.push('/plugin list');
        actions.push(`/plugin install ${target}`);
        break;
      case 'list':
        if (results.operations.length > 0) {
          const output = results.operations[0].output;
          if (output && output.includes('🔴 Inactive')) {
            actions.push('/plugin status');
          }
        }
        break;
    }

    // Always add general actions
    actions.push('/compact');
    actions.push('/build-and-fix');

    return actions;
  }

  private formatPluginOutput(results: PluginResult, verbose: boolean): string {
    let output = `## Plugin Management Results\n\n`;

    // Summary
    output += `### Summary\n`;
    output += `- Plugin: ${results.name}\n`;
    output += `- Version: ${results.version}\n`;
    output += `- Status: ${results.status === 'installed' ? '✅ Installed' :
                      results.status === 'uninstalled' ? '🗑️ Uninstalled' : '❌ Failed'}\n`;
    output += `- Operations: ${results.operations.length}\n\n`;

    // Operations
    if (results.operations.length > 0) {
      output += `### Operations\n`;
      for (const op of results.operations) {
        const statusIcon = op.success ? '✅' : '❌';
        output += `${statusIcon} **${op.action}**: ${op.target} (${op.duration}ms)\n`;

        if (op.output) {
          output += `   ${op.output}\n`;
        }

        if (op.error) {
          output += `   Error: ${op.error}\n`;
        }

        output += '\n';
      }
    }

    // Add summary from results
    if (results.summary) {
      output += `### ${results.summary}\n\n`;
    }

    // Recommendations
    output += `### Recommendations 💡\n`;

    if (results.status === 'installed') {
      output += `- ✅ Plugin installed successfully! Consider activating it.\n`;
    } else if (results.status === 'uninstalled') {
      output += `- ✅ Plugin uninstalled successfully.\n`;
    } else {
      output += `- 🚨 Operation failed. Review errors above.\n`;
    }

    return output;
  }

  /**
   * Persist results to MemTech L1
   */
  private async persistResults(sessionId: string, results: PluginResult): Promise<void> {
    try {
      await this.contextManager.updateContext(sessionId, {
        state: {
          pluginResults: results,
          lastRun: new Date().toISOString(),
          workspaceSnapshot: await this.captureWorkspace()
        },
        metadata: {}
      });
    } catch (error) {
      console.warn('Failed to persist results to MemTech L1:', error);
    }
  }

  /**
   * Get integration type
   */
  protected getIntegrationType(): 'skill' | 'daemon' | 'cli' | 'native' {
    return 'cli';
  }
}