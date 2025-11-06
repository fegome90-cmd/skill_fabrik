/**
 * CLI Error Handler - Centralized Error Management (JavaScript version)
 * Implements standardized error handling with consistent exit codes and user-friendly messages
 */

/**
 * Exit Code Constants (following sysexits.h standard)
 */
const EXIT_CODES = {
  SUCCESS: 0,              // Successful operation
  GENERAL_ERROR: 1,         // General error (user error)
  SYSTEM_ERROR: 2,          // System error (internal)
  USAGE_ERROR: 64,          // Usage error (invalid arguments)
  DATA_ERROR: 65,           // Data error (invalid input)
  NO_INPUT: 66,             // No input provided
  SOFTWARE_ERROR: 70,       // Internal software error
  CONFIG_ERROR: 78,         // Configuration error
  NETWORK_ERROR: 76,        // Network error
  PERMISSION_ERROR: 77,      // Permission error
  TEMPORARY_FAILURE: 75,    // Temporary failure
};

/**
 * Error Types
 */
const ERROR_TYPES = {
  VALIDATION: 'ValidationError',
  CONFIGURATION: 'ConfigurationError',
  SYSTEM: 'SystemError',
  USER: 'UserError',
  NETWORK: 'NetworkError',
  PERMISSION: 'PermissionError',
  TEMPORARY: 'TemporaryError'
};

/**
 * Base CLI Error class
 */
class CLIError extends Error {
  constructor(message, code, type, context = null, suggestions = []) {
    super(message);
    this.name = 'CLIError';
    this.code = code;
    this.type = type;
    this.context = context;
    this.suggestions = suggestions;
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
class ValidationError extends CLIError {
  constructor(message, field = null, value = null, expected = null, context = null) {
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

    super(message, EXIT_CODES.DATA_ERROR, ERROR_TYPES.VALIDATION, context, suggestions);
    this.field = field;
    this.value = value;
    this.expected = expected;
  }
}

/**
 * Configuration Error - Configuration issues
 */
class ConfigurationError extends CLIError {
  constructor(message, configPath = null, context = null) {
    const suggestions = [];
    if (configPath) {
      suggestions.push(`Check configuration file: ${configPath}`);
      suggestions.push('Run "skills-cli config --validate" to check configuration');
    }
    suggestions.push('Refer to documentation for configuration options');

    super(message, EXIT_CODES.CONFIG_ERROR, ERROR_TYPES.CONFIGURATION, context, suggestions);
    this.configPath = configPath;
  }
}

/**
 * System Error - Internal system failures
 */
class SystemError extends CLIError {
  constructor(message, component = null, operation = null, context = null) {
    const suggestions = [
      'Check system logs for more details',
      'Try restarting the CLI tool',
      'Report this issue if it persists'
    ];

    super(message, EXIT_CODES.SYSTEM_ERROR, ERROR_TYPES.SYSTEM, context, suggestions);
    this.component = component;
    this.operation = operation;
  }
}

/**
 * User Error - User action errors
 */
class UserError extends CLIError {
  constructor(message, action = null, context = null) {
    const suggestions = [];
    if (action) {
      suggestions.push(`Review the ${action} command usage`);
      suggestions.push(`Run "skills-cli ${action} --help" for usage examples`);
    }
    suggestions.push('Check the command documentation');

    super(message, EXIT_CODES.GENERAL_ERROR, ERROR_TYPES.USER, context, suggestions);
    this.action = action;
  }
}

/**
 * Network Error - Network connectivity issues
 */
class NetworkError extends CLIError {
  constructor(message, endpoint = null, context = null) {
    const suggestions = [
      'Check internet connection',
      'Verify service availability',
      'Try again later'
    ];

    super(message, EXIT_CODES.NETWORK_ERROR, ERROR_TYPES.NETWORK, context, suggestions);
    this.endpoint = endpoint;
  }
}

/**
 * Permission Error - Permission access issues
 */
class PermissionError extends CLIError {
  constructor(message, resource = null, context = null) {
    const suggestions = [];
    if (resource) {
      suggestions.push(`Check permissions for: ${resource}`);
      suggestions.push('Try running with elevated privileges if necessary');
    }
    suggestions.push('Verify user access rights');

    super(message, EXIT_CODES.PERMISSION_ERROR, ERROR_TYPES.PERMISSION, context, suggestions);
    this.resource = resource;
  }
}

/**
 * Temporary Error - Transient failures
 */
class TemporaryError extends CLIError {
  constructor(message, context = null) {
    const suggestions = [
      'Try again in a few moments',
      'Check system resources',
      'Verify service status'
    ];

    super(message, EXIT_CODES.TEMPORARY_FAILURE, ERROR_TYPES.TEMPORARY, context, suggestions);
  }
}

/**
 * Message Formatter for error messages
 */
class MessageFormatter {
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
    if (code === EXIT_CODES.SUCCESS) return '✅';
    if (code < 10) return '❌';
    if (code < 20) return '⚠️';
    if (code < 70) return '🔥';
    return '💥';
  }

  /**
   * Format success message
   */
  static formatSuccess(message, context = null) {
    let formatted = `✅ ${message}`;

    if (context?.duration) {
      formatted += ` (${context.duration}ms)`;
    }

    return formatted;
  }

  /**
   * Format warning message
   */
  static formatWarning(message, context = null) {
    return `⚠️  ${message}`;
  }

  /**
   * Format info message
   */
  static formatInfo(message, context = null) {
    return `ℹ️  ${message}`;
  }
}

/**
 * CLI Error Handler - Centralized error management
 */
class CLIErrorHandler {
  constructor() {
    this.instance = null;
  }

