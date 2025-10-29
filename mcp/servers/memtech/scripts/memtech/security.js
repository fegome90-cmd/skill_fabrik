/**
 * MemTech Security Module
 *
 * Módulo para gestión de seguridad, validación y writeBarrier
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { Buffer } from 'buffer';
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

class SecurityManager {
  constructor(config = {}) {
    this.config = {
      allowlist_path: config.allowlist_path || '.memtech/allowlist.json',
      audit_log_path: config.audit_log_path || '.memtech/audit.log',
      max_file_size_mb: config.max_file_size_mb || 100,
      blocked_extensions: config.blocked_extensions || [
        '.exe',
        '.bat',
        '.cmd',
        '.scr',
        '.pif',
        '.com',
        '.vbs',
        '.js',
        '.jar',
        '.app',
      ],
      allowed_paths: config.allowed_paths || [],
      strict_mode: config.strict_mode !== false,
      ...config,
    };

    this.allowlist = new Set();
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Asegurar que el directorio de configuración existe
      const configDir = path.dirname(this.config.allowlist_path);
      await fs.mkdir(configDir, { recursive: true });

      // Cargar allowlist
      await this.loadAllowlist();

      this.initialized = true;
      logger.info('Security Manager initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Security Manager:', error);
      throw error;
    }
  }

  async loadAllowlist() {
    try {
      try {
        const allowlistData = await fs.readFile(this.config.allowlist_path, 'utf8');
        const allowlist = JSON.parse(allowlistData);

        if (Array.isArray(allowlist.paths)) {
          this.allowlist = new Set(allowlist.paths);
        }

        logger.info(`Loaded allowlist with ${this.allowlist.size} allowed paths`);
      } catch (error) {
        logger.warn('No existing allowlist found, creating default allowlist');
        await this.createDefaultAllowlist();
      }
    } catch (error) {
      logger.error('Error loading allowlist:', error);
      throw error;
    }
  }

  async createDefaultAllowlist() {
    const defaultAllowlist = {
      version: '1.0.0',
      created_at: new Date().toISOString(),
      paths: ['.memtech/', '.checkpoints/', 'scripts/', 'reports/', 'temp/', '/tmp/memtech/'],
      description: 'Default allowlist for MemTech MCP operations',
    };

    await fs.writeFile(this.config.allowlist_path, JSON.stringify(defaultAllowlist, null, 2));

    this.allowlist = new Set(defaultAllowlist.paths);
    logger.info('Created default allowlist');
  }

  async saveAllowlist() {
    try {
      const allowlistData = {
        version: '1.0.0',
        updated_at: new Date().toISOString(),
        paths: Array.from(this.allowlist),
        description: 'Allowlist for MemTech MCP operations',
      };

      await fs.writeFile(this.config.allowlist_path, JSON.stringify(allowlistData, null, 2));

      logger.debug('Allowlist saved successfully');
    } catch (error) {
      logger.error('Error saving allowlist:', error);
      throw error;
    }
  }

  async addToAllowlist(pathToAdd) {
    await this.initialize();

    try {
      const resolvedPath = path.resolve(pathToAdd);

      if (!this.allowlist.has(resolvedPath)) {
        this.allowlist.add(resolvedPath);
        await this.saveAllowlist();

        logger.info(`Added to allowlist: ${resolvedPath}`);
        return {
          success: true,
          path: resolvedPath,
          added_at: new Date().toISOString(),
        };
      }

      return {
        success: true,
        path: resolvedPath,
        message: 'Path already in allowlist',
      };
    } catch (error) {
      logger.error(`Error adding ${pathToAdd} to allowlist:`, error);
      throw new Error(`Failed to add to allowlist: ${error.message}`);
    }
  }

  async removeFromAllowlist(pathToRemove) {
    await this.initialize();

    try {
      const resolvedPath = path.resolve(pathToRemove);

      if (this.allowlist.has(resolvedPath)) {
        this.allowlist.delete(resolvedPath);
        await this.saveAllowlist();

        logger.info(`Removed from allowlist: ${resolvedPath}`);
        return {
          success: true,
          path: resolvedPath,
          removed_at: new Date().toISOString(),
        };
      }

      return {
        success: true,
        path: resolvedPath,
        message: 'Path not found in allowlist',
      };
    } catch (error) {
      logger.error(`Error removing ${pathToRemove} from allowlist:`, error);
      throw new Error(`Failed to remove from allowlist: ${error.message}`);
    }
  }

  isPathAllowed(targetPath) {
    const resolvedPath = path.resolve(targetPath);

    // Verificar si el path está en la allowlist
    for (const allowedPath of this.allowlist) {
      if (resolvedPath.startsWith(allowedPath)) {
        return true;
      }
    }

    return false;
  }

  validatePath(targetPath) {
    const resolvedPath = path.resolve(targetPath);

    // Verificar extensiones bloqueadas
    const ext = path.extname(resolvedPath).toLowerCase();
    if (this.config.blocked_extensions.includes(ext)) {
      throw new Error(`File extension ${ext} is not allowed`);
    }

    // Verificar si está en la allowlist
    if (!this.isPathAllowed(resolvedPath)) {
      throw new Error(`Path ${resolvedPath} is not in allowlist`);
    }

    return true;
  }

  async writeBarrier(targetPath, content, ifMatch = null) {
    await this.initialize();

    try {
      logger.info(`Write barrier operation for: ${targetPath}`);

      // Validar el path
      this.validatePath(targetPath);

      // Verificar si el archivo existe
      let existingHash = null;
      let fileExists = false;

      try {
        const existingContent = await fs.readFile(targetPath, 'utf8');
        existingHash = crypto.createHash('sha256').update(existingContent).digest('hex');
        fileExists = true;
      } catch (error) {
        // El archivo no existe, lo cual está bien para nuevas creaciones
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }

      // Verificar condición ifMatch si se proporcionó
      if (ifMatch !== null) {
        if (!fileExists) {
          throw new Error('File does not exist, cannot verify ifMatch condition');
        }

        if (existingHash !== ifMatch) {
          throw new Error(
            `Content mismatch. Expected hash: ${ifMatch}, Actual hash: ${existingHash}`
          );
        }
      }

      // Verificar tamaño del contenido
      const contentSize = Buffer.byteLength(content, 'utf8');
      const maxSizeBytes = this.config.max_file_size_mb * 1024 * 1024;

      if (contentSize > maxSizeBytes) {
        throw new Error(
          `Content size ${contentSize} bytes exceeds maximum allowed size ${maxSizeBytes} bytes`
        );
      }

      // Crear backup si el archivo existe
      let backupPath = null;
      if (fileExists) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupDir = path.join(path.dirname(targetPath), '.backups');
        await fs.mkdir(backupDir, { recursive: true });

        const filename = path.basename(targetPath);
        backupPath = path.join(backupDir, `${filename}.${timestamp}.backup`);

        await fs.copyFile(targetPath, backupPath);
        logger.info(`Created backup: ${backupPath}`);
      }

      // Escribir el nuevo contenido
      await fs.writeFile(targetPath, content, 'utf8');

      // Calcular hash del nuevo contenido
      const newHash = crypto.createHash('sha256').update(content).digest('hex');

      // Registrar en audit log
      await this.auditLog('write_barrier', {
        target_path: targetPath,
        backup_path: backupPath,
        content_size: contentSize,
        previous_hash: existingHash,
        new_hash: newHash,
        if_match: ifMatch,
        success: true,
      });

      logger.info(`Write barrier completed successfully for: ${targetPath}`);

      return {
        success: true,
        path: targetPath,
        backup_path: backupPath,
        content_size: contentSize,
        previous_hash: existingHash,
        new_hash: newHash,
        written_at: new Date().toISOString(),
      };
    } catch (error) {
      logger.error(`Write barrier failed for ${targetPath}:`, error);

      // Registrar error en audit log
      await this.auditLog('write_barrier', {
        target_path: targetPath,
        error: error.message,
        success: false,
      });

      throw new Error(`Write barrier failed: ${error.message}`);
    }
  }

  async auditLog(operation, details) {
    try {
      const auditEntry = {
        timestamp: new Date().toISOString(),
        operation,
        details,
        user: process.env.USER || 'unknown',
        pid: process.pid,
      };

      const logLine = JSON.stringify(auditEntry) + '\n';

      // Asegurar que el directorio del audit log existe
      const logDir = path.dirname(this.config.audit_log_path);
      await fs.mkdir(logDir, { recursive: true });

      // Escribir en el audit log
      await fs.appendFile(this.config.audit_log_path, logLine);

      logger.debug(`Audit log entry written for operation: ${operation}`);
    } catch (error) {
      logger.error('Error writing to audit log:', error);
      // No lanzar error para no interrumpir la operación principal
    }
  }

  async getAllowlistStatus() {
    await this.initialize();

    try {
      return {
        total_paths: this.allowlist.size,
        paths: Array.from(this.allowlist),
        strict_mode: this.config.strict_mode,
        max_file_size_mb: this.config.max_file_size_mb,
        blocked_extensions: this.config.blocked_extensions,
        checked_at: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error getting allowlist status:', error);
      throw new Error(`Failed to get allowlist status: ${error.message}`);
    }
  }

  async validateOperation(operation, targetPath, options = {}) {
    await this.initialize();

    try {
      const validationResult = {
        operation,
        target_path: targetPath,
        allowed: false,
        reasons: [],
        validated_at: new Date().toISOString(),
      };

      // Validar path
      try {
        this.validatePath(targetPath);
        validationResult.allowed = true;
      } catch (error) {
        validationResult.reasons.push(error.message);
      }

      // Validaciones adicionales según el tipo de operación
      switch (operation) {
        case 'read':
          // Para operaciones de lectura, solo verificamos el path
          break;

        case 'write':
          // Para escritura, verificamos tamaño si se proporciona
          if (options.content_size) {
            const maxSizeBytes = this.config.max_file_size_mb * 1024 * 1024;
            if (options.content_size > maxSizeBytes) {
              validationResult.allowed = false;
              validationResult.reasons.push(`Content size exceeds maximum allowed size`);
            }
          }
          break;

        case 'delete':
          // Para eliminación, verificamos si está en modo estricto
          if (this.config.strict_mode && !this.isPathAllowed(targetPath)) {
            validationResult.allowed = false;
            validationResult.reasons.push(
              'Delete operations not allowed in strict mode for non-allowlisted paths'
            );
          }
          break;

        default:
          validationResult.reasons.push(`Unknown operation: ${operation}`);
      }

      // Registrar validación en audit log
      await this.auditLog('validation', validationResult);

      return validationResult;
    } catch (error) {
      logger.error(`Error validating operation ${operation} for ${targetPath}:`, error);
      throw new Error(`Validation failed: ${error.message}`);
    }
  }
}

export default SecurityManager;
