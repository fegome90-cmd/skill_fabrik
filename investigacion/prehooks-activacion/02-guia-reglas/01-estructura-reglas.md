# Guía Práctica: Estructura de Reglas de Skills

## 📋 **Introducción**

Esta guía explica cómo crear, modificar y optimizar reglas de activación de skills de manera eficiente y efectiva.

---

## 🏗️ **Anatomía de una Regla**

### **Estructura Base**

```json
{
  "skill-name": {
    "type": "guideline|guardrail|workflow|generator",
    "enforcement": "block|require|warn|suggest",
    "priority": "critical|high|normal|low",
    "promptTriggers": {
      "keywords": [],
      "intentPatterns": []
    },
    "fileTriggers": {
      "pathPatterns": [],
      "contentPatterns": []
    }
  }
}
```

### **Campos Explicados**

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| **type** | string | Categoría de la skill | `"guideline"` |
| **enforcement** | string | Nivel de enforcement | `"block"` |
| **priority** | string | Importancia relativa | `"critical"` |
| **keywords** | array | Palabras clave | `["api", "rest"]` |
| **intentPatterns** | array | Patrones regex | `["(create|implement).*api"]` |
| **pathPatterns** | array | Globs de archivos | `["**/controllers/**/*"]` |
| **contentPatterns** | array | Patrones en código | `["deleteMany()"]` |

---

## 🎯 **Tipos de Enforcement**

### **1. BLOCK (Threshold: 0.2)**

**Uso**: Operaciones críticas que DEBEN ser bloqueadas
**Ejemplos**:
- Operaciones peligrosas de BD
- Credenciales hardcodeadas
- Comandos shell destructivos

```json
{
  "database-verification": {
    "type": "guardrail",
    "enforcement": "block",
    "priority": "critical",
    "promptTriggers": {
      "keywords": ["deleteMany", "updateMany", "DROP", "TRUNCATE"],
      "intentPatterns": [
        "(delete|drop|remove|truncate).*(table|database|all|*)",
        "(mass|bulk|multiple).*(delete|update)",
        "(query|operación).*(peligrosa|riesgosa|destructiva)"
      ]
    },
    "fileTriggers": {
      "pathPatterns": [
        "**/{repositories,repos,db,prisma,database}/**/*.{ts,js,sql}",
        "**/{migrations,schema}/**/*.{sql,prisma}"
      ],
      "contentPatterns": [
        "deleteMany\\([^)]*\\)(?!.*where)",
        "updateMany\\([^)]*\\)(?!.*where)",
        "DROP\\s+(TABLE|DATABASE)\\s+\\w+",
        "TRUNCATE\\s+TABLE\\s+\\w+"
      ]
    }
  }
}
```

**Resultado**:
```
🚫 ACTIVACIÓN FORZADA
Skill: database-verification (block)
Score: 0.95 (threshold: 0.2)

→ BLOQUEANDO operación peligrosa
→ Resources: 2 guías disponibles
→ Acción requerida: Revisar código
```

### **2. REQUIRE (Threshold: 0.4)**

**Uso**: Skills obligatorias para el tipo de tarea
**Ejemplos**:
- Testing obligatorio
- Security checks
- Performance validation

```json
{
  "visual-regression-testing": {
    "type": "guideline",
    "enforcement": "require",
    "priority": "high",
    "promptTriggers": {
      "keywords": ["ui", "component", "visual", "design", "render", "css", "styles"],
      "intentPatterns": [
        "(crear|implementar|desarrollar).*(componente|ui|interface)",
        "(modificar|cambiar|actualizar).*(visual|design|styles)",
        "(test|verificar).*(render|visual|display)"
      ]
    },
    "fileTriggers": {
      "pathPatterns": [
        "**/{components,views,pages,ui}/**/*.{ts,tsx,js,jsx,vue,svelte}",
        "**/{styles,css,scss,less}/**/*.{css,scss,less}",
        "**/{assets,images,icons}/**/*.{png,jpg,svg,ico}"
      ],
      "contentPatterns": [
        "(export|default).*(Component|FunctionalComponent)",
        "const\\s+\\w+\\s*=\\s*\\(\\)\\s*=>\\s*\\{",
        "@Component\\(",
        "function\\s+\\w+Component\\("
      ]
    }
  }
}
```

