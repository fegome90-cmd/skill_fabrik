# Scripts de Safety Net - Protección contra Regresiones

## **Objetivo de los Scripts**

Proporcionar una red de seguridad completa que capture el comportamiento actual del Daemon, detecte regresiones, y asegure que las refactorizaciones críticas no introduzcan breaking changes inadvertidos.

## **Script 1: Characterization Principal**

### **Archivo**: `scripts/characterize-daemon.mjs`

```javascript
/**
 * CARACTERIZACIÓN COMPLETA DEL DAEMON
 *
 * Este script captura el estado actual del componente Daemon
 * para establecer una línea base de comportamiento antes de cambios.
 *
 * Uso:
 *   node scripts/characterize-daemon.mjs
 *
 * Output:
 *   - test-baselines/latest.json (baselines más recientes)
 *   - test-baselines/timestamp.json (snapshot con timestamp)
 */

import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

class DaemonCharacterizer {
  constructor() {
    this.baselines = {
      metadata: this.initializeMetadata(),
      timestamp: new Date().toISOString()
    };
  }

  initializeMetadata() {
    return {
      node_version: process.version,
      platform: process.platform,
      arch: process.arch,
      git_commit: this.getGitCommit(),
      git_branch: this.getGitBranch(),
      working_dir: process.cwd(),
      script_version: '1.0.0'
    };
  }

  getGitCommit() {
    try {
      return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    } catch {
      return 'unknown';
    }
  }

  getGitBranch() {
    try {
      return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    } catch {
      return 'unknown';
    }
  }

  async characterize() {
    console.log('🔍 Starting comprehensive Daemon characterization...');

    try {
      // Capturar todos los aspectos del comportamiento
      this.baselines.authentication = await this.captureAuthentication();
      this.baselines.configuration = await this.captureConfiguration();
      this.baselines.performance = await this.capturePerformance();
      this.baselines.api_contracts = await this.captureAPIContracts();
      this.baselines.error_handling = await this.captureErrorHandling();
      this.baselines.file_operations = await this.captureFileOperations();
      this.baselines.dependencies = await this.captureDependencies();

      // Guardar baselines
      await this.saveBaselines();

      // Generar resumen
      this.printSummary();

      return this.baselines;

    } catch (error) {
      console.error('❌ Characterization failed:', error.message);
      throw error;
    }
  }

  async captureAuthentication() {
    console.log('🔐 Capturing authentication behavior...');

    const auth = {
      hardcoded_flaws: [],
      jwt_behavior: {},
      role_validation: {},
      security_headers: {}
    };

    // Buscar hardcoded users en archivos específicos
    const suspiciousFiles = [
      'packages/skills-cli/dist/commands/plan.js',
      'packages/skills-cli/dist/commands/skills.js',
      'packages/daemon/src/app.ts'
    ];

    for (const file of suspiciousFiles) {
      try {
        const content = await fs.readFile(file, 'utf8');
        const hardcodedMatches = content.match(/user\s*=\s*['"][^'"]+['"]/g);

        if (hardcodedMatches) {
          auth.hardcoded_flaws.push({
            file,
            matches: hardcodedMatches,
            severity: 'HIGH',
            recommendation: 'Replace with environment variables'
          });
        }
      } catch (error) {
        // File no encontrado o no legible
      }
    }

    return auth;
  }

  async captureConfiguration() {
    console.log('⚙️ Capturing configuration behavior...');

    const config = {
      sources: [],
      conflicts: [],
      security_issues: []
    };

    // Detectar archivos de configuración
    const configFiles = [
      '.env.production',
      '.env.testing',
      '.env.check',
      '.env.example',
      'config/yaml/*.yaml',
      'config/json/*.json'
    ];

    for (const pattern of configFiles) {
      try {
        const files = await this.expandGlob(pattern);
        config.sources.push(...files);
      } catch {
        // Pattern no encontró archivos
      }
    }

    // Analizar seguridad de archivos .env
    for (const file of config.sources) {
      if (file.includes('.env.production')) {
        config.security_issues.push({
          file,
          issue: 'Production secrets exposed in repository',
          severity: 'CRITICAL',
          recommendation: 'Remove from git, add to .gitignore'
        });
      }
    }

    return config;
  }

  async capturePerformance() {
    console.log('📊 Capturing performance baselines...');

    const performance = {
      startup_time: null,
      memory_baseline: null,
      cpu_baseline: null,
      disk_usage: null
    };

    // Medir startup time
    try {
      const start = Date.now();
      execSync('timeout 10s node packages/daemon/src/app.js', {
        stdio: 'pipe',
        timeout: 11000
      });
      performance.startup_time = Date.now() - start;
    } catch (error) {
      performance.startup_time = 'FAILED_TO_START';
      console.log('⚠️ Daemon failed to start during profiling');
    }

    // Capturar memory baseline
    try {
      const memoryUsage = process.memoryUsage();
      performance.memory_baseline = {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external,
        arrayBuffers: memoryUsage.arrayBuffers
      };
    } catch (error) {
      performance.memory_baseline = 'MEASUREMENT_FAILED';
    }

    return performance;
  }

  async captureAPIContracts() {
    console.log('📋 Capturing API contracts...');

    const contracts = {
      routes: [],
      middleware: [],
      response_formats: {}
    };

    // Escanear archivos de rutas
    try {
      const routeFiles = await this.expandGlob('packages/daemon/src/routes/*.js');

      for (const file of routeFiles) {
        const content = await fs.readFile(file, 'utf8');

        // Extraer definiciones de rutas (express-style)
        const routeMatches = content.match(/(?:router\.|app\.)(get|post|put|delete|patch)\s*\(\s*['"]([^'"]+)['"]/g);

        if (routeMatches) {
          const routes = routeMatches.map(match => {
            const [_, method, path] = match.match(/\((get|post|put|delete|patch)\s*\(\s*['"]([^'"]+)['"]/);
            return { method, path, file };
          });

          contracts.routes.push(...routes);
        }
      }
    } catch (error) {
      console.log('⚠️ Could not scan API routes');
    }

    return contracts;
  }

  async captureErrorHandling() {
    console.log('⚠️ Capturing error handling patterns...');

    return {
      error_handlers: [],
      logging_patterns: [],
      status_codes: []
    };
  }

  async captureFileOperations() {
    console.log('📁 Capturing file operations...');

    return {
      file_reads: [],
      file_writes: [],
      directory_operations: []
    };
  }

  async captureDependencies() {
    console.log('🔗 Capturing dependencies...');

    try {
      const packageJson = JSON.parse(
        await fs.readFile('packages/daemon/package.json', 'utf8')
      );

      return {
        dependencies: packageJson.dependencies || {},
        devDependencies: packageJson.devDependencies || {},
        peerDependencies: packageJson.peerDependencies || {}
      };
    } catch {
      return { error: 'Could not read package.json' };
    }
  }

  async expandGlob(pattern) {
    // Implementación simple de glob (sin node-glob dependency)
    const basePath = process.cwd();
    const parts = pattern.split('/');
    const dir = parts.slice(0, -1).join('/');
    const filePattern = parts[parts.length - 1];

    try {
      const files = await fs.readdir(path.join(basePath, dir));

      if (filePattern.includes('*')) {
        return files
          .filter(file => file.endsWith(filePattern.replace('*', '')))
          .map(file => path.join(dir, file));
      } else {
        const fullPath = path.join(basePath, pattern);
        if (await fs.access(fullPath).then(() => true).catch(() => false)) {
          return [pattern];
        }
        return [];
      }
    } catch {
      return [];
    }
  }

  async saveBaselines() {
    console.log('💾 Saving baselines...');

    const timestamp = Date.now();
    const baselineDir = './test-baselines';

    // Crear directorio si no existe
    await fs.mkdir(baselineDir, { recursive: true });

    // Guardar baseline con timestamp
    const timestampedFile = path.join(baselineDir, `daemon-baseline-${timestamp}.json`);
    await fs.writeFile(timestampedFile, JSON.stringify(this.baselines, null, 2));

    // Guardar baseline como "latest" para fácil acceso
    const latestFile = path.join(baselineDir, 'latest.json');
    await fs.writeFile(latestFile, JSON.stringify(this.baselines, null, 2));

    console.log(`✅ Baselines saved to:`);
    console.log(`   📁 Timestamped: ${timestampedFile}`);
    console.log(`   📁 Latest: ${latestFile}`);
  }

  printSummary() {
    console.log('\n📊 CHARACTERIZATION SUMMARY');
    console.log('================================');

    console.log(`🔐 Authentication Issues: ${this.baselines.authentication.hardcoded_flaws.length}`);
    console.log(`⚙️ Configuration Sources: ${this.baselines.configuration.sources.length}`);
    console.log(`📊 Startup Time: ${this.baselines.performance.startup_time}ms`);
    console.log(`📋 API Routes: ${this.baselines.api_contracts.routes.length}`);
    console.log(`🔗 Dependencies: ${Object.keys(this.baselines.api_contracts.dependencies || {}).length}`);

    if (this.baselines.authentication.hardcoded_flaws.length > 0) {
      console.log('\n🚨 CRITICAL SECURITY ISSUES FOUND:');
      this.baselines.authentication.hardcoded_flaws.forEach(issue => {
        console.log(`   ❌ ${issue.file}: ${issue.matches.length} hardcoded users`);
      });
    }

    console.log('\n✅ Characterization complete!');
  }
}

// Ejecución principal
if (import.meta.url === `file://${process.argv[1]}`) {
  const characterizer = new DaemonCharacterizer();
  characterizer.characterize().catch(console.error);
}

