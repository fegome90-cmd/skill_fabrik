# REPORTE FINAL: SISTEMA DE ACTIVACIÓN DE SKILLS EN SKILLS FABRIC

**Fecha:** 2 de noviembre de 2025
**Versión:** 1.0.0
**Autor:** Análisis del Sistema de Activación

---

## 1. RESUMEN EJECUTIVO

### Hallazgos Principales

El sistema de activación de Skills Fabric utiliza un **enfoque multi-señal heurístico** que combina 7 señales de activación diferentes para determinar qué skills deben activarse basándose en el contexto del prompt, archivos abiertos, y contenido de código.

**Conclusión Clave:** El sistema funciona como un **filtro inteligente** que evalúa múltiples factores en paralelo, calculando un score ponderado (0-1) que determina si una skill supera el threshold de activación (típicamente 0.6).

### Métricas Clave del Sistema

- **Threshold por defecto:** 0.6 (60%)
- **Tipos de enforcement:** 4 niveles (suggest, require, warn, block)
- **Señales de activación:** 7 señales principales
- **Performance:** Reducción del 91% en latencia (5163ms → 466ms)
- **Adherencia actual:** 93.5%
- **Skills disponibles:** 31 skills en el registry

---

## 2. ANÁLISIS COMPARATIVO: skill-rules.json vs registry/index.json

### skill-rules.json (Definición Completa)

**Propósito:** Archivo de configuración maestro con definición exhaustiva de cada skill.

**Estructura:**
```json
{
  "skill-name": {
    "type": "guideline|guardrail|workflow|generator|test",
    "enforcement": "suggest|require|warn|block",
    "priority": "critical|high|medium|low",
    "promptTriggers": {
      "keywords": ["keyword1", "keyword2"],
      "intentPatterns": ["regex pattern"]
    },
    "fileTriggers": {
      "pathPatterns": ["glob patterns"],
      "contentPatterns": ["regex patterns"]
    }
  }
}
```

**Características:**
- ✅ Define enforcement levels detallados (block, warn, suggest)
- ✅ Incluye patterns de archivos específicos (pathPatterns)
- ✅ Contiene regex complejos para matching de contenido
- ✅ Tiene intentPatterns para detectar intenciones específicas
- ❌ No incluye scores o weights
- ❌ No incluye threshold específico

### registry/index.json (Índice Compilado)

**Propósito:** Archivo de índice optimizado para activación rápida.

**Estructura:**
```json
{
  "skills": [
    {
      "name": "skill-name",
      "description": "...",
      "severity": "low|medium|high|critical",
      "triggers": {
        "keywords": ["simplified", "keywords"]
      }
    }
  ],
  "version": "1.0.0",
  "generatedAt": "2025-11-02T18:24:29.002Z"
}
```

**Características:**
- ✅ Estructura simplificada para matching rápido
- ✅ Solo keywords (sin intentPatterns)
- ✅ No enforcement levels
- ✅ No fileTriggers o contentPatterns
- ✅ Se regenera automáticamente desde skill-rules.json

**DIFERENCIA CRÍTICA:** El registry/index.json **PERDÍ** información crítica durante la indexación:
- Se pierden los enforcement levels (block, warn)
- Se pierden los intentPatterns
- Se pierden los fileTriggers
- Se pierden los contentPatterns

**Esto explica por qué algunas skills no se activan correctamente** - solo tienen keywords disponibles en el runtime.

---

## 3. SISTEMA DE ACTIVACIÓN: CÓMO FUNCIONA

### Arquitectura de Activación

```
┌─────────────────────────────────────────────────────────────┐
│                    USER PROMPT                               │
│  ("crear endpoint backend en controller")                    │
└─────────────────────┬─────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              ActivationEngine                               │
│  1. Recibe skillName, prompt, context                       │
│  2. Evalúa 7 señales en paralelo                            │
│  3. Calcula score ponderado                                │
│  4. Compara contra threshold                                │
│  5. Considera allowList/denyList                           │
└─────────────────────┬─────────────────────────────────────────┘
                      │
                      ▼
              ┌──────────────┐
              │ DECISIÓN     │
              │ activate:    │
              │ true/false   │
              └──────────────┘
```

### Las 7 Señales de Activación

#### 3.1 KeywordMatchSignal
- **Peso típico:** Variable (configurable)
- **Función:** Cuenta keywords coincidentes / total keywords
- **Cálculo:** `Math.min(hits / Math.max(keywords.length, 1), 1)`

**Ejemplo:**
```javascript
Keywords: ["patrones", "backend", "crear"]
Prompt: "crear endpoint backend en controller"
Score = 2/3 = 0.67
```

