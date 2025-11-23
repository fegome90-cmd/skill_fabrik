# Plan de Upgrade: Zero Technical Debt Code Quality
## Skills Fabrik - ESLint, Prettier y Pre-commit Unificación

### Contexto
- **Fecha**: 2025-11-14
- **Estado actual**: 8 configuraciones inconsistentes detectadas
- **Riesgo**: Fragmentación de estándares de calidad
- **Objetivo**: Eliminar deuda técnica y establecer mejores prácticas

## Fase 1: Configuración Unificada de ESLint

### Objetivo
Unificar parser y reglas bajo una sola configuración TypeScript-first

### Plan de Implementación

#### 1.1 Crear configuración ESLint de referencia

```json
// .eslintrc.json.unified
{
  "root": true,
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "module",
    "project": "./tsconfig.json"
  },
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "prettier"
  ],
  "plugins": [
    "@typescript-eslint",
    "import",
    "simple-import-sort",
    "no-secrets",
    "sonarjs"
  ],
  "env": {
    "node": true,
    "es2022": true,
    "jest": true
  },
  "rules": {
    // TypeScript specific
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/prefer-const": "error",
    "@typescript-eslint/no-var-requires": "error",
    
    // Import organization
    "import/no-unresolved": "off", // TypeScript handles this
    "import/order": ["error", {
      "groups": [
        "builtin",
        "external", 
        "internal",
        "parent",
        "sibling",
        "index"
      ],
      "newlines-between": "always"
    }],
    "simple-import-sort/imports": "error",
    "simple-import-sort/exports": "error",
    
    // Code quality
    "no-console": "warn",
    "no-debugger": "error",
    "no-alert": "error",
    "prefer-const": "error",
    "no-var": "error",
    
    // Security
    "no-eval": "error",
    "no-implied-eval": "error",
    "no-new-func": "error",
    "no-script-url": "error",
    
    // Performance
    "no-loop-func": "error",
    "prefer-arrow-callback": "error"
  },
  "ignorePatterns": [
    "node_modules/",
    "dist/",
    "build/",
    "coverage/",
    "*.config.js",
    "*.config.ts",
    ".cursor/",
    "mcp/servers/memtech/gateway/*.js",
    "memtech/",
    "chromadb-env/"
  ],
  "overrides": [
    {
      "files": ["*.test.js", "*.test.ts", "**/tests/**/*.js", "**/tests/**/*.ts"],
      "env": {
        "jest": true,
        "node": true
      },
      "rules": {
        "@typescript-eslint/no-unused-vars": "off",
        "no-undef": "off",
        "no-console": "off"
      }
    },
    {
      "files": ["*.md"],
      "parser": "markdown-eslint-parser",
      "rules": {
        "no-irregular-whitespace": "error",
        "no-trailing-spaces": "warn"
      }
    },
    {
      "files": ["scripts/**/*.js", "scripts/**/*.ts"],
      "rules": {
        "no-console": "off",
        "@typescript-eslint/no-var-requires": "off"
      }
    }
  ]
}
```

#### 1.2 Configuración TypeScript específica

```json
// tsconfig.eslint.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  },
  "include": [
    "src/**/*",
    "scripts/**/*",
    "packages/**/src/**/*",
    "**/*.test.ts",
    "**/*.test.js",
    "**/*.spec.ts",
    "**/*.spec.js"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "build",
    "coverage",
    "*.config.js"
  ]
}
```

## Fase 2: Configuración Unificada de Prettier

### Objetivo
Establecer formato consistente en todo el proyecto

### Plan de Implementación

#### 2.1 Configuración Prettier de referencia

```json
// .prettierrc.json.unified
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "avoid",
  "endOfLine": "lf",
  "quoteProps": "as-needed",
  "bracketSpacing": true,
  "bracketSameLine": false,
  "embeddedLanguageFormatting": "auto"
}
```

#### 2.2 Integración ESLint + Prettier

```json
// .eslintrc.json additions (already included above)
{
  "extends": [
    // ... other extends
    "prettier" // MUST BE LAST
  ]
}
```

#### 2.3 Scripts de validación

```bash
# package.json additions
{
  "scripts": {
    "lint": "eslint . --ext .ts,.js,.md --max-warnings=0",
    "lint:fix": "eslint . --ext .ts,.js,.md --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "format:diff": "prettier --list-different .",
    "quality:check": "npm run format:check && npm run lint",
    "quality:fix": "npm run format && npm run lint:fix"
  }
}
```

