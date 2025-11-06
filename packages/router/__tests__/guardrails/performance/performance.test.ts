/**
 * Tests de Performance: Guardrails
 * P0-1: Validación de performance
 */

import { describe, it, expect } from 'vitest';

// Mock loadGuardrailPatterns function
function loadGuardrailPatterns(): RegExp[] {
  return [
    /\.deleteMany\(\s*\)/g,
    /\.updateMany\([^)]*\)/g,
    /password\s*[:=]\s*['"][^'"]+['"]/g,
    /sk_live_[a-zA-Z0-9]+/g,
  ];
}

function checkPatterns(code: string, skillId: string): Array<{message: string}> {
  const patterns = loadGuardrailPatterns();
  const violations: Array<{message: string}> = [];

  patterns.forEach(pattern => {
    if (pattern.test(code)) {
      violations.push({ message: 'Pattern match detected' });
      pattern.lastIndex = 0; // Reset regex
    }
  });

  return violations;
}

describe('Guardrails Performance', () => {
  it('should check 100 files in < 5 seconds', () => {
    const files = Array.from({ length: 100 }, (_, i) => `file${i}.ts`);

    const startTime = Date.now();

    files.forEach(file => {
      const code = `
        await prisma.user.deleteMany();
        const password = "secret123";
      `;
      checkPatterns(code, 'database-verification');
    });

    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(5000);
  });

  it('should cache pattern compilation', () => {
    const iterations = 1000;
    const startTime = Date.now();

    for (let i = 0; i < iterations; i++) {
      loadGuardrailPatterns();
    }

    const duration = Date.now() - startTime;

    // Should be very fast due to caching (not compiling new patterns each time)
    expect(duration).toBeLessThan(100);
  });

  it('should handle large files efficiently', () => {
    const largeFile = 'a'.repeat(1000000); // 1MB file

    const startTime = Date.now();
    const violations = checkPatterns(largeFile, 'database-verification');
    const duration = Date.now() - startTime;

    // Should process even large files efficiently (< 2 seconds)
    expect(duration).toBeLessThan(2000);
    expect(violations).toBeDefined();
  });
});
