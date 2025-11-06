# 🎯 PROMPT OPTIMIZADO: Mejorar Prompt Builder con Investigación Completa

**Generado**: 2025-10-29  
**Target Skills**: `plan-architect`, `backend-dev-guidelines`, `database-verification-find`  
**Score Esperado**: ≥0.9/1.0 (✅ ACTIVARÍA)  
**Heurística**: Multi-señal (keywords 20%, intent 30%, path 30%, content 20%)

---

## 📝 PROMPT PARA USAR EN CURSOR

```
plan, planificar, backend, adapter, service, API, endpoint, database, memtech, redis, postgres: Mejorar el prompt-builder v2 integrando todas las lecciones aprendidas del análisis extenso de prompts, templates y handoffs del sprint post-estudio. Refactorizar y expandir el código para incorporar patrones avanzados de promptcreate.md, Template v1.1.0 completo, sistema de handoffs estructurados, Batch Creation patterns (CAL-1.0-1), Checklist Pre-Creación (CAL-1.0-2), Ejecutor Multi-Día, Canon Immutable, y Surprise Metrics identificados en la investigación.

Abre/edita estos archivos:
- packages/skills-cli/src/utils/prompt-builder-v2.ts
- packages/skills-cli/src/commands/prompt-builder.ts
- packages/skills-cli/src/utils/prompt-builder.ts (legacy, mantener compatibilidad)
- docs/PROMPT-BUILDER-V2-MEJORAS.md (actualizar con nuevas features)

El archivo debería contener:
```
// Ejemplo: Integración de Template v1.1.0 avanzado
// Ejemplo: Sistema de handoffs estructurados
// Ejemplo: Batch Creation para múltiples prompts
// Ejemplo: Ejecutor Multi-Día con validación inter-día
```

Acciones específicas basadas en investigación:

## 1. Integrar Patrones Avanzados de promptcreate.md

[K:PROMPTCREATE-PATTERNS] [C:TEMPLATE-INTEGRATION] [U:DEVELOPER-WORKFLOW]

**Referencia**: `/Users/felipe/Developer/startkit-main/cloop-research/metacognicion/playbook-bmcc/promptcreate.md`

Integrar:
- **Personalización por Complejidad** (low/medium/high/very-high): Adaptar estructura según complejidad
  - low: Cobertura 70%, duración 6h
  - medium: Cobertura 80%, duración 8h
  - high: Cobertura 90%, duración 12h
  - very-high: Cobertura 95%, duración 16h
  
- **Validación Inmediata**: Verificación automática de componentes, conteo de markers/TAGs, validación de estructura CSE
- **Mejoras Sprint 15**: Modularización, cobertura de tests ampliada, métricas granulares, documentación de procesos

**Implementación**:
```typescript
interface ComplexityConfig {
  coverage: number;
  duration: string;
  innovation_level: 'low' | 'medium' | 'high' | 'very-high';
}

function getComplexityConfig(complexity: ComplexityConfig['innovation_level']): ComplexityConfig {
  // Mapear complejidad a configuración
}
```

## 2. Sistema de Handoffs Estructurados v2.0-PAE

[K:HANDOFF-V2-PAE] [C:TRANSFER-CONTEXT] [U:WORKFLOW-CONTINUITY]

**Referencia**: `template-handoff-v2.0-PAE.md` y `docs/SINTESIS-PATRONES-PLANES-SKILLS.md` (Patrón 7)

Agregar función para generar handoffs estructurados:
- Resumen de tareas completadas
- Archivos creados/modificados
- Métricas alcanzadas
- Próximos pasos con dependencias
- Comandos para retomar trabajo
- PAE (Pre-Audit Extract) si está disponible

**Implementación**:
```typescript
interface HandoffStructure {
  meta: { id: string; version: string; date: string; status: string };
  completedTasks: Array<{ id: string; description: string; artifacts: string[] }>;
  deliverables: { code: string[]; docs: string[]; reports: string[] };
  nextSteps: Array<{ task: string; dependency: string; objective: string }>;
  resumeCommands: string[];
  pae?: any; // PAE si está disponible
}

