# PROMPT: Generación de Templates v1.1.0

---
id: PROMPT-GENERACION-TEMPLATES-v1.1.0
version: 1.0.0
created: 2025-10-29
status: draft
template: template-prompt-especializado-v1.1.0
mode: generator
depth: deep
anti_drift: true
audit_framework: 4D
expected_score: ≥8.5/10
cloop_level: OPERATE
planner: true
planning_mode: true
---

## 🎯 ROL Y PROPÓSITO

**Generador de Templates Especializados** con expertise en:
- Estructura CSE completa (Contexto + Especificación + Verificación)
- Template v1.1.0 con 8/8 componentes validados
- TAGs system con coverage ≥60%
- Anti-drift mechanisms integrados
- Tests ejecutables y métricas cuantificables

**Objetivo**: Generar templates especializados usando Template v1.1.0 como base, asegurando 8/8 componentes completos, TAGs coverage ≥60%, y validación automática.

---

## 📚 CONTEXTO COMPLETO

### Documentos Base (Obligatorios)

[K] **Template v1.1.0 base**: `docs/ANALISIS-TEMPLATES-META.md`
- 625 líneas de estructura completa
- 8 componentes críticos validados
- Score ≥8.0/10 validado

[K] **Síntesis de lecciones**: `docs/SINTESIS-GLOBAL-LECCIONES.md`
- Batch Creation (CAL-1.0-1): +170% velocidad
- Checklist Pre-Creación (CAL-1.0-2): -20-30% QA time
- TAGs Coverage ≥60%: +1.5 puntos score

[K] **Métricas y validación**: `docs/METRICAS-VALIDACION-GLOBAL.md`
- Gates PAE (G1-G5)
- Auditoría 4D framework
- Thresholds y KPIs consolidados

### Estado Actual

[EVIDENCIA] **Contexto cargado:**
- ✅ Template v1.1.0 estructura validada
- ✅ 39+ prompts analizados del estudio
- ✅ 27 patrones identificados y documentados
- ✅ 7+ templates documentados con scores ≥8.0/10

[PROPUESTA] **Gap identificado:**
- ⚠️ Falta prompt especializado para generación de templates
- ⚠️ Necesidad de prompt reutilizable que aplique Template v1.1.0 automáticamente

---

## 🎯 OBJETIVOS SMART

**O1:** Generar template especializado usando Template v1.1.0 (8/8 componentes validados, score ≥8.0/10)
- [C] **Ejemplo:** Template generado con Frontmatter YAML, ROL, CONTEXTO, OBJETIVOS SMART, TAREAS, VALIDACIÓN, ENTREGABLES, ANTI-DRIFT

**O2:** Asegurar TAGs coverage ≥60% ([K]/[C]/[U]/[EVIDENCIA]/[PROPUESTA] distribuidos en ≥60% de secciones)
- [C] **Ejemplo:** 10+ TAGs identificados en secciones clave

**O3:** Integrar validación automática (tests ejecutables bash, métricas cuantificables con thresholds)
- [C] **Ejemplo:** 3+ tests bash validando estructura, contenido y calidad

**O4:** Documentar anti-drift mechanisms (≥3 mecanismos: Context Refresh, Boundary Markers, CoVe)
- [C] **Ejemplo:** 3 mecanismos anti-drift documentados y validados

---

## 📋 TAREAS DETALLADAS

### FASE 1: Preparar Estructura Base (15 min)

**T1:** [K] **Cargar Template v1.1.0 base**
- [K] **Input:** `docs/ANALISIS-TEMPLATES-META.md`
- [C] **Output:** Estructura base con 8 componentes identificados
- [U] **Acción:** Validar checklist 8/8 componentes

**T2:** [C] **Generar Frontmatter YAML completo**
- [K] **Input:** Metadata estándar (id, version, created, status, template, mode, depth)
- [C] **Output:** Frontmatter YAML con 12+ campos
- [U] **Acción:** Validar campos requeridos y opcionales

**T3:** [C] **Definir ROL Y PROPÓSITO específico**
- [K] **Input:** Contexto del template a generar
- [C] **Output:** ROL definido con expertise y objetivo claro
- [U] **Acción:** Validar especificidad y claridad

### FASE 2: Construir Contenido Estructurado (45 min)

**T4:** [C] **Desarrollar CONTEXTO COMPLETO**
- [K] **Input:** Documentos base relevantes al template
- [C] **Output:** Contexto con [K]/[C]/[U]/[EVIDENCIA]/[PROPUESTA]
- [U] **Acción:** Asegurar TAGs coverage ≥60%

**T5:** [C] **Definir OBJETIVOS SMART (≥3 objetivos)**
- [K] **Input:** Necesidad del template
- [C] **Output:** 3+ objetivos SMART con ejemplos [C]
- [U] **Acción:** Validar criterios SMART completos

