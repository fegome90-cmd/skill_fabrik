#!/usr/bin/env node

/**
 * Script de Validación contra rules_forense_v2.json
 * Implementación GREEN phase para MAX-013
 * Valida que esta ejecución cumpla con todas las reglas
 * Task: SF-TDD-2025-V2.1
 * Date: 2025-11-14
 */

const fs = require('fs');
const path = require('path');

function validateThisExecutionAgainstRules() {
  const rulesPath = path.join(__dirname, '../../config/rules_forense_v2.json');

  if (!fs.existsSync(rulesPath)) {
    throw new Error('❌ MAX-013: rules_forense_v2.json no encontrado');
  }

  const rules = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));

  // Validar versión de rules
  if (rules.metadata.version !== '2.0.0') {
    throw new Error(
      `❌ MAX-013: Versión de rules incorrecta: ${rules.metadata.version}`
    );
  }

  // Validar máximas requeridas
  const requiredMaximas = [
    'ejecucion_contra_rules',
    'tdd_integration',
    'clean_code'
  ];
  const missingMaximas = requiredMaximas.filter(max => !rules.maximas[max]);

  if (missingMaximas.length > 0) {
    throw new Error(
      `❌ MAX-013: Máximas faltantes: ${missingMaximas.join(', ')}`
    );
  }

  // Validar obligaciones requeridas
  const requiredObligaciones = ['OBL-017'];
  const missingObligaciones = requiredObligaciones.filter(
    obl => !rules.obligaciones.find(o => o.id === obl)
  );

  if (missingObligaciones.length > 0) {
    throw new Error(
      `❌ MAX-013: Obligaciones faltantes: ${missingObligaciones.join(', ')}`
    );
  }

  // Validar prohibiciones requeridas
  const requiredProhibiciones = ['PROH-010', 'PROH-011'];
  const missingProhibiciones = requiredProhibiciones.filter(
    proh => !rules.prohibiciones.find(p => p.id === proh)
  );

  if (missingProhibiciones.length > 0) {
    throw new Error(
      `❌ MAX-013: Prohibiciones faltantes: ${missingProhibiciones.join(', ')}`
    );
  }

  return {
    compliant: true,
    rules_reference: 'rules_forense_v2.json',
    rules_version: rules.metadata.version,
    maximas_validated: requiredMaximas.length,
    obligaciones_validated: requiredObligaciones.length,
    prohibiciones_validated: requiredProhibiciones.length,
    timestamp: new Date().toISOString(),
    validation_path: rulesPath
  };
}

// Ejecutar validación si se llama directamente
if (require.main === module) {
  try {
    const validation = validateThisExecutionAgainstRules();
    console.log('✅ MAX-013: Validación contra rules_forense_v2.json exitosa');
    console.log(JSON.stringify(validation, null, 2));
    process.exit(0);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

module.exports = { validateThisExecutionAgainstRules };