function generateHandoff(context: PlanContext, completed: Task[]): HandoffStructure {
  // Generar handoff estructurado
}
```

## 3. Batch Creation Pattern (CAL-1.0-1)

[K:BATCH-CREATION] [C:WORKFLOW-OPTIMIZATION] [U:EFFICIENCY-PATTERN]

**Referencia**: `docs/LECCIONES-APRENDIDAS-EJECUCION-PRACTICA.md` (+170% velocidad)

Implementar generación batch de prompts:
- Si hay ≥4 artefactos similares, usar batch creation
- Validar estructura antes de generar batch
- Mantener calidad (8/8 componentes) en cada prompt del batch

**Implementación**:
```typescript
async function generateBatchPrompts(
  baseTemplate: PromptTemplate,
  variants: Array<{ skillId: string; description: string }>,
  options: PromptBuilderOptions
): Promise<OptimizedPrompt[]> {
  // Generar múltiples prompts en batch manteniendo calidad
  // Aplicar Checklist Pre-Creación (CAL-1.0-2) antes de generar
}
```

## 4. Ejecutor Multi-Día

[K:MULTI-DAY-EXECUTOR] [C:TIMELINE-STRUCTURE] [U:PROJECT-MANAGEMENT]

**Referencia**: `PROMPT-EJECUTOR-DIAS-5-7-v1.0.0.md`

Agregar soporte para prompts que se ejecutan en múltiples días:
- Handoffs inter-día estructurados
- Validación diaria de progreso
- Context refresh al inicio de cada día
- Tracking de métricas por día

**Implementación**:
```typescript
interface MultiDayConfig {
  duration: number; // días
  dailyHandoffs: boolean;
  dailyValidation: boolean;
  contextRefresh: boolean;
}

function generateMultiDayPrompt(
  basePrompt: OptimizedPrompt,
  config: MultiDayConfig
): MultiDayPrompt {
  // Generar estructura multi-día con handoffs
}
```

## 5. Canon Immutable

[K:CANON-IMMUTABLE] [C:BASELINE-MANAGEMENT] [U:SCIENTIFIC-REPRODUCIBILITY]

**Referencia**: `PROMPT-EJECUTOR-SPRINT-R-CANON-v1.0.0.md`

Implementar generación de canon inmutable:
- Checksums de prompts generados
- Git tags para versiones
- Baseline científico para comparación
- Regression pack creation

**Implementación**:
```typescript
interface CanonMetadata {
  checksum: string;
  gitTag?: string;
  baseline: {
    score: number;
    components: number;
    tags: number;
  };
}

async function createCanon(prompt: OptimizedPrompt): Promise<CanonMetadata> {
  // Generar canon inmutable con checksums y tags
}
```

## 6. Surprise Metrics + Active Inference

[K:SURPRISE-METRICS] [C:METACOGNITIVE-CONTROL] [U:MONITORING-SYSTEM]

**Referencia**: `PROMPT-SPRINT-1.6-SURPRISE-METRICS-ACTIVE-INFERENCE-v1.0.0.md`

Agregar monitoreo de efectividad:
- μ-Surprise Module para detectar prompts inesperadamente efectivos/inefectivos
- Active Inference loop para mejorar prompts basado en resultados
- Métricas de surprise por skill activado

**Implementación**:
```typescript
interface SurpriseMetrics {
  expectedScore: number;
  actualScore: number;
  surpriseValue: number; // diferencia entre expected y actual
  skillActivated: string[];
  timestamp: Date;
}

async function trackSurpriseMetrics(
  prompt: OptimizedPrompt,
  actualActivation: SkillActivation[]
): Promise<SurpriseMetrics> {
  // Calcular surprise y ajustar futuros prompts
}
```

## 7. Mejorar Detección de Archivos Reales

[K:FILE-DETECTION] [C:PROJECT-STRUCTURE] [U:REAL-WORLD-INTEGRATION]

**Mejoras adicionales**:
- Cache de archivos detectados para performance
- Soporte para buscar en múltiples repositorios (monorepo)
- Detección inteligente de estructura del proyecto (detectar si es monorepo, estructura backend/frontend, etc.)
- Fallback mejorado con ejemplos más realistas

**Implementación**:
```typescript
interface ProjectStructure {
  type: 'monorepo' | 'standard' | 'packages' | 'unknown';
  detectedPaths: {
    backend?: string[];
    frontend?: string[];
    packages?: string[];
    config?: string[];
  };
}

async function detectProjectStructure(cwd: string): Promise<ProjectStructure> {
  // Detectar estructura y cachear resultado
}

