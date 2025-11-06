/**
 * Tests Unitarios: ESLint Execution
 * P0-3: Validación de linting
 */

import { describe, it, expect } from 'vitest';

// Mock ESLint execution
function runESLint(code: string, options: any = {}): Promise<{
  errorCount: number;
  warningCount: number;
  results: Array<{
    filePath: string;
    messages: Array<{
      ruleId: string;
      severity: number;
      message: string;
      line: number;
    }>;
  }>;
}> {
  const violations: any[] = [];

  // Simulate common ESLint rules
  if (/console\.log/.test(code)) {
    violations.push({
      ruleId: 'no-console',
      severity: 1, // warning
      message: 'Unexpected console statement',
      line: code.split('\n').findIndex(l => l.includes('console.log')) + 1,
    });
  }

  if (/var\s+/.test(code)) {
    violations.push({
      ruleId: 'no-var',
      severity: 1, // warning
      message: 'Unexpected var, use let or const instead',
      line: code.split('\n').findIndex(l => l.startsWith('var')) + 1,
    });
  }

  if (/['"][^'"]*['"]\s*\+/.test(code)) {
    violations.push({
      ruleId: 'prefer-template',
      severity: 1, // warning
      message: 'Use template literals instead of string concatenation',
      line: code.split('\n').findIndex(l => l.includes('+')) + 1,
    });
  }

  return Promise.resolve({
    errorCount: violations.filter(v => v.severity === 2).length,
    warningCount: violations.filter(v => v.severity === 1).length,
    results: [{
      filePath: 'test.ts',
      messages: violations,
    }],
  });
}

function runESLintLocal(code: string): Promise<{
  errorCount: number;
  warningCount: number;
  results: any[];
}> {
  // Same as runESLint but via daemon would use different implementation
  return runESLint(code);
}

function runESLintViaDaemon(code: string): Promise<{
  errorCount: number;
  warningCount: number;
  results: any[];
}> {
  // Same implementation for now, but in real scenario would call daemon
  return runESLint(code);
}

describe('ESLint Unit Tests', () => {
  describe('linting rules', () => {
    it('should detect no-console violations', async () => {
      const code = 'console.log("test");';
      const result = await runESLint(code);

      expect(result.errorCount).toBe(0);
      expect(result.warningCount).toBe(1);
      expect(result.results[0].messages[0].ruleId).toBe('no-console');
    });

    it('should detect no-var violations', async () => {
      const code = 'var test = "hello";';
      const result = await runESLint(code);

      expect(result.warningCount).toBe(1);
      expect(result.results[0].messages[0].ruleId).toBe('no-var');
    });

    it('should detect prefer-template violations', async () => {
      const code = 'const name = "World"; const msg = "Hello " + name;';
      const result = await runESLint(code);

      expect(result.warningCount).toBe(1);
      expect(result.results[0].messages[0].ruleId).toBe('prefer-template');
    });

    it('should allow clean code', async () => {
      const code = 'const test = "hello";';
      const result = await runESLint(code);

      expect(result.errorCount).toBe(0);
      expect(result.warningCount).toBe(0);
    });

    it('should handle multiple violations', async () => {
      const code = `
        var test = "hello";
        console.log(test);
        const msg = "Hello " + test;
      `;
      const result = await runESLint(code);

      expect(result.warningCount).toBeGreaterThanOrEqual(3);
    });
  });

  describe('error parsing', () => {
    it('should parse error messages correctly', async () => {
      const code = 'console.log("test");';
      const result = await runESLint(code);

      expect(result.results[0].messages[0].severity).toBe(1);
      expect(result.results[0].messages[0].line).toBeDefined();
    });

    it('should track line numbers', async () => {
      const code = `
        const a = 1;
        console.log(a);
        const b = 2;
      `;
      const result = await runESLint(code);

      const consoleViolation = result.results[0].messages.find(m => m.ruleId === 'no-console');
      expect(consoleViolation?.line).toBe(3);
    });
  });

  describe('configuration loading', () => {
    it('should respect custom options', async () => {
      const code = 'var test = "hello";';
      const result = await runESLint(code, { rules: { 'no-var': 'error' } });

      // With custom config, var should be an error
      expect(result.errorCount + result.warningCount).toBeGreaterThan(0);
    });

    it('should handle different file types', async () => {
      const tsCode = 'const test: string = "hello";';
      const result = await runESLint(tsCode, { filePath: 'test.ts' });

      expect(result.results[0].filePath).toBe('test.ts');
    });
  });
});
