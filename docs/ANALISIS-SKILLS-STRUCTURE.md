# Análisis Completo: Estructura de Skills en skills-fabrik

**Fecha**: 2025-10-29  
**Objetivo**: Documentar la estructura completa de creación, validación y activación de skills en el repositorio skills-fabrik  
**Autor**: Análisis sistemático del repositorio

---

## 1. Visión General del Sistema de Skills

### 1.1 Propósito

El sistema de skills en skills-fabrik implementa un framework de **divulgación progresiva** (progressive disclosure) para inyectar contexto relevante en el flujo de desarrollo, activando automáticamente guías, validaciones y workflows según el contexto del código y las intenciones del usuario.

### 1.2 Principios de Diseño

1. **Divulgación Progresiva**: 
   - Metadatos ligeros cargados inicialmente
   - SKILL.md completo cargado cuando hay match fuerte
   - Recursos detallados cargados solo cuando se referencian explícitamente

2. **Activación Contextual**:
   - Triggers basados en keywords, intención, rutas de archivos y contenido
   - Sistema de scoring para determinar relevancia
   - Umbral configurable (default: 0.6)

3. **Tipos Especializados**:
   - Cada skill tiene un tipo específico que determina su comportamiento
   - Enforcement levels diferentes según el tipo
   - Integración con hooks del sistema

---

## 2. Estructura de Directorios

### 2.1 Organización por Categorías

```
skills/
├── analysts/           # Skills que analizan código/repositorio
├── generators/         # Skills que generan código/documentación
│   └── plan-architect/
│       ├── SKILL.md
│       └── resources/
│           ├── cloop-methodology.md
│           ├── plan-templates.md
│           └── risk-identification.md
├── guardrails/         # Skills que bloquean/requieren acciones
│   ├── database-verification/
│   │   ├── SKILL.md
│   │   └── resources/
│   │       ├── migration-checklist.md
│   │       └── patterns.md
│   └── secrets-and-config/
│       ├── SKILL.md
│       └── resources/
│           └── env.example.txt
├── guidelines/         # Skills que sugieren mejores prácticas
│   ├── backend-dev-guidelines/
│   │   ├── SKILL.md
│   │   └── resources/
│   │       ├── controllers.md
│   │       ├── error-handling.md
│   │       ├── repositories.md
│   │       ├── services.md
│   │       └── testing.md
│   ├── frontend-dev-guidelines/
│   │   └── ...
│   └── project-catalog-developer/
│       └── ...
└── workflows/          # Skills que automatizan procesos completos
    ├── plan-save-workflow/
    │   ├── SKILL.md
    │   └── resources/
    │       ├── memtech-integration.md
    │       └── workflow-steps.md
    └── pm2-monitor/
        └── ...
```

### 2.2 Convenciones de Estructura

**Por cada skill**:
- `SKILL.md`: Documento principal (≤ 400 líneas recomendado)
- `resources/`: Documentación detallada on-demand
- `scripts/`: Scripts ejecutables (opcional)

---

## 3. Tipos de Skills

### 3.1 Guideline (Guía)

**Propósito**: Sugerir mejores prácticas y patrones recomendados

**Características**:
- `enforcement`: `suggest`
- No bloquea ejecución
- Activa cuando el contexto es relevante
- Proporciona ejemplos y patrones

**Ejemplo**: `backend-dev-guidelines`
```yaml
type: guideline
enforcement: suggest
priority: high
```

**Cuándo usar**:
- Patrones arquitectónicos
- Convenciones de código
- Mejores prácticas de desarrollo

### 3.2 Guardrail (Barrera de Seguridad)

**Propósito**: Prevenir acciones peligrosas o requerir validaciones

**Características**:
- `enforcement`: `block` | `require`
- Puede bloquear ejecución
- Detecta patrones peligrosos
- Requiere validación explícita

**Ejemplo**: `database-verification`
```yaml
type: guardrail
enforcement: block
priority: critical
```

**Cuándo usar**:
- Operaciones destructivas (DELETE, TRUNCATE)
- Validación de secretos
- Prevención de vulnerabilidades

### 3.3 Workflow (Flujo de Trabajo)

**Propósito**: Automatizar procesos completos multi-paso

