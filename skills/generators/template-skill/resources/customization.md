# Template Skill - Personalización

## Overview de Customización

Los templates base requieren **personalización manual** para cumplir casos específicos. Esta guía cubre cómo adaptar templates a necesidades concretas.

## Niveles de Personalización

### Nivel 1: Campos Básicos (Obligatorio)

**Metadatos que SIEMPRE deben personalizarse**:

```yaml
---
id: my-custom-skill              # ✅ Reemplazar con nombre real
summary: 'Descripción específica'  # ✅ No usar placeholder
audience: engineers              # ✅ Ajustar según uso
when_to_use: 'Contexto real'     # ✅ Especificar cuándo aplicar
provides: 'Beneficios concretos' # ✅ Listar beneficios reales
limits: 'Limitaciones reales'    # ✅ Documentar restricciones
---
```

**Checklist Mínimo**:
- [ ] `id` único y descriptivo
- [ ] `summary` < 200 caracteres
- [ ] `when_to_use` específico
- [ ] `provides` con beneficios reales
- [ ] `limits` con restricciones conocidas

### Nivel 2: Contenido Estructural (Recomendado)

**Secciones que requieren personalización**:

```markdown
## Objetivo
# ❌ NO dejar placeholder
# ✅ REEMPLAZAR con:
Problema específico que resuelve este skill para el equipo de desarrollo.

## Procedimiento (resumen)
# ❌ NO dejar placeholders de metodología
# ✅ ESPECIFICAR pasos reales

1. **Setup**: Configurar X según Y
2. **Execute**: Correr comando Z
3. **Validate**: Verificar resultado W

## Checklist
# ❌ NO usar items genéricos
# ✅ CREAR checklist específico

- [ ] Herramienta X instalada
- [ ] Configuración Y aplicada
- [ ] Permisos Z verificados
- [ ] Test inicial passing
```

### Nivel 3: Recursos Especializados (Crítico)

**Cada resource debe ser único**:

```markdown
# resources/conceptual.md
# ❌ NO usar placeholder
# ✅ ESCRIBIR contenido original (300-500 líneas)
```

## Customización por Categoría

### Guideline - Customización Específica

**Metodología Propia**:
```yaml
# guideline template → customizar
enforcement: suggest|warn
summary: '[Mi guideline específico]'
when_to_use: 'Al desarrollar [X], implementar [Y], o trabajar en [Z]'
provides: '[Beneficio A], [Beneficio B], [Beneficio C]'
```

**Procedimiento Específico**:
```markdown
## Procedimiento (resumen)

### Mi Metodología Específica

1. **Fase 1 - Preparación**:
   - [ ] Step A específico
   - [ ] Step B específico
   - [ ] Verificación: command-to-check

2. **Fase 2 - Ejecución**:
   - [ ] Step C específico
   - [ ] Step D específico
   - [ ] Verificación: command-to-check

3. **Fase 3 - Validación**:
   - [ ] Confirmación resultado
   - [ ] Documentación learnings
```

**Ejemplos Reales**:
```markdown
## Ejemplos

### ✅ Correcto - Mi Caso de Uso Real

```typescript
// Ejemplo específico de mi contexto
const config = {
  framework: 'React',
  version: '18.x',
  approach: 'functional-components'
};

// Aplicación específica
result = implementMyGuideline(config);
```

### ❌ Incorrecto - Anti-patrón en Mi Contexto

```typescript
// Problema específico de mi stack
const badConfig = {
  approach: 'class-components-deprecated' // Problema específico
};
```

### ✅ Otro Ejemplo - Caso Edge

```typescript
// Manejo de edge case específico
if (scenario === 'production-with-cors') {
  implementSpecificHandling();
}
```

### ❌ Otro Anti-patrón

```typescript
// Error común en mi equipo
const commonMistake = 'hardcoded-values'; // Problema: explicación
```

**Scripts Personalizados**:
```yaml
scripts:
  - name: setup-my-tool
    run: npm install my-specific-tool
    note: Instala herramienta específica para este guideline

  - name: validate-my-setup
    run: my-tool validate-config
    note: Valida configuración según mi estándar

  - name: execute-my-workflow
    run: my-tool execute --config=my-config.yml
    note: Ejecuta workflow específico

  - name: check-my-metrics
    run: my-tool metrics --format=json
    note: Recolecta métricas específicas
