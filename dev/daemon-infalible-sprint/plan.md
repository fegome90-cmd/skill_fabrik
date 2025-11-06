# Plan: Sistema Daemon Infalible y Global

**Sprint ID**: daemon-infalible-sprint  
**Fecha Inicio**: 2025-11-01  
**Estado**: 🟡 IN_PROGRESS  
**Metodología**: CLOOP (Clarify → Layout → Operate → Observe → Reflect)

---

## CONTEXTO (C1)
Referencia rápida al estado y arquitectura actual/objetivo del daemon. Ver también: context.md.

## OBJETIVOS SMART (C2)
Objetivos medibles: independencia (0.0.0.0), resiliencia (CB+Retry), escalabilidad (PM2+Redis), observabilidad (OTEL+Pino), DoD y métricas definidas.

## ALCANCE/LIMITES (C3)
Alcance: rutas /health, /activate, /execute; integración router/CLI; sin migrar a K8s en este sprint. Límite: PM2 como orquestador.

## PLAN CLOOP (C4)
Fases por prioridad (F1–F6) con entregables, hipótesis y criterios de éxito por fase.

## RIESGOS/MITIGACIONES (C5)
Riesgos altos: integración, clustering local, migración de state. Mitigaciones: tests, compose, dual‑write.

## ENTREGABLES/DoD (C6)
Contrato /activate estable, CB+Retry integrados, shutdown limpio, ≥80% tests resiliencia, docs actualizadas.

## KPIs/MÉTRICAS (C7)
- activate_p95_ms < 100
- uptime >= 99.9%
- circuit_breaker_open_rate ↓
- retry_success_rate ≥ 95%

## GOBERNANZA/GATES (C8)
GO/NO‑GO por fase: contrato /activate OK, tests y lint PASS, smoke PASS. Ver “Próximos Pasos Inmediatos” y “OBSERVE”.

## 🎯 CLARIFY - Objetivos y Criterios de Éxito

### Problema Actual
El daemon (`packages/daemon`) tiene limitaciones críticas:
- ❌ Acoplado a localhost (127.0.0.1:7727) - no accesible globalmente
- ❌ Manejo de errores básico con `process.exit(1)` (index.ts:5)
- ❌ Sin circuit breakers ni retry logic
- ❌ Cache volátil en memoria (Map, app.ts:641-645)
- ❌ Sin clustering ni load balancing
- ❌ Dependencia PostgreSQL sin fallback (app.ts:56-76)
- ❌ Métricas básicas sin tracing distribuido

### Objetivos SMART

**1. Independencia del Repositorio (Global)**
- Daemon accesible desde 0.0.0.0 (no solo 127.0.0.1)
- API REST completa con autenticación
- Cliente universal para IDE/CLI/Anthropic/Codex
- Registry de skills remoto (no solo local)
- **Métrica**: 100% de clientes externos pueden conectarse

**2. Estabilidad 100%**
- Circuit breakers en todas las dependencias
- Retry exponencial con jitter
- Graceful degradation cuando servicios fallan
- Zero downtime deployments
- **Métrica**: Uptime ≥ 99.9%, Recovery Time < 30s

**3. Escalabilidad Horizontal**
- Clustering con PM2 (exec_mode: cluster)
- State distribuido con Redis
- Load balancing health-based
- Session affinity
- **Métrica**: Soportar 100+ usuarios concurrentes

**4. Observabilidad Completa**
- Tracing distribuido (OpenTelemetry)
- Logs estructurados (Pino)
- Métricas avanzadas (circuit breaker states, retry attempts)
- Dashboards Grafana
- **Métrica**: 100% de operaciones críticas trazadas

### Hipótesis de Validación

1. **Circuit breakers reducirán errores en cascada en 90%+**
2. **Retry exponencial mejorará tasa de éxito de operaciones en 95%+**
3. **Clustering permitirá 10x más throughput sin degradación**
4. **Tracing distribuido reducirá MTTR (Mean Time To Recovery) en 70%+**

### Criterios de Éxito (DoD - Definition of Done)

**Funcionales:**
- ✅ Daemon accesible desde cualquier cliente (IDE, CLI, API)
- ✅ Circuit breakers activos en DB, cache, file system
- ✅ Retry logic con backoff exponencial en operaciones críticas
- ✅ Clustering con 4+ instancias balanceadas
- ✅ Tracing end-to-end en /activate y /execute

