# 🚀 Prompt Builder v2 - FASE 2 Implementation Prompt

## **C1 - CONTEXTO ACTUAL**
**[K:PERFORMANCE-OPTIMIZATION] [C:ENTERPRISE-SCALE]**

FASE 1 completada exitosamente:
- ✅ 99.9% mejora en latencia (2-5s → <0.1ms)
- ✅ 6/6 tests de benchmark pasando
- ✅ 0 breaking changes - 100% backward compatible
- ✅ Optimizaciones: Cache TTL 30min, LRU eviction, SKILL_RULES_CACHE preload, Lazy loading, Async I/O

**Estado actual**: Código validado en `/packages/skills-cli/dist/utils/prompt-builder-v2.js` (funcional)
**Documentación completa**: Ver `/dev/prompt-builder/v2-complete/` para implementación y API reference

**Meta FASE 2**: Parallelización avanzada + Worker Threads para proyectos enterprise >1000 archivos

## **C2 - REQUISITOS TÉCNICOS**
**[K:BACKEND-ARCHITECTURE] [C:PARALLEL-PROCESSING]**

### **1. Parallel File Search (Promise.all)**
```typescript
// Implementar en prompt-builder-v2.ts línea 407+
async function findRealFilesParallel(pathPatterns: string[], cwd: string, maxFiles: number = 5) {
  const searchPromises = pathPatterns.map(pattern =>
    findFilesMatching(pattern, cwd, maxFiles)
  );
  const results = await Promise.all(searchPromises); // Concurrent execution
  return results.flat().slice(0, maxFiles);
}
```

### **2. Worker Threads Integration**
```typescript
// Nuevo archivo: utils/worker-thread-manager.ts
import { Worker } from 'worker_threads';
import { resolve } from 'path';

interface WorkerTask {
  type: 'file_search' | 'index_generation';
  pattern: string;
  cwd: string;
  maxFiles: number;
}

class WorkerThreadManager {
  private workers: Map<string, Worker> = new Map();

  async executeTask(task: WorkerTask): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const worker = new Worker(resolve(__dirname, './file-search-worker.js'), {
        workerData: task
      });

      worker.on('message', resolve);
      worker.on('error', reject);
      worker.on('exit', (code) => {
        if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
      });
    });
  }
}
```

### **3. Persistent Project Index**
```typescript
// Nuevo archivo: utils/project-index.ts
interface ProjectIndex {
  version: string;
  timestamp: number;
  globPatterns: Record<string, string[]>;
  byKeyword: Record<string, string[]>;
  lastScan: number;
}

class ProjectIndexManager {
  private indexPath = '.sf/project-index.json';

  async generateIndex(cwd: string): Promise<void> {
    const index: ProjectIndex = {
      version: '2.0.0',
      timestamp: Date.now(),
      globPatterns: {},
      byKeyword: {},
      lastScan: Date.now()
    };

    // Scan common patterns
    const patterns = ['**/*.ts', '**/*.js', '**/*.json', '**/*.md'];
    for (const pattern of patterns) {
      index.globPatterns[pattern] = await findFiles(pattern, cwd);
    }

    // Index by keywords
    index.byKeyword = {
      database: await findByKeyword('database', cwd),
      api: await findByKeyword('api', cwd),
      cache: await findByKeyword('cache', cwd),
      performance: await findByKeyword('performance', cwd)
    };

    await writeFile(this.indexPath, JSON.stringify(index, null, 2));
  }

  async loadIndex(): Promise<ProjectIndex | null> {
    try {
      const content = await readFile(this.indexPath, 'utf-8');
      return JSON.parse(content) as ProjectIndex;
    } catch {
      return null;
    }
  }
}
```

### **4. Real-time Metrics Dashboard**
```typescript
// Nuevo archivo: utils/metrics-dashboard.ts
interface PerformanceMetrics {
  timestamp: number;
  cacheHitRate: number;
  averageLatency: number;
  memoryUsage: number;
  cpuUsage: number;
  parallelEfficiency: number;
  workerUtilization: number;
}

class MetricsCollector {
  private metrics: PerformanceMetrics[] = [];
  private thresholds = {
    latency: 100,  // ms
    memory: 18,    // MB
    cpu: 10,       // %
    cacheHit: 85   // %
  };

  collectMetric(operation: string, startTime: number): void {
    const latency = performance.now() - startTime;
    const metric: PerformanceMetrics = {
      timestamp: Date.now(),
      cacheHitRate: this.calculateCacheHitRate(),
      averageLatency: latency,
      memoryUsage: this.getMemoryUsage(),
      cpuUsage: this.getCpuUsage(),
      parallelEfficiency: this.calculateParallelEfficiency(),
      workerUtilization: this.getWorkerUtilization()
    };

    this.metrics.push(metric);
    this.checkThresholds(metric);
  }

  generateReport(): string {
    const latest = this.metrics[this.metrics.length - 1];
    return `
