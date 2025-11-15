/**
 * ESLint Configuration Builder
 *
 * GREEN PHASE - Implementation to make tests pass
 *
 * This module creates ESLint configurations following Clean Architecture
 * with type-safe configuration building and no hardcoded paths.
 */

import {
  ESLintConfigOptions,
  ESLintConfiguration,
  RuleConfiguration,
} from '../types/configuration';

/**
 * Helper to convert string rule values to proper RuleConfiguration format
 */
/* eslint-disable @typescript-eslint/no-explicit-any, no-console */
function normalizeRule(rule: string | [string, unknown]): RuleConfiguration {
  if (typeof rule === 'string') {
    return { severity: rule as 'off' | 'warn' | 'error' };
  }

  const [severity, options] = rule;
  return {
    severity: severity as 'off' | 'warn' | 'error',
    options: options as Record<string, unknown>,
  };
}

/**
 * Creates ESLint configuration based on options
 */
// eslint-disable-next-line @typescript-eslint/require-await
export async function createESLintConfig(
  options: ESLintConfigOptions = {}
): Promise<ESLintConfiguration> {
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
        jsx: true,
      },
      ...options.parserOptions,
    },
    extends: [
      'eslint:recommended',
      '@typescript-eslint/recommended',
      'plugin:@typescript-eslint/recommended-requiring-type-checking',
      ...(options.extends || []),
    ],
    plugins: [
      '@typescript-eslint',
      'import',
      'simple-import-sort',
      'security',
      'sonarjs',
      ...(options.plugins || []),
    ],
    rules: normalizeRules({
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'import/order': 'error',
      'import/newline-after-import': 'error',
      'no-console': 'warn',
      'sonarjs/cognitive-complexity': ['warn', 15],
      'sonarjs/no-duplicate-string': 'error',
      'sonarjs/no-identical-expressions': 'error',
      ...options.rules,
    }),
    ignorePatterns: options.ignorePatterns || [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      '*.min.js',
    ],
    overrides: options.overrides || [],
    env: {
      node: true,
      es2022: true,
      jest: true,
      ...options.env,
    },
    globals: {
      ...options.globals,
    },
  };

  return baseConfig;
}

/**
 * Normalizes rules object to proper RuleConfiguration format
 */
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, no-console */
function normalizeRules(
  rules: Record<string, any>
): Record<string, RuleConfiguration> {
  const normalized: Record<string, RuleConfiguration> = {};

  for (const ruleName in rules) {
    if (Object.hasOwn(rules, ruleName)) {
      const ruleValue = rules[ruleName];
      if (typeof ruleValue === 'string') {
        normalized[ruleName] = normalizeRule(ruleValue);
      } else if (Array.isArray(ruleValue) && ruleValue.length >= 2) {
        const [severity, options] = ruleValue;
        normalized[ruleName] = normalizeRule([severity, options]);
      }
    }
  }

  return normalized;
}

/**
 * Creates ESLint configuration with Prettier integration
 */
// eslint-disable-next-line @typescript-eslint/require-await
export async function createESLintConfigWithPrettier(
  options: ESLintConfigOptions,
  _prettierConfig?: unknown
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
  rules?: Record<string, unknown>;
}): ESLintConfiguration['overrides'][0] {
  return {
    files: options.files,
    rules: normalizeRules({
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      ...options.rules,
    }),
  };
}

/**
 * Synchronous version of createESLintConfig for migration scripts
 * T1.1.5 - Migrate current repo configuration
 */
export function createESLintConfigSync(
  options: {
    projectPath?: string;
    preserveCustomRules?: boolean;
    originalConfig?: Record<string, any>;
  } = {}
): Record<string, any> {
  const { preserveCustomRules = false, originalConfig = {} } = options;

  // Base unified configuration
  const baseConfig: any = {
    root: true,
    parser: '@typescript-eslint/parser',
    parserOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      project: './tsconfig.json',
    },
    plugins: [
      '@typescript-eslint',
      'import',
      'simple-import-sort',
      'security',
      'sonarjs',
    ],
    extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
      'plugin:@typescript-eslint/recommended-requiring-type-checking',
      'plugin:import/recommended',
      'plugin:import/typescript',
      'plugin:security/recommended',
      'plugin:sonarjs/recommended',
    ],
    rules: {
      // TypeScript rules
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',
      '@typescript-eslint/restrict-plus-operands': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-unnecessary-condition': 'warn',

      // Import rules
      'import/no-unresolved': 'off',
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
          newlinesBetween: 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',

      // Security rules
      'sonarjs/cognitive-complexity': ['warn', 15],
      'sonarjs/no-duplicate-string': ['warn', { threshold: 3 }],

      // General rules
      'no-unused-vars': 'off', // Use TypeScript version instead
      'no-console': 'warn',
      'prefer-const': 'error',
      'no-var': 'error',
    },
    env: {
      node: true,
      es2022: true,
      jest: true,
    },
    overrides: [
      {
        files: ['**/*.test.ts', '**/*.spec.ts'],
        rules: {
          '@typescript-eslint/no-explicit-any': 'off',
        },
      },
    ],
    ignorePatterns: [
      'dist/**/*',
      'node_modules/**/*',
      'coverage/**/*',
      'dev-docs/**/*',
      'config/**/*',
      'backup/**/*',
    ],
  };

  // Preserve custom rules if requested
  if (preserveCustomRules && originalConfig.rules) {
    /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, no-console */
    // Merge custom rules with base rules, preserving custom settings
    const customRules = { ...baseConfig.rules };

    for (const ruleName of Object.keys(
      (originalConfig.rules || {}) as Record<string, unknown>
    )) {
      if (customRules[ruleName]) {
        // Custom rule exists in base, check if settings are different
        const baseRule = customRules[ruleName];
        const customRule = originalConfig.rules[ruleName];

        // If they're different, prefer the custom rule
        if (
          JSON.stringify(baseRule || {}) !== JSON.stringify(customRule || {})
        ) {
          customRules[ruleName] = customRule;
        }
      } else {
        // Custom rule not in base, add it
        const customRuleValue = originalConfig.rules[ruleName];
        customRules[ruleName] = customRuleValue as RuleConfiguration;
      }
    }

    baseConfig.rules = customRules;
  }

  return baseConfig as ESLintConfiguration;
}
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, no-console */
