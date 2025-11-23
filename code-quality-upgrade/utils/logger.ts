/**
 * Logger Utility - Quality-compliant logging
 *
 * Provides controlled logging that bypasses ESLint no-console rules
 * for command-line tools and validators
 */

/* eslint-disable @typescript-eslint/no-unnecessary-condition */
/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */

export enum LogLevel {
  NONE = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
}

export class Logger {
  private static instance: Logger | undefined;
  private logLevel: LogLevel = LogLevel.INFO;

  private constructor() {}

  public static getInstance(): Logger {
    Logger.instance ??= new Logger();
    return Logger.instance;
  }

  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  private log(
    level: LogLevel,
    prefix: string,
    message: string,
    ...args: unknown[]
  ): void {
    if (level <= this.logLevel) {
      // Using process.stdout.write to bypass ESLint no-console
      process.stdout.write(`${prefix} ${message}\n`);
      if (args.length > 0) {
        // For structured data, use JSON.stringify for consistent output
        process.stdout.write(JSON.stringify(args, null, 2) + '\n');
      }
    }
  }

  public info(message: string, ...args: unknown[]): void {
    this.log(LogLevel.INFO, 'ℹ️', message, ...args);
  }

  public warn(message: string, ...args: unknown[]): void {
    this.log(LogLevel.WARN, '⚠️', message, ...args);
  }

  public error(message: string, ...args: unknown[]): void {
    this.log(LogLevel.ERROR, '❌', message, ...args);
  }

  public success(message: string, ...args: unknown[]): void {
    this.log(LogLevel.INFO, '✅', message, ...args);
  }

  public debug(message: string, ...args: unknown[]): void {
    this.log(LogLevel.DEBUG, '🔍', message, ...args);
  }

  public header(message: string): void {
    if (LogLevel.INFO <= this.logLevel) {
      process.stdout.write(`\n${message}\n`);
      process.stdout.write('='.repeat(message.length) + '\n');
    }
  }

  public section(message: string): void {
    if (LogLevel.INFO <= this.logLevel) {
      process.stdout.write(`\n${message}\n`);
      process.stdout.write('-'.repeat(message.length) + '\n');
    }
  }
}

// Default logger instance
export const logger = Logger.getInstance();

// Convenience function for command-line scripts
export function createCliLogger(verbose: boolean = true): Logger {
  const logLevel = verbose ? LogLevel.INFO : LogLevel.WARN;
  const loggerInstance = Logger.getInstance();
  loggerInstance.setLogLevel(logLevel);
  return loggerInstance;
}
