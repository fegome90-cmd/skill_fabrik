#!/usr/bin/env node

import { heartbeatChroma } from './memory-integrations.js';
import { chroma } from '../../../../scripts/chroma-wrapper.mjs';

console.log('=== Recolección de Métricas: ChromaDB MCP ===\n');

const metrics = { timestamp: new Date().toISOString(), tests: {} };

async function collectHeartbeatMetrics() {
  console.log('Recolectando métricas de heartbeat...\n');
  const latencies = [];
  for (let i = 0; i < 3; i++) {
    const start = Date.now();
    try {
      await heartbeatChroma();
      latencies.push(Date.now() - start);
      console.log(`Iteración ${i + 1}: ${latencies[i]}ms`);
    } catch (error) {
      console.error(`Iteración ${i + 1} FAILED:`, error.message);
    }
    if (i < 2) await new Promise(r => setTimeout(r, 1000));
  }
  const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  metrics.tests.heartbeat = { average: Math.round(avg), min: Math.min(...latencies), max: Math.max(...latencies), latencies };
  console.log(`\nHeartbeat Average: ${Math.round(avg)}ms`);
}

async function collectConnectionMetrics() {
  console.log('\nRecolectando métricas de conexión...\n');
  const start = Date.now();
  try {
    await chroma.heartbeat();
    const latency = Date.now() - start;
    metrics.tests.connection = { success: true, latency: Math.round(latency) };
    console.log(`Conexión exitosa: ${latency}ms`);
  } catch (error) {
    metrics.tests.connection = { success: false, error: error.message };
    console.error('Conexión fallida:', error.message);
  }
}

async function collectMetrics() {
  console.log('Iniciando recolección de métricas...\n');
  await collectConnectionMetrics();
  await collectHeartbeatMetrics();
  console.log('\n' + '='.repeat(70));
  console.log('RESUMEN DE MÉTRICAS');
  console.log('='.repeat(70));
  if (metrics.tests.heartbeat) {
    console.log(`Heartbeat Average: ${metrics.tests.heartbeat.average}ms`);
    console.log(`Heartbeat Min: ${metrics.tests.heartbeat.min}ms`);
    console.log(`Heartbeat Max: ${metrics.tests.heartbeat.max}ms`);
  }
  if (metrics.tests.connection) {
    console.log(`Connection Latency: ${metrics.tests.connection.latency}ms`);
    console.log(`Connection Success: ${metrics.tests.connection.success ? 'Yes' : 'No'}`);
  }
  console.log('='.repeat(70) + '\n');
  const fs = await import('fs/promises');
  await fs.writeFile('reports/chroma-metrics.json', JSON.stringify(metrics, null, 2));
  console.log('✅ Métricas guardadas en: reports/chroma-metrics.json');
}

collectMetrics().catch(error => { console.error('Fatal error:', error); process.exit(1); });
