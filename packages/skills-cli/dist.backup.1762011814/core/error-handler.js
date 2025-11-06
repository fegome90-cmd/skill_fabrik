/**
 * CLI Error Handler - Centralized Error Management
 * Implements standardized error handling with consistent exit codes and user-friendly messages
 */
export var ExitCode;
(function (ExitCode) {
    ExitCode[ExitCode["SUCCESS"] = 0] = "SUCCESS";
    ExitCode[ExitCode["GENERAL_ERROR"] = 1] = "GENERAL_ERROR";
    ExitCode[ExitCode["SYSTEM_ERROR"] = 2] = "SYSTEM_ERROR";
    ExitCode[ExitCode["USAGE_ERROR"] = 64] = "USAGE_ERROR";
    ExitCode[ExitCode["DATA_ERROR"] = 65] = "DATA_ERROR";
    ExitCode[ExitCode["NO_INPUT"] = 66] = "NO_INPUT";
    ExitCode[ExitCode["SOFTWARE_ERROR"] = 70] = "SOFTWARE_ERROR";
    ExitCode[ExitCode["CONFIG_ERROR"] = 78] = "CONFIG_ERROR";
    ExitCode[ExitCode["NETWORK_ERROR"] = 76] = "NETWORK_ERROR";
    ExitCode[ExitCode["PERMISSION_ERROR"] = 77] = "PERMISSION_ERROR";
    ExitCode[ExitCode["TEMPORARY_FAILURE"] = 75] = "TEMPORARY_FAILURE";
})(ExitCode || (ExitCode = {}));
export var ErrorType;
(function (ErrorType) {
    ErrorType["VALIDATION"] = "ValidationError";
    ErrorType["CONFIGURATION"] = "ConfigurationError";
    ErrorType["SYSTEM"] = "SystemError";
    ErrorType["USER"] = "UserError";
    ErrorType["NETWORK"] = "NetworkError";
    ErrorType["PERMISSION"] = "PermissionError";
    ErrorType["TEMPORARY"] = "TemporaryError";
})(ErrorType || (ErrorType = {}));
/**
 * Base CLI Error class
 */
export class CLIError extends Error {
    code;
    type;
    context;
    suggestions;
    constructor(message, code, type, context, suggestions) {
        super(message);
        this.code = code;
        this.type = type;
        this.context = context;
        this.suggestions = suggestions;
        this.name = 'CLIError';
    }
    /**
     * Get formatted error message
     */
    getFormattedMessage() {
        return MessageFormatter.formatError(this);
    }
    /**
     * Get user-friendly error description
     */
    getUserDescription() {
        return this.message;
    }
    /**
     * Get recovery suggestions
     */
    getRecoverySuggestions() {
        return this.suggestions || [];
    }
}
/**
 * Validation Error - Input validation failures
 */
export class ValidationError extends CLIError {
    constructor(message, field, value, expected, context) {
        const suggestions = [];
        if (field) {
            suggestions.push(`Check the ${field} parameter format`);
            if (expected) {
                suggestions.push(`Expected format: ${expected}`);
            }
        }
        if (value && expected) {
            suggestions.push(`Received: "${value}"`);
        }
        super(message, ExitCode.DATA_ERROR, ErrorType.VALIDATION, context, suggestions);
    }
}
/**
 * Configuration Error - Configuration issues
 */
export class ConfigurationError extends CLIError {
    constructor(message, configPath, context) {
        const suggestions = [];
        if (configPath) {
            suggestions.push(`Check configuration file: ${configPath}`);
            suggestions.push('Run "cli config --validate" to check configuration');
        }
        suggestions.push('Refer to documentation for configuration options');
        super(message, ExitCode.CONFIG_ERROR, ErrorType.CONFIGURATION, context, suggestions);
    }
}
/**
 * System Error - Internal system failures
 */
export class SystemError extends CLIError {
    constructor(message, component, operation, context) {
        const suggestions = [
            'Check system logs for more details',
            'Try restarting the CLI tool',
            'Report this issue if it persists'
        ];
        super(message, ExitCode.SYSTEM_ERROR, ErrorType.SYSTEM, context, suggestions);
    }
}
/**
 * User Error - User action errors
 */
export class UserError extends CLIError {
    constructor(message, action, context) {
        const suggestions = [];
        if (action) {
            suggestions.push(`Review the ${action} command usage`);
            suggestions.push(`Run "cli ${action} --help" for usage examples`);
        }
        suggestions.push('Check the command documentation');
        super(message, ExitCode.GENERAL_ERROR, ErrorType.USER, context, suggestions);
    }
}
/**
 * Network Error - Network connectivity issues
 */
export class NetworkError extends CLIError {
    constructor(message, endpoint, context) {
        const suggestions = [
            'Check internet connection',
            'Verify service availability',
            'Try again later'
        ];
        super(message, ExitCode.NETWORK_ERROR, ErrorType.NETWORK, context, suggestions);
    }
}
/**
 * Permission Error - Permission access issues
 */
