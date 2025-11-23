#!/usr/bin/env node

/**
 * Simple Architectural Detector - Versión Lean
 * Detecta problemas arquitectónicos concretos sin sobreingeniería
 * Enfocado en problemas reales y accionables para análisis forense
 */

const fs = require('fs');
const path = require('path');

class SimpleArchitecturalDetector {
  constructor(options = {}) {
    this.targetPath = options.targetPath || process.cwd();
    this.issues = [];
    this.metrics = {};
  }

  /**
   * Ejecuta detección arquitectónica simple y directa
   * @returns {Object} - Resultados con problemas concretos
   */
  async detectArchitecturalIssues() {
    console.log('🔍 Simple Architectural Detector - Análisis Directo');

    const startTime = Date.now();

    try {
      // Análisis simple y enfocado
      await this.analyzeFileStructure();
      await this.analyzeDependencies();
      await this.analyzeFileSizes();
      await this.detectCodeDuplication();

      return {
        success: true,
        executionTime: Date.now() - startTime,
        issues: this.issues,
        metrics: this.metrics,
        summary: this.generateSummary()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime
      };
    }
  }

  /**
   * Analiza estructura de archivos - problemas concretos
   */
  async analyzeFileStructure() {
    console.log('  📁 Analizando estructura de archivos...');

    const structure = this.walkDirectory(this.targetPath);
    this.metrics.totalFiles = structure.files;
    this.metrics.totalDirectories = structure.directories;
    this.metrics.maxDepth = structure.maxDepth;
    this.metrics.totalSizeMB = Math.round(structure.totalSize / 1024 / 1024);

    // Problemas concretos y accionables
    if (structure.files > 1000) {
      this.issues.push({
        type: 'HIGH_FILE_COUNT',
        severity: 'MEDIUM',
        description: `Demasiados archivos (${structure.files}) - Considerar modularización`,
        value: structure.files,
        recommendation: 'Dividir en módulos más pequeños y cohesivos'
      });
    }

    if (structure.maxDepth > 8) {
      this.issues.push({
        type: 'DEEP_DIRECTORY_STRUCTURE',
        severity: 'MEDIUM',
        description: `Estructura muy profunda (${structure.maxDepth} niveles) - Dificulta navegación`,
        value: structure.maxDepth,
        recommendation: 'Aplanar estructura, máximo 4-5 niveles de profundidad'
      });
    }

    // Detectar directorios demasiado grandes
    const largeDirs = structure.largeDirectories || [];
    if (largeDirs.length > 0) {
      this.issues.push({
        type: 'LARGE_DIRECTORIES',
        severity: 'LOW',
        description: `${largeDirs.length} directorios con >50 archivos`,
        details: largeDirs.map(dir => `${dir.path}: ${dir.files} archivos`),
        recommendation: 'Considerar subdividir directorios grandes'
      });
    }
  }

