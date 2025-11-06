#!/bin/bash
# ⚡ Quick Start para Claude Code + MCP
# Usage: source ./claude-code-start.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_color() {
    echo -e "${1}${2}${NC}"
}

echo ""
print_color $BLUE "═══════════════════════════════════════════════════════"
print_color $BLUE "  🚀 Claude Code + MCP Quick Start"
print_color $BLUE "═══════════════════════════════════════════════════════"
echo ""

# Detectar shell
SHELL_NAME=$(basename "$SHELL")
print_color $GREEN "✅ Shell detectado: $SHELL_NAME"
print_color $GREEN "📁 Proyecto: $PROJECT_ROOT"
echo ""

# Función para agregar a profile
add_to_profile() {
    local profile_file=""

    case $SHELL_NAME in
        "zsh")
            profile_file="$HOME/.zshrc"
            ;;
        "bash")
            profile_file="$HOME/.bashrc"
            ;;
        "fish")
            profile_file="$HOME/.config/fish/config.fish"
            ;;
        *)
            print_color $YELLOW "⚠️  Shell no reconocido. Configuración manual requerida."
            return 1
            ;;
    esac

    echo ""
    print_color $BLUE "📝 Agregando configuración a $profile_file..."

    cat >> "$profile_file" << 'EOF'

# === Skills Fabric MCP Configuration ===
export MCP_TRANSPORT=stdio
export PATH="/ruta/a/skills-fabrik:$PATH"
alias mcp-start='cd /ruta/a/skills-fabrik && ./mcp-local/mcp-local-start.sh'
alias mcp-status='cd /ruta/a/skills-fabrik && ./mcp-local/mcp-local-status.sh'
alias mcp-test='cd /ruta/a/skills-fabrik && ./mcp-local/mcp-local-test.sh'
alias claude-code='cd /ruta/a/skills-fabrik && export MCP_TRANSPORT=stdio && code .'
EOF

    # Reemplazar ruta
    sed -i.bak "s|/ruta/a/skills-fabrik|$PROJECT_ROOT|g" "$profile_file"
    rm "${profile_file}.bak"

    print_color $GREEN "✅ Configuración agregada"
    print_color $YELLOW "💡 Ejecuta: source $profile_file"
    echo ""
}

# Verificar Node.js
if ! command -v node &> /dev/null; then
    print_color $YELLOW "❌ Node.js no encontrado"
    echo "Instala Node.js desde: https://nodejs.org/"
    return 1
fi

print_color $GREEN "✅ Node.js $(node --version) encontrado"

# Verificar pnpm
if command -v pnpm &> /dev/null; then
    print_color $GREEN "✅ pnpm $(pnpm --version) encontrado"
elif command -v npm &> /dev/null; then
    print_color $GREEN "✅ npm $(npm --version) encontrado"
else
    print_color $YELLOW "⚠️  npm/pnpm no encontrado. Instalando..."
    npm install -g pnpm
fi

# Verificar .env
if [ ! -f "${PROJECT_ROOT}/.env" ]; then
    print_color $YELLOW "⚠️  .env no encontrado, copiando .env.example..."
    cp "${PROJECT_ROOT}/.env.example" "${PROJECT_ROOT}/.env"
    print_color $GREEN "✅ Archivo .env creado"
    print_color $YELLOW "   Edita ${PROJECT_ROOT}/.env para personalizar"
fi

# Construir MCP Adapters
if [ ! -d "${PROJECT_ROOT}/packages/mcp-adapters/dist" ]; then
    print_color $BLUE "📦 Construyendo MCP Adapters..."
    cd "${PROJECT_ROOT}/packages/mcp-adapters"

    if [ -f "package.json" ]; then
        if command -v pnpm &> /dev/null; then
            pnpm build
        else
            npm run build
        fi
        print_color $GREEN "✅ MCP Adapters construidos"
    else
        print_color $YELLOW "⚠️  MCP Adapters no encontrado, saltando build"
    fi

    cd "$PROJECT_ROOT"
fi

# Verificar stack
print_color $BLUE "🔌 Verificando stack MCP..."
if timeout 5 bash -c "</dev/tcp/localhost/6380" &>/dev/null; then
    print_color $GREEN "✅ Stack ya está ejecutándose"
else
    print_color $YELLOW "⚠️  Stack no está ejecutándose"
    print_color $BLUE "Ejecuta: ./mcp-local/mcp-local-start.sh"
fi

# Instrucciones
echo ""
print_color $GREEN "═══════════════════════════════════════════════════════"
print_color $GREEN "  ✅ Configuración Lista"
print_color $GREEN "═══════════════════════════════════════════════════════"
echo ""
print_color $BLUE "🎯 Próximos pasos:"
echo ""
print_color $BLUE "1. Iniciar stack MCP:"
print_color $YELLOW "   cd $PROJECT_ROOT"
print_color $YELLOW "   ./mcp-local/mcp-local-start.sh"
echo ""
print_color $BLUE "2. Configurar Claude Code (elige uno):"
echo ""
echo "   📋 Opción A - Automático (agrega al profile):"
echo "      bash -c 'source ./claude-code-start.sh && add_to_profile'"
echo ""
echo "   📋 Opción B - Manual:"
echo "      export MCP_TRANSPORT=stdio"
echo "      cd $PROJECT_ROOT && code ."
echo ""
echo "   📋 Opción C - Settings (en VSCode):"
echo "      Ctrl+Shift+P → Preferences: Open Settings"
echo "      Buscar: 'claudeCode.localMcpServers'"
echo "      Agregar configuración del README"
echo ""
print_color $BLUE "3. Verificar integración:"
echo "   ./mcp-local/mcp-local-test.sh"
echo ""
print_color $BLUE "4. ¡Listo! Abre Claude Code y prueba:"
echo "   • fs_list_directory"
echo "   • git_status"
echo "   • health_check"
echo ""
print_color $YELLOW "💡 Tip: Usa ./mcp-local/mcp-dev.sh para menú interactivo"
echo ""

# Preguntar si agregar al profile
read -p "¿Deseas agregar configuración automática al profile? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    add_to_profile
fi

print_color $GREEN "🎉 ¡Configuración completada!"
