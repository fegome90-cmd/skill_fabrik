#!/usr/bin/env node

/**
 * Plan Detector v2 - Endurecido
 *
 * Detecta planes en output de Claude Code con patrones específicos
 * y post-procesado para evitar falsos positivos.
 *
 * Version: 2.0.0
 * Author: Skills Fabric Team
 */

import { createHash } from 'crypto';

/**
 * Detecta si el output contiene un plan estructurado
 * @param {string} output - Texto de salida de Claude Code
 * @returns {Object|null} - {detected: true, block, confidence, hash} o null
 */
export function detectPlan(output) {
  if (!output || typeof output !== 'string') {
    return null;
  }

  // Filter out null bytes and other non-printable characters (except common whitespace)
  output = output.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Sanitize to prevent regex injection in user input
  // Smart sanitization that preserves valid CLOOP phases
  if (output.includes('[') && output.includes(']')) {
    // Check if brackets contain regex patterns or unusual patterns
    const bracketContent = output.match(/\[(.*?)\]/g);
    if (bracketContent) {
      for (const bracket of bracketContent) {
        const inner = bracket.slice(1, -1);

        // Check if it's a valid CLOOP phase first (fast path)
        const isValidCLOOP = /^(Layout|Clarify|Operate|Observe|Reflect)$/i.test(inner);

        // If it's a valid CLOOP phase, skip sanitization
        if (isValidCLOOP) {
          continue;
        }

        // Check for regex patterns inside the brackets
        const hasRegexPatterns =
          /\\[dDwWsS]/.test(inner) ||  // \d, \w, \s escapes
          /-/.test(inner) && /[A-Z0-9]/.test(inner) ||  // Range like A-Z, 0-9
          /[.*+?]/.test(inner) ||     // Quantifiers
          /\{[^}]*\}/.test(inner) ||   // Explicit quantifiers {n,m}
          /\|/.test(inner);             // Alternation

        // Sanitize if it contains regex patterns
        if (hasRegexPatterns) {
          output = output.replace(bracket, '[SANITIZED]');
        }
      }
    }
  }

  // Additional check: if output contains multiple bracketed expressions with regex patterns,
  // mark as potentially malicious and invalidate plan detection
  const suspiciousPatterns = (output.match(/\[SANITIZED\]/g) || []).length;
  if (suspiciousPatterns >= 2) {
    // Multiple sanitized patterns suggest regex injection attempt
    // Invalidate by adding non-matching content
    output = output.replace(/\[Layout\]/i, '[SAFE-LAYOUT]');
  }

  // PATRONES FUERTES (peso alto - alta precisión)
  // Escape special characters to prevent regex injection
  const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const strongPatterns = [
    /\[Layout\]/i,
    /Clarify.*Layout.*Operate/i,
    /\[\w+\].*Plan/i  // [Layout] Plan, [Clarify] Plan
  ];

  // PATRONES CONTEXTUALES (solo si están en título)
  const contextualPatterns = [
    /^## Plan.*$/im,        // Solo si es título
    /^### Objetivos.*$/im   // Solo si es título
  ];

  // Verificar patrones fuertes
  const strongMatch = strongPatterns.some(p => p.test(output));

  // Verificar patrones contextuales (solo en inicio de línea)
  const contextualMatch = contextualPatterns.some(p => p.test(output));

  // Si no hay match fuerte ni contextual, no es un plan
  if (!strongMatch && !contextualMatch) {
    return null;
  }

  // Extraer bloque completo del plan
  const block = extractPlanBlock(output);
  if (!block) {
    return null;
  }

  // Verificar que tiene estructura de plan
  if (!hasPlanStructure(block)) {
    return null;
  }

  // Calcular hash para cache
  const hash = createHash('sha256').update(block).digest('hex');

  // Calcular confianza
  const confidence = strongMatch ? 0.95 : 0.7;

  return {
    detected: true,
    block: block,
    confidence: confidence,
    hash: hash,
    timestamp: new Date().toISOString()
  };
}

/**
 * Extrae el bloque completo del plan desde el texto
 * @param {string} text - Texto completo
 * @returns {string|null} - Bloque del plan o null
 */