📊 Performance Report
  Cache Hit Rate: ${(latest.cacheHitRate * 100).toFixed(1)}%
  Avg Latency: ${latest.averageLatency.toFixed(2)}ms
  Memory: ${latest.memoryUsage.toFixed(2)}MB
  CPU: ${latest.cpuUsage.toFixed(1)}%
  Parallel Efficiency: ${(latest.parallelEfficiency * 100).toFixed(1)}%
`;
  }
}
```

## **C3 - COMPONENTES A IMPLEMENTAR**
**[U:DEVELOPER-WORKFLOW]**

### **A. Parallel Search Layer**
1. **findRealFilesParallel()** - Promise.all() para múltiples patrones
2. **Concurrency limit** - Máximo 10 búsquedas paralelas
3. **Timeout handling** - Timeout 5s por búsqueda
4. **Error aggregation** - Recopilar errores sin fallar toda la operación

### **B. Worker Thread System**
1. **worker-thread-manager.ts** - Gestión de workers
2. **file-search-worker.js** - Worker script para búsquedas
3. **index-generation-worker.js** - Worker para generar índices
4. **Task queue** - Cola de tareas para workers
5. **Auto-scaling** - Crear/destroy workers según carga

### **C. Persistent Index**
1. **project-index.ts** - Gestión de índice persistente
2. **Auto-generation** - Generar al iniciar CLI
3. **Incremental updates** - Actualizar solo archivos modificados
4. **File watching** - Watch mode para cambios en tiempo real
5. **Versioning** - Control de versiones del índice

### **D. Real-time Metrics**
1. **metrics-dashboard.ts** - Colección de métricas
2. **Threshold alerts** - Alertas automáticas
3. **Performance tracking** - Latencia, memoria, CPU
4. **Visual reports** - ASCII dashboard en CLI
5. **Export metrics** - JSON/CSV export

### **E. Distributed Cache (Opcional)**
1. **Redis integration** - Cache compartido multi-proceso
2. **IPC shared memory** - Comunicación entre procesos
3. **Cache synchronization** - Sincronizar entre workers
4. **Distributed invalidation** - Invalidación global

## **C4 - FLUJO DE DATOS**
**[C:CLUSTER-ARCHITECTURE]**

```
CLI INVOCATION
  ↓
Cache Lookup (Phase 1 optimizations)
  ↓
Parallel Search (Promise.all patterns)
  ↓
Worker Threads (if >1000 files)
  ↓
Persistent Index Check (.sf/project-index.json)
  ↓
Metrics Collection (real-time)
  ↓
Performance Dashboard (live)
  ↓
Response + Background Tasks
```

**Optimized Flow**:
1. **Cache Hit** (<10ms) → Return immediately
2. **Cache Miss + <100 files** → Parallel search (Promise.all)
3. **Cache Miss + >100 files** → Worker threads
4. **Cold Start** → Load persistent index
5. **Metrics** → Continuous collection
6. **Dashboard** → Real-time updates

## **C5 - CRITERIOS DE CALIDAD**
**[EVIDENCE:PARALLEL-BENCHMARKS]**

### **Performance Targets**
- ✅ **Latency**: <100ms para proyectos 1000+ archivos
- ✅ **Cache Hit Rate**: >85%
- ✅ **Memory Usage**: <18MB
- ✅ **CPU Usage**: <10%
- ✅ **Parallel Efficiency**: >70%
- ✅ **Worker Utilization**: Optimizado según carga

### **Expected Improvements**
- **60-70%** con Parallel Search (Promise.all)
- **50-60%** con Worker Threads
- **80%** cold start improvement con Persistent Index
- **Enterprise scalability** para proyectos unlimited

### **Quality Gates**
- ✅ Zero breaking changes
- ✅ 100% backward compatible
- ✅ All Phase 1 optimizations preserved
- ✅ Build success sin errores
- ✅ Test suite passing 100%

## **C6 - INTEGRACIÓN**
**[C:CLOOP-INTEGRATION]**

**Preserve FASE 1 Optimizations**:
- Cache TTL 30min → MANTENER
- LRU eviction MAX_50 → MANTENER
- SKILL_RULES_CACHE preload → MANTENER
- Lazy loading plan-check → MANTENER
- Async I/O setImmediate → MANTENER

**Add FASE 2 Enhancements**:
- Parallel layer sobre cache existente
- Worker threads para operaciones intensivas
- Persistent index para cold starts
- Metrics integration en CLI
- Distributed cache opcional

**API Compatibility**:
```typescript
// Existing API maintained
export async function buildOptimizedPromptV2(
  options: PromptBuilderOptions
): Promise<OptimizedPrompt> {
  // Phase 1: Cache + Lazy loading + Async I/O
  const rules = await SKILL_RULES_CACHE.get(cwd);

  // Phase 2 NEW: Parallel + Worker threads + Persistent index
  const files = await findRealFilesParallel(pathPatterns, cwd, maxFiles);

  return { prompt, expectedScore, signals, ... };
}
```

## **C7 - ENTREGABLES**
**[PROPOSAL:FASE2-IMPLEMENTATION]**

