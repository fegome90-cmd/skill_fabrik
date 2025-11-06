#!/bin/bash
# Script de desarrollo rápido para MCP

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_color() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

show_menu() {
    echo ""
    print_color $BLUE "════════════════════════════════════════════════════════"
    print_color $BLUE "  🚀 Skills Fabric MCP - Desarrollo Rápido"
    print_color $BLUE "════════════════════════════════════════════════════════"
    echo ""
    echo "1)  📦 Build - Construir MCP Adapters"
    echo "2)  ▶️  Start - Iniciar stack completo"
    echo "3)  ⏹️  Stop - Detener stack"
    echo "4)  📊 Status - Ver estado"
    echo "5)  🧪 Test - Probar conexiones"
    echo "6)  🔌 Start MCP Server (STDIO)"
    echo "7)  🌐 Start MCP Server (WebSocket)"
    echo "8)  📝 Ver logs Docker"
    echo "9)  🔄 Restart servicios"
    echo "10) 🧹 Limpiar todo y reset"
    echo ""
    echo "q)  ❌ Salir"
    echo ""
}

build_adapters() {
    print_color $BLUE "📦 Construyendo MCP Adapters..."
    cd "${PROJECT_ROOT}/packages/mcp-adapters"
    pnpm build
    cd "${PROJECT_ROOT}"
    print_color $GREEN "✅ Build completado"
}

start_stack() {
    print_color $BLUE "🚀 Iniciando stack completo..."
    "${SCRIPT_DIR}/mcp-local-start.sh"
}

stop_stack() {
    print_color $BLUE "🛑 Deteniendo stack..."
    "${SCRIPT_DIR}/mcp-local-stop.sh"
}

show_status() {
    print_color $BLUE "📊 Verificando estado..."
    "${SCRIPT_DIR}/mcp-local-status.sh"
}

run_tests() {
    print_color $BLUE "🧪 Ejecutando tests..."
    "${SCRIPT_DIR}/mcp-local-test.sh"
}

start_mcp_stdio() {
    print_color $BLUE "🔌 Iniciando MCP Server (STDIO)..."
    print_color $YELLOW "   Para usar con Claude Code"
    print_color $YELLOW "   Presiona Ctrl+C para detener"
    echo ""
    cd "${PROJECT_ROOT}"
    export MCP_TRANSPORT=stdio
    node mcp-server/index.mjs
}

start_mcp_websocket() {
    print_color $BLUE "🌐 Iniciando MCP Server (WebSocket)..."
    print_color $YELLOW "   Puerto: 3001"
    print_color $YELLOW "   Para usar con Claude Desktop"
    print_color $YELLOW "   Presiona Ctrl+C para detener"
    echo ""
    cd "${PROJECT_ROOT}"
    export MCP_TRANSPORT=websocket
    export MCP_WEBSOCKET_PORT=3001
    node mcp-server/index.mjs
}

show_logs() {
    print_color $BLUE "📝 Mostrando logs Docker..."
    cd "${SCRIPT_DIR}"
    docker-compose logs -f
}

restart_services() {
    print_color $BLUE "🔄 Reiniciando servicios..."
    stop_stack
    sleep 2
    start_stack
}

cleanup_reset() {
    print_color $YELLOW "🧹 ¡ATENCIÓN! Esto eliminará todos los datos"
    read -p "¿Estás seguro? (y/N): " -n 1 -r
    echo ""

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_color $BLUE "🧹 Limpiando todo..."
        stop_stack
        sleep 2
        cd "${SCRIPT_DIR}"
        docker-compose down -v --remove-orphans
        docker system prune -f
        print_color $GREEN "✅ Limpieza completada"
        print_color $BLUE "Ejecuta './mcp-local-start.sh' para reiniciar"
    else
        print_color $YELLOW "Cancelado"
    fi
}

# Menú interactivo
while true; do
    show_menu
    read -p "Selecciona una opción: " choice

    case $choice in
        1)
            build_adapters
            ;;
        2)
            start_stack
            ;;
        3)
            stop_stack
            ;;
        4)
            show_status
            ;;
        5)
            run_tests
            ;;
        6)
            start_mcp_stdio
            ;;
        7)
            start_mcp_websocket
            ;;
        8)
            show_logs
            ;;
        9)
            restart_services
            ;;
        10)
            cleanup_reset
            ;;
        q|Q)
            print_color $GREEN "¡Hasta luego! 👋"
            exit 0
            ;;
        *)
            print_color $RED "❌ Opción inválida"
            ;;
    esac

    echo ""
    read -p "Presiona Enter para continuar..."
done
