# Herramientas de Tracing - Stack Completo para Análisis Avanzado

## Categorías de Herramientas

### 1. Herramientas de Stack Trace
### 2. Herramientas de Async Tracing
### 3. Herramientas de Performance Tracing
### 4. Herramientas de Distributed Tracing
### 5. Herramientas de Visualización

## 1. Herramientas de Stack Trace

### Chrome DevTools Protocol
```typescript
import { ChromeLauncher } from 'chrome-launcher';
import { CDP } from 'chrome-remote-interface';

class ChromeTracingTool {
  private client: any;
  private port: number;

  async startTracing(url: string): Promise<void> {
    // Iniciar Chrome con debugging
    this.port = await this.findAvailablePort();
    const chrome = await ChromeLauncher.launch({
      startingUrl: url,
      port: this.port,
      chromeFlags: ['--remote-debugging-port=' + this.port]
    });

    // Conectar al protocolo
    this.client = await CDP({ port: this.port });
    await this.client.Runtime.enable();
    await this.client.Debugger.enable();
    await this.client.Profiler.enable();

    // Configurar tracing
    await this.client.Tracing.start({
      categories: [
        'devtools.timeline',
        'v8.execute',
        'blink.console',
        'blink.user_timing',
        'disabled-by-default-devtools.timeline'
      ],
      options: 'record-as-much-as-possible'
    });

    console.log('🔍 Chrome tracing started on port', this.port);
  }

  async captureStackTrace(): Promise<StackTraceData> {
    try {
      // Capturar excepciones
      await this.client.Debugger.setPauseOnExceptions('all');

      // Esperar por excepción o timeout
      const exception = await this.waitForException(30000); // 30s timeout

      if (exception) {
        return {
          stackTrace: exception.exceptionDetails.stackTrace,
          timestamp: exception.timestamp,
          exceptionDetails: exception.exceptionDetails
        };
      }

      throw new Error('No exception captured within timeout');

    } finally {
      await this.stopTracing();
    }
  }

  async stopTracing(): Promise<void> {
    if (this.client) {
      const tracingData = await this.client.Tracing.end();
      await this.client.close();
      console.log('✅ Tracing completed');
      return tracingData;
    }
  }

  private async waitForException(timeout: number): Promise<any> {
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(null), timeout);

      this.client.Debugger.paused((exception) => {
        clearTimeout(timer);
        resolve(exception);
      });
    });
  }
}
```

### Enhanced Error Capturing
```typescript
class EnhancedStackTraceTool {
  private sourceMaps = new Map<string, any>();

  async captureDetailedError(error: Error, context?: any): Promise<DetailedErrorInfo> {
    const stackTrace = this.parseStackTrace(error.stack || '');

    return {
      message: error.message,
      name: error.name,
      stackTrace: await this.enhanceStackTrace(stackTrace),
      context: this.captureExecutionContext(context),
      systemInfo: this.captureSystemInfo(),
      memoryInfo: await this.captureMemoryInfo(),
      performanceInfo: this.capturePerformanceInfo()
    };
  }

  private async enhanceStackTrace(stackTrace: StackTrace): Promise<EnhancedStackTrace> {
    const enhancedFrames = await Promise.all(
      stackTrace.frames.map(frame => this.enhanceFrame(frame))
    );

    return {
      ...stackTrace,
      frames: enhancedFrames,
      callGraph: this.buildCallGraph(enhancedFrames),
      sourceContext: await this.extractSourceContext(enhancedFrames)
    };
  }

  private async enhanceFrame(frame: StackFrame): Promise<EnhancedStackFrame> {
    let sourceCode = '';
    let localVariables = {};

    try {
      // Intentar obtener código fuente
      sourceCode = await this.loadSourceCode(frame.fileName);

      // Aplicar source maps si están disponibles
      const originalPosition = await this.applySourceMap(frame);
      if (originalPosition) {
        frame = { ...frame, ...originalPosition };
      }

      // Extraer contexto del código fuente
      const context = this.extractCodeContext(sourceCode, frame.lineNumber, frame.columnNumber);

      return {
        ...frame,
        sourceCode: context.code,
        preContext: context.pre,
        postContext: context.post,
        functionSignature: this.extractFunctionSignature(sourceCode, frame.lineNumber)
      };

    } catch (error) {
      return {
        ...frame,
        sourceCode: '// Source code not available',
        preContext: [],
        postContext: [],
        functionSignature: frame.functionName
      };
    }
  }

  private extractCodeContext(source: string, line: number, column: number): CodeContext {
    const lines = source.split('\n');
    const contextLines = 3; // 3 líneas antes y después

    const preLines = lines.slice(Math.max(0, line - 1 - contextLines), line - 1);
    const targetLine = lines[line - 1] || '';
    const postLines = lines.slice(line, line + contextLines);

    return {
      code: targetLine,
      pre: preLines.map((l, i) => ({
        line: line - contextLines + i,
        code: l
      })),
      post: postLines.map((l, i) => ({
        line: line + 1 + i,
        code: l
      }))
    };
  }

  buildCallGraph(frames: EnhancedStackFrame[]): CallGraph {
    const graph: CallGraph = {
      nodes: [],
      edges: []
    };

    frames.forEach((frame, index) => {
      graph.nodes.push({
        id: `node-${index}`,
        label: frame.functionName || '<anonymous>',
        file: frame.fileName,
        line: frame.lineNumber,
        type: this.getNodeType(frame)
      });

      if (index > 0) {
        graph.edges.push({
          from: `node-${index - 1}`,
          to: `node-${index}`,
          label: 'calls'
        });
      }
    });

    return graph;
  }
}
```

