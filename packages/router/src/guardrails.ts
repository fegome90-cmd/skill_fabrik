/**
 * Guardrails: Verificación de patterns peligrosos en archivos editados
 */

import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { loadRules } from './detectors.js';
import type { EditLogEntry, GuardrailViolation } from './types.js';

/**
 * Carga patterns de bloqueo desde skill-rules.json
 */
async function loadBlockingPatterns(cwd: string): Promise<Map<string, string[]>> {
  const rules = await loadRules(cwd);
  const patterns = new Map<string, string[]>();

  for (const [skillId, rule] of Object.entries(rules)) {
    if (rule.type === 'guardrail' && rule.enforcement === 'block') {
      // Extraer contentPatterns que son peligrosos
      const blockingPatterns = rule.fileTriggers?.contentPatterns || [];
      if (blockingPatterns.length > 0) {
        patterns.set(skillId, blockingPatterns);
      }
    }
  }

  return patterns;
}

/**
 * Verifica archivo contra patterns de bloqueo
 */
async function checkFileAgainstPatterns(
  filePath: string,
  patterns: string[],
  skillId: string
): Promise<GuardrailViolation[]> {
  const violations: GuardrailViolation[] = [];

  try {
    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    for (const pattern of patterns) {
      try {
        const regex = new RegExp(pattern, 'g');
        let match: RegExpExecArray | null;

        while ((match = regex.exec(content)) !== null) {
          // Verificar si el match está en una línea peligrosa
          const lineNumber = content.substring(0, match.index).split('\n').length;
          const line = lines[lineNumber - 1];

          // Para deleteMany/updateMany, verificar que tenga where
          if (pattern.includes('deleteMany') || pattern.includes('updateMany')) {
            // Buscar si hay "where" en las siguientes líneas (hasta 5 líneas)
            const contextStart = Math.max(0, lineNumber - 1);
            const contextEnd = Math.min(lines.length, lineNumber + 5);
            const context = lines.slice(contextStart, contextEnd).join('\n');

            // Si tiene where explícito, no es violación
            if (/\bwhere\s*[:=]\s*\{/.test(context)) {
              continue;
            }
          }

          violations.push({
            skillId,
            file: filePath,
            line: lineNumber,
            pattern,
            message: getViolationMessage(skillId, pattern, line),
          });
        }
      } catch (error) {
        // Pattern regex inválido, continuar
        console.warn(`Pattern inválido para ${skillId}: ${pattern}`, error);
      }
    }
  } catch (error) {
    // Error leyendo archivo, continuar
    console.warn(`Error leyendo ${filePath}`, error);
  }

  return violations;
}

/**
 * Genera mensaje de violación específico
 */
function getViolationMessage(skillId: string, pattern: string, line: string): string {
  if (skillId === 'database-verification') {
    if (pattern.includes('deleteMany')) {
      return "deleteMany() sin cláusula 'where' explícita es peligroso. Añade { where: { ... } }";
    }
    if (pattern.includes('updateMany')) {
      return "updateMany() sin cláusula 'where' explícita es peligroso. Añade { where: { ... } }";
    }
    if (pattern.includes('TRUNCATE') || pattern.includes('DROP')) {
      return 'Operación destructiva detectada. Solo permitida en migraciones con plan de rollback.';
    }
  }

  return `Pattern peligroso detectado: ${pattern}`;
}

/**
 * Verifica todos los archivos editados contra guardrails de bloqueo
 */
export async function checkGuardrails(
  editLog: EditLogEntry[],
  cwd: string
): Promise<{
  blocked: boolean;
  violations: GuardrailViolation[];
}> {
  const blockingPatterns = await loadBlockingPatterns(cwd);

  if (blockingPatterns.size === 0) {
    return { blocked: false, violations: [] };
  }

  const allViolations: GuardrailViolation[] = [];

  for (const entry of editLog) {
    const filePath = resolve(cwd, entry.file);

    for (const [skillId, patterns] of blockingPatterns.entries()) {
      // Verificar si el archivo coincide con pathPatterns del skill
      // (simplificado: asumimos que ya fue filtrado en pre-invoke)
      const violations = await checkFileAgainstPatterns(filePath, patterns, skillId);
      allViolations.push(...violations);
    }
  }

  return {
    blocked: allViolations.length > 0,
    violations: allViolations,
  };
}
