/**
 * Universal Configuration Manager
 *
 * Maneja configuraciones adaptables por tipo de proyecto con templates
 * predefinidos y personalización por usuario.
 *
 * @version 1.0.0
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { ProjectInfo, ProjectType } from './project-detector.js';
import { PortAllocation } from './port-manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface UniversalConfig {
  version: string;
  projectId: string;
  projectInfo: ProjectInfo;
  ports: PortAllocation;
  skills: SkillsConfig;
  services: ServicesConfig;
  hooks: HooksConfig;
  qualityGates: QualityGatesConfig;
  features: FeaturesConfig;
  createdAt: string;
  updatedAt: string;
}

export interface SkillsConfig {
  enabled: boolean;
  autoIndex: boolean;
  customSkillsPath?: string;
  skillRules: SkillRule[];
  activationThreshold: number;
  maxSkillsPerRequest: number;
  fuzzyMatching: boolean;
  fuzzyThreshold: number;
  contextualBoost: boolean;
}

export interface SkillRule {
  id: string;
  keywords: string[];
  patterns: string[];
  filePatterns?: string[];
  priority: number;
  enabled: boolean;
  context?: string[];
}

export interface ServicesConfig {
  daemon: ServiceConfig;
  router: ServiceConfig;
  discovery: ServiceConfig;
  dashboard: ServiceConfig;
}

export interface ServiceConfig {
  enabled: boolean;
  port?: number;
  host: string;
  autoStart: boolean;
  restartOnFailure: boolean;
  healthCheckInterval: number;
  environment: Record<string, string>;
}

export interface HooksConfig {
  preInvoke: boolean;
  postInvoke: boolean;
  planDetection: boolean;
  ideIntegration: boolean;
  supportedIDEs: string[];
  customHooks: CustomHook[];
}

export interface CustomHook {
  name: string;
  script: string;
  enabled: boolean;
  trigger: 'pre-invoke' | 'post-invoke' | 'plan-detection';
}

export interface QualityGatesConfig {
  enabled: boolean;
  enforceOnSave: boolean;
  enforceOnCommit: boolean;
  gates: QualityGate[];
  scoreThreshold: number;
}

export interface QualityGate {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: 'P0' | 'P1' | 'P2';
  rule: string;
  action: 'block' | 'warn' | 'suggest';
}

export interface FeaturesConfig {
  dashboard: boolean;
  realtimeMetrics: boolean;
  kpiTracking: boolean;
  autoOptimization: boolean;
  experimentalFeatures: string[];
}

export class ConfigManager {
  private static readonly CONFIG_FILE = '.skills-fabrik/config.json';
  private static readonly TEMPLATES_DIR = join(__dirname, '../templates');

  /**
   * Crea configuración inicial para un proyecto
   */
  static async createInitialConfig(
    projectPath: string,
    projectInfo: ProjectInfo,
    ports: PortAllocation
  ): Promise<UniversalConfig> {
    const template = await this.loadProjectTemplate(projectInfo.type);
    const config = this.mergeTemplateWithProject(template, projectInfo, ports);

    // Guardar configuración
    this.saveConfig(projectPath, config);
    return config;
  }

  /**
   * Carga configuración existente o crea una nueva
   */
  static async loadOrCreateConfig(
    projectPath: string,
    projectInfo: ProjectInfo,
    ports: PortAllocation
  ): Promise<UniversalConfig> {
    const existing = this.loadConfig(projectPath);

    if (existing) {
      // Actualizar información del proyecto si cambió
      return this.updateProjectInfo(existing, projectInfo);
    }

    return await this.createInitialConfig(projectPath, projectInfo, ports);
  }

  /**
   * Carga configuración desde archivo
   */
  static loadConfig(projectPath: string): UniversalConfig | null {
    try {
      const configPath = join(projectPath, this.CONFIG_FILE);
      if (!existsSync(configPath)) {
        return null;
      }

      const content = readFileSync(configPath, 'utf-8');
      const config = JSON.parse(content);

      // Validar versión y compatibilidad
      this.validateConfig(config);
      return config;
    } catch (error) {
      console.warn(`Error loading config: ${error}`);
      return null;
    }
  }

  /**
   * Guarda configuración en archivo
   */
  static saveConfig(projectPath: string, config: UniversalConfig): void {
    const configDir = join(projectPath, '.skills-fabrik');
    const configPath = join(configDir, 'config.json');

    try {
      // Crear directorio si no existe
      if (!existsSync(configDir)) {
        mkdirSync(configDir, { recursive: true });
      }

      // Actualizar timestamp
      config.updatedAt = new Date().toISOString();

      writeFileSync(configPath, JSON.stringify(config, null, 2));
    } catch (error) {
      throw new Error(`Failed to save config: ${error}`);
    }
  }

  /**
   * Actualiza configuración específica
   */
  static updateConfig(projectPath: string, updates: Partial<UniversalConfig>): void {
    const config = this.loadConfig(projectPath);
    if (!config) {
      throw new Error('No existing config found');
    }

    const updatedConfig = { ...config, ...updates, updatedAt: new Date().toISOString() };
    this.saveConfig(projectPath, updatedConfig);
  }

  /**
   * Exporta configuración para diferentes entornos
   */
  static exportConfig(config: UniversalConfig, format: 'json' | 'env' | 'yaml' = 'json'): string {
    switch (format) {
      case 'env':
        return this.exportAsEnvironment(config);
      case 'yaml':
        return this.exportAsYaml(config);
      default:
        return JSON.stringify(config, null, 2);
    }
  }

  // --- Templates ---

  /**
   * Carga template para tipo de proyecto específico
   */
  private static async loadProjectTemplate(projectType: ProjectType): Promise<Partial<UniversalConfig>> {
    const templateFile = join(this.TEMPLATES_DIR, `${projectType}.json`);

    try {
      if (existsSync(templateFile)) {
        const content = readFileSync(templateFile, 'utf-8');
        return JSON.parse(content);
      }
    } catch (error) {
      console.warn(`Failed to load template for ${projectType}: ${error}`);
    }

    // Fallback a template genérico
    return this.getDefaultTemplate();
  }

  /**
   * Template por defecto para proyectos desconocidos
   */
  private static getDefaultTemplate(): Partial<UniversalConfig> {
    return {
      version: '1.0.0',
      skills: {
        enabled: true,
        autoIndex: true,
        skillRules: this.getDefaultSkillRules(),
        activationThreshold: 0.3,
        maxSkillsPerRequest: 5,
        fuzzyMatching: true,
        fuzzyThreshold: 0.7,
        contextualBoost: true
      },
      services: {
        daemon: {
          enabled: true,
          host: '127.0.0.1',
          autoStart: true,
          restartOnFailure: true,
          healthCheckInterval: 30000,
          environment: {}
        },
        router: {
          enabled: true,
          host: '127.0.0.1',
          autoStart: true,
          restartOnFailure: true,
          healthCheckInterval: 30000,
          environment: {}
        },
        discovery: {
          enabled: true,
          host: '127.0.0.1',
          autoStart: true,
          restartOnFailure: true,
          healthCheckInterval: 30000,
          environment: {}
        },
        dashboard: {
          enabled: true,
          host: '127.0.0.1',
          autoStart: false,
          restartOnFailure: true,
          healthCheckInterval: 30000,
          environment: {}
        }
      },
      hooks: {
        preInvoke: true,
        postInvoke: true,
        planDetection: true,
        ideIntegration: true,
        supportedIDEs: ['cursor', 'vscode'],
        customHooks: []
      },
      qualityGates: {
        enabled: true,
        enforceOnSave: false,
        enforceOnCommit: true,
        gates: this.getDefaultQualityGates(),
        scoreThreshold: 80
      },
      features: {
        dashboard: true,
        realtimeMetrics: true,
        kpiTracking: true,
        autoOptimization: false,
        experimentalFeatures: []
      }
    };
  }

  /**
   * Obtiene reglas de skills por defecto
   */
  private static getDefaultSkillRules(): SkillRule[] {
    return [
      {
        id: 'code-quality',
        keywords: ['refactor', 'optimize', 'clean', 'improve'],
        patterns: ['function', 'class', 'component'],
        priority: 1,
        enabled: true
      },
      {
        id: 'security',
        keywords: ['security', 'auth', 'password', 'token', 'encrypt'],
        patterns: ['user', 'auth', 'login', 'password'],
        priority: 0,
        enabled: true
      },
      {
        id: 'testing',
        keywords: ['test', 'spec', 'mock', 'coverage'],
        patterns: ['describe', 'it', 'test', 'expect'],
        priority: 2,
        enabled: true
      },
      {
        id: 'performance',
        keywords: ['performance', 'optimize', 'cache', 'async'],
        patterns: ['performance', 'optimization', 'cache'],
        priority: 1,
        enabled: true
      }
    ];
  }

  /**
   * Obtiene quality gates por defecto
   */
  private static getDefaultQualityGates(): QualityGate[] {
    return [
      {
        id: 'build-check',
        name: 'Build Integrity',
        description: 'Ensure project builds successfully',
        enabled: true,
        priority: 'P0',
        rule: 'build-success',
        action: 'block'
      },
      {
        id: 'lint-check',
        name: 'Code Linting',
        description: 'Run linter and check for errors',
        enabled: true,
        priority: 'P0',
        rule: 'lint-success',
        action: 'warn'
      },
      {
        id: 'test-check',
        name: 'Test Coverage',
        description: 'Run tests and check coverage',
        enabled: true,
        priority: 'P1',
        rule: 'test-success',
        action: 'warn'
      },
      {
        id: 'security-check',
        name: 'Security Scan',
        description: 'Check for security vulnerabilities',
        enabled: true,
        priority: 'P0',
        rule: 'security-scan',
        action: 'block'
      }
    ];
  }

  /**
   * Mezcla template con información del proyecto
   */
  private static mergeTemplateWithProject(
    template: Partial<UniversalConfig>,
    projectInfo: ProjectInfo,
    ports: PortAllocation
  ): UniversalConfig {
    const config: UniversalConfig = {
      version: '1.0.0',
      projectId: this.generateProjectId(projectInfo),
      projectInfo,
      ports,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      skills: template.skills || this.getDefaultTemplate().skills!,
      services: this.configureServices(template.services || this.getDefaultTemplate().services!, ports),
      hooks: template.hooks || this.getDefaultTemplate().hooks!,
      qualityGates: template.qualityGates || this.getDefaultTemplate().qualityGates!,
      features: template.features || this.getDefaultTemplate().features!
    };

    // Personalizar basado en tipo de proyecto
    this.customizeForProjectType(config, projectInfo);

    return config;
  }

  /**
   * Configura servicios con puertos asignados
   */
  private static configureServices(
    servicesTemplate: ServicesConfig,
    ports: PortAllocation
  ): ServicesConfig {
    return {
      daemon: { ...servicesTemplate.daemon, port: ports.daemon },
      router: { ...servicesTemplate.router, port: ports.router },
      discovery: { ...servicesTemplate.discovery, port: ports.discovery },
      dashboard: { ...servicesTemplate.dashboard, port: ports.dashboard }
    };
  }

  /**
   * Personaliza configuración basada en tipo de proyecto
   */
  private static customizeForProjectType(config: UniversalConfig, projectInfo: ProjectInfo): void {
    switch (projectInfo.type) {
      case 'react':
      case 'vue':
      case 'angular':
        // Proyectos frontend
        config.hooks.supportedIDEs.push('webstorm', 'phpstorm');
        config.features.experimentalFeatures.push('component-analysis');
        break;

      case 'nodejs':
      case 'python':
        // Proyectos backend
        config.services.daemon.environment = {
          ...config.services.daemon.environment,
          NODE_ENV: 'development'
        };
        config.features.experimentalFeatures.push('api-testing');
        break;

      case 'docker':
      case 'terraform':
        // Proyectos DevOps
        config.features.experimentalFeatures.push('infrastructure-analysis');
        config.qualityGates.gates.push({
          id: 'infra-check',
          name: 'Infrastructure Validation',
          description: 'Validate infrastructure configuration',
          enabled: true,
          priority: 'P1',
          rule: 'infra-validate',
          action: 'warn'
        });
        break;
    }

    // Personalizar basado en lenguaje
    if (projectInfo.hasTypeScript) {
      config.features.experimentalFeatures.push('typescript-analysis');
      config.qualityGates.gates.push({
        id: 'typescript-check',
        name: 'TypeScript Compilation',
        description: 'Ensure TypeScript compiles without errors',
        enabled: true,
        priority: 'P0',
        rule: 'tsc-success',
        action: 'block'
      });
    }
  }

  /**
   * Actualiza información del proyecto en configuración existente
   */
  private static updateProjectInfo(
    config: UniversalConfig,
    projectInfo: ProjectInfo
  ): UniversalConfig {
    return {
      ...config,
      projectInfo,
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Valida configuración
   */
  private static validateConfig(config: any): void {
    if (!config.version) {
      throw new Error('Invalid config: missing version');
    }

    if (!config.projectInfo) {
      throw new Error('Invalid config: missing projectInfo');
    }

    if (!config.ports) {
      throw new Error('Invalid config: missing ports');
    }
  }

  /**
   * Genera ID único para proyecto
   */
  private static generateProjectId(projectInfo: ProjectInfo): string {
    const base = `${projectInfo.type}-${projectInfo.language}-${projectInfo.framework || 'default'}`;
    return base.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now();
  }

  /**
   * Exporta configuración como variables de entorno
   */
  private static exportAsEnvironment(config: UniversalConfig): string {
    const env = [
      `SF_PROJECT_ID=${config.projectId}`,
      `SF_DAEMON_PORT=${config.ports.daemon}`,
      `SF_ROUTER_PORT=${config.ports.router}`,
      `SF_DISCOVERY_PORT=${config.ports.discovery}`,
      `SF_DASHBOARD_PORT=${config.ports.dashboard}`,
      `SF_SKILLS_ENABLED=${config.skills.enabled}`,
      `SF_HOOKS_ENABLED=${config.hooks.preInvoke || config.hooks.postInvoke}`,
      `SF_QUALITY_GATES_ENABLED=${config.qualityGates.enabled}`
    ];

    return env.join('\n');
  }

  /**
   * Exporta configuración como YAML
   */
  private static exportAsYaml(config: UniversalConfig): string {
    // Simplificado - en producción usar una librería YAML
    const yaml = Object.entries(config)
      .map(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          return `${key}: ${JSON.stringify(value)}`;
        }
        return `${key}: ${value}`;
      })
      .join('\n');

    return yaml;
  }
}

// Exportar funciones de conveniencia
export async function initializeProjectConfig(
  projectPath: string,
  projectInfo: ProjectInfo,
  ports: PortAllocation
): Promise<UniversalConfig> {
  return await ConfigManager.createInitialConfig(projectPath, projectInfo, ports);
}

export function loadProjectConfig(projectPath: string): UniversalConfig | null {
  return ConfigManager.loadConfig(projectPath);
}

export function saveProjectConfig(projectPath: string, config: UniversalConfig): void {
  ConfigManager.saveConfig(projectPath, config);
}