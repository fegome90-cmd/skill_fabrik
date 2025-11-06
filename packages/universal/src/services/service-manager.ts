/**
 * Universal Service Manager
 *
 * Gestiona los servicios de Skills Fabric (Daemon, Router, Discovery, Dashboard)
 * de forma aislada por proyecto, permitiendo múltiples instancias simultáneas.
 *
 * @version 1.0.0
 */

import { spawn, ChildProcess } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { createRequire } from 'module';
import { UniversalConfig } from '../config-manager.js';
import { PortAllocation } from '../port-manager.js';

const require = createRequire(import.meta.url);

export interface ServiceStatus {
  name: string;
  running: boolean;
  pid?: number;
  port?: number;
  uptime?: number;
  memory?: number;
  lastError?: string;
}

export interface ServiceHealth {
  name: string;
  healthy: boolean;
  responseTime?: number;
  lastCheck: string;
  endpoints: ServiceEndpoint[];
}

export interface ServiceEndpoint {
  path: string;
  method: string;
  healthy: boolean;
  responseTime?: number;
}

export class ServiceManager {
  private static readonly SERVICES_DIR = '.skills-fabrik/services';
  private static readonly LOGS_DIR = '.skills-fabrik/logs';
  private static readonly PID_DIR = '.skills-fabrik/pids';

  private static processes: Map<string, ChildProcess> = new Map();
  private static configs: Map<string, UniversalConfig> = new Map();

