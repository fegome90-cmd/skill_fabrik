# Arquitectura DevOps - Skills Fabrik

**Versión**: 1.0.0  
**Fecha**: 2025-01-27  
**Status**: ✅ ACTIVE - Arquitectura Base Implementada

---

## 📋 Resumen Ejecutivo

Esta documentación describe la arquitectura DevOps completa del proyecto skills-fabrik, incluyendo:

- **CI/CD Pipelines** con GitHub Actions
- **Pre-commit Hooks** con Husky y lint-staged
- **Code Review Automatizado** con CoderRabbit
- **Conventional Commits** y calidad de código
- **Quality Gates** integrados
- **Scripts de automatización** con GitHub CLI

---

## 🏗️ Componentes de la Arquitectura

### 1. GitHub Actions Workflows

#### 1.1 CI Pipeline (`.github/workflows/ci.yml`)

**Propósito**: Validación continua en cada push y PR

**Jobs**:

- `quality-gates`: Ejecuta todos los quality gates requeridos
- `test`: Ejecuta suite de tests
- `build`: Compila los paquetes del proyecto

**Gates Ejecutados**:

1. ✅ Skills Lint (Required) - Valida estructura de skills
2. ⚠️ Skills Eval (Optional) - Evalúa calidad de skills
3. ✅ Type Check (Required) - Verifica tipos TypeScript
4. ✅ Prettier Check (Required) - Formatea código
5. ✅ Build Check (Required) - Compila sin errores

**Trigger**: Push a `main`/`develop` o PR

#### 1.2 PR Review (`.github/workflows/pr-review.yml`)

**Propósito**: Revisión automática de código con AI

**Integraciones**:

- **CoderRabbit**: Revisión AI de código con OpenAI
- **Conventional Commits Validator**: Valida formato de commits

**Configuración CoderRabbit**:

- Path filters: `.ts`, `.tsx`, `.js`, `.jsx`, `.md`, `.yml`, `.yaml`
- Language: Español
- Reviews: Tests, documentación, consistencia

**Secrets Requeridos**:

- `CODERRABBIT_API_KEY`: API Key de OpenAI para CoderRabbit

**Trigger**: PR opened/synchronize/reopened

#### 1.3 Release (`.github/workflows/release.yml`)

**Propósito**: Automatización de releases

**Jobs**:

- `release`: Crea release en GitHub con changelog
- `publish`: Publica paquetes a npm (si aplica)

**Trigger**: Push de tag `v*`

---

### 2. Pre-commit Hooks (Husky)

#### 2.1 Pre-commit Hook (`.husky/pre-commit`)

**Ejecuta**:

1. `lint-staged` - Formatea y valida archivos staged
2. Verificación de cambios para commitear

**Configuración**: `.lintstagedrc.json`

#### 2.2 Commit Message Hook (`.husky/commit-msg`)

**Valida**: Formato Conventional Commits

**Formato Requerido**: `<type>(<scope>): <subject>`

**Types Válidos**:

- `feat`: Nueva funcionalidad
- `fix`: Bug fix
- `docs`: Documentación
- `style`: Formato (no cambia código)
- `refactor`: Refactorización
- `perf`: Performance
- `test`: Tests
- `chore`: Tareas de mantenimiento
- `ci`: Cambios CI/CD
- `build`: Cambios en build system
- `revert`: Revertir commit

**Ejemplos**:

```bash
feat: add new skill router
fix(cli): resolve index command issue
docs: update README
```

---

### 3. Quality Gates

#### 3.1 Gates Configurables (`ci/GATES.yml`)

Gates definidos en YAML:

- `skills-lint`: Valida estructura de skills
- `skills-eval`: Evalúa calidad de skills
- `no-mess-left-behind`: Build check + Prettier

#### 3.2 Runner Local (`scripts/devops/gates-runner.sh`)

Ejecuta los mismos gates que CI localmente antes de push.

**Uso**:

```bash
pnpm gates
# o
bash scripts/devops/gates-runner.sh
```

---

### 4. GitHub CLI Scripts

#### 4.1 Setup (`scripts/devops/gh-setup.sh`)

Configura GitHub CLI para el proyecto:

- Verifica instalación de `gh`
- Autentica con GitHub
- Verifica acceso al repositorio
- Configura aliases útiles