**Características**:
- `enforcement`: `suggest` | `require`
- Orquesta múltiples acciones
- Genera artifacts
- Integra con sistemas externos

**Ejemplo**: `plan-save-workflow`
```yaml
type: workflow
enforcement: suggest
priority: high
```

**Cuándo usar**:
- Procesos repetitivos
- Generación de documentación
- Integración de sistemas

### 3.4 Analyst (Analista)

**Propósito**: Analizar código, repositorio o arquitectura

**Características**:
- `enforcement`: `suggest`
- Recolecta métricas
- Genera reportes
- Identifica patrones

**Ejemplo**: `repo-auditor`
```yaml
type: analyst
enforcement: suggest
priority: normal
```

**Cuándo usar**:
- Auditorías de código
- Análisis de arquitectura
- Recolección de métricas

### 3.5 Generator (Generador)

**Propósito**: Generar código, documentación o configuración

**Características**:
- `enforcement`: `suggest`
- Crea artifacts nuevos
- Sigue templates
- Aplica metodologías

**Ejemplo**: `plan-architect`
```yaml
type: generator
enforcement: suggest
priority: high
```

**Cuándo usar**:
- Generación de planes
- Scaffolding de código
- Creación de documentación

---

## 4. Schema de YAML Frontmatter

### 4.1 Campos Requeridos

```yaml
---
id: skill-id                    # Identificador único (kebab-case)
version: 0.1.0                  # Versión semántica
type: guideline|guardrail|workflow|analyst|generator
summary: Brief description      # Descripción breve orientada a acción
audience: engineers, architects # Audiencia objetivo
when_to_use: Clear trigger conditions  # Cuándo activar este skill
---
```

### 4.2 Campos Opcionales

```yaml
provides: What this skill provides  # Qué proporciona
resources:                          # Recursos adicionales
  - resources/reference.md
  - resources/examples.md
scripts:                            # Scripts ejecutables
  - name: script-name
    run: command to execute
    note: Description
limits: Constraints and scope       # Limitaciones y alcance
enforcement: suggest|require|block  # Nivel de enforcement (solo guardrails)
```

### 4.3 Ejemplo Completo

```yaml
---
id: plan-architect
version: 0.1.0
type: generator
summary: Genera planes estructurados siguiendo metodología CLOOP (Clarify → Layout → Operate → Observe → Reflect) para tareas de desarrollo.
audience: engineers, architects
when_to_use: Cuando necesites crear un plan estructurado para una tarea, feature o proyecto. Usa cuando el usuario ejecuta "/plan <tarea>" o requiere planificación formal.
provides: Meta-prompt CLOOP, generación de plan con fases estructuradas, identificación de riesgos y métricas.
resources:
  - resources/cloop-methodology.md
  - resources/plan-templates.md
  - resources/risk-identification.md
scripts:
  - name: generate-plan
    run: skills plan create "<task>"
    note: Genera un plan básico desde descripción de tarea.
limits: Genera estructura base; requiere edición manual para fases específicas y riesgos detallados.
---
```

---

## 5. Estructura del SKILL.md

### 5.1 Secciones Requeridas

#### **Frontmatter YAML**
```yaml
---
[campos requeridos y opcionales]
---
```

#### **Objetivo**
```markdown
## Objetivo

[Descripción del objetivo del skill]

**Cuándo usar**: [Escenarios específicos]

**Cuándo NO usar**: [Casos donde no aplica]

**Qué problema resuelve**: [Necesidad que cubre]
```

#### **Procedimiento (resumen)**
```markdown
## Procedimiento (resumen)

1. **Paso 1**: [Descripción clara]
2. **Paso 2**: [Descripción clara]
3. **Paso 3**: [Continuar según necesario]
```

#### **Checklist**
```markdown
## Checklist

- [ ] Criterio 1: [Descripción clara]
- [ ] Criterio 2: [Descripción clara]
- [ ] Criterio 3: [Continuar según necesario]
```

#### **Ejemplos**
```markdown
## Ejemplos

### ✅ Correcto

[Ejemplo de uso correcto con código/comandos]

### ❌ Incorrecto

[Ejemplo de uso incorrecto con explicación]
```