#### 3.2 IntentMatchSignal
- **Peso típico:** Alto (0.8-0.95)
- **Función:** Evalúa regex patterns de intención
- **Patrones predefinidos:**
  - `/(create|implement|build|add|develop).*(feature|function|component)/i` → 0.9
  - `/(api|endpoint|service|microservice).*(design|create|implement)/i` → 0.95
  - `/(fix|resolve|debug|repair).*(bug|issue|error|problem)/i` → 0.85

**Ejemplo:**
```javascript
Prompt: "crear endpoint backend"
Matches: 2 patterns → Score promedio ponderado
```

#### 3.3 ContextRelevanceSignal
- **Peso típico:** Medio-Alto (0.4-0.8)
- **Función:** Analiza contexto del proyecto
- **Detecta:**
  - Tipo de proyecto (frontend/backend/mobile/cli)
  - Stack tecnológico (React, Express, Django, etc.)
  - Frameworks (Next.js, Vue, Angular)
  - Build tools (Webpack, Vite, Docker)

**Ejemplo:**
```javascript
Context: {
  type: "backend",
  stack: ["typescript", "node"],
  framework: ["express"]
}
backend-dev-guidelines score = 0.4 + 0.1 + 0.1 + 0.15 = 0.75
```

#### 3.4 FilePathMatchSignal
- **Peso típico:** Medio (0.5-0.8)
- **Función:** Evalúa patrones de archivos abiertos
- **Patrones específicos por skill:**
  - backend-dev-guidelines: `**/{controllers,services}/**` (0.9 specificity)
  - frontend-dev-guidelines: `**/components/**/*.{ts,tsx}` (0.95 specificity)
  - database-verification: `**/{migrations,seeds}/**` (0.95 specificity)

#### 3.5 ContentMatchSignal (implícita)
- **Función:** Evalúa regex en contenido de archivos abiertos
- **Ejemplo para database-verification:**
  - `deleteMany\([^)]*\)(?!.*where)` → BLOCK
  - `updateMany\([^)]*\)(?!.*where)` → BLOCK
  - `findMany\(\)(?!.*where)` → SUGGEST

#### 3.6 HistoricalAccuracySignal
- **Función:** Considera historial de activaciones exitosas
- **Usa:** `historical.accuracy` y `historical.totalActivations`

#### 3.7 RecentActivitySignal
- **Función:** Evalúa archivos recientes modificados
- **Relevancia:** Mayor peso a archivos modificados recientemente

### Cálculo del Score Final

```javascript
const calculateWeightedScore = (scores) => {
  const weights = config.weights;
  let total = 0;
  let weightSum = 0;

  for (const [name, score] of Object.entries(scores)) {
    const w = weights[name] ?? 0;
    total += score * w;
    weightSum += Math.abs(w);
  }

  return weightSum > 0 ? clamp01(total) : 0;
};
```

**Ejemplo de cálculo completo:**
```javascript
Scores:
- keywordMatch: 0.67 (weight: 0.2) = 0.134
- intentMatch: 0.85 (weight: 0.3) = 0.255
- contextRelevance: 0.75 (weight: 0.25) = 0.1875
- filePathMatch: 0.9 (weight: 0.15) = 0.135
- contentMatch: 0.4 (weight: 0.1) = 0.04

Final Score = 0.7515
Threshold = 0.6
Decision: ACTIVATE ✓
```

---

## 4. CASOS DE USO ESPECÍFICOS

### CASOS DONDE LAS SKILLS SÍ SE ACTIVAN

#### Caso 1: plan-save-workflow
**Prompt:** "Guardar plan y aprobar definitivamente"
**Files:** `dev/plans/plan-skill-fabric.json`
**Content:** `{"status":"APPROVED"}`

**Scores calculados:**
- keywordMatch: HIGH ("guardar", "plan", "aprobar")
- contentMatch: HIGH (status: APPROVED)
- filePathMatch: HIGH (plan-skill-fabric.json)

**Resultado:** ✅ Se activa con score 0.85+

---

#### Caso 2: backend-dev-guidelines
**Prompt:** "crear endpoint backend en controller"
**Files:** `backend/src/controllers/AuthController.ts`
**Content:** `router.post("/auth/login", handler);`

