# Contexto: Sistema Daemon Infalible y Global

**Sprint ID**: daemon-infalible-sprint  
**Fecha**: 2025-11-01  
**Metodología**: CLOOP + MemTech + Prompt Builder v2

---

## 🧠 Contexto del Sistema

### Estado Actual del Daemon

**Ubicación**: `packages/daemon/`

**Arquitectura Actual:**
```
packages/daemon/
├── src/
│   ├── app.ts              # Servidor Fastify principal (1279 líneas)
│   ├── index.ts            # Entry point (6 líneas)
│   ├── confirm.ts          # Challenge-response para S1 (Map en memoria)
│   ├── sandbox.ts          # Sandbox para operaciones S1
│   ├── policyLevels.ts     # Niveles de política (S0, S1, S2, NET)
│   ├── metrics.ts          # Métricas Prometheus básicas
│   ├── fileWatcher.ts      # File watcher con WebSocket
│   ├── qualityService.ts   # ESLint + Prettier
│   └── config/daemon-config.ts  # Loader YAML/env (host/port/CORS)
├── src/resilience/
│   ├── circuit-breaker.ts
│   ├── circuit-breaker-registry.ts
│   └── retry.ts
├── schemas/                # JSON schemas para validación
├── config/
│   └── default.yaml        # Config por defecto (0.0.0.0:3000, CORS)
└── test/                   # Tests existentes
```

**Endpoints Actuales:**
- `GET /health` - Health check con DB/cache/system metrics
- `GET /list` - Lista skills disponibles
- `POST /activate` - Activa skills basado en intent
- `POST /execute` - Ejecuta skill con policy checks
- `GET /metrics` - Métricas Prometheus
- `POST /api/hooks/user-prompt-submit` - Hook pre-invoke
- `POST /api/commands/execute` - Ejecuta comandos
- `POST /api/qa/*` - Endpoints de calidad (format, lint, build)
- `POST /api/file-watcher/*` - Endpoints de file watching

**Dependencias Críticas:**
- PostgreSQL (eventos, health checks)
- File system (skills, schemas, logs)
- Cache en memoria (Map para activaciones)
- Challenges en memoria (Map para S1 operations)

**Limitaciones Identificadas (y estado):**
1. **Resiliencia**: [PARCIAL] CB en `pg:connect` y `sandbox:apply`; retry en FS y `db.query()`
2. **Escalabilidad**: [PENDIENTE] Cache/state en memoria, no distribuido
3. **Observabilidad**: [PENDIENTE] Logs básicos, sin tracing
4. **Accesibilidad**: [RESUELTO] Host por defecto 0.0.0.0 (YAML/env)
5. **Recovery**: [PARCIAL] Shutdown limpio (`app.close`, watcher.stop)

**Cambios Recientes Clave:**
- Wrapper `dbQuery()` con retry + circuit breaker.
- Circuit breakers: `pg:connect`, `sandbox:apply`.
- Retry: escritura de eventos KPI (FS).
- Mejora /activate con señales estilo Prompt Builder v2 (intent/path/content/keywords) sin romper contrato.
- Config YAML/env (`config/default.yaml`) para host/port/CORS.
- Perfil `config/production.yaml` (ejemplo) para despliegues.
- Pruebas: `health.smoke` (pasa); `activate.boost` agregada (skip temporal).

**Safety Layer (lado CLI):**
- Shim de compatibilidad para respuesta legacy y normalización de payload.
- Saneado de contexto y rate-limit ligero con kill-switch (`SF_SAFETY_LAYER`).

**Operación / Configuración:**
- `SF_CONFIG` apunta a un YAML (por ejemplo `packages/daemon/config/production.yaml`).
- Overrides por env: `SF_HOST`, `SF_PORT`, `SF_CORS_ORIGINS` (coma-separado).
- Por defecto: `0.0.0.0:3000` y CORS locales.
- Autenticación ligera (opcional): setear `DAEMON_API_KEY` en daemon y `SF_API_KEY` en CLI (envía header `x-api-key`).
- Escalabilidad (opt‑in): `PM2_CLUSTER=1` activa cluster (env_production lo define por defecto).
- Redis (opt‑in único): `SF_STATE_REDIS=1` y `REDIS_URL=redis://...` habilitan el adapter para cache de activación y challenges; si falta ioredis, se usa memoria.
- Smokes: `pnpm smoke:health` (daemon) y `pnpm smoke:redis` (si SF_STATE_REDIS=1). En `pre:operate` se ejecuta como aviso (no bloquea). Para no fallar manualmente: `REDIS_WARN_ONLY=1 pnpm smoke:redis`.
- Service discovery (opt‑in): `SF_DISCOVERY=1` en daemon registra y hace heartbeat; `ROUTER_DISCOVERY=1` en router usa endpoint dinámico. Smoke: `pnpm smoke:discovery`.
- Event sourcing (opt‑in): `SF_EVENT_STORE=1` persiste eventos en `obs/events/events-YYYY-MM-DD.jsonl`.
- Backups: `scripts/daemon-backup.sh` → tar de `config/`, `schemas/`, `obs/`. Recovery: `scripts/daemon-recovery.sh`.

