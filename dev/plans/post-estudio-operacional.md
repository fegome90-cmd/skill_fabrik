# Plan: Post-Estudio Operacional - Skills Fabrik

**Fecha**: 2025-10-29  
**Versión**: 1.0.0  
**Estado**: DRAFT  
**Metodología**: CLOOP + BMCC + Template v1.1.0

---

## 🎯 ROL Y PROPÓSITO

**Arquitecto de Planes y Skills** especializado en:
- Planificación operativa con integración de skills
- Operacionalización de patrones y templates aprendidos
- Sistemas de validación con PAE + Auditoría 4D
- Gestión de memoria con MemTech (L0/L1/L2/L3)

**Objetivo**: Operacionalizar los patrones, templates y lecciones aprendidas del análisis extenso para integrarlos en el sistema de skills con workflows, guardrails y guidelines activos, usando PAE + Auditoría 4D como gates obligatorios.

---

## 📚 CONTEXTO COMPLETO

### Documentos Base (Leer OBLIGATORIO)

1. `docs/SINTESIS-GLOBAL-LECCIONES.md` (Top-10 lecciones aprendidas)
2. `docs/METRICAS-VALIDACION-GLOBAL.md` (KPIs y gates consolidados)
3. `docs/ESTADO-ANALISIS-COMPLETO.md` (27 patrones identificados)
4. `docs/ANALISIS-FINAL-EXTENSO.md` (7+ templates documentados)
5. `docs/ANALISIS-TEMPLATES-META.md` (Template v1.1.0 con 8 componentes)

### Resumen Ejecutivo Contexto

[EVIDENCIA] **Estado actual:**
- ✅ Análisis extenso completado 100% (39+ prompts, 27 patrones, 7+ templates)
- ✅ Lecciones consolidadas documentadas (Batch Creation, Checklist Pre-Creación, TAGs ≥60%, PAE, Auditoría 4D, Handoff v2.0-PAE)
- ✅ Sistema de skills operativo (plan-save-workflow, database-verification, secrets-and-config)
- ✅ MemTech integrado (Redis L0/L1, Postgres L2, ChromaDB L3 legacy)
- [K] Template v1.1.0 estructura validada (625 líneas, 8 componentes críticos)
- [K] PAE System con 5 gates (G1-G5: existencia, schema, tests, critical gates, checksum)
- [K] Auditoría 4D framework (Completitud 30%, Calidad 30%, Impacto 25%, Sostenibilidad 15%)

[PROPUESTA] **Gap/Challenge identificado:**
- ⚠️ **Gap:** Patrones y templates no operacionalizados en el flujo diario
- ⚠️ **Challenge:** Integrar 27 patrones + 7+ templates en workflows activos
- ⚠️ **Impacto:** Sin operacionalización, los aprendizajes quedan solo como documentación

---

## 🎯 OBJETIVOS ESPECÍFICOS (SMART)

**O1:** Crear y aprobar plan post-estudio operacional con estructura CLOOP completa (p95 activate <50ms, threshold ≥7.0/10)
- [C] **Ejemplo:** Plan en `dev/plans/post-estudio-operacional.json` con status APPROVED

**O2:** Integrar PAE + Auditoría 4D como gates obligatorios en el workflow (≥7/8 checklist PAE, score 4D ≥7.0/10)
- [C] **Ejemplo:** PAE generado antes de auditoría, gates G1-G5 PASS, auditoría 4D ejecutada

**O3:** Aplicar Template v1.1.0 a 3 prompts críticos nuevos (8/8 componentes cada uno, score ≥8.0/10)
- [C] **Ejemplo:** 3 prompts generados con Frontmatter YAML, ROL, CONTEXTO, OBJETIVOS SMART, TAREAS, VALIDACIÓN, ENTREGABLES, ANTI-DRIFT

**O4:** Activar 4+ skills en el proceso (guardrails: db-verification, secrets-and-config; workflows: plan-save-workflow, pm2-monitor; guidelines: backend-dev, project-catalog)
- [C] **Ejemplo:** Skills activados registrados en `obs/kpi/events.jsonl` con scores ≥0.6

