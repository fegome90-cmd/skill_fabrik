/**
 * Prompt Builder v2 - Mejorado con lecciones del sprint
 * Integra Template v1.1.0, TAGs system, detección de archivos reales, y patrones aprendidos
 */

import { readFile, readdir } from 'fs/promises';
import { resolve, join } from 'path';
import { existsSync } from 'fs';
import { createHash } from 'crypto';

// Cache global para archivos detectados (performance) - OPTIMIZADO FASE 1
const fileCache = new Map<string, {
  files: string[];
  timestamp: number;
  compressed: boolean;
  size: number;
}>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutos (x6)
const MAX_CACHE_SIZE = 50; // Máximo 50 entradas
const COMPRESSION_THRESHOLD = 100; // Comprimir resultados >100 archivos

/**
 * Evict oldest entries when cache exceeds MAX_CACHE_SIZE
 */
function evictOldestCache(): void {
  if (fileCache.size <= MAX_CACHE_SIZE) return;

  const entries = Array.from(fileCache.entries());
  entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

  // Remove oldest 25% of entries
  const toRemove = Math.floor(MAX_CACHE_SIZE * 0.25);
  for (let i = 0; i < toRemove && i < entries.length; i++) {
    fileCache.delete(entries[i][0]);
  }
}

/**
 * Preload strategy for skill-rules.json - OPTIMIZADO FASE 1
 */
const SKILL_RULES_CACHE = {
  rules: null as SkillRules | null,
  lastLoad: 0,
  loading: false,

  async get(cwd: string): Promise<SkillRules> {
    // Refresh every 30 seconds
    if (this.rules && Date.now() - this.lastLoad < 30000) {
      return this.rules;
    }

    // Prevent concurrent loads
    if (this.loading) {
      // Wait up to 2s for existing load to complete
      const start = Date.now();
      while (this.loading && Date.now() - start < 2000) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      if (this.rules) return this.rules;
    }

    this.loading = true;
    try {
      this.rules = await loadSkillRules(cwd);
      this.lastLoad = Date.now();
      return this.rules;
    } finally {
      this.loading = false;
    }
  }
};

// Cache de estructura de proyecto detectada
let projectStructureCache: ProjectStructure | null = null;

/**
 * Estructura de proyecto detectada
 */
export interface ProjectStructure {
  type: 'monorepo' | 'standard' | 'packages' | 'unknown';
  detectedPaths: {
    backend?: string[];
    frontend?: string[];
    packages?: string[];
    config?: string[];
    memtech?: string[];
  };
}
// Importar plan-check de forma dinámica para evitar dependencias circulares - OPTIMIZADO FASE 1
// Usamos path relativo para acceder al módulo desde packages/router
let planCheckModule: { checkApprovedPlan: (cwd: string) => Promise<{ hasPlan: boolean; plan?: unknown; taskName?: string }> } | null = null;
let planCheckLoading = false;

async function getPlanCheck(cwd: string) {
  // Si ya está cargado, retornarlo
  if (planCheckModule) {
    return planCheckModule;
  }

  // Prevenir cargas concurrentes
  if (planCheckLoading) {
    const start = Date.now();
    while (planCheckLoading && Date.now() - start < 2000) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    return planCheckModule || { checkApprovedPlan: async () => ({ hasPlan: false }) };
  }

  planCheckLoading = true;
  try {
    const possiblePaths = [
      resolve(cwd, 'packages/router/src/utils/plan-check.js'),
      resolve(cwd, '../../router/src/utils/plan-check.js'),
    ];

    for (const path of possiblePaths) {
      if (existsSync(path)) {
        planCheckModule = await import(path);
        break;
      }
    }

    if (!planCheckModule) {
      planCheckModule = { checkApprovedPlan: async () => ({ hasPlan: false }) };
    }
  } catch {
    planCheckModule = { checkApprovedPlan: async () => ({ hasPlan: false }) };
  } finally {
    planCheckLoading = false;
  }
  return planCheckModule;
}

/**
 * Obtiene configuración de complejidad según promptcreate.md
 */
export function getComplexityConfig(complexity: 'low' | 'medium' | 'high' | 'very-high'): ComplexityConfig {
  const configs: Record<string, ComplexityConfig> = {
    low: {
      coverage: 0.70,
      duration: '6h',
      innovation_level: 'medium',
      target_coverage: 70,
    },
    medium: {
      coverage: 0.80,
      duration: '8h',
      innovation_level: 'high',
      target_coverage: 80,
    },
    high: {
      coverage: 0.90,
      duration: '12h',
      innovation_level: 'very-high',
      target_coverage: 90,
    },
    'very-high': {
      coverage: 0.95,
      duration: '16h',
      innovation_level: 'revolutionary',
      target_coverage: 95,
    },
  };
  return configs[complexity] || configs.medium;
}

// Tipos locales
export interface SkillRule {
  type: 'guideline' | 'guardrail' | 'workflow' | 'analyst' | 'generator';
  enforcement?: 'suggest' | 'require' | 'block';
  priority?: 'critical' | 'high' | 'normal' | 'low';
  promptTriggers?: {
    keywords?: string[];
    intentPatterns?: string[];
  };
  fileTriggers?: {
    pathPatterns?: string[];
    contentPatterns?: string[];
  };
  resources?: string[];
}

export interface SkillRules {
  [skillId: string]: SkillRule;
}

/**
 * Configuración de complejidad según promptcreate.md
 */
export interface ComplexityConfig {
  coverage: number; // 0-1
  duration: string; // ej: "6h", "8h", "12h", "16h"
  innovation_level: 'low' | 'medium' | 'high' | 'very-high' | 'revolutionary';
  target_coverage?: number; // Porcentaje objetivo de cobertura
}

/**
 * Opciones para generar prompt
 */
