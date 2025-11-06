# Herramientas y Técnicas de Debugging - Stack Completo para Troubleshooting

## Categorías de Herramientas

### 1. Debugging de Código
### 2. Análisis de Performance
### 3. Monitoreo y Logging
### 4. Análisis de Red
### 5. Debugging de Base de Datos
### 6. Herramientas Especializadas

## 1. Debugging de Código

### IDE Debuggers

#### VS Code Debug Configuration
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Node.js",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/src/index.js",
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "restart": true,
      "runtimeExecutable": "nodemon"
    },
    {
      "name": "Debug TypeScript",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/src/index.ts",
      "preLaunchTask": "tsc: build - tsconfig.json",
      "outFiles": ["${workspaceFolder}/dist/**/*.js"]
    },
    {
      "name": "Attach to Process",
      "type": "node",
      "request": "attach",
      "port": 9229,
      "restart": true,
      "localRoot": "${workspaceFolder}",
      "remoteRoot": "${workspaceFolder}"
    }
  ]
}
```

#### Chrome DevTools para Node.js
```javascript
// Iniciar con debugging
node --inspect-brk index.js

// O con inspect para modo no-break
node --inspect index.js

// En Chrome: chrome://inspect
// Click "Open dedicated DevTools for Node"
```

#### Breakpoints Programáticos
```typescript
// Debugging condicional
function processUser(user: User) {
  if (user.id === 'problematic-user-123') {
    debugger; // Break solo para este usuario
  }

  // Logging condicional
  if (process.env.DEBUG_USER) {
    console.log('Processing user:', user);
  }

  // Assertion debugging
  console.assert(user.email.includes('@'), 'Invalid email format', user);
}
```

### Node.js Inspector Avanzado
```javascript
// Habilitar inspector con puerto específico
const inspector = require('inspector');
const fs = require('fs');

function startInspector(port = 9229) {
  inspector.open(port);
  console.log(`Debugger listening on ws://127.0.0.1:${port}`);

  // Guardar sesión de debugging
  const session = new inspector.Session();
  session.connect();

  session.post('Profiler.enable', () => {
    session.post('Profiler.start', () => {
      // Profile por 10 segundos
      setTimeout(() => {
        session.post('Profiler.stop', (err, { profile }) => {
          // Guardar profile
          fs.writeFileSync('./profile.cpuprofile', JSON.stringify(profile));
          console.log('Profile saved to profile.cpuprofile');
        });
      }, 10000);
    });
  });
}

// Usar solo en desarrollo
if (process.env.NODE_ENV === 'development') {
  startInspector();
}
```

## 2. Análisis de Performance

### CPU Profiling
```bash
# Profiling con Node.js
node --prof app.js
node --prof-process isolate-*.log > processed.txt

# Profiling con Clinic.js
npm install -g clinic
clinic doctor -- node app.js
clinic bubbleprof -- node app.js
clinic flame -- node app.js
```

### Memory Profiling
```javascript
// Heap snapshots
const v8 = require('v8');

function takeHeapSnapshot() {
  const snapshot = v8.getHeapSnapshot();
  const fileName = `heap-snapshot-${Date.now()}.heapsnapshot`;
  fs.writeFileSync(fileName, snapshot);
  console.log(`Heap snapshot saved: ${fileName}`);
}

// Memory leak detection
let objects = [];

function memoryLeakExample() {
  objects.push({
    data: new Array(1000000).fill('*'),
    timestamp: Date.now()
  });

  if (objects.length > 100) {
    takeHeapSnapshot();
  }
}

// Monitoreo de memoria
setInterval(() => {
  const usage = process.memoryUsage();
  console.log('Memory Usage:', {
    rss: `${Math.round(usage.rss / 1024 / 1024)} MB`,
    heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)} MB`,
    heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)} MB`,
    external: `${Math.round(usage.external / 1024 / 1024)} MB`
  });
}, 5000);
```

### Performance Hooks
```javascript
const { performance, PerformanceObserver } = require('perf_hooks');

// Medir duración de funciones
function measurePerformance(name: string, fn: Function) {
  return function (...args: any[]) {
    const start = performance.now();
    const result = fn.apply(this, args);
    const end = performance.now();

    console.log(`${name} took ${end - start} milliseconds`);
    return result;
  };
}

// Observador de performance
const obs = new PerformanceObserver((list) => {
  const entries = list.getEntries();
  entries.forEach((entry) => {
    console.log(`${entry.name}: ${entry.duration}ms`);
  });
});

