/**
 * Advanced CLI Error Handler - Enterprise-level Error Management
 * Enhanced error handling with sophisticated recovery strategies and monitoring
 */

const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

// Enhanced exit codes with enterprise compliance
const EXIT_CODES = {
  SUCCESS: 0,
  GENERAL_ERROR: 1,
  SYSTEM_ERROR: 2,
  USAGE_ERROR: 64,
  DATA_ERROR: 65,
  NO_INPUT: 66,
  SOFTWARE_ERROR: 70,
  CONFIG_ERROR: 78,
  NETWORK_ERROR: 76,
  PERMISSION_ERROR: 77,
  TEMPORARY_FAILURE: 75,
  TIMEOUT_ERROR: 124,
  OUT_OF_MEMORY: 137,
  DISK_FULL: 28,
  PROTOCOL_ERROR: 71,
  CANT_CREATE: 73,
  INPUT_OUTPUT_ERROR: 74,
  BUSY: 125,
};

// Enhanced error types with categorization
const ERROR_TYPES = {
  VALIDATION: 'ValidationError',
  CONFIGURATION: 'ConfigurationError',
  SYSTEM: 'SystemError',
  USER: 'UserError',
  NETWORK: 'NetworkError',
  PERMISSION: 'PermissionError',
  TEMPORARY: 'TemporaryError',
  TIMEOUT: 'TimeoutError',
  MEMORY: 'MemoryError',
  DISK: 'DiskError',
  PROTOCOL: 'ProtocolError',
  BUSINESS: 'BusinessLogicError',
  INTEGRATION: 'IntegrationError',
  PERFORMANCE: 'PerformanceError',
  SECURITY: 'SecurityError',
};

// Error severity levels
const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

/**
 * Enhanced error context with detailed information
 */
class ErrorContext {
  constructor(data = {}) {
    this.command = data.command || 'unknown';
    this.args = data.args || [];
    this.component = data.component || 'unknown';
    this.operation = data.operation || 'unknown';
    this.details = data.details || '';
    this.duration = data.duration || 0;
    this.timestamp = Date.now();
    this.stackTrace = data.stackTrace || '';
    this.environment = data.environment || {};
    this.userSession = data.userSession || {};
    this.requestId = data.requestId || this.generateRequestId();
    this.correlationId = data.correlationId || '';
    this.metadata = data.metadata || {};
  }

  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  toJSON() {
    return {
      command: this.command,
      args: this.args,
      component: this.component,
      operation: this.operation,
      details: this.details,
      duration: this.duration,
      timestamp: this.timestamp,
      environment: this.environment,
      userSession: this.userSession,
      requestId: this.requestId,
      correlationId: this.correlationId,
      metadata: this.metadata
    };
  }
}

/**
 * Enhanced CLI Error with enterprise features
 */
class AdvancedCLIError extends Error {
  constructor(message, code, type, context = null, severity = ERROR_SEVERITY.MEDIUM, suggestions = [], recoveryStrategies = []) {
    super(message);
    this.name = 'AdvancedCLIError';
    this.code = code;
    this.type = type;
    this.context = context;
    this.severity = severity;
    this.suggestions = suggestions;
    this.recoveryStrategies = recoveryStrategies;
    this.timestamp = Date.now();
    this.occurrences = 1;
    this.firstOccurrence = this.timestamp;
    this.lastOccurrence = this.timestamp;
    this.resolved = false;
    this.resolution = null;
  }

  /**
   * Mark error as resolved
   */
  markResolved(resolution) {
    this.resolved = true;
    this.resolution = {
      method: resolution.method || 'manual',
      timestamp: Date.now(),
      duration: Date.now() - this.firstOccurrence,
      details: resolution.details || ''
    };
  }

  /**
   * Track error recurrence
   */
  trackRecurrence() {
    this.occurrences++;
    this.lastOccurrence = Date.now();
  }

  /**
   * Get error age in milliseconds
   */
  getAge() {
    return Date.now() - this.firstOccurrence;
  }

  /**
   * Check if error is stale (older than specified time)
   */
  isStale(maxAge = 5 * 60 * 1000) { // 5 minutes default
    return this.getAge() > maxAge;
  }

  /**
   * Get formatted error message with enterprise details
   */
  getFormattedMessage() {
    return EnhancedMessageFormatter.formatError(this);
  }

