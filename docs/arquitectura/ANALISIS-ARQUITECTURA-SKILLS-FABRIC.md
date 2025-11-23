# Análisis Arquitectura Skills Fabric

**Fecha de Análisis:** 2025-01-27  
**Versión del Sistema:** 2.0.0  
**Estado:** Completo y Operacional

---

## Resumen Ejecutivo

**Skills Fabric** es un monorepo que implementa la metodología CLOOP (Context, Learning, Options, Outcomes, Planning) para automatización de desarrollo. Proporciona un sistema de activación de skills agnóstico al editor con quality gates, dev-docs estructurados y monitoreo en tiempo real.

### Métricas Clave del Sistema

- **33 skills indexados** (28 validados en modo estricto)
- **20/20 tests pasando** (100% éxito)
- **91% reducción de latencia** (5163ms → 466ms promedio)
- **93.5% tasa de adherencia** a skills activados
- **138 tests** en framework PBv2 (90.4% success rate)

---

## 1. Arquitectura Multi-Servicio

### Diagrama de Flujo

```
┌─────────────┐
│   CLI       │
│ (skills-cli)│
└──────┬──────┘
       │
       ▼
┌─────────────┐      ┌─────────────┐
│   Router    │─────▶│   Daemon    │
│  (Port 3000)│      │ (Port 7727) │
└──────┬──────┘      └──────┬──────┘
       │                     │
       │                     ▼
       │            ┌─────────────────┐
       │            │ Service Discovery│
       └───────────▶│   (Port 8877)   │
                    └─────────────────┘
```

### Servicios Principales

| Servicio | Puerto | Propósito | Dependencias |
|----------|--------|-----------|--------------|
| `@skills-fabrik/skills-cli` | N/A | CLI interface, gestión de skills | Router |
| `@skills-fabrik/router` | 3000 | Pre-invoke/stop hooks, motor de activación | Daemon |
| `@skills-fabrik/daemon` | 7727 | Core execution service, REST API | PostgreSQL (opcional) |
| `@skills-fabrik/shared` | 8877 | Service discovery, health checking | None |

### Comunicación entre Servicios

- **Router → Daemon**: HTTP REST API con circuit breaker y retry logic
- **Service Discovery**: Registry centralizado para descubrimiento de servicios
- **Cache Compartido**: Redis para cache compartido entre Router y Daemon

---

## 2. Sistema de Skills

### Estructura de un Skill

Cada skill sigue la estructura:

```
skills/<category>/<skill-id>/
├── SKILL.md          # ≤400 líneas, YAML frontmatter obligatorio
├── resources/        # Recursos on-demand
│   ├── reference.md
│   ├── examples.md
│   └── checklist.md
└── scripts/          # Scripts ejecutables en sandbox
    └── validate.sh
```

### Organización por Categorías

- **`skills/guidelines/`**: Mejores prácticas de desarrollo
  - `backend-dev-guidelines`, `frontend-dev-guidelines`, etc.
- **`skills/guardrails/`**: Verificaciones de seguridad
  - `database-verification`, `secrets-and-config`, etc.
- **`skills/workflows/`**: Automatización CLOOP
- **`skills/generators/`**: Generación de planes y tests
- **`skills/test/`**: Skills de testing
  - `cli-integration`, `visual-regression`, `webapp`
- **`skills/quality/`**: Calidad de código
- **`skills/security/`**: Testing de seguridad
- **`skills/performance/`**: Optimización de performance
- **`skills/data/`**: Gestión de base de datos

### Configuración de Activación

**Archivo:** `configs/skill-rules.json`

Estructura de reglas de activación:

```json
{
  "skill-id": {
    "enforcement": "block|require|warn|suggest",
    "priority": "high|medium|low",
    "promptTriggers": {
      "keywords": ["keyword1", "keyword2"],
      "intentPatterns": ["regex pattern"]
    },
    "fileTriggers": {
      "pathPatterns": ["**/*.ts", "**/routes/**"],
      "contentPatterns": ["import.*express", "class.*Controller"]
    },
    "resources": ["resources/reference.md"]
  }
}
```

**Archivo:** `registry/index.json`

Metadatos compilados de todos los skills indexados.

---

## 3. Motor de Activación

### Ubicación

`packages/router/src/detectors.ts`

### Heurística Multi-Señal

El motor combina múltiples señales con pesos específicos:

