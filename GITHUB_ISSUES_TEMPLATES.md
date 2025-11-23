# GitHub Issues Templates - v2-rules-compliance Split Strategy

Crea estos 7 issues en GitHub para trackear los PRs temáticos.

---

## Issue #1: CI/CD & Dependencies Update (P0)

**Title**: `feat: update CI/CD workflows and dependencies from v2-rules-compliance`

**Labels**: `priority: P0`, `type: infrastructure`, `affects: ci-cd`

**Description**:
```markdown
## Objetivo

Actualizar workflows de CI/CD y dependencias críticas desde `feature/v2-rules-compliance`.

## Cambios Incluidos

### CI/CD (.github/workflows/ci.yml)
- ✅ Actualizar actions/checkout@v4 → v5
- ✅ Actualizar actions/setup-node@v4 → v6
- ✅ Mejorar estructura del workflow
- ✅ Añadir variables de entorno centralizadas

### Dependencies (package.json)
- ✅ Añadir `SF_DASHBOARD_PORT=0 SF_DASHBOARD_WS_PORT=0` a todos los test scripts
- ✅ Actualizar `@fastify/cors` 8.4.0 → 8.5.0
- ✅ Añadir `supertest@^7.1.4` y `@types/supertest@^6.0.3`
- ✅ Añadir override de esbuild para security fix

### Lock File
- ✅ Regenerar `pnpm-lock.yaml` con nuevas dependencias

## Validación

- [ ] `pnpm install` exitoso
- [ ] `pnpm -w build` pasa
- [ ] `pnpm test:phase3-quick` pasa
- [ ] CI pipeline verde
- [ ] No regresiones en tests

## Archivos Modificados

- `.github/workflows/ci.yml`
- `package.json`
- `packages/router/package.json` (si aplica)
- `packages/daemon/package.json` (si aplica)
- `pnpm-lock.yaml`

## Estimación

⏱️ 2-3 horas

## Dependencias

Ninguna - Este es el primer PR de la serie

## Bloquea

- Issue #2, #3, #4, #5, #6, #7 (todos dependen de este)
```

---

## Issue #2: Code Quality Upgrade System (P1)

**Title**: `feat: add code quality upgrade system with ESLint migration`

**Labels**: `priority: P1`, `type: feature`, `affects: code-quality`

**Description**:
```markdown
## Objetivo

Añadir sistema completo de Code Quality Upgrade con scripts de migración de ESLint.

## Cambios Incluidos

### Nuevo Directorio Completo
- `code-quality-upgrade/` (todo el directorio)
  - Config files (rules, project config)
  - Migration scripts (portable + interactive)
  - Performance monitoring system
  - Tests (integration + unit)
  - Documentation

### Features
- ✅ ESLint migration scripts con TDD
- ✅ Backup/rollback automation
- ✅ Performance monitoring
- ✅ 100% test coverage
- ✅ Interactive mode para confirmaciones

## Validación

- [ ] Tests del sistema pasan
- [ ] Scripts ejecutan en dry-run
- [ ] No afecta código existente
- [ ] Documentación clara

## Archivos Nuevos

Todos en `code-quality-upgrade/`:
- config/
- scripts/
- src/
- test/
- package.json
- README.md

## Estimación

⏱️ 3-4 horas (revisión + testing)

## Dependencias

- Depende de: Issue #1

## Bloquea

Ninguno (sistema aislado)
```

---

## Issue #3: Daemon V2 with Advanced Features (P1)

**Title**: `feat: add daemon-v2 with health checks, PM2 manager, and graceful shutdown`

**Labels**: `priority: P1`, `type: feature`, `affects: daemon`

**Description**:
```markdown
## Objetivo

Añadir Daemon V2 con features avanzadas de orchestración y resiliencia.

## Cambios Incluidos

### Core Daemon V2
- `packages/daemon/src/daemon-v2.ts` (776 líneas)
- `packages/daemon/src/__tests__/daemon-v2.test.ts` (533 líneas)
- `packages/daemon/README-V2.md`

### Orchestration Modules
- `packages/daemon/src/orchestration/health-check-system.ts` (855 líneas)
- `packages/daemon/src/orchestration/pm2-cluster-manager.ts` (562 líneas)
- `packages/daemon/src/orchestration/graceful-shutdown-manager.ts` (574 líneas)

### Configuration
- `packages/daemon/tsconfig.v2.json`
- `packages/daemon/vitest.config.ts`
- `packages/daemon/ecosystem.config.js`

### Utilities
- `packages/daemon/src/constants/time-constants.ts`

## Features

- ✅ Health check system avanzado
- ✅ PM2 cluster management
- ✅ Graceful shutdown con cleanup
- ✅ Real-time dashboard mejorado
- ✅ Comprehensive testing

## Validación

- [ ] `pnpm --filter @skills-fabrik/daemon build` pasa
- [ ] Tests daemon-v2 pasan
- [ ] Backward compatibility verificada
- [ ] Integration tests con daemon existente
- [ ] Health checks funcionan
- [ ] PM2 clustering funciona

## Archivos Modificados/Nuevos

- `packages/daemon/src/` (varios nuevos)
- `packages/daemon/package.json` (actualizar deps si necesario)

## Estimación

⏱️ 6-8 horas

## Dependencias

- Depende de: Issue #1

## Bloquea

- Issue #4 (Router V2 se integra con Daemon V2)
```