  /**
   * Get user-friendly description
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

  /**
   * Get recovery strategies
   */
  getRecoveryStrategies() {
    return this.recoveryStrategies || [];
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      type: this.type,
      severity: this.severity,
      context: this.context?.toJSON(),
      suggestions: this.suggestions,
      recoveryStrategies: this.recoveryStrategies,
      timestamp: this.timestamp,
      occurrences: this.occurrences,
      firstOccurrence: this.firstOccurrence,
      lastOccurrence: this.lastOccurrence,
      resolved: this.resolved,
      resolution: this.resolution,
      stack: this.stack
    };
  }
}

/**
 * Specific enhanced error types
 */
class ValidationAdvancedError extends AdvancedCLIError {
  constructor(message, field = null, value = null, expected = null, context = null) {
    const suggestions = [];
    const recoveryStrategies = [];

    if (field) {
      suggestions.push(`Check the ${field} parameter format`);
      if (expected) {
        suggestions.push(`Expected format: ${expected}`);
      }
      recoveryStrategies.push({
        name: 'format_validation',
        description: 'Auto-format the input value',
        action: () => this.attemptAutoFormat(value, expected)
      });
    }

    if (value && expected) {
      suggestions.push(`Received: "${value}"`);
    }

    super(message, EXIT_CODES.DATA_ERROR, ERROR_TYPES.VALIDATION, context, ERROR_SEVERITY.MEDIUM, suggestions, recoveryStrategies);
    this.field = field;
    this.value = value;
    this.expected = expected;
  }

  attemptAutoFormat(value, expected) {
    // Simple auto-format implementation
    try {
      if (typeof value === 'string' && expected === 'lowercase') {
        return value.toLowerCase();
      }
      if (typeof value === 'string' && expected === 'uppercase') {
        return value.toUpperCase();
      }
    } catch (error) {
      // Auto-format failed
    }
    return value;
  }
}

class ConfigurationAdvancedError extends AdvancedCLIError {
  constructor(message, configPath = null, context = null) {
    const suggestions = [];
    const recoveryStrategies = [];

    if (configPath) {
      suggestions.push(`Check configuration file: ${configPath}`);
      suggestions.push('Run "skills-cli config --validate" to check configuration');
      recoveryStrategies.push({
        name: 'config_validation',
        description: 'Validate and auto-fix configuration',
        action: () => this.validateAndFixConfig(configPath)
      });
    }

    suggestions.push('Refer to documentation for configuration options');
    recoveryStrategies.push({
      name: 'reset_config',
      description: 'Reset to default configuration',
      action: () => this.resetToDefaults()
    });

    super(message, EXIT_CODES.CONFIG_ERROR, ERROR_TYPES.CONFIGURATION, context, ERROR_SEVERITY.HIGH, suggestions, recoveryStrategies);
    this.configPath = configPath;
  }

  validateAndFixConfig(configPath) {
    try {
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        // Validate and fix common config issues
        if (!config.version) {
          config.version = '1.0.0';
          fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
          return { fixed: true, issues: ['Missing version field'] };
        }
      }
    } catch (error) {
      return { fixed: false, error: error.message };
    }
    return { fixed: false, issues: [] };
  }

  resetToDefaults() {
    return { action: 'reset_config', status: 'not_implemented' };
  }
}

class SystemAdvancedError extends AdvancedCLIError {
  constructor(message, component = null, operation = null, context = null) {
    const suggestions = [
      'Check system logs for more details',
      'Try restarting the CLI tool',
      'Report this issue if it persists',
      'Check system resources (memory, disk space)'
    ];

    const recoveryStrategies = [
      {
        name: 'system_diagnostic',
        description: 'Run system diagnostic',
        action: () => this.runSystemDiagnostic()
      },
      {
        name: 'resource_cleanup',
        description: 'Clean up system resources',
        action: () => this.cleanupResources()
      }
    ];

    super(message, EXIT_CODES.SYSTEM_ERROR, ERROR_TYPES.SYSTEM, context, ERROR_SEVERITY.HIGH, suggestions, recoveryStrategies);
    this.component = component;
    this.operation = operation;
  }

  runSystemDiagnostic() {
    const diagnostics = {
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      platform: process.platform,
      nodeVersion: process.version
    };
    return diagnostics;
  }