| Señal | Peso | Descripción |
|-------|------|-------------|
| **Keywords (exact)** | 20% | Coincidencia exacta de palabras clave |
| **Keywords (fuzzy)** | 15% | Coincidencia aproximada con Jaro-Winkler |
| **Intent regex** | 30% | Patrones regex en el prompt |
| **Path glob** | 30% | Coincidencia de rutas de archivos |
| **Content patterns** | 20% | Patrones en contenido de archivos |

### Fuzzy Matching Engine

**Algoritmo:** Jaro-Winkler similarity

**Características:**
- Cache LRU para optimización (max 1000 entradas)
- Threshold configurable (default: 0.7)
- Optimización para strings cortos (< 3 caracteres)

**Implementación:**
```typescript
function fuzzyScore(text: string, pattern: string): number {
  // 1. Check cache
  // 2. Exact match optimization
  // 3. Short string optimization
  // 4. Jaro-Winkler calculation
  // 5. Cache result
}
```

### Contextual Boost System v2.0

Sistema de refuerzo contextual que mejora la precisión de activación:

| Boost Type | Factor | Descripción |
|------------|--------|-------------|
| **File context** | 0.15 | Coincidencia con archivo activo |
| **Recent activation** | 0.10 | Activación reciente del skill |
| **Keyword density** | 0.05 | Densidad de keywords en prompt |
| **Intent match** | 0.12 | Match mejorado de intent |

**Historial de Activaciones:**
- LRU cache con tamaño máximo de 50 entradas
- Decay exponencial basado en tiempo (5 minutos threshold)
- Tracking por skill ID y contexto

### Threshold Dinámico por Enforcement

El threshold de activación se ajusta según el nivel de enforcement:

| Enforcement | Threshold | Uso |
|-------------|-----------|-----|
| `block` | 0.2 | Guardrails críticos, alta sensibilidad |
| `require` | 0.4 | Skills obligatorios, media sensibilidad |
| `warn` | 0.5 | Advertencias |
| `suggest` | 0.6 | Recomendaciones (threshold original) |

---

## 4. Hooks de Cursor IDE

### Configuración

**Archivo:** `.cursor/hooks/hooks-config.json`

Sistema PBv2 Hook con pipeline de 3 etapas:
1. `plan-detector` → Detecta planes CLOOP
2. `pbv2-activator` → Genera prompts optimizados
3. `pbv2-integration` → Integra con sistema

### userPromptSubmit Hook (Pre-invoke)

**Ubicación:** `packages/router/src/pre-invoke.ts`  
**Script Hook:** `.cursor/hooks/userPromptSubmit.mjs`

#### Funcionalidad

1. **Detección de Slash Commands** (prioridad más alta)
   - Detecta comandos como `/dev-docs`, `/build-and-fix`, etc.
   - Retorna inmediatamente si se detecta un slash command

2. **Planning Mode Gate**
   - Verifica si planning mode está habilitado
   - Requiere plan aprobado antes de continuar
   - Bloquea ejecución si no hay plan aprobado

3. **Activación de Skills**
   - Carga reglas desde `configs/skill-rules.json`
   - Ejecuta matching multi-señal
   - Aplica contextual boosts
   - Genera nota inyectada con skills activados

4. **Integración con Daemon**
   - Circuit breaker para resiliencia
   - LRU cache (TTL 60s, max 100 entradas)
   - Health checker con monitoreo continuo
   - Retry con exponential backoff
   - Service discovery para routing

#### Parámetros de Configuración

```json
{
  "userPromptSubmit": {
    "enabled": true,
    "threshold": 0.45,
    "maxSkills": 7,
    "fuzzyMatch": true,
    "fuzzyThreshold": 0.7,
    "contextualBoost": true,
    "historyReuse": true,
    "historySize": 50
  }
}
```

#### Output

```typescript
{
  injectedNote?: string;  // Nota a inyectar en contexto
  activated: string[];     // Array de skill IDs activados
  metadata: {
    scores: Record<string, number>;
    reasons: Record<string, string[]>;
    contextualBoosts?: Record<string, Record<string, number>>;
  };
  blocked?: boolean;
  blockReason?: string;
}
```

### stop Hook (Post-response)

**Ubicación:** `packages/router/src/stop.ts`  
**Script Hook:** `scripts/hooks/stop.mjs`

#### Pipeline Completo (14 Pasos)