**No Funcionales:**
- ✅ Uptime ≥ 99.9% (< 43 min downtime/mes)
- ✅ Latencia P95 < 100ms para /activate
- ✅ Latencia P99 < 500ms para /execute
- ✅ Recovery automático < 30s después de fallo
- ✅ 100+ usuarios concurrentes sin degradación

**Calidad:**
- ✅ Cobertura de tests ≥ 80%
- ✅ Zero errores de linter
- ✅ Documentación API completa
- ✅ Runbooks de troubleshooting

---

## 📐 LAYOUT - Arquitectura y Fases

### Arquitectura de Solución

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENTES EXTERNOS                         │
│  IDE (Cursor) │ CLI │ Anthropic │ Codex │ Custom Clients   │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP/REST + Auth (JWT/API Keys)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   LOAD BALANCER (PM2)                        │
│              Health-based + Session Affinity                 │
└──────────────────────────┬──────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
   ┌────────┐        ┌────────┐        ┌────────┐
   │Daemon 1│        │Daemon 2│        │Daemon N│
   │ Port:  │        │ Port:  │        │ Port:  │
   │ 7727   │        │ 7728   │        │ 772N   │
   └───┬────┘        └───┬────┘        └───┬────┘
       │                 │                  │
       └─────────────────┼──────────────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
   ┌─────────┐    ┌──────────┐    ┌──────────┐
   │ Redis   │    │PostgreSQL│    │ Chroma   │
   │(State)  │    │ (Events) │    │(Vectors) │
   └─────────┘    └──────────┘    └──────────┘
        │                │                │
        └────────────────┼────────────────┘
                         │
                    Circuit Breakers
                    Retry Logic
                    Observability
