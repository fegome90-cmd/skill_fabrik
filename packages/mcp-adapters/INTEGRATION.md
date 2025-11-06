# MemTech Integration - Multi-Layer Support

## ✅ Estado de Integración

La integración con MemTech ha sido completada con soporte para múltiples capas de almacenamiento:

- **L0** (Hot Cache): Redis Cache - Almacenamiento ultrarrápido para datos muy frecuentes
- **L1** (Working Memory): Redis Core - Memoria de trabajo para snapshots de planes y datos recientes
- **L2** (Context Memory): PostgreSQL - Memoria de contexto para datos estructurados a medio plazo
- **L3** (Long-term Memory): ChromaDB - Memoria a largo plazo con búsqueda semántica

## 📁 Archivos Copiados desde startkit-main

1. **`scripts/chroma-wrapper.mjs`**: Wrapper Node.js para ChromaDB que utiliza el bridge Python
2. **`scripts/chromadb/python-bridge.py`**: Bridge Python que se comunica con ChromaDB Cloud

## 🔧 Configuración Requerida

### Variables de Entorno

Asegúrate de tener estas variables en tu `.env`:

```bash
# Redis
REDIS_CACHE_URL=redis://localhost:6380
REDIS_CORE_URL=redis://localhost:6381

# PostgreSQL
PG_HOST=localhost
PG_PORT=5433
PG_USER=postgres
PG_PASSWORD=tu_password
PG_DATABASE=surprise_metrics

# ChromaDB
CHROMA_API_KEY=tu_api_key
CHROMA_TENANT=tu_tenant
CHROMA_DATABASE=memtech
CHROMA_COLLECTION=memtech_memory
```

### Dependencias Python

Para que ChromaDB funcione, necesitas instalar las dependencias de Python:

```bash
# Ejecuta el script de instalación
./scripts/install-chromadb.sh

# O manualmente
pip3 install chromadb python-dotenv --user
```

## 🏗️ Arquitectura

### MemoryStore

El `MemoryStore` ahora soporta enrutamiento automático basado en la capa determinada por `determineStorageLayer()`:

```typescript
// El sistema determina automáticamente la capa
const layer = determineStorageLayer(metadata, content);

// Y enruta al almacenamiento apropiado
switch (layer) {
  case 'L0':
  case 'L1':
    return await this.storeInRedis(...);
  case 'L2':
    return await this.storeInPostgres(...);
  case 'L3':
    return await this.storeInChroma(...);
}
```

### Lógica de Determinación de Capa

La función `determineStorageLayer()` considera:

- **Tamaño del contenido** (KB)
- **Frecuencia de acceso** (0-1)
- **Edad del dato** (días)
- **Sensibilidad** (high/normal)
- **Override explícito** de capa en metadata
- **Necesidad de búsqueda semántica**

### Conexiones

Todas las conexiones están centralizadas en `database-clients.ts`:

- `getRedisClient('cache' | 'core')`: Clientes Redis con auto-reconexión
- `getPgPool()`: Pool de conexiones PostgreSQL con manejo de errores
- `getChromaWrapper()`: Wrapper para ChromaDB con fallback graceful

## 📊 Prueba de Conexiones

Usa el script de prueba:

```bash
cd packages/mcp-adapters
pnpm connect
```

Esto prueba todas las conexiones y muestra el estado de cada base de datos.

## 🔄 Integración con Plan Save

Cuando se guarda un plan, se crea automáticamente un snapshot en MemTech L1:

```typescript
const snapshot = await createPlanSnapshotFallback({
  id: plan.id,
  task: plan.task,
  phases: plan.phases,
  // ...
});
```

## 📝 Notas Importantes

1. **ChromaDB requiere Python**: El wrapper utiliza un bridge Python, así que necesitas tener Python 3 y las dependencias instaladas.

2. **Fallback Graceful**: Si ChromaDB no está disponible, el sistema continúa funcionando con L1 y L2. Los errores se registran pero no bloquean el funcionamiento.

3. **Tablas PostgreSQL**: Se crean automáticamente al inicializar `MemoryStore` mediante `ensurePostgresTables()`.

4. **Collection ChromaDB**: Se crea automáticamente si no existe cuando se intenta almacenar el primer item L3.

## 🐛 Troubleshooting

### ChromaDB no se conecta

1. Verifica que las variables de entorno estén configuradas
2. Verifica que Python 3 y chromadb estén instalados: `python3 -c "import chromadb"`
3. Verifica los logs del bridge Python ejecutando manualmente:
   ```bash
   python3 scripts/chromadb/python-bridge.py heartbeat
   ```

### PostgreSQL no conecta

1. Verifica que PostgreSQL esté corriendo en el puerto configurado
2. Verifica las credenciales en `.env`
3. Verifica que la base de datos exista

### Redis no conecta

1. Verifica que Redis esté corriendo en los puertos configurados
2. Verifica las URLs en `.env`
3. Verifica conectividad de red

Para más detalles, consulta `TROUBLESHOOTING.md`.

