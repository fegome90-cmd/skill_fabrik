# Merge Plan: feature/v2-rules-compliance

**Date**: 2025-01-14
**Source Branch**: `feature/v2-rules-compliance`
**Target Branch**: `main`
**Status**: ⚠️ COMPLEX MERGE - Conflicts Detected
**Risk Level**: MEDIUM-HIGH

---

## Executive Summary

La branch `feature/v2-rules-compliance` contiene **34 commits** con mejoras significativas de "Zero Technical Debt" incluyendo:

- ✅ Sistema de monitoreo de performance (TDD)
- ✅ Mejoras en daemon y router (v2)
- ✅ Framework completo de forensic analysis
- ✅ Sistema de code quality upgrade
- ✅ Documentación extensiva

**Problemas Detectados**:
- ⚠️ **10 conflictos** de merge con main
- ⚠️ Archivos borrados en main (PR #21 cleanup) pero modificados en feature
- ⚠️ Conflictos de contenido en package.json, pnpm-lock.yaml
- ⚠️ Branch muy grande: **369 archivos** (+96,550 / -4,477 líneas)

---

## Análisis de la Branch

### Estadísticas

```
Commits ahead of main: 34
Files changed: 369
Insertions: +96,550
Deletions: -4,477
Size: MASSIVE (requiere revisión cuidadosa)
```

### Categorías de Cambios

#### 1. **Code Quality Upgrade** (Nuevo Directorio)
```
code-quality-upgrade/
├── config/                  # Reglas de calidad
├── dev-docs/                # Plan, context, tasks
├── scripts/                 # Scripts de migración
├── src/                     # Config TypeScript/ESLint
├── test/                    # Tests integration + unit
└── package.json             # Dependencias (jest, typescript, etc.)
```

**Contenido**: Sistema completo de migración de ESLint con TDD
- Migration scripts (portable + interactive)
- Performance monitoring system
- 100% test coverage achieved
- Zero technical debt compliance

#### 2. **Forensic Analysis** (Expansión Masiva)
```
docs/inventario/architecture-analysis/forensic-analysis/
├── config/                  # rules_forense_v2.json
├── consolidated-tests/      # Tests TDD
├── dev-docs/                # Context, plan, tasks
├── docs/                    # Guides (Clean Architecture, etc.)
├── plan-refactorizacion-skills/  # Refactor planning
├── reports/                 # Validation reports
├── src/                     # Detection, observability, pipeline
└── package.json
```

**Contenido**: Framework forense completo con 100+ archivos
- Signal-based detector
- Forensic observability system
- Advanced quality gates
- Guardrails y circuit breaker
- Quantitative validation scripts

#### 3. **Daemon & Router V2** (Mejoras Core)

**Daemon**:
- `packages/daemon/src/daemon-v2.ts` (776 líneas)
- `packages/daemon/src/__tests__/daemon-v2.test.ts` (533 líneas)
- Health check system (855 líneas)
- PM2 cluster manager (562 líneas)
- Graceful shutdown manager (574 líneas)

**Router**:
- `packages/router/src/router-v2.ts` (694 líneas)
- `packages/router/src/__tests__/router-v2.test.ts` (432 líneas)
- Performance monitor (660 líneas)
- Metrics collector (454 líneas)
- Load balancer (381 líneas)
- Cache warmer (558 líneas)
- Circuit breaker (546 líneas)

#### 4. **Documentación** (Extensiva)
- Inventario 2025Q4 completo
- Análisis de arquitectura
- Guías de integración (MemTech, Skills Fabrik API)
- Refactor investigation docs

#### 5. **CI/CD & Configuración**

**`.github/workflows/ci.yml`**:
```diff
- uses: actions/checkout@v4
+ uses: actions/checkout@v5
- uses: actions/setup-node@v4
+ uses: actions/setup-node@v6
```

**`package.json`** (Cambios Clave):
```diff
+ SF_DASHBOARD_PORT=0 SF_DASHBOARD_WS_PORT=0  # En todos los tests
+ @types/supertest: ^6.0.3
+ supertest: ^7.1.4
- @fastify/cors: ^8.4.0
+ @fastify/cors: ^8.5.0
+ pnpm.overrides: { "esbuild@<=0.24.2": ">=0.25.0" }
```

---

## Conflictos Detectados

### Tipo A: Archivos Borrados en Main (6 conflictos)

| Archivo | Status | Acción Requerida |
|---------|--------|------------------|
| `.claude/settings.local.json` | Deleted in main (PR #21) | **SKIP** - No restaurar |
| `.cursor/hooks/hooks-config.json` | Deleted in main (PR #21) | **SKIP** - No restaurar |
| `.cursor/hooks/stop.mjs` | Deleted in main (PR #21) | **SKIP** - No restaurar |
| `.sf/project-index.json` | Deleted in main (cache) | **SKIP** - Regenera automáticamente |
| `dev/active/performance-optimization/apply-optimizations.mjs` | Deleted in main (temp) | **SKIP** - Archivo temporal |
| `dev/active/performance-optimization/benchmark-optimized.mjs` | Deleted in main (temp) | **SKIP** - Archivo temporal |

**Resolución**: Aceptar las eliminaciones de main. Estos archivos fueron intencionalmente removidos en PR #21 (cleanup de cache, configs personales y archivos temporales).

### Tipo B: Conflictos de Contenido (4 conflictos)

#### 1. `.husky/pre-commit`
**Conflicto**: Ambos lados modificados

**Main** (actual):
```bash
# Simple pre-commit con security checks
```

**Feature Branch**:
```bash
# Versión extendida con más validaciones
```

**Resolución**: **REVISAR MANUAL** - Combinar ambas versiones, priorizando security checks de main.

#### 2. `package.json`
**Conflicto**: Scripts y dependencias

**Cambios en feature/v2-rules-compliance**:
- ✅ Añade `SF_DASHBOARD_PORT=0` a tests (bueno - evita conflictos de puertos)
- ✅ Actualiza `@fastify/cors` 8.4.0 → 8.5.0 (bueno)
- ✅ Añade `supertest` + `@types/supertest` (bueno para tests)
- ✅ Añade override de `esbuild` (bueno - security fix)
- ❓ Cambia orden de builds

**Cambios en main** (recientes):
- ✅ Ya tiene `@fastify/cors: ^8.5.0` (merged en PR #28)

**Resolución**: **MERGE INTELIGENTE**
- Mantener `SF_DASHBOARD_PORT=0` en tests
- Mantener versión de `@fastify/cors` de main (ya actualizada)
- Añadir dependencias de testing (supertest)
- Añadir override de esbuild
- Combinar scripts cuidadosamente

#### 3. `packages/router/package.json`
**Conflicto**: Dependencias

**Resolución**: **REVISAR MANUAL** - Verificar compatibilidad de versiones

#### 4. `pnpm-lock.yaml`
**Conflicto**: Lock file

**Resolución**: **REGENERAR** - Después de resolver package.json:
```bash
pnpm install --no-frozen-lockfile
```

---

## Riesgos Identificados

### 🔴 Riesgo Alto

1. **Branch Tamaño Excesivo**
   - **Problema**: 369 archivos, 96K+ líneas
   - **Riesgo**: Difícil de revisar, alta probabilidad de bugs ocultos
   - **Mitigación**: Split en múltiples PRs temáticos

2. **Múltiples Archivos `.eslintrc.json.backup.*`**
   - **Problema**: 14 backups de .eslintrc.json en root
   - **Riesgo**: Contaminación del repositorio
   - **Mitigación**: NO MERGEAR estos archivos

3. **Código Nuevo Sin Validar**
   - **Problema**: daemon-v2, router-v2 no probados en main
   - **Riesgo**: Breaking changes ocultos
   - **Mitigación**: Tests E2E completos antes de merge

### 🟡 Riesgo Medio

4. **Conflictos de Dependencias**
   - **Problema**: Cambios en package.json + pnpm-lock.yaml
   - **Riesgo**: Incompatibilidades de versiones
   - **Mitigación**: Testing exhaustivo post-merge

5. **CI/CD Changes**
   - **Problema**: Cambios en .github/workflows/ci.yml
   - **Riesgo**: Workflows rotos
   - **Mitigación**: Validar workflows en PR

### 🟢 Riesgo Bajo

6. **Documentación Extensiva**
   - **Problema**: Muchos docs nuevos
   - **Riesgo**: Mínimo (solo docs)
   - **Mitigación**: Ninguna necesaria

---

## Estrategia de Merge Recomendada

### ⛔ NO RECOMENDADO: Merge Directo

**Razones**:
1. Branch demasiado grande para revisar safety
2. Múltiples conflictos complejos
3. Riesgo de introducir bugs silenciosos
4. Dificulta rollback si hay problemas

### ✅ RECOMENDADO: Split en PRs Temáticos

#### Fase 1: Preparación (1-2 horas)

**Crear branch de staging desde main**:
```bash
git checkout main
git pull origin main
git checkout -b staging/v2-rules-compliance
```

**Resolver conflictos previos**:
1. Revisar archivos borrados en main → decidir no restaurar
2. Preparar resolución de package.json
3. Documentar cambios necesarios

#### Fase 2: Split Temático (4-6 horas)

**PR #1: CI/CD & Dependencies** (Priority: P0)
```bash
git checkout -b feat/ci-cd-improvements-from-v2
```

**Archivos a incluir**:
- `.github/workflows/ci.yml` (actualizado)
- `package.json` (solo dependencias + test scripts con SF_DASHBOARD_PORT)
- `packages/router/package.json` (solo dependencias)
- `packages/daemon/package.json` (solo dependencias)
- Regenerar `pnpm-lock.yaml`

**Validación**:
- Build completo
- Tests completos
- CI pipeline verde

---

**PR #2: Code Quality Upgrade** (Priority: P1)
```bash
git checkout -b feat/code-quality-upgrade-system
```

**Archivos a incluir**:
- `code-quality-upgrade/` (completo)

**Validación**:
- Tests del nuevo sistema
- No afecta código existente

---

**PR #3: Daemon V2** (Priority: P1)
```bash
git checkout -b feat/daemon-v2-improvements
```

**Archivos a incluir**:
- `packages/daemon/src/daemon-v2.ts`
- `packages/daemon/src/__tests__/daemon-v2.test.ts`
- `packages/daemon/src/orchestration/`
- `packages/daemon/README-V2.md`

**Validación**:
- Tests daemon-v2 pasan
- Backward compatibility mantenida
- Integration tests

---

**PR #4: Router V2** (Priority: P1)
```bash
git checkout -b feat/router-v2-improvements
```

**Archivos a incluir**:
- `packages/router/src/router-v2.ts`
- `packages/router/src/__tests__/router-v2.test.ts`
- `packages/router/src/cache/`
- `packages/router/src/circuit-breaker/`
- `packages/router/src/load-balancer/`
- `packages/router/src/metrics/`
- `packages/router/src/performance/`

**Validación**:
- Tests router-v2 pasan
- Backward compatibility
- Load tests

---

**PR #5: Forensic Analysis Framework** (Priority: P2)
```bash
git checkout -b feat/forensic-analysis-expansion
```

**Archivos a incluir**:
- `docs/inventario/architecture-analysis/forensic-analysis/` (expansión)
- `docs/inventario/plan-refactorizacion-skills/`

**Validación**:
- Solo documentación y tests aislados
- No afecta código de producción

---

**PR #6: Documentation & Inventory** (Priority: P2)
```bash
git checkout -b docs/2025q4-inventory-complete
```

**Archivos a incluir**:
- `docs/inventario/2025Q4/`
- `docs/inventario/refactor-investigation/`
- `docs/integracion/`
- Otros docs

**Validación**:
- Ninguna - solo docs

---

**PR #7: Scripts & Utilities** (Priority: P2)
```bash
git checkout -b feat/integration-scripts
```

**Archivos a incluir**:
- `scripts/integration/`
- `scripts/pre-deployment-check*.sh`
- Otros scripts nuevos

**Validación**:
- Ejecutar scripts en dry-run
- No breaking changes

---

#### Fase 3: Limpieza (30 min)

**Archivos a EXCLUIR permanentemente**:
```
# NO MERGEAR:
.eslintrc.json.backup.* (todos los 14 backups)
.claude/settings.local.json
.cursor/hooks/*
.sf/project-index.json
dev/active/ (archivos temporales)
data/agent_memory.db (archivo de cache)
```

**Asegurar en .gitignore**:
```gitignore
# Cache
.sf/
data/*.db

# Personal configs
.claude/settings.local.json
.cursor/hooks/hooks-config.json
.cursor/hooks/*.mjs

# Backups
*.backup.*
*.bak
```

---

## Plan de Ejecución Paso a Paso

### Semana 1: Preparación

**Día 1-2**: Análisis y documentación
- ✅ Análisis completo (este documento)
- [ ] Crear issues en GitHub para cada PR temático
- [ ] Validar con equipo la estrategia de split

**Día 3**: Setup de branches
- [ ] Crear staging branch
- [ ] Crear 7 feature branches temáticas
- [ ] Documentar orden de merge

### Semana 2: PRs Core (P0-P1)

**Día 1**: PR #1 - CI/CD & Dependencies
- [ ] Cherry-pick cambios relevantes
- [ ] Resolver conflictos de package.json
- [ ] Regenerar pnpm-lock.yaml
- [ ] Testing completo
- [ ] Create PR + revisión
- [ ] Merge

**Día 2**: PR #2 - Code Quality Upgrade
- [ ] Cherry-pick code-quality-upgrade/
- [ ] Testing aislado
- [ ] Create PR + revisión
- [ ] Merge

**Día 3**: PR #3 - Daemon V2
- [ ] Cherry-pick daemon-v2 files
- [ ] Integration testing
- [ ] Performance testing
- [ ] Create PR + revisión
- [ ] Merge

**Día 4**: PR #4 - Router V2
- [ ] Cherry-pick router-v2 files
- [ ] Integration testing con daemon-v2
- [ ] Load testing
- [ ] Create PR + revisión
- [ ] Merge

### Semana 3: PRs Secundarios (P2)

**Día 1**: PR #5 - Forensic Analysis
**Día 2**: PR #6 - Documentation
**Día 3**: PR #7 - Scripts

### Semana 4: Validación Final

**Día 1-2**: E2E Testing
- [ ] Test suite completo
- [ ] Performance benchmarks
- [ ] Security audit

**Día 3**: Deployment
- [ ] Merge final a main
- [ ] Tag release
- [ ] Deployment

---

## Comandos Útiles

### Cherry-Pick Selectivo

```bash
# Listar commits de la branch
git log origin/feature/v2-rules-compliance --oneline

# Cherry-pick específico
git cherry-pick <commit-hash>

# Cherry-pick con archivos específicos
git checkout origin/feature/v2-rules-compliance -- path/to/file
```

### Resolver Conflictos

```bash
# Ver conflictos
git status

# Resolver: mantener main (theirs)
git checkout --theirs path/to/file

# Resolver: mantener feature (ours)
git checkout --ours path/to/file

# Resolver: manual
git diff HEAD
# Edit file
git add path/to/file
```

### Regenerar pnpm-lock.yaml

```bash
# Después de resolver package.json
rm pnpm-lock.yaml
pnpm install --no-frozen-lockfile
git add pnpm-lock.yaml
```

---

## Checklist de Validación

### Pre-Merge (Cada PR)

- [ ] Build exitoso (`pnpm -w build`)
- [ ] Tests pasan (`pnpm test:phase3-quick`)
- [ ] Lint pass (`pnpm lint`)
- [ ] No archivos excluidos incluidos accidentalmente
- [ ] CHANGELOG.md actualizado (si aplica)

### Post-Merge (Cada PR)

- [ ] CI pipeline verde
- [ ] No regresiones en tests existentes
- [ ] Performance no degradada
- [ ] Documentation actualizada

### Final (Después de Todos los PRs)

- [ ] E2E tests completos
- [ ] Load testing
- [ ] Security scan
- [ ] Smoke tests en staging
- [ ] Rollback plan documentado

---

## Rollback Strategy

### Si PR Individual Falla

```bash
# Revert el merge commit
git revert <merge-commit-hash>
git push origin main
```

### Si Múltiples PRs Causan Problemas

```bash
# Crear hotfix branch desde commit pre-merge
git checkout <commit-before-pr1>
git checkout -b hotfix/rollback-v2-rules

# Cherry-pick fixes necesarios
# Push y crear PR
```

---

## Comunicación

### Stakeholders

1. **Equipo de desarrollo**: Informar sobre split de PRs
2. **QA**: Coordinar testing de cada PR
3. **DevOps**: Coordinar CI/CD changes

### Timeline

- **Inicio**: Inmediatamente
- **PR #1-#4** (core): Semana 1-2
- **PR #5-#7** (secundarios): Semana 3
- **Deployment**: Semana 4

---

## Conclusión

**Recomendación**: ⛔ **NO MERGEAR** directamente `feature/v2-rules-compliance`

**Plan Recomendado**: ✅ **Split en 7 PRs temáticos** con orden de precedencia

**Beneficios del Split**:
1. ✅ Revisiones más fáciles y completas
2. ✅ Testing más focusado
3. ✅ Rollback granular si hay problemas
4. ✅ Menor riesgo de introducir bugs
5. ✅ Mejor tracking de cambios

**Effort Estimado**:
- Preparación: 4-6 horas
- Ejecución: 3-4 semanas (part-time)
- Total: ~40-60 horas

**Risk vs Reward**:
- **Direct Merge**: Alto riesgo, baja confianza
- **Split PRs**: Riesgo controlado, alta confianza ✅

---

**Prepared By**: Claude (Merge Safety Analyst)
**Date**: 2025-01-14
**Version**: 1.0
**Status**: Awaiting Approval for Split Strategy
