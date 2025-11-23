#!/usr/bin/env node

/**
 * Forensic Event Service
 * Inspired by daemon patterns - event-driven forensic analysis
 * Simple JSONL persistence and event sourcing for forensic operations
 */

const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

class ForensicEventService extends EventEmitter {
  constructor(options = {}) {
    super();
    this.eventsDir =
      options.eventsDir || path.join(process.cwd(), 'obs', 'kpi');
    this.sessionId = options.sessionId || `forensic-${Date.now()}`;
    this.eventsFile = path.join(this.eventsDir, `${this.sessionId}.jsonl`);
    this.maxEventsPerFile = options.maxEventsPerFile || 1000;
    this.eventCount = 0;
    this.sessionStartTime = Date.now();

    // Ensure events directory exists
    this.ensureDirectoryExists();
  }

  /**
   * Publica un evento forense
   * @param {string} type - Tipo de evento
   * @param {Object} data - Datos del evento
   * @param {Object} metadata - Metadatos adicionales
   */
  async publishEvent(type, data = {}, metadata = {}) {
    const event = {
      id: this.generateEventId(),
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      type,
      data,
      metadata: {
        ...metadata,
        source: 'forensic-event-service',
        version: '1.0.0'
      }
    };

    // Emitir evento para listeners
    this.emit('forensic-event', event);
    this.emit(type, event);

    // Persistir evento
    await this.persistEvent(event);
    this.eventCount++;

    return event;
  }

  /**
   * Inicia una nueva sesión de análisis forense
   * @param {Object} context - Contexto de la sesión
   * @returns {Object} - Información de la sesión
   */
  async startSession(context = {}) {
    const sessionEvent = await this.publishEvent(
      'SESSION_STARTED',
      {
        startTime: new Date().toISOString(),
        context
      },
      {
        phase: 'INITIALIZATION'
      }
    );

    console.log(`🔍 Forensic session started: ${this.sessionId}`);
    return sessionEvent;
  }

  /**
   * Finaliza la sesión de análisis forense
   * @param {Object} results - Resultados del análisis
   * @returns {Object} - Evento de fin de sesión
   */
  async endSession(results = {}) {
    const sessionEvent = await this.publishEvent(
      'SESSION_ENDED',
      {
        endTime: new Date().toISOString(),
        duration: Date.now() - this.sessionStartTime,
        totalEvents: this.eventCount,
        results
      },
      {
        phase: 'COMPLETION'
      }
    );

    console.log(
      `✅ Forensic session ended: ${this.sessionId} (${this.eventCount} events)`
    );
    return sessionEvent;
  }

  /**
   * Registra métricas de análisis
   * @param {Object} metrics - Métricas a registrar
   */
  async logMetrics(metrics) {
    return this.publishEvent(
      'METRICS_RECORDED',
      {
        metrics,
        timestamp: new Date().toISOString()
      },
      {
        category: 'PERFORMANCE'
      }
    );
  }

  /**
   * Registra un hallazgo forense
   * @param {Object} finding - Hallazgo detectado
   * @param {string} severity - Severidad (LOW, MEDIUM, HIGH, CRITICAL)
   */
  async logFinding(finding, severity = 'MEDIUM') {
    return this.publishEvent(
      'FINDING_DETECTED',
      {
        finding,
        severity,
        timestamp: new Date().toISOString()
      },
      {
        category: 'ANALYSIS',
        severity
      }
    );
  }

  /**
   * Registra progreso del análisis
   * @param {string} phase - Fase actual
   * @param {number} progress - Progreso (0-100)
   * @param {Object} details - Detalles adicionales
   */
  async logProgress(phase, progress, details = {}) {
    return this.publishEvent(
      'PROGRESS_UPDATE',
      {
        phase,
        progress,
        details,
        timestamp: new Date().toISOString()
      },
      {
        category: 'PROGRESS'
      }
    );
  }

  /**
   * Registra un error o warning
   * @param {Error|string} error - Error detectado
   * @param {string} context - Contexto del error
   * @param {string} severity - Severidad
   */
  async logError(error, context = '', severity = 'MEDIUM') {
    const errorData = {
      message: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : null,
      context,
      timestamp: new Date().toISOString()
    };

    return this.publishEvent('ERROR_OCCURRED', errorData, {
      category: 'ERROR',
      severity
    });
  }

  /**
   * Registra una acción del usuario
   * @param {string} action - Acción realizada
   * @param {Object} params - Parámetros de la acción
   */
  async logUserAction(action, params = {}) {
    return this.publishEvent(
      'USER_ACTION',
      {
        action,
        params,
        timestamp: new Date().toISOString()
      },
      {
        category: 'USER_INTERACTION'
      }
    );
  }

