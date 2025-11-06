/**
 * Base Slash Command Handler
 */

import { randomUUID } from 'crypto';
import {
  SlashCommandContext,
  ParsedSlashCommand,
  SlashCommandResult,
  CommandError,
  WorkspaceSnapshot,
  CommandMetadata
} from '../types.js';
import { SlashCommandContextManager } from '../context.js';

export abstract class SlashCommandHandler {
  protected contextManager: SlashCommandContextManager;
  protected command: any;

  constructor(command: any, contextManager?: SlashCommandContextManager) {
    this.command = command;
    this.contextManager = contextManager || SlashCommandContextManager.getInstance();
  }

  /**
   * Execute the slash command
   */
  async execute(
    parsedCommand: ParsedSlashCommand,
    context?: Partial<SlashCommandContext>
  ): Promise<SlashCommandResult> {
    const sessionId = this.generateSessionId();
    const startTime = Date.now();

    try {
      // Create or get context
      let commandContext: SlashCommandContext;
      if (context) {
        commandContext = await this.contextManager.createContext(
          sessionId,
          parsedCommand,
          context.workspace || await this.captureWorkspace(),
          context.state || {}
        );
      } else {
        commandContext = await this.contextManager.createContext(
          sessionId,
          parsedCommand,
          await this.captureWorkspace()
        );
      }

      // Validate command
      const validationResult = await this.validate(parsedCommand, commandContext);
      if (!validationResult.valid) {
        throw this.createError('validation', validationResult.message || 'Validation failed');
      }

      // Execute the command
      const result = await this.handle(parsedCommand, commandContext);

      // Update context with execution metadata
      const executionTime = Date.now() - startTime;
      await this.contextManager.updateContext(sessionId, {
        metadata: {
          executionTimeMs: executionTime,
          success: result.success,
          integrationType: this.getIntegrationType(),
        }
      });

      return {
        ...result,
        context: commandContext,
        metadata: {
          executionTimeMs: executionTime,
          integrationType: this.getIntegrationType(),
          persistenceKey: sessionId,
        }
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      const commandError = this.normalizeError(error);

      return {
        success: false,
        output: commandError.message,
        error: commandError,
        metadata: {
          executionTimeMs: executionTime,
          integrationType: this.getIntegrationType(),
        }
      };
    }
  }

  /**
   * Abstract method to handle the command execution
   */
  protected abstract handle(
    parsedCommand: ParsedSlashCommand,
    context: SlashCommandContext
  ): Promise<Omit<SlashCommandResult, 'context' | 'metadata'>>;

  /**
   * Validate the command before execution
   */
  protected async validate(
    parsedCommand: ParsedSlashCommand,
    context: SlashCommandContext
  ): Promise<{ valid: boolean; message?: string }> {
    // Check authentication if required
    if (this.command.requiresAuth && !await this.isAuthenticated(context)) {
      return { valid: false, message: 'Authentication required for this command' };
    }

    // Custom validation per command
    return this.validateCommand(parsedCommand, context);
  }

  /**
   * Command-specific validation
   */
  protected async validateCommand(
    parsedCommand: ParsedSlashCommand,
    context: SlashCommandContext
  ): Promise<{ valid: boolean; message?: string }> {
    return { valid: true };
  }

  /**
   * Check if user is authenticated
   */
  protected async isAuthenticated(context: SlashCommandContext): Promise<boolean> {
    // Default implementation - override in subclasses
    return true;
  }

  /**
   * Get integration type for this handler
   */
  protected getIntegrationType(): 'skill' | 'daemon' | 'cli' | 'native' {
    return 'native';
  }

  /**
   * Capture current workspace snapshot
   */
  protected async captureWorkspace(): Promise<WorkspaceSnapshot> {
    return await this.contextManager.captureWorkspaceSnapshot(process.cwd());
  }

  /**
   * Generate unique session ID
   */
  protected generateSessionId(): string {
    return randomUUID();
  }

  /**
   * Create a command error
   */
  protected createError(
    type: CommandError['type'],
    message: string,
    details?: any,
    code?: string
  ): CommandError {
    return {
      type,
      message,
      details,
      code,
    };
  }

  /**
   * Normalize error to CommandError format
   */
  protected normalizeError(error: any): CommandError {
    if (this.isCommandError(error)) {
      return error;
    }

    if (error instanceof Error) {
      return {
        type: 'execution',
        message: (error instanceof Error ? error.message : String(error)),
        details: {
          stack: error.stack,
          name: error.name,
        }
      };
    }

    if (typeof error === 'string') {
      return {
        type: 'execution',
        message: error,
      };
    }

    return {
      type: 'execution',
      message: 'An unknown error occurred',
      details: error,
    };
  }

  /**
   * Check if error is already a CommandError
   */
  private isCommandError(error: any): error is CommandError {
    return error && typeof error === 'object' && 'type' in error && 'message' in error;
  }

  /**
   * Helper to format output
   */
  protected formatOutput(
    message: string,
    format: 'text' | 'json' | 'markdown' = 'text'
  ): string {
    switch (format) {
      case 'json':
        return JSON.stringify({ message }, null, 2);
      case 'markdown':
        return `## Result\n\n${message}`;
      default:
        return message;
    }
  }

  /**
   * Helper to create success result
   */
  protected createSuccessResult(
    output: string,
    data?: any,
    nextActions?: string[]
  ): Omit<SlashCommandResult, 'context' | 'metadata'> {
    return {
      success: true,
      output,
      data,
      nextActions,
    };
  }

  /**
   * Helper to create error result
   */
  protected createErrorResult(
    error: CommandError
  ): Omit<SlashCommandResult, 'context' | 'metadata'> {
    return {
      success: false,
      output: (error instanceof Error ? error.message : String(error)),
      error,
    };
  }

  /**
   * Helper to get flag value with default
   */
  protected getFlag<T = string>(
    parsedCommand: ParsedSlashCommand,
    flagName: string,
    defaultValue: T
  ): T {
    const value = parsedCommand.flags[flagName];
    return value !== undefined ? (value as T) : defaultValue;
  }

  /**
   * Helper to get option value with default
   */
  protected getOption<T = string>(
    parsedCommand: ParsedSlashCommand,
    optionName: string,
    defaultValue: T
  ): T {
    const value = parsedCommand.options[optionName];
    return value !== undefined ? (value as T) : defaultValue;
  }

  /**
   * Helper to get argument by index
   */
  protected getArgument(
    parsedCommand: ParsedSlashCommand,
    index: number,
    defaultValue?: string
  ): string | undefined {
    return parsedCommand.args[index] || defaultValue;
  }

  /**
   * Helper to check if flag exists
   */
  protected hasFlag(parsedCommand: ParsedSlashCommand, flagName: string): boolean {
    return parsedCommand.flags[flagName] !== undefined;
  }

  /**
   * Helper to check if option exists
   */
  protected hasOption(parsedCommand: ParsedSlashCommand, optionName: string): boolean {
    return parsedCommand.options[optionName] !== undefined;
  }

  /**
   * Helper to get required argument
   */
  protected requireArgument(
    parsedCommand: ParsedSlashCommand,
    index: number,
    argumentName: string
  ): string {
    const arg = this.getArgument(parsedCommand, index);
    if (!arg) {
      throw this.createError('validation', `Missing required argument: ${argumentName}`);
    }
    return arg;
  }

  /**
   * Helper to get required flag
   */
  protected requireFlag(
    parsedCommand: ParsedSlashCommand,
    flagName: string,
    flagDescription?: string
  ): string | boolean {
    if (!this.hasFlag(parsedCommand, flagName)) {
      throw this.createError(
        'validation',
        `Missing required flag: --${flagName}${flagDescription ? ` (${flagDescription})` : ''}`
      );
    }
    return parsedCommand.flags[flagName];
  }

  /**
   * Helper to validate argument format
   */
  protected validateArgument(
    value: string,
    pattern: RegExp,
    errorMessage: string
  ): void {
    if (!pattern.test(value)) {
      throw this.createError('validation', errorMessage);
    }
  }

  /**
   * Helper to run command with timeout
   */
  protected async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number = 30000
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(this.createError('timeout', `Command timed out after ${timeoutMs}ms`)), timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }
}