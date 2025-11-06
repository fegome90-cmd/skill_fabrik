#!/bin/bash
# Validation Helper Script for Prompt Builder v2 FASE 1
# Quick commands to validate optimizations

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Prompt Builder v2 - FASE 1 Validation Helper${NC}\n"

# Function to show menu
show_menu() {
    echo "Selecciona una opción:"
    echo ""
    echo "  1) Ejecutar Benchmark Completo (50 iteraciones)"
    echo "  2) Ejecutar Benchmark Rápido (10 iteraciones)"
    echo "  3) Validación Manual Interactiva (Node REPL)"
    echo "  4) Ver Cache Stats"
    echo "  5) Ver Últimos Resultados"
    echo "  6) Comparar con Baseline"
    echo "  7) Generar Reporte HTML"
    echo "  8) Ver Documentación"
    echo "  9) Limpiar Cache y Re-test"
    echo "  0) Salir"
    echo ""
}

# Function to run full benchmark
run_full_benchmark() {
    echo -e "${YELLOW}Ejecutando benchmark completo...${NC}"
    node test/prompt-builder-v2-phase1-benchmark.mjs
    echo -e "${GREEN}✅ Benchmark completado!${NC}"
    echo ""
    echo "Resultados guardados en: test/performance/prompt-builder-v2-phase1-results.json"
}

# Function to run quick benchmark
run_quick_benchmark() {
    echo -e "${YELLOW}Ejecutando benchmark rápido (10 iteraciones)...${NC}"
    QUICK_MODE=1 node test/prompt-builder-v2-phase1-benchmark.mjs
    echo -e "${GREEN}✅ Benchmark rápido completado!${NC}"
}

# Function to run interactive validation
run_interactive() {
    echo -e "${YELLOW}Iniciando validación interactiva...${NC}"
    echo ""
    echo "Ejecuta los siguientes comandos en el REPL:"
    echo ""
    echo "const { buildOptimizedPromptV2 } = await import('./packages/skills-cli/src/utils/prompt-builder-v2.ts');"
    echo ""
    echo "// Test 1: Primera invocación"
    echo "console.time('Primera'); const r1 = await buildOptimizedPromptV2({ skillId: 'backend-dev-guidelines', description: 'crear endpoint', includeFiles: true }); console.timeEnd('Primera');"
    echo ""
    echo "// Test 2: Cache hit"
    echo "console.time('Segunda (cache)'); const r2 = await buildOptimizedPromptV2({ skillId: 'backend-dev-guidelines', description: 'crear endpoint', includeFiles: true }); console.timeEnd('Segunda (cache)');"
    echo ""
    node --experimental-modules
}

# Function to show cache stats
show_cache_stats() {
    echo -e "${YELLOW}Mostrando estadísticas de cache...${NC}"
    node -e "
    import('./packages/skills-cli/src/utils/prompt-builder-v2.ts').then(module => {
        const cache = module.fileCache || new Map();
        console.log('📊 Cache Statistics:');
        console.log('  - Entries:', cache.size);
        console.log('  - Max Size: 50');
        console.log('  - Usage:', ((cache.size / 50) * 100).toFixed(1) + '%');
        
        if (cache.size > 0) {
            const entries = Array.from(cache.values());
            const avgSize = entries.reduce((sum, e) => sum + (e.size || 0), 0) / entries.length;
            const compressed = entries.filter(e => e.compressed).length;
            
            console.log('  - Avg Files per Entry:', avgSize.toFixed(1));
            console.log('  - Compressed Entries:', compressed);
            console.log('  - Compression Rate:', ((compressed / cache.size) * 100).toFixed(1) + '%');
        }
    });
    "
}

# Function to show last results
show_last_results() {
    echo -e "${YELLOW}Mostrando últimos resultados...${NC}"
    if [ -f "test/performance/prompt-builder-v2-phase1-results.json" ]; then
        echo ""
        node -e "
        const fs = require('fs');
        const results = JSON.parse(fs.readFileSync('test/performance/prompt-builder-v2-phase1-results.json', 'utf8'));
        
        console.log('📈 Últimos Resultados:');
        console.log('  Timestamp:', results.timestamp);
        console.log('  Iteraciones:', results.config.iterations);
        console.log('');
        console.log('Resumen por Escenario:');
        
        results.scenarios.forEach(s => {
            console.log('');
            console.log('  ' + s.name + ':');
            console.log('    - p50:', s.stats.p50.toFixed(2) + 'ms');
            console.log('    - p95:', s.stats.p95.toFixed(2) + 'ms');
            console.log('    - Cache Hit Rate:', (s.cache.hitRate * 100).toFixed(1) + '%');
            console.log('    - Memory Peak:', (s.memory.maxHeapDelta / 1024 / 1024).toFixed(2) + 'MB');
            
            const allMet = Object.values(s.targetsMet).every(v => v);
            console.log('    - Targets:', allMet ? '✅ Todos' : '⚠️  Algunos no');
        });
        "
    else
        echo -e "${RED}No se encontraron resultados previos.${NC}"
        echo "Ejecuta el benchmark primero (opción 1 o 2)."
    fi
}