// Cache de búsquedas anteriores
const fileCache = new Map<string, string[]>();
```

## 8. Integración PAE (Pre-Audit Extract)

[K:PAE-SYSTEM] [C:AUDIT-AUTOMATION] [U:QUALITY-GATES]

**Referencia**: `PROMPT-PAE-EXTRACTOR-v1.0.0.md`

Agregar capacidad de generar PAE automáticamente:
- Validación de estructura del prompt (schema compliance)
- Detección de documentos requeridos
- Evaluación de gates (G1-G5)
- Generación de checklist completo
- Sugerencia de nivel de auditoría

**Implementación**:
```typescript
interface PAEOutput {
  valid: boolean;
  schemaCompliant: boolean;
  documentsDetected: string[];
  gates: {
    G1: boolean; // existencia
    G2: boolean; // schema
    G3: boolean; // tests
    G4: boolean; // critical gates
    G5: boolean; // checksum
  };
  checklistScore: number;
  auditLevelSuggestion: 'basic' | 'standard' | 'comprehensive';
}

async function generatePAE(prompt: OptimizedPrompt): Promise<PAEOutput> {
  // Generar PAE para validación pre-auditoría
}
```

## 9. Validación y Testing Mejorados

[K:TESTING-FRAMEWORK] [C:QUALITY-ASSURANCE] [U:VALIDATION-WORKFLOW]

Implementar:
- Tests ejecutables para validar prompts generados
- Validación de estructura CSE completa
- Verificación de TAGs coverage ≥60%
- Validación de Template v1.1.0 (8/8 componentes)
- Scripts bash para validación automática

**Implementación**:
```typescript
interface PromptValidation {
  cseComplete: boolean;
  tagsCoverage: number; // 0-1
  templateComponents: number; // 0-8
  score: number; // 0-1
  errors: string[];
  warnings: string[];
}

async function validatePrompt(prompt: OptimizedPrompt): Promise<PromptValidation> {
  // Validar prompt completo
}
```

## 10. Documentación y Ejemplos

[K:DOCUMENTATION-STANDARDS] [C:KNOWLEDGE-TRANSFER] [U:DEVELOPER-EXPERIENCE]

Crear:
- Ejemplos completos de uso para cada feature nueva
- Documentación de integración con planes
- Guía de migración desde v1 a v2
- Casos de uso reales del análisis extenso

**Archivos a crear/actualizar**:
- `docs/PROMPT-BUILDER-V2-MEJORAS.md` (actualizar)
- `docs/PROMPT-BUILDER-EJEMPLOS.md` (nuevo)
- `docs/PROMPT-BUILDER-PATRONES.md` (nuevo)

## Objetivos SMART del Mejoramiento

- **O1**: Integrar 10+ patrones avanzados del análisis (p95 completion <30min)
- **O2**: Validación automática de prompts (≥95% precisión, <2s latency)
- **O3**: Batch Creation para 4+ prompts simultáneos (mantener calidad 8/8)
- **O4**: Handoffs estructurados generados automáticamente (100% structure compliance)
- **O5**: TAGs coverage ≥60% en todos los prompts generados (target: 80%)
- **O6**: Integración PAE con gates G1-G5 (≥7/8 checklist score)
- **O7**: Ejecutor Multi-Día para prompts >1 día (handoffs inter-día automáticos)
- **O8**: Surprise Metrics tracking (detectar 90% de prompts inesperados)

## Tests Ejecutables de Validación

```bash
# Test 1: Validar estructura Template v1.1.0
node -e "const pb = require('./dist/utils/prompt-builder-v2.js'); pb.validateTemplate(prompt)" 
# PASS: 8/8 componentes presentes

# Test 2: Validar TAGs coverage
node -e "const pb = require('./dist/utils/prompt-builder-v2.js'); console.log(pb.calculateTagsCoverage(prompt))"
# PASS: coverage ≥60%

# Test 3: Validar detección de archivos reales
node -e "const pb = require('./dist/utils/prompt-builder-v2.js'); pb.findRealFiles(['**/memtech/**'], '.')"
# PASS: encuentra archivos reales del proyecto

# Test 4: Validar Batch Creation
node -e "const pb = require('./dist/utils/prompt-builder-v2.js'); pb.generateBatch([...variants])"
# PASS: genera 4+ prompts con calidad 8/8 cada uno