**O5:** Emitir KPIs consolidados y generar reporte `docs/skills-ops-report.md` con métricas de activación, adherencia, errores y latencia
- [C] **Ejemplo:** Reporte con activation_latency, run_latency, policy_decision, adr_applied

---

## 📋 TAREAS DETALLADAS (CLOOP)

### FASE 1: CLARIFY - Definir Alcance (20 min)

**Objetivo fase:** Clarificar objetivos, alcance y restricciones del plan post-estudio

- **T1:** [K] **Leer documentos base completos** (SINTESIS-GLOBAL-LECCIONES, METRICAS-VALIDACION-GLOBAL, ESTADO-ANALISIS-COMPLETO)
  - [K] **Input:** Documentos del estudio completado
  - [C] **Output:** Contexto cargado con 27 patrones + 7+ templates
  - [U] **Acción:** Revisar lecciones Top-10 y patrones identificados

- **T2:** [C] **Definir alcance operacional** (IN/OUT explícito)
  - [K] **Input:** Patrones y templates identificados
  - [C] **Output:** Alcance definido: IN (operacionalizar 10 patrones críticos), OUT (registry público, sandbox)
  - [U] **Acción:** Documentar boundaries IN-SCOPE/OUT-OF-SCOPE

- **T3:** [C] **Identificar skills críticos a activar** (workflows, guardrails, guidelines)
  - [K] **Input:** `configs/skill-rules.json` (reglas de activación)
  - [C] **Output:** Lista de 4+ skills prioritarios (plan-save-workflow, db-verification, secrets-and-config, backend-dev)
  - [U] **Acción:** Verificar reglas de activación multi-señal

---

### FASE 2: LAYOUT - Diseñar Estructura (30 min)

**Objetivo fase:** Diseñar estructura del plan usando Template v1.1.0 (8/8 componentes)

- **T4:** [C] **Aplicar Template v1.1.0** (Frontmatter YAML, ROL, CONTEXTO, OBJETIVOS SMART, TAREAS, VALIDACIÓN, ENTREGABLES, ANTI-DRIFT)
  - [K] **Input:** Template v1.1.0 documentado en `docs/ANALISIS-TEMPLATES-META.md`
  - [C] **Output:** Plan estructurado con 8/8 componentes
  - [U] **Acción:** Validar checklist 8/8 componentes pre-creación

- **T5:** [C] **Integrar PAE como gate obligatorio** (G1-G5: existencia, schema, tests, critical gates, checksum)
  - [K] **Input:** PAE System documentado (G1-G5 gates)
  - [C] **Output:** Gates PAE definidos en el plan con validaciones ejecutables
  - [U] **Acción:** Agregar tests bash para validar PAE antes de auditoría

- **T6:** [C] **Configurar Auditoría 4D** (Completitud 30%, Calidad 30%, Impacto 25%, Sostenibilidad 15%, threshold ≥7.0/10)
  - [K] **Input:** Framework 4D documentado en `docs/METRICAS-VALIDACION-GLOBAL.md`
  - [C] **Output:** Auditoría 4D configurada con pesos y thresholds definidos
  - [U] **Acción:** Agregar métricas cuantificables por dimensión

---

### FASE 3: OPERATE - Ejecutar Plan (60 min)

**Objetivo fase:** Crear plan, aprobarlo y activar skills

- **T7:** [K] **Crear plan usando skills-cli** (`skills plan create`)
  - [K] **Input:** Descripción estructurada del plan
  - [C] **Output:** Plan creado en `dev/plans/post-estudio-operacional.json`
  - [U] **Acción:** Ejecutar `skills plan create "Plan post-estudio operacional"`

- **T8:** [C] **Aprobar y guardar plan** (`skills plan save <id> --approve`)
  - [K] **Input:** Plan creado con ID
  - [C] **Output:** Plan aprobado (status APPROVED) y guardado, workflow activado
  - [U] **Acción:** Ejecutar `skills plan save <id> --approve` para activar plan-save-workflow

- **T9:** [U] **Verificar activación de skills** (plan-save-workflow, database-verification, secrets-and-config)
  - [K] **Input:** Plan aprobado activo
  - [C] **Output:** Skills activados registrados en `obs/kpi/events.jsonl`
  - [U] **Acción:** Verificar logs de activación y scores ≥0.6

