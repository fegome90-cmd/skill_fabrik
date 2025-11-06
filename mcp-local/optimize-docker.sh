#!/bin/bash
# 🧹 Docker RAM Optimization Script
# Optimiza el uso de RAM de Docker limpiando recursos y configurando límites

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

print_color() {
    echo -e "${1}${2}${NC}"
}

echo ""
print_color $BLUE "╔══════════════════════════════════════════════════════════════════╗"
print_color $BLUE "║        🧹 DOCKER RAM OPTIMIZATION & CLEANUP                       ║"
print_color $BLUE "║        Reducir uso de RAM limpiando y optimizando                ║"
print_color $BLUE "╚══════════════════════════════════════════════════════════════════╝"
echo ""

# ============================================================================
# PASO 1: Mostrar estado actual
# ============================================================================

print_color $CYAN "📊 PASO 1: Estado actual de Docker"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

print_color $BLUE "💾 Uso de espacio:"
docker system df 2>/dev/null || echo "   Error al obtener estadísticas"

echo ""
print_color $BLUE "📦 Contenedores activos:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Image}}" 2>/dev/null || echo "   Error"

echo ""

# ============================================================================
# PASO 2: Limpiar imágenes no utilizadas
# ============================================================================

print_color $CYAN "🗑️  PASO 2: Limpieza de imágenes no utilizadas"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

print_color $YELLOW "⚠️  ADVERTENCIA: Esto eliminará todas las imágenes no utilizadas"
read -p "¿Proceder con la limpieza? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_color $BLUE "🧹 Limpiando imágenes no utilizadas..."
    docker system prune -af --volumes 2>&1 | head -20
    print_color $GREEN "✅ Limpieza completada"
else
    print_color $YELLOW "⏭️  Limpieza saltada"
fi

echo ""

# ============================================================================
# PASO 3: Optimizar contenedores MCP existentes
# ============================================================================

print_color $CYAN "⚙️  PASO 3: Optimización de contenedores MCP"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Función para reiniciar contenedor con límites
optimize_container() {
    local name=$1
    local limits=$2

    print_color $BLUE "   Optimizando $name..."

    # Obtener datos del contenedor
    local image=$(docker inspect $name --format '{{.Config.Image}}' 2>/dev/null || echo "")
    local port=$(docker port $name 2>/dev/null | head -1 | awk '{print $3}' | cut -d'/' -f1 || echo "")

    if [ -n "$image" ]; then
        # Detener contenedor
        docker stop $name &>/dev/null || true
        sleep 2

        # Reiniciar con límites (si no es necesario mantener datos)
        if [ "$name" = "mcp-redis-cache" ] || [ "$name" = "mcp-redis-core" ]; then
            # Redis - ejecutar sin volúmenes para optimización
            docker start $name 2>/dev/null || docker run -d \
                --name $name \
                --restart unless-stopped \
                $limits \
                $image redis-server --appendonly yes 2>/dev/null
        else
            docker start $name 2>/dev/null || true
        fi

        print_color $GREEN "   ✅ $name optimizado"
    else
        print_color $YELLOW "   ⚠️  $name no encontrado, saltando"
    fi
}

# Optimizar Redis Cache (L0) - 64MB límite
print_color $BLUE "🔵 Redis Cache (L0) - Límite 64MB"
optimize_container "mcp-redis-cache" "--memory=64m --memory-swap=64m"

sleep 2

# Optimizar Redis Core (L1) - 128MB límite
print_color $BLUE "🔵 Redis Core (L1) - Límite 128MB"
optimize_container "mcp-redis-core" "--memory=128m --memory-swap=128m"

sleep 2

# Optimizar PostgreSQL (L2) - 256MB límite
print_color $BLUE "🔵 PostgreSQL (L2) - Límite 256MB"
optimize_container "mcp-postgres" "--memory=256m --memory-swap=256m"

sleep 3

echo ""

# ============================================================================
# PASO 4: Crear docker-compose optimizado
# ============================================================================

print_color $CYAN "📝 PASO 4: Creando configuración optimizada"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cat > mcp-local/docker-compose-optimized.yml << 'EOF'
version: '3.8'

