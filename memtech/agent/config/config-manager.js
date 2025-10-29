/**
 * MemTech Agent - Configuration Manager
 * Sistema de configuración dinámica para el MemTech Agent
 * T1.4 - Arquitectura del MemTech Agent
 */

import { EventEmitter } from 'events';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ConfigManager extends EventEmitter {
  constructor(options = {}) {
    super();
    this.config = {
      configDir: options.configDir || path.join(__dirname, '../config'),
      configFile: options.configFile || 'memtech-config.json',
      envFile: options.envFile || '.env',
      hotReload: options.hotReload !== false,
      encryption: options.encryption || false,
      encryptionKey: options.encryptionKey || null,
      ...options,
    };

    this.settings = new Map();
    this.schemas = new Map();
    this.watchers = new Map();
    this.isInitialized = false;
    this.configVersion = 1;
  }

  /**
   * Inicializar el sistema de configuración
   */
  async initialize() {
    try {
      console.log('⚙️ Inicializando sistema de configuración...');

      // Crear directorio de configuración
      await this.ensureConfigDirectory();

      // Cargar configuración inicial
      await this.loadConfiguration();

      // Configurar hot reload si está habilitado
      if (this.config.hotReload) {
        this.setupHotReload();
      }

      // Configurar eventos
      this.setupEventHandlers();

      this.isInitialized = true;
      console.log('✅ Sistema de configuración inicializado');

      this.emit('initialized');
    } catch (error) {
      console.error('❌ Error inicializando sistema de configuración:', error);
      this.emit('error', { type: 'initialization', error });
      throw error;
    }
  }

  /**
   * Asegurar que el directorio de configuración existe
   */
  async ensureConfigDirectory() {
    try {
      await fs.access(this.config.configDir);
    } catch {
      await fs.mkdir(this.config.configDir, { recursive: true });
      console.log(`📁 Directorio de configuración creado: ${this.config.configDir}`);
    }
  }

  /**
   * Cargar configuración inicial
   */
  async loadConfiguration() {
    try {
      // Cargar configuración desde archivo
      await this.loadFromFile();

      // Cargar variables de entorno
      await this.loadFromEnvironment();

      // Aplicar configuración por defecto
      this.applyDefaultConfiguration();
    } catch (error) {
      console.error('❌ Error cargando configuración:', error);
      throw error;
    }
  }

  /**
   * Cargar configuración desde archivo
   */
  async loadFromFile() {
    const configPath = path.join(this.config.configDir, this.config.configFile);

    try {
      const data = await fs.readFile(configPath, 'utf8');
      const config = this.config.encryption ? this.decryptConfig(data) : JSON.parse(data);

      // Validar versión de configuración
      if (config.version && config.version !== this.configVersion) {
        console.warn(
          `⚠️ Versión de configuración diferente: ${config.version} vs ${this.configVersion}`
        );
      }

      // Cargar configuración
      if (config.settings) {
        for (const [key, value] of Object.entries(config.settings)) {
          this.settings.set(key, value);
        }
      }

      console.log(`📄 Configuración cargada desde: ${configPath}`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('📄 Archivo de configuración no encontrado, usando configuración por defecto');
      } else {
        throw error;
      }
    }
  }

  /**
   * Cargar configuración desde variables de entorno
   */
  async loadFromEnvironment() {
    const envMappings = {
      MEMTECH_LOG_LEVEL: 'logging.level',
      MEMTECH_LOG_FORMAT: 'logging.format',
      MEMTECH_LOG_OUTPUT: 'logging.output',
      MEMTECH_MONITORING_INTERVAL: 'monitoring.interval',
      MEMTECH_OPTIMIZATION_ENABLED: 'optimization.enabled',
      MEMTECH_DIAGNOSTICS_ENABLED: 'diagnostics.enabled',
      MEMTECH_PLUGINS_ENABLED: 'plugins.enabled',
      MEMTECH_AUDIT_ENABLED: 'audit.enabled',
      MEMTECH_HEALTH_CHECK_INTERVAL: 'healthCheck.interval',
      MEMTECH_METRICS_INTERVAL: 'metrics.interval',
    };

    for (const [envVar, configPath] of Object.entries(envMappings)) {
      if (process.env[envVar]) {
        const value = this.parseEnvValue(process.env[envVar]);
        this.setNestedValue(configPath, value);
      }
    }
  }

  /**
   * Aplicar configuración por defecto
   */
  applyDefaultConfiguration() {
    const defaultConfig = {
      'logging.level': 'info',
      'logging.format': 'json',
      'logging.output': 'both',
      'logging.file': path.join(__dirname, '../logs/memtech-agent.log'),
      'logging.maxSize': 10 * 1024 * 1024,
      'logging.maxFiles': 5,

      'monitoring.enabled': true,
      'monitoring.interval': 5000,
      'monitoring.alertThresholds': {
        memory: 0.8,
        cpu: 0.7,
        latency: 1000,
      },

      'optimization.enabled': true,
      'optimization.interval': 30000,
      'optimization.autoApply': true,
      'optimization.thresholds': {
        memoryImprovement: 0.1,
        latencyImprovement: 0.15,
      },

      'diagnostics.enabled': true,
      'diagnostics.interval': 60000,
      'diagnostics.checks': ['connectivity', 'performance', 'health'],
      'diagnostics.timeout': 30000,

      'plugins.enabled': true,
      'plugins.autoLoad': true,
      'plugins.directory': path.join(__dirname, '../plugins/tools'),

      'audit.enabled': true,
      'audit.retentionDays': 90,
      'audit.encryption': false,

      'healthCheck.enabled': true,
      'healthCheck.interval': 10000,
      'healthCheck.timeout': 5000,
      'healthCheck.retries': 3,

      'metrics.enabled': true,
      'metrics.interval': 1000,
      'metrics.retention': 24 * 60 * 60 * 1000, // 24 horas
      'metrics.aggregation': {
        window: 60000, // 1 minuto
        functions: ['avg', 'min', 'max', 'p95', 'p99'],
      },

      'memory.limits': {
        heap: 512 * 1024 * 1024, // 512MB
        rss: 1024 * 1024 * 1024, // 1GB
        external: 256 * 1024 * 1024, // 256MB
      },

      'database.connections': {
        postgresql: {
          host: 'localhost',
          port: 5433,
          database: 'surprise_metrics',
          pool: { min: 2, max: 10 },
        },
        redis: {
          cache: { host: 'localhost', port: 6379 },
          core: { host: 'localhost', port: 6380 },
        },
        qdrant: {
          url: 'https://9e22d768-dc1a-4338-a713-4c6c37703dbb.us-west-1-0.aws.cloud.qdrant.io',
          apiKey: process.env.QDRANT_CLUSTER_TOKEN,
        },
      },
    };

    for (const [key, value] of Object.entries(defaultConfig)) {
      if (!this.settings.has(key)) {
        this.settings.set(key, value);
      }
    }
  }

  /**
   * Configurar hot reload
   */
  setupHotReload() {
    const configPath = path.join(this.config.configDir, this.config.configFile);

    // Watch del archivo de configuración
    this.watchFile(configPath, async () => {
      console.log('🔄 Recargando configuración...');
      try {
        await this.loadFromFile();
        this.emit('configReloaded');
      } catch (error) {
        console.error('❌ Error recargando configuración:', error);
        this.emit('configReloadError', error);
      }
    });
  }

  /**
   * Watch de archivo
   */
  watchFile(filePath, callback) {
    try {
      const watcher = fs.watch(filePath, callback);
      this.watchers.set(filePath, watcher);
    } catch (error) {
      console.warn(`⚠️ No se pudo hacer watch del archivo ${filePath}:`, error.message);
    }
  }

  /**
   * Configurar manejadores de eventos
   */
  setupEventHandlers() {
    this.on('configChanged', change => {
      console.log(`⚙️ Configuración cambiada: ${change.key} = ${change.value}`);
    });
  }

  /**
   * Obtener valor de configuración
   */
  get(key, defaultValue = undefined) {
    if (!this.isInitialized) {
      console.warn('⚠️ ConfigManager no inicializado');
      return defaultValue;
    }

    return this.settings.get(key) ?? defaultValue;
  }

  /**
   * Establecer valor de configuración
   */
  set(key, value, options = {}) {
    if (!this.isInitialized) {
      console.warn('⚠️ ConfigManager no inicializado');
      return false;
    }

    const oldValue = this.settings.get(key);
    this.settings.set(key, value);

    // Emitir evento de cambio
    this.emit('configChanged', { key, value, oldValue, options });

    // Persistir si se solicita
    if (options.persist !== false) {
      this.persistConfiguration();
    }

    return true;
  }

  /**
   * Establecer valor anidado
   */
  setNestedValue(path, value) {
    const keys = path.split('.');
    let current = this.settings;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current.has(key)) {
        current.set(key, new Map());
      }
      current = current.get(key);
    }

    current.set(keys[keys.length - 1], value);
  }

  /**
   * Obtener valor anidado
   */
  getNestedValue(path, defaultValue = undefined) {
    const keys = path.split('.');
    let current = this.settings;

    for (const key of keys) {
      if (!current.has || !current.has(key)) {
        return defaultValue;
      }
      current = current.get(key);
    }

    return current;
  }

  /**
   * Obtener toda la configuración
   */
  getAll() {
    const config = {};
    for (const [key, value] of this.settings) {
      config[key] = value;
    }
    return config;
  }

  /**
   * Validar configuración
   */
  validateConfiguration(config) {
    const errors = [];

    // Validar tipos de datos
    const validations = {
      'logging.level': value => ['error', 'warn', 'info', 'debug', 'trace'].includes(value),
      'logging.format': value => ['json', 'text'].includes(value),
      'logging.output': value => ['console', 'file', 'both'].includes(value),
      'monitoring.interval': value => typeof value === 'number' && value > 0,
      'optimization.enabled': value => typeof value === 'boolean',
      'diagnostics.enabled': value => typeof value === 'boolean',
      'plugins.enabled': value => typeof value === 'boolean',
      'audit.enabled': value => typeof value === 'boolean',
      'healthCheck.enabled': value => typeof value === 'boolean',
      'metrics.enabled': value => typeof value === 'boolean',
    };

    for (const [path, validator] of Object.entries(validations)) {
      const value = this.getNestedValue(path);
      if (value !== undefined && !validator(value)) {
        errors.push(`Invalid value for ${path}: ${value}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Registrar esquema de configuración
   */
  registerSchema(name, schema) {
    this.schemas.set(name, schema);
  }

  /**
   * Validar contra esquema
   */
  validateAgainstSchema(name, config) {
    const schema = this.schemas.get(name);
    if (!schema) {
      return { valid: true, errors: [] };
    }

    const errors = [];

    for (const [key, rules] of Object.entries(schema)) {
      const value = config[key];

      if (rules.required && value === undefined) {
        errors.push(`Required field missing: ${key}`);
        continue;
      }

      if (value !== undefined) {
        if (rules.type && typeof value !== rules.type) {
          errors.push(`Invalid type for ${key}: expected ${rules.type}, got ${typeof value}`);
        }

        if (rules.enum && !rules.enum.includes(value)) {
          errors.push(`Invalid value for ${key}: ${value} not in ${rules.enum.join(', ')}`);
        }

        if (rules.min && value < rules.min) {
          errors.push(`Value too small for ${key}: ${value} < ${rules.min}`);
        }

        if (rules.max && value > rules.max) {
          errors.push(`Value too large for ${key}: ${value} > ${rules.max}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Persistir configuración
   */
  async persistConfiguration() {
    try {
      const configPath = path.join(this.config.configDir, this.config.configFile);
      const config = {
        version: this.configVersion,
        timestamp: new Date().toISOString(),
        settings: Object.fromEntries(this.settings),
      };

      const data = this.config.encryption
        ? this.encryptConfig(JSON.stringify(config, null, 2))
        : JSON.stringify(config, null, 2);

      await fs.writeFile(configPath, data);
    } catch (error) {
      console.error('❌ Error persistiendo configuración:', error);
      this.emit('persistError', error);
    }
  }

  /**
   * Encriptar configuración
   */
  encryptConfig(data) {
    const cipher = crypto.createCipher('aes-256-cbc', this.config.encryptionKey);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  /**
   * Desencriptar configuración
   */
  decryptConfig(encryptedData) {
    const decipher = crypto.createDecipher('aes-256-cbc', this.config.encryptionKey);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  }

  /**
   * Parsear valor de variable de entorno
   */
  parseEnvValue(value) {
    // Intentar parsear como JSON
    try {
      return JSON.parse(value);
    } catch {
      // Si no es JSON válido, tratar como string
      if (value === 'true') return true;
      if (value === 'false') return false;
      if (value === 'null') return null;
      if (!isNaN(value) && !isNaN(parseFloat(value))) {
        return parseFloat(value);
      }
      return value;
    }
  }

  /**
   * Resetear configuración a valores por defecto
   */
  resetToDefaults() {
    this.settings.clear();
    this.applyDefaultConfiguration();
    this.emit('configReset');
  }

  /**
   * Exportar configuración
   */
  exportConfiguration(format = 'json') {
    const config = Object.fromEntries(this.settings);

    if (format === 'json') {
      return JSON.stringify(config, null, 2);
    } else if (format === 'env') {
      return this.convertToEnvFormat(config);
    } else {
      throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Convertir configuración a formato ENV
   */
  convertToEnvFormat(config) {
    const lines = [];

    for (const [key, value] of Object.entries(config)) {
      if (typeof value === 'object' && value !== null) {
        // Para objetos anidados, usar notación de punto
        for (const [nestedKey, nestedValue] of Object.entries(value)) {
          lines.push(`${key.toUpperCase()}_${nestedKey.toUpperCase()}=${nestedValue}`);
        }
      } else {
        lines.push(`${key.toUpperCase()}=${value}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Importar configuración
   */
  async importConfiguration(data, format = 'json') {
    try {
      let config;

      if (format === 'json') {
        config = JSON.parse(data);
      } else if (format === 'env') {
        config = this.parseEnvFormat(data);
      } else {
        throw new Error(`Unsupported import format: ${format}`);
      }

      // Validar configuración
      const validation = this.validateConfiguration(config);
      if (!validation.valid) {
        throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
      }

      // Aplicar configuración
      for (const [key, value] of Object.entries(config)) {
        this.settings.set(key, value);
      }

      // Persistir
      await this.persistConfiguration();

      this.emit('configImported', { format, config });
    } catch (error) {
      console.error('❌ Error importando configuración:', error);
      this.emit('importError', error);
      throw error;
    }
  }

  /**
   * Parsear formato ENV
   */
  parseEnvFormat(data) {
    const config = {};
    const lines = data.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, value] = trimmed.split('=', 2);
        if (key && value !== undefined) {
          config[key.toLowerCase()] = this.parseEnvValue(value);
        }
      }
    }

    return config;
  }

  /**
   * Obtener estadísticas de configuración
   */
  getStats() {
    return {
      isInitialized: this.isInitialized,
      settingsCount: this.settings.size,
      schemasCount: this.schemas.size,
      watchersCount: this.watchers.size,
      configVersion: this.configVersion,
      config: {
        configDir: this.config.configDir,
        configFile: this.config.configFile,
        hotReload: this.config.hotReload,
        encryption: this.config.encryption,
      },
    };
  }

  /**
   * Limpiar recursos
   */
  async cleanup() {
    console.log('🧹 Limpiando sistema de configuración...');

    // Cerrar watchers
    for (const [filePath, watcher] of this.watchers) {
      try {
        watcher.close();
      } catch (error) {
        console.warn(`⚠️ Error cerrando watcher para ${filePath}:`, error.message);
      }
    }

    this.watchers.clear();
    this.settings.clear();
    this.schemas.clear();
    this.isInitialized = false;

    console.log('✅ Sistema de configuración limpiado');
  }
}

export default ConfigManager;
