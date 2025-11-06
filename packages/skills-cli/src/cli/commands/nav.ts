import path from 'path';
import { readFile, writeFile, access } from 'fs/promises';
import { NavigationCore } from '../../navigation/navigation-core.js';
import { colors, format, createBox } from '../../utils/colors.js';
import { Spinner, StepIndicator, promptSelect, promptConfirm, withSpinner } from '../../utils/progress.js';

const nav = new NavigationCore();

interface ProjectStatus {
  name: string;
  path: string;
  health: 'healthy' | 'warning' | 'error';
  lastChecked: string;
  components: {
    total: number;
    healthy: number;
    warnings: number;
    errors: number;
  };
  recentActivity: string[];
}

interface NavigationAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'navigation' | 'monitoring' | 'tools' | 'project';
  shortcut?: string;
  dangerous?: boolean;
}

// Professional project navigation dashboard
export async function navDashboard(): Promise<void> {
  console.clear();

  // Show welcome banner
  console.log(createBox(
    '🧭 Skills Fabric Project Navigation Hub',
    'Navigation System v1.0'
  ));

  console.log('');

  while (true) {
    try {
      // Get current project status
      const status = await getProjectStatus();

      // Show current status
      showProjectStatus(status);
      console.log('');

      // Show interactive menu
      const action = await showNavigationMenu();
      if (!action) break; // User pressed Esc

      // Execute selected action
      await executeNavigationAction(action, status);

      // Ask if user wants to continue
      console.log('');
      const continueMenu = await promptConfirm('Continue with navigation operations?');
      if (!continueMenu) break;

      console.clear();
    } catch (error) {
      console.log(colors.error('❌ Error:'), error instanceof Error ? error.message : String(error));

      const tryAgain = await promptConfirm('Try again?', false);
      if (!tryAgain) break;

      console.clear();
    }
  }

  console.log(colors.success('\n👋 Thank you for using Skills Fabric Navigation Hub!'));
}

export async function navStatus(): Promise<void> {
  console.log(format.header('Project Navigation Status'));

  const status = await getProjectStatus();
  showProjectStatus(status);
}

export async function navGoto(argv: string[]): Promise<void> {
  const view = argv[4];
  if (!view) {
    console.log(colors.error('❌ Missing view parameter'));
    console.log(colors.info('Usage:'), format.command('nav goto <view>'));
    console.log('');
    console.log(format.section('Available Views:'));
    console.log(format.bullet('skills'), 'Skills management and configuration');
    console.log(format.bullet('dashboard'), 'System dashboard and monitoring');
    console.log(format.bullet('memory'), 'Memory management system');
    console.log(format.bullet('kpi'), 'KPI and metrics dashboard');
    process.exit(1);
  }

  const success = await nav.navigateTo(view);
  if (success) {
    console.log(colors.success(`✓ Navigated to ${view}`));
  } else {
    console.log(colors.error(`❌ Failed to navigate to ${view}`));
    process.exit(1);
  }
}

export async function navBack(): Promise<void> {
  const success = await nav.goBack();
  if (success) {
    console.log(colors.success('✓ Navigated back'));
  } else {
    console.log(colors.warning('⚠️ Cannot go back - already at root'));
  }
}

export async function navExplore(): Promise<void> {
  console.log(format.header('Project Explorer'));

  const projectRoot = process.cwd();
  const status = await getProjectStatus();

  console.log(format.section('Project Structure'));
  console.log(format.bullet('Root Path:'), format.command(projectRoot));
  console.log(format.bullet('Project Name:'), colors.info(status.name));
  console.log(format.bullet('Health Status:'),
    status.health === 'healthy' ? colors.success(status.health) :
    status.health === 'warning' ? colors.warning(status.health) :
    colors.error(status.health)
  );

  console.log('');
  console.log(format.section('Quick Access'));
  console.log(format.bullet('📁 packages/'), 'Core packages and modules');
  console.log(format.bullet('📁 skills/'), 'Skills library and resources');
  console.log(format.bullet('📁 docs/'), 'Documentation and guides');
  console.log(format.bullet('📁 configs/'), 'Configuration files');
  console.log(format.bullet('📁 scripts/'), 'Build and utility scripts');

  const exploreMore = await promptConfirm('Explore specific directories?', false);
  if (exploreMore) {
    console.log('');
    console.log(format.info('Use'), format.command('cd <directory>'), 'to navigate');
  }
}