## 2. Herramientas de Async Tracing

### Async Hooks Implementation
```typescript
import { AsyncLocalStorage } from 'async_hooks';

class AdvancedAsyncTracer {
  private asyncLocalStorage: AsyncLocalStorage<AsyncContext>;
  private operations = new Map<string, AsyncOperation>();
  private relationships = new Map<string, string[]>();

  constructor() {
    this.asyncLocalStorage = new AsyncLocalStorage();
    this.setupAsyncHooks();
  }

  private setupAsyncHooks(): void {
    const asyncHook = require('async_hooks').createHook({
      init: (asyncId: number, type: string, triggerAsyncId: number) => {
        this.handleAsyncInit(asyncId, type, triggerAsyncId);
      },
      before: (asyncId: number) => {
        this.handleAsyncBefore(asyncId);
      },
      after: (asyncId: number) => {
        this.handleAsyncAfter(asyncId);
      },
      promiseResolve: (asyncId: number) => {
        this.handlePromiseResolve(asyncId);
      },
      destroy: (asyncId: number) => {
        this.handleAsyncDestroy(asyncId);
      }
    });

    asyncHook.enable();
  }

  traceAsyncOperation<T>(
    operationName: string,
    fn: (context: AsyncContext) => Promise<T>,
    metadata?: any
  ): Promise<T> {
    const operationId = this.generateOperationId();
    const context: AsyncContext = {
      id: operationId,
      name: operationName,
      startTime: Date.now(),
      metadata: metadata || {},
      parentId: this.getCurrentOperationId(),
      traceId: this.getCurrentTraceId()
    };

    this.operations.set(operationId, context);

    return this.asyncLocalStorage.run(context, async () => {
      try {
        console.log(`🚀 Starting async operation: ${operationName} (${operationId})`);
        const result = await fn(context);
        this.markOperationComplete(operationId, result);
        return result;
      } catch (error) {
        this.markOperationFailed(operationId, error as Error);
        throw error;
      }
    });
  }

  private handleAsyncInit(asyncId: number, type: string, triggerAsyncId: number): void {
    const currentContext = this.asyncLocalStorage.getStore();
    if (!currentContext) return;

    const operation: AsyncOperation = {
      id: asyncId.toString(),
      type,
      triggerId: triggerAsyncId.toString(),
      startTime: Date.now(),
      parentId: currentContext.id,
      traceId: currentContext.traceId,
      metadata: {}
    };

    this.operations.set(operation.id, operation);

    // Registrar relación
    if (!this.relationships.has(triggerAsyncId.toString())) {
      this.relationships.set(triggerAsyncId.toString(), []);
    }
    this.relationships.get(triggerAsyncId.toString())!.push(operation.id);
  }

  generateTraceReport(traceId: string): TraceReport {
    const traceOperations = Array.from(this.operations.values())
      .filter(op => op.traceId === traceId)
      .sort((a, b) => a.startTime - b.startTime);

    return {
      traceId,
      operations: traceOperations,
      timeline: this.buildTimeline(traceOperations),
      callTree: this.buildCallTree(traceOperations),
      performanceMetrics: this.calculatePerformanceMetrics(traceOperations),
      errors: traceOperations.filter(op => op.status === 'failed')
    };
  }

  private buildCallTree(operations: AsyncOperation[]): CallTreeNode {
    const nodeMap = new Map<string, CallTreeNode>();
    const rootNodes: CallTreeNode[] = [];

    // Crear nodos
    operations.forEach(op => {
      nodeMap.set(op.id, {
        operation: op,
        children: [],
        duration: op.endTime ? op.endTime - op.startTime : undefined,
        depth: 0
      });
    });

    // Construir jerarquía
    operations.forEach(op => {
      const node = nodeMap.get(op.id)!;
      if (op.parentId && nodeMap.has(op.parentId)) {
        const parent = nodeMap.get(op.parentId)!;
        parent.children.push(node);
        node.depth = parent.depth + 1;
      } else {
        rootNodes.push(node);
      }
    });

    return rootNodes.length === 1 ? rootNodes[0] : {
      operation: { name: 'root', id: 'root', startTime: 0 } as AsyncOperation,
      children: rootNodes,
      duration: Math.max(...operations.map(op => op.endTime || 0)),
      depth: 0
    };
  }
}
```

