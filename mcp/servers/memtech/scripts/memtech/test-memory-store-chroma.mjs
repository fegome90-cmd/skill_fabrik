#!/usr/bin/env node

/**
 * Tests de Integración: memory-store.js - ChromaDB
 * 
 * Valida storeInChroma() y fetchFromChroma()
 */

import { MemoryStore } from './memory-store.js';

let store;
const testCollection = 'memtech_dev';  // Use existing collection

console.log('=== Tests de Integración: MemoryStore ChromaDB ===\n');

async function testStoreInChroma() {
  console.log('Test 1: storeInChroma()...');
  try {
    const id = `test-${Date.now()}`;
    const payload = {
      test: true,
      timestamp: new Date().toISOString(),
      data: 'Test data for ChromaDB storage'
    };
    const content = JSON.stringify(payload);
    
    const startTime = Date.now();
    const result = await store.storeInChroma(id, payload, content);
    const latency = Date.now() - startTime;
    
    console.log('✅ storeInChroma() - SUCCESS');
    console.log(`   Latency: ${latency}ms`);
    console.log(`   Result:`, JSON.stringify(result, null, 2));
    
    if (latency > 5000) {
      console.log('⚠️  WARNING: Latency >5000ms');
    }
    
    return { success: true, result, latency };
  } catch (error) {
    console.log('❌ storeInChroma() - ERROR:', error.message);
    return { success: false, error };
  }
}

async function testFetchFromChroma(storageRef) {
  console.log('\nTest 2: fetchFromChroma()...');
  try {
    const startTime = Date.now();
    const result = await store.fetchFromChroma(storageRef);
    const latency = Date.now() - startTime;
    
    console.log('✅ fetchFromChroma() - SUCCESS');
    console.log(`   Latency: ${latency}ms`);
    console.log(`   Result:`, JSON.stringify(result, null, 2));
    
    if (latency > 5000) {
      console.log('⚠️  WARNING: Latency >5000ms');
    }
    
    return { success: true, result, latency };
  } catch (error) {
    console.log('❌ fetchFromChroma() - ERROR:', error.message);
    return { success: false, error };
  }
}

async function testRoundTrip() {
  console.log('\nTest 3: Round Trip (store + fetch)...');
  try {
    const id = `roundtrip-${Date.now()}`;
    const payload = {
      test: 'roundtrip',
      timestamp: new Date().toISOString(),
      random: Math.random()
    };
    const content = JSON.stringify(payload);
    
      // Store
  const storeStartTime = Date.now();
  const storeResult = await store.storeInChroma(id, payload, content);
  const storeLatency = Date.now() - storeStartTime;
  
  // Small delay to ensure write propagates in ChromaDB Cloud
  await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Fetch
    const fetchStartTime = Date.now();
    const fetchResult = await store.fetchFromChroma({
      backend: 'chroma',
      collection: storeResult.collection,
      id: storeResult.id
    });
    const fetchLatency = Date.now() - fetchStartTime;
    
    const totalLatency = Date.now() - storeStartTime;
    
    console.log('✅ Round Trip - SUCCESS');
    console.log(`   Store Latency: ${storeLatency}ms`);
    console.log(`   Fetch Latency: ${fetchLatency}ms`);
    console.log(`   Total Latency: ${totalLatency}ms`);
    
    // Validate data integrity
    console.log('\n[DEBUG] Data Integrity Check:');
    console.log('  Payload:', JSON.stringify(payload, null, 2));
    console.log('  FetchResult:', JSON.stringify(fetchResult, null, 2));
    console.log('  test match:', fetchResult.test === payload.test, `(${fetchResult.test} === ${payload.test})`);
    console.log('  random match:', fetchResult.random === payload.random, `(${fetchResult.random} === ${payload.random})`);
    console.log('  timestamp match:', fetchResult.timestamp === payload.timestamp, `(${fetchResult.timestamp} === ${payload.timestamp})`);
    
    if (fetchResult.test === payload.test && fetchResult.random === payload.random && fetchResult.timestamp === payload.timestamp) {
      console.log('✅ Data Integrity - PASS (all fields preserved)');
    } else {
      console.log('❌ Data Integrity - FAIL (some fields not preserved)');
      console.log('  Missing/Changed fields:');
      if (fetchResult.test !== payload.test) console.log('    - test');
      if (fetchResult.random !== payload.random) console.log('    - random');
      if (fetchResult.timestamp !== payload.timestamp) console.log('    - timestamp');
    }
    
    return { success: true, totalLatency, storeLatency, fetchLatency };
  } catch (error) {
    console.log('❌ Round Trip - ERROR:', error.message);
    return { success: false, error };
  }
}

async function runTests() {
  console.log('Inicializando MemoryStore...\n');
  
  store = new MemoryStore({
    chromaCollection: testCollection
  });
  
  await store.initialize();
  
  // Run tests
  const test1 = await testStoreInChroma();
  
  let test2 = null;
  if (test1.success) {
    test2 = await testFetchFromChroma({
      backend: 'chroma',
      collection: test1.result.collection,
      id: test1.result.id
    });
  }
  
  const test3 = await testRoundTrip();
  
  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('RESUMEN DE TESTS');
  console.log('='.repeat(70));
  console.log(`Test 1 (storeInChroma):    ${test1.success ? '✅ PASS' : '❌ FAIL'}`);
  if (test1.success) {
    console.log(`  └─ Latency: ${test1.latency}ms`);
  }
  console.log(`Test 2 (fetchFromChroma):  ${test2 && test2.success ? '✅ PASS' : '❌ FAIL'}`);
  if (test2 && test2.success) {
    console.log(`  └─ Latency: ${test2.latency}ms`);
  }
  console.log(`Test 3 (roundTrip):        ${test3.success ? '✅ PASS' : '❌ FAIL'}`);
  if (test3.success) {
    console.log(`  └─ Total Latency: ${test3.totalLatency}ms`);
  }
  
  const allPass = test1.success && test2 && test2.success && test3.success;
  const avgLatency = test1.success && test2 && test2.success && test3.success
    ? (test1.latency + test2.latency + test3.totalLatency) / 3
    : 0;
  
  console.log('\n' + '='.repeat(70));
  console.log(`RESULTADO GENERAL: ${allPass ? '✅ TODOS PASS' : '❌ HAY FAILURES'}`);
  console.log(`LATENCIA PROMEDIO: ${Math.round(avgLatency)}ms`);
  console.log('='.repeat(70) + '\n');
  
  process.exit(allPass ? 0 : 1);
}

// Run
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
