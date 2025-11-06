import { type ScoreInput, type Signal } from '../types.js';

export interface FilePathPattern {
  glob: string;
  specificity: number; // 0..1, higher = more specific
  description: string;
  examples: string[];
}

export class FilePathMatchSignal implements Signal {
  name = 'filePathMatch';
  private readonly patterns: FilePathPattern[];
  private readonly cache: Map<string, number> = new Map();
  private readonly maxCacheSize: number;

  constructor(patterns: FilePathPattern[], options?: { maxCacheSize?: number }) {
    this.patterns = patterns.sort((a, b) => b.specificity - a.specificity);
    this.maxCacheSize = options?.maxCacheSize || 500;
  }

  async score({ context, skillName }: ScoreInput): Promise<number> {
    const currentFile = context?.currentFile;
    const openFiles = context?.openFiles || [];
    const recentFiles = context?.recentFiles || [];

    // Combine all relevant files for evaluation
    const relevantFiles = [
      ...(currentFile ? [currentFile] : []),
      ...openFiles,
      ...recentFiles
    ].filter(Boolean);

    if (relevantFiles.length === 0) {
      return 0;
    }

    const cacheKey = `${skillName}:${relevantFiles.join(',')}`;

    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    let totalScore = 0;
    let matchedFiles = 0;

    // Evaluate each file against patterns
    for (const filePath of relevantFiles) {
      const fileScore = this.evaluateFile(filePath);
      if (fileScore > 0) {
        totalScore += fileScore;
        matchedFiles++;
      }
    }

    // Calculate final score based on matched files
    const finalScore = matchedFiles > 0 ? Math.min(totalScore / matchedFiles, 1) : 0;

    // Update cache with LRU eviction
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value as string | undefined;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(cacheKey, finalScore);

    return finalScore;
  }

  private evaluateFile(filePath: string): number {
    let bestScore = 0;

    for (const pattern of this.patterns) {
      if (this.matchesGlob(filePath, pattern.glob)) {
        // Weight by specificity - more specific patterns get higher scores
        const score = pattern.specificity;
        bestScore = Math.max(bestScore, score);

        // Early termination for perfect matches
        if (score >= 0.95) {
          break;
        }
      }
    }

    return bestScore;
  }

  private matchesGlob(filePath: string, glob: string): boolean {
    // Convert glob to regex
    const regex = this.globToRegex(glob);
    return regex.test(filePath);
  }

  private globToRegex(glob: string): RegExp {
    // Escape special regex characters
    let regexPattern = glob
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
      // Convert glob wildcards to regex
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\?/g, '[^/]')
      // Handle multiple patterns separated by commas
      .replace(/\s*,\s*/g, '|');

    // Ensure full path match
    regexPattern = `^(${regexPattern})$`;

