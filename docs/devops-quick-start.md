# 🚀 DevOps Quick Start

Guía rápida para configurar y usar el sistema DevOps de skills-fabrik.

## ⚡ Setup Inicial (Una vez)

```bash
# 1. Instalar dependencias
pnpm install

# 2. Configurar GitHub CLI
pnpm gh-setup

# 3. Configurar Husky (pre-commit hooks)
pnpm prepare

# 4. Configurar secretos en GitHub (opcional pero recomendado)
# Ve a: GitHub Repo > Settings > Secrets and variables > Actions
# Agrega: CODERRABBIT_API_KEY (para code review automático)
```

## 📝 Flujo de Trabajo Diario

### 1. Crear nueva rama

```bash
git checkout -b feat/mi-nueva-funcionalidad
# o
git checkout -b fix/arreglar-bug
```

### 2. Desarrollar

Escribe tu código normalmente. Los pre-commit hooks formatearán automáticamente.

### 3. Commit (Conventional Commits)

```bash
# Formato: <type>(<scope>): <subject>
git commit -m "feat: agregar nuevo router"
git commit -m "fix(cli): corregir bug en index"
git commit -m "docs: actualizar README"
```

**Tipos válidos**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`, `build`, `revert`

### 4. Validar gates localmente (recomendado)

```bash
pnpm gates
```

### 5. Crear PR automáticamente

```bash
pnpm pr
```

Esto:

- Push de tu rama
- Crea PR con template
- Configura CoderRabbit review

### 6. Revisar en GitHub

- CI ejecutará automáticamente
- CoderRabbit revisará tu código
- Espera aprobación y merge

## 🛠️ Comandos Útiles

```bash
# Formatear todo el código
pnpm format

# Lint y fix
pnpm lint:fix

# Ejecutar quality gates
pnpm gates

# Crear PR
pnpm pr

# Ver PRs abiertos (requiere gh CLI)
gh pr list

# Ver detalles de un PR
gh pr view
```

## ✅ Quality Gates

Los siguientes gates se ejecutan automáticamente:

1. ✅ **Skills Lint** - Valida estructura de skills
2. ⚠️ **Skills Eval** - Evalúa calidad (opcional)
3. ✅ **Type Check** - Verifica TypeScript
4. ✅ **Prettier** - Formatea código
5. ✅ **Build** - Compila sin errores

Todos son requeridos excepto Skills Eval.

## 🔍 Troubleshooting

### "Pre-commit hook failed"

```bash
# Reinstalar husky
pnpm prepare
```

### "Commit message format invalid"

El mensaje debe seguir: `<type>(<scope>): <subject>`

Ejemplo válido: `feat: add new feature`

### "Quality gate failed"

Ejecuta localmente para ver detalles:

```bash
pnpm gates
```

## 📚 Más Información

Ver documentación completa en: [`docs/devops-architecture.md`](./devops-architecture.md)
