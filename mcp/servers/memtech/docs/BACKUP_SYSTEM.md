Excelente.
Aquí tienes el bloque “Truth Audit as Service” totalmente listo para integrarse en el MCP memtech-mcp, con YAML de servicio, métricas, alerta PromQL y panel para Grafana.

⸻

🧩 1. Definición de Servicio (YAML)

Agrega esto al final de memtech-mcp.yaml o dentro de tu services: section principal:

services:
truth*audit:
entrypoint: ./scripts/memtech/audit.mjs
schedule: "0 */6 _ \* \*" # cada 6 horas
description: "Ejecuta auditorías forenses automáticas y genera métricas memtech_audit_\*"
environment:
AUDIT_OUTPUT_DIR: "reports/forensics/"
ALERT_THRESHOLD_SCORE: 90
metrics_export: true
log_level: "info"

🔒 Este servicio se ejecutará localmente cada 6 h, exportando resultados a Grafana vía VictoriaMetrics.
Si el score baja de 90/100, se disparará una alerta automática.

⸻

📊 2. Métricas Exportadas (vmagent / Prometheus format)

Incluye en tu vmagent-rules.yaml o reglas de scrape:

groups:

- name: "memtech-audit"
  rules:
  - record: memtech_audit_score
    expr: gauge_over_time(memtech_audit_score[6h])
  - record: memtech_audit_runs_total
    expr: increase(memtech_audit_runs_total[6h])
  - alert: MemTechAuditScoreLow
    expr: memtech_audit_score < 90
    for: 15m
    labels:
    severity: critical
    service: memtech
    annotations:
    summary: "Score de auditoría MemTech bajo"
    description: "El score de auditoría cayó bajo 90 en la última corrida automática. Revisión requerida."

⸻

🧠 3. Script audit.mjs (pseudo-código)

Ya lo tienes creado, pero añade estas líneas al final para publicar métricas:

import fs from 'fs'
import fetch from 'node-fetch'

const metricsEndpoint = process.env.METRICS_PUSH || 'http://localhost:8428/api/v1/import/prometheus'
const result = JSON.parse(fs.readFileSync('./reports/forensics/latest.json', 'utf8'))

const score = result.total_score || 0
const payload = `

# TYPE memtech_audit_score gauge

memtech_audit_score ${score}

# TYPE memtech_audit_runs_total counter

memtech_audit_runs_total 1
`

await fetch(metricsEndpoint, { method: 'POST', body: payload })
console.log(`[OK] Audit score ${score} enviado a ${metricsEndpoint}`)

⸻

📈 4. Dashboard Grafana “Truth Audit Monitor”

Panel con 3 visualizaciones clave:

Tipo Query Descripción
Gauge memtech_audit_score Score promedio actual
Time Series avg_over_time(memtech_audit_score[24h]) Evolución del score diario
Alert Table ALERTS{alertname="MemTechAuditScoreLow"} Alertas activas de auditoría

Puedes importar este panel como config/grafana-truth-audit.json.

⸻

🔔 5. Alerta (PromQL)

Para la alerta crítica visible en Grafana:

alert: MemTechAuditScoreCritical
expr: memtech_audit_score < 80
for: 10m
labels:
severity: critical
annotations:
summary: "Score crítico de auditoría MemTech"
description: "El sistema ha caído bajo 80 puntos de score. Investigar degradación o corrupción de memoria."

⸻

⚙️ 6. Flujo Operativo 1. Cada 6 h → se ejecuta audit.mjs 2. Exporta métricas → VictoriaMetrics 3. Grafana refresca panel “Truth Audit Monitor” 4. Si score < 90 → alerta amarilla; si <80 → alerta roja 5. Alerta visible y también registrada en reports/forensics/

⸻

¿Quieres que te genere ahora el dashboard JSON (grafana-truth-audit.json) con los tres paneles y alertas ya configuradas para importarlo directamente en Grafana (3001)?Excelente.
Aquí tienes el bloque “Truth Audit as Service” totalmente listo para integrarse en el MCP memtech-mcp, con YAML de servicio, métricas, alerta PromQL y panel para Grafana.

⸻

🧩 1. Definición de Servicio (YAML)

Agrega esto al final de memtech-mcp.yaml o dentro de tu services: section principal:

