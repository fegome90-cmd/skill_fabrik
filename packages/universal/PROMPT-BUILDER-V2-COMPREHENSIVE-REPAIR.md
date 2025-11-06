# PBv2-Optimized Prompt: Universal Skills Fabric Complete Repair Plan

**Target Score**: 95/100 Production Readiness
**Methodology**: CLOOP (Context, Learning, Options, Outcomes, Planning)
**Timeline**: 5-Week Execution Plan
**Priority**: CRITICAL - System Architecture Repair

---

## C1: CONTEXT (System Architecture Analysis)

### Current System State
**Universal Skills Fabric** is a critical multi-package monorepo component requiring complete architectural repair. Current assessment reveals:

**Critical Blockers:**
- **38 TypeScript errors** preventing build completion
- **Missing CLI exports** breaking command chain
- **No documentation infrastructure** (README, API docs absent)
- **Build system failure** (npm build broken, rollup partial)

**Impact Assessment:**
- **Severity**: P0 - Blocks all development workflows
- **Scope**: Universal package affecting entire Skills Fabric ecosystem
- **Timeline**: 5-week critical path for production deployment

### Technical Architecture
```
packages/universal/
├── src/
│   ├── core/
│   │   ├── port-manager.ts (38 TypeScript errors)
│   │   ├── service-manager.ts (stub functions)
│   │   └── config-manager.ts (incomplete)
│   ├── cli/
│   │   ├── commands/
│   │   │   ├── init.ts (missing exports)
│   │   │   ├── build.ts (missing exports)
│   │   │   └── deploy.ts (missing exports)
│   │   └── index.ts (broken import chain)
│   ├── templates/ (empty)
│   └── utils/ (incomplete)
├── docs/ (nonexistent)
├── tests/ (missing)
├── rollup.config.js (dependency issues)
├── package.json (incomplete)
└── README.md (missing)
```

## C2: LEARNING (Skill Activation & Pattern Recognition)

### Activated Skills Matrix
**Backend Architecture** [K:BACKEND-ARCHITECTURE] - Core system design
**API Development** [C:API-DEVELOPMENT] - Service endpoints and interfaces
**TypeScript Mastery** [EVIDENCIA:TYPE-SAFETY] - Type system resolution
**Node.js CLI** [C:CLI-DEVELOPMENT] - Command structure implementation
**Documentation Engineering** [U:USER-EXPERIENCE] - Complete documentation suite
**Testing Infrastructure** [EVIDENCIA:QUALITY-ASSURANCE] - Comprehensive testing
**Build Systems** [PROPUESTA:PRODUCTION-READY] - Optimization and deployment

### Learning from Patterns
1. **Error Pattern Recognition**: 38 TypeScript errors follow import/export mismatch pattern
2. **CLI Structure Pattern**: Missing Commander.js integration in command files
3. **Documentation Pattern**: README.md required for npm package standards
4. **Testing Pattern**: Jest configuration needed for 90% coverage target

## C3: OPTIONS (Strategic Implementation Choices)

### Phase 1: Critical Build Fixes (Week 1)
**Option A**: Incremental TypeScript fixes
- Pros: Minimal risk, systematic approach
- Cons: May miss systemic issues

**Option B**: Complete rewrite of core modules
- Pros: Clean architecture, modern patterns
- Cons: Higher risk, longer timeline

**CHOSEN**: Hybrid approach - Fix critical errors + strategic rewrites

### Phase 2-5: Progressive Implementation
- **Phase 2**: Complete functionality with robust error handling
- **Phase 3**: Documentation-first approach for user adoption
- **Phase 4**: Test-driven development for quality assurance
- **Phase 5**: Production optimization and deployment

## C4: OUTCOMES (Success Criteria & KPIs)

### Primary Success Metrics
- **Build Success**: 0 TypeScript errors, npm build passes
- **CLI Functionality**: All commands operational with proper help systems
- **Documentation**: 100% API coverage, comprehensive README
- **Test Coverage**: 90%+ unit, 80%+ integration coverage
- **Production Ready**: NPM publishable, <5s bundle size

