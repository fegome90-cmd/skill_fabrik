---
id: visual-regression-testing
version: 0.1.0
type: workflow
summary: 'Implementa visual regression testing para CLI output ensuring consistencia visual y formatos consistentes.'
audience: engineers
when_to_use: 'Cuando necesites validar que el output visual del CLI permanezca consistente entre cambios.'
severity: high
tags: [testing, visual, regression, cli-output, consistency]
---

# Visual Regression Testing Workflow

## Propósito
Este skill establece un sistema completo de visual regression testing para el CLI, asegurando que el output visual, colores, formatos y layouts permanezcan consistentes entre cambios y versiones.

## Métrica de Éxito
- 100% de consistencia visual para comandos críticos
- Detección automática de cambios inesperados en output
- Integración con CI/CD para validación continua
- Tiempo de ejecución < 30 segundos para suite completa

## Implementación CLOOP

### C1 - CLARIFY: Objetivos y Contexto
**Objetivos:**
- Detectar cambios inesperados en output visual del CLI
- Mantener consistencia de colores y formatting
- Validar layouts y estructuras de información
- Prevenir regresiones visuales en producción

**Contexto Actual:**
- CLI tiene sistema de colors profesional
- Output incluye elementos visuales (icons, progress bars, tables)
- Múltiples formatos de output (markdown, JSON, CSV)
- Necesidad de mantener consistencia visual

### C2 - LAYOUT: Arquitectura de Testing
**Componentes Clave:**
1. **Snapshot System**: Captura y comparación de output
2. **Visual Validators**: Validación de elementos visuales
3. **Format Consistency**: Cross-format validation
4. **CI Integration**: Automated validation pipeline

**Estructura de Tests:**
```
packages/skills-cli/test/visual/
├── snapshots/                  # Reference snapshots
├── utils/
│   ├── snapshot-manager.ts     # Snapshot capture/compare
│   ├── visual-validators.ts    # Visual element validation
│   ├── format-validators.ts    # Format consistency checks
│   └── ci-integration.ts       # CI pipeline integration
├── commands/
│   ├── skills-output.test.ts   # Skills command visuals
│   ├── plan-output.test.ts     # Plan command visuals
│   └── kpi-output.test.ts      # KPI command visuals
└── config/
    ├── visual-config.json      # Visual testing configuration
    └── ignore-rules.json       # Expected changes to ignore
```

### C3 - OPERATE: Implementación
**Paso 1: Snapshot Manager**
- Captura output actual del CLI
- Genera snapshots referenciales
- Compara snapshots con tolerancia configurable
- Maneja diferencias esperadas

**Paso 2: Visual Validators**
- Validación de colores y formatting
- Detección de elementos estructurales
- Validación de icons y símbolos
- Consistencia de layouts

**Paso 3: Format Consistency**
- Cross-format validation (markdown ↔ JSON ↔ CSV)
- Data integrity checking
- Metadata consistency
- Output completeness

**Paso 4: CI Integration**
- Automated snapshot updates
- PR validation workflow
- Failure reporting con screenshots
- Rollback mechanisms

### C4 - OBSERVE: Métricas y Monitoring
**Métricas Clave:**
- Snapshot comparison accuracy
- False positive rate < 5%
- Test execution time < 30s
- Coverage de comandos críticos 100%

**Monitoring:**
- CI pipeline success rate
- Snapshot update frequency
- Visual drift detection
- Performance impact measurement

### C5 - REFLECT: Mejora Continua
**Learnings Esperados:**
- Patrones comunes de cambios visuales
- Estrategias de snapshot management
- Optimización de performance
- User experience insights

**Improvements:**
- Smart snapshot updates
- AI-powered change detection
- Enhanced reporting
- Cross-platform consistency

## Implementación Detallada

### 1. Snapshot Manager
```typescript
interface SnapshotConfig {
  tolerance: number;        // Diferencia permitida (0-1)
  ignoreColors: boolean;    // Ignorar diferencias de color
  ignoreWhitespace: boolean; // Ignorar diferencias de whitespace
  ignoreTimestamps: boolean; // Ignorar timestamps y fechas
  ignoreNumbers: boolean;   // Ignorar valores numéricos
}

interface VisualSnapshot {
  id: string;
  command: string;
  args: string[];
  output: string;
  metadata: {
    timestamp: number;
    cliVersion: string;
    environment: string;
    colors: boolean;
    format: string;
  };
}
```

