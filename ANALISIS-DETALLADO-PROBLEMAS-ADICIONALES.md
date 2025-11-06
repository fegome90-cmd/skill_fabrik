# Análisis Detallado - Problemas Adicionales
## Skills Fabrik - Problemas de Prioridad Media y Baja

**Fecha:** 2025-11-05  
**Complemento al:** INFORME-ANALISIS-ROUTER-DAEMON-FILEWATCHER.md

---

## Problemas de Prioridad Media

### 🟡 MEDIO-R1: Falta de Retry Exponential Backoff

**Ubicación:** `packages/router/src/pre-invoke.ts:118-211`

**Problema:**
```typescript
for (let attempt = 0; attempt <= maxRetries; attempt++) {
  try {
    const res = await fetch(`${daemonUrl}/activate`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal
    });
    
    if (res.ok) {
      // ... success
      return;
    } else {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
  } catch (error) {
    if (attempt < maxRetries) {
      // ❌ No hay delay entre retries
      continue;
    }
    // ... error handling
  }
}
```

**Análisis:**
- Los retries son inmediatos sin delay
- Puede sobrecargar el daemon durante fallos temporales
- No hay exponential backoff
- No hay jitter para evitar thundering herd

**Solución:**
```typescript
async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function calculateBackoff(attempt: number, baseDelay: number = 100): number {
  // Exponential backoff: 100ms, 200ms, 400ms, 800ms...
  const delay = baseDelay * Math.pow(2, attempt);
  // Jitter: ±25% random
  const jitter = delay * 0.25 * (Math.random() * 2 - 1);
  return Math.min(delay + jitter, 5000); // Max 5 segundos
}

for (let attempt = 0; attempt <= maxRetries; attempt++) {
  try {
    const res = await fetch(`${daemonUrl}/activate`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal
    });
    
    if (res.ok) {
      return;
    } else {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
  } catch (error) {
    if (attempt < maxRetries) {
      const backoffMs = calculateBackoff(attempt);
      console.log(`[Daemon] Retry ${attempt + 1}/${maxRetries} after ${backoffMs}ms`);
      await sleep(backoffMs);
      continue;
    }
    // ... error handling
  }
}
```

**Prioridad:** 🟡 MEDIA  
**Esfuerzo:** 2-3 horas  
**Impacto:** Reduce carga en daemon durante fallos

---

### 🟡 MEDIO-R2: Falta de Request ID Tracking

**Ubicación:** `packages/router/src/server.ts`, `packages/router/src/pre-invoke.ts`

**Problema:**
- No hay request ID único para tracking
- Dificulta correlacionar logs entre router y daemon
- Imposible hacer distributed tracing efectivo

**Solución:**
```typescript
import { randomUUID } from 'crypto';

// Middleware para agregar request ID
fastify.addHook('onRequest', async (request, reply) => {
  const requestId = request.headers['x-request-id'] || randomUUID();
  request.headers['x-request-id'] = requestId;
  reply.header('x-request-id', requestId);
});

// Usar en logs
console.log(`[${request.headers['x-request-id']}] Processing request`);

// Propagar al daemon
const headers = {
  'Content-Type': 'application/json',
  'x-request-id': request.headers['x-request-id']
};
```

**Prioridad:** 🟡 MEDIA  
**Esfuerzo:** 2-3 horas  
**Impacto:** Mejora observabilidad significativamente

---

### 🟡 MEDIO-D1: File Watcher No Maneja Errores de Permisos

**Ubicación:** `packages/daemon/src/fileWatcher.ts:245-420`

**Problema:**
```typescript
private async handleFileChange(event: 'add' | 'change' | 'unlink', filePath: string): Promise<void> {
  try {
    // ... código
    
    const stats = await fs.stat(filePath);  // ❌ Puede fallar por permisos
    
    // ... más código
  } catch (error) {
    this.logger.error({
      event,
      filePath,
      error: error instanceof Error ? error.message : String(error)
    }, 'Error handling file change');
    // ❌ No distingue entre tipos de error
  }
}
```

