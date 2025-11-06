# Plan — Roadmap de Integración de Skills ADR

**Fase:** Expansión 2025 (Skills derivados de ADRs)  
**Responsable:** Skills Team  
**Estado:** PLANIFICACIÓN  
**Versión:** 1.0.0  

---

## Fase 1: Fundamentos (Semanas 1-3)

**Objetivo:** Estabilizar documentación y validación básica.

**Skills:**
- adr-consultation-protocol ⭐ CRITICAL
- unified-documentation-standards
- adr-validation-gates

**Entregables:**
- Script de búsqueda ADR
- Schema de validación
- CI/CD integration
- Linting de documentación

**Resultados Esperados:**
- Búsqueda ADR realizada: ≥90% antes de implementar
- Time saved: ≥2 horas por incidente
- ADR quality: ≥95% conformes
- Validación bloquea PRs: 100%

---

## Fase 2: Workflows (Semanas 4-6)

**Objetivo:** Automatizar creación y validación.

**Skills:**
- adr-creation-workflow
- go-nogo-validation-system
- cloop-application-pattern

**Entregables:**
- Script de creación ADR
- 6 gates de validación
- Template CLOOP
- Integration scripts

**Resultados Esperados:**
- Tiempo creación ADR: ≤15 minutos
- Go/No-Go passing: ≥90%
- CLOOP adoption: ≥80% plans
- Automation saves: ≥20% time

---

## Fase 3: Validación Avanzada (Semanas 7-12)

**Objetivo:** Asegurar calidad técnica y semántica.

**Skills:**
- metric-threshold-gates
- truth-fluency-validation
- pipeline-quality-gates

**Entregables:**
- Catálogo de métricas
- ClaimTrace integration
- RAGAS evaluators
- Monitoring dashboards

**Resultados Esperados:**
- Degradación prevenida: ≥3/month
- Truth metrics: ≥90% passing
- Pipeline quality: Faithfulness ≥0.85
- CI/CD gates: 100% coverage

---

## Fase 4: Especializados (Semanas 13-15)

**Objetivo:** Patrones avanzados para casos específicos.

**Skills:**
- incremental-validation-strategy
- delta-pipeline-pattern
- ide-integration-pattern

**Entregables:**
- Dependency injection pattern
- Delta pipeline implementation
- IDE handler integration
- Evidence generation system

**Resultados Esperados:**
- Pattern adoption: ≥70%
- Delta efficiency: 50% time saved
- IDE integration: 100% usage
- Tests deterministic: ≥95%

---

## KPIs Clave por Fase

| Indicador | Fase 1 | Fase 2 | Fase 3 | Fase 4 |
|-----------|--------|--------|--------|--------|
| ADR conformes | ≥95% | ≥95% | ≥95% | ≥95% |
| Búsqueda previa | ≥90% | ≥90% | ≥90% | ≥90% |
| Time saved/in | ≥2h | ≥2h | ≥2h | ≥2h |
| Go/No-Go passing | - | ≥90% | ≥90% | ≥90% |
| Degradaciones | 0 | 0 | 0 | 0 |
| Skills lint PASS | 100% | 100% | 100% | 100% |
| Automation | - | ≥20% | ≥20% | ≥20% |

---

## Timeline Detallado

### Semanas 1-3: Fundamentos
- Semana 1: adr-consultation-protocol + unified-standards
- Semana 2: adr-validation-gates + CI/CD integration
- Semana 3: Testing + refinamiento

### Semanas 4-6: Workflows
- Semana 4: adr-creation-workflow
- Semana 5: go-nogo-validation-system
- Semana 6: cloop-application-pattern

### Semanas 7-12: Validación Avanzada
- Semanas 7-8: metric-threshold-gates
- Semanas 9-10: truth-fluency-validation
- Semanas 11-12: pipeline-quality-gates

### Semanas 13-15: Especializados
- Semana 13: incremental-validation-strategy
- Semana 14: delta-pipeline-pattern
- Semana 15: ide-integration-pattern

---

## Recursos Necesarios

### Humanos
- Phase 1: 1 engineer (foundations críticos)
- Phase 2: 1-2 engineers (workflows paralelizables)
- Phase 3: 2 engineers (alta complejidad)
- Phase 4: 1 engineer (especializados)

### Tiempo
- **Total estimado**: 58-74 días (~12-15 semanas calendar)
- Buffer: +20% para contingencias

### Infraestructura
- CI/CD pipelines (GitHub Actions)
- PostgreSQL (opcional, L2 storage)
- Chroma Cloud (búsqueda semántica ADRs)
- Scripts directory estructura

---

## Riesgos Críticos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Underestimation | Media | Alto | Buffer +20%, prioritizar críticos |
| Low adoption | Baja | Alto | Training, docs claras, easy onboarding |
| Dependencies delay | Media | Medio | Skills menos dependientes primero |
| Integration issues | Baja | Medio | Testing exhaustivo, CI/CD validation |

---

## Exit Criteria

El proyecto se considera exitoso cuando:

✅ **12 skills implementados** y funcionando  
✅ **Metrics cumplidos** en todas las fases  
✅ **Team adoption** ≥80%  
✅ **No degradaciones** causadas por nuevos skills  
✅ **Documentación completa** y mantenible  
✅ **CI/CD** operacional para validación continua

---

## Referencias

- Análisis completo: `dev/active/adr-skills-derivation/`
- Specs detalladas: `dev/active/adr-skills-derivation/skills-specs/`
- Roadmap: `dev/active/adr-skills-derivation/IMPLEMENTATION-ROADMAP.md`
- Mapping: `dev/active/adr-skills-derivation/mapping.json`

---

**Versión**: 1.0.0  
**Fecha**: 2025-10-30  
**Próxima revisión**: End of Phase 1