---

## 📚 Contexto Metodológico

### CLOOP Methodology

**Origen**: Validado por 5 papers académicos (NeurIPS 2023, etc.)  
**Performance**: 17-25% mejora documentada

**Fases:**
1. **Clarify** → Definir objetivos, hipótesis, criterios de éxito
2. **Layout** → Crear plan mínimo ejecutable (MVP)
3. **Operate** → Ejecutar workflow/agents iterativamente
4. **Observe** → Recolectar métricas y evidencia
5. **Reflect** → Metacognición (análisis de error, ajustes)

**Aplicación en este Sprint:**
- ✅ CLARIFY: Objetivos SMART definidos en plan.md
- ✅ LAYOUT: Arquitectura y fases documentadas
- 🔄 OPERATE: Implementación en progreso
- ⏳ OBSERVE: Métricas pendientes de recolección
- ⏳ REFLECT: Checkpoints programados

### MemTech Agent Principles

**Sistema de Memoria Jerárquica:**
- **L0**: Ultra-rápida (50MB, 1h TTL) - Hot cache
- **L1**: Rápida (500MB, 24h TTL) - Working memory (Redis)
- **L2**: Media (5GB, 30 días TTL) - Context memory (PostgreSQL)
- **L3**: Larga (Ilimitada, permanente) - Long-term (Chroma)

**Reglas Críticas:**
- SIEMPRE verificar integridad antes de escritura
- NUNCA modificar L3 sin validación completa
- SIEMPRE crear checkpoints antes de operaciones críticas
- SIEMPRE registrar operaciones en audit log
- SIEMPRE ejecutar heartbeats al inicio

**Aplicación en este Sprint:**
- Circuit breakers = Protección de integridad
- Retry logic = Recuperación automática
- Event sourcing = Audit log completo
- Backup service = Checkpoints automáticos

### Prompt Builder v2

**Template v1.1.0**: 8 componentes (C1-C8)  
**TAGs System**: [K], [C], [U], [EVIDENCIA], [PROPUESTA]  
**CLOOP Integration**: Prompts estructurados por fase

**Aplicación en este Sprint:**
- Prompts optimizados para cada fase CLOOP
- Tags automáticos para contexto
- Integración con planning mode

---

## 🏗️ Contexto Técnico

### Stack Tecnológico Actual

**Runtime:**
- Node.js ≥ 18
- TypeScript (ES modules)
- pnpm workspace

**Servidor:**
- Fastify (HTTP server)
- Ajv 2020 (JSON schema validation)
- @fastify/cors (CORS support)

**Persistencia:**
- PostgreSQL (eventos, health)
- File system (skills, schemas, logs)

**Process Management:**
- PM2 (scripts/pm2/ecosystem.config.cjs)
- Health checks cada 30s
- Max memory restart: 500M

**Observabilidad:**
- Logs estructurados (Pino opcional, `SF_LOG_LEVEL`/`SF_LOG_PRETTY`)
- Tracing OTEL (stub, `SF_OTEL=1` + deps; spans en /activate y /execute)
- Métricas Prometheus avanzadas: histograma activación/ejecución, retry_*, cache hits/misses, circuit_breaker_*
- Dashboard Grafana (stub): `local/grafana/dashboards/daemon-metrics.json` (ver `docs/daemon/GRAFANA-SETUP.md`)
- Alertas ejemplo (Prometheus): `docs/daemon/ALERTS.md`

### Stack Tecnológico Target

