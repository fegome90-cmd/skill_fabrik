#!/bin/bash
# Script para verificar el estado del stack MCP local

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
    print_color $BLUE "  📊 Skills Fabric MCP - Estado de Servicios"
    print_color $BLUE "════════════════════════════════════════════════════════"
    echo ""
}

# Verificar estado de contenedores Docker
check_docker_services() {
    print_color $BLUE "🐳 Estado de servicios Docker:"
    echo ""

    cd "$MCP_DIR"

    # Verificar contenedores
    local containers=$(docker-compose ps --services 2>/dev/null || true)

    if [ -z "$containers" ]; then
        print_color $YELLOW "   ⚠️  No hay servicios Docker ejecutándose"
        return
    fi

    for container in $containers; do
        local status=$(docker-compose ps --filter "name=$container" --format "{{.State}}" 2>/dev/null || echo "unknown")

        case $status in
            "running")
                print_color $GREEN "   ✅ $container: Ejecutándose"
                ;;
            "exited")
                print_color $RED "   ❌ $container: Detenido"
                ;;
            *)
                print_color $YELLOW "   ⚠️  $container: Desconocido"
                ;;
        esac
    done

    echo ""
}

# Verificar conectividad de servicios
check_service_connectivity() {
    print_color $BLUE "🔌 Verificando conectividad de servicios:"
    echo ""

    # Verificar Redis Cache (L0)
    if command -v nc &> /dev/null; then
        if timeout 2 nc -z localhost 6380 2>/dev/null; then
            print_color $GREEN "   ✅ Redis Cache (L0:6380): Conectado"
        else
            print_color $RED "   ❌ Redis Cache (L0:6380): No accesible"
        fi

        # Verificar Redis Core (L1)
        if timeout 2 nc -z localhost 6381 2>/dev/null; then
            print_color $GREEN "   ✅ Redis Core (L1:6381): Conectado"
        else
            print_color $RED "   ❌ Redis Core (L1:6381): No accesible"
        fi

        # Verificar PostgreSQL (L2)
        if timeout 2 nc -z localhost 5433 2>/dev/null; then
            print_color $GREEN "   ✅ PostgreSQL (L2:5433): Conectado"
        else
            print_color $RED "   ❌ PostgreSQL (L2:5433): No accesible"
        fi

        # Verificar ChromaDB (L3)
        if timeout 2 nc -z localhost 8000 2>/dev/null; then
            print_color $GREEN "   ✅ ChromaDB (L3:8000): Conectado"
        else
            print_color $YELLOW "   ⚠️  ChromaDB (L3:8000): No accesible (opcional)"
        fi
    else
        print_color $YELLOW "   ⚠️  netcat (nc) no disponible, usando verificación básica"

        # Verificar puertos básicos
        if lsof -Pi :6380 -sTCP:LISTEN -t >/dev/null 2>&1; then
            print_color $GREEN "   ✅ Redis Cache (L0:6380): Puerto abierto"
        else
            print_color $RED "   ❌ Redis Cache (L0:6380): Puerto cerrado"
        fi
    fi

    echo ""
}

# Verificar servicios Skills Fabric
check_skills_fabric() {
    print_color $BLUE "⚙️  Estado de servicios Skills Fabric:"
    echo ""

    if command -v pm2 &> /dev/null; then
        local pm2_list=$(pm2 list 2>/dev/null || echo "")

        if [ -z "$pm2_list" ]; then
            print_color $YELLOW "   ⚠️  PM2 no tiene procesos en ejecución"
        else
            echo "$pm2_list" | while read line; do
                if echo "$line" | grep -q "online"; then
                    local name=$(echo "$line" | awk '{print $2}')
                    print_color $GREEN "   ✅ $name: En línea"
                elif echo "$line" | grep -q "stopped\|errored"; then
                    local name=$(echo "$line" | awk '{print $2}')
                    print_color $RED "   ❌ $name: Detenido/Error"
                fi
            done
        fi
    else
        print_color $YELLOW "   ⚠️  PM2 no está instalado"
    fi

    echo ""
}