### Secondary KPIs
- **Developer Experience**: <30s setup time, clear error messages
- **Performance**: <1s CLI response time, <10ms module loading
- **Quality Gates**: Automated linting, security audit passes
- **Ecosystem Integration**: Seamless Skills Fabric integration

## C5: PLANNING (5-Week Execution Roadmap)

---

## WEEK 1: CRITICAL BUILD FIXES

### Day 1-2: TypeScript Error Resolution
**Target**: Fix all 38 TypeScript errors

```bash
# 1. Audit current TypeScript errors
npx tsc --noEmit --listFiles | grep "error TS"

# 2. Fix port-manager.ts export issues
# File: packages/universal/src/core/port-manager.ts
export class PortManager {
  private ports: Map<string, number> = new Map();

  allocatePort(service: string): number {
    const port = this.getNextAvailablePort();
    this.ports.set(service, port);
    return port;
  }

  private getNextAvailablePort(): number {
    // Implementation logic
    return 3000 + this.ports.size;
  }
}

# 3. Fix CLI command exports
# File: packages/universal/src/cli/commands/init.ts
import { Command } from 'commander';

export const initCommand = new Command('init')
  .description('Initialize Universal Skills Fabric project')
  .option('-t, --template <type>', 'Project template type', 'default')
  .action((options) => {
    // Implementation
  });
```

### Day 3-4: Import/Export Chain Repair
```bash
# Fix main index.ts export chain
# File: packages/universal/src/index.ts
export { PortManager } from './core/port-manager';
export { ServiceManager } from './core/service-manager';
export { ConfigManager } from './core/config-manager';
export { initCommand } from './cli/commands/init';
export { buildCommand } from './cli/commands/build';
export { deployCommand } from './cli/commands/deploy';
```

### Day 5-7: Build System Optimization
```javascript
// Update rollup.config.js
import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
  input: 'src/index.ts',
  output: {
    file: 'dist/index.js',
    format: 'cjs',
    sourcemap: true
  },
  plugins: [
    nodeResolve(),
    typescript({
      tsconfig: './tsconfig.json'
    })
  ],
  external: ['commander', 'fs-extra']
};
```

**Week 1 Validation**:
```bash
# TypeScript compilation check
npx tsc --noEmit
# Should show 0 errors

# Build system test
npm run build
# Should complete successfully

# CLI command availability test
node dist/index.js --help
# Should show all commands
```

---

## WEEK 2: COMPLETE IMPLEMENTATION

### Day 8-10: Core Module Implementation
```typescript
// File: packages/universal/src/core/service-manager.ts
export class ServiceManager {
  private services: Map<string, ServiceConfig> = new Map();

  async startService(serviceName: string): Promise<void> {
    const config = this.services.get(serviceName);
    if (!config) {
      throw new Error(`Service ${serviceName} not found`);
    }

    // Implementation with proper error handling
    try {
      await this.executeService(config);
      console.log(`✅ Service ${serviceName} started successfully`);
    } catch (error) {
      console.error(`❌ Failed to start ${serviceName}:`, error);
      throw error;
    }
  }

  private async executeService(config: ServiceConfig): Promise<void> {
    // Service execution logic
  }
}
```

### Day 11-12: CLI Command Implementation
```typescript
// File: packages/universal/src/cli/commands/build.ts
import { Command } from 'commander';
import { ServiceManager } from '../../core/service-manager';

export const buildCommand = new Command('build')
  .description('Build Universal Skills Fabric project')
  .option('-w, --watch', 'Watch for changes and rebuild')
  .option('-p, --production', 'Production build optimization')
  .action(async (options) => {
    const serviceManager = new ServiceManager();

    try {
      console.log('🏗️  Starting build process...');
      await serviceManager.startService('build-service');

      if (options.watch) {
        console.log('👀 Watching for changes...');
        // Watch implementation
      }

      console.log('✅ Build completed successfully');
    } catch (error) {
      console.error('❌ Build failed:', error);
      process.exit(1);
    }
  });
```