  static getInstance() {
    if (!CLIErrorHandler.instance) {
      CLIErrorHandler.instance = new CLIErrorHandler();
    }
    return CLIErrorHandler.instance;
  }

  /**
   * Handle any error and return CLI output
   */
  handleError(error, context = null) {
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
  handleSuccess(message, context = null) {
    const formattedMessage = MessageFormatter.formatSuccess(message, context);

    return {
      stdout: formattedMessage,
      exitCode: EXIT_CODES.SUCCESS,
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
  wrapError(error, context = null) {
    if (error instanceof CLIError) {
      return error;
    }

    // Determine error type based on error content
    const errorType = this.determineErrorType(error, context);
    const exitCode = this.determineExitCode(errorType, error);

    // Generate suggestions based on error
    const suggestions = this.generateSuggestions(error, errorType, context);

    return new CLIError(
      error.message,
      exitCode,
      errorType,
      context,
      suggestions
    );
  }

  /**
   * Determine error type from error content
   */
  determineErrorType(error, context = null) {
    const message = error.message.toLowerCase();

    // Check for specific error patterns
    if (message.includes('permission') || message.includes('access denied') || message.includes('eacces')) {
      return ERROR_TYPES.PERMISSION;
    }

    if (message.includes('network') || message.includes('connection') || message.includes('timeout')) {
      return ERROR_TYPES.NETWORK;
    }

    if (message.includes('configuration') || message.includes('config') || message.includes('settings')) {
      return ERROR_TYPES.CONFIGURATION;
    }

    if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
      return ERROR_TYPES.VALIDATION;
    }

    if (message.includes('temporary') || message.includes('retry') || message.includes('later')) {
      return ERROR_TYPES.TEMPORARY;
    }

    if (message.includes('system') || message.includes('internal') || message.includes('unexpected')) {
      return ERROR_TYPES.SYSTEM;
    }

    // Default to user error
    return ERROR_TYPES.USER;
  }

  /**
   * Determine exit code based on error type
   */
  determineExitCode(errorType, error) {
    switch (errorType) {
      case ERROR_TYPES.PERMISSION:
        return EXIT_CODES.PERMISSION_ERROR;
      case ERROR_TYPES.NETWORK:
        return EXIT_CODES.NETWORK_ERROR;
      case ERROR_TYPES.CONFIGURATION:
        return EXIT_CODES.CONFIG_ERROR;
      case ERROR_TYPES.VALIDATION:
        return EXIT_CODES.DATA_ERROR;
      case ERROR_TYPES.TEMPORARY:
        return EXIT_CODES.TEMPORARY_FAILURE;
      case ERROR_TYPES.SYSTEM:
        return EXIT_CODES.SOFTWARE_ERROR;
      case ERROR_TYPES.USER:
      default:
        return EXIT_CODES.GENERAL_ERROR;
    }
  }

  /**
   * Generate contextual suggestions for errors
   */
  generateSuggestions(error, errorType, context = null) {
    const suggestions = [];

    // Add context-specific suggestions
    if (context?.command) {
      suggestions.push(`Run 'skills-cli ${context.command} --help' for usage examples`);
    }

    // Add error-type specific suggestions
    switch (errorType) {
      case ERROR_TYPES.VALIDATION:
        suggestions.push('Check input format and requirements');
        suggestions.push('Refer to documentation for valid inputs');
        break;

      case ERROR_TYPES.CONFIGURATION:
        suggestions.push('Run "skills-cli config --validate" to check configuration');
        suggestions.push('Verify configuration file syntax and values');
        break;

      case ERROR_TYPES.PERMISSION:
        suggestions.push('Check file and directory permissions');
        suggestions.push('Try running with elevated privileges if necessary');
        break;

      case ERROR_TYPES.NETWORK:
        suggestions.push('Check internet connection');
        suggestions.push('Verify service availability');
        suggestions.push('Try again in a few moments');
        break;

      case ERROR_TYPES.TEMPORARY:
        suggestions.push('Try again in a few moments');
        suggestions.push('Check system resources');
        break;

      case ERROR_TYPES.SYSTEM:
        suggestions.push('Check system logs for more details');
        suggestions.push('Report this issue if it persists');
        break;

      case ERROR_TYPES.USER:
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
  async attemptRecovery(error, context = null) {
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

  async recoverFromValidationError(error, context = null) {
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

  async recoverFromPermissionError(error, context = null) {
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

  async recoverFromConfigurationError(error, context = null) {
    return {
      recovered: false,
      suggestion: 'Run "skills-cli config --validate" to check configuration'
    };
  }

  async recoverFromNetworkError(error, context = null) {
    return {
      recovered: false,
      suggestion: 'Check internet connection and try again'
    };
  }

  async recoverFromTemporaryError(error, context = null) {
    return {
      recovered: false,
      suggestion: 'Try again in a few moments'
    };
  }
}

// Export singleton instance
const errorHandler = CLIErrorHandler.getInstance();

module.exports = {
  // Exit codes and types
  EXIT_CODES,
  ERROR_TYPES,

  // Error classes
  CLIError,
  ValidationError,
  ConfigurationError,
  SystemError,
  UserError,
  NetworkError,
  PermissionError,
  TemporaryError,

  // Utilities
  MessageFormatter,
  CLIErrorHandler,
  errorHandler
};