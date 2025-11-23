/**
 * Basic ESLint Configuration Test - GREEN PHASE
 * Simple test to validate core functionality
 */

import { createESLintConfig } from '../../../src/config/eslint.config';

describe('ESLint Configuration - Basic Test', () => {
  it('should create basic configuration', async () => {
    const config = await createESLintConfig({});

    expect(config.version).toBe('1.0.0');
    expect(config.root).toBe(true);
    expect(config.parser).toBe('@typescript-eslint/parser');
    expect(config.extends).toContain('eslint:recommended');
  });
});
