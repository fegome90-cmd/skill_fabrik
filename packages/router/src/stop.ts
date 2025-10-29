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
import { writeFile, appendFile, mkdir } from 'fs/promises';
import type { StopHookInput, StopHookOutput, KPIEvent } from './types.js';
import { checkGuardrails } from './guardrails.js';

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

    // Emit KPI de bloqueo
    const kpiEvent: KPIEvent = {
      ts: new Date().toISOString(),
      repo: reposChanged[0] || 'unknown',
      skills: guardrailCheck.violations.map(v => v.skillId),
      errors_ts: 0,
      auto_resolver_used: false,
      latency_ms: 0,
      zero_errors_left_behind: false,
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
  };

  await emitKPIEvent(kpiEvent, input.cwd);

  return {
    formatted,
    typecheck,
    hints,
    autoResolved,
    kpiEvent,
  };
}