1. **Git Clean Check**
   - Verifica estado inicial del repositorio
   - Informa si hay cambios preexistentes (no bloquea)

2. **File Watcher Integration**
   - Conecta con daemon para eventos en tiempo real
   - Cache compartido (30s TTL)
   - Estadísticas de cambios monitoreados

3. **Guardrails**
   - Verificación multi-nivel de seguridad
   - **BLOCK** si hay violaciones críticas
   - Niveles: BLOCK, WARN, SUGGEST, REQUIRE

4. **Bash Command Security Validation**
   - Extrae comandos bash de archivos editados
   - Valida con `scripts/hooks/bash-validator.py`
   - **BLOCK** si detecta comandos peligrosos

5. **ESLint vía Daemon**
   - Quality service con cache compartido (5min TTL)
   - Endpoint: `POST /api/quality/lint`
   - Cache hit tracking

6. **Build Check vía Daemon**
   - QA service (BLOCK si falla)
   - Endpoint: `POST /api/qa/check-build`
   - Cache solo para builds exitosos (2min TTL)

7. **Prettier**
   - Formatea archivos editados
   - Filtrado por extensión soportada
   - Extensiones: `.js`, `.jsx`, `.ts`, `.tsx`, `.json`, `.md`, `.css`, etc.

8. **TypeCheck**
   - Verificación por repo afectado
   - Ejecuta `tsc --noEmit` por repositorio
   - Conteo de errores TypeScript

9. **Error Hints**
   - Sugerencias si hay 1-4 errores
   - Extrae primeros errores como hints
   - Recordatorios de mejores prácticas

10. **Auto-resolver**
    - Resuelve automáticamente si ≥5 errores
    - 6 patrones soportados:
      - TS2307: Cannot find module (agrega .js)
      - TS2532: Object possibly undefined (agrega !)
      - TS2322: Type not assignable (agrega `as any`)
      - TS2688: Cannot find type definition (sugiere @types)
      - TS1192: No default export (convierte a named import)
      - TS7016: No declaration for module (agrega .js)

11. **Advanced Quality Gates**
    - Validación específica por tipo de proyecto
    - Detecta tipo: React, Node, Python, TypeScript, Next.js, Express
    - Score de calidad (0-100)
    - Gates pasados/fallidos
    - Recomendaciones de mejora

12. **NMLB (No-Mess-Left-Behind)**
    - Verificación final de estado del repo
    - **BLOCK** si hay cambios staged/modified/deleted
    - Verifica también stash entries
    - Mensaje detallado de estado

13. **Emit KPIs**
    - Registra evento en `obs/kpi/events.jsonl`
    - Métricas: errors_ts, auto_resolver_used, latency_ms, zero_errors_left_behind

14. **Notificaciones**
    - Cross-platform (macOS, Linux, Windows)
    - Tipos: success, warning, error, info
    - Script: `scripts/hooks/notify.sh`

#### Métricas de Performance

El pipeline trackea métricas detalladas:

```typescript
interface PipelineMetrics {
  startTime: number;
  totalDuration?: number;
  steps: Map<string, StepMetrics>;
  cacheHits: number;
  cacheMisses: number;
  errors: number;
  warnings: number;
  stepMetrics: StepMetrics[];
  averageStepDuration: number;
  slowestStep?: { name: string; duration: number };
  fastestStep?: { name: string; duration: number };
}
```

**Cache Performance:**
- ESLint: cache compartido (5min TTL)
- Build Check: cache solo éxitos (2min TTL)
- File Watcher: cache stats (30s TTL)

---

## 5. Router Service

**Puerto:** 3000  
**Framework:** Fastify  
**Lenguaje:** TypeScript + ESM

### Responsabilidades

1. **Pre-invoke Hook**: Activación de skills antes del prompt
2. **Stop Hook**: Pipeline de calidad post-respuesta
3. **Guardrails**: Validación multi-nivel
4. **Integración con Daemon**: Activación mejorada con signal processing