export class PermissionError extends CLIError {
    constructor(message, resource, context) {
        const suggestions = [];
        if (resource) {
            suggestions.push(`Check permissions for: ${resource}`);
            suggestions.push('Try running with elevated privileges if necessary');
        }
        suggestions.push('Verify user access rights');
        super(message, ExitCode.PERMISSION_ERROR, ErrorType.PERMISSION, context, suggestions);
    }
}
/**
 * Temporary Error - Transient failures
 */
export class TemporaryError extends CLIError {
    constructor(message, context) {
        const suggestions = [
            'Try again in a few moments',
            'Check system resources',
            'Verify service status'
        ];
        super(message, ExitCode.TEMPORARY_FAILURE, ErrorType.TEMPORARY, context, suggestions);
    }
}
/**
 * Message Formatter for error messages
 */
export class MessageFormatter {
    static formatError(error) {
        let message = '';
        // Primary error message
        message += `${this.getColorIcon(error.code)} ${error.message}\n`;
        // Context information
        if (error.context?.command) {
            message += `\n🔧 Command: ${error.context.command}`;
            if (error.context.args && error.context.args.length > 0) {
                message += ` ${error.context.args.join(' ')}`;
            }
        }
        // Details if available
        if (error.context?.details) {
            message += `\n📋 Details: ${error.context.details}`;
        }
        // Component information
        if (error.context?.component) {
            message += `\n🧩 Component: ${error.context.component}`;
            if (error.context?.operation) {
                message += ` (${error.context.operation})`;
            }
        }
        // Suggestions
        if (error.suggestions && error.suggestions.length > 0) {
            message += '\n💡 Suggestions:';
            error.suggestions.forEach((suggestion, index) => {
                message += `\n   ${index + 1}. ${suggestion}`;
            });
        }
        // Help reference
        if (error.context?.command) {
            message += `\nℹ️  Help: Run 'skills-cli ${error.context.command} --help' for more information`;
        }
        // Exit code reference (in debug mode)
        if (process.env.DEBUG === 'true') {
            message += `\n🔍 Debug: Exit code ${error.code} (${error.constructor.name})`;
            if (error.context?.timestamp) {
                message += ` at ${new Date(error.context.timestamp).toISOString()}`;
            }
        }
        return message;
    }
    static getColorIcon(code) {
        if (code === ExitCode.SUCCESS)
            return '✅';
        if (code < 10)
            return '❌';
        if (code < 20)
            return '⚠️';
        if (code < 70)
            return '🔥';
        return '💥';
    }
    /**
     * Format success message
     */
    static formatSuccess(message, context) {
        let formatted = `✅ ${message}`;
        if (context?.duration) {
            formatted += ` (${context.duration}ms)`;
        }
        return formatted;
    }
    /**
     * Format warning message
     */
    static formatWarning(message, context) {
        return `⚠️  ${message}`;
    }
    /**
     * Format info message
     */
    static formatInfo(message, context) {
        return `ℹ️  ${message}`;
    }
}
/**
 * CLI Error Handler - Centralized error management
 */
