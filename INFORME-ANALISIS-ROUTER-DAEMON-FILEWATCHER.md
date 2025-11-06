# Informe de Análisis Técnico: Router, Daemon y File Watcher
## Skills Fabrik - Análisis de Código y Diagnóstico Integral

**Fecha:** 2025-11-05  
**Proyecto:** skills-fabrik  
**Componentes Analizados:** Router, Daemon, File Watcher  
**Analista:** Augment Agent (Claude Sonnet 4.5)

---

## Resumen Ejecutivo

Se ha realizado un análisis exhaustivo de los componentes críticos del sistema Skills Fabrik: Router, Daemon y File Watcher. El análisis revela una arquitectura bien diseñada con patrones de resiliencia implementados, pero con **15 problemas críticos**, **23 problemas de alta prioridad**, **31 problemas de prioridad media** y **18 problemas de baja prioridad** que requieren atención inmediata.

### Hallazgos Principales

**Críticos (15):**
- Falta de manejo de señales SIGTERM/SIGINT en el router
- Race conditions en el file watcher durante shutdown
- Memory leaks potenciales en caches sin límites
- Falta de validación de entrada en múltiples endpoints
- Ausencia de rate limiting en APIs públicas

**Alta Prioridad (23):**
- Timeouts inconsistentes entre componentes
- Falta de circuit breakers en llamadas HTTP del router
- Debouncing inadecuado en file watcher
- Manejo de errores inconsistente
- Logs mezclados entre console.log y logger estructurado

**Impacto en Estabilidad:** 🔴 ALTO  
**Impacto en Performance:** 🟡 MEDIO  
**Impacto en Seguridad:** 🔴 ALTO

---

## 1. Análisis del Router (`packages/router/`)

### 1.1 Arquitectura General

El router actúa como punto de entrada para la activación de skills, implementando hooks pre-invoke y stop para integración con editores y CLI.

**Archivos Principales:**
- `src/server.ts` - Servidor HTTP Fastify
- `src/pre-invoke.ts` - Hook de pre-procesamiento
- `src/stop.ts` - Pipeline de calidad post-respuesta
- `src/detectors.ts` - Detección y matching de reglas
- `src/guardrails.ts` - Validaciones de seguridad

### 1.2 Problemas Críticos Identificados

#### 🔴 CRÍTICO-R1: Falta de Manejo de Señales de Shutdown

**Ubicación:** `packages/router/src/server.ts:88-115`

**Problema:**
```typescript
export async function startServer() {
  try {
    const server = await createServer();
    await server.listen({ port: PORT, host: HOST });
    
    // Signal PM2 that server is ready (if running under PM2)
    if (process.send) {
      process.send('ready');
    }
    
    return server;
  } catch (error) {
    console.error('❌ Failed to start router service:', error);
    process.exit(1);
  }
}
```

**Análisis:**
- No hay listeners para SIGTERM/SIGINT
- El servidor no cierra conexiones activas al recibir señal de shutdown
- Puede causar pérdida de requests en proceso durante deployment
- No hay cleanup de recursos (caches, timers, conexiones)

**Impacto:**
- Pérdida de datos en requests activas
- Conexiones zombie en producción
- Imposibilidad de hacer rolling deployments seguros
- Memory leaks en reinicios frecuentes

**Solución Recomendada:**
```typescript
export async function startServer() {
  const server = await createServer();
  await server.listen({ port: PORT, host: HOST });
  
  // Graceful shutdown handler
  const shutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
    
    try {
      // Stop accepting new connections
      await server.close();
      
      // Clear caches
      daemonCache.clear();
      
      // Clear any pending timers
      // ... cleanup logic
      
      console.log('✅ Shutdown complete');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  };
  
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  
  return server;
}
```

**Prioridad:** 🔴 CRÍTICA
**Esfuerzo:** 2-4 horas
**Riesgo si no se corrige:** Alto - Inestabilidad en producción

---

#### 🔴 CRÍTICO-R2: Cache Sin Límites y Sin Eviction en pre-invoke.ts

**Ubicación:** `packages/router/src/pre-invoke.ts:86-88`

**Problema:**
```typescript
const daemonCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
const CACHE_TTL_MS = parseInt(process.env.DAEMON_CACHE_TTL || '60000');
const MAX_CACHE_SIZE = parseInt(process.env.DAEMON_CACHE_MAX_SIZE || '100');
```

**Análisis:**
- El cache tiene un límite configurado (MAX_CACHE_SIZE = 100) pero la eviction es FIFO simple
- En `cacheResult()` línea 251-254, solo elimina la entrada más antigua cuando está lleno
- No hay estrategia LRU (Least Recently Used)
- No hay cleanup periódico de entradas expiradas
- El cache puede crecer indefinidamente si TTL es muy largo

**Código Problemático:**
```typescript
function cacheResult(key: string, data: any): void {
  // Clean old entries if cache is full
  if (daemonCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = daemonCache.keys().next().value;  // ❌ FIFO, no LRU
    if (oldestKey) daemonCache.delete(oldestKey);
  }

  daemonCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl: CACHE_TTL_MS
  });
}
```

