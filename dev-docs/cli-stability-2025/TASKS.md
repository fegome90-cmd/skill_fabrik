# CLI Stability 2025 - Task List

**Código de Proyecto:** `CLI-STABILITY-2025`  
**Versión:** 1.0  
**Fecha de Creación:** 2025-11-05  
**Basado en:** SF-STABILITY-2025 Success Pattern

---

## 📊 Resumen de Progreso

```
Total de Problemas: 7
├─ 🔴 Críticos: 2 (0 completados, 2 pendientes)
├─ 🟠 Alta: 2 (0 completados, 2 pendientes)
├─ 🟡 Media: 2 (0 completados, 2 pendientes)
└─ ⚪ Baja: 1 (0 completados, 1 pendiente)

Progreso General: ░░░░░░░░░░ 0% (0/7)
Horas Invertidas: 0 / 34 horas estimadas
```

---

## 🎯 SPRINT 1 - Seguridad Crítica

**Fecha Inicio:** [TBD]  
**Fecha Fin:** [TBD]  
**Status:** 📝 Planificado  
**Progreso:** ░░░░░░░░░░ 0% (0/2 tareas)

**Objetivo:** Eliminar vulnerabilidades críticas de seguridad

---

### Tarea 1.1: Logging Estructurado con Pino

**ID:** `CLI-STABILITY-2025-T1.1`  
**Problema:** CRIT-CLI-1  
**Prioridad:** 🔴 CRÍTICA  
**Esfuerzo Estimado:** 4-6 horas  
**Esfuerzo Real:** - horas  
**Asignado a:** [Developer]  
**Status:** ⚪ No Iniciado

#### Descripción

Reemplazar el logger actual con Pino para logging estructurado, siguiendo el patrón implementado en SF-STABILITY-2025.

#### Problema Actual

```typescript
// src/core/logger.ts - Logging muy básico
console.log(`${prefix} ${entry.timestamp} ${message}`);

// Problemas:
// - Sin contexto estructurado
// - Sin request ID tracking
// - Sin redacción de secrets
// - Sin niveles granulares (trace, debug)
// - Difícil de parsear
```

#### Solución Propuesta

1. **Instalar Dependencias**
   ```bash
   pnpm add pino pino-pretty
   ```

2. **Crear Logger V2**
   ```typescript
   // src/core/logger-v2.ts
   import pino from 'pino';
   
   export const logger = pino({
     level: process.env.LOG_LEVEL || 'info',
     transport: {
       target: 'pino-pretty',
       options: {
         colorize: true,
         translateTime: 'SYS:standard',
         ignore: 'pid,hostname'
       }
     },
     redact: {
       paths: ['password', 'apiKey', 'secret', 'token'],
       remove: true
     }
   });
   ```

3. **Migrar Todos los Logs**
   - Reemplazar `Logger.info()` → `logger.info()`
   - Reemplazar `Logger.error()` → `logger.error()`
   - Agregar contexto estructurado

4. **Request ID Tracking**
   ```typescript
   const requestId = crypto.randomUUID();
   logger.child({ requestId });
   ```

#### Archivos a Modificar

- ✅ `package.json` - Agregar pino, pino-pretty
- ✅ `src/core/logger-v2.ts` - Crear nuevo logger
- ✅ `src/index.ts` - Actualizar imports
- ✅ `src/commands/*.ts` - Actualizar todos los comandos
- ✅ `src/services/*.ts` - Actualizar servicios
- ✅ `src/utils/*.ts` - Actualizar utilidades

#### Criterios de Aceptación

- [ ] Pino instalado y configurado
- [ ] Request ID en todos los logs
- [ ] Secrets redactados automáticamente
- [ ] Pretty printing en desarrollo
- [ ] JSON logs en CI/producción
- [ ] Niveles: trace, debug, info, warn, error, fatal
- [ ] Todos los archivos migrados
- [ ] 0 errores de compilación
- [ ] Tests pasando

#### Testing