services:
truth*audit:
entrypoint: ./scripts/memtech/audit.mjs
schedule: "0 */6 _ \* \*" # cada 6 horas
description: "Ejecuta auditorías forenses automáticas y genera métricas memtech_audit_\*"
environment:
AUDIT_OUTPUT_DIR: "reports/forensics/"
ALERT_THRESHOLD_SCORE: 90
metrics_export: true
log_level: "info"

🔒 Este servicio se ejecutará localmente cada 6 h, exportando resultados a Grafana vía VictoriaMetrics.
Si el score baja de 90/100, se disparará una alerta automática.

⸻

📊 2. Métricas Exportadas (vmagent / Prometheus format)

Incluye en tu vmagent-rules.yaml o reglas de scrape:

groups:

- name: "memtech-audit"
  rules:
  - record: memtech_audit_score
    expr: gauge_over_time(memtech_audit_score[6h])
  - record: memtech_audit_runs_total
    expr: increase(memtech_audit_runs_total[6h])
  - alert: MemTechAuditScoreLow
    expr: memtech_audit_score < 90
    for: 15m
    labels:
    severity: critical
    service: memtech
    annotations:
    summary: "Score de auditoría MemTech bajo"
    description: "El score de auditoría cayó bajo 90 en la última corrida automática. Revisión requerida."

⸻

🧠 3. Script audit.mjs (pseudo-código)

Ya lo tienes creado, pero añade estas líneas al final para publicar métricas:

import fs from 'fs'
import fetch from 'node-fetch'

const metricsEndpoint = process.env.METRICS_PUSH || 'http://localhost:8428/api/v1/import/prometheus'
const result = JSON.parse(fs.readFileSync('./reports/forensics/latest.json', 'utf8'))

const score = result.total_score || 0
const payload = `

# TYPE memtech_audit_score gauge

memtech_audit_score ${score}

# TYPE memtech_audit_runs_total counter

memtech_audit_runs_total 1
`

await fetch(metricsEndpoint, { method: 'POST', body: payload })
console.log(`[OK] Audit score ${score} enviado a ${metricsEndpoint}`)

⸻

📈 4. Dashboard Grafana “Truth Audit Monitor”

Panel con 3 visualizaciones clave:

Tipo Query Descripción
Gauge memtech_audit_score Score promedio actual
Time Series avg_over_time(memtech_audit_score[24h]) Evolución del score diario
Alert Table ALERTS{alertname="MemTechAuditScoreLow"} Alertas activas de auditoría

Puedes importar este panel como config/grafana-truth-audit.json.

⸻

🔔 5. Alerta (PromQL)

Para la alerta crítica visible en Grafana:

alert: MemTechAuditScoreCritical
expr: memtech_audit_score < 80
for: 10m
labels:
severity: critical
annotations:
summary: "Score crítico de auditoría MemTech"
description: "El sistema ha caído bajo 80 puntos de score. Investigar degradación o corrupción de memoria."

⸻

⚙️ 6. Flujo Operativo 1. Cada 6 h → se ejecuta audit.mjs 2. Exporta métricas → VictoriaMetrics 3. Grafana refresca panel “Truth Audit Monitor” 4. Si score < 90 → alerta amarilla; si <80 → alerta roja 5. Alerta visible y también registrada en reports/forensics/

⸻

¿Quieres que te genere ahora el dashboard JSON (grafana-truth-audit.json) con los tres paneles y alertas ya configuradas para importarlo directamente en Grafana (3001)?Excelente.
Aquí tienes el bloque “Truth Audit as Service” totalmente listo para integrarse en el MCP memtech-mcp, con YAML de servicio, métricas, alerta PromQL y panel para Grafana.

⸻

🧩 1. Definición de Servicio (YAML)

Agrega esto al final de memtech-mcp.yaml o dentro de tu services: section principal:

services:
truth*audit:
entrypoint: ./scripts/memtech/audit.mjs
schedule: "0 */6 _ \* \*" # cada 6 horas
description: "Ejecuta auditorías forenses automáticas y genera métricas memtech_audit_\*"
environment:
AUDIT_OUTPUT_DIR: "reports/forensics/"
ALERT_THRESHOLD_SCORE: 90
metrics_export: true
log_level: "info"

🔒 Este servicio se ejecutará localmente cada 6 h, exportando resultados a Grafana vía VictoriaMetrics.
Si el score baja de 90/100, se disparará una alerta automática.

⸻

📊 2. Métricas Exportadas (vmagent / Prometheus format)

