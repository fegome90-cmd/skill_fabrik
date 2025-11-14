/*
 * Quality System TypeScript Interfaces
 * 
 * These interfaces define the core types for the quality system
 * following Clean Architecture principles with no hardcoded paths.
 */

/**
 * Generic type for configuration and metrics values
 */
export type ConfigValue = string | number | boolean | object;

/**
 * Result of executing a quality gate or validation
 */
export interface QualityResult {
  success: boolean;
  executionTime: number;
  output?: string;
  error?: string;
  metrics?: Record<string, ConfigValue>;
}

/**
 * Execution context for quality operations
 */
export interface ExecutionContext {
  projectPath: string;
  files: string[];
  config?: Record<string, ConfigValue>;
}

/**
 * Base interface for all quality gates
 */
export interface QualityGate {
  name: string;
  critical: boolean;
  enabled: boolean;
  execute(context: ExecutionContext): Promise<QualityResult>;
}

/**
 * Validation check interface for pre-task validation
 */
export interface ValidationCheck {
  name: string;
  required: boolean;
  passed: boolean;
  message: string;
  details?: Record<string, ConfigValue>;
}

/**
 * Project configuration interface
 */
export interface ProjectConfig {
  name: string;
  version: string;
  paths: {
    src: string;
    test: string;
    config: string;
    root: string;
  };
  thresholds: {
    coverage: number;
    performance: number;
    complexity: number;
  };
}