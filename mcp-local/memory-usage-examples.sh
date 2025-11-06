#!/bin/bash
# 💡 MemTech Memory Usage Examples
# Ejemplos prácticos de uso de cada capa de memoria

set -e

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

print_color() {
    echo -e "${1}${2}${NC}"
}

echo ""
print_color $BLUE "═══════════════════════════════════════════════════════════════════"
print_color $BLUE "  💡 MEMTECH MEMORY USAGE EXAMPLES"
print_color $BLUE "  Cómo usar cada capa en la práctica"
print_color $BLUE "═══════════════════════════════════════════════════════════════════"
echo ""

# ============================================================================
# EJEMPLO 1: L0 - Cache de sesión de usuario
# ============================================================================

print_color $CYAN "╔═══════════════════════════════════════════════════════════════════╗"
print_color $CYAN "║  EJEMPLO 1: L0 - Cache de sesión de usuario (Hot Cache)          ║"
print_color $CYAN "╚═══════════════════════════════════════════════════════════════════╝"
echo ""

print_color $BLUE "📝 Caso de uso: Almacenar sesión activa de usuario"
echo "  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

USER_ID="user_12345"
SESSION_KEY="session:$USER_ID"
SESSION_DATA='{"user_id":"'$USER_ID'","login_time":'$(date +%s000)',"permissions":["read","write"],"last_activity":'$(date +%s000)'}'

print_color $GREEN "   💾 Almacenando en L0 (Redis Cache):"
echo "      redis-cli SET $SESSION_KEY '$SESSION_DATA'"
docker exec mcp-redis-cache redis-cli SET "$SESSION_KEY" "$SESSION_DATA" &>/dev/null
echo "      ✅ Sesión almacenada"
echo ""

print_color $GREEN "   📥 Recuperando de L0:"
echo "      redis-cli GET $SESSION_KEY"
RESULT=$(docker exec mcp-redis-cache redis-cli GET "$SESSION_KEY")
echo "      $RESULT"
echo ""

print_color $GREEN "   ⏱️  Actualizando actividad (cada request):"
echo "      redis-cli EXPIRE $SESSION_KEY 3600  # 1 hora TTL"
docker exec mcp-redis-cache redis-cli EXPIRE "$SESSION_KEY" 3600 &>/dev/null
echo "      ✅ TTL actualizado a 1 hora"
echo ""

# ============================================================================
# EJEMPLO 2: L1 - Plan snapshot en desarrollo
# ============================================================================

print_color $CYAN "╔═══════════════════════════════════════════════════════════════════╗"
print_color $CYAN "║  EJEMPLO 2: L1 - Plan snapshot en desarrollo (Working Memory)    ║"
print_color $CYAN "╚═══════════════════════════════════════════════════════════════════╝"
echo ""

print_color $BLUE "📝 Caso de uso: Snapshot de plan en desarrollo activo"
echo "   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

PLAN_ID="plan_feature_xyz"
PLAN_KEY="plan:$PLAN_ID"
PLAN_DATA='{
  "id":"'$PLAN_ID'",
  "task":"Implement feature XYZ",
  "status":"IN_PROGRESS",
  "phases":[
    {"name":"Design","status":"DONE","order":1},
    {"name":"Development","status":"ACTIVE","order":2},
    {"name":"Testing","status":"PENDING","order":3}
  ],
  "approved_at":"'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'",
  "progress":66,
  "metrics":{"completed_phases":1,"total_phases":3}
}'

print_color $GREEN "   💾 Almacenando en L1 (Redis Core):"
echo "      redis-cli SET $PLAN_KEY '<plan_data>'"
docker exec mcp-redis-core redis-cli SET "$PLAN_KEY" "$PLAN_DATA" &>/dev/null
echo "      ✅ Plan snapshot almacenado"
echo ""

print_color $GREEN "   📥 Recuperando y mostrando progreso:"
echo "      redis-cli GET $PLAN_KEY | jq '.progress'"
PROGRESS=$(docker exec mcp-redis-core redis-cli GET "$PLAN_KEY" | jq -r '.progress' 2>/dev/null || echo "N/A")
echo "      Progreso: $PROGRESS%"
echo ""

print_color $GREEN "   🔄 Actualizando estado del plan:"
echo "      redis-cli SET $PLAN_KEY '<updated_data>'"
UPDATED_PROGRESS=100
UPDATED_DATA=$(echo "$PLAN_DATA" | sed "s/\"progress\":66/\"progress\":$UPDATED_PROGRESS/" | sed 's/"status":"IN_PROGRESS"/"status":"COMPLETED"/')
docker exec mcp-redis-core redis-cli SET "$PLAN_KEY" "$UPDATED_DATA" &>/dev/null
echo "      ✅ Plan marcado como COMPLETED (100%)"
echo ""

# ============================================================================
# EJEMPLO 3: L2 - Contexto de conversación persistente
# ============================================================================

print_color $CYAN "╔═══════════════════════════════════════════════════════════════════╗"
print_color $CYAN "║  EJEMPLO 3: L2 - Contexto de conversación (Context Memory)       ║"
print_color $CYAN "╚═══════════════════════════════════════════════════════════════════╝"
echo ""

print_color $BLUE "📝 Caso de uso: Contexto de chat persistente entre sesiones"
echo "   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

CONVERSATION_ID=$(uuidgen)
CONTEXT_KEY="conversation:user_12345:session_abc"
CONTENT='{"conversation_id":"'$CONVERSATION_ID'","messages":[{"role":"user","content":"Hello"},{"role":"assistant","content":"Hi there!"},{"role":"user","content":"How are you?"}],"metadata":{"topic":"greeting","sentiment":"positive"}}'

