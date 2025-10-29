/**
 * MemTech Secrets Management Module
 *
 * Módulo para manejo seguro de secretos con soporte para env://
 * y validación de tokens
 */

import process from 'process';
import crypto from 'crypto';
import { setInterval } from 'timers';
import winston from 'winston';

// Configuración del logger
const logger = winston.createLogger({
  level: process?.env?.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
  ],
});

class SecretsManager {
  constructor(config = {}) {
    this.config = {
      cache_ttl_seconds: config.cache_ttl_seconds || 300,
      validation_enabled: config.validation_enabled !== false,
      cache_enabled: config.cache_enabled !== false,
      ...config,
    };

    this.secretCache = new Map();
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Limpiar cache expirado periódicamente
      if (this.config.cache_enabled) {
        setInterval(() => {
          this.cleanupExpiredCache();
        }, 60000); // Cada minuto
      }

      this.initialized = true;
      logger.info('Secrets Manager initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Secrets Manager:', error);
      throw error;
    }
  }

  resolveSecret(secretValue) {
    // Si no tiene el prefijo env://, devolver el valor tal cual
    if (!secretValue || !secretValue.startsWith('env://')) {
      return secretValue;
    }

    const envVarName = secretValue.substring(6); // Remover 'env://'

    if (this.config.cache_enabled) {
      const cached = this.secretCache.get(envVarName);
      if (cached && cached.expires_at > Date.now()) {
        logger.debug(`Secret ${envVarName} retrieved from cache`);
        return cached.value;
      }
    }

    try {
      const envValue = process.env[envVarName];

      if (!envValue) {
        logger.warn(`Environment variable ${envVarName} not found`);
        return null;
      }

      // Validar el secreto si está habilitado
      if (this.config.validation_enabled) {
        this.validateSecret(envVarName, envValue);
      }

      // Cachear el resultado
      if (this.config.cache_enabled) {
        this.secretCache.set(envVarName, {
          value: envValue,
          expires_at: Date.now() + this.config.cache_ttl_seconds * 1000,
          created_at: Date.now(),
        });
      }

      logger.info(`Secret ${envVarName} resolved successfully`);
      return envValue;
    } catch (error) {
      logger.error(`Error resolving secret ${envVarName}:`, error);
      throw new Error(`Failed to resolve secret ${envVarName}: ${error.message}`);
    }
  }

  validateSecret(name, value) {
    // Validaciones básicas de seguridad
    if (!value || typeof value !== 'string') {
      throw new Error(`Secret ${name} is invalid`);
    }

    // Verificar longitud mínima
    if (value.length < 8) {
      throw new Error(`Secret ${name} is too short (minimum 8 characters)`);
    }

    // Verificar que no contenga caracteres peligrosos
    const dangerousChars = ['<', '>', '&', '"', "'", '`', '$', '\\', '|', ';'];
    for (const char of dangerousChars) {
      if (value.includes(char)) {
        logger.warn(`Secret ${name} contains potentially dangerous character: ${char}`);
      }
    }

    // Para tokens específicos, validar formato
    if (name.includes('TOKEN') || name.includes('KEY')) {
      // Validar que parezca un token/base64 válido
      if (!/^[A-Za-z0-9+/=_-]+$/.test(value)) {
        throw new Error(`Secret ${name} has invalid token format`);
      }
    }

    return true;
  }

  cleanupExpiredCache() {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, value] of this.secretCache.entries()) {
      if (value.expires_at <= now) {
        this.secretCache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.debug(`Cleaned up ${cleanedCount} expired secrets from cache`);
    }
  }

  clearCache() {
    const count = this.secretCache.size;
    this.secretCache.clear();
    logger.info(`Cleared ${count} secrets from cache`);
  }

  getCacheStatus() {
    return {
      cache_size: this.secretCache.size,
      cache_enabled: this.config.cache_enabled,
      ttl_seconds: this.config.cache_ttl_seconds,
      validation_enabled: this.config.validation_enabled,
      cached_secrets: Array.from(this.secretCache.keys()).map(key => ({
        name: key,
        expires_at: this.secretCache.get(key).expires_at,
        created_at: this.secretCache.get(key).created_at,
      })),
    };
  }

  // Método para generar hashes de secretos para comparación segura
  hashSecret(secret) {
    return crypto.createHash('sha256').update(secret).digest('hex');
  }

  // Método para verificar si un secreto coincide con un hash
  verifySecretHash(secret, hash) {
    const secretHash = this.hashSecret(secret);
    return secretHash === hash;
  }

  // Método para enmascarar secretos en logs
  maskSecret(secret) {
    if (!secret || secret.length < 8) {
      return '***';
    }

    const start = secret.substring(0, 4);
    const end = secret.substring(secret.length - 4);
    const middle = '*'.repeat(Math.min(secret.length - 8, 12));

    return `${start}${middle}${end}`;
  }
}

export default SecretsManager;
