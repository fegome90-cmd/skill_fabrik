# 🚀 Estrategia Segura para Implementación de PRs
## Plan Completo de 7 Pull Requests

**Fecha de Creación**: November 6, 2025
**Versión**: 1.0
**Estado del Repositorio**: PR masivo ya mergeado a main

---

## 📊 Situación Actual

### Estado del Repositorio
- ✅ PR #15 (`review/repo-cleanup-and-documentation`) - **YA MERGEADO** a main
- ✅ PR #14 (análisis) - **YA MERGEADO** a main
- ⚠️ **Credenciales .env todavía presentes en main** (requiere PR urgente)
- ✅ 1,932 archivos ya incorporados al repositorio
- ⚠️ Problemas de seguridad y organización identificados

### Nuevo Enfoque
En lugar de dividir el PR masivo (ya mergeado), estos PRs servirán para:
1. **Remediar problemas de seguridad** identificados
2. **Mejorar y optimizar** lo que ya está en main
3. **Implementar mejores prácticas** de forma incremental
4. **Organizar y limpiar** archivos problemáticos

---

## 🎯 Estrategia de 7 PRs - Orden de Implementación

```
Semana 1: SEGURIDAD Y BASE
  PR #1 ──┐
          ├──> PR #2 ──┐
          │            │
          └──> PR #4   │  (paralelo)
                       │
Semana 2: INFRAESTRUCTURA
                       ├──> PR #3
                       │
Semana 3: CÓDIGO CORE
                       └──> PR #5 ──┐
                                    ├──> PR #6
                                    └──> PR #7

Timeline: 4 semanas
Riesgo: Bajo (cambios incrementales)
```

---

## PR #1: 🔒 Seguridad y Limpieza de Credenciales

### Información Básica
- **Rama**: `claude/security-pr1-011CUrsDB6WiFFYFrvnPEL4a`
- **Estado**: ✅ **YA CREADO**
- **Prioridad**: 🔴 CRÍTICA
- **Depende de**: Ninguno
- **Tiempo estimado**: 2-4 horas
- **Riesgo**: Bajo (solo elimina archivos sensibles)

### Objetivos
1. Eliminar archivos .env con credenciales reales
2. Actualizar .gitignore con patrones de seguridad
3. Implementar pre-commit hooks para prevención
4. Documentar incidente de seguridad

### Archivos Afectados (8)
```
DELETE:
  - .env.testing         (credencial real expuesta)
  - .env.production      (placeholders pero no debe estar)
  - .env.development     (configs locales)
  - .env.dashboard       (configs dashboard)
  - .env.check           (configs testing)

MODIFY:
  - .gitignore           (+74 líneas, 30+ patrones)
  - .husky/pre-commit    (+44 líneas, security checks)

CREATE:
  - SECURITY-AUDIT-REPORT.md  (333 líneas)
```

### Pasos de Implementación Segura

#### Fase 1: Pre-PR (CRÍTICO - Hacer ANTES del merge)
```bash
# 1. Rotar contraseña en servidor staging
ssh staging-server
sudo -u postgres psql
ALTER USER surprise_user WITH PASSWORD 'NEW_SECURE_RANDOM_PASSWORD';
\q

# 2. Actualizar aplicaciones
# - Update secrets manager (AWS Secrets Manager, Vault, etc.)
# - Update environment variables
# - Restart services

# 3. Auditar logs
sudo grep 'surprise_user' /var/log/postgresql/*.log | \
  grep -v "$(date +%Y-%m-%d)"
```

#### Fase 2: Crear PR
```bash
# PR ya creado en: claude/security-pr1-011CUrsDB6WiFFYFrvnPEL4a
# Link: https://github.com/fegome90-cmd/skill_fabrik/pull/new/claude/security-pr1-011CUrsDB6WiFFYFrvnPEL4a
```

#### Fase 3: Revisión de Seguridad
- [ ] Verificar que TODOS los .env fueron eliminados
- [ ] Confirmar que .env.example solo tiene placeholders
- [ ] Probar pre-commit hook (intentar commitear un .env)
- [ ] Verificar patrones de .gitignore
- [ ] Confirmar rotación de contraseña completada
- [ ] Verificar logs sin actividad sospechosa

