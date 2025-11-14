#!/usr/bin/env node

/**
 * Validador de consistencia de métricas entre fases
 * Previene inconsistencias como las detectadas por TDD
 * Refactorizado para usar utilidades compartidas
 */

const path = require('path');
const {
  CRITICAL_METRICS,
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

  log('info', `Analizando ${phaseFiles.length} archivos de fases...`);

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

    // Verificar consistencia de métricas usando utilidades centralizadas
    Object.entries(CRITICAL_METRICS).forEach(([component, size]) => {
      const hasComponent = content.toLowerCase().includes(component);
      const hasSize = content.includes(size);

      if (hasComponent && !hasSize) {
        inconsistencies.push(
          `${fileName}: Menciona "${component}" pero no tiene métrica "${size}"`
        );
      }
    });
  });

  return inconsistencies;
}

function main(args = process.argv.slice(2)) {
  console.log('🔍 Checking metrics consistency...');

  const reportsDir = args[0];
  const inconsistencies = checkMetricsConsistency(reportsDir);

  if (inconsistencies.length > 0) {
    console.error('\n❌ Metrics consistency validation failed:');
    inconsistencies.forEach(issue => console.error(`   - ${issue}`));

    console.error('\n💡 Para corregir:');
    console.error(
      '1. Eliminar caracteres "·" con: tr -d "·" < archivo > archivo.limpo && mv archivo.limpo archivo'
    );
    console.error(
      '2. Agregar métricas faltantes en las fases correspondientes'
    );
    console.error('3. Ejecutar: npm run test:corrections para validar');

    process.exit(1);
  }

  console.log('✅ Metrics consistency validation passed');
  process.exit(0);
}

if (require.main === module) {
  main();
}

module.exports = { checkMetricsConsistency };
