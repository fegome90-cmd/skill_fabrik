/**
 * Test básico de guardrails
 * Verifica bloqueo de operaciones peligrosas
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { checkGuardrails } from '../guardrails.js';
import type { EditLogEntry } from '../types.js';

// Usar cwd desde la raíz del proyecto donde está configs/skill-rules.json
const PROJECT_ROOT = join(__dirname, '../../..');

describe('Guardrails - Database Verification', () => {
  const testDir = join(PROJECT_ROOT, 'test-temp', 'backend', 'src', 'repository');
  const testFile = join(testDir, 'UserRepository.ts');

  beforeEach(async () => {
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await unlink(testFile);
      await unlink(join(testDir, 'Migrations.sql'));
    } catch {
      // Ignore cleanup errors
    }
  });

  it('debe bloquear deleteMany sin where', async () => {
    // Crear archivo con deleteMany peligroso
    await writeFile(
      testFile,
      `export class UserRepository {
  async deleteAll() {
    await db.user.deleteMany();
  }
}`,
      'utf-8'
    );

    // Usar ruta relativa para que coincida con pathPatterns
    const relativePath = testFile.replace(PROJECT_ROOT + '/', '');
    const editLog: EditLogEntry[] = [{ file: relativePath, repo: 'backend', ts: Date.now() }];

    const result = await checkGuardrails(editLog, PROJECT_ROOT);

    expect(result.blocked).toBe(true);
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations.some(v => v.pattern.includes('deleteMany'))).toBe(true);
  });

  it('debe permitir deleteMany con where', async () => {
    // Crear archivo con deleteMany seguro
    await writeFile(
      testFile,
      `export class UserRepository {
  async deleteInactive() {
    await db.user.deleteMany({
      where: { active: false }
    });
  }
}`,
      'utf-8'
    );

    // Usar ruta relativa para que coincida con pathPatterns
    const relativePath = testFile.replace(PROJECT_ROOT + '/', '');
    const editLog: EditLogEntry[] = [{ file: relativePath, repo: 'backend', ts: Date.now() }];

    const result = await checkGuardrails(editLog, PROJECT_ROOT);

    // No debería bloquear si tiene where
    expect(result.blocked).toBe(false);
  });

  it('debe bloquear updateMany sin where', async () => {
    await writeFile(
      testFile,
      `export class UserRepository {
  async updateAll() {
    await db.user.updateMany({
      data: { status: 'active' }
    });
  }
}`,
      'utf-8'
    );

    // Usar ruta relativa para que coincida con pathPatterns
    const relativePath = testFile.replace(PROJECT_ROOT + '/', '');
    const editLog: EditLogEntry[] = [{ file: relativePath, repo: 'backend', ts: Date.now() }];

    const result = await checkGuardrails(editLog, PROJECT_ROOT);

    expect(result.blocked).toBe(true);
    expect(result.violations.some(v => v.pattern.includes('updateMany'))).toBe(true);
  });
});
