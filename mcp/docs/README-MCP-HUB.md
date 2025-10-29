# MemTech MCP

Memory Technology Model Context Protocol Server - Un servidor MCP especializado en gestión de memoria, checkpoints, snapshots, consultas VM, integración con Grafana y diagnóstico del sistema.

## 🚀 Inicio Rápido

### Instalación

```bash
cd packages/memtech-mcp
npm install
```

### Configuración Básica

```bash
# Copiar archivo de entorno
cp .env.example .env

# Editar variables críticas
nano .env
```

### Ejecución

```bash
# Iniciar servidor
npm start

# Modo desarrollo
npm dev
```

## 📋 Comandos Esenciales

### Pruebas Rápidas (10-min)

```bash
# Verificación crítica del sistema
npm run test:quick

# Pruebas básicas de funcionalidad
npm run test:basic

# Pruebas exhaustivas de humo
npm run test:smoke
```

### Diagnóstico del Sistema

```bash
# Health check completo
node scripts/memtech/system.mjs health

# Escaneo de puertos
node scripts/memtech/system.mjs ports

# Métricas del sistema
node scripts/memtech/system.mjs metrics
```

### Gestión de Checkpoints

```bash
# Crear checkpoint
node scripts/memtech/checkpoints.mjs create "nombre-checkpoint"

# Listar checkpoints
node scripts/memtech/checkpoints.mjs list

# Restaurar último checkpoint
node scripts/memtech/checkpoints.mjs restore last
```

## 🔧 Funciones Principales

### Memoria (mem.\*)

- `mem.resolve(uri|query)` - Resuelve URI o ejecuta búsqueda
- `mem.search(tags)` - Busca por etiquetas
- `mem.addItem(meta)` - Agrega elemento a memoria
- `mem.getContext(context)` - Obtiene context pack
- `mem.goldenQuery(query)` - Ejecuta consulta predefinida

### Seguridad (mem.writeBarrier)

- `mem.writeBarrier(path, content, ifMatch)` - Escritura segura con OCC
- Validación de allowlist
- Control de tamaño de archivos
- Auditoría completa

### Checkpoints (mem.checkpoint)

- `mem.checkpoint(action, args)` - Operaciones CRUD
- Creación de snapshots
- Restauración de estado
- Compresión automática

### Sistema (sys.\*)

- `sys.ports.scan()` - Escaneo de puertos
- `sys.health()` - Diagnóstico completo
- Métricas en tiempo real
- Alertas configurables

### Integraciones

- `vm.query(promql)` - Consultas a VictoriaMetrics
- `grafana.listDash()` - Listado de dashboards
- `grafana.smoke(uid|title)` - Pruebas de smoke

## 🛡️ Seguridad

### WriteBarrier con OCC

```javascript
{
  "name": "mem.writeBarrier",
  "arguments": {
    "path": ".memtech/config.yaml",
    "content": "# Nueva configuración\n...",
    "ifMatch": "sha256-hash-del-contenido-actual"
  }
}
```

### Allowlist por Defecto

```json
{
  "paths": [".memtech/**", ".checkpoints/**", "scripts/**", "reports/**", "temp/**"]
}
```

## 📊 Pruebas y Troubleshooting

### Checklist de Verificación Rápida (10-min)

```bash
# 1. Validación de seguridad
npm run test:quick

# 2. Funcionalidad básica
npm run test:basic

# 3. Salud del sistema
node scripts/memtech/system.mjs health

# 4. Escaneo de puertos críticos
node scripts/memtech/system.mjs ports --ports="3000,8428,3001"

# 5. Estado de memoria
node scripts/memtech/memory.mjs status
```

### Diagnóstico de Problemas

```bash
# Health check completo
node scripts/memtech/system.mjs health --deep

# Verificación de logs
tail -f .memtech/memtech.log

# Auditoría de cambios
node scripts/memtech/shortcuts.mjs audit changes

# Pruebas exhaustivas
npm run test:smoke
```

## 🎯 Shortcuts Operativos

### Atajos del Sistema

```bash
# Health check completo
Ctrl+Shift+H → sys.health

# Escaneo de puertos
Ctrl+Shift+P → sys.ports.scan

# Métricas del sistema
Ctrl+Shift+M → sys.metrics
```

