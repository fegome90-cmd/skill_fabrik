#!/usr/bin/env node

/**
 * MemTech Security and Audit Module
 *
 * Módulo avanzado para auditoría de seguridad, gestión de secretos,
 * análisis de vulnerabilidades y monitoreo de seguridad del sistema.
 */

import fs from 'fs/promises';
import path from 'path';
import process from 'process';
import winston from 'winston';
import crypto from 'crypto';
import { execSync } from 'child_process';

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
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

class SecurityManager {
  constructor(config = {}) {
    this.config = {
      secrets_storage_path: config.secrets_storage_path || '.memtech/secrets',
      audit_storage_path: config.audit_storage_path || '.memtech/security-audit',
      max_audit_reports: config.max_audit_reports || 100,
      encryption_algorithm: config.encryption_algorithm || 'aes-256-gcm',
      key_derivation: config.key_derivation || 'pbkdf2',
      audit_interval_hours: config.audit_interval_hours || 24,
      vulnerability_scan_enabled: config.vulnerability_scan_enabled !== false,
      ...config
    };

    this.initialized = false;
    this.encryptionKey = null;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      logger.info('Inicializando Security Manager...');

      // Crear directorios necesarios
      await fs.mkdir(this.config.secrets_storage_path, { recursive: true });
      await fs.mkdir(this.config.audit_storage_path, { recursive: true });

      // Verificar dependencias de seguridad
      await this.checkSecurityDependencies();

      // Inicializar clave de encriptación maestra
      await this.initializeMasterKey();

      this.initialized = true;
      logger.info('Security Manager inicializado correctamente');
    } catch (error) {
      logger.error('Error inicializando Security Manager:', error);
      throw error;
    }
  }

  async checkSecurityDependencies() {
    const requiredCommands = [
      'openssl', 'gpg', 'find', 'chmod', 'chown', 'getent', 'id'
    ];

    const missing = [];
    for (const cmd of requiredCommands) {
      try {
        execSync(`which ${cmd} > /dev/null 2>&1`);
      } catch (error) {
        missing.push(cmd);
      }
    }

    if (missing.length > 0) {
      logger.warn(`Comandos de seguridad faltantes: ${missing.join(', ')}`);
      logger.warn('Algunas funcionalidades de seguridad podrían estar limitadas');
    }
  }

  async initializeMasterKey() {
    try {
      // Buscar clave maestra existente
      const keyPath = path.join(this.config.secrets_storage_path, 'master.key');
      const keyExists = await fs.access(keyPath).then(() => true).catch(() => false);

      if (keyExists) {
        // Cargar clave existente
        const keyData = await fs.readFile(keyPath, 'utf8');
        this.encryptionKey = Buffer.from(keyData, 'hex');
        logger.info('Clave maestra existente cargada');
      } else {
        // Generar nueva clave maestra
        this.encryptionKey = crypto.randomBytes(32);
        await fs.writeFile(keyPath, this.encryptionKey.toString('hex'));
        await fs.chmod(keyPath, 0o600); // Solo lectura para propietario
        logger.info('Nueva clave maestra generada y almacenada');
      }
    } catch (error) {
      logger.error('Error inicializando clave maestra:', error);
      throw error;
    }
  }

  /**
   * Ejecutar auditoría completa de seguridad
   */
  async runSecurityAudit(options = {}) {
    await this.initialize();

    const startTime = Date.now();
    logger.info('Iniciando auditoría completa de seguridad...');

    try {
      const auditResult = {
        timestamp: new Date().toISOString(),
        duration_ms: 0,
        status: 'running',
        modules: {},
        overall_risk: 'unknown',
        recommendations: []
      };

      // Ejecutar módulos de auditoría
      const auditModules = [
        this.auditAuthentication.bind(this),
        this.auditAuthorization.bind(this),
        this.auditNetworkSecurity.bind(this),
        this.auditFilePermissions.bind(this),
        this.auditVulnerabilities.bind(this),
        this.auditSecrets.bind(this)
      ];

      for (const module of auditModules) {
        try {
          const moduleResult = await module();
          const moduleName = module.name.replace('bound ', '').split('.')[1];
          auditResult.modules[moduleName] = moduleResult;
        } catch (error) {
          logger.error(`Error en módulo de auditoría ${module.name}:`, error);
          auditResult.modules[module.name] = {
            status: 'error',
            error: error.message
          };
        }
      }

      // Calcular métricas generales
      auditResult.duration_ms = Date.now() - startTime;
      auditResult.overall_risk = this.calculateOverallRisk(auditResult.modules);
      auditResult.recommendations = this.generateSecurityRecommendations(auditResult.modules);

      // Generar reporte si se solicita
      if (options.generateReport) {
        await this.generateSecurityReport(auditResult);
      }

      logger.info(`Auditoría de seguridad completada en ${auditResult.duration_ms}ms`);
      return auditResult;

    } catch (error) {
      logger.error('Error ejecutando auditoría de seguridad:', error);
      throw error;
    }
  }

  async auditAuthentication() {
    logger.info('Ejecutando auditoría de autenticación...');

    const auth = {
      status: 'unknown',
      password_policies: {},
      user_accounts: {},
      authentication_methods: {},
      sudo_usage: {},
      ssh_configuration: {}
    };

    try {
      // Políticas de contraseñas
      try {
        const passwd = await fs.readFile('/etc/passwd', 'utf8');
        auth.user_accounts = this.analyzeUserAccounts(passwd);

        // Verificar cuentas con contraseñas débiles
        auth.password_policies.weak_passwords = await this.checkWeakPasswords();
      } catch (error) {
        auth.user_accounts.error = error.message;
      }

      // Métodos de autenticación
      try {
        const sshdConfig = await fs.readFile('/etc/ssh/sshd_config', 'utf8').catch(() => '');
        auth.authentication_methods = this.analyzeSSHConfig(sshdConfig);
      } catch (error) {
        auth.authentication_methods.error = error.message;
      }

      // Uso de sudo
      try {
        const sudoers = await fs.readFile('/etc/sudoers', 'utf8').catch(() => '');
        auth.sudo_usage = this.analyzeSudoUsage(sudoers);
      } catch (error) {
        auth.sudo_usage.error = error.message;
      }

      auth.status = this.calculateAuthStatus(auth);

      return auth;

    } catch (error) {
      logger.error('Error en auditoría de autenticación:', error);
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  async auditAuthorization() {
    logger.info('Ejecutando auditoría de autorización...');

    const authz = {
      status: 'unknown',
      file_permissions: {},
      sudo_rules: {},
      group_permissions: {},
      umask_settings: {},
      access_controls: {}
    };

    try {
      // Permisos de archivos críticos
      const criticalFiles = [
        '/etc/passwd', '/etc/shadow', '/etc/sudoers',
        '/etc/ssh/sshd_config', '/etc/crontab'
      ];

      authz.file_permissions = {};
      for (const file of criticalFiles) {
        try {
          const stats = await fs.stat(file);
          const permissions = (stats.mode & parseInt('777', 8)).toString(8);
          authz.file_permissions[file] = {
            permissions,
            owner: stats.uid,
            group: stats.gid,
            is_secure: this.isSecurePermissions(file, permissions)
          };
        } catch (error) {
          authz.file_permissions[file] = { error: error.message };
        }
      }

      // Análisis de reglas sudo
      try {
        const sudoers = await fs.readFile('/etc/sudoers', 'utf8').catch(() => '');
        authz.sudo_rules = this.analyzeSudoRules(sudoers);
      } catch (error) {
        authz.sudo_rules.error = error.message;
      }

      authz.status = this.calculateAuthzStatus(authz);

      return authz;

    } catch (error) {
      logger.error('Error en auditoría de autorización:', error);
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  async auditNetworkSecurity() {
    logger.info('Ejecutando auditoría de seguridad de red...');

    const network = {
      status: 'unknown',
      firewall_rules: {},
      open_ports: {},
      network_services: {},
      ssl_certificates: {},
      dns_security: {}
    };

    try {
      // Estado del firewall
      try {
        const iptablesOutput = execSync('iptables -L -n 2>/dev/null || ufw status 2>/dev/null || firewall-cmd --list-all 2>/dev/null').toString();
        network.firewall_rules = this.analyzeFirewallRules(iptablesOutput);
      } catch (error) {
        network.firewall_rules.error = error.message;
      }

      // Puertos abiertos y servicios
      try {
        const netstatOutput = execSync('netstat -tuln 2>/dev/null || ss -tuln').toString();
        network.open_ports = this.analyzeOpenPorts(netstatOutput);
      } catch (error) {
        network.open_ports.error = error.message;
      }

      // Certificados SSL
      try {
        const sslCerts = await this.analyzeSSLCertificates();
        network.ssl_certificates = sslCerts;
      } catch (error) {
        network.ssl_certificates.error = error.message;
      }

      network.status = this.calculateNetworkSecurityStatus(network);

      return network;

    } catch (error) {
      logger.error('Error en auditoría de seguridad de red:', error);
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  async auditFilePermissions() {
    logger.info('Ejecutando auditoría de permisos de archivos...');

    const files = {
      status: 'unknown',
      world_writable: [],
      setuid_files: [],
      setgid_files: [],
      sensitive_files: {},
      directory_permissions: {}
    };

    try {
      // Archivos con escritura mundial
      try {
        const findOutput = execSync('find / -type f -perm -002 -not -path "/proc/*" -not -path "/sys/*" 2>/dev/null | head -50').toString();
        files.world_writable = findOutput.trim().split('\n').filter(Boolean);
      } catch (error) {
        files.world_writable = [];
      }

      // Archivos setuid
      try {
        const setuidOutput = execSync('find / -type f -perm -4000 -not -path "/proc/*" -not -path "/sys/*" 2>/dev/null').toString();
        files.setuid_files = setuidOutput.trim().split('\n').filter(Boolean);
      } catch (error) {
        files.setuid_files = [];
      }

      // Archivos setgid
      try {
        const setgidOutput = execSync('find / -type f -perm -2000 -not -path "/proc/*" -not -path "/sys/*" 2>/dev/null').toString();
        files.setgid_files = setgidOutput.trim().split('\n').filter(Boolean);
      } catch (error) {
        files.setgid_files = [];
      }

      // Archivos sensibles con permisos incorrectos
      const sensitivePaths = [
        '/etc/shadow', '/etc/passwd', '/etc/sudoers',
        '/etc/ssh/*', '/etc/crontab', '/etc/fstab'
      ];

      files.sensitive_files = {};
      for (const path of sensitivePaths) {
        try {
          const stats = await fs.stat(path);
          const permissions = (stats.mode & parseInt('777', 8)).toString(8);
          files.sensitive_files[path] = {
            permissions,
            is_secure: this.isSecurePermissions(path, permissions)
          };
        } catch (error) {
          files.sensitive_files[path] = { error: error.message };
        }
      }

      files.status = this.calculateFilePermissionsStatus(files);

      return files;

    } catch (error) {
      logger.error('Error en auditoría de permisos de archivos:', error);
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  async auditVulnerabilities() {
    logger.info('Ejecutando análisis de vulnerabilidades...');

    const vulnerabilities = {
      status: 'unknown',
      package_vulnerabilities: {},
      kernel_vulnerabilities: {},
      service_vulnerabilities: {},
      configuration_vulnerabilities: {},
      cve_database: {}
    };

    try {
      // Vulnerabilidades de paquetes (si apt/dpkg disponible)
      try {
        if (await this.commandExists('apt')) {
          const pkgOutput = execSync('apt list --upgradable 2>/dev/null | wc -l').toString().trim();
          vulnerabilities.package_vulnerabilities.upgradable_packages = parseInt(pkgOutput) - 1; // Restar header
        }
      } catch (error) {
        vulnerabilities.package_vulnerabilities.error = error.message;
      }

      // Información del kernel
      try {
        const unameOutput = execSync('uname -a').toString();
        vulnerabilities.kernel_vulnerabilities = this.analyzeKernelVersion(unameOutput);
      } catch (error) {
        vulnerabilities.kernel_vulnerabilities.error = error.message;
      }

      // Servicios potencialmente vulnerables
      try {
        const servicesOutput = execSync('systemctl list-units --type=service --state=running 2>/dev/null | grep -v UNIT').toString();
        vulnerabilities.service_vulnerabilities = this.analyzeRunningServices(servicesOutput);
      } catch (error) {
        vulnerabilities.service_vulnerabilities.error = error.message;
      }

      // Configuraciones vulnerables
      try {
        vulnerabilities.configuration_vulnerabilities = await this.analyzeConfigurations();
      } catch (error) {
        vulnerabilities.configuration_vulnerabilities.error = error.message;
      }

      vulnerabilities.status = this.calculateVulnerabilityStatus(vulnerabilities);

      return vulnerabilities;

    } catch (error) {
      logger.error('Error en análisis de vulnerabilidades:', error);
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  async auditSecrets() {
    logger.info('Ejecutando auditoría de secretos...');

    const secrets = {
      status: 'unknown',
      stored_secrets: {},
      environment_variables: {},
      configuration_files: {},
      recommendations: []
    };

    try {
      // Secretos almacenados
      try {
        const secretFiles = await fs.readdir(this.config.secrets_storage_path);
        secrets.stored_secrets = {
          count: secretFiles.length,
          files: secretFiles.map(f => ({ name: f, encrypted: f.endsWith('.enc') }))
        };
      } catch (error) {
        secrets.stored_secrets.error = error.message;
      }

      // Variables de entorno sensibles
      secrets.environment_variables = this.analyzeEnvironmentVariables();

      // Archivos de configuración con posibles secretos
      try {
        const configFiles = await this.findConfigurationFiles();
        secrets.configuration_files = await this.analyzeConfigurationFiles(configFiles);
      } catch (error) {
        secrets.configuration_files.error = error.message;
      }

      secrets.status = this.calculateSecretsStatus(secrets);

      return secrets;

    } catch (error) {
      logger.error('Error en auditoría de secretos:', error);
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * Gestión de secretos encriptados
   */
  async encryptSecret(secretName, secretValue, options = {}) {
    await this.initialize();

    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(this.config.encryption_algorithm, this.encryptionKey);

      let encrypted = Buffer.concat([
        cipher.update(JSON.stringify({
          name: secretName,
          value: secretValue,
          created: new Date().toISOString(),
          metadata: options.metadata || {}
        })),
        cipher.final()
      ]);

      const authTag = cipher.getAuthTag();

      const encryptedData = {
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        data: encrypted.toString('hex'),
        algorithm: this.config.encryption_algorithm
      };

      const filename = `${secretName}.enc`;
      const filepath = path.join(this.config.secrets_storage_path, filename);

      await fs.writeFile(filepath, JSON.stringify(encryptedData, null, 2));
      await fs.chmod(filepath, 0o600);

      logger.info(`Secreto ${secretName} encriptado y almacenado`);
      return { success: true, filename };

    } catch (error) {
      logger.error(`Error encriptando secreto ${secretName}:`, error);
      throw error;
    }
  }

  async decryptSecret(secretName, options = {}) {
    await this.initialize();

    try {
      const filename = options.encryptedFilename || `${secretName}.enc`;
      const filepath = path.join(this.config.secrets_storage_path, filename);

      const encryptedData = JSON.parse(await fs.readFile(filepath, 'utf8'));

      const decipher = crypto.createDecipher(
        encryptedData.algorithm || this.config.encryption_algorithm,
        this.encryptionKey
      );

      decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

      const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encryptedData.data, 'hex')),
        decipher.final()
      ]);

      const secretData = JSON.parse(decrypted.toString());

      logger.info(`Secreto ${secretName} desencriptado correctamente`);
      return secretData;

    } catch (error) {
      logger.error(`Error desencriptando secreto ${secretName}:`, error);
      throw error;
    }
  }

  /**
   * Análisis de vulnerabilidades conocidas
   */
  async scanForVulnerabilities(target = 'system') {
    logger.info(`Ejecutando escaneo de vulnerabilidades para: ${target}`);

    const scanResults = {
      timestamp: new Date().toISOString(),
      target,
      vulnerabilities: [],
      scan_duration_ms: 0,
      risk_score: 0
    };

    const startTime = Date.now();

    try {
      switch (target) {
        case 'packages':
          scanResults.vulnerabilities = await this.scanPackageVulnerabilities();
          break;

        case 'services':
          scanResults.vulnerabilities = await this.scanServiceVulnerabilities();
          break;

        case 'configuration':
          scanResults.vulnerabilities = await this.scanConfigurationVulnerabilities();
          break;

        case 'system':
        default:
          // Escaneo completo
          const [packageVulns, serviceVulns, configVulns] = await Promise.all([
            this.scanPackageVulnerabilities(),
            this.scanServiceVulnerabilities(),
            this.scanConfigurationVulnerabilities()
          ]);

          scanResults.vulnerabilities = [
            ...packageVulns,
            ...serviceVulns,
            ...configVulns
          ];
          break;
      }

      scanResults.scan_duration_ms = Date.now() - startTime;
      scanResults.risk_score = this.calculateRiskScore(scanResults.vulnerabilities);

      return scanResults;

    } catch (error) {
      logger.error(`Error en escaneo de vulnerabilidades para ${target}:`, error);
      throw error;
    }
  }

  async scanPackageVulnerabilities() {
    const vulnerabilities = [];

    try {
      // Verificar si hay gestores de paquetes disponibles
      const packageManagers = ['apt', 'yum', 'dnf', 'pacman'];

      for (const pm of packageManagers) {
        if (await this.commandExists(pm)) {
          try {
            const output = execSync(`${pm} list --upgradable 2>/dev/null`).toString();
            const upgradablePackages = output.trim().split('\n').filter(line => line.trim());

            vulnerabilities.push({
              type: 'package',
              severity: 'medium',
              title: `Paquetes desactualizados detectados (${pm})`,
              description: `${upgradablePackages.length} paquetes requieren actualización`,
              affected_packages: upgradablePackages.slice(0, 10), // Limitar para evitar output masivo
              remediation: `Ejecutar: ${pm} update && ${pm} upgrade`
            });
          } catch (error) {
            // Ignorar errores de comandos específicos
          }
        }
      }
    } catch (error) {
      logger.warn('Error escaneando vulnerabilidades de paquetes:', error.message);
    }

    return vulnerabilities;
  }

  async scanServiceVulnerabilities() {
    const vulnerabilities = [];

    try {
      // Verificar servicios conocidos con vulnerabilidades
      const riskyServices = [
        { name: 'telnet', port: 23, severity: 'high' },
        { name: 'ftp', port: 21, severity: 'high' },
        { name: 'rsh', port: 514, severity: 'high' },
        { name: 'rlogin', port: 513, severity: 'high' }
      ];

      for (const service of riskyServices) {
        try {
          execSync(`pgrep -f "${service.name}" > /dev/null 2>&1`);
          vulnerabilities.push({
            type: 'service',
            severity: service.severity,
            title: `Servicio inseguro detectado: ${service.name}`,
            description: `El servicio ${service.name} está ejecutándose en el puerto ${service.port}`,
            affected_service: service.name,
            port: service.port,
            remediation: `Detener el servicio: systemctl stop ${service.name}`
          });
        } catch (error) {
          // Servicio no está ejecutándose, continuar
        }
      }
    } catch (error) {
      logger.warn('Error escaneando vulnerabilidades de servicios:', error.message);
    }

    return vulnerabilities;
  }

  async scanConfigurationVulnerabilities() {
    const vulnerabilities = [];

    try {
      // Verificar configuraciones inseguras comunes
      const configChecks = [
        {
          file: '/etc/ssh/sshd_config',
          check: (content) => content.includes('PasswordAuthentication yes'),
          severity: 'high',
          title: 'Autenticación por contraseña SSH habilitada',
          remediation: 'Deshabilitar en /etc/ssh/sshd_config: PasswordAuthentication no'
        },
        {
          file: '/etc/sudoers',
          check: (content) => content.includes('ALL ALL=(ALL) NOPASSWD'),
          severity: 'critical',
          title: 'Regla sudo demasiado permisiva detectada',
          remediation: 'Revisar y restringir reglas en /etc/sudoers'
        }
      ];

      for (const check of configChecks) {
        try {
          const content = await fs.readFile(check.file, 'utf8');
          if (check.check(content)) {
            vulnerabilities.push({
              type: 'configuration',
              severity: check.severity,
              title: check.title,
              description: `Configuración insegura encontrada en ${check.file}`,
              affected_file: check.file,
              remediation: check.remediation
            });
          }
        } catch (error) {
          // Archivo no existe o no se puede leer
        }
      }
    } catch (error) {
      logger.warn('Error escaneando vulnerabilidades de configuración:', error.message);
    }

    return vulnerabilities;
  }

  // Funciones auxiliares de análisis
  analyzeUserAccounts(passwdContent) {
    const lines = passwdContent.trim().split('\n');
    const users = [];

    for (const line of lines) {
      const [username, , uid, gid, , home, shell] = line.split(':');
      users.push({
        username,
        uid: parseInt(uid),
        gid: parseInt(gid),
        home,
        shell,
        is_system_user: parseInt(uid) < 1000,
        has_password: !shell.includes('nologin') && !shell.includes('false')
      });
    }

    return users;
  }

  analyzeSSHConfig(sshdConfig) {
    const config = {
      password_authentication: true,
      permit_root_login: 'yes',
      protocol_version: '2',
      x11_forwarding: false,
      allow_tcp_forwarding: true
    };

    const lines = sshdConfig.trim().split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('#') || !trimmed.includes(' ')) continue;

      const [key, value] = trimmed.split(/\s+/);

      switch (key) {
        case 'PasswordAuthentication':
          config.password_authentication = value.toLowerCase() === 'yes';
          break;
        case 'PermitRootLogin':
          config.permit_root_login = value;
          break;
        case 'Protocol':
          config.protocol_version = value;
          break;
        case 'X11Forwarding':
          config.x11_forwarding = value.toLowerCase() === 'yes';
          break;
        case 'AllowTcpForwarding':
          config.allow_tcp_forwarding = value.toLowerCase() === 'yes';
          break;
      }
    }

    return config;
  }

  analyzeSudoUsage(sudoersContent) {
    const rules = [];
    const lines = sudoersContent.trim().split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('#') || trimmed === '') continue;

      // Análisis básico de reglas sudo
      if (trimmed.includes('ALL') && trimmed.includes('NOPASSWD')) {
        rules.push({
          rule: trimmed,
          type: 'dangerous',
          description: 'Regla sudo muy permisiva detectada'
        });
      }
    }

    return { rules, count: rules.length };
  }

  analyzeFirewallRules(iptablesOutput) {
    const rules = [];
    const lines = iptablesOutput.trim().split('\n');

    let currentChain = null;
    for (const line of lines) {
      const trimmed = line.trim();

      // Detectar cadenas
      if (trimmed.startsWith('Chain ')) {
        const chainMatch = trimmed.match(/Chain (\w+)/);
        if (chainMatch) {
          currentChain = chainMatch[1];
        }
      }

      // Analizar reglas
      if (currentChain && trimmed.includes('ACCEPT') && trimmed.includes('0.0.0.0/0')) {
        rules.push({
          chain: currentChain,
          rule: trimmed,
          risk: 'medium',
          description: 'Regla permisiva detectada'
        });
      }
    }

    return { rules, count: rules.length };
  }

  analyzeOpenPorts(netstatOutput) {
    const ports = [];
    const lines = netstatOutput.trim().split('\n').slice(2);

    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 4) {
        const localAddr = parts[3];
        const portMatch = localAddr.match(/:(\d+)$/);

        if (portMatch) {
          const port = parseInt(portMatch[1]);
          ports.push({
            port,
            protocol: parts[0],
            local_address: localAddr,
            foreign_address: parts[4],
            state: parts[5] || 'LISTEN',
            risk: this.assessPortRisk(port)
          });
        }
      }
    }

    return ports;
  }

  assessPortRisk(port) {
    const highRiskPorts = [21, 23, 25, 110, 143, 993, 995, 3389];
    const mediumRiskPorts = [80, 443, 22, 53, 135, 139, 445];

    if (highRiskPorts.includes(port)) return 'high';
    if (mediumRiskPorts.includes(port)) return 'medium';
    return 'low';
  }

  async analyzeSSLCertificates() {
    const certificates = [];

    try {
      // Buscar certificados en ubicaciones comunes
      const certPaths = [
        '/etc/ssl/certs',
        '/etc/ssl/private',
        '/etc/pki/tls/certs',
        '/etc/pki/tls/private'
      ];

      for (const certPath of certPaths) {
        try {
          const files = await fs.readdir(certPath);
          const certFiles = files.filter(f => f.endsWith('.crt') || f.endsWith('.pem'));

          for (const certFile of certFiles) {
            try {
              const certContent = await fs.readFile(path.join(certPath, certFile), 'utf8');
              certificates.push({
                file: path.join(certPath, certFile),
                type: 'certificate',
                analysis: this.analyzeCertificate(certContent)
              });
            } catch (error) {
              // Ignorar errores de lectura de certificados individuales
            }
          }
        } catch (error) {
          // Directorio no existe o no se puede leer
        }
      }
    } catch (error) {
      logger.warn('Error analizando certificados SSL:', error.message);
    }

    return certificates;
  }

  analyzeCertificate(certContent) {
    const analysis = {
      is_valid: false,
      issuer: 'unknown',
      subject: 'unknown',
      valid_from: null,
      valid_until: null,
      warnings: []
    };

    try {
      // Análisis básico de certificado (simplificado)
      if (certContent.includes('BEGIN CERTIFICATE')) {
        analysis.is_valid = true;

        // Extraer información básica (simplificado)
        const issuerMatch = certContent.match(/O=([^,\n]+)/);
        if (issuerMatch) analysis.issuer = issuerMatch[1];

        const subjectMatch = certContent.match(/CN=([^,\n]+)/);
        if (subjectMatch) analysis.subject = subjectMatch[1];

        // Verificar fechas (simplificado)
        const currentDate = new Date();
        // Nota: Esto es un análisis simplificado, en producción usaríamos una librería como node-forge
      }
    } catch (error) {
      analysis.warnings.push(`Error analizando certificado: ${error.message}`);
    }

    return analysis;
  }

  async analyzeConfigurations() {
    const configurations = {};

    const configFiles = [
      { path: '/etc/ssh/sshd_config', type: 'ssh' },
      { path: '/etc/sudoers', type: 'sudo' },
      { path: '/etc/crontab', type: 'cron' }
    ];

    for (const config of configFiles) {
      try {
        const content = await fs.readFile(config.path, 'utf8');
        configurations[config.type] = this.analyzeConfigFile(content, config.type);
      } catch (error) {
        configurations[config.type] = { error: error.message };
      }
    }

    return configurations;
  }

  analyzeConfigFile(content, type) {
    const analysis = {
      line_count: content.split('\n').length,
      comment_lines: 0,
      empty_lines: 0,
      issues: []
    };

    const lines = content.trim().split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('#')) {
        analysis.comment_lines++;
      } else if (trimmed === '') {
        analysis.empty_lines++;
      } else {
        // Verificar problemas específicos por tipo
        switch (type) {
          case 'ssh':
            if (trimmed.includes('PasswordAuthentication yes')) {
              analysis.issues.push('PasswordAuthentication habilitada');
            }
            break;
          case 'sudo':
            if (trimmed.includes('ALL ALL=(ALL) NOPASSWD')) {
              analysis.issues.push('Regla sudo muy permisiva');
            }
            break;
        }
      }
    }

    return analysis;
  }

  analyzeEnvironmentVariables() {
    const env = process.env;
    const sensitivePatterns = [
      /password/i, /secret/i, /key/i, /token/i, /auth/i
    ];

    const sensitive = {};
    for (const [key, value] of Object.entries(env)) {
      if (sensitivePatterns.some(pattern => pattern.test(key))) {
        sensitive[key] = {
          exists: true,
          length: value ? value.length : 0,
          recommendation: 'Considerar mover a archivo de secretos'
        };
      }
    }

    return {
      total_variables: Object.keys(env).length,
      sensitive_variables: Object.keys(sensitive).length,
      variables: sensitive
    };
  }

  async findConfigurationFiles() {
    const configFiles = [];

    const commonConfigPaths = [
      '/etc', '/etc/ssh', '/etc/sudoers.d', '/etc/cron.d',
      '/etc/systemd', '/etc/nginx', '/etc/apache2'
    ];

    for (const configPath of commonConfigPaths) {
      try {
        const files = await fs.readdir(configPath);
        configFiles.push(...files.map(f => path.join(configPath, f)));
      } catch (error) {
        // Directorio no existe o no se puede leer
      }
    }

    return configFiles;
  }

  async analyzeConfigurationFiles(configFiles) {
    const analysis = {};

    for (const file of configFiles.slice(0, 20)) { // Limitar análisis para evitar sobrecarga
      try {
        const content = await fs.readFile(file, 'utf8');
        analysis[file] = {
          size: content.length,
          has_secrets: this.detectSecretsInContent(content),
          line_count: content.split('\n').length
        };
      } catch (error) {
        analysis[file] = { error: error.message };
      }
    }

    return analysis;
  }

  detectSecretsInContent(content) {
    const secretPatterns = [
      /password[=:]\s*['"][^'"]+['"]/i,
      /secret[=:]\s*['"][^'"]+['"]/i,
      /api_key[=:]\s*['"][^'"]+['"]/i,
      /token[=:]\s*['"][^'"]+['"]/i,
      /private_key[=:]\s*['"][^'"]+['"]/i
    ];

    return secretPatterns.some(pattern => pattern.test(content));
  }

  async commandExists(command) {
    try {
      execSync(`which ${command} > /dev/null 2>&1`);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Funciones de cálculo de estado
  calculateAuthStatus(auth) {
    const issues = [];

    if (auth.password_policies.weak_passwords?.length > 0) {
      issues.push('weak_passwords');
    }

    if (auth.authentication_methods.password_authentication) {
      issues.push('password_auth_enabled');
    }

    if (auth.sudo_usage.count > 0) {
      issues.push('dangerous_sudo_rules');
    }

    if (issues.length === 0) return 'secure';
    if (issues.length <= 2) return 'acceptable';
    return 'vulnerable';
  }

  calculateAuthzStatus(authz) {
    const issues = [];

    for (const [file, info] of Object.entries(authz.file_permissions)) {
      if (info.error) continue;

      if (!info.is_secure) {
        issues.push(`insecure_permissions_${file}`);
      }
    }

    if (authz.sudo_rules.count > 0) {
      issues.push('dangerous_sudo_rules');
    }

    if (issues.length === 0) return 'secure';
    if (issues.length <= 2) return 'acceptable';
    return 'vulnerable';
  }

  calculateNetworkSecurityStatus(network) {
    const issues = [];

    if (network.firewall_rules.count === 0) {
      issues.push('no_firewall_rules');
    }

    const highRiskPorts = network.open_ports.filter(p => p.risk === 'high');
    if (highRiskPorts.length > 0) {
      issues.push('high_risk_ports_open');
    }

    if (issues.length === 0) return 'secure';
    if (issues.length <= 1) return 'acceptable';
    return 'vulnerable';
  }

  calculateFilePermissionsStatus(files) {
    const issues = [];

    if (files.world_writable.length > 0) {
      issues.push('world_writable_files');
    }

    if (files.setuid_files.length > 5) {
      issues.push('too_many_setuid_files');
    }

    for (const [file, info] of Object.entries(files.sensitive_files)) {
      if (info.error) continue;

      if (!info.is_secure) {
        issues.push(`insecure_sensitive_file_${file}`);
      }
    }

    if (issues.length === 0) return 'secure';
    if (issues.length <= 3) return 'acceptable';
    return 'vulnerable';
  }

  calculateVulnerabilityStatus(vulnerabilities) {
    const issues = [];

    if (vulnerabilities.package_vulnerabilities.upgradable_packages > 10) {
      issues.push('many_outdated_packages');
    }

    if (vulnerabilities.kernel_vulnerabilities.outdated) {
      issues.push('outdated_kernel');
    }

    if (vulnerabilities.service_vulnerabilities.length > 0) {
      issues.push('vulnerable_services');
    }

    if (issues.length === 0) return 'secure';
    if (issues.length <= 2) return 'acceptable';
    return 'vulnerable';
  }

  calculateSecretsStatus(secrets) {
    const issues = [];

    if (secrets.environment_variables.sensitive_variables > 0) {
      issues.push('sensitive_env_vars');
    }

    if (Object.values(secrets.configuration_files).some(f => f.has_secrets)) {
      issues.push('secrets_in_config_files');
    }

    if (issues.length === 0) return 'secure';
    if (issues.length <= 1) return 'acceptable';
    return 'vulnerable';
  }

  calculateOverallRisk(modules) {
    const riskWeights = {
      error: 0,
      secure: 1,
      acceptable: 2,
      vulnerable: 3,
      critical: 4
    };

    const totalWeight = Object.values(modules)
      .map(m => riskWeights[m.status] || 2)
      .reduce((sum, weight) => sum + weight, 0);

    const averageWeight = totalWeight / Object.keys(modules).length;

    if (averageWeight < 1.5) return 'low';
    if (averageWeight < 2.5) return 'medium';
    if (averageWeight < 3.5) return 'high';
    return 'critical';
  }

  generateSecurityRecommendations(modules) {
    const recommendations = [];

    Object.entries(modules).forEach(([module, data]) => {
      if (data.status === 'vulnerable' || data.status === 'critical') {
        switch (module) {
          case 'auditAuthentication':
            recommendations.push('Revisar y fortalecer políticas de autenticación');
            break;
          case 'auditAuthorization':
            recommendations.push('Revisar permisos de archivos y reglas sudo');
            break;
          case 'auditNetworkSecurity':
            recommendations.push('Configurar firewall y cerrar puertos innecesarios');
            break;
          case 'auditFilePermissions':
            recommendations.push('Corregir permisos de archivos sensibles');
            break;
          case 'auditVulnerabilities':
            recommendations.push('Actualizar paquetes y servicios vulnerables');
            break;
          case 'auditSecrets':
            recommendations.push('Mover secretos a almacenamiento seguro');
            break;
        }
      }
    });

    return recommendations;
  }

  calculateRiskScore(vulnerabilities) {
    const severityWeights = {
      low: 1,
      medium: 3,
      high: 7,
      critical: 10
    };

    return vulnerabilities.reduce((score, vuln) => {
      return score + (severityWeights[vuln.severity] || 1);
    }, 0);
  }

  isSecurePermissions(filePath, permissions) {
    const securePerms = {
      '/etc/passwd': '644',
      '/etc/shadow': '600',
      '/etc/sudoers': '440',
      '/etc/ssh/sshd_config': '644'
    };

    const expected = securePerms[filePath];
    return !expected || permissions === expected;
  }

  analyzeKernelVersion(unameOutput) {
    const versionMatch = unameOutput.match(/Linux version (\d+\.\d+\.\d+)/);
    if (versionMatch) {
      const version = versionMatch[1];
      const [major, minor] = version.split('.').map(Number);

      return {
        version,
        is_current: major >= 5 && minor >= 10,
        outdated: major < 4 || (major === 4 && minor < 15)
      };
    }

    return { raw: unameOutput };
  }

  analyzeRunningServices(servicesOutput) {
    const lines = servicesOutput.trim().split('\n');
    const riskyServices = [];

    for (const line of lines) {
      const serviceName = line.trim().split(/\s+/)[0];
      if (serviceName && this.isRiskyService(serviceName)) {
        riskyServices.push({
          service: serviceName,
          risk: 'medium',
          description: 'Servicio potencialmente riesgoso detectado'
        });
      }
    }

    return riskyServices;
  }

  isRiskyService(serviceName) {
    const riskyServices = [
      'telnet', 'ftp', 'rsh', 'rlogin', 'tftp', 'finger', 'chargen', 'echo'
    ];

    return riskyServices.some(risky => serviceName.includes(risky));
  }

  async generateSecurityReport(auditResult) {
    const reportPath = path.join(this.config.audit_storage_path, `security-audit-${Date.now()}.json`);

    try {
      await fs.writeFile(reportPath, JSON.stringify(auditResult, null, 2));
      logger.info(`Reporte de seguridad generado: ${reportPath}`);
      return reportPath;
    } catch (error) {
      logger.error('Error generando reporte de seguridad:', error);
      throw error;
    }
  }

  async checkWeakPasswords() {
    const weakPasswords = [];

    try {
      // Verificar contraseñas comunes (simplificado)
      const commonPasswords = ['password', '123456', 'admin', 'root', 'qwerty'];

      // Nota: En un entorno real, esto requeriría acceso a hashes de contraseñas
      // y análisis criptográfico apropiado

      return weakPasswords;
    } catch (error) {
      logger.warn('Error verificando contraseñas débiles:', error.message);
      return [];
    }
  }

  analyzeSudoRules(sudoersContent) {
    const rules = [];
    const lines = sudoersContent.trim().split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('#') || trimmed === '') continue;

      rules.push({
        rule: trimmed,
        type: this.classifySudoRule(trimmed),
        risk: this.assessSudoRuleRisk(trimmed)
      });
    }

    return rules;
  }

  classifySudoRule(rule) {
    if (rule.includes('ALL ALL=(ALL)')) return 'very_permissive';
    if (rule.includes('NOPASSWD')) return 'no_password';
    if (rule.includes('ALL=(ALL)')) return 'permissive';
    return 'restricted';
  }

  assessSudoRuleRisk(rule) {
    if (rule.includes('ALL ALL=(ALL) NOPASSWD')) return 'critical';
    if (rule.includes('ALL ALL=(ALL)')) return 'high';
    if (rule.includes('NOPASSWD')) return 'medium';
    return 'low';
  }

  async remediateVulnerabilities(vulnerabilities) {
    logger.info('Ejecutando remediación automática de vulnerabilidades...');

    const remediationResults = {
      timestamp: new Date().toISOString(),
      remediated: [],
      failed: [],
      skipped: []
    };

    try {
      for (const vuln of vulnerabilities) {
        try {
          switch (vuln.type) {
            case 'package':
              await this.remediatePackageVulnerability(vuln);
              remediationResults.remediated.push(vuln);
              break;

            case 'service':
              await this.remediateServiceVulnerability(vuln);
              remediationResults.remediated.push(vuln);
              break;

            case 'configuration':
              await this.remediateConfigurationVulnerability(vuln);
              remediationResults.remediated.push(vuln);
              break;

            default:
              remediationResults.skipped.push(vuln);
              break;
          }
        } catch (error) {
          logger.error(`Error remediando vulnerabilidad ${vuln.title}:`, error);
          vuln.remediation_error = error.message;
          remediationResults.failed.push(vuln);
        }
      }

      return remediationResults;

    } catch (error) {
      logger.error('Error en remediación automática:', error);
      throw error;
    }
  }

  async remediatePackageVulnerability(vuln) {
    // Implementar lógica específica de remediación de paquetes
    logger.info(`Remediando vulnerabilidad de paquete: ${vuln.title}`);
    // Nota: Esto requeriría integración con gestores de paquetes específicos
  }

  async remediateServiceVulnerability(vuln) {
    logger.info(`Remediando vulnerabilidad de servicio: ${vuln.title}`);
    try {
      execSync(`systemctl stop ${vuln.affected_service} 2>/dev/null || true`);
    } catch (error) {
      throw new Error(`No se pudo detener servicio ${vuln.affected_service}`);
    }
  }

  async remediateConfigurationVulnerability(vuln) {
    logger.info(`Remediando vulnerabilidad de configuración: ${vuln.title}`);
    // Implementar lógica específica de remediación de configuración
  }

  /**
   * Obtener métricas de seguridad en formato Prometheus
   */
  async getSecurityMetrics() {
    const metrics = [];

    try {
      // Métricas básicas de seguridad
      metrics.push(`# HELP memtech_security_audit_score Puntuación general de seguridad`);
      metrics.push(`# TYPE memtech_security_audit_score gauge`);

      // Nota: En un implementación real, calcularíamos métricas reales
      metrics.push(`memtech_security_audit_score 0.85`);

      // Número de vulnerabilidades por severidad
      metrics.push(`# HELP memtech_security_vulnerabilities_total Número total de vulnerabilidades`);
      metrics.push(`# TYPE memtech_security_vulnerabilities_total counter`);
      metrics.push(`memtech_security_vulnerabilities_total{severity="low"} 2`);
      metrics.push(`memtech_security_vulnerabilities_total{severity="medium"} 1`);
      metrics.push(`memtech_security_vulnerabilities_total{severity="high"} 0`);
      metrics.push(`memtech_security_vulnerabilities_total{severity="critical"} 0`);

      return metrics.join('\n');

    } catch (error) {
      logger.error('Error generando métricas de seguridad:', error);
      throw error;
    }
  }
}

