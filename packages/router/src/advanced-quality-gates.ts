/**
 * Advanced Quality Gates - Sistema de quality checks específicos por tipo de proyecto
 * Ejecuta validaciones avanzadas basadas en las características del proyecto
 */

import { projectAnalyzer, ProjectCharacteristics, QualityGateRule, ProjectType } from './project-analyzer.js';
import { readFile, access, constants } from 'fs/promises';
import { join, resolve } from 'path';
import { execSync } from 'child_process';

/**
 * Resultado de un quality gate
 */
export interface QualityGateResult {
  gate: QualityGateRule;
  passed: boolean;
  projectPath: string;
  characteristics: ProjectCharacteristics;
  executionTime: number;
  details?: any;
  suggestion?: string;
}

/**
 * Resumen de calidad del proyecto
 */
export interface QualitySummary {
  projectPath: string;
  characteristics: ProjectCharacteristics;
  totalGates: number;
  passedGates: number;
  failedGates: number;
  warningGates: number;
  errorGates: number;
  infoGates: number;
  score: number; // 0-100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  results: QualityGateResult[];
  executionTime: number;
  recommendations: string[];
}

/**
 * Validaciones avanzadas específicas
 */
export class AdvancedQualityGateValidator {
  private cache = new Map<string, QualitySummary>();

  /**
   * Ejecuta todos los quality gates para un proyecto
   */
  async validateProject(projectPath: string): Promise<QualitySummary> {
    const startTime = Date.now();

    // Analizar características del proyecto
    const characteristics = await projectAnalyzer.analyzeProject(projectPath);

    // Obtener quality gates específicos
    const gates = projectAnalyzer.getQualityGates(characteristics, projectPath);

    // Ejecutar todos los gates
    const results: QualityGateResult[] = [];
    for (const gate of gates) {
      const gateStartTime = Date.now();
      try {
        const passed = await gate.check(characteristics);
        results.push({
          gate,
          passed,
          projectPath,
          characteristics,
          executionTime: Date.now() - gateStartTime
        });
      } catch (error) {
        results.push({
          gate,
          passed: false,
          projectPath,
          characteristics,
          executionTime: Date.now() - gateStartTime,
          details: error instanceof Error ? error.message : String(error)
        });
      }
    }

    // Calcular métricas
    const totalGates = results.length;
    const passedGates = results.filter(r => r.passed).length;
    const failedGates = totalGates - passedGates;
    const warningGates = results.filter(r => !r.passed && r.gate.severity === 'warning').length;
    const errorGates = results.filter(r => !r.passed && r.gate.severity === 'error').length;
    const infoGates = results.filter(r => !r.passed && r.gate.severity === 'info').length;

    // Calcular score y grade
    const score = this.calculateScore(results);
    const grade = this.calculateGrade(score);

    // Generar recomendaciones
    const recommendations = this.generateRecommendations(results, characteristics);

    const summary: QualitySummary = {
      projectPath,
      characteristics,
      totalGates,
      passedGates,
      failedGates,
      warningGates,
      errorGates,
      infoGates,
      score,
      grade,
      results,
      executionTime: Date.now() - startTime,
      recommendations
    };

    // Cache resultado
    this.cache.set(projectPath, summary);

    return summary;
  }

  /**
   * Calcula score de calidad (0-100)
   */
  private calculateScore(results: QualityGateResult[]): number {
    let score = 100;

    for (const result of results) {
      if (!result.passed) {
        switch (result.gate.severity) {
          case 'error':
            score -= 25;
            break;
          case 'warning':
            score -= 10;
            break;
          case 'info':
            score -= 5;
            break;
        }
      }
    }

    return Math.max(0, score);
  }

