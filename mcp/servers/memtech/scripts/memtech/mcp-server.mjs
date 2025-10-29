#!/usr/bin/env node

/**
 * MemTech MCP Server
 * 
 * Servidor principal del Model Context Protocol para MemTech
 * Proporciona herramientas y recursos para gestión de memoria,
 * checkpoints, snapshots, consultas VM, Grafana y diagnóstico del sistema.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
// import { fileURLToPath } from 'url'; // Reservado para uso futuro
import winston from 'winston';
import process from 'process';
import crypto from 'crypto';
import path from 'path';

// Importar módulos de MemTech
import MemoryManager from './memory.js';
import SecurityManager from './security.js';
import CheckpointManager from './checkpoints.js';
import VictoriaMetricsManager from './vm.js';
import GrafanaManager from './grafana.js';
import SystemManager from './system.js';
import SecretsManager from './secrets.js';
import BackupManager from './backup.js';
import MaintenanceManager from './maintenance.js';
import { heartbeatAll } from './memory-integrations.js';

// Configuración de entorno
dotenv.config();

// const __filename = fileURLToPath(import.meta.url); // Reservado para uso futuro
// const __dirname = dirname(__filename); // Reservado para uso futuro

// Configuración del logger
const logger = winston.createLogger({
  level: process?.env?.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

class MemTechMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'memtech-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Inicializar managers
    this.memoryManager = new MemoryManager({
      storage_path: process.env.MEMTECH_STORAGE_PATH || '.memtech/memory',
      max_items: parseInt(process.env.MEMTECH_MAX_ITEMS) || 10000
    });

    this.securityManager = new SecurityManager({
      allowlist_path: process.env.MEMTECH_ALLOWLIST_PATH || '.memtech/allowlist.json',
      max_file_size_mb: parseInt(process.env.MEMTECH_MAX_FILE_SIZE_MB) || 100,
      strict_mode: process.env.MEMTECH_STRICT_MODE !== 'false'
    });

    this.checkpointManager = new CheckpointManager({
      storage_path: process.env.CHECKPOINT_STORAGE_PATH || '.checkpoints',
      max_checkpoints: parseInt(process.env.CHECKPOINT_MAX_COUNT) || 50,
      compression_enabled: process.env.CHECKPOINT_COMPRESSION !== 'false'
    });

    // Inicializar Secrets Manager
    this.secretsManager = new SecretsManager({
      cache_ttl_seconds: parseInt(process.env.SECRET_CACHE_TTL) || 300,
      validation_enabled: process.env.SECRET_VALIDATION_ENABLED !== 'false',
      cache_enabled: process.env.SECRET_RESOLVER_ENABLED !== 'false'
    });

    // Resolver secretos de forma segura (sin await en constructor)
    const vmToken = this.secretsManager.resolveSecret(process.env.VICTORIA_METRICS_TOKEN);
    const grafanaToken = this.secretsManager.resolveSecret(process.env.GRAFANA_API_KEY);

    this.vmManager = new VictoriaMetricsManager({
      vm_url: process.env.VICTORIA_METRICS_URL || 'http://localhost:8428',
      auth_token: vmToken,
      timeout_ms: parseInt(process.env.VM_TIMEOUT_MS) || 30000
    });

    this.grafanaManager = new GrafanaManager({
      grafana_url: process.env.GRAFANA_URL || 'http://localhost:3000',
      api_key: grafanaToken,
      username: process.env.GRAFANA_USERNAME || 'admin',
      password: process.env.GRAFANA_PASSWORD || 'admin'
    });

    this.systemManager = new SystemManager({
      scan_timeout_ms: parseInt(process.env.SYS_SCAN_TIMEOUT_MS) || 3000,
      max_concurrent_scans: parseInt(process.env.SYS_MAX_CONCURRENT_SCANS) || 50
    });

    this.backupManager = new BackupManager({
      project_root: process.env.PROJECT_ROOT || '/Users/felipe/Developer/startkit-main',
      backup_root: process.env.BACKUP_ROOT || '/Users/felipe/Developer/backups',
      scripts_dir: path.join(process.env.PROJECT_ROOT || '/Users/felipe/Developer/startkit-main', 'packages/memtech-mcp/scripts/backup'),
      timeout_ms: parseInt(process.env.BACKUP_TIMEOUT_MS) || 300000
    });

    this.maintenanceManager = new MaintenanceManager({
      project_root: process.env.PROJECT_ROOT || '/Users/felipe/Developer/startkit-main',
      scripts_dir: path.join(process.env.PROJECT_ROOT || '/Users/felipe/Developer/startkit-main', 'packages/memtech-mcp/scripts/indexers')
    });

    this.setupToolHandlers();
    this.setupErrorHandling();
    
    logger.info('MemTech MCP Server initialized');
  }

  async initialize() {
    // Inicializar componentes asíncronos
    await this.secretsManager.initialize();
    await this.memoryManager.initialize();
    await this.securityManager.initialize();
    await this.checkpointManager.initialize();
    await this.systemManager.initialize();
    await this.backupManager.initialize();
    
    logger.info('MemTech MCP Server async components initialized');
  }

  setupErrorHandling() {
    this.server.onerror = (error) => {
      logger.error('MCP Server Error:', error);
    };

    process?.on('SIGINT', async () => {
      logger.info('Shutting down MemTech MCP Server...');
      await this.server.close();
      process?.exit(0);
    });
  }

  setupToolHandlers() {
    // Listar herramientas disponibles
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          // Funciones de memoria (mem.*)
          {
            name: 'mem.resolve',
            description: 'Resuelve una URI de memoria o ejecuta una consulta de búsqueda',
            inputSchema: {
              type: 'object',
              properties: {
                uri_or_query: {
                  type: 'string',
                  description: 'URI de memoria (mem://id) o consulta de búsqueda'
                }
              },
              required: ['uri_or_query']
            }
          },
          {
            name: 'mem.search',
            description: 'Busca elementos de memoria por etiquetas',
            inputSchema: {
              type: 'object',
              properties: {
                tags: {
                  oneOf: [
                    { type: 'string' },
                    { type: 'array', items: { type: 'string' } }
                  ],
                  description: 'Etiqueta o array de etiquetas para buscar'
                }
              },
              required: ['tags']
            }
          },
          {
            name: 'mem.addItem',
            description: 'Agrega un nuevo elemento a la memoria',
            inputSchema: {
              type: 'object',
              properties: {
                title: {
                  type: 'string',
                  description: 'Título del elemento de memoria'
                },
                description: {
                  type: 'string',
                  description: 'Descripción del elemento'
                },
                content: {
                  type: 'string',
                  description: 'Contenido del elemento'
                },
                tags: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Etiquetas para categorizar el elemento'
                }
              },
              required: ['title']
            }
          },
          {
            name: 'mem.getContext',
            description: 'Obtiene un context pack específico (mem://context/active)',
            inputSchema: {
              type: 'object',
              properties: {
                context: {
                  type: 'string',
                  description: 'Nombre del contexto (por defecto: active)'
                }
              }
            }
          },
          {
            name: 'mem.goldenQuery',
            description: 'Ejecuta una golden query predefinida',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  enum: ['system_metrics', 'security_audit', 'backup_status', 'error_logs', 'performance_analysis'],
                  description: 'Nombre de la golden query predefinida'
                }
              },
              required: ['query']
            }
          },
          
          // Función de seguridad (writeBarrier)
          {
            name: 'mem.writeBarrier',
            description: 'Escribe contenido en un archivo con validación de seguridad',
            inputSchema: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: 'Ruta del archivo a escribir'
                },
                content: {
                  type: 'string',
                  description: 'Contenido a escribir'
                },
                ifMatch: {
                  type: 'string',
                  description: 'Hash SHA256 esperado del contenido actual (opcional)'
                }
              },
              required: ['path', 'content']
            }
          },
          
          // Funciones de checkpoints (mem.checkpoint)
          {
            name: 'mem.checkpoint',
            description: 'Crea un checkpoint o realiza operaciones de checkpoint',
            inputSchema: {
              type: 'object',
              properties: {
                action: {
                  type: 'string',
                  enum: ['create', 'list', 'restore', 'delete', 'stats'],
                  description: 'Acción a realizar'
                },
                name: {
                  type: 'string',
                  description: 'Nombre del checkpoint (para create)'
                },
                description: {
                  type: 'string',
                  description: 'Descripción del checkpoint (para create)'
                },
                tags: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Etiquetas del checkpoint (para create)'
                },
                checkpoint_id: {
                  type: 'string',
                  description: 'ID del checkpoint (para restore/delete)'
                },
                force: {
                  type: 'boolean',
                  description: 'Forzar restauración (para restore)'
                },
                filter: {
                  type: 'string',
                  description: 'Filtro para listar checkpoints (para list)'
                },
                limit: {
                  type: 'number',
                  description: 'Límite de resultados (para list)'
                }
              },
              required: ['action']
            }
          },
          
          // Funciones de consultas VM (vm.query)
          {
            name: 'vm.query',
            description: 'Ejecuta consultas PromQL en VictoriaMetrics',
            inputSchema: {
              type: 'object',
              properties: {
                promql: {
                  type: 'string',
                  description: 'Consulta PromQL a ejecutar'
                },
                time: {
                  type: 'number',
                  description: 'Timestamp Unix para la consulta (opcional, por defecto ahora)'
                }
              },
              required: ['promql']
            }
          },
          
          // Funciones de Grafana (grafana.*)
          {
            name: 'grafana.listDash',
            description: 'Lista dashboards de Grafana',
            inputSchema: {
              type: 'object',
              properties: {
                folder_id: {
                  type: 'number',
                  description: 'ID del folder para filtrar (opcional)'
                },
                query: {
                  type: 'string',
                  description: 'Consulta para filtrar dashboards (opcional)'
                }
              }
            }
          },
          {
            name: 'grafana.smoke',
            description: 'Ejecuta pruebas de smoke a un dashboard de Grafana',
            inputSchema: {
              type: 'object',
              properties: {
                uid_or_title: {
                  type: 'string',
                  description: 'UID o título del dashboard a probar'
                }
              },
              required: ['uid_or_title']
            }
          },
          
          // Funciones de sistema (sys.*)
          {
            name: 'sys.ports.scan',
            description: 'Escanea puertos en un host',
            inputSchema: {
              type: 'object',
              properties: {
                host: {
                  type: 'string',
                  description: 'Host a escanear (por defecto: localhost)'
                },
                ports: {
                  oneOf: [
                    { type: 'array', items: { type: 'number' } },
                    { type: 'string' }
                  ],
                  description: 'Array de puertos o "common" para puertos comunes'
                },
                timeout_ms: {
                  type: 'number',
                  description: 'Timeout en milisegundos (por defecto: 3000)'
                },
                max_concurrent: {
                  type: 'number',
                  description: 'Máximo de escaneos concurrentes (por defecto: 50)'
                }
              }
            }
          },
          
          // Funciones de diagnóstico (diag.*)
          {
            name: 'diag.health',
            description: 'Ejecuta diagnóstico de salud del sistema',
            inputSchema: {
              type: 'object',
              properties: {
                checks: {
                  type: 'array',
                  items: { 
                    type: 'string',
                    enum: ['system_info', 'disk_space', 'memory_usage', 'cpu_usage', 'network_connectivity', 'process_health', 'system_load']
                  },
                  description: 'Verificaciones específicas a ejecutar (opcional, por defecto todas)'
                }
              }
            }
          },
          
          // Funciones de backup (mem.backup.*)
          {
            name: 'mem.backup.run',
            description: 'Ejecuta un backup del proyecto',
            inputSchema: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  enum: ['hourly', 'daily', 'weekly', 'monthly'],
                  description: 'Tipo de backup (opcional, se determina automáticamente)'
                },
                dry_run: {
                  type: 'boolean',
                  description: 'Ejecutar en modo simulación (solo prueba)'
                }
              }
            }
          },
          {
            name: 'mem.backup.prune',
            description: 'Elimina snapshots antiguos según política GFS',
            inputSchema: {
              type: 'object',
              properties: {
                dry_run: {
                  type: 'boolean',
                  description: 'Ejecutar en modo simulación (solo prueba)'
                },
                force: {
                  type: 'boolean',
                  description: 'Forzar eliminación sin confirmación'
                }
              }
            }
          },
          {
            name: 'mem.backup.verify',
            description: 'Verifica la integridad de snapshots',
            inputSchema: {
              type: 'object',
              properties: {
                snapshot: {
                  type: 'string',
                  description: 'Nombre específico del snapshot a verificar (opcional)'
                },
                mode: {
                  type: 'string',
                  enum: ['full', 'quick', 'custom'],
                  description: 'Modo de verificación'
                }
              }
            }
          },
          {
            name: 'mem.backup.dedup',
            description: 'Ejecuta deduplicación de contenido',
            inputSchema: {
              type: 'object',
              properties: {
                action: {
                  type: 'string',
                  enum: ['analyze', 'deduplicate', 'optimize', 'verify'],
                  description: 'Acción de deduplicación a realizar'
                },
                snapshot: {
                  type: 'string',
                  description: 'Snapshot específico (opcional)'
                },
                mode: {
                  type: 'string',
                  enum: ['full', 'incremental'],
                  description: 'Modo de deduplicación'
                }
              }
            }
          },
          {
            name: 'mem.backup.sync',
            description: 'Sincroniza snapshots con almacenamiento en la nube',
            inputSchema: {
              type: 'object',
              properties: {
                action: {
                  type: 'string',
                  enum: ['sync', 'upload', 'download', 'verify'],
                  description: 'Acción de sincronización'
                },
                direction: {
                  type: 'string',
                  enum: ['up', 'down', 'both'],
                  description: 'Dirección de sincronización'
                },
                snapshot: {
                  type: 'string',
                  description: 'Snapshot específico (opcional)'
                }
              }
            }
          },
          {
            name: 'mem.backup.list',
            description: 'Lista todos los snapshots disponibles',
            inputSchema: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  enum: ['hourly', 'daily', 'weekly', 'monthly'],
                  description: 'Filtrar por tipo de snapshot'
                },
                limit: {
                  type: 'number',
                  description: 'Limitar número de resultados'
                }
              }
            }
          },
          {
            name: 'mem.backup.status',
            description: 'Obtiene el estado actual del sistema de backup',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          {
            name: 'mem.memoryHeartbeat',
            description: 'Genera lecturas/escrituras en Redis, PostgreSQL y Qdrant para mantener consumo activo',
            inputSchema: {
              type: 'object',
              properties: {
                targets: {
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: ['redis-cache', 'redis-core', 'postgresql', 'qdrant', 'chroma']
                  },
                  description: 'Selecciona stores específicos (por defecto todos los configurados)'
                }
              }
            }
          },
          
          // Funciones de mantenimiento (mem.*)
          {
            name: 'mem.curate.promoteDemote',
            description: 'Promueve o degrada elementos entre capas de memoria',
            inputSchema: {
              type: 'object',
              properties: {
                operation: {
                  type: 'string',
                  enum: ['promote', 'demote'],
                  description: 'Operación a realizar (promote o demote)'
                },
                item_uri: {
                  type: 'string',
                  description: 'URI del elemento a promover/degradar'
                },
                target_layer: {
                  type: 'string',
                  enum: ['L0', 'L1', 'L2', 'L3'],
                  description: 'Capa de destino (opcional, se determina automáticamente)'
                },
                force: {
                  type: 'boolean',
                  description: 'Forzar operación incluso si la capa está llena'
                }
              },
              required: ['operation', 'item_uri']
            }
          },
          {
            name: 'mem.distill.source',
            description: 'Destila una fuente específica a una capa superior',
            inputSchema: {
              type: 'object',
              properties: {
                source_uri: {
                  type: 'string',
                  description: 'URI de la fuente a destilar'
                },
                target_layer: {
                  type: 'string',
                  enum: ['L0', 'L1'],
                  description: 'Capa de destino (opcional, se determina automáticamente)'
                },
                method: {
                  type: 'string',
                  enum: ['extractive', 'abstractive', 'hybrid'],
                  description: 'Método de destilación (opcional, por defecto hybrid)'
                }
              },
              required: ['source_uri']
            }
          },
          {
            name: 'mem.index.anchors',
            description: 'Extrae anchors de contenido específico',
            inputSchema: {
              type: 'object',
              properties: {
                source_uri: {
                  type: 'string',
                  description: 'URI de la fuente para extraer anchors (opcional)'
                },
                anchor_types: {
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: ['concept_anchor', 'context_anchor', 'reference_anchor', 'gateway_anchor']
                  },
                  description: 'Tipos de anchors a extraer (opcional, todos por defecto)'
                }
              }
            }
          },
          {
            name: 'mem.vectorize.dir',
            description: 'Vectoriza contenido de un directorio específico',
            inputSchema: {
              type: 'object',
              properties: {
                directory: {
                  type: 'string',
                  description: 'Directorio a vectorizar'
                },
                layer: {
                  type: 'string',
                  enum: ['L0', 'L1', 'L2', 'L3'],
                  description: 'Capa específica a vectorizar (opcional)'
                },
                force: {
                  type: 'boolean',
                  description: 'Forzar re-vectorización de elementos ya procesados'
                }
              },
              required: ['directory']
            }
          },
          {
            name: 'mem.prune',
            description: 'Compacta y limpia elementos antiguos o de baja calidad',
            inputSchema: {
              type: 'object',
              properties: {
                dry_run: {
                  type: 'boolean',
                  description: 'Ejecutar en modo simulación (solo análisis)'
                },
                force: {
                  type: 'boolean',
                  description: 'Forzar eliminación sin confirmación'
                },
                layer: {
                  type: 'string',
                  enum: ['L0', 'L1', 'L2', 'L3'],
                  description: 'Capa específica a podar (opcional)'
                },
                older_than_days: {
                  type: 'number',
                  description: 'Edad mínima en días para considerar poda (por defecto 30)'
                }
              }
            }
          },
          {
            name: 'mem.router.warm',
            description: 'Recalienta el router con elementos prioritarios',
            inputSchema: {
              type: 'object',
              properties: {
                max_items: {
                  type: 'number',
                  description: 'Número máximo de items a cargar en caché'
                },
                priority_layers: {
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: ['L0', 'L1', 'L2', 'L3']
                  },
                  description: 'Capas prioritarias para warmup (por defecto L0, L1)'
                },
                force: {
                  type: 'boolean',
                  description: 'Forzar warmup completo'
                }
              }
            }
          },
          {
            name: 'mem.stats.report',
            description: 'Genera reporte de estadísticas de mantenimiento',
            inputSchema: {
              type: 'object',
              properties: {
                include_layer_stats: {
                  type: 'boolean',
                  description: 'Incluir estadísticas de capas (por defecto true)'
                },
                include_performance: {
                  type: 'boolean',
                  description: 'Incluir estadísticas de rendimiento'
                },
                include_health: {
                  type: 'boolean',
                  description: 'Incluir estadísticas de salud (por defecto true)'
                }
              }
            }
          }
        ]
      };
    });

    // Manejar llamadas a herramientas
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          // Funciones de memoria
          case 'mem.resolve':
            return await this.handleMemResolve(args);
          case 'mem.search':
            return await this.handleMemSearch(args);
          case 'mem.addItem':
            return await this.handleMemAddItem(args);
          case 'mem.getContext':
            return await this.handleMemGetContext(args);
          case 'mem.goldenQuery':
            return await this.handleMemGoldenQuery(args);
          
          // Función de seguridad
          case 'mem.writeBarrier':
            return await this.handleWriteBarrier(args);
          
          // Funciones de checkpoints
          case 'mem.checkpoint':
            return await this.handleCheckpoint(args);
          
          // Funciones de VM
          case 'vm.query':
            return await this.handleVmQuery(args);
          
          // Funciones de Grafana
          case 'grafana.listDash':
            return await this.handleGrafanaListDash(args);
          case 'grafana.smoke':
            return await this.handleGrafanaSmoke(args);
          
          // Funciones de sistema
          case 'sys.ports.scan':
            return await this.handleSysPortsScan(args);
          
          // Funciones de diagnóstico
          case 'diag.health':
            return await this.handleDiagHealth(args);
          
          // Funciones de backup
          case 'mem.backup.run':
            return await this.handleBackupRun(args);
          case 'mem.backup.prune':
            return await this.handleBackupPrune(args);
          case 'mem.backup.verify':
            return await this.handleBackupVerify(args);
          case 'mem.backup.dedup':
            return await this.handleBackupDedup(args);
          case 'mem.backup.sync':
            return await this.handleBackupSync(args);
          case 'mem.backup.list':
            return await this.handleBackupList(args);
          case 'mem.backup.status':
            return await this.handleBackupStatus(args);
          
          // Funciones de mantenimiento
          case 'mem.memoryHeartbeat':
            return await this.handleMemoryHeartbeat(args);

          case 'mem.curate.promoteDemote':
            return await this.handlePromoteDemote(args);
          case 'mem.distill.source':
            return await this.handleDistillSource(args);
          case 'mem.index.anchors':
            return await this.handleIndexAnchors(args);
          case 'mem.vectorize.dir':
            return await this.handleVectorizeDir(args);
          case 'mem.prune':
            return await this.handlePrune(args);
          case 'mem.router.warm':
            return await this.handleRouterWarm(args);
          case 'mem.stats.report':
            return await this.handleStatsReport(args);
          
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Herramienta desconocida: ${name}`
            );
        }
      } catch (error) {
        logger.error(`Error executing tool ${name}:`, error);
        throw new McpError(
          ErrorCode.InternalError,
          `Error ejecutando herramienta ${name}: ${error.message}`
        );
      }
    });
  }

  // Handlers de funciones de memoria
  async handleMemResolve(args) {
    const result = await this.memoryManager.resolve(args.uri_or_query);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  async handleMemSearch(args) {
    const result = await this.memoryManager.search(args.tags);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  async handleMemAddItem(args) {
    const result = await this.memoryManager.addItem(args);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  async handleMemGetContext(args) {
    const contextName = args.context || 'active';
    const contextURI = `mem://context/${contextName}`;
    
    try {
      // Buscar items de contexto activo
      const contextItems = await this.memoryManager.search(['context', contextName]);
      
      // Construir respuesta de contexto
      const contextResponse = {
        context: contextName,
        uri: contextURI,
        items: contextItems.results,
        count: contextItems.count,
        retrieved_at: new Date().toISOString(),
        etag: this.generateContextETag(contextItems.results)
      };
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(contextResponse, null, 2)
          }
        ]
      };
    } catch (error) {
      logger.error(`Error getting context ${contextName}:`, error);
      throw new Error(`Failed to get context: ${error.message}`);
    }
  }

  async handleMemGoldenQuery(args) {
    const queryName = args.query;
    
    // Golden queries predefinidas
    const goldenQueries = {
      'system_metrics': {
        description: 'System performance and metrics data',
        tags: ['metrics', 'performance', 'system'],
        query: 'system metrics performance CPU memory disk',
        template: 'system'
      },
      'security_audit': {
        description: 'Security audit reports and findings',
        tags: ['security', 'audit', 'report'],
        query: 'security audit report scan vulnerability',
        template: 'security'
      },
      'backup_status': {
        description: 'Backup and checkpoint status information',
        tags: ['backup', 'checkpoint', 'status', 'recovery'],
        query: 'backup checkpoint status recovery last',
        template: 'backup'
      },
      'error_logs': {
        description: 'Recent error logs and issues',
        tags: ['error', 'log', 'issue', 'problem'],
        query: 'error log issue problem exception',
        template: 'error'
      },
      'performance_analysis': {
        description: 'Performance analysis and optimization',
        tags: ['performance', 'analysis', 'optimization', 'bottleneck'],
        query: 'performance analysis optimization bottleneck slow',
        template: 'performance'
      }
    };
    
    if (!goldenQueries[queryName]) {
      throw new Error(`Golden query not found: ${queryName}`);
    }
    
    const goldenQuery = goldenQueries[queryName];
    
    try {
      // Ejecutar la búsqueda
      const searchResult = await this.memoryManager.resolve(goldenQuery.query);
      
      // Enriquecer resultados con metadata de la golden query
      const enhancedResult = {
        query_name: queryName,
        description: goldenQuery.description,
        template: goldenQuery.template,
        tags: goldenQuery.tags,
        original_query: goldenQuery.query,
        results: searchResult,
        executed_at: new Date().toISOString(),
        etag: this.generateQueryETag(queryName, searchResult.count)
      };
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(enhancedResult, null, 2)
          }
        ]
      };
    } catch (error) {
      logger.error(`Error executing golden query ${queryName}:`, error);
      throw new Error(`Failed to execute golden query: ${error.message}`);
    }
  }

  generateContextETag(items) {
    const content = items.map(item => `${item.id}:${item.metadata.updated_at}`).join('|');
    return crypto.createHash('md5').update(content).digest('hex');
  }

  generateQueryETag(queryName, resultCount) {
    const content = `${queryName}:${resultCount}:${Date.now()}`;
    return crypto.createHash('md5').update(content).digest('hex');
  }

  // Handler de función de seguridad
  async handleWriteBarrier(args) {
    const result = await this.securityManager.writeBarrier(args.path, args.content, args.ifMatch);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  async handleMemoryHeartbeat(args = {}) {
    const targets = Array.isArray(args?.targets) && args.targets.length
      ? args.targets
      : null;

    const targetMap = {
      'redis-cache': 'redisCache',
      'redis-core': 'redisCore',
      'postgresql': 'postgresql',
      'qdrant': 'qdrant',
      'chroma': 'chroma'
    };

    const { results, errors } = await heartbeatAll();
    const filteredResults = {};
    const filteredErrors = {};

    const includeResult = (externalName) => {
      if (!targets) return true;
      return targets.includes(externalName);
    };

    for (const [externalName, internalName] of Object.entries(targetMap)) {
      if (!includeResult(externalName)) {
        continue;
      }
      if (results[internalName]) {
        filteredResults[externalName] = results[internalName];
      }
      if (errors[internalName]) {
        filteredErrors[externalName] = errors[internalName];
      }
    }

    if (targets) {
      for (const target of targets) {
        if (!targetMap[target]) {
          filteredErrors[target] = 'Objetivo no soportado';
        }
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              triggered_at: new Date().toISOString(),
              results: filteredResults,
              errors: filteredErrors
            },
            null,
            2
          )
        }
      ]
    };
  }

  // Handler de funciones de checkpoints
  async handleCheckpoint(args) {
    switch (args.action) {
      case 'create': {
        const createResult = await this.checkpointManager.createCheckpoint(
          args.name,
          args.description,
          args.tags
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(createResult, null, 2)
            }
          ]
        };
      }
      
      case 'list': {
        const listResult = await this.checkpointManager.listCheckpoints(args.filter, args.limit);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(listResult, null, 2)
            }
          ]
        };
      }
      
      case 'restore': {
        const restoreResult = await this.checkpointManager.restoreCheckpoint(args.checkpoint_id, args.force);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(restoreResult, null, 2)
            }
          ]
        };
      }
      
      case 'delete': {
        const deleteResult = await this.checkpointManager.deleteCheckpoint(args.checkpoint_id);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(deleteResult, null, 2)
            }
          ]
        };
      }
      
      case 'stats': {
        const statsResult = await this.checkpointManager.getCheckpointStats();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(statsResult, null, 2)
            }
          ]
        };
      }
      
      default:
        throw new McpError(
          ErrorCode.InvalidParams,
          `Acción de checkpoint desconocida: ${args.action}`
        );
    }
  }

  // Handler de funciones de VM
  async handleVmQuery(args) {
    const result = await this.vmManager.query(args.promql, args.time);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  // Handlers de funciones de Grafana
  async handleGrafanaListDash(args) {
    const result = await this.grafanaManager.listDashboards(args.folder_id, args.query);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  async handleGrafanaSmoke(args) {
    const result = await this.grafanaManager.smoke(args.uid_or_title);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  // Handler de funciones de sistema
  async handleSysPortsScan(args) {
    let ports = args.ports;
    
    // Si se especifica "common", usar puertos comunes
    if (ports === 'common') {
      ports = this.systemManager.config.common_ports;
    }
    
    const result = await this.systemManager.portsScan(
      args.host || 'localhost',
      ports,
      {
        timeout_ms: args.timeout_ms,
        max_concurrent: args.max_concurrent
      }
    );
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  // Handler de funciones de diagnóstico
  async handleDiagHealth(args) {
    const result = await this.systemManager.health();
    
    // Si se especificaron verificaciones específicas, filtrar resultados
    if (args.checks && Array.isArray(args.checks)) {
      const filteredChecks = {};
      for (const check of args.checks) {
        if (result.checks[check]) {
          filteredChecks[check] = result.checks[check];
        }
      }
      
      result.checks = filteredChecks;
      result.summary.total_checks = Object.keys(filteredChecks).length;
    }
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  // Handlers de funciones de backup
  async handleBackupRun(args) {
    const result = await this.backupManager.runBackup({
      type: args.type,
      dryRun: args.dry_run
    });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  async handleBackupPrune(args) {
    const result = await this.backupManager.pruneSnapshots({
      dryRun: args.dry_run,
      force: args.force
    });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  async handleBackupVerify(args) {
    const result = await this.backupManager.verifySnapshot(args.snapshot, {
      mode: args.mode
    });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  async handleBackupDedup(args) {
    const result = await this.backupManager.deduplicateSnapshots({
      action: args.action || 'deduplicate',
      snapshot: args.snapshot,
      mode: args.mode
    });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  async handleBackupSync(args) {
    const result = await this.backupManager.syncSnapshots({
      action: args.action || 'sync',
      direction: args.direction || 'both',
      snapshot: args.snapshot
    });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  async handleBackupList(args) {
    const result = await this.backupManager.listSnapshots({
      type: args.type,
      limit: args.limit
    });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  async handleBackupStatus() {
    const result = await this.backupManager.getBackupStatus();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  // Handlers de funciones de mantenimiento
  async handlePromoteDemote(args) {
    const result = await this.maintenanceManager.promoteDemote(args);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  async handleDistillSource(args) {
    const result = await this.maintenanceManager.distillSource(args);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  async handleIndexAnchors(args) {
    const result = await this.maintenanceManager.indexAnchors(args);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  async handleVectorizeDir(args) {
    const result = await this.maintenanceManager.vectorizeDir(args);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  async handlePrune(args) {
    const result = await this.maintenanceManager.prune(args);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  async handleRouterWarm(args) {
    const result = await this.maintenanceManager.routerWarm(args);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  async handleStatsReport(args = {}) {
    const result = await this.maintenanceManager.statsReport(args);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  async run() {
    // Inicializar componentes asíncronos primero
    await this.initialize();
    
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    logger.info('MemTech MCP Server running on stdio');
  }
}

// Iniciar el servidor
const server = new MemTechMCPServer();
server.run().catch(error => {
  logger.error('Failed to start server:', error);
  process?.exit(1);
});