### Promise Chain Tracer
```typescript
class PromiseChainTracer {
  private chains = new Map<string, PromiseChain>();

  tracePromise<T>(
    promise: Promise<T>,
    chainName: string,
    metadata?: any
  ): TrackedPromise<T> {
    const chainId = this.generateChainId();
    const startTime = Date.now();

    const chain: PromiseChain = {
      id: chainId,
      name: chainName,
      startTime,
      metadata: metadata || {},
      steps: [],
      status: 'pending'
    };

    this.chains.set(chainId, chain);

    const trackedPromise = promise
      .then(result => {
        this.addChainStep(chainId, 'resolve', result);
        chain.status = 'fulfilled';
        chain.endTime = Date.now();
        chain.duration = chain.endTime - chain.startTime;
        return result;
      })
      .catch(error => {
        this.addChainStep(chainId, 'reject', error);
        chain.status = 'rejected';
        chain.endTime = Date.now();
        chain.duration = chain.endTime - chain.startTime;
        throw error;
      });

    return {
      promise: trackedPromise,
      chainId,
      getChain: () => this.chains.get(chainId)
    };
  }

  private addChainStep(chainId: string, type: 'resolve' | 'reject' | 'then' | 'catch', value: any): void {
    const chain = this.chains.get(chainId);
    if (!chain) return;

    const step: PromiseChainStep = {
      id: this.generateStepId(),
      type,
      timestamp: Date.now(),
      value,
      stackTrace: new Error().stack || ''
    };

    chain.steps.push(step);

    // Detectar patrones problemáticos
    this.detectProblematicPatterns(chainId, step);
  }

  private detectProblematicPatterns(chainId: string, step: PromiseChainStep): void {
    const chain = this.chains.get(chainId);
    if (!chain) return;

    // Pattern 1: Chain muy largo
    if (chain.steps.length > 10) {
      console.warn(`⚠️ Long promise chain detected: ${chain.name} (${chain.steps.length} steps)`);
    }

    // Pattern 2: Muchos rechazos
    const rejectionCount = chain.steps.filter(s => s.type === 'reject').length;
    if (rejectionCount > 3) {
      console.warn(`⚠️ High rejection rate in promise chain: ${chain.name}`);
    }

    // Pattern 3: Timeout sospechoso
    const duration = step.timestamp - chain.startTime;
    if (duration > 30000) { // 30s
      console.warn(`⚠️ Long-running promise chain: ${chain.name} (${duration}ms)`);
    }
  }

  analyzePromiseChains(): PromiseChainAnalysis {
    const chains = Array.from(this.chains.values());

    return {
      totalChains: chains.length,
      averageSteps: chains.reduce((sum, chain) => sum + chain.steps.length, 0) / chains.length,
      rejectionRate: chains.filter(c => c.status === 'rejected').length / chains.length,
      averageDuration: chains.reduce((sum, chain) => sum + (chain.duration || 0), 0) / chains.length,
      problematicChains: chains.filter(chain =>
        chain.steps.length > 10 ||
        (chain.duration || 0) > 30000 ||
        chain.status === 'rejected'
      )
    };
  }
}
```

