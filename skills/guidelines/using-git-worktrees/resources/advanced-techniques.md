# Git Worktrees - Técnicas Avanzadas

## Automatización Completa

### 1. Gestión Automática de Worktrees

```bash
#!/bin/bash
# worktree-manager.sh - Gestor completo de worktrees

WORKSPACE_DIR="${HOME}/workspace"
CONFIG_FILE="${HOME}/.worktree-config"

# Configuración inicial
init_config() {
  cat > "$CONFIG_FILE" << EOF
{
  "workspace_root": "$WORKSPACE_DIR",
  "auto_prune": true,
  "naming_pattern": {
    "feature": "wt-f-{branch}",
    "review": "wt-r-{pr}",
    "experiment": "wt-x-{timestamp}"
  },
  "sync_policy": "weekly"
}
EOF
}

# Crear worktree con configuración
create_worktree() {
  local branch="$1"
  local type="${2:-feature}"
  local custom_path="$3"

  # Determinar path automáticamente
  if [ -z "$custom_path" ]; then
    pattern=$(jq -r ".naming_pattern.${type}" "$CONFIG_FILE")
    timestamp=$(date +%s)
    custom_path="${WORKSPACE_DIR}/${pattern//\{branch\}/$branch//\{pr\}/$branch//\{timestamp\}/$timestamp}"
  fi

  # Crear directorio si no existe
  mkdir -p "$(dirname "$custom_path")"

  echo "Creating worktree:"
  echo "  Branch: $branch"
  echo "  Path: $custom_path"
  echo "  Type: $type"

  git worktree add "$custom_path" "$branch"

  # Configurar tracking
  cd "$custom_path"
  git branch --set-upstream-to="origin/$branch" 2>/dev/null || true

  echo "✅ Worktree created: $custom_path"
}

# Listar worktrees con metadatos
list_worktrees() {
  echo "=== Active Worktrees ==="
  git worktree list --porcelain | while read -r line; do
    if [[ "$line" == path* ]]; then
      path="${line#path }"
      name=$(basename "$path")
      branch=$(cd "$path" 2>/dev/null && git branch --show-current 2>/dev/null || echo "detached")
      last_commit=$(cd "$path" 2>/dev/null && git log -1 --format="%h %s" 2>/dev/null || echo "N/A")
      size=$(du -sh "$path" 2>/dev/null | cut -f1)

      printf "📁 %-30s | %-20s | %-10s | %s\n" "$name" "$branch" "$size" "$last_commit"
    fi
  done
}

# Sincronizar todos los worktrees
sync_all() {
  echo "🔄 Syncing all worktrees..."
  git worktree list --porcelain | grep "^path" | while read -r line; do
    path="${line#path }"
    name=$(basename "$path")

    echo "  ↻ $name..."
    (cd "$path" && git fetch origin 2>/dev/null && git pull origin "$(git branch --show-current 2>/dev/null)" 2>/dev/null) &
  done
  wait
  echo "✅ Sync complete"
}

# Limpiar worktrees huérfanos
prune_all() {
  echo "🧹 Pruning worktrees..."
  git worktree prune --verbose
  echo "✅ Prune complete"
}

# Eliminar worktree con cleanup
remove_worktree() {
  local path="$1"
  local name=$(basename "$path")

  echo "⚠️  Removing worktree: $name"
  read -p "Are you sure? (y/N) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    git worktree remove "$path" --force
    rm -rf "$path"
    echo "✅ Removed: $name"
  fi
}

# Main menu
case "$1" in
  init)
    init_config
    mkdir -p "$WORKSPACE_DIR"
    echo "✅ Initialized worktree manager"
    ;;
  create)
    create_worktree "$2" "$3" "$4"
    ;;
  list)
    list_worktrees
    ;;
  sync)
    sync_all
    ;;
  prune)
    prune_all
    ;;
  remove)
    remove_worktree "$2"
    ;;
  *)
    echo "Usage: $0 {init|create|list|sync|prune|remove}"
    ;;
esac
```

### 2. Parallel Testing Suite