**Resultado**:
```
⚠️ REQUERIDO
Skill: visual-regression-testing (require)
Score: 0.87 (threshold: 0.4)

→ Skill OBLIGATORIA para esta tarea
→ Recursos: 3 disponibles
→ Acción: Seguir protocolo de testing
```

### **3. WARN (Threshold: 0.5)**

**Uso**: Advertencias y mejores prácticas
**Ejemplos**:
- Root cause analysis
- Error patterns
- Performance hints

```json
{
  "root-cause-tracing": {
    "type": "guideline",
    "enforcement": "warn",
    "priority": "high",
    "promptTriggers": {
      "keywords": ["error", "bug", "issue", "problem", "failure", "crash", "stack", "trace"],
      "intentPatterns": [
        "(error|bug|issue).*(solve|fix|debug|trace|root)",
        "(investigar|analizar).*(error|bug|failure)",
        "(why|por qué|cómo).*(failed|error|crash)"
      ]
    },
    "fileTriggers": {
      "pathPatterns": [
        "**/{logs,errors,debug}/**/*.{log,txt,json}",
        "**/{tests,spec,__tests__}/**/*.{test,spec}.{ts,js}"
      ],
      "contentPatterns": [
        "throw\\s+new\\s+Error",
        "catch\\s*\\(",
        "console\\.(error|warn|log)",
        "try\\s*\\{"
      ]
    }
  }
}
```

**Resultado**:
```
💡 ADVERTENCIA
Skill: root-cause-tracing (warn)
Score: 0.72 (threshold: 0.5)

→ Considera usar análisis de causa raíz
→ Mejores prácticas disponibles
→ No bloquea ejecución
```

### **4. SUGGEST (Threshold: 0.6)**

**Uso**: Sugerencias opcionales de mejores prácticas
**Ejemplos**:
- Architecture patterns
- Code guidelines
- Refactoring suggestions

```json
{
  "backend-architecture-patterns": {
    "type": "guideline",
    "enforcement": "suggest",
    "priority": "normal",
    "promptTriggers": {
      "keywords": ["arquitectura", "backend", "ddd", "cqrs", "hexagonal", "clean", "pattern"],
      "intentPatterns": [
        "(implementar|crear|design|arquitectura).*(ddd|domain|cqrs|hexagonal|clean)",
        "(estructurar|organizar|refactor).*(backend|servicio|domain)",
        "(aplicar|usar).*(pattern|patrón|architecture)"
      ]
    },
    "fileTriggers": {
      "pathPatterns": [
        "**/{domain,application,infrastructure,interfaces}/**/*.{ts,js}",
        "**/{core,adapters}/{ports,entities,use-cases}/**/*.{ts,js}"
      ],
      "contentPatterns": [
        "export\\s+(class|interface)\\s+\\w+(Aggregate|Entity|ValueObject|Repository)",
        "class\\s+\\w+(Aggregate|Service|Handler)",
        "interface\\s+\\w+(Repository|Service|Port)"
      ]
    }
  }
}
```

**Resultado**:
```
💡 SUGERENCIA
Skill: backend-architecture-patterns (suggest)
Score: 0.68 (threshold: 0.6)

→ Patrones de arquitectura disponibles
→ Opcional pero recomendado
→ 4 recursos on-demand
```

---

## 📝 **Keywords: Mejores Prácticas**

### **Cantidad Óptima**
- **Mínimo**: 3 keywords
- **Óptimo**: 5-10 keywords
- **Máximo**: 15 keywords

**Ejemplo bien balanceado**:
```json
"keywords": [
  "api",           // Palabra principal
  "rest",          // Tecnología específica
  "auth",          // Funcionalidad
  "backend",       // Contexto
  "controller"     // Componente
]
```

### **Especificidad**

#### ❌ **Muy genérico** (evitar)
```json
"keywords": ["dev", "code", "app", "software"]
```
**Problema**: Coincide con TODO

#### ✅ **Específico** (recomendado)
```json
"keywords": ["api-rest", "jwt-auth", "prisma-orm", "express-controller"]
```
**Beneficio**: Activación precisa

#### ✅ **Long-tail keywords** (ideal)
```json
"keywords": ["graphQL-resolver", "prisma-migration", "typeORM-entity"]
```
**Beneficio**: Máxima precisión

### **Variaciones Semánticas**

```json
"keywords": [
  // Sinónimos
  "api", "rest", "endpoint",
  // Acrónimos
  "crud", "restful",
  // Technology-specific
  "openapi", "swagger"
]
```

---