#### Fase 4: Testing Post-Merge
```bash
# Test 1: Verificar .gitignore
touch .env.testing
git add .env.testing  # Debe fallar

# Test 2: Verificar pre-commit hook
echo "password=test123" > test.js
git add test.js
git commit -m "test"  # Debe advertir

# Test 3: Verificar aplicación
# - Copiar .env.example a .env
# - Llenar con credenciales reales
# - Iniciar aplicación
# - Verificar funcionalidad
```

### Criterios de Éxito
- ✅ Contraseña rotada y verificada
- ✅ Logs auditados sin incidentes
- ✅ PR mergeado a main
- ✅ Aplicación funciona con nueva config
- ✅ Pre-commit hooks activos en todos los devs

### Plan de Rollback
```bash
# Si algo falla después del merge:
git revert <commit-hash>
git push origin main

# Restaurar contraseña anterior TEMPORALMENTE
# Mientras se investiga el problema
```

---

## PR #2: ⚙️ Eliminación de Archivos Temporales y Cache

### Información Básica
- **Rama**: `claude/cleanup-temp-pr2-011CUrsDB6WiFFYFrvnPEL4a`
- **Estado**: ⚠️ Por crear
- **Prioridad**: 🟠 Alta
- **Depende de**: PR #1 (merged)
- **Tiempo estimado**: 3-4 horas
- **Riesgo**: Bajo (archivos no usados en producción)

### Objetivos
1. Eliminar archivos de cache (.sf/, packages/.sf/)
2. Eliminar archivos temporales (dev/active/)
3. Eliminar configs de editor personales (.claude/, .cursor/)
4. Actualizar .gitignore para prevenir futuros commits

### Archivos a Eliminar (~140 archivos)

#### Cache Files (15 archivos)
```bash
# Archivos de cache del sistema SF
.sf/cache/slash-contexts/*.json          (14 archivos)
.sf/project-index.json                    (1 archivo)
packages/.sf/cache/                       (varios)
```

#### Temporary Development Files (112 archivos)
```bash
dev/active/fix-skillid-critical-issue/    (23 archivos)
dev/active/performance-optimization/      (18 archivos)
dev/active/live-testing-re-execution/     (15 archivos)
dev/active/test-plans-skillids/           (12 archivos)
# ... +20 subdirectorios más
```

#### Editor Configuration Files (12 archivos)
```bash
.claude/commands/*.md                     (8 archivos)
.claude/settings.local.json               (1 archivo)
.cursor/hooks/*.mjs                       (2 archivos)
.cursor/hooks/hooks-config.json           (1 archivo)
```

### Pasos de Implementación Segura

#### Fase 1: Preparación
```bash
# Crear branch desde main actualizado
git checkout main
git pull origin main
git checkout -b claude/cleanup-temp-pr2-011CUrsDB6WiFFYFrvnPEL4a

# Verificar que PR #1 ya está mergeado
git log main --oneline -10 | grep "security"
```

#### Fase 2: Análisis de Impacto
```bash
# Verificar que archivos a eliminar no están en uso
# 1. Buscar referencias a .sf/cache/
grep -r "\.sf/cache" packages/ src/ --include="*.ts" --include="*.js"

# 2. Verificar dev/active/
ls -la dev/active/
# Confirmar que son solo archivos de desarrollo temporal

# 3. Verificar .claude/ y .cursor/
# Estos son personales, NO deben estar en el repo
```

#### Fase 3: Eliminación Segura
```bash
# 1. Eliminar archivos de cache
git rm -r .sf/cache/
git rm .sf/project-index.json
git rm -r packages/.sf/ 2>/dev/null || true

# 2. Eliminar archivos temporales de dev
git rm -r dev/active/

# 3. Eliminar configuraciones de editor
git rm -r .claude/
git rm -r .cursor/
```

#### Fase 4: Actualizar .gitignore
```bash
# Agregar patrones para prevenir futuros commits
cat >> .gitignore << 'EOF'

# ============================================
# Cache and Build Artifacts
# ============================================
.sf/
.sf/cache/
.sf/project-index.json
packages/.sf/
**/.sf/

# ============================================
# Temporary Development Files
# ============================================
dev/active/
dev/temp/
dev/wip/
*.backup
*.tmp

# ============================================
# Editor Configurations (Personal)
# ============================================
.claude/
.cursor/
.codemachine/
.vscode/settings.json
.idea/workspace.xml
EOF
```

