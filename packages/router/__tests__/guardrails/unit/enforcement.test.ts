/**
 * Tests Unitarios: Enforcement Levels
 * P0-1: Validación de niveles de enforcement
 */

import { describe, it, expect } from 'vitest';

const ENFORCEMENT_LEVELS = {
  database_verification: 'block',
  secrets_and_config: 'block',
};

function getEnforcementLevel(skillId: string): string {
  const key = skillId.replace(/-/g, '_');
  return ENFORCEMENT_LEVELS[key as keyof typeof ENFORCEMENT_LEVELS] || 'suggest';
}

describe('enforcement levels', () => {
  it('should return BLOCK for database-verification', () => {
    const result = getEnforcementLevel('database-verification');
    expect(result).toBe('block');
  });

  it('should return BLOCK for secrets-and-config', () => {
    const result = getEnforcementLevel('secrets-and-config');
    expect(result).toBe('block');
  });

  it('should handle unknown skills with default enforcement', () => {
    const result = getEnforcementLevel('unknown-skill');
    expect(result).toBe('suggest');
  });
});
