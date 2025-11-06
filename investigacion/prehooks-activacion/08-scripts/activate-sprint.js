#!/usr/bin/env node

/**
 * Script: activate-sprint.js
 * Descripción: Activación automática de skills basado en tipo de sprint
 * Uso: node 08-scripts/activate-sprint.js --type feature --sprint S15 --priority backend,api
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import chalk from 'chalk';

const args = parseArgs(process.argv.slice(2));

// Configuración de perfiles
const SPRINT_PROFILES = {
  feature: {
    skills: [
      'backend-dev-guidelines',
      'api-design-and-testing',
      'database-management',
      'database-verification',
      'code-review-checklist'
    ],
    optional: [
      'performance-optimization',
      'test-automation',
      'code-quality-guidelines'
    ],
    thresholds: {
      block: 0.2,
      require: 0.4,
      warn: 0.5,
      suggest: 0.6
    },
    specialConfig: {
      'database-verification': 'ALWAYS_ON',
      'code-review-checklist': 'MANDATORY'
    }
  },
  bugfix: {
    skills: [
      'root-cause-tracing',
      'systematic-debugging',
      'error-pattern-standardization'
    ],
    optional: [
      'test-driven-debugging',
      'logging-best-practices'
    ],
    thresholds: {
      block: 0.2,
      require: 0.4,
      warn: 0.5,
      suggest: 0.6
    },
    specialConfig: {
      'deep-analysis': 'ENABLED',
      'trace-logging': 'ENHANCED'
    }
  },
  refactor: {
    skills: [
      'backend-architecture-patterns',
      'error-pattern-standardization',
      'code-review-checklist'
    ],
    optional: [
      'performance-optimization',
      'test-coverage-guidelines'
    ],
    thresholds: {
      block: 0.2,
      require: 0.4,
      warn: 0.5,
      suggest: 0.6
    }
  },
  security: {
    skills: [
      'security-testing-guide',
      'secrets-and-config',
      'database-verification',
      'compliance-checklist'
    ],
    optional: [
      'vulnerability-scanning'
    ],
    thresholds: {
      block: 0.1,
      require: 0.3,
      warn: 0.4,
      suggest: 0.5
    },
    specialConfig: {
      'strict-mode': 'ENFORCED',
      'all-block': true
    }
  },
  performance: {
    skills: [
      'performance-optimization',
      'backend-architecture-patterns',
      'caching-strategies'
    ],
    optional: [
      'monitoring-setup',
      'database-performance'
    ],
    thresholds: {
      block: 0.2,
      require: 0.4,
      warn: 0.5,
      suggest: 0.6
    },
    specialConfig: {
      'profiling': 'ENABLED',
      'metrics-collection': 'AGGRESSIVE'
    }
  },
  testing: {
    skills: [
      'visual-regression-testing',
      'webapp-testing-guide',
      'api-testing-best-practices'
    ],
    optional: [
      'test-automation',
      'test-coverage-guidelines'
    ],
    thresholds: {
      block: 0.2,
      require: 0.4,
      warn: 0.5,
      suggest: 0.6
    },
    specialConfig: {
      'auto-coverage': 'ON'
    }
  },
  migration: {
    skills: [
      'database-migration',
      'data-safety',
      'rollback-strategies'
    ],
    optional: [
      'backup-strategies',
      'migration-testing'
    ],
    thresholds: {
      block: 0.1,
      require: 0.3,
      warn: 0.4,
      suggest: 0.5
    },
    specialConfig: {
      'dry-run': 'MANDATORY',
      'backup-before': 'MANDATORY'
    }
  }
};

async function main() {
  console.log(chalk.blue.bold('\n🚀 SPRINT ACTIVATION - Skills Fabric\n'));

  // Validar argumentos
  if (!args.type) {
    console.error(chalk.red('❌ Error: --type es requerido'));
    console.log(chalk.yellow('Tipos disponibles: feature, bugfix, refactor, security, performance, testing, migration'));
    process.exit(1);
  }

  const sprintType = args.type;
  const sprintId = args.sprint || 'UNKNOWN';
  const priorities = args.priority ? args.priority.split(',') : [];
  const strictMode = args['strict-mode'] === 'true';

  // Verificar tipo válido
  if (!SPRINT_PROFILES[sprintType]) {
    console.error(chalk.red(`❌ Error: Tipo de sprint "${sprintType}" no válido`));
    console.log(chalk.yellow('Tipos disponibles:'), Object.keys(SPRINT_PROFILES).join(', '));
    process.exit(1);
  }

  const profile = SPRINT_PROFILES[sprintType];

  try {
    // 1. Verificar servicios
    console.log(chalk.blue('1️⃣ Verificando servicios...'));
    await verifyServices();

    // 2. Cargar perfil
    console.log(chalk.blue(`\n2️⃣ Cargando perfil "${sprintType}"...`));
    const config = loadProfile(sprintType, priorities, strictMode);
    console.log(chalk.green(`✅ Perfil cargado: ${config.skills.length} skills principales`));

    // 3. Activar skills
    console.log(chalk.blue('\n3️⃣ Activando skills...'));
    await activateSkills(config.skills, profile.thresholds, profile.specialConfig);

    // 4. Activar skills opcionales si se especifican
    if (config.optional.length > 0) {
      console.log(chalk.blue('\n4️⃣ Activando skills opcionales...'));
      await activateSkills(config.optional, profile.thresholds);
      console.log(chalk.green(`✅ ${config.optional.length} skills opcionales activadas`));
    }

    // 5. Configurar thresholds
    console.log(chalk.blue('\n5️⃣ Configurando thresholds...'));
    configureThresholds(profile.thresholds);

    // 6. Aplicar configuración especial
    if (Object.keys(profile.specialConfig).length > 0) {
      console.log(chalk.blue('\n6️⃣ Aplicando configuración especial...'));
      applySpecialConfig(profile.specialConfig);
    }

    // 7. Verificar activación
    console.log(chalk.blue('\n7️⃣ Verificando activación...'));
    const verification = await verifyActivation();
    console.log(chalk.green(`✅ ${verification.activated} skills activas de ${verification.total}`));

    // 8. Iniciar monitoreo
    console.log(chalk.blue('\n8️⃣ Iniciando monitoreo...'));
    startMonitoring(sprintId, sprintType);

    // 9. Mostrar resumen
    printSummary(sprintId, sprintType, config);

    console.log(chalk.green.bold('\n✅ SPRINT ACTIVATION COMPLETADO\n'));

  } catch (error) {
    console.error(chalk.red('\n❌ Error durante activación:'), error.message);
    if (args.debug) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.substring(2);
      const value = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true;
      args[key] = value;
      if (value !== true) i++;
    }
  }
  return args;
}

async function verifyServices() {
  const services = ['sf-daemon', 'router-service', 'service-discovery'];

  for (const service of services) {
    try {
      const status = execSync(`pm2 jlist | jq '.[] | select(.name=="${service}") | .pm2_env.status'`, { encoding: 'utf8' }).trim().replace(/"/g, '');

      if (status === 'online') {
        console.log(chalk.green(`  ✓ ${service}: online`));
      } else {
        throw new Error(`${service} is ${status}`);
      }
    } catch (error) {
      console.log(chalk.red(`  ✗ ${service}: offline`));
      throw new Error(`Service ${service} is not running. Run: pm2 start scripts/pm2/ecosystem.config.cjs --env development`);
    }
  }
}

function loadProfile(type, priorities, strictMode) {
  const profile = SPRINT_PROFILES[type];

  let skills = [...profile.skills];

  // Filtrar por prioridades
  if (priorities.length > 0) {
    skills = skills.filter(skill =>
      priorities.some(p => skill.toLowerCase().includes(p.toLowerCase()))
    );
  }

  // Modo estricto
  if (strictMode) {
    console.log(chalk.yellow('  ⚠️ Modo estricto: solo skills críticas'));
    skills = skills.filter(skill =>
      profile.thresholds && (
        skill.includes('verification') ||
        skill.includes('security') ||
        skill.includes('review')
      )
    );
  }

  return {
    skills,
    optional: profile.optional,
    thresholds: profile.thresholds,
    specialConfig: profile.specialConfig
  };
}

async function activateSkills(skills, thresholds, specialConfig = {}) {
  for (const skill of skills) {
    try {
      // Determinar enforcement basado en threshold
      const enforcement = getEnforcement(skill, thresholds);

      // Verificar si es configuración especial
      if (specialConfig[skill]) {
        console.log(chalk.yellow(`  ⚡ ${skill}: ${specialConfig[skill]}`));
      }

      // Activar skill
      const result = execSync(
        `node packages/skills-cli/dist/index.js skills activate ${skill} --enforcement ${enforcement}`,
        { encoding: 'utf8' }
      );

      console.log(chalk.green(`  ✓ ${skill} (${enforcement})`));
    } catch (error) {
      console.log(chalk.red(`  ✗ ${skill}: ${error.message}`));
    }
  }
}

function getEnforcement(skill, thresholds) {
  // Lógica para determinar enforcement basado en thresholds
  if (skill.includes('verification') || skill.includes('security')) {
    return thresholds.block < 0.25 ? 'block' : 'require';
  }
  if (skill.includes('review') || skill.includes('checklist')) {
    return 'require';
  }
  if (skill.includes('error') || skill.includes('debug') || skill.includes('performance')) {
    return 'warn';
  }
  return 'suggest';
}

function configureThresholds(thresholds) {
  const configPath = `.skills-config/thresholds-${Date.now()}.json`;

  if (!existsSync('.skills-config')) {
    execSync('mkdir -p .skills-config');
  }

  writeFileSync(configPath, JSON.stringify(thresholds, null, 2));
  console.log(chalk.green(`  ✓ Thresholds guardados en ${configPath}`));

  // Aplicar thresholds
  try {
    execSync('skills-cli skills configure-thresholds --config ' + configPath, { stdio: 'ignore' });
  } catch (error) {
    console.log(chalk.yellow('  ⚠️ No se pudieron aplicar thresholds automáticamente'));
  }
}

function applySpecialConfig(config) {
  for (const [skill, specialConfig] of Object.entries(config)) {
    try {
      execSync(`skills-cli skills configure ${skill} --special "${specialConfig}"`, { stdio: 'ignore' });
      console.log(chalk.green(`  ✓ ${skill}: ${specialConfig}`));
    } catch (error) {
      console.log(chalk.yellow(`  ⚠️ No se pudo aplicar configuración especial para ${skill}`));
    }
  }
}

async function verifyActivation() {
  try {
    const output = execSync('skills-cli skills list --active', { encoding: 'utf8' });

    // Contar skills activas
    const activeCount = (output.match(/✓/g) || []).length;

    return {
      activated: activeCount,
      total: activeCount
    };
  } catch (error) {
    console.log(chalk.yellow('  ⚠️ No se pudo verificar activación automáticamente'));
    return { activated: 0, total: 0 };
  }
}

function startMonitoring(sprintId, sprintType) {
  // Crear directorio de logs si no existe
  if (!existsSync('.skills-logs')) {
    execSync('mkdir -p .skills-logs');
  }

  const logFile = `.skills-logs/sprint-${sprintId}.jsonl`;

  // Iniciar monitoreo en background
  const monitorCommand = `pm2 start "node 08-scripts/monitor-activations.js --sprint ${sprintId} --output ${logFile}" --name "monitor-${sprintId}"`;

  try {
    execSync(monitorCommand, { stdio: 'ignore' });
    console.log(chalk.green(`  ✓ Monitoreo iniciado: ${logFile}`));
  } catch (error) {
    console.log(chalk.yellow('  ⚠️ No se pudo iniciar monitoreo automático'));
  }
}

function printSummary(sprintId, sprintType, config) {
  console.log(chalk.blue.bold('\n📊 RESUMEN DE ACTIVACIÓN\n'));
  console.log(chalk.gray(`Sprint ID: ${sprintId}`));
  console.log(chalk.gray(`Tipo: ${sprintType}`));
  console.log(chalk.gray(`Fecha: ${new Date().toISOString()}\n`));

  console.log(chalk.blue('Skills Principales:'));
  config.skills.forEach(skill => console.log(chalk.white(`  • ${skill}`)));

  if (config.optional.length > 0) {
    console.log(chalk.blue('\nSkills Opcionales:'));
    config.optional.forEach(skill => console.log(chalk.gray(`  • ${skill}`)));
  }

  console.log(chalk.blue('\nThresholds:'));
  Object.entries(config.thresholds).forEach(([level, value]) => {
    console.log(chalk.white(`  • ${level}: ${value}`));
  });

  console.log(chalk.blue('\nRecursos:'));
  console.log(chalk.cyan(`  Dashboard: http://localhost:8888`));
  console.log(chalk.cyan(`  Logs: .skills-logs/sprint-${sprintId}.jsonl`));
  console.log(chalk.cyan(`  Config: .skills-config/`));

  console.log(chalk.blue('\nComandos Útiles:'));
  console.log(chalk.cyan(`  Ver activaciones: skills-cli skills check "test" --v2`));
  console.log(chalk.cyan(`  Métricas: pnpm kpi:show`));
  console.log(chalk.cyan(`  Health: skills-cli dashboard health`));
}

// Ejecutar
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error(chalk.red('\n💥 Fatal error:'), error);
    process.exit(1);
  });
}
