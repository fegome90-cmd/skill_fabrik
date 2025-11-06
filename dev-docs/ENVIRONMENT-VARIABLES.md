# Environment Variables Reference
**Proyecto:** Skills Fabrik - SF-STABILITY-2025  
**Fecha:** 2025-11-05  
**Versión:** 1.0

---

## 🎯 Router Service

### Server Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Puerto del servidor HTTP |
| `HOST` | `127.0.0.1` | Host del servidor |
| `NODE_ENV` | `development` | Entorno de ejecución |

### Rate Limiting

| Variable | Default | Description |
|----------|---------|-------------|
| `RATE_LIMIT_MAX` | `100` | Máximo de requests por ventana |
| `RATE_LIMIT_WINDOW` | `1 minute` | Ventana de tiempo para rate limiting |

### Daemon Integration

| Variable | Default | Description |
|----------|---------|-------------|
| `SKILLS_DAEMON_URL` | `http://localhost:3001` | URL del daemon service |
| `SKILLS_DAEMON_ENHANCED` | `true` | Habilitar integración con daemon |
| `SKILLS_DAEMON_DEBUG` | `false` | Modo debug para daemon calls |
| `SF_API_KEY` | - | API key para autenticar con daemon |
| `DAEMON_TIMEOUT` | `5000` | Timeout para daemon calls (ms) |
| `DAEMON_MAX_RETRIES` | `2` | Máximo de reintentos |
| `DAEMON_RETRY_DELAY` | `500` | Delay inicial entre reintentos (ms) |
| `DAEMON_HEALTH_CHECK_INTERVAL` | `30000` | Intervalo de health checks (ms) |

### Circuit Breaker

| Variable | Default | Description |
|----------|---------|-------------|
| `CIRCUIT_BREAKER_FAILURE_THRESHOLD` | `5` | Fallos antes de abrir circuito |
| `CIRCUIT_BREAKER_SUCCESS_THRESHOLD` | `2` | Éxitos para cerrar circuito |
| `CIRCUIT_BREAKER_RESET_TIMEOUT` | `30000` | Timeout para reset (ms) |

### Logging

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | `info` | Nivel de logging (trace, debug, info, warn, error, fatal) |
| `LOG_PRETTY` | `true` (dev) | Pretty print logs en desarrollo |

---

## 🎯 Daemon Service

### Server Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `DAEMON_PORT` | `3001` | Puerto del daemon HTTP |
| `DAEMON_HOST` | `127.0.0.1` | Host del daemon |
| `NODE_ENV` | `development` | Entorno de ejecución |

### Authentication

| Variable | Default | Description |
|----------|---------|-------------|
| `DAEMON_API_KEY` | - | API key requerida (opcional) |
| `DAEMON_JWT_SECRET` | - | Secret para JWT tokens (opcional) |
| `SF_API_KEY` | - | API key para validación |

### Rate Limiting

| Variable | Default | Description |
|----------|---------|-------------|
| `DAEMON_RATE_LIMIT_MAX` | `100` | Máximo de requests por ventana |
| `DAEMON_RATE_LIMIT_WINDOW` | `1 minute` | Ventana de tiempo |

### CORS

| Variable | Default | Description |
|----------|---------|-------------|
| `CORS_ORIGIN` | `*` | Origins permitidos para CORS |

### Database

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | - | PostgreSQL connection string |
| `PGHOST` | `localhost` | PostgreSQL host |
| `PGPORT` | `5432` | PostgreSQL port |
| `PGUSER` | `postgres` | PostgreSQL user |
| `PGPASSWORD` | - | PostgreSQL password |
| `PGDATABASE` | `skills_fabrik` | PostgreSQL database |

### File Watcher

| Variable | Default | Description |
|----------|---------|-------------|
| `FILE_WATCHER_DEBOUNCE` | `2000` | Debounce delay (ms) |
| `FILE_WATCHER_FAILSAFE` | `6000` | Failsafe timeout (ms) |

### Quality Service

| Variable | Default | Description |
|----------|---------|-------------|
| `QUALITY_SERVICE_ENABLED` | `true` | Habilitar quality checks |
| `QUALITY_SERVICE_URL` | - | URL del quality service |

### Service Discovery

| Variable | Default | Description |
|----------|---------|-------------|
| `DISCOVERY_URL` | - | URL del service discovery |
| `SERVICE_NAME` | `skills-daemon` | Nombre del servicio |

### Logging

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | `info` | Nivel de logging |
| `LOG_PRETTY` | `true` (dev) | Pretty print logs |

---

## 📝 Notas

### Seguridad
- **Nunca** commitear valores de `API_KEY`, `JWT_SECRET`, o `DATABASE_URL`
- Usar `.env` files para desarrollo local
- Usar secrets management en producción (AWS Secrets Manager, etc.)

### Performance
- Ajustar `RATE_LIMIT_MAX` según capacidad del servidor
- `CIRCUIT_BREAKER_FAILURE_THRESHOLD` debe ser > `DAEMON_MAX_RETRIES`
- `FILE_WATCHER_DEBOUNCE` debe ser < `FILE_WATCHER_FAILSAFE`

### Logging
- Usar `LOG_LEVEL=debug` solo en desarrollo
- `LOG_PRETTY=false` en producción para mejor performance

---

**Documento Creado Por:** Augment Agent  
**Fecha:** 2025-11-05  
**Proyecto:** SF-STABILITY-2025