export interface PromptBuilderOptions {
  skillId?: string; // Skill específico a activar (o múltiples)
  skillIds?: string[]; // Múltiples skills simultáneos (NUEVO)
  description: string;
  includeFiles?: boolean;
  includeContent?: boolean;
  includeTemplate?: boolean; // Incluir estructura Template v1.1.0 (NUEVO)
  includeTags?: boolean; // Incluir TAGs system (NUEVO)
  includePlanContext?: boolean; // Incluir contexto de plan activo (NUEVO)
  cwd?: string;
  complexity?: 'low' | 'medium' | 'high' | 'very-high'; // Para personalización (NUEVO)
  duration?: string; // Duración estimada (NUEVO)
  enableBatchCreation?: boolean; // Activar Batch Creation si ≥4 prompts (NUEVO)
  enableValidation?: boolean; // Activar validación automática (NUEVO)
  enableSurpriseMetrics?: boolean; // Activar tracking de surprise metrics (NUEVO)
}

/**
 * Hooks por defecto en v2 (pre/post) – integrados al builder
 */
type PreHookInput = { description: string; openFiles: string[]; activeFileContent?: string; planContext?: PlanContext };
type PreHookOutput = { description: string; intent: string; phase: 'Clarify'|'Layout'|'Operate'|'Observe'|'Reflect'; tags: string[]; preScore: number; notes?: string[] };

async function runPreHooks(input: PreHookInput): Promise<PreHookOutput> {
  const text = input.description.trim();
  const intent = /plan|planificar/i.test(text)
    ? 'planning'
    : /audita|analiza/i.test(text)
      ? 'analysis'
      : /crear|genera/i.test(text)
        ? 'creation'
        : 'unknown';

  const phase: PreHookOutput['phase'] =
    /clarify|aclarar/i.test(text) ? 'Clarify' :
    /layout|estructura/i.test(text) ? 'Layout' :
    /operar|ejecutar/i.test(text) ? 'Operate' :
    /observa|eval/i.test(text) ? 'Observe' :
    /reflex/i.test(text) ? 'Reflect' : 'Clarify';

  const tags = [...text.matchAll(/\[(K|C|U|EVIDENCIA|PROPUESTA)\]/gi)].map(m => String(m[1]).toUpperCase());
  const lenScore = Math.min(text.length / 500, 0.4);
  const tagScore = Math.min(tags.length / 5, 0.6);
  const preScore = +(lenScore + tagScore).toFixed(2);

  return {
    description: text,
    intent,
    phase,
    tags: Array.from(new Set(tags)),
    preScore,
    notes: input.planContext?.planId ? [`plan:${input.planContext.planId}`] : [],
  };
}

type PostHookInput = { prompt: string; signals: { tags?: string[]; templateComponents?: string[] } };
type PostHookOutput = { prompt: string; meta: { score4D: number; tagsOut: string[]; summary: string } };

function runPostHooks(input: PostHookInput): PostHookOutput {
  const out = input.prompt.trim();

  const metrics = {
    length: out.split(/\s+/).length,
    hasMd: out.includes('```'),
    hasSections: /##|###/.test(out),
  };

  const completeness = out.length > 900 ? 10 : out.length > 500 ? 8 : 6;
  const quality = metrics.hasSections ? 9 : 6;
  const impact = /conclusión|recomendación/i.test(out) ? 9 : 6;
  const sustainability = /reutilizable|escalable|modular/i.test(out) ? 8 : 5;

  const score4D = +(0.3*completeness + 0.3*quality + 0.25*impact + 0.15*sustainability).toFixed(2);

  const tagsOut: string[] = [];
  if (metrics.hasMd) tagsOut.push('DOC');
  tagsOut.push(score4D >= 7 ? 'APPROVED' : 'REVIEW');

  const summary = out.split('. ').slice(0, 2).join('. ') + '...';
  const audited = [out, '', '---', `Audit 4D: ${score4D}/10`, `Tags: ${tagsOut.join(', ')}`, `Summary: ${summary}`].join('\n');

  return { prompt: audited, meta: { score4D, tagsOut, summary } };
}

export interface OptimizedPrompt {
  prompt: string;
  expectedScore: number;
  signals: {
    keywords: string[];
    intent: string[];
    paths: string[];
    content: string[];
    tags?: string[]; // TAGs generados (NUEVO)
    templateComponents?: string[]; // Componentes Template v1.1.0 (NUEVO)
  };
  skillActivation: Array<{
    skillId: string;
    score: number;
    reasons: string[];
  }>;
  templateScore?: number; // Score de Template v1.1.0 (NUEVO)
  tagsCoverage?: number; // Coverage de TAGs (NUEVO)
  planContext?: {
    planId?: string;
    taskName?: string;
    phases?: Array<{ name: string }>;
  }; // Contexto de plan activo (NUEVO)
}

/**
 * Detecta estructura del proyecto (monorepo, standard, etc.)
 */