### Endpoints HTTP

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/health` | Health check con estado de dependencias |
| `POST` | `/pre-invoke` | Hook pre-invocación |
| `POST` | `/stop` | Hook post-respuesta |
| `GET` | `/rules` | Obtener reglas de activación |
| `POST` | `/match-rules` | Matching de reglas |
| `POST` | `/guardrails` | Verificación de guardrails |

### Características Técnicas

- **Service Discovery**: Integración con servicio de descubrimiento
- **Circuit Breaker**: Resiliencia ante fallos del daemon
- **Retry Logic**: Exponential backoff para reintentos
- **Cache Compartido**: Redis para cache entre Router y Daemon
- **Health Checking**: Monitoreo continuo del daemon
- **Structured Logging**: Logs JSON estructurados

### Configuración

Variables de entorno:

```bash
PORT=3000
HOST=127.0.0.1
DAEMON_URL=http://127.0.0.1:7727
ROUTER_DISCOVERY=1
DISCOVERY_URL=http://127.0.0.1:8877
SKILL_ACTIVATION_THRESHOLD=0.45
MAX_SKILLS_PER_REQUEST=7
```

---

## 6. Daemon Service

**Puerto:** 7727  
**Framework:** Fastify  
**Lenguaje:** TypeScript + ESM

### Responsabilidades Principales

1. **Core Execution Service**: Ejecución de skills con REST API
2. **Activación Mejorada**: Signal processing para mejor matching
3. **Quality Service**: ESLint y build checks
4. **File Watcher Service**: Monitoreo de cambios en tiempo real
5. **Distributed State**: Gestión de estado distribuido
6. **Event Store**: Persistencia de eventos para auditoría
7. **Real-time Dashboard**: Dashboard en tiempo real (puerto 8888)

### Arquitectura Técnica

#### Middleware y Seguridad

- **Rate Limiting**: 100 req/min (configurable)
- **CORS**: Configurado para cross-origin requests
- **HTTP Compression**: gzip/deflate (threshold 1KB)
- **JWT Authentication**: Autenticación con tokens
- **API Key Auth**: Middleware de autenticación por API key

#### Resiliencia

- **Circuit Breakers**: Por operación (pg:connect, activate, etc.)
- **Retry Logic**: Exponential backoff con jitter
- **Health Checks**: Endpoints de health check
- **Graceful Shutdown**: Manejo de señales SIGTERM/SIGINT

#### Persistencia

- **PostgreSQL** (opcional): Base de datos principal
  - Tablas: `sf_events`, `sf_activations`, `sf_executions`
  - Connection pooling (max 5 conexiones)
- **Redis** (opcional): Distributed state y cache
  - Keys: `sf:state:*`, `sf:cache:*`
- **File System**: Event store en `obs/kpi/events.jsonl`

#### Observabilidad

- **OpenTelemetry**: Tracing distribuido
- **Prometheus Metrics**: Endpoint `/metrics`
- **Structured Logging**: Logs JSON con contexto
- **Event Store**: Auditoría completa de operaciones

### Endpoints Principales

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/activate` | Activación de skills con signal processing |
| `POST` | `/api/quality/lint` | ESLint vía quality service |
| `POST` | `/api/qa/check-build` | Build check |
| `GET` | `/api/file-watcher/stats` | Estadísticas de file watcher |
| `GET` | `/api/file-watcher/history` | Historial de cambios |
| `GET` | `/health` | Health check |
| `GET` | `/metrics` | Métricas Prometheus |

### Características Avanzadas

#### Sandbox Execution

- Ejecución segura de scripts de skills
- Aislamiento de procesos
- Control de recursos (CPU, memoria)

#### Policy Levels (S1-S4)

Sistema de niveles de política para control de acceso:

- **S1**: Operaciones básicas (read-only)
- **S2**: Operaciones estándar (read + write local)
- **S3**: Operaciones avanzadas (network, file system)
- **S4**: Operaciones críticas (system, admin)

#### Event Store

Persistencia de eventos para auditoría:

```typescript
interface ActivationEvent {
  id: string;
  timestamp: string;
  skillId: string;
  intent: string;
  context: object;
  result: object;
}

interface ExecuteEvent {
  id: string;
  timestamp: string;
  skillId: string;
  tool: string;
  input: object;
  output: object;
  policyLevel: string;
}
```

#### Real-time Dashboard

- **HTTP**: http://localhost:8888
- **WebSocket**: ws://localhost:8889 (updates en tiempo real)
- Métricas en vivo
- Estado de servicios
- Historial de activaciones

---

## 7. Gestión con PM2

### Configuración

**Archivo:** `scripts/pm2/ecosystem.config.cjs`

### Servicios Gestionados

#### 1. sf-daemon

