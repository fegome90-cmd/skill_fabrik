/**
 * MemTech Checkpoints Module
 *
 * Módulo para gestión de checkpoints y snapshots del sistema
 */

import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import process from 'process';
import winston from 'winston';

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
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
  ],
});

class CheckpointManager {
  constructor(config = {}) {
    this.config = {
      storage_path: config.storage_path || '.checkpoints',
      max_checkpoints: config.max_checkpoints || 50,
      compression_enabled: config.compression_enabled !== false,
      auto_cleanup: config.auto_cleanup !== false,
      retention_days: config.retention_days || 30,
      ...config,
    };

    this.checkpointsIndex = new Map();
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Asegurar que los directorios necesarios existen
      await fs.mkdir(this.config.storage_path, { recursive: true });
      await fs.mkdir(path.join(this.config.storage_path, 'snapshots'), { recursive: true });
      await fs.mkdir(path.join(this.config.storage_path, 'diffs'), { recursive: true });
      await fs.mkdir(path.join(this.config.storage_path, 'metadata'), { recursive: true });

      // Cargar índice de checkpoints
      await this.loadCheckpointsIndex();

      // Ejecutar limpieza automática si está habilitada
      if (this.config.auto_cleanup) {
        await this.cleanupOldCheckpoints();
      }

      this.initialized = true;
      logger.info('Checkpoint Manager initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Checkpoint Manager:', error);
      throw error;
    }
  }

  async loadCheckpointsIndex() {
    try {
      const indexPath = path.join(this.config.storage_path, 'index.json');

      try {
        const indexData = await fs.readFile(indexPath, 'utf8');
        const index = JSON.parse(indexData);
        this.checkpointsIndex = new Map(Object.entries(index));
        logger.info(`Loaded ${this.checkpointsIndex.size} checkpoints from index`);
      } catch (error) {
        logger.warn('No existing checkpoints index found, starting with empty index');
        this.checkpointsIndex = new Map();
      }
    } catch (error) {
      logger.error('Error loading checkpoints index:', error);
      throw error;
    }
  }

  async saveCheckpointsIndex() {
    try {
      const indexPath = path.join(this.config.storage_path, 'index.json');
      const indexObject = Object.fromEntries(this.checkpointsIndex);
      await fs.writeFile(indexPath, JSON.stringify(indexObject, null, 2));
      logger.debug('Checkpoints index saved successfully');
    } catch (error) {
      logger.error('Error saving checkpoints index:', error);
      throw error;
    }
  }

  async createCheckpoint(name, description = '', tags = []) {
    await this.initialize();

    try {
      logger.info(`Creating checkpoint: ${name}`);

      const checkpointId = `cp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const timestamp = new Date().toISOString();

      // Crear metadatos del checkpoint
      const metadata = {
        id: checkpointId,
        name,
        description,
        tags,
        created_at: timestamp,
        size_bytes: 0,
        compressed: this.config.compression_enabled,
        system_info: await this.getSystemInfo(),
        status: 'creating',
      };

      // Crear snapshot del sistema
      const snapshotResult = await this.createSnapshot(checkpointId);
      metadata.snapshot_path = snapshotResult.path;
      metadata.size_bytes = snapshotResult.size_bytes;

      // Actualizar estado
      metadata.status = 'completed';
      metadata.completed_at = new Date().toISOString();

      // Guardar metadatos
      const metadataPath = path.join(this.config.storage_path, 'metadata', `${checkpointId}.json`);
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

      // Actualizar índice
      this.checkpointsIndex.set(checkpointId, metadata);
      await this.saveCheckpointsIndex();

      // Verificar límite de checkpoints
      await this.enforceCheckpointLimit();

      logger.info(`Checkpoint created successfully: ${checkpointId}`);

      return {
        success: true,
        checkpoint_id: checkpointId,
        name,
        description,
        tags,
        created_at: timestamp,
        size_bytes: metadata.size_bytes,
        snapshot_path: metadata.snapshot_path,
      };
    } catch (error) {
      logger.error(`Error creating checkpoint ${name}:`, error);
      throw new Error(`Failed to create checkpoint: ${error.message}`);
    }
  }

  async createSnapshot(checkpointId) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const snapshotName = `${checkpointId}_${timestamp}`;
      const snapshotPath = path.join(this.config.storage_path, 'snapshots', snapshotName);

      // Crear directorio del snapshot
      await fs.mkdir(snapshotPath, { recursive: true });

      let totalSize = 0;

      // Capturar información del sistema
      const systemInfo = await this.getSystemInfo();
      const systemInfoPath = path.join(snapshotPath, 'system_info.json');
      await fs.writeFile(systemInfoPath, JSON.stringify(systemInfo, null, 2));

      const stats = await fs.stat(systemInfoPath);
      totalSize += stats.size;

      // Capturar archivos de configuración importantes
      const configFiles = [
        '.memtech/config.yaml',
        '.memtech/policies/default.json',
        'package.json',
        '.env.example',
      ];

      for (const configFile of configFiles) {
        try {
          const sourcePath = path.resolve(configFile);
          const destPath = path.join(snapshotPath, 'config', configFile);

          // Crear directorio destino si no existe
          await fs.mkdir(path.dirname(destPath), { recursive: true });

          // Copiar archivo
          await fs.copyFile(sourcePath, destPath);

          const fileStats = await fs.stat(destPath);
          totalSize += fileStats.size;
        } catch (error) {
          logger.warn(`Could not backup config file ${configFile}:`, error.message);
        }
      }

      // Crear manifiesto del snapshot
      const manifest = {
        checkpoint_id: checkpointId,
        created_at: new Date().toISOString(),
        size_bytes: totalSize,
        files: await this.getSnapshotFiles(snapshotPath),
        system_info: systemInfo,
      };

      const manifestPath = path.join(snapshotPath, 'manifest.json');
      await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

      const manifestStats = await fs.stat(manifestPath);
      totalSize += manifestStats.size;

      // Comprimir si está habilitado
      if (this.config.compression_enabled) {
        await this.compressSnapshot(snapshotPath);
        // Recalcular tamaño después de compresión
        const compressedPath = `${snapshotPath}.tar.gz`;
        const compressedStats = await fs.stat(compressedPath);
        totalSize = compressedStats.size;
      }

      return {
        path: this.config.compression_enabled ? `${snapshotPath}.tar.gz` : snapshotPath,
        size_bytes: totalSize,
        compressed: this.config.compression_enabled,
        created_at: new Date().toISOString(),
      };
    } catch (error) {
      logger.error(`Error creating snapshot for checkpoint ${checkpointId}:`, error);
      throw error;
    }
  }

  async getSnapshotFiles(snapshotPath) {
    try {
      const files = [];

      const scanDir = async (dir, relativePath = '') => {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          const relativeFilePath = path.join(relativePath, entry.name);

          if (entry.isDirectory()) {
            await scanDir(fullPath, relativeFilePath);
          } else {
            const stats = await fs.stat(fullPath);
            files.push({
              path: relativeFilePath,
              size_bytes: stats.size,
              modified: stats.mtime.toISOString(),
              hash: await this.calculateFileHash(fullPath),
            });
          }
        }
      };

      await scanDir(snapshotPath);
      return files;
    } catch (error) {
      logger.error('Error getting snapshot files:', error);
      return [];
    }
  }

  async calculateFileHash(filePath) {
    try {
      const crypto = await import('crypto');
      const content = await fs.readFile(filePath);
      return crypto.createHash('sha256').update(content).digest('hex');
    } catch (error) {
      logger.warn(`Could not calculate hash for ${filePath}:`, error.message);
      return null;
    }
  }

  async compressSnapshot(snapshotPath) {
    return new Promise((resolve, reject) => {
      const tarPath = `${snapshotPath}.tar.gz`;
      const tar = spawn('tar', [
        '-czf',
        tarPath,
        '-C',
        path.dirname(snapshotPath),
        path.basename(snapshotPath),
      ]);

      tar.on('close', code => {
        if (code === 0) {
          // Eliminar directorio original después de comprimir
          fs.rm(snapshotPath, { recursive: true })
            .then(() => {
              logger.info(`Snapshot compressed: ${tarPath}`);
              resolve(tarPath);
            })
            .catch(reject);
        } else {
          reject(new Error(`Tar process exited with code ${code}`));
        }
      });

      tar.on('error', reject);
    });
  }

  async getSystemInfo() {
    try {
      const os = await import('os');
      const { execSync } = await import('child_process');

      const systemInfo = {
        platform: os.platform(),
        arch: os.arch(),
        node_version: process.version,
        hostname: os.hostname(),
        uptime: os.uptime(),
        loadavg: os.loadavg(),
        totalmem: os.totalmem(),
        freemem: os.freemem(),
        cpus: os.cpus().length,
        timestamp: new Date().toISOString(),
      };

      // Agregar información del directorio actual
      try {
        const currentDir = process.cwd();
        const gitInfo = execSync('git log -1 --format="%H|%s|%ai" 2>/dev/null || echo "no-git"', {
          encoding: 'utf8',
        }).trim();

        systemInfo.working_directory = currentDir;
        if (gitInfo !== 'no-git') {
          const [commit, subject, authorDate] = gitInfo.split('|');
          systemInfo.git = {
            commit,
            subject,
            author_date: authorDate,
          };
        }
      } catch (error) {
        logger.warn('Could not get git information:', error.message);
      }

      return systemInfo;
    } catch (error) {
      logger.error('Error getting system info:', error);
      return {
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async listCheckpoints(filter = '', limit = 50) {
    await this.initialize();

    try {
      let checkpoints = Array.from(this.checkpointsIndex.values());

      // Aplicar filtro si se proporciona
      if (filter) {
        const filterLower = filter.toLowerCase();
        checkpoints = checkpoints.filter(
          cp =>
            cp.name.toLowerCase().includes(filterLower) ||
            cp.description.toLowerCase().includes(filterLower) ||
            (cp.tags && cp.tags.some(tag => tag.toLowerCase().includes(filterLower)))
        );
      }

      // Ordenar por fecha de creación (más reciente primero)
      checkpoints.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // Aplicar límite
      if (limit > 0) {
        checkpoints = checkpoints.slice(0, limit);
      }

      return {
        checkpoints,
        total_count: checkpoints.length,
        filter,
        limit,
        listed_at: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error listing checkpoints:', error);
      throw new Error(`Failed to list checkpoints: ${error.message}`);
    }
  }

  async restoreCheckpoint(checkpointId, force = false) {
    await this.initialize();

    try {
      logger.info(`Restoring checkpoint: ${checkpointId}`);

      if (!this.checkpointsIndex.has(checkpointId)) {
        throw new Error(`Checkpoint not found: ${checkpointId}`);
      }

      const checkpoint = this.checkpointsIndex.get(checkpointId);

      if (checkpoint.status !== 'completed') {
        throw new Error(`Cannot restore checkpoint with status: ${checkpoint.status}`);
      }

      // Verificar si el snapshot existe
      const snapshotPath = checkpoint.snapshot_path;
      try {
        await fs.access(snapshotPath);
      } catch (error) {
        throw new Error(`Snapshot file not found: ${snapshotPath}`);
      }

      // Descomprimir si es necesario
      let extractedPath = snapshotPath;
      if (snapshotPath.endsWith('.tar.gz')) {
        extractedPath = await this.extractSnapshot(snapshotPath);
      }

      // Restaurar archivos de configuración
      await this.restoreConfigFiles(extractedPath);

      // Limpiar archivos extraídos si se descomprimió
      if (extractedPath !== snapshotPath) {
        await fs.rm(extractedPath, { recursive: true });
      }

      logger.info(`Checkpoint restored successfully: ${checkpointId}`);

      return {
        success: true,
        checkpoint_id: checkpointId,
        name: checkpoint.name,
        restored_at: new Date().toISOString(),
        force,
      };
    } catch (error) {
      logger.error(`Error restoring checkpoint ${checkpointId}:`, error);
      throw new Error(`Failed to restore checkpoint: ${error.message}`);
    }
  }

  async extractSnapshot(compressedPath) {
    return new Promise((resolve, reject) => {
      const extractPath = compressedPath.replace('.tar.gz', '_extracted');
      const tar = spawn('tar', ['-xzf', compressedPath, '-C', path.dirname(compressedPath)]);

      tar.on('close', code => {
        if (code === 0) {
          logger.info(`Snapshot extracted: ${extractPath}`);
          resolve(extractPath);
        } else {
          reject(new Error(`Tar extraction process exited with code ${code}`));
        }
      });

      tar.on('error', reject);
    });
  }

  async restoreConfigFiles(extractedPath) {
    try {
      const configDir = path.join(extractedPath, 'config');

      try {
        await fs.access(configDir);
      } catch (error) {
        logger.warn('No config directory found in snapshot');
        return;
      }

      // Restaurar archivos de configuración
      const configFiles = await fs.readdir(configDir, { recursive: true });

      for (const configFile of configFiles) {
        const sourcePath = path.join(configDir, configFile);
        const destPath = path.resolve(configFile);

        try {
          // Crear directorio destino si no existe
          await fs.mkdir(path.dirname(destPath), { recursive: true });

          // Copiar archivo
          await fs.copyFile(sourcePath, destPath);

          logger.info(`Restored config file: ${configFile}`);
        } catch (error) {
          logger.warn(`Could not restore config file ${configFile}:`, error.message);
        }
      }
    } catch (error) {
      logger.error('Error restoring config files:', error);
      throw error;
    }
  }

  async deleteCheckpoint(checkpointId) {
    await this.initialize();

    try {
      if (!this.checkpointsIndex.has(checkpointId)) {
        throw new Error(`Checkpoint not found: ${checkpointId}`);
      }

      const checkpoint = this.checkpointsIndex.get(checkpointId);

      // Eliminar snapshot
      try {
        await fs.rm(checkpoint.snapshot_path, { recursive: true });
        logger.info(`Deleted snapshot: ${checkpoint.snapshot_path}`);
      } catch (error) {
        logger.warn(`Could not delete snapshot ${checkpoint.snapshot_path}:`, error.message);
      }

      // Eliminar metadatos
      try {
        const metadataPath = path.join(
          this.config.storage_path,
          'metadata',
          `${checkpointId}.json`
        );
        await fs.rm(metadataPath);
        logger.info(`Deleted metadata: ${metadataPath}`);
      } catch (error) {
        logger.warn(`Could not delete metadata for ${checkpointId}:`, error.message);
      }

      // Eliminar del índice
      this.checkpointsIndex.delete(checkpointId);
      await this.saveCheckpointsIndex();

      logger.info(`Checkpoint deleted successfully: ${checkpointId}`);

      return {
        success: true,
        checkpoint_id: checkpointId,
        deleted_at: new Date().toISOString(),
      };
    } catch (error) {
      logger.error(`Error deleting checkpoint ${checkpointId}:`, error);
      throw new Error(`Failed to delete checkpoint: ${error.message}`);
    }
  }

  async enforceCheckpointLimit() {
    try {
      if (this.checkpointsIndex.size <= this.config.max_checkpoints) {
        return;
      }

      // Ordenar checkpoints por fecha de creación (más antiguo primero)
      const sortedCheckpoints = Array.from(this.checkpointsIndex.entries()).sort(
        (a, b) => new Date(a[1].created_at) - new Date(b[1].created_at)
      );

      // Eliminar checkpoints excedentes
      const toDelete = sortedCheckpoints.slice(
        0,
        this.checkpointsIndex.size - this.config.max_checkpoints
      );

      for (const [checkpointId] of toDelete) {
        try {
          await this.deleteCheckpoint(checkpointId);
          logger.info(`Deleted old checkpoint to enforce limit: ${checkpointId}`);
        } catch (error) {
          logger.error(`Error deleting old checkpoint ${checkpointId}:`, error);
        }
      }
    } catch (error) {
      logger.error('Error enforcing checkpoint limit:', error);
    }
  }

  async cleanupOldCheckpoints() {
    try {
      const now = new Date();
      const cutoffDate = new Date(now.getTime() - this.config.retention_days * 24 * 60 * 60 * 1000);

      const toDelete = [];

      for (const [checkpointId, checkpoint] of this.checkpointsIndex.entries()) {
        const createdDate = new Date(checkpoint.created_at);
        if (createdDate < cutoffDate) {
          toDelete.push(checkpointId);
        }
      }

      for (const checkpointId of toDelete) {
        try {
          await this.deleteCheckpoint(checkpointId);
          logger.info(`Deleted expired checkpoint: ${checkpointId}`);
        } catch (error) {
          logger.error(`Error deleting expired checkpoint ${checkpointId}:`, error);
        }
      }

      if (toDelete.length > 0) {
        logger.info(`Cleaned up ${toDelete.length} expired checkpoints`);
      }
    } catch (error) {
      logger.error('Error during checkpoint cleanup:', error);
    }
  }

  async getCheckpointStats() {
    await this.initialize();

    try {
      const checkpoints = Array.from(this.checkpointsIndex.values());
      const totalSize = checkpoints.reduce((sum, cp) => sum + (cp.size_bytes || 0), 0);

      const statusCounts = checkpoints.reduce((counts, cp) => {
        counts[cp.status] = (counts[cp.status] || 0) + 1;
        return counts;
      }, {});

      return {
        total_checkpoints: checkpoints.length,
        total_size_bytes: totalSize,
        total_size_mb: (totalSize / (1024 * 1024)).toFixed(2),
        status_counts: statusCounts,
        max_checkpoints: this.config.max_checkpoints,
        retention_days: this.config.retention_days,
        storage_path: this.config.storage_path,
        stats_at: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error getting checkpoint stats:', error);
      throw new Error(`Failed to get checkpoint stats: ${error.message}`);
    }
  }
}

export default CheckpointManager;
