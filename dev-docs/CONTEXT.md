# CONTEXT.md - Contexto del Proyecto
**Código de Proyecto:** `SF-STABILITY-2025`  
**Dev Doc ID:** `SF-STABILITY-2025-CONTEXT`  
**Versión:** 1.0  
**Fecha de Creación:** 2025-11-05  
**Última Actualización:** 2025-11-05

---

## 📋 Información del Proyecto

### Identificación
- **Nombre del Proyecto:** Skills Fabrik - Stability & Security Improvements
- **Código:** SF-STABILITY-2025
- **Tipo:** Corrección de Deuda Técnica / Mejoras de Estabilidad
- **Prioridad:** 🔴 CRÍTICA
- **Estado:** 📝 Planificación

### Objetivo General
Corregir 23 problemas identificados en los componentes Router, Daemon y File Watcher del sistema Skills Fabrik, mejorando la seguridad, estabilidad y performance del sistema.

---

## 🎯 Contexto del Negocio

### Problema Actual
El análisis técnico reveló vulnerabilidades críticas que ponen en riesgo:
- **Seguridad:** Falta de validación de entrada, sin autenticación, sin rate limiting
- **Estabilidad:** Memory leaks, race conditions, falta de graceful shutdown
- **Performance:** Caches subóptimos, timeouts en cascada, debouncing inadecuado

### Impacto en el Negocio
- **Riesgo de Seguridad:** Vulnerabilidades explotables (RCE, DoS)
- **Downtime Potencial:** Crashes durante deployments, memory leaks
- **Costos Operacionales:** Debugging constante, incidentes frecuentes
- **Velocidad de Desarrollo:** Reducida por inestabilidad del sistema

### Beneficios Esperados
- **Reducción de Incidentes:** -80%
- **Mejora de Uptime:** 98.5% → 99.95%
- **Reducción de Costos:** $210K-$860K anuales
- **ROI:** 15x-60x en el primer año

---

## 🏗️ Arquitectura del Sistema

### Componentes Principales

#### 1. Router (`packages/router/`)
**Responsabilidad:** Punto de entrada para activación de skills, integración con editores y CLI

**Archivos Clave:**
- `src/server.ts` - Servidor HTTP Fastify
- `src/pre-invoke.ts` - Hook de pre-procesamiento y cache
- `src/stop.ts` - Pipeline de calidad post-respuesta
- `src/detectors.ts` - Detección y matching de reglas
- `src/guardrails.ts` - Validaciones de seguridad

**Problemas Identificados:** 11 (4 críticos, 2 alta, 3 media, 2 baja)

#### 2. Daemon (`packages/daemon/`)
**Responsabilidad:** Gestión de skills, persistencia de eventos, file watching, quality services

**Archivos Clave:**
- `src/app.ts` - Aplicación Fastify principal (2258 líneas)
- `src/fileWatcher.ts` - Servicio de monitoreo de archivos
- `src/index.ts` - Entry point
- `src/resilience/circuit-breaker.ts` - Circuit breakers
- `src/observability/` - Logging y tracing

**Problemas Identificados:** 8 (2 críticos, 2 alta, 3 media, 1 baja)

#### 3. File Watcher (`packages/daemon/src/fileWatcher.ts`)
**Responsabilidad:** Monitoreo de cambios en archivos, quality checks automáticos, WebSocket notifications

**Tecnologías:**
- chokidar para file watching
- WebSocket para notificaciones en tiempo real
- Debouncing para optimizar quality checks

**Problemas Identificados:** 4 (1 crítico, 0 alta, 2 media, 1 baja)

---

## 📊 Análisis de Problemas

### Distribución por Severidad

| Severidad | Cantidad | % Total | Tiempo Estimado |
|-----------|----------|---------|-----------------|
| 🔴 Crítico | 7 | 30.4% | 24-36 horas |
| 🟠 Alta | 4 | 17.4% | 18-26 horas |
| 🟡 Media | 8 | 34.8% | 24-34 horas |
| ⚪ Baja | 4 | 17.4% | 6-9 horas |
| **TOTAL** | **23** | **100%** | **72-105 horas** |

### Distribución por Componente

| Componente | Crítico | Alta | Media | Baja | Total | Tiempo |
|------------|---------|------|-------|------|-------|--------|
| Router | 4 | 2 | 3 | 2 | 11 | 31-46h |
| Daemon | 2 | 2 | 3 | 1 | 8 | 28-42h |
| File Watcher | 1 | 0 | 2 | 1 | 4 | 13-17h |

---

## 🔥 Problemas Críticos (Top 7)

### CRÍTICO-R1: Falta de Graceful Shutdown en Router
- **Archivo:** `packages/router/src/server.ts:88-115`
- **Impacto:** Pérdida de datos, conexiones zombie, imposibilidad de rolling deployments
- **Esfuerzo:** 2-4 horas
- **Sprint:** 1

### CRÍTICO-R2: Cache Sin Límites en Router
- **Archivo:** `packages/router/src/pre-invoke.ts:86-88`
- **Impacto:** Memory leaks graduales, OOM en servidores de larga duración
- **Esfuerzo:** 4-6 horas
- **Sprint:** 2

### CRÍTICO-R3: Falta de Circuit Breaker
- **Archivo:** `packages/router/src/pre-invoke.ts:118-211`
- **Impacto:** Cascading failures, timeouts de 9 segundos
- **Esfuerzo:** 3-5 horas
- **Sprint:** 1

