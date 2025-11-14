/**
 * ESLint Configuration Builder
 * 
 * GREEN PHASE - Implementation to make tests pass
 * 
 * This module creates ESLint configurations following Clean Architecture
 * with type-safe configuration building and no hardcoded paths.
 */

import * as path from 'path';
import { ESLintConfiguration, RuleConfiguration, PrettierConfiguration } from '../types/configuration';

/**
 * Helper to convert string rule values to proper RuleConfiguration format
 */
function normalizeRule(rule: string | [string, any]): RuleConfiguration {
  if (typeof rule === 'string') {
    return { severity: rule as 'off' | 'warn' | 'error' };
  }
  
  const [severity, options] = rule;
  return {
    severity: severity as 'off' | 'warn' | 'error',
    options
  };
}

/**
 * Creates ESLint configuration based on options
 */
export async function createESLintConfig(options: Partial<ESLintConfiguration>): Promise<ESLintConfiguration> {
  // Default base configuration
  const baseConfig: ESLintConfiguration = {
    version: options.version || '1.0.0',
    root: options.root ?? true,
    parser: options.parser || '@typescript-eslint/parser',
    parserOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      project: './tsconfig.json',
      ecmaFeatures: {
        jsx: true
      },
      ...options.parserOptions
    },
    extends: [
      'eslint:recommended',
      '@typescript-eslint/recommended',
      'plugin:@typescript-eslint/recommended-requiring-type-checking',
      ...(options.extends || [])
    ],
    plugins: [
      '@typescript-eslint',
      'import',
      'simple-import-sort',
      'security',
      'sonarjs',
      ...(options.plugins || [])
    ],
    rules: normalizeRules({
      '@typescript-eslint/no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'import/order': 'error',
      'import/newline-after-import': 'error',
      'security/detect-object-injection': 'warn',
      'sonarjs/cognitive-complexity': ['warn', 15],
      'sonarjs/no-duplicate-string': 'error',
      'sonarjs/no-identical-expressions': 'error',
      ...options.rules
    }),
    ignorePatterns: options.ignorePatterns || [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      '*.min.js'
    ],
    overrides: options.overrides || [],
    env: {
      node: true,
      es2022: true,
      jest: true,
      ...options.env
    },
    globals: {
      ...options.globals
    }
  };

  return baseConfig;
}

/**
 * Normalizes rules object to proper RuleConfiguration format
 */
function normalizeRules(rules: Record<string, any>): Record<string, RuleConfiguration> {
  const normalized: Record<string, RuleConfiguration> = {};
  
  for (const [key, value] of Object.entries(rules)) {
    normalized[key] = normalizeRule(value);
  }
  
  return normalized;
}

/**
 * Creates ESLint configuration with Prettier integration
 */
export async function createESLintConfigWithPrettier(
  options: Partial<ESLintConfiguration>,
  prettierConfig?: PrettierConfiguration
): Promise<ESLintConfiguration> {
  const config = await createESLintConfig(options);
  
  // Add Prettier plugin and configuration
  config.extends.push('prettier');
  if (!config.plugins.includes('prettier')) {
    config.plugins.push('prettier');
  }
  
  // Add Prettier rules
  config.rules['prettier/prettier'] = { severity: 'error' };
  
  return config;
}

/**
 * Create ESLint configuration for specific file types
 */
export function createTypeScriptOverride(options: {
  files: string[];
  rules?: Record<string, any>;
}): ESLintConfiguration['overrides'][0] {
  return {
    files: options.files,
    rules: normalizeRules({
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      ...options.rules
    })
  };
}