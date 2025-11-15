# Plan de Testing de Caracterización - Safety Net para Daemon Refactorization

## **Objetivo Estratégico**

Establecer una red de seguridad (safety net) que capture el comportamiento actual del componente Daemon antes de cualquier modificación, asegurando que las refactorizaciones críticas no introduzcan regresiones inadvertidas.

## **Estrategia de Caracterización**

### **Principio: "Capture Before Change"**
- **Estado Actual**: Documentar comportamiento existente INCLUDING antipatterns
- **Baseline**: Métricas cuantificables de rendimiento y comportamiento
- **Regression Detection**: Automatización que detecta cambios no deseados
- **Preservation**: Asegurar que comportamiento crítico se mantenga

### **Componentes a Caracterizar**

#### **1. Authentication Flows** (Prioridad Crítica)
```typescript
// Escenarios actuales a capturar
const authenticationScenarios = {
  hardcoded_user_approval: {
    description: "Current user approval bypass vulnerability",
    location: "packages/skills-cli/dist/commands/plan.js",
    current_behavior: "approvedBy = 'user'",
    risk_level: "🔴 Critical",
    evidence: "F-004 en Technical Debt Matrix"
  },

  jwt_token_validation: {
    description: "JWT validation in Daemon app.ts",
    location: "packages/daemon/src/app.ts lines 19, 27, 31",
    current_behavior: "Mixed auth with business logic",
    risk_level: "🔴 Critical",
    evidence: "Security Risk Analysis"
  },

  role_based_access: {
    description: "Current role checking mechanisms",
    location: "Multiple authentication points",
    current_behavior: "Inconsistent role validation",
    risk_level: "🟠 High",
    evidence: "STRIDE Analysis - Spoofing"
  }
};
```

#### **2. Configuration Loading** (Prioridad Alta)
```typescript
// Patrones de configuración caóticos actuales
const configurationChaos = {
  multiple_sources: {
    sources: [
      "YAML configuration files",
      "JSON settings files",
      "Environment variables (.env.*)",
      "Hardcoded values in source"
    ],
    conflicts: [
      "Overriding environment variables",
      "Schema validation missing (F-012)",
      "No type safety in loading"
    ],
    risk_level: "🟠 High",
    evidence: "Configuration Chaos Analysis"
  },

  environment_overrides: {
    production_exposure: ".env.production sin protección",
    testing_conflicts: ".env.testing con overrides inconsistentes",
    validation_missing: "No validation schema al startup",
    risk_level: "🔴 Critical",
    evidence: "Security Risk - Disclosure"
  }
};
```

#### **3. Performance Baselines** (Prioridad Alta)
```typescript
// Métricas de performance a establecer
const performanceBaselines = {
  daemon_startup: {
    metric: "startup_time_ms",
    current_baseline: "TBD - needs profiling",
    target: "-20% improvement",
    measurement: "node --prof packages/daemon/src/app.js",
    priority: "🟠 High"
  },

  memory_usage: {
    metric: "memory_footprint_mb",
    current_baseline: "TBD - needs measurement",
    target: "-10% reduction",
    measurement: "process.memoryUsage() sampling",
    priority: "🟠 High"
  },

  response_times: {
    metric: "api_response_time_ms",
    current_baseline: "TBD - needs load testing",
    target: "-10% improvement",
    measurement: "supertest benchmarks",
    priority: "🟠 High"
  }
};
```

### **Estructura de Archivos de Tests**

