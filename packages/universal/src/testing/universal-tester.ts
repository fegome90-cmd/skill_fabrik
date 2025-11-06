/**
 * Universal Tester - Cross-Platform Compatibility Testing
 *
 * Sistema de testing universal que valida la compatibilidad de Skills Fabric
 * en diferentes tipos de proyectos y plataformas.
 *
 * @version 1.0.0
 */

import { spawn, ChildProcess } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { execSync } from 'child_process';
import { detectProject } from '../project-detector.js';
import { UniversalInstaller } from '../installer/universal-installer.js';
import { ServiceManager } from '../services/service-manager.js';
import { CleanUninstaller } from '../uninstaller/clean-uninstall.js';

export interface TestProject {
  name: string;
  type: string;
  template: string;
  description: string;
  setupCommands: string[];
  validateCommands: string[];
  cleanupCommands: string[];
}

export interface TestResult {
  project: string;
  success: boolean;
  installation: boolean;
  services: boolean;
  hooks: boolean;
  compatibility: boolean;
  performance: TestPerformance;
  errors: string[];
  warnings: string[];
  duration: number;
}

export interface TestPerformance {
  installTime: number;
  startTime: number;
  memoryUsage: number;
  cpuUsage: number;
}

export interface TestSuite {
  name: string;
  projects: TestProject[];
  platform: string;
  nodeVersion: string;
  results: TestResult[];
  summary: TestSummary;
}

export interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  successRate: number;
  averageDuration: number;
  criticalIssues: string[];
}

export class UniversalTester {
  private static readonly TEST_PROJECTS: TestProject[] = [
    {
      name: 'React TypeScript',
      type: 'react',
      template: 'react-typescript',
      description: 'React 18 with TypeScript and Vite',
      setupCommands: [
        'npm create vite@latest react-test -- --template react-ts',
        'cd react-test && npm install'
      ],
      validateCommands: [
        'npm run build',
        'npm run test -- --run',
        'npm run lint'
      ],
      cleanupCommands: [
        'cd .. && rm -rf react-test'
      ]
    },
    {
      name: 'Vue.js JavaScript',
      type: 'vue',
      template: 'vue-javascript',
      description: 'Vue 3 with JavaScript and Vite',
      setupCommands: [
        'npm create vite@latest vue-test -- --template vue',
        'cd vue-test && npm install'
      ],
      validateCommands: [
        'npm run build',
        'npm run test',
        'npm run lint'
      ],
      cleanupCommands: [
        'cd .. && rm -rf vue-test'
      ]
    },
    {
      name: 'Node.js Express',
      type: 'nodejs',
      template: 'express-typescript',
      description: 'Express API with TypeScript',
      setupCommands: [
        'mkdir nodejs-test && cd nodejs-test',
        'npm init -y',
        'npm install express @types/express @types/node typescript ts-node',
        'npm install --save-dev jest @types/jest ts-jest eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin'
      ],
      validateCommands: [
        'npx tsc --noEmit',
        'npm test',
        'npx eslint . --ext .ts'
      ],
      cleanupCommands: [
        'cd .. && rm -rf nodejs-test'
      ]
    },
    {
      name: 'Python Django',
      type: 'python',
      template: 'django-python',
      description: 'Django web application',
      setupCommands: [
        'mkdir python-test && cd python-test',
        'python -m venv venv',
        'source venv/bin/activate',
        'pip install django djangorestframework pytest pytest-django flake8 black'
      ],
      validateCommands: [
        'python manage.py check',
        'pytest',
        'flake8 .',
        'black --check .'
      ],
      cleanupCommands: [
        'cd .. && rm -rf python-test'
      ]
    },
    {
      name: 'Python FastAPI',
      type: 'python',
      template: 'fastapi-python',
      description: 'FastAPI application with TypeScript',
      setupCommands: [
        'mkdir fastapi-test && cd fastapi-test',
        'python -m venv venv',
        'source venv/bin/activate',
        'pip install fastapi uvicorn pytest httpx pydantic mypy black'
      ],
      validateCommands: [
        'mypy .',
        'pytest',
        'black --check .'
      ],
      cleanupCommands: [
        'cd .. && rm -rf fastapi-test'
      ]
    },
    {
      name: 'Go HTTP Server',
      type: 'go',
      template: 'go-http-server',
      description: 'Go HTTP server with routing',
      setupCommands: [
        'mkdir go-test && cd go-test',
        'go mod init example.com/server',
        'go get github.com/gin-gonic/gin',
        'go get github.com/stretchr/testify/assert'
      ],
      validateCommands: [
        'go build .',
        'go test ./...',
        'go vet ./...'
      ],
      cleanupCommands: [
        'cd .. && rm -rf go-test'
      ]
    }
  ];

