/**
 * Init Command
 *
 * Comando de inicialización para Skills Fabric Universal.
 * Detecta automáticamente el tipo de proyecto y configura todo el sistema.
 *
 * @version 1.0.0
 */

import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, relative } from 'path';
import { detectProject, ProjectInfo, ProjectType } from '../project-detector.js';
import { allocatePorts, PortAllocation } from '../port-manager.js';
import { initializeProjectConfig, UniversalConfig } from '../config-manager.js';
import { ServiceManager } from '../services/service-manager.js';
import { HookManager } from '../hooks/hook-manager.js';

export interface InitOptions {
  template?: string;
  force?: boolean;
  skipServices?: boolean;
  minimal?: boolean;
}

/**
 * Comando principal de inicialización
 */
export async function initCommand(options: InitOptions): Promise<void> {
  console.log(chalk.cyan.bold('🚀 Skills Fabric Universal - Project Initialization'));
  console.log('');

  const projectPath = process.cwd();
  const projectName = relative(projectPath, projectPath) || 'current-project';

  try {
    // 1. Verificar si ya está configurado
    if (!options.force && isAlreadyConfigured(projectPath)) {
      console.log(chalk.yellow('⚠️  Skills Fabric is already configured in this project.'));

      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: 'Do you want to overwrite the existing configuration?',
          default: false
        }
      ]);

      if (!overwrite) {
        console.log(chalk.gray('❌ Initialization cancelled.'));
        return;
      }
    }

    // 2. Detectar tipo de proyecto
    const spinner = ora('🔍 Analyzing project...').start();
    let projectInfo: ProjectInfo;

    try {
      projectInfo = await detectProject(projectPath);
      spinner.succeed(`Project detected: ${chalk.bold(projectInfo.type)} (${projectInfo.language})`);
    } catch (error) {
      spinner.fail('Failed to analyze project');
      throw error;
    }

    // 3. Mostrar información del proyecto
    console.log('');
    console.log(chalk.blue('📋 Project Information:'));
    console.log(`   Type: ${chalk.bold(projectInfo.type)}`);
    console.log(`   Language: ${chalk.bold(projectInfo.language)}`);
    console.log(`   Framework: ${chalk.bold(projectInfo.framework || 'None')}`);
    console.log(`   Package Manager: ${chalk.bold(projectInfo.packageManager)}`);
    console.log(`   TypeScript: ${chalk.bold(projectInfo.hasTypeScript ? 'Yes' : 'No')}`);
    console.log(`   Relevance Score: ${chalk.bold(projectInfo.relevanceScore + '%')}`);
    console.log('');

    // 4. Asignar puertos dinámicos
    const portSpinner = ora('🔌 Allocating ports...').start();
    let ports: PortAllocation;

    try {
      ports = await allocatePorts(projectPath);
      portSpinner.succeed(`Ports allocated: ${Object.values(ports).join(', ')}`);
    } catch (error) {
      portSpinner.fail('Failed to allocate ports');
      throw error;
    }

    // 5. Configurar opciones personalizadas si no se especificó template
    let finalProjectInfo = projectInfo;
    if (!options.template) {
      const { shouldCustomize } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'shouldCustomize',
          message: 'Do you want to customize the configuration?',
          default: false
        }
      ]);

      if (shouldCustomize) {
        finalProjectInfo = await customizeProjectInfo(projectInfo);
      }
    } else {
      // Aplicar template específico si se proporcionó
      finalProjectInfo = applyTemplate(projectInfo, options.template);
    }

    // 6. Crear configuración inicial
    const configSpinner = ora('⚙️  Creating configuration...').start();
    let config: UniversalConfig;

    try {
      config = await initializeProjectConfig(projectPath, finalProjectInfo, ports);
      configSpinner.succeed('Configuration created successfully');
    } catch (error) {
      configSpinner.fail('Failed to create configuration');
      throw error;
    }

    // 7. Instalar hooks del IDE
    if (!options.minimal) {
      const hookSpinner = ora('🔗 Setting up IDE hooks...').start();
      try {
        await HookManager.setupUniversalHooks(projectPath, config);
        hookSpinner.succeed('IDE hooks configured');
      } catch (error) {
        hookSpinner.warn('IDE hooks setup failed (optional)');
      }
    }

    // 8. Iniciar servicios si no se especificó lo contrario
    if (!options.skipServices && !options.minimal) {
      const serviceSpinner = ora('🏃 Starting services...').start();
      try {
        await ServiceManager.startServices(projectPath, config);
        serviceSpinner.succeed('All services started');
      } catch (error) {
        serviceSpinner.warn('Service startup failed (you can start them manually)');
      }
    }

    // 9. Mostrar resumen final
    showInitializationSummary(config, options);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(chalk.red('❌ Initialization failed:'), errorMessage);
    if (process.env.LOG_LEVEL === 'DEBUG') {
      const errorStack = error instanceof Error ? error.stack : undefined;
      if (errorStack) {
        console.error(chalk.gray(errorStack));
      }
    }
    process.exit(1);
  }
}

/**
 * Verifica si el proyecto ya está configurado
 */
function isAlreadyConfigured(projectPath: string): boolean {
  return existsSync(join(projectPath, '.skills-fabrik', 'config.json'));
}

/**
 * Permite al usuario personalizar la configuración del proyecto
 */
