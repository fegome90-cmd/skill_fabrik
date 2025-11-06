# Task (Sprint actual)

Estado de tareas
- [x] F0: Scaffolding shared + dev docs (sin cambios de runtime)
- [x] Análisis PM2/daemon/hooks/skills y riesgos
- [x] F1: Daemon usa loadSkillRulesCached (flag SF_USE_SHARED_RULES=1)
- [x] F1a: Hardening PM2/Daemon (startup‑manager fix; stats en /health)
- [x] F2 (opt‑in): Daemon usa computeSignals(shared) (flag SF_USE_SHARED_SIGNALS=1)
- [x] DX Prompt Builder v2: `--raw`/`--no-audit` + tracking `--track`
- [x] Enriquecer reglas prioritarias (intent/path/content)
- [x] Dataset de activaciones reales (prompts.txt + batch/daily)
  (Wrappers universales serán implementados por otro agente; nosotros publicamos contrato/CLI spec en docs)

Foco de skills (prioridad)
- backend-dev-guidelines (P1)
- frontend-dev-guidelines (P1)
- database-verification (P1)
- secrets-and-config (P1)

Bloqueos/Dependencias
- Esperar Phase 1 del otro agente para usar registry regenerado (19 skills) en dataset A/B.
- Esperar Phase 2 para validar flujos con wrappers universales; mientras, usar import directo/HTTP.

No duplicar esfuerzo (coordinación)
- No tocar (propiedad de otro agente):
  - `skills/**/SKILL.md`, `packages/router/src/pre-invoke.ts`, `packages/router/src/stop.ts`, `.cursor/hooks/*`.
- Tocar (nuestro scope):
  - Daemon (`packages/daemon/**`), PM2 scripts, shared activation (`packages/shared/src/activation/**`), Prompt Builder DX.
- Interfaces compartidas (contrato):
  - skill‑rules.json: `promptTriggers.{keywords[], intentPatterns[]}`, `fileTriggers.{pathPatterns[], contentPatterns[]}`.
  - Pre‑invoke input: `{ prompt, openFiles[], activeFileContent?, cwd }` → output `{ injectedNote?, activated[], metadata }`.
  - Stop input: `{ editLog[], reposChanged:Set<string>, cwd }` → output `{ formatted[], typecheck[], hints?, autoResolved, kpiEvent }`.

Backlog (orden sugerido)
1) Shared (listo): scaffold de computeSignals/loader + dev docs.
2) Daemon – rules loader (flag): usar loadSkillRulesCached(cwd) cuando SF_USE_SHARED_RULES=1.
3) Daemon – shared signals (flag): computeSignals(shared) cuando SF_USE_SHARED_SIGNALS=1; endpoint /debug/signals (solo lectura) para comparar.
4) CLI – DX Prompt Builder v2: flags --raw/--no-audit; comando de validación (usa skills activate --intent … --json) sin efectos.
5) Router – comparador (opcional): modo explicación que muestre señales compartidas (solo lectura), sin cambiar activation engine.
6) PM2 – startup-manager: corregir clase (EnhancedServiceManager) y probar start/health; actualizar README con receta.
7) Daemon – readiness opcional: emitir `process.send('ready')` tras listen (solo si se usa wait_ready en el futuro).
8) Daemon – quitar execSync en reglas: reemplazar por loader con cache por mtime (ya cubierto por 2), y convertir quality lint a ejecución asíncrona no bloqueante.
9) Daemon – telemetría: exponer en /health stats de cache (hits/misses/evictions/ttl) y memoria/CPU para PM2 monitoreo.
10) Daemon – /debug/signals (GET): devolver señales actuales y (si flag on) señales compartidas para comparativa A/B (enmascarar contenido sensible).
11) PM2 – cluster & Redis: prueba de humo con PM2_CLUSTER=1 + SF_STATE_REDIS=1 y verificación de coherencia /api/cache/stats.
12) Skills – enriquecer reglas: añadir `intentPatterns`, `fileTriggers.pathPatterns` y `fileTriggers.contentPatterns` para skills prioritarios (backend/frontend/database/secrets).
13) Dataset activaciones: compilar prompts y contextos (openFiles/contents) reales para A/B (daemon/router) y ajustar threshold/pesos si es necesario.
14) Guardrails e2e: ejecutar casos de test-guardrails y verificar SUGGEST/WARN/BLOCK en stop hook, incluyendo KPIs.

Notas de coordinación
- Si el otro agente cambia la forma de salida de los wrappers, mantendremos backward‑compat en nuestra validación leyendo ambos formatos (spec actual y una variante con `result` wrapper) sin romper flujos.

Roadmap por PR y tareas
- PR‑1: Daemon – shared rules loader (flag)
  - Integrar `loadSkillRulesCached(cwd)` detrás de `SF_USE_SHARED_RULES=1` con fallback legacy.
  - Añadir stats de cache a `/health` (hits, misses, evictions, ttl) sin bloquear.
  - Pruebas: bench p50/p95; snapshot de /activate; revisar logs.
  - Estado: COMPLETADO

- PR‑2: PM2 – startup‑manager hardening
  - Corregir clase instanciada (usar `EnhancedServiceManager`).
  - Verificar `start`/`health`; documentar que ecosystem deps/health son informativos.
  - Añadir receta de operación (start, restart `--update-env`, logs).
  - Estado: COMPLETADO

