# Implementación Cursor-first → Editor-Agnóstico (Postgres-first) — Núcleo SFP v0.x
Fecha: 2025-10-29  
Versión: 0.3.0

## 1) Objetivo
Levantar un núcleo operativo y seguro para la biblioteca de skills con:
- **SFP v0.x** (endpoints `/activate`, `/execute`, `/list`, `/validate`, `/health`).
- **CLI único** (`sf`) con paridad de salida (`--json`) frente a los endpoints.
- **Policy Engine** deny-by-default con `allowed-tools` por skill y auditoría.
- **Storage** Postgres-first (canónico) + FS (fuente de verdad/fallback).
- **Tríada** operativa (plan.md / context.md / task.md) con evidencia en `obs/kpi/events.jsonl`.

Resultado esperado: flujo completo desde Cursor (glue) con latencia p95 `< 50 ms` en `/activate`, paridad CLI/editor y bloqueos de policy trazados.

## 2) Alcance
**In**: Daemon SFP, CLI `sf skills *`, Policy Engine mínimo, Postgres + migraciones, FS fallback, schemas JSON, glue Cursor (tasks/keybindings), pruebas de paridad y samples E2E locales.  
**Out**: registry público de skills, sandbox con contenedores, dashboards pesados, otros editores (se habilitan después).

## 3) Entregables
- `packages/daemon` (SFP v0.x + validación JSON Schema).
- `packages/cli` (`sf skills activate/execute --json`, alias de compat si aplica).
- `schemas/*.schema.json` para `activate/execute` request/response.
- `db/migrations/001_init.sql` + helper `ensurePostgresTables.ts`.
- `.vscode/tasks.json` + `.vscode/keybindings.json` (glue Cursor).
- `obs/kpi/events.jsonl` (fuente de evidencia).

## 4) Arquitectura mínima
- **SFP v0.x**: REST con validación de contratos.
- **Policy Engine**: middleware deny-by-default; lectura de `allowed-tools` desde SKILL.md/frontmatter.
- **Storage**: FS (L0, verdad y fallback) + Postgres (L2, canónico). Redis/Chroma deshabilitados por defecto.
- **CLI único**: wrappers de los endpoints; overhead ≤ 5 ms.

## 5) Fases y Gates
**F0 — Glue Cursor-first ✅ COMPLETADO**  
  ✓ Atajos Cursor/VSCode operativos (activate/execute/plan commit)  
  ✓ `obs/kpi/events.jsonl` registra activación y ejecución
**F1 — SFP + Schemas ✅ COMPLETADO**  
  ✓ Endpoints `/health`, `/list`, `/activate` (heurística mínima), `/execute` (dry-run), `/validate`  
  ✓ Validación request/response contra `schemas/*.schema.json`  
  ✓ CLI `sf skills activate/execute --json` con paridad estructural  
  ✓ Bench `/activate` p95 < 50 ms (n=100) y cache in-proc  
  ✓ Paridad CLI↔HTTP (schema + snapshot en CI)
**F2 — Policy mínima ✅ COMPLETADO**  
  ✓ Parser YAML/JSON para `allowed-tools` + mapa READ_ONLY por skill  
  ✓ Ejecutores read-only (fs.read/git.status/git.diff) con eventos enriquecidos (needs/allowed/denied)  
  ✓ Tests `pnpm test:policy:deny` / `test:policy:allow` y snapshot `/execute` (dry-run) en CI  
  ✓ Pipeline `pnpm f2:close` marca evidencia (policy_decision en JSONL y sf_events)
**F3 — Storage Postgres-first ✅ COMPLETADO**  
  ✓ Migraciones y helper activos; smoke PG + inserciones con extra (pg-smoke)  
  ✓ Gate F3: corre sin Redis/Chroma; `sf_events` recibe inserciones y fallback FS queda activo cuando PG_* no está presente
**F4 — Empaquetado + Policy granular (pre-write) ✅ COMPLETADO**  
  ✓ Empaquetado local (`sf skills pack/verify/install`) con manifest JSON validado y hash sha256 reproducible  
  ✓ Policy por acción: S0 allow, S1 challenge con `challenge_id`, S2/NET deny — enforcement sólo preflight (sin escritura real)  
  ✓ Evidencia automatizada en `obs/kpi/events.jsonl` y `sf_events.extra` + suite `pnpm test:pack|verify|install|policy:{s1,s2,net}`
**F5 — Confirm flow S1 (sandbox + TTL + rollback) ✅ COMPLETADO**  
  ✓ Challenge/confirm para operaciones S1 (`fs.write`) con TTL 120 s y token HMAC (`CONFIRM_SECRET`)
  ✓ Escrituras sólo dentro de `workspace/sandbox/` con plan limitado (≤ 50 archivos, ≤ 1.5 MB) y rollback plan documentado
  ✓ Contratos `/execute` actualizados (`challenge_id`, `confirm_token`, `write_plan`, `rollback_plan`, `requireConfirm`)
  ✓ Eventos trazan `policy_level:S1`, `challenge_id`, `confirm`, `write_scope:"sandbox"`, `ttl_ms`, `rollback_plan` en JSONL y PG
  ✓ Suite mínima: `test:confirm:s1:challenge` (403), `test:confirm:s1:badtoken` (401), `test:confirm:s1:ok` (200 + sandbox)
  ✓ `pnpm f5:close` orquesta la verificación y actualiza tríada/evidencias
**F6 — Observabilidad Prometheus 🚧 EN PROGRESO**  
  → Exponer `/metrics` con `daemon_info`, histogramas `skills_activation|execute_latency_ms`, `policy_decisions_total`
  → Instrumentar `/activate` y `/execute` para alimentar métricas y contadores
  → Pruebas: `test:metrics` (inyecta `/metrics`), `scripts/smoke-metrics.mjs`

## 6) Métricas (DoD)
- Latencia `/activate` p95 < 50 ms local.
- Overhead CLI ≤ 5 ms sobre endpoint.
- Eventos con `evidence_id` y `policy_decision` en JSONL y Postgres.
- Paridad exacta de estructura JSON CLI↔HTTP.
- Suite sample E2E local PASS sin servicios externos no declarados.

## 7) Pruebas clave
- **Paridad**: diff de salidas CLI vs HTTP en `activate`.
- **Policy**: negative test `fs.write` → 403 + evento.
- **Storage**: inserción en `sf_events` y lectura básica.
- **Glue**: atajos de editor disparan el flujo completo.

## 8) Riesgos y mitigación
- Deriva CLI/editor → contratos JSON Schema + tests de paridad.
- Latencias > 50 ms → caché in-proc para `/activate`, perfiles de ruta caliente.
- Ruido de reconexión (Redis/Chroma) → deshabilitados por defecto; solo opt-in.

## 9) GO/NO-GO (hit list)
- **GO**: F0/F1/F2 gates cumplen; Postgres inicializado; eventos trazados en JSONL y DB.  
- **NO-GO**: paridad rota, política sin rastro, latencia fuera de umbral.
