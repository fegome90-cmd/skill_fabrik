#!/usr/bin/env node

/**
 * PBv2 Activator - Versión Final Reparada
 * Integración completa de Prompt Builder v2 con manejo de planes y configuración
 */

import { buildOptimizedPromptV2 } from '/Users/felipe/Developer/skills-fabrik/packages/skills-cli/dist/utils/prompt-builder-v2.js';
import { readFile } from 'fs/promises';
import { resolve, join, dirname } from 'path';
import { existsSync, statSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Detecta información del repositorio analizando archivos y estructura
 * @param {string} cwd - Directorio de trabajo actual
 * @returns {Object} Información del repositorio (size, isMonorepo, totalFiles)
 */
function detectRepoInfo(cwd) {
  let fileCount = 0;
  let isMonorepo = false;

  try {
    // Detectar si es monorepo por la presencia de packages/ y su contenido
    const packagesDir = join(cwd, 'packages');
    if (existsSync(packagesDir) && statSync(packagesDir).isDirectory()) {
      const packages = readdirSync(packagesDir);
      isMonorepo = packages.length > 1 && packages.some(pkg => {
        const pkgPath = join(packagesDir, pkg);
        return existsSync(pkgPath) && statSync(pkgPath).isDirectory();
      });
    }

    // Función recursiva para contar archivos
    function countFiles(dir) {
      try {
        const files = statSync(dir);
        if (files.isDirectory()) {
          const items = readdirSync(dir);
          for (const item of items) {
            // Ignorar directorios ocultos y node_modules
            if (!item.startsWith('.') && item !== 'node_modules' && item !== 'dist' && item !== '.git') {
              fileCount += countFiles(join(dir, item));
            }
          }
        } else if (files.isFile()) {
          // Contar solo archivos relevantes (no temporales, no cache)
          const validExtensions = ['.js', '.ts', '.mjs', '.json', '.md', '.yml', '.yaml', '.cjs'];
          const ext = dir.split('.').pop();
          if (validExtensions.includes(`.${ext}`)) {
            fileCount++;
          }
        }
      } catch (e) {
        // Ignorar errores de permisos o acceso
      }
      return fileCount;
    }

    countFiles(cwd);

    // Determinar tamaño del repositorio
    let size = 'small';
    if (fileCount > 2000) size = 'large';
    else if (fileCount > 200) size = 'medium';

    return {
      isMonorepo,
      size,
      totalFiles: fileCount
    };
  } catch (error) {
    console.error('[PBv2 Activator] Error detecting repo info:', error.message);
    return { isMonorepo: false, size: 'small', totalFiles: 0 };
  }
}

/**
 * Obtiene configuración rápida optimizada para pruebas
 * @param {string} cwd - Directorio de trabajo
 * @returns {Object} Configuración optimizada según el repo
 */
export function getFastConfig(cwd) {
  const repoInfo = detectRepoInfo(cwd);

  const config = {
    includeFiles: repoInfo.size === 'small',  // Solo en repos pequeños
    includeTags: true,
    includeTemplate: true,
    complexity: repoInfo.size === 'large' ? 'low' : 'medium',
    cwd: cwd,
    timeout: 3000  // 5 segundos timeout
  };

  console.error(`[PBv2 Activator] Repo info: size=${repoInfo.size}, monorepo=${repoInfo.isMonorepo}, files=${repoInfo.totalFiles}`);
  console.error(`[PBv2 Activator] Fast config:`, config);

  return config;
}

/**
 * Intenta obtener el módulo de verificación de planes
 * @param {string} cwd - Directorio de trabajo
 * @returns {Promise<Object|null>} Módulo de plan-check o null si no está disponible
 */
async function getPlanCheck(cwd) {
  try {
    // Intentar diferentes posibles ubicaciones del módulo
    const possiblePaths = [
      join(cwd, 'packages/skills-cli/dist/utils/plan-generator.js'),
      join(cwd, 'packages/skills-cli/dist/utils/plan-check.js'),
      join(cwd, 'dist/utils/plan-generator.js'),
      join(cwd, 'dist/utils/plan-check.js')
    ];

    for (const path of possiblePaths) {
      if (existsSync(path)) {
        return await import(path);
      }
    }

    return null;
  } catch (error) {
    console.error('[PBv2 Activator] Error loading plan check module:', error.message);
    return null;
  }
}

/**
 * Obtiene contexto de planes aprobados si existen
 * @param {string} cwd - Directorio de trabajo
 * @returns {Promise<Object>} Contexto del plan (planId, taskName, phases)
 */
async function getPlanContext(cwd) {
  let planContext = {
    planId: null,
    taskName: null,
    phases: []
  };

  try {
    const planCheckModule = await getPlanCheck(cwd);

    if (planCheckModule && planCheckModule.checkApprovedPlan) {
      const planCheck = await planCheckModule.checkApprovedPlan(cwd);
      if (planCheck && planCheck.hasPlan && planCheck.plan) {
        const plan = planCheck.plan;
        planContext = {
          planId: plan.id || null,
          taskName: planCheck.taskName || null,
          phases: plan.phases || [],
        };

        console.error(`[PBv2 Activator] Found plan: ${planContext.planId}, phases: ${planContext.phases.length}`);
      }
    }
  } catch (error) {
    console.error('[PBv2 Activator] Error getting plan context:', error.message);
  }

  return planContext;
}

/**
 * Agrega contexto de plan al prompt optimizado
 * @param {string} optimizedPrompt - Prompt base optimizado
 * @param {Object} planContext - Contexto del plan
 * @returns {string} Prompt con contexto de plan agregado
 */
function addPlanContext(optimizedPrompt, planContext) {
  if (!planContext || !planContext.phases || planContext.phases.length === 0) {
    return optimizedPrompt;
  }

  const phasesText = planContext.phases.map(p => p.name || p).join(', ');
  const planInfo = [];

  if (planContext.planId) {
    planInfo.push(`Plan ID: ${planContext.planId}`);
  }
  if (planContext.taskName) {
    planInfo.push(`Task: ${planContext.taskName}`);
  }
  if (phasesText) {
    planInfo.push(`Fases: ${phasesText}`);
  }

  return optimizedPrompt + `\n\n📋 **Contexto del Plan:**\n${planInfo.join('\n')}`;
}

/**
 * Guarda el resultado del plan en archivo
 * @param {Object} detection - Detección del plan
 * @param {Object} pbv2Result - Resultado de PBv2
 * @param {string} cwd - Directorio de trabajo
 * @returns {Promise<string|null>} - Ruta del archivo guardado o null
 */
export async function savePlanResult(detection, pbv2Result, cwd = process.cwd()) {
  try {
    const { writeFileSync, existsSync, mkdirSync } = await import('fs');
    const { join } = await import('path');

    const plansDir = join(cwd, 'dev', 'plans');
    if (!existsSync(plansDir)) {
      mkdirSync(plansDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const planId = detection.hash.substring(0, 8);
    const fileName = `auto-plan-${planId}-${timestamp}.json`;
    const filePath = join(plansDir, fileName);

    const saveData = {
      detection: {
        hash: detection.hash,
        confidence: detection.confidence,
        block: detection.block
      },
      pbv2Result: {
        success: pbv2Result.success,
        latency_ms: pbv2Result.latency_ms,
        expectedScore: pbv2Result.expectedScore,
        skillActivation: pbv2Result.skillActivation
      },
      timestamp,
      version: '2.0.0'
    };

    writeFileSync(filePath, JSON.stringify(saveData, null, 2));

    return filePath;
  } catch (error) {
    console.error('[PBv2 Activator] Error saving plan:', error.message);
    return null;
  }
}

/**
 * Procesa el resultado del prompt builder v2
 * @param {Object} result - Resultado crudo de PBv2
 * @param {Object} params - Parámetros usados en la llamada
 * @param {string} cwd - Directorio de trabajo
 * @param {number} latency - Latencia en milisegundos
 * @returns {Object} Resultado procesado con metadata completa
 */
function processResult(result, params, cwd, latency) {
  const repoInfo = detectRepoInfo(cwd);

  return {
    success: true,
    latency_ms: latency,
    prompt: result.prompt || '',
    expectedScore: result.expectedScore || 0,
    skillActivation: result.skillActivation || [],
    signals: result.signals || {},
    tagsCoverage: result.tagsCoverage || 0,
    templateScore: result.templateScore || 0,
    recommendations: result.recommendations || [],
    metadata: {
      skillIdsUsed: params.skillIds || [],
      complexityUsed: params.complexity || 'medium',
      repoSize: repoInfo.size,
      repoFiles: repoInfo.totalFiles,
      isMonorepo: repoInfo.isMonorepo,
      timestamp: new Date().toISOString(),
      version: '2.0.0'
    }
  };
}

/**
 * Función principal de activación de Prompt Builder v2
 * @param {string} description - Descripción para generar el prompt
 * @param {string} cwd - Directorio de trabajo (default: process.cwd())
 * @param {Object} options - Opciones adicionales
 * @returns {Promise<Object>} Resultado completo de la activación
 */

/**
 * Auto-detects relevant skillIds based on description keywords
 * @param {string} description - Task description
 * @param {Array} allSkillIds - All available skillIds
 * @returns {Array} Most relevant skillIds
 */
function autoDetectSkillIds(description, allSkillIds) {
  const desc = description.toLowerCase();

  // Keyword to skill mapping
  const keywordMap = [
    { keywords: ['backend', 'api', 'endpoint', 'server', 'controller'], skills: ['backend-architecture-patterns', 'backend-dev-guidelines'] },
    { keywords: ['frontend', 'react', 'component', 'ui', 'interface'], skills: ['frontend-dev-guidelines', 'performance-optimization'] },
    { keywords: ['database', 'migration', 'prisma', 'schema', 'query'], skills: ['database-verification', 'database-management'] },
    { keywords: ['security', 'auth', 'oauth', 'jwt', 'vulnerability'], skills: ['security-testing-guide', 'secrets-and-config'] },
    { keywords: ['test', 'testing', 'unit', 'integration', 'e2e'], skills: ['test-driven-development', 'webapp-testing'] },
    { keywords: ['deploy', 'ci', 'cd', 'pipeline', 'build'], skills: ['ci-cd-pipelines', 'pm2-monitor'] },
    { keywords: ['performance', 'optimization', 'cache', 'speed'], skills: ['performance-optimization', 'backend-dev-guidelines'] }
  ];

  const detected = new Set();

  // Check each keyword mapping
  for (const mapping of keywordMap) {
    if (mapping.keywords.some(kw => desc.includes(kw))) {
      mapping.skills.forEach(skill => {
        if (allSkillIds.includes(skill)) {
          detected.add(skill);
        }
      });
    }
  }

  // If nothing detected, use general fallbacks
  if (detected.size === 0) {
    const generalSkills = ['backend-dev-guidelines', 'frontend-dev-guidelines', 'database-verification'];
    generalSkills.forEach(skill => {
      if (allSkillIds.includes(skill)) {
        detected.add(skill);
      }
    });
  }

  return Array.from(detected).slice(0, 3); // Return max 3 skills
}


// Cache warming for better performance
let cacheWarmed = false;
async function warmCache() {
  if (cacheWarmed) return;
  cacheWarmed = true;
  console.error('[PBv2 Activator] Warming cache...');
}

export async function activatePBv2(description, cwd = process.cwd(), options = {}) {
  if (!description || typeof description !== 'string') {
    throw new Error('Description must be a non-empty string');
  }

  console.error(`[PBv2 Activator] Starting activation for "${description.substring(0, 50)}${description.length > 50 ? '...' : ''}" (${description.length} chars)`);

  await warmCache();
  const startTime = Date.now();
  let planContext = null;
  let optimizedPrompt = '';

  try {
    // 1. Obtener contexto del plan si está disponible
    planContext = await getPlanContext(cwd);

    // 2. Obtener configuración optimizada
    const config = getFastConfig(cwd);

    // 3. Preparar parámetros para PBv2
    const params = {
      description,
      skillIds: options.skillIds && options.skillIds.length > 0
      ? options.skillIds
      : autoDetectSkillIds(description, ["backend-architecture-patterns","api-design-and-testing","ci-cd-pipelines","plan-architect","visual-regression-testing","error-pattern-standardization","database-verification","secrets-and-config","backend-dev-guidelines","frontend-dev-guidelines","project-catalog-developer","sample-skill","cli-integration-testing","test-skill","plan-save-workflow","pm2-monitor","code-review-checklist","security-testing-guide","performance-optimization","database-management","cli-compilation-fixes","skill-creator","template-skill","root-cause-tracing","systematic-debugging","test-driven-development","using-git-worktrees","webapp-testing","Auditor de repositorio (read-only)","Auditor sin permisos","Policy NET Example","Policy S1 Example","Policy S2 Example"]), // Auto-detect skillIds
      ...config,
      ...options
    };

    console.error(`[PBv2 Activator] Using config: files=${config.includeFiles}, tags=${config.includeTags}, template=${config.includeTemplate}`);

    // 4. Llamar a PBv2 con timeout
    const pbv2Promise = buildOptimizedPromptV2(params);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('PBv2 timeout after ' + config.timeout + 'ms')), config.timeout);
    });

    const result = await Promise.race([pbv2Promise, timeoutPromise]);
    const latency = Date.now() - startTime;

    // 5. Procesar resultado base
    optimizedPrompt = result.prompt || '';

    // 6. Agregar contexto de plan si existe
    optimizedPrompt = addPlanContext(optimizedPrompt, planContext);

    // 7. Procesar resultado final con metadata completa
    const processedResult = processResult(result, params, cwd, latency);

    console.error(`[PBv2 Activator] ✅ Success in ${latency}ms (score: ${processedResult.expectedScore})`);

    return {
      ...processedResult,
      prompt: optimizedPrompt, // Prompt con contexto agregado
      planContext,
      config
    };

  } catch (error) {
    const latency = Date.now() - startTime;
    console.error(`[PBv2 Activator] ❌ Error after ${latency}ms:`, error.message);

    return {
      success: false,
      latency_ms: latency,
      prompt: '',
      error: error.message,
      planContext,
      metadata: {
        timestamp: new Date().toISOString(),
        error: true
      }
    };
  }
}

