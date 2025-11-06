---
id: systematic-debugging
version: 0.1.0
type: guideline
enforcement: suggest
summary: 'Marco en 4 fases para encontrar/validar la causa raíz de problemas: Observar → Formular Hipótesis → Experimentar → Validar.'
audience: engineers
when_to_use: 'Al enfrentar bugs complejos o problemas de comportamiento inesperado que requieren análisis sistemático.'
provides: Metodología estructurada de debugging, técnicas de aislamiento, patrones de experimentación, guías de troubleshooting.
resources:
  - resources/debugging-phases.md
  - resources/isolation-techniques.md
  - resources/experiment-patterns.md
  - resources/tools-techniques.md
scripts:
  - name: debug-start
    run: node scripts/debug/session-start.js <issue-description>
    note: Inicia sesión de debugging con estructura organizada
  - name: debug-isolate
    run: node scripts/debug/isolate-component.js <component-name>
    note: Aísla componente específico para debugging
  - name: debug-log
    run: node scripts/debug/enable-logging.js <level>
    note: Habilita logging detallado para troubleshooting
limits: Requiere acceso a logs, entorno de testing, y capacidad de reproducir el problema.
---

## Objetivo

Aplicar un método sistemático y estructurado para identificar la causa raíz de problemas complejos, evitando abordajes caóticos y garantizando soluciones efectivas y duraderas.

**Cuándo usar**:
- Bugs intermitentes difíciles de reproducir
- Problemas de rendimiento sin causa obvia
- Comportamientos inesperados en sistemas complejos
- Issues que reaparecen después de supuestas correcciones

**Cuándo NO usar**: Para problemas simples con solución evidente (ej. typos, errores de sintaxis evidentes).

**Qué problema resuelve**: Evita debugging aleatorio, reduce tiempo de resolución, documenta el proceso para futuras referencias, previene regresiones.

## Procedimiento (resumen)

### Marco de 4 Fases

#### Fase 1: OBSERVAR
- **Recolectar datos**: Logs, métricas, screenshots, traces
- **Definir el problema**: Qué está mal vs qué debería pasar
- **Identificar patrones**: Cuándo ocurre, qué lo desencadena
- **Documentar estado**: Versión, entorno, configuración actual

#### Fase 2: FORMULAR HIPÓTESIS
- **Brainstorming causas**: Todas las posibles explicaciones
- **Priorizar hipótesis**: Por probabilidad y facilidad de validación
- **Identificar variables**: Qué factores pueden influir
- **Predecir síntomas**: Qué evidencia debería aparecer si la hipótesis es correcta

#### Fase 3: EXPERIMENTAR
- **Diseñar tests**: Para validar/refutar cada hipótesis
- **Aislar variables**: Cambiar una cosa a la vez
- **Reproducir consistentemente**: Mismo problema, mismo resultado
- **Documentar experimentos**: Qué se probó, resultados obtenidos

#### Fase 4: VALIDAR
- **Confirmar causa raíz**: La hipótesis explica todos los síntomas
- **Verificar solución**: El fix realmente resuelve el problema
- **Testar negativos**: Confirmar que no hay regressiones
- **Documentar lecciones**: Qué aprendimos para prevenir futuros problemas

## Checklist

### Observación
- [ ] Problema claramente definido y reproducible
- [ ] Logs y evidencia recolectados
- [ ] Entorno y versión documentados
- [ ] Patrones y condiciones identificados

### Hipótesis
- [ ] Múltiples causas posibles consideradas
- [ ] Hipótesis priorizadas por probabilidad
- [ ] Predicciones específicas formuladas
- [ ] Variables de influencia identificadas

### Experimentación
- [ ] Tests diseñados para validación
- [ ] Una variable modificada a la vez
- [ ] Resultados consistentes obtenidos
- [ ] Experimentos documentados

### Validación
- [ ] Causa raíz confirmada
- [ ] Solución implementada y probada
- [ ] No hay regressiones introducidas
- [ ] Lecciones aprendidas documentadas

## Ejemplos

### ✅ Correcto - Problema de Performance

