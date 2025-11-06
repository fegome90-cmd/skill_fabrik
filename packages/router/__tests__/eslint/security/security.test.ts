/**
 * Tests de Seguridad: ESLint
 * P0-3: Validación de seguridad
 */

import { describe, it, expect } from 'vitest';

function validateESLintConfig(config: any): { safe: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check for dangerous configurations
  if (config.rules?.['no-eval'] === 0) {
    errors.push('eval is not disabled');
  }

  if (config.rules?.['no-new-func'] === 0) {
    errors.push('new Function is not disabled');
  }

  return { safe: errors.length === 0, errors };
}

describe('ESLint Security Tests', () => {
  it('should not allow dangerous configurations', () => {
    const dangerousConfig = {
      rules: {
        'no-eval': 0,
        'no-new-func': 0,
      },
    };

    const result = validateESLintConfig(dangerousConfig);
    expect(result.safe).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should validate safe configurations', () => {
    const safeConfig = {
      rules: {
        'no-eval': 'error',
        'no-new-func': 'error',
      },
    };

    const result = validateESLintConfig(safeConfig);
    expect(result.safe).toBe(true);
  });
});