Incluye en tu vmagent-rules.yaml o reglas de scrape:

groups:

- name: "memtech-audit"
  rules:
  - record: memtech_audit_score
    expr: gauge_over_time(memtech_audit_score[6h])
  - record: memtech_audit_runs_total
    expr: increase(memtech_audit_runs_total[6h])
  - alert: MemTechAuditScoreLow
    expr: memtech_audit_score < 90
    for: 15m
    labels:
    severity: critical
    service: memtech
    annotations:
    summary: "Score de auditoría MemTech bajo"
    description: "El score de auditoría cayó bajo 90 en la última corrida automática. Revisión requerida."

⸻

🧠 3. Script audit.mjs (pseudo-código)

Ya lo tienes creado, pero añade estas líneas al final para publicar métricas:

import fs from 'fs'
import fetch from 'node-fetch'

const metricsEndpoint = process.env.METRICS_PUSH || 'http://localhost:8428/api/v1/import/prometheus'
const result = JSON.parse(fs.readFileSync('./reports/forensics/latest.json', 'utf8'))

const score = result.total_score || 0
const payload = `

# TYPE memtech_audit_score gauge

memtech_audit_score ${score}

# TYPE memtech_audit_runs_total counter

memtech_audit_runs_total 1
`

await fetch(metricsEndpoint, { method: 'POST', body: payload })
console.log(`[OK] Audit score ${score} enviado a ${metricsEndpoint}`)

⸻

📈 4. Dashboard Grafana “Truth Audit Monitor”

Panel con 3 visualizaciones clave:

Tipo Query Descripción
Gauge memtech_audit_score Score promedio actual
Time Series avg_over_time(memtech_audit_score[24h]) Evolución del score diario
Alert Table ALERTS{alertname="MemTechAuditScoreLow"} Alertas activas de auditoría

Puedes importar este panel como config/grafana-truth-audit.json.

⸻

🔔 5. Alerta (PromQL)

Para la alerta crítica visible en Grafana:

alert: MemTechAuditScoreCritical
expr: memtech_audit_score < 80
for: 10m
labels:
severity: critical
annotations:
summary: "Score crítico de auditoría MemTech"
description: "El sistema ha caído bajo 80 puntos de score. Investigar degradación o corrupción de memoria."

⸻

⚙️ 6. Flujo Operativo 1. Cada 6 h → se ejecuta audit.mjs 2. Exporta métricas → VictoriaMetrics 3. Grafana refresca panel “Truth Audit Monitor” 4. Si score < 90 → alerta amarilla; si <80 → alerta roja 5. Alerta visible y también registrada en reports/forensics/

⸻

¿Quieres que te genere ahora el dashboard JSON (grafana-truth-audit.json) con los tres paneles y alertas ya configuradas para importarlo directamente en Grafana (3001)?# MemTech Backup System

## Overview

El sistema de backup de MemTech es una solución completa y automatizada para la protección de datos del proyecto. Implementa una política de retención GFS (Grandfather-Father-Son), deduplicación de contenido, verificación de integridad y sincronización con almacenamiento en la nube.

## Características Principales

- **Snapshots automáticos** con política GFS (horarios, diarios, semanales, mensuales)
- **Deduplicación por contenido** usando SHA256 para optimizar espacio
- **Verificación de integridad** con manifests SHA256
- **Sincronización en la nube** con Google Drive (rclone)
- **Métricas Prometheus** para monitoreo y alertas
- **Integración MCP** para control desde MemTech
- **Automatización completa** con launchd (macOS) y cron (Linux)

## Arquitectura del Sistema

```
/Users/felipe/Developer/startkit-main/          # Proyecto principal
├── packages/memtech-mcp/
│   ├── config/backup/                         # Configuración
│   │   ├── memsys-backup.conf               # Configuración principal
│   │   ├── backup-metrics.yaml              # Métricas Prometheus
│   │   ├── com.memtech.backup.plist         # Configuración launchd
│   │   └── memtech-backup.cron              # Configuración cron
│   ├── scripts/backup/                      # Scripts de backup
│   │   ├── backup-run.sh                    # Ejecución de backup
│   │   ├── backup-prune.sh                  # Poda de snapshots
│   │   ├── backup-verify.sh                 # Verificación
│   │   ├── backup-dedup.sh                  # Deduplicación
│   │   ├── backup-sync.sh                   # Sincronización
│   │   ├── backup-metrics.sh                # Generación de métricas
│   │   └── backup-setup-automation.sh      # Instalación automatización
│   └── scripts/memtech/
│       └── backup.js                        # Módulo MCP

/Users/felipe/Developer/backups/               # Directorio de backup
├── snapshots/                               # Snapshots de backup
├── dedup/                                   # Almacenamiento deduplicado
├── logs/                                    # Logs del sistema
├── metrics/                                 # Métricas Prometheus
├── temp/                                    # Archivos temporales
└── reports/                                 # Reportes y análisis
```