## 🎯 **Intent Patterns: Guía Completa**

### **Estructura Regex**

#### **Patrón Básico**: `(word1|word2|word3)` + `.*(target)`
```json
{
  "intentPatterns": [
    "(implementar|crear|diseñar).*(api|rest|endpoint)",
    "(configurar|setup|initialize).*(database|db|prisma)"
  ]
}
```

#### **Patrón Avanzado**: Con cuantificadores y grupos
```json
{
  "intentPatterns": [
    "(crear|implementar|desarrollar).*(nuevo|nueva|fresh).*(api|service|endpoint)",
    "(optimizar|mejorar|refactorizar).*(performance|latencia|velocidad).*(de|del|database)"
  ]
}
```

### **Patrones Comunes**

#### **1. Creación**
```regex
(implementar|crear|desarrollar|diseñar|construir).*(api|service|component|endpoint)
```

**Prompt que activa**:
- "Implementar API de usuarios"
- "Crear nuevo componente React"
- "Desarrollar servicio de autenticación"

#### **2. Modificación**
```regex
(modificar|cambiar|actualizar|refactorizar|mejorar).*(api|component|ui|backend)
```

**Prompt que activa**:
- "Actualizar endpoint de login"
- "Refactorizar componente UserList"
- "Mejorar performance de API"

#### **3. Debugging**
```regex
(debug|arreglar|fix|resolver|solucionar).*(error|bug|issue|problema)
```

**Prompt que activa**:
- "Debug error en autenticación"
- "Arreglar bug en API"
- "Solucionar problema de rendimiento"

#### **4. Testing**
```regex
(test|testing|verificar|validar|probar).*(api|component|function|service)
```

**Prompt que activa**:
- "Test API de usuarios"
- "Verificar componente Button"
- "Validar función de login"

### **Negative Patterns** (Evitar falsos positivos)

```regex
# Negar prompts muy genéricos
(?!.*(simple|básico|genérico))
(?!.*solo|únicamente|meramente)
```

---

## 📂 **Path Patterns: Estructura de Proyecto**

### **Globs Comunes**

#### **Frontend**
```json
{
  "pathPatterns": [
    "**/{components,views,pages,screens}/**/*.{ts,tsx,js,jsx,vue,svelte}",
    "**/{hooks,utils,helpers}/**/*.{ts,js}",
    "**/{styles,css,scss,less}/**/*.{css,scss,less}",
    "**/{assets,images,icons}/**/*.{png,jpg,svg,ico}"
  ]
}
```

#### **Backend**
```json
{
  "pathPatterns": [
    "**/{controllers,services,repositories,models}/**/*.{ts,js}",
    "**/{routes,endpoints,api}/**/*.{ts,js}",
    "**/{middlewares,filters,interceptors}/**/*.{ts,js}",
    "**/{config,settings}/**/*.{ts,js,json}"
  ]
}
```

#### **Database**
```json
{
  "pathPatterns": [
    "**/{repositories,repos,db,database}/**/*.{ts,js,sql}",
    "**/{migrations,schema}/**/*.{sql,prisma}",
    "**/{entities,models}/**/*.{ts,js}"
  ]
}
```

#### **Tests**
```json
{
  "pathPatterns": [
    "**/{test,tests,__tests__,spec,specs}/**/*.{test,spec}.{ts,js}",
    "**/test/**/*.{ts,js}",
    "**/*.test.{ts,js}",
    "**/*.spec.{ts,js}"
  ]
}
```

### **Arquitecturas Específicas**

#### **Hexagonal/Onion**
```json
{
  "pathPatterns": [
    "**/{domain,application,infrastructure,interfaces}/**/*.{ts,js}",
    "**/{core,adapters}/{ports,entities,use-cases}/**/*.{ts,js}"
  ]
}
```

**Estructura**:
```
src/
├── domain/           # Entidades, value objects
├── application/      # Use cases, DTOs
├── infrastructure/   # Implementaciones externas
└── interfaces/       # Controladores, gateways
```

#### **DDD (Domain-Driven Design)**
```json
{
  "pathPatterns": [
    "**/{domain,aggregates,entities,value-objects}/**/*.{ts,js}",
    "**/{application,services,handlers}/**/*.{ts,js}",
    "**/{infrastructure,repositories,persistence}/**/*.{ts,js}"
  ]
}
```

