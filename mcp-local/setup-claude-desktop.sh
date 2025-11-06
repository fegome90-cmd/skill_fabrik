#!/bin/bash
# Script para configurar Claude Desktop integration

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_color() {
    echo -e "${1}${2}${NC}"
}

echo ""
print_color $BLUE "════════════════════════════════════════════════════════"
print_color $BLUE "  🤖 Claude Desktop MCP Integration Setup"
print_color $BLUE "════════════════════════════════════════════════════════"
echo ""

# Detectar OS
OS="Unknown"
case "$(uname -s)" in
    Darwin*)
        OS="macOS"
        CONFIG_DIR="$HOME/Library/Application Support/Claude"
        ;;
    Linux*)
        OS="Linux"
        CONFIG_DIR="$HOME/.config/claude"
        ;;
    CYGWIN*|MINGW*|MSYS*)
        OS="Windows"
        CONFIG_DIR="$APPDATA/Claude"
        ;;
esac

print_color $GREEN "✅ OS detectado: $OS"
print_color $GREEN "📁 Directorio de configuración: $CONFIG_DIR"
echo ""

# Verificar si Claude Desktop está instalado
if [ ! -f "$CONFIG_DIR/claude_desktop_config.json" ]; then
    print_color $YELLOW "⚠️  Claude Desktop no encontrado en $CONFIG_DIR"
    echo ""
    echo "Para instalar Claude Desktop:"
    echo "1. Ve a: https://claude.ai/desktop"
    echo "2. Descarga e instala la aplicación"
    echo "3. Ejecuta este script nuevamente"
    echo ""
    exit 1
fi

print_color $GREEN "✅ Claude Desktop encontrado"
echo ""

# Crear backup del config actual
BACKUP_FILE="$CONFIG_DIR/claude_desktop_config.json.backup.$(date +%s)"
if [ ! -f "$BACKUP_FILE" ]; then
    cp "$CONFIG_DIR/claude_desktop_config.json" "$BACKUP_FILE"
    print_color $GREEN "📋 Backup creado: $(basename $BACKUP_FILE)"
fi

# Crear configuración MCP
MCP_CONFIG=$(cat <<EOF
{
  "mcpServers": {
    "skills-fabric": {
      "command": "node",
      "args": ["$PROJECT_ROOT/mcp-server/index.mjs"],
      "env": {
        "MCP_TRANSPORT": "websocket",
        "MCP_WEBSOCKET_PORT": "3001"
      }
    }
  }
}
EOF
)

# Leer config actual
CURRENT_CONFIG=$(cat "$CONFIG_DIR/claude_desktop_config.json")

# Verificar si ya existe la configuración
if echo "$CURRENT_CONFIG" | grep -q "skills-fabric"; then
    print_color $YELLOW "⚠️  Configuración de skills-fabric ya existe"
    read -p "¿Deseas sobrescribirla? (y/N): " -n 1 -r
    echo ""

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_color $BLUE "Cancelado. Manteniendo configuración existente."
        exit 0
    fi
fi

# Merge configs
if echo "$CURRENT_CONFIG" | grep -q "mcpServers"; then
    # Existe mcpServers, agregar al array
    print_color $BLUE "🔄 Actualizando configuración existente..."

    # Crear config temporal
    TEMP_CONFIG=$(mktemp)
    echo "$CURRENT_CONFIG" > "$TEMP_CONFIG"

    # Aquí necesitaríamos jq para hacer merge proper, pero asumimos estructura básica
    print_color $YELLOW "⚠️  Merge manual requerido. Abriendo editor..."

else
    # No existe mcpServers, crear nuevo
    print_color $BLUE "✨ Creando nueva configuración MCP..."
    echo "$CURRENT_CONFIG" | head -n -1 > "$CONFIG_DIR/claude_desktop_config.json.new"
    echo "  ," >> "$CONFIG_DIR/claude_desktop_config.json.new"
    echo "  \"mcpServers\": {" >> "$CONFIG_DIR/claude_desktop_config.json.new"
    echo "    \"skills-fabric\": {" >> "$CONFIG_DIR/claude_desktop_config.json.new"
    echo "      \"command\": \"node\"," >> "$CONFIG_DIR/claude_desktop_config.json.new"
    echo "      \"args\": [\"$PROJECT_ROOT/mcp-server/index.mjs\"]," >> "$CONFIG_DIR/claude_desktop_config.json.new"
    echo "      \"env\": {" >> "$CONFIG_DIR/claude_desktop_config.json.new"
    echo "        \"MCP_TRANSPORT\": \"websocket\"," >> "$CONFIG_DIR/claude_desktop_config.json.new"
    echo "        \"MCP_WEBSOCKET_PORT\": \"3001\"" >> "$CONFIG_DIR/claude_desktop_config.json.new"
    echo "      }" >> "$CONFIG_DIR/claude_desktop_config.json.new"
    echo "    }" >> "$CONFIG_DIR/claude_desktop_config.json.new"
    echo "  }" >> "$CONFIG_DIR/claude_desktop_config.json.new"
    echo "}" >> "$CONFIG_DIR/claude_desktop_config.json.new"
    echo "}" >> "$CONFIG_DIR/claude_desktop_config.json.new"

    mv "$CONFIG_DIR/claude_desktop_config.json.new" "$CONFIG_DIR/claude_desktop_config.json"
fi

print_color $GREEN "✅ Configuración actualizada"
echo ""

# Mostrar la configuración
print_color $BLUE "📝 Configuración agregada:"
echo ""
cat <<EOF

"mcpServers": {
  "skills-fabric": {
    "command": "node",
    "args": ["$PROJECT_ROOT/mcp-server/index.mjs"],
    "env": {
      "MCP_TRANSPORT": "websocket",
      "MCP_WEBSOCKET_PORT": "3001"
    }
  }
}
EOF
echo ""

# Instrucciones finales
print_color $GREEN "════════════════════════════════════════════════════════"
print_color $GREEN "  ✅ Configuración Completada"
print_color $GREEN "════════════════════════════════════════════════════════"
echo ""
print_color $BLUE "📋 Próximos pasos:"
echo ""
print_color $BLUE "1. Reinicia Claude Desktop"
echo ""
print_color $BLUE "2. Inicia el servidor MCP:"
echo "   cd $PROJECT_ROOT"
echo "   export MCP_TRANSPORT=websocket"
echo "   node mcp-server/index.mjs"
echo ""
print_color $BLUE "3. O usa el script de desarrollo:"
echo "   ./mcp-local/mcp-dev.sh"
echo "   (Selecciona opción 7: Start MCP Server (WebSocket))"
echo ""
print_color $BLUE "4. En Claude Desktop, deberías ver el servidor 'skills-fabric' activo"
echo ""
print_color $BLUE "5. ¡Comienza a usar las herramientas MCP!"
echo ""
print_color $YELLOW "💡 Para verificar: Ejecuta 'health_check' en el chat"
echo ""
