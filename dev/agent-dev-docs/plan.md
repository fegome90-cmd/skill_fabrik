# Plan (Sprint actual)

Ventana del sprint
- Inicio: 2025‑11‑01 • Fin objetivo: 2025‑11‑08

Objetivos
- Optimizar activación de skills, Prompt Builder v2 y CLI sin romper flujos actuales.
- Unificar señales/reglas en módulo shared; hardening de daemon/PM2; mantener No‑Mess en hooks.
- Priorizar 4 skills de alto valor: backend-dev-guidelines, frontend-dev-guidelines, database-verification, secrets-and-config.
- Calibración fina con umbral/pesos SIN romper: usar scripts y variables controladas.

Alcance del sprint
- Shared Activation (opt‑in por flags), DX del Prompt Builder v2 (raw/no‑audit + validación), y operación estable con PM2 (health/metrics/cache/cluster opcional).

Fases
- F0 (hecho): Scaffolding + dev docs sin cambios de runtime.
- F1 (en curso): Daemon usa loader compartido (cache por mtime) con SF_USE_SHARED_RULES=1.
- F2 (planeado): Daemon usa computeSignals(shared) con SF_USE_SHARED_SIGNALS=1 (A/B + /debug/signals).
- F3 (planeado): DX Prompt Builder v2 (raw/no‑audit) y validación CLI; comparadores en CLI/Router (solo lectura).
- F1a (en curso): Hardening PM2/Daemon (startup‑manager fix, /health con stats, readiness opcional).
 - F4 (nuevo): Calibración controlada (threshold/pesos) con dataset de contexto y sweep.

Dependencias externas (otro agente)
- Phase 1: Registry completo (19 skills) y keyword extraction fijo.
- Phase 2: Wrappers universales (pre-invoke.mjs, stop.mjs) + sistema de configuración.
- Phase 3: Integración router↔daemon (mejoras de caching/señales) desde el lado del router.
→ Nuestro plan avanza en paralelo pero la validación A/B final se hace tras Phase 1 (dataset) y Phase 2 (wrappers) cuando estén disponibles.

## Calibración (no romper)
- Archivo alerta: `dev/agent-dev-docs/ALERTA-ACTIVATION-CONFIG.md`
- Dataset con contexto: `dev/agent-dev-docs/prompts-context.jsonl`
- Scripts:
  - `pnpm activate:batch && pnpm activate:report`
  - `pnpm activate:sweep && pnpm activate:select`
- Variables (daemon): `SF_ACTIVATION_THRESHOLD`, `SF_W_KEYWORDS|INTENT|PATH|CONTENT` (ver alerta)

PM2/Daemon (objetivos específicos)
- Orquestación con startup‑manager; dejar claro que "dependencies/health_check_*" en ecosystem son informativos.
- /health con métricas de cache (hits/misses/evictions/ttl), CPU/mem y uptime; /metrics Prometheus ya disponible.
- Compatibilidad: fork por defecto; cluster opt‑in (PM2_CLUSTER=1) + Redis opcional (SF_STATE_REDIS=1).

Entregables
- Flags opt‑in, endpoints de debug (solo lectura), DX de builder.
- Benchmarks y reporte A/B (latencia/activaciones) con criterios de aceptación.
- Cobertura de reglas ampliada (intent/path/content) para skills prioritarios y dataset de activaciones reales.
- Especificación/contrato para wrappers universales (implementación a cargo de otro agente).

KPIs y criterios de éxito
- Δ activaciones ≤ ±2% p95; Δ latencia p95 ≤ 5%.
- /health estable; sin errores P0; /metrics y /api/cache/stats responden en <100ms.
- Stop hook mantiene zero_errors_left_behind; KPIs escritos.
- Activaciones representativas (no solo keywords) y menor gap entre mocks (router tests) y producción (daemon/router + reglas reales).
- Hooks usables desde terminal/IDE (wrappers): comandos imprimen JSON y responden <150ms en escenarios simples.

Coordinación (evitar duplicar esfuerzo)
- Plan del otro agente (resumen):
  - Phase 1: Arreglar indexado y regenerar registry (skills.ts, parser, keywords).
  - Phase 2: Universal Hook Implementation (pre-invoke.mjs, stop.mjs, sistema de configuración de hooks).
  - Phase 3: Daemon Integration (mejorar integración router↔daemon; caching y señales).
  - Phase 4: Testing & Docs (validar 19 skills; documentación de integración).
- Fuera de alcance (otro agente): SKILL.md/registry, lógica de hooks (router), wrappers e integración router↔daemon.
- Nuestro alcance: daemon/PM2, shared activation core, DX Prompt Builder, métricas/health, contratos (skill‑rules.json y payloads), dataset y A/B.
- Integraciones acordadas:
  - skill‑rules.json: `promptTriggers.{keywords,intentPatterns}`, `fileTriggers.{pathPatterns,contentPatterns}`.
  - Wrappers: proveemos contrato/CLI spec; implementación a cargo del otro agente.
  - Pre‑invoke consultará al daemon si está activo; fallback local garantizado.

Riesgos y mitigación
- Drift de pesos/threshold → centralizar constantes en shared y validar con A/B.
- I/O bloqueante (execSync) → loader con cache/mtime; ESLint fix con spawn asíncrono.
- Plan‑check frágil → mover util a shared o importar desde dist del router.
- PM2 → usar startup‑manager; documentar que “dependencies/health_check_*” del ecosystem son decorativos.

Hecho / En curso / Próximo
- Hecho: módulo shared (computeSignals/rules‑loader), análisis PM2/daemon/hooks, dev docs y criterios de aceptación.
- En curso: F1 loader con flag, hardening PM2/daemon (stats en health), dataset de activaciones reales.
- Próximo: endpoint /debug/signals; DX Prompt Builder v2 (raw/no‑audit); enriquecer reglas priorizadas.

Notas
- Dev docs exclusivos: usar solo dev/agent-dev-docs/.
