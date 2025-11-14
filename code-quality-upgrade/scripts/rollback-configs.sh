#!/bin/bash
# Rollback Configuration Scripts
# Restaura configuraciones desde backup

if [ -z "$1" ]; then
  echo "❌ Error: Especifica el directorio de backup"
  echo "Uso: ./scripts/rollback-configs.sh backup_dir"
  echo "Ejemplos:"
  echo "  ./scripts/rollback-configs.sh backup/configs/20251114_120000"
  echo "  ./scripts/rollback-configs.sh latest"
  exit 1
fi

if [ "$1" = "latest" ]; then
  BACKUP_DIR=$(ls -td backup/configs/*/ | head -1)
else
  BACKUP_DIR="$1"
fi

if [ ! -d "$BACKUP_DIR" ]; then
  echo "❌ Error: Directorio de backup no existe: $BACKUP_DIR"
  exit 1
fi

echo "🔄 Restaurando configuraciones desde: $BACKUP_DIR"

# Restore configuration files
cp "$BACKUP_DIR/.eslintrc.json" . 2>/dev/null && echo "✅ ESLint config restored" || echo "⚠️ ESLint config not found in backup"
cp "$BACKUP_DIR/.prettierrc.json" . 2>/dev/null && echo "✅ Prettier config restored" || echo "⚠️ Prettier config not found in backup"
cp "$BACKUP_DIR/package.json" . 2>/dev/null && echo "✅ Package.json restored" || echo "⚠️ Package.json not found in backup"
cp "$BACKUP_DIR/tsconfig.json" . 2>/dev/null && echo "✅ TypeScript config restored" || echo "⚠️ TypeScript config not found in backup"
cp "$BACKUP_DIR/jest.config.cjs" . 2>/dev/null && echo "✅ Jest config restored" || echo "⚠️ Jest config not found in backup"

echo "✅ Rollback completado desde: $BACKUP_DIR"
