/**
 * Skills Fabric Universal - Main Entry Point
 *
 * Punto de entrada principal para el paquete universal.
 */

// Exportar clases principales
export { ProjectDetector, detectProject, type ProjectInfo, type ProjectType } from './project-detector.js';
export { PortManager, allocatePorts, releasePorts, type PortAllocation } from './port-manager.js';
export { ConfigManager, initializeProjectConfig, loadProjectConfig, type UniversalConfig } from './config-manager.js';
export { ServiceManager, startProjectServices, stopProjectServices } from './services/service-manager.js';
export { HookManager } from './hooks/hook-manager.js';
export { UniversalInstaller, installUniversal } from './installer/universal-installer.js';
export { SkillPackager, createPortableSkill, installSkill } from './skills/skill-packager.js';
export { CleanUninstaller, uninstallSkillsFabric } from './uninstaller/clean-uninstall.js';
export { UniversalTester, runCompatibilityTests } from './testing/universal-tester.js';

// Exportar CLI
export { default as cli } from './cli.js';

// Version del paquete
export const VERSION = '1.0.0';