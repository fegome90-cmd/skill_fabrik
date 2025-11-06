# Skill Anatomy - Anatomía Completa de un Skill

## Estructura General

```
skills/
├── {category}/
│   └── {skill-name}/
│       ├── SKILL.md              # Archivo principal (OBLIGATORIO)
│       └── resources/
│           ├── resource-1.md     # Recurso técnico 1
│           ├── resource-2.md     # Recurso técnico 2
│           ├── resource-3.md     # Recurso técnico 3
│           └── resource-4.md     # Recurso técnico 4
```

## SKILL.md - Estructura Detallada

### Frontmatter (Metadata)

**Ubicación**: Líneas 1-25 (antes de `---`)

**Campos Obligatorios**:
```yaml
---
id: skill-name                    # string, kebab-case, único
version: 0.1.0                    # semver, empezar en 0.1.0
type: guideline|guardrail|        # enum, categoría principal
         workflow|generator|test
enforcement: suggest|warn|        # enum, nivel de enforcement
            block|require
summary: 'Descripción concisa...'  # string, < 200 chars
audience: engineers|qa|all        # string, audiencia target
when_to_use: 'Cuándo aplicar...'  # string, contexto de uso
provides: 'Qué entrega...'        # string, beneficios/resultados
resources:
  - resources/file-1.md           # array, 4 paths exactos
  - resources/file-2.md
  - resources/file-3.md
  - resources/file-4.md
scripts:
  - name: script-name            # array, comandos útiles
    run: command to execute
    note: descripción del comando
limits: 'Restricciones y...'      # string, limitaciones conocidas
---
```

**Campos Opcionales**:
```yaml
# Estos campos son opcionales pero recomendados
category: specialized              # para categorización adicional
tags: [keyword1, keyword2]        # array, tags de búsqueda
dependencies:                     # array, skills requeridos
  - skill-a
  - skill-b
examples_count: 15               # número, para tracking
lines_count: 185                 # número, para QA
```

### Cuerpo Principal (Contenido)

**Ubicación**: Líneas 26 en adelante

**Secciones Estándar**:

#### 1. Objetivo (Obligatorio)
- **Qué problema resuelve** el skill
- **Cuándo usar** y **cuándo NO usar**
- **Beneficios** esperados
- **Impacto** en el workflow

**Estructura**:
```markdown
## Objetivo

[SENTENCIA PRINCIPAL que defina el propósito]

**Cuándo usar**:
- Contexto 1
- Contexto 2
- Contexto 3

**Cuándo NO usar**:
- Situación 1
- Situación 2

**Qué problema resuelve**:
- Problema A
- Problema B
```

#### 2. Procedimiento (Obligatorio)
- Resumen del proceso principal
- Pasos o metodología
- Flujo de trabajo

**Estructura**:
```markdown
## Procedimiento (resumen)

### Metodología Principal

1. **Paso 1**: Descripción
   - Sub-paso A
   - Sub-paso B

2. **Paso 2**: Descripción
   - Sub-paso A
   - Sub-paso B

3. **Paso 3**: Descripción
   - Sub-paso A
   - Sub-paso B
```

#### 3. Checklist (Obligatorio)
- Lista de validaciones
- Items verificables
- Criterios de calidad

**Estructura**:
```markdown
## Checklist

- [ ] Item 1 (verificable)
- [ ] Item 2 (verificable)
- [ ] Item 3 (verificable)
- [ ] Item 4 (verificable)
- [ ] Item 5 (verificable)
```

#### 4. Ejemplos (Obligatorio)
- ✅ Correcto: Ejemplos de uso correcto
- ❌ Incorrecto: Ejemplos de lo que NO hacer
- Código real y aplicable

**Estructura**:
```markdown
## Ejemplos

### ✅ Correcto - Caso de Uso X

```typescript
// Código de ejemplo
const result = doSomething();
expect(result).toBe(true);
```

### ❌ Incorrecto

```typescript
// Código que evita errores comunes
const result = badPractice(); // Problema: razón
```

### Otro Ejemplo Correcto

```bash
# Comando con explanation
npm install package-name --save
# Resultado: Instalación y registro en package.json
```
```

