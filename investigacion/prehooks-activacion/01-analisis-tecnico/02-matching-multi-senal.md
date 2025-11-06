# Matching Multi-Señal - Algoritmo Detallado

## 🎯 **Visión General**

El sistema de matching utiliza **4 señales independientes** que se combinan con pesos específicos para calcular el score final de activación de una skill. Cada señal aporta información contextual única.

---

## 📊 **Matriz de Señales**

| Señal | Peso | Propósito | Ejemplo |
|-------|------|-----------|---------|
| **Keywords** | 20% | Detección semántica directa | "backend", "api", "auth" |
| **Intent** | 30% | Patrones de intención complejos | Regex de acciones + objetos |
| **Path** | 30% | Contexto de archivos abiertos | Glob patterns de estructura |
| **Content** | 20% | Patrones en código activo | `deleteMany()` sin WHERE |

**Total**: 100% - Score final ponderado

---

## 🔑 **Señal 1: Keyword Matching (20%)**

### **Propósito**
Detección semántica directa basada en palabras clave específicas de cada skill.

### **Implementación**

```typescript
// packages/router/src/detectors.ts
export function matchKeywords(rule: SkillRule, prompt: string): KeywordMatch {
  if (!rule.promptTriggers?.keywords) {
    return { score: 0, matches: [], details: null };
  }

  const keywords = rule.promptTriggers.keywords;
  const promptLower = prompt.toLowerCase();

  // Contar matches exactos (case-insensitive)
  const matches = keywords.filter(kw => {
    const keyword = kw.toLowerCase().trim();
    return promptLower.includes(keyword);
  });

  // Score proporcional al % de keywords matching
  const coverage = matches.length / keywords.length;
  const score = coverage * 0.2; // 20% del total

  return {
    score,
    matches,
    details: {
      totalKeywords: keywords.length,
      matchedKeywords: matches.length,
      coverage: `${(coverage * 100).toFixed(1)}%`,
      unmatchedKeywords: keywords.filter(kw => !matches.includes(kw))
    }
  };
}
```

### **Ejemplo Práctico**

**Prompt**: `"crear API REST con autenticación JWT"`

**Skill Rule**:
```json
{
  "backend-dev-guidelines": {
    "promptTriggers": {
      "keywords": ["api", "rest", "backend", "servidor", "controller", "service"]
    }
  }
}
```

**Matching**:
```
Keywords: ["api", "rest", "backend", "servidor", "controller", "service"]
Matches: ["api", "rest", "backend"] → 3/6 = 0.5
Score: 0.5 * 0.2 = 0.10 (10%)
```

### **Optimización**

```typescript
// Cache de keywords lowercase para evitar toLowerCase repetitivo
const keywordCache = new Map<string, string>();

function normalizeKeyword(keyword: string): string {
  if (!keywordCache.has(keyword)) {
    keywordCache.set(keyword, keyword.toLowerCase().trim());
  }
  return keywordCache.get(keyword)!;
}
```

---

## 🎯 **Señal 2: Intent Pattern Matching (30%)**

### **Propósito**
Detectar intenciones complejas usando patrones regex que capturan acciones y objetos.

### **Implementación**

```typescript
// packages/router/src/detectors.ts
export function matchIntentPatterns(rule: SkillRule, prompt: string): IntentMatch {
  if (!rule.promptTriggers?.intentPatterns) {
    return { score: 0, matches: [], details: null };
  }

  const patterns = rule.promptTriggers.intentPatterns;
  const matches: string[] = [];
  let totalScore = 0;

  // Evaluación de patrones con early termination
  for (const pattern of patterns) {
    try {
      const regex = new RegExp(pattern, 'i');

      if (regex.test(prompt)) {
        matches.push(pattern);

        // Patrones con más grupos tienen mayor peso
        const groupCount = (pattern.match(/\(([^)]+)\)/g) || []).length;
        const patternWeight = Math.min(0.3, 0.15 + (groupCount * 0.05));

        totalScore += patternWeight;

        // Early termination si ya alcanzó el máximo
        if (totalScore >= 0.3) break;
      }
    } catch (error) {
      console.warn(`Invalid regex pattern: ${pattern}`, error);
    }
  }

  return {
    score: Math.min(totalScore, 0.3), // Máximo 30%
    matches,
    details: {
      totalPatterns: patterns.length,
      matchedPatterns: matches.length,
      patterns: matches.map(p => ({
        pattern: p,
        groups: (p.match(/\(([^)]+)\)/g) || []).length
      }))
    }
  };
}
```

