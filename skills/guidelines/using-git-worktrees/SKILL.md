---
id: using-git-worktrees
version: 0.1.0
type: guideline
enforcement: suggest
summary: 'Técnica para desarrollo paralelo seguro usando múltiples рабочие árboles. Permite trabajar en múltiples branches simultáneamente sin hacer stash ni commits intermedios.'
description: 'Guía para implementar git worktrees en desarrollo paralelo. Aplica técnicas para trabajar en múltiples branches simultáneamente. Utiliza workspace aislado para comparar ramas y manejar múltiples contextos sin conflictos.'
audience: engineers
when_to_use: 'Al desarrollar features en paralelo, hacer code reviews de múltiples PRs, comparar ramas, o trabajar en hotfixes mientras desarrollas.'
provides: 'Desarrollo paralelo seguro, comparación de branches, workspace aislado, manejo de múltiples contextos.'
resources:
  - resources/basic-commands.md
  - resources/use-cases.md
  - resources/advanced-techniques.md
  - resources/troubleshooting.md
scripts:
  - name: worktree-add
    run: git worktree add <path> <branch>
    note: Crea nuevo worktree con branch específico
  - name: worktree-list
    run: git worktree list
    note: Lista todos los worktrees activos
  - name: worktree-remove
    run: git worktree remove <path>
    note: Elimina worktree específico
  - name: worktree-prune
    run: git worktree prune
    note: Limpia worktrees huérfanos
limits: 'Requiere Git 2.5+. No compartir worktrees entre desarrolladores. Mantener sincronización con branch principal.'
---

## Objetivo

Facilitar el **desarrollo paralelo seguro** mediante git worktrees para trabajar en múltiples branches simultáneamente sin comprometer el estado actual.

**Cuándo usar**:
- Desarrollar 2+ features en paralelo
- Revisar y testear múltiples PRs
- Hacer hotfixes mientras trabajas en feature
- Comparar comportamiento entre branches
- Ejecutar builds/tests en diferentes ramas

**Cuándo NO usar**: Para cambios simples en un solo branch donde git stash es suficiente.

**Qué problema resuelve**: Elimina la necesidad de commits intermedios, stash complejos, o cambiar constantemente de branch durante desarrollo paralelo.

## Procedimiento (resumen)

### Flujo Básico

1. **Crear worktree**: Asignar branch a directorio independiente
   ```bash
   git worktree add ../feature-login feature/login
   ```

2. **Trabajar en worktree**: Navegar al directorio y desarrollar normalmente
   ```bash
   cd ../feature-login
   git checkout -b feature/login/improvements
   # desarrollar normalmente
   ```

3. **Gestionar worktrees**: Listar, eliminar, sincronizar según necesidad
   ```bash
   git worktree list
   git worktree remove ../feature-login
   ```

### Casos de Uso Principales

#### Feature Development Paralelo
```bash
# Desarrollar feature A
git worktree add ../feature-a feature-A
cd ../feature-a

# Sin salir, desarrollar feature B en paralelo
git worktree add ../feature-b feature-B
cd ../feature-b
```

#### Code Review + Desarrollo
```bash
# Review PR #123
git worktree add ../review-pr-123 origin/pr/123
cd ../review-pr-123
npm test

# Trabajar en paralelo
cd ../mi-feature-branch
# desarrollar normalmente
```

#### Hotfix Durante Development
```bash
# Working on feature
git worktree add ../hotfix-urgent origin/hotfix/urgent
cd ../hotfix-urgent
# Fix critical bug
git push origin hotfix/urgent

# Volver a feature sin perder progreso
cd ../mi-feature-branch
```

## Checklist

- [ ] Worktree creado desde branch correcto
- [ ] Directorio ubicado fuera del repo principal
- [ ] Commits sincronizados antes de crear worktree
- [ ] Worktrees gestionados individualmente (no compartido)
- [ ] Sincronización con origin antes de push
- [ ] Worktrees huérfanos limpiados regularmente
- [ ] Notar que cada worktree es repositorio completo

## Ejemplos

### ✅ Correcto - Desarrollo Paralelo

