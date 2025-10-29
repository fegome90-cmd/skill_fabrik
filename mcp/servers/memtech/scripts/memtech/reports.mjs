#!/usr/bin/env node

/**
 * MemTech Reports Module
 * 
 * Módulo para generación de reports técnicos en formato MemTech
 * Proporciona plantillas y herramientas para crear reports estructurados
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
import AuditManager from './audit.js';

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

class ReportsManager {
  constructor(config = {}) {
    this.config = {
      storage_path: config.storage_path || 'reports',
      templates_path: config.templates_path || 'templates/reports',
      max_reports: config.max_reports || 100,
      auto_save: config.auto_save !== false,
      output_formats: config.output_formats || ['json', 'markdown', 'html'],
      ...config
    };
    
    this.reports = new Map();
    this.templates = new Map();
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
    
    this.auditManager = new AuditManager({
      storage_path: '.memtech/audit'
    });
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      // Asegurar que los directorios necesarios existen
      await fs.mkdir(this.config.storage_path, { recursive: true });
      await fs.mkdir(this.config.templates_path, { recursive: true });
      
      // Inicializar managers
      await this.memoryManager.initialize();
      await this.checkpointManager.initialize();
      await this.vmManager.initialize();
      await this.grafanaManager.initialize();
      await this.systemManager.initialize();
      await this.auditManager.initialize();
      
      // Cargar plantillas de reportes
      await this.loadTemplates();
      
      // Cargar reportes existentes
      await this.loadReports();
      
      // Crear plantillas por defecto si no existen
      await this.ensureDefaultTemplates();
      
      this.initialized = true;
      logger.info('Reports Manager initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Reports Manager:', error);
      throw error;
    }
  }

  async loadTemplates() {
    try {
      const templateFiles = await fs.readdir(this.config.templates_path);
      
      for (const file of templateFiles) {
        if (file.endsWith('.json')) {
          const templatePath = path.join(this.config.templates_path, file);
          const templateData = await fs.readFile(templatePath, 'utf8');
          const template = JSON.parse(templateData);
          
          this.templates.set(template.name, template);
          logger.info(`Loaded template: ${template.name}`);
        }
      }
      
      if (this.templates.size === 0) {
        logger.warn('No templates found, will create default templates');
      }
    } catch (error) {
      logger.warn('Error loading templates:', error.message);
    }
  }

  async loadReports() {
    try {
      const reportsPath = path.join(this.config.storage_path, 'index.json');
      
      try {
        const reportsData = await fs.readFile(reportsPath, 'utf8');
        const reports = JSON.parse(reportsData);
        this.reports = new Map(Object.entries(reports));
        logger.info(`Loaded ${this.reports.size} reports`);
      } catch (error) {
        logger.warn('No existing reports index found, starting with empty reports');
        this.reports = new Map();
      }
    } catch (error) {
      logger.error('Error loading reports:', error);
      throw error;
    }
  }

  async saveReports() {
    try {
      const reportsPath = path.join(this.config.storage_path, 'index.json');
      const reportsObject = Object.fromEntries(this.reports);
      await fs.writeFile(reportsPath, JSON.stringify(reportsObject, null, 2));
      logger.debug('Reports index saved successfully');
    } catch (error) {
      logger.error('Error saving reports:', error);
      throw error;
    }
  }

  async ensureDefaultTemplates() {
    if (this.templates.size === 0) {
      await this.createDefaultTemplates();
    }
  }

  async createDefaultTemplates() {
    const defaultTemplates = [
      {
        name: 'system_health',
        description: 'Reporte de salud del sistema',
        version: '1.0.0',
        sections: [
          {
            name: 'executive_summary',
            title: 'Resumen Ejecutivo',
            type: 'summary',
            required: true,
            order: 1
          },
          {
            name: 'system_overview',
            title: 'Visión General del Sistema',
            type: 'system_info',
            required: true,
            order: 2
          },
          {
            name: 'performance_metrics',
            title: 'Métricas de Rendimiento',
            type: 'metrics',
            required: true,
            order: 3
          },
          {
            name: 'alerts_status',
            title: 'Estado de Alertas',
            type: 'alerts',
            required: true,
            order: 4
          },
          {
            name: 'recommendations',
            title: 'Recomendaciones',
            type: 'recommendations',
            required: true,
            order: 5
          }
        ],
        output_formats: ['json', 'markdown', 'html'],
        metadata: {
          category: 'system',
          frequency: 'daily',
          retention_days: 30
        }
      },
      {
        name: 'audit_summary',
        description: 'Reporte de auditoría de cambios',
        version: '1.0.0',
        sections: [
          {
            name: 'audit_overview',
            title: 'Visión General de Auditoría',
            type: 'audit_summary',
            required: true,
            order: 1
          },
          {
            name: 'changes_detected',
            title: 'Cambios Detectados',
            type: 'changes',
            required: true,
            order: 2
          },
          {
            name: 'critical_changes',
            title: 'Cambios Críticos',
            type: 'critical_changes',
            required: false,
            order: 3
          },
          {
            name: 'trend_analysis',
            title: 'Análisis de Tendencias',
            type: 'trends',
            required: false,
            order: 4
          },
          {
            name: 'compliance_status',
            title: 'Estado de Cumplimiento',
            type: 'compliance',
            required: true,
            order: 5
          }
        ],
        output_formats: ['json', 'markdown'],
        metadata: {
          category: 'audit',
          frequency: 'weekly',
          retention_days: 90
        }
      },
      {
        name: 'performance_analysis',
        description: 'Análisis de rendimiento del sistema',
        version: '1.0.0',
        sections: [
          {
            name: 'performance_summary',
            title: 'Resumen de Rendimiento',
            type: 'performance_summary',
            required: true,
            order: 1
          },
          {
            name: 'resource_usage',
            title: 'Uso de Recursos',
            type: 'resource_usage',
            required: true,
            order: 2
          },
          {
            name: 'bottleneck_analysis',
            title: 'Análisis de Cuellos de Botella',
            type: 'bottlenecks',
            required: true,
            order: 3
          },
          {
            name: 'capacity_planning',
            title: 'Planificación de Capacidad',
            type: 'capacity',
            required: false,
            order: 4
          },
          {
            name: 'optimization_recommendations',
            title: 'Recomendaciones de Optimización',
            type: 'optimization',
            required: true,
            order: 5
          }
        ],
        output_formats: ['json', 'markdown', 'html'],
        metadata: {
          category: 'performance',
          frequency: 'weekly',
          retention_days: 60
        }
      }
    ];
    
    for (const template of defaultTemplates) {
      this.templates.set(template.name, template);
      await this.saveTemplate(template);
    }
    
    logger.info(`Created ${defaultTemplates.length} default templates`);
  }

  async saveTemplate(template) {
    try {
      const templatePath = path.join(this.config.templates_path, `${template.name}.json`);
      await fs.writeFile(templatePath, JSON.stringify(template, null, 2));
      logger.debug(`Template saved: ${template.name}`);
    } catch (error) {
      logger.error(`Error saving template ${template.name}:`, error);
      throw error;
    }
  }

  async generateReport(templateName, options = {}) {
    await this.initialize();
    
    try {
      if (!this.templates.has(templateName)) {
        throw new Error(`Template not found: ${templateName}`);
      }
      
      const template = this.templates.get(templateName);
      const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      
      logger.info(`Generating report ${reportId} using template ${templateName}`);
      
      const report = {
        report_id: reportId,
        template_name: templateName,
        template_version: template.version,
        generated_at: new Date().toISOString(),
        options,
        metadata: {
          title: options.title || template.description,
          author: options.author || 'MemTech System',
          category: template.metadata?.category || 'general',
          tags: options.tags || ['memtech', 'report', templateName]
        },
        sections: {},
        summary: {
          total_sections: 0,
          completed_sections: 0,
          failed_sections: 0,
          overall_status: 'generating'
        }
      };
      
      // Generar secciones del reporte
      for (const sectionConfig of template.sections) {
        try {
          const sectionData = await this.generateSection(sectionConfig, options);
          report.sections[sectionConfig.name] = {
            ...sectionConfig,
            data: sectionData,
            generated_at: new Date().toISOString(),
            status: 'completed'
          };
          report.summary.completed_sections++;
        } catch (error) {
          logger.error(`Error generating section ${sectionConfig.name}:`, error);
          report.sections[sectionConfig.name] = {
            ...sectionConfig,
            error: error.message,
            generated_at: new Date().toISOString(),
            status: 'failed'
          };
          report.summary.failed_sections++;
        }
        
        report.summary.total_sections++;
      }
      
      // Calcular estado general del reporte
      report.summary.overall_status = report.summary.failed_sections > 0 ? 'partial' : 'completed';
      
      // Generar resumen ejecutivo si no existe
      if (!report.sections.executive_summary) {
        report.sections.executive_summary = await this.generateExecutiveSummary(report);
      }
      
      // Guardar reporte
      this.reports.set(reportId, report);
      await this.saveReports();
      
      // Generar archivos de salida
      const outputFiles = await this.generateOutputFiles(report, template.output_formats);
      report.output_files = outputFiles;
      
      // Guardar en memoria para referencia
      await this.memoryManager.addItem({
        title: `Report ${reportId}`,
        description: `Reporte generado usando plantilla ${templateName}`,
        content: JSON.stringify(report, null, 2),
        tags: ['report', templateName, 'memtech', 'generated']
      });
      
      // Limpiar reportes antiguos
      await this.cleanupOldReports();
      
      logger.info(`Report generated successfully: ${reportId} (${report.summary.overall_status})`);
      
      return report;
    } catch (error) {
      logger.error(`Error generating report with template ${templateName}:`, error);
      throw new Error(`Failed to generate report: ${error.message}`);
    }
  }

  async generateSection(sectionConfig, options) {
    switch (sectionConfig.type) {
      case 'summary':
        return await this.generateSummarySection(options);
        
      case 'system_info':
        return await this.generateSystemInfoSection(options);
        
      case 'metrics':
        return await this.generateMetricsSection(options);
        
      case 'alerts':
        return await this.generateAlertsSection(options);
        
      case 'recommendations':
        return await this.generateRecommendationsSection(options);
        
      case 'audit_summary':
        return await this.generateAuditSummarySection(options);
        
      case 'changes':
        return await this.generateChangesSection(options);
        
      case 'critical_changes':
        return await this.generateCriticalChangesSection(options);
        
      case 'trends':
        return await this.generateTrendsSection(options);
        
      case 'compliance':
        return await this.generateComplianceSection(options);
        
      case 'performance_summary':
        return await this.generatePerformanceSummarySection(options);
        
      case 'resource_usage':
        return await this.generateResourceUsageSection(options);
        
      case 'bottlenecks':
        return await this.generateBottlenecksSection(options);
        
      case 'capacity':
        return await this.generateCapacitySection(options);
        
      case 'optimization':
        return await this.generateOptimizationSection(options);
        
      default:
        throw new Error(`Unknown section type: ${sectionConfig.type}`);
    }
  }

  async generateSummarySection() {
    try {
      const health = await this.systemManager.health();
      const memoryStats = await this.memoryManager.getStats();
      const checkpointStats = await this.checkpointManager.getCheckpointStats();
      
      return {
        overall_status: health.overall_status,
        critical_alerts: health.alerts.filter(a => a.severity === 'critical').length,
        warning_alerts: health.alerts.filter(a => a.severity === 'warning').length,
        total_alerts: health.alerts.length,
        memory_items: memoryStats.total_items,
        memory_size_mb: memoryStats.storage_size_mb,
        total_checkpoints: checkpointStats.total_checkpoints,
        system_uptime: health.checks.system_info?.data?.uptime || 0,
        generated_at: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to generate summary section: ${error.message}`);
    }
  }

  async generateSystemInfoSection() {
    try {
      const health = await this.systemManager.health();
      
      return {
        system_info: health.checks.system_info?.data,
        disk_space: health.checks.disk_space?.data,
        memory_usage: health.checks.memory_usage?.data,
        cpu_usage: health.checks.cpu_usage?.data,
        network_connectivity: health.checks.network_connectivity?.data,
        process_health: health.checks.process_health?.data,
        system_load: health.checks.system_load?.data,
        generated_at: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to generate system info section: ${error.message}`);
    }
  }

  async generateMetricsSection(options) {
    try {
      const vmOverview = await this.vmManager.getMetricsOverview();
      const health = await this.systemManager.health();
      
      return {
        victoria_metrics: vmOverview,
        system_performance: health.performance_metrics,
        custom_metrics: await this.getCustomMetrics(options),
        generated_at: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to generate metrics section: ${error.message}`);
    }
  }

  async getCustomMetrics() {
    try {
      const customMetrics = {};
      
      // Métricas de checkpoints
      const checkpointStats = await this.checkpointManager.getCheckpointStats();
      customMetrics.checkpoints = checkpointStats;
      
      // Métricas de memoria
      const memoryStats = await this.memoryManager.getStats();
      customMetrics.memory = memoryStats;
      
      // Métricas de auditoría
      const auditSummary = await this.auditManager.generateAuditSummary(7);
      customMetrics.audit = auditSummary;
      
      return customMetrics;
    } catch (error) {
      logger.warn('Error getting custom metrics:', error);
      return {};
    }
  }

  async generateAlertsSection(options) {
    try {
      const health = await this.systemManager.health();
      
      return {
        alerts: health.alerts,
        summary: {
          total: health.alerts.length,
          critical: health.alerts.filter(a => a.severity === 'critical').length,
          warning: health.alerts.filter(a => a.severity === 'warning').length,
          info: health.alerts.filter(a => a.severity === 'info').length
        },
        trends: await this.getAlertsTrends(options),
        generated_at: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to generate alerts section: ${error.message}`);
    }
  }

  async getAlertsTrends() {
    try {
      // Consultar métricas de alertas en VictoriaMetrics
      const trends = {};
      
      try {
        const criticalAlerts = await this.vmManager.query('sum(ALERTS{severity="critical"})');
        trends.critical_alerts = criticalAlerts.data.result;
      } catch (error) {
        trends.critical_alerts = [];
      }
      
      try {
        const warningAlerts = await this.vmManager.query('sum(ALERTS{severity="warning"})');
        trends.warning_alerts = warningAlerts.data.result;
      } catch (error) {
        trends.warning_alerts = [];
      }
      
      return trends;
    } catch (error) {
      logger.warn('Error getting alerts trends:', error);
      return {};
    }
  }

  async generateRecommendationsSection() {
    try {
      const health = await this.systemManager.health();
      const auditSummary = await this.auditManager.generateAuditSummary(7);
      
      const recommendations = [
        ...health.recommendations,
        ...auditSummary.recommendations
      ];
      
      // Ordenar por prioridad
      recommendations.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
      
      return {
        recommendations,
        summary: {
          total: recommendations.length,
          high_priority: recommendations.filter(r => r.priority === 'high').length,
          medium_priority: recommendations.filter(r => r.priority === 'medium').length,
          low_priority: recommendations.filter(r => r.priority === 'low').length
        },
        generated_at: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to generate recommendations section: ${error.message}`);
    }
  }

  async generateAuditSummarySection(options) {
    try {
      const auditSummary = await this.auditManager.generateAuditSummary(
        options.days || 7
      );
      
      return auditSummary;
    } catch (error) {
      throw new Error(`Failed to generate audit summary section: ${error.message}`);
    }
  }

  async generateChangesSection() {
    try {
      const recentAudits = await this.auditManager.listAuditReports(10);
      const changes = [];
      
      for (const audit of recentAudits.reports) {
        if (audit.changes) {
          for (const [changeType, changeData] of Object.entries(audit.changes)) {
            if (changeData.changes && changeData.changes.length > 0) {
              changes.push({
                audit_id: audit.audit_id,
                timestamp: audit.timestamp,
                change_type: changeType,
                severity: changeData.severity,
                changes_count: changeData.changes.length,
                changes: changeData.changes
              });
            }
          }
        }
      }
      
      // Ordenar por timestamp (más reciente primero)
      changes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      return {
        changes,
        summary: {
          total_changes: changes.length,
          critical_changes: changes.filter(c => c.severity === 'critical').length,
          warning_changes: changes.filter(c => c.severity === 'warning').length,
          info_changes: changes.filter(c => c.severity === 'info').length
        },
        generated_at: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to generate changes section: ${error.message}`);
    }
  }

  async generateCriticalChangesSection(options) {
    try {
      const changesSection = await this.generateChangesSection(options);
      
      const criticalChanges = changesSection.changes.filter(
        change => change.severity === 'critical'
      );
      
      return {
        critical_changes: criticalChanges,
        summary: {
          total_critical: criticalChanges.length,
          by_type: this.groupChangesByType(criticalChanges)
        },
        generated_at: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to generate critical changes section: ${error.message}`);
    }
  }

  groupChangesByType(changes) {
    const grouped = {};
    
    for (const change of changes) {
      if (!grouped[change.change_type]) {
        grouped[change.change_type] = [];
      }
      grouped[change.change_type].push(change);
    }
    
    return grouped;
  }

  async generateTrendsSection(options) {
    try {
      const trends = {};
      const days = options.days || 7;
      
      // Tendencias de alertas
      trends.alerts = await this.getAlertsTrends({ days });
      
      // Tendencias de rendimiento
      trends.performance = await this.getPerformanceTrends({ days });
      
      // Tendencias de uso de recursos
      trends.resources = await this.getResourceTrends({ days });
      
      return {
        trends,
        period_days: days,
        generated_at: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to generate trends section: ${error.message}`);
    }
  }

  async getPerformanceTrends() {
    try {
      const trends = {};
      
      // Tendencias de CPU
      try {
        const cpuTrend = await this.vmManager.query(
          `avg(rate(process_cpu_seconds_total{job="memtech-monitoring"}[1h]))`
        );
        trends.cpu = cpuTrend.data.result;
      } catch (error) {
        trends.cpu = [];
      }
      
      // Tendencias de memoria
      try {
        const memoryTrend = await this.vmManager.query(
          `avg(process_resident_memory_bytes{job="memtech-monitoring"} / 1024 / 1024)`
        );
        trends.memory = memoryTrend.data.result;
      } catch (error) {
        trends.memory = [];
      }
      
      return trends;
    } catch (error) {
      logger.warn('Error getting performance trends:', error);
      return {};
    }
  }

  async getResourceTrends() {
    try {
      const trends = {};
      
      // Tendencias de disco
      try {
        const diskTrend = await this.vmManager.query(
          `avg((node_filesystem_size_bytes - node_filesystem_free_bytes) / node_filesystem_size_bytes * 100)`
        );
        trends.disk = diskTrend.data.result;
      } catch (error) {
        trends.disk = [];
      }
      
      // Tendencias de red
      try {
        const networkTrend = await this.vmManager.query(
          `avg(rate(node_network_receive_bytes_total{job="memtech-monitoring"}[1h]))`
        );
        trends.network = networkTrend.data.result;
      } catch (error) {
        trends.network = [];
      }
      
      return trends;
    } catch (error) {
      logger.warn('Error getting resource trends:', error);
      return {};
    }
  }

  async generateComplianceSection() {
    try {
      const compliance = {
        overall_score: 0,
        categories: {},
        issues: [],
        recommendations: []
      };
      
      // Evaluar cumplimiento de checkpoints
      const checkpointStats = await this.checkpointManager.getCheckpointStats();
      const checkpointCompliance = this.evaluateCheckpointCompliance(checkpointStats);
      compliance.categories.checkpoints = checkpointCompliance;
      
      // Evaluar cumplimiento de seguridad
      const securityCompliance = await this.evaluateSecurityCompliance();
      compliance.categories.security = securityCompliance;
      
      // Evaluar cumplimiento de monitoreo
      const monitoringCompliance = await this.evaluateMonitoringCompliance();
      compliance.categories.monitoring = monitoringCompliance;
      
      // Calcular score general
      const scores = Object.values(compliance.categories).map(cat => cat.score);
      compliance.overall_score = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      
      // Generar recomendaciones de cumplimiento
      compliance.recommendations = this.generateComplianceRecommendations(compliance.categories);
      
      return {
        compliance,
        generated_at: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to generate compliance section: ${error.message}`);
    }
  }

  evaluateCheckpointCompliance(checkpointStats) {
    let score = 100;
    const issues = [];
    
    if (checkpointStats.total_checkpoints === 0) {
      score -= 50;
      issues.push('No checkpoints found');
    }
    
    if (checkpointStats.total_checkpoints < 5) {
      score -= 20;
      issues.push('Insufficient number of checkpoints');
    }
    
    const avgSize = parseFloat(checkpointStats.total_size_mb) / checkpointStats.total_checkpoints;
    if (avgSize > 100) {
      score -= 10;
      issues.push('Average checkpoint size too large');
    }
    
    return {
      score,
      issues,
      metrics: checkpointStats
    };
  }

  async evaluateSecurityCompliance() {
    let score = 100;
    const issues = [];
    
    try {
      // Verificar si hay archivos de configuración seguros
      const configFiles = [
        '.memtech/config.yaml',
        '.memtech/policies/default.json'
      ];
      
      for (const configFile of configFiles) {
        try {
          await fs.access(configFile);
        } catch (error) {
          score -= 25;
          issues.push(`Missing security configuration file: ${configFile}`);
        }
      }
      
      // Verificar permisos de directorios críticos
      const criticalDirs = ['.memtech', '.checkpoints'];
      for (const dir of criticalDirs) {
        try {
          await fs.stat(dir);
          // En un sistema real, verificaríamos permisos específicos
        } catch (error) {
          score -= 20;
          issues.push(`Critical directory not accessible: ${dir}`);
        }
      }
    } catch (error) {
      score = 50;
      issues.push(`Security evaluation failed: ${error.message}`);
    }
    
    return {
      score,
      issues
    };
  }

  async evaluateMonitoringCompliance() {
    let score = 100;
    const issues = [];
    
    try {
      // Verificar conectividad con VictoriaMetrics
      const vmHealth = await this.vmManager.checkHealth();
      if (!vmHealth.healthy) {
        score -= 30;
        issues.push('VictoriaMetrics is not healthy');
      }
      
      // Verificar conectividad con Grafana
      const grafanaHealth = await this.grafanaManager.checkHealth();
      if (!grafanaHealth.healthy) {
        score -= 30;
        issues.push('Grafana is not healthy');
      }
      
      // Verificar métricas disponibles
      try {
        const series = await this.vmManager.getSeries('{__name__=~"memtech_.*"}');
        if (series.series_count === 0) {
          score -= 20;
          issues.push('No MemTech metrics available');
        }
      } catch (error) {
        score -= 20;
        issues.push('Cannot query MemTech metrics');
      }
    } catch (error) {
      score = 50;
      issues.push(`Monitoring evaluation failed: ${error.message}`);
    }
    
    return {
      score,
      issues
    };
  }

  generateComplianceRecommendations(categories) {
    const recommendations = [];
    
    for (const [category, data] of Object.entries(categories)) {
      if (data.issues && data.issues.length > 0) {
        recommendations.push({
          category,
          priority: data.score < 70 ? 'high' : 'medium',
          issues: data.issues,
          recommendation: this.getCategoryRecommendation(category, data)
        });
      }
    }
    
    return recommendations;
  }

  getCategoryRecommendation(category) {
    const recommendations = {
      checkpoints: 'Review checkpoint policy and ensure regular backups are created',
      security: 'Audit security configurations and implement proper access controls',
      monitoring: 'Verify monitoring stack health and ensure metrics collection is working'
    };
    
    return recommendations[category] || 'Review and address identified compliance issues';
  }

  async generatePerformanceSummarySection(options) {
    try {
      const health = await this.systemManager.health();
      const vmOverview = await this.vmManager.getMetricsOverview();
      
      return {
        performance_score: this.calculatePerformanceScore(health, vmOverview),
        key_metrics: {
          cpu_usage: health.checks.cpu_usage?.data?.cpu_usage_percent || 0,
          memory_usage: health.checks.memory_usage?.data?.used_percent || 0,
          disk_usage: health.checks.disk_space?.data?.[0]?.used_percent || 0,
          system_load: health.checks.system_load?.data?.load_normalized?.['1min'] || 0
        },
        trends: await this.getPerformanceTrends(options),
        bottlenecks: this.identifyBottlenecks(health, vmOverview),
        generated_at: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to generate performance summary section: ${error.message}`);
    }
  }

  calculatePerformanceScore(health) {
    let score = 100;
    
    // Penalizar problemas de salud del sistema
    if (health.overall_status === 'unhealthy') {
      score -= 50;
    } else if (health.overall_status === 'warning') {
      score -= 25;
    }
    
    // Penalizar alertas críticas
    const criticalAlerts = health.alerts.filter(a => a.severity === 'critical').length;
    score -= criticalAlerts * 10;
    
    // Penalizar uso alto de recursos
    const memoryUsage = health.checks.memory_usage?.data?.used_percent || 0;
    if (memoryUsage > 90) {
      score -= 20;
    } else if (memoryUsage > 80) {
      score -= 10;
    }
    
    const cpuUsage = health.checks.cpu_usage?.data?.cpu_usage_percent || 0;
    if (cpuUsage > 90) {
      score -= 20;
    } else if (cpuUsage > 80) {
      score -= 10;
    }
    
    return Math.max(0, score);
  }

  identifyBottlenecks(health) {
    const bottlenecks = [];
    
    // Identificar cuellos de botella de memoria
    const memoryUsage = health.checks.memory_usage?.data?.used_percent || 0;
    if (memoryUsage > 85) {
      bottlenecks.push({
        type: 'memory',
        severity: memoryUsage > 95 ? 'critical' : 'warning',
        description: `High memory usage: ${memoryUsage.toFixed(1)}%`,
        impact: 'system_performance'
      });
    }
    
    // Identificar cuellos de botella de CPU
    const cpuUsage = health.checks.cpu_usage?.data?.cpu_usage_percent || 0;
    if (cpuUsage > 85) {
      bottlenecks.push({
        type: 'cpu',
        severity: cpuUsage > 95 ? 'critical' : 'warning',
        description: `High CPU usage: ${cpuUsage.toFixed(1)}%`,
        impact: 'system_responsiveness'
      });
    }
    
    // Identificar cuellos de botella de disco
    const diskUsage = health.checks.disk_space?.data?.[0]?.used_percent || 0;
    if (diskUsage > 90) {
      bottlenecks.push({
        type: 'disk',
        severity: diskUsage > 95 ? 'critical' : 'warning',
        description: `High disk usage: ${diskUsage.toFixed(1)}%`,
        impact: 'system_operations'
      });
    }
    
    return bottlenecks;
  }

  async generateResourceUsageSection(options) {
    try {
      const health = await this.systemManager.health();
      const resourceUsage = {
        memory: health.checks.memory_usage?.data,
        cpu: health.checks.cpu_usage?.data,
        disk: health.checks.disk_space?.data,
        network: health.checks.network_connectivity?.data,
        processes: health.checks.process_health?.data,
        system_load: health.checks.system_load?.data,
        historical_data: await this.getHistoricalResourceUsage(options),
        generated_at: new Date().toISOString()
      };
      
      return resourceUsage;
    } catch (error) {
      throw new Error(`Failed to generate resource usage section: ${error.message}`);
    }
  }

  async getHistoricalResourceUsage(options) {
    try {
      const historical = {};
      const hours = options.hours || 24;
      
      // Obtener datos históricos de VictoriaMetrics
      try {
        const memoryHistory = await this.vmManager.queryRange(
          'process_resident_memory_bytes{job="memtech-monitoring"} / 1024 / 1024',
          Date.now() - (hours * 60 * 60 * 1000),
          Date.now(),
          '1h'
        );
        historical.memory = memoryHistory.data;
      } catch (error) {
        historical.memory = { result: [] };
      }
      
      try {
        const cpuHistory = await this.vmManager.queryRange(
          'rate(process_cpu_seconds_total{job="memtech-monitoring"}[5m]) * 100',
          Date.now() - (hours * 60 * 60 * 1000),
          Date.now(),
          '1h'
        );
        historical.cpu = cpuHistory.data;
      } catch (error) {
        historical.cpu = { result: [] };
      }
      
      return historical;
    } catch (error) {
      logger.warn('Error getting historical resource usage:', error);
      return {};
    }
  }

  async generateBottlenecksSection(options) {
    try {
      const health = await this.systemManager.health();
      const vmOverview = await this.vmManager.getMetricsOverview();
      
      const bottlenecks = this.identifyBottlenecks(health, vmOverview);
      
      // Analizar tendencias de cuellos de botella
      const bottleneckTrends = await this.analyzeBottleneckTrends(options);
      
      // Generar recomendaciones específicas
      const recommendations = this.generateBottleneckRecommendations(bottlenecks);
      
      return {
        bottlenecks,
        trends: bottleneckTrends,
        recommendations,
        summary: {
          total_bottlenecks: bottlenecks.length,
          critical_bottlenecks: bottlenecks.filter(b => b.severity === 'critical').length,
          warning_bottlenecks: bottlenecks.filter(b => b.severity === 'warning').length
        },
        generated_at: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to generate bottlenecks section: ${error.message}`);
    }
  }

  async analyzeBottleneckTrends() {
    try {
      const trends = {};
      
      // Analizar tendencias de uso de memoria
      try {
        const memoryTrend = await this.vmManager.query(
          'increase(process_resident_memory_bytes{job="memtech-monitoring"}[1h]) / 1024 / 1024'
        );
        trends.memory_growth = memoryTrend.data.result;
      } catch (error) {
        trends.memory_growth = [];
      }
      
      // Analizar tendencias de uso de CPU
      try {
        const cpuTrend = await this.vmManager.query(
          'avg_over_time(rate(process_cpu_seconds_total{job="memtech-monitoring"}[5m])[1h:1m]) * 100'
        );
        trends.cpu_trend = cpuTrend.data.result;
      } catch (error) {
        trends.cpu_trend = [];
      }
      
      return trends;
    } catch (error) {
      logger.warn('Error analyzing bottleneck trends:', error);
      return {};
    }
  }

  generateBottleneckRecommendations(bottlenecks) {
    const recommendations = [];
    
    for (const bottleneck of bottlenecks) {
      switch (bottleneck.type) {
        case 'memory':
          recommendations.push({
            type: 'memory',
            priority: bottleneck.severity === 'critical' ? 'high' : 'medium',
            recommendation: 'Optimize memory usage or add more RAM',
            actions: [
              'Review memory-intensive processes',
              'Implement memory leak detection',
              'Consider memory optimization techniques'
            ]
          });
          break;
          
        case 'cpu':
          recommendations.push({
            type: 'cpu',
            priority: bottleneck.severity === 'critical' ? 'high' : 'medium',
            recommendation: 'Optimize CPU usage or upgrade processing capacity',
            actions: [
              'Profile CPU-intensive operations',
              'Optimize algorithms and code',
              'Consider load balancing strategies'
            ]
          });
          break;
          
        case 'disk':
          recommendations.push({
            type: 'disk',
            priority: bottleneck.severity === 'critical' ? 'high' : 'medium',
            recommendation: 'Free up disk space or expand storage capacity',
            actions: [
              'Clean up temporary files',
              'Implement log rotation',
              'Archive old data'
            ]
          });
          break;
      }
    }
    
    return recommendations;
  }

  async generateCapacitySection(options) {
    try {
      const capacity = {
        current_capacity: await this.getCurrentCapacity(),
        projected_growth: await this.getProjectedGrowth(options),
        capacity_recommendations: await this.getCapacityRecommendations(options),
        generated_at: new Date().toISOString()
      };
      
      return capacity;
    } catch (error) {
      throw new Error(`Failed to generate capacity section: ${error.message}`);
    }
  }

  async getCurrentCapacity() {
    try {
      const health = await this.systemManager.health();
      const memoryStats = await this.memoryManager.getStats();
      
      return {
        memory: {
          total: health.checks.memory_usage?.data?.total || 0,
          used: health.checks.memory_usage?.data?.used || 0,
          available: health.checks.memory_usage?.data?.free || 0,
          utilization_percent: health.checks.memory_usage?.data?.used_percent || 0
        },
        storage: {
          total: health.checks.disk_space?.data?.[0]?.size || 0,
          used: health.checkpoints.disk_space?.data?.[0]?.used || 0,
          available: health.checkpoints.disk_space?.data?.[0]?.free || 0,
          utilization_percent: health.checkpoints.disk_space?.data?.[0]?.used_percent || 0
        },
        memory_items: {
          total: memoryStats.total_items,
          max_items: 10000,
          utilization_percent: (memoryStats.total_items / 10000) * 100
        }
      };
    } catch (error) {
      throw new Error(`Failed to get current capacity: ${error.message}`);
    }
  }

  async getProjectedGrowth(options) {
    try {
      const days = options.days || 30;
      const projected = {};
      
      // Proyectar crecimiento de memoria
      try {
        const memoryGrowth = await this.vmManager.query(
          `predict_linear(process_resident_memory_bytes{job="memtech-monitoring"}[${days}h], ${days * 24}h) / 1024 / 1024`
        );
        projected.memory_mb = memoryGrowth.data.result;
      } catch (error) {
        projected.memory_mb = [];
      }
      
      // Proyectar crecimiento de items de memoria
      const currentItems = await this.memoryManager.getStats();
      const growthRate = 0.1; // 10% growth rate (configurable)
      projected.memory_items = {
        current: currentItems.total_items,
        projected: Math.round(currentItems.total_items * (1 + growthRate)),
        growth_rate_percent: growthRate * 100
      };
      
      return projected;
    } catch (error) {
      throw new Error(`Failed to get projected growth: ${error.message}`);
    }
  }

  async getCapacityRecommendations(options) {
    try {
      const currentCapacity = await this.getCurrentCapacity();
      const projectedGrowth = await this.getProjectedGrowth(options);
      const recommendations = [];
      
      // Recomendaciones de memoria
      if (currentCapacity.memory.utilization_percent > 80) {
        recommendations.push({
          resource: 'memory',
          priority: 'high',
          recommendation: 'Consider adding more RAM or optimizing memory usage',
          current_utilization: currentCapacity.memory.utilization_percent,
          projected_utilization: projectedGrowth.memory_mb
        });
      }
      
      // Recomendaciones de almacenamiento
      if (currentCapacity.storage.utilization_percent > 85) {
        recommendations.push({
          resource: 'storage',
          priority: 'high',
          recommendation: 'Consider expanding storage capacity',
          current_utilization: currentCapacity.storage.utilization_percent
        });
      }
      
      // Recomendaciones de items de memoria
      if (currentCapacity.memory_items.utilization_percent > 80) {
        recommendations.push({
          resource: 'memory_items',
          priority: 'medium',
          recommendation: 'Consider increasing memory item limit or implementing cleanup policies',
          current_utilization: currentCapacity.memory_items.utilization_percent,
          projected_utilization: projectedGrowth.memory_items.utilization_percent
        });
      }
      
      return recommendations;
    } catch (error) {
      throw new Error(`Failed to get capacity recommendations: ${error.message}`);
    }
  }

  async generateOptimizationSection(options) {
    try {
      const optimization = {
        performance_optimizations: await this.getPerformanceOptimizations(options),
        resource_optimizations: await this.getResourceOptimizations(options),
        configuration_optimizations: await this.getConfigurationOptimizations(options),
        generated_at: new Date().toISOString()
      };
      
      return optimization;
    } catch (error) {
      throw new Error(`Failed to generate optimization section: ${error.message}`);
    }
  }

  async getPerformanceOptimizations() {
    try {
      const optimizations = [];
      const health = await this.systemManager.health();
      
      // Optimizaciones de memoria
      const memoryUsage = health.checks.memory_usage?.data?.used_percent || 0;
      if (memoryUsage > 70) {
        optimizations.push({
          category: 'memory',
          priority: memoryUsage > 90 ? 'high' : 'medium',
          optimization: 'Optimize memory usage',
          description: 'Reduce memory footprint through optimization techniques',
          expected_improvement: '10-20% memory reduction',
          implementation_effort: 'medium',
          actions: [
            'Implement memory pooling',
            'Optimize data structures',
            'Enable garbage collection tuning'
          ]
        });
      }
      
      // Optimizaciones de CPU
      const cpuUsage = health.checks.cpu_usage?.data?.cpu_usage_percent || 0;
      if (cpuUsage > 70) {
        optimizations.push({
          category: 'cpu',
          priority: cpuUsage > 90 ? 'high' : 'medium',
          optimization: 'Optimize CPU usage',
          description: 'Reduce CPU utilization through code optimization',
          expected_improvement: '15-25% CPU reduction',
          implementation_effort: 'high',
          actions: [
            'Profile and optimize hot paths',
            'Implement caching strategies',
            'Consider asynchronous processing'
          ]
        });
      }
      
      return optimizations;
    } catch (error) {
      throw new Error(`Failed to get performance optimizations: ${error.message}`);
    }
  }

  async getResourceOptimizations() {
    try {
      const optimizations = [];
      
      // Optimización de checkpoints
      const checkpointStats = await this.checkpointManager.getCheckpointStats();
      if (checkpointStats.total_size_mb > 500) {
        optimizations.push({
          category: 'checkpoints',
          priority: 'medium',
          optimization: 'Optimize checkpoint storage',
          description: 'Reduce checkpoint size and improve compression',
          expected_improvement: '30-40% storage reduction',
          implementation_effort: 'low',
          actions: [
            'Enable better compression algorithms',
            'Implement delta checkpoints',
            'Clean up old checkpoints automatically'
          ]
        });
      }
      
      // Optimización de índices de memoria
      const memoryStats = await this.memoryManager.getStats();
      if (memoryStats.total_items > 5000) {
        optimizations.push({
          category: 'memory_indexing',
          priority: 'medium',
          optimization: 'Optimize memory indexing',
          description: 'Improve search performance and reduce memory overhead',
          expected_improvement: '20-30% search performance improvement',
          implementation_effort: 'medium',
          actions: [
            'Implement efficient indexing strategies',
            'Add query result caching',
            'Optimize tag indexing'
          ]
        });
      }
      
      return optimizations;
    } catch (error) {
      throw new Error(`Failed to get resource optimizations: ${error.message}`);
    }
  }

  async getConfigurationOptimizations() {
    try {
      const optimizations = [];
      
      // Optimización de configuración de monitoreo
      optimizations.push({
        category: 'monitoring',
        priority: 'low',
        optimization: 'Optimize monitoring configuration',
        description: 'Fine-tune monitoring parameters for better performance',
        expected_improvement: '5-10% system overhead reduction',
        implementation_effort: 'low',
        actions: [
          'Adjust scrape intervals',
          'Optimize metric retention policies',
          'Fine-tune alert evaluation intervals'
        ]
      });
      
      // Optimización de configuración de logging
      optimizations.push({
        category: 'logging',
        priority: 'low',
        optimization: 'Optimize logging configuration',
        description: 'Reduce logging overhead while maintaining visibility',
        expected_improvement: '5-15% I/O reduction',
        implementation_effort: 'low',
        actions: [
          'Implement log rotation',
          'Adjust log levels',
          'Enable structured logging'
        ]
      });
      
      return optimizations;
    } catch (error) {
      throw new Error(`Failed to get configuration optimizations: ${error.message}`);
    }
  }

  async generateExecutiveSummary(report) {
    try {
      const summary = {
        title: 'Resumen Ejecutivo',
        overall_status: report.summary.overall_status,
        key_findings: [],
        critical_issues: [],
        recommendations: [],
        next_steps: []
      };
      
      // Extraer hallazgos clave de las secciones
      for (const [sectionName, sectionData] of Object.entries(report.sections)) {
        if (sectionData.status === 'completed' && sectionData.data) {
          const findings = this.extractKeyFindings(sectionName, sectionData.data);
          summary.key_findings.push(...findings);
          
          const issues = this.extractCriticalIssues(sectionName, sectionData.data);
          summary.critical_issues.push(...issues);
          
          const recommendations = this.extractRecommendations(sectionName, sectionData.data);
          summary.recommendations.push(...recommendations);
        }
      }
      
      // Generar próximos pasos
      summary.next_steps = this.generateNextSteps(summary);
      
      return {
        ...summary,
        generated_at: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to generate executive summary: ${error.message}`);
    }
  }

  extractKeyFindings(sectionName, sectionData) {
    const findings = [];
    
    switch (sectionName) {
      case 'system_overview':
        if (sectionData.system_info) {
          findings.push({
            category: 'system',
            finding: `Sistema operativo: ${sectionData.system_info.data?.platform || 'Unknown'}`,
            impact: 'low'
          });
        }
        break;
        
      case 'performance_metrics':
        if (sectionData.victoria_metrics?.metrics) {
          const memoryUsage = sectionData.victoria_metrics.metrics.memory_usage_bytes;
          if (memoryUsage && memoryUsage > 0) {
            findings.push({
              category: 'performance',
              finding: `Uso de memoria actual: ${(memoryUsage / 1024 / 1024).toFixed(2)}MB`,
              impact: memoryUsage > 400000000 ? 'high' : 'medium'
            });
          }
        }
        break;
        
      case 'alerts_status':
        if (sectionData.summary) {
          findings.push({
            category: 'alerts',
            finding: `Total de alertas activas: ${sectionData.summary.total}`,
            impact: sectionData.summary.critical > 0 ? 'high' : 'medium'
          });
        }
        break;
    }
    
    return findings;
  }

  extractCriticalIssues(sectionName, sectionData) {
    const issues = [];
    
    switch (sectionName) {
      case 'system_overview':
        if (sectionData.memory_usage && sectionData.memory_usage.used_percent > 90) {
          issues.push({
            category: 'system',
            issue: `Uso de memoria crítico: ${sectionData.memory_usage.used_percent.toFixed(1)}%`,
            severity: 'critical'
          });
        }
        break;
        
      case 'alerts_status':
        if (sectionData.summary && sectionData.summary.critical > 0) {
          issues.push({
            category: 'alerts',
            issue: `${sectionData.summary.critical} alertas críticas activas`,
            severity: 'critical'
          });
        }
        break;
    }
    
    return issues;
  }

  extractRecommendations(sectionName, sectionData) {
    const recommendations = [];
    
    switch (sectionName) {
      case 'recommendations':
        if (sectionData.recommendations) {
          recommendations.push(...sectionData.recommendations.map(rec => ({
            category: 'general',
            recommendation: rec.message,
            priority: rec.priority
          })));
        }
        break;
        
      case 'performance_metrics':
        if (sectionData.victoria_metrics?.metrics) {
          const cpuUsage = sectionData.victoria_metrics.metrics.cpu_usage_percent;
          if (cpuUsage && cpuUsage > 80) {
            recommendations.push({
              category: 'performance',
              recommendation: 'Optimizar uso de CPU',
              priority: 'high'
            });
          }
        }
        break;
    }
    
    return recommendations;
  }

  generateNextSteps(summary) {
    const nextSteps = [];
    
    if (summary.critical_issues.length > 0) {
      nextSteps.push({
        priority: 'immediate',
        action: 'Address critical issues',
        description: 'Investigate and resolve all critical issues identified in this report',
        estimated_effort: 'high'
      });
    }
    
    if (summary.recommendations.length > 0) {
      const highPriorityRecs = summary.recommendations.filter(r => r.priority === 'high');
      if (highPriorityRecs.length > 0) {
        nextSteps.push({
          priority: 'short-term',
          action: 'Implement high-priority recommendations',
          description: `Address ${highPriorityRecs.length} high-priority recommendations`,
          estimated_effort: 'medium'
        });
      }
    }
    
    nextSteps.push({
      priority: 'ongoing',
      action: 'Continue monitoring',
      description: 'Maintain regular monitoring and generate follow-up reports',
      estimated_effort: 'low'
    });
    
    return nextSteps;
  }

  async generateOutputFiles(report, formats) {
    const outputFiles = {};
    
    for (const format of formats) {
      try {
        const fileName = `${report.report_id}.${format}`;
        const filePath = path.join(this.config.storage_path, fileName);
        
        switch (format) {
          case 'json':
            await this.generateJsonReport(report, filePath);
            break;
          case 'markdown':
            await this.generateMarkdownReport(report, filePath);
            break;
          case 'html':
            await this.generateHtmlReport(report, filePath);
            break;
          default:
            logger.warn(`Unsupported format: ${format}`);
            continue;
        }
        
        outputFiles[format] = {
          path: filePath,
          size: (await fs.stat(filePath)).size,
          generated_at: new Date().toISOString()
        };
        
        logger.info(`Generated ${format} report: ${filePath}`);
      } catch (error) {
        logger.error(`Error generating ${format} report:`, error);
      }
    }
    
    return outputFiles;
  }

  async generateJsonReport(report, filePath) {
    const jsonReport = JSON.stringify(report, null, 2);
    await fs.writeFile(filePath, jsonReport, 'utf8');
  }

  async generateMarkdownReport(report, filePath) {
    const markdown = this.convertToMarkdown(report);
    await fs.writeFile(filePath, markdown, 'utf8');
  }

  async generateHtmlReport(report, filePath) {
    const html = this.convertToHtml(report);
    await fs.writeFile(filePath, html, 'utf8');
  }

  convertToMarkdown(report) {
    let markdown = `# ${report.metadata.title}\n\n`;
    markdown += `**Report ID:** ${report.report_id}\n`;
    markdown += `**Generated:** ${report.generated_at}\n`;
    markdown += `**Status:** ${report.summary.overall_status}\n\n`;
    
    // Tabla de contenido
    markdown += `## Table of Contents\n\n`;
    for (const [sectionName, sectionData] of Object.entries(report.sections)) {
      if (sectionData.status === 'completed') {
        markdown += `- [${sectionData.title}](#${sectionName})\n`;
      }
    }
    markdown += `\n`;
    
    // Secciones
    for (const [, sectionData] of Object.entries(report.sections)) {
      if (sectionData.status === 'completed') {
        markdown += `## ${sectionData.title}\n\n`;
        markdown += this.formatSectionAsMarkdown(sectionData.data);
        markdown += `\n`;
      }
    }
    
    return markdown;
  }

  formatSectionAsMarkdown(data) {
    if (!data) return 'No data available\n';
    
    if (typeof data === 'object') {
      let markdown = '';
      for (const [key, value] of Object.entries(data)) {
        markdown += `### ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}\n\n`;
        
        if (typeof value === 'object' && value !== null) {
          if (Array.isArray(value)) {
            markdown += `- ${value.join('\n- ')}\n\n`;
          } else {
            for (const [subKey, subValue] of Object.entries(value)) {
              markdown += `**${subKey}:** ${subValue}\n`;
            }
            markdown += '\n';
          }
        } else {
          markdown += `${value}\n\n`;
        }
      }
      return markdown;
    }
    
    return `${data}\n\n`;
  }

  convertToHtml(report) {
    let html = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${report.metadata.title}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        h1 { color: #333; border-bottom: 2px solid #333; }
        h2 { color: #666; border-bottom: 1px solid #666; }
        h3 { color: #999; }
        .metadata { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .status { padding: 5px 10px; border-radius: 3px; color: white; }
        .status.completed { background: #28a745; }
        .status.partial { background: #ffc107; color: #000; }
        .status.failed { background: #dc3545; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f2f2f2; }
        .critical { color: #dc3545; font-weight: bold; }
        .warning { color: #ffc107; font-weight: bold; }
        .info { color: #17a2b8; }
    </style>
</head>
<body>
    <h1>${report.metadata.title}</h1>
    
    <div class="metadata">
        <p><strong>Report ID:</strong> ${report.report_id}</p>
        <p><strong>Generated:</strong> ${report.generated_at}</p>
        <p><strong>Status:</strong> <span class="status ${report.summary.overall_status}">${report.summary.overall_status.toUpperCase()}</span></p>
    </div>
`;
    
    // Secciones
    for (const [, sectionData] of Object.entries(report.sections)) {
      if (sectionData.status === 'completed') {
        html += `    <h2>${sectionData.title}</h2>\n`;
        html += this.formatSectionAsHtml(sectionData.data);
      }
    }
    
    html += `</body>
</html>`;
    
    return html;
  }

  formatSectionAsHtml(data) {
    if (!data) return '<p>No data available</p>';
    
    if (typeof data === 'object') {
      let html = '';
      for (const [key, value] of Object.entries(data)) {
        html += `    <h3>${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>\n`;
        
        if (typeof value === 'object' && value !== null) {
          if (Array.isArray(value)) {
            html += '    <ul>\n';
            for (const item of value) {
              html += `        <li>${item}</li>\n`;
            }
            html += '    </ul>\n';
          } else {
            html += '    <table>\n';
            for (const [subKey, subValue] of Object.entries(value)) {
              html += `        <tr><td><strong>${subKey}</strong></td><td>${subValue}</td></tr>\n`;
            }
            html += '    </table>\n';
          }
        } else {
          html += `    <p>${value}</p>\n`;
        }
      }
      return html;
    }
    
    return `<p>${data}</p>\n`;
  }

  async cleanupOldReports() {
    try {
      if (this.reports.size <= this.config.max_reports) {
        return;
      }
      
      // Ordenar reportes por timestamp (más antiguo primero)
      const sortedReports = Array.from(this.reports.entries())
        .sort((a, b) => new Date(a[1].generated_at) - new Date(b[1].generated_at));
      
      // Eliminar reportes excedentes
      const toDelete = sortedReports.slice(0, this.reports.size - this.config.max_reports);
      
      for (const [reportId, report] of toDelete) {
        // Eliminar archivos de salida
        if (report.output_files) {
          for (const [, fileInfo] of Object.entries(report.output_files)) {
            try {
              await fs.unlink(fileInfo.path);
              logger.info(`Deleted report file: ${fileInfo.path}`);
            } catch (error) {
              logger.warn(`Could not delete report file ${fileInfo.path}:`, error.message);
            }
          }
        }
        
        // Eliminar del índice
        this.reports.delete(reportId);
        logger.info(`Deleted old report: ${reportId}`);
      }
      
      await this.saveReports();
    } catch (error) {
      logger.error('Error cleaning up old reports:', error);
    }
  }

  async getReport(reportId) {
    await this.initialize();
    
    if (!this.reports.has(reportId)) {
      throw new Error(`Report not found: ${reportId}`);
    }
    
    return this.reports.get(reportId);
  }

  async listReports(limit = 20) {
    await this.initialize();
    
    const reports = Array.from(this.reports.values())
      .sort((a, b) => new Date(b.generated_at) - new Date(a.generated_at))
      .slice(0, limit);
    
    return {
      reports,
      count: reports.length,
      total_reports: this.reports.size,
      listed_at: new Date().toISOString()
    };
  }

  async getTemplate(templateName) {
    await this.initialize();
    
    if (!this.templates.has(templateName)) {
      throw new Error(`Template not found: ${templateName}`);
    }
    
    return this.templates.get(templateName);
  }

  async listTemplates() {
    await this.initialize();
    
    const templates = Array.from(this.templates.values());
    
    return {
      templates,
      count: templates.length,
      listed_at: new Date().toISOString()
    };
  }
}

export default ReportsManager;