#### **Recursos Adicionales**
```markdown
## Recursos Adicionales

- `./resources/reference.md` - [Descripción]
- `./resources/examples.md` - [Descripción]
```

### 5.2 Secciones Opcionales

- **Scripts Reales**: Comandos ejecutables del proyecto
- **Meta-prompt**: Para generators (ej: CLOOP structure)
- **Política**: Para guardrails (reglas de bloqueo)
- **Workflow Detallado**: Para workflows (pasos expandidos)

---

## 6. Sistema de Activación

### 6.1 Configuración: skill-rules.json

Este archivo define los triggers para cada skill:

```json
{
  "skill-id": {
    "type": "guideline|guardrail|workflow|analyst|generator",
    "enforcement": "suggest|require|block",
    "priority": "critical|high|normal|low",
    "promptTriggers": {
      "keywords": ["palabra1", "palabra2"],
      "intentPatterns": [
        "(crear|generar).*plan",
        "regex pattern"
      ]
    },
    "fileTriggers": {
      "pathPatterns": ["**/path/**/*.{ts,js}"],
      "contentPatterns": ["regex pattern"]
    },
    "resources": [
      "resources/file.md"
    ]
  }
}
```

### 6.2 Tipos de Triggers

#### **1. Prompt Triggers (Intención del Usuario)**

**keywords**: Palabras clave simples
```json
"keywords": ["plan", "planificar", "tarea", "feature"]
```

**intentPatterns**: Expresiones regulares para intención
```json
"intentPatterns": [
  "(crear|generar|hacer).*plan",
  "/plan",
  "planificar.*(tarea|feature)"
]
```

#### **2. File Triggers (Contexto de Archivos)**

**pathPatterns**: Patrones glob para rutas
```json
"pathPatterns": [
  "**/repository/**/*.{ts,js}",
  "backend/src/**/*.ts"
]
```

**contentPatterns**: Regex para contenido de archivos
```json
"contentPatterns": [
  "deleteMany\\s*\\(\\s*\\)",
  "updateMany\\s*\\(\\s*\\{\\s*(?!.*where)"
]
```

### 6.3 Sistema de Scoring

**Cálculo de relevancia**:
```
score = (keywords_match * 0.20) + 
        (intent_match * 0.30) + 
        (path_match * 0.30) + 
        (content_match * 0.20)
```

**Umbral de activación**: 
- Default: ≥ 0.6
- Configurable por skill

**Ejemplo de scoring**:
```javascript
// Usuario escribe: "crear endpoint backend"
// Archivo: backend/src/controllers/UserController.ts

keywords_match: 0.8  // "backend", "endpoint"
intent_match: 1.0    // "(create|add).*endpoint"
path_match: 1.0      // "backend/src/**/*.ts"
content_match: 0.6   // "export.*Controller"

score = (0.8 * 0.20) + (1.0 * 0.30) + (1.0 * 0.30) + (0.6 * 0.20)
      = 0.16 + 0.30 + 0.30 + 0.12
      = 0.88  ✅ ACTIVADO (≥ 0.6)
```

### 6.4 Flujo de Activación

```
1. Pre-invoke Hook
   ↓
2. Calcular score para cada skill
   ↓
3. Si score ≥ umbral:
   - Cargar metadatos del skill
   - Inyectar banner en contexto
   - Cargar SKILL.md completo
   ↓
4. Durante ejecución:
   - Recursos cargados on-demand
   - Scripts ejecutados si necesario
   ↓
5. Stop Hook
   - Formateo
   - Typecheck
   - Guardrails
   - Notificaciones
   - KPIs
```

---

## 7. Sistema de Validación

### 7.1 Parser de Skills

**Ubicación**: `packages/skills-cli/src/utils/skill-parser.ts`

**Funciones principales**:

```typescript
// Parsear SKILL.md
async function parseSkillMD(filePath: string): Promise<ExtendedSkillMetadata>

// Validar estructura del skill
async function validateSkillStructure(skillPath: string): Promise<ValidationResult>
```

**Validaciones**:
- Existencia de SKILL.md
- YAML frontmatter válido
- Campos requeridos presentes
- Formato correcto

### 7.2 Tipos de Validación