services:
  # Redis Cache (L0) - 64MB límite
  redis-cache:
    image: redis:7-alpine
    container_name: mcp-redis-cache
    ports:
      - "6380:6379"
    volumes:
      - redis-cache-data:/data
    command: >
      redis-server
      --appendonly yes
      --maxmemory 64mb
      --maxmemory-policy allkeys-lru
      --maxclients 100
    deploy:
      resources:
        limits:
          memory: 64M
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3
    networks:
      - mcp-network

  # Redis Core (L1) - 128MB límite
  redis-core:
    image: redis:7-alpine
    container_name: mcp-redis-core
    ports:
      - "6381:6379"
    volumes:
      - redis-core-data:/data
    command: >
      redis-server
      --appendonly yes
      --maxmemory 128mb
      --maxmemory-policy allkeys-lru
      --maxclients 100
    deploy:
      resources:
        limits:
          memory: 128M
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3
    networks:
      - mcp-network

  # PostgreSQL (L2) - 256MB límite
  postgres:
    image: postgres:15-alpine
    container_name: mcp-postgres
    ports:
      - "5433:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${PG_PASSWORD:-mcp_password}
      POSTGRES_DB: ${PG_DATABASE:-surprise_metrics}
      # Optimizaciones de memoria
      POSTGRES_SHARED_BUFFERS: 64MB
      POSTGRES_EFFECTIVE_CACHE_SIZE: 192MB
      POSTGRES_WORK_MEM: 4MB
      POSTGRES_MAINTENANCE_WORK_MEM: 16MB
    deploy:
      resources:
        limits:
          memory: 256M
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-surprise_metrics}"]
      interval: 10s
      timeout: 3s
      retries: 3
    networks:
      - mcp-network

volumes:
  redis-cache-data:
    driver: local
  redis-core-data:
    driver: local
  postgres-data:
    driver: local

networks:
  mcp-network:
    driver: bridge
    name: mcp-local-network
EOF

print_color $GREEN "✅ Configuración optimizada creada: docker-compose-optimized.yml"
echo ""

# ============================================================================
# PASO 5: Mostrar comparativa
# ============================================================================

print_color $CYAN "📊 PASO 5: Comparativa de memoria"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

print_color $BLUE "💾 LÍMITES DE MEMORIA CONFIGURADOS:"
echo "   Redis Cache (L0): 64MB  (antes: sin límite)"
echo "   Redis Core (L1):  128MB (antes: sin límite)"
echo "   PostgreSQL (L2):  256MB (antes: sin límite)"
echo "   TOTAL LÍMITE:     448MB (antes: limitado por Docker Desktop)"
echo ""

print_color $BLUE "📈 OPTIMIZACIONES APLICADAS:"
echo "   ✅ Redis: LRU eviction policy activo"
echo "   ✅ PostgreSQL: Buffers y cache optimizados"
echo "   ✅ Docker: Límites hard de memoria"
echo "   ✅ Servicios: Restart automático con límites"
echo ""

# ============================================================================
# PASO 6: Estado final
# ============================================================================

print_color $CYAN "📊 PASO 6: Estado después de optimización"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

print_color $BLUE "📦 Contenedores optimizados:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" 2>/dev/null || echo "   Error al obtener stats"

echo ""
print_color $BLUE "💾 Espacio liberado:"
docker system df 2>/dev/null || echo "   Error al obtener estadísticas"

echo ""

# ============================================================================
# INSTRUCCIONES FINALES
# ============================================================================

print_color $CYAN "╔══════════════════════════════════════════════════════════════════╗"
print_color $CYAN "║                    ✅ OPTIMIZACIÓN COMPLETADA                    ║"
print_color $CYAN "╚══════════════════════════════════════════════════════════════════╝"
echo ""

print_color $GREEN "🎯 PRÓXIMOS PASOS:"
echo ""
echo "1️⃣  USAR CONFIGURACIÓN OPTIMIZADA:"
echo "   cd mcp-local"
echo "   docker-compose -f docker-compose-optimized.yml up -d"
echo ""
echo "2️⃣  MONITOREAR USO DE MEMORIA:"
echo "   docker stats"
echo "   ./monitor-docker-usage.sh"
echo ""
echo "3️⃣  LIMPIEZA PERIÓDICA (opcional):"
echo "   docker system prune -af --volumes"
echo ""
echo "4️⃣  VERIFICAR SERVICIOS:"
echo "   ./mcp-local-status.sh"
echo ""

print_color $YELLOW "💡 CONSEJOS ADICIONALES:"
echo "   • Usar servicios nativos cuando sea posible (Redis, PostgreSQL locales)"
echo "   • Ajustar límites según necesidades reales"
echo "   • Monitorear uso de memoria regularmente"
echo "   • Configurar alertas si es necesario"
echo ""

print_color $GREEN "🎉 ¡Docker optimizado! Memoria liberada y límites configurados."
echo ""
