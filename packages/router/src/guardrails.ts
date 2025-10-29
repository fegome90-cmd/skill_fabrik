/**
 * Guardrails: Verificación de patterns peligrosos en archivos editados
 */

import { readFile } from 'fs/promises';
import { resolve } from 'path';
import type { EditLogEntry, GuardrailViolation } from './types.js';

/**
 * Carga patterns de bloqueo desde skill-rules.json
 */
async function loadBlockingPatterns(cwd: string): Promise<Map<string, string[]>> {
  const { loadRules } = await import('./detectors.js');
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
 * Verifica si un archivo coincide con pathPatterns de un skill
 * Soporta glob patterns básicos: **, *, y extensiones {ts,js}
 */
function matchesPathPatterns(filePath: string, pathPatterns: string[]): boolean {
  if (!pathPatterns || pathPatterns.length === 0) {
    return true; // Sin patterns = todos los archivos
  }

  // Normalizar path para comparación
  const normalizedPath = filePath.replace(/\\/g, '/');

  for (const pattern of pathPatterns) {
    // Procesar extensiones {ts,js} -> (ts|js)
    let processedPattern = pattern
      .replace(/\{([^}]+)\}/g, '($1)') // {ts,js} -> (ts,js)
      .replace(/,/g, '|'); // (ts,js) -> (ts|js)

    // Convertir glob pattern a regex
    let regexStr = processedPattern
      .replace(/\*\*/g, '__DOUBLESTAR__')
      .replace(/\*/g, '[^/]*')
      .replace('__DOUBLESTAR__', '.*')
      .replace(/\./g, '\\.');

    regexStr = regexStr.replace(/\\/g, '/');

    try {
      // Probar match completo
      if (new RegExp(`^${regexStr}$`).test(normalizedPath)) {
        return true;
      }
      // Probar si path contiene el pattern (match parcial) - importante para **
      if (new RegExp(regexStr).test(normalizedPath)) {
        return true;
      }
      // Probar si el path contiene segmentos clave del pattern (para casos como **/repository/**)
      const patternSegments = pattern
        .split('/')
        .filter(s => s && !s.includes('*') && !s.includes('{') && s.length > 0);
      if (patternSegments.length > 0) {
        const allSegmentsMatch = patternSegments.every(segment => normalizedPath.includes(segment));
        if (allSegmentsMatch) {
          // Verificar extensión también
          const extPattern = pattern.match(/\{([^}]+)\}/);
          if (extPattern) {
            const exts = extPattern[1].split(',').map(e => e.trim());
            const fileExt = normalizedPath.split('.').pop()?.trim();
            if (fileExt && exts.includes(fileExt)) {
              return true;
            }
          } else {
            return true; // Sin especificar extensión, coincide
          }
        }
      }
    } catch (error) {
      // Pattern inválido, continuar
      console.warn(`Pattern inválido: ${pattern}`, error);
    }
  }

  return false;
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
        // Usar matchAll para evitar problemas con estado global de regex
        // Nota: matchAll requiere Node 12+, pero es más seguro que exec() en loop
        const regex = new RegExp(pattern, 'g');
        const matches: Array<{ index: number; text: string }> = [];

        // Usar matchAll si está disponible, sino usar exec manualmente con reset
        if (typeof content.matchAll === 'function') {
          const matchIterator = content.matchAll(regex);
          for (const match of matchIterator) {
            matches.push({ index: match.index!, text: match[0] });
          }
        } else {
          // Fallback para Node < 12: usar exec con reset explícito
          let match: RegExpExecArray | null;
          regex.lastIndex = 0; // Reset explícito
          while ((match = regex.exec(content)) !== null) {
            matches.push({ index: match.index, text: match[0] });
            // Safety check para evitar loops infinitos
            if (matches.length > 100) break;
          }
        }

        for (const matchItem of matches) {
          const lineNumber = content.substring(0, matchItem.index).split('\n').length;
          const line = lines[lineNumber - 1];

          // Para deleteMany/updateMany, verificar que tenga where
          if (pattern.includes('deleteMany') || pattern.includes('updateMany')) {
            // Buscar contexto amplio alrededor del match
            const contextStart = Math.max(0, matchItem.index - 200);
            const contextEnd = Math.min(content.length, matchItem.index + 500);
            const matchContext = content.substring(contextStart, contextEnd);

            // Buscar patrones de where explícito
            if (/\bwhere\s*[:=]?\s*\{/.test(matchContext)) {
              continue; // Tiene where, no es violación
            }
          }

          // Solo agregar violación si NO tiene where (ya se verificó arriba)
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

  // Cargar rules para obtener pathPatterns
  const { loadRules } = await import('./detectors.js');
  const rules = await loadRules(cwd);

  const allViolations: GuardrailViolation[] = [];

  for (const entry of editLog) {
    // El entry.file puede ser relativo o absoluto
    let filePath: string;
    let relativeFile: string;

    if (entry.file.startsWith('/') || entry.file.match(/^[A-Z]:\\/)) {
      filePath = entry.file; // Ya es absoluto
      relativeFile = filePath.replace(cwd + '/', '').replace(/\\/g, '/');
    } else {
      filePath = resolve(cwd, entry.file);
      relativeFile = entry.file.replace(/\\/g, '/');
    }

    for (const [skillId, patterns] of blockingPatterns.entries()) {
      // Verificar si el archivo coincide con pathPatterns del skill
      const rule = rules[skillId];
      let shouldCheck = true;

      if (rule?.fileTriggers?.pathPatterns && rule.fileTriggers.pathPatterns.length > 0) {
        // Probar tanto con path relativo como absoluto
        const matchesRelative = matchesPathPatterns(relativeFile, rule.fileTriggers.pathPatterns);
        const matchesAbsolute = matchesPathPatterns(filePath, rule.fileTriggers.pathPatterns);
        shouldCheck = matchesRelative || matchesAbsolute;
      }

      if (!shouldCheck) {
        continue; // Archivo no coincide con pathPattern, saltar
      }

      const violations = await checkFileAgainstPatterns(filePath, patterns, skillId);
      allViolations.push(...violations);
    }
  }

  return {
    blocked: allViolations.length > 0,
    violations: allViolations,
  };
}
