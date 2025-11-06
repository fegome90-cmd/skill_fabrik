# Template Skill - Templates y Patrones

## Overview de Templates

Los templates son **scaffolds automatizados** para crear skills con estructura estándar, metadatos pre-configurados y validación automática.

## Templates por Categoría

### 1. Template Guideline

**Ubicación**: Base para skills en `skills/guidelines/`

**Propósito**: Crear guías prácticas con metodología, ejemplos y troubleshooting

**Estructura generada**:
```markdown
---
id: skill-name
version: 0.1.0
type: guideline
enforcement: suggest
summary: '[PLACEHOLDER: Descripción concisa...]'
audience: engineers
when_to_use: '[PLACEHOLDER: Contexto de aplicación]'
provides: '[PLACEHOLDER: Beneficios y capacidades]'
resources:
  - resources/conceptual.md
  - resources/procedural.md
  - resources/examples.md
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

[PLACEHOLDER: Qué problema resuelve, cuándo usar, cuándo NO usar]

## Procedimiento (resumen)

1. [PLACEHOLDER: Paso 1]
2. [PLACEHOLDER: Paso 2]
3. [PLACEHOLDER: Paso 3]

## Checklist

- [ ] [PLACEHOLDER: Item 1]
- [ ] [PLACEHOLDER: Item 2]
- [ ] [PLACEHOLDER: Item 3]
- [ ] [PLACEHOLDER: Item 4]
- [ ] [PLACEHOLDER: Item 5]

## Ejemplos

### ✅ Correcto - Caso de Uso Principal

```typescript
// [PLACEHOLDER: Ejemplo correcto]
const result = implementSkill();
expect(result).toBe(expected);
```

### ❌ Incorrecto - Anti-patrón

```typescript
// [PLACEHOLDER: Ejemplo incorrecto]
const badResult = badImplementation(); // Problema: explicación
```

## Comandos Útiles

```bash
# [PLACEHOLDER: Comando 1]
command --flag value

# [PLACEHOLDER: Comando 2]
npm run script-name
```

## Recursos

Ver `resources/` para:
- `conceptual.md`: [PLACEHOLDER: Conceptos fundamentales]
- `procedural.md`: [PLACEHOLDER: Procedimientos detallados]
- `examples.md`: [PLACEHOLDER: Casos de uso]
- `troubleshooting.md`: [PLACEHOLDER: Problemas y soluciones]
```

**Campos específicos**:
- `enforcement`: `suggest` (default)
- `audience`: `engineers`
- `resources`: conceptual, procedural, examples, troubleshooting
- `focus`: Metodología y práctica

### Template Guardrail

**Ubicación**: Base para skills en `skills/guardrails/`

**Propósito**: Crear reglas de seguridad y compliance con enforcement levels

**Estructura generada**:
```markdown
---
id: skill-name
version: 0.1.0
type: guardrail
enforcement: block
summary: '[PLACEHOLDER: Descripción de la regla de seguridad]'
audience: [engineers, qa]
when_to_use: '[PLACEHOLDER: Cuándo aplicar la regla]'
provides: '[PLACEHOLDER: Qué validación o protección entrega]'
resources:
  - resources/enforcement-levels.md
  - resources/common-patterns.md
  - resources/risk-mitigation.md
  - resources/examples.md
scripts:
  - name: validate-code
    run: validation-command
    note: Valida cumplimiento de la regla
  - name: scan-patterns
    run: pattern-scanner
    note: Escanea patrones peligrosos
limits: '[PLACEHOLDER: Limitaciones y falsos positivos]'
---

## Objetivo

[PLACEHOLDER: Qué riesgo previene o compliance asegura]

## Enforcement Levels

### SUGGEST
- **Cuándo**: Recomendación, no obligatorio
- **Comportamiento**: Muestra hint

### WARN
- **Cuándo**: Riesgo identificado, requiere justificación
- **Comportamiento**: Warning con justificación requerida

### BLOCK
- **Cuándo**: Patrón peligroso confirmado
- **Comportamiento**: Falla el proceso

### REQUIRE
- **Cuándo**: Check obligatorio
- **Comportamiento**: Debe cumplirse

## Procedimiento (resumen)

1. **Detectar**: Identificar patrón
2. **Evaluar**: Determinar nivel de riesgo
3. **Enforce**: Aplicar enforcement level
4. **Report**: Generar reporte de compliance

## Checklist

- [ ] Patrón peligroso identificado
- [ ] Enforcement level apropiado
- [ ] False positives minimizados
- [ ] Justificación documentada
- [ ] Logs y auditoría habilitados

## Ejemplos

### ❌ Patrón Peligroso

```typescript
// Código que viola la regla
const secret = 'hardcoded-api-key'; // PROBLEMA: Secret hardcodeado
```

### ✅ Patrón Seguro

```typescript
// Código que cumple la regla
const apiKey = process.env.API_KEY; // Seguro: variable de entorno
```

## Recursos

Ver `resources/` para:
- `enforcement-levels.md`: [PLACEHOLDER: Explicación de levels]
- `common-patterns.md`: [PLACEHOLDER: Patrones peligrosos/seguros]
- `risk-mitigation.md`: [PLACEHOLDER: Cómo mitigar riesgos]
- `examples.md`: [PLACEHOLDER: Casos reales de enforcement]
```

