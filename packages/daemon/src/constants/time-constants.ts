/**
 * Time Constants for Daemon Operations
 *
 * Replaces magic numbers with semantic constants following PROH-010 compliance
 * TDD Implementation: Phase 6.2 - Constants Infrastructure (GREEN)
 *
 * Purpose: Eliminate magic numbers (3600000, 60000, 30000)
 * with meaningful semantic identifiers
 */

/**
 * Base time constants in milliseconds
 * Following semantic naming conventions and maintainability standards
 */
export const TIME_CONSTANTS = {
  /** 1 hour in milliseconds (3600000ms) */
  ONE_HOUR_MS: 3600000,

  /** 1 minute in milliseconds (60000ms) */
  ONE_MINUTE_MS: 60000,

  /** 30 seconds in milliseconds (30000ms) */
  DEFAULT_TIMEOUT_MS: 30000,

  /** Health check interval (same as default timeout) */
  DEFAULT_HEALTH_INTERVAL_MS: 30000
} as const;

/**
 * Semantic time operations for daemon-specific contexts
 * Maps business logic to time constants with clear meaning
 *
 * Each constant represents a specific use case in daemon operations
 * making the code self-documenting and maintainable
 */
export const TIME_OPERATIONS = {
  // Retention periods
  /** How long to keep event logs in memory */
  EVENT_RETENTION: TIME_CONSTANTS.ONE_HOUR_MS,

  /** Default duration for metric collection */
  METRIC_COLLECTION_DURATION: TIME_CONSTANTS.ONE_HOUR_MS,

  // Cleanup and maintenance intervals
  /** Frequency for background cleanup operations */
  CLEANUP_FREQUENCY: TIME_CONSTANTS.ONE_MINUTE_MS,

  // Timeout operations
  /** Default timeout for graceful shutdown */
  SHUTDOWN_TIMEOUT: TIME_CONSTANTS.DEFAULT_TIMEOUT_MS,

  /** Default timeout for API operations */
  API_DEFAULT_TIMEOUT: TIME_CONSTANTS.DEFAULT_TIMEOUT_MS,

  // Health and monitoring
  /** Interval between health checks */
  HEALTH_CHECK_INTERVAL: TIME_CONSTANTS.DEFAULT_HEALTH_INTERVAL_MS,

  /** Timeout for health check responses */
  HEALTH_CHECK_TIMEOUT: TIME_CONSTANTS.DEFAULT_HEALTH_INTERVAL_MS
} as const;

/**
 * Type definitions for time-related operations
 * Ensuring type safety and preventing accidental misuse
 */
export type TimeOperation = keyof typeof TIME_OPERATIONS;
export type TimeConstant = keyof typeof TIME_CONSTANTS;

/**
 * Utility functions for time operations
 * Providing safe ways to work with time constants
 */
export const TimeUtils = {
  /**
   * Get milliseconds from hours
   * @param hours Number of hours
   * @returns Milliseconds
   */
  hoursToMs(hours: number): number {
    return hours * TIME_CONSTANTS.ONE_HOUR_MS;
  },

  /**
   * Get milliseconds from minutes
   * @param minutes Number of minutes
   * @returns Milliseconds
   */
  minutesToMs(minutes: number): number {
    return minutes * TIME_CONSTANTS.ONE_MINUTE_MS;
  },

  /**
   * Get milliseconds from seconds
   * @param seconds Number of seconds
   * @returns Milliseconds
   */
  secondsToMs(seconds: number): number {
    return seconds * 1000;
  },

  /**
   * Validate if a value is a valid time constant
   * @param value Value to validate
   * @returns True if valid time constant
   */
  isValidTimeConstant(value: number): boolean {
    return Object.values(TIME_CONSTANTS).includes(value);
  }
} as const;

/**
 * Export all constants and utilities for easy import
 * Following ES6 module standards for tree-shaking compatibility
 */
export default {
  TIME_CONSTANTS,
  TIME_OPERATIONS,
  TimeUtils
};