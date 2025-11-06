/**
 * Dynamic Port Manager
 *
 * Gestiona puertos dinámicamente para evitar conflictos cuando múltiples
 * instancias de Skills Fabric corren en diferentes proyectos.
 *
 * @version 1.0.0
 */

import { createServer } from 'net';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface PortAllocation {
  daemon: number;
  router: number;
  discovery: number;
  dashboard: number;
  dashboardWs: number;
}

export interface PortConfig {
  projectId: string;
  ports: PortAllocation;
  createdAt: string;
  lastAccessed: string;
}

export class PortManager {
  private static readonly DEFAULT_PORTS = {
    daemon: 7727,
    router: 3000,
    discovery: 8877,
    dashboard: 8888,
    dashboardWs: 8889
  };

  private static readonly PORT_RANGES = {
    daemon: { min: 7700, max: 7799 },
    router: { min: 3000, max: 3099 },
    discovery: { min: 8870, max: 8899 },
    dashboard: { min: 8880, max: 8899 },
    dashboardWs: { min: 8890, max: 8899 }
  };

  private static readonly CONFIG_FILE = '.skills-fabrik/ports.json';

  /**
   * Encuentra puertos disponibles para un proyecto específico
   */
  static async allocatePorts(projectPath: string): Promise<PortAllocation> {
    const projectId = this.generateProjectId(projectPath);
    const existingConfig = this.loadPortConfig(projectPath);

    // Si ya existe configuración y los puertos están disponibles, reutilizar
    if (existingConfig && existingConfig.projectId === projectId) {
      const portsAvailable = await this.checkPortsAvailable(existingConfig.ports);
      if (portsAvailable) {
        this.updateLastAccessed(projectPath);
        return existingConfig.ports;
      }
    }

    // Asignar nuevos puertos
    const ports = await this.findAvailablePorts();
    const config: PortConfig = {
      projectId,
      ports,
      createdAt: new Date().toISOString(),
      lastAccessed: new Date().toISOString()
    };

    this.savePortConfig(projectPath, config);
    return ports;
  }

  /**
   * Libera los puertos asignados a un proyecto
   */
  static async releasePorts(projectPath: string): Promise<void> {
    const configPath = join(projectPath, this.CONFIG_FILE);
    try {
      if (existsSync(configPath)) {
        const config = JSON.parse(readFileSync(configPath, 'utf-8'));

        // Opcional: verificar que los puertos estén en uso por este proyecto
        // y liberarlos si es necesario

        // Eliminar configuración
        const fs = await import('fs');
        fs.unlinkSync(configPath);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`Error releasing ports: ${errorMessage}`);
    }
  }

  /**
   * Verifica si los puertos están disponibles
   */
  static async checkPortsAvailable(ports: PortAllocation): Promise<boolean> {
    const checks = [
      this.isPortAvailable(ports.daemon),
      this.isPortAvailable(ports.router),
      this.isPortAvailable(ports.discovery),
      this.isPortAvailable(ports.dashboard),
      this.isPortAvailable(ports.dashboardWs)
    ];

    const results = await Promise.all(checks);
    return results.every(available => available);
  }

  /**
   * Obtiene los puertos actuales para un proyecto
   */
  static getPorts(projectPath: string): PortAllocation | null {
    const config = this.loadPortConfig(projectPath);
    return config ? config.ports : null;
  }

  /**
   * Actualiza el último acceso a los puertos
   */
  static updateLastAccessed(projectPath: string): void {
    const config = this.loadPortConfig(projectPath);
    if (config) {
      config.lastAccessed = new Date().toISOString();
      this.savePortConfig(projectPath, config);
    }
  }

