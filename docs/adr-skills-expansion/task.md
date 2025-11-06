# Task — Implementación de Skills Derivados de ADRs

## Tarea General

Diseñar, documentar y habilitar los **12 skills derivados de ADRs** que consolidan la documentación, validación y gobernanza dentro de Skills-Fabrik.

---

## Sub-tareas por Fase

### Fase 1: Fundamentos (Semanas 1-3)

**Skills Críticos:**

1. **adr-consultation-protocol** (require)
   - Búsqueda ADR antes de implementar
   - Memory-first approach
   - Time saved: 2-3 horas por incidente
   
2. **unified-documentation-standards** (suggest)
   - Estándar unificado para documentación
   - YAML frontmatter estructurado
   - Status lifecycle management
   
3. **adr-validation-gates** (block)
   - Gates automáticos en CI/CD
   - Validación de formato
   - Bloqueo de PRs no conformes

---

### Fase 2: Workflows (Semanas 4-6)

**Skills de Automatización:**

4. **adr-creation-workflow** (suggest)
   - Crear ADRs desde template
   - Validación automática
   - Git integration
   
5. **go-nogo-validation-system** (suggest)
   - 6 gates incrementales (G0-G5)
   - Modo flexible vs estricto
   - CI/CD integration
   
6. **cloop-application-pattern** (suggest)
   - Aplicar metodología CLOOP
   - 5 fases sistemáticas
   - Artifacts por fase

---

### Fase 3: Validación Avanzada (Semanas 7-12)

**Skills de Calidad:**

7. **metric-threshold-gates** (block)
   - Umbrales de métricas
   - Prevención de degradación
   - Benchmarking automático
   
8. **truth-fluency-validation** (suggest)
   - Métricas de verdad (CT-PR, EC, NLI-E)
   - Métricas de fluidez (TTFT, TUS, AHE)
   - ClaimTrace integration
   
9. **pipeline-quality-gates** (block)
   - Gates RAGAS automáticos
   - Evaluación de calidad
   - Réplica segura para testing

---

### Fase 4: Patrones Especializados (Semanas 13-15)

**Skills Especializados:**

10. **incremental-validation-strategy** (suggest)
    - Testing con dependency injection
    - Fixtures controladas
    - Tests deterministas
    
11. **delta-pipeline-pattern** (suggest)
    - Actualizaciones delta-only
    - Roles: Generator → Reflector → Curator
    - Deduplicación semántica
    
12. **ide-integration-pattern** (suggest)
    - Integración IDE con pre-flight checks
    - Memory-first approach
    - Evidence generation

---

## Dependencias

### Sistemas Existentes
- **MemTech**: Para snapshots y trazabilidad L0-L3
- **KPIs**: Para métricas de adherencia
- **Router/Hooks**: Para activación contextual de skills
- **Chroma Cloud**: Para búsqueda semántica de ADRs
- **CLI**: Para comandos de validación y creación

### Infraestructura
- PostgreSQL: Para persistencia L2 (si aplica)
- CI/CD: Para validación automática
- Scripts: Para automation de workflows

---

## Definition of Done (DoD)

### Para cada Skill

- [ ] `SKILL.md` completo (≤400 líneas recomendado)
- [ ] YAML frontmatter correcto (frontmatter schema)
- [ ] Resources creados (on-demand loading)
- [ ] Scripts implementados (si aplica)
- [ ] Trigger rules definidos (keywords, patterns)
- [ ] Ejemplos incluidos (✅ correcto / ❌ incorrecto)
- [ ] Checklist de validación definido
- [ ] Integración con skill-rules.json

### Validación General

- [ ] `pnpm skills:lint` sin errores
- [ ] `pnpm skills:index` genera registry actualizado
- [ ] `pnpm skills:check` valida activación
- [ ] Integration tests passing
- [ ] Documentación completa

### Métricas de Éxito

- [ ] Fase 1: ADR quality ≥95%, consultation ≥90%
- [ ] Fase 2: Workflow automation saves ≥20% time
- [ ] Fase 3: Degradation prevented ≥3/month
- [ ] Fase 4: Pattern adoption ≥70%

---

## Riesgos y Mitigaciones

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Esfuerzo subestimado | Alto | Buffer +20% en estimaciones |
| Adopción baja del equipo | Alto | Training sessions, docs claras |
| Duplicación con skills existentes | Medio | Validación contra registry |
| Dependencias no disponibles | Medio | Fallback graceful, L0-first |

---

**Versión**: 1.0.0  
**Fecha**: 2025-10-30

