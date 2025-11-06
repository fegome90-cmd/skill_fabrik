# Skill Specification: ADR Creation Workflow

## YAML Frontmatter

```yaml
---
id: adr-creation-workflow
version: 0.1.0
type: workflow
summary: Workflow estructurado para crear ADRs siguiendo protocolo unificado con validación automática
audience: engineers, architects, decision-makers
when_to_use: Cuando necesites documentar una decisión arquitectónica importante siguiendo el protocolo ADR unificado (ADR-085). Usa cuando la decisión afecta arquitectura, integración de sistemas, o patrones técnicos del proyecto.
provides: Template estandarizado, validación automática, nomenclatura consistente, lifecycle management
resources:
  - resources/adr-template.md
  - resources/examples.md
  - resources/validation-rules.md
  - resources/naming-conventions.md
scripts:
  - name: create-adr
    run: scripts/create-adr.mjs <title>
    note: Crea nuevo ADR desde template con metadata automático
  - name: validate-adr
    run: scripts/validate-adr.mjs docs/adr/ADR-XXX-title.md
    note: Valida formato y estructura de ADR
limits: Genera estructura básica; requiere completar Context, Decision, y Consequences manualmente. No automatiza decisiones técnicas complejas.
---
```

## Objective

**Cuándo usar**: Al documentar decisiones arquitectónicas críticas que afectan la arquitectura del sistema, integración entre componentes, o patrones técnicos importantes.

**Cuándo NO usar**: Para decisiones triviales (<15 minutos de implementación), documentación de features específicas, o bugs rutinarios.

**Qué problema resuelve**: Inconsistencia en formato ADR, falta de validación automática, nomenclatura no estándar que dificulta búsqueda y mantenimiento.

## Problem Statement

Los proyectos con múltiples ADRs enfrentan problemas de:
- Formato inconsistente (66% sin status definido según ADR-085)
- Nomenclatura no estándar (ADR-XXX vs 000-name.md)
- Falta de metadata estructurado (YAML frontmatter)
- Status lifecycle no definido (Proposed → Accepted → ...)
- Validación manual propensa a errores

## Source ADRs

- **ADR-085**: Unified ADR Protocol (base del protocolo)
- Related: ADR-016 (ACE Pipeline), ADR-089 (ADR consultation)

## Procedimiento

### 1. Iniciar Creación de ADR

```bash
# Opción A: Script automatizado
node scripts/create-adr.mjs "integration-strategy"

# Opción B: Desde template
cp templates/adr-template.md docs/adr/ADR-090-integration-strategy.md
```

### 2. Completar YAML Frontmatter

Editar frontmatter con metadata correcta:

```yaml
---
id: ADR-090
title: "Integration Strategy"
status: Proposed
date_proposed: 2025-10-29
author: "Developer Name"
reviewers: ["Reviewer 1", "Reviewer 2"]
tags: ["integration", "architecture", "apis"]
phase: clarify
related_adrs: ["ADR-085", "ADR-016"]
chroma_indexed: false
memtech_layer: L3
---
```

### 3. Escribir Secciones Obligatorias

#### Context (mínimo 100 palabras)
- Problema identificado
- Estado actual
- Drivers de decisión

#### Decision (mínimo 50 palabras)
- Decisión clara y concisa
- Alternativas consideradas
- Rationale

#### Consequences (mínimo 50 palabras)
- Positivas
- Negativas
- Riesgos

### 4. Validar ADR

```bash
# Validar formato
node scripts/validate-adr.mjs docs/adr/ADR-090-integration-strategy.md

# Debería pasar:
# ✅ YAML frontmatter válido
# ✅ Secciones obligatorias presentes
# ✅ Longitud mínima cumplida
# ✅ Nomenclatura correcta
```

### 5. Commit y Revisión

```bash
git add docs/adr/ADR-090-integration-strategy.md
git commit -m "docs(adr): Add ADR-090 integration strategy [Proposed]"

# Crear PR para revisión
```

### 6. Actualizar Status

Una vez aprobado, actualizar status en frontmatter:

```yaml
status: Accepted
date_accepted: 2025-10-30
```

Y actualizar en memoria/catalogo si aplica.

## Checklist