  /**
   * Consulta eventos de la sesión actual
   * @param {Object} filters - Filtros para la consulta
   * @returns {Array} - Eventos filtrados
   */
  async queryEvents(filters = {}) {
    const events = await this.loadEventsFromSession();
    return this.filterEvents(events, filters);
  }

  /**
   * Consulta eventos de todas las sesiones
   * @param {Object} filters - Filtros para la consulta
   * @param {number} limit - Límite de resultados
   * @returns {Array} - Eventos filtrados
   */
  async queryAllSessions(filters = {}, limit = 1000) {
    const events = await this.loadAllEvents();
    const filtered = this.filterEvents(events, filters);
    return filtered.slice(0, limit);
  }

  /**
   * Genera reporte de sesión
   * @returns {Object} - Reporte de la sesión
   */
  async generateSessionReport() {
    const events = await this.loadEventsFromSession();
    const sessionStart = events.find(e => e.type === 'SESSION_STARTED');
    const sessionEnd = events.find(e => e.type === 'SESSION_ENDED');

    const findings = events.filter(e => e.type === 'FINDING_DETECTED');
    const errors = events.filter(e => e.type === 'ERROR_OCCURRED');
    const metrics = events.filter(e => e.type === 'METRICS_RECORDED');

    return {
      sessionId: this.sessionId,
      startTime: sessionStart?.timestamp,
      endTime: sessionEnd?.timestamp,
      duration: sessionEnd?.data?.duration,
      totalEvents: events.length,
      findings: {
        total: findings.length,
        bySeverity: this.groupBy(findings, 'data.severity')
      },
      errors: {
        total: errors.length,
        bySeverity: this.groupBy(errors, 'metadata.severity')
      },
      metrics: {
        total: metrics.length,
        latest: metrics[metrics.length - 1]?.data?.metrics || {}
      },
      phases: this.extractPhases(events)
    };
  }

  /**
   * Persiste evento en archivo JSONL
   * @param {Object} event - Evento a persistir
   */
  async persistEvent(event) {
    try {
      const eventLine = JSON.stringify(event) + '\n';
      fs.appendFileSync(this.eventsFile, eventLine, 'utf8');
    } catch (error) {
      console.error(`❌ Failed to persist event: ${error.message}`);
    }
  }

  /**
   * Carga eventos de la sesión actual
   * @returns {Array} - Array de eventos
   */
  async loadEventsFromSession() {
    try {
      if (!fs.existsSync(this.eventsFile)) {
        return [];
      }

      const content = fs.readFileSync(this.eventsFile, 'utf8');
      const lines = content.trim().split('\n');

      return lines.filter(line => line.trim()).map(line => JSON.parse(line));
    } catch (error) {
      console.error(`❌ Failed to load events: ${error.message}`);
      return [];
    }
  }

  /**
   * Carga eventos de todas las sesiones
   * @returns {Array} - Array de todos los eventos
   */
  async loadAllEvents() {
    try {
      if (!fs.existsSync(this.eventsDir)) {
        return [];
      }

      const files = fs
        .readdirSync(this.eventsDir)
        .filter(file => file.endsWith('.jsonl'))
        .map(file => path.join(this.eventsDir, file));

      const allEvents = [];

      for (const file of files) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          const lines = content.trim().split('\n');

          const events = lines
            .filter(line => line.trim())
            .map(line => JSON.parse(line));

          allEvents.push(...events);
        } catch (error) {
          console.error(`❌ Failed to read ${file}: ${error.message}`);
        }
      }