```bash
# Test logging
pnpm test:unit src/core/logger-v2.test.ts

# Test redaction
pnpm test:security

# Build
pnpm build
```

---

### Tarea 1.2: Validación de Entrada con Zod

**ID:** `CLI-STABILITY-2025-T1.2`  
**Problema:** CRIT-CLI-2  
**Prioridad:** 🔴 CRÍTICA  
**Esfuerzo Estimado:** 4-6 horas  
**Esfuerzo Real:** - horas  
**Asignado a:** [Developer]  
**Status:** ⚪ No Iniciado

#### Descripción

Implementar validación de entrada para todos los comandos usando Zod para prevenir command injection y otros ataques.

#### Problema Actual

```typescript
// Comandos actuales - SIN VALIDACIÓN
.action(async (arg1, arg2, options) => {
  // No validation!
  await someOperation(arg1, arg2);
});

// Riesgos:
// - Command injection
// - Path traversal
// - Invalid inputs
// - Crashes
```

#### Solución Propuesta

1. **Instalar Zod**
   ```bash
   pnpm add zod
   ```

2. **Crear Schemas**
   ```typescript
   // src/schemas/commands.ts
   import { z } from 'zod';
   
   export const CloopCommandSchema = z.object({
     action: z.enum(['init', 'run', 'status']),
     path: z.string().regex(/^[a-zA-Z0-9_\-\/]+$/),
     options: z.object({
       force: z.boolean().optional(),
       verbose: z.boolean().optional()
     })
   });
   ```

3. **Crear Middleware de Validación**
   ```typescript
   // src/middleware/validation.ts
   export function validateCommand<T>(schema: z.ZodSchema<T>) {
     return (args: unknown) => {
       const result = schema.safeParse(args);
       if (!result.success) {
         throw new ValidationError(
           'Invalid command arguments',
           result.error.format()
         );
       }
       return result.data;
     };
   }
   ```

4. **Integrar con Comandos**
   ```typescript
   .action(async (arg1, arg2, options) => {
     const validated = validateCommand(CloopCommandSchema)({
       action: arg1,
       path: arg2,
       options
     });
     await someOperation(validated);
   });
   ```

#### Archivos a Modificar

- ✅ `package.json` - Agregar zod
- ✅ `src/schemas/commands.ts` - Crear schemas (NUEVO)
- ✅ `src/middleware/validation.ts` - Crear middleware (NUEVO)
- ✅ `src/commands/*.ts` - Agregar validación a todos
- ✅ `src/core/error-handler.ts` - Mejorar ValidationError

#### Comandos a Validar (15+)

1. [ ] cloop
2. [ ] skills
3. [ ] hooks
4. [ ] guardrail
5. [ ] build
6. [ ] ci
7. [ ] dev-docs
8. [ ] plan
9. [ ] activation
10. [ ] pm2
11. [ ] kpi
12. [ ] daemon
13. [ ] prompt-builder
14. [ ] dashboard
15. [ ] slash-commands

#### Criterios de Aceptación

- [ ] Zod instalado
- [ ] Schemas para todos los comandos
- [ ] Middleware de validación
- [ ] Todos los comandos validados
- [ ] Error messages claros y amigables
- [ ] Type-safe arguments
- [ ] Tests de validación
- [ ] 0 errores de compilación

#### Testing

```bash
# Test validation
pnpm test:unit src/middleware/validation.test.ts

# Test schemas
pnpm test:unit src/schemas/commands.test.ts

# Security tests
pnpm test:security

# Build
pnpm build
```

---

## 🎯 SPRINT 2 - Estabilidad y Configuración

**Fecha Inicio:** [TBD]  
**Fecha Fin:** [TBD]  
**Status:** 📝 Planificado  
**Progreso:** ░░░░░░░░░░ 0% (0/2 tareas)

**Objetivo:** Mejorar estabilidad y validar configuración

---

### Tarea 2.1: Graceful Shutdown