**T6:** [C] **Especificar TAREAS DETALLADAS**
- [K] **Input:** Objetivos y contexto
- [C] **Output:** Tareas con estructura [K]/[C]/[U] por tarea
- [U] **Acción:** Validar dependencias y orden lógico

**T7:** [C] **Crear VALIDACIÓN con tests ejecutables**
- [K] **Input:** Criterios de validación
- [C] **Output:** 3+ tests bash con expected outcomes
- [U] **Acción:** Validar tests son ejecutables y verificables

**T8:** [C] **Definir ENTREGABLES esperados**
- [K] **Input:** Objetivos SMART
- [C] **Output:** 3+ entregables con formato y threshold
- [U] **Acción:** Validar entregables son medibles

### FASE 3: Integrar Anti-Drift (20 min)

**T9:** [C] **Documentar Anti-Drift Mechanisms (≥3)**
- [K] **Input:** Mecanismos estándar (Context Refresh, Boundary Markers, CoVe)
- [C] **Output:** 3+ mecanismos documentados con triggers
- [U] **Acción:** Validar mecanismos son aplicables

**T10:** [C] **Aplicar TAGs system (coverage ≥60%)**
- [K] **Input:** Secciones del template
- [C] **Output:** TAGs [K]/[C]/[U]/[EVIDENCIA]/[PROPUESTA] en ≥60% secciones
- [U] **Acción:** Calcular coverage y validar ≥60%

---

## 🔍 VALIDACIÓN

### Criterios de Validación

**Estructura:** [C] CSE completo (Contexto + Especificación + Verificación) ✅  
**Contenido:** [K] Template v1.1.0 aplicado (8/8 componentes)  
**Calidad:** [U] TAGs coverage ≥60%, tests ejecutables, anti-drift integrados  
**Completitud:** [C] Todos los entregables generados con thresholds

### Tests Ejecutables

**Test 1:** Verificar estructura 8/8 componentes

```bash
# Verificar componentes requeridos en template
COMPONENTS=("Frontmatter YAML" "ROL Y PROPÓSITO" "CONTEXTO COMPLETO" "OBJETIVOS SMART" "TAREAS DETALLADAS" "VALIDACIÓN" "ENTREGABLES" "ANTI-DRIFT")
MISSING=0
for component in "${COMPONENTS[@]}"; do
  if ! grep -q "$component" docs/prompts/PROMPT-GENERACION-TEMPLATES-V1.1.0.md; then
    echo "❌ Falta: $component"
    MISSING=$((MISSING+1))
  fi
done

if [ $MISSING -eq 0 ]; then
  echo "✅ 8/8 componentes presentes"
  exit 0
else
  echo "❌ Faltan $MISSING componente(s)"
  exit 1
fi

# Expected: ✅ 8/8 componentes presentes
# Exit code: 0 = PASS, ≠0 = FAIL
```

**Test 2:** Verificar TAGs coverage ≥60%

```bash
# Calcular coverage de TAGs
TOTAL_SECTIONS=$(grep -c "^##\|^###" docs/prompts/PROMPT-GENERACION-TEMPLATES-V1.1.0.md)
TAGGED_SECTIONS=$(grep -E "\[K\]|\[C\]|\[U\]|\[EVIDENCIA\]|\[PROPUESTA\]" docs/prompts/PROMPT-GENERACION-TEMPLATES-V1.1.0.md | wc -l | xargs)
COVERAGE=$(echo "scale=2; ($TAGGED_SECTIONS / $TOTAL_SECTIONS) * 100" | bc)

if (( $(echo "$COVERAGE >= 60" | bc -l) )); then
  echo "✅ TAGs coverage: ${COVERAGE}% (≥60%)"
  exit 0
else
  echo "❌ TAGs coverage: ${COVERAGE}% (<60%)"
  exit 1
fi

# Expected: ✅ TAGs coverage ≥60%
# Exit code: 0 = PASS, ≠0 = FAIL
```

**Test 3:** Verificar tests ejecutables presentes

```bash
# Verificar tests bash en sección VALIDACIÓN
TEST_COUNT=$(grep -c "```bash" docs/prompts/PROMPT-GENERACION-TEMPLATES-V1.1.0.md)

if [ "$TEST_COUNT" -ge 3 ]; then
  echo "✅ ${TEST_COUNT} tests ejecutables (≥3)"
  exit 0
else
  echo "❌ Solo ${TEST_COUNT} tests (<3)"
  exit 1
fi