      // Ordenar por timestamp
      return allEvents.sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
      );
    } catch (error) {
      console.error(`❌ Failed to load all events: ${error.message}`);
      return [];
    }
  }

  /**
   * Filtra eventos según criterios
   * @param {Array} events - Eventos a filtrar
   * @param {Object} filters - Criterios de filtrado
   * @returns {Array} - Eventos filtrados
   */
  filterEvents(events, filters = {}) {
    let filtered = [...events];

    if (filters.type) {
      filtered = filtered.filter(e => e.type === filters.type);
    }

    if (filters.sessionId) {
      filtered = filtered.filter(e => e.sessionId === filters.sessionId);
    }

    if (filters.category) {
      filtered = filtered.filter(e => e.metadata.category === filters.category);
    }

    if (filters.severity) {
      filtered = filtered.filter(e => e.metadata.severity === filters.severity);
    }

    if (filters.startTime) {
      const startTime = new Date(filters.startTime);
      filtered = filtered.filter(e => new Date(e.timestamp) >= startTime);
    }

    if (filters.endTime) {
      const endTime = new Date(filters.endTime);
      filtered = filtered.filter(e => new Date(e.timestamp) <= endTime);
    }

    if (filters.limit) {
      filtered = filtered.slice(0, filters.limit);
    }

    return filtered;
  }

  /**
   * Agrupa elementos por una propiedad
   * @param {Array} items - Items a agrupar
   * @param {string} property - Propiedad para agrupar
   * @returns {Object} - Items agrupados
   */
  groupBy(items, property) {
    return items.reduce((groups, item) => {
      const value = this.getNestedProperty(item, property);
      const key = value || 'UNKNOWN';
      groups[key] = (groups[key] || 0) + 1;
      return groups;
    }, {});
  }

  /**
   * Obtiene propiedad anidada de un objeto
   * @param {Object} obj - Objeto
   * @param {string} path - Ruta de la propiedad
   * @returns {*} - Valor de la propiedad
   */
  getNestedProperty(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Extrae fases del análisis
   * @param {Array} events - Eventos de la sesión
   * @returns {Array} - Fases identificadas
   */
  extractPhases(events) {
    const progressEvents = events.filter(e => e.type === 'PROGRESS_UPDATE');
    const phases = {};

    progressEvents.forEach(event => {
      const phase = event.data.phase;
      if (!phases[phase]) {
        phases[phase] = {
          startTime: event.timestamp,
          progressUpdates: 0,
          maxProgress: 0
        };
      }
      phases[phase].progressUpdates++;
      phases[phase].maxProgress = Math.max(
        phases[phase].maxProgress,
        event.data.progress || 0
      );
    });

    return phases;
  }

  /**
   * Asegura que el directorio de eventos exista
   */
  ensureDirectoryExists() {
    if (!fs.existsSync(this.eventsDir)) {
      fs.mkdirSync(this.eventsDir, { recursive: true });
    }
  }

  /**
   * Genera ID único para evento
   * @returns {string} - ID único
   */
  generateEventId() {
    return `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Obtiene estadísticas de uso
   * @returns {Object} - Estadísticas
   */
  getUsageStats() {
    return {
      sessionId: this.sessionId,
      eventCount: this.eventCount,
      sessionDuration: Date.now() - this.sessionStartTime,
      eventsFile: this.eventsFile,
      eventsDirectory: this.eventsDir
    };
  }

  /**
   * Imprime resumen de la sesión actual
   */
  async printSessionSummary() {
    const report = await this.generateSessionReport();

    console.log('\n📊 Forensic Session Summary');
    console.log('============================');

    console.log(`\n🆔 Session ID: ${report.sessionId}`);
    console.log(`⏱️  Duration: ${Math.round(report.duration / 1000)}s`);
    console.log(`📋 Total Events: ${report.totalEvents}`);

    if (report.startTime) {
      console.log(`🕐 Started: ${report.startTime}`);
    }

    if (report.findings.total > 0) {
      console.log(`\n🔍 Findings: ${report.findings.total}`);
      Object.entries(report.findings.bySeverity).forEach(
        ([severity, count]) => {
          console.log(`  ${severity}: ${count}`);
        }
      );
    }

    if (report.errors.total > 0) {
      console.log(`\n❌ Errors: ${report.errors.total}`);
      Object.entries(report.errors.bySeverity).forEach(([severity, count]) => {
        console.log(`  ${severity}: ${count}`);
      });
    }

    if (Object.keys(report.phases).length > 0) {
      console.log('\n📈 Phases:');
      Object.entries(report.phases).forEach(([phase, data]) => {
        console.log(
          `  ${phase}: ${data.progressUpdates} updates, ${data.maxProgress}% max progress`
        );
      });
    }
  }
}

module.exports = ForensicEventService;

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  const eventService = new ForensicEventService();

  switch (command) {
    case 'start':
      eventService
        .startSession({ user: process.env.USER })
        .then(() => console.log('Session started successfully'))
        .catch(console.error);
      break;

    case 'end':
      eventService
        .endSession({ status: 'completed' })
        .then(() => console.log('Session ended successfully'))
        .catch(console.error);
      break;

    case 'summary':
      eventService.printSessionSummary().catch(console.error);
      break;

    case 'test':
      // Test basic functionality
      eventService
        .startSession({ test: true })
        .then(() => eventService.logProgress('TEST_PHASE', 50))
        .then(() =>
          eventService.logFinding(
            { type: 'TEST_FINDING', description: 'Test finding' },
            'LOW'
          )
        )
        .then(() => eventService.endSession({ test: true }))
        .then(() => eventService.printSessionSummary())
        .catch(console.error);
      break;

    default:
      console.log(
        'Usage: node forensic-event-service.js [start|end|summary|test]'
      );
  }
}