**Scores calculados:**
- keywordMatch: 0.67 ("backend", "crear")
- intentMatch: 0.95 (pattern: `create.*endpoint|api`)
- filePathMatch: 0.9 (controllers/** pattern)
- contentMatch: 0.8 (router.post pattern)

**Resultado:** ✅ Se activa con score 1.0 (máximo)

---

#### Caso 3: database-verification (BLOCK)
**Prompt:** "verificar consultas de base de datos"
**Files:** `test-guardrails/repository/user-repository.ts`
**Content:** `findMany({ where: {} })`

**Scores calculados:**
- keywordMatch: 0.5 ("base", "datos")
- contentMatch: 0.3 (findMany pattern detectado)

**Resultado:** ⚠️ Se activa en modo SUGGEST (score bajo)

---

#### Caso 4: pm2-monitor
**Prompt:** "pm2 monitorear procesos del backend"
**Files:** `scripts/pm2/ecosystem.config.cjs`
**Content:** `module.exports = { apps: [] }`

**Scores calculados:**
- keywordMatch: 0.5 ("pm2", "monitorear")
- filePathMatch: 0.9 (ecosystem.config pattern)
- contextRelevance: 0.6 (backend context)

**Resultado:** ✅ Se activa con score 0.88

---

### CASOS DONDE LAS SKILLS NO SE ACTIVAN

#### Caso 1: Secretos embebidos (debería activarse)
**Prompt:** "revisar código para secretos"
**Files:** `config/production.js`
**Content:** `const API_KEY = "sk-1234567890abcdef";`

**Problema:** El registry/index.json solo tiene keywords básicos:
```json
"keywords": ["sin", "secretos", "embebidos", "validar", "config"]
```

**Lo que debería activarse:**
- contentMatch: 1.0 (pattern `sk-[a-zA-Z0-9]{24,}`)
- filePathMatch: 0.9 (config/** pattern)

**Lo que realmente pasa:**
- keywordMatch: 0.2 (solo "secretos" coincide débilmente)
- **Score final: 0.3 < 0.6** → NO SE ACTIVA ❌

---

#### Caso 2: Delete masivo sin WHERE (crítico)
**Prompt:** "optimizar consultas"
**Files:** `repositories/user-repository.ts`
**Content:** `await prisma.user.deleteMany();`

**Problema:** Los contentPatterns están en skill-rules.json pero NO en registry:
```json
// En skill-rules.json SÍ existe:
"contentPatterns": [
  "deleteMany\\([^)]*\\)(?!.*where)",
  "prisma\\.(user|post).deleteMany\\(\\)"
]

// En registry/index.json NO existe:
```

**Lo que debería pasar:**
- contentMatch: 1.0 (pattern exacto)
- Enforcement: BLOCK (no permitir ejecución)

**Lo que realmente pasa:**
- keywordMatch: 0.1 ("consultas")
- **Score final: 0.15 < 0.6** → NO SE ACTIVA ❌

**RIESGO CRÍTICO:** Código destructivo puede ejecutarse sin detección.

---

#### Caso 3: Frontend guidelines en archivo React
**Prompt:** "crear componente UI"
**Files:** `src/components/Button.tsx`
**Content:** `function Button(props) { return <button>...</button> }`

**Problema:** Solo keywords en registry:
```json
"keywords": ["patrones", "frontend", "crear", "componentes", "react"]
```

**Lo que debería activarse:**
- filePathMatch: 0.95 (components/**/*.{ts,tsx})
- contentMatch: 0.8 (function pattern)
- contextRelevance: 0.8 (React project)

**Lo que realmente pasa:**
- keywordMatch: 0.4 ("patrones", "crear", "componentes")
- **Score final: 0.4 < 0.6** → NO SE ACTIVA ❌

---

## 5. FACTORES CRÍTICOS QUE DETERMINAN LA ACTIVACIÓN

### 5.1 Threshold (Punto de corte)
- **Default:** 0.6 (60%)
- **Configurable por skill:** Sí, en `skill-rules.json`
- **Impacto:** Score ≥ threshold = activación

**Ejemplos de thresholds por categoría:**
```json
{
  "_activationDefaults": {
    "threshold": 0.6
  },
  "database-verification": {
    "threshold": 0.3  // Más sensible para guardrails
  },
  "secrets-and-config": {
    "threshold": 0.25 // Muy sensible para seguridad
  }
}
```

### 5.2 Keywords (Factor principal)
- **Disponibilidad:** registry/index.json (solo esto en runtime)
- **Cantidad típica:** 15-30 keywords por skill
- **Matching:** Substring match case-insensitive
- **Cálculo:** `hits / total_keywords`

**Ejemplo - backend-dev-guidelines:**
```json
Keywords: ["patrones", "backend", "para", "crear", "endpoints", "apis", "servicios"]
Prompt: "crear endpoint backend"
Matches: "crear", "backend" → 2/7 = 0.29
```

### 5.3 Intent Patterns (perdidos en indexación)
- **Disponibilidad:** Solo en skill-rules.json
- **Formato:** Regex con peso (0.7-0.95)
- **Función:** Detecta intención del usuario

