# PLAN.md - Plan de Implementación
**Código de Proyecto:** `SF-STABILITY-2025`  
**Dev Doc ID:** `SF-STABILITY-2025-PLAN`  
**Versión:** 1.0  
**Fecha de Creación:** 2025-11-05  
**Última Actualización:** 2025-11-05

---

## 📋 Resumen Ejecutivo del Plan

### Objetivo
Implementar correcciones para 23 problemas identificados en 4 sprints de 1 semana cada uno, mejorando seguridad, estabilidad y performance del sistema Skills Fabrik.

### Métricas Clave
- **Problemas a Resolver:** 23
- **Tiempo Total:** 72-105 horas
- **Duración:** 4 semanas
- **Reducción de Riesgo:** 100% (acumulativo)
- **ROI Esperado:** 15x-60x

---

## 🎯 Sprint 1 - Problemas Críticos de Seguridad y Estabilidad

**Duración:** Semana 1 (5 días laborables)  
**Esfuerzo Total:** 15-23 horas  
**Reducción de Riesgo:** 40%  
**Prioridad:** 🔴 CRÍTICA

### Objetivos del Sprint
- Eliminar vulnerabilidades de seguridad críticas
- Implementar graceful shutdown
- Corregir race conditions
- Agregar circuit breaker para resiliencia

### Tareas

#### Tarea 1.1: Validación de Entrada en Router
**ID:** `SF-STABILITY-2025-T1.1`  
**Problema:** CRÍTICO-R4  
**Esfuerzo:** 6-8 horas  
**Asignado a:** [Developer 1]

**Descripción:**
Implementar validación de esquemas en todos los endpoints del router usando Ajv.

**Archivos a Modificar:**
- `packages/router/src/server.ts`
- `packages/router/package.json` (agregar ajv, ajv-formats)

**Pasos de Implementación:**
1. Instalar dependencias: `npm install ajv ajv-formats`
2. Crear schemas de validación para cada endpoint
3. Implementar middleware de validación
4. Agregar rate limiting con `@fastify/rate-limit`
5. Escribir tests unitarios
6. Actualizar documentación

**Criterios de Aceptación:**
- ✅ Todos los endpoints tienen validación de esquema
- ✅ Requests inválidos retornan 400 con detalles del error
- ✅ Rate limiting configurado (100 req/min)
- ✅ Tests cubren casos válidos e inválidos
- ✅ No hay regresiones en funcionalidad existente

**Referencia:**
Ver `EJEMPLOS-CODIGO-CORRECCIONES.md` sección "Validación de Entrada"

---

#### Tarea 1.2: Graceful Shutdown en Router
**ID:** `SF-STABILITY-2025-T1.2`  
**Problema:** CRÍTICO-R1  
**Esfuerzo:** 2-4 horas  
**Asignado a:** [Developer 1]

**Descripción:**
Implementar manejo de señales SIGTERM/SIGINT para shutdown graceful.

**Archivos a Modificar:**
- `packages/router/src/server.ts`
- `packages/router/src/shutdown.ts` (NUEVO)
- `packages/router/src/pre-invoke.ts` (exportar daemonCache)

**Pasos de Implementación:**
1. Crear clase `GracefulShutdown` en nuevo archivo
2. Implementar handlers para SIGTERM, SIGINT
3. Agregar timeout de 30s para forced shutdown
4. Limpiar caches y recursos
5. Actualizar health check para reflejar estado de shutdown
6. Escribir tests de integración

**Criterios de Aceptación:**
- ✅ Servidor cierra conexiones activas gracefully
- ✅ Caches se limpian correctamente
- ✅ Health check retorna 503 durante shutdown
- ✅ Timeout de 30s funciona correctamente
- ✅ Tests verifican shutdown completo

**Referencia:**
Ver `EJEMPLOS-CODIGO-CORRECCIONES.md` sección "Graceful Shutdown"

---

#### Tarea 1.3: Corregir Race Condition en File Watcher
**ID:** `SF-STABILITY-2025-T1.3`  
**Problema:** CRÍTICO-D1  
**Esfuerzo:** 4-6 horas  
**Asignado a:** [Developer 2]

