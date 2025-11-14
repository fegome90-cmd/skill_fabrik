/**
 * Tests para Fase D: CLI, Runtime, pm2 y Uso Real
 * Validan el análisis de scripts, configuraciones y flujos operativos
 */

const fs = require('fs');
const path = require('path');

const phaseDReport = path.join(
  __dirname,
  '../consolidated-reports/phase-d-runtime.md'
);

describe('Fase D: CLI, Runtime, pm2 y Uso Real', () => {
  describe('Estructura del Informe', () => {
    test('El informe de Fase D debe existir', () => {
      expect(fs.existsSync(phaseDReport)).toBe(true);
    });

    test('El informe debe tener estructura completa', () => {
      if (!fs.existsSync(phaseDReport)) return;

      const content = fs.readFileSync(phaseDReport, 'utf8');

      expect(content).toMatch(/# Informe Fase D/);
      expect(content).toMatch(/## Metadata/);
      expect(content).toMatch(/## Resumen Ejecutivo/);
      expect(content).toMatch(/## Evidencia Recopilada/);
      expect(content).toMatch(/## Hallazgos Clave/);
      expect(content).toMatch(/## Validación de Calidad/);
    });

    test('El informe debe tener metadata completa', () => {
      if (!fs.existsSync(phaseDReport)) return;

      const content = fs.readFileSync(phaseDReport, 'utf8');

      expect(content).toMatch(/\*\*Fase\*\*:\s*D/);
      expect(content).toMatch(/\*\*Nombre\*\*:\s*.*Runtime/);
      expect(content).toMatch(/\*\*Fecha\*\*:\s*\d{4}-\d{2}-\d{2}/);
      expect(content).toMatch(/\*\*Status\*\*:\s*.*Completado/);
    });
  });

  describe('Análisis de Scripts', () => {
    test('Debe identificar scripts npm/pnpm existentes', () => {
      if (!fs.existsSync(phaseDReport)) return;

      const content = fs.readFileSync(phaseDReport, 'utf8');

      expect(content).toMatch(/npm|pnpm|scripts/);
      expect(content).toMatch(/package\.json/);
    });

    test('Debe documentar tipos de scripts encontrados', () => {
      if (!fs.existsSync(phaseDReport)) return;

      const content = fs.readFileSync(phaseDReport, 'utf8');

      const scriptTypes = [
        'start',
        'dev',
        'build',
        'test',
        'lint',
        'deploy',
        'serve'
      ];
      const foundTypes = scriptTypes.filter(type =>
        content.toLowerCase().includes(type.toLowerCase())
      );

      expect(foundTypes.length).toBeGreaterThan(3);
    });

    test('Debe analizar dependencias entre scripts', () => {
      if (!fs.existsSync(phaseDReport)) return;

      const content = fs.readFileSync(phaseDReport, 'utf8');

      expect(content).toMatch(/dependen|sequence|workflow|orden/);
    });
  });

  describe('Análisis de Configuraciones PM2', () => {
    test('Debe identificar archivos de configuración pm2', () => {
      if (!fs.existsSync(phaseDReport)) return;

      const content = fs.readFileSync(phaseDReport, 'utf8');

      expect(content).toMatch(/pm2|ecosystem|process\.json/);
      expect(content).toMatch(/config|configuration/);
    });

    test('Debe documentar configuraciones de procesos', () => {
      if (!fs.existsSync(phaseDReport)) return;

      const content = fs.readFileSync(phaseDReport, 'utf8');

      expect(content).toMatch(/processes|instances|apps|name/);
      expect(content).toMatch(/daemon|router|skills/);
    });

    test('Debe analizar configuraciones de runtime', () => {
      if (!fs.existsSync(phaseDReport)) return;

      const content = fs.readFileSync(phaseDReport, 'utf8');

      expect(content).toMatch(/runtime|environment|env|NODE_ENV/);
      expect(content).toMatch(/memory|cpu|max_memory_restart/);
    });
  });

  describe('Flujos Operativos', () => {
    test('Debe identificar flujos de ejecución típicos', () => {
      if (!fs.existsSync(phaseDReport)) return;

      const content = fs.readFileSync(phaseDReport, 'utf8');

      expect(content).toMatch(/flujo|workflow|secuencia|pipeline/);
      expect(content).toMatch(/inicio|startup|boot/);
    });

    test('Debe documentar comandos de uso común', () => {
      if (!fs.existsSync(phaseDReport)) return;

      const content = fs.readFileSync(phaseDReport, 'utf8');

      expect(content).toMatch(/comando|command|cli|terminal/);
      expect(content).toMatch(/usuario|user|interacción/);
    });

    test('Debe analizar dependencias operativas', () => {
      if (!fs.existsSync(phaseDReport)) return;

      const content = fs.readFileSync(phaseDReport, 'utf8');

      expect(content).toMatch(/dependen|require|necesita/);
      expect(content).toMatch(/servicio|service|port/);
    });
  });

  describe('Detección de Redundancias', () => {
    test('Debe identificar scripts duplicados', () => {
      if (!fs.existsSync(phaseDReport)) return;

      const content = fs.readFileSync(phaseDReport, 'utf8');

      expect(content).toMatch(/duplicad|repetid|redundante/);
      expect(content).toMatch(/similar|igual|mismo/);
    });

    test('Debe documentar configuraciones redundantes', () => {
      if (!fs.existsSync(phaseDReport)) return;

      const content = fs.readFileSync(phaseDReport, 'utf8');

      expect(content).toMatch(/configuraciones? redundantes/);
      expect(content).toMatch(/múltiple|varios/);
    });

    test('Debe analizar optimizaciones posibles', () => {
      if (!fs.existsSync(phaseDReport)) return;

      const content = fs.readFileSync(phaseDReport, 'utf8');

      expect(content).toMatch(/optimización|optimización|mejora/);
      expect(content).toMatch(/ineficiente|ineficiente/);
    });
  });

  describe('Evidencia Requerida', () => {
    test('Cada afirmación debe tener evidencia', () => {
      if (!fs.existsSync(phaseDReport)) return;

      const content = fs.readFileSync(phaseDReport, 'utf8');

      const findings = content.match(/- \*\*Hallazgo\*\*: .+/g);
      if (findings) {
        findings.forEach(finding => {
          expect(finding).toMatch(/\*\*Evidencia\*\*:/);
        });
      }
    });

    test('Debe incluir rutas específicas a archivos analizados', () => {
      if (!fs.existsSync(phaseDReport)) return;

      const content = fs.readFileSync(phaseDReport, 'utf8');

      expect(content).toMatch(/\/Users\/felipe\/Developer\/skills-fabrik\//);
    });

    test('Debe incluir conteos y métricas específicas', () => {
      if (!fs.existsSync(phaseDReport)) return;

      const content = fs.readFileSync(phaseDReport, 'utf8');

      // Buscar números y métricas
      const hasMetrics = content.match(
        /\d+\s*(scripts|configuraciones|archivos|procesos)/i
      );
      expect(hasMetrics).toBeTruthy();
    });
  });

  describe('Calidad del Informe', () => {
    test('Debe tener formato consistente con fases anteriores', () => {
      if (!fs.existsSync(phaseDReport)) return;

      const content = fs.readFileSync(phaseDReport, 'utf8');

      expect(content).toMatch(/## Validación de Calidad/);
      expect(content).toMatch(/## Referencias Cruzadas/);
    });

    test('Debe tener longitud razonable', () => {
      if (!fs.existsSync(phaseDReport)) return;

      const content = fs.readFileSync(phaseDReport, 'utf8');
      const lines = content.split('\n').length;

      expect(lines).toBeGreaterThan(100);
      expect(lines).toBeLessThan(1000);
    });

    test('Debe tener resumen ejecutivo significativo', () => {
      if (!fs.existsSync(phaseDReport)) return;

      const content = fs.readFileSync(phaseDReport, 'utf8');
      const executiveSummary = content.match(
        /## Resumen Ejecutivo\s*\n\n([\s\S]*?)\n\n##/
      );

      if (executiveSummary && executiveSummary[1]) {
        expect(executiveSummary[1].length).toBeGreaterThan(100);
        expect(executiveSummary[1]).toMatch(/scripts|runtime|pm2|configuraci/);
      }
    });
  });

  describe('Validación contra Rules', () => {
    test('Debe respetar máxima de evidencia', () => {
      if (!fs.existsSync(phaseDReport)) return;

      const content = fs.readFileSync(phaseDReport, 'utf8');

      // No debe hacer afirmaciones sin evidencia
      expect(content).not.toMatch(/afirma|sostiene|declara/i);
      expect(content).toMatch(/realmente|efectivamente|concretamente/);
    });

    test('Debe respetar máxima de claridad', () => {
      if (!fs.existsSync(phaseDReport)) return;

      const content = fs.readFileSync(phaseDReport, 'utf8');

      // Debe explicar en lenguaje claro
      expect(content).toMatch(/realmente|efectivamente|concretamente/);
    });

    test('Debe respetar máxima forense', () => {
      if (!fs.existsSync(phaseDReport)) return;

      const content = fs.readFileSync(phaseDReport, 'utf8');

      // No debe proponer cambios, solo observar
      expect(content).not.toMatch(/modific|cambi|edit|mejor|sugier/);
    });

    test('Debe referenciar dev-docs guía', () => {
      if (!fs.existsSync(phaseDReport)) return;

      const content = fs.readFileSync(phaseDReport, 'utf8');

      expect(content).toMatch(/dev-docs/);
    });
  });

  describe('Validación de Completitud', () => {
    test('Debe cubrir áreas esperadas de Fase D', () => {
      if (!fs.existsSync(phaseDReport)) return;

      const content = fs.readFileSync(phaseDReport, 'utf8');

      const expectedKeywords = [
        'scripts',
        'runtime',
        'pm2',
        'operaci',
        'flujo'
      ];

      const foundKeywords = expectedKeywords.filter(keyword =>
        content.toLowerCase().includes(keyword.toLowerCase())
      );

      expect(foundKeywords.length).toBeGreaterThanOrEqual(4);
    });

    test('Debe incluir análisis de comandos CLI', () => {
      if (!fs.existsSync(phaseDReport)) return;

      const content = fs.readFileSync(phaseDReport, 'utf8');

      expect(content).toMatch(/cli|command line|terminal/);
      expect(content).toMatch(/skills-cli/);
    });
  });

  describe('Quality Gates Integration', () => {
    test('El informe debe estar listo para validación de calidad', () => {
      if (!fs.existsSync(phaseDReport)) return;

      const content = fs.readFileSync(phaseDReport, 'utf8');

      expect(content).toMatch(/## Validación de Calidad/);
      expect(content).toMatch(/Lint|Format|Evidence|Rules/);
    });

    test('Debe mantener integridad del repo', () => {
      if (!fs.existsSync(phaseDReport)) return;

      const content = fs.readFileSync(phaseDReport, 'utf8');

      expect(content).toMatch(/100% preservada|sin modificar|integridad/);
    });
  });

  describe('Integración con Fases Anteriores', () => {
    test('Debe hacer referencia a hallazgos de Fase A', () => {
      if (!fs.existsSync(phaseDReport)) return;

      const content = fs.readFileSync(phaseDReport, 'utf8');

      expect(content).toMatch(/Fase A|inventario|paquetes|router|daemon/);
    });

    test('Debe hacer referencia a hallazgos de Fase B', () => {
      if (!fs.existsSync(phaseDReport)) return;

      const content = fs.readFileSync(phaseDReport, 'utf8');

      expect(content).toMatch(/Fase B|responsabilidades|solapamiento/);
    });

    test('Debe hacer referencia a hallazgos de Fase C', () => {
      if (!fs.existsSync(phaseDReport)) return;

      const content = fs.readFileSync(phaseDReport, 'utf8');

      expect(content).toMatch(/Fase C|testing|deuda técnica|TODO/);
    });

    test('Debe integrar con conocimiento existente', () => {
      if (!fs.existsSync(phaseDReport)) return;

      const content = fs.readFileSync(phaseDReport, 'utf8');

      expect(content).toMatch(/componente|área|análisis/);
    });
  });

  describe('Análisis Específico PM2', () => {
    test('Debe identificar configuraciones de procesos PM2', () => {
      if (!fs.existsSync(phaseDReport)) return;

      const content = fs.readFileSync(phaseDReport, 'utf8');

      expect(content).toMatch(/ecosystem\.config|process\.json/);
      expect(content).toMatch(/apps|instances|exec_mode/);
    });

    test('Debe documentar configuraciones de monitoreo', () => {
      if (!fs.existsSync(phaseDReport)) return;

      const content = fs.readFileSync(phaseDReport, 'utf8');

      expect(content).toMatch(/monitoreo|monitoring|logging|watch/);
      expect(content).toMatch(/log_file|out_file|error_file/);
    });

    test('Debe analizar configuraciones de entorno', () => {
      if (!fs.existsSync(phaseDReport)) return;

      const content = fs.readFileSync(phaseDReport, 'utf8');

      expect(content).toMatch(/env|environment|NODE_ENV/);
      expect(content).toMatch(/development|production/);
    });
  });

  describe('Análisis Específico CLI', () => {
    test('Debe documentar comandos skills-cli', () => {
      if (!fs.existsSync(phaseDReport)) return;

      const content = fs.readFileSync(phaseDReport, 'utf8');

      expect(content).toMatch(/skills-cli/);
      expect(content).toMatch(/sf|skills/);
    });

    test('Debe identificar flujos de trabajo CLI', () => {
      if (!fs.existsSync(phaseDReport)) return;

      const content = fs.readFileSync(phaseDReport, 'utf8');

      expect(content).toMatch(/workflow|flujo|pipeline/);
      expect(content).toMatch(/entrada|salida|input|output/);
    });

    test('Debe analizar integración CLI-Daemon', () => {
      if (!fs.existsSync(phaseDReport)) return;

      const content = fs.readFileSync(phaseDReport, 'utf8');

      expect(content).toMatch(/daemon|comunicación|interacción/);
      expect(content).toMatch(/http|api|request/);
    });
  });
});
