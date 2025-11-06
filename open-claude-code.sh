#!/bin/bash
# 🚀 Script para abrir Claude Code con MCP listo
# Uso: ./open-claude-code.sh

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║              🚀 Abriendo Claude Code + MCP                ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Verificar estado
echo "🔍 Verificando estado del stack..."

# Verificar variables de entorno
if [ -z "$MCP_TRANSPORT" ]; then
    echo "⚠️  MCP_TRANSPORT no configurado, configurando..."
    export MCP_TRANSPORT=stdio
fi

# Verificar que estamos en el directorio correcto
if [ ! -f "mcp-server/index.mjs" ]; then
    echo "❌ Error: No estás en el directorio skills-fabrik"
    echo "   Navega a: cd /ruta/a/skills-fabrik"
    exit 1
fi

echo "✅ Variables configuradas:"
echo "   • MCP_TRANSPORT=$MCP_TRANSPORT"
echo "   • SKILLS_FABRIK_ROOT=$(pwd)"
echo ""

# Verificar servicios básicos
echo "📊 Verificando servicios..."
SERVICES_OK=0

if lsof -Pi :6380 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "   ✅ Redis L0 (6380)"
    ((SERVICES_OK++))
else
    echo "   ⚠️  Redis L0 (6380) no disponible"
fi

if lsof -Pi :6381 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "   ✅ Redis L1 (6381)"
    ((SERVICES_OK++))
else
    echo "   ⚠️  Redis L1 (6381) no disponible"
fi

if lsof -Pi :5433 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "   ✅ PostgreSQL (5433)"
    ((SERVICES_OK++))
else
    echo "   ⚠️  PostgreSQL (5433) no disponible"
fi

echo ""

# Verificar MCP Adapters
if [ -d "packages/mcp-adapters/dist" ]; then
    echo "✅ MCP Adapters compilados"
else
    echo "⚠️  MCP Adapters no compilados, compilando..."
    cd packages/mcp-adapters
    if command -v pnpm &> /dev/null; then
        pnpm build
    else
        npm run build
    fi
    cd ../../
fi

echo ""

# Resumen
if [ $SERVICES_OK -ge 2 ]; then
    echo "✅ Stack MCP listo para usar"
elif [ $SERVICES_OK -eq 1 ]; then
    echo "⚠️  Stack parcialmente listo (algunos servicios faltantes)"
else
    echo "⚠️  Stack necesita servicios. Ejecuta: mcp-start"
fi

echo ""
echo "══════════════════════════════════════════════════════════"
echo ""

# Abrir VSCode
echo "📝 Abriendo VSCode con Claude Code..."
echo ""
echo "💡 Una vez abierto, en el chat de Claude Code puedes usar:"
echo ""
echo "   🔹 'Lista los archivos del proyecto'"
echo "   🔹 'Muestra el estado de Git'"
echo "   🔹 'Verifica el estado de los servicios'"
echo "   🔹 'Lista los procesos PM2'"
echo "   🔹 'Lee este archivo'"
echo ""
echo "══════════════════════════════════════════════════════════"
echo ""

# Pausa breve
sleep 1

# Abrir VSCode
code .

echo ""
echo "✅ VSCode abierto. ¡Disfruta usando MCP con Claude Code! 🎉"