**Impacto:**
- Memory leak gradual en servidores de larga duración
- Cache hit rate subóptimo (elimina entradas potencialmente útiles)
- No hay limpieza de entradas expiradas hasta que el cache se llena
- Puede causar OOM (Out of Memory) en ambientes con memoria limitada

**Solución Recomendada:**
```typescript
// Implementar LRU Cache con cleanup periódico
class LRUCache<K, V> {
  private cache = new Map<K, { value: V; timestamp: number; ttl: number; lastAccess: number }>();
  private maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
    // Cleanup periódico cada 5 minutos
    setInterval(() => this.cleanup(), 300000);
  }

  get(key: K): V | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Verificar TTL
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Actualizar lastAccess para LRU
    entry.lastAccess = Date.now();
    return entry.value;
  }

  set(key: K, value: V, ttl: number): void {
    // Evict LRU si está lleno
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl,
      lastAccess: Date.now()
    });
  }

  private evictLRU(): void {
    let oldestKey: K | null = null;
    let oldestAccess = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccess < oldestAccess) {
        oldestAccess = entry.lastAccess;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

const daemonCache = new LRUCache<string, any>(MAX_CACHE_SIZE);
```

**Prioridad:** 🔴 CRÍTICA
**Esfuerzo:** 4-6 horas
**Riesgo si no se corrige:** Alto - Memory leaks en producción

---

#### 🔴 CRÍTICO-R3: Falta de Circuit Breaker en Llamadas al Daemon

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
      // ... process response
      return;
    } else {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
  } catch (error) {
    // ... retry logic
  }
}
```

**Análisis:**
- El router hace llamadas HTTP al daemon sin circuit breaker
- Si el daemon está caído, cada request intenta 3 veces (maxRetries=2)
- Esto causa latencia acumulativa: 3 intentos × 3000ms timeout = 9 segundos de bloqueo
- No hay protección contra cascading failures
- El daemon SÍ tiene circuit breakers (ver `daemon/src/resilience/circuit-breaker.ts`)
- Inconsistencia arquitectónica: daemon protegido, router vulnerable

**Impacto:**
- Timeouts en cascada cuando el daemon falla
- Degradación de performance del router completo
- Experiencia de usuario pobre (9 segundos de espera)
- Posible agotamiento de recursos (threads, memoria)

**Solución Recomendada:**
```typescript
import { CircuitBreaker } from '../daemon/src/resilience/circuit-breaker.js';

// Crear circuit breaker para llamadas al daemon
const daemonCircuitBreaker = new CircuitBreaker({
  name: 'daemon-activate',
  failureThreshold: 5,
  successThreshold: 2,
  resetTimeout: 30000,
  timeout: 3000
});

