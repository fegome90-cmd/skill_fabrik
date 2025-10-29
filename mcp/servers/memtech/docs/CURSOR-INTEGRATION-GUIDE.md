# Guía de Integración de MemTech MCP con Cursor

## 🎯 Overview

Esta guía proporciona instrucciones completas para configurar y utilizar el servidor MemTech MCP con el editor Cursor, permitiendo acceder a todas las funcionalidades de gestión de memoria, checkpoints, snapshots y diagnóstico del sistema directamente desde tu entorno de desarrollo.

## 📋 Prerrequisitos

- **Node.js** >= 20.0.0
- **npm** >= 9.0.0
- **Cursor** editor (última versión recomendada)
- **Sistema Operativo**: macOS, Linux o Windows

## 🚀 Instalación Rápida

### Método 1: Instalación Automática (Recomendado)

1. **Clonar o navegar al proyecto**:

   ```bash
   cd /Users/felipe/Developer/startkit-main/packages/memtech-mcp
   ```

2. **Ejecutar el script de configuración**:

   ```bash
   node scripts/cursor-setup.mjs
   ```

3. **Reiniciar Cursor** para cargar la configuración

### Método 2: Instalación Manual

1. **Instalar dependencias**:

   ```bash
   npm install
   ```

2. **Configurar variables de entorno**:

   ```bash
   cp .env.example .env
   # Editar .env con tu configuración
   ```

3. **Configurar Cursor manualmente**:
   - Abre Cursor
   - Ve a `Settings` > `MCP Servers`
   - Importa el archivo `cursor-mcp-config.json`

## ⚙️ Configuración Detallada

### Archivo de Configuración Principal

El archivo `cursor-mcp-config.json` contiene toda la configuración necesaria:

```json
{
  "mcpServers": {
    "memtech-mcp": {
      "command": "node",
      "args": ["./packages/memtech-mcp/scripts/memtech/mcp-server.mjs"],
      "cwd": "/Users/felipe/Developer/startkit-main",
      "env": {
        "NODE_ENV": "production",
        "LOG_LEVEL": "info",
        "MEMTECH_STORAGE_PATH": ".memtech/memory",
        "CHECKPOINT_STORAGE_PATH": ".checkpoints"
      }
    }
  }
}
```

### Variables de Entorno

Configura estas variables en tu archivo `.env`:

```bash
# Configuración básica
NODE_ENV=production
LOG_LEVEL=info

# Memoria
MEMTECH_STORAGE_PATH=.memtech/memory
MEMTECH_MAX_ITEMS=10000
MEMTECH_STRICT_MODE=true

# Checkpoints
CHECKPOINT_STORAGE_PATH=.checkpoints
CHECKPOINT_MAX_COUNT=50
CHECKPOINT_COMPRESSION=true

# Integraciones (opcionales)
VICTORIA_METRICS_URL=http://localhost:8428
GRAFANA_URL=http://localhost:3000
```

### Configuración de Seguridad

El archivo `.memtech/allowlist.json` define las rutas seguras:

```json
{
  "paths": [".memtech/**", ".checkpoints/**", "scripts/**", "docs/**", "reports/**"],
  "max_file_size_mb": 100,
  "strict_mode": true
}
```

## 🔧 Verificación de Instalación

### 1. Verificación de Compatibilidad

Ejecuta el script de verificación:

```bash
node scripts/cursor-compatibility-check.mjs
```

Este script verifica:

- ✅ Estructura del servidor MCP
- ✅ Definiciones de herramientas
- ✅ Schemas de entrada/salida
- ✅ Manejo de errores
- ✅ Configuración de seguridad

### 2. Verificación en Cursor

1. **Abre Cursor**
2. **Busca el ícono de MemTech** 🧠 en la barra de herramientas
3. **Verifica que las herramientas estén disponibles** en el panel lateral

### 3. Prueba de Funcionalidad

Ejecuta un health check desde Cursor:

```javascript
{
  "name": "diag.health",
  "arguments": {
    "checks": ["system_info", "memory_usage", "disk_space"]
  }
}
```

## 🛠️ Herramientas Disponibles

### Gestión de Memoria (`mem.*`)

| Herramienta       | Descripción                     | Uso                                                         |
| ----------------- | ------------------------------- | ----------------------------------------------------------- |
| `mem.resolve`     | Resuelve URI o ejecuta búsqueda | `{"uri_or_query": "mem://config"}`                          |
| `mem.search`      | Busca por etiquetas             | `{"tags": ["config", "system"]}`                            |
| `mem.addItem`     | Agrega elemento a memoria       | `{"title": "Config", "content": "...", "tags": ["config"]}` |
| `mem.getContext`  | Obtiene context pack            | `{"context": "active"}`                                     |
| `mem.goldenQuery` | Ejecuta consulta predefinida    | `{"query": "system_metrics"}`                               |