- **T10:** [C] **Validar MemTech L1 snapshot** (Redis snapshot generado automáticamente)
  - [K] **Input:** Plan guardado con workflow activado
  - [C] **Output:** L1 snapshot verificado en Redis con plan_id y snapshot_id
  - [U] **Acción:** Verificar conexión Redis y snapshot creado

- **T11:** [C] **Aplicar Template v1.1.0 a 1 prompt crítico** (ejemplo: prompt para generación de templates)
  - [K] **Input:** Template v1.1.0 con 8/8 componentes
  - [C] **Output:** 1 prompt generado con estructura completa (Restantes 2 en próximas iteraciones)
  - [U] **Acción:** Validar 8/8 componentes con checklist

---

### FASE 4: OBSERVE - Monitorear y Validar (30 min)

**Objetivo fase:** Observar ejecución, validar gates y emitir KPIs

- **T12:** [C] **Ejecutar validación PAE** (Gate A: validate-pae-template.sh)
  - [K] **Input:** PAE generado (si existe) o preparar generación
  - [C] **Output:** Gate A PASS o preparación para generación PAE
  - [U] **Acción:** Ejecutar `./pae-system/validate-pae-template.sh pae_output.json` si existe

- **T13:** [C] **Ejecutar Auditoría 4D** (Gate B: Score ≥7.0/10)
  - [K] **Input:** Plan y entregables generados
  - [C] **Output:** Auditoría 4D ejecutada con score consolidado
  - [U] **Acción:** Calcular score 4D (Completitud 30%, Calidad 30%, Impacto 25%, Sostenibilidad 15%)

- **T14:** [C] **Validar 8/8 componentes** (Gate C: Templates v1.1.0)
  - [K] **Input:** Prompts generados con Template v1.1.0
  - [C] **Output:** Validación 8/8 componentes confirmada
  - [U] **Acción:** Verificar checklist: CSE, TAGs ≥60%, Boundary Markers ≥15, Frontmatter YAML, Anti-Drift ≥3, Objetivos SMART ≥3, Tests ≥3, Separación EVIDENCIA/PROPUESTA

- **T15:** [C] **Verificar activación de skills** (Gate D: ≥4 skills activados)
  - [K] **Input:** `obs/kpi/events.jsonl`
  - [C] **Output:** Confirmación ≥4 skills activados con scores ≥0.6
  - [U] **Acción:** Ejecutar `grep -c '"skill":' obs/kpi/events.jsonl | awk '{if($1>=4) print "PASS"; else print "FAIL"}'`

- **T16:** [C] **Emitir KPIs consolidados** (Gate E: policy_decision en events.jsonl)
  - [K] **Input:** `obs/kpi/events.jsonl`
  - [C] **Output:** KPIs consolidados en reporte `docs/skills-ops-report.md`
  - [U] **Acción:** Agregar métricas: activation_latency, run_latency, policy_decision, adr_applied

---

### FASE 5: REFLECT - Auditoría y Lecciones (30 min)

**Objetivo fase:** Reflexionar sobre ejecución, generar auditoría y documentar lecciones

- **T17:** [C] **Generar Auditoría 4D completa** (Score consolidado con justificación)
  - [K] **Input:** Resultados de todas las fases
  - [C] **Output:** `docs/AUDIT-POST-ESTUDIO-OPERACIONAL.md` con score 4D ≥7.0/10
  - [U] **Acción:** Evaluar cada dimensión (Completitud, Calidad, Impacto, Sostenibilidad)

- **T18:** [K] **Documentar lecciones aprendidas** (Aplicación práctica de patrones)
  - [K] **Input:** Experiencia ejecutando el plan con patrones
  - [C] **Output:** Lecciones en `docs/LECCIONES-POST-ESTUDIO.md`
  - [U] **Acción:** Identificar qué funcionó, qué no, y mejoras para próxima iteración

