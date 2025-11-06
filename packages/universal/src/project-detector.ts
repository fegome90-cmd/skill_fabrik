/**
 * Universal Project Detector
 *
 * Detecta automáticamente el tipo de proyecto y configura Skills Fabric
 * de acuerdo a las características específicas del proyecto.
 *
 * @version 1.0.0
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface ProjectInfo {
  type: ProjectType;
  framework?: string | undefined;
  language: string;
  packageManager: 'npm' | 'pnpm' | 'yarn' | 'unknown';
  buildTool: string;
  testFramework: string[];
  hasTypeScript: boolean;
  skillsPath: string;
  configPath: string;
  relevanceScore: number;
  recommendedSkills: string[];
}

export type ProjectType =
  | 'react'
  | 'vue'
  | 'angular'
  | 'nodejs'
  | 'python'
  | 'django'
  | 'flask'
  | 'fastapi'
  | 'go'
  | 'rust'
  | 'java'
  | 'maven'
  | 'gradle'
  | 'docker'
  | 'terraform'
  | 'unknown';

export class ProjectDetector {
  private static readonly PATTERNS = {
    // Frontend Frameworks
    react: {
      files: ['package.json', 'src/App.{js,jsx,ts,tsx}'],
      dependencies: ['react', 'react-dom'],
      devDependencies: ['@types/react', 'vite', 'webpack'],
      directories: ['src'],
      patterns: [/import React/, /export.*App/]
    },

    vue: {
      files: ['package.json', 'src/App.vue', 'vue.config.js'],
      dependencies: ['vue'],
      devDependencies: ['@vue/cli-service', 'vite'],
      directories: ['src'],
      patterns: [/import.*vue/, /<template>/]
    },

    angular: {
      files: ['angular.json', 'package.json', 'src/app/app.module.ts'],
      dependencies: ['@angular/core'],
      devDependencies: ['@angular/cli'],
      directories: ['src/app'],
      patterns: [/@NgModule/, /@Component/]
    },

    // Backend Frameworks
    nodejs: {
      files: ['package.json', 'server.js', 'app.js', 'index.js'],
      dependencies: ['express', 'fastify', 'koa'],
      directories: ['src', 'lib'],
      patterns: [/app\.listen/, /express\(\)/]
    },

    python: {
      files: ['requirements.txt', 'setup.py', 'pyproject.toml', 'Pipfile'],
      directories: ['src', 'app'],
      patterns: [/import flask/, /import django/, /from fastapi/]
    },

    django: {
      files: ['manage.py', 'requirements.txt', 'settings.py'],
      directories: [],
      patterns: [/django\.setup/, /DJANGO_SETTINGS_MODULE/]
    },

    flask: {
      files: ['app.py', 'requirements.txt', 'wsgi.py'],
      directories: [],
      patterns: [/from flask import/, /Flask\(__name__/]
    },

    fastapi: {
      files: ['main.py', 'requirements.txt', 'pyproject.toml'],
      directories: [],
      patterns: [/from fastapi import/, /FastAPI\(/]
    },

    // Other Languages
    go: {
      files: ['go.mod', 'main.go'],
      directories: [],
      patterns: [/package main/, /func main/]
    },

    rust: {
      files: ['Cargo.toml', 'src/main.rs'],
      directories: ['src'],
      patterns: [/fn main/, /use std::/]
    },

    java: {
      files: ['pom.xml', 'build.gradle', 'src/main/java'],
      directories: ['src/main/java'],
      patterns: [/public class/, /package /]
    },

    // Infrastructure
    docker: {
      files: ['Dockerfile', 'docker-compose.yml', 'docker-compose.yaml'],
      directories: [],
      patterns: [/FROM/, /docker-compose/]
    },

    terraform: {
      files: ['main.tf', 'variables.tf', 'outputs.tf'],
      directories: [],
      patterns: [/resource "/, /variable "/]
    }
  };

  /**
   * Analiza un directorio de proyecto y devuelve información detallada
   */
  static async analyzeProject(projectPath: string): Promise<ProjectInfo> {
    const packageManager = this.detectPackageManager(projectPath);
    const hasTypeScript = this.detectTypeScript(projectPath);
    const language = this.detectLanguage(projectPath);
    const projectType = await this.detectProjectType(projectPath);
    const framework = this.detectFramework(projectPath, projectType);
    const buildTool = this.detectBuildTool(projectPath, projectType);
    const testFramework = this.detectTestFramework(projectPath);

    // Calcular paths relativos al proyecto
    const skillsPath = this.generateSkillsPath(projectPath, projectType);
    const configPath = this.generateConfigPath(projectPath);

    // Calcular relevancia y skills recomendadas
    const relevanceScore = this.calculateRelevanceScore(projectType, language, framework);
    const recommendedSkills = this.getRecommendedSkills(projectType, framework, language);

    return {
      type: projectType,
      framework,
      language,
      packageManager,
      buildTool,
      testFramework,
      hasTypeScript,
      skillsPath,
      configPath,
      relevanceScore,
      recommendedSkills
    };
  }

  /**
   * Detecta el tipo principal del proyecto
   */
  private static async detectProjectType(projectPath: string): Promise<ProjectType> {
    const scores: Record<ProjectType, number> = {} as any;

    for (const [type, config] of Object.entries(this.PATTERNS)) {
      scores[type as ProjectType] = this.calculateTypeScore(projectPath, config);
    }

    // Encontrar el tipo con mayor score
    let maxScore = 0;
    let detectedType: ProjectType = 'unknown';

    for (const [type, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        detectedType = type as ProjectType;
      }
    }

    // Si el score es muy bajo, considerar unknown
    return maxScore > 2 ? detectedType : 'unknown';
  }

  /**
   * Calcula el score para un tipo de proyecto específico
   */
  private static calculateTypeScore(projectPath: string, config: any): number {
    let score = 0;

    // Verificar archivos clave
    for (const file of config.files) {
      if (this.fileExists(projectPath, file)) {
        score += 2;
      }
    }

    // Verificar directorios
    for (const dir of config.directories) {
      if (this.directoryExists(projectPath, dir)) {
        score += 1;
      }
    }

    // Verificar patrones en archivos principales
    if (config.patterns) {
      for (const pattern of config.patterns) {
        if (this.searchInFiles(projectPath, pattern)) {
          score += 1;
        }
      }
    }

    return score;
  }

  /**
   * Detecta el lenguaje de programación principal
   */
  private static detectLanguage(projectPath: string): string {
    const extensions = this.countFileExtensions(projectPath);

    const extensionMap: Record<string, string> = {
      '.ts': 'TypeScript',
      '.tsx': 'TypeScript',
      '.js': 'JavaScript',
      '.jsx': 'JavaScript',
      '.py': 'Python',
      '.go': 'Go',
      '.rs': 'Rust',
      '.java': 'Java',
      '.kt': 'Kotlin',
      '.cs': 'C#',
      '.cpp': 'C++',
      '.c': 'C',
      '.rb': 'Ruby',
      '.php': 'PHP'
    };

    let maxCount = 0;
    let detectedLanguage = 'Unknown';

    for (const [ext, language] of Object.entries(extensionMap)) {
      const count = extensions[ext] || 0;
      if (count > maxCount) {
        maxCount = count;
        detectedLanguage = language;
      }
    }

    return detectedLanguage;
  }

  /**
   * Detecta el gestor de paquetes
   */
  private static detectPackageManager(projectPath: string): 'npm' | 'pnpm' | 'yarn' | 'unknown' {
    if (this.fileExists(projectPath, 'pnpm-lock.yaml')) return 'pnpm';
    if (this.fileExists(projectPath, 'yarn.lock')) return 'yarn';
    if (this.fileExists(projectPath, 'package-lock.json')) return 'npm';
    if (this.fileExists(projectPath, 'package.json')) return 'npm';

    return 'unknown';
  }

  /**
   * Detecta si el proyecto usa TypeScript
   */
  private static detectTypeScript(projectPath: string): boolean {
    const extensions = this.countFileExtensions(projectPath);
    return (
      this.fileExists(projectPath, 'tsconfig.json') ||
      (extensions['.ts'] || 0) > 0 ||
      (extensions['.tsx'] || 0) > 0
    );
  }

  /**
   * Detecta el framework específico
   */
  private static detectFramework(projectPath: string, projectType: ProjectType): string | undefined {
    if (projectType === 'nodejs') {
      const packageJson = this.readPackageJson(projectPath);
      if (packageJson?.dependencies) {
        if (packageJson.dependencies.express) return 'Express';
        if (packageJson.dependencies.fastify) return 'Fastify';
        if (packageJson.dependencies.koa) return 'Koa';
        if (packageJson.dependencies.nest) return 'NestJS';
      }
    }

    if (projectType === 'python') {
      const requirements = this.readRequirements(projectPath);
      if (requirements?.includes('django')) return 'Django';
      if (requirements?.includes('flask')) return 'Flask';
      if (requirements?.includes('fastapi')) return 'FastAPI';
    }

    return undefined;
  }

  /**
   * Detecta la herramienta de build
   */
  private static detectBuildTool(projectPath: string, projectType: ProjectType): string {
    const packageJson = this.readPackageJson(projectPath);

    if (packageJson?.devDependencies) {
      if (packageJson.devDependencies.vite) return 'Vite';
      if (packageJson.devDependencies.webpack) return 'Webpack';
      if (packageJson.devDependencies.parcel) return 'Parcel';
      if (packageJson.devDependencies.rollup) return 'Rollup';
    }

    if (projectType === 'angular') return 'Angular CLI';
    if (projectType === 'java') {
      if (this.fileExists(projectPath, 'pom.xml')) return 'Maven';
      if (this.fileExists(projectPath, 'build.gradle')) return 'Gradle';
    }

    return 'Unknown';
  }

  /**
   * Detecta frameworks de testing
   */
  private static detectTestFramework(projectPath: string): string[] {
    const packageJson = this.readPackageJson(projectPath);
    const frameworks: string[] = [];

    if (packageJson?.devDependencies) {
      const deps = packageJson.devDependencies;
      if (deps.jest) frameworks.push('Jest');
      if (deps.vitest) frameworks.push('Vitest');
      if (deps.mocha) frameworks.push('Mocha');
      if (deps['@testing-library/react']) frameworks.push('Testing Library');
      if (deps.cypress) frameworks.push('Cypress');
      if (deps.playwright) frameworks.push('Playwright');
      if (deps.pytest) frameworks.push('Pytest');
      if (deps.unittest) frameworks.push('Unittest');
    }

    return frameworks;
  }

  /**
   * Genera el path para el directorio de skills
   */
  private static generateSkillsPath(projectPath: string, projectType: ProjectType): string {
    return join(projectPath, '.skills-fabrik', 'skills');
  }

  /**
   * Genera el path para el archivo de configuración
   */
  private static generateConfigPath(projectPath: string): string {
    return join(projectPath, '.skills-fabrik', 'config.json');
  }

  /**
   * Calcula el score de relevancia para el proyecto
   */
  private static calculateRelevanceScore(
    projectType: ProjectType,
    language: string,
    framework?: string
  ): number {
    let score = 50; // Base score

    // Proyectos web modernos tienen mayor relevancia
    if (['react', 'vue', 'angular'].includes(projectType)) score += 30;
    if (['nodejs', 'python'].includes(projectType)) score += 25;

    // TypeScript aumenta la relevancia
    if (language === 'TypeScript') score += 15;

    // Frameworks específicos aumentan score
    if (framework) score += 10;

    return Math.min(score, 100);
  }

  /**
   * Obtiene las skills recomendadas para el proyecto
   */
  private static getRecommendedSkills(
    projectType: ProjectType,
    framework?: string,
    language?: string
  ): string[] {
    const skills: string[] = [];

    // Skills universales
    skills.push('code-quality', 'security-testing', 'performance-optimization');

    // Skills por tipo de proyecto
    switch (projectType) {
      case 'react':
        skills.push('react-patterns', 'component-testing', 'state-management');
        break;
      case 'vue':
        skills.push('vue-patterns', 'vue-testing', 'composition-api');
        break;
      case 'angular':
        skills.push('angular-patterns', 'angular-testing', 'rxjs-patterns');
        break;
      case 'nodejs':
        skills.push('api-design', 'express-patterns', 'database-design');
        if (framework === 'NestJS') skills.push('nestjs-patterns');
        break;
      case 'python':
        skills.push('python-patterns', 'testing-best-practices');
        if (framework === 'Django') skills.push('django-patterns');
        if (framework === 'FastAPI') skills.push('fastapi-patterns');
        break;
    }

    // Skills por lenguaje
    if (language === 'TypeScript') {
      skills.push('typescript-patterns', 'type-safety');
    }

    return skills;
  }

  // --- Utilidades ---

  private static fileExists(projectPath: string, file: string): boolean {
    const filePath = join(projectPath, file);
    return existsSync(filePath) && statSync(filePath).isFile();
  }

  private static directoryExists(projectPath: string, dir: string): boolean {
    const dirPath = join(projectPath, dir);
    return existsSync(dirPath) && statSync(dirPath).isDirectory();
  }

  private static readPackageJson(projectPath: string): any {
    try {
      const content = readFileSync(join(projectPath, 'package.json'), 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  private static readRequirements(projectPath: string): string[] | null {
    try {
      const content = readFileSync(join(projectPath, 'requirements.txt'), 'utf-8');
      return content.split('\n').map(line => line.trim()).filter(Boolean);
    } catch {
      return null;
    }
  }

  private static countFileExtensions(projectPath: string): Record<string, number> {
    const extensions: Record<string, number> = {};

    try {
      const files = this.getAllFiles(projectPath);

      for (const file of files) {
        const ext = file.substring(file.lastIndexOf('.'));
        if (ext) {
          extensions[ext] = (extensions[ext] || 0) + 1;
        }
      }
    } catch {
      // Error al leer archivos, devolver objeto vacío
    }

    return extensions;
  }

  private static getAllFiles(dir: string): string[] {
    const files: string[] = [];

    try {
      const items = readdirSync(dir);

      for (const item of items) {
        const fullPath = join(dir, item);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
          // Ignorar directorios comunes que no son relevantes
          if (!['node_modules', '.git', '.vscode', '.cursor', 'dist', 'build'].includes(item)) {
            files.push(...this.getAllFiles(fullPath));
          }
        } else {
          files.push(fullPath);
        }
      }
    } catch {
      // Error al leer directorio
    }

    return files;
  }

  private static searchInFiles(projectPath: string, pattern: RegExp): boolean {
    try {
      const files = this.getAllFiles(projectPath);

      for (const file of files) {
        // Solo buscar en archivos de texto relevantes
        if (this.isTextFile(file)) {
          try {
            const content = readFileSync(file, 'utf-8');
            if (pattern.test(content)) {
              return true;
            }
          } catch {
            // No se puede leer el archivo, continuar
          }
        }
      }
    } catch {
      // Error al leer directorio
    }

    return false;
  }

  private static isTextFile(filePath: string): boolean {
    const textExtensions = [
      '.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.txt', '.yml', '.yaml',
      '.py', '.go', '.rs', '.java', '.html', '.css', '.scss', '.less',
      '.vue', '.svelte', '.xml', '.sh', '.sql', '.env', '.toml', '.cfg'
    ];

    const ext = filePath.substring(filePath.lastIndexOf('.'));
    return textExtensions.includes(ext);
  }
}

// Exportar función principal para uso fácil
export async function detectProject(projectPath: string = process.cwd()): Promise<ProjectInfo> {
  return await ProjectDetector.analyzeProject(projectPath);
}