**Campos específicos**:
- `enforcement`: `block` o `require` (default)
- `audience`: `[engineers, qa]`
- `resources`: enforcement-levels, common-patterns, risk-mitigation, examples
- `focus`: Seguridad y compliance

### Template Workflow

**Ubicación**: Base para skills en `skills/workflows/`

**Propósito**: Crear procesos automatizados siguiendo metodología CLOOP

**Estructura generada**:
```markdown
---
id: workflow-name
version: 0.1.0
type: workflow
enforcement: require
summary: '[PLACEHOLDER: Descripción del proceso automatizado]'
audience: [engineers, architects]
when_to_use: '[PLACEHOLDER: Cuándo ejecutar el workflow]'
provides: '[PLACEHOLDER: Qué proceso automatiza y qué entrega]'
resources:
  - resources/setup.md
  - resources/execution.md
  - resources/automation.md
  - resources/monitoring.md
scripts:
  - name: execute-workflow
    run: workflow-command
    note: Ejecuta el workflow completo
  - name: validate-phase
    run: validation-command
    note: Valida fase específica
limits: '[PLACEHOLDER: Prerequisites y limitaciones]'
---

## Objetivo

[PLACEHOLDER: Qué proceso automatiza, beneficios del workflow]

## CLOOP Methodology

### Clarify
- [ ] Objetivo definido
- [ ] Criterios de éxito claros
- [ ] Stakeholders identificados

### Layout
- [ ] Arquitectura diseñada
- [ ] Interfaces definidas
- [ ] Métricas especificadas

### Operate
- [ ] Fases ejecutadas
- [ ] Dependencias resueltas
- [ ] Checklist completada

### Observe
- [ ] Métricas recolectadas
- [ ] KPIs monitoreados
- [ ] Evidencia guardada

### Reflect
- [ ] Lecciones documentadas
- [ ] Mejoras identificadas
- [ ] Proceso refinado

## Fases del Workflow

### Fase 1: [Nombre]
- [ ] Paso 1.1
- [ ] Paso 1.2
- [ ] Validación: [criterio]

### Fase 2: [Nombre]
- [ ] Paso 2.1
- [ ] Paso 2.2
- [ ] Validación: [criterio]

### Fase 3: [Nombre]
- [ ] Paso 3.1
- [ ] Paso 3.2
- [ ] Validación: [criterio]

## Checklist

- [ ] Setup inicial completado
- [ ] Configuración validada
- [ ] Dependencias instaladas
- [ ] Permisos correctos
- [ ] Todas las fases ejecutadas
- [ ] Resultados validados
- [ ] Documentación actualizada

## Ejemplos

### ✅ Workflow Completo

```bash
# Ejecutar workflow completo
execute-workflow --config=production