**Interfaz ValidationResult**:
```typescript
interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
```

**Ejemplo de uso**:
```typescript
const result = await validateSkillStructure('./skills/generators/plan-architect');

if (!result.valid) {
  console.error('Errores:', result.errors);
  console.warn('Warnings:', result.warnings);
}
```

---

## 8. CLI y Comandos

### 8.1 Comandos Disponibles

#### **Indexar Skills**
```bash
pnpm skills:index
# o
node packages/skills-cli/dist/index.js skills index ./skills --out ./registry/index.json
```

**Propósito**: Genera `registry/index.json` con metadatos de todos los skills

**Output**:
```json
{
  "skills": [
    {
      "name": "plan-architect",
      "description": "Genera planes estructurados...",
      "severity": "medium",
      "triggers": {
        "keywords": ["genera", "planes", "estructurados"]
      }
    }
  ],
  "version": "1.0.0",
  "generatedAt": "2025-10-29T19:58:25.071Z"
}
```

#### **Validar Skills**
```bash
pnpm skills:lint
# o con strict mode
node packages/skills-cli/dist/index.js skills lint ./skills --strict
```

**Propósito**: Valida estructura y formato de todos los skills

#### **Generar skill-rules.json**
```bash
pnpm skills:rules
# o
node packages/skills-cli/dist/index.js skills rules
```

**Propósito**: Genera/actualiza configuración de triggers

#### **Verificar Activación**
```bash
node packages/skills-cli/dist/index.js skills check "crear endpoint backend" --verbose
```

**Propósito**: Simula qué skills se activarían con un prompt dado

### 8.2 Registry System

**Ubicación**: `registry/index.json`

**Estructura**:
```json
{
  "skills": [
    {
      "name": "skill-id",
      "description": "Brief description",
      "severity": "critical|high|medium|low",
      "triggers": {
        "keywords": ["keyword1", "keyword2"],
        "intentPatterns": ["pattern1"],
        "pathPatterns": ["path/**/*"],
        "contentPatterns": ["regex"]
      }
    }
  ],
  "version": "1.0.0",
  "generatedAt": "ISO-8601 timestamp"
}
```

---

## 9. Patrones de Skills Existentes

### 9.1 Plan Architect (Generator)

**Patrón**: Meta-prompt estructurado con metodología

**Características clave**:
- Define estructura CLOOP completa
- Proporciona meta-prompt para generación
- Incluye checklist de validación
- Recursos modulares (methodology, templates, risks)

**Lecciones**:
- Meta-prompts son efectivos para generators
- Estructura CLOOP aplicable a múltiples dominios
- Checklist asegura completitud

### 9.2 Database Verification (Guardrail)

**Patrón**: Detección de patrones peligrosos con bloqueo

**Características clave**:
- Regex patterns para detectar código inseguro
- Enforcement: block (crítico)
- Ejemplos claros de qué bloquear
- Recursos con patterns y migration checklist

**Lecciones**:
- Guardrails deben ser precisos (evitar falsos positivos)
- Ejemplos ❌ son tan importantes como ✅
- Documentar alternativas seguras

### 9.3 Backend Dev Guidelines (Guideline)

**Patrón**: Arquitectura en capas con separación de responsabilidades

**Características clave**:
- Define flujo: rutas → controladores → servicios → repositorios
- Recursos por capa (controllers.md, services.md, etc.)
- Ejemplos de cada capa
- Scripts de testing

**Lecciones**:
- Guidelines deben ser prescriptivas pero flexibles
- Recursos modulares permiten profundización
- Ejemplos de código real son esenciales

### 9.4 Plan Save Workflow (Workflow)

**Patrón**: Orquestación multi-paso con generación de artifacts

**Características clave**:
- Workflow en 6 pasos claramente definidos
- Genera tríada de documentos (plan.md, context.md, tasks.md)
- Integración con sistemas externos (MemTech)
- Validación en cada paso

**Lecciones**:
- Workflows deben ser idempotentes
- Validación incremental previene errores
- Documentar outputs esperados

---

## 10. Mejores Prácticas

### 10.1 Creación de Skills

1. **Descripciones Claras**:
   - Orientadas a acción
   - Explícitas sobre cuándo usar/NO usar
   - Incluir audiencia objetivo