**Descripción:**
Convertir método `stop()` del file watcher a asíncrono y esperar cierre de recursos.

**Archivos a Modificar:**
- `packages/daemon/src/fileWatcher.ts`
- `packages/daemon/src/app.ts` (actualizar llamada a stop())

**Pasos de Implementación:**
1. Cambiar firma de `stop()` a `async stop(): Promise<void>`
2. Esperar cierre de watchers con Promise.all
3. Esperar cierre de WebSocket server
4. Cerrar clientes WebSocket activos
5. Actualizar tipo de `qualityCheckDebouncers` para guardar ambos timers
6. Escribir tests de shutdown

**Criterios de Aceptación:**
- ✅ Método stop() es asíncrono
- ✅ Todos los watchers se cierran correctamente
- ✅ WebSocket server se cierra sin errores
- ✅ Clientes WebSocket reciben mensaje de cierre
- ✅ No hay race conditions en tests

**Referencia:**
Ver `EJEMPLOS-CODIGO-CORRECCIONES.md` sección "File Watcher Shutdown"

---

#### Tarea 1.4: Implementar Circuit Breaker en Router
**ID:** `SF-STABILITY-2025-T1.4`  
**Problema:** CRÍTICO-R3  
**Esfuerzo:** 3-5 horas  
**Asignado a:** [Developer 2]

**Descripción:**
Agregar circuit breaker para llamadas del router al daemon.

**Archivos a Modificar:**
- `packages/router/src/resilience/circuit-breaker.ts` (NUEVO)
- `packages/router/src/pre-invoke.ts`

**Pasos de Implementación:**
1. Crear clase CircuitBreaker (copiar de daemon o crear nueva)
2. Instanciar circuit breaker global para daemon
3. Envolver llamadas fetch en circuit breaker
4. Manejar CircuitBreakerError apropiadamente
5. Agregar métricas de circuit breaker a metadata
6. Escribir tests unitarios

**Criterios de Aceptación:**
- ✅ Circuit breaker se abre después de 5 fallos
- ✅ Circuit breaker se cierra después de 2 éxitos en half-open
- ✅ Timeout de 5s funciona correctamente
- ✅ Metadata incluye estado del circuit breaker
- ✅ Tests cubren todos los estados (CLOSED, OPEN, HALF_OPEN)

**Referencia:**
Ver `EJEMPLOS-CODIGO-CORRECCIONES.md` sección "Circuit Breaker"

---

### Entregables del Sprint 1

- [ ] Código implementado y testeado
- [ ] Tests unitarios y de integración
- [ ] Code review completado
- [ ] Documentación actualizada
- [ ] Deploy a ambiente de staging
- [ ] Smoke testing en staging
- [ ] Retrospectiva del sprint

### Métricas de Éxito Sprint 1

| Métrica | Baseline | Target |
|---------|----------|--------|
| Security Score | 40/100 | 70/100 |
| Uptime | 98.5% | 99.5% |
| P95 Latency Router | 250ms | 150ms |
| Error Rate | 2.5% | 1.5% |

---

## 🎯 Sprint 2 - Memory Leaks y Observabilidad

**Duración:** Semana 2 (5 días laborables)  
**Esfuerzo Total:** 21-29 horas  
**Reducción de Riesgo:** 30%  
**Prioridad:** 🔴 CRÍTICA / 🟠 ALTA

### Objetivos del Sprint
- Corregir memory leaks en caches
- Optimizar debouncing en file watcher
- Implementar logging estructurado
- Estandarizar manejo de errores

### Tareas

#### Tarea 2.1: Implementar LRU Cache en Router
**ID:** `SF-STABILITY-2025-T2.1`  
**Problema:** CRÍTICO-R2  
**Esfuerzo:** 4-6 horas  
**Asignado a:** [Developer 1]

**Descripción:**
Reemplazar Map simple con LRU Cache que incluye cleanup automático.

