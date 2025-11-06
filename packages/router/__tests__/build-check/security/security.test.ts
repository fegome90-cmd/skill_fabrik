/**
 * Tests de Seguridad: Build Check
 * P0-4: Validación de seguridad
 */

import { describe, it, expect } from 'vitest';

function validateBuildConfig(config: any): { safe: boolean; warnings: string[] } {
  const warnings: string[] = [];

  if (config.dangerousCommands?.includes('rm -rf node_modules')) {
    warnings.push('Build script contains dangerous commands');
  }

  return { safe: warnings.length === 0, warnings };
}

describe('Build Check Security Tests', () => {
  it('should detect dangerous build scripts', () => {
    const config = {
      dangerousCommands: ['rm -rf node_modules', 'format C:'],
    };

    const result = validateBuildConfig(config);
    expect(result.safe).toBe(false);
  });

  it('should allow safe build configurations', () => {
    const config = {
      dangerousCommands: [],
    };

    const result = validateBuildConfig(config);
    expect(result.safe).toBe(true);
  });
});
