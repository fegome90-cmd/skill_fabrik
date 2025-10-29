# Ejemplos de Uso de MemTech MCP en Cursor

## 🎯 Introducción

Este documento proporciona ejemplos prácticos y casos de uso reales para utilizar el servidor MemTech MCP directamente desde el editor Cursor. Los ejemplos están organizados por categoría y complejidad, desde operaciones básicas hasta flujos de trabajo completos.

## 📋 Configuración Previo a los Ejemplos

Asegúrate de tener configurado MemTech MCP en Cursor siguiendo la [Guía de Integración](CURSOR-INTEGRATION-GUIDE.md).

### Verificación Rápida

Antes de comenzar, verifica que todo esté funcionando:

```javascript
{
  "name": "diag.health",
  "arguments": {
    "checks": ["system_info"]
  }
}
```

## 🧠 Gestión de Memoria

### Ejemplo 1: Búsqueda Básica

Busca elementos de memoria por etiquetas:

```javascript
{
  "name": "mem.search",
  "arguments": {
    "tags": ["config", "system"]
  }
}
```

**Respuesta esperada**:

```json
{
  "results": [
    {
      "id": "mem_001",
      "title": "Configuración del Sistema",
      "tags": ["config", "system"],
      "content": "Detalles de la configuración...",
      "created_at": "2025-10-18T18:30:00Z"
    }
  ],
  "count": 1
}
```

### Ejemplo 2: Agregar Elemento a Memoria

Guarda información importante en la memoria:

```javascript
{
  "name": "mem.addItem",
  "arguments": {
    "title": "Configuración de Database",
    "description": "Configuración de conexión a PostgreSQL",
    "content": "Host: localhost\nPort: 5432\nDatabase: memtech\nUser: admin",
    "tags": ["database", "config", "postgresql"]
  }
}
```

### Ejemplo 3: Búsqueda por URI

Accede a un elemento específico por su URI:

```javascript
{
  "name": "mem.resolve",
  "arguments": {
    "uri_or_query": "mem://config/database"
  }
}
```

### Ejemplo 4: Golden Queries

Ejecuta consultas predefinidas:

```javascript
{
  "name": "mem.goldenQuery",
  "arguments": {
    "query": "system_metrics"
  }
}
```

**Golden queries disponibles**:

- `system_metrics` - Métricas del sistema
- `security_audit` - Auditoría de seguridad
- `backup_status` - Estado de backups
- `error_logs` - Logs de errores
- `performance_analysis` - Análisis de rendimiento

### Ejemplo 5: Context Packs

Obtiene el context pack activo:

```javascript
{
  "name": "mem.getContext",
  "arguments": {
    "context": "active"
  }
}
```

## 💾 Gestión de Checkpoints

### Ejemplo 6: Crear Checkpoint Simple

Crea un checkpoint antes de un cambio importante:

```javascript
{
  "name": "mem.checkpoint",
  "arguments": {
    "action": "create",
    "name": "pre-deployment",
    "description": "Checkpoint antes del deployment de producción",
    "tags": ["deployment", "pre", "production"]
  }
}
```

### Ejemplo 7: Listar Checkpoints

Obtiene la lista de checkpoints disponibles:

```javascript
{
  "name": "mem.checkpoint",
  "arguments": {
    "action": "list",
    "filter": "deployment",
    "limit": 10
  }
}
```

### Ejemplo 8: Restaurar Checkpoint

Restaura el estado del sistema a un checkpoint:

```javascript
{
  "name": "mem.checkpoint",
  "arguments": {
    "action": "restore",
    "checkpoint_id": "cp_1729259400000_abc123",
    "force": true
  }
}
```

### Ejemplo 9: Estadísticas de Checkpoints

Obtiene estadísticas sobre los checkpoints:

```javascript
{
  "name": "mem.checkpoint",
  "arguments": {
    "action": "stats"
  }
}
```

## 🔍 Diagnóstico del Sistema

### Ejemplo 10: Health Check Completo

Ejecuta un diagnóstico completo del sistema:

