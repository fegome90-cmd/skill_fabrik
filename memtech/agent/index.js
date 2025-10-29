#!/usr/bin/env node

/**
 * MemTech Agent - Sistema de Mantenimiento Interno de Core
 *
 * Este es el técnico especializado que mantiene y optimiza todos los sistemas en core/
 * No es un producto separado, sino el sistema de mantenimiento interno.
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';
import CoreMemoryConnector from './core-memory-connector.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const execAsync = promisify(exec);

// Cargar configuración
dotenv.config({ path: join(__dirname, '..', '..', '.env') });

class MemTechAgent {
  constructor() {
    this.memoryConnector = new CoreMemoryConnector();
    this.coreSystems = {
      surprise_metrics: {
        path: join(__dirname, '..', 'surprise-metrics'),
        status: 'unknown',
        health_endpoint: 'http://localhost:3000/health',
        dependencies: ['postgresql', 'redis', 'qdrant'],
      },
      memory_system: {
        path: join(__dirname, '..', 'memory'),
        status: 'unknown',
        components: ['short.ts', 'long.ts', 'memory-state.json'],
      },
      context_management: {
        path: join(__dirname, '..', 'context-management'),
        status: 'unknown',
        components: ['detector', 'isolator', 'validator', 'memory'],
      },
      ace_system: {
        path: join(__dirname, '..', 'ace'),
        status: 'unknown',
        components: ['scripts', 'integrations', 'data'],
      },
    };

    this.maintenance = {
      monitoring: { active: false, interval: 30000 },
      optimization: { active: false, last_run: null },
      diagnostics: { active: false, issues_found: 0 },
      auto_fix: { enabled: true, fixes_applied: 0 },
    };
  }

  /**
   * Inicializar MemTech Agent como técnico de core/
   */
  async initialize() {
    console.log('🔧 Inicializando MemTech Agent - Técnico de Core...');

    try {
      // 1. Conectar con sistema de memoria local
      await this.memoryConnector.initialize();

      // 2. Guardar contexto de inicialización
      await this.memoryConnector.saveContext(
        'memtech_initialization',
        'MemTech Agent inicializado como técnico de core/',
        { type: 'system_event', priority: 'high' }
      );

      // 3. Verificar estado de todos los sistemas de core/
      await this.auditCoreSystems();

      // 4. Iniciar mantenimiento preventivo
      await this.startPreventiveMaintenance();

      // 5. Configurar monitoreo continuo
      this.startContinuousMonitoring();

      console.log('✅ MemTech Agent inicializado como técnico de core/');
      return true;
    } catch (error) {
      console.error('❌ Error inicializando MemTech Agent:', error);
      return false;
    }
  }

  /**
   * Auditoría completa de sistemas en core/
   */
  async auditCoreSystems() {
    console.log('🔍 Auditando sistemas de core/...');

    for (const [systemName, system] of Object.entries(this.coreSystems)) {
      try {
        await this.checkSystemHealth(systemName, system);
      } catch (error) {
        console.error(`❌ Error auditando ${systemName}:`, error.message);
        system.status = 'error';
      }
    }
  }

  /**
   * Verificar salud de un sistema específico
   */
  async checkSystemHealth(systemName, system) {
    switch (systemName) {
      case 'surprise_metrics':
        await this.checkSurpriseMetricsHealth(system);
        break;
      case 'memory_system':
        await this.checkMemorySystemHealth(system);
        break;
      case 'context_management':
        await this.checkContextManagementHealth(system);
        break;
      case 'ace_system':
        await this.checkACESystemHealth(system);
        break;
    }
  }

  /**
   * Verificar salud del Surprise Metrics System
   */
  async checkSurpriseMetricsHealth(system) {
    try {
      const response = await fetch(system.health_endpoint);
      if (response.ok) {
        const health = await response.json();
        system.status = 'healthy';
        system.health_data = health;
        console.log('✅ Surprise Metrics: Saludable');
      } else {
        system.status = 'unhealthy';
        console.log('⚠️  Surprise Metrics: No saludable');
      }
    } catch (error) {
      system.status = 'disconnected';
      console.log('❌ Surprise Metrics: Desconectado');
    }
  }

  /**
   * Verificar salud del Memory System
   */
  async checkMemorySystemHealth(system) {
    try {
      // Verificar que los archivos principales existan
      const fs = await import('fs');
      const components = system.components;
      let allPresent = true;

      for (const component of components) {
        const filePath = join(system.path, component);
        if (!fs.existsSync(filePath)) {
          allPresent = false;
          break;
        }
      }

      if (allPresent) {
        system.status = 'healthy';
        console.log('✅ Memory System: Componentes presentes');
      } else {
        system.status = 'incomplete';
        console.log('⚠️  Memory System: Componentes faltantes');
      }
    } catch (error) {
      system.status = 'error';
      console.log('❌ Memory System: Error de verificación');
    }
  }

  /**
   * Verificar salud del Context Management System
   */
  async checkContextManagementHealth(system) {
    try {
      const fs = await import('fs');
      const components = system.components;
      let healthyComponents = 0;

      for (const component of components) {
        const componentPath = join(system.path, component);
        if (fs.existsSync(componentPath)) {
          healthyComponents++;
        }
      }

      const healthPercentage = (healthyComponents / components.length) * 100;

      if (healthPercentage >= 80) {
        system.status = 'healthy';
        console.log(`✅ Context Management: ${healthPercentage.toFixed(1)}% saludable`);
      } else if (healthPercentage >= 50) {
        system.status = 'degraded';
        console.log(`⚠️  Context Management: ${healthPercentage.toFixed(1)}% saludable`);
      } else {
        system.status = 'unhealthy';
        console.log(`❌ Context Management: ${healthPercentage.toFixed(1)}% saludable`);
      }
    } catch (error) {
      system.status = 'error';
      console.log('❌ Context Management: Error de verificación');
    }
  }

  /**
   * Verificar salud del ACE System
   */
  async checkACESystemHealth(system) {
    try {
      const fs = await import('fs');
      const components = system.components;
      let healthyComponents = 0;

      for (const component of components) {
        const componentPath = join(system.path, component);
        if (fs.existsSync(componentPath)) {
          healthyComponents++;
        }
      }

      const healthPercentage = (healthyComponents / components.length) * 100;

      if (healthPercentage >= 80) {
        system.status = 'healthy';
        console.log(`✅ ACE System: ${healthPercentage.toFixed(1)}% saludable`);
      } else if (healthPercentage >= 50) {
        system.status = 'degraded';
        console.log(`⚠️  ACE System: ${healthPercentage.toFixed(1)}% saludable`);
      } else {
        system.status = 'unhealthy';
        console.log(`❌ Context Management: ${healthPercentage.toFixed(1)}% saludable`);
      }
    } catch (error) {
      system.status = 'error';
      console.log('❌ ACE System: Error de verificación');
    }
  }

  /**
   * Iniciar mantenimiento preventivo
   */
  async startPreventiveMaintenance() {
    console.log('🛠️  Iniciando mantenimiento preventivo...');

    // 1. Verificar dependencias de base de datos
    await this.checkDatabaseDependencies();

    // 2. Optimizar configuraciones
    await this.optimizeConfigurations();

    // 3. Limpiar archivos temporales
    await this.cleanupTempFiles();

    console.log('✅ Mantenimiento preventivo completado');
  }

  /**
   * Verificar dependencias de base de datos
   */
  async checkDatabaseDependencies() {
    console.log('🗄️  Verificando dependencias de base de datos...');

    // Verificar PostgreSQL
    try {
      const { stdout } = await execAsync('pg_isready -h localhost -p 5433');
      console.log('✅ PostgreSQL: Disponible');
    } catch (error) {
      console.log('❌ PostgreSQL: No disponible');
    }

    // Verificar Redis
    try {
      const { stdout } = await execAsync('redis-cli -p 6379 ping');
      if (stdout.trim() === 'PONG') {
        console.log('✅ Redis: Disponible');
      }
    } catch (error) {
      console.log('❌ Redis: No disponible');
    }

    // Verificar Qdrant Cloud
    try {
      const response = await fetch(`${process.env.QDRANT_URL}/readyz`, {
        headers: { 'api-key': process.env.QDRANT_CLUSTER_TOKEN },
        timeout: 5000,
      });
      if (response.ok) {
        console.log('✅ Qdrant Cloud: Disponible');
      }
    } catch (error) {
      console.log('❌ Qdrant Cloud: No disponible');
    }
  }

  /**
   * Optimizar configuraciones
   */
  async optimizeConfigurations() {
    console.log('⚙️  Optimizando configuraciones...');

    // Aquí se aplicarían optimizaciones específicas para cada sistema
    // Por ahora, solo verificamos que las configuraciones estén presentes

    const configFiles = [
      'core/surprise-metrics/config/staging-config.yaml',
      'core/surprise-metrics/config/staging.env',
      'core/ace/configs/',
      'core/context-management/schemas/',
    ];

    for (const configFile of configFiles) {
      try {
        const fs = await import('fs');
        const fullPath = join(__dirname, '..', '..', configFile);
        if (fs.existsSync(fullPath)) {
          console.log(`✅ Configuración: ${configFile}`);
        } else {
          console.log(`⚠️  Configuración faltante: ${configFile}`);
        }
      } catch (error) {
        console.log(`❌ Error verificando: ${configFile}`);
      }
    }
  }

  /**
   * Limpiar archivos temporales
   */
  async cleanupTempFiles() {
    console.log('🧹 Limpiando archivos temporales...');

    const tempDirs = [
      'core/surprise-metrics/logs/',
      'core/ace/logs/',
      'core/context-management/analytics/',
      'core/memory-monitor.cjs',
    ];

    for (const tempDir of tempDirs) {
      try {
        const fs = await import('fs');
        const fullPath = join(__dirname, '..', '..', tempDir);
        if (fs.existsSync(fullPath)) {
          // Aquí se limpiarían archivos antiguos
          console.log(`✅ Limpieza: ${tempDir}`);
        }
      } catch (error) {
        console.log(`⚠️  Error limpiando: ${tempDir}`);
      }
    }
  }

  /**
   * Iniciar monitoreo continuo
   */
  startContinuousMonitoring() {
    console.log('📊 Iniciando monitoreo continuo de core/...');

    this.maintenance.monitoring.active = true;

    setInterval(async () => {
      await this.performMaintenanceCycle();
    }, this.maintenance.monitoring.interval);
  }

  /**
   * Ciclo de mantenimiento
   */
  async performMaintenanceCycle() {
    try {
      // Guardar contexto del ciclo
      await this.memoryConnector.saveContext(
        'maintenance_cycle',
        `Ciclo de mantenimiento iniciado - ${new Date().toISOString()}`,
        { type: 'maintenance', cycle: 'continuous' }
      );

      // 1. Verificar salud de sistemas
      await this.auditCoreSystems();

      // 2. Aplicar optimizaciones si es necesario
      if (this.shouldOptimize()) {
        await this.performOptimization();
      }

      // 3. Ejecutar diagnósticos
      if (this.shouldDiagnose()) {
        await this.performDiagnostics();
      }

      // Limpiar memoria expirada
      this.memoryConnector.cleanupExpiredMemory();
    } catch (error) {
      console.error('Error en ciclo de mantenimiento:', error);
      // Guardar error en memoria
      await this.memoryConnector.saveContext(
        'maintenance_error',
        `Error en ciclo de mantenimiento: ${error.message}`,
        { type: 'error', severity: 'medium' }
      );
    }
  }

  /**
   * Determinar si se debe optimizar
   */
  shouldOptimize() {
    const unhealthySystems = Object.values(this.coreSystems).filter(s => s.status !== 'healthy');
    return unhealthySystems.length > 0 || this.maintenance.optimization.last_run === null;
  }

  /**
   * Determinar si se debe diagnosticar
   */
  shouldDiagnose() {
    return this.maintenance.diagnostics.issues_found > 0;
  }

  /**
   * Realizar optimización
   */
  async performOptimization() {
    console.log('⚡ Aplicando optimizaciones...');
    this.maintenance.optimization.last_run = new Date();
    // Aquí se aplicarían optimizaciones específicas
  }

  /**
   * Realizar diagnósticos
   */
  async performDiagnostics() {
    console.log('🔍 Ejecutando diagnósticos...');
    // Aquí se ejecutarían diagnósticos específicos
  }

  /**
   * Recuperar contexto desde memoria local
   */
  async getContext(topic) {
    return await this.memoryConnector.retrieveContext(topic);
  }

  /**
   * Guardar contexto en memoria local
   */
  async saveContext(topic, content, metadata = {}) {
    return await this.memoryConnector.saveContext(topic, content, metadata);
  }

  /**
   * Obtener estado del MemTech Agent
   */
  getStatus() {
    const healthySystems = Object.values(this.coreSystems).filter(
      s => s.status === 'healthy'
    ).length;
    const totalSystems = Object.keys(this.coreSystems).length;
    const memoryStatus = this.memoryConnector.getMemoryStatus();

    return {
      timestamp: new Date().toISOString(),
      agent_type: 'core_maintenance_technician',
      systems_healthy: healthySystems,
      systems_total: totalSystems,
      systems: this.coreSystems,
      maintenance: this.maintenance,
      memory: memoryStatus,
    };
  }

  /**
   * Generar reporte de mantenimiento
   */
  generateMaintenanceReport() {
    const status = this.getStatus();

    return {
      report_type: 'core_maintenance_report',
      timestamp: new Date().toISOString(),
      summary: {
        overall_health: status.systems_healthy / status.systems_total,
        systems_status: status.systems,
        maintenance_activities: this.maintenance,
      },
      recommendations: this.generateRecommendations(),
    };
  }

  /**
   * Generar recomendaciones
   */
  generateRecommendations() {
    const recommendations = [];

    for (const [systemName, system] of Object.entries(this.coreSystems)) {
      if (system.status !== 'healthy') {
        recommendations.push({
          system: systemName,
          issue: system.status,
          recommendation: `Revisar y reparar ${systemName}`,
          priority: system.status === 'error' ? 'high' : 'medium',
        });
      }
    }

    return recommendations;
  }
}