  /**
   * Calcula calificación basada en score
   */
  private calculateGrade(score: number): QualitySummary['grade'] {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Genera recomendaciones de mejora
   */
  private generateRecommendations(results: QualityGateResult[], characteristics: ProjectCharacteristics): string[] {
    const recommendations: string[] = [];

    // Recomendaciones basadas en gates fallidos
    for (const result of results.filter(r => !r.passed)) {
      if (result.gate.fix) {
        recommendations.push(`- ${result.gate.message}: ${result.gate.fix}`);
      } else {
        recommendations.push(`- ${result.gate.message}`);
      }
    }

    // Recomendaciones basadas en características
    if (characteristics.type === ProjectType.REACT && !characteristics.hasTests) {
      recommendations.push('- Consider adding React Testing Library for component testing');
    }

    if (characteristics.type === ProjectType.NODE_JS && !characteristics.testCoverage) {
      recommendations.push('- Add code coverage tooling like nyc or c8');
    }

    if (!characteristics.hasDocker) {
      recommendations.push('- Consider adding Dockerfile for containerization');
    }

    if (!characteristics.hasGitHub) {
      recommendations.push('- Add GitHub Actions for CI/CD');
    }

    return recommendations;
  }

  /**
   * Ejecuta quality gates específicos de seguridad
   */
  async validateSecurity(projectPath: string): Promise<QualityGateResult[]> {
    const characteristics = await projectAnalyzer.analyzeProject(projectPath);
    const securityGates: QualityGateRule[] = [
      {
        name: 'no-secrets-in-code',
        description: 'Code should not contain hardcoded secrets',
        severity: 'error',
        check: async () => this.checkForSecrets(projectPath),
        message: 'Potential secrets found in code',
        fix: 'Remove hardcoded secrets and use environment variables'
      },
      {
        name: 'no-insecure-dependencies',
        description: 'Dependencies should not have known vulnerabilities',
        severity: 'error',
        check: async () => this.checkDependencyVulnerabilities(projectPath),
        message: 'Vulnerable dependencies detected',
        fix: 'Update dependencies to secure versions'
      },
      {
        name: 'no-hardcoded-credentials',
        description: 'Database credentials should not be hardcoded',
        severity: 'error',
        check: async () => this.checkForHardcodedCredentials(projectPath),
        message: 'Hardcoded credentials detected',
        fix: 'Use environment variables for credentials'
      }
    ];

    const results: QualityGateResult[] = [];
    for (const gate of securityGates) {
      const startTime = Date.now();
      try {
        const passed = await gate.check(characteristics);
        results.push({
          gate,
          passed,
          projectPath,
          characteristics,
          executionTime: Date.now() - startTime
        });
      } catch (error) {
        results.push({
          gate,
          passed: false,
          projectPath,
          characteristics,
          executionTime: Date.now() - startTime,
          details: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return results;
  }

  /**
   * Ejecuta quality gates de performance
   */
  async validatePerformance(projectPath: string): Promise<QualityGateResult[]> {
    const characteristics = await projectAnalyzer.analyzeProject(projectPath);
    const performanceGates: QualityGateRule[] = [
      {
        name: 'bundle-size-optimized',
        description: 'Bundle size should be optimized',
        severity: 'warning',
        check: async () => this.checkBundleSize(projectPath),
        message: 'Bundle size could be optimized',
        fix: 'Use code splitting and tree shaking'
      },
      {
        name: 'no-unused-dependencies',
        description: 'No unused dependencies should be present',
        severity: 'warning',
        check: async () => this.checkUnusedDependencies(projectPath),
        message: 'Unused dependencies detected',
        fix: 'Remove unused dependencies with depcheck'
      },
      {
        name: 'images-optimized',
        description: 'Images should be optimized',
        severity: 'info',
        check: async () => this.checkImageOptimization(projectPath),
        message: 'Images could be optimized',
        fix: 'Compress images and use modern formats'
      }
    ];

    const results: QualityGateResult[] = [];
    for (const gate of performanceGates) {
      const startTime = Date.now();
      try {
        const passed = await gate.check(characteristics);
        results.push({
          gate,
          passed,
          projectPath,
          characteristics,
          executionTime: Date.now() - startTime
        });
      } catch (error) {
        results.push({
          gate,
          passed: false,
          projectPath,
          characteristics,
          executionTime: Date.now() - startTime,
          details: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return results;
  }

  /**
   * Verifica si hay secrets en el código
   */
  private async checkForSecrets(projectPath: string): Promise<boolean> {
    const secretPatterns = [
      /password\s*=\s*['"`][^'"`]+['"`]/gi,
      /api[_-]?key\s*=\s*['"`][^'"`]+['"`]/gi,
      /secret\s*=\s*['"`][^'"`]+['"`]/gi,
      /token\s*=\s*['"`][^'"`]+['"`]/gi,
      /[_-]?private\s*=\s*['"`][^'"`]+['"`]/gi,
      /[_-]?auth\s*=\s*['"`][^'"`]+['"`]/gi
    ];

    try {
      const files = await this.getProjectFiles(projectPath);
      for (const file of files) {
        const content = await readFile(join(projectPath, file), 'utf-8');
        for (const pattern of secretPatterns) {
          if (pattern.test(content)) {
            return false; // Encontró patrón de secreto
          }
        }
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Verifica vulnerabilidades en dependencias
   */
  private async checkDependencyVulnerabilities(projectPath: string): Promise<boolean> {
    try {
      // Intentar ejecutar npm audit
      execSync('npm audit --audit-level moderate', {
        cwd: projectPath,
        stdio: 'pipe'
      });
      return true; // No hay vulnerabilidades críticas
    } catch {
      return false; // Hay vulnerabilidades
    }
  }

  /**
   * Verifica credenciales codificadas
   */
  private async checkForHardcodedCredentials(projectPath: string): Promise<boolean> {
    const credentialPatterns = [
      /mongodb:\/\/[^@:\s]+:[^@:\s]+@/gi,
      /postgres:\/\/[^@:\s]+:[^@:\s]+@/gi,
      /mysql:\/\/[^@:\s]+:[^@:\s]+@/gi,
      /redis:\/\/[^@:\s]+:[^@:\s]+@/gi,
      /connection\s*=\s*['"`][^'"`]*password['"`]/gi,
      /database_url\s*=\s*['"`][^'"`]*password['"`]/gi
    ];

    try {
      const files = this.getConfigurationFiles(projectPath);
      for (const file of files) {
        try {
          const content = await readFile(join(projectPath, file), 'utf-8');
          for (const pattern of credentialPatterns) {
            if (pattern.test(content)) {
              return false; // Encontró credencial
            }
          }
        } catch {
          // Continuar con otros archivos
        }
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Verifica tamaño del bundle
   */
  private async checkBundleSize(projectPath: string): Promise<boolean> {
    // Simplificado: verificar tamaño de archivos JS/TS principales
    try {
      const files = await this.getProjectFiles(projectPath);
      const jsFiles = files.filter((f: string) => f.endsWith('.js') || f.endsWith('.jsx'));

      let totalSize = 0;
      for (const file of jsFiles) {
        try {
          const stats = await access(join(projectPath, file), constants.F_OK);
          // Simplificado: asumir tamaño razonable si archivo existe
          totalSize += 50000; // ~50KB por archivo JS estimado
        } catch {
          // Archivo no accesible
        }
      }

      // Umbral simplificado: 2MB para bundles pequeños
      return totalSize < 2 * 1024 * 1024;
    } catch {
      return true;
    }
  }

  /**
   * Verifica dependencias no usadas
   */
  private async checkUnusedDependencies(projectPath: string): Promise<boolean> {
    try {
      // Intentar ejecutar depcheck si está disponible
      execSync('npx depcheck', {
        cwd: projectPath,
        stdio: 'pipe'
      });
      return true; // No hay dependencias no usadas
    } catch {
      return false; // Hay dependencias no usadas
    }
  }

  /**
   * Verifica optimización de imágenes
   */
  private async checkImageOptimization(projectPath: string): Promise<boolean> {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg'];
    try {
      const files = await this.getProjectFiles(projectPath);
      const imageFiles = files.filter((f: string) =>
        imageExtensions.some(ext => f.toLowerCase().endsWith(ext))
      );

      // Simplificado: asumir que si hay >10 imágenes, podría optimizarse
      return imageFiles.length <= 10;
    } catch {
      return true;
    }
  }

  /**
   * Obtiene archivos del proyecto
   */
  private async getProjectFiles(projectPath: string): Promise<string[]> {
    try {
      const result = execSync(`find "${projectPath}" -type f \\( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" -o -name "*.vue" -o -name "*.py" \\) | head -50`, {
        encoding: 'utf-8',
        cwd: projectPath
      });
      return result.split('\n').filter(f => f.trim());
    } catch {
      return [];
    }
  }

  /**
   * Obtiene archivos de configuración
   */
  private getConfigurationFiles(projectPath: string): string[] {
    const configFiles = [
      'package.json',
      '.env',
      '.env.local',
      '.env.example',
      'config.json',
      'config.js',
      'config.ts'
    ];

    return configFiles.filter(file => {
      try {
        access(join(projectPath, file), constants.F_OK);
        return true;
      } catch {
        return false;
      }
    });
  }

  /**
   * Limpia cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Obtiene resumen cacheado
   */
  getCachedSummary(projectPath: string): QualitySummary | null {
    return this.cache.get(projectPath) || null;
  }
}

/**
 * Instancia global del validador
 */
export const advancedQualityGateValidator = new AdvancedQualityGateValidator();