## 3. Herramientas de Performance Tracing

### CPU Profiler
```typescript
class CPUProfiler {
  private isProfiling = false;
  private samples: CPUSample[] = [];
  private intervalId?: NodeJS.Timeout;

  startProfiling(sampleInterval: number = 100): void {
    if (this.isProfiling) {
      throw new Error('Profiling already started');
    }

    this.isProfiling = true;
    console.log(`🔬 CPU profiling started (interval: ${sampleInterval}ms)`);

    this.intervalId = setInterval(() => {
      this.collectSample();
    }, sampleInterval);
  }

  stopProfiling(): CPUProfile {
    if (!this.isProfiling) {
      throw new Error('Profiling not started');
    }

    this.isProfiling = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    console.log(`✅ CPU profiling stopped. Collected ${this.samples.length} samples`);

    return this.generateProfile();
  }

  private collectSample(): void {
    const sample: CPUSample = {
      timestamp: Date.now(),
      stackTrace: new Error().stack || '',
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage()
    };

    this.samples.push(sample);
  }

  private generateProfile(): CPUProfile {
    const profile: CPUProfile = {
      samples: this.samples,
      duration: this.samples[this.samples.length - 1].timestamp - this.samples[0].timestamp,
      topFunctions: this.analyzeTopFunctions(),
      memoryTrend: this.analyzeMemoryTrend(),
      hotspots: this.identifyHotspots()
    };

    return profile;
  }

  private analyzeTopFunctions(): FunctionStats[] {
    const functionCounts = new Map<string, number>();

    this.samples.forEach(sample => {
      const lines = sample.stackTrace.split('\n');
      lines.forEach(line => {
        const match = line.match(/at\s+(.+?)\s+\(/);
        if (match) {
          const functionName = match[1];
          functionCounts.set(functionName, (functionCounts.get(functionName) || 0) + 1);
        }
      });
    });

    return Array.from(functionCounts.entries())
      .map(([name, count]) => ({
        name,
        count,
        percentage: (count / this.samples.length) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20); // Top 20 functions
  }

  private identifyHotspots(): Hotspot[] {
    const hotspots: Hotspot[] = [];
    const timeWindows = this.groupSamplesByTimeWindow(1000); // 1s windows

    timeWindows.forEach((window, index) => {
      if (window.length > this.samples.length / timeWindows.length * 2) {
        hotspots.push({
          startTime: window[0].timestamp,
          endTime: window[window.length - 1].timestamp,
          sampleCount: window.length,
          dominantFunction: this.getDominantFunction(window)
        });
      }
    });

    return hotspots;
  }
}
```