```typescript
// FASE 1: OBSERVAR
// Problema: API endpoint responde en 5s en producción
// Logs: Slow queries detectadas en database
// Patrón: Ocurre solo con > 1000 usuarios concurrentes

// FASE 2: FORMULAR HIPÓTESIS
// H1: Database query no optimizada (probable)
// H2: Memory leak en aplicación (media)
// H3: Network latency (baja)

// FASE 3: EXPERIMENTAR
// Test 1: Ejecutar query directamente en DB (tomó 200ms)
// Test 2: Profile de memoria (sin leaks detectados)
// Test 3: Añadir logging detallado (bottleneck en ORM)

// FASE 4: VALIDAR
// Causa: N+1 query problem en User.relationships
// Solución: Eager loading con includes
// Verificación: Response time < 200ms
```

### ✅ Correcto - Bug Intermitente

```typescript
// FASE 1: OBSERVAR
// Problema: Login falla aleatoriamente (1/10 veces)
// Logs: "Invalid CSRF token" en failed attempts
// Patrón: Ocurre solo en mobile Safari

// FASE 2: FORMULAR HIPÓTESIS
// H1: Race condition en token generation (probable)
// H2: Browser-specific caching issue (media)
// H3: Mobile network timeout (baja)

// FASE 3: EXPERIMENTAR
// Test 1: Añadir timestamp a tokens (reproduce consistentemente)
// Test 2: Testing en diferentes browsers (solo Safari falla)
// Test 3: Simular network conditions (no afecta)

// FASE 4: VALIDAR
// Causa: CSRF token generado antes de cookie establishment
// Solución: Delay token generation hasta después de cookies
// Verificación: 0 failed logins en 1000 pruebas
```

### ❌ Incorrecto - Abordaje Caótico

```typescript
// ❌ Sin método sistemático
function debugSlowAPI() {
  // Intentar random fixes sin diagnóstico
  console.log("Maybe add more logging?"); // Cambio 1
  setTimeout(() => console.log("Check cache?"), 1000); // Cambio 2
  if (Math.random() > 0.5) {
    restartServer(); // Cambio 3 - sin saber qué arregla
  }
  // Ningún cambio documentado o probado sistemáticamente
}
```

## Técnicas Específicas

### 1. Binary Search Debugging
```typescript
// Para encontrar línea problemática en código grande
function findBugInCode(startLine: number, endLine: number): void {
  const mid = Math.floor((startLine + endLine) / 2);

  // Comentar primera mitad
  if (bugStillExists(mid + 1, endLine)) {
    // Bug está en segunda mitad
    findBugInCode(mid + 1, endLine);
  } else {
    // Bug está en primera mitad
    findBugInCode(startLine, mid);
  }
}
```

### 2. Rubber Duck Debugging
```typescript
// Explicar el código línea por línea
// Descubrir errores al verbalizar el problema
function rubberDebug(problem: string): void {
  // 1. Explicar qué debería hacer el código
  // 2. Explicar qué está haciendo realmente
  // 3. Identificar la discrepancia
  // 4. Proponer soluciones
}
```

### 3. Hypothesis-Driven Testing
```typescript
interface DebugTest {
  hypothesis: string;
  experiment: () => boolean;
  expectedResult: boolean;
  actualResult: boolean;
}

const debugTests: DebugTest[] = [
  {
    hypothesis: "Database connection is the issue",
    experiment: () => testDatabaseConnection(),
    expectedResult: true,
    actualResult: false
  },
  {
    hypothesis: "API key is expired",
    experiment: () => validateAPIKey(),
    expectedResult: true,
    actualResult: true
  }
];
```

## Herramientas Comandos

```bash
# Debug session estructurada
debug-start "API responses are slow in production"

# Análisis de logs
grep -n "ERROR" app.log | tail -20
tail -f app.log | grep "pattern"

# Profile de rendimiento
node --prof app.js
node --prof-process isolate-*.log > processed.txt

# Memory leak detection
node --inspect app.js
# En Chrome: chrome://inspect
```

## Recursos

Ver `resources/` para:
- `debugging-phases.md`: Detalle de cada fase con checkpoints
- `isolation-techniques.md`: Métodos para aislar componentes problemáticos
- `experiment-patterns.md`: Patrones de diseño de experimentos
- `tools-techniques.md`: Herramientas específicas por tipo de problema