**Archivos a Modificar:**
- `packages/router/src/cache/lru-cache.ts` (NUEVO)
- `packages/router/src/pre-invoke.ts`
- `packages/router/src/shutdown.ts` (limpiar cache en shutdown)

**Pasos de Implementación:**
1. Crear clase LRUCache genérica
2. Implementar eviction LRU
3. Agregar cleanup periódico (cada 30s)
4. Implementar tracking de estadísticas
5. Reemplazar Map en pre-invoke.ts
6. Limpiar cache en shutdown
7. Escribir tests exhaustivos

**Criterios de Aceptación:**
- ✅ Cache evict LRU cuando está lleno
- ✅ Cleanup automático cada 30s
- ✅ Estadísticas incluyen hit rate, evictions, expirations
- ✅ Memory usage estable en load testing
- ✅ Tests cubren edge cases

**Referencia:**
Ver `EJEMPLOS-CODIGO-CORRECCIONES.md` sección "LRU Cache"

---

#### Tarea 2.2: Cache Cleanup en Daemon
**ID:** `SF-STABILITY-2025-T2.2`  
**Problema:** CRÍTICO-D2  
**Esfuerzo:** 2-3 horas  
**Asignado a:** [Developer 2]

**Descripción:**
Activar cleanup periódico del cache en daemon que ya está definido pero no se usa.

**Archivos a Modificar:**
- `packages/daemon/src/app.ts`

**Pasos de Implementación:**
1. Iniciar setInterval para cleanupExpiredEntries()
2. Limpiar interval en shutdown
3. Limpiar cache completo en shutdown
4. Agregar logging de cleanup
5. Escribir tests

**Criterios de Aceptación:**
- ✅ Cleanup se ejecuta cada 30s
- ✅ Entradas expiradas se eliminan correctamente
- ✅ Interval se limpia en shutdown
- ✅ Logs muestran entradas limpiadas
- ✅ Memory usage estable

**Referencia:**
Ver `INFORME-ANALISIS-ROUTER-DAEMON-FILEWATCHER.md` CRÍTICO-D2

---

#### Tarea 2.3: Optimizar Debouncing en File Watcher
**ID:** `SF-STABILITY-2025-T2.3`  
**Problema:** CRÍTICO-FW1  
**Esfuerzo:** 3-4 horas  
**Asignado a:** [Developer 2]

**Descripción:**
Reducir debounce de 10s a 2s y corregir memory leak de failsafe timers.

**Archivos a Modificar:**
- `packages/daemon/src/fileWatcher.ts`

**Pasos de Implementación:**
1. Cambiar debounce default de 10000ms a 2000ms
2. Guardar ambos timers (debouncer + failsafe) en Map
3. Limpiar ambos timers al cancelar
4. Reducir failsafe timeout a 3x debounce
5. Hacer debounce configurable via env var
6. Escribir tests

**Criterios de Aceptación:**
- ✅ Debounce default es 2s
- ✅ Failsafe es 6s (3x debounce)
- ✅ Ambos timers se limpian correctamente
- ✅ No hay memory leaks en tests de larga duración
- ✅ Feedback es más rápido (2s vs 10s)

**Referencia:**
Ver `INFORME-ANALISIS-ROUTER-DAEMON-FILEWATCHER.md` CRÍTICO-FW1

---

#### Tarea 2.4: Logging Estructurado en Router
**ID:** `SF-STABILITY-2025-T2.4`
**Problema:** ALTA-R2
**Esfuerzo:** 4-6 horas
**Asignado a:** [Developer 1]

**Descripción:**
Migrar de console.log a logger estructurado (pino) en todo el router.

**Archivos a Modificar:**
- `packages/router/package.json` (agregar pino)
- `packages/router/src/logger.ts` (NUEVO)
- `packages/router/src/server.ts`
- `packages/router/src/pre-invoke.ts`
- `packages/router/src/stop.ts`

**Pasos de Implementación:**
1. Instalar pino: `npm install pino`
2. Crear configuración de logger
3. Reemplazar todos los console.* con logger
4. Agregar request ID tracking
5. Configurar niveles de log por ambiente
6. Escribir tests

