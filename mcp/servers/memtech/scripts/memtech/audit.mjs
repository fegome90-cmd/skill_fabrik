#!/usr/bin/env node

/**
 * MemTech Audit Module
 * 
 * Módulo para auditoría rápida de cambios del sistema
 * Proporciona herramientas para detectar y analizar cambios en el sistema
 */

import fs from 'fs/promises';
import path from 'path';
import process from 'process';
import winston from 'winston';
import crypto from 'crypto';

// Importar módulos de MemTech
import MemoryManager from './memory.js';
import CheckpointManager from './checkpoints.js';
import VictoriaMetricsManager from './vm.js';
import GrafanaManager from './grafana.js';
import SystemManager from './system.js';

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

class AuditManager {
  constructor(config = {}) {
    this.config = {
      storage_path: config.storage_path || '.memtech/audit',
      max_audit_reports: config.max_audit_reports || 100,
      auto_save: config.auto_save !== false,
      check_interval_hours: config.check_interval_hours || 24,
      ...config
    };
    
    this.auditReports = new Map();
    this.baselineData = new Map();
    this.initialized = false;
    
    // Inicializar managers
    this.memoryManager = new MemoryManager({
      storage_path: '.memtech/memory',
      max_items: 10000
    });
    
    this.checkpointManager = new CheckpointManager({
      storage_path: '.checkpoints',
      max_checkpoints: 50
    });
    
    this.vmManager = new VictoriaMetricsManager({
      vm_url: process.env.VICTORIA_METRICS_URL || 'http://localhost:8428'
    });
    
    this.grafanaManager = new GrafanaManager({
      grafana_url: process.env.GRAFANA_URL || 'http://localhost:3000'
    });
    
    this.systemManager = new SystemManager();
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      // Asegurar que los directorios necesarios existen
      await fs.mkdir(this.config.storage_path, { recursive: true });
      
      // Inicializar managers
      await this.memoryManager.initialize();
      await this.checkpointManager.initialize();
      await this.vmManager.initialize();
      await this.grafanaManager.initialize();
      await this.systemManager.initialize();
      
      // Cargar reportes de auditoría existentes
      await this.loadAuditReports();
      
      // Cargar datos baseline
      await this.loadBaselineData();
      
      // Crear baseline si no existe
      await this.ensureBaseline();
      
      this.initialized = true;
      logger.info('Audit Manager initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Audit Manager:', error);
      throw error;
    }
  }

  async loadAuditReports() {
    try {
      const reportsPath = path.join(this.config.storage_path, 'reports.json');
      
      try {
        const reportsData = await fs.readFile(reportsPath, 'utf8');
        const reports = JSON.parse(reportsData);
        this.auditReports = new Map(Object.entries(reports));
        logger.info(`Loaded ${this.auditReports.size} audit reports`);
      } catch (error) {
        logger.warn('No existing audit reports found, starting with empty reports');
        this.auditReports = new Map();
      }
    } catch (error) {
      logger.error('Error loading audit reports:', error);
      throw error;
    }
  }

  async saveAuditReports() {
    try {
      const reportsPath = path.join(this.config.storage_path, 'reports.json');
      const reportsObject = Object.fromEntries(this.auditReports);
      await fs.writeFile(reportsPath, JSON.stringify(reportsObject, null, 2));
      logger.debug('Audit reports saved successfully');
    } catch (error) {
      logger.error('Error saving audit reports:', error);
      throw error;
    }
  }

  async loadBaselineData() {
    try {
      const baselinePath = path.join(this.config.storage_path, 'baseline.json');
      
      try {
        const baselineData = await fs.readFile(baselinePath, 'utf8');
        const baseline = JSON.parse(baselineData);
        this.baselineData = new Map(Object.entries(baseline));
        logger.info('Baseline data loaded successfully');
      } catch (error) {
        logger.warn('No baseline data found, will create new baseline');
        this.baselineData = new Map();
      }
    } catch (error) {
      logger.error('Error loading baseline data:', error);
      throw error;
    }
  }

  async saveBaselineData() {
    try {
      const baselinePath = path.join(this.config.storage_path, 'baseline.json');
      const baselineObject = Object.fromEntries(this.baselineData);
      await fs.writeFile(baselinePath, JSON.stringify(baselineObject, null, 2));
      logger.debug('Baseline data saved successfully');
    } catch (error) {
      logger.error('Error saving baseline data:', error);
      throw error;
    }
  }

  async ensureBaseline() {
    if (this.baselineData.size === 0) {
      logger.info('Creating new baseline data');
      await this.createBaseline();
    }
  }

  async createBaseline() {
    try {
      const baseline = {
        timestamp: new Date().toISOString(),
        system_info: await this.captureSystemInfo(),
        filesystem_snapshot: await this.captureFilesystemSnapshot(),
        memory_snapshot: await this.captureMemorySnapshot(),
        checkpoint_snapshot: await this.captureCheckpointSnapshot(),
        metrics_snapshot: await this.captureMetricsSnapshot(),
        configuration_snapshot: await this.captureConfigurationSnapshot()
      };
      
      // Generar hash del baseline
      baseline.hash = this.generateBaselineHash(baseline);
      
      this.baselineData.set('current', baseline);
      await this.saveBaselineData();
      
      logger.info('Baseline created successfully');
      return baseline;
    } catch (error) {
      logger.error('Error creating baseline:', error);
      throw error;
    }
  }

  async captureSystemInfo() {
    try {
      const systemInfo = await this.systemManager.checkSystemInfo();
      return {
        status: systemInfo.status,
        data: systemInfo.data,
        captured_at: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        captured_at: new Date().toISOString()
      };
    }
  }

  async captureFilesystemSnapshot() {
    try {
      const criticalPaths = [
        '.memtech/config.yaml',
        '.memtech/policies/default.json',
        'package.json',
        '.env.example',
        'scripts/memtech/',
        'config/'
      ];
      
      const snapshot = {};
      
      for (const filePath of criticalPaths) {
        try {
          const stats = await fs.stat(filePath);
          const hash = await this.calculateFileHash(filePath);
          
          snapshot[filePath] = {
            exists: true,
            size: stats.size,
            modified: stats.mtime.toISOString(),
            hash,
            is_directory: stats.isDirectory()
          };
          
          if (stats.isDirectory()) {
            snapshot[filePath].files = await this.getDirectoryFiles(filePath);
          }
        } catch (error) {
          snapshot[filePath] = {
            exists: false,
            error: error.message
          };
        }
      }
      
      return {
        paths: snapshot,
        captured_at: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        captured_at: new Date().toISOString()
      };
    }
  }

  async getDirectoryFiles(dirPath) {
    try {
      const files = [];
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        try {
          const stats = await fs.stat(fullPath);
          const fileInfo = {
            name: entry.name,
            path: fullPath,
            size: stats.size,
            modified: stats.mtime.toISOString(),
            is_directory: stats.isDirectory()
          };
          
          if (!stats.isDirectory()) {
            fileInfo.hash = await this.calculateFileHash(fullPath);
          }
          
          files.push(fileInfo);
        } catch (error) {
          files.push({
            name: entry.name,
            path: fullPath,
            error: error.message
          });
        }
      }
      
      return files;
    } catch (error) {
      return [];
    }
  }

  async calculateFileHash(filePath) {
    try {
      const content = await fs.readFile(filePath);
      return crypto.createHash('sha256').update(content).digest('hex');
    } catch (error) {
      return null;
    }
  }

  async captureMemorySnapshot() {
    try {
      const stats = await this.memoryManager.getStats();
      const recentItems = await this.memoryManager.search(['recent', 'audit']);
      
      return {
        stats,
        recent_items_count: recentItems.count,
        captured_at: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        captured_at: new Date().toISOString()
      };
    }
  }

  async captureCheckpointSnapshot() {
    try {
      const checkpoints = await this.checkpointManager.listCheckpoints('', 10);
      const stats = await this.checkpointManager.getCheckpointStats();
      
      return {
        stats,
        recent_checkpoints: checkpoints.checkpoints,
        captured_at: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        captured_at: new Date().toISOString()
      };
    }
  }

  async captureMetricsSnapshot() {
    try {
      const metrics = await this.vmManager.getMetricsOverview();
      
      return {
        metrics,
        captured_at: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        captured_at: new Date().toISOString()
      };
    }
  }

  async captureConfigurationSnapshot() {
    try {
      const health = await this.systemManager.health();
      
      return {
        system_health: health.overall_status,
        alerts_count: health.alerts.length,
        critical_alerts: health.alerts.filter(a => a.severity === 'critical').length,
        captured_at: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        captured_at: new Date().toISOString()
      };
    }
  }

  generateBaselineHash(baseline) {
    const hashData = JSON.stringify(baseline, Object.keys(baseline).sort());
    return crypto.createHash('sha256').update(hashData).digest('hex');
  }

  async quickAuditChanges(options = {}) {
    await this.initialize();
    
    try {
      logger.info('Starting quick audit of changes');
      
      const auditId = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const audit = {
        audit_id: auditId,
        type: 'quick',
        timestamp: new Date().toISOString(),
        options,
        baseline: this.baselineData.get('current'),
        current: await this.captureCurrentState(),
        changes: {},
        summary: {
          total_changes: 0,
          critical_changes: 0,
          warning_changes: 0,
          info_changes: 0
        }
      };
      
      // Analizar cambios
      audit.changes = await this.analyzeChanges(audit.baseline, audit.current);
      
      // Calcular resumen
      for (const change of Object.values(audit.changes)) {
        audit.summary.total_changes++;
        if (change.severity === 'critical') {
          audit.summary.critical_changes++;
        } else if (change.severity === 'warning') {
          audit.summary.warning_changes++;
        } else {
          audit.summary.info_changes++;
        }
      }
      
      audit.overall_status = audit.summary.critical_changes > 0 ? 'critical' :
                           audit.summary.warning_changes > 0 ? 'warning' : 'healthy';
      
      // Guardar auditoría
      this.auditReports.set(auditId, audit);
      await this.saveAuditReports();
      
      // Guardar en memoria para referencia
      await this.memoryManager.addItem({
        title: `Quick Audit ${auditId}`,
        description: 'Auditoría rápida de cambios del sistema',
        content: JSON.stringify(audit, null, 2),
        tags: ['audit', 'quick', 'changes', 'system']
      });
      
      // Limpiar auditorías antiguas
      await this.cleanupOldAudits();
      
      logger.info(`Quick audit completed: ${audit.overall_status} (${audit.summary.total_changes} changes)`);
      
      return audit;
    } catch (error) {
      logger.error('Error during quick audit:', error);
      throw new Error(`Quick audit failed: ${error.message}`);
    }
  }

  async captureCurrentState() {
    return {
      timestamp: new Date().toISOString(),
      system_info: await this.captureSystemInfo(),
      filesystem_snapshot: await this.captureFilesystemSnapshot(),
      memory_snapshot: await this.captureMemorySnapshot(),
      checkpoint_snapshot: await this.captureCheckpointSnapshot(),
      metrics_snapshot: await this.captureMetricsSnapshot(),
      configuration_snapshot: await this.captureConfigurationSnapshot()
    };
  }

  async analyzeChanges(baseline, current) {
    const changes = {};
    
    // Analizar cambios en información del sistema
    changes.system_info = this.analyzeSystemInfoChanges(
      baseline.system_info,
      current.system_info
    );
    
    // Analizar cambios en filesystem
    changes.filesystem = this.analyzeFilesystemChanges(
      baseline.filesystem_snapshot,
      current.filesystem_snapshot
    );
    
    // Analizar cambios en memoria
    changes.memory = this.analyzeMemoryChanges(
      baseline.memory_snapshot,
      current.memory_snapshot
    );
    
    // Analizar cambios en checkpoints
    changes.checkpoints = this.analyzeCheckpointChanges(
      baseline.checkpoint_snapshot,
      current.checkpoint_snapshot
    );
    
    // Analizar cambios en métricas
    changes.metrics = this.analyzeMetricsChanges(
      baseline.metrics_snapshot,
      current.metrics_snapshot
    );
    
    // Analizar cambios en configuración
    changes.configuration = this.analyzeConfigurationChanges(
      baseline.configuration_snapshot,
      current.configuration_snapshot
    );
    
    return changes;
  }

  analyzeSystemInfoChanges(baseline, current) {
    const changes = {
      type: 'system_info',
      severity: 'info',
      changes: []
    };
    
    if (!baseline || !current) {
      changes.severity = 'warning';
      changes.changes.push({
        type: 'missing_data',
        description: 'No se puede comparar información del sistema'
      });
      return changes;
    }
    
    // Comparar uptime
    if (baseline.data?.uptime && current.data?.uptime) {
      const uptimeDiff = Math.abs(baseline.data.uptime - current.data.uptime);
      if (uptimeDiff > 3600) { // Más de 1 hora de diferencia
        changes.severity = 'warning';
        changes.changes.push({
          type: 'uptime_change',
          description: `El sistema ha sido reiniciado (diferencia de uptime: ${Math.round(uptimeDiff / 3600)} horas)`,
          baseline: baseline.data.uptime,
          current: current.data.uptime
        });
      }
    }
    
    // Comparar memoria total
    if (baseline.data?.totalmem && current.data?.totalmem) {
      if (baseline.data.totalmem !== current.data.totalmem) {
        changes.severity = 'critical';
        changes.changes.push({
          type: 'memory_change',
          description: 'La memoria total del sistema ha cambiado',
          baseline: baseline.data.totalmem,
          current: current.data.totalmem
        });
      }
    }
    
    return changes;
  }

  analyzeFilesystemChanges(baseline, current) {
    const changes = {
      type: 'filesystem',
      severity: 'info',
      changes: []
    };
    
    if (!baseline?.paths || !current?.paths) {
      changes.severity = 'warning';
      changes.changes.push({
        type: 'missing_data',
        description: 'No se puede comparar snapshot del filesystem'
      });
      return changes;
    }
    
    // Analizar cambios en cada archivo crítico
    for (const [filePath, baselineInfo] of Object.entries(baseline.paths)) {
      const currentInfo = current.paths[filePath];
      
      if (!currentInfo) {
        changes.severity = 'warning';
        changes.changes.push({
          type: 'file_missing',
          description: `Archivo crítico faltante: ${filePath}`,
          path: filePath
        });
        continue;
      }
      
      // Verificar cambios en archivos
      if (!baselineInfo.is_directory && !currentInfo.is_directory) {
        if (baselineInfo.hash !== currentInfo.hash) {
          changes.severity = 'warning';
          changes.changes.push({
            type: 'file_modified',
            description: `Archivo modificado: ${filePath}`,
            path: filePath,
            baseline_hash: baselineInfo.hash,
            current_hash: currentInfo.hash,
            modified_time: currentInfo.modified
          });
        }
      }
      
      // Verificar cambios en directorios
      if (baselineInfo.is_directory && currentInfo.is_directory) {
        const dirChanges = this.analyzeDirectoryChanges(
          filePath,
          baselineInfo.files || [],
          currentInfo.files || []
        );
        
        if (dirChanges.length > 0) {
          changes.severity = 'warning';
          changes.changes.push(...dirChanges);
        }
      }
    }
    
    // Verificar nuevos archivos
    for (const [filePath, currentInfo] of Object.entries(current.paths)) {
      if (!baseline.paths[filePath] && currentInfo.exists) {
        changes.changes.push({
          type: 'file_added',
          description: `Nuevo archivo detectado: ${filePath}`,
          path: filePath,
          added_time: currentInfo.modified
        });
      }
    }
    
    return changes;
  }

  analyzeDirectoryChanges(dirPath, baselineFiles, currentFiles) {
    const changes = [];
    
    const baselineFileMap = new Map(baselineFiles.map(f => [f.name, f]));
    const currentFileMap = new Map(currentFiles.map(f => [f.name, f]));
    
    // Verificar archivos eliminados
    for (const [fileName] of baselineFileMap) {
      if (!currentFileMap.has(fileName)) {
        changes.push({
          type: 'file_removed',
          description: `Archivo eliminado en ${dirPath}: ${fileName}`,
          path: path.join(dirPath, fileName),
          directory: dirPath
        });
      }
    }
    
    // Verificar archivos agregados
    for (const [fileName, currentFile] of currentFileMap) {
      if (!baselineFileMap.has(fileName)) {
        changes.push({
          type: 'file_added',
          description: `Archivo agregado en ${dirPath}: ${fileName}`,
          path: path.join(dirPath, fileName),
          directory: dirPath,
          added_time: currentFile.modified
        });
      }
    }
    
    // Verificar archivos modificados
    for (const [fileName, currentFile] of currentFileMap) {
      const baselineFile = baselineFileMap.get(fileName);
      if (baselineFile && !currentFile.is_directory) {
        if (baselineFile.hash !== currentFile.hash) {
          changes.push({
            type: 'file_modified',
            description: `Archivo modificado en ${dirPath}: ${fileName}`,
            path: path.join(dirPath, fileName),
            directory: dirPath,
            baseline_hash: baselineFile.hash,
            current_hash: currentFile.hash,
            modified_time: currentFile.modified
          });
        }
      }
    }
    
    return changes;
  }

  analyzeMemoryChanges(baseline, current) {
    const changes = {
      type: 'memory',
      severity: 'info',
      changes: []
    };
    
    if (!baseline?.stats || !current?.stats) {
      changes.severity = 'warning';
      changes.changes.push({
        type: 'missing_data',
        description: 'No se puede comparar snapshot de memoria'
      });
      return changes;
    }
    
    // Comparar número de items
    const itemsDiff = current.stats.total_items - baseline.stats.total_items;
    if (Math.abs(itemsDiff) > 100) {
      changes.severity = 'warning';
      changes.changes.push({
        type: 'items_count_change',
        description: `Cambio significativo en el número de items de memoria: ${itemsDiff > 0 ? '+' : ''}${itemsDiff}`,
        baseline: baseline.stats.total_items,
        current: current.stats.total_items,
        difference: itemsDiff
      });
    }
    
    // Comparar tamaño de almacenamiento
    const sizeDiff = parseFloat(current.stats.storage_size_mb) - parseFloat(baseline.stats.storage_size_mb);
    if (Math.abs(sizeDiff) > 50) {
      changes.severity = 'warning';
      changes.changes.push({
        type: 'storage_size_change',
        description: `Cambio significativo en el tamaño de almacenamiento: ${sizeDiff > 0 ? '+' : ''}${sizeDiff.toFixed(2)}MB`,
        baseline: baseline.stats.storage_size_mb,
        current: current.stats.storage_size_mb,
        difference: sizeDiff
      });
    }
    
    return changes;
  }

  analyzeCheckpointChanges(baseline, current) {
    const changes = {
      type: 'checkpoints',
      severity: 'info',
      changes: []
    };
    
    if (!baseline?.recent_checkpoints || !current?.recent_checkpoints) {
      changes.severity = 'warning';
      changes.changes.push({
        type: 'missing_data',
        description: 'No se puede comparar snapshot de checkpoints'
      });
      return changes;
    }
    
    // Verificar si hay nuevos checkpoints
    const baselineIds = new Set(baseline.recent_checkpoints.map(cp => cp.id));
    const currentIds = new Set(current.recent_checkpoints.map(cp => cp.id));
    
    for (const checkpointId of currentIds) {
      if (!baselineIds.has(checkpointId)) {
        const checkpoint = current.recent_checkpoints.find(cp => cp.id === checkpointId);
        changes.changes.push({
          type: 'checkpoint_created',
          description: `Nuevo checkpoint creado: ${checkpoint.name}`,
          checkpoint_id: checkpointId,
          checkpoint_name: checkpoint.name,
          created_at: checkpoint.created_at
        });
      }
    }
    
    // Verificar si el checkpoint más reciente es muy antiguo
    if (current.recent_checkpoints.length > 0) {
      const latestCheckpoint = current.recent_checkpoints[0];
      const latestTime = new Date(latestCheckpoint.created_at);
      const now = new Date();
      const hoursDiff = (now - latestTime) / (1000 * 60 * 60);
      
      if (hoursDiff > 48) {
        changes.severity = 'warning';
        changes.changes.push({
          type: 'old_checkpoint',
          description: `El checkpoint más reciente es antiguo: ${Math.round(hoursDiff)} horas`,
          latest_checkpoint: latestCheckpoint.name,
          hours_since_latest: hoursDiff
        });
      }
    }
    
    return changes;
  }

  analyzeMetricsChanges(baseline, current) {
    const changes = {
      type: 'metrics',
      severity: 'info',
      changes: []
    };
    
    if (!baseline?.metrics || !current?.metrics) {
      changes.severity = 'warning';
      changes.changes.push({
        type: 'missing_data',
        description: 'No se puede comparar snapshot de métricas'
      });
      return changes;
    }
    
    // Analizar cambios en métricas clave
    const keyMetrics = ['total_series', 'total_samples', 'data_size_bytes'];
    
    for (const metric of keyMetrics) {
      const baselineValue = baseline.metrics.metrics?.[metric];
      const currentValue = current.metrics.metrics?.[metric];
      
      if (baselineValue !== undefined && currentValue !== undefined) {
        const percentChange = ((currentValue - baselineValue) / baselineValue) * 100;
        
        if (Math.abs(percentChange) > 20) {
          changes.severity = 'warning';
          changes.changes.push({
            type: 'metric_change',
            description: `Cambio significativo en métrica ${metric}: ${percentChange > 0 ? '+' : ''}${percentChange.toFixed(2)}%`,
            metric,
            baseline: baselineValue,
            current: currentValue,
            percent_change: percentChange
          });
        }
      }
    }
    
    return changes;
  }

  analyzeConfigurationChanges(baseline, current) {
    const changes = {
      type: 'configuration',
      severity: 'info',
      changes: []
    };
    
    if (!baseline || !current) {
      changes.severity = 'warning';
      changes.changes.push({
        type: 'missing_data',
        description: 'No se puede comparar snapshot de configuración'
      });
      return changes;
    }
    
    // Comparar estado de salud del sistema
    if (baseline.system_health !== current.system_health) {
      changes.severity = 'warning';
      changes.changes.push({
        type: 'health_status_change',
        description: `Cambio en el estado de salud del sistema: ${baseline.system_health} → ${current.system_health}`,
        baseline: baseline.system_health,
        current: current.system_health
      });
    }
    
    // Comparar número de alertas críticas
    const criticalDiff = current.critical_alerts - baseline.critical_alerts;
    if (criticalDiff > 0) {
      changes.severity = 'critical';
      changes.changes.push({
        type: 'critical_alerts_increase',
        description: `Aumento en el número de alertas críticas: +${criticalDiff}`,
        baseline: baseline.critical_alerts,
        current: current.critical_alerts,
        difference: criticalDiff
      });
    }
    
    return changes;
  }

  async cleanupOldAudits() {
    try {
      if (this.auditReports.size <= this.config.max_audit_reports) {
        return;
      }
      
      // Ordenar auditorías por timestamp (más antiguo primero)
      const sortedAudits = Array.from(this.auditReports.entries())
        .sort((a, b) => new Date(a[1].timestamp) - new Date(b[1].timestamp));
      
      // Eliminar auditorías excedentes
      const toDelete = sortedAudits.slice(0, this.auditReports.size - this.config.max_audit_reports);
      
      for (const [auditId] of toDelete) {
        this.auditReports.delete(auditId);
        logger.info(`Deleted old audit: ${auditId}`);
      }
      
      await this.saveAuditReports();
    } catch (error) {
      logger.error('Error cleaning up old audits:', error);
    }
  }

  async getAuditReport(auditId) {
    await this.initialize();
    
    if (!this.auditReports.has(auditId)) {
      throw new Error(`Audit report not found: ${auditId}`);
    }
    
    return this.auditReports.get(auditId);
  }

  async listAuditReports(limit = 20) {
    await this.initialize();
    
    const reports = Array.from(this.auditReports.values())
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
    
    return {
      reports,
      count: reports.length,
      total_reports: this.auditReports.size,
      listed_at: new Date().toISOString()
    };
  }

  async updateBaseline() {
    await this.initialize();
    
    try {
      logger.info('Updating baseline data');
      
      const newBaseline = await this.createBaseline();
      
      // Guardar baseline anterior como histórico
      const currentBaseline = this.baselineData.get('current');
      if (currentBaseline) {
        const historicalId = `baseline_${Date.now()}`;
        this.baselineData.set(historicalId, currentBaseline);
      }
      
      // Establecer nuevo baseline como actual
      this.baselineData.set('current', newBaseline);
      await this.saveBaselineData();
      
      logger.info('Baseline updated successfully');
      return newBaseline;
    } catch (error) {
      logger.error('Error updating baseline:', error);
      throw new Error(`Failed to update baseline: ${error.message}`);
    }
  }

  async generateAuditSummary(days = 7) {
    await this.initialize();
    
    try {
      const cutoffDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
      
      const recentAudits = Array.from(this.auditReports.values())
        .filter(audit => new Date(audit.timestamp) >= cutoffDate);
      
      const summary = {
        period_days: days,
        total_audits: recentAudits.length,
        overall_status: 'healthy',
        change_types: {},
        severity_distribution: {
          critical: 0,
          warning: 0,
          info: 0
        },
        trends: {},
        recommendations: [],
        generated_at: new Date().toISOString()
      };
      
      // Analizar auditorías recientes
      for (const audit of recentAudits) {
        // Actualizar distribución de severidad
        for (const [changeType, changeData] of Object.entries(audit.changes)) {
          if (!summary.change_types[changeType]) {
            summary.change_types[changeType] = {
              count: 0,
              severity: 'info'
            };
          }
          
          summary.change_types[changeType].count++;
          
          if (changeData.severity === 'critical') {
            summary.severity_distribution.critical++;
            summary.change_types[changeType].severity = 'critical';
          } else if (changeData.severity === 'warning') {
            summary.severity_distribution.warning++;
            if (summary.change_types[changeType].severity === 'info') {
              summary.change_types[changeType].severity = 'warning';
            }
          } else {
            summary.severity_distribution.info++;
          }
        }
        
        // Actualizar estado general
        if (audit.overall_status === 'critical') {
          summary.overall_status = 'critical';
        } else if (audit.overall_status === 'warning' && summary.overall_status === 'healthy') {
          summary.overall_status = 'warning';
        }
      }
      
      // Generar recomendaciones
      summary.recommendations = this.generateAuditRecommendations(summary);
      
      return summary;
    } catch (error) {
      logger.error('Error generating audit summary:', error);
      throw new Error(`Failed to generate audit summary: ${error.message}`);
    }
  }

  generateAuditRecommendations(summary) {
    const recommendations = [];
    
    if (summary.severity_distribution.critical > 0) {
      recommendations.push({
        priority: 'high',
        message: `${summary.severity_distribution.critical} cambios críticos detectados en los últimos ${summary.period_days} días`,
        action: 'Investigar cambios críticos inmediatamente'
      });
    }
    
    if (summary.severity_distribution.warning > 5) {
      recommendations.push({
        priority: 'medium',
        message: `${summary.severity_distribution.warning} cambios con advertencia detectados`,
        action: 'Revisar cambios frecuentes y considerar ajustes en configuración'
      });
    }
    
    if (summary.change_types.filesystem?.count > 10) {
      recommendations.push({
        priority: 'medium',
        message: 'Alta frecuencia de cambios en archivos del sistema',
        action: 'Monitorear cambios críticos y considerar políticas de control de cambios'
      });
    }
    
    if (summary.change_types.configuration?.severity === 'critical') {
      recommendations.push({
        priority: 'high',
        message: 'Cambios críticos detectados en la configuración del sistema',
        action: 'Revisar configuración y validar estabilidad del sistema'
      });
    }
    
    if (summary.total_audits === 0) {
      recommendations.push({
        priority: 'low',
        message: 'No hay auditorías recientes',
        action: 'Configurar auditorías automáticas periódicas'
      });
    }
    
    return recommendations;
  }
}

export default AuditManager;