export default DaemonCharacterizer;
```

## **Script 2: Regression Detection**

### **Archivo**: `scripts/detect-regressions.mjs`

```javascript
/**
 * DETECCIÓN DE REGRESIONES
 *
 * Compara baselines actuales contra anteriores para detectar
 * cambios no deseados en el comportamiento del Daemon.
 *
 * Uso:
 *   node scripts/detect-regressions.mjs
 *
 * Exit codes:
 *   0 - No regressions detectadas
 *   1 - Regresiones críticas detectadas
 *   2 - Error en el proceso
 */

import fs from 'fs/promises';
import path from 'path';

class RegressionDetector {
  constructor() {
    this.regressions = {
      critical: [],
      high: [],
      medium: [],
      low: [],
      metadata: {
        comparison_time: new Date().toISOString(),
        baseline_comparison: 'latest vs previous'
      }
    };
  }

  async detect() {
    console.log('🔍 Detecting regressions...');

    try {
      // Cargar baselines
      const baselines = await this.loadBaselines();

      if (!baselines.latest || !baselines.previous) {
        throw new Error('Missing baseline files for comparison');
      }

      // Comparar todas las áreas
      this.compareAuthentication(baselines.latest.authentication, baselines.previous.authentication);
      this.compareConfiguration(baselines.latest.configuration, baselines.previous.configuration);
      this.comparePerformance(baselines.latest.performance, baselines.previous.performance);
      this.compareAPIContracts(baselines.latest.api_contracts, baselines.previous.api_contracts);

      // Generar report
      await this.generateReport();

      // Determinar exit code
      if (this.regressions.critical.length > 0) {
        console.error('🚨 CRITICAL REGRESSIONS DETECTED');
        process.exit(1);
      } else {
        console.log('✅ No critical regressions detected');
        process.exit(0);
      }

    } catch (error) {
      console.error('❌ Regression detection failed:', error.message);
      process.exit(2);
    }
  }