### Memory Profiler
```typescript
class MemoryProfiler {
  private heapSnapshots: HeapSnapshot[] = [];
  private allocationSites = new Map<string, AllocationSite>();

  takeHeapSnapshot(label?: string): HeapSnapshot {
    const snapshot: HeapSnapshot = {
      id: this.generateSnapshotId(),
      label: label || `Snapshot ${this.heapSnapshots.length + 1}`,
      timestamp: Date.now(),
      heapUsage: process.memoryUsage(),
      objects: this.captureObjectTypes(),
      allocationSites: new Map(this.allocationSites)
    };

    this.heapSnapshots.push(snapshot);
    console.log(`📸 Heap snapshot taken: ${snapshot.label}`);

    return snapshot;
  }

  compareSnapshots(snapshot1: HeapSnapshot, snapshot2: HeapSnapshot): HeapComparison {
    const comparison: HeapComparison = {
      snapshot1,
      snapshot2,
      timeDiff: snapshot2.timestamp - snapshot1.timestamp,
      heapGrowth: snapshot2.heapUsage.heapUsed - snapshot1.heapUsage.heapUsed,
      objectChanges: this.compareObjectTypes(snapshot1, snapshot2),
      newAllocations: this.identifyNewAllocations(snapshot1, snapshot2),
      potentialLeaks: this.identifyPotentialLeaks(snapshot1, snapshot2)
    };

    return comparison;
  }

  private captureObjectTypes(): Map<string, number> {
    // Implementación simplificada
    const types = new Map<string, number>();

    // Forzar garbage collection para obtener snapshot preciso
    if (global.gc) {
      global.gc();
    }

    // Aquí iría la lógica real para capturar tipos de objetos
    // Esto requeriría herramientas como v8-profiler-next
    types.set('Object', 1000);
    types.set('Array', 500);
    types.set('String', 2000);

    return types;
  }

  private identifyPotentialLeaks(snapshot1: HeapSnapshot, snapshot2: HeapSnapshot): PotentialLeak[] {
    const leaks: PotentialLeak[] = [];

    // Comparar crecimiento de objetos por tipo
    snapshot2.objects.forEach((count2, type) => {
      const count1 = snapshot1.objects.get(type) || 0;
      const growth = count2 - count1;

      if (growth > 0 && this.isLeakyType(type)) {
        leaks.push({
          type,
          growth,
          growthRate: growth / count1,
          severity: this.calculateLeakSeverity(growth, count1)
        });
      }
    });

    return leaks.sort((a, b) => b.growth - a.growth);
  }

  trackAllocation(objectType: string, size: number): void {
    const site = this.allocationSites.get(objectType) || {
      type: objectType,
      allocations: 0,
      totalSize: 0,
      firstSeen: Date.now(),
      lastSeen: Date.now()
    };

    site.allocations++;
    site.totalSize += size;
    site.lastSeen = Date.now();

    this.allocationSites.set(objectType, site);
  }

  generateMemoryReport(): MemoryReport {
    const latestSnapshot = this.heapSnapshots[this.heapSnapshots.length - 1];
    const baseline = this.heapSnapshots[0];

    if (!latestSnapshot) {
      throw new Error('No snapshots available');
    }

    const comparison = baseline ? this.compareSnapshots(baseline, latestSnapshot) : null;

    return {
      currentSnapshot: latestSnapshot,
      baseline,
      comparison,
      allocationSites: Array.from(this.allocationSites.values()),
      recommendations: this.generateMemoryRecommendations(latestSnapshot, comparison)
    };
  }
}
```

## 4. Herramientas de Distributed Tracing

### Distributed Context Propagation
```typescript
interface DistributedContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  baggage: Map<string, string>;
  flags: number;
}

class DistributedTracer {
  private activeSpans = new Map<string, Span>();
  private spanStack: Span[] = [];

  startSpan(operationName: string, parentContext?: DistributedContext): Span {
    const traceId = parentContext?.traceId || this.generateTraceId();
    const spanId = this.generateSpanId();
    const parentSpanId = parentContext?.spanId;

    const span: Span = {
      traceId,
      spanId,
      parentSpanId,
      operationName,
      startTime: Date.now(),
      endTime: undefined,
      tags: new Map(),
      logs: [],
      status: 'running'
    };

    this.activeSpans.set(spanId, span);
    this.spanStack.push(span);

    return span;
  }

  finishSpan(spanId: string, status: SpanStatus = 'ok'): void {
    const span = this.activeSpans.get(spanId);
    if (!span) return;

    span.endTime = Date.now();
    span.status = status;
    span.duration = span.endTime - span.startTime;

    // Remover del stack
    const index = this.spanStack.findIndex(s => s.spanId === spanId);
    if (index !== -1) {
      this.spanStack.splice(index, 1);
    }

    console.log(`✅ Span finished: ${span.operationName} (${span.duration}ms)`);
  }

  injectContext(context: DistributedContext, headers: Record<string, string>): void {
    headers['x-trace-id'] = context.traceId;
    headers['x-span-id'] = context.spanId;
    if (context.parentSpanId) {
      headers['x-parent-span-id'] = context.parentSpanId;
    }

    // Inject baggage
    context.baggage.forEach((value, key) => {
      headers[`x-baggage-${key}`] = value;
    });
  }

  extractContext(headers: Record<string, string>): DistributedContext | null {
    const traceId = headers['x-trace-id'];
    const spanId = headers['x-span-id'];
    const parentSpanId = headers['x-parent-span-id'];

    if (!traceId || !spanId) {
      return null;
    }

    const baggage = new Map<string, string>();
    Object.keys(headers).forEach(key => {
      if (key.startsWith('x-baggage-')) {
        const bagKey = key.substring(10); // Remove 'x-baggage-'
        baggage.set(bagKey, headers[key]);
      }
    });

    return {
      traceId,
      spanId,
      parentSpanId,
      baggage,
      flags: 0
    };
  }

  getCurrentSpan(): Span | undefined {
    return this.spanStack[this.spanStack.length - 1];
  }

  generateTraceReport(traceId: string): DistributedTraceReport {
    const spans = Array.from(this.activeSpans.values())
      .filter(span => span.traceId === traceId && span.endTime)
      .sort((a, b) => a.startTime - b.startTime);

    return {
      traceId,
      spans,
      duration: Math.max(...spans.map(s => s.endTime!)) - Math.min(...spans.map(s => s.startTime)),
      services: this.extractServices(spans),
      criticalPath: this.calculateCriticalPath(spans),
      errors: spans.filter(s => s.status === 'error')
    };
  }
```

