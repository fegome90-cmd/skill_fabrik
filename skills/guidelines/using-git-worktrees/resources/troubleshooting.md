# Git Worktrees - Troubleshooting

## Problemas Comunes y Soluciones

### 1. "fatal: worktree '<path>' already exists"

**Causa**: El directorio ya existe o Git mantiene referencia.

**Diagnóstico**:
```bash
# Verificar si el directorio existe físicamente
ls -la ../ws-feature-a

# Verificar referencias en Git
git worktree list --porcelain | grep -A2 "../ws-feature-a"

# Verificar refs internas
ls -la .git/worktrees/
```

**Soluciones**:

```bash
# Opción 1: Limpiar referencia huérfana
git worktree prune

# Opción 2: Eliminar directorio físico
rm -rf ../ws-feature-a

# Opción 3: Forzar creación (SI seguro que no hay trabajo pendiente)
git worktree remove ../ws-feature-a --force
git worktree add ../ws-feature-a feature-a

# Opción 4: Mover existente
mv ../ws-feature-a ../ws-feature-a-backup
git worktree add ../ws-feature-a feature-a
```

**Prevención**:
- Usar naming conventions únicos
- Verificar antes de crear: `git worktree list`
- Script helper para crear safely:

```bash
# safe-worktree-add.sh
#!/bin/bash
BRANCH="$1"
NAME="${2:-wt-$BRANCH}"
PATH="../$NAME"

if [ -d "$PATH" ]; then
  echo "⚠️  Directory exists: $PATH"
  read -p "Remove and recreate? (y/N) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf "$PATH"
  else
    exit 1
  fi
fi

git worktree add "$PATH" "$BRANCH"
echo "✅ Created: $PATH"
```

---

### 2. "fatal: 'HEAD' is a detached HEAD state"

**Causa**: Worktree creado desde commit específico sin branch.

**Diagnóstico**:
```bash
cd <worktree-path>
git status
# Output: HEAD detached at 123abc

git log --oneline -1
# Muestra commit actual
```

**Soluciones**:

```bash
# Opción 1: Crear branch en worktree
cd <worktree-path>
git checkout -b temp-branch
git branch -D main  # si hay conflicto
git checkout -b main

# Opción 2: Recrear con branch explícito
git worktree remove <worktree-path>
git worktree add <worktree-path> <branch-name>

# Opción 3: Si es intencional (testing), documentar
cd <worktree-path>
echo "# Detached HEAD for testing commit $COMMIT" > WORKTREE-README.md
```

**Prevención**:
```bash
# Siempre especificar branch
git worktree add <path> $(git branch --show-current)

# Script para crear desde HEAD actual
create_from_current() {
  BRANCH=$(git branch --show-current)
  git worktree add "../ws-${BRANCH}" "$BRANCH"
}
```

---

### 3. "fatal: unable to locate worktree for 'branch'"

**Causa**: Branch no existe o referencia rota.

**Diagnóstico**:
```bash
# Verificar que branch existe
git branch -a | grep branch-name

# Verificar refs
git show-ref branch-name

# Verificar si está en remote
git ls-remote origin | grep branch-name
```

**Soluciones**:

```bash
# Opción 1: Crear branch desde remote
git fetch origin
git worktree add <path> origin/branch-name

# Opción 2: Crear branch local
git worktree add <path> -b new-branch

# Opción 3: Verificar error en ref
git fsck --full
```

---

### 4. Permission Denied Errors

**Causa**: Permisos de filesystem o ownership incorrecto.

**Diagnóstico**:
```bash
# Verificar ownership
ls -la .git/worktrees/

# Verificar permisos
stat -f "%Mp%Lp" <worktree-path>

# Verificar extended attributes
xattr -l <worktree-path>
```

**Soluciones**:

```bash
# Corregir ownership
sudo chown -R $(whoami) <worktree-path>

# Corregir permisos
chmod -R 755 <worktree-path>
chmod -R 755 .git/worktrees/<worktree-name>/

# Si en macOS con System Integrity Protection
sudo xattr -dr com.apple.quarantine <worktree-path>
```

