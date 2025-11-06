---
id: skill-creator
version: 0.1.0
type: generator
summary: 'Genera nuevos skills siguiendo el estándar Skills Fabric. Crea estructura completa: SKILL.md + recursos + documentación + tests siguiendo patrones establecidos.'
audience: engineers, skill-architects
when_to_use: 'Al crear un nuevo skill desde cero. Usa cuando necesites generar guía práctica con metodología estructurada y ejemplos detallados.'
provides: 'Estructura de skill completa, templates automatizados, validación de metadatos, generación de recursos técnicos, documentación consistente.'
resources:
  - resources/skill-anatomy.md
  - resources/resource-types.md
  - resources/metadata-standards.md
  - resources/validation-rules.md
scripts:
  - name: create-skill
    run: skills create <category> <name> --template <type>
    note: Crea skill completo con estructura base
  - name: create-resource
    run: skills create-resource <skill-id> <resource-name>
    note: Añade nuevo recurso a skill existente
  - name: validate-skill
    run: skills validate <skill-path>
    note: Valida estructura y metadatos del skill
limits: 'Requiere categoría válida (guidelines/guardrails/workflows/generators/test). Template necesario. Estructura máxima 400 líneas en SKILL.md principal.'
---

## Objetivo

Generar **nuevos skills completos** siguiendo el estándar Skills Fabric, asegurando consistencia, calidad y adherencia a patrones establecidos.

**Cuándo usar**:
- Crear skill desde cero
- Template para skill siguiendo metodología específica
- Estandarizar estructura para equipo
- Validar skills antes de commit

**Cuándo NO usar**: Para modificar skills existentes (usar template-skill).

**Qué problema resuelve**: Garantiza que todos los skills sigan el mismo estándar, reduce tiempo de setup, previene errores de estructura.

## Procedimiento (resumen)

### Generación Automatizada

1. **Definir Categoría**: Seleccionar tipo de skill (guidelines/guardrails/workflows/generators/test)

2. **Configurar Metadatos**: Especificar id, versión, enforcement, summary, audiencia, when_to_use

3. **Generar Estructura**: Crear archivos base siguiendo template específico

4. **Crear Recursos**: Generar 4 recursos técnicos especializados (naming, purpose, examples)

5. **Validar Consistencia**: Verificar que cumple estándares de formato y contenido

### Tipos de Skill Templates

#### Guideline Template
```bash
# Estructura: guidelines/{name}/
├── SKILL.md          # 150-200 líneas
├── resources/
│   ├── conceptual.md     # Conceptos fundamentales
│   ├── procedural.md     # Procedimientos paso a paso
│   ├── examples.md       # Casos de uso y ejemplos
│   └── troubleshooting.md # Problemas y soluciones
```

#### Guardrail Template
```bash
# Estructura: guardrails/{name}/
├── SKILL.md          # 150-200 líneas
├── resources/
│   ├── enforcement-levels.md
│   ├── common-patterns.md
│   ├── risk-mitigation.md
│   └── examples.md
```

#### Workflow Template
```bash
# Estructura: workflows/{name}/
├── SKILL.md          # 150-200 líneas
├── resources/
│   ├── setup.md          # Configuración inicial
│   ├── execution.md      # Ejecución paso a paso
│   ├── automation.md     # Automatización
│   └── monitoring.md     # Monitoreo y métricas
```

#### Generator Template
```bash
# Estructura: generators/{name}/
├── SKILL.md          # 150-200 líneas
├── resources/
│   ├── templates.md      # Templates y patrones
│   ├── customization.md  # Personalización
│   ├── integration.md    # Integración
│   └── examples.md       # Ejemplos completos
```

#### Test Template
```bash
# Estructura: test/{name}/
├── SKILL.md          # 150-200 líneas
├── resources/
│   ├── test-types.md     # Tipos de testing
│   ├── setup.md          # Configuración de tests
│   ├── execution.md      # Ejecución
│   └── analysis.md       # Análisis de resultados
```

## Checklist

- [ ] Categoría y nombre válidos
- [ ] Metadatos completos (id, type, version, enforcement)
- [ ] SKILL.md < 400 líneas
- [ ] 4 recursos técnicos creados
- [ ] Ejemplos de código incluidos
- [ ] Comandos scripts definidos
- [ ] resources/ arrays correctos
- [ ] Validación YAML pass

## Ejemplos

### ✅ Correcto - Guideline Skill

```bash
# Crear guideline skill
skills create guidelines using-git-worktrees --template guideline

# Estructura generada:
skills/guidelines/using-git-worktrees/
├── SKILL.md              # 462 líneas
├── resources/
│   ├── conceptual.md         # Conceptos de worktrees
│   ├── procedural.md         # Comandos y procedimientos
│   ├── examples.md           # Casos de uso reales
│   └── troubleshooting.md    # Problemas comunes
```

**Metadatos SKILL.md**:
```yaml
---
id: using-git-worktrees
version: 0.1.0
type: guideline
enforcement: suggest
summary: 'Técnica para desarrollo paralelo seguro...'
audience: engineers
when_to_use: 'Al desarrollar features en paralelo...'
provides: 'Desarrollo paralelo seguro...'
resources:
  - resources/conceptual.md
  - resources/procedural.md
  - resources/examples.md
  - resources/troubleshooting.md
scripts:
  - name: worktree-add
    run: git worktree add <path> <branch>
    note: Crea nuevo worktree
  - name: worktree-list
    run: git worktree list
    note: Lista worktrees activos
limits: 'Requiere Git 2.5+...'
---
```

