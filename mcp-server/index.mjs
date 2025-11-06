#!/usr/bin/env node
/**
 * Skills Fabric MCP Server
 *
 * Servidor MCP (Model Context Protocol) para integración local con Skills Fabric.
 * Integra filesystem, git, pm2, metrics y MemTech.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { WebSocketServerTransport } from '@modelcontextprotocol/sdk/websocket.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Importar adapters existentes
import {
  fsAdapter,
  gitAdapter,
  pm2Adapter,
  metricsAdapter,
  testConnection,
  testAllConnections,
  validateConfig
} from '../packages/mcp-adapters/dist/index.js';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuración del servidor
const SERVER_NAME = 'skills-fabric-mcp';
const SERVER_VERSION = '1.0.0';

// Herramientas MCP disponibles
const TOOLS = [
  // Filesystem
  {
    name: 'fs_read_file',
    description: 'Lee un archivo del sistema de archivos',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Ruta del archivo a leer' }
      },
      required: ['path']
    }
  },
  {
    name: 'fs_write_file',
    description: 'Escribe contenido a un archivo',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Ruta del archivo' },
        content: { type: 'string', description: 'Contenido a escribir' }
      },
      required: ['path', 'content']
    }
  },
  {
    name: 'fs_list_directory',
    description: 'Lista archivos de un directorio',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Ruta del directorio' },
        recursive: { type: 'boolean', description: 'Listado recursivo', default: false }
      },
      required: ['path']
    }
  },
  {
    name: 'fs_file_exists',
    description: 'Verifica si un archivo existe',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Ruta del archivo' }
      },
      required: ['path']
    }
  },
  {
    name: 'fs_create_directory',
    description: 'Crea un directorio',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Ruta del directorio' },
        recursive: { type: 'boolean', description: 'Creación recursiva', default: true }
      },
      required: ['path']
    }
  },
  {
    name: 'fs_delete_file',
    description: 'Elimina un archivo',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Ruta del archivo' }
      },
      required: ['path']
    }
  },

  // Git
  {
    name: 'git_status',
    description: 'Obtiene el estado del repositorio Git',
    inputSchema: {
      type: 'object',
      properties: {
        repoPath: { type: 'string', description: 'Ruta del repositorio (opcional)' }
      }
    }
  },
  {
    name: 'git_diff',
    description: 'Muestra las diferencias de Git',
    inputSchema: {
      type: 'object',
      properties: {
        repoPath: { type: 'string', description: 'Ruta del repositorio (opcional)' },
        staged: { type: 'boolean', description: 'Solo cambios staged', default: false }
      }
    }
  },
  {
    name: 'git_commit',
    description: 'Crea un commit de Git',
    inputSchema: {
      type: 'object',
      properties: {
        message: { type: 'string', description: 'Mensaje del commit' },
        repoPath: { type: 'string', description: 'Ruta del repositorio (opcional)' },
        files: { type: 'array', description: 'Archivos específicos a commitear' }
      },
      required: ['message']
    }
  },
  {
    name: 'git_log',
    description: 'Muestra el historial de commits',
    inputSchema: {
      type: 'object',
      properties: {
        repoPath: { type: 'string', description: 'Ruta del repositorio (opcional)' },
        limit: { type: 'number', description: 'Límite de commits', default: 10 }
      }
    }
  },

  // PM2
  {
    name: 'pm2_list',
    description: 'Lista procesos PM2 activos',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'pm2_start',
    description: 'Inicia un proceso PM2',
    inputSchema: {
      type: 'object',
      properties: {
        configPath: { type: 'string', description: 'Ruta del archivo de configuración' },
        name: { type: 'string', description: 'Nombre del proceso' }
      }
    }
  },
  {
    name: 'pm2_stop',
    description: 'Detiene un proceso PM2',
    inputSchema: {
      type: 'object',
      properties: {
        nameOrId: { type: 'string', description: 'Nombre o ID del proceso' }
      },
      required: ['nameOrId']
    }
  },
  {
    name: 'pm2_restart',
    description: 'Reinicia un proceso PM2',
    inputSchema: {
      type: 'object',
      properties: {
        nameOrId: { type: 'string', description: 'Nombre o ID del proceso' }
      },
      required: ['nameOrId']
    }
  },
  {
    name: 'pm2_logs',
    description: 'Obtiene logs de PM2',
    inputSchema: {
      type: 'object',
      properties: {
        nameOrId: { type: 'string', description: 'Nombre o ID del proceso' },
        lines: { type: 'number', description: 'Número de líneas', default: 50 }
      },
      required: ['nameOrId']
    }
  },

  // Metrics
  {
    name: 'metrics_emit_event',
    description: 'Emite un evento de métricas',
    inputSchema: {
      type: 'object',
      properties: {
        event: {
          type: 'object',
          description: 'Evento a emitir',
          additionalProperties: true
        }
      },
      required: ['event']
    }
  },
  {
    name: 'metrics_get_events',
    description: 'Obtiene eventos de métricas',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Límite de eventos', default: 50 }
      }
    }
  },
  {
    name: 'metrics_get_summary',
    description: 'Obtiene resumen de métricas',
    inputSchema: {
      type: 'object',
      properties: {
        timeRange: { type: 'string', description: 'Rango de tiempo (1h, 24h, 7d)' }
      }
    }
  },

  // Health Check
  {
    name: 'health_check',
    description: 'Verifica el estado de conexión de todos los servicios',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'test_connections',
    description: 'Prueba todas las conexiones de base de datos',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'validate_config',
    description: 'Valida la configuración de entorno',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }
];

// Manejador de herramientas
async function handleToolCall(name, args) {
  try {
    switch (name) {
      // Filesystem operations
      case 'fs_read_file':
        return await fsAdapter.readFile(args.path);

      case 'fs_write_file':
        return await fsAdapter.writeFile(args.path, args.content);

      case 'fs_list_directory':
        return await fsAdapter.listDir(args.path, args.recursive);

      case 'fs_file_exists':
        return await fsAdapter.fileExists(args.path);

      case 'fs_create_directory':
        return await fsAdapter.createDir(args.path, args.recursive);

      case 'fs_delete_file':
        return await fsAdapter.deleteFile(args.path);

      // Git operations
      case 'git_status':
        return await gitAdapter.status(args.repoPath);

      case 'git_diff':
        return await gitAdapter.diff(args.repoPath, args.staged);

      case 'git_commit':
        return await gitAdapter.commit(args.message, args.repoPath, args.files);

      case 'git_log':
        return await gitAdapter.log(args.repoPath, args.limit);

      // PM2 operations
      case 'pm2_list':
        return await pm2Adapter.list();

      case 'pm2_start':
        return await pm2Adapter.start(args.configPath || args.name);

      case 'pm2_stop':
        return await pm2Adapter.stop(args.nameOrId);

      case 'pm2_restart':
        return await pm2Adapter.restart(args.nameOrId);

      case 'pm2_logs':
        return await pm2Adapter.logs(args.nameOrId, args.lines);

      // Metrics operations
      case 'metrics_emit_event':
        return await metricsAdapter.emitEvent(args.event);

      case 'metrics_get_events':
        return await metricsAdapter.getEvents(args.limit);

      case 'metrics_get_summary':
        return await metricsAdapter.getMetrics(args.timeRange);

      // Health checks
      case 'health_check':
        return await testConnection();

      case 'test_connections':
        return await testAllConnections();

      case 'validate_config':
        return validateConfig();

      default:
        throw new Error(`Herramienta desconocida: ${name}`);
    }
  } catch (error) {
    return {
      error: error.message,
      stack: error.stack
    };
  }
}

// Crear servidor MCP
const server = new Server(
  SERVER_NAME,
  SERVER_VERSION
);

// Registrar herramientas
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS
}));

// Manejar llamadas de herramientas
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const result = await handleToolCall(name, args);
  return {
    content: [
      {
        type: 'text',
        text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
      }
    ]
  };
});

// Recursos (opcional para futuro)
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: []
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  throw new Error('Recursos no implementados');
});

// Función principal
async function main() {
  const transportType = process.env.MCP_TRANSPORT || 'stdio';

  console.error(`[MCP Server] Iniciando servidor ${SERVER_NAME} v${SERVER_VERSION}`);
  console.error(`[MCP Server] Transport: ${transportType}`);

  // Validar configuración
  const configValidation = validateConfig();
  if (!configValidation.valid) {
    console.error('[MCP Server] ⚠️  Configuración inválida:', configValidation.errors);
  } else {
    console.error('[MCP Server] ✅ Configuración válida');
  }

  if (transportType === 'stdio') {
    // STDIO transport para Claude Code
    const transport = new StdioServerTransport({
      stdin: process.stdin,
      stdout: process.stdout
    });

    await server.connect(transport);
    console.error('[MCP Server] ✅ Conectado via STDIO');
  } else if (transportType === 'websocket') {
    // WebSocket transport para Claude Desktop
    const port = parseInt(process.env.MCP_WEBSOCKET_PORT || '3001');
    const transport = new WebSocketServerTransport({ port });

    await server.connect(transport);
    console.error(`[MCP Server] ✅ Conectado via WebSocket en puerto ${port}`);
  } else {
    throw new Error(`Transport desconocido: ${transportType}`);
  }
}

// Ejecutar servidor
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('[MCP Server] Error:', error);
    process.exit(1);
  });
}

export { server };
