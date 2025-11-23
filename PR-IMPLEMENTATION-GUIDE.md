# 🚀 Guía de Implementación de PRs - Quick Reference

**Version**: 1.0
**Created**: November 6, 2025
**For**: Repository cleanup and security improvements

---

## 📊 Vista Rápida de los 7 PRs

| PR | Título | Prioridad | Riesgo | Tiempo | Estado | Depende de |
|----|--------|-----------|--------|--------|--------|------------|
| #1 | Security & Credentials | 🔴 CRÍTICO | Bajo | 2-4h | ✅ Creado | - |
| #2 | Cleanup Temp Files | 🟠 Alto | Bajo | 3-4h | ⚠️ Por crear | PR #1 |
| #3 | CI/CD Improvements | 🟡 Medio | Medio | 4-6h | ⚠️ Por crear | PR #1, #2 |
| #4 | Docs Consolidation | 🟡 Medio | Bajo | 6-8h | ⚠️ Por crear | - (paralelo) |
| #5 | Core Packages | 🟠 Alto | Alto | 8-12h | ⚠️ Por crear | PR #1, #2 |
| #6 | Additional Services | 🟡 Medio | Medio | 12-16h | ⚠️ Por crear | PR #5 |
| #7 | Skills Library | 🟢 Bajo | Bajo | 8-10h | ⚠️ Por crear | PR #5 |

**Total estimado**: 43-60 horas de trabajo
**Timeline**: 4 semanas
**PRs en paralelo permitidos**: #2 y #4 pueden ir simultáneamente

---

## 🎯 PR #1: Security (✅ CREADO - ACCIÓN INMEDIATA)

### Quick Facts
- **Branch**: `claude/security-pr1-011CUrsDB6WiFFYFrvnPEL4a`
- **Link**: https://github.com/fegome90-cmd/skill_fabrik/pull/new/claude/security-pr1-011CUrsDB6WiFFYFrvnPEL4a
- **Files changed**: 8 (5 deleted, 2 modified, 1 created)
- **Priority**: 🔴 CRITICAL
- **Status**: Waiting for password rotation

### Pasos Inmediatos

#### 1. Rotar Contraseña (HACER AHORA)
```bash
# En el servidor staging:
ssh staging-server
sudo -u postgres psql
ALTER USER surprise_user WITH PASSWORD 'NUEVA_CONTRASEÑA_SEGURA_AQUÍ';
\q

# Anotar la nueva contraseña en el secrets manager
```

#### 2. Actualizar Aplicaciones
```bash
# Actualizar secrets manager
aws secretsmanager update-secret \
  --secret-id staging/postgres/surprise_user \
  --secret-string '{"password":"NUEVA_CONTRASEÑA"}'

# Reiniciar servicios
kubectl rollout restart deployment/your-app -n staging
```

#### 3. Auditar Logs
```bash
# Buscar actividad sospechosa desde Nov 1
sudo grep 'surprise_user' /var/log/postgresql/*.log | \
  grep -v "$(date +%Y-%m-%d)"

# Revisar conexiones
sudo -u postgres psql -d surprise_metrics_staging -c \
  "SELECT * FROM pg_stat_activity WHERE datname = 'surprise_metrics_staging';"
```

#### 4. Crear el PR
- Ir a: https://github.com/fegome90-cmd/skill_fabrik/pull/new/claude/security-pr1-011CUrsDB6WiFFYFrvnPEL4a
- Usar descripción de `PR1-CREATE.md`
- Labels: `security`, `priority: critical`
- Reviewers: Security team, DevOps

#### 5. Mergear (después de confirmar rotación)
```bash
# Una vez aprobado y rotación confirmada
git checkout main
git pull origin main
git merge --no-ff claude/security-pr1-011CUrsDB6WiFFYFrvnPEL4a
git push origin main
```

---

## 🧹 PR #2: Cleanup Temporary Files

