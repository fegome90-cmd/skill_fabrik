# Fases de Debugging Sistemático - Guía Detallada

## Fase 1: OBSERVAR - Recolección de Evidencia

### Checklist de Observación

#### 1. Definir el Problema Claramente
- **Qué está mal**: Comportamiento actual observado
- **Qué debería pasar**: Comportamiento esperado
- **Impacto**: Severidad y alcance del problema
- **Frecuencia**: Siempre, intermitente, bajo condiciones específicas

```
Ejemplo:
❌ Actual: "API returns 500 error"
✅ Específico: "POST /api/users returns 500 with 'Cannot read property of undefined'
               when creating user with invalid email format, affecting 15% of new registrations"
```

#### 2. Recolectar Datos Cuantitativos
- **Métricas de rendimiento**: Response time, throughput, memory usage
- **Frecuencia de ocurrencia**: Número de incidencias por hora/día
- **Patrones temporales**: Hora del día, día de la semana
- **Condiciones de entorno**: Load, concurrent users, data volume

#### 3. Recolectar Evidencia Cualitativa
- **Logs completos**: Error messages, stack traces, warning signs
- **Screenshots/videos**: Comportamiento visual de bugs UI
- **User reports**: Descripciones exactas de usuarios
- **Environment data**: OS, browser, app version, configuration

#### 4. Identificar Patrones y Correlaciones
- **Disparadores comunes**: Qué acciones preceden al problema
- **Condiciones ambientales**: Load, network, database state
- **Secuencias de eventos**: Pasos exactos para reproducir
- **Factores de aislamiento**: Ocurre solo en ciertos escenarios

### Herramientas de Observación

#### Logs y Monitoring
```bash
# Búsqueda de patrones en logs
grep -A 5 -B 5 "ERROR" application.log | grep "timestamp"

# Análisis de frecuencia
grep "ERROR" application.log | wc -l
grep "WARNING" application.log | awk '{print $1}' | sort | uniq -c

# Extracción de métricas
tail -f application.log | grep "response_time" | awk '{print $NF}' | stats
```

#### Performance Monitoring
```javascript
// Añadir métricas detalladas
const performanceObserver = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log(`${entry.name}: ${entry.duration}ms`);
  }
});

performanceObserver.observe({ entryTypes: ['measure', 'navigation'] });
```

#### Network Analysis
```bash
# Captura de tráfico
tcpdump -i any port 3000 -w debug.pcap

# Análisis de conexiones
netstat -an | grep :3000
ss -tuln | grep :3000
```

## Fase 2: FORMULAR HIPÓTESIS - Análisis Causal

### Técnica de 5 Porqués (5 Whys)
```
Problema: API está lenta

1. ¿Por qué está lenta? → Database queries toman mucho tiempo
2. ¿Por qué las queries toman tiempo? → No hay índices apropiados
3. ¿Por qué no hay índices? → Schema no fue optimizado para workload actual
4. ¿Por qué no fue optimizado? → No se consideró escala durante diseño
5. ¿Por qué no se consideró escala? → Requisitos de crecimiento no fueron claros

Causa raíz: Falta de planificación de capacidad en diseño inicial
```

### Análisis de Causa Raíz (RCA)
```typescript
interface RootCauseAnalysis {
  problem: string;
  immediateCause: string;
  underlyingCauses: string[];
  rootCause: string;
  contributingFactors: string[];
}

const analysis: RootCauseAnalysis = {
  problem: "Users cannot upload files > 10MB",
  immediateCause: "Request timeout after 30 seconds",
  underlyingCauses: [
    "Slow file processing",
    "Insufficient memory allocation",
    "No progress feedback"
  ],
  rootCause: "Architecture not designed for large file handling",
  contributingFactors: [
    "Default nginx timeout of 30s",
    "Node.js single-threaded processing",
    "No chunked upload implementation"
  ]
};
```

### Hipótesis SMART
- **S**pecific: Clara y definida
- **M**easurable: Verificable con datos
- **A**chievable: Posible de probar
- **R**elevant: Relacionada con el problema
- **T**ime-bound: Puede ser validada en tiempo razonable

```
❌ Vaga: "Maybe the database is slow"
✅ SMART: "The user query is slow because it triggers N+1 queries
          when loading user relationships, measurable by EXPLAIN plan,
          verifiable by adding eager loading, fixable within 2 hours"
```

