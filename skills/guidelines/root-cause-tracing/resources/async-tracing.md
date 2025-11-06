# Async Tracing - Reconstrucción de Flujos Asíncronos Complejos

## Desafíos del Async Tracing

### La Naturaleza No Lineal del Código Asíncrono
```javascript
// Código síncrono - fácil de tracear
function processData(data) {
  const step1 = validateData(data);        // Frame 1
  const step2 = transformData(step1);      // Frame 2
  const step3 = saveData(step2);           // Frame 3
  return step3;                            // Frame 4
}

// Código asíncrono - difícil de tracear
async function processDataAsync(data) {
  const step1 = await validateDataAsync(data);     // Timeline: T1
  const step2 = await transformDataAsync(step1);   // Timeline: T2
  const step3 = await saveDataAsync(step2);        // Timeline: T3
  return step3;                                    // Timeline: T4
}

// El stack trace solo muestra el último frame!
```

### Problemas Comunes en Async Tracing
1. **Pérdida del contexto de llamada**: El stack trace original se pierde
2. **Múltiples flujos concurrentes**: Varias operaciones en paralelo
3. **Callbacks anidados**: Dificultad para seguir el flujo
4. **Promises chaining**: La conexión entre promesas no es evidente
5. **Event loop scheduling**: El orden de ejecución no es predecible

## Técnicas de Async Tracing

### 1. Async Hooks (Node.js)
```typescript
import { AsyncHooks, createHook } from 'async_hooks';

class AsyncTracer {
  private executions = new Map<number, AsyncExecution>();
  private relationships = new Map<number, number>();

  constructor() {
    const hook = createHook({
      init: (asyncId, type, triggerAsyncId) => {
        this.onAsyncInit(asyncId, type, triggerAsyncId);
      },
      before: (asyncId) => {
        this.onAsyncBefore(asyncId);
      },
      after: (asyncId) => {
        this.onAsyncAfter(asyncId);
      },
      destroy: (asyncId) => {
        this.onAsyncDestroy(asyncId);
      }
    });

    hook.enable();
  }

  private onAsyncInit(asyncId: number, type: string, triggerAsyncId: number): void {
    const execution: AsyncExecution = {
      id: asyncId,
      type,
      triggerId: triggerAsyncId,
      startTime: Date.now(),
      stackTrace: new Error().stack || '',
      operations: []
    };

    this.executions.set(asyncId, execution);
    this.relationships.set(asyncId, triggerAsyncId);

    console.log(`🔗 Async ${type} started: ${asyncId} (triggered by ${triggerAsyncId})`);
  }

  private onAsyncBefore(asyncId: number): void {
    const execution = this.executions.get(asyncId);
    if (execution) {
      execution.operations.push({
        type: 'before',
        timestamp: Date.now()
      });
    }
  }

  private onAsyncAfter(asyncId: number): void {
    const execution = this.executions.get(asyncId);
    if (execution) {
      execution.endTime = Date.now();
      execution.duration = execution.endTime - execution.startTime;
    }
  }

  reconstructFlow(asyncId: number): AsyncFlow {
    const execution = this.executions.get(asyncId);
    if (!execution) {
      throw new Error(`Async execution ${asyncId} not found`);
    }

    const flow: AsyncFlow = {
      root: execution,
      timeline: [],
      callChain: []
    };

    // Reconstruir la cadena de llamadas
    let currentId = asyncId;
    while (currentId) {
      const current = this.executions.get(currentId);
      if (current) {
        flow.callChain.unshift(current);
        currentId = this.relationships.get(currentId) || 0;
      } else {
        break;
      }
    }

    return flow;
  }
}

interface AsyncExecution {
  id: number;
  type: string;
  triggerId: number;
  startTime: number;
  endTime?: number;
  duration?: number;
  stackTrace: string;
  operations: Array<{
    type: 'before' | 'after' | 'error';
    timestamp: number;
  }>;
}
```