```bash
#!/bin/bash
# parallel-test.sh - Testear múltiples worktrees simultáneamente

WORKTREES=()
RESULTS_DIR="./test-results"
mkdir -p "$RESULTS_DIR"

# Recopilar worktrees
for worktree in $(git worktree list --porcelain | grep "^path" | cut -d' ' -f2-); do
  WORKTREES+=("$worktree")
done

echo "🧪 Running tests across ${#WORKTREES[@]} worktrees..."

# Función para test en worktree
test_worktree() {
  local wt_path="$1"
  local wt_name=$(basename "$wt_path")
  local output_file="${RESULTS_DIR}/${wt_name}.xml"

  echo "  Testing: $wt_name"
  (cd "$wt_path" && npm test -- --coverage --reporters=default --reporters=jest-junit --outputFile="$output_file" 2>&1) &
}

# Ejecutar en paralelo
for wt in "${WORKTREES[@]}"; do
  test_worktree "$wt"
done

# Esperar todos
wait

echo "✅ Testing complete. Results in $RESULTS_DIR/"

# Generar reporte combinado
echo "📊 Generating combined report..."
npx jest-junit "${RESULTS_DIR}"/*.xml > "${RESULTS_DIR}/combined.xml" 2>/dev/null || true
```

## 3. Git Hooks para Worktrees

### Pre-Commit Hook en Worktree

```bash
# .git/worktrees/<worktree-name>/hooks/pre-commit
#!/bin/bash
# Hook específico para worktree

WORKTREE_NAME=$(basename "$(git rev-parse --show-toplevel)")
BRANCH=$(git branch --show-current)

echo "📝 Pre-commit hook in $WORKTREE_NAME ($BRANCH)"

# Verificar que no estamos en detached HEAD
if git symbolic-ref HEAD >/dev/null 2>&1; then
  echo "✅ On branch: $BRANCH"
else
  echo "❌ Error: Detached HEAD state. Create a branch first."
  exit 1
fi

# Verificar sincronización con origin
LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse @{u} 2>/dev/null)

if [ $LOCAL != $REMOTE ]; then
  echo "⚠️  Warning: Worktree is behind origin. Consider pulling."
  echo "   Local:  $LOCAL"
  echo "   Remote: $REMOTE"
  # No fallar, solo warning
fi

# Ejecutar tests si existen
if [ -f "package.json" ] && npm test -- --passWithNoTests --listTests >/dev/null 2>&1; then
  echo "🧪 Running quick tests..."
  npm test -- --watchAll=false --bail 2>&1 | head -20
fi

echo "✅ Pre-commit checks complete"
```

### Post-Merge Hook para Sincronización

```bash
# .git/worktrees/<worktree-name>/hooks/post-merge
#!/bin/bash

WORKTREE_NAME=$(basename "$(git rev-parse --show-toplevel)"

echo "🔄 Post-merge hook triggered in $WORKTREE_NAME"

# Verificar si hay worktrees nuevos en repo principal
cd "$(git rev-parse --show-toplevel)/../.."  # Ir al repo principal
WORKTREE_COUNT=$(git worktree list | wc -l)

echo "📊 Total worktrees: $WORKTREE_COUNT"

# Limpiar referencias huérfanas si hay muchas
if [ $WORKTREE_COUNT -gt 10 ]; then
  echo "🧹 Large number of worktrees detected. Pruning..."
  git worktree prune --verbose
fi

echo "✅ Post-merge complete"
```

## 4. Integración con IDEs

### VS Code Workspace Configuration

```json
{
  "folders": [
    {
      "path": "../main-repo"
    },
    {
      "path": "../ws-feature-a"
    },
    {
      "path": "../ws-feature-b"
    },
    {
      "path": "../ws-testing"
    }
  ],
  "settings": {
    "git.ignoredLimitWarning": true,
    "files.watcherExclude": {
      "**/.git/objects/**": true,
      "**/node_modules/**": true
    }
  },
  "extensions": {
    "recommendations": [
      "eamodio.gitlens",
      "ms-vscode.vscode-typescript-next"
    ]
  }
}
```

### Vim/Neovim Workflow

```bash
# .vimrc configuration
" Aliases para trabajar con worktrees
nnoremap <leader>wl :!git worktree list<CR>
nnoremap <leader>wa :!git worktree add ../ws-<CR>
nnoremap <leader>wr :!git worktree remove<CR>
nnoremap <leader>ws :!git worktree sync<CR>

" Función para crear worktree y abrir en buffer
function! CreateWorktree(branch)
  let path = "../ws-" . a:branch
  execute "!git worktree add " . path . " " . a:branch
  execute "edit " . path
endfunction

command! -nargs=1 WtCreate call CreateWorktree(<f-args>)
```

## 5. Automated Testing Matrix