### HTTP Request Tracing Middleware
```typescript
function createTracingMiddleware(tracer: DistributedTracer) {
  return function (req: Request, res: Response, next: NextFunction): void {
    // Extraer contexto de headers
    const incomingContext = tracer.extractContext(req.headers as Record<string, string>);

    // Crear span para esta request
    const span = tracer.startSpan(`${req.method} ${req.path}`, incomingContext);

    // Agregar tags del span
    span.tags.set('http.method', req.method);
    span.tags.set('http.url', req.url);
    span.tags.set('http.user_agent', req.headers['user-agent'] || '');
    span.tags.set('http.remote_addr', req.ip || '');

    // Inyectar contexto para outgoing requests
    req.tracingContext = {
      span,
      injectHeaders: (headers: Record<string, string>) => {
        const context: DistributedContext = {
          traceId: span.traceId,
          spanId: span.spanId,
          baggage: new Map()
        };
        tracer.injectContext(context, headers);
      }
    };

    // Interceptar respuesta
    const originalSend = res.send;
    res.send = function (data: any) {
      span.tags.set('http.status_code', res.statusCode);
      span.endTime = Date.now();
      span.duration = span.endTime - span.startTime;

      if (res.statusCode >= 400) {
        span.status = 'error';
      } else {
        span.status = 'ok';
      }

      tracer.finishSpan(span.spanId, span.status);
      return originalSend.call(this, data);
    };

    next();
  };
}

// Uso en Express
const tracer = new DistributedTracer();
app.use(createTracingMiddleware(tracer));
```

## 5. Herramientas de Visualización

