#!/bin/bash
# Script para configurar GitHub CLI y workflows locales

set -e

echo "🚀 Setting up GitHub CLI for skills-fabrik..."

# Verificar que gh CLI esté instalado
if ! command -v gh &> /dev/null; then
  echo "❌ GitHub CLI (gh) no está instalado."
  echo "📦 Instala con: brew install gh (macOS) o visita: https://cli.github.com/"
  exit 1
fi

# Autenticar con GitHub (si no está autenticado)
if ! gh auth status &> /dev/null; then
  echo "🔐 Necesitas autenticarte con GitHub..."
  gh auth login
fi

# Verificar conexión con el repositorio
REPO="fegome90-cmd/skill_fabrik"
if ! gh repo view "$REPO" &> /dev/null; then
  echo "❌ No se puede acceder al repositorio $REPO"
  echo "Verifica que tengas acceso y que el remoto esté configurado correctamente"
  exit 1
fi

echo "✅ GitHub CLI configurado correctamente"

# Configurar alias útiles
echo ""
echo "📝 Aliases de gh CLI configurados:"
echo "  gh pr create    - Crear un nuevo PR"
echo "  gh pr list      - Listar PRs abiertos"
echo "  gh pr view      - Ver detalles de un PR"
echo "  gh issue create - Crear un nuevo issue"
echo "  gh release create - Crear un nuevo release"

echo ""
echo "✨ Setup completado!"
