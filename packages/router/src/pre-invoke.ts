/**
 * Pre-invoke Hook: Detecta y activa skills antes de que el agente procese el prompt
 */

import { loadRules, matchRulesFor } from './detectors.js';
import type { PreHookInput, PreHookOutput } from './types.js';

/**
 * Hook pre-invoke: analiza prompt, archivos abiertos y contenido para activar skills
 */
export async function userPromptSubmitHook(input: PreHookInput): Promise<PreHookOutput> {
  const rules = await loadRules(input.cwd);
  const threshold = parseFloat(process.env.SKILL_ACTIVATION_THRESHOLD || '0.6');

  return matchRulesFor(input, rules, threshold);
}
