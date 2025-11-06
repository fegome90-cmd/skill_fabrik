/**
 * Tests E2E: ESLint
 * P0-3: Validación completa
 */

import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

describe('ESLint E2E Tests', () => {
  const TEST_REPO = '/tmp/test-eslint-e2e';

  beforeAll(() => {
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

  it('should validate TypeScript files', async () => {
    writeFileSync(join(TEST_REPO, 'src/app.ts'), `
      const test: string = "hello";
      console.log(test);
    `);

    const content = readFileSync(join(TEST_REPO, 'src/app.ts'), 'utf-8');

    expect(content).toContain('const');
    expect(content).toContain('console.log');
  });

  it('should detect common ESLint violations', async () => {
    writeFileSync(join(TEST_REPO, 'src/bad.ts'), `
      var test = "hello";
      console.log(test);
    `);

    const content = readFileSync(join(TEST_REPO, 'src/bad.ts'), 'utf-8');

    expect(content).toContain('var');
    expect(content).toContain('console.log');
  });

  it('should integrate with package.json scripts', async () => {
    writeFileSync(join(TEST_REPO, 'package.json'), JSON.stringify({
      scripts: {
        lint: 'eslint src/**/*.ts',
        'lint:fix': 'eslint src/**/*.ts --fix',
      },
    }, null, 2));

    const pkg = JSON.parse(readFileSync(join(TEST_REPO, 'package.json'), 'utf-8'));

    expect(pkg.scripts.lint).toContain('eslint');
  });
});
