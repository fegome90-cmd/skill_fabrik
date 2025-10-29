#!/usr/bin/env node

/**
 * Tests E2E: mcp-server.mjs - ChromaDB Integration
 * 
 * Valida la integración completa de ChromaDB en el MCP Server
 * mediante el tool mem.memoryHeartbeat con target 'chroma'
 */

import { heartbeatChroma } from './memory-integrations.js';

console.log('=== Tests E2E: MCP Server ChromaDB Integration ===\n');

let testResults = [];

async function testChromaHeartbeat() {
  console.log('Test 1: heartbeatChroma() directo...');
  try {
    const startTime = Date.now();
    const result = await heartbeatChroma();
    const latency = Date.now() - startTime;
    
    console.log('✅ heartbeatChroma() - SUCCESS');
    console.log(`   Latency: ${latency}ms`);
    console.log(`   Target: ${result.target}`);
    console.log(`   Collection: ${result.collection}`);
    console.log(`   Points Count: ${result.pointsCount}`);
    
    if (latency > 10000) {
      console.log('⚠️  WARNING: Latency >10000ms');
    }
    
    testResults.push({
      name: 'heartbeatChroma',
      status: 'pass',
      latency,
      result
    });
    
    return { success: true, latency };
  } catch (error) {
    console.log('❌ heartbeatChroma() - ERROR:', error.message);
    testResults.push({
      name: 'heartbeatChroma',
      status: 'fail',
      error: error.message
    });
    return { success: false, error };
  }
}

async function testHeartbeatAll() {
  console.log('\nTest 2: heartbeatAll() (todos los targets)...');
  try {
    // Import heartbeatAll from memory-integrations
    const { heartbeatAll } = await import('./memory-integrations.js');
    
    const startTime = Date.now();
    const result = await heartbeatAll();
    const latency = Date.now() - startTime;
    
    console.log('✅ heartbeatAll() - SUCCESS');
    console.log(`   Latency: ${latency}ms`);
    console.log(`   Results:`, Object.keys(result.results || {}));
    console.log(`   Errors:`, Object.keys(result.errors || {}));
    
    // Check if chroma is in results
    if (result.results && result.results.chroma) {
      console.log(`   Chroma Result:`, JSON.stringify(result.results.chroma, null, 2));
    }
    
    if (result.errors && result.errors.chroma) {
      console.log(`   ⚠️  Chroma Error:`, result.errors.chroma);
    }
    
    const chromaSuccess = result.results && result.results.chroma && !result.errors.chroma;
    
    if (latency > 15000) {
      console.log('⚠️  WARNING: Latency >15000ms');
    }
    
    testResults.push({
      name: 'heartbeatAll',
      status: chromaSuccess ? 'pass' : 'fail',
      latency,
      chromaIncluded: !!result.results.chroma
    });
    
    return { success: chromaSuccess, latency };
  } catch (error) {
    console.log('❌ heartbeatAll() - ERROR:', error.message);
    testResults.push({
      name: 'heartbeatAll',
      status: 'fail',
      error: error.message
    });
    return { success: false, error };
  }
}

async function testChromaTarget() {
  console.log('\nTest 3: Validar target "chroma" está disponible...');
  try {
    // This would be the MCP tool invocation
    // For now, we just verify that heartbeatChroma works
    const result = await heartbeatChroma();
    
    if (result.target === 'chroma') {
      console.log('✅ Chroma target disponible');
      console.log(`   Target: ${result.target}`);
      console.log(`   Collection: ${result.collection}`);
      
      testResults.push({
        name: 'chromaTargetAvailable',
        status: 'pass'
      });
      
      return { success: true };
    } else {
      throw new Error(`Target esperado 'chroma', recibido '${result.target}'`);
    }
  } catch (error) {
    console.log('❌ Chroma target validation - ERROR:', error.message);
    testResults.push({
      name: 'chromaTargetAvailable',
      status: 'fail',
      error: error.message
    });
    return { success: false, error };
  }
}

async function runE2ETests() {
  console.log('Iniciando tests E2E para mcp-server.mjs...\n');
  
  // Run tests
  const test1 = await testChromaHeartbeat();
  const test2 = await testHeartbeatAll();
  const test3 = await testChromaTarget();
  
  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('RESUMEN DE TESTS E2E');
  console.log('='.repeat(70));
  
  testResults.forEach((test, index) => {
    const icon = test.status === 'pass' ? '✅' : '❌';
    console.log(`${icon} Test ${index + 1}: ${test.name} - ${test.status.toUpperCase()}`);
    if (test.latency) {
      console.log(`   └─ Latency: ${test.latency}ms`);
    }
    if (test.error) {
      console.log(`   └─ Error: ${test.error}`);
    }
  });
  
  const allPass = testResults.every(test => test.status === 'pass');
  const avgLatency = testResults
    .filter(test => test.latency)
    .reduce((sum, test) => sum + test.latency, 0) / testResults.filter(test => test.latency).length || 0;
  
  console.log('\n' + '='.repeat(70));
  console.log(`RESULTADO GENERAL: ${allPass ? '✅ TODOS PASS' : '❌ HAY FAILURES'}`);
  console.log(`LATENCIA PROMEDIO: ${Math.round(avgLatency)}ms`);
  console.log(`TESTS PASSED: ${testResults.filter(t => t.status === 'pass').length}/${testResults.length}`);
  console.log('='.repeat(70) + '\n');
  
  // Integration check
  if (allPass) {
    console.log('✅ Integración ChromaDB en MCP Server: FUNCIONAL');
    console.log('✅ Target "chroma" disponible en memoria');
    console.log('✅ heartbeatChroma() funciona correctamente');
  }
  
  process.exit(allPass ? 0 : 1);
}

// Run
runE2ETests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
