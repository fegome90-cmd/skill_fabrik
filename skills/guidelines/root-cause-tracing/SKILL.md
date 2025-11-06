---
id: root-cause-tracing
version: 0.1.0
type: guideline
enforcement: suggest
summary: 'Traza hacia atrás por el call-stack y flujo de ejecución hasta encontrar el disparador original de un problema. Especializado en análisis de stack traces y flujos asíncronos.'
description: 'Metodología para trazar hacia atrás por el call-stack y flujo de ejecución. Implementa técnicas para encontrar el disparador original de problemas. Aplica análisis de stack traces y flujos asíncronos para debugging efectivo.'
audience: engineers
when_to_use: 'Al tener stack traces complejos, errores asíncronos, o problemas que requieren entender el flujo completo de ejecución.'
provides: Técnicas de análisis de stack traces, métodos de tracing asíncrono, herramientas de visualización de flujos, patrones de análisis temporal.
resources:
  - resources/stack-trace-analysis.md
  - resources/async-tracing.md
  - resources/temporal-analysis.md
  - resources/tracing-tools.md
scripts:
  - name: trace-stack
    run: node scripts/debug/trace-stack.js <error-file>
    note: Analiza stack trace y genera gráfico de llamada
  - name: trace-async
    run: node scripts/debug/trace-async.js <trace-id>
    note: Reconstruye flujo asíncrono completo
  - name: trace-timeline
    run: node scripts/debug/timeline-analysis.js <logs>
    note: Crea timeline visual de eventos
limits: Requiere acceso a logs completos, stack traces, y contexto de ejecución del error.
---

## Objetivo

Realizar análisis sistemático hacia atrás (backwards tracing) desde el punto de falla hasta el origen del problema, entendiendo el flujo completo de ejecución y las relaciones causales entre eventos.

**Cuándo usar**:
- Stack traces complejos con múltiples niveles de llamada
- Errores asíncronos donde el punto de origen no es evidente
- Problemas distribuidos donde el error ocurre lejos del origen
- Bugs intermitentes donde necesitas reconstruir la secuencia completa

**Cuándo NO usar**: Para problemas simples con causa evidente o cuando tienes acceso directo al punto de origen.

**Qué problema resuelve**: Encuentra la causa raíz real en lugar de solo tratar síntomas, reconstruye flujos asíncronos complejos, identifica el verdadero punto de disparo de problemas.

## Procedimiento (resumen)

### Método de Backwards Tracing

#### 1. Punto de Inicio (El Efecto)
- **Identificar el error exacto**: Mensaje, código, contexto
- **Capturar el stack trace**: Completo y sin modificaciones
- **Documentar el estado**: Variables, entorno, timestamps
- **Establecer el "ground zero"**: El punto donde el problema se manifestó

#### 2. Análisis del Stack Trace (Cercano)
- **Leer de arriba abajo**: Llamada más reciente primero
- **Identificar frames clave**: Funciones críticas en el flujo
- **Buscar patrones**: Llamadas repetitivas, recursion, loops
- **Mapear relaciones**: Quién llamó a quién y por qué

#### 3. Tracing Asíncrono (Medio)
- **Reconstruir el timeline**: Evento → callback → promesa → resolve
- **Identificar contextos**: Qué coroutine/async scope originó la llamada
- **Mapear flujos**: Promises, callbacks, event loops
- **Detectar race conditions**: Timing y concurrencia

#### 4. Análisis Temporal (Lejano)
- **Trazar hacia el origen**: Eventos que iniciaron el flujo
- **Identificar triggers**: HTTP requests, user actions, scheduled jobs
- **Reconstruir el contexto**: Estado inicial del sistema
- **Validar la cadena**: Cada paso conecta lógicamente con el siguiente

## Checklist

### Análisis Inicial
- [ ] Error capturado completamente (mensaje + stack)
- [ ] Estado del sistema documentado
- [ ] Timestamps y secuencia de eventos registrados
- [ ] Variables de entorno y configuración anotadas

### Stack Trace Analysis
- [ ] Cada frame del stack trace analizado
- [ ] Funciones clave identificadas y entendidas
- [ ] Parámetros y contexto de cada llamada revisados
- [ ] Patrones anómalos detectados (recursión, loops)

