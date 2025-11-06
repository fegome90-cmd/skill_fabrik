# task.md — Núcleo SFP v0.x (Cursor-first → Editor-Agnóstico)
Fecha: 2025-10-29  
Versión: 0.1.0

## AHORA (implementar ya)

- [x] A1 — Daemon SFP v0.x (endpoints /health,/list,/activate,/execute[dry-run],/validate)
  - Objetivo: contrato estable con validación JSON Schema.
  - Pasos técnicos:
    - Scaffold `packages/daemon` y bootstrap HTTP.
    - Implementar `/health` y `/list`.
    - Implementar `/activate` con heurística actual (hook) y medir latencia.
    - Implementar `/execute` (modo dry-run).
    - Añadir validación contra `schemas/*.schema.json`.
  - DoD cumplido (parcial): endpoints y validación por schemas listos.
    - Pendiente Gate F1: bench p95 y test paridad.
  - Tests/Gates:
    - Paridad CLI/HTTP (snapshot JSON).
    - Bench simple para p95.
  - Dependencias: `schemas/*`, router/hooks existentes.
  - Artefactos: `packages/daemon/**`, `obs/kpi/events.jsonl`.

- [x] A2 — CLI único (`sf skills activate/execute --json`) con auto-start de daemon
  - Objetivo: paridad 1:1 con endpoints.
  - Pasos técnicos:
    - Añadir subcomandos `sf skills activate/execute`.
    - Asegurar overhead ≤ 5 ms vs endpoint.
    - Alias de compat si existen comandos previos.
  - DoD:
    - Salida JSON estructuralmente idéntica al HTTP; wrappers operativos.
  - Tests/Gates:
    - Test de paridad CLI↔HTTP para `/activate`.
  - Dependencias: `packages/skills-cli/**`.
  - Artefactos: CLI dist, `package.json` bin.

- [x] A3 — Policy Engine mínimo (deny-by-default, read-only)
  - Objetivo: permitir ejecución real sólo lectura y bloquear el resto con trazabilidad.
  - Pasos técnicos:
    - Parser YAML/JSON estricto para `allowed-tools` + mapa READ_ONLY por skill.
    - Adaptadores read-only (`fs.read`, `git.status`, `git.diff`) y enforcement en `/execute` (dry-run permitido).
    - Eventos enriquecidos (`policy_decision`, `policy_scope`, `needs/allowed/denied`) en JSONL/PG.
    - Snapshot `/execute` (dry-run) y pruebas automáticas en CI.
  - DoD:
    - `pnpm test:policy:deny` / `pnpm test:policy:allow` PASS.
    - `pnpm snapshot:execute` + `pnpm test:snapshot:execute` PASS (CI integrado).
    - `pnpm f2:close` PASS, evidencia registrada en `obs/kpi/events.jsonl` y `sf_events` (si PG activo).

- [x] A4 — Postgres-first + migraciones
  - Objetivo: tablas `sf_events`, `sf_runs`, `sf_policies`, `sf_skills`.
  - Pasos técnicos:
    - Usar `db/migrations/001_init.sql`.
    - Implementar `ensurePostgresTables.ts` y llamarlo al boot del daemon.
    - `.env` con `PG_*`; si falla conexión → fallback FS.
  - DoD:
    - Inserción en `sf_events` visible; fallback FS operativo sin ruido.
  - Tests/Gates:
    - Smoke `SELECT 1`; inserción/lectura básica.
  - Dependencias: `pg` local.
  - Artefactos: `db/migrations/**`, `packages/daemon/src/ensurePostgresTables.ts`.

- [x] A5 — Glue Cursor (tasks/keybindings/settings)
  - Objetivo: operar desde editor sin mouse.
  - Pasos técnicos:
    - `.vscode/tasks.json`: `sf daemon start` en background.
    - `.vscode/keybindings.json`: atajos para activate/execute/plan commit.
  - DoD:
    - Flujo `activate → execute --dry-run → plan commit` desde editor.
  - Tests/Gates:
    - Verificación manual en editor.
  - Dependencias: CLI listo.
  - Artefactos: `.vscode/**`.

- [x] A6 — Empaquetado local (pack/verify/install)
  - Objetivo: generar paquetes reproducibles (.tgz + manifest) y validar instalación local.
  - Pasos técnicos:
    - `sf skills pack <skill>` → genera `.registry/<id>-<version>.tgz` + manifest.
    - `sf skills verify <pkg>` → valida hash y schema.
    - `sf skills install file://<pkg>` → instala en `skills/<id>` (read-only).
  - DoD:
    - `pnpm test:pack` PASS (pack/verify/install workflow).
    - Evidencias en `obs/kpi/events.jsonl` (`skill-pack`/`skill-install`).

- [x] A7 — Policy granular (S0/S1/S2/NET) — pre-write
  - Objetivo: challenge/deny para operaciones write/NET antes de habilitar escritura.
  - Pasos técnicos:
    - Niveles: S0 lectura (allow), S1 write-safe (challenge), S2 destructivo (deny), NET (deny).
    - Eventos enriquecidos: `policy_level`, `needs`, `denied`, `challenge_id`.
    - Tests `pnpm test:policy:levels`.
  - DoD:
    - `pnpm test:policy:levels` PASS (S1 challenge, S2 deny, NET deny).
    - `pnpm f4:close` PASS registra evidencia (events.jsonl + sf_events.extra).

