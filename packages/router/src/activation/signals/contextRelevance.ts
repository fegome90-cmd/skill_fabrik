import { type ScoreInput, type Signal } from '../types.js';

export interface ProjectContext {
  type: 'frontend' | 'backend' | 'fullstack' | 'mobile' | 'desktop' | 'cli' | 'library' | 'unknown';
  stack: string[]; // e.g., ['react', 'node', 'typescript']
  framework: string[]; // e.g., ['express', 'nextjs', 'django']
  packageManager: string; // 'npm', 'yarn', 'pnpm', 'pip', 'cargo', etc.
  buildTools: string[]; // e.g., ['webpack', 'vite', 'gradle', 'maven']
  testingFramework: string[]; // e.g., ['jest', 'mocha', 'pytest', 'junit']
  deployment: string[]; // e.g., ['docker', 'kubernetes', 'vercel', 'heroku']
}

export interface ContextPattern {
  name: string;
  patterns: {
    files: string[]; // glob patterns
    dependencies: string[]; // package names
    scripts: string[]; // npm scripts
    config: string[]; // config files or patterns
    keywords: string[]; // general keywords
  };
  weight: number;
  contexts: string[]; // contexts where this pattern is relevant
}

export interface ContextConfig {
  patterns: ContextPattern[];
  cacheSize: number;
  analysisDepth: {
    maxFiles: number;
    maxFileSize: number;
    maxDependencies: number;
  };
}

export class ContextRelevanceSignal implements Signal {
  name = 'contextRelevance';
  private readonly config: ContextConfig;
  private readonly cache: Map<string, number> = new Map();

  constructor(config?: Partial<ContextConfig>) {
    this.config = {
      patterns: this.createDefaultPatterns(),
      cacheSize: 100,
      analysisDepth: {
        maxFiles: 50,
        maxFileSize: 1024 * 1024, // 1MB
        maxDependencies: 200
      },
      ...config
    };
  }

