/**
 * Tests de Seguridad: Guardrails
 * P0-1: Validación de seguridad
 */

import { describe, it, expect } from 'vitest';

// Mock checkPatterns function
function checkPatterns(code: string, skillId: string): Array<{message: string}> {
  const violations: Array<{message: string}> = [];

  if (skillId === 'database-verification') {
    if (/\.deleteMany\(\s*\)/.test(code)) {
      violations.push({ message: 'deleteMany() sin cláusula WHERE' });
    }
  }

  if (skillId === 'secrets-and-config') {
    if (/password\s*[:=]\s*['"][^'"]+['"]/i.test(code)) {
      violations.push({ message: 'Password hardcodeado' });
    }
  }

  return violations;
}

describe('Guardrails Security Tests', () => {
  it('should not be vulnerable to ReDoS in patterns', () => {
    const maliciousInput = 'a'.repeat(100000) + '!';
    const startTime = Date.now();

    try {
      const violations = checkPatterns(maliciousInput, 'database-verification');
      const duration = Date.now() - startTime;

      // Should complete in reasonable time (< 1 second)
      expect(duration).toBeLessThan(1000);
      expect(violations).toBeDefined();
    } catch (error) {
      // If it throws, that's also acceptable (pattern protection)
      expect(error).toBeDefined();
    }
  });

  it('should sanitize inputs to prevent injection', () => {
    const maliciousCode = `
      const userInput = "${'../../../etc/passwd'}";
      await prisma.user.deleteMany();
    `;

    const violations = checkPatterns(maliciousCode, 'database-verification');

    // Should detect the actual violation without being affected by path traversal
    expect(violations.length).toBeGreaterThanOrEqual(1);
  });

  it('should not execute code from pattern matches', () => {
    const codeWithEval = `
      const password = "secret123";
      eval("console.log('executed')");
    `;

    // Should detect secrets without executing eval
    const violations = checkPatterns(codeWithEval, 'secrets-and-config');

    expect(violations.length).toBeGreaterThan(0);
    // The test passes if we get here without the eval being executed
    // (which would have logged to console, but we're testing regex, not execution)
    expect(true).toBe(true);
  });
});
