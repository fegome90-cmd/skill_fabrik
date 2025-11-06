#!/usr/bin/env node
/**
 * Script para probar herramientas MCP directamente
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Importar adapters
const {
  fsAdapter,
  gitAdapter,
  pm2Adapter,
  metricsAdapter,
  testConnection,
  testAllConnections,
  validateConfig
} = require('@skills-fabrik/mcp-adapters/dist/index.js');

// Colores para console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  console.log('\n' + '='.repeat(60));
  log(message, 'bright');
  console.log('='.repeat(60) + '\n');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Tests
async function testFilesystem() {
  logHeader('Testing Filesystem Adapter');

  const testFile = '/tmp/mcp-test-' + Date.now() + '.txt';

  try {
    // Test write
    logInfo('Escribiendo archivo de prueba...');
    await fsAdapter.writeFile(testFile, 'Hello from MCP Test!');
    logSuccess('Archivo escrito');

    // Test read
    logInfo('Leyendo archivo...');
    const content = await fsAdapter.readFile(testFile);
    if (content === 'Hello from MCP Test!') {
      logSuccess('Contenido leído correctamente');
    } else {
      logError('Contenido no coincide');
    }

    // Test exists
    logInfo('Verificando existencia...');
    const exists = await fsAdapter.fileExists(testFile);
    if (exists) {
      logSuccess('Archivo existe');
    } else {
      logError('Archivo no existe');
    }

    // Cleanup
    await fsAdapter.deleteFile(testFile);
    logInfo('Archivo de prueba eliminado');

  } catch (error) {
    logError(`Error en test filesystem: ${error.message}`);
  }
}

async function testGit() {
  logHeader('Testing Git Adapter');

  try {
    // Test status
    logInfo('Obteniendo estado de Git...');
    const status = await gitAdapter.status();
    logSuccess('Estado obtenido');
    console.log(status);

    // Test log
    logInfo('Obteniendo historial de commits...');
    const log = await gitAdapter.log(null, 5);
    logSuccess('Historial obtenido');
    console.log(log);

  } catch (error) {
    logError(`Error en test git: ${error.message}`);
  }
}

async function testPM2() {
  logHeader('Testing PM2 Adapter');

  try {
    // Test list
    logInfo('Listando procesos PM2...');
    const processes = await pm2Adapter.list();
    logSuccess('Procesos obtenidos');
    console.log(processes);

  } catch (error) {
    logError(`Error en test pm2: ${error.message}`);
  }
}

async function testMetrics() {
  logHeader('Testing Metrics Adapter');

  try {
    // Test emit event
    logInfo('Emitiendo evento de prueba...');
    const event = {
      ts: Date.now(),
      source: 'mcp-test-script',
      event_name: 'test_event',
      data: { message: 'Hello from metrics test' }
    };
    await metricsAdapter.emitEvent(event);
    logSuccess('Evento emitido');

    // Test get events
    logInfo('Obteniendo eventos...');
    const events = await metricsAdapter.getEvents(10);
    logSuccess('Eventos obtenidos');
    console.log(events);

  } catch (error) {
    logError(`Error en test metrics: ${error.message}`);
  }
}

async function testHealthChecks() {
  logHeader('Testing Health Checks');

  try {
    // Test validate config
    logInfo('Validando configuración...');
    const config = validateConfig();
    if (config.valid) {
      logSuccess('Configuración válida');
    } else {
      logWarning('Configuración tiene errores:');
      console.log(config.errors);
    }

    // Test connection
    logInfo('Probando conexión Redis...');
    const health = await testConnection();
    if (health.connected) {
      logSuccess('Redis conectado');
    } else {
      logError(`Redis no conectado: ${health.error}`);
    }

    // Test all connections
    logInfo('Probando todas las conexiones...');
    const connections = await testAllConnections();
    logSuccess('Resultado de conexiones:');
    console.log(connections);

  } catch (error) {
    logError(`Error en health checks: ${error.message}`);
  }
}

async function testMemTech() {
  logHeader('Testing MemTech (Plan Snapshots)');

  try {
    const { createPlanSnapshot } = require('@skills-fabrik/mcp-adapters/dist/index.js');

    logInfo('Creando snapshot de prueba...');
    const snapshot = await createPlanSnapshot({
      id: 'test-plan-' + Date.now(),
      task: 'Test plan from MCP',
      phases: [
        { name: 'Test', status: 'active' }
      ],
      status: 'APPROVED',
      approved_at: new Date().toISOString(),
      risks: [],
      metrics: { test: true }
    });

    logSuccess('Snapshot creado:');
    console.log(snapshot);

  } catch (error) {
    logWarning(`MemTech snapshot no disponible: ${error.message}`);
  }
}

// Menu interactivo
async function showMenu() {
  console.log('\n' + '='.repeat(60));
  log('🧪 MCP Tools Test Suite', 'bright');
  console.log('='.repeat(60) + '\n');

  console.log('Selecciona una opción:');
  console.log('1)  Test Filesystem');
  console.log('2)  Test Git');
  console.log('3)  Test PM2');
  console.log('4)  Test Metrics');
  console.log('5)  Test Health Checks');
  console.log('6)  Test MemTech');
  console.log('7)  Run All Tests');
  console.log('8)  Interactive Mode');
  console.log('q)  Quit');
  console.log('');
}

async function runAllTests() {
  logHeader('Running All MCP Tests');

  await testFilesystem();
  await testGit();
  await testPM2();
  await testMetrics();
  await testHealthChecks();
  await testMemTech();

  logHeader('All Tests Completed');
  logSuccess('✅ Test suite finished!');
}

async function interactiveMode() {
  console.log('\n' + '='.repeat(60));
  log('🎮 Interactive Mode - Execute tools manually', 'bright');
  console.log('='.repeat(60) + '\n');

  while (true) {
    console.log('\nAvailable adapters:');
    console.log('1) fsAdapter');
    console.log('2) gitAdapter');
    console.log('3) pm2Adapter');
    console.log('4) metricsAdapter');
    console.log('5) Health checks');
    console.log('b) Back to menu');
    console.log('q) Quit');

    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const choice = await new Promise(resolve => {
      rl.question('\nSelect adapter: ', resolve);
    });

    rl.close();

    if (choice === 'b') break;
    if (choice === 'q') process.exit(0);

    try {
      switch (choice) {
        case '1':
          console.log('\nFilesystem Adapter Commands:');
          console.log('- fsAdapter.readFile(path)');
          console.log('- fsAdapter.writeFile(path, content)');
          console.log('- fsAdapter.listDir(path)');
          console.log('- fsAdapter.fileExists(path)');
          console.log('- fsAdapter.deleteFile(path)');
          console.log('\nTry: await fsAdapter.readFile("/etc/hosts")');
          break;

        case '2':
          console.log('\nGit Adapter Commands:');
          console.log('- gitAdapter.status()');
          console.log('- gitAdapter.log(null, 5)');
          console.log('- gitAdapter.diff()');
          console.log('\nTry: console.log(await gitAdapter.status())');
          break;

        case '3':
          console.log('\nPM2 Adapter Commands:');
          console.log('- pm2Adapter.list()');
          console.log('- pm2Adapter.restart(nameOrId)');
          console.log('- pm2Adapter.logs(nameOrId, 50)');
          console.log('\nTry: console.log(await pm2Adapter.list())');
          break;

        case '4':
          console.log('\nMetrics Adapter Commands:');
          console.log('- metricsAdapter.emitEvent(event)');
          console.log('- metricsAdapter.getEvents(50)');
          console.log('- metricsAdapter.getMetrics()');
          console.log('\nTry: await metricsAdapter.emitEvent({name: "test"})');
          break;

        case '5':
          console.log('\nHealth Checks:');
          console.log('- testConnection()');
          console.log('- testAllConnections()');
          console.log('- validateConfig()');
          console.log('\nTry: console.log(await testConnection())');
          break;

        default:
          console.log('Invalid option');
      }

      const readline2 = await import('readline');
      const rl2 = readline2.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const command = await new Promise(resolve => {
        rl2.question('\nEnter command to execute (or press Enter to go back): ', resolve);
      });

      rl2.close();

      if (command.trim()) {
        console.log('\n' + '-'.repeat(60));
        try {
          const result = eval(command);
          if (result && typeof result.then === 'function') {
            const value = await result;
            console.log('\nResult:', value);
          } else {
            console.log('\nResult:', result);
          }
        } catch (error) {
          console.log('\nError:', error.message);
        }
        console.log('-'.repeat(60) + '\n');

        const readline3 = await import('readline');
        const rl3 = readline3.createInterface({
          input: process.stdin,
          output: process.stdout
        });

        await new Promise(resolve => {
          rl3.question('Press Enter to continue...', resolve);
        });

        rl3.close();
      }

    } catch (error) {
      logError(`Error: ${error.message}`);
    }
  }
}

// Main
async function main() {
  if (process.argv.includes('--all')) {
    await runAllTests();
  } else if (process.argv.includes('--interactive')) {
    await interactiveMode();
  } else if (process.argv.includes('--quick')) {
    await testHealthChecks();
  } else {
    await showMenu();

    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const choice = await new Promise(resolve => {
      rl.question('Enter your choice: ', resolve);
    });

    rl.close();

    switch (choice) {
      case '1':
        await testFilesystem();
        break;
      case '2':
        await testGit();
        break;
      case '3':
        await testPM2();
        break;
      case '4':
        await testMetrics();
        break;
      case '5':
        await testHealthChecks();
        break;
      case '6':
        await testMemTech();
        break;
      case '7':
        await runAllTests();
        break;
      case '8':
        await interactiveMode();
        break;
      case 'q':
        log('Goodbye!', 'green');
        process.exit(0);
      default:
        log('Invalid choice', 'red');
        process.exit(1);
    }
  }
}

// Ejecutar
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