```bash
# 1. Crear worktrees desde main
git checkout main
git pull origin main

# 2. Worktree para feature A
git worktree add ../ws-feature-a feature/auth-system
cd ../ws-feature-a

# 3. Worktree para feature B (desde mismo commit)
cd /path/to/main/repo
git worktree add ../ws-feature-b feature/payment-integration

# 4. Trabajar en ambos independientemente
cd ../ws-feature-a
git checkout -b feature/auth/refresh-token
# desarrollar...

cd ../../ws-feature-b
git checkout -b feature/payment/webhook
# desarrollar...

# 5. Sincronizar y mergear
cd ../ws-feature-a && git pull origin main
cd ../ws-feature-b && git pull origin main
```

### ✅ Correcto - Code Review Multiple

```bash
# Review PR
git worktree add ../review-123 origin/pr/123
cd ../review-123
npm run build
npm test
git log --oneline # revisar commits
git diff HEAD~5..HEAD # ver cambios

# Comparar con local branch
cd ../mi-feature
git diff ../review-123 -- src/components/

# Limpiar después del review
git worktree remove ../review-123
```

### ✅ Correcto - Comparación de Branches

```bash
# Comparar comportamiento entre versiones
git worktree add ../v1.2.3 v1.2.3
git worktree add ../v1.3.0 v1.3.0

cd ../v1.2.3
npm run dev -- --port 3001

cd ../../v1.3.0
npm run dev -- --port 3002
# Comparar ambas versiones en navegador
```

### ❌ Incorrecto

```bash
# ❌ Worktree dentro del directorio principal
git worktree add ./feature-branch feature/branch
# Problema: nesting confunde a Git

# ❌ Olvidar sincronizar con origin
git worktree add ../outdated origin/main # no actualizado
# Problema: trabajo desactualizado

# ❌ Compartir worktree entre developers
# Problema: conflictos de filesystem

# ❌ Worktree sin rama específica (detach HEAD)
git worktree add ../detached 123abc
# Problema: más complejo de gestionar
```

## Comandos Útiles

```bash
# Crear worktree desde branch
git worktree add <path> <branch>

# Listar worktrees con estado
git worktree list
git worktree list --porcelain

# Eliminar worktree (si branch no mergeado)
git worktree remove <path>

# Forzar eliminación (cuidado)
git worktree remove <path> --force

# Mover worktree
git worktree move <old-path> <new-path>

# Bloquear worktree (evitar deletion)
git worktree lock <path> --reason "temporary lock"

# Desbloquear
git worktree unlock <path>

# Limpiar worktrees huérfanos
git worktree prune
git worktree prune --dry-run

# Sincronizar worktree con origin
cd <worktree-path>
git fetch origin
git pull origin <branch>
```

## Buenas Prácticas

### Estructura de Directorios
```
/Users/dev/
├── my-project/          # Repo principal
│   └── .git/
├── ws-feature-a/        # Worktree 1
│   └── (código feature A)
├── ws-feature-b/        # Worktree 2
│   └── (código feature B)
└── ws-hotfix/           # Worktree 3
    └── (código hotfix)
```

### Naming Convention
- `ws-<feature-name>`: Worktrees de features
- `ws-review-<pr-number>`: Code reviews
- `ws-test-<version>`: Testing versiones
- `ws-compare-<branch>`: Comparaciones

### Gestión de Commits
```bash
# Antes de crear worktree
git checkout main
git pull origin main

# En cada worktree
git fetch origin
git pull origin <branch>
# Trabajar...

# Push desde worktree
git push origin <branch>
```

## Recursos

Ver `resources/` para:
- `basic-commands.md`: Comandos fundamentales y sintaxis
- `use-cases.md`: Casos de uso detallados y flujos
- `advanced-techniques.md`: Técnicas avanzadas y automatizaciones
- `troubleshooting.md`: Problemas comunes y soluciones

### Comandos por Categoría

| Categoría | Comando | Uso |
|-----------|---------|-----|
| **Creación** | `git worktree add <path> <branch>` | Crear nuevo worktree |
| **Gestión** | `git worktree list` | Ver todos los worktrees |
| **Limpieza** | `git worktree remove <path>` | Eliminar worktree |
| **Sincronización** | `git worktree prune` | Limpiar referencias |

### Alternativas vs Git Worktrees

| Método | Ventajas | Desventajas |
|--------|----------|-------------|
| **Git Worktrees** | Múltiples branches activos, ningún stash | Requiere Git 2.5+, complejidad extra |
| **Git Stash** | Simple, no filesystem adicional | Perde historial, complejo con múltiples cambios |
| **Múltiples Clones** | Aislamiento completo | Duplica .git, consume espacio |
| **Switch Branches** | Simple, integrado en Git | Pierde cambios no commitados |