// Ejecutar si se llama directamente desde línea de comandos
if (import.meta.url === `file://${process.argv[1]}`) {
  const description = process.argv[2] || '';

  if (!description) {
    console.error('❌ Error: Se requiere una descripción como primer argumento');
    console.error('Uso: node pbv2-activator-final.mjs "descripción del prompt" [--skill-ids skill1,skill2]');
    process.exit(1);
  }

  // Parsear opciones adicionales
  const options = {};
  const skillIdsIndex = process.argv.findIndex(arg => arg === '--skill-ids');
  if (skillIdsIndex !== -1 && process.argv[skillIdsIndex + 1]) {
    options.skillIds = process.argv[skillIdsIndex + 1].split(',');
  }

  activatePBv2(description, process.cwd(), options)
    .then(result => {
      console.log('\n✅ **Activation Result:**');
      console.log(`Success: ${result.success}`);
      console.log(`Latency: ${result.latency_ms}ms`);
      console.log(`Score: ${result.expectedScore || 'N/A'}`);
      console.log(`Skills activated: ${result.skillActivation?.length || 0}`);

      if (result.error) {
        console.log(`❌ Error: ${result.error}`);
      }

      if (result.planContext?.planId) {
        console.log(`📋 Plan: ${result.planContext.planId}`);
      }

      if (result.prompt) {
        console.log('\n📝 **Generated Prompt:**');
        console.log('─'.repeat(50));
        console.log(result.prompt);
        console.log('─'.repeat(50));
      }

      if (result.metadata) {
        console.log(`\n📊 **Metadata:**`);
        console.log(`Repo size: ${result.metadata.repoSize}`);
        console.log(`Repo files: ${result.metadata.repoFiles}`);
        console.log(`Monorepo: ${result.metadata.isMonorepo}`);
      }
    })
    .catch(error => {
      console.error('❌ Fatal error:', error.message);
      console.error(error.stack);
      process.exit(1);
    });
}