### 2. Promise Tracing
```typescript
class PromiseTracer {
  private promises = new Map<string, PromiseInfo>();
  private promiseCounter = 0;

  createTracedPromise<T>(executor: (
    resolve: (value: T) => void,
    reject: (reason?: any) => void
  ) => void, context?: string): Promise<T> {
    const promiseId = `promise-${++this.promiseCounter}`;
    const startTime = Date.now();

    const tracedPromise = new Promise<T>((resolve, reject) => {
      const promiseInfo: PromiseInfo = {
        id: promiseId,
        context: context || 'unknown',
        state: 'pending',
        startTime,
        resolveTime: undefined,
        rejectTime: undefined,
        value: undefined,
        reason: undefined,
        stackTrace: new Error().stack || ''
      };

      this.promises.set(promiseId, promiseInfo);

      const tracedResolve = (value: T) => {
        promiseInfo.state = 'fulfilled';
        promiseInfo.resolveTime = Date.now();
        promiseInfo.value = value;
        console.log(`✅ Promise ${promiseId} resolved in ${Date.now() - startTime}ms`);
        resolve(value);
      };

      const tracedReject = (reason?: any) => {
        promiseInfo.state = 'rejected';
        promiseInfo.rejectTime = Date.now();
        promiseInfo.reason = reason;
        console.error(`❌ Promise ${promiseId} rejected after ${Date.now() - startTime}ms:`, reason);
        reject(reason);
      };

      executor(tracedResolve, tracedReject);
    });

    return tracedPromise;
  }

  async tracePromiseChain<T>(promise: Promise<T>, context: string): Promise<PromiseChainResult> {
    const startTime = Date.now();
    const chainId = `chain-${Date.now()}`;

    try {
      const result = await promise;
      const duration = Date.now() - startTime;

      return {
        chainId,
        context,
        success: true,
        result,
        duration,
        timeline: this.buildChainTimeline(promise, startTime)
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      return {
        chainId,
        context,
        success: false,
        error: error as Error,
        duration,
        timeline: this.buildChainTimeline(promise, startTime)
      };
    }
  }

  private buildChainTimeline(promise: Promise<any>, startTime: number): ChainTimeline[] {
    // Implementación para construir timeline de la cadena de promesas
    return [
      {
        event: 'promise_created',
        timestamp: startTime,
        details: 'Initial promise created'
      }
      // ... más eventos
    ];
  }
}

interface PromiseInfo {
  id: string;
  context: string;
  state: 'pending' | 'fulfilled' | 'rejected';
  startTime: number;
  resolveTime?: number;
  rejectTime?: number;
  value?: any;
  reason?: any;
  stackTrace: string;
}
```

