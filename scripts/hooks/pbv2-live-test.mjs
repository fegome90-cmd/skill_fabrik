#!/usr/bin/env node
/**
 * PBv2 Live Test Suite
 * Ejecución end-to-end de planes reales con medición de performance
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración
const TEST_PLANS_PATH = path.join(__dirname, '../../test-plans/pbv2-test-plans.json');
const PLAN_DETECTOR_PATH = path.join(__dirname, 'plan-detector.mjs');
const PBV2_ACTIVATOR_PATH = path.join(__dirname, 'pbv2-activator.mjs');
const RESULTS_PATH = path.join(__dirname, '../../test-outputs/pbv2-live-test-results.json');

// Utilidades de medición
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      startTime: Date.now(),
      tests: [],
      summary: {
        totalPlans: 0,
        successful: 0,
        failed: 0,
        totalTime: 0,
        avgDetectionTime: 0,
        avgActivationTime: 0,
        avgTotalTime: 0
      }
    };
  }

  startTest(planId, planTitle) {
    const test = {
      planId,
      planTitle,
      startTime: Date.now(),
      stages: {},
      errors: [],
      status: 'running'
    };
    this.metrics.tests.push(test);
    return test;
  }

  endTest(test, success = true, error = null) {
    test.endTime = Date.now();
    test.totalTime = test.endTime - test.startTime;
    test.status = success ? 'success' : 'failed';
    if (error) {
      test.errors.push({
        stage: 'execution',
        message: error.message,
        stack: error.stack
      });
    }
    this.updateSummary();
  }

  addStage(test, stageName, duration, success = true, error = null) {
    test.stages[stageName] = {
      duration,
      success,
      timestamp: Date.now(),
      error: error ? error.message : null
    };
    if (!success && error) {
      test.errors.push({
        stage: stageName,
        message: error.message,
        stack: error.stack
      });
    }
  }

  updateSummary() {
    const { tests, summary } = this.metrics;
    summary.totalPlans = tests.length;
    summary.successful = tests.filter(t => t.status === 'success').length;
    summary.failed = tests.filter(t => t.status === 'failed').length;
    summary.totalTime = Date.now() - this.metrics.startTime;

    const detectionTimes = tests.filter(t => t.stages.detection).map(t => t.stages.detection.duration);
    const activationTimes = tests.filter(t => t.stages.activation).map(t => t.stages.activation.duration);
    const totalTimes = tests.map(t => t.totalTime);

    summary.avgDetectionTime = detectionTimes.length > 0
      ? Math.round(detectionTimes.reduce((a, b) => a + b, 0) / detectionTimes.length)
      : 0;
    summary.avgActivationTime = activationTimes.length > 0
      ? Math.round(activationTimes.reduce((a, b) => a + b, 0) / activationTimes.length)
      : 0;
    summary.avgTotalTime = totalTimes.length > 0
      ? Math.round(totalTimes.reduce((a, b) => a + b, 0) / totalTimes.length)
      : 0;
  }

  saveResults() {
    fs.writeFileSync(RESULTS_PATH, JSON.stringify(this.metrics, null, 2));
    return this.metrics;
  }

  printSummary() {
    const { summary } = this.metrics;
    console.log('\n=== RESUMEN DEL TEST EN VIVO ===');
    console.log(`📊 Total de planes: ${summary.totalPlans}`);
    console.log(`✅ Exitosos: ${summary.successful} (${Math.round(summary.successful/summary.totalPlans*100)}%)`);
    console.log(`❌ Fallidos: ${summary.failed} (${Math.round(summary.failed/summary.totalPlans*100)}%)`);
    console.log(`⏱️  Tiempo total: ${summary.totalTime}ms`);
    console.log(`🚀 Avg Detection: ${summary.avgDetectionTime}ms`);
    console.log(`⚡ Avg Activation: ${summary.avgActivationTime}ms`);
    console.log(`📈 Avg Total: ${summary.avgTotalTime}ms`);
    console.log(`📁 Resultados guardados en: ${RESULTS_PATH}\n`);
  }
}

// Función para ejecutar plan detection
async function runPlanDetection(plan, test, monitor) {
  const startTime = Date.now();
  try {
    const { spawn } = await import('child_process');
    const { stdout } = await new Promise((resolve, reject) => {
      const process = spawn('node', [PLAN_DETECTOR_PATH, plan.description]);
      let output = '';
      process.stdout.on('data', (data) => { output += data.toString(); });
      process.on('close', (code) => {
        if (code === 0) resolve({ stdout: output });
        else reject(new Error(`Process exited with code ${code}`));
      });
      process.on('error', reject);
    });

    const duration = Date.now() - startTime;

    let results;
    try {
      results = JSON.parse(stdout);
    } catch {
      results = { detected: true, skills: [], output: stdout };
    }

    test.detectionResults = results;
    monitor.addStage(test, 'detection', duration, true);

    return { success: true, results, duration };
  } catch (error) {
    const duration = Date.now() - startTime;
    monitor.addStage(test, 'detection', duration, false, error);
    return { success: false, error, duration };
  }
}

// Función para ejecutar PBv2 activation
async function runPBv2Activation(plan, test, monitor) {
  const startTime = Date.now();
  try {
    const { spawn } = await import('child_process');
    const { stdout } = await new Promise((resolve, reject) => {
      const process = spawn('node', [PBV2_ACTIVATOR_PATH, plan.description, '--verbose']);
      let output = '';
      process.stdout.on('data', (data) => { output += data.toString(); });
      process.on('close', (code) => {
        if (code === 0) resolve({ stdout: output });
        else reject(new Error(`Process exited with code ${code}`));
      });
      process.on('error', reject);
    });

    const duration = Date.now() - startTime;

    let results;
    try {
      results = JSON.parse(stdout);
    } catch {
      results = { generated: true, prompt: stdout, output: stdout };
    }

    test.pbv2Results = results;
    monitor.addStage(test, 'activation', duration, true);

    return { success: true, results, duration };
  } catch (error) {
    const duration = Date.now() - startTime;
    monitor.addStage(test, 'activation', duration, false, error);
    return { success: false, error, duration };
  }
}

// Función principal de test
async function runLiveTest(plan, monitor) {
  console.log(`🧪 Ejecutando test: ${plan.title}`);

  const test = monitor.startTest(plan.id, plan.title);

  try {
    // Stage 1: Plan Detection
    console.log(`  🔍 [1/2] Detectando plan...`);
    const detectionResult = await runPlanDetection(plan, test, monitor);

    if (!detectionResult.success) {
      throw new Error(`Detection failed: ${detectionResult.error.message}`);
    }

    // Stage 2: PBv2 Activation
    console.log(`  ⚡ [2/2] Activando PBv2...`);
    const activationResult = await runPBv2Activation(plan, test, monitor);

    if (!activationResult.success) {
      throw new Error(`Activation failed: ${activationResult.error.message}`);
    }

    // Test completado exitosamente
    monitor.endTest(test, true);
    console.log(`  ✅ Test completado (${test.totalTime}ms)`);

    return test;
  } catch (error) {
    monitor.endTest(test, false, error);
    console.log(`  ❌ Test falló: ${error.message}`);
    return test;
  }
}

// Función principal
async function main() {
  console.log('🚀 PBv2 Live Test Suite - Iniciando...\n');

  // Verificar archivos necesarios
  if (!fs.existsSync(TEST_PLANS_PATH)) {
    console.error('❌ No se encontraron test plans');
    process.exit(1);
  }

  // Cargar test plans
  const testData = JSON.parse(fs.readFileSync(TEST_PLANS_PATH, 'utf8'));
  const plans = testData.testPlans;

  console.log(`📋 Ejecutando ${plans.length} planes de prueba...\n`);

  // Ejecutar tests secuencialmente
  for (const plan of plans) {
    await runLiveTest(plan, monitor);
    console.log(); // Línea en blanco
  }

  // Guardar y mostrar resultados
  const metrics = monitor.saveResults();
  monitor.printSummary();

  // Determinar éxito general
  const successRate = metrics.summary.successful / metrics.summary.totalPlans;
  process.exit(successRate >= 0.8 ? 0 : 1);
}

// Instanciar monitor global
const monitor = new PerformanceMonitor();

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
}

export { main, runLiveTest, PerformanceMonitor };