```javascript
{
  "name": "diag.health",
  "arguments": {
    "checks": ["system_info", "memory_usage", "disk_space", "cpu_usage", "network_connectivity"]
  }
}
```

**Respuesta esperada**:

```json
{
  "overall_status": "healthy",
  "status_code": 200,
  "checks": {
    "system_info": {
      "status": "passed",
      "data": {
        "platform": "darwin",
        "arch": "x64",
        "hostname": "macbook-pro",
        "uptime": 86400,
        "totalmem": 17179869184,
        "freemem": 4294967296
      }
    },
    "memory_usage": {
      "status": "passed",
      "data": {
        "total": 17179869184,
        "used": 12884901888,
        "free": 4294967296,
        "used_percent": 75.0
      }
    }
  },
  "alerts": [],
  "recommendations": [
    {
      "priority": "low",
      "message": "All systems operating normally",
      "action": "Continue regular monitoring"
    }
  ]
}
```

### Ejemplo 11: Diagnóstico Específico

Verifica componentes específicos:

```javascript
{
  "name": "diag.health",
  "arguments": {
    "checks": ["memory_usage", "disk_space"]
  }
}
```

### Ejemplo 12: Escaneo de Puertos

Verifica puertos críticos del sistema:

```javascript
{
  "name": "sys.ports.scan",
  "arguments": {
    "host": "localhost",
    "ports": "common",
    "timeout_ms": 3000
  }
}
```

**Puertos comunes verificados**:

- 22 (SSH)
- 80 (HTTP)
- 443 (HTTPS)
- 3000 (Development server)
- 8428 (VictoriaMetrics)
- 3001 (Grafana)

### Ejemplo 13: Escaneo de Puertos Personalizados

Verifica puertos específicos:

```javascript
{
  "name": "sys.ports.scan",
  "arguments": {
    "host": "localhost",
    "ports": [3000, 8428, 3001, 5432],
    "timeout_ms": 5000,
    "max_concurrent": 10
  }
}
```

## 📊 Integraciones

### Ejemplo 14: Consulta a VictoriaMetrics

Ejecuta una consulta PromQL:

```javascript
{
  "name": "vm.query",
  "arguments": {
    "promql": "up",
    "time": 1729259400
  }
}
```

### Ejemplo 15: Consultas Avanzadas

Métricas de rendimiento:

```javascript
{
  "name": "vm.query",
  "arguments": {
    "promql": "rate(http_requests_total[5m])"
  }
}
```

Uso de memoria:

```javascript
{
  "name": "vm.query",
  "arguments": {
    "promql": "process_resident_memory_bytes / 1024 / 1024"
  }
}
```

### Ejemplo 16: Listar Dashboards de Grafana

Obtiene todos los dashboards disponibles:

```javascript
{
  "name": "grafana.listDash",
  "arguments": {
    "query": "memtech"
  }
}
```

### Ejemplo 17: Prueba de Smoke

Verifica un dashboard específico:

```javascript
{
  "name": "grafana.smoke",
  "arguments": {
    "uid_or_title": "memtech-overview"
  }
}
```

## 🔒 Seguridad y Escritura

### Ejemplo 18: Escritura Segura

Escribe un archivo con validación de seguridad:

```javascript
{
  "name": "mem.writeBarrier",
  "arguments": {
    "path": ".memtech/config.yaml",
    "content": "# Configuración actualizada\nserver:\n  port: 3000\n  host: localhost",
    "ifMatch": "sha256-hash-del-contenido-actual"
  }
}
```

### Ejemplo 19: Escritura sin Validación

Para archivos nuevos (sin ifMatch):

```javascript
{
  "name": "mem.writeBarrier",
  "arguments": {
    "path": ".memtech/new-config.yaml",
    "content": "# Nueva configuración\ndebug: true\nlog_level: info"
  }
}
```

## 💾 Gestión de Backups

### Ejemplo 20: Ejecutar Backup

Inicia un backup completo:

```javascript
{
  "name": "mem.backup.run",
  "arguments": {
    "type": "daily",
    "dry_run": false
  }
}
```

### Ejemplo 21: Backup en Modo Prueba

