# Git Worktrees - Casos de Uso Detallados

## 1. Desarrollo de Features Paralelos

### Scenario: Desarrollar 2 Features Simultáneamente

**Contexto**: E-commerce con 2 features independientes: sistema de login y pasarela de pago.

```bash
# Setup inicial
git checkout main
git pull origin main

# Feature A: Login con refresh tokens
git worktree add ../ws-login feature/auth/refresh-token
cd ../ws-login
git checkout -b feature/auth/refresh-token
npm start -- --port 3001

# Feature B: Webhooks de pago (desde mismo commit de main)
cd /path/to/main/repo
git worktree add ../ws-payment feature/payment/webhook
cd ../ws-payment
git checkout -b feature/payment/webhook
npm start -- --port 3002
```

**Flujo de desarrollo**:
```bash
# Trabajar en login
cd ../ws-login
git add .
git commit -m "feat: implement refresh token logic"
git push origin feature/auth/refresh-token

# Cambiar a payment (sin perder trabajo)
cd ../ws-payment
git add .
git commit -m "feat: webhook signature verification"
git push origin feature/payment/webhook

# Testear ambos en paralelo
curl http://localhost:3001/api/health  # Login service
curl http://localhost:3002/webhooks    # Payment webhook
```

### Beneficios vs Alternativas
- **vs Stash**: Mantiene historial completo en cada worktree
- **vs Multiple Clones**: Comparte .git/objects (ahorra espacio)
- **vs Branch Switching**: No pierde cambios no commitados

## 2. Code Review y Testing de PRs

### Scenario: Revisar 3 PRs Simultaneously

```bash
# PR #123: Dark Mode Implementation
git worktree add ../review-123 origin/pr/123
cd ../review-123
git checkout -b review/pr-123
npm install
npm test

# PR #124: Performance Optimization
cd /path/to/repo
git worktree add ../review-124 origin/pr/124
cd ../review-124
npm install
npm run build:analyze

# PR #125: API Refactoring
git worktree add ../review-125 origin/pr/125
cd ../review-125
npm install
npm run lint
```

**Comparación de Performance**:
```bash
# Comparar bundle sizes
cd ../review-123 && npm run build
du -sh dist/ # ej: 2.5MB

cd ../review-124 && npm run build
du -sh dist/ # ej: 1.8MB

cd ../review-125 && npm run build
du -sh dist/ # ej: 2.1MB
```

**Testing Diferencial**:
```bash
# Ejecutar tests en todos los PRs
for pr in 123 124 125; do
  echo "Testing PR #$pr"
  cd ../review-$pr
  npm test -- --run --reporter=verbose 2>&1 | tee pr-$pr-results.txt
done

# Comparar resultados
diff pr-123-results.txt pr-124-results.txt
```

### Métricas de Review
```bash
# Estadísticas de cada PR
cd ../review-123
git diff --stat HEAD~10..HEAD
# Output:
#  15 files changed, 234 insertions(+), 89 deletions(-)

# Líneas de código añadidas
git diff --numstat HEAD~10..HEAD | awk '{sum+=$1} END {print sum}'
```

## 3. Hotfix Durante Feature Development

### Scenario: Bug Crítico en Producción

**Situación**: Desarrollando feature grande, encuentra bug en producción.

```bash
# Estado actual
cd ../mi-feature-enorm
git status
# Cambios no commitados, feature 60% completa

# Crear hotfix desde main
cd /path/to/repo
git checkout production  # o main
git worktree add ../hotfix-critico origin/hotfix/critical-bug
cd ../hotfix-critico

# Desarrollo rápido
npm test -- --testNamePattern="critical"
npm run build
git add .
git commit -m "fix: critical bug in payment processing"
git push origin hotfix/critical-bug

# Crear PR para hotfix
gh pr create --title "HOTFIX: Critical payment bug" --body "Immediate fix"

# Volver a feature (sin perder progreso)
cd ../mi-feature-enorm
git status  # TODO: Completar feature
```

**Ventajas**:
- Zero stash complexity
- Feature branch intact
- Hotfix independiente y rápido
- Fácil rollback si necesario

## 4. Comparación de Comportamiento Entre Versiones

### Scenario: Debug Regression Between Versions

```bash
# Versión actual (con bug)
git worktree add ../v2.1.0 2.1.0
cd ../v2.1.0
npm install
npm test -- --grep "user login"

# Versión previa (sin bug)
git worktree add ../v2.0.5 2.0.5
cd ../v2.0.5
npm install
npm test -- --grep "user login"

# Reproducir el bug en ambas
cd ../v2.1.0
npm run dev -- --port 3001
# Test: user se loguea, sesión expira en 1h

cd ../v2.0.5
npm run dev -- --port 3002
# Test: user se loguea, sesión expira en 24h ← comportamiento esperado
```

**Análisis de Diferencias**:
```bash
# Ver qué cambió entre versiones
git diff v2.0.5..v2.1.0 -- src/auth/

# Comparar tests que fallan
cd ../v2.1.0
npm test -- --listTests | grep auth > failing-tests.txt

cd ../v2.0.5
npm test -- --listTests | grep auth > passing-tests.txt
```

## 5. Testing Multi-Environment