**Estructura**:
```
src/
├── domain/
│   ├── aggregates/
│   ├── entities/
│   ├── value-objects/
│   └── repositories/
├── application/
│   ├── services/
│   ├── handlers/
│   └── dto/
└── infrastructure/
    ├── repositories/
    └── persistence/
```

---

## 📄 **Content Patterns: Código y Configuración**

### **Operaciones de Base de Datos**

#### **Peligrosas (BLOCK)**
```json
{
  "contentPatterns": [
    "deleteMany\\([^)]*\\)(?!.*where)",
    "updateMany\\([^)]*\\)(?!.*where)",
    "DROP\\s+(TABLE|DATABASE)\\s+\\w+",
    "TRUNCATE\\s+TABLE\\s+\\w+",
    "ALTER\\s+TABLE\\s+\\w+\\s+DROP\\s+COLUMN"
  ]
}
```

**Detecta**:
```sql
❌ DELETE FROM users;                    -- Sin WHERE
❌ DROP TABLE old_users;                 -- Destrucción
✅ DELETE FROM users WHERE id = 123;     -- Con WHERE
```

#### **Consultas Sin Optimización (WARN)**
```json
{
  "contentPatterns": [
    "findMany\\(\\)(?!.*where|.*filter|.*take|.*limit)",
    "SELECT\\s+\\*\\s+FROM\\s+\\w+(?!\\s+WHERE)",
    "get\\(\\)(?!.*id|.*filter)"
  ]
}
```

**Detecta**:
```typescript
❌ await prisma.user.findMany();                   // Sin filtros
❌ const users = db.query("SELECT * FROM users");  // SELECT *
✅ await prisma.user.findMany({ take: 10 });       // Con límite
```

### **Seguridad**

#### **Credenciales Hardcodeadas (BLOCK)**
```json
{
  "contentPatterns": [
    "(api[_-]?key|secret|password|token)\\s*[:=]\\s*[\"'][^\"']{20,}[\"']",
    "const\\s+(API_KEY|SECRET|TOKEN)\\s*=\\s*[\"'][^\"']+[\"']",
    "sk-[a-zA-Z0-9]{48}",                    // OpenAI
    "ghp_[a-zA-Z0-9]{36}",                   // GitHub
    "xox[baprs]-[a-zA-Z0-9-]{10,48}"         // Slack
  ]
}
```

**Detecta**:
```typescript
❌ const API_KEY = "sk-1234567890abcdef...";     // Hardcodeado
❌ const password = "mi-secreto-123";            // Sin env var
✅ const API_KEY = process.env.API_KEY;          // Correcto
```

### **Componentes Frontend**

#### **Hooks y Estado (WARN)**
```json
{
  "contentPatterns": [
    "useState\\(",
    "useEffect\\(",
    "useContext\\(",
    "useReducer\\(",
    "createContext\\("
  ]
}
```

**Detecta**:
```typescript
const [users, setUsers] = useState([]);
useEffect(() => { fetchUsers(); }, []);
```

#### **Performance Red Flags (WARN)**
```json
{
  "contentPatterns": [
    "\\.map\\(\\s*\\(\\w+\\)\\s*=>\\s*\\{[^}]*\\}\\s*\\)",  // Inline map
    "console\\.(log|error|warn)",                         // Console.log en producción
    "setTimeout\\(",                                      // Posible memory leak
    "innerHTML\\s*="                                      // XSS risk
  ]
}
```

---

## ⚙️ **Configuración Avanzada**

### **Multiple Enforcement Levels**

Una skill puede tener diferentes enforcement para diferentes contextos:

```json
{
  "database-verification": {
    "type": "guardrail",
    "enforcement": "block",
    "priority": "critical",
    "contextualEnforcement": {
      "production": "block",
      "development": "warn",
      "testing": "suggest"
    }
  }
}
```

### **Dynamic Thresholds**

```json
{
  "backend-dev-guidelines": {
    "type": "guideline",
    "enforcement": "suggest",
    "priority": "normal",
    "dynamicThreshold": {
      "junior": 0.5,    // Más sensible para juniors
      "senior": 0.7,    // Menos sensible para seniors
      "auto": true      // Auto-detectar nivel
    }
  }
}
```

### **Conditional Rules**

```json
{
  "api-design-and-testing": {
    "type": "guideline",
    "enforcement": "require",
    "conditions": {
      "requireIf": {
        "hasOpenAPISpec": true,
        "projectType": ["api", "service", "microservice"]
      },
      "skipIf": {
        "isLibrary": true,
        "isCLI": true
      }
    }
  }
}
```