#### Fase 5: Commit y PR
```bash
git add .gitignore
git status  # Verificar cambios

git commit -m "$(cat <<'EOF'
chore: remove cache, temporary, and personal editor files

Remove files that should not be in version control:

Cache files removed:
- .sf/cache/ directory (14 JSON files)
- .sf/project-index.json
- packages/.sf/ cache directories

Temporary development files removed:
- dev/active/ directory (112 files)
- Incomplete feature branches
- Testing artifacts

Personal editor configs removed:
- .claude/ directory (9 files)
- .cursor/ directory (3 files)
- User-specific settings

Updated .gitignore:
- Added patterns for .sf/ cache
- Added dev/active/ and temp directories
- Added editor config patterns (.claude/, .cursor/)

These files will be regenerated locally as needed.
Personal configs should remain local to each developer.

Total removed: ~140 files, ~5,000 lines

Related: Security cleanup in PR #1
EOF
)"

# Push
git push -u origin claude/cleanup-temp-pr2-011CUrsDB6WiFFYFrvnPEL4a
```

### Testing y Verificación

#### Tests Pre-Merge
```bash
# 1. Verificar que el build funciona sin cache
rm -rf node_modules/.cache
npm run build

# 2. Verificar que tests pasan
npm test

# 3. Verificar que la app inicia
npm start
# App debe regenerar cache automáticamente

# 4. Verificar .gitignore
touch .sf/test.json
git add .sf/test.json  # Debe ser ignorado
```

#### Tests Post-Merge
```bash
# 1. Clonar repo fresh
git clone <repo-url> test-cleanup
cd test-cleanup

# 2. Verificar archivos no están
ls .sf/ 2>/dev/null  # No debe existir
ls dev/active/ 2>/dev/null  # No debe existir

# 3. Iniciar aplicación
npm install
npm run build
npm start

# 4. Verificar cache se regenera
ls .sf/cache/  # Debe regenerarse automáticamente
```

### Criterios de Éxito
- ✅ 140 archivos eliminados del repositorio
- ✅ .gitignore previene futuros commits de estos archivos
- ✅ Build y tests pasan sin los archivos eliminados
- ✅ Cache se regenera automáticamente
- ✅ Aplicación funciona normalmente

### Plan de Rollback
```bash
# Si se elimina algo necesario:
# Opción 1: Revert específico
git revert <commit-hash>

# Opción 2: Restaurar archivos específicos del commit anterior
git checkout HEAD~1 -- .sf/cache/specific-file.json

# Opción 3: Cherry-pick del commit previo
git cherry-pick <commit-antes-del-cleanup>
```

### Documentación del PR
```markdown
## PR #2: Remove Cache, Temporary, and Personal Files

**Type**: Maintenance
**Priority**: High
**Risk**: Low

### Summary
Removes ~140 files that should not be in version control:
- Cache files (.sf/)
- Temporary development files (dev/active/)
- Personal editor configurations (.claude/, .cursor/)

### Impact
- Repository size reduced by ~5MB
- Cleaner git history
- Faster clones
- No impact on functionality (files regenerate automatically)

### Testing
- [x] Build passes without cache files
- [x] Tests pass
- [x] Application starts and regenerates cache
- [x] .gitignore prevents re-adding these files

### Breaking Changes
None. Files are regenerated automatically when needed.

### Developer Actions Required
None. Cache and configs regenerate on first run.
```

---

## PR #3: 🔧 Mejoras en CI/CD y GitHub Workflows

### Información Básica
- **Rama**: `claude/cicd-improvements-pr3-011CUrsDB6WiFFYFrvnPEL4a`
- **Estado**: ⚠️ Por crear
- **Prioridad**: 🟡 Media
- **Depende de**: PR #1, PR #2 (merged)
- **Tiempo estimado**: 4-6 horas
- **Riesgo**: Medio (afecta CI/CD)

### Objetivos
1. Optimizar workflows de GitHub Actions
2. Agregar jobs de seguridad (secret scanning)
3. Mejorar matriz de testing
4. Agregar quality gates
5. Configurar notificaciones

### Archivos a Modificar

#### GitHub Workflows (~10 archivos)
```
.github/workflows/ci.yml                  # Main CI pipeline
.github/workflows/security.yml            # NEW: Security scanning
.github/workflows/dependency-review.yml   # NEW: Dependency checks
.github/workflows/codeql.yml             # Code quality analysis
.github/workflows/publish.yml            # Package publishing
.github/workflows/test.yml               # Test suite
```

#### Templates y Configs
```
.github/PULL_REQUEST_TEMPLATE.md         # PR template mejorado
.github/CODEOWNERS                       # NEW: Code ownership
.github/dependabot.yml                   # Dependabot config mejorado
```

