/**
 * Portable Skill Packager
 *
 * Sistema para empaquetar y distribuir skills de forma portable,
 * desacoplada del monorepo original.
 *
 * @version 1.0.0
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname, basename, extname } from 'path';
import { createHash } from 'crypto';
import { execSync } from 'child_process';
import { ProjectInfo } from '../project-detector.js';

export interface PortableSkill {
  id: string;
  name: string;
  version: string;
  description: string;
  type: 'guideline' | 'guardrail' | 'workflow' | 'generator' | 'testing';
  audience: string[];
  when_to_use: string;
  keywords: string[];
  patterns: string[];
  filePatterns?: string[];
  context?: string[];
  priority: number;
  enabled: boolean;
  metadata: SkillMetadata;
  resources?: SkillResource[];
  scripts?: SkillScript[];
  dependencies?: string[];
  compatibility: SkillCompatibility;
}

export interface SkillMetadata {
  author: string;
  createdAt: string;
  updatedAt: string;
  category: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  estimatedTime: string;
  prerequisites?: string[];
  outcomes?: string[];
}

export interface SkillResource {
  name: string;
  type: 'markdown' | 'code' | 'config' | 'template';
  path: string;
  description?: string;
  required: boolean;
}

export interface SkillScript {
  name: string;
  description: string;
  run: string;
  timeout?: number;
  required?: boolean;
}

export interface SkillCompatibility {
  languages: string[];
  frameworks: string[];
  platforms: string[];
  minVersion?: string;
  maxVersion?: string;
  conflicts?: string[];
}

export interface SkillPackage {
  skill: PortableSkill;
  files: Map<string, Buffer>;
  checksum: string;
  compressed: boolean;
  createdAt: string;
}

export class SkillPackager {
  private static readonly SKILL_EXTENSION = '.skill';
  private static readonly MANIFEST_FILENAME = 'skill.json';
  private static readonly DEFAULT_ENCODING = 'utf-8';

  /**
   * Crea un skill portable desde un path local
   */
  static async createPortableSkill(skillPath: string): Promise<SkillPackage> {
    console.log(`📦 Creating portable skill from: ${skillPath}`);

    // Validar path
    if (!existsSync(skillPath)) {
      throw new Error(`Skill path does not exist: ${skillPath}`);
    }

    // Detectar si es un archivo o directorio
    const stats = require('fs').statSync(skillPath);
    const isDirectory = stats.isDirectory();

    let portableSkill: PortableSkill;
    const files = new Map<string, Buffer>();

    if (isDirectory) {
      // Es un directorio de skill
      portableSkill = await this.parseSkillDirectory(skillPath);
      await this.collectSkillFiles(skillPath, files);
    } else {
      // Es un archivo de skill individual
      portableSkill = await this.parseSkillFile(skillPath);
      const content = readFileSync(skillPath);
      files.set(basename(skillPath), content);
    }

    // Generar checksum
    const checksum = this.generateChecksum(files);

    // Crear paquete
    const skillPackage: SkillPackage = {
      skill: portableSkill,
      files,
      checksum,
      compressed: false,
      createdAt: new Date().toISOString()
    };

    console.log(`✅ Portable skill created: ${portableSkill.id} v${portableSkill.version}`);
    return skillPackage;
  }

  /**
   * Empaqueta un skill para distribución
   */
  static async packageSkill(skillPackage: SkillPackage, outputPath: string): Promise<string> {
    const fileName = `${skillPackage.skill.id}-${skillPackage.skill.version}${this.SKILL_EXTENSION}`;
    const filePath = join(outputPath, fileName);

    // Crear directorio si no existe
    if (!existsSync(outputPath)) {
      mkdirSync(outputPath, { recursive: true });
    }

    // Crear archivo comprimido
    const content = this.serializePackage(skillPackage);
    writeFileSync(filePath, content);

    console.log(`📦 Skill packaged: ${filePath}`);
    return filePath;
  }

  /**
   * Desempaqueta un skill portable
   */
  static async unpackageSkill(packagePath: string, targetPath: string): Promise<PortableSkill> {
    console.log(`📦 Unpackaging skill from: ${packagePath}`);

    if (!existsSync(packagePath)) {
      throw new Error(`Package file does not exist: ${packagePath}`);
    }

    // Leer y deserializar
    const content = readFileSync(packagePath);
    const skillPackage = this.deserializePackage(content);

    // Validar checksum
    const currentChecksum = this.generateChecksum(skillPackage.files);
    if (currentChecksum !== skillPackage.checksum) {
      throw new Error('Package checksum validation failed');
    }

    // Extraer archivos
    await this.extractSkillFiles(skillPackage.files, targetPath);

    console.log(`✅ Skill un-packaged: ${skillPackage.skill.id}`);
    return skillPackage.skill;
  }

  /**
   * Instala un skill en un proyecto
   */
  static async installSkill(
    packagePath: string,
    projectPath: string,
    options: { force?: boolean; enable?: boolean } = {}
  ): Promise<void> {
    const skillsDir = join(projectPath, '.skills-fabrik', 'skills');
    const packageName = basename(packagePath);
    if (!packageName) {
      throw new Error('Invalid package path');
    }
    const skillId = packageName.replace(this.SKILL_EXTENSION, '').split('-')[0];
    if (!skillId) {
      throw new Error('Invalid skill ID');
    }

    // Verificar si ya existe
    const existingSkillPath = join(skillsDir, skillId);
    if (existsSync(existingSkillPath) && !options.force) {
      throw new Error(`Skill ${skillId} is already installed. Use --force to overwrite.`);
    }

    // Crear directorio de skills si no existe
    if (!existsSync(skillsDir)) {
      mkdirSync(skillsDir, { recursive: true });
    }

    // Desempaquetar skill
    const skill = await this.unpackageSkill(packagePath, existingSkillPath);

    // Actualizar registro de skills
    await this.updateSkillRegistry(projectPath, skill, options.enable ?? true);

    console.log(`✅ Skill ${skillId} installed successfully`);
  }

  /**
   * Analiza el contexto para determinar skills relevantes
   */
  static async analyzeContextForSkills(
    projectPath: string,
    projectInfo: ProjectInfo
  ): Promise<string[]> {
    console.log('🔍 Analyzing project context for relevant skills...');

    const relevantSkills: string[] = [];

    // Skills basadas en tipo de proyecto
    const typeBasedSkills = this.getSkillsByProjectType(projectInfo.type);
    relevantSkills.push(...typeBasedSkills);

    // Skills basadas en lenguaje
    const languageBasedSkills = this.getSkillsByLanguage(projectInfo.language);
    relevantSkills.push(...languageBasedSkills);

    // Skills basadas en framework
    if (projectInfo.framework) {
      const frameworkBasedSkills = this.getSkillsByFramework(projectInfo.framework);
      relevantSkills.push(...frameworkBasedSkills);
    }

    // Skills basadas en archivos del proyecto
    const fileBasedSkills = await this.getSkillsByFiles(projectPath);
    relevantSkills.push(...fileBasedSkills);

    // Remover duplicados y ordenar por prioridad
    const uniqueSkills = [...new Set(relevantSkills)];
    const prioritizedSkills = this.prioritizeSkills(uniqueSkills, projectInfo);

    console.log(`✅ Found ${prioritizedSkills.length} relevant skills`);
    return prioritizedSkills;
  }

  /**
   * Crea un bundle de skills para un proyecto
   */
  static async createSkillBundle(
    projectPath: string,
    projectInfo: ProjectInfo,
    outputPath: string
  ): Promise<string> {
    console.log('📦 Creating project-specific skill bundle...');

    // Analizar contexto
    const relevantSkillIds = await this.analyzeContextForSkills(projectPath, projectInfo);

    // Crear bundle metadata
    const bundle = {
      id: `bundle-${projectInfo.type}-${Date.now()}`,
      name: `${projectInfo.type} Skills Bundle`,
      version: '1.0.0',
      description: `Skills optimized for ${projectInfo.type} projects`,
      projectType: projectInfo.type,
      language: projectInfo.language,
      framework: projectInfo.framework,
      skills: relevantSkillIds,
      createdAt: new Date().toISOString()
    };

    // Guardar bundle
    const bundlePath = join(outputPath, `${bundle.id}.json`);
    if (!existsSync(outputPath)) {
      mkdirSync(outputPath, { recursive: true });
    }

    writeFileSync(bundlePath, JSON.stringify(bundle, null, 2));

    console.log(`✅ Skill bundle created: ${bundlePath}`);
    return bundlePath;
  }

  // --- Métodos Privados ---

  /**
   * Parsea un directorio de skill
   */
  private static async parseSkillDirectory(skillPath: string): Promise<PortableSkill> {
    const manifestPath = join(skillPath, this.MANIFEST_FILENAME);

    if (!existsSync(manifestPath)) {
      throw new Error(`Skill manifest not found: ${manifestPath}`);
    }

    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    return this.validateAndNormalizeSkill(manifest);
  }

  /**
   * Parsea un archivo de skill individual
   */
  private static async parseSkillFile(skillPath: string): Promise<PortableSkill> {
    const content = readFileSync(skillPath, 'utf-8');
    const frontmatter = this.extractFrontmatter(content);

    if (!frontmatter) {
      throw new Error(`Skill file missing frontmatter: ${skillPath}`);
    }

    return this.validateAndNormalizeSkill(frontmatter);
  }

  /**
   * Extrae frontmatter de un archivo markdown
   */
  private static extractFrontmatter(content: string): any {
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);

    if (!match) {
      return null;
    }

    try {
      const frontmatter = match[1];
      if (frontmatter) {
        return JSON.parse(frontmatter);
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Valida y normaliza un skill
   */
  private static validateAndNormalizeSkill(skill: any): PortableSkill {
    const defaults = {
      version: '1.0.0',
      type: 'guideline',
      audience: ['developers'],
      keywords: [],
      patterns: [],
      priority: 5,
      enabled: true,
      dependencies: [],
      compatibility: {
        languages: ['javascript', 'typescript'],
        frameworks: [],
        platforms: ['node', 'browser']
      }
    };

    const normalized = { ...defaults, ...skill };

    // Validar campos requeridos
    const required = ['id', 'name', 'description', 'when_to_use'];
    for (const field of required) {
      if (!normalized[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Generar metadata si no existe
    if (!normalized.metadata) {
      normalized.metadata = {
        author: 'Skills Fabric',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        category: normalized.type,
        tags: normalized.keywords,
        difficulty: 'intermediate',
        estimatedTime: '15-30 minutes'
      };
    }

    return normalized as PortableSkill;
  }

  /**
   * Colecta archivos de un skill
   */
  private static async collectSkillFiles(skillPath: string, files: Map<string, Buffer>): Promise<void> {
    const collectFiles = (dir: string, baseDir: string = '') => {
      const items = require('fs').readdirSync(dir);

      for (const item of items) {
        const fullPath = join(dir, item);
        const relativePath = baseDir ? join(baseDir, item) : item;
        const stats = require('fs').statSync(fullPath);

        if (stats.isDirectory()) {
          collectFiles(fullPath, relativePath);
        } else {
          const content = readFileSync(fullPath);
          files.set(relativePath, content);
        }
      }
    };

    collectFiles(skillPath);
  }

  /**
   * Extrae archivos de un skill
   */
  private static async extractSkillFiles(files: Map<string, Buffer>, targetPath: string): Promise<void> {
    if (!existsSync(targetPath)) {
      mkdirSync(targetPath, { recursive: true });
    }

    for (const [relativePath, content] of files) {
      const fullPath = join(targetPath, relativePath);
      const dir = dirname(fullPath);

      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      writeFileSync(fullPath, content);
    }
  }

  /**
   * Genera checksum de archivos
   */
  private static generateChecksum(files: Map<string, Buffer>): string {
    const hash = createHash('sha256');

    // Ordenar archivos por nombre para consistencia
    const sortedFiles = Array.from(files.entries()).sort(([a], [b]) => a.localeCompare(b));

    for (const [fileName, content] of sortedFiles) {
      hash.update(fileName);
      hash.update(content);
    }

    return hash.digest('hex');
  }

  /**
   * Serializa un paquete de skill
   */
  private static serializePackage(skillPackage: SkillPackage): Buffer {
    const data = {
      skill: skillPackage.skill,
      files: Object.fromEntries(skillPackage.files),
      checksum: skillPackage.checksum,
      compressed: skillPackage.compressed,
      createdAt: skillPackage.createdAt
    };

    return Buffer.from(JSON.stringify(data), 'utf-8');
  }

  /**
   * Deserializa un paquete de skill
   */
  private static deserializePackage(content: Buffer): SkillPackage {
    const data = JSON.parse(content.toString('utf-8'));
    const files = new Map<string, Buffer>();

    for (const [fileName, fileContent] of Object.entries(data.files)) {
      files.set(fileName, Buffer.from(fileContent as string, 'base64'));
    }

    return {
      ...data,
      files
    } as SkillPackage;
  }

  /**
   * Actualiza el registro de skills del proyecto
   */
  private static async updateSkillRegistry(projectPath: string, skill: PortableSkill, enabled: boolean): Promise<void> {
    const registryPath = join(projectPath, '.skills-fabrik', 'registry.json');
    let registry: { skills: any[] } = { skills: [] };

    if (existsSync(registryPath)) {
      registry = JSON.parse(readFileSync(registryPath, 'utf-8'));
      if (!Array.isArray(registry.skills)) {
        registry.skills = [];
      }
    }

    // Agregar o actualizar skill
    const existingIndex = registry.skills.findIndex((s: any) => s.id === skill.id);
    const skillEntry = {
      id: skill.id,
      name: skill.name,
      version: skill.version,
      type: skill.type,
      enabled,
      keywords: skill.keywords,
      patterns: skill.patterns,
      priority: skill.priority,
      compatibility: skill.compatibility,
      installedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      registry.skills[existingIndex] = skillEntry;
    } else {
      registry.skills.push(skillEntry);
    }

    writeFileSync(registryPath, JSON.stringify(registry, null, 2));
  }

  /**
   * Obtiene skills por tipo de proyecto
   */
  private static getSkillsByProjectType(projectType: string): string[] {
    const skillsByType: Record<string, string[]> = {
      react: ['react-patterns', 'component-testing', 'hooks-optimization', 'state-management'],
      vue: ['vue-patterns', 'vue-testing', 'composition-api'],
      angular: ['angular-patterns', 'angular-testing', 'rxjs-patterns'],
      nodejs: ['api-design', 'express-patterns', 'database-design', 'authentication'],
      python: ['python-patterns', 'testing-best-practices', 'django-patterns', 'fastapi-patterns']
    };

    return skillsByType[projectType] || [];
  }

  /**
   * Obtiene skills por lenguaje
   */
  private static getSkillsByLanguage(language: string): string[] {
    const skillsByLanguage: Record<string, string[]> = {
      TypeScript: ['typescript-patterns', 'type-safety', 'generic-patterns'],
      JavaScript: ['javascript-patterns', 'es6-features', 'async-patterns'],
      Python: ['python-patterns', 'pep8-compliance', 'pythonic-code'],
      Go: ['go-patterns', 'concurrency-patterns', 'error-handling']
    };

    return skillsByLanguage[language] || [];
  }

  /**
   * Obtiene skills por framework
   */
  private static getSkillsByFramework(framework: string): string[] {
    const skillsByFramework: Record<string, string[]> = {
      React: ['react-hooks', 'jsx-patterns', 'component-lifecycle'],
      Express: ['express-middleware', 'routing-patterns', 'error-handling'],
      Django: ['django-orm', 'class-based-views', 'django-forms'],
      FastAPI: ['fastapi-dependency', 'pydantic-models', 'async-patterns']
    };

    return skillsByFramework[framework] || [];
  }

  /**
   * Obtiene skills basadas en archivos del proyecto
   */
  private static async getSkillsByFiles(projectPath: string): Promise<string[]> {
    const skills: string[] = [];

    // Analizar archivos para detectar patrones
    // Esto es una implementación simplificada
    try {
      const files = require('fs').readdirSync(projectPath, { withFileTypes: true });

      for (const file of files) {
        if (file.isFile()) {
          const content = readFileSync(join(projectPath, file.name), 'utf-8');

          // Detectar patrones específicos
          if (content.includes('docker') || file.name.includes('Dockerfile')) {
            skills.push('docker-patterns', 'containerization');
          }
          if (content.includes('.github') || file.name.includes('ci')) {
            skills.push('ci-cd-patterns', 'github-actions');
          }
          if (content.includes('test') || file.name.includes('spec')) {
            skills.push('testing-patterns', 'tdd-patterns');
          }
        }
      }
    } catch {
      // Error al leer archivos, continuar sin file-based skills
    }

    return skills;
  }

  /**
   * Prioritiza skills basadas en el contexto del proyecto
   */
  private static prioritizeSkills(skills: string[], projectInfo: ProjectInfo): string[] {
    // Implementación simple de priorización
    // En una versión real, esto sería más sofisticado

    const priorityMap: Record<string, number> = {
      'code-quality': 1,
      'security': 0,
      'testing': 2,
      'performance': 1
    };

    return skills.sort((a, b) => {
      const aPriority = priorityMap[a] || 5;
      const bPriority = priorityMap[b] || 5;
      return aPriority - bPriority;
    });
  }
}

// Exportar funciones de conveniencia
export async function createPortableSkill(skillPath: string): Promise<SkillPackage> {
  return await SkillPackager.createPortableSkill(skillPath);
}

export async function installSkill(packagePath: string, projectPath: string): Promise<void> {
  return await SkillPackager.installSkill(packagePath, projectPath);
}

export async function analyzeProjectSkills(projectPath: string, projectInfo: ProjectInfo): Promise<string[]> {
  return await SkillPackager.analyzeContextForSkills(projectPath, projectInfo);
}