```javascript
{
  name: 'sf-daemon',
  port: 7727,
  instances: 1, // o 'max' si PM2_CLUSTER=1
  exec_mode: 'fork', // o 'cluster'
  autorestart: true,
  max_memory_restart: '400M',
  health_check_url: 'http://127.0.0.1:7727/health',
  health_check_interval: 5000
}
```

#### 2. router-service

```javascript
{
  name: 'router-service',
  port: 3000,
  dependencies: ['sf-daemon'],
  wait_ready: true,
  listen_timeout: 10000,
  max_memory_restart: '500M'
}
```

#### 3. service-discovery

```javascript
{
  name: 'service-discovery',
  port: 8877,
  max_memory_restart: '200M',
  health_check_interval: 10000
}
```

#### 4. skills-cli-service

```javascript
{
  name: 'skills-cli-service',
  autorestart: false, // Manual start
  max_memory_restart: '300M'
}
```

### Comandos PM2

```bash
# Iniciar todos los servicios
pm2 start scripts/pm2/ecosystem.config.cjs --env development

# Servicios individuales
pm2 start scripts/pm2/ecosystem.config.cjs --only sf-daemon --env development
pm2 start scripts/pm2/ecosystem.config.cjs --only router-service --env development
pm2 start scripts/pm2/ecosystem.config.cjs --only service-discovery --env development

# Monitoreo
pm2 status
pm2 monit
pm2 logs <service-name> --lines 200

# Reiniciar
pm2 restart <service-name>
pm2 restart all

# Detener
pm2 stop <service-name>
pm2 delete <service-name>
```

### Troubleshooting

**Servicios stuck en "waiting":**
```bash
pm2 delete <service-name>
pm2 start scripts/pm2/ecosystem.config.cjs --only <service-name> --env development
```

**CORS errors:**
- Usa `@fastify/cors ^8.4.0` para Fastify 4.x
- Para Fastify 5.x, upgrade a `@fastify/cors ^11`

**Restart con nuevo environment:**
```bash
pm2 restart <service-name> --update-env
```

---

## 8. MemTech (Multi-Tier Storage)

Sistema de almacenamiento jerárquico con 4 niveles:

### L0 (Local)

- **Ubicación:** `.sf/` directory
- **Propósito:** Acceso inmediato, datos runtime
- **Características:** File system local, sin latencia de red

### L1 (Cache)

- **Ubicación:** `.sf/cache/`
- **Propósito:** Capa de optimización de performance
- **Características:** Cache local con TTL configurable

### L2 (Persistent)

- **Tecnología:** PostgreSQL
- **Propósito:** Base de datos principal
- **Tablas:**
  - `sf_events`: Eventos del sistema
  - `sf_activations`: Historial de activaciones
  - `sf_executions`: Ejecuciones de skills
- **Configuración:** Opcional (requiere `PG_HOST`)

### L3 (Optional)

- **Tecnologías:** Redis / ChromaDB
- **Propósito:** Cache avanzado y búsqueda semántica
- **Estado:** Deshabilitado por defecto
- **Configuración:** Requiere `REDIS_URL` o `CHROMADB_URL`

---

## 9. Quality Gates (G1-G8)

### Clasificación por Prioridad

#### P0 (Critical) - Bloquean Merge

- **G1 - Build Check**: Verificación de compilación
- **G2 - Activation**: Verificación de activación de skills
- **G3 - Guardrails**: Verificación de guardrails críticos

#### P1 (High) - No Bloquean

- **G4 - Notifications**: Sistema de notificaciones
- **G5 - Content Health**: Salud del contenido generado

#### P2 (Medium) - Opcionales

- **G6 - Documentation**: Verificación de documentación
- **G7 - Optional Checks**: Checks opcionales
- **G8 - Performance**: Métricas de performance

### Niveles de Enforcement

| Nivel | Descripción | Ejemplo |
|-------|-------------|---------|
| **BLOCK** | Patrones críticos, bloquea ejecución | `deleteMany()` sin `where` |
| **WARN** | Patrones de alto riesgo, alerta | `updateMany()` sin `where` |
| **SUGGEST** | Mejores prácticas, sugiere | Uso de try/catch |
| **REQUIRE** | Checks obligatorios | Validación de tipos |

### Ejecución de Quality Gates

```bash
# Ejecutar todos los gates
pnpm gates

# Gates individuales
pnpm -w build                        # G1 - Build
pnpm test:activation-cases          # G2 - Activation
skills-cli guardrail "query"         # G3 - Guardrails
```

