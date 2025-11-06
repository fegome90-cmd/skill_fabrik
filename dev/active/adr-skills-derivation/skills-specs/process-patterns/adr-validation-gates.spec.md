# Skill Specification: ADR Validation Gates

## YAML Frontmatter

```yaml
---
id: adr-validation-gates
version: 0.1.0
type: guardrail
enforcement: block
summary: Gates de validación automática que bloquean ADRs incompletos o no conformes con protocolo unificado (ADR-085)
audience: engineers, architects, ci-cd systems
when_to_use: Automáticamente en CI/CD para todo PR que incluye o modifica ADRs. Ejecutar manualmente antes de commit con scripts.
provides: Validación automática de formato, estructura, nomenclatura, secciones obligatorias, status lifecycle, metadata
resources:
  - resources/validation-script.mjs
  - resources/error-messages.md
  - resources/ci-integration.yml
scripts:
  - name: validate-adr
    run: node scripts/validate-adr.mjs <file-path>
    note: Valida ADR contra protocolo unificado
  - name: validate-all-adrs
    run: node scripts/validate-all-adrs.mjs docs/adr/
    note: Valida todos los ADRs en directorio
limits: Solo valida formato y estructura; no valida calidad técnica de decisiones ni contenido semántico. Requiere ADRs en protocolo unificado.
---
```

## Objective

**Cuándo usar**: En CI/CD de forma automática, o manualmente antes de commit.

**Cuándo NO usar**: No aplicable a ADRs pre-unified-protocol (antes de ADR-085).

**Qué problema resuelve**: ADRs incompletos (66% sin status), formato inconsistente, metadata faltante, nomenclatura incorrecta que dificulta búsqueda y mantenimiento.

## Problem Statement

**Estadísticas** (ADR-085):
- 66 ADRs (51.2%) sin status definido
- 34 ADRs (26.4%) con nomenclatura no estándar
- 0% con structured YAML frontmatter
- 14 variaciones de formato de status
- Mixtura English/Spanish crea confusión

**Impacto**:
- Imposible rastrear lifecycle de decisiones
- Búsqueda pobre (semantic search roto)
- Sin validación automática
- Calidad inconsistente
- Difícil integración con herramientas

## Source ADRs

- **ADR-085**: Unified ADR Protocol
- Related: ADR-016 (ACE Pipeline), ADR-089 (ADR Consultation)

## Procedimiento

### 1. Validación Automática en CI/CD

```yaml
# .github/workflows/adr-validation.yml
name: ADR Validation
on: [pull_request, push]

jobs:
  validate-adrs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Validate ADRs
        run: |
          node scripts/validate-all-adrs.mjs docs/adr/
          if [ $? -ne 0 ]; then
            echo "❌ ADR validation failed"
            exit 1
          fi
      - name: Check for non-standard ADRs
        run: |
          find docs/adr -name "*.md" ! -name "ADR-*.md" \
            && echo "❌ Non-standard ADR naming found" \
            && exit 1
```

### 2. Validación Manual Pre-Commit

```bash
# Opción A: Validar archivo específico
node scripts/validate-adr.mjs docs/adr/ADR-090-integration-strategy.md

# Opción B: Validar todos los ADRs
node scripts/validate-all-adrs.mjs docs/adr/

# Debería output:
# ✅ ADR-090: Format validation passed
# ✅ ADR-091: Format validation passed
# ❌ ADR-092: Missing required field 'status'
# Total: 2 passed, 1 failed
```

### 3. Validación de Nomenclatura

```javascript
// Validate naming: ADR-{NUMBER}-{kebab-case-title}.md
const namingPattern = /^ADR-\d{3}-[a-z0-9-]+\.md$/;

function validateNaming(filename) {
  if (!namingPattern.test(filename)) {
    return {
      valid: false,
      error: `Invalid naming. Expected format: ADR-{NUMBER}-{kebab-case-title}.md`
    };
  }
  return { valid: true };
}
```

### 4. Validación de Frontmatter YAML

```javascript
function validateFrontmatter(content) {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
  
  if (!frontmatterMatch) {
    return { valid: false, error: "Missing YAML frontmatter" };
  }
  
  const metadata = yaml.parse(frontmatterMatch[1]);
  
  // Required fields
  const required = ['id', 'title', 'status', 'date_proposed', 'author'];
  for (const field of required) {
    if (!metadata[field]) {
      return { valid: false, error: `Missing required field: ${field}` };
    }
  }
  
  // Validate status enum
  const validStatuses = ['Proposed', 'Accepted', 'Deprecated', 'Superseded'];
  if (!validStatuses.includes(metadata.status)) {
    return {
      valid: false,
      error: `Invalid status '${metadata.status}'. Must be one of: ${validStatuses.join(', ')}`
    };
  }
  
  return { valid: true, metadata };
}
```

### 5. Validación de Secciones Obligatorias

```javascript
function validateSections(content) {
  const sections = {
    Context: /^## Context/m,
    Decision: /^## Decision/m,
    Consequences: /^## Consequences/m
  };
  
  const missing = [];
  
  for (const [section, pattern] of Object.entries(sections)) {
    if (!pattern.test(content)) {
      missing.push(section);
    }
  }
  
  if (missing.length > 0) {
    return {
      valid: false,
      error: `Missing required sections: ${missing.join(', ')}`
    };
  }
  
  // Validate minimum word counts
  const wordCounts = {
    Context: countWordsInSection(content, 'Context'),
    Decision: countWordsInSection(content, 'Decision'),
    Consequences: countWordsInSection(content, 'Consequences')
  };
  
  const thresholds = { Context: 100, Decision: 50, Consequences: 50 };
  const violations = [];
  
  for (const [section, count] of Object.entries(wordCounts)) {
    if (count < thresholds[section]) {
      violations.push(`${section}: ${count}/${thresholds[section]} words`);
    }
  }
  
  if (violations.length > 0) {
    return {
      valid: false,
      error: `Sections below minimum word count: ${violations.join(', ')}`
    };
  }
  
  return { valid: true };
}
```