  /**
   * Analiza dependencias - problemas reales
   */
  async analyzeDependencies() {
    console.log('  🔗 Analizando dependencias...');

    // Buscar package.json
    const packageJsonPath = path.join(this.targetPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(
          fs.readFileSync(packageJsonPath, 'utf8')
        );
        const deps = Object.keys(packageJson.dependencies || {});
        const devDeps = Object.keys(packageJson.devDependencies || {});

        this.metrics.dependencies = deps.length;
        this.metrics.devDependencies = devDeps.length;
        this.metrics.totalDependencies = deps.length + devDeps.length;

        // Problemas concretos de dependencias
        if (this.metrics.totalDependencies > 100) {
          this.issues.push({
            type: 'TOO_MANY_DEPENDENCIES',
            severity: 'HIGH',
            description: `Exceso de dependencias (${this.metrics.totalDependencies}) - Alto riesgo de mantenimiento`,
            value: this.metrics.totalDependencies,
            recommendation:
              'Revisar dependencias innecesarias, considerar bundle size'
          });
        }

        // Buscar dependencias sospechosas (ejemplos comunes)
        const suspiciousDeps = deps.filter(
          dep =>
            (dep.includes('lodash') && !deps.includes('lodash-es')) ||
            (dep.includes('moment') && !deps.includes('dayjs')) ||
            (dep.includes('request') && !deps.includes('axios'))
        );

        if (suspiciousDeps.length > 0) {
          this.issues.push({
            type: 'SUSPICIOUS_DEPENDENCIES',
            severity: 'MEDIUM',
            description:
              'Dependencias que podrían tener alternativas más modernas',
            details: suspiciousDeps,
            recommendation:
              'Considerar actualizar a alternativas más ligeras/modernas'
          });
        }
      } catch (error) {
        this.issues.push({
          type: 'INVALID_PACKAGE_JSON',
          severity: 'HIGH',
          description: `package.json inválido: ${error.message}`,
          recommendation: 'Corregir sintaxis JSON en package.json'
        });
      }
    }
  }

  /**
   * Analiza tamaños de archivos - problemas visibles
   */
  async analyzeFileSizes() {
    console.log('  📏 Analizando tamaños de archivos...');

    const fileSizes = [];
    const largeFiles = [];

    // Recopilar tamaños de archivos JavaScript/TypeScript
    this.walkDirectory(this.targetPath, (filePath, stats) => {
      if (filePath.match(/\.(js|ts|jsx|tsx)$/)) {
        const sizeKB = Math.round(stats.size / 1024);
        fileSizes.push(sizeKB);

        if (sizeKB > 100) {
          // > 100KB
          largeFiles.push({
            path: path.relative(this.targetPath, filePath),
            sizeKB
          });
        }
      }
    });

    this.metrics.jsFiles = fileSizes.length;
    this.metrics.averageFileSizeKB =
      fileSizes.length > 0
        ? Math.round(
          fileSizes.reduce((sum, size) => sum + size, 0) / fileSizes.length
        )
        : 0;

    // Detectar archivos demasiado grandes
    if (largeFiles.length > 0) {
      this.issues.push({
        type: 'LARGE_FILES',
        severity: 'MEDIUM',
        description: `${largeFiles.length} archivos JavaScript/TypeScript > 100KB`,
        details: largeFiles.map(f => `${f.path}: ${f.sizeKB}KB`),
        recommendation: 'Dividir archivos grandes en módulos más pequeños'
      });
    }

    // Detectar alta variación de tamaños
    if (fileSizes.length > 10) {
      const maxSize = Math.max(...fileSizes);
      const minSize = Math.min(...fileSizes);
      if (maxSize > minSize * 10) {
        this.issues.push({
          type: 'SIZE_VARIANCE',
          severity: 'LOW',
          description: `Alta variación de tamaños (min: ${minSize}KB, max: ${maxSize}KB)`,
          recommendation:
            'Considerar estandarizar tamaños de módulos para mejor mantenibilidad'
        });
      }
    }
  }

  /**
   * Detecta duplicación de código - problema real
   */
  async detectCodeDuplication() {
    console.log('  🔄 Detectando duplicación de código...');

    const commonPatterns = [
      { pattern: /function\s+validate/, name: 'funciones validate' },
      { pattern: /function\s+handle/, name: 'funciones handle' },
      { pattern: /const\s+config\s*=/, name: 'definiciones config' },
      { pattern: /import.*from\s+['"]react['"]/, name: 'imports de React' },
      { pattern: /export\s+default/, name: 'export default' }
    ];

    const patternCounts = {};
    let totalJsFiles = 0;

    this.walkDirectory(this.targetPath, (filePath, stats) => {
      if (filePath.match(/\.(js|ts|jsx|tsx)$/)) {
        totalJsFiles++;
        try {
          const content = fs.readFileSync(filePath, 'utf8');

          commonPatterns.forEach(({ pattern, name }) => {
            if (pattern.test(content)) {
              patternCounts[name] = (patternCounts[name] || 0) + 1;
            }
          });
        } catch (error) {
          // Skip archivos que no se pueden leer
        }
      }
    });

    // Detectar patrones repetidos excesivamente
    Object.entries(patternCounts).forEach(([name, count]) => {
      const percentage = (count / totalJsFiles) * 100;
      if (percentage > 50 && count > 10) {
        // >50% de archivos Y >10 archivos
        this.issues.push({
          type: 'REPEATED_PATTERN',
          severity: 'MEDIUM',
          description: `${name} repetido en ${count} archivos (${percentage.toFixed(1)}%)`,
          recommendation:
            'Considerar extraer a módulos compartidos para reducir duplicación'
        });
      }
    });

    this.metrics.jsFilesAnalyzed = totalJsFiles;
    this.metrics.duplicationPatterns = Object.keys(patternCounts).length;
  }

  /**
   * Recorre directorios recolectando información básica
   */
  walkDirectory(dirPath, callback = null, depth = 0) {
    const structure = {
      files: 0,
      directories: 0,
      maxDepth: depth,
      totalSize: 0,
      largeDirectories: []
    };

    try {
      const items = fs.readdirSync(dirPath);
      let dirFileCount = 0;
      let dirSize = 0;

      for (const item of items) {
        const fullPath = path.join(dirPath, item);

        // Skip node_modules y directorios ocultos
        if (item.startsWith('.') || item === 'node_modules') continue;

        try {
          const stats = fs.statSync(fullPath);

          if (stats.isDirectory()) {
            const subStructure = this.walkDirectory(
              fullPath,
              callback,
              depth + 1
            );
            structure.files += subStructure.files;
            structure.directories += subStructure.directories;
            structure.maxDepth = Math.max(
              structure.maxDepth,
              subStructure.maxDepth
            );
            structure.totalSize += subStructure.totalSize;
            structure.largeDirectories.push(...subStructure.largeDirectories);
          } else if (stats.isFile()) {
            structure.files++;
            structure.totalSize += stats.size;
            dirFileCount++;
            dirSize += stats.size;

            if (callback) {
              callback(fullPath, stats);
            }
          }
        } catch (error) {
          // Skip archivos/carpetas inaccesibles
        }
      }

      // Registrar directorios grandes
      if (dirFileCount > 50) {
        structure.largeDirectories.push({
          path: path.relative(this.targetPath, dirPath),
          files: dirFileCount,
          sizeKB: Math.round(dirSize / 1024)
        });
      }
    } catch (error) {
      // Skip directorios inaccesibles
    }

    return structure;
  }

  /**
   * Genera resumen simple y accionable
   */
  generateSummary() {
    const highSeverity = this.issues.filter(i => i.severity === 'HIGH').length;
    const mediumSeverity = this.issues.filter(
      i => i.severity === 'MEDIUM'
    ).length;
    const lowSeverity = this.issues.filter(i => i.severity === 'LOW').length;

    let overallHealth = 'GOOD';
    if (highSeverity > 0) overallHealth = 'CRITICAL';
    else if (mediumSeverity > 3) overallHealth = 'NEEDS_ATTENTION';
    else if (lowSeverity > 5) overallHealth = 'FAIR';

    return {
      overallHealth,
      totalIssues: this.issues.length,
      highSeverity,
      mediumSeverity,
      lowSeverity,
      quickFixes: this.issues.filter(i => i.severity === 'LOW').length,
      majorRefactoring: this.issues.filter(i => i.severity === 'HIGH').length
    };
  }

  /**
   * Imprime resumen simple y directo
   */
  printSummary(result) {
    console.log('\n📋 Simple Architectural Detector - Resumen');
    console.log('==========================================');

    console.log(`\n🎯 Salud Arquitectónica: ${result.summary.overallHealth}`);
    console.log(`📊 Problemas encontrados: ${result.summary.totalIssues}`);
    console.log(`🔴 Críticos: ${result.summary.highSeverity}`);
    console.log(`🟡 Medios: ${result.summary.mediumSeverity}`);
    console.log(`🟢 Leves: ${result.summary.lowSeverity}`);

    console.log('\n📈 Métricas Clave:');
    console.log(`  Archivos totales: ${result.metrics.totalFiles || 0}`);
    console.log(`  Archivos JS/TS: ${result.metrics.jsFiles || 0}`);
    console.log(`  Dependencias: ${result.metrics.totalDependencies || 0}`);
    console.log(`  Tamaño total: ${result.metrics.totalSizeMB || 0}MB`);

    if (result.issues.length > 0) {
      console.log('\n⚠️  Problemas Detectados:');
      result.issues.forEach(issue => {
        const icon =
          issue.severity === 'HIGH'
            ? '🔴'
            : issue.severity === 'MEDIUM'
              ? '🟡'
              : '🟢';
        console.log(`  ${icon} ${issue.type}: ${issue.description}`);
        if (issue.recommendation) {
          console.log(`    💡 ${issue.recommendation}`);
        }
      });
    }

    // Acciones inmediatas
    const quickWins = result.issues.filter(i => i.severity === 'LOW');
    if (quickWins.length > 0) {
      console.log('\n🚀 Quick Wins (corregir primero):');
      quickWins.forEach(issue => {
        console.log(`  ✅ ${issue.type}: ${issue.recommendation}`);
      });
    }

    // Problemas críticos
    const criticalIssues = result.issues.filter(i => i.severity === 'HIGH');
    if (criticalIssues.length > 0) {
      console.log('\n🚨 Atención Crítica Requerida:');
      criticalIssues.forEach(issue => {
        console.log(`  🔥 ${issue.type}: ${issue.description}`);
        console.log(`    🎯 ${issue.recommendation}`);
      });
    }
  }
}

module.exports = SimpleArchitecturalDetector;

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const targetPath = args[0] || process.cwd();

  const detector = new SimpleArchitecturalDetector({ targetPath });

  detector
    .detectArchitecturalIssues()
    .then(result => {
      detector.printSummary(result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error(`❌ Detection failed: ${error.message}`);
      process.exit(1);
    });
}
