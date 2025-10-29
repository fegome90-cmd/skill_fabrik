#!/usr/bin/env node

/**
 * MemTech Shortcuts Operativos
 * 
 * Módulo para shortcuts operativos y comandos rápidos para operaciones diarias
 * Proporciona acceso rápido a funciones comunes de MemTech
 */

import fs from 'fs/promises';
import path from 'path';
import process from 'process';
import winston from 'winston';

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

class ShortcutsManager {
  constructor(config = {}) {
    this.config = {
      storage_path: config.storage_path || '.memtech/shortcuts',
      context_pack_path: config.context_pack_path || '.memtech/context',
      max_shortcuts: config.max_shortcuts || 100,
      auto_save: config.auto_save !== false,
      ...config
    };
    
    this.shortcuts = new Map();
    this.contextPacks = new Map();
    this.goldenQueries = new Map();
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
      await fs.mkdir(this.config.context_pack_path, { recursive: true });
      
      // Inicializar managers
      await this.memoryManager.initialize();
      await this.checkpointManager.initialize();
      await this.vmManager.initialize();
      await this.grafanaManager.initialize();
      await this.systemManager.initialize();
      
      // Cargar shortcuts existentes
      await this.loadShortcuts();
      
      // Cargar context packs
      await this.loadContextPacks();
      
      // Cargar golden queries
      await this.loadGoldenQueries();
      
      // Crear context pack activo si no existe
      await this.ensureActiveContextPack();
      
      this.initialized = true;
      logger.info('Shortcuts Manager initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Shortcuts Manager:', error);
      throw error;
    }
  }

  async loadShortcuts() {
    try {
      const shortcutsPath = path.join(this.config.storage_path, 'shortcuts.json');
      
      try {
        const shortcutsData = await fs.readFile(shortcutsPath, 'utf8');
        const shortcuts = JSON.parse(shortcutsData);
        this.shortcuts = new Map(Object.entries(shortcuts));
        logger.info(`Loaded ${this.shortcuts.size} shortcuts`);
      } catch (error) {
        logger.warn('No existing shortcuts found, creating defaults');
        await this.createDefaultShortcuts();
      }
    } catch (error) {
      logger.error('Error loading shortcuts:', error);
      throw error;
    }
  }

  async createDefaultShortcuts() {
    const defaultShortcuts = {
      // System shortcuts
      'sys.health': {
        name: 'System Health Check',
        description: 'Ejecuta diagnóstico completo de salud del sistema',
        command: 'health',
        category: 'system',
        icon: '🏥',
        hotkey: 'ctrl+shift+h'
      },
      'sys.ports': {
        name: 'Port Scan',
        description: 'Escaneo rápido de puertos comunes',
        command: 'ports',
        category: 'system',
        icon: '🔌',
        hotkey: 'ctrl+shift+p'
      },
      'sys.metrics': {
        name: 'System Metrics',
        description: 'Métricas del sistema en tiempo real',
        command: 'metrics',
        category: 'system',
        icon: '📊',
        hotkey: 'ctrl+shift+m'
      },
      
      // Memory shortcuts
      'mem.context': {
        name: 'Active Context',
        description: 'Obtiene el context pack activo',
        command: 'context',
        category: 'memory',
        icon: '🧠',
        hotkey: 'ctrl+shift+c'
      },
      'mem.search': {
        name: 'Memory Search',
        description: 'Búsqueda rápida en memoria',
        command: 'search',
        category: 'memory',
        icon: '🔍',
        hotkey: 'ctrl+shift+s'
      },
      'mem.add': {
        name: 'Add Memory',
        description: 'Agrega elemento a la memoria',
        command: 'add',
        category: 'memory',
        icon: '➕',
        hotkey: 'ctrl+shift+a'
      },
      
      // Checkpoint shortcuts
      'cp.create': {
        name: 'Create Checkpoint',
        description: 'Crea checkpoint rápido',
        command: 'checkpoint create',
        category: 'checkpoint',
        icon: '📸',
        hotkey: 'ctrl+shift+k'
      },
      'cp.list': {
        name: 'List Checkpoints',
        description: 'Lista checkpoints disponibles',
        command: 'checkpoint list',
        category: 'checkpoint',
        icon: '📋',
        hotkey: 'ctrl+shift+l'
      },
      'cp.restore': {
        name: 'Restore Last',
        description: 'Restaura último checkpoint',
        command: 'checkpoint restore last',
        category: 'checkpoint',
        icon: '⏪',
        hotkey: 'ctrl+shift+r'
      },
      
      // Monitoring shortcuts
      'mon.vm': {
        name: 'VM Query',
        description: 'Consulta rápida a VictoriaMetrics',
        command: 'vm query',
        category: 'monitoring',
        icon: '📈',
        hotkey: 'ctrl+shift+v'
      },
      'mon.grafana': {
        name: 'Grafana Dash',
        description: 'Lista dashboards de Grafana',
        command: 'grafana list',
        category: 'monitoring',
        icon: '📊',
        hotkey: 'ctrl+shift+g'
      },
      'mon.smoke': {
        name: 'Smoke Test',
        description: 'Ejecuta prueba de smoke',
        command: 'grafana smoke',
        category: 'monitoring',
        icon: '🧪',
        hotkey: 'ctrl+shift+t'
      },
      
      // Operational shortcuts
      'op.audit': {
        name: 'Quick Audit',
        description: 'Auditoría rápida de cambios',
        command: 'audit changes',
        category: 'operational',
        icon: '🔍',
        hotkey: 'ctrl+shift+u'
      },
      'op.report': {
        name: 'Generate Report',
        description: 'Genera reporte técnico',
        command: 'report generate',
        category: 'operational',
        icon: '📄',
        hotkey: 'ctrl+shift+e'
      },
      'op.alerts': {
        name: 'Check Alerts',
        description: 'Verifica alertas activas',
        command: 'alerts check',
        category: 'operational',
        icon: '🚨',
        hotkey: 'ctrl+shift+w'
      }
    };
    
    this.shortcuts = new Map(Object.entries(defaultShortcuts));
    await this.saveShortcuts();
  }

  async saveShortcuts() {
    try {
      const shortcutsPath = path.join(this.config.storage_path, 'shortcuts.json');
      const shortcutsObject = Object.fromEntries(this.shortcuts);
      await fs.writeFile(shortcutsPath, JSON.stringify(shortcutsObject, null, 2));
      logger.debug('Shortcuts saved successfully');
    } catch (error) {
      logger.error('Error saving shortcuts:', error);
      throw error;
    }
  }

  async loadContextPacks() {
    try {
      const contextPackPath = path.join(this.config.context_pack_path, 'active.json');
      
      try {
        const contextData = await fs.readFile(contextPackPath, 'utf8');
        const contextPack = JSON.parse(contextData);
        this.contextPacks.set('active', contextPack);
        logger.info('Active context pack loaded');
      } catch (error) {
        logger.warn('No active context pack found, creating default');
        await this.createDefaultContextPack();
      }
    } catch (error) {
      logger.error('Error loading context packs:', error);
      throw error;
    }
  }

  async createDefaultContextPack() {
    const defaultContextPack = {
      name: 'active',
      description: 'Context pack activo para operaciones diarias',
      version: '1.0.0',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: {
        system_info: {
          type: 'system',
          data: await this.getSystemContext(),
          priority: 'high'
        },
        recent_checkpoints: {
          type: 'checkpoint',
          data: await this.getRecentCheckpointsContext(),
          priority: 'medium'
        },
        active_alerts: {
          type: 'monitoring',
          data: await this.getActiveAlertsContext(),
          priority: 'high'
        },
        memory_stats: {
          type: 'memory',
          data: await this.getMemoryStatsContext(),
          priority: 'low'
        }
      },
      metadata: {
        tags: ['active', 'daily', 'operational'],
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }
    };
    
    this.contextPacks.set('active', defaultContextPack);
    await this.saveContextPack('active', defaultContextPack);
  }

  async ensureActiveContextPack() {
    if (!this.contextPacks.has('active')) {
      await this.createDefaultContextPack();
    }
  }

  async saveContextPack(name, contextPack) {
    try {
      const contextPackPath = path.join(this.config.context_pack_path, `${name}.json`);
      await fs.writeFile(contextPackPath, JSON.stringify(contextPack, null, 2));
      logger.debug(`Context pack ${name} saved successfully`);
    } catch (error) {
      logger.error(`Error saving context pack ${name}:`, error);
      throw error;
    }
  }

  async loadGoldenQueries() {
    const defaultGoldenQueries = {
      'system_health': {
        name: 'System Health',
        description: 'Consulta de salud del sistema',
        query: 'up == 0',
        category: 'system',
        template: 'health'
      },
      'memory_usage': {
        name: 'Memory Usage',
        description: 'Uso de memoria del sistema',
        query: 'process_resident_memory_bytes / 1024 / 1024',
        category: 'system',
        template: 'memory'
      },
      'cpu_usage': {
        name: 'CPU Usage',
        description: 'Uso de CPU del sistema',
        query: 'rate(process_cpu_seconds_total[5m]) * 100',
        category: 'system',
        template: 'cpu'
      },
      'disk_usage': {
        name: 'Disk Usage',
        description: 'Uso de disco del sistema',
        query: 'node_filesystem_size_bytes - node_filesystem_free_bytes',
        category: 'system',
        template: 'disk'
      },
      'error_rate': {
        name: 'Error Rate',
        description: 'Tasa de errores del sistema',
        query: 'rate(http_requests_total{status=~"5.."}[5m])',
        category: 'application',
        template: 'errors'
      }
    };
    
    this.goldenQueries = new Map(Object.entries(defaultGoldenQueries));
  }

  async getSystemContext() {
    try {
      const systemInfo = await this.systemManager.checkSystemInfo();
      return {
        status: systemInfo.status,
        data: systemInfo.data,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async getRecentCheckpointsContext() {
    try {
      const checkpoints = await this.checkpointManager.listCheckpoints('', 5);
      return {
        count: checkpoints.checkpoints.length,
        checkpoints: checkpoints.checkpoints,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async getActiveAlertsContext() {
    try {
      const health = await this.systemManager.health();
      return {
        alerts_count: health.alerts.length,
        alerts: health.alerts,
        overall_status: health.overall_status,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async getMemoryStatsContext() {
    try {
      const stats = await this.memoryManager.getStats();
      return {
        stats,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async executeShortcut(shortcutId, args = {}) {
    await this.initialize();
    
    try {
      if (!this.shortcuts.has(shortcutId)) {
        throw new Error(`Shortcut not found: ${shortcutId}`);
      }
      
      const shortcut = this.shortcuts.get(shortcutId);
      logger.info(`Executing shortcut: ${shortcutId} (${shortcut.name})`);
      
      const startTime = Date.now();
      const result = await this.executeCommand(shortcut.command, args);
      const executionTime = Date.now() - startTime;
      
      // Registrar ejecución
      await this.logShortcutExecution(shortcutId, result, executionTime);
      
      return {
        shortcut_id: shortcutId,
        shortcut_name: shortcut.name,
        result,
        execution_time_ms: executionTime,
        executed_at: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Error executing shortcut ${shortcutId}:`, error);
      throw new Error(`Failed to execute shortcut: ${error.message}`);
    }
  }

  async executeCommand(command, args = {}) {
    const [cmd, ...cmdArgs] = command.split(' ');
    
    switch (cmd) {
      case 'health':
        return await this.systemManager.health();
        
      case 'ports':
        return await this.systemManager.portsScan(args.host || 'localhost', args.ports || 'common');
        
      case 'metrics':
        return await this.getSystemMetrics();
        
      case 'context':
        return await this.getContextPack(args.context || 'active');
        
      case 'search':
        return await this.memoryManager.search(args.tags || args.query || '');
        
      case 'add':
        return await this.memoryManager.addItem(args);
        
      case 'checkpoint':
        if (cmdArgs[0] === 'create') {
          return await this.checkpointManager.createCheckpoint(
            args.name || `quick_${Date.now()}`,
            args.description || 'Quick checkpoint from shortcut',
            args.tags || ['shortcut', 'quick']
          );
        } else if (cmdArgs[0] === 'list') {
          return await this.checkpointManager.listCheckpoints(args.filter, args.limit);
        } else if (cmdArgs[0] === 'restore') {
          if (cmdArgs[1] === 'last') {
            const checkpoints = await this.checkpointManager.listCheckpoints('', 1);
            if (checkpoints.checkpoints.length > 0) {
              return await this.checkpointManager.restoreCheckpoint(checkpoints.checkpoints[0].id);
            } else {
              throw new Error('No checkpoints found to restore');
            }
          } else {
            return await this.checkpointManager.restoreCheckpoint(args.checkpoint_id);
          }
        }
        break;
        
      case 'vm':
        if (cmdArgs[0] === 'query') {
          return await this.vmManager.query(args.query || 'up');
        }
        break;
        
      case 'grafana':
        if (cmdArgs[0] === 'list') {
          return await this.grafanaManager.listDashboards(args.folder_id, args.query);
        } else if (cmdArgs[0] === 'smoke') {
          return await this.grafanaManager.smoke(args.uid_or_title);
        }
        break;
        
      case 'audit':
        return await this.quickAuditChanges();
        
      case 'report':
        return await this.generateTechnicalReport(args.type || 'standard');
        
      case 'alerts':
        return await this.checkActiveAlerts();
        
      default:
        throw new Error(`Unknown command: ${command}`);
    }
  }

  async getSystemMetrics() {
    try {
      const health = await this.systemManager.health();
      return {
        system_info: health.checks.system_info?.data,
        performance_metrics: health.performance_metrics,
        overall_status: health.overall_status,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to get system metrics: ${error.message}`);
    }
  }

  async getContextPack(contextName) {
    await this.ensureActiveContextPack();
    
    if (!this.contextPacks.has(contextName)) {
      throw new Error(`Context pack not found: ${contextName}`);
    }
    
    const contextPack = this.contextPacks.get(contextName);
    
    // Actualizar context pack con datos frescos
    const updatedContextPack = await this.updateContextPack(contextPack);
    
    return {
      context: contextName,
      pack: updatedContextPack,
      retrieved_at: new Date().toISOString()
    };
  }

  async updateContextPack(contextPack) {
    const updatedPack = { ...contextPack };
    updatedPack.updated_at = new Date().toISOString();
    
    // Actualizar cada item del context pack
    for (const [key, item] of Object.entries(updatedPack.items)) {
      switch (item.type) {
        case 'system':
          updatedPack.items[key].data = await this.getSystemContext();
          break;
        case 'checkpoint':
          updatedPack.items[key].data = await this.getRecentCheckpointsContext();
          break;
        case 'monitoring':
          updatedPack.items[key].data = await this.getActiveAlertsContext();
          break;
        case 'memory':
          updatedPack.items[key].data = await this.getMemoryStatsContext();
          break;
      }
    }
    
    // Guardar context pack actualizado
    await this.saveContextPack(contextPack.name, updatedPack);
    this.contextPacks.set(contextPack.name, updatedPack);
    
    return updatedPack;
  }

  async quickAuditChanges() {
    try {
      logger.info('Starting quick audit of changes');
      
      const audit = {
        audit_id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        timestamp: new Date().toISOString(),
        checks: {
          recent_checkpoints: await this.auditRecentCheckpoints(),
          system_changes: await this.auditSystemChanges(),
          memory_changes: await this.auditMemoryChanges(),
          alerts_status: await this.auditAlertsStatus()
        },
        summary: {
          total_checks: 0,
          passed_checks: 0,
          failed_checks: 0,
          warning_checks: 0
        }
      };
      
      // Calcular resumen
      for (const check of Object.values(audit.checks)) {
        audit.summary.total_checks++;
        if (check.status === 'passed') {
          audit.summary.passed_checks++;
        } else if (check.status === 'failed') {
          audit.summary.failed_checks++;
        } else if (check.status === 'warning') {
          audit.summary.warning_checks++;
        }
      }
      
      audit.overall_status = audit.summary.failed_checks > 0 ? 'failed' : 
                            audit.summary.warning_checks > 0 ? 'warning' : 'passed';
      
      // Guardar auditoría en memoria
      await this.memoryManager.addItem({
        title: `Quick Audit ${audit.audit_id}`,
        description: 'Auditoría rápida de cambios del sistema',
        content: JSON.stringify(audit, null, 2),
        tags: ['audit', 'quick', 'changes', 'system']
      });
      
      logger.info(`Quick audit completed: ${audit.overall_status}`);
      
      return audit;
    } catch (error) {
      logger.error('Error during quick audit:', error);
      throw new Error(`Quick audit failed: ${error.message}`);
    }
  }

  async auditRecentCheckpoints() {
    try {
      const checkpoints = await this.checkpointManager.listCheckpoints('', 10);
      const recentCheckpoints = checkpoints.checkpoints.filter(cp => {
        const createdTime = new Date(cp.created_at);
        const hoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return createdTime > hoursAgo;
      });
      
      return {
        status: 'passed',
        data: {
          total_checkpoints: checkpoints.checkpoints.length,
          recent_checkpoints_24h: recentCheckpoints.length,
          latest_checkpoint: checkpoints.checkpoints[0] || null
        }
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  async auditSystemChanges() {
    try {
      const health = await this.systemManager.health();
      const systemInfo = health.checks.system_info?.data;
      
      return {
        status: 'passed',
        data: {
          uptime: systemInfo?.uptime || 0,
          load_average: systemInfo?.loadavg || [],
          memory_usage: health.checks.memory_usage?.data || {},
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  async auditMemoryChanges() {
    try {
      const stats = await this.memoryManager.getStats();
      
      return {
        status: 'passed',
        data: {
          total_items: stats.total_items,
          total_tags: stats.total_tags,
          storage_size_mb: stats.storage_size_mb,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  async auditAlertsStatus() {
    try {
      const health = await this.systemManager.health();
      
      return {
        status: health.overall_status === 'healthy' ? 'passed' : 'warning',
        data: {
          alerts_count: health.alerts.length,
          critical_alerts: health.alerts.filter(a => a.severity === 'critical').length,
          warning_alerts: health.alerts.filter(a => a.severity === 'warning').length,
          overall_status: health.overall_status
        }
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  async generateTechnicalReport(type = 'standard') {
    try {
      logger.info(`Generating ${type} technical report`);
      
      const report = {
        report_id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        type,
        generated_at: new Date().toISOString(),
        sections: {
          executive_summary: await this.generateExecutiveSummary(),
          system_status: await this.generateSystemStatusSection(),
          performance_metrics: await this.generatePerformanceSection(),
          recent_changes: await this.generateChangesSection(),
          recommendations: await this.generateRecommendationsSection()
        }
      };
      
      // Guardar report en memoria
      await this.memoryManager.addItem({
        title: `Technical Report ${report.report_id}`,
        description: `Reporte técnico ${type} del sistema`,
        content: JSON.stringify(report, null, 2),
        tags: ['report', 'technical', type, 'system']
      });
      
      logger.info(`Technical report generated: ${report.report_id}`);
      
      return report;
    } catch (error) {
      logger.error('Error generating technical report:', error);
      throw new Error(`Failed to generate technical report: ${error.message}`);
    }
  }

  async generateExecutiveSummary() {
    try {
      const health = await this.systemManager.health();
      const checkpoints = await this.checkpointManager.listCheckpoints('', 5);
      const memoryStats = await this.memoryManager.getStats();
      
      return {
        overall_status: health.overall_status,
        critical_issues: health.alerts.filter(a => a.severity === 'critical').length,
        warnings: health.alerts.filter(a => a.severity === 'warning').length,
        recent_checkpoints: checkpoints.checkpoints.length,
        memory_items: memoryStats.total_items,
        uptime: health.checks.system_info?.data?.uptime || 0
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  async generateSystemStatusSection() {
    try {
      const health = await this.systemManager.health();
      
      return {
        status: health.overall_status,
        checks: health.checks,
        alerts: health.alerts,
        performance_metrics: health.performance_metrics
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  async generatePerformanceSection() {
    try {
      const vmOverview = await this.vmManager.getMetricsOverview();
      const health = await this.systemManager.health();
      
      return {
        victoria_metrics: vmOverview,
        system_performance: health.performance_metrics,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  async generateChangesSection() {
    try {
      const checkpoints = await this.checkpointManager.listCheckpoints('', 10);
      const recentMemory = await this.memoryManager.search(['recent', 'change']);
      
      return {
        recent_checkpoints: checkpoints.checkpoints.slice(0, 5),
        recent_memory_changes: recentMemory.results.slice(0, 5),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  async generateRecommendationsSection() {
    try {
      const health = await this.systemManager.health();
      
      return {
        recommendations: health.recommendations,
        priority_actions: health.recommendations.filter(r => r.priority === 'high'),
        monitoring_suggestions: [
          'Consider setting up automated alerts for critical metrics',
          'Review checkpoint retention policy',
          'Monitor memory usage trends',
          'Set up regular system health checks'
        ],
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  async checkActiveAlerts() {
    try {
      const health = await this.systemManager.health();
      
      return {
        alerts_count: health.alerts.length,
        alerts: health.alerts,
        overall_status: health.overall_status,
        critical_alerts: health.alerts.filter(a => a.severity === 'critical'),
        warning_alerts: health.alerts.filter(a => a.severity === 'warning'),
        checked_at: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to check active alerts: ${error.message}`);
    }
  }

  async logShortcutExecution(shortcutId, result, executionTime) {
    try {
      const logEntry = {
        shortcut_id: shortcutId,
        execution_time_ms: executionTime,
        status: result.error ? 'failed' : 'success',
        timestamp: new Date().toISOString()
      };
      
      // Guardar en memoria para auditoría
      await this.memoryManager.addItem({
        title: `Shortcut Execution ${shortcutId}`,
        description: `Ejecución de shortcut ${shortcutId}`,
        content: JSON.stringify(logEntry, null, 2),
        tags: ['shortcut', 'execution', 'audit']
      });
    } catch (error) {
      logger.warn('Failed to log shortcut execution:', error);
    }
  }

  async listShortcuts(category = null) {
    await this.initialize();
    
    try {
      let shortcuts = Array.from(this.shortcuts.entries()).map(([id, shortcut]) => ({
        id,
        ...shortcut
      }));
      
      if (category) {
        shortcuts = shortcuts.filter(s => s.category === category);
      }
      
      // Ordenar por categoría y luego por nombre
      shortcuts.sort((a, b) => {
        if (a.category !== b.category) {
          return a.category.localeCompare(b.category);
        }
        return a.name.localeCompare(b.name);
      });
      
      return {
        shortcuts,
        count: shortcuts.length,
        category,
        listed_at: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to list shortcuts: ${error.message}`);
    }
  }

  async getGoldenQuery(queryName) {
    if (!this.goldenQueries.has(queryName)) {
      throw new Error(`Golden query not found: ${queryName}`);
    }
    
    return this.goldenQueries.get(queryName);
  }

  async executeGoldenQuery(queryName, timeRange = null) {
    try {
      const query = await this.getGoldenQuery(queryName);
      
      let result;
      if (timeRange) {
        const [start, end] = timeRange.split(',');
        result = await this.vmManager.queryRange(query.query, parseInt(start), parseInt(end));
      } else {
        result = await this.vmManager.query(query.query);
      }
      
      return {
        query_name: queryName,
        query_info: query,
        result,
        executed_at: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to execute golden query ${queryName}: ${error.message}`);
    }
  }
}

export default ShortcutsManager;