# Resultado esperado:
# - Fase 1: Setup ✓
# - Fase 2: Build ✓
# - Fase 3: Deploy ✓
# - Total time: 15m
# - Success rate: 100%
```

### ❌ Fallo en Fase

```bash
# Error en fase 2
execute-workflow --config=staging

# Error: Validation failed in Fase 2
# Check logs: /var/log/workflow/error.log
```

## Recursos

Ver `resources/` para:
- `setup.md`: [PLACEHOLDER: Configuración inicial]
- `execution.md`: [PLACEHOLDER: Ejecución paso a paso]
- `automation.md`: [PLACEHOLDER: CI/CD y automatización]
- `monitoring.md`: [PLACEHOLDER: Métricas y KPIs]
```

**Campos específicos**:
- `enforcement`: `require` (default)
- `audience`: `[engineers, architects]`
- `resources`: setup, execution, automation, monitoring
- `focus`: CLOOP y automatización

### Template Generator

**Ubicación**: Base para skills en `skills/generators/`

**Propósito**: Crear generadores de código y plantillas reutilizables

**Estructura generada**:
```markdown
---
id: generator-name
version: 0.1.0
type: generator
enforcement: suggest
summary: '[PLACEHOLDER: Descripción del generador]'
audience: engineers
when_to_use: '[PLACEHOLDER: Cuándo usar el generador]'
provides: '[PLACEHOLDER: Qué genera y cómo personalizar]'
resources:
  - resources/templates.md
  - resources/customization.md
  - resources/integration.md
  - resources/examples.md
scripts:
  - name: generate-code
    run: generator-command --template <name>
    note: Genera código desde template
  - name: list-templates
    run: generator-command --list
    note: Lista templates disponibles
limits: '[PLACEHOLDER: Limitaciones del generador]'
---

## Objetivo

[PLACEHOLDER: Qué problema resuelve el generador, cuándo usarlo]

## Procedimiento (resumen)

1. **Seleccionar Template**: Elegir template apropiado
2. **Configurar Parámetros**: Customizar según necesidades
3. **Generar Código**: Ejecutar generación
4. **Validar Output**: Verificar código generado
5. **Refinar**: Ajustar manualmente si necesario

## Templates Disponibles

### Template 1: [Nombre]
```bash
generate-code --template template-1 --output=./output
```

**Características**:
- Propósito: [descripción]
- Personalizable: [opciones]

### Template 2: [Nombre]
```bash
generate-code --template template-2 --output=./output
```

**Características**:
- Propósito: [descripción]
- Personalizable: [opciones]

## Checklist

- [ ] Template seleccionado correctamente
- [ ] Parámetros configurados
- [ ] Output path especificado
- [ ] Generación ejecutada sin errores
- [ ] Código generado validado
- [ ] Customización aplicada

## Ejemplos

### ✅ Generación Básica

```bash
# Generar desde template
generate-code --template basic-component --output=./src/components

# Resultado:
# - src/components/Component.tsx ✓
# - src/components/Component.test.tsx ✓
# - src/components/index.ts ✓
```

### ✅ Generación con Customización

```bash
# Generar con opciones
generate-code --template api-endpoint \
  --output=./src/api \
  --name=UserController \
  --methods=get,post,put,delete \
  --auth-required

# Resultado:
# - src/api/UserController.ts ✓
# - Middleware auth integrado ✓
# - Routes configurados ✓
```

### ❌ Error de Generación

```bash
# Template no existe
generate-code --template invalid-template

# Error: Template 'invalid-template' not found
# Available templates: basic-component, api-endpoint, model
```

## Recursos

Ver `resources/` para:
- `templates.md`: [PLACEHOLDER: Catálogo de templates]
- `customization.md`: [PLACEHOLDER: Opciones de personalización]
- `integration.md`: [PLACEHOLDER: Integración con frameworks]
- `examples.md`: [PLACEHOLDER: Ejemplos de generación]
```

**Campos específicos**:
- `enforcement`: `suggest` (solo generators)
- `audience`: `engineers`
- `resources`: templates, customization, integration, examples
- `focus`: Generación y personalización

### Template Test

**Ubicación**: Base para skills en `skills/test/`

**Propósito**: Crear suites de testing y validación

