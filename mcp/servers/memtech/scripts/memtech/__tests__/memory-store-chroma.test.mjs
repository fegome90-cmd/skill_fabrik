/**
 * Tests de Integración: MemoryStore ChromaDB
 * 
 * Valida la integración completa de ChromaDB en MemoryStore:
 * - storeInChroma(): Almacenamiento de documentos
 * - fetchFromChroma(): Recuperación de documentos
 * - Round-trip: Preservación de data integrity
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { MemoryStore } from '../memory-store.js';

describe('MemoryStore ChromaDB Integration', () => {
  let store;
  const testCollection = 'memtech_dev'; // Usar colección existente que funciona
  
  beforeAll(async () => {
    console.log('Inicializando MemoryStore para tests...');
    store = new MemoryStore({ chromaCollection: testCollection });
    await store.initialize();
  });
  
  afterAll(async () => {
    console.log('Tests completados');
  });
  
  describe('storeInChroma()', () => {
    test('debe almacenar documento correctamente', async () => {
      const id = `test-store-${Date.now()}`;
      const payload = {
        test: true,
        timestamp: new Date().toISOString(),
        data: 'Test data for ChromaDB storage'
      };
      const content = JSON.stringify(payload);
      
      const result = await store.storeInChroma(id, payload, content);
      
      // Validaciones
      expect(result).toBeDefined();
      expect(result).toHaveProperty('backend', 'chroma');
      expect(result).toHaveProperty('collection', testCollection);
      expect(result).toHaveProperty('id', id);
      expect(result).toHaveProperty('stored_at');
      
      // Validar que stored_at es una fecha válida
      expect(new Date(result.stored_at).toString()).not.toBe('Invalid Date');
    });
    
    test('debe completar en menos de 15 segundos', async () => {
      const id = `test-latency-${Date.now()}`;
      const payload = { test: 'latency', timestamp: new Date().toISOString() };
      const content = JSON.stringify(payload);
      
      const startTime = Date.now();
      await store.storeInChroma(id, payload, content);
      const latency = Date.now() - startTime;
      
      // ChromaDB Cloud puede tener latencia variable (7-15s es aceptable)
      expect(latency).toBeLessThan(15000);
    }, 20000); // timeout de 20s para este test
    
    test('debe manejar payloads con diferentes tipos de datos', async () => {
      const id = `test-types-${Date.now()}`;
      const payload = {
        string: 'test',
        number: 42,
        float: 3.14159,
        boolean: true,
        timestamp: new Date().toISOString(),
        nested: { key: 'value' }
      };
      const content = JSON.stringify(payload);
      
      const result = await store.storeInChroma(id, payload, content);
      
      expect(result).toHaveProperty('backend', 'chroma');
      expect(result).toHaveProperty('id', id);
    });
  });
  
  describe('fetchFromChroma()', () => {
    test('debe recuperar documento almacenado', async () => {
      // Primero almacenar
      const id = `test-fetch-${Date.now()}`;
      const payload = {
        test: 'fetch',
        timestamp: new Date().toISOString(),
        data: 'Data to fetch'
      };
      const content = JSON.stringify(payload);
      
      const storeResult = await store.storeInChroma(id, payload, content);
      
      // Esperar propagación en ChromaDB Cloud
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Recuperar
      const fetchResult = await store.fetchFromChroma({
        backend: 'chroma',
        collection: storeResult.collection,
        id: storeResult.id
      });
      
      // Validaciones
      expect(fetchResult).toBeDefined();
      expect(fetchResult).toHaveProperty('test', 'fetch');
      expect(fetchResult).toHaveProperty('data', 'Data to fetch');
      expect(fetchResult).toHaveProperty('timestamp', payload.timestamp);
    });
    
    test('debe completar en menos de 15 segundos', async () => {
      // Almacenar primero
      const id = `test-fetch-latency-${Date.now()}`;
      const payload = { test: 'fetch-latency', timestamp: new Date().toISOString() };
      const storeResult = await store.storeInChroma(id, payload, JSON.stringify(payload));
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Medir latencia de fetch
      const startTime = Date.now();
      await store.fetchFromChroma({
        backend: 'chroma',
        collection: storeResult.collection,
        id: storeResult.id
      });
      const latency = Date.now() - startTime;
      
      // ChromaDB Cloud puede tener latencia variable (6-15s es aceptable)
      expect(latency).toBeLessThan(15000);
    }, 20000);
    
    test('debe lanzar error si documento no existe', async () => {
      await expect(
        store.fetchFromChroma({
          backend: 'chroma',
          collection: testCollection,
          id: 'non-existent-id-12345'
        })
      ).rejects.toThrow();
    });
  });
  
  describe('Round-trip (Data Integrity)', () => {
    test('debe preservar todos los campos del payload', async () => {
      const id = `roundtrip-${Date.now()}`;
      const payload = {
        test: 'roundtrip',
        timestamp: new Date().toISOString(),
        random: Math.random()
      };
      const content = JSON.stringify(payload);
      
      // Store
      const storeResult = await store.storeInChroma(id, payload, content);
      expect(storeResult).toHaveProperty('id', id);
      
      // Esperar propagación
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Fetch
      const fetchResult = await store.fetchFromChroma({
        backend: 'chroma',
        collection: storeResult.collection,
        id: storeResult.id
      });
      
      // Validar data integrity
      expect(fetchResult).toHaveProperty('test', payload.test);
      expect(fetchResult).toHaveProperty('timestamp', payload.timestamp);
      expect(fetchResult).toHaveProperty('random', payload.random);
      
      // Validar tipos
      expect(typeof fetchResult.test).toBe('string');
      expect(typeof fetchResult.timestamp).toBe('string');
      expect(typeof fetchResult.random).toBe('number');
    });
    
    test('debe preservar números decimales con precisión', async () => {
      const id = `precision-${Date.now()}`;
      const payload = {
        test: 'precision',
        float: 0.123456789012345,
        integer: 42,
        negative: -3.14159
      };
      
      const storeResult = await store.storeInChroma(id, payload, JSON.stringify(payload));
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const fetchResult = await store.fetchFromChroma({
        backend: 'chroma',
        collection: storeResult.collection,
        id: storeResult.id
      });
      
      expect(fetchResult.float).toBe(payload.float);
      expect(fetchResult.integer).toBe(payload.integer);
      expect(fetchResult.negative).toBe(payload.negative);
    });
    
    test('debe completar round-trip en menos de 20 segundos', async () => {
      const id = `roundtrip-latency-${Date.now()}`;
      const payload = {
        test: 'roundtrip-latency',
        timestamp: new Date().toISOString(),
        random: Math.random()
      };
      
      const startTime = Date.now();
      
      // Store
      const storeResult = await store.storeInChroma(id, payload, JSON.stringify(payload));
      
      // Esperar propagación
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Fetch
      await store.fetchFromChroma({
        backend: 'chroma',
        collection: storeResult.collection,
        id: storeResult.id
      });
      
      const totalLatency = Date.now() - startTime;
      
      expect(totalLatency).toBeLessThan(20000);
    }, 25000);
  });
  
  describe('Error Handling', () => {
    test('debe manejar errores de colección inexistente', async () => {
      await expect(
        store.fetchFromChroma({
          backend: 'chroma',
          collection: 'non_existent_collection_12345',
          id: 'test-id'
        })
      ).rejects.toThrow(/no existe|not found|Error al obtener documentos/i);
    });
    
    test('debe manejar payloads vacíos', async () => {
      const id = `empty-${Date.now()}`;
      const payload = {};
      
      const result = await store.storeInChroma(id, payload, JSON.stringify(payload));
      
      expect(result).toHaveProperty('backend', 'chroma');
      expect(result).toHaveProperty('id', id);
    });
  });
});