```

### Guardrail - Customización Específica

**Patrón Peligroso Propio**:
```yaml
summary: 'Previene [mi patrón peligroso específico] en [mi contexto]'
when_to_use: 'Antes de [acción específica], durante [proceso específico]'
provides: 'Detección de [patrón], validación de [compliance], reporte de [riesgo]'
```

**Enforcement Level**:
```markdown
## Enforcement Levels

### Mi Nivel Específico

#### SUGGEST (Recomendado)
- **Cuándo usar**: [mi caso específico]
- **Comportamiento**: Hint con sugerencia
- **Ejemplo**: [mi ejemplo]

#### WARN (Con Justificación)
- **Cuándo usar**: [mi caso de riesgo]
- **Comportamiento**: Warning + justificación requerida
- **Ejemplo**: [mi ejemplo]

#### BLOCK (Bloqueante)
- **Cuándo usar**: [mi caso crítico]
- **Comportamiento**: Fail + mensaje descriptivo
- **Ejemplo**: [mi ejemplo]

#### REQUIRE (Obligatorio)
- **Cuándo usar**: [mi compliance obligatorio]
- **Comportamiento**: Check obligatorio
- **Ejemplo**: [mi ejemplo]
```

**Patrones Peligrosos Reales**:
```markdown
## Patrones Peligrosos

### ❌ MI Patrón Específico 1

```typescript
// Código que viola MI regla
const dangerous = 'mi-patron-peligroso'; // PROBLEMA: [mi explicación]
```

**Por qué es peligroso**:
- Riesgo específico 1
- Riesgo específico 2
- Impacto en mi contexto

**Detección**:
```bash
# Comando para detectar mi patrón
scan-pattern --pattern 'mi-patron-.*'

# Output esperado:
# ❌ Pattern detected in file.ts:45
# Risk level: HIGH
# Recommendation: [mi recomendación]
```

### ✅ MI Patrón Seguro 1

```typescript
// Código que cumple MI regla
const safe = 'mi-implementacion-segura'; // Seguro: [mi explicación]
```

### ❌ MI Patrón Específico 2

[Same structure...]

### ✅ MI Patrón Seguro 2

[Same structure...]
```

### Workflow - Customización Específica

**CLOOP Personalizado**:
```markdown
## CLOOP: Mi Implementación

### Clarify - Mi Objetivo
- **Specific**: [mi tarea específica]
- **Measurable**: [mi métrica de éxito]
- **Achievable**: [mi factibilidad]
- **Relevant**: [mi relevancia]
- **Time-bound**: [mi timeline]

### Layout - Mi Arquitectura
[Mi diseño específico]

### Operate - Mi Ejecución
**Fase 1: Mi Fase Específica**
- [ ] Paso 1.1: [mi acción específica]
- [ ] Paso 1.2: [mi acción específica]

**Fase 2: Mi Segunda Fase**
- [ ] Paso 2.1: [mi acción específica]

### Observe - Mi Observación
**Mi Métrica 1**: [umbral específico]
**Mi Métrica 2**: [umbral específico]

### Reflect - Mi Reflexión
**Mi Aprendizaje 1**: [lección específica]
**Mi Aprendizaje 2**: [mejora identificada]
```

### Generator - Customización Específica

**Templates Propios**:
```markdown
## Mis Templates

### Template: Mi Generador Específico

```bash
# Comando específico
mi-generador --template=mi-template \
  --output=./mi-output \
  --config=mi-config.yml
```

**Características específicas**:
- Propósito: [mi propósito]
- Personalizable: [mis opciones]
- Output: [mi estructura]
```

### Personalización Avanzada

```bash
# Template con configuración avanzada
mi-generador \
  --template=mi-template \
  --output=./mi-output \
  --option-1=value1 \
  --option-2=value2 \
  --custom-field=mi-valor \
  --override-default=true
```

### Test - Customización Específica

**Tipos de Test Específicos**:
```markdown
## Mis Tipos de Test

### Unit Test - Mi Caso
- **Propósito**: Validar [mi función específica]
- **Framework**: [mi framework]
- **Cobertura**: [mi umbral]

### Integration Test - Mi Caso
- **Propósito**: Validar [mi integración específica]
- **Setup**: [mi configuración]
- **Validación**: [mi criterio]

