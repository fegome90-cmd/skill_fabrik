#!/bin/bash
# 📊 Docker Memory Usage Monitor
# Monitorea el uso de memoria de Docker en tiempo real

set -e

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_color() {
    echo -e "${1}${2}${NC}"
}

# Función para mostrar uso de memoria
show_memory_usage() {
    clear
    echo ""
    print_color $BLUE "╔══════════════════════════════════════════════════════════════════╗"
    print_color $BLUE "║              📊 DOCKER MEMORY MONITOR                              ║"
    print_color $BLUE "║              Monitoreo en tiempo real                              ║"
    print_color $BLUE "╚══════════════════════════════════════════════════════════════════╝"
    echo ""

    # Fecha y hora
    print_color $CYAN "🕐 $(date)"
    echo ""

    # Estadísticas de Docker
    print_color $BLUE "💾 Espacio de Docker:"
    docker system df 2>/dev/null | grep -E "TYPE|Images|Containers|Local|Build" || echo "   Error al obtener estadísticas"
    echo ""

    # Estadísticas de contenedores
    print_color $BLUE "📦 Uso por contenedor:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}" 2>/dev/null || echo "   Error al obtener stats"
    echo ""

    # Resumen
    print_color $BLUE "📊 Resumen:"

    # Contar contenedores activos
    ACTIVE_CONTAINERS=$(docker ps -q 2>/dev/null | wc -l | xargs)
    print_color $CYAN "   Contenedores activos: $ACTIVE_CONTAINERS"

    # Espacio total usado
    TOTAL_SIZE=$(docker system df --format "{{.Size}}" 2>/dev/null | head -1 || echo "N/A")
    print_color $CYAN "   Espacio total: $TOTAL_SIZE"

    # Espacio reclaimable
    RECLAIMABLE=$(docker system df --format "{{.Size}}" 2>/dev/null | tail -1 || echo "N/A")
    print_color $YELLOW "   Espacio reclamable: $RECLAIMABLE"

    echo ""
    print_color $GREEN "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
}

# Función para monitoreo continuo
monitor_continuous() {
    local interval=${1:-5}

    print_color $YELLOW "🔄 Monitoreo continuo (cada ${interval}s)..."
    print_color $YELLOW "   Presiona Ctrl+C para salir"
    echo ""

    while true; do
        show_memory_usage
        sleep $interval
    done
}

# Función para generar reporte
generate_report() {
    local report_file="docker-memory-report-$(date +%Y%m%d-%H%M%S).txt"

    print_color $BLUE "📄 Generando reporte: $report_file"
    echo ""

    {
        echo "DOCKER MEMORY USAGE REPORT"
        echo "Generated: $(date)"
        echo "================================"
        echo ""

        echo "SYSTEM OVERVIEW:"
        docker system df
        echo ""

        echo "CONTAINER STATS:"
        docker stats --no-stream
        echo ""

        echo "VOLUME USAGE:"
        docker system df -v | grep -A 50 "Local Volumes"
        echo ""

        echo "DOCKER INFO:"
        docker info 2>/dev/null | grep -E "Total Memory|Containers|Images" || echo "Docker info not available"

    } > "$report_file"

    print_color $GREEN "✅ Reporte guardado: $report_file"
    echo ""
}

# Función principal
main() {
    case "${1:-monitor}" in
        "once"|"")
            show_memory_usage
            ;;
        "continuous"|"monitor")
            monitor_continuous ${2:-5}
            ;;
        "report")
            generate_report
            ;;
        "help"|"-h"|"--help")
            echo "Docker Memory Usage Monitor"
            echo ""
            echo "Usage:"
            echo "  $0                    - Show memory usage once"
            echo "  $0 continuous [sec]   - Monitor continuously (default 5s)"
            echo "  $0 monitor [sec]      - Alias for continuous"
            echo "  $0 report             - Generate report file"
            echo "  $0 help               - Show this help"
            echo ""
            ;;
        *)
            print_color $RED "❌ Opción desconocida: $1"
            echo ""
            echo "Usa '$0 help' para ver opciones disponibles"
            exit 1
            ;;
    esac
}

# Ejecutar función principal
main "$@"