### **Patrones Comunes**

#### **Patrón: Acción + Objeto**
```regex
(implementar|crear|diseñar|construir).*(api|rest|backend|auth|login)
```

**Ejemplo**: "implementar API de autenticación"
- ✅ Coincide con "implementar" + "api"
- Score: 0.3

#### **Patrón: Detección de Riesgos**
```regex
(delete|drop|remove|update).*(many|all|batch|bulk).*(without|sin|no).*(where|filtro)
```

**Ejemplo**: "deleteMany sin where clause"
- ✅ Detecta operación riesgosa
- Score: 0.3

#### **Patrón: Pregunta Contexto**
```regex
(qué|cómo|why|how).*(estructura|arquitectura|patrón|pattern).*(usar|use|mejor|best)
```

**Ejemplo**: "cómo estructurar el backend"
- ✅ Detecta consulta de best practices
- Score: 0.3

### **Ejemplo Completo**

**Prompt**: `"refactorizar controladores para seguir clean architecture"`

**Skill Rule**:
```json
{
  "backend-architecture-patterns": {
    "promptTriggers": {
      "intentPatterns": [
        "(refactor|restructurar|organizar).*(controller|service|repository)",
        "(aplicar|implementar).*(clean|ddd|hexagonal).*architecture",
        "(estructura|organizar).*(backend|servicio|domain)"
      ]
    }
  }
}
```

**Matching**:
```
Patterns:
1. "(refactor|restructurar|organizar).*(controller|service|repository)"
   → COINCIDE: "refactorizar" + "controladores"
   → Score: 0.3

2. "(aplicar|implementar).*(clean|ddd|hexagonal).*architecture"
   → NO COINCIDE

3. "(estructura|organizar).*(backend|servicio|domain)"
   → COINCIDE: "estructurar" (sinónimo de "organizar")
   → Score: 0.3

TOTAL: 0.6 (capped a 0.3)
```

---

## 📂 **Señal 3: Path Matching (30%)**

### **Propósito**
Evaluar si los archivos abiertos en el editor coinciden con la estructura esperada por la skill.

### **Implementación**

```typescript
// packages/router/src/detectors.ts
import { minimatch } from 'minimatch';

export function matchPathPatterns(rule: SkillRule, openFiles: string[]): PathMatch {
  if (!rule.fileTriggers?.pathPatterns || !openFiles?.length) {
    return { score: 0, matches: [], details: null };
  }

  const pathPatterns = rule.fileTriggers.pathPatterns;
  const matchedPatterns: string[] = [];
  const matchedFiles: string[] = [];

  // Evaluar cada archivo contra todos los patrones
  for (const file of openFiles) {
    for (const pattern of pathPatterns) {
      if (minimatch(file, pattern, { nocase: true, dot: true })) {
        matchedPatterns.push(pattern);
        matchedFiles.push(file);

        // Break inner loop para evitar duplicates del mismo archivo
        break;
      }
    }
  }

  // Eliminar duplicates
  const uniquePatterns = [...new Set(matchedPatterns)];
  const coverage = uniquePatterns.length / pathPatterns.length;
  const score = coverage * 0.3; // 30% del total

  return {
    score,
    matches: uniquePatterns,
    details: {
      totalPatterns: pathPatterns.length,
      matchedPatterns: uniquePatterns.length,
      coverage: `${(coverage * 100).toFixed(1)}%`,
      matchedFiles: [...new Set(matchedFiles)],
      unmatchedPatterns: pathPatterns.filter(p => !uniquePatterns.includes(p))
    }
  };
}
```

### **Tipos de Patrones**

#### **1. Estructura de Capas (DDD/Hexagonal)**
```glob
**/{domain,application,infrastructure,interfaces}/**/*.{ts,js}
```

**Archivos que coinciden**:
- ✅ `src/domain/entities/User.ts`
- ✅ `src/application/use-cases/CreateUser.ts`
- ✅ `src/infrastructure/repositories/PrismaUserRepo.ts`

