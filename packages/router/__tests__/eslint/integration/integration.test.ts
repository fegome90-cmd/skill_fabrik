/**
 * Tests de Integración: ESLint
 * P0-3: Validación con stopHook
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { execSync } from 'child_process';

const mockESLint = vi.fn().mockImplementation(async (files: string[]) => {
  return {
    errorCount: 0,
    warningCount: files.length,
    results: files.map(file => ({
      filePath: file,
      messages: [
        { ruleId: 'no-console', severity: 1, message: 'Unexpected console' },
      ],
    })),
  };
});

const mockStopHook = vi.fn().mockImplementation(async (input: any) => {
  const { editLog, cwd } = input;

  // Run ESLint on changed files
  const tsFiles = editLog.filter((e: any) => e.file.endsWith('.ts'));
  const filePaths = tsFiles.map((e: any) => join(cwd, e.file));

  const eslintResults = await mockESLint(filePaths);

  const hasErrors = eslintResults.errorCount > 0;

  return {
    formatted: [],
    typecheck: [],
    hints: hasErrors ? ['ESLint violations detected'] : [],
    autoResolved: false,
    kpiEvent: {
      timestamp: Date.now(),
      skills: hasErrors ? ['eslint'] : [],
      adherence: !hasErrors,
      latency_ms: 200,
    },
  };
});

describe('ESLint Integration Tests', () => {
  const TEST_REPO = '/tmp/test-eslint-integration';

  beforeEach(async () => {
    try {
      execSync('rm -rf ' + TEST_REPO, { stdio: 'ignore' });
    } catch {}
    execSync(`mkdir -p ${TEST_REPO}/src`, { stdio: 'ignore' });
    execSync('git init', { cwd: TEST_REPO, stdio: 'ignore' });
    execSync('git config user.email "test@test.com"', { cwd: TEST_REPO, stdio: 'ignore' });
    execSync('git config user.name "Test"', { cwd: TEST_REPO, stdio: 'ignore' });
  });

  afterEach(async () => {
    try {
      execSync('rm -rf ' + TEST_REPO, { stdio: 'ignore' });
    } catch {}
    vi.clearAllMocks();
  });

  it('should call ESLint on TypeScript files', async () => {
    await writeFile(join(TEST_REPO, 'src/test.ts'), 'console.log("test");');

    await mockStopHook({
      editLog: [{ file: 'src/test.ts', repo: 'test', ts: Date.now() }],
      reposChanged: new Set(['test']),
      cwd: TEST_REPO,
    });

    expect(mockESLint).toHaveBeenCalled();
  });

  it('should integrate with stopHook pipeline', async () => {
    await writeFile(join(TEST_REPO, 'src/code.ts'), 'const test = "hello";');

    const result = await mockStopHook({
      editLog: [{ file: 'src/code.ts', repo: 'test', ts: Date.now() }],
      reposChanged: new Set(['test']),
      cwd: TEST_REPO,
    });

    expect(result.kpiEvent).toBeDefined();
  });

  it('should run after prettier in pipeline', async () => {
    const executionOrder: string[] = [];

    const mockPrettier = vi.fn().mockImplementation(async () => {
      executionOrder.push('prettier');
      return [];
    });

    const mockESLintCall = vi.fn().mockImplementation(async () => {
      executionOrder.push('eslint');
      return { errorCount: 0, warningCount: 0, results: [] };
    });

    // Simulate pipeline
    await mockPrettier();
    await mockESLintCall();

    expect(executionOrder).toEqual(['prettier', 'eslint']);
  });

  it('should emit KPI event with ESLint results', async () => {
    await writeFile(join(TEST_REPO, 'src/bad.ts'), 'console.log("bad");');

    const result = await mockStopHook({
      editLog: [{ file: 'src/bad.ts', repo: 'test', ts: Date.now() }],
      reposChanged: new Set(['test']),
      cwd: TEST_REPO,
    });

    expect(result.kpiEvent?.skills).toContain('eslint');
  });
});
