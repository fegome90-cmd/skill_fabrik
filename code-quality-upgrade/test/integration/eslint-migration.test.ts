/**
 * ESLint Migration Integration Tests
 * T1.1.6 - Create ESLint migration tests
 */

import { createESLintConfigSync } from '../../src/config/eslint.config';

describe('ESLint Migration Integration', () => {
  // eslint-disable-next-line sonarjs/no-duplicate-string
  it('should migrate fragmented configuration to unified', () => {
    const fragmentedConfig = {
      parser: 'espree',
      extends: ['eslint:recommended'],
      plugins: ['@typescript-eslint'],
    };

    const unifiedConfig = createESLintConfigSync({
      projectPath: process.cwd(),
      preserveCustomRules: true,
      originalConfig: fragmentedConfig,
    });

    expect(unifiedConfig.parser).toBe('@typescript-eslint/parser');
    expect(unifiedConfig.plugins).toContain('@typescript-eslint');
    expect(unifiedConfig.root).toBe(true);
  });

  it('should handle missing configuration', () => {
    const unifiedConfig = createESLintConfigSync({
      projectPath: process.cwd(),
      preserveCustomRules: true,
    });

    expect(unifiedConfig.parser).toBe('@typescript-eslint/parser');
    expect(unifiedConfig.plugins).toContain('@typescript-eslint');
  });

  it('should preserve custom rules', () => {
    const configWithRules = {
      parser: '@typescript-eslint/parser',
      rules: {
        'no-console': 'error',
      },
    };

    const unifiedConfig = createESLintConfigSync({
      projectPath: process.cwd(),
      preserveCustomRules: true,
      originalConfig: configWithRules,
    });

    const rules = unifiedConfig.rules as Record<string, unknown>;
    expect(rules['no-console']).toBe('error');
  });

  it('should validate required fields', () => {
    const unifiedConfig = createESLintConfigSync({
      projectPath: process.cwd(),
      preserveCustomRules: true,
    });

    const requiredFields = ['root', 'parser', 'extends'];
    for (const field of requiredFields) {
      expect(unifiedConfig).toHaveProperty(field);
    }
  });
});