## Fase 3: Pre-commit Hooks Avanzados

### Objetivo
Migrar hooks del análisis forense a Husky global con validaciones avanzadas

### Plan de Implementación

#### 3.1 Nuevo pre-commit hook

```bash
# .husky/pre-commit.new
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Running comprehensive pre-commit hooks..."

# 1. Validate commit message format
if [ -n "$HUSKY_GIT_PARAMS" ]; then
  echo "📝 Validating commit message..."
  npx --no-install commitlint --edit "$HUSKY_GIT_PARAMS"
fi

# 2. Check for secrets and credentials
echo "🔒 Scanning for secrets..."
if grep -r -i --exclude-dir=node_modules --exclude-dir=.git --exclude="*.md" "password\|secret\|api_key\|token" . > /tmp/secrets.log 2>/dev/null; then
  echo "⚠️  Potential secrets detected:"
  cat /tmp/secrets.log
  echo "Please review and remove any hardcoded credentials"
  exit 1
fi

# 3. Check encoding (UTF-8 only)
echo "🌐 Validating file encoding..."
find . -type f \( -name "*.ts" -o -name "*.js" -o -name "*.json" -o -name "*.md" \) -exec file {} \; | grep -v "UTF-8" | head -5
if [ $? -eq 0 ]; then
  echo "⚠️  Non-UTF-8 files detected. Please convert to UTF-8"
  exit 1
fi

# 4. Validate package.json dependencies
echo "📦 Validating package dependencies..."
if [ -f "package.json" ]; then
  # Check for known vulnerable packages
  npx --no-install audit-ci --moderate || echo "⚠️  Security vulnerabilities detected"
fi

# 5. Quality gates
echo "✨ Running quality gates..."

# Format check (fail fast)
echo "  📐 Checking code format..."
npx --no-install prettier --check .
if [ $? -ne 0 ]; then
  echo "❌ Code formatting issues found. Run 'npm run format' to fix"
  exit 1
fi

# Lint check
echo "  🔍 Running linting..."
npm run lint
if [ $? -ne 0 ]; then
  echo "❌ Linting errors found. Please fix before committing"
  exit 1
fi

# Type checking (if TypeScript files present)
if find . -name "*.ts" -not -path "./node_modules/*" | head -1 | grep -q .; then
  echo "  📝 Running type checking..."
  npx --no-install tsc --noEmit --project tsconfig.eslint.json
  if [ $? -ne 0 ]; then
    echo "❌ Type checking failed. Please fix type errors"
    exit 1
  fi
fi

# 6. Validate documentation changes
echo "📚 Validating documentation..."
if git diff --cached --name-only | grep -q "\.md$"; then
  # Check markdown links
  for file in $(git diff --cached --name-only | grep "\.md$"); do
    if [ -f "$file" ]; then
      # Basic markdown link validation
      if grep -q "\[.*\](" "$file"; then
        echo "  ✅ Markdown links detected in $file"
      fi
    fi
  done
fi

# 7. Check for TODO/FIXME comments in critical files
echo "🏷️  Checking for TODO/FIXME in production code..."
if find src/ packages/*/src/ -name "*.ts" -o -name "*.js" | xargs grep -l "TODO\|FIXME" | head -5 | grep -q .; then
  echo "⚠️  TODO/FIXME comments found in production code:"
  find src/ packages/*/src/ -name "*.ts" -o -name "*.js" | xargs grep -n "TODO\|FIXME" | head -5
  echo "Consider addressing these before committing to main branches"
fi

# 8. Validate test coverage for new files
echo "🧪 Checking test coverage..."
NEW_FILES=$(git diff --cached --name-only --diff-filter=AM | grep -E "\.(ts|js)$" | grep -v test | head -5)
if [ -n "$NEW_FILES" ]; then
  echo "📊 New files detected: $NEW_FILES"
  echo "💡 Consider adding tests for these files"
fi

echo "✅ All pre-commit hooks passed!"
echo "🚀 Ready to commit with zero technical debt"

# Cleanup
rm -f /tmp/secrets.log
```

#### 3.2 Commit message validation

