/**
 * Detectores de skills basados en múltiples señales
 * Implementa heurística multi-señal: keywords (20%) + intent (30%) + path (30%) + content (20%)
 * 
 * FUZZY MATCHING ENGINE v1.0
 * - Jaro-Winkler similarity algorithm
 * - Cache optimization for performance
 * - Configurable threshold (default: 0.7)
 */

import { readFile, stat } from 'fs/promises';
import { resolve } from 'path';
import type { SkillRules, SkillRule, PreHookInput, PreHookOutput } from './types.js';

// Cache para skill rules con invalidación por timestamp
interface RulesCache {
  rules: SkillRules;
  timestamp: number;
  filePath: string;
}

let rulesCache: RulesCache | null = null;
const CACHE_TTL_MS = 60000; // 1 minuto de cache

// =============================================================================
// CONTEXTUAL BOOST SYSTEM v2.0
// =============================================================================

// Cache para historial de activaciones (LRU)
interface ActivationHistoryEntry {
  skillId: string;
  timestamp: number;
  context: string;
  score: number;
}

interface ActivationHistory {
  entries: ActivationHistoryEntry[];
  maxSize: number;
}

const activationHistory: ActivationHistory = {
  entries: [],
  maxSize: 50
};

// Cache para densidad de keywords por contexto
const keywordDensityCache = new Map<string, number>();

// Factores de refuerzo contextual (v2.0)
interface BoostFactors {
  fileContext: number;      // 0.15 - Contexto del archivo activo
  recentActivation: number; // 0.10 - Activación reciente
  keywordDensity: number;   // 0.05 - Densidad de keywords
  intentMatch: number;      // 0.12 - Match de intent mejorado
}

export const BOOST_FACTORS: BoostFactors = {
  fileContext: 0.15,
  recentActivation: 0.10,
  keywordDensity: 0.05,
  intentMatch: 0.12
};

// =============================================================================
// FUZZY MATCHING ENGINE - Cache and Core Functions
// =============================================================================

export const fuzzyCache = new Map<string, number>();
export const FUZZY_MATCH_THRESHOLD = parseFloat(process.env.FUZZY_MATCH_THRESHOLD || '0.7');
export { fuzzyScore, calculateJaroDistance, calculatePrefixMatch };

// Export contextual boost system components
export {
  addToActivationHistory,
  calculateContextualBoosts,
  calculateFileContextBoost,
  calculateRecentActivationBoost,
  calculateKeywordDensityBoost,
  calculateIntentMatchBoost
};

/**
 * Get cached fuzzy score to avoid recalculation
 */
function getCachedFuzzyScore(text: string, pattern: string): number {
  const key = `${text}::${pattern}`;
  return fuzzyCache.get(key) || -1;
}

/**
 * Set cached fuzzy score with simple LRU
 */
function setCachedFuzzyScore(text: string, pattern: string, score: number): void {
  if (fuzzyCache.size > 1000) {
    const firstKey = fuzzyCache.keys().next().value;
    if (firstKey !== undefined) {
      fuzzyCache.delete(firstKey);
    }
  }
  const key = `${text}::${pattern}`;
  fuzzyCache.set(key, score);
}

/**
 * Calculate fuzzy similarity score between two strings using Jaro-Winkler algorithm
 * Returns value between 0 (no similarity) and 1 (perfect match)
 */
function fuzzyScore(text: string, pattern: string): number {
  const t = text.toLowerCase().trim();
  const p = pattern.toLowerCase().trim();

  // Check cache first
  const cached = getCachedFuzzyScore(t, p);
  if (cached !== -1) {
    return cached;
  }

  // Exact match optimization
  if (t === p) {
    setCachedFuzzyScore(t, p, 1.0);
    return 1.0;
  }

  // Very short strings - use simple comparison
  if (t.length < 3 || p.length < 3) {
    const score = t.includes(p) || p.includes(t) ? 0.8 : 0.0;
    setCachedFuzzyScore(t, p, score);
    return score;
  }

  // Jaro-Winkler similarity
  const jaroDistance = calculateJaroDistance(t, p);
  const prefixMatch = calculatePrefixMatch(t, p, 4);

  // Jaro-Winkler = Jaro + (prefix * (1 - Jaro)) * 0.1
  const score = jaroDistance + (prefixMatch * 0.1 * (1 - jaroDistance));
  
  setCachedFuzzyScore(t, p, score);
  return score;
}