  /**
   * Inicia todos los servicios para un proyecto
   */
  static async startServices(
    projectPath: string,
    config: UniversalConfig
  ): Promise<void> {
    // Crear directorios necesarios
    this.ensureDirectories(projectPath);

    // Guardar configuración para referencia posterior
    this.configs.set(projectPath, config);

    console.log('🚀 Starting Skills Fabric services...');

    // Orden de inicio: Discovery → Daemon → Router → Dashboard
    const services = [
      { name: 'discovery', config: config.services.discovery, required: true },
      { name: 'daemon', config: config.services.daemon, required: true },
      { name: 'router', config: config.services.router, required: true },
      { name: 'dashboard', config: config.services.dashboard, required: false }
    ];

    for (const service of services) {
      if (service.config.enabled) {
        try {
          await this.startService(projectPath, service.name, config);
        } catch (error) {
          if (service.required) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to start required service ${service.name}: ${errorMessage}`);
          } else {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.warn(`⚠️  Optional service ${service.name} failed to start: ${errorMessage}`);
          }
        }
      }
    }

    // Verificar que todos los servicios estén saludables
    await this.verifyServicesHealth(projectPath, config);

    console.log('✅ All services started successfully');
  }

  /**
   * Detiene todos los servicios para un proyecto
   */
  static async stopServices(projectPath: string): Promise<void> {
    const services = ['discovery', 'daemon', 'router', 'dashboard'];

    console.log('🛑 Stopping Skills Fabric services...');

    // Detener en orden inverso
    for (const serviceName of services.reverse()) {
      try {
        await this.stopService(projectPath, serviceName);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.warn(`⚠️  Error stopping ${serviceName}: ${errorMessage}`);
      }
    }

    // Limpiar procesos locales
    this.processes.clear();
    this.configs.delete(projectPath);

    console.log('✅ All services stopped');
  }

  /**
   * Reinicia servicios específicos
   */
  static async restartService(
    projectPath: string,
    serviceName: string,
    config: UniversalConfig
  ): Promise<void> {
    await this.stopService(projectPath, serviceName);
    await this.startService(projectPath, serviceName, config);
  }

  /**
   * Obtiene el estado de todos los servicios
   */
  static async getServicesStatus(projectPath: string): Promise<ServiceStatus[]> {
    const services = ['discovery', 'daemon', 'router', 'dashboard'];
    const statuses: ServiceStatus[] = [];

    for (const serviceName of services) {
      const status = await this.getServiceStatus(projectPath, serviceName);
      statuses.push(status);
    }

    return statuses;
  }

  /**
   * Verifica la salud de los servicios
   */
  static async checkServicesHealth(
    projectPath: string,
    config: UniversalConfig
  ): Promise<ServiceHealth[]> {
    const services = ['discovery', 'daemon', 'router', 'dashboard'];
    const healthChecks: ServiceHealth[] = [];

    for (const serviceName of services) {
      const health = await this.checkServiceHealth(projectPath, serviceName, config);
      healthChecks.push(health);
    }

    return healthChecks;
  }

  /**
   * Obtiene logs de un servicio específico
   */
  static getServiceLogs(
    projectPath: string,
    serviceName: string,
    lines: number = 50
  ): string {
    const logFile = join(projectPath, this.LOGS_DIR, `${serviceName}.log`);

    if (!existsSync(logFile)) {
      return 'No logs available';
    }

    try {
      const content = readFileSync(logFile, 'utf-8');
      const logLines = content.split('\n');
      return logLines.slice(-lines).join('\n');
    } catch {
      return 'Error reading logs';
    }
  }

  // --- Métodos Privados ---

  /**
   * Inicia un servicio específico
   */
  private static async startService(
    projectPath: string,
    serviceName: string,
    config: UniversalConfig
  ): Promise<void> {
    const serviceConfig = config.services[serviceName as keyof typeof config.services];
    const port = config.ports[serviceName as keyof typeof config.ports];

    if (!serviceConfig.enabled) {
      console.log(`⏭️  Skipping ${serviceName} (disabled)`);
      return;
    }

    console.log(`🔄 Starting ${serviceName} on port ${port}...`);

    // Verificar que el puerto esté disponible
    const portAvailable = await this.isPortAvailable(port);
    if (!portAvailable) {
      throw new Error(`Port ${port} is already in use`);
    }

    // Construir comando para iniciar el servicio
    const serviceCommand = this.buildServiceCommand(serviceName, projectPath, config);

    // Crear proceso hijo
    const child = spawn(serviceCommand.command, serviceCommand.args, {
      cwd: projectPath,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        ...serviceCommand.env,
        SF_PROJECT_PATH: projectPath,
        SF_SERVICE_NAME: serviceName,
        SF_PORT: port.toString(),
        SF_LOG_LEVEL: process.env.LOG_LEVEL || 'INFO'
      }
    });

    // Configurar manejo de salida
    child.on('error', (error) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Failed to start ${serviceName}:`, errorMessage);
    });

    child.on('exit', (code, signal) => {
      if (code !== 0) {
        console.error(`❌ ${serviceName} exited with code ${code}`);
      } else {
        console.log(`✅ ${serviceName} stopped gracefully`);
      }
    });

    // Redirigir salida a logs
    const logFile = join(projectPath, this.LOGS_DIR, `${serviceName}.log`);
    const logStream = require('fs').createWriteStream(logFile, { flags: 'a' });

    child.stdout?.pipe(logStream);
    child.stderr?.pipe(logStream);

    // Guardar PID
    const pidFile = join(projectPath, this.PID_DIR, `${serviceName}.pid`);
    writeFileSync(pidFile, child.pid?.toString() || '');

    // Guardar referencia al proceso
    this.processes.set(`${projectPath}:${serviceName}`, child);

    // Esperar a que el servicio esté listo
    await this.waitForServiceReady(serviceName, port, 10000);

    console.log(`✅ ${serviceName} started successfully (PID: ${child.pid})`);
  }