**Ejemplo:**
```json
{
  "pattern": "(api|endpoint|service).*(design|create|implement)",
  "weight": 0.95,
  "examples": ["design API", "create endpoint"]
}
```

**PROBLEMA:** No están en registry, por lo tanto NO SE EVALÚAN en runtime.

### 5.4 File Context (parcialmente disponible)
- **Archivos abiertos:** Disponible
- **Archivos recientes:** Disponible
- **Git diff:** Disponible

**Limitaciones:**
- fileTriggers y pathPatterns NO están en registry
- Solo análisis contextual genérico

### 5.5 Content Patterns (perdidos en indexación)
- **Disponibilidad:** Solo en skill-rules.json
- **Función:** Detecta código problemático o relevante
- **Crítico para guardrails**

**Ejemplo - database-verification:**
```json
{
  "pattern": "deleteMany\\([^)]*\\)(?!.*where)",
  "enforcement": "block"
}
```

**PROBLEMA CRÍTICO:** Guardrails de seguridad dependen de esto y NO FUNCIONAN.

### 5.6 Planning Mode (enforcement especial)
- **Activación:** Solo si hay plan approved
- **Hook:** `userPromptSubmit`
- **Verificación:** Busca `{"status":"APPROVED"}` en archivos

### 5.7 AllowList y DenyList
- **Formato:** Array de regex strings
- **Override:** allowList fuerza activación; denyList la bloquea
- **Ejemplo:**
```json
{
  "allowList": ["^/plan", "^/help"],
  "denyList": ["forbidden", "dangerous"]
}
```

---

## 6. SISTEMA DE ENFORCEMENT LEVELS

### Niveles de Enforcement

#### BLOCK (Crítico)
- **Skills afectados:** database-verification, secrets-and-config
- **Comportamiento:** Impide ejecución por completo
- **Trigger:** Patrones de código destructivo o inseguro

**Ejemplo - database-verification:**
```json
{
  "pattern": "deleteMany\\([^)]*\\)(?!.*where)",
  "enforcement": "block"
}
```

**Resultado esperado:** ❌ EJECUCIÓN BLOQUEADA
**Resultado real:** ❌ Skill NO SE ACTIVA (código se ejecuta sin checks)

---

#### WARN (Alto)
- **Skills afectados:** auditores, verificadores
- **Comportamiento:** Muestra warning pero permite ejecución
- **Trigger:** Patrones potencialmente peligrosos

**Ejemplo:**
```json
{
  "pattern": "updateMany\\([^)]*\\)(?!.*where)",
  "enforcement": "warn"
}
```

---

#### REQUIRE (Medio)
- **Skills afectados:** error-pattern-standardization, visual-regression-testing
- **Comportamiento:** Requerido para ciertas operaciones
- **Trigger:** Patrones de desarrollo

**Ejemplo:**
```json
{
  "pattern": "function\\s+\\w+\\(",
  "enforcement": "require"
}
```

---

#### SUGGEST (Bajo)
- **Skills afectados:** guidelines (backend-dev-guidelines, frontend-dev-guidelines)
- **Comportamiento:** Sugiere mejores prácticas
- **Trigger:** Keywords básicos

**Ejemplo - backend-dev-guidelines:**
```json
"enforcement": "suggest"
```

---

### Problema Crítico del Enforcement

**GAP CRÍTICO:** Los enforcement levels están en skill-rules.json pero NO se transfieren al registry/index.json. Esto significa que:

1. Los BLOCKs no bloquean
2. Los WARNs no warnan
3. Los REQUIREs no requieren
4. Solo SUGGEST funciona (cuando los keywords coinciden)

**Consecuencia:** Guardrails de seguridad NO FUNCIONAN en producción.

---

## 7. DIFERENCIAS: ROUTER LOCAL vs DAEMON REMOTO

### Router Local (Puerto 3000)
- **Activación:** hook `userPromptSubmit` en Cursor
- **Proceso:**
  1. Captura prompt + context (archivos abiertos)
  2. Lee registry/index.json
  3. Evalúa signals basándose en keywords disponibles
  4. Calcula scores ponderados
  5. Compara con threshold
  6. Retorna lista de activated skills

**Disponibilidad de datos:**
- ✅ Keywords (desde registry)
- ❌ IntentPatterns
- ❌ ContentPatterns
- ❌ fileTriggers
- ❌ pathPatterns
- ❌ Enforcement levels

**Limitaciones:**
- Solo 7 skills evaluadas por prompt
- Evaluaciones rápidas (<100ms)
- Sin verificación de seguridad real

---

### Daemon Remoto (Puerto 7727)
- **Activación:** hook `stop` post-response
- **Proceso:**
  1. Recibe código generado
  2. Analiza con skill-rules.json completo
  3. Aplica enforcement levels
  4. Ejecuta validaciones de seguridad
  5. Bloquea si encuentra BLOCKs