### Async Tracing
- [ ] Flujo asíncrono reconstruido completamente
- [ ] Contextos y scopes identificados
- [ ] Timing y secuencias validados
- [ ] Race conditions o deadlocks detectados

### Validación Final
- [ ] Causa raíz identificada y documentada
- [ ] Flujo completo desde origen a efecto trazado
- [ ] Cadena causal validada sin saltos lógicos
- [ ] Hipótesis de origen verificable

## Ejemplos

### ✅ Correcto - Error Asíncrono Complejo

```typescript
// ERROR CAPTURADO:
// Error: Cannot read property 'user' of undefined
//     at UserService.updateProfile (user.service.ts:45:20)
//     at processTicksAndRejections (internal/process/task_queues.js:93:5)
//     at async APIController.handleRequest (api.controller.ts:78:12)
//     at async ExpressRouter.handle (router/index.js:539:9)

// TRACING HACIA ATRÁS:

// Frame 1: UserService.updateProfile (donde ocurrió el error)
async updateProfile(userId: string, data: ProfileData): Promise<User> {
  const user = await this.getUserById(userId); // ← user es undefined aquí
  return user.update(data); // ← Error: Cannot read property 'user'
}

// Frame 2: APIController.handleRequest (qué llamó a updateProfile)
async handleRequest(req: Request): Promise<Response> {
  const userId = req.params.userId;
  const profileData = req.body;

  // ← ¿Por qué userId es inválido?
  return await this.userService.updateProfile(userId, profileData);
}

// Frame 3: ExpressRouter.handle (cómo llegó la request)
// ← Request original: PUT /api/users/invalid-id/profile
// ← Validación de ID falló en middleware anterior

// ORIGEN REAL:
// Middleware de validación de parámetros no se ejecutó
// porque la ruta fue registrada sin el middleware
// en el último deployment

// CAUSA RAÍZ:
// Configuración incorrecta de rutas en router
// Missing validation middleware on user profile routes
```

### ✅ Correcto - Memory Leak con Async

```typescript
// ERROR: Process out of memory after 2 hours
// STACK TRACE: GC overhead limit exceeded

// TRACING TEMPORAL HACIA ATRÁS:

// T-2h: Server restart
// T-1h45m: First batch processing started
// T-1h30m: Async operations acumulándose
// T-1h15m: Event listeners no being removed
// T-1h: Memory usage starting to climb
// T-30m: GC running frequently but ineffective
// T-5m: Out of memory error

// ANÁLISIS DE CÓDIGO:

class DataProcessor {
  async processBatch(data: any[]): Promise<void> {
    data.forEach(item => {
      // ← Event listener añadido pero nunca removido
      this.eventEmitter.on('data', (result) => {
        this.cache.add(result); // ← Memory leak
      });

      this.processItem(item);
    });
  }
}

// ORIGEN REAL:
// Event listeners acumulándose con cada item del batch
// Sin cleanup apropiado de listeners

// SOLUCIÓN:
// Remover listeners después de uso o usar once()
```

### ❌ Incorrecto - Análisis Superficial

```typescript
// ❌ Solo ver el último frame
function debugError(error: Error) {
  console.log("Error occurred at:", error.stack.split('\n')[0]);
  // "Cannot read property 'user' of undefined at line 45"
  // → Conclusión incorrecta: "hay un bug en la línea 45"
  // → Realidad: el problema empezó mucho antes
}
```

## Técnicas Específicas

### 1. Stack Trace Deep Analysis
```typescript
function analyzeStackTrace(stackTrace: string): StackAnalysis {
  const frames = stackTrace.split('\n').filter(line => line.trim());

  return {
    totalFrames: frames.length,
    criticalFrames: identifyCriticalFrames(frames),
    patterns: detectPatterns(frames),
    timeline: reconstructTimeline(frames),
    recommendations: generateRecommendations(frames)
  };
}

function identifyCriticalFrames(frames: string[]): FrameInfo[] {
  return frames.map((frame, index) => {
    const match = frame.match(/at (.+) \((.+):(\d+):(\d+)\)/);
    if (!match) return null;

    return {
      functionName: match[1],
      file: match[2],
      line: parseInt(match[3]),
      column: parseInt(match[4]),
      depth: index,
      isAsync: frame.includes('async'),
      isSystem: frame.includes('node_modules') || frame.includes('internal/')
    };
  }).filter(Boolean);
}
```