  /**
   * Detiene un servicio específico
   */
  private static async stopService(projectPath: string, serviceName: string): Promise<void> {
    const pidFile = join(projectPath, this.PID_DIR, `${serviceName}.pid`);

    // Intentar detener proceso local
    const processKey = `${projectPath}:${serviceName}`;
    const child = this.processes.get(processKey);

    if (child) {
      child.kill('SIGTERM');

      // Esperar a que termine
      await new Promise<void>((resolve) => {
        child.on('exit', () => {
          this.processes.delete(processKey);
          resolve();
        });

        // Forzar después de 5 segundos
        setTimeout(() => {
          if (!child.killed) {
            child.kill('SIGKILL');
            this.processes.delete(processKey);
            resolve();
          }
        }, 5000);
      });
    }

    // Intentar detener usando PID guardado
    if (existsSync(pidFile)) {
      try {
        const pid = parseInt(readFileSync(pidFile, 'utf-8'));
        process.kill(pid, 'SIGTERM');

        // Esperar y verificar que el proceso terminó
        await new Promise((resolve) => setTimeout(resolve, 2000));

        try {
          process.kill(pid, 0); // Verificar si todavía existe
          // Si no hay error, el proceso sigue vivo, forzar
          process.kill(pid, 'SIGKILL');
        } catch {
          // Proceso ya no existe
        }

        // Eliminar archivo PID
        require('fs').unlinkSync(pidFile);
      } catch (error) {
        // Error al detener proceso, continuar
      }
    }

    console.log(`✅ ${serviceName} stopped`);
  }

  /**
   * Construye el comando para iniciar un servicio
   */
  private static buildServiceCommand(
    serviceName: string,
    projectPath: string,
    config: UniversalConfig
  ): { command: string; args: string[]; env: Record<string, string> } {
    // Ruta al ejecutable del servicio (en una implementación real)
    const servicePath = this.getServiceExecutablePath(serviceName);

    const baseCommand = {
      command: 'node',
      args: [servicePath],
      env: {
        SF_PROJECT_ID: config.projectId,
        SF_PROJECT_TYPE: config.projectInfo.type,
        SF_CONFIG_PATH: join(projectPath, '.skills-fabrik/config.json')
      }
    };

    // Configuración específica por servicio
    switch (serviceName) {
      case 'daemon':
        return {
          ...baseCommand,
          env: {
            ...baseCommand.env,
            SF_DAEMON_PORT: config.ports.daemon.toString(),
            SF_DATABASE_URL: process.env.DATABASE_URL || '',
            SF_REDIS_URL: process.env.REDIS_URL || ''
          }
        };

      case 'router':
        return {
          ...baseCommand,
          env: {
            ...baseCommand.env,
            SF_ROUTER_PORT: config.ports.router.toString(),
            SF_DAEMON_URL: `http://127.0.0.1:${config.ports.daemon}`,
            SF_DISCOVERY_URL: `http://127.0.0.1:${config.ports.discovery}`
          }
        };

      case 'discovery':
        return {
          ...baseCommand,
          env: {
            ...baseCommand.env,
            SF_DISCOVERY_PORT: config.ports.discovery.toString()
          }
        };

      case 'dashboard':
        return {
          ...baseCommand,
          env: {
            ...baseCommand.env,
            SF_DASHBOARD_PORT: config.ports.dashboard.toString(),
            SF_DASHBOARD_WS_PORT: config.ports.dashboardWs.toString(),
            SF_API_URL: `http://127.0.0.1:${config.ports.daemon}`
          }
        };

      default:
        return baseCommand;
    }
  }

  /**
   * Obtiene la ruta al ejecutable del servicio
   */
  private static getServiceExecutablePath(serviceName: string): string {
    // En una implementación real, esto apuntaría a los ejecutables reales
    // Por ahora, retornamos una ruta relativa
    return `./services/${serviceName}.js`;
  }

