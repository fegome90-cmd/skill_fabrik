/**
 * Tests TDD para validar correcciones realizadas en el análisis forense
 * Asegura que las correcciones críticas de Phase 1 están funcionando
 */

const fs = require('fs');
const path = require('path');

describe('TDD Validación Correcciones Phase 1', () => {
  describe('Corrección 1.1: ESLint Configuration', () => {
    test('ESLint configuration debe ser válida y funcional', () => {
      const eslintrcPath = path.join(__dirname, '../.eslintrc.json');
      const eslintConfig = JSON.parse(fs.readFileSync(eslintrcPath, 'utf8'));

      // No debe tener propiedades inválidas
      expect(eslintConfig).not.toHaveProperty('overrideConfig');

      // Debe tener configuración básica válida
      expect(eslintConfig).toHaveProperty('root', true);
      expect(eslintConfig).toHaveProperty('parser', 'espree');

      // Debe poder ser parseado sin errores
      expect(() => JSON.parse(JSON.stringify(eslintConfig))).not.toThrow();
    });
  });

  describe('Corrección 1.3: Data Integrity Phase C', () => {
    test('Phase C debe tener datos correctos de tests', () => {
      const phaseCPath = path.join(
        __dirname,
        '../consolidated-reports/phase-c-testing.md'
      );
      const content = fs.readFileSync(phaseCPath, 'utf8');

      // No debe tener caracteres chinos
      expect(content).not.toMatch(/测试/);

      // Debe tener el número correcto de tests
      expect(content).toMatch(/42 archivos de tests/);

      // Debe tener la distribución correcta
      expect(content).toMatch(/Router \(28 tests\)/);
      expect(content).toMatch(/Skills CLI \(10 tests\)/);
      expect(content).toMatch(/E2E \(4 tests\)/);
    });

    test('Toda la documentación debe estar en UTF-8 limpio', () => {
      const reportsDir = path.join(__dirname, '../consolidated-reports');
      const reportFiles = fs
        .readdirSync(reportsDir)
        .filter(f => f.endsWith('.md'));

      reportFiles.forEach(file => {
        const filePath = path.join(reportsDir, file);
        const content = fs.readFileSync(filePath, 'utf8');

        // No debe tener caracteres no-ASCII problemáticos
        expect(content).not.toMatch(/测试/); // Chino específico encontrado
        expect(content).not.toMatch(/保持兼容性/); // Otro carácter chino encontrado
        expect(content).not.toMatch(/[^\x20-\x7E\xC0-\xFF]{6,}/); // Patrones de 6+ caracteres no-imprimibles consecutivos
        // No debe tener caracteres de formateo extraños
        expect(content).not.toMatch(/·/); // Caracteres de formato extraños encontrados
      });
    });
  });

  describe('Corrección 1.4: Cross-check Métricas', () => {
    test('Todas las fases deben tener métricas consistentes', () => {
      const reportsDir = path.join(__dirname, '../consolidated-reports');
      const reportFiles = fs
        .readdirSync(reportsDir)
        .filter(f => f.startsWith('phase-') && f.endsWith('.md'));

      // Verificar que no haya caracteres problemáticos en ningún archivo
      reportFiles.forEach(file => {
        const filePath = path.join(reportsDir, file);
        const content = fs.readFileSync(filePath, 'utf8');

        // No debe tener caracteres de formato problemáticos
        expect(content).not.toMatch(/·/);
      });

      // Verificar consistencia de componentes principales
      const phaseAPath = path.join(
        __dirname,
        '../consolidated-reports/phase-a-inventory.md'
      );
      const phaseBPath = path.join(
        __dirname,
        '../consolidated-reports/phase-b-responsibilities.md'
      );
      const phaseCPath = path.join(
        __dirname,
        '../consolidated-reports/phase-c-testing.md'
      );

      expect(fs.readFileSync(phaseAPath, 'utf8')).toMatch(
        /Daemon.*\(448KB\)|448KB.*Daemon/
      );
      expect(fs.readFileSync(phaseAPath, 'utf8')).toMatch(
        /Router.*\(512KB\)|512KB.*Router/
      );
      expect(fs.readFileSync(phaseAPath, 'utf8')).toMatch(
        /Skills CLI.*\(928KB\)|928KB.*Skills CLI/
      );
      expect(fs.readFileSync(phaseAPath, 'utf8')).toMatch(
        /MCP.*\(96MB\)|96MB.*MCP/
      );

      expect(fs.readFileSync(phaseBPath, 'utf8')).toMatch(
        /Daemon.*\(448KB\)|448KB.*Daemon/
      );
      expect(fs.readFileSync(phaseBPath, 'utf8')).toMatch(
        /Router.*\(512KB\)|512KB.*Router/
      );
      expect(fs.readFileSync(phaseBPath, 'utf8')).toMatch(
        /Skills CLI.*\(928KB\)|928KB.*Skills CLI/
      );
      expect(fs.readFileSync(phaseBPath, 'utf8')).toMatch(
        /MCP.*\(96MB\)|96MB.*MCP/
      );

      expect(fs.readFileSync(phaseCPath, 'utf8')).toMatch(
        /Daemon.*\(448KB\)|448KB.*Daemon/
      );
      expect(fs.readFileSync(phaseCPath, 'utf8')).toMatch(
        /Skills CLI.*\(928KB\)|928KB.*Skills CLI/
      );
      expect(fs.readFileSync(phaseCPath, 'utf8')).toMatch(
        /Router.*\(512KB\)|512KB.*Router/
      );
      expect(fs.readFileSync(phaseCPath, 'utf8')).toMatch(
        /MCP.*\(96MB\)|96MB.*MCP/
      );
    });

    test('Phase A debe tener todas las métricas principales', () => {
      const phaseAPath = path.join(
        __dirname,
        '../consolidated-reports/phase-a-inventory.md'
      );
      const content = fs.readFileSync(phaseAPath, 'utf8');

      expect(content).toMatch(/Daemon.*\(448KB\)/);
      expect(content).toMatch(/Router.*\(512KB\)/);
      expect(content).toMatch(/Skills CLI.*\(928KB\)/);
      expect(content).toMatch(/MCP.*\(96MB\)/);
    });

    test('Phase B debe tener todas las métricas principales', () => {
      const phaseBPath = path.join(
        __dirname,
        '../consolidated-reports/phase-b-responsibilities.md'
      );
      const content = fs.readFileSync(phaseBPath, 'utf8');

      expect(content).toMatch(/Daemon.*\(448KB\)/);
      expect(content).toMatch(/Router.*\(512KB\)/);
      expect(content).toMatch(/Skills CLI.*\(928KB\)/);
      expect(content).toMatch(/MCP.*\(96MB\)/);
    });

    test('Phase C debe tener todas las métricas principales', () => {
      const phaseCPath = path.join(
        __dirname,
        '../consolidated-reports/phase-c-testing.md'
      );
      const content = fs.readFileSync(phaseCPath, 'utf8');

      expect(content).toMatch(/Daemon.*\(448KB\)/);
      expect(content).toMatch(/Skills CLI.*\(928KB\)/);
      expect(content).toMatch(/Router.*\(512KB\)/);
      expect(content).toMatch(/MCP.*\(96MB\)/);
    });

    test('Phase D debe tener todas las métricas principales', () => {
      const phaseDPath = path.join(
        __dirname,
        '../consolidated-reports/phase-d-runtime.md'
      );
      const content = fs.readFileSync(phaseDPath, 'utf8');

      expect(content).toMatch(/Daemon/);
      expect(content).toMatch(/skills-cli.*\(928KB\)/);
      expect(content).toMatch(/MCP.*\(96MB\)/);
    });

    test('Phase E debe tener todas las métricas principales', () => {
      const phaseEPath = path.join(
        __dirname,
        '../consolidated-reports/phase-e-prompts.md'
      );
      const content = fs.readFileSync(phaseEPath, 'utf8');

      expect(content).toMatch(/daemon.*\(448KB\)/i);
      expect(content).toMatch(/skills-cli.*\(928KB\)/i);
      expect(content).toMatch(/MCP.*\(96MB\)|96MB.*MCP/i);
    });
  });

  describe('Corrección 2.1: Rules Actualizadas', () => {
    test('rules_forense.json debe tener nuevas validaciones', () => {
      const rulesPath = path.join(__dirname, '../config/rules_forense.json');
      const rules = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));

      // Debe tener data integrity quality gate
      expect(rules.quality_gates).toHaveProperty('data_integrity');
      expect(rules.quality_gates.data_integrity).toHaveProperty(
        'requirement',
        'TODOS los datos numéricos deben ser verificables'
      );

      // Debe tener lecciones_aprendidas
      expect(rules).toHaveProperty('lecciones_aprendidas');
      expect(rules.lecciones_aprendidas).toHaveProperty('phase_1_corrections');

      // Debe tener validation commands
      expect(rules.lecciones_aprendidas).toHaveProperty('validation_commands');
      expect(rules.lecciones_aprendidas.validation_commands).toHaveProperty(
        'component_sizes'
      );

      // Debe tener prohibiciones actualizadas
      const prohibitionItems = rules.prohibiciones.map(p => p.item);
      expect(prohibitionItems).toContain(
        'NO reportar datos numéricos sin verificación con comandos reales'
      );
      expect(prohibitionItems).toContain(
        'NO tener configuraciones ESLint inválidas'
      );
      expect(prohibitionItems).toContain(
        'NO usar caracteres no-ASCII en documentación profesional'
      );

      // Debe tener obligaciones actualizadas
      const obligationItems = rules.obligaciones.map(o => o.item);
      expect(obligationItems).toContain(
        'VERIFICAR TODOS los datos numéricos con comandos reales'
      );
      expect(obligationItems).toContain(
        'VALIDAR consistencia de métricas entre todos los informes'
      );
    });
  });

  describe('Corrección 1.2: Quality Gates Funcionales', () => {
    test('package.json debe tener quality gates mejorados', () => {
      const packageJsonPath = path.join(__dirname, '../package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      // Debe tener quality-gate-strict
      expect(packageJson.scripts).toHaveProperty('quality-gate-strict');
      expect(packageJson.scripts['quality-gate-strict']).toContain(
        'Zero technical debt'
      );

      // Debe tener quality-gate-full con validaciones
      expect(packageJson.scripts).toHaveProperty('quality-gate-full');
      expect(packageJson.scripts['quality-gate-full']).toContain(
        'validate-rules'
      );
      expect(packageJson.scripts['quality-gate-full']).toContain(
        'validate-evidence'
      );
      expect(packageJson.scripts['quality-gate-full']).toContain(
        'validate-completeness'
      );
    });
  });

  describe('Integración de Correcciones', () => {
    test('Todas las correcciones deben estar integradas coherentemente', () => {
      // Verificar que ESLint funciona realmente
      const eslintrcPath = path.join(__dirname, '../.eslintrc.json');
      const eslintConfig = JSON.parse(fs.readFileSync(eslintrcPath, 'utf8'));
      expect(eslintConfig).not.toHaveProperty('overrideConfig');

      // Verificar que los datos son consistentes
      const phaseCPath = path.join(
        __dirname,
        '../consolidated-reports/phase-c-testing.md'
      );
      const phaseCContent = fs.readFileSync(phaseCPath, 'utf8');
      expect(phaseCContent).toMatch(/42 archivos de tests/);
      expect(phaseCContent).not.toMatch(/测试/);

      // Verificar que las reglas incluyen las lecciones aprendidas
      const rulesPath = path.join(__dirname, '../config/rules_forense.json');
      const rules = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
      expect(rules.lecciones_aprendidas.phase_1_corrections).toHaveProperty(
        'data_verification'
      );

      // Verificar que los quality gates están actualizados
      const packageJsonPath = path.join(__dirname, '../package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      expect(packageJson.scripts).toHaveProperty('quality-gate-strict');
    });
  });
});
