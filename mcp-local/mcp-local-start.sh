#!/bin/bash
# Script para iniciar el stack MCP local completo

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
MCP_DIR="${PROJECT_ROOT}/mcp-local"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir con color
print_color() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

print_header() {
    echo ""
    print_color $BLUE "════════════════════════════════════════════════════════"
    print_color $BLUE "  🚀 Skills Fabric MCP - Stack Local"
    print_color $BLUE "════════════════════════════════════════════════════════"
    echo ""
}

# Verificar Docker
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_color $RED "❌ Docker no está instalado"
        print_color $YELLOW "   Instala Docker desde: https://docs.docker.com/get-docker/"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_color $RED "❌ Docker Compose no está instalado"
        print_color $YELLOW "   Instala Docker Compose desde: https://docs.docker.com/compose/install/"
        exit 1
    fi

    print_color $GREEN "✅ Docker y Docker Compose están disponibles"
}

# Verificar Node.js
check_node() {
    if ! command -v node &> /dev/null; then
        print_color $RED "❌ Node.js no está instalado"
        exit 1
    fi

    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_color $RED "❌ Node.js versión >= 18 requerida (versión actual: $(node --version))"
        exit 1
    fi

    print_color $GREEN "✅ Node.js $(node --version) está disponible"
}

# Cargar variables de entorno
load_env() {
    local env_file="${PROJECT_ROOT}/.env"

    if [ -f "$env_file" ]; then
        print_color $GREEN "✅ Cargando configuración desde .env"
        source "$env_file"
    else
        print_color $YELLOW "⚠️  Archivo .env no encontrado, usando valores por defecto"
        # Configuración por defecto
        export PG_PASSWORD=${PG_PASSWORD:-mcp_password}
        export PG_DATABASE=${PG_DATABASE:-surprise_metrics}
        export REDIS_CACHE_URL=${REDIS_CACHE_URL:-redis://localhost:6380}
        export REDIS_CORE_URL=${REDIS_CORE_URL:-redis://localhost:6381}
    fi

    # Exportar variables necesarias para docker-compose
    export PG_PASSWORD
    export PG_DATABASE
}

# Construir adapters
build_adapters() {
    print_color $BLUE "📦 Construyendo MCP Adapters..."

    cd "${PROJECT_ROOT}/packages/mcp-adapters"

    if [ ! -d "dist" ]; then
        print_color $YELLOW "   Ejecutando build..."
        npm run build
    else
        print_color $GREEN "   ✅ Build ya existe"
    fi

    cd "$PROJECT_ROOT"
}

# Construir servidor MCP
build_mcp_server() {
    print_color $BLUE "🔧 Preparando servidor MCP..."

    cd "${PROJECT_ROOT}"

    if [ -d "mcp-server" ]; then
        print_color $GREEN "   ✅ Servidor MCP disponible"
    else
        print_color $YELLOW "   ⚠️  Servidor MCP no encontrado en mcp-server/"
    fi
}

# Iniciar servicios Docker
start_services() {
    print_color $BLUE "🐳 Iniciando servicios Docker..."

    cd "$MCP_DIR"

    # Detener contenedores existentes
    docker-compose down --remove-orphans 2>/dev/null || true

    # Iniciar servicios básicos
    print_color $YELLOW "   → Iniciando Redis Cache (L0) en puerto 6380..."
    docker-compose up -d redis-cache

    sleep 2

    print_color $YELLOW "   → Iniciando Redis Core (L1) en puerto 6381..."
    docker-compose up -d redis-core

    sleep 2

    print_color $YELLOW "   → Iniciando PostgreSQL (L2) en puerto 5433..."
    docker-compose up -d postgres

    sleep 3

    # Verificar que los servicios estén funcionando
    print_color $BLUE "   Verificando servicios..."

    if docker-compose ps | grep -q "Up"; then
        print_color $GREEN "   ✅ Servicios básicos iniciados"
    else
        print_color $RED "   ❌ Error al iniciar servicios"
        docker-compose logs
        exit 1
    fi
}

# Iniciar servicios Skills Fabric (si están configurados)
start_skills_fabric() {
    if command -v pm2 &> /dev/null; then
        print_color $BLUE "⚙️  Verificando servicios Skills Fabric..."

        # Verificar si hay ecosystem.config.cjs
        if [ -f "${PROJECT_ROOT}/scripts/pm2/ecosystem.config.cjs" ]; then
            print_color $YELLOW "   → Iniciando servicios Skills Fabric..."
            cd "$PROJECT_ROOT"
            pm2 start scripts/pm2/ecosystem.config.cjs --env development

            print_color $GREEN "   ✅ Servicios Skills Fabric iniciados"
        fi
    fi
}

# Función para imprimir resumen final
print_summary() {
    echo ""
    print_color $GREEN "════════════════════════════════════════════════════════"
    print_color $GREEN "  ✅ Stack MCP Local iniciado exitosamente"
    print_color $GREEN "════════════════════════════════════════════════════════"
    echo ""
    print_color $BLUE "Servicios disponibles:"
    echo "  • Redis Cache (L0):    localhost:6380"
    echo "  • Redis Core (L1):     localhost:6381"
    echo "  • PostgreSQL (L2):     localhost:5433"
    echo "  • MCP Server:          stdio / ws://localhost:3001"
    echo ""
    print_color $BLUE "Comandos útiles:"
    echo "  ./mcp-local-status.sh    - Ver estado de servicios"
    echo "  ./mcp-local-test.sh      - Probar conexiones"
    echo "  ./mcp-local-stop.sh      - Detener todos los servicios"
    echo ""
    print_color $YELLOW "Para usar con Claude Code:"
    echo "  export MCP_TRANSPORT=stdio"
    echo "  node mcp-server/index.mjs"
    echo ""
}

# Función principal
main() {
    print_header

    check_docker
    check_node
    load_env
    build_adapters
    build_mcp_server
    start_services
    start_skills_fabric

    print_summary
}

# Ejecutar si se llama directamente
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main "$@"
fi