### Atajos de Memoria

```bash
# Contexto activo
Ctrl+Shift+C → mem.getContext(active)

# Búsqueda rápida
Ctrl+Shift+S → mem.search

# Agregar elemento
Ctrl+Shift+A → mem.addItem
```

### Atajos de Checkpoints

```bash
# Crear checkpoint
Ctrl+Shift+K → checkpoint.create

# Listar checkpoints
Ctrl+Shift+L → checkpoint.list

# Restaurar último
Ctrl+Shift+R → checkpoint.restore last
```

## 🔍 Context Packs y Golden Queries

### Context Packs

- `mem://context/active` - Contexto activo del sistema
- `mem://context/recent` - Cambios recientes
- `mem://context/critical` - Alertas críticas

### Golden Queries Predefinidas

- `system_metrics` - Métricas del sistema
- `security_audit` - Auditoría de seguridad
- `backup_status` - Estado de backups
- `error_logs` - Logs de errores
- `performance_analysis` - Análisis de rendimiento

## 📁 Estructura del Proyecto

```
packages/memtech-mcp/
├── .memtech/                    # Configuración y políticas
│   ├── policies/              # Políticas de validación
│   ├── config.yaml           # Configuración principal
│   ├── catalog.json          # Catálogo de memoria
│   └── router.cache.json     # Cache de router
├── .checkpoints/               # Almacenamiento de checkpoints
│   ├── snapshots/            # Snapshots del sistema
│   ├── diffs/                # Diferencias
│   └── metadata/             # Metadatos
├── scripts/                    # Scripts del servidor
│   └── memtech/              # Scripts principales
├── reports/                    # Reportes generados
└── docs/                      # Documentación
```

## 🔧 Configuración

### Variables de Entorno Críticas

```bash
# Logging
LOG_LEVEL=info

# Memoria
MEMTECH_STORAGE_PATH=.memtech/memory
MEMTECH_MAX_ITEMS=10000

# Seguridad
MEMTECH_MAX_FILE_SIZE_MB=100
MEMTECH_STRICT_MODE=true

# Checkpoints
CHECKPOINT_STORAGE_PATH=.checkpoints
CHECKPOINT_MAX_COUNT=50
CHECKPOINT_COMPRESSION=true

# Integraciones
VICTORIA_METRICS_URL=http://localhost:8428
GRAFANA_URL=http://localhost:3000
GRAFANA_API_KEY=env://GRAFANA_TOKEN
```

### Configuración YAML Principal

```yaml
# .memtech/config.yaml
server:
  name: 'memtech-mcp'
  bind_address: '127.0.0.1'
  bind_port: 3000

checkpoints:
  enabled: true
  max_checkpoints: 50
  compression: true

memory:
  analysis_enabled: true
  alert_threshold_mb: 400

logging:
  level: 'info'
  file: '.memtech/memtech.log'
```

## 🚨 Alertas y Monitoreo

### Tipos de Alertas

- `critical` - Requiere acción inmediata
- `warning` - Monitoreo necesario
- `info` - Informativa

### Verificación de Alertas

```bash
# Ver alertas activas
node scripts/memtech/shortcuts.mjs alerts check

# Auditoría completa
node scripts/memtech/shortcuts.mjs audit changes

# Reporte técnico
node scripts/memtech/shortcuts.mjs report generate
```

## 🧪 Ejemplos de Uso

### Gestión de Memoria

```javascript
// Agregar elemento
{
  "name": "mem.addItem",
  "arguments": {
    "title": "Configuración del sistema",
    "description": "Configuración inicial",
    "content": "Detalles...",
    "tags": ["config", "system"]
  }
}

// Resolver URI
{
  "name": "mem.resolve",
  "arguments": {
    "uri_or_query": "mem://configuracion-sistema"
  }
}
```

### Checkpoints

```javascript
// Crear checkpoint
{
  "name": "mem.checkpoint",
  "arguments": {
    "action": "create",
    "name": "pre-deployment",
    "description": "Checkpoint antes del deployment",
    "tags": ["deployment", "pre"]
  }
}
```

### Diagnóstico

```javascript
// Health check completo
{
  "name": "diag.health",
  "arguments": {
    "checks": ["memory_usage", "disk_space", "cpu_usage"]
  }
}
```

