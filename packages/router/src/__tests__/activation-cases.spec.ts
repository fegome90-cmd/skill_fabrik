import test from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { userPromptSubmitHook } from '../pre-invoke.js';
import type { PreHookInput } from '../types.js';

const CURRENT_DIR = fileURLToPath(new URL('.', import.meta.url));
const PROJECT_ROOT = join(CURRENT_DIR, '../../../..');

const cases: Array<{
  name: string;
  input: PreHookInput;
  expectedSkill: string;
}> = [
  {
    name: 'Caso 1: plan-save-workflow activa con plan APPROVED',
    expectedSkill: 'plan-save-workflow',
    input: {
      prompt: 'Workflow para guardar plan aprobado: genera tríada dev-docs (plan.md, context.md, task.md)',
      openFiles: ['dev/plans/plan-skill-fabric.json'],
      activeFileContent: '{"status":"APPROVED"}',
      activeFile: 'dev/plans/plan-skill-fabric.json',
      cwd: PROJECT_ROOT,
    },
  },
  {
    name: 'Caso 2: backend-dev-guidelines activa con router.post en controller',
    expectedSkill: 'backend-dev-guidelines',
    input: {
      prompt: 'crear endpoint backend en controller',
      openFiles: ['backend/src/controllers/AuthController.ts'],
      activeFileContent: 'router.post("/auth/login", handler);',
      activeFile: 'backend/src/controllers/AuthController.ts',
      cwd: PROJECT_ROOT,
    },
  },
  {
    name: 'Caso 3: database-verification bloquea operaciones sin WHERE',
    expectedSkill: 'database-verification',
    input: {
      prompt: 'auditar mutaciones masivas en repositorio prisma sin filtros where',
      openFiles: ['test-guardrails/repository/user-repository.ts', 'sql/sample.sql'],
      activeFileContent: 'await prisma.user.deleteMany({});',
      activeFile: 'test-guardrails/repository/user-repository.ts',
      cwd: PROJECT_ROOT,
    },
  },
  {
    name: 'Caso 4: pm2-monitor sugiere con ecosystem config',
    expectedSkill: 'pm2-monitor',
    input: {
      prompt: 'Configura PM2 para gestión de procesos backend con monitoreo, logs y playbooks de troubleshooting',
      openFiles: ['scripts/pm2/ecosystem.config.cjs'],
      activeFileContent: 'module.exports = { apps: [], /* pm2 ecosystem */ };',
      activeFile: 'scripts/pm2/ecosystem.config.cjs',
      cwd: PROJECT_ROOT,
    },
  },
];

for (const { name, input, expectedSkill } of cases) {
  test(name, async () => {
    const res = await userPromptSubmitHook(input);
    assert.ok(
      res.activated?.includes(expectedSkill),
      `Skill ${expectedSkill} should be activated`
    );
  });
}