```bash
#!/bin/bash
# test-matrix.sh - Matriz de testing cross-branch

FEATURES=("feature/login" "feature/payment" "feature/notifications")
VERSIONS=("v2.0" "v2.1" "main")

echo "🧪 Creating testing matrix..."

# Para cada combinación feature × version
for feature in "${FEATURES[@]}"; do
  for version in "${VERSIONS[@]}"; do
    name="test-${feature//\//-}-${version//\./-}"
    path="../${name}"

    echo "  Creating: $feature @ $version"
    git worktree add "$path" "$version" 2>/dev/null

    if [ -d "$path" ]; then
      cd "$path"
      # Checkout feature en este version
      git checkout -b "$feature" "origin/$feature" 2>/dev/null || git checkout -b "$feature" 2>/dev/null

      # Ejecutar tests
      npm test -- --testPathPattern="$feature" --outputFile="../test-results/${name}.xml" &

      cd - > /dev/null
    fi
  done
done

wait
echo "✅ Matrix testing complete"
```

## 6. Branch Comparison Tool

```bash
#!/bin/bash
# compare-branches.sh - Comparar múltiples branches

BRANCHES=("$@")
REPORT_DIR="./branch-comparison"

if [ ${#BRANCHES[@]} -eq 0 ]; then
  echo "Usage: $0 branch1 branch2 [branch3...]"
  exit 1
fi

mkdir -p "$REPORT_DIR"

echo "🔍 Comparing ${#BRANCHES[@]} branches..."

for branch in "${BRANCHES[@]}"; do
  worktree_path="../compare-${branch//\//-}"
  echo "  Creating worktree for: $branch"
  git worktree add "$worktree_path" "$branch"

  # Generar estadísticas
  echo "Stats for $branch:" > "${REPORT_DIR}/${branch}.txt"
  cd "$worktree_path"
  echo "  Commits: $(git rev-list --count HEAD)" >> "${REPORT_DIR}/${branch}.txt"
  echo "  Contributors: $(git shortlog -sn | wc -l)" >> "${REPORT_DIR}/${branch}.txt"
  echo "  Lines changed: $(git diff --stat | tail -1)" >> "${REPORT_DIR}/${branch}.txt"
  cd - > /dev/null
done

# Generar reporte consolidado
{
  echo "=== Branch Comparison Report ==="
  echo "Generated: $(date)"
  echo
  for branch in "${BRANCHES[@]}"; do
    cat "${REPORT_DIR}/${branch}.txt"
    echo
  done
} > "${REPORT_DIR}/consolidated.txt"

echo "✅ Comparison complete. See: $REPORT_DIR/"
```

## 7. Docker Integration

```bash
# docker-compose.worktrees.yml
version: '3.8'
services:
  worktree-main:
    build: .
    volumes:
      - ../main-repo:/app
    command: npm run dev -- --port 3001

  worktree-feature-a:
    build: .
    volumes:
      - ../ws-feature-a:/app
    environment:
      - PORT=3002
    command: npm run dev

  worktree-feature-b:
    build: .
    volumes:
      - ../ws-feature-b:/app
    environment:
      - PORT=3003
    command: npm run dev

  nginx-proxy:
    image: nginx:alpine
    ports:
      - "8080:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
```

```nginx
# nginx.conf
events {}
http {
  upstream worktree-main {
    server worktree-main:3001;
  }
  upstream worktree-feature-a {
    server worktree-feature-a:3002;
  }
  upstream worktree-feature-b {
    server worktree-feature-b:3003;
  }

  server {
    listen 80;
    location /main/ {
      proxy_pass http://worktree-main/;
    }
    location /feature-a/ {
      proxy_pass http://worktree-feature-a/;
    }
    location /feature-b/ {
      proxy_pass http://worktree-feature-b/;
    }
  }
}
```

## 8. Git Worktrees con Stash Complejo

```bash
#!/bin/bash
# stash-manager.sh - Manejo avanzado de stashes en worktrees

# Crear stash desde worktree y aplicar a otro
create_smart_stash() {
  local source_wt="$1"
  local target_wt="$2"
  local stash_name="${3:-auto-stash-$(date +%s)}"

  cd "$source_wt"
  if git diff-index --quiet HEAD --; then
    echo "⚠️  No changes to stash in $source_wt"
    return 1
  fi

  # Crear stash con metadata
  git stash push -m "$stash_name" --include-untracked
  local stash_ref=$(git rev-parse stash@{0})

  # Aplicar a target
  cd "$target_wt"
  git stash pop "$stash_ref"

  echo "✅ Stashed from $source_wt to $target_wt"
}

# Sincronizar stashes entre worktrees
sync_stashes() {
  local primary_wt="$1"

  echo "📦 Syncing stashes from $primary_wt to all worktrees..."

  cd "$primary_wt"
  local stash_count=$(git stash list | wc -l)

  if [ $stash_count -eq 0 ]; then
    echo "No stashes in $primary_wt"
    return
  fi

  # Exportar stashes
  git stash list --pretty=format:'%gd: %gs' | while read -r line; do
    git stash show -p "$line" > "/tmp/stash-$(echo "$line" | cut -d: -f1).patch"
  done

  # Aplicar a otros worktrees
  for worktree in $(git worktree list --porcelain | grep "^path" | cut -d' ' -f2-); do
    if [ "$worktree" != "$primary_wt" ]; then
      name=$(basename "$worktree")
      echo "  → $name"
      cd "$worktree"

      for patch in /tmp/stash-*.patch; do
        git apply "$patch" 2>/dev/null || echo "    Failed to apply $(basename "$patch")"
      done
    fi
  done

  rm /tmp/stash-*.patch
}
```