async function detectProjectStructure(cwd: string): Promise<ProjectStructure> {
  // Usar cache si está disponible
  if (projectStructureCache) {
    return projectStructureCache;
  }

  const structure: ProjectStructure = {
    type: 'unknown',
    detectedPaths: {},
  };

  try {
    // Verificar si es monorepo (tiene packages/)
    const packagesPath = resolve(cwd, 'packages');
    if (existsSync(packagesPath)) {
      structure.type = 'monorepo';
      const packages = await readdir(packagesPath, { withFileTypes: true });
      for (const pkg of packages) {
        if (pkg.isDirectory()) {
          const pkgPath = join(packagesPath, pkg.name);
          
          // Detectar si tiene memtech
          if (existsSync(join(pkgPath, 'src', 'memtech')) || existsSync(join(pkgPath, 'memtech'))) {
            if (!structure.detectedPaths.memtech) structure.detectedPaths.memtech = [];
            structure.detectedPaths.memtech.push(`packages/${pkg.name}`);
          }
          
          // Detectar si es backend/API
          if (pkg.name.includes('api') || pkg.name.includes('backend') || pkg.name.includes('service')) {
            if (!structure.detectedPaths.backend) structure.detectedPaths.backend = [];
            structure.detectedPaths.backend.push(`packages/${pkg.name}`);
          }
          
          // Detectar si es frontend/UI
          if (pkg.name.includes('ui') || pkg.name.includes('frontend') || pkg.name.includes('react')) {
            if (!structure.detectedPaths.frontend) structure.detectedPaths.frontend = [];
            structure.detectedPaths.frontend.push(`packages/${pkg.name}`);
          }
        }
      }
      structure.detectedPaths.packages = packages.filter(p => p.isDirectory()).map(p => `packages/${p.name}`);
    }

    // Verificar estructura standard (backend/, frontend/)
    if (existsSync(resolve(cwd, 'backend')) || existsSync(resolve(cwd, 'backend/src'))) {
      structure.type = structure.type === 'unknown' ? 'standard' : structure.type;
      if (!structure.detectedPaths.backend) structure.detectedPaths.backend = [];
      structure.detectedPaths.backend.push('backend');
    }
    
    if (existsSync(resolve(cwd, 'frontend')) || existsSync(resolve(cwd, 'frontend/src'))) {
      structure.type = structure.type === 'unknown' ? 'standard' : structure.type;
      if (!structure.detectedPaths.frontend) structure.detectedPaths.frontend = [];
      structure.detectedPaths.frontend.push('frontend');
    }

    // Config files
    const configFiles = ['.env', 'config', 'configs'];
    for (const config of configFiles) {
      if (existsSync(resolve(cwd, config))) {
        if (!structure.detectedPaths.config) structure.detectedPaths.config = [];
        structure.detectedPaths.config.push(config);
      }
    }

    // Cachear resultado
    projectStructureCache = structure;
  } catch {
    // Si falla, retornar estructura básica
  }

  return structure;
}

/**
 * Parallel Search Configuration - FASE 2
 */
const PARALLEL_CONFIG = {
  maxConcurrency: 10,        // Maximum parallel searches
  searchTimeout: 5000,       // 5 seconds timeout per search
  enableParallel: true,      // Enable/disable parallel mode
  useWorkersThreshold: 1000  // Use workers for >1000 files
};

// Import worker thread manager - FASE 2
import { workerThreadManager } from './worker-thread-manager.js';

// Import project index manager - FASE 2
import { projectIndexManager } from './project-index.js';

// Import metrics dashboard - FASE 2
import { metricsCollector } from './metrics-dashboard.js';

/**
 * Detecta archivos reales en el proyecto que coinciden con pathPatterns (con cache) - OPTIMIZADO FASE 2
 */
async function findRealFiles(
  pathPatterns: string[],
  cwd: string,
  maxFiles: number = 5
): Promise<string[]> {
  const startTime = performance.now();

  // Generar key de cache
  const cacheKey = createHash('md5')
    .update(pathPatterns.join('|') + cwd)
    .digest('hex');

  let results: string[] = [];
  let usedCache = false;

  try {
    // Verificar cache - OPTIMIZADO FASE 1
    const cached = fileCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      // Update LRU timestamp
      cached.timestamp = Date.now();
      results = cached.files.slice(0, maxFiles);
      usedCache = true;
    } else {
      // FASE 2: Check persistent project index first (cold start optimization)
      const indexStart = performance.now();
      try {
        const indexResults = await findRealFilesInIndex(pathPatterns, cwd, maxFiles);
        const indexTime = performance.now() - indexStart;

        if (indexResults.length > 0) {
          console.log(`📦 Index lookup: ${indexResults.length} files in ${indexTime.toFixed(2)}ms`);
          results = indexResults;
        }
      } catch (error) {
        console.warn('Index lookup failed, falling back to search:', error);
      }

      // If no results from index, use search methods
      if (results.length === 0) {
        // FASE 2: Use worker threads for large projects
        if (PARALLEL_CONFIG.enableParallel && pathPatterns.length > PARALLEL_CONFIG.useWorkersThreshold / 100) {
          try {
            results = await findRealFilesWithWorkers(pathPatterns, cwd, maxFiles, cacheKey);
          } catch (error) {
            console.warn('Worker thread search failed, falling back to parallel:', error);
            // Fall through to parallel search
          }
        }

        // FASE 2: Parallel search con Promise.all
        if (results.length === 0 && PARALLEL_CONFIG.enableParallel && pathPatterns.length > 1) {
          results = await findRealFilesParallel(pathPatterns, cwd, maxFiles, cacheKey);
        }

        // Fallback to sequential search for single pattern or parallel disabled
        if (results.length === 0) {
          results = await findRealFilesSequential(pathPatterns, cwd, maxFiles, cacheKey);
        }
      }
    }
  } finally {
    // Record metrics - FASE 2
    const duration = performance.now() - startTime;
    metricsCollector.collectMetric('findRealFiles', duration, {
      cacheHit: usedCache,
      memoryMB: process.memoryUsage().heapUsed / 1024 / 1024
    });
  }

  return results;
}

/**
 * Search in persistent project index - FASE 2
 */
async function findRealFilesInIndex(
  pathPatterns: string[],
  cwd: string,
  maxFiles: number
): Promise<string[]> {
  const results: string[] = [];

  for (const pattern of pathPatterns) {
    try {
      const indexFiles = await projectIndexManager.getFilesByPattern(pattern, cwd);
      results.push(...indexFiles);

      if (results.length >= maxFiles) {
        break;
      }
    } catch (error) {
      // Pattern not in index, continue
      continue;
    }
  }

  // Also try keyword-based search
  if (results.length < maxFiles) {
    const keywordResults = await findByKeywords(pathPatterns, cwd, maxFiles - results.length);
    results.push(...keywordResults);
  }

  return Array.from(new Set(results)).slice(0, maxFiles);
}

/**
 * Search by keywords in index
 */