#### 5. Comandos Útiles (Recomendado)
- Comandos ejecutables
- Scripts de automatización
- CLI commands

**Estructura**:
```markdown
## Comandos Útiles

```bash
# Comando 1
command --flag value

# Comando 2
npm run script-name

# Comando 3
git command --option
```
```

#### 6. Recursos (Recomendado)
- Referencia a resources/
- Links a documentación
- Materiales complementarios

**Estructura**:
```markdown
## Recursos

Ver `resources/` para:
- `file-1.md`: [Descripción breve]
- `file-2.md`: [Descripción breve]
- `file-3.md`: [Descripción breve]
- `file-4.md`: [Descripción breve]
```

## Resources/ - Estructura de Recursos

### Patrón de Naming

```
resources/
├── conceptual.md      # Conceptos fundamentales
├── procedural.md      # Procedimientos paso a paso
├── examples.md        # Casos de uso y ejemplos
└── troubleshooting.md # Problemas y soluciones
```

### Contenido por Tipo

#### 1. conceptual.md (≈ 300-500 líneas)

**Propósito**: Fundamentos teóricos y conceptuales

**Estructura**:
```markdown
# [Skill Name] - Conceptos Fundamentales

## 1. Conceptos Base
- Definición 1
- Definición 2
- Principios

## 2. Metodología
- Marco teórico
- Fases/etapas
- Teorema/ejemplo

## 3. Arquitectura
- Componentes
- Interacciones
- Patterns

## 4. Alternativas
- Comparación
- Trade-offs
- Decisiones

## 5. Casos de Uso
- Cuando aplicar
- Cuando NO aplicar
- Contextos
```

#### 2. procedural.md (≈ 300-500 líneas)

**Propósito**: Procedimientos operativos detallados

**Estructura**:
```markdown
# [Skill Name] - Procedimientos Detallados

## Setup Inicial
```bash
# Configuración paso a paso
command 1
command 2
```

## Procedimiento Principal

### Paso 1: [Nombre del Paso]

#### Detalle 1
```bash
# Comando específico
```

#### Detalle 2
```bash
# Comando específico
```

### Paso 2: [Nombre del Paso]
- [ ] Item 1
- [ ] Item 2
- [ ] Item 3

## Procedimientos Avanzados

### Técnica 1: [Nombre]
- [ ] Paso A
- [ ] Paso B

### Técnica 2: [Nombre]
- [ ] Paso A
- [ ] Paso B
```

#### 3. examples.md (≈ 300-500 líneas)

**Propósito**: Ejemplos prácticos y casos reales

**Estructura**:
```markdown
# [Skill Name] - Ejemplos Prácticos

## Ejemplo 1: [Contexto]

### Descripción
[Qué resuelve este ejemplo]

### Código
```typescript
// Implementación completa
```

### Resultado
```
Output esperado
```

### Explicación
[Por qué funciona así]

## Ejemplo 2: [Contexto]

[Same structure...]

## Casos Reales

### Caso 1: [Empresa/Proyecto]
- Contexto
- Solución
- Resultado

### Caso 2: [Empresa/Proyecto]
[Same structure...]
```

#### 4. troubleshooting.md (≈ 300-500 líneas)

**Propósito**: Problemas comunes y soluciones

**Estructura**:
```markdown
# [Skill Name] - Troubleshooting

## Problemas Comunes

### Problema 1: [Descripción del error]

**Síntomas**:
- Indicador 1
- Indicador 2
- Indicador 3

**Causa**:
[Explicación de por qué ocurre]

**Solución**:
```bash
# Comando de solución
command fix
```

**Prevención**:
[Cómo evitar en el futuro]

### Problema 2: [Descripción del error]

[Same structure...]

## Debugging

### Herramientas
- Herramienta 1: descripción
- Herramienta 2: descripción

### Comandos de Debug
```bash
# Verificar estado
command debug

# Diagnóstico
command diagnose
```

## Errores Avanzados

### Error Complejo 1
- [ ] Paso 1: diagnose
- [ ] Paso 2: fix
- [ ] Paso 3: verify
```