```bash
# .husky/commit-msg
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "📝 Validating commit message format..."

npx --no-install commitlint --edit "$1"

# Additional custom validations
COMMIT_MSG=$(cat "$1")

# Check for proper emoji usage (optional)
if echo "$COMMIT_MSG" | grep -q "^feat"; then
  echo "✨ Feature commit detected"
elif echo "$COMMIT_MSG" | grep -q "^fix"; then
  echo "🐛 Bug fix commit detected"
elif echo "$COMMIT_MSG" | grep -q "^docs"; then
  echo "📚 Documentation commit detected"
elif echo "$COMMIT_MSG" | grep -q "^refactor"; then
  echo "🔧 Refactor commit detected"
fi

echo "✅ Commit message format validated"
```

## Fase 4: Scripts de Validación Avanzados

### Objetivo
Integrar scripts del análisis forense al CLI global

### Plan de Implementación

#### 4.1 Scripts de validación de evidencia

```bash
#!/usr/bin/env node
// scripts/validate-evidence.js
const fs = require('fs');
const path = require('path');
const glob = require('glob');

class EvidenceValidator {
  constructor() {
    this.issues = [];
    this.warnings = [];
  }

  validateFileEncoding(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      // Check for UTF-8 BOM
      if (content.charCodeAt(0) === 0xFEFF) {
        this.issues.push(`File has UTF-8 BOM: ${filePath}`);
      }
      // Check for irregular whitespace
      if (/[\u200B-\u200D\uFEFF]/.test(content)) {
        this.warnings.push(`Contains zero-width characters: ${filePath}`);
      }
      // Check for non-ASCII in critical files
      if (filePath.endsWith('.json') && /[^\x00-\x7F]/.test(content)) {
        this.warnings.push(`Non-ASCII characters in JSON: ${filePath}`);
      }
    } catch (error) {
      this.issues.push(`Cannot read file: ${filePath} - ${error.message}`);
    }
  }

  validateMarkdownLinks(filePath) {
    if (!filePath.endsWith('.md')) return;
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const mdLinks = content.match(/\[[^\]]+\]\([^)]+\)/g) || [];
      
      for (const link of mdLinks) {
        const url = link.match(/\]\(([^)]+)\)/)[1];
        
        // Check for relative links
        if (url.startsWith('./') || url.startsWith('../')) {
          const targetPath = path.resolve(path.dirname(filePath), url);
          if (!fs.existsSync(targetPath)) {
            this.issues.push(`Broken relative link in ${filePath}: ${url}`);
          }
        }
        // Check for fragment links
        else if (url.startsWith('#')) {
          const anchor = url.substring(1);
          if (!content.includes(`<a id="${anchor}"`) && !content.includes(`<h[1-6] id="${anchor}"`)) {
            this.warnings.push(`Potentially broken anchor in ${filePath}: ${anchor}`);
          }
        }
      }
    } catch (error) {
      this.issues.push(`Cannot validate markdown links: ${filePath}`);
    }
  }

  validatePackageJson(filePath) {
    if (!filePath.endsWith('package.json')) return;
    
    try {
      const pkg = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      // Check for required fields
      const required = ['name', 'version', 'description'];
      for (const field of required) {
        if (!pkg[field]) {
          this.issues.push(`Missing required field in ${filePath}: ${field}`);
        }
      }
      
      // Check for scripts
      if (!pkg.scripts) {
        this.warnings.push(`No scripts defined in ${filePath}`);
      }
      
      // Check for license
      if (!pkg.license) {
        this.warnings.push(`No license specified in ${filePath}`);
      }
    } catch (error) {
      this.issues.push(`Invalid JSON in ${filePath}: ${error.message}`);
    }
  }

  async validate() {
    console.log('🔍 Starting evidence validation...');
    
    // Find all relevant files
    const files = [
      ...glob.sync('**/*.md', { ignore: ['node_modules/**', 'dist/**', 'build/**'] }),
      ...glob.sync('**/*.json', { ignore: ['node_modules/**', 'dist/**', 'build/**'] }),
      ...glob.sync('**/*.ts', { ignore: ['node_modules/**', 'dist/**', 'build/**'] }),
      ...glob.sync('**/*.js', { ignore: ['node_modules/**', 'dist/**', 'build/**', '.cursor/**'] })
    ];

    for (const file of files) {
      this.validateFileEncoding(file);
      this.validateMarkdownLinks(file);
      this.validatePackageJson(file);
    }

    // Report results
    if (this.issues.length > 0) {
      console.log('\n❌ Critical Issues Found:');
      this.issues.forEach(issue => console.log(`  • ${issue}`));
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      this.warnings.forEach(warning => console.log(`  • ${warning}`));
    }

    if (this.issues.length === 0 && this.warnings.length === 0) {
      console.log('✅ All evidence validation passed!');
      return true;
    }

    console.log(`\n📊 Validation Summary: ${this.issues.length} issues, ${this.warnings.length} warnings`);
    return this.issues.length === 0;
  }
}

// Run validation
if (require.main === module) {
  const validator = new EvidenceValidator();
  validator.validate().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = EvidenceValidator;
```

