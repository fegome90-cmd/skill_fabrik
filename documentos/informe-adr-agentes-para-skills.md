# Informe: Uso de Agentes ADR para la Creación de Skills vía ADR

## Fecha de Análisis

2025-01-27

## Resumen Ejecutivo

Este informe analiza cómo los **Architecture Decision Records (ADRs)** pueden ser utilizados sistemáticamente como fuente de conocimiento para generar **Skills** mediante un pipeline automatizado de agentes especializados. El enfoque propone extraer patrones, reglas, checklists y mejores prácticas de ADRs existentes para materializarlos en Skills operativos que guían el comportamiento de agentes de desarrollo.

### Principales Hallazgos

1. **ADRs como Fuente de Conocimiento Estructurado**: Los ADRs documentan decisiones arquitectónicas, patrones y anti-patrones que pueden ser extraídos y transformados en Skills.

2. **Pipeline Automatizado ADR → Skill**: Se propone un flujo de 5 etapas con agentes especializados (ADR-Miner, Curator, Builder, Evaluator, ADR-Writer).

3. **Clasificación de Skills por Tipo**: Los patrones extraídos de ADRs se clasifican en 5 categorías: guideline, guardrail, workflow, analyst, generator.

4. **Evidencia y Medición**: Cada Skill generado debe incluir KPIs y un ADR de adopción que valide su efectividad.

---

## 1. Contexto: ADRs y Skills

### 1.1 ¿Qué son los ADRs?

**Architecture Decision Records (ADRs)** son documentos que capturan decisiones arquitectónicas importantes en un proyecto. Siguiendo el formato estándar, un ADR incluye:

- **Status**: Implementado/Propuesto/Obsoleto
- **Fecha**: Cuando se tomó la decisión
- **Contexto**: La situación que motivó la decisión
- **Decisión**: La solución elegida
- **Consecuencias**: Impactos positivos y negativos
- **Implementación**: Pasos concretos
- **Alternativas Consideradas**: Otras opciones evaluadas

### 1.2 Estructura de ADRs en el Proyecto

Basado en los ADRs existentes en `memtech/docs/adrs/`, observamos el siguiente formato:

```markdown
# ADR-XXX: Título Descriptivo

**Fecha:** YYYY-MM-DD
**Estado:** Aceptado/Implementado
**Decisión:** Resumen de la decisión tomada
**Contexto:** Situación que motivó la decisión

## Contexto

[Descripción detallada de la situación]

## Decisión

[La decisión arquitectónica tomada]

## Consecuencias

### Positivas

- ✅ Beneficio 1
- ✅ Beneficio 2

### Negativas

- ⚠️ Limitación 1
- ⚠️ Limitación 2

## Implementación

[Pasos concretos y código de ejemplo]

## Validación

[Lista de criterios de validación]
```

### 1.3 ¿Qué son los Skills?

**Skills** son carpetas de instrucciones, scripts y recursos que los agentes cargan dinámicamente para mejorar su desempeño en tareas específicas. Cada Skill requiere:

- **SKILL.md**: Archivo principal con frontmatter YAML y cuerpo Markdown
- **Frontmatter obligatorio**: `name` (slug), `description` (orientada a acción)
- **Frontmatter opcional**: `license`, `allowed-tools`, `metadata`
- **Estructura opcional**: `resources/`, `scripts/`, `tests/`

### 1.4 Relación entre ADRs y Skills

Los ADRs contienen conocimiento que puede transformarse en Skills:

| Elemento ADR       | Transformación a Skill            |
| ------------------ | --------------------------------- |
| **Contexto**       | Sección "Cuándo usar / NO usar"   |
| **Decisión**       | Procedimiento mínimo y guidelines |
| **Consecuencias**  | Ejemplos ✅/❌ y advertencias     |
| **Implementación** | Scripts reales y recursos         |
| **Validación**     | Checklist (Definition of Done)    |

---

## 2. Pipeline ADR → Skill: Arquitectura de Agentes

### 2.1 Visión General del Pipeline

El pipeline propuesto consiste en 5 etapas con agentes especializados:

