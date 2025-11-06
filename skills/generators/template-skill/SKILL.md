---
id: template-skill
version: 0.1.0
type: generator
summary: 'Genera templates para nuevos skills siguiendo el estándar Skills Fabric. Crea estructuras pre-configuradas con metadatos, recursos y validación automática.'
audience: engineers, skill-architects
when_to_use: 'Al crear un nuevo skill necesitas una plantilla base. Usa cuando el equipo necesita consistencia en la creación de skills.'
provides: 'Templates automatizados por categoría, metadatos pre-configurados, validación automática, estructura de recursos lista.'
resources:
  - resources/templates.md
  - resources/customization.md
  - resources/integration.md
  - resources/examples.md
scripts:
  - name: create-template
    run: skills create-template <category> <skill-name> --type <type>
    note: Genera template de skill completo
  - name: generate-resources
    run: skills generate-resources <skill-id>
    note: Crea los 4 recursos estándar para skill existente
  - name: validate-template
    run: skills validate-template <template-path>
    note: Valida que el template cumple estándares
limits: 'Requiere skill-creator para completitud final. Templates son base, requieren personalización manual según caso específico.'
---

## Objetivo

Generar **templates de alta calidad** para nuevos skills en Skills Fabric, asegurando consistencia, estandarización y reducción del tiempo de setup.

**Cuándo usar**:
- Crear un skill desde cero
- Estandarizar templates para el equipo
- Asegurar cumplimiento de estándares
- Acelerar onboarding de nuevos skills

**Cuándo NO usar**: Para modificar skills existentes (usar skill-creator).

**Qué problema resuelve**: Elimina trabajo repetitivo, garantiza estructura consistente, previene errores de formato y metadatos.

## Procedimiento (resumen)

### Generación de Template

1. **Seleccionar Categoría**: guideline, guardrail, workflow, generator, test

2. **Configurar Metadatos**: Generar YAML frontmatter con defaults apropiados

3. **Crear SKILL.md Base**: Estructura estándar según categoría

4. **Generar Recursos**: 4 recursos especializados con placeholders

5. **Validar Template**: Verificar estructura y cumplimiento de estándares

### Tipos de Templates

#### Template Guideline
```bash
# Genera estructura para guideline
skills create-template guidelines my-guideline

# Resultado:
skills/guidelines/my-guideline/
├── SKILL.md (estructura guideline)
└── resources/
    ├── conceptual.md
    ├── procedural.md
    ├── examples.md
    └── troubleshooting.md
```

#### Template Guardrail
```bash
# Genera estructura para guardrail
skills create-template guardrails my-guardrail

# Resultado:
skills/guardrails/my-guardrail/
├── SKILL.md (estructura guardrail)
└── resources/
    ├── enforcement-levels.md
    ├── common-patterns.md
    ├── risk-mitigation.md
    └── examples.md
```

#### Template Workflow
```bash
# Genera estructura para workflow
skills create-template workflows my-workflow

# Resultado:
skills/workflows/my-workflow/
├── SKILL.md (estructura workflow)
└── resources/
    ├── setup.md
    ├── execution.md
    ├── automation.md
    └── monitoring.md
```

#### Template Generator
```bash
# Genera estructura para generator
skills create-template generators my-generator

# Resultado:
skills/generators/my-generator/
├── SKILL.md (estructura generator)
└── resources/
    ├── templates.md
    ├── customization.md
    ├── integration.md
    └── examples.md
```

#### Template Test
```bash
# Genera estructura para test
skills create-template test my-test

# Resultado:
skills/test/my-test/
├── SKILL.md (estructura test)
└── resources/
    ├── test-types.md
    ├── setup.md
    ├── execution.md
    └── analysis.md
```

## Checklist

- [ ] Categoría seleccionada correctamente
- [ ] Metadatos completos en YAML
- [ ] SKILL.md < 400 líneas generado
- [ ] 4 recursos creados con placeholders
- [ ] Estructura de directorios correcta
- [ ] Naming convention respetado (kebab-case)
- [ ] Template pasa validación
- [ ] Comandos scripts definidos

## Ejemplos

### ✅ Correcto - Template Guideline

```bash
# Crear template guideline
skills create-template guidelines using-git-worktrees --type guideline

# Resultado generado:
---
id: using-git-worktrees
version: 0.1.0
type: guideline
enforcement: suggest
summary: '[PLACEHOLDER: Descripción concisa...]'
audience: engineers
when_to_use: '[PLACEHOLDER: Contexto de aplicación]'
provides: '[PLACEHOLDER: Beneficios y capacidades]'
resources:
  - resources/basic-commands.md
  - resources/use-cases.md
  - resources/advanced-techniques.md
  - resources/troubleshooting.md
scripts:
  - name: command-one
    run: command-to-execute
    note: Descripción del comando
  - name: command-two
    run: another-command
    note: Descripción del comando
limits: '[PLACEHOLDER: Restricciones y limitaciones]'
---

## Objetivo

[PLACEHOLDER: Objetivo del guideline]

## Procedimiento (resumen)

[PLACEHOLDER: Metodología principal]

## Checklist

[PLACEHOLDER: Items verificables]

## Ejemplos

### ✅ Correcto - Caso de Uso
[PLACEHOLDER: Ejemplo correcto]

### ❌ Incorrecto - Anti-patrón
[PLACEHOLDER: Ejemplo incorrecto]
```

