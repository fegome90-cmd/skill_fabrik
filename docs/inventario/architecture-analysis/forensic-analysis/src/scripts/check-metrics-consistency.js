#!/usr/bin/env node

/**
 * Validador de consistencia de métricas entre fases - OBLIGATORIO
 *
 * Reglas Obligatorias Aplicadas:
 * - PROH-009: NO tener inconsistencias de métricas entre informes y fases
 * - MAX-007: Verificación dinámica contra estado actual del repositorio
 * - OBL-008: Validación cruzada dinámica entre todas las fases
 * - QG-010: VERIFICACIÓN OBLIGATORIA de existencia y estado real
 */

const { execSync } = require('child_process');
const path = require('path');
const {
  CRITICAL_COMPONENTS,
  readFileContent,
  findFilesByPattern,
  log
} = require('../utils/validation-helpers');

function checkMetricsConsistency(
  reportsDir = path.join(__dirname, '../../consolidated-reports')
) {
  const phaseFiles = findFilesByPattern(reportsDir, 'phase-').filter(file =>
    file.endsWith('.md')
  );

  const inconsistencies = [];
  const realMetrics = getRealRepoMetrics();

  log('info', `Analizando ${phaseFiles.length} archivos de fases...`);
  log('info', 'Métricas reales obtenidas del repositorio');

  phaseFiles.forEach(filePath => {
    const fileName = path.basename(filePath);
    const content = readFileContent(filePath);

    if (!content) {
      inconsistencies.push(`${fileName}: No se pudo leer el archivo`);
      return;
    }

    // Verificar caracteres problemáticos
    if (content.includes('·')) {
      inconsistencies.push(
        `${fileName}: Contiene caracteres "·" problemáticos`
      );
    }

    // Verificar consistencia de métricas contra datos reales del repositorio
    Object.entries(realMetrics).forEach(([component, realData]) => {
      const hasComponent = content.toLowerCase().includes(component);

      if (hasComponent) {
        // Buscar si menciona el tamaño real en el contenido
        const mentionsRealSize = content.includes(realData.size);

        if (!mentionsRealSize) {
          inconsistencies.push(
            `${fileName}: Menciona "${component}" pero el tamaño reportado no coincide con el tamaño real "${realData.size}"`
          );
        }

        // Validar que si menciona un tamaño, sea el correcto
        const sizePattern = new RegExp(
          `(${component}[^\\n]*?(\\d+KB|\\d+MB|\\d+GB))`,
          'gi'
        );
        const sizeMatches = content.match(sizePattern);

        if (sizeMatches && sizeMatches.length > 0) {
          const reportedSize =
            sizeMatches[0].match(/(\d+KB|\d+MB|\d+GB)/i)?.[1];

          if (reportedSize && reportedSize !== realData.size) {
            inconsistencies.push(
              `${fileName}: Reporta "${component}" con tamaño incorrecto "${reportedSize}" (real: "${realData.size}")`
            );
          }
        }
      }
    });
  });

  // Validar consistencia cruzada entre fases
  const crossPhaseInconsistencies = validateCrossPhaseConsistency(
    phaseFiles,
    realMetrics
  );
  inconsistencies.push(...crossPhaseInconsistencies);

  return inconsistencies;
}

/**
 * Obtiene métricas reales del repositorio usando comandos obligatorios
 * Cumple con OBL-018 y MAX-014
 */
function getRealRepoMetrics() {
  const realMetrics = {};

  try {
    // Tamaño real de cada componente usando comandos obligatorios
    const components = ['daemon', 'router', 'skills-cli'];

    components.forEach(component => {
      const command = `du -sh /packages/${component}/src/ 2>/dev/null | cut -f1`;

      try {
        const realSize = execSync(command, { encoding: 'utf8' }).trim();

        realMetrics[component] = {
          size: realSize,
          command,
          timestamp: new Date().toISOString(),
          source: 'live_repo_verification'
        };

        log('info', `✅ ${component}: ${realSize}`);
      } catch (error) {
        log(
          'error',
          `❌ No se pudo obtener tamaño de ${component}: ${error.message}`
        );
        realMetrics[component] = {
          size: 'N/A',
          command,
          error: error.message,
          source: 'verification_failed'
        };
      }
    });

    // Conteos reales
    try {
      const testCount = execSync(
        'find . -name "*.test.*" -o -name "*.spec.*" | wc -l',
        { encoding: 'utf8' }
      ).trim();
      realMetrics.tests = {
        count: testCount,
        command: 'find . -name "*.test.*" -o -name "*.spec.*" | wc -l',
        timestamp: new Date().toISOString(),
        source: 'live_repo_verification'
      };
    } catch (error) {
      log('error', `❌ No se pudo obtener conteo de tests: ${error.message}`);
    }
  } catch (error) {
    log(
      'error',
      `❌ Error general obteniendo métricas reales: ${error.message}`
    );
  }

  return realMetrics;
}

/**
 * Valida consistencia cruzada entre todas las fases usando datos reales
 * Cumple con OBL-008 y PROH-009
 */