obs.observe({ entryTypes: ['measure', 'navigation', 'resource'] });

// Uso
performance.mark('startProcess');
// ... código a medir
performance.mark('endProcess');
performance.measure('processDuration', 'startProcess', 'endProcess');
```

## 3. Monitoreo y Logging

### Structured Logging
```typescript
interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context?: Record<string, any>;
  traceId?: string;
  userId?: string;
  error?: Error;
}

class StructuredLogger {
  private logs: LogEntry[] = [];

  log(entry: Omit<LogEntry, 'timestamp'>): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      ...entry
    };

    this.logs.push(logEntry);

    // Formato para diferentes outputs
    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify(logEntry));
    } else {
      this.formatForConsole(logEntry);
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log({ level: 'debug', message, context });
  }

  info(message: string, context?: Record<string, any>): void {
    this.log({ level: 'info', message, context });
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log({ level: 'warn', message, context });
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    this.log({ level: 'error', message, error, context });
  }

  private formatForConsole(entry: LogEntry): void {
    const colorMap = {
      debug: '\x1b[36m', // cyan
      info: '\x1b[32m',  // green
      warn: '\x1b[33m',  // yellow
      error: '\x1b[31m'  // red
    };

    const reset = '\x1b[0m';
    const color = colorMap[entry.level];

    console.log(
      `${color}[${entry.level.toUpperCase()}]${reset} ` +
      `${entry.timestamp} - ${entry.message}`,
      entry.context || '',
      entry.error ? `\n${entry.error.stack}` : ''
    );
  }

  getLogsByLevel(level: LogEntry['level']): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Middleware para Express
function requestLogger(logger: StructuredLogger) {
  return (req: Request, res: Response, next: NextFunction) => {
    const traceId = req.headers['x-trace-id'] as string || generateTraceId();
    req.traceId = traceId;

    const start = Date.now();

    res.on('finish', () => {
      logger.info('HTTP Request', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: Date.now() - start,
        userAgent: req.headers['user-agent'],
        ip: req.ip,
        traceId
      });
    });

    next();
  };
}
```

### Error Tracking
```typescript
class ErrorTracker {
  private errors: Array<{
    error: Error;
    context: Record<string, any>;
    timestamp: Date;
    fingerprint: string;
  }> = [];

  track(error: Error, context?: Record<string, any>): void {
    const fingerprint = this.generateFingerprint(error);

    this.errors.push({
      error,
      context: context || {},
      timestamp: new Date(),
      fingerprint
    });

    // Agregar a stack trace actual
    Error.captureStackTrace(error, this.track);

    console.error('Error tracked:', {
      message: error.message,
      stack: error.stack,
      fingerprint,
      context
    });
  }

  private generateFingerprint(error: Error): string {
    // Generar fingerprint único para el error
    const stack = error.stack || '';
    const message = error.message;
    const relevantStack = stack.split('\n').slice(0, 5).join('');

    return require('crypto')
      .createHash('md5')
      .update(message + relevantStack)
      .digest('hex');
  }

  getErrorGroups(): Array<{
    fingerprint: string;
    count: number;
    lastOccurrence: Date;
    sampleError: Error;
  }> {
    const groups = new Map();

    this.errors.forEach(({ error, fingerprint, timestamp }) => {
      if (!groups.has(fingerprint)) {
        groups.set(fingerprint, {
          fingerprint,
          count: 0,
          lastOccurrence: timestamp,
          sampleError: error
        });
      }

      const group = groups.get(fingerprint);
      group.count++;
      if (timestamp > group.lastOccurrence) {
        group.lastOccurrence = timestamp;
      }
    });

    return Array.from(groups.values());
  }
}
```

## 4. Análisis de Red

### HTTP Debugging
```typescript
class HTTPDebugger {
  private requests: Array<{
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: any;
    response?: {
      status: number;
      headers: Record<string, string>;
      body?: any;
    };
    duration: number;
    timestamp: Date;
  }> = [];

  debugFetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
    const start = Date.now();
    const method = init?.method || 'GET';
    const url = typeof input === 'string' ? input : input.url;

    console.log(`🌐 ${method} ${url}`, init?.headers);