```
ADRs (docs/adr/*.md)
    ↓
[1] ADR-Miner → Extrae patrones, reglas, DoD, anti-patrones
    ↓
skill-candidates.json (candidatos crudos)
    ↓
[2] Curator → Clasifica, deduplica, propone descripciones
    ↓
curated-candidates.json (candidatos validados)
    ↓
[3] Builder → Materializa SKILL.md + resources + scripts
    ↓
skills/<domain>/<skill-id>/ (estructura completa)
    ↓
[4] Evaluator → Ejecuta escenarios, mide KPIs
    ↓
evaluation-report.json (métricas de efectividad)
    ↓
[5] ADR-Writer → Genera ADR de adopción con evidencia
    ↓
docs/adr/ADR-XXX-adoption-<skill-id>.md
```

### 2.2 Agente 1: ADR-Miner

**Propósito**: Extraer conocimiento estructurado de ADRs existentes.

#### Entrada

- ADRs en formato Markdown (`docs/adr/*.md` o `memtech/docs/adrs/*.md`)
- Repositorios adicionales si se realiza minado multi-repo

#### Proceso de Extracción

El ADR-Miner busca y extrae:

1. **Reglas Explícitas**: Patrones como "Siempre hacer X antes de Y", "No permitir Z sin W"
2. **Checklists (Definition of Done)**: Secciones que definen criterios de validación
3. **Anti-patrones**: Secciones que documentan qué evitar y por qué
4. **Patrones de Implementación**: Código, scripts, comandos reales
5. **Métricas de Éxito**: KPIs mencionados o implícitos
6. **Procedimientos**: Pasos secuenciales documentados

#### Salida

`skill-candidates.json` con estructura:

```json
{
  "candidates": [
    {
      "id": "candidate-001",
      "source_adr": "ADR-001",
      "domain": "memory",
      "type": "guideline",
      "extracted_patterns": {
        "rules": ["Siempre verificar health() antes de escribir", ...],
        "checklists": ["[ ] Verificar L1, L2, L3 antes de continuar", ...],
        "anti_patterns": ["Evitar escritura directa a L3 sin validación", ...],
        "procedures": ["1. Check health, 2. Validate data, 3. Write", ...],
        "scripts": ["memtech-maintenance.mjs", "metrics-exporter.mjs"],
        "metrics": ["memory_usage", "backup_status"]
      },
      "triggers": {
        "keywords": ["memory", "memtech", "backup"],
        "path_patterns": ["memtech/**/*"],
        "content_patterns": ["MemoryAdapter", "health\\(\\)"]
      },
      "confidence": 0.85
    }
  ]
}
```

#### Ejemplo de Extracción

Desde `ADR-AGENT-001-SOVEREIGNTY.md`:

- **Regla extraída**: "MemTech Agent debe proteger todos los sistemas de memoria en `core/`"
- **Checklist extraída**: Validación con 5 criterios ([x] proteger sistemas, [x] organizar archivos, etc.)
- **Trigger sugerido**: keywords=["memtech", "memory", "memory system"], path_patterns=["memtech/**/*", "core/memory/**/*"]

### 2.3 Agente 2: Curator

**Propósito**: Clasificar, deduplicar y validar candidatos antes de materialización.

#### Proceso de Curación

1. **Clasificación por Tipo**:
   - **guideline**: Mejores prácticas y patrones de código (ej: frontend-dev-guidelines)
   - **guardrail**: Prevención de errores y seguridad (ej: database-verification)
   - **workflow**: Procesos secuenciales (ej: plan-architect, testing-plan-designer)
   - **analyst**: Análisis y auditoría (ej: repo-auditor, pr-reviewer)
   - **generator**: Generación de código/artefactos (ej: test-scaffolder)

2. **Deduplicación**:
   - Detectar candidatos similares (similaridad semántica > 0.8)
   - Consolidar en un solo skill o agrupar en variantes
   - Mantener referencias cruzadas

3. **Generación de Descripción**:
   - Validar contra heurísticas: orientada a acción, clara sobre cuándo usar/NO usar
   - Proponer `description` única y optimizada para activación
   - Asegurar cumplimiento de límite de 500 caracteres recomendado

#### Salida

`curated-candidates.json`:

