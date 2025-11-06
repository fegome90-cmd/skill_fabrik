export enum LogLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: any;
}

export class Logger {
  static log(level: LogLevel, message: string, context?: any): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context
    };

    const prefix = level.toUpperCase().padEnd(5);
    // eslint-disable-next-line no-console
    console.log(`${prefix} ${entry.timestamp} ${message}`);

    if (process.env.CI === 'true') {
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(entry));
    }
  }

  static info(message: string, context?: any): void {
    this.log(LogLevel.INFO, message, context);
  }

  static warn(message: string, context?: any): void {
    this.log(LogLevel.WARN, message, context);
  }

  static error(message: string, context?: any): void {
    this.log(LogLevel.ERROR, message, context);
  }

  static success(message: string, context?: any): void {
    this.log(LogLevel.INFO, message, context);
  }
}