### 3. Event Loop Tracing
```typescript
class EventLoopTracer {
  private events: LoopEvent[] = [];
  private macrotasks: MacroTask[] = [];
  private microtasks: MicroTask[] = [];

  traceEventLoop(): void {
    // Override nextTick para tracing
    const originalNextTick = process.nextTick;
    process.nextTick = (callback: Function, ...args: any[]) => {
      const taskId = `microtask-${Date.now()}-${Math.random()}`;

      const tracedCallback = () => {
        const start = process.hrtime.bigint();
        try {
          callback(...args);
          const end = process.hrtime.bigint();
          this.recordMicroTask(taskId, 'success', Number(end - start) / 1000000);
        } catch (error) {
          const end = process.hrtime.bigint();
          this.recordMicroTask(taskId, 'error', Number(end - start) / 1000000, error as Error);
        }
      };

      originalNextTick(tracedCallback);
    };

    // Override setTimeout para tracing
    const originalSetTimeout = global.setTimeout;
    global.setTimeout = (callback: Function, delay: number, ...args: any[]) => {
      const taskId = `macrotask-${Date.now()}-${Math.random()}`;

      const tracedCallback = () => {
        const start = process.hrtime.bigint();
        try {
          callback(...args);
          const end = process.hrtime.bigint();
          this.recordMacroTask(taskId, delay, 'success', Number(end - start) / 1000000);
        } catch (error) {
          const end = process.hrtime.bigint();
          this.recordMacroTask(taskId, delay, 'error', Number(end - start) / 1000000, error as Error);
        }
      };

      return originalSetTimeout(tracedCallback, delay);
    };
  }

  private recordMicroTask(id: string, result: 'success' | 'error', duration: number, error?: Error): void {
    this.microtasks.push({
      id,
      type: 'microtask',
      result,
      duration,
      error: error?.message,
      timestamp: Date.now()
    });

    console.log(`🔄 Microtask ${id}: ${result} (${duration.toFixed(2)}ms)`);
  }

  private recordMacroTask(id: string, delay: number, result: 'success' | 'error', duration: number, error?: Error): void {
    this.macrotasks.push({
      id,
      type: 'macrotask',
      delay,
      result,
      duration,
      error: error?.message,
      timestamp: Date.now()
    });

    console.log(`⏰ Macrotask ${id}: ${result} (delay: ${delay}ms, exec: ${duration.toFixed(2)}ms)`);
  }

  generateEventLoopReport(): EventLoopReport {
    const totalMicrotasks = this.microtasks.length;
    const totalMacrotasks = this.macrotasks.length;
    const avgMicrotaskDuration = this.microtasks.reduce((sum, task) => sum + task.duration, 0) / totalMicrotasks;
    const avgMacrotaskDuration = this.macrotasks.reduce((sum, task) => sum + task.duration, 0) / totalMacrotasks;

    return {
      summary: {
        totalMicrotasks,
        totalMacrotasks,
        avgMicrotaskDuration,
        avgMacrotaskDuration
      },
      microtasks: this.microtasks.sort((a, b) => a.timestamp - b.timestamp),
      macrotasks: this.macrotasks.sort((a, b) => a.timestamp - b.timestamp),
      timeline: this.buildEventTimeline()
    };
  }

  private buildEventTimeline(): TimelineEvent[] {
    const allEvents = [
      ...this.microtasks.map(t => ({ ...t, category: 'microtask' })),
      ...this.macrotasks.map(t => ({ ...t, category: 'macrotask' }))
    ];

    return allEvents
      .sort((a, b) => a.timestamp - b.timestamp)
      .map((event, index) => ({
        sequence: index,
        timestamp: event.timestamp,
        category: event.category,
        type: event.result,
        duration: event.duration,
        details: `${event.category} ${event.result} in ${event.duration.toFixed(2)}ms`
      }));
  }
}
```

## Reconstrucción de Flujos Asíncronos

### 1. Mapeo de Contextos Asíncronos
```typescript
interface AsyncContext {
  id: string;
  parentId?: string;
  type: 'promise' | 'callback' | 'timeout' | 'event';
  startTime: number;
  endTime?: number;
  metadata: Record<string, any>;
  children: AsyncContext[];
}

class AsyncContextMapper {
  private contexts = new Map<string, AsyncContext>();
  private rootContexts: AsyncContext[] = [];

  createContext(type: AsyncContext['type'], parentId?: string, metadata?: Record<string, any>): string {
    const contextId = `ctx-${Date.now()}-${Math.random()}`;

    const context: AsyncContext = {
      id: contextId,
      parentId,
      type,
      startTime: Date.now(),
      metadata: metadata || {},
      children: []
    };

    this.contexts.set(contextId, context);

    if (parentId) {
      const parent = this.contexts.get(parentId);
      if (parent) {
        parent.children.push(context);
      }
    } else {
      this.rootContexts.push(context);
    }

    return contextId;
  }

  closeContext(contextId: string): void {
    const context = this.contexts.get(contextId);
    if (context) {
      context.endTime = Date.now();
    }
  }

  rebuildFlow(contextId: string): AsyncFlow {
    const context = this.contexts.get(contextId);
    if (!context) {
      throw new Error(`Context ${contextId} not found`);
    }

    return {
      root: this.findRootContext(context),
      timeline: this.buildTimeline(context),
      callHierarchy: this.buildCallHierarchy(context),
      performanceMetrics: this.calculateMetrics(context)
    };
  }

  private findRootContext(context: AsyncContext): AsyncContext {
    let current = context;
    while (current.parentId) {
      const parent = this.contexts.get(current.parentId);
      if (!parent) break;
      current = parent;
    }
    return current;
  }

  private buildTimeline(context: AsyncContext): ContextTimeline[] {
    const timeline: ContextTimeline[] = [];
    const visited = new Set<string>();

    const traverse = (ctx: AsyncContext, depth: number) => {
      if (visited.has(ctx.id)) return;
      visited.add(ctx.id);

      timeline.push({
        contextId: ctx.id,
        type: ctx.type,
        startTime: ctx.startTime,
        endTime: ctx.endTime || Date.now(),
        depth,
        metadata: ctx.metadata
      });

      ctx.children.forEach(child => traverse(child, depth + 1));
    };

    traverse(context, 0);
    return timeline.sort((a, b) => a.startTime - b.startTime);
  }
```