## 9. Monitoring y Metrics

```bash
#!/bin/bash
# worktree-monitor.sh - Monitor de recursos y performance

METRICS_FILE="./worktree-metrics.json"

collect_metrics() {
  echo "📊 Collecting worktree metrics..."

  {
    echo "{"
    echo "  \"timestamp\": \"$(date -Iseconds)\","
    echo "  \"worktrees\": ["

    first=true
    for worktree in $(git worktree list --porcelain | grep "^path" | cut -d' ' -f2-); do
      $first || echo ","
      $first=false

      name=$(basename "$worktree")
      size=$(du -sb "$worktree" | cut -f1)
      commits=$(cd "$worktree" && git rev-list --count HEAD 2>/dev/null || echo 0)
      branches=$(cd "$worktree" && git branch -a | wc -l)
      files=$(find "$worktree" -type f | wc -l)

      # Métricas de performance
      test_time=$(cd "$worktree" && timeout 10 npm test -- --listTests 2>/dev/null | wc -l || echo 0)

      cat << EOF
    {
      "name": "$name",
      "path": "$worktree",
      "size_bytes": $size,
      "commits": $commits,
      "branches": $branches,
      "files": $files,
      "test_count": $test_time
    }
EOF
    done

    echo "  ]"
    echo "}"
  } > "$METRICS_FILE"

  echo "✅ Metrics saved to $METRICS_FILE"
}

# Generar alertas basadas en thresholds
check_thresholds() {
  echo "⚠️  Checking thresholds..."

  # Alerta: Worktree muy grande (>1GB)
  for worktree in $(git worktree list --porcelain | grep "^path" | cut -d' ' -f2-); do
    size=$(du -sb "$worktree" | cut -f1)
    if [ $size -gt 1073741824 ]; then
      name=$(basename "$worktree")
      echo "  🚨 Large worktree detected: $name ($(numfmt --to=iec-i --suffix=B $size))"
    fi
  done

  # Alerta: Muchos worktrees activos
  wt_count=$(git worktree list | grep -c "worktree" || echo 0)
  if [ $wt_count -gt 10 ]; then
    echo "  ⚠️  High worktree count: $wt_count (consider pruning)"
  fi
}
```

## 10. Integration with CI/CD

```bash
# .github/workflows/worktree-ci.yml
name: Worktree Matrix CI

on:
  push:
    branches: [main]

jobs:
  test-matrix:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        worktree: [feature-a, feature-b, hotfix]
    steps:
      - uses: actions/checkout@v2
        with:
          # Checkout como worktree
          path: main-repo

      - name: Create worktree for ${{ matrix.worktree }}
        run: |
          cd main-repo
          git worktree add "../ws-${{ matrix.worktree }}" "origin/${{ matrix.worktree }}"

      - name: Test ${{ matrix.worktree }}
        run: |
          cd "ws-${{ matrix.worktree }}"
          npm install
          npm test
```

## Tips de Optimización

### 1. **Sharing Objects Between Worktrees**
Git automáticamente comparte objects entre worktrees del mismo repo:
```bash
# Verificar shared objects
ls -la .git/objects/
# Los objects son hardlinks, no duplicados
```

### 2. **Hardlink Optimization**
```bash
# Git usa hardlinks automáticamente en worktrees
# Verificar si usa hardlinks:
git worktree list --porcelain | grep -o "worktree.*" | while read line; do
  echo "$line:"
  stat -f "%Hp %N" ".git/worktrees/$(basename $line)/" | head -1
done
```

### 3. **Custom Git Directory**
```bash
# Worktrees con git directories personalizados
git worktree add --detach ../custom-wt HEAD
GIT_DIR=.git/custom-wt git log
```

### 4. **Selective File Watching**
```json
// package.json - Chokidar ignore para worktrees
{
  "watchOptions": {
    "ignored": [
      "**/node_modules/**",
      "**/.git/**",
      "**/../ws-*/**",
      "**/../compare-*/**"
    ]
  }
}
```
