/**
 * Universal Installer - One-Click Installation Magic
 *
 * Instalador universal que permite la instalación de Skills Fabric
 * en cualquier proyecto con un solo comando.
 *
 * @version 1.0.0
 */

import { spawn, execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { createRequire } from 'module';
import { detectProject } from '../project-detector.js';
import { allocatePorts } from '../port-manager.js';
import { initializeProjectConfig } from '../config-manager.js';
import { ServiceManager } from '../services/service-manager.js';
import { HookManager } from '../hooks/hook-manager.js';

const require = createRequire(import.meta.url);

export interface InstallOptions {
  force?: boolean;
  skipServices?: boolean;
  minimal?: boolean;
  template?: string;
  verbose?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class UniversalInstaller {
  private static readonly MIN_NODE_VERSION = '18.0.0';
  private static readonly SUPPORTED_PLATFORMS = ['darwin', 'linux', 'win32'];

  /**
   * Instalación mágica universal one-click
   */
  static async installGlobal(options: InstallOptions = {}): Promise<void> {
    console.log('🚀 Skills Fabric Universal - One-Click Installation');
    console.log('');

    try {
      // 1. Validar entorno
      await this.validateEnvironment();

      // 2. Detectar proyecto actual
      const projectPath = process.cwd();
      console.log('🔍 Detecting project configuration...');
      const projectInfo = await detectProject(projectPath);

      if (projectInfo.relevanceScore < 30) {
        console.warn(`⚠️  Low relevance score (${projectInfo.relevanceScore}%) for project type: ${projectInfo.type}`);
        console.log('   Skills may not be as useful for this project type.');

        const { continueAnyway } = await this.promptContinue();
        if (!continueAnyway) {
          console.log('❌ Installation cancelled.');
          return;
        }
      }

      console.log(`✅ Project detected: ${projectInfo.type} (${projectInfo.language})`);

      // 3. Asignar puertos dinámicos
      console.log('🔌 Allocating dynamic ports...');
      const ports = await allocatePorts(projectPath);
      console.log(`✅ Ports allocated: ${Object.values(ports).join(', ')}`);

      // 4. Crear configuración inicial
      console.log('⚙️  Creating project configuration...');
      const config = await initializeProjectConfig(projectPath, projectInfo, ports);
      console.log('✅ Configuration created');

      // 5. Instalar hooks del IDE
      if (!options.minimal) {
        console.log('🔗 Setting up IDE hooks...');
        await HookManager.setupUniversalHooks(projectPath, config);
        console.log('✅ IDE hooks configured');
      }

      // 6. Iniciar servicios
      if (!options.skipServices && !options.minimal) {
        console.log('🏃 Starting services...');
        await ServiceManager.startServices(projectPath, config);
        console.log('✅ Services started');
      }

      // 7. Mostrar resumen y próximos pasos
      this.showInstallationSummary(config, options);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Installation failed:', errorMessage);
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
   * Instalación vía npm global
   */
  static async installNPMGlobal(): Promise<void> {
    console.log('📦 Installing Skills Fabric via npm global...');

    try {
      // Verificar si ya está instalado
      try {
        execSync('skills-fabrik --version', { stdio: 'ignore' });
        console.log('✅ Skills Fabric is already installed globally');
        return;
      } catch {
        // No está instalado, continuar
      }

      // Instalar paquete global
      console.log('📥 Downloading and installing...');
      execSync('npm install -g @skills-fabrik/universal', { stdio: 'inherit' });

      // Verificar instalación
      const version = execSync('skills-fabrik --version', { encoding: 'utf-8' }).trim();
      console.log(`✅ Skills Fabric ${version} installed successfully!`);

      // Mostrar comandos disponibles
      this.showGlobalCommands();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`npm global installation failed: ${errorMessage}`);
    }
  }

  /**
   * Instalación vía Homebrew (macOS)
   */
  static async installHomebrew(): Promise<void> {
    if (process.platform !== 'darwin') {
      throw new Error('Homebrew installation is only available on macOS');
    }

    console.log('🍺 Installing Skills Fabric via Homebrew...');

    try {
      // Verificar Homebrew
      try {
        execSync('brew --version', { stdio: 'ignore' });
      } catch {
        throw new Error('Homebrew is not installed. Please install Homebrew first.');
      }

      // Verificar si ya está instalado
      try {
        execSync('brew list skills-fabrik', { stdio: 'ignore' });
        console.log('✅ Skills Fabric is already installed via Homebrew');
        return;
      } catch {
        // No está instalado, continuar
      }

      // Instalar via Homebrew
      console.log('📥 Installing via Homebrew...');
      execSync('brew install skills-fabrik/tap/skills-fabrik', { stdio: 'inherit' });

      console.log('✅ Skills Fabric installed successfully via Homebrew!');
      this.showGlobalCommands();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Homebrew installation failed: ${errorMessage}`);
    }
  }

  /**
   * Instalación vía script curl (método universal)
   */
  static async installScript(): Promise<void> {
    console.log('📜 Installing Skills Fabric via script...');

    try {
      // Descargar y ejecutar script de instalación
      const scriptUrl = 'https://install.skills-fabrik.com';

      console.log('📥 Downloading installation script...');
      execSync(`curl -fsSL ${scriptUrl} | bash`, { stdio: 'inherit' });

      console.log('✅ Skills Fabric installed successfully!');
      this.showGlobalCommands();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Script installation failed: ${errorMessage}`);
    }
  }

  /**
   * Validación del entorno de instalación
   */
  static async validateEnvironment(): Promise<ValidationResult> {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };

    // Validar versión de Node.js
    try {
      const nodeVersion = execSync('node --version', { encoding: 'utf-8' }).trim();
      const versionNum = nodeVersion.replace('v', '');

      if (this.compareVersions(versionNum, this.MIN_NODE_VERSION) < 0) {
        result.errors.push(`Node.js ${this.MIN_NODE_VERSION} or higher is required (found: ${nodeVersion})`);
        result.valid = false;
      }
    } catch {
      result.errors.push('Node.js is not installed or not in PATH');
      result.valid = false;
    }

    // Validar plataforma
    if (!this.SUPPORTED_PLATFORMS.includes(process.platform)) {
      result.warnings.push(`Platform ${process.platform} is not officially supported`);
    }

    // Validar npm/yarn
    try {
      execSync('npm --version', { stdio: 'ignore' });
    } catch {
      result.errors.push('npm is not installed or not in PATH');
      result.valid = false;
    }

    // Validar permisos
    try {
      const testDir = join(process.cwd(), '.skills-fabrik-test');
      mkdirSync(testDir);
      require('fs').rmSync(testDir, { recursive: true });
    } catch {
      result.errors.push('Insufficient permissions to create directories');
      result.valid = false;
    }

    return result;
  }

  /**
   * Verificación post-instalación
   */
  static async verifyInstallation(projectPath: string): Promise<boolean> {
    try {
      // Verificar configuración
      const config = join(projectPath, '.skills-fabrik', 'config.json');
      if (!existsSync(config)) {
        return false;
      }

      // Verificar servicios
      const services = await ServiceManager.getServicesStatus(projectPath);
      const runningServices = services.filter(s => s.running);

      if (runningServices.length === 0) {
        console.warn('⚠️  No services are running');
        return false;
      }

      // Verificar health endpoints
      const configData = JSON.parse(readFileSync(config, 'utf-8'));
      const daemonHealthy = await this.checkHealth(configData.ports.daemon);
      const routerHealthy = await this.checkHealth(configData.ports.router);

      return daemonHealthy && routerHealthy;

    } catch {
      return false;
    }
  }

  // --- Métodos Privados ---

  /**
   * Compara versiones (semver simple)
   */
  private static compareVersions(a: string, b: string): number {
    const aParts = a.split('.').map(Number);
    const bParts = b.split('.').map(Number);

    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      const aPart = aParts[i] || 0;
      const bPart = bParts[i] || 0;

      if (aPart > bPart) return 1;
      if (aPart < bPart) return -1;
    }

    return 0;
  }

  /**
   * Prompt para continuar con instalación de baja relevancia
   */
  private static async promptContinue(): Promise<{ continueAnyway: boolean }> {
    // En una implementación real, usar inquirer
    // Por ahora, asumimos que el usuario quiere continuar
    return { continueAnyway: true };
  }

  /**
   * Verifica health endpoint
   */
  private static async checkHealth(port: number): Promise<boolean> {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Muestra resumen de instalación
   */
  private static showInstallationSummary(config: any, options: InstallOptions): void {
    console.log('');
    console.log('🎉 Skills Fabric Universal installed successfully!');
    console.log('');

    console.log('📊 Installation Summary:');
    console.log(`   Project ID: ${config.projectId}`);
    console.log(`   Project Type: ${config.projectInfo.type}`);
    console.log(`   Services: ${options.skipServices || options.minimal ? 'Disabled' : 'Enabled'}`);
    console.log(`   IDE Hooks: ${options.minimal ? 'Disabled' : 'Enabled'}`);
    console.log('');

    console.log('🚀 Quick Start Commands:');
    console.log('   skills-fabrik status          - Check system status');
    console.log('   skills-fabrik skills list    - View available skills');
    console.log('   skills-fabrik services start - Start services');
    console.log('   skills-fabrik config show    - View configuration');
    console.log('');

    if (config.features.dashboard && !options.skipServices && !options.minimal) {
      console.log(`🌐 Dashboard: http://localhost:${config.ports.dashboard}`);
      console.log('');
    }

    console.log('💡 Need help? Run: skills-fabrik --help');
    console.log('📚 Documentation: https://docs.skills-fabrik.com');
    console.log('');
  }

  /**
   * Muestra comandos globales disponibles
   */
  private static showGlobalCommands(): void {
    console.log('');
    console.log('🚀 Usage:');
    console.log('   skills-fabrik init            - Initialize in current project');
    console.log('   skills-fabrik status          - Show system status');
    console.log('   skills-fabrik --help         - Show all commands');
    console.log('');
    console.log('💡 Quick start in any project:');
    console.log('   cd your-project');
    console.log('   skills-fabrik init');
    console.log('   skills-fabrik status');
    console.log('');
  }
}

// Exportar funciones de conveniencia
export async function installUniversal(options: InstallOptions = {}): Promise<void> {
  await UniversalInstaller.installGlobal(options);
}

export async function installNPMGlobal(): Promise<void> {
  await UniversalInstaller.installNPMGlobal();
}

export async function installHomebrew(): Promise<void> {
  await UniversalInstaller.installHomebrew();
}

export async function installScript(): Promise<void> {
  await UniversalInstaller.installScript();
}