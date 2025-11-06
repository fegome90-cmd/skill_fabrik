# Daemon Operations Runbook

## Prerequisites
- Node.js 18+, pnpm 8+
- Optional services:
  - Redis (for distributed state): `redis://127.0.0.1:6379`
  - Service Discovery server (port 8877)
  - Prometheus + Grafana (metrics + dashboards)
  - Jaeger (tracing) if enabling OTEL

## Start / Stop
- Local (fork): `pnpm --filter @skills-fabrik/daemon build && node packages/daemon/dist/index.js`
- PM2 (dev): `pm2 start scripts/pm2/ecosystem.config.cjs --only sf-daemon`
- PM2 (cluster, local): `PM2_CLUSTER=1 pm2 start scripts/pm2/ecosystem.config.cjs --only sf-daemon`
- PM2 (prod): `pm2 start scripts/pm2/ecosystem.config.cjs --env production --only sf-daemon`

## Health & Smokes
- Health: `pnpm smoke:health`
- Discovery: `pnpm smoke:discovery` (requires daemon registered)
- Redis: `SF_STATE_REDIS=1 REDIS_URL=redis://127.0.0.1:6379 pnpm smoke:redis`
  - Warn‑only: `REDIS_WARN_ONLY=1 pnpm smoke:redis`
- Pre‑operate gate (warn‑only DocOps + smokes): `pnpm pre:operate`

## Environment Flags (summary)
- Config & CORS: `SF_CONFIG` (YAML), `SF_HOST`, `SF_PORT`, `SF_CORS_ORIGINS`
- Safety layer (CLI): `SF_SAFETY_LAYER=on|off`
- Auth (daemon/CLI): `DAEMON_API_KEY`, `DAEMON_JWT_SECRET`, `SF_API_KEY`
- Redis state: `SF_STATE_REDIS=1`, `REDIS_URL=redis://...`
- Discovery: `SF_DISCOVERY=1`, `DISCOVERY_URL=http://127.0.0.1:8877`, `SF_SERVICE_NAME=sf-daemon`
  - Router: `ROUTER_DISCOVERY=1`, `ROUTER_STICKY=1` (session affinity by cwd)
- Observability:
  - Logs: `SF_LOG_LEVEL=info|debug|warn|error`, `SF_LOG_PRETTY=1`
  - OTEL: `SF_OTEL=1`, `OTEL_EXPORTER_JAEGER_ENDPOINT=http://localhost:14268/api/traces`, `OTEL_SERVICE_NAME=sf-daemon`
- Event store (JSONL): `SF_EVENT_STORE=1` → writes under `obs/events/`

## Discovery (opt‑in)
- Daemon registers/heartbeats when `SF_DISCOVERY=1` and `DISCOVERY_URL` set.
- Router resolves endpoint when `ROUTER_DISCOVERY=1` (optional `ROUTER_STICKY=1`).
- Verify: `pnpm smoke:discovery`

## Redis State (opt‑in)
- Enable: `SF_STATE_REDIS=1 REDIS_URL=redis://127.0.0.1:6379`
- Falls back to memory if `ioredis` is missing.
- Afecta actCache (/activate) y challenges (S1) con TTL/dual‑write seguro.

## Auth (optional)
- API key: set `DAEMON_API_KEY` (daemon) and `SF_API_KEY` (CLI) → header `x-api-key`.
- JWT (dev): set `DAEMON_JWT_SECRET`; obtain token: `POST /api/v1/auth/token`.

## Observability
- Metrics endpoint: `GET /metrics`
- Grafana: import `local/grafana/dashboards/daemon-metrics.json` (see `docs/daemon/GRAFANA-SETUP.md`).
  - Example P95: `histogram_quantile(0.95, sum by (le) (rate(skills_activation_latency_ms_bucket[5m])))`
- Alerts (examples): `docs/daemon/ALERTS.md`
- OTEL tracing (optional): enable `SF_OTEL=1` and install OTEL packages; spans in `/activate` y `/execute`.

## Event Store (opt‑in)
- Enable: `SF_EVENT_STORE=1` → `obs/events/events-YYYY-MM-DD.jsonl`
- Includes activation/execute/system events; supports `readLast(n)` API.

## Backup & Recovery
- Backup (tar): `scripts/daemon-backup.sh backups`
  - Includes: `packages/daemon/config`, `packages/daemon/schemas`, `obs/`
- Recovery: `scripts/daemon-recovery.sh backups/sf-backup-<timestamp>.tar.gz`

## Router Integration
- Pre‑invoke calls daemon `/activate` and merges skills; `DAEMON_URL` or discovery flags as arriba.
- Adds `x-api-key` header when `SF_API_KEY` is set.

## Troubleshooting
- Health fails: check port/host config (`SF_CONFIG`, `SF_HOST`, `SF_PORT`), and logs (Pino/console).
- Auth 401: set `DAEMON_API_KEY` (daemon) and `SF_API_KEY` (client), or issue JWT via `/api/v1/auth/token`.
- Discovery: start the discovery server, ensure daemon registers (SF_DISCOVERY=1), and run `pnpm smoke:discovery`.
- Redis: verify `ioredis` installed and `REDIS_URL` reachable; run `pnpm smoke:redis`.
- Metrics: curl `/metrics` and verify Prometheus scrape; import Grafana dashboard.
- Tracing: ensure OTEL packages + `SF_OTEL=1` and correct Jaeger endpoint.

## References
- API: `docs/daemon/API-REFERENCE.md`
- Cluster runbook: `docs/daemon/CLUSTER-RUNBOOK.md`
- Grafana setup: `docs/daemon/GRAFANA-SETUP.md`
- Alerts: `docs/daemon/ALERTS.md`
