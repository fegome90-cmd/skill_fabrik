/**
 * MemTech VictoriaMetrics Module
 *
 * Módulo para consultas a VictoriaMetrics (PromQL)
 */

import https from 'https';
import http from 'http';
import { URL } from 'url';
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

class VictoriaMetricsManager {
  constructor(config = {}) {
    this.config = {
      vm_url: config.vm_url || process.env.VICTORIA_METRICS_URL || 'http://localhost:8428',
      timeout_ms: config.timeout_ms || 30000,
      max_retries: config.max_retries || 3,
      retry_delay_ms: config.retry_delay_ms || 1000,
      auth_token: config.auth_token || process.env.VICTORIA_METRICS_TOKEN,
      verify_ssl: config.verify_ssl !== false,
      ...config,
    };

    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Verificar conectividad con VictoriaMetrics
      await this.testConnection();

      this.initialized = true;
      logger.info('VictoriaMetrics Manager initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize VictoriaMetrics Manager:', error);
      throw error;
    }
  }

  async testConnection() {
    try {
      const healthUrl = `${this.config.vm_url}/health`;
      const response = await this.makeRequest('GET', healthUrl);

      if (response.statusCode !== 200) {
        throw new Error(`VictoriaMetrics health check failed with status: ${response.statusCode}`);
      }

      logger.info('VictoriaMetrics connection test successful');
    } catch (error) {
      logger.error('VictoriaMetrics connection test failed:', error);
      throw new Error(`VictoriaMetrics connection failed: ${error.message}`);
    }
  }

  async query(promqlQuery, time = null) {
    await this.initialize();

    try {
      logger.info(`Executing PromQL query: ${promqlQuery}`);

      // Construir URL de consulta
      const queryUrl = new URL(`${this.config.vm_url}/api/v1/query`);
      queryUrl.searchParams.append('query', promqlQuery);

      if (time) {
        queryUrl.searchParams.append('time', time.toString());
      }

      // Ejecutar consulta
      const response = await this.makeRequest('GET', queryUrl.toString());

      if (response.statusCode !== 200) {
        throw new Error(`Query failed with status: ${response.statusCode}`);
      }

      const data = JSON.parse(response.body);

      // Validar respuesta de VictoriaMetrics
      if (data.status !== 'success') {
        throw new Error(`Query failed with status: ${data.status}`);
      }

      if (data.error) {
        throw new Error(`Query error: ${data.error}`);
      }

      logger.info(`Query executed successfully, returned ${data.data.result.length} results`);

      return {
        success: true,
        query: promqlQuery,
        time: time || 'now',
        status: data.status,
        data: data.data,
        result_type: data.data.resultType,
        result_count: data.data.result.length,
        executed_at: new Date().toISOString(),
      };
    } catch (error) {
      logger.error(`Error executing PromQL query "${promqlQuery}":`, error);
      throw new Error(`Failed to execute query: ${error.message}`);
    }
  }

  async queryRange(promqlQuery, start, end, step = '1m') {
    await this.initialize();

    try {
      logger.info(`Executing PromQL range query: ${promqlQuery}`);

      // Construir URL de consulta
      const queryUrl = new URL(`${this.config.vm_url}/api/v1/query_range`);
      queryUrl.searchParams.append('query', promqlQuery);
      queryUrl.searchParams.append('start', start.toString());
      queryUrl.searchParams.append('end', end.toString());
      queryUrl.searchParams.append('step', step);

      // Ejecutar consulta
      const response = await this.makeRequest('GET', queryUrl.toString());

      if (response.statusCode !== 200) {
        throw new Error(`Range query failed with status: ${response.statusCode}`);
      }

      const data = JSON.parse(response.body);

      // Validar respuesta de VictoriaMetrics
      if (data.status !== 'success') {
        throw new Error(`Range query failed with status: ${data.status}`);
      }

      if (data.error) {
        throw new Error(`Range query error: ${data.error}`);
      }

      const totalDataPoints = data.data.result.reduce(
        (total, series) => total + series.values.length,
        0
      );

      logger.info(`Range query executed successfully, returned ${totalDataPoints} data points`);

      return {
        success: true,
        query: promqlQuery,
        start,
        end,
        step,
        status: data.status,
        data: data.data,
        result_type: data.data.resultType,
        series_count: data.data.result.length,
        total_data_points: totalDataPoints,
        executed_at: new Date().toISOString(),
      };
    } catch (error) {
      logger.error(`Error executing PromQL range query "${promqlQuery}":`, error);
      throw new Error(`Failed to execute range query: ${error.message}`);
    }
  }

  async getSeries(match = '{__name__=~".+"}', start = null, end = null) {
    await this.initialize();

    try {
      logger.info(`Getting series matching: ${match}`);

      // Construir URL
      const seriesUrl = new URL(`${this.config.vm_url}/api/v1/series`);
      seriesUrl.searchParams.append('match[]', match);

      if (start) {
        seriesUrl.searchParams.append('start', start.toString());
      }

      if (end) {
        seriesUrl.searchParams.append('end', end.toString());
      }

      // Ejecutar consulta
      const response = await this.makeRequest('GET', seriesUrl.toString());

      if (response.statusCode !== 200) {
        throw new Error(`Series query failed with status: ${response.statusCode}`);
      }

      const data = JSON.parse(response.body);

      // Validar respuesta
      if (data.status !== 'success') {
        throw new Error(`Series query failed with status: ${data.status}`);
      }

      if (data.error) {
        throw new Error(`Series query error: ${data.error}`);
      }

      logger.info(`Found ${data.data.length} series`);

      return {
        success: true,
        match,
        start,
        end,
        status: data.status,
        data: data.data,
        series_count: data.data.length,
        retrieved_at: new Date().toISOString(),
      };
    } catch (error) {
      logger.error(`Error getting series matching "${match}":`, error);
      throw new Error(`Failed to get series: ${error.message}`);
    }
  }

  async getLabels(match = '__name__') {
    await this.initialize();

    try {
      logger.info(`Getting labels matching: ${match}`);

      // Construir URL
      const labelsUrl = new URL(`${this.config.vm_url}/api/v1/labels`);
      labelsUrl.searchParams.append('match[]', match);

      // Ejecutar consulta
      const response = await this.makeRequest('GET', labelsUrl.toString());

      if (response.statusCode !== 200) {
        throw new Error(`Labels query failed with status: ${response.statusCode}`);
      }

      const data = JSON.parse(response.body);

      // Validar respuesta
      if (data.status !== 'success') {
        throw new Error(`Labels query failed with status: ${data.status}`);
      }

      if (data.error) {
        throw new Error(`Labels query error: ${data.error}`);
      }

      logger.info(`Found ${data.data.length} labels`);

      return {
        success: true,
        match,
        status: data.status,
        data: data.data,
        labels_count: data.data.length,
        retrieved_at: new Date().toISOString(),
      };
    } catch (error) {
      logger.error(`Error getting labels matching "${match}":`, error);
      throw new Error(`Failed to get labels: ${error.message}`);
    }
  }

  async getLabelValues(label, match = '') {
    await this.initialize();

    try {
      logger.info(`Getting values for label: ${label}`);

      // Construir URL
      const valuesUrl = new URL(`${this.config.vm_url}/api/v1/label/${label}/values`);

      if (match) {
        valuesUrl.searchParams.append('match[]', match);
      }

      // Ejecutar consulta
      const response = await this.makeRequest('GET', valuesUrl.toString());

      if (response.statusCode !== 200) {
        throw new Error(`Label values query failed with status: ${response.statusCode}`);
      }

      const data = JSON.parse(response.body);

      // Validar respuesta
      if (data.status !== 'success') {
        throw new Error(`Label values query failed with status: ${data.status}`);
      }

      if (data.error) {
        throw new Error(`Label values query error: ${data.error}`);
      }

      logger.info(`Found ${data.data.length} values for label ${label}`);

      return {
        success: true,
        label,
        match,
        status: data.status,
        data: data.data,
        values_count: data.data.length,
        retrieved_at: new Date().toISOString(),
      };
    } catch (error) {
      logger.error(`Error getting values for label "${label}":`, error);
      throw new Error(`Failed to get label values: ${error.message}`);
    }
  }

  async makeRequest(method, url, data = null) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === 'https:';
      const httpModule = isHttps ? https : http;

      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'memtech-mcp/1.0.0',
        },
        timeout: this.config.timeout_ms,
      };

      // Agregar autenticación si se proporciona token
      if (this.config.auth_token) {
        options.headers['Authorization'] = `Bearer ${this.config.auth_token}`;
      }

      // Agregar longitud del contenido si hay datos
      if (data) {
        options.headers['Content-Length'] = Buffer.byteLength(data);
      }

      // Deshabilitar verificación SSL si está configurado
      if (isHttps && !this.config.verify_ssl) {
        options.rejectUnauthorized = false;
      }

      const req = httpModule.request(options, res => {
        let body = '';

        res.on('data', chunk => {
          body += chunk;
        });

        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body,
          });
        });
      });

      req.on('error', error => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (data) {
        req.write(data);
      }

      req.end();
    });
  }

  async getMetricsOverview() {
    await this.initialize();

    try {
      logger.info('Getting metrics overview');

      // Consultas básicas para obtener una visión general
      const queries = [
        {
          name: 'total_series',
          query: 'count(victoria_metrics_storage_series_total)',
        },
        {
          name: 'total_samples',
          query: 'sum(victoria_metrics_storage_samples_total)',
        },
        {
          name: 'data_size_bytes',
          query: 'sum(victoria_metrics_data_size_bytes)',
        },
        {
          name: 'memory_usage_bytes',
          query: 'process_resident_memory_bytes',
        },
        {
          name: 'cpu_usage',
          query: 'rate(process_cpu_seconds_total[5m])',
        },
      ];

      const results = {};

      for (const queryInfo of queries) {
        try {
          const result = await this.query(queryInfo.query);

          if (result.data.result.length > 0) {
            const value = result.data.result[0].value[1];
            results[queryInfo.name] = parseFloat(value);
          } else {
            results[queryInfo.name] = 0;
          }
        } catch (error) {
          logger.warn(`Failed to get ${queryInfo.name}:`, error.message);
          results[queryInfo.name] = null;
        }
      }

      return {
        success: true,
        metrics: results,
        vm_url: this.config.vm_url,
        retrieved_at: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error getting metrics overview:', error);
      throw new Error(`Failed to get metrics overview: ${error.message}`);
    }
  }

  async checkHealth() {
    try {
      const healthUrl = `${this.config.vm_url}/health`;
      const response = await this.makeRequest('GET', healthUrl);

      const isHealthy = response.statusCode === 200;

      return {
        healthy: isHealthy,
        status_code: response.statusCode,
        url: this.config.vm_url,
        checked_at: new Date().toISOString(),
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        url: this.config.vm_url,
        checked_at: new Date().toISOString(),
      };
    }
  }

  async getServerInfo() {
    await this.initialize();

    try {
      const infoUrl = `${this.config.vm_url}/api/v1/status/buildinfo`;
      const response = await this.makeRequest('GET', infoUrl);

      if (response.statusCode !== 200) {
        throw new Error(`Failed to get build info: ${response.statusCode}`);
      }

      const data = JSON.parse(response.body);

      return {
        success: true,
        status: data.status,
        data: data.data,
        retrieved_at: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error getting server info:', error);
      throw new Error(`Failed to get server info: ${error.message}`);
    }
  }
}

export default VictoriaMetricsManager;
