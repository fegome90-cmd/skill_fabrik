# Daemon Health & Flags Quick Reference

Health
- Smoke health: `pnpm smoke:health`
- Metrics: GET `/metrics`
- Health endpoint: GET `/health`

Core Flags
- `SF_CONFIG` → YAML config path (host/port/CORS)
- `SF_HOST`, `SF_PORT`, `SF_CORS_ORIGINS` → env overrides
- `DAEMON_API_KEY` (daemon) / `SF_API_KEY` (CLI) → header `x-api-key`
- `PM2_CLUSTER=1` → enable PM2 cluster mode (env_production sets it by default)
- Logging: `SF_LOG_LEVEL` (info|debug|warn|error), `SF_LOG_PRETTY=1` (pretty console)
- Tracing (stub): `SF_OTEL=1`, `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_JAEGER_ENDPOINT`

Redis (opt‑in)
- `SF_STATE_REDIS=1` and `REDIS_URL=redis://127.0.0.1:6379`
- Smoke Redis: `pnpm smoke:redis` (requires ioredis installed and reachable Redis)
- `REDIS_WARN_ONLY=1` → `smoke:redis` emits warning and exits 0

Notes
- If ioredis is missing, Redis features fallback to in-memory with a warning.
- API key guard only applies when `DAEMON_API_KEY` is set.