**Prevención**:
- No usar `sudo` para crear worktrees
- Crear worktrees en directorios donde tienes permisos completos
- Evitar encryption metadata de macOS

---

### 5. "fatal: could not read from the remote repository"

**Causa**: Worktree sin configuración de remote o red.

**Diagnóstico**:
```bash
cd <worktree-path>
git remote -v
git config --get remote.origin.url
```

**Soluciones**:

```bash
# Configurar remote en worktree
cd <worktree-path>
git remote add origin <repo-url>
git fetch origin

# O copiar config del repo principal
cd /path/to/main/repo
git config --get remote.origin.url
cd <worktree-path>
git remote add origin <same-url>

# Para automático: script de setup
setup_worktree() {
  local path="$1"
  local branch="$2"

  git worktree add "$path" "$branch"
  cd "$path"

  # Copiar remote del repo principal
  local remote_url=$(git config --get remote.origin.url)
  git remote add origin "$remote_url" 2>/dev/null || true

  echo "✅ Worktree configured: $path"
}
```

---

### 6. "fatal: cannot move '.git/worktrees/old' to '.git/worktrees/new': Directory not empty"

**Causa**: Directory de worktree existe con contenido.

**Solución**:

```bash
# Eliminar worktree primero
git worktree remove old-path

# O usar move con --force (si existe flag)
# Git no soporta esto nativamente, usar:

mv old-path old-temp
git worktree add new-path branch-name
rm -rf old-temp
```

---

### 7. Worktree desincronizado con origin

**Diagnóstico**:
```bash
cd <worktree-path>
git status
# Muestra: "Your branch is behind origin/main by 3 commits"

git log --oneline HEAD..origin/main
# Muestra commits que faltan
```

**Soluciones**:

```bash
# Opción 1: Pull estándar
cd <worktree-path>
git pull origin <branch>

# Opción 2: Force pull (SI seguro)
git fetch origin
git reset --hard origin/<branch>

# Opción 3: Sincronizar múltiples
sync_all_worktrees() {
  for worktree in $(git worktree list --porcelain | grep "^path" | cut -d' ' -f2-); do
    name=$(basename "$worktree")
    echo "Syncing: $name"
    cd "$worktree"
    git fetch origin
    git pull origin "$(git branch --show-current)" 2>&1 | grep -v "Already up to date" || true
  done
}
```

---

### 8. Worktree con cambios no trackeados

**Diagnóstico**:
```bash
cd <worktree-path>
git status
# Muestra: "Changes not staged for commit"
```

**Soluciones**:

```bash
# Opción 1: Commit normalmente
git add .
git commit -m "WIP: work in progress"

# Opción 2: Stash
git stash push -m "WIP in worktree"

# Opción 3: Si necesitas mover a otro worktree
git stash
git worktree add <other-path> <other-branch>
cd <other-path>
git stash pop

# Opción 4: Exportar como patch
git diff > /tmp/worktree-changes.patch
cd <other-path>
git apply /tmp/worktree-changes.patch
```

---

### 9. Corrupted Worktree State

**Síntomas**:
- `git worktree list` muestra worktrees inexistentes
- Errores al acceder a worktree
- "No such file or directory" en directorio que existe

**Diagnóstico**:
```bash
# Verificar integridad
git worktree list --verbose

# Verificar refs
git for-each-ref --format='%(refname:short) %(objectname)' refs/worktree

# Verificar filesystem
fsck <worktree-path>
```

**Soluciones**:

```bash
# Limpiar referencias huérfanas
git worktree prune --verbose

# Si sigue corrupto, recrear ref manualmente
rm -rf .git/worktrees/<broken-name>
git worktree add <path> <branch>

# Si hay trabajo pendiente, copiar antes
cp -r <broken-path> <backup-path>
git worktree remove <broken-path>
git worktree add <path> <branch>

# Restaurar archivos manualmente
cp <backup-path>/important-file <path>/
```

---

### 10. High Disk Usage con Worktrees