#### 4.2 Scripts de validación de métricas

```bash
#!/usr/bin/env node
// scripts/check-metrics-consistency.js
const fs = require('fs');
const path = require('path');
const glob = require('glob');

class MetricsValidator {
  constructor() {
    this.inconsistencies = [];
  }

  validateMetricsConsistency() {
    console.log('📊 Validating metrics consistency...');
    
    // Find all metrics files
    const metricsFiles = [
      ...glob.sync('**/metrics-*.json'),
      ...glob.sync('**/kpi/*.json'),
      ...glob.sync('**/obs/kpi/*.json')
    ];

    const metrics = {};
    
    // Aggregate metrics from all files
    for (const file of metricsFiles) {
      try {
        const data = JSON.parse(fs.readFileSync(file, 'utf8'));
        const fileMetrics = this.extractMetrics(data);
        
        for (const [key, value] of Object.entries(fileMetrics)) {
          if (!metrics[key]) {
            metrics[key] = { values: [], files: [] };
          }
          metrics[key].values.push(value);
          metrics[key].files.push(file);
        }
      } catch (error) {
        this.inconsistencies.push(`Cannot parse metrics file: ${file} - ${error.message}`);
      }
    }

    // Check for inconsistencies
    for (const [key, data] of Object.entries(metrics)) {
      if (data.values.length > 1) {
        const uniqueValues = [...new Set(data.values.map(v => JSON.stringify(v)))];
        if (uniqueValues.length > 1) {
          this.inconsistencies.push(
            `Inconsistent metric '${key}': ${uniqueValues.length} different values across ${data.files.length} files`
          );
        }
      }
    }

    return this.inconsistencies;
  }

  extractMetrics(data) {
    const metrics = {};
    
    // Recursively extract numeric metrics
    const extract = (obj, prefix = '') => {
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        
        if (typeof value === 'number') {
          metrics[fullKey] = value;
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          extract(value, fullKey);
        }
      }
    };
    
    extract(data);
    return metrics;
  }

  async validate() {
    const inconsistencies = this.validateMetricsConsistency();
    
    if (inconsistencies.length > 0) {
      console.log('\n❌ Metrics Inconsistencies Found:');
      inconsistencies.forEach(issue => console.log(`  • ${issue}`));
      return false;
    }
    
    console.log('✅ All metrics are consistent!');
    return true;
  }
}

// Run validation
if (require.main === module) {
  const validator = new MetricsValidator();
  validator.validate().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = MetricsValidator;
```

#### 4.3 Script principal de quality gates

```bash
#!/usr/bin/env node
// scripts/quality-gates.js
const { execSync } = require('child_process');
const fs = require('fs');

class QualityGates {
  constructor() {
    this.gates = [];
    this.results = [];
  }

  addGate(name, command, critical = true) {
    this.gates.push({ name, command, critical });
  }

  async runGate(gate) {
    console.log(`\n🔍 Running Gate: ${gate.name}`);
    
    try {
      const startTime = Date.now();
      const output = execSync(gate.command, { 
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 300000 // 5 minutes
      });
      const duration = Date.now() - startTime;
      
      console.log(`✅ ${gate.name} passed (${duration}ms)`);
      this.results.push({
        name: gate.name,
        status: 'passed',
        duration,
        critical: gate.critical
      });
      return true;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`❌ ${gate.name} failed (${duration}ms)`);
      console.log(error.stdout || error.message);
      
      this.results.push({
        name: gate.name,
        status: 'failed',
        duration,
        critical: gate.critical,
        error: error.message
      });
      return false;
    }
  }

  async runAll() {
    console.log('🚦 Starting Quality Gates...\n');
    console.log('='.repeat(50));
    
    for (const gate of this.gates) {
      const passed = await this.runGate(gate);
      
      // Stop on critical failure
      if (!passed && gate.critical) {
        console.log('\n🛑 Critical gate failed. Stopping execution.');
        break;
      }
    }
    
    this.report();
  }

  report() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 QUALITY GATES REPORT\n');
    
    const passed = this.results.filter(r => r.status === 'passed').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    const critical = this.results.filter(r => r.critical && r.status === 'failed').length;
    
    console.log(`Total Gates: ${this.results.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed} (${critical} critical)`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Gates:');
      this.results
        .filter(r => r.status === 'failed')
        .forEach(r => console.log(`  • ${r.name}${r.critical ? ' (CRITICAL)' : ''}`));
    }
    
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
    console.log(`\n⏱️  Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);
    
    if (critical > 0) {
      console.log('\n💥 Critical gates failed. Merge blocked.');
      process.exit(1);
    } else if (failed > 0) {
      console.log('\n⚠️  Some gates failed. Please review warnings.');
      process.exit(0); // Non-blocking for non-critical
    } else {
      console.log('\n🎉 All quality gates passed! Zero technical debt achieved.');
    }
  }
}

