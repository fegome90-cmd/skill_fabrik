/**
 * Rules Loader (Shared)
 * Carga de skill-rules.json con cache por mtime. No rompe flujos actuales.
 */

import { readFile, stat } from 'fs/promises';
import { resolve } from 'path';
import type { SkillRules, RulesCacheEntry } from './index.js';

const cache = new Map<string, RulesCacheEntry>();

function candidatePaths(cwd: string): string[] {
  const envPath = process.env.SKILL_RULES_PATH && String(process.env.SKILL_RULES_PATH).trim();
  const c = resolve(cwd);
  return [
    envPath || '',
    resolve(c, 'configs/skill-rules.json'),
    resolve(c, '../configs/skill-rules.json'),
    resolve(c, '../../configs/skill-rules.json'),
  ].filter(Boolean);
}

export async function loadSkillRulesCached(cwd: string): Promise<SkillRules> {
  const paths = candidatePaths(cwd);
  for (const p of paths) {
    try {
      const st = await stat(p).catch(() => undefined);
      if (!st) continue;
      const prev = cache.get(p);
      if (prev && prev.mtimeMs === st.mtimeMs) return prev.rules;
      const raw = await readFile(p, 'utf-8');
      const rules = JSON.parse(raw) as SkillRules;
      cache.set(p, { path: p, mtimeMs: st.mtimeMs, rules });
      return rules;
    } catch {
      // probar siguiente path
      continue;
    }
  }
  return {} as SkillRules;
}