  /**
   * Ejecuta testing universal de compatibilidad
   */
  static async validateCompatibility(
    projectTypes?: string[],
    options: { verbose?: boolean; quick?: boolean } = {}
  ): Promise<TestSuite> {
    console.log('🧪 Skills Fabric Universal - Compatibility Testing');
    console.log('');

    const projectsToTest = projectTypes
      ? this.TEST_PROJECTS.filter(p => projectTypes.includes(p.type))
      : this.TEST_PROJECTS;

    console.log(`📋 Testing ${projectsToTest.length} project types...`);
    console.log('');

    const testSuite: TestSuite = {
      name: `Universal Compatibility Test - ${new Date().toISOString()}`,
      projects: projectsToTest,
      platform: process.platform,
      nodeVersion: process.version,
      results: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        successRate: 0,
        averageDuration: 0,
        criticalIssues: []
      }
    };

    const testDir = this.createTestDirectory();

    try {
      for (const project of projectsToTest) {
        const result = await this.testProject(project, testDir, options);
        testSuite.results.push(result);

        // Mostrar resultado del proyecto
        this.displayProjectResult(result);

        // Pequeña pausa entre tests
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Calcular resumen
      testSuite.summary = this.calculateSummary(testSuite.results);

      // Mostrar resumen final
      this.displayFinalSummary(testSuite);

    } finally {
      // Limpiar directorio de test
      this.cleanupTestDirectory(testDir);
    }

    return testSuite;
  }

  /**
   * Prueba un proyecto específico
   */
  private static async testProject(
    project: TestProject,
    testDir: string,
    options: { verbose?: boolean; quick?: boolean }
  ): Promise<TestResult> {
    const startTime = Date.now();
    console.log(`🔄 Testing ${project.name}...`);

    const result: TestResult = {
      project: project.name,
      success: true,
      installation: false,
      services: false,
      hooks: false,
      compatibility: false,
      performance: {
        installTime: 0,
        startTime: 0,
        memoryUsage: 0,
        cpuUsage: 0
      },
      errors: [],
      warnings: [],
      duration: 0
    };

    const projectDir = join(testDir, project.name.toLowerCase().replace(/\s+/g, '-'));

    try {
      // 1. Crear proyecto
      console.log(`   📁 Creating project...`);
      await this.setupProject(project, projectDir);
      console.log(`   ✅ Project created`);

      // 2. Instalar Skills Fabric
      console.log(`   🚀 Installing Skills Fabric...`);
      const installStart = Date.now();
      process.chdir(projectDir);

      await UniversalInstaller.installGlobal({
        verbose: options.verbose ?? false,
        skipServices: options.quick ?? false
      });

      result.performance.installTime = Date.now() - installStart;
      result.installation = true;
      console.log(`   ✅ Skills Fabric installed (${result.performance.installTime}ms)`);

      // 3. Validar instalación
      console.log(`   ✅ Validating installation...`);
      const isValid = await this.validateInstallation(projectDir);
      result.compatibility = isValid;

      if (!isValid) {
        result.errors.push('Installation validation failed');
        result.success = false;
      }

      // 4. Probar servicios (si no es quick)
      if (!options.quick) {
        console.log(`   🏃 Testing services...`);
        const servicesWork = await this.testServices(projectDir);
        result.services = servicesWork;

        if (!servicesWork) {
          result.warnings.push('Services test failed');
        }
      }

      // 5. Probar hooks (si no es quick)
      if (!options.quick) {
        console.log(`   🔗 Testing hooks...`);
        const hooksWork = await this.testHooks(projectDir);
        result.hooks = hooksWork;

        if (!hooksWork) {
          result.warnings.push('Hooks test failed');
        }
      }

      // 6. Validar comandos del proyecto
      console.log(`   🧪 Running project tests...`);
      await this.validateProjectCommands(project, projectDir);

      console.log(`   ✅ ${project.name} test completed successfully`);

    } catch (error) {
      result.success = false;
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(errorMessage);
      console.log(`   ❌ ${project.name} test failed: ${errorMessage}`);
    } finally {
      result.duration = Date.now() - startTime;

      // Limpiar proyecto
      try {
        await this.cleanupProject(project, projectDir);
      } catch (cleanupError) {
        const cleanupErrorMessage = cleanupError instanceof Error ? cleanupError.message : String(cleanupError);
        result.warnings.push(`Cleanup failed: ${cleanupErrorMessage}`);
      }
    }

    return result;
  }

