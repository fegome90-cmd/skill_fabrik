#!/bin/bash
# Backup Configuration Scripts
# Crea respaldos de configuraciones antes de cambios

echo "🔄 Creando backup de configuraciones..."

BACKUP_DIR="backup/configs/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup configuration files
cp .eslintrc.json "$BACKUP_DIR/" 2>/dev/null || echo "ESLint config not found"
cp .prettierrc.json "$BACKUP_DIR/" 2>/dev/null || echo "Prettier config not found"

# Backup only package.json scripts section (not dependencies and devDependencies)
if [ -f package.json ]; then
  node -e "
    const pkg = require('./package.json');
    const backupPkg = {
      name: pkg.name,
      version: pkg.version,
      scripts: pkg.scripts || {},
      engines: pkg.engines || {}
    };
    require('fs').writeFileSync('$BACKUP_DIR/package.json', JSON.stringify(backupPkg, null, 2));
  "
fi

cp tsconfig.json "$BACKUP_DIR/" 2>/dev/null || echo "TypeScript config not found"
cp jest.config.cjs "$BACKUP_DIR/" 2>/dev/null || echo "Jest config not found"

# Prevent npm from installing dependencies in backup directory
echo "# BACKUP DIRECTORY - DO NOT INSTALL DEPENDENCIES HERE" > "$BACKUP_DIR/.npmignore"
echo "node_modules/" >> "$BACKUP_DIR/.npmignore"
echo "# This is a backup directory created by backup-configs.sh" >> "$BACKUP_DIR/.npmignore"

echo "✅ Backup creado en: $BACKUP_DIR"
echo "📝 Para rollback usar: ./scripts/rollback-configs.sh $BACKUP_DIR"
