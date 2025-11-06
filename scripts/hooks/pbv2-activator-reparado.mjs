#!/usr/bin/env node

/**
 * PBv2 Activator - Versión Estructuralmente Corregida
 * Todos los problemas de estructura han sido reparados
 */

import { buildOptimizedPromptV2 } from '/Users/felipe/Developer/skills-fabrik/packages/skills-cli/dist/utils/prompt-builder-v2.js';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { existsSync, statSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Detecta información del repositorio
 * @param {string} cwd - Directorio de trabajo
 * @returns {Object} Información del repositorio
 */
function detectRepoInfo(cwd) {
  let fileCount = 0;
  let isMonorepo = false;

  try {
    // Detectar si es monorepo
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
            if (!item.startsWith('.') && item !== 'node_modules' && item !== 'dist' && item !== '.git') {
              fileCount += countFiles(join(dir, item));
            }
          }
        } else if (files.isFile()) {
          const validExtensions = ['.js', '.ts', '.mjs', '.json', '.md', '.yml', '.yaml', '.cjs'];
          const ext = dir.split('.').pop();
          if (validExtensions.includes(`.${ext}`)) {
            fileCount++;
          }
        }
      } catch (e) {
        // Ignorar errores de permisos
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
 * Obtiene configuración rápida optimizada
 * @param {string} cwd - Directorio de trabajo
 * @returns {Object} Configuración optimizada
 */
export function TEST_getFastConfig(cwd) {
  const repoInfo = detectRepoInfo(cwd);

  const config = {
    includeFiles: repoInfo.size === 'small',
    includeTags: true,
    includeTemplate: true,
    complexity: repoInfo.size === 'large' ? 'low' : 'medium',
    cwd: cwd,
    timeout: 5000
  };

  console.error(`[PBv2 Activator] Repo info: size=${repoInfo.size}, monorepo=${repoInfo.isMonorepo}`);
  console.error(`[PBv2 Activator] Fast config:`, config);

  return config;
}

/**
 * Intenta obtener el módulo de verificación de planes
 * @param {string} cwd - Directorio de trabajo
 * @returns {Promise<Object|null>} Módulo de plan-check o null
 */
async function getPlanCheck(cwd) {
  try {
    const possiblePaths = [
      join(cwd, 'packages/skills-cli/dist/utils/plan-generator.js'),
      join(cwd, 'packages/skills-cli/dist/utils/plan-check.js')
    ];

    for (const path of possiblePaths) {
      if (existsSync(path)) {
        return await import(path);
      }
    }

    return { checkApprovedPlan: async () => ({ hasPlan: false }) };
  } catch (error) {
    console.error('[PBv2 Activator] Error loading plan check module:', error.message);
    return { checkApprovedPlan: async () => ({ hasPlan: false }) };
  }
}

/**
 * Procesa el resultado del prompt builder v2
 * @param {Object} result - Resultado de PBv2
 * @param {Object} params - Parámetros usados
 * @param {string} cwd - Directorio de trabajo
 * @param {number} latency - Latencia en ms
 * @returns {Object} Resultado procesado
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
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * Función principal de activación
 * @param {string} description - Descripción para el prompt
 * @param {string} cwd - Directorio de trabajo
 * @param {Object} options - Opciones adicionales
 * @returns {Promise<Object>} Resultado de la activación
 */
export async function activatePBv2(description, cwd = process.cwd(), options = {}) {
  console.error(`[PBv2 Activator] Starting activation for "${description.substring(0, 50)}${description.length > 50 ? '...' : ''}" (${description.length} chars)`);

  const startTime = Date.now();
  let planContext = null;
  let optimizedPrompt = '';

  try {
    // Obtener contexto del plan
    const planCheckModule = await getPlanCheck(cwd);
    const planCheck = await planCheckModule.checkApprovedPlan(cwd);

    if (planCheck.hasPlan && planCheck.plan) {
      const plan = planCheck.plan;
      planContext = {
        planId: plan.id || 'Unknown Plan',
        taskName: planCheck.taskName || 'Unknown Task',
        phases: plan.phases || [],
      };
    }

    // Obtener configuración
    const config = TEST_getFastConfig(cwd);

    // Preparar parámetros
    const params = {
      description,
      ...config,
      ...options
    };

    console.error(`[PBv2 Activator] Using config: files=${config.includeFiles}, tags=${config.includeTags}, template=${config.includeTemplate}`);

    // Llamar a PBv2 con timeout
    const pbv2Promise = buildOptimizedPromptV2(params);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('PBv2 timeout after ' + config.timeout + 'ms')), config.timeout);
    });

    const result = await Promise.race([pbv2Promise, timeoutPromise]);
    const latency = Date.now() - startTime;

    // Procesar resultado
    optimizedPrompt = result.prompt || '';

    // Agregar contexto de plan
    if (planContext && options.includePlanContext) {
      optimizedPrompt += `\n\n📋 Plan activo: ${planContext.planId} (${planContext.taskName})`;
      if (planContext.phases && planContext.phases.length > 0) {
        optimizedPrompt += `\nFases del plan: ${planContext.phases.map(p => p.name || p).join(', ')}`;
      }
    }

    // Procesar resultado final
    const processedResult = processResult(result, params, cwd, latency);

    console.error(`[PBv2 Activator] ✅ Success in ${latency}ms`);

    return {
      ...processedResult,
      prompt: optimizedPrompt,
      planContext
    };

  } catch (error) {
    const latency = Date.now() - startTime;
    console.error(`[PBv2 Activator] ❌ Error after ${latency}ms:`, error.message);

    return {
      success: false,
      latency_ms: latency,
      prompt: '',
      error: error.message,
      planContext
    };
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const description = process.argv[2] || '';

  if (!description) {
    console.error('❌ Error: Se requiere una descripción como primer argumento');
    process.exit(1);
  }

  activatePBv2(description, process.cwd(), {})
    .then(result => {
      console.log('\n✅ **Activation Result:**');
      console.log(`Success: ${result.success}`);
      console.log(`Latency: ${result.latency_ms}ms`);
      console.log(`Score: ${result.expectedScore || 'N/A'}`);

      if (result.error) {
        console.log(`❌ Error: ${result.error}`);
      }

      if (result.planContext?.planId) {
        console.log(`📋 Plan: ${result.planContext.planId}`);
      }

      if (result.prompt) {
        console.log('\n📝 **Generated Prompt:**');
        console.log(result.prompt);
      }
    })
    .catch(error => {
      console.error('❌ Fatal error:', error.message);
      process.exit(1);
    });
}