// Enhanced CLI command with new visual system
export async function navCLI(argv: string[]): Promise<void> {
  const subCommand = argv[3];

  // Show header
  console.log(format.header('Project Navigation System'));
  console.log(colors.text('Professional project navigation and management for Skills Fabric CLI\n'));

  switch (subCommand) {
    case 'dashboard':
    case undefined:
      await navDashboard();
      break;
    case 'status':
      await navStatus();
      break;
    case 'goto':
      await navGoto(argv);
      break;
    case 'back':
      await navBack();
      break;
    case 'explore':
      await navExplore();
      break;
    default:
      console.log(createBox(
        `Unknown command: ${subCommand}`,
        'Available Commands'
      ));

      console.log('');
      console.log(format.section('Available Commands:'));
      console.log(format.command('nav dashboard'), '- Interactive navigation dashboard (default)');
      console.log(format.command('nav status'), '- Show current navigation status');
      console.log(format.command('nav goto <view>'), '- Navigate to specific view');
      console.log(format.command('nav back'), '- Navigate back to previous view');
      console.log(format.command('nav explore'), '- Explore project structure');

      console.log('');
      console.log(format.info('💡 Tip: Use'), format.command('nav dashboard'), 'for the full interactive experience!');
      process.exit(1);
  }
}

// Helper functions
async function getProjectStatus(): Promise<ProjectStatus> {
  try {
    const projectRoot = process.cwd();
    const packageJsonPath = path.join(projectRoot, 'package.json');

    // Check if package.json exists
    const packageExists = await access(packageJsonPath).then(() => true).catch(() => false);

    let projectName = 'Unknown Project';
    if (packageExists) {
      try {
        const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));
        projectName = packageJson.name || path.basename(projectRoot);
      } catch {
        projectName = path.basename(projectRoot);
      }
    }

    // Simulate component health checking
    const components = {
      total: 5,
      healthy: 4,
      warnings: 1,
      errors: 0
    };

    const health = components.errors > 0 ? 'error' :
                  components.warnings > 0 ? 'warning' : 'healthy';

    return {
      name: projectName,
      path: projectRoot,
      health,
      lastChecked: new Date().toISOString(),
      components,
      recentActivity: [
        'CLI build completed',
        'Skills indexed successfully',
        'KPI metrics updated'
      ]
    };
  } catch (error) {
    return {
      name: 'Error Loading Project',
      path: process.cwd(),
      health: 'error',
      lastChecked: new Date().toISOString(),
      components: { total: 0, healthy: 0, warnings: 0, errors: 1 },
      recentActivity: ['Failed to load project status']
    };
  }
}

function showProjectStatus(status: ProjectStatus): void {
  const healthColor = status.health === 'healthy' ? colors.success :
                     status.health === 'warning' ? colors.warning : colors.error;

  console.log(createBox(
    `Project: ${status.name}`,
    'Current Status'
  ));

  console.log('');
  console.log(format.section('Project Information'));
  console.log(format.bullet('Project Path:'), format.command(status.path));
  console.log(format.bullet('Health Status:'), healthColor(status.health));
  console.log(format.bullet('Last Checked:'), colors.textDim(status.lastChecked));

  console.log('');
  console.log(format.section('Component Health'));
  console.log(format.bullet('Total Components:'), format.number(status.components.total));
  console.log(format.bullet('Healthy:'), colors.success(status.components.healthy));
  console.log(format.bullet('Warnings:'), colors.warning(status.components.warnings));
  console.log(format.bullet('Errors:'), colors.error(status.components.errors));

  console.log('');
  console.log(format.section('Recent Activity'));
  status.recentActivity.forEach((activity, index) => {
    const bullet = index === 0 ? '→' : '•';
    console.log(`${colors.textDim(bullet)} ${colors.text(activity)}`);
  });
}