**Criterios de Aceptación:**
- ✅ No hay console.log/warn/error en el código
- ✅ Logs son JSON estructurado
- ✅ Request IDs se propagan
- ✅ Niveles de log configurables
- ✅ Performance no se degrada

**Referencia:**
Ver `INFORME-ANALISIS-ROUTER-DAEMON-FILEWATCHER.md` ALTA-R2

---

#### Tarea 2.5: Estandarizar Manejo de Errores
**ID:** `SF-STABILITY-2025-T2.5`
**Problema:** ALTA-D2
**Esfuerzo:** 8-10 horas
**Asignado a:** [Developer 3]

**Descripción:**
Estandarizar manejo de errores en daemon, eliminar errores silenciosos.

**Archivos a Modificar:**
- `packages/daemon/src/app.ts`
- `packages/daemon/src/fileWatcher.ts`
- Múltiples archivos en `packages/daemon/src/`

**Pasos de Implementación:**
1. Identificar todos los catch blocks que tragan errores
2. Agregar logging apropiado
3. Estandarizar formato de error responses
4. Crear error classes custom si necesario
5. Actualizar tests
6. Code review exhaustivo

**Criterios de Aceptación:**
- ✅ No hay catch blocks vacíos
- ✅ Todos los errores se loggean
- ✅ Formato de error consistente
- ✅ Tests verifican error handling
- ✅ Documentación actualizada

**Referencia:**
Ver `INFORME-ANALISIS-ROUTER-DAEMON-FILEWATCHER.md` ALTA-D2

---

### Entregables del Sprint 2

- [ ] LRU Cache implementado y testeado
- [ ] Cache cleanup funcionando
- [ ] Debouncing optimizado
- [ ] Logger estructurado migrado
- [ ] Manejo de errores estandarizado
- [ ] Tests completos
- [ ] Code review completado
- [ ] Deploy a staging
- [ ] Performance testing
- [ ] Retrospectiva del sprint

### Métricas de Éxito Sprint 2

| Métrica | Post-Sprint 1 | Target |
|---------|---------------|--------|
| Memory Usage | Variable | Estable < 512MB |
| Cache Hit Rate | 60% | 80% |
| P95 Latency Daemon | 400ms | 200ms |
| Error Rate | 1.5% | 0.5% |

---

## 🎯 Sprint 3 - Resiliencia y Mantenibilidad

**Duración:** Semana 3 (5 días laborables)
**Esfuerzo Total:** 19-26 horas
**Reducción de Riesgo:** 20%
**Prioridad:** 🟠 ALTA / 🟡 MEDIA

### Objetivos del Sprint
- Implementar rate limiting y autenticación
- Agregar health checks proactivos
- Definir contratos de API
- Mejoras de resiliencia adicionales

### Tareas

#### Tarea 3.1: Rate Limiting y Autenticación
**ID:** `SF-STABILITY-2025-T3.1`
**Problema:** ALTA-D1
**Esfuerzo:** 6-8 horas
**Asignado a:** [Developer 1]

**Descripción:**
Implementar rate limiting global y autenticación con API keys en daemon.

**Archivos a Modificar:**
- `packages/daemon/src/app.ts`
- `packages/daemon/src/middleware/auth.ts` (NUEVO)
- `packages/daemon/package.json`

**Pasos de Implementación:**
1. Instalar `@fastify/rate-limit`
2. Configurar rate limiting global
3. Implementar autenticación con API keys
4. Agregar CORS restrictivo
5. Actualizar documentación de API
6. Escribir tests

**Criterios de Aceptación:**
- ✅ Rate limiting: 100 req/min por IP
- ✅ API keys requeridos en endpoints públicos
- ✅ CORS configurado correctamente
- ✅ Tests verifican rate limiting
- ✅ Documentación actualizada

---

#### Tarea 3.2: Health Checks Proactivos
**ID:** `SF-STABILITY-2025-T3.2`
**Problema:** MEDIO-I1
**Esfuerzo:** 3-4 horas
**Asignado a:** [Developer 2]