**Uso**:

```bash
pnpm gh-setup
```

#### 4.2 Create PR (`scripts/devops/create-pr.sh`)

Crea PR automáticamente:

- Push de la rama actual
- Extrae título del último commit
- Detecta tipo de cambio
- Crea PR con template

**Uso**:

```bash
pnpm pr
# o con base branch diferente
bash scripts/devops/create-pr.sh develop
```

---

### 5. Code Quality Tools

#### 5.1 Prettier

**Config**: `.prettierrc.json`

- Semi: `true`
- Single quotes: `true`
- Print width: `100`
- Tab width: `2`

#### 5.2 ESLint

**Config**: `.eslintrc.json`

- TypeScript parser
- Recommended rules
- Custom rules para unused vars

#### 5.3 Commitlint

**Config**: `.commitlintrc.json`

- Extiende Conventional Commits config
- Valida formato de commits

---

## 🚀 Flujo de Trabajo Completo

### Nuevo Feature

1. **Crear rama**:

   ```bash
   git checkout -b feat/nueva-funcionalidad
   ```

2. **Desarrollo**:
   - Escribir código
   - Pre-commit hooks formatean automáticamente
   - Validación de tipos en tiempo real

3. **Commit** (sigue Conventional Commits):

   ```bash
   git commit -m "feat: implementar nueva funcionalidad"
   ```

4. **Ejecutar gates localmente**:

   ```bash
   pnpm gates
   ```

5. **Crear PR**:

   ```bash
   pnpm pr
   ```

6. **CI/CD Automático**:
   - GitHub Actions ejecuta CI
   - CoderRabbit revisa código
   - Quality gates validan
   - Se requiere aprobación para merge

7. **Merge a main**:
   - Si todo pasa, merge a `main`
   - Release automático si hay tag `v*`

---

### Bug Fix

Mismo flujo pero con tipo `fix`:

```bash
git commit -m "fix(cli): resolver issue en index command"
```

---

## 🔐 Secrets y Configuración

### Secrets Requeridos en GitHub

1. **CODERRABBIT_API_KEY**: API Key de OpenAI para CoderRabbit
   - Configurar en: Settings > Secrets and variables > Actions

### Variables de Entorno Locales

Crear `.env.local` (no versionado):

```bash
CODERRABBIT_API_KEY=sk-...
```

---

## 📊 Métricas y Monitoreo

### Quality Metrics

- **Gates Pass Rate**: % de gates pasando
- **PR Review Time**: Tiempo promedio de revisión
- **Commit Quality**: % de commits siguiendo Conventional Commits
- **Build Success Rate**: % de builds exitosos

### KPIs

- **Zero Errors Left Behind**: 100% requerido
- **Mean Fix Latency**: Tiempo promedio para fix
- **PR Merge Time**: Tiempo de PR a merge

---

## 🔧 Troubleshooting

### Pre-commit Hooks No Ejecutan

```bash
# Reinstalar husky
pnpm prepare

# Verificar permisos
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg
```

### Quality Gates Fallan

```bash
# Ejecutar gates localmente para debug
pnpm gates

# Ver logs detallados
bash scripts/devops/gates-runner.sh
```

### CoderRabbit No Revisa PR

1. Verificar que `CODERRABBIT_API_KEY` esté configurado
2. Verificar que el workflow esté activado
3. Revisar logs en Actions tab

### GitHub CLI Issues

```bash
# Re-autenticar
gh auth login

# Verificar acceso
gh repo view fegome90-cmd/skill_fabrik
```

---

## 📚 Referencias

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [CoderRabbit](https://coderabbit.ai/)
- [Husky](https://typicode.github.io/husky/)
- [lint-staged](https://github.com/okonet/lint-staged)
- [GitHub CLI](https://cli.github.com/)

---

## 🎯 Próximos Pasos

- [ ] Configurar branch protection rules en GitHub
- [ ] Agregar más quality gates según necesidad
- [ ] Integrar dependabot para updates automáticos
- [ ] Configurar security scanning (CodeQL)
- [ ] Agregar performance testing en CI
- [ ] Implementar auto-merge para dependabot PRs

---

**Status**: ✅ **ACTIVE - Arquitectura Base Implementada**  
**Mantenedor**: DevOps Team  
**Última Actualización**: 2025-01-27