function validateCrossPhaseConsistency(phaseFiles, realMetrics) {
  const inconsistencies = [];
  const phaseData = {};

  // Recolectar datos de cada fase
  phaseFiles.forEach(filePath => {
    const fileName = path.basename(filePath);
    const content = readFileContent(filePath);

    if (!content) return;

    phaseData[fileName] = {
      mentions: {},
      reported: {}
    };

    // Detectar qué componentes menciona cada fase
    Object.keys(realMetrics).forEach(component => {
      if (component === 'tests') {
        phaseData[fileName].mentions.tests = content
          .toLowerCase()
          .includes('test');
        const testMatch = content.match(/(\d+)\s*test(s)?/gi);
        if (testMatch) {
          const reportedTests = testMatch[0].match(/(\d+)/)?.[1];
          if (reportedTests) {
            phaseData[fileName].reported.tests = reportedTests;
          }
        }
      } else {
        phaseData[fileName].mentions[component] = content
          .toLowerCase()
          .includes(component);
        const sizeMatch = content.match(
          new RegExp(`${component}[^\\n]*?(\\d+KB|\\d+MB|\\d+GB)`, 'gi')
        );
        if (sizeMatch && sizeMatch.length > 0) {
          const reportedSize = sizeMatch[0].match(/(\d+KB|\d+MB|\d+GB)/i)?.[1];
          if (reportedSize) {
            phaseData[fileName].reported[component] = reportedSize;
          }
        }
      }
    });
  });

  // Validar consistencia cruzada
  Object.keys(realMetrics).forEach(component => {
    if (component === 'tests') {
      const phasesMentioningTests = Object.keys(phaseData).filter(
        phase => phaseData[phase].mentions.tests
      );
      const reportedValues = phasesMentioningTests
        .map(phase => phaseData[phase].reported.tests)
        .filter(value => value && value !== 'N/A');

      if (reportedValues.length > 0) {
        const uniqueValues = [...new Set(reportedValues)];
        if (uniqueValues.length > 1) {
          inconsistencies.push(
            `Inconsistencia cruzada en conteo de tests: ${uniqueValues.join(', ')} (real: ${realMetrics.tests.count})`
          );
        } else if (uniqueValues[0] !== realMetrics.tests.count) {
          inconsistencies.push(
            `Todas las fases reportan conteo de tests incorrecto: ${uniqueValues[0]} (real: ${realMetrics.tests.count})`
          );
        }
      }
    } else {
      const phasesMentioningComponent = Object.keys(phaseData).filter(
        phase => phaseData[phase].mentions[component]
      );
      const reportedValues = phasesMentioningComponent
        .map(phase => phaseData[phase].reported[component])
        .filter(value => value && value !== 'N/A');

      if (reportedValues.length > 0) {
        const uniqueValues = [...new Set(reportedValues)];
        if (uniqueValues.length > 1) {
          inconsistencies.push(
            `Inconsistencia cruzada en ${component}: ${uniqueValues.join(', ')} (real: ${realMetrics[component].size})`
          );
        } else if (uniqueValues[0] !== realMetrics[component].size) {
          inconsistencies.push(
            `Todas las fases reportan tamaño incorrecto de ${component}: ${uniqueValues[0]} (real: ${realMetrics[component].size})`
          );
        }
      }
    }
  });

  return inconsistencies;
}

function main(args = process.argv.slice(2)) {
  console.log('🔍 Checking metrics consistency with REAL REPO VERIFICATION...');
  console.log('⚠️  ESTE SCRIPT ES OBLIGATORIO según PROH-009 y MAX-014');

  const reportsDir = args[0];
  const inconsistencies = checkMetricsConsistency(reportsDir);

  if (inconsistencies.length > 0) {
    console.error(
      '\n❌ Metrics consistency validation FAILED - violates PROH-009 and MAX-014:'
    );
    inconsistencies.forEach(issue => console.error(`   - ${issue}`));

    console.error('\n🚨 VIOLACIONES DETECTADAS:');
    console.error(
      '❌ PROH-009: Inconsistencias de métricas entre informes y fases'
    );
    console.error(
      '❌ MAX-014: Métricas no obtenidas dinámicamente del estado actual'
    );
    console.error('❌ OBL-008: Falta validación cruzada dinámica entre fases');
    console.error(
      '❌ QG-010: Falló verificación obligatoria de existencia y estado real'
    );

    console.error('\n💡 CORRECCIÓN OBLIGATORIA:');
    console.error(
      '1. Actualizar métricas para que coincidan con estado REAL del repositorio'
    );
    console.error(
      '2. Ejecutar comandos reales: du -sh /packages/*/src/, find . -name "*.test.*"'
    );
    console.error(
      '3. Ejecutar: npm run verify:repo-state para obtener métricas reales'
    );
    console.error(
      '4. Eliminar caracteres "·" con: tr -d "·" < archivo > archivo.limpo && mv archivo.limpo archivo'
    );
    console.error(
      '5. Ejecutar: npm run test:corrections para validar corrección'
    );

    console.error('\n❌ ESTO BLOQUEA EL PROGRESO SEGÚN REGLAS OBLIGATORIAS');
    process.exit(1);
  }

  console.log(
    '✅ Metrics consistency validation PASSED with real repo verification'
  );
  console.log('✅ All metrics are consistent with current repository state');
  console.log('✅ PROH-009, MAX-014, OBL-008, and QG-010 compliance verified');
  process.exit(0);
}

if (require.main === module) {
  main();
}

module.exports = { checkMetricsConsistency };