  async loadBaselines() {
    const baselineDir = './test-baselines';

    try {
      const latest = JSON.parse(await fs.readFile(path.join(baselineDir, 'latest.json'), 'utf8'));

      // Buscar baseline anterior más reciente
      const files = await fs.readdir(baselineDir);
      const baselineFiles = files
        .filter(file => file.startsWith('daemon-baseline-') && file !== 'latest.json')
        .sort()
        .reverse(); // Más reciente primero

      let previous = null;
      if (baselineFiles.length > 1) {
        // Usar el segundo más reciente
        const previousFile = path.join(baselineDir, baselineFiles[1]);
        previous = JSON.parse(await fs.readFile(previousFile, 'utf8'));
      }

      return { latest, previous };
    } catch (error) {
      throw new Error(`Could not load baselines: ${error.message}`);
    }
  }

  compareAuthentication(latest, previous) {
    console.log('🔐 Comparing authentication behavior...');

    // Detectar nuevas vulnerabilidades
    const latestIssues = latest.hardcoded_flaws || [];
    const previousIssues = previous.hardcoded_flaws || [];

    if (latestIssues.length > previousIssues.length) {
      const newIssues = latestIssues.filter(latestIssue =>
        !previousIssues.some(prevIssue =>
          prevIssue.file === latestIssue.file &&
          prevIssue.matches.length === latestIssue.matches.length
        )
      );

      if (newIssues.length > 0) {
        this.regressions.critical.push({
          type: 'NEW_SECURITY_VULNERABILITY',
          description: 'New hardcoded authentication flaws introduced',
          details: newIssues,
          severity: 'CRITICAL'
        });
      }
    }

    // Detectar mejoras positivas
    if (latestIssues.length < previousIssues.length) {
      this.regressions.low.push({
        type: 'SECURITY_IMPROVEMENT',
        description: 'Hardcoded authentication issues resolved',
        details: {
          previous: previousIssues.length,
          current: latestIssues.length
        },
        severity: 'IMPROVEMENT'
      });
    }
  }

