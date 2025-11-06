# 🔧 Claude Code + MCP - Guía de Configuración

## 📋 Métodos de Integración

Claude Code puede usar el servidor MCP de dos formas principales:

### Método 1: Configuración Automática (Recomendado)

#### En macOS/Linux:
```bash
# En tu terminal, antes de abrir VSCode
export MCP_TRANSPORT=stdio
export PATH="/ruta/a/skills-fabrik:$PATH"

# Luego abre VSCode
code .
```

#### Para sesiones persistentes:
```bash
# Agregar a ~/.zshrc o ~/.bashrc
echo 'export MCP_TRANSPORT=stdio' >> ~/.zshrc
echo 'export PATH="/ruta/a/skills-fabrik:$PATH"' >> ~/.zshrc

# Recargar terminal
source ~/.zshrc
```

#### En Windows (PowerShell):
```powershell
# En tu terminal, antes de abrir VSCode
$env:MCP_TRANSPORT="stdio"
$env:PATH="/ruta/a/skills-fabrik;$env:PATH"

# Luego abre VSCode
code .
```

### Método 2: Configuración en Claude Code (Settings)

1. **Abrir Settings de Claude Code:**
   - `Cmd/Ctrl + Shift + P`
   - Buscar: "Claude Code: Settings" o "Preferences: Open Settings"

2. **Agregar configuración MCP:**

   ```json
   {
     "claudeCode.localMcpServers": {
       "skills-fabric": {
         "command": "node",
         "args": ["/ruta/completa/a/skills-fabrik/mcp-server/index.mjs"],
         "env": {
           "MCP_TRANSPORT": "stdio"
         }
       }
     }
   }
   ```

3. **O configurar via UI:**
   - En settings, buscar "MCP"
   - Agregar servidor: `skills-fabric`
   - Comando: `node`
   - Args: `/ruta/completa/a/skills-fabrik/mcp-server/index.mjs`
   - Env: `MCP_TRANSPORT=stdio`

### Método 3: Via PM2 (Para desarrollo avanzado)

Si tienes PM2 ejecutando servicios:

```bash
# Iniciar servidor MCP via PM2
pm2 start ecosystem.config.js --only mcp-server

# O crear configuración específica
pm2 start mcp-server/index.mjs --name "mcp-skills-fabric" -- interpreter node
```

## 🚀 Inicio Rápido en Terminal

### Script de Inicio Automático

Crear script `start-claude-mcp.sh`:

```bash
#!/bin/bash
# Iniciar Claude Code con MCP

echo "🚀 Iniciando Claude Code con MCP..."

# Verificar que el stack esté corriendo
if ! ./mcp-local/mcp-local-status.sh | grep -q "Salud del stack: 100%"; then
    echo "⚠️  Stack MCP no está listo. Iniciando..."
    ./mcp-local/mcp-local-start.sh
    sleep 5
fi

# Configurar variables
export MCP_TRANSPORT=stdio
export PATH="$(pwd):$PATH"

# Verificar conexión
echo "🔌 Probando conexión MCP..."
if timeout 5 node -e "
    import('./mcp-server/index.mjs').catch(() => {
        console.log('MCP Server ready');
        process.exit(0);
    });
" 2>/dev/null; then
    echo "✅ MCP Server conectado"
else
    echo "⚠️  MCP Server no responde"
fi

# Abrir VSCode
echo "📝 Abriendo VSCode..."
code .

echo "✅ Claude Code iniciado con MCP"
```

### Variables de Entorno Recomendadas

En tu terminal shell profile (`~/.zshrc`, `~/.bashrc`, etc.):

```bash
# Skills Fabric MCP Configuration
export MCP_TRANSPORT=stdio
export SKILLS_FABRIK_ROOT="/ruta/a/skills-fabrik"
export PATH="$SKILLS_FABRIK_ROOT:$PATH"
export PATH="$SKILLS_FABRIK_ROOT/mcp-local:$PATH"

# Para auto-inicio del stack
alias mcp-start='cd $SKILLS_FABRIK_ROOT && ./mcp-local/mcp-local-start.sh'
alias mcp-status='cd $SKILLS_FABRIK_ROOT && ./mcp-local/mcp-local-status.sh'
alias mcp-test='cd $SKILLS_FABRIK_ROOT && ./mcp-local/mcp-local-test.sh'
alias claude-code='cd $SKILLS_FABRIK_ROOT && export MCP_TRANSPORT=stdio && code .'
```

## 💻 Ejemplos Prácticos de Uso

### Terminal 1: Servidor MCP
```bash
# Terminal 1: Iniciar stack y servidor
cd skills-fabrik
./mcp-local/mcp-local-start.sh

# Verificar estado
./mcp-local/mcp-local-status.sh

# El servidor MCP queda corriendo
```

### Terminal 2: Claude Code
```bash
# Terminal 2: Usar con Claude Code
cd skills-fabrik
export MCP_TRANSPORT=stdio

# Abrir VSCode con Claude Code
code .

# En Claude Code, puedes usar las herramientas MCP:
# - fs_read_file
# - git_status
# - pm2_list
# - health_check
```

### Terminal 3: Monitoreo
```bash
# Terminal 3: Monitoreo continuo
cd skills-fabrik

# Ver logs en tiempo real
watch -n 5 './mcp-local/mcp-local-status.sh'

# O ver logs Docker
docker-compose -f mcp-local/docker-compose.yml logs -f
```

## 🎯 Uso Directo en Claude Code

Una vez configurado, en el chat de Claude Code puedes usar:

