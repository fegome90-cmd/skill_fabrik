/**
 * Pre-invoke Hook: Detecta y activa skills antes de que el agente procese el prompt
 */

import { loadRules, matchRulesFor } from './detectors.js';
import { checkApprovedPlan, isPlanningModeEnabled } from './utils/plan-check.js';
import type { PreHookInput, PreHookOutput } from './types.js';

/**
 * Hook pre-invoke: analiza prompt, archivos abiertos y contenido para activar skills
 * También verifica gate de planning mode si está habilitado
 */
export async function userPromptSubmitHook(input: PreHookInput): Promise<PreHookOutput> {
  // Check planning mode gate first
  if (isPlanningModeEnabled()) {
    const planCheck = await checkApprovedPlan(input.cwd);

    if (!planCheck.hasPlan) {
      return {
        injectedNote: undefined,
        activated: [],
        metadata: { scores: {}, reasons: {} },
        blocked: true,
        blockReason: `🚫 PLANNING MODE GATE: No approved plan found.\n\nTo proceed:\n  1. Create plan: skills plan create "<task description>"\n  2. Approve plan: skills plan approve <plan-id>\n  3. Save workflow: skills plan save <plan-id> --approve\n\nOr disable planning mode: SKILLS_PLANNING_MODE=false`,
      };
    }
  }

  // Continue with skill activation
  const rules = await loadRules(input.cwd);
  const threshold = parseFloat(process.env.SKILL_ACTIVATION_THRESHOLD || '0.6');

  const output = matchRulesFor(input, rules, threshold);

  // Add plan info if available
  if (isPlanningModeEnabled()) {
    const planCheck = await checkApprovedPlan(input.cwd);
    if (planCheck.hasPlan && planCheck.plan) {
      output.injectedNote = `📋 ACTIVE PLAN: ${planCheck.plan.id} (${planCheck.taskName})\n\n${output.injectedNote || ''}`;
    }
  }

  return output;
}