---

## 10. Prompt Builder v2

### Estructura de 8 Componentes

1. **TAGs System**: Tags contextuales automáticos
   - `[K]`: Knowledge (conocimiento)
   - `[C]`: Context (contexto)
   - `[U]`: User Intent (intención del usuario)
   - `[EVIDENCIA]`: Evidencia
   - `[PROPUESTA]`: Propuesta

2. **Template Coverage**: 100% templates estructurados

3. **Quality Scoring**: Scores esperados (0.2-0.4 típico)

### Pipeline de 3 Etapas

```
1. plan-detector
   ↓
   Detecta planes CLOOP via patrones
   ↓
2. pbv2-activator
   ↓
   Genera prompts optimizados con TAGs
   ↓
3. pbv2-integration
   ↓
   Integra con sistema de skills
```

### Modos de Operación

| Modo | Descripción | Default |
|------|-------------|---------|
| **logOnly** | Solo detecta y guarda, sin mostrar UI | ✅ |
| **onDemand** | Pregunta al usuario antes de activar | ❌ |
| **auto** | Activa automáticamente (power users) | ❌ |

### Configuración

```json
{
  "pbv2Activator": {
    "enabled": true,
    "defaultComplexity": "medium",
    "includeFiles": "auto",
    "includeTemplate": true,
    "includeTags": true,
    "timeoutMs": 5000,
    "modes": {
      "logOnly": { "default": true },
      "onDemand": { "default": false },
      "auto": { "default": false }
    }
  }
}
```

---

## 11. Testing Framework

### Estadísticas

- **Total Tests**: 138
- **Success Rate**: 90.4%
- **Security Tests**: 10 passed

### Suites de Testing

1. **plan-detector-edge-tests.mjs**: Tests de edge cases para detección de planes
2. **pbv2-activator-unit-tests.mjs**: Tests unitarios del activador
3. **config-loader-unit-tests.mjs**: Tests del cargador de configuración
4. **integration-tests.mjs**: Tests de integración end-to-end
5. **pbv2-load-tests.mjs**: Tests de carga y performance
6. **pbv2-robustness-tests.mjs**: Tests de robustez y resiliencia
7. **pbv2-security-tests.mjs**: Tests de seguridad
8. **pbv2-claude-integration-tests.mjs**: Tests de integración con Claude

### Ejecución

```bash
# Todos los tests
pnpm test

# Suites específicas
pnpm test:phase1          # Validación básica
pnpm test:phase2         # Tests de integración
pnpm test:phase3         # Tests completos del sistema
pnpm test:phase3-quick   # Validación rápida
```

---

## 12. Observabilidad

### KPIs Tracking

| Métrica | Valor Actual | Objetivo |
|---------|--------------|----------|
| **Latency Reduction** | 91% (5163ms → 466ms) | < 500ms |
| **Activation Success Rate** | 93.5% | > 90% |
| **Test Coverage** | 100% (20/20 passing) | 100% |
| **Skill Index** | 33 skills (28 validated) | - |

### Métricas Disponibles

#### Prometheus Metrics

- **Endpoint**: `GET /metrics` (daemon)
- **Métricas**:
  - `sf_activations_total`: Total de activaciones
  - `sf_activations_duration_ms`: Duración de activaciones
  - `sf_executions_total`: Total de ejecuciones
  - `sf_cache_hits_total`: Cache hits
  - `sf_cache_misses_total`: Cache misses
  - `sf_errors_total`: Total de errores

#### OpenTelemetry Tracing

- **Distributed Tracing**: Traces entre servicios
- **Spans**: Por operación (activate, execute, etc.)
- **Context Propagation**: Headers de tracing

#### Structured Logging

- **Formato**: JSON
- **Campos**: timestamp, level, service, message, context
- **Output**: Console + File (`logs/*.log`)

#### Event Store

- **Ubicación**: `obs/kpi/events.jsonl`
- **Formato**: JSON Lines
- **Eventos**: Activaciones, ejecuciones, errores, métricas

### Dashboard

- **HTTP**: http://localhost:8888
- **WebSocket**: ws://localhost:8889 (updates en tiempo real)
- **Métricas**: En vivo, histórico, tendencias
- **Estado de Servicios**: Health checks, uptime
- **Historial**: Activaciones recientes, ejecuciones