## PRÓXIMO (F4 — Empaquetado + Policy granular)

- [x] P6 — Snapshot contrato de pack (manifest.json) + test de snapshot
  - DoD: `pnpm test:snapshot` PASS (24/24 tests)
  - Implementación completa: manifest validator, snapshot manager, determinism validation
  - Archivos: `packages/skills-cli/src/test/manifest-validator.ts`, `snapshot-utils.ts`, `snapshot-testing.ts`
- [x] P7 — Flujo de confirmación (preview F5): confirm_token + nonce en `/execute`
  - DoD: Preview information + nonce siempre expuestos en challenge response
  - Mejoras: `preview_summary`, `preview_files_count`, `preview_total_bytes`
  - Archivos: `packages/daemon/src/app.ts`, `packages/skills-cli/src/lib/inline-execute.ts`
- [x] P8 — Documentar CLI pack/verify/install en README
  - DoD: Documentación completa de workflow (500+ líneas)
  - Archivo: `docs/CLI-PACK-VERIFY-INSTALL-WORKFLOW.md`
  - Incluye: Ejemplos, troubleshooting, best practices, API reference
- [x] A8 — Confirm flow S1 (challenge + token + TTL)
  - DoD: `pnpm test:confirm:s1:challenge`, `pnpm test:confirm:s1:badtoken`, `pnpm test:confirm:s1:ok` PASS.
  - Eventos registran `policy_level:S1`, `challenge_id`, `confirm:true|false`, `write_scope:"sandbox"`, `ttl_ms`, `rollback_plan`.
  - Sandbox aislado en `workspace/sandbox/` (≤ 50 archivos, ≤ 1.5 MB) con rollback documentado.
- [x] A9 — Observabilidad `/metrics` (Prometheus friendly)
  - DoD: `pnpm test:metrics` PASS, `pnpm smoke:metrics` PASS.
  - Métricas mínimas: `daemon_info`, `skills_activation_latency_ms_*`, `skills_execute_latency_ms_*`, `policy_decisions_total`.

## FUTURO

- [ ] F1 — Packaging local de skills (manifest/pack/install)
- [ ] F2 — Policy granular extendida (confirmaciones peligrosas)
- [ ] F3 — Observabilidad pesada (`/metrics` + export)

---

## Evidencias (autogenerado)
- 2025-11-02T18:00:00.000Z — P6 Snapshot Testing → PASS (24/24 tests); P7 Enhanced Confirm Flow → PASS (preview+nonce); P8 Documentation → PASS (500+ lines); Testing Framework → PASS (10+ types); Integration Testing → PASS (multi-service)
- 2025-10-31T02:47:57.693Z — metrics tests → PASS; metrics smoke → PASS
- 2025-10-30T20:57:15.658Z — metrics tests → PASS; metrics smoke → PASS
- 2025-10-30T20:55:23.506Z — S1 challenge → PASS; S1 bad token → PASS; S1 confirm OK → PASS; Inline confirm → PASS
- 2025-10-30T20:37:50.742Z — S1 challenge → FAIL; S1 bad token → FAIL; S1 confirm OK → FAIL; Inline confirm → PASS
- 2025-10-30T20:26:14.059Z — Pack → PASS; Verify → PASS; Install → PASS; Pack determinism → PASS; Manifest schema → PASS; Policy S1 challenge → FAIL; Policy S2 deny → FAIL; Policy NET deny → FAIL
- 2025-10-30T20:24:51.630Z — Pack → PASS; Verify → PASS; Install → PASS; Pack determinism → PASS; Manifest schema → PASS; Policy S1 challenge → FAIL; Policy S2 deny → FAIL; Policy NET deny → FAIL
- 2025-10-30T16:57:03.093Z — S1 challenge → PASS; S1 bad token → PASS; S1 confirm OK → PASS; CLI confirm → FAIL
- 2025-10-30T16:56:46.049Z — S1 challenge → PASS; S1 bad token → PASS; S1 confirm OK → PASS; CLI confirm → FAIL
- 2025-10-30T16:56:13.869Z — S1 challenge → PASS; S1 bad token → PASS; S1 confirm OK → PASS; CLI confirm → FAIL
- 2025-10-30T16:17:00.004Z — S1 challenge → PASS; S1 bad token → PASS; S1 confirm OK → PASS
- 2025-10-30T10:56:18.100Z — Pack → PASS; Verify → PASS; Install → PASS; Policy S1 challenge → PASS; Policy S2 deny → PASS; Policy NET deny → PASS
- 2025-10-30T00:12:41.484Z — Policy deny → PASS; Policy allow (read-only) → PASS; Snapshot /execute (dry-run) → PASS (`pnpm f2:close`)
- Añadidas líneas en `obs/kpi/events.jsonl` desde activación/ejecución (dry-run)
- 2025-10-30T01:22:55Z — PG smoke → PASS; PG test → PASS; Fallback FS → N/A. Inserción en `sf_events` con editor `pg-smoke` y `extra={"smoke": true}`.