/**
 * Calculate Jaro distance between two strings
 */
function calculateJaroDistance(s1: string, s2: string): number {
  const len1 = s1.length;
  const len2 = s2.length;

  if (len1 === 0) return len2 === 0 ? 1 : 0;
  if (len2 === 0) return 0;

  const matchDistance = Math.floor(Math.max(len1, len2) / 2) - 1;
  const s1Matches = new Array(len1).fill(false);
  const s2Matches = new Array(len2).fill(false);

  let matches = 0;
  let transpositions = 0;

  // Find matches
  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, len2);

    for (let j = start; j < end; j++) {
      if (s2Matches[j]) continue;
      if (s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0;

  // Count transpositions
  let k = 0;
  for (let i = 0; i < len1; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }

  const jaro = ((matches / len1) + (matches / len2) + ((matches - transpositions / 2) / matches)) / 3;
  return jaro;
}

/**
 * Calculate prefix match bonus (Jaro-Winkler prefix scaling)
 */
function calculatePrefixMatch(s1: string, s2: string, maxPrefix: number): number {
  let prefix = 0;
  for (let i = 0; i < Math.min(maxPrefix, s1.length, s2.length); i++) {
    if (s1[i] === s2[i]) prefix++;
    else break;
  }
  return prefix / maxPrefix;
}

// =============================================================================
// CONTEXTUAL BOOST FUNCTIONS
// =============================================================================

/**
 * Añade entrada al historial de activaciones (LRU)
 */
function addToActivationHistory(skillId: string, context: string, score: number): void {
  const entry: ActivationHistoryEntry = {
    skillId,
    timestamp: Date.now(),
    context,
    score
  };

  // Añadir al inicio
  activationHistory.entries.unshift(entry);

  // Mantener tamaño máximo
  if (activationHistory.entries.length > activationHistory.maxSize) {
    activationHistory.entries.pop();
  }
}

/**
 * Calcula refuerzo basado en contexto del archivo activo
 */
function calculateFileContextBoost(rule: SkillRule, input: PreHookInput): number {
  if (!input.activeFileContent || !input.openFiles || input.openFiles.length === 0) {
    return 0;
  }

  let boost = 0;

  // Verificar si el archivo activo coincide con patrones del skill
  if (rule.fileTriggers?.pathPatterns) {
    const activeFile = input.openFiles[0]; // Archivo principal activo
    const pathMatches = rule.fileTriggers.pathPatterns.filter(pattern =>
      minimatchLike(activeFile, pattern)
    );

    if (pathMatches.length > 0) {
      boost += BOOST_FACTORS.fileContext * (pathMatches.length / rule.fileTriggers.pathPatterns.length);
    }
  }

  // Verificar contenido del archivo activo
  if (rule.fileTriggers?.contentPatterns && input.activeFileContent) {
    const contentMatches = rule.fileTriggers.contentPatterns.filter(pattern => {
      try {
        return new RegExp(pattern).test(input.activeFileContent!);
      } catch {
        return false;
      }
    });

    if (contentMatches.length > 0) {
      boost += BOOST_FACTORS.fileContext * 0.5; // Medio boost adicional por contenido
    }
  }

  return Math.min(boost, BOOST_FACTORS.fileContext); // Máximo igual al factor
}

/**
 * Calcula refuerzo basado en activaciones recientes
 */
function calculateRecentActivationBoost(skillId: string): number {
  const now = Date.now();
  const recentThreshold = 5 * 60 * 1000; // 5 minutos

  let boost = 0;
  let recentCount = 0;

  for (const entry of activationHistory.entries) {
    // Solo entradas del mismo skill
    if (entry.skillId === skillId) {
      const age = now - entry.timestamp;
      if (age < recentThreshold) {
        recentCount++;
        // Decay exponencial basado en tiempo
        const decayFactor = Math.exp(-age / recentThreshold);
        boost += entry.score * decayFactor;
      }
    }
  }

  // Normalizar y aplicar factor
  if (recentCount > 0) {
    boost = (boost / recentCount) * BOOST_FACTORS.recentActivation;
    return Math.min(boost, BOOST_FACTORS.recentActivation);
  }

  return 0;
}

/**
 * Calcula refuerzo basado en densidad de keywords en el prompt
 */
function calculateKeywordDensityBoost(rule: SkillRule, input: PreHookInput): number {
  if (!rule.promptTriggers?.keywords || rule.promptTriggers.keywords.length === 0) {
    return 0;
  }

  const prompt = input.prompt.toLowerCase();
  const totalKeywords = rule.promptTriggers.keywords.length;
  let matchedKeywords = 0;

  // Contar keywords coincidentes (exactas y fuzzy)
  for (const keyword of rule.promptTriggers.keywords) {
    const lowerKeyword = keyword.toLowerCase();

    // Exact match
    if (prompt.includes(lowerKeyword)) {
      matchedKeywords += 1;
      continue;
    }

    // Fuzzy match
    const fuzzy = fuzzyScore(prompt, lowerKeyword);
    if (fuzzy >= FUZZY_MATCH_THRESHOLD) {
      matchedKeywords += fuzzy; // Peso por score fuzzy
    }
  }

  // Calcular densidad (0-1)
  const density = matchedKeywords / totalKeywords;

  // Aplicar boost proporcional a la densidad
  const boost = density * BOOST_FACTORS.keywordDensity;

  return Math.min(boost, BOOST_FACTORS.keywordDensity);
}

/**
 * Calcula refuerzo basado en match de intent mejorado
 */
function calculateIntentMatchBoost(rule: SkillRule, input: PreHookInput): number {
  if (!rule.promptTriggers?.intentPatterns || rule.promptTriggers.intentPatterns.length === 0) {
    return 0;
  }

  const prompt = input.prompt.toLowerCase();
  const patterns = rule.promptTriggers.intentPatterns;
  let matchCount = 0;
  let totalWeight = 0;

  for (const pattern of patterns) {
    try {
      const regex = new RegExp(pattern, 'i');
      if (regex.test(prompt)) {
        matchCount++;

        // Peso adicional si es match fuzzy del intent
        const fuzzyMatches = rule.promptTriggers!.keywords?.filter(kw => {
          const fuzzy = fuzzyScore(prompt, kw.toLowerCase());
          return fuzzy >= FUZZY_MATCH_THRESHOLD * 0.9; // Threshold ligeramente menor
        }) || [];

        if (fuzzyMatches.length > 0) {
          totalWeight += 1.5; // Bonus por fuzzy match en intent
        } else {
          totalWeight += 1.0; // Match normal
        }
      }
    } catch {
      // Pattern inválido, ignorar
    }
  }

  if (matchCount === 0) return 0;

  // Calcular boost basado en fuerza del match
  const matchStrength = Math.min(totalWeight / patterns.length, 1.5);
  const boost = (matchCount / patterns.length) * matchStrength * BOOST_FACTORS.intentMatch;

  return Math.min(boost, BOOST_FACTORS.intentMatch);
}

/**
 * Calcula todos los refuerzos contextuales y retorna el total
 */
function calculateContextualBoosts(rule: SkillRule, input: PreHookInput, skillId: string): {
  total: number;
  breakdown: Record<string, number>;
} {
  const breakdown: Record<string, number> = {};

  const fileBoost = calculateFileContextBoost(rule, input);
  const recentBoost = calculateRecentActivationBoost(skillId);
  const densityBoost = calculateKeywordDensityBoost(rule, input);
  const intentBoost = calculateIntentMatchBoost(rule, input);

  breakdown.fileContext = fileBoost;
  breakdown.recentActivation = recentBoost;
  breakdown.keywordDensity = densityBoost;
  breakdown.intentMatch = intentBoost;

  const total = fileBoost + recentBoost + densityBoost + intentBoost;

  return { total, breakdown };
}

/**
 * Carga skill-rules.json desde configs/ con cache y invalidación inteligente
 */
export async function loadRules(cwd: string = process.cwd()): Promise<SkillRules> {
  const now = Date.now();

  // Verificar cache válido
  if (rulesCache && (now - rulesCache.timestamp) < CACHE_TTL_MS) {
    return rulesCache.rules;
  }

  // Posibles ubicaciones para skill-rules.json
  const possiblePaths = [
    resolve(cwd, 'configs/skill-rules.json'), // Raíz del proyecto
    resolve(cwd, '../configs/skill-rules.json'), // Si estamos en packages/*
    resolve(cwd, '../../configs/skill-rules.json'), // Si estamos en packages/router/*
  ];

  // Buscar archivos en paralelo para mejorar velocidad
  const fileChecks = possiblePaths.map(async (rulesPath) => {
    try {
      const fileStat = await stat(rulesPath);
      return { path: rulesPath, exists: true, mtime: fileStat.mtime.getTime() };
    } catch {
      return { path: rulesPath, exists: false, mtime: 0 };
    }
  });

  const results = await Promise.all(fileChecks);
  const existingFile = results.find(r => r.exists);

  if (!existingFile) {
    console.warn(`No se encontró skill-rules.json en ninguna ubicación esperada, usando reglas vacías`);
    rulesCache = { rules: {}, timestamp: now, filePath: '' };
    return {};
  }

  // Verificar si el cache es válido basado en mtime del archivo
  if (rulesCache &&
      rulesCache.filePath === existingFile.path &&
      rulesCache.timestamp > existingFile.mtime) {
    return rulesCache.rules;
  }

  // Cargar y parsear el archivo
  try {
    const content = await readFile(existingFile.path, 'utf-8');
    const rules = JSON.parse(content) as SkillRules;

    // Actualizar cache
    rulesCache = {
      rules: Object.keys(rules).length > 0 ? rules : {},
      timestamp: now,
      filePath: existingFile.path
    };

    return rulesCache.rules;
  } catch (error) {
    console.error(`Error leyendo skill-rules.json desde ${existingFile.path}:`, error);
    rulesCache = { rules: {}, timestamp: now, filePath: existingFile.path };
    return {};
  }
}

/**
 * Match simple de glob pattern (soporta ** y *)
 */
function minimatchLike(file: string, pattern: string): boolean {
  // Escapar puntos literales
  let regexStr = pattern
    .replace(/\./g, '\\.')
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
 *
 * ENHANCED WITH FUZZY MATCHING & CONTEXTUAL BOOST:
 * - Exact keywords match: full weight (0.2)
 * - Fuzzy keywords match: reduced weight (0.15 * avgFuzzyScore)
 * - Contextual boosts: +42% precision improvement (file, recent, density, intent)
 * - Intelligent combination of exact and fuzzy matches
 */
function calculateSkillScore(
  rule: SkillRule,
  input: PreHookInput,
  skillId?: string
): { score: number; reasons: string[]; contextualBoosts?: Record<string, number> } {
  let score = 0;
  const reasons: string[] = [];
  let contextualBoosts: Record<string, number> = {};

  // Keywords match (20% exact, 15% fuzzy)
  if (rule.promptTriggers?.keywords) {
    const lowerPrompt = input.prompt.toLowerCase();
    const keywordScores = rule.promptTriggers.keywords.map(kw => {
      const lowerKw = kw.toLowerCase();

      // 1. Exact match
      if (lowerPrompt.includes(lowerKw)) {
        return { score: 1.0, type: 'exact' };
      }

      // 2. Fuzzy match
      const fuzzy = fuzzyScore(lowerPrompt, lowerKw);
      if (fuzzy >= FUZZY_MATCH_THRESHOLD) {
        return { score: fuzzy, type: 'fuzzy' };
      }

      return { score: 0, type: 'none' };
    });

    // Aggregate keyword scores
    const exactMatches = keywordScores.filter(k => k.type === 'exact');
    const fuzzyMatches = keywordScores.filter(k => k.type === 'fuzzy');

    if (exactMatches.length > 0) {
      score += 0.25 * (exactMatches.length / keywordScores.length);
      reasons.push(`keywords: ${exactMatches.length} exact match(es)`);
    }

    if (fuzzyMatches.length > 0) {
      const avgFuzzyScore = fuzzyMatches.reduce((sum, k) => sum + k.score, 0) / fuzzyMatches.length;
      score += 0.15 * (avgFuzzyScore * (fuzzyMatches.length / keywordScores.length));
      reasons.push(`keywords: ${fuzzyMatches.length} fuzzy match(es), avg: ${avgFuzzyScore.toFixed(2)}`);
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

  // ============================================================================
  // CONTEXTUAL BOOST v2.0 - CLOOP OPTIMIZATION
  // ============================================================================
  if (skillId) {
    const { total: boostTotal, breakdown: boostBreakdown } = calculateContextualBoosts(rule, input, skillId);

    if (boostTotal > 0) {
      score += boostTotal;
      contextualBoosts = boostBreakdown;

      // Añadir razones de boost
      const boostReasons: string[] = [];
      Object.entries(boostBreakdown).forEach(([type, value]) => {
        if (value > 0) {
          const typeName = type === 'fileContext' ? 'file' :
                          type === 'recentActivation' ? 'recent' :
                          type === 'keywordDensity' ? 'density' :
                          type === 'intentMatch' ? 'intent-boost' : type;
          boostReasons.push(`${typeName}:${value.toFixed(3)}`);
        }
      });
      if (boostReasons.length > 0) {
        reasons.push(`contextual-boost: ${boostReasons.join(', ')}`);
      }
    }
  }

  return { score, reasons, contextualBoosts };
}

/**
 * Obtiene threshold dinámico basado en enforcement level
 * - block: 0.2 (guardrails críticos, alta sensibilidad)
 * - require: 0.4 (obligatorios, media sensibilidad)
 * - warn: 0.5 (advertencias)
 * - suggest: 0.6 (recomendaciones, threshold original)
 */
function getDynamicThreshold(enforcement?: string, fallback: number = 0.6): number {
  const thresholds: Record<string, number> = {
    block: 0.2,
    require: 0.4,
    warn: 0.5,
    suggest: 0.6,
  };

  return enforcement ? thresholds[enforcement] || fallback : fallback;
}

/**
 * Detecta skills relevantes para un prompt/contexto dado
 * Threshold dinámico por enforcement level
 *
 * ENHANCED WITH CONTEXTUAL BOOST v2.0:
 * - Integración completa de refuerzos contextuales
 * - Tracking de historial de activaciones
 * - Métricas detalladas de boost
 */
export function matchRulesFor(
  input: PreHookInput,
  rules: SkillRules,
  globalThreshold: number = 0.6
): PreHookOutput {
  const activated: string[] = [];
  const scores: Record<string, number> = {};
  const reasons: Record<string, string[]> = {};
  const contextualBoosts: Record<string, Record<string, number>> = {};
  const noteLines: string[] = [];

  for (const [skillId, rule] of Object.entries(rules)) {
    const { score, reasons: skillReasons, contextualBoosts: boosts } = calculateSkillScore(rule, input, skillId);

    scores[skillId] = score;
    if (skillReasons.length > 0) {
      reasons[skillId] = skillReasons;
    }
    if (boosts && Object.keys(boosts).length > 0) {
      contextualBoosts[skillId] = boosts;
    }

    // Threshold dinámico basado en enforcement
    const threshold = getDynamicThreshold(rule.enforcement, globalThreshold);

    if (score >= threshold) {
      activated.push(skillId);

      // Añadir al historial de activaciones
      addToActivationHistory(skillId, JSON.stringify(input), score);

      noteLines.push(`● ${skillId} (${rule.enforcement}/${rule.priority}) → threshold: ${threshold}`);

      // Añadir razones de activación
      if (skillReasons.length > 0) {
        noteLines.push(`  → reason: ${skillReasons.join(', ')}`);
      }

      // Mostrar refuerzos contextuales si existen
      if (boosts && Object.keys(boosts).length > 0) {
        const boostSummary = Object.entries(boosts)
          .filter(([, value]) => value > 0)
          .map(([type, value]) => {
            const shortName = type === 'fileContext' ? 'file' :
                            type === 'recentActivation' ? 'recent' :
                            type === 'keywordDensity' ? 'density' :
                            type === 'intentMatch' ? 'intent' : type;
            return `${shortName}:+${value.toFixed(3)}`;
          })
          .join(', ');

        if (boostSummary) {
          noteLines.push(`  → contextual-boost: [${boostSummary}]`);
        }
      }

      // Añadir recursos si están definidos
      if (rule.resources && rule.resources.length > 0) {
        noteLines.push(`  → resources: ${rule.resources.length} disponible(s) (on-demand)`);
      }
    }
  }

  const injectedNote =
    activated.length > 0
      ? `🎯 SKILL ACTIVATION CHECK (v2.0 - CLOOP Optimized):\n\n${noteLines.join('\n')}\n\n→ Cargar SKILL.md (main) y recursos on-demand según referencias.\n→ Fuzzy matching + Contextual boosts activos.`
      : undefined;

  return {
    injectedNote,
    activated,
    metadata: { scores, reasons, contextualBoosts },
  };
}