  cleanupResources() {
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    return { action: 'gc_completed', timestamp: Date.now() };
  }
}

class NetworkAdvancedError extends AdvancedCLIError {
  constructor(message, endpoint = null, statusCode = null, context = null) {
    const suggestions = [
      'Check internet connection',
      'Verify service availability',
      'Try again in a few moments',
      'Check firewall settings'
    ];

    const recoveryStrategies = [
      {
        name: 'retry_with_backoff',
        description: 'Retry with exponential backoff',
        action: () => this.retryWithBackoff()
      },
      {
        name: 'check_connectivity',
        description: 'Check network connectivity',
        action: () => this.checkConnectivity()
      }
    ];

    super(message, EXIT_CODES.NETWORK_ERROR, ERROR_TYPES.NETWORK, context, ERROR_SEVERITY.MEDIUM, suggestions, recoveryStrategies);
    this.endpoint = endpoint;
    this.statusCode = statusCode;
  }

  retryWithBackoff() {
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second

    return {
      maxRetries,
      baseDelay,
      strategy: 'exponential_backoff',
      nextRetry: (attempt) => baseDelay * Math.pow(2, attempt)
    };
  }

  checkConnectivity() {
    return {
      action: 'connectivity_check',
      endpoints: ['8.8.8.8:53', '1.1.1.1:53'],
      timeout: 5000
    };
  }
}

/**
 * Enhanced Message Formatter with enterprise features
 */
class EnhancedMessageFormatter {
  static formatError(error) {
    let message = '';

    // Header with severity indicator
    const severityIcon = this.getSeverityIcon(error.severity);
    message += `${severityIcon} ${error.severity.toUpperCase()}: ${error.message}\n`;

    // Error details
    message += `\n📋 Error Details:`;
    message += `\n   Type: ${error.type}`;
    message += `\n   Code: ${error.code}`;
    message += `\n   Severity: ${error.severity.toUpperCase()}`;

    if (error.context) {
      message += `\n\n🔧 Context Information:`;
      message += `\n   Command: ${error.context.command}`;
      if (error.context.args && error.context.args.length > 0) {
        message += `\n   Args: ${error.context.args.join(' ')}`;
      }
      if (error.context.component) {
        message += `\n   Component: ${error.context.component}`;
        if (error.context.operation) {
          message += ` (${error.context.operation})`;
        }
      }
      message += `\n   Request ID: ${error.context.requestId}`;
      message += `\n   Timestamp: ${new Date(error.context.timestamp).toISOString()}`;
    }

    // Additional details
    if (error.context?.details) {
      message += `\n   Details: ${error.context.details}`;
    }

    // Occurrence information
    if (error.occurrences > 1) {
      message += `\n\n📊 Occurrence Information:`;
      message += `\n   Count: ${error.occurrences}`;
      message += `\n   First: ${new Date(error.firstOccurrence).toISOString()}`;
      message += `\n   Last: ${new Date(error.lastOccurrence).toISOString()}`;
      message += `\n   Age: ${Math.round(error.getAge() / 1000)}s`;
    }

    // Recovery strategies
    if (error.recoveryStrategies && error.recoveryStrategies.length > 0) {
      message += `\n\n🔧 Available Recovery Strategies:`;
      error.recoveryStrategies.forEach((strategy, index) => {
        message += `\n   ${index + 1}. ${strategy.name}: ${strategy.description}`;
      });
    }

    // Suggestions
    if (error.suggestions && error.suggestions.length > 0) {
      message += `\n\n💡 Suggestions:`;
      error.suggestions.forEach((suggestion, index) => {
        message += `\n   ${index + 1}. ${suggestion}`;
      });
    }

    // Help reference
    if (error.context?.command) {
      message += `\n\nℹ️  Help: Run 'skills-cli ${error.context.command} --help' for more information`;
    }

    // Debug information
    if (process.env.DEBUG === 'true') {
      message += `\n\n🔍 Debug Information:`;
      message += `\n   Exit Code: ${error.code}`;
      message += `\n   Error Type: ${error.constructor.name}`;
      message += `\n   Stack Trace: ${error.stack ? 'Available' : 'Not available'}`;
      message += `\n   Request ID: ${error.context?.requestId || 'N/A'}`;
    }

    // Enterprise compliance
    if (error.severity === ERROR_SEVERITY.CRITICAL) {
      message += `\n\n⚠️  CRITICAL ERROR: Immediate attention required`;
      message += `\n   This error has been logged and may trigger alerts`;
    }

    return message;
  }

