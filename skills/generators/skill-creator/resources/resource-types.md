# Resource Types - Tipos de Recursos y Patrones

## Overview de Recursos

Cada skill debe tener **exactamente 4 recursos** especializados. Estos recursos complementan el SKILL.md principal (máx 400 líneas) con contenido detallado y técnico.

## Tipos de Recursos por Categoría

### Guidelines Pattern (4 recursos estándar)

#### 1. conceptual.md (≈300-500 líneas)

**Propósito**: Fundamentos teóricos, metodología, conceptos base

**Cuándo usar**:
- Skill introduce nueva metodología
- Requiere teoría para entender práctica
- Conceptos complejos necesitan explicación
- Marco conceptual amplio

**Estructura típica**:
```markdown
# [Skill Name] - Conceptos Fundamentales

## 1. Conceptos Base
- Definición 1: descripción técnica
- Definición 2: descripción técnica
- Principio clave: explicación

## 2. Metodología
- Marco teórico: [nombre del framework]
- Fases: [lista de fases]
- Principios: [principios fundamentales]

## 3. Arquitectura
- Componente A: función y propósito
- Componente B: función y propósito
- Interacciones: cómo se conectan

## 4. Alternativas y Comparaciones
- Alternativa 1: vs [skill], pros/cons
- Alternativa 2: vs [método], pros/cons
- Criterios de decisión

## 5. Cuándo Aplicar
- Contexto A: explicación + ejemplo
- Contexto B: explicación + ejemplo
- Anti-patrón: cuándo NO usar

## 6. Beneficios y ROI
- Beneficio 1: cuantificado
- Beneficio 2: medible
- Impacto en calidad: métrica

## 7. Integración con Skills Fabric
- Hooks relacionados
- Otros skills complementarios
- Flujo de trabajo integrado
```

**Ejemplo**: `skills/guidelines/using-git-worktrees/resources/basic-commands.md`
- Enfoque: Comandos y sintaxis
- 400+ líneas de técnicas
- Ejemplos ejecutables

#### 2. procedural.md (≈300-500 líneas)

**Propósito**: Procedimientos operativos paso a paso, comandos detallados

**Cuándo usar**:
- Skill requiere procedimientos específicos
- Comandos complejos con múltiples flags
- Procesos multi-paso
- Setup y configuración detallada

**Estructura típica**:
```markdown
# [Skill Name] - Procedimientos Detallados

## Setup Inicial
```bash
# Configuración paso a paso
command 1 --flag value
command 2 --option

# Verificación
verify-command
```

### Prerequisites
- [ ] Requisito 1 instalado
- [ ] Requisito 2 configurado
- [ ] Permisos correctos

## Procedimiento Principal

### Paso 1: [Nombre del Paso]

#### Detalle 1.1
```bash
# Comando específico con explicación
command --option value

# Explicación del resultado
# Output esperado: ...
```

#### Detalle 1.2
```bash
# Segundo comando
command-2

# Verificación
verify-state
```

### Paso 2: [Nombre del Paso]
- [ ] Item verificable 1
- [ ] Item verificable 2
- [ ] Item verificable 3

#### Sub-paso 2.1
```bash
# Implementación
implementation-command
```

#### Sub-paso 2.2
```bash
# Validación
validation-command
```

## Procedimientos Avanzados

### Técnica 1: [Nombre de Técnica]

#### Aplicación
- [ ] Paso A: description
- [ ] Paso B: description
- [ ] Paso C: description

#### Comando
```bash
# Comando completo
complex-command \
  --flag1 value1 \
  --flag2 value2

# Resultado esperado
# Output: ...
```

### Técnica 2: [Nombre de Técnica]
[Same structure...]

## Workflows Integrados

### Workflow A: [Nombre]
- [ ] Fase 1: setup
- [ ] Fase 2: execution
- [ ] Fase 3: validation

### Workflow B: [Nombre]
[Same structure...]

## Comandos de Verificación

```bash
# Verificar estado
verify-command

# Diagnosticar problemas
diagnose-command

# Validar resultado
validate-command
```

## Troubleshooting Rápido

### Problema Común 1
```bash
# Solución inmediata
quick-fix-command
```

### Problema Común 2
```bash
# Solución inmediata
quick-fix-command
```
```

**Ejemplo**: `skills/guidelines/systematic-debugging/resources/methodical-procedures.md`
- Enfoque: Procedimientos de debugging
- Marcos de trabajo específicos
- Checklists operativas

