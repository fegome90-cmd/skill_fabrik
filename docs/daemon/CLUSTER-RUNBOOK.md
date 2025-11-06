# Daemon Cluster Runbook (PM2)

- Start (dev, fork): `pm2 start scripts/pm2/ecosystem.config.cjs --only sf-daemon`
- Start (cluster, local): `PM2_CLUSTER=1 pm2 start scripts/pm2/ecosystem.config.cjs --only sf-daemon`
- Start (prod): `pm2 start scripts/pm2/ecosystem.config.cjs --env production --only sf-daemon`
- Status: `pm2 ls` / `pm2 monit`
- Logs: `pm2 logs sf-daemon --lines 200`
- Health: `curl http://HOST:PORT/health`
- Discovery: `pnpm smoke:discovery` (requires discovery server and daemon registration)

Config tips
- YAML: `SF_CONFIG=packages/daemon/config/production.yaml`
- Env overrides: `SF_HOST`, `SF_PORT`, `SF_CORS_ORIGINS`
- API key (optional): set `DAEMON_API_KEY` in daemon and `SF_API_KEY` in CLI
- Cluster: `PM2_CLUSTER=1` (env_production enables by default)
- Redis cache (opt-in): `SF_STATE_REDIS=1` and `REDIS_URL=redis://127.0.0.1:6379`
- Redis smoke: `pnpm smoke:redis` (requires ioredis and reachable Redis). Use `REDIS_WARN_ONLY=1` to warn instead of fail.

Rollback
- `pm2 restart sf-daemon --update-env` after removing flags/vars
- To exit cluster: `pm2 restart sf-daemon --env development` (or unset PM2_CLUSTER)

Notes
- Without ioredis, Redis state falls back to in-memory Map with a warning.
- /activate cache uses dual-write (Map + Redis when enabled). Challenges dual-write too.