```
👤 User: "Lista los archivos de este proyecto"
🤖 Claude Code: [usa fs_list_directory tool]

👤 User: "Muestra el estado de Git"
🤖 Claude Code: [usa git_status tool]

👤 User: "Verifica el estado de los servicios"
🤖 Claude Code: [usa health_check tool]

👤 User: "Lista los procesos PM2"
🤖 Claude Code: [usa pm2_list tool]

👤 User: "Crea un snapshot del plan actual"
🤖 Claude Code: [usa create_plan_snapshot tool]
```

## 🔄 Workflow Típico

### Desarrollo Diario
```bash
# 1. Al inicio del día
mcp-start              # Alias para iniciar stack

# 2. Antes de trabajar
claude-code            # Alias para abrir VSCode con MCP

# 3. Durante el desarrollo
# Claude Code usa automáticamente las herramientas MCP

# 4. Al final del día
pm2 stop all           # Opcional: detener servicios
```

### Desarrollo Colaborativo
```bash
# En equipo, todos usan la misma configuración:

# 1. Clonar repo
git clone <repo-url>
cd skills-fabrik

# 2. Setup automatizado
./mcp-local/mcp-local-start.sh

# 3. Configurar Claude Code
./mcp-local/setup-claude-desktop.sh  # Para Claude Desktop
# O seguir Método 1/2 para Claude Code (VSCode)

# 4. Todos trabajan con las mismas herramientas MCP
```

## 🛠️ Solución de Problemas Comunes

### ❌ "MCP Server no encontrado"

**Problema:**
```
Failed to connect to MCP server: skills-fabric
```

**Solución:**
```bash
# 1. Verificar que el servidor existe
ls -la /ruta/a/skills-fabrik/mcp-server/index.mjs

# 2. Verificar permisos
chmod +x /ruta/a/skills-fabrik/mcp-server/index.mjs

# 3. Probar manualmente
node /ruta/a/skills-fabrik/mcp-server/index.mjs --version
```

### ❌ "Timeout al ejecutar herramienta"

**Problema:**
```
Tool execution timed out
```

**Solución:**
```bash
# 1. Verificar que el stack está corriendo
./mcp-local/mcp-local-status.sh

# 2. Verificar conectividad
./mcp-local/mcp-local-test.sh

# 3. Reiniciar stack si es necesario
./mcp-local/mcp-local-stop.sh
./mcp-local/mcp-local-start.sh
```

### ❌ "Comando no encontrado: node"

**Problema:**
```
sh: node: command not found
```

**Solución:**
```bash
# 1. Verificar Node.js
which node
node --version

# 2. Si no está instalado:
# macOS: brew install node
# Ubuntu: sudo apt install nodejs npm
# Windows: Descargar desde nodejs.org

# 3. Verificar PATH
echo $PATH
```

### ❌ "Puerto ya en uso"

**Problema:**
```
Error: listen EADDRINUSE: address already in use :::6380
```

**Solución:**
```bash
# 1. Verificar qué proceso usa el puerto
lsof -i :6380

# 2. Detener proceso
kill -9 <PID>

# 3. O cambiar puerto en docker-compose.yml
```

## 📝 Configuración por Entorno

### Desarrollo Local
```bash
# .env.local
MCP_TRANSPORT=stdio
LOG_LEVEL=debug
NODE_ENV=development
```

### CI/CD Testing
```bash
# .env.ci
MCP_TRANSPORT=stdio
LOG_LEVEL=error
TEST_MODE=true
```

### Producción (No recomendado para MCP local)
```bash
# .env.production
MCP_TRANSPORT=websocket
MCP_WEBSOCKET_PORT=3001
LOG_LEVEL=warn
```

## 🎓 Tips Avanzados

### 1. Multiple MCP Servers
Puedes ejecutar múltiples servidores MCP:

```json
{
  "claudeCode.localMcpServers": {
    "skills-fabric": {
      "command": "node",
      "args": ["/path/to/mcp-server/index.mjs"],
      "env": { "MCP_TRANSPORT": "stdio" }
    },
    "custom-tools": {
      "command": "node",
      "args": ["/path/to/other-mcp-server/index.mjs"],
      "env": { "MCP_TRANSPORT": "stdio" }
    }
  }
}
```

### 2. Debug Mode
```bash
# Habilitar logs detallados
export MCP_DEBUG=true
export LOG_LEVEL=debug

# Abrir VSCode
code .
```

### 3. Auto-restart
```bash
# Usar nodemon para auto-restart del servidor
npm install -g nodemon

nodemon mcp-server/index.mjs
```

### 4. Docker Inside Docker
Si estás en un contenedor Docker:

```bash
# Montar socket Docker
docker run -v /var/run/docker.sock:/var/run/docker.sock ...

# Ejecutar MCP dentro del contenedor
docker exec -it <container> bash
cd /workspace
export MCP_TRANSPORT=stdio
code .
```

## 📚 Recursos Adicionales

- [Claude Code Documentation](https://docs.anthropic.com/claude-cli)
- [MCP Specification](https://modelcontextprotocol.io/)
- [VSCode Settings Reference](https://code.visualstudio.com/docs/getstarted/settings)

---

## ✅ Checklist de Configuración

- [ ] Node.js instalado (v18+)
- [ ] Stack MCP iniciado (`./mcp-local/mcp-local-start.sh`)
- [ ] MCP Adapters compilados
- [ ] Variables de entorno configuradas
- [ ] Claude Code configurado (Método 1, 2 o 3)
- [ ] Conexión verificada (`./mcp-local/mcp-local-test.sh`)
- [ ] VSCode abierto con Claude Code
- [ ] ¡Herramientas MCP funcionando!

**¡Listo para usar!** 🎉