### 2. Visual Validation Rules
```typescript
const VALIDATION_RULES = {
  // Color consistency
  primaryColor: /\x1b\[94m/,    // Blue
  successColor: /\x1b\[92m/,    // Green
  warningColor: /\x1b\[93m/,    // Yellow
  errorColor: /\x1b\[91m/,      // Red

  // Structural elements
  headers: /^#{1,6}\s/m,
  lists: /^[\s]*[-*+]\s/m,
  tables: /\|.*\|/,
  progressBars: /\[█░]+\]/,

  // Icons and symbols
  successIcons: /[✓✅]/,
  errorIcons: /[✗❌]/,
  warningIcons: /[⚠️⚠]/,
  infoIcons: /[ℹℹ]/,

  // Metadata elements
  timestamps: /\d{4}-\d{2}-\d{2}/,
  durations: /\d+ms/,
  percentages: /\d+%/,
  fileSizes: /\d+(?:\.\d+)?[KMGT]?B/
};
```

### 3. Test Implementation Examples
```typescript
describe('Skills Command Visual Regression', () => {
  test('skills lint output consistency', async () => {
    const result = await executeCLI('skills lint', ['./test-skills']);

    await expectVisualSnapshot(result, {
      tolerance: 0.1,
      ignoreNumbers: true,
      ignoreTimestamps: true
    });
  });

  test('skills check interactive elements', async () => {
    const result = await executeCLI('skills check', ['implement auth']);

    // Validate visual elements
    expect(result.stdout).toMatch(VALIDATION_RULES.successIcons);
    expect(result.stdout).toMatch(VALIDATION_RULES.primaryColor);

    // Check structure
    expect(result.stdout).toContain('Checking intent:');
    expect(result.stdout).toContain('matching skills');
  });
});
```

### 4. CI Integration Script
```bash
#!/bin/bash
# Visual regression CI script

echo "🎨 Running Visual Regression Tests..."

# Run visual tests
npm run test:visual

# Check for changes
if [ $? -eq 0 ]; then
  echo "✅ No visual changes detected"
  exit 0
else
  echo "⚠️  Visual changes detected"
  echo "📊 Generating diff report..."
  npm run test:visual:report

  # In CI, fail unless explicitly approved
  if [ "$CI" = "true" ]; then
    echo "❌ Visual changes require approval in CI"
    exit 1
  else
    echo "💡 Run 'npm run test:visual:update' to update snapshots"
    exit 0
  fi
fi
```

## Scripts de Ejecución

### Development
```bash
# Run visual tests
npm run test:visual

# Update snapshots interactively
npm run test:visual:update

# Generate diff report
npm run test:visual:report

# Validate specific command
npm run test:visual:skills
```

### CI/CD Integration
```bash
# Run in CI mode
npm run test:visual:ci

# Approve changes (manual)
npm run test:visual:approve

# Generate coverage report
npm run test:visual:coverage
```

## Configuración

### visual-config.json
```json
{
  "snapshotDir": "test/visual/snapshots",
  "diffDir": "test/visual/diffs",
  "defaultTolerance": 0.1,
  "timeout": 30000,
  "parallel": true,
  "maxWorkers": 4,
  "formats": ["stdout", "stderr", "combined"],
  "environments": ["darwin", "linux", "win32"],
  "colorSchemes": ["dark", "light", "auto"]
}
```

### ignore-rules.json
```json
{
  "patterns": [
    "\\d{4}-\\d{2}-\\d{2}",      // Dates
    "\\d+:\\d+:\\d+",            // Times
    "\\d+ms",                   // Durations
    "/tmp/[^\\s]+",             // Temp paths
    "process\\.pid",            // Process IDs
    "memory: \\d+MB"           // Memory usage
  ],
  "commands": {
    "kpi --days 1": {
      "ignoreNumbers": true,
      "ignoreTimestamps": true
    }
  }
}
```

## Validación

### Criterios de Éxito:
1. **Snapshot Coverage**: 100% de comandos críticos
2. **False Positive Rate**: < 5%
3. **Execution Time**: < 30 segundos
4. **CI Integration**: Funcionando en PR validation

### Tests de Validación:
1. **Consistencia de Colores**: Validar paleta de colores
2. **Estructura de Output**: Validar layouts y elementos
3. **Format Cross-Platform**: Validar consistencia entre sistemas
4. **Performance**: Validar impacto en velocidad de tests

## Métricas y Monitoring

### KPIs:
- Visual test execution time
- Snapshot accuracy rate
- False positive/negative rates
- CI pipeline impact
- Developer satisfaction (ease of use)

### Dashboard Elements:
- Visual drift over time
- Most frequently changing outputs
- Test coverage metrics
- Performance trends
- Failure analysis

## Recursos Adicionales

- [Jest Image Snapshot](https://github.com/americanexpress/jest-image-snapshot)
- [Chalk Color Testing](https://github.com/chalk/chalk)
- [CLI Output Standards](https://clig.dev/)
- [Visual Testing Best Practices](https://github.com/WebdriverIO/webdriverio/tree/main/packages/visual-service)