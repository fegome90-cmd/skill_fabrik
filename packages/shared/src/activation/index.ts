/**
 * Activation Core (Shared)
 * Objetivo: centralizar señales y tipos de activación sin acoplar a daemon/router.
 * Nota: Este módulo es scaffolding y NO cambia el comportamiento actual.
 */

import type { Stats } from 'fs';

// Tipos mínimos compatibles con reglas de skills
export interface SkillRule {
  promptTriggers?: {
    keywords?: string[];
    intentPatterns?: string[];
  };
  fileTriggers?: {
    pathPatterns?: string[];
    contentPatterns?: string[];
  };
}

export type SkillRules = Record<string, SkillRule>;

export interface SignalScores {
  keywords: number;
  intent: number;
  path: number;
  content: number;
  matched: string[];
}

export const DEFAULT_SIGNAL_WEIGHTS = {
  keywords: 0.25,
  intent: 0.25,
  path: 0.25,
  content: 0.25,
} as const;

export const DEFAULT_ACTIVATION_THRESHOLD = 0.6;

export interface ActivationContextLike {
  activeFile?: string;
  activeFileContent?: string;
  files?: string[];
}

/**
 * computeSignals: versión pura (no I/O) para evaluar señales sobre reglas.
 * - Retorna scores normalizados [0..1] y patrones coincidentes.
 */
export function computeSignals(
  intentText: string,
  context: ActivationContextLike,
  rules: SkillRules
): SignalScores {
  const matched: string[] = [];
  const intent = (intentText || '').toLowerCase();
  const activeFile = String(context?.activeFile || '').toLowerCase();
  const content = String(context?.activeFileContent || '').toLowerCase();
  const files: string[] = Array.isArray(context?.files) ? context.files.map(f => String(f).toLowerCase()) : [];

  const entries = Object.entries(rules) as Array<[string, SkillRule]>;

  // Keywords
  let kwHits = 0, kwTotal = 0;
  for (const [, rule] of entries) {
    const kws = rule?.promptTriggers?.keywords || [];
    kwTotal += kws.length;
    for (const k of kws) {
      if (intent.includes(String(k).toLowerCase())) { kwHits++; matched.push(k); }
    }
  }
  const keywordsScore = kwTotal > 0 ? Math.min(1, kwHits / Math.max(1, kwTotal)) : 0;

  // Intent patterns
  let ipHits = 0, ipTotal = 0;
  for (const [, rule] of entries) {
    const ips = rule?.promptTriggers?.intentPatterns || [];
    ipTotal += ips.length;
    for (const p of ips) {
      try { if (new RegExp(p, 'i').test(intent)) { ipHits++; matched.push(p); } } catch {}
    }
  }
  const intentScore = ipTotal > 0 ? Math.min(1, ipHits / Math.max(1, ipTotal)) : 0;

  // Path patterns
  let pathHits = 0, pathTotal = 0;
  const allPaths = [activeFile, ...files].filter(Boolean);
  for (const [, rule] of entries) {
    const pps = rule?.fileTriggers?.pathPatterns || [];
    pathTotal += pps.length;
    for (const pat of pps) {
      const re = new RegExp(String(pat).replace(/\*\*/g, '.*').replace(/\*/g, '[^/]+'), 'i');
      if (allPaths.some(p => re.test(p))) { pathHits++; matched.push(pat); }
    }
  }
  const pathScore = pathTotal > 0 ? Math.min(1, pathHits / Math.max(1, pathTotal)) : 0;

  // Content patterns
  let ctHits = 0, ctTotal = 0;
  for (const [, rule] of entries) {
    const cps = rule?.fileTriggers?.contentPatterns || [];
    ctTotal += cps.length;
    for (const cp of cps) {
      try { if (content && new RegExp(cp, 'i').test(content)) { ctHits++; matched.push(cp); } } catch {}
    }
  }
  const contentScore = ctTotal > 0 ? Math.min(1, ctHits / Math.max(1, ctTotal)) : 0;

  return { keywords: keywordsScore, intent: intentScore, path: pathScore, content: contentScore, matched };
}

/**
 * aggregateScore: combina señales con pesos. No aplica threshold.
 */
export function aggregateScore(signals: SignalScores, weights = DEFAULT_SIGNAL_WEIGHTS): number {
  const s = weights;
  const sum = s.keywords + s.intent + s.path + s.content;
  const norm = sum === 0 ? 1 : sum;
  const w = (signals.keywords * s.keywords + signals.intent * s.intent + signals.path * s.path + signals.content * s.content) / norm;
  return Math.max(0, Math.min(1, Number(w.toFixed(4))));
}

/**
 * Tip auxiliar para cache de reglas por mtime.
 */
export interface RulesCacheEntry {
  path: string;
  mtimeMs: number;
  rules: SkillRules;
}

export type MTimeFn = (path: string) => Promise<Stats|undefined>;

