#!/usr/bin/env node

/**
 * PBv2 Integration Extension for Stop Hook
 *
 * Extensión del Stop Hook para integrar automáticamente Prompt Builder v2
 * cuando Claude Code genera un plan.
 *
 * Version: 2.0.0
 * Author: Skills Fabric Team
 */

import { detectPlan, planCache } from './plan-detector.mjs';
import { activatePBv2, savePlanResult } from './pbv2-activator.mjs';
import { loadConfig, isDebugMode, isVerboseMode } from './config-loader.mjs';

/**
 * Procesa la salida del Claude Code buscando planes
 * @param {string} output - Salida del Claude Code
 * @param {string} cwd - Directorio de trabajo
 * @param {Object} options - Opciones adicionales
 * @returns {Object} - Resultado del procesamiento
 */
export async function processClaudeOutput(output, cwd, options = {}) {
  const config = loadConfig(cwd);

  // Log para debugging
  if (isDebugMode(config)) {
    console.error('[PBv2 Integration] 🔍 Debug mode enabled');
    console.error('[PBv2 Integration] Output length:', output?.length || 0);
  }

  // Verificar si la integración está habilitada
  if (!config.detection.enabled) {
    if (isVerboseMode(config)) {
      console.error('[PBv2 Integration] ⚠️ Detection disabled in config');
    }
    return { processed: false, reason: 'disabled' };
  }

  // Verificar si hay TTY (solo mostrar UI si hay terminal interactiva)
  const hasTTY = process.stdout.isTTY;
  if (!hasTTY && config.output.showInTerminal) {
    if (isVerboseMode(config)) {
      console.error('[PBv2 Integration] ⚠️ No TTY detected, skipping UI');
    }
  }

  // Si no hay output, retornar
  if (!output || typeof output !== 'string') {
    return { processed: false, reason: 'no_output' };
  }

  try {
    // DETECTAR PLAN
    if (isVerboseMode(config)) {
      console.error('[PBv2 Integration] 🔍 Scanning for plans...');
    }

    const detection = detectPlan(output);

    if (!detection) {
      if (isVerboseMode(config)) {
        console.error('[PBv2 Integration] ✗ No plan detected');
      }
      return { processed: false, reason: 'no_plan' };
    }

    if (isDebugMode(config)) {
      console.error('[PBv2 Integration] ✅ Plan detected');
      console.error('[PBv2 Integration] Confidence:', (detection.confidence * 100).toFixed(0) + '%');
      console.error('[PBv2 Integration] Hash:', detection.hash.substring(0, 8) + '...');
    }

    // VERIFICAR CACHE (evitar spam)
    if (config.detection.cache.enabled && planCache.has(detection.hash)) {
      if (isVerboseMode(config)) {
        console.error('[PBv2 Integration] 💤 Plan already processed (cache hit)');
      }
      return { processed: false, reason: 'cached', hash: detection.hash };
    }

    // ACTIVAR PBV2
    if (!config.activation.enabled) {
      if (isVerboseMode(config)) {
        console.error('[PBv2 Integration] ⚠️ Activation disabled in config');
      }
      // Aún guardar en cache para evitar reprocesar
      planCache.set(detection.hash, { detected: true, cached: true });
      return { processed: false, reason: 'activation_disabled', detection };
    }

    if (isVerboseMode(config)) {
      console.error('[PBv2 Integration] 🚀 Activating PBv2...');
    }

    // Modo logOnly (MVP)
    if (config.activation.mode === 'logOnly') {
      if (isVerboseMode(config)) {
        console.error('[PBv2 Integration] 📝 LogOnly mode: saving plan only');
      }

      // Activar PBv2 en background para guardar
      const pbv2Result = await activatePBv2(detection.block, cwd);
      const savedPath = await savePlanResult(detection, pbv2Result, cwd);

      // Agregar al cache
      planCache.set(detection.hash, {
        detected: true,
        saved: !!savedPath,
        cached: true,
        savedPath: savedPath
      });

      // Mostrar mensaje discreto en terminal si hay TTY
      if (hasTTY && config.output.showInTerminal) {
        console.log(`\n${config.output.compactMessage}\n`);
      }

      // Log de métricas si están habilitadas
      if (config.metrics.enabled) {
        await logMetrics({
          detection,
          pbv2Result,
          saved: !!savedPath,
          mode: 'logOnly'
        }, config);
      }

      return {
        processed: true,
        action: 'saved',
        detection,
        pbv2Result,
        savedPath
      };
    }

    // Otros modos (onDemand, auto) - para futuras implementaciones
    if (config.activation.mode === 'onDemand') {
      if (isVerboseMode(config)) {
        console.error('[PBv2 Integration] ⏳ OnDemand mode: waiting for user input');
      }

      // Por ahora, actuar como logOnly
      const pbv2Result = await activatePBv2(detection.block, cwd);
      const savedPath = await savePlanResult(detection, pbv2Result, cwd);

      planCache.set(detection.hash, {
        detected: true,
        saved: !!savedPath,
        mode: 'onDemand'
      });

      return {
        processed: true,
        action: 'saved_pending_user',
        detection,
        pbv2Result,
        savedPath,
        userAction: 'copy_prompt'
      };
    }

    if (config.activation.mode === 'auto') {
      if (isVerboseMode(config)) {
        console.error('[PBv2 Integration] 🤖 Auto mode: full activation');
      }

      // Activación completa - para futura implementación
      const pbv2Result = await activatePBv2(detection.block, cwd);
      const savedPath = await savePlanResult(detection, pbv2Result, cwd);

      return {
        processed: true,
        action: 'auto_activated',
        detection,
        pbv2Result,
        savedPath
      };
    }

    // Modo desconocido
    if (isVerboseMode(config)) {
      console.error(`[PBv2 Integration] ⚠️ Unknown mode: ${config.activation.mode}`);
    }

    return { processed: false, reason: 'unknown_mode', detection };

  } catch (error) {
    console.error('[PBv2 Integration] 💥 Error processing output:', error.message);

    // Fallback según configuración
    if (config.fallback.onError === 'logOnly') {
      if (isVerboseMode(config)) {
        console.error('[PBv2 Integration] 🔄 Fallback to logOnly mode');
      }

      // Intentar al menos guardar el plan original
      try {
        const detection = detectPlan(output);
        if (detection) {
          planCache.set(detection.hash, { error: true, cached: true });
        }
      } catch (fallbackError) {
        // Ignorar errores en fallback
      }

      return { processed: false, reason: 'error', error: error.message };
    }

    return { processed: false, reason: 'error', error: error.message };
  }
}