// Main execution
if (require.main === module) {
  const gates = new QualityGates();
  
  // Define all quality gates
  gates.addGate('Code Formatting', 'npm run format:check', true);
  gates.addGate('ESLint Validation', 'npm run lint', true);
  gates.addGate('TypeScript Checking', 'npx tsc --noEmit', true);
  gates.addGate('Evidence Validation', 'node scripts/validate-evidence.js', true);
  gates.addGate('Metrics Consistency', 'node scripts/check-metrics-consistency.js', true);
  gates.addGate('Package Security', 'npm audit --audit-level moderate', false);
  gates.addGate('Test Coverage', 'npm test -- --coverage', false);
  gates.addGate('Documentation Links', 'node scripts/validate-links.js', false);
  
  gates.runAll().catch(error => {
    console.error('Quality gates failed:', error);
    process.exit(1);
  });
}

module.exports = QualityGates;
```

## Fase 5: Plan de Migración

### Objetivo
Ejecutar upgrade sin interrumpir desarrollo

### Plan de Implementación

#### 5.1 Backup de configuraciones actuales

```bash
#!/bin/bash
# scripts/backup-configs.sh

echo "💾 Backing up current configurations..."

mkdir -p backup/configs/$(date +%Y%m%d-%H%M%S)

# Backup existing configs
cp .eslintrc.json backup/configs/$(date +%Y%m%d-%H%M%S)/ 2>/dev/null || true
cp .prettierrc.json backup/configs/$(date +%Y%m%d-%H%M%S)/ 2>/dev/null || true
cp .husky/pre-commit backup/configs/$(date +%Y%m%d-%H%M%S)/ 2>/dev/null || true

# Backup forensic analysis configs
if [ -d "docs/inventario/architecture-analysis/forensic-analysis/" ]; then
  cp -r docs/inventario/architecture-analysis/forensic-analysis/.eslintrc.json backup/configs/$(date +%Y%m%d-%H%M%S)/ 2>/dev/null || true
  cp -r docs/inventario/architecture-analysis/forensic-analysis/.prettierrc backup/configs/$(date +%Y%m%d-%H%M%S)/ 2>/dev/null || true
  cp -r docs/inventario/architecture-analysis/forensic-analysis/.pre-commit-config.yaml backup/configs/$(date +%Y%m%d-%H%M%S)/ 2>/dev/null || true
fi

echo "✅ Backup completed in backup/configs/$(date +%Y%m%d-%H%M%S)/"
```

#### 5.2 Rollback plan

```bash
#!/bin/bash
# scripts/rollback-configs.sh

BACKUP_DIR=$1

if [ -z "$BACKUP_DIR" ]; then
  echo "Usage: $0 <backup_directory>"
  echo "Available backups:"
  ls -1 backup/configs/
  exit 1
fi

if [ ! -d "$BACKUP_DIR" ]; then
  echo "Backup directory not found: $BACKUP_DIR"
  exit 1
fi

echo "🔄 Rolling back to $BACKUP_DIR"

# Restore configs
cp "$BACKUP_DIR/.eslintrc.json" .eslintrc.json 2>/dev/null || true
cp "$BACKUP_DIR/.prettierrc.json" .prettierrc.json 2>/dev/null || true
cp "$BACKUP_DIR/.husky/pre-commit" .husky/pre-commit 2>/dev/null || true