#### 3. examples.md (≈300-500 líneas)

**Propósito**: Casos de uso reales, ejemplos de código, antes/después

**Cuándo usar**:
- Skill requiere ejemplos múltiples
- Casos de uso diversos
- Código ejecutable
- Comparaciones antes/después

**Estructura típica**:
```markdown
# [Skill Name] - Ejemplos Prácticos

## Ejemplo 1: [Contexto Específico]

### Descripción
[Contexto del ejemplo - qué se quiere lograr]

### Situación Inicial
```typescript
// Código antes - problemática
const badCode = () => {
  // Problema 1
  // Problema 2
};
```

### Aplicación del Skill
```typescript
// Código aplicando skill
const goodCode = () => {
  // Solución 1
  // Solución 2
};
```

### Resultado
```
Output esperado
```

### Explicación
[Por qué funciona, beneficios, métricas]

---

## Ejemplo 2: [Contexto Diferente]

[Same structure...]

## Casos Reales (Industria)

### Caso 1: [Empresa/Proyecto]
- **Contexto**: Descripción del proyecto
- **Problema**: Situación inicial
- **Solución**: Aplicación del skill
- **Resultado**: Métricas, beneficios
- **Lecciones**: Qué funcionó, qué no

### Caso 2: [Empresa/Proyecto]
[Same structure...]

## Comparativas

### vs Alternativa 1
| Aspecto | Skill | Alternativa |
|---------|-------|-------------|
| Aspecto 1 | Mejor | Peor |
| Aspecto 2 | Mejor | Peor |
| Aspecto 3 | Mejor | Peor |

### vs Alternativa 2
[Same table...]

## Anti-patrones

### ❌ Mal Práctica 1
```typescript
// Código problemático
const bad = () => {
  // Problema: razón específica
  // Consecuencia: impacto
};
```

**Por qué es malo**:
- Razón 1
- Razón 2

### ❌ Mal Práctica 2
[Same structure...]

## Scripts y Automatización

### Script 1: [Nombre]
```bash
#!/bin/bash
# Descripción del script

# Implementación
command 1
command 2

# Resultado
echo "Done"
```

### Script 2: [Nombre]
[Same structure...]
```

**Ejemplo**: `skills/guidelines/test-driven-development/resources/examples.md`
- Enfoque: Ejemplos RED-GREEN-REFACTOR
- Código antes/después
- Casos reales de implementación

#### 4. troubleshooting.md (≈300-500 líneas)

**Propósito**: Problemas comunes, soluciones, debugging

**Cuándo usar**:
- Skill puede generar errores
- Configuración compleja
- Debugging necesario
- Casos edge

**Estructura típica**:
```markdown
# [Skill Name] - Troubleshooting

## Problemas Comunes

### Problema 1: [Descripción del Error]

**Síntomas**:
- Indicador 1: descripción
- Indicador 2: descripción
- Log/Output: ```error message```

**Causa Raíz**:
[Explicación técnica de por qué ocurre]

**Solución**:
```bash
# Paso 1: Diagnóstico
diagnose-command

# Paso 2: Fix
fix-command --option value

# Paso 3: Verificación
verify-command
```

**Prevención**:
- Técnica 1: cómo evitar
- Técnica 2: configuración recomendada
- Best practice: enfoque preventivo

---

### Problema 2: [Descripción del Error]

[Same structure...]

## Debugging Profundo

### Herramientas de Debug
- **Herramienta 1**: Uso y ejemplos
- **Herramienta 2**: Uso y ejemplos
- **Herramienta 3**: Uso y ejemplos

### Comandos de Diagnóstico
```bash
# Verificar estado
debug-command --verbose

# Inspección detallada
inspect-command

# Logs relevantes
log-command --level debug
```

## Casos Edge

### Edge Case 1: [Descripción]
- **Condición**: cuándo ocurre
- **Síntoma**: qué se ve
- **Solución**: cómo resolver

### Edge Case 2: [Descripción]
[Same structure...]

## Recuperación de Errores

### Estrategia 1: Rollback
```bash
# Identificar punto de rollback
git log --oneline

# Rollback
git reset --hard <commit>

# Verificar estado
verify-command
```

### Estrategia 2: Recovery
```bash
# Backup actual
cp -r current/ backup/

# Recovery procedure
recovery-command

