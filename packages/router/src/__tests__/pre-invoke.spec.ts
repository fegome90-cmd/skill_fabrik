/**
 * Test básico de pre-invoke hook
 * Verifica activación de skills basada en prompt y archivos abiertos
 */

import { describe, it, expect } from 'vitest';
import { join } from 'path';
import { userPromptSubmitHook } from '../pre-invoke.js';
import type { PreHookInput } from '../types.js';

// Usar cwd desde la raíz del proyecto donde está configs/skill-rules.json
const PROJECT_ROOT = join(__dirname, '../../..');

describe('Pre-invoke Hook', () => {
  it('debe activar backend-dev-guidelines cuando el prompt menciona "crear endpoint"', async () => {
    const input: PreHookInput = {
      prompt: 'crear un endpoint nuevo para usuarios',
      openFiles: ['backend/src/routes/users.ts'],
      activeFileContent: 'export const router = express.Router();',
      cwd: PROJECT_ROOT,
    };

    const result = await userPromptSubmitHook(input);

    expect(result.activated).toContain('backend-dev-guidelines');
    expect(result.metadata.scores['backend-dev-guidelines']).toBeGreaterThan(0.6);
  });

  it('debe activar frontend-dev-guidelines cuando se edita componente', async () => {
    const input: PreHookInput = {
      prompt: 'crear componente nuevo',
      openFiles: ['frontend/src/components/UserCard.tsx'],
      activeFileContent: 'export function UserCard() {}',
      cwd: PROJECT_ROOT,
    };

    const result = await userPromptSubmitHook(input);

    expect(result.activated).toContain('frontend-dev-guidelines');
    expect(result.metadata.scores['frontend-dev-guidelines']).toBeGreaterThan(0.6);
  });

  it('no debe activar skills irrelevantes', async () => {
    const input: PreHookInput = {
      prompt: 'documentar código',
      openFiles: ['README.md'],
      cwd: PROJECT_ROOT,
    };

    const result = await userPromptSubmitHook(input);

    // No debería activar skills técnicos para documentación
    expect(result.activated.filter(id => id.includes('dev-guidelines'))).toHaveLength(0);
  });
});
