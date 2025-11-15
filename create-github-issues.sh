#!/bin/bash
# Script para crear los 7 GitHub issues automáticamente
# Requiere: gh CLI configurado

set -e

echo "🎯 Creating 7 GitHub issues for v2-rules-compliance split strategy..."
echo ""

# Issue #1: CI/CD & Dependencies
echo "Creating Issue #1: CI/CD & Dependencies..."
gh issue create \
  --title "feat: update CI/CD workflows and dependencies from v2-rules-compliance" \
  --label "priority: P0,type: infrastructure,affects: ci-cd" \
  --body "## Objetivo

Actualizar workflows de CI/CD y dependencias críticas desde \`feature/v2-rules-compliance\`.

## Cambios Incluidos

### CI/CD (.github/workflows/ci.yml)
- ✅ Actualizar actions/checkout@v4 → v5
- ✅ Actualizar actions/setup-node@v4 → v6
- ✅ Mejorar estructura del workflow

### Dependencies (package.json)
- ✅ Añadir \`SF_DASHBOARD_PORT=0 SF_DASHBOARD_WS_PORT=0\` a test scripts
- ✅ Actualizar \`@fastify/cors\` 8.4.0 → 8.5.0
- ✅ Añadir \`supertest\` y \`@types/supertest\`
- ✅ Añadir override de esbuild

## Validación
- [ ] pnpm install exitoso
- [ ] pnpm -w build pasa
- [ ] pnpm test:phase3-quick pasa
- [ ] CI pipeline verde

## Estimación
⏱️ 2-3 horas

## Related
Part of v2-rules-compliance split strategy. See V2_RULES_COMPLIANCE_MERGE_PLAN.md"

echo "✅ Issue #1 created"
echo ""

# Issue #2: Code Quality Upgrade
echo "Creating Issue #2: Code Quality Upgrade..."
gh issue create \
  --title "feat: add code quality upgrade system with ESLint migration" \
  --label "priority: P1,type: feature,affects: code-quality" \
  --body "## Objetivo

Añadir sistema completo de Code Quality Upgrade con scripts de migración de ESLint.

## Cambios Incluidos
- Directorio completo: \`code-quality-upgrade/\`
- ESLint migration scripts con TDD
- Performance monitoring
- 100% test coverage

## Validación
- [ ] Tests del sistema pasan
- [ ] No afecta código existente

## Estimación
⏱️ 3-4 horas

## Dependencias
Depends on: Issue #1"

echo "✅ Issue #2 created"
echo ""

# Issue #3: Daemon V2
echo "Creating Issue #3: Daemon V2..."
gh issue create \
  --title "feat: add daemon-v2 with health checks, PM2 manager, and graceful shutdown" \
  --label "priority: P1,type: feature,affects: daemon" \
  --body "## Objetivo

Añadir Daemon V2 con features avanzadas de orchestración y resiliencia.

## Features
- ✅ Health check system avanzado
- ✅ PM2 cluster management
- ✅ Graceful shutdown con cleanup
- ✅ Real-time dashboard mejorado

## Validación
- [ ] Tests daemon-v2 pasan
- [ ] Backward compatibility verificada
- [ ] Integration tests

## Estimación
⏱️ 6-8 horas

## Dependencias
Depends on: Issue #1"

echo "✅ Issue #3 created"
echo ""

# Issue #4: Router V2
echo "Creating Issue #4: Router V2..."
gh issue create \
  --title "feat: add router-v2 with load balancer, cache warmer, and circuit breaker" \
  --label "priority: P1,type: feature,affects: router" \
  --body "## Objetivo

Añadir Router V2 con features avanzadas de performance, caching y resiliencia.

## Features
- ✅ Advanced performance monitoring
- ✅ Intelligent load balancing
- ✅ Cache warming strategies
- ✅ Circuit breaker pattern
- ✅ MemTech integration

## Validación
- [ ] Tests router-v2 pasan
- [ ] Integration tests con daemon-v2
- [ ] Load tests (< 500ms)

## Estimación
⏱️ 6-8 horas

## Dependencias
Depends on: Issue #1, Issue #3"

echo "✅ Issue #4 created"
echo ""

# Issue #5: Forensic Analysis
echo "Creating Issue #5: Forensic Analysis..."
gh issue create \
  --title "docs: expand forensic analysis framework with plan and tools" \
  --label "priority: P2,type: documentation,affects: forensic-analysis" \
  --body "## Objetivo

Expandir el framework de Forensic Analysis con herramientas, scripts y plan de refactorización.

## Cambios
- Expansión de \`docs/inventario/architecture-analysis/forensic-analysis/\`
- Plan de refactorización de skills
- Validation scripts

## Estimación
⏱️ 4-5 horas

## Dependencias
Depends on: Issue #1"

echo "✅ Issue #5 created"
echo ""

# Issue #6: Documentation
echo "Creating Issue #6: Documentation..."
gh issue create \
  --title "docs: add 2025Q4 inventory, integration guides, and refactor investigation" \
  --label "priority: P2,type: documentation" \
  --body "## Objetivo

Añadir documentación completa del inventario 2025Q4 y guías de integración.

## Cambios
- Inventario 2025Q4 completo
- Guías de integración (MemTech, Skills Fabrik API)
- Refactor investigation docs

## Estimación
⏱️ 2-3 horas

## Dependencias
Depends on: Issue #1"

echo "✅ Issue #6 created"
echo ""

# Issue #7: Scripts
echo "Creating Issue #7: Scripts..."
gh issue create \
  --title "feat: add integration scripts and pre-deployment validation" \
  --label "priority: P2,type: tooling" \
  --body "## Objetivo

Añadir scripts de integración con APIs externas y checks de pre-deployment.

## Cambios
- Integration scripts (Python)
- Pre-deployment validation scripts
- Repository cleanup utilities

## Estimación
⏱️ 2-3 horas

## Dependencias
Depends on: Issue #1"

echo "✅ Issue #7 created"
echo ""

echo "🎉 All 7 issues created successfully!"
echo ""
echo "View them at: https://github.com/fegome90-cmd/skill_fabrik/issues"
echo ""
echo "Next step: Start working on Issue #1 (PR #1)"