**Descripción:**
Implementar health checks periódicos del router al daemon.

**Archivos a Modificar:**
- `packages/router/src/health-checker.ts` (NUEVO)
- `packages/router/src/pre-invoke.ts`

**Pasos de Implementación:**
1. Crear clase DaemonHealthChecker
2. Implementar polling cada 30s
3. Usar health check antes de llamar daemon
4. Agregar métricas de health
5. Escribir tests

**Criterios de Aceptación:**
- ✅ Health check cada 30s
- ✅ Skip daemon call si unhealthy
- ✅ Métricas de disponibilidad
- ✅ Tests verifican comportamiento

---

#### Tarea 3.3: Contratos de API con OpenAPI
**ID:** `SF-STABILITY-2025-T3.3`
**Problema:** MEDIO-I2
**Esfuerzo:** 6-8 horas
**Asignado a:** [Developer 3]

**Descripción:**
Definir schemas OpenAPI para todos los endpoints.

**Archivos a Modificar:**
- `packages/router/openapi.yaml` (NUEVO)
- `packages/daemon/openapi.yaml` (NUEVO)
- `packages/*/src/server.ts`

**Pasos de Implementación:**
1. Instalar `@fastify/swagger`
2. Definir schemas OpenAPI
3. Generar tipos TypeScript
4. Validar requests/responses
5. Generar documentación
6. Escribir tests

**Criterios de Aceptación:**
- ✅ Schemas completos para todos los endpoints
- ✅ Tipos TypeScript generados
- ✅ Documentación auto-generada
- ✅ Validación funciona
- ✅ Tests verifican schemas

---

#### Tarea 3.4: Exponential Backoff en Retries
**ID:** `SF-STABILITY-2025-T3.4`
**Problema:** MEDIO-R1
**Esfuerzo:** 2-3 horas
**Asignado a:** [Developer 2]

**Descripción:**
Agregar exponential backoff con jitter en retries del router.

**Archivos a Modificar:**
- `packages/router/src/pre-invoke.ts`

**Pasos de Implementación:**
1. Implementar función calculateBackoff()
2. Agregar sleep entre retries
3. Agregar jitter para evitar thundering herd
4. Loggear intentos de retry
5. Escribir tests

**Criterios de Aceptación:**
- ✅ Backoff exponencial: 100ms, 200ms, 400ms
- ✅ Jitter ±25%
- ✅ Max backoff 5s
- ✅ Logs muestran retries
- ✅ Tests verifican backoff

---

#### Tarea 3.5: Manejo de Permisos en File Watcher
**ID:** `SF-STABILITY-2025-T3.5`
**Problema:** MEDIO-D1
**Esfuerzo:** 2-3 horas
**Asignado a:** [Developer 1]

**Descripción:**
Mejorar manejo de errores de permisos en file watcher.

**Archivos a Modificar:**
- `packages/daemon/src/fileWatcher.ts`

**Pasos de Implementación:**
1. Verificar permisos antes de leer archivo
2. Distinguir entre ENOENT, EACCES, otros errores
3. Reducir logs espurios
4. Escribir tests

**Criterios de Aceptación:**
- ✅ Errores de permisos manejados gracefully
- ✅ Logs apropiados por tipo de error
- ✅ No hay logs espurios
- ✅ Tests cubren casos de error

---

### Entregables del Sprint 3

- [ ] Rate limiting implementado
- [ ] Health checks funcionando
- [ ] Contratos API definidos
- [ ] Exponential backoff implementado
- [ ] Manejo de permisos mejorado
- [ ] Tests completos
- [ ] Integration testing
- [ ] Deploy a staging
- [ ] Retrospectiva del sprint

### Métricas de Éxito Sprint 3

| Métrica | Post-Sprint 2 | Target |
|---------|---------------|--------|
| Security Score | 70/100 | 85/100 |
| MTTR | 30min | 15min |
| API Consistency | 60% | 90% |

---

## 🎯 Sprint 4 - Optimizaciones y Deploy