### Day 13-14: Configuration System
```typescript
// File: packages/universal/src/core/config-manager.ts
export class ConfigManager {
  private config: UniversalConfig;

  constructor(configPath?: string) {
    this.config = this.loadConfig(configPath);
  }

  private loadConfig(configPath?: string): UniversalConfig {
    // Load configuration with validation
    const defaultConfig = {
      services: {},
      templates: {},
      buildOptions: {
        optimize: true,
        sourceMap: true
      }
    };

    return defaultConfig;
  }

  get<T = any>(key: string): T {
    return this.getNestedValue(this.config, key);
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}
```

**Week 2 Validation**:
```bash
# Test CLI commands
node dist/index.js init --template typescript
node dist/index.js build --production
node dist/index.js deploy --dry-run

# Service manager integration test
node -e "
const { ServiceManager } = require('./dist/index.js');
const sm = new ServiceManager();
sm.startService('test-service').then(() => console.log('✅ Service test passed'));
"
```

---

## WEEK 3: DOCUMENTATION INFRASTRUCTURE

### Day 15-17: Comprehensive README.md
```markdown
# Universal Skills Fabric

[![NPM Version](https://badge.fury.io/js/%40skills-fabrik%2Funiversal.svg)](https://badge.fury.io/js/%40skills-fabrik%2Funiversal)
[![Build Status](https://github.com/fegome90-cmd/skills-fabrik/workflows/CI/badge.svg)](https://github.com/fegome90-cmd/skills-fabrik/actions)
[![Coverage Status](https://coveralls.io/repos/github/fegome90-cmd/skills-fabrik/badge.svg)](https://coveralls.io/github/fegome90-cmd/skills-fabrik)

Universal Skills Fabric provides a comprehensive toolkit for building scalable, maintainable applications with the Skills Fabric methodology.

## Quick Start

\`\`\`bash
# Install Universal Skills Fabric
npm install @skills-fabrik/universal

# Initialize new project
npx @skills-fabrik/universal init my-project

# Build and deploy
cd my-project
npm run build
npm run deploy
\`\`\`

## Features

- 🏗️ **Project Scaffolding** - Multiple templates for different project types
- 🔧 **Service Management** - Automated service orchestration
- 📦 **Build Optimization** - Production-ready builds with optimization
- 📚 **Documentation Generation** - Auto-generated API documentation
- 🧪 **Testing Integration** - Comprehensive testing setup
- 🚀 **Deployment Automation** - One-command deployment to multiple platforms

## Architecture

Universal Skills Fabric follows a modular architecture with three main components:

1. **Core Services** - Port management, service orchestration, configuration
2. **CLI Interface** - Command-line tools for project management
3. **Templates System** - Project templates and scaffolding

## API Documentation

See [docs/api.md](docs/api.md) for complete API reference.

## Templates

Available project templates:

- `default` - Standard TypeScript project
- `api` - REST API with Fastify
- `webapp` - React web application
- `cli` - Command-line tool project
- `library` - NPM package project

## Configuration

Universal Skills Fabric uses a hierarchical configuration system:

\`\`\`json
{
  "services": {
    "build": {
      "tool": "rollup",
      "options": {
        "optimize": true
      }
    }
  },
  "templates": {
    "default": {
      "framework": "typescript",
      "testing": "jest"
    }
  }
}
\`\`\`

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
```