### 2. Async Context Tracking
```typescript
class AsyncContextTracker {
  private contexts = new Map<string, AsyncContext>();

  createContext(operationId: string, parentContext?: string): AsyncContext {
    const context: AsyncContext = {
      id: operationId,
      parentId: parentContext,
      startTime: Date.now(),
      operations: []
    };

    this.contexts.set(operationId, context);
    return context;
  }

  addOperation(contextId: string, operation: Operation): void {
    const context = this.contexts.get(contextId);
    if (context) {
      context.operations.push({
        ...operation,
        timestamp: Date.now()
      });
    }
  }

  reconstructFlow(operationId: string): AsyncFlow {
    const flow: AsyncFlow = {
      operations: [],
      timeline: [],
      duration: 0
    };

    let currentId = operationId;
    while (currentId) {
      const context = this.contexts.get(currentId);
      if (context) {
        flow.operations.unshift(...context.operations);
        currentId = context.parentId || '';
      } else {
        break;
      }
    }

    // Construir timeline ordenado
    flow.timeline = flow.operations
      .map(op => ({ ...op, relativeTime: op.timestamp - flow.operations[0].timestamp }))
      .sort((a, b) => a.timestamp - b.timestamp);

    if (flow.timeline.length > 0) {
      flow.duration = flow.timeline[flow.timeline.length - 1].relativeTime;
    }

    return flow;
  }
}
```

### 3. Temporal Event Reconstruction
```typescript
class TemporalReconstructor {
  private events: TemporalEvent[] = [];

  addEvent(event: Partial<TemporalEvent>): void {
    this.events.push({
      id: generateEventId(),
      timestamp: Date.now(),
      ...event
    });

    // Mantener orden cronológico
    this.events.sort((a, b) => a.timestamp - b.timestamp);
  }

  reconstructCausalChain(errorEventId: string): CausalChain {
    const errorEvent = this.events.find(e => e.id === errorEventId);
    if (!errorEvent) {
      throw new Error('Error event not found');
    }

    const chain: CausalChain = {
      errorEvent,
      causes: [],
      timeline: []
    };

    // Buscar hacia atrás en tiempo
    const relevantEvents = this.events
      .filter(e => e.timestamp <= errorEvent.timestamp)
      .reverse(); // Más reciente primero

    let currentEvent = errorEvent;
    let currentContext = errorEvent.context;

    for (const event of relevantEvents) {
      if (this.isCausalRelated(event, currentEvent, currentContext)) {
        chain.causes.unshift(event);
        currentEvent = event;
        currentContext = event.context;
      }
    }

    chain.timeline = relevantEvents.map(event => ({
      event,
      relationship: this.determineRelationship(event, errorEvent),
      timeToError: errorEvent.timestamp - event.timestamp
    }));

    return chain;
  }

  private isCausalRelated(event: TemporalEvent, targetEvent: TemporalEvent, context: string): boolean {
    // Lógica para determinar si un evento es causa de otro
    return event.context === context ||
           event.type === 'trigger' ||
           (event.type === 'state_change' && targetEvent.type === 'error');
  }
}
```

## Herramientas Comandos

```bash
# Análisis de stack traces
node --trace-warnings app.js
node --trace-deprecation app.js
node --trace-sync-io app.js

# Análisis de async operations
node --trace-events-enabled
node --trace-event-categories node.async_hooks

# Memory tracking
node --trace-gc app.js
node --heap-prof app.js

# Análisis con Chrome DevTools
node --inspect-brk app.js
# Luego en Chrome: chrome://inspect
```

## Recursos

Ver `resources/` para:
- `stack-trace-analysis.md`: Técnicas detalladas de análisis de stacks
- `async-tracing.md`: Métodos para reconstruir flujos asíncronos
- `temporal-analysis.md`: Análisis de secuencias temporales de eventos
- `tracing-tools.md`: Herramientas específicas para tracing avanzado