  static getSeverityIcon(severity) {
    switch (severity) {
      case ERROR_SEVERITY.CRITICAL: return '🚨';
      case ERROR_SEVERITY.HIGH: return '❌';
      case ERROR_SEVERITY.MEDIUM: return '⚠️';
      case ERROR_SEVERITY.LOW: return 'ℹ️';
      default: return '❓';
    }
  }

  static formatSuccess(message, context = null) {
    let formatted = `✅ ${message}`;

    if (context?.duration) {
      formatted += ` (${context.duration}ms)`;
    }

    if (context?.requestId) {
      formatted += ` [Request: ${context.requestId}]`;
    }

    return formatted;
  }

  static formatWarning(message, context = null) {
    let formatted = `⚠️  ${message}`;

    if (context?.requestId) {
      formatted += ` [Request: ${context.requestId}]`;
    }

    return formatted;
  }

  static formatInfo(message, context = null) {
    let formatted = `ℹ️  ${message}`;

    if (context?.requestId) {
      formatted += ` [Request: ${context.requestId}]`;
    }

    return formatted;
  }
}

/**
 * Error Analytics and Monitoring
 */
class ErrorAnalytics {
  constructor() {
    this.errors = new Map(); // errorId -> error instance
    this.metrics = {
      totalErrors: 0,
      errorsByType: {},
      errorsBySeverity: {},
      errorsByComponent: {},
      resolutionRate: 0,
      averageResolutionTime: 0,
      errorRate: 0
    };
    this.events = new EventEmitter();
  }

  recordError(error) {
    const errorId = this.generateErrorId(error);

    if (this.errors.has(errorId)) {
      // Track recurrence
      const existingError = this.errors.get(errorId);
      existingError.trackRecurrence();
    } else {
      // New error
      this.errors.set(errorId, error);
      this.metrics.totalErrors++;
      this.updateMetrics(error);
    }

    // Emit event for monitoring
    this.events.emit('error', error);

    return errorId;
  }

  resolveError(errorId, resolution) {
    const error = this.errors.get(errorId);
    if (error) {
      error.markResolved(resolution);
      this.updateResolutionMetrics(error);
      this.events.emit('error_resolved', error);
    }
  }

  generateErrorId(error) {
    const base = `${error.type}_${error.code}`;
    const hash = require('crypto')
      .createHash('md5')
      .update(`${base}_${error.message}_${error.timestamp}`)
      .digest('hex')
      .substring(0, 8);
    return hash;
  }

  updateMetrics(error) {
    // Update type metrics
    this.metrics.errorsByType[error.type] = (this.metrics.errorsByType[error.type] || 0) + 1;

    // Update severity metrics
    this.metrics.errorsBySeverity[error.severity] = (this.metrics.errorsBySeverity[error.severity] || 0) + 1;

    // Update component metrics
    if (error.context?.component) {
      this.metrics.errorsByComponent[error.context.component] = (this.metrics.errorsByComponent[error.context.component] || 0) + 1;
    }
  }

  updateResolutionMetrics(error) {
    const resolvedErrors = Array.from(this.errors.values()).filter(e => e.resolved).length;
    const totalErrors = this.errors.size;

    if (totalErrors > 0) {
      this.metrics.resolutionRate = (resolvedErrors / totalErrors) * 100;

      const totalResolutionTime = Array.from(this.errors.values())
        .filter(e => e.resolved && e.resolution)
        .reduce((sum, e) => sum + e.resolution.duration, 0);

      this.metrics.averageResolutionTime = totalResolutionTime / resolvedErrors;
    }
  }

  getMetrics() {
    return { ...this.metrics };
  }

  getErrorTrends(timeWindow = 3600000) { // 1 hour default
    const cutoff = Date.now() - timeWindow;
    const recentErrors = Array.from(this.errors.values())
      .filter(error => error.lastOccurrence > cutoff);

    return {
      total: recentErrors.length,
      byType: this.aggregateErrorsByType(recentErrors),
      bySeverity: this.aggregateErrorsBySeverity(recentErrors),
      topErrors: this.getTopErrors(recentErrors, 5)
    };
  }