### E2E Test - Mi Caso
- **Propósito**: Validar [mi flujo específico]
- **Browser**: [mi browser]
- **Escenario**: [mi escenario]
```

## Proceso de Customización

### Step-by-Step Guide

#### Step 1: Analizar Placeholders
```bash
# Encontrar todos los placeholders
grep -r 'PLACEHOLDER' skills/guidelines/my-guideline/

# Output:
# resources/conceptual.md:15: [PLACEHOLDER: Conceptos fundamentales]
# resources/conceptual.md:23: [PLACEHOLDER: Metodología]
# SKILL.md:8: [PLACEHOLDER: Descripción]
```

#### Step 2: Crear Content Map
```markdown
# Content-Map.md

## Placeholders a Reemplazar

### SKILL.md
- [ ] `[PLACEHOLDER: Descripción concisa...]` → Mi descripción específica
- [ ] `[PLACEHOLDER: Contexto de aplicación]` → Mi contexto real
- [ ] `[PLACEHOLDER: Beneficios y capacidades]` → Mis beneficios reales
- [ ] `[PLACEHOLDER: Restricciones y limitaciones]` → Mis limitaciones

### resources/conceptual.md
- [ ] `[PLACEHOLDER: Conceptos fundamentales]` → Mis conceptos
- [ ] `[PLACEHOLDER: Metodología]` → Mi metodología

### resources/procedural.md
- [ ] `[PLACEHOLDER: Procedimientos detallados]` → Mis procedimientos

[... continues]
```

#### Step 3: Escribir Contenido Original

**Guía de Escritura**:
1. **Ser específico**: Usar ejemplos reales de tu contexto
2. **Ser práctico**: Comandos que realmente funcionan
3. **Ser verificable**: Tests que realmente pasan
4. **Ser útil**: Información que realmente ayuda

#### Step 4: Validar Customización

```bash
# Validar que no quedan placeholders
grep -r 'PLACEHOLDER' skills/guidelines/my-guideline/
# Debe devolver: nothing

# Validar estructura
skills validate-template ./skills/guidelines/my-guideline

# Validar contenido
skills-cli skills lint ./skills/guidelines/my-guideline --strict
```

## Customización Avanzada

### Añadir Secciones Custom

```markdown
## Sección Personalizada - Mi Añadido

[Contenido específico que agregué]

### Subsección Personalizada

[Más contenido específico]
```

### Añadir Scripts Custom

```yaml
scripts:
  - name: my-custom-script
    run: my-command --specific-flag
    note: Mi script personalizado para mi caso específico
```

### Añadir Recursos Custom

```markdown
# resources/my-custom-resource.md

# Mi Recurso Adicional

[Contenido específico]
```

## Herramientas de Customización

### Customization Script

```bash
#!/bin/bash
# customize-skill.sh

SKILL_PATH="$1"
PLACEHOLDER_MAP="$2"

echo "Customizing skill: $SKILL_PATH"

# Reemplazar placeholders según map
while IFS= read -r line; do
  placeholder=$(echo "$line" | cut -d: -f1)
  replacement=$(echo "$line" | cut -d: -f2-)

  find "$SKILL_PATH" -name "*.md" -type f -exec \
    sed -i.bak "s|$placeholder|$replacement|g" {} \;
done < "$PLACEHOLDER_MAP"

# Limpiar backups
find "$SKILL_PATH" -name "*.bak" -delete

echo "✅ Customization complete"
```

### Content Generator

```bash
# Generar contenido personalizado
skills generate-content \
  --template=guideline \
  --context=mi-contexto-específico \
  --output=./mi-skill-customizado
