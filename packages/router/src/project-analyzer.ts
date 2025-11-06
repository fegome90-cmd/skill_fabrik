/**
 * Project Analyzer - Analiza proyectos para determinar tipo y aplicar quality gates específicos
 * Detecta patrones de proyecto (React, Node.js, Python, TypeScript, etc.)
 */

import { readFile, access, constants } from 'fs/promises';
import { join, resolve } from 'path';
import { execSync } from 'child_process';

/**
 * Tipos de proyecto detectados
 */
export enum ProjectType {
  REACT = 'react',
  NODE_JS = 'nodejs',
  TYPESCRIPT = 'typescript',
  PYTHON = 'python',
  VUE = 'vue',
  ANGULAR = 'angular',
  NEXT_JS = 'nextjs',
  EXPRESS = 'express',
  FASTAPI = 'fastapi',
  DJANGO = 'django',
  FLASK = 'flask',
  UNKNOWN = 'unknown'
}

/**
 * Características del proyecto detectadas
 */
export interface ProjectCharacteristics {
  type: ProjectType;
  hasPackageJson: boolean;
  hasTsConfig: boolean;
  hasPrettier: boolean;
  hasESLint: boolean;
  hasJest: boolean;
  hasWebpack: boolean;
  hasVite: boolean;
  hasCypress: boolean;
  hasDocker: boolean;
  hasGitHub: boolean;
  frameworks: string[];
  languages: string[];
  buildTools: string[];
  testingFrameworks: string[];
  hasTests: boolean;
  testCoverage: boolean;
  timestamp?: number;
}

/**
 * Quality Gates específicos por tipo de proyecto
 */
export interface QualityGateRule {
  name: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  check: (characteristics: ProjectCharacteristics) => Promise<boolean>;
  message: string;
  fix?: string;
}

/**
 * Analizador de proyectos
 */
export class ProjectAnalyzer {
  private cache = new Map<string, { characteristics: ProjectCharacteristics; timestamp: number }>();

  /**
   * Analiza un proyecto en la ruta especificada
   */
  async analyzeProject(projectPath: string): Promise<ProjectCharacteristics> {
    // Verificar cache
    const cacheKey = projectPath;
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      // Cache válido por 5 minutos
      if (Date.now() - cached.timestamp < 300000) {
        return cached.characteristics;
      }
    }

    const characteristics: ProjectCharacteristics = {
      type: ProjectType.UNKNOWN,
      hasPackageJson: false,
      hasTsConfig: false,
      hasPrettier: false,
      hasESLint: false,
      hasJest: false,
      hasWebpack: false,
      hasVite: false,
      hasCypress: false,
      hasDocker: false,
      hasGitHub: false,
      frameworks: [],
      languages: [],
      buildTools: [],
      testingFrameworks: [],
      hasTests: false,
      testCoverage: false
    };

    // Analizar archivos de configuración
    await this.analyzeConfigurationFiles(projectPath, characteristics);

    // Detectar tipo de proyecto
    characteristics.type = await this.detectProjectType(projectPath, characteristics);

    // Analizar estructura del proyecto
    await this.analyzeProjectStructure(projectPath, characteristics);

    // Cache result
    this.cache.set(cacheKey, { characteristics: { ...characteristics, timestamp: Date.now() }, timestamp: Date.now() });

