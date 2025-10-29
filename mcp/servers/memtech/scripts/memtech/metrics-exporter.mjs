#!/usr/bin/env node
/**
 * MemTech Metrics Exporter
 * 
 * Exportador de métricas para VictoriaMetrics/Grafana
 * - Métricas de memoria por capa
 * - Estado de backups y checkpoints
 * - Duración de mantenimiento
 * - Contadores de errores
 * - Salud del sistema
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

// __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Logger simple y consistente ---
const tag = (t) => `[${t}]`;
const logger = {
  info: (msg, data) => console.log(`${tag('INFO')} ${msg}${data ? ' ' + safeJSON(data) : ''}`),
  warn: (msg, data) => console.warn(`${tag('WARN')} ${msg}${data ? ' ' + safeJSON(data) : ''}`),
  error: (msg, data) => console.error(`${tag('ERROR')} ${msg}${data ? ' ' + safeJSON(data) : ''}`),
  debug: (msg, data) => process.env.DEBUG && console.log(`${tag('DEBUG')} ${msg}${data ? ' ' + safeJSON(data) : ''}`),
};

const safeJSON = (v) => {
  try { return JSON.stringify(v); } catch { return String(v); }
};

// --- Utilidades ---
const ensureDir = async (p) => fs.mkdir(p, { recursive: true });
const exists = async (p) => !!(await fs.stat(p).catch(() => null));

// --- Clase Exportadora de Métricas ---
class MemTechMetricsExporter {
  constructor() {
    this.rootDir = path.resolve(__dirname, '../../../..');
    this.memtechDir = path.resolve(this.rootDir, 'packages/memtech-mcp');
    this.memoryIndexPath = path.resolve(this.memtechDir, '.memtech/memory');
    this.checkpointsDir = path.resolve(this.memtechDir, '.checkpoints');
    this.backupDir = path.resolve(this.rootDir, 'backups');
    this.reportsDir = path.resolve(this.memtechDir, 'reports');
    
    this.metrics = [];
    this.lastUpdate = new Date();
  }

  async initialize() {
    await ensureDir(this.reportsDir);
    logger.info('MemTech Metrics Exporter inicializado', { 
      memtechDir: this.memtechDir,
      memoryIndexPath: this.memoryIndexPath
    });
  }

  // Generar métricas de memoria por capa
  async generateMemoryMetrics() {
    try {
      const layers = ['L0', 'L1', 'L2', 'L3'];
      
      for (const layer of layers) {
        const layerIndexPath = path.join(this.memoryIndexPath, `layer-${layer}-index.json`);
        
        if (await exists(layerIndexPath)) {
          const layerData = JSON.parse(await fs.readFile(layerIndexPath, 'utf8'));
          
          // Métrica de uso de memoria por capa
          this.metrics.push({
            name: 'memtech_memory_usage_bytes',
            type: 'gauge',
            help: 'Memory usage by layer in bytes',
            value: layerData.metadata.totalSize || 0,
            labels: {
              layer,
              description: layerData.metadata.description || '',
              instance: 'memtech-local'
            }
          });
          
          // Métrica de conteo de items por capa
          this.metrics.push({
            name: 'memtech_memory_items_count',
            type: 'gauge',
            help: 'Number of items in memory layer',
            value: layerData.metadata.itemCount || 0,
            labels: {
              layer,
              instance: 'memtech-local'
            }
          });
        }
      }
      
      // Métrica de información de capas
      const masterIndexPath = path.join(this.memoryIndexPath, 'master-index.json');
      if (await exists(masterIndexPath)) {
        const masterData = JSON.parse(await fs.readFile(masterIndexPath, 'utf8'));
        
        for (const layer of masterData.metadata.layers) {
          this.metrics.push({
            name: 'memtech_memory_layer_info',
            type: 'gauge',
            help: 'Memory layer information',
            value: 1,
            labels: {
              layer,
              description: masterData.hierarchy[layer]?.description || '',
              total_items: masterData.hierarchy[layer]?.itemCount || 0,
              instance: 'memtech-local'
            }
          });
        }
      }
      
      // Métricas de tags
      const tagsIndexPath = path.join(this.memoryIndexPath, 'tags-index.json');
      if (await exists(tagsIndexPath)) {
        const tagsData = JSON.parse(await fs.readFile(tagsIndexPath, 'utf8'));
        
        // Contar tags por categoría
        const tagCategories = {};
        for (const tagName of Object.keys(tagsData.tags)) {
          const [category] = tagName.split(':');
          tagCategories[category] = (tagCategories[category] || 0) + 1;
        }
        
        for (const [category, count] of Object.entries(tagCategories)) {
          this.metrics.push({
            name: 'memtech_memory_tags_count',
            type: 'gauge',
            help: 'Number of tags by category',
            value: count,
            labels: {
              category,
              instance: 'memtech-local'
            }
          });
        }
      }
      
    } catch (error) {
      logger.error('Error generando métricas de memoria', { error: error.message });
    }
  }

  // Generar métricas de backups
  async generateBackupMetrics() {
    try {
      // Métricas de tamaño de backups
      const backupTypes = ['hourly', 'daily', 'weekly', 'monthly'];
      
      for (const type of backupTypes) {
        const backupPath = path.join(this.backupDir, type);
        
        if (await exists(backupPath)) {
          const entries = await fs.readdir(backupPath, { withFileTypes: true });
          const backups = entries.filter(e => e.isDirectory());
          
          let totalSize = 0;
          for (const backup of backups) {
            const backupDir = path.join(backupPath, backup.name);
            try {
              const stats = await fs.stat(backupDir);
              totalSize += stats.size;
            } catch (error) {
              // Ignorar errores de estadísticas
            }
          }
          
          this.metrics.push({
            name: 'memtech_backup_size_bytes',
            type: 'gauge',
            help: 'Backup size by type in bytes',
            value: totalSize,
            labels: {
              type,
              status: 'completed',
              instance: 'memtech-local'
            }
          });
          
          this.metrics.push({
            name: 'memtech_backup_count_total',
            type: 'gauge',
            help: 'Total number of backups by type',
            value: backups.length,
            labels: {
              type,
              instance: 'memtech-local'
            }
          });
        }
      }
      
      // Métrica de estado del sistema de backups
      this.metrics.push({
        name: 'memtech_backup_system_status',
        type: 'gauge',
        help: 'Backup system status (1=active, 0=inactive)',
        value: 1,
        labels: {
          instance: 'memtech-local'
        }
      });
      
    } catch (error) {
      logger.error('Error generando métricas de backups', { error: error.message });
    }
  }

  // Generar métricas de checkpoints
  async generateCheckpointMetrics() {
    try {
      if (await exists(this.checkpointsDir)) {
        const entries = await fs.readdir(this.checkpointsDir, { withFileTypes: true });
        const checkpoints = entries.filter(e => e.isDirectory());
        
        // Contar checkpoints por tipo
        const checkpointTypes = {};
        for (const checkpoint of checkpoints) {
          const checkpointPath = path.join(this.checkpointsDir, checkpoint.name);
          
          try {
            const metadataPath = path.join(checkpointPath, 'metadata.json');
            if (await exists(metadataPath)) {
              const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));
              const type = metadata.type || 'unknown';
              checkpointTypes[type] = (checkpointTypes[type] || 0) + 1;
            }
          } catch (error) {
            checkpointTypes.unknown = (checkpointTypes.unknown || 0) + 1;
          }
        }
        
        for (const [type, count] of Object.entries(checkpointTypes)) {
          this.metrics.push({
            name: 'memtech_checkpoint_count_total',
            type: 'gauge',
            help: 'Total number of checkpoints by type',
            value: count,
            labels: {
              type,
              status: 'completed',
              instance: 'memtech-local'
            }
          });
        }
        
        // Información de checkpoints recientes
        const indexJsonPath = path.join(this.checkpointsDir, 'index.json');
        if (await exists(indexJsonPath)) {
          const indexData = JSON.parse(await fs.readFile(indexJsonPath, 'utf8'));
          
          if (indexData.checkpoints && indexData.checkpoints.length > 0) {
            const recentCheckpoints = indexData.checkpoints.slice(-5); // Últimos 5
            
            for (const checkpoint of recentCheckpoints) {
              this.metrics.push({
                name: 'memtech_checkpoint_info',
                type: 'gauge',
                help: 'Checkpoint information',
                value: 1,
                labels: {
                  id: checkpoint.id || 'unknown',
                  type: checkpoint.type || 'unknown',
                  status: checkpoint.status || 'unknown',
                  timestamp: checkpoint.timestamp || new Date().toISOString(),
                  instance: 'memtech-local'
                }
              });
            }
          }
        }
      }
      
    } catch (error) {
      logger.error('Error generando métricas de checkpoints', { error: error.message });
    }
  }

  // Generar métricas de mantenimiento
  async generateMaintenanceMetrics() {
    try {
      // Buscar reportes de mantenimiento recientes
      const entries = await fs.readdir(this.reportsDir, { withFileTypes: true });
      const maintenanceReports = entries
        .filter(e => e.isFile() && e.name.includes('maintenance'))
        .sort((a, b) => b.name.localeCompare(a.name))
        .slice(0, 10); // Últimos 10 reportes
      
      for (const report of maintenanceReports) {
        const reportPath = path.join(this.reportsDir, report.name);
        
        try {
          const reportData = JSON.parse(await fs.readFile(reportPath, 'utf8'));
          
          if (reportData.stats && reportData.stats.actions) {
            for (const action of reportData.stats.actions) {
              this.metrics.push({
                name: 'memtech_maintenance_duration_seconds',
                type: 'gauge',
                help: 'Maintenance action duration in seconds',
                value: (action.duration || 0) / 1000,
                labels: {
                  action: action.action || 'unknown',
                  status: action.status || 'unknown',
                  instance: 'memtech-local'
                }
              });
            }
          }
          
          if (reportData.stats && reportData.stats.errors) {
            for (const error of reportData.stats.errors) {
              this.metrics.push({
                name: 'memtech_errors_total',
                type: 'counter',
                help: 'Total number of errors',
                value: 1,
                labels: {
                  component: error.action || 'unknown',
                  type: 'maintenance',
                  instance: 'memtech-local'
                }
              });
            }
          }
          
        } catch (error) {
          logger.warn('Error leyendo reporte de mantenimiento', { report: report.name, error: error.message });
        }
      }
      
    } catch (error) {
      logger.error('Error generando métricas de mantenimiento', { error: error.message });
    }
  }

  // Generar métricas de salud del sistema
  async generateHealthMetrics() {
    try {
      // Métrica de memoria del sistema
      const freeMemory = await this.getFreeMemory();
      this.metrics.push({
        name: 'memtech_system_memory_free_bytes',
        type: 'gauge',
        help: 'Free system memory in bytes',
        value: freeMemory,
        labels: {
          instance: 'memtech-local'
        }
      });
      
      // Métrica de uso de disco
      const diskUsage = await this.getDiskUsage();
      this.metrics.push({
        name: 'memtech_storage_usage_bytes',
        type: 'gauge',
        help: 'Storage usage in bytes',
        value: diskUsage.used,
        labels: {
          component: 'disk',
          instance: 'memtech-local'
        }
      });
      
      // Métrica de salud de servicios
      const services = await this.checkServices();
      for (const [service, status] of Object.entries(services)) {
        this.metrics.push({
          name: 'memtech_service_status',
          type: 'gauge',
          help: 'Service status (1=up, 0=down)',
          value: status ? 1 : 0,
          labels: {
            service,
            instance: 'memtech-local'
          }
        });
      }
      
      // Métrica general de salud del sistema
      const healthScore = this.calculateHealthScore(freeMemory, diskUsage, services);
      this.metrics.push({
        name: 'memtech_system_health',
        type: 'gauge',
        help: 'Overall system health score (0-100)',
        value: healthScore,
        labels: {
          instance: 'memtech-local'
        }
      });
      
    } catch (error) {
      logger.error('Error generando métricas de salud', { error: error.message });
    }
  }

  async getFreeMemory() {
    try {
      const { execSync } = await import('child_process');
      const output = execSync('vm_stat', { encoding: 'utf8' });
      const freeMatch = output.match(/Pages free:\s*(\d+)/);
      const freePages = freeMatch ? parseInt(freeMatch[1]) : 0;
      return freePages * 4096; // Convertir a bytes
    } catch (error) {
      return 0;
    }
  }

  async getDiskUsage() {
    try {
      const { execSync } = await import('child_process');
      const output = execSync(`df -k "${this.rootDir}"`, { encoding: 'utf8' });
      const lines = output.split('\n');
      const dataLine = lines[1];
      const parts = dataLine.split(/\s+/);
      return {
        total: parseInt(parts[1]) * 1024,
        used: parseInt(parts[2]) * 1024,
        available: parseInt(parts[3]) * 1024
      };
    } catch (error) {
      return { total: 0, used: 0, available: 0 };
    }
  }

  async checkServices() {
    const services = {
      victoriaMetrics: await this.checkPort(8428),
      grafana: await this.checkPort(3001),
      redis: await this.checkPort(6379)
    };
    return services;
  }

  async checkPort(port) {
    try {
      const { execSync } = await import('child_process');
      execSync(`nc -z localhost ${port}`, { timeout: 2000 });
      return true;
    } catch (error) {
      return false;
    }
  }

  calculateHealthScore(freeMemory, diskUsage, services) {
    let score = 100;
    
    // Penalizar por memoria baja (< 100MB)
    if (freeMemory < 100 * 1024 * 1024) {
      score -= 30;
    } else if (freeMemory < 500 * 1024 * 1024) {
      score -= 15;
    }
    
    // Penalizar por uso de disco alto (> 90%)
    const diskUsagePercent = (diskUsage.used / diskUsage.total) * 100;
    if (diskUsagePercent > 95) {
      score -= 30;
    } else if (diskUsagePercent > 90) {
      score -= 15;
    }
    
    // Penalizar por servicios caídos
    const servicesUp = Object.values(services).filter(s => s).length;
    const totalServices = Object.keys(services).length;
    score -= ((totalServices - servicesUp) / totalServices) * 25;
    
    return Math.max(0, score);
  }

  // Formatear métricas en formato Prometheus
  formatMetrics() {
    let output = '';
    
    for (const metric of this.metrics) {
      // Agregar HELP y TYPE
      output += `# HELP ${metric.name} ${metric.help}\n`;
      output += `# TYPE ${metric.type}\n`;
      
      // Agregar labels
      const labels = Object.entries(metric.labels || {})
        .map(([key, value]) => `${key}="${value}"`)
        .join(',');
      
      // Agregar valor
      output += `${metric.name}${labels ? '{' + labels + '}' : ''} ${metric.value}\n`;
    }
    
    return output;
  }

  // Actualizar todas las métricas
  async updateMetrics() {
    this.metrics = [];
    this.lastUpdate = new Date();
    
    await this.generateMemoryMetrics();
    await this.generateBackupMetrics();
    await this.generateCheckpointMetrics();
    await this.generateMaintenanceMetrics();
    await this.generateHealthMetrics();
    
    logger.debug('Métricas actualizadas', { count: this.metrics.length });
  }

  // Iniciar servidor HTTP para métricas
  startServer(port = 9090) {
    const server = http.createServer(async (req, res) => {
      if (req.url === '/metrics') {
        try {
          await this.updateMetrics();
          const metricsOutput = this.formatMetrics();
          
          res.writeHead(200, {
            'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
            'Content-Length': Buffer.byteLength(metricsOutput)
          });
          res.end(metricsOutput);
        } catch (error) {
          logger.error('Error sirviendo métricas', { error: error.message });
          res.writeHead(500);
          res.end('Error generating metrics');
        }
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
    });
    
    server.listen(port, () => {
      logger.info(`Servidor de métricas iniciado en puerto ${port}`);
      logger.info(`Métricas disponibles en http://localhost:${port}/metrics`);
    });
    
    return server;
  }
}

// --- CLI ---
function parseArgs(argv) {
  const args = { 
    port: 9090,
    once: false,
    help: false
  };
  
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--port') args.port = parseInt(argv[++i]);
    else if (a === '--once') args.once = true;
    else if (a === '--help' || a === '-h') args.help = true;
  }
  
  return args;
}

async function main() {
  const args = parseArgs(process.argv);
  
  if (args.help) {
    console.log(`
Uso:
  node scripts/memtech/metrics-exporter.mjs [opciones]

Opciones:
  --port <number>    Puerto para el servidor de métricas (default: 9090)
  --once             Generar métricas una vez y salir
  --help, -h         Muestra esta ayuda

Ejemplos:
  node scripts/memtech/metrics-exporter.mjs --port 9090
  node scripts/memtech/metrics-exporter.mjs --once
`);
    process.exit(0);
  }
  
  const exporter = new MemTechMetricsExporter();
  await exporter.initialize();
  
  if (args.once) {
    await exporter.updateMetrics();
    console.log(exporter.formatMetrics());
  } else {
    const server = exporter.startServer(args.port);
    
    // Actualizar métricas periódicamente
    setInterval(async () => {
      try {
        await exporter.updateMetrics();
      } catch (error) {
        logger.error('Error en actualización periódica de métricas', { error: error.message });
      }
    }, 30000); // Cada 30 segundos
    
    // Manejar cierre graceful
    process.on('SIGINT', () => {
      logger.info('Cerrando servidor de métricas...');
      server.close(() => {
        process.exit(0);
      });
    });
  }
}

if (import.meta.url === `file://${__filename}`) {
  main().catch((e) => {
    logger.error('Fallo fatal en exportador de métricas', { error: String(e) });
    process.exit(2);
  });
}