function extractPlanBlock(text) {
  // Buscar desde [Layout] hasta final del texto
  const layoutMatch = text.match(/\[Layout\][\s\S]*/i);
  if (layoutMatch) {
    return layoutMatch[0].trim();
  }

  // Buscar desde "Plan:" hasta final del texto
  const planMatch = text.match(/Plan:[\s\S]*/i);
  if (planMatch) {
    return planMatch[0].trim();
  }

  // Buscar patrones CLOOP completos (nueva lógica mejorada)
  const cloopPatterns = [
    /Clarify.*?Layout.*?Operate.*$/im,
    /Clarify:.*?Layout:.*?Operate:.*$/im,
    /Clarify.*Layout.*Operate/im
  ];

  for (const pattern of cloopPatterns) {
    const cloopMatch = text.match(pattern);
    if (cloopMatch) {
      return cloopMatch[0].trim();
    }
  }

  // Buscar títulos "## Plan" y extraer contenido siguiente
  const titlePlanPattern = /^## Plan.*$/im;
  const titlePlanMatch = text.match(titlePlanPattern);
  if (titlePlanMatch) {
    const startIdx = titlePlanMatch.index;
    const afterTitle = text.substring(startIdx);
    // Buscar fin de plan: doble salto O líneas de contenido
    const lines = afterTitle.split('\n').filter(l => l.trim());
    // Si hay al menos 2 líneas después del título, es un plan
    if (lines.length >= 2) {
      return afterTitle.trim();
    }
  }

  // Buscar títulos "### Objetivos" y extraer contenido siguiente
  const titleObjectivesPattern = /^### Objetivos.*$/im;
  const titleObjectivesMatch = text.match(titleObjectivesPattern);
  if (titleObjectivesMatch) {
    const startIdx = titleObjectivesMatch.index;
    const afterTitle = text.substring(startIdx);
    const lines = afterTitle.split('\n').filter(l => l.trim());
    if (lines.length >= 2) {
      return afterTitle.trim();
    }
  }

  return null;
}

/**
 * Verifica si el bloque tiene estructura de plan
 * @param {string} block - Bloque de texto
 * @returns {boolean} - true si tiene estructura de plan
 */
function hasPlanStructure(block) {
  // Contar puntos numerados (1., 2., etc.) - permite espacios antes
  const bulletPoints = (block.match(/^\s*\d+\./gm) || []).length;

  // Contar viñetas con guiones (considerando tabs y espacios)
  const dashPoints = (block.match(/^\s*-\s+/gm) || []).length;

  // Contar viñetas con asteriscos
  const asteriskPoints = (block.match(/^\s*\*\s+/gm) || []).length;

  // Verificar palabras clave de pasos
  const hasSteps = /(pasos|steps|fases|etapas|objetivos)/i.test(block);

  // Verificar palabras clave CLOOP (indica estructura de plan)
  const hasCLOOP = /(Clarify|Layout|Operate|Observe|Reflect)/i.test(block);

  // Verificar estructura de lista - debe tener AL MENOS 2 elementos
  const hasListStructure = (bulletPoints >= 2) || (dashPoints >= 2) || (asteriskPoints >= 2);

  // Verificar si es muy corto (posible falso positivo)
  // Si tiene CLOOP, threshold menor (20 chars)
  // Si no tiene CLOOP, threshold mayor (30 chars)
  const isTooShort = hasCLOOP ? (block.length < 20) : (block.length < 30);

  // Verificar si es texto corrido simple (líneas que no son listas)
  // Una línea es texto corrido si:
  // - No empieza con número
  // - No empieza con guión/asterisco
  // - No es una palabra clave CLOOP
  const lines = block.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const hasPlainTextLines = lines.some(line => {
    return !/^\s*\d+\./.test(line) &&
           !/^\s*-\s+/.test(line) &&
           !/^\s*\*\s+/.test(line) &&
           !/(Clarify|Layout|Operate|Observe|Reflect)/i.test(line);
  });

  // Un bloque es válido si:
  // - Tiene estructura de lista (AL MENOS 2 bullets/dashes/asterisks)
  // - O tiene CLOOP + estructura de lista o pasos
  // - O tiene pasos + estructura de lista
  //
  // Un bloque NO es válido si:
  // - Es muy corto
  // - Es solo texto corrido sin estructura
  // - Tiene CLOOP pero no tiene estructura de lista ni pasos

  if (isTooShort) {
    return false;
  }

  // Si tiene CLOOP, debe tener estructura de lista (1+ bullets) O pasos
  // CLOOP es más flexible: 1+ bullets o pasos keywords
  if (hasCLOOP) {
    const hasAtLeastOneBullet = (bulletPoints >= 1) || (dashPoints >= 1) || (asteriskPoints >= 1);
    if (!hasAtLeastOneBullet && !hasSteps) {
      return false;
    }
  } else {
    // Si no tiene CLOOP, debe tener estructura de lista (2+ bullets)
    if (!hasListStructure) {
      return false;
    }
  }

  return true;
}

