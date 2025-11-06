# Skill Specification: Unified Documentation Standards

## YAML Frontmatter

```yaml
---
id: unified-documentation-standards
version: 0.1.0
type: guideline
enforcement: suggest
summary: Estándares unificados para documentación estructurada con YAML frontmatter, nomenclatura consistente y metadata para búsqueda semántica
audience: engineers, architects, documentarians
when_to_use: Al crear cualquier documentación estructurada (ADRs, RFCs, specs, guides). Usa para estandarizar formato y metadata de todos los documentos técnicos del proyecto.
provides: Schema YAML completo, convenciones de nomenclatura, lifecycle de status, metadata para búsqueda, validación automática
resources:
  - resources/frontmatter-schema.md
  - resources/naming-conventions.md
  - resources/status-lifecycle.md
  - resources/metadata-guide.md
scripts:
  - name: lint-docs
    run: node scripts/lint-docs.mjs docs/
    note: Valida todos los documentos contra estándares
limits: Solo cubre formato y metadata; no prescribe contenido. Requiere disciplina del equipo para adopción consistente.
---
```

## Objective

**Cuándo usar**: Al crear o actualizar documentación estructurada del proyecto.

**Cuándo NO usar**: Para documentación markdown simple sin estructura, README básicos, o comentarios en código.

**Qué problema resuelve**: Documentación inconsistente, falta de metadata, búsqueda ineficiente, lifecycle no rastreado, difícil mantenimiento (66% ADRs sin status según ADR-085).

## Problem Statement

**Estadísticas** (ADR-085):
- 129 ADRs con 14 variaciones de formato de status
- 51.2% sin status definido
- 26.4% con nomenclatura no estándar
- 0% con structured YAML frontmatter inicialmente

**Impacto**:
- Imposible búsqueda efectiva
- Lifecycle no rastreable
- Calidad inconsistente
- Difícil integración con herramientas
- Metadata perdido

## Source ADRs

- **ADR-085**: Unified ADR Protocol
- Related: ADR-089 (ADR consultation), ADR-016 (ACE Pipeline)

## Procedimiento

### 1. Identificar Tipo de Documento

```yaml
# Tipos soportados
- ADR (Architecture Decision Record)
- RFC (Request for Comments)
- SPEC (Specification)
- GUIDE (Guide/Tutorial)
- DEPRECATED (Deprecated documentation)
```

### 2. Aplicar Nomenclatura Consistente

**Schema**: `{TYPE}-{NUMBER}-{kebab-case-title}.md`

**Ejemplos**:
- ✅ `ADR-090-integration-strategy.md`
- ✅ `RFC-001-api-versioning.md`
- ✅ `SPEC-012-database-schema.md`
- ❌ `adr-090-integration.md` (lowercase prefix)
- ❌ `90-integration-strategy.md` (missing prefix)
- ❌ `ADR_090_integration.md` (underscores)

### 3. Frontmatter YAML Completo

```yaml
---
id: {TYPE}-{NUMBER}
title: "Full Descriptive Title"
status: Proposed | Accepted | Deprecated | Superseded
date_proposed: YYYY-MM-DD
author: "Author Name"
reviewers: ["Reviewer 1", "Reviewer 2"]
tags: ["category1", "category2"]
phase: clarify | layout | operate | observe | reflect
superseded_by: {TYPE}-{NUMBER}
supersedes: {TYPE}-{NUMBER}
related_docs: ["{TYPE}-{NUMBER}", "{TYPE}-{NUMBER}"]
chroma_indexed: true
memtech_layer: L3
embedding_model: all-MiniLM-L6-v2
---
```

### 4. Status Lifecycle

```
Proposed → Accepted → [Deprecated | Superseded]
         ↓
    [Can become] Accepted after review
    [Cannot go back] to Proposed once Accepted
```

**Reglas**:
- Once Accepted → cannot return to Proposed
- Deprecated: no longer recommended but not replaced
- Superseded: replaced by another doc

### 5. Metadata para Búsqueda

**Tags**: 3-5 tags por documento
```yaml
tags: ["integration", "architecture", "apis", "cloud", "database"]
```

**Related Docs**: Enlaces bidireccionales
```yaml
related_docs: ["ADR-085", "RFC-001"]
```

**Chroma Indexing** (si aplica):
```yaml
chroma_indexed: true
embedding_model: all-MiniLM-L6-v2
```

### 6. Validación Automática

```bash
# Lint todos los documentos
node scripts/lint-docs.mjs docs/

# Debería output:
# ✅ ADR-090: Frontmatter valid
# ✅ RFC-001: Status lifecycle valid
# ❌ adr-091: Invalid naming convention
# Total: 89 passed, 1 failed
```

## Checklist

- [ ] Nomenclatura consistente aplicada
- [ ] YAML frontmatter completo con campos relevantes
- [ ] Status definido y en lifecycle correcto
- [ ] Tags asignados (3-5)
- [ ] Related docs enlazados
- [ ] Metadata para búsqueda presente (si aplica Chroma)
- [ ] Validación automática passing
- [ ] Documento indexado en catálogo (si aplica)
- [ ] Author y reviewers asignados
- [ ] Dates correctas y formateadas