- [ ] ADR creado con nomenclatura correcta: `ADR-{NUMBER}-{kebab-case-title}.md`
- [ ] YAML frontmatter completo con campos requeridos
- [ ] Status definido (Proposed/Accepted/Deprecated/Superseded)
- [ ] Sección Context presente (≥100 palabras)
- [ ] Sección Decision presente (≥50 palabras)
- [ ] Sección Consequences presente (≥50 palabras)
- [ ] Validación automática passing
- [ ] Tags asignados (3-5 tags relevantes)
- [ ] Related ADRs enlazados si aplica
- [ ] PR creado para revisión
- [ ] Status actualizado post-aprobación

## Scripts Reales

### 1. Create ADR Script

**Ubicación**: `scripts/create-adr.mjs`

```javascript
#!/usr/bin/env node
import fs from 'fs-extra';
import path from 'path';

const title = process.argv[2];
const nextNumber = getNextADRNumber();
const slug = title.toLowerCase().replace(/\s+/g, '-');
const filename = `ADR-${nextNumber}-${slug}.md`;

// Generate frontmatter
const frontmatter = generateFrontmatter(nextNumber, title);

// Copy template
const template = await fs.readFile('templates/adr-template.md', 'utf-8');
const content = template.replace('${FRONTMATTER}', frontmatter);

// Write file
await fs.writeFile(`docs/adr/${filename}`, content);
console.log(`✅ Created: docs/adr/${filename}`);
```

### 2. Validate ADR Script

**Ubicación**: `scripts/validate-adr.mjs`

```javascript
#!/usr/bin/env node
import fs from 'fs-extra';
import yaml from 'yaml';

const filePath = process.argv[2];
const content = await fs.readFile(filePath, 'utf-8');

// Parse frontmatter
const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
if (!frontmatterMatch) {
  throw new Error('Missing YAML frontmatter');
}

const metadata = yaml.parse(frontmatterMatch[1]);

// Validate required fields
validateRequired(metadata, ['id', 'title', 'status', 'date_proposed', 'author']);

// Validate sections
validateSections(content);

console.log('✅ ADR validation passed');
```

## Examples

### ✅ Correcto

```yaml
---
id: ADR-090
title: "Integration Strategy with External API"
status: Proposed
date_proposed: 2025-10-29
author: "Jane Doe"
reviewers: ["John Smith"]
tags: ["integration", "api", "architecture"]
related_adrs: ["ADR-085"]
---

## Context

[150+ words describing problem, current state, and drivers]

## Decision

[50+ words with clear decision, alternatives, and rationale]

## Consequences

### Positive
- Benefit 1
- Benefit 2

### Negative
- Trade-off 1
- Trade-off 2
```

### ❌ Incorrecto

```yaml
# Sin YAML frontmatter ❌
# Nomenclatura incorrecta: 90-integration.md ❌
# Sin status definido ❌
# Secciones faltantes ❌

## Contexto

[Muy breve, <50 palabras] ❌
```

## Trigger Rules

### Keywords
```json
"keywords": [
  "adr", "architecture decision", "decision record",
  "documents decision", "documentación decisión",
  "arquitectura", "design decision"
]
```

### Intent Patterns
```json
"intentPatterns": [
  "(crear|create|write|generar).*adr",
  "(documentar|document).*decision.*arquitectura",
  "(nuevo|new).*adr"
]
```

### File Triggers
```json
"pathPatterns": [
  "docs/adr/**/*.md",
  "**/ADR-*.md"
]
```

### Content Patterns
```json
"contentPatterns": [
  "^ADR-\\d{3}-.*\\.md$",  # Nomenclatura correcta
  "^---[\\s\\S]*?status:",  # Con YAML frontmatter
  "## Context"  # Sección Context presente
]
```

## Resources to Create

1. **adr-template.md**: Template completo con todos los campos y secciones
2. **examples.md**: Ejemplos de ADRs completos (Accepted, Proposed, Superseded)
3. **validation-rules.md**: Reglas de validación detalladas
4. **naming-conventions.md**: Convenciones de nomenclatura y tags

## Integration with Existing Skills

- **unified-documentation-standards**: Usa este skill para estándares generales
- **adr-consultation-protocol**: Consultar ADRs existentes antes de crear
- **adr-validation-gates**: Valida ADRs creados

## Success Metrics

- ADRs creados siguiendo protocolo: ≥95%
- Tiempo de creación: ≤15 minutos
- Validación automática passing: 100%
- Satisfacción del desarrollador: ≥8/10

---

**Last Updated**: 2025-10-29  
**Spec Version**: 0.1.0