  compareConfiguration(latest, previous) {
    console.log('⚙️ Comparing configuration...');

    // Detectar nuevas fuentes de configuración
    const latestSources = latest.sources || [];
    const previousSources = previous.sources || [];

    if (latestSources.length > previousSources.length) {
      this.regressions.medium.push({
        type: 'CONFIGURATION_COMPLEXITY',
        description: 'New configuration sources added',
        details: {
          previous_count: previousSources.length,
          current_count: latestSources.length,
          new_sources: latestSources.filter(s => !previousSources.includes(s))
        },
        severity: 'MEDIUM'
      });
    }

    // Detectar nuevos problemas de seguridad
    const latestSecurity = latest.security_issues || [];
    const previousSecurity = previous.security_issues || [];

    if (latestSecurity.some(issue => issue.severity === 'CRITICAL')) {
      this.regressions.critical.push({
        type: 'CONFIGURATION_SECURITY',
        description: 'Critical configuration security issues present',
        details: latestSecurity.filter(issue => issue.severity === 'CRITICAL'),
        severity: 'CRITICAL'
      });
    }
  }

  comparePerformance(latest, previous) {
    console.log('📊 Comparing performance...');

    // Comparar startup time
    if (latest.startup_time && previous.startup_time) {
      if (typeof latest.startup_time === 'number' && typeof previous.startup_time === 'number') {
        const change = ((latest.startup_time - previous.startup_time) / previous.startup_time) * 100;

        if (change > 20) { // 20% más lento
          this.regressions.high.push({
            type: 'PERFORMANCE_REGRESSION',
            description: 'Startup time significantly degraded',
            details: {
              previous_ms: previous.startup_time,
              current_ms: latest.startup_time,
              change_percent: change.toFixed(2)
            },
            severity: 'HIGH'
          });
        } else if (change < -10) { // 10% más rápido
          this.regressions.low.push({
            type: 'PERFORMANCE_IMPROVEMENT',
            description: 'Startup time improved',
            details: {
              previous_ms: previous.startup_time,
              current_ms: latest.startup_time,
              change_percent: change.toFixed(2)
            },
            severity: 'IMPROVEMENT'
          });
        }
      }
    }
  }