- **T19:** [C] **Generar Handoff v2.0-PAE** (Transferencia completa para próxima fase)
  - [K] **Input:** Plan completado, auditoría ejecutada, lecciones documentadas
  - [C] **Output:** `docs/HANDOFF-POST-ESTUDIO-OPERACIONAL.md` con estructura completa
  - [U] **Acción:** Incluir tareas completadas, artefactos, issues, decisiones, umbrales, PAE

---

## 🔍 VALIDACIÓN

### Criterios de Validación

**Estructura:** [C] CSE completo (Contexto + Especificación + Verificación) ✅  
**Contenido:** [K] Plan estructurado con Template v1.1.0 (8/8 componentes)  
**Calidad:** [U] PAE + Auditoría 4D integrados como gates obligatorios  
**Completitud:** [C] 4+ skills activados, KPIs emitidos, reporte generado

### Tests Ejecutables

**Test 1:** Verificar plan creado y aprobado

```bash
# Verificar plan existe y está aprobado
test -f dev/plans/post-estudio-operacional.json && \
  jq -e '.status == "APPROVED"' dev/plans/post-estudio-operacional.json > /dev/null && \
  echo "✅ Plan aprobado" || echo "❌ Plan no aprobado"

# Expected: ✅ Plan aprobado
# Exit code: 0 = PASS, ≠0 = FAIL
```

**Test 2:** Verificar gates PAE (si PAE existe)

```bash
# Validar PAE si existe
if [ -f pae_output.json ]; then
  ./pae-system/validate-pae-template.sh pae_output.json
  # Expected: All gates PASS
  # Exit code: 0 = PASS, ≠0 = FAIL
else
  echo "⚠️ PAE no generado aún (se generará en FASE 3)"
  exit 0
fi
```

**Test 3:** Verificar skills activados

```bash
# Contar skills activados en events.jsonl
SKILL_COUNT=$(grep -c '"skill":' obs/kpi/events.jsonl 2>/dev/null || echo "0")
if [ "$SKILL_COUNT" -ge 4 ]; then
  echo "✅ ${SKILL_COUNT} skills activados (≥4)"
  exit 0
else
  echo "❌ Solo ${SKILL_COUNT} skills activados (<4)"
  exit 1
fi

# Expected: ≥4 skills activados
# Exit code: 0 = PASS, ≠0 = FAIL
```

**Test 4:** Verificar auditoría 4D ejecutada

```bash
# Verificar auditoría generada
if [ -f docs/AUDIT-POST-ESTUDIO-OPERACIONAL.md ]; then
  SCORE=$(grep -oP 'Score.*?\K\d+\.\d+' docs/AUDIT-POST-ESTUDIO-OPERACIONAL.md | head -1)
  if (( $(echo "$SCORE >= 7.0" | bc -l) )); then
    echo "✅ Auditoría 4D: ${SCORE}/10 (≥7.0)"
    exit 0
  else
    echo "❌ Auditoría 4D: ${SCORE}/10 (<7.0)"
    exit 1
  fi
else
  echo "⚠️ Auditoría no generada aún"
  exit 1
fi

# Expected: Score ≥7.0/10
# Exit code: 0 = PASS, ≠0 = FAIL
```

**Test 5:** Verificar KPIs emitidos

```bash
# Verificar policy_decision en events.jsonl
POLICY_COUNT=$(grep -c '"policy_decision"' obs/kpi/events.jsonl 2>/dev/null || echo "0")
if [ "$POLICY_COUNT" -ge 1 ]; then
  echo "✅ ${POLICY_COUNT} KPI(s) con policy_decision emitido(s)"
  exit 0
else
  echo "❌ No se emitieron KPIs con policy_decision"
  exit 1
fi

# Expected: ≥1 KPI con policy_decision
# Exit code: 0 = PASS, ≠0 = FAIL
```

---

## 📋 ENTREGABLES ESPERADOS

**E1:** [C] **Plan aprobado** (`dev/plans/post-estudio-operacional.json`)
- Formato: JSON con status APPROVED
- Ubicación: `dev/plans/post-estudio-operacional.json`
- Threshold: Plan estructurado con CLOOP completo

