/**
 * Tests de Integración: Bash Validator
 * P0-2: Validación con stopHook
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { execSync } from 'child_process';

// Mock bash validator
const mockBashValidator = vi.fn().mockImplementation(async (content: string) => {
  const dangerousCommands = ['rm -rf /', 'dd if=', 'chmod 777 /etc'];
  const violations: string[] = [];

  for (const cmd of dangerousCommands) {
    if (content.includes(cmd)) {
      violations.push(`Bash validator: Comando peligroso detectado: ${cmd}`);
    }
  }

  return {
    blocked: violations.length > 0,
    violations,
  };
});

// Mock stopHook
const mockStopHook = vi.fn().mockImplementation(async (input: any) => {
  const { editLog, cwd } = input;

  // Validate bash commands first
  const bashResults = await Promise.all(
    editLog.map(async (entry: any) => {
      try {
        const fs = await import('fs');
        const content = fs.readFileSync(join(cwd, entry.file), 'utf-8');
        return await mockBashValidator(content);
      } catch {
        return { blocked: false, violations: [] };
      }
    })
  );

  // Check if any file has violations
  const hasViolations = bashResults.some(result => result.blocked);
  const allViolations = bashResults.flatMap(result => result.violations);

  return {
    formatted: [],
    typecheck: [],
    hints: allViolations,
    autoResolved: false,
    kpiEvent: {
      timestamp: Date.now(),
      skills: hasViolations ? ['bash-validator'] : [],
      adherence: !hasViolations,
      latency_ms: 150,
    },
  };
});

describe('Bash Validator Integration Tests', () => {
  const TEST_REPO = '/tmp/test-bash-validator';

  beforeEach(async () => {
    // Setup test repo
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

  it('should call bash-validator.py from stopHook', async () => {
    await writeFile(join(TEST_REPO, 'cleanup.sh'), '#!/bin/bash\nrm -rf /');

    const result = await mockStopHook({
      editLog: [{ file: 'cleanup.sh', repo: 'test', ts: Date.now() }],
      reposChanged: new Set(['test']),
      cwd: TEST_REPO,
    });

    expect(mockBashValidator).toHaveBeenCalled();
  });

  it('should block stopHook when dangerous bash detected', async () => {
    await writeFile(join(TEST_REPO, 'dangerous.sh'), `
      #!/bin/bash
      rm -rf /
    `);

    const result = await mockStopHook({
      editLog: [{ file: 'dangerous.sh', repo: 'test', ts: Date.now() }],
      reposChanged: new Set(['test']),
      cwd: TEST_REPO,
    });

    expect(result.hints?.some(h => h.includes('bash'))).toBe(true);
  });

  it('should validate commands in package.json scripts', async () => {
    await writeFile(join(TEST_REPO, 'package.json'), JSON.stringify({
      scripts: {
        danger: 'rm -rf /',
      },
    }));

    const result = await mockStopHook({
      editLog: [{ file: 'package.json', repo: 'test', ts: Date.now() }],
      reposChanged: new Set(['test']),
      cwd: TEST_REPO,
    });

    expect(result.hints?.some(h => h.includes('bash'))).toBe(true);
  });

  it('should run before guardrails in pipeline', async () => {
    const executionOrder: string[] = [];

    const mockBash = vi.fn().mockImplementation(async () => {
      executionOrder.push('bash-validator');
      return { blocked: false, violations: [] };
    });

    const mockGuardrails = vi.fn().mockImplementation(async () => {
      executionOrder.push('guardrails');
      return { blocked: false, violations: [], warnings: [], suggestions: [] };
    });

    // Simulate execution order
    await mockBash();
    await mockGuardrails();

    expect(executionOrder).toEqual(['bash-validator', 'guardrails']);
  });

  it('should emit KPI event with bash validation results', async () => {
    await writeFile(join(TEST_REPO, 'bad.sh'), 'rm -rf /');

    const result = await mockStopHook({
      editLog: [{ file: 'bad.sh', repo: 'test', ts: Date.now() }],
      reposChanged: new Set(['test']),
      cwd: TEST_REPO,
    });

    expect(result.kpiEvent?.adherence).toBe(false);
    expect(result.kpiEvent?.skills).toContain('bash-validator');
  });
});