    return fetch(input, init).then(response => {
      const duration = Date.now() - start;

      this.requests.push({
        method,
        url,
        headers: init?.headers as Record<string, string> || {},
        body: init?.body,
        response: {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries())
        },
        duration,
        timestamp: new Date()
      });

      console.log(`📡 ${response.status} ${method} ${url} (${duration}ms)`);

      return response;
    }).catch(error => {
      const duration = Date.now() - start;
      console.error(`❌ ${method} ${url} failed after ${duration}ms:`, error.message);

      this.requests.push({
        method,
        url,
        headers: init?.headers as Record<string, string> || {},
        body: init?.body,
        duration,
        timestamp: new Date()
      });

      throw error;
    });
  }

  getSlowRequests(threshold: number = 1000): typeof this.requests {
    return this.requests.filter(req => req.duration > threshold);
  }

  getFailedRequests(): typeof this.requests {
    return this.requests.filter(req => !req.response || req.response.status >= 400);
  }

  getRequestStats() {
    if (this.requests.length === 0) return null;

    const durations = this.requests.map(req => req.duration);
    const successCount = this.requests.filter(req => req.response && req.response.status < 400).length;

    return {
      total: this.requests.length,
      success: successCount,
      failure: this.requests.length - successCount,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      maxDuration: Math.max(...durations),
      minDuration: Math.min(...durations)
    };
  }
}

// Reemplazar fetch global
const httpDebugger = new HTTPDebugger();
global.fetch = httpDebugger.debugFetch.bind(httpDebugger);
```

### WebSocket Debugging
```typescript
class WebSocketDebugger {
  private connections: Map<string, WebSocket> = new Map();
  private messages: Array<{
    connectionId: string;
    type: 'sent' | 'received';
    data: any;
    timestamp: Date;
  }> = [];

  createDebugWebSocket(url: string, protocols?: string | string[]): WebSocket {
    const connectionId = generateConnectionId();
    const ws = new WebSocket(url, protocols);

    this.connections.set(connectionId, ws);

    ws.onopen = () => {
      console.log(`🔌 WebSocket ${connectionId} connected to ${url}`);
    };

    ws.onmessage = (event) => {
      const data = this.parseMessage(event.data);
      this.messages.push({
        connectionId,
        type: 'received',
        data,
        timestamp: new Date()
      });

      console.log(`📨 WebSocket ${connectionId} received:`, data);
    };

    ws.onerror = (error) => {
      console.error(`❌ WebSocket ${connectionId} error:`, error);
    };

    ws.onclose = () => {
      console.log(`🔌 WebSocket ${connectionId} disconnected`);
      this.connections.delete(connectionId);
    };

    // Wrap send method for debugging
    const originalSend = ws.send.bind(ws);
    ws.send = (data) => {
      const parsedData = this.parseMessage(data);
      this.messages.push({
        connectionId,
        type: 'sent',
        data: parsedData,
        timestamp: new Date()
      });

      console.log(`📤 WebSocket ${connectionId} sent:`, parsedData);
      return originalSend(data);
    };

    return ws;
  }

  private parseMessage(data: string | ArrayBuffer | Blob): any {
    try {
      if (typeof data === 'string') {
        return JSON.parse(data);
      }
      return data;
    } catch {
      return data;
    }
  }

  getConnectionHistory(connectionId: string) {
    return this.messages.filter(msg => msg.connectionId === connectionId);
  }
}
```

## 5. Debugging de Base de Datos

### Query Debugging
```typescript
class DatabaseDebugger {
  private queries: Array<{
    sql: string;
    params: any[];
    duration: number;
    timestamp: Date;
    result?: any;
    error?: Error;
  }> = [];

  async debugQuery<T>(sql: string, params: any[] = []): Promise<T> {
    const start = Date.now();
    console.log(`🗄️ Query: ${sql}`, params);

    try {
      const result = await this.executeQuery<T>(sql, params);
      const duration = Date.now() - start;

      this.queries.push({
        sql,
        params,
        duration,
        timestamp: new Date(),
        result
      });

      console.log(`✅ Query completed in ${duration}ms`);
      return result;

    } catch (error) {
      const duration = Date.now() - start;

      this.queries.push({
        sql,
        params,
        duration,
        timestamp: new Date(),
        error: error as Error
      });

      console.error(`❌ Query failed after ${duration}ms:`, error);
      throw error;
    }
  }

  private async executeQuery<T>(sql: string, params: any[]): Promise<T> {
    // Implementación específica del driver
    // Ejemplo con PostgreSQL:
    return await pool.query(sql, params);
  }

  getSlowQueries(threshold: number = 1000) {
    return this.queries.filter(q => q.duration > threshold);
  }

  getFailedQueries() {
    return this.queries.filter(q => q.error);
  }