**Nuevas Dependencias:**
```json
{
  "dependencies": {
    "ioredis": "^5.3.2",                    // Redis client
    "@opentelemetry/api": "^1.7.0",         // OTEL API
    "@opentelemetry/sdk-node": "^0.45.0",   // OTEL SDK
    "@opentelemetry/exporter-jaeger": "^1.18.0",
    "@opentelemetry/instrumentation-fastify": "^0.33.0",
    "@opentelemetry/instrumentation-pg": "^0.38.0",
    "@opentelemetry/instrumentation-redis": "^0.35.0",
    "pino": "^8.16.0",                      // Structured logging
    "pino-pretty": "^10.2.0",
    "jsonwebtoken": "^9.0.2",               // JWT auth
    "js-yaml": "^4.1.0"                     // Config YAML
  }
}
```

**Infraestructura Target:**
- Redis (state distribuido, cache, sessions)
- PostgreSQL (eventos, event sourcing)
- Chroma (vectores, long-term memory)
- Jaeger (tracing distribuido)
- Grafana (dashboards)
- VictoriaMetrics (métricas)

---

## 🔗 Contexto de Integración

### Integración con Router

**Ubicación**: `packages/router/`

**Hooks Actuales:**
- `userPromptSubmitHook` (pre-invoke.ts) - Detecta y activa skills
- `stopHook` (stop.ts) - Post-response quality checks

**Integración Requerida (estado):**
- Router usa daemon (/activate) con merge de resultados (HTTP) ✅
- Circuit breaker + retry en cliente/servidor ✅
- Tracing end-to-end (pendiente de infra OTEL) ⏳

### Integración con Service Discovery

**Ubicación**: `packages/shared/src/service-discovery.ts`

**Características:**
- Registry centralizado (port 8877)
- Health monitoring
- Load balancing (round-robin, health-based)
- Service caching

**Integración Requerida:**
- Daemon debe registrarse al iniciar
- Health checks periódicos
- Deregistro en shutdown
- Load balancing entre instancias

### Integración con Skills CLI

**Ubicación**: `packages/skills-cli/`

**Comandos Relevantes:**
- `daemon start/stop/restart/status/logs`
- `pm2:start` - Inicia servicios con PM2
- `dashboard health/system` - Consulta daemon

**Integración Requerida:**
- CLI debe usar DaemonClient
- Comandos de gestión de clustering
- Comandos de health check distribuido

---

## 📊 Contexto de Métricas

### Métricas Actuales (metrics.ts)

**Contadores:**
- `daemon_activations_total` - Total activaciones
- `daemon_executions_total` - Total ejecuciones
- `daemon_policy_decisions_total` - Decisiones de policy

**Histogramas:**
- `daemon_activation_latency_seconds` - Latencia activación
- `daemon_execution_latency_seconds` - Latencia ejecución

### Métricas Target

**Circuit Breaker:**
- `circuit_breaker_state{service}` - Estado (0=CLOSED, 1=OPEN, 2=HALF_OPEN)
- `circuit_breaker_failures_total{service}` - Fallos acumulados
- `circuit_breaker_successes_total{service}` - Éxitos acumulados
- `circuit_breaker_open_duration_seconds{service}` - Tiempo en OPEN

**Retry:**
- `retry_attempts_total{operation}` - Intentos por operación
- `retry_successes_total{operation}` - Éxitos después de retry
- `retry_exhausted_total{operation}` - Retries agotados

**State:**
- `state_operations_total{operation}` - Operaciones Redis
- `state_cache_hit_ratio` - Hit ratio del cache
- `state_latency_seconds{operation}` - Latencia operaciones

**Clustering:**
- `daemon_instances_total` - Instancias activas
- `daemon_requests_per_instance{instance}` - Requests por instancia
- `daemon_memory_usage_bytes{instance}` - Memoria por instancia

---

## 🎯 Contexto de Quality Gates

### Gates por Fase

**FASE 1 - Resiliencia:**
- ✅ Circuit breakers funcionando en 3+ servicios
- ✅ Retry logic aplicado en 5+ operaciones críticas
- ✅ Graceful shutdown sin pérdida de requests
- ✅ Tests unitarios ≥ 80% coverage
- ✅ Zero errores de linter

**FASE 2 - Independencia:**
- ✅ Daemon accesible desde 0.0.0.0
- ✅ Autenticación JWT funcionando
- ✅ Cliente universal conecta desde IDE/CLI
- ✅ Registry remoto sincronizado
- ✅ API REST documentada (OpenAPI)

