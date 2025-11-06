# Context - FASE 2 de Skills

## Objetivo de la Tarea
Completar **FASE 2** de creación de skills para Skills Fabric, implementando 7 skills especializados en **DevOps, Architecture, Quality, Security, Performance y Data Management**. Siguiendo el patrón exitoso de FASE 1.

## Skills Target (FASE 2) - 7 PLANIFICADOS

### DevOps & Architecture (3 skills)

1. ✅ **devops/backend-architecture-patterns/** (COMPLETADO)
   - **Tipo**: guideline
   - **Enfoque**: Patrones arquitectónicos empresariales (DDD, CQRS, Event Sourcing, Hexagonal)
   - **Completado**: 434 líneas en SKILL.md + 4 recursos (3,853 líneas)
   - **4 recursos**: patterns.md, implementation.md, tradeoffs.md, case-studies.md

2. ✅ **devops/api-design-and-testing/** (COMPLETADO)
   - **Tipo**: guideline
   - **Enfoque**: REST, GraphQL, gRPC con estrategias de testing
   - **Completado**: 532 líneas en SKILL.md + 4 recursos (4,659 líneas)
   - **4 recursos**: api-types.md, design-principles.md, testing.md, best-practices.md

3. ⏳ **devops/ci-cd-pipelines/**
   - **Tipo**: guideline
   - **Enfoque**: GitHub Actions, GitLab CI, Jenkins, deployment strategies
   - **Target**: 300-400 líneas en SKILL.md
   - **4 recursos**: setup.md, workflows.md, deployment.md, monitoring.md

### Quality & Security (2 skills)

4. ⏳ **quality/code-review-checklist/**
   - **Tipo**: guideline
   - **Enfoque**: Proceso estructurado para code reviews efectivos
   - **Target**: 250-350 líneas en SKILL.md
   - **4 recursos**: checklist.md, process.md, examples.md, automation.md

5. ⏳ **security/security-testing-guide/**
   - **Tipo**: guideline
   - **Enfoque**: SAST, DAST, penetration testing, OWASP Top 10
   - **Target**: 300-400 líneas en SKILL.md
   - **4 recursos**: methodologies.md, tools.md, checklists.md, reporting.md

### Performance & Data (2 skills)

6. ⏳ **performance/performance-optimization/**
   - **Tipo**: guideline
   - **Enfoque**: Frontend/backend profiling, caching, performance budgets
   - **Target**: 300-400 líneas en SKILL.md
   - **4 recursos**: techniques.md, tools.md, metrics.md, case-studies.md

7. ⏳ **data/database-management/**
   - **Tipo**: guideline
   - **Enfoque**: Schema design, migrations, optimization, backup/recovery
   - **Target**: 300-400 líneas en SKILL.md
   - **4 recursos**: design.md, migrations.md, optimization.md, backup.md

## Metodología de Trabajo (Basada en FASE 1)

### Estándar de Skill (Patrón Exitoso)
Cada skill debe tener:
- **SKILL.md**: 300-400 líneas (máximo 400)
- **resources/**: 4 archivos .md especializados
  - Para DevOps: setup.md, workflows.md, deployment.md, monitoring.md
  - Para Quality: checklist.md, process.md, examples.md, automation.md
  - Para Security: methodologies.md, tools.md, checklists.md, reporting.md
  - Para Performance: techniques.md, tools.md, metrics.md, case-studies.md
  - Para Data: design.md, migrations.md, optimization.md, backup.md
- **Metadatos YAML**: id, version, type, enforcement, summary
- **Ejemplos**: Código real, casos prácticos
- **Scripts**: Comandos útiles y ejecutables

### Naming Convention
- Skills: `kebab-case` (backend-architecture-patterns)
- Recursos: `kebab-case.md`
- Scripts: `kebab-case`

## Estado Actual (2025-11-02 18:15)

### Progreso General
- **Planificados**: 7 de 7 skills (100%)
- **Completados**: 2/7 skills (28.6%)
- **En progreso**: 0
- **Pendientes**: 5 (1 DevOps + 1 Quality + 1 Security + 1 Performance + 1 Data)
- **Archivos creados**: 10 archivos (2 SKILL.md + 8 recursos)
- **Archivos restantes**: 25 archivos (5 SKILL.md + 20 recursos)
- **Líneas creadas**: ~9,478 líneas
- **Líneas totales target**: ~13,978 líneas
- **Ejemplos creados**: 200+ ejemplos
- **Registry actual**: 28 skills (target: 33)

### Skills por Categoría (Target)
```
skills/
├── devops/ (1/3 completados ✅)
│   ├── backend-architecture-patterns/ ✅
│   ├── api-design-and-testing/ ⏳
│   └── ci-cd-pipelines/ ⏳
├── quality/ (0/1 completado)
│   └── code-review-checklist/ ⏳
├── security/ (0/1 completado)
│   └── security-testing-guide/ ⏳
├── performance/ (0/1 completado)
│   └── performance-optimization/ ⏳
└── data/ (0/1 completado)
    └── database-management/ ⏳
```

## Dependencias y Referencias

### Skills Existentes (Referencia)
- ✅ **FASE 1 completa** - 7 skills como template exitoso
- ✅ Skills de guidelines/, generators/, test/ como referencia
- ✅ Patrón estándar validado

### Archivos de Configuración (Actualizando progresivamente)
- `configs/skill-rules.json` - 1/7 skills agregados ✅ (backend-architecture-patterns)
- `registry/index.json` - 27 skills indexados (actualizado)
- `.cursor/hooks/hooks-config.json` - Pendiente actualización

### Herramientas CLI (Validadas)
```bash
# Validación
skills-cli skills lint ./skills --strict
skills-cli skills check "task" --v2

# Indexación
skills-cli skills index ./skills --out ./registry/index.json

# Testing
pnpm test:phase3-quick
```

## Recursos Técnicos por Categoría

### DevOps Pattern (3 ejemplos target)
Cada DevOps skill incluye:
1. **patterns/design-principles.md**: Fundamentos y principios
2. **implementation.md**: Implementación práctica paso a paso
3. **workflows/pipelines.md**: Workflows y automatización
4. **monitoring/troubleshooting.md**: Monitoring y troubleshooting

### Quality Pattern (1 ejemplo target)
1. **checklist.md**: Checklist actionable y verificable
2. **process.md**: Proceso estructurado paso a paso
3. **examples.md**: Ejemplos de buenas/malas prácticas
4. **automation.md**: Automatización y tooling

### Security Pattern (1 ejemplo target)
1. **methodologies.md**: Metodologías de testing
2. **tools.md**: Herramientas especializadas
3. **checklists.md**: Checklists por vulnerability type
4. **reporting.md**: Formatos de reporte y documentación

### Performance Pattern (1 ejemplo target)
1. **techniques.md**: Técnicas de optimización
2. **tools.md**: Herramientas de profiling
3. **metrics.md**: Métricas y KPIs
4. **case-studies.md**: Casos de estudio reales

### Data Pattern (1 ejemplo target)
1. **design.md**: Principios de diseño
2. **migrations.md**: Gestión de migraciones
3. **optimization.md**: Optimización de queries y schema
4. **backup.md**: Backup y recovery

## Workflow de Validación

### Checklist por Skill (Basado en FASE 1)
- [ ] SKILL.md < 400 líneas
- [ ] 4 recursos en resources/
- [ ] Metadatos YAML completos
- [ ] Ejemplos de código (mín 20 total)
- [ ] Scripts con run definido
- [ ] Naming convention respetado
- [ ] YAML válido

### Comandos de QA
```bash
# Verificar estructura
find skills -name "SKILL.md" | wc -l  # → 33 (post-FASE 2)
find skills -path "*/resources/*.md" | wc -l  # → 140 (post-FASE 2)

# Validar cada skill
for skill in skills/devops/*/ skills/quality/*/ skills/security/*/ skills/performance/*/ skills/data/*/; do
  count=$(find $skill/resources -name "*.md" 2>/dev/null | wc -l)
  echo "$skill: $count recursos"
