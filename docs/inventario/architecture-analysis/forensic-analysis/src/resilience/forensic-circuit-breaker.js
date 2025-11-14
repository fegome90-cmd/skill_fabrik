#!/usr/bin/env node

/**
 * Forensic Circuit Breaker
 * Inspired by router's circuit breaker patterns
 * Simple fault tolerance for forensic analysis operations
 */

class ForensicCircuitBreaker {
  constructor(options = {}) {
    this.name = options.name || 'ForensicCircuitBreaker';
    this.failureThreshold = options.failureThreshold || 5;
    this.recoveryTimeout = options.recoveryTimeout || 60000; // 1 minute
    this.monitoringPeriod = options.monitoringPeriod || 10000; // 10 seconds

    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.lastFailureTime = 0;
    this.lastSuccessTime = 0;
    this.requestCount = 0;
    this.successCount = 0;
  }

  /**
   * Ejecuta operación con protección de circuit breaker
   * @param {Function} operation - Operación a ejecutar
   * @param {...any} args - Argumentos para la operación
   * @returns {Promise} - Resultado de la operación o error
   */
  async execute(operation, ...args) {
    this.requestCount++;

    // Si el circuito está OPEN, verificar si es tiempo de reintentar
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime < this.recoveryTimeout) {
        const error = new Error(`Circuit breaker OPEN for ${this.name}`);
        error.circuitBreakerOpen = true;
        error.retryAfter =
          this.recoveryTimeout - (Date.now() - this.lastFailureTime);
        throw error;
      } else {
        // Transición a HALF_OPEN para probar si el servicio se recuperó
        this.state = 'HALF_OPEN';
        console.log(
          `🔄 Circuit breaker ${this.name} transitioning to HALF_OPEN`
        );
      }
    }

    try {
      // Ejecutar la operación
      const result = await operation(...args);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Maneja éxito de operación
   */
  onSuccess() {
    this.lastSuccessTime = Date.now();
    this.successCount++;

    if (this.state === 'HALF_OPEN') {
      // Si tenemos éxito en HALF_OPEN, cerrar el circuito
      this.state = 'CLOSED';
      this.failureCount = 0;
      console.log(`✅ Circuit breaker ${this.name} CLOSED - service recovered`);
    } else if (this.state === 'CLOSED') {
      // En CLOSED, resetear contador de fallos si tenemos éxito
      if (this.failureCount > 0) {
        this.failureCount = Math.max(0, this.failureCount - 1);
      }
    }
  }

  /**
   * Maneja fallo de operación
   */
  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === 'HALF_OPEN') {
      // Si falla en HALF_OPEN, volver a OPEN inmediatamente
      this.state = 'OPEN';
      console.log(
        `🔌 Circuit breaker ${this.name} OPEN again - service still failing`
      );
    } else if (
      this.state === 'CLOSED' &&
      this.failureCount >= this.failureThreshold
    ) {
      // Si superamos el umbral de fallos, abrir el circuito
      this.state = 'OPEN';
      console.log(
        `🔌 Circuit breaker ${this.name} OPEN - ${this.failureCount} failures detected`
      );
    }
  }

  /**
   * Obtiene estado actual del circuit breaker
   * @returns {Object} - Estado completo
   */
  getState() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      requestCount: this.requestCount,
      successCount: this.successCount,
      failureRate:
        this.requestCount > 0
          ? (this.failureCount / this.requestCount) * 100
          : 0,
      successRate:
        this.requestCount > 0
          ? (this.successCount / this.requestCount) * 100
          : 0,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      nextRetryTime:
        this.state === 'OPEN'
          ? this.lastFailureTime + this.recoveryTimeout
          : null
    };
  }

  /**
   * Reinicia el circuit breaker a estado inicial
   */
  reset() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.lastFailureTime = 0;
    this.lastSuccessTime = 0;
    this.requestCount = 0;
    this.successCount = 0;
    console.log(`🔄 Circuit breaker ${this.name} reset to CLOSED`);
  }
}

/**
 * Circuit Breaker Manager para múltiples operaciones forenses
 */
class ForensicCircuitBreakerManager {
  constructor() {
    this.circuitBreakers = new Map();
    this.setupDefaultBreakers();
  }

