#!/bin/bash
# Script para detener el stack MCP local completo

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
    print_color $BLUE "  🛑 Skills Fabric MCP - Detener Stack"
    print_color $BLUE "════════════════════════════════════════════════════════"
    echo ""
}

# Detener servicios Docker
stop_docker_services() {
    print_color $BLUE "🐳 Deteniendo servicios Docker..."

    cd "$MCP_DIR"

    print_color $YELLOW "   → Detenendo contenedores MCP..."
    docker-compose down

    if [ $? -eq 0 ]; then
        print_color $GREEN "   ✅ Contenedores Docker detenidos"
    else
        print_color $RED "   ❌ Error al detener contenedores"
    fi
}

# Detener servicios Skills Fabric
stop_skills_fabric() {
    if command -v pm2 &> /dev/null; then
        print_color $BLUE "⚙️  Deteniendo servicios Skills Fabric..."

        # Listar procesos PM2 relacionados con skills fabric
        local pm2_list=$(pm2 list 2>/dev/null | grep -E "(router|daemon|discovery)" || true)

        if [ -n "$pm2_list" ]; then
            print_color $YELLOW "   → Deteniendo procesos PM2..."
            pm2 delete all 2>/dev/null || true
            print_color $GREEN "   ✅ Servicios Skills Fabric detenidos"
        else
            print_color $GREEN "   ✅ No hay servicios Skills Fabric ejecutándose"
        fi
    fi
}

# Limpiar recursos no utilizados
cleanup_resources() {
    print_color $BLUE "🧹 Limpiando recursos..."

    # Limpiar imágenes no utilizadas (opcional)
    if [ "$1" = "--cleanup" ] || [ "$1" = "-c" ]; then
        print_color $YELLOW "   → Limpiando imágenes Docker no utilizadas..."
        docker system prune -f 2>/dev/null || true
        print_color $GREEN "   ✅ Imágenes limpiadas"
    fi
}

# Mostrar estado final
show_final_status() {
    echo ""
    print_color $GREEN "════════════════════════════════════════════════════════"
    print_color $GREEN "  ✅ Stack MCP Local detenido exitosamente"
    print_color $GREEN "════════════════════════════════════════════════════════"
    echo ""
    print_color $BLUE "Servicios detenidos:"
    echo "  • Redis Cache (L0)"
    echo "  • Redis Core (L1)"
    echo "  • PostgreSQL (L2)"
    echo "  • Servicios Skills Fabric (si estaban ejecutándose)"
    echo ""
    print_color $YELLOW "Para reiniciar:"
    echo "  ./mcp-local-start.sh"
    echo ""
}

# Función principal
main() {
    print_header

    stop_docker_services
    stop_skills_fabric
    cleanup_resources "$1"
    show_final_status
}

# Ejecutar si se llama directamente
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main "$@"
fi