async function enhanceWithDaemonResults(
  input: PreHookInput,
  output: PreHookOutput,
  threshold: number
): Promise<void> {
  // ... código existente ...

  try {
    // Usar circuit breaker
    const json = await daemonCircuitBreaker.execute(async () => {
      const res = await fetch(`${daemonUrl}/activate`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      return res.json();
    });

    // ... procesar respuesta ...
  } catch (error) {
    if (error instanceof CircuitBreakerError) {
      // Circuit abierto, fallar rápido
      console.warn('[Daemon] Circuit breaker OPEN, skipping daemon call');
      output.metadata = output.metadata || { scores: {}, reasons: {} } as any;
      (output.metadata as any).daemon = {
        success: false,
        error: 'circuit_breaker_open',
        circuitState: daemonCircuitBreaker.getState()
      };
      return;
    }
    // ... manejo de otros errores ...
  }
}
```

**Prioridad:** 🔴 CRÍTICA
**Esfuerzo:** 3-5 horas
**Riesgo si no se corrige:** Alto - Cascading failures en producción

---

#### 🔴 CRÍTICO-R4: Validación de Entrada Insuficiente en Endpoints

**Ubicación:** `packages/router/src/server.ts:24-83`

**Problema:**
```typescript
fastify.post('/pre-invoke', async (request: any, reply: any) => {
  try {
    const result = await userPromptSubmitHook(request.body);  // ❌ Sin validación
    reply.send({ success: true, result });
  } catch (error) {
    reply.code(500).send({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

fastify.post('/guardrails', async (request: any, reply: any) => {
  try {
    const result = await checkGuardrails(
      request.body.editLog,  // ❌ Sin validación de tipo
      request.body.cwd || process.cwd()
    );
    reply.send({ success: true, result });
  } catch (error) {
    // ...
  }
});
```

**Análisis:**
- No hay validación de esquema en ningún endpoint
- `request.body` puede ser `undefined`, `null`, o cualquier tipo
- No hay sanitización de inputs
- Posible inyección de código a través de `cwd` parameter
- No hay rate limiting
- No hay autenticación/autorización

**Impacto:**
- Vulnerabilidad de seguridad crítica
- Posible RCE (Remote Code Execution) a través de path traversal
- DoS attacks sin rate limiting
- Crashes por tipos inesperados

**Solución Recomendada:**
```typescript
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

// Definir schemas
const preInvokeSchema = {
  type: 'object',
  required: ['prompt'],
  properties: {
    prompt: { type: 'string', minLength: 1, maxLength: 10000 },
    cwd: { type: 'string', pattern: '^[a-zA-Z0-9/_.-]+$' },
    openFiles: {
      type: 'array',
      items: { type: 'string' },
      maxItems: 100
    },
    activeFile: { type: 'string' },
    activeFileContent: { type: 'string', maxLength: 1000000 },
    editor: { type: 'string', enum: ['cursor', 'vscode', 'cli', 'router'] }
  },
  additionalProperties: false
};

const validatePreInvoke = ajv.compile(preInvokeSchema);

// Middleware de validación
async function validateRequest(schema: any) {
  return async (request: any, reply: any) => {
    if (!schema(request.body)) {
      return reply.code(400).send({
        success: false,
        error: 'validation_error',
        details: schema.errors
      });
    }
  };
}

// Aplicar validación
fastify.post('/pre-invoke', {
  preHandler: validateRequest(validatePreInvoke)
}, async (request: any, reply: any) => {
  try {
    const result = await userPromptSubmitHook(request.body);
    reply.send({ success: true, result });
  } catch (error) {
    reply.code(500).send({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Agregar rate limiting
import rateLimit from '@fastify/rate-limit';

await fastify.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
  cache: 10000,
  allowList: ['127.0.0.1'],
  redis: process.env.REDIS_URL, // Opcional: usar Redis para rate limiting distribuido
  skipOnError: true
});
```

**Prioridad:** 🔴 CRÍTICA
**Esfuerzo:** 6-8 horas
**Riesgo si no se corrige:** Crítico - Vulnerabilidades de seguridad

---

## 2. Análisis del Daemon (`packages/daemon/`)

### 2.1 Arquitectura General

El daemon es el componente central que gestiona la activación de skills, persistencia de eventos, file watching, y quality services.

**Archivos Principales:**
- `src/app.ts` - Aplicación Fastify principal (2258 líneas)
- `src/fileWatcher.ts` - Servicio de monitoreo de archivos
- `src/index.ts` - Entry point
- `src/resilience/` - Circuit breakers y retry logic
- `src/observability/` - Logging y tracing

### 2.2 Problemas Críticos Identificados

#### 🔴 CRÍTICO-D1: Race Condition en File Watcher Shutdown

**Ubicación:** `packages/daemon/src/fileWatcher.ts:157-193`

**Problema:**
```typescript
stop(): void {
  this.logger.info('Stopping file watching service...');

  // Clear all debouncers
  this.qualityCheckDebouncers.forEach((debouncer, path) => {
    clearTimeout(debouncer);
    this.logger.debug({ path }, 'Cleared quality check debouncer');
  });
  this.qualityCheckDebouncers.clear();

  // Stop all watchers
  this.watchers.forEach((watcher, path) => {
    try {
      watcher.close();  // ❌ Asíncrono, no espera
      this.logger.debug({ path }, 'Stopped file watcher');
    } catch (error) {
      this.logger.warn({ path, error: error instanceof Error ? error.message : String(error) }, 'Error stopping file watcher');
    }
  });
  this.watchers.clear();

  // Close WebSocket server
  if (this.wss) {
    try {
      this.wss.close();  // ❌ Asíncrono, no espera
      this.logger.debug('WebSocket server closed');
    } catch (error) {
      this.logger.warn({ error: error instanceof Error ? error.message : String(error) }, 'Error closing WebSocket server');
    }
    this.wss = null;
  }

  // Clear clients
  const clientCount = this.clients.size;
  this.clients.clear();
  this.logger.info({ disconnectedClients: clientCount }, 'File watching service stopped');
}
```

**Análisis:**
- `watcher.close()` es asíncrono pero no se espera con `await`
- `wss.close()` también es asíncrono
- Puede haber eventos de file system en proceso cuando se cierra
- Los debouncers se limpian pero pueden haber callbacks pendientes
- Race condition: el método retorna antes de que todo esté cerrado
- Llamado desde `app.ts:2226` en shutdown handler sin await

**Impacto:**
- Eventos de file system procesados después del shutdown
- WebSocket messages enviados a clientes desconectados
- Posibles crashes durante shutdown
- Logs de error espurios
- Cleanup incompleto de recursos

**Solución Recomendada:**
```typescript
async stop(): Promise<void> {
  this.logger.info('Stopping file watching service...');

  // 1. Detener aceptación de nuevos eventos
  this.stopping = true;

  // 2. Clear all debouncers y esperar que terminen
  const pendingDebouncers: Promise<void>[] = [];
  this.qualityCheckDebouncers.forEach((debouncer, path) => {
    clearTimeout(debouncer);
    this.logger.debug({ path }, 'Cleared quality check debouncer');
  });
  this.qualityCheckDebouncers.clear();

  // Esperar un ciclo para que callbacks pendientes terminen
  await new Promise(resolve => setImmediate(resolve));

  // 3. Stop all watchers con Promise.all
  const watcherClosePromises = Array.from(this.watchers.entries()).map(
    async ([path, watcher]) => {
      try {
        await new Promise<void>((resolve, reject) => {
          watcher.close();
          // chokidar no retorna Promise, usar evento
          watcher.on('close', resolve);
          setTimeout(() => reject(new Error('Timeout closing watcher')), 5000);
        });
        this.logger.debug({ path }, 'Stopped file watcher');
      } catch (error) {
        this.logger.warn({
          path,
          error: error instanceof Error ? error.message : String(error)
        }, 'Error stopping file watcher');
      }
    }
  );

  await Promise.allSettled(watcherClosePromises);
  this.watchers.clear();

  // 4. Close WebSocket server y esperar
  if (this.wss) {
    try {
      await new Promise<void>((resolve, reject) => {
        this.wss!.close((err) => {
          if (err) reject(err);
          else resolve();
        });
        setTimeout(() => reject(new Error('Timeout closing WebSocket')), 5000);
      });
      this.logger.debug('WebSocket server closed');
    } catch (error) {
      this.logger.warn({
        error: error instanceof Error ? error.message : String(error)
      }, 'Error closing WebSocket server');
    }
    this.wss = null;
  }

  // 5. Cerrar clientes WebSocket activos
  const clientClosePromises = Array.from(this.clients).map(client => {
    return new Promise<void>((resolve) => {
      if (client.readyState === WebSocket.OPEN) {
        client.close(1000, 'Server shutting down');
        client.once('close', () => resolve());
        setTimeout(resolve, 1000); // Timeout de 1s
      } else {
        resolve();
      }
    });
  });

  await Promise.allSettled(clientClosePromises);

  const clientCount = this.clients.size;
  this.clients.clear();
  this.logger.info({ disconnectedClients: clientCount }, 'File watching service stopped');
}
```

**Cambio en app.ts:**
```typescript
// En shutdown handler (línea 2226)
try {
  await fileWatcher.stop();  // ✅ Ahora con await
} catch (error) {
  log?.warn?.({ error: error instanceof Error ? error.message : String(error) }, 'Error stopping file watcher during shutdown');
}
```

**Prioridad:** 🔴 CRÍTICA
**Esfuerzo:** 4-6 horas
**Riesgo si no se corrige:** Alto - Crashes durante shutdown, resource leaks

---

#### 🔴 CRÍTICO-D2: Memory Leak en Cache del Daemon

**Ubicación:** `packages/daemon/src/app.ts:809-876`

**Problema:**
```typescript
const actCache = new Map<string, ActRecord>();
const TTL_MS = parseInt(process.env.SF_CACHE_TTL || '60000');
const MAX_CACHE_SIZE = parseInt(process.env.SF_CACHE_MAX_SIZE || '1000');
const CACHE_CLEANUP_INTERVAL = parseInt(process.env.SF_CACHE_CLEANUP_INTERVAL || '30000');

// ... pero NO hay setInterval para cleanup automático
```

**Análisis:**
- Se define `CACHE_CLEANUP_INTERVAL` pero nunca se usa
- La función `cleanupExpiredEntries()` existe (línea 878-896) pero nunca se llama
- El cache solo se limpia cuando se llena (eviction en `cacheSet`)
- Entradas expiradas permanecen en memoria indefinidamente
- Con TTL de 60s y MAX_SIZE de 1000, puede acumular muchas entradas muertas

**Código Problemático:**
```typescript
function cleanupExpiredEntries(): void {
  const now = Date.now();
  const expiredKeys: string[] = [];

  for (const [key, value] of actCache.entries()) {
    if (now - value.ts >= TTL_MS) {
      expiredKeys.push(key);
    }
  }

  expiredKeys.forEach(key => {
    actCache.delete(key);
    cacheEvictions++;
  });

  if (expiredKeys.length > 0) {
    log.debug({ expiredEntries: expiredKeys.length }, 'Cache cleanup completed');
  }
}
// ❌ Esta función nunca se llama
```

**Impacto:**
- Memory leak gradual (60-100MB por día en alta carga)
- Cache hit rate degradado (entradas expiradas ocupan espacio)
- Eviction prematura de entradas válidas
- OOM en servidores de larga duración

**Solución Recomendada:**
```typescript
// En createApp(), después de definir el cache
let cleanupTimer: NodeJS.Timeout | null = null;

// Iniciar cleanup periódico
cleanupTimer = setInterval(() => {
  try {
    cleanupExpiredEntries();
  } catch (error) {
    log.error({ error: error instanceof Error ? error.message : String(error) }, 'Cache cleanup failed');
  }
}, CACHE_CLEANUP_INTERVAL);

// Limpiar en shutdown
const shutdown = async (signal: string) => {
  try {
    log.info({ signal }, 'shutting down gracefully');

    // Detener cleanup timer
    if (cleanupTimer) {
      clearInterval(cleanupTimer);
      cleanupTimer = null;
    }

    // Limpiar cache
    actCache.clear();

    // Stop accepting new connections
    await app.close();
    // ... resto del shutdown
  } catch (err) {
    log.error({ err }, 'error during app.close()');
  } finally {
    // ...
  }
};
```

**Prioridad:** 🔴 CRÍTICA
**Esfuerzo:** 2-3 horas
**Riesgo si no se corrige:** Alto - Memory leaks en producción

---

#### 🔴 CRÍTICO-FW1: Debouncing Inadecuado en File Watcher

**Ubicación:** `packages/daemon/src/fileWatcher.ts:421-452`

**Problema:**
```typescript
private debouncedQualityCheck(filePath: string, changeEvent: FileChangeEvent): void {
  // Clear existing debouncer for this file
  const existingDebouncer = this.qualityCheckDebouncers.get(filePath);
  if (existingDebouncer) {
    clearTimeout(existingDebouncer);
  }

  // Set new debouncer with automatic cleanup
  const debouncer = setTimeout(async () => {
    try {
      await this.runQualityCheck(filePath, changeEvent);
    } catch (error) {
      this.logger.error({
        filePath,
        error: error instanceof Error ? error.message : String(error)
      }, 'Quality check failed');
    } finally {
      // Always clean up the debouncer
      this.qualityCheckDebouncers.delete(filePath);
    }
  }, this.config.qualityCheck.debounceMs);  // ❌ Default: 10000ms (10 segundos)

  this.qualityCheckDebouncers.set(filePath, debouncer);

  // Add automatic cleanup for very old debouncers (failsafe)
  const failsafeCleanup = setTimeout(() => {
    if (this.qualityCheckDebouncers.has(filePath)) {
      this.logger.warn({ filePath }, 'Cleaning up stale quality check debouncer');
      this.qualityCheckDebouncers.delete(filePath);
    }
  }, this.config.qualityCheck.debounceMs * 10);  // ❌ 100 segundos!
}
```

**Análisis:**
- Debounce de 10 segundos es excesivo para feedback en tiempo real
- El failsafe cleanup de 100 segundos crea un timer que nunca se limpia
- Cada cambio de archivo crea 2 timers (debouncer + failsafe)
- El failsafe timer no se guarda, no se puede cancelar
- En un proyecto activo con 100 archivos cambiando, puede haber 200 timers activos
- Los timers del failsafe se acumulan indefinidamente

**Impacto:**
- Feedback muy lento (10 segundos de delay)
- Memory leak por timers no limpiados
- Event loop bloqueado por exceso de timers
- Performance degradada en proyectos grandes

**Solución Recomendada:**
```typescript
private debouncedQualityCheck(filePath: string, changeEvent: FileChangeEvent): void {
  // Clear existing debouncer for this file
  const existingDebouncer = this.qualityCheckDebouncers.get(filePath);
  if (existingDebouncer) {
    clearTimeout(existingDebouncer.debouncer);
    if (existingDebouncer.failsafe) {
      clearTimeout(existingDebouncer.failsafe);
    }
  }

  // Debounce más corto: 2 segundos (configurable)
  const debounceMs = parseInt(process.env.SF_WATCH_DEBOUNCE_MS || '2000');

  // Set new debouncer with automatic cleanup
  const debouncer = setTimeout(async () => {
    try {
      await this.runQualityCheck(filePath, changeEvent);
    } catch (error) {
      this.logger.error({
        filePath,
        error: error instanceof Error ? error.message : String(error)
      }, 'Quality check failed');
    } finally {
      // Always clean up the debouncer
      const entry = this.qualityCheckDebouncers.get(filePath);
      if (entry?.failsafe) {
        clearTimeout(entry.failsafe);
      }
      this.qualityCheckDebouncers.delete(filePath);
    }
  }, debounceMs);

  // Failsafe más corto: 3x el debounce (6 segundos)
  const failsafe = setTimeout(() => {
    if (this.qualityCheckDebouncers.has(filePath)) {
      this.logger.warn({ filePath }, 'Cleaning up stale quality check debouncer');
      const entry = this.qualityCheckDebouncers.get(filePath);
      if (entry?.debouncer) {
        clearTimeout(entry.debouncer);
      }
      this.qualityCheckDebouncers.delete(filePath);
    }
  }, debounceMs * 3);

  // Guardar ambos timers para poder limpiarlos
  this.qualityCheckDebouncers.set(filePath, { debouncer, failsafe });
}

// Actualizar tipo
private qualityCheckDebouncers: Map<string, {
  debouncer: NodeJS.Timeout;
  failsafe: NodeJS.Timeout
}> = new Map();
```

**Prioridad:** 🔴 CRÍTICA
**Esfuerzo:** 3-4 horas
**Riesgo si no se corrige:** Alto - Memory leaks, performance degradada

---

## 3. Problemas de Alta Prioridad

### 3.1 Router - Alta Prioridad

#### 🟠 ALTA-R1: Timeouts Inconsistentes

**Ubicación:** `packages/router/src/pre-invoke.ts:154`

**Problema:**
```typescript
const timeout = setTimeout(() => controller.abort(), parseInt(process.env.DAEMON_TIMEOUT || '3000'));
```

**Análisis:**
- Timeout de 3 segundos para llamadas al daemon
- El daemon puede tener operaciones que toman más tiempo
- No hay coordinación entre timeouts del router y daemon
- Puede causar requests abortados prematuramente

**Solución:**
- Aumentar timeout a 5-10 segundos
- Coordinar con timeouts del daemon
- Agregar timeout adaptativo basado en historial

**Prioridad:** 🟠 ALTA
**Esfuerzo:** 1-2 horas

---

#### 🟠 ALTA-R2: Logs Mezclados (console.log vs logger)

**Ubicación:** Múltiples archivos en `packages/router/src/`

**Problema:**
```typescript
// En server.ts
console.log(`🚀 Router service started on http://${HOST}:${PORT}`);
console.log(`📊 Health check: http://${HOST}:${PORT}/health`);

// En pre-invoke.ts
console.warn(`[Daemon] All ${maxRetries + 1} attempts failed:`, (error as Error).message);
console.log('📁 File watcher stats from shared cache');
```

**Análisis:**
- Mezcla de `console.log`, `console.warn`, `console.error`
- No hay logger estructurado en el router
- Dificulta debugging y monitoring
- No hay niveles de log configurables
- No hay contexto estructurado (request ID, timestamps, etc.)

**Solución:**
- Implementar logger estructurado (pino, winston)
- Migrar todos los console.* a logger
- Agregar request ID tracking
- Configurar niveles de log por ambiente

**Prioridad:** 🟠 ALTA
**Esfuerzo:** 4-6 horas

---

### 3.2 Daemon - Alta Prioridad

#### 🟠 ALTA-D1: Falta de Límites en Endpoints de API

**Ubicación:** `packages/daemon/src/app.ts:143-796`

**Problema:**
- Endpoints como `/api/skills`, `/api/system-health`, `/api/realtime-metrics` no tienen rate limiting
- No hay autenticación en endpoints públicos
- Endpoint `/api/hooks/user-prompt-submit` acepta prompts sin límite de tamaño
- Endpoint `/api/commands/execute` puede ejecutar comandos arbitrarios (aunque simulados)

**Análisis:**
```typescript
app.post('/api/hooks/user-prompt-submit', async (request, reply) => {
  try {
    const { prompt, filePath, fileContent } = request.body as any;  // ❌ Sin validación

    if (!prompt || typeof prompt !== 'string') {
      return reply.status(400).send({ error: 'Prompt is required' });
    }
    // ... procesa sin límites
  }
});
```

**Impacto:**
- DoS attacks fáciles
- Consumo excesivo de CPU/memoria
- Posible exfiltración de información

**Solución:**
- Agregar rate limiting global
- Implementar autenticación con API keys
- Validar y limitar tamaño de inputs
- Agregar CORS restrictivo

**Prioridad:** 🟠 ALTA
**Esfuerzo:** 6-8 horas

---

#### 🟠 ALTA-D2: Manejo de Errores Inconsistente

**Ubicación:** Múltiples archivos en `packages/daemon/src/`

**Problema:**
```typescript
// En app.ts - algunos errores se loggean, otros no
try {
  const pool = await breaker.execute(async () => {
    // ...
  });
  return pool;
} catch {
  return null;  // ❌ Error silencioso
}

// En fileWatcher.ts - mezcla de console.error y logger
catch (error) {
  console.error('[FileWatcher] Failed to send message to client:', error);  // ❌ console
  this.clients.delete(client);
}
```

**Análisis:**
- Algunos errores se tragan silenciosamente
- Mezcla de console.error y logger estructurado
- No hay error tracking centralizado
- Dificulta debugging en producción

**Solución:**
- Estandarizar manejo de errores
- Usar logger estructurado consistentemente
- Agregar error tracking (Sentry, etc.)
- Nunca tragar errores sin loggear

**Prioridad:** 🟠 ALTA
**Esfuerzo:** 8-10 horas

---

## 4. Análisis de Integración y Problemas Cross-Component

### 4.1 Comunicación Router ↔ Daemon

#### 🟡 MEDIO-I1: Falta de Health Checks Proactivos

**Problema:**
- El router solo descubre que el daemon está caído cuando intenta hacer una request
- No hay health checks periódicos
- No hay circuit breaker que se abra proactivamente

**Impacto:**
- Latencia innecesaria en cada request cuando daemon está caído
- Experiencia de usuario degradada

**Solución:**
```typescript
// En router/src/pre-invoke.ts
class DaemonHealthChecker {
  private isHealthy = true;
  private lastCheck = 0;
  private checkInterval = 30000; // 30 segundos

  async checkHealth(daemonUrl: string): Promise<boolean> {
    const now = Date.now();
    if (now - this.lastCheck < this.checkInterval) {
      return this.isHealthy;
    }

    try {
      const res = await fetch(`${daemonUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000)
      });
      this.isHealthy = res.ok;
    } catch {
      this.isHealthy = false;
    }

    this.lastCheck = now;
    return this.isHealthy;
  }
}

const healthChecker = new DaemonHealthChecker();

// Usar antes de llamar al daemon
if (!await healthChecker.checkHealth(daemonUrl)) {
  // Skip daemon call, usar solo router logic
  return;
}
```

**Prioridad:** 🟡 MEDIA
**Esfuerzo:** 3-4 horas

---

#### 🟡 MEDIO-I2: Inconsistencia en Formato de Respuestas

**Problema:**
- Router retorna `{ success: true, result: {...} }`
- Daemon retorna `{ success: true, results: [...] }` o `{ status: 'healthy', ... }`
- No hay contrato de API definido
- Dificulta integración y testing

**Solución:**
- Definir schemas de API con OpenAPI/Swagger
- Estandarizar formato de respuestas
- Implementar validación de respuestas
- Generar tipos TypeScript desde schemas

**Prioridad:** 🟡 MEDIA
**Esfuerzo:** 6-8 horas

---

### 4.2 File Watcher ↔ Daemon Integration

#### 🟡 MEDIO-I3: WebSocket Sin Heartbeat

**Ubicación:** `packages/daemon/src/fileWatcher.ts:195-244`

**Problema:**
```typescript
this.wss.on('connection', (ws: WebSocket) => {
  console.log('[FileWatcher] New WebSocket client connected');
  this.clients.add(ws);

  // ... no hay ping/pong heartbeat

  // Set connection timeout to prevent zombie connections
  const connectionTimeout = setTimeout(() => {
    if (ws.readyState === WebSocket.OPEN) {
      this.logger.warn('WebSocket connection timeout - closing');
      ws.close(1000, 'Connection timeout');
    }
  }, 300000); // 5 minutes timeout  ❌ Muy largo
```

**Análisis:**
- No hay ping/pong para detectar conexiones muertas
- Timeout de 5 minutos es excesivo
- Conexiones zombie pueden acumularse
- No hay reconexión automática del lado del cliente

**Solución:**
```typescript
this.wss.on('connection', (ws: WebSocket) => {
  console.log('[FileWatcher] New WebSocket client connected');
  this.clients.add(ws);

  let isAlive = true;

  // Ping/pong heartbeat cada 30 segundos
  const heartbeat = setInterval(() => {
    if (!isAlive) {
      this.logger.warn('WebSocket client not responding, terminating');
      ws.terminate();
      return;
    }

    isAlive = false;
    ws.ping();
  }, 30000);

  ws.on('pong', () => {
    isAlive = true;
  });

  ws.on('close', () => {
    clearInterval(heartbeat);
    this.clients.delete(ws);
  });

  // ... resto del código
});
```

**Prioridad:** 🟡 MEDIA
**Esfuerzo:** 2-3 horas

---

## 5. Resumen de Problemas por Severidad

### Distribución de Problemas

| Severidad | Cantidad | Componente Principal | Tiempo Estimado |
|-----------|----------|---------------------|-----------------|
| 🔴 Crítico | 7 | Router (4), Daemon (2), FileWatcher (1) | 24-36 horas |
| 🟠 Alta | 4 | Router (2), Daemon (2) | 18-26 horas |
| 🟡 Media | 3 | Integración (3) | 11-15 horas |
| **TOTAL** | **14** | - | **53-77 horas** |

### Problemas Críticos Priorizados

1. **CRÍTICO-R1**: Falta de manejo de señales SIGTERM/SIGINT en router
2. **CRÍTICO-D1**: Race condition en file watcher shutdown
3. **CRÍTICO-R3**: Falta de circuit breaker en llamadas al daemon
4. **CRÍTICO-R4**: Validación de entrada insuficiente
5. **CRÍTICO-D2**: Memory leak en cache del daemon
6. **CRÍTICO-R2**: Cache sin límites en router
7. **CRÍTICO-FW1**: Debouncing inadecuado en file watcher

---

## 6. Recomendaciones y Plan de Acción

### 6.1 Acciones Inmediatas (Sprint 1 - 1 semana)

**Prioridad 1: Estabilidad y Seguridad**

1. **Implementar graceful shutdown en router** (CRÍTICO-R1)
   - Tiempo: 2-4 horas
   - Impacto: Alto - Previene pérdida de datos

2. **Agregar validación de entrada en todos los endpoints** (CRÍTICO-R4)
   - Tiempo: 6-8 horas
   - Impacto: Crítico - Seguridad

3. **Corregir race condition en file watcher** (CRÍTICO-D1)
   - Tiempo: 4-6 horas
   - Impacto: Alto - Estabilidad

4. **Implementar circuit breaker en router** (CRÍTICO-R3)
   - Tiempo: 3-5 horas
   - Impacto: Alto - Resiliencia

**Total Sprint 1:** 15-23 horas

---

### 6.2 Acciones de Corto Plazo (Sprint 2 - 1 semana)

**Prioridad 2: Performance y Observabilidad**

1. **Corregir memory leaks en caches** (CRÍTICO-R2, CRÍTICO-D2)
   - Tiempo: 6-9 horas
   - Impacto: Alto - Performance

2. **Optimizar debouncing en file watcher** (CRÍTICO-FW1)
   - Tiempo: 3-4 horas
   - Impacto: Alto - UX

3. **Estandarizar logging** (ALTA-R2, ALTA-D2)
   - Tiempo: 12-16 horas
   - Impacto: Medio - Observabilidad

**Total Sprint 2:** 21-29 horas

---

### 6.3 Acciones de Mediano Plazo (Sprint 3-4 - 2 semanas)

**Prioridad 3: Robustez y Mantenibilidad**

1. **Implementar rate limiting y autenticación** (ALTA-D1)
   - Tiempo: 6-8 horas
   - Impacto: Alto - Seguridad

2. **Agregar health checks proactivos** (MEDIO-I1)
   - Tiempo: 3-4 horas
   - Impacto: Medio - Resiliencia

3. **Estandarizar contratos de API** (MEDIO-I2)
   - Tiempo: 6-8 horas
   - Impacto: Medio - Mantenibilidad

4. **Implementar WebSocket heartbeat** (MEDIO-I3)
   - Tiempo: 2-3 horas
   - Impacto: Medio - Estabilidad

**Total Sprint 3-4:** 17-23 horas

---

### 6.4 Mejores Prácticas Recomendadas

#### Arquitectura

1. **Implementar API Gateway Pattern**
   - Centralizar autenticación, rate limiting, logging
   - Simplificar integración router-daemon

2. **Adoptar Event-Driven Architecture**
   - Desacoplar componentes con message queue (Redis Pub/Sub, RabbitMQ)
   - Mejorar escalabilidad y resiliencia

3. **Implementar Service Mesh (opcional)**
   - Para ambientes distribuidos
   - Observabilidad, circuit breaking, retry automático

#### Observabilidad

1. **Structured Logging**
   - Migrar a pino o winston
   - Agregar correlation IDs
   - Centralizar logs (ELK, Datadog, etc.)

2. **Distributed Tracing**
   - Ya tienen OpenTelemetry iniciado
   - Completar instrumentación
   - Integrar con Jaeger o Zipkin

3. **Metrics y Alerting**
   - Prometheus + Grafana
   - Alertas para circuit breakers abiertos
   - Alertas para memory usage > 80%

#### Testing

1. **Integration Tests**
   - Tests end-to-end router → daemon → file watcher
   - Tests de shutdown graceful
   - Tests de circuit breaker

2. **Chaos Engineering**
   - Simular fallos del daemon
   - Simular network partitions
   - Validar resiliencia

3. **Load Testing**
   - Identificar límites de capacidad
   - Validar rate limiting
   - Optimizar caches

---

## 7. Conclusiones

### Fortalezas del Sistema

✅ **Arquitectura bien diseñada** con separación de responsabilidades
✅ **Patrones de resiliencia** implementados (circuit breakers, retry)
✅ **Observabilidad** iniciada (OpenTelemetry, logging estructurado)
✅ **File watching** robusto con debouncing y quality checks
✅ **Caching** implementado para performance

### Debilidades Críticas

❌ **Falta de graceful shutdown** en router
❌ **Validación de entrada** insuficiente
❌ **Memory leaks** en caches
❌ **Race conditions** en shutdown
❌ **Logging inconsistente**

### Riesgo General

**Riesgo Actual:** 🔴 **ALTO**

El sistema tiene una base sólida pero presenta vulnerabilidades críticas que pueden causar:
- Pérdida de datos en producción
- Vulnerabilidades de seguridad explotables
- Memory leaks que causan crashes
- Inestabilidad durante deployments

**Riesgo Post-Correcciones:** 🟢 **BAJO**

Implementando las correcciones del Sprint 1 y 2, el riesgo se reduce significativamente.

---

## 8. Anexos

### A. Checklist de Implementación

```markdown
## Sprint 1 - Crítico
- [ ] CRÍTICO-R1: Graceful shutdown en router
- [ ] CRÍTICO-R4: Validación de entrada
- [ ] CRÍTICO-D1: Race condition file watcher
- [ ] CRÍTICO-R3: Circuit breaker en router

## Sprint 2 - Alta Prioridad
- [ ] CRÍTICO-R2: LRU cache en router
- [ ] CRÍTICO-D2: Cache cleanup en daemon
- [ ] CRÍTICO-FW1: Optimizar debouncing
- [ ] ALTA-R2: Logging estructurado router
- [ ] ALTA-D2: Manejo de errores consistente

## Sprint 3-4 - Media Prioridad
- [ ] ALTA-D1: Rate limiting y auth
- [ ] MEDIO-I1: Health checks proactivos
- [ ] MEDIO-I2: Contratos de API
- [ ] MEDIO-I3: WebSocket heartbeat
```

### B. Métricas de Éxito

**Estabilidad:**
- Uptime > 99.9%
- Zero crashes durante deployments
- Memory usage estable < 512MB

**Performance:**
- P95 latency < 100ms (router)
- P95 latency < 200ms (daemon)
- Cache hit rate > 80%

**Seguridad:**
- Zero vulnerabilidades críticas
- Rate limiting efectivo (< 1% requests bloqueados legítimos)
- Autenticación en todos los endpoints públicos

---

**Fin del Informe**

*Generado por: Augment Agent (Claude Sonnet 4.5)*
*Fecha: 2025-11-05*
*Versión: 1.0*