```json
{
  "curated": [
    {
      "id": "memtech-memory-protector",
      "type": "guardrail",
      "enforcement": "require",
      "description": "Protege y organiza sistemas de memoria L1-L4. Activar cuando: trabajando con archivos en core/memory, modificando adaptadores de memoria, ejecutando operaciones de backup. NO usar para: gestión de archivos fuera del dominio de memoria.",
      "source_adrs": ["ADR-AGENT-001"],
      "triggers": {
        "keywords": ["memtech", "memory", "L1", "L2", "L3", "L4"],
        "path_patterns": ["memtech/**/*", "core/memory/**/*"],
        "content_patterns": ["MemoryAdapter", "health\\(\\)", "checkpoint"]
      },
      "priority": "high",
      "validation_score": 0.92
    }
  ]
}
```

### 2.4 Agente 3: Builder

**Propósito**: Materializar candidatos curados en Skills operativos.

#### Proceso de Construcción

1. **Crear Estructura de Directorios**:

```
skills/<domain>/<skill-id>/
  ├─ SKILL.md
  ├─ resources/
  │  ├─ reference.md (contexto detallado)
  │  ├─ examples.md (ejemplos avanzados)
  │  └─ checklist.md (DoD extendido)
  ├─ scripts/
  │  └─ validate.sh (si aplica)
  └─ tests/
      └─ smoke-test.md (escenarios de prueba)
```

2. **Generar SKILL.md**:
   - Usar `configs/SKILL.template.md` como base
   - Populate frontmatter desde candidato curado
   - Transformar reglas → Procedimiento Mínimo
   - Transformar checklists → Checklist (DoD)
   - Transformar anti-patrones → Ejemplos ❌
   - Transformar procedimientos → Scripts Reales

3. **Generar Recursos**:
   - `resources/reference.md`: Contexto completo del ADR original
   - `resources/examples.md`: Ejemplos de código extraídos
   - `resources/checklist.md`: DoD extendido con criterios adicionales

4. **Validación**:
   - Validar contra schema `configs/skill-rules.schema.json`
   - Verificar que scripts referenciados existen
   - Asegurar que `description` cumple criterios de calidad

#### Ejemplo de SKILL.md Generado

````markdown
---
name: memtech-memory-protector
description: Protege y organiza sistemas de memoria L1-L4. Activar cuando: trabajando con archivos en core/memory, modificando adaptadores de memoria, ejecutando operaciones de backup. NO usar para: gestión de archivos fuera del dominio de memoria.
type: guardrail
enforcement: require
version: 0.1.0
---

# Skill: MemTech Memory Protector

## Objetivo

**Cuándo usar este skill**:

- Trabajando con archivos en `core/memory/` o `memtech/`
- Modificando adaptadores de memoria (MemoryAdapter)
- Ejecutando operaciones de backup o checkpoints
- Reestructurando el sistema de memoria híbrido

**Cuándo NO usar este skill**:

- Gestión de archivos fuera del dominio de memoria
- Trabajando exclusivamente en frontend
- Operaciones en bases de datos no relacionadas con memoria

**Qué problema resuelve**:
Garantiza que el sistema de memoria híbrido L1→L2→L3→L4 mantenga integridad, protección y organización correcta.

## Procedimiento Mínimo

1. **Verificar Health**: Antes de cualquier operación, ejecutar `MemoryAdapter.health()`
2. **Validar Estructura**: Confirmar que los sistemas protegidos están organizados correctamente
3. **Aplicar Principios de Soberanía**: Protección total, organización clara, decisión inteligente de almacenamiento
4. **Verificar Integridad**: Asegurar que no se compromete la integridad del sistema híbrido

## Checklist (Definition of Done)

Antes de considerar completa una tarea que usa este skill, verifica:

- [ ] Todos los sistemas de memoria en `core/` están protegidos
- [ ] Archivos relacionados con MemTech están organizados en `core/memtech-agent/`
- [ ] Decisiones de almacenamiento respetan arquitectura L1→L2→L3→L4
- [ ] Health checks pasan antes y después de cambios
- [ ] Soberanía total establecida

## Scripts Reales