### Matriz de Priorización de Hipótesis

| Hipótesis | Probabilidad | Facilidad de Test | Impacto si Correcta | Prioridad |
|-----------|-------------|-------------------|-------------------|-----------|
| Memory leak | Alta | Media | Alto | 1 |
| Database index | Media | Alta | Medio | 2 |
| Network timeout | Baja | Alta | Bajo | 3 |

## Fase 3: EXPERIMENTAR - Validación Controlada

### Diseño de Experimentos

#### Principios Científicos
1. **Control de variables**: Cambiar una cosa a la vez
2. **Reproducibilidad**: Mismo setup, mismo resultado
3. **Medición objetiva**: Datos cuantitativos
4. **Documentación**: Qué, cómo, por qué, resultado

#### Template de Experimento
```typescript
interface DebugExperiment {
  id: string;
  hypothesis: string;
  setup: string;
  procedure: string[];
  expectedOutcome: string;
  actualOutcome: string;
  conclusion: 'VALIDATED' | 'REFUTED' | 'INCONCLUSIVE';
  timestamp: Date;
  nextSteps: string[];
}

const experiment: DebugExperiment = {
  id: "EXP-001",
  hypothesis: "Adding database index will improve query performance",
  setup: "Create test database with 100k records",
  procedure: [
    "Run query without index (baseline)",
    "Add index to user_email column",
    "Run same query with index",
    "Compare execution times"
  ],
  expectedOutcome: "Query time reduced from 2s to <200ms",
  actualOutcome: "Query time reduced from 2s to 150ms",
  conclusion: "VALIDATED",
  timestamp: new Date(),
  nextSteps: ["Deploy index to production", "Monitor performance"]
};
```

### Técnicas de Aislamiento

#### Binary Search Debugging
```typescript
function binarySearchDebug(arr: any[], low: number, high: number, target: any): number {
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);

    console.log(`Testing range [${low}, ${high}], mid=${mid}`);

    if (arr[mid] === target) {
      console.log(`Found at index ${mid}`);
      return mid;
    }

    if (arr[mid] < target) {
      console.log(`Target > ${arr[mid]}, searching right half`);
      low = mid + 1;
    } else {
      console.log(`Target < ${arr[mid]}, searching left half`);
      high = mid - 1;
    }
  }

  console.log(`Target not found in range [${low}, ${high}]`);
  return -1;
}
```

#### Feature Flag Testing
```typescript
class DebugFeatureFlags {
  private flags: Map<string, boolean> = new Map();

  enableDebugMode(feature: string): void {
    this.flags.set(feature, true);
    console.log(`Debug enabled for: ${feature}`);
  }

  isDebugEnabled(feature: string): boolean {
    return this.flags.get(feature) || false;
  }

  debugOnly<T>(feature: string, callback: () => T): T | null {
    if (this.isDebugEnabled(feature)) {
      return callback();
    }
    return null;
  }
}

// Uso
const debug = new DebugFeatureFlags();
debug.enableDebugMode('database-queries');

const result = debug.debugOnly('database-queries', () => {
  return complexDatabaseOperation();
});
```

### Experimentos Controlados

#### A/B Testing de Fixes
```typescript
interface FixExperiment {
  name: string;
  controlGroup: () => any;
  testGroup: () => any;
  metrics: string[];
  sampleSize: number;
}

const fixExperiment: FixExperiment = {
  name: "Optimize user query",
  controlGroup: () => originalUserQuery(),
  testGroup: () => optimizedUserQuery(),
  metrics: ['executionTime', 'memoryUsage', 'cpuTime'],
  sampleSize: 1000
};

function runExperiment(experiment: FixExperiment): void {
  const controlResults = [];
  const testResults = [];

  for (let i = 0; i < experiment.sampleSize; i++) {
    controlResults.push(measure(experiment.controlGroup));
    testResults.push(measure(experiment.testGroup));
  }

  const controlStats = calculateStats(controlResults);
  const testStats = calculateStats(testResults);

  console.log(`Control: ${JSON.stringify(controlStats)}`);
  console.log(`Test: ${JSON.stringify(testStats)}`);
  console.log(`Improvement: ${calculateImprovement(controlStats, testStats)}%`);
}
```

## Fase 4: VALIDAR - Confirmación y Documentación

### Criteria de Validación

