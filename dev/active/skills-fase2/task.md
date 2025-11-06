# Task: Completar FASE 2 de Skills

## Estado Actual: 3 de 7 Skills Completados ✅ (42.9%)

### Skills Completados (3/7)

#### devops (3/3) ✅ COMPLETADO DEVODS SECTION!

1. ✅ **devops/backend-architecture-patterns/** (COMPLETADO)
   - ✅ SKILL.md principal (434 líneas)
   - ✅ 4 recursos: patterns.md (645), implementation.md (863), tradeoffs.md (781), case-studies.md (1,564)
   - ✅ DDD, CQRS, Event Sourcing, Hexagonal Architecture
   - ✅ Validación CLI pass
   - ✅ Registry indexado

2. ✅ **devops/api-design-and-testing/** (COMPLETADO)
   - ✅ SKILL.md principal (532 líneas)
   - ✅ 4 recursos: api-types.md (1,122), design-principles.md (1,077), testing.md (1,242), best-practices.md (1,218)
   - ✅ REST, GraphQL, gRPC con testing strategies
   - ✅ Validación CLI pass
   - ✅ Registry indexado

3. ✅ **devops/ci-cd-pipelines/** (COMPLETADO)
   - ✅ SKILL.md principal (~530 líneas)
   - ✅ 4 recursos: setup.md, workflows.md, deployment.md, monitoring.md
   - ✅ GitHub Actions, GitLab CI, Jenkins pipelines
   - ✅ Validación CLI pass
   - ✅ Registry indexado

### Skills Pendientes (4/7)

4. ⏳ **quality/code-review-checklist/** (PLANIFICADO)
   - SKILL.md principal (250-350 líneas)
   - 4 recursos: checklist.md, process.md, examples.md, automation.md
   - Proceso estructurado para code reviews efectivos
   - **ETA**: 1 hora

5. ⏳ **security/security-testing-guide/** (PLANIFICADO)
   - SKILL.md principal (300-400 líneas)
   - 4 recursos: methodologies.md, tools.md, checklists.md, reporting.md
   - SAST, DAST, penetration testing, OWASP Top 10
   - **ETA**: 1.5 horas

6. ⏳ **performance/performance-optimization/** (PLANIFICADO)
   - SKILL.md principal (300-400 líneas)
   - 4 recursos: techniques.md, tools.md, metrics.md, case-studies.md
   - Frontend/backend profiling, caching, optimization
   - **ETA**: 1.5 horas

7. ⏳ **data/database-management/** (PLANIFICADO)
   - SKILL.md principal (300-400 líneas)
   - 4 recursos: design.md, migrations.md, optimization.md, backup.md
   - Schema design, migrations, optimization, backup/recovery
   - **ETA**: 1.5 horas

## Metodología de Trabajo (Basada en FASE 1)

### Estándar de Skill (Patrón Exitoso)
Cada skill debe tener:
- **SKILL.md**: 300-400 líneas (máximo 400)
- **resources/**: 4 archivos .md especializados
- **Metadatos YAML**: id, version, type, enforcement, summary
- **Ejemplos**: Código real, casos prácticos
- **Scripts**: Comandos útiles y ejecutables

### Naming Convention
- Skills: `kebab-case` (backend-architecture-patterns)
- Recursos: `kebab-case.md`
- Scripts: `kebab-case`

## Estado Actual (2025-11-02)

### Progreso General
- **Planificados**: 7 de 7 skills (100%)
- **Completados**: 3/7 skills (42.9%)
- **En progreso**: 0
- **Archivos creados**: 15 archivos (3 SKILL.md + 12 recursos)
- **Archivos target restantes**: 20 archivos (4 SKILL.md + 16 recursos)
- **Líneas creadas**: ~14,200 líneas (estimado)
- **Líneas target totales**: ~18,700 líneas (estimado)
- **Ejemplos creados**: 250+ ejemplos
- **Registry actual**: 29 skills (target: 33)

### Skills por Categoría (Target)
```
skills/
├── devops/ (3/3 planificados)
│   ├── backend-architecture-patterns/
│   ├── api-design-and-testing/
│   └── ci-cd-pipelines/
├── quality/ (1/1 planificado)
│   └── code-review-checklist/
├── security/ (1/1 planificado)
│   └── security-testing-guide/
├── performance/ (1/1 planificado)
│   └── performance-optimization/
└── data/ (1/1 planificado)
    └── database-management/
```

## Dependencias y Referencias

### Skills Existentes (Referencia)
- ✅ **FASE 1** - 7 skills completados como template
- Skills en guidelines/, generators/, test/ como referencia
- Patrón estándar validado y probado

### Archivos de Configuración
- `configs/skill-rules.json` - Añadir 7 skills
- `registry/index.json` - Regenerar (26→33 skills)
- `.cursor/hooks/hooks-config.json` - IDE integration

### Herramientas CLI
```bash
# Validación
skills-cli skills lint ./skills --strict
skills-cli skills check "task" --v2

# Indexación
skills-cli skills index ./skills --out ./registry/index.json

# Testing
pnpm test:phase3-quick
```

## Recursos Técnicos por Skill

### DevOps Pattern (3 skills)
1. **patterns/design-principles.md**: Fundamentos y principios
2. **implementation.md**: Implementación práctica paso a paso
3. **workflows/pipelines.md**: Workflows y automatización
4. **monitoring/troubleshooting.md**: Monitoring y troubleshooting

### Quality Pattern (1 skill)
1. **checklist.md**: Checklist actionable y verificable
2. **process.md**: Proceso estructurado paso a paso
3. **examples.md**: Ejemplos de buenas/malas prácticas
4. **automation.md**: Automatización y tooling

### Security Pattern (1 skill)
1. **methodologies.md**: Metodologías de testing
2. **tools.md**: Herramientas especializadas
3. **checklists.md**: Checklists por vulnerability type
4. **reporting.md**: Formatos de reporte y documentación

### Performance Pattern (1 skill)
1. **techniques.md**: Técnicas de optimización
2. **tools.md**: Herramientas de profiling
3. **metrics.md**: Métricas y KPIs
4. **case-studies.md**: Casos de estudio reales

### Data Pattern (1 skill)
1. **design.md**: Principios de diseño
2. **migrations.md**: Gestión de migraciones
3. **optimization.md**: Optimización de queries y schema
4. **backup.md**: Backup y recovery

## Workflow de Validación

### Checklist por Skill
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
- **CLOOP**: Metodología Core
- **Hooks**: Pre-invoke y stop hooks para IDE integration
- **PM2**: Gestión de servicios

### FASE 1 (Completada ✅)
- **Resultado**: 7 skills + 35 archivos + ~3,500 líneas
- **Registry**: 26 skills indexados
- **Validación**: CLI pass completo

### FASE 2 (Actual)
- **Objetivo**: Expandir con 7 skills especializados
- **Enfoque**: DevOps, Architecture, Quality, Security, Performance, Data
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

## Estrategia de Ejecución por Fases

### Phase 2A: DevOps (3 skills - 4.5h)
1. **backend-architecture-patterns** (1.5h)
   - Crear estructura base
   - Implementar 4 recursos
   - Validar con lint

2. **api-design-and-testing** (1.5h)
   - Crear estructura
   - Implementar 4 recursos
   - Validar con lint

3. **ci-cd-pipelines** (1.5h)
   - Crear estructura
   - Implementar 4 recursos
   - Validar con lint

### Phase 2B: Quality & Security (2 skills - 2.5h)
4. **code-review-checklist** (1h)
   - Crear estructura
   - Implementar 4 recursos
   - Validar con lint

5. **security-testing-guide** (1.5h)
   - Crear estructura
   - Implementar 4 recursos
   - Validar con lint

### Phase 2C: Performance & Data (2 skills - 3h)
6. **performance-optimization** (1.5h)
   - Crear estructura
   - Implementar 4 recursos
   - Validar con lint

7. **database-management** (1.5h)
   - Crear estructura
   - Implementar 4 recursos
   - Validar con lint

### Phase 2D: Configuración (1h)
8. **Actualizar configuraciones** (30 min)
   - Añadir 7 skills a `configs/skill-rules.json`
   - Regenerar `registry/index.json`
   - Verificar activation rules

9. **Validación final** (30 min)
   - `skills-cli skills lint ./skills --strict`
   - `pnpm test:phase3-quick`
   - Actualizar dev-docs

## Estado Final - Verificación

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
- **Líneas totales**: ~2,500+ líneas de documentación
- **Ejemplos de código**: 150+ ejemplos ejecutables
- **Tiempo estimado total**: ~6 horas

## Verificación Target (Post-FASE 2)

```bash
# Todos los skills (incluyendo FASE 1 + 2)
find skills -name "SKILL.md" | wc -l
# → 33 skills totales

# Skills específicos de FASE 2
find skills -name "SKILL.md" | grep -E "(backend-architecture-patterns|api-design-and-testing|ci-cd-pipelines|code-review-checklist|security-testing-guide|performance-optimization|database-management)"
# → 7 skills

# Contar recursos
find skills -path "*/devops/*/resources" -o -path "*/quality/*/resources" -o -path "*/security/*/resources" -o -path "*/performance/*/resources" -o -path "*/data/*/resources" | wc -l
# → 28 archivos de recursos (7 skills × 4 recursos)

# Verificar registry
jq '.skills | length' registry/index.json
# → 33 skills indexados

# Validar skills
node packages/skills-cli/dist/index.js skills lint ./skills --strict
# → Validación pass

# Re-index si necesario
node packages/skills-cli/dist/index.js skills index ./skills --out ./registry/index.json
```

## Resumen de Archivos Target

### Estructura Final
```
skills/
├── devops/
│   ├── backend-architecture-patterns/
│   │   ├── SKILL.md (300-400 líneas)
│   │   └── resources/
│   │       ├── patterns.md
│   │       ├── implementation.md
│   │       ├── tradeoffs.md
│   │       └── case-studies.md
│   ├── api-design-and-testing/
│   │   ├── SKILL.md (300-400 líneas)
│   │   └── resources/
│   │       ├── api-types.md
│   │       ├── design-principles.md
│   │       ├── testing.md
│   │       └── best-practices.md
│   └── ci-cd-pipelines/
│       ├── SKILL.md (300-400 líneas)
│       └── resources/
│           ├── setup.md
│           ├── workflows.md
│           ├── deployment.md
│           └── monitoring.md
├── quality/
│   └── code-review-checklist/
│       ├── SKILL.md (250-350 líneas)
│       └── resources/
│           ├── checklist.md
│           ├── process.md
│           ├── examples.md
│           └── automation.md
├── security/
│   └── security-testing-guide/
│       ├── SKILL.md (300-400 líneas)
│       └── resources/
│           ├── methodologies.md
│           ├── tools.md
│           ├── checklists.md
│           └── reporting.md
├── performance/
│   └── performance-optimization/
│       ├── SKILL.md (300-400 líneas)
│       └── resources/
│           ├── techniques.md
│           ├── tools.md
│           ├── metrics.md
│           └── case-studies.md
└── data/
    └── database-management/
        ├── SKILL.md (300-400 líneas)
        └── resources/
            ├── design.md
            ├── migrations.md
            ├── optimization.md
            └── backup.md
```

## TODO LIST (FASE 2)

### DevOps Skills (3)
1. [✅] Crear estructura para devops/backend-architecture-patterns
2. [✅] Crear recursos técnicos para backend-architecture-patterns
3. [✅] Crear estructura para devops/api-design-and-testing
4. [✅] Crear recursos técnicos para api-design-and-testing
5. [✅] Crear estructura para devops/ci-cd-pipelines
6. [✅] Crear recursos técnicos para ci-cd-pipelines

### Quality & Security (2)
7. [ ] Crear estructura para quality/code-review-checklist
8. [ ] Crear recursos técnicos para code-review-checklist
9. [ ] Crear estructura para security/security-testing-guide
10. [ ] Crear recursos técnicos para security-testing-guide

### Performance & Data (2)
11. [ ] Crear estructura para performance/performance-optimization
12. [ ] Crear recursos técnicos para performance-optimization
13. [ ] Crear estructura para data/database-management
14. [ ] Crear recursos técnicos para database-management

### Configuración (2)
15. [ ] Actualizar configs/skill-rules.json con nuevos skills
16. [ ] Actualizar registry/index.json con metadatos
17. [ ] Indexar todos los skills correctamente
18. [ ] Ejecutar validación final y dev-docs

## Fechas Importantes

- **Inicio FASE 2**: 2025-11-02 16:00 (planificado)
- **DevOps completados (target)**: 2025-11-02 19:00
- **Quality & Security completados (target)**: 2025-11-02 20:30
- **Performance & Data completados (target)**: 2025-11-02 22:00
- **FASE 2 FINALIZADA**: 100% (target)

## Archivos de Estado

- **Este archivo**: `/dev/active/skills-fase2/task.md`
- **Contexto**: `/dev/active/skills-fase2/context.md`
- **Plan**: `/dev/active/skills-fase2/plan.md`
- **FASE 1 completada**: `/dev/active/continuacion-skills-fase1/`

## Si Necesitas Verificar Estado

```bash
# Verificar todos los skills
find skills -name "SKILL.md" | wc -l

# Verificar skills de FASE 2
find skills -name "SKILL.md" | grep -E "(backend-architecture-patterns|api-design-and-testing|ci-cd-pipelines|code-review-checklist|security-testing-guide|performance-optimization|database-management)"

# Contar recursos
find skills -path "*/devops/*/resources" -o -path "*/quality/*/resources" -o -path "*/security/*/resources" -o -path "*/performance/*/resources" -o -path "*/data/*/resources" | wc -l

# Verificar registry
jq '.skills | length' registry/index.json

# Lint skills
node packages/skills-cli/dist/index.js skills lint ./skills --strict

# Re-index si necesitas
node packages/skills-cli/dist/index.js skills index ./skills --out ./registry/index.json
```

## Estándar de Calidad (FASE 2)

### Patrón de Skill Target
- **SKILL.md**: 300-400 líneas (máximo 400)
- **resources/**: 4 archivos .md especializados
- **Metadatos**: YAML frontmatter completo
- **Ejemplos**: Código real y casos de uso
- **Scripts**: Comandos ejecutables

### Estándar de Calidad
- ✅ Naming convention: kebab-case
- ✅ Contenido técnico especializado
- ✅ Ejemplos de código 150+
- ✅ Recursos detallados
- ❌ No usar emojis en contenido
- ❌ No superar 400 líneas en SKILL.md

---

**Estado**: 🚀 FASE 2 EN PROGRESO
**Progreso**: 3/7 skills (42.9%)
**Archivos creados**: 15 (3 SKILL.md + 12 recursos)
**Líneas creadas**: ~14,200 líneas
**Registry actual**: 29 skills (target: 33)
**Próximo**: Quality & Security Skills (code-review-checklist)