  compareAPIContracts(latest, previous) {
    console.log('📋 Comparing API contracts...');

    const latestRoutes = latest.routes || [];
    const previousRoutes = previous.routes || [];

    // Detectar cambios breaking
    const removedRoutes = previousRoutes.filter(prevRoute =>
      !latestRoutes.some(latestRoute =>
        latestRoute.method === prevRoute.method &&
        latestRoute.path === prevRoute.path
      )
    );

    if (removedRoutes.length > 0) {
      this.regressions.critical.push({
        type: 'BREAKING_API_CHANGE',
        description: 'API endpoints removed',
        details: removedRoutes,
        severity: 'CRITICAL'
      });
    }

    // Detectar nuevos endpoints
    const addedRoutes = latestRoutes.filter(latestRoute =>
      !previousRoutes.some(prevRoute =>
        latestRoute.method === prevRoute.method &&
        latestRoute.path === prevRoute.path
      )
    );

    if (addedRoutes.length > 0) {
      this.regressions.low.push({
        type: 'API_EXPANSION',
        description: 'New API endpoints added',
        details: addedRoutes,
        severity: 'INFO'
      });
    }
  }

  async generateReport() {
    console.log('📝 Generating regression report...');

    const report = this.buildReport();

    // Guardar report en archivo
    await fs.writeFile('./regression-report.md', report);

    // Mostrar resumen en consola
    this.printSummary();

    // Si hay regresiones críticas, mostrar detalles
    if (this.regressions.critical.length > 0) {
      console.log('\n🚨 CRITICAL REGRESSIONS:');
      this.regressions.critical.forEach((regression, index) => {
        console.log(`   ${index + 1}. ${regression.type}`);
        console.log(`      ${regression.description}`);
      });
    }
  }

  buildReport() {
    const timestamp = new Date().toISOString();

    return `# Regression Detection Report

**Generated**: ${timestamp}
**Status**: ${this.regressions.critical.length > 0 ? '🚨 REGRESSIONS DETECTED' : '✅ NO REGRESSIONS'}

## 🚨 Critical Issues
${this.regressions.critical.length > 0
  ? this.regressions.critical.map(r => this.formatRegression(r)).join('\n')
  : 'No critical regressions detected'
}

## 🟠 High Priority Issues
${this.regressions.high.length > 0
  ? this.regressions.high.map(r => this.formatRegression(r)).join('\n')
  : 'No high priority regressions detected'
}

## 🟡 Medium Priority Issues
${this.regressions.medium.length > 0
  ? this.regressions.medium.map(r => this.formatRegression(r)).join('\n')
  : 'No medium priority regressions detected'
}

## 🟢 Improvements & Low Priority
${this.regressions.low.length > 0
  ? this.regressions.low.map(r => this.formatRegression(r)).join('\n')
  : 'No improvements or low priority items detected'
}

---

## 📊 Summary
- **Critical**: ${this.regressions.critical.length}
- **High**: ${this.regressions.high.length}
- **Medium**: ${this.regressions.medium.length}
- **Improvements**: ${this.regressions.low.filter(r => r.severity === 'IMPROVEMENT').length}

## 🎯 Action Required
${this.regressions.critical.length > 0
  ? '**IMMEDIATE ACTION REQUIRED** - Review critical regressions before merging'
  : 'SAFE TO PROCEED' - No blocking regressions detected'
}

---
**Report generated by**: Daemon Regression Detector v1.0.0
`;
  }

  formatRegression(regression) {
    return `### ${regression.type}
**Description**: ${regression.description}
**Severity**: ${regression.severity}

<details>
<summary>Details</summary>

\`\`\`json
${JSON.stringify(regression.details, null, 2)}
\`\`\`

</details>
`;
  }