  aggregateErrorsByType(errors) {
    const aggregated = {};
    errors.forEach(error => {
      aggregated[error.type] = (aggregated[error.type] || 0) + 1;
    });
    return aggregated;
  }

  aggregateErrorsBySeverity(errors) {
    const aggregated = {};
    errors.forEach(error => {
      aggregated[error.severity] = (aggregated[error.severity] || 0) + 1;
    });
    return aggregated;
  }

  getTopErrors(errors, limit = 5) {
    const errorCounts = {};

    errors.forEach(error => {
      const key = `${error.type}: ${error.message}`;
      errorCounts[key] = (errorCounts[key] || 0) + error.occurrences;
    });

    return Object.entries(errorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([message, count]) => ({ message, count }));
  }
}

/**
 * Advanced CLI Error Handler
 * Enterprise-level error management with analytics and monitoring
 */
class AdvancedCLIErrorHandler {
  constructor() {
    if (AdvancedCLIErrorHandler.instance) {
      return AdvancedCLIErrorHandler.instance;
    }

    this.instance = new AdvancedCLIHandler();
    this.analytics = new ErrorAnalytics();
    this.recoveryStrategies = new Map();
    this.circuitBreaker = {
      state: 'CLOSED',
      failures: 0,
      lastFailure: 0,
      timeout: 60000, // 1 minute
    };

    AdvancedCLIErrorHandler.instance = this;
  }

  static getInstance() {
    return new AdvancedCLIErrorHandler();
  }

  /**
   * Handle any error with enterprise-level processing
   */
  handleError(error, context = null) {
    const cliError = this.wrapError(error, context);
    const errorId = this.analytics.recordError(cliError);

    // Check circuit breaker
    if (this.circuitBreaker.state === 'OPEN') {
      return this.createCircuitBreakerResponse(cliError, context);
    }

    const formattedMessage = cliError.getFormattedMessage();
    const exitCode = cliError.code;

    // Attempt recovery
    const recovery = this.attemptRecovery(cliError, context);

    // Update circuit breaker
    this.updateCircuitBreaker(cliError);

    return {
      stderr: formattedMessage,
      exitCode,
      metadata: {
        timestamp: Date.now(),
        command: context?.command || 'unknown',
        args: context?.args || [],
        errorType: cliError.constructor.name,
        severity: cliError.severity,
        duration: context?.duration || 0,
        component: context?.component,
        operation: context?.operation,
        requestId: context?.requestId,
        errorId,
        recovery,
        analytics: this.analytics.getMetrics()
      }
    };
  }

  /**
   * Handle success with enterprise metrics
   */
  handleSuccess(message, context = null) {
    const formattedMessage = EnhancedMessageFormatter.formatSuccess(message, context);

    // Reset circuit breaker on success
    if (this.circuitBreaker.state !== 'CLOSED') {
      this.circuitBreaker.state = 'CLOSED';
      this.circuitBreaker.failures = 0;
    }

    return {
      stdout: formattedMessage,
      exitCode: EXIT_CODES.SUCCESS,
      metadata: {
        timestamp: Date.now(),
        command: context?.command || 'unknown',
        args: context?.args || [],
        duration: context?.duration || 0,
        requestId: context?.requestId,
        circuitBreakerState: this.circuitBreaker.state,
        analytics: this.analytics.getMetrics()
      }
    };
  }

  /**
   * Wrap regular errors in enhanced CLI error
   */
  wrapError(error, context = null) {
    if (error instanceof AdvancedCLIError) {
      return error;
    }

    // Determine error type and severity
    const errorType = this.determineErrorType(error, context);
    const severity = this.determineSeverity(error, errorType, context);
    const exitCode = this.determineExitCode(errorType, error);

    // Generate contextual suggestions
    const suggestions = this.generateSuggestions(error, errorType, context);
    const recoveryStrategies = this.generateRecoveryStrategies(error, errorType, context);

    return new AdvancedCLIError(
      error.message,
      exitCode,
      errorType,
      new ErrorContext({
        ...context,
        severity,
        stackTrace: error.stack
      }),
      severity,
      suggestions,
      recoveryStrategies
    );
  }