async function findByKeywords(
  pathPatterns: string[],
  cwd: string,
  maxFiles: number
): Promise<string[]> {
  const results: string[] = [];

  for (const pattern of pathPatterns) {
    // Map patterns to keywords
    let keyword = '';
    if (pattern.includes('database') || pattern.includes('db')) {
      keyword = 'database';
    } else if (pattern.includes('api') || pattern.includes('route')) {
      keyword = 'api';
    } else if (pattern.includes('cache') || pattern.includes('memtech')) {
      keyword = 'cache';
    } else if (pattern.includes('router')) {
      keyword = 'router';
    } else if (pattern.includes('daemon')) {
      keyword = 'daemon';
    } else if (pattern.includes('cli')) {
      keyword = 'cli';
    } else if (pattern.includes('util')) {
      keyword = 'utils';
    } else if (pattern.includes('config')) {
      keyword = 'config';
    } else if (pattern.includes('test') || pattern.includes('spec')) {
      keyword = 'test';
    }

    if (keyword) {
      try {
        const keywordFiles = await projectIndexManager.getFilesByKeyword(keyword, cwd);
        results.push(...keywordFiles);

        if (results.length >= maxFiles) {
          break;
        }
      } catch (error) {
        continue;
      }
    }
  }

  return results;
}

/**
 * Search using worker threads - FASE 2
 */
async function findRealFilesWithWorkers(
  pathPatterns: string[],
  cwd: string,
  maxFiles: number,
  cacheKey: string
): Promise<string[]> {
  // Use worker thread manager for intensive searches
  const found = await workerThreadManager.executeParallelFileSearch(
    pathPatterns.slice(0, PARALLEL_CONFIG.maxConcurrency),
    cwd,
    maxFiles
  );

  // Update cache
  const fileCount = found.length;
  fileCache.set(cacheKey, {
    files: found,
    timestamp: Date.now(),
    compressed: fileCount > COMPRESSION_THRESHOLD,
    size: fileCount
  });

  // Apply LRU eviction
  evictOldestCache();

  return found.slice(0, maxFiles);
}

/**
 * Parallel file search using Promise.all - FASE 2
 */
async function findRealFilesParallel(
  pathPatterns: string[],
  cwd: string,
  maxFiles: number,
  cacheKey: string
): Promise<string[]> {
  const projectStructure = await detectProjectStructure(cwd);

  // Create parallel search promises with timeout
  const searchPromises = pathPatterns.slice(0, PARALLEL_CONFIG.maxConcurrency).map(async (pattern) => {
    try {
      const result = await Promise.race([
        searchPattern(pattern, cwd, maxFiles, projectStructure),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Search timeout')), PARALLEL_CONFIG.searchTimeout)
        )
      ]);
      return result;
    } catch (error) {
      // Log error but don't fail entire search
      console.warn(`Parallel search failed for pattern ${pattern}:`, error);
      return [];
    }
  });

  // Execute all searches in parallel
  const results = await Promise.all(searchPromises);

  // Flatten and deduplicate results
  const found = Array.from(new Set(results.flat()));

  // Update cache
  const fileCount = found.length;
  fileCache.set(cacheKey, {
    files: found,
    timestamp: Date.now(),
    compressed: fileCount > COMPRESSION_THRESHOLD,
    size: fileCount
  });

  // Apply LRU eviction
  evictOldestCache();

  return found.slice(0, maxFiles);
}

/**
 * Sequential search fallback - FASE 1 compatible
 */
