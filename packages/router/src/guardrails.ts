/**
 * Guardrails: Verificación de patterns peligrosos en archivos editados
 * Soporta multi-nivel: SUGGEST → WARN → BLOCK
 */

import { readFile } from 'fs/promises';
import { resolve } from 'path';
import type { EditLogEntry, GuardrailViolation } from './types.js';

export interface GuardrailResult {
  blocked: boolean;
  warnings: GuardrailViolation[];
  suggestions: GuardrailViolation[];
  violations: GuardrailViolation[]; // Deprecated: mantener para compatibilidad
}

/**
 * Carga patterns de guardrails desde skill-rules.json por nivel de enforcement
 */
async function loadGuardrailPatterns(cwd: string): Promise<{
  block: Map<string, string[]>;
  warn: Map<string, string[]>;
  suggest: Map<string, string[]>;
}> {
  const { loadRules } = await import('./detectors.js');
  const rules = await loadRules(cwd);
  const patterns = {
    block: new Map<string, string[]>(),
    warn: new Map<string, string[]>(),
    suggest: new Map<string, string[]>(),
  };

  for (const [skillId, rule] of Object.entries(rules)) {
    if (rule.type === 'guardrail' && rule.enforcement) {
      const contentPatterns = rule.fileTriggers?.contentPatterns || [];
      if (contentPatterns.length > 0) {
        // contentPatterns es string[], asegurar que todos sean strings
        const patternsArray: string[] = contentPatterns.filter((p): p is string => typeof p === 'string');
        
        if (patternsArray.length > 0) {
          const enforcement = rule.enforcement;
          // Usar switch para evitar problemas de inferencia de tipos
          switch (enforcement) {
            case 'block':
            case 'require':
              patterns.block.set(skillId, patternsArray);
              break;
            case 'warn':
              patterns.warn.set(skillId, patternsArray);
              break;
            case 'suggest':
              patterns.suggest.set(skillId, patternsArray);
              break;
          }
        }
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
      // Esta es una heurística más flexible para glob patterns complejos
      const patternSegments = pattern
        .split('/')
        .filter(s => s && !s.includes('*') && !s.includes('{') && s.length > 0);
      if (patternSegments.length > 0) {
        const allSegmentsMatch = patternSegments.every(segment => normalizedPath.includes(segment));
        if (allSegmentsMatch) {
          // Verificar extensión también si está especificada
          const extPattern = pattern.match(/\{([^}]+)\}/);
          if (extPattern) {
            const exts = extPattern[1].split(',').map(e => e.trim());
            const fileExt = normalizedPath.split('.').pop()?.trim();
            if (fileExt && exts.includes(fileExt)) {
              return true;
            }
          } else if (pattern.includes('*.')) {
            // Pattern tiene extensión wildcard pero no {ts,js}, verificar que el archivo tenga extensión
            const hasExtension = normalizedPath.includes('.') && normalizedPath.split('.').length > 1;
            if (hasExtension) {
              return true;
            }
          } else {
            // Sin especificar extensión explícita, si todos los segmentos coinciden, aceptar
            return true;
          }
        }
      }
      
      // Método adicional: verificar si path contiene la estructura básica del pattern
      // Ejemplo: **/repository/** debería coincidir con cualquier path que tenga /repository/
      if (pattern.includes('**/') || pattern.startsWith('**')) {
        const corePath = pattern
          .replace(/^\*\*\//, '')
          .replace(/\/\*\*/g, '/')
          .replace(/\*/g, '')
          .replace(/\{[^}]+\}/g, '')
          .replace(/\/$/, '');
        
        if (corePath && normalizedPath.includes(corePath)) {
          // Verificar extensión si está especificada
          const extPattern = pattern.match(/\{([^}]+)\}/);
          if (extPattern) {
            const exts = extPattern[1].split(',').map(e => e.trim());
            const fileExt = normalizedPath.split('.').pop()?.trim();
            if (fileExt && exts.includes(fileExt)) {
              return true;
            }
          } else {
            return true;
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
 * Verifica archivo contra patterns de guardrail
 */
async function checkFileAgainstPatterns(
  filePath: string,
  patterns: string[],
  skillId: string,
  enforcement: 'suggest' | 'warn' | 'block'
): Promise<GuardrailViolation[]> {
  const violations: GuardrailViolation[] = [];

  try {
    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    for (const pattern of patterns) {
      try {
        // Usar matchAll para evitar problemas con estado global de regex
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
          const line = lines[lineNumber - 1] || '';

          // Para deleteMany/updateMany/findMany, verificar que tenga where
          // El patrón puede ser complejo (con lookahead negativo), verificar contexto después del match
          if (
            pattern.includes('deleteMany') ||
            pattern.includes('updateMany') ||
            pattern.includes('findMany')
          ) {
            // Buscar contexto amplio alrededor y DESPUÉS del match (hasta encontrar el cierre de paréntesis o llave)
            const contextStart = Math.max(0, matchItem.index - 100);
            const contextEnd = Math.min(content.length, matchItem.index + matchItem.text.length + 300);
            const matchContext = content.substring(contextStart, contextEnd);

            // Buscar patrones de where explícito en el contexto (puede estar antes o después del match)
            // Verificar tanto 'where:' como 'where {' en el contexto del objeto
            if (/\bwhere\s*[:=]\s*\{/.test(matchContext) || /\bwhere\s*\{/.test(matchContext)) {
              continue; // Tiene where, no es violación
            }
            
            // Para findMany/updateMany/deleteMany, también verificar si el patrón ya excluía where
            // Si el pattern tiene lookahead negativo (?!.*where), ya fue filtrado
          }

          // Agregar violación con nivel de enforcement
          violations.push({
            skillId,
            file: filePath,
            line: lineNumber,
            pattern,
            message: getViolationMessage(skillId, pattern, line, enforcement),
            enforcement,
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
 * Genera mensaje de violación específico y educativo
 */
function getViolationMessage(
  skillId: string,
  pattern: string,
  line: string,
  enforcement: 'suggest' | 'warn' | 'block'
): string {
  const emoji = enforcement === 'block' ? '🚫' : enforcement === 'warn' ? '⚠️' : '💡';
  const level = enforcement === 'block' ? 'BLOQUEADO' : enforcement === 'warn' ? 'ADVERTENCIA' : 'SUGERENCIA';

  // Detectar tipo de operación por skillId o pattern
  if (skillId.includes('database-verification') || skillId.includes('find') || skillId.includes('update') || skillId.includes('delete')) {
    if (pattern.includes('findMany')) {
      return `${emoji} [${level}] findMany() sin 'where' puede ser ineficiente. Considera agregar filtros: { where: { ... } }`;
    }
    if (pattern.includes('updateMany')) {
      const suggestion = enforcement === 'block'
        ? 'NO PERMITIDO sin where explícito'
        : 'Considera agregar { where: { ... } } para evitar actualizaciones masivas accidentales';
      return `${emoji} [${level}] updateMany() sin cláusula 'where' explícita es peligroso. ${suggestion}`;
    }
    if (pattern.includes('deleteMany')) {
      return `${emoji} [${level}] deleteMany() sin cláusula 'where' explícita es peligroso. Añade { where: { ... } }`;
    }
    if (pattern.includes('TRUNCATE') || pattern.includes('DROP')) {
      return `${emoji} [${level}] Operación destructiva detectada. Solo permitida en migraciones con plan de rollback.`;
    }
  }

  if (skillId === 'secrets-and-config') {
    return `${emoji} [${level}] Secreto hardcodeado detectado. Usa variables de entorno (process.env.KEY_NAME).`;
  }

  return `${emoji} [${level}] Pattern peligroso detectado: ${pattern}`;
}

/**
 * Verifica todos los archivos editados contra guardrails multi-nivel
 */
export async function checkGuardrails(
  editLog: EditLogEntry[],
  cwd: string
): Promise<GuardrailResult> {
  const { block, warn, suggest } = await loadGuardrailPatterns(cwd);

  // Cargar rules para obtener pathPatterns
  const { loadRules } = await import('./detectors.js');
  const rules = await loadRules(cwd);

  const allBlocking: GuardrailViolation[] = [];
  const allWarnings: GuardrailViolation[] = [];
  const allSuggestions: GuardrailViolation[] = [];

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

    // Verificar bloqueos
    for (const [skillId, patterns] of block.entries()) {
      const rule = rules[skillId];
      let shouldCheck = true;

      if (rule?.fileTriggers?.pathPatterns && rule.fileTriggers.pathPatterns.length > 0) {
        const matchesRelative = matchesPathPatterns(relativeFile, rule.fileTriggers.pathPatterns);
        const matchesAbsolute = matchesPathPatterns(filePath, rule.fileTriggers.pathPatterns);
        shouldCheck = matchesRelative || matchesAbsolute;
      }

      if (shouldCheck) {
        const violations = await checkFileAgainstPatterns(filePath, patterns, skillId, 'block');
        allBlocking.push(...violations);
      }
    }

    // Verificar warnings
    for (const [skillId, patterns] of warn.entries()) {
      const rule = rules[skillId];
      let shouldCheck = true;

      if (rule?.fileTriggers?.pathPatterns && rule.fileTriggers.pathPatterns.length > 0) {
        const matchesRelative = matchesPathPatterns(relativeFile, rule.fileTriggers.pathPatterns);
        const matchesAbsolute = matchesPathPatterns(filePath, rule.fileTriggers.pathPatterns);
        shouldCheck = matchesRelative || matchesAbsolute;
      }

      if (shouldCheck) {
        const violations = await checkFileAgainstPatterns(filePath, patterns, skillId, 'warn');
        allWarnings.push(...violations);
      }
    }

    // Verificar sugerencias
    for (const [skillId, patterns] of suggest.entries()) {
      const rule = rules[skillId];
      let shouldCheck = true;

      if (rule?.fileTriggers?.pathPatterns && rule.fileTriggers.pathPatterns.length > 0) {
        const matchesRelative = matchesPathPatterns(relativeFile, rule.fileTriggers.pathPatterns);
        const matchesAbsolute = matchesPathPatterns(filePath, rule.fileTriggers.pathPatterns);
        shouldCheck = matchesRelative || matchesAbsolute;
      }

      if (shouldCheck) {
        const violations = await checkFileAgainstPatterns(filePath, patterns, skillId, 'suggest');
        allSuggestions.push(...violations);
      }
    }
  }

  return {
    blocked: allBlocking.length > 0,
    warnings: allWarnings,
    suggestions: allSuggestions,
    violations: allBlocking, // Mantener para compatibilidad
  };
}