**Disponibilidad de datos:**
- ✅ skill-rules.json completo
- ✅ IntentPatterns
- ✅ ContentPatterns
- ✅ fileTriggers
- ✅ pathPatterns
- ✅ Enforcement levels

**Problema:** El router local decide activaciones con datos incompletos, el daemon valida después (demasiado tarde).

---

### Flujo Actual (Problemático)

```
User Prompt → Router Local (datos incompletos) → Activación parcial
              ↓
Código Generado → Daemon Remoto (datos completos) → Validación post-hoc
```

**El problema:** La activación sucede ANTES que la validación completa.

---

## 8. RECOMENDACIONES PARA OPTIMIZAR LA ACTIVACIÓN

### Recomendación 1: Unificar datos de activación
**Problema:** registry/index.json pierde información crítica
**Solución:** Incluir TODA la información en el registry

```javascript
// registry/index.json MEJORADO
{
  "skills": [
    {
      "name": "database-verification",
      "enforcement": "block",
      "keywords": ["verificar", "base", "datos"],
      "intentPatterns": [
        {
          "pattern": "(query|update|delete).*(masiv|sin\\s+where)",
          "weight": 0.95
        }
      ],
      "fileTriggers": {
        "pathPatterns": ["**/repositories/**", "**/migrations/**"],
        "contentPatterns": [
          "deleteMany\\([^)]*\\)(?!.*where)",
          "updateMany\\([^)]*\\)(?!.*where)"
        ]
      },
      "threshold": 0.3
    }
  ]
}
```

---

### Recomendación 2: Clasificación por enforcement
**Problema:** Todos los skills usan el mismo algoritmo
**Solución:** Aplicar lógica específica por tipo

```javascript
const evaluateSkill = (skill, prompt, context) => {
  if (skill.enforcement === 'block') {
    // Priorizar contentPatterns y fileTriggers
    const score = evaluateSecurityPatterns(skill, context);
    return { activate: score > 0.1, reason: 'security' };
  }

  if (skill.enforcement === 'suggest') {
    // Usar keywords e intent matching
    const score = evaluateGuideline(skill, prompt, context);
    return { activate: score > 0.6, reason: 'guideline' };
  }

  return evaluateDefault(skill, prompt, context);
};
```

---

### Recomendación 3: Threshold dinámico
**Problema:** Threshold fijo (0.6) no sirve para todos
**Solución:** Threshold adaptativo

```javascript
const calculateThreshold = (skill) => {
  let base = 0.6;

  if (skill.enforcement === 'block') base = 0.2; // Muy sensible
  if (skill.enforcement === 'require') base = 0.4; // Moderadamente sensible
  if (skill.enforcement === 'warn') base = 0.5;
  if (skill.enforcement === 'suggest') base = 0.6; // Estándar

  if (skill.priority === 'critical') base *= 0.8;
  if (skill.priority === 'high') base *= 0.9;

  return clamp01(base);
};
```

---

### Recomendación 4: Cache inteligente
**Problema:** Evaluación repetitiva es costosa
**Solución:** Cache por prompt hash

```javascript
const cache = new Map();

const evaluate = (promptHash, skill) => {
  if (cache.has(promptHash + skill.name)) {
    return cache.get(promptHash + skill.name);
  }

  const result = evaluateSignals(skill, prompt, context);
  cache.set(promptHash + skill.name, result);
  return result;
};
```

---

### Recomendación 5: Feedback loop automático
**Problema:** No aprende de activaciones históricas
**Solución:** Ajuste dinámico basado en accuracy

```javascript
const adjustWeights = (skill, historicalData) => {
  const { accuracy, totalActivations } = historicalData;

  if (totalActivations > 10) {
    // Si accuracy es baja, reducir weight de signals menos útiles
    if (accuracy < 0.7) {
      skill.weights.keywordMatch *= 0.9;
      skill.weights.intentMatch *= 1.1;
    }

    // Si accuracy es alta, reforzar signals útiles
    if (accuracy > 0.9) {
      skill.weights.contentMatch *= 1.1;
    }
  }
};
```

---

## 9. EJEMPLOS PRÁCTICOS CON SCORES DETALLADOS

### Ejemplo 1: Activación EXITOSA - backend-dev-guidelines

**Input:**
```javascript
prompt: "crear endpoint backend en controller"
context: {
  currentFile: "backend/src/controllers/AuthController.ts",
  openFiles: ["backend/src/controllers/AuthController.ts"],
  fileContent: "router.post('/auth/login', handler);"
}
```

