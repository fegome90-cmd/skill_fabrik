#!/bin/bash
# Script para probar conexiones y funcionalidad del stack MCP

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Contadores de resultados
TESTS_PASSED=0
TESTS_FAILED=0

# Función para imprimir con color
print_color() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

print_header() {
    echo ""
    print_color $BLUE "════════════════════════════════════════════════════════"
    print_color $BLUE "  🧪 Skills Fabric MCP - Testing Suite"
    print_color $BLUE "════════════════════════════════════════════════════════"
    echo ""
}

# Función para registrar resultado de test
test_result() {
    local test_name="$1"
    local result="$2"
    local message="${3:-}"

    if [ "$result" = "PASS" ]; then
        print_color $GREEN "   ✅ PASS: $test_name"
        ((TESTS_PASSED++))
    else
        print_color $RED "   ❌ FAIL: $test_name"
        if [ -n "$message" ]; then
            print_color $YELLOW "      $message"
        fi
        ((TESTS_FAILED++))
    fi
}

# Test: Verificar dependencias
test_dependencies() {
    print_color $BLUE "📦 Verificando dependencias..."
    echo ""

    # Node.js
    if command -v node &> /dev/null; then
        test_result "Node.js instalado" "PASS" "$(node --version)"
    else
        test_result "Node.js instalado" "FAIL" "No encontrado"
    fi

    # npm/pnpm
    if command -v pnpm &> /dev/null; then
        test_result "pnpm instalado" "PASS" "$(pnpm --version)"
    elif command -v npm &> /dev/null; then
        test_result "npm instalado" "PASS" "$(npm --version)"
    else
        test_result "Gestor de paquetes (npm/pnpm)" "FAIL" "No encontrado"
    fi

    # Docker
    if command -v docker &> /dev/null; then
        test_result "Docker instalado" "PASS" "$(docker --version)"
    else
        test_result "Docker instalado" "FAIL" "No encontrado"
    fi

    # Docker Compose
    if command -v docker-compose &> /dev/null || docker compose version &> /dev/null; then
        test_result "Docker Compose instalado" "PASS"
    else
        test_result "Docker Compose instalado" "FAIL" "No encontrado"
    fi

    echo ""
}

# Test: Verificar archivos y configuración
test_files() {
    print_color $BLUE "📁 Verificando archivos y configuración..."
    echo ""

    # MCP Adapters
    if [ -d "${PROJECT_ROOT}/packages/mcp-adapters/dist" ]; then
        test_result "MCP Adapters compilados" "PASS"
    else
        test_result "MCP Adapters compilados" "FAIL" "Ejecuta: cd packages/mcp-adapters && npm run build"
    fi

    # Servidor MCP
    if [ -f "${PROJECT_ROOT}/mcp-server/index.mjs" ]; then
        test_result "Servidor MCP disponible" "PASS"
    else
        test_result "Servidor MCP disponible" "FAIL" "Archivo no encontrado"
    fi

    # Docker Compose
    if [ -f "${PROJECT_ROOT}/mcp-local/docker-compose.yml" ]; then
        test_result "docker-compose.yml" "PASS"
    else
        test_result "docker-compose.yml" "FAIL" "Archivo no encontrado"
    fi

    # Archivo .env
    if [ -f "${PROJECT_ROOT}/.env" ]; then
        test_result "Archivo .env" "PASS"
    else
        test_result "Archivo .env" "WARN" "Usando valores por defecto"
    fi

    echo ""
}

# Test: Conectividad de servicios
test_connectivity() {
    print_color $BLUE "🔌 Probando conectividad de servicios..."
    echo ""

    # Redis Cache (L0)
    if timeout 2 bash -c "</dev/tcp/localhost/6380" &>/dev/null; then
        test_result "Redis Cache (L0:6380)" "PASS" "Conectado"
    else
        test_result "Redis Cache (L0:6380)" "FAIL" "No accesible"
    fi

    # Redis Core (L1)
    if timeout 2 bash -c "</dev/tcp/localhost/6381" &>/dev/null; then
        test_result "Redis Core (L1:6381)" "PASS" "Conectado"
    else
        test_result "Redis Core (L1:6381)" "FAIL" "No accesible"
    fi

    # PostgreSQL (L2)
    if timeout 2 bash -c "</dev/tcp/localhost/5433" &>/dev/null; then
        test_result "PostgreSQL (L2:5433)" "PASS" "Conectado"
    else
        test_result "PostgreSQL (L2:5433)" "FAIL" "No accesible"
    fi

    # ChromaDB (L3)
    if timeout 2 bash -c "</dev/tcp/localhost/8000" &>/dev/null; then
        test_result "ChromaDB (L3:8000)" "PASS" "Conectado"
    else
        test_result "ChromaDB (L3:8000)" "WARN" "No accesible (opcional)"
    fi

    echo ""
}

