#!/usr/bin/env node

/**
 * Skills Fabric Universal CLI
 *
 * Punto de entrada principal para el sistema universal de Skills Fabric.
 * Proporciona comandos para inicializar, configurar y gestionar Skills Fabric
 * en cualquier proyecto.
 *
 * @version 1.0.0
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import commands
import { initCommand } from './commands/init.js';
import { statusCommand } from './commands/status.js';
import { skillsCommand } from './commands/skills.js';
import { configCommand } from './commands/config.js';
import { servicesCommand } from './commands/services.js';
import { uninstallCommand } from './commands/uninstall.js';

const program = new Command();

// Configuración global del CLI
program
  .name('skills-fabrik')
  .description('Skills Fabric Universal - Portable development assistant for any project')
  .version('1.0.0')
  .option('-v, --verbose', 'Enable verbose logging')
  .option('--no-color', 'Disable colored output')
  .hook('preAction', (thisCommand) => {
    // Configurar logging global
    if (thisCommand.opts().verbose) {
      process.env.LOG_LEVEL = 'DEBUG';
    }
  });

// Comando: init
program
  .command('init')
  .description('Initialize Skills Fabric in current project')
  .option('-t, --template <template>', 'Use specific template (react, nodejs, python, etc.)')
  .option('-f, --force', 'Force initialization even if already configured')
  .option('--skip-services', 'Skip automatic service startup')
  .option('--minimal', 'Create minimal configuration only')
  .action(initCommand);

// Comando: status
program
  .command('status')
  .description('Show Skills Fabric status for current project')
  .option('--services', 'Show detailed service status')
  .option('--ports', 'Show port allocation information')
  .option('--config', 'Show current configuration')
  .action(statusCommand);

// Comando: skills
program
  .command('skills')
  .description('Manage skills and skill activation')
  .addCommand(
    new Command('check')
      .description('Check which skills would be activated for a query')
      .argument('<query>', 'Query to test skill activation')
      .option('-v, --verbose', 'Show detailed activation analysis')
      .option('--debug', 'Show debugging information')
      .action((query, options) => {
        // Importar dinámicamente para evitar carga temprana
        import('./commands/skills.js').then(({ checkSkill }) => {
          checkSkill(query, options);
        });
      })
  )
  .addCommand(
    new Command('list')
      .description('List available skills for current project')
      .option('--enabled', 'Show only enabled skills')
      .option('--type <type>', 'Filter by skill type')
      .action((options) => {
        import('./commands/skills.js').then(({ listSkills }) => {
          listSkills(options);
        });
      })
  )
  .addCommand(
    new Command('add')
      .description('Add custom skill to project')
      .argument('<skill-path>', 'Path to skill file or directory')
      .action((skillPath) => {
        import('./commands/skills.js').then(({ addSkill }) => {
          addSkill(skillPath);
        });
      })
  )
  .addCommand(
    new Command('index')
      .description('Rebuild skill index for current project')
      .option('--force', 'Force rebuild even if up to date')
      .action((options) => {
        import('./commands/skills.js').then(({ indexSkills }) => {
          indexSkills(options);
        });
      })
  );

// Comando: config
program
  .command('config')
  .description('Manage Skills Fabric configuration')
  .addCommand(
    new Command('show')
      .description('Show current configuration')
      .option('--format <format>', 'Output format (json, yaml, env)', 'json')
      .action((format) => {
        import('./commands/config.js').then(({ showConfig }) => {
          showConfig(format);
        });
      })
  )
  .addCommand(
    new Command('set')
      .description('Set configuration value')
      .argument('<key>', 'Configuration key (e.g., skills.enabled)')
      .argument('<value>', 'Configuration value')
      .action((key, value) => {
        import('./commands/config.js').then(({ setConfig }) => {
          setConfig(key, value);
        });
      })
  )
  .addCommand(
    new Command('get')
      .description('Get configuration value')
      .argument('<key>', 'Configuration key')
      .action((key) => {
        import('./commands/config.js').then(({ getConfig }) => {
          getConfig(key);
        });
      })
  )
  .addCommand(
    new Command('reset')
      .description('Reset configuration to defaults')
      .option('--confirm', 'Skip confirmation prompt')
      .action((options) => {
        import('./commands/config.js').then(({ resetConfig }) => {
          resetConfig(options);
        });
      })
  );

// Comando: services
program
  .command('services')
  .description('Manage Skills Fabric services')
  .addCommand(
    new Command('start')
      .description('Start all services')
      .option('--service <service>', 'Start specific service (daemon, router, discovery, dashboard)')
      .action((options) => {
        import('./commands/services.js').then(({ startServices }) => {
          startServices(options);
        });
      })
  )
  .addCommand(
    new Command('stop')
      .description('Stop all services')
      .option('--service <service>', 'Stop specific service')
      .action((options) => {
        import('./commands/services.js').then(({ stopServices }) => {
          stopServices(options);
        });
      })
  )
  .addCommand(
    new Command('restart')
      .description('Restart all services')
      .option('--service <service>', 'Restart specific service')
      .action((options) => {
        import('./commands/services.js').then(({ restartServices }) => {
          restartServices(options);
        });
      })
  )
  .addCommand(
    new Command('logs')
      .description('Show service logs')
      .option('--service <service>', 'Show logs for specific service')
      .option('--follow', 'Follow log output (tail -f)')
      .option('--lines <number>', 'Number of lines to show', '50')
      .action((options) => {
        import('./commands/services.js').then(({ showLogs }) => {
          showLogs(options);
        });
      })
  );

// Comando: uninstall
program
  .command('uninstall')
  .description('Remove Skills Fabric from current project')
  .option('--complete', 'Complete removal including all files and data')
  .option('--backup', 'Backup configuration before removal')
  .option('--confirm', 'Skip confirmation prompt')
  .action(uninstallCommand);

// Manejo de errores globales
program.exitOverride();

process.on('uncaughtException', (error) => {
  console.error(chalk.red('❌ Uncaught Exception:'), error.message);
  if (process.env.LOG_LEVEL === 'DEBUG') {
    console.error(error.stack);
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('❌ Unhandled Rejection:'), reason);
  if (process.env.LOG_LEVEL === 'DEBUG') {
    console.error('Promise:', promise);
  }
  process.exit(1);
});

// Función principal
async function main() {
  try {
    // Verificar que estamos en un directorio válido
    const cwd = process.cwd();
    if (!cwd) {
      throw new Error('Invalid working directory');
    }

    // Si no hay argumentos, mostrar ayuda
    if (process.argv.length <= 2) {
      program.help();
    }

    // Ejecutar comando
    await program.parseAsync(process.argv);

  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'commander.help') {
      process.exit(0);
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(chalk.red('❌ Error:'), errorMessage);

    if (process.env.LOG_LEVEL === 'DEBUG') {
      const errorStack = error instanceof Error ? error.stack : undefined;
      if (errorStack) {
        console.error(chalk.gray(errorStack));
      }
    }

    process.exit(1);
  }
}

// Ejecutar si este archivo es el entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { program };
export default main;