### Scenario: Deploy a Staging y Production Simultaneously

```bash
# Staging environment
git worktree add ../staging origin/staging
cd ../staging
git checkout -b deploy/staging
npm run build:staging
npm test -- --env staging

# Production environment (desde mismo commit)
git worktree add ../production origin/main
cd ../production
git checkout -b deploy/production
npm run build:production
npm test -- --env production

# Verificar diferencias
diff <(cd ../staging && npm run build:analyze) \
     <(cd ../production && npm run build:analyze)
```

## 6. Feature Branch + Testing Dependencies

### Scenario: Testing con Services Externos

```bash
# Feature que requiere database actualizada
git worktree add ../ws-db-update feature/db/migration-v3
cd ../ws-db-update
npm run db:migrate
npm start -- --port 4001

# Feature con API externa deshabilitada
git worktree add ../ws-mock-api feature/api/mock-external
cd ../ws-mock-api
export USE_MOCK_API=true
npm start -- --port 4002

# Test ambos escenarios
curl http://localhost:4001/api/users      # Con DB real
curl http://localhost:4002/api/users      # Con API mock
```

## 7. Review de Commits Individuales

### Scenario: Analizar Cada Commit de Feature

```bash
# Worktree para análisis detallado
git worktree add ../analyze-feature feature/large-pr
cd ../analyze-feature

# Crear worktrees para cada commit
git log --oneline feature/large-pr~10..feature/large-pr | while read commit msg; do
  hash=$(echo $commit | cut -d' ' -f1)
  git worktree add "../commit-$hash" $hash
  echo "Created worktree for: $commit"
done

# Analizar commit específico
cd ../commit-a1b2c3d
git show --stat
npm test  # Ver si este commit rompe tests
```

## 8. Continuous Integration Locally

### Scenario: Simular CI Pipeline

```bash
# Unit tests
git worktree add ../ci-unit-tests main
cd ../ci-unit-tests
npm test

# Integration tests
git worktree add ../ci-integration-tests main
cd ../ci-integration-tests
npm run test:integration

# E2E tests
git worktree add ../ci-e2e-tests main
cd ../ci-e2e-tests
npm run test:e2e

# Lint y security
git worktree add ../ci-lint-tests main
cd ../ci-lint-tests
npm run lint
npm audit

# Build verification
git worktree add ../ci-build-tests main
cd ../ci-build-tests
npm run build
npm run build:analyze
```

## 9. Bisect y Bug Hunting

### Scenario: Encontrar Commit que Introdujo Bug

```bash
# Worktree para bisect
git worktree add ../bisect-debugging main
cd ../bisect-debugging

# Script para automatizar bisect
cat > test-bug.sh << 'EOF'
#!/bin/bash
npm test -- --grep "authentication regression"
exit $?
EOF

# Ejecutar bisect
git bisect start
git bisect bad HEAD
git bisect good v2.0.0
git bisect run bash ../bisect-debugging/test-bug.sh

# Resultado: commit específico que introdujo el bug
```

## 10. Workshop/Training Environments

### Scenario: Crear Environments para Workshop

```bash
# Crear 5 worktrees para 5 participantes
for i in {1..5}; do
  git worktree add "../workshop-user$i" origin/workshop/start
  cd "../workshop-user$i"
  git checkout -b "user$i/progress"
  echo "Workshop workspace $i ready"
done

# Cada usuario tiene workspace aislado
# Pueden experimentar sin afectar a otros
```

## Casos de Uso por Industria

### E-commerce
- Review de 3 features de checkout
- Testing de 2 pasarelas de pago simultáneamente
- A/B testing de UI variants

### SaaS
- Testing de 3 integraciones de terceros
- Comparar performance entre versiones
- Debug de regressions en tenant isolation

### Mobile Apps
- Testing en iOS y Android emulators
- Review de features platform-specific
- Testing de builds con diferentes configuraciones

## Métricas y Tracking

### Automatizar Tracking de Worktrees
```bash
#!/bin/bash
# track-worktrees.sh - Monitorear uso de worktrees

echo "=== Worktree Usage Report ==="
echo "Date: $(date)"
echo

for worktree in $(git worktree list --porcelain | grep "^path" | cut -d' ' -f2-); do
  name=$(basename "$worktree")
  commits=$(cd "$worktree" && git rev-list --count HEAD 2>/dev/null || echo "N/A")
  files=$(find "$worktree" -name "*.js" -o -name "*.ts" | wc -l)

  echo "Worktree: $name"
  echo "  Path: $worktree"
  echo "  Commits: $commits"
  echo "  Files: $files"
  echo "  Last activity: $(stat -f '%Sm' -t '%Y-%m-%d %H:%M' "$worktree" 2>/dev/null || echo 'N/A')"
  echo
done
```

## Best Practices por Caso de Uso

### ✅ Recomendado
- Mantener worktrees ≤ 30 días
- Sincronizar con origin semanalmente
- Usar locks en worktrees temporales
- Naming convention consistente
- Documentar propósito de cada worktree

### ❌ Evitar
- Worktrees dentro de worktrees
- Compartir worktrees entre developers
- Worktrees sin branch específico (detached sin plan)
- Más de 5 worktrees activos simultáneamente
- Worktrees con branches muy desactualizados
