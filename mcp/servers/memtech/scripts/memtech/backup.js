/**
 * MemTech Backup Manager
 *
 * Módulo para gestión del sistema de backup del proyecto MemTech
 * Proporciona funcionalidades de backup, restauración, verificación y sincronización
 */

import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import winston from 'winston';
import process from 'process';
import { setTimeout, clearTimeout } from 'timers';

const execAsync = promisify(exec);

class BackupManager {
  constructor(config = {}) {
    this.config = {
      project_root:
        config.project_root || process.env.PROJECT_ROOT || '/Users/felipe/Developer/startkit-main',
      backup_root:
        config.backup_root || process.env.BACKUP_ROOT || '/Users/felipe/Developer/backups',
      scripts_dir:
        config.scripts_dir ||
        path.join(process.env.PROJECT_ROOT || '.', 'packages/memtech-mcp/scripts/backup'),
      log_level: config.log_level || 'info',
      timeout_ms: config.timeout_ms || 300000, // 5 minutos
      ...config,
    };

    this.logger = winston.createLogger({
      level: this.config.log_level,
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

    this.logger.info('Backup Manager initialized', {
      project_root: this.config.project_root,
      backup_root: this.config.backup_root,
      scripts_dir: this.config.scripts_dir,
    });
  }

  async initialize() {
    try {
      // Verificar que los scripts existan
      await this.verifyScripts();

      // Verificar directorios
      await this.verifyDirectories();

      this.logger.info('Backup Manager initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Backup Manager:', error);
      throw error;
    }
  }

  async verifyScripts() {
    const requiredScripts = [
      'backup-run.sh',
      'backup-prune.sh',
      'backup-verify.sh',
      'backup-dedup.sh',
      'backup-sync.sh',
    ];

    for (const script of requiredScripts) {
      const scriptPath = path.join(this.config.scripts_dir, script);
      try {
        await fs.access(scriptPath, fs.constants.F_OK | fs.constants.X_OK);
        this.logger.debug(`Script verified: ${script}`);
      } catch (error) {
        throw new Error(`Required script not found or not executable: ${scriptPath}`);
      }
    }
  }

  async verifyDirectories() {
    const directories = [
      this.config.project_root,
      this.config.backup_root,
      path.join(this.config.backup_root, 'snapshots'),
      path.join(this.config.backup_root, 'dedup'),
      path.join(this.config.backup_root, 'logs'),
      path.join(this.config.backup_root, 'metrics'),
      path.join(this.config.backup_root, 'temp'),
    ];

    for (const dir of directories) {
      try {
        await fs.access(dir);
        this.logger.debug(`Directory verified: ${dir}`);
      } catch (error) {
        try {
          await fs.mkdir(dir, { recursive: true });
          this.logger.info(`Directory created: ${dir}`);
        } catch (mkdirError) {
          throw new Error(`Cannot access or create directory: ${dir}`);
        }
      }
    }
  }

  async executeScript(scriptName, args = [], options = {}) {
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(this.config.scripts_dir, scriptName);
      const timeout = options.timeout || this.config.timeout_ms;

      this.logger.info(`Executing script: ${scriptName}`, { args, timeout });

      const child = spawn(scriptPath, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          PROJECT_ROOT: this.config.project_root,
          BACKUP_ROOT: this.config.backup_root,
        },
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', data => {
        stdout += data.toString();
      });

      child.stderr.on('data', data => {
        stderr += data.toString();
      });

      const timer = setTimeout(() => {
        child.kill('SIGTERM');
        reject(new Error(`Script execution timeout: ${scriptName} (${timeout}ms)`));
      }, timeout);

      child.on('close', code => {
        clearTimeout(timer);

        if (code === 0) {
          this.logger.info(`Script completed successfully: ${scriptName}`, { code });
          resolve({
            success: true,
            exitCode: code,
            stdout: stdout.trim(),
            stderr: stderr.trim(),
          });
        } else {
          this.logger.error(`Script failed: ${scriptName}`, { code, stderr: stderr.trim() });
          reject(new Error(`Script ${scriptName} failed with exit code ${code}: ${stderr.trim()}`));
        }
      });

      child.on('error', error => {
        clearTimeout(timer);
        this.logger.error(`Script execution error: ${scriptName}`, error);
        reject(error);
      });
    });
  }

  // ===========================================
  // FUNCIONES PRINCIPALES DE BACKUP
  // ===========================================

  async runBackup(options = {}) {
    try {
      this.logger.info('Starting backup operation', options);

      const args = [];
      if (options.type) {
        // El tipo se determina automáticamente según la hora
        this.logger.info(`Backup type will be determined automatically`);
      }
      if (options.dryRun) {
        args.push('--dry-run');
      }

      const result = await this.executeScript('backup-run.sh', args);

      // Parsear resultados para extraer información útil
      const backupInfo = await this.parseBackupResult(result.stdout);

      this.logger.info('Backup completed successfully', backupInfo);

      return {
        success: true,
        ...backupInfo,
        raw_output: result.stdout,
      };
    } catch (error) {
      this.logger.error('Backup operation failed:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async pruneSnapshots(options = {}) {
    try {
      this.logger.info('Starting snapshot pruning', options);

      const args = [];
      if (options.dryRun) {
        args.push('--dry-run');
      }
      if (options.force) {
        args.push('--force');
      }

      const result = await this.executeScript('backup-prune.sh', args);

      const pruneInfo = await this.parsePruneResult(result.stdout);

      this.logger.info('Snapshot pruning completed', pruneInfo);

      return {
        success: true,
        ...pruneInfo,
        raw_output: result.stdout,
      };
    } catch (error) {
      this.logger.error('Snapshot pruning failed:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async verifySnapshot(snapshotName, options = {}) {
    try {
      this.logger.info('Starting snapshot verification', { snapshotName, options });

      const args = [snapshotName];
      if (options.mode) {
        args.push('--mode', options.mode);
      }

      const result = await this.executeScript('backup-verify.sh', args);

      const verifyInfo = await this.parseVerifyResult(result.stdout);

      this.logger.info('Snapshot verification completed', verifyInfo);

      return {
        success: true,
        snapshot: snapshotName,
        ...verifyInfo,
        raw_output: result.stdout,
      };
    } catch (error) {
      this.logger.error('Snapshot verification failed:', error);
      return {
        success: false,
        snapshot: snapshotName,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async deduplicateSnapshots(options = {}) {
    try {
      this.logger.info('Starting snapshot deduplication', options);

      const args = [];
      if (options.action) {
        args.push('--action', options.action);
      }
      if (options.snapshot) {
        args.push('--snapshot', options.snapshot);
      }
      if (options.mode) {
        args.push('--mode', options.mode);
      }

      const result = await this.executeScript('backup-dedup.sh', args);

      const dedupInfo = await this.parseDedupResult(result.stdout);

      this.logger.info('Snapshot deduplication completed', dedupInfo);

      return {
        success: true,
        ...dedupInfo,
        raw_output: result.stdout,
      };
    } catch (error) {
      this.logger.error('Snapshot deduplication failed:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async syncSnapshots(options = {}) {
    try {
      this.logger.info('Starting snapshot synchronization', options);

      const args = [];
      if (options.action) {
        args.push('--action', options.action);
      }
      if (options.direction) {
        args.push('--direction', options.direction);
      }
      if (options.snapshot) {
        args.push('--snapshot', options.snapshot);
      }

      const result = await this.executeScript('backup-sync.sh', args);

      const syncInfo = await this.parseSyncResult(result.stdout);

      this.logger.info('Snapshot synchronization completed', syncInfo);

      return {
        success: true,
        ...syncInfo,
        raw_output: result.stdout,
      };
    } catch (error) {
      this.logger.error('Snapshot synchronization failed:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ===========================================
  // FUNCIONES DE CONSULTA Y ESTADO
  // ===========================================

  async listSnapshots(options = {}) {
    try {
      const snapshotsDir = path.join(this.config.backup_root, 'snapshots');
      const entries = await fs.readdir(snapshotsDir, { withFileTypes: true });

      const snapshots = [];

      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('latest_')) {
          const snapshotPath = path.join(snapshotsDir, entry.name);
          const metadataPath = path.join(snapshotPath, 'snapshot_metadata.json');

          try {
            const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));
            const stats = await fs.stat(snapshotPath);

            snapshots.push({
              name: entry.name,
              path: snapshotPath,
              created_at: metadata.created_at,
              type: metadata.snapshot_type,
              size_bytes: metadata.total_size_bytes || 0,
              size_gb: (metadata.total_size_bytes || 0) / (1024 * 1024 * 1024),
              modified: stats.mtime.toISOString(),
              metadata: metadata,
            });
          } catch (error) {
            this.logger.warn(`Failed to read metadata for snapshot ${entry.name}:`, error);
            // Agregar información básica sin metadata
            const stats = await fs.stat(snapshotPath);
            snapshots.push({
              name: entry.name,
              path: snapshotPath,
              created_at: stats.mtime.toISOString(),
              type: 'unknown',
              size_bytes: 0,
              size_gb: 0,
              modified: stats.mtime.toISOString(),
              metadata: null,
              error: 'Failed to read metadata',
            });
          }
        }
      }

      // Ordenar por fecha de creación (más reciente primero)
      snapshots.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // Aplicar filtros
      let filteredSnapshots = snapshots;

      if (options.type) {
        filteredSnapshots = filteredSnapshots.filter(s => s.type === options.type);
      }

      if (options.limit) {
        filteredSnapshots = filteredSnapshots.slice(0, options.limit);
      }

      return {
        success: true,
        snapshots: filteredSnapshots,
        total_count: snapshots.length,
        filtered_count: filteredSnapshots.length,
      };
    } catch (error) {
      this.logger.error('Failed to list snapshots:', error);
      return {
        success: false,
        error: error.message,
        snapshots: [],
      };
    }
  }

  async getBackupStatus() {
    try {
      // Obtener lista de snapshots
      const snapshotsResult = await this.listSnapshots();

      if (!snapshotsResult.success) {
        throw new Error(snapshotsResult.error);
      }

      const snapshots = snapshotsResult.snapshots;

      // Calcular estadísticas
      const totalSize = snapshots.reduce((sum, s) => sum + s.size_bytes, 0);
      const snapshotsByType = {};

      snapshots.forEach(s => {
        if (!snapshotsByType[s.type]) {
          snapshotsByType[s.type] = 0;
        }
        snapshotsByType[s.type]++;
      });

      // Último backup exitoso
      const lastBackup = snapshots[0];

      // Verificar espacio disponible
      let availableSpace = 0;
      try {
        const { stdout } = await execAsync(`df -BG "${this.config.backup_root}"`);
        const match = stdout.match(/(\d+)G/);
        if (match) {
          availableSpace = parseInt(match[1]);
        }
      } catch (error) {
        this.logger.warn('Failed to get available space:', error);
      }

      return {
        success: true,
        timestamp: new Date().toISOString(),
        snapshots: {
          total_count: snapshots.length,
          total_size_bytes: totalSize,
          total_size_gb: totalSize / (1024 * 1024 * 1024),
          by_type: snapshotsByType,
        },
        last_backup: lastBackup
          ? {
              name: lastBackup.name,
              type: lastBackup.type,
              created_at: lastBackup.created_at,
              size_gb: lastBackup.size_gb,
            }
          : null,
        storage: {
          backup_root: this.config.backup_root,
          available_space_gb: availableSpace,
          usage_percent:
            availableSpace > 0 ? (totalSize / (1024 * 1024 * 1024) / availableSpace) * 100 : 0,
        },
      };
    } catch (error) {
      this.logger.error('Failed to get backup status:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ===========================================
  // FUNCIONES DE PARSEO DE RESULTADOS
  // ===========================================

  async parseBackupResult(output) {
    const lines = output.split('\n');
    const result = {
      timestamp: new Date().toISOString(),
      snapshot_name: null,
      snapshot_type: null,
      duration_seconds: 0,
      size_bytes: 0,
      files_count: 0,
    };

    for (const line of lines) {
      // Extraer nombre del snapshot
      const snapshotMatch = line.match(/Snapshot creado exitosamente: (.+)/);
      if (snapshotMatch) {
        result.snapshot_name = path.basename(snapshotMatch[1]);
      }

      // Extraer tipo
      const typeMatch = line.match(/tipo: (.+)/);
      if (typeMatch) {
        result.snapshot_type = typeMatch[1];
      }

      // Extraer duración
      const durationMatch = line.match(/Duración: (\d+)s/);
      if (durationMatch) {
        result.duration_seconds = parseInt(durationMatch[1]);
      }

      // Extraer tamaño
      const sizeMatch = line.match(/Tamaño: ([\d.]+)GB/);
      if (sizeMatch) {
        result.size_bytes = parseFloat(sizeMatch[1]) * 1024 * 1024 * 1024;
      }

      // Extraer cantidad de archivos
      const filesMatch = line.match(/Archivos transferidos: (\d+)/);
      if (filesMatch) {
        result.files_count = parseInt(filesMatch[1]);
      }
    }

    return result;
  }

  async parsePruneResult(output) {
    const lines = output.split('\n');
    const result = {
      timestamp: new Date().toISOString(),
      pruned_snapshots: 0,
      freed_space_bytes: 0,
      total_snapshots_before: 0,
      total_snapshots_after: 0,
    };

    for (const line of lines) {
      const prunedMatch = line.match(/Snapshots para podar: (\d+)/);
      if (prunedMatch) {
        result.pruned_snapshots = parseInt(prunedMatch[1]);
      }

      const spaceMatch = line.match(/liberados: ([\d.]+)GB/);
      if (spaceMatch) {
        result.freed_space_bytes = parseFloat(spaceMatch[1]) * 1024 * 1024 * 1024;
      }
    }

    return result;
  }

  async parseVerifyResult(output) {
    const lines = output.split('\n');
    const result = {
      timestamp: new Date().toISOString(),
      verified_files: 0,
      ok_files: 0,
      missing_files: 0,
      corrupted_files: 0,
      success_rate: 0,
      status: 'UNKNOWN',
    };

    for (const line of lines) {
      const verifiedMatch = line.match(/Total archivos: (\d+)/);
      if (verifiedMatch) {
        result.verified_files = parseInt(verifiedMatch[1]);
      }

      const okMatch = line.match(/Archivos OK: (\d+)/);
      if (okMatch) {
        result.ok_files = parseInt(okMatch[1]);
      }

      const missingMatch = line.match(/Archivos faltantes: (\d+)/);
      if (missingMatch) {
        result.missing_files = parseInt(missingMatch[1]);
      }

      const corruptedMatch = line.match(/Archivos corruptos: (\d+)/);
      if (corruptedMatch) {
        result.corrupted_files = parseInt(corruptedMatch[1]);
      }

      const rateMatch = line.match(/Tasa de éxito: ([\d.]+)%/);
      if (rateMatch) {
        result.success_rate = parseFloat(rateMatch[1]);
      }

      if (line.includes('Verificación completada: PASSED')) {
        result.status = 'PASSED';
      } else if (line.includes('Verificación completada: FAILED')) {
        result.status = 'FAILED';
      }
    }

    return result;
  }

  async parseDedupResult(output) {
    const lines = output.split('\n');
    const result = {
      timestamp: new Date().toISOString(),
      processed_files: 0,
      deduplicated_files: 0,
      space_saved_bytes: 0,
      deduplication_rate: 0,
    };

    for (const line of lines) {
      const processedMatch = line.match(/Archivos procesados: (\d+)/);
      if (processedMatch) {
        result.processed_files = parseInt(processedMatch[1]);
      }

      const dedupMatch = line.match(/Archivos deduplicados: (\d+)/);
      if (dedupMatch) {
        result.deduplicated_files = parseInt(dedupMatch[1]);
      }

      const spaceMatch = line.match(/Espacio ahorrado: ([\d.]+)GB/);
      if (spaceMatch) {
        result.space_saved_bytes = parseFloat(spaceMatch[1]) * 1024 * 1024 * 1024;
      }

      const rateMatch = line.match(/Tasa de deduplicación: ([\d.]+)%/);
      if (rateMatch) {
        result.deduplication_rate = parseFloat(rateMatch[1]);
      }
    }

    return result;
  }

  async parseSyncResult(output) {
    const lines = output.split('\n');
    const result = {
      timestamp: new Date().toISOString(),
      uploaded_snapshots: 0,
      downloaded_snapshots: 0,
      failed_uploads: 0,
      failed_downloads: 0,
      status: 'UNKNOWN',
    };

    for (const line of lines) {
      const uploadedMatch = line.match(/Subidos: (\d+)/);
      if (uploadedMatch) {
        result.uploaded_snapshots = parseInt(uploadedMatch[1]);
      }

      const downloadedMatch = line.match(/Descargados: (\d+)/);
      if (downloadedMatch) {
        result.downloaded_snapshots = parseInt(downloadedMatch[1]);
      }

      const failedUploadMatch = line.match(/Fallidos: (\d+)/);
      if (failedUploadMatch && line.includes('Subidos:')) {
        result.failed_uploads = parseInt(failedUploadMatch[1]);
      }

      const failedDownloadMatch = line.match(/Fallidos: (\d+)/);
      if (failedDownloadMatch && line.includes('Descargados:')) {
        result.failed_downloads = parseInt(failedDownloadMatch[1]);
      }

      if (line.includes('Sincronización completada')) {
        if (result.failed_uploads === 0 && result.failed_downloads === 0) {
          result.status = 'SUCCESS';
        } else {
          result.status = 'PARTIAL';
        }
      }
    }

    return result;
  }
}

export default BackupManager;
