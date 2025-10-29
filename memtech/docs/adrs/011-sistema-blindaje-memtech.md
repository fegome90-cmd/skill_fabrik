# ADR-011: Sistema de Blindaje para MemTech

## Estado

Aceptado

## Contexto

El sistema MemTech requiere un blindaje robusto para garantizar la continuidad operativa de los procesos críticos, incluyendo:

- **Memoria jerárquica**: Sistema de 4 niveles (L0-L3) que preserva contexto entre reinicios
- **Pipeline de métricas**: vmagent, exportadores y VictoriaMetrics para telemetría
- **Backups automatizados**: Preservación de datos críticos con verificación de integridad
- **ADR Mining**: Proceso automatizado de extracción y generación de documentación
- **Health checks**: Monitoreo continuo y alertas automáticas

Sin un sistema de blindaje adecuado, los procesos críticos podrían fallar silenciosamente, causando pérdida de contexto, métricas y conocimiento del sistema.

## Decisión

Implementar un sistema de blindaje completo que incluye:

### 1. Scripts de Provisión

- `scripts/setup-local-services.sh`: Configuración de PostgreSQL y Redis
- `scripts/setup-metrics.sh`: Instalación de vmagent y exportadores
- `scripts/create-launchd-services.sh`: Creación de servicios de macOS

### 2. Servicios en Background (launchd)

- `com.memtech.memoryd`: MemTech Agent (cada 5 minutos)
- `com.memtech.metricsd`: Exportadores de métricas (cada 1 minuto)
- `com.memtech.adrminer`: ADR Mining (semanalmente, lunes 2 AM)
- `com.memtech.healthcheck`: Health checks (cada 5 minutos)
- `com.memtech.backup`: Backups (cada 6 horas)

### 3. Health Checks y Alertas

- `scripts/metrics-verify.mjs`: Verificación de pipeline de métricas
- `scripts/memory-verify.mjs`: Verificación de sistema de memoria
- Sistema de alertas con niveles de severidad
- Logs centralizados con rotación automática

### 4. Sistema de Backups

- `scripts/backup-memtech.sh`: Backup completo del sistema
- Verificación de integridad con SHA256
- Compresión automática y limpieza de backups antiguos
- Metadatos detallados para trazabilidad

### 5. Runbooks de Recuperación

- `docs/runbooks/memoria.md`: Recuperación del sistema de memoria
- `docs/runbooks/metricas.md`: Recuperación del pipeline de métricas
- `docs/runbooks/backups.md`: Procedimientos de restauración
- `docs/runbooks/adr-mining.md`: Recuperación del proceso de ADR mining

### 6. Script Maestro

- `scripts/blindaje-memtech.sh`: Ejecución automática de todo el proceso
- Verificación de prerrequisitos
- Configuración paso a paso con validaciones
- Logging detallado y manejo de errores

## Alternativas Consideradas

### Alternativa 1: Blindaje Manual

- **Pros**: Control total sobre cada paso
- **Contras**: Propenso a errores humanos, no escalable, difícil de reproducir

### Alternativa 2: Docker Compose

- **Pros**: Aislamiento y portabilidad
- **Contras**: Overhead de contenedores, complejidad de networking, dependencias externas

### Alternativa 3: Systemd (Linux)

- **Pros**: Estándar en Linux, gestión robusta de servicios
- **Contras**: No disponible en macOS, requiere migración completa

## Consecuencias

### Positivas

- **Alta disponibilidad**: Servicios se reinician automáticamente
- **Recuperación rápida**: Procedimientos documentados y automatizados
- **Monitoreo proactivo**: Detección temprana de problemas
- **Preservación de datos**: Backups automáticos con verificación
- **Mantenibilidad**: Scripts reutilizables y documentación completa

### Negativas

- **Complejidad inicial**: Múltiples componentes que configurar
- **Dependencias**: Requiere Homebrew, Node.js y servicios externos
- **Recursos**: Servicios en background consumen recursos del sistema
- **Curva de aprendizaje**: Requiere conocimiento de launchd y macOS

### Riesgos

- **Fallo de servicios**: Si launchd falla, todos los servicios se detienen
- **Corrupción de datos**: Backups corruptos podrían causar pérdida de datos
- **Configuración incorrecta**: Variables de entorno mal configuradas
- **Dependencias externas**: Qdrant Cloud, VictoriaMetrics podrían fallar

## Implementación

### Fase 1: Scripts Base (Completado)

- ✅ `setup-local-services.sh`
- ✅ `setup-metrics.sh`
- ✅ `create-launchd-services.sh`

### Fase 2: Health Checks (Completado)

- ✅ `metrics-verify.mjs`
- ✅ `memory-verify.mjs`
- ✅ Sistema de alertas

### Fase 3: Backups (Completado)

- ✅ `backup-memtech.sh`
- ✅ Verificación de integridad
- ✅ Limpieza automática

### Fase 4: Documentación (Completado)

- ✅ Runbooks de recuperación
- ✅ Procedimientos de emergencia
- ✅ Checklists de verificación

### Fase 5: Automatización (Completado)

- ✅ `blindaje-memtech.sh`
- ✅ Script maestro de configuración
- ✅ Manejo de errores y logging

## Monitoreo y Métricas

### Métricas de Salud

- **Uptime de servicios**: Porcentaje de tiempo activo
- **Tiempo de respuesta**: Latencia de health checks
- **Tasa de errores**: Errores por minuto en logs
- **Uso de recursos**: CPU, memoria, disco por servicio

### Alertas Configuradas

- **Críticas**: Servicios no responden, memoria >90%, disco >95%
- **Advertencias**: Latencia alta, errores frecuentes, backups fallidos
- **Informativas**: Servicios reiniciados, backups exitosos

### Dashboards

- **Grafana**: Métricas en tiempo real del sistema
- **Logs centralizados**: Análisis de patrones y errores
- **Reportes automáticos**: Resúmenes diarios y semanales

## Mantenimiento

### Tareas Diarias

- Revisión de logs de alertas
- Verificación de health checks
- Monitoreo de uso de recursos

### Tareas Semanales

- Verificación de backups
- Análisis de métricas de rendimiento
- Actualización de documentación si es necesario

### Tareas Mensuales

- Revisión de configuración de servicios
- Análisis de tendencias de uso
- Optimización de parámetros

## Rollback

En caso de problemas con el sistema de blindaje:

1. **Detener servicios**:

   ```bash
   ./scripts/memtech-services.sh stop
   ```

2. **Desactivar servicios de launchd**:

   ```bash
   launchctl unload ~/Library/LaunchAgents/com.memtech.*.plist
   ```

3. **Restaurar configuración anterior**:

   ```bash
   git checkout HEAD~1 -- scripts/ docs/runbooks/
   ```

4. **Reiniciar servicios manualmente**:
   ```bash
   brew services start redis
   brew services start postgresql@15
   ```

## Referencias

- [MemTech Agent Documentation](../specialized/memtech-agent.md)
- [Runbooks de Recuperación](../runbooks/README.md)
- [macOS launchd Documentation](https://developer.apple.com/library/archive/documentation/MacOSX/Conceptual/BPSystemStartup/Chapters/CreatingLaunchdJobs.html)
- [VictoriaMetrics Documentation](https://docs.victoriametrics.com/)
- [vmagent Documentation](https://docs.victoriametrics.com/vmagent.html)

---

**Fecha**: 2025-10-19  
**Autor**: MemTech Team  
**Revisado por**: Sistema de ADR Mining  
**Próxima revisión**: 2025-11-19