**Análisis:**
- No distingue entre errores de permisos, archivo no existe, etc.
- Puede loggear errores espurios para archivos temporales
- No hay retry para errores transitorios

**Solución:**
```typescript
private async handleFileChange(event: 'add' | 'change' | 'unlink', filePath: string): Promise<void> {
  try {
    // Verificar si el archivo existe y es accesible
    try {
      await fs.access(filePath, fs.constants.R_OK);
    } catch (accessError) {
      if ((accessError as NodeJS.ErrnoException).code === 'ENOENT') {
        // Archivo no existe (normal para 'unlink')
        if (event !== 'unlink') {
          this.logger.debug({ filePath }, 'File no longer exists, skipping');
        }
        return;
      } else if ((accessError as NodeJS.ErrnoException).code === 'EACCES') {
        // Sin permisos
        this.logger.warn({ filePath }, 'No read permission for file, skipping');
        return;
      }
      throw accessError;
    }
    
    const stats = await fs.stat(filePath);
    // ... resto del código
  } catch (error) {
    const errno = (error as NodeJS.ErrnoException).code;
    
    if (errno === 'ENOENT' || errno === 'EACCES') {
      // Ya manejado arriba
      return;
    }
    
    this.logger.error({
      event,
      filePath,
      errno,
      error: error instanceof Error ? error.message : String(error)
    }, 'Error handling file change');
  }
}
```

**Prioridad:** 🟡 MEDIA
**Esfuerzo:** 2-3 horas
**Impacto:** Reduce logs espurios, mejora robustez

---

### 🟡 MEDIO-D2: Falta de Configuración Centralizada

**Ubicación:** Múltiples archivos

**Problema:**
```typescript
// En router/src/pre-invoke.ts
const CACHE_TTL_MS = parseInt(process.env.DAEMON_CACHE_TTL || '60000');
const MAX_CACHE_SIZE = parseInt(process.env.DAEMON_CACHE_MAX_SIZE || '100');

// En daemon/src/app.ts
const TTL_MS = parseInt(process.env.SF_CACHE_TTL || '60000');
const MAX_CACHE_SIZE = parseInt(process.env.SF_CACHE_MAX_SIZE || '1000');

// En fileWatcher.ts
const debounceMs = parseInt(process.env.SF_WATCH_DEBOUNCE_MS || '10000');
```

**Análisis:**
- Variables de entorno dispersas por todo el código
- Valores por defecto inconsistentes
- No hay validación de configuración
- Dificulta cambiar configuración
- No hay documentación de variables disponibles