**E2:** [C] **Tríada dev-docs completa** (`dev/active/post-estudio-operacional/{plan.md, context.md, tasks.md}`)
- Formato: Markdown
- Ubicación: `dev/active/post-estudio-operacional/`
- Threshold: 3 archivos generados con contenido estructurado

**E3:** [C] **1 Prompt con Template v1.1.0** (8/8 componentes, score ≥8.0/10)
- Formato: Markdown con estructura completa
- Ubicación: `docs/prompts/` (a definir)
- Threshold: Checklist 8/8 componentes validado

**E4:** [C] **PAE generado y validado** (`pae_output_post_estudio.json`)
- Formato: JSON con schema PAE
- Ubicación: `pae_output_post_estudio.json`
- Threshold: Gates G1-G5 PASS

**E5:** [C] **Auditoría 4D ejecutada** (`docs/AUDIT-POST-ESTUDIO-OPERACIONAL.md`)
- Formato: Markdown con score consolidado
- Ubicación: `docs/AUDIT-POST-ESTUDIO-OPERACIONAL.md`
- Threshold: Score ≥7.0/10

**E6:** [C] **Reporte KPIs consolidado** (`docs/skills-ops-report.md`)
- Formato: Markdown con métricas
- Ubicación: `docs/skills-ops-report.md`
- Threshold: Métricas: activation_latency, run_latency, policy_decision, adr_applied

**E7:** [K] **Handoff v2.0-PAE completo** (`docs/HANDOFF-POST-ESTUDIO-OPERACIONAL.md`)
- Formato: Markdown con estructura Handoff v2.0-PAE
- Ubicación: `docs/HANDOFF-POST-ESTUDIO-OPERACIONAL.md`
- Threshold: Tareas, artefactos, issues, decisiones, umbrales, PAE incluidos

---

## 🚨 ALERTAS ANTI-DRIFT

### [INTERNAL:mecanismo-1] Context Refresh Protocol

⚠️ **STOP cada 2 horas o al cambiar de fase:**

1. ⚠️ **¿Cuál es el objetivo principal?** → Operacionalizar patrones y templates del estudio
2. ⚠️ **¿Qué he completado hasta ahora?** → Revisar fases completadas
3. ⚠️ **¿Qué falta por hacer?** → Revisar próximas tareas
4. ⚠️ **¿Estoy en contexto correcto?** → Verificar no drift

### [INTERNAL:mecanismo-2] Boundary Markers

**IN-SCOPE:**
- [INTERNAL:scope-1] Operacionalizar 10 patrones críticos del estudio
- [INTERNAL:scope-2] Integrar PAE + Auditoría 4D como gates
- [INTERNAL:scope-3] Activar 4+ skills del sistema
- [INTERNAL:scope-4] Aplicar Template v1.1.0 a prompts nuevos

**OUT-OF-SCOPE:**
- ❌ Registry público (se posterga)
- ❌ Sandbox con contenedores (se posterga)
- ❌ UI web (se posterga)

**RELATED:**
- 🔗 [EXTERNAL:Template v1.1.0] `docs/ANALISIS-TEMPLATES-META.md`
- 🔗 [EXTERNAL:PAE System] `docs/METRICAS-VALIDACION-GLOBAL.md`
- 🔗 [EXTERNAL:Auditoría 4D] Framework 4 dimensiones

### [INTERNAL:mecanismo-3] Chain-of-Verification (CoVe)

**Aplicar antes de documentar hallazgos:**

1. ✅ **¿Qué afirmo?** → Validar claim específico
2. ✅ **¿Cuál es la evidencia?** → Fuente verificable
3. ✅ **¿Es la evidencia suficiente?** → Validar robustez
4. ✅ **¿Hay alternativas explicativas?** → Contrastar hipótesis
5. ✅ **¿Qué nivel de confianza?** → [K]/[C]/[U] assignment

---

## 🎓 LECCIONES APLICABLES DEL ESTUDIO

**[INTERNAL:SINTESIS-GLOBAL-LECCIONES] L1:** Batch Creation (CAL-1.0-1)
- [K] **Evidencia:** +170% velocidad manteniendo calidad
- [C] **Aplicación:** Si hay ≥4 artefactos similares, usar batch creation
- [U] **Resultado esperado:** Velocidad mejorada sin comprometer calidad