# Expected: ≥3 tests ejecutables
# Exit code: 0 = PASS, ≠0 = FAIL
```

---

## 📋 ENTREGABLES ESPERADOS

**E1:** [C] **Template generado** (`docs/prompts/PROMPT-GENERACION-TEMPLATES-V1.1.0.md`)
- Formato: Markdown con estructura completa
- Ubicación: `docs/prompts/`
- Threshold: 8/8 componentes validados, score ≥8.0/10

**E2:** [C] **Checklist de validación** (Verificación 8/8 componentes)
- Formato: Lista de verificación
- Ubicación: Incluido en template
- Threshold: Todos los componentes presentes

**E3:** [C] **Tests ejecutables** (3+ tests bash)
- Formato: Scripts bash con expected outcomes
- Ubicación: Sección VALIDACIÓN del template
- Threshold: Tests ejecutables y verificables

---

## 🚨 ALERTAS ANTI-DRIFT

### [INTERNAL:mecanismo-1] Context Refresh Protocol

⚠️ **STOP cada 2 horas o al cambiar de fase:**

1. ⚠️ **¿Cuál es el objetivo principal?** → Generar template usando Template v1.1.0
2. ⚠️ **¿Qué he completado hasta ahora?** → Revisar fases completadas
3. ⚠️ **¿Qué falta por hacer?** → Revisar próximas tareas
4. ⚠️ **¿Estoy en contexto correcto?** → Verificar no drift

### [INTERNAL:mecanismo-2] Boundary Markers

**IN-SCOPE:**
- [INTERNAL:scope-1] Generar 1 template con Template v1.1.0 (8/8 componentes)
- [INTERNAL:scope-2] Asegurar TAGs coverage ≥60%
- [INTERNAL:scope-3] Incluir 3+ tests ejecutables
- [INTERNAL:scope-4] Documentar 3+ mecanismos anti-drift

**OUT-OF-SCOPE:**
- ❌ Generar múltiples templates (se posterga a Batch Creation)
- ❌ Crear registry de templates (se posterga)
- ❌ UI para template builder (se posterga)

**RELATED:**
- 🔗 [EXTERNAL:Template v1.1.0] `docs/ANALISIS-TEMPLATES-META.md`
- 🔗 [EXTERNAL:Lecciones] `docs/SINTESIS-GLOBAL-LECCIONES.md`

### [INTERNAL:mecanismo-3] Chain-of-Verification (CoVe)

**Aplicar antes de documentar hallazgos:**

1. ✅ **¿Qué afirmo?** → Validar claim específico
2. ✅ **¿Cuál es la evidencia?** → Fuente verificable
3. ✅ **¿Es la evidencia suficiente?** → Validar robustez
4. ✅ **¿Hay alternativas explicativas?** → Contrastar hipótesis
5. ✅ **¿Qué nivel de confianza?** → [K]/[C]/[U] assignment

---

## 🎓 LECCIONES APLICABLES DEL ESTUDIO

**[INTERNAL:SINTESIS-GLOBAL-LECCIONES] L1:** Checklist Pre-Creación (CAL-1.0-2)
- [K] **Evidencia:** 0 refactoring necesario, -20-30% QA time
- [C] **Aplicación:** Validar 8/8 componentes antes de considerar template completo
- [U] **Resultado esperado:** Template acreditable desde inicio (score ≥8.0/10)

**[INTERNAL:SINTESIS-GLOBAL-LECCIONES] L2:** TAGs Coverage ≥60%
- [K] **Evidencia:** +1.5 puntos al score proyectado
- [C] **Aplicación:** Usar [K]/[C]/[U]/[EVIDENCIA]/[PROPUESTA] con densidad ≥60%
- [U] **Resultado esperado:** Score mejorado automáticamente

**[INTERNAL:SINTESIS-GLOBAL-LECCIONES] L3:** Tests Ejecutables
- [K] **Evidencia:** Validación automática reduce errores manuales
- [C] **Aplicación:** Incluir 3+ tests bash con expected outcomes claros
- [U] **Resultado esperado:** Validación reproducible y rápida

---

## 🔗 REFERENCIAS

**Documentos Base:**
- `docs/ANALISIS-TEMPLATES-META.md` (Template v1.1.0 con 625 líneas)
- `docs/SINTESIS-GLOBAL-LECCIONES.md` (Top-10 lecciones aprendidas)
- `docs/METRICAS-VALIDACION-GLOBAL.md` (KPIs y gates consolidados)

**Tools:**
- `prompt-builder` (generación optimizada de prompts)
- `skills-cli` (validación de estructura)

**ADRs Relacionados:**
- [ADR-Template-v1.1.0] Template especializado como base obligatoria
- [ADR-TAGs] TAGs coverage ≥60% para calidad
- [ADR-Tests] Tests ejecutables para validación automática

---

**TEMPLATE COMPLETADO** ✅  
**Fecha:** 2025-10-29  
**Versión:** 1.0.0  
**Estado:** DRAFT  
**Próximo Paso:** Validar 8/8 componentes y TAGs coverage ≥60%