  determineErrorType(error, context) {
    const message = error.message.toLowerCase();

    // Check for specific patterns
    if (message.includes('timeout') || message.includes('timed out')) {
      return ERROR_TYPES.TIMEOUT;
    }

    if (message.includes('memory') || message.includes('out of memory')) {
      return ERROR_TYPES.MEMORY;
    }

    if (message.includes('disk') || message.includes('no space left')) {
      return ERROR_TYPES.DISK;
    }

    if (message.includes('permission') || message.includes('access denied') || message.includes('eacces')) {
      return ERROR_TYPES.PERMISSION;
    }

    if (message.includes('network') || message.includes('connection') || message.includes('timeout')) {
      return ERROR_TYPES.NETWORK;
    }

    if (message.includes('protocol') || message.includes('invalid protocol')) {
      return ERROR_TYPES.PROTOCOL;
    }

    if (message.includes('configuration') || message.includes('config') || message.includes('settings')) {
      return ERROR_TYPES.CONFIGURATION;
    }

    if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
      return ERROR_TYPES.VALIDATION;
    }

    if (message.includes('business') || message.includes('rule') || message.includes('policy')) {
      return ERROR_TYPES.BUSINESS;
    }

    if (message.includes('integration') || message.includes('api') || message.includes('service')) {
      return ERROR_TYPES.INTEGRATION;
    }

    if (message.includes('performance') || message.includes('slow') || message.includes('timeout')) {
      return ERROR_TYPES.PERFORMANCE;
    }

    if (message.includes('security') || message.includes('unauthorized') || message.includes('forbidden')) {
      return ERROR_TYPES.SECURITY;
    }

    if (message.includes('system') || message.includes('internal') || message.includes('unexpected')) {
      return ERROR_TYPES.SYSTEM;
    }

