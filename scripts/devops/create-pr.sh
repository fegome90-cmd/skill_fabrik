#!/bin/bash
# Script para crear PR siguiendo Conventional Commits y best practices

set -e

BRANCH=$(git branch --show-current)
BASE_BRANCH=${1:-main}

# Verificar que estamos en una rama diferente a main
if [ "$BRANCH" = "$BASE_BRANCH" ]; then
  echo "❌ No puedes crear un PR desde la rama $BASE_BRANCH"
  echo "💡 Crea una nueva rama primero: git checkout -b feat/nueva-funcionalidad"
  exit 1
fi

# Verificar que haya cambios para commitear
if [ -z "$(git status --porcelain)" ]; then
  echo "⚠️  No hay cambios para commitear"
  exit 1
fi

# Verificar que haya commits para pushear
if [ "$(git rev-list --count origin/$BASE_BRANCH..HEAD 2>/dev/null || echo 0)" -eq 0 ]; then
  echo "⚠️  No hay commits nuevos para pushear"
  echo "💡 Haz commit primero: git commit -m 'feat: tu mensaje'"
  exit 1
fi

# Pushear la rama
echo "📤 Pushing branch $BRANCH..."
git push -u origin "$BRANCH"

# Extraer tipo y descripción del último commit para el título del PR
LAST_COMMIT=$(git log -1 --pretty=format:"%s")
PR_TITLE=$(echo "$LAST_COMMIT" | sed 's/^[^:]*: //')

# Detectar tipo de cambio del commit
COMMIT_TYPE=$(echo "$LAST_COMMIT" | grep -oE '^(feat|fix|docs|style|refactor|perf|test|chore|ci|build)' | head -1 || echo "chore")

# Crear el PR usando gh CLI
echo "🔨 Creating PR..."
gh pr create \
  --base "$BASE_BRANCH" \
  --head "$BRANCH" \
  --title "$PR_TITLE" \
  --body "## Descripción

$(git log origin/$BASE_BRANCH..HEAD --pretty=format:'- %s' --reverse)

## Tipo de Cambio

- [ ] 🐛 Bug fix
- [ ] ✨ Nueva funcionalidad
- [ ] 📝 Documentación
- [ ] ♻️ Refactorización
- [ ] ⚡ Performance
- [ ] ✅ Test

## Checklist

- [ ] Código sigue las guías de estilo
- [ ] Tests pasan localmente
- [ ] Documentación actualizada si es necesario
- [ ] Commits siguen Conventional Commits

---

Auto-generado desde: \`$BRANCH\`" \
  --label "$COMMIT_TYPE"

echo "✅ PR creado exitosamente!"
echo "🔗 Revisa el PR en GitHub para agregar más detalles si es necesario"