### 2. Visualización de Flujos Asíncronos
```typescript
class AsyncFlowVisualizer {
  generateMermaidDiagram(flow: AsyncFlow): string {
    let diagram = 'graph TD\n';
    diagram += '    %% Async Flow Visualization\n\n';

    // Agregar nodos
    flow.timeline.forEach((event, index) => {
      const nodeId = `node-${index}`;
      const label = `${event.type}\\n${event.startTime - flow.timeline[0].startTime}ms`;
      diagram += `    ${nodeId}["${label}"]\n`;
    });

    // Agregar conexiones
    for (let i = 0; i < flow.timeline.length - 1; i++) {
      const fromNode = `node-${i}`;
      const toNode = `node-${i + 1}`;
      const delay = flow.timeline[i + 1].startTime - flow.timeline[i].startTime;
      diagram += `    ${fromNode} --> |${delay}ms| ${toNode}\n`;
    }

    // Agregar estilos por tipo
    const styleMap = {
      promise: 'fill:#e1f5fe',
      callback: 'fill:#f3e5f5',
      timeout: 'fill:#fff3e0',
      event: 'fill:#e8f5e8'
    };

    flow.timeline.forEach((event, index) => {
      const nodeId = `node-${index}`;
      const style = styleMap[event.type] || 'fill:#f5f5f5';
      diagram += `    style ${nodeId} ${style}\n`;
    });

    return diagram;
  }

  generateTimelineChart(flow: AsyncFlow): TimelineChart {
    const categories = ['promise', 'callback', 'timeout', 'event'];

    return {
      type: 'timeline',
      data: categories.map(category => ({
        category,
        events: flow.timeline
          .filter(event => event.type === category)
          .map(event => ({
            start: event.startTime - flow.timeline[0].startTime,
            end: (event.endTime || Date.now()) - flow.timeline[0].startTime,
            label: event.metadata.operation || `${category} operation`
          }))
      })),
      totalDuration: Math.max(...flow.timeline.map(e => e.endTime || 0)) - flow.timeline[0].startTime
    };
  }
}
```

## Herramientas Prácticas

### 1. Decorador para Async Tracing
```typescript
function traceAsync(operationName?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const operationId = `${operationName || propertyName}-${Date.now()}`;
      const startTime = Date.now();

      console.log(`🚀 Starting async operation: ${operationId}`);

      try {
        const result = await method.apply(this, args);
        const duration = Date.now() - startTime;

        console.log(`✅ Async operation ${operationId} completed in ${duration}ms`);
        return result;

      } catch (error) {
        const duration = Date.now() - startTime;

        console.error(`❌ Async operation ${operationId} failed after ${duration}ms:`, error);

        // Capturar stack trace completo del error asíncrono
        const asyncError = new Error(`Async operation ${operationId} failed`);
        asyncError.stack = (error as Error).stack;

        throw asyncError;
      }
    };

    return descriptor;
  };
}

// Uso
class UserService {
  @traceAsync('user-creation')
  async createUser(userData: UserData): Promise<User> {
    // Implementación
  }

  @traceAsync('user-fetch')
  async getUserById(id: string): Promise<User> {
    // Implementación
  }
}
```