# Verificar archivos de configuración
check_configuration() {
    print_color $BLUE "📁 Verificación de configuración:"
    echo ""

    # Verificar archivo .env
    if [ -f "${PROJECT_ROOT}/.env" ]; then
        print_color $GREEN "   ✅ Archivo .env encontrado"
    else
        print_color $YELLOW "   ⚠️  Archivo .env no encontrado (usando valores por defecto)"
    fi

    # Verificar MCP Adapters
    if [ -d "${PROJECT_ROOT}/packages/mcp-adapters/dist" ]; then
        print_color $GREEN "   ✅ MCP Adapters compilados"
    else
        print_color $YELLOW "   ⚠️  MCP Adapters no compilados (ejecuta build primero)"
    fi

    # Verificar servidor MCP
    if [ -f "${PROJECT_ROOT}/mcp-server/index.mjs" ]; then
        print_color $GREEN "   ✅ Servidor MCP disponible"
    else
        print_color $YELLOW "   ⚠️  Servidor MCP no encontrado"
    fi

    # Verificar docker-compose
    if [ -f "${MCP_DIR}/docker-compose.yml" ]; then
        print_color $GREEN "   ✅ docker-compose.yml encontrado"
    else
        print_color $RED "   ❌ docker-compose.yml no encontrado"
    fi

    echo ""
}

# Mostrar puertos en uso
show_listening_ports() {
    print_color $BLUE "🔌 Puertos en uso:"
    echo ""

    if command -v lsof &> /dev/null; then
        local ports=(6380 6381 5433 8000 3000 7727 8877)

        for port in "${ports[@]}"; do
            if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
                local proc=$(lsof -Pi :$port -sTCP:LISTEN | tail -n1 | awk '{print $1}')
                print_color $GREEN "   ✅ Puerto $port: En uso por $proc"
            else
                print_color $YELLOW "   ⚠️  Puerto $port: Disponible"
            fi
        done
    else
        print_color $YELLOW "   ⚠️  lsof no disponible para verificar puertos"
    fi

    echo ""
}

# Función para mostrar resumen de salud
show_health_summary() {
    print_color $BLUE "📋 Resumen de salud del stack:"
    echo ""

    local health_score=0
    local max_score=6

    # Verificar servicios críticos
    if lsof -Pi :6380 -sTCP:LISTEN -t >/dev/null 2>&1; then
        ((health_score++))
    fi

    if lsof -Pi :6381 -sTCP:LISTEN -t >/dev/null 2>&1; then
        ((health_score++))
    fi

    if lsof -Pi :5433 -sTCP:LISTEN -t >/dev/null 2>&1; then
        ((health_score++))
    fi

    # Verificar archivos
    if [ -f "${PROJECT_ROOT}/mcp-server/index.mjs" ]; then
        ((health_score++))
    fi

    if [ -d "${PROJECT_ROOT}/packages/mcp-adapters/dist" ]; then
        ((health_score++))
    fi

    if [ -f "${MCP_DIR}/docker-compose.yml" ]; then
        ((health_score++))
    fi

    local health_percentage=$((health_score * 100 / max_score))

    if [ $health_percentage -ge 90 ]; then
        print_color $GREEN "   ✅ Salud del stack: $health_percentage% (Excelente)"
    elif [ $health_percentage -ge 70 ]; then
        print_color $YELLOW "   ⚠️  Salud del stack: $health_percentage% (Bueno)"
    elif [ $health_percentage -ge 50 ]; then
        print_color $YELLOW "   ⚠️  Salud del stack: $health_percentage% (Regular)"
    else
        print_color $RED "   ❌ Salud del stack: $health_percentage% (Crítico)"
    fi

    echo ""
}

# Función principal
main() {
    print_header
    check_docker_services
    check_service_connectivity
    check_skills_fabric
    check_configuration
    show_listening_ports
    show_health_summary

    print_color $GREEN "════════════════════════════════════════════════════════"
    echo ""
}

# Ejecutar si se llama directamente
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main "$@"
fi
