# Integración MemTech Universal con Skills Fabric

## Estado de la Conexión

**Fecha:** 2025-01-27  
**Status:** ⚠️ Servidor no disponible actualmente

## Cliente Creado

Se ha creado un cliente Python en `scripts/memtech-client.py` que permite:

- ✅ Autenticación automática (API key o login)
- ✅ Guardar memorias con tags y metadata
- ✅ Buscar memorias por query o tags
- ✅ Obtener memorias específicas por ID
- ✅ Listar memorias recientes
- ✅ Obtener estadísticas del sistema
- ✅ Health check del servidor

## Uso del Cliente

```bash
# Ejecutar cliente de prueba
python scripts/memtech-client.py

# O usar como módulo
python -c "
from scripts.memtech_client import MemTechClient
client = MemTechClient()
client.authenticate()
client.store('Mi memoria', tags=['test'])
"
```

## Configuración

El cliente usa las siguientes variables de entorno:

```bash
export MEMTECH_API_URL="http://localhost:8080"  # Opcional, default localhost:8080
export MEMTECH_API_KEY="tu_api_key_aqui"        # Se guarda automáticamente después de authenticate()
```

## Endpoints Disponibles

Según la guía QUICKSTART_API_GUIDE.md:

### Autenticación
- `POST /agent/auth/create-key` - Crear API key (método recomendado)
- `POST /api/v1/auth/login` - Login con credenciales (alternativa)

### Memoria
- `POST /api/v1/memory` - Guardar memoria
- `GET /api/v1/memory/search` - Buscar memorias
- `GET /api/v1/memory/{id}` - Obtener memoria específica
- `GET /api/v1/memory/list` - Listar memorias recientes

### Sistema
- `GET /health` - Health check
- `GET /api/v1/system/stats` - Estadísticas completas

## Próximos Pasos

1. **Verificar que el servidor MemTech Universal esté corriendo:**
   ```bash
   curl http://localhost:8080/health
   ```

2. **Si el servidor no está corriendo, iniciarlo:**
   ```bash
   cd /Users/felipe/Developer/memtech-universal
   export PYTHONPATH="/Users/felipe/Developer/memtech-universal/packages/core/src:$PYTHONPATH"
   python -m memtech_universal.server
   ```

3. **Ejecutar el cliente de prueba:**
   ```bash
   python scripts/memtech-client.py
   ```

## Integración con Skills Fabric

El cliente puede integrarse en:

- **Hooks de Cursor**: Guardar contexto de activaciones
- **Router**: Persistir resultados de matching
- **Daemon**: Almacenar eventos y métricas
- **CLI**: Guardar preferencias del usuario

## Ejemplo de Integración

```python
from scripts.memtech_client import MemTechClient

# En un hook o servicio
client = MemTechClient()
if not client.api_key:
    client.authenticate()

# Guardar contexto de activación
client.store(
    content=f"Skill activado: {skill_id} para prompt: {prompt[:100]}",
    tags=["skill-activation", skill_id],
    metadata={
        "skill_id": skill_id,
        "prompt": prompt,
        "score": score,
        "timestamp": datetime.now().isoformat()
    }
)

# Buscar activaciones previas
results = client.search(query=skill_id, tags=["skill-activation"])
```

## Troubleshooting

### Error: "Connection refused"
- Verificar que el servidor esté corriendo en puerto 8080
- Verificar firewall/red

### Error: "401 Unauthorized"
- Verificar que la API key sea válida
- Re-autenticar con `client.authenticate()`

### Error: "Internal Server Error"
- El servidor puede tener problemas internos
- Verificar logs del servidor MemTech Universal
- Intentar reiniciar el servidor

