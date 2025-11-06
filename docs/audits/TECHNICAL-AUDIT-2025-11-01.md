# Auditoría Técnica Integral — Skills Fabrik (2025-11-01)

Autor: Auditoría de Ingeniería (Senior)

## Resumen Ejecutivo

- Monorepo pnpm con 9 paquetes activos (`packages/*`). Núcleo: `@skills-fabrik/skills-cli` (CLI), `@skills-fabrik/daemon` (API de activación/ejecución), `@skills-fabrik/router` (señales + pruebas), `@skills-fabrik/kpi` (métricas).
- Prompt Builder v2 bien integrado en CLI, con Template v1.1.0 (C1–C8), TAGs y heurística multi‑señal. Genera prompts útiles pero no garantiza activación si no hay señales de path/intent/content reales.
- Desalineación crítica entre el CLI y el daemon en los contratos de `/activate` (request/response schemas). Bloquea activación efectiva de skills pese a tener el daemon operativo.
- Dev‑docs (tríada) existen y se gestionan en `dev/active/*`. Calidad heterogénea: algunos planes completos (CLOOP + C8), otros placeholders.
- PM2/operación: tooling consistente (ecosystem, comandos CLI). Observabilidad y KPI razonables, con potencial de mejora en series temporales y precisión de “adherence”.

Recomendación prioritaria: alinear el contrato `/activate` (CLI ↔ Daemon) y endurecer validaciones automatizadas sobre la tríada dev‑docs. Ver “Plan de Remediación”.

---

## 1. Arquitectura y Paquetes

- Workspace: `pnpm-workspace.yaml` → `packages/*`.
- Paquetes con `package.json` (9):
  - `packages/skills-cli`, `packages/daemon`, `packages/router`, `packages/shared`, `packages/kpi`, `packages/mcp-adapters`, `packages/experimentation`, `packages/performance`, `packages/slash-commands`.
- Skills: `skills/**/SKILL.md` (19 en total; 16 productivos + 3 de test). Reglas declarativas: `configs/skill-rules.json` (13 entradas).
- Observabilidad/KPI: eventos en `obs/kpi/events.jsonl`, agregación en `packages/kpi/src/aggregator.ts`.

Diagramas lógicos (alto nivel):

```
CLI (@skills-fabrik/skills-cli)
  ├─ prompt-builder v2 → genera prompts (Template v1.1.0 + TAGs)
  ├─ skills activate/execute → llama daemon (/activate, /execute)
  └─ dev-docs → crea/actualiza/lista tríada en dev/active/

Daemon (@skills-fabrik/daemon)
  ├─ /list /activate /execute /metrics /health (Fastify)
  ├─ Schemas JSON (request/response) → validación
  └─ PM2 gestión (ecosystem, CLI wrappers)

Router (@skills-fabrik/router)
  └─ Señales de activación + pruebas de engine/guardrails
```

---

## 2. Prompt Builder v2 — Evaluación

Código clave: `packages/skills-cli/src/utils/prompt-builder-v2.ts`.

- Capacidades:
  - Detección de estructura del proyecto (monorepo, packages, memtech).
  - Heurística multi‑señal (keywords, intent, path, content) y hooks pre/post con score 4D.
  - Template v1.1.0 (C1–C8) y sistema de TAGs ([K:], [C:], [U:], [EVIDENCIA:]).
  - Multi‑skill y cobertura de TAGs.
- Integración CLI: `packages/skills-cli/src/commands/prompt-builder.ts` (opciones `--include-template`, `--include-tags`, `--show-score`, `--v2`).
- Evidencia de uso: prompt generado para migración Postgres guardado en `docs/generated-prompts/2025-11-01T04-06-44-064Z-plan-architect.md`.

Hallazgos:
- El score depende fuertemente de señales de `path`/`content`. Con solo keywords, el score (~0.24) no supera el umbral 0.6.
- Genera estructura sólida y metadatos útiles, pero no “activa” skills por sí mismo: necesita que el daemon acepte la request y que el entorno aporte señales reales.

Recomendaciones:
- Añadir “path hints” y “content snippets” basados en reglas `fileTriggers` (`configs/skill-rules.json`) para subir el 30% de Path/Content en prompts v2.
- Integrar verificación opcional de “archivos abiertos” (por ejemplo, a través de inputs `context.files`) cuando se use con editores o pipelines.

