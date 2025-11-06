import { describe, it, expect } from 'vitest';
import { join } from 'path';
import { userPromptSubmitHook } from '../pre-invoke.js';
import type { PreHookInput } from '../types.js';

const PROJECT_ROOT = join(__dirname, '../../..');

describe('Activation cases (multi-signal heuristic)', () => {
  it('Caso 1: plan-save-workflow activa con plan APPROVED', async () => {
    const input: PreHookInput = {
      prompt: 'Guardar plan y aprobar definitivamente',
      openFiles: ['dev/plans/plan-skill-fabric.json'],
      activeFileContent: '{"status":"APPROVED"}',
      cwd: PROJECT_ROOT,
    };
    const res = await userPromptSubmitHook(input);
    expect(res.activated).toContain('plan-save-workflow');
  });

  it('Caso 2: backend-dev-guidelines activa con router.post en controller', async () => {
    const input: PreHookInput = {
      prompt: 'crear endpoint backend en controller',
      openFiles: ['backend/src/controllers/AuthController.ts'],
      activeFileContent: 'router.post("/auth/login", handler);',
      cwd: PROJECT_ROOT,
    };
    const res = await userPromptSubmitHook(input);
    expect(res.activated).toContain('backend-dev-guidelines');
  });

  it('Caso 3: database-verification-find sugiere con patrones de lectura', async () => {
    const input: PreHookInput = {
      prompt: 'verificar consultas de base de datos',
      openFiles: ['test-guardrails/repository/user-repository.ts', 'sql/sample.sql'],
      activeFileContent: 'findMany({ where: {} })\nSELECT * FROM information_schema.tables;',
      cwd: PROJECT_ROOT,
    };
    const res = await userPromptSubmitHook(input);
    expect(res.activated).toContain('database-verification-find');
  });

  it('Caso 4: pm2-monitor sugiere con ecosystem config', async () => {
    const input: PreHookInput = {
      prompt: 'pm2 monitorear procesos del backend',
      openFiles: ['scripts/pm2/ecosystem.config.cjs'],
      activeFileContent: 'module.exports = { apps: [], /* pm2 ecosystem */ };',
      cwd: PROJECT_ROOT,
    };
    const res = await userPromptSubmitHook(input);
    expect(res.activated).toContain('pm2-monitor');
  });
});


