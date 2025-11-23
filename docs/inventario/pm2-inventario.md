# Inventario PM2 – Skills Fabrik

Fecha: 2025-11-13 13:31 UTC  
Versión: 2025.11.13-02  
Responsable: Platform Ops  
Informe relacionado: `docs/inventario/skills-core-audit.md`

## 1. Archivos relevantes

| Tipo | Ruta (relativa a la raíz del repo) | Descripción |
| --- | --- | --- |
| Ecosistema principal | `scripts/pm2/ecosystem.config.cjs` | Configuración oficial con 4 aplicaciones (daemon, router, discovery, skills-cli). |
| Gestor de arranque | `scripts/pm2/startup-manager.mjs` | Orquesta dependencias y health checks usando `ServiceDependencyManager`. |
| Directorio de logs | `logs/` | PM2 escribe logs dedicados por servicio (`*-error.log`, `*-out.log`, `*-combined.log`). |

_No se detectaron otros archivos `ecosystem.*.cjs` dentro del repositorio._

## 2. Servicios definidos en `ecosystem.config.cjs`

### 2.1 `sf-daemon`
- `cwd`: `packages/daemon`
- Comando: `node dist/index.js`
- Modo: `fork` (cluster opcional vía `PM2_CLUSTER=1`)
- Restart: `autorestart=true`, `max_memory_restart=400M`, `max_restarts=10`
- Logging: `logs/daemon-error.log`, `logs/daemon-out.log`, `logs/daemon-combined.log`
- Variables `development`: `SF_PORT=7727`, `SF_HOST=127.0.0.1`, `LOG_LEVEL=info`, `SF_DASHBOARD_ENABLED=false`
- Variables `production`: `SF_HOST=0.0.0.0`, `PM2_CLUSTER=1`, `LOG_LEVEL=warn`
- Health check: `http://127.0.0.1:7727/health` cada 5s (gracia 3s)
- Observaciones: validar que `dist/` esté actualizado antes de iniciar.

### 2.2 `router-service`
- `cwd`: `packages/router`
- Comando: `node dist/cli/start-router-server.js`
- Modo: `fork`
- Dependencia declarada: `dependencies: ['sf-daemon']`
- Logging: `logs/router-error.log`, `logs/router-out.log`
- Variables `development`: `PORT=3000`, `DAEMON_URL=http://127.0.0.1:7727`
- Variables `production`: `DAEMON_URL=http://sf-daemon:7727`
- Health check: `http://127.0.0.1:3000/health` (gracia 5s)
- Otros: `wait_ready=true`, `listen_timeout=10000`.

### 2.3 `service-discovery`
- `cwd`: `packages/shared`
- Comando: `node dist/cli/start-discovery-server.js`
- Logging: `logs/discovery-error.log`, `logs/discovery-out.log`
- Variables `development`: `DISCOVERY_PORT=8877`, `DISCOVERY_HOST=127.0.0.1`
- Variables `production`: `DISCOVERY_HOST=0.0.0.0`
- Health check: `http://127.0.0.1:8877/health`
- Observaciones: validar si permanece en el ecosistema Skills Core o se extrae a infraestructura común.

### 2.4 `skills-cli-service`
- `cwd`: `packages/skills-cli`
- Comando: `node dist/index.js`
- `autorestart=false` (ejecución manual)
- Logging: `logs/skills-cli-error.log`, `logs/skills-cli-out.log`
- Variables: `CLI_MODE=service`, `DISCOVERY_URL` apunta al discovery activo
- Observaciones: definir cuándo debe activarse; no tiene health check HTTP.

## 3. Gestor `startup-manager.mjs`
- Servicios registrados: `sf-daemon`, `router-service`, `skills-cli-service` (pendiente integrar `service-discovery`).
- Utiliza `ServiceDependencyManager` y `HealthChecker` (`packages/shared`).
- CLI disponible: `node scripts/pm2/startup-manager.mjs start|health [env]`.
- Funcionalidades destacadas:
  - Inicio secuencial con `maxRetries` por servicio.
  - `comprehensiveHealthCheck()` genera resumen de estados y porcentaje de salud.
  - `monitorServices(duration)` permite observación continua (intervalo 10s).
  - `getDetailedStatus()` devuelve métricas enriquecidas (uptime, dependencias).
- Recomendación: añadir `service-discovery` al registro para consistencia con el ecosystem.

## 4. Observaciones y riesgos
- **Builds `dist/`**: todos los servicios consumen bundles; ejecutar `pnpm -w build` antes de `pm2 start`.
- **Rotación de logs**: definir `max_size`/`retain` en pm2 para evitar crecimiento indefinido.
- **Cluster opcional**: `PM2_CLUSTER=1` exige activar almacenamiento compartido (`SF_STATE_REDIS`).
- **skills-cli-service**: al no reiniciarse automáticamente, documentar playbook operativo.
- **Discovery**: aclarar si permanece en Skills Core; de ser externo, extraer del ecosystem.

## 5. Recomendaciones inmediatas
1. Documentar en Dev Docs el uso canónico de `scripts/pm2/ecosystem.config.cjs` y cuándo aplicar `startup-manager.mjs` (enlace al informe general).
2. Incorporar verificación en CI que compruebe la existencia de `dist/` actualizado antes de levantar pm2.
3. Configurar política de rotación de logs (`pm2` `max_size`, `retain` o `pm2-logrotate`).
4. Revisar la conveniencia de mantener `service-discovery` y `skills-cli-service` en el mismo ecosistema; documentar la decisión.
5. Integrar `startup-manager.mjs` con `service-discovery` y publicar checklist operativo (start/stop/health).

---

Este documento forma parte del registro de inventario (`docs/inventario/`) y debe actualizarse junto con `skills-core-audit.md` tras cambios en infraestructura o servicios pm2.