### ✅ Correcto - Workflow Skill

```bash
# Crear workflow skill
skills create workflows pm2-deploy --template workflow

# Resultado: estructura completa con:
# - SKILL.md con CLOOP methodology
# - resources/setup.md con configuración
# - resources/execution.md con despliegue
# - resources/automation.md con CI/CD
# - resources/monitoring.md con métricas
```

### ✅ Correcto - Guardrail Skill

```bash
# Crear guardrail skill
skills create guardrails secret-scanning --template guardrail

# Con enforcement levels:
# - REQUIRE: Scanning obligatorio
# - BLOCK: Secrets detectados → fail
# - WARN: Patterns sospechosos
# - SUGGEST: Buenas prácticas
```

### ❌ Incorrecto

```yaml
---
# ❌ Falta metadata obligatoria
id: my-skill
# Falta: type, version, enforcement

# ❌ Demasiado largo
summary: 'Descripción muy larga... (500+ palabras)'

# ❌ Sin resources (requiere mínimo 4)
resources: []

# ❌ Scripts sin run
scripts:
  - name: test
    # falta run
---
```

## Comandos Útiles

```bash
# Crear skill completo
skills create <category> <name> --template <type>

# Crear solo estructura
skills create <category> <name> --no-resources

# Crear con parámetros custom
skills create guidelines my-guideline \
  --enforcement suggest \
  --audience engineers \
  --summary "Custom summary"

# Crear recursos adicionales
skills create-resource <skill-id> <resource-name>

# Validar skill existente
skills validate ./skills/guidelines/my-guideline

# Generar desde JSON
skills create --from-config skill-config.json
```

## Metadatos Estándar

### Campos Obligatorios

| Campo | Tipo | Valores |
|-------|------|---------|
| `id` | string | kebab-case, único, descriptivo |
| `version` | semver | `0.1.0` inicial |
| `type` | enum | guideline, guardrail, workflow, generator, test |
| `enforcement` | enum | suggest, warn, block, require |
| `summary` | string | < 200 caracteres |
| `audience` | string | engineers, architects, qa, all |
| `resources` | array | 4 paths a recursos |

### Enforcement Levels

- **suggest**: Buenas prácticas recomendadas
- **warn**: Riesgos identificados, requiere justificación
- **block**: Patrones peligrosos, debe evitarse
- **require**: Checks obligatorios, fail si no cumple

### Naming Conventions

- **Skills**: `kebab-case` (using-git-worktrees)
- **Archivos**: `kebab-case.md` (conceptual-foundations.md)
- **Scripts**: `kebab-case` (worktree-add)
- **Recursos**: `snake_case.md` (conceptual.md)

## Recursos Generados

Cada resource sigue patrón específico:

### 1. conceptual.md
- Conceptos fundamentales
- Teoría y principios
- Cuándo usar / no usar

### 2. procedural.md
- Procedimientos paso a paso
- Comandos detallados
- Checklist

### 3. examples.md
- Casos de uso reales
- Ejemplos de código
- Before/After

### 4. troubleshooting.md
- Problemas comunes
- Soluciones
- Debugging tips

## Validación Automática

```bash
# Schema validation
jq '.' ./skills/{category}/{name}/SKILL.md | schemas/skill-schema.json

# Lint de estructura
skills-cli skills lint ./skills --strict

# Check de metadatos
skills validate-metadata ./skills
```

### Criterios de Validación

✅ **Pass**:
- Estructura YAML válida
- Metadatos completos
- < 400 líneas SKILL.md
- 4+ recursos técnicos
- Scripts con run definido
- Nombres en kebab-case

❌ **Fail**:
- YAML malformado
- Campos faltantes
- > 400 líneas
- Sin recursos
- Scripts incompletos
- Nombres inválidos

## Integración con CLI

```bash
# Activación automática
skills-cli skills check "crear un nuevo skill" --v2
# → Detecta intent y sugiere skill-creator

# Ejecución directa
skills-cli skills execute skill-creator --params='{
  "category": "guidelines",
  "name": "test-driven-development"
}'
```

## Recursos

Ver `resources/` para:
- `skill-anatomy.md`: Anatomía completa de skill
- `resource-types.md`: Tipos de recursos y patrones
- `metadata-standards.md`: Estándares de metadatos
- `validation-rules.md`: Reglas de validación detalladas

### Templates por Categoría

| Categoría | Template | Características |
|-----------|----------|-----------------|
| **guidelines** | Guía práctica | Metodología, ejemplos, checklist |
| **guardrails** | Regla seguridad | Enforcement levels, patrones peligrosos |
| **workflows** | Proceso automatizado | CLOOP completo, gates, validación |
| **generators** | Generador código | Templates, personalización |
| **test** | Suite testing | Setup, ejecución, análisis |

### Best Practices

✅ **Al crear skills**:
- Máximo 400 líneas en SKILL.md principal
- 4 recursos técnicos detallados
- Ejemplos concretos de código
- Comandos ejecutables
- Validar antes de commit

❌ **Evitar**:
- SKILL.md monolítico sin recursos
- Conceptos sin ejemplos
- Sin comandos scripts
- Metadatos incompletos
- Violar naming conventions