# Test: Funcionalidad de adapters
test_adapters_functionality() {
    print_color $BLUE "🔧 Probando funcionalidad de adapters..."
    echo ""

    # Verificar que los adapters se pueden cargar
    if node -e "
        import('@skills-fabrik/mcp-adapters/dist/index.js').then(m => {
            console.log('MCP Adapters loaded successfully');
            process.exit(0);
        }).catch(e => {
            console.error('Error loading MCP Adapters:', e.message);
            process.exit(1);
        });
    " 2>/dev/null; then
        test_result "Carga de MCP Adapters" "PASS"
    else
        test_result "Carga de MCP Adapters" "FAIL" "Error al cargar módulos"
    fi

    # Test de conexión Redis
    if node -e "
        import('@skills-fabrik/mcp-adapters/dist/index.js').then(async (m) => {
            const health = await m.testConnection();
            if (health.connected) {
                console.log('Redis connected');
                process.exit(0);
            } else {
                console.error('Redis not connected:', health.error);
                process.exit(1);
            }
        }).catch(e => {
            console.error('Error:', e.message);
            process.exit(1);
        });
    " 2>/dev/null; then
        test_result "Conexión Redis" "PASS"
    else
        test_result "Conexión Redis" "FAIL" "Error de conexión"
    fi

    # Test de conexión PostgreSQL
    if node -e "
        import('@skills-fabrik/mcp-adapters/dist/index.js').then(async (m) => {
            const results = await m.testAllConnections();
            if (results.postgresql && results.postgresql.connected) {
                console.log('PostgreSQL connected');
                process.exit(0);
            } else {
                console.error('PostgreSQL not connected');
                process.exit(1);
            }
        }).catch(e => {
            console.error('Error:', e.message);
            process.exit(1);
        });
    " 2>/dev/null; then
        test_result "Conexión PostgreSQL" "PASS"
    else
        test_result "Conexión PostgreSQL" "FAIL" "Error de conexión"
    fi

    echo ""
}

# Test: Variables de entorno
test_environment() {
    print_color $BLUE "🌍 Verificando variables de entorno..."
    echo ""

    # Cargar .env si existe
    if [ -f "${PROJECT_ROOT}/.env" ]; then
        source "${PROJECT_ROOT}/.env"
    fi

    # Verificar variables críticas
    if [ -n "$PG_PASSWORD" ]; then
        test_result "PG_PASSWORD configurada" "PASS"
    else
        test_result "PG_PASSWORD configurada" "WARN" "Usando valor por defecto"
    fi

    if [ -n "$REDIS_CACHE_URL" ] || [ -n "$MEMTECH_REDIS_HOST" ]; then
        test_result "Configuración Redis" "PASS"
    else
        test_result "Configuración Redis" "WARN" "Usando valores por defecto"
    fi

    if [ -n "$PG_DATABASE" ]; then
        test_result "PG_DATABASE configurada" "PASS" "$PG_DATABASE"
    else
        test_result "PG_DATABASE configurada" "WARN" "Usando valor por defecto: surprise_metrics"
    fi

    echo ""
}

# Test: Operaciones básicas filesystem
test_filesystem_operations() {
    print_color $BLUE "📂 Probando operaciones de filesystem..."
    echo ""

    local test_file="/tmp/mcp-test-$(date +%s).txt"
    local test_dir="/tmp/mcp-test-dir-$(date +%s)"

    # Test escritura
    if node -e "
        import('@skills-fabrik/mcp-adapters/dist/index.js').then(async (m) => {
            await m.fsAdapter.writeFile('$test_file', 'test content');
            console.log('Write successful');
            process.exit(0);
        }).catch(e => {
            console.error('Error:', e.message);
            process.exit(1);
        });
    " 2>/dev/null; then
        test_result "Escritura de archivo" "PASS"
    else
        test_result "Escritura de archivo" "FAIL" "Error al escribir"
    fi

    # Test lectura
    if node -e "
        import('@skills-fabrik/mcp-adapters/dist/index.js').then(async (m) => {
            const content = await m.fsAdapter.readFile('$test_file');
            if (content === 'test content') {
                console.log('Read successful');
                process.exit(0);
            } else {
                console.error('Content mismatch');
                process.exit(1);
            }
        }).catch(e => {
            console.error('Error:', e.message);
            process.exit(1);
        });
    " 2>/dev/null; then
        test_result "Lectura de archivo" "PASS"
    else
        test_result "Lectura de archivo" "FAIL" "Error al leer"
    fi

    # Limpiar
    rm -f "$test_file"
    rm -rf "$test_dir"

    echo ""
}

# Mostrar resumen final
show_summary() {
    echo ""
    print_color $BLUE "════════════════════════════════════════════════════════"
    print_color $BLUE "  📊 Resumen de Tests"
    print_color $BLUE "════════════════════════════════════════════════════════"
    echo ""
    print_color $GREEN "   ✅ Tests pasados: $TESTS_PASSED"
    print_color $RED "   ❌ Tests fallidos: $TESTS_FAILED"

    local total_tests=$((TESTS_PASSED + TESTS_FAILED))
    if [ $total_tests -gt 0 ]; then
        local success_rate=$((TESTS_PASSED * 100 / total_tests))
        print_color $BLUE "   📈 Tasa de éxito: $success_rate%"
    fi

    echo ""

    if [ $TESTS_FAILED -eq 0 ]; then
        print_color $GREEN "🎉 ¡Todos los tests pasaron! El stack MCP está funcionando correctamente."
    elif [ $TESTS_FAILED -lt 3 ]; then
        print_color $YELLOW "⚠️  La mayoría de tests pasaron. Revisa los errores arriba."
    else
        print_color $RED "❌ Varios tests fallaron. Verifica la configuración y reinicia los servicios."
    fi

    echo ""
    print_color $BLUE "════════════════════════════════════════════════════════"
    echo ""
}

# Función principal
main() {
    print_header
    test_dependencies
    test_files
    test_connectivity
    test_adapters_functionality
    test_environment
    test_filesystem_operations
    show_summary
}

# Ejecutar si se llama directamente
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main "$@"
fi
