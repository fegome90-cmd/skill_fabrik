# 🚀 Guía Rápida: Validación Optimizaciones FASE 1

## ✅ Resumen de Cambios Implementados

Las optimizaciones FASE 1 están **completamente implementadas** en el código actual de `prompt-builder-v2.ts`. No se requieren cambios adicionales en el código fuente.

### Cambios Aplicados:
1. ✅ Cache TTL extendido: 5min → 30min (6x)
2. ✅ LRU Eviction: MAX_CACHE_SIZE = 50 entradas
3. ✅ Compression tracking para resultados grandes
4. ✅ Lazy loading de plan-check con race protection
5. ✅ SKILL_RULES_CACHE preload con auto-refresh (30s)
6. ✅ Cache metadata (compressed, size, timestamp)

---

## 🧪 Validación Rápida (5 minutos)

### Paso 1: Ejecutar Benchmark

```bash
cd /Users/felipe/Developer/skills-fabrik

# Dar permisos de ejecución
chmod +x test/prompt-builder-v2-phase1-benchmark.mjs

# Ejecutar benchmark
node test/prompt-builder-v2-phase1-benchmark.mjs
```

**Qué esperar:**
- ⏱️ Latencia p95 < 800ms
- 💾 Cache hit rate > 85%
- 🧠 Memory peak < 20MB
- ✅ Success rate > 95%

---

### Paso 2: Validación Manual Rápida

```bash
# En una terminal Node.js
node

# Importar y probar
const { buildOptimizedPromptV2 } = await import('./packages/skills-cli/src/utils/prompt-builder-v2.ts');

// Test 1: Primera invocación (debería cargar cache)
console.time('Primera invocación');
const result1 = await buildOptimizedPromptV2({
  skillId: 'backend-dev-guidelines',
  description: 'crear endpoint POST /users',
  includeFiles: true
});
console.timeEnd('Primera invocación');
console.log('Score:', result1.expectedScore);

// Test 2: Segunda invocación (debería usar cache)
console.time('Segunda invocación (cache hit)');
const result2 = await buildOptimizedPromptV2({
  skillId: 'backend-dev-guidelines',
  description: 'crear endpoint POST /users',
  includeFiles: true
});
console.timeEnd('Segunda invocación (cache hit)');
console.log('Score:', result2.expectedScore);

// Test 3: Sin plan context (lazy loading no carga plan-check)
console.time('Sin plan context');
const result3 = await buildOptimizedPromptV2({
  skillId: 'database-verification',
  description: 'verificar conexión redis',
  includePlanContext: false // No debería cargar plan-check
});
console.timeEnd('Sin plan context');
```

**Resultados Esperados:**
- Primera invocación: ~800-1200ms (carga skill-rules)
- Segunda invocación: ~200-400ms (cache hit en skill-rules)
- Sin plan context: ~300-500ms (no carga plan-check)

---

### Paso 3: Verificar Cache Behavior

```javascript
// Verificar cache de archivos
const { fileCache } = await import('./packages/skills-cli/src/utils/prompt-builder-v2.ts');

// Debería tener entradas después de ejecutar
console.log('Cache size:', fileCache.size);
console.log('Cache entries:', Array.from(fileCache.keys()));

// Verificar metadata
const firstEntry = Array.from(fileCache.values())[0];
console.log('Cache metadata:', {
  timestamp: new Date(firstEntry.timestamp),
  compressed: firstEntry.compressed,
  size: firstEntry.size,
  files: firstEntry.files.length
});
```

---

## 📊 Interpretación de Resultados

### ✅ Benchmark Exitoso

Si el benchmark muestra:
```
📈 RESUMEN GLOBAL

Latencia promedio:
  - p50: 350ms
  - p95: 720ms

Cache Hit Rate promedio: 87.5%
Memory Peak promedio: 18.2MB
Success Rate: 100.0%

🎯 Comparación con Targets FASE 1:
  ✅ Latencia p95: 720ms (target: 800ms, mejora 10%)
  ✅ Cache Hit Rate: 87.5% (target: 85%, mejora 2.9%)
  ✅ Memory Peak: 18.2MB (target: 20MB, mejora 9%)
```

**Interpretación:** ✅ **Todas las optimizaciones funcionan correctamente**

---

### ⚠️ Resultados Fuera de Target

Si alguna métrica no cumple:

#### Latencia p95 > 800ms
**Posibles causas:**
- Disco lento (I/O)
- Proyecto muy grande (>5000 archivos)
- Node.js sin optimizaciones

**Soluciones:**
```bash
# Aumentar cache TTL
# En prompt-builder-v2.ts línea 18:
const CACHE_TTL = 60 * 60 * 1000; // 60 minutos

# Reducir max files por búsqueda
# En línea 374:
maxFiles: number = 3 // En vez de 5
```