---

## 3. Daemon API — Contrato y Salud

Código clave: `packages/daemon/src/app.ts` y schemas:
- Request schema: `packages/daemon/schemas/activate.request.schema.json` (requiere `intent` y `context`, prohíbe propiedades extra).
- Response schema: `packages/daemon/schemas/activate.response.schema.json` (requiere `{ success, timestamp, results[] }`).

Hallazgo crítico:
- La implementación actual de `/activate` devuelve `{ labels, candidates, latency_ms }`, lo que viola el response schema y provoca `schema_mismatch` incluso si la request es válida. Además, el CLI envía `cwd`/`editor` fuera de `context`, lo que viola el request schema.

Impacto:
- Las activaciones fallan sistemáticamente; no hay “skills activadas” aunque PM2 muestre `sf-daemon` online.

Recomendación (bloqueante):
- Alinear ambos lados:
  1) CLI (`packages/skills-cli/src/commands/skills.ts`) debe enviar `{ intent, context: { files?, workingDirectory?, environment? }, options? }` y eliminar `cwd`/`editor` toplevel.
  2) Daemon debe responder según schema (`{ success, timestamp, results: [{ skillId, confidence, reason, metadata? }], metrics? }`).
- Añadir pruebas de contrato (request/response) en `packages/daemon/test/` y `packages/skills-cli/test/integration/`.

---

## 4. Dev‑Docs (Tríada) — Revisión

Ubicación: `dev/active/*`.

Muestras revisadas:
- `dev/active/cli-optimization-nav-hub/plan.md` — Completo, sigue CLOOP, C8 y lista métricas de éxito. Evidencia y propuesta claras.
- `dev/active/cli-optimization-nav-hub/context.md` y `tasks.md` — Placeholders generados por `dev-docs`. Requieren contenido real (archivos relevantes, dependencias, constraints y checklist accionable).
- `dev/active/completar-integracion-daemon-pm2/plan.md` — Extenso (CLOOP, fases, riesgos, entregables). Buena guía operativa para PM2.
- Otras carpetas (`plan-post-estudio-operacional`, `post-estudio-operacional`, tareas de prueba) muestran variación de calidad; hay plantillas sin completar.

Conclusión:
- El sistema de creación (`packages/skills-cli/src/commands/dev-docs.ts`) funciona y deja estructura; falta gobernanza para asegurar completitud antes de “Operate”.

Recomendaciones:
- Gate “Operate” con verificación automática de C1–C8 y checklist de métricas en `plan.md`.
- Autocompletar `context.md` usando PB v2 (detección de archivos, dependencias y rutas clave) y `skill-rules` para sugerir referencias reales.
- En `tasks.md`, sembrar subtareas derivadas de KPIs y riesgos (de `plan.md`) y vincularlas a owners.

---

## 5. Herramientas y Automatización

- CLI (comandos relevantes):
  - `prompt-builder` → `packages/skills-cli/src/commands/prompt-builder.ts`.
  - `skills activate/execute` → `packages/skills-cli/src/commands/skills.ts`.
  - `dev-docs` → `packages/skills-cli/src/commands/dev-docs.ts`.
  - `daemon` (PM2) → `packages/skills-cli/src/commands/daemon.ts`.
- PM2: `scripts/pm2/ecosystem.config.cjs` + guías en `docs/` y `skills/workflows/pm2-monitor/*`.
- KPI: `packages/kpi/src/aggregator.ts` — Métricas de velocidad/calidad, thresholds, resumen.
- Slash‑commands: `configs/slash-commands.json` (familia `dev-docs`, etc.).

Valoración:
- Conjunto sólido; facilita operación y documentación. Falta una “prueba de humo” automatizada post‑deploy que valide `/health`, `/activate` y `/execute` con schemas activos.

---

## 6. Testing y Calidad

- Router: pruebas en `packages/router/src/__tests__/` (activation engine, pre‑invoke, guardrails).
- CLI: E2E (Playwright) en `packages/skills-cli/test/e2e-real/*`, suites de seguridad y caos.
- Cobertura del daemon en endpoints clave es limitada (según `coverage/.../daemon/src/app.ts.html`, ramas no cubiertas).