#### **2. Componentes Frontend**
```glob
**/{components,views,pages,screens}/**/*.{ts,tsx,js,jsx,vue,svelte}
```

**Archivos que coinciden**:
- ✅ `frontend/src/components/UserList.tsx`
- ✅ `src/pages/Dashboard.vue`
- ✅ `components/Button.svelte`

#### **3. Tests**
```glob
**/{test,tests,__tests__,spec,specs}/**/*.{test,spec}.{ts,js}
```

**Archivos que coinciden**:
- ✅ `tests/unit/user.service.test.ts`
- ✅ `__tests__/api.test.js`
- ✅ `src/components/Button.spec.tsx`

#### **4. Database/Migrations**
```glob
**/{migrations,schema,prisma,database,db}/**/*.{sql,prisma}
```

**Archivos que coinciden**:
- ✅ `prisma/schema.prisma`
- ✅ `migrations/20241102_create_users.sql`
- ✅ `database/schema.sql`

### **Ejemplo Completo**

**Open Files**:
```
[
  "frontend/src/components/UserList.tsx",
  "frontend/src/pages/Dashboard.tsx",
  "frontend/src/hooks/useAuth.ts",
  "frontend/src/utils/api.ts"
]
```

**Skill Rule**:
```json
{
  "frontend-dev-guidelines": {
    "fileTriggers": {
      "pathPatterns": [
        "**/{components,views,pages}/**/*.{ts,tsx,js,jsx}",
        "**/{hooks,utils}/**/*.{ts,js}",
        "**/src/**/*.{css,scss,less}"
      ]
    }
  }
}
```

**Matching**:
```
Patterns:
1. "**/{components,views,pages}/**/*.{ts,tsx,js,jsx}"
   → Matches: UserList.tsx, Dashboard.tsx
   → Coverage: 1/3 patterns

2. "**/{hooks,utils}/**/*.{ts,js}"
   → Matches: useAuth.ts, api.ts
   → Coverage: 2/3 patterns

3. "**/src/**/*.{css,scss,less}"
   → NO MATCH (no CSS files open)

Total unique patterns: 2/3 = 0.667
Score: 0.667 * 0.3 = 0.20 (20%)
```

---

## 📄 **Señal 4: Content Matching (20%)**

### **Propósito**
Detectar patrones específicos en el contenido del archivo activo (código, configuración, etc.).

### **Implementación**

```typescript
// packages/router/src/detectors.ts
export function matchContentPatterns(rule: SkillRule, activeFileContent?: string): ContentMatch {
  if (!rule.fileTriggers?.contentPatterns || !activeFileContent) {
    return { score: 0, matches: [], details: null };
  }

  const patterns = rule.fileTriggers.contentPatterns;
  const matches: ContentMatchDetail[] = [];

  for (const pattern of patterns) {
    try {
      const regex = new RegExp(pattern, 'm'); // Multiline flag

      const matches_ = activeFileContent.match(regex);
      if (matches_) {
        matches.push({
          pattern,
          count: matches_.length,
          examples: matches_.slice(0, 3), // Primeras 3 coincidencias
          severity: getPatternSeverity(pattern)
        });
      }
    } catch (error) {
      console.warn(`Invalid content pattern: ${pattern}`, error);
    }
  }

  const coverage = matches.length / patterns.length;
  const score = coverage * 0.2; // 20% del total

  return {
    score,
    matches: matches.map(m => m.pattern),
    details: {
      totalPatterns: patterns.length,
      matchedPatterns: matches.length,
      coverage: `${(coverage * 100).toFixed(1)}%`,
      patterns: matches
    }
  };
}
```

### **Patrones de Código Comunes**

#### **1. Operaciones de Base de Datos Peligrosas**
```regex
(deleteMany|updateMany)\([^)]*\)(?!\s*.\s*where)
```

**Detecta**: `deleteMany()` sin cláusula WHERE
```typescript
// ❌ PELIGROSO
await prisma.user.deleteMany();

// ✅ SEGURO
await prisma.user.deleteMany({ where: { id: userId } });
```

