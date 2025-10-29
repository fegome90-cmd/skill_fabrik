/**
 * MemTech System Module
 *
 * Módulo para diagnóstico del sistema y escaneo de puertos
 */

import { spawn } from 'child_process';
import { createConnection } from 'net';
import process from 'process';
import winston from 'winston';
import os from 'os';

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

class SystemManager {
  constructor(config = {}) {
    this.config = {
      scan_timeout_ms: config.scan_timeout_ms || 3000,
      max_concurrent_scans: config.max_concurrent_scans || 50,
      common_ports: config.common_ports || [
        21, 22, 23, 25, 53, 80, 110, 111, 135, 139, 143, 443, 993, 995, 1723, 3306, 3389, 5432,
        5900, 6379, 8080, 8443, 9200, 27017,
      ],
      health_checks: config.health_checks !== false,
      ...config,
    };

    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Verificar permisos y capacidades del sistema
      await this.checkSystemCapabilities();

      this.initialized = true;
      logger.info('System Manager initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize System Manager:', error);
      throw error;
    }
  }

  async checkSystemCapabilities() {
    try {
      // Verificar si estamos en un entorno compatible
      const platform = os.platform();
      logger.info(`Running on platform: ${platform}`);

      // Verificar capacidad para escaneo de puertos
      if (platform === 'linux' || platform === 'darwin') {
        // En Unix-like systems, podemos usar netstat o ss
        try {
          await this.executeCommand('which netstat');
          logger.info('netstat command available');
        } catch (error) {
          try {
            await this.executeCommand('which ss');
            logger.info('ss command available');
          } catch (error2) {
            logger.warn('Neither netstat nor ss commands available, using fallback methods');
          }
        }
      } else if (platform === 'win32') {
        try {
          await this.executeCommand('where netstat');
          logger.info('netstat command available on Windows');
        } catch (error) {
          logger.warn('netstat command not available on Windows');
        }
      }

      return true;
    } catch (error) {
      logger.error('Error checking system capabilities:', error);
      throw error;
    }
  }

  async executeCommand(command, args = []) {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: this.config.scan_timeout_ms,
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', data => {
        stdout += data.toString();
      });

      child.stderr.on('data', data => {
        stderr += data.toString();
      });

      child.on('close', code => {
        if (code === 0) {
          resolve({ stdout, stderr, code });
        } else {
          reject(new Error(`Command failed with code ${code}: ${stderr}`));
        }
      });

      child.on('error', error => {
        reject(error);
      });

      child.on('timeout', () => {
        child.kill();
        reject(new Error('Command timeout'));
      });
    });
  }

  async portsScan(host = 'localhost', ports = null, options = {}) {
    await this.initialize();

    try {
      logger.info(`Scanning ports on ${host}`);

      const targetPorts = ports || this.config.common_ports;
      const timeout = options.timeout_ms || this.config.scan_timeout_ms;
      const maxConcurrent = options.max_concurrent || this.config.max_concurrent_scans;

      const results = {
        host,
        total_ports: targetPorts.length,
        open_ports: [],
        closed_ports: [],
        filtered_ports: [],
        scan_duration_ms: 0,
        scanned_at: new Date().toISOString(),
      };

      const startTime = Date.now();

      // Escanear puertos en lotes para no sobrecargar el sistema
      const batches = [];
      for (let i = 0; i < targetPorts.length; i += maxConcurrent) {
        batches.push(targetPorts.slice(i, i + maxConcurrent));
      }

      for (const batch of batches) {
        const batchPromises = batch.map(port => this.scanSinglePort(host, port, timeout));

        const batchResults = await Promise.allSettled(batchPromises);

        for (let i = 0; i < batchResults.length; i++) {
          const port = batch[i];
          const result = batchResults[i];

          if (result.status === 'fulfilled') {
            const portResult = result.value;

            if (portResult.open) {
              results.open_ports.push({
                port,
                service: portResult.service,
                response_time_ms: portResult.response_time_ms,
              });
            } else if (portResult.filtered) {
              results.filtered_ports.push({
                port,
                reason: portResult.reason,
              });
            } else {
              results.closed_ports.push({
                port,
                response_time_ms: portResult.response_time_ms,
              });
            }
          } else {
            results.closed_ports.push({
              port,
              error: result.reason.message,
            });
          }
        }
      }

      results.scan_duration_ms = Date.now() - startTime;

      logger.info(
        `Port scan completed: ${results.open_ports.length} open, ${results.closed_ports.length} closed, ${results.filtered_ports.length} filtered`
      );

      return results;
    } catch (error) {
      logger.error(`Error scanning ports on ${host}:`, error);
      throw new Error(`Port scan failed: ${error.message}`);
    }
  }

  async scanSinglePort(host, port, timeout) {
    return new Promise(resolve => {
      const startTime = Date.now();
      const socket = createConnection({ host, port });

      socket.setTimeout(timeout);

      socket.on('connect', () => {
        const responseTime = Date.now() - startTime;
        socket.destroy();

        resolve({
          open: true,
          port,
          service: this.guessService(port),
          response_time_ms: responseTime,
        });
      });

      socket.on('timeout', () => {
        socket.destroy();

        resolve({
          open: false,
          filtered: true,
          port,
          reason: 'timeout',
          response_time_ms: timeout,
        });
      });

      socket.on('error', error => {
        const responseTime = Date.now() - startTime;

        if (error.code === 'ECONNREFUSED') {
          resolve({
            open: false,
            port,
            response_time_ms: responseTime,
          });
        } else {
          resolve({
            open: false,
            filtered: true,
            port,
            reason: error.code,
            response_time_ms: responseTime,
          });
        }
      });
    });
  }

  guessService(port) {
    const commonServices = {
      21: 'ftp',
      22: 'ssh',
      23: 'telnet',
      25: 'smtp',
      53: 'dns',
      80: 'http',
      110: 'pop3',
      111: 'rpcbind',
      135: 'msrpc',
      139: 'netbios-ssn',
      143: 'imap',
      443: 'https',
      993: 'imaps',
      995: 'pop3s',
      1723: 'pptp',
      3306: 'mysql',
      3389: 'rdp',
      5432: 'postgresql',
      5900: 'vnc',
      6379: 'redis',
      8080: 'http-alt',
      8443: 'https-alt',
      9200: 'elasticsearch',
      27017: 'mongodb',
    };

    return commonServices[port] || 'unknown';
  }

  async health() {
    await this.initialize();

    try {
      logger.info('Running system health check');

      const healthResults = {
        overall_status: 'healthy',
        status_code: 200,
        checks: {},
        summary: {
          total_checks: 0,
          passed_checks: 0,
          failed_checks: 0,
          warning_checks: 0,
          error_checks: 0,
        },
        alerts: [],
        recommendations: [],
        performance_metrics: {},
        checked_at: new Date().toISOString(),
      };

      // Ejecutar todas las verificaciones de salud
      const checks = [
        { name: 'system_info', func: this.checkSystemInfo },
        { name: 'disk_space', func: this.checkDiskSpace },
        { name: 'memory_usage', func: this.checkMemoryUsage },
        { name: 'cpu_usage', func: this.checkCpuUsage },
        { name: 'network_connectivity', func: this.checkNetworkConnectivity },
        { name: 'process_health', func: this.checkProcessHealth },
        { name: 'system_load', func: this.checkSystemLoad },
      ];

      for (const check of checks) {
        try {
          healthResults.summary.total_checks++;
          const result = await check.func.call(this);

          healthResults.checks[check.name] = result;

          if (result.status === 'passed') {
            healthResults.summary.passed_checks++;
          } else if (result.status === 'failed') {
            healthResults.summary.failed_checks++;
            healthResults.overall_status = 'unhealthy';
            healthResults.status_code = 500;

            // Generar alerta crítica
            healthResults.alerts.push({
              severity: 'critical',
              check: check.name,
              message: result.error || `Check ${check.name} failed`,
              timestamp: new Date().toISOString(),
              recommendation: this.getRecommendation(check.name, result.status),
            });
          } else if (result.status === 'warning') {
            healthResults.summary.warning_checks++;
            if (healthResults.overall_status === 'healthy') {
              healthResults.overall_status = 'warning';
              healthResults.status_code = 300;
            }

            // Generar alerta de advertencia
            healthResults.alerts.push({
              severity: 'warning',
              check: check.name,
              message: result.warning || `Check ${check.name} has warnings`,
              timestamp: new Date().toISOString(),
              recommendation: this.getRecommendation(check.name, result.status),
            });
          } else if (result.status === 'error') {
            healthResults.summary.error_checks++;
            healthResults.overall_status = 'unhealthy';
            healthResults.status_code = 500;

            // Generar alerta de error
            healthResults.alerts.push({
              severity: 'error',
              check: check.name,
              message: result.error || `Error in check ${check.name}`,
              timestamp: new Date().toISOString(),
              recommendation: this.getRecommendation(check.name, result.status),
            });
          }

          // Recolectar métricas de rendimiento
          if (result.data) {
            healthResults.performance_metrics[check.name] = result.data;
          }
        } catch (error) {
          healthResults.summary.total_checks++;
          healthResults.summary.error_checks++;
          healthResults.checks[check.name] = {
            status: 'error',
            error: error.message,
          };
          healthResults.overall_status = 'unhealthy';
          healthResults.status_code = 500;

          // Generar alerta de error crítico
          healthResults.alerts.push({
            severity: 'critical',
            check: check.name,
            message: `Critical error in ${check.name}: ${error.message}`,
            timestamp: new Date().toISOString(),
            recommendation: 'Check system logs and verify system configuration',
          });
        }
      }

      // Generar recomendaciones generales basadas en el estado general
      healthResults.recommendations = this.generateGeneralRecommendations(healthResults);

      // Ordenar alertas por severidad
      healthResults.alerts.sort((a, b) => {
        const severityOrder = { critical: 0, error: 1, warning: 2, info: 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      });

      logger.info(
        `Health check completed: ${healthResults.overall_status} (${healthResults.alerts.length} alerts)`
      );

      return healthResults;
    } catch (error) {
      logger.error('Error running health check:', error);
      throw new Error(`Health check failed: ${error.message}`);
    }
  }

  getRecommendation(checkName, status) {
    const recommendations = {
      disk_space: {
        warning: 'Consider cleaning up temporary files or expanding disk storage',
        failed: 'Immediately free up disk space or add storage capacity',
        error: 'Check disk integrity and filesystem status',
      },
      memory_usage: {
        warning: 'Monitor memory usage and consider closing unnecessary processes',
        failed: 'Free up memory by restarting services or adding RAM',
        error: 'Check for memory leaks and system stability',
      },
      cpu_usage: {
        warning: 'Monitor CPU usage and optimize running processes',
        failed: 'Reduce CPU load or upgrade processing capacity',
        error: 'Check for runaway processes and system stability',
      },
      network_connectivity: {
        warning: 'Monitor network performance and check for latency issues',
        failed: 'Check network configuration and connectivity',
        error: 'Verify network hardware and configuration',
      },
      process_health: {
        warning: 'Monitor process memory usage and performance',
        failed: 'Restart affected processes or check for memory leaks',
        error: 'Check process logs and system stability',
      },
      system_load: {
        warning: 'Monitor system load and optimize process scheduling',
        failed: 'Reduce system load or upgrade hardware',
        error: 'Check for system bottlenecks and resource contention',
      },
    };

    return recommendations[checkName]?.[status] || 'Consult system administrator for assistance';
  }

  generateGeneralRecommendations(healthResults) {
    const recommendations = [];

    if (healthResults.summary.failed_checks > 0) {
      recommendations.push({
        priority: 'high',
        message: `${healthResults.summary.failed_checks} critical checks require immediate attention`,
        action: 'Review critical alerts and take corrective action',
      });
    }

    if (healthResults.summary.warning_checks > 0) {
      recommendations.push({
        priority: 'medium',
        message: `${healthResults.summary.warning_checks} checks have warnings that should be monitored`,
        action: 'Monitor warning alerts and plan preventive maintenance',
      });
    }

    if (healthResults.overall_status === 'healthy') {
      recommendations.push({
        priority: 'low',
        message: 'All systems operating normally',
        action: 'Continue regular monitoring and maintenance',
      });
    }

    // Recomendaciones específicas basadas en métricas
    if (healthResults.performance_metrics.memory_usage) {
      const memUsage = healthResults.performance_metrics.memory_usage.used_percent;
      if (memUsage > 80) {
        recommendations.push({
          priority: 'high',
          message: `Memory usage is critically high at ${memUsage.toFixed(1)}%`,
          action: 'Free up memory or add RAM capacity',
        });
      }
    }

    if (healthResults.performance_metrics.cpu_usage) {
      const cpuUsage = healthResults.performance_metrics.cpu_usage.cpu_usage_percent;
      if (cpuUsage > 80) {
        recommendations.push({
          priority: 'high',
          message: `CPU usage is critically high at ${cpuUsage.toFixed(1)}%`,
          action: 'Optimize processes or upgrade CPU capacity',
        });
      }
    }

    return recommendations;
  }

  async checkSystemInfo() {
    try {
      const systemInfo = {
        platform: os.platform(),
        arch: os.arch(),
        hostname: os.hostname(),
        node_version: process.version,
        uptime: os.uptime(),
        totalmem: os.totalmem(),
        freemem: os.freemem(),
        cpus: os.cpus().length,
        loadavg: os.loadavg(),
        network_interfaces: os.networkInterfaces(),
        timestamp: new Date().toISOString(),
      };

      return {
        status: 'passed',
        data: systemInfo,
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
      };
    }
  }

  async checkDiskSpace() {
    try {
      const platform = os.platform();
      let dfOutput;

      if (platform === 'win32') {
        // En Windows, usar wmic
        const result = await this.executeCommand('wmic', [
          'logicaldisk',
          'get',
          'size,freespace,caption',
        ]);
        dfOutput = result.stdout;
      } else {
        // En Unix-like systems, usar df
        const result = await this.executeCommand('df', ['-h']);
        dfOutput = result.stdout;
      }

      // Parsear salida y calcular espacio disponible
      const diskUsage = this.parseDiskUsage(dfOutput, platform);

      // Verificar si hay suficiente espacio (menos del 90% usado)
      const hasEnoughSpace = diskUsage.every(disk => disk.used_percent < 90);

      return {
        status: hasEnoughSpace ? 'passed' : 'warning',
        data: diskUsage,
        warning: !hasEnoughSpace ? 'Some disks are running low on space' : null,
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
      };
    }
  }

  parseDiskUsage(output, platform) {
    const disks = [];

    if (platform === 'win32') {
      // Parsear salida de wmic
      const lines = output.split('\n').filter(line => line.trim());
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].trim().split(/\s+/);
        if (parts.length >= 3) {
          const caption = parts[0];
          const freeSpace = parseInt(parts[1]);
          const size = parseInt(parts[2]);
          const usedSpace = size - freeSpace;
          const usedPercent = (usedSpace / size) * 100;

          disks.push({
            filesystem: caption,
            size: size,
            used: usedSpace,
            free: freeSpace,
            used_percent: usedPercent,
          });
        }
      }
    } else {
      // Parsear salida de df
      const lines = output.split('\n').filter(line => line.trim());
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].trim().split(/\s+/);
        if (parts.length >= 6) {
          const filesystem = parts[0];
          const size = this.parseSize(parts[1]);
          const used = this.parseSize(parts[2]);
          const free = this.parseSize(parts[3]);
          const usedPercent = parseInt(parts[4].replace('%', ''));

          disks.push({
            filesystem,
            size,
            used,
            free,
            used_percent: usedPercent,
          });
        }
      }
    }

    return disks;
  }

  parseSize(sizeStr) {
    const units = {
      K: 1024,
      M: 1024 * 1024,
      G: 1024 * 1024 * 1024,
      T: 1024 * 1024 * 1024 * 1024,
    };

    const match = sizeStr.match(/^(\d+)([KMGT]?)$/);
    if (!match) return 0;

    const value = parseInt(match[1]);
    const unit = match[2] || '';

    return value * (units[unit] || 1);
  }

  async checkMemoryUsage() {
    try {
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      const usedPercent = (usedMem / totalMem) * 100;

      let status = 'passed';
      let warning = null;

      if (usedPercent > 90) {
        status = 'failed';
        warning = 'Memory usage is critically high';
      } else if (usedPercent > 80) {
        status = 'warning';
        warning = 'Memory usage is high';
      }

      return {
        status,
        data: {
          total: totalMem,
          used: usedMem,
          free: freeMem,
          used_percent: usedPercent,
        },
        warning,
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
      };
    }
  }

  async checkCpuUsage() {
    try {
      const cpus = os.cpus();
      const loadAvg = os.loadavg();

      // Calcular uso de CPU promedio
      const cpuUsage = (loadAvg[0] / cpus.length) * 100;

      let status = 'passed';
      let warning = null;

      if (cpuUsage > 90) {
        status = 'failed';
        warning = 'CPU usage is critically high';
      } else if (cpuUsage > 80) {
        status = 'warning';
        warning = 'CPU usage is high';
      }

      return {
        status,
        data: {
          cpu_count: cpus.length,
          load_average: loadAvg,
          cpu_usage_percent: cpuUsage,
        },
        warning,
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
      };
    }
  }

  async checkNetworkConnectivity() {
    try {
      // Verificar conectividad básica
      const testHosts = ['8.8.8.8', '1.1.1.1', 'localhost'];
      const results = [];

      for (const host of testHosts) {
        try {
          const startTime = Date.now();
          await this.scanSinglePort(host, 53, 5000); // DNS port
          const responseTime = Date.now() - startTime;

          results.push({
            host,
            reachable: true,
            response_time_ms: responseTime,
          });
        } catch (error) {
          results.push({
            host,
            reachable: false,
            error: error.message,
          });
        }
      }

      const reachableCount = results.filter(r => r.reachable).length;
      const status = reachableCount > 0 ? 'passed' : 'failed';

      return {
        status,
        data: {
          tests: results,
          reachable_hosts: reachableCount,
          total_hosts: testHosts.length,
        },
        warning: reachableCount === 0 ? 'No network connectivity detected' : null,
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
      };
    }
  }

  async checkProcessHealth() {
    try {
      const uptime = os.uptime();
      const memoryUsage = process.memoryUsage();

      // Verificar si el proceso actual está saludable
      const heapUsedMB = memoryUsage.heapUsed / (1024 * 1024);
      const heapTotalMB = memoryUsage.heapTotal / (1024 * 1024);
      const heapUsagePercent = (heapUsedMB / heapTotalMB) * 100;

      let status = 'passed';
      let warning = null;

      if (heapUsagePercent > 90) {
        status = 'warning';
        warning = 'Process heap usage is high';
      }

      return {
        status,
        data: {
          pid: process.pid,
          uptime: uptime,
          memory_usage: {
            rss: memoryUsage.rss,
            heap_total: memoryUsage.heapTotal,
            heap_used: memoryUsage.heapUsed,
            external: memoryUsage.external,
            heap_usage_percent: heapUsagePercent,
          },
        },
        warning,
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
      };
    }
  }

  async checkSystemLoad() {
    try {
      const loadAvg = os.loadavg();
      const cpus = os.cpus().length;

      // Cargar promedio de 1 minuto normalizado por número de CPUs
      const load1MinNormalized = loadAvg[0] / cpus;

      let status = 'passed';
      let warning = null;

      if (load1MinNormalized > 2.0) {
        status = 'failed';
        warning = 'System load is critically high';
      } else if (load1MinNormalized > 1.5) {
        status = 'warning';
        warning = 'System load is high';
      }

      return {
        status,
        data: {
          cpu_count: cpus,
          load_average: {
            '1min': loadAvg[0],
            '5min': loadAvg[1],
            '15min': loadAvg[2],
          },
          load_normalized: {
            '1min': load1MinNormalized,
            '5min': loadAvg[1] / cpus,
            '15min': loadAvg[2] / cpus,
          },
        },
        warning,
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
      };
    }
  }
}

export default SystemManager;