**Diagnóstico**:
```bash
# Ver tamaño de cada worktree
du -sh ../ws-*

# Verificar shared objects
du -sh .git/objects/

# Comparar clones vs worktrees
du -sh ../ws-feature-a
du -sh ../clone-feature-a
```

**Soluciones**:

```bash
# Limpiar node_modules en worktrees inactivos
for wt in ../ws-*; do
  if [ -d "$wt/node_modules" ]; then
    echo "Cleaning $wt/node_modules"
    rm -rf "$wt/node_modules"
  fi
done

# Comprimir objetos
git gc --aggressive

# Monitorear crecimiento
watch 'du -sh ../ws-* | sort -hr'

# Script de cleanup automático
cleanup_worktrees() {
  for worktree in $(git worktree list --porcelain | grep "^path" | cut -d' ' -f2-); do
    name=$(basename "$worktree")
    size=$(du -sb "$worktree" | cut -f1)
    size_human=$(numfmt --to=iec-i --suffix=B $size)

    # Alert si > 500MB
    if [ $size -gt 524288000 ]; then
      echo "⚠️  Large worktree: $name ($size_human)"

      # Limpiar caches
      cd "$worktree"
      rm -rf node_modules/.cache 2>/dev/null || true
      rm -rf dist/*.map 2>/dev/null || true
    fi
  done
}
```

---

## Scripts de Recuperación

### Recovery Script 1: Listo Huérfanos

```bash
#!/bin/bash
# recover-orphaned.sh

echo "🔍 Scanning for orphaned worktrees..."

# Verificar cada worktree en .git/worktrees/
for wt_ref in .git/worktrees/*/; do
  wt_name=$(basename "$wt_ref")
  wt_path=$(cat "$wt_ref/gitdir" 2>/dev/null | sed 's|.git/worktrees/'$wt_name'||')

  if [ ! -d "$wt_path" ]; then
    echo "  ❌ Orphaned: $wt_name (path: $wt_path not found)"
    echo "     Removing reference..."
    rm -rf "$wt_ref"
  else
    echo "  ✅ OK: $wt_name"
  fi
done

echo "🧹 Pruning..."
git worktree prune --verbose
```

### Recovery Script 2: Recrear Worktree Rota

```bash
#!/bin/bash
# rebuild-worktree.sh

BROKEN_PATH="$1"
BRANCH="$2"

if [ -z "$BROKEN_PATH" ] || [ -z "$BRANCH" ]; then
  echo "Usage: $0 <broken-path> <branch>"
  exit 1
fi

NAME=$(basename "$BROKEN_PATH")

echo "🔧 Rebuilding worktree: $NAME"

# Backup si existe algo útil
if [ -d "$BROKEN_PATH" ]; then
  echo "  Backing up to /tmp/$NAME-backup..."
  cp -r "$BROKEN_PATH" "/tmp/$NAME-backup" 2>/dev/null || true
fi

# Limpiar referencia rota
git worktree remove "$BROKEN_PATH" --force 2>/dev/null || true

# Recrear
echo "  Creating fresh worktree..."
git worktree add "$BROKEN_PATH" "$BRANCH"

echo "✅ Rebuilt: $BROKEN_PATH"
```

### Recovery Script 3: Verificar Integridad Completa

```bash
#!/bin/bash
# verify-worktrees.sh

ERRORS=0

echo "🔍 Verifying all worktrees..."

for worktree in $(git worktree list --porcelain | grep "^path" | cut -d' ' -f2-); do
  name=$(basename "$worktree")
  echo -n "Checking $name... "

  # Verificar directorio existe
  if [ ! -d "$worktree" ]; then
    echo "❌ Missing directory"
    ((ERRORS++))
    continue
  fi

  # Verificar .git es válido
  if [ ! -f "$worktree/.git" ]; then
    echo "❌ Missing .git"
    ((ERRORS++))
    continue
  fi

  # Verificar status de Git
  if !(cd "$worktree" && git status > /dev/null 2>&1); then
    echo "❌ Git error"
    ((ERRORS++))
    continue
  fi

  echo "✅ OK"
done

echo
if [ $ERRORS -eq 0 ]; then
  echo "✅ All worktrees verified successfully"
else
  echo "❌ Found $ERRORS error(s)"
  exit 1
fi
```