### Day 18-19: API Documentation
```markdown
# API Documentation

## Core Classes

### PortManager

Manages port allocation for services.

\`\`\`typescript
import { PortManager } from '@skills-fabrik/universal';

const portManager = new PortManager();
const port = portManager.allocatePort('my-service');
console.log(\`Service allocated port: \${port}\`);
\`\`\`

#### Methods

- \`allocatePort(service: string): number\` - Allocate port for service
- \`releasePort(service: string): void\` - Release allocated port
- \`getPort(service: string): number | undefined\` - Get service port

### ServiceManager

Manages service lifecycle and orchestration.

\`\`\`typescript
import { ServiceManager } from '@skills-fabrik/universal';

const serviceManager = new ServiceManager();
await serviceManager.startService('build-service');
\`\`\`

#### Methods

- \`startService(serviceName: string): Promise<void>\` - Start service
- \`stopService(serviceName: string): Promise<void>\` - Stop service
- \`restartService(serviceName: string): Promise<void>\` - Restart service
- \`getServiceStatus(serviceName: string): ServiceStatus\` - Get service status

### ConfigManager

Manages configuration loading and validation.

\`\`\`typescript
import { ConfigManager } from '@skills-fabrik/universal';

const config = new ConfigManager('./config.json');
const buildOptions = config.get('services.build.options');
\`\`\`

#### Methods

- \`get<T>(key: string): T\` - Get configuration value
- \`set(key: string, value: any): void\` - Set configuration value
- \`validate(): boolean\` - Validate configuration
- \`reload(): void\` - Reload configuration from file
```

### Day 20-21: Architecture Documentation
```markdown
# Architecture Guide

## System Overview

Universal Skills Fabric implements a modular architecture based on the CLOOP methodology (Context, Learning, Options, Outcomes, Planning).

## Core Components

### 1. Port Management System
- Dynamic port allocation
- Service isolation
- Port conflict resolution

### 2. Service Orchestration
- Service lifecycle management
- Health monitoring
- Auto-recovery mechanisms

### 3. Configuration Management
- Hierarchical configuration
- Environment-specific settings
- Runtime configuration updates

### 4. Template System
- Project scaffolding
- Template inheritance
- Custom template creation

## Design Patterns

### Service Registry Pattern
Services register themselves with the central registry for discovery and management.

### Configuration Provider Pattern
Configuration is provided through a layered system allowing overrides and environment-specific values.

### Template Engine Pattern
Templates use a composable system for flexible project generation.

## Performance Considerations

- Lazy loading of services
- Configuration caching
- Port pooling for allocation performance
- Template compilation optimization

## Security Considerations

- Port allocation validation
- Configuration sanitization
- Template security scanning
- Service isolation
```

**Week 3 Validation**:
```bash
# Documentation completeness check
find docs/ -name "*.md" | wc -l  # Should be >5 files

# README.md quality test
head -20 README.md | grep -E "(Quick Start|Installation|Features)"

# API documentation generation
npm run docs:generate  # Should complete without errors

# Documentation link validation
markdown-link-check docs/*.md
```

---

## WEEK 4: TESTING INFRASTRUCTURE

### Day 22-24: Jest Configuration and Unit Tests
```javascript
// File: packages/universal/jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  coverageReporters: ['text', 'lcov', 'html'],
};
```

```typescript
// File: packages/universal/src/core/__tests__/port-manager.spec.ts
import { PortManager } from '../port-manager';

describe('PortManager', () => {
  let portManager: PortManager;

  beforeEach(() => {
    portManager = new PortManager();
  });

  describe('allocatePort', () => {
    it('should allocate unique ports for different services', () => {
      const port1 = portManager.allocatePort('service1');
      const port2 = portManager.allocatePort('service2');

      expect(port1).toBe(3000);
      expect(port2).toBe(3001);
      expect(port1).not.toBe(port2);
    });

    it('should return same port for same service', () => {
      const port1 = portManager.allocatePort('service1');
      const port2 = portManager.allocatePort('service1');

      expect(port1).toBe(port2);
    });

    it('should throw error for invalid service name', () => {
      expect(() => portManager.allocatePort('')).toThrow();
    });
  });

  describe('releasePort', () => {
    it('should release allocated port', () => {
      const port = portManager.allocatePort('service1');
      portManager.releasePort('service1');

      const newPort = portManager.allocatePort('service3');
      expect(newPort).toBe(port); // Should reuse released port
    });
  });
});
```