## Scripts Reales

### Lint Docs Script

**Ubicación**: `scripts/lint-docs.mjs`

```javascript
#!/usr/bin/env node
import fs from 'fs-extra';
import { glob } from 'glob';
import yaml from 'yaml';

const namingPattern = /^(ADR|RFC|SPEC|GUIDE)-\d{3}-[a-z0-9-]+\.md$/;

async function lintDocs(dir) {
  const docFiles = await glob(`${dir}/**/*.md`, {
    ignore: ['**/node_modules/**', '**/dist/**']
  });
  
  let passed = 0;
  let failed = 0;
  
  for (const file of docFiles) {
    const filename = path.basename(file);
    
    // Skip README and basic docs
    if (filename === 'README.md' || !filename.match(/^(ADR|RFC|SPEC|GUIDE)-/)) {
      continue;
    }
    
    // Check naming
    if (!namingPattern.test(filename)) {
      console.log(`❌ ${filename}: Invalid naming`);
      failed++;
      continue;
    }
    
    // Check frontmatter
    const content = await fs.readFile(file, 'utf-8');
    const frontmatterResult = validateFrontmatter(content);
    
    if (!frontmatterResult.valid) {
      console.log(`❌ ${filename}: ${frontmatterResult.error}`);
      failed++;
      continue;
    }
    
    // Check status lifecycle
    const lifecycleResult = validateLifecycle(frontmatterResult.metadata);
    
    if (!lifecycleResult.valid) {
      console.log(`❌ ${filename}: ${lifecycleResult.error}`);
      failed++;
      continue;
    }
    
    console.log(`✅ ${filename}: Valid`);
    passed++;
  }
  
  console.log(`\nTotal: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

function validateLifecycle(metadata) {
  const validStatuses = ['Proposed', 'Accepted', 'Deprecated', 'Superseded'];
  
  if (!validStatuses.includes(metadata.status)) {
    return { valid: false, error: `Invalid status: ${metadata.status}` };
  }
  
  // Check status transitions
  if (metadata.status === 'Superseded' && !metadata.superseded_by) {
    return { valid: false, error: 'Superseded status requires superseded_by' };
  }
  
  return { valid: true };
}

const dir = process.argv[2] || 'docs';
lintDocs(dir);
```

## Examples

### ✅ Correcto

```markdown
---
id: ADR-090
title: "Integration Strategy with External API"
status: Accepted
date_proposed: 2025-10-29
date_accepted: 2025-10-30
author: "Jane Doe"
reviewers: ["John Smith", "Alice Brown"]
tags: ["integration", "api", "architecture", "cloud"]
related_docs: ["ADR-085", "RFC-001"]
chroma_indexed: true
---

## Context

[Content here...]

## Decision

[Content here...]
```

**Características**:
- ✅ Naming correcto
- ✅ Frontmatter completo
- ✅ Status válido con lifecycle correcto
- ✅ Tags relevantes
- ✅ Related docs enlazados

### ❌ Incorrecto

```markdown
# Integration Strategy (❌ sin YAML frontmatter)

[Content here]
```

**Problemas**:
- ❌ Sin frontmatter YAML
- ❌ Sin metadata
- ❌ Sin lifecycle
- ❌ Sin tags
- ❌ Nomenclatura no estándar

## Trigger Rules

### Keywords
```json
"keywords": [
  "documentation", "standard", "format", "metadata",
  "frontmatter", "naming", "convention"
]
```

### Intent Patterns
```json
"intentPatterns": [
  "(create|write|update).*?documentation",
  "(standard|unify).*?format",
  "(add|set).*?metadata"
]
```

### File Triggers
```json
"pathPatterns": [
  "docs/**/*.md",
  "**/ADR-*.md",
  "**/RFC-*.md",
  "**/SPEC-*.md"
]
```

### Content Patterns
```json
"contentPatterns": [
  "^(?!---)",  # Missing frontmatter
  "^#[^#]",  # Title without frontmatter
  "(?<!^id: )ADR-\\d{3}"  # ID reference without frontmatter
]
```

## Resources to Create

1. **frontmatter-schema.md**: Schema completo de YAML frontmatter
2. **naming-conventions.md**: Convenciones de nomenclatura detalladas
3. **status-lifecycle.md**: Guía de lifecycle de status
4. **metadata-guide.md**: Guía de metadata para búsqueda

## Integration with Existing Skills

- **adr-creation-workflow**: Usa este skill para crear ADRs con estándares
- **adr-validation-gates**: Valida contra estos estándares
- **adr-consultation-protocol**: Requiere metadata correcta para búsqueda efectiva

## Success Metrics

- Documentos con frontmatter válido: ≥95%
- Nomenclatura consistente: 100%
- Status definido: ≥95%
- Metadata completa: ≥90%
- Búsqueda efectiva: tiempo <30s

---

**Last Updated**: 2025-10-29  
**Spec Version**: 0.1.0

