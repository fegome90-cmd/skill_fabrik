/**
 * CLI Error Handler - Centralized Error Management
 * Implements standardized error handling with consistent exit codes and user-friendly messages
 */
export declare enum ExitCode {
    SUCCESS = 0,// Successful operation
    GENERAL_ERROR = 1,// General error (user error)
    SYSTEM_ERROR = 2,// System error (internal)
    USAGE_ERROR = 64,// Usage error (invalid arguments)
    DATA_ERROR = 65,// Data error (invalid input)
    NO_INPUT = 66,// No input provided
    SOFTWARE_ERROR = 70,// Internal software error
    CONFIG_ERROR = 78,// Configuration error
    NETWORK_ERROR = 76,// Network error
    PERMISSION_ERROR = 77,// Permission error
    TEMPORARY_FAILURE = 75
}
export declare enum ErrorType {
    VALIDATION = "ValidationError",
    CONFIGURATION = "ConfigurationError",
    SYSTEM = "SystemError",
    USER = "UserError",
    NETWORK = "NetworkError",
    PERMISSION = "PermissionError",
    TEMPORARY = "TemporaryError"
}
export interface ErrorContext {
    command?: string;
    args?: string[];
    component?: string;
    operation?: string;
    details?: string;
    duration?: number;
    timestamp?: number;
}
export interface ErrorMessage {
    primary: string;
    details?: string;
    suggestions: string[];
    help?: string;
    code?: number;
}
/**
 * Base CLI Error class
 */
export declare class CLIError extends Error {
    readonly code: ExitCode;
    readonly type: ErrorType;
    readonly context?: ErrorContext;
    readonly suggestions?: string[];
    constructor(message: string, code: ExitCode, type: ErrorType, context?: ErrorContext, suggestions?: string[]);
    /**
     * Get formatted error message
     */
    getFormattedMessage(): string;
    /**
     * Get user-friendly error description
     */
    getUserDescription(): string;
    /**
     * Get recovery suggestions
     */
    getRecoverySuggestions(): string[];
}
/**
 * Validation Error - Input validation failures
 */
export declare class ValidationError extends CLIError {
    constructor(message: string, field?: string, value?: string, expected?: string, context?: ErrorContext);
}
/**
 * Configuration Error - Configuration issues
 */
export declare class ConfigurationError extends CLIError {
    constructor(message: string, configPath?: string, context?: ErrorContext);
}
/**
 * System Error - Internal system failures
 */
export declare class SystemError extends CLIError {
    constructor(message: string, component?: string, operation?: string, context?: ErrorContext);
}
/**
 * User Error - User action errors
 */
export declare class UserError extends CLIError {
    constructor(message: string, action?: string, context?: ErrorContext);
}
/**
 * Network Error - Network connectivity issues
 */
export declare class NetworkError extends CLIError {
    constructor(message: string, endpoint?: string, context?: ErrorContext);
}
/**
 * Permission Error - Permission access issues
 */
export declare class PermissionError extends CLIError {
    constructor(message: string, resource?: string, context?: ErrorContext);
}
/**
 * Temporary Error - Transient failures
 */
export declare class TemporaryError extends CLIError {
    constructor(message: string, context?: ErrorContext);
}
/**
 * Message Formatter for error messages
 */
export declare class MessageFormatter {
    static formatError(error: CLIError): string;
    private static getColorIcon;
    /**
     * Format success message
     */
    static formatSuccess(message: string, context?: ErrorContext): string;
    /**
     * Format warning message
     */
    static formatWarning(message: string, context?: ErrorContext): string;
    /**
     * Format info message
     */
    static formatInfo(message: string, context?: ErrorContext): string;
}
/**
 * CLI Error Handler - Centralized error management
 */
export declare class CLIErrorHandler {
    private static instance;
    static getInstance(): CLIErrorHandler;
    /**
     * Handle any error and return CLI output
     */
    handleError(error: Error, context?: ErrorContext): {
        stderr: string;
        exitCode: ExitCode;
        metadata: {
            timestamp: number;
            command: string;
            args: string[];
            errorType: string;
            duration: number;
            component?: string;
            operation?: string;
        };
    };
    /**
     * Handle success and return CLI output
     */
    handleSuccess(message: string, context?: ErrorContext): {
        stdout: string;
        exitCode: ExitCode;
        metadata: {
            timestamp: number;
            command: string;
            args: string[];
            duration: number;
        };
    };
    /**
     * Wrap regular errors in CLIError
     */
    private wrapError;
    /**
     * Determine error type from error content
     */
    private determineErrorType;
    /**
     * Determine exit code based on error type
     */
    private determineExitCode;
    /**
     * Generate contextual suggestions for errors
     */
    private generateSuggestions;
    /**
     * Attempt error recovery
     */
    attemptRecovery(error: CLIError, context?: ErrorContext): Promise<{
        recovered: boolean;
        suggestion?: string;
        action?: () => Promise<any>;
    }>;
    private recoverFromValidationError;
    private recoverFromPermissionError;
    private recoverFromConfigurationError;
    private recoverFromNetworkError;
    private recoverFromTemporaryError;
}
export declare const errorHandler: CLIErrorHandler;
//# sourceMappingURL=error-handler.d.ts.map