Recomendaciones:
- Añadir pruebas de contrato schema (request/response) y “happy path” de activación real (score ≥ 0.6) con inputs que incluyan `context.files` y `activeFileContent` simulados.
- Añadir suite mínima para `dev-docs` que verifique que `plan.md` contiene C1–C8 y métricas marcadas.

---

## 7. KPIs y Observabilidad

- Agregador KPI (`packages/kpi/src/aggregator.ts`) reúne eventos (`obs/kpi/events.jsonl`) y calcula: activation rate, tokens/op, latencia media, progressive disclosure; adherence rate, zero errors, fix latency, guardrail effectiveness.
- ThresholdChecks: define estados pass/warning/fail.

Mejoras sugeridas:
- Normalizar eventos de activación (añadir `success`, `results.length`, top skill, score) para correlacionar con prompts v2 y reglas.
- Añadir panel de tendencias (por skill, por categoría) y precisión efectiva de activación (no solo “rate”).

---

## 8. Riesgos y Brechas

1) Contrato `/activate` desalineado (bloqueante). Impacta directa y negativamente en el valor del sistema.
2) Tríada dev‑docs inconsistente (riesgo medio). Placeholders no completados permiten “drift” entre plan y ejecución.
3) Falta de pruebas de contrato (riesgo medio). Cambios de schema no detectados hasta runtime.
4) Dependencia operacional en PM2 sin fallback claro (bajo). Documentado, pero con puntos ciegos si PM2 falla.

---

## 9. Plan de Remediación (Prioridades y Due‑Dates)

P0 — Semana 1:
- Alinear `skills activate` con `activate.request.schema.json` (enviar `{ intent, context, options }`). Ruta: `packages/skills-cli/src/commands/skills.ts`.
- Ajustar respuesta de `/activate` a `activate.response.schema.json`. Ruta: `packages/daemon/src/app.ts`.
- Agregar pruebas de contrato y e2e mínimas (CLI↔Daemon) en `packages/skills-cli/test/integration/` y `packages/daemon/test/`.

P1 — Semana 2:
- “Dev‑docs Guard”: script que valide C1–C8 + métricas marcadas antes de pasar a Operate. Integrar en `pnpm test:phase3-quick`.
- Enriquecer Prompt Builder v2 para extraer paths/snippets reales por `skill-rules` y aumentar el 30% Path/Content.

P2 — Semana 3:
- Extender KPIs con precisión de activación por skill y dashboard de tendencias.
- Añadir smoke‑test post‑deploy (health + activate + execute) a pipelines.

---

## 10. Apéndice — Evidencias y Rutas Consultadas

- Prompt generado: `docs/generated-prompts/2025-11-01T04-06-44-064Z-plan-architect.md`.
- Prompt Builder v2: `packages/skills-cli/src/utils/prompt-builder-v2.ts` (funcional).
- Documentación completa: `/dev/prompt-builder/v2-complete/`
- CLI comandos: `packages/skills-cli/src/commands/prompt-builder.ts`, `packages/skills-cli/src/commands/skills.ts`, `packages/skills-cli/src/commands/dev-docs.ts`, `packages/skills-cli/src/commands/daemon.ts`.
- Daemon: `packages/daemon/src/app.ts`, schemas en `packages/daemon/schemas/*.json`.
- Dev‑docs: `dev/active/cli-optimization-nav-hub/{plan.md,context.md,tasks.md}`, `dev/active/completar-integracion-daemon-pm2/{plan.md,context.md,tasks.md}`.
- KPI: `packages/kpi/src/aggregator.ts`.
- PM2: `scripts/pm2/ecosystem.config.cjs`, `skills/workflows/pm2-monitor/*`.

---

## 11. Recomendaciones Accionables (Checklist)

- [ ] Corregir payload de `skills activate` (usar `context` + `options`).
- [ ] Corregir respuesta de `/activate` (añadir `success`, `timestamp`, `results`).
- [ ] Añadir pruebas de contrato CLI↔Daemon.
- [ ] Implementar “Dev‑docs Guard” (validación C1–C8 + métricas) y bloquear “Operate” si falla.
- [ ] Mejorar Prompt Builder v2 con detección de paths/snippets reales por regla.
- [ ] Extender KPI con precisión de activación y tendencias.

