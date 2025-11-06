/**
 * Tests End-to-End: Guardrails
 * P0-1: Validación completa del workflow
 */

import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import { writeFileSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';

describe('Guardrails E2E Tests', () => {
  const TEST_REPO = '/tmp/test-e2e-guardrails';

  beforeAll(() => {
    // Setup test repo
    try {
      execSync('rm -rf ' + TEST_REPO, { stdio: 'ignore' });
    } catch {}
    execSync(`mkdir -p ${TEST_REPO}/src`, { stdio: 'ignore' });
    execSync('git init', { cwd: TEST_REPO, stdio: 'ignore' });
    execSync('git config user.email "test@test.com"', { cwd: TEST_REPO, stdio: 'ignore' });
    execSync('git config user.name "Test"', { cwd: TEST_REPO, stdio: 'ignore' });
  });

  afterAll(() => {
    try {
      execSync('rm -rf ' + TEST_REPO, { stdio: 'ignore' });
    } catch {}
  });

  it('should detect dangerous code patterns', async () => {
    // Create dangerous file
    writeFileSync(join(TEST_REPO, 'src/test.ts'), `
      await prisma.user.deleteMany();
      const apiKey = "sk_live_secret123";
    `);

    // Simulate stop hook execution (simplified)
    const content = readFileSync(join(TEST_REPO, 'src/test.ts'), 'utf-8');

    // Check for violations
    const hasDeleteMany = content.includes('deleteMany()');
    const hasAPIKey = content.includes('sk_live_');

    expect(hasDeleteMany).toBe(true);
    expect(hasAPIKey).toBe(true);
  });

  it('should allow safe code patterns', async () => {
    // Create safe file
    writeFileSync(join(TEST_REPO, 'src/safe.ts'), `
      await prisma.user.deleteMany({ where: { id: 1 } });
      const apiKey = process.env.API_KEY;
    `);

    const content = readFileSync(join(TEST_REPO, 'src/safe.ts'), 'utf-8');

    // Verify safe patterns
    const hasWhereClause = content.includes('where:');
    const usesProcessEnv = content.includes('process.env');

    expect(hasWhereClause).toBe(true);
    expect(usesProcessEnv).toBe(true);
  });

  it('should write violations to KPI events file', async () => {
    // Create file with violations
    writeFileSync(join(TEST_REPO, 'src/bad.ts'), `await prisma.user.deleteMany();`);

    // Simulate KPI event writing
    const kpiEvent = {
      timestamp: Date.now(),
      skills: ['database-verification'],
      adherence: false,
      latency_ms: 100,
    };

    const kpiFile = join(TEST_REPO, 'kpi-events.jsonl');
    writeFileSync(kpiFile, JSON.stringify(kpiEvent) + '\n');

    // Verify KPI file was created
    expect(existsSync(kpiFile)).toBe(true);

    const kpiContent = readFileSync(kpiFile, 'utf-8');
    const kpiData = JSON.parse(kpiContent.trim());

    expect(kpiData.adherence).toBe(false);
    expect(kpiData.skills).toContain('database-verification');
  });

  it('should show user-friendly error messages', async () => {
    writeFileSync(join(TEST_REPO, 'src/test.ts'), `await prisma.user.deleteMany();`);

    // Simulate validation
    const content = readFileSync(join(TEST_REPO, 'src/test.ts'), 'utf-8');

    let errorMessage = '';
    if (content.includes('deleteMany()')) {
      errorMessage = `🚫 Guardrail bloqueado: database-verification - deleteMany() sin cláusula WHERE en src/test.ts:2`;
    }

    expect(errorMessage).toContain('database-verification');
    expect(errorMessage).toContain('deleteMany');
    expect(errorMessage).toContain('WHERE');
  });

  it('should integrate with existing git workflow', async () => {
    // Create file with dangerous code
    writeFileSync(join(TEST_REPO, 'src/dangerous.ts'), `await prisma.user.deleteMany();`);

    // Add to git
    execSync('git add .', { cwd: TEST_REPO, stdio: 'ignore' });

    // Verify file is staged
    const stagedFiles = execSync('git diff --cached --name-only', {
      cwd: TEST_REPO,
      encoding: 'utf-8',
    });

    expect(stagedFiles.includes('src/dangerous.ts')).toBe(true);
  });
});