Este skill utiliza scripts ejecutables reales del proyecto:

- `memtech/cli/memtech_cli.mjs` - CLI para operaciones de memoria
- `memtech/maintenance/memtech-maintenance.mjs` - Tareas de mantenimiento
- `memtech/agent/health/health-checker.js` - Verificación de salud

**Importante**: Estos scripts existen realmente en el repositorio.

## Ejemplos Mínimos

### ✅ Correcto

```javascript
// Verificar health antes de operación
const health = await memoryAdapter.health();
if (!health.ok) {
  throw new Error('Memory system unhealthy');
}

// Proteger sistema antes de modificar
await protectMemorySystem();
// Realizar operación
await memoryAdapter.checkpoint(data);
```
````

### ❌ Incorrecto

```javascript
// Violación: Escribir directamente sin verificar health
await memoryAdapter.checkpoint(data); // ❌ Sin verificación previa

// Violación: Modificar sin proteger sistema
await fs.writeFile('core/memory/file.json', data); // ❌ Sin protección
```

## Recursos Adicionales

Para más detalles, consulta estos recursos (se cargan on-demand):

- `./resources/reference.md` - Contexto completo del ADR original
- `./resources/examples.md` - Ejemplos avanzados de protección
- `./resources/checklist.md` - Checklist extendido con 10+ criterios

---

**Fuente ADR**: ADR-AGENT-001 (Soberanía del Sistema de Memoria)

````

### 2.5 Agente 4: Evaluator

**Propósito**: Validar efectividad del skill mediante escenarios reales y métricas.

#### Proceso de Evaluación

1. **Escenarios de Prueba**:
   - Identificar 2-3 escenarios reales donde el skill debería activarse
   - Ejecutar cada escenario con y sin skill activo
   - Medir diferencias en calidad, velocidad, errores

2. **Métricas a Capturar**:
   - **skill_activation_precision**: Skills activados correctamente / Total activados
   - **skill_activation_recall**: Activaciones correctas / Total activaciones esperadas
   - **skill_adherence_rate**: Código que sigue guidelines / Total código generado
   - **zero_errors_left_behind**: Porcentaje de ejecuciones sin errores residuales
   - **mean_fix_latency**: Tiempo promedio para resolver errores detectados
   - **tokens_per_operation**: Tokens consumidos por operación

3. **Análisis de Resultados**:
   - Comparar métricas antes/después
   - Identificar casos donde el skill falla
   - Calcular score de efectividad (0-10)

#### Salida
`evaluation-report.json`:

```json
{
  "skill_id": "memtech-memory-protector",
  "evaluation_date": "2025-01-27",
  "scenarios": [
    {
      "id": "scenario-001",
      "description": "Modificar MemoryAdapter sin verificar health",
      "with_skill": {
        "activated": true,
        "adherence": 1.0,
        "errors_caught": 1,
        "tokens": 450
      },
      "without_skill": {
        "activated": false,
        "adherence": 0.0,
        "errors_caught": 0,
        "tokens": 380
      },
      "improvement": {
        "adherence": "+100%",
        "errors_prevented": 1,
        "token_overhead": "+18%"
      }
    }
  ],
  "overall_metrics": {
    "activation_precision": 0.95,
    "activation_recall": 0.90,
    "adherence_rate": 0.92,
    "zero_errors_ratio": 0.98,
    "effectiveness_score": 8.7
  },
  "recommendation": "APPROVE"
}
````

### 2.6 Agente 5: ADR-Writer

**Propósito**: Generar ADR de adopción del skill con evidencia de efectividad.

#### Proceso de Generación

1. **Estructura del ADR de Adopción**:
   - **Contexto**: Necesidad del skill, problema que resuelve
   - **Decisión**: Adoptar skill `X` versión `Y` con enforcement `Z`
   - **Evidencia**: KPIs de evaluación, mejora medible
   - **DoD**: Criterios para considerar adopción exitosa
   - **Consecuencias**: Impacto esperado en desarrollo

2. **Incluir Evidencia**:
   - Métricas de evaluación (activation precision, adherence rate, etc.)
   - Comparación antes/después
   - Casos de uso exitosos
   - Referencias a código/PRs donde se aplicó

3. **Versionado**:
   - Si evaluación es exitosa (score ≥ 7.0), versionar skill como `v1.0.0`
   - Si necesita mejoras, mantener como `v0.x.0` hasta próxima evaluación

#### Ejemplo de ADR de Adopción

```markdown
# ADR-XXX: Adopción del Skill memtech-memory-protector