# Function to compare with baseline
compare_baseline() {
    echo -e "${YELLOW}Comparando con baseline...${NC}"
    
    if [ ! -f "test/performance/prompt-builder-v2-phase1-results.json" ]; then
        echo -e "${RED}No se encontraron resultados de FASE 1.${NC}"
        echo "Ejecuta el benchmark primero (opción 1 o 2)."
        return
    fi
    
    if [ ! -f "test/performance/baseline-latest.json" ]; then
        echo -e "${YELLOW}No se encontró baseline, creando uno nuevo...${NC}"
        cp test/performance/prompt-builder-v2-phase1-results.json test/performance/baseline-latest.json
        echo "Baseline creado. Ejecuta de nuevo para comparar."
        return
    fi
    
    echo ""
    node -e "
    const fs = require('fs');
    const baseline = JSON.parse(fs.readFileSync('test/performance/baseline-latest.json', 'utf8'));
    const phase1 = JSON.parse(fs.readFileSync('test/performance/prompt-builder-v2-phase1-results.json', 'utf8'));
    
    console.log('📊 Comparación Baseline vs FASE 1:');
    console.log('');
    
    baseline.scenarios.forEach((bs, idx) => {
        const ps = phase1.scenarios[idx];
        if (!ps) return;
        
        console.log('  ' + bs.name + ':');
        
        const impP95 = ((bs.stats.p95 - ps.stats.p95) / bs.stats.p95 * 100);
        const impCache = ((ps.cache.hitRate - bs.cache.hitRate) / bs.cache.hitRate * 100);
        const impMem = ((bs.memory.maxHeapDelta - ps.memory.maxHeapDelta) / bs.memory.maxHeapDelta * 100);
        
        console.log('    - p95: ' + bs.stats.p95.toFixed(2) + 'ms → ' + ps.stats.p95.toFixed(2) + 'ms (' + (impP95 > 0 ? '✅' : '❌') + impP95.toFixed(1) + '%)');
        console.log('    - Cache: ' + (bs.cache.hitRate * 100).toFixed(1) + '% → ' + (ps.cache.hitRate * 100).toFixed(1) + '% (' + (impCache > 0 ? '✅' : '❌') + '+' + impCache.toFixed(1) + '%)');
        console.log('    - Memory: ' + (bs.memory.maxHeapDelta / 1024 / 1024).toFixed(2) + 'MB → ' + (ps.memory.maxHeapDelta / 1024 / 1024).toFixed(2) + 'MB (' + (impMem > 0 ? '✅' : '❌') + impMem.toFixed(1) + '%)');
        console.log('');
    });
    "
}

# Function to generate HTML report
generate_html_report() {
    echo -e "${YELLOW}Generando reporte HTML...${NC}"
    
    if [ ! -f "test/performance/prompt-builder-v2-phase1-results.json" ]; then
        echo -e "${RED}No se encontraron resultados.${NC}"
        echo "Ejecuta el benchmark primero (opción 1 o 2)."
        return
    fi
    
    # TODO: Implementar generación HTML
    echo -e "${YELLOW}⚠️  Generación HTML pendiente de implementación.${NC}"
    echo "Por ahora, revisa el JSON directamente o usa option 5."
}

# Function to show documentation
show_docs() {
    echo -e "${YELLOW}Documentación disponible:${NC}"
    echo ""
    echo "  📄 Resumen Ejecutivo:"
    echo "     docs/PROMPT-BUILDER-V2-PHASE1-EXECUTIVE-SUMMARY.md"
    echo ""
    echo "  📊 Reporte Completo:"
    echo "     docs/PROMPT-BUILDER-V2-OPTIMIZATION-PHASE1-REPORT.md"
    echo ""
    echo "  🧪 Guía de Validación:"
    echo "     docs/PROMPT-BUILDER-V2-PHASE1-VALIDATION-GUIDE.md"
    echo ""
    echo "  💻 Código Fuente:"
    echo "     packages/skills-cli/src/utils/prompt-builder-v2.ts"
    echo ""
    
    read -p "¿Abrir documentación en editor? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        code docs/PROMPT-BUILDER-V2-PHASE1-EXECUTIVE-SUMMARY.md
    fi
}

# Function to clean cache and retest
clean_and_retest() {
    echo -e "${YELLOW}Limpiando cache y ejecutando re-test...${NC}"
    echo ""
    
    # Clear Node.js require cache
    rm -rf node_modules/.cache 2>/dev/null || true
    
    echo "Cache limpiado. Ejecutando benchmark..."
    run_full_benchmark
}

# Main loop
while true; do
    show_menu
    read -p "Opción: " choice
    echo ""
    
    case $choice in
        1)
            run_full_benchmark
            ;;
        2)
            run_quick_benchmark
            ;;
        3)
            run_interactive
            ;;
        4)
            show_cache_stats
            ;;
        5)
            show_last_results
            ;;
        6)
            compare_baseline
            ;;
        7)
            generate_html_report
            ;;
        8)
            show_docs
            ;;
        9)
            clean_and_retest
            ;;
        0)
            echo -e "${GREEN}¡Hasta luego!${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Opción inválida.${NC}"
            ;;
    esac
    
    echo ""
    read -p "Presiona Enter para continuar..."
    clear
done