  /**
   * Configura circuit breakers por defecto para operaciones forenses
   */
  setupDefaultBreakers() {
    // Circuit breaker para lectura de archivos
    this.createCircuitBreaker('file-operations', {
      failureThreshold: 3,
      recoveryTimeout: 30000 // 30 segundos
    });

    // Circuit breaker para análisis de dependencias
    this.createCircuitBreaker('dependency-analysis', {
      failureThreshold: 5,
      recoveryTimeout: 60000 // 1 minuto
    });

    // Circuit breaker para validación de reglas
    this.createCircuitBreaker('rule-validation', {
      failureThreshold: 10,
      recoveryTimeout: 120000 // 2 minutos
    });

    // Circuit breaker para generación de reportes
    this.createCircuitBreaker('report-generation', {
      failureThreshold: 3,
      recoveryTimeout: 45000 // 45 segundos
    });

    // Circuit breaker para operaciones de red (si hay)
    this.createCircuitBreaker('network-operations', {
      failureThreshold: 2,
      recoveryTimeout: 90000 // 1.5 minutos
    });
  }

  /**
   * Crea un nuevo circuit breaker
   * @param {string} name - Nombre del circuit breaker
   * @param {Object} options - Opciones de configuración
   * @returns {ForensicCircuitBreaker} - Nuevo circuit breaker
   */
  createCircuitBreaker(name, options = {}) {
    const breaker = new ForensicCircuitBreaker({
      name,
      ...options
    });
    this.circuitBreakers.set(name, breaker);
    return breaker;
  }

  /**
   * Ejecuta operación con circuit breaker específico
   * @param {string} breakerName - Nombre del circuit breaker
   * @param {Function} operation - Operación a ejecutar
   * @param {...any} args - Argumentos para la operación
   * @returns {Promise} - Resultado de la operación
   */
  async execute(breakerName, operation, ...args) {
    const breaker = this.circuitBreakers.get(breakerName);
    if (!breaker) {
      throw new Error(`Circuit breaker '${breakerName}' not found`);
    }
    return breaker.execute(operation, ...args);
  }

  /**
   * Obtiene estado de todos los circuit breakers
   * @returns {Array} - Array con estados de todos los breakers
   */
  getAllStates() {
    return Array.from(this.circuitBreakers.values()).map(breaker =>
      breaker.getState()
    );
  }

  /**
   * Reinicia un circuit breaker específico
   * @param {string} breakerName - Nombre del circuit breaker
   */
  reset(breakerName) {
    const breaker = this.circuitBreakers.get(breakerName);
    if (breaker) {
      breaker.reset();
    }
  }

  /**
   * Reinicia todos los circuit breakers
   */
  resetAll() {
    for (const breaker of this.circuitBreakers.values()) {
      breaker.reset();
    }
  }

  /**
   * Verifica si hay circuit breakers abiertos
   * @returns {boolean} - True si hay algún circuit breaker abierto
   */
  hasOpenCircuits() {
    return Array.from(this.circuitBreakers.values()).some(
      breaker => breaker.state === 'OPEN'
    );
  }

  /**
   * Obtiene circuit breakers abiertos
   * @returns {Array} - Array con circuit breakers abiertos
   */
  getOpenCircuits() {
    return Array.from(this.circuitBreakers.values())
      .filter(breaker => breaker.state === 'OPEN')
      .map(breaker => breaker.getState());
  }

  /**
   * Imprime resumen de estado de circuit breakers
   */
  printStatus() {
    console.log('\n🔌 Forensic Circuit Breaker Status');
    console.log('=====================================');

    const states = this.getAllStates();
    let totalOpen = 0;
    let totalHalfOpen = 0;
    let totalClosed = 0;

    states.forEach(state => {
      const status =
        state.state === 'OPEN'
          ? '🔴'
          : state.state === 'HALF_OPEN'
            ? '🟡'
            : '🟢';

      console.log(`${status} ${state.name}:`);
      console.log(`  Estado: ${state.state}`);
      console.log(
        `  Fallos: ${state.failureCount}/${state.requestCount} (${state.failureRate.toFixed(1)}%)`
      );
      console.log(
        `  Éxitos: ${state.successCount} (${state.successRate.toFixed(1)}%)`
      );

      if (state.state === 'OPEN') {
        console.log(
          `  Reintentar en: ${Math.max(0, state.nextRetryTime - Date.now())}ms`
        );
        totalOpen++;
      } else if (state.state === 'HALF_OPEN') {
        totalHalfOpen++;
      } else {
        totalClosed++;
      }
      console.log('');
    });

    console.log('📊 Resumen:');
    console.log(`  Cerrados: ${totalClosed}`);
    console.log(`  Medio abiertos: ${totalHalfOpen}`);
    console.log(`  Abiertos: ${totalOpen}`);
    console.log(`  Total: ${states.length}`);

    if (totalOpen > 0) {
      console.log(
        `\n⚠️  ${totalOpen} circuit breaker(s) abierto(s) - algunas operaciones pueden fallar`
      );
    }
  }
}

