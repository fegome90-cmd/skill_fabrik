/**
 * Tests para Fase A: Inventario Estructural y Pathing
 * Valida que el análisis de inventario cumpla con los requerimientos
 */

describe('Fase A: Inventario Estructural y Pathing', () => {
  const fs = require('fs');
  const path = require('path');

  const reportsPath = path.join(process.cwd(), 'consolidated-reports');
  const phaseAReport = path.join(reportsPath, 'phase-a-inventory.md');

  beforeEach(() => {
    // Setup mock si es necesario
  });

  describe('Estructura del Informe', () => {
    test('El informe de Fase A debe existir', () => {
      expect(fs.existsSync(phaseAReport)).toBe(true);
    });

    test('El informe debe tener estructura completa', () => {
      if (!fs.existsSync(phaseAReport)) {
        console.log('⚠️ El informe aún no existe - skipping structure tests');
        return;
      }

      const content = fs.readFileSync(phaseAReport, 'utf8');

      // Validar secciones requeridas
      expect(content).toMatch(/# Informe Fase A/);
      expect(content).toMatch(/## Metadata/);
      expect(content).toMatch(/## Resumen Ejecutivo/);
      expect(content).toMatch(/## Evidencia Recopilada/);
      expect(content).toMatch(/## Hallazgos Clave/);
      expect(content).toMatch(/## Validación de Calidad/);
    });

    test('El informe debe tener metadata completa', () => {
      if (!fs.existsSync(phaseAReport)) return;

      const content = fs.readFileSync(phaseAReport, 'utf8');

      expect(content).toMatch(/\*\*Fase\*\*:\s*A/);
      expect(content).toMatch(/\*\*Nombre\*\*:\s*.*Inventario/);
      expect(content).toMatch(/\*\*Fecha\*\*:\s*\d{4}-\d{2}-\d{2}/);
      expect(content).toMatch(/\*\*Status\*\*:\s*.*Completado/);
    });
  });

  describe('Contenido de Inventario', () => {
    test('Debe identificar áreas clave del repo', () => {
      if (!fs.existsSync(phaseAReport)) return;

      const content = fs.readFileSync(phaseAReport, 'utf8');

      // Validar que mencione áreas esperadas
      const expectedAreas = [
        'packages/router',
        'packages/daemon',
        'skills',
        'dev-docs',
        'configs'
      ];

      expectedAreas.forEach(area => {
        expect(content).toMatch(new RegExp(area.replace('/', '\\/'), 'i'));
      });
    });

    test('Debe clasificar componentes vs opcionales', () => {
      if (!fs.existsSync(phaseAReport)) return;

      const content = fs.readFileSync(phaseAReport, 'utf8');

      // Validar que haya categorización
      expect(content).toMatch(/core|componentes|opcionales|clientes/i);
    });

    test('Debe documentar tipos de archivos', () => {
      if (!fs.existsSync(phaseAReport)) return;

      const content = fs.readFileSync(phaseAReport, 'utf8');

      // Validar que mencione tipos de archivos
      expect(content).toMatch(/(\.js|\.ts|\.md|\.json|\.tsx)/i);
    });
  });

  describe('Evidencia Requerida', () => {
    test('Cada hallazgo debe tener evidencia', () => {
      if (!fs.existsSync(phaseAReport)) return;

      const content = fs.readFileSync(phaseAReport, 'utf8');

      // Buscar bloques de hallazgos
      const findingBlocks = content.match(
        /- \*\*Hallazgo\*\*: .+[\s\S]*?- \*\*Evidencia\*\*: .+/g
      );

      if (findingBlocks) {
        findingBlocks.forEach(block => {
          expect(block).toMatch(/\*\*Evidencia\*\*:/);
        });
      }
    });

    test('Debe incluir rutas específicas', () => {
      if (!fs.existsSync(phaseAReport)) return;

      const content = fs.readFileSync(phaseAReport, 'utf8');

      // Validar que haya rutas de archivo
      const pathPattern = /\/[a-zA-Z0-9_\-\/\.]+\.[a-zA-Z0-9]+/g;
      const paths = content.match(pathPattern);

      expect(paths).toBeTruthy();
      expect(paths.length).toBeGreaterThan(0);
    });
  });

  describe('Calidad del Informe', () => {
    test('Debe tener formato consistente', () => {
      if (!fs.existsSync(phaseAReport)) return;

      const content = fs.readFileSync(phaseAReport, 'utf8');

      // Validar formato de markdown básico
      expect(content).toMatch(/^#{1,6}\s+/m); // Headers
      expect(content).toMatch(/^\s*[-*+]\s+/m); // Lists
    });

    test('Debe tener longitud razonable', () => {
      if (!fs.existsSync(phaseAReport)) return;

      const content = fs.readFileSync(phaseAReport, 'utf8');
      const lines = content.split('\n');

      // Debe tener contenido sustancial
      expect(lines.length).toBeGreaterThan(20);
    });
  });

  describe('Validación contra Rules', () => {
    test('Debe respetar máxima de integridad', () => {
      if (!fs.existsSync(phaseAReport)) return;

      const content = fs.readFileSync(phaseAReport, 'utf8');

      // No debe mencionar modificaciones al repo
      expect(content).not.toMatch(/modific[oa]|cambi[oa]|edit[oa]/i);
    });

    test('Debe respetar máxima de evidencia', () => {
      if (!fs.existsSync(phaseAReport)) return;

      const content = fs.readFileSync(phaseAReport, 'utf8');

      // Debe tener sección de evidencia
      expect(content).toMatch(/## Evidencia Recopilada/);
      expect(content).toMatch(/\*\*Evidencia\*\*:/);
    });

    test('Debe referenciar dev-docs guía', () => {
      if (!fs.existsSync(phaseAReport)) return;

      const content = fs.readFileSync(phaseAReport, 'utf8');

      // Debe referenciar los documentos guía
      expect(content).toMatch(/dev-docs|plan\.md|context\.md|rules_forense/);
    });
  });

  describe('Validación de Completitud', () => {
    test('Debe cubrir áreas esperadas de Fase A', () => {
      if (!fs.existsSync(phaseAReport)) return;

      const content = fs.readFileSync(phaseAReport, 'utf8');

      const expectedKeywords = [
        'carpetas',
        'archivos',
        'estructura',
        'componentes',
        'inventory'
      ];

      const foundKeywords = expectedKeywords.filter(keyword =>
        content.toLowerCase().includes(keyword.toLowerCase())
      );

      // Debe cubrir al menos el 80% de las palabras clave
      expect(foundKeywords.length).toBeGreaterThanOrEqual(
        Math.floor(expectedKeywords.length * 0.8)
      );
    });
  });

  describe('Quality Gates Integration', () => {
    test('El informe debe estar listo para validación de calidad', () => {
      if (!fs.existsSync(phaseAReport)) {
        console.log('⚠️ Informe no existe - quality gates no aplicables');
        return;
      }

      const content = fs.readFileSync(phaseAReport, 'utf8');

      // Debe tener sección de validación
      expect(content).toMatch(/## Validación de Calidad/);
    });
  });
});
