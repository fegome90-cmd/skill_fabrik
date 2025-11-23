/**
 * ESLint Configuration Coverage Tests
 * Target: Increase coverage from 66% to 80%+
 * Focus: Lines 132-143, 153, 283-306 uncovered in eslint.config.ts
 *
 * NOTE: This test file intentionally uses 'any' types and unsafe member access
 * to test internal behavior and edge cases that wouldn't be accessible with
 * strict TypeScript typing. These patterns are acceptable in test code.
 */

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable no-console */

import {
  createESLintConfig,
  createESLintConfigSync,
  createESLintConfigWithPrettier,
  createTypeScriptOverride,
} from '../../../src/config/eslint.config';

describe('ESLint Configuration - Coverage Tests', () => {
  describe('createESLintConfig', () => {
    it('should create basic ESLint configuration with default values', async () => {
      const options = {};

      const config = await createESLintConfig(options);

      expect(config).toBeDefined();
      expect(config.root).toBe(true);
      expect(config.extends).toContain('eslint:recommended');
      expect(config.extends).toContain('@typescript-eslint/recommended');
      expect(config.plugins).toContain('@typescript-eslint');
      expect(config.plugins).toContain('import');
      expect(config.plugins).toContain('simple-import-sort');
      expect(config.plugins).toContain('security');
      expect(config.plugins).toContain('sonarjs');
      expect(config.rules).toBeDefined();
      expect(config.ignorePatterns).toContain('node_modules/**');
    });

    it('should merge custom options with base configuration', async () => {
      const customOptions = {
        extends: ['custom-config'],
        plugins: ['custom-plugin'],
        rules: {
          'custom-rule': 'error',
          '@typescript-eslint/no-unused-vars': [
            'error',
            { argsIgnorePattern: '^test' },
          ],
        },
        ignorePatterns: ['custom-pattern/**'],
      };

      const config = await createESLintConfig(customOptions);

      expect(config.extends).toContain('custom-config');
      expect(config.plugins).toContain('custom-plugin');
      expect(config.rules['custom-rule']).toEqual({
        severity: 'error',
      });
      expect(config.rules['@typescript-eslint/no-unused-vars']).toEqual({
        severity: 'error',
        options: { argsIgnorePattern: '^test' },
      });
      expect(config.ignorePatterns).toContain('custom-pattern/**');
    });

    it('should handle empty extends and plugins arrays', async () => {
      const options = {
        extends: [],
        plugins: [],
      };

      const config = await createESLintConfig(options);

      expect(config.extends.length).toBeGreaterThan(0);
      expect(config.plugins.length).toBeGreaterThan(0);
    });

    it('should handle TypeScript parser options', async () => {
      const options = {
        parserOptions: {
          project: './tsconfig.json',
          tsconfigRootDir: process.cwd(),
        },
      };

      const config = await createESLintConfig(options);

      expect(config.parserOptions).toBeDefined();
      expect(config.parserOptions.project).toBe('./tsconfig.json');
      expect(
        (config.parserOptions as { tsconfigRootDir?: string }).tsconfigRootDir
      ).toBe(process.cwd());
    });

    it('should handle env overrides', async () => {
      const options = {
        env: {
          browser: true,
          node: false,
        },
      };

      const config = await createESLintConfig(options);

      expect(config.env?.browser).toBe(true);
      expect(config.env?.node).toBe(false);
      expect(config.env?.es2022).toBe(true);
    });
  });
  describe('createESLintConfigWithPrettier', () => {
    it('should add prettier plugin when not already present', async () => {
      const mockConfig = {
        extends: ['eslint:recommended'],
        plugins: ['@typescript-eslint'],
        rules: {},
      };

      const result = await createESLintConfigWithPrettier(mockConfig, {});

      expect(result.extends).toContain('prettier');
      expect(result.plugins).toContain('prettier');
      expect(result.rules['prettier/prettier']).toEqual({ severity: 'error' });
    });

    it('should not duplicate prettier plugin when already present', async () => {
      const mockConfig = {
        extends: ['eslint:recommended'],
        plugins: ['prettier', '@typescript-eslint'],
        rules: {},
      };

      const result = await createESLintConfigWithPrettier(mockConfig, {});

      // Should only contain 'prettier' once
      const prettierCount = result.plugins.filter(
        (p: string) => p === 'prettier'
      ).length;
      expect(prettierCount).toBe(1);
    });
  });

  describe('createTypeScriptOverride', () => {
    it('should create override with custom rules', () => {
      const files = ['*.ts', '*.tsx'];
      const customRules = {
        '@typescript-eslint/no-explicit-any': 'error',
        'custom-rule': 'warn',
      };

      const override = createTypeScriptOverride({
        files,
        rules: customRules,
      });

      expect(override.files).toEqual(files);
      expect(override.rules['@typescript-eslint/no-explicit-any']).toEqual({
        severity: 'error',
      });
      expect(override.rules['@typescript-eslint/no-unsafe-assignment']).toEqual(
        { severity: 'off' }
      );
      expect(
        override.rules['@typescript-eslint/no-unsafe-member-access']
      ).toEqual({ severity: 'off' });
      expect(
        override.rules['@typescript-eslint/explicit-module-boundary-types']
      ).toEqual({ severity: 'off' });
      expect(override.rules['custom-rule']).toEqual({ severity: 'warn' });
    });

    it('should create override with default rules when no custom rules provided', () => {
      const files = ['*.ts'];

      const override = createTypeScriptOverride({ files });

      expect(override.files).toEqual(files);
      expect(override.rules['@typescript-eslint/no-explicit-any']).toEqual({
        severity: 'warn',
      });
      expect(override.rules['@typescript-eslint/no-unsafe-assignment']).toEqual(
        { severity: 'off' }
      );
    });
  });

  describe('createESLintConfigSync', () => {
    it('should handle original config with different custom rules', () => {
      const originalConfig = {
        rules: {
          '@typescript-eslint/no-explicit-any': [
            'error',
            { allowArgumentExplicitAny: false },
          ],
          '@typescript-eslint/no-unused-vars': [
            'error',
            { argsIgnorePattern: '^_' },
          ],
          'custom-rule': 'warn',
        },
      };

      const result = createESLintConfigSync({
        preserveCustomRules: true,
        originalConfig,
      });

      expect(result.rules['@typescript-eslint/no-explicit-any']).toEqual([
        'error',
        { allowArgumentExplicitAny: false },
      ]);
      expect(result.rules['custom-rule']).toBe('warn');
    });

    it('should preserve custom rule when different from base rule', () => {
      const originalConfig = {
        rules: {
          '@typescript-eslint/no-explicit-any': 'error', // Different from base 'warn'
          'standard-rule': 'warn',
        },
      };

      const result = createESLintConfigSync({
        preserveCustomRules: true,
        originalConfig,
      });

      // Should prefer custom rule over base rule when different
      expect(result.rules['@typescript-eslint/no-explicit-any']).toBe('error');
    });

    it('should handle merge edge cases with empty vs non-empty rules', () => {
      const originalConfig = {
        rules: {
          '@typescript-eslint/no-explicit-any': [], // Empty array
          '@typescript-eslint/no-unused-vars': null, // Null value
          'custom-rule': { severity: 'error' }, // Object rule
        },
      };

      const result = createESLintConfigSync({
        preserveCustomRules: true,
        originalConfig,
      });

      // Should handle edge cases properly
      expect(result.rules['@typescript-eslint/no-explicit-any']).toEqual([]);
      expect(result.rules['@typescript-eslint/no-unused-vars']).toBeNull();
      expect(result.rules['custom-rule']).toEqual({ severity: 'error' });
    });

    it('should create base config when preserveCustomRules is false', () => {
      const originalConfig = {
        rules: {
          'some-rule': 'error',
        },
      };

      const result = createESLintConfigSync({
        preserveCustomRules: false,
        originalConfig,
      });

      // Should not preserve custom rules
      expect(result.rules['some-rule']).toBeUndefined();
    });

    it('should handle missing originalConfig gracefully', () => {
      const result = createESLintConfigSync({
        preserveCustomRules: true,
        originalConfig: undefined,
      });

      // Should create valid config without crashing
      expect(result).toBeDefined();
      expect(result.rules).toBeDefined();
    });

    it('should handle empty rules object in original config', () => {
      const originalConfig = {
        rules: {},
      };

      const result = createESLintConfigSync({
        preserveCustomRules: true,
        originalConfig,
      });

      // Should create valid config without crashing
      expect(result).toBeDefined();
      expect(result.rules).toBeDefined();
    });

    it('should handle complex rule merging scenario', () => {
      const originalConfig = {
        rules: {
          '@typescript-eslint/no-explicit-any': ['error'],
          '@typescript-eslint/no-unused-vars': [
            'warn',
            { varsIgnorePattern: '^_' },
          ],
          'array-callback-return': 'error',
          'complex-rule': ['warn', { option1: true, option2: false }],
        },
      };

      const result = createESLintConfigSync({
        preserveCustomRules: true,
        originalConfig,
      });

      // Should preserve all custom rules
      expect(result.rules['@typescript-eslint/no-explicit-any']).toEqual([
        'error',
      ]);
      expect(result.rules['@typescript-eslint/no-unused-vars']).toEqual([
        'warn',
        { varsIgnorePattern: '^_' },
      ]);
      expect(result.rules['array-callback-return']).toBe('error');
      expect(result.rules['complex-rule']).toEqual([
        'warn',
        { option1: true, option2: false },
      ]);
    });
  });

  describe('helper functions coverage', () => {
    it('should test normalizeRule function with string input', () => {
      // This tests the internal normalizeRule function indirectly
      const result = createESLintConfigSync({
        preserveCustomRules: true,
        originalConfig: {
          rules: {
            'simple-string-rule': 'error',
          },
        },
      });

      expect(result.rules['simple-string-rule']).toBe('error');
    });

    it('should test normalizeRule function with array input', () => {
      // This tests the internal normalizeRule function with array
      const result = createESLintConfigSync({
        preserveCustomRules: true,
        originalConfig: {
          rules: {
            'array-rule': ['warn', { option: true }],
          },
        },
      });

      expect(result.rules['array-rule']).toEqual(['warn', { option: true }]);
    });

    it('should test edge case scenarios with empty configs', () => {
      // Test with completely empty original config
      const result1 = createESLintConfigSync({
        preserveCustomRules: true,
        originalConfig: {},
      });

      expect(result1).toBeDefined();
      expect(result1.rules).toBeDefined();

      // Test with undefined original config rules
      const result2 = createESLintConfigSync({
        preserveCustomRules: true,
        originalConfig: { rules: undefined },
      });

      expect(result2).toBeDefined();
      expect(result2.rules).toBeDefined();
    });

    it('should cover default parameter branch in createESLintConfig', async () => {
      // This covers the default parameter branch (line 33)
      const config = await createESLintConfig();

      expect(config).toBeDefined();
      expect(config.version).toBe('1.0.0');
      expect(config.root).toBe(true);
    });

    it('should cover createESLintConfigSync edge case with empty options', () => {
      // This covers edge cases in createESLintConfigSync (lines 170-176)
      const result = createESLintConfigSync({});

      expect(result).toBeDefined();
      expect(result.rules).toBeDefined();
    });

    it('should cover rule merging logic branches', () => {
      // This covers the conditional branches in rule merging (lines 285, 294)
      const originalConfig = {
        rules: {
          'non-existent-rule': 'error', // Rule not in base config
          'existing-rule': 'warn', // Rule that exists in base
        },
      };

      const result = createESLintConfigSync({
        preserveCustomRules: true,
        originalConfig,
      });

      // Should add non-existent rule and update existing rule
      expect(result.rules['non-existent-rule']).toBe('error');
      expect(result.rules['existing-rule']).toBe('warn');
    });
  });
});
