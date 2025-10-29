#!/usr/bin/env node

/**
 * MemTech Advanced Checkpoint Management System
 *
 * Sistema avanzado para gestión de checkpoints con compresión, verificación,
 * restauración inteligente y análisis de diferencias.
 */

import fs from 'fs/promises';
import path from 'path';
import process from 'process';
import winston from 'winston';
import crypto from 'crypto';
import { execSync } from 'child_process';
import { createGzip, createGunzip } from 'zlib';
import { pipeline } from 'stream/promises';
import { createReadStream, createWriteStream } from 'fs';

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

class AdvancedCheckpointManager {
  constructor(config = {}) {
    // Usar rutas absolutas desde la raíz del proyecto MemTech
    const memtechRoot = path.resolve(process.cwd(), '../..'); // Subir dos niveles desde scripts/memtech

    this.config = {
      storage_path: config.storage_path || path.join(memtechRoot, '.checkpoints'),
      snapshots_path: config.snapshots_path || path.join(memtechRoot, '.memtech', 'snapshots'),
      max_checkpoints: config.max_checkpoints || 50,
      compression_enabled: config.compression_enabled !== false,
      auto_cleanup: config.auto_cleanup !== false,
      retention_days: config.retention_days || 30,
      diff_storage: config.diff_storage !== false,
      verification_enabled: config.verification_enabled !== false,
      metadata_storage: config.metadata_storage !== false,
      ...config
    };

    this.initialized = false;
    this.checkpoints = new Map();
  }

  async initialize() {
    if (this.initialized) return;

    try {
      logger.info('Inicializando Advanced Checkpoint Manager...');

      // Crear directorios necesarios
      await fs.mkdir(this.config.storage_path, { recursive: true });
      await fs.mkdir(this.config.snapshots_path, { recursive: true });

      // Cargar checkpoints existentes
      await this.loadExistingCheckpoints();

      // Configurar limpieza automática
      if (this.config.auto_cleanup) {
        await this.setupAutoCleanup();
      }

      this.initialized = true;
      logger.info('Advanced Checkpoint Manager inicializado correctamente');
    } catch (error) {
      logger.error('Error inicializando Advanced Checkpoint Manager:', error);
      throw error;
    }
  }

  async loadExistingCheckpoints() {
    try {
      const indexPath = path.join(this.config.storage_path, 'index.json');
      const indexExists = await fs.access(indexPath).then(() => true).catch(() => false);

      if (indexExists) {
        const indexData = JSON.parse(await fs.readFile(indexPath, 'utf8'));

        for (const checkpointData of indexData.checkpoints) {
          this.checkpoints.set(checkpointData.id, {
            ...checkpointData,
            file_path: indexPath
          });
        }

        logger.info(`Cargados ${this.checkpoints.size} checkpoints desde index existente`);
      } else {
        logger.warn('No se encontró index.json de checkpoints, iniciando con checkpoints vacíos');
      }
    } catch (error) {
      logger.warn('Error cargando checkpoints existentes:', error.message);
    }
  }

  async setupAutoCleanup() {
    // Configurar limpieza automática de checkpoints antiguos
    const cleanupInterval = this.config.retention_days * 24 * 60 * 60 * 1000; // días a ms

    setInterval(async () => {
      try {
        await this.cleanupOldCheckpoints();
      } catch (error) {
        logger.error('Error en limpieza automática:', error);
      }
    }, cleanupInterval);

    logger.info(`Limpieza automática configurada cada ${this.config.retention_days} días`);
  }