# Validar recuperación
validate-command
```

## Scripts de Diagnóstico

### Script: Health Check
```bash
#!/bin/bash
# Verificación completa del skill

echo "=== Health Check ==="
check-1
check-2
check-3

if [ $? -eq 0 ]; then
  echo "✅ All checks passed"
else
  echo "❌ Some checks failed"
  exit 1
fi
```

## FAQ

### P: [Pregunta Frecuente]
**R**: [Respuesta detallada con ejemplo]

### P: [Pregunta Frecuente]
**R**: [Respuesta detallada con ejemplo]
```

**Ejemplo**: `skills/guidelines/using-git-worktrees/resources/troubleshooting.md`
- Enfoque: Problemas específicos de Git worktrees
- 400+ líneas de casos reales
- Scripts de recuperación

---

## Generators Pattern (4 recursos especializados)

Para skills tipo `generator`, usar:

### 1. templates.md
Templates reutilizables, patrones de código, scaffolds

### 2. customization.md
Configuración, personalización, opciones avanzadas

### 3. integration.md
Integración con otros sistemas, APIs, frameworks

### 4. examples.md
Ejemplos de generación, casos de uso completos

---

## Test Pattern (4 recursos especializados)

Para skills tipo `test`, usar:

### 1. test-types.md
Tipos de testing (unit, integration, e2e, performance)

### 2. setup.md
Configuración de entorno, herramientas, dependencias

### 3. execution.md
Ejecución de tests, comandos, CI/CD integration

### 4. analysis.md
Análisis de resultados, métricas, reporting

---

## Guardrails Pattern (4 recursos especializados)

Para skills tipo `guardrail`, usar:

### 1. enforcement-levels.md
Explicación de levels (suggest/warn/block/require)

### 2. common-patterns.md
Patrones peligrosos, patrones seguros

### 3. risk-mitigation.md
Cómo mitigar riesgos, mejores prácticas

### 4. examples.md
Casos de enforcement, antes/después

---

## Workflow Pattern (4 recursos especializados)

Para skills tipo `workflow`, usar:

### 1. setup.md
Configuración inicial, prerequisites

### 2. execution.md
Ejecución paso a paso del workflow

### 3. automation.md
Automatización, scripts, CI/CD

### 4. monitoring.md
Métricas, KPIs, seguimiento

---

## Reglas de Contenido

### ✅ Incluir
- Ejemplos de código ejecutables
- Comandos reales y probados
- Casos de uso específicos
- Troubleshooting detallado
- Métricas cuantificables

### ❌ No Incluir
- Conceptos genéricos sin ejemplo
- Comandos no probados
- Teoría sin aplicación
- Referencias vagas
- Contenido duplicado entre recursos

### Balance por Recurso
- **Conceptual**: 60% teoría, 40% práctica
- **Procedural**: 20% contexto, 80% pasos
- **Examples**: 10% contexto, 80% código, 10% explicación
- **Troubleshooting**: 10% contexto, 80% soluciones, 10% prevención

---

## Validación de Recursos

### Checklist por Recurso
- [ ] 300-500 líneas
- [ ] Ejemplos de código (mín 5 por resource)
- [ ] Comandos ejecutables
- [ ] Estructura de secciones seguida
- [ ] No duplica contenido de otros resources
- [ ] Complementa SKILL.md principal
- [ ] Naming convention respetado

### Comandos de Verificación
```bash
# Contar líneas por resource
wc -l resources/*.md

# Verificar ejemplos de código
grep -c "```" resources/*.md

# Verificar estructura
grep -q "## " resources/*.md

# Verificar comandos
grep -c "^```bash" resources/*.md
```

---

## Template de Resource

```markdown
# [Skill Name] - [Tipo de Resource]

## [Sección Principal]
[Contenido específico del tipo]

### [Subsección]
[Contenido detallado]

```bash
# Comando ejemplo
example-command --flag value
```

## [Segunda Sección]
[Contenido...]

## [Tercera Sección]
[Contenido...]

---

## [Sección Avanzada]
[Para casos específicos]

## Troubleshooting Rápido
- [ ] Problema: Solución
- [ ] Problema: Solución

## Recursos Relacionados
- [Resource 1]: Descripción
- [Resource 2]: Descripción
- [SKILL.md]: Overview completo
```

---

**Regla de Oro**: Cada resource debe ser **independiente** pero **complementario**. Un desarrollador debe poder usar solo un resource para resolver un problema específico.