---

## Issue #4: Router V2 with Performance & Load Balancing (P1)

**Title**: `feat: add router-v2 with load balancer, cache warmer, and circuit breaker`

**Labels**: `priority: P1`, `type: feature`, `affects: router`

**Description**:
```markdown
## Objetivo

Añadir Router V2 con features avanzadas de performance, caching y resiliencia.

## Cambios Incluidos

### Core Router V2
- `packages/router/src/router-v2.ts` (694 líneas)
- `packages/router/src/__tests__/router-v2.test.ts` (432 líneas)

### Performance Modules
- `packages/router/src/performance/performance-monitor.ts` (660 líneas)
- `packages/router/src/metrics/metrics-collector.ts` (454 líneas)
- `packages/router/src/cache/cache-warmer.ts` (558 líneas)

### Resiliency Modules
- `packages/router/src/circuit-breaker/advanced-circuit-breaker.ts` (546 líneas)
- `packages/router/src/load-balancer/load-balancer.ts` (381 líneas)

### Integration
- `packages/router/src/memtech-integration.ts` (320 líneas)

### Updates to Existing
- `packages/router/src/logger.ts` (mejoras)
- `packages/router/src/pre-invoke.ts` (mejoras)
- `packages/router/src/server.ts` (mejoras)
- `packages/router/src/stop.ts` (mejoras)

## Features

- ✅ Advanced performance monitoring
- ✅ Intelligent load balancing
- ✅ Cache warming strategies
- ✅ Circuit breaker pattern
- ✅ Metrics collection
- ✅ MemTech integration

## Validación

- [ ] `pnpm --filter @skills-fabrik/router build` pasa
- [ ] Tests router-v2 pasan
- [ ] Integration tests con daemon-v2
- [ ] Load tests (< 500ms response time)
- [ ] Circuit breaker funciona correctamente
- [ ] Cache warming efectivo
- [ ] Backward compatibility

## Archivos Modificados/Nuevos

- `packages/router/src/` (varios nuevos + updates)
- `packages/router/package.json` (actualizar deps si necesario)

## Estimación

⏱️ 6-8 horas

## Dependencias

- Depende de: Issue #1, Issue #3

## Bloquea

Ninguno
```

---

## Issue #5: Forensic Analysis Framework Expansion (P2)

**Title**: `docs: expand forensic analysis framework with plan and tools`

**Labels**: `priority: P2`, `type: documentation`, `affects: forensic-analysis`

**Description**:
```markdown
## Objetivo

Expandir el framework de Forensic Analysis con herramientas, scripts de validación y plan de refactorización.

## Cambios Incluidos

### Expansión de Forensic Analysis
- `docs/inventario/architecture-analysis/forensic-analysis/` (expansión masiva)
  - config/ (rules_forense_v2.json actualizado)
  - consolidated-tests/ (nuevos tests TDD)
  - src/ (detection, observability, pipeline, etc.)
  - reports/ (validation reports)
  - docs/ (Clean Architecture, etc.)

### Plan de Refactorización
- `docs/inventario/plan-refactorizacion-skills/`
  - Config y validación
  - Scripts de preparación
  - Tests

### Otros Docs
- Varios archivos de soporte y configuración

## Features

- ✅ Signal-based detector
- ✅ Forensic observability system
- ✅ Advanced quality gates
- ✅ Guardrails y circuit breaker
- ✅ Validation scripts
- ✅ Refactor planning tools

## Validación

- [ ] Tests aislados pasan
- [ ] Scripts ejecutan correctamente
- [ ] No afecta código de producción
- [ ] Documentación clara

## Archivos Nuevos

Todos en:
- `docs/inventario/architecture-analysis/forensic-analysis/`
- `docs/inventario/plan-refactorizacion-skills/`

## Estimación

⏱️ 4-5 horas (revisión)

## Dependencias

- Depende de: Issue #1

## Bloquea

Ninguno (documentación aislada)
```

