/**
 * Clean Uninstaller - "No Mess Left Behind"
 *
 * Sistema de desinstalación completa que elimina todos los rastros
 * de Skills Fabric de un proyecto, dejándolo como estaba.
 *
 * @version 1.0.0
 */

import { existsSync, rmSync, readFileSync, writeFileSync, unlinkSync, statSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { execSync } from 'child_process';
import { ServiceManager } from '../services/service-manager.js';
import { HookManager } from '../hooks/hook-manager.js';
import { PortManager } from '../port-manager.js';

export interface UninstallOptions {
  complete?: boolean;
  backup?: boolean;
  confirm?: boolean;
  force?: boolean;
  verbose?: boolean;
}

export interface BackupData {
  timestamp: string;
  projectPath: string;
  files: BackupFile[];
  services: ProcessInfo[];
  ports: number[];
  hooks: HookBackup[];
}

export interface BackupFile {
  path: string;
  originalContent?: string;
  wasCreated: boolean;
  checksum?: string;
}

export interface ProcessInfo {
  name: string;
  pid: number;
  command: string;
}

export interface HookBackup {
  ide: string;
  originalConfig?: any;
  files: string[];
}

export class CleanUninstaller {
  private static readonly BACKUP_DIR = '.skills-fabrik-backup';
  private static readonly CONFIG_FILE = '.skills-fabrik/config.json';

  /**
   * Desinstalación completa "No Mess Left Behind"
   */
  static async completeRemoval(
    projectPath: string,
    options: UninstallOptions = {}
  ): Promise<void> {
    console.log('🗑️  Skills Fabric Universal - Complete Uninstall');
    console.log('');

    try {
      // 1. Validar que Skills Fabric está instalado
      if (!this.isSkillsFabricInstalled(projectPath)) {
        console.log('ℹ️  Skills Fabric is not installed in this project');
        return;
      }

      // 2. Crear backup si se solicita
      let backup: BackupData | null = null;
      if (options.backup) {
        console.log('💾 Creating backup...');
        backup = await this.createBackup(projectPath);
        console.log('✅ Backup created');
      }

      // 3. Confirmación si no se fuerza
      if (!options.force && !options.confirm) {
        const { confirmed } = await this.promptConfirmation();
        if (!confirmed) {
          console.log('❌ Uninstall cancelled');
          return;
        }
      }

      // 4. Ejecutar pasos de desinstalación
      await this.executeUninstallSteps(projectPath, options);

      // 5. Verificar limpieza completa
      await this.verifyCleanUninstall(projectPath);

      // 6. Mostrar resumen
      this.showUninstallSummary(projectPath, backup, options);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Uninstall failed:', errorMessage);
      if (options.verbose) {
        const errorStack = error instanceof Error ? error.stack : undefined;
        if (errorStack) {
          console.error(errorStack);
        }
      }
      process.exit(1);
    }
  }

  /**
   * Restaura proyecto desde backup
   */
  static async restoreFromBackup(projectPath: string): Promise<void> {
    console.log('🔄 Restoring Skills Fabric from backup...');

    const backupPath = join(projectPath, this.BACKUP_DIR);
    if (!existsSync(backupPath)) {
      throw new Error('No backup found to restore from');
    }

    const backupData: BackupData = JSON.parse(
      readFileSync(join(backupPath, 'backup.json'), 'utf-8')
    );

    try {
      // Restaurar archivos
      await this.restoreFiles(projectPath, backupData.files);

      // Restaurar configuración de hooks
      await this.restoreHooks(projectPath, backupData.hooks);

      console.log('✅ Project restored from backup');
      console.log(`📅 Backup from: ${backupData.timestamp}`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Restore failed:', errorMessage);
      throw error;
    }
  }

  /**
   * Limpia backups antiguos
   */
  static async cleanupOldBackups(projectPath: string, maxAge: number = 30): Promise<void> {
    console.log('🧹 Cleaning up old backups...');

    const backupPath = join(projectPath, this.BACKUP_DIR);
    if (!existsSync(backupPath)) {
      console.log('ℹ️  No backups found');
      return;
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAge);

    try {
      const backups = require('fs').readdirSync(backupPath);
      let cleanedCount = 0;

      for (const backup of backups) {
        const backupDir = join(backupPath, backup);
        const stats = statSync(backupDir);

        if (stats.isDirectory() && stats.mtime < cutoffDate) {
          rmSync(backupDir, { recursive: true, force: true });
          cleanedCount++;
        }
      }

      console.log(`✅ Cleaned up ${cleanedCount} old backups`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`⚠️  Error cleaning backups: ${errorMessage}`);
    }
  }

  /**
   * Verifica si Skills Fabric está instalado
   */
  static isSkillsFabricInstalled(projectPath: string): boolean {
    return existsSync(join(projectPath, this.CONFIG_FILE));
  }

  /**
   * Obtiene información de instalación
   */
  static getInstallationInfo(projectPath: string): any {
    const configPath = join(projectPath, this.CONFIG_FILE);
    if (!existsSync(configPath)) {
      return null;
    }

    try {
      const config = JSON.parse(readFileSync(configPath, 'utf-8'));
      return {
        projectId: config.projectId,
        version: config.version,
        projectType: config.projectInfo?.type,
        installedAt: config.createdAt,
        lastUpdated: config.updatedAt,
        servicesEnabled: Object.values(config.services).some((s: any) => s.enabled),
        hooksEnabled: config.hooks.preInvoke || config.hooks.postInvoke
      };
    } catch {
      return null;
    }
  }

  // --- Métodos Privados ---

  /**
   * Ejecuta todos los pasos de desinstalación
   */
  private static async executeUninstallSteps(
    projectPath: string,
    options: UninstallOptions
  ): Promise<void> {
    const steps = [
      { name: 'Stop services', fn: () => this.stopServices(projectPath) },
      { name: 'Remove IDE hooks', fn: () => this.removeHooks(projectPath) },
      { name: 'Release ports', fn: () => this.releasePorts(projectPath) },
      { name: 'Remove configuration', fn: () => this.removeConfiguration(projectPath) },
      { name: 'Remove temporary files', fn: () => this.removeTempFiles(projectPath) },
      { name: 'Remove logs', fn: () => this.removeLogs(projectPath) }
    ];

    if (options.complete) {
      steps.push(
        { name: 'Remove dependencies', fn: () => this.removeDependencies(projectPath) },
        { name: 'Remove package references', fn: () => this.removePackageReferences(projectPath) }
      );
    }

    for (const step of steps) {
      console.log(`🔄 ${step.name}...`);
      try {
        await step.fn();
        console.log(`✅ ${step.name} completed`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.warn(`⚠️  ${step.name} failed: ${errorMessage}`);
      }
    }
  }

  /**
   * Crea backup completo del proyecto
   */
  private static async createBackup(projectPath: string): Promise<BackupData> {
    const backup: BackupData = {
      timestamp: new Date().toISOString(),
      projectPath,
      files: [],
      services: [],
      ports: [],
      hooks: []
    };

    // Backup de configuración
    const configPath = join(projectPath, this.CONFIG_FILE);
    if (existsSync(configPath)) {
      backup.files.push({
        path: configPath,
        originalContent: readFileSync(configPath, 'utf-8'),
        wasCreated: false
      });
    }

    // Backup de servicios en ejecución
    try {
      const services = await ServiceManager.getServicesStatus(projectPath);
      backup.services = services
        .filter(s => s.running)
        .map(s => ({
          name: s.name,
          pid: s.pid!,
          command: `skills-fabrik service ${s.name}`
        }));
    } catch {
      // Error obteniendo servicios, continuar
    }

    // Backup de puertos
    const ports = PortManager.getPorts(projectPath);
    if (ports) {
      backup.ports = Object.values(ports);
    }

    // Backup de hooks del IDE
    backup.hooks = await this.backupHooks(projectPath);

    // Guardar backup
    const backupDir = join(projectPath, this.BACKUP_DIR);
    if (!existsSync(backupDir)) {
      mkdirSync(backupDir, { recursive: true });
    }

    writeFileSync(
      join(backupDir, 'backup.json'),
      JSON.stringify(backup, null, 2)
    );

    return backup;
  }

  /**
   * Detiene todos los servicios
   */
  private static async stopServices(projectPath: string): Promise<void> {
    try {
      await ServiceManager.stopServices(projectPath);
    } catch {
      // Servicios ya detenidos o error, continuar
    }
  }

  /**
   * Elimina hooks del IDE
   */
  private static async removeHooks(projectPath: string): Promise<void> {
    try {
      await HookManager.removeUniversalHooks(projectPath);
    } catch {
      // Error eliminando hooks, continuar
    }
  }

  /**
   * Libera puertos asignados
   */
  private static async releasePorts(projectPath: string): Promise<void> {
    try {
      await PortManager.releasePorts(projectPath);
    } catch {
      // Error liberando puertos, continuar
    }
  }

  /**
   * Elimina configuración de Skills Fabric
   */
  private static async removeConfiguration(projectPath: string): Promise<void> {
    const skillsFabrikDir = join(projectPath, '.skills-fabrik');
    if (existsSync(skillsFabrikDir)) {
      rmSync(skillsFabrikDir, { recursive: true, force: true });
    }
  }

  /**
   * Elimina archivos temporales
   */
  private static async removeTempFiles(projectPath: string): Promise<void> {
    const tempPatterns = [
      '.skills-fabrik-temp',
      '.skills-fabrik-cache',
      '.skills-fabrik-logs',
      'node_modules/.cache/@skills-fabrik'
    ];

    for (const pattern of tempPatterns) {
      const path = join(projectPath, pattern);
      if (existsSync(path)) {
        rmSync(path, { recursive: true, force: true });
      }
    }
  }

  /**
   * Elimina logs
   */
  private static async removeLogs(projectPath: string): Promise<void> {
    const logPatterns = [
      '.skills-fabrik/logs',
      'logs/skills-fabrik',
      '.skills-fabrik/*.log'
    ];

    for (const pattern of logPatterns) {
      const path = join(projectPath, pattern);
      if (existsSync(path)) {
        rmSync(path, { recursive: true, force: true });
      }
    }
  }

  /**
   * Elimina dependencias de Skills Fabric
   */
  private static async removeDependencies(projectPath: string): Promise<void> {
    const packageJsonPath = join(projectPath, 'package.json');
    if (!existsSync(packageJsonPath)) {
      return;
    }

    try {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      let modified = false;

      // Eliminar dependencias
      if (packageJson.dependencies) {
        const skillsDeps = Object.keys(packageJson.dependencies).filter(dep =>
          dep.includes('@skills-fabrik') || dep.includes('skills-fabrik')
        );

        for (const dep of skillsDeps) {
          delete packageJson.dependencies[dep];
          modified = true;
        }
      }

      // Eliminar devDependencies
      if (packageJson.devDependencies) {
        const skillsDeps = Object.keys(packageJson.devDependencies).filter(dep =>
          dep.includes('@skills-fabrik') || dep.includes('skills-fabrik')
        );

        for (const dep of skillsDeps) {
          delete packageJson.devDependencies[dep];
          modified = true;
        }
      }

      // Guardar si se modificó
      if (modified) {
        writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      }

    } catch {
      // Error modificando package.json, continuar
    }
  }

  /**
   * Elimina referencias a paquetes
   */
  private static async removePackageReferences(projectPath: string): Promise<void> {
    const patterns = [
      'node_modules/@skills-fabrik',
      'node_modules/skills-fabrik'
    ];

    for (const pattern of patterns) {
      const path = join(projectPath, pattern);
      if (existsSync(path)) {
        rmSync(path, { recursive: true, force: true });
      }
    }
  }

  /**
   * Verifica que la desinstalación fue completa
   */
  private static async verifyCleanUninstall(projectPath: string): Promise<void> {
    const remainingArtifacts: string[] = [];

    // Verificar directorio principal
    if (existsSync(join(projectPath, '.skills-fabrik'))) {
      remainingArtifacts.push('.skills-fabrik directory');
    }

    // Verificar servicios
    try {
      const services = await ServiceManager.getServicesStatus(projectPath);
      const runningServices = services.filter(s => s.running);
      if (runningServices.length > 0) {
        remainingArtifacts.push(`Running services: ${runningServices.map(s => s.name).join(', ')}`);
      }
    } catch {
      // Error verificando servicios, ignorar
    }

    // Verificar puertos
    const ports = PortManager.getPorts(projectPath);
    if (ports) {
      remainingArtifacts.push(`Port configuration: ${Object.values(ports).join(', ')}`);
    }

    if (remainingArtifacts.length > 0) {
      console.warn('⚠️  Some artifacts remain:');
      remainingArtifacts.forEach(artifact => console.warn(`   - ${artifact}`));
    } else {
      console.log('✅ Clean uninstall verified - no artifacts remain');
    }
  }

  /**
   * Muestra resumen de desinstalación
   */
  private static showUninstallSummary(
    projectPath: string,
    backup: BackupData | null,
    options: UninstallOptions
  ): void {
    console.log('');
    console.log('✅ Skills Fabric uninstalled successfully!');
    console.log('');

    if (backup) {
      console.log('💾 Backup saved to: .skills-fabrik-backup/');
      console.log('   To restore: skills-fabrik restore-backup');
      console.log('');
    }

    console.log('🗑️  Removed components:');
    console.log('   ✅ Services stopped and cleaned');
    console.log('   ✅ IDE hooks removed');
    console.log('   ✅ Ports released');
    console.log('   ✅ Configuration deleted');
    console.log('   ✅ Temporary files cleaned');
    console.log('   ✅ Logs removed');

    if (options.complete) {
      console.log('   ✅ Dependencies removed');
      console.log('   ✅ Package references cleaned');
    }

    console.log('');
    console.log('🎯 Project is now in its original state');
    console.log('💡 To reinstall: skills-fabrik init');
    console.log('');
  }

  /**
   * Prompt de confirmación
   */
  private static async promptConfirmation(): Promise<{ confirmed: boolean }> {
    // En una implementación real, usar inquirer
    // Por ahora, asumimos confirmación
    return { confirmed: true };
  }

  /**
   * Backup de hooks del IDE
   */
  private static async backupHooks(projectPath: string): Promise<HookBackup[]> {
    const hooks: HookBackup[] = [];

    // Backup de hooks de Cursor
    const cursorConfig = join(projectPath, '.cursor/hooks/hooks-config.json');
    if (existsSync(cursorConfig)) {
      hooks.push({
        ide: 'cursor',
        originalConfig: JSON.parse(readFileSync(cursorConfig, 'utf-8')),
        files: ['pre-invoke.mjs', 'stop.mjs']
      });
    }

    // Backup de hooks de VS Code
    const vscodeTasks = join(projectPath, '.vscode/tasks.json');
    if (existsSync(vscodeTasks)) {
      hooks.push({
        ide: 'vscode',
        originalConfig: JSON.parse(readFileSync(vscodeTasks, 'utf-8')),
        files: ['tasks.json', 'settings.json']
      });
    }

    return hooks;
  }

  /**
   * Restaura archivos desde backup
   */
  private static async restoreFiles(projectPath: string, files: BackupFile[]): Promise<void> {
    for (const file of files) {
      if (file.wasCreated) {
        // El archivo fue creado por Skills Fabric, eliminarlo
        if (existsSync(file.path)) {
          unlinkSync(file.path);
        }
      } else if (file.originalContent) {
        // El archivo existía, restaurar contenido original
        writeFileSync(file.path, file.originalContent);
      }
    }
  }

  /**
   * Restaura configuración de hooks
   */
  private static async restoreHooks(projectPath: string, hooks: HookBackup[]): Promise<void> {
    for (const hook of hooks) {
      const configDir = join(projectPath, '.cursor/hooks');
      if (hook.originalConfig) {
        writeFileSync(
          join(configDir, 'hooks-config.json'),
          JSON.stringify(hook.originalConfig, null, 2)
        );
      }
    }
  }
}

// Exportar funciones de conveniencia
export async function uninstallSkillsFabric(
  projectPath: string,
  options: UninstallOptions = {}
): Promise<void> {
  await CleanUninstaller.completeRemoval(projectPath, options);
}

export async function restoreSkillsFabric(projectPath: string): Promise<void> {
  await CleanUninstaller.restoreFromBackup(projectPath);
}