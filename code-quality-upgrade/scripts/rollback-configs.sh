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

# Simple package.json restoration with guard check
if [ -f "$BACKUP_DIR/package.json" ]; then
  echo "ℹ️  Restoring package.json from backup (scripts-only format)"
  # Backup current before overwriting
  [ -f package.json ] && cp package.json ./package.json.current.backup
  cp "$BACKUP_DIR/package.json" .
  echo "✅ Package.json restored (check ./package.json.current.backup for previous dependencies)"
else
  echo "⚠️ Package.json not found in backup"
fi

cp "$BACKUP_DIR/tsconfig.json" . 2>/dev/null && echo "✅ TypeScript config restored" || echo "⚠️ TypeScript config not found in backup"
cp "$BACKUP_DIR/jest.config.cjs" . 2>/dev/null && echo "✅ Jest config restored" || echo "⚠️ Jest config not found in backup"

echo "✅ Rollback completado desde: $BACKUP_DIR"
