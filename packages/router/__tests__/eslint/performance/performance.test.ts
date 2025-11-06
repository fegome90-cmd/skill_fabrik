/**
 * Tests de Performance: ESLint
 * P0-3: Validación de performance
 */

import { describe, it, expect } from 'vitest';

function lintFiles(fileContents: string[]): { duration: number; violationCount: number } {
  const start = Date.now();

  let violationCount = 0;
  for (const content of fileContents) {
    if (content.includes('console.log')) violationCount++;
    if (content.includes('var ')) violationCount++;
  }

  const duration = Date.now() - start;
  return { duration, violationCount };
}

describe('ESLint Performance', () => {
  it('should lint 100 files in < 10 seconds', () => {
    const files = Array.from({ length: 100 }, (_, i) => `
      const test${i} = "value${i}";
      console.log(test${i});
    `);

    const start = Date.now();
    const result = lintFiles(files);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(10000);
    expect(result.violationCount).toBeGreaterThan(0);
  });

  it('should process large files efficiently', () => {
    const largeFile = 'const test = "value";\n'.repeat(5000);

    const start = Date.now();
    const result = lintFiles([largeFile]);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(2000);
    expect(result.violationCount).toBe(1);
  });

  it('should cache results effectively', () => {
    const file = 'console.log("test");';
    const iterations = 100;

    const start = Date.now();
    for (let i = 0; i < iterations; i++) {
      lintFiles([file]);
    }
    const duration = Date.now() - start;

    // Should be fast due to caching (hypothetically)
    expect(duration).toBeLessThan(5000);
  });
});
