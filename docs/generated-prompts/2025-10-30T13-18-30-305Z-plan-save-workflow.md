guardar plan, save plan, aprobar: guardar `<Guardar plan, save plan, aprobar; plan, planificar, feature, proyecto; backend, endpoint, controller, service, route; redis, postgres, database; .env, API_KEY, TOKEN, PASSWORD; pm2, ecosystem, monitorear.

Tarea (F0 – Bootstrap, sin salir de alcance): Planificar y dejar Fase 0 en GO con contratos validados (schema+plantilla), heurística multi-señal con 2 casos, hooks mínimos especificados (pre-invoke/stop) y KPI smoke definido. No ejecutar, solo estructurar y dejar criterios/evidencia listos.

Abre/edita (solo referencia para activación; no modifiques fuera de F0):

- dev/plans/plan-skill-fabric.json
- dev/active/plan-post-estudio-operacional/{plan.md, context.md, tasks.md}
- configs/skill-rules.json
- configs/SKILL.template.md
- packages/router/src/pre-invoke.ts
- packages/router/src/stop.ts
- backend/src/controllers/AuthController.ts
- backend/src/services/*.ts
- obs/kpi/events.jsonl

Señales path+content (juntas):

- dev/plans/*.json → "status": "APPROVED"
- backend/src/controllers/*.ts → router.post(
- **/repository/**/*.{ts,js} → findMany(
- sql/* → SELECT * FROM
- adapters/redis/*.ts → redis.get
- .env* → API_KEY
- scripts/pm2/ecosystem.config.cjs → ecosystem

Contexto (lectura): documentos/plan-skill-fabric-cloop.md; docs/HANDOFF-POST-ESTUDIO-OPERACIONAL.md; docs/LECCIONES-APRENDIDAS-EJECUCION-PRACTICA.md; docs/ANALISIS-PLAN-INTEGRADO.md.

[K] Plan activo y handoff/lecciones documentados.
[C] Iniciar F0 – Bootstrap (contratos, hooks mínimos, heurística, KPI smoke).
[U] Riesgo: activación incompleta si faltan señales; gates sin evidencia.
[EVIDENCIA] dev/active/plan-post-estudio-operacional/{plan.md, context.md, tasks.md}; obs/kpi/events.jsonl (plan-save-workflow).
[PROPUESTA] Estructurar F0 con criterios de aceptación y 2 casos de activación.

Objetivo SMART (F0):

- Specific: Validar schema+plantilla, 2 casos activación, hooks mínimos, KPI smoke.
- Measurable: 4 criterios (A1–A4) PASS.
- Achievable: Sin ejecución; solo documentación/criterios.
- Relevant: Habilita Fase 1 sin deuda.
- Time-bound: 1 jornada.

Criterios de aceptación (A1–A4):

- A1 Contratos: `configs/skill-rules.schema.json` válido con regla ejemplo (plan-save-workflow). `SKILL.template.md` aplicado en un SKILL.md de muestra (≤400 líneas).
- A2 Heurística multi-señal: pesos 0.2/0.3/0.3/0.2, threshold 0.6. Casos:
  - Caso 1: “guardar plan, aprobar” + `dev/plans/*.json` + `"status":"APPROVED"` → activa `plan-save-workflow`.
  - Caso 2: “crear endpoint backend” + `backend/src/controllers/*.ts` + `router.post(` → activa `backend-dev-guidelines`.
- A3 Hooks mínimos:
  - Pre-invoke: inyecta “Skill Activation Check” cuando score ≥ 0.6, razones por señales.
  - Stop: salida “formatted + typecheck + hints” (sin auto-resolver si <5 errores).
- A4 KPI Smoke (formato):
  {"ts":"`<ISO>`","repo":"skills-fabrik","task":"F0 Bootstrap","skill":"plan-save-workflow","policy_decision":"allow","policy_tool":"plan-save","labels":["@intent:plan-approve","@skill:plan-save-workflow"]}

Casos de activación esperados:

- plan-save-workflow: “Guardar plan, save plan, aprobar” + `dev/plans/*.json` + `"status":"APPROVED"`.
- backend-dev-guidelines: “backend, controller, endpoint, route, service” + `backend/src/controllers/AuthController.ts` + `router.post(`.
- database-verification-find: “findMany(), pool.query, SELECT * FROM, redis.get”.
- secrets-and-config: “.env, API_KEY, TOKEN, PASSWORD”.
- pm2-monitor: “pm2, ecosystem, apps, monitorear”.

Template v1.1.0 (8/8) + TAGs ≥60% presentes.>`

Abre/edita estos archivos:

- dev/active/adr-skills-derivation/12-SKILLS-OVERVIEW.md
- dev/active/adr-skills-derivation/IMPLEMENTATION-ROADMAP.md
- dev/active/adr-skills-derivation/INVENTARIO-COMPLETO-ADRS.md

Template v1.1.0 aplicado (8/8 componentes):
  • C1: CSE_Completo ✅
  • C2: TAGs_Cobertura ✅ (3 tags)
  • C3: Boundary_Markers ✅
  • C4: Frontmatter_YAML ✅
  • C5: Anti_Drift ✅
  • C6: Objetivos_SMART ✅
  • C7: Tests_Ejecutables ✅
  • C8: Separacion_EVIDENCIA_PROPUESTA ✅

🏷️ TAGs aplicados:
  [K:PLAN-MANAGEMENT]
  [C:CLOOP-METHODOLOGY]
  [U:DEVELOPER-WORKFLOW]

⚠️ TAGs coverage: 30% (recomendado: ≥60%)

📊 Complejidad: medium — cobertura 80%, duración 8h

---

Audit 4D: 6.45/10
Tags: REVIEW
Summary: guardar plan, save plan, aprobar: guardar <PEGA_AQUI_TU_DESCRIPCION_COMPLETA>

Abre/edita estos archivos:

- dev/active/adr-skills-derivation/12-SKILLS-OVERVIEW.md
- dev/active/adr-skills-derivation/IMPLEMENTATION-ROADMAP.md
- dev/active/adr-skills-derivation/INVENTARIO-COMPLETO-ADRS.md

Template v1.1.0 aplicado (8/8 componentes):
  • C1: CSE_Completo ✅
  • C2: TAGs_Cobertura ✅ (3 tags)
  • C3: Boundary_Markers ✅
  • C4: Frontmatter_YAML ✅
  • C5: Anti_Drift ✅
  • C6: Objetivos_SMART ✅
  • C7: Tests_Ejecutables ✅
  • C8: Separacion_EVIDENCIA_PROPUESTA ✅

🏷️ TAGs aplicados:
  [K:PLAN-MANAGEMENT]
  [C:CLOOP-METHODOLOGY]
  [U:DEVELOPER-WORKFLOW]

⚠️ TAGs coverage: 30% (recomendado: ≥60%)

📊 Complejidad: medium — cobertura 80%, duración 8h...
