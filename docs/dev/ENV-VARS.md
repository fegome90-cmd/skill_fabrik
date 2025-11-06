# Variables de Entorno – Guía rápida

## Router
- `SKILL_ACTIVATION_THRESHOLD` (float 0..1, default 0.6)
- `ROUTER_DISCOVERY=1` habilita Service Discovery para ubicar el daemon
- `DISCOVERY_URL` (default `http://127.0.0.1:8877`)
- `ROUTER_STICKY=1` selección sticky por hash de `cwd`
- `SF_API_KEY` se envía como `x-api-key` al daemon

## Daemon
- Cache: `SF_CACHE_TTL` (ms), `SF_CACHE_MAX_SIZE`, `SF_CACHE_CLEANUP_INTERVAL`
- Auth: `DAEMON_API_KEY` (`x-api-key`), `DAEMON_JWT_SECRET` (Bearer JWT)
- Estado distribuido: `SF_STATE_REDIS=1`, `REDIS_URL` (e.g., `redis://127.0.0.1:6379`)
- DB opcional: `PG_HOST`, `PG_PORT`, `PG_USER`, `PG_PASSWORD`, `PG_DATABASE`

## Shared / CLI
- `SF_USE_SHARED_RULES=1` (experimento: daemon usa loader compartido)
- `SF_USE_SHARED_SIGNALS=1` (experimento: daemon usa señales compartidas)

## PM2
- `PM2_CLUSTER=1` (cluster mode para servicios configurados)
- `NODE_ENV` (`development`/`production`)

Notas
- Tras cambiar envs en PM2: `pm2 restart <service> --update-env`.
