# Agent Analyst Blueprint — Agnostic Implementation Guide

> Ejemplo de overlay de dominio y plan específico: `docs/AGENTE_ANALISTA_PLAN.md`

## Executive Summary

- Purpose: provide a vendor‑ and domain‑agnostic template to build “Analyst Agents” that orchestrate data ingestion/analysis pipelines, persist context in a memory layer, and expose results through a stable API/UI.
- Philosophy: adapters + contracts. Keep domain overlays out of core; plug different pipelines, storages, LLMs, and memory systems without changing the orchestration skeleton.

## Core Design (Adapters & Contracts)

- Adapters (interfaces)
  - PipelineAdapter: `run(inputs, mode) → { run_id }`, `status(run_id)`, `artifacts(run_id)`
  - StorageAdapter: `read_artifact(path|key)`, `write_artifact(path|key, data)`, backends `FS|S3|GCS`
  - MemoryAdapter: `health()`, `checkpoint(data)`, `search(query)`, `get(key)`, `set(key, value)`
  - LLMAdapter: `generate(messages, params)`, provider via env (`LLM_PROVIDER`, `LLM_API_KEY`, `LLM_BASE_URL`)

- Contracts (generic, domain‑neutral)
  - Series: `{ data: [{ t: ISO8601, y: number, unit?: string, meta?: object }] }`
  - Summary: `{ key: string, latest: number|string|object, ts: ISO8601, ref_lo?: number, ref_hi?: number, status?: 'low'|'normal'|'high'|'unknown', meta?: object }[]`
  - Issues: `{ type: string, scope: 'ingest'|'parse'|'normalize'|'persist'|'export', details: object, severity: 'info'|'warn'|'error' }[]`
  - Checkpoint: `{ run_id: string, ts: ISO8601, inputs: object, metrics: object, status: 'running'|'done'|'failed' }`

## Reference API (generic)

- GET `/api/query/summary` → Summary[]
- GET `/api/query/series?key=<id>` → Series
- GET `/api/query/samples?limit=K` → domain‑dependent records (optional)
- POST `/api/ingest` (multipart) → store inputs, trigger pipeline, return `{ run_id, processed }`
- GET `/api/validation` → metrics/validation report
- GET/POST `/api/settings` → configuration (ranges, mappings, thresholds)

Notes

- Add `X-Contract-Version: 1` header for explicit contract versioning.
- Serve static artifacts (plots/exports) under `/static/*` if needed.

## Orchestration (Agent Analyst)

1. Pre‑check memory: `MemoryAdapter.health()`; enforce policy (block or degrade).
2. Ingest inputs (files/URLs/records), persist raw in StorageAdapter.
3. Call `PipelineAdapter.run()`; await status or poll.
4. Load artifacts via `PipelineAdapter.artifacts(run_id)` → map to contracts (Series, Summary, Issues).
5. Persist `Checkpoint` + facts into MemoryAdapter (keys by `run_id`).
6. Expose results via API; UI polls or receives webhooks (optional).

State machine (per input)
`pending → extracting → normalizing → persisting → done | failed`

Idempotency

- Deterministic `run_id` (timestamp + hash of inputs + config). Never override previous runs; use symlink/alias `latest` for UX.

## Operational Specs (SLO/SLA & Budgets)

- Latency (local dev): p50 ≤ 150 ms, p95 ≤ 600 ms for `/api/query/*` once artifacts exist.
- Batch duration: set objective (e.g., N inputs ≤ T seconds). Budget separately for OCR/heavy compute.
- Provider costs (LLM/storage): daily cap; fail closed with circuit breaker on budget breach.

## Error Taxonomy & Retries (agnostic)

- INGEST_TIMEOUT, PARSE_FAIL, NORMALIZE_FAIL, PERSIST_FAIL, EXPORT_FAIL, PROVIDER_UNHEALTHY, CONTRACT_MISMATCH.
- Retries with exponential backoff for transient errors; at most once semantics for side‑effects.
- Degradation rules per phase (e.g., skip heavy steps, return partial summary with warnings).

## Observability

- Structured logs (JSON): `trace_id`, `run_id`, `phase`, `duration_ms`, `error_code`, `adapter`.
- Metrics: `runs_total`, `runs_failed`, `artifacts_generated`, `api_requests_total`, `api_errors_total`, `provider_errors_total`.
- Tracing: mark phase boundaries (ingest/parse/normalize/persist/export).

## Tool Call Governance & Evidence

- Require meta on every tool call envelope: `{ agentId, phase }` (validated server‑side before execution).
- For critical tools, require `evidence`: `{ tool_call_id, hash|link }`; store immutable audit log.
- Version tool contracts (JSON Schema) and validate on invocation (`schema_version`).

## Consensus & Policy Gates

- High‑risk actions behind consensus (e.g., 2‑of‑3 agent approvals) or staged confirmations.
- Tool policy layer per phase/agent: allow/deny lists, per‑tool rate limits, max duration/size.