/**
 * Funciones helper para operaciones comunes con circuit breaker
 */
class SafeForensicOperations {
  constructor() {
    this.circuitManager = new ForensicCircuitBreakerManager();
  }

  /**
   * Lectura segura de archivos
   * @param {string} filePath - Ruta del archivo
   * @param {string} encoding - Codificación (default: 'utf8')
   * @returns {Promise<string>} - Contenido del archivo
   */
  async safeReadFile(filePath, encoding = 'utf8') {
    return this.circuitManager.execute('file-operations', async () => {
      const fs = require('fs');
      return fs.readFileSync(filePath, encoding);
    });
  }

  /**
   * Análisis seguro de dependencias
   * @param {string} projectPath - Ruta del proyecto
   * @returns {Promise<Object>} - Resultado del análisis
   */
  async safeAnalyzeDependencies(projectPath) {
    return this.circuitManager.execute('dependency-analysis', async () => {
      const fs = require('fs');
      const path = require('path');

      const packageJsonPath = path.join(projectPath, 'package.json');
      if (!fs.existsSync(packageJsonPath)) {
        throw new Error('package.json not found');
      }

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      return {
        dependencies: Object.keys(packageJson.dependencies || {}),
        devDependencies: Object.keys(packageJson.devDependencies || {}),
        total:
          Object.keys(packageJson.dependencies || {}).length +
          Object.keys(packageJson.devDependencies || {}).length
      };
    });
  }

  /**
   * Validación segura de reglas
   * @param {string} rulesPath - Ruta del archivo de reglas
   * @returns {Promise<Object>} - Resultado de validación
   */
  async safeValidateRules(rulesPath) {
    return this.circuitManager.execute('rule-validation', async () => {
      const fs = require('fs');

      if (!fs.existsSync(rulesPath)) {
        throw new Error('Rules file not found');
      }

      const rulesContent = fs.readFileSync(rulesPath, 'utf8');
      const rules = JSON.parse(rulesContent);

      const requiredSections = ['maximas', 'prohibiciones', 'obligaciones'];
      const missingSections = requiredSections.filter(
        section => !rules[section]
      );

      if (missingSections.length > 0) {
        throw new Error(`Missing sections: ${missingSections.join(', ')}`);
      }

      return { valid: true, sections: requiredSections };
    });
  }

  /**
   * Generación segura de reportes
   * @param {Object} reportData - Datos del reporte
   * @param {string} outputPath - Ruta de salida
   * @returns {Promise<string>} - Ruta del reporte generado
   */
  async safeGenerateReport(reportData, outputPath) {
    return this.circuitManager.execute('report-generation', async () => {
      const fs = require('fs');
      const path = require('path');

      // Asegurar que el directorio existe
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Generar contenido del reporte
      const content = this.generateReportContent(reportData);
      fs.writeFileSync(outputPath, content, 'utf8');

      return outputPath;
    });
  }

  /**
   * Genera contenido del reporte (simplificado)
   * @param {Object} data - Datos del reporte
   * @returns {string} - Contenido formateado
   */
  generateReportContent(data) {
    let content = '# Forensic Analysis Report\n\n';
    content += `Generated: ${new Date().toISOString()}\n\n`;

    if (data.summary) {
      content += '## Summary\n\n';
      Object.entries(data.summary).forEach(([key, value]) => {
        content += `- ${key}: ${value}\n`;
      });
    }

    if (data.issues && data.issues.length > 0) {
      content += '\n## Issues Found\n\n';
      data.issues.forEach((issue, index) => {
        content += `${index + 1}. **${issue.type}** (${issue.severity})\n`;
        content += `   ${issue.description}\n`;
        if (issue.recommendation) {
          content += `   Recommendation: ${issue.recommendation}\n`;
        }
        content += '\n';
      });
    }

    return content;
  }

  /**
   * Obtiene estado completo de resiliencia
   * @returns {Object} - Estado de circuit breakers y métricas
   */
  getResilienceStatus() {
    return {
      circuitBreakers: this.circuitManager.getAllStates(),
      hasOpenCircuits: this.circuitManager.hasOpenCircuits(),
      openCircuits: this.circuitManager.getOpenCircuits(),
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = {
  ForensicCircuitBreaker,
  ForensicCircuitBreakerManager,
  SafeForensicOperations
};

// CLI execution
if (require.main === module) {
  const {
    ForensicCircuitBreakerManager
  } = require('./forensic-circuit-breaker');

  const manager = new ForensicCircuitBreakerManager();
  manager.printStatus();
}