**Fecha:** 2025-01-27
**Estado:** Aceptado
**Decisión:** Adoptar skill `memtech-memory-protector` v1.0.0 con enforcement `require` para protección del sistema de memoria
**Contexto:** Necesidad de prevenir errores en operaciones de memoria y asegurar integridad del sistema híbrido L1-L4

## Contexto

Durante el desarrollo, se observaron múltiples casos donde:

- Se modificaban adaptadores de memoria sin verificar health primero
- Se escribían datos sin validar estructura
- Se comprometía la integridad del sistema híbrido

El ADR-AGENT-001 estableció principios de soberanía, pero no había una forma sistemática de aplicarlos en código.

## Decisión

Adoptar el skill `memtech-memory-protector` v1.0.0 con:

- **Enforcement**: `require` (bloquea operaciones sin seguir guidelines)
- **Activación automática**: Cuando se detectan keywords "memtech", "memory", "L1-L4" o archivos en `memtech/**/*`
- **Integración**: Router habilita skill antes de permitir ediciones en dominio de memoria

## Evidencia

### Métricas de Evaluación

- **skill_activation_precision**: 95% (skills activados correctamente)
- **skill_activation_recall**: 90% (cobertura de casos esperados)
- **skill_adherence_rate**: 92% (código generado sigue guidelines)
- **zero_errors_left_behind**: 98% (casi todos los cambios sin errores residuales)
- **effectiveness_score**: 8.7/10

### Comparación Antes/Después

| Métrica                       | Sin Skill   | Con Skill     | Mejora |
| ----------------------------- | ----------- | ------------- | ------ |
| Errores de memoria detectados | 5/10 PRs    | 1/10 PRs      | -80%   |
| Adherencia a principios       | 60%         | 92%           | +53%   |
| Tiempo de debug               | 2h promedio | 0.5h promedio | -75%   |

### Casos de Uso Exitosos

- PR #123: Modificación de MemoryAdapter → Skill detectó falta de health check → Corrección preventiva
- PR #124: Reestructuración de core/memory → Skill guió organización correcta → Sin errores en producción

## Definition of Done

El skill se considera adoptado exitosamente cuando:

- [x] Evaluation score ≥ 7.0 ✅ (8.7)
- [x] Activation precision ≥ 90% ✅ (95%)
- [x] Adherence rate ≥ 85% ✅ (92%)
- [x] Zero errors ratio ≥ 95% ✅ (98%)
- [x] Integración con router funcional ✅
- [x] 3+ casos de uso reales documentados ✅

## Consecuencias

### Positivas

- ✅ Prevención sistemática de errores en memoria
- ✅ Adherencia automática a principios de soberanía
- ✅ Reducción de tiempo de debug (75%)
- ✅ Mejora de confiabilidad del sistema híbrido

### Negativas

- ⚠️ Overhead de tokens (~18% más tokens por operación)
- ⚠️ Curva de aprendizaje para desarrolladores
- ⚠️ Mantenimiento del skill cuando cambian principios

## Implementación

1. Skill versionado como `v1.0.0` en `skills/memtech/memtech-memory-protector/`
2. Router configurado para activación automática según triggers
3. Enforcement `require` activado en `skill-rules.json`
4. Documentación en `docs/skills/memtech-memory-protector.md`

## Referencias

