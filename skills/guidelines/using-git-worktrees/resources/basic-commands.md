# Git Worktrees - Comandos Fundamentales

## Creación de Worktrees

### Sintaxis Básica
```bash
git worktree add <path> [<branch>]
```

### Ejemplos Prácticos

#### 1. Crear desde Branch Existente
```bash
# Desde branch actual
git worktree add ../feature-a feature-a

# Desde branch remoto
git worktree add ../fix-bug origin/hotfix/urgent

# Desde commit específico
git worktree add ../detached-state abc123def
```

#### 2. Crear con Commit Nuevo (detach HEAD)
```bash
# Crear worktree en estado detached
git worktree add ../testing 123abc

# Verificar estado
cd ../testing
git status
# Output: HEAD detached at 123abc
```

#### 3. Crear desde Substring de Branch
```bash
# Git busca branch automáticamente
git worktree add ../my-work feature/login
# Busca: feature/login, feature-login, login
```

## Gestión de Worktrees

### Listar Worktrees
```bash
# Formato estándar
git worktree list

# Formato para parsing
git worktree list --porcelain

# Con detalles de paths
git worktree list --verbose
```

**Output ejemplo**:
```
/Users/dev/main-repo              abc1234 [main]
/Users/dev/ws-feature-a           def5678 [feature/auth]
/Users/dev/ws-hotfix              123abcd [hotfix/critical]
```

### Eliminar Worktrees

#### Eliminación Segura
```bash
# Verificar si hay cambios
cd <worktree-path>
git status

# Eliminar (si branch está mergeado)
git worktree remove <path>

# Eliminar múltiples
git worktree list | awk '{print $1}' | xargs -I {} git worktree remove {}
```

#### Eliminación Forzada (CUIDADO)
```bash
# Forzar eliminación (pierde cambios no commitados)
git worktree remove <path> --force

# Script para forzar limpieza
#!/bin/bash
for wt in $(git worktree list --porcelain | grep -A1 "worktree" | grep -v "worktree" | sed 's/^path //'); do
  git worktree remove "$wt" --force
done
```

### Mover Worktree
```bash
git worktree move <old-path> <new-path>

# Ejemplo
git worktree move ../ws-old ../ws-new
```

### Lock/Unlock Worktree

```bash
# Bloquear worktree
git worktree lock ../ws-temp --reason "testing temporary"

# Verificar locks
git worktree list

# Desbloquear
git worktree unlock ../ws-temp
```

## Sincronización y Actualización

### Fetch en Todos los Worktrees
```bash
#!/bin/bash
# Actualizar todos los worktrees

for worktree in $(git worktree list --porcelain | grep "^path" | cut -d' ' -f2-); do
  echo "Updating $worktree..."
  (cd "$worktree" && git fetch origin && git pull origin "$(git branch --show-current)")
done
```

### Prune de Referencias Huérfanas
```bash
# Ver qué se limpiará
git worktree prune --dry-run

# Limpiar realmente
git worktree prune

# Con verbose
git worktree prune --verbose
```

## Workflows Comunes

### Desarrollo Paralelo (Script)
```bash
#!/bin/bash
# setup-parallel-worktrees.sh

BASE_PATH="../worktrees"
MAIN_BRANCH="main"

# Verificar que estamos en repo Git
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo "Error: No es un repositorio Git"
  exit 1
fi

# Crear directorio base
mkdir -p "$BASE_PATH"

# Crear worktrees para features
FEATURES=("feature/login" "feature/payment" "feature/notification")

for feature in "${FEATURES[@]}"; do
  worktree_path="$BASE_PATH/ws-${feature//\//-}"
  if [ -d "$worktree_path" ]; then
    echo "Worktree ya existe: $worktree_path"
  else
    echo "Creando worktree: $feature -> $worktree_path"
    git worktree add "$worktree_path" "$feature"
  fi
done

echo "✅ Worktrees creados:"
git worktree list
```

### Cleanup Automático
```bash
#!/bin/bash
# cleanup-worktrees.sh

echo "Worktrees actuales:"
git worktree list

echo -e "\n⚠️  Eliminando worktrees que no existan físicamente..."

# Verificar cada worktree
for path in $(git worktree list --porcelain | grep "^path" | cut -d' ' -f2-); do
  if [ ! -d "$path" ]; then
    echo "❌ Worktree huérfano: $path"
    echo "   Limpiando referencia..."
    git worktree prune
  else
    echo "✅ OK: $path"
  fi
done

echo -e "\n✅ Limpieza completada"
git worktree list
```

## Verificación y Diagnóstico

### Verificar Integridad
```bash
# Verificar que Git detecta correctamente
git worktree list --verbose

# Verificar que cada worktree es repositorio válido
for worktree in $(git worktree list --porcelain | grep "^path" | cut -d' ' -f2-); do
  echo "Checking $worktree..."
  (cd "$worktree" && git status > /dev/null 2>&1) && echo "  ✅ OK" || echo "  ❌ ERROR"
done
```

### Debug de Problemas
```bash
# Ver referencias rotas
git for-each-ref --format='%(refname:short) %(objectname)' refs/worktree

# Verificar hooks en worktree
ls -la <worktree-path>/.git/hooks/

# Ver config de worktree
cat <worktree-path>/.git/worktrees/<name>/config
```

## Comandos Avanzados

### Crear desde Commits Específicos
```bash
# Desde tag
git worktree add ../v2.0.0 v2.0.0

# Desde reflog
git worktree add ../snapshot-1d-ago '@{1 day ago}'

# Desde merge commit
git worktree add ../merge-state HEAD~5^2
```

### Worktrees con Branches Remotos
```bash
# Crear branch local desde remoto y worktree
git fetch origin feature/new
git worktree add ../remote-feature origin/feature/new

# Tracking automático
cd ../remote-feature
git branch --set-upstream-to=origin/feature/new
```

## Automatización con Scripts

### Aliases Útiles
```bash
# .gitconfig
[alias]
  wt-add = worktree add
  wt-list = worktree list --porcelain
  wt-remove = worktree remove
  wt-clean = "!f() { git worktree list --porcelain | grep \"^path\" | cut -d' ' -f2- | while read path; do [ ! -d \"$path\" ] && git worktree remove $(basename $path) --force; done; }; f"
```

### Hook para Actualización Automática
```bash
# post-merge hook (.git/hooks/post-merge)
#!/bin/bash
echo "Verificando worktrees tras merge..."
git worktree prune --dry-run
```

## Tips y Trucos

1. **Evitar nested repos**: No crear worktrees dentro de otros worktrees
2. **Naming consistente**: Usar prefijo `ws-` para identificar rápidamente
3. **Sincronización regular**: Fetch en todos los worktrees semanalmente
4. **Locks para protección**: Lock durante deployments o CI
5. **Backups**: Si pierdes worktree, Git mantiene refs hasta prune

## Troubleshooting Común

| Problema | Solución |
|----------|----------|
| "fatal: worktree already exists" | `git worktree remove <path>` primero |
| "HEAD is detached" | Crear branch: `git checkout -b temp-branch` |
| "unable to locate worktree" | `git worktree prune` para limpiar refs |
| Permission denied | Verificar ownership de directorio |
| "not a valid ref" | Branch no existe, crear desde remoto |
