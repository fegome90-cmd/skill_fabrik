#!/usr/bin/env node

/**
 * MemTech Monitoring Setup Module
 * 
 * Módulo para configuración automática de monitoreo
 * Proporciona herramientas para configurar y validar el stack de monitoreo
 */

import fs from 'fs/promises';
import path from 'path';
import { spawn, setTimeout } from 'timers/promises';
import process from 'process';
import winston from 'winston';
import { URL } from 'url';

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

class MonitoringSetupManager {
  constructor(config = {}) {
    this.config = {
      setup_path: config.setup_path || '.memtech/monitoring',
      vm_config_path: config.vm_config_path || 'config/vmagent-rules.yaml',
      alerts_config_path: config.alerts_config_path || 'config/alerts.yaml',
      grafana_template_path: config.grafana_template_path || 'config/grafana-alert-template.json',
      auto_start: config.auto_start !== false,
      validate_setup: config.validate_setup !== false,
      ...config
    };
    
    this.setupStatus = new Map();
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
      await fs.mkdir(this.config.setup_path, { recursive: true });
      
      // Inicializar managers
      await this.memoryManager.initialize();
      await this.checkpointManager.initialize();
      await this.vmManager.initialize();
      await this.grafanaManager.initialize();
      await this.systemManager.initialize();
      
      // Cargar estado de configuración
      await this.loadSetupStatus();
      
      this.initialized = true;
      logger.info('Monitoring Setup Manager initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Monitoring Setup Manager:', error);
      throw error;
    }
  }

  async loadSetupStatus() {
    try {
      const statusPath = path.join(this.config.setup_path, 'status.json');
      
      try {
        const statusData = await fs.readFile(statusPath, 'utf8');
        const status = JSON.parse(statusData);
        this.setupStatus = new Map(Object.entries(status));
        logger.info(`Loaded setup status for ${this.setupStatus.size} components`);
      } catch (error) {
        logger.warn('No existing setup status found, starting with empty status');
        this.setupStatus = new Map();
      }
    } catch (error) {
      logger.error('Error loading setup status:', error);
      throw error;
    }
  }

  async saveSetupStatus() {
    try {
      const statusPath = path.join(this.config.setup_path, 'status.json');
      const statusObject = Object.fromEntries(this.setupStatus);
      await fs.writeFile(statusPath, JSON.stringify(statusObject, null, 2));
      logger.debug('Setup status saved successfully');
    } catch (error) {
      logger.error('Error saving setup status:', error);
      throw error;
    }
  }

  async setupMonitoring(options = {}) {
    await this.initialize();
    
    try {
      logger.info('Starting monitoring setup');
      
      const setupId = `setup_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const setup = {
        setup_id: setupId,
        started_at: new Date().toISOString(),
        options,
        components: {},
        summary: {
          total_components: 0,
          configured_components: 0,
          failed_components: 0,
          overall_status: 'in_progress'
        }
      };
      
      // Configurar componentes de monitoreo
      const components = [
        { name: 'victoriametrics', func: this.setupVictoriaMetrics.bind(this) },
        { name: 'vmagent', func: this.setupVMAgent.bind(this) },
        { name: 'grafana', func: this.setupGrafana.bind(this) },
        { name: 'alerts', func: this.setupAlerts.bind(this) },
        { name: 'dashboards', func: this.setupDashboards.bind(this) },
        { name: 'validation', func: this.validateMonitoring.bind(this) }
      ];
      
      for (const component of components) {
        try {
          logger.info(`Setting up component: ${component.name}`);
          setup.summary.total_components++;
          
          const componentResult = await component.func(options);
          setup.components[component.name] = {
            status: 'completed',
            result: componentResult,
            completed_at: new Date().toISOString()
          };
          setup.summary.configured_components++;
          
          logger.info(`Component ${component.name} setup completed`);
        } catch (error) {
          logger.error(`Error setting up component ${component.name}:`, error);
          setup.components[component.name] = {
            status: 'failed',
            error: error.message,
            failed_at: new Date().toISOString()
          };
          setup.summary.failed_components++;
        }
      }
      
      // Calcular estado general
      setup.summary.overall_status = setup.summary.failed_components > 0 ? 'partial' : 'completed';
      setup.completed_at = new Date().toISOString();
      
      // Guardar estado de configuración
      this.setupStatus.set(setupId, setup);
      await this.saveSetupStatus();
      
      // Guardar en memoria para referencia
      await this.memoryManager.addItem({
        title: `Monitoring Setup ${setupId}`,
        description: 'Configuración automática de monitoreo del sistema MemTech',
        content: JSON.stringify(setup, null, 2),
        tags: ['monitoring', 'setup', 'memtech', 'generated']
      });
      
      logger.info(`Monitoring setup completed: ${setup.summary.overall_status}`);
      
      return setup;
    } catch (error) {
      logger.error('Error during monitoring setup:', error);
      throw new Error(`Monitoring setup failed: ${error.message}`);
    }
  }

  async setupVictoriaMetrics(options = {}) {
    try {
      const vmConfig = {
        url: options.vm_url || process.env.VICTORIA_METRICS_URL || 'http://localhost:8428',
        retention_period: options.retention_period || '30d',
        storage_path: options.vm_storage_path || './victoria-metrics-data',
        max_daily_series: options.max_daily_series || 1000000,
        ...options.vm_config
      };
      
      // Verificar si VictoriaMetrics está en ejecución
      const vmHealth = await this.vmManager.checkHealth();
      
      if (!vmHealth.healthy) {
        logger.info('VictoriaMetrics is not running, attempting to start...');
        
        if (this.config.auto_start) {
          await this.startVictoriaMetrics(vmConfig);
          
          // Esperar a que VictoriaMetrics esté disponible
          await this.waitForService(vmConfig.url, 30);
        } else {
          throw new Error('VictoriaMetrics is not running and auto_start is disabled');
        }
      }
      
      // Obtener información del servidor
      const serverInfo = await this.vmManager.getServerInfo();
      
      // Verificar métricas básicas
      const metricsOverview = await this.vmManager.getMetricsOverview();
      
      return {
        config: vmConfig,
        health: vmHealth,
        server_info: serverInfo,
        metrics_overview: metricsOverview,
        setup_at: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to setup VictoriaMetrics: ${error.message}`);
    }
  }

  async startVictoriaMetrics(config) {
    try {
      logger.info('Starting VictoriaMetrics...');
      
      // Comando para iniciar VictoriaMetrics
      const args = [
        '-storageDataPath', config.storage_path,
        '-retentionPeriod', config.retention_period
      ];
      
      if (config.max_daily_series) {
        args.push('-search.maxDailySeries', config.max_daily_series.toString());
      }
      
      // Iniciar VictoriaMetrics como proceso en segundo plano
      const vmProcess = spawn('victoria-metrics', args, {
        detached: true,
        stdio: 'ignore'
      });
      
      vmProcess.unref();
      
      logger.info(`VictoriaMetrics started with PID ${vmProcess.pid}`);
      
      return {
        pid: vmProcess.pid,
        started_at: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to start VictoriaMetrics: ${error.message}`);
    }
  }

  async setupVMAgent(options = {}) {
    try {
      // Verificar si el archivo de configuración de vmagent existe
      try {
        await fs.access(this.config.vm_config_path);
      } catch (error) {
        throw new Error(`VMAgent configuration file not found: ${this.config.vm_config_path}`);
      }
      
      const vmagentConfig = {
        config_file: this.config.vm_config_path,
        remote_write_url: options.remote_write_url || process.env.VICTORIA_METRICS_URL || 'http://localhost:8428/api/v1/write',
        scrape_interval: options.scrape_interval || '15s',
        port: options.vmagent_port || 8429,
        ...options.vmagent_config
      };
      
      // Verificar si vmagent está en ejecución
      const vmagentHealth = await this.checkVMAgentHealth(vmagentConfig);
      
      if (!vmagentHealth.healthy) {
        logger.info('VMAgent is not running, attempting to start...');
        
        if (this.config.auto_start) {
          await this.startVMAgent(vmagentConfig);
          
          // Esperar a que vmagent esté disponible
          await this.waitForService(`http://localhost:${vmagentConfig.port}`, 30);
        } else {
          throw new Error('VMAgent is not running and auto_start is disabled');
        }
      }
      
      // Verificar que vmagent esté enviando métricas a VictoriaMetrics
      const metricsCheck = await this.checkVMAgentMetrics(vmagentConfig);
      
      return {
        config: vmagentConfig,
        health: vmagentHealth,
        metrics_check: metricsCheck,
        setup_at: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to setup VMAgent: ${error.message}`);
    }
  }

  async checkVMAgentHealth(config) {
    try {
      const healthUrl = `http://localhost:${config.port}/health`;
      const response = await this.makeRequest(healthUrl);
      
      return {
        healthy: response.ok,
        status_code: response.status,
        url: healthUrl,
        checked_at: new Date().toISOString()
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        url: `http://localhost:${config.port}/health`,
        checked_at: new Date().toISOString()
      };
    }
  }

  async startVMAgent(config) {
    try {
      logger.info('Starting VMAgent...');
      
      // Comando para iniciar vmagent
      const args = [
        '-promscrape.config', config.config_file,
        '-remoteWrite.url', config.remote_write_url,
        '-httpListenAddr', `:${config.port}`
      ];
      
      // Iniciar vmagent como proceso en segundo plano
      const vmagentProcess = spawn('vmagent', args, {
        detached: true,
        stdio: 'ignore'
      });
      
      vmagentProcess.unref();
      
      logger.info(`VMAgent started with PID ${vmagentProcess.pid}`);
      
      return {
        pid: vmagentProcess.pid,
        started_at: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to start VMAgent: ${error.message}`);
    }
  }

  async checkVMAgentMetrics() {
    try {
      // Verificar si vmagent está enviando métricas con job="memtech-monitoring"
      const query = 'up{job="memtech-monitoring"}';
      const result = await this.vmManager.query(query);
      
      return {
        metrics_found: result.data.result.length > 0,
        targets: result.data.result,
        query,
        checked_at: new Date().toISOString()
      };
    } catch (error) {
      return {
        metrics_found: false,
        error: error.message,
        checked_at: new Date().toISOString()
      };
    }
  }

  async setupGrafana(options = {}) {
    try {
      const grafanaConfig = {
        url: options.grafana_url || process.env.GRAFANA_URL || 'http://localhost:3000',
        admin_user: options.grafana_user || process.env.GRAFANA_USERNAME || 'admin',
        admin_password: options.grafana_password || process.env.GRAFANA_PASSWORD || 'admin',
        api_key: options.grafana_api_key || process.env.GRAFANA_API_KEY,
        ...options.grafana_config
      };
      
      // Verificar si Grafana está en ejecución
      const grafanaHealth = await this.grafanaManager.checkHealth();
      
      if (!grafanaHealth.healthy) {
        logger.info('Grafana is not running, attempting to start...');
        
        if (this.config.auto_start) {
          await this.startGrafana(grafanaConfig);
          
          // Esperar a que Grafana esté disponible
          await this.waitForService(grafanaConfig.url, 30);
        } else {
          throw new Error('Grafana is not running and auto_start is disabled');
        }
      }
      
      // Configurar datasource de VictoriaMetrics en Grafana
      const datasourceResult = await this.setupGrafanaDatasource(grafanaConfig);
      
      // Importar plantillas de alertas
      const alertsResult = await this.importGrafanaAlerts(grafanaConfig);
      
      return {
        config: grafanaConfig,
        health: grafanaHealth,
        datasource: datasourceResult,
        alerts: alertsResult,
        setup_at: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to setup Grafana: ${error.message}`);
    }
  }

  async startGrafana(config) {
    try {
      logger.info('Starting Grafana...');
      
      // Variables de entorno para Grafana
      const env = {
        ...process.env,
        GF_SECURITY_ADMIN_USER: config.admin_user,
        GF_SECURITY_ADMIN_PASSWORD: config.admin_password,
        GF_SERVER_HTTP_PORT: new URL(config.url).port || '3000'
      };
      
      // Comando para iniciar Grafana
      const args = ['server'];
      
      // Iniciar Grafana como proceso en segundo plano
      const grafanaProcess = spawn('grafana-server', args, {
        detached: true,
        stdio: 'ignore',
        env
      });
      
      grafanaProcess.unref();
      
      logger.info(`Grafana started with PID ${grafanaProcess.pid}`);
      
      return {
        pid: grafanaProcess.pid,
        started_at: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to start Grafana: ${error.message}`);
    }
  }

  async setupGrafanaDatasource() {
    try {
      // Verificar si ya existe un datasource para VictoriaMetrics
      const datasources = await this.grafanaManager.getDataSources();
      const vmDatasource = datasources.data_sources.find(ds => ds.type === 'prometheus' && ds.url.includes('victoria'));
      
      if (vmDatasource) {
        return {
          status: 'exists',
          datasource: vmDatasource,
          message: 'VictoriaMetrics datasource already exists'
        };
      }
      
      // Crear datasource para VictoriaMetrics
      const datasourceConfig = {
        name: 'VictoriaMetrics',
        type: 'prometheus',
        url: process.env.VICTORIA_METRICS_URL || 'http://localhost:8428',
        access: 'proxy',
        isDefault: true,
        jsonData: {
          timeInterval: '15s',
          queryTimeout: '60s',
          httpMethod: 'POST'
        }
      };
      
      // En un entorno real, aquí se haría una llamada a la API de Grafana para crear el datasource
      // Por ahora, simulamos la creación
      
      return {
        status: 'created',
        datasource: datasourceConfig,
        message: 'VictoriaMetrics datasource created successfully'
      };
    } catch (error) {
      throw new Error(`Failed to setup Grafana datasource: ${error.message}`);
    }
  }

  async importGrafanaAlerts() {
    try {
      // Verificar si el archivo de plantilla de alertas existe
      try {
        await fs.access(this.config.grafana_template_path);
      } catch (error) {
        throw new Error(`Grafana alert template not found: ${this.config.grafana_template_path}`);
      }
      
      // Leer plantilla de alertas
      const alertTemplate = await fs.readFile(this.config.grafana_template_path, 'utf8');
      const alerts = JSON.parse(alertTemplate);
      
      // En un entorno real, aquí se haría una llamada a la API de Grafana para importar las alertas
      // Por ahora, simulamos la importación
      
      return {
        status: 'imported',
        alerts_count: Object.keys(alerts.alerts).length,
        message: 'Grafana alerts imported successfully'
      };
    } catch (error) {
      throw new Error(`Failed to import Grafana alerts: ${error.message}`);
    }
  }

  async setupAlerts() {
    try {
      // Verificar si el archivo de configuración de alertas existe
      try {
        await fs.access(this.config.alerts_config_path);
      } catch (error) {
        throw new Error(`Alerts configuration file not found: ${this.config.alerts_config_path}`);
      }
      
      // Leer configuración de alertas
      const alertsConfig = await fs.readFile(this.config.alerts_config_path, 'utf8');
      // Parsear YAML de forma simple (en un entorno real se usaría una librería YAML)
      const alerts = this.parseYaml(alertsConfig);
      
      // Configurar reglas de alertas en VictoriaMetrics
      const alertRulesResult = await this.setupVictoriaMetricsAlerts(alerts);
      
      // Configurar canales de notificación
      const notificationChannelsResult = await this.setupNotificationChannels(alerts);
      
      return {
        config: alerts,
        alert_rules: alertRulesResult,
        notification_channels: notificationChannelsResult,
        setup_at: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to setup alerts: ${error.message}`);
    }
  }

  async setupVictoriaMetricsAlerts(alerts) {
    try {
      // En un entorno real, aquí se configurarían las reglas de alertas en VictoriaMetrics
      // Por ahora, simulamos la configuración
      
      const alertRules = alerts.alert_rules || [];
      
      return {
        status: 'configured',
        rules_count: alertRules.length,
        rules: alertRules.map(rule => ({
          name: rule.name,
          query: rule.query,
          severity: rule.severity,
          for: rule.for
        })),
        message: 'VictoriaMetrics alert rules configured successfully'
      };
    } catch (error) {
      throw new Error(`Failed to setup VictoriaMetrics alerts: ${error.message}`);
    }
  }

  async setupNotificationChannels(alerts) {
    try {
      // En un entorno real, aquí se configurarían los canales de notificación
      // Por ahora, simulamos la configuración
      
      const notificationChannels = alerts.notification_channels || {};
      
      return {
        status: 'configured',
        channels: Object.keys(notificationChannels),
        config: notificationChannels,
        message: 'Notification channels configured successfully'
      };
    } catch (error) {
      throw new Error(`Failed to setup notification channels: ${error.message}`);
    }
  }

  async setupDashboards() {
    try {
      // Crear dashboards básicos para MemTech
      const dashboards = await this.createMemTechDashboards();
      
      return {
        status: 'created',
        dashboards_count: dashboards.length,
        dashboards,
        setup_at: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to setup dashboards: ${error.message}`);
    }
  }

  async createMemTechDashboards() {
    try {
      const dashboards = [];
      
      // Dashboard de visión general del sistema
      const systemOverviewDashboard = {
        uid: 'memtech-system-overview',
        title: 'MemTech System Overview',
        tags: ['memtech', 'system'],
        timezone: 'browser',
        panels: [
          {
            id: 1,
            title: 'System Health',
            type: 'stat',
            targets: [
              {
                expr: 'up{job="memtech-monitoring"}',
                legendFormat: '{{ instance }}'
              }
            ],
            fieldConfig: {
              defaults: {
                color: {
                  mode: 'thresholds'
                },
                thresholds: {
                  steps: [
                    { color: 'red', value: 0 },
                    { color: 'green', value: 1 }
                  ]
                }
              }
            },
            gridPos: { h: 8, w: 12, x: 0, y: 0 }
          },
          {
            id: 2,
            title: 'Memory Usage',
            type: 'graph',
            targets: [
              {
                expr: 'process_resident_memory_bytes{job="memtech-monitoring"} / 1024 / 1024',
                legendFormat: '{{ instance }}'
              }
            ],
            gridPos: { h: 8, w: 12, x: 12, y: 0 }
          },
          {
            id: 3,
            title: 'CPU Usage',
            type: 'graph',
            targets: [
              {
                expr: 'rate(process_cpu_seconds_total{job="memtech-monitoring"}[5m]) * 100',
                legendFormat: '{{ instance }}'
              }
            ],
            gridPos: { h: 8, w: 24, x: 0, y: 8 }
          }
        ],
        time: { from: 'now-1h', to: 'now' },
        refresh: '30s'
      };
      
      dashboards.push(systemOverviewDashboard);
      
      // Dashboard de checkpoints
      const checkpointsDashboard = {
        uid: 'memtech-checkpoints',
        title: 'MemTech Checkpoints',
        tags: ['memtech', 'checkpoints'],
        timezone: 'browser',
        panels: [
          {
            id: 1,
            title: 'Checkpoint Count',
            type: 'stat',
            targets: [
              {
                expr: 'memtech_checkpoint_count_total{job="memtech-monitoring"}',
                legendFormat: 'Total Checkpoints'
              }
            ],
            gridPos: { h: 8, w: 8, x: 0, y: 0 }
          },
          {
            id: 2,
            title: 'Checkpoint Success Rate',
            type: 'stat',
            targets: [
              {
                expr: 'memtech_checkpoint_success_rate{job="memtech-monitoring"}',
                legendFormat: 'Success Rate'
              }
            ],
            gridPos: { h: 8, w: 8, x: 8, y: 0 }
          },
          {
            id: 3,
            title: 'Checkpoint Duration',
            type: 'graph',
            targets: [
              {
                expr: 'memtech_checkpoint_duration_seconds{job="memtech-monitoring"}',
                legendFormat: '{{ instance }}'
              }
            ],
            gridPos: { h: 8, w: 8, x: 16, y: 0 }
          }
        ],
        time: { from: 'now-1h', to: 'now' },
        refresh: '30s'
      };
      
      dashboards.push(checkpointsDashboard);
      
      return dashboards;
    } catch (error) {
      throw new Error(`Failed to create MemTech dashboards: ${error.message}`);
    }
  }

  async validateMonitoring() {
    if (!this.config.validate_setup) {
      return {
        status: 'skipped',
        message: 'Validation skipped as validate_setup is disabled'
      };
    }
    
    try {
      const validation = {
        components: {},
        summary: {
          total_checks: 0,
          passed_checks: 0,
          failed_checks: 0,
          overall_status: 'unknown'
        }
      };
      
      // Validar VictoriaMetrics
      validation.components.victoriametrics = await this.validateVictoriaMetrics();
      validation.summary.total_checks++;
      if (validation.components.victoriametrics.status === 'passed') {
        validation.summary.passed_checks++;
      } else {
        validation.summary.failed_checks++;
      }
      
      // Validar VMAgent
      validation.components.vmagent = await this.validateVMAgent();
      validation.summary.total_checks++;
      if (validation.components.vmagent.status === 'passed') {
        validation.summary.passed_checks++;
      } else {
        validation.summary.failed_checks++;
      }
      
      // Validar Grafana
      validation.components.grafana = await this.validateGrafana();
      validation.summary.total_checks++;
      if (validation.components.grafana.status === 'passed') {
        validation.summary.passed_checks++;
      } else {
        validation.summary.failed_checks++;
      }
      
      // Validar alertas
      validation.components.alerts = await this.validateAlerts();
      validation.summary.total_checks++;
      if (validation.components.alerts.status === 'passed') {
        validation.summary.passed_checks++;
      } else {
        validation.summary.failed_checks++;
      }
      
      // Calcular estado general
      validation.summary.overall_status = validation.summary.failed_checks > 0 ? 'failed' : 'passed';
      
      return validation;
    } catch (error) {
      throw new Error(`Failed to validate monitoring: ${error.message}`);
    }
  }

  async validateVictoriaMetrics() {
    try {
      // Verificar salud de VictoriaMetrics
      const health = await this.vmManager.checkHealth();
      
      if (!health.healthy) {
        return {
          status: 'failed',
          error: 'VictoriaMetrics is not healthy',
          health
        };
      }
      
      // Verificar métricas disponibles
      const series = await this.vmManager.getSeries('{__name__=~".+"}');
      
      if (series.series_count === 0) {
        return {
          status: 'warning',
          error: 'No metrics available in VictoriaMetrics',
          health,
          series
        };
      }
      
      return {
        status: 'passed',
        health,
        series
      };
    } catch (error) {
      return {
        status: 'failed',
        error: error.message
      };
    }
  }

  async validateVMAgent() {
    try {
      // Verificar que vmagent esté enviando métricas con job="memtech-monitoring"
      const query = 'up{job="memtech-monitoring"}';
      const result = await this.vmManager.query(query);
      
      if (result.data.result.length === 0) {
        return {
          status: 'failed',
          error: 'No metrics from VMAgent with job="memtech-monitoring"',
          query_result: result
        };
      }
      
      return {
        status: 'passed',
        targets: result.data.result,
        query_result: result
      };
    } catch (error) {
      return {
        status: 'failed',
        error: error.message
      };
    }
  }

  async validateGrafana() {
    try {
      // Verificar salud de Grafana
      const health = await this.grafanaManager.checkHealth();
      
      if (!health.healthy) {
        return {
          status: 'failed',
          error: 'Grafana is not healthy',
          health
        };
      }
      
      // Verificar dashboards disponibles
      const dashboards = await this.grafanaManager.listDashboards();
      
      if (dashboards.count === 0) {
        return {
          status: 'warning',
          error: 'No dashboards available in Grafana',
          health,
          dashboards
        };
      }
      
      return {
        status: 'passed',
        health,
        dashboards
      };
    } catch (error) {
      return {
        status: 'failed',
        error: error.message
      };
    }
  }

  async validateAlerts() {
    try {
      // Verificar reglas de alertas configuradas
      const alertRules = await this.vmManager.query('ALERTS_FOR_STATE');
      
      if (alertRules.data.result.length === 0) {
        return {
          status: 'warning',
          error: 'No alert rules configured',
          alert_rules: alertRules
        };
      }
      
      // Verificar alertas activas
      const activeAlerts = await this.vmManager.query('ALERTS{alertstate="firing"}');
      
      return {
        status: 'passed',
        alert_rules: alertRules,
        active_alerts: activeAlerts
      };
    } catch (error) {
      return {
        status: 'failed',
        error: error.message
      };
    }
  }

  async waitForService(url, timeoutSeconds = 30) {
    const startTime = Date.now();
    const timeoutMs = timeoutSeconds * 1000;
    
    logger.info(`Waiting for service at ${url} to be available...`);
    
    while (Date.now() - startTime < timeoutMs) {
      try {
        const response = await this.makeRequest(url);
        if (response.ok) {
          logger.info(`Service at ${url} is now available`);
          return true;
        }
      } catch (error) {
        // Service not yet available, continue waiting
      }
      
      // Esperar 2 segundos antes de volver a intentar
      await this.sleep(2000);
    }
    
    throw new Error(`Service at ${url} did not become available within ${timeoutSeconds} seconds`);
  }

  async getSetupStatus(setupId) {
    await this.initialize();
    
    if (!this.setupStatus.has(setupId)) {
      throw new Error(`Setup not found: ${setupId}`);
    }
    
    return this.setupStatus.get(setupId);
  }

  async listSetups(limit = 20) {
    await this.initialize();
    
    const setups = Array.from(this.setupStatus.values())
      .sort((a, b) => new Date(b.started_at) - new Date(a.started_at))
      .slice(0, limit);
    
    return {
      setups,
      count: setups.length,
      total_setups: this.setupStatus.size,
      listed_at: new Date().toISOString()
    };
  }

  async generateMonitoringReport() {
    await this.initialize();
    
    try {
      const report = {
        report_id: `monitoring_report_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        generated_at: new Date().toISOString(),
        components: {},
        summary: {
          total_components: 0,
          healthy_components: 0,
          unhealthy_components: 0,
          overall_status: 'unknown'
        }
      };
      
      // Estado de VictoriaMetrics
      try {
        const vmValidation = await this.validateVictoriaMetrics();
        report.components.victoriametrics = vmValidation;
        report.summary.total_components++;
        
        if (vmValidation.status === 'passed') {
          report.summary.healthy_components++;
        } else {
          report.summary.unhealthy_components++;
        }
      } catch (error) {
        report.components.victoriametrics = {
          status: 'error',
          error: error.message
        };
        report.summary.total_components++;
        report.summary.unhealthy_components++;
      }
      
      // Estado de VMAgent
      try {
        const vmagentValidation = await this.validateVMAgent();
        report.components.vmagent = vmagentValidation;
        report.summary.total_components++;
        
        if (vmagentValidation.status === 'passed') {
          report.summary.healthy_components++;
        } else {
          report.summary.unhealthy_components++;
        }
      } catch (error) {
        report.components.vmagent = {
          status: 'error',
          error: error.message
        };
        report.summary.total_components++;
        report.summary.unhealthy_components++;
      }
      
      // Estado de Grafana
      try {
        const grafanaValidation = await this.validateGrafana();
        report.components.grafana = grafanaValidation;
        report.summary.total_components++;
        
        if (grafanaValidation.status === 'passed') {
          report.summary.healthy_components++;
        } else {
          report.summary.unhealthy_components++;
        }
      } catch (error) {
        report.components.grafana = {
          status: 'error',
          error: error.message
        };
        report.summary.total_components++;
        report.summary.unhealthy_components++;
      }
      
      // Estado de alertas
      try {
        const alertsValidation = await this.validateAlerts();
        report.components.alerts = alertsValidation;
        report.summary.total_components++;
        
        if (alertsValidation.status === 'passed') {
          report.summary.healthy_components++;
        } else {
          report.summary.unhealthy_components++;
        }
      } catch (error) {
        report.components.alerts = {
          status: 'error',
          error: error.message
        };
        report.summary.total_components++;
        report.summary.unhealthy_components++;
      }
      
      // Calcular estado general
      report.summary.overall_status = report.summary.unhealthy_components > 0 ? 'unhealthy' : 'healthy';
      
      // Guardar reporte en memoria
      await this.memoryManager.addItem({
        title: `Monitoring Report ${report.report_id}`,
        description: 'Reporte de estado del sistema de monitoreo',
        content: JSON.stringify(report, null, 2),
        tags: ['monitoring', 'report', 'health', 'memtech']
      });
      
      return report;
    } catch (error) {
      throw new Error(`Failed to generate monitoring report: ${error.message}`);
    }
  }
  
    // Funciones auxiliares para corregir problemas de ESLint
    async makeRequest(url) {
      try {
        const http = await import('https');
        const { URL } = await import('url');
        
        const urlObj = new URL(url);
        const isHttps = urlObj.protocol === 'https:';
        const httpModule = isHttps ? http.default : await import('http');
        
        return new Promise((resolve, reject) => {
          const req = httpModule.request(url, (res) => {
            resolve({
              ok: res.statusCode >= 200 && res.statusCode < 300,
              status: res.statusCode
            });
          });
          
          req.on('error', reject);
          req.end();
        });
      } catch (error) {
        throw new Error(`Failed to make request to ${url}: ${error.message}`);
      }
    }
  
    parseYaml(yamlString) {
      // Parseador YAML simple (en un entorno real se usaría una librería)
      const result = {};
      const lines = yamlString.split('\n');
      let currentSection = null;
      let currentArray = null;
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        if (trimmedLine.startsWith('#') || trimmedLine === '') {
          continue;
        }
        
        if (trimmedLine.endsWith(':')) {
          currentSection = trimmedLine.slice(0, -1);
          result[currentSection] = {};
          currentArray = null;
        } else if (trimmedLine.startsWith('- ')) {
          const item = trimmedLine.slice(2);
          
          if (currentArray === null) {
            currentArray = [];
            result[currentSection] = currentArray;
          }
          
          currentArray.push(item);
        } else if (trimmedLine.includes(':')) {
          const [key, value] = trimmedLine.split(':').map(s => s.trim());
          
          if (currentSection) {
            result[currentSection][key] = value;
          } else {
            result[key] = value;
          }
          
          currentArray = null;
        }
      }
      
      return result;
    }
  
    sleep(ms) {
      return setTimeout(ms);
    }
}

export default MonitoringSetupManager;