### 6. Output de Errores Accionables

```bash
# Example output
$ node scripts/validate-adr.mjs docs/adr/adr-090-integration.md

❌ Validation Failed: docs/adr/adr-090-integration.md

Errors:
  1. Invalid naming: Expected 'ADR-090-integration.md', got 'adr-090-integration.md'
  2. Missing required field: 'status'
  3. Section 'Context': 45/100 words (minimum not met)

To fix:
  1. Rename file to: docs/adr/ADR-090-integration.md
  2. Add 'status: Proposed' to frontmatter
  3. Expand Context section to at least 100 words
```

## Checklist

- [ ] Nomenclatura correcta: `ADR-{NUMBER}-{kebab-case-title}.md`
- [ ] YAML frontmatter presente y válido
- [ ] Campos requeridos presentes: id, title, status, date_proposed, author
- [ ] Status válido: Proposed/Accepted/Deprecated/Superseded
- [ ] Sección Context presente (≥100 palabras)
- [ ] Sección Decision presente (≥50 palabras)
- [ ] Sección Consequences presente (≥50 palabras)
- [ ] Integración CI/CD funcionando
- [ ] Validación bloquea PRs no conformes
- [ ] Mensajes de error accionables

## Scripts Reales

### Validation Script

**Ubicación**: `scripts/validate-adr.mjs`

```javascript
#!/usr/bin/env node
import fs from 'fs-extra';
import yaml from 'yaml';
import path from 'path';

async function validateADR(filePath) {
  const filename = path.basename(filePath);
  
  // 1. Naming validation
  const namingResult = validateNaming(filename);
  if (!namingResult.valid) {
    logError(filePath, namingResult.error);
    return false;
  }
  
  // 2. Read and parse
  const content = await fs.readFile(filePath, 'utf-8');
  
  // 3. Frontmatter validation
  const frontmatterResult = validateFrontmatter(content);
  if (!frontmatterResult.valid) {
    logError(filePath, frontmatterResult.error);
    return false;
  }
  
  // 4. Sections validation
  const sectionsResult = validateSections(content);
  if (!sectionsResult.valid) {
    logError(filePath, sectionsResult.error);
    return false;
  }
  
  console.log(`✅ ${filename}: Validation passed`);
  return true;
}

// Main
const filePath = process.argv[2];
const valid = await validateADR(filePath);
process.exit(valid ? 0 : 1);
```

### Validate All ADRs Script

**Ubicación**: `scripts/validate-all-adrs.mjs`

```javascript
#!/usr/bin/env node
import { glob } from 'glob';
import { validateADR } from './validate-adr.mjs';

async function validateAllADRs(dir) {
  const adrFiles = await glob(`${dir}/ADR-*.md`);
  
  let passed = 0;
  let failed = 0;
  
  for (const file of adrFiles) {
    const valid = await validateADR(file);
    if (valid) passed++;
    else failed++;
  }
  
  console.log(`\nTotal: ${passed} passed, ${failed} failed`);
  
  if (failed > 0) {
    console.log('❌ ADR validation failed');
    process.exit(1);
  }
}

const dir = process.argv[2] || 'docs/adr';
validateAllADRs(dir);
```

## Examples

### ✅ Correcto

```yaml
---
id: ADR-090
title: "Integration Strategy"
status: Proposed
date_proposed: 2025-10-29
author: "Jane Doe"
---

## Context

[150+ words describing problem, current state, drivers]

## Decision

We will implement integration using X approach...

[50+ words with decision, alternatives, rationale]

## Consequences

### Positive
- Benefit 1
- Benefit 2

### Negative
- Trade-off 1
```

**Validation**: ✅ Passes all checks

### ❌ Incorrecto

```markdown
# adr-090-integration (❌ lowercase naming)

## Contexto (❌ wrong language, no YAML frontmatter)

[30 words only] (❌ below 100 word minimum)

## Decision

[10 words only] (❌ below 50 word minimum)

(❌ No Consequences section)
```

**Validation**: ❌ Fails all checks

## Trigger Rules

### Keywords
```json
"keywords": [
  "adr", "validation", "validate", "gate", "check", "quality"
]
```

### Intent Patterns
```json
"intentPatterns": [
  "(validate|check).*adr",
  "adr.*validation",
  "quality.*gate"
]
```

### File Triggers
```json
"pathPatterns": [
  "docs/adr/**/*.md",
  "**/ADR-*.md",
  ".github/workflows/*adr*.yml"
]
```

### Content Patterns
```json
"contentPatterns": [
  "^ADR-\\d{3}-.*",  # Standard naming
  "^(?!--)",  # Missing frontmatter
  "status:\\s*(?!Proposed|Accepted|Deprecated|Superseded)"  # Invalid status
]
```

## Resources to Create

1. **validation-script.mjs**: Script completo de validación con todos los checks
2. **error-messages.md**: Mensajes de error claros y accionables
3. **ci-integration.yml**: Template de GitHub Actions para CI/CD

## Integration with Existing Skills

- **unified-documentation-standards**: Define estándares validados
- **adr-creation-workflow**: Usa este skill para validar ADRs creados
- **adr-consultation-protocol**: Requiere ADRs válidos para consulta efectiva

## Success Metrics

- ADRs bloqueados por validación: ≥5% (errores reales detectados)
- Falsos positivos: <1%
- Integración CI/CD: 100% coverage
- Tiempo promedio de validación: <5 segundos

---

**Last Updated**: 2025-10-29  
**Spec Version**: 0.1.0

