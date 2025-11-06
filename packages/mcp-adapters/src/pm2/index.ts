/**
 * PM2 Adapter - MCP Local Adapter
 * 
 * Proporciona operaciones de PM2 para gestión de procesos,
 * ejecutándose localmente mediante comandos pm2.
 */

import { execSync } from 'child_process';
import { resolve } from 'path';

export interface PM2Adapter {
  start(configPath: string): Promise<PM2Result>;
  stop(nameOrId: string): Promise<PM2Result>;
  restart(nameOrId: string): Promise<PM2Result>;
  list(): Promise<PM2Process[]>;
  logs(nameOrId: string, lines?: number): Promise<string>;
  describe(nameOrId: string): Promise<PM2ProcessInfo>;
  delete(nameOrId: string): Promise<PM2Result>;
  monit(): Promise<void>; // Opens PM2 monit (interactive)
}

export interface PM2Result {
  success: boolean;
  message: string;
  error?: string;
}

export interface PM2Process {
  id: number;
  name: string;
  status: 'online' | 'stopped' | 'errored' | 'launching';
  cpu: number;
  memory: number;
  uptime: number;
  restarts: number;
}

export interface PM2ProcessInfo extends PM2Process {
  script: string;
  cwd: string;
  pid: number;
  pm2_env: Record<string, unknown>;
}

export class LocalPM2Adapter implements PM2Adapter {
  constructor(private basePath: string = process.cwd()) {}

  private execPM2(command: string): string {
    try {
      return execSync(`pm2 ${command}`, {
        cwd: this.basePath,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      }).trim();
    } catch (error) {
      throw new Error(`PM2 command failed: ${command} - ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async start(configPath: string): Promise<PM2Result> {
    try {
      const fullPath = resolve(this.basePath, configPath);
      const output = this.execPM2(`start ${fullPath}`);
      return {
        success: true,
        message: output,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to start PM2 processes',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async stop(nameOrId: string): Promise<PM2Result> {
    try {
      const output = this.execPM2(`stop ${nameOrId}`);
      return {
        success: true,
        message: output,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to stop ${nameOrId}`,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async restart(nameOrId: string): Promise<PM2Result> {
    try {
      const output = this.execPM2(`restart ${nameOrId}`);
      return {
        success: true,
        message: output,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to restart ${nameOrId}`,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async list(): Promise<PM2Process[]> {
    try {
      // PM2 jlist outputs JSON
      const output = this.execPM2('jlist');
      const processes = JSON.parse(output) as Array<{
        pm_id: number;
        name: string;
        pm2_env: {
          status: string;
          cpu?: number;
          memory?: number;
          uptime?: number;
          restart_time?: number;
        };
      }>;

      return processes.map(p => ({
        id: p.pm_id,
        name: p.name,
        status: p.pm2_env.status as PM2Process['status'],
        cpu: p.pm2_env.cpu || 0,
        memory: p.pm2_env.memory || 0,
        uptime: p.pm2_env.uptime || 0,
        restarts: p.pm2_env.restart_time || 0,
      }));
    } catch (error) {
      throw new Error(`Error listing PM2 processes: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async logs(nameOrId: string, lines: number = 100): Promise<string> {
    try {
      return this.execPM2(`logs ${nameOrId} --lines ${lines} --nostream`);
    } catch (error) {
      throw new Error(`Error getting PM2 logs: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async describe(nameOrId: string): Promise<PM2ProcessInfo> {
    try {
      const output = this.execPM2(`describe ${nameOrId}`);
      const jsonOutput = this.execPM2(`jlist ${nameOrId}`);
      const processData = JSON.parse(jsonOutput)[0] as {
        pm_id: number;
        name: string;
        pid: number;
        pm2_env: {
          status: string;
          pm_exec_path: string;
          pm_cwd: string;
          cpu?: number;
          memory?: number;
          uptime?: number;
          restart_time?: number;
          [key: string]: unknown;
        };
      };

      return {
        id: processData.pm_id,
        name: processData.name,
        status: processData.pm2_env.status as PM2Process['status'],
        cpu: processData.pm2_env.cpu || 0,
        memory: processData.pm2_env.memory || 0,
        uptime: processData.pm2_env.uptime || 0,
        restarts: processData.pm2_env.restart_time || 0,
        script: processData.pm2_env.pm_exec_path,
        cwd: processData.pm2_env.pm_cwd,
        pid: processData.pid,
        pm2_env: processData.pm2_env,
      };
    } catch (error) {
      throw new Error(`Error describing PM2 process: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async delete(nameOrId: string): Promise<PM2Result> {
    try {
      const output = this.execPM2(`delete ${nameOrId}`);
      return {
        success: true,
        message: output,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to delete ${nameOrId}`,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async monit(): Promise<void> {
    // PM2 monit is interactive, we just spawn it
    // The caller should handle this appropriately
    throw new Error('PM2 monit is interactive and cannot be called programmatically. Use pm2 monit in terminal.');
  }
}

// Export singleton instance
export const pm2Adapter = new LocalPM2Adapter();