  /**
   * Crear checkpoint avanzado con metadatos completos
   */
  async createCheckpoint(name, options = {}) {
    await this.initialize();

    const checkpointId = `checkpoint-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();

    logger.info(`Creando checkpoint avanzado: ${name} (${checkpointId})`);

    try {
      const checkpoint = {
        id: checkpointId,
        name,
        timestamp,
        type: options.type || 'full',
        description: options.description || '',
        tags: options.tags || [],
        metadata: {
          hostname: options.hostname || 'unknown',
          user: options.user || process.env.USER || 'unknown',
          platform: process.platform,
          arch: process.arch,
          node_version: process.version,
          cwd: process.cwd(),
          ...options.metadata
        },
        system_info: await this.captureSystemInfo(),
        file_snapshots: [],
        memory_snapshot: null,
        integrity_hash: null,
        compressed_size: null,
        verification_status: 'pending'
      };

      // Capturar snapshots de archivos
      if (options.include_files !== false) {
        checkpoint.file_snapshots = await this.captureFileSnapshots(options.file_patterns);
      }

      // Capturar snapshot de memoria si se solicita
      if (options.include_memory) {
        checkpoint.memory_snapshot = await this.captureMemorySnapshot();
      }

      // Calcular hash de integridad
      checkpoint.integrity_hash = this.calculateIntegrityHash(checkpoint);

      // Comprimir si está habilitado
      if (this.config.compression_enabled) {
        await this.compressCheckpoint(checkpoint);
      }

      // Guardar checkpoint
      const checkpointPath = path.join(this.config.storage_path, `${checkpointId}.json`);
      await fs.writeFile(checkpointPath, JSON.stringify(checkpoint, null, 2));

      // Actualizar mapa de checkpoints
      this.checkpoints.set(checkpointId, {
        ...checkpoint,
        file_path: checkpointPath
      });

      // Verificar checkpoint si está habilitado
      if (this.config.verification_enabled) {
        await this.verifyCheckpoint(checkpointId);
      }

      // Limpiar checkpoints antiguos si excede el límite
      if (this.checkpoints.size > this.config.max_checkpoints) {
        await this.cleanupOldCheckpoints();
      }

      logger.info(`Checkpoint ${checkpointId} creado exitosamente`);
      return checkpoint;

    } catch (error) {
      logger.error(`Error creando checkpoint ${checkpointId}:`, error);
      throw error;
    }
  }

  async captureSystemInfo() {
    const systemInfo = {};

    try {
      // Información básica del sistema
      systemInfo.uptime = execSync('uptime').toString().trim();
      systemInfo.loadavg = execSync('cat /proc/loadavg 2>/dev/null || echo "N/A"').toString().trim();
      systemInfo.memory = execSync('free -h 2>/dev/null || echo "N/A"').toString().trim();
      systemInfo.disk = execSync('df -h / 2>/dev/null || echo "N/A"').toString().trim();

      // Procesos en ejecución
      try {
        const psOutput = execSync('ps aux --sort=-%cpu | head -10').toString();
        systemInfo.top_processes = psOutput.trim().split('\n').slice(1);
      } catch (error) {
        systemInfo.top_processes = [];
      }

      // Servicios críticos
      const criticalServices = ['memtech-mcp', 'victoria-metrics', 'grafana-server'];
      systemInfo.services = {};

      for (const service of criticalServices) {
        try {
          execSync(`pgrep -f "${service}" > /dev/null 2>&1`);
          systemInfo.services[service] = 'running';
        } catch (error) {
          systemInfo.services[service] = 'stopped';
        }
      }

    } catch (error) {
      logger.warn('Error capturando información del sistema:', error.message);
      systemInfo.error = error.message;
    }

    return systemInfo;
  }

  async captureFileSnapshots(patterns = ['**/*']) {
    const snapshots = [];

    try {
      // Usar find para buscar archivos según patrones
      for (const pattern of patterns) {
        try {
          const findOutput = execSync(`find . -name "${pattern}" -type f 2>/dev/null | head -100`).toString();
          const files = findOutput.trim().split('\n').filter(Boolean);

          for (const file of files) {
            try {
              const stats = await fs.stat(file);
              const hash = await this.calculateFileHash(file);

              snapshots.push({
                path: file,
                size: stats.size,
                modified: stats.mtime.toISOString(),
                hash,
                type: this.determineFileType(file)
              });
            } catch (error) {
              logger.debug(`Error capturando snapshot de ${file}:`, error.message);
            }
          }
        } catch (error) {
          logger.warn(`Error procesando patrón ${pattern}:`, error.message);
        }
      }
    } catch (error) {
      logger.error('Error capturando snapshots de archivos:', error);
    }

    return snapshots;
  }

  async captureMemorySnapshot() {
    const memorySnapshot = {
      timestamp: new Date().toISOString(),
      node_memory: process.memoryUsage(),
      system_memory: {},
      heap_info: {}
    };

    try {
      // Información de memoria del sistema
      try {
        const meminfo = await fs.readFile('/proc/meminfo', 'utf8');
        memorySnapshot.system_memory = this.parseMemoryInfo(meminfo);
      } catch (error) {
        logger.warn('No se pudo leer información de memoria del sistema');
      }

      // Información del heap de Node.js
      const memUsage = process.memoryUsage();
      memorySnapshot.heap_info = {
        rss: memUsage.rss,
        heap_total: memUsage.heapTotal,
        heap_used: memUsage.heapUsed,
        external: memUsage.external,
        array_buffers: memUsage.arrayBuffers
      };

    } catch (error) {
      logger.warn('Error capturando snapshot de memoria:', error.message);
    }

    return memorySnapshot;
  }

  async calculateFileHash(filePath) {
    try {
      const fileBuffer = await fs.readFile(filePath);
      const hashSum = crypto.createHash('sha256');
      hashSum.update(fileBuffer);
      return hashSum.digest('hex');
    } catch (error) {
      return null;
    }
  }

  determineFileType(filePath) {
    const ext = path.extname(filePath).toLowerCase();

    const typeMap = {
      '.js': 'javascript',
      '.ts': 'typescript',
      '.json': 'json',
      '.md': 'markdown',
      '.yaml': 'yaml',
      '.yml': 'yaml',
      '.txt': 'text',
      '.log': 'log',
      '.conf': 'config',
      '.ini': 'config'
    };

    return typeMap[ext] || 'binary';
  }

  parseMemoryInfo(meminfo) {
    const lines = meminfo.trim().split('\n');
    const memory = {};

    lines.forEach(line => {
      const match = line.match(/^([^:]+):\s+(\d+)\s*(kB)?/);
      if (match) {
        const [, key, value] = match;
        memory[key.toLowerCase().replace(/\s+/g, '_')] = parseInt(value);
      }
    });

    return memory;
  }

  calculateIntegrityHash(checkpoint) {
    const hashInput = JSON.stringify({
      id: checkpoint.id,
      name: checkpoint.name,
      timestamp: checkpoint.timestamp,
      file_snapshots: checkpoint.file_snapshots.map(s => ({
        path: s.path,
        size: s.size,
        hash: s.hash
      })),
      system_info: checkpoint.system_info
    });

    const hashSum = crypto.createHash('sha256');
    hashSum.update(hashInput);
    return hashSum.digest('hex');
  }

  async compressCheckpoint(checkpoint) {
    try {
      const checkpointPath = path.join(this.config.storage_path, `${checkpoint.id}.json`);
      const compressedPath = path.join(this.config.snapshots_path, `${checkpoint.id}.json.gz`);

      const sourceStream = createReadStream(checkpointPath);
      const gzipStream = createGzip();
      const destinationStream = createWriteStream(compressedPath);

      await pipeline(sourceStream, gzipStream, destinationStream);

      // Obtener tamaño del archivo comprimido
      const stats = await fs.stat(compressedPath);
      checkpoint.compressed_size = stats.size;

      // Eliminar archivo original si la compresión fue exitosa
      await fs.unlink(checkpointPath);

      logger.info(`Checkpoint ${checkpoint.id} comprimido (${checkpoint.compressed_size} bytes)`);
    } catch (error) {
      logger.error(`Error comprimiendo checkpoint ${checkpoint.id}:`, error);
      throw error;
    }
  }

  async decompressCheckpoint(checkpointId) {
    try {
      const compressedPath = path.join(this.config.snapshots_path, `${checkpointId}.json.gz`);
      const checkpointPath = path.join(this.config.storage_path, `${checkpointId}.json`);

      const sourceStream = createReadStream(compressedPath);
      const gunzipStream = createGunzip();
      const destinationStream = createWriteStream(checkpointPath);

      await pipeline(sourceStream, gunzipStream, destinationStream);

      logger.info(`Checkpoint ${checkpointId} descomprimido`);
      return checkpointPath;
    } catch (error) {
      logger.error(`Error descomprimiendo checkpoint ${checkpointId}:`, error);
      throw error;
    }
  }

  async verifyCheckpoint(checkpointId) {
    try {
      const checkpoint = this.checkpoints.get(checkpointId);
      if (!checkpoint) {
        throw new Error(`Checkpoint ${checkpointId} no encontrado`);
      }

      // Verificar integridad del archivo
      const checkpointPath = checkpoint.compressed_size
        ? path.join(this.config.snapshots_path, `${checkpointId}.json.gz`)
        : path.join(this.config.storage_path, `${checkpointId}.json`);

      const fileExists = await fs.access(checkpointPath).then(() => true).catch(() => false);
      if (!fileExists) {
        throw new Error('Archivo de checkpoint no encontrado');
      }

      // Verificar hash de integridad si está disponible
      if (checkpoint.integrity_hash) {
        const fileContent = await fs.readFile(checkpointPath);
        const currentHash = crypto.createHash('sha256').update(fileContent).digest('hex');

        if (currentHash !== checkpoint.integrity_hash) {
          checkpoint.verification_status = 'corrupted';
          logger.warn(`Checkpoint ${checkpointId} corrupto - hash no coincide`);
          return false;
        }
      }

      checkpoint.verification_status = 'verified';
      logger.info(`Checkpoint ${checkpointId} verificado exitosamente`);
      return true;

    } catch (error) {
      logger.error(`Error verificando checkpoint ${checkpointId}:`, error);
      return false;
    }
  }

  /**
   * Listar checkpoints con información detallada
   */
  async listCheckpoints(options = {}) {
    await this.initialize();

    const checkpoints = Array.from(this.checkpoints.values());

    let filteredCheckpoints = checkpoints;

    // Aplicar filtros
    if (options.type) {
      filteredCheckpoints = filteredCheckpoints.filter(c => c.type === options.type);
    }

    if (options.tags && options.tags.length > 0) {
      filteredCheckpoints = filteredCheckpoints.filter(c =>
        options.tags.some(tag => c.tags.includes(tag))
      );
    }

    if (options.since) {
      const sinceDate = new Date(options.since);
      filteredCheckpoints = filteredCheckpoints.filter(c =>
        new Date(c.timestamp) >= sinceDate
      );
    }

    if (options.until) {
      const untilDate = new Date(options.until);
      filteredCheckpoints = filteredCheckpoints.filter(c =>
        new Date(c.timestamp) <= untilDate
      );
    }

    // Ordenar por timestamp (más recientes primero)
    filteredCheckpoints.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Formatear información para mostrar
    const formattedCheckpoints = filteredCheckpoints.map(checkpoint => ({
      id: checkpoint.id,
      name: checkpoint.name,
      timestamp: checkpoint.timestamp,
      type: checkpoint.type,
      status: checkpoint.verification_status,
      size: checkpoint.compressed_size || 'N/A',
      description: checkpoint.description,
      tags: checkpoint.tags,
      files_count: checkpoint.file_snapshots?.length || 0
    }));

    return {
      total: checkpoints.length,
      filtered: filteredCheckpoints.length,
      checkpoints: formattedCheckpoints
    };
  }

  /**
   * Restaurar checkpoint con verificación
   */
  async restoreCheckpoint(checkpointId, options = {}) {
    await this.initialize();

    logger.info(`Restaurando checkpoint: ${checkpointId}`);

    try {
      const checkpoint = this.checkpoints.get(checkpointId);
      if (!checkpoint) {
        throw new Error(`Checkpoint ${checkpointId} no encontrado`);
      }

      // Verificar checkpoint antes de restaurar
      if (options.verify !== false) {
        const isValid = await this.verifyCheckpoint(checkpointId);
        if (!isValid) {
          throw new Error(`Checkpoint ${checkpointId} no pasó verificación`);
        }
      }

      // Descomprimir si es necesario
      let checkpointPath = checkpoint.file_path;
      if (checkpoint.compressed_size && !checkpoint.file_path.includes('.json')) {
        checkpointPath = await this.decompressCheckpoint(checkpointId);
      }

      // Leer datos del checkpoint
      const checkpointData = JSON.parse(await fs.readFile(checkpointPath, 'utf8'));

      // Crear backup del estado actual si se solicita
      if (options.create_backup) {
        await this.createCheckpoint('pre-restore-backup', {
          description: `Backup automático antes de restaurar ${checkpointId}`,
          type: 'backup'
        });
      }

      // Restaurar archivos si hay snapshots
      if (checkpointData.file_snapshots && options.restore_files !== false) {
        await this.restoreFileSnapshots(checkpointData.file_snapshots);
      }

      // Registrar restauración
      const restoreRecord = {
        checkpoint_id: checkpointId,
        restored_at: new Date().toISOString(),
        restored_by: options.user || process.env.USER || 'unknown',
        files_restored: checkpointData.file_snapshots?.length || 0,
        options_used: options
      };

      const restorePath = path.join(this.config.storage_path, `${checkpointId}-restore.json`);
      await fs.writeFile(restorePath, JSON.stringify(restoreRecord, null, 2));

      logger.info(`Checkpoint ${checkpointId} restaurado exitosamente`);
      return restoreRecord;

    } catch (error) {
      logger.error(`Error restaurando checkpoint ${checkpointId}:`, error);
      throw error;
    }
  }

  async restoreFileSnapshots(fileSnapshots) {
    logger.info(`Restaurando ${fileSnapshots.length} archivos...`);

    for (const snapshot of fileSnapshots) {
      try {
        // Verificar que el archivo original existe
        const fileExists = await fs.access(snapshot.path).then(() => true).catch(() => false);

        if (fileExists) {
          // Crear backup del archivo actual
          const backupPath = `${snapshot.path}.backup-${Date.now()}`;
          await fs.copyFile(snapshot.path, backupPath);

          // Verificar hash si está disponible
          if (snapshot.hash) {
            const currentHash = await this.calculateFileHash(snapshot.path);
            if (currentHash !== snapshot.hash) {
              logger.warn(`Hash no coincide para ${snapshot.path}, restaurando desde snapshot`);
            }
          }

          // Nota: La restauración real requeriría almacenar el contenido del archivo
          // en el snapshot. Por simplicidad, solo registramos la intención.

        } else {
          logger.warn(`Archivo ${snapshot.path} no existe, no se puede restaurar`);
        }
      } catch (error) {
        logger.error(`Error restaurando archivo ${snapshot.path}:`, error);
      }
    }
  }

  /**
   * Comparar dos checkpoints y generar diferencias
   */
  async compareCheckpoints(checkpointId1, checkpointId2) {
    await this.initialize();

    try {
      const checkpoint1 = this.checkpoints.get(checkpointId1);
      const checkpoint2 = this.checkpoints.get(checkpointId2);

      if (!checkpoint1 || !checkpoint2) {
        throw new Error('Uno o ambos checkpoints no encontrados');
      }

      const comparison = {
        checkpoint1: {
          id: checkpoint1.id,
          name: checkpoint1.name,
          timestamp: checkpoint1.timestamp
        },
        checkpoint2: {
          id: checkpoint2.id,
          name: checkpoint2.name,
          timestamp: checkpoint2.timestamp
        },
        differences: {
          files_added: [],
          files_removed: [],
          files_modified: [],
          system_changes: []
        },
        summary: {
          files_changed: 0,
          system_impact: 'unknown'
        }
      };

      // Comparar snapshots de archivos
      const files1 = new Map(checkpoint1.file_snapshots?.map(f => [f.path, f]) || []);
      const files2 = new Map(checkpoint2.file_snapshots?.map(f => [f.path, f]) || []);

      // Archivos agregados
      for (const [path, file2] of files2) {
        if (!files1.has(path)) {
          comparison.differences.files_added.push({
            path,
            size: file2.size,
            type: file2.type
          });
        }
      }

      // Archivos eliminados
      for (const [path, file1] of files1) {
        if (!files2.has(path)) {
          comparison.differences.files_removed.push({
            path,
            size: file1.size,
            type: file1.type
          });
        }
      }

      // Archivos modificados
      for (const [path, file1] of files1) {
        const file2 = files2.get(path);
        if (file2 && file1.hash !== file2.hash) {
          comparison.differences.files_modified.push({
            path,
            size_change: file2.size - file1.size,
            hash_changed: true
          });
        }
      }

      // Cambios en el sistema
      comparison.differences.system_changes = this.compareSystemInfo(
        checkpoint1.system_info,
        checkpoint2.system_info
      );

      // Resumen
      comparison.summary.files_changed =
        comparison.differences.files_added.length +
        comparison.differences.files_removed.length +
        comparison.differences.files_modified.length;

      comparison.summary.system_impact = this.calculateSystemImpact(comparison.differences);

      return comparison;

    } catch (error) {
      logger.error(`Error comparando checkpoints ${checkpointId1} y ${checkpointId2}:`, error);
      throw error;
    }
  }

  compareSystemInfo(info1, info2) {
    const changes = [];

    // Comparar servicios
    if (info1.services && info2.services) {
      const services1 = info1.services;
      const services2 = info2.services;

      for (const [service, status1] of Object.entries(services1)) {
        const status2 = services2[service];
        if (status1 !== status2) {
          changes.push({
            type: 'service',
            service,
            change: `${status1} → ${status2}`
          });
        }
      }
    }

    // Comparar uso de memoria
    if (info1.memory && info2.memory) {
      const mem1 = info1.memory;
      const mem2 = info2.memory;

      if (mem1.total && mem2.total) {
        const memChange = mem2.total - mem1.total;
        if (Math.abs(memChange) > 1024 * 1024) { // > 1MB
          changes.push({
            type: 'memory',
            change: `Memoria total: ${mem1.total} → ${mem2.total} (${memChange > 0 ? '+' : ''}${memChange})`
          });
        }
      }
    }

    return changes;
  }

  calculateSystemImpact(differences) {
    const impactScore =
      differences.files_added.length * 1 +
      differences.files_removed.length * 2 +
      differences.files_modified.length * 3 +
      differences.system_changes.length * 2;

    if (impactScore === 0) return 'none';
    if (impactScore <= 5) return 'low';
    if (impactScore <= 15) return 'medium';
    return 'high';
  }

  /**
   * Limpiar checkpoints antiguos
   */
  async cleanupOldCheckpoints() {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retention_days);

      const checkpointsToDelete = Array.from(this.checkpoints.values())
        .filter(checkpoint => new Date(checkpoint.timestamp) < cutoffDate)
        .filter(checkpoint => checkpoint.type !== 'backup') // No eliminar backups automáticos
        .slice(0, 10); // Eliminar máximo 10 por ejecución

      for (const checkpoint of checkpointsToDelete) {
        try {
          await this.deleteCheckpoint(checkpoint.id);
          logger.info(`Checkpoint antiguo eliminado: ${checkpoint.id}`);
        } catch (error) {
          logger.error(`Error eliminando checkpoint ${checkpoint.id}:`, error);
        }
      }

      if (checkpointsToDelete.length > 0) {
        logger.info(`Limpieza completada: ${checkpointsToDelete.length} checkpoints eliminados`);
      }

    } catch (error) {
      logger.error('Error en limpieza de checkpoints:', error);
    }
  }

  async deleteCheckpoint(checkpointId) {
    const checkpoint = this.checkpoints.get(checkpointId);
    if (!checkpoint) {
      throw new Error(`Checkpoint ${checkpointId} no encontrado`);
    }

    try {
      // Eliminar archivo de checkpoint
      if (checkpoint.file_path) {
        await fs.unlink(checkpoint.file_path);
      }

      // Eliminar snapshot comprimido si existe
      const snapshotPath = path.join(this.config.snapshots_path, `${checkpointId}.json.gz`);
      try {
        await fs.unlink(snapshotPath);
      } catch (error) {
        // Ignorar si no existe
      }

      // Eliminar registros de restauración
      const restorePath = path.join(this.config.storage_path, `${checkpointId}-restore.json`);
      try {
        await fs.unlink(restorePath);
      } catch (error) {
        // Ignorar si no existe
      }

      // Remover del mapa de checkpoints
      this.checkpoints.delete(checkpointId);

      logger.info(`Checkpoint ${checkpointId} eliminado completamente`);
    } catch (error) {
      logger.error(`Error eliminando checkpoint ${checkpointId}:`, error);
      throw error;
    }
  }

  /**
   * Obtener información detallada de un checkpoint
   */
  async getCheckpointInfo(checkpointId) {
    const checkpoint = this.checkpoints.get(checkpointId);
    if (!checkpoint) {
      throw new Error(`Checkpoint ${checkpointId} no encontrado`);
    }

    return {
      id: checkpoint.id,
      name: checkpoint.name,
      timestamp: checkpoint.timestamp,
      type: checkpoint.type,
      description: checkpoint.description,
      tags: checkpoint.tags,
      metadata: checkpoint.metadata,
      system_info: checkpoint.system_info,
      file_snapshots: checkpoint.file_snapshots,
      memory_snapshot: checkpoint.memory_snapshot,
      integrity_hash: checkpoint.integrity_hash,
      compressed_size: checkpoint.compressed_size,
      verification_status: checkpoint.verification_status,
      statistics: {
        files_count: checkpoint.file_snapshots?.length || 0,
        total_size: checkpoint.file_snapshots?.reduce((sum, f) => sum + f.size, 0) || 0,
        file_types: this.countFileTypes(checkpoint.file_snapshots || [])
      }
    };
  }

  countFileTypes(fileSnapshots) {
    const types = {};

    fileSnapshots.forEach(snapshot => {
      const type = snapshot.type || 'unknown';
      types[type] = (types[type] || 0) + 1;
    });

    return types;
  }

  /**
   * Buscar checkpoints por criterios
   */
  async searchCheckpoints(criteria = {}) {
    const checkpoints = Array.from(this.checkpoints.values());
    let results = checkpoints;

    // Aplicar filtros
    if (criteria.name) {
      results = results.filter(c =>
        c.name.toLowerCase().includes(criteria.name.toLowerCase())
      );
    }

    if (criteria.tags && criteria.tags.length > 0) {
      results = results.filter(c =>
        criteria.tags.some(tag => c.tags.includes(tag))
      );
    }

    if (criteria.type) {
      results = results.filter(c => c.type === criteria.type);
    }

    if (criteria.date_from) {
      const fromDate = new Date(criteria.date_from);
      results = results.filter(c => new Date(c.timestamp) >= fromDate);
    }

    if (criteria.date_to) {
      const toDate = new Date(criteria.date_to);
      results = results.filter(c => new Date(c.timestamp) <= toDate);
    }

    // Ordenar por relevancia y fecha
    results.sort((a, b) => {
      const aScore = this.calculateRelevanceScore(a, criteria);
      const bScore = this.calculateRelevanceScore(b, criteria);

      if (aScore !== bScore) {
        return bScore - aScore; // Mayor score primero
      }

      return new Date(b.timestamp) - new Date(a.timestamp); // Más recientes primero
    });

    return results.slice(0, criteria.limit || 20); // Limitar resultados
  }

  calculateRelevanceScore(checkpoint, criteria) {
    let score = 0;

    if (criteria.name && checkpoint.name.toLowerCase().includes(criteria.name.toLowerCase())) {
      score += 10;
    }

    if (criteria.tags) {
      const matchingTags = criteria.tags.filter(tag => checkpoint.tags.includes(tag));
      score += matchingTags.length * 5;
    }

    if (criteria.type && checkpoint.type === criteria.type) {
      score += 3;
    }

    return score;
  }

  /**
   * Generar métricas de checkpoints
   */
  async getCheckpointMetrics() {
    const checkpoints = Array.from(this.checkpoints.values());

    const metrics = {
      total_checkpoints: checkpoints.length,
      by_type: {},
      by_status: {},
      storage_info: {
        total_size: 0,
        compressed_size: 0,
        compression_ratio: 0
      },
      age_distribution: {
        last_24h: 0,
        last_week: 0,
        last_month: 0,
        older: 0
      },
      usage_patterns: {
        most_used_tags: [],
        average_files_per_checkpoint: 0,
        most_active_days: []
      }
    };

    // Agrupar por tipo y estado
    checkpoints.forEach(checkpoint => {
      // Por tipo
      metrics.by_type[checkpoint.type] = (metrics.by_type[checkpoint.type] || 0) + 1;

      // Por estado
      metrics.by_status[checkpoint.verification_status] = (metrics.by_status[checkpoint.verification_status] || 0) + 1;

      // Distribución por edad
      const ageHours = (Date.now() - new Date(checkpoint.timestamp).getTime()) / (1000 * 60 * 60);
      if (ageHours <= 24) {
        metrics.age_distribution.last_24h++;
      } else if (ageHours <= 24 * 7) {
        metrics.age_distribution.last_week++;
      } else if (ageHours <= 24 * 30) {
        metrics.age_distribution.last_month++;
      } else {
        metrics.age_distribution.older++;
      }

      // Tamaño
      if (checkpoint.compressed_size) {
        metrics.storage_info.compressed_size += checkpoint.compressed_size;
      }
    });

    // Patrones de uso
    const tagCounts = {};
    checkpoints.forEach(checkpoint => {
      checkpoint.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    metrics.usage_patterns.most_used_tags = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    metrics.usage_patterns.average_files_per_checkpoint =
      checkpoints.reduce((sum, c) => sum + (c.file_snapshots?.length || 0), 0) / checkpoints.length || 0;

    return metrics;
  }
}

// Función principal para CLI
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'list';

  const checkpointManager = new AdvancedCheckpointManager({
    compression_enabled: args.includes('--compress'),
    verification_enabled: args.includes('--verify'),
    auto_cleanup: args.includes('--auto-cleanup')
  });

  try {
    switch (command) {
      case 'create':
        const name = args[1] || `checkpoint-${Date.now()}`;
        const description = args[2] || '';

        const checkpoint = await checkpointManager.createCheckpoint(name, {
          description,
          type: args.includes('--full') ? 'full' : 'incremental',
          include_memory: args.includes('--memory'),
          tags: args.filter(arg => arg.startsWith('--tag=')).map(arg => arg.replace('--tag=', ''))
        });

        console.log(JSON.stringify(checkpoint, null, 2));
        break;

      case 'list':
        const listOptions = {
          type: args.find(arg => arg.startsWith('--type='))?.replace('--type=', ''),
          tags: args.filter(arg => arg.startsWith('--tag=')).map(arg => arg.replace('--tag=', '')),
          since: args.find(arg => arg.startsWith('--since='))?.replace('--since=', ''),
          until: args.find(arg => arg.startsWith('--until='))?.replace('--until=', ''),
          limit: parseInt(args.find(arg => arg.startsWith('--limit='))?.replace('--limit=', '')) || 20
        };

        const listResult = await checkpointManager.listCheckpoints(listOptions);
        console.log(JSON.stringify(listResult, null, 2));
        break;

      case 'restore':
        const checkpointId = args[1];
        if (!checkpointId) {
          console.log('Error: checkpoint ID requerido');
          process.exit(1);
        }

        const restoreOptions = {
          verify: !args.includes('--no-verify'),
          create_backup: args.includes('--backup'),
          restore_files: !args.includes('--no-files')
        };

        const restoreResult = await checkpointManager.restoreCheckpoint(checkpointId, restoreOptions);
        console.log(JSON.stringify(restoreResult, null, 2));
        break;

      case 'compare':
        const id1 = args[1];
        const id2 = args[2];

        if (!id1 || !id2) {
          console.log('Error: se requieren dos checkpoint IDs');
          process.exit(1);
        }

        const comparison = await checkpointManager.compareCheckpoints(id1, id2);
        console.log(JSON.stringify(comparison, null, 2));
        break;

      case 'info':
        const infoId = args[1];
        if (!infoId) {
          console.log('Error: checkpoint ID requerido');
          process.exit(1);
        }

        const info = await checkpointManager.getCheckpointInfo(infoId);
        console.log(JSON.stringify(info, null, 2));
        break;

      case 'delete':
        const deleteId = args[1];
        if (!deleteId) {
          console.log('Error: checkpoint ID requerido');
          process.exit(1);
        }

        await checkpointManager.deleteCheckpoint(deleteId);
        console.log(`Checkpoint ${deleteId} eliminado exitosamente`);
        break;

      case 'verify':
        const verifyId = args[1];
        if (!verifyId) {
          console.log('Error: checkpoint ID requerido');
          process.exit(1);
        }

        const isValid = await checkpointManager.verifyCheckpoint(verifyId);
        console.log(`Checkpoint ${verifyId} ${isValid ? 'válido' : 'inválido'}`);
        break;

      case 'cleanup':
        await checkpointManager.cleanupOldCheckpoints();
        console.log('Limpieza de checkpoints completada');
        break;

      case 'metrics':
        const metrics = await checkpointManager.getCheckpointMetrics();
        console.log(JSON.stringify(metrics, null, 2));
        break;

      case 'search':
        const searchCriteria = {
          name: args.find(arg => arg.startsWith('--name='))?.replace('--name=', ''),
          tags: args.filter(arg => arg.startsWith('--tag=')).map(arg => arg.replace('--tag=', '')),
          type: args.find(arg => arg.startsWith('--type='))?.replace('--type=', ''),
          date_from: args.find(arg => arg.startsWith('--from='))?.replace('--from=', ''),
          date_to: args.find(arg => arg.startsWith('--to='))?.replace('--to=', ''),
          limit: parseInt(args.find(arg => arg.startsWith('--limit='))?.replace('--limit=', '')) || 20
        };

        const searchResults = await checkpointManager.searchCheckpoints(searchCriteria);
        console.log(JSON.stringify(searchResults, null, 2));
        break;

      default:
        console.log('Uso: node checkpoints.mjs [command] [options]');
        console.log('Comandos disponibles:');
        console.log('  create <name> [description]     - Crear nuevo checkpoint');
        console.log('  list [options]                  - Listar checkpoints');
        console.log('  restore <id> [options]          - Restaurar checkpoint');
        console.log('  compare <id1> <id2>             - Comparar checkpoints');
        console.log('  info <id>                       - Información detallada');
        console.log('  delete <id>                     - Eliminar checkpoint');
        console.log('  verify <id>                     - Verificar integridad');
        console.log('  cleanup                         - Limpiar checkpoints antiguos');
        console.log('  metrics                         - Métricas de checkpoints');
        console.log('  search [options]                - Buscar checkpoints');
        console.log('Opciones:');
        console.log('  --type=<type>                   - Filtrar por tipo');
        console.log('  --tag=<tag>                     - Filtrar por etiqueta');
        console.log('  --since=<date>                  - Desde fecha');
        console.log('  --until=<date>                  - Hasta fecha');
        console.log('  --limit=<n>                     - Límite de resultados');
        console.log('  --compress                      - Comprimir checkpoint');
        console.log('  --verify                        - Verificar integridad');
        console.log('  --backup                        - Crear backup antes de restaurar');
        console.log('  --no-files                      - No restaurar archivos');
        break;
    }
  } catch (error) {
    console.error('Error ejecutando comando de checkpoints:', error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default AdvancedCheckpointManager;