### ✅ Correcto - Template Guardrail

```bash
skills create-template guardrails secret-scanning --type guardrail

# Estructura generada:
# - Enforcement: block (default para guardrails)
# - Resources enfocados en enforcement y seguridad
# - Scripts para validación automática
```

### ✅ Correcto - Template Workflow

```bash
skills create-template workflows pm2-deploy --type workflow

# Estructura generada:
# - CLOOP methodology completa
# - Resources: setup, execution, automation, monitoring
# - Scripts para CI/CD integration
```

### ❌ Incorrecto

```yaml
---
id: invalid-skill          # Sin kebab-case
type: invalid-type         # Type no válido
enforcement: invalid       # Enforcement no válido
summary: ''                 # Summary vacío
resources: []               # Array vacío
# Faltan campos obligatorios
---
```

## Comandos Útiles

```bash
# Generar template completo
skills create-template <category> <name> --type <type>

# Generar solo SKILL.md
skills create-template <category> <name> --skill-only

# Generar solo recursos
skills create-template <category> <name> --resources-only

# Generar con parámetros custom
skills create-template guidelines custom-guideline \
  --enforcement suggest \
  --audience engineers \
  --summary "Custom description"

# Listar templates disponibles
skills list-templates

# Validar template generado
skills validate-template ./skills/guidelines/my-guideline
```

## Estructura de Template

### SKILL.md Template

**Campos Generados Automáticamente**:
- `id`: Nombre convertido a kebab-case
- `version`: 0.1.0 (default)
- `type`: Según categoría seleccionada
- `enforcement`: Default según type
- `resources`: Array de 4 recursos específicos por categoría
- `scripts`: Comandos útiles según tipo

**Placeholders Reemplazados**:
- `[PLACEHOLDER: Descripción]`: Descripción estándar
- `[PLACEHOLDER: Contexto]`: Contexto genérico
- `[PLACEHOLDER: Objetivo]`: Objetivo según categoría
- `[PLACEHOLDER: Metodología]`: Metodología estándar

### Resources Templates

#### Guideline Resources
1. **conceptual.md**: Fundamentos teóricos + metodología
2. **procedural.md**: Procedimientos paso a paso
3. **examples.md**: Casos de uso y ejemplos
4. **troubleshooting.md**: Problemas y soluciones

#### Guardrail Resources
1. **enforcement-levels.md**: Explicación de levels
2. **common-patterns.md**: Patrones seguros/peligrosos
3. **risk-mitigation.md**: Mitigación de riesgos
4. **examples.md**: Casos de enforcement

#### Workflow Resources
1. **setup.md**: Configuración inicial
2. **execution.md**: Ejecución del workflow
3. **automation.md**: Automatización
4. **monitoring.md**: Métricas y seguimiento

#### Generator Resources
1. **templates.md**: Templates y patrones
2. **customization.md**: Personalización
3. **integration.md**: Integración
4. **examples.md**: Ejemplos de generación

#### Test Resources
1. **test-types.md**: Tipos de testing
2. **setup.md**: Configuración de tests
3. **execution.md**: Ejecución
4. **analysis.md**: Análisis de resultados

## Metadatos Por Categoría

### Guideline Defaults
```yaml
type: guideline
enforcement: suggest
audience: engineers
```

### Guardrail Defaults
```yaml
type: guardrail
enforcement: block
audience: [engineers, qa]
```

### Workflow Defaults
```yaml
type: workflow
enforcement: require
audience: [engineers, architects]
```

### Generator Defaults
```yaml
type: generator
enforcement: suggest
audience: engineers
```

### Test Defaults
```yaml
type: test
enforcement: require
audience: [engineers, qa]
```

## Validación de Templates

### Schema Validation
```bash
# El template generado debe cumplir:
- YAML válido
- Campos obligatorios completos
- Resources array con 4 elementos
- Scripts con name, run, note
- SKILL.md < 400 líneas
```

### Structural Validation
```bash
# Verificar estructura:
skills validate-template ./skills/guidelines/my-guideline

# Output:
{
  "valid": true,
  "structure": "compliant",
  "resources": 4,
  "metadata": "complete",
  "score": 95
}
```

### Content Validation
```bash
# Verificar contenido:
- Placeholders reemplazados
- Secciones obligatorias presentes
- Ejemplos de código incluidos
- Naming convention respetado
```

## Integración con skill-creator

### Flujo Completo
```bash
# Paso 1: Generar template
skills create-template guidelines my-guideline

# Paso 2: Completar con skill-creator
skills-cli skills execute skill-creator --params='{
  "skill_path": "./skills/guidelines/my-guideline",
  "action": "complete"
}'

# Paso 3: Validar resultado
skills validate-template ./skills/guidelines/my-guideline
```

### Automation Script
```bash
#!/bin/bash
# create-skill-complete.sh