/**
 * Registra métricas de la integración
 * @param {Object} data - Datos a registrar
 * @param {Object} config - Configuración
 */
async function logMetrics(data, config) {
  if (!config.metrics.enabled) return;

  try {
    const { writeFileSync, existsSync, mkdirSync } = await import('fs');
    const { join } = await import('path');

    const logDir = join(process.cwd(), 'logs');
    if (!existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true });
    }

    const logFile = join(logDir, 'pbv2-integration.log');
    const logEntry = {
      timestamp: new Date().toISOString(),
      detection: data.detection ? {
        hash: data.detection.hash,
        confidence: data.detection.confidence
      } : null,
      pbv2: data.pbv2Result ? {
        success: data.pbv2Result.success,
        latency_ms: data.pb2Result?.latency_ms,
        score: data.pb2Result?.expectedScore
      } : null,
      saved: data.saved,
      mode: data.mode
    };

    const logLine = JSON.stringify(logEntry) + '\n';
    writeFileSync(logFile, logLine, { flag: 'a' });

  } catch (error) {
    // Silently fail on metrics logging
    if (isDebugMode(config)) {
      console.error('[PBv2 Integration] Failed to log metrics:', error.message);
    }
  }
}

/**
 * Obtiene estadísticas del cache
 * @returns {Object} - Estadísticas del cache
 */
export function getCacheStats() {
  return planCache.getStats();
}

/**
 * Limpia el cache
 */
export function clearCache() {
  planCache.clear();
}

/**
 * Hook principal para integrar con Claude Code Stop Hook
 * @param {string} output - Salida del Claude Code
 * @param {Object} context - Contexto adicional
 * @returns {Promise<Object>} - Resultado del procesamiento
 */
export async function pbv2StopHook(output, context = {}) {
  const cwd = context.cwd || process.cwd();

  if (context.verbose) {
    console.error('[PBv2 Stop Hook] Starting...');
  }

  const result = await processClaudeOutput(output, cwd, context);

  if (context.verbose) {
    console.error('[PBv2 Stop Hook] Result:', result);
  }

  return result;
}

/**
 * Interfaz simplificada para uso directo
 * @param {string} output - Salida del Claude Code
 * @param {string} cwd - Directorio de trabajo
 * @returns {Promise<Object>} - Resultado
 */
export async function integratePBv2(output, cwd = process.cwd()) {
  return processClaudeOutput(output, cwd);
}

// Test function
if (import.meta.url === `file://${process.argv[1]}`) {
  const testOutput = `
[Layout] Plan de desarrollo:
1. Diseñar arquitectura backend
2. Implementar API REST
3. Configurar base de datos
4. Testing de endpoints

Este es el plan para el proyecto.
`;

  console.log('🧪 Testing PBv2 Integration:\n');

  integratePBv2(testOutput, process.cwd())
    .then(result => {
      console.log('\n✅ Integration Result:');
      console.log(JSON.stringify(result, null, 2));

      console.log('\n📊 Cache Stats:');
      console.log(JSON.stringify(getCacheStats(), null, 2));
    })
    .catch(error => {
      console.error('💥 Error:', error);
    });
}
