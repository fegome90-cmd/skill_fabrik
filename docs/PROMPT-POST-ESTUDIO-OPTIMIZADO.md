# 🎯 PROMPT OPTIMIZADO: Planificar Etapa Post-Estudio

**Generado**: 2025-10-29  
**Target Skill**: `plan-save-workflow`  
**Score Esperado**: ≥0.8/1.0 (✅ ACTIVARÍA)  
**Heurística**: Multi-señal (keywords 20%, intent 30%, path 30%, content 20%)

---

## 📝 PROMPT PARA USAR EN CURSOR

```
Guardar plan, save plan, aprobar: Planificar la siguiente etapa post-estudio operacionalizando los patrones y templates aprendidos del análisis extenso. Crear, aprobar y guardar un plan estructurado usando Template v1.1.0 (8/8 componentes), integrar PAE + Auditoría 4D como gates obligatorios, activar skills de workflows (plan-save-workflow), guardrails (database-verification, secrets-and-config) y guidelines (backend-dev, project-catalog), y generar la tríada dev-docs completa (plan.md, context.md, tasks.md) con conexiones MemTech activas (Redis L0/L1, Postgres L2, ChromaDB L3 legacy).

Abre/edita estos archivos:
- dev/plans/post-estudio-operacional.json
- dev/active/post-estudio-operacional/plan.md
- dev/active/post-estudio-operacional/tasks.md
- packages/skills-cli/src/commands/plan.ts
- configs/skill-rules.json

El archivo debería contener:
```
"status": "APPROVED"
plan.md
context.md
tasks.md
```

Acciones específicas:
1. Crear plan estructurado usando CLOOP (Clarify → Layout → Operate → Observe → Reflect)
2. Aplicar Template v1.1.0 (8/8 componentes: Frontmatter YAML, ROL, CONTEXTO, OBJETIVOS SMART, TAREAS, VALIDACIÓN, ENTREGABLES, ANTI-DRIFT)
3. Integrar PAE como gate obligatorio antes de auditoría (G1-G5: existencia, schema, tests, critical gates, checksum)
4. Configurar Auditoría 4D (Completitud 30%, Calidad 30%, Impacto 25%, Sostenibilidad 15%) con threshold ≥7.0/10
5. Activar skills: plan-save-workflow (guardar plan aprobado), database-verification (verificar conexiones Redis/Postgres), secrets-and-config (validar .env)
6. Guardar plan con `skills plan save <id> --approve` para activar workflow completo
7. Verificar MemTech L1 snapshot generado automáticamente en Redis
8. Emitir KPIs a obs/kpi/events.jsonl (activation_latency, run_latency, policy_decision, adr_applied)

Patrones a aplicar del estudio:
- Batch Creation (CAL-1.0-1) si hay ≥4 artefactos similares
- Checklist Pre-Creación (CAL-1.0-2) validar 8/8 componentes antes de considerar completo
- TAGs coverage ≥60% ([K]/[C]/[U]/[EVIDENCIA]/[PROPUESTA])
- Handoff v2.0-PAE para transferencia completa entre fases
- Ejecutor Multi-Día si la etapa toma >1 día (con handoffs inter-día)

Objetivos SMART del plan:
- O1: Crear y aprobar plan post-estudio operacional (p95 activate <50ms)
- O2: Integrar PAE + Auditoría 4D como gates (≥7/8 checklist PAE)
- O3: Aplicar Template v1.1.0 a 3 prompts críticos nuevos (8/8 componentes cada uno)
- O4: Activar 4+ skills (guardrails: db-verification, secrets; workflows: plan-save-workflow, pm2-monitor; guidelines: backend-dev, project-catalog)
- O5: Emitir KPIs consolidados y reporte docs/skills-ops-report.md

Tests ejecutables de validación:
- Gate A (PAE): ./pae-system/validate-pae-template.sh pae_output.json (PASS)
- Gate B (4D): Score ≥7.0/10
- Gate C (Templates): Verificar 8/8 componentes v1.1.0 en cada prompt generado
- Gate D (Skills): Verificar ≥4 skills activados en obs/kpi/events.jsonl
- Gate E (KPIs): grep -c '"policy_decision"' obs/kpi/events.jsonl ≥ 1

Referencias críticas (leer ANTES de ejecutar):
- docs/SINTESIS-GLOBAL-LECCIONES.md (Top-10 lecciones: Batch Creation, Checklist Pre-Creación, TAGs ≥60%, Auditoría 4D, PAE, Handoff v2.0-PAE, etc.)
- docs/METRICAS-VALIDACION-GLOBAL.md (KPIs consolidados, gates PAE G1-G5, Auditoría 4D scores, thresholds)
- docs/ESTADO-ANALISIS-COMPLETO.md (27 patrones identificados listos para usar: CLOOP, Templates, PAE, Handoffs, etc.)
- docs/ANALISIS-FINAL-EXTENSO.md (7+ templates documentados: v1.1.0, Lite, Handoff, Calibración)
- docs/ANALISIS-TEMPLATES-META.md (TEMPLATE-PROMPT-ESPECIALIZADO-v1.1.0 con 625 líneas, 8 componentes críticos)

Contexto del estudio completado:
- 39+ prompts analizados (~20,000+ líneas)
- 27 patrones identificados y documentados
- 7+ templates validados con scores ≥8.0/10
- Lecciones consolidadas: Batch Creation +170% velocidad, Checklist Pre-Creación -20-30% QA time, TAGs ≥60% crítico para score, PAE -60-80% tiempo auditoría, Handoff v2.0-PAE obligatorio para transferencia completa
```