### 2. Middleware de Express para Async Tracing
```typescript
interface AsyncRequestContext {
  requestId: string;
  startTime: number;
  operations: Array<{
    name: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    success?: boolean;
  }>;
}

function asyncTracingMiddleware() {
  const contexts = new Map<string, AsyncRequestContext>();

  return (req: Request, res: Response, next: NextFunction) => {
    const requestId = `req-${Date.now()}-${Math.random()}`;
    const context: AsyncRequestContext = {
      requestId,
      startTime: Date.now(),
      operations: []
    };

    contexts.set(requestId, context);
    req.asyncContext = context;

    // Override res.json para tracing
    const originalJson = res.json;
    res.json = function (data: any) {
      const operation = context.operations.find(op => !op.endTime);
      if (operation) {
        operation.endTime = Date.now();
        operation.duration = operation.endTime - operation.startTime;
        operation.success = true;
      }

      console.log(`📊 Request ${requestId} completed in ${Date.now() - context.startTime}ms`);

      return originalJson.call(this, data);
    };

    res.on('finish', () => {
      contexts.delete(requestId);
    });

    next();
  };
}

// Decorador para operaciones en controladores
function traceOperation(operationName: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = function (req: Request, res: Response, ...args: any[]) {
      const context = req.asyncContext;
      if (context) {
        const operation = {
          name: operationName,
          startTime: Date.now()
        };
        context.operations.push(operation);
      }

      return method.apply(this, [req, res, ...args]);
    };
  };
}
```

## Casos de Estudio

### 1. Debugging de Promise Chain
```typescript
// Problema: Promise rechazada pero el error se pierde
async function processUserData(userId: string) {
  const user = await fetchUser(userId);           // Promise 1
  const permissions = await fetchPermissions(user.role); // Promise 2
  const data = await processData(permissions);   // Promise 3
  return data;                                    // Promise 4
}

// Error ocurre en Promise 2 pero el stack trace solo muestra Promise 4
// Solución: Async tracing completo
processUserData('123')
  .catch(error => {
    console.log('Error stack trace:', error.stack);
    // Solo muestra: "at processData (file.js:15:8)"
    // No muestra que el error original fue en fetchPermissions
  });
```

### 2. Race Condition Detection
```typescript
// Problema: Dos operaciones asíncronas modificando el mismo estado
class UserManager {
  private users = new Map<string, User>();

  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    // Race condition aquí si dos llamadas simultáneas
    const user = this.users.get(userId);
    const updatedUser = { ...user, ...updates };

    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 100));

    this.users.set(userId, updatedUser);
  }
}

// Con async tracing podemos detectar la condición de carrera
```

## Best Practices para Async Tracing

### 1. Instrumentación
- Implementar tracing en todos los puntos clave asíncronos
- Usar identificadores únicos para cada operación
- Mantener metadata relevante para cada contexto
- Capturar timestamps precisos

### 2. Preservación de Contexto
- Mantener el contexto a través de llamadas asíncronas
- Propagar información de tracing entre boundaries
- Usar async storage o mecanismos similares
- Documentar el flujo completo

### 3. Performance
- Minimizar el overhead del tracing
- Usar sampling para operaciones de alta frecuencia
- Almacenar datos eficientemente
- Proveer herramientas de análisis offline

### 4. Debugging
- Proporcionar visualizaciones claras de flujos
- Facilitar la reconstrucción de timelines
- Identificar cuellos de botella y race conditions
- Integrar con herramientas existentes de debugging

## Checklist de Async Tracing

### Implementación
- [ ] Async hooks configurados correctamente
- [ ] Promise tracing implementado
- [ ] Event loop monitoring activo
- [ ] Context preservation asegurado

### Análisis
- [ ] Flujos asíncronos reconstruidos completamente
- [ ] Timelines de eventos generados
- [ ] Race conditions detectadas
- [ ] Performance bottlenecks identificados

### Herramientas
- [ ] Visualizaciones disponibles
- [ ] Reportes generados automáticamente
- [ ] Integración con logging existente
- [ ] Datos exportables para análisis offline