## Configuración

### Configuración Principal

El archivo `config/backup/memsys-backup.conf` contiene toda la configuración del sistema:

```bash
# Directorios
BACKUP_ROOT="/Users/felipe/Developer/backups"
PROJECT_ROOT="/Users/felipe/Developer/startkit-main"

# Política de retención GFS
HOURLY_RETENTION=24      # 24 horas
DAILY_RETENTION=7        # 7 días
WEEKLY_RETENTION=4       # 4 semanas
MONTHLY_RETENTION=12     # 12 meses

# Límites de almacenamiento
MAX_BACKUP_SIZE_GB=100
MAX_SNAPSHOT_SIZE_GB=10
SPACE_ALERT_THRESHOLD_GB=80

# Deduplicación
DEDUP_ENABLED=true
DEDUP_HASH_ALGO="sha256"

# Integridad
INTEGRITY_CHECK_ENABLED=true
GENERATE_MANIFEST=true
AUTO_VERIFY=true

# Sincronización
SYNC_ENABLED=false
# RCLONE_REMOTE="gdrive:backups/memtech"

# Métricas
METRICS_ENABLED=true
METRICS_PORT=9091
```

### Variables de Entorno

Las siguientes variables de entorno pueden configurarse:

- `PROJECT_ROOT`: Directorio raíz del proyecto
- `BACKUP_ROOT`: Directorio raíz de backups
- `BACKUP_TIMEOUT_MS`: Timeout para operaciones de backup
- `VICTORIA_METRICS_URL`: URL del servidor de métricas
- `GRAFANA_URL`: URL del servidor Grafana

## Scripts de Backup

### backup-run.sh

Script principal para ejecutar backups:

```bash
# Ejecutar backup normal
./backup-run.sh

# Ejecutar en modo simulación
./backup-run.sh --dry-run
```

**Funcionalidades:**

- Determina automáticamente el tipo de snapshot según hora/fecha
- Sincronización con rsync
- Deduplicación de contenido
- Generación de manifest SHA256
- Verificación automática post-backup
- Métricas Prometheus

### backup-prune.sh

Script para poda de snapshots según política GFS:

```bash
# Simular poda
./backup-prune.sh --dry-run

# Ejecutar poda forzada
./backup-prune.sh --force
```

**Funcionalidades:**

- Aplica política GFS (horarios, diarios, semanales, mensuales)
- Rotación por tamaño total
- Generación de reportes de poda
- Actualización de métricas

### backup-verify.sh

Script para verificación de integridad:

```bash
# Verificar todos los snapshots
./backup-verify.sh

# Verificar snapshot específico
./backup-verify.sh hourly_20231018_120000

# Verificación rápida
./backup-verify.sh --mode quick
```

**Funcionalidades:**

- Verificación de estructura de snapshot
- Validación de manifest SHA256
- Verificación de enlaces de deduplicación
- Reportes detallados de integridad

### backup-dedup.sh

Script para deduplicación de contenido:

```bash
# Analizar potencial de deduplicación
./backup-dedup.sh --action analyze

# Ejecutar deduplicación completa
./backup-dedup.sh --action deduplicate

# Optimizar base de datos
./backup-dedup.sh --action optimize
```

**Funcionalidades:**

- Análisis de potencial de deduplicación
- Deduplicación por contenido SHA256
- Optimización de base de datos de hashes
- Verificación de integridad de deduplicación

### backup-sync.sh

Script para sincronización con almacenamiento en la nube:

```bash
# Sincronización completa
./backup-sync.sh --action sync

# Subir snapshot específico
./backup-sync.sh --action upload --snapshot hourly_20231018_120000

# Verificar integridad remota
./backup-sync.sh --action verify
```

**Funcionalidades:**

- Sincronización bidireccional
- Comparación de snapshots locales y remotos
- Verificación de integridad remota
- Soporte para Google Drive (rclone)