### Checkpoints (`mem.checkpoint`)

| Herramienta      | Descripción                     | Uso                                          |
| ---------------- | ------------------------------- | -------------------------------------------- |
| `mem.checkpoint` | Operaciones CRUD de checkpoints | `{"action": "create", "name": "pre-deploy"}` |

### Sistema (`sys.*`, `diag.*`)

| Herramienta      | Descripción          | Uso                                         |
| ---------------- | -------------------- | ------------------------------------------- |
| `sys.ports.scan` | Escaneo de puertos   | `{"host": "localhost", "ports": "common"}`  |
| `diag.health`    | Diagnóstico completo | `{"checks": ["memory_usage", "cpu_usage"]}` |

### Integraciones (`vm.*`, `grafana.*`)

| Herramienta        | Descripción       | Uso                                  |
| ------------------ | ----------------- | ------------------------------------ |
| `vm.query`         | Consultas PromQL  | `{"promql": "up"}`                   |
| `grafana.listDash` | Listar dashboards | `{}`                                 |
| `grafana.smoke`    | Pruebas de smoke  | `{"uid_or_title": "dashboard-name"}` |

### Backup (`mem.backup.*`)

| Herramienta         | Descripción        | Uso                                   |
| ------------------- | ------------------ | ------------------------------------- |
| `mem.backup.run`    | Ejecutar backup    | `{"type": "daily", "dry_run": false}` |
| `mem.backup.list`   | Listar snapshots   | `{"type": "daily", "limit": 10}`      |
| `mem.backup.status` | Estado del sistema | `{}`                                  |

## 📱 Uso en Cursor

### Acceso a Herramientas

1. **Desde la barra de herramientas**: Haz clic en el ícono 🧠
2. **Desde el panel lateral**: Busca "MemTech Tools"
3. **Desde el comando**: Usa `Ctrl+Shift+P` y busca "MemTech"

### Atajos de Teclado

| Atajo          | Función                  |
| -------------- | ------------------------ |
| `Ctrl+Shift+M` | Búsqueda en memoria      |
| `Ctrl+Shift+H` | Health check del sistema |
| `Ctrl+Shift+K` | Crear checkpoint         |
| `Ctrl+Shift+L` | Listar checkpoints       |
| `Ctrl+Shift+B` | Ejecutar backup          |

### Ejemplos de Uso

#### 1. Búsqueda en Memoria

```javascript
{
  "name": "mem.search",
  "arguments": {
    "tags": ["config", "system"]
  }
}
```

#### 2. Crear Checkpoint

```javascript
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

#### 3. Diagnóstico del Sistema

```javascript
{
  "name": "diag.health",
  "arguments": {
    "checks": ["system_info", "memory_usage", "disk_space", "cpu_usage"]
  }
}
```

#### 4. Consulta a VictoriaMetrics

```javascript
{
  "name": "vm.query",
  "arguments": {
    "promql": "rate(http_requests_total[5m])"
  }
}
```

#### 5. Listar Dashboards de Grafana

```javascript
{
  "name": "grafana.listDash",
  "arguments": {
    "query": "memtech"
  }
}
```

## 🔍 Troubleshooting

### Problemas Comunes

#### 1. El servidor MCP no inicia

**Síntomas**: Error de conexión en Cursor

**Soluciones**:

```bash
# Verificar configuración
node scripts/cursor-compatibility-check.mjs

# Verificar dependencias
npm install

# Revisar logs
tail -f .memtech/memtech.log
```

#### 2. Herramientas no aparecen en Cursor

**Síntomas**: MemTech no visible en la interfaz

**Soluciones**:

1. Reinicia Cursor completamente
2. Verifica el archivo de configuración:
   ```bash
   cat cursor-mcp-config.json
   ```
3. Reejecuta el script de configuración:
   ```bash
   node scripts/cursor-setup.mjs
   ```

#### 3. Errores de permisos

**Síntomas**: Error "write denied" o "access denied"

**Soluciones**:

1. Verifica el allowlist:
   ```bash
   cat .memtech/allowlist.json
   ```
2. Asegura que las rutas estén en el allowlist
3. Verifica permisos del directorio:
   ```bash
   ls -la .memtech/
   ```

#### 4. Problemas de rendimiento

**Síntomas**: Lentitud en las respuestas

**Soluciones**:

1. Ajusta las variables de entorno:
   ```bash
   export MEMTECH_MAX_ITEMS=5000
   export SYS_MAX_CONCURRENT_SCANS=25
   ```
2. Limpia memoria antigua:
   ```javascript
   {
     "name": "mem.checkpoint",
     "arguments": {
       "action": "cleanup",
       "days": 7
     }
   }
   ```

### Herramientas de Diagnóstico

#### Script de Diagnóstico Completo

```bash
./scripts/diagnose-memtech-cursor.sh
```

#### Verificación Manual

```bash
# 1. Verificar instalación
node scripts/cursor-compatibility-check.mjs

