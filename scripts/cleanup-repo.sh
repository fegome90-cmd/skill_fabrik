#!/bin/bash
# cleanup-repo.sh - Organize Skills Fabrik repository

echo "🧹 Cleaning up Skills Fabrik repository..."

# Create missing directories
echo "📁 Creating directory structure..."
mkdir -p docs/{deployment,planning,analysis,archive}
mkdir -p obs/logs
mkdir -p test/ad-hoc
mkdir -p scripts/{utilities,monitoring,performance}

# Move log files
echo "📝 Moving log files..."
find . -maxdepth 1 -name "*.log" -exec mv {} obs/logs/ \; 2>/dev/null || true

# Move analysis docs
echo "📊 Organizing analysis docs..."
mv ANALISIS-DETALLADO-PROBLEMAS-ADICIONALES.md docs/analysis/ 2>/dev/null || true
mv EJEMPLOS-CODIGO-CORRECCIONES.md docs/analysis/ 2>/dev/null || true
mv INFORME-ANALISIS-ROUTER-DAEMON-FILEWATCHER.md docs/analysis/ 2>/dev/null || true
mv README-ANALISIS.md docs/analysis/ 2>/dev/null || true
mv RESUMEN-EJECUTIVO-METRICAS.md docs/analysis/ 2>/dev/null || true
mv cli-analysis-v2.md docs/analysis/ 2>/dev/null || true

# Move architecture docs
echo "🏗️ Organizing architecture docs..."
mv MEMTECH-INTEGRATION-SUMMARY.md docs/architecture/ 2>/dev/null || true
mv PROMPT-BUILDER-V2-GUIA-COMPLETA.md docs/architecture/ 2>/dev/null || true

# Move ad-hoc test files
echo "🧪 Organizing test files..."
mv test1.js test2.ts test3.md realtime-test.ts test/ad-hoc/ 2>/dev/null || true
find . -maxdepth 1 -name "test-*.js" -exec mv {} test/ad-hoc/ \; 2>/dev/null || true
find . -maxdepth 1 -name "test-*.ts" -exec mv {} test/ad-hoc/ \; 2>/dev/null || true

# Move utility scripts
echo "🔧 Organizing scripts..."
mv analyze-cli-with-prompt-builder.mjs scripts/utilities/ 2>/dev/null || true
mv create-cli-interaction-plan.mjs scripts/utilities/ 2>/dev/null || true
mv monitoring-system.mjs scripts/monitoring/ 2>/dev/null || true
mv performance-baseline-test.mjs scripts/performance/ 2>/dev/null || true
mv open-claude-code.sh scripts/utilities/ 2>/dev/null || true
find . -maxdepth 1 -name "test-*.mjs" -exec mv {} scripts/utilities/ \; 2>/dev/null || true

# Move old docs to archive
echo "📦 Archiving old docs..."
mv AGENTS.md docs/archive/ 2>/dev/null || true
mv GEMINI.md docs/archive/ 2>/dev/null || true
mv README_LOCAL_DEPLOYMENT.md docs/archive/ 2>/dev/null || true

echo "✅ Cleanup complete!"
echo ""
echo "📊 Summary:"
echo "   - Logs moved to: obs/logs/"
echo "   - Analysis docs in: docs/analysis/"
echo "   - Architecture docs in: docs/architecture/"
echo "   - Ad-hoc tests in: test/ad-hoc/"
echo "   - Scripts organized in: scripts/*/"
echo "   - Old docs archived in: docs/archive/"
echo ""
echo "Next steps:"
echo "1. Review moved files: ls -la docs/analysis/ docs/archive/ obs/logs/"
echo "2. Update .gitignore for *.log files"
echo "3. Commit changes: git add . && git commit -m 'chore: organize repository structure'"