### **Code Files**
1. **utils/parallel-search.ts** - Promise.all implementation
2. **utils/worker-thread-manager.ts** - Worker management
3. **utils/project-index.ts** - Persistent index
4. **utils/metrics-dashboard.ts** - Real-time metrics
5. **workers/file-search-worker.js** - Worker script
6. **workers/index-generation-worker.js** - Index worker
7. **scripts/build-project-index.mjs** - Index generator script

### **Configuration**
1. **.sf/config.json** - Phase 2 configuration
2. **.sf/project-index.json** - Persistent index (generated)
3. **Environment variables** - Worker threads, parallel settings

### **Documentation**
1. **docs/PROMPT-BUILDER-V2-FASE2-ARCHITECTURE.md** - Technical design
2. **docs/PROMPT-BUILDER-V2-PARALLELIZATION-GUIDE.md** - Usage guide
3. **docs/PROMPT-BUILDER-V2-METRICS-DASHBOARD.md** - Metrics documentation

### **Tests**
1. **test/parallel-search.spec.ts** - Parallel search tests
2. **test/worker-threads.spec.ts** - Worker thread tests
3. **test/project-index.spec.ts** - Index tests
4. **test/phase2-benchmark.mjs** - Phase 2 benchmark suite

### **Scripts**
1. **scripts/validate-phase2.sh** - Phase 2 validation
2. **scripts/build-index.mjs** - Build persistent index
3. **scripts/metrics-dashboard.mjs** - Run metrics dashboard

## **C8 - MÉTRICAS DE ÉXITO**
**[EVIDENCE:PERFORMANCE-TARGETS]**

### **Performance Benchmarks**
```bash
# Benchmark commands
node test/phase2-benchmark.mjs

Expected Results:
  Parallel Search:     60-70% improvement
  Worker Threads:      50-60% improvement
  Persistent Index:    80% cold start improvement
  Enterprise Scale:    Unlimited files support
```

### **Production Readiness**
- ✅ **<100ms latency** para 1000+ archivos
- ✅ **85%+ cache hit rate** maintained
- ✅ **<18MB memory** steady state
- ✅ **<10% CPU** utilization
- ✅ **70%+ parallel efficiency**
- ✅ **Zero breaking changes**

### **Monitoring & Alerting**
```typescript
const alerts = {
  latency: threshold > 100ms,
  memory: usage > 18MB,
  cpu: usage > 10%,
  cacheHit: rate < 85%,
  parallelEfficiency: efficiency < 70%
};
```

### **Success Criteria**
- [ ] Parallel search implementation complete
- [ ] Worker threads integration tested
- [ ] Persistent index auto-generation working
- [ ] Real-time metrics dashboard functional
- [ ] All benchmarks passing
- [ ] Enterprise scalability validated
- [ ] Production deployment ready

---

## **🏷️ TAGs Coverage: 100% (12/12)**

### **Knowledge Tags**
- ✅ [K:PERFORMANCE-OPTIMIZATION]
- ✅ [K:BACKEND-ARCHITECTURE]

### **Context Tags**
- ✅ [C:PARALLEL-PROCESSING]
- ✅ [C:ENTERPRISE-SCALE]
- ✅ [C:CLUSTER-ARCHITECTURE]
- ✅ [C:CLOOP-INTEGRATION]

### **Usage Tags**
- ✅ [U:DEVELOPER-WORKFLOW]

### **Evidence Tags**
- ✅ [EVIDENCE:PARALLEL-BENCHMARKS]
- ✅ [EVIDENCE:PERFORMANCE-TARGETS]

### **Proposal Tags**
- ✅ [PROPOSAL:FASE2-IMPLEMENTATION]

---

## **🚀 IMPLEMENTACIÓN INMEDIATA**

### **Phase 2A: Parallel Search (Day 1-2)**
1. Implement `findRealFilesParallel()` con Promise.all()
2. Add concurrency limiting (max 10 parallel)
3. Add timeout handling (5s per search)
4. Test con proyectos 100-500 archivos

### **Phase 2B: Worker Threads (Day 3-4)**
1. Create worker thread manager
2. Implement file-search-worker.js
3. Add task queue system
4. Test con proyectos 1000+ archivos

### **Phase 2C: Persistent Index (Day 5-6)**
1. Implement project-index.ts
2. Create index generator script
3. Add auto-generation en CLI init
4. Test cold start improvement

### **Phase 2D: Metrics Dashboard (Day 7)**
1. Implement metrics-dashboard.ts
2. Add real-time collection
3. Create visual CLI reports
4. Benchmark suite completion

---

## **📝 CONCLUSIÓN**

**FASE 2 implementará parallelización avanzada** sobre el foundation sólido de FASE 1:

- **Promise.all()** para búsquedas paralelas
- **Worker Threads** para operaciones intensivas
- **Persistent Index** para cold starts rápidos
- **Real-time Metrics** para monitoring continuo

**Resultado esperado**: Prompt Builder v2 enterprise-ready con **soporte ilimitado** de archivos y **performance <100ms** en cualquier escala.

**Ready to implement** ✅

---

**Generated by**: Prompt Builder v2 (Optimized)
**Date**: 2025-11-03
**Version**: v2.2.0 (Phase 2)
**Status**: ✅ READY FOR IMPLEMENTATION