    return new RegExp(regexPattern, 'i');
  }

  // Factory method for common file patterns
  static createCommonPatterns(): FilePathPattern[] {
    return [
      // Configuration files (high specificity)
      {
        glob: '**/*.{json,yaml,yml,toml,ini,conf,config}',
        specificity: 0.9,
        description: 'Configuration files',
        examples: ['package.json', 'config.yaml', 'app.ini']
      },
      // Documentation files
      {
        glob: '**/*.{md,txt,doc,docx}',
        specificity: 0.85,
        description: 'Documentation files',
        examples: ['README.md', 'docs.txt', 'guide.docx']
      },
      // Source code files
      {
        glob: '**/*.{js,ts,jsx,tsx,py,java,cpp,c,go,rs,php,rb,swift,kt}',
        specificity: 0.8,
        description: 'Source code files',
        examples: ['app.js', 'lib.ts', 'main.py']
      },
      // Test files
      {
        glob: '**/*.{test,spec}.{js,ts,py,java}',
        specificity: 0.85,
        description: 'Test files',
        examples: ['app.test.js', 'lib.spec.ts', 'test_app.py']
      },
      // Build/CI files
      {
        glob: '**/{Dockerfile,docker-compose.*,Makefile,*.yml,*.yaml}',
        specificity: 0.9,
        description: 'Build and CI files',
        examples: ['Dockerfile', 'docker-compose.yml', 'Makefile']
      },
      // Database files
      {
        glob: '**/*.{sql,migrations,seeds}',
        specificity: 0.85,
        description: 'Database files',
        examples: ['schema.sql', 'migrations/', 'seeds.sql']
      },
      // Style/CSS files
      {
        glob: '**/*.{css,scss,sass,less,styl}',
        specificity: 0.75,
        description: 'Style files',
        examples: ['style.css', 'theme.scss', 'main.less']
      },
      // Template files
      {
        glob: '**/*.{html,hbs,mustache,ejs,jinja}',
        specificity: 0.7,
        description: 'Template files',
        examples: ['index.html', 'template.hbs', 'view.ejs']
      }
    ];
  }

  // Create skill-specific patterns
  static createSkillPatterns(skillName: string): FilePathPattern[] {
    const basePatterns = this.createCommonPatterns();

    // Add skill-specific patterns
    switch (skillName.toLowerCase()) {
      case 'backend-dev-guidelines':
        return [
          ...basePatterns,
          {
            glob: '**/{src,lib,app,server,api,backend}/**/*.{js,ts,py,java,go,rs,php}',
            specificity: 0.95,
            description: 'Backend source files',
            examples: ['src/controller.js', 'lib/api.py', 'app/server.go']
          },
          {
            glob: '**/{controllers,services,models,routes,middleware}/**/*',
            specificity: 0.9,
            description: 'Backend architecture files',
            examples: ['controllers/user.js', 'services/auth.py', 'models/User.java']
          },
          {
            glob: '**/{migrations,seeds,database,db}/**/*.{sql,js,ts,py}',
            specificity: 0.85,
            description: 'Database files',
            examples: ['migrations/001_initial.sql', 'seeds/users.js', 'db/schema.py']
          }
        ];

      case 'frontend-dev-guidelines':
        return [
          ...basePatterns,
          {
            glob: '**/{src,app,client,frontend,components}/**/*.{js,jsx,ts,tsx,vue,svelte}',
            specificity: 0.95,
            description: 'Frontend source files',
            examples: ['src/App.jsx', 'components/Button.tsx', 'views/Home.vue']
          },
          {
            glob: '**/{public,assets,static}/**/*.{css,scss,sass,less,images,fonts}',
            specificity: 0.8,
            description: 'Frontend asset files',
            examples: ['public/style.css', 'assets/images/', 'static/fonts/']
          },
          {
            glob: '**/{pages,views,routes,layouts}/**/*.{js,jsx,ts,tsx}',
            specificity: 0.9,
            description: 'Frontend routing files',
            examples: ['pages/index.jsx', 'views/dashboard.tsx', 'routes/layout.tsx']
          }
        ];

      case 'database-verification':
        return [
          ...basePatterns,
          {
            glob: '**/{migrations,seeds,schema,database,db}/**/*',
            specificity: 0.95,
            description: 'Database migration files',
            examples: ['migrations/001.sql', 'seeds/users.json', 'schema/schema.prisma']
          },
          {
            glob: '**/*.{sql,dsl,prisma}',
            specificity: 0.9,
            description: 'Database schema files',
            examples: ['schema.sql', 'schema.prisma', 'models.dsl']
          }
        ];

      default:
        return basePatterns;
    }
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache statistics
  getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize
    };
  }

  // Add new pattern dynamically
  addPattern(pattern: FilePathPattern): void {
    this.patterns.push(pattern);
    // Re-sort by specificity
    this.patterns.sort((a, b) => b.specificity - a.specificity);
    // Clear cache since patterns changed
    this.clearCache();
  }

  // Remove pattern by glob
  removePattern(glob: string): boolean {
    const index = this.patterns.findIndex(p => p.glob === glob);
    if (index !== -1) {
      this.patterns.splice(index, 1);
      this.clearCache();
      return true;
    }
    return false;
  }
}