**Estructura generada**:
```markdown
---
id: test-suite-name
version: 0.1.0
type: test
enforcement: require
summary: '[PLACEHOLDER: Descripción de la suite de testing]'
audience: [engineers, qa]
when_to_use: '[PLACEHOLDER: Cuándo ejecutar estos tests]'
provides: '[PLACEHOLDER: Qué valida y qué métricas entrega]'
resources:
  - resources/test-types.md
  - resources/setup.md
  - resources/execution.md
  - resources/analysis.md
scripts:
  - name: run-tests
    run: test-command --suite <name>
    note: Ejecuta suite de tests
  - name: generate-report
    run: test-command --report --format=html
    note: Genera reporte de resultados
limits: '[PLACEHOLDER: Prerequisites y limitaciones]'
---

## Objetivo

[PLACEHOLDER: Qué valida esta suite, qué calidad asegura]

## Tipos de Test

### Unit Tests
- **Propósito**: Validar funciones/métodos individuales
- **Ejecución**: Rápida, aislada
- **Cobertura**: ≥80% recomendada

### Integration Tests
- **Propósito**: Validar interacción entre componentes
- **Ejecución**: Moderada, requiere setup
- **Cobertura**: Paths críticos

### E2E Tests
- **Propósito**: Validar flujos completos
- **Ejecución**: Lenta, end-to-end
- **Cobertura**: User journeys críticos

## Procedimiento (resumen)

1. **Setup**: Configurar entorno de testing
2. **Ejecutar**: Correr tests por tipo
3. **Recolectar**: Métricas y resultados
4. **Analizar**: Identificar fallas y mejoras
5. **Reportar**: Generar reportes

## Checklist

- [ ] Entorno configurado correctamente
- [ ] Dependencies instaladas
- [ ] Tests unitarios pasando
- [ ] Tests integration pasando
- [ ] Tests E2E pasando (si aplica)
- [ ] Coverage ≥ umbral
- [ ] Reporte generado

## Ejemplos

### ✅ Test Exitoso

```bash
# Ejecutar suite
run-tests --suite api-validation

# Resultado:
# ✓ Unit tests: 45 passed
# ✓ Integration tests: 12 passed
# ✓ E2E tests: 8 passed
# Coverage: 87%
# Duration: 45s
```

### ❌ Test Fallando

```bash
# Error en test
run-tests --suite user-auth

# ❌ FAIL: user-auth.test.ts
# Expected: status 200
# Received: status 401
# Hint: Check JWT token expiration
```

## Recursos

Ver `resources/` para:
- `test-types.md`: [PLACEHOLDER: Tipos de testing]
- `setup.md`: [PLACEHOLDER: Configuración de entorno]
- `execution.md`: [PLACEHOLDER: Ejecución de tests]
- `analysis.md`: [PLACEHOLDER: Análisis de resultados]
```

**Campos específicos**:
- `enforcement`: `require` o `suggest`
- `audience`: `[engineers, qa]`
- `resources`: test-types, setup, execution, analysis
- `focus`: Testing y validación

## Placeholders y Reemplazos

### Placeholders en SKILL.md

| Placeholder | Reemplazo |
|-------------|-----------|
| `[PLACEHOLDER: Descripción concisa...]` | Resumen de 1-2 líneas |
| `[PLACEHOLDER: Contexto de aplicación]` | Cuándo usar el skill |
| `[PLACEHOLDER: Beneficios y capacidades]` | Qué entrega el skill |
| `[PLACEHOLDER: Restricciones y limitaciones]` | Limitaciones conocidas |
| `[PLACEHOLDER: Objetivo del guideline]` | Problema que resuelve |
| `[PLACEHOLDER: Metodología principal]` | Metodología del skill |
| `[PLACEHOLDER: Item 1-5]` | Items verificables |

### Placeholders en Resources

| Placeholder | Contenido |
|-------------|-----------|
| `[PLACEHOLDER: Conceptos fundamentales]` | Teoría y fundamentos |
| `[PLACEHOLDER: Procedimientos detallados]` | Pasos operativos |
| `[PLACEHOLDER: Casos de uso]` | Ejemplos reales |
| `[PLACEHOLDER: Problemas y soluciones]` | Troubleshooting |