**Solución:**
```typescript
// config/index.ts
import { z } from 'zod';

const configSchema = z.object({
  router: z.object({
    port: z.number().default(3001),
    host: z.string().default('0.0.0.0'),
    cache: z.object({
      ttlMs: z.number().default(60000),
      maxSize: z.number().default(100),
      cleanupIntervalMs: z.number().default(30000)
    }),
    daemon: z.object({
      url: z.string().url(),
      timeoutMs: z.number().default(5000),
      maxRetries: z.number().default(2)
    })
  }),
  daemon: z.object({
    port: z.number().default(3000),
    host: z.string().default('0.0.0.0'),
    cache: z.object({
      ttlMs: z.number().default(60000),
      maxSize: z.number().default(1000),
      cleanupIntervalMs: z.number().default(30000)
    }),
    fileWatcher: z.object({
      debounceMs: z.number().default(2000),
      enabled: z.boolean().default(true),
      ignorePatterns: z.array(z.string()).default([
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**'
      ])
    })
  }),
  logging: z.object({
    level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    pretty: z.boolean().default(false)
  })
});

export type Config = z.infer<typeof configSchema>;

export function loadConfig(): Config {
  const config = configSchema.parse({
    router: {
      port: parseInt(process.env.ROUTER_PORT || '3001'),
      host: process.env.ROUTER_HOST || '0.0.0.0',
      cache: {
        ttlMs: parseInt(process.env.ROUTER_CACHE_TTL || '60000'),
        maxSize: parseInt(process.env.ROUTER_CACHE_MAX_SIZE || '100'),
        cleanupIntervalMs: parseInt(process.env.ROUTER_CACHE_CLEANUP_INTERVAL || '30000')
      },
      daemon: {
        url: process.env.DAEMON_URL || 'http://localhost:3000',
        timeoutMs: parseInt(process.env.DAEMON_TIMEOUT || '5000'),
        maxRetries: parseInt(process.env.DAEMON_MAX_RETRIES || '2')
      }
    },
    daemon: {
      port: parseInt(process.env.DAEMON_PORT || '3000'),
      host: process.env.DAEMON_HOST || '0.0.0.0',
      cache: {
        ttlMs: parseInt(process.env.SF_CACHE_TTL || '60000'),
        maxSize: parseInt(process.env.SF_CACHE_MAX_SIZE || '1000'),
        cleanupIntervalMs: parseInt(process.env.SF_CACHE_CLEANUP_INTERVAL || '30000')
      },
      fileWatcher: {
        debounceMs: parseInt(process.env.SF_WATCH_DEBOUNCE_MS || '2000'),
        enabled: process.env.SF_WATCH_ENABLED !== 'false',
        ignorePatterns: process.env.SF_WATCH_IGNORE?.split(',') || undefined
      }
    },
    logging: {
      level: (process.env.LOG_LEVEL || 'info') as any,
      pretty: process.env.LOG_PRETTY === 'true'
    }
  });

  return config;
}
```

**Prioridad:** 🟡 MEDIA
**Esfuerzo:** 4-6 horas
**Impacto:** Mejora mantenibilidad y configurabilidad

---

### 🟡 MEDIO-FW1: File Watcher No Limita Número de Watchers

**Ubicación:** `packages/daemon/src/fileWatcher.ts:245-420`

**Problema:**
```typescript
async watch(path: string, options?: WatchOptions): Promise<void> {
  // ... código

  const watcher = chokidar.watch(path, chokidarOptions);
  this.watchers.set(path, watcher);  // ❌ Sin límite

  // ... más código
}
```

**Análisis:**
- No hay límite en el número de watchers
- En proyectos grandes puede exceder límites del OS (inotify en Linux)
- Puede causar "ENOSPC: System limit for number of file watchers reached"
- No hay cleanup de watchers no usados

**Solución:**
```typescript
private readonly MAX_WATCHERS = parseInt(process.env.SF_MAX_WATCHERS || '100');

async watch(path: string, options?: WatchOptions): Promise<void> {
  // Verificar límite
  if (this.watchers.size >= this.MAX_WATCHERS) {
    this.logger.warn({
      path,
      currentWatchers: this.watchers.size,
      maxWatchers: this.MAX_WATCHERS
    }, 'Maximum number of watchers reached, cannot add new watcher');

    throw new Error(`Maximum number of watchers (${this.MAX_WATCHERS}) reached`);
  }

  // Si ya existe, no crear duplicado
  if (this.watchers.has(path)) {
    this.logger.debug({ path }, 'Watcher already exists for path');
    return;
  }

  // ... resto del código
}

// Agregar método para limpiar watchers inactivos
async cleanupInactiveWatchers(): Promise<void> {
  const now = Date.now();
  const inactiveThreshold = 3600000; // 1 hora

  for (const [path, watcher] of this.watchers.entries()) {
    // Verificar si el path todavía existe
    try {
      await fs.access(path);
    } catch {
      this.logger.info({ path }, 'Path no longer exists, removing watcher');
      watcher.close();
      this.watchers.delete(path);
    }
  }
}
```

