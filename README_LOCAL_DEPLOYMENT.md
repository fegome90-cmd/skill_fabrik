# README - MCP Local Deployment

## 🚀 Skills Fabric MCP - Despliegue Local

Esta guía te ayuda a configurar y ejecutar un servidor MCP (Model Context Protocol) local completo para Skills Fabric, integrado con Claude Code y Claude Desktop.

---

## 📋 Índice

- [Prerrequisitos](#prerrequisitos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Uso](#uso)
- [Servicios](#servicios)
- [Integración con Claude](#integración-con-claude)
- [Scripts de Gestión](#scripts-de-gestión)
- [Troubleshooting](#troubleshooting)
- [Desarrollo](#desarrollo)
- [FAQ](#faq)

---

## 📌 Prerrequisitos

### Software Requerido

1. **Node.js >= 18**
   ```bash
   # Verificar versión
   node --version
   ```

2. **pnpm o npm**
   ```bash
   # pnpm (recomendado)
   npm install -g pnpm
   
   # o usar npm
   npm --version
   ```

3. **Docker & Docker Compose**
   ```bash
   # Verificar Docker
   docker --version
   
   # Verificar Docker Compose
   docker-compose --version
   # o
   docker compose version
   ```

4. **PM2** (opcional, para servicios Skills Fabric)
   ```bash
   npm install -g pm2
   ```

### Verificación Rápida

```bash
# Ejecutar test de dependencias
./mcp-local/mcp-local-test.sh
```

---

## 🔧 Instalación

### 1. Clonar y Configurar Proyecto

```bash
# Clonar repository (si no lo has hecho)
git clone <repository-url>
cd skills-fabrik

# Instalar dependencias
pnpm install
```

### 2. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```bash
cp .env.example .env
```

Edita `.env` con tu configuración:

```bash
# === Redis Cache (L0) ===
REDIS_CACHE_URL=redis://localhost:6380

# === Redis Core (L1) ===
REDIS_CORE_URL=redis://localhost:6381
MEMTECH_REDIS_CORE_HOST=localhost
MEMTECH_REDIS_CORE_PORT=6381
MEMTECH_REDIS_CORE_PASSWORD=

# === PostgreSQL (L2) ===
PG_HOST=127.0.0.1
PG_PORT=5433
PG_USER=postgres
PG_PASSWORD=tu_password_seguro
PG_DATABASE=surprise_metrics

# === ChromaDB (L3) - Opcional ===
CHROMA_API_KEY=tu_api_key
CHROMA_TENANT=tu_tenant
CHROMA_DATABASE=memtech
CHROMA_COLLECTION=memtech_memory
```

### 3. Construir MCP Adapters

```bash
cd packages/mcp-adapters
pnpm build
cd ../../
```

---

## ⚡ Uso Rápido

### Iniciar Stack Completo

```bash
# Opción 1: Usar script de inicio
./mcp-local/mcp-local-start.sh

# Opción 2: Manual
cd mcp-local
docker-compose up -d
```

### Verificar Estado

```bash
./mcp-local/mcp-local-status.sh
```

### Probar Conexiones

```bash
./mcp-local/mcp-local-test.sh
```

### Detener Stack

```bash
./mcp-local/mcp-local-stop.sh
```

---

## 🏗️ Servicios

### Arquitectura Multi-Capa (MemTech)

#### L0 - Redis Cache (Puerto 6380)
- **Propósito**: Almacenamiento ultrarrápido para datos críticos
- **Uso**: Cache de operaciones frecuentes
- **Verificar**: `redis-cli -p 6380 ping`

#### L1 - Redis Core (Puerto 6381)
- **Propósito**: Memoria de trabajo para snapshots de planes
- **Uso**: Plan snapshots, datos recientes
- **Verificar**: `redis-cli -p 6381 ping`

#### L2 - PostgreSQL (Puerto 5433)
- **Propósito**: Memoria de contexto estructurada
- **Uso**: Datos persistentes, contexto de largo plazo
- **Credenciales**: postgres / (tu_password de .env)
- **Verificar**: `psql -h localhost -p 5433 -U postgres -d surprise_metrics`

#### L3 - ChromaDB (Puerto 8000) - Opcional
- **Propósito**: Memoria a largo plazo con búsqueda semántica
- **Uso**: Búsqueda semántica, datos históricos
- **Estado**: Deshabilitado por defecto (requiere ChromaDB Cloud)
- **Habilitar**: `docker-compose --profile chroma up -d`

### Servicios Adicionales

#### Router (Puerto 3000)
- **Propósito**: Enrutamiento de activación de skills
- **Estado**: Integrado via PM2 si está configurado

#### Daemon (Puerto 7727)
- **Propósito**: Servicios en segundo plano
- **Estado**: Integrado via PM2 si está configurado

#### Service Discovery (Puerto 8877)
- **Propósito**: Descubrimiento de servicios
- **Estado**: Integrado via PM2 si está configurado

---

## 🤖 Integración con Claude

### Claude Code (VSCode/Editor)

#### Configuración via STDIO

1. **Configurar en Claude Code:**
   - Ve a Settings > Extensions > Claude Code
   - Busca "MCP Servers"
   - Agrega nueva configuración:

   ```json
   {
     "command": "node",
     "args": ["/ruta/a/skills-fabrik/mcp-server/index.mjs"],
     "env": {
       "MCP_TRANSPORT": "stdio",
       "NODE_OPTIONS": "--loader ts-node/esm"
     }
   }
   ```

2. **O usar variables de entorno:**
   ```bash
   export MCP_TRANSPORT=stdio
   node mcp-server/index.mjs
   ```

3. **Verificar conexión:**
   - Reinicia Claude Code
   - Ejecuta: `health_check` en el chat
   - Deberías ver el estado de todos los servicios

#### Herramientas Disponibles

Una vez conectado, puedes usar estas herramientas:

**Filesystem:**
- `fs_read_file` - Leer archivos
- `fs_write_file` - Escribir archivos
- `fs_list_directory` - Listar directorios
- `fs_file_exists` - Verificar existencia
- `fs_create_directory` - Crear directorios
- `fs_delete_file` - Eliminar archivos

**Git:**
- `git_status` - Estado del repositorio
- `git_diff` - Ver diferencias
- `git_commit` - Crear commit
- `git_log` - Historial de commits

**PM2:**
- `pm2_list` - Listar procesos
- `pm2_start` - Iniciar proceso
- `pm2_stop` - Detener proceso
- `pm2_restart` - Reiniciar proceso
- `pm2_logs` - Ver logs

**Metrics:**
- `metrics_emit_event` - Emitir evento KPI
- `metrics_get_events` - Obtener eventos
- `metrics_get_summary` - Resumen de métricas

**Health:**
- `health_check` - Verificar conexiones
- `test_connections` - Probar todas las DB
- `validate_config` - Validar configuración

### Claude Desktop

#### Configuración via WebSocket

1. **Configurar en Claude Desktop:**
   ```json
   {
     "mcpServers": {
       "skills-fabric": {
         "command": "node",
         "args": ["/ruta/a/skills-fabrik/mcp-server/index.mjs"],
         "env": {
           "MCP_TRANSPORT": "websocket",
           "MCP_WEBSOCKET_PORT": "3001"
         }
       }
     }
   }
   ```

2. **Ubicación del archivo:**
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **Linux**: `~/.config/claude/claude_desktop_config.json`

3. **Iniciar servidor:**
   ```bash
   export MCP_TRANSPORT=websocket
   node mcp-server/index.mjs
   ```

---

## 🛠️ Scripts de Gestión

### mcp-local-start.sh

Inicia todo el stack MCP local.

```bash
./mcp-local/mcp-local-start.sh
```

**Qué hace:**
- Verifica Docker y Node.js
- Carga variables de entorno
- Construye MCP Adapters
- Inicia servicios Docker (Redis, PostgreSQL)
- Inicia servicios Skills Fabric (si están configurados)
- Muestra resumen de puertos y servicios

**Opciones:**
- Sin parámetros: Inicia servicios básicos
- `--with-chroma`: Incluye ChromaDB
- `--no-skills-fabric`: Solo servicios MCP

### mcp-local-stop.sh

Detiene todo el stack.

```bash
./mcp-local/mcp-local-stop.sh
```

**Opciones:**
- `--cleanup` / `-c`: También limpia imágenes Docker no utilizadas

### mcp-local-status.sh

Muestra el estado actual de todos los servicios.

```bash
./mcp-local/mcp-local-status.sh
```

**Información mostrada:**
- Estado de contenedores Docker
- Conectividad de servicios
- Estado de servicios Skills Fabric
- Archivos de configuración
- Puertos en uso
- Puntuación de salud del stack

### mcp-local-test.sh

Ejecuta suite completa de tests.

```bash
./mcp-local/mcp-local-test.sh
```

**Tests incluidos:**
- Verificación de dependencias
- Archivos y configuración
- Conectividad de servicios
- Funcionalidad de adapters
- Variables de entorno
- Operaciones de filesystem

---

## 🐛 Troubleshooting

### Problemas Comunes

#### 1. Docker no está ejecutándose

**Síntoma:**
```
❌ Docker no está instalado
```

**Solución:**
- Inicia Docker Desktop
- Verifica: `docker ps`

#### 2. Puerto ya en uso

**Síntoma:**
```
Error: listen EADDRINUSE: address already in use :::6380
```

**Solución:**
```bash
# Verificar qué usa el puerto
lsof -i :6380

# Detener proceso
kill -9 <PID>

# O cambiar puerto en docker-compose.yml
```

#### 3. MCP Adapters no compilados

**Síntoma:**
```
❌ MCP Adapters compilados
```

**Solución:**
```bash
cd packages/mcp-adapters
pnpm build
cd ../../
```

#### 4. Error de conexión Redis

**Síntoma:**
```
Redis Core (L1:6381): No accesible
```

**Solución:**
```bash
# Verificar contenedor
docker ps | grep redis

# Reiniciar Redis
cd mcp-local
docker-compose restart redis-core

# Ver logs
docker-compose logs redis-core
```

#### 5. Error de conexión PostgreSQL

**Síntoma:**
```
PostgreSQL (L2:5433): No accesible
```

**Solución:**
```bash
# Verificar contenedor
docker ps | grep postgres

# Reiniciar PostgreSQL
docker-compose restart postgres

# Verificar credenciales
psql -h localhost -p 5433 -U postgres -d surprise_metrics
```

#### 6. Servidor MCP no responde

**Síntoma:**
```
Timeout al ejecutar herramienta
```

**Solución:**
```bash
# Verificar que el servidor está ejecutándose
node mcp-server/index.mjs --version

# Verificar logs
./mcp-local/mcp-local-status.sh

# Reiniciar stack
./mcp-local/mcp-local-stop.sh
./mcp-local/mcp-local-start.sh
```

### Verificar Logs

```bash
# Ver logs de todos los servicios
cd mcp-local
docker-compose logs

# Ver logs de un servicio específico
docker-compose logs -f postgres
docker-compose logs -f redis-core

# Ver logs de PM2
pm2 logs
pm2 logs --lines 100
```

### Reset Completo

```bash
# Detener todo
./mcp-local/mcp-local-stop.sh --cleanup

# Limpiar volúmenes (CUIDADO: borra todos los datos)
docker-compose down -v

# Reiniciar desde cero
./mcp-local/mcp-local-start.sh
```

---

## 👨‍💻 Desarrollo

### Estructura del Proyecto

```
skills-fabrik/
├── mcp-server/
│   ├── index.mjs              # Servidor MCP principal
│   └── package.json
├── mcp-local/
│   ├── docker-compose.yml     # Configuración de servicios
│   ├── init.sql               # Inicialización de DB
│   ├── mcp-local-start.sh     # Script de inicio
│   ├── mcp-local-stop.sh      # Script de parada
│   ├── mcp-local-status.sh    # Script de estado
│   └── mcp-local-test.sh      # Script de testing
├── packages/mcp-adapters/     # Adapters existentes
└── .env                       # Variables de entorno
```

### Agregar Nuevas Herramientas

Para agregar una nueva herramienta MCP:

1. **Editar `mcp-server/index.mjs`:**
   ```javascript
   {
     name: 'mi_herramienta',
     description: 'Descripción de mi herramienta',
     inputSchema: {
       type: 'object',
       properties: {
         param1: { type: 'string', description: 'Primer parámetro' }
       },
       required: ['param1']
     }
   }
   ```

2. **Agregar caso en `handleToolCall`:**
   ```javascript
   case 'mi_herramienta':
     return await miAdapter.operacion(args.param1);
   ```

3. **Testear:**
   ```bash
   ./mcp-local/mcp-local-test.sh
   ```

### Customizar Servicios

Para agregar o modificar servicios en `docker-compose.yml`:

```yaml
services:
  mi_servicio:
    image: mi/imagen:latest
    ports:
      - "1234:1234"
    environment:
      - VARIABLE=valor
    volumes:
      - mi_data:/data
    restart: unless-stopped
```

Luego actualiza las variables de entorno y scripts correspondientes.

---

## ❓ FAQ

### P: ¿Puedo usar esto sin Docker?

**R:** Parcialmente. Puedes instalar Redis y PostgreSQL directamente en tu sistema y ajustar las URLs en `.env`. Sin embargo, Docker simplifica mucho el proceso.

### P: ¿Es ChromaDB requerido?

**R:** No. ChromaDB (L3) es opcional. El sistema funciona perfectamente con L0 (Redis Cache), L1 (Redis Core) y L2 (PostgreSQL).

### P: ¿Cómo cambio los puertos?

**R:** Edita `mcp-local/docker-compose.yml` y actualiza las URLs correspondientes en `.env`.

### P: ¿Puedo usar esto en producción?

**R:** Este setup está diseñado para desarrollo local. Para producción, necesitas configurar autenticación, SSL, balanceadores de carga, y monitoreo.

### P: ¿Dónde se almacenan los datos?

**R:**
- Redis: Volúmenes Docker (`redis-cache-data`, `redis-core-data`)
- PostgreSQL: Volumen Docker (`postgres-data`)
- Los datos persisten entre reinicios.

### P: ¿Cómo integro con mi proyecto existente?

**R:** Los MCP Adapters ya están integrados en Skills Fabric. Este setup local te permite desarrollar y testear sin depender de servicios externos.

### P: ¿Puedo usar múltiples instancias?

**R:** Sí, pero necesitarás diferentes puertos para cada instancia. Cambia los puertos en `docker-compose.yml`.

### P: ¿Hay límites de memoria?

**R:** Los contenedores tienen límites configurados:
- Redis Cache: 256MB
- Redis Core: 512MB
- Puedes ajustarlos en `docker-compose.yml`.

---

## 📚 Referencias

- [MCP Specification](https://modelcontextprotocol.io/)
- [Skills Fabric Documentation](./docs/)
- [MCP Adapters README](../packages/mcp-adapters/README.md)
- [ADR Documentation](../docs/adr/)

---

## 🆘 Soporte

Si encuentras problemas:

1. Ejecuta `./mcp-local/mcp-local-test.sh` y comparte el output
2. Revisa los logs: `cd mcp-local && docker-compose logs`
3. Verifica la configuración en `.env`
4. Consulta la sección de [Troubleshooting](#troubleshooting)

---

## 📄 Licencia

MIT License - ver archivo LICENSE para detalles.
