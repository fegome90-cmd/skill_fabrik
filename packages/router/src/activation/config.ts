import { type ActivationConfig, type ActivationWeights } from './types.js';

type SkillRulesLike = Record<string, any> & { _activationDefaults?: any };

export function buildActivationConfig(skillName: string, rules: SkillRulesLike): ActivationConfig {
  const defaults = normalizeConfig(rules._activationDefaults || {});
  const skill = rules[skillName] || {};
  const custom = normalizeConfig(skill.activationConfig || {});
  return {
    threshold: custom.threshold ?? defaults.threshold ?? 0.6,
    allowList: custom.allowList ?? defaults.allowList ?? [],
    denyList: custom.denyList ?? defaults.denyList ?? [],
    weights: mergeWeights(defaults.weights, custom.weights),
  };
}

function normalizeConfig(input: any): Partial<ActivationConfig> {
  const out: Partial<ActivationConfig> = {};
  if (typeof input.threshold === 'number') out.threshold = clamp01(input.threshold);
  if (Array.isArray(input.allowList)) out.allowList = input.allowList;
  if (Array.isArray(input.denyList)) out.denyList = input.denyList;
  if (typeof input.weights === 'object' && input.weights) out.weights = input.weights as ActivationWeights;
  return out;
}

function mergeWeights(a?: ActivationWeights, b?: ActivationWeights): ActivationWeights {
  return { ...(a || {}), ...(b || {}) };
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}