# Restore forensic analysis configs
if [ -f "$BACKUP_DIR/forensic-analysis/.eslintrc.json" ]; then
  cp "$BACKUP_DIR/forensic-analysis/.eslintrc.json" "docs/inventario/architecture-analysis/forensic-analysis/.eslintrc.json" 2>/dev/null || true
  cp "$BACKUP_DIR/forensic-analysis/.prettierrc" "docs/inventario/architecture-analysis/forensic-analysis/.prettierrc" 2>/dev/null || true
  cp "$BACKUP_DIR/forensic-analysis/.pre-commit-config.yaml" "docs/inventario/architecture-analysis/forensic-analysis/.pre-commit-config.yaml" 2>/dev/null || true
fi

echo "✅ Rollback completed"
```

## Fase 6: Testing y Validación

### Objetivo
Verificar que el upgrade no introduce regresiones

### Plan de Implementación

#### 6.1 Test suite para configuraciones

```bash
#!/usr/bin/env node
// test/config-upgrade.test.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

describe('Configuration Upgrade Validation', () => {
  test('ESLint should pass on existing code', () => {
    try {
      execSync('npm run lint', { stdio: 'pipe' });
      expect(true).toBe(true);
    } catch (error) {
      expect(false).toBe(true); // Fail the test
    }
  });

  test('Prettier formatting should be consistent', () => {
    try {
      execSync('npm run format:check', { stdio: 'pipe' });
      expect(true).toBe(true);
    } catch (error) {
      expect(false).toBe(true); // Fail the test
    }
  });

  test('TypeScript compilation should succeed', () => {
    try {
      execSync('npx tsc --noEmit', { stdio: 'pipe' });
      expect(true).toBe(true);
    } catch (error) {
      expect(false).toBe(true); // Fail the test
    }
  });

  test('Quality gates should pass', () => {
    try {
      execSync('node scripts/quality-gates.js', { stdio: 'pipe' });
      expect(true).toBe(true);
    } catch (error) {
      expect(false).toBe(true); // Fail the test
    }
  });

  test('Evidence validation should pass', () => {
    try {
      execSync('node scripts/validate-evidence.js', { stdio: 'pipe' });
      expect(true).toBe(true);
    } catch (error) {
      expect(false).toBe(true); // Fail the test
    }
  });
});
```

#### 6.2 Integration tests

```bash
#!/bin/bash
# test/integration-tests.sh

echo "🧪 Running integration tests..."

# Test 1: New file creation
echo "Test 1: New file validation"
cat > /tmp/test-file.ts << 'EOF'
// Test file
const test: string = "hello world";
console.log(test);
export default test;
EOF

cp /tmp/test-file.ts src/test-file.ts

# Should fail linting (unused export)
if npm run lint 2>&1 | grep -q "no-unused-vars"; then
  echo "✅ Test 1 passed: ESLint correctly detects unused variables"
else
  echo "❌ Test 1 failed: ESLint should detect unused variables"
  exit 1
fi

# Test 2: Format check
echo "Test 2: Format validation"
echo "const     test    =    'bad formatting'" > src/test-format.ts

if npm run format:check 2>&1 | grep -q "test-format.ts"; then
  echo "✅ Test 2 passed: Prettier correctly identifies formatting issues"
else
  echo "❌ Test 2 failed: Prettier should detect formatting issues"
  exit 1
fi

# Test 3: Quality gates
echo "Test 3: Quality gates integration"
rm src/test-file.ts src/test-format.ts

if npm run quality:check; then
  echo "✅ Test 3 passed: Quality gates work correctly"
else
  echo "❌ Test 3 failed: Quality gates should pass for clean code"
  exit 1
fi

echo "🎉 All integration tests passed!"
```

## Fase 7: Documentación y Training

### Objetivo
Documentar nuevos procesos y entrenar al equipo

### Plan de Implementación

#### 7.1 Documentación de configuración

```markdown
# Code Quality Guidelines
## Updated: 2025-11-14

### Quick Start

```bash
# Install dependencies
npm install

# Format code
npm run format

# Lint code
npm run lint

# Run quality gates
npm run quality:check

# Full quality validation
node scripts/quality-gates.js
```

### Configuration Files

- `.eslintrc.json` - Unified ESLint configuration with TypeScript support
- `.prettierrc.json` - Prettier formatting rules
- `.husky/pre-commit` - Advanced pre-commit hooks
- `scripts/quality-gates.js` - Comprehensive quality validation