---

## Issue #6: 2025Q4 Inventory and Documentation (P2)

**Title**: `docs: add 2025Q4 inventory, integration guides, and refactor investigation`

**Labels**: `priority: P2`, `type: documentation`

**Description**:
```markdown
## Objetivo

Añadir documentación completa del inventario 2025Q4, guías de integración y análisis de refactorización.

## Cambios Incluidos

### Inventario 2025Q4
- `docs/inventario/2025Q4/` (completo)
  - Context, plan, tasks
  - Outputs y prompts
  - Raw files y skills inventario

### Integration Guides
- `docs/integracion/`
  - MemTech integration
  - Skills Fabrik API integration
  - Connection summaries

### Refactor Investigation
- `docs/inventario/refactor-investigation/`
  - Executive summary
  - ADR decisions
  - Planning docs
  - Tools y scripts

### Other Docs
- Architecture analysis
- Skill audits
- PM2 inventario
- Router/Daemon arquitectura

## Validación

- [ ] Documentación clara y completa
- [ ] Links funcionan
- [ ] Formato consistente
- [ ] No archivos duplicados

## Archivos Nuevos

Todos en:
- `docs/inventario/2025Q4/`
- `docs/inventario/refactor-investigation/`
- `docs/integracion/`
- Varios otros en `docs/inventario/`

## Estimación

⏱️ 2-3 horas (revisión)

## Dependencias

- Depende de: Issue #1

## Bloquea

Ninguno
```

---

## Issue #7: Integration Scripts and Pre-Deployment Checks (P2)

**Title**: `feat: add integration scripts and pre-deployment validation`

**Labels**: `priority: P2`, `type: tooling`

**Description**:
```markdown
## Objetivo

Añadir scripts de integración con APIs externas y checks de pre-deployment.

## Cambios Incluidos

### Integration Scripts
- `scripts/integration/generate-pmv2-prompt.py`
- `scripts/integration/memtech-client.py`
- `scripts/integration/skills-fabrik-api-client.py`

### Pre-Deployment Checks
- `scripts/pre-deployment-check.sh`
- `scripts/pre-deployment-check-fixed.sh`
- `scripts/pre-deployment-check-p0.sh`
- `scripts/pre-deployment-check-evidence.sh`

### Other Scripts
- `scripts/cleanup-repo.sh`
- Updates a scripts existentes

### Test Scripts
- `simple-daemon-test.mjs`
- Updates a test-scripts existentes

## Features

- ✅ Python clients para MemTech y Skills Fabrik API
- ✅ PMv2 prompt generator
- ✅ Pre-deployment validation scripts
- ✅ Repository cleanup utilities

## Validación

- [ ] Python scripts ejecutan (dry-run)
- [ ] Bash scripts ejecutan sin errores
- [ ] Pre-deployment checks funcionan
- [ ] No breaking changes

## Archivos Nuevos/Modificados

- `scripts/integration/` (nuevos)
- `scripts/pre-deployment-check*.sh` (nuevos)
- `scripts/cleanup-repo.sh` (nuevo)
- Varios updates menores

## Estimación

⏱️ 2-3 horas

## Dependencias

- Depende de: Issue #1

## Bloquea

Ninguno
```

---

## Orden de Ejecución

```
Issue #1 (P0) → Base para todos
    ├─→ Issue #2 (P1) → Independiente
    ├─→ Issue #3 (P1) → Daemon V2
    │       └─→ Issue #4 (P1) → Router V2 (integra con Daemon)
    ├─→ Issue #5 (P2) → Docs/Forensic
    ├─→ Issue #6 (P2) → Docs/Inventory
    └─→ Issue #7 (P2) → Scripts
```

---

## Cómo Crear los Issues en GitHub

### Opción 1: Via GitHub UI

1. Ve a: https://github.com/fegome90-cmd/skill_fabrik/issues/new
2. Copia el título y descripción de cada issue
3. Añade los labels correspondientes
4. Click "Submit new issue"
5. Repite para los 7 issues

### Opción 2: Via gh CLI (si disponible)

```bash
# Issue #1
gh issue create --title "feat: update CI/CD workflows and dependencies from v2-rules-compliance" \
  --label "priority: P0,type: infrastructure,affects: ci-cd" \
  --body-file issue-1-body.md

# Repetir para issues 2-7
```

### Opción 3: Bulk Create Script

Guardaré un script que puedes ejecutar si tienes gh CLI configurado.

---

**Next Step**: Una vez creados los issues, comenzar con PR #1
