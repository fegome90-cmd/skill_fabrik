# Shared Package

Utilidades compartidas para servicios de Skills Fabric, incluyendo Service Discovery.

## Service Discovery

Servidor HTTP para registro y descubrimiento de servicios con health checks automáticos.

### Iniciar servidor

```bash
# Desde el directorio del proyecto
node packages/shared/dist/cli/start-discovery-server.js

# O via PM2
pm2 start scripts/pm2/ecosystem.config.cjs --only service-discovery --env development
```

### Endpoints

- `GET /health` - Health check del servidor
- `POST /services/register` - Registrar servicio
- `GET /services` - Listar servicios registrados
- `GET /services/:name` - Obtener servicio específico
- `DELETE /services/:name` - Eliminar registro de servicio
- `GET /services/:name/instances` - Obtener instancias de un servicio

### Configuración

Variables de entorno:

| Variable                  | Default     | Descripción                                         |
| ------------------------- | ----------- | --------------------------------------------------- |
| DISCOVERY_PORT            | 8877        | Puerto del servidor                                 |
| DISCOVERY_HOST            | 127.0.0.1   | Host del servidor                                   |
| DISCOVERY_CORS            | true        | Habilitar CORS (omitir o 'false' para deshabilitar) |
| DISCOVERY_LOGGING         | true        | Habilitar logging de Fastify                        |
| DISCOVERY_CACHE           | true        | Habilitar cache de servicios                        |
| DISCOVERY_CACHE_TTL       | 30          | TTL del cache en segundos                           |
| DISCOVERY_LB              | true        | Habilitar load balancing                            |
| DISCOVERY_LB_STRATEGY     | round-robin | Estrategia: round-robin, random, health-based       |
| DISCOVERY_HEALTH          | true        | Habilitar health checks automáticos                 |
| DISCOVERY_HEALTH_INTERVAL | 10000       | Intervalo de health check (ms)                      |
| DISCOVERY_HEALTH_TIMEOUT  | 5000        | Timeout de health check (ms)                        |
| DISCOVERY_HEALTH_RETRIES  | 3           | Reintentos antes de marcar unhealthy                |

### CORS

CORS está habilitado por defecto con `@fastify/cors ^8.4.0` (compatible con Fastify 4.x).

Para deshabilitar CORS:

```bash
DISCOVERY_CORS=false node packages/shared/dist/cli/start-discovery-server.js
```

### Dependencias

- Fastify 4.x
- @fastify/cors ^8.4.0

**Nota**: Si actualizas a Fastify 5.x, cambiar `@fastify/cors` a `^11.x`.