### Interactive Timeline Visualizer
```typescript
class TimelineVisualizer {
  private svgContainer: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private width: number = 1200;
  private height: number = 600;
  private margin = { top: 20, right: 30, bottom: 40, left: 50 };

  constructor(containerId: string) {
    this.svgContainer = d3.select(`#${containerId}`)
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height);
  }

  renderTimeline(data: TimelineData): void {
    // Clear previous visualization
    this.svgContainer.selectAll('*').remove();

    const innerWidth = this.width - this.margin.left - this.margin.right;
    const innerHeight = this.height - this.margin.top - this.margin.bottom;

    // Create scales
    const xScale = d3.scaleTime()
      .domain([data.startTime, data.endTime])
      .range([0, innerWidth]);

    const yScale = d3.scaleBand()
      .domain(data.lanes.map(lane => lane.name))
      .range([0, innerHeight])
      .padding(0.1);

    // Create main group
    const g = this.svgContainer.append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

    // Add axes
    this.addAxes(g, xScale, yScale);

    // Add lanes
    this.addLanes(g, yScale);

    // Add events
    this.addEvents(g, data.events, xScale, yScale);

    // Add interactions
    this.addInteractions(g, data);
  }

  private addAxes(
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    xScale: d3.ScaleTime<number, number>,
    yScale: d3.ScaleBand<string>
  ): void {
    // X axis
    g.append('g')
      .attr('transform', `translate(0,${this.height - this.margin.top - this.margin.bottom})`)
      .call(d3.axisBottom(xScale));

    // Y axis
    g.append('g')
      .call(d3.axisLeft(yScale));
  }

  private addEvents(
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    events: TimelineEvent[],
    xScale: d3.ScaleTime<number, number>,
    yScale: d3.ScaleBand<string>
  ): void {
    const eventGroups = g.selectAll('.event')
      .data(events)
      .enter()
      .append('g')
      .attr('class', 'event');

    // Add rectangles for events
    eventGroups.append('rect')
      .attr('x', d => xScale(d.startTime))
      .attr('y', d => yScale(d.lane) || 0)
      .attr('width', d => xScale(d.endTime) - xScale(d.startTime))
      .attr('height', yScale.bandwidth())
      .attr('fill', d => this.getColorByType(d.type))
      .attr('stroke', '#333')
      .attr('stroke-width', 1)
      .attr('rx', 3)
      .style('opacity', 0.8)
      .on('mouseover', function(event, d) {
        d3.select(this).style('opacity', 1);
        this.showTooltip(d, event);
      })
      .on('mouseout', function() {
        d3.select(this).style('opacity', 0.8);
        this.hideTooltip();
      });

    // Add labels
    eventGroups.append('text')
      .attr('x', d => (xScale(d.startTime) + xScale(d.endTime)) / 2)
      .attr('y', d => (yScale(d.lane) || 0) + yScale.bandwidth() / 2)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .text(d => d.label)
      .style('fill', 'white')
      .style('font-size', '12px')
      .style('pointer-events', 'none');
  }

  private getColorByType(type: string): string {
    const colorMap: Record<string, string> = {
      'error': '#ff4444',
      'warning': '#ffaa00',
      'info': '#4444ff',
      'success': '#44ff44',
      'performance': '#ff44ff'
    };
    return colorMap[type] || '#888888';
  }
}
```

### Call Graph Visualizer
```typescript
class CallGraphVisualizer {
  renderCallGraph(callGraph: CallGraph, containerId: string): void {
    const container = d3.select(`#${containerId}`);

    // Create force simulation
    const simulation = d3.forceSimulation(callGraph.nodes)
      .force('link', d3.forceLink(callGraph.edges).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(400, 300));

    // Create SVG
    const svg = container.append('svg')
      .attr('width', 800)
      .attr('height', 600);

    // Create arrow markers
    this.addArrowMarkers(svg);

    // Create links
    const links = svg.append('g')
      .selectAll('line')
      .data(callGraph.edges)
      .enter()
      .append('line')
      .attr('stroke', '#999')
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#arrowhead)');

    // Create nodes
    const nodes = svg.append('g')
      .selectAll('g')
      .data(callGraph.nodes)
      .enter()
      .append('g')
      .call(this.createDrag(simulation));

    // Add circles for nodes
    nodes.append('circle')
      .attr('r', d => Math.sqrt(d.importance || 1) * 10)
      .attr('fill', d => this.getNodeColor(d))
      .attr('stroke', '#333')
      .attr('stroke-width', 2);

    // Add labels
    nodes.append('text')
      .text(d => d.label)
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .style('font-size', '12px')
      .style('fill', 'white');

    // Update positions on simulation tick
    simulation.on('tick', () => {
      links
        .attr('x1', d => (d.source as any).x)
        .attr('y1', d => (d.source as any).y)
        .attr('x2', d => (d.target as any).x)
        .attr('y2', d => (d.target as any).y);

      nodes.attr('transform', d => `translate(${d.x},${d.y})`);
    });
  }

  private createDrag(simulation: d3.Simulation<any, any>) {
    return d3.drag<SVGGElement, any>()
      .on('start', function(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', function(event, d) {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', function(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });
  }

  private getNodeColor(node: any): string {
    if (node.type === 'error') return '#ff4444';
    if (node.type === 'warning') return '#ffaa00';
    if (node.type === 'system') return '#888888';
    return '#4444ff';
  }
}
```

## Integración y Automatización

### Tracing Orchestrator
```typescript
class TracingOrchestrator {
  private tools: {
    stackTracer: EnhancedStackTraceTool;
    asyncTracer: AdvancedAsyncTracer;
    cpuProfiler: CPUProfiler;
    memoryProfiler: MemoryProfiler;
    distributedTracer: DistributedTracer;
  };

  constructor() {
    this.tools = {
      stackTracer: new EnhancedStackTraceTool(),
      asyncTracer: new AdvancedAsyncTracer(),
      cpuProfiler: new CPUProfiler(),
      memoryProfiler: new MemoryProfiler(),
      distributedTracer: new DistributedTracer()
    };
  }

  async startComprehensiveTracing(): Promise<TracingSession> {
    const sessionId = this.generateSessionId();
    const startTime = Date.now();

    console.log(`🚀 Starting comprehensive tracing session: ${sessionId}`);

    // Iniciar todos los tracers
    this.tools.cpuProfiler.startProfiling(50); // 50ms interval
    this.tools.memoryProfiler.takeHeapSnapshot('baseline');

    return {
      id: sessionId,
      startTime,
      tools: this.tools,
      status: 'running'
    };
  }

