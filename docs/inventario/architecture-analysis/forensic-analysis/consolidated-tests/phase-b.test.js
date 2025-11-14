/**
 * Tests para Fase B: Mapa de Responsabilidades y Arquitectura Real
 * Validan el análisis de responsabilidades reales del sistema Skills Core
 */

const fs = require('fs');
const path = require('path');

const phaseBReport = path.join(
  __dirname,
  '../consolidated-reports/phase-b-responsibilities.md'
);

describe('Fase B: Mapa de Responsabilidades y Arquitectura Real', () => {
  describe('Estructura del Informe', () => {
    test('El informe de Fase B debe existir', () => {
      expect(fs.existsSync(phaseBReport)).toBe(true);
    });

    test('El informe debe tener estructura completa', () => {
      if (!fs.existsSync(phaseBReport)) return;

      const content = fs.readFileSync(phaseBReport, 'utf8');

      expect(content).toMatch(/# Informe Fase B/);
      expect(content).toMatch(/## Metadata/);
      expect(content).toMatch(/## Resumen Ejecutivo/);
      expect(content).toMatch(/## Evidencia Recopilada/);
      expect(content).toMatch(/## Hallazgos Clave/);
      expect(content).toMatch(/## Validación de Calidad/);
    });

    test('El informe debe tener metadata completa', () => {
      if (!fs.existsSync(phaseBReport)) return;

      const content = fs.readFileSync(phaseBReport, 'utf8');

      expect(content).toMatch(/\*\*Fase\*\*:\s*B/);
      expect(content).toMatch(/\*\*Nombre\*\*:\s*.*Responsabilidades/);
      expect(content).toMatch(/\*\*Fecha\*\*:\s*\d{4}-\d{2}-\d{2}/);
      expect(content).toMatch(/\*\*Status\*\*:\s*.*Completado/);
    });
  });

  describe('Análisis de Responsabilidades', () => {
    test('Debe identificar responsabilidades reales de componentes core', () => {
      if (!fs.existsSync(phaseBReport)) return;

      const content = fs.readFileSync(phaseBReport, 'utf8');

      expect(content).toMatch(/router|daemon|skills-cli|mcp|skills/);
      expect(content).toMatch(/responsabilidad/);
    });

    test('Debe documentar dependencias y flujos', () => {
      if (!fs.existsSync(phaseBReport)) return;

      const content = fs.readFileSync(phaseBReport, 'utf8');

      expect(content).toMatch(/dependenci|flujo|interacción/);
    });

    test('Debe detectar mezclas de responsabilidades', () => {
      if (!fs.existsSync(phaseBReport)) return;

      const content = fs.readFileSync(phaseBReport, 'utf8');

      expect(content).toMatch(/solapamient|mezcla|mixing|duplicaci/);
    });
  });

  describe('Evidencia Requerida', () => {
    test('Cada afirmación de responsabilidad debe tener evidencia', () => {
      if (!fs.existsSync(phaseBReport)) return;

      const content = fs.readFileSync(phaseBReport, 'utf8');

      const findings = content.match(/- \*\*Hallazgo\*\*: .+/g);
      if (findings) {
        findings.forEach(finding => {
          expect(finding).toMatch(/\*\*Evidencia\*\*:/);
        });
      }
    });

    test('Debe incluir rutas específicas a archivos analizados', () => {
      if (!fs.existsSync(phaseBReport)) return;

      const content = fs.readFileSync(phaseBReport, 'utf8');

      expect(content).toMatch(/\/Users\/felipe\/Developer\/skills-fabrik\//);
    });
  });

  describe('Calidad del Informe', () => {
    test('Debe tener formato consistente con Fase A', () => {
      if (!fs.existsSync(phaseBReport)) return;

      const content = fs.readFileSync(phaseBReport, 'utf8');

      expect(content).toMatch(/## Validación de Calidad/);
      expect(content).toMatch(/## Referencias Cruzadas/);
    });

    test('Debe tener longitud razonable', () => {
      if (!fs.existsSync(phaseBReport)) return;

      const content = fs.readFileSync(phaseBReport, 'utf8');
      const lines = content.split('\n').length;

      expect(lines).toBeGreaterThan(100);
      expect(lines).toBeLessThan(1000);
    });
  });

  describe('Validación contra Rules', () => {
    test('Debe respetar máxima de evidencia', () => {
      if (!fs.existsSync(phaseBReport)) return;

      const content = fs.readFileSync(phaseBReport, 'utf8');

      // No debe hacer afirmaciones sin evidencia
      expect(content).not.toMatch(/afirma|sostiene|declara/i);
      expect(content).toMatch(/realmente|efectivamente|concretamente/);
    });

    test('Debe respetar máxima de claridad', () => {
      if (!fs.existsSync(phaseBReport)) return;

      const content = fs.readFileSync(phaseBReport, 'utf8');

      // Debe explicar en lenguaje claro
      expect(content).toMatch(/realmente|efectivamente|concretamente/);
    });

    test('Debe respetar máxima forense', () => {
      if (!fs.existsSync(phaseBReport)) return;

      const content = fs.readFileSync(phaseBReport, 'utf8');

      // No debe proponer cambios, solo observar
      expect(content).not.toMatch(/modific|cambi|edit|mejor|sugier/);
    });

    test('Debe referenciar dev-docs guía', () => {
      if (!fs.existsSync(phaseBReport)) return;

      const content = fs.readFileSync(phaseBReport, 'utf8');

      expect(content).toMatch(/dev-docs/);
    });
  });

  describe('Validación de Completitud', () => {
    test('Debe cubrir áreas esperadas de Fase B', () => {
      if (!fs.existsSync(phaseBReport)) return;

      const content = fs.readFileSync(phaseBReport, 'utf8');

      const expectedKeywords = [
        'responsabilidades',
        'dependencias',
        'arquitectura',
        'solapamiento',
        'componentes'
      ];

      const foundKeywords = expectedKeywords.filter(keyword =>
        content.toLowerCase().includes(keyword.toLowerCase())
      );

      expect(foundKeywords.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Quality Gates Integration', () => {
    test('El informe debe estar listo para validación de calidad', () => {
      if (!fs.existsSync(phaseBReport)) return;

      const content = fs.readFileSync(phaseBReport, 'utf8');

      expect(content).toMatch(/## Validación de Calidad/);
      expect(content).toMatch(/Lint|Format|Evidence|Rules/);
    });
  });
});