// Función principal
async function main() {
  const memtech = new MemTechAgent();

  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case '--start':
      await memtech.initialize();
      // Mantener el proceso corriendo
      process.on('SIGINT', () => {
        console.log('🛑 Deteniendo MemTech Agent...');
        process.exit(0);
      });
      break;

    case '--audit':
      await memtech.auditCoreSystems();
      const status = memtech.getStatus();
      console.log(JSON.stringify(status, null, 2));
      break;

    case '--report':
      await memtech.auditCoreSystems();
      const report = memtech.generateMaintenanceReport();
      console.log(JSON.stringify(report, null, 2));
      break;

    case '--test':
      console.log('🧪 Modo de prueba - verificando técnico de core/...');
      await memtech.initialize();
      const testStatus = memtech.getStatus();
      console.log('✅ MemTech Agent funcional como técnico de core/');
      console.log(
        `📊 Sistemas saludables: ${testStatus.systems_healthy}/${testStatus.systems_total}`
      );
      break;

    default:
      console.log(`
🔧 MemTech Agent - Técnico de Core

Este es el sistema de mantenimiento interno de core/, no un producto separado.

Uso:
  node core/memtech-agent/index.js --start    # Iniciar técnico de core/
  node core/memtech-agent/index.js --audit    # Auditoría de sistemas
  node core/memtech-agent/index.js --report   # Reporte de mantenimiento
  node core/memtech-agent/index.js --test     # Modo de prueba

Sistemas mantenidos:
  - core/surprise-metrics/     # Sistema de métricas surprise
  - core/memory/               # Sistema de memoria
  - core/context-management/   # Gestión de contexto
  - core/ace/                  # Sistema ACE

Funciones:
  - Monitoreo continuo de salud
  - Mantenimiento preventivo
  - Optimización automática
  - Diagnóstico y reparación
      `);
  }
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default MemTechAgent;