**ID:** `CLI-STABILITY-2025-T2.1`  
**Problema:** ALTA-CLI-1  
**Prioridad:** 🟠 ALTA  
**Esfuerzo Estimado:** 3-5 horas  
**Esfuerzo Real:** - horas  
**Asignado a:** [Developer]  
**Status:** ⚪ No Iniciado

#### Descripción

Implementar graceful shutdown para SIGTERM/SIGINT siguiendo el patrón de SF-STABILITY-2025.

#### Problema Actual

```typescript
// index.ts - Sin graceful shutdown
program.parse();

// Problemas:
// - Operaciones pueden quedar a medias
// - Workers no se limpian
// - File handles abiertos
// - Estado inconsistente
```

#### Solución Propuesta

Similar a SF-STABILITY-2025 `shutdown.ts`:

```typescript
// src/core/shutdown.ts
export class GracefulShutdown {
  private isShuttingDown = false;
  
  constructor(private timeout: number = 30000) {
    this.registerHandlers();
  }
  
  private registerHandlers() {
    process.on('SIGTERM', () => this.shutdown('SIGTERM'));
    process.on('SIGINT', () => this.shutdown('SIGINT'));
  }
  
  private async shutdown(signal: string) {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;
    
    logger.info({ signal }, 'Graceful shutdown initiated');
    
    const timeout = setTimeout(() => {
      logger.error('Shutdown timeout, forcing exit');
      process.exit(1);
    }, this.timeout);
    
    try {
      // Cleanup workers
      await this.cleanupWorkers();
      
      // Close file handles
      await this.closeFileHandles();
      
      // Save state
      await this.saveState();
      
      clearTimeout(timeout);
      logger.info('Graceful shutdown complete');
      process.exit(0);
    } catch (error) {
      logger.error({ error }, 'Error during shutdown');
      process.exit(1);
    }
  }
}
```

#### Archivos a Modificar

- ✅ `src/core/shutdown.ts` - Crear (NUEVO)
- ✅ `src/index.ts` - Integrar shutdown
- ✅ `src/workers/*.ts` - Agregar cleanup
- ✅ `src/services/*.ts` - Agregar cleanup

#### Criterios de Aceptación

- [ ] SIGTERM/SIGINT manejados
- [ ] Cleanup de workers
- [ ] Cleanup de file handles
- [ ] Timeout de 30s
- [ ] Logging de shutdown
- [ ] Estado guardado
- [ ] Tests de shutdown
- [ ] 0 errores de compilación

---

### Tarea 2.2: Config Validation con Zod

**ID:** `CLI-STABILITY-2025-T2.2`
**Problema:** ALTA-CLI-2
**Prioridad:** 🟠 ALTA
**Esfuerzo Estimado:** 3-5 horas
**Esfuerzo Real:** - horas
**Asignado a:** [Developer]
**Status:** ⚪ No Iniciado

#### Descripción

Validar configuración con Zod en runtime para type-safety.

#### Problema Actual

```typescript
// src/core/config-manager.ts - Sin validación
private loadConfig(): CliConfig {
  const data = readFileSync(this.configPath, 'utf8');
  return { ...this.getDefaultConfig(), ...JSON.parse(data) };
  // No validation!
}
```

#### Solución Propuesta

```typescript
// src/schemas/config.ts
import { z } from 'zod';

export const CliConfigSchema = z.object({
  version: z.string(),
  defaultModel: z.string(),
  apiKeys: z.record(z.string()),
  secrets: z.array(z.object({
    name: z.string(),
    value: z.string(),
    encrypted: z.boolean()
  })),
  preferences: z.object({
    verbose: z.boolean().default(false),
    color: z.boolean().default(true)
  })
});

export type CliConfig = z.infer<typeof CliConfigSchema>;

// src/core/config-manager.ts
private loadConfig(): CliConfig {
  const data = readFileSync(this.configPath, 'utf8');
  const raw = { ...this.getDefaultConfig(), ...JSON.parse(data) };

  const result = CliConfigSchema.safeParse(raw);
  if (!result.success) {
    throw new ConfigurationError(
      'Invalid configuration',
      result.error.format()
    );
  }

  return result.data;
}
```