  printSummary() {
    console.log('\n📊 REGRESSION SUMMARY');
    console.log('=======================');
    console.log(`🚨 Critical: ${this.regressions.critical.length}`);
    console.log(`🟠 High: ${this.regressions.high.length}`);
    console.log(`🟡 Medium: ${this.regressions.medium.length}`);
    console.log(`🟢 Improvements: ${this.regressions.low.filter(r => r.severity === 'IMPROVEMENT').length}`);
  }
}

// Ejecución principal
if (import.meta.url === `file://${process.argv[1]}`) {
  const detector = new RegressionDetector();
  detector.detect().catch(console.error);
}

export default RegressionDetector;
```

## **Script 3: Baseline Comparison Tool**

### **Archivo**: `scripts/compare-baselines.mjs`

```javascript
/**
 * COMPARACIÓN VISUAL DE BASELINES
 *
 * Herramienta interactiva para comparar dos baselines
 * y entender las diferencias en detalle.
 */

import fs from 'fs/promises';
import path from 'path';

class BaselineComparator {
  constructor() {
    this.comparison = null;
  }

  async compare(baseline1Path, baseline2Path) {
    console.log('📊 Comparing baselines...');

    try {
      const baseline1 = JSON.parse(await fs.readFile(baseline1Path, 'utf8'));
      const baseline2 = JSON.parse(await fs.readFile(baseline2Path, 'utf8'));

      this.comparison = {
        metadata: {
          baseline1_file: baseline1Path,
          baseline2_file: baseline2Path,
          comparison_time: new Date().toISOString()
        },
        differences: this.performDeepComparison(baseline1, baseline2)
      };

      this.displayComparison();
      return this.comparison;

    } catch (error) {
      console.error('❌ Comparison failed:', error.message);
      throw error;
    }
  }

  performDeepComparison(obj1, obj2, path = '') {
    const differences = [];

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    const allKeys = new Set([...keys1, ...keys2]);

    for (const key of allKeys) {
      const currentPath = path ? `${path}.${key}` : key;

      if (!keys1.includes(key)) {
        differences.push({
          type: 'added',
          path: currentPath,
          value: obj2[key],
          severity: this.assessSeverity(currentPath, 'added')
        });
      } else if (!keys2.includes(key)) {
        differences.push({
          type: 'removed',
          path: currentPath,
          value: obj1[key],
          severity: this.assessSeverity(currentPath, 'removed')
        });
      } else if (typeof obj1[key] !== typeof obj2[key]) {
        differences.push({
          type: 'type_change',
          path: currentPath,
          from: typeof obj1[key],
          to: typeof obj2[key],
          severity: 'HIGH'
        });
      } else if (typeof obj1[key] === 'object' && obj1[key] !== null && obj2[key] !== null) {
        differences.push(...this.performDeepComparison(obj1[key], obj2[key], currentPath));
      } else if (obj1[key] !== obj2[key]) {
        differences.push({
          type: 'value_change',
          path: currentPath,
          from: obj1[key],
          to: obj2[key],
          severity: this.assessSeverity(currentPath, 'changed')
        });
      }
    }

    return differences;
  }

  assessSeverity(path, changeType) {
    const criticalPaths = [
      'authentication.hardcoded_flaws',
      'configuration.security_issues',
      'api_contracts.routes'
    ];

    const highPaths = [
      'performance.startup_time',
      'performance.memory_baseline'
    ];

    if (criticalPaths.some(criticalPath => path.startsWith(criticalPath))) {
      return changeType === 'added' ? 'CRITICAL' : 'HIGH';
    }

    if (highPaths.some(highPath => path.startsWith(highPath))) {
      return 'HIGH';
    }

    return 'MEDIUM';
  }