  analyzeQueryPatterns() {
    const patterns = new Map();

    this.queries.forEach(query => {
      // Normalizar SQL quitando parámetros
      const normalized = query.sql.replace(/\$\d+/g, '?');

      if (!patterns.has(normalized)) {
        patterns.set(normalized, {
          count: 0,
          totalDuration: 0,
          avgDuration: 0,
          maxDuration: 0,
          failures: 0
        });
      }

      const pattern = patterns.get(normalized);
      pattern.count++;
      pattern.totalDuration += query.duration;
      pattern.avgDuration = pattern.totalDuration / pattern.count;
      pattern.maxDuration = Math.max(pattern.maxDuration, query.duration);

      if (query.error) {
        pattern.failures++;
      }
    });

    return Array.from(patterns.entries())
      .map(([sql, stats]) => ({ sql, stats }))
      .sort((a, b) => b.stats.avgDuration - a.stats.avgDuration);
  }
}
```

### Connection Pool Debugging
```typescript
class ConnectionPoolDebugger {
  private connections: Array<{
    id: string;
    created: Date;
    lastUsed: Date;
    inUse: boolean;
    queryCount: number;
  }> = [];

  private getConnectionStats() {
    const now = Date.now();
    const active = this.connections.filter(conn => conn.inUse);
    const idle = this.connections.filter(conn => !conn.inUse);
    const oldConnections = this.connections.filter(
      conn => now - conn.lastUsed.getTime() > 5 * 60 * 1000 // 5 minutos
    );

    return {
      total: this.connections.length,
      active: active.length,
      idle: idle.length,
      old: oldConnections.length,
      avgQueriesPerConnection: this.connections.reduce((sum, conn) => sum + conn.queryCount, 0) / this.connections.length
    };
  }

  monitorConnectionPool(intervalMs: number = 10000) {
    setInterval(() => {
      const stats = this.getConnectionStats();
      console.log('🔗 Connection Pool Stats:', stats);

      if (stats.old > 0) {
        console.warn(`⚠️ ${stats.old} unused connections older than 5 minutes`);
      }

      if (stats.active === stats.total) {
        console.warn('⚠️ All connections are in use - consider increasing pool size');
      }
    }, intervalMs);
  }
}
```

## 6. Herramientas Especializadas

### Memory Leak Detection
```typescript
class MemoryLeakDetector {
  private snapshots: Array<{
    timestamp: Date;
    heapUsed: number;
    heapTotal: number;
    external: number;
    objects: Map<string, number>;
  }> = [];

  takeSnapshot() {
    const usage = process.memoryUsage();
    const objects = new Map();

    // Contar objetos por tipo (simplificado)
    if (global.gc) {
      global.gc(); // Forzar garbage collection
    }

    this.snapshots.push({
      timestamp: new Date(),
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external,
      objects
    });

    // Mantener solo últimas 20 snapshots
    if (this.snapshots.length > 20) {
      this.snapshots.shift();
    }
  }

  detectLeaks(): MemoryLeakReport {
    if (this.snapshots.length < 3) {
      return { hasLeaks: false, reason: 'Insufficient data' };
    }

    const recent = this.snapshots.slice(-3);
    const trend = this.calculateTrend(recent.map(s => s.heapUsed));

    if (trend > 0.1) { // 10% growth trend
      return {
        hasLeaks: true,
        growthRate: trend,
        suspectedObjects: this.analyzeGrowthByType(),
        recommendation: 'Consider profiling heap snapshots'
      };
    }

    return { hasLeaks: false, growthRate: trend };
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;

    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope / values[0]; // Normalizar por valor inicial
  }

  startMonitoring(intervalMs: number = 30000) {
    setInterval(() => {
      this.takeSnapshot();
      const report = this.detectLeaks();

      if (report.hasLeaks) {
        console.warn('🚨 Memory leak detected:', report);
      }
    }, intervalMs);
  }
}

interface MemoryLeakReport {
  hasLeaks: boolean;
  growthRate?: number;
  suspectedObjects?: Array<{ type: string; growth: number }>;
  recommendation?: string;
  reason?: string;
}
```

### Race Condition Detection
```typescript
class RaceConditionDetector {
  private operations: Array<{
    id: string;
    resource: string;
    operation: string;
    startTime: Date;
    endTime?: Date;
    threadId: string;
  }> = [];

  startOperation(resource: string, operation: string, threadId: string = 'main'): string {
    const id = generateOperationId();

    this.operations.push({
      id,
      resource,
      operation,
      startTime: new Date(),
      threadId
    });

    // Check for potential race conditions
    this.checkRaceConditions(id, resource, operation);

    return id;
  }