#### Archivos a Modificar

- ✅ `src/schemas/config.ts` - Crear schema (NUEVO)
- ✅ `src/core/config-manager.ts` - Agregar validación
- ✅ `src/types/config.ts` - Actualizar tipos

#### Criterios de Aceptación

- [ ] Config schema con Zod
- [ ] Validación en loadConfig()
- [ ] Type-safe config access
- [ ] Error messages claros
- [ ] Defaults validados
- [ ] Tests de validación
- [ ] 0 errores de compilación

---

## 🎯 SPRINT 3 - Observabilidad

**Fecha Inicio:** [TBD]
**Fecha Fin:** [TBD]
**Status:** 📝 Planificado
**Progreso:** ░░░░░░░░░░ 0% (0/2 tareas)

**Objetivo:** Mejorar observabilidad con health checks y métricas

---

### Tarea 3.1: Health Check Command

**ID:** `CLI-STABILITY-2025-T3.1`
**Problema:** MED-CLI-1
**Prioridad:** 🟡 MEDIA
**Esfuerzo Estimado:** 2-4 horas
**Esfuerzo Real:** - horas
**Asignado a:** [Developer]
**Status:** ⚪ No Iniciado

#### Descripción

Implementar comando `health` para diagnósticos del CLI.

#### Solución Propuesta

```typescript
// src/commands/health.ts
export async function healthCommand() {
  const checks = {
    config: await checkConfig(),
    dependencies: await checkDependencies(),
    filesystem: await checkFilesystem(),
    network: await checkNetwork()
  };

  const allHealthy = Object.values(checks).every(c => c.healthy);

  console.log(formatHealthReport(checks));
  process.exit(allHealthy ? 0 : 1);
}

async function checkConfig() {
  try {
    const config = await loadConfig();
    return { healthy: true, message: 'Config valid' };
  } catch (error) {
    return { healthy: false, message: error.message };
  }
}
```

#### Archivos a Modificar

- ✅ `src/commands/health.ts` - Crear (NUEVO)
- ✅ `src/index.ts` - Registrar comando
- ✅ `src/utils/health-checks.ts` - Helpers (NUEVO)

#### Criterios de Aceptación

- [ ] Comando `health` funcional
- [ ] Check de config
- [ ] Check de dependencies
- [ ] Check de filesystem
- [ ] Check de network (opcional)
- [ ] Output formateado
- [ ] Exit codes correctos
- [ ] Tests

---

### Tarea 3.2: Métricas Prometheus (Opcional)

**ID:** `CLI-STABILITY-2025-T3.2`
**Problema:** MED-CLI-2
**Prioridad:** 🟡 MEDIA
**Esfuerzo Estimado:** 2-4 horas
**Esfuerzo Real:** - horas
**Asignado a:** [Developer]
**Status:** ⚪ No Iniciado

#### Descripción

Implementar métricas básicas con Prometheus (opcional para CLI).

#### Solución Propuesta

```typescript
// src/metrics/prometheus.ts
import { Counter, Histogram, Registry } from 'prom-client';

export const register = new Registry();

export const commandExecutions = new Counter({
  name: 'cli_command_executions_total',
  help: 'Total number of command executions',
  labelNames: ['command', 'status'],
  registers: [register]
});

export const commandDuration = new Histogram({
  name: 'cli_command_duration_seconds',
  help: 'Command execution duration',
  labelNames: ['command'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register]
});
```

#### Archivos a Modificar

- ✅ `src/metrics/prometheus.ts` - Crear (NUEVO)
- ✅ `src/commands/*.ts` - Agregar tracking
- ✅ `package.json` - Agregar prom-client (opcional)

#### Criterios de Aceptación

- [ ] Métricas básicas implementadas
- [ ] Command execution tracking
- [ ] Error tracking
- [ ] Duration tracking
- [ ] (Opcional) Endpoint /metrics

---