### Day 25-26: Integration Tests
```typescript
// File: packages/universal/tests/integration/cli-commands.spec.ts
import { execSync } from 'child_process';
import { existsSync, rmSync } from 'fs';

describe('CLI Commands Integration', () => {
  const testProjectDir = './test-project-temp';

  afterEach(() => {
    if (existsSync(testProjectDir)) {
      rmSync(testProjectDir, { recursive: true, force: true });
    }
  });

  describe('init command', () => {
    it('should initialize new project with default template', () => {
      execSync(`node dist/index.js init ${testProjectDir}`, { cwd: process.cwd() });

      expect(existsSync(`${testProjectDir}/package.json`)).toBe(true);
      expect(existsSync(`${testProjectDir}/src/index.ts`)).toBe(true);
      expect(existsSync(`${testProjectDir}/README.md`)).toBe(true);
    });

    it('should initialize project with specific template', () => {
      execSync(`node dist/index.js init ${testProjectDir} --template api`, { cwd: process.cwd() });

      expect(existsSync(`${testProjectDir}/src/routes/index.ts`)).toBe(true);
      expect(existsSync(`${testProjectDir}/src/middleware/index.ts`)).toBe(true);
    });
  });

  describe('build command', () => {
    beforeEach(() => {
      execSync(`node dist/index.js init ${testProjectDir}`, { cwd: process.cwd() });
    });

    it('should build project successfully', () => {
      execSync('node dist/index.js build', { cwd: testProjectDir });

      expect(existsSync(`${testProjectDir}/dist/index.js`)).toBe(true);
      expect(existsSync(`${testProjectDir}/dist/index.js.map`)).toBe(true);
    });
  });
});
```

### Day 27-28: E2E Tests
```typescript
// File: packages/universal/tests/e2e/complete-workflow.spec.ts
import { execSync } from 'child_process';
import { existsSync, readFileSync, rmSync } from 'fs';
import { join } from 'path';

describe('Complete Workflow E2E', () => {
  const testDir = './e2e-test-temp';

  afterAll(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should complete full project lifecycle', async () => {
    // 1. Initialize project
    execSync(`node dist/index.js init ${testDir} --template webapp`, { cwd: process.cwd() });
    expect(existsSync(join(testDir, 'package.json'))).toBe(true);

    // 2. Install dependencies
    execSync('npm install', { cwd: testDir });

    // 3. Run tests
    execSync('npm test', { cwd: testDir });

    // 4. Build project
    execSync('npm run build', { cwd: testDir });
    expect(existsSync(join(testDir, 'dist/index.html'))).toBe(true);

    // 5. Start development server
    const serverProcess = execSync('npm run dev', { cwd: testDir, stdio: 'pipe' });

    // 6. Run deployment dry-run
    execSync('node dist/index.js deploy --dry-run', { cwd: testDir });

    expect(true).toBe(true); // If we reach here, workflow completed successfully
  }, 60000); // 60 second timeout
});
```

**Week 4 Validation**:
```bash
# Run unit tests with coverage
npm run test:unit
# Expect: 90%+ coverage

# Run integration tests
npm run test:integration
# Expect: All tests passing

# Run E2E tests
npm run test:e2e
# Expect: Complete workflow success

# Generate coverage report
npm run test:coverage
# Verify: coverage/lcov-report/index.html exists
```

---

## WEEK 5: QUALITY ASSURANCE & RELEASE