---

## Logs y Debugging

### Activar Logging Detallado

```bash
# Variable de entorno para verbose
export GIT_TRACE=1
export GIT_CURL_VERBOSE=1
export GIT_TRACE_PERFORMANCE=1

# Git trace to file
git config core.logAllRefUpdates true
git config core.verbose true

# Ver logs
tail -f .git/logs/HEAD
```

### Analizar Performance de Worktrees

```bash
# Tiempo para crear worktree
time git worktree add ../test-wt main

# Verificar performance
GIT_TRACE_PERFORMANCE=1 git worktree list

# Analizar I/O
time du -sh ../ws-*
```

---

## Prevention Checklist

- [ ] **Naming Convention**: Siempre usar prefijo consistente (`ws-`, `review-`, `test-`)
- [ ] **Verification**: `git worktree list` antes de crear
- [ ] **Sync Policy**: Fetch semanal en todos los worktrees
- [ ] **Cleanup Script**: Ejecutar `git worktree prune` monthly
- [ ] **Backup**: Para worktrees con trabajo crítico
- [ ] **Documentation**: README en cada worktree explicando propósito
- [ ] **Max Count**: No más de 5-7 worktrees activos simultáneamente
- [ ] **Permission Check**: Verificar ownership antes de crear
- [ ] **Remote Config**: Configurar origin en cada worktree
- [ ] **Disk Monitoring**: Alert si worktree > 1GB

---

## Command Reference for Debugging

| Comando | Uso |
|---------|-----|
| `git worktree list --porcelain` | Lista parseable para scripts |
| `git worktree list --verbose` | Detalles completos |
| `git worktree prune --dry-run` | Ver qué se limpiará |
| `ls -la .git/worktrees/` | Ver referencias internas |
| `cat .git/worktrees/<name>/gitdir` | Ver path real |
| `git for-each-ref refs/worktree` | Todas las refs de worktrees |
| `git fsck --full` | Verificar integridad |
| `GIT_TRACE=1 git <command>` | Debug verbose |

---

## Herramientas de Third-Party

### `git-wt` Wrapper
```bash
# Instalar wrapper para worktrees
npm install -g git-wt

# Usar comandos simplificados
git wt add feature-x
git wt list
git wt sync
```

### `git-worktree-ui` (tbd)
```bash
# GUI para gestión visual
git-worktree-ui &
# Navegador: http://localhost:3000
```

---

## FAQ

**P: ¿Cuántos worktrees puedo crear?**
R: Técnicamente ilimitados, pero recomendados ≤10 por rendimiento y gestión.

**P: ¿Worktrees comparten node_modules?**
R: No, cada uno es independiente. Usar `--ignore-scripts` o `npm ci` en parallel.

**P: ¿Cómo compartir worktree entre developers?**
R: No recomendado. Los worktrees son locales por diseño. Usar branches y PRs.

**P: ¿Puedo crear worktree de worktree?**
R: Técnicamente sí, pero genera confusión. Evitar nesting.

**P: ¿Cómo automatizar cleanup?**
R: Cron job diario: `git worktree prune && for wt in ../ws-*; do [ ! -d "$wt" ] && echo "$wt"; done`

**P: ¿Diferencia con `git clone --depth`?**
R: Worktree usa menos espacio (hardlinks de objects), clone duplica todo.

**P: ¿Funciona con submodules?**
R: Sí, pero cada worktree tiene sus own submodules init.

**P: ¿Cómo migrar de stashes a worktrees?**
R: `git stash show -p | git apply` en worktree nuevo, o recrear branch.

**P: ¿Compatible con IDEs como VSCode?**
R: Sí, abrir folder del worktree. Multi-root workspace recomendado.

**P: ¿Hay límite de tamaño?**
R: Solo límites de filesystem. Monitorear con `du -sh`.