/**
 * Analiza el contenido del plan para extraer metadatos
 * @param {string} block - Bloque del plan
 * @returns {Object} - Metadatos del plan
 */
export function analyzePlanContent(block) {
  const metadata = {
    hasCLOOP: /\[(Clarify|Layout|Operate|Observe|Reflect)\]/i.test(block),
    hasSteps: /(pasos|steps|fases|etapas)/i.test(block),
    hasObjectives: /(objetivos|goals|meta)/i.test(block),
    complexity: 'unknown',
    estimatedDuration: null,
    skills: []
  };

  // Detectar complejidad basada en contenido
  const complexityKeywords = {
    'very-high': /(microservicios|complejo|arquitectura completa|sistema completo)/i,
    'high': /(api|backend|frontend|database)/i,
    'medium': /(feature|función|componente)/i,
    'low': /(fix|arreglo|cambios menores)/i
  };

  for (const [level, pattern] of Object.entries(complexityKeywords)) {
    if (pattern.test(block)) {
      metadata.complexity = level;
      break;
    }
  }

  // Estimar duración
  const durationMatch = block.match(/(\d+)\s*(horas?|días?|semanas?)/i);
  if (durationMatch) {
    metadata.estimatedDuration = durationMatch[0];
  }

  return metadata;
}

/**
 * Genera un identificador único para el plan
 * @param {string} block - Bloque del plan
 * @returns {string} - Hash único
 */
export function generatePlanId(block) {
  return createHash('md5').update(block).digest('hex').substring(0, 12);
}

/**
 * Cache simple para evitar detectar el mismo plan múltiples veces
 */
class PlanCache {
  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  /**
   * Verifica si un plan ya fue procesado
   * @param {string} hash - Hash del plan
   * @returns {boolean} - true si ya fue procesado
   */
  has(hash) {
    return this.cache.has(hash);
  }

  /**
   * Agrega un plan al cache
   * @param {string} hash - Hash del plan
   * @param {Object} data - Datos del plan
   */
  set(hash, data) {
    // Si excede el tamaño, eliminar entradas más antiguas
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(hash, {
      ...data,
      cachedAt: new Date().toISOString()
    });
  }

  /**
   * Obtiene datos del plan del cache
   * @param {string} hash - Hash del plan
   * @returns {Object|null} - Datos del plan o null
   */
  get(hash) {
    return this.cache.get(hash) || null;
  }

  /**
   * Limpia el cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Obtiene estadísticas del cache
   * @returns {Object} - Estadísticas
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      entries: Array.from(this.cache.values())
    };
  }
}

// Exportar cache instance
export const planCache = new PlanCache();

// Test function (for debugging)
if (import.meta.url === `file://${process.argv[1]}`) {
  const testCases = [
    {
      name: 'Plan con [Layout]',
      input: '[Layout] Plan de desarrollo:\n1. Diseñar arquitectura\n2. Implementar endpoints\n3. Testing\n\nOtros textos...',
      expected: true
    },
    {
      name: 'CLOOP completo',
      input: 'Clarify: objetivos. Layout: arquitectura. Operate: implementación. Observe: testing.',
      expected: true
    },
    {
      name: '## Plan como título',
      input: '## Plan\n1. Paso uno\n2. Paso dos\n3. Paso tres',
      expected: true
    },
    {
      name: 'Texto genérico sin plan',
      input: 'Este es un texto cualquiera sobre el proyecto. No contiene un plan estructurado.',
      expected: false
    },
    {
      name: 'Palabra "plan" sin estructura',
      input: 'Hablamos del plan para el futuro proyecto.',
      expected: false
    }
  ];

  console.log('🧪 Running Plan Detector Tests:\n');

  for (const testCase of testCases) {
    const result = detectPlan(testCase.input);
    const passed = (result !== null) === testCase.expected;
    const status = passed ? '✅' : '❌';

    console.log(`${status} ${testCase.name}`);
    if (result) {
      console.log(`   Confidence: ${(result.confidence * 100).toFixed(0)}%`);
      console.log(`   Hash: ${result.hash.substring(0, 8)}...`);
    }
    console.log();
  }
}