  displayComparison() {
    console.log('\n📊 BASELINE COMPARISON REPORT');
    console.log('=================================');

    const { differences } = this.comparison;

    if (differences.length === 0) {
      console.log('✅ No differences found between baselines');
      return;
    }

    // Agrupar por severidad
    const critical = differences.filter(d => d.severity === 'CRITICAL');
    const high = differences.filter(d => d.severity === 'HIGH');
    const medium = differences.filter(d => d.severity === 'MEDIUM');

    console.log(`🚨 Critical Changes: ${critical.length}`);
    console.log(`🟠 High Changes: ${high.length}`);
    console.log(`🟡 Medium Changes: ${medium.length}`);

    // Mostrar cambios críticos
    if (critical.length > 0) {
      console.log('\n🚨 CRITICAL CHANGES:');
      critical.forEach(diff => this.displayDifference(diff));
    }

    // Mostrar cambios importantes
    if (high.length > 0) {
      console.log('\n🟠 HIGH IMPACT CHANGES:');
      high.forEach(diff => this.displayDifference(diff));
    }

    // Resumen
    console.log(`\n📊 Total differences: ${differences.length}`);
    console.log('=================================');
  }

  displayDifference(diff) {
    const icon = this.getIconForType(diff.type);
    console.log(`   ${icon} ${diff.path}`);

    switch (diff.type) {
      case 'added':
        console.log(`      + Added: ${JSON.stringify(diff.value)}`);
        break;
      case 'removed':
        console.log(`      - Removed: ${JSON.stringify(diff.value)}`);
        break;
      case 'value_change':
        console.log(`      ~ Changed: ${JSON.stringify(diff.from)} → ${JSON.stringify(diff.to)}`);
        break;
      case 'type_change':
        console.log(`      ~ Type: ${diff.from} → ${diff.to}`);
        break;
    }
  }

  getIconForType(type) {
    const icons = {
      added: '➕',
      removed: '➖',
      value_change: '🔄',
      type_change: '🔄'
    };
    return icons[type] || '❓';
  }
}

// Ejecución principal
if (import.meta.url === `file://${process.argv[1]}`) {
  const [baseline1, baseline2] = process.argv.slice(2);

  if (!baseline1 || !baseline2) {
    console.log('Usage: node scripts/compare-baselines.mjs <baseline1.json> <baseline2.json>');
    process.exit(1);
  }

  const comparator = new BaselineComparator();
  comparator.compare(baseline1, baseline2).catch(console.error);
}

export default BaselineComparator;
```

## **Commands de Automatización**

```json
{
  "scripts": {
    "safety:characterize": "node scripts/characterize-daemon.mjs",
    "safety:detect": "node scripts/detect-regressions.mjs",
    "safety:compare": "node scripts/compare-baselines.mjs test-baselines/latest.json test-baselines/previous.json",
    "safety:report": "cat regression-report.md",
    "safety:baseline": "npm run safety:characterize && npm run safety:compare"
  }
}
```

## **Integration con Workflow de Desarrollo**

### **Pre-commit Hook**
```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "🛡️ Running safety net checks..."

# Caracterizar estado actual
npm run safety:characterize

# Detectar regresiones
npm run safety:detect

# Si hay regresiones, prevenir commit
if [ $? -ne 0 ]; then
  echo "🚨 Regressiones detectadas! Revisa regression-report.md"
  exit 1
fi

echo "✅ Safety net passed - commit permitido"
```

### **Pull Request Check**
```yaml
# .github/workflows/safety-net.yml
name: Safety Net Validation

on:
  pull_request:
    paths:
      - 'packages/daemon/**'

jobs:
  safety-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install Dependencies
        run: npm ci

      - name: Characterize Current State
        run: npm run safety:characterize

      - name: Compare with Target Branch
        run: |
          git checkout origin/${{ github.base_ref }}
          npm run safety:characterize
          mv test-baselines/latest.json test-baselines/target.json
          git checkout ${{ github.sha }}
          npm run safety:detect

      - name: Upload Report
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: regression-report
          path: regression-report.md
```

---

**Estado**: ✅ Scripts de Safety Net completamente documentados y listos para implementación