### Pasos de Implementación Segura

#### Fase 1: Preparación y Branch
```bash
git checkout main
git pull origin main
git checkout -b claude/cicd-improvements-pr3-011CUrsDB6WiFFYFrvnPEL4a
```

#### Fase 2: Workflow de Seguridad
```yaml
# .github/workflows/security.yml
name: Security Scan

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * 1'  # Weekly on Monday

jobs:
  secret-scan:
    name: Secret Scanning
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Run Gitleaks
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Run TruffleHog
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: main
          head: HEAD

  dependency-scan:
    name: Dependency Vulnerability Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Snyk
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

      - name: Upload results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: snyk.sarif

  audit:
    name: NPM Audit
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run audit
        run: npm audit --audit-level=moderate
```

#### Fase 3: Mejorar CI Principal
```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  # Quality gates antes de tests
  quality-gates:
    name: Quality Gates
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Check for secrets
        run: |
          if git diff --cached | grep -i "password.*=.*[^[]"; then
            echo "ERROR: Potential secret detected"
            exit 1
          fi

      - name: Check file sizes
        run: |
          find . -type f -size +10M | grep -v node_modules
          if [ $? -eq 0 ]; then
            echo "ERROR: Large files detected"
            exit 1
          fi

  lint:
    name: Lint
    runs-on: ubuntu-latest
    needs: quality-gates
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Run Prettier
        run: npm run format:check

  test:
    name: Test (Node ${{ matrix.node }})
    runs-on: ubuntu-latest
    needs: lint
    strategy:
      matrix:
        node: ['18', '20', '22']
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node ${{ matrix.node }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        if: matrix.node == '20'
        with:
          file: ./coverage/lcov.info

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Archive build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
```

#### Fase 4: PR Template Mejorado
```markdown
# .github/PULL_REQUEST_TEMPLATE.md
## Description
<!-- Describe your changes in detail -->

## Type of Change
- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📝 Documentation update
- [ ] 🔒 Security fix
- [ ] ⚡ Performance improvement
- [ ] ♻️ Refactoring

## Security Checklist
- [ ] No hardcoded secrets or credentials
- [ ] No sensitive data in logs
- [ ] Input validation implemented
- [ ] No .env files committed (only .env.example)
- [ ] Dependencies have no known vulnerabilities

## Testing Checklist
- [ ] Unit tests pass locally
- [ ] Integration tests pass locally
- [ ] Manual testing performed
- [ ] No regression detected
- [ ] Coverage maintained or improved

## Documentation
- [ ] README updated (if needed)
- [ ] API documentation updated (if needed)
- [ ] Changelog updated
- [ ] Migration guide provided (for breaking changes)

## Pre-Merge Checklist
- [ ] Code reviewed by at least one peer
- [ ] All CI checks passing
- [ ] Branch up to date with main
- [ ] No merge conflicts
- [ ] Commit messages follow conventional commits

## Screenshots (if applicable)
<!-- Add screenshots here -->

## Related Issues
Closes #
Related to #
```

#### Fase 5: CODEOWNERS
```
# .github/CODEOWNERS
# Global owners
* @fegome90-cmd

# Security-related files
.env.example @fegome90-cmd
.gitignore @fegome90-cmd
.github/workflows/security.yml @fegome90-cmd

# Core packages
/packages/router/ @fegome90-cmd
/packages/skills-cli/ @fegome90-cmd
/packages/daemon/ @fegome90-cmd

# Infrastructure
/.github/workflows/ @fegome90-cmd
/scripts/ @fegome90-cmd

# Documentation
/docs/ @fegome90-cmd
README.md @fegome90-cmd
```

### Testing Completo

#### Tests Pre-PR
```bash
# 1. Verificar sintaxis de workflows
for file in .github/workflows/*.yml; do
  echo "Checking $file"
  yamllint "$file"
done

# 2. Test workflows localmente (usar act)
npm install -g act
act -l  # Listar jobs
act push  # Simular push event

# 3. Verificar secrets necesarios
# - SNYK_TOKEN
# - CODECOV_TOKEN
# - GITHUB_TOKEN (automático)
```

#### Tests Post-Merge
```bash
# 1. Verificar que workflows se ejecutan
# - Hacer push a main
# - Observar Actions tab en GitHub

# 2. Verificar notificaciones
# - Check email/Slack notifications

# 3. Verificar quality gates
# - Crear PR con archivo grande (debe fallar)
# - Crear PR con "password=" (debe advertir)

# 4. Verificar matriz de tests
# - Debe probar Node 18, 20, 22
# - Todos deben pasar
```

