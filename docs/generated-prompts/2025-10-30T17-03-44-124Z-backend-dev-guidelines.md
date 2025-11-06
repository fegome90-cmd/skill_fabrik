create Guardar plan, save plan, aprobar; plan, planificar, feature, proyecto; backend, endpoint, controller, service, route; redis, postgres, database; .env, API_KEY, TOKEN, PASSWORD; pm2, ecosystem, monitorear.

Tarea (F0 – Bootstrap, sin salir de alcance): Planificar y dejar Fase 0 en GO con contratos validados (schema+plantilla), heurística multi-señal con 2 casos, hooks mínimos (pre-invoke/stop) y KPI smoke definido. No ejecutar; solo criterios/evidencia listos.

Abre/edita (referencia para activación):
- dev/plans/plan-skill-fabric.json
- dev/active/plan-post-estudio-operacional/{plan.md, context.md, tasks.md}
- configs/skill-rules.json
- configs/SKILL.template.md
- packages/router/src/pre-invoke.ts
- packages/router/src/stop.ts
- backend/src/controllers/AuthController.ts
- backend/src/services/*.ts
- obs/kpi/events.jsonl

Señales path+content:
- dev/plans/*.json → "status": "APPROVED"
- backend/src/controllers/*.ts → router.post(
- **/repository/**/*.{ts,js} → findMany(
- sql/* → SELECT * FROM
- adapters/redis/*.ts → redis.get
- .env* → API_KEY
- scripts/pm2/ecosystem.config.cjs → ecosystem

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
- A1 Contratos: `configs/skill-rules.json` conforme a `skill-rules.schema.json` (regla ejemplo: plan-save-workflow). `SKILL.template.md` aplicado (≤400 líneas).
- A2 Heurística: 0.2/0.3/0.3/0.2, threshold 0.6. Casos:
  - Caso 1: “guardar plan, aprobar” + `dev/plans/*.json` + `"status":"APPROVED"` → activa `plan-save-workflow`.
  - Caso 2: “crear endpoint backend” + `backend/src/controllers/*.ts` + `router.post(` → activa `backend-dev-guidelines`.
- A3 Hooks mínimos:
  - Pre-invoke: inyecta “Skill Activation Check” si score ≥ 0.6, con razones por señales.
  - Stop: salida “formatted + typecheck + hints” (sin auto-resolver si <5 errores).
- A4 KPI Smoke (formato):
  {"ts":"<ISO>","repo":"skills-fabrik","task":"F0 Bootstrap","skill":"plan-save-workflow","policy_decision":"allow","policy_tool":"plan-save","labels":["@intent:plan-approve","@skill:plan-save-workflow"]}

Casos de activación esperados:
- plan-save-workflow: “Guardar plan, save plan, aprobar” + `dev/plans/*.json` + `"status":"APPROVED"`.
- backend-dev-guidelines: “backend, controller, endpoint, route, service” + `backend/src/controllers/AuthController.ts` + `router.post(`.
- database-verification-find: “findMany(), pool.query, SELECT * FROM, redis.get”.
- secrets-and-config: “.env, API_KEY, TOKEN, PASSWORD”.
- pm2-monitor: “pm2, ecosystem, apps, monitorear”.

Template v1.1.0 (8/8) + TAGs ≥60%.

Abre/edita estos archivos:
- backend/src/controllers/AuthController.ts
- packages/mcp-adapters/src/examples/adapters-example.ts
- packages/mcp-adapters/src/examples/test-connections.ts

El archivo debería contener:
```
router.post('/endpoint', Controller.handler);
```

Template v1.1.0 aplicado (8/8 componentes):
  • C1: CSE_Completo ✅
  • C2: TAGs_Cobertura ✅ (8 tags)
  • C3: Boundary_Markers ✅
  • C4: Frontmatter_YAML ✅
  • C5: Anti_Drift ✅
  • C6: Objetivos_SMART ✅
  • C7: Tests_Ejecutables ✅
  • C8: Separacion_EVIDENCIA_PROPUESTA ✅

🏷️ TAGs aplicados:
  [K:BACKEND-ARCHITECTURE]
  [C:API-DEVELOPMENT]
  [K:DATABASE-CONNECTION]
  [C:INFRASTRUCTURE-SETUP]
  [K:TEMPLATE-SYSTEM]
  [C:DOCUMENTATION-STANDARDS]
  [U:PLANNING-WORKFLOW]
  [C:CLOOP-INTEGRATION]

📊 Complejidad: medium — cobertura 80%, duración 8h

---
Audit 4D: 7.05/10
Tags: DOC, APPROVED
Summary: create Guardar plan, save plan, aprobar; plan, planificar, feature, proyecto; backend, endpoint, controller, service, route; redis, postgres, database; .env, API_KEY, TOKEN, PASSWORD; pm2, ecosystem, monitorear.

Tarea (F0 – Bootstrap, sin salir de alcance): Planificar y dejar Fase 0 en GO con contratos validados (schema+plantilla), heurística multi-señal con 2 casos, hooks mínimos (pre-invoke/stop) y KPI smoke definido. No ejecutar; solo criterios/evidencia listos.

Abre/edita (referencia para activación):
- dev/plans/plan-skill-fabric.json
- dev/active/plan-post-estudio-operacional/{plan.md, context.md, tasks.md}
- configs/skill-rules.json
- configs/SKILL.template.md
- packages/router/src/pre-invoke.ts
- packages/router/src/stop.ts
- backend/src/controllers/AuthController.ts
- backend/src/services/*.ts
- obs/kpi/events.jsonl

Señales path+content:
- dev/plans/*.json → "status": "APPROVED"
- backend/src/controllers/*.ts → router.post(
- **/repository/**/*.{ts,js} → findMany(
- sql/* → SELECT * FROM
- adapters/redis/*.ts → redis.get
- .env* → API_KEY
- scripts/pm2/ecosystem.config.cjs → ecosystem

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
- A1 Contratos: `configs/skill-rules.json` conforme a `skill-rules.schema.json` (regla ejemplo: plan-save-workflow)...