```

## Checklist de Customización

### Metadatos
- [ ] `id` único y descriptivo
- [ ] `summary` específico (<200 chars)
- [ ] `audience` correcto
- [ ] `when_to_use` específico
- [ ] `provides` con beneficios reales
- [ ] `resources` 4 archivos correctos
- [ ] `scripts` con comandos útiles
- [ ] `limits` con restricciones reales

### Contenido
- [ ] NO placeholders restantes
- [ ] Contenido original escrito
- [ ] Ejemplos de código específicos
- [ ] Comandos ejecutables
- [ ] Procedimientos paso a paso
- [ ] Troubleshooting específico

### Estructura
- [ ] Secciones obligatorias presentes
- [ ] SKILL.md < 400 líneas
- [ ] resources/ 4 archivos
- [ ] Naming convention respetado
- [ ] YAML válido

### Validación
- [ ] skills-cli validation pass
- [ ] Linting pass
- [ ] Comandos script funcionan
- [ ] Ejemplos de código probados
- [ ] Enlaces internos válidos

## Common Mistakes

### ❌ No Personalizar Placeholders
```yaml
summary: '[PLACEHOLDER: Descripción concisa...]'
# PROBLEMA: Dejar placeholders sin reemplazar
```

### ❌ Contenido Genérico
```markdown
# Contenido muy genérico
Este skill es muy útil para desarrollar.
Es una buena práctica que deberías seguir.
# PROBLEMA: No es específico ni útil
```

### ❌ Ejemplos Inventados
```typescript
// Ejemplo que no funciona realmente
const result = fakeFunction(); // Función inexistente
```

### ❌ No Probar Scripts
```yaml
scripts:
  - name: test-command
    run: nonexistent-command --flag  # Comando que no existe
    note: Description
```

## Mejores Prácticas

### ✅ Do's

1. **Ser Específico**
   ```markdown
   # ✅ Bueno
   Al usar TypeScript con React 18 y Vite
   ```

2. **Incluir Ejemplos Reales**
   ```typescript
   // ✅ Bueno - Código que funciona
   import { useState } from 'react';
   ```

3. **Comandos Verificados**
   ```bash
   # ✅ Bueno - Comando probado
   npm run build -- --mode production
   ```

4. **Documentar Decisiones**
   ```markdown
   **Decisión**: Usar enfoque X porque...
   **Alternativa considerada**: Enfoque Y (rechazado porque...)
   ```

### ❌ Don'ts

1. **No Dejar Placeholders**
   ```markdown
   # ❌ Malo
   [PLACEHOLDER: Escribir contenido aquí]
   ```

2. **No Usar Ejemplos Genéricos**
   ```markdown
   # ❌ Malo
   const x = doSomething();
   ```

3. **No Referenciar Comandos Inexistentes**
   ```bash
   # ❌ Malo
   my-fake-command --flag
   ```

4. **No Copiar Sin Personalizar**
   ```markdown
   # ❌ Malo
   # Copiado textualmente de otro skill
   ```

## Validación Final

### Pre-commit Checklist

Antes de commitear tu skill customizado:

```bash
# Check 1: No placeholders
grep -r 'PLACEHOLDER' ./skills/guidelines/my-skill/ && echo "❌ Found placeholders" || echo "✅ No placeholders"

# Check 2: YAML válido
python3 -c "import yaml; yaml.safe_load(open('./skills/guidelines/my-skill/SKILL.md'))" && echo "✅ YAML valid" || echo "❌ YAML invalid"

# Check 3: Estructura completa
[ -f "./skills/guidelines/my-skill/SKILL.md" ] && echo "✅ SKILL.md exists" || echo "❌ Missing SKILL.md"
[ -d "./skills/guidelines/my-skill/resources" ] && echo "✅ resources/ exists" || echo "❌ Missing resources/"
[ $(find "./skills/guidelines/my-skill/resources" -name "*.md" | wc -l) -eq 4 ] && echo "✅ 4 resources" || echo "❌ Wrong resource count"

# Check 4: skills-cli validation
skills-cli skills validate ./skills/guidelines/my-skill && echo "✅ CLI validation passed" || echo "❌ CLI validation failed"
```

### Post-customization Report

```markdown
# Customization Report: my-skill

## Changes Made
- ✅ Placeholders replaced: 15
- ✅ Custom content added: ~2000 lines
- ✅ Examples created: 20+
- ✅ Scripts validated: 3
- ✅ Resources completed: 4

## Validation Results
- ✅ YAML: Valid
- ✅ Structure: Compliant
- ✅ Linting: Pass
- ✅ CLI: Pass
- ✅ Scripts: Tested

## Quality Metrics
- SKILL.md: 185 lines (within limit)
- resources/: 4 files × ~350 lines each
- Examples: 15 correct, 5 incorrect
- Scripts: 3 tested and working

## Status: READY ✅
```

---

**Conclusión**: La personalización es **CRÍTICA** para la calidad del skill. No uses templates sin customizar completamente.