**Duración:** Semana 4 (5 días laborables)
**Esfuerzo Total:** 12-17 horas
**Reducción de Riesgo:** 10%
**Prioridad:** 🟡 MEDIA / ⚪ BAJA

### Objetivos del Sprint
- Implementar mejoras de baja prioridad
- Completar documentación
- Performance testing exhaustivo
- Deploy a producción

### Tareas

#### Tarea 4.1: WebSocket Heartbeat
**ID:** `SF-STABILITY-2025-T4.1`
**Problema:** MEDIO-I3
**Esfuerzo:** 2-3 horas

**Descripción:**
Implementar ping/pong heartbeat en WebSocket connections.

---

#### Tarea 4.2: Configuración Centralizada
**ID:** `SF-STABILITY-2025-T4.2`
**Problema:** MEDIO-D2
**Esfuerzo:** 4-6 horas

**Descripción:**
Centralizar configuración con validación usando Zod.

---

#### Tarea 4.3: Compresión HTTP
**ID:** `SF-STABILITY-2025-T4.3`
**Problema:** BAJA-R1
**Esfuerzo:** 1 hora

**Descripción:**
Agregar compresión gzip/brotli en respuestas.

---

#### Tarea 4.4: Métricas Prometheus
**ID:** `SF-STABILITY-2025-T4.4`
**Problema:** BAJA-D1
**Esfuerzo:** 3-4 horas

**Descripción:**
Implementar endpoint /metrics con formato Prometheus.

---

#### Tarea 4.5: Deploy a Producción
**ID:** `SF-STABILITY-2025-T4.5`
**Esfuerzo:** 2-3 horas

**Descripción:**
Deploy gradual a producción con monitoreo intensivo.

**Pasos:**
1. Deploy canary (10% tráfico)
2. Monitoreo 2 horas
3. Incrementar a 50%
4. Monitoreo 4 horas
5. Deploy completo (100%)
6. Monitoreo 48 horas

---

### Entregables del Sprint 4

- [ ] Todas las mejoras implementadas
- [ ] Documentación completa
- [ ] Performance testing completado
- [ ] Load testing completado
- [ ] Deploy a producción exitoso
- [ ] Monitoreo configurado
- [ ] Retrospectiva final
- [ ] Post-mortem del proyecto

---

## 📊 Tracking de Progreso

### Dashboard de Métricas

| Sprint | Problemas Resueltos | Horas Invertidas | Reducción Riesgo | Status |
|--------|---------------------|------------------|------------------|--------|
| Sprint 1 | 0/4 | 0/23 | 0% | 📝 Planificado |
| Sprint 2 | 0/5 | 0/29 | 0% | 📝 Planificado |
| Sprint 3 | 0/5 | 0/26 | 0% | 📝 Planificado |
| Sprint 4 | 0/9 | 0/17 | 0% | 📝 Planificado |
| **TOTAL** | **0/23** | **0/95** | **0%** | **📝 Planificado** |

---

## 🎯 Definición de Done

### Por Tarea
- [ ] Código implementado según especificación
- [ ] Tests unitarios escritos y pasando
- [ ] Tests de integración escritos y pasando
- [ ] Code review completado y aprobado
- [ ] Documentación actualizada
- [ ] No hay regresiones
- [ ] Performance no degradada

### Por Sprint
- [ ] Todas las tareas completadas
- [ ] Tests completos pasando
- [ ] Deploy a staging exitoso
- [ ] Smoke testing pasando
- [ ] Métricas de éxito alcanzadas
- [ ] Retrospectiva completada
- [ ] Documentación actualizada

### Proyecto Completo
- [ ] 23 problemas resueltos
- [ ] Todos los tests pasando
- [ ] Deploy a producción exitoso
- [ ] Métricas finales alcanzadas
- [ ] Documentación completa
- [ ] Post-mortem completado
- [ ] Conocimiento transferido

---

**Documento Mantenido Por:** Tech Lead
**Última Actualización:** 2025-11-05
**Próxima Revisión:** Fin de cada sprint