    return characteristics;
  }

  /**
   * Analiza archivos de configuración del proyecto
   */
  private async analyzeConfigurationFiles(projectPath: string, characteristics: ProjectCharacteristics): Promise<void> {
    const configFiles = [
      'package.json',
      'tsconfig.json',
      'tsconfig.build.json',
      'prettier.config.js',
      'prettier.config.json',
      '.eslintrc.js',
      '.eslintrc.json',
      'jest.config.js',
      'jest.config.json',
      'webpack.config.js',
      'vite.config.js',
      'docker-compose.yml',
      'Dockerfile',
      '.github/workflows'
    ];

    for (const configFile of configFiles) {
      try {
        const configPath = join(projectPath, configFile);
        await access(configPath, constants.F_OK);
        const content = await readFile(configPath, 'utf-8');

        // Analizar contenido específico
        if (configFile === 'package.json') {
          characteristics.hasPackageJson = true;
          await this.analyzePackageJson(content, characteristics);
        } else if (configFile.includes('tsconfig')) {
          characteristics.hasTsConfig = true;
          characteristics.languages.push('TypeScript');
        } else if (configFile.includes('prettier')) {
          characteristics.hasPrettier = true;
        } else if (configFile.includes('eslint')) {
          characteristics.hasESLint = true;
        } else if (configFile.includes('jest')) {
          characteristics.hasJest = true;
          characteristics.testingFrameworks.push('Jest');
        } else if (configFile.includes('webpack')) {
          characteristics.hasWebpack = true;
          characteristics.buildTools.push('Webpack');
        } else if (configFile.includes('vite')) {
          characteristics.hasVite = true;
          characteristics.buildTools.push('Vite');
        } else if (configFile.includes('cypress')) {
          characteristics.hasCypress = true;
          characteristics.testingFrameworks.push('Cypress');
        } else if (configFile.includes('docker') || configFile === 'Dockerfile') {
          characteristics.hasDocker = true;
        } else if (configFile.includes('.github')) {
          characteristics.hasGitHub = true;
        }
      } catch {
        // Archivo no existe, continuar
      }
    }
  }

  /**
   * Analiza package.json para detectar frameworks y dependencias
   */
  private async analyzePackageJson(content: string, characteristics: ProjectCharacteristics): Promise<void> {
    try {
      const pkg = JSON.parse(content);
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };

      // Detectar frameworks
      if (deps.react) {
        characteristics.frameworks.push('React');
        characteristics.languages.push('JavaScript');
        if (!deps['react-scripts'] && !deps.next && !deps.gatsby) {
          // React sin create-react-app, Next.js o Gatsby
          characteristics.type = ProjectType.REACT;
        }
      }

      if (deps.next) {
        characteristics.frameworks.push('Next.js');
        characteristics.type = ProjectType.NEXT_JS;
        characteristics.buildTools.push('Next.js');
      }

      if (deps.vue) {
        characteristics.frameworks.push('Vue.js');
        characteristics.type = ProjectType.VUE;
        characteristics.languages.push('JavaScript');
      }

      if (deps.angular || deps['@angular/core']) {
        characteristics.frameworks.push('Angular');
        characteristics.type = ProjectType.ANGULAR;
        characteristics.languages.push('TypeScript');
      }

      if (deps.express) {
        characteristics.frameworks.push('Express.js');
        if (characteristics.type === ProjectType.UNKNOWN) {
          characteristics.type = ProjectType.EXPRESS;
        }
        characteristics.languages.push('JavaScript');
      }

      if (deps['fastify'] || deps.koa) {
        characteristics.frameworks.push('Node.js');
        if (characteristics.type === ProjectType.UNKNOWN) {
          characteristics.type = ProjectType.NODE_JS;
        }
        characteristics.languages.push('JavaScript');
      }

      // Detectar Python
      if (pkg.scripts?.install || pkg.scripts?.installPython) {
        characteristics.languages.push('Python');
      }

      // Detectar testing frameworks adicionales
      if (deps.mocha || deps.chai) {
        characteristics.testingFrameworks.push('Mocha');
      }
      if (deps.cypress) {
        characteristics.testingFrameworks.push('Cypress');
      }
      if (deps.playwright) {
        characteristics.testingFrameworks.push('Playwright');
      }

      // Detectar si tiene tests
      const hasTestScripts = pkg.scripts && Object.keys(pkg.scripts).some(script =>
        script.includes('test') || script.includes('spec')
      );
      characteristics.hasTests = hasTestScripts;

      // Detectar configuración de coverage
      if (deps.nyc || deps.c8 || pkg.jest?.coverageDirectory) {
        characteristics.testCoverage = true;
      }

    } catch (error) {
      // Error parseando package.json
    }
  }

  /**
   * Detecta el tipo principal del proyecto
   */
  private async detectProjectType(projectPath: string, characteristics: ProjectCharacteristics): Promise<ProjectType> {
    // Si ya se detectó un framework específico
    if (characteristics.type !== ProjectType.UNKNOWN) {
      return characteristics.type;
    }

    // Analizar estructura de archivos
    const srcDir = join(projectPath, 'src');
    const appDir = join(projectPath, 'app');
    const componentsDir = join(projectPath, 'components');
    const pagesDir = join(projectPath, 'pages');
    const viewsDir = join(projectPath, 'views');

    try {
      // Buscar patrones de archivos
      const files = await this.getProjectFiles(projectPath);

      // React patterns
      if (files.some(f => f.includes('.jsx') || f.includes('.tsx')) ||
          files.some(f => f.includes('components/')) ||
          files.some(f => f.includes('App.'))) {
        return ProjectType.REACT;
      }

      // Vue patterns
      if (files.some(f => f.includes('.vue')) ||
          files.some(f => f.includes('views/'))) {
        return ProjectType.VUE;
      }

      // Angular patterns
      if (files.some(f => f.includes('.component.ts')) ||
          files.some(f => f.includes('.module.ts')) ||
          files.some(f => f.includes('angular.json'))) {
        return ProjectType.ANGULAR;
      }

      // Next.js patterns
      if (files.some(f => f.includes('pages/')) ||
          files.some(f => f.includes('_app.') || f.includes('_document.'))) {
        return ProjectType.NEXT_JS;
      }

      // Node.js patterns
      if (files.some(f => f.includes('server.') || f.includes('app.'))) {
        return ProjectType.NODE_JS;
      }

      // TypeScript patterns
      if (characteristics.hasTsConfig && files.some(f => f.endsWith('.ts'))) {
        return ProjectType.TYPESCRIPT;
      }

    } catch (error) {
      // Error analizando archivos
    }

    return ProjectType.UNKNOWN;
  }

  /**
   * Analiza la estructura del proyecto
   */
  private async analyzeProjectStructure(projectPath: string, characteristics: ProjectCharacteristics): Promise<void> {
    try {
      const files = await this.getProjectFiles(projectPath);

      // Detectar lenguajes adicionales
      if (files.some(f => f.endsWith('.py'))) {
        if (!characteristics.languages.includes('Python')) {
          characteristics.languages.push('Python');
        }
      }

      if (files.some(f => f.endsWith('.go'))) {
        if (!characteristics.languages.includes('Go')) {
          characteristics.languages.push('Go');
        }
      }

      if (files.some(f => f.endsWith('.rs'))) {
        if (!characteristics.languages.includes('Rust')) {
          characteristics.languages.push('Rust');
        }
      }

      // Detectar directorios de tests
      const testDirs = ['test', 'tests', '__tests__', 'spec', 'specs'];
      characteristics.hasTests = characteristics.hasTests ||
        testDirs.some(dir => files.some(f => f.includes(dir)));

    } catch (error) {
      // Error analizando estructura
    }
  }

  /**
   * Obtiene lista de archivos del proyecto recursivamente
   */
  private async getProjectFiles(projectPath: string): Promise<string[]> {
    try {
      const result = execSync(`find "${projectPath}" -type f -name "*.json" -o -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" -o -name "*.vue" -o -name "*.py" -o -name "*.go" -o -name "*.rs" | head -100`, {
        encoding: 'utf-8',
        cwd: projectPath
      });
      return result.split('\n').filter(f => f.trim());
    } catch (error) {
      return [];
    }
  }

  /**
   * Obtiene quality gates específicas para el tipo de proyecto
   */
  getQualityGates(characteristics: ProjectCharacteristics, projectPath: string): QualityGateRule[] {
    const gates: QualityGateRule[] = [];

    // Quality gates generales
    gates.push(
      {
        name: 'package-json-required',
        description: 'Every project should have package.json',
        severity: 'error',
        check: async (c) => c.hasPackageJson,
        message: 'Missing package.json file',
        fix: 'Run npm init or yarn init'
      },
      {
        name: 'prettier-configured',
        description: 'Code formatting should be configured',
        severity: 'warning',
        check: async (c) => c.hasPrettier,
        message: 'Prettier not configured',
        fix: 'Add .prettierrc or prettier.config.js'
      }
    );

    // Quality gates específicas por tipo
    switch (characteristics.type) {
      case ProjectType.REACT:
      case ProjectType.NEXT_JS:
        gates.push(
          {
            name: 'react-hooks-required',
            description: 'React projects should use hooks',
            severity: 'warning',
            check: async (c) => this.checkFileContains(projectPath, 'useState'),
            message: 'Consider using React hooks for state management',
            fix: 'Import useState from react'
          },
          {
            name: 'typescript-for-react',
            description: 'React projects should use TypeScript',
            severity: 'warning',
            check: async (c) => c.hasTsConfig,
            message: 'TypeScript not configured for React project',
            fix: 'Add tsconfig.json and use .tsx files'
          }
        );
        break;

      case ProjectType.NODE_JS:
      case ProjectType.EXPRESS:
        gates.push(
          {
            name: 'node-version-specified',
            description: 'Node.js version should be specified',
            severity: 'warning',
            check: async (c) => this.checkFileContains(projectPath, 'engines'),
            message: 'Node.js version not specified in package.json',
            fix: 'Add engines field to package.json'
          }
        );
        break;

      case ProjectType.VUE:
        gates.push(
          {
            name: 'vue-typescript',
            description: 'Vue projects should use TypeScript',
            severity: 'warning',
            check: async (c) => c.hasTsConfig,
            message: 'TypeScript not configured for Vue project',
            fix: 'Add tsconfig.json for Vue + TypeScript'
          }
        );
        break;

      case ProjectType.TYPESCRIPT:
        gates.push(
          {
            name: 'strict-typescript',
            description: 'TypeScript strict mode should be enabled',
            severity: 'warning',
            check: async (c) => this.checkFileContains(projectPath, '"strict": true'),
            message: 'TypeScript strict mode not enabled',
            fix: 'Set "strict": true in tsconfig.json'
          }
        );
        break;
    }

    // Testing gates
    if (!characteristics.hasTests) {
      gates.push({
        name: 'tests-required',
        description: 'Projects should have tests',
        severity: 'warning',
        check: async () => false,
        message: 'No tests found in project',
        fix: 'Add test files and test scripts to package.json'
      });
    }

    return gates;
  }

  /**
   * Verifica si un archivo contiene texto específico
   */
  private async checkFileContains(projectPath: string, searchText: string): Promise<boolean> {
    try {
      const files = await this.getProjectFiles(projectPath);
      for (const file of files.slice(0, 20)) { // Limitar a primeros 20 archivos
        try {
          const content = await readFile(join(projectPath, file), 'utf-8');
          if (content.includes(searchText)) {
            return true;
          }
        } catch {
          // Continue con otros archivos
        }
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Limpia cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

/**
 * Instancia global del analizador
 */
export const projectAnalyzer = new ProjectAnalyzer();