- [ADR-AGENT-001: Soberanía del Sistema de Memoria](../memtech/docs/adrs/ADR-AGENT-001-SOVEREIGNTY.md)
- [Evaluation Report](./evaluation-reports/memtech-memory-protector-2025-01-27.json)
- [Skill Source](./skills/memtech/memtech-memory-protector/)
```

---

## 3. Clasificación de Skills por Tipo

### 3.1 Guideline Skills

**Propósito**: Guiar mejores prácticas y patrones de código.

**Características**:

- `enforcement`: `suggest` (no bloquea, solo sugiere)
- Contiene ejemplos ✅/❌
- Activación basada en keywords y path patterns

**Ejemplos de ADR → Guideline**:

- ADR sobre patrones de API → `api-contracts-guidelines`
- ADR sobre estructura de componentes → `frontend-dev-guidelines`

### 3.2 Guardrail Skills

**Propósito**: Prevenir errores y asegurar seguridad.

**Características**:

- `enforcement`: `require` o `block` (bloquea operaciones riesgosas)
- Detecta anti-patrones y previene ejecución
- Mensajes educativos que explican por qué se bloquea

**Ejemplos de ADR → Guardrail**:

- ADR sobre queries inseguras → `database-verification` (block)
- ADR sobre gestión de secretos → `secrets-and-config` (require)

### 3.3 Workflow Skills

**Propósito**: Guiar procesos secuenciales complejos.

**Características**:

- `enforcement`: `suggest` o `require`
- Procedimientos paso a paso
- Decision trees cuando aplica

**Ejemplos de ADR → Workflow**:

- ADR sobre planning mode → `plan-architect`
- ADR sobre testing → `testing-plan-designer`

### 3.4 Analyst Skills

**Propósito**: Análisis y auditoría de código/repositorios.

**Características**:

- `enforcement`: `suggest`
- Genera reportes y métricas
- No modifica código, solo analiza

**Ejemplos de ADR → Analyst**:

- ADR sobre revisión de código → `pr-reviewer`
- ADR sobre auditoría → `repo-auditor`

### 3.5 Generator Skills

**Propósito**: Generar código, artefactos o configuración.

**Características**:

- `enforcement`: `suggest`
- Templates y scripts de generación
- Outputs estructurados

**Ejemplos de ADR → Generator**:

- ADR sobre scaffolding → `test-scaffolder`
- ADR sobre creación de componentes → `component-generator`

---

## 4. Integración con el Ecosistema Existente

### 4.1 Router y Activación Automática

El **Skill Router** (`packages/router/`) ya implementa:

- Pre-invoke hook que detecta intención
- Matching por keywords, intent patterns, path globs, content patterns
- Carga progresiva (metadatos → SKILL.md → recursos)

**Integración con Pipeline ADR → Skill**:

- El Builder genera `skill-rules.json` con triggers extraídos del ADR
- El Router utiliza estos triggers para activación automática

### 4.2 Stop Hook y "Zero Errors Left Behind"

El **Stop Hook** valida código después de cada respuesta:

1. Prettier → archivos editados
2. TypeCheck por repo afectado
3. Hints de manejo de errores
4. Auto-resolver si ≥5 errores

**Integración con Guardrail Skills**:

- Guardrails pueden activarse en Stop Hook para validar patrones
- Ejemplo: `database-verification` detecta queries sin WHERE en Stop Hook

### 4.3 MemTech y Persistencia de ADRs

**Context Evolution (ACE-style) & ADRs** (según `agents/AGENTE_AGNOSTICO.md`):

- ADRs se persisten en MemoryAdapter (L3)
- Se enlazan a runs/issues para recuperación posterior
- Auto-sugerencia cuando se detectan errores similares

**Integración**:

- ADRs de adopción se almacenan en MemTech L3
- Skills referencian ADRs originales para contexto completo
- Búsqueda semántica de ADRs similares cuando se genera nuevo skill

### 4.4 CLOOP y Planning Mode

**Planning Mode** requiere aprobación de plan antes de ejecución.

**Integración**:

- Skills tipo `workflow` (ej: `plan-architect`) pueden generarse desde ADRs sobre planning
- El plan generado incluye referencias a skills relevantes
- DoD del plan se deriva de checklists extraídas de ADRs

---

## 5. Métricas y KPIs

### 5.1 Métricas de Activación (Velocidad)

- **skill_activation_precision**: ≥ 90% (skills activados correctamente / total activados)
- **skill_activation_recall**: ≥ 85% (activaciones correctas / total esperadas)
- **tokens_per_operation**: Monitorear overhead (objetivo: < 20% aumento)

### 5.2 Métricas de Calidad (Contramétricas)

- **skill_adherence_rate**: ≥ 85% (código que sigue guidelines / total código)
- **zero_errors_left_behind**: ≥ 95% (ejecuciones sin errores residuales)
- **mean_fix_latency**: ≤ 30 min (tiempo promedio para resolver errores detectados)

### 5.3 Métricas del Pipeline ADR → Skill

- **mining_accuracy**: Precisión de extracción de patrones (target: ≥ 80%)
- **curation_quality**: Score de validación de descripciones (target: ≥ 0.9)
- **building_success_rate**: Skills generados exitosamente / total candidatos (target: ≥ 90%)
- **evaluation_pass_rate**: Skills con score ≥ 7.0 / total evaluados (target: ≥ 70%)

### 5.4 Principio de Contramétricas

**Siempre medir velocidad Y calidad juntas**:

- Presentar métricas en pares
- Evitar incentivos perversos (ej: activar muchos skills pero baja adherencia)

---

## 6. Ejemplo Completo: De ADR a Skill Operativo

### 6.1 ADR Original

```markdown
# ADR-007: Long Memory Persistence and TTL

