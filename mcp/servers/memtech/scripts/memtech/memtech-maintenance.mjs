#!/usr/bin/env node
/**
 * MemTech Maintenance Script
 * 
 * Script de mantenimiento automático para el sistema MemTech
 * - Limpieza de RAM
 * - Compresión de checkpoints
 * - Snapshots de backups
 * - Reindexación de memoria
 * - Verificación de salud del sistema
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

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

// --- Clase de Mantenimiento ---
class MemTechMaintenance {
  constructor() {
    this.rootDir = path.resolve(__dirname, '../../../..');
    this.memtechDir = path.resolve(this.rootDir, 'packages/memtech-mcp');
    this.reportsDir = path.resolve(this.memtechDir, 'reports');
    this.checkpointsDir = path.resolve(this.memtechDir, '.checkpoints');
    this.memoryDir = path.resolve(this.memtechDir, '.memtech');
    this.backupDir = path.resolve(this.rootDir, 'backups');
    
    this.stats = {
      startTime: new Date().toISOString(),
      actions: [],
      errors: [],
      warnings: []
    };
  }

  async initialize() {
    await ensureDir(this.reportsDir);
    logger.info('MemTech Maintenance inicializado', { 
      rootDir: this.rootDir,
      memtechDir: this.memtechDir
    });
  }

  // 1. Limpieza de RAM (macOS)
  async cleanRAM() {
    const action = 'cleanRAM';
    const startTime = Date.now();
    
    try {
      logger.info('Iniciando limpieza de RAM...');
      
      // Liberar memoria en macOS
      try {
        execSync('sudo purge', { timeout: 30000 });
        logger.info('sudo purge ejecutado correctamente');
      } catch (error) {
        logger.warn('No se pudo ejecutar sudo purge (requiere permisos)', { error: error.message });
        this.stats.warnings.push({ action, error: 'sudo purge failed', message: error.message });
      }
      
      // Alternativa sin sudo
      try {
        execSync('vm_stat | grep "Pages free"', { timeout: 5000 });
        logger.info('Estado de memoria verificado');
      } catch (error) {
        logger.warn('No se pudo verificar el estado de memoria', { error: error.message });
      }
      
      const duration = Date.now() - startTime;
      this.stats.actions.push({ action, duration, status: 'completed' });
      logger.info('Limpieza de RAM completada', { duration: `${duration}ms` });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.stats.errors.push({ action, error: error.message, duration });
      logger.error('Error en limpieza de RAM', { error: error.message });
    }
  }

  // 2. Compresión de checkpoints
  async compressCheckpoints() {
    const action = 'compressCheckpoints';
    const startTime = Date.now();
    
    try {
      logger.info('Iniciando compresión de checkpoints...');
      
      if (!(await exists(this.checkpointsDir))) {
        logger.warn('Directorio de checkpoints no existe', { dir: this.checkpointsDir });
        return;
      }
      
      // Buscar checkpoints sin comprimir
      const entries = await fs.readdir(this.checkpointsDir, { withFileTypes: true });
      const checkpoints = entries.filter(e => e.isDirectory());
      
      let compressed = 0;
      for (const checkpoint of checkpoints) {
        const checkpointPath = path.join(this.checkpointsDir, checkpoint.name);
        const compressedPath = `${checkpointPath}.tar.gz`;
        
        if (!(await exists(compressedPath))) {
          try {
            execSync(`tar -czf "${compressedPath}" -C "${this.checkpointsDir}" "${checkpoint.name}"`, { timeout: 60000 });
            compressed++;
            logger.debug('Checkpoint comprimido', { name: checkpoint.name });
          } catch (error) {
            logger.warn('Error comprimiendo checkpoint', { name: checkpoint.name, error: error.message });
            this.stats.warnings.push({ action, checkpoint: checkpoint.name, error: error.message });
          }
        }
      }
      
      const duration = Date.now() - startTime;
      this.stats.actions.push({ action, duration, status: 'completed', compressed });
      logger.info('Compresión de checkpoints completada', { compressed, duration: `${duration}ms` });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.stats.errors.push({ action, error: error.message, duration });
      logger.error('Error en compresión de checkpoints', { error: error.message });
    }
  }

  // 3. Snapshot de backups
  async createBackupSnapshot() {
    const action = 'createBackupSnapshot';
    const startTime = Date.now();
    
    try {
      logger.info('Iniciando snapshot de backup...');
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const snapshotName = `maintenance-${timestamp}`;
      const snapshotDir = path.join(this.backupDir, 'snapshots', snapshotName);
      
      await ensureDir(snapshotDir);
      
      // Copiar archivos críticos
      const criticalFiles = [
        '.checkpoints',
        '.memtech',
        'config',
        'scripts'
      ];
      
      for (const file of criticalFiles) {
        const srcPath = path.join(this.memtechDir, file);
        const dstPath = path.join(snapshotDir, file);
        
        if (await exists(srcPath)) {
          try {
            execSync(`cp -r "${srcPath}" "${dstPath}"`, { timeout: 30000 });
            logger.debug('Archivo crítico copiado', { file });
          } catch (error) {
            logger.warn('Error copiando archivo crítico', { file, error: error.message });
            this.stats.warnings.push({ action, file, error: error.message });
          }
        }
      }
      
      // Crear metadata del snapshot
      const metadata = {
        name: snapshotName,
        timestamp: new Date().toISOString(),
        type: 'maintenance',
        files: criticalFiles,
        stats: this.stats
      };
      
      await fs.writeFile(
        path.join(snapshotDir, 'metadata.json'),
        JSON.stringify(metadata, null, 2)
      );
      
      const duration = Date.now() - startTime;
      this.stats.actions.push({ action, duration, status: 'completed', snapshot: snapshotName });
      logger.info('Snapshot de backup completado', { snapshot: snapshotName, duration: `${duration}ms` });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.stats.errors.push({ action, error: error.message, duration });
      logger.error('Error creando snapshot de backup', { error: error.message });
    }
  }

  // 4. Reindexación de memoria
  async reindexMemory() {
    const action = 'reindexMemory';
    const startTime = Date.now();
    
    try {
      logger.info('Iniciando reindexación de memoria...');
      
      const indexerScript = path.join(this.memtechDir, 'scripts/indexers/simple-index.mjs');
      
      if (await exists(indexerScript)) {
        try {
          execSync(`node "${indexerScript}" --core "${this.memoryDir}" --agent "${this.memtechDir}"`, { 
            timeout: 120000,
            cwd: this.memtechDir
          });
          logger.info('Reindexación de memoria completada');
        } catch (error) {
          logger.warn('Error en reindexación de memoria', { error: error.message });
          this.stats.warnings.push({ action, error: error.message });
        }
      } else {
        logger.warn('Script de indexación no encontrado', { script: indexerScript });
        this.stats.warnings.push({ action, error: 'indexer script not found', script: indexerScript });
      }
      
      const duration = Date.now() - startTime;
      this.stats.actions.push({ action, duration, status: 'completed' });
      logger.info('Reindexación de memoria finalizada', { duration: `${duration}ms` });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.stats.errors.push({ action, error: error.message, duration });
      logger.error('Error en reindexación de memoria', { error: error.message });
    }
  }

  // 5. Verificación de salud del sistema
  async checkSystemHealth() {
    const action = 'checkSystemHealth';
    const startTime = Date.now();
    
    try {
      logger.info('Iniciando verificación de salud del sistema...');
      
      const health = {
        memory: await this.checkMemoryUsage(),
        disk: await this.checkDiskUsage(),
        processes: await this.checkProcesses(),
        services: await this.checkServices()
      };
      
      const duration = Date.now() - startTime;
      this.stats.actions.push({ action, duration, status: 'completed', health });
      logger.info('Verificación de salud completada', { health, duration: `${duration}ms` });
      
      return health;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.stats.errors.push({ action, error: error.message, duration });
      logger.error('Error en verificación de salud', { error: error.message });
      return null;
    }
  }

  async checkMemoryUsage() {
    try {
      const output = execSync('vm_stat', { encoding: 'utf8', timeout: 5000 });
      const freeMatch = output.match(/Pages free:\s*(\d+)/);
      const freePages = freeMatch ? parseInt(freeMatch[1]) : 0;
      const freeMB = Math.round(freePages * 4096 / 1024 / 1024);
      
      return { freeMB, status: freeMB > 100 ? 'healthy' : 'critical' };
    } catch (error) {
      return { error: error.message, status: 'unknown' };
    }
  }

  async checkDiskUsage() {
    try {
      const output = execSync(`df -h "${this.rootDir}"`, { encoding: 'utf8', timeout: 5000 });
      const lines = output.split('\n');
      const dataLine = lines[1];
      const parts = dataLine.split(/\s+/);
      const usagePercent = parseInt(parts[4].replace('%', ''));
      
      return { usagePercent, status: usagePercent < 80 ? 'healthy' : 'warning' };
    } catch (error) {
      return { error: error.message, status: 'unknown' };
    }
  }

  async checkProcesses() {
    try {
      const output = execSync('ps aux | grep -E "(node|memtech)" | grep -v grep', { encoding: 'utf8', timeout: 5000 });
      const processes = output.split('\n').filter(line => line.trim()).length;
      
      return { count: processes, status: processes < 10 ? 'healthy' : 'warning' };
    } catch (error) {
      return { count: 0, status: 'healthy' };
    }
  }

  async checkServices() {
    const services = {
      victoriaMetrics: await this.checkPort(8428),
      grafana: await this.checkPort(3001),
      redis: await this.checkPort(6379)
    };
    
    const runningCount = Object.values(services).filter(s => s).length;
    return { services, runningCount, status: runningCount >= 2 ? 'healthy' : 'warning' };
  }

  async checkPort(port) {
    try {
      execSync(`nc -z localhost ${port}`, { timeout: 2000 });
      return true;
    } catch (error) {
      return false;
    }
  }

  // 6. Generar reporte
  async generateReport() {
    const action = 'generateReport';
    const startTime = Date.now();
    
    try {
      const report = {
        timestamp: new Date().toISOString(),
        duration: Date.now() - this.stats.startTime,
        stats: this.stats,
        health: await this.checkSystemHealth()
      };
      
      const reportFile = path.join(this.reportsDir, `memtech-maintenance-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.json`);
      await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
      
      const duration = Date.now() - startTime;
      this.stats.actions.push({ action, duration, status: 'completed', reportFile });
      logger.info('Reporte de mantenimiento generado', { reportFile, duration: `${duration}ms` });
      
      return reportFile;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.stats.errors.push({ action, error: error.message, duration });
      logger.error('Error generando reporte', { error: error.message });
      return null;
    }
  }

  // Ejecutar todo el mantenimiento
  async runFullMaintenance() {
    logger.info('Iniciando mantenimiento completo de MemTech...');
    
    await this.cleanRAM();
    await this.compressCheckpoints();
    await this.createBackupSnapshot();
    await this.reindexMemory();
    await this.checkSystemHealth();
    const reportFile = await this.generateReport();
    
    const totalDuration = Date.now() - new Date(this.stats.startTime).getTime();
    const summary = {
      totalDuration,
      actionsCompleted: this.stats.actions.length,
      errors: this.stats.errors.length,
      warnings: this.stats.warnings.length,
      reportFile
    };
    
    logger.info('Mantenimiento completo finalizado', summary);
    
    if (this.stats.errors.length > 0) {
      logger.error('Errores detectados durante el mantenimiento', { errors: this.stats.errors });
      process.exit(1);
    }
    
    return summary;
  }
}

// --- CLI ---
function parseArgs(argv) {
  const args = { 
    full: false,
    ram: false,
    checkpoints: false,
    backup: false,
    reindex: false,
    health: false,
    report: false
  };
  
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--full') args.full = true;
    else if (a === '--ram') args.ram = true;
    else if (a === '--checkpoints') args.checkpoints = true;
    else if (a === '--backup') args.backup = true;
    else if (a === '--reindex') args.reindex = true;
    else if (a === '--health') args.health = true;
    else if (a === '--report') args.report = true;
    else if (a === '--help' || a === '-h') args.help = true;
  }
  
  return args;
}

async function main() {
  const args = parseArgs(process.argv);
  
  if (args.help) {
    console.log(`
Uso:
  node scripts/memtech/memtech-maintenance.mjs [opciones]

Opciones:
  --full          Ejecuta todo el mantenimiento (default)
  --ram           Limpieza de RAM
  --checkpoints   Compresión de checkpoints
  --backup        Snapshot de backups
  --reindex       Reindexación de memoria
  --health        Verificación de salud
  --report        Generar reporte
  --help, -h      Muestra esta ayuda

Ejemplos:
  node scripts/memtech/memtech-maintenance.mjs --full
  node scripts/memtech/memtech-maintenance.mjs --ram --health
  node scripts/memtech/memtech-maintenance.mjs --checkpoints --backup
`);
    process.exit(0);
  }
  
  const maintenance = new MemTechMaintenance();
  await maintenance.initialize();
  
  // Si no se especifica ninguna opción, ejecutar mantenimiento completo
  if (Object.values(args).every(v => v === false)) {
    args.full = true;
  }
  
  if (args.full) {
    await maintenance.runFullMaintenance();
  } else {
    if (args.ram) await maintenance.cleanRAM();
    if (args.checkpoints) await maintenance.compressCheckpoints();
    if (args.backup) await maintenance.createBackupSnapshot();
    if (args.reindex) await maintenance.reindexMemory();
    if (args.health) await maintenance.checkSystemHealth();
    if (args.report) await maintenance.generateReport();
  }
}

if (import.meta.url === `file://${__filename}`) {
  main().catch((e) => {
    logger.error('Fallo fatal en mantenimiento', { error: String(e) });
    process.exit(2);
  });
}