**FASE 3 - Escalabilidad:**
- ✅ 4+ instancias corriendo en cluster
- ✅ State compartido en Redis
- ✅ Load balancing health-based
- ✅ Session affinity funcionando
- ✅ Load test 100+ usuarios concurrentes

**FASE 4 - Observabilidad:**
- ✅ Tracing en /activate y /execute
- ✅ Logs estructurados en JSON
- ✅ Métricas de circuit breaker
- ✅ Dashboard Grafana funcional
- ✅ Alertas configuradas

**FASE 5 - Persistencia:**
- ✅ Event sourcing funcionando
- ✅ Backup automático cada 6h
- ✅ Recovery < 5 minutos
- ✅ Runbooks documentados

---

## 🔍 Contexto de Decisiones

### ADRs Relacionados

**Existentes:**
- ADR-011: Sistema de Blindaje MemTech
- ADR-085: Protocolo Unificado de ADRs

**Pendientes:**
- ADR-XXX: Circuit Breaker Strategy
- ADR-XXX: Distributed State Management
- ADR-XXX: Authentication & Authorization
- ADR-XXX: Observability Stack

### Decisiones Técnicas Clave

**1. Circuit Breaker vs Retry**
- **Decisión**: Usar AMBOS de forma complementaria
- **Razón**: Circuit breaker previene cascada, retry recupera fallos temporales
- **Trade-off**: Mayor complejidad vs mayor resiliencia

**2. Redis vs PostgreSQL para State**
- **Decisión**: Redis para state volátil, PostgreSQL para persistente
- **Razón**: Redis optimizado para cache/sessions, PG para eventos
- **Trade-off**: Dos sistemas vs mejor performance

**3. OpenTelemetry vs Prometheus**
- **Decisión**: OTEL para tracing, Prometheus para métricas
- **Razón**: OTEL es estándar para tracing, Prometheus para métricas
- **Trade-off**: Dos sistemas vs mejor observabilidad

**4. PM2 Cluster vs Kubernetes**
- **Decisión**: PM2 para MVP, K8s para futuro
- **Razón**: PM2 más simple, K8s overkill para inicio
- **Trade-off**: Menos features vs más rápido

---

## 📝 Contexto de Riesgos

### Riesgos Identificados

**Alto:**
1. **Integración con código existente** - Puede requerir refactoring extenso
2. **Tests de clustering** - Difícil de testear localmente
3. **Migración de state** - Pérdida de datos en transición

**Medio:**
4. **Performance overhead** - Circuit breakers/retry añaden latencia
5. **Complejidad operacional** - Más componentes = más puntos de fallo
6. **Backward compatibility** - Clientes existentes pueden romperse

**Bajo:**
7. **Documentación** - Puede quedar desactualizada
8. **Onboarding** - Curva de aprendizaje para equipo

### Mitigaciones

**Alto:**
1. Tests exhaustivos antes de integración, feature flags
2. Docker Compose para testing local de clustering
3. Migración gradual con dual-write, validación de datos

**Medio:**
4. Benchmarks antes/después, optimización de configs
5. Health checks robustos, runbooks completos
6. Versionado de API, deprecation warnings

**Bajo:**
7. Documentación como código, CI checks
8. Guías paso a paso, pair programming

---

## 🔄 Contexto de Iteración

### Checkpoint Schedule

**Checkpoint 1**: Al completar FASE 1 (Resiliencia)
- Validar circuit breakers funcionando
- Validar retry logic aplicado
- Validar graceful shutdown
- Reflexión y ajustes

**Checkpoint 2**: Al completar FASE 2 (Independencia)
- Validar acceso desde clientes externos
- Validar autenticación
- Validar cliente universal
- Reflexión y ajustes

**Checkpoint 3**: Al completar FASE 3 (Escalabilidad)
- Validar clustering
- Validar state distribuido
- Validar load balancing
- Reflexión y ajustes

**Checkpoint 4**: Al completar FASE 4 (Observabilidad)
- Validar tracing
- Validar logs estructurados
- Validar métricas avanzadas
- Reflexión y ajustes

**Checkpoint 5**: Al completar FASE 5 (Persistencia)
- Validar event sourcing
- Validar backups
- Validar recovery
- Reflexión y ajustes

**Checkpoint Final**: PRESPRINT
- Consolidar métricas
- Lecciones aprendidas
- Deuda técnica
- Próximos pasos

---

**Última actualización**: 2025-11-01  
**Próxima revisión**: Al completar FASE 1