**Prioridad:** 🟡 MEDIA
**Esfuerzo:** 3-4 horas
**Impacto:** Previene crashes en proyectos grandes

---

## Problemas de Prioridad Baja

### ⚪ BAJA-R1: Falta de Compresión en Respuestas HTTP

**Ubicación:** `packages/router/src/server.ts`

**Problema:**
- No hay compresión gzip/brotli en respuestas
- Respuestas grandes (especialmente con metadata) pueden ser lentas
- Desperdicio de ancho de banda

**Solución:**
```typescript
import compress from '@fastify/compress';

await fastify.register(compress, {
  global: true,
  threshold: 1024, // Comprimir respuestas > 1KB
  encodings: ['gzip', 'deflate', 'br']
});
```

**Prioridad:** ⚪ BAJA
**Esfuerzo:** 1 hora
**Impacto:** Mejora performance en redes lentas

---

### ⚪ BAJA-R2: Falta de CORS Configurado

**Ubicación:** `packages/router/src/server.ts`

**Problema:**
- No hay configuración de CORS
- Puede causar problemas si se accede desde browser
- No hay control de orígenes permitidos

**Solución:**
```typescript
import cors from '@fastify/cors';

await fastify.register(cors, {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id']
});
```

**Prioridad:** ⚪ BAJA
**Esfuerzo:** 1 hora
**Impacto:** Mejora seguridad y compatibilidad

---

### ⚪ BAJA-D1: Falta de Métricas Prometheus

**Ubicación:** `packages/daemon/src/app.ts`

**Problema:**
- Hay endpoint `/api/realtime-metrics` pero no formato Prometheus
- Dificulta integración con Grafana
- No hay métricas estándar (request duration, error rate, etc.)

**Solución:**
```typescript
import promClient from 'prom-client';

// Crear registry
const register = new promClient.Registry();

// Métricas por defecto
promClient.collectDefaultMetrics({ register });

// Métricas custom
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.01, 0.1, 0.5, 1, 2, 5]
});

const cacheHits = new promClient.Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_name']
});

register.registerMetric(httpRequestDuration);
register.registerMetric(cacheHits);

// Endpoint Prometheus
app.get('/metrics', async (request, reply) => {
  reply.header('Content-Type', register.contentType);
  return register.metrics();
});
```

**Prioridad:** ⚪ BAJA
**Esfuerzo:** 3-4 horas
**Impacto:** Mejora observabilidad

---

### ⚪ BAJA-FW1: File Watcher No Soporta Polling Fallback

**Ubicación:** `packages/daemon/src/fileWatcher.ts`

**Problema:**
- En algunos sistemas (Docker, NFS, etc.) los eventos de file system no funcionan
- No hay fallback a polling
- Puede causar que file watching no funcione en ciertos ambientes

**Solución:**
```typescript
const chokidarOptions: chokidar.WatchOptions = {
  ignored: this.config.ignorePatterns,
  persistent: true,
  ignoreInitial: true,
  awaitWriteFinish: {
    stabilityThreshold: 2000,
    pollInterval: 100
  },
  // Agregar polling como fallback
  usePolling: process.env.SF_WATCH_USE_POLLING === 'true',
  interval: parseInt(process.env.SF_WATCH_POLL_INTERVAL || '1000'),
  binaryInterval: parseInt(process.env.SF_WATCH_POLL_BINARY_INTERVAL || '3000')
};
```

**Prioridad:** ⚪ BAJA
**Esfuerzo:** 1 hora
**Impacto:** Mejora compatibilidad con Docker/NFS

---

## Resumen de Problemas Adicionales

| Severidad | Cantidad | Tiempo Total |
|-----------|----------|--------------|
| 🟡 Media | 5 | 13-19 horas |
| ⚪ Baja | 4 | 6-9 horas |
| **TOTAL** | **9** | **19-28 horas** |

---

**Fin del Análisis Detallado**