#### Confirmación de Causa Raíz
- **Explicación completa**: La causa explica todos los síntomas observados
- **No contradicciones**: No hay evidencia que refute la hipótesis
- **Reproducibilidad**: El problema puede reproducirse consistentemente
- **Predictibilidad**: La hipótesis predice otros comportamientos relacionados

#### Verificación de Solución
- **Fix efectivo**: El problema realmente se resuelve
- **No side effects**: No se introducen nuevos problemas
- **Performance aceptable**: La solución no degrada performance
- **Escalabilidad**: Funciona bajo load real

#### Pruebas Negativas
```typescript
function validateFix(fix: Fix): ValidationResult {
  const tests = [
    () => testOriginalScenario(), // Should pass now
    () => testEdgeCases(),        // Should still pass
    () => testUnderLoad(),        // Should perform well
    () => testIntegration(),      // Should not break other features
  ];

  const results = tests.map(test => {
    try {
      test();
      return { passed: true, error: null };
    } catch (error) {
      return { passed: false, error: error.message };
    }
  });

  const allPassed = results.every(r => r.passed);
  const failures = results.filter(r => !r.passed);

  return {
    isValid: allPassed,
    failures: failures.map(f => f.error),
    recommendation: allPassed ? "DEPLOY" : "FIX TESTS"
  };
}
```

### Documentación de Lecciones Aprendidas

#### Template de Post-mortem
```markdown
# Debug Post-mortem: [Problem Title]

## Resumen Ejecutivo
- **Problema**: Descripción concisa del problema
- **Impacto**: Usuarios afectados, duración, severidad
- **Causa raíz**: Explicación clara y técnica
- **Solución**: Qué se hizo para arreglarlo
- **Prevención**: Cómo evitarlo en el futuro

## Línea de Tiempo
- **HH:MM**: Problema detectado
- **HH:MM**: Investigación iniciada
- **HH:MM**: Causa raíz identificada
- **HH:MM**: Fix implementado
- **HH:MM**: Servicios restaurados

## Análisis Detallado
### Observación
- Datos recolectados
- Patrones identificados
- Evidencia encontrada

### Hipótesis
- Causas consideradas
- Razones de priorización
- Predicciones hechas

### Experimentación
- Tests realizados
- Resultados obtenidos
- Conclusión alcanzada

### Validación
- Confirmación de causa
- Verificación de solución
- Tests de regresión

## Lecciones Aprendidas
### Técnicas
- Qué métodos de debugging funcionaron mejor
- Qué herramientas fueron más útiles
- Qué enfoques fueron contraproducentes

### Proceso
- Dónde perdimos tiempo
- Qué podríamos haber hecho más rápido
- Qué faltó en nuestro proceso

### Sistema
- Qué cambios arquitectónicos prevendrían esto
- Qué monitoring necesitamos agregar
- Qué documentación faltaba

## Acciones de Seguimiento
- [ ] Actualizar documentation
- [ ] Agregar alerting/me monitoring
- [ ] Implementar architectural changes
- [ ] Compartir lecciones con equipo
```

### Métricas de Debugging Exitoso

#### Métricas Cuantitativas
- **Time to resolution**: Tiempo desde detección hasta fix
- **Number of hypotheses**: Causas consideradas vs encontradas
- **Experiment success rate**: Experimentos que dieron resultados claros
- **Regression rate**: Problemas similares que reaparecieron

#### Métricas Cualitativas
- **Documentation completeness**: Post-mortem completo y útil
- **Team learning**: Lecciones aplicadas a futuros problemas
- **Process improvement**: Cambios en debugging workflow
- **Knowledge sharing**: Compartir findings con otros equipos

## Checklist Final de Validación

### Confirmación Técnica
- [ ] Causa raíz completamente identificada
- [ ] Solución implementa y probada
- [ ] No hay efectos secundarios no deseados
- [ ] Performance es aceptable bajo load real

### Validación de Negocio
- [ ] Impacto en usuarios es mínimo/nulo
- [ ] Comunicación a stakeholders completa
- [ ] SLAs y métricas restauradas
- [ ] Plan de comunicación ejecutado

### Mejora Continua
- [ ] Post-mortem documentado y compartido
- [ ] Lecciones aprendidas identificadas
- [ ] Acciones preventivas implementadas
- [ ] Process actualizado basado en experiencia