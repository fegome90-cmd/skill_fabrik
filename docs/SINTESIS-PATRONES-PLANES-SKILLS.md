# Síntesis: Patrones Extraídos para Planes + Skills

**Fecha**: 2025-10-29  
**Estado**: 🔄 Construyendo síntesis de patrones

---

## 🎯 Patrón 1: Estructura CLOOP para Planes

### Fuentes
- ✅ PROMPT-SPRINT-1.7 (Score 98.3/100)
- ✅ PROMPT-SPRINT-0-ARQUITECTURA
- ✅ TEMPLATE-CALIBRACION-PRE-SPRINT
- ✅ skill plan-architect (SKILL.md)

### Estructura Canónica

```markdown
## CLOOP: Clarify

### Objetivo SMART
- **Specific**: [descripción específica]
- **Measurable**: [métrica cuantificable]
- **Achievable**: [factibilidad]
- **Relevant**: [relevancia al objetivo mayor]
- **Time-bound**: [tiempo estimado]

### Hipótesis Principales
- H1: [hipótesis identificada]
- H2: [si aplica]

### Criterios de Éxito Cuantificables
- [Métrica 1]: ≥ [umbral] [TAG:CATEGORIA]
- [Métrica 2]: < [umbral] [TAG:CATEGORIA]

## CLOOP: Layout

### Arquitectura Mínima
[Componentes clave necesarios]

### Interfaces y Contratos
[APIs, schemas, tipos necesarios]

### Métricas a Recolectar
[Lista de métricas con umbrales]

## CLOOP: Operate

### Fases y Pasos
- **Fase 1**: [nombre]
  - Paso 1.1: [descripción]
  - Paso 1.2: [descripción]
- **Fase 2**: [nombre]
  - Paso 2.1: [descripción]

### Dependencias
- Fase X depende de Fase Y
- [TAG:C:DEPENDENCY-TYPE]

## CLOOP: Observe

### Métricas Esperadas
| Métrica | Baseline | Target | Threshold | Verificación |
|---------|----------|--------|-----------|--------------|
| [Métrica] | [valor] | [valor] | [valor] | [comando] |

### Evidencia a Recolectar
- [Tipo evidencia 1]
- [Tipo evidencia 2]

## CLOOP: Reflect

### Riesgos Identificados
- **Riesgo 1**: [descripción]
  - Probabilidad: [Alta/Media/Baja]
  - Impacto: [Alto/Medio/Bajo]
  - Mitigación: [acción]
  - Contingencia: [plan B]

### Señales Stop/Go
- **STOP**: [condición que detiene]
- **GO**: [condición que continúa]
```

### Aplicación para Prompt Builder

**Para generar un prompt de plan**:
1. Solicitar: objetivo específico, tiempo estimado
2. Generar: Objetivo SMART automático
3. Generar: Hipótesis basadas en keywords
4. Generar: Métricas desde umbrales estándar
5. Generar: Fases con dependencias sugeridas
6. Generar: Riesgos comunes del dominio
7. Añadir: TAGs según contexto

---

## 🔄 Patrón 2: Estructura de Ejecución por Fases (Skills)

### Fuentes
- ✅ ejecutor-chat-01.md
- ✅ ejecutor-chat-02.md
- ✅ PROMPT-SPRINT-1.7 (Fases detalladas)

### Estructura Canónica

```markdown
### FASE X: [Nombre Fase] ([Tiempo])

**⚠️ CONTEXT REFRESH:**
[Re-anclar objetivo si necesario]

**Objetivo:** [objetivo específico de la fase]

**Acciones:**

1. **[K] Known - Operaciones:**
   - [K] Acción con conocimiento existente
   - [K] Leer documento X
   - [K] Revisar evidencia Y

2. **[C] Computed - Análisis:**
   - [C] Calcular métrica Z
   - [C] Analizar patrón W
   - [C] Comparar resultados

3. **[U] Unknown - Decisiones:**
   - [U] Decidir entre opciones A/B
   - [U] Identificar gaps
   - [U] Proponer solución

**Output FASE X:**
- Archivo: `ruta/archivo.md`
- Validación: [criterio]
- Verificación: [comando]

**⚠️ Separación [EVIDENCIA] vs [PROPUESTA]:**

### [EVIDENCIA] Hechos Validados
- [EVIDENCIA:REFERENCIA] Descripción

### [PROPUESTA] Cambios Propuestos
- [PROPUESTA:CAMBIO] Descripción
```

### Aplicación para Skills

**Para skills workflow**:
1. Descomponer skill en fases CLOOP
2. Cada fase con: Objetivo, Acciones [K/C/U], Output, Validación
3. Tests ejecutables después de cada fase
4. Handoff estructurado entre fases

---

## 🏷️ Patrón 3: TAGs System para Contexto

