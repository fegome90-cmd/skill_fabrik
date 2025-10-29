/**
 * Stop Hook: Pipeline de calidad post-respuesta
 * 1. Prettier → archivos editados
 * 2. TypeCheck por repo
 * 3. Error hints (si 1-4 errores)
 * 4. Auto-resolver (si ≥5 errores)
 * 5. Emit KPIs
 */

import { execa } from 'execa';
import { resolve } from 'path';
import { readFile, writeFile, appendFile, mkdir, access, constants } from 'fs/promises';
import type { StopHookInput, StopHookOutput, KPIEvent } from './types.js';
import { checkGuardrails } from './guardrails.js';

/**
 * Verifica si un path existe
 */
async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Formatea archivos editados con Prettier
 */
async function runPrettier(files: string[], cwd: string): Promise<string[]> {
  if (files.length === 0) return [];

  try {
    await execa('npx', ['prettier', '--write', ...files], {
      cwd,
      stdio: 'inherit',
    });
    return files;
  } catch (error) {
    console.warn('Prettier falló, continuando:', error);
    return [];
  }
}

/**
 * Ejecuta typecheck por repo tocado
 */
async function runTypeCheck(
  repos: string[],
  cwd: string
): Promise<Array<{ repo: string; errors: number; output: string }>> {
  const results: Array<{ repo: string; errors: number; output: string }> = [];

  for (const repo of repos) {
    try {
      const repoPath = resolve(cwd, repo);
      const { stdout, stderr } = await execa('npx', ['tsc', '--noEmit'], {
        cwd: repoPath,
        reject: false,
      });

      // Contar errores en la salida
      const errorLines = (stdout + stderr).split('\n').filter(line => line.includes('error TS'));

      results.push({
        repo,
        errors: errorLines.length,
        output: stdout + stderr,
      });
    } catch (error) {
      results.push({
        repo,
        errors: -1,
        output: `Error ejecutando tsc: ${error}`,
      });
    }
  }

  return results;
}

/**
 * Genera hints de errores si hay 1-4 errores
 */
function generateErrorHints(
  typecheckResults: Array<{ repo: string; errors: number; output: string }>
): string[] {
  const hints: string[] = [];
  const totalErrors = typecheckResults.reduce((sum, r) => sum + Math.max(0, r.errors), 0);

  if (totalErrors >= 1 && totalErrors <= 4) {
    hints.push(`⚠️ Se detectaron ${totalErrors} error(es) TypeScript:`);

    for (const result of typecheckResults) {
      if (result.errors > 0) {
        hints.push(`  • ${result.repo}: ${result.errors} error(es)`);

        // Extraer primeros errores como hint
        const errorLines = result.output
          .split('\n')
          .filter(line => line.includes('error TS'))
          .slice(0, 2);

        errorLines.forEach(line => {
          hints.push(`    → ${line.trim()}`);
        });
      }
    }

    hints.push(
      '\n💡 Recordatorio: Manejo de errores en controladores/repos (logger/Sentry, BaseController, try/catch)'
    );
  }

  return hints;
}

/**
 * Emite evento KPI a events.jsonl
 */
async function emitKPIEvent(event: KPIEvent, cwd: string): Promise<void> {
  const kpiDir = resolve(cwd, 'obs/kpi');
  await mkdir(kpiDir, { recursive: true });

  const kpiFile = resolve(kpiDir, 'events.jsonl');
  await appendFile(kpiFile, JSON.stringify(event) + '\n', 'utf-8');
}

/**
 * Ejecuta notificación cross-platform
 */
async function sendNotification(
  type: 'info' | 'success' | 'warning' | 'error',
  message: string,
  cwd: string
): Promise<void> {
  try {
    // Intentar leer configuración de hooks
    const hooksConfigPath = resolve(cwd, '.cursor/hooks/hooks-config.json');
    let notifyEnabled = true;
    let notifyScriptPath = 'scripts/hooks/notify.sh';

    if (await pathExists(hooksConfigPath)) {
      try {
        const hooksConfig = JSON.parse(await readFile(hooksConfigPath, 'utf-8'));
        const stopConfig = hooksConfig.stop;
        if (stopConfig?.notifications) {
          notifyEnabled = stopConfig.notifications.enabled !== false;
          if (stopConfig.notifications.scriptPath) {
            notifyScriptPath = stopConfig.notifications.scriptPath;
          }

          // Verificar si este tipo de notificación está habilitado
          const typeMap: Record<string, string> = {
            success: 'onSuccess',
            warning: 'onWarning',
            error: 'onError',
          };
          const typeKey = typeMap[type];
          if (typeKey && stopConfig.notifications[typeKey] === false) {
            return; // Esta notificación está deshabilitada
          }
        }
      } catch {
        // Si hay error leyendo config, continuar con defaults
      }
    }

    if (!notifyEnabled) {
      return;
    }

    const notifyScript = resolve(cwd, notifyScriptPath);
    if (!(await pathExists(notifyScript))) {
      return; // Script no existe, continuar silenciosamente
    }

    // Ejecutar script de notificación
    await execa('bash', [notifyScript, type, message], {
      cwd,
      stdio: 'ignore', // No mostrar output del script de notificación
    });
  } catch (error) {
    // Silenciosamente fallar - las notificaciones no deben romper el hook
    // console.warn('Failed to send notification:', error);
  }
}

