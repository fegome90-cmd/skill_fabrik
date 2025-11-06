# Análisis del Daemon Package

**Fecha**: 2025-11-01  
**Componente**: `packages/daemon/`  
**Método**: Análisis de endpoints, servicios y comunicación

---

## 📋 Índice

1. [Visión General](#visión-general)
2. [Endpoints API](#endpoints-api)
3. [Análisis de `/activate`](#análisis-de-activate)
4. [Análisis de `/execute`](#análisis-de-execute)
5. [Análisis de Quality Service](#análisis-de-quality-service)
6. [Análisis de File Watcher](#análisis-de-file-watcher)
7. [Integración con Router](#integración-con-router)
8. [Sistema de Cache](#sistema-de-cache)
9. [Health Checks y Métricas](#health-checks-y-métricas)

---

## 🎯 Visión General

El Daemon Package proporciona servicios de backend para el sistema Skills Fabric:

- **Skill Activation**: Endpoint `/activate` para detección y scoring de skills
- **Skill Execution**: Endpoint `/execute` para ejecución con confirmaciones
- **Quality Service**: ESLint y Prettier integration
- **File Watcher**: Monitoreo de cambios en tiempo real
- **Caching**: Sistema distribuido con Redis (opcional) o memoria
- **Métricas**: Health checks, latencias, estadísticas de cache

**Ubicación**: `packages/daemon/src/`  
**Puerto Default**: 7727  
**Framework**: Fastify

---

## 🌐 Endpoints API

### Endpoints Principales

| Método | Endpoint | Propósito | Auth |
|--------|----------|-----------|------|
| `POST` | `/activate` | Activar skills basado en intent/contexto | API Key / JWT |
| `POST` | `/execute` | Ejecutar skill con confirmación | API Key / JWT |
| `GET` | `/health` | Health check completo | No |
| `GET` | `/metrics` | Métricas de performance | No |
| `POST` | `/list` | Listar skills disponibles | No |
| `POST` | `/validate` | Validar request schemas | No |

### Endpoints de Quality

| Método | Endpoint | Propósito |
|--------|----------|-----------|
| `POST` | `/api/qa/format-files` | Formatear archivos con Prettier |
| `POST` | `/api/qa/check-build` | Verificar build |
| `POST` | `/api/quality/lint` | Ejecutar ESLint |
| `POST` | `/api/quality/format-single` | Formatear un archivo |
| `POST` | `/api/quality/lint-single` | Lintear un archivo |
| `GET` | `/api/quality/stats` | Estadísticas de quality |
| `POST` | `/api/quality/setup-config` | Configurar quality tools |

### Endpoints de File Watcher

| Método | Endpoint | Propósito |
|--------|----------|-----------|
| `GET` | `/api/file-watcher/stats` | Estadísticas de file watching |
| `GET` | `/api/file-watcher/history` | Historial de cambios |
| `GET` | `/api/file-watcher/quality-config` | Configuración de quality |
| `POST` | `/api/file-watcher/quality-config` | Actualizar configuración |
| `POST` | `/api/file-watcher/quality-check` | Ejecutar quality check manual |

### Endpoints Adicionales

| Método | Endpoint | Propósito |
|--------|----------|-----------|
| `POST` | `/api/hooks/user-prompt-submit` | Hook de pre-invoke (legacy) |
| `POST` | `/api/commands/execute` | Ejecutar comandos |
| `GET` | `/api/skills` | Listar skills con metadata |
| `GET` | `/api/system-health` | Health check del sistema |
| `GET` | `/api/realtime-metrics` | Métricas en tiempo real |
| `GET` | `/api/cache/stats` | Estadísticas de cache |
| `POST` | `/api/cache/clear` | Limpiar cache |
| `GET` | `/api/errors/stats` | Estadísticas de errores |
| `GET` | `/api/errors/recent` | Errores recientes |
| `POST` | `/api/v1/auth/token` | Generar JWT token |
| `GET` | `/debug/signals` | Debug de signals |

---

## 🔍 Análisis de `/activate`

**Endpoint**: `POST /activate`  
**Auth**: API Key o JWT (opcional, configurable)  
**Schema**: Validado con `activate.request.schema.json`

### Request Body

```typescript
{
  intent: string;                    // Prompt del usuario
  context: {
    files?: string[];               // Archivos abiertos
    activeFile?: string;           // Archivo activo
    activeFileContent?: string;   // Contenido (≤2KB)
    workingDirectory?: string;    // CWD
    editor?: string;               // Editor
    fileExtensions?: string[];     // Extensiones
    projectType?: string;         // Tipo de proyecto
    requestTime?: number;          // Timestamp
  };
  options?: {
    threshold?: number;            // Umbral (default 0.6)
    maxResults?: number;          // Max resultados (default 5)
    includeSignals?: boolean;    // Procesar señales
    includeMetadata?: boolean;   // Incluir metadata
    signalWeights?: {             // Pesos personalizados
      keywords?: number;
      intent?: number;
      path?: number;
      content?: number;
    };
  };
}
```

### Response

```typescript
{
  success: boolean;
  timestamp: string;
  results: Array<{
    skillId: string;
    score: number;                 // Score calculado (0-1)
    reason: string;                // Razón de activación
    confidence: number;            // Confianza (alias de score)
    signals?: {                   // Señales procesadas
      keywords: number;           // Score de keywords (0-1)
      intent: number;            // Score de intent (0-1)
      path: number;              // Score de path (0-1)
      content: number;          // Score de content (0-1)
      matched: string[];        // Patterns que hicieron match
    };
    metadata?: any;              // Metadata adicional
  }>;
  signals?: {                    // Señales globales
    keywords: number;
    intent: number;
    path: number;
    content: number;
    matched: string[];
  };
  cache?: {                     // Info de cache
    hit: boolean;
    age?: number;               // Edad en ms si fue cache hit
  };
  latency_ms: number;           // Latencia de procesamiento
}
```

### Flujo de Ejecución

1. **Validación**: Schema validation con Ajv
2. **Cache Check**: Busca en cache local y distribuido
3. **Carga Rules**: `loadSkillRulesCachedSync()` desde `configs/skill-rules.json`
4. **Compute Signals**: Calcula scores multi-señal
5. **Match Rules**: Filtra y ordena por score
6. **Apply Threshold**: Filtra por threshold (default 0.6)
7. **Cache Result**: Guarda resultado en cache
8. **Return**: Retorna resultados con metadata

### Sistema de Signals

```802:873:packages/daemon/src/app.ts
  function computeSignals(intentText: string, context: any, rules: any): {
    keywords: number; intent: number; path: number; content: number; matched: string[]
  } {
    const matched: string[] = [];
    const intent = (intentText || '').toLowerCase();
    const activeFile = String(context?.activeFile || '').toLowerCase();
    const content = String(context?.activeFileContent || '').toLowerCase();
    const files: string[] = Array.isArray(context?.files) ? context.files : [];

    const ruleEntries = Object.entries(rules) as Array<[string, any]>;

    // Keyword-based intent matching
    let kwHits = 0;
    let kwTotal = 0;
    for (const [, rule] of ruleEntries) {
      const kws: string[] = rule?.promptTriggers?.keywords || [];
      kwTotal += kws.length;
      for (const k of kws) {
        if (intent.includes(String(k).toLowerCase())) { kwHits++; matched.push(k); }
      }
    }
    const keywordsScore = kwTotal > 0 ? Math.min(1, kwHits / Math.max(1, kwTotal)) : 0;

    // Intent regex patterns
    let ipHits = 0; let ipTotal = 0;
    for (const [, rule] of ruleEntries) {
      const ips: string[] = rule?.promptTriggers?.intentPatterns || [];
      ipTotal += ips.length;
      for (const p of ips) {
        try {
          if (new RegExp(p, 'i').test(intent)) {
            ipHits++; matched.push(p);
          }
        } catch (error) {
          log.debug({ pattern: p, error: error instanceof Error ? error.message : String(error) }, 'Invalid regex pattern in intent triggers');
        }
      }
    }
    const intentScore = ipTotal > 0 ? Math.min(1, ipHits / Math.max(1, ipTotal)) : 0;

    // Path patterns against activeFile and files list
    let pathHits = 0; let pathTotal = 0;
    const allPaths = [activeFile, ...files.map(f => String(f).toLowerCase())].filter(Boolean);
    for (const [, rule] of ruleEntries) {
      const pps: string[] = rule?.fileTriggers?.pathPatterns || [];
      pathTotal += pps.length;
      for (const pat of pps) {
        const re = new RegExp(String(pat).replace(/\*\*/g, '.*').replace(/\*/g, '[^/]+'), 'i');
        if (allPaths.some(p => re.test(p))) { pathHits++; matched.push(pat); }
      }
    }
    const pathScore = pathTotal > 0 ? Math.min(1, pathHits / Math.max(1, pathTotal)) : 0;

    // Content patterns against activeFileContent
    let ctHits = 0; let ctTotal = 0;
    for (const [, rule] of ruleEntries) {
      const cps: string[] = rule?.fileTriggers?.contentPatterns || [];
      ctTotal += cps.length;
      for (const cp of cps) {
        try {
          if (content && new RegExp(cp, 'i').test(content)) {
            ctHits++; matched.push(cp);
          }
        } catch (error) {
          log.debug({ pattern: cp, error: error instanceof Error ? error.message : String(error) }, 'Invalid regex pattern in content triggers');
        }
      }
    }
    const contentScore = ctTotal > 0 ? Math.min(1, ctHits / Math.max(1, ctTotal)) : 0;

    return { keywords: keywordsScore, intent: intentScore, path: pathScore, content: contentScore, matched };
  }
```

**Weights Default**:
- Keywords: 0.25 (25%)
- Intent: 0.25 (25%)
- Path: 0.25 (25%)
- Content: 0.25 (25%)

**Configuración**: Variables de entorno `SF_W_KEYWORDS`, `SF_W_INTENT`, `SF_W_PATH`, `SF_W_CONTENT`

---

## 🔍 Análisis de `/execute`

**Endpoint**: `POST /execute`  
**Auth**: API Key o JWT (opcional)  
**Schema**: Validado con `execute.request.schema.json`

### Propósito

Ejecuta un skill con confirmación y validación de políticas de seguridad.

**Estado**: Endpoint existe pero funcionalidad limitada (requiere integración con sistema de confirmación)

---

## 🔍 Análisis de Quality Service

**Archivo**: `packages/daemon/src/qualityService.ts`  
**Clase**: `QualityService`

### Métodos Disponibles

```typescript
class QualityService {
  async formatFiles(files: string[]): Promise<QualityResult>
  async lintFiles(files: string[]): Promise<QualityResult>
  async formatSingleFile(filePath: string): Promise<QualityResult>
  async lintSingleFile(filePath: string): Promise<QualityResult>
  async checkBuild(): Promise<QualityResult>
}
```

### Características

1. **Prettier Integration**: Formateo de archivos
2. **ESLint Integration**: Linting de código
3. **Configurable**: Configuración vía `.prettierrc` y `.eslintrc.json`
4. **Real-time**: Soporte para file watcher

### Gaps Identificados

- **No usado en stop hook**: Router ejecuta Prettier directamente, no usa daemon
- **No integrado con router**: Router no consulta `/api/quality/*` endpoints
- **No usado para ESLint**: Router no ejecuta ESLint en absoluto

---

## 🔍 Análisis de File Watcher

**Archivo**: `packages/daemon/src/fileWatcher.ts`  
**Clase**: `FileWatcherService`

### Características

1. **Chokidar Integration**: Monitoreo de cambios de archivos
2. **WebSocket**: Broadcasting de cambios en tiempo real
3. **Quality Integration**: Auto-format y auto-lint opcional
4. **Categories**: Clasificación de archivos (skill, config, code, docs, other)

### Configuración

```typescript
interface FileWatcherConfig {
  watchPaths: string[];              // Rutas a monitorear
  ignored: string[];                 // Patterns a ignorar
  categories: { [key: string]: string[] }; // Categorías
  qualityCheck: {
    enabled: boolean;                 // Quality checks automáticos
    autoFormat: boolean;             // Auto-formateo
    autoLint: boolean;               // Auto-linting
    fileTypes: string[];             // Tipos de archivo
    debounceMs: number;              // Debounce (default 10s)
  };
}
```

### Gaps Identificados

- **No integrado con stop hook**: File watcher no se usa en pipeline de post-hook
- **WebSocket no usado**: Router no consume WebSocket del file watcher
- **Calidad deshabilitada por default**: `enabled: false`

---

## 🔗 Integración con Router

### Comunicación Router → Daemon

**Pre-Invoke Hook**:
```
Router (pre-invoke.ts)
  │
  └─► HTTP POST daemon/activate
       │
       ├─► Cache check (local + distribuido)
       ├─► Load rules (skill-rules.json)
       ├─► Compute signals (multi-señal)
       ├─► Match rules (scoring)
       └─► Return: results + signals + metadata
```

**Stop Hook**:
```
❌ NO HAY COMUNICACIÓN
Router ejecuta Prettier y TypeCheck directamente
No consulta /api/quality/* endpoints del daemon
```

### Gaps de Integración

1. **Stop Hook no usa daemon**: Router ejecuta Prettier/TypeCheck localmente, no consulta daemon
2. **Quality Service no usado**: Daemon tiene quality service pero router no lo usa
3. **File Watcher no integrado**: Router no consume eventos del file watcher
4. **ESLint gap**: Daemon tiene ESLint pero router no ejecuta ESLint

---

## 💾 Sistema de Cache

### Cache Local (Memoria)

```typescript
const actCache = new Map<string, ActRecord>();
const TTL_MS = 60000; // 60 segundos
const MAX_CACHE_SIZE = 1000;
```

**Características**:
- LRU eviction cuando alcanza `MAX_CACHE_SIZE`
- Eviction del 25% más antiguo cuando está lleno
- Cleanup automático cada 30s (configurable)

### Cache Distribuido (Redis Opcional)

```typescript
const actState: KVState<ActRecord> = await createDistributedState<ActRecord>('sf:act', {
  ttlSec: Math.floor(TTL_MS / 1000)
});
```

**Activación**: `SF_STATE_REDIS=1`

**Características**:
- Cache compartido entre instancias de daemon
- TTL sincronizado con cache local
- Fallback silencioso si Redis no está disponible

### Estadísticas de Cache

```typescript
interface CacheStats {
  size: number;           // Entradas actuales
  hits: number;          // Cache hits
  misses: number;       // Cache misses
  evictions: number;    // Entradas evictadas
  hitRate: number;      // Porcentaje de hit rate
}
```

---

## 🏥 Health Checks y Métricas

### Endpoint `/health`

**Respuesta**:
```typescript
{
  status: 'healthy' | 'degraded' | 'critical',
  timestamp: string,
  uptime: number,
  healthIssues?: string[],
  services: {
    database: {
      status: 'healthy' | 'unhealthy' | 'not_configured',
      error?: string,
      url?: string
    },
    cache: {
      status: 'healthy' | 'warning' | 'critical',
      size: number,
      maxSize: number,
      hits: number,
      misses: number,
      evictions: number,
      hitRate: string,
      memoryUsage: number,
      memoryUsagePercent: number,
      ttl: number
    },
    signals: {
      weights: {
        keywords: number,
        intent: number,
        path: number,
        content: number
      },
      defaultThreshold: number
    },
    rules: {
      usingSharedLoader: boolean,
      cache: {
        path: string,
        mtimeMs: number
      } | null
    },
    schemas: {
      status: string,
      loaded: number
    }
  },
  metrics: {
    totalActivations: number,
    averageLatency: number,
    cacheSize: number,
    requestsProcessed: number
  },
  system: {
    uptime: number,
    version: string,
    environment: string,
    memoryUsage: object,
    cpuUsage: object,
    nodeVersion: string,
    pid: number
  }
}
```

### Endpoint `/metrics`

Retorna métricas agregadas de performance y uso.

---

## 📝 Resumen de Gaps Identificados

### P0 (Crítico)

1. **Stop Hook no usa daemon**: Router ejecuta Prettier/TypeCheck localmente
2. **ESLint no ejecutado**: Router no ejecuta ESLint en absoluto
3. **Quality Service no integrado**: Daemon tiene quality service pero no se usa desde router

### P1 (Importante)

4. **File Watcher no usado**: Router no consume eventos del file watcher
5. **Cache no compartido**: Router tiene su propio cache, no comparte con daemon

### P2 (Mejoras Futuras)

6. **WebSocket integration**: Router podría suscribirse a cambios vía WebSocket
7. **Quality checks distribuidas**: Usar daemon para quality checks pesadas

---

**Última actualización**: 2025-11-01  
**Siguiente**: Análisis de skill-rules.json