2. **Divulgación Progresiva**:
   - SKILL.md ligero (≤ 400 líneas)
   - Detalles en resources/
   - Cargar solo cuando se necesita

3. **Scripts Reales**:
   - Todos los scripts referenciados deben existir
   - Documentar cada script
   - Incluir ejemplos de uso

4. **Ejemplos Concretos**:
   - Incluir ejemplos ✅ y ❌
   - Código real, no pseudocódigo
   - Explicar por qué cada ejemplo es correcto/incorrecto

5. **Checklists**:
   - Definir Definition of Done clara
   - Criterios medibles
   - Verificables automáticamente cuando sea posible

### 10.2 Triggers Efectivos

1. **Keywords**:
   - Usar términos específicos del dominio
   - Incluir sinónimos y variaciones
   - Evitar palabras demasiado genéricas

2. **Intent Patterns**:
   - Capturar intención, no solo palabras
   - Usar grupos de captura para flexibilidad
   - Probar con ejemplos reales

3. **Path Patterns**:
   - Usar globs específicos
   - Considerar estructura del proyecto
   - Evitar patterns demasiado amplios

4. **Content Patterns**:
   - Regex precisos para evitar falsos positivos
   - Escapar caracteres especiales correctamente
   - Documentar qué detecta cada pattern

### 10.3 Validación y Testing

1. **QA Mínima por PR**:
   - ✅ `pnpm skills:lint` sin warnings
   - ✅ E2E: guardrails bloquean casos peligrosos
   - ✅ Verificar activación con `skills check`

2. **Testing de Activación**:
   - Probar con prompts reales
   - Verificar scoring
   - Validar que no haya colisiones

3. **Documentación**:
   - README actualizado
   - Ejemplos de uso
   - Troubleshooting común

---

## 11. Integración con el Sistema

### 11.1 Hooks del Sistema

**Pre-invoke Hook**:
- Calcula scores
- Activa skills relevantes
- Inyecta contexto

**Stop Hook**:
- Ejecuta formateo
- Ejecuta typecheck
- Aplica guardrails
- Envía notificaciones
- Recolecta KPIs

### 11.2 Inyección de Contexto

**Banner de Skill**:
```markdown
🔧 **SKILL ACTIVATED**: plan-architect

Genera planes estructurados siguiendo metodología CLOOP...

**Cuándo usar**: Cuando necesites crear un plan estructurado...
```

**Recursos On-Demand**:
```markdown
📚 **RESOURCE**: cloop-methodology.md

[Contenido del recurso...]
```

### 11.3 Métricas y KPIs

**Métricas de Activación**:
- Frecuencia de activación por skill
- Score promedio de activación
- Tasa de falsos positivos/negativos

**Métricas de Adherencia**:
- Checklist completion rate
- Tiempo de ejecución
- Éxito de validaciones

**Métricas de Calidad**:
- Errores prevenidos (guardrails)
- Código generado (generators)
- Análisis completados (analysts)

---

## 12. Arquitectura Técnica

### 12.1 Componentes Principales

```
packages/
├── skills-cli/              # CLI para gestión de skills
│   ├── src/
│   │   ├── commands/
│   │   │   └── skills.ts    # Comandos: index, lint, rules, check
│   │   ├── types/
│   │   │   └── skill.ts     # Interfaces TypeScript
│   │   └── utils/
│   │       └── skill-parser.ts  # Parser y validador
│   └── dist/                # Compilado
├── daemon/                  # Daemon de skills
│   └── src/
│       └── skills.ts        # Lógica de activación
└── router/                  # Router de skills
    └── src/
        └── __tests__/
            └── skill-activation-test.ts  # Tests de activación
```

### 12.2 Interfaces TypeScript

```typescript
// Metadatos de un skill
interface SkillMetadata {
  name: string;
  description: string;
  triggers?: {
    keywords?: string[];
    intentPatterns?: string[];
    pathPatterns?: string[];
    contentPatterns?: string[];
  };
  severity?: 'critical' | 'high' | 'medium' | 'low';
}

// Match de un skill
interface SkillMatch {
  skill: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  matchedTriggers: string[];
}

// Registry de skills
interface SkillRegistry {
  skills: SkillMetadata[];
  version: string;
  generatedAt: string;
}

// Resultado de validación
interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
```