```

### Fases de Implementación

#### **FASE 1: Resiliencia** (Prioridad P0) - 1 semana
- ✅ Circuit Breaker implementation
- ✅ Retry logic con backoff exponencial
- ✅ Graceful shutdown
- ✅ Tests unitarios básicos

#### **FASE 2: Independencia** (Prioridad P0) - 1 semana
- ✅ Configuración externalizada (YAML) para host/port/CORS (default host 0.0.0.0)
- ✅ Guardia opcional por API key en /activate y /execute (header x-api-key; habilitado sólo si DAEMON_API_KEY)
 - ⏳ API REST con autenticación JWT/API Keys
 - ✅ Cliente universal (DaemonClient) mínimo con retry/CB y transporte inyectable
 - ✅ Integración router: pre-invoke consulta /activate y fusiona resultados (HTTP)
- ⏳ Registry remoto de skills
- ✅ Mejora /activate con señales estilo Prompt Builder v2 (boost de intent/path/content/keywords)
 - ✅ API REST documentada (OpenAPI stub en docs/daemon/API-REFERENCE.md)
 - ✅ Auth mínima: JWT HS256 opcional (DAEMON_JWT_SECRET) + endpoint `/api/v1/auth/token`

#### **FASE 3: Escalabilidad** (Prioridad P1) - 1 semana
 - ✅ Clustering PM2 activable (PM2_CLUSTER=1; env_production default)
 - ✅ State distribuido: manager unificado (mem/Redis) con TTL y test básico
 - ✅ Service discovery (registro + heartbeat, flag `SF_DISCOVERY=1`)
 - ✅ Router: discovery endpoint (flag `ROUTER_DISCOVERY=1`) para seleccionar daemon
 - ⏳ Load balancing inteligente

Runbooks
- docs/daemon/CLUSTER-RUNBOOK.md: comandos clave y flags de entorno

#### **FASE 4: Observabilidad** (Prioridad P1) - 1 semana
 - ✅ Logs estructurados (Pino) opcionales vía `SF_LOG_LEVEL`/`SF_LOG_PRETTY` (fallback a console)
- ✅ Stub OTEL tracing (flag `SF_OTEL=1`, sin dependencia dura; Jaeger endpoint configurable)
 - ✅ Spans básicos en /activate y /execute (si OTEL presente)
 - ✅ Métricas avanzadas
 - ✅ Dashboards Grafana (stub)
 - ✅ Alertas de ejemplo (docs/daemon/ALERTS.md)

#### **FASE 5: Persistencia** (Prioridad P2) - 1 semana
 - 🔄 Event sourcing (append + readLast; flag `SF_EVENT_STORE=1`)
 - 🔄 Backup automático (scripts stub)
 - 🔄 Disaster recovery (scripts stub)

#### **FASE 6: Validación y Documentación** - 1 semana
- ⏳ Tests E2E completos
- ⏳ Documentación API
- ⏳ Runbooks
- ⏳ PRESPRINT

---

## 🔄 OPERATE - Progreso Actual

### Trabajo Completado

#### ✅ Circuit Breaker (2025-11-01)
**Archivos creados:**
- `packages/daemon/src/resilience/circuit-breaker.ts` (200 líneas)
  - Estados: CLOSED, OPEN, HALF_OPEN
  - Métricas completas
  - Timeout configurable
  - Thresholds personalizables

- `packages/daemon/src/resilience/circuit-breaker-registry.ts` (100 líneas)
  - Registry centralizado
  - Gestión de múltiples breakers
  - Métricas agregadas

#### ✅ Retry Logic (2025-11-01)
**Archivos creados:**
- `packages/daemon/src/resilience/retry.ts` (150 líneas)
  - Backoff exponencial
  - Jitter para evitar thundering herd
  - Configuración de errores retryables
  - Decorator @Retryable

**Características:**
- Max attempts configurable
- Initial delay: 1s
- Backoff multiplier: 2x
- Max delay: 30s
- Jitter: 0-25%

### Trabajo en Progreso

#### 🔄 Integración en app.ts
**Estado:** Parcialmente completo
- ✅ `makeDbPool()` protegido con circuit breaker (pg:connect)
- ✅ `applyWritePlan` protegido con circuit breaker (sandbox:apply)
- ✅ `appendEvent()` con retry (FS write)
- ✅ Retry + circuit breaker en `db.query()` críticos (helper dbQuery)

#### 🔄 Graceful Shutdown
**Estado:** En curso
- ✅ Cierre limpio de Fastify (`app.close()`)
- ✅ Stop de file watcher
- ✅ Señales SIGINT/SIGTERM integradas
- ✅ `index.ts` evita `process.exit(1)` (usa `exitCode`)
- ⏳ Flush de métricas/DB garantizado (hook onClose ya cierra pool)

### Trabajo Pendiente

Ver `task.md` para lista completa de 24 tareas.

---

## 📊 OBSERVE - Métricas y KPIs

### Métricas de Éxito por Fase

**FASE 1 - Resiliencia:**
- Circuit breaker evita 90%+ errores en cascada: ⏳ Pendiente
- Retry mejora tasa de éxito a 95%+: ⏳ Pendiente
- Zero crashes por errores no manejados: ⏳ Pendiente
- Graceful shutdown sin pérdida de requests: ⏳ Pendiente

**FASE 2 - Independencia:**
- 100% clientes externos pueden conectarse: ⏳ Pendiente
- Autenticación funciona en 100% de requests: ⏳ Pendiente
- Registry remoto sincronizado < 5 min: ⏳ Pendiente
- API REST con 100% endpoints documentados: ⏳ Pendiente

**FASE 3 - Escalabilidad:**
- 100+ usuarios concurrentes sin degradación: ⏳ Pendiente
- Latencia P95 < 100ms bajo carga: ⏳ Pendiente
- Load balancing distribuye uniformemente: ⏳ Pendiente
- Zero pérdida de estado entre instancias: ⏳ Pendiente

**FASE 4 - Observabilidad:**
- 100% operaciones críticas trazadas: ⏳ Pendiente
- MTTR reducido en 70%+: ⏳ Pendiente
- Logs estructurados en 100% del código: ⏳ Pendiente
- Dashboards con 100% métricas clave: ⏳ Pendiente

**FASE 5 - Persistencia:**
- Recovery < 5 minutos: ⏳ Pendiente
- Zero pérdida de datos: ⏳ Pendiente
- Backups exitosos 100% del tiempo: ⏳ Pendiente
- Runbooks validados en producción: ⏳ Pendiente

### Herramientas de Medición

**Prometheus Queries:**
```promql
# Uptime
(time() - daemon_start_time_seconds) / 3600

