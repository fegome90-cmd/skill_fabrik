/**
 * MemTech Grafana Module
 *
 * Módulo para integración con Grafana API
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

class GrafanaManager {
  constructor(config = {}) {
    this.config = {
      grafana_url: config.grafana_url || process.env.GRAFANA_URL || 'http://localhost:3000',
      api_key: config.api_key || process.env.GRAFANA_API_KEY,
      username: config.username || process.env.GRAFANA_USERNAME || 'admin',
      password: config.password || process.env.GRAFANA_PASSWORD || 'admin',
      timeout_ms: config.timeout_ms || 30000,
      verify_ssl: config.verify_ssl !== false,
      ...config,
    };

    this.initialized = false;
    this.authHeader = null;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Configurar autenticación
      if (this.config.api_key) {
        this.authHeader = `Bearer ${this.config.api_key}`;
      } else {
        // Si no hay API key, intentar login básico
        await this.basicAuthLogin();
      }

      // Verificar conectividad
      await this.testConnection();

      this.initialized = true;
      logger.info('Grafana Manager initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Grafana Manager:', error);
      throw error;
    }
  }

  async basicAuthLogin() {
    try {
      const loginUrl = `${this.config.grafana_url}/api/login`;
      const loginData = JSON.stringify({
        user: this.config.username,
        password: this.config.password,
      });

      const response = await this.makeRequest('POST', loginUrl, loginData);

      if (response.statusCode !== 200) {
        throw new Error(`Login failed with status: ${response.statusCode}`);
      }

      const data = JSON.parse(response.body);

      if (data.message === 'Logged in') {
        // Usar cookie de sesión para autenticación
        const setCookieHeader = response.headers['set-cookie'];
        if (setCookieHeader) {
          this.authHeader = setCookieHeader[0].split(';')[0];
        }
      } else {
        throw new Error('Login response invalid');
      }

      logger.info('Basic authentication successful');
    } catch (error) {
      logger.error('Basic authentication failed:', error);
      throw new Error(`Grafana authentication failed: ${error.message}`);
    }
  }

  async testConnection() {
    try {
      const healthUrl = `${this.config.grafana_url}/api/health`;
      const response = await this.makeRequest('GET', healthUrl);

      if (response.statusCode !== 200) {
        throw new Error(`Grafana health check failed with status: ${response.statusCode}`);
      }

      logger.info('Grafana connection test successful');
    } catch (error) {
      logger.error('Grafana connection test failed:', error);
      throw new Error(`Grafana connection failed: ${error.message}`);
    }
  }

  async listDashboards(folderId = null, query = '') {
    await this.initialize();

    try {
      logger.info(`Listing dashboards with query: ${query}`);

      // Construir URL
      let searchUrl = `${this.config.grafana_url}/api/search?type=dash-db`;

      if (folderId) {
        searchUrl += `&folderIds=${folderId}`;
      }

      if (query) {
        searchUrl += `&query=${encodeURIComponent(query)}`;
      }

      // Ejecutar consulta
      const response = await this.makeRequest('GET', searchUrl);

      if (response.statusCode !== 200) {
        throw new Error(`List dashboards failed with status: ${response.statusCode}`);
      }

      const data = JSON.parse(response.body);

      logger.info(`Found ${data.length} dashboards`);

      return {
        success: true,
        dashboards: data,
        count: data.length,
        folder_id: folderId,
        query,
        retrieved_at: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error listing dashboards:', error);
      throw new Error(`Failed to list dashboards: ${error.message}`);
    }
  }

  async getDashboard(uidOrTitle) {
    await this.initialize();

    try {
      logger.info(`Getting dashboard: ${uidOrTitle}`);

      // Primero intentar buscar por UID
      let dashboardUrl = `${this.config.grafana_url}/api/dashboards/uid/${uidOrTitle}`;

      try {
        const response = await this.makeRequest('GET', dashboardUrl);

        if (response.statusCode === 200) {
          const data = JSON.parse(response.body);
          logger.info(`Dashboard found by UID: ${uidOrTitle}`);

          return {
            success: true,
            dashboard: data,
            found_by: 'uid',
            retrieved_at: new Date().toISOString(),
          };
        }
      } catch (error) {
        logger.info(`Dashboard not found by UID, trying search by title`);
      }

      // Si no se encuentra por UID, buscar por título
      const searchResults = await this.listDashboards(null, uidOrTitle);

      if (searchResults.dashboards.length > 0) {
        const dashboard = searchResults.dashboards[0];
        const uid = dashboard.uid;

        // Obtener dashboard completo por UID
        dashboardUrl = `${this.config.grafana_url}/api/dashboards/uid/${uid}`;
        const response = await this.makeRequest('GET', dashboardUrl);

        if (response.statusCode === 200) {
          const data = JSON.parse(response.body);
          logger.info(`Dashboard found by title: ${uidOrTitle}`);

          return {
            success: true,
            dashboard: data,
            found_by: 'title',
            retrieved_at: new Date().toISOString(),
          };
        }
      }

      throw new Error(`Dashboard not found: ${uidOrTitle}`);
    } catch (error) {
      logger.error(`Error getting dashboard ${uidOrTitle}:`, error);
      throw new Error(`Failed to get dashboard: ${error.message}`);
    }
  }

  async smoke(uidOrTitle) {
    await this.initialize();

    try {
      logger.info(`Running smoke test for dashboard: ${uidOrTitle}`);

      // Obtener dashboard
      const dashboardResult = await this.getDashboard(uidOrTitle);

      if (!dashboardResult.success) {
        throw new Error(`Could not retrieve dashboard: ${uidOrTitle}`);
      }

      const dashboard = dashboardResult.dashboard;
      const panels = dashboard.dashboard.panels || [];

      // Realizar pruebas de smoke
      const smokeResults = {
        dashboard_uid: dashboard.dashboard.uid,
        dashboard_title: dashboard.dashboard.title,
        total_panels: panels.length,
        tests: {
          basic_structure: this.testBasicStructure(dashboard),
          panels_health: this.testPanelsHealth(panels),
          data_sources: await this.testDataSources(dashboard),
          variables: await this.testVariables(dashboard),
          alerts: this.testAlerts(panels),
        },
        overall_status: 'unknown',
        executed_at: new Date().toISOString(),
      };

      // Calcular estado general
      const testResults = Object.values(smokeResults.tests);
      const failedTests = testResults.filter(test => test.status === 'failed').length;

      if (failedTests === 0) {
        smokeResults.overall_status = 'passed';
      } else {
        smokeResults.overall_status = 'failed';
      }

      logger.info(
        `Smoke test completed for dashboard ${uidOrTitle}: ${smokeResults.overall_status}`
      );

      return smokeResults;
    } catch (error) {
      logger.error(`Error running smoke test for dashboard ${uidOrTitle}:`, error);

      return {
        dashboard_uid: uidOrTitle,
        error: error.message,
        overall_status: 'error',
        executed_at: new Date().toISOString(),
      };
    }
  }

  testBasicStructure(dashboard) {
    const result = {
      status: 'passed',
      details: {},
      issues: [],
    };

    try {
      // Verificar estructura básica del dashboard
      if (!dashboard.dashboard) {
        result.status = 'failed';
        result.issues.push('Dashboard object missing');
        return result;
      }

      if (!dashboard.dashboard.title) {
        result.status = 'failed';
        result.issues.push('Dashboard title missing');
      }

      if (!dashboard.dashboard.uid) {
        result.status = 'failed';
        result.issues.push('Dashboard UID missing');
      }

      if (!dashboard.dashboard.panels || !Array.isArray(dashboard.dashboard.panels)) {
        result.status = 'failed';
        result.issues.push('Dashboard panels missing or invalid');
      }

      result.details = {
        has_title: !!dashboard.dashboard.title,
        has_uid: !!dashboard.dashboard.uid,
        has_panels: !!(dashboard.dashboard.panels && Array.isArray(dashboard.dashboard.panels)),
        panel_count: dashboard.dashboard.panels ? dashboard.dashboard.panels.length : 0,
      };
    } catch (error) {
      result.status = 'failed';
      result.issues.push(`Structure test error: ${error.message}`);
    }

    return result;
  }

  testPanelsHealth(panels) {
    const result = {
      status: 'passed',
      details: {
        total_panels: panels.length,
        healthy_panels: 0,
        issue_panels: 0,
      },
      issues: [],
    };

    try {
      for (const panel of panels) {
        const panelIssues = [];

        if (!panel.title) {
          panelIssues.push('Panel title missing');
        }

        if (!panel.type) {
          panelIssues.push('Panel type missing');
        }

        if (!panel.targets || !Array.isArray(panel.targets) || panel.targets.length === 0) {
          panelIssues.push('Panel targets missing or empty');
        }

        if (panelIssues.length > 0) {
          result.details.issue_panels++;
          result.issues.push(`Panel "${panel.title || 'Untitled'}": ${panelIssues.join(', ')}`);
        } else {
          result.details.healthy_panels++;
        }
      }

      if (result.details.issue_panels > 0) {
        result.status = 'warning';
      }
    } catch (error) {
      result.status = 'failed';
      result.issues.push(`Panels health test error: ${error.message}`);
    }

    return result;
  }

  async testDataSources(dashboard) {
    const result = {
      status: 'passed',
      details: {
        data_sources_checked: 0,
        healthy_data_sources: 0,
        issue_data_sources: 0,
      },
      issues: [],
    };

    try {
      // Extraer data sources del dashboard
      const dataSourceTypes = new Set();

      if (dashboard.dashboard.panels) {
        for (const panel of dashboard.dashboard.panels) {
          if (panel.datasource) {
            dataSourceTypes.add(panel.datasource.type || 'unknown');
          }

          if (panel.targets) {
            for (const target of panel.targets) {
              if (target.datasource) {
                dataSourceTypes.add(target.datasource.type || 'unknown');
              }
            }
          }
        }
      }

      // Verificar cada data source
      for (const dsType of dataSourceTypes) {
        result.details.data_sources_checked++;

        try {
          // Intentar obtener健康状态 del data source
          const dsUrl = `${this.config.grafana_url}/api/datasources`;
          const response = await this.makeRequest('GET', dsUrl);

          if (response.statusCode === 200) {
            const dataSources = JSON.parse(response.body);
            const ds = dataSources.find(d => d.type === dsType);

            if (ds) {
              result.details.healthy_data_sources++;
            } else {
              result.details.issue_data_sources++;
              result.issues.push(`Data source type "${dsType}" not found in Grafana`);
            }
          } else {
            result.details.issue_data_sources++;
            result.issues.push(`Failed to check data source "${dsType}"`);
          }
        } catch (error) {
          result.details.issue_data_sources++;
          result.issues.push(`Error checking data source "${dsType}": ${error.message}`);
        }
      }

      if (result.details.issue_data_sources > 0) {
        result.status = 'warning';
      }
    } catch (error) {
      result.status = 'failed';
      result.issues.push(`Data sources test error: ${error.message}`);
    }

    return result;
  }

  async testVariables(dashboard) {
    const result = {
      status: 'passed',
      details: {
        total_variables: 0,
        healthy_variables: 0,
        issue_variables: 0,
      },
      issues: [],
    };

    try {
      const variables = dashboard.dashboard.templating?.list || [];
      result.details.total_variables = variables.length;

      for (const variable of variables) {
        if (!variable.name) {
          result.details.issue_variables++;
          result.issues.push('Variable without name found');
          continue;
        }

        if (!variable.type) {
          result.details.issue_variables++;
          result.issues.push(`Variable "${variable.name}" without type`);
          continue;
        }

        result.details.healthy_variables++;
      }

      if (result.details.issue_variables > 0) {
        result.status = 'warning';
      }
    } catch (error) {
      result.status = 'failed';
      result.issues.push(`Variables test error: ${error.message}`);
    }

    return result;
  }

  testAlerts(panels) {
    const result = {
      status: 'passed',
      details: {
        total_panels_with_alerts: 0,
        healthy_alerts: 0,
        issue_alerts: 0,
      },
      issues: [],
    };

    try {
      for (const panel of panels) {
        if (panel.alert) {
          result.details.total_panels_with_alerts++;

          const alert = panel.alert;

          if (!alert.conditions || alert.conditions.length === 0) {
            result.details.issue_alerts++;
            result.issues.push(`Alert in panel "${panel.title}" without conditions`);
            continue;
          }

          if (!alert.frequency) {
            result.details.issue_alerts++;
            result.issues.push(`Alert in panel "${panel.title}" without frequency`);
            continue;
          }

          result.details.healthy_alerts++;
        }
      }

      if (result.details.issue_alerts > 0) {
        result.status = 'warning';
      }
    } catch (error) {
      result.status = 'failed';
      result.issues.push(`Alerts test error: ${error.message}`);
    }

    return result;
  }

  async getFolders() {
    await this.initialize();

    try {
      logger.info('Getting Grafana folders');

      const foldersUrl = `${this.config.grafana_url}/api/folders`;
      const response = await this.makeRequest('GET', foldersUrl);

      if (response.statusCode !== 200) {
        throw new Error(`Get folders failed with status: ${response.statusCode}`);
      }

      const data = JSON.parse(response.body);

      return {
        success: true,
        folders: data,
        count: data.length,
        retrieved_at: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error getting folders:', error);
      throw new Error(`Failed to get folders: ${error.message}`);
    }
  }

  async getDataSources() {
    await this.initialize();

    try {
      logger.info('Getting Grafana data sources');

      const dsUrl = `${this.config.grafana_url}/api/datasources`;
      const response = await this.makeRequest('GET', dsUrl);

      if (response.statusCode !== 200) {
        throw new Error(`Get data sources failed with status: ${response.statusCode}`);
      }

      const data = JSON.parse(response.body);

      return {
        success: true,
        data_sources: data,
        count: data.length,
        retrieved_at: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error getting data sources:', error);
      throw new Error(`Failed to get data sources: ${error.message}`);
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

      // Agregar autenticación
      if (this.authHeader) {
        if (this.authHeader.startsWith('Bearer ')) {
          options.headers['Authorization'] = this.authHeader;
        } else {
          // Cookie de sesión
          options.headers['Cookie'] = this.authHeader;
        }
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

  async checkHealth() {
    try {
      const healthUrl = `${this.config.grafana_url}/api/health`;
      const response = await this.makeRequest('GET', healthUrl);

      const isHealthy = response.statusCode === 200;

      return {
        healthy: isHealthy,
        status_code: response.statusCode,
        url: this.config.grafana_url,
        checked_at: new Date().toISOString(),
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        url: this.config.grafana_url,
        checked_at: new Date().toISOString(),
      };
    }
  }
}

export default GrafanaManager;