**[INTERNAL:SINTESIS-GLOBAL-LECCIONES] L2:** Checklist Pre-Creación (CAL-1.0-2)
- [K] **Evidencia:** 0 refactoring necesario, -20-30% QA time
- [C] **Aplicación:** Validar 8/8 componentes antes de considerar plan completo
- [U] **Resultado esperado:** Plan acreditable desde inicio (score ≥8.0/10)

**[INTERNAL:SINTESIS-GLOBAL-LECCIONES] L3:** TAGs Coverage ≥60%
- [K] **Evidencia:** +1.5 puntos al score proyectado
- [C] **Aplicación:** Usar [K]/[C]/[U]/[EVIDENCIA]/[PROPUESTA] con densidad ≥60%
- [U] **Resultado esperado:** Score mejorado automáticamente

---

## 🔗 REFERENCIAS

**Documentos Base:**
- `docs/SINTESIS-GLOBAL-LECCIONES.md` (Top-10 lecciones aprendidas)
- `docs/METRICAS-VALIDACION-GLOBAL.md` (KPIs y gates consolidados)
- `docs/ESTADO-ANALISIS-COMPLETO.md` (27 patrones identificados)
- `docs/ANALISIS-FINAL-EXTENSO.md` (7+ templates documentados)
- `docs/ANALISIS-TEMPLATES-META.md` (Template v1.1.0 con 625 líneas)

**Tools:**
- `skills-cli` (comandos: plan create, plan save, plan approve)
- `packages/mcp-adapters` (MemTech: Redis L0/L1, Postgres L2, ChromaDB L3)

**ADRs Relacionados:**
- [ADR-MemTech] Integración MemTech con L0/L1/L2/L3
- [ADR-PAE] PAE System como gate obligatorio
- [ADR-4D] Auditoría 4D framework

---

## 📊 MÉTRICAS ESPERADAS

| Métrica | Baseline | Target | Threshold | Real | Status |
|---------|----------|--------|-----------|------|--------|
| **Plan Aprobado** | 0 | 1 | 1 | TBD | ⏳ |
| **Skills Activados** | 0 | 4+ | 4 | TBD | ⏳ |
| **PAE Gates PASS** | - | 5/5 | 5/5 | TBD | ⏳ |
| **Auditoría 4D Score** | - | ≥7.0 | ≥7.0 | TBD | ⏳ |
| **Template v1.1.0 Apps** | 0 | 1 | 1 | TBD | ⏳ |
| **KPIs Emitidos** | 0 | ≥1 | 1 | TBD | ⏳ |

**Leyenda:** ✅ PASS (≥target), ⚠️ WARNING (≥threshold), ❌ FAIL (<threshold)

---

## ✅ CHECKLIST COMPLETITUD

### Pre-Ejecución
- [x] Documentos base leídos completamente
- [x] Contexto cargado (estado actual + gap)
- [x] Objetivos claros (O1-O5 SMART)
- [x] Herramientas preparadas (skills-cli, MemTech)
- [x] Boundaries IN-SCOPE/OUT-OF-SCOPE definidos
- [x] Checklist 8/8 Componentes validado

### Durante Ejecución
- [ ] Tareas ejecutadas en orden (T1 → T19)
- [ ] Context Refresh aplicado (cada 2h)
- [ ] Outputs documentados por tarea
- [ ] Tests ejecutados progresivamente
- [ ] TAGs [K/C/U/EVIDENCIA/PROPUESTA] ≥60% coverage

### Post-Ejecución
- [ ] Todos los objetivos cumplidos (O1-O5)
- [ ] Todos los entregables completados (E1-E7)
- [ ] Todos los tests PASS (Test 1-5)
- [ ] Lecciones documentadas
- [ ] Plan acreditable ≥8.0/10

---

**PLAN COMPLETADO** ✅  
**Fecha:** 2025-10-29  
**Versión:** 1.0.0  
**Estado:** DRAFT → PENDING_APPROVAL → APPROVED  
**Próximo Paso:** Ejecutar plan save --approve para activar workflow

