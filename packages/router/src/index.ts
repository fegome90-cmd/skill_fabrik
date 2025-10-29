/**
 * Router de activación de skills
 * Exporta hooks pre-invoke y stop para integración con editores/CLI
 */

export { userPromptSubmitHook } from './pre-invoke.js';
export { stopHook } from './stop.js';
export { loadRules, matchRulesFor } from './detectors.js';
export { checkGuardrails } from './guardrails.js';
export type {
  SkillRule,
  SkillRules,
  PreHookInput,
  PreHookOutput,
  StopHookInput,
  StopHookOutput,
  KPIEvent,
  GuardrailViolation,
} from './types.js';
