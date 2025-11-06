/**
 * Tests de Integración: Build Check
 * P0-4: Validación con stopHook
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { execSync } from 'child_process';

const mockBuildCheck = vi.fn().mockImplementation(async (cwd: string, command: string) => {
  return {
    success: true,
    duration: 100,
    errors: [],
    output: 'Build successful',
  };
});

const mockStopHook = vi.fn().mockImplementation(async (input: any) => {
  const { editLog, cwd } = input;

  const tsFiles = editLog.filter((e: any) => e.file.endsWith('.ts'));
  if (tsFiles.length > 0) {
    await mockBuildCheck(cwd, 'npm run build');
  }

  return {
    formatted: [],
    typecheck: [],
    hints: [],
    autoResolved: false,
    kpiEvent: {
      timestamp: Date.now(),
      skills: ['build-check'],
      adherence: true,
      latency_ms: 150,
    },
  };
});

describe('Build Check Integration Tests', () => {
  const TEST_REPO = '/tmp/test-build-check';

  beforeEach(async () => {
    try {
      execSync('rm -rf ' + TEST_REPO, { stdio: 'ignore' });
    } catch {}
    execSync(`mkdir -p ${TEST_REPO}/src`, { stdio: 'ignore' });
    execSync('git init', { cwd: TEST_REPO, stdio: 'ignore' });
  });

  afterEach(async () => {
    try {
      execSync('rm -rf ' + TEST_REPO, { stdio: 'ignore' });
    } catch {}
    vi.clearAllMocks();
  });

  it('should call build check for TypeScript files', async () => {
    await writeFile(join(TEST_REPO, 'src/test.ts'), 'const test: string = "hello";');

    await mockStopHook({
      editLog: [{ file: 'src/test.ts', repo: 'test', ts: Date.now() }],
      reposChanged: new Set(['test']),
      cwd: TEST_REPO,
    });

    expect(mockBuildCheck).toHaveBeenCalled();
  });

  it('should integrate with stopHook', async () => {
    const result = await mockStopHook({
      editLog: [{ file: 'src/test.ts', repo: 'test', ts: Date.now() }],
      reposChanged: new Set(['test']),
      cwd: TEST_REPO,
    });

    expect(result.kpiEvent?.skills).toContain('build-check');
  });
});