```
packages/daemon/test/characterization/
├── README.md                           # Guide y methodology
├── fixtures/                            # Test data estáticos
│   ├── auth-flows.json                 # Escenarios de autenticación actuales
│   ├── config-samples.json             # Muestras de configuración caótica
│   ├── api-contracts.json              # Contratos API actuales
│   └── performance-baselines.json     # Baselines de rendimiento
├── auth/                             # Authentication characterization
│   ├── current-auth-flows.test.ts      # Capturar comportamiento auth actual
│   ├── hardcoded-user.test.ts          # Vulnerabilidad específica
│   ├── jwt-validation.test.ts          # Validación actual de tokens
│   └── authorization-patterns.test.ts # Patrones de autorización
├── configuration/                     # Configuration characterization
│   ├── multiple-sources.test.ts        # Loading desde YAML+JSON+ENV
│   ├── validation-behavior.test.ts    # Comportamiento actual de validación
│   ├── environment-overrides.test.ts    # Override behaviors
│   └── schema-missing.test.ts         # Current state sin schema
├── performance/                       # Performance characterization
│   ├── startup-baseline.test.ts        # Startup times y patterns
│   ├── memory-usage.test.ts           # Memory footprints
│   ├── api-response.test.ts           # Response time baselines
│   └── resource-consumption.test.ts  # CPU y resource patterns
├── business-logic/                    # Core behavior preservation
│   ├── request-handling.test.ts        # Request/response patterns
│   ├── error-handling.test.ts         # Error handling actual
│   ├── state-management.test.ts         # State patterns
│   └── side-effects.test.ts           # Side effects actuales
├── api-contracts/                     # Contract testing
│   ├── endpoints-behavior.test.ts      # Current API behavior
│   ├── request-validation.test.ts       # Validation patterns actuales
│   ├── response-formats.test.ts       # Response structure current
│   └── error-responses.test.ts        # Error response patterns
└── safety-net/                       # Regression detection
    ├── behavior-preservation.test.ts    # Preserve critical behavior
    ├── regression-detection.test.ts    # Detect behavior changes
    ├── baseline-comparison.test.ts      # Compare vs baselines
    └── critical-paths.test.ts         # Ensure critical paths work
```

### **Scripts de Caracterización Detallados**

#### **Script Principal de Characterization**
```typescript
// scripts/characterize-daemon.mjs
import fs from 'fs/promises';
import { execSync } from 'child_process';

const characterizeDaemon = async () => {
  console.log('🔍 Starting Daemon Characterization...');

  const baseline = {
    metadata: {
      timestamp: new Date().toISOString(),
      node_version: process.version,
      git_commit: execSync('git rev-parse HEAD').toString().trim(),
      working_directory: process.cwd()
    },

    authentication: await captureAuthenticationFlows(),
    configuration: await captureConfigurationBehavior(),
    performance: await establishPerformanceBaselines(),
    api_contracts: await documentAPIContracts(),
    error_handling: await captureErrorPatterns(),
    memory_usage: await measureMemoryFootprint(),
    startup_behavior: await captureStartupBehavior()
  };

  // Save baseline con timestamp
  const baselineFile = `./test-baselines/daemon-baseline-${Date.now()}.json`;
  await fs.writeFile(baselineFile, JSON.stringify(baseline, null, 2));

  // También guardar latest para fácil acceso
  await fs.writeFile('./test-baselines/latest.json', JSON.stringify(baseline, null, 2));

  console.log(`✅ Characterization complete: ${baselineFile}`);
  console.log('📊 Summary:', {
    auth_scenarios: Object.keys(baseline.authentication.scenarios).length,
    config_sources: baseline.configuration.sources.length,
    performance_metrics: Object.keys(baseline.performance).length,
    api_endpoints: baseline.api_contracts.endpoints.length,
    error_patterns: baseline.error_handling.patterns.length
  });

  return baseline;
};

const captureAuthenticationFlows = async () => {
  return {
    scenarios: {
      hardcoded_approval: {
        location: "packages/skills-cli/dist/commands/plan.js",
        current_behavior: "approvedBy = 'user'",
        security_impact: "Authentication bypass possible",
        evidence_reference: "F-004 in Technical Debt Matrix"
      },
      jwt_mixed_with_business: {
        location: "packages/daemon/src/app.ts lines 19, 27, 31",
        current_behavior: "Auth logic mixed with business logic",
        security_impact: "Separation of concerns violation",
        evidence_reference: "STRIDE Analysis - Daemon"
      }
    }
  };
};

const captureConfigurationBehavior = async () => {
  return {
    sources: [
      ".env.production (unprotected)",
      ".env.testing",
      ".env.check",
      "YAML config files",
      "JSON settings",
      "Hardcoded values"
    ],
    conflicts: [
      "Schema validation missing (F-012)",
      "Environment overrides unpredictable",
      "No type safety enforcement"
    ],
    security_issues: [
      ".env.production exposure risk",
      "Hardcoded secrets in TODOs"
    ]
  };
};

const establishPerformanceBaselines = async () => {
  return {
    startup_time: await measureStartupTime(),
    memory_footprint: await measureMemoryUsage(),
    api_response_times: await measureAPIResponseTimes(),
    cpu_utilization: await measureCPUUsage()
  };
};

const measureStartupTime = async () => {
  const start = Date.now();
  try {
    execSync('timeout 30s node packages/daemon/src/app.js', {
      stdio: 'pipe',
      timeout: 35000
    });
    return Date.now() - start;
  } catch (error) {
    console.log('⚠️ Daemon startup failed during profiling');
    return null;
  }
};

// Ejecución
if (import.meta.url === `file://${process.argv[1]}`) {
  characterizeDaemon().catch(console.error);
}