## Comandos MCP

El sistema de backup está integrado en el servidor MCP de MemTech con los siguientes comandos:

### mem.backup.run

Ejecuta un backup del proyecto:

```json
{
  "name": "mem.backup.run",
  "arguments": {
    "type": "hourly", // opcional
    "dry_run": false // opcional
  }
}
```

### mem.backup.prune

Elimina snapshots antiguos según política GFS:

```json
{
  "name": "mem.backup.prune",
  "arguments": {
    "dry_run": false, // opcional
    "force": false // opcional
  }
}
```

### mem.backup.verify

Verifica la integridad de snapshots:

```json
{
  "name": "mem.backup.verify",
  "arguments": {
    "snapshot": "hourly_20231018_120000", // opcional
    "mode": "full" // opcional
  }
}
```

### mem.backup.dedup

Ejecuta deduplicación de contenido:

```json
{
  "name": "mem.backup.dedup",
  "arguments": {
    "action": "deduplicate", // analyze, deduplicate, optimize, verify
    "snapshot": "hourly_20231018_120000", // opcional
    "mode": "full" // opcional
  }
}
```

### mem.backup.sync

Sincroniza snapshots con almacenamiento en la nube:

```json
{
  "name": "mem.backup.sync",
  "arguments": {
    "action": "sync", // sync, upload, download, verify
    "direction": "both", // up, down, both
    "snapshot": "hourly_20231018_120000" // opcional
  }
}
```

### mem.backup.list

Lista todos los snapshots disponibles:

```json
{
  "name": "mem.backup.list",
  "arguments": {
    "type": "hourly", // opcional
    "limit": 10 // opcional
  }
}
```

### mem.backup.status

Obtiene el estado actual del sistema de backup:

```json
{
  "name": "mem.backup.status",
  "arguments": {}
}
```

## Automatización

### macOS (launchd)

Para configurar la automatización en macOS:

```bash
# Instalar servicio launchd
./backup-setup-automation.sh install

# Verificar estado
./backup-setup-automation.sh status

# Desinstalar
./backup-setup-automation.sh uninstall
```

El servicio `com.memtech.backup.plist` se configura para:

- Backups horarios (cada hora)
- Backups diarios (medianoche)
- Backups semanales (domingo medianoche)
- Backups mensuales (día 1 medianoche)

### Linux (cron)

Para configurar la automatización en Linux:

```bash
# Instalar tareas cron
./backup-setup-automation.sh install

# Verificar tareas
crontab -l | grep memtech-backup

# Desinstalar
./backup-setup-automation.sh uninstall
```

El archivo `memtech-backup.cron` configura:

- Backups horarios, diarios, semanales, mensuales
- Poda automática (2 AM diario)
- Verificación de integridad
- Deduplicación semanal
- Sincronización diaria
- Actualización de métricas

## Métricas y Monitoreo

### Métricas Prometheus

El sistema genera métricas en el archivo `$BACKUP_ROOT/metrics/backup.prom`:

```prometheus
# Métricas de snapshots
backup_snapshots_total 25
backup_snapshots_total_size_bytes 5368709120
backup_oldest_snapshot_age_seconds 604800

# Métricas de estado
backup_system_status 1
backup_last_status 1
backup_time_since_last_success_seconds 3600

# Métricas de deduplicación
backup_deduplication_rate_percent 35.5
backup_dedup_space_saved_bytes 1073741824

# Métricas de espacio
backup_space_usage_ratio 0.65
backup_available_space_bytes 4294967296
```

### Alertas

Las alertas se configuran en `config/backup/backup-metrics.yaml`:

- **BackupFailed**: Sistema de backup en error por más de 5 minutos
- **BackupNotExecuted**: No hay backup exitoso en 24 horas
- **BackupSpaceLow**: Espacio disponible bajo 80%
- **BackupIntegrityFailed**: Verificación de integridad fallida
- **BackupSyncPending**: Snapshots pendientes de sincronización

### Dashboards de Grafana

Los dashboards están configurados para monitorear:

- Estado general del sistema
- Actividad reciente de backups
- Uso de espacio y tendencias
- Tasa de deduplicación
- Estado de sincronización

## Políticas de Retención

### GFS (Grandfather-Father-Son)

- **Horarios**: 24 snapshots (últimas 24 horas)
- **Diarios**: 7 snapshots (últimos 7 días)
- **Semanales**: 4 snapshots (últimas 4 semanas)
- **Mensuales**: 12 snapshots (últimos 12 meses)

