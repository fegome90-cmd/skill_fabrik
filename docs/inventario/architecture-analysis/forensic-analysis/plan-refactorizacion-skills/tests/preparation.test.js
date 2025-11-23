/**
 * Preparation Tests - Tests básicos para la fase de preparación
 *
 * Tests para validar la infraestructura de preparación para refactorización
 */

const fs = require('fs');
const path = require('path');

describe('Preparation Infrastructure Tests', () => {
  test('debe tener directorio de configuración', () => {
    expect(fs.existsSync('./config')).toBe(true);
  });

  test('debe tener rules_refact.json', () => {
    expect(fs.existsSync('./config/rules_refact.json')).toBe(true);
  });

  test('debe tener directorio dev-docs', () => {
    expect(fs.existsSync('./dev-docs')).toBe(true);
  });

  test('debe tener archivos de documentación básica', () => {
    const requiredDocs = [
      './dev-docs/README.md',
      './dev-docs/context.md',
      './dev-docs/plan.md',
      './dev-docs/tasks.md'
    ];

    requiredDocs.forEach(doc => {
      expect(fs.existsSync(doc)).toBe(true);
    });
  });

  test('debe tener directorio src/validation', () => {
    expect(fs.existsSync('./src/validation')).toBe(true);
  });

  test('debe tener scripts de validación', () => {
    const validationScripts = [
      './src/validation/preparation-validator.js',
      './src/validation/gates-checker.js'
    ];

    validationScripts.forEach(script => {
      expect(fs.existsSync(script)).toBe(true);
    });
  });
});