### Day 29-30: Quality Gates Implementation
```json
// File: packages/universal/.eslintrc.json
{
  "extends": [
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-explicit-any": "warn",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

```json
// File: packages/universal/package.json (scripts section)
{
  "scripts": {
    "quality:gates": "npm run lint && npm run type-check && npm run security:audit",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix",
    "type-check": "tsc --noEmit",
    "security:audit": "npm audit --audit-level moderate",
    "pre-commit": "npm run quality:gates && npm run test:unit"
  }
}
```

### Day 31-32: CI/CD Pipeline Setup
```yaml
# File: .github/workflows/universal-ci.yml
name: Universal Skills Fabric CI

on:
  push:
    branches: [main, develop]
    paths: ['packages/universal/**']
  pull_request:
    branches: [main]
    paths: ['packages/universal/**']

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20]

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: |
          cd packages/universal
          npm ci

      - name: Run quality gates
        run: |
          cd packages/universal
          npm run quality:gates

      - name: Run tests
        run: |
          cd packages/universal
          npm run test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./packages/universal/coverage/lcov.info
```

### Day 33-35: Production Optimization
```javascript
// File: packages/universal/rollup.config.prod.js
import { terser } from 'rollup-plugin-terser';
import typescript from '@rollup/plugin-typescript';

export default {
  input: 'src/index.ts',
  output: {
    file: 'dist/index.min.js',
    format: 'cjs',
    sourcemap: false
  },
  plugins: [
    typescript({
      tsconfig: './tsconfig.prod.json'
    }),
    terser({
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    })
  ],
  external: ['commander', 'fs-extra']
};
```

```json
// File: packages/universal/tsconfig.prod.json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "removeComments": true,
    "sourceMap": false,
    "declaration": false,
    "target": "ES2020",
    "module": "commonjs"
  }
}
```

### Day 36-37: NPM Publishing Preparation
```json
// File: packages/universal/package.json (final)
{
  "name": "@skills-fabrik/universal",
  "version": "1.0.0",
  "description": "Universal Skills Fabric - Comprehensive toolkit for scalable applications",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "bin": {
    "universal": "dist/cli/index.js"
  },
  "files": [
    "dist/",
    "templates/",
    "docs/",
    "README.md",
    "LICENSE"
  ],
  "scripts": {
    "build": "rollup -c",
    "build:prod": "rollup -c rollup.config.prod.js",
    "test": "jest",
    "test:unit": "jest --testPathPattern=unit",
    "test:integration": "jest --testPathPattern=integration",
    "test:e2e": "jest --testPathPattern=e2e",
    "test:coverage": "jest --coverage",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix",
    "type-check": "tsc --noEmit",
    "quality:gates": "npm run lint && npm run type-check && npm run test:unit",
    "prepublishOnly": "npm run build && npm run test && npm run quality:gates",
    "docs:generate": "typedoc src/index.ts",
    "release": "npm version patch && npm publish"
  },
  "keywords": [
    "skills-fabric",
    "universal",
    "cli",
    "scaffolding",
    "typescript",
    "nodejs"
  ],
  "repository": {
    "type": "git",
    "url": "https://github.com/fegome90-cmd/skills-fabrik.git",
    "directory": "packages/universal"
  },
  "author": "Skills Fabric Team",
  "license": "MIT",
  "engines": {
    "node": ">=18.0.0"
  },
  "dependencies": {
    "commander": "^11.0.0",
    "fs-extra": "^11.1.1",
    "chalk": "^5.3.0",
    "ora": "^7.0.1"
  },
  "devDependencies": {
    "@types/jest": "^29.5.5",
    "@types/node": "^20.6.0",
    "@typescript-eslint/eslint-plugin": "^6.7.0",
    "@typescript-eslint/parser": "^6.7.0",
    "eslint": "^8.49.0",
    "jest": "^29.7.0",
    "rollup": "^3.29.0",
    "rollup-plugin-terser": "^7.0.2",
    "rollup-plugin-typescript2": "^0.35.0",
    "ts-jest": "^29.1.1",
    "typedoc": "^0.25.1",
    "typescript": "^5.2.2"
  }
}
```

**Week 5 Validation**:
```bash
# Quality gates validation
npm run quality:gates
# Expect: All checks pass