/**
 * Stop Hook principal: ejecuta pipeline completo
 */
export async function stopHook(input: StopHookInput): Promise<StopHookOutput> {
  const editedFiles = input.editLog.map(e => e.file);
  const reposChanged = Array.from(input.reposChanged);

  // 0. Guardrails: Verificar bloqueos ANTES de cualquier otra operación
  const guardrailCheck = await checkGuardrails(input.editLog, input.cwd);

  if (guardrailCheck.blocked) {
    // Si hay violaciones de guardrail, bloquear y reportar
    const violationMessages = guardrailCheck.violations.map(v => {
      const location = v.line ? `${v.file}:${v.line}` : v.file;
      return `🚫 ${v.skillId}: ${v.message}\n   → ${location}`;
    });

    console.error('⚠️  GUARDRAIL BLOQUEADO - Operación no permitida:\n');
    console.error(violationMessages.join('\n\n'));
    console.error('\nPor favor corrige las violaciones antes de continuar.');

    // Enviar notificación de error
    await sendNotification(
      'error',
      `Guardrail bloqueado: ${guardrailCheck.violations.length} violación(es) detectada(s)`,
      input.cwd
    );

    // Emit KPI de bloqueo
    const kpiEvent: KPIEvent = {
      ts: new Date().toISOString(),
      repo: reposChanged[0] || 'unknown',
      skills: guardrailCheck.violations.map(v => v.skillId),
      errors_ts: 0,
      auto_resolver_used: false,
      latency_ms: 0,
      zero_errors_left_behind: false,
      activated_by: {
        keywords: false,
        intent_regex: false,
        path_globs: false,
        content_patterns: false,
      },
      adherence: false,
      progressive_disclosure: {
        metadata_loaded: false,
        skill_md_loaded: false,
        resources_loaded: 0,
      },
    };

    await emitKPIEvent(kpiEvent, input.cwd);

    return {
      formatted: [],
      typecheck: [],
      hints: violationMessages,
      autoResolved: false,
      kpiEvent,
    };
  }

  // 1. Prettier
  const formatted = await runPrettier(editedFiles, input.cwd);

  // 2. TypeCheck
  const typecheck = await runTypeCheck(reposChanged, input.cwd);
  const totalErrors = typecheck.reduce((sum, r) => sum + Math.max(0, r.errors), 0);

  // 3. Error hints (si 1-4 errores)
  const hints = totalErrors >= 1 && totalErrors <= 4 ? generateErrorHints(typecheck) : undefined;

  // 4. Auto-resolver (si ≥5 errores) - por ahora solo flag, implementación futura
  const autoResolved = false; // TODO: Invocar agente auto-fix si totalErrors >= 5

  // 5. Emit KPI Event
  const kpiEvent: KPIEvent = {
    ts: new Date().toISOString(),
    repo: reposChanged[0] || 'unknown',
    skills: [], // Se llena desde contexto de skills activos
    errors_ts: totalErrors,
    auto_resolver_used: autoResolved,
    latency_ms: 0, // Se llena desde tiempo de ejecución real
    zero_errors_left_behind: totalErrors === 0,
    activated_by: {
      keywords: false,
      intent_regex: false,
      path_globs: false,
      content_patterns: false,
    },
    adherence: false,
    progressive_disclosure: {
      metadata_loaded: false,
      skill_md_loaded: false,
      resources_loaded: 0,
    },
  };

  await emitKPIEvent(kpiEvent, input.cwd);

  // 6. Enviar notificaciones según resultado
  if (totalErrors === 0 && formatted.length > 0) {
    // Éxito: archivos formateados sin errores
    await sendNotification(
      'success',
      `✓ ${formatted.length} archivo(s) formateado(s) sin errores`,
      input.cwd
    );
  } else if (totalErrors > 0) {
    // Errores detectados
    await sendNotification(
      'warning',
      `⚠️ ${totalErrors} error(es) TypeScript detectado(s)`,
      input.cwd
    );
  } else if (formatted.length === 0 && input.editLog.length > 0) {
    // Sin cambios que formatear
    await sendNotification('info', `ℹ️ Sin cambios que procesar`, input.cwd);
  }

  return {
    formatted,
    typecheck,
    hints,
    autoResolved,
    kpiEvent,
  };
}