---

## 13. Casos de Uso Comunes

### 13.1 Crear un Nuevo Skill

1. **Definir tipo y propósito**
2. **Crear estructura de directorios**:
   ```bash
   mkdir -p skills/[category]/[skill-id]/resources
   ```
3. **Crear SKILL.md con frontmatter**
4. **Definir triggers en skill-rules.json**
5. **Crear recursos adicionales**
6. **Validar**:
   ```bash
   pnpm skills:lint
   ```
7. **Indexar**:
   ```bash
   pnpm skills:index
   ```

### 13.2 Modificar un Skill Existente

1. **Editar SKILL.md o recursos**
2. **Actualizar triggers si necesario**
3. **Validar cambios**:
   ```bash
   pnpm skills:lint
   ```
4. **Re-indexar**:
   ```bash
   pnpm skills:index
   ```
5. **Probar activación**:
   ```bash
   node packages/skills-cli/dist/index.js skills check "prompt de prueba"
   ```

### 13.3 Debuggear Activación

1. **Verificar triggers**:
   ```bash
   cat configs/skill-rules.json | jq '.["skill-id"]'
   ```
2. **Probar scoring**:
   ```bash
   node packages/skills-cli/dist/index.js skills check "prompt" --verbose
   ```
3. **Revisar logs de activación**:
   ```bash
   cat docs/skill-activation-log.md
   ```

---

## 14. Roadmap y Mejoras Futuras

### 14.1 Mejoras Planificadas

- **Templates automatizados**: Generación de skills desde templates
- **Validación avanzada**: Linting de contenido de recursos
- **Métricas en tiempo real**: Dashboard de activación y adherencia
- **A/B Testing**: Comparar efectividad de diferentes triggers
- **Machine Learning**: Optimizar scoring basado en feedback

### 14.2 Integraciones Futuras

- **IDE Plugins**: Integración con VSCode/Cursor
- **CI/CD**: Validación automática en PRs
- **MemTech**: Persistencia de contexto de skills
- **Grafana**: Visualización de métricas

---

## 15. Referencias

### 15.1 Documentación Interna

- `configs/SKILL.template.md` - Template oficial
- `configs/skill-rules.json` - Configuración de triggers
- `configs/skill-rules.schema.json` - Schema JSON
- `docs/skills/README.md` - Guía rápida
- `docs/CURSOR-SKILLS-SETUP.md` - Setup en Cursor

### 15.2 Código Fuente

- `packages/skills-cli/` - CLI de skills
- `packages/daemon/src/skills.ts` - Daemon
- `packages/router/src/__tests__/skill-activation-test.ts` - Tests

### 15.3 Skills de Ejemplo

- `skills/generators/plan-architect/` - Generator completo
- `skills/guardrails/database-verification/` - Guardrail crítico
- `skills/guidelines/backend-dev-guidelines/` - Guideline extenso
- `skills/workflows/plan-save-workflow/` - Workflow multi-paso

---

## 16. Conclusiones

### 16.1 Fortalezas del Sistema

1. **Divulgación Progresiva**: Carga solo lo necesario
2. **Activación Contextual**: Scoring sofisticado
3. **Tipos Especializados**: Cada tipo con comportamiento específico
4. **Validación Robusta**: Parser y CLI completos
5. **Extensibilidad**: Fácil agregar nuevos skills

### 16.2 Áreas de Mejora

1. **Documentación de Triggers**: Más ejemplos de patterns efectivos
2. **Testing**: Más tests de activación y scoring
3. **Métricas**: Dashboard de efectividad de skills
4. **Templates**: Generación automatizada de skills

### 16.3 Recomendaciones

1. **Para nuevos skills**: Seguir template estrictamente
2. **Para triggers**: Probar exhaustivamente antes de commit
3. **Para recursos**: Mantener modulares y on-demand
4. **Para validación**: Ejecutar `pnpm skills:lint` siempre

---

**Última actualización**: 2025-10-29  
**Versión del documento**: 1.0.0  
**Mantenedor**: Skills Team