- PR‑3: Prompt Builder DX
  - Implementar `--raw` y `--no-audit`; no cambiar defaults.
  - Implementar `--validate` (llama `skills activate --intent` y marca pass/fail ≥0.6).
  - Mantener salida en `docs/generated-prompts` y pruebas mínimas.
  - Estado: EN PROGRESO (añadido `--raw`/`--no-audit` y tracking CLI)

  (Wrappers CLI los implementa el otro agente; nosotros definimos la especificación y no haremos cambios en scripts/hooks/*)

- PR‑4: Daemon – shared signals + /debug/signals (flag)
  - Integrar `computeSignals` shared con `SF_USE_SHARED_SIGNALS=1`.
  - Exponer `/debug/signals` (GET) con señales actuales y (si flag) compartidas; redactar contenido sensible.
  - A/B interno: comparar señales/scores y registrar deltas.
  - Estado: COMPLETADO (flag opt‑in y endpoint `/debug/signals` listo; `pnpm pb2:signals` guarda JSONL)

- PR‑5: Reglas de skills (enriquecimiento)
  - Backend/Frontend/Database/Secrets: añadir `intentPatterns`, `fileTriggers.pathPatterns`, `fileTriggers.contentPatterns`.
  - Ejecutar `pnpm skills:lint --strict` y validar activaciones en CLI.

- PR‑6: Dataset de activaciones reales
  - Compilar 15–25 prompts + `openFiles` y `activeFileContent` representativos.
  - Correr A/B (daemon/router); snapshot de resultados; calcular p95 y tasa de activaciones.
  - Proponer ajustes de threshold/pesos si procede.
  - Estado: EN PROGRESO (prompts.txt ampliado; pb2:batch/pb2:daily activos)

- PR‑7: Guardrails E2E
  - Ejecutar `test-guardrails` y verificar SUGGEST/WARN/BLOCK en stop hook.
  - Revisar KPIs (events.jsonl) y ajustar patrones si es necesario.

- PR‑8: Cluster & Redis smoke
  - Lanzar PM2 con `PM2_CLUSTER=1` y `SF_STATE_REDIS=1`.
  - Validar coherencia de `/api/cache/stats` y latencia p95.

Checklists de aceptación
- Loader: sin execSync; cache por mtime; JSON válido; fallback vacío.
- Señales: paridad ±2% en dataset de intents/ctx; latencia ≤ +5% p95.
- Builder: salida “raw” disponible; validación CLI imprime pass/fail (≥0.6) sin side‑effects.
- PM2/Health: /health OK; sin errores en logs; envs documentados.
- Startup-manager: `start` y `health` funcionando; dependencias respetadas; sin NameError.
- Daemon debug: /debug/signals disponible cuando flag; no expone datos sensibles.
- Cluster: cache coherente entre instancias con SF_STATE_REDIS=1.
- Reglas: incremento de precisión (TP/FP) medido sobre dataset; activaciones no dependen solo de keywords.
- E2E guardrails: violaciones esperadas SUGGEST/WARN/BLOCK detectadas; KPIs escritos.

Rollback
- Desactivar flags (`SF_USE_SHARED_RULES=0`, `SF_USE_SHARED_SIGNALS=0`).
- Revertir a computeSignals y loader legacy; usar bench/snapshot para verificación rápida.
 - No revertir cambios en `skills/**` ni en lógica de hooks del router (propiedad del otro agente).

No‑Mess Left Behind
- Stop hook sin cambios de contrato; idempotente; auto‑resolver bajo control.

Notas de implementación
- Flags no activados por defecto; cambios en PRs pequeños y reversibles.
- Evitar mezclar docs: mantener plan.md, task.md y context.md en dev/agent-dev-docs/.
- PM2: los campos custom en ecosystem son informativos; usar startup-manager para orquestación real.
- Evitar mezcla de docs: consolidar resultados y decisiones sólo en este directorio.

Comandos de prueba (referencia)
- PM2 start: `pm2 start scripts/pm2/ecosystem.config.cjs --env development`
- Startup-manager: `node scripts/pm2/startup-manager.mjs start development`
- Health: `curl -s http://127.0.0.1:7727/health | jq`, `curl -s http://127.0.0.1:7727/api/cache/stats | jq`
- Skills index: `skills-cli skills index ./skills --out ./registry/index.json`
- Lint skills: `pnpm skills:lint --strict`
- Activación CLI: `skills-cli skills activate --intent "crear endpoint auth" --json`
- Bench: `node scripts/bench-activate.mjs N=100`
- Snapshots: `node scripts/snapshot-activate.mjs`, `node scripts/snapshot-execute.mjs`
- Hooks (import directo): ver ejemplos en context.md (Node/HTTP)
- PBv2 tracking: `pnpm pb2:track --desc "<texto>" --skills backend-dev-guidelines,frontend-dev-guidelines,database-verification,secrets-and-config --threshold 0.6`
- PBv2 report: `pnpm pb2:report`
 - PBv2 smoke (dataset P1): `pnpm pb2:smoke`
 - PBv2 daily: `pnpm pb2:daily`

Registro de progreso (PBv2)
- Eventos: `dev/agent-dev-docs/pb2-activations.jsonl`
- Reporte diario: `dev/agent-dev-docs/pb2-daily-YYYY-MM-DD.json`
- Dataset: `dev/agent-dev-docs/prompts.txt`

Calibración (acciones)
- Dataset con contexto: `dev/agent-dev-docs/prompts-context.jsonl`
- Activación con contexto: `pnpm activate:batch && pnpm activate:report`
- Barrido de umbral/pesos: `pnpm activate:sweep && pnpm activate:select`
- Señales por intent: `pnpm pb2:signals` (usa `/debug/signals`)
- Guía y límites: `dev/agent-dev-docs/ALERTA-ACTIVATION-CONFIG.md`