  endOperation(id: string) {
    const operation = this.operations.find(op => op.id === id);
    if (operation) {
      operation.endTime = new Date();
    }
  }

  private checkRaceConditions(currentId: string, resource: string, operation: string) {
    const concurrentOperations = this.operations.filter(op =>
      op.resource === resource &&
      op.id !== currentId &&
      !op.endTime // Still running
    );

    concurrentOperations.forEach(concurrentOp => {
      if (this.areConflictingOperations(operation, concurrentOp.operation)) {
        console.warn('⚠️ Potential race condition detected:', {
          resource,
          operations: [operation, concurrentOp.operation],
          threads: [concurrentOp.threadId, 'current'],
          timestamp: new Date()
        });
      }
    });
  }

  private areConflictingOperations(op1: string, op2: string): boolean {
    const conflicts = [
      ['read', 'write'],
      ['write', 'read'],
      ['write', 'write']
    ];

    return conflicts.some(([a, b]) =>
      (op1.includes(a) && op2.includes(b)) ||
      (op2.includes(a) && op1.includes(b))
    );
  }
}

// Decorator para funciones asíncronas
function detectRaceConditions(resource: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const detector = new RaceConditionDetector();

    descriptor.value = async function (...args: any[]) {
      const operationId = detector.startOperation(resource, propertyName);

      try {
        const result = await method.apply(this, args);
        return result;
      } finally {
        detector.endOperation(operationId);
      }
    };

    return descriptor;
  };
}
```

## Integración de Herramientas

### Debugger Unificado
```typescript
class UnifiedDebugger {
  private loggers = {
    structured: new StructuredLogger(),
    errors: new ErrorTracker(),
    http: new HTTPDebugger(),
    database: new DatabaseDebugger(),
    memory: new MemoryLeakDetector(),
    races: new RaceConditionDetector()
  };

  initialize() {
    // Iniciar monitoreo automático
    this.loggers.memory.startMonitoring();
    this.loggers.structured.log({
      level: 'info',
      message: 'Debugging suite initialized'
    });
  }

  async createDebugReport(): Promise<DebugReport> {
    return {
      timestamp: new Date(),
      errors: this.loggers.errors.getErrorGroups(),
      httpStats: this.loggers.http.getRequestStats(),
      slowQueries: this.loggers.database.getSlowQueries(),
      memoryReport: this.loggers.memory.detectLeaks(),
      systemInfo: this.getSystemInfo()
    };
  }

  private getSystemInfo() {
    return {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      memory: process.memoryUsage(),
      uptime: process.uptime()
    };
  }
}

interface DebugReport {
  timestamp: Date;
  errors: any[];
  httpStats: any;
  slowQueries: any[];
  memoryReport: MemoryLeakReport;
  systemInfo: any;
}

// Uso global
const debugger = new UnifiedDebugger();
debugger.initialize();

export default debugger;
```

## Best Practices de Debugging

### 1. Preparación del Ambiente
- **Environment consistente**: Misma configuración en dev y producción
- **Datos de prueba controlados**: Datos predecibles y reproducibles
- **Logging estructurado**: Logs consistentes y consultables
- **Monitoreo continuo**: Detectar problemas antes de que impacten

### 2. Durante el Debugging
- **Documentar todo**: Qué se prueba, resultados obtenidos
- **Cambiar una variable a la vez**: Aislamiento de causas
- **Reproducir consistentemente**: Asegurar que el problema es reproducible
- **Guardar evidencia**: Logs, screenshots, traces

### 3. Post-Debugging
- **Actualizar tests**: Añadir tests para prevenir regresiones
- **Documentar lecciones**: Compartir findings con el equipo
- **Mejorar herramientas**: Basado en lo que funcionó/no funcionó
- **Automatizar detección**: Scripts para detectar problemas similares en el futuro

## Checklist de Herramientas

### Configuración Inicial
- [ ] IDE debugger configurado
- [ ] Logging estructurado implementado
- [ ] Error tracking activado
- [ ] Performance monitoring configurado
- [ ] Debug reports automatizados

### Herramientas Específicas
- [ ] CPU profiler disponible
- [ ] Memory profiler configurado
- [ ] Network debugging activado
- [ ] Database query logging habilitado
- [ ] Race condition detection donde aplique

### Validación
- [ ] Todas las herramientas generan datos útiles
- [ ] Los datos pueden ser analizados eficientemente
- [ ] El impacto en performance es mínimo
- [ ] Los datos son seguros y no contienen información sensible