## 🎯 SPRINT 4 - Optimizaciones

**Fecha Inicio:** [TBD]
**Fecha Fin:** [TBD]
**Status:** 📝 Planificado
**Progreso:** ░░░░░░░░░░ 0% (0/1 tarea)

**Objetivo:** Optimizaciones finales y cleanup

---

### Tarea 4.1: Secret Redaction y Cleanup

**ID:** `CLI-STABILITY-2025-T4.1`
**Problema:** BAJA-CLI-1
**Prioridad:** ⚪ BAJA
**Esfuerzo Estimado:** 2-4 horas
**Esfuerzo Real:** - horas
**Asignado a:** [Developer]
**Status:** ⚪ No Iniciado

#### Descripción

Asegurar que secrets no se loggeen en ningún lugar.

#### Solución Propuesta

```typescript
// src/core/logger-v2.ts
const logger = pino({
  redact: {
    paths: [
      'password',
      'apiKey',
      'secret',
      'token',
      'authorization',
      'cookie',
      '*.password',
      '*.apiKey',
      '*.secret',
      '*.token'
    ],
    remove: true
  }
});

// Test
logger.info({ apiKey: 'secret123' });
// Output: { apiKey: '[Redacted]' }
```

#### Archivos a Modificar

- ✅ `src/core/logger-v2.ts` - Mejorar redacción
- ✅ Todos los archivos - Audit de logs
- ✅ `tests/security/secret-redaction.test.ts` - Tests (NUEVO)

#### Criterios de Aceptación

- [ ] Secrets redactados automáticamente
- [ ] Audit completo de logs
- [ ] Tests de redacción
- [ ] Documentación
- [ ] 0 secrets en logs

---

## 📊 Resumen de Estimaciones

| Sprint | Tareas | Horas Min | Horas Max | Prioridad |
|--------|--------|-----------|-----------|-----------|
| Sprint 1 | 2 | 8h | 12h | 🔴 Crítica |
| Sprint 2 | 2 | 6h | 10h | 🟠 Alta |
| Sprint 3 | 2 | 4h | 8h | 🟡 Media |
| Sprint 4 | 1 | 2h | 4h | ⚪ Baja |
| **Total** | **7** | **20h** | **34h** | - |

---

## 🎯 Orden de Ejecución Recomendado

1. **T1.1** - Logging Estructurado (CRÍTICO)
2. **T1.2** - Validación de Entrada (CRÍTICO)
3. **T2.1** - Graceful Shutdown (ALTO)
4. **T2.2** - Config Validation (ALTO)
5. **T3.1** - Health Check (MEDIO)
6. **T3.2** - Métricas (MEDIO - Opcional)
7. **T4.1** - Secret Redaction (BAJO)

---

## ✅ Checklist de Completitud

### Por Sprint

**Sprint 1:**
- [ ] T1.1 Completado
- [ ] T1.2 Completado
- [ ] Build exitoso
- [ ] Tests pasando
- [ ] Documentación actualizada

**Sprint 2:**
- [ ] T2.1 Completado
- [ ] T2.2 Completado
- [ ] Build exitoso
- [ ] Tests pasando
- [ ] Documentación actualizada

**Sprint 3:**
- [ ] T3.1 Completado
- [ ] T3.2 Completado (opcional)
- [ ] Build exitoso
- [ ] Tests pasando
- [ ] Documentación actualizada

**Sprint 4:**
- [ ] T4.1 Completado
- [ ] Build exitoso
- [ ] Tests pasando
- [ ] Documentación actualizada

### General

- [ ] Todos los problemas críticos resueltos
- [ ] Todos los problemas de alta prioridad resueltos
- [ ] 90%+ de reducción de riesgo
- [ ] 0 errores de compilación
- [ ] Tests pasando (unit, e2e, security)
- [ ] Documentación completa
- [ ] CHANGELOG actualizado

---

**Documento Creado Por:** Augment Agent
**Fecha:** 2025-11-05
**Basado en:** SF-STABILITY-2025 Success Pattern