## Streaming & Cancellation

- Prefer SSE/WebSocket for LLM streams and tool events; include server‑sent error/cancel frames.
- On user cancel, propagate to pending tools and mark task as cancelled with reason.
- On stream error, capture payload, degrade gracefully, and keep the runner alive.

## Provider Health & Budgets

- Health probes with short timeouts (≤5s) and cached results (TTL) to avoid probe storms.
- Circuit breaker (threshold + cooldown) for LLM/remote providers; expose status to router.
- Retries with exponential backoff + jitter on transient failures; stop on budget breach.

## Router & Budgets

- Intelligent routing by capability/score/cost; surface per‑provider latency and unit costs.
- Enforce daily cost caps; fail closed when exceeded and log policy breach.

## Security & Compliance

- Upload validation (MIME/size/extension), confined storage roots.
- PII‑safe logging; redact tokens; secrets only via env.
- CORS least privilege; rate limits for ingest endpoints.

## Concurrency & Backpressure

- One active run per `run_id`. Lock with file/mutex/kv.
- If new ingest arrives mid‑run, queue or 429 with “run in progress”.
- Optional in‑memory queue with max depth; shed load with 429 when saturated.

## Controlled Parallelization

- Policy‑driven worker pool with caps per phase (e.g., extract N, normalize M) and global max workers.
- Distinguish IO‑bound (paralelizables) vs CPU/OCR‑bound (limitar y serializar si necesario).
- Dynamic throttling by resource metrics (CPU, mem, IO wait) and queue depth; fairness among runs.
- Instrument per‑task timings; adapt pool sizes within safe bounds; expose current policy via `/api/runs/status`.

## Recovery & Rollback

- On failure: keep partial artifacts under `runs/<run_id>/`; don’t update alias `latest`.
- Rollback: relink alias `latest` to last stable run; log incident.

## Testing Matrix

- Adapters: unit tests with fakes (Pipeline/Storage/Memory/LLM).
- API: contract tests (shapes, error codes) and performance (latency p95).
- E2E: multi‑input batch with mixed quality (good/corrupt/heavy) and verify partial successes.
- Governance: tool calls without `{agentId, phase}` or missing `evidence` for critical tools must be rejected.

## Human‑in‑the‑loop & Feedback Batches

- Introduce a `waiting_feedback` state for inputs/issues that need human decision.
- Batch unresolved items and expose `/api/feedback/pending` → list; `/api/feedback/submit` → apply decisions.
- Define escalation rules: after K automated attempts or specific error codes, transition to feedback.
- Persist feedback decisions alongside checkpoints to improve future automation (policy updates).

## Capability Discovery & Tool Contracts

- Tool discovery endpoint (or registry) should expose: name, version, JSON Schema for args, constraints (time/size), and required meta/evidence.
- Validate requests against schema at gateway; return clear error codes (`CONTRACT_MISMATCH`, `META_MISSING`).
- Track `schema_version`; allow side‑by‑side versions during migrations.

## Configuration & Feature Flags

- Centralize config in `.env` + `agent.config.yaml` with typed parsing and defaults.
- Feature flags for risky capabilities (e.g., `ENABLE_OCR`, `ENABLE_LLM`, `ENABLE_MEMORY_STRICT`).
- Environment tiers: `dev|staging|prod` gating certain tools by default.

## Run Registry & Artifact Versioning

- Keep a lightweight registry (JSON/SQLite) with rows: `{ run_id, ts, inputs_hash, status, metrics, artifacts }`.
- Version artifacts with content hashes; write `manifest.json` per run with schema versions.
- Expose `/api/runs` (list/detail/latest) for observability and UI selection.

## Storage, Retention & Governance

- Content‑addressable storage (CAS) for large artifacts; deduplicate by hash.
- Retention policy per environment (e.g., keep last N runs; archive older to S3).
- Data governance: mark PII fields; avoid writing PII to logs/exports by default.

## API Performance & Caching

- Support conditional GET with `ETag`/`If-None-Match` for `/api/query/*`.
- Add `Cache-Control` for static artifacts (plots/exports); ensure cache busting via run_id.
- Paginate lists (e.g., `/api/samples`) and cap response sizes.

## Streaming Endpoints (optional)

- Provide SSE endpoints for long operations and LLM/tool streams: `/api/stream/run/{run_id}`.
- Heartbeats and structured events (`phase_start`, `phase_end`, `error`, `cancelled`).

## Provider Routing & Fallback Chains

- Define a provider chain (primary→secondary→offline) with selection criteria (latency, cost, health).
- Persist per‑provider metrics and last failure reason for router decisions.

## Secrets & Key Management

- Load from env or secret managers (Vault/SM); never commit secrets.
- Rotate keys and detect invalid keys early with a startup probe.

## Sandboxing & Least Privilege

- Scope filesystem writes to a known root; validate input paths.
- For fetch tools, block SSRF by disallowing private IP ranges and file://.
- OS‑level resource limits for spawned processes (CPU/mem/time).

