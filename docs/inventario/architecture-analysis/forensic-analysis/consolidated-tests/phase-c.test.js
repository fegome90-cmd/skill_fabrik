/**
 * Tests para Fase C: Testing, Calidad y Errores
 * Validan el análisis de testing existente, cobertura y deuda técnica
 */

const fs = require('fs');
const path = require('path');

const phaseCReport = path.join(
  __dirname,
  '../consolidated-reports/phase-c-testing.md'
);

describe('Fase C: Testing, Calidad y Errores', () => {
  describe('Estructura del Informe', () => {
    test('El informe de Fase C debe existir', () => {
      expect(fs.existsSync(phaseCReport)).toBe(true);
    });

    test('El informe debe tener estructura completa', () => {
      if (!fs.existsSync(phaseCReport)) return;

      const content = fs.readFileSync(phaseCReport, 'utf8');

      expect(content).toMatch(/# Informe Fase C/);
      expect(content).toMatch(/## Metadata/);
      expect(content).toMatch(/## Resumen Ejecutivo/);
      expect(content).toMatch(/## Evidencia Recopilada/);
      expect(content).toMatch(/## Hallazgos Clave/);
      expect(content).toMatch(/## Validación de Calidad/);
    });

    test('El informe debe tener metadata completa', () => {
      if (!fs.existsSync(phaseCReport)) return;

      const content = fs.readFileSync(phaseCReport, 'utf8');

      expect(content).toMatch(/\*\*Fase\*\*:\s*C/);
      expect(content).toMatch(/\*\*Nombre\*\*:\s*.*Testing/);
      expect(content).toMatch(/\*\*Fecha\*\*:\s*\d{4}-\d{2}-\d{2}/);
      expect(content).toMatch(/\*\*Status\*\*:\s*.*Completado/);
    });
  });

  describe('Análisis de Testing', () => {
    test('Debe identificar tests existentes en el repo', () => {
      if (!fs.existsSync(phaseCReport)) return;

      const content = fs.readFileSync(phaseCReport, 'utf8');

      expect(content).toMatch(/test|spec|jest|playwright/);
      expect(content).toMatch(/\.test\.|\.spec\./);
    });

    test('Debe documentar tipos de tests encontrados', () => {
      if (!fs.existsSync(phaseCReport)) return;

      const content = fs.readFileSync(phaseCReport, 'utf8');

      const testTypes = [
        'unit',
        'integration',
        'e2e',
        'functional',
        'jest',
        'playwright'
      ];
      const foundTypes = testTypes.filter(type =>
        content.toLowerCase().includes(type.toLowerCase())
      );

      expect(foundTypes.length).toBeGreaterThan(2);
    });

    test('Debe analizar cobertura por componente', () => {
      if (!fs.existsSync(phaseCReport)) return;

      const content = fs.readFileSync(phaseCReport, 'utf8');

      expect(content).toMatch(/cobertura|coverage/);
      expect(content).toMatch(/packages\/|skills\/|components\//);
    });
  });

  describe('Detección de Deuda Técnica', () => {
    test('Debe identificar TODO/FIXME/HACK', () => {
      if (!fs.existsSync(phaseCReport)) return;

      const content = fs.readFileSync(phaseCReport, 'utf8');

      expect(content).toMatch(/TODO|FIXME|HACK|XXX/);
    });

    test('Debe documentar ubicación de debt markers', () => {
      if (!fs.existsSync(phaseCReport)) return;

      const content = fs.readFileSync(phaseCReport, 'utf8');

      expect(content).toMatch(/\/Users\/felipe\/Developer\/skills-fabrik\//);
      expect(content).toMatch(/\.js|\.ts|\.tsx/);
    });

    test('Debe categorizar severidad de deuda técnica', () => {
      if (!fs.existsSync(phaseCReport)) return;

      const content = fs.readFileSync(phaseCReport, 'utf8');

      const severityKeywords = [
        'crítico',
        'alto',
        'medio',
        'bajo',
        'blocker',
        'major',
        'minor'
      ];
      const foundSeverity = severityKeywords.filter(keyword =>
        content.toLowerCase().includes(keyword.toLowerCase())
      );

      expect(foundSeverity.length).toBeGreaterThan(0);
    });
  });

  describe('Análisis de Calidad', () => {
    test('Debe identificar áreas sin pruebas', () => {
      if (!fs.existsSync(phaseCReport)) return;

      const content = fs.readFileSync(phaseCReport, 'utf8');

      expect(content).toMatch(/sin pruebas|untested|no coverage/);
      expect(content).toMatch(/components?|paquetes?/);
    });

    test('Debe analizar calidad de tests existentes', () => {
      if (!fs.existsSync(phaseCReport)) return;

      const content = fs.readFileSync(phaseCReport, 'utf8');

      const qualityKeywords = [
        'test quality',
        'test coverage',
        'test maintainability',
        'test design'
      ];
      const foundQuality = qualityKeywords.filter(keyword =>
        content.toLowerCase().includes(keyword.toLowerCase())
      );

      expect(foundQuality.length).toBeGreaterThan(0);
    });

    test('Debe detectar patrones de testing', () => {
      if (!fs.existsSync(phaseCReport)) return;

      const content = fs.readFileSync(phaseCReport, 'utf8');

      const patterns = [
        'describe',
        'it',
        'test',
        'expect',
        'should',
        'when',
        'given'
      ];
      const foundPatterns = patterns.filter(pattern =>
        content.toLowerCase().includes(pattern.toLowerCase())
      );

      expect(foundPatterns.length).toBeGreaterThan(3);
    });
  });

  describe('Evidencia Requerida', () => {
    test('Cada afirmación debe tener evidencia', () => {
      if (!fs.existsSync(phaseCReport)) return;

      const content = fs.readFileSync(phaseCReport, 'utf8');

      const findings = content.match(/- \*\*Hallazgo\*\*: .+/g);
      if (findings) {
        findings.forEach(finding => {
          expect(finding).toMatch(/\*\*Evidencia\*\*:/);
        });
      }
    });

    test('Debe incluir rutas específicas a archivos analizados', () => {
      if (!fs.existsSync(phaseCReport)) return;

      const content = fs.readFileSync(phaseCReport, 'utf8');

      expect(content).toMatch(/\/Users\/felipe\/Developer\/skills-fabrik\//);
    });

    test('Debe incluir conteos y métricas específicas', () => {
      if (!fs.existsSync(phaseCReport)) return;

      const content = fs.readFileSync(phaseCReport, 'utf8');

      // Buscar números y métricas
      const hasMetrics = content.match(
        /\d+\s*(tests?|archivos|líneas|componentes|TODO|FIXME)/i
      );
      expect(hasMetrics).toBeTruthy();
    });
  });

  describe('Calidad del Informe', () => {
    test('Debe tener formato consistente con fases anteriores', () => {
      if (!fs.existsSync(phaseCReport)) return;

      const content = fs.readFileSync(phaseCReport, 'utf8');

      expect(content).toMatch(/## Validación de Calidad/);
      expect(content).toMatch(/## Referencias Cruzadas/);
    });

    test('Debe tener longitud razonable', () => {
      if (!fs.existsSync(phaseCReport)) return;

      const content = fs.readFileSync(phaseCReport, 'utf8');
      const lines = content.split('\n').length;

      expect(lines).toBeGreaterThan(100);
      expect(lines).toBeLessThan(1000);
    });

    test('Debe tener resumen ejecutivo significativo', () => {
      if (!fs.existsSync(phaseCReport)) return;

      const content = fs.readFileSync(phaseCReport, 'utf8');
      const executiveSummary = content.match(
        /## Resumen Ejecutivo\s*\n\n([\s\S]*?)\n\n##/
      );

      if (executiveSummary && executiveSummary[1]) {
        expect(executiveSummary[1].length).toBeGreaterThan(100);
        expect(executiveSummary[1]).toMatch(/tests?|testing|calidad|deuda/);
      }
    });
  });

  describe('Validación contra Rules', () => {
    test('Debe respetar máxima de evidencia', () => {
      if (!fs.existsSync(phaseCReport)) return;

      const content = fs.readFileSync(phaseCReport, 'utf8');

      // No debe hacer afirmaciones sin evidencia
      expect(content).not.toMatch(/afirma|sostiene|declara/i);
      expect(content).toMatch(/realmente|efectivamente|concretamente/);
    });

    test('Debe respetar máxima de claridad', () => {
      if (!fs.existsSync(phaseCReport)) return;

      const content = fs.readFileSync(phaseCReport, 'utf8');

      // Debe explicar en lenguaje claro
      expect(content).toMatch(/realmente|efectivamente|concretamente/);
    });

    test('Debe respetar máxima forense', () => {
      if (!fs.existsSync(phaseCReport)) return;

      const content = fs.readFileSync(phaseCReport, 'utf8');

      // No debe proponer cambios, solo observar
      // Patrones que indican propuestas de cambios (más específicos)
      expect(content).not.toMatch(
        /debería\s+modific|se\s+recomienda|podría\s+cambi|es\s+recomendable|se\s+sugiere|sugerimos/i
      );
    });

    test('Debe referenciar dev-docs guía', () => {
      if (!fs.existsSync(phaseCReport)) return;

      const content = fs.readFileSync(phaseCReport, 'utf8');

      expect(content).toMatch(/dev-docs/);
    });
  });

  describe('Validación de Completitud', () => {
    test('Debe cubrir áreas esperadas de Fase C', () => {
      if (!fs.existsSync(phaseCReport)) return;

      const content = fs.readFileSync(phaseCReport, 'utf8');

      const expectedKeywords = [
        'testing',
        'calidad',
        'tests',
        'cobertura',
        'deuda'
      ];

      const foundKeywords = expectedKeywords.filter(keyword =>
        content.toLowerCase().includes(keyword.toLowerCase())
      );

      expect(foundKeywords.length).toBeGreaterThanOrEqual(4);
    });

    test('Debe incluir recomendaciones basadas en evidencia', () => {
      if (!fs.existsSync(phaseCReport)) return;

      const content = fs.readFileSync(phaseCReport, 'utf8');

      // El análisis debe llevar a conclusiones claras
      expect(content).toMatch(/conclusión|recomendación|análisis|hallazgo/);
    });
  });

  describe('Quality Gates Integration', () => {
    test('El informe debe estar listo para validación de calidad', () => {
      if (!fs.existsSync(phaseCReport)) return;

      const content = fs.readFileSync(phaseCReport, 'utf8');

      expect(content).toMatch(/## Validación de Calidad/);
      expect(content).toMatch(/Lint|Format|Evidence|Rules/);
    });

    test('Debe mantener integridad del repo', () => {
      if (!fs.existsSync(phaseCReport)) return;

      const content = fs.readFileSync(phaseCReport, 'utf8');

      expect(content).toMatch(/100% preservada|sin modificar|integridad/);
    });
  });

  describe('Integración con Fases Anteriores', () => {
    test('Debe hacer referencia a hallazgos de Fase A', () => {
      if (!fs.existsSync(phaseCReport)) return;

      const content = fs.readFileSync(phaseCReport, 'utf8');

      expect(content).toMatch(/Fase A|inventario|paquetes|router|daemon/);
    });

    test('Debe hacer referencia a hallazgos de Fase B', () => {
      if (!fs.existsSync(phaseCReport)) return;

      const content = fs.readFileSync(phaseCReport, 'utf8');

      expect(content).toMatch(/Fase B|responsabilidades|solapamiento/);
    });

    test('Debe integrar con conocimiento existente', () => {
      if (!fs.existsSync(phaseCReport)) return;

      const content = fs.readFileSync(phaseCReport, 'utf8');

      expect(content).toMatch(/componente|área|análisis/);
    });
  });
});