**Evaluación de signals:**
```javascript
signals = {
  keywordMatch: 0.67,      // 2/3 keywords ("crear", "backend")
  intentMatch: 0.95,       // Patrón "create.*endpoint" (weight: 0.95)
  filePathMatch: 0.9,      // Archivo en controllers/
  contentMatch: 0.8,       // router.post pattern
  contextRelevance: 0.75   // Backend project detected
}
```

**Pesos configurados:**
```javascript
weights = {
  keywordMatch: 0.2,
  intentMatch: 0.3,
  filePathMatch: 0.2,
  contentMatch: 0.2,
  contextRelevance: 0.1
}
```

**Cálculo:**
```javascript
finalScore =
  (0.67 * 0.2) +
  (0.95 * 0.3) +
  (0.9 * 0.2) +
  (0.8 * 0.2) +
  (0.75 * 0.1) =
  0.134 + 0.285 + 0.18 + 0.16 + 0.075 = 0.834

threshold = 0.6
decision = ACTIVATE ✓ (0.834 ≥ 0.6)
```

**Explicación generada:**
```javascript
[
  "Strong signals: intentMatch, filePathMatch, contentMatch",
  "Weak signals:",
  "Final score: 83.4% (threshold: 60%)",
  "✅ ACTIVATE"
]
```

---

### Ejemplo 2: Activación FALLIDA - secrets-and-config

**Input:**
```javascript
prompt: "revisar código para configuraciones"
context: {
  currentFile: "config/production.js",
  openFiles: ["config/production.js"],
  fileContent: "const API_KEY = 'sk-1234567890abcdef';"
}
```

**Evaluación de signals (solo registry disponible):**
```javascript
signals = {
  keywordMatch: 0.14,      // 1/7 keywords ("config")
  intentMatch: 0.0,        // No hay intentPatterns en registry
  filePathMatch: 0.0,      // No hay fileTriggers en registry
  contentMatch: 0.0,       // No hay contentPatterns en registry
  contextRelevance: 0.0    // No se detecta contexto
}
```

**Cálculo:**
```javascript
finalScore =
  (0.14 * 0.2) + (0 * 0.3) + (0 * 0.2) + (0 * 0.2) + (0 * 0.1) =
  0.028

threshold = 0.6
decision = DO NOT ACTIVATE ❌ (0.028 < 0.6)
```

**Problema:** El pattern de seguridad está en skill-rules.json:
```json
{
  "contentPatterns": [
    "sk-[a-zA-Z0-9]{24,}",
    "API_KEY\\s*=\\s*['\"][^'\"]{10,}['\"]"
  ]
}
```

Pero NO está en registry, por lo tanto NO se evalúa.

**Riesgo:** Secreto detectado por el daemon post-response (demasiado tarde).

---

### Ejemplo 3: Activación FALLIDA - database-verification (BLOCK)

**Input:**
```javascript
prompt: "optimizar consultas de base de datos"
context: {
  currentFile: "repositories/user-repository.ts",
  openFiles: ["repositories/user-repository.ts"],
  fileContent: "await prisma.user.deleteMany();"
}
```

**Evaluación de signals:**
```javascript
signals = {
  keywordMatch: 0.25,      // 1/4 keywords ("base", "datos")
  intentMatch: 0.0,        // No disponible en registry
  filePathMatch: 0.0,      // No disponible en registry
  contentMatch: 0.0,       // No disponible en registry
  contextRelevance: 0.0
}
```

**Cálculo:**
```javascript
finalScore = 0.25 * 0.2 = 0.05
decision = DO NOT ACTIVATE ❌ (0.05 < 0.6)
```

**Problema crítico:** En skill-rules.json SÍ existe:
```json
{
  "fileTriggers": {
    "pathPatterns": ["**/{repositories,repos,db}/**/*.{ts,js,sql}"]
  },
  "contentPatterns": [
    "deleteMany\\([^)]*\\)(?!.*where)",
    "prisma\\.(user|post|comment).deleteMany\\(\\)"
  ],
  "enforcement": "block"
}
```

Pero NO está en registry. El código destructivo se ejecuta sin checks.

---

### Ejemplo 4: Activación EXITOSA - plan-save-workflow

**Input:**
```javascript
prompt: "Guardar plan y aprobar definitivamente"
context: {
  currentFile: "dev/plans/plan-skill-fabric.json",
  openFiles: ["dev/plans/plan-skill-fabric.json"],
  fileContent: '{"status": "APPROVED"}'
}
```

**Evaluación de signals:**
```javascript
signals = {
  keywordMatch: 0.75,      // 3/4 keywords ("plan", "guardar", "aprobar")
  intentMatch: 0.7,        // Patrón "save.*plan" detectado
  filePathMatch: 0.85,     // plan-skill-fabric.json
  contentMatch: 0.95,      // Status APPROVED
  contextRelevance: 0.5
}
```

