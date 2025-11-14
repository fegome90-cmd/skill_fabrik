/**
 * Tests para Fase E: Prompt Builder y Contratos
 * Validan el análisis del sistema de generación de prompts y contratos
 */

const fs = require('fs');
const path = require('path');

const phaseEReport = path.join(
  __dirname,
  '../consolidated-reports/phase-e-prompts.md'
);

describe('Fase E: Prompt Builder y Contratos', () => {
  describe('Estructura del Informe', () => {
    test('El informe de Fase E debe existir', () => {
      expect(fs.existsSync(phaseEReport)).toBe(true);
    });

    test('El informe debe tener estructura completa', () => {
      if (!fs.existsSync(phaseEReport)) return;

      const content = fs.readFileSync(phaseEReport, 'utf8');

      expect(content).toMatch(/# Informe Fase E/);
      expect(content).toMatch(/## Metadata/);
      expect(content).toMatch(/## Resumen Ejecutivo/);
      expect(content).toMatch(/## Evidencia Recopilada/);
      expect(content).toMatch(/## Hallazgos Clave/);
      expect(content).toMatch(/## Validación de Calidad/);
    });

    test('El informe debe tener metadata completa', () => {
      if (!fs.existsSync(phaseEReport)) return;

      const content = fs.readFileSync(phaseEReport, 'utf8');

      expect(content).toMatch(/\*\*Fase\*\*:\s*E/);
      expect(content).toMatch(/\*\*Nombre\*\*:\s*.*Prompt/);
      expect(content).toMatch(/\*\*Fecha\*\*:\s*\d{4}-\d{2}-\d{2}/);
      expect(content).toMatch(/\*\*Status\*\*:\s*.*Completado/);
    });
  });

  describe('Análisis de Prompt Builder', () => {
    test('Debe identificar el sistema Prompt Builder', () => {
      if (!fs.existsSync(phaseEReport)) return;

      const content = fs.readFileSync(phaseEReport, 'utf8');

      expect(content).toMatch(
        /prompt.*builder|prompt.*system|prompt.*generator/i
      );
      expect(content).toMatch(/prompt|template|pattern/i);
    });

    test('Debe documentar componentes del Prompt Builder', () => {
      if (!fs.existsSync(phaseEReport)) return;

      const content = fs.readFileSync(phaseEReport, 'utf8');

      const promptComponents = [
        'generator',
        'builder',
        'template',
        'engine',
        'system'
      ];
      const foundComponents = promptComponents.filter(component =>
        content.toLowerCase().includes(component.toLowerCase())
      );

      expect(foundComponents.length).toBeGreaterThan(2);
    });

    test('Debe analizar funcionalidades del Prompt Builder', () => {
      if (!fs.existsSync(phaseEReport)) return;

      const content = fs.readFileSync(phaseEReport, 'utf8');

      expect(content).toMatch(/funcional|feature|capability|characteristic/i);
      expect(content).toMatch(/generaci|creaci|construcci/i);
    });
  });

  describe('Análisis de Contratos SKILL.md', () => {
    test('Debe identificar formato SKILL.md', () => {
      if (!fs.existsSync(phaseEReport)) return;

      const content = fs.readFileSync(phaseEReport, 'utf8');

      expect(content).toMatch(/SKILL\.md/i);
      expect(content).toMatch(/skill.*format|skill.*template/i);
    });

    test('Debe documentar estructura de contratos', () => {
      if (!fs.existsSync(phaseEReport)) return;

      const content = fs.readFileSync(phaseEReport, 'utf8');

      expect(content).toMatch(/estructura|format|template|schema/i);
      expect(content).toMatch(/contract|agreement|specification/i);
    });

    test('Debe analizar consistencia de SKILL.md', () => {
      if (!fs.existsSync(phaseEReport)) return;

      const content = fs.readFileSync(phaseEReport, 'utf8');

      expect(content).toMatch(/consistencia|consistency|standard/i);
      expect(content).toMatch(/variacion|difference|inconsistency/i);
    });
  });

  describe('Análisis de dev-docs/contracts', () => {
    test('Debe identificar dev-docs contracts', () => {
      if (!fs.existsSync(phaseEReport)) return;

      const content = fs.readFileSync(phaseEReport, 'utf8');

      expect(content).toMatch(/dev-docs/);
      expect(content).toMatch(/contracts?/i);
    });

    test('Debe documentar relación con Prompt Builder', () => {
      if (!fs.existsSync(phaseEReport)) return;

      const content = fs.readFileSync(phaseEReport, 'utf8');

      expect(content).toMatch(/relaci|relationship|connection/i);
      expect(content).toMatch(/prompt.*contract|contract.*prompt/i);
    });

    test('Debe analizar integración de contratos', () => {
      if (!fs.existsSync(phaseEReport)) return;

      const content = fs.readFileSync(phaseEReport, 'utf8');

      expect(content).toMatch(/integraci|integration|link/i);
      expect(content).toMatch(/workflow|flow|process/i);
    });
  });

  describe('Detección de Conflictos', () => {
    test('Debe identificar conflictos entre prompts y contratos', () => {
      if (!fs.existsSync(phaseEReport)) return;

      const content = fs.readFileSync(phaseEReport, 'utf8');

      expect(content).toMatch(/conflict|discrepancy|mismatch|inconsistency/i);
      expect(content).toMatch(/prompt.*contract|contract.*prompt/i);
    });

    test('Debe documentar tipos de conflictos', () => {
      if (!fs.existsSync(phaseEReport)) return;

      const content = fs.readFileSync(phaseEReport, 'utf8');

      const conflictTypes = [
        'structure',
        'format',
        'content',
        'validation',
        'specification'
      ];
      const foundTypes = conflictTypes.filter(type =>
        content.toLowerCase().includes(type.toLowerCase())
      );

      expect(foundTypes.length).toBeGreaterThan(2);
    });

    test('Debe analizar impacto de conflictos', () => {
      if (!fs.existsSync(phaseEReport)) return;

      const content = fs.readFileSync(phaseEReport, 'utf8');

      expect(content).toMatch(/impact|effect|consequence/i);
      expect(content).toMatch(/issue|problem|challenge/i);
    });
  });

  describe('Análisis de Gobernanza', () => {
    test('Debe identificar sistema de gobernanza actual', () => {
      if (!fs.existsSync(phaseEReport)) return;

      const content = fs.readFileSync(phaseEReport, 'utf8');

      expect(content).toMatch(/gobernanza|governance|control/i);
      expect(content).toMatch(/rule|policy|standard/i);
    });

    test('Debe documentar mecanismos de validación', () => {
      if (!fs.existsSync(phaseEReport)) return;

      const content = fs.readFileSync(phaseEReport, 'utf8');

      expect(content).toMatch(/validaci|validation|verification/i);
      expect(content).toMatch(/check|review|audit/i);
    });

    test('Debe analizar compliance de contratos', () => {
      if (!fs.existsSync(phaseEReport)) return;

      const content = fs.readFileSync(phaseEReport, 'utf8');

      expect(content).toMatch(/compliance|adherence|following/i);
      expect(content).toMatch(/standard|specification|requirement/i);
    });
  });

  describe('Evidencia Requerida', () => {
    test('Cada afirmación debe tener evidencia', () => {
      if (!fs.existsSync(phaseEReport)) return;

      const content = fs.readFileSync(phaseEReport, 'utf8');

      const findings = content.match(/- \*\*Hallazgo\*\*: .+/g);
      if (findings) {
        findings.forEach(finding => {
          expect(finding).toMatch(/\*\*Evidencia\*\*:/);
        });
      }
    });

    test('Debe incluir rutas específicas a archivos analizados', () => {
      if (!fs.existsSync(phaseEReport)) return;

      const content = fs.readFileSync(phaseEReport, 'utf8');

      expect(content).toMatch(/\/Users\/felipe\/Developer\/skills-fabrik\//);
    });

    test('Debe incluir conteos y métricas específicas', () => {
      if (!fs.existsSync(phaseEReport)) return;

      const content = fs.readFileSync(phaseEReport, 'utf8');

      // Buscar números y métricas
      const hasMetrics = content.match(
        /\d+\s*(prompts|contracts|archivos|files|skills)/i
      );
      expect(hasMetrics).toBeTruthy();
    });
  });

  describe('Calidad del Informe', () => {
    test('Debe tener formato consistente con fases anteriores', () => {
      if (!fs.existsSync(phaseEReport)) return;

      const content = fs.readFileSync(phaseEReport, 'utf8');

      expect(content).toMatch(/## Validación de Calidad/);
      expect(content).toMatch(/## Referencias Cruzadas/);
    });

    test('Debe tener longitud razonable', () => {
      if (!fs.existsSync(phaseEReport)) return;

      const content = fs.readFileSync(phaseEReport, 'utf8');
      const lines = content.split('\n').length;

      expect(lines).toBeGreaterThan(100);
      expect(lines).toBeLessThan(1000);
    });

    test('Debe tener resumen ejecutivo significativo', () => {
      if (!fs.existsSync(phaseEReport)) return;

      const content = fs.readFileSync(phaseEReport, 'utf8');
      const executiveSummary = content.match(
        /## Resumen Ejecutivo\s*\n\n([\s\S]*?)\n\n##/
      );

      if (executiveSummary && executiveSummary[1]) {
        expect(executiveSummary[1].length).toBeGreaterThan(100);
        expect(executiveSummary[1]).toMatch(
          /prompt|contract|builder|gobernanza/
        );
      }
    });
  });

  describe('Validación contra Rules', () => {
    test('Debe respetar máxima de evidencia', () => {
      if (!fs.existsSync(phaseEReport)) return;

      const content = fs.readFileSync(phaseEReport, 'utf8');

      // No debe hacer afirmaciones sin evidencia
      expect(content).not.toMatch(/afirma|sostiene|declara/i);
      expect(content).toMatch(/realmente|efectivamente|concretamente/);
    });

    test('Debe respetar máxima de claridad', () => {
      if (!fs.existsSync(phaseEReport)) return;

      const content = fs.readFileSync(phaseEReport, 'utf8');

      // Debe explicar en lenguaje claro
      expect(content).toMatch(/realmente|efectivamente|concretamente/);
    });

    test('Debe respetar máxima forense', () => {
      if (!fs.existsSync(phaseEReport)) return;

      const content = fs.readFileSync(phaseEReport, 'utf8');

      // No debe proponer cambios, solo observar
      expect(content).not.toMatch(/modific|cambi|edit|mejor|sugier/);
    });

    test('Debe referenciar dev-docs guía', () => {
      if (!fs.existsSync(phaseEReport)) return;

      const content = fs.readFileSync(phaseEReport, 'utf8');

      expect(content).toMatch(/dev-docs/);
    });
  });

  describe('Validación de Completitud', () => {
    test('Debe cubrir áreas esperadas de Fase E', () => {
      if (!fs.existsSync(phaseEReport)) return;

      const content = fs.readFileSync(phaseEReport, 'utf8');

      const expectedKeywords = [
        'prompt',
        'builder',
        'contract',
        'SKILL.md',
        'gobernanza'
      ];

      const foundKeywords = expectedKeywords.filter(keyword =>
        content.toLowerCase().includes(keyword.toLowerCase())
      );

      expect(foundKeywords.length).toBeGreaterThanOrEqual(4);
    });

    test('Debe incluir análisis de integración', () => {
      if (!fs.existsSync(phaseEReport)) return;

      const content = fs.readFileSync(phaseEReport, 'utf8');

      expect(content).toMatch(/integraci|integration|link/i);
      expect(content).toMatch(/connection|relationship|workflow/i);
    });
  });

  describe('Quality Gates Integration', () => {
    test('El informe debe estar listo para validación de calidad', () => {
      if (!fs.existsSync(phaseEReport)) return;

      const content = fs.readFileSync(phaseEReport, 'utf8');

      expect(content).toMatch(/## Validación de Calidad/);
      expect(content).toMatch(/Lint|Format|Evidence|Rules/);
    });

    test('Debe mantener integridad del repo', () => {
      if (!fs.existsSync(phaseEReport)) return;

      const content = fs.readFileSync(phaseEReport, 'utf8');

      expect(content).toMatch(/100% preservada|sin modificar|integridad/);
    });
  });

  describe('Integración con Fases Anteriores', () => {
    test('Debe hacer referencia a hallazgos de Fase A', () => {
      if (!fs.existsSync(phaseEReport)) return;

      const content = fs.readFileSync(phaseEReport, 'utf8');

      expect(content).toMatch(/Fase A|inventario|paquetes|skills/);
    });

    test('Debe hacer referencia a hallazgos de Fase B', () => {
      if (!fs.existsSync(phaseEReport)) return;

      const content = fs.readFileSync(phaseEReport, 'utf8');

      expect(content).toMatch(/Fase B|responsabilidades|daemon/);
    });

    test('Debe hacer referencia a hallazgos de Fase C', () => {
      if (!fs.existsSync(phaseEReport)) return;

      const content = fs.readFileSync(phaseEReport, 'utf8');

      expect(content).toMatch(/Fase C|testing|calidad/);
    });

    test('Debe hacer referencia a hallazgos de Fase D', () => {
      if (!fs.existsSync(phaseEReport)) return;

      const content = fs.readFileSync(phaseEReport, 'utf8');

      expect(content).toMatch(/Fase D|runtime|CLI|scripts/);
    });

    test('Debe integrar con conocimiento existente', () => {
      if (!fs.existsSync(phaseEReport)) return;

      const content = fs.readFileSync(phaseEReport, 'utf8');

      expect(content).toMatch(/componente|área|análisis/);
    });
  });

  describe('Análisis Específico Prompts', () => {
    test('Debe identificar tipos de prompts', () => {
      if (!fs.existsSync(phaseEReport)) return;

      const content = fs.readFileSync(phaseEReport, 'utf8');

      expect(content).toMatch(/tipo|type|category|class/i);
      expect(content).toMatch(/prompt.*template|prompt.*pattern/i);
    });

    test('Debe documentar proceso de generación', () => {
      if (!fs.existsSync(phaseEReport)) return;

      const content = fs.readFileSync(phaseEReport, 'utf8');

      expect(content).toMatch(/proceso|process|workflow/i);
      expect(content).toMatch(/generaci|generation|creation/i);
    });

    test('Debe analizar calidad de prompts', () => {
      if (!fs.existsSync(phaseEReport)) return;

      const content = fs.readFileSync(phaseEReport, 'utf8');

      expect(content).toMatch(/calidad|quality|standard/i);
      expect(content).toMatch(/validaci|validation|review/i);
    });
  });

  describe('Análisis Específico Contratos', () => {
    test('Debe documentar estructura de SKILL.md', () => {
      if (!fs.existsSync(phaseEReport)) return;

      const content = fs.readFileSync(phaseEReport, 'utf8');

      expect(content).toMatch(/estructura|structure|format/i);
      expect(content).toMatch(/skill.*md|markdown/i);
    });

    test('Debe identificar campos obligatorios', () => {
      if (!fs.existsSync(phaseEReport)) return;

      const content = fs.readFileSync(phaseEReport, 'utf8');

      expect(content).toMatch(/obligatori|required|mandatory/i);
      expect(content).toMatch(/field|attribute|property/i);
    });

    test('Debe analizar validación de contratos', () => {
      if (!fs.existsSync(phaseEReport)) return;

      const content = fs.readFileSync(phaseEReport, 'utf8');

      expect(content).toMatch(/validaci|validation|check/i);
      expect(content).toMatch(/contract.*validation|skill.*validation/i);
    });
  });
});
