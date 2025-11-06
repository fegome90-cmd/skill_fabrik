/**
 * Slash Command Parser
 */

import { ParsedSlashCommand } from './types.js';

export class SlashCommandParser {
  private static readonly COMMAND_REGEX = /^\/([a-zA-Z][a-zA-Z0-9-_]*)/;
  private static readonly FLAG_REGEX = /^--([a-zA-Z][a-zA-Z0-9-_]*)(?:=(.+))?$/;
  private static readonly OPTION_REGEX = /^-([a-zA-Z])$/;

  /**
   * Parse a slash command string into structured components
   */
  static parse(input: string): ParsedSlashCommand | null {
    const trimmed = input.trim();

    // Handle empty or invalid input gracefully
    if (!trimmed || trimmed.length === 0) {
      return null;
    }

    // Check if this is a slash command
    const commandMatch = trimmed.match(this.COMMAND_REGEX);
    if (!commandMatch) {
      return null;
    }

    const command = commandMatch[1];
    const rest = trimmed.slice(commandMatch[0].length).trim();

    // Parse arguments, flags, and options
    const args: string[] = [];
    const flags: Record<string, string | boolean> = {};
    const options: Record<string, string> = {};

    let currentArg = '';
    let inQuotes = false;
    let quoteChar = '';

    const tokenize = (str: string): string[] => {
      const tokens: string[] = [];
      let current = '';

      for (let i = 0; i < str.length; i++) {
        const char = str[i];

        if (!inQuotes && (char === '"' || char === "'")) {
          inQuotes = true;
          quoteChar = char;
        } else if (inQuotes && char === quoteChar) {
          inQuotes = false;
          quoteChar = '';
        } else if (!inQuotes && char === ' ') {
          if (current) {
            tokens.push(current);
            current = '';
          }
        } else {
          current += char;
        }
      }

      if (current) {
        tokens.push(current);
      }

      return tokens;
    };

    const tokens = tokenize(rest);

    for (const token of tokens) {
      // Check for flags (--flag=value or --flag)
      const flagMatch = token.match(this.FLAG_REGEX);
      if (flagMatch) {
        const flagName = flagMatch[1];
        const flagValue = flagMatch[2] !== undefined ? flagMatch[2] : true;
        flags[flagName] = flagValue;
        continue;
      }

      // Check for options (-o value)
      const optionMatch = token.match(this.OPTION_REGEX);
      if (optionMatch) {
        const optionName = optionMatch[1];
        // Look ahead for the value
        const nextIndex = tokens.indexOf(token) + 1;
        if (nextIndex < tokens.length && !tokens[nextIndex].startsWith('-')) {
          options[optionName] = tokens[nextIndex];
          tokens.splice(nextIndex, 1); // Remove the value token
        } else {
          options[optionName] = 'true';
        }
        continue;
      }

      // Regular argument
      args.push(token);
    }

    const parsed: ParsedSlashCommand = {
      raw: trimmed,
      command,
      args,
      flags,
      options,
    };

    // Validate structure manually
    const validation = this.validate(parsed);
    if (!validation.valid) {
      console.error('Invalid slash command structure:', validation.errors);
      return null;
    }

    return parsed;
  }

  /**
   * Check if a string is a slash command
   */
  static isSlashCommand(input: string): boolean {
    return this.COMMAND_REGEX.test(input.trim());
  }

  /**
   * Get the command name from a slash command string
   */
  static getCommandName(input: string): string | null {
    const match = input.trim().match(this.COMMAND_REGEX);
    return match ? match[1] : null;
  }

  /**
   * Validate command structure
   */
  static validate(parsed: ParsedSlashCommand): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!parsed.command) {
      errors.push('Command name is required');
    }

    if (parsed.command.length < 1) {
      errors.push('Command name must be at least 1 character');
    }

    if (parsed.command.length > 50) {
      errors.push('Command name must be less than 50 characters');
    }

    if (!/^[a-zA-Z][a-zA-Z0-9-_]*$/.test(parsed.command)) {
      errors.push('Command name must start with a letter and contain only letters, numbers, hyphens, and underscores');
    }

    // Validate flag names
    for (const [flagName, flagValue] of Object.entries(parsed.flags)) {
      if (!/^[a-zA-Z][a-zA-Z0-9-_]*$/.test(flagName)) {
        errors.push(`Invalid flag name: ${flagName}`);
      }
    }

    // Validate option names
    for (const [optionName] of Object.entries(parsed.options)) {
      if (!/^[a-zA-Z]$/.test(optionName)) {
        errors.push(`Invalid option name: ${optionName}. Options must be single letters`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Format a parsed command back to string
   */
  static format(parsed: ParsedSlashCommand): string {
    const parts = [`/${parsed.command}`];

    // Add arguments
    for (const arg of parsed.args) {
      if (arg.includes(' ')) {
        parts.push(`"${arg}"`);
      } else {
        parts.push(arg);
      }
    }

    // Add options
    for (const [option, value] of Object.entries(parsed.options)) {
      if (value === 'true') {
        parts.push(`-${option}`);
      } else {
        if (value.includes(' ')) {
          parts.push(`-${option} "${value}"`);
        } else {
          parts.push(`-${option} ${value}`);
        }
      }
    }

    // Add flags
    for (const [flag, value] of Object.entries(parsed.flags)) {
      if (value === true) {
        parts.push(`--${flag}`);
      } else {
        if (typeof value === 'string' && value.includes(' ')) {
          parts.push(`--${flag}="${value}"`);
        } else {
          parts.push(`--${flag}=${value}`);
        }
      }
    }

    return parts.join(' ');
  }

  /**
   * Extract help information from command
   */
  static extractHelpFlags(parsed: ParsedSlashCommand): { showHelp: boolean; showExamples: boolean } {
    return {
      showHelp: parsed.flags.help === true || parsed.options.h === 'true',
      showExamples: parsed.flags.examples === true || parsed.options.e === 'true',
    };
  }

  /**
   * Parse authentication profile from command
   */
  static parseAuthProfile(parsed: ParsedSlashCommand): string | null {
    return (parsed.flags.auth as string) || (parsed.options.a as string) || null;
  }

  /**
   * Parse context file from command
   */
  static parseContextFile(parsed: ParsedSlashCommand): string | null {
    return (parsed.flags.context as string) || (parsed.options.c as string) || null;
  }

  /**
   * Parse output format from command
   */
  static parseOutputFormat(parsed: ParsedSlashCommand): 'json' | 'markdown' | 'text' {
    const format = (parsed.flags.format as string) || (parsed.options.f as string) || 'text';
    return ['json', 'markdown', 'text'].includes(format) ? format as any : 'text';
  }

  /**
   * Parse verbosity level from command
   */
  static parseVerbosity(parsed: ParsedSlashCommand): 'silent' | 'normal' | 'verbose' | 'debug' {
    const verbosity = (parsed.flags.verbose as string) || (parsed.options.v as string) || 'normal';
    return ['silent', 'normal', 'verbose', 'debug'].includes(verbosity) ? verbosity as any : 'normal';
  }
}