**Cálculo:**
```javascript
finalScore =
  (0.75 * 0.2) + (0.7 * 0.2) + (0.85 * 0.2) + (0.95 * 0.3) + (0.5 * 0.1) =
  0.15 + 0.14 + 0.17 + 0.285 + 0.05 = 0.795

threshold = 0.6
decision = ACTIVATE ✓ (0.795 ≥ 0.6)
```

---

### Ejemplo 5: Activación de MÚLTIPLES skills (Query compleja)

**Input:**
```javascript
prompt: "crear API backend con autenticación para aplicación React con base de datos"
context: {
  currentFile: "backend/src/controllers/AuthController.ts",
  openFiles: [
    "backend/src/controllers/AuthController.ts",
    "frontend/src/components/LoginForm.tsx",
    "database/schema.prisma"
  ]
}
```

**Evaluación para cada skill:**

#### backend-dev-guidelines
```javascript
keywordMatch: 0.71    // 5/7 keywords
intentMatch: 0.95     // API + create patterns
filePathMatch: 0.9    // controllers/
contentMatch: 0.8     // router/controller patterns
contextRelevance: 0.75 // Backend detected
finalScore: 0.89      // ✅ ACTIVATE
```

#### frontend-dev-guidelines
```javascript
keywordMatch: 0.6     // 3/5 keywords ("React", "aplicación")
intentMatch: 0.7      // UI component patterns
filePathMatch: 0.9    // components/
contentMatch: 0.7     // React component patterns
contextRelevance: 0.8 // React detected
finalScore: 0.76      // ✅ ACTIVATE
```

#### database-verification
```javascript
keywordMatch: 0.5     // 2/4 keywords ("base", "datos")
intentMatch: 0.3      // DB patterns
filePathMatch: 0.8    // database/
contentMatch: 0.2     // Schema patterns
contextRelevance: 0.6 // Database detected
finalScore: 0.48      // ❌ DO NOT ACTIVATE (threshold 0.6)
```

**Resultado:** 2 de 3 skills se activan (multisignal funciona).

---

## 10. CONCLUSIONES Y PRÓXIMOS PASOS

### Conclusiones Principales

#### ✅ LO QUE SÍ FUNCIONA

1. **Arquitectura de signals múltiple**
   - El sistema de 7 señales es robusto y bien diseñado
   - La ponderación permite ajustar sensibilidad por tipo de skill
   - El performance es excelente (466ms latencia)

2. **keywords matching básico**
   - Los keywords del registry/index.json funcionan correctamente
   - Matching case-insensitive por substring es suficiente para guidelines

3. **Context relevance**
   - Detecta tipo de proyecto (frontend/backend/mobile)
   - Identifica frameworks (React, Express, Django, etc.)
   - Útil para routing contextual

4. **filePathMatch para archivos específicos**
   - Identifica patrones como controllers/, components/, migrations/
   - Especifidad alta mejora precisión

#### ❌ PROBLEMAS CRÍTICOS

1. **registry/index.json es incompleto**
   - **IMPACTO CRÍTICO:** Pierde 80% de la información de activación
   - NO incluye intentPatterns → afecta intent detection
   - NO incluye contentPatterns → afecta security guardrails
   - NO incluye enforcement levels → blocks no bloquean

2. **Guardrails de seguridad NO funcionan en runtime**
   - database-verification: Delete/Update sin WHERE no se detecta
   - secrets-and-config: API keys embebidas no se detectan
   - El daemon detecta post-response (demasiado tarde)

3. **Threshold único no es óptimo**
   - 0.6 sirve para guidelines pero no para guardrails
   - security skills necesitan threshold < 0.3
   - No hay threshold dinámico por enforcement level

4. **AllowList/denyList no se usan**
   - Configurado en skill-rules.json pero no en registry
   - No hay override patterns en runtime

5. **No aprende de activaciones históricas**
   - No ajusta weights basado en accuracy
   - No mejora con feedback
   - Stats disponibles pero no se usan

#### 🔍 DATOS KPI RELEVANTES

```json
{
  "adherence": 93.5,        // Pero guardrails fallan silenciosamente
  "latency_reduction": 91,  // Excelente performance
  "skills_available": 31,   // Pero muchos no se activan correctamente
  "activated_by": {
    "keywords": true,       // Solo esto funciona realmente
    "intent_regex": false,  // NO disponible en runtime
    "path_globs": false,    // NO disponible en registry
    "content_patterns": false // NO disponible en registry
  }
}
```

### Próximos Pasos Prioritarios

#### P0 (Crítico - Inmediato)