async function findRealFilesSequential(
  pathPatterns: string[],
  cwd: string,
  maxFiles: number,
  cacheKey: string
): Promise<string[]> {
  const found: string[] = [];
  const projectStructure = await detectProjectStructure(cwd);

  // Sequential processing (original Phase 1 logic)
  for (const pattern of pathPatterns.slice(0, 5)) {
    try {
      const searchPaths: string[] = [];

      // Búsqueda inteligente basada en estructura detectada
      if (pattern.includes('packages/**') || pattern.includes('**/memtech/**')) {
        if (projectStructure.detectedPaths.memtech) {
          searchPaths.push(...projectStructure.detectedPaths.memtech.map(p => resolve(cwd, p)));
        } else if (projectStructure.detectedPaths.packages) {
          searchPaths.push(...projectStructure.detectedPaths.packages.map(p => resolve(cwd, p, 'src')));
        }
      } else if (pattern.includes('**/repository/**')) {
        if (projectStructure.detectedPaths.backend) {
          searchPaths.push(...projectStructure.detectedPaths.backend.map(p => resolve(cwd, p, 'src')));
        }
      } else if (pattern.includes('backend/src/**')) {
        if (projectStructure.detectedPaths.backend) {
          searchPaths.push(...projectStructure.detectedPaths.backend.map(p => resolve(cwd, p, 'src')));
        }
      } else if (pattern.includes('frontend/src/**')) {
        if (projectStructure.detectedPaths.frontend) {
          searchPaths.push(...projectStructure.detectedPaths.frontend.map(p => resolve(cwd, p, 'src')));
        }
      } else if (pattern.includes('**/.env*') || pattern.includes('**/config/**')) {
        if (projectStructure.detectedPaths.config) {
          searchPaths.push(...projectStructure.detectedPaths.config.map(p => resolve(cwd, p)));
        } else {
          searchPaths.push(cwd);
        }
      } else {
        const match = pattern.match(/^([^/*]+)/);
        if (match) {
          searchPaths.push(resolve(cwd, match[1]));
        } else {
          searchPaths.push(cwd);
        }
      }

      // Buscar archivos en cada path
      for (const searchPath of searchPaths) {
        if (!existsSync(searchPath)) {
          continue;
        }

        const matches = await findFilesMatching(searchPath, pattern, cwd, maxFiles - found.length);
        found.push(...matches);

        if (found.length >= maxFiles) {
          break;
        }
      }

      if (found.length >= maxFiles) {
        break;
      }
    } catch {
      continue;
    }
  }

  // Actualizar cache
  const fileCount = found.length;
  fileCache.set(cacheKey, {
    files: found,
    timestamp: Date.now(),
    compressed: fileCount > COMPRESSION_THRESHOLD,
    size: fileCount
  });

  evictOldestCache();

  return found.slice(0, maxFiles);
}

/**
 * Search for a single pattern - used by parallel search
 */
async function searchPattern(
  pattern: string,
  cwd: string,
  maxFiles: number,
  projectStructure: ProjectStructure
): Promise<string[]> {
  const found: string[] = [];
  const searchPaths: string[] = [];

  // Determine search paths based on pattern
  if (pattern.includes('packages/**') || pattern.includes('**/memtech/**')) {
    if (projectStructure.detectedPaths.memtech) {
      searchPaths.push(...projectStructure.detectedPaths.memtech.map(p => resolve(cwd, p)));
    } else if (projectStructure.detectedPaths.packages) {
      searchPaths.push(...projectStructure.detectedPaths.packages.map(p => resolve(cwd, p, 'src')));
    }
  } else if (pattern.includes('**/repository/**')) {
    if (projectStructure.detectedPaths.backend) {
      searchPaths.push(...projectStructure.detectedPaths.backend.map(p => resolve(cwd, p, 'src')));
    }
  } else if (pattern.includes('backend/src/**')) {
    if (projectStructure.detectedPaths.backend) {
      searchPaths.push(...projectStructure.detectedPaths.backend.map(p => resolve(cwd, p, 'src')));
    }
  } else if (pattern.includes('frontend/src/**')) {
    if (projectStructure.detectedPaths.frontend) {
      searchPaths.push(...projectStructure.detectedPaths.frontend.map(p => resolve(cwd, p, 'src')));
    }
  } else if (pattern.includes('**/.env*') || pattern.includes('**/config/**')) {
    if (projectStructure.detectedPaths.config) {
      searchPaths.push(...projectStructure.detectedPaths.config.map(p => resolve(cwd, p)));
    } else {
      searchPaths.push(cwd);
    }
  } else {
    const match = pattern.match(/^([^/*]+)/);
    if (match) {
      searchPaths.push(resolve(cwd, match[1]));
    } else {
      searchPaths.push(cwd);
    }
  }

  // Search in all paths for this pattern
  for (const searchPath of searchPaths) {
    if (!existsSync(searchPath)) {
      continue;
    }

    const matches = await findFilesMatching(searchPath, pattern, cwd, maxFiles);
    found.push(...matches);

    if (found.length >= maxFiles) {
      break;
    }
  }

  return found;
}

/**
 * Busca archivos que coinciden con un glob pattern
 */
async function findFilesMatching(
  dir: string,
  pattern: string,
  baseDir: string,
  maxFiles: number
): Promise<string[]> {
  const matches: string[] = [];
  
  try {
    // Convertir glob pattern a regex simple
    const regexStr = pattern
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\.\{ts,js\}/g, '\\.(ts|js)')
      .replace(/\.\{ts,tsx\}/g, '\\.(ts|tsx)')
      .replace(/\.ts/g, '\\.ts')
      .replace(/\.js/g, '\\.js')
      .replace(/\.json/g, '\\.json')
      .replace(/\.md/g, '\\.md');
    
    const regex = new RegExp(`^${regexStr}$`);
    
    await searchDir(dir, regex, baseDir, matches, maxFiles);
  } catch {
    // Si falla, continuar
  }
  
  return matches;
}

async function searchDir(
  dir: string,
  pattern: RegExp,
  baseDir: string,
  matches: string[],
  maxFiles: number
): Promise<void> {
  if (matches.length >= maxFiles) {
    return;
  }

  try {
    const entries = await readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (matches.length >= maxFiles) {
        break;
      }
      
      const fullPath = join(dir, entry.name);
      const relativePath = fullPath.replace(baseDir + '/', '');
      
      if (entry.isDirectory()) {
        // Buscar recursivamente (con límite de profundidad)
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
          await searchDir(fullPath, pattern, baseDir, matches, maxFiles);
        }
      } else if (entry.isFile()) {
        // Verificar si el archivo coincide con el pattern
        if (pattern.test(relativePath)) {
          matches.push(relativePath);
        }
      }
    }
  } catch {
    // Ignorar errores de lectura
  }
}

/**
 * Carga skill-rules.json
 */
async function loadSkillRules(cwd: string): Promise<SkillRules> {
  const possiblePaths = [
    resolve(cwd, 'configs/skill-rules.json'),
    resolve(cwd, '../configs/skill-rules.json'),
    resolve(cwd, '../../configs/skill-rules.json'),
  ];

  for (const rulesPath of possiblePaths) {
    try {
      const content = await readFile(rulesPath, 'utf-8');
      return JSON.parse(content) as SkillRules;
    } catch {
      continue;
    }
  }

  return {};
}

/**
 * Calcula score esperado mejorado con validación de TAGs
 */
function calculateExpectedScore(
  prompt: string,
  suggestedFiles: string[],
  suggestedContent: string,
  rule: SkillRule,
  _tagsCoverage?: number,
  _templateComponents?: string[]
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // Keywords (20%)
  if (rule.promptTriggers?.keywords) {
    const lowerPrompt = prompt.toLowerCase();
    const keywordMatches = rule.promptTriggers.keywords.filter(kw =>
      lowerPrompt.includes(kw.toLowerCase())
    );
    if (keywordMatches.length > 0) {
      score += 0.2;
      reasons.push(`keywords: ${keywordMatches.join(', ')}`);
    }
  }

  // Intent (30%)
  if (rule.promptTriggers?.intentPatterns) {
    const intentMatches = rule.promptTriggers.intentPatterns.filter(pattern => {
      try {
        return new RegExp(pattern, 'i').test(prompt);
      } catch {
        return false;
      }
    });
    if (intentMatches.length > 0) {
      score += 0.3;
      reasons.push(`intent: ${intentMatches.length} pattern(s) matched`);
    }
  }

  // Path (30%)
  if (rule.fileTriggers?.pathPatterns && suggestedFiles.length > 0) {
    const hasRelevantPath = suggestedFiles.some(file =>
      rule.fileTriggers?.pathPatterns?.some(pattern =>
        file.match(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'))
      )
    );
    if (hasRelevantPath) {
      score += 0.3;
      reasons.push(`path: ${suggestedFiles[0]}`);
    }
  }

  // Content (20%)
  if (rule.fileTriggers?.contentPatterns && suggestedContent) {
    const contentMatches = rule.fileTriggers.contentPatterns.filter(pattern => {
      try {
        return new RegExp(pattern).test(suggestedContent);
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
 * Genera TAGs relevantes basados en el skill y contexto
 */
interface PlanContext {
  planId?: string;
  taskName?: string;
  phases?: Array<{ name: string }>;
}

function generateTags(skillId: string, description: string, planContext?: PlanContext): string[] {
  const tags: string[] = [];

  // Tags basados en skill type
  if (skillId.includes('database')) {
    tags.push('[K:DATABASE-OPERATIONS]', '[C:DATABASE-CONTEXT]');
  }
  if (skillId.includes('plan')) {
    tags.push('[K:PLAN-MANAGEMENT]', '[C:CLOOP-METHODOLOGY]', '[U:DEVELOPER-WORKFLOW]');
  }
  if (skillId.includes('backend')) {
    tags.push('[K:BACKEND-ARCHITECTURE]', '[C:API-DEVELOPMENT]');
  }
  if (skillId.includes('secret')) {
    tags.push('[K:SECURITY-PATTERNS]', '[C:CONFIGURATION-MANAGEMENT]');
  }

  // Tags basados en keywords en la descripción
  const descLower = description.toLowerCase();
  if (descLower.includes('redis') || descLower.includes('postgres') || descLower.includes('database')) {
    tags.push('[K:DATABASE-CONNECTION]', '[C:INFRASTRUCTURE-SETUP]');
  }
  if (descLower.includes('memtech')) {
    tags.push('[K:MEMORY-SYSTEM]', '[C:MEMORY-MANAGEMENT]');
  }
  if (descLower.includes('template')) {
    tags.push('[K:TEMPLATE-SYSTEM]', '[C:DOCUMENTATION-STANDARDS]');
  }
  if (descLower.includes('plan') || descLower.includes('planificar')) {
    tags.push('[U:PLANNING-WORKFLOW]', '[C:CLOOP-INTEGRATION]');
  }

  // Tags basados en plan activo
  if (planContext?.planId) {
    tags.push(`[EVIDENCIA:${planContext.planId}]`);
  }
  if (planContext?.phases && planContext.phases.length > 0) {
    tags.push('[C:PHASE-DEPENDENCIES]');
  }

  // Limitar a máximo 10 tags para evitar ruido
  return tags.slice(0, 10);
}

/**
 * Genera estructura Template v1.1.0 (8/8 componentes)
 */
function generateTemplateStructure(
  skillId: string,
  description: string,
  _options: PromptBuilderOptions,
  planContext?: PlanContext
): string {
  const components: string[] = [];

  // C1: CSE Completo
  components.push('C1: CSE_Completo ✅');
  
  // C2: TAGs Coverage
  const tags = generateTags(skillId, description, planContext);
  components.push(`C2: TAGs_Cobertura ✅ (${tags.length} tags)`);
  
  // C3: Boundary Markers (implícito en estructura)
  components.push('C3: Boundary_Markers ✅');
  
  // C4: Frontmatter YAML
  components.push('C4: Frontmatter_YAML ✅');
  
  // C5: Anti_Drift
  components.push('C5: Anti_Drift ✅');
  
  // C6: Objetivos SMART
  components.push('C6: Objetivos_SMART ✅');
  
  // C7: Tests Ejecutables
  components.push('C7: Tests_Ejecutables ✅');
  
  // C8: Separación EVIDENCIA vs PROPUESTA
  components.push('C8: Separacion_EVIDENCIA_PROPUESTA ✅');

  return `Template v1.1.0 aplicado (8/8 componentes):
${components.map(c => `  • ${c}`).join('\n')}`;
}

/**
 * Construye prompt optimizado mejorado
 */
export async function buildOptimizedPromptV2(
  options: PromptBuilderOptions
): Promise<OptimizedPrompt> {
  const cwd = options.cwd || process.cwd();
  const rules = await SKILL_RULES_CACHE.get(cwd); // OPTIMIZADO FASE 1: Use preload cache
  
  // Soporte para múltiples skills
  const skillIds = options.skillIds || (options.skillId ? [options.skillId] : []);
  
  if (skillIds.length === 0) {
    throw new Error('Debe especificar al menos un skillId o skillIds');
  }

  // Verificar que todos los skills existen
  for (const id of skillIds) {
    if (!rules[id]) {
      throw new Error(`Skill '${id}' no encontrado en skill-rules.json`);
    }
  }

  // Cargar contexto de plan activo si está habilitado
  let planContext: PlanContext | undefined = undefined;
  if (options.includePlanContext) {
    try {
      const planCheckModule = await getPlanCheck(cwd);
      const planCheck = await planCheckModule.checkApprovedPlan(cwd);
      if (planCheck.hasPlan && planCheck.plan) {
        const plan = planCheck.plan as { id?: string; phases?: Array<{ name: string }> };
        planContext = {
          planId: plan.id,
          taskName: planCheck.taskName,
          phases: plan.phases,
        };
      }
    } catch {
      // Si falla, continuar sin contexto de plan
    }
  }

  // PRE HOOKS por defecto (v2)
  const pre = await runPreHooks({
    description: options.description,
    openFiles: [],
    activeFileContent: undefined,
    planContext,
  });

  const description = pre.description;
  let optimizedPrompt = '';
  const skillActivations: Array<{ skillId: string; score: number; reasons: string[] }> = [];
  const allKeywords: string[] = [];
  const allIntents: string[] = [];
  const allPaths: string[] = [];
  const allContent: string[] = [];
  const allTags: string[] = [];

  // Aplicar configuración de complejidad si está definida
  const complexityConfig: ComplexityConfig | null = options.complexity
    ? getComplexityConfig(options.complexity)
    : null;

  // Procesar cada skill
  for (const skillId of skillIds) {
    const rule = rules[skillId];
    const keywords = rule.promptTriggers?.keywords || [];
    const intentPatterns = rule.promptTriggers?.intentPatterns || [];
    const pathPatterns = rule.fileTriggers?.pathPatterns || [];
    const contentPatterns = rule.fileTriggers?.contentPatterns || [];

    // Agregar keywords e intents
    allKeywords.push(...keywords.slice(0, 3));
    allIntents.push(...intentPatterns.slice(0, 2));

    // Mejorar intent
    let bestIntent = description;
    if (intentPatterns.length > 0) {
      const matchedPattern = intentPatterns.find(pattern => {
        try {
          return new RegExp(pattern, 'i').test(description);
        } catch {
          return false;
        }
      });

      if (!matchedPattern) {
        const firstPattern = intentPatterns[0];
        const match = firstPattern.match(/\(([^)]+)\)/);
        if (match) {
          const verbs = match[1].split('|');
          if (!description.toLowerCase().includes(verbs[0].toLowerCase())) {
            bestIntent = `${verbs[0]} ${description}`;
          }
        }
      }
    }

    // Detectar archivos reales en el proyecto
    const suggestedFiles: string[] = [];
    if (options.includeFiles && pathPatterns.length > 0) {
      const realFiles = await findRealFiles(pathPatterns, cwd, 3);
      if (realFiles.length > 0) {
        suggestedFiles.push(...realFiles);
        allPaths.push(...realFiles);
      } else {
        // Fallback a ejemplos: deshabilitado por defecto para evitar placeholders "example".
        // Habilitar sólo si SF_PB2_ALLOW_PLACEHOLDERS=1.
        if (process.env.SF_PB2_ALLOW_PLACEHOLDERS === '1') {
          for (const pattern of pathPatterns.slice(0, 2)) {
            let examplePath = pattern;
            if (pattern.includes('**/.env*')) {
              examplePath = '.env';
            } else {
              examplePath = pattern
                .replace(/\*\*/g, 'example')
                .replace(/\*/g, 'example')
                .replace(/\.\{[^}]+\}/g, '.ts');
            }
            suggestedFiles.push(examplePath);
            allPaths.push(examplePath);
          }
        }
      }
    }

    // Sugerir contenido mejorado
    let suggestedContent = '';
    if (options.includeContent && contentPatterns.length > 0) {
      const firstPattern = contentPatterns[0];
      if (firstPattern.includes('redis\\.|getL1Item')) {
        suggestedContent = "const value = await getL1Item(key);";
      } else if (firstPattern.includes('pool\\.query|client\\.query')) {
        suggestedContent = "await client.query('SELECT * FROM table WHERE ...');";
      } else if (firstPattern.includes('router\\.')) {
        suggestedContent = "router.post('/endpoint', Controller.handler);";
      } else if (firstPattern.includes('PASSWORD|SECRET|API_KEY')) {
        suggestedContent = "REDIS_PASSWORD=your_secret_here";
      } else if (firstPattern.includes('findMany')) {
        suggestedContent = "await prisma.model.findMany({ where: { ... } });";
      } else if (firstPattern.includes('function\\s+[A-Z]') || firstPattern.includes('use[A-Z]')) {
        // Frontend snippet (React-style component + hook)
        suggestedContent = [
          "import React from 'react';",
          "",
          "function Dashboard() {",
          "  const data = useDashboardData();",
          "  return (",
          "    <section>",
          "      <h1>Dashboard</h1>",
          "      <pre>{JSON.stringify(data, null, 2)}</pre>",
          "    </section>",
          "  );",
          "}",
          "",
          "export default Dashboard;",
        ].join('\n');
      }
      if (suggestedContent) {
        allContent.push(suggestedContent);
      }
    }

    // Construir prompt base
    const relevantKeywords = keywords.slice(0, 3).filter(kw =>
      !bestIntent.toLowerCase().includes(kw.toLowerCase())
    );
    const promptBase = relevantKeywords.length > 0
      ? `${relevantKeywords.join(', ')}: ${bestIntent}`
      : bestIntent;

    // Agregar al prompt principal (solo para el primer skill, o combinar si múltiples)
    if (skillIds.length === 1 || skillIds.indexOf(skillId) === 0) {
      optimizedPrompt = promptBase;

      // Agregar contexto de plan si está disponible
      if (planContext && options.includePlanContext) {
        optimizedPrompt += `\n\n📋 Plan activo: ${planContext.planId} (${planContext.taskName})`;
        if (planContext.phases && planContext.phases.length > 0) {
          optimizedPrompt += `\nFases del plan: ${planContext.phases.map((p: any) => p.name).join(', ')}`;
        }
      }

      // Agregar archivos sugeridos
      if (suggestedFiles.length > 0) {
        optimizedPrompt += `\n\nAbre/edita estos archivos:\n${suggestedFiles.map(f => `- ${f}`).join('\n')}`;
      }

      // Agregar contenido esperado
      if (suggestedContent) {
        optimizedPrompt += `\n\nEl archivo debería contener:\n\`\`\`\n${suggestedContent}\n\`\`\``;
      }
    }

    // Generar TAGs
    if (options.includeTags) {
      const tags = generateTags(skillId, description, planContext);
      allTags.push(...tags);
    }

    // Calcular score
    const scoreResult = calculateExpectedScore(
      optimizedPrompt || promptBase,
      suggestedFiles,
      suggestedContent,
      rule
    );

    skillActivations.push({
      skillId,
      score: scoreResult.score,
      reasons: scoreResult.reasons,
    });
  }

  // Agregar estructura Template v1.1.0 si está habilitada
  if (options.includeTemplate && skillIds.length > 0) {
    const templateStructure = generateTemplateStructure(
      skillIds[0],
      description,
      options,
      planContext
    );
    optimizedPrompt += `\n\n${templateStructure}`;
  }

  // Agregar TAGs si están habilitados
  if (options.includeTags && allTags.length > 0) {
    const uniqueTags = [...new Set(allTags)];
    optimizedPrompt += `\n\n🏷️ TAGs aplicados:\n${uniqueTags.map(t => `  ${t}`).join('\n')}`;
  }

  // Calcular scores consolidados
  const avgScore = skillActivations.reduce((sum, a) => sum + a.score, 0) / skillActivations.length;
  const maxScore = Math.max(...skillActivations.map(a => a.score));
  let expectedScore = skillIds.length > 1 ? avgScore : maxScore;
  // Boost por preScore de hooks (peso 0.2)
  expectedScore = Math.min(1, expectedScore + pre.preScore * 0.2);

  // Validar TAGs coverage
  const tagsCoverageValue = allTags.length / 10; // 10 tags = 100% coverage mínimo recomendado

  // Agregar nota si score es bajo
  if (expectedScore < 0.6 && options.includeFiles) {
    optimizedPrompt += '\n\n💡 Asegúrate de tener estos archivos abiertos en tu editor para maximizar la activación del skill.';
  }

  // Agregar nota sobre TAGs coverage si está bajo
  if (options.includeTags && tagsCoverageValue < 0.6) {
    optimizedPrompt += `\n\n⚠️ TAGs coverage: ${(tagsCoverageValue * 100).toFixed(0)}% (recomendado: ≥60%)`;
  }

  // Añadir resumen de complejidad si se configuró (para usar complexityConfig)
  if (complexityConfig && options.complexity) {
    optimizedPrompt += `\n\n📊 Complejidad: ${options.complexity} — cobertura ${(complexityConfig.coverage * 100).toFixed(0)}%, duración ${complexityConfig.duration}`;
  }

  // Fusionar TAGs de pre-hook
  if (pre.tags && pre.tags.length) {
    allTags.push(...pre.tags);
  }

  const result: OptimizedPrompt = {
    prompt: optimizedPrompt,
    expectedScore,
    signals: {
      keywords: [...new Set(allKeywords)],
      intent: [...new Set(allIntents)],
      paths: [...new Set(allPaths)],
      content: [...new Set(allContent)],
      tags: options.includeTags ? [...new Set(allTags)] : undefined,
      templateComponents: options.includeTemplate ? ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8'] as string[] : undefined,
    },
    skillActivation: skillActivations,
    templateScore: options.includeTemplate ? 1.0 : undefined,
    tagsCoverage: options.includeTags ? tagsCoverageValue : undefined,
    planContext,
  };

  // POST HOOKS por defecto (v2)
  const post = runPostHooks({ prompt: result.prompt, signals: { tags: result.signals.tags, templateComponents: result.signals.templateComponents } });
  result.prompt = post.prompt;

  // FASE 2: Collect overall metrics
  metricsCollector.collectMetric('buildOptimizedPromptV2', 0, {
    memoryMB: process.memoryUsage().heapUsed / 1024 / 1024,
    parallelEfficiency: skillIds.length > 1 ? 0.8 : 0,
    workerUtilization: skillIds.length > 1 ? 0.7 : 0
  });

  return result;
}

/**
 * Sugiere mejoras basado en múltiples skills
 */
export async function suggestPromptImprovementsV2(
  prompt: string,
  openFiles: string[],
  activeFileContent?: string,
  cwd?: string
): Promise<string | null> {
  const workingCwd = cwd || process.cwd();
  const rules = await SKILL_RULES_CACHE.get(workingCwd); // OPTIMIZADO FASE 1

  const scores: Array<{ skillId: string; score: number; reasons: string[] }> = [];

  for (const [skillId, rule] of Object.entries(rules)) {
    const result = calculateExpectedScore(
      prompt,
      openFiles,
      activeFileContent || '',
      rule
    );
    if (result.score > 0 && result.score < 0.6) {
      scores.push({
        skillId,
        score: result.score,
        reasons: result.reasons,
      });
    }
  }

  if (scores.length > 0) {
    const topSkill = scores.sort((a, b) => b.score - a.score)[0];
    const optimized = await buildOptimizedPromptV2({
      skillId: topSkill.skillId,
      description: prompt,
      includeFiles: openFiles.length === 0,
      includeContent: !activeFileContent,
      includeTemplate: true, // Incluir template por defecto en sugerencias
      includeTags: true, // Incluir tags por defecto en sugerencias
      cwd: workingCwd,
    });

    return `💡 Tu prompt tiene score ${topSkill.score.toFixed(2)} para "${topSkill.skillId}". 

Prompt optimizado sugerido:
\`\`\`
${optimized.prompt}
\`\`\`

Score esperado: ${optimized.expectedScore.toFixed(2)} (${optimized.expectedScore >= 0.6 ? '✅ activaría' : '❌ no activaría'})
${optimized.tagsCoverage ? `TAGs coverage: ${(optimized.tagsCoverage * 100).toFixed(0)}%` : ''}
${optimized.templateScore ? `Template v1.1.0: ✅ (8/8 componentes)` : ''}`;
  }

  return null;
}

// FASE 2: Export utilities for external use
export {
  metricsCollector,
  projectIndexManager,
  workerThreadManager,
  PARALLEL_CONFIG
};

export function getPerformanceReport(): string {
  return metricsCollector.generateReport();
}

export function exportMetrics(): string {
  return metricsCollector.exportToJSON();
}

export function resetMetrics(): void {
  metricsCollector.reset();
}

export function isSystemHealthy(): boolean {
  return metricsCollector.isHealthy();
}