### Placeholders en Ejemplos

| Placeholder | Contenido |
|-------------|-----------|
| `[PLACEHOLDER: Ejemplo correcto]` | Código ejecutable |
| `[PLACEHOLDER: Ejemplo incorrecto]` | Anti-patrón con explicación |
| `[PLACEHOLDER: Comando 1]` | Comando útil |
| `[PLACEHOLDER: Script-name]` | NPM script o comando |

## Validación de Template

### Schema de Validación

```json
{
  "template": {
    "category": "guideline|guardrail|workflow|generator|test",
    "structure": {
      "has_skill_md": true,
      "has_resources_dir": true,
      "resource_count": 4
    },
    "metadata": {
      "fields_complete": true,
      "format_valid": true,
      "conventions_followed": true
    }
  }
}
```

### Checklist de Validación

**Estructura**:
- [ ] SKILL.md creado
- [ ] resources/ directory existe
- [ ] 4 recursos .md en resources/
- [ ] Naming convention kebab-case

**Metadatos**:
- [ ] id en kebab-case
- [ ] version en semver (0.1.0)
- [ ] type según categoría
- [ ] enforcement compatible
- [ ] 11 campos obligatorios
- [ ] resources array = 4

**Contenido**:
- [ ] Placeholders reemplazados
- [ ] Secciones obligatorias
- [ ] Ejemplos de código
- [ ] Comandos scripts
- [ ] SKILL.md < 400 líneas

## Personalización de Templates

### Modificar Defaults

```yaml
# template-config.yaml
defaults:
  guideline:
    enforcement: suggest
    audience: engineers

  guardrail:
    enforcement: block
    audience: [engineers, qa]

  workflow:
    enforcement: require
    audience: [engineers, architects]

  generator:
    enforcement: suggest
    audience: engineers

  test:
    enforcement: require
    audience: [engineers, qa]
```

### Custom Fields

```yaml
# Añadir campos custom
custom_fields:
  - name: complexity
    type: enum
    values: [low, medium, high]
    default: medium

  - name: estimated_time
    type: string
    pattern: '\d+[hm]'
    default: '1h'
```

## Comandos Avanzados

### Batch Generation

```bash
# Generar múltiples skills
for category in guidelines guardrails; do
  for name in skill-a skill-b skill-c; do
    skills create-template "$category" "$name"
  done
done
```

### Template from Existing

```bash
# Generar template desde skill existente
skills create-template --from-existing ./skills/guidelines/my-skill \
  --output=./templates/custom-guideline
```

### Template Versioning

```bash
# Versionar template
skills create-template guidelines my-guideline --version=1.0

# El template se guarda con versión específica
# templates/guidelines-v1.0/
```

## Integración con CLI

### Comando skills create-template

```bash
# Sintaxis completa
skills create-template <category> <name> [options]

Options:
  --type <type>              Override tipo
  --enforcement <level>      Override enforcement
  --skill-only               Solo SKILL.md
  --resources-only           Solo recursos
  --validate                 Validar después
  --output <path>            Directorio custom
  --config <file>            Config file

Examples:
  skills create-template guidelines git-worktrees
  skills create-template guardrails secrets --enforcement block
  skills create-template test api --skill-only
```

## Best Practices

### ✅ Template Creation
- Usar placeholders descriptivos
- Documentar cada sección
- Incluir ejemplos ejecutables
- Validar automáticamente
- Versionar templates
- Permitir customización

### ❌ Avoid
- Placeholders ambiguos
- Estructura inconsistente
- Sin ejemplos de código
- Validación manual
- Templates sin versionar
- Personalización limitada

### Template Maintenance

```bash
# Actualizar template a nueva versión
skills update-template --version=2.0

# Migrar skills existentes
skills migrate-skills --from=v1.0 --to=v2.0

# Ver diferencias
skills diff-template v1.0 v2.0
```

---

**Estado**: Templates disponibles para todas las categorías
**Cumplimiento**: 100% estándares Skills Fabric
**Validación**: Automática en generación