    return ERROR_TYPES.USER;
  }

  determineSeverity(error, errorType, context) {
    // Critical errors
    if (errorType === ERROR_TYPES.SECURITY ||
        errorType === ERROR_TYPES.SYSTEM ||
        errorType === ERROR_TYPES.DISK) {
      return ERROR_SEVERITY.CRITICAL;
    }

    // High severity errors
    if (errorType === ERROR_TYPES.NETWORK ||
        errorType === ERROR_TYPES.CONFIGURATION ||
        errorType === ERROR_TYPES.PERMISSION) {
      return ERROR_SEVERITY.HIGH;
    }

    // Medium severity errors
    if (errorType === ERROR_TYPES.VALIDATION ||
        errorType === ERROR_TYPES.BUSINESS ||
        errorType === ERROR_TYPES.INTEGRATION) {
      return ERROR_SEVERITY.MEDIUM;
    }

    // Low severity errors
    return ERROR_SEVERITY.LOW;
  }

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
      case ERROR_TYPES.TIMEOUT:
        return EXIT_CODES.TIMEOUT_ERROR;
      case ERROR_TYPES.MEMORY:
        return EXIT_CODES.OUT_OF_MEMORY;
      case ERROR_TYPES.DISK:
        return EXIT_CODES.DISK_FULL;
      case ERROR_TYPES.PROTOCOL:
        return EXIT_CODES.PROTOCOL_ERROR;
      case ERROR_TYPES.SYSTEM:
        return EXIT_CODES.SYSTEM_ERROR;
      case ERROR_TYPES.TEMPORARY:
        return EXIT_CODES.TEMPORARY_FAILURE;
      case ERROR_TYPES.BUSINESS:
        return EXIT_CODES.GENERAL_ERROR;
      case ERROR_TYPES.INTEGRATION:
        return EXIT_CODES.SOFTWARE_ERROR;
      case ERROR_TYPES.PERFORMANCE:
        return EXIT_CODES.GENERAL_ERROR;
      case ERROR_TYPES.SECURITY:
        return EXIT_CODES.PERMISSION_ERROR;
      case ERROR_TYPES.USER:
      default:
        return EXIT_CODES.GENERAL_ERROR;
    }
  }

  generateSuggestions(error, errorType, context) {
    const suggestions = [];

    // Context-specific suggestions
    if (context?.command) {
      suggestions.push(`Run 'skills-cli ${context.command} --help' for usage examples`);
    }

    // Error-type specific suggestions
    switch (errorType) {
      case ERROR_TYPES.VALIDATION:
        suggestions.push('Check input format and requirements');
        suggestions.push('Refer to documentation for valid inputs');
        suggestions.push('Use --validate flag to pre-check inputs');
        break;

      case ERROR_TYPES.CONFIGURATION:
        suggestions.push('Run "skills-cli config --validate" to check configuration');
        suggestions.push('Verify configuration file syntax and values');
        suggestions.push('Check environment variables');
        break;

      case ERROR_TYPES.PERMISSION:
        suggestions.push('Check file and directory permissions');
        suggestions.push('Try running with elevated privileges if necessary');
        suggestions.push('Verify user access rights');
        break;

      case ERROR_TYPES.NETWORK:
        suggestions.push('Check internet connection');
        suggestions.push('Verify service availability');
        suggestions.push('Try again in a few moments');
        suggestions.push('Check firewall settings');
        break;

      case ERROR_TYPES.TIMEOUT:
        suggestions.push('Increase timeout value');
        suggestions.push('Check system resources');
        suggestions.push('Try with smaller data sets');
        break;

      case ERROR_TYPES.MEMORY:
        suggestions.push('Reduce data processing size');
        suggestions.push('Close other applications');
        suggestions.push('Check system memory usage');
        break;

      case ERROR_TYPES.DISK:
        suggestions.push('Free up disk space');
        suggestions.push('Clean temporary files');
        suggestions.push('Check disk quota limits');
        break;

      case ERROR_TYPES.SYSTEM:
        suggestions.push('Check system logs for more details');
        suggestions.push('Restart the CLI tool');
        suggestions.push('Report this issue if it persists');
        break;

      case ERROR_TYPES.SECURITY:
        suggestions.push('Review security settings');
        suggestions.push('Check authentication credentials');
        suggestions.push('Verify access permissions');
        break;
    }

    // Add general suggestions
    suggestions.push('Visit https://docs.skills-fabrik.com for help');
    suggestions.push('Report issues at https://github.com/skills-fabrik/issues');
    suggestions.push('Check system requirements and compatibility');

    return suggestions.slice(0, 5); // Limit to 5 suggestions
  }

  generateRecoveryStrategies(error, errorType, context) {
    const strategies = [];

    switch (errorType) {
      case ERROR_TYPES.VALIDATION:
        strategies.push({
          name: 'auto_format',
          description: 'Attempt to auto-format the input',
          action: () => this.attemptAutoFormat(error, context)
        });
        strategies.push({
          name: 'template_suggestion',
          description: 'Suggest correct format templates',
          action: () => this.suggestFormatTemplates(error, context)
        });
        break;

      case ERROR_TYPES.NETWORK:
        strategies.push({
          name: 'retry_with_backoff',
          description: 'Retry with exponential backoff',
          action: () => this.retryWithBackoff(context)
        });
        strategies.push({
          name: 'fallback_mode',
          description: 'Use offline/fallback mode',
          action: () => this.enableFallbackMode(context)
        });
        break;

      case ERROR_TYPES.TEMPORARY:
        strategies.push({
          name: 'wait_and_retry',
          description: 'Wait and retry automatically',
          action: () => this.waitAndRetry(error, context)
        });
        break;

      case ERROR_TYPES.CONFIGURATION:
        strategies.push({
          name: 'config_validation',
          description: 'Validate and auto-fix configuration',
          action: () => this.validateAndFixConfiguration(error, context)
        });
        strategies.push({
          name: 'reset_to_defaults',
          description: 'Reset to default configuration',
          action: () => this.resetConfigurationToDefaults(context)
        });
        break;
    }

    return strategies;
  }

  /**
   * Attempt error recovery using available strategies
   */
  async attemptRecovery(error, context = null) {
    const strategies = error.getRecoveryStrategies();

    for (const strategy of strategies) {
      try {
        console.log(`🔧 Attempting recovery strategy: ${strategy.name}`);
        const result = await strategy.action();

        if (result && result.success) {
          console.log(`✅ Recovery successful using ${strategy.name}`);
          return {
            recovered: true,
            strategy: strategy.name,
            result,
            suggestion: result.suggestion || 'Recovery completed successfully'
          };
        }
      } catch (recoveryError) {
        console.log(`❌ Recovery strategy ${strategy.name} failed:`, recoveryError.message);
        // Continue to next strategy
      }
    }

    return {
      recovered: false,
      suggestion: 'Manual intervention required'
    };
  }

  updateCircuitBreaker(error) {
    const now = Date.now();

    if (error.severity === ERROR_SEVERITY.CRITICAL || error.severity === ERROR_SEVERITY.HIGH) {
      this.circuitBreaker.failures++;
      this.circuitBreaker.lastFailure = now;

      if (this.circuitBreaker.failures >= 5) {
        this.circuitBreaker.state = 'OPEN';
        console.log('🔌 Circuit breaker activated due to repeated failures');

        // Schedule circuit breaker reset
        setTimeout(() => {
          this.circuitBreaker.state = 'HALF_OPEN';
          console.log('🔌 Circuit breaker entering half-open state');

          setTimeout(() => {
            this.circuitBreaker.state = 'CLOSED';
            this.circuitBreaker.failures = 0;
            console.log('🔌 Circuit breaker reset to closed state');
          }, this.circuitBreaker.timeout / 2);
        }, this.circuitBreaker.timeout);
      }
    } else {
      // Reset circuit breaker on success
      if (this.circuitBreaker.state === 'HALF_OPEN') {
        this.circuitBreaker.state = 'CLOSED';
        this.circuitBreaker.failures = Math.max(0, this.circuitBreaker.failures - 1);
      }
    }
  }

  createCircuitBreakerResponse(error, context) {
    return {
      stderr: `🔌 Circuit Breaker Active: Too many failures detected\n\n${error.message}\n\nPlease try again later or contact support if the issue persists.\nCircuit breaker will reset automatically.`,
      exitCode: EXIT_CODES.TEMPORARY_FAILURE,
      metadata: {
        timestamp: Date.now(),
        circuitBreakerState: this.circuitBreaker.state,
        failures: this.circuitBreaker.failures,
        lastFailure: this.circuitBreaker.lastFailure,
        command: context?.command || 'unknown',
        args: context?.args || [],
        errorId: 'circuit_breaker_error'
      }
    };
  }

  // Recovery strategy implementations
  async attemptAutoFormat(error, context) {
    // Implementation would depend on specific error type
    return { success: false, suggestion: 'Auto-format not available for this error type' };
  }

  async suggestFormatTemplates(error, context) {
    return { success: false, suggestion: 'Format templates not available' };
  }

  async retryWithBackoff(context) {
    return { success: false, suggestion: 'Retry logic not implemented' };
  }

  async enableFallbackMode(context) {
    return { success: false, suggestion: 'Fallback mode not available' };
  }

  async waitAndRetry(error, context) {
    return { success: false, suggestion: 'Wait and retry not implemented' };
  }

  async validateAndFixConfiguration(error, context) {
    return { success: false, suggestion: 'Configuration validation not implemented' };
  }

  async resetConfigurationToDefaults(context) {
    return { success: false, suggestion: 'Configuration reset not implemented' };
  }

  /**
   * Get comprehensive error analytics
   */
  getAnalytics() {
    return {
      analytics: this.analytics.getMetrics(),
      trends: this.analytics.getErrorTrends(),
      circuitBreaker: { ...this.circuitBreaker },
      recoveryStrategies: Array.from(this.recoveryStrategies.entries())
    };
  }

  /**
   * Export error analytics for external monitoring
   */
  exportAnalytics() {
    return {
      timestamp: new Date().toISOString(),
      metrics: this.analytics.getMetrics(),
      trends: this.analytics.getErrorTrends(),
      circuitBreaker: this.circuitBreaker
    };
  }
}

// Export singleton instance and classes
const advancedErrorHandler = AdvancedCLIErrorHandler.getInstance();

module.exports = {
  // Enhanced exit codes and types
  EXIT_CODES,
  ERROR_TYPES,
  ERROR_SEVERITY,

  // Enhanced error classes
  AdvancedCLIError,
  ValidationAdvancedError,
  ConfigurationAdvancedError,
  SystemAdvancedError,
  NetworkAdvancedError,

  // Enhanced utilities
  ErrorContext,
  EnhancedMessageFormatter,
  ErrorAnalytics,
  AdvancedCLIErrorHandler,
  advancedErrorHandler
};