# 2. Probar servidor MCP
node scripts/memtech/mcp-server.mjs

# 3. Verificar configuración
cat .memtech/config.yaml

# 4. Revisar logs
tail -f .memtech/memtech.log
```

## 📊 Monitoreo y Logs

### Configuración de Logs

Los logs se guardan en `.memtech/memtech.log`:

```yaml
logging:
  level: 'info'
  file: '.memtech/memtech.log'
  max_file_size_mb: 10
  max_files: 5
```

### Niveles de Log

- `error`: Errores críticos
- `warn`: Advertencias
- `info`: Información general
- `debug`: Detalles de depuración

### Monitoreo en Tiempo Real

```bash
# Ver logs en tiempo real
tail -f .memtech/memtech.log

# Filtrar por tipo
grep "ERROR" .memtech/memtech.log
grep "WARN" .memtech/memtech.log
```

## 🔧 Configuración Avanzada

### Personalización de Herramientas

Puedes personalizar el comportamiento de las herramientas modificando el archivo `cursor-mcp-config.json`:

```json
{
  "autoApprove": ["mem.resolve", "mem.search", "diag.health"],
  "requireApproval": ["mem.writeBarrier", "mem.backup.prune"]
}
```

### Integraciones Externas

#### VictoriaMetrics

```bash
# Configurar VictoriaMetrics
export VICTORIA_METRICS_URL=http://localhost:8428
export VICTORIA_METRICS_TOKEN=your-token
```

#### Grafana

```bash
# Configurar Grafana
export GRAFANA_URL=http://localhost:3000
export GRAFANA_API_KEY=your-api-key
export GRAFANA_USERNAME=admin
```

### Seguridad Adicional

```yaml
security:
  strict_mode: true
  max_file_size_mb: 100
  validate_inputs: true
  audit_enabled: true
  encryption_enabled: false # Activar si es necesario
```

## 🚀 Buenas Prácticas

### 1. Checkpoints Regulares

Crea checkpoints antes de cambios importantes:

```javascript
{
  "name": "mem.checkpoint",
  "arguments": {
    "action": "create",
    "name": "pre-major-change",
    "description": "Antes de cambio importante",
    "tags": ["major", "pre"]
  }
}
```

### 2. Backup Automático

Configura backups automáticos:

```javascript
{
  "name": "mem.backup.run",
  "arguments": {
    "type": "daily"
  }
}
```

### 3. Monitoreo Continuo

Usa health checks regularmente:

```javascript
{
  "name": "diag.health",
  "arguments": {
    "checks": ["memory_usage", "disk_space"]
  }
}
```

### 4. Limpieza de Memoria

Mantén la memoria optimizada:

```javascript
{
  "name": "mem.checkpoint",
  "arguments": {
    "action": "cleanup",
    "days": 30
  }
}
```

## 📚 Referencias Adicionales

- [Documentación Principal](../README.md)
- [Guía Operativa](../OPERATIONAL-GUIDE.md)
- [Guía de Troubleshooting](../TROUBLESHOOTING.md)
- [Cheatsheets](../CHEATSHEETS.md)
- [Configuración YAML](../memtech-mcp.yaml)

## 🆘 Soporte

### Información para Reportar Problemas

Cuando reportes un problema, incluye:

1. **Versión de Cursor**: Help > About
2. **Versión de Node.js**: `node --version`
3. **Resultado del diagnóstico**: `node scripts/cursor-compatibility-check.mjs`
4. **Logs relevantes**: `.memtech/memtech.log`
5. **Configuración**: `cursor-mcp-config.json`

### Comandos Útiles

```bash
# Generar paquete de soporte
tar -czf memtech-support.tar.gz \
  .memtech/ \
  cursor-mcp-config.json \
  .env \
  scripts/cursor-compatibility-check.mjs
```

---

**Última actualización**: 18 de octubre de 2025  
**Versión**: 1.0.0  
**Compatibilidad**: Cursor >= 0.28.0, Node.js >= 20.0.0