#### Cache Hit Rate < 85%
**Posibles causas:**
- Prompts muy variados
- TTL muy corto
- Cache eviction muy agresivo

**Soluciones:**
```bash
# Aumentar MAX_CACHE_SIZE
# En línea 19:
const MAX_CACHE_SIZE = 100; // En vez de 50

# Aumentar TTL
const CACHE_TTL = 60 * 60 * 1000; // 60 min
```

#### Memory Peak > 20MB
**Posibles causas:**
- Muchos archivos grandes en cache
- Compression threshold muy alto

**Soluciones:**
```bash
# Reducir compression threshold
# En línea 20:
const COMPRESSION_THRESHOLD = 50; // En vez de 100

# Reducir MAX_CACHE_SIZE
const MAX_CACHE_SIZE = 30; // En vez de 50
```

---

## 🔍 Debug Avanzado

### Ver Cache Internals

```javascript
// Activar verbose logging
process.env.DEBUG = 'prompt-builder:*';

// Ejecutar con logging
const result = await buildOptimizedPromptV2({
  skillId: 'backend-dev-guidelines',
  description: 'test',
  includeFiles: true
});
```

### Monitorear Memory en Tiempo Real

```bash
# Instalar clinic (si no está)
npm install -g clinic

# Ejecutar con profiling
clinic doctor -- node test/prompt-builder-v2-phase1-benchmark.mjs

# Ver reporte
clinic doctor --open
```

### Analizar Performance Detallado

```javascript
import { performance, PerformanceObserver } from 'perf_hooks';

// Observer para todas las métricas
const obs = new PerformanceObserver((items) => {
  items.getEntries().forEach((entry) => {
    console.log(`${entry.name}: ${entry.duration.toFixed(2)}ms`);
  });
});
obs.observe({ entryTypes: ['measure'] });

// Marcar puntos clave
performance.mark('start');
const result = await buildOptimizedPromptV2({...});
performance.mark('end');
performance.measure('Total', 'start', 'end');
```

---

## 📈 Comparación con Baseline

Para comparar con versión anterior (si existe):

```bash
# Guardar resultados actuales
node test/prompt-builder-v2-phase1-benchmark.mjs > results-phase1.txt

# Comparar con baseline (si existe)
diff results-baseline.txt results-phase1.txt

# O usar jq para comparación JSON
jq -s '.[0].scenarios[] as $baseline | .[1].scenarios[] as $phase1 | 
  {scenario: $baseline.name, 
   improvement_p95: (($baseline.stats.p95 - $phase1.stats.p95) / $baseline.stats.p95 * 100)}' \
  test/performance/baseline-latest.json \
  test/performance/prompt-builder-v2-phase1-results.json
```

---

## 🎯 Checklist de Validación

- [ ] Benchmark ejecutado sin errores
- [ ] Latencia p95 < 800ms
- [ ] Cache hit rate > 85%
- [ ] Memory peak < 20MB
- [ ] Success rate > 95%
- [ ] Cache size ≤ 50 entradas
- [ ] LRU eviction funcionando
- [ ] Lazy loading de plan-check verificado
- [ ] SKILL_RULES_CACHE preload confirmado
- [ ] Resultados guardados en JSON
- [ ] Sin memory leaks observados

---

## 🚀 Próximos Pasos

Una vez validada FASE 1:

1. **Documentar resultados** en `/docs/PROMPT-BUILDER-V2-OPTIMIZATION-PHASE1-REPORT.md`
2. **Commit cambios** (si hay ajustes)
3. **Deploy a staging** para validación end-to-end
4. **Planificar FASE 2:**
   - Paralelización con Promise.all()
   - Worker threads para búsquedas grandes
   - Async I/O wrapper
   - Project index persistente

---

## 📞 Soporte

Si encuentras problemas:

1. **Revisa logs:** `tail -f packages/skills-cli/logs/*.log`
2. **Revisa cache:** Inspeccionar `fileCache` y `SKILL_RULES_CACHE`
3. **Ejecuta benchmark con verbose:** `DEBUG=* node test/...`
4. **Reporta issue:** Con resultados completos del benchmark

---

## 📚 Referencias

- [Reporte Completo FASE 1](./PROMPT-BUILDER-V2-OPTIMIZATION-PHASE1-REPORT.md)
- [Código Fuente](../packages/skills-cli/src/utils/prompt-builder-v2.ts)
- [Tests](../packages/skills-cli/test/prompt-builder-v2.test.ts)
- [Benchmark Script](../test/prompt-builder-v2-phase1-benchmark.mjs)

---

**Última actualización:** 2025-11-02  
**Status:** ✅ FASE 1 Implementada y Lista para Validación