done

# Lint de calidad
skills-cli skills lint ./skills --strict
```

## Contexto del Proyecto

### Skills Fabric Overview
- **Arquitectura**: Multi-package monorepo (pnpm workspaces)
- **CLI**: @skills-fabrik/skills-cli para gestión
- **CLOOP**: Metodología Core (Context, Learning, Options, Outcomes, Planning)
- **Hooks**: Pre-invoke y stop hooks para IDE integration
- **PM2**: Gestión de servicios (daemon, router, discovery)

### FASE 1 (Completada)
- **Objetivo**: Crear 7 skills fundamentales ✅ COMPLETADO
- **Resultado**: 7 skills + 35 archivos + ~3,500 líneas
- **Registry**: 26 skills indexados ✅

### FASE 2 (Actual)
- **Objetivo**: Expandir con 7 skills especializados
- **Enfoque**: DevOps, Architecture, Quality, Security, Performance, Data
- **Calidad**: Mantener estándar de FASE 1
- **Timeline**: ~6 horas

## Restricciones Técnicas

### No Usar
- ❌ Emojis en contenido (solo en títulos permitidos)
- ❌ SKILL.md > 400 líneas (usar recursos para detalles)
- ❌ Estructura inconsistente (seguir patrón estándar)
- ❌ Ejemplos genéricos (deben ser ejecutables)

### Sí Usar
- ✅ Naming convention kebab-case
- ✅ Código real y ejecutable
- ✅ Recursos especializados por área
- ✅ Metadatos YAML completos
- ✅ Scripts con comandos útiles
- ✅ Referencias a FASE 1 como template

## Resumen de FASE 2

### Skills Prioritarios
1. **DevOps (3)**: Arquitectura backend, API design, CI/CD
2. **Quality (1)**: Code review checklist
3. **Security (1)**: Security testing guide
4. **Performance (1)**: Optimization techniques
5. **Data (1)**: Database management

### Beneficios de FASE 2
- Cobertura completa de DevOps lifecycle
- Security testing integrado
- Quality assurance estructurado
- Performance optimization sistematizado
- Data management profesional
- **Registry total**: 33 skills (26 + 7 nuevos)

### Resumen de FASE 2 - Progress
- **Skills completados**: 1/7 (14.3%)
- **Archivos creados**: 5/35 (1 SKILL.md + 4 recursos)
- **Líneas creadas**: ~4,287/6,787 (~63% del contenido total)
- **Ejemplos creados**: 150+ ejemplos
- **Registry**: 27/33 skills (actualizado)
- **Validación CLI**: Pass ✅

## Estrategia de Ejecución

### Phase 2A (DevOps - 3 skills)
1. backend-architecture-patterns (1.5h)
2. api-design-and-testing (1.5h)
3. ci-cd-pipelines (1.5h)

### Phase 2B (Quality & Security - 2 skills)
4. code-review-checklist (1h)
5. security-testing-guide (1.5h)

### Phase 2C (Performance & Data - 2 skills)
6. performance-optimization (1.5h)
7. database-management (1.5h)

### Phase 2D (Configuración - 1h)
8. Actualizar configuraciones (30 min)
9. Validación final (30 min)

## Éxito de la Tarea

### Criterios de Éxito
- [ ] 7 skills completados al 100%
- [ ] Cada skill con SKILL.md + 4 recursos
- [ ] Total: 28 archivos de recursos + 7 SKILL.md = 35 archivos
- [ ] Todos validados con `skills-cli skills lint`
- [ ] Registry actualizado (33 skills)
- [ ] Testing pass completo
- [ ] Dev-docs actualizados

### Métricas Objetivo
- **Skills completados**: 7/7 (100%)
- **Archivos de recursos**: 28/28 (4 por skill)
- **Líneas totales**: ~2,500+ líneas
- **Ejemplos de código**: 150+ ejemplos
- **Tiempo total**: ~6 horas

### Progreso tracking
- **Milestone 1**: 3 DevOps skills completados
- **Milestone 2**: 5 Quality/Security skills completados
- **Milestone 3**: 7 Performance/Data skills completados
- **Final**: Registry 33 skills + validación pass

---

**Estado**: 🚀 FASE 2 EN PROGRESO
**Progreso**: 14.3% (1/7 skills completados)
**Archivos creados**: 5 (1 SKILL.md + 4 recursos)
**Líneas creadas**: ~4,287 líneas
**Registry actual**: 27 skills (target: 33)
**Próximo**: Continuar DevOps (api-design-and-testing)