### CRÍTICO-R4: Validación de Entrada Insuficiente
- **Archivo:** `packages/router/src/server.ts:24-83`
- **Impacto:** Vulnerabilidad de seguridad crítica (RCE, DoS)
- **Esfuerzo:** 6-8 horas
- **Sprint:** 1

### CRÍTICO-D1: Race Condition en File Watcher Shutdown
- **Archivo:** `packages/daemon/src/fileWatcher.ts:157-193`
- **Impacto:** Crashes durante shutdown, resource leaks
- **Esfuerzo:** 4-6 horas
- **Sprint:** 1

### CRÍTICO-D2: Memory Leak en Cache del Daemon
- **Archivo:** `packages/daemon/src/app.ts:809-876`
- **Impacto:** Memory leak gradual (60-100MB/día)
- **Esfuerzo:** 2-3 horas
- **Sprint:** 2

### CRÍTICO-FW1: Debouncing Inadecuado
- **Archivo:** `packages/daemon/src/fileWatcher.ts:421-452`
- **Impacto:** Memory leaks por timers, feedback lento (10s)
- **Esfuerzo:** 3-4 horas
- **Sprint:** 2

---

## 🛠️ Stack Tecnológico

### Backend
- **Runtime:** Node.js
- **Framework:** Fastify
- **Lenguaje:** TypeScript
- **File Watching:** chokidar
- **WebSocket:** ws
- **Testing:** Vitest

### Patrones y Prácticas
- Circuit Breaker Pattern (parcialmente implementado)
- Retry Logic con backoff
- Structured Logging (pino)
- OpenTelemetry para observabilidad

### Infraestructura
- **Process Manager:** PM2 (opcional)
- **Deployment:** Docker, Kubernetes
- **Monitoring:** Prometheus + Grafana (recomendado)

---

## 📚 Documentación de Referencia

### Documentos de Análisis
1. `INFORME-ANALISIS-ROUTER-DAEMON-FILEWATCHER.md` - Informe principal (1,376 líneas)
2. `ANALISIS-DETALLADO-PROBLEMAS-ADICIONALES.md` - Problemas adicionales (542 líneas)
3. `EJEMPLOS-CODIGO-CORRECCIONES.md` - Código de ejemplo (755 líneas)
4. `RESUMEN-EJECUTIVO-METRICAS.md` - Métricas y dashboard (473 líneas)
5. `README-ANALISIS.md` - Guía de navegación (280 líneas)

### Ubicación del Código
- **Repositorio:** `/Users/felipe/Developer/skills-fabrik`
- **Router:** `packages/router/src/`
- **Daemon:** `packages/daemon/src/`
- **Tests:** `packages/*/src/__tests__/`

---

## 👥 Stakeholders

### Equipo Técnico
- **Tech Lead:** [Asignar]
- **Desarrolladores:** [Asignar 2-3 devs]
- **QA:** [Asignar]
- **DevOps:** [Asignar]

### Roles y Responsabilidades
- **Tech Lead:** Revisión de arquitectura, code reviews, decisiones técnicas
- **Desarrolladores:** Implementación de correcciones, tests
- **QA:** Testing funcional, regression testing, performance testing
- **DevOps:** Deploy a staging/producción, monitoreo

---

## 📅 Timeline

### Duración Total: 4 semanas
- **Sprint 1:** Semana 1 (15-23h) - Problemas críticos
- **Sprint 2:** Semana 2 (21-29h) - Alta prioridad
- **Sprint 3:** Semana 3 (19-26h) - Media prioridad
- **Sprint 4:** Semana 4 (12-17h) - Baja prioridad

### Hitos Clave
- **Semana 1:** Vulnerabilidades críticas resueltas
- **Semana 2:** Memory leaks corregidos, observabilidad mejorada
- **Semana 3:** Resiliencia mejorada, deuda técnica reducida
- **Semana 4:** Deploy a producción, monitoreo

---

## 🎯 Criterios de Éxito

### Métricas Técnicas
- ✅ Uptime > 99.9%
- ✅ P95 Latency Router < 100ms
- ✅ Error Rate < 0.5%
- ✅ Memory usage estable < 512MB
- ✅ Cache hit rate > 80%
- ✅ Security score > 85/100

### Métricas de Negocio
- ✅ Reducción de incidentes > 80%
- ✅ MTTR < 15 minutos
- ✅ Tiempo de debugging -30%
- ✅ Satisfacción del equipo +40%

---

## ⚠️ Riesgos y Mitigaciones

### Riesgos Identificados

1. **Regresiones en funcionalidad existente**
   - Mitigación: Tests exhaustivos, code reviews, deploy gradual

2. **Tiempo de implementación subestimado**
   - Mitigación: Buffer de 20% en estimaciones, priorización clara

3. **Resistencia al cambio en el equipo**
   - Mitigación: Documentación clara, pair programming, capacitación

4. **Problemas en producción durante deploy**
   - Mitigación: Canary deployments, rollback plan, monitoreo intensivo

---

## 📝 Notas Adicionales

### Dependencias Externas
- Ninguna dependencia externa crítica identificada
- Todas las correcciones son internas al código

### Consideraciones Especiales
- Mantener compatibilidad con API existente
- No romper integraciones con editores (Cursor, VSCode)
- Preservar funcionalidad de CLI

### Próxima Revisión
- **Fecha:** Post-Sprint 2 (2 semanas)
- **Responsable:** Tech Lead
- **Objetivo:** Evaluar progreso y ajustar plan

---

**Documento Mantenido Por:** Tech Lead  
**Última Revisión:** 2025-11-05  
**Próxima Revisión:** 2025-11-19