#### **2. API Keys/Secrets en Código**
```regex
(api[_-]?key|secret|password|token)\s*[:=]\s*["']([^"']{20,})["']
```

**Detecta**: Credenciales hardcodeadas
```typescript
// ❌ PELIGROSO
const API_KEY = "sk-1234567890abcdef...";

// ✅ SEGURO
const API_KEY = process.env.API_KEY;
```

#### **3. Funciones Sin Tests**
```regex
(export\s+)?(class|function|const\s+\w+\s*=)\s+\w+
```

**Detecta**: Código sin cobertura de tests
```typescript
// ❌ SIN TEST
export class UserService {
  async createUser(data: UserData) { ... }
}
```

#### **4. Imports Innecesarios**
```regex
import\s+.*\s+from\s+["'][^"']+["'];\s*\n(?!\nimport)
```

**Detecta**: Unused imports
```typescript
// ❌ INNECESARIO
import { unusedFunction } from './utils';
```

### **Severidad de Patrones**

```typescript
function getPatternSeverity(pattern: string): 'critical' | 'warning' | 'info' {
  if (pattern.includes('deleteMany') || pattern.includes('DROP')) {
    return 'critical';
  }
  if (pattern.includes('api') || pattern.includes('secret')) {
    return 'warning';
  }
  return 'info';
}
```

### **Ejemplo Completo**

**Active File Content**:
```typescript
export class UserRepository {
  async deleteMany() {
    // ⚠️ OPERACIÓN PELIGROSA
    return prisma.user.deleteMany(); // Sin WHERE!
  }

  async updateMany(data: Partial<User>) {
    return prisma.user.updateMany(data); // Sin WHERE!
  }

  async findMany() {
    return prisma.user.findMany(); // Sin límite ni filtros
  }
}
```

**Skill Rule**:
```json
{
  "database-verification": {
    "fileTriggers": {
      "contentPatterns": [
        "deleteMany\\([^)]*\\)(?!.*where)",
        "updateMany\\([^)]*\\)(?!.*where)",
        "findMany\\(\\)(?!.*where|.*limit)"
      ]
    }
  }
}
```

**Matching**:
```
Patterns:
1. "deleteMany\\([^)]*\\)(?!.*where)"
   → MATCH: Línea 5 (sin WHERE)
   → Count: 1

2. "updateMany\\([^)]*\\)(?!.*where)"
   → MATCH: Línea 9 (sin WHERE)
   → Count: 1

3. "findMany\\(\\)(?!.*where|.*limit)"
   → MATCH: Línea 13 (sin límites)
   → Count: 1

Coverage: 3/3 patterns = 1.0
Score: 1.0 * 0.2 = 0.20 (20%)
```

---

## 🔄 **Combinación de Señales**

### **Algoritmo de Combinación**

```typescript
// packages/router/src/detectors.ts
export function calculateCombinedScore(
  keywordScore: number,
  intentScore: number,
  pathScore: number,
  contentScore: number
): number {
  // Suma ponderada de todas las señales
  const combined = keywordScore + intentScore + pathScore + contentScore;

  // Clamp a rango 0-1
  return Math.max(0, Math.min(1, combined));
}
```

### **Ejemplo Completo**

**Prompt**: `"refactorizar deleteMany sin where en UserRepository"`

**Open Files**: `["src/repositories/UserRepository.ts"]`

**Active File**: `src/repositories/UserRepository.ts`
```typescript
await prisma.user.deleteMany();
```

**Skill**: `database-verification`

**Scores**:
```
Keywords: "delete", "without", "where" → 0.15
Intent: patrón "delete.*without.*where" → 0.30
Path: archivo en repositories/ → 0.30
Content: deleteMany() sin WHERE → 0.20

TOTAL: 0.95
```

**Threshold**: 0.2 (block enforcement)

**Result**: ✅ **ACTIVADO** (0.95 > 0.2)

---

## 🎛️ **Threshold Dinámico**

### **Tabla de Thresholds**

| Enforcement | Threshold | Descripción | Ejemplo |
|-------------|-----------|-------------|---------|
| **block** | 0.2 | Ultra sensible - previene riesgos críticos | database-verification |
| **require** | 0.4 | Muy sensible - obligatorio | security-testing-guide |
| **warn** | 0.5 | Sensibilidad media - advertencias | root-cause-tracing |
| **suggest** | 0.6 | Estándar - sugerencias | backend-architecture-patterns |

