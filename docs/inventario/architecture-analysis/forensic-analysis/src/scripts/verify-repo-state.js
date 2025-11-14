#!/usr/bin/env node

/**
 * Script Obligatorio: Verificación del Estado Real del Repositorio
 *
 * Este script está diseñado para ser usado OBLIGATORIAMENTE por todos los agentes
 * para verificar que todas las métricas reportadas reflejen el estado actual del repo.
 *
 * Regla: MAX-014 (verificacion_dinamica_repo)
 * Obligación: OBL-018 (EJECUTAR comandos de verificación directamente contra el repo real)
 * Quality Gate: QG-010 (repo_verification)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class RepoStateVerifier {
  constructor(options = {}) {
    this.targetPath = options.targetPath || process.cwd();
    this.cacheTimeout = options.cacheTimeout || 5 * 60 * 1000; // 5 minutos máximo
    this.timestamp = new Date().toISOString();
    this.verificationLog = [];
    this.metrics = {
      commands_executed: 0,
      real_outputs_obtained: 0,
      verification_errors: 0,
      repo_verified_components: 0
    };
  }

  /**
   * Ejecuta un comando de verificación contra el repositorio real
   * y valida que el resultado sea reproducible y actualizado
   */
  executeVerification(command, description) {
    try {
      this.logExecution('info', `Ejecutando: ${command}`);

      // Ejecutar comando real contra el repo
      const startTime = Date.now();
      const output = execSync(command, {
        encoding: 'utf8',
        cwd: this.targetPath,
        timeout: 30000 // 30 segundos timeout
      }).trim();

      const duration = Date.now() - startTime;

      // Validar que el output sea válido y no esté vacío
      if (!output || output.length === 0) {
        throw new Error('Output vacío o inválido');
      }

      this.metrics.commands_executed++;
      this.metrics.real_outputs_obtained++;

      const result = {
        command,
        description,
        output,
        duration,
        timestamp: this.timestamp,
        success: true
      };

      this.logExecution('success', `✅ ${description}: ${output}`);
      this.verificationLog.push(result);

      return result;
    } catch (error) {
      this.metrics.verification_errors++;
      const errorResult = {
        command,
        description,
        error: error.message,
        timestamp: this.timestamp,
        success: false
      };

      this.logExecution('error', `❌ ${description}: ${error.message}`);
      this.verificationLog.push(errorResult);

      throw new Error(
        `Fallo en verificación de ${description}: ${error.message}`
      );
    }
  }

  /**
   * Verificación obligatoria de componentes principales del repositorio
   */
  verifyCoreComponents() {
    this.logExecution(
      'info',
      '🔍 Iniciando verificación de componentes principales...'
    );

    const verifications = [
      {
        command: 'find /packages -name "package.json" | wc -l',
        description: 'Conteo de paquetes en /packages'
      },
      {
        command: 'du -sh /packages/daemon/src/ 2>/dev/null || echo "N/A"',
        description: 'Tamaño del daemon source'
      },
      {
        command: 'du -sh /packages/router/src/ 2>/dev/null || echo "N/A"',
        description: 'Tamaño del router source'
      },
      {
        command: 'du -sh /packages/skills-cli/src/ 2>/dev/null || echo "N/A"',
        description: 'Tamaño del skills-cli source'
      },
      {
        command: 'find /skills -name "SKILL.md" | wc -l',
        description: 'Conteo de archivos SKILL.md'
      },
      {
        command: 'find . -name "*.test.*" -o -name "*.spec.*" | wc -l',
        description: 'Conteo total de archivos de tests'
      },
      {
        command: 'find . -name "*.js" -o -name "*.ts" | head -10 | wc -l',
        description: 'Conteo de archivos JS/TS (sample)'
      }
    ];

    const results = {};
    for (const verification of verifications) {
      try {
        const result = this.executeVerification(
          verification.command,
          verification.description
        );
        results[verification.description] = result.output;
        this.metrics.repo_verified_components++;
      } catch (error) {
        this.logExecution(
          'warn',
          `⚠️ Falló verificación: ${verification.description}`
        );
        results[verification.description] = 'ERROR';
      }
    }

    return results;
  }

  /**
   * Valida existencia física de rutas mencionadas en informes
   */
  validatePhysicalExistence(paths) {
    this.logExecution(
      'info',
      '🔍 Validando existencia física de componentes...'
    );

    const existenceResults = {};

    for (const pathToCheck of paths) {
      const fullPath = path.join(this.targetPath, pathToCheck);
      const exists = fs.existsSync(fullPath);

      existenceResults[pathToCheck] = {
        exists,
        fullPath,
        checkedAt: this.timestamp
      };

      if (exists) {
        try {
          const stats = fs.statSync(fullPath);
          existenceResults[pathToCheck].stats = {
            size: stats.size,
            modified: stats.mtime.toISOString(),
            isDirectory: stats.isDirectory(),
            isFile: stats.isFile()
          };
          this.metrics.repo_verified_components++;
        } catch (statsError) {
          this.logExecution(
            'warn',
            `⚠️ No se pudo obtener stats de ${pathToCheck}`
          );
        }
      } else {
        this.logExecution('error', `❌ Componente no existe: ${pathToCheck}`);
      }
    }

    return existenceResults;
  }

  /**
   * Genera reporte completo de verificación
   */
  generateReport() {
    const report = {
      timestamp: this.timestamp,
      targetPath: this.targetPath,
      summary: {
        total_commands: this.metrics.commands_executed,
        successful_verifications: this.metrics.real_outputs_obtained,
        verification_errors: this.metrics.verification_errors,
        components_verified: this.metrics.repo_verified_components,
        success_rate:
          this.metrics.commands_executed > 0
            ? (
              (this.metrics.real_outputs_obtained /
                  this.metrics.commands_executed) *
                100
            ).toFixed(2) + '%'
            : '0%'
      },
      verification_log: this.verificationLog,
      compliance: {
        MAX_014_compliant: this.metrics.commands_executed > 0,
        OBL_018_compliant: this.metrics.real_outputs_obtained > 0,
        QG_010_ready: this.metrics.verification_errors === 0
      }
    };

    return report;
  }

  /**
   * Guarda reporte en archivo JSON con timestamp
   */
  saveReport(outputDir = './reports') {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const report = this.generateReport();
    const filename = `repo-state-verification-${Date.now()}.json`;
    const filepath = path.join(outputDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
    this.logExecution('info', `📄 Reporte guardado en: ${filepath}`);

    return filepath;
  }

  /**
   * Método principal de verificación
   */
  async verify() {
    this.logExecution(
      'info',
      '🚀 Iniciando verificación obligatoria del estado del repositorio...'
    );

    try {
      // 1. Verificar componentes principales
      const componentResults = this.verifyCoreComponents();

      // 2. Validar existencia de rutas críticas conocidas
      const criticalPaths = [
        'packages/daemon',
        'packages/router',
        'packages/skills-cli',
        'skills',
        'configs/skill-rules.json'
      ];

      const existenceResults = this.validatePhysicalExistence(criticalPaths);

      // 3. Generar y guardar reporte
      const reportPath = this.saveReport();

      // 4. Validar compliance con reglas obligatorias
      if (this.metrics.verification_errors > 0) {
        throw new Error(
          `${this.metrics.verification_errors} errores de verificación detectados`
        );
      }

      this.logExecution('success', '✅ Verificación completada exitosamente');
      return {
        componentResults,
        existenceResults,
        reportPath,
        metrics: this.metrics
      };
    } catch (error) {
      this.logExecution(
        'error',
        `❌ Falló verificación del repositorio: ${error.message}`
      );

      // Generar reporte de error
      const reportPath = this.saveReport();

      throw error;
    }
  }

  /**
   * Método de logging con timestamps
   */
  logExecution(level, message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    console.log(logMessage);
  }
}

// Ejecución principal
if (require.main === module) {
  const verifier = new RepoStateVerifier();

  verifier
    .verify()
    .then(result => {
      console.log('\n✅ VERIFICACIÓN DEL REPOSITORIO COMPLETADA EXITOSAMENTE');
      console.log(
        `📊 Comandos ejecutados: ${result.metrics.commands_executed}`
      );
      console.log(
        `📊 Componentes verificados: ${result.metrics.components_verified}`
      );
      console.log(`📄 Reporte guardado en: ${result.reportPath}`);
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ FALLÓ VERIFICACIÓN DEL REPOSITORIO');
      console.error(`Error: ${error.message}`);
      console.error(
        '❌ Esto viola MAX-014 y OBL-018 - el agente debe corregir antes de continuar'
      );
      process.exit(1);
    });
}

module.exports = { RepoStateVerifier };
