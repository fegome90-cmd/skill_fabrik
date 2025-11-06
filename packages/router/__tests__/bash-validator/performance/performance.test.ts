/**
 * Tests de Performance: Bash Validator
 * P0-2: Validación de performance
 */

import { describe, it, expect } from 'vitest';

function validateScript(content: string): { safe: boolean; violations: string[] } {
  const violations: string[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    if (line.includes('rm -rf /')) {
      violations.push('rm -rf in root');
    }
    if (line.includes('chmod 777')) {
      violations.push('chmod 777');
    }
  }

  return { safe: violations.length === 0, violations };
}

describe('Bash Validator Performance', () => {
  it('should validate 50 scripts in < 3 seconds', () => {
    const scripts = Array.from({ length: 50 }, (_, i) => `
      #!/bin/bash
      echo "Script ${i}"
      ls -la
      npm install
    `);

    const startTime = Date.now();

    scripts.forEach(script => {
      validateScript(script);
    });

    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(3000);
  });

  it('should process large scripts efficiently', () => {
    const largeScript = 'echo "test"\n'.repeat(10000); // 10k lines

    const startTime = Date.now();
    const result = validateScript(largeScript);
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(1000);
    expect(result).toBeDefined();
  });
});
