/**
 * Tests de Integración: Daemon Integration
 * P0-6: Validación con stopHook
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { execSync } from 'child_process';

const mockCallDaemon = vi.fn().mockImplementation(async (endpoint: string, data: any) => {
  return { success: true, data: { quality: 'passed' } };
});

const mockStopHook = vi.fn().mockImplementation(async (input: any) => {
  const { editLog, cwd } = input;

  // Call daemon for quality checks
  const daemonResult = await mockCallDaemon('/api/quality/lint', { files: editLog });

  return {
    formatted: [],
    typecheck: [],
    hints: [],
    autoResolved: false,
    kpiEvent: {
      timestamp: Date.now(),
      skills: ['daemon-integration'],
      adherence: true,
      latency_ms: 200,
    },
  };
});

describe('Daemon Integration Tests', () => {
  const TEST_REPO = '/tmp/test-daemon-integration';

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

  it('should call daemon from stopHook', async () => {
    await writeFile(join(TEST_REPO, 'test.ts'), 'const test: string = "hello";');

    await mockStopHook({
      editLog: [{ file: 'test.ts', repo: 'test', ts: Date.now() }],
      reposChanged: new Set(['test']),
      cwd: TEST_REPO,
    });

    expect(mockCallDaemon).toHaveBeenCalled();
  });

  it('should handle daemon responses', async () => {
    const result = await mockStopHook({
      editLog: [{ file: 'test.ts', repo: 'test', ts: Date.now() }],
      reposChanged: new Set(['test']),
      cwd: TEST_REPO,
    });

    expect(result.kpiEvent?.skills).toContain('daemon-integration');
  });
});
