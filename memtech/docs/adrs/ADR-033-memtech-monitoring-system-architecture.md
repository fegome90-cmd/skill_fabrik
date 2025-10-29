# ADR-033: MemTech Monitoring System Architecture

**Fecha**: 2025-01-19  
**Estado**: Aceptado  
**Decisores**: MemTech Team

## Contexto

El proyecto MemTech necesitaba un sistema de monitoreo robusto para hacer seguimiento del estado de la memoria, servicios críticos (Redis, PostgreSQL, Qdrant) y métricas avanzadas del pipeline de procesamiento. Se requería:

1. Visualización en tiempo real del estado del sistema
2. Métricas de memoria (Heap, RSS, External)
3. Monitoreo de servicios críticos
4. Métricas avanzadas con histogramas de latencia
5. Dashboard profesional con colores dinámicos
6. Sistema escalable y mantenible

## Decisiones Tomadas

### 1. Stack Tecnológico

**Decisión**: VictoriaMetrics + Grafana + MemTech Metrics Server

**Justificación**:

- **VictoriaMetrics**: TSDB más eficiente que Prometheus, mejor rendimiento
- **Grafana**: Estándar de la industria para visualización
- **MemTech Metrics Server**: Servidor Node.js personalizado para métricas específicas

### 2. Arquitectura de Scraping

**Decisión**: VictoriaMetrics como scraper principal (no vmagent)

**Justificación**:

- vmagent ya no se distribuye como binario separado
- VictoriaMetrics tiene capacidades de scraping integradas
- Simplifica la arquitectura (menos componentes)
- Mejor rendimiento y estabilidad

### 3. Métricas Avanzadas

**Decisión**: Implementar histogramas de latencia por etapa + contadores de errores

**Justificación**:

- Histogramas permiten calcular percentiles (p95, p99)
- Contadores de errores por tipo facilitan debugging
- Simulación realista para desarrollo y testing
- Preparación para integración OTEL futura

### 4. Dashboard Design

**Decisión**: Dashboard profesional con emojis, colores dinámicos y leyendas legibles

**Justificación**:

- Emojis mejoran UX y identificación rápida
- Colores dinámicos (verde/amarillo/rojo) según umbrales
- Leyendas legibles en lugar de expresiones PromQL
- Tipos de panel apropiados (stat vs timeseries)

### 5. Configuración de Umbrales

**Decisión**: Umbrales específicos por tipo de métrica

**Justificación**:

- **CPU**: <70% verde, 70-90% amarillo, >90% rojo
- **Cache Hit Ratio**: >88% verde, 70-88% amarillo, <70% rojo
- **Latencia Qdrant**: <200ms verde, 200-350ms amarillo, >350ms rojo
- **Memoria**: <50MB verde, 50-80MB amarillo, >80MB rojo

## Alternativas Consideradas

### 1. Prometheus + Grafana

**Rechazado**: VictoriaMetrics es más eficiente y escalable

### 2. vmagent como scraper separado

**Rechazado**: Binario no disponible, VictoriaMetrics integrado es mejor

### 3. Métricas básicas únicamente

**Rechazado**: Histogramas y contadores son esenciales para observabilidad

### 4. Dashboard simple sin emojis

**Rechazado**: UX profesional es importante para adopción del equipo

## Consecuencias

### Positivas

- ✅ Sistema robusto y escalable
- ✅ Métricas avanzadas para debugging
- ✅ Dashboard profesional y usable
- ✅ Documentación completa
- ✅ Scripts de automatización
- ✅ Preparado para OTEL futuro

### Negativas

- ⚠️ Curva de aprendizaje para VictoriaMetrics
- ⚠️ Dashboard secundario con problemas de rendimiento
- ⚠️ OTEL Collector no instalado (issue menor)

## Implementación

### Componentes Implementados

1. **VictoriaMetrics** (puerto 8428) - TSDB y scraper
2. **Grafana** (puerto 3001) - Visualización
3. **MemTech Metrics Server** (puerto 3030) - Métricas personalizadas
4. **Node Exporter** (puerto 9100) - Métricas del sistema
5. **PostgreSQL Exporter** (puerto 9187) - Métricas de BD

### Dashboards Creados

1. **MemTech Vital Monitor v3.0** - Dashboard principal funcional
2. **MemTech Memory Consumption v3** - Dashboard de memoria (issue menor)

### Métricas Implementadas

- Métricas básicas MemTech (memoria, CPU, uptime, conexiones)
- Histogramas de latencia por etapa (ingest, embedding, qdrant_search)
- Contadores de errores por tipo (timeout, qdrant_error, redis_miss)
- Métricas del sistema (Node Exporter)

## Monitoreo y Alertas

### Métricas Críticas

- `up` - Estado de servicios
- `memtech_memory_usage_bytes` - Uso de memoria
- `memtech_errors_total` - Errores por tipo
- `memtech_stage_latency_ms` - Latencia por etapa

### Umbrales de Alerta

- Memoria Heap > 80MB
- Cache Hit Ratio < 70%
- Latencia Qdrant > 350ms
- CPU Usage > 90%

## Mantenimiento

### Scripts de Automatización

- `setup-complete-monitoring-system.sh` - Instalación completa
- `diagnose-monitoring-system.sh` - Diagnóstico del sistema
- `start-memtech-metrics-server.mjs` - Servidor de métricas

### Documentación

- README completo con troubleshooting
- ADRs de decisiones arquitectónicas
- Guías de instalación y mantenimiento

## Lecciones Aprendidas

1. **VictoriaMetrics es superior a Prometheus** para este caso de uso
2. **Dashboard profesional mejora adopción** del equipo
3. **Métricas avanzadas son esenciales** para debugging
4. **Documentación completa es crítica** para mantenimiento
5. **Scripts de automatización** reducen tiempo de setup

## Referencias

- [VictoriaMetrics Documentation](https://docs.victoriametrics.com/)
- [Grafana Dashboard Best Practices](https://grafana.com/docs/grafana/latest/dashboards/)
- [Prometheus Metrics Best Practices](https://prometheus.io/docs/practices/naming/)
- [OpenTelemetry Collector](https://opentelemetry.io/docs/collector/)

---

**Decisión**: Aceptada  
**Fecha de Implementación**: 2025-01-19  
**Revisión**: Cada 6 meses o cuando se requieran cambios arquitectónicos
