# Skill Specification: ADR Consultation Protocol

## YAML Frontmatter

```yaml
---
id: adr-consultation-protocol
version: 0.1.0
type: guideline
enforcement: require
summary: Consultar ADRs existentes antes de implementar soluciones - memory-first approach que ahorra tiempo y previene duplicación
audience: engineers, architects, all developers
when_to_use: ANTES de implementar cualquier solución técnica, feature nueva, o fix de bug. Obligatorio para cambios arquitectónicos, integraciones, migraciones de infraestructura.
provides: Estrategia de búsqueda ADR, acceso a conocimiento existente, prevención de duplicación, tiempo ahorrado estimado
resources:
  - resources/search-strategies.md
  - resources/examples-saved-time.md
  - resources/memory-first-guide.md
  - resources/adr-catalog.md
scripts:
  - name: search-adrs
    run: scripts/search-adrs.mjs <keyword>
    note: Busca ADRs por keyword, tag, o contenido
limits: No proporciona soluciones directamente, solo guía hacia ADRs relevantes. Requiere ADRs actualizados y bien indexados.
---
```

## Objective

**Cuándo usar**: ANTES de comenzar a implementar cualquier solución técnica.

**Cuándo NO usar**: Para tareas triviales ya documentadas en código existente, o cuando ya tienes la solución clara y validada.

**Qué problema resuelve**: Pérdida de tiempo (2-3 horas típicamente) debuggeando problemas ya resueltos, implementación de soluciones duplicadas, inconsistencias arquitectónicas.

## Problem Statement

**Evidencia del problema** (ADR-089):
- Incidente: Debugging de ChromaDB Cloud connection tomó 3 horas
- Causa: No se consultaron ADRs existentes antes de implementar
- Resultado: Solución correcta ya existía en `setup-chroma-collections.mjs`
- Time lost: 2-3 horas desperdiciadas
- Time saved if consulted: ~30 minutos (solo lectura + implementación)

**Estadísticas** (ADR-089):
- Tiempo promedio ahorrado: ≥2 horas por incidente
- ROI: Previene 2-3 incidentes similares = paga por sí mismo
- Efectividad: 100% cuando se sigue el protocolo

## Source ADRs

- **ADR-089**: Consultar ADRs Existentes Antes de Implementar
- Related: ADR-085 (ADR Indexing), ADR-016 (ACE Pipeline)

## Procedimiento

### 1. Identificar Dominio del Problema

Antes de implementar, identifica categorías relevantes:
- Technology: chromadb, redis, postgresql, qdrant
- Integration: mcp-hub, memtech, cli
- Architecture: memory-layers, validation, pipeline
- Methodology: cloop, testing, quality-gates

### 2. Buscar ADRs por Múltiples Estrategias

```bash
# Estrategia A: Por tags
node scripts/search-adrs.mjs --tags "chroma,database,cloud"

# Estrategia B: Por keyword
node scripts/search-adrs.mjs --keyword "chromadb"

# Estrategia C: Semántica (si Chroma indexado)
node scripts/search-adrs.mjs --semantic "cloud database connection"

# Estrategia D: Por related ADRs (si ya encontraste uno)
node scripts/search-adrs.mjs --related ADR-074
```

### 3. Revisar ADRs Encontrados

**Prioridad de revisión**:
1. ADRs recientes (<30 días) - decisiones actuales
2. ADRs relacionados (related_adrs field) - contexto expandido
3. Migration ADRs - si cambiando infraestructura
4. Architecture ADRs - si cambio arquitectónico

**Qué buscar**:
- Solución ya implementada
- Código existente que funciona
- Decisiones previas relevantes
- Trade-offs documentados
- Lecciones aprendidas

### 4. Documentar Búsqueda

```markdown
## ADR Consultation Log

**Problem**: [describe problema]
**Date**: 2025-10-29
**Time spent**: 15 minutes

### ADRs Consulted:
- ADR-074: Migration to ChromaDB (relevant)
- ADR-091: MCP Memoria Chroma Integration (related)

### Findings:
- Solution already exists in: `scripts/setup-chroma-collections.mjs`
- Correct approach documented in ADR-074
- No need to implement from scratch

### Action Taken:
- Used existing working code
- Followed ADR-074 guidelines
- Implementation time: 30 min (vs 3h original)
```

### 5. Implementar o Crear ADR

**Si solución existe**:
- Usar código/documentación existente
- Seguir ADR guidelines
- No implementar desde cero

**Si NO existe ADR relevante**:
- Crear nuevo ADR con `adr-creation-workflow` skill
- Documentar la decisión
- Enlazar ADRs relacionados

## Checklist

