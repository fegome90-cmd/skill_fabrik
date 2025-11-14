/*
 * Configuration TypeScript Interfaces
 * 
 * These interfaces define the configuration types for ESLint and other tools
 * following Clean Architecture principles with proper type safety.
 */

/**
 * Generic type for configuration and metrics values
 */
export type ConfigValue = string | number | boolean | object;

/**
 * ESLint configuration interface
 */
export interface ESLintConfiguration {
  version: string;
  root: boolean;
  parser: string;
  parserOptions: {
    ecmaVersion: number;
    sourceType: 'module' | 'script';
    project?: string;
    ecmaFeatures?: {
      jsx?: boolean;
    };
  };
  extends: string[];
  plugins: string[];
  rules: Record<string, RuleConfiguration>;
  ignorePatterns: string[];
  overrides: RuleOverride[];
  env?: Record<string, boolean>;
  globals?: Record<string, boolean>;
}

/**
 * Individual ESLint rule configuration
 */
export interface RuleConfiguration {
  severity: 'off' | 'warn' | 'error';
  options?: ConfigValue;
}

/**
 * ESLint rule override configuration
 */
export interface RuleOverride {
  files: string[];
  excludedFiles?: string[];
  rules: Record<string, RuleConfiguration>;
  extends?: string[];
  plugins?: string[];
  parser?: string;
  parserOptions?: {
    ecmaVersion?: number;
    sourceType?: 'module' | 'script';
    project?: string;
  };
  env?: Record<string, boolean>;
  globals?: Record<string, boolean>;
}

/**
 * Prettier configuration interface
 */
export interface PrettierConfiguration {
  semi: boolean;
  trailingComma: 'none' | 'es5' | 'all';
  singleQuote: boolean;
  printWidth: number;
  tabWidth: number;
  useTabs: boolean;
  arrowParens: 'avoid' | 'always';
  endOfLine: 'lf' | 'crlf' | 'cr';
  bracketSpacing?: boolean;
  jsxSingleQuote?: boolean;
  quoteProps?: 'as-needed' | 'consistent' | 'preserve';
}

/**
 * Jest configuration interface
 */
export interface JestConfiguration {
  preset?: string;
  testEnvironment?: string;
  roots: string[];
  testMatch: string[];
  transform?: Record<string, string>;
  collectCoverageFrom: string[];
  coverageDirectory: string;
  coverageReporters: string[];
  coverageThreshold: {
    global: {
      branches: number;
      functions: number;
      lines: number;
      statements: number;
    };
  };
  setupFilesAfterEnv?: string[];
  testTimeout?: number;
}

/**
 * TypeScript compiler options interface
 */
export interface TypeScriptConfiguration {
  compilerOptions: {
    target: string;
    module: string;
    lib: string[];
    outDir: string;
    rootDir: string;
    strict: boolean;
    esModuleInterop: boolean;
    skipLibCheck: boolean;
    forceConsistentCasingInFileNames: boolean;
    declaration: boolean;
    declarationMap: boolean;
    sourceMap: boolean;
    removeComments: boolean;
    noImplicitAny: boolean;
    strictNullChecks: boolean;
    strictFunctionTypes: boolean;
    noImplicitReturns: boolean;
    noFallthroughCasesInSwitch: boolean;
    noUncheckedIndexedAccess: boolean;
  };
  include: string[];
  exclude: string[];
}