  /**
   * Espera a que un servicio esté listo para recibir peticiones
   */
  private static async waitForServiceReady(
    serviceName: string,
    port: number,
    timeout: number
  ): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        const response = await fetch(`http://127.0.0.1:${port}/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(1000)
        });

        if (response.ok) {
          return;
        }
      } catch {
        // Servicio no está listo aún
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    throw new Error(`Service ${serviceName} failed to start within ${timeout}ms`);
  }

  /**
   * Verifica la salud de todos los servicios después de iniciarlos
   */
  private static async verifyServicesHealth(
    projectPath: string,
    config: UniversalConfig
  ): Promise<void> {
    console.log('🔍 Verifying services health...');

    const healthChecks = await this.checkServicesHealth(projectPath, config);
    const unhealthyServices = healthChecks.filter(h => !h.healthy);

    if (unhealthyServices.length > 0) {
      throw new Error(
        `Unhealthy services: ${unhealthyServices.map(s => s.name).join(', ')}`
      );
    }

    console.log('✅ All services are healthy');
  }

  /**
   * Obtiene el estado de un servicio específico
   */
  private static async getServiceStatus(
    projectPath: string,
    serviceName: string
  ): Promise<ServiceStatus> {
    const pidFile = join(projectPath, this.PID_DIR, `${serviceName}.pid`);
    const status: ServiceStatus = {
      name: serviceName,
      running: false
    };

    // Verificar si existe el archivo PID
    if (existsSync(pidFile)) {
      try {
        const pid = parseInt(readFileSync(pidFile, 'utf-8'));

        // Verificar si el proceso está corriendo
        process.kill(pid, 0);

        status.running = true;
        status.pid = pid;

        // Obtener información de memoria y uptime
        try {
          const stats = require('pidusage').sync(pid);
          status.memory = stats.memory;
          status.uptime = stats.uptime;
        } catch {
          // No se pudo obtener estadísticas
        }

      } catch {
        // Proceso no está corriendo, limpiar archivo PID
        require('fs').unlinkSync(pidFile);
      }
    }

    return status;
  }

  /**
   * Verifica la salud de un servicio específico
   */
  private static async checkServiceHealth(
    projectPath: string,
    serviceName: string,
    config: UniversalConfig
  ): Promise<ServiceHealth> {
    const port = config.ports[serviceName as keyof typeof config.ports];
    const health: ServiceHealth = {
      name: serviceName,
      healthy: false,
      lastCheck: new Date().toISOString(),
      endpoints: []
    };

    try {
      const startTime = Date.now();
      const response = await fetch(`http://127.0.0.1:${port}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });

      health.responseTime = Date.now() - startTime;
      health.healthy = response.ok;

      if (response.ok) {
        const data = await response.json();
        health.endpoints = [
          {
            path: '/health',
            method: 'GET',
            healthy: true,
            responseTime: health.responseTime
          }
        ];
      }

    } catch (error) {
      health.healthy = false;
      health.endpoints = [
        {
          path: '/health',
          method: 'GET',
          healthy: false
        }
      ];
    }

    return health;
  }

  /**
   * Verifica si un puerto está disponible
   */
  private static isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const net = require('net');
      const server = net.createServer();

      server.on('error', () => resolve(false));
      server.listen(port, () => {
        server.once('close', () => resolve(true));
        server.close();
      });
    });
  }

  /**
   * Asegura que los directorios necesarios existan
   */
  private static ensureDirectories(projectPath: string): void {
    const dirs = [
      this.SERVICES_DIR,
      this.LOGS_DIR,
      this.PID_DIR
    ];

    for (const dir of dirs) {
      const fullPath = join(projectPath, dir);
      if (!existsSync(fullPath)) {
        mkdirSync(fullPath, { recursive: true });
      }
    }
  }
}

// Exportar funciones de conveniencia
export async function startProjectServices(
  projectPath: string,
  config: UniversalConfig
): Promise<void> {
  await ServiceManager.startServices(projectPath, config);
}

export async function stopProjectServices(projectPath: string): Promise<void> {
  await ServiceManager.stopServices(projectPath);
}

export async function getProjectServicesStatus(projectPath: string): Promise<ServiceStatus[]> {
  return await ServiceManager.getServicesStatus(projectPath);
}