# Production build test
npm run build:prod
# Expect: Minified bundle <5MB

# NPM package validation
npm pack --dry-run
# Verify: package contains correct files

# Local installation test
npm pack
npm install ./skills-fabrik-universal-1.0.0.tgz
# Verify: Installation succeeds, commands available

# Release readiness check
npm run prepublishOnly
# Expect: All checks pass, ready for NPM publish
```

---

## EXECUTION COMMANDS

### Phase 1 Commands (Week 1)
```bash
# 1. Fix TypeScript errors
cd packages/universal
npx tsc --noEmit --listFiles > errors.log
# Fix each error systematically

# 2. Update exports
# Edit src/core/port-manager.ts, service-manager.ts, config-manager.ts
# Add proper exports and fix type definitions

# 3. Fix CLI commands
# Edit src/cli/commands/*.ts
# Implement Commander.js integration

# 4. Update build system
# Edit rollup.config.js and tsconfig.json
# Ensure proper dependency handling

# 5. Validate fixes
npm run build
npm run type-check
```

### Phase 2 Commands (Week 2)
```bash
# 1. Implement core modules
# Complete service-manager.ts, config-manager.ts functionality
# Add proper error handling and validation

# 2. Complete CLI commands
# Implement init, build, deploy commands with full functionality

# 3. Test implementation
node dist/index.js --help
node dist/index.js init test-project
node dist/index.js build --production
```

### Phase 3 Commands (Week 3)
```bash
# 1. Create documentation
mkdir -p docs
# Create README.md, API docs, architecture guide

# 2. Generate API documentation
npm install -g typedoc
npm run docs:generate

# 3. Validate documentation
markdown-link-check docs/*.md
npm run docs:validate
```

### Phase 4 Commands (Week 4)
```bash
# 1. Setup testing
npm install --save-dev jest @types/jest ts-jest
# Create jest.config.js

# 2. Write tests
# Create unit tests for all modules
# Create integration tests for CLI commands
# Create E2E tests for complete workflows

# 3. Run test suite
npm run test:coverage
# Expect: 90%+ coverage
```

### Phase 5 Commands (Week 5)
```bash
# 1. Setup quality gates
npm install --save-dev eslint @typescript-eslint/eslint-plugin
# Create .eslintrc.json

# 2. Optimize for production
# Create rollup.config.prod.js
# Update tsconfig.prod.json

# 3. Prepare for release
npm run prepublishOnly
npm pack --dry-run

# 4. Final validation
npm run quality:gates
npm run test:coverage
npm run build:prod
```

---

## SUCCESS METRICS

### Weekly Deliverables
- **Week 1**: 0 TypeScript errors, successful npm build
- **Week 2**: All CLI commands functional, core modules complete
- **Week 3**: Complete documentation suite (README, API, architecture)
- **Week 4**: 90%+ test coverage, all tests passing
- **Week 5**: Production-ready package, NPM publishable

### Final KPI Targets
- **TypeScript Errors**: 0/38 resolved
- **Build Success**: 100% (npm build passes)
- **Test Coverage**: 90%+ unit, 80%+ integration
- **Documentation**: 100% API coverage
- **Bundle Size**: <5MB optimized
- **CLI Response**: <1s command execution
- **Quality Gates**: All automated checks passing

### Validation Checklist
- [ ] TypeScript compilation succeeds (0 errors)
- [ ] npm build completes successfully
- [ ] All CLI commands operational
- [ ] Complete documentation exists
- [ ] Test coverage meets targets
- [ ] Quality gates all pass
- [ ] Production build optimized
- [ ] NPM package publishable
- [ ] E2E workflows complete successfully

---

**Ready for immediate execution** - This comprehensive PBv2-optimized prompt provides complete guidance for transforming Universal Skills Fabric from its current critical state to a production-ready, fully documented, and thoroughly tested package within 5 weeks.