#!/usr/bin/env node

/**
 * Forensic Observability Service
 * Simple metrics and monitoring for forensic analysis
 * Focused on practical observability without over-engineering
 */

const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

class ForensicObservability extends EventEmitter {
  constructor(options = {}) {
    super();
    this.metricsPath =
      options.metricsPath || path.join(process.cwd(), 'obs', 'metrics');
    this.sessionId = options.sessionId || `obs-${Date.now()}`;
    this.metrics = new Map();
    this.counters = new Map();
    this.histograms = new Map();
    this.startTime = Date.now();

    // Ensure metrics directory exists
    this.ensureDirectoryExists();
  }

  /**
   * Registra una métrica simple (counter)
   * @param {string} name - Nombre de la métrica
   * @param {number} value - Valor a agregar (default: 1)
   * @param {Object} labels - Labels adicionales
   */
  incrementCounter(name, value = 1, labels = {}) {
    const key = this.createKey(name, labels);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);

    this.emit('metric', {
      type: 'counter',
      name,
      value: current + value,
      labels,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Registra un valor (gauge)
   * @param {string} name - Nombre de la métrica
   * @param {number} value - Valor a registrar
   * @param {Object} labels - Labels adicionales
   */
  setGauge(name, value, labels = {}) {
    const key = this.createKey(name, labels);
    this.metrics.set(key, value);

    this.emit('metric', {
      type: 'gauge',
      name,
      value,
      labels,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Registra un histograma (distribución de valores)
   * @param {string} name - Nombre del histograma
   * @param {number} value - Valor a registrar
   * @param {Object} labels - Labels adicionales
   */
  recordHistogram(name, value, labels = {}) {
    const key = this.createKey(name, labels);
    const histogram = this.histograms.get(key) || {
      count: 0,
      sum: 0,
      min: Infinity,
      max: -Infinity,
      values: []
    };

    histogram.count++;
    histogram.sum += value;
    histogram.min = Math.min(histogram.min, value);
    histogram.max = Math.max(histogram.max, value);
    histogram.values.push(value);

    // Mantener solo los últimos 1000 valores para memoria limitada
    if (histogram.values.length > 1000) {
      histogram.values = histogram.values.slice(-1000);
    }

    this.histograms.set(key, histogram);

    this.emit('metric', {
      type: 'histogram',
      name,
      value,
      labels,
      timestamp: new Date().toISOString(),
      histogram
    });
  }

  /**
   * Registra tiempo de ejecución de una función
   * @param {string} name - Nombre de la operación
   * @param {Function} fn - Función a medir
   * @param {Object} labels - Labels adicionales
   * @returns {*} - Resultado de la función
   */
  async timeExecution(name, fn, labels = {}) {
    const startTime = process.hrtime.bigint();
    let result;
    let error = null;

    try {
      result = await fn();
      this.incrementCounter(`${name}_success`, 1, labels);
    } catch (e) {
      error = e;
      this.incrementCounter(`${name}_error`, 1, labels);
      throw e;
    } finally {
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1000000; // Convertir a milisegundos

      this.recordHistogram(`${name}_duration_ms`, durationMs, labels);
      this.setGauge(`${name}_last_duration_ms`, durationMs, labels);

      this.emit('execution', {
        name,
        durationMs,
        success: !error,
        labels,
        timestamp: new Date().toISOString()
      });
    }

    return result;
  }

  /**
   * Registra métricas del sistema
   */
  recordSystemMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    // Memory metrics
    this.setGauge('memory_heap_used_mb', memUsage.heapUsed / 1024 / 1024);
    this.setGauge('memory_heap_total_mb', memUsage.heapTotal / 1024 / 1024);
    this.setGauge('memory_external_mb', memUsage.external / 1024 / 1024);
    this.setGauge('memory_rss_mb', memUsage.rss / 1024 / 1024);

    // CPU metrics (simplificado)
    this.setGauge('cpu_user_us', cpuUsage.user);
    this.setGauge('cpu_system_us', cpuUsage.system);

    // Uptime
    this.setGauge('process_uptime_seconds', process.uptime());

    // Event loop lag (simplificado)
    const start = Date.now();
    setImmediate(() => {
      this.setGauge('event_loop_lag_ms', Date.now() - start);
    });
  }

  /**
   * Registra métricas de análisis forense
   * @param {Object} analysisMetrics - Métricas del análisis
   */
  recordForensicMetrics(analysisMetrics) {
    if (analysisMetrics.filesAnalyzed) {
      this.setGauge('forensic_files_analyzed', analysisMetrics.filesAnalyzed);
    }

    if (analysisMetrics.issuesFound) {
      this.setGauge('forensic_issues_found', analysisMetrics.issuesFound);
      this.incrementCounter(
        'forensic_total_issues',
        analysisMetrics.issuesFound
      );
    }

    if (analysisMetrics.analysisDuration) {
      this.recordHistogram(
        'forensic_analysis_duration_ms',
        analysisMetrics.analysisDuration
      );
    }

    if (analysisMetrics.phase) {
      this.incrementCounter('forensic_phase_executions', 1, {
        phase: analysisMetrics.phase
      });
      this.setGauge(
        'forensic_current_phase',
        this.getPhaseNumber(analysisMetrics.phase)
      );
    }

    if (analysisMetrics.dependencies) {
      this.setGauge(
        'forensic_dependencies_count',
        analysisMetrics.dependencies
      );
    }
  }

  /**
   * Registra métricas de circuit breaker
   * @param {Object} cbMetrics - Métricas del circuit breaker
   */
  recordCircuitBreakerMetrics(cbMetrics) {
    for (const [name, state] of Object.entries(cbMetrics)) {
      this.setGauge('circuit_breaker_state', this.getStateNumber(state.state), {
        name
      });
      this.setGauge('circuit_breaker_failure_rate', state.failureRate, {
        name
      });
      this.setGauge('circuit_breaker_request_count', state.requestCount, {
        name
      });
      this.setGauge('circuit_breaker_failure_count', state.failureCount, {
        name
      });
    }
  }

  /**
   * Exporta métricas en formato simple
   * @returns {string} - Métricas formateadas
   */
  exportMetrics() {
    let output = '# Forensic Analysis Metrics\n';
    output += `# Generated: ${new Date().toISOString()}\n`;
    output += `# Session: ${this.sessionId}\n\n`;

    // Counters
    output += '# COUNTERS\n';
    for (const [key, value] of this.counters.entries()) {
      output += `${key} ${value}\n`;
    }

    // Gauges
    output += '\n# GAUGES\n';
    for (const [key, value] of this.metrics.entries()) {
      output += `${key} ${value}\n`;
    }

    // Histograms
    output += '\n# HISTOGRAMS\n';
    for (const [key, histogram] of this.histograms.entries()) {
      output += `${key}_count ${histogram.count}\n`;
      output += `${key}_sum ${histogram.sum}\n`;
      output += `${key}_min ${histogram.min}\n`;
      output += `${key}_max ${histogram.max}\n`;
      output += `${key}_avg ${histogram.count > 0 ? histogram.sum / histogram.count : 0}\n`;
    }

    return output;
  }

  /**
   * Exporta métricas en formato JSON
   * @returns {Object} - Métricas en formato JSON
   */
  exportMetricsJson() {
    const histogramsJson = {};
    for (const [key, histogram] of this.histograms.entries()) {
      histogramsJson[key] = {
        count: histogram.count,
        sum: histogram.sum,
        min: histogram.min,
        max: histogram.max,
        avg: histogram.count > 0 ? histogram.sum / histogram.count : 0
      };
    }

    return {
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      uptime: Date.now() - this.startTime,
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.metrics),
      histograms: histogramsJson
    };
  }

  /**
   * Persiste métricas en archivo
   */
  persistMetrics() {
    try {
      const metricsFile = path.join(
        this.metricsPath,
        `${this.sessionId}.metrics`
      );
      const metricsData = this.exportMetricsJson();
      fs.writeFileSync(
        metricsFile,
        JSON.stringify(metricsData, null, 2),
        'utf8'
      );

      // También mantener formato de texto para fácil lectura
      const textMetricsFile = path.join(
        this.metricsPath,
        `${this.sessionId}.txt`
      );
      fs.writeFileSync(textMetricsFile, this.exportMetrics(), 'utf8');

      return metricsFile;
    } catch (error) {
      console.error(`❌ Failed to persist metrics: ${error.message}`);
    }
  }

  /**
   * Genera dashboard simple en HTML
   * @returns {string} - Ruta del dashboard generado
   */
  generateDashboard() {
    const dashboardPath = path.join(
      this.metricsPath,
      `dashboard-${this.sessionId}.html`
    );
    const metricsData = this.exportMetricsJson();

    const html = this.createDashboardHtml(metricsData);

    try {
      fs.writeFileSync(dashboardPath, html, 'utf8');
      return dashboardPath;
    } catch (error) {
      console.error(`❌ Failed to generate dashboard: ${error.message}`);
    }
  }

  /**
   * Crea HTML para el dashboard
   * @param {Object} metrics - Métricas a mostrar
   * @returns {string} - HTML del dashboard
   */
  createDashboardHtml(metrics) {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Forensic Analysis Dashboard</title>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .dashboard { max-width: 1200px; margin: 0 auto; }
        .header { background: #2c3e50; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .metric-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric-title { font-size: 14px; color: #666; margin-bottom: 5px; }
        .metric-value { font-size: 24px; font-weight: bold; color: #2c3e50; }
        .metric-unit { font-size: 14px; color: #7f8c8d; }
        .status-good { color: #27ae60; }
        .status-warning { color: #f39c12; }
        .status-critical { color: #e74c3c; }
        .timestamp { color: #7f8c8d; font-size: 12px; }
    </style>
</head>
<body>
    <div class="dashboard">
        <div class="header">
            <h1>🔍 Forensic Analysis Dashboard</h1>
            <p>Session: ${metrics.sessionId}</p>
            <p>Generated: ${metrics.timestamp}</p>
            <p>Uptime: ${Math.round(metrics.uptime / 1000)}s</p>
        </div>

        <div class="metrics-grid">
            <!-- System Metrics -->
            <div class="metric-card">
                <div class="metric-title">Memory Usage</div>
                <div class="metric-value">${Math.round(metrics.gauges.memory_heap_used_mb || 0)}</div>
                <div class="metric-unit">MB heap used</div>
            </div>

            <div class="metric-card">
                <div class="metric-title">Process Uptime</div>
                <div class="metric-value">${Math.round(metrics.gauges.process_uptime_seconds || 0)}</div>
                <div class="metric-unit">seconds</div>
            </div>

            <!-- Forensic Metrics -->
            <div class="metric-card">
                <div class="metric-title">Files Analyzed</div>
                <div class="metric-value ${this.getValueClass(metrics.gauges.forensic_files_analyzed, 0, 1000)}">
                    ${metrics.gauges.forensic_files_analyzed || 0}
                </div>
                <div class="metric-unit">files</div>
            </div>

            <div class="metric-card">
                <div class="metric-title">Issues Found</div>
                <div class="metric-value ${this.getValueClass(metrics.gauges.forensic_issues_found, 0, 10)}">
                    ${metrics.gauges.forensic_issues_found || 0}
                </div>
                <div class="metric-unit">issues</div>
            </div>

            <div class="metric-card">
                <div class="metric-title">Dependencies Count</div>
                <div class="metric-value ${this.getValueClass(metrics.gauges.forensic_dependencies_count, 0, 50)}">
                    ${metrics.gauges.forensic_dependencies_count || 0}
                </div>
                <div class="metric-unit">dependencies</div>
            </div>

            <div class="metric-card">
                <div class="metric-title">Analysis Duration</div>
                <div class="metric-value">
                    ${this.formatDuration(metrics.histograms.forensic_analysis_duration_ms?.avg || 0)}
                </div>
                <div class="metric-unit">average</div>
            </div>

            <!-- Execution Metrics -->
            <div class="metric-card">
                <div class="metric-title">Phase Executions</div>
                <div class="metric-value">${metrics.counters.forensic_phase_executions || 0}</div>
                <div class="metric-unit">total</div>
            </div>

            <div class="metric-card">
                <div class="metric-title">Event Loop Lag</div>
                <div class="metric-value ${this.getValueClass(metrics.gauges.event_loop_lag_ms, 0, 10, true)}">
                    ${Math.round(metrics.gauges.event_loop_lag_ms || 0)}
                </div>
                <div class="metric-unit">ms</div>
            </div>
        </div>

        <div style="margin-top: 20px; text-align: center; color: #7f8c8d;">
            <p class="timestamp">Auto-refresh every 30 seconds</p>
        </div>
    </div>

    <script>
        // Auto-refresh every 30 seconds
        setTimeout(() => location.reload(), 30000);
    </script>
</body>
</html>`;
  }

  /**
   * Obtiene clase CSS para valor según umbral
   * @param {number} value - Valor
   * @param {number} warning - Umbral de warning
   * @param {number} critical - Umbral de critical
   * @param {boolean} reverse - Invertir lógica (para valores donde menor es mejor)
   * @returns {string} - Clase CSS
   */
  getValueClass(value, warning, critical, reverse = false) {
    if (reverse) {
      return value >= critical
        ? 'status-critical'
        : value >= warning
          ? 'status-warning'
          : 'status-good';
    } else {
      return value >= critical
        ? 'status-critical'
        : value >= warning
          ? 'status-warning'
          : 'status-good';
    }
  }

  /**
   * Formatea duración en texto legible
   * @param {number} ms - Milisegundos
   * @returns {string} - Duración formateada
   */
  formatDuration(ms) {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    return `${Math.round(ms / 60000)}m`;
  }

  /**
   * Convierte nombre de fase a número
   * @param {string} phase - Nombre de la fase
   * @returns {number} - Número de fase
   */
  getPhaseNumber(phase) {
    const phases = {
      PRE_VALIDATION: 1,
      STRUCTURE_ANALYSIS: 2,
      DEPENDENCY_ANALYSIS: 3,
      QUALITY_ANALYSIS: 4,
      REPORT_GENERATION: 5
    };
    return phases[phase] || 0;
  }

  /**
   * Convierte estado de circuit breaker a número
   * @param {string} state - Estado del circuit breaker
   * @returns {number} - Representación numérica
   */
  getStateNumber(state) {
    const states = {
      CLOSED: 0,
      OPEN: 1,
      HALF_OPEN: 2
    };
    return states[state] || -1;
  }

  /**
   * Crea key para métricas con labels
   * @param {string} name - Nombre de la métrica
   * @param {Object} labels - Labels
   * @returns {string} - Key única
   */
  createKey(name, labels) {
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    return labelStr ? `${name}{${labelStr}}` : name;
  }

  /**
   * Asegura que el directorio de métricas exista
   */
  ensureDirectoryExists() {
    if (!fs.existsSync(this.metricsPath)) {
      fs.mkdirSync(this.metricsPath, { recursive: true });
    }
  }

  /**
   * Imprime resumen de métricas actuales
   */
  printMetricsSummary() {
    console.log('\n📊 Forensic Observability Summary');
    console.log('==================================');

    console.log(`\n🆔 Session: ${this.sessionId}`);
    console.log(
      `⏱️  Uptime: ${Math.round((Date.now() - this.startTime) / 1000)}s`
    );

    // Top counters
    console.log('\n📈 Top Counters:');
    const topCounters = Array.from(this.counters.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    topCounters.forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });

    // Important gauges
    console.log('\n📊 Current Gauges:');
    const importantGauges = [
      'memory_heap_used_mb',
      'forensic_files_analyzed',
      'forensic_issues_found',
      'process_uptime_seconds'
    ];

    importantGauges.forEach(key => {
      const value = this.metrics.get(key);
      if (value !== undefined) {
        console.log(`  ${key}: ${value}`);
      }
    });

    // Important histograms
    console.log('\n📉 Key Histograms:');
    const importantHistograms = ['forensic_analysis_duration_ms'];

    importantHistograms.forEach(key => {
      const histogram = this.histograms.get(key);
      if (histogram && histogram.count > 0) {
        console.log(`  ${key}:`);
        console.log(`    Count: ${histogram.count}`);
        console.log(
          `    Avg: ${Math.round(histogram.sum / histogram.count)}ms`
        );
        console.log(`    Min: ${Math.round(histogram.min)}ms`);
        console.log(`    Max: ${Math.round(histogram.max)}ms`);
      }
    });
  }
}

module.exports = ForensicObservability;

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  const observability = new ForensicObservability();

  switch (command) {
    case 'record-system':
      observability.recordSystemMetrics();
      console.log('✅ System metrics recorded');
      break;

    case 'export':
      console.log(observability.exportMetrics());
      break;

    case 'export-json':
      console.log(JSON.stringify(observability.exportMetricsJson(), null, 2));
      break;

    case 'persist': {
      observability.recordSystemMetrics();
      const metricsFile = observability.persistMetrics();
      console.log(`✅ Metrics persisted: ${metricsFile}`);
      break;
    }

    case 'dashboard': {
      observability.recordSystemMetrics();
      const dashboardPath = observability.generateDashboard();
      console.log(`📊 Dashboard generated: ${dashboardPath}`);
      break;
    }

    case 'summary':
      observability.printMetricsSummary();
      break;

    default:
      console.log(
        'Usage: node forensic-observability.js [record-system|export|export-json|persist|dashboard|summary]'
      );
  }
}