### Fuentes
- ✅ PROMPT-SPRINT-1.7 (97+ TAGs)
- ✅ PROMPT-SPRINT-0-ARQUITECTURA
- ✅ PROMPT-PAE-EXTRACTOR

### Tipos de TAGs Estándar

```markdown
[K:KNOWLEDGE-TOPIC] - Conocimiento específico
  Ejemplos:
  - [K:ADR-PATTERN]
  - [K:SEMANTIC-MEMORY]
  - [K:CLOOP-METHODOLOGY]

[C:CONTEXT-TYPE] - Contexto del sistema/proceso
  Ejemplos:
  - [C:CLOOP-INTEGRATION]
  - [C:CI-CD-INTEGRATION]
  - [C:TIMELINE-DETAILED]

[U:USER-ACTION] - Acción del usuario/workflow
  Ejemplos:
  - [U:DEVELOPER-WORKFLOW]
  - [U:VALIDATION-SCRIPT]
  - [U:COVERAGE-TOOLS]

[EVIDENCIA:REFERENCE] - Evidencia de estado actual
  Ejemplos:
  - [EVIDENCIA:SPRINT-1.6-SUCCESS]
  - [EVIDENCIA:FAISS-PERFORMANCE]
  - [EVIDENCIA:EXISTING-SYSTEMS]

[PROPUESTA:CHANGE] - Cambio propuesto
  Ejemplos:
  - [PROPUESTA:BMCC-GATES]
  - [PROPUESTA:ROADMAP-FUTURE]

[INTERNAL:component] - Componente interno
  Ejemplos:
  - [INTERNAL:arquitectura]
  - [INTERNAL:gobernanza]

[EXTERNAL:source-type] - Fuente externa
  Ejemplos:
  - [EXTERNAL:papers]
  - [EXTERNAL:meta-prompts]

[PAPER:arxiv-id] - Referencia académica
  Ejemplos:
  - [PAPER:arXiv:2303.11366]
  - [PAPER:arXiv:2309.11495]
```

### Aplicación para Skill Activation Context

**Para inyectar contexto en skills**:
1. Identificar TAGs relevantes del plan activo
2. Inyectar TAGs en `injectedNote` del pre-invoke hook
3. Skills pueden leer contexto por TAG
4. Trazabilidad completa de decisiones

---

## 📊 Patrón 4: Tests Ejecutables por Fase

### Fuentes
- ✅ PROMPT-SPRINT-1.7 (12 tests)
- ✅ ejecutor-chat-01.md
- ✅ PROMPT-PAE-EXTRACTOR

### Estructura Canónica

```markdown
### Test X: [Nombre Test] [TAG:TEST-TYPE]

```bash
# [Descripción del test] [TAG:C:TEST-CONTEXT]
comando-de-ejecucion
# Verificar: [criterio específico] [TAG:K:VERIFICATION-CRITERIA]
```

**Criterios de Validación:**
- ✅ PASS: [condición]
- ⚠️ WARNING: [condición]
- ❌ FAIL: [condición]
```

### Aplicación para Validación de Planes

**Para planes**:
1. Generar tests para cada fase del plan
2. Tests verifican: métricas, outputs, integraciones
3. Ejecutar tests automáticamente en stop hook
4. Reportar resultados en KPIs

---

## 📈 Patrón 5: Métricas Cuantificables con Umbrales

### Fuentes
- ✅ PROMPT-SPRINT-1.7 (15+ métricas)
- ✅ PROMPT-SPRINT-0-ARQUITECTURA
- ✅ ejecutor-chat-01.md

### Estructura Canónica

```markdown
### Métricas de [Categoría] [TAG:C:CATEGORIA-TYPE]

| Métrica | Baseline | Target | Threshold | Verificación |
|---------|----------|--------|-----------|--------------|
| **[Métrica]** | [valor] | [valor] | [valor] | [comando] [TAG:K:VERIFICATION] |

### Umbrales de Alerta
- **[Métrica] < [umbral]**: WARNING
- **[Métrica] < [umbral-crítico]**: CRITICAL
```

### Ejemplo Real

```markdown
### Métricas de Desarrollo [K:DEVELOPMENT-METRICS]

- **ADRs generados**: ≥5 por sprint (objetivo: 8) [U:ADR-GENERATION-TARGET]
- **Quality score promedio**: ≥7.5/10 (objetivo: 8.0) [U:QUALITY-SCORE-TARGET]
- **Retrieval hit ratio**: ≥0.9 en Clarify/Layout (objetivo: 0.95) [C:RETRIEVAL-EFFECTIVENESS]
- **Conflicts blocked**: ≥1 por sprint (objetivo: 2) [U:CONFLICT-PREVENTION-TARGET]
- **Pipeline success rate**: ≥95% (objetivo: 98%) [C:PIPELINE-RELIABILITY]
```

