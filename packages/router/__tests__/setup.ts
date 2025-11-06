/**
 * Test Setup & Utilities
 * Configuración global y helpers para tests
 */

import { vi } from 'vitest';
import { execSync } from 'child_process';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';

// Global test timeout
vi.setConfig({ testTimeout: 10000 });

// Test repository setup
export const TEST_REPO_PATH = '/tmp/post-hooks-test-repo';
export const TEST_CWD = process.cwd();

export function setupTestRepo(): void {
  // Clean up if exists
  if (existsSync(TEST_REPO_PATH)) {
    rmSync(TEST_REPO_PATH, { recursive: true, force: true });
  }

  // Create fresh repo
  mkdirSync(TEST_REPO_PATH, { recursive: true });
  execSync('git init', { cwd: TEST_REPO_PATH });
  execSync('git config user.email "test@example.com"', { cwd: TEST_REPO_PATH });
  execSync('git config user.name "Test User"', { cwd: TEST_REPO_PATH });
}

export function cleanupTestRepo(): void {
  if (existsSync(TEST_REPO_PATH)) {
    rmSync(TEST_REPO_PATH, { recursive: true, force: true });
  }
}

export async function writeFile(path: string, content: string): Promise<void> {
  const fullPath = join(TEST_REPO_PATH, path);
  const dir = fullPath.split('/').slice(0, -1).join('/');

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  writeFileSync(fullPath, content);
}

export function execCommand(command: string, options: any = {}): any {
  try {
    const result = execSync(command, {
      cwd: TEST_REPO_PATH,
      ...options,
    });

    return {
      exitCode: 0,
      stdout: result.toString(),
      stderr: '',
    };
  } catch (error: any) {
    return {
      exitCode: error.status || 1,
      stdout: error.stdout?.toString() || '',
      stderr: error.stderr?.toString() || error.message,
    };
  }
}

// Mock helpers
export function mockStopHook(): any {
  return {
    checkGuardrails: vi.fn().mockResolvedValue({
      blocked: false,
      violations: [],
      warnings: [],
      suggestions: [],
    }),
    validateBashCommands: vi.fn().mockResolvedValue({
      blocked: false,
      violations: [],
    }),
    runPrettier: vi.fn().mockResolvedValue([]),
    runESLint: vi.fn().mockResolvedValue([]),
    runTypeCheck: vi.fn().mockResolvedValue([]),
    runBuildCheck: vi.fn().mockResolvedValue([]),
    generateErrorHints: vi.fn().mockReturnValue([]),
    autoResolveTypeScriptErrors: vi.fn().mockReturnValue([]),
    verifyCleanRepo: vi.fn().mockResolvedValue({ clean: true }),
    emitKPIEvent: vi.fn(),
    sendNotification: vi.fn(),
  };
}

// Assertion helpers
export function expectGuardrailBlock(result: any): void {
  expect(result.blocked).toBe(true);
  expect(result.violations.length).toBeGreaterThan(0);
}

export function expectKPIEvent(event: any, expectedAdherence: boolean): void {
  expect(event).toBeDefined();
  expect(event.adherence).toBe(expectedAdherence);
}

export function expectPerformance(duration: number, maxMs: number): void {
  expect(duration).toBeLessThan(maxMs);
}

// Before/after hooks
beforeEach(() => {
  setupTestRepo();
});

afterEach(() => {
  cleanupTestRepo();
  vi.clearAllMocks();
});

afterAll(() => {
  cleanupTestRepo();
});