### Criterios de Éxito
- ✅ Workflows de seguridad activos y pasando
- ✅ CI/CD optimizado (tiempo reducido en 20%+)
- ✅ Quality gates funcionando
- ✅ PR template en uso
- ✅ CODEOWNERS configurado
- ✅ Notificaciones funcionando

### Plan de Rollback
```bash
# Si workflows fallan:
# 1. Revert del PR
git revert <commit-hash>
git push origin main

# 2. Fix específico del workflow
git checkout main
git checkout -b hotfix/workflow-fix
# Edit workflow file
git commit -m "fix: correct workflow syntax"
git push

# 3. Deshabilitar workflow temporalmente
# En GitHub UI: Actions > Workflow > "..." > Disable
```

---

## PR #4: 📚 Consolidación de Documentación

### Información Básica
- **Rama**: `claude/docs-consolidation-pr4-011CUrsDB6WiFFYFrvnPEL4a`
- **Estado**: ⚠️ Por crear
- **Prioridad**: 🟡 Media
- **Depende de**: Ninguno (puede ir en paralelo con PR #2)
- **Tiempo estimado**: 6-8 horas
- **Riesgo**: Bajo (solo documentación)

### Objetivos
1. Consolidar directorios docs/ y documentos/
2. Reorganizar investigaciones/
3. Crear estructura clara de documentación
4. Actualizar enlaces internos
5. Crear índice de navegación

### Estructura Propuesta
```
docs/
├── README.md                    # Índice principal
├── architecture/
│   ├── overview.md
│   ├── adr/                     # Architecture Decision Records
│   │   ├── 001-memory-system.md
│   │   └── ...
│   └── diagrams/
├── guides/
│   ├── getting-started.md
│   ├── development.md
│   ├── deployment.md
│   └── security/
│       ├── secrets-management.md
│       └── security-audit-guide.md
├── api/
│   ├── router.md
│   ├── daemon.md
│   └── skills-cli.md
├── skills/
│   ├── creating-skills.md
│   ├── skill-catalog.md
│   └── examples/
├── research/                     # Formerly investigaciones/
│   ├── claude-skills-analysis.pdf
│   ├── private-ai-ecosystem.pdf
│   └── reports/
└── operations/
    ├── monitoring.md
    ├── troubleshooting.md
    └── runbooks/
```

### Pasos de Implementación

#### Fase 1: Preparación
```bash
git checkout main
git pull origin main
git checkout -b claude/docs-consolidation-pr4-011CUrsDB6WiFFYFrvnPEL4a
```

#### Fase 2: Crear Nueva Estructura
```bash
# Crear directorios
mkdir -p docs/{architecture/adr,guides/security,api,skills/examples,research/reports,operations/runbooks}

# Mover y reorganizar archivos
# De docs/ actual
git mv docs/devops-*.md docs/operations/
git mv docs/skills/ docs/skills/

# De documentos/
git mv documentos/informe-*.md docs/research/reports/
git mv documentos/correcciones-*.md docs/operations/runbooks/
git mv documentos/gate-fase1-evaluacion.md docs/operations/

# De investigaciones/
git mv investigaciones/*.pdf docs/research/
git mv investigaciones/reddit_post.md docs/research/
```

#### Fase 3: Crear Índice Principal
```markdown
# docs/README.md
# Skills Fabrik Documentation

Welcome to the Skills Fabrik documentation. This guide will help you understand, use, and contribute to the project.

## 🚀 Getting Started

- [Quick Start Guide](guides/getting-started.md)
- [Installation](guides/installation.md)
- [Configuration](guides/configuration.md)

## 📖 Guides

### Development
- [Development Setup](guides/development.md)
- [Creating Skills](skills/creating-skills.md)
- [API Reference](api/README.md)

### Security
- [Secrets Management](guides/security/secrets-management.md)
- [Security Audit Guide](guides/security/security-audit-guide.md)

### Operations
- [Deployment](guides/deployment.md)
- [Monitoring](operations/monitoring.md)
- [Troubleshooting](operations/troubleshooting.md)

## 🏗️ Architecture

- [System Overview](architecture/overview.md)
- [Architecture Decision Records](architecture/adr/)
- [System Diagrams](architecture/diagrams/)

## 📚 API Documentation

- [Router API](api/router.md)
- [Daemon API](api/daemon.md)
- [Skills CLI](api/skills-cli.md)

## 🎯 Skills

- [Skills Catalog](skills/skill-catalog.md)
- [Creating Custom Skills](skills/creating-skills.md)
- [Examples](skills/examples/)

## 🔬 Research

- [Analysis Reports](research/reports/)
- [External Resources](research/)

## 🛠️ Operations

- [Runbooks](operations/runbooks/)
- [Monitoring Setup](operations/monitoring.md)
- [Troubleshooting Guide](operations/troubleshooting.md)

## 🤝 Contributing

- [Contributing Guidelines](../CONTRIBUTING.md)
- [Code of Conduct](../CODE_OF_CONDUCT.md)
- [Development Workflow](guides/development.md)

---

**Last Updated**: November 6, 2025
**Version**: 1.0
```

#### Fase 4: Actualizar Enlaces
```bash
# Script para actualizar enlaces internos
#!/bin/bash

# Buscar todos los archivos .md
find docs/ -name "*.md" -type f | while read file; do
  echo "Updating links in $file"

  # Actualizar enlaces de docs/ antiguo
  sed -i 's|](docs/|](|g' "$file"

  # Actualizar enlaces de documentos/
  sed -i 's|](documentos/|](operations/|g' "$file"

  # Actualizar enlaces de investigaciones/
  sed -i 's|](investigaciones/|](research/|g' "$file"
done
```

#### Fase 5: Commit
```bash
git add docs/
git commit -m "$(cat <<'EOF'
docs: consolidate and reorganize documentation structure

Consolidate documentation from multiple directories into unified structure:

Changes:
- Merge docs/ and documentos/ into single docs/ hierarchy
- Move investigaciones/ to docs/research/
- Create clear structure: architecture/, guides/, api/, skills/, operations/
- Create comprehensive index (docs/README.md)
- Update all internal links
- Add navigation and cross-references

New Structure:
docs/
├── architecture/    (system design and ADRs)
├── guides/          (how-to guides)
├── api/             (API documentation)
├── skills/          (skill development)
├── research/        (analysis and reports)
└── operations/      (ops runbooks)

Benefits:
- Single source of truth for documentation
- Clear navigation and discoverability
- Better organization by topic
- Easier to maintain

No functionality changes - documentation only.
EOF
)"

git push -u origin claude/docs-consolidation-pr4-011CUrsDB6WiFFYFrvnPEL4a
```

### Testing
```bash
# 1. Verificar links
npm install -g markdown-link-check
find docs/ -name "*.md" -exec markdown-link-check {} \;

# 2. Verificar PDFs accesibles
ls docs/research/*.pdf

# 3. Build doc site (si usas algo como Docusaurus)
npm run docs:build
```

### Criterios de Éxito
- ✅ Documentación consolidada en docs/
- ✅ Índice de navegación funcional
- ✅ Todos los enlaces actualizados
- ✅ No hay documentos duplicados
- ✅ Estructura clara y lógica

---

## PR #5: 🏗️ Mejoras en Packages Core

### Información Básica
- **Rama**: `claude/core-improvements-pr5-011CUrsDB6WiFFYFrvnPEL4a`
- **Estado**: ⚠️ Por crear
- **Prioridad**: 🟠 Alta
- **Depende de**: PR #1, PR #2 (merged)
- **Tiempo estimado**: 8-12 horas
- **Riesgo**: Medio-Alto (cambios en código core)

### Objetivos
1. Refactorizar packages/router para mejor performance
2. Mejorar error handling en packages/daemon
3. Actualizar packages/skills-cli con nuevos comandos
4. Agregar tests faltantes
5. Optimizar imports y dependencies

### Packages Afectados
```
packages/router/        (~50 archivos)
packages/daemon/        (~40 archivos)
packages/skills-cli/    (~30 archivos)
packages/shared/        (~25 archivos)
```

### Implementación por Package

#### Router Improvements
```typescript
// packages/router/src/middleware/error-handler.ts
export class ErrorHandler {
  handle(error: Error, req: Request, res: Response) {
    // Mejorar logging
    logger.error('Request error', {
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    });

    // No exponer detalles internos en producción
    const message = process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : error.message;

    res.status(500).json({
      error: message,
      requestId: req.id
    });
  }
}
```

```typescript
// packages/router/src/middleware/request-validator.ts
import { z } from 'zod';

export function validateRequest(schema: z.ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.validated = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.errors
        });
      } else {
        next(error);
      }
    }
  };
}
```

#### Daemon Improvements
```typescript
// packages/daemon/src/health-check.ts
export class HealthCheckService {
  async check(): Promise<HealthStatus> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkFileSystem(),
      this.checkMemory()
    ]);

    return {
      status: checks.every(c => c.status === 'fulfilled') ? 'healthy' : 'degraded',
      checks: checks.map((c, i) => ({
        name: ['database', 'redis', 'filesystem', 'memory'][i],
        status: c.status === 'fulfilled' ? 'ok' : 'error',
        message: c.status === 'rejected' ? c.reason.message : 'OK'
      })),
      timestamp: new Date().toISOString()
    };
  }
}
```

### Testing Completo
```typescript
// packages/router/__tests__/error-handler.test.ts
describe('ErrorHandler', () => {
  it('should log errors with context', async () => {
    const handler = new ErrorHandler();
    const error = new Error('Test error');
    const req = mockRequest({ path: '/test', method: 'GET' });
    const res = mockResponse();

    handler.handle(error, req, res);

    expect(logger.error).toHaveBeenCalledWith(
      'Request error',
      expect.objectContaining({
        error: 'Test error',
        path: '/test',
        method: 'GET'
      })
    );
  });

  it('should not expose stack traces in production', () => {
    process.env.NODE_ENV = 'production';
    const handler = new ErrorHandler();
    const error = new Error('Internal error');
    const req = mockRequest();
    const res = mockResponse();

    handler.handle(error, req, res);

    expect(res.json).toHaveBeenCalledWith({
      error: 'Internal server error',
      requestId: expect.any(String)
    });
  });
});
```

### Pasos de Implementación

```bash
# 1. Crear branch
git checkout main
git pull origin main
git checkout -b claude/core-improvements-pr5-011CUrsDB6WiFFYFrvnPEL4a

# 2. Implementar mejoras por package
# - Router: error handling, validators
# - Daemon: health checks, graceful shutdown
# - Skills CLI: nuevos comandos, mejor UX
# - Shared: utilities, types

# 3. Agregar tests
npm test -- --coverage
# Target: >80% coverage

# 4. Performance testing
npm run bench

# 5. Commit
git add packages/
git commit -m "refactor(core): improve error handling, add validators, enhance health checks"

# 6. Push
git push -u origin claude/core-improvements-pr5-011CUrsDB6WiFFYFrvnPEL4a
```

### Criterios de Éxito
- ✅ Error handling mejorado en todos los packages
- ✅ Test coverage >80%
- ✅ Performance igual o mejor
- ✅ No breaking changes (o documentados)
- ✅ All tests passing

### Plan de Rollback
```bash
# Rollback gradual por package si es necesario
git revert --no-commit <commit-router>
git revert --no-commit <commit-daemon>
git commit -m "revert: roll back core improvements"
```

---

## PR #6: 🧩 Additional Services y Features

### Información Básica
- **Rama**: `claude/services-pr6-011CUrsDB6WiFFYFrvnPEL4a`
- **Estado**: ⚠️ Por crear
- **Prioridad**: 🟡 Media
- **Depende de**: PR #5 (merged)
- **Tiempo estimado**: 12-16 horas
- **Riesgo**: Medio (nuevos servicios, menos críticos)

### Objetivos
1. Estabilizar paquetes nuevos (adr-service, bias-mitigation, etc.)
2. Agregar tests comprehensivos
3. Documentar APIs
4. Integrar con router existente

### Packages Incluidos
```
packages/adr-service/
packages/bias-mitigation/
packages/discovery/
packages/experimentation/
packages/kpi/
packages/performance/
```

### Implementación (similar a PR #5, adaptado para nuevos servicios)

---

## PR #7: 📝 Skills Library Expansion

### Información Básica
- **Rama**: `claude/skills-pr7-011CUrsDB6WiFFYFrvnPEL4a`
- **Estado**: ⚠️ Por crear
- **Prioridad**: 🟢 Baja
- **Depende de**: PR #5 (merged)
- **Tiempo estimado**: 8-10 horas
- **Riesgo**: Bajo (aislado en skills/)

### Objetivos
1. Validar todos los skills nuevos
2. Agregar tests para skills
3. Documentar uso de cada skill
4. Crear ejemplos

---

## 📋 Checklist General de Seguridad (Todos los PRs)

### Pre-PR
- [ ] No hay credenciales hardcodeadas
- [ ] No hay datos sensibles en logs
- [ ] .env.example actualizado (si aplica)
- [ ] .gitignore previene archivos sensibles
- [ ] Dependencies actualizadas y sin vulnerabilidades
- [ ] Tests de seguridad pasan

### Durante Review
- [ ] Code review por al menos 2 personas
- [ ] Security review si toca autenticación/autorización
- [ ] Performance review si afecta código crítico
- [ ] Breaking changes documentados

### Post-Merge
- [ ] Deploy a staging first
- [ ] Smoke tests en staging
- [ ] Monitor metrics por 24 horas
- [ ] Rollback plan documentado

---

## 📊 Timeline Completo

```
Semana 1 (Nov 6-12):
  Lunes:    PR #1 (Security) - Crear y mergear URGENTE
  Martes:   PR #2 (Cleanup) - Crear
  Miércoles: PR #2 - Review y mergear
  Jueves:    PR #4 (Docs) - Crear en paralelo
  Viernes:   PR #4 - Review

Semana 2 (Nov 13-19):
  Lunes:    PR #4 - Mergear
            PR #3 (CI/CD) - Crear
  Martes:   PR #3 - Testing
  Miércoles: PR #3 - Review y mergear
  Jueves:    PR #5 (Core) - Comenzar implementación
  Viernes:   PR #5 - Continuar

Semana 3 (Nov 20-26):
  Lunes:    PR #5 - Finalizar y tests
  Martes:   PR #5 - Review
  Miércoles: PR #5 - Mergear
  Jueves:    PR #6 (Services) - Comenzar
  Viernes:   PR #6 - Continuar

Semana 4 (Nov 27-Dec 3):
  Lunes:    PR #6 - Finalizar
  Martes:   PR #6 - Review y mergear
  Miércoles: PR #7 (Skills) - Crear
  Jueves:    PR #7 - Review
  Viernes:   PR #7 - Mergear y celebrar 🎉

Post-Implementation:
  Semana 5: Monitoring y ajustes
  Semana 6: Documentation finalization
  Semana 7: Retrospectiva y lecciones aprendidas
```

---

## 🚨 Planes de Contingencia

### Si un PR falla en CI
```bash
# 1. No hacer merge
# 2. Fix en el mismo branch
git checkout <branch>
# hacer cambios
git commit -m "fix: resolve CI issues"
git push

# 3. Re-trigger CI
# GitHub Actions re-ejecutará automáticamente
```

### Si un PR causa problemas en producción
```bash
# 1. Rollback inmediato
git revert <commit-hash>
git push origin main

# 2. Deploy del revert
# Desplegar inmediatamente

# 3. Investigar en branch separado
git checkout -b hotfix/investigate-issue
# Reproducir y arreglar

# 4. Nuevo PR con fix
# Seguir proceso normal de PR
```

### Si encontramos más credenciales
```bash
# 1. NO commitear a ningún branch
# 2. Rotar inmediatamente
# 3. Agregar al PR #1 si aún no se mergeó
# 4. O crear hotfix/security-urgent

git checkout -b hotfix/security-urgent
# Remove credentials
git commit -m "security: remove additional exposed credentials"
git push

# Create PR immediately
# Merge without waiting
```

---

## 📈 Métricas de Éxito

### Por PR
- ✅ CI/CD passing (100%)
- ✅ Code coverage maintained (>80%)
- ✅ No security vulnerabilities introduced
- ✅ Performance not degraded (±5%)
- ✅ Documentation complete

### Global
- ✅ Todos los 7 PRs mergeados en 4 semanas
- ✅ Zero security incidents
- ✅ Test coverage >85%
- ✅ Build time reducido 20%
- ✅ Repository organizado y limpio

---

## ✅ Checklist Final

- [ ] PR #1 (Security) - Mergeado
- [ ] PR #2 (Cleanup) - Mergeado
- [ ] PR #3 (CI/CD) - Mergeado
- [ ] PR #4 (Docs) - Mergeado
- [ ] PR #5 (Core) - Mergeado
- [ ] PR #6 (Services) - Mergeado
- [ ] PR #7 (Skills) - Mergeado
- [ ] Retrospectiva completada
- [ ] Documentación actualizada
- [ ] Monitoring establecido
- [ ] Team training completado

---

**Creado**: November 6, 2025
**Versión**: 1.0
**Próxima revisión**: Después de PR #3