### **Ajuste Dinámico**

```typescript
function adjustThreshold(baseThreshold: number, context: ActivationContext): number {
  let adjusted = baseThreshold;

  // Ajustar por número de archivos abiertos
  if (context.openFiles.length > 10) {
    adjusted *= 1.1; // Más archivos = mayor confianza
  }

  // Ajustar por longitud del prompt
  if (context.prompt.length > 200) {
    adjusted *= 0.95; // Prompts largos = más contexto
  }

  // Ajustar por project type
  if (context.projectType === 'library' || context.projectType === 'framework') {
    adjusted *= 0.9; // Proyectos complejos = mayor sensibilidad
  }

  // Clamp final
  return Math.max(0.1, Math.min(adjusted, 0.9));
}
```

---

## 📊 **Optimización de Performance**

### **Caching**

```typescript
// Cache por prompt + open files hash
const activationCache = new Map<string, ActivationResult>();

function getCacheKey(prompt: string, openFiles: string[]): string {
  const promptHash = hashString(prompt);
  const filesHash = hashString(openFiles.sort().join('|'));
  return `${promptHash}:${filesHash}`;
}
```

### **Parallel Evaluation**

```typescript
// Evaluar todas las señales en paralelo
const [keywordResult, intentResult, pathResult, contentResult] = await Promise.all([
  matchKeywords(rule, prompt),
  matchIntentPatterns(rule, prompt),
  matchPathPatterns(rule, openFiles),
  matchContentPatterns(rule, activeContent)
]);
```

### **Early Termination**

```typescript
// Si ya alcanzó threshold con algunas señales, skip otras
const threshold = getThreshold(rule.enforcement);
if (keywordScore + intentScore >= threshold) {
  return calculateCombinedScore(keywordScore, intentScore, 0, 0);
}
```

---

## 📈 **Métricas y Monitoreo**

### **KPIs de Matching**

```typescript
interface MatchingMetrics {
  totalActivations: number;
  successfulActivations: number;
  falsePositives: number;
  falseNegatives: number;
  averageScore: number;
  scoreDistribution: {
    keyword: number;
    intent: number;
    path: number;
    content: number;
  };
  thresholdAdjustments: number;
}
```

### **Logging**

```typescript
console.log(`[ACTIVATION] ${skillName}: ${finalScore.toFixed(2)} (threshold: ${threshold})`, {
  keyword: keywordScore.toFixed(2),
  intent: intentScore.toFixed(2),
  path: pathScore.toFixed(2),
  content: contentScore.toFixed(2),
  matchedPatterns: matches.length,
  enforcement: rule.enforcement
});
```

---

## 🔍 **Conclusiones**

### **Ventajas del Sistema Multi-Señal**

1. **Precisión**: 4 señales independientes reducen falsos positivos
2. **Flexibilidad**: Cada skill puede personalizar sus patrones
3. **Contexto**: Considera no solo texto sino también archivos y código
4. **Performance**: Paralelización y caching mantienen latencia baja

### **Mejores Prácticas**

1. **Keywords**: Usar 5-10 palabras clave específicas, no genéricas
2. **Intent**: Patrones regex con grupos para mayor precisión
3. **Path**: Glob patterns que representen estructura real del proyecto
4. **Content**: Patrones críticos con negative lookahead

### **Casos de Uso Críticos**

- **Database Safety**: Content matching para prevenir operaciones peligrosas
- **Architecture Guidance**: Path matching para sugerir patrones de arquitectura
- **Security**: Content + keyword matching para detectar secrets
- **Testing**: Path + content matching para sugerir tests
- **Refactoring**: Intent + content matching para detectar code smells

---

## 📚 **Referencias**

- **Algoritmo Principal**: `packages/router/src/detectors.ts`
- **Tipos de Señales**: `packages/router/src/types.ts`
- **Patrones de Ejemplo**: `configs/skill-rules.json`
- **Activación Engine**: `packages/router/src/activation/ActivationEngine.ts`
- **Cache Implementation**: `packages/router/src/cache.ts`