---

## 13. Flujo de Activación Completo

### Ejemplo de Flujo End-to-End

1. **Usuario escribe prompt en Cursor**
   ```
   "crear un endpoint nuevo para usuarios"
   ```

2. **userPromptSubmit Hook se ejecuta**
   - Analiza prompt y archivos abiertos
   - Carga reglas desde `configs/skill-rules.json`
   - Ejecuta matching multi-señal
   - Aplica contextual boosts
   - Llama a daemon para activación mejorada

3. **Daemon procesa activación**
   - Signal processing avanzado
   - Retorna skills relevantes con scores
   - Router mergea resultados

4. **Nota inyectada en contexto**
   ```
   🎯 SKILL ACTIVATION CHECK (v2.0 - CLOOP Optimized):
   
   ● backend-dev-guidelines (suggest/high) → threshold: 0.6
     → reason: keywords: 2 exact match(es), intent: 1 pattern(s) matched
     → contextual-boost: [file:+0.120, intent:+0.080]
   ```

5. **Claude procesa con skills activados**
   - Carga `SKILL.md` de skills activados
   - Usa recursos on-demand según referencias
   - Genera código siguiendo guidelines

6. **stop Hook se ejecuta**
   - Pipeline completo de calidad (14 pasos)
   - Guardrails, ESLint, Build, Prettier, TypeCheck
   - Auto-resolver si hay errores
   - NMLB check final
   - Emit KPIs

7. **Resultado**
   - Código generado con calidad garantizada
   - Zero errors left behind
   - Métricas registradas
   - Notificación al usuario

---

## 14. Configuración y Variables de Entorno

### Variables Clave

#### Database

```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/skills_fabrik
DB_HOST=localhost
DB_PORT=5432
DB_NAME=skills_fabrik
```

#### Service Ports

```bash
DAEMON_PORT=7727
ROUTER_PORT=3000
DISCOVERY_PORT=8877
```

#### Optional Services

```bash
REDIS_URL=redis://localhost:6379
CHROMADB_URL=http://localhost:8000
```

#### Dashboard

```bash
SF_DASHBOARD_ENABLED=true
SF_DASHBOARD_PORT=8888
```

#### Development Settings

```bash
NODE_ENV=development
LOG_LEVEL=info
SF_USE_SHARED_RULES=1
SF_USE_SHARED_SIGNALS=1
```

#### Skill Activation

```bash
SKILL_ACTIVATION_THRESHOLD=0.45
MAX_SKILLS_PER_REQUEST=7
FUZZY_MATCH_THRESHOLD=0.7
```

#### Daemon Configuration

```bash
DAEMON_RATE_LIMIT_MAX=100
DAEMON_RATE_LIMIT_WINDOW=1 minute
CORS_ORIGIN=*
DAEMON_TIMEOUT=5000
DAEMON_MAX_RETRIES=2
DAEMON_RETRY_DELAY=500
```

#### Circuit Breaker

```bash
CIRCUIT_BREAKER_FAILURE_THRESHOLD=5
CIRCUIT_BREAKER_SUCCESS_THRESHOLD=2
CIRCUIT_BREAKER_RESET_TIMEOUT=30000
```

---

## 15. Archivos de Configuración Clave

### Core Configuration Files

| Archivo | Propósito |
|---------|-----------|
| `configs/skill-rules.json` | Reglas de activación de skills |
| `registry/index.json` | Metadatos compilados de skills |
| `.cursor/hooks/hooks-config.json` | Configuración de hooks de Cursor |
| `scripts/pm2/ecosystem.config.cjs` | Configuración de PM2 |
| `configs/SKILL.template.md` | Template para crear nuevos skills |
| `configs/skill-rules.schema.json` | Schema de validación de skill-rules |

### Environment Templates

- `.env.example`: Template de variables de entorno
- `.env.development`: Configuración de desarrollo
- `.env.production`: Configuración de producción
- `.env.testing`: Configuración de testing

---

## 16. Comandos Útiles

### Setup & Build

```bash
# Setup inicial
pnpm install && pnpm -w build

# Instalación global del CLI (opcional)
pnpm --filter @skills-fabrik/skills-cli link --global

# Clean build
pnpm clean && pnpm -w build
```

### Development Workflow

