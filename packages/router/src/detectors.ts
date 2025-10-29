/**
 * Detectores de skills basados en múltiples señales
 * Implementa heurística multi-señal: keywords (20%) + intent (30%) + path (30%) + content (20%)
 */

import { readFile } from 'fs/promises';
import { resolve } from 'path';
import type { SkillRules, SkillRule, PreHookInput, PreHookOutput } from './types.js';

/**
 * Carga skill-rules.json desde configs/
 */
export async function loadRules(cwd: string = process.cwd()): Promise<SkillRules> {
  const rulesPath = resolve(cwd, 'configs/skill-rules.json');
  try {
    const content = await readFile(rulesPath, 'utf-8');
    return JSON.parse(content) as SkillRules;
  } catch (error) {
    console.warn(`No se encontró skill-rules.json en ${rulesPath}, usando reglas vacías`);
    return {};
  }
}

/**
 * Match simple de glob pattern (soporta ** y *)
 */
function minimatchLike(file: string, pattern: string): boolean {
  // Escapar puntos literales
  let regexStr = pattern
    .replace(/\./g, '\\. ')
    .replace(/\*\*/g, '__DOUBLESTAR__')
    .replace(/\*/g, '[^/]+')
    .replace('__DOUBLESTAR__', '.*');

  // Normalizar separadores
  const normalizedFile = file.replace(/\\/g, '/');
  regexStr = regexStr.replace(/\\/g, '/');

  try {
    return new RegExp(`^${regexStr}$`).test(normalizedFile);
  } catch {
    return false;
  }
}

/**
 * Calcula score de match para un skill específico
 * Weights: keywords 20%, intent 30%, path 30%, content 20%
 */
function calculateSkillScore(
  rule: SkillRule,
  input: PreHookInput
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // Keywords match (20%)
  if (rule.promptTriggers?.keywords) {
    const lowerPrompt = input.prompt.toLowerCase();
    const keywordMatches = rule.promptTriggers.keywords.filter(kw =>
      lowerPrompt.includes(kw.toLowerCase())
    );
    if (keywordMatches.length > 0) {
      score += 0.2;
      reasons.push(`keywords: ${keywordMatches.join(', ')}`);
    }
  }

  // Intent regex match (30%)
  if (rule.promptTriggers?.intentPatterns) {
    const intentMatches = rule.promptTriggers.intentPatterns.filter(pattern => {
      try {
        return new RegExp(pattern, 'i').test(input.prompt);
      } catch {
        return false;
      }
    });
    if (intentMatches.length > 0) {
      score += 0.3;
      reasons.push(`intent: ${intentMatches.length} pattern(s) matched`);
    }
  }

  // Path glob match (30%)
  if (rule.fileTriggers?.pathPatterns) {
    const pathMatches = rule.fileTriggers.pathPatterns.filter(glob =>
      input.openFiles.some(file => minimatchLike(file, glob))
    );
    if (pathMatches.length > 0) {
      score += 0.3;
      reasons.push(`path: ${pathMatches.join(', ')}`);
    }
  }

  // Content pattern match (20%)
  if (rule.fileTriggers?.contentPatterns && input.activeFileContent) {
    const contentMatches = rule.fileTriggers.contentPatterns.filter(pattern => {
      try {
        return new RegExp(pattern).test(input.activeFileContent!);
      } catch {
        return false;
      }
    });
    if (contentMatches.length > 0) {
      score += 0.2;
      reasons.push(`content: ${contentMatches.length} pattern(s) matched`);
    }
  }

  return { score, reasons };
}

/**
 * Detecta skills relevantes para un prompt/contexto dado
 * Threshold default: 0.6 (configurable)
 */
export function matchRulesFor(
  input: PreHookInput,
  rules: SkillRules,
  threshold: number = 0.6
): PreHookOutput {
  const activated: string[] = [];
  const scores: Record<string, number> = {};
  const reasons: Record<string, string[]> = {};
  const noteLines: string[] = [];

  for (const [skillId, rule] of Object.entries(rules)) {
    const { score, reasons: skillReasons } = calculateSkillScore(rule, input);

    scores[skillId] = score;
    if (skillReasons.length > 0) {
      reasons[skillId] = skillReasons;
    }

    if (score >= threshold) {
      activated.push(skillId);
      noteLines.push(`● ${skillId} (${rule.enforcement}/${rule.priority})`);

      // Añadir razones de activación
      if (skillReasons.length > 0) {
        noteLines.push(`  → reason: ${skillReasons.join(', ')}`);
      }

      // Añadir recursos si están definidos
      if (rule.resources && rule.resources.length > 0) {
        noteLines.push(`  → resources: ${rule.resources.length} disponible(s) (on-demand)`);
      }
    }
  }

  const injectedNote =
    activated.length > 0
      ? `🎯 SKILL ACTIVATION CHECK:\n\n${noteLines.join('\n')}\n\n→ Cargar SKILL.md (main) y recursos on-demand según referencias.`
      : undefined;

  return {
    injectedNote,
    activated,
    metadata: { scores, reasons },
  };
}