# Test 5: Validar PAE generation
./scripts/validate-pae-template.sh pae_output.json
# PASS: G1-G5 todos true, checklist ≥7/8
```

## Referencias Críticas (Leer ANTES de ejecutar)

1. **promptcreate.md** (`/Users/felipe/Developer/startkit-main/cloop-research/metacognicion/playbook-bmcc/promptcreate.md`)
   - Componentes automáticos (C1-C8)
   - Personalización por complejidad
   - Validación inmediata

2. **SINTESIS-PATRONES-PLANES-SKILLS.md** (`docs/SINTESIS-PATRONES-PLANES-SKILLS.md`)
   - 8 patrones identificados (CLOOP, Ejecutores, TAGs, Tests, Métricas, Frontmatter, Handoff, Context Refresh)

3. **LECCIONES-APRENDIDAS-EJECUCION-PRACTICA.md** (`docs/LECCIONES-APRENDIDAS-EJECUCION-PRACTICA.md`)
   - Batch Creation (+170% velocidad)
   - Checklist Pre-Creación (-20-30% QA time)
   - TAGs ≥60% crítico

4. **template-handoff-v2.0-PAE.md** (en startkit-main)
   - Estructura completa de handoff
   - PAE como gate obligatorio

5. **PROMPT-PAE-EXTRACTOR-v1.0.0.md** (en startkit-main)
   - Gates G1-G5
   - Checklist de validación

## Patrones Clave a Implementar

- ✅ **Template v1.1.0**: 8/8 componentes obligatorios
- ✅ **TAGs Coverage ≥60%**: Sistema completo de tags [K]/[C]/[U]/[EVIDENCIA]/[PROPUESTA]
- ✅ **Batch Creation**: Para ≥4 artefactos similares (CAL-1.0-1)
- ✅ **Checklist Pre-Creación**: Validar 8/8 componentes antes de considerar completo (CAL-1.0-2)
- ✅ **Handoff v2.0-PAE**: Estructura completa con comandos retomar
- ✅ **Ejecutor Multi-Día**: Handoffs inter-día + validación diaria
- ✅ **Canon Immutable**: Checksums + git tags + baseline científico
- ✅ **Surprise Metrics**: Detectar efectividad inesperada y ajustar
- ✅ **PAE Integration**: Gates G1-G5 + checklist ≥7/8
- ✅ **Validación Automática**: Tests ejecutables + scripts bash

## Métricas Esperadas Post-Mejora

- **Score promedio prompts**: 0.7-0.8 → 0.9-0.95
- **TAGs coverage**: 40-50% → ≥80%
- **Archivos reales detectados**: 70-90% → ≥95%
- **Tiempo generación batch**: 100% → 30-40% (batch creation)
- **Precisión validación**: 80% → ≥95%
- **Efectividad prompts**: Baseline → +50% (con surprise metrics)

## Anti-Drift Mechanisms

1. **Chain-of-Verification**: Validar cada componente antes de continuar
2. **Boundary Markers**: Limitar scope a prompt-builder, no otros sistemas
3. **Evidence vs Proposal**: Separar claramente lo implementado vs propuesto
4. **Context Refresh**: Re-anclar objetivos en cada fase del mejoramiento
5. **Automatic ADR**: Registrar decisiones arquitectónicas importantes

## Separación [EVIDENCIA] vs [PROPUESTA]

### [EVIDENCIA] Estado Actual Validado
- ✅ Prompt Builder v2 implementado con 7 mejoras básicas
- ✅ Detección de archivos reales funciona (70-90% precisión)
- ✅ Template v1.1.0 integrado (8/8 componentes)
- ✅ Sistema de TAGs implementado (coverage variable)
- ✅ Plan context integration funciona
- ✅ 27 patrones identificados del análisis extenso
- ✅ Documentación completa del análisis disponible

### [PROPUESTA] Mejoras a Implementar
- ⏳ Integración completa de 10+ patrones avanzados
- ⏳ Batch Creation para múltiples prompts
- ⏳ Ejecutor Multi-Día con handoffs automáticos
- ⏳ Canon Immutable con checksums y git tags
- ⏳ Surprise Metrics + Active Inference
- ⏳ PAE Integration con gates G1-G5
- ⏳ Validación automática mejorada (95% precisión)
- ⏳ Detección de estructura de proyecto inteligente
- ⏳ Cache de archivos para performance
- ⏳ Documentación con ejemplos reales

---

**Nota**: Este prompt está optimizado para activar los skills `plan-architect`, `backend-dev-guidelines`, y `database-verification-find` con score esperado ≥0.9/1.0. Usa palabras clave, intent patterns, sugiere archivos reales, y estructura basada en Template v1.1.0 con TAGs coverage ≥60%.

