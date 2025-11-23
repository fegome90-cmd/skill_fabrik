## Inventario General – Skills Fabrik

### 1. Paquete `packages/daemon`

**Raíz**
- `package.json`, `package-lock.json`, `tsconfig.json`
- `registry/index.json` (registro local de skills)
- `config/default.yaml`, `config/production.yaml`
- `obs/kpi/events.jsonl` (telemetría)

**Esquemas**
- `schemas/activate.request.schema.json`
- `schemas/activate.response.schema.json`
- `schemas/execute.request.schema.json`
- `schemas/execute.response.schema.json`

**Código fuente (`src/`)**
- Núcleo: `app.ts`, `index.ts`, `metrics.ts`, `skills.ts`, `tools.ts`, `needs.ts`
- Backups / históricos: `app.ts.backup`
- Configuración: `config/config.ts`, `config/daemon-config.ts`
- Autenticación y cliente: `auth/jwt.ts`, `client/daemon-client.ts`, `client/types.ts`
- Confirmación y persistencia: `confirm.ts`, `ensurePostgresTables.ts`, `persistence/backup.ts`, `persistence/event-store.ts`, `persistence/event-types.ts`, `persistence/recovery.ts`
- Observabilidad: `metrics/prometheus.ts`, `observability/logger.ts`, `observability/otel.ts`, `observability/tracing.ts`, `real-time-dashboard.ts`
- Políticas y resiliencia: `policy.ts`, `policyLevels.ts`, `resilience/circuit-breaker.ts`, `resilience/circuit-breaker-registry.ts`, `resilience/retry.ts`
- Middleware / sandbox: `middleware/auth.ts`, `sandbox.ts`
- Estado distribuido: `state/distributed-state.ts`, `state/redis-adapter.ts`
- Tipos/definiciones: `types/shared.d.ts`, `skillManagerMapper.ts`
- Otras utilidades: `errors.ts`, `fileWatcher.ts`, `qualityService.ts`

**Pruebas (`test/`)**
- Autenticación: `auth.apikey.spec.mjs`, `auth.jwt.spec.mjs`
- Activación y snapshots: `activate.boost.spec.mjs`, `snapshot.activate.spec.mjs`, `snapshot.execute.spec.mjs`
- Confirmación: `confirm.s1.badtoken.spec.mjs`, `confirm.s1.challenge.spec.mjs`, `confirm.s1.ok.spec.mjs`
- Métricas y salud: `metrics.spec.mjs`, `health.smoke.spec.mjs`
- Políticas: `policy.allow.spec.mjs`, `policy.deny.spec.mjs`, `policy.levels.spec.mjs`, `policy.net.spec.mjs`, `policy.s1.spec.mjs`, `policy.s2.spec.mjs`
- Persistencia / estado: `persistence/event-store.spec.mjs`, `state/distributed-state.spec.mjs`
- Resiliencia: `resilience/circuit-breaker.spec.mjs`, `resilience/graceful-shutdown.spec.mjs`, `resilience/retry.spec.mjs`
- Cliente y helpers: `client/daemon-client.spec.mjs`, `helpers/confirm.js`, `helpers/execute.js`
- Validaciones de esquema: `schema.activate.spec.mjs`

### 2. Inventario de alto nivel del repositorio

**Direcciones clave**
- `adapters/`, `agents/`, `backend/`, `configs/`, `contracts/`, `db/`, `docs/`, `documentos/`, `investigacion/`, `investigaciones/`, `memtech/`, `mcp/`, `packages/`, `registry/`, `scripts/`, `skills/`, `test/`, `test-guardrails/`, `test-plans/`, `dev/`, `dev-docs/`, `devops-*`, `policies/`, `metrics/`, `monitoring-*`, `obs/`, `prompts/`, `cloop/`, `realtime-test.ts`, `README*`, `CHANGELOG.md`, entre otros.

**Características destacadas**
- **Documentación**: gran volumen en `docs/` y `documentos/` (análisis, reportes, guías). `docs/API/ROUTER.md` y `docs/API/DAEMON.md` funcionan como contratos actuales.
- **Skills**: catálogo organizado en `skills/` (guidelines, guardrails, workflows, policy, etc.) con recursos adicionales y scripts de ejecución.
- **Scripts**: automatizaciones en `scripts/` (deploy, pm2, métricas, hooks) con variantes `.bak` y `.backup` para historial.
- **PM2**: configuración oficial en `scripts/pm2/ecosystem.config.cjs`; no se detectaron otros ecosistemas activos.
- **MCP / MemTech**: servidores y scripts en `mcp/`, `mcp-local/`, `mcp-server/`, `memtech/`.
- **Paquetes**: monorepo pnpm bajo `packages/` (daemon, router, shared, skills-cli, adapters, etc.), cada uno con tests y configuración propios.
- **Configuraciones y esquemas**: `configs/` (reglas, templates), `ci/GATES.yml`, `schemas/`.
- **Datos observacionales**: `metrics/`, `monitoring-*`, `obs/`, `logs/`.

### 3. Observaciones
- El daemon mantiene una estructura clara con separación por responsabilidad, pero conserva un `app.ts.backup` y `persistence/backup.ts` que conviene evaluar para archivar.
- El repositorio presenta gran cantidad de documentación histórica; se recomienda centralizar índices (`docs/skills/`, `docs/architecture/`) para evitar dispersión.
- Existen múltiples artefactos de respaldo (`*.bak`, `*.backup`) en `packages/skills-cli`, `scripts/`, `docs/backups/`; mantenerlos controlados bajo una política de archivado.


