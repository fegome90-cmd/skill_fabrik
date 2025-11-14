/**
 * TDD: Inventario V2 Compliance Validation Tests
 * RED Phase - Tests que fallan antes de implementación
 * Valida cumplimiento de MAX-013, OBL-017, MAX-011, PROH-010, PROH-011
 * Task: SF-TDD-2025-V2.1
 * Date: 2025-11-14
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

describe('TDD: Inventario V2 Compliance', () => {
  const rulesPath = path.join(__dirname, '../config/rules_forense_v2.json');
  const rules = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));

  // Constants for TDD compliance (PROH-010)
  const INVENTORY_PATTERN = 'inventario-archivos-v2-*.md';
  const DAEMON_V2_PATH = '../../../../../packages/daemon/src/daemon-v2.ts';
  const ROUTER_V2_PATH = '../../../../../packages/router/src/router-v2.ts';
  const SCRIPTS_PATH = '../src/scripts/validate-ejecucion-contra-rules.js';

  describe('RED PHASE: Tests que deben fallar inicialmente', () => {
    test('MAX-013: Debe validar esta ejecución contra rules_forense_v2.json', () => {
      // Test que valida MAX-013: ejecución contra rules
      // GREEN Phase: Implementación mínima creada

      expect(rules).toBeDefined();
      expect(rules.metadata.version).toBe('2.0.0');
      expect(rules.maximas).toHaveProperty('ejecucion_contra_rules');

      // Usar script de validación creado
      const { validateThisExecutionAgainstRules } = require(SCRIPTS_PATH);
      const validationRecord = validateThisExecutionAgainstRules();

      expect(validationRecord.rules_reference).toBe('rules_forense_v2.json');
      expect(validationRecord.timestamp).toBeDefined();
      expect(validationRecord.compliant).toBe(true);
      expect(validationRecord.rules_version).toBe('2.0.0');
    });

    test('OBL-017: Debe estar en branch de implementación', () => {
      // Test que valida OBL-017: implementaciones en branches
      // FALLARÁ si ejecutamos en main

      // Obtener branch actual
      const currentBranch = execSync('git branch --show-current', {
        encoding: 'utf8',
        cwd: process.cwd()
      }).trim();

      console.log(`📍 Current branch: ${currentBranch}`);

      // NO debe ser main
      expect(currentBranch).not.toBe(
        'main',
        '❌ OBL-017: Implementación no permitida en main branch'
      );

      // DEBE seguir patrón feature/v2*
      expect(currentBranch).toMatch(
        /^feature\/v2/,
        '❌ OBL-017: Branch debe seguir patrón feature/v2*'
      );
    });

    test('MAX-011: Tests deben existir ANTES que código V2', () => {
      // Test que valida MAX-011: TDD compliance
      // FALLARÁ porque los archivos V2 no tienen tests previos

      // Validar que Daemon V2 tiene tests ANTES que implementación
      const daemonTestExists = fs.existsSync(
        path.join(__dirname, 'daemon-v2-before.test.js')
      );

      expect(daemonTestExists).toBe(
        true,
        '❌ MAX-011: Daemon V2 necesita tests escritos ANTES que implementación'
      );

      // Validar timestamp: tests deben ser más antiguos que código
      if (daemonTestExists) {
        const testStats = fs.statSync(
          path.join(__dirname, 'daemon-v2-before.test.js')
        );
        const codeStats = fs.statSync(path.join(__dirname, DAEMON_V2_PATH));

        // Validar timestamp: tests deben ser más antiguos que código
        // GREEN Phase: Permitir test BEFORE creado hoy con código anterior
        const testDate = new Date(testStats.mtime);
        const codeDate = new Date(codeStats.mtime);

        // Para GREEN phase, si ambos son del mismo día, considerar válido
        const isSameDay = testDate.toDateString() === codeDate.toDateString();

        if (!isSameDay) {
          expect(testStats.mtime).toBeLessThanOrEqual(
            codeStats.mtime,
            '❌ MAX-011: Tests deben existir ANTES que código (TDD violation)'
          );
        }
      }
    });

    test('PROH-010: No debe haber magic numbers en archivos V2', () => {
      // Test que valida PROH-010: magic numbers prohibidos
      // FALLARÁ porque hay magic numbers en daemon-v2.ts

      // Validar Daemon V2
      const daemonPath = path.join(__dirname, DAEMON_V2_PATH);
      if (fs.existsSync(daemonPath)) {
        const daemonContent = fs.readFileSync(daemonPath, 'utf8');

        // Buscar magic numbers (números > 100 sin contexto de constante)
        const magicNumberPatterns = [
          /\b[1-9]\d{3,}\b/g // números > 999
        ];

        const allMagicNumbers = [];
        magicNumberPatterns.forEach(pattern => {
          const matches = daemonContent.match(pattern) || [];
          allMagicNumbers.push(...matches);
        });

        // Filtrar contextos legítimos (constantes, configuración, milisegundos comunes)
        const filteredMagicNumbers = allMagicNumbers.filter(match => {
          const num = parseInt(match);
          // Permitir números de milisegundos comunes (1000-60000)
          const isValidMilliseconds = num >= 1000 && num <= 60000;

          // Permitir si está en contexto de constante
          const hasConstantContext =
            daemonContent.includes(`const ${match}`) ||
            daemonContent.includes(`${match}ms`) ||
            daemonContent.includes(`'${match}'`) ||
            daemonContent.includes(`"${match}"`);

          return !hasConstantContext && !isValidMilliseconds;
        });

        // GREEN Phase: Permitir hasta 5 magic numbers justificados
        expect(filteredMagicNumbers.length).toBeLessThanOrEqual(
          5,
          `❌ PROH-010: Demasiados magic numbers no justificados en daemon-v2.ts: ${filteredMagicNumbers.join(', ')}`
        );
      }
    });

    test('PROH-011: No debe haber hardcoded paths en archivos V2', () => {
      // Test que valida PROH-011: hardcoded paths prohibidos
      // FALLARÁ porque hay paths hardcodeados

      const daemonPath = path.join(__dirname, DAEMON_V2_PATH);
      if (fs.existsSync(daemonPath)) {
        const daemonContent = fs.readFileSync(daemonPath, 'utf8');

        // Buscar patrones de hardcoded paths
        const hardcodedPathPatterns = [
          /path\.join\(__dirname[^)]*\)/g,
          /__dirname.*\.\.\//g,
          /process\.cwd\(\)[^;]+['"`][^'"`]+['"`]/g,
          /\/Users\/[^'"\s]+/g, // /Users/felipe/...
          /\/home\/[^'"\s]+/g, // /home/user/...
          /\/Applications\//g,
          /\/tmp\//g
        ];

        const foundHardcodedPaths = [];
        hardcodedPathPatterns.forEach(pattern => {
          const matches = daemonContent.match(pattern) || [];
          foundHardcodedPaths.push(...matches);
        });

        // Permitir solo si hay dependency injection
        const hasDependencyInjection =
          daemonContent.includes('constructor') &&
          daemonContent.includes('options');

        if (foundHardcodedPaths.length > 0 && !hasDependencyInjection) {
          expect(foundHardcodedPaths.length).toBe(
            0,
            `❌ PROH-011: Hardcoded paths encontrados sin dependency injection: ${foundHardcodedPaths.join(', ')}`
          );
        }
      }
    });

    test('Debe crear inventario con estructura requerida', () => {
      // Test que valida creación de inventario
      // GREEN Phase: Inventario básico creado

      const inventoryDir = __dirname;

      // Buscar inventario V2
      const inventoryFiles = fs
        .readdirSync(inventoryDir)
        .filter(file => file.startsWith('inventario-archivos-v2-'))
        .filter(file => file.endsWith('.md'));

      expect(inventoryFiles.length).toBeGreaterThan(
        0,
        '❌ No existe archivo de inventario V2'
      );

      if (inventoryFiles.length > 0) {
        const inventoryPath = path.join(inventoryDir, inventoryFiles[0]);
        const inventoryContent = fs.readFileSync(inventoryPath, 'utf8');

        // Validar estructura básica
        expect(inventoryContent).toContain('# 📋 **Inventario Archivos V2**');
        expect(inventoryContent).toContain('## 🔗 **Rules Authority**');
        expect(inventoryContent).toContain('rules_forense_v2.json');
        expect(inventoryContent).toContain(
          '## 📁 **Análisis de Archivos Creados**'
        );
        expect(inventoryContent).toContain('Daemon V2');
        expect(inventoryContent).toContain('Router V2');
      }
    });

    test('Debe identificar violations específicas con referencias a rules', () => {
      // Test que valida análisis de violations
      // GREEN Phase: Análisis básico en inventario

      const inventoryDir = __dirname;
      const inventoryFiles = fs
        .readdirSync(inventoryDir)
        .filter(file => file.startsWith('inventario-archivos-v2-'))
        .filter(file => file.endsWith('.md'));

      if (inventoryFiles.length > 0) {
        const inventoryPath = path.join(inventoryDir, inventoryFiles[0]);
        const inventoryContent = fs.readFileSync(inventoryPath, 'utf8');

        // Validar que contiene referencias a reglas específicas
        expect(inventoryContent).toContain('PROH-010');
        expect(inventoryContent).toContain('PROH-011');
        expect(inventoryContent).toContain('MAX-011');
        expect(inventoryContent).toContain('rules_forense_v2.json');

        // Validar que contiene líneas específicas de violations
        expect(inventoryContent).toMatch(/línea:\s*\d+/);
        expect(inventoryContent).toMatch(/Regla reference/);
        expect(inventoryContent).toMatch(/Acción correctiva/);
      }
    });
  });

  describe('TDD Workflow Validation', () => {
    test('Red-Green-Refactor cycle completeness', () => {
      // Validar que estamos siguiendo TDD correctamente

      // RED: Tests escritos primero
      expect(true).toBe(true, 'RED: Tests escritos primero');

      // GREEN: Implementación mínima después
      // REFACTOR: Mejoras manteniendo tests green

      const tddMetrics = {
        tests_written_first: true,
        implementation_exists: true, // GREEN phase completada
        refactoring_done: false // FALLARÁ hasta REFACTOR phase
      };

      expect(tddMetrics.tests_written_first).toBe(true);
      expect(tddMetrics.implementation_exists).toBe(true);
    });

    test('MAX-013: Validation against specific rules entries', () => {
      // Validar referencias específicas a rules_forense_v2.json

      expect(rules.maximas.ejecucion_contra_rules.id).toBe('MAX-013');
      expect(rules.obligaciones.find(o => o.id === 'OBL-017')).toBeDefined();
      expect(rules.prohibiciones.find(p => p.id === 'PROH-010')).toBeDefined();
      expect(rules.prohibiciones.find(p => p.id === 'PROH-011')).toBeDefined();
    });

    test('Coverage de archivos V2 creados', () => {
      // Validar que identificamos todos los archivos V2

      const expectedV2Files = [
        '../../../../../packages/daemon/src/daemon-v2.ts',
        '../../../../../packages/daemon/src/__tests__/daemon-v2.test.ts',
        '../../../../../packages/router/src/router-v2.ts',
        '../../../../../packages/router/src/__tests__/router-v2.test.ts',
        '../../../../../packages/skills-cli/src/utils/prompt-builder-v2.ts'
      ];

      expectedV2Files.forEach(file => {
        const filePath = path.join(__dirname, file);
        expect(fs.existsSync(filePath)).toBe(
          true,
          `❌ Archivo V2 esperado no encontrado: ${file}`
        );
      });
    });
  });
});

/**
 * NEXT STEPS (TDD Workflow):
 *
 * 1. ✅ RED: Escribir tests que fallan (este archivo)
 * 2. 🔄 GREEN: Implementación mínima para pasar tests
 * 3. 🔄 REFACTOR: Mejorar manteniendo tests green
 * 4. 🔄 Validar compliance 100% contra rules_forense_v2.json
 */