### Aplicación para KPIs de Skills

**Para skills**:
1. Definir métricas de activación
2. Definir métricas de ejecución
3. Definir métricas de adherencia
4. Umbrales de alerta automáticos

---

## 🔒 Patrón 6: Frontmatter YAML Completo

### Fuentes
- ✅ PROMPT-SPRINT-1.7 (12 campos)
- ✅ PROMPT-SPRINT-0-ARQUITECTURA (detallado)
- ✅ PROMPT-SPRINT-CONSOLIDACION (muy completo)

### Estructura Canónica

```yaml
---
meta:
  id: "identificador-unico"
  version: "1.0.0"
  created_at: "2025-10-29T00:00:00Z"
  base: "template-base"
  mode: "implementation|research|consolidation"
  dependencies: ["dep1", "dep2"]
  calibraciones_bmcc: ["CAL-1", "CAL-2"]
  complexity: "low|medium|high|very-high"
  duration: "8h"
  innovation_level: "low|medium|high|very-high|revolutionary"
  target_coverage: 85
  estimated_duration: "8h"
  anti_drift: true|false
  architecture: "tipo-arquitectura"
  audit_framework: "4D|otro"
  expected_score: "≥8.0/10"
---
```

### Aplicación para Metadatos de Planes

**Para planes**:
1. Frontmatter con: id, version, created_at, status, task
2. Dependencias de otros planes
3. Métricas esperadas
4. Tags relevantes

---

## 🔄 Patrón 7: Handoff Estructurado

### Fuentes
- ✅ ejecutor-chat-01.md (handoff entre chats)
- ✅ template-handoff-v2.0-PAE.md
- ✅ PROMPT-SPRINT-1.7 (roadmap)

### Estructura Canónica

```markdown
# 🚀 HANDOFF: [Nombre] → [Siguiente Fase]

**Meta-Prompt ID:** [ID]  
**VERSION:** [version]  
**Fecha:** [fecha]  
**Status:** ✅ **EXITOSO - READY FOR [NEXT]**

---

## 🎯 Resumen de Tareas Completadas

### ✅ T01: [Tarea] ([tiempo estimado])
- ✅ [Logro 1]
- ✅ [Logro 2]
- ✅ [Logro 3]

**Archivos creados:**
- `ruta/archivo1.md`
- `ruta/archivo2.md`

**Métricas alcanzadas:**
```yaml
[Medición]: [valor]
```

---

## 📦 Entregables [FASE]

### Código
- [Lista]

### Documentación
- [Lista]

### Reports
- [Lista]

---

## 🎯 Próximos Pasos ([NEXT PHASE])

### T04: [Tarea]
**Dependencia:** [artifact] ✅ READY  
**Objetivo:** [objetivo]
```

### Aplicación para Transferencia entre Skills

**Para skills**:
1. Handoff cuando skill termina
2. Contexto completo del skill ejecutado
3. Artifacts generados
4. Próximos pasos sugeridos

---

## 🎓 Patrón 8: Context Refresh Protocol

### Fuentes
- ✅ PROMPT-SPRINT-0-ARQUITECTURA (Context Refresh en cada fase)
- ✅ PROMPT-SPRINT-1.7 (implícito)

### Estructura Canónica

```markdown
### ⚠️ CONTEXT REFRESH [FASE]

Antes de iniciar [FASE], re-anclar objetivos:

1. **¿Por qué [estamos haciendo esto]?**
   → [Respuesta]

2. **¿Qué métricas debemos alcanzar?**
   → [Métricas]

3. **¿Qué incluye/excluye este [alcance]?**
   → IN: [alcance]
   → OUT: [fuera de alcance]

4. **¿Cómo contribuye esta fase al objetivo final?**
   → [Contribución]
```

### Aplicación para Mantener Contexto en Planes

**Para planes largos**:
1. Context refresh al inicio de cada fase
2. Re-anclar objetivos constantemente
3. Prevenir drift de contexto
4. Mantener foco en objetivos originales

---

## 📋 Próximos Pasos

### 1. Continuar Análisis Sistemático
- [ ] Analizar más prompts ejecutores
- [ ] Analizar más prompts de planificación
- [ ] Analizar templates completos

### 2. Generar Templates
- [ ] Template: Plan Generation (CLOOP completo)
- [ ] Template: Skill Activation
- [ ] Template: Plan-Skill Integration
- [ ] Template: Handoff entre Skills

### 3. Integrar en Prompt Builder
- [ ] Agregar generación CLOOP
- [ ] Agregar TAGs system
- [ ] Agregar tests ejecutables
- [ ] Agregar métricas cuantificables

---

**Síntesis en construcción**: 2025-10-29  
**Patrones identificados**: 8  
**Aplicabilidad**: ⭐⭐⭐⭐⭐ ALTA