---

## 🧪 **Testing de Reglas**

### **Test Manual**

```bash
# Test de keyword matching
skills-cli skills check "crear API REST con autenticación" --v2 --debug

# Test de path matching
skills-cli skills check "refactorizar componente" --open-files "frontend/src/components/Button.tsx"

# Test de content matching
skills-cli skills check "validar deleteMany" --active-file "src/repo/user.ts" --content "deleteMany()"
```

### **Test Automatizado**

```bash
# Test suite completo
pnpm test:rules-validation

# Test casos específicos
pnpm test:keyword-matching
pnpm test:intent-patterns
pnpm test:path-patterns
pnpm test:content-patterns
```

### **Métricas de Calidad**

```typescript
interface RuleMetrics {
  activationRate: number;      // % de veces que se activa
  falsePositiveRate: number;   // % activaciones incorrectas
  falseNegativeRate: number;   // % misses (no se activó cuando debía)
  precision: number;           // TP / (TP + FP)
  recall: number;              // TP / (TP + FN)
  f1Score: number;             // 2 * precision * recall / (precision + recall)
}
```

**Targets**:
- **Precision**: ≥ 0.90
- **Recall**: ≥ 0.85
- **F1 Score**: ≥ 0.87

---

## 📊 **Optimización de Reglas**

### **1. Análisis de Datos**

```bash
# Generar reporte de activación
node scripts/optimize-rules.js --generate-report

# Analizar falsos positivos
node scripts/optimize-rules.js --analyze-false-positives

# Identificar misses
node scripts/optimize-rules.js --analyze-misses
```

### **2. Ajustes Basados en Evidencia**

#### **Si False Positives > 5%**
- ✅ Ser más específico en keywords
- ✅ Añadir negative patterns
- ✅ Aumentar threshold

#### **Si False Negatives > 5%**
- ✅ Añadir synonyms
- ✅ Añadir variations
- ✅ Reducir threshold

#### **Si Activation Rate < 70%**
- ✅ Revisar relevancy de keywords
- ✅ Añadir more patterns
- ✅ Simplificar patterns

### **3. Ciclo de Mejora Continua**

```
Semana 1: Deploy initial rules
    ↓
Semana 2: Collect data
    ↓
Semana 3: Analyze performance
    ↓
Semana 4: Optimize rules
    ↓
Semana 5: Deploy improvements
    ↓
(Siguiente ciclo...)
```

---

## ✅ **Checklist de Validación**

### **Antes de Commit**

- [ ] **Keywords**: 5-10 específicos (no genéricos)
- [ ] **Intent Patterns**: Regex válidos y probados
- [ ] **Path Patterns**: Globs probados con minimatch
- [ ] **Content Patterns**: Regex compilando sin errores
- [ ] **Enforcement**: Nivel apropiado para el riesgo
- [ ] **Priority**: Alineado con criticidad
- [ ] **Testing**: Probado con casos reales
- [ ] **Documentation**: SKILL.md actualizado

### **Antes de Deploy**

- [ ] **Unit tests** pasando (≥ 95%)
- [ ] **Integration tests** pasando
- [ ] **Performance** dentro de targets (< 200ms)
- [ ] **Coverage**: ≥ 80%
- [ ] **Review** por senior developer
- [ ] **Approval** por tech lead

### **Después de Deploy**

- [ ] **Monitoreo** activado
- [ ] **Alertas** configuradas
- [ ] **Dashboard** actualizado
- [ ] **Team** notificado
- [ ] **Feedback loop** establecido

---

## 🔗 **Recursos Adicionales**

### **Herramientas**
- **Regex Tester**: https://regex101.com/
- **Glob Tester**: https://www.glob.tech/
- **Pattern Analyzer**: `skills-cli skills analyze`

### **Documentación**
- **Skill Template**: `configs/SKILL.template.md`
- **JSON Schema**: `schemas/skill-rules.schema.json`
- **Examples**: `skills/guidelines/backend-dev-guidelines/`

### **Comandos Útiles**
```bash
# Validar reglas
skills-cli skills validate rules

# Test de matching
skills-cli skills test-matching --rule database-verification

# Optimizar reglas existentes
skills-cli skills optimize

# Reporte de performance
skills-cli skills report --metrics
```

---

**Creado**: 2024-11-02
**Versión**: 1.0
**Owner**: Engineering Team