  /**
   * Configura un proyecto de prueba
   */
  private static async setupProject(project: TestProject, projectDir: string): Promise<void> {
    // Crear directorio
    mkdirSync(projectDir, { recursive: true });

    // Ejecutar comandos de setup
    for (const command of project.setupCommands) {
      execSync(command, {
        cwd: projectDir,
        stdio: 'pipe',
        timeout: 120000 // 2 minutos timeout
      });
    }
  }

  /**
   * Valida la instalación de Skills Fabric
   */
  private static async validateInstallation(projectDir: string): Promise<boolean> {
    try {
      // Verificar configuración
      const configPath = join(projectDir, '.skills-fabrik', 'config.json');
      if (!existsSync(configPath)) {
        return false;
      }

      // Verificar que la configuración sea válida
      const config = JSON.parse(readFileSync(configPath, 'utf-8'));
      if (!config.projectId || !config.version) {
        return false;
      }

      // Verificar detección de proyecto
      const projectInfo = await detectProject(projectDir);
      if (!projectInfo || projectInfo.relevanceScore < 30) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Prueba los servicios de Skills Fabric
   */
  private static async testServices(projectDir: string): Promise<boolean> {
    try {
      // Obtener estado de servicios
      const services = await ServiceManager.getServicesStatus(projectDir);
      const runningServices = services.filter(s => s.running);

      // Al menos 2 servicios deben estar corriendo
      return runningServices.length >= 2;
    } catch {
      return false;
    }
  }

  /**
   * Prueba los hooks del IDE
   */
  private static async testHooks(projectDir: string): Promise<boolean> {
    try {
      // Verificar hooks de Cursor
      const cursorConfig = join(projectDir, '.cursor', 'hooks', 'hooks-config.json');
      if (existsSync(cursorConfig)) {
        const config = JSON.parse(readFileSync(cursorConfig, 'utf-8'));
        return config.userPromptSubmit?.enabled || config.stop?.enabled;
      }

      // Verificar hooks de VS Code
      const vscodeTasks = join(projectDir, '.vscode', 'tasks.json');
      return existsSync(vscodeTasks);
    } catch {
      return false;
    }
  }

  /**
   * Valida los comandos del proyecto
   */
  private static async validateProjectCommands(project: TestProject, projectDir: string): Promise<void> {
    for (const command of project.validateCommands) {
      try {
        execSync(command, {
          cwd: projectDir,
          stdio: 'pipe',
          timeout: 60000 // 1 minuto timeout
        });
      } catch (error) {
        // Algunos comandos pueden fallar, no es crítico
        console.warn(`     ⚠️  Command failed: ${command}`);
      }
    }
  }

  /**
   * Limpia un proyecto de prueba
   */
  private static async cleanupProject(project: TestProject, projectDir: string): Promise<void> {
    try {
      // Desinstalar Skills Fabric
      await CleanUninstaller.completeRemoval(projectDir, {
        force: true,
        complete: false
      });
    } catch {
      // Error en desinstalación, continuar con limpieza manual
    }

    // Ejecutar comandos de limpieza
    for (const command of project.cleanupCommands) {
      try {
        execSync(command, {
          cwd: dirname(projectDir),
          stdio: 'pipe',
          timeout: 30000
        });
      } catch {
        // Error en limpieza, ignorar
      }
    }
  }

  /**
   * Crea directorio de tests
   */
  private static createTestDirectory(): string {
    const testDir = join(process.cwd(), '.skills-fabrik-tests');

    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }

    mkdirSync(testDir, { recursive: true });
    return testDir;
  }

  /**
   * Limpia directorio de tests
   */
  private static cleanupTestDirectory(testDir: string): void {
    try {
      if (existsSync(testDir)) {
        rmSync(testDir, { recursive: true, force: true });
      }
    } catch {
      // Error en limpieza, ignorar
    }
  }

  /**
   * Calcula resumen de tests
   */
  private static calculateSummary(results: TestResult[]): TestSummary {
    const total = results.length;
    const passed = results.filter(r => r.success).length;
    const failed = total - passed;
    const successRate = total > 0 ? (passed / total) * 100 : 0;
    const averageDuration = results.reduce((sum, r) => sum + r.duration, 0) / total;

    const criticalIssues: string[] = [];
    for (const result of results) {
      if (!result.installation) {
        criticalIssues.push(`${result.project}: Installation failed`);
      }
      if (!result.compatibility) {
        criticalIssues.push(`${result.project}: Compatibility issues`);
      }
    }

    return {
      total,
      passed,
      failed,
      successRate,
      averageDuration,
      criticalIssues
    };
  }

  /**
   * Muestra resultado de un proyecto
   */
  private static displayProjectResult(result: TestResult): void {
    const status = result.success ? '✅' : '❌';
    const details = [
      result.installation ? 'Install' : '',
      result.services ? 'Services' : '',
      result.hooks ? 'Hooks' : '',
      result.compatibility ? 'Compatible' : ''
    ].filter(Boolean).join(', ');

    console.log(`   ${status} ${result.project} (${result.duration}ms) - ${details}`);

    if (result.errors.length > 0) {
      result.errors.forEach(error => console.log(`     ❌ ${error}`));
    }

    if (result.warnings.length > 0) {
      result.warnings.forEach(warning => console.log(`     ⚠️  ${warning}`));
    }
  }

  /**
   * Muestra resumen final
   */
  private static displayFinalSummary(testSuite: TestSuite): void {
    console.log('');
    console.log('📊 Test Suite Summary');
    console.log('==================');
    console.log(`Platform: ${testSuite.platform}`);
    console.log(`Node.js: ${testSuite.nodeVersion}`);
    console.log(`Total Projects: ${testSuite.summary.total}`);
    console.log(`Passed: ${testSuite.summary.passed}`);
    console.log(`Failed: ${testSuite.summary.failed}`);
    console.log(`Success Rate: ${testSuite.summary.successRate.toFixed(1)}%`);
    console.log(`Average Duration: ${Math.round(testSuite.summary.averageDuration)}ms`);
    console.log('');

    if (testSuite.summary.criticalIssues.length > 0) {
      console.log('🚨 Critical Issues:');
      testSuite.summary.criticalIssues.forEach(issue => console.log(`   - ${issue}`));
      console.log('');
    }

    const status = testSuite.summary.successRate >= 80 ? '✅ PASSED' : '❌ FAILED';
    console.log(`Overall Status: ${status}`);
    console.log('');
  }
}

// Exportar funciones de conveniencia
export async function runCompatibilityTests(
  projectTypes?: string[],
  options?: { verbose?: boolean; quick?: boolean }
): Promise<TestSuite> {
  return await UniversalTester.validateCompatibility(projectTypes, options);
}