export { characterizeDaemon };
```

#### **Script de Regression Detection**
```typescript
// scripts/detect-regressions.mjs
import fs from 'fs/promises';

const detectRegressions = async () => {
  const latest = JSON.parse(await fs.readFile('./test-baselines/latest.json', 'utf8'));
  const previous = JSON.parse(await fs.readFile('./test-baselines/previous.json', 'utf8'));

  const regressions = {
    authentication: compareAuthBehavior(latest.authentication, previous.authentication),
    performance: comparePerformance(latest.performance, previous.performance),
    configuration: compareConfiguration(latest.configuration, previous.configuration),
    api_contracts: compareAPIContracts(latest.api_contracts, previous.api_contracts)
  };

  // Generar report
  const report = generateRegressionReport(regressions);
  await fs.writeFile('./regression-report.md', report);

  // Si hay regresiones críticas, exit con error
  if (regressions.authentication.critical || regressions.performance.regression) {
    console.error('🚨 CRITICAL REGRESSIONS DETECTED');
    console.error('📊 See regression-report.md for details');
    process.exit(1);
  }

  console.log('✅ No critical regressions detected');
};

const compareAuthBehavior = (latest, previous) => {
  const critical = [];
  const warnings = [];

  // Verificar que hardcoded user behavior no haya cambiado inesperadamente
  if (latest.scenarios.hardcoded_approval !== previous.scenarios.hardcoded_approval) {
    critical.push("Authentication behavior changed unexpectedly");
  }

  return { critical, warnings };
};

const generateRegressionReport = (regressions) => {
  return `# Regression Detection Report

Generated: ${new Date().toISOString()}

## 🚨 Critical Issues
${regressions.authentication.critical.map(issue => `- ${issue}`).join('\n') || 'None'}

## 📊 Performance Changes
${regressions.performance.regression ? 'Performance regression detected' : 'Performance stable'}

## 🔧 Configuration Changes
${regressions.configuration.changes?.length > 0 ? regressions.configuration.changes.join('\n') : 'No changes'}

---
**Action Required**: ${regressions.authentication.critical.length > 0 ? 'YES - Review before merging' : 'NO - Safe to proceed'}
`;
};

// Ejecución
detectRegressions().catch(console.error);
```

### **Commands de Automatización**

```json
{
  "scripts": {
    "test:characterization": "node scripts/characterize-daemon.mjs",
    "test:regression": "node scripts/detect-regressions.mjs",
    "test:safety-net": "jest packages/daemon/test/characterization --detectOpenHandles",
    "test:preservation": "jest packages/daemon/test/characterization --testNamePattern='preservation'",
    "test:baseline": "npm run test:characterization && npm run test:performance",
    "test:daemon-full": "npm run test:characterization && npm run test:regression && npm run test:safety-net"
  }
}
```

## **Integration con CI/CD**

### **GitHub Actions Workflow**
```yaml
# .github/workflows/characterization.yml
name: Characterization Tests

on:
  push:
    paths:
      - 'packages/daemon/**'
  pull_request:
    paths:
      - 'packages/daemon/**'

jobs:
  characterization:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run Characterization
        run: npm run test:characterization

      - name: Check for Regressions
        run: npm run test:regression

      - name: Upload Baselines
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: daemon-baselines
          path: test-baselines/
```

## **Success Criteria**

### **Criterios de Éxito del Safety Net:**
- **✅ 100%** de comportamiento crítico capturado en tests
- **✅ Baselines** establecidas para todas las métricas de performance
- **✅ Regression detection** funcionando para cambios no deseados
- **✅ Automated execution** en cada cambio al Daemon
- **✅ Clear failure modes** con explicaciones específicas

### **Métricas de Verificación:**
- **Coverage**: 80% de comportamiento crítico documentado
- **Regression Detection**: <5% false positives
- **Execution Time**: <2 minutos para correr safety net completo
- **Storage Size**: <10MB para todos los baselines

---

**Implementation Priority**: 🔴 CRITICAL - Debe implementarse ANTES de cualquier refactorización del Daemon
**Timeline**: 3-4 días para implementación completa
**Dependencies**: Jest, node-mocks-http, filesystem access para baselines