### Quick Facts
- **Branch**: `claude/cleanup-temp-pr2-011CUrsDB6WiFFYFrvnPEL4a` (por crear)
- **Files to delete**: ~140
- **Priority**: 🟠 High
- **Depends on**: PR #1 merged
- **Risk**: Low

### Comando Rápido de Creación

```bash
# Crear branch
git checkout main && git pull
git checkout -b claude/cleanup-temp-pr2-011CUrsDB6WiFFYFrvnPEL4a

# Eliminar archivos
git rm -r .sf/cache/
git rm .sf/project-index.json
git rm -r packages/.sf/
git rm -r dev/active/
git rm -r .claude/ .cursor/

# Actualizar .gitignore
cat >> .gitignore << 'EOF'

# Cache and artifacts
.sf/
packages/.sf/

# Temporary dev files
dev/active/
dev/temp/

# Personal editor configs
.claude/
.cursor/
EOF

# Commit
git add .gitignore
git commit -m "chore: remove cache, temporary, and personal editor files"

# Push
git push -u origin claude/cleanup-temp-pr2-011CUrsDB6WiFFYFrvnPEL4a
```

### Testing Checklist
```bash
# Before PR
- [ ] npm run build (should work)
- [ ] npm test (should pass)
- [ ] npm start (should work)

# After merge
- [ ] Fresh clone works
- [ ] Cache regenerates automatically
- [ ] .gitignore prevents re-adding
```

---

## ⚙️ PR #3: CI/CD Improvements

### Quick Facts
- **Branch**: `claude/cicd-improvements-pr3-011CUrsDB6WiFFYFrvnPEL4a` (por crear)
- **Files**: ~10 workflows + templates
- **Priority**: 🟡 Medium
- **Depends on**: PR #1, #2 merged
- **Risk**: Medium (affects CI/CD)

### Workflows a Crear/Modificar

1. **security.yml** - Secret scanning (Gitleaks, TruffleHog)
2. **ci.yml** - Optimized main CI
3. **dependency-review.yml** - Dependency scanning
4. **codeql.yml** - Code quality analysis

### Comando Rápido

```bash
git checkout main && git pull
git checkout -b claude/cicd-improvements-pr3-011CUrsDB6WiFFYFrvnPEL4a

# Crear workflows (ver SAFE-PR-STRATEGY.md para código completo)
mkdir -p .github/workflows
# Copiar workflows del documento de estrategia

# Commit
git add .github/
git commit -m "ci: add security scanning and improve CI/CD workflows"
git push -u origin claude/cicd-improvements-pr3-011CUrsDB6WiFFYFrvnPEL4a
```

### Testing
```bash
# Local testing con 'act'
npm install -g act
act push -l  # List jobs
act push  # Run locally
```

---

## 📚 PR #4: Documentation Consolidation

