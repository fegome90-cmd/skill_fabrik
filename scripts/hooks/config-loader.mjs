#!/usr/bin/env node

/**
 * Config Loader para integración PBv2
 *
 * Carga y valida la configuración centralizada desde pbv2-config.json
 */

import { join, dirname } from 'path';
import { existsSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Carga la configuración de PBv2
 * @param {string} cwd - Directorio de trabajo
 * @returns {Object} - Configuración validada
 */
export function loadConfig(cwd = process.cwd()) {
  const configPath = join(__dirname, 'pbv2-config.json');

  if (!existsSync(configPath)) {
    console.error('[PBv2 Config] ⚠️ Config file not found, using defaults');
    return getDefaultConfig();
  }

  try {
    const configData = readFileSync(configPath, 'utf8');
    const config = JSON.parse(configData);

    // Validar configuración
    const validatedConfig = validateConfig(config);

    return validatedConfig;

  } catch (error) {
    console.error('[PBv2 Config] ❌ Failed to load config:', error.message);
    return getDefaultConfig();
  }
}

/**
 * Valida que la configuración tenga todos los campos requeridos
 * @param {Object} config - Configuración a validar
 * @returns {Object} - Configuración validada
 */
function validateConfig(config) {
  const defaults = getDefaultConfig();

  // Merge con defaults para campos faltantes
  const validated = { ...defaults, ...config };

  // Validar campos críticos
  if (!validated.detection || typeof validated.detection.enabled !== 'boolean') {
    validated.detection = defaults.detection;
  }

  if (!validated.activation || !validated.activation.mode) {
    validated.activation = defaults.activation;
  }

  if (!validated.pbv2) {
    validated.pbv2 = defaults.pbv2;
  }

  return validated;
}

/**
 * Configuración por defecto
 * @returns {Object} - Configuración por defecto
 */
function getDefaultConfig() {
  return {
    version: '2.0.0',
    detection: {
      enabled: true,
      patterns: {
        strong: ['/\\[Layout\\]/i', '/Clarify.*Layout.*Operate/i'],
        contextual: ['^## Plan/i']
      },
      minStructure: {
        minBulletPoints: 2,
        requireCLOOP: false
      },
      cache: {
        enabled: true,
        maxSize: 100,
        ttlMinutes: 60
      }
    },
    activation: {
      enabled: true,
      mode: 'logOnly',
      availableModes: {
        logOnly: { description: 'Solo detecta y guarda', default: true },
        onDemand: { description: 'Pregunta al usuario', default: false },
        auto: { description: 'Activa automáticamente', default: false }
      },
      debounceMs: 2000
    },
    pbv2: {
      defaultComplexity: 'medium',
      includeFiles: 'auto',
      includeTemplate: true,
      includeTags: true,
      timeoutMs: 5000,
      fastMode: {
        enabled: true,
        repoSizeThreshold: 'medium'
      }
    },
    output: {
      saveToDevPlans: true,
      showInTerminal: false,
      terminalFormat: 'compact',
      compactMessage: '🧩 Plan detectado y guardado'
    },
    cache: {
      enabled: true,
      maxSize: 100,
      cleanupInterval: 24
    },
    metrics: {
      enabled: true,
      trackLatency: true,
      trackSuccess: true,
      trackErrors: true
    },
    fallback: {
      onError: 'logOnly',
      maxRetries: 0
    },
    development: {
      debugMode: false,
      verboseLogging: false,
      testMode: false
    }
  };
}

/**
 * Verifica si está en modo debug
 * @param {Object} config - Configuración
 * @returns {boolean} - true si está en debug mode
 */
export function isDebugMode(config) {
  return config?.development?.debugMode === true;
}

/**
 * Verifica si está en modo verbose
 * @param {Object} config - Configuración
 * @returns {boolean} - true si está en verbose mode
 */
export function isVerboseMode(config) {
  return config?.development?.verboseLogging === true;
}

/**
 * Obtiene la configuración de detección
 * @param {Object} config - Configuración completa
 * @returns {Object} - Configuración de detección
 */
export function getDetectionConfig(config) {
  return config?.detection || {};
}

/**
 * Obtiene la configuración de activación
 * @param {Object} config - Configuración completa
 * @returns {Object} - Configuración de activación
 */
export function getActivationConfig(config) {
  return config?.activation || {};
}

/**
 * Obtiene la configuración de PBv2
 * @param {Object} config - Configuración completa
 * @returns {Object} - Configuración de PBv2
 */
export function getPBv2Config(config) {
  return config?.pbv2 || {};
}

/**
 * Obtiene la configuración de salida
 * @param {Object} config - Configuración completa
 * @returns {Object} - Configuración de salida
 */
export function getOutputConfig(config) {
  return config?.output || {};
}

// Test function
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🧪 Testing Config Loader:\n');

  const config = loadConfig();
  console.log('✅ Config loaded successfully');
  console.log('Detection enabled:', config.detection.enabled);
  console.log('Activation mode:', config.activation.mode);
  console.log('PBv2 timeout:', config.pbv2.timeoutMs);
  console.log('Save to dev/plans:', config.output.saveToDevPlans);
  console.log('Debug mode:', config.development.debugMode);

  console.log('\n✅ All tests passed!');
}