async function customizeProjectInfo(projectInfo: ProjectInfo): Promise<ProjectInfo> {
  console.log(chalk.blue('🎛️  Customizing project configuration...'));
  console.log('');

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'type',
      message: 'Select project type:',
      choices: [
        { name: 'React', value: 'react' },
        { name: 'Vue.js', value: 'vue' },
        { name: 'Angular', value: 'angular' },
        { name: 'Node.js', value: 'nodejs' },
        { name: 'Python', value: 'python' },
        { name: 'Django', value: 'django' },
        { name: 'Flask', value: 'flask' },
        { name: 'FastAPI', value: 'fastapi' },
        { name: 'Go', value: 'go' },
        { name: 'Rust', value: 'rust' },
        { name: 'Java', value: 'java' },
        { name: 'Docker', value: 'docker' },
        { name: 'Terraform', value: 'terraform' },
        { name: 'Unknown/Other', value: 'unknown' }
      ],
      default: projectInfo.type
    },
    {
      type: 'checkbox',
      name: 'features',
      message: 'Select features to enable:',
      choices: [
        { name: 'Real-time Dashboard', value: 'dashboard', checked: true },
        { name: 'KPI Tracking', value: 'kpi', checked: true },
        { name: 'Auto-optimization', value: 'autoOptimization', checked: false },
        { name: 'Experimental Features', value: 'experimental', checked: false }
      ]
    },
    {
      type: 'list',
      name: 'enforcement',
      message: 'Select quality enforcement level:',
      choices: [
        { name: 'Strict (Block on violations)', value: 'strict' },
        { name: 'Moderate (Warn on violations)', value: 'moderate' },
        { name: 'Permissive (Suggest improvements)', value: 'permissive' }
      ],
      default: 'moderate'
    }
  ]);

  // Actualizar información del proyecto basada en las respuestas
  const updatedInfo = { ...projectInfo, type: answers.type as ProjectType };

  // Actualizar skills recomendadas basadas en features
  if (answers.features.includes('experimental')) {
    updatedInfo.recommendedSkills.push('experimental-patterns');
  }

  return updatedInfo;
}

/**
 * Aplica un template específico al proyecto
 */
function applyTemplate(projectInfo: ProjectInfo, template: string): ProjectInfo {
  const templateMap: Record<string, ProjectType> = {
    'react': 'react',
    'vue': 'vue',
    'angular': 'angular',
    'node': 'nodejs',
    'nodejs': 'nodejs',
    'python': 'python',
    'django': 'django',
    'flask': 'flask',
    'fastapi': 'fastapi',
    'go': 'go',
    'rust': 'rust',
    'java': 'java',
    'docker': 'docker',
    'terraform': 'terraform'
  };

  const projectType = templateMap[template.toLowerCase()];
  if (projectType) {
    return { ...projectInfo, type: projectType };
  }

  console.warn(chalk.yellow(`⚠️  Unknown template: ${template}, using detected type`));
  return projectInfo;
}

/**
 * Muestra el resumen de inicialización
 */
function showInitializationSummary(config: UniversalConfig, options: InitOptions): void {
  console.log('');
  console.log(chalk.green.bold('✅ Skills Fabric initialized successfully!'));
  console.log('');

  console.log(chalk.blue('📊 Configuration Summary:'));
  console.log(`   Project ID: ${chalk.bold(config.projectId)}`);
  console.log(`   Project Type: ${chalk.bold(config.projectInfo.type)}`);
  console.log(`   Skills Enabled: ${chalk.bold(config.skills.enabled ? 'Yes' : 'No')}`);
  console.log(`   Quality Gates: ${chalk.bold(config.qualityGates.enabled ? 'Yes' : 'No')}`);
  console.log(`   IDE Hooks: ${chalk.bold(!options.minimal ? 'Yes' : 'No')}`);
  console.log(`   Services Auto-start: ${chalk.bold(!options.skipServices && !options.minimal ? 'Yes' : 'No')}`);
  console.log('');

  console.log(chalk.blue('🔌 Port Allocation:'));
  console.log(`   Daemon: ${chalk.bold(config.ports.daemon)}`);
  console.log(`   Router: ${chalk.bold(config.ports.router)}`);
  console.log(`   Discovery: ${chalk.bold(config.ports.discovery)}`);
  console.log(`   Dashboard: ${chalk.bold(config.ports.dashboard)}`);
  console.log('');

  console.log(chalk.blue('📝 Recommended Skills:'));
  config.projectInfo.recommendedSkills.slice(0, 5).forEach(skill => {
    console.log(`   • ${chalk.cyan(skill)}`);
  });
  if (config.projectInfo.recommendedSkills.length > 5) {
    console.log(`   ... and ${config.projectInfo.recommendedSkills.length - 5} more`);
  }
  console.log('');

  console.log(chalk.blue('🚀 Next Steps:'));
  console.log(`   ${chalk.cyan('skills-fabrik status')}     - Check system status`);
  console.log(`   ${chalk.cyan('skills-fabrik skills list')} - View available skills`);
  console.log(`   ${chalk.cyan('skills-fabrik services start')} - Start services (if not auto-started)`);
  console.log(`   ${chalk.cyan('skills-fabrik config show')} - View configuration`);
  console.log('');

  if (config.features.dashboard) {
    console.log(chalk.green(`🌐 Dashboard available at: http://localhost:${config.ports.dashboard}`));
  }

  console.log(chalk.gray('💡 Tip: Use --help with any command to see available options'));
  console.log('');
}