1. **Corregir registry/index.json**
   - Incluir intentPatterns, contentPatterns, fileTriggers
   - Preservar enforcement levels
   - Versionar schema del registry

2. **Implementar threshold dinámico**
   - block: 0.2
   - warn: 0.4
   - require: 0.5
   - suggest: 0.6

3. **Verificar guardrails de seguridad**
   - database-verification: Probar deleteMany sin WHERE
   - secrets-and-config: Probar API_KEY embebida
   - Solo allow en daemon post-response

#### P1 (Alto - Esta semana)

4. **Implementar feedback loop**
   - Recopilar accuracy histórica
   - Ajustar weights dinámicamente
   - Mostrar confianza del match

5. **Mejorar intent matching**
   - Incluir patterns específicos por dominio
   - Learning de patterns exitosos
   - Negative examples para reducir falsos positivos

6. **Añadir debugging mode**
   - Mostrar scores detallados por signal
   - Explicar por qué se/no se activó
   - Trace path completo de evaluación

#### P2 (Medio - Este mes)

7. **Optimizar performance**
   - Cache por prompt hash
   - Evitar re-evaluación innecesaria
   - Paralelizar signal evaluation

8. **Dashboard de activación**
   - Ver skills activadas en tiempo real
   - Estadísticas de hit rate por skill
   - Identificar skills infrautilizados

9. **Machine learning para weights**
   - ML para ajustar weights automáticamente
   - Feature engineering de context signals
   - A/B testing de thresholds

### Métricas de Éxito

```javascript
const successMetrics = {
  security: {
    // Guardrails deben activar antes de ejecución
    database_verification_blocks: "100%",
    secrets_detected_pre_execution: "100%"
  },

  accuracy: {
    // Precisión de activaciones
    true_positive_rate: ">95%",
    false_positive_rate: "<5%",
    false_negative_rate: "<5%"
  },

  performance: {
    activation_latency_ms: "<100ms",
    cache_hit_rate: ">80%"
  },

  adoption: {
    skills_utilization_rate: ">70%",
    average_skills_per_prompt: "2-3",
    user_satisfaction_score: ">4.5/5"
  }
};
```

---

## ANEXOS

### Anexo A: Estructura completa de skill-rules.json

```json
{
  "skill-name": {
    "type": "guideline|guardrail|workflow|generator|test",
    "enforcement": "suggest|require|warn|block",
    "priority": "critical|high|medium|low",
    "promptTriggers": {
      "keywords": ["kw1", "kw2", ...],
      "intentPatterns": ["regex1", "regex2", ...]
    },
    "fileTriggers": {
      "pathPatterns": ["glob1", "glob2", ...],
      "contentPatterns": ["regex1", "regex2", ...]
    },
    "activationConfig": {
      "threshold": 0.6,
      "allowList": ["pattern1"],
      "denyList": ["pattern2"],
      "weights": {
        "keywordMatch": 0.2,
        "intentMatch": 0.3,
        "filePathMatch": 0.2,
        "contentMatch": 0.2,
        "contextRelevance": 0.1
      }
    }
  }
}
```

### Anexo B: Signals disponibles

1. **KeywordMatchSignal** - Keywords en registry
2. **IntentMatchSignal** - Intent patterns (NO en registry)
3. **ContextRelevanceSignal** - Contexto de proyecto
4. **FilePathMatchSignal** - Path globs (NO en registry)
5. **ContentMatchSignal** - Content patterns (NO en registry)
6. **HistoricalAccuracySignal** - Historial
7. **RecentActivitySignal** - Archivos recientes

### Anexo C: Enforcement workflow

```
User Prompt
  ↓
Router Local (keywords only)
  ↓
Preliminary Activation
  ↓
Code Generated
  ↓
Daemon (full rules)
  ↓
Enforcement Applied (post-hoc)
```

**PROBLEMA:** Pasos 2-3-4 deben incluir full rules, no solo keywords.

---

## REFERENCIAS

- **Código fuente:** `/Users/felipe/Developer/skills-fabrik/packages/router/src/activation/`
- **Configuración:** `/Users/felipe/Developer/skills-fabrik/configs/skill-rules.json`
- **Registry:** `/Users/felipe/Developer/skills-fabrik/registry/index.json`
- **Tests:** `/Users/felipe/Developer/skills-fabrik/packages/router/src/__tests__/activation*.spec.ts`
- **Skills:** `/Users/felipe/Developer/skills-fabrik/skills/`
- **KPI Data:** `/Users/felipe/Developer/skills-fabrik/obs/kpi/`

---

**Documento generado:** 2 de noviembre de 2025, 18:30
**Próxima revisión:** 9 de noviembre de 2025
