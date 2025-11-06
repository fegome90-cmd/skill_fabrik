# CLI con Comandos Slash para Agentes de IA Local

## Documentación Técnica Completa

**Versión**: 1.0  
**Fecha**: Noviembre 2025  
**Fuentes**: Análisis de arquitectura técnica y guía práctica de implementación

---

## Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Contexto y Estado del Arte](#contexto-y-estado-del-arte)
3. [Arquitectura de Referencia](#arquitectura-de-referencia)
4. [Comandos Slash](#comandos-slash)
5. [Comunicación Inter-Procesos (IPC)](#comunicación-inter-procesos-ipc)
6. [Stack Tecnológico Recomendado](#stack-tecnológico-recomendado)
7. [Implementación MVP](#implementación-mvp)
8. [Seguridad y Guardrails](#seguridad-y-guardrails)
9. [Testing y Observabilidad](#testing-y-observabilidad)
10. [Roadmap de Implementación](#roadmap-de-implementación)

---

## Resumen Ejecutivo

Este documento proporciona una guía completa para el desarrollo de una CLI moderna con comandos "slash" diseñada para interactuar con agentes de IA locales. La arquitectura está inspirada en herramientas líderes como **Claude Code** (Anthropic), **Gemini CLI** (Google) y **Codex CLI** (OpenAI).

### Características Clave

- ✅ **Comandos slash personalizables** (`/review`, `/optimize`, `/plan`)
- ✅ **Operación 100% local** sin dependencias cloud obligatorias
- ✅ **Multi-lenguaje**: Soporte para Python, Java, TypeScript
- ✅ **Arquitectura de plugins** desacoplada y extensible
- ✅ **IPC robusto** vía JSON-RPC sobre stdio
- ✅ **Seguridad por diseño** con modelo de confianza cero

### Decisiones Técnicas Principales

| Aspecto | Decisión Recomendada | Justificación |
|---------|---------------------|---------------|
| **IPC** | JSON-RPC 2.0 sobre stdio | Elimina conflictos de puertos, más seguro, patrón probado (LSP, MCP) |
| **Formato Comandos** | TOML con plantillas embebidas | Balance entre estructura (TOML) y expresividad (plantillas) |
| **Arquitectura** | CLI Core + Language Plugins | Aislamiento de dependencias, escalabilidad multi-lenguaje |
| **CLI Framework (TS)** | oclif + Ink | Ecosistema maduro + TUI declarativa tipo React |
| **CLI Framework (Python)** | Typer + Rich + Prompt Toolkit | Moderno, tipado, excelente UX en terminal |

---

## Contexto y Estado del Arte

### Ejemplos de CLIs Modernas

Las compañías líderes en IA han desarrollado CLIs interactivas para asistir desarrollo:

#### **Claude Code** (Anthropic)
- Comandos slash definidos en archivos **Markdown** (`.md`)
- Ubicación: `.claude/commands/` (proyecto) o `~/.claude/commands/` (global)
- Prioriza legibilidad humana y formato libre
- Ejemplo: `.claude/commands/optimize.md` → comando `/optimize`

#### **Gemini CLI** (Google)
- Comandos definidos en archivos **TOML** (`.toml`)
- Mayor estructura: argumentos explícitos, integración con herramientas shell
- Sintaxis de plantillas: `{{args}}`, `!{comando_shell}`
- Puede ejecutar comandos locales e incrustar resultados en prompts

#### **Codex CLI** (OpenAI)
- Escrito en **Rust** para máxima velocidad y eficiencia
- Enfoque en agente de código local, open source
- Interfaz de terminal interactiva tipo chat

### Ventajas de los Comandos Slash

1. **Atajos eficientes**: Un comando `/review src/main.py` vs escribir todo el prompt
2. **Consistencia**: Procesos estandarizados entre equipo
3. **Ahorro de tokens**: Instrucciones complejas no consumen contexto cada vez
4. **Personalización**: Comandos adaptados al workflow del proyecto
5. **Reutilización**: Compartir comandos versionados en Git

---

## Arquitectura de Referencia

### Diagrama Arquitectónico

```
┌─────────────────────────────────────────────────────────────────┐
│                          USUARIO                                │
│                  /review src/main.py                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   CLI CORE (Proceso Principal)                  │
│  ┌──────────────┐  ┌────────────────┐  ┌──────────────────┐   │
│  │ CLI Core     │─▶│ Slash Command  │─▶│ IPC Client       │   │
│  │ (oclif/Typer)│  │ Engine         │  │ (JSON-RPC stdio) │   │
│  └──────────────┘  └────────────────┘  └──────────────────┘   │
│          │                 │                      ▲             │
│          │                 │                      │             │
│          ▼                 ▼                      │             │
│  ┌──────────────┐  ┌────────────────┐           │             │
│  │ Plugin Host  │  │ Command Loader │           │             │
│  │              │  │ (.agent/       │           │             │
│  │              │  │  commands/*.   │           │             │
│  │              │  │  toml)         │           │             │
│  └──────┬───────┘  └────────────────┘           │             │
└─────────┼──────────────────────────────────────┬┘             │
          │                                      │               │
          ▼                                      │               │
┌─────────────────────────────────────────────────────────────────┐
│              LANGUAGE PLUGIN (Subproceso)                       │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ Language Plugin (Python/Node/Java)                      │   │
│  │  - Lee contexto del proyecto                            │   │
│  │  - Inyecta variables en plantillas                      │   │
│  │  - IPC Server (JSON-RPC stdio) ◄────────────────────────┤   │
│  └────────────────────────────────────────────────────────┘   │
│                         │                                      │
│                         ▼                                      │
│              ┌──────────────────────┐                         │
│              │ Invoca Agente IA     │                         │
│              │ vía IPC              │                         │
│              └──────────────────────┘                         │
└─────────────────────────┬─────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│            LOCAL AI AGENT (Proceso Persistente)                 │
│                      (memtech u otro)                           │
└─────────────────────────────────────────────────────────────────┘
```

### Flujo de Ejecución de un Comando

1. **Input del Usuario**: Usuario escribe `/review src/main.py`
2. **Parsing**: CLI Core identifica el comando slash
3. **Descubrimiento**: Slash Command Engine carga `.agent/commands/review.toml`
4. **Plugin Invocation**: Plugin Host detecta lenguaje (Python) y lanza plugin correspondiente
5. **Comunicación IPC**: IPC Client envía petición JSON-RPC via stdio al plugin
6. **Contextualización**: Language Plugin lee `src/main.py` e inyecta contenido en prompt
7. **Invocación Agente**: Plugin se comunica con Local AI Agent (proceso separado)
8. **Respuesta**: Flujo inverso hasta CLI, que formatea y presenta al usuario

---

## Comandos Slash

### Formato de Definición

#### Ubicación de Comandos

Prioridad de descubrimiento:
1. **Proyecto**: `.agent/commands/*.toml` (versionable con Git)
2. **Usuario**: `~/.config/agent/commands/*.toml` (comandos globales personales)

**Regla de nomenclatura**:
- `review.toml` → comando `/review`
- `git/commit.toml` → comando `/git:commit` (namespacing)

#### Estructura TOML

```toml
# Metadatos
name = "review"
description = "Solicita una revisión de código para un archivo o PR."

# Argumentos posicionales (validación y ayuda)
args = [
  { name = "target", description = "Ruta del archivo o número de PR", required = true }
]

# Flags opcionales
flags = [
  { name = "strict", description = "Modo de revisión estricto", type = "boolean" },
  { name = "format", description = "Formato de salida", type = "string", default = "markdown" }
]

# Plantilla del prompt
[prompt]
template = """
Eres un ingeniero de software senior experto en revisiones de código.
Analiza el siguiente contenido en busca de bugs, vulnerabilidades de 
seguridad, problemas de rendimiento y mejoras de estilo.

Contexto del archivo: {{target_path}}
Lenguaje detectado: {{target_language}}

Contenido a revisar:
```{{target_language}}
{{target_content}}
```

Proporciona feedback en formato Markdown con bloques de código sugeridos.
"""
```

### Variables de Plantilla

#### Variables de Argumentos
- `{{args}}` - Todos los argumentos como cadena única
- `{{arg1}}`, `{{arg2}}` - Argumentos posicionales individuales
- `{{target}}` - Alias para `{{arg1}}`

#### Variables de Contexto (inyectadas por CLI)
- `{{target_path}}` - Ruta del archivo principal
- `{{target_content}}` - Contenido completo del archivo
- `{{target_language}}` - Lenguaje detectado (python, typescript, java, etc.)
- `{{clipboard_content}}` - Contenido actual del portapapeles
- `{{git_diff}}` - Salida de `git diff` en repo actual
- `{{project_root}}` - Directorio raíz del proyecto
- `{{cwd}}` - Directorio de trabajo actual

### Comandos Base Predefinidos

```
/help [command]         # Muestra ayuda general o de comando específico
/model <model_name>     # Selecciona modelo de IA activo
/clear                  # Limpia historial de conversación
/plan <task>            # Genera plan de implementación (sin código)
/review <path|PR#>      # Revisión de código
/run-tests [name]       # Ejecuta tests del proyecto
/mem <slice>            # Interactúa con memoria del agente
/history                # Muestra historial de comandos
/save <file>            # Guarda sesión actual
```

---

## Comunicación Inter-Procesos (IPC)

### Análisis Comparativo de Mecanismos IPC

| Mecanismo | Rendimiento | Portabilidad | Seguridad | Complejidad | Recomendado |
|-----------|-------------|--------------|-----------|-------------|-------------|
| **HTTP Local** | Bajo | Excelente | Bajo (DNS rebinding) | Media | ❌ No |
| **Unix Sockets** | Alto | Baja (no Windows nativo) | Alto | Alta (gestión archivos) | ⚠️ Condicional |
| **gRPC** | Muy Alto | Excelente | Alto | Muy Alta | ⚠️ Overkill local |
| **JSON-RPC stdio** | Alto | Excelente | Muy Alto | Baja | ✅ **SÍ** |

### JSON-RPC 2.0 sobre stdio (Recomendado)

#### Ventajas
- ✅ **Sin conflictos de puertos** (no usa red)
- ✅ **Seguridad inherente** (no expone endpoints)
- ✅ **Gestión simple** de procesos hijo
- ✅ **Patrón probado** (LSP, MCP)
- ✅ **Fácil depuración** (logs de mensajes JSON)

#### Protocolo

**Codificación**: UTF-8  
**Formato**: JSON-RPC 2.0

### Métodos RPC Definidos

#### `agent/invoke` (Request)

Método principal para ejecutar tarea en el agente.

**Request**:
```json
{
  "jsonrpc": "2.0",
  "id": "req-123",
  "method": "agent/invoke",
  "params": {
    "messages": [
      { "role": "user", "content": "Revisa este código..." }
    ],
    "tools": [
      {
        "name": "read_file",
        "description": "Lee contenido de un archivo",
        "parameters": { /* JSON Schema */ }
      }
    ],
    "constraints": {
      "max_tokens": 4096,
      "temperature": 0.7
    }
  }
}
```

**Response**:
```json
{
  "jsonrpc": "2.0",
  "id": "req-123",
  "result": {
    "id": "resp-456",
    "role": "assistant",
    "content": "He revisado el código...",
    "tool_calls": [
      {
        "id": "call-789",
        "toolName": "read_file",
        "args": { "path": "src/utils.py" }
      }
    ]
  }
}
```

#### `agent/streamChunk` (Notification)

Notificación para streaming de respuestas largas.

```json
{
  "jsonrpc": "2.0",
  "method": "agent/streamChunk",
  "params": {
    "requestId": "req-123",
    "chunk": {
      "content_delta": "He encontrado...",
      "index": 5
    }
  }
}
```

#### `agent/cancel` (Notification)

Cancela una solicitud en curso.

```json
{
  "jsonrpc": "2.0",
  "method": "agent/cancel",
  "params": {
    "requestId": "req-123"
  }
}
```

### Esquemas de Datos (JSON Schema)

#### Message

```json
{
  "type": "object",
  "properties": {
    "role": { "enum": ["user", "assistant", "system"] },
    "content": { "type": "string" }
  },
  "required": ["role", "content"]
}
```

#### Tool

```json
{
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "description": { "type": "string" },
    "parameters": { "$ref": "http://json-schema.org/draft-07/schema#" }
  },
  "required": ["name", "description", "parameters"]
}
```

#### ToolCall

```json
{
  "type": "object",
  "properties": {
    "id": { "type": "string" },
    "toolName": { "type": "string" },
    "args": { "type": "object" }
  },
  "required": ["id", "toolName", "args"]
}
```

#### Patch

```json
{
  "type": "object",
  "properties": {
    "file_path": { "type": "string" },
    "content_diff": { 
      "type": "string", 
      "description": "Diferencial en formato unificado (diff -u)" 
    }
  },
  "required": ["file_path", "content_diff"]
}
```

---

## Stack Tecnológico Recomendado

### Tabla Comparativa de Frameworks CLI/TUI

#### Node.js / TypeScript

| Framework | Rendimiento | DX | Ecosistema | Autocompletado | TUI | Licencia | Recomendado |
|-----------|-------------|-------|------------|----------------|-----|----------|-------------|
| **oclif** | Bueno | ⭐⭐⭐⭐⭐ | Muy Alto | Nativo (plugin) | Limitado | MIT | ✅ CLI Core |
| **Commander.js** | Muy Bueno | ⭐⭐⭐⭐⭐ | Muy Alto | Terceros | Nulo | MIT | ⚠️ Alternativa |
| **yargs** | Muy Bueno | ⭐⭐⭐⭐ | Muy Alto | Nativo | Nulo | MIT | ⚠️ Alternativa |
| **Ink** | N/A | ⭐⭐⭐⭐⭐ | Alto | N/A | ⭐⭐⭐⭐⭐ | MIT | ✅ TUI |
| **blessed** | Bueno | ⭐⭐⭐ | Medio | N/A | ⭐⭐⭐ | MIT | ❌ Imperativo |

**Recomendación MVP TypeScript**: **oclif + Ink**

#### Python

| Framework | Rendimiento | DX | Ecosistema | Autocompletado | TUI | Licencia | Recomendado |
|-----------|-------------|-------|------------|----------------|-----|----------|-------------|
| **Typer/Click** | Muy Bueno | ⭐⭐⭐⭐⭐ | Muy Alto | Nativo | Nulo | BSD-3 | ✅ CLI Core |
| **Rich** | N/A | ⭐⭐⭐⭐⭐ | Alto | N/A | ⭐⭐⭐⭐⭐ | MIT | ✅ Render |
| **Textual** | N/A | ⭐⭐⭐⭐⭐ | Alto | N/A | ⭐⭐⭐⭐⭐ | MIT | ⚠️ Full TUI |
| **Prompt Toolkit** | N/A | ⭐⭐⭐⭐⭐ | Alto | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | BSD-3 | ✅ Input |

**Recomendación MVP Python**: **Typer + Rich + Prompt Toolkit**

#### Go

| Framework | Rendimiento | DX | Ecosistema | Autocompletado | TUI | Licencia |
|-----------|-------------|-------|------------|----------------|-----|----------|
| **Cobra/Viper** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Muy Alto | Nativo | Limitado | Apache-2.0 |
| **Bubble Tea** | N/A | ⭐⭐⭐⭐⭐ | Alto | N/A | ⭐⭐⭐⭐⭐ | MIT |

#### Rust

| Framework | Rendimiento | DX | Ecosistema | Autocompletado | TUI | Licencia |
|-----------|-------------|-------|------------|----------------|-----|----------|
| **clap** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Muy Alto | Nativo | Nulo | MIT/Apache-2.0 |
| **ratatui** | N/A | ⭐⭐⭐⭐⭐ | Alto | N/A | ⭐⭐⭐⭐⭐ | MIT |

---

## Implementación MVP

### MVP TypeScript

#### Estructura del Proyecto

```
/
├── src/
│   ├── commands/
│   │   ├── base-command.ts      # Clase base compartida
│   │   └── slash.ts             # Manejador principal /...
│   ├── core/
│   │   ├── slash-parser.ts      # Parser "/cmd <args>"
│   │   ├── command-loader.ts    # Carga comandos desde .agent/
│   │   └── agent-client.ts      # Cliente JSON-RPC stdio
│   └── hooks/
│       └── init.ts              # Hook oclif para init
├── .agent/
│   └── commands/
│       ├── review.toml
│       └── optimize.toml
└── package.json
```

#### Código Ejemplo: Manejador Slash

```typescript
// src/commands/slash.ts
import { Command, Flags } from '@oclif/core';
import { loadCommand } from '../core/command-loader';
import { invokeAgent } from '../core/agent-client';
import { render } from 'ink';
import React from 'react';
import { Spinner } from '@inkjs/ui';

export default class Slash extends Command {
  static description = 'Ejecuta un comando slash para interactuar con el agente de IA.';
  static strict = false; // Permite argumentos arbitrarios

  public async run(): Promise<void> {
    const { argv } = await this.parse(Slash);
    const fullCommand = argv.join(' ');

    if (!fullCommand.startsWith('/')) {
      this.log('Error: La entrada debe ser un comando slash (ej. /review <file>).');
      return;
    }

    const commandName = fullCommand.split(' ')[0].substring(1);
    const commandDef = await loadCommand(commandName);

    if (!commandDef) {
      this.log(`Error: Comando desconocido "/${commandName}".`);
      return;
    }

    // Leer archivo, inyectar contexto en plantilla
    const prompt = this.buildPrompt(commandDef, argv.slice(1));

    render(<Spinner label="El agente está pensando..." />);
     
    const response = await invokeAgent({
      messages: [{ role: 'user', content: prompt }],
    });

    console.log(response.content);
  }

  private buildPrompt(commandDef: any, args: string[]): string {
    let prompt = commandDef.prompt.template;
    
    // Sustituir variables
    prompt = prompt.replace('{{args}}', args.join(' '));
    
    // Si hay archivo, leer contenido
    if (args[0] && fs.existsSync(args[0])) {
      const content = fs.readFileSync(args[0], 'utf-8');
      prompt = prompt.replace('{{target_content}}', content);
      prompt = prompt.replace('{{target_path}}', args[0]);
    }
    
    return prompt;
  }
}
```

#### Cliente IPC (JSON-RPC stdio)

```typescript
// src/core/agent-client.ts
import { spawn, ChildProcess } from 'child_process';
import { JSONRPCClient } from 'json-rpc-2.0';

let agentProcess: ChildProcess | null = null;

function startAgentProcess(): ChildProcess {
  if (!agentProcess) {
    agentProcess = spawn('path/to/agent/executable', [], { 
      stdio: ['pipe', 'pipe', 'inherit'] 
    });
  }
  return agentProcess;
}

const client = new JSONRPCClient((jsonRPCRequest) => {
  const process = startAgentProcess();
  process.stdin?.write(JSON.stringify(jsonRPCRequest) + '\n');
});

startAgentProcess().stdout?.on('data', (data) => {
  const lines = data.toString().split('\n').filter((l: string) => l.trim());
  lines.forEach((line: string) => {
    try {
      client.receive(JSON.parse(line));
    } catch (e) {
      console.error('Error parsing JSON-RPC response:', e);
    }
  });
});

export async function invokeAgent(params: any): Promise<any> {
  return client.request('agent/invoke', params);
}

export function cancelRequest(requestId: string): void {
  client.notify('agent/cancel', { requestId });
}
```

#### Configuración Autocompletado (oclif)

```bash
# Instalar plugin
npm install @oclif/plugin-autocomplete

# Añadir a package.json
{
  "name": "my-cli",
  "oclif": {
    "plugins": ["@oclif/plugin-autocomplete"]
  }
}

# Usuario ejecuta (una vez):
my-cli autocomplete
echo "source $(my-cli autocomplete)" >> ~/.zshrc
```

---

### MVP Python

#### Estructura del Proyecto

```
/
├── my_cli/
│   ├── __main__.py          # Entry point con bucle prompt
│   ├── core/
│   │   ├── command_loader.py
│   │   └── agent_client.py
│   └── commands.py          # Lógica comandos /review, etc.
├── .agent/
│   └── commands/
│       ├── review.toml
│       └── optimize.toml
└── pyproject.toml
```

#### Código Ejemplo: Bucle de Prompt Interactivo

```python
# my_cli/__main__.py
import typer
from prompt_toolkit import PromptSession
from prompt_toolkit.history import FileHistory
from prompt_toolkit.auto_suggest import AutoSuggestFromHistory
from prompt_toolkit.completion import WordCompleter
from rich.console import Console
from .commands import handle_command

# Lista de comandos cargados desde .agent/commands/
COMMANDS = ["/review", "/optimize", "/help", "/clear", "/plan"]

def main():
    session = PromptSession(
        history=FileHistory("~/.agent_history"),
        enable_history_search=True
    )
    console = Console()
    completer = WordCompleter(COMMANDS, ignore_case=True)

    console.print("[bold cyan]CLI Agente IA Local[/bold cyan]")
    console.print("Escribe un comando slash o pregunta directamente.\n")

    while True:
        try:
            user_input = session.prompt(
                "> ",
                auto_suggest=AutoSuggestFromHistory(),
                completer=completer,
                complete_while_typing=True,
            )
            
            if user_input.strip():
                handle_command(user_input, console)
                
        except (KeyboardInterrupt, EOFError):
            console.print("\n[yellow]Saliendo...[/yellow]")
            break

if __name__ == "__main__":
    typer.run(main)
```

#### Lógica de Comandos con Rich

```python
# my_cli/commands.py
from rich.console import Console
from rich.markdown import Markdown
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.syntax import Syntax
from .core.agent_client import invoke_agent
from .core.command_loader import load_command_template
import os

def handle_command(user_input: str, console: Console):
    parts = user_input.strip().split(maxsplit=1)
    command_name = parts[0]

    # Comando /review
    if command_name == "/review":
        if len(parts) < 2:
            console.print("[bold red]Error: /review requiere una ruta de archivo.[/bold red]")
            return
         
        file_path = parts[1]
        
        if not os.path.exists(file_path):
            console.print(f"[bold red]Error: Archivo no encontrado '{file_path}'.[/bold red]")
            return
        
        with open(file_path, "r") as f:
            content = f.read()
        
        # Cargar plantilla del comando
        template = load_command_template("review")
        prompt = template.replace("{{target_content}}", content)
        prompt = prompt.replace("{{target_path}}", file_path)
        
        # Progress spinner mientras el agente procesa
        with Progress(
            SpinnerColumn(),
            TextColumn("[cyan]Invocando al agente..."),
            console=console
        ) as progress:
            task = progress.add_task("processing", total=None)
            response = invoke_agent({
                "messages": [{"role": "user", "content": prompt}]
            })
            progress.stop()
        
        # Renderizar respuesta como Markdown
        md = Markdown(response["content"])
        console.print(md)
    
    # Comando /clear
    elif command_name == "/clear":
        console.clear()
        console.print("[green]Historial limpiado.[/green]")
    
    # Comando /help
    elif command_name == "/help":
        console.print("[bold]Comandos disponibles:[/bold]")
        for cmd in COMMANDS:
            console.print(f"  {cmd}")
    
    # Comando desconocido o texto libre
    else:
        if user_input.startswith("/"):
            console.print(f"[yellow]Comando '{command_name}' no reconocido.[/yellow]")
        else:
            # Enviar como mensaje directo al agente
            console.print("[dim]Enviando al agente...[/dim]")
            response = invoke_agent({
                "messages": [{"role": "user", "content": user_input}]
            })
            md = Markdown(response["content"])
            console.print(md)
```

#### Cliente IPC Python

```python
# my_cli/core/agent_client.py
import subprocess
import json
import uuid
from typing import Dict, Any

class AgentClient:
    def __init__(self, agent_executable: str):
        self.process = subprocess.Popen(
            [agent_executable],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1
        )
    
    def invoke(self, params: Dict[str, Any]) -> Dict[str, Any]:
        request_id = str(uuid.uuid4())
        request = {
            "jsonrpc": "2.0",
            "id": request_id,
            "method": "agent/invoke",
            "params": params
        }
        
        # Enviar request
        self.process.stdin.write(json.dumps(request) + "\n")
        self.process.stdin.flush()
        
        # Leer response
        response_line = self.process.stdout.readline()
        response = json.loads(response_line)
        
        if "error" in response:
            raise Exception(f"Agent error: {response['error']}")
        
        return response.get("result", {})
    
    def cancel(self, request_id: str):
        notification = {
            "jsonrpc": "2.0",
            "method": "agent/cancel",
            "params": {"requestId": request_id}
        }
        self.process.stdin.write(json.dumps(notification) + "\n")
        self.process.stdin.flush()

# Singleton global
_client = None

def get_client() -> AgentClient:
    global _client
    if _client is None:
        _client = AgentClient("path/to/agent/executable")
    return _client

def invoke_agent(params: Dict[str, Any]) -> Dict[str, Any]:
    return get_client().invoke(params)
```

---

## Seguridad y Guardrails

### Modelo de Confianza Cero

La CLI debe actuar como **intermediario de confianza** que impone políticas estrictas ANTES de ejecutar acciones potencialmente peligrosas.

### Mecanismos de Seguridad

#### 1. Confirmación Interactiva Obligatoria

Requiere confirmación explícita del usuario para:
- ✅ Escribir o modificar archivos
- ✅ Ejecutar comandos shell (fuera de whitelist)
- ✅ Acceder a red
- ✅ Instalar paquetes (npm install, pip install)

```python
from rich.prompt import Confirm

def confirm_action(description: str, details: str) -> bool:
    console.print(f"\n[yellow]⚠️  Acción requiere confirmación:[/yellow]")
    console.print(f"[bold]{description}[/bold]")
    console.print(f"[dim]{details}[/dim]\n")
    return Confirm.ask("¿Proceder?", default=False)

# Uso
if confirm_action(
    "Modificar archivo",
    f"El agente propone escribir en: {file_path}"
):
    # ejecutar acción
```

#### 2. Modo Simulación (--dry-run)

```bash
# Flag global
my-cli --dry-run /review src/main.py

# Salida indica claramente:
[DRY-RUN] Leería archivo: src/main.py
[DRY-RUN] Enviaría al agente: <prompt>
[DRY-RUN] NO se ejecuta acción real
```

#### 3. Lista Blanca de Comandos (Allow-list)

Archivo de configuración: `~/.config/agent/settings.toml`

```toml
[security]
# Comandos shell seguros (no requieren confirmación)
safe_commands = [
  "ls",
  "cat",
  "grep",
  "git status",
  "git log",
  "git diff"
]

# Por defecto, lista vacía = todo requiere confirmación
```

#### 4. CWD Jail (Aislamiento de Directorio)

```python
import os
from pathlib import Path

class SecurityJail:
    def __init__(self, project_root: str):
        self.jail_root = Path(project_root).resolve()
    
    def is_path_allowed(self, target_path: str) -> bool:
        target = Path(target_path).resolve()
        try:
            target.relative_to(self.jail_root)
            return True
        except ValueError:
            return False
    
    def validate_or_raise(self, target_path: str):
        if not self.is_path_allowed(target_path):
            raise SecurityError(
                f"Acceso denegado fuera del proyecto: {target_path}"
            )

# Uso
jail = SecurityJail(os.getcwd())
jail.validate_or_raise("/etc/passwd")  # Lanza excepción
```

#### 5. "No-Mess-Left-Behind"

```python
import tempfile
import shutil
from contextlib import contextmanager

@contextmanager
def safe_temp_dir():
    """Garantiza limpieza de archivos temporales incluso si falla."""
    temp_dir = tempfile.mkdtemp(prefix="agent_cli_")
    try:
        yield temp_dir
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)

# Uso
with safe_temp_dir() as tmpdir:
    # Operaciones con archivos temporales
    work_file = os.path.join(tmpdir, "work.txt")
    # Si falla aquí, tmpdir se limpia automáticamente
```

---

## Testing y Observabilidad

### Estrategia de Testing

#### 1. Golden Prompts (E2E Testing)

Crear conjunto de datos de prueba:

```
tests/
└── golden/
    ├── review_python.json
    ├── optimize_typescript.json
    └── plan_feature.json
```

**Formato golden prompt**:
```json
{
  "name": "review_python",
  "command": "/review tests/fixtures/sample.py",
  "expected_prompt": "Eres un ingeniero senior...",
  "expected_output_pattern": "### Problemas Encontrados",
  "agent_mock_response": "### Problemas Encontrados\n1. ..."
}
```

**Test runner**:
```python
import pytest
from my_cli.core.slash_parser import parse_slash_command
from my_cli.core.command_loader import load_command

def test_golden_prompt_review_python():
    golden = load_golden("review_python.json")
    
    # Parsear comando
    cmd = parse_slash_command(golden["command"])
    
    # Construir prompt
    prompt = build_prompt(cmd)
    
    # Validar que prompt contiene elementos esperados
    assert golden["expected_prompt"] in prompt
    assert "sample.py" in prompt
```

#### 2. Unit Tests

```python
def test_command_loader():
    cmd = load_command("review")
    assert cmd["name"] == "review"
    assert "{{target_content}}" in cmd["prompt"]["template"]

def test_variable_substitution():
    template = "Revisa {{target_path}}"
    result = substitute_variables(template, {"target_path": "src/main.py"})
    assert result == "Revisa src/main.py"

def test_security_jail():
    jail = SecurityJail("/home/user/project")
    assert jail.is_path_allowed("/home/user/project/src/main.py")
    assert not jail.is_path_allowed("/etc/passwd")
```

### Observabilidad Local

#### Logging Estructurado (JSONL)

Archivo: `~/.cache/agent/logs.jsonl`

```json
{"timestamp":"2025-11-03T10:15:30Z","level":"INFO","session_id":"sess-abc123","event":"session_start","user":"felipe","project":"/Users/felipe/myproject"}
{"timestamp":"2025-11-03T10:15:35Z","level":"INFO","session_id":"sess-abc123","request_id":"req-001","event":"command_executed","command":"/review","args":["src/main.py"]}
{"timestamp":"2025-11-03T10:15:36Z","level":"DEBUG","session_id":"sess-abc123","request_id":"req-001","event":"ipc_request_sent","method":"agent/invoke","tokens_in":245}
{"timestamp":"2025-11-03T10:15:42Z","level":"DEBUG","session_id":"sess-abc123","request_id":"req-001","event":"ipc_response_received","latency_ms":6000,"tokens_out":512,"status":"success"}
{"timestamp":"2025-11-03T10:15:42Z","level":"INFO","session_id":"sess-abc123","request_id":"req-001","event":"command_completed","duration_ms":7000}
```

#### Logger Python

```python
import json
import uuid
from datetime import datetime
from pathlib import Path

class StructuredLogger:
    def __init__(self, log_file: str = "~/.cache/agent/logs.jsonl"):
        self.log_file = Path(log_file).expanduser()
        self.log_file.parent.mkdir(parents=True, exist_ok=True)
        self.session_id = str(uuid.uuid4())[:8]
    
    def log(self, level: str, event: str, **kwargs):
        entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": level,
            "session_id": self.session_id,
            "event": event,
            **kwargs
        }
        
        with open(self.log_file, "a") as f:
            f.write(json.dumps(entry) + "\n")
    
    def info(self, event: str, **kwargs):
        self.log("INFO", event, **kwargs)
    
    def error(self, event: str, **kwargs):
        self.log("ERROR", event, **kwargs)

# Uso
logger = StructuredLogger()
logger.info("command_executed", command="/review", args=["src/main.py"])
```

#### Consultas con jq

```bash
# Ver últimos 10 eventos
tail -10 ~/.cache/agent/logs.jsonl | jq .

# Filtrar por request_id
cat ~/.cache/agent/logs.jsonl | jq 'select(.request_id == "req-001")'

# Calcular latencia promedio
cat ~/.cache/agent/logs.jsonl | jq -s 'map(select(.latency_ms)) | map(.latency_ms) | add/length'

# Eventos de error
cat ~/.cache/agent/logs.jsonl | jq 'select(.level == "ERROR")'
```

#### Métricas Clave a Registrar

- `latency_total_ms` - Latencia total de respuesta
- `tokens_input` - Tokens de entrada al modelo
- `tokens_output` - Tokens generados
- `status` - success | error | cancelled
- `error_type` - Clasificación de errores
- `command_type` - Tipo de comando ejecutado
- `model_used` - Modelo de IA utilizado

---

## Roadmap de Implementación

### Fase 1: Fundación (Días 1-30)

#### Objetivos
- Solidificar arquitectura
- Contrato IPC
- Formato comandos .toml
- MVP funcional TypeScript

#### Entregables
- [x] Documento de arquitectura finalizado
- [ ] Esquemas JSON para IPC v1.0
- [ ] CLI TypeScript instalable via npm
- [ ] Comandos: `/help`, `/review <file>`, `/optimize <file>`
- [ ] Comunicación con agente simulado (mock) via stdio
- [ ] Repositorio Git con CI básica (linting, tests unitarios)

#### Tareas Técnicas
```
Week 1-2:
- Configurar proyecto oclif
- Definir esquemas JSON-RPC
- Implementar command-loader.ts
- Crear mock agent para testing

Week 3-4:
- Implementar agent-client.ts (IPC stdio)
- Integrar Ink para spinners/UI
- Crear comandos base: /help, /review
- Tests unitarios + CI (GitHub Actions)
```

---

### Fase 2: Expansión Multi-lenguaje (Días 31-60)

#### Objetivos
- Validar arquitectura de plugins
- MVP Python
- Implementar guardrails de seguridad

#### Entregables
- [ ] CLI Python instalable via pipx
- [ ] UI enriquecida: Rich + Prompt Toolkit
- [ ] Plugin Host en CLI Core (detecta/lanza plugins TS/Python)
- [ ] Modelo de seguridad completo:
  - Confirmaciones interactivas
  - Modo `--dry-run`
  - CWD jail
- [ ] Integración con agente IA local real (memtech)

#### Tareas Técnicas
```
Week 1-2:
- Crear MVP Python con Typer
- Implementar bucle de prompt (Prompt Toolkit)
- Styling con Rich

Week 3-4:
- Plugin Host: detección automática de lenguaje
- Lanzamiento de plugins como subprocesos
- Implementar SecurityJail y confirmaciones
- Integrar memtech como agente backend
```

---

### Fase 3: Refinamiento UX (Días 61-90)

#### Objetivos
- Mejorar experiencia de usuario
- Canales de distribución
- Comandos avanzados

#### Entregables
- [ ] TUI mejorada: paleta de comandos (fuzzy finder)
- [ ] Comandos: `/plan`, `/run-tests`
- [ ] CI/CD: publicación automática npm + PyPI
- [ ] Homebrew formula (instalación macOS/Linux)
- [ ] Documentación:
  - README.md completo
  - Guía de usuario
  - Guía de desarrollo de plugins

#### Tareas Técnicas
```
Week 1-2:
- Fuzzy finder para comandos (fzf integration)
- Implementar /plan (generación de plan sin código)
- Implementar /run-tests (ejecutar test suite)

Week 3:
- GitHub Actions: publish npm + PyPI
- Crear Homebrew formula
- Testing E2E con golden prompts

Week 4:
- Documentación completa
- Screencasts/demos
- Blog post de lanzamiento
```

---

## Matriz de Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|-----------|
| **Fragmentación ecosistema agentes locales** | Alta | Medio | Contrato IPC simple, bien documentado (JSON-RPC). Agente de referencia para desarrollo. |
| **Bajo rendimiento en hardware modesto** | Media | Alto | Timeouts configurables. Límites de recursos. Promover modelos cuantizados. |
| **Complejidad dependencias multi-lenguaje** | Media | Medio | Usar `pipx` y `npm -g` para aislar deps. Documentar runtimes requeridos. |
| **Vulnerabilidades seguridad** | Baja | Crítico | Modelo "confianza cero": confirmaciones, whitelists, sandboxing. |
| **Adopción lenta desarrolladores** | Media | Alto | Priorizar DX: instalación fácil (Homebrew), autocompletado robusto, docs claras. |

---

## Referencias y Recursos

### Documentación Oficial

1. **Claude Code** - Anthropic
   - [docs.claude.com - Slash Commands](https://docs.claude.com)

2. **Gemini CLI** - Google Cloud
   - [cloud.google.com/gemini/cli/custom-commands](https://cloud.google.com)

3. **Codex CLI** - OpenAI
   - Rust-based, open source local agent

### Protocolos y Estándares

4. **JSON-RPC 2.0**
   - [jsonrpc.org/specification](https://www.jsonrpc.org/specification)

5. **Language Server Protocol (LSP)**
   - Patrón de referencia para IPC stdio
   - [microsoft.github.io/language-server-protocol](https://microsoft.github.io/language-server-protocol)

6. **Model Context Protocol (MCP)** - Anthropic
   - [modelcontextprotocol.io](https://modelcontextprotocol.io)

### Frameworks y Librerías

#### TypeScript/Node.js
7. **oclif** - [oclif.io](https://oclif.io)
8. **Ink** - [github.com/vadimdemedes/ink](https://github.com/vadimdemedes/ink)
9. **Commander.js** - [npmjs.com/package/commander](https://www.npmjs.com/package/commander)

#### Python
10. **Typer** - [typer.tiangolo.com](https://typer.tiangolo.com)
11. **Rich** - [rich.readthedocs.io](https://rich.readthedocs.io)
12. **Prompt Toolkit** - [python-prompt-toolkit.readthedocs.io](https://python-prompt-toolkit.readthedocs.io)
13. **Click** - Base de Typer

#### Go
14. **Cobra** - [github.com/spf13/cobra](https://github.com/spf13/cobra)
15. **Viper** - [github.com/spf13/viper](https://github.com/spf13/viper)
16. **Bubble Tea** - [github.com/charmbracelet/bubbletea](https://github.com/charmbracelet/bubbletea)

#### Rust
17. **clap** - [docs.rs/clap](https://docs.rs/clap)
18. **ratatui** - [ratatui.rs](https://ratatui.rs)

### Mejores Prácticas

19. **gRPC vs HTTP APIs** - Microsoft
20. **Plugin Systems in Rust** - Arroyo Systems
21. **CLI Authentication Best Practices** - WorkOS
22. **Structured Logging in Go** - Better Stack
23. **Structured Logging in Python** - New Relic

---

## Apéndices

### A. Ejemplo Completo de Comando TOML

```toml
# .agent/commands/deploy.toml

name = "deploy"
description = "Despliega la aplicación al entorno especificado"
version = "1.0.0"

# Argumentos
args = [
  { 
    name = "environment", 
    description = "Entorno destino (dev, staging, prod)", 
    required = true,
    choices = ["dev", "staging", "prod"]
  },
  {
    name = "tag",
    description = "Tag de versión a desplegar",
    required = false,
    default = "latest"
  }
]

# Flags
flags = [
  { 
    name = "skip-tests", 
    description = "Omitir tests antes de desplegar", 
    type = "boolean",
    default = false
  },
  {
    name = "force",
    description = "Forzar despliegue sin confirmaciones",
    type = "boolean",
    default = false
  }
]

# Pre-conditions (validaciones antes de ejecutar)
[pre_conditions]
git_clean = true  # Requiere working dir limpio
git_branch = ["main", "release/*"]  # Solo desde estas ramas

# Plantilla del prompt
[prompt]
template = """
Eres un ingeniero DevOps experto. Necesito desplegar la aplicación.

**Contexto del Despliegue:**
- Entorno: {{environment}}
- Tag: {{tag}}
- Skip tests: {{skip_tests}}
- Rama actual: {{git_branch}}
- Último commit: {{git_last_commit}}

**Estado del Proyecto:**
{{project_status}}

**Instrucciones:**
1. Verifica que todos los requisitos estén cumplidos
2. Si skip_tests = false, ejecuta test suite completa
3. Genera comandos de despliegue para {{environment}}
4. Incluye rollback plan
5. Proporciona checklist post-despliegue

Formato de respuesta: Markdown con bloques de código bash.
"""

# Post-actions (acciones después del comando)
[post_actions]
# Podría ejecutar scripts, actualizar logs, etc.
notify = true
log_file = ".agent/deploy-history.log"
```

### B. Configuración settings.toml

```toml
# ~/.config/agent/settings.toml

[general]
# Modelo por defecto
default_model = "memtech-local-7b"

# Lenguajes soportados
supported_languages = ["python", "typescript", "java", "go", "rust"]

# Directorio de comandos personales
custom_commands_dir = "~/.config/agent/commands"

[security]
# Comandos shell seguros (sin confirmación)
safe_commands = [
  "ls", "cat", "grep", "find", "git status", "git log", "git diff"
]

# Activar modo jail (restricción a project root)
enable_cwd_jail = true

# Permitir acceso a directorios fuera del proyecto
allow_external_paths = false

# Requiere confirmación para modificaciones de archivos
require_file_confirmation = true

[ipc]
# Protocolo de comunicación
protocol = "json-rpc-stdio"

# Timeout para respuestas del agente (ms)
timeout_ms = 30000

# Habilitar streaming de respuestas
enable_streaming = true

[logging]
# Nivel de logging (DEBUG, INFO, WARN, ERROR)
level = "INFO"

# Archivo de logs
log_file = "~/.cache/agent/logs.jsonl"

# Formato de logs
format = "jsonl"

# Rotación de logs
max_size_mb = 50
max_files = 10

[ui]
# Tema de colores
theme = "monokai"

# Habilitar emojis
use_emojis = true

# Ancho máximo de terminal
max_width = 120

# Mostrar tokens usados
show_token_usage = true

[performance]
# Límite de contexto (tokens)
max_context_tokens = 8000

# Límite de respuesta (tokens)
max_response_tokens = 4096

# Habilitar cache de comandos
enable_command_cache = true
```

### C. Ejemplo de Plugin (Python)

```python
# ~/.config/agent/plugins/python_plugin.py
"""
Language Plugin para proyectos Python.
Se comunica via JSON-RPC stdio con CLI Core.
"""

import sys
import json
import os
from pathlib import Path
from typing import Dict, Any

class PythonPlugin:
    def __init__(self):
        self.project_root = Path.cwd()
    
    def read_file(self, path: str) -> str:
        """Lee contenido de archivo Python."""
        full_path = self.project_root / path
        with open(full_path, 'r') as f:
            return f.read()
    
    def detect_language(self, path: str) -> str:
        """Detecta lenguaje del archivo."""
        ext = Path(path).suffix
        return "python" if ext == ".py" else "unknown"
    
    def get_project_context(self) -> Dict[str, Any]:
        """Recopila contexto del proyecto Python."""
        context = {
            "project_root": str(self.project_root),
            "has_venv": (self.project_root / "venv").exists(),
            "has_requirements": (self.project_root / "requirements.txt").exists(),
            "has_pyproject": (self.project_root / "pyproject.toml").exists()
        }
        
        # Leer requirements si existe
        if context["has_requirements"]:
            with open(self.project_root / "requirements.txt") as f:
                context["dependencies"] = f.read().splitlines()
        
        return context
    
    def handle_request(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Procesa request JSON-RPC."""
        method = request.get("method")
        params = request.get("params", {})
        
        if method == "read_file":
            content = self.read_file(params["path"])
            return {"content": content}
        
        elif method == "get_context":
            context = self.get_project_context()
            return context
        
        elif method == "detect_language":
            lang = self.detect_language(params["path"])
            return {"language": lang}
        
        else:
            raise Exception(f"Unknown method: {method}")
    
    def run(self):
        """Loop principal: lee stdin, procesa, escribe stdout."""
        for line in sys.stdin:
            try:
                request = json.loads(line.strip())
                
                # Procesar request
                result = self.handle_request(request)
                
                # Enviar response
                response = {
                    "jsonrpc": "2.0",
                    "id": request.get("id"),
                    "result": result
                }
                
                sys.stdout.write(json.dumps(response) + "\n")
                sys.stdout.flush()
                
            except Exception as e:
                # Enviar error
                error_response = {
                    "jsonrpc": "2.0",
                    "id": request.get("id"),
                    "error": {
                        "code": -32603,
                        "message": str(e)
                    }
                }
                sys.stdout.write(json.dumps(error_response) + "\n")
                sys.stdout.flush()

if __name__ == "__main__":
    plugin = PythonPlugin()
    plugin.run()
```

---

## Glosario

- **CLI**: Command Line Interface - Interfaz de línea de comandos
- **TUI**: Text User Interface - Interfaz de usuario en texto
- **IPC**: Inter-Process Communication - Comunicación entre procesos
- **JSON-RPC**: Remote Procedure Call usando JSON como formato
- **stdio**: Standard Input/Output - Entrada/salida estándar de procesos
- **LSP**: Language Server Protocol - Protocolo para herramientas de lenguaje
- **MCP**: Model Context Protocol - Protocolo de Anthropic para contexto de modelos
- **MVP**: Minimum Viable Product - Producto mínimo viable
- **DX**: Developer Experience - Experiencia del desarrollador
- **CWD**: Current Working Directory - Directorio de trabajo actual
- **Slash Command**: Comando que comienza con `/` para ejecutar acciones predefinidas
- **Golden Prompt**: Prompt de referencia usado para testing E2E
- **TOML**: Tom's Obvious, Minimal Language - Formato de configuración
- **JSONL**: JSON Lines - Formato de una línea JSON por registro

---

**Fin del Documento**

*Este documento es un recurso vivo y debe actualizarse conforme evoluciona la implementación.*