## 📈 Métricas y Rendimiento

### Límites del Sistema

- Máximo 10,000 elementos de memoria
- Máximo 50 checkpoints
- Tamaño máximo de archivo: 100MB
- Timeout de escaneo: 3 segundos
- Máximo 50 escaneos concurrentes

### Optimizaciones

- Índices de memoria para búsquedas rápidas
- Compresión de snapshots
- Escaneo de puertos concurrente
- Caching de consultas VM

## 🔄 Mantenimiento

### Limpieza Automática

```bash
# Limpiar checkpoints antiguos
node scripts/memtech/checkpoints.mjs cleanup

# Optimizar memoria
node scripts/memtech/memory.mjs optimize

# Rotar logs
node scripts/memtech/system.mjs rotate-logs
```

### Backup y Recuperación

```bash
# Crear backup completo
node scripts/memtech/shortcuts.mjs backup create

# Restaurar desde backup
node scripts/memtech/shortcuts.mjs backup restore

# Verificar integridad
node scripts/memtech/shortcuts.mjs backup verify
```

## 🛠️ Desarrollo

### Tests

```bash
# Pruebas básicas
npm run test:basic

# Pruebas rápidas
npm run test:quick

# Pruebas exhaustivas
npm run test:smoke
```

### Linting

```bash
npm run lint
npm run lint:fix
```

## 📚 Documentación Completa

### 📖 Índice de Documentación

- [DOCUMENTATION-INDEX.md](DOCUMENTATION-INDEX.md) - Índice completo y navegación

### 🚀 Guías Principales

- [README.md](README.md) - Esta guía de inicio rápido y referencia general
- [memtech-mcp.yaml](memtech-mcp.yaml) - Especificación técnica del servidor MCP

### 🧪 Guías de Prueba y Validación

- [TESTING-GUIDE.md](TESTING-GUIDE.md) - Guía completa de comandos de prueba y validación
- [CHEATSHEETS.md](CHEATSHEETS.md) - Referencia rápida de comandos y atajos

### 🔧 Guías Operativas

- [OPERATIONAL-GUIDE.md](OPERATIONAL-GUIDE.md) - Shortcuts operativos y flujos de trabajo
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Diagnóstico de problemas y soluciones

### 📋 Flujos de Trabajo Recomendados

#### Para Usuarios Nuevos

1. Leer este README.md - Inicio rápido
2. Revisar [CHEATSHEETS.md](CHEATSHEETS.md) - Comandos esenciales
3. Ejecutar verificación rápida (10-min) desde [TESTING-GUIDE.md](TESTING-GUIDE.md)

#### Para Operadores Diarios

1. Usar shortcuts de [OPERATIONAL-GUIDE.md](OPERATIONAL-GUIDE.md)
2. Consultar [CHEATSHEETS.md](CHEATSHEETS.md) para comandos rápidos
3. Ejecutar mantenimiento diario desde [OPERATIONAL-GUIDE.md](OPERATIONAL-GUIDE.md)

#### Para Resolución de Problemas

1. Consultar [TROUBLESHOOTING.md](TROUBLESHOOTING.md) primero
2. Usar comandos de diagnóstico de [TESTING-GUIDE.md](TESTING-GUIDE.md)
3. Generar paquete de soporte desde [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

#### Para Desarrolladores

1. Revisar [memtech-mcp.yaml](memtech-mcp.yaml) para especificaciones
2. Consultar este README.md para arquitectura
3. Usar [TESTING-GUIDE.md](TESTING-GUIDE.md) para validación

## 🆘 Soporte

### Información para Diagnóstico

```bash
# Generar reporte completo
node scripts/memtech/system.mjs health --deep > health-report.json

# Recopilar logs
tar -czf memtech-logs.tar.gz .memtech/memtech.log .memtech/audit.log

# Verificar configuración
node scripts/memtech/system.mjs config --validate
```

### Qué Incluir en Reportes de Problemas

1. Salida completa de `diag.health`
2. ETags relevantes de las operaciones fallidas
3. Logs del sistema (`.memtech/memtech.log`)
4. Configuración actual (`.memtech/config.yaml`)
5. Versión del sistema y entorno

## 📄 Licencia

MIT License - Ver archivo LICENSE para detalles.