## Métricas de Calidad

### SKILL.md
- **Líneas**: 150-200 (máximo 400)
- **Caracteres summary**: < 200
- **Secciones mínimas**: 4 (Objetivo, Procedimiento, Checklist, Ejemplos)
- **Secciones recomendadas**: 6 (+ Comandos Útiles, Recursos)

### Resources/
- **Cantidad**: 4 archivos
- **Líneas por archivo**: 300-500
- **Total resources**: 1200-2000 líneas
- **Ejemplos de código**: Mínimo 15 en total

### Ejemplos
- **Ejemplos "Correctos"**: Mínimo 3
- **Ejemplos "Incorrectos"**: Mínimo 2
- **Casos reales**: Mínimo 2

## Validación Automática

### Schema Validation (YAML)

```bash
# Verificar frontmatter
jq 'has("id", "version", "type", "enforcement")' SKILL.md

# Verificar resources array
jq '.resources | length == 4' SKILL.md

# Verificar scripts structure
jq '.scripts | map(has("name", "run")) | all' SKILL.md
```

### Lint de Contenido

```bash
# Verificar líneas
wc -l SKILL.md  # debe ser < 400

# Verificar secciones requeridas
grep -q "## Objetivo" SKILL.md
grep -q "## Procedimiento" SKILL.md
grep -q "## Checklist" SKILL.md
grep -q "## Ejemplos" SKILL.md

# Verificar recursos existen
for resource in resources/*.md; do
  [ -f "$resource" ] || echo "Missing: $resource"
done
```

## Best Practices

### ✅ Hacer
- Usar naming convention kebab-case
- Escribir ejemplos ejecutables
- Mantener SKILL.md < 400 líneas
- Crear 4 recursos especializados
- Validar antes de commit
- Seguir estructura estándar

### ❌ Evitar
- SKILL.md monolítico sin recursos
- Conceptos sin ejemplos
- Sin comandos scripts
- Metadatos incompletos
- Violar naming conventions
- Ejemplos genéricos sin código

## Templates por Categoría

### Guideline Structure
```markdown
## Objetivo
[Problema a resolver]

## Procedimiento (resumen)
[Metodología principal]

## Checklist
- [ ] Item 1
- [ ] Item 2

## Ejemplos
[Casos de uso reales]
```

### Guardrail Structure
```markdown
## Objetivo
[Seguridad/compliance a lograr]

## Enforcement Levels
[Definir niveles: suggest/warn/block/require]

## Procedimiento (resumen)
[Cómo aplicar guardrail]

## Checklist
- [ ] Regla 1
- [ ] Regla 2

## Ejemplos
[Patrones peligrosos y seguros]
```

### Workflow Structure
```markdown
## Objetivo
[Proceso a automatizar]

## Procedimiento (resumen)
[CLOOP methodology]

## Fases
- [ ] Fase 1
- [ ] Fase 2

## Checklist
- [ ] Setup
- [ ] Execution
- [ ] Validation

## Ejemplos
[Workflows completos]
```

## Tools de Generación

### skill-creator (CLI)
```bash
skills create <category> <name> --template <type>
```

### Validación
```bash
skills validate ./skills/guidelines/my-skill
```

### Indexing
```bash
skills-cli skills index ./skills --out ./registry/index.json
```

## Checklist Final

Antes de considerar un skill "completo":

- [ ] SKILL.md creado con frontmatter completo
- [ ] SKILL.md < 400 líneas
- [ ] 4 recursos en resources/
- [ ] Cada resource 300-500 líneas
- [ ] Mínimo 3 ejemplos "Correctos"
- [ ] Mínimo 2 ejemplos "Incorrectos"
- [ ] Mínimo 15 ejemplos de código en total
- [ ] Scripts con run definido
- [ ] Naming convention respetado
- [ ] Validación YAML pass
- [ ] Lint de contenido pass
- [ ] Registrado en registry/index.json

---

**Ref**: Usar este documento como guía al crear o auditar skills en Skills Fabric.