Verifica qué se respaldaría sin ejecutarlo:

```javascript
{
  "name": "mem.backup.run",
  "arguments": {
    "type": "daily",
    "dry_run": true
  }
}
```

### Ejemplo 22: Listar Snapshots

Obtiene la lista de backups disponibles:

```javascript
{
  "name": "mem.backup.list",
  "arguments": {
    "type": "daily",
    "limit": 20
  }
}
```

### Ejemplo 23: Estado del Sistema de Backup

Verifica el estado actual:

```javascript
{
  "name": "mem.backup.status",
  "arguments": {}
}
```

### Ejemplo 24: Verificar Integridad

Verifica la integridad de un backup:

```javascript
{
  "name": "mem.backup.verify",
  "arguments": {
    "snapshot": "daily-backup-20251018",
    "mode": "full"
  }
}
```

## 🔄 Flujos de Trabajo Completos

### Flujo 1: Pre-Deployment

1. **Health Check**:

```javascript
{
  "name": "diag.health",
  "arguments": {
    "checks": ["system_info", "memory_usage", "disk_space"]
  }
}
```

2. **Crear Checkpoint**:

```javascript
{
  "name": "mem.checkpoint",
  "arguments": {
    "action": "create",
    "name": "pre-deployment-$(date +%Y%m%d-%H%M%S)",
    "description": "Checkpoint antes del deployment",
    "tags": ["deployment", "pre"]
  }
}
```

3. **Backup**:

```javascript
{
  "name": "mem.backup.run",
  "arguments": {
    "type": "daily"
  }
}
```

### Flujo 2: Diagnóstico de Problemas

1. **Health Check Completo**:

```javascript
{
  "name": "diag.health",
  "arguments": {
    "checks": ["system_info", "memory_usage", "disk_space", "cpu_usage", "network_connectivity"]
  }
}
```

2. **Buscar Logs de Errores**:

```javascript
{
  "name": "mem.goldenQuery",
  "arguments": {
    "query": "error_logs"
  }
}
```

3. **Verificar Puertos Críticos**:

```javascript
{
  "name": "sys.ports.scan",
  "arguments": {
    "ports": [3000, 8428, 3001]
  }
}
```

4. **Consultar Métricas**:

```javascript
{
  "name": "vm.query",
  "arguments": {
    "promql": "rate(http_requests_total[5m])"
  }
}
```

### Flujo 3: Mantenimiento Programado

1. **Limpiar Checkpoints Antiguos**:

```javascript
{
  "name": "mem.checkpoint",
  "arguments": {
    "action": "cleanup",
    "days": 7
  }
}
```

2. **Verificar Estado de Backups**:

```javascript
{
  "name": "mem.backup.status",
  "arguments": {}
}
```

3. **Optimizar Memoria**:

```javascript
{
  "name": "mem.checkpoint",
  "arguments": {
    "action": "optimize"
  }
}
```

## 🎯 Casos de Uso Específicos

### Caso 1: Configuración de Nuevo Proyecto

```javascript
// 1. Guardar configuración inicial
{
  "name": "mem.addItem",
  "arguments": {
    "title": "Configuración Inicial del Proyecto",
    "description": "Configuración base para el nuevo proyecto",
    "content": "Node.js: 20.0.0\nFramework: Express\nDatabase: PostgreSQL",
    "tags": ["config", "project", "initial"]
  }
}

// 2. Crear checkpoint inicial
{
  "name": "mem.checkpoint",
  "arguments": {
    "action": "create",
    "name": "project-setup",
    "description": "Checkpoint inicial del proyecto",
    "tags": ["project", "setup", "initial"]
  }
}
```

### Caso 2: Monitorización de Producción

```javascript
// 1. Health check de producción
{
  "name": "diag.health",
  "arguments": {
    "checks": ["memory_usage", "cpu_usage", "disk_space"]
  }
}

// 2. Verificar métricas de rendimiento
{
  "name": "vm.query",
  "arguments": {
    "promql": "rate(http_requests_total[5m])"
  }
}

// 3. Verificar dashboards críticos
{
  "name": "grafana.smoke",
  "arguments": {
    "uid_or_title": "production-overview"
  }
}
```