## Schema Registry & Compatibility

- Maintain schemas for Series/Summary/Issues in a small registry with SemVer.
- Backward‑compatible changes preferred; document breaking changes with migration notes.

## Context Evolution (ACE‑style) & ADRs

- Beyond “facts”, persist Architectural Decision Records (ADRs) for recurring problems/solutions.
- Template: Context → Decision → Alternatives → Consequences → Links (runs/issues/evidence).
- Store in MemoryAdapter (L3) and link to runs/issues; retrieve similar ADRs in future runs.
- Optionally auto‑suggest ADRs when similar error signatures are detected (pattern match).

## Reproducibility & Determinism

- Use deterministic `run_id` and fix random seeds for analysis steps.
- Record tool/pipeline versions in `run_metadata.json` for provenance.

## Load & Fault Injection (Chaos‑lite)

- Periodically inject transient failures in adapters during staging to validate retries and degradation.
- Simulate provider unavailability to exercise circuit breaker paths.

## Postmortems & Incident Handling

- Template for incidents (summary, impact, root cause, fix, follow‑ups) and a lightweight RFC for architectural changes.

## CI/CD & Environments

- Pre‑merge: unit + contract tests; optional smoke API; lint.
- Pre‑release: synthetic batch run; validate Go/No‑Go checklist.
- Envs: dev (local), staging (synthetic), prod (controlled data).

## Go/No‑Go Checklist (generic)

- API `/api/query/summary` → array with required fields; no 5xx.
- API `/api/query/series?key=` → has ≥1 key with ≥2 points; ordered by `t`.
- Ingest → triggers a run; artifacts available; alias `latest` points to last stable run.
- No provider health/circuit breaker open; budgets within limits.
- Security checks pass (uploads, CORS, secrets).

## Configuration (env & files)

- `.env` keys (suggested):
  - API_PORT, UI_PORT
  - PIPELINE_RUN_CMD, PIPELINE_STATUS_CMD (optional)
  - STORAGE*BACKEND (fs|s3|gcs), STORAGE_ROOT, S3*\* (if needed)
  - MEMORY_BACKEND (none|redis|memtech), MEMORY_URL, MEMORY_STRICT
  - LLM_PROVIDER (none|openai|zhipu|openrouter|anthropic), LLM_API_KEY, LLM_BASE_URL
- `agent.config.yaml`: capabilities, thresholds, mappings, ranges (domain overlay).

## Domain Overlay (example — Labs)

- Map domain artifacts to generic contracts:
  - `labs_long.csv` → Series `{ t: date, y: value, unit }`
  - `summary_latest.csv` → Summary `{ key: parameter, latest: value, ts: date, ref_lo, ref_hi, status }`
  - Issues: OCR needed, unit unknown, parse gap → generic `Issues[]`
- Keep overlay logic in a thin mapper module; don’t contaminate core.

## LLM Adapter Notes (optional)

- Prefer OpenAI‑compatible bridge: `baseURL` + `apiKey` for providers that mimic OpenAI API.
- Circuit breaker + health probes; strict budgets; degrade to offline summaries when unavailable.

## Minimal File Layout (reference)

```
api/
  server.py              # FastAPI (generic contracts)
adapters/
  pipeline.py            # PipelineAdapter impl (wraps your CLI/service)
  storage_fs.py          # StorageAdapter (filesystem)
  memory_redis.py        # MemoryAdapter (Redis) [optional]
  llm_openai_compat.py   # LLMAdapter (OpenAI‑compatible)
agent/
  orchestrator.py        # Agent Analyst core (uses adapters)
configs/
  agent.config.yaml
runs/
  <run_id>/ ...          # Artifacts (never overwritten)
```

## Quickstart (generic)

1. Implement adapters for your stack; wire env `.env` and `agent.config.yaml`.
2. Crear una CLI o servicio bridge (p.ej., `memtech/cli`) para exponer operaciones de memoria.
3. Stand up API en `127.0.0.1:${API_PORT:-8077}` y enrutar UI (proxy).
4. Ingesta un batch → verifica artefactos + contratos (Series/Summary) + Go/No‑Go.
5. Añade MemoryAdapter/LLMAdapter cuando se requieran; habilita budgets, circuit breaker y feedback loop.

## Bridge Pattern (CLI/API)

- CLI mínima (`node cli/memory_cli.mjs`) para exponer `health|stats|store|resolve|search`.
- Backend bridge (Python/Node) que envuelve la CLI y ofrece endpoints `/api/memory/*` para agentes/UI.
- Fallback local (`.memory/local-store`) cuando L2/L3 no están disponibles.
- Tests rápidos (`npm run test`) que ejercitan store/resolve con degradación controlada.

## Appendix — Migration Tips

- Start by wrapping your existing pipeline CLI with PipelineAdapter; don’t refactor core until contracts are stable.
- Keep all domain transforms in the overlay layer; test them with fixtures.
- Add provider adapters gradually; default to `none` for Memory/LLM in dev.