### Quality Gates

1. **Code Formatting** - Ensures consistent Prettier formatting
2. **ESLint Validation** - TypeScript-aware linting
3. **TypeScript Checking** - Type safety validation
4. **Evidence Validation** - File encoding and link integrity
5. **Metrics Consistency** - Cross-file metric validation
6. **Package Security** - Dependency vulnerability scanning
7. **Test Coverage** - Minimum coverage requirements
8. **Documentation Links** - Markdown link validation

### Best Practices

#### File Organization
```typescript
// 1. Imports (grouped and sorted)
import { someModule } from 'some-package';
import { anotherModule } from '@/internal/module';
import localModule from './local-module';

// 2. Types and interfaces
interface User {
  id: string;
  name: string;
}

// 3. Constants
const DEFAULT_USER: User = {
  id: 'default',
  name: 'Guest'
};

// 4. Functions
export function createUser(data: User): User {
  return { ...DEFAULT_USER, ...data };
}

// 5. Default export
export default createUser;
```

#### Naming Conventions
- **Variables**: camelCase
- **Functions**: camelCase
- **Classes**: PascalCase
- **Constants**: UPPER_SNAKE_CASE
- **Files**: kebab-case.ts
- **Components**: PascalCase.tsx

#### Code Quality Rules
- No `any` types without explicit `@ts-ignore`
- No `console.log` in production code
- No hardcoded credentials or secrets
- All functions must have return types
- All exported functions must be documented
```

#### 7.2 Migration checklist

```markdown
# Migration Checklist

## Pre-Migration
- [ ] Create backup of current configurations
- [ ] Review all linting errors in current codebase
- [ ] Document custom rules currently in use
- [ ] Notify team of upcoming changes

## During Migration
- [ ] Install new dependencies
- [ ] Apply unified ESLint configuration
- [ ] Apply unified Prettier configuration
- [ ] Update Husky hooks
- [ ] Run quality gates validation
- [ ] Fix any configuration conflicts

## Post-Migration
- [ ] Run full test suite
- [ ] Verify all projects build successfully
- [ ] Update documentation
- [ ] Train team on new processes
- [ ] Monitor for 48 hours

## Rollback (if needed)
- [ ] Run rollback script
- [ ] Restore from backup
- [ ] Verify functionality restored
- [ ] Investigate failure reasons
```

## Implementación y Timeline

### Semana 1: Preparación
- [ ] Día 1-2: Revisar y validar configuraciones propuestas
- [ ] Día 3-4: Crear backup de configuraciones actuales
- [ ] Día 5: Preparar scripts de migración

### Semana 2: Implementación
- [ ] Día 1: Aplicar nuevas configuraciones ESLint/Prettier
- [ ] Día 2: Implementar nuevos Husky hooks
- [ ] Día 3: Integrar scripts de validación
- [ ] Día 4: Testing y debugging
- [ ] Día 5: Documentación y training

### Semana 3: Estabilización
- [ ] Monitoreo continuo
- [ ] Ajustes según feedback
- [ ] Optimización de performance

## Métricas de Éxito

### Técnicas
- **Zero ESLint errors** in production code
- **100% Prettier formatting compliance**
- **<5 minutes** quality gates execution
- **Zero regressions** in functionality
- **90%+ test coverage** maintained

### Proceso
- **Zero commits** with technical debt
- **<2%** false positive rate in quality gates
- **<1 minute** average pre-commit hook execution
- **100% team adoption** within 2 weeks

### Calidad
- **No security vulnerabilities** in dependencies
- **Consistent code style** across all files
- **Proper TypeScript usage** in 100% of files
- **Valid documentation links** in all markdown files

## Conclusión

Este plan de upgrade establece una base sólida para **Zero Technical Debt** mediante:

1. **Configuraciones unificadas** que eliminan inconsistencias
2. **Quality gates automáticos** que previenen regresiones
3. **Validaciones avanzadas** que detectan problemas temprano
4. **Procesos automatizados** que facilitan el desarrollo

La implementación exitosa de este plan resultará en:
- Código más limpio y mantenible
- Menos tiempo perdido en reviews de código
- Mayor confianza en la calidad del software
- Proceso de desarrollo más eficiente

**Tiempo estimado de implementación**: 2-3 semanas
**ROI esperado**: 40+ horas ahorradas mensualmente en code reviews y debugging
