# Contexto Operativo — Núcleo SFP v0.x (Cursor-first → Editor-Agnóstico)
Fecha: 2025-10-29  
Versión: 0.2.0

## Estado actual

**Sprint Post-hooks Investigation** — Actualizado: 2025-11-02T18:00:00.000Z
- P6 Snapshot Testing → ✅ PASS (24/24 tests)
- P7 Enhanced Confirm Flow → ✅ PASS (preview + nonce integrados)
- P8 CLI Documentation → ✅ PASS (500+ líneas documentadas)
- F6 Prometheus Metrics → ✅ PASS (endpoint /metrics completo)
- Testing Framework → ✅ PASS (10+ tipos, infraestructura avanzada)
- Integration Testing → ✅ PASS (multi-servicio validado)

**Integración F6** — Actualizado: 2025-10-31T02:48:03.892Z
- metrics tests → PASS
- metrics smoke → PASS

**Integración F6** — Actualizado: 2025-10-30T20:57:16.736Z
- metrics tests → PASS
- metrics smoke → PASS

**Integración F5** — Actualizado: 2025-10-30T20:55:53.217Z
- S1 challenge → PASS
- S1 bad token → PASS
- S1 confirm OK → PASS
- Inline confirm → PASS

**Integración F5** — Actualizado: 2025-10-30T20:38:00.043Z
- S1 challenge → FAIL
- S1 bad token → FAIL
- S1 confirm OK → FAIL
- Inline confirm → PASS

**Integración F4** — Actualizado: 2025-10-30T20:26:28.696Z
- Pack → PASS
- Verify → PASS
- Install → PASS
- Pack determinism → PASS
- Manifest schema → PASS
- Policy S1 challenge → FAIL
- Policy S2 deny → FAIL
- Policy NET deny → FAIL

**Integración F4** — Actualizado: 2025-10-30T20:25:27.499Z
- Pack → PASS
- Verify → PASS
- Install → PASS
- Pack determinism → PASS
- Manifest schema → PASS
- Policy S1 challenge → FAIL
- Policy S2 deny → FAIL
- Policy NET deny → FAIL

**Integración F5** — Actualizado: 2025-10-30T16:57:06.943Z
- S1 challenge → PASS
- S1 bad token → PASS
- S1 confirm OK → PASS
- CLI confirm → FAIL

**Integración F5** — Actualizado: 2025-10-30T16:56:52.954Z
- S1 challenge → PASS
- S1 bad token → PASS
- S1 confirm OK → PASS
- CLI confirm → FAIL

**Integración F5** — Actualizado: 2025-10-30T16:56:19.272Z
- S1 challenge → PASS
- S1 bad token → PASS
- S1 confirm OK → PASS
- CLI confirm → FAIL

**Integración F5** — Actualizado: 2025-10-30T16:17:01.678Z
- S1 challenge → PASS
- S1 bad token → PASS
- S1 confirm OK → PASS
- Inline helper (`scripts/make-confirm-token.mjs` + `sf skills confirm`) operativo; sandbox y rollback verificados

**Integración F4** — Actualizado: 2025-10-30T10:56:23.436Z
- Pack → PASS
- Verify → PASS
- Install → PASS
- Policy S1 challenge → PASS
- Policy S2 deny → PASS
- Policy NET deny → PASS
- `/execute` actualizado para F5: challenge/token con TTL 120 s, sandbox `workspace/sandbox/`, rollback plan y eventos confirm=true|false
- `/metrics` (Prometheus) en progreso — histogramas de activación/ejecución + contadores policy (`test:metrics`, `smoke:metrics`)

- **F0 Glue** — PASS (2025-10-29) · atajos Cursor operativos y evidencias en `events.jsonl`.
- **F1 SFP + Schemas** — PASS (p95 `/activate` < 50 ms; paridad CLI↔HTTP; snapshot/schema activos en CI).
- **F2 Policy mínimo** — PASS (2025-10-30T00:12:41Z):
  - `pnpm test:policy:deny` (403 con denied) · `pnpm test:policy:allow` (stdout con status/diff)
  - Snapshot `/execute` (dry-run) versionado (`contracts/snapshots/execute.dryrun.json`) + test
  - Eventos `policy_decision`, `policy_tool`, `policy_scope`, `needs/allowed/denied` en `obs/kpi/events.jsonl`
  - Pipeline `pnpm f2:close` registra evidencia y marca A3
- **F3 Storage Postgres-first** — PASS (smoke PG + inserciones con extra; fallback silencioso)

## Decisiones vigentes
1) **CLI único** (`sf`) con namespaces (`skill|plan|context|task|daemon`) y paridad JSON con endpoints.  
2) **Contratos SFP** versionados (`schemas/*.schema.json`) validados en CI.  
3) **Policy Engine** deny-by-default con `allowed-tools` por skill y confirmaciones para acciones peligrosas.  
4) **Storage**: FS (L0, verdad/fallback) + Postgres (L2 canónico). Redis/Chroma desactivados.  
5) **Evidencia**: `obs/kpi/events.jsonl` + tablas `sf_events`/`sf_runs` en Postgres.

## Interfaces (SFP v0.x)
- `/activate` → produce `labels @intent/@skill/@guard/@adr` + `candidates[]` + `latency_ms`.  
- `/execute` → respeta policy; devuelve `stdout`, `artifacts[]`, `changes[]`, `evidence_id`, `run_latency_ms`.  
- `/list`, `/validate`, `/health` → catálogo, verificación, liveness/latencia.

## Infra/vars recomendadas
- `.env`: `SF_ENDPOINT`, `SF_STORAGE_L0`, `SF_STORAGE_L1`, `PG_*`, `MEMTECH_*_ENABLED=false`.  
- Migraciones en `db/migrations/001_init.sql`; helper `ensurePostgresTables.ts` al iniciar daemon.
- Postgres-first preparado: si `PG_*` ausentes o falla conexión → fallback silencioso a FS (L0).

## Supuestos
- Editor principal: Cursor (compatible VS Code) con glue (`tasks.json`/`keybindings.json`).  
- Ejecución local (sin servicios externos obligatorios).  
- Nomenclatura **neutral** en archivos/IDs.

## Riesgos
- Divergencia CLI/editor → **tests de paridad** y schemas congelados.  
- Falta de DB local → fallback FS sin ruido + mensaje de diagnóstico.  
- Coste `tsc` en hooks → modos `--fast/--full` en runner.

## Próximos hitos
- F0 (glue) → F1 (SFP+Schemas) → F2 (Policy) → F3 (Postgres-first).  
- Luego: runner extendido, tríada mejorada, E2E multi-editor.

**Integración F1 — contratos**
- F1 PASS (p95 < 50 ms; Paridad PASS; Snapshot/Schema activos)

**Integración F3**
- PG smoke → PASS
- PG test → PASS
- Fallback silente activo cuando PG_* no está presente