print_color $GREEN "   💾 Almacenando en L2 (PostgreSQL):"
echo "      INSERT INTO memory_context ..."
docker exec -e PGPASSWORD=postgres mcp-postgres psql -U postgres -d surprise_metrics <<EOF
INSERT INTO memory_context (id, key, content, metadata, storage_layer)
VALUES (
  '$CONVERSATION_ID',
  '$CONTEXT_KEY',
  '$CONTENT',
  '{"layer": "L2", "type": "conversation", "persistent": true}',
  'L2'
);
EOF
echo "      ✅ Contexto de conversación persistido"
echo ""

print_color $GREEN "   📥 Recuperando contexto completo:"
echo "      SELECT content FROM memory_context WHERE key = '$CONTEXT_KEY'"
docker exec -e PGPASSWORD=postgres mcp-postgres psql -U postgres -d surprise_keywords -t -c "
SELECT content FROM memory_context WHERE key = '$CONTEXT_KEY';
" 2>/dev/null || docker exec -e PGPASSWORD=postgres mcp-postgres psql -U postgres -d surprise_metrics -c "
SELECT left(content, 100) FROM memory_context WHERE key = '$CONTEXT_KEY';
" | head -1
echo "      ✅ Contexto recuperado (persistente entre sesiones)"
echo ""

# ============================================================================
# RESUMEN DE CASOS DE USO
# ============================================================================

echo ""
print_color $BLUE "═══════════════════════════════════════════════════════════════════"
print_color $BLUE "  📚 GUÍA DE USO POR CAPA"
print_color $BLUE "═══════════════════════════════════════════════════════════════════"
echo ""

print_color $GREEN "🔵 L0 (Redis Cache) - Hot Cache:"
echo "   💡 Uso: Sesiones, datos de alta frecuencia, cache temporal"
echo "   ⚡ Performance: < 1ms"
echo "   📊 Tamaño: Pequeño (< 1KB por item)"
echo "   ⏱️  TTL: Minutos a horas"
echo "   🔄 Estrategia: LRU eviction"
echo ""

print_color $GREEN "🔵 L1 (Redis Core) - Working Memory:"
echo "   💡 Uso: Plan snapshots, estados de trabajo, datos en proceso"
echo "   ⚡ Performance: < 5ms"
echo "   📊 Tamaño: Mediano (1-50KB por item)"
echo "   ⏱️  Persistencia: AOF/RDB"
echo "   🔄 Estrategia: Working set management"
echo ""

print_color $GREEN "🔵 L2 (PostgreSQL) - Context Memory:"
echo "   💡 Uso: Contexto persistente, historial, datos estructurados"
echo "   ⚡ Performance: 5-50ms"
echo "   📊 Tamaño: Grande (1MB+ por item)"
echo "   ⏱️  Persistencia: ACID transactions"
echo "   🔄 Estrategia: Indexed queries"
echo ""

print_color $GREEN "🔵 L3 (ChromaDB) - Long-term Memory:"
echo "   💡 Uso: Búsqueda semántica, conocimiento a largo plazo"
echo "   ⚡ Performance: Variable (vecinos más cercanos)"
echo "   📊 Tamaño: Muy grande (embeddings)"
echo "   ⏱️  Persistencia: Vector database"
echo "   🔄 Estrategia: Semantic similarity"
echo ""

print_color $CYAN "╔═══════════════════════════════════════════════════════════════════╗"
print_color $CYAN "║                    🎯 PATRONES DE ENRUTAMIENTO                   ║"
print_color $CYAN "╚═══════════════════════════════════════════════════════════════════╝"
echo ""

print_color $BLUE "   📊 Según TAMAÑO:"
echo "      < 1KB      → L0 (cache ultrarrápido)"
echo "      1-10KB     → L1 (working memory)"
echo "      > 10KB     → L2 (contexto persistente)"
echo ""

print_color $BLUE "   🎯 Según FRECUENCIA:"
echo "      Muy Alta   → L0 (cada request)"
echo "      Alta       → L1 (desarrollo activo)"
echo "      Media      → L2 (persistente)"
echo "      Baja       → L3 (búsqueda semántica)"
echo ""

print_color $BLUE "   ⏱️  Según VELOCIDAD REQUERIDA:"
echo "      < 1ms      → L0 (hot cache)"
echo "      < 10ms     → L1 (working memory)"
echo "      < 100ms    → L2 (indexed queries)"
echo "      Variable   → L3 (semantic search)"
echo ""

# ============================================================================
# LIMPIEZA
# ============================================================================

echo ""
print_color $GREEN "🧹 Limpiando datos de ejemplo..."
echo ""

docker exec mcp-redis-cache redis-cli DEL "session:user_12345" &>/dev/null || true
docker exec mcp-redis-core redis-cli DEL "plan:plan_feature_xyz" &>/dev/null || true
docker exec -e PGPASSWORD=postgres mcp-postgres psql -U postgres -d surprise_metrics -c "
DELETE FROM memory_context WHERE key LIKE 'conversation:%' OR key LIKE 'plan:%' OR key LIKE 'session:%';
" &>/dev/null || true

print_color $GREEN "✅ Datos de ejemplo limpiados"
echo ""

print_color $CYAN "╔═══════════════════════════════════════════════════════════════════╗"
print_color $CYAN "║                     💡 ¡EJEMPLOS COMPLETADOS!                    ║"
print_color $CYAN "║                                                                ║"
print_color $CYAN "║  Ahora sabes cómo usar cada capa de memoria según tus necesidades║"
print_color $CYAN "╚═══════════════════════════════════════════════════════════════════╝"
echo ""