```bash
# Dev mode (watch)
pnpm dev

# Validación rápida: build + lint + schema
pnpm test:phase3-quick

# Suite completa Phase 3
pnpm test:phase3

# Ejecutar todos los quality gates
pnpm gates
```

### Skill Management

```bash
# Validar skills
pnpm skills:lint

# Verificar activación para tarea
skills-cli skills check "implement auth" --v2

# Indexar skills
skills-cli skills index ./skills --out ./registry/index.json

# Pack/verify/install workflow
skills-cli skills pack skills/repo-auditor --out ./.registry
skills-cli skills verify ./.registry/repo-auditor-0.1.0.tgz
skills-cli skills install file://./.registry/repo-auditor-0.1.0.tgz --target ./.skills-installed
```

### Service Management

```bash
# Iniciar todos los servicios
pm2 start scripts/pm2/ecosystem.config.cjs --env development

# Ver estado
pm2 status

# Monitoreo
pm2 monit

# Logs
pm2 logs sf-daemon --lines 200
pm2 logs router-service --lines 200
```

### Monitoring & Debugging

```bash
# Health checks
curl http://127.0.0.1:7727/health  # Daemon
curl http://127.0.0.1:3000/health  # Router
curl http://127.0.0.1:8877/health  # Discovery

# Dashboard
skills-cli dashboard health
skills-cli dashboard status
skills-cli kpi --live

# Debug skill activation
skills-cli skills check "task" --v2 --debug --verbose
```

---

## 17. Troubleshooting

### Servicios No Inician

```bash
# Ver logs
pm2 logs <service-name> --lines 200

# Verificar puertos disponibles
lsof -i :7727  # Daemon
lsof -i :3000  # Router
lsof -i :8877  # Discovery

# Reinicio limpio
pm2 delete all
pm2 start scripts/pm2/ecosystem.config.cjs --env development
```

### Build Errors

```bash
# Clean rebuild
pnpm clean && pnpm -w build

# Verificar errores TypeScript
pnpm --filter @skills-fabrik/skills-cli build 2>&1 | grep -i error

# Verificar módulos ES
node packages/skills-cli/dist/index.js --version
```

### Skills No Se Activan

```bash
# Verificar índice
skills-cli skills index ./skills --out ./registry/index.json

# Verificar reglas
cat configs/skill-rules.json | jq '.skills[] | select(.id=="my-skill")'

# Test con debug
skills-cli skills check "test query" --v2 --debug --verbose

# Verificar integridad del registry
node -e "require('./registry/index.json'); console.log('✅ Registry valid')"
```

### Test Failures

```bash
# Ejecutar test específico
node --test packages/daemon/test/health.smoke.spec.mjs

# Suite completa con logging
pnpm test:phase3 2>&1 | tee test-output.log

# Validar schema
pnpm test:skill-rules-schema

# Validación rápida
pnpm test:phase3-quick
```

---

## 18. Referencias y Documentación

### Documentación Principal

- **CLAUDE.md**: Guía completa del proyecto
- **README.md**: Documentación general
- **docs/architecture/**: Documentación de arquitectura detallada

### Archivos de Configuración

- `configs/skill-rules.json`: Reglas de activación
- `.cursor/hooks/hooks-config.json`: Configuración de hooks
- `scripts/pm2/ecosystem.config.cjs`: Configuración PM2

### Scripts Útiles

- `scripts/hooks/pre-invoke.mjs`: Hook pre-invoke
- `scripts/hooks/stop.mjs`: Hook stop
- `scripts/hooks/pbv2-activator.mjs`: Activador PBv2
- `scripts/hooks/bash-validator.py`: Validador de bash

---

## Conclusión

Skills Fabric es un sistema robusto y completo para automatización de desarrollo con:

- ✅ Arquitectura multi-servicio escalable
- ✅ Sistema de skills flexible y extensible
- ✅ Hooks de Cursor IDE integrados
- ✅ Quality gates completos
- ✅ Observabilidad y métricas detalladas
- ✅ Resiliencia y alta disponibilidad

El sistema está diseñado para ser:
- **Agnóstico al editor**: Funciona con cualquier editor que soporte hooks
- **Extensible**: Fácil agregar nuevos skills
- **Resiliente**: Circuit breakers, retry logic, health checks
- **Observable**: Métricas, tracing, logging estructurado
- **Performante**: Cache, optimizaciones, latencia < 500ms

---

**Última actualización:** 2025-01-27  
**Versión del documento:** 1.0.0

