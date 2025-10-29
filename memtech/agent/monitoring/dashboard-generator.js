/**
 * MemTech Dashboard Generator v2.1
 * Genera dashboards en tiempo real para monitoreo
 */

import { EventEmitter } from 'events';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class DashboardGenerator extends EventEmitter {
  constructor(options = {}) {
    super();
    this.config = {
      outputDir: options.outputDir || path.join(__dirname, '../../dashboards'),
      updateInterval: options.updateInterval || 5000, // 5 segundos
      enableHTML: options.enableHTML !== false,
      enableJSON: options.enableJSON !== false,
      enableGrafana: options.enableGrafana !== false,
      ...options,
    };

    this.isGenerating = false;
    this.generationTimer = null;
    this.templates = new Map();
  }

  async initialize() {
    console.log('🔧 Inicializando Dashboard Generator...');

    // Crear directorio de salida si no existe
    await this.ensureOutputDirectory();

    // Cargar plantillas
    await this.loadTemplates();

    // Iniciar generación automática
    this.startGeneration();

    console.log('✅ Dashboard Generator inicializado');
  }

  async ensureOutputDirectory() {
    try {
      await fs.mkdir(this.config.outputDir, { recursive: true });
      console.log(`📁 Directorio de dashboards: ${this.config.outputDir}`);
    } catch (error) {
      console.error('❌ Error creando directorio de dashboards:', error);
      throw error;
    }
  }

  async loadTemplates() {
    // Plantilla HTML básica
    this.templates.set('html', this.getHTMLTemplate());

    // Plantilla JSON para APIs
    this.templates.set('json', this.getJSONTemplate());

    // Plantilla Grafana
    this.templates.set('grafana', this.getGrafanaTemplate());

    console.log('📋 Plantillas de dashboard cargadas');
  }

  startGeneration() {
    if (this.isGenerating) {
      console.log('🔍 Dashboard Generator ya está generando');
      return;
    }

    this.isGenerating = true;
    this.generationTimer = setInterval(() => {
      this.generateDashboards();
    }, this.config.updateInterval);

    console.log(`📊 Generación de dashboards iniciada cada ${this.config.updateInterval}ms`);
  }

  stopGeneration() {
    if (!this.isGenerating) {
      return;
    }

    this.isGenerating = false;
    if (this.generationTimer) {
      clearInterval(this.generationTimer);
      this.generationTimer = null;
    }

    console.log('🛑 Generación de dashboards detenida');
  }

  async generateDashboards(metrics = null) {
    try {
      const dashboardData = await this.collectDashboardData(metrics);

      // Generar HTML
      if (this.config.enableHTML) {
        await this.generateHTMLDashboard(dashboardData);
      }

      // Generar JSON
      if (this.config.enableJSON) {
        await this.generateJSONDashboard(dashboardData);
      }

      // Generar Grafana
      if (this.config.enableGrafana) {
        await this.generateGrafanaDashboard(dashboardData);
      }

      // Solo emitir evento cada 10 generaciones para reducir spam
      this.generationCount = (this.generationCount || 0) + 1;
      if (this.generationCount % 10 === 0) {
        this.emit('dashboard_generated', {
          ...dashboardData,
          generation_count: this.generationCount,
        });
      }
    } catch (error) {
      console.error('❌ Error generando dashboards:', error);
      this.emit('error', { type: 'dashboard_generation', error });
    }
  }

  async collectDashboardData(metrics = null) {
    const timestamp = Date.now();

    // Si no se proporcionan métricas, usar datos simulados
    if (!metrics) {
      metrics = this.generateMockMetrics();
    }

    return {
      timestamp,
      system: {
        status: this.determineSystemStatus(metrics),
        uptime: this.calculateUptime(),
        version: '2.1.0',
      },
      performance: {
        throughput: metrics.gauges?.throughput || 0,
        avg_response_time: this.calculateAverageResponseTime(metrics),
        success_rate: this.calculateSuccessRate(metrics),
        error_rate: this.calculateErrorRate(metrics),
      },
      resources: {
        memory_usage: metrics.gauges?.memory_usage || 0,
        active_connections: metrics.gauges?.active_connections || 0,
        queue_size: metrics.gauges?.queue_size || 0,
      },
      counters: metrics.counters || {},
      gauges: metrics.gauges || {},
      histograms: this.processHistograms(metrics.histograms || {}),
      alerts: this.getActiveAlerts(),
    };
  }

  generateMockMetrics() {
    return {
      counters: {
        total_artifacts_processed: Math.floor(Math.random() * 10000),
        successful_artifacts: Math.floor(Math.random() * 9000),
        failed_artifacts: Math.floor(Math.random() * 1000),
        admission_validations: Math.floor(Math.random() * 10000),
        routing_decisions: Math.floor(Math.random() * 10000),
        store_operations: Math.floor(Math.random() * 10000),
        outbox_events: Math.floor(Math.random() * 5000),
        errors: Math.floor(Math.random() * 100),
        warnings: Math.floor(Math.random() * 50),
      },
      gauges: {
        active_connections: Math.floor(Math.random() * 50),
        queue_size: Math.floor(Math.random() * 100),
        memory_usage: Math.floor(Math.random() * 500) + 100,
        cpu_usage: Math.floor(Math.random() * 100),
        response_time: Math.floor(Math.random() * 1000) + 100,
        throughput: Math.floor(Math.random() * 1000) + 100,
      },
      histograms: {
        processing_time: Array.from({ length: 100 }, () => ({
          value: Math.floor(Math.random() * 2000) + 100,
          timestamp: Date.now() - Math.floor(Math.random() * 3600000),
        })),
        response_time: Array.from({ length: 100 }, () => ({
          value: Math.floor(Math.random() * 1000) + 50,
          timestamp: Date.now() - Math.floor(Math.random() * 3600000),
        })),
      },
    };
  }

  determineSystemStatus(metrics) {
    const successRate = this.calculateSuccessRate(metrics);
    const errorRate = this.calculateErrorRate(metrics);
    const memoryUsage = metrics.gauges?.memory_usage || 0;

    if (successRate < 80 || errorRate > 20 || memoryUsage > 1000) {
      return 'critical';
    } else if (successRate < 90 || errorRate > 10 || memoryUsage > 500) {
      return 'warning';
    } else {
      return 'healthy';
    }
  }

  calculateUptime() {
    return Math.floor((Date.now() - process.uptime() * 1000) / 1000);
  }

  calculateAverageResponseTime(metrics) {
    const histograms = metrics.histograms || {};
    const responseTimes = histograms.response_time || [];

    if (!Array.isArray(responseTimes) || responseTimes.length === 0) return 0;

    const sum = responseTimes.reduce((acc, item) => acc + item.value, 0);
    return Math.round(sum / responseTimes.length);
  }

  calculateSuccessRate(metrics) {
    const total = metrics.counters?.total_artifacts_processed || 0;
    const successful = metrics.counters?.successful_artifacts || 0;
    return total > 0 ? Math.round((successful / total) * 100 * 100) / 100 : 0;
  }

  calculateErrorRate(metrics) {
    const total = metrics.counters?.total_artifacts_processed || 0;
    const failed = metrics.counters?.failed_artifacts || 0;
    return total > 0 ? Math.round((failed / total) * 100 * 100) / 100 : 0;
  }

  processHistograms(histograms) {
    const processed = {};

    for (const [name, values] of Object.entries(histograms)) {
      if (!Array.isArray(values) || values.length === 0) {
        processed[name] = { count: 0, min: 0, max: 0, avg: 0, p95: 0, p99: 0 };
        continue;
      }

      const sortedValues = values.map(v => v.value).sort((a, b) => a - b);
      const count = sortedValues.length;
      const min = sortedValues[0];
      const max = sortedValues[count - 1];
      const avg = sortedValues.reduce((sum, val) => sum + val, 0) / count;
      const p95Index = Math.floor(count * 0.95);
      const p99Index = Math.floor(count * 0.99);

      processed[name] = {
        count,
        min,
        max,
        avg: Math.round(avg * 100) / 100,
        p95: sortedValues[p95Index] || 0,
        p99: sortedValues[p99Index] || 0,
      };
    }

    return processed;
  }

  getActiveAlerts() {
    // Simular alertas activas
    return [
      {
        id: 'alert_1',
        severity: 'warning',
        message: 'Alto uso de memoria detectado',
        timestamp: Date.now() - 300000,
      },
    ];
  }

  async generateHTMLDashboard(data) {
    const template = this.templates.get('html');
    const html = this.renderHTMLTemplate(template, data);

    const filePath = path.join(this.config.outputDir, 'memtech-dashboard.html');
    await fs.writeFile(filePath, html, 'utf8');

    // Solo loggear cada 10 generaciones
    this.htmlCount = (this.htmlCount || 0) + 1;
    if (this.htmlCount % 10 === 0) {
      console.log(`📄 Dashboard HTML generado: ${filePath} (${this.htmlCount} generaciones)`);
    }
  }

  async generateJSONDashboard(data) {
    const json = JSON.stringify(data, null, 2);

    const filePath = path.join(this.config.outputDir, 'memtech-dashboard.json');
    await fs.writeFile(filePath, json, 'utf8');

    // Solo loggear cada 10 generaciones
    this.jsonCount = (this.jsonCount || 0) + 1;
    if (this.jsonCount % 10 === 0) {
      console.log(`📄 Dashboard JSON generado: ${filePath} (${this.jsonCount} generaciones)`);
    }
  }

  async generateGrafanaDashboard(data) {
    const template = this.templates.get('grafana');
    const grafanaConfig = this.renderGrafanaTemplate(template, data);

    const filePath = path.join(this.config.outputDir, 'memtech-grafana.json');
    await fs.writeFile(filePath, JSON.stringify(grafanaConfig, null, 2), 'utf8');

    // Solo loggear cada 10 generaciones
    this.grafanaCount = (this.grafanaCount || 0) + 1;
    if (this.grafanaCount % 10 === 0) {
      console.log(`📄 Dashboard Grafana generado: ${filePath} (${this.grafanaCount} generaciones)`);
    }
  }

  renderHTMLTemplate(template, data) {
    return template
      .replace(/\{\{timestamp\}\}/g, new Date(data.timestamp).toISOString())
      .replace(/\{\{system_status\}\}/g, data.system.status)
      .replace(/\{\{uptime\}\}/g, this.formatUptime(data.system.uptime))
      .replace(/\{\{throughput\}\}/g, data.performance.throughput)
      .replace(/\{\{avg_response_time\}\}/g, data.performance.avg_response_time)
      .replace(/\{\{success_rate\}\}/g, data.performance.success_rate)
      .replace(/\{\{error_rate\}\}/g, data.performance.error_rate)
      .replace(/\{\{memory_usage\}\}/g, data.resources.memory_usage)
      .replace(/\{\{active_connections\}\}/g, data.resources.active_connections)
      .replace(/\{\{queue_size\}\}/g, data.resources.queue_size)
      .replace(/\{\{alerts\}\}/g, this.renderAlertsHTML(data.alerts));
  }

  renderGrafanaTemplate(template, data) {
    // Implementación básica de plantilla Grafana
    return {
      dashboard: {
        title: 'MemTech Dashboard',
        panels: [
          {
            title: 'Throughput',
            type: 'stat',
            targets: [{ expr: data.performance.throughput }],
          },
          {
            title: 'Memory Usage',
            type: 'graph',
            targets: [{ expr: data.resources.memory_usage }],
          },
        ],
      },
    };
  }

  renderAlertsHTML(alerts) {
    if (!alerts || alerts.length === 0) {
      return '<div class="alert alert-success">No hay alertas activas</div>';
    }

    return alerts
      .map(
        alert => `
      <div class="alert alert-${alert.severity}">
        <strong>${alert.severity.toUpperCase()}:</strong> ${alert.message}
        <small class="text-muted">${new Date(alert.timestamp).toLocaleString()}</small>
      </div>
    `
      )
      .join('');
  }

  formatUptime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  }

  getHTMLTemplate() {
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MemTech Dashboard v2.1</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: #2c3e50; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric { display: flex; justify-content: space-between; margin: 10px 0; }
        .metric-value { font-weight: bold; font-size: 1.2em; }
        .status-healthy { color: #27ae60; }
        .status-warning { color: #f39c12; }
        .status-critical { color: #e74c3c; }
        .alert { padding: 10px; margin: 5px 0; border-radius: 4px; }
        .alert-success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .alert-warning { background: #fff3cd; color: #856404; border: 1px solid #ffeaa7; }
        .alert-critical { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .text-muted { color: #6c757d; font-size: 0.9em; }
        .refresh-info { text-align: center; margin-top: 20px; color: #6c757d; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 MemTech Dashboard v2.1</h1>
            <p>Última actualización: {{timestamp}}</p>
        </div>

        <div class="grid">
            <div class="card">
                <h3>📊 Estado del Sistema</h3>
                <div class="metric">
                    <span>Estado:</span>
                    <span class="metric-value status-{{system_status}}">{{system_status}}</span>
                </div>
                <div class="metric">
                    <span>Tiempo activo:</span>
                    <span class="metric-value">{{uptime}}</span>
                </div>
            </div>

            <div class="card">
                <h3>⚡ Performance</h3>
                <div class="metric">
                    <span>Throughput:</span>
                    <span class="metric-value">{{throughput}} artifacts/seg</span>
                </div>
                <div class="metric">
                    <span>Tiempo respuesta:</span>
                    <span class="metric-value">{{avg_response_time}}ms</span>
                </div>
                <div class="metric">
                    <span>Tasa de éxito:</span>
                    <span class="metric-value">{{success_rate}}%</span>
                </div>
                <div class="metric">
                    <span>Tasa de error:</span>
                    <span class="metric-value">{{error_rate}}%</span>
                </div>
            </div>

            <div class="card">
                <h3>💾 Recursos</h3>
                <div class="metric">
                    <span>Uso de memoria:</span>
                    <span class="metric-value">{{memory_usage}}MB</span>
                </div>
                <div class="metric">
                    <span>Conexiones activas:</span>
                    <span class="metric-value">{{active_connections}}</span>
                </div>
                <div class="metric">
                    <span>Tamaño de cola:</span>
                    <span class="metric-value">{{queue_size}}</span>
                </div>
            </div>

            <div class="card">
                <h3>🚨 Alertas</h3>
                {{alerts}}
            </div>
        </div>

        <div class="refresh-info">
            <p>Dashboard se actualiza automáticamente cada 5 segundos</p>
        </div>
    </div>

    <script>
        // Auto-refresh cada 5 segundos
        setInterval(() => {
            location.reload();
        }, 5000);
    </script>
</body>
</html>`;
  }

  getJSONTemplate() {
    return {
      version: '1.0',
      timestamp: '{{timestamp}}',
      system: {
        status: '{{system_status}}',
        uptime: '{{uptime}}',
      },
      performance: {
        throughput: '{{throughput}}',
        avg_response_time: '{{avg_response_time}}',
        success_rate: '{{success_rate}}',
        error_rate: '{{error_rate}}',
      },
      resources: {
        memory_usage: '{{memory_usage}}',
        active_connections: '{{active_connections}}',
        queue_size: '{{queue_size}}',
      },
      alerts: '{{alerts}}',
    };
  }

  getGrafanaTemplate() {
    return {
      dashboard: {
        title: 'MemTech Dashboard',
        panels: [],
      },
    };
  }

  async cleanup() {
    this.stopGeneration();
    this.templates.clear();
    console.log('🧹 Dashboard Generator limpiado');
  }
}

export default DashboardGenerator;