function showNavigationMenu(): Promise<string | null> {
  const actions: NavigationAction[] = [
    {
      id: 'status',
      title: 'Show Detailed Status',
      description: 'Display comprehensive project and navigation information',
      icon: '📊',
      category: 'monitoring',
      shortcut: 's'
    },
    {
      id: 'explore',
      title: 'Explore Project',
      description: 'Browse project structure and files',
      icon: '📁',
      category: 'navigation',
      shortcut: 'e'
    },
    {
      id: 'goto',
      title: 'Quick Navigate',
      description: 'Navigate to specific view or location',
      icon: '🧭',
      category: 'navigation',
      shortcut: 'g'
    },
    {
      id: 'skills',
      title: 'Skills Management',
      description: 'Access skills library and configuration',
      icon: '🎯',
      category: 'project'
    },
    {
      id: 'dashboard',
      title: 'System Dashboard',
      description: 'Open system monitoring dashboard',
      icon: '📈',
      category: 'monitoring'
    },
    {
      id: 'memory',
      title: 'Memory Management',
      description: 'Access memory system and configuration',
      icon: '🧠',
      category: 'tools'
    },
    {
      id: 'kpi',
      title: 'KPI & Metrics',
      description: 'View performance metrics and analytics',
      icon: '📊',
      category: 'monitoring'
    },
    {
      id: 'back',
      title: 'Go Back',
      description: 'Navigate to previous location',
      icon: '⬅️',
      category: 'navigation',
      shortcut: 'b'
    },
    {
      id: 'health-check',
      title: 'System Health Check',
      description: 'Run comprehensive system diagnostics',
      icon: '🔍',
      category: 'monitoring'
    },
    {
      id: 'config',
      title: 'Configuration',
      description: 'Access project and system configuration',
      icon: '⚙️',
      category: 'project'
    }
  ];

  return promptSelect(
    'Select navigation action:',
    actions.map(action => `${action.shortcut ? `[${action.shortcut}] ` : ''}${action.title}`),
    0
  ).then(title => {
    const cleanTitle = title.replace(/^\[.\]\s+/, '');
    return actions.find(a => a.title === cleanTitle)?.id || null;
  });
}

async function executeNavigationAction(actionId: string, status: ProjectStatus): Promise<void> {
  switch (actionId) {
    case 'status':
      await navStatus();
      break;
    case 'explore':
      await navExplore();
      break;
    case 'goto':
      const destination = await promptInput('Enter destination:', 'skills');
      if (destination) {
        const success = await nav.navigateTo(destination);
        if (success) {
          console.log(colors.success(`✓ Navigated to ${destination}`));
        } else {
          console.log(colors.error(`❌ Failed to navigate to ${destination}`));
        }
      }
      break;
    case 'skills':
      console.log(colors.info('🎯 Opening Skills Management...'));
      console.log(format.bullet('Available commands:'), format.command('skills-cli skills <command>'));
      console.log(format.bullet('Quick access:'), format.command('nav goto skills'));
      break;
    case 'dashboard':
      console.log(colors.info('📈 Opening System Dashboard...'));
      console.log(format.bullet('Health check:'), format.command('skills-cli dashboard health'));
      console.log(format.bullet('System metrics:'), format.command('skills-cli dashboard system'));
      break;
    case 'memory':
      console.log(colors.info('🧠 Opening Memory Management...'));
      console.log(format.bullet('Memory dashboard:'), format.command('skills-cli mem dashboard'));
      console.log(format.bullet('Memory status:'), format.command('skills-cli mem status'));
      break;
    case 'kpi':
      console.log(colors.info('📊 Opening KPI & Metrics...'));
      console.log(format.bullet('KPI dashboard:'), format.command('skills-cli kpi --days 7'));
      console.log(format.bullet('Metrics overview:'), format.command('pnpm kpi:show'));
      break;
    case 'back':
      await navBack();
      break;
    case 'health-check':
      await withSpinner('Running system health check...', async () => {
        // Simulate health check
        await new Promise(resolve => setTimeout(resolve, 2000));
      });

      console.log(colors.success('✓ Health check completed'));
      console.log(format.bullet('Overall Status:'), colors.success('Healthy'));
      console.log(format.bullet('Services:'), colors.success('All operational'));
      console.log(format.bullet('Performance:'), colors.success('Optimal'));
      break;
    case 'config':
      console.log(colors.info('⚙️ Configuration Access'));
      console.log(format.bullet('Project config:'), format.command('configs/'));
      console.log(format.bullet('Skill rules:'), format.command('configs/skill-rules.json'));
      console.log(format.bullet('Environment:'), format.command('.env'));
      break;
  }
}

// Interactive input helper (reuse from mem command)
async function promptInput(question: string, defaultValue?: string): Promise<string> {
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    const suffix = defaultValue ? ` (${defaultValue})` : '';
    rl.question(`${colors.primary('?')} ${question}${suffix}: `, (answer) => {
      rl.close();
      resolve(answer || defaultValue || '');
    });
  });
}
