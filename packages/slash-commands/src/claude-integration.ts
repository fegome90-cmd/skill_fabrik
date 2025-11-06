/**
 * Claude Code Integration for Slash Commands
 *
 * Provides unified execution layer that works seamlessly in both CLI and Claude Code
 * environments while maintaining full feature parity and consistent behavior.
 */

import {
  SlashCommandRegistryManager,
  SlashCommandParser,
  SlashCommandContextManager,
  type ParsedSlashCommand,
  type SlashCommandResult
} from './index.js';
import { randomUUID } from 'crypto';

export interface ClaudeCommandContext {
  sessionId: string;
  workspace: string;
  userId?: string;
  timestamp: number;
  metadata: Record<string, any>;
}

export interface ClaudeCommandResult {
  success: boolean;
  output: string;
  data?: any;
  executionTime: number;
  nextActions?: string[];
  error?: {
    type: string;
    message: string;
    suggestions?: string[];
  };
  metadata?: {
    command: string;
    sessionId: string;
    executionMode: 'claude-code' | 'cli';
    integrationType: string;
  };
}

export class ClaudeCodeIntegration {
  private static instance: ClaudeCodeIntegration;
  private registry: SlashCommandRegistryManager;
  private parser: SlashCommandParser;
  private contextManager: SlashCommandContextManager;

  private constructor() {
    this.registry = SlashCommandRegistryManager.getInstance();
    this.parser = new SlashCommandParser();
    this.contextManager = SlashCommandContextManager.getInstance();
  }

  static getInstance(): ClaudeCodeIntegration {
    if (!ClaudeCodeIntegration.instance) {
      ClaudeCodeIntegration.instance = new ClaudeCodeIntegration();
    }
    return ClaudeCodeIntegration.instance;
  }

