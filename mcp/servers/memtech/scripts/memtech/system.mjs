#!/usr/bin/env node

/**
 * MemTech Advanced System Diagnostics Module
 *
 * Módulo avanzado para diagnóstico completo del sistema con métricas detalladas,
 * análisis de rendimiento y capacidades de monitoreo en tiempo real.
 */

import fs from 'fs/promises';
import path from 'path';
import process from 'process';
import winston from 'winston';
import os from 'os';
import { execSync } from 'child_process';

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

class AdvancedSystemDiagnostics {
  constructor(config = {}) {
    this.config = {
      scan_timeout_ms: config.scan_timeout_ms || 5000,
      max_concurrent_scans: config.max_concurrent_scans || 50,
      deep_scan_enabled: config.deep_scan_enabled !== false,
      metrics_collection: config.metrics_collection !== false,
      performance_analysis: config.performance_analysis !== false,
      ...config
    };

    this.diagnostics = {
      system: {},
      network: {},
      performance: {},
      security: {},
      resources: {}
    };

    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      logger.info('Inicializando Advanced System Diagnostics...');

      // Verificar permisos y dependencias
      await this.checkDependencies();
      await this.validatePermissions();

      this.initialized = true;
      logger.info('Advanced System Diagnostics inicializado correctamente');
    } catch (error) {
      logger.error('Error inicializando Advanced System Diagnostics:', error);
      throw error;
    }
  }

  async checkDependencies() {
    const requiredCommands = [
      'netstat', 'lsof', 'ps', 'df', 'free', 'uptime',
      'vmstat', 'iostat', 'sar', 'ss', 'nmap'
    ];

    const missing = [];
    for (const cmd of requiredCommands) {
      try {
        execSync(`which ${cmd} > /dev/null 2>&1`);
      } catch (error) {
        missing.push(cmd);
      }
    }

    if (missing.length > 0) {
      logger.warn(`Comandos faltantes: ${missing.join(', ')}`);
      logger.warn('Algunas funcionalidades avanzadas podrían no estar disponibles');
    }
  }

  async validatePermissions() {
    try {
      // Verificar permisos de red
      await fs.access('/proc/net/tcp', fs.constants.R_OK);
      await fs.access('/proc/net/udp', fs.constants.R_OK);

      // Verificar permisos de procesos
      await fs.access('/proc/self/status', fs.constants.R_OK);
    } catch (error) {
      logger.warn('Permisos limitados detectados, algunas funcionalidades podrían estar restringidas');
    }
  }

  /**
   * Ejecutar diagnóstico completo del sistema
   */
  async runFullDiagnostics(options = {}) {
    await this.initialize();

    const startTime = Date.now();
    logger.info('Iniciando diagnóstico completo del sistema...');

    try {
      const results = {
        timestamp: new Date().toISOString(),
        duration_ms: 0,
        status: 'running',
        diagnostics: {}
      };

      // Ejecutar todos los módulos de diagnóstico
      const diagnosticTasks = [
        this.diagnoseSystemHealth.bind(this),
        this.diagnoseNetwork.bind(this),
        this.diagnosePerformance.bind(this),
        this.diagnoseSecurity.bind(this),
        this.diagnoseResources.bind(this)
      ];

      for (const task of diagnosticTasks) {
        try {
          const moduleResult = await task();
          const moduleName = task.name.replace('bound ', '').split('.')[1];
          results.diagnostics[moduleName] = moduleResult;
        } catch (error) {
          logger.error(`Error en módulo ${task.name}:`, error);
          results.diagnostics[task.name] = {
            status: 'error',
            error: error.message
          };
        }
      }

      // Calcular métricas generales
      results.duration_ms = Date.now() - startTime;
      results.status = this.calculateOverallStatus(results.diagnostics);
      results.summary = this.generateSummary(results.diagnostics);

      logger.info(`Diagnóstico completo finalizado en ${results.duration_ms}ms`);
      return results;

    } catch (error) {
      logger.error('Error ejecutando diagnóstico completo:', error);
      throw error;
    }
  }

  async diagnoseSystemHealth() {
    logger.info('Ejecutando diagnóstico de salud del sistema...');

    const health = {
      status: 'unknown',
      uptime: {},
      load: {},
      processes: {},
      services: {},
      disks: {},
      memory: {}
    };

    try {
      // Información de uptime
      const uptime = execSync('uptime').toString().trim();
      health.uptime.raw = uptime;

      const uptimeMatch = uptime.match(/up\s+(.+?),.+?load average:\s+(.+)/);
      if (uptimeMatch) {
        health.uptime.duration = uptimeMatch[1].trim();
        health.load.averages = uptimeMatch[2].trim().split(',').map(s => parseFloat(s.trim()));
      }

      // Información de carga del sistema
      try {
        const loadavg = await fs.readFile('/proc/loadavg', 'utf8');
        const [load1, load5, load15] = loadavg.split(' ').slice(0, 3).map(parseFloat);
        health.load = { load1, load5, load15 };
      } catch (error) {
        logger.warn('No se pudo leer /proc/loadavg:', error.message);
      }

      // Información de procesos
      try {
        const psOutput = execSync('ps aux --no-headers | wc -l').toString().trim();
        health.processes.total = parseInt(psOutput);
      } catch (error) {
        health.processes.total = 'unknown';
      }

      // Información de servicios críticos
      const criticalServices = ['memtech-mcp', 'victoria-metrics', 'grafana-server'];
      health.services = {};

      for (const service of criticalServices) {
        try {
          execSync(`pgrep -f "${service}" > /dev/null 2>&1`);
          health.services[service] = 'running';
        } catch (error) {
          health.services[service] = 'stopped';
        }
      }

      // Información de discos
      try {
        const dfOutput = execSync('df -h / /tmp /var /home 2>/dev/null || df -h').toString();
        health.disks.raw = dfOutput;
        health.disks.filesystems = this.parseDfOutput(dfOutput);
      } catch (error) {
        health.disks.error = error.message;
      }

      // Información de memoria
      try {
        const meminfo = await fs.readFile('/proc/meminfo', 'utf8');
        health.memory = this.parseMeminfo(meminfo);
      } catch (error) {
        logger.warn('No se pudo leer /proc/meminfo:', error.message);
      }

      // Calcular estado general
      health.status = this.calculateHealthStatus(health);

      return health;

    } catch (error) {
      logger.error('Error en diagnóstico de salud del sistema:', error);
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  async diagnoseNetwork() {
    logger.info('Ejecutando diagnóstico de red...');

    const network = {
      status: 'unknown',
      interfaces: {},
      ports: {},
      connections: {},
      dns: {},
      routing: {}
    };

    try {
      // Interfaces de red
      try {
        const interfaces = os.networkInterfaces();
        network.interfaces = {};

        for (const [name, ifaceArray] of Object.entries(interfaces)) {
          if (ifaceArray && ifaceArray.length > 0) {
            network.interfaces[name] = ifaceArray.map(iface => ({
              family: iface.family,
              address: iface.address,
              netmask: iface.netmask,
              mac: iface.mac,
              internal: iface.internal,
              cidr: iface.cidr
            }));
          }
        }
      } catch (error) {
        network.interfaces.error = error.message;
      }

      // Puertos abiertos
      try {
        const netstatOutput = execSync('netstat -tuln 2>/dev/null || ss -tuln').toString();
        network.ports.raw = netstatOutput;
        network.ports.open = this.parseNetworkPorts(netstatOutput);
      } catch (error) {
        network.ports.error = error.message;
      }

      // Conexiones activas
      try {
        const connectionsOutput = execSync('netstat -tun 2>/dev/null || ss -tun').toString();
        network.connections.raw = connectionsOutput;
        network.connections.active = this.parseActiveConnections(connectionsOutput);
      } catch (error) {
        network.connections.error = error.message;
      }

      // DNS
      try {
        const dnsOutput = execSync('nslookup localhost 2>/dev/null || host localhost').toString();
        network.dns.raw = dnsOutput;
        network.dns.resolution = this.parseDNSResolution(dnsOutput);
      } catch (error) {
        network.dns.error = error.message;
      }

      // Información de routing
      try {
        const routeOutput = execSync('ip route show 2>/dev/null || netstat -rn').toString();
        network.routing.raw = routeOutput;
        network.routing.routes = this.parseRoutingTable(routeOutput);
      } catch (error) {
        network.routing.error = error.message;
      }

      network.status = this.calculateNetworkStatus(network);

      return network;

    } catch (error) {
      logger.error('Error en diagnóstico de red:', error);
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  async diagnosePerformance() {
    logger.info('Ejecutando diagnóstico de rendimiento...');

    const performance = {
      status: 'unknown',
      cpu: {},
      memory: {},
      disk: {},
      network: {},
      processes: {}
    };

    try {
      // CPU
      try {
        const cpuInfo = await fs.readFile('/proc/cpuinfo', 'utf8');
        performance.cpu = this.parseCPUInfo(cpuInfo);

        const stat = await fs.readFile('/proc/stat', 'utf8');
        performance.cpu.usage = this.parseCPUUsage(stat);
      } catch (error) {
        performance.cpu.error = error.message;
      }

      // Memoria detallada
      try {
        const meminfo = await fs.readFile('/proc/meminfo', 'utf8');
        performance.memory = this.parseMeminfo(meminfo);
      } catch (error) {
        performance.memory.error = error.message;
      }

      // Disco I/O
      try {
        const diskstats = await fs.readFile('/proc/diskstats', 'utf8');
        performance.disk = this.parseDiskStats(diskstats);
      } catch (error) {
        performance.disk.error = error.message;
      }

      // Procesos top
      try {
        const psOutput = execSync('ps aux --sort=-%cpu | head -10').toString();
        performance.processes.top_cpu = this.parseProcessList(psOutput);

        const psMemOutput = execSync('ps aux --sort=-%mem | head -10').toString();
        performance.processes.top_memory = this.parseProcessList(psMemOutput);
      } catch (error) {
        performance.processes.error = error.message;
      }

      performance.status = this.calculatePerformanceStatus(performance);

      return performance;

    } catch (error) {
      logger.error('Error en diagnóstico de rendimiento:', error);
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  async diagnoseSecurity() {
    logger.info('Ejecutando diagnóstico de seguridad...');

    const security = {
      status: 'unknown',
      authentication: {},
      firewall: {},
      users: {},
      permissions: {},
      vulnerabilities: {}
    };

    try {
      // Usuarios del sistema
      try {
        const passwd = await fs.readFile('/etc/passwd', 'utf8');
        security.users = this.parsePasswdFile(passwd);
      } catch (error) {
        security.users.error = error.message;
      }

      // Grupos
      try {
        const group = await fs.readFile('/etc/group', 'utf8');
        security.users.groups = this.parseGroupFile(group);
      } catch (error) {
        security.users.groups = { error: error.message };
      }

      // Procesos con permisos elevados
      try {
        const psOutput = execSync('ps aux | grep -E "(sudo|su|root)" | grep -v grep').toString();
        security.authentication.elevated_processes = psOutput.trim().split('\n').filter(Boolean);
      } catch (error) {
        security.authentication.elevated_processes = [];
      }

      // Estado del firewall
      try {
        const iptablesOutput = execSync('iptables -L -n 2>/dev/null || ufw status 2>/dev/null || firewall-cmd --list-all 2>/dev/null').toString();
        security.firewall.raw = iptablesOutput;
        security.firewall.active = iptablesOutput.length > 0;
      } catch (error) {
        security.firewall.error = error.message;
      }

      // Servicios expuestos
      try {
        const netstatOutput = execSync('netstat -tuln 2>/dev/null || ss -tuln').toString();
        security.vulnerabilities.exposed_services = this.analyzeExposedServices(netstatOutput);
      } catch (error) {
        security.vulnerabilities.error = error.message;
      }

      security.status = this.calculateSecurityStatus(security);

      return security;

    } catch (error) {
      logger.error('Error en diagnóstico de seguridad:', error);
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  async diagnoseResources() {
    logger.info('Ejecutando diagnóstico de recursos...');

    const resources = {
      status: 'unknown',
      cpu_cores: {},
      memory_total: {},
      disk_space: {},
      network_interfaces: {},
      load_balancing: {}
    };

    try {
      // Información de CPU
      resources.cpu_cores.physical = os.cpus().length;
      resources.cpu_cores.logical = os.cpus().length * (os.cpus()[0]?.times ? 1 : 1);

      // Memoria total
      resources.memory_total.bytes = os.totalmem();
      resources.memory_total.gb = Math.round(os.totalmem() / (1024 * 1024 * 1024));

      // Espacio en disco
      try {
        const dfOutput = execSync('df -h / /tmp /var /home').toString();
        resources.disk_space.filesystems = this.parseDfOutput(dfOutput);
      } catch (error) {
        resources.disk_space.error = error.message;
      }

      // Interfaces de red
      resources.network_interfaces = Object.keys(os.networkInterfaces());

      // Balanceo de carga
      try {
        const loadavg = await fs.readFile('/proc/loadavg', 'utf8');
        const [load1, load5, load15] = loadavg.split(' ').slice(0, 3).map(parseFloat);
        resources.load_balancing = {
          load1, load5, load15,
          status: load1 < resources.cpu_cores.logical ? 'optimal' :
                  load1 < resources.cpu_cores.logical * 1.5 ? 'acceptable' : 'high'
        };
      } catch (error) {
        resources.load_balancing.error = error.message;
      }

      resources.status = this.calculateResourceStatus(resources);

      return resources;

    } catch (error) {
      logger.error('Error en diagnóstico de recursos:', error);
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  // Funciones auxiliares de análisis
  parseDfOutput(output) {
    const lines = output.trim().split('\n').slice(1); // Saltar header
    return lines.map(line => {
      const parts = line.split(/\s+/);
      return {
        filesystem: parts[0],
        size: parts[1],
        used: parts[2],
        available: parts[3],
        use_percentage: parts[4],
        mounted_on: parts[5]
      };
    });
  }

  parseMeminfo(content) {
    const lines = content.trim().split('\n');
    const memory = {};

    lines.forEach(line => {
      const match = line.match(/^([^:]+):\s+(\d+)\s*(kB)?/);
      if (match) {
        const [, key, value, unit] = match;
        memory[key.toLowerCase().replace(/\s+/g, '_')] = {
          value: parseInt(value),
          unit: unit || 'kB'
        };
      }
    });

    return memory;
  }

  parseCPUInfo(content) {
    const lines = content.trim().split('\n');
    const cpu = {};

    lines.forEach(line => {
      const match = line.match(/^([^:]+)\s*:\s*(.+)$/);
      if (match) {
        const [, key, value] = match;
        cpu[key.toLowerCase().replace(/\s+/g, '_')] = value.trim();
      }
    });

    return cpu;
  }

  parseCPUUsage(statContent) {
    const lines = statContent.trim().split('\n');
    const cpuLine = lines[0]; // Primera línea es CPU total

    const parts = cpuLine.split(/\s+/).slice(1); // Saltar 'cpu'
    const [user, nice, system, idle, iowait, irq, softirq] = parts.map(Number);

    const total = user + nice + system + idle + iowait + irq + softirq;
    const usage = total - idle;

    return {
      user: Math.round((user / total) * 100),
      system: Math.round((system / total) * 100),
      idle: Math.round((idle / total) * 100),
      usage: Math.round((usage / total) * 100)
    };
  }

  parseNetworkPorts(output) {
    const lines = output.trim().split('\n').slice(2); // Saltar headers
    return lines.map(line => {
      const parts = line.trim().split(/\s+/);
      return {
        protocol: parts[0],
        local_address: parts[3],
        foreign_address: parts[4],
        state: parts[5] || 'LISTEN'
      };
    });
  }

  parseActiveConnections(output) {
    const lines = output.trim().split('\n').slice(2);
    return lines.map(line => {
      const parts = line.trim().split(/\s+/);
      return {
        protocol: parts[0],
        local_address: parts[3],
        foreign_address: parts[4],
        state: parts[5] || 'ESTABLISHED'
      };
    });
  }

  parseDNSResolution(output) {
    const lines = output.trim().split('\n');
    return lines.map(line => {
      const match = line.match(/(.+?)\s+has\s+address\s+(.+)/);
      if (match) {
        return {
          hostname: match[1],
          address: match[2]
        };
      }
      return { raw: line };
    });
  }

  parseRoutingTable(output) {
    const lines = output.trim().split('\n');
    return lines.map(line => {
      const parts = line.trim().split(/\s+/);
      return {
        destination: parts[0],
        gateway: parts[2],
        interface: parts[7] || parts[2],
        metric: parts[4] || '0'
      };
    });
  }

  parseDiskStats(content) {
    const lines = content.trim().split('\n');
    return lines.map(line => {
      const parts = line.trim().split(/\s+/);
      return {
        device: parts[2],
        reads: parseInt(parts[3]),
        writes: parseInt(parts[7]),
        read_bytes: parseInt(parts[5]),
        write_bytes: parseInt(parts[9])
      };
    });
  }

  parseProcessList(output) {
    const lines = output.trim().split('\n').slice(1); // Saltar header
    return lines.map(line => {
      const parts = line.trim().split(/\s+/);
      return {
        user: parts[0],
        pid: parts[1],
        cpu: parseFloat(parts[2]),
        memory: parseFloat(parts[3]),
        command: parts.slice(10).join(' ')
      };
    });
  }

  parsePasswdFile(content) {
    const lines = content.trim().split('\n');
    return lines.map(line => {
      const [username, , uid, gid, , home, shell] = line.split(':');
      return { username, uid: parseInt(uid), gid: parseInt(gid), home, shell };
    });
  }

  parseGroupFile(content) {
    const lines = content.trim().split('\n');
    return lines.map(line => {
      const [groupname, , gid, members] = line.split(':');
      return {
        groupname,
        gid: parseInt(gid),
        members: members ? members.split(',') : []
      };
    });
  }

  analyzeExposedServices(netstatOutput) {
    const lines = netstatOutput.trim().split('\n');
    const services = [];

    for (const line of lines) {
      if (line.includes('LISTEN')) {
        const parts = line.trim().split(/\s+/);
        const localAddr = parts[3];

        if (localAddr && !localAddr.includes('127.0.0.1') && !localAddr.includes('::1')) {
          const portMatch = localAddr.match(/:(\d+)$/);
          if (portMatch) {
            services.push({
              port: parseInt(portMatch[1]),
              protocol: parts[0],
              address: localAddr,
              risk: this.assessServiceRisk(parseInt(portMatch[1]))
            });
          }
        }
      }
    }

    return services;
  }

  assessServiceRisk(port) {
    const highRiskPorts = [21, 23, 25, 110, 143, 993, 995, 3389];
    const mediumRiskPorts = [80, 443, 22, 53, 135, 139, 445];

    if (highRiskPorts.includes(port)) return 'high';
    if (mediumRiskPorts.includes(port)) return 'medium';
    return 'low';
  }

  // Funciones de cálculo de estado
  calculateHealthStatus(health) {
    const issues = [];

    if (health.load.load1 > health.processes.total * 2) {
      issues.push('high_load');
    }

    if (Object.values(health.services).some(s => s === 'stopped')) {
      issues.push('critical_services_down');
    }

    if (health.disks.filesystems?.some(fs => fs.use_percentage > 90)) {
      issues.push('disk_space_critical');
    }

    if (issues.length === 0) return 'healthy';
    if (issues.length <= 2) return 'degraded';
    return 'unhealthy';
  }

  calculateNetworkStatus(network) {
    const issues = [];

    if (Object.keys(network.interfaces).length === 0) {
      issues.push('no_interfaces');
    }

    if (network.ports.open?.length === 0) {
      issues.push('no_open_ports');
    }

    if (network.connections.error) {
      issues.push('connection_analysis_failed');
    }

    if (issues.length === 0) return 'healthy';
    if (issues.length <= 1) return 'degraded';
    return 'unhealthy';
  }

  calculatePerformanceStatus(performance) {
    const issues = [];

    if (performance.cpu.usage > 80) {
      issues.push('high_cpu_usage');
    }

    if (performance.memory.memtotal?.value && performance.memory.memavailable?.value) {
      const usage = ((performance.memory.memtotal.value - performance.memory.memavailable.value) / performance.memory.memtotal.value) * 100;
      if (usage > 90) issues.push('high_memory_usage');
    }

    if (issues.length === 0) return 'optimal';
    if (issues.length <= 1) return 'acceptable';
    return 'degraded';
  }

  calculateSecurityStatus(security) {
    const issues = [];

    if (security.authentication.elevated_processes.length > 5) {
      issues.push('too_many_elevated_processes');
    }

    if (security.vulnerabilities.exposed_services?.some(s => s.risk === 'high')) {
      issues.push('high_risk_services_exposed');
    }

    if (!security.firewall.active) {
      issues.push('firewall_disabled');
    }

    if (issues.length === 0) return 'secure';
    if (issues.length <= 2) return 'acceptable';
    return 'vulnerable';
  }

  calculateResourceStatus(resources) {
    const issues = [];

    if (resources.load_balancing.status === 'high') {
      issues.push('high_system_load');
    }

    if (resources.disk_space.filesystems?.some(fs => fs.use_percentage > 85)) {
      issues.push('disk_space_warning');
    }

    if (resources.memory_total.gb < 2) {
      issues.push('low_memory');
    }

    if (issues.length === 0) return 'optimal';
    if (issues.length <= 2) return 'acceptable';
    return 'constrained';
  }

  calculateOverallStatus(diagnostics) {
    const statuses = Object.values(diagnostics).map(d => d.status);
    const statusWeights = { error: 0, unhealthy: 1, degraded: 2, acceptable: 3, optimal: 4, healthy: 4, secure: 4 };

    const totalWeight = statuses.reduce((sum, status) => sum + (statusWeights[status] || 2), 0);
    const averageWeight = totalWeight / statuses.length;

    if (averageWeight < 1) return 'critical';
    if (averageWeight < 2) return 'unhealthy';
    if (averageWeight < 3) return 'degraded';
    if (averageWeight < 4) return 'acceptable';
    return 'optimal';
  }

  generateSummary(diagnostics) {
    const summary = {
      overall_status: this.calculateOverallStatus(diagnostics),
      module_statuses: {},
      issues: [],
      recommendations: []
    };

    Object.entries(diagnostics).forEach(([module, data]) => {
      summary.module_statuses[module] = data.status;

      if (data.status === 'error' || data.status === 'unhealthy') {
        summary.issues.push(`${module}: ${data.status}`);
      }
    });

    if (summary.issues.length === 0) {
      summary.recommendations.push('Sistema operativo correctamente');
    } else {
      summary.recommendations.push(`Revisar ${summary.issues.length} módulos con problemas`);
    }

    return summary;
  }

  /**
   * Ejecutar escaneo de puertos específico
   */
  async scanPorts(targets = []) {
    logger.info(`Ejecutando escaneo de puertos para: ${targets.join(', ')}`);

    const results = {
      timestamp: new Date().toISOString(),
      targets: targets,
      open_ports: [],
      scan_time_ms: 0
    };

    const startTime = Date.now();

    try {
      for (const target of targets) {
        try {
          // Usar netcat o nc para escaneo rápido
          const ncOutput = execSync(`nc -zv ${target} 2>&1 | grep -E "(succeeded|open)" || echo "no open ports"`).toString();
          const openPorts = this.parseNcOutput(ncOutput);

          results.open_ports.push({
            target,
            ports: openPorts,
            status: openPorts.length > 0 ? 'has_open_ports' : 'no_open_ports'
          });
        } catch (error) {
          results.open_ports.push({
            target,
            error: error.message,
            status: 'scan_failed'
          });
        }
      }

      results.scan_time_ms = Date.now() - startTime;
      return results;

    } catch (error) {
      logger.error('Error en escaneo de puertos:', error);
      throw error;
    }
  }

  parseNcOutput(output) {
    const ports = [];
    const lines = output.trim().split('\n');

    lines.forEach(line => {
      const match = line.match(/Connection to (.+?) (\d+) port \[(\w+)\] succeeded!/);
      if (match) {
        ports.push({
          port: parseInt(match[2]),
          protocol: match[3].toLowerCase(),
          status: 'open'
        });
      }
    });

    return ports;
  }

  /**
   * Obtener métricas del sistema en formato Prometheus
   */
  async getPrometheusMetrics() {
    const metrics = [];

    try {
      // Métricas básicas del sistema
      const uptime = os.uptime();
      metrics.push(`# HELP memtech_system_uptime_seconds Tiempo de actividad del sistema`);
      metrics.push(`# TYPE memtech_system_uptime_seconds counter`);
      metrics.push(`memtech_system_uptime_seconds ${uptime}`);

      // Carga del sistema
      const loadavg = os.loadavg();
      metrics.push(`# HELP memtech_system_load_average Carga promedio del sistema`);
      metrics.push(`# TYPE memtech_system_load_average gauge`);
      metrics.push(`memtech_system_load_average_1m ${loadavg[0]}`);
      metrics.push(`memtech_system_load_average_5m ${loadavg[1]}`);
      metrics.push(`memtech_system_load_average_15m ${loadavg[2]}`);

      // Memoria
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;

      metrics.push(`# HELP memtech_system_memory_bytes Uso de memoria del sistema`);
      metrics.push(`# TYPE memtech_system_memory_bytes gauge`);
      metrics.push(`memtech_system_memory_total_bytes ${totalMem}`);
      metrics.push(`memtech_system_memory_used_bytes ${usedMem}`);
      metrics.push(`memtech_system_memory_free_bytes ${freeMem}`);

      // CPU
      const cpus = os.cpus();
      metrics.push(`# HELP memtech_system_cpu_cores Número de cores de CPU`);
      metrics.push(`# TYPE memtech_system_cpu_cores gauge`);
      metrics.push(`memtech_system_cpu_cores ${cpus.length}`);

      return metrics.join('\n');

    } catch (error) {
      logger.error('Error generando métricas Prometheus:', error);
      throw error;
    }
  }
}

// Función principal para CLI
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'health';

  const diagnostics = new AdvancedSystemDiagnostics({
    deep_scan_enabled: args.includes('--deep'),
    metrics_collection: args.includes('--metrics'),
    performance_analysis: args.includes('--performance')
  });

  try {
    switch (command) {
      case 'health':
        const healthResult = await diagnostics.diagnoseSystemHealth();
        console.log(JSON.stringify(healthResult, null, 2));
        break;

      case 'network':
        const networkResult = await diagnostics.diagnoseNetwork();
        console.log(JSON.stringify(networkResult, null, 2));
        break;

      case 'performance':
        const performanceResult = await diagnostics.diagnosePerformance();
        console.log(JSON.stringify(performanceResult, null, 2));
        break;

      case 'security':
        const securityResult = await diagnostics.diagnoseSecurity();
        console.log(JSON.stringify(securityResult, null, 2));
        break;

      case 'resources':
        const resourcesResult = await diagnostics.diagnoseResources();
        console.log(JSON.stringify(resourcesResult, null, 2));
        break;

      case 'full':
        const fullResult = await diagnostics.runFullDiagnostics();
        console.log(JSON.stringify(fullResult, null, 2));
        break;

      case 'ports':
        const targets = args.slice(1);
        const portResult = await diagnostics.scanPorts(targets.length > 0 ? targets : ['localhost']);
        console.log(JSON.stringify(portResult, null, 2));
        break;

      case 'metrics':
        const prometheusMetrics = await diagnostics.getPrometheusMetrics();
        console.log(prometheusMetrics);
        break;

      default:
        console.log('Uso: node system.mjs [command] [options]');
        console.log('Comandos disponibles:');
        console.log('  health      - Diagnóstico básico de salud');
        console.log('  network     - Diagnóstico de red');
        console.log('  performance - Análisis de rendimiento');
        console.log('  security    - Análisis de seguridad');
        console.log('  resources   - Información de recursos');
        console.log('  full        - Diagnóstico completo');
        console.log('  ports       - Escaneo de puertos');
        console.log('  metrics     - Métricas Prometheus');
        console.log('Opciones:');
        console.log('  --deep      - Análisis profundo');
        console.log('  --metrics   - Recopilar métricas');
        console.log('  --performance - Análisis de rendimiento detallado');
        break;
    }
  } catch (error) {
    console.error('Error ejecutando diagnóstico:', error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default AdvancedSystemDiagnostics;
