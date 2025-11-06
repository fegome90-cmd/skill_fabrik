export declare enum LogLevel {
    INFO = "info",
    WARN = "warn",
    ERROR = "error"
}
export interface LogEntry {
    level: LogLevel;
    message: string;
    timestamp: string;
    context?: any;
}
export declare class Logger {
    static log(level: LogLevel, message: string, context?: any): void;
    static info(message: string, context?: any): void;
    static warn(message: string, context?: any): void;
    static error(message: string, context?: any): void;
    static success(message: string, context?: any): void;
}
//# sourceMappingURL=logger.d.ts.map