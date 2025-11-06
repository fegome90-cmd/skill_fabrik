#!/bin/bash
# ⚡ Quick Docker Cleanup Script
# Limpieza rápida para liberar memoria de Docker

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_color() {
    echo -e "${1}${2}${NC}"
}

echo ""
print_color $BLUE "╔══════════════════════════════════════════════════════════╗"
print_color $BLUE "║         ⚡ QUICK DOCKER CLEANUP                            ║"
print_color $BLUE "║         Liberar memoria rápidamente                       ║"
print_color $BLUE "╚══════════════════════════════════════════════════════════╝"
echo ""

# Mostrar estado antes
print_color $BLUE "📊 Estado antes de limpieza:"
docker system df --format "
Total: {{.Size}}
Imágenes: {{.Size}}
Contenedores: {{.Size}}
Volúmenes: {{.Size}}
" 2>/dev/null || echo "   Error al obtener estadísticas"

echo ""

# Limpiar imágenes no usadas
print_color $YELLOW "🧹 Paso 1: Limpiando imágenes no utilizadas..."
docker image prune -af 2>&1 | grep -E "Total reclaimed|Deleted:" | head -5
sleep 1

# Limpiar contenedores detenidos
print_color $YELLOW "🧹 Paso 2: Limpiando contenedores detenidos..."
docker container prune -f 2>&1 | grep -E "Total reclaimed|Deleted:" | head -5
sleep 1

# Limpiar redes no utilizadas
print_color $YELLOW "🧹 Paso 3: Limpiando redes no utilizadas..."
docker network prune -f 2>&1 | grep -E "Total reclaimed|Deleted:" | head -5
sleep 1

# Mostrar estado después
echo ""
print_color $BLUE "📊 Estado después de limpieza:"
docker system df 2>/dev/null || echo "   Error al obtener estadísticas"

echo ""
print_color $GREEN "✅ Limpieza completada!"
echo ""