### Rotación por Tamaño

- Tamaño máximo total: 100 GB
- Tamaño máximo por snapshot: 10 GB
- Umbral de alerta: 80 GB

## Seguridad

### Permisos

- Scripts ejecutables solo por owner
- Directorios de backup con permisos restrictivos
- Logs rotados y comprimidos automáticamente

### Validación

- Verificación de hashes SHA256
- Validación de estructura de snapshots
- Comprobación de integridad de enlaces

### Encriptación

La encriptación está configurada pero deshabilitada por defecto:

- Algoritmo: AES256
- Configurable en `memsys-backup.conf`

## Solución de Problemas

### Logs Importantes

- `backup.log`: Logs principales del sistema
- `prune.log`: Logs de operaciones de poda
- `verify.log`: Logs de verificación de integridad
- `dedup.log`: Logs de deduplicación
- `sync.log`: Logs de sincronización

### Comandos de Diagnóstico

```bash
# Ver estado del sistema
./backup-setup-automation.sh status

# Verificar configuración
./backup-setup-automation.sh verify

# Listar snapshots
./backup-list.sh

# Ver métricas
cat $BACKUP_ROOT/metrics/backup.prom
```

### Problemas Comunes

1. **Espacio insuficiente**
   - Verificar espacio disponible con `df -h`
   - Ejecutar poda manual: `./backup-prune.sh --force`

2. **Backup fallido**
   - Revisar logs: `tail -f $BACKUP_ROOT/logs/backup.log`
   - Verificar locks: `ls -la $BACKUP_ROOT/temp/`

3. **Deduplicación lenta**
   - Reducir número de hilos en configuración
   - Ejecutar análisis primero: `./backup-dedup.sh --action analyze`

4. **Sincronización fallida**
   - Verificar configuración de rclone
   - Comprobar conexión con servicio en la nube

## Mantenimiento

### Tareas Semanales

- Revisar logs de errores
- Verificar espacio disponible
- Comprobar estado de sincronización
- Analizar métricas y tendencias

### Tareas Mensuales

- Verificar integridad de snapshots críticos
- Actualizar configuración si es necesario
- Revisar y ajustar políticas de retención
- Limpiar logs antiguos

### Actualizaciones

Para actualizar el sistema de backup:

```bash
# Detener automatización
./backup-setup-automation.sh uninstall

# Actualizar scripts
git pull origin main

# Reinstalar automatización
./backup-setup-automation.sh install

# Verificar configuración
./backup-setup-automation.sh verify
```

## Ejemplos de Uso

### Backup Manual

```bash
# Ejecutar backup inmediato
./backup-run.sh

# Verificar resultado
tail -n 20 $BACKUP_ROOT/logs/backup.log
```

### Recuperación

```bash
# Listar snapshots disponibles
./backup-list.sh

# Verificar snapshot específico
./backup-verify.sh daily_20231018_000000

# Restaurar (manual)
cp -r $BACKUP_ROOT/snapshots/daily_20231018_000000 /path/to/restore
```

### Análisis de Deduplicación

```bash
# Analizar potencial
./backup-dedup.sh --action analyze

# Ver reporte
cat $BACKUP_ROOT/temp/dedup_analysis_*.json
```

### Monitoreo

```bash
# Generar métricas
./backup-metrics.sh

# Ver métricas
curl http://localhost:9091/metrics | grep backup
```

## Referencias

- [Documentación de rsync](https://rsync.samba.org/)
- [Documentación de rclone](https://rclone.org/)
- [Documentación de Prometheus](https://prometheus.io/)
- [Documentación de launchd](https://developer.apple.com/library/archive/documentation/MacOSX/Conceptual/BPSystemStartup/Chapters/CreatingLaunchdJobs.html)
- [Documentación de cron](https://man7.org/linux/man-pages/man5/crontab.5.html)

## Soporte

Para soporte y preguntas sobre el sistema de backup de MemTech:

1. Revisar logs en `$BACKUP_ROOT/logs/`
2. Ejecutar diagnóstico con `./backup-setup-automation.sh verify`
3. Consultar documentación de comandos MCP
4. Contactar al equipo de MemTech

---

**Versión**: 1.0.0  
**Última actualización**: 2025-10-18  
**Autor**: MemTech Team
