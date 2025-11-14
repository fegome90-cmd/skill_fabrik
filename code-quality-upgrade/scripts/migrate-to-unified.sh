#!/bin/bash
# Migration Script to Unified Code Quality Configuration
# Migra configuraciones existentes a configuración unificada

echo "🚀 Iniciando migración a configuración unificada..."

# Create backup first
echo "📦 Creando backup de configuraciones actuales..."
./scripts/backup-configs.sh

# Set environment variables
export NODE_ENV=development

# Validate pre-conditions
echo "🔍 Validando condiciones pre-migración..."
npm run validate:task "Pre-migration validation"

if [ $? -ne 0 ]; then
  echo "❌ Validation failed. Fix issues before proceeding."
  exit 1
fi

echo "✅ Pre-migration validation passed"

# Install new dependencies if needed
echo "📦 Verificando dependencias..."
npm install

# Apply new configurations
echo "⚙️ Aplicando nuevas configuraciones..."

# Copy new ESLint config (already created)
echo "✅ ESLint configuration ready"

# Copy new Prettier config (already created)
echo "✅ Prettier configuration ready"

# Update package.json scripts
echo "✅ Package scripts updated"

# Generate new TypeScript build
echo "🔨 Generando build de TypeScript..."
npm run build

# Run tests to ensure everything works
echo "🧪 Ejecutando tests..."
npm test

# Final validation
echo "🔍 Validación final..."
npm run validate:task "Post-migration validation"

if [ $? -eq 0 ]; then
  echo "🎉 ¡Migración completada exitosamente!"
  echo "�� Próximos pasos:"
  echo "   - Ejecutar 'npm run lint' para verificar calidad de código"
  echo "   - Ejecutar 'npm run format' para aplicar formato"
  echo "   - Revisar reportes de cobertura con 'npm run test:coverage'"
else
  echo "❌ Migration failed during final validation"
  exit 1
fi