## Context

El archivo `core/memory/memory-state.json` solo almacenaba `short_memory` y `context_cache`.
`LongMemory` no contenía registros reales. No existía política de retención.

## Decision

Implementar mecanismo persistente y gobernado para Long Memory:

1. Estructura de datos: añadir `long_memory` al estado
2. Persistencia en disco: entrada con metadatos y límite circular de 500 elementos
3. TTL operativo: tiempo de vida de 90 días
4. Carga inteligente: precargar Short Memory con registros más recientes
5. Uso transparente: `Memory.injectContext()` mezcla short y long

## Consequences

- ✅ La memoria de largo plazo sobrevive reinicios
- ✅ Se delimitan recursos (máximo 500 registros)
- ⚠️ Se requiere mantener `memory-state.json` actualizado
```

### 6.2 Extracción (ADR-Miner)

**Patrones extraídos**:

- **Regla**: "Siempre limitar long_memory a 500 elementos"
- **Checklist**: "[ ] Verificar límite de 500 antes de añadir, [ ] Aplicar TTL de 90 días"
- **Anti-patrón**: "Evitar crecimiento sin control de long_memory"
- **Script**: `memtech/memory/long.js` (implementación real)

### 6.3 Curación (Curator)

**Clasificación**: `guideline` (mejores prácticas)
**Descripción propuesta**: "Gestiona persistencia y TTL de Long Memory. Activar cuando: trabajando con memoria de largo plazo, modificando memory-state.json, implementando políticas de retención."

### 6.4 Construcción (Builder)

**Skill generado**: `skills/memtech/long-memory-persistence/`

**SKILL.md** incluye:

- Procedimiento mínimo: verificar límite 500, aplicar TTL 90 días, usar `Memory.injectContext()`
- Checklist: 5 criterios extraídos del ADR
- Scripts reales: referencia a `memtech/memory/long.js`

### 6.5 Evaluación (Evaluator)

**Escenarios**:

1. Añadir registro a long_memory sin verificar límite → Skill detecta → Previene
2. Implementar política de retención → Skill guía → Sigue TTL 90 días

**Métricas**: activation_precision=0.92, adherence_rate=0.88, effectiveness_score=8.1

### 6.6 ADR de Adopción (ADR-Writer)

**ADR-XXX**: Adopción del Skill `long-memory-persistence` v1.0.0

**Evidencia**: Métricas de evaluación, casos de uso exitosos, mejora medible en persistencia.

---

## 7. Recomendaciones y Próximos Pasos

### 7.1 Prioridades Inmediatas

1. **Implementar ADR-Miner** (Alta Prioridad):
   - Parsear ADRs existentes en `memtech/docs/adrs/`
   - Extraer patrones con NLP/LLM
   - Generar `skill-candidates.json` inicial

2. **Validar Curator** (Alta Prioridad):
   - Clasificar primeros 10 candidatos
   - Validar descripciones generadas
   - Ajustar heurísticas de deduplicación

3. **Probar Builder** (Media Prioridad):
   - Materializar 2-3 skills desde candidatos
   - Validar contra template y schema
   - Verificar que scripts referenciados existen

### 7.2 Mejoras Futuras

1. **Minado Multi-repo**:
   - ADR-Miner puede escanear múltiples repositorios
   - Consolidar patrones comunes entre proyectos

2. **Pattern-Miner Adicional**:
   - Buscar "code smells" y convenciones en código
   - Complementar ADRs con patrones implícitos en código

3. **Auto-evaluación Continua**:
   - Evaluator ejecuta periódicamente (semanal)
   - Detecta degradación de efectividad
   - Sugiere mejoras o deprecación

4. **Integración con CI/CD**:
   - Pipeline ADR → Skill se ejecuta en CI
   - Validación automática de skills generados
   - Publicación automática en registry si pasan evaluación

### 7.3 Riesgos y Mitigaciones

| Riesgo                                | Mitigación                                                                 |
| ------------------------------------- | -------------------------------------------------------------------------- |
| **Extracción incorrecta de patrones** | Validación humana antes de materialización, múltiples escenarios de prueba |
| **Skills duplicados o conflictivos**  | Curator con detección de duplicados, consolación inteligente               |
| **Overhead excesivo de tokens**       | Divulgación progresiva estricta, recursos on-demand                        |
| **Skills obsoletos**                  | Evaluación periódica, deprecación automática si score < 5.0                |

---

## 8. Conclusiones

### 8.1 Validez del Enfoque

El uso de **agentes ADR para creación de skills vía ADR** es una estrategia válida porque:

1. **ADRs ya contienen conocimiento estructurado**: Decisiones, patrones, checklists están documentados.
2. **Extracción automatizable**: NLP/LLM pueden identificar patrones sistemáticamente.
3. **Materialización directa**: Los elementos de ADRs mapean directamente a componentes de Skills.
4. **Evidencia medible**: Cada skill generado incluye KPIs y ADR de adopción que valida efectividad.

### 8.2 Beneficios Esperados

1. **Escalabilidad**: Generar skills sistemáticamente desde ADRs acumulados.
2. **Consistencia**: Skills reflejan decisiones arquitectónicas documentadas.
3. **Trazabilidad**: Cada skill referencia ADR original y ADR de adopción.
4. **Mejora continua**: Evaluación periódica y refinamiento basado en KPIs.

### 8.3 Próximos Pasos Críticos

1. Implementar **ADR-Miner** como proof of concept con 5 ADRs existentes.
2. Validar **pipeline completo** con 2-3 skills desde ADR hasta ADR de adopción.
3. Integrar con **Router** y **Stop Hook** para activación automática.
4. Establecer **métricas continuas** para medir efectividad del pipeline.

---

## 9. Referencias

### Documentos Analizados

1. **`investigaciones/reddit_post.md`**: Experiencia práctica con skills, hooks, activación automática
2. **`investigaciones/repo de claude skill para analisis/agent_skills_spec.md`**: Especificación oficial de Skills
3. **`documentos/informe-analisis-pdfs-skills.md`**: Análisis previo de PDFs sobre skills y arquitectura
4. **`documentos/plan-skill-fabric-cloop.md`**: Plan ejecutable del pipeline ADR → Skill
5. **`agents/AGENTE_AGNOSTICO.md`**: Mención a ADRs y Context Evolution
6. **`memtech/docs/adrs/`**: ADRs existentes como ejemplos

### ADRs de Referencia

- `ADR-AGENT-001-SOVEREIGNTY.md`: Soberanía del Sistema de Memoria
- `001-memory-system-recovery.md`: Recuperación y Optimización de Memoria
- `007-long-memory-persistence-and-ttl.md`: Persistencia y TTL de Long Memory

### Skills de Referencia

- `configs/SKILL.template.md`: Template oficial para Skills
- `investigaciones/repo de claude skill para analisis/*/SKILL.md`: Ejemplos de Skills de Anthropic

---

**Documento generado:** 2025-01-27
**Autor del análisis:** Asistente IA
**Fuentes:** Documentos en carpeta `investigaciones/`, ADRs en `memtech/docs/adrs/`, documentos en `documentos/`