export class CLIErrorHandler {
    static instance;
    static getInstance() {
        if (!CLIErrorHandler.instance) {
            CLIErrorHandler.instance = new CLIErrorHandler();
        }
        return CLIErrorHandler.instance;
    }
    /**
     * Handle any error and return CLI output
     */
    handleError(error, context) {
        const cliError = this.wrapError(error, context);
        const formattedMessage = cliError.getFormattedMessage();
        const exitCode = cliError.code;
        return {
            stderr: formattedMessage,
            exitCode,
            metadata: {
                timestamp: Date.now(),
                command: context?.command || 'unknown',
                args: context?.args || [],
                errorType: cliError.constructor.name,
                duration: context?.duration || 0,
                component: context?.component,
                operation: context?.operation
            }
        };
    }
    /**
     * Handle success and return CLI output
     */
    handleSuccess(message, context) {
        const formattedMessage = MessageFormatter.formatSuccess(message, context);
        return {
            stdout: formattedMessage,
            exitCode: ExitCode.SUCCESS,
            metadata: {
                timestamp: Date.now(),
                command: context?.command || 'unknown',
                args: context?.args || [],
                duration: context?.duration || 0
            }
        };
    }
    /**
     * Wrap regular errors in CLIError
     */
    wrapError(error, context) {
        if (error instanceof CLIError) {
            return error;
        }
        // Determine error type based on error content
        const errorType = this.determineErrorType(error, context);
        const exitCode = this.determineExitCode(errorType, error);
        // Generate suggestions based on error
        const suggestions = this.generateSuggestions(error, errorType, context);
        return new CLIError(error.message, exitCode, errorType, context, suggestions);
    }
    /**
     * Determine error type from error content
     */
    determineErrorType(error, context) {
        const message = error.message.toLowerCase();
        // Check for specific error patterns
        if (message.includes('permission') || message.includes('access denied') || message.includes('eacces')) {
            return ErrorType.PERMISSION;
        }
        if (message.includes('network') || message.includes('connection') || message.includes('timeout')) {
            return ErrorType.NETWORK;
        }
        if (message.includes('configuration') || message.includes('config') || message.includes('settings')) {
            return ErrorType.CONFIGURATION;
        }
        if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
            return ErrorType.VALIDATION;
        }
        if (message.includes('temporary') || message.includes('retry') || message.includes('later')) {
            return ErrorType.TEMPORARY;
        }
        if (message.includes('system') || message.includes('internal') || message.includes('unexpected')) {
            return ErrorType.SYSTEM;
        }
        // Default to user error
        return ErrorType.USER;
    }
    /**
     * Determine exit code based on error type
     */
    determineExitCode(errorType, error) {
        switch (errorType) {
            case ErrorType.PERMISSION:
                return ExitCode.PERMISSION_ERROR;
            case ErrorType.NETWORK:
                return ExitCode.NETWORK_ERROR;
            case ErrorType.CONFIGURATION:
                return ExitCode.CONFIG_ERROR;
            case ErrorType.VALIDATION:
                return ExitCode.DATA_ERROR;
            case ErrorType.TEMPORARY:
                return ExitCode.TEMPORARY_FAILURE;
            case ErrorType.SYSTEM:
                return ExitCode.SOFTWARE_ERROR;
            case ErrorType.USER:
            default:
                return ExitCode.GENERAL_ERROR;
        }
    }
    /**
     * Generate contextual suggestions for errors
     */
    generateSuggestions(error, errorType, context) {
        const suggestions = [];
        // Add context-specific suggestions
        if (context?.command) {
            suggestions.push(`Run 'skills-cli ${context.command} --help' for usage examples`);
        }
        // Add error-type specific suggestions
        switch (errorType) {
            case ErrorType.VALIDATION:
                suggestions.push('Check input format and requirements');
                suggestions.push('Refer to documentation for valid inputs');
                break;
            case ErrorType.CONFIGURATION:
                suggestions.push('Run "skills-cli config --validate" to check configuration');
                suggestions.push('Verify configuration file syntax and values');
                break;
            case ErrorType.PERMISSION:
                suggestions.push('Check file and directory permissions');
                suggestions.push('Try running with elevated privileges if necessary');
                break;
            case ErrorType.NETWORK:
                suggestions.push('Check internet connection');
                suggestions.push('Verify service availability');
                suggestions.push('Try again in a few moments');
                break;
            case ErrorType.TEMPORARY:
                suggestions.push('Try again in a few moments');
                suggestions.push('Check system resources');
                break;
            case ErrorType.SYSTEM:
                suggestions.push('Check system logs for more details');
                suggestions.push('Report this issue if it persists');
                break;
            case ErrorType.USER:
                suggestions.push('Review command usage and arguments');
                suggestions.push('Check the command documentation');
                break;
        }
        // Add general suggestions
        suggestions.push('Visit https://docs.skills-fabrik.com for help');
        suggestions.push('Report issues at https://github.com/skills-fabrik/issues');
        return suggestions.slice(0, 5); // Limit to 5 suggestions
    }
    /**
     * Attempt error recovery
     */
    async attemptRecovery(error, context) {
        switch (error.constructor.name) {
            case 'ValidationError':
                return this.recoverFromValidationError(error, context);
            case 'PermissionError':
                return this.recoverFromPermissionError(error, context);
            case 'ConfigurationError':
                return this.recoverFromConfigurationError(error, context);
            case 'NetworkError':
                return this.recoverFromNetworkError(error, context);
            case 'TemporaryError':
                return this.recoverFromTemporaryError(error, context);
            default:
                return { recovered: false };
        }
    }
    async recoverFromValidationError(error, context) {
        // Auto-fix common validation issues
        if (error.message.includes('Empty input') && context?.args) {
            return {
                recovered: true,
                suggestion: 'Please provide the required input parameter'
            };
        }
        if (error.message.includes('File not found') && context?.args) {
            const filePath = context.args[0];
            return {
                recovered: false,
                suggestion: `Check if the file exists: ${filePath}`
            };
        }
        return { recovered: false };
    }
    async recoverFromPermissionError(error, context) {
        if (context?.args && context.args.length > 0) {
            const resource = context.args[0];
            return {
                recovered: false,
                suggestion: `Check permissions for: ${resource}`,
                action: async () => {
                    // Suggest permission check command
                    return Promise.resolve();
                }
            };
        }
        return { recovered: false };
    }
    async recoverFromConfigurationError(error, context) {
        return {
            recovered: false,
            suggestion: 'Run "skills-cli config --validate" to check configuration'
        };
    }
    async recoverFromNetworkError(error, context) {
        return {
            recovered: false,
            suggestion: 'Check internet connection and try again'
        };
    }
    async recoverFromTemporaryError(error, context) {
        return {
            recovered: false,
            suggestion: 'Try again in a few moments'
        };
    }
}
// Export singleton instance
export const errorHandler = CLIErrorHandler.getInstance();
//# sourceMappingURL=error-handler.js.map