# Latencia P95
histogram_quantile(0.95, rate(daemon_request_duration_seconds_bucket[5m]))

# Error rate
rate(daemon_errors_total[5m]) / rate(daemon_requests_total[5m])

# Circuit breaker open rate
sum(circuit_breaker_state == 1) / count(circuit_breaker_state)
```

---

## 🤔 REFLECT - Lecciones y Ajustes

### Checkpoint 1 (2025-11-01 - Inicio FASE 1)

**✅ Decisiones Correctas:**
- Crear dev docs PRIMERO como ancla metodológica
- Implementar circuit breaker antes de integración
- Separar retry logic en módulo independiente

**⚠️ Riesgos Identificados:**
- Integración con código existente puede requerir refactoring
- Tests necesitan cobertura completa antes de continuar
- Graceful shutdown debe probarse exhaustivamente

**📝 Lecciones Aprendidas:**
- Dev docs evitan drift y pérdida de contexto
- Estructura CLOOP mantiene enfoque sistemático
- Separación de concerns facilita testing

**🔄 Ajustes Necesarios:**
- Ninguno por ahora - seguir con el plan

---

## 📋 Archivos Clave

### Creados (9/17)
1. ✅ `packages/daemon/src/resilience/circuit-breaker.ts`
2. ✅ `packages/daemon/src/resilience/circuit-breaker-registry.ts`
3. ✅ `packages/daemon/src/resilience/retry.ts`
4. ✅ `packages/daemon/src/config/daemon-config.ts`
5. ✅ `packages/daemon/src/state/redis-adapter.ts`
6. ✅ `packages/daemon/src/observability/logger.ts`
7. ✅ `packages/daemon/src/observability/tracing.ts`
8. ✅ `packages/daemon/src/observability/otel.ts`
9. ✅ `packages/daemon/config/default.yaml` / `packages/daemon/config/production.yaml`

### Pendientes (8/17)
10. ⏳ `packages/daemon/src/auth/middleware.ts`
11. ✅ `packages/daemon/src/client/daemon-client.ts`
12. ⏳ `packages/daemon/src/state/distributed-state.ts`
13. ⏳ `packages/daemon/src/persistence/event-store.ts`
14. ⏳ `packages/daemon/src/persistence/backup.ts`
15. ⏳ `packages/daemon/test/resilience/circuit-breaker.spec.mjs`
16. ✅ `packages/daemon/test/client/daemon-client.spec.mjs`
17. ⏳ `packages/daemon/test/clustering/load-balancing.spec.mjs`

### Modificados (6/6)
1. ✅ `packages/daemon/src/index.ts` - Graceful shutdown (exitCode)
2. ✅ `packages/daemon/src/app.ts` - CB, retry, tracing spans, config, API key guard
3. ✅ `packages/daemon/src/confirm.ts` - Dual‑write Redis (flag SF_STATE_REDIS)
4. ⏳ `packages/daemon/src/metrics.ts` - Métricas avanzadas (pendiente)
5. ✅ `scripts/pm2/ecosystem.config.cjs` - Cluster opt‑in
6. ⏳ `packages/router/src/pre-invoke.ts` - DaemonClient (pendiente)

---

## 🎯 Próximos Pasos Inmediatos

1. **Métricas avanzadas (F4)**
   - Exponer CB states, retry attempts, cache hits en `metrics.ts`
   - Añadir contadores simples para spans generados (si aplica)

2. **State distribuido (F3)**
   - Implementar `distributed-state.ts` y feature‑flag para actCache/challenges (ya dual‑write listo)
   - Test ligero de TTL/state

3. **Auth mínima (F2)**
   - Middleware básico y placeholder para JWT (sin forzar clientes)

4. **DaemonClient (F2)**
   - Client TS mínimo con retry/CB y ejemplo en router (pre‑invoke)

5. **Docs & Gates**
   - Cerrar Fase 2 gate parcial (sin JWT): host 0.0.0.0, API key opcional, runbooks/flags

---

**Última actualización**: 2025-11-01  
**Próxima revisión**: Al completar FASE 1
- ✅ CORS leído desde config YAML/env
- ✅ Host/port desde config (0.0.0.0:3000 por defecto)