  async captureError(error: Error, context?: any): Promise<ErrorAnalysis> {
    const analysis: ErrorAnalysis = {
      error,
      stackTrace: await this.tools.stackTracer.captureDetailedError(error, context),
      asyncContext: this.tools.asyncTracer.getCurrentContext(),
      systemState: {
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        cpuUsage: process.cpuUsage()
      },
      timestamp: Date.now()
    };

    // Tomar snapshot de memoria si es error crítico
    if (this.isCriticalError(error)) {
      analysis.memorySnapshot = this.tools.memoryProfiler.takeHeapSnapshot(`error-${Date.now()}`);
    }

    return analysis;
  }

  async stopTracing(sessionId: string): Promise<ComprehensiveReport> {
    const session = this.getActiveSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    console.log(`🏁 Stopping tracing session: ${sessionId}`);

    // Detener profiling
    const cpuProfile = this.tools.cpuProfiler.stopProfiling();
    const finalMemorySnapshot = this.tools.memoryProfiler.takeHeapSnapshot('final');

    // Generar reportes
    const report: ComprehensiveReport = {
      sessionId,
      duration: Date.now() - session.startTime,
      cpuProfile,
      memoryAnalysis: this.tools.memoryProfiler.generateMemoryReport(),
      asyncAnalysis: this.tools.asyncTracer.generateGlobalReport(),
      errors: session.capturedErrors || [],
      recommendations: this.generateRecommendations(cpuProfile, finalMemorySnapshot)
    };

    // Limpiar sesión
    this.cleanupSession(sessionId);

    return report;
  }

  private generateRecommendations(
    cpuProfile: CPUProfile,
    memoryAnalysis: MemoryReport
  ): string[] {
    const recommendations: string[] = [];

    // CPU recommendations
    if (cpuProfile.hotspots.length > 0) {
      recommendations.push(`Identified ${cpuProfile.hotspots.length} CPU hotspots. Consider optimizing the dominant functions.`);
    }

    // Memory recommendations
    if (memoryAnalysis.comparison) {
      const leaks = memoryAnalysis.comparison.potentialLeaks;
      if (leaks.length > 0) {
        recommendations.push(`Detected ${leaks.length} potential memory leaks. Review allocation patterns.`);
      }
    }

    return recommendations;
  }
}
```

## Best Practices para Herramientas de Tracing

### 1. Implementación
- **Bajo overhead**: Minimizar impacto en performance
- **Configurable**: Permitir activar/desactivar features
- **Thread-safe**: Funcionar correctamente en entornos concurrentes
- **Persistencia**: Guardar datos para análisis offline

### 2. Integración
- **Easy setup**: Configuración mínima para empezar
- **Framework agnostic**: Trabajar con diferentes stacks
- **API consistente**: Interfaz unificada para todas las herramientas
- **Export formats**: Soportar múltiples formatos de salida

### 3. Visualización
- **Interactive charts**: Permitir zoom, filtrado, navegación
- **Real-time updates**: Mostrar datos en tiempo real
- **Multiple views**: Diferentes perspectivas de los mismos datos
- **Export capabilities**: Permitir exportar visualizaciones

### 4. Automatización
- **Smart detection**: Identificar automáticamente patrones problemáticos
- **Alert integration**: Integrar con sistemas de alerting existentes
- **Scheduled analysis**: Ejecutar análisis periódicamente
- **Auto-recommendations**: Sugerir soluciones automáticamente

## Checklist de Herramientas

### Implementación Técnica
- [ ] Stack traces mejorados con source maps
- [ ] Async hooks configurados correctamente
- [ ] Performance profiling habilitado
- [ ] Memory tracking implementado
- [ ] Distributed tracing configurado

### Visualización
- [ ] Timeline interactivo disponible
- [ ] Call graphs navegables
- [ ] Heatmaps de performance
- [ ] Memory leak visualizations
- [ ] Real-time dashboards

### Análisis
- [ ] Detección automática de patrones
- [ ] Identificación de cuellos de botella
- [ ] Análisis de correlación temporal
- [ ] Root cause analysis
- [ ] Recommendations automáticas

### Integración
- [ ] API REST para acceso programático
- [ ] Webhooks para notificaciones
- [ ] Export en múltiples formatos
- [ ] Integración con logging existente
- [ ] Métricas de las herramientas mismas