### Quick Facts
- **Branch**: `claude/docs-consolidation-pr4-011CUrsDB6WiFFYFrvnPEL4a` (por crear)
- **Files**: ~270 docs
- **Priority**: 🟡 Medium
- **Depends on**: None (puede ir en paralelo con #2)
- **Risk**: Low (solo docs)

### Estructura Nueva

```
docs/
├── README.md (índice principal)
├── architecture/
│   ├── overview.md
│   └── adr/
├── guides/
│   ├── getting-started.md
│   └── security/
├── api/
├── skills/
├── research/ (formerly investigaciones/)
└── operations/
```

### Comando Rápido

```bash
git checkout main && git pull
git checkout -b claude/docs-consolidation-pr4-011CUrsDB6WiFFYFrvnPEL4a

# Crear estructura
mkdir -p docs/{architecture/adr,guides/security,api,skills,research,operations}

# Mover archivos
git mv documentos/*.md docs/operations/
git mv investigaciones/*.pdf docs/research/

# Crear README principal
# (Ver SAFE-PR-STRATEGY.md para contenido completo)

git commit -m "docs: consolidate documentation into unified structure"
git push -u origin claude/docs-consolidation-pr4-011CUrsDB6WiFFYFrvnPEL4a
```

### Testing
```bash
# Verificar links
npm install -g markdown-link-check
find docs/ -name "*.md" -exec markdown-link-check {} \;
```

---

## 🏗️ PR #5: Core Packages Improvements

### Quick Facts
- **Branch**: `claude/core-improvements-pr5-011CUrsDB6WiFFYFrvnPEL4a` (por crear)
- **Packages**: router, daemon, skills-cli, shared
- **Priority**: 🟠 High
- **Depends on**: PR #1, #2 merged
- **Risk**: High (core functionality)

### Mejoras Principales

1. **Router**: Error handling mejorado
2. **Daemon**: Health checks
3. **Skills CLI**: Nuevos comandos
4. **Shared**: Utilities comunes

### Enfoque Seguro

```bash
# Trabajar package por package
git checkout main && git pull
git checkout -b claude/core-improvements-pr5-011CUrsDB6WiFFYFrvnPEL4a

# 1. Router primero
cd packages/router
# Implementar mejoras
npm test
cd ../..
git add packages/router
git commit -m "refactor(router): improve error handling and validators"

# 2. Daemon
cd packages/daemon
# Implementar mejoras
npm test
cd ../..
git add packages/daemon
git commit -m "refactor(daemon): add health checks and graceful shutdown"

# Y así sucesivamente...

git push -u origin claude/core-improvements-pr5-011CUrsDB6WiFFYFrvnPEL4a
```

### Testing Crítico

```bash
# MUST PASS antes de PR
npm test -- --coverage  # >80% coverage
npm run build          # No errors
npm run lint           # No warnings
npm start              # App starts successfully
```

---

## 🧩 PR #6: Additional Services

### Quick Facts
- **Branch**: `claude/services-pr6-011CUrsDB6WiFFYFrvnPEL4a` (por crear)
- **Packages**: adr-service, bias-mitigation, discovery, etc.
- **Priority**: 🟡 Medium
- **Depends on**: PR #5 merged
- **Risk**: Medium (nuevos servicios)

### Servicios a Mejorar

- packages/adr-service/
- packages/bias-mitigation/
- packages/discovery/
- packages/experimentation/
- packages/kpi/
- packages/performance/

### Approach

Similar a PR #5 pero para nuevos servicios:
1. Tests comprehensivos
2. Documentación API
3. Integración con router
4. Performance testing

---

## 📝 PR #7: Skills Library

### Quick Facts
- **Branch**: `claude/skills-pr7-011CUrsDB6WiFFYFrvnPEL4a` (por crear)
- **Files**: ~109 skills
- **Priority**: 🟢 Low
- **Depends on**: PR #5 merged
- **Risk**: Low (isolated)

### Objetivos

1. Validar estructura de todos los skills
2. Agregar tests
3. Documentar cada skill
4. Crear ejemplos de uso

---

## 📅 Timeline Recomendado

### Semana 1 (Nov 6-12): SEGURIDAD
```
Día 1 (Lun): PR #1 - Rotar password, crear PR
Día 2 (Mar): PR #1 - Review y merge
Día 3 (Mié): PR #2 - Crear y testing
Día 4 (Jue): PR #2 - Review
         PR #4 - Start en paralelo
Día 5 (Vie): PR #2 - Merge
         PR #4 - Continuar
```

### Semana 2 (Nov 13-19): INFRAESTRUCTURA
```
Día 1 (Lun): PR #4 - Finalizar
         PR #3 - Start
Día 2 (Mar): PR #4 - Merge
         PR #3 - Testing
Día 3 (Mié): PR #3 - Review
Día 4 (Jue): PR #3 - Merge
         PR #5 - Start implementación
Día 5 (Vie): PR #5 - Continuar
```

### Semana 3 (Nov 20-26): CORE
```
Día 1 (Lun): PR #5 - Continuar
Día 2 (Mar): PR #5 - Testing y coverage
Día 3 (Mié): PR #5 - Review
Día 4 (Jue): PR #5 - Merge
         PR #6 - Start
Día 5 (Vie): PR #6 - Continuar
```

### Semana 4 (Nov 27-Dec 3): SERVICIOS
```
Día 1 (Lun): PR #6 - Continuar
Día 2 (Mar): PR #6 - Testing
Día 3 (Mié): PR #6 - Merge
         PR #7 - Crear
Día 4 (Jue): PR #7 - Review
Día 5 (Vie): PR #7 - Merge
         🎉 CELEBRAR
```

---

## 🚨 Comandos de Emergencia

### Si un PR causa problemas

```bash
# Rollback inmediato
git checkout main
git revert <commit-hash>
git push origin main

# O si varios commits
git revert <commit1> <commit2> <commit3>
git push origin main
```

### Si se encuentra otra credencial

```bash
# NO COMMITEAR
# Rotar inmediatamente
# Luego:
git checkout -b hotfix/security-urgent-$(date +%Y%m%d)
# Remove credential
git commit -m "security: remove exposed credential"
git push
# Create PR immediately
```

### Si CI falla

```bash
# No mergear, fix en el branch
git checkout <branch-with-issue>
# Fix issue
git commit -m "fix: resolve CI failure"
git push
# CI re-runs automatically
```

---

## ✅ Checklist Global de Progreso

### Semana 1
- [ ] PR #1 password rotado
- [ ] PR #1 logs auditados
- [ ] PR #1 mergeado
- [ ] PR #2 creado
- [ ] PR #2 mergeado
- [ ] PR #4 creado

### Semana 2
- [ ] PR #4 mergeado
- [ ] PR #3 creado
- [ ] PR #3 mergeado
- [ ] PR #5 iniciado

### Semana 3
- [ ] PR #5 testing completo
- [ ] PR #5 mergeado
- [ ] PR #6 iniciado

### Semana 4
- [ ] PR #6 mergeado
- [ ] PR #7 creado y mergeado
- [ ] Retrospectiva completada

---

## 📊 Métricas a Monitorear

### Por cada PR
```bash
# Antes de mergear, verificar:
- CI status: ✅ All checks passing
- Coverage: ✅ >80%
- Build time: ✅ No degradation
- Test time: ✅ No significant increase
- Bundle size: ✅ No unexpected growth
```

### Post-merge (24 horas)
```bash
# Monitorear:
- Error rate: Should remain stable
- Response times: Should not increase
- Memory usage: Should not increase
- CPU usage: Should not increase
```

---

## 📞 Contactos y Responsables

### PR Owners
- **PR #1 (Security)**: Security team + DevOps
- **PR #2 (Cleanup)**: Any developer
- **PR #3 (CI/CD)**: DevOps team
- **PR #4 (Docs)**: Tech writer + developers
- **PR #5 (Core)**: Senior developers
- **PR #6 (Services)**: Service owners
- **PR #7 (Skills)**: Skills team

### Approvers
- Security PRs: Require security team approval
- Core PRs: Require 2 senior dev approvals
- Docs PRs: Require 1 approval
- Other PRs: Require 1 approval minimum

---

## 🎓 Lecciones Aprendidas (para actualizar después)

_Esta sección se completará después de cada PR mergeado_

### PR #1 - Security
- ¿Qué funcionó bien?
- ¿Qué puede mejorarse?
- ¿Tiempo real vs estimado?
- ¿Problemas encontrados?

### PR #2 - Cleanup
- [Pendiente]

### PR #3 - CI/CD
- [Pendiente]

...

---

**Last Updated**: November 6, 2025
**Next Review**: After PR #3
**Version**: 1.0