  async score({ context, skillName }: ScoreInput): Promise<number> {
    const projectContext = await this.analyzeProjectContext(context);
    const cacheKey = `${skillName}:${JSON.stringify(projectContext)}`;

    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const relevanceScore = this.calculateRelevance(projectContext, skillName);

    // Update cache with LRU eviction
    if (this.cache.size >= this.config.cacheSize) {
      const firstKey = this.cache.keys().next().value as string | undefined;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(cacheKey, relevanceScore);

    return relevanceScore;
  }

  private async analyzeProjectContext(context?: any): Promise<ProjectContext> {
    const projectType = this.detectProjectType(context);
    const stack = this.detectStack(context);
    const framework = this.detectFramework(context);
    const packageManager = this.detectPackageManager(context);
    const buildTools = this.detectBuildTools(context);
    const testingFramework = this.detectTestingFramework(context);
    const deployment = this.detectDeployment(context);

    return {
      type: projectType,
      stack,
      framework,
      packageManager,
      buildTools,
      testingFramework,
      deployment
    };
  }

  private detectProjectType(context?: any): ProjectContext['type'] {
    const currentFile = context?.currentFile || '';
    const openFiles = context?.openFiles || [];
    const gitDiff = context?.gitDiff || '';

    // Check for frontend indicators
    if (this.hasAnyPattern([currentFile, ...openFiles], ['**/*.{jsx,tsx,vue,svelte}'])) {
      return 'frontend';
    }

    // Check for backend indicators
    if (this.hasAnyPattern([currentFile, ...openFiles], ['**/{server,app,api,controller,service}/**'])) {
      return 'backend';
    }

    // Check for mobile indicators
    if (this.hasAnyPattern([currentFile, ...openFiles], ['**/*.{ios,android,flutter,kotlin,swift}'])) {
      return 'mobile';
    }

    // Check for CLI indicators
    if (this.hasAnyPattern([currentFile, ...openFiles], ['**/{bin,cli,cmd}/**', '**/commander.js', '**/yargs.js'])) {
      return 'cli';
    }

    // Check for library indicators
    if (this.hasAnyPattern([currentFile, ...openFiles], ['**/lib/**', '**/src/index.{js,ts}', '**/package.json'])) {
      return 'library';
    }

    // Check for fullstack indicators (mixed frontend/backend)
    const hasFrontend = this.hasAnyPattern([currentFile, ...openFiles], ['**/*.{jsx,tsx,vue,svelte}']);
    const hasBackend = this.hasAnyPattern([currentFile, ...openFiles], ['**/{server,app,api}/**']);
    if (hasFrontend && hasBackend) {
      return 'fullstack';
    }

    return 'unknown';
  }

  private detectStack(context?: any): string[] {
    const stack: string[] = [];
    const currentFile = context?.currentFile || '';
    const openFiles = context?.openFiles || [];

    // Check for TypeScript
    if (this.hasAnyPattern([currentFile, ...openFiles], ['**/*.ts', '**/*.tsx'])) {
      stack.push('typescript');
    } else if (this.hasAnyPattern([currentFile, ...openFiles], ['**/*.js', '**/*.jsx'])) {
      stack.push('javascript');
    }

    // Check for Python
    if (this.hasAnyPattern([currentFile, ...openFiles], ['**/*.py'])) {
      stack.push('python');
    }

    // Check for Java
    if (this.hasAnyPattern([currentFile, ...openFiles], ['**/*.java'])) {
      stack.push('java');
    }

    // Check for Go
    if (this.hasAnyPattern([currentFile, ...openFiles], ['**/*.go'])) {
      stack.push('go');
    }

    // Check for Rust
    if (this.hasAnyPattern([currentFile, ...openFiles], ['**/*.rs'])) {
      stack.push('rust');
    }

    // Check for C/C++
    if (this.hasAnyPattern([currentFile, ...openFiles], ['**/*.{c,cpp,cxx,h,hpp}'])) {
      stack.push('cpp');
    }

    return stack;
  }

  private detectFramework(context?: any): string[] {
    const frameworks: string[] = [];
    const currentFile = context?.currentFile || '';
    const openFiles = context?.openFiles || [];

    // Frontend frameworks
    if (this.hasAnyPattern([currentFile, ...openFiles], ['**/next.config.{js,ts}', '**/pages/**', '**/app/**'])) {
      frameworks.push('nextjs');
    }
    if (this.hasAnyPattern([currentFile, ...openFiles], ['**/vite.config.{js,ts}', '**/src/main.{js,ts,jsx,tsx}'])) {
      frameworks.push('vite');
    }
    if (this.hasAnyPattern([currentFile, ...openFiles], ['**/vue.config.{js,ts}', '**/*.vue'])) {
      frameworks.push('vue');
    }
    if (this.hasAnyPattern([currentFile, ...openFiles], ['**/angular.json', '**/*.component.ts'])) {
      frameworks.push('angular');
    }

    // Backend frameworks
    if (this.hasAnyPattern([currentFile, ...openFiles], ['**/express.{js,ts}', '**/app.{js,ts}', '**/routes/**'])) {
      frameworks.push('express');
    }
    if (this.hasAnyPattern([currentFile, ...openFiles], ['**/fastify.{js,ts}', '**/server.{js,ts}'])) {
      frameworks.push('fastify');
    }
    if (this.hasAnyPattern([currentFile, ...openFiles], ['**/django/**', '**/manage.py', '**/settings.py'])) {
      frameworks.push('django');
    }
    if (this.hasAnyPattern([currentFile, ...openFiles], ['**/flask_*.{py,py}', '**/app.py'])) {
      frameworks.push('flask');
    }
    if (this.hasAnyPattern([currentFile, ...openFiles], ['**/spring-boot*.properties', '**/application.properties'])) {
      frameworks.push('spring-boot');
    }

    return frameworks;
  }

  private detectPackageManager(context?: any): string {
    // This would ideally check for actual package manager files
    const openFiles = context?.openFiles || [];

    if (this.hasAnyPattern(openFiles, ['**/pnpm-lock.yaml', '**/.pnpmrc'])) {
      return 'pnpm';
    }
    if (this.hasAnyPattern(openFiles, ['**/yarn.lock', '**/.yarnrc'])) {
      return 'yarn';
    }
    if (this.hasAnyPattern(openFiles, ['**/package-lock.json', '**/npm-shrinkwrap.json'])) {
      return 'npm';
    }
    if (this.hasAnyPattern(openFiles, ['**/requirements.txt', '**/setup.py', '**/pyproject.toml'])) {
      return 'pip';
    }
    if (this.hasAnyPattern(openFiles, ['**/Cargo.lock', '**/Cargo.toml'])) {
      return 'cargo';
    }
    if (this.hasAnyPattern(openFiles, ['**/go.mod', '**/go.sum'])) {
      return 'go';
    }

    return 'unknown';
  }

  private detectBuildTools(context?: any): string[] {
    const tools: string[] = [];
    const openFiles = context?.openFiles || [];

    if (this.hasAnyPattern(openFiles, ['**/webpack.config.{js,ts}', '**/webpack.*.js'])) {
      tools.push('webpack');
    }
    if (this.hasAnyPattern(openFiles, ['**/vite.config.{js,ts}'])) {
      tools.push('vite');
    }
    if (this.hasAnyPattern(openFiles, ['**/rollup.config.{js,ts}'])) {
      tools.push('rollup');
    }
    if (this.hasAnyPattern(openFiles, ['**/parcel.config.{js,ts,json}'])) {
      tools.push('parcel');
    }
    if (this.hasAnyPattern(openFiles, ['**/Dockerfile', '**/docker-compose.{yml,yaml}'])) {
      tools.push('docker');
    }
    if (this.hasAnyPattern(openFiles, ['**/CMakeLists.txt', '**/Makefile'])) {
      tools.push('cmake');
    }

    return tools;
  }

  private detectTestingFramework(context?: any): string[] {
    const frameworks: string[] = [];
    const openFiles = context?.openFiles || [];

    if (this.hasAnyPattern(openFiles, ['**/jest.config.{js,ts}', '**/*.test.{js,ts}', '**/*.spec.{js,ts}'])) {
      frameworks.push('jest');
    }
    if (this.hasAnyPattern(openFiles, ['**/mocha.opts', '**/test/**/*.js'])) {
      frameworks.push('mocha');
    }
    if (this.hasAnyPattern(openFiles, ['**/pytest.ini', '**/test_*.py'])) {
      frameworks.push('pytest');
    }
    if (this.hasAnyPattern(openFiles, ['**/junit.xml', '**/*Test.java'])) {
      frameworks.push('junit');
    }

    return frameworks;
  }

  private detectDeployment(context?: any): string[] {
    const deployment: string[] = [];
    const openFiles = context?.openFiles || [];

    if (this.hasAnyPattern(openFiles, ['**/Dockerfile', '**/docker-compose.{yml,yaml}'])) {
      deployment.push('docker');
    }
    if (this.hasAnyPattern(openFiles, ['**/k8s/**', '**/kubernetes/**', '**/*.yaml'])) {
      deployment.push('kubernetes');
    }
    if (this.hasAnyPattern(openFiles, ['**/.vercelignore', '**/vercel.json'])) {
      deployment.push('vercel');
    }
    if (this.hasAnyPattern(openFiles, ['**/Procfile', '**/.heroku/**'])) {
      deployment.push('heroku');
    }

    return deployment;
  }

  private calculateRelevance(projectContext: ProjectContext, skillName: string): number {
    // Skill-specific relevance calculation
    switch (skillName.toLowerCase()) {
      case 'backend-dev-guidelines':
        return this.calculateBackendRelevance(projectContext);
      case 'frontend-dev-guidelines':
        return this.calculateFrontendRelevance(projectContext);
      case 'database-verification':
        return this.calculateDatabaseRelevance(projectContext);
      default:
        return this.calculateGenericRelevance(projectContext);
    }
  }

  private calculateBackendRelevance(context: ProjectContext): number {
    let score = 0;

    // High relevance for backend projects
    if (context.type === 'backend') score += 0.4;
    if (context.type === 'fullstack') score += 0.2;

    // Backend stacks
    if (context.stack.includes('node')) score += 0.1;
    if (context.stack.includes('python')) score += 0.1;
    if (context.stack.includes('java')) score += 0.1;

    // Backend frameworks
    if (context.framework.includes('express')) score += 0.15;
    if (context.framework.includes('django')) score += 0.15;
    if (context.framework.includes('spring-boot')) score += 0.15;

    // Build tools
    if (context.buildTools.includes('docker')) score += 0.1;

    return Math.min(score, 1);
  }

  private calculateFrontendRelevance(context: ProjectContext): number {
    let score = 0;

    // High relevance for frontend projects
    if (context.type === 'frontend') score += 0.4;
    if (context.type === 'fullstack') score += 0.2;

    // Frontend stacks
    if (context.stack.includes('typescript')) score += 0.15;
    if (context.stack.includes('javascript')) score += 0.1;

    // Frontend frameworks
    if (context.framework.includes('react')) score += 0.15;
    if (context.framework.includes('vue')) score += 0.15;
    if (context.framework.includes('angular')) score += 0.15;
    if (context.framework.includes('nextjs')) score += 0.15;

    // Build tools
    if (context.buildTools.includes('vite')) score += 0.1;
    if (context.buildTools.includes('webpack')) score += 0.1;

    return Math.min(score, 1);
  }

  private calculateDatabaseRelevance(context: ProjectContext): number {
    let score = 0;

    // Relevance for projects that likely use databases
    if (['backend', 'fullstack'].includes(context.type)) score += 0.3;

    // Backend stacks commonly use databases
    if (context.stack.includes('node')) score += 0.15;
    if (context.stack.includes('python')) score += 0.15;
    if (context.stack.includes('java')) score += 0.15;

    // Frameworks with database integration
    if (context.framework.includes('express')) score += 0.1;
    if (context.framework.includes('django')) score += 0.15;
    if (context.framework.includes('spring-boot')) score += 0.15;

    // Build tools
    if (context.buildTools.includes('docker')) score += 0.1;

    return Math.min(score, 1);
  }

  private calculateGenericRelevance(context: ProjectContext): number {
    let score = 0;

    // Base score for any identified project
    if (context.type !== 'unknown') score += 0.2;

    // Stack familiarity
    if (context.stack.length > 0) score += 0.1;
    if (context.stack.includes('typescript')) score += 0.05;
    if (context.stack.includes('javascript')) score += 0.05;

    // Framework presence
    if (context.framework.length > 0) score += 0.1;

    // Build tools
    if (context.buildTools.length > 0) score += 0.05;

    return Math.min(score, 1);
  }

  private hasAnyPattern(files: string[], patterns: string[]): boolean {
    return files.some(file =>
      patterns.some(pattern => {
        const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'), 'i');
        return regex.test(file);
      })
    );
  }

  private createDefaultPatterns(): ContextPattern[] {
    return [
      {
        name: 'react-typescript',
        patterns: {
          files: ['**/*.tsx', '**/*.jsx', '**/src/**'],
          dependencies: ['react', '@types/react', 'typescript'],
          scripts: ['build', 'dev', 'start'],
          config: ['tsconfig.json', 'package.json'],
          keywords: ['component', 'hook', 'jsx', 'tsx']
        },
        weight: 0.9,
        contexts: ['frontend-dev-guidelines', 'frontend']
      },
      {
        name: 'node-express',
        patterns: {
          files: ['**/server.js', '**/app.js', '**/routes/**', '**/controllers/**'],
          dependencies: ['express', 'cors', 'helmet'],
          scripts: ['start', 'dev', 'test'],
          config: ['package.json', '.env'],
          keywords: ['api', 'endpoint', 'middleware', 'route']
        },
        weight: 0.9,
        contexts: ['backend-dev-guidelines', 'backend']
      },
      {
        name: 'python-django',
        patterns: {
          files: ['**/manage.py', '**/settings.py', '**/views.py', '**/models.py'],
          dependencies: ['django', 'djangorestframework'],
          scripts: ['runserver', 'migrate', 'collectstatic'],
          config: ['requirements.txt', 'settings.py'],
          keywords: ['view', 'model', 'template', 'admin']
        },
        weight: 0.9,
        contexts: ['backend-dev-guidelines', 'backend']
      },
      {
        name: 'database-sql',
        patterns: {
          files: ['**/*.sql', '**/migrations/**', '**/seeds/**'],
          dependencies: ['pg', 'mysql2', 'sqlite3', 'prisma'],
          scripts: ['db:migrate', 'db:seed', 'db:reset'],
          config: ['schema.sql', 'prisma/schema.prisma'],
          keywords: ['migration', 'schema', 'seed', 'query']
        },
        weight: 0.85,
        contexts: ['database-verification', 'database']
      }
    ];
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache statistics
  getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.config.cacheSize
    };
  }

  // Add new pattern dynamically
  addPattern(pattern: ContextPattern): void {
    this.config.patterns.push(pattern);
    this.clearCache();
  }

  // Get debug information
  getDebugInfo(skillName: string): {
    cacheStats: any;
    patterns: ContextPattern[];
  } {
    return {
      cacheStats: this.getCacheStats(),
      patterns: this.config.patterns
    };
  }
}