  /**
   * Execute slash command in Claude Code context
   */
  async executeCommand(
    commandInput: string,
    context?: Partial<ClaudeCommandContext>
  ): Promise<ClaudeCommandResult> {
    const startTime = Date.now();

    try {
      // Create execution context
      const claudeContext: ClaudeCommandContext = {
        sessionId: context?.sessionId || randomUUID(),
        workspace: context?.workspace || process.cwd(),
        userId: context?.userId,
        timestamp: Date.now(),
        metadata: context?.metadata || {}
      };

      // Parse command
      const parsedCommand = SlashCommandParser.parse(commandInput);
      if (!parsedCommand) {
        return this.createErrorResult('validation', `Invalid slash command: ${commandInput}`, {
          suggestions: [
            'Check command syntax',
            'Use /help for available commands',
            'Verify command name is correct'
          ]
        });
      }

      // Get command definition
      const commandDefinition = this.registry.getCommand(parsedCommand.command);
      if (!commandDefinition) {
        const availableCommands = this.registry.getAllCommands();
        const commandNames = availableCommands.map(cmd => `/${cmd.name}`).join(', ');

        return this.createErrorResult('validation', `Unknown slash command: /${parsedCommand.command}`, {
          suggestions: [
            `Available commands: ${commandNames}`,
            'Use /slash list to see all commands',
            'Check command spelling'
          ]
        });
      }

      // Validate execution requirements
      if (commandDefinition.requiresAuth && !claudeContext.userId) {
        return this.createErrorResult('permission', 'This command requires authentication');
      }

      // Execute command
      const result = await this.executeCommandHandler(parsedCommand, commandDefinition, claudeContext);

      const executionTime = Date.now() - startTime;

      return {
        ...result,
        executionTime,
        metadata: {
          command: parsedCommand.command,
          sessionId: claudeContext.sessionId,
          executionMode: 'claude-code',
          integrationType: commandDefinition.handler
        }
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      return {
        success: false,
        output: '',
        executionTime,
        error: {
          type: 'execution',
          message: `Command execution failed: ${errorMessage}`
        },
        metadata: {
          command: 'unknown',
          sessionId: context?.sessionId || 'unknown',
          executionMode: 'claude-code',
          integrationType: 'unknown'
        }
      };
    }
  }

  /**
   * Execute command handler
   */
  private async executeCommandHandler(
    parsedCommand: ParsedSlashCommand,
    commandDefinition: any,
    context: ClaudeCommandContext
  ): Promise<Omit<ClaudeCommandResult, 'executionTime' | 'metadata'>> {
    // Import handler dynamically to avoid circular dependencies
    const handlerModule = await import(`./handlers/${commandDefinition.handler}.js`);
    const HandlerClass = handlerModule[commandDefinition.handler];

    if (!HandlerClass) {
      throw new Error(`Handler class not found: ${commandDefinition.handler}`);
    }

    // Create handler instance
    const handler = new HandlerClass(commandDefinition);

    // Create workspace snapshot
    const workspaceSnapshot = await this.contextManager.captureWorkspaceSnapshot(context.workspace);

    // Create slash command context
    const slashContext = await this.contextManager.createContext(
      context.sessionId,
      parsedCommand,
      workspaceSnapshot
    );

    // Execute handler
    const result = await handler.execute(parsedCommand, slashContext);

    // Transform result to Claude format
    return this.transformResult(result);
  }

  /**
   * Transform slash command result to Claude format
   */
  private transformResult(slashResult: SlashCommandResult): Omit<ClaudeCommandResult, 'executionTime' | 'metadata'> {
    return {
      success: slashResult.success,
      output: slashResult.output,
      data: slashResult.data,
      nextActions: slashResult.nextActions,
      error: slashResult.error ? {
        type: slashResult.error.type,
        message: slashResult.error.message,
        suggestions: [] // CommandError interface doesn't have suggestions property
      } : undefined
    };
  }

  /**
   * Create error result
   */
  private createErrorResult(
    type: string,
    message: string,
    options?: { suggestions?: string[] }
  ): ClaudeCommandResult {
    return {
      success: false,
      output: '',
      executionTime: 0,
      error: {
        type,
        message,
        suggestions: options?.suggestions || []
      },
      metadata: {
        command: 'error',
        sessionId: 'error',
        executionMode: 'claude-code',
        integrationType: 'error'
      }
    };
  }

  /**
   * Get available commands for Claude Code
   */
  getAvailableCommands(): Array<{
    name: string;
    description: string;
    category: string;
    examples: string[];
    requiresAuth: boolean;
  }> {
    const commands = this.registry.getAllCommands();

    return commands.map(cmd => ({
      name: cmd.name,
      description: cmd.description,
      category: cmd.category,
      examples: cmd.examples || [],
      requiresAuth: cmd.requiresAuth
    }));
  }

  /**
   * Get command help for Claude Code
   */
  getCommandHelp(commandName: string): {
    name: string;
    description: string;
    category: string;
    examples: string[];
    requiresAuth: boolean;
  } | null {
    const command = this.registry.getCommand(commandName);

    if (!command) {
      return null;
    }

    return {
      name: command.name,
      description: command.description,
      category: command.category,
      examples: command.examples || [],
      requiresAuth: command.requiresAuth
    };
  }

  /**
   * Format output for Claude Code display
   */
  formatOutput(output: string, format: 'text' | 'markdown' = 'text'): string {
    switch (format) {
      case 'markdown':
        return this.formatAsMarkdown(output);
      case 'text':
      default:
        return output;
    }
  }

  /**
   * Format output as markdown
   */
  private formatAsMarkdown(output: string): string {
    // Add markdown formatting for better display in Claude Code
    if (output.includes('✅') || output.includes('❌') || output.includes('⚠️')) {
      return `\n${output}`;
    }

    // Wrap in code block if it looks like code output
    if (output.includes('{') && output.includes('}') || output.includes('Error:')) {
      return `\`\`\`\n${output}\n\`\`\``;
    }

    return output;
  }

  /**
   * Generate usage examples for Claude Code
   */
  generateUsageExamples(commandName: string): string[] {
    const command = this.registry.getCommand(commandName);

    if (!command || !command.examples) {
      return [];
    }

    return command.examples.map(example => {
      // Add context for Claude Code usage
      if (example.startsWith('/')) {
        return example; // Already in correct format
      }
      return `/${commandName} ${example}`;
    });
  }

  /**
   * Validate command availability
   */
  isCommandAvailable(commandName: string): boolean {
    return this.registry.hasCommand(commandName);
  }

  /**
   * Get registry statistics
   */
  getRegistryStats() {
    const categories = this.registry.getCategories();
    const allCommands = categories.flatMap(cat => this.registry.getCommandsByCategory(cat));

    return {
      totalCommands: allCommands.length,
      commandsByCategory: categories.reduce((acc, cat) => {
        acc[cat] = this.registry.getCommandsByCategory(cat).length;
        return acc;
      }, {} as Record<string, number>),
      requiresAuth: allCommands.filter(cmd => cmd.requiresAuth).length
    };
  }
}

// Export singleton instance
export const claudeCodeIntegration = ClaudeCodeIntegration.getInstance();