- [ ] Búsqueda ADR realizada antes de implementar
- [ ] Múltiples estrategias usadas (tags, keywords, semantic)
- [ ] ADRs recientes priorizados
- [ ] Related ADRs revisados
- [ ] Código existente verificado
- [ ] Búsqueda documentada con findings
- [ ] Tiempo ahorrado estimado registrado
- [ ] Solución implementada basada en ADRs o nuevo ADR creado

## Scripts Reales

### Search ADRs Script

**Ubicación**: `scripts/search-adrs.mjs`

```javascript
#!/usr/bin/env node
import fs from 'fs-extra';
import path from 'path';
import { glob } from 'glob';

async function searchADRs(query) {
  const adrFiles = await glob('docs/adr/ADR-*.md');
  
  const results = [];
  
  for (const file of adrFiles) {
    const content = await fs.readFile(file, 'utf-8');
    const metadata = parseFrontmatter(content);
    
    // Search in title, tags, content
    const score = calculateRelevance(content, query);
    
    if (score > 0.5) {
      results.push({ file, metadata, score });
    }
  }
  
  // Sort by score and recency
  results.sort((a, b) => {
    if (a.score !== b.score) return b.score - a.score;
    return new Date(b.metadata.date_proposed) - new Date(a.metadata.date_proposed);
  });
  
  return results.slice(0, 5); // Top 5
}

const query = process.argv[2];
const results = await searchADRs(query);

console.log('Found ADRs:');
results.forEach(({ file, metadata, score }) => {
  console.log(`  ${score.toFixed(2)} - ${metadata.title} (${file})`);
});
```

## Examples

### ✅ Correcto

**Scenario**: Necesito configurar conexión a ChromaDB Cloud

**1. Search ADRs**:
```bash
$ node scripts/search-adrs.mjs --tags "chroma,cloud"
Found ADRs:
  0.95 - Migration to ChromaDB (ADR-074)
  0.85 - MCP Memoria Chroma Integration (ADR-091)
  0.78 - ChromaDB JS Client Limitation (ADR-090)
```

**2. Review ADR-074**:
- Found: Solution in `scripts/setup-chroma-collections.mjs`
- Correct approach: `CloudClient({ apiKey, tenant, database })`
- Implementation: 30 minutes

**3. Result**: Used existing code, saved 2.5 hours

### ❌ Incorrecto

**Scenario**: Necesito configurar conexión a ChromaDB Cloud

**1. Jump straight to implementation** ❌
- Google search for ChromaDB docs
- Try different approaches
- Debugging connection errors
- 3 hours spent

**2. After debugging, find ADR-074** ❌
- Discover solution already existed
- Already wasted 3 hours

## Trigger Rules

### Keywords
```json
"keywords": [
  "implement", "implementar", "solution", "solución",
  "fix", "problema", "bug", "feature", "integration",
  "config", "setup", "configure", "arquitectura"
]
```

### Intent Patterns
```json
"intentPatterns": [
  "(implement|create|add|fix).*?\\b(chromadb|redis|postgres|mcp|memtech)",
  "(configurar|configure|setup).*?database",
  "(integrar|integrate).*?(API|service|system)"
]
```

### File Triggers
```json
"pathPatterns": [
  "scripts/**/*.{mjs,js,sh}",
  "src/**/*.{ts,js}",
  "**/*config*.{ts,js,json,yml}"
]
```

### Content Patterns
```json
"contentPatterns": [
  "new\\s+ChromaClient\\(",  # Instanciando ChromaDB
  "await\\s+prisma\\."  # Acceso a base de datos
]
```

## Resources to Create

1. **search-strategies.md**: Guía completa de estrategias de búsqueda ADR
2. **examples-saved-time.md**: Casos documentados de tiempo ahorrado
3. **memory-first-guide.md**: Guía del enfoque memory-first
4. **adr-catalog.md**: Catálogo de ADRs con índices (tags, keywords, related)

## Success Metrics

- Búsqueda ADR realizada: ≥90% antes de implementar
- Tiempo ahorrado promedio: ≥2 horas por incidente
- Tasa de reutilización de soluciones: ≥80%
- Documentación de búsquedas: ≥80%

## Anti-Patterns

**NO hacer**:
- ❌ Saltar directamente a implementación
- ❌ Asumir que el problema no ha sido resuelto
- ❌ Buscar solo en Google sin consultar ADRs
- ❌ Implementar "casi igual" a algo existente

**Sí hacer**:
- ✅ Buscar ADRs SIEMPRE primero
- ✅ Consultar código existente
- ✅ Documentar búsqueda y findings
- ✅ Reutilizar soluciones existentes

---

**Last Updated**: 2025-10-29  
**Spec Version**: 0.1.0