---

## 📊 DESGLOSE DE SEÑALES

### Keywords (20%): ✅
- "guardar plan", "save plan", "aprobar", "dev-docs", "tríada"
- Match: 5/5 keywords → **0.2 puntos**

### Intent Patterns (30%): ✅
- `(guardar|save).*plan` → ✅ MATCH ("Guardar plan")
- `generar.*dev-docs` → ✅ MATCH ("generar la tríada dev-docs")
- `crear.*tríada` → ✅ MATCH ("generar la tríada dev-docs")
- **3/3 patterns matched → 0.3 puntos**

### Path Patterns (30%): ✅
- `dev/plans/**/*.json` → ✅ MATCH ("dev/plans/post-estudio-operacional.json")
- `dev/active/**/*` → ✅ MATCH ("dev/active/post-estudio-operacional/plan.md")
- **2/2 paths matched → 0.3 puntos**

### Content Patterns (20%): ✅
- `"status":\s*"APPROVED"` → ✅ MATCH (en archivos sugeridos)
- `plan.md` → ✅ MATCH
- `context.md` → ✅ MATCH
- `tasks.md` → ✅ MATCH
- **4/4 patterns matched → 0.2 puntos**

### Score Total: **1.0/1.0** ✅
**Threshold**: 0.6  
**Activaría skill**: ✅ **SÍ** (score 1.0 ≥ 0.6)

---

## 🎯 INSTRUCCIONES DE USO

1. Copia el prompt completo (sección "PROMPT PARA USAR EN CURSOR")
2. Abre los archivos sugeridos en tu editor
3. Pega el prompt en Cursor
4. El skill `plan-save-workflow` se activará automáticamente (score 1.0/1.0)
5. Ejecuta `skills plan save <id> --approve` después de crear el plan

---

## 💡 MEJORAS APLICADAS DEL ESTUDIO

- ✅ Template v1.1.0 estructura incorporada (8/8 componentes)
- ✅ CLOOP metodología aplicada
- ✅ PAE + Auditoría 4D como gates
- ✅ Patrones Batch Creation y Checklist Pre-Creación mencionados
- ✅ TAGs system sugerido ([K]/[C]/[U]/[EVIDENCIA]/[PROPUESTA])
- ✅ Handoff v2.0-PAE para transferencia
- ✅ KPIs y observabilidad integrados

---

**Generado por**: Prompt Builder + Lecciones del Análisis Extenso  
**Fecha**: 2025-10-29  
**Estado**: ✅ LISTO PARA USAR