  /**
   * Limpia configuraciones de puertos antiguas (no usadas en 30 días)
   */
  static async cleanupOldConfigs(projectPath: string): Promise<void> {
    const config = this.loadPortConfig(projectPath);
    if (config) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const lastAccessed = new Date(config.lastAccessed);
      if (lastAccessed < thirtyDaysAgo) {
        await this.releasePorts(projectPath);
      }
    }
  }

  // --- Métodos Privados ---

  /**
   * Genera un ID único para el proyecto basado en el path
   */
  private static generateProjectId(projectPath: string): string {
    // Usar hash simple del path para generar ID consistente
    let hash = 0;
    for (let i = 0; i < projectPath.length; i++) {
      const char = projectPath.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir a 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Encuentra puertos disponibles en los rangos especificados
   */
  private static async findAvailablePorts(): Promise<PortAllocation> {
    const ports: PortAllocation = {} as any;

    // Buscar puerto para daemon
    ports.daemon = await this.findAvailablePortInRange(
      this.PORT_RANGES.daemon.min,
      this.PORT_RANGES.daemon.max,
      this.DEFAULT_PORTS.daemon
    );

    // Buscar puerto para router
    ports.router = await this.findAvailablePortInRange(
      this.PORT_RANGES.router.min,
      this.PORT_RANGES.router.max,
      this.DEFAULT_PORTS.router
    );

    // Buscar puerto para discovery
    ports.discovery = await this.findAvailablePortInRange(
      this.PORT_RANGES.discovery.min,
      this.PORT_RANGES.discovery.max,
      this.DEFAULT_PORTS.discovery
    );

    // Buscar puertos para dashboard (HTTP y WebSocket)
    ports.dashboard = await this.findAvailablePortInRange(
      this.PORT_RANGES.dashboard.min,
      this.PORT_RANGES.dashboard.max,
      this.DEFAULT_PORTS.dashboard
    );

    // Asegurar que WebSocket sea diferente al HTTP pero en el mismo rango
    ports.dashboardWs = await this.findAvailablePortInRange(
      Math.max(ports.dashboard + 1, this.PORT_RANGES.dashboardWs.min),
      this.PORT_RANGES.dashboardWs.max,
      this.DEFAULT_PORTS.dashboardWs
    );

    return ports;
  }

  /**
   * Encuentra un puerto disponible en un rango específico
   */
  private static async findAvailablePortInRange(
    min: number,
    max: number,
    preferred: number
  ): Promise<number> {
    // Primero intentar con el puerto preferido
    if (preferred >= min && preferred <= max && await this.isPortAvailable(preferred)) {
      return preferred;
    }

    // Si no está disponible, buscar en el rango
    for (let port = min; port <= max; port++) {
      if (await this.isPortAvailable(port)) {
        return port;
      }
    }

    throw new Error(`No available ports found in range ${min}-${max}`);
  }

  /**
   * Verifica si un puerto específico está disponible
   */
  private static isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = createServer();

      server.on('error', () => {
        resolve(false);
      });

      server.listen(port, () => {
        server.once('close', () => {
          resolve(true);
        });
        server.close();
      });
    });
  }

  /**
   * Carga la configuración de puertos desde el archivo
   */
  private static loadPortConfig(projectPath: string): PortConfig | null {
    try {
      const configPath = join(projectPath, this.CONFIG_FILE);
      if (!existsSync(configPath)) {
        return null;
      }

      const content = readFileSync(configPath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  /**
   * Guarda la configuración de puertos en el archivo
   */
  private static savePortConfig(projectPath: string, config: PortConfig): void {
    const configDir = join(projectPath, '.skills-fabrik');
    const configPath = join(configDir, 'ports.json');

    try {
      // Crear directorio si no existe
      if (!existsSync(configDir)) {
        mkdirSync(configDir, { recursive: true });
      }

      writeFileSync(configPath, JSON.stringify(config, null, 2));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to save port config: ${errorMessage}`);
    }
  }

  /**
   * Verifica si hay colisiones de puertos con otros procesos
   */
  static async detectPortConflicts(ports: PortAllocation): Promise<string[]> {
    const conflicts: string[] = [];

    const portNames = {
      daemon: ports.daemon,
      router: ports.router,
      discovery: ports.discovery,
      dashboard: ports.dashboard,
      dashboardWs: ports.dashboardWs
    };

    for (const [name, port] of Object.entries(portNames)) {
      if (!(await this.isPortAvailable(port))) {
        conflicts.push(`${name} (port ${port})`);
      }
    }

    return conflicts;
  }

  /**
   * Obtiene información sobre los puertos en uso
   */
  static async getPortInfo(ports: PortAllocation): Promise<Record<string, any>> {
    const info: Record<string, any> = {};

    for (const [name, port] of Object.entries(ports)) {
      info[name] = {
        port,
        available: await this.isPortAvailable(port),
        range: this.PORT_RANGES[name as keyof typeof this.PORT_RANGES] || null
      };
    }

    return info;
  }

  /**
   * Exporta configuración de puertos para variables de entorno
   */
  static exportEnvironmentVars(ports: PortAllocation): Record<string, string> {
    return {
      SF_DAEMON_PORT: ports.daemon.toString(),
      SF_ROUTER_PORT: ports.router.toString(),
      SF_DISCOVERY_PORT: ports.discovery.toString(),
      SF_DASHBOARD_PORT: ports.dashboard.toString(),
      SF_DASHBOARD_WS_PORT: ports.dashboardWs.toString()
    };
  }
}

// Exportar funciones de conveniencia
export async function allocateProjectPorts(projectPath?: string): Promise<PortAllocation> {
  return await PortManager.allocatePorts(projectPath || process.cwd());
}

export async function releaseProjectPorts(projectPath?: string): Promise<void> {
  await PortManager.releasePorts(projectPath || process.cwd());
}

export function getProjectPorts(projectPath?: string): PortAllocation | null {
  return PortManager.getPorts(projectPath || process.cwd());
}

// Exportaciones de conveniencia para compatibilidad
export const allocatePorts = allocateProjectPorts;
export const releasePorts = releaseProjectPorts;