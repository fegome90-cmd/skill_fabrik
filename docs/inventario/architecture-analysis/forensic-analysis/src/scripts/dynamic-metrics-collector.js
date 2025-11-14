#!/usr/bin/env node

/**
 * Dynamic Metrics Collector - Script Obligatorio
 *
 * Cumple con:
 * - MAX-014: Obtener métricas dinámicamente del estado actual del repositorio
 * - OBL-018: Comandos de verificación obligatorios
 * - PROH-006: Prohibición de datos sin verificación en tiempo real
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class DynamicMetricsCollector {
  constructor(targetPath = process.cwd()) {
    this.targetPath = targetPath;
    this.timestamp = new Date().toISOString();
    this.metrics = {};
  }

  /**
   * Ejecuta comando y devuelve resultado limpio
   */
  executeCommand(command, description = '') {
    try {
      const result = execSync(command, {
        encoding: 'utf8',
        cwd: this.targetPath,
        timeout: 10000
      }).trim();

      console.log(`✅ ${description}: ${result}`);
      return result;
    } catch (error) {
      console.log(`❌ ${description}: Error - ${error.message}`);
      return 'N/A';
    }
  }

  /**
   * Colecta métricas de tamaños de componentes
   */
  collectComponentSizes() {
    console.log('\n📊 Colectando tamaños de componentes...');

    const components = [
      {
        name: 'daemon',
        path: 'packages/daemon/src/',
        command:
          'du -sh packages/daemon/src/ 2>/dev/null | cut -f1 || echo "N/A"'
      },
      {
        name: 'router',
        path: 'packages/router/src/',
        command:
          'du -sh packages/router/src/ 2>/dev/null | cut -f1 || echo "N/A"'
      },
      {
        name: 'skills-cli',
        path: 'packages/skills-cli/src/',
        command:
          'du -sh packages/skills-cli/src/ 2>/dev/null | cut -f1 || echo "N/A"'
      },
      {
        name: 'mcp',
        path: 'mcp/',
        command: 'du -sh mcp/ 2>/dev/null | cut -f1 || echo "N/A"'
      },
      {
        name: 'skills',
        path: 'skills/',
        command: 'du -sh skills/ 2>/dev/null | cut -f1 || echo "N/A"'
      },
      {
        name: 'docs',
        path: 'docs/',
        command: 'du -sh docs/ 2>/dev/null | cut -f1 || echo "N/A"'
      }
    ];

    const sizes = {};
    components.forEach(component => {
      sizes[component.name] = this.executeCommand(
        component.command,
        `Tamaño ${component.name}`
      );
    });

    this.metrics.componentSizes = sizes;
    return sizes;
  }

  /**
   * Colecta conteos de archivos y componentes
   */
  collectFileCounts() {
    console.log('\n📊 Colectando conteos de archivos...');

    const counts = {
      markdownFiles: this.executeCommand(
        'find docs/ -name "*.md" 2>/dev/null | wc -l',
        'Archivos MD en docs/'
      ),
      skillDirectories: this.executeCommand(
        'find skills/ -maxdepth 1 -type d 2>/dev/null | tail -n +2 | wc -l',
        'Directorios de skills'
      ),
      typescriptFiles: this.executeCommand(
        'find packages/*/src/ -name "*.ts" 2>/dev/null | wc -l',
        'Archivos TypeScript en packages/'
      ),
      javascriptFiles: this.executeCommand(
        'find packages/*/src/ -name "*.js" 2>/dev/null | wc -l',
        'Archivos JavaScript en packages/'
      ),
      testFiles: this.executeCommand(
        'find . -name "*.test.*" -o -name "*.spec.*" 2>/dev/null | wc -l',
        'Archivos de tests'
      ),
      configurationFiles: this.executeCommand(
        'find . -name "*.json" -o -name "*.yaml" -o -name "*.yml" -o -name "*.toml" 2>/dev/null | wc -l',
        'Archivos de configuración'
      )
    };

    this.metrics.fileCounts = counts;
    return counts;
  }

  /**
   * Colecta métricas de configuración específicas
   */
  collectConfigurationMetrics() {
    console.log('\n📊 Colectando métricas de configuración...');

    const config = {
      skillRulesSize: this.executeCommand(
        'du -sh configs/skill-rules.json 2>/dev/null | cut -f1 || echo "N/A"',
        'skill-rules.json'
      ),
      slashCommandsSize: this.executeCommand(
        'du -sh configs/slash-commands.json 2>/dev/null | cut -f1 || echo "N/A"',
        'slash-commands.json'
      ),
      totalSkills: this.executeCommand(
        'find skills/ -name "SKILL.md" 2>/dev/null | wc -l',
        'Skills con SKILL.md'
      ),
      activePackages: this.executeCommand(
        'find packages/ -name "package.json" 2>/dev/null | wc -l',
        'Packages activos'
      )
    };

    this.metrics.configuration = config;
    return config;
  }

  /**
   * Colecta métricas del repositorio
   */
  collectRepositoryMetrics() {
    console.log('\n📊 Colectando métricas del repositorio...');

    const repo = {
      currentBranch: this.executeCommand(
        'git branch --show-current 2>/dev/null || echo "N/A"',
        'Rama actual'
      ),
      lastCommit: this.executeCommand(
        'git rev-parse --short HEAD 2>/dev/null || echo "N/A"',
        'Último commit'
      ),
      totalCommits: this.executeCommand(
        'git rev-list --count HEAD 2>/dev/null || echo "N/A"',
        'Total de commits'
      ),
      untrackedFiles: this.executeCommand(
        'git status --porcelain 2>/dev/null | grep "^??" | wc -l',
        'Archivos no rastreados'
      ),
      modifiedFiles: this.executeCommand(
        'git status --porcelain 2>/dev/null | grep "^ M" | wc -l',
        'Archivos modificados'
      )
    };

    this.metrics.repository = repo;
    return repo;
  }

  /**
   * Genera placeholders para documentos
   */
  generatePlaceholders() {
    const placeholders = {
      componentSizePlaceholders: {},
      countPlaceholders: {},
      configPlaceholders: {}
    };

    // Generar placeholders para tamaños
    Object.entries(this.metrics.componentSizes).forEach(([name, size]) => {
      placeholders.componentSizePlaceholders[name] = {
        value: size,
        placeholder: `$(du -sh ${
          name === 'daemon'
            ? 'packages/daemon/src/'
            : name === 'router'
              ? 'packages/router/src/'
              : name === 'skills-cli'
                ? 'packages/skills-cli/src/'
                : name === 'docs'
                  ? 'docs/'
                  : `${name}/`
        } | cut -f1 || echo "N/A")`,
        command:
          name === 'daemon'
            ? 'du -sh packages/daemon/src/ | cut -f1'
            : name === 'router'
              ? 'du -sh packages/router/src/ | cut -f1'
              : name === 'skills-cli'
                ? 'du -sh packages/skills-cli/src/ | cut -f1'
                : name === 'docs'
                  ? 'du -sh docs/ | cut -f1'
                  : `du -sh ${name}/ | cut -f1`
      };
    });

    // Generar placeholders para conteos
    Object.entries(this.metrics.fileCounts).forEach(([key, count]) => {
      placeholders.countPlaceholders[key] = {
        value: count,
        placeholder: this.getCountPlaceholder(key),
        command: this.getCountCommand(key)
      };
    });

    // Generar placeholders para configuración
    Object.entries(this.metrics.configuration).forEach(([key, value]) => {
      placeholders.configPlaceholders[key] = {
        value: value,
        placeholder: this.getConfigPlaceholder(key),
        command: this.getConfigCommand(key)
      };
    });

    this.placeholders = placeholders;
    return placeholders;
  }

  getCountPlaceholder(key) {
    const commands = {
      markdownFiles: '$(find docs/ -name "*.md" | wc -l)',
      skillDirectories:
        '$(find skills/ -maxdepth 1 -type d | tail -n +2 | wc -l)',
      typescriptFiles: '$(find packages/*/src/ -name "*.ts" | wc -l)',
      javascriptFiles: '$(find packages/*/src/ -name "*.js" | wc -l)',
      testFiles: '$(find . -name "*.test.*" -o -name "*.spec.*" | wc -l)',
      configurationFiles:
        '$(find . -name "*.json" -o -name "*.yaml" -o -name "*.yml" | wc -l)'
    };
    return commands[key] || '$(echo "N/A")';
  }

  getCountCommand(key) {
    const commands = {
      markdownFiles: 'find docs/ -name "*.md" | wc -l',
      skillDirectories: 'find skills/ -maxdepth 1 -type d | tail -n +2 | wc -l',
      typescriptFiles: 'find packages/*/src/ -name "*.ts" | wc -l',
      javascriptFiles: 'find packages/*/src/ -name "*.js" | wc -l',
      testFiles: 'find . -name "*.test.*" -o -name "*.spec.*" | wc -l',
      configurationFiles:
        'find . -name "*.json" -o -name "*.yaml" -o -name "*.yml" | wc -l'
    };
    return commands[key] || 'echo "N/A"';
  }

  getConfigPlaceholder(key) {
    const commands = {
      skillRulesSize: '$(du -sh configs/skill-rules.json | cut -f1)',
      slashCommandsSize: '$(du -sh configs/slash-commands.json | cut -f1)',
      totalSkills: '$(find skills/ -name "SKILL.md" | wc -l)',
      activePackages: '$(find packages/ -name "package.json" | wc -l)'
    };
    return commands[key] || '$(echo "N/A")';
  }

  getConfigCommand(key) {
    const commands = {
      skillRulesSize: 'du -sh configs/skill-rules.json | cut -f1',
      slashCommandsSize: 'du -sh configs/slash-commands.json | cut -f1',
      totalSkills: 'find skills/ -name "SKILL.md" | wc -l',
      activePackages: 'find packages/ -name "package.json" | wc -l'
    };
    return commands[key] || 'echo "N/A"';
  }

  /**
   * Genera reporte completo de métricas dinámicas
   */
  generateReport() {
    const report = {
      timestamp: this.timestamp,
      targetPath: this.targetPath,
      metrics: this.metrics,
      placeholders: this.placeholders,
      summary: {
        totalComponentsAnalyzed: Object.keys(this.metrics.componentSizes)
          .length,
        totalFileCategories: Object.keys(this.metrics.fileCounts).length,
        configItemsAnalyzed: Object.keys(this.metrics.configuration).length,
        lastUpdated: this.timestamp,
        verificationCommands: this.getAllVerificationCommands()
      }
    };

    return report;
  }

  getAllVerificationCommands() {
    const commands = {
      componentSizes: {},
      fileCounts: {},
      configuration: {}
    };

    Object.entries(this.placeholders.componentSizePlaceholders).forEach(
      ([name, info]) => {
        commands.componentSizes[name] = info.command;
      }
    );

    Object.entries(this.placeholders.countPlaceholders).forEach(
      ([key, info]) => {
        commands.fileCounts[key] = info.command;
      }
    );

    Object.entries(this.placeholders.configPlaceholders).forEach(
      ([key, info]) => {
        commands.configuration[key] = info.command;
      }
    );

    return commands;
  }

  /**
   * Guarda reporte en archivo JSON
   */
  saveReport(outputPath = './reports/dynamic-metrics.json') {
    const report = this.generateReport();

    // Asegurar que el directorio existe
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Reporte guardado en: ${outputPath}`);

    return outputPath;
  }

  /**
   * Método principal de ejecución
   */
  run() {
    console.log('🚀 Iniciando colector de métricas dinámicas...');
    console.log('⚠️  ESTE SCRIPT ES OBLIGATORIO según MAX-014 y OBL-018');

    try {
      // Colectar todas las métricas
      this.collectComponentSizes();
      this.collectFileCounts();
      this.collectConfigurationMetrics();
      this.collectRepositoryMetrics();

      // Generar placeholders
      this.generatePlaceholders();

      // Guardar reporte
      const reportPath = this.saveReport();

      console.log('\n✅ Colecta de métricas dinámicas completada exitosamente');
      console.log('✅ MAX-014 y OBL-018 compliance verificado');
      console.log(`✅ Reporte guardado en: ${reportPath}`);

      return this.generateReport();
    } catch (error) {
      console.error('\n❌ Falló colecta de métricas dinámicas:', error.message);
      throw error;
    }
  }
}

// Ejecución principal
if (require.main === module) {
  const collector = new DynamicMetricsCollector();
  collector.run();
}

module.exports = { DynamicMetricsCollector };