### Caso 3: Recuperación de Desastres

```javascript
// 1. Verificar estado actual
{
  "name": "diag.health",
  "arguments": {
    "checks": ["system_info"]
  }
}

// 2. Listar checkpoints recientes
{
  "name": "mem.checkpoint",
  "arguments": {
    "action": "list",
    "limit": 5
  }
}

// 3. Restaurar último checkpoint estable
{
  "name": "mem.checkpoint",
  "arguments": {
    "action": "restore",
    "checkpoint_id": "cp_1729259400000_abc123",
    "force": true
  }
}
```

## 🔧 Personalización y Configuración

### Ejemplo 25: Configurar Alertas

Guarda configuración de alertas:

```javascript
{
  "name": "mem.addItem",
  "arguments": {
    "title": "Configuración de Alertas",
    "description": "Umbrales de alerta del sistema",
    "content": "Memory threshold: 85%\nCPU threshold: 80%\nDisk threshold: 90%",
    "tags": ["alerts", "config", "thresholds"]
  }
}
```

### Ejemplo 26: Documentar Procedimientos

Guarda procedimientos operativos:

```javascript
{
  "name": "mem.addItem",
  "arguments": {
    "title": "Procedimiento de Deployment",
    "description": "Pasos para deployment en producción",
    "content": "1. Health check\n2. Crear checkpoint\n3. Backup\n4. Deploy\n5. Verificar",
    "tags": ["procedures", "deployment", "production"]
  }
}
```

## 📈 Métricas y Monitoreo

### Ejemplo 27: Monitoreo en Tiempo Real

Configura monitoreo continuo:

```javascript
{
  "name": "mem.addItem",
  "arguments": {
    "title": "Configuración de Monitoreo",
    "description": "Métricas a monitorear en tiempo real",
    "content": "CPU, Memory, Disk, Network, Response Time",
    "tags": ["monitoring", "metrics", "realtime"]
  }
}
```

### Ejemplo 28: Análisis de Tendencias

Analiza tendencias del sistema:

```javascript
{
  "name": "vm.query",
  "arguments": {
    "promql": "rate(cpu_usage_total[1h])"
  }
}
```

## 🚀 Buenas Prácticas

### 1. Naming Consistente

Usa nombres descriptivos y consistentes:

```javascript
{
  "name": "mem.checkpoint",
  "arguments": {
    "action": "create",
    "name": "pre-feature-xyz-deployment",
    "description": "Checkpoint antes de deploy de feature XYZ",
    "tags": ["deployment", "feature-xyz", "pre"]
  }
}
```

### 2. Tags Estructurados

Usa etiquetas bien estructuradas:

```javascript
{
  "name": "mem.addItem",
  "arguments": {
    "title": "Configuración Database",
    "tags": ["config", "database", "postgresql", "production"]
  }
}
```

### 3. Descripciones Claras

Proporciona descripciones útiles:

```javascript
{
  "name": "mem.checkpoint",
  "arguments": {
    "action": "create",
    "name": "critical-fix-rollback",
    "description": "Checkpoint creado antes de aplicar fix crítico para posible rollback",
    "tags": ["critical", "fix", "rollback-point"]
  }
}
```

## 🔍 Troubleshooting de Ejemplos

### Error Común: Herramienta No Encontrada

**Problema**: `Herramienta desconocida: mem.invalid`

**Solución**: Verifica el nombre exacto de la herramienta en la documentación.

### Error Común: Parámetros Inválidos

**Problema**: `Invalid params: missing required parameter`

**Solución**: Asegúrate de incluir todos los parámetros requeridos.

### Error Común: Permiso Denegado

**Problema**: `Write denied: path not in allowlist`

**Solución**: Verifica que la ruta esté en el allowlist de seguridad.

---

**Consejo final**: Comienza con los ejemplos básicos y gradualmente avanza hacia los flujos de trabajo completos. La práctica regular te ayudará a familiarizarte con todas las capacidades de MemTech MCP en Cursor.