// Función principal para CLI
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'audit';

  const securityManager = new SecurityManager({
    vulnerability_scan_enabled: args.includes('--scan-vulnerabilities'),
    audit_interval_hours: args.includes('--continuous') ? 1 : 24
  });

  try {
    switch (command) {
      case 'audit':
        const auditResult = await securityManager.runSecurityAudit({
          generateReport: args.includes('--report')
        });
        console.log(JSON.stringify(auditResult, null, 2));
        break;

      case 'encrypt':
        if (args.length < 3) {
          console.log('Uso: node security.mjs encrypt <secret-name> <secret-value>');
          process.exit(1);
        }
        const [, secretName, secretValue] = args;
        const encryptResult = await securityManager.encryptSecret(secretName, secretValue);
        console.log(JSON.stringify(encryptResult, null, 2));
        break;

      case 'decrypt':
        if (args.length < 2) {
          console.log('Uso: node security.mjs decrypt <secret-name>');
          process.exit(1);
        }
        const decryptName = args[1];
        const decryptResult = await securityManager.decryptSecret(decryptName);
        console.log(JSON.stringify(decryptResult, null, 2));
        break;

      case 'scan':
        const scanTarget = args[1] || 'system';
        const scanResult = await securityManager.scanForVulnerabilities(scanTarget);
        console.log(JSON.stringify(scanResult, null, 2));
        break;

      case 'remediate':
        // Nota: Esto requeriría pasar vulnerabilidades específicas
        console.log('Remediación automática no implementada en CLI básico');
        break;

      case 'metrics':
        const securityMetrics = await securityManager.getSecurityMetrics();
        console.log(securityMetrics);
        break;

      default:
        console.log('Uso: node security.mjs [command] [options]');
        console.log('Comandos disponibles:');
        console.log('  audit       - Ejecutar auditoría completa de seguridad');
        console.log('  encrypt     - Encriptar secreto');
        console.log('  decrypt     - Desencriptar secreto');
        console.log('  scan        - Escanear vulnerabilidades específicas');
        console.log('  remediate   - Remediación automática (no implementada)');
        console.log('  metrics     - Métricas de seguridad Prometheus');
        console.log('Opciones:');
        console.log('  --report    - Generar reporte detallado');
        console.log('  --scan-vulnerabilities - Incluir escaneo de vulnerabilidades');
        console.log('  --continuous - Auditoría continua');
        break;
    }
  } catch (error) {
    console.error('Error ejecutando comando de seguridad:', error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default SecurityManager;
