# Hooks, No‑Mess Left Behind y PM2 – Análisis para Devs

## Hooks
- Pre‑invoke (router):
  - Flujo: slash‑command detect → planning gate (isPlanningModeEnabled + checkApprovedPlan) → matchRulesFor → merge con daemon `/activate` (si responde) → injectedNote opcional.
  - Config: `SKILL_ACTIVATION_THRESHOLD` (default 0.6), `ROUTER_DISCOVERY=1` para Service Discovery, `SF_API_KEY` para daemon.
  - Riesgos: drift de threshold con daemon; timeouts o caída del daemon (se ignora para mantener router standalone); rutas frágiles de plan‑check si se reubica.
  - Mitigación: centralizar threshold en shared; timeouts cortos y fallback silencioso (ya implementado); mover plan‑check a shared.
- Stop Hook (router/src/stop.ts):
  - Pipeline: Prettier → Typecheck por repo → hints (1–4 errores) → auto‑resolver (≥5 errores) → KPIs → notificaciones.
  - Seguro por diseño: no lanza excepción; errores se comunican por hints/notifs/KPI.
  - Riesgos: tsc costoso en monorepos grandes; auto‑resolver edita imports añadiendo `.js` (podría no aplicar en todos los casos); Prettier requiere entorno (npx disponible).
  - Mitigación: cache por repo tocado (ya lo hace), limitar reejecuciones, bandera para desactivar auto‑resolver en proyectos estrictos.

### Config y Flags útiles
- Router (pre‑invoke):
  - `SKILL_ACTIVATION_THRESHOLD` (default `0.6`)
  - `ROUTER_DISCOVERY=1`, `DISCOVERY_URL` (descubrir daemon), `ROUTER_STICKY=1`
  - `SF_API_KEY` (propaga `x-api-key` al daemon)
- Daemon:
  - Cache: `SF_CACHE_TTL` (ms, default `60000`), `SF_CACHE_MAX_SIZE`, `SF_CACHE_CLEANUP_INTERVAL`
  - Auth: `DAEMON_API_KEY` (header `x-api-key`), `DAEMON_JWT_SECRET`
  - State distribuido: `SF_STATE_REDIS=1`, `REDIS_URL`
  - DB opcional: `PG_HOST`, `PG_PORT`, `PG_USER`, `PG_PASSWORD`, `PG_DATABASE`

## No‑Mess Left Behind
- Objetivo: “cero errores pendientes” tras cada interacción.
- Implementación:
  - Formateo consistente (Prettier), typecheck y señales tempranas (hints), intento acotado de auto‑fix seguro, y registro en KPI con `zero_errors_left_behind`.
- Puntos de atención:
  - Evitar auto‑fix agresivo; preferir sugerencias cuando la confianza es baja.
  - Mantener idempotencia: múltiples ejecuciones no deben introducir diferencias.
  - Medir: usar eventos en `obs/kpi/events.jsonl` para auditoría.

## PM2
- Ecosystem (scripts/pm2/ecosystem.config.cjs):
  - Servicios: `sf-daemon`, `router-service`, `skills-cli-service`; cluster opcional vía `PM2_CLUSTER=1`.
  - Operación: `pm2 start ... --env development`; actualizar vars con `--update-env`; inspección con `pm2 logs`/`pm2 monit`.
- Startup Manager (scripts/pm2/startup-manager.mjs):
  - Ordena dependencias (router y cli dependen de daemon) y health checks básicos.
- Riesgos y mitigaciones:
  - Variables stale: usar `pm2 restart <service> --update-env` o `delete + start`.
  - Espera de readiness: si se usa `wait_ready`, asegurar `process.send('ready')` tras `listen()`.
  - Rotación de logs: configurar `max_size`/`retain` si el volumen crece.
  - Cluster: validar `SF_STATE_REDIS=1` si se requiere cache distribuido.

## Checklists
- Hooks
  - [ ] Threshold único (shared) aplicado en router y daemon
  - [ ] Plan‑check estable (shared o import de `dist/`)
  - [ ] Stop hook idempotente; auto‑resolver bajo control
- No‑Mess
  - [ ] KPIs con `zero_errors_left_behind` confiable
  - [ ] Prettier/tsc disponibles en entorno CI/Dev
- PM2
  - [ ] `--update-env` en restart
  - [ ] Health endpoints verificados tras despliegue
  - [ ] Logs rotando y sin crecimiento descontrolado
