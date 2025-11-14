#!/bin/bash
# Backup Configuration Scripts
# Crea respaldos de configuraciones antes de cambios

echo "🔄 Creando backup de configuraciones..."

BACKUP_DIR="backup/configs/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup configuration files
cp .eslintrc.json "$BACKUP_DIR/" 2>/dev/null || echo "ESLint config not found"
cp .prettierrc.json "$BACKUP_DIR/" 2>/dev/null || echo "Prettier config not found"
cp package.json "$BACKUP_DIR/" 2>/dev/null || echo "Package.json not found"
cp tsconfig.json "$BACKUP_DIR/" 2>/dev/null || echo "TypeScript config not found"
cp jest.config.cjs "$BACKUP_DIR/" 2>/dev/null || echo "Jest config not found"

echo "✅ Backup creado en: $BACKUP_DIR"
echo "📝 Para rollback usar: ./scripts/rollback-configs.sh $BACKUP_DIR"
