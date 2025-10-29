# MemTech en Snickers

**Versión**: 1.0.0  
**Fecha**: 2025-10-28  
**Sistema**: Memoria Jerárquica L0-L3

---

## 📋 Descripción

MemTech es un sistema de memoria jerárquica de 4 niveles (L0-L3) que proporciona persistencia inteligente y gestión de contexto para el proyecto Snickers.

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────┐
│         L0: Hot Cache (Redis 6379)      │
│         50MB, TTL 1h, <1ms latency      │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│    L1: Working Memory (Redis 6381)      │
│      500MB, TTL 24h, <5ms latency       │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│   L2: Context Memory (PostgreSQL 5433)  │
│       5GB, TTL 30d, <50ms latency       │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  L3: Long-term (ChromaDB Cloud/Local)   │
│    Ilimitada, Permanente, <100ms        │
└─────────────────────────────────────────┘
```

---

## 🚀 Instalación

### Requisitos del Sistema

- **Redis**: Instalado y corriendo en puertos 6379 y 6381
- **PostgreSQL**: Instalado y corriendo en puerto 5433
- **ChromaDB**: Cloud URL + API key (o instalación local)
- **Python**: 3.8+
- **Node.js**: 18+

### Paso 1: Instalar Dependencias Python

```bash
cd /Users/felipe/Developer/snickers

# Crear entorno virtual
python3 -m venv venv-memtech

# Activar entorno
source venv-memtech/bin/activate

# Instalar dependencias
pip install -r requirements-memtech.txt
```

### Paso 2: Instalar Dependencias Node (MCP Hub)

```bash
cd mcp/servers/memtech
npm install
```

### Paso 3: Configurar Variables de Entorno

```bash
# Copiar template
cp config/env.memtech.example .env.memtech

# Editar con credenciales reales
nano .env.memtech
```

**Variables críticas**:

- `REDIS_CACHE_URL`: Redis L0 (puerto 6379)
- `REDIS_CORE_URL`: Redis L1 (puerto 6381)
- `POSTGRES_URL`: PostgreSQL L2 (puerto 5433)
- `CHROMA_URL` y `CHROMA_API_KEY`: ChromaDB L3

### Paso 4: Inicializar Sistema

```bash
# Ejecutar script de setup
./scripts/setup/setup_memtech.sh
```

Este script:

1. Verifica que Redis, PostgreSQL y Chroma estén activos
2. Inicializa el sistema de memoria
3. Ejecuta health checks

---

## 💻 Uso

### Health Check

```bash
# Verificar estado de todos los servicios
node scripts/health/verify-local-memory.mjs
```

**Salida esperada**:

```
✅ Redis Cache (L0): PONG
✅ Redis Core (L1): PONG
✅ PostgreSQL (L2): Connected
✅ ChromaDB (L3): Healthy
```

### Heartbeats (Mantener Memoria Activa)

```bash
# Ejecutar guardian con heartbeats
node scripts/maintenance/memtech-system-guardian.mjs

# Test mode (solo verificar)
node scripts/maintenance/memtech-system-guardian.mjs --test
```

### Usar en Código

```javascript
// Importar sistema de memoria
const memory = require('./memtech/memory');

// Conectar a bases de datos
await memory.connect();

// Leer de L1 (working memory)
const data = await memory.read('L1', 'mi-clave');

// Escribir en L2 (context memory)
await memory.write('L2', 'contexto-snickers', {
  patient: 'Snickers',
  date: '2025-10-28',
  data: {...}
});

// Verificar integridad
const status = await memory.verify();
console.log(status);  // { L0: true, L1: true, L2: true, L3: true }
```

---

## 📁 Estructura

```
memtech/
├── agent/                      # Core MemTech Agent
│   ├── index.js                # Punto de entrada
│   ├── core-memory-connector.js
│   ├── memory-adapter.js
│   ├── config/                 # Configuraciones
│   ├── health/                 # Health checks
│   └── monitoring/             # Monitoreo
├── memory/                     # Sistema de memoria
│   ├── index.js                # Exportaciones
│   ├── long.js                 # L3 (long-term)
│   ├── short.js                # L1 (working)
│   └── connect-to-databases.mjs
└── docs/                       # Documentación
    ├── README.md               # Este archivo
    └── memtech-agent.md        # Especificación completa
```

---

## 🔧 Configuración

### memtech.yaml

Archivo principal de configuración en `config/memtech.yaml`.

**Parámetros clave**:

- `memory.L0.capacity_mb`: Tamaño máximo L0 (default: 50MB)
- `memory.L1.capacity_mb`: Tamaño máximo L1 (default: 500MB)
- `memory.L2.capacity_gb`: Tamaño máximo L2 (default: 5GB)
- `health.interval_seconds`: Intervalo health checks (default: 300s)
- `heartbeats.interval_seconds`: Intervalo heartbeats (default: 10s)

### Variables de Entorno

Ver `config/env.memtech.example` para lista completa.

---

## 🔍 Troubleshooting

### "Redis connection refused"

**Causa**: Redis no está corriendo o puerto incorrecto.

**Solución**:

```bash
# Verificar si Redis está corriendo
redis-cli -p 6379 ping
redis-cli -p 6381 ping

# Si no responde, iniciar Redis
brew services start redis
```

### "PostgreSQL authentication failed"

**Causa**: Credenciales incorrectas en `.env.memtech`.

**Solución**:

```bash
# Verificar conexión manual
psql -h localhost -p 5433 -U postgres -c "SELECT 1;"

# Si falla, revisar credenciales en .env.memtech
```

### "ChromaDB 401 Unauthorized"

**Causa**: API key inválido o expirado.

**Solución**:

```bash
# Verificar URL y API key
curl -H "Authorization: Bearer $CHROMA_API_KEY" $CHROMA_URL/api/v1/heartbeat

# Si falla, actualizar CHROMA_API_KEY en .env.memtech
```

### Health Check Fails

**Diagnóstico**:

```bash
# Ejecutar health check con debug
LOG_LEVEL=DEBUG node scripts/health/verify-local-memory.mjs
```

---

## 📊 Métricas y Monitoreo

### Métricas Clave

| Métrica            | Target | Crítico |
| ------------------ | ------ | ------- |
| Redis L0 hit ratio | ≥95%   | <80%    |
| Redis L1 hit ratio | ≥85%   | <70%    |
| PostgreSQL latency | <50ms  | >200ms  |
| ChromaDB recall@10 | ≥90%   | <80%    |

### Dashboards

Si tienes Grafana instalado, importa el dashboard:

```bash
# Dashboard JSON (si existe)
# cat local/grafana/dashboards/memtech-memory-consumption-v3.json
```

---

## 📚 Documentación Adicional

- **Especificación completa**: `docs/memtech-agent.md`
- **MCP Hub**: `../mcp/docs/README-MCP-HUB.md`
- **Metodología CLOOP**: `../cloop/CLOOP-METHODOLOGY-GUIDE.md`

---

## 🔗 Integración con Snickers

MemTech está integrado con el pipeline clínico de Snickers para:

1. **Persistir resultados de análisis**: Almacenar outputs de `snickers_consolidate.py`
2. **Cachear parámetros frecuentes**: Rangos de referencia, configuraciones
3. **Contexto histórico**: Evolución temporal de parámetros de Snickers
4. **Embeddings de reportes**: Búsqueda semántica en reportes clínicos

Ver: `../tools/snickers_consolidate.py` para ejemplos de integración.

---

**Última actualización**: 2025-10-28  
**Mantenedor**: MemTech Team  
**Soporte**: Ver `memtech-agent.md` para detalles técnicos
