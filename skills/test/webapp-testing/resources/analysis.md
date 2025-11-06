# WebApp Testing - Análisis de Resultados

## Overview de Análisis

Analizar resultados de tests requiere:
1. **Coverage reports**: Métricas de cobertura de código
2. **Test reports**: Resultados detallados de ejecución
3. **Performance metrics**: Tiempo y tendencias
4. **Failure analysis**: Debugging y root cause

---

## 1. Coverage Reports

### Jest Coverage

```bash
# Generar coverage
npm test -- --coverage

# Coverage con HTML report
npm test -- --coverage --coverageReporters=html

# Coverage threshold
npm test -- --coverage --coverageThreshold='{"global":{"branches":80,"functions":80,"lines":80,"statements":80}}'
```

### Coverage Structure

```
coverage/
├── lcov.info              # Para Codecov
├── lcov-report/          # HTML report
│   ├── index.html        # Dashboard principal
│   ├── base.css
│   └── prettify.css
└── coverage-final.json   # Raw data
```

### Coverage HTML Report

```bash
# Abrir reporte HTML
open coverage/lcov-report/index.html

# O usar servidor
cd coverage/lcov-report
python3 -m http.server 8000
# http://localhost:8000
```

### Coverage Metrics

| Métrica | Descripción | Target | Cálculo |
|---------|-------------|--------|---------|
| **Lines** | % líneas ejecutadas | ≥80% | Executed lines / Total lines |
| **Branches** | % branches cubiertas | ≥70% | Covered branches / Total branches |
| **Functions** | % funciones ejecutadas | ≥80% | Called functions / Total functions |
| **Statements** | % statements ejecutados | ≥80% | Executed statements / Total statements |

### Coverage por Componente

```bash
# Ver coverage específico
npm test -- --coverage --collectCoverageFrom='src/components/**/*.tsx'

# Exclude files
npm test -- --coverage --collectCoverageFrom='src/**' --exclude='src/**/*.test.ts'
```

### Coverage GitHub Action

```yaml
- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage/lcov.info
    flags: unittests
    name: codecov-umbrella
    fail_ci_if_error: true
```

---

## 2. Test Reports

### Playwright HTML Report

```bash
# Generar reporte
npx playwright test --reporter=html

# Ver reporte
npx playwright show-report

# El reporte incluye:
# - Summary (passed/failed/skipped)
# - Test results con screenshots
# - Videos de tests fallidos
# - Traces para debugging
```

### Report Customization

```typescript
// playwright.config.ts
export default defineConfig({
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['github'], // GitHub annotations
  ],
});
```

### Report Content

```
playwright-report/
├── index.html              # Dashboard principal
├── data/
│   └── test-results.json   # Raw data
├── screenshots/            # Screenshots on failure
├── videos/                 # Videos on failure
└── traces/                 # Trace viewer files
```

### Cypress Report

```bash
# Instalar reporter
npm install -D mochawesome mochawesome-merge mochawesome-report-generator

# Ejecutar con reporter
npx cypress run --reporter mochawesome

# Generar reporte
npx mochawesome-merge cypress/report/*.json > cypress/report/report.json
npx marge cypress/report/report.json --reportDir cypress/report --inline
```

### Report Analysis Script

```bash
#!/bin/bash
# scripts/analyze-reports.sh

echo "📊 Test Report Analysis"
echo "======================"

# Playwright report
if [ -d "playwright-report" ]; then
  echo
  echo "Playwright Report:"
  echo "------------------"
  grep -o "passed: [0-9]*" playwright-report/data/test-results.json | head -1
  grep -o "failed: [0-9]*" playwright-report/data/test-results.json | head -1
  echo "Report: file://$(pwd)/playwright-report/index.html"
fi

# Jest coverage
if [ -f "coverage/lcov.info" ]; then
  echo
  echo "Coverage Report:"
  echo "----------------"
  grep -o "LF:[0-9]*" coverage/lcov.info | tail -1 | sed 's/LF://' | awk '{printf "Lines: %d%%\n", $1}'
  grep -o "LH:[0-9]*" coverage/lcov.info | tail -1 | sed 's/LH://' | awk '{printf "Hit: %d\n", $1}'
  echo "Report: file://$(pwd)/coverage/lcov-report/index.html"
fi

# Cypress report
if [ -d "cypress/report" ]; then
  echo
  echo "Cypress Report:"
  echo "---------------"
  cat cypress/report/report.json | grep -o '"passes":[0-9]*' | head -1
  cat cypress/report/report.json | grep -o '"failures":[0-9]*' | head -1
  echo "Report: cypress/report/mochawesome.html"
fi
```

---

## 3. Performance Analysis

### Test Timing Metrics

```bash
# Jest timing
npm test -- --verbose

# Output example:
# PASS src/utils/validator.test.ts (5s)
# PASS src/components/Button.test.ts (3s)
# FAIL src/services/api.test.ts (10s)

# Playwright timing
npx playwright test --reporter=dot

# Output example:
# ✓ login.spec.ts (15s)
# ✓ shopping-cart.spec.ts (22s)
# ✗ checkout.spec.ts (45s) -- timeout after 30s
```

### Performance Tracking

```typescript
// tests/helpers/performance-tracker.ts
interface PerformanceMetrics {
  testName: string;
  duration: number;
  memoryUsage?: number;
  timestamp: number;
}

const metrics: PerformanceMetrics[] = [];

export const trackTestPerformance = (testName: string, fn: () => Promise<any>) => {
  return async () => {
    const start = Date.now();
    const startMemory = process.memoryUsage();

    try {
      await fn();
    } finally {
      const end = Date.now();
      const endMemory = process.memoryUsage();

      metrics.push({
        testName,
        duration: end - start,
        memoryUsage: endMemory.heapUsed - startMemory.heapUsed,
        timestamp: end,
      });
    }
  };
};

export const generatePerformanceReport = () => {
  console.log('\n📊 Performance Report');
  console.log('====================');

  metrics
    .sort((a, b) => b.duration - a.duration)
    .forEach(metric => {
      console.log(`${metric.testName}: ${metric.duration}ms`);
    });

  const avg = metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length;
  const max = Math.max(...metrics.map(m => m.duration));
  const min = Math.min(...metrics.map(m => m.duration));

  console.log(`\nAverage: ${avg}ms`);
  console.log(`Max: ${max}ms`);
  console.log(`Min: ${min}ms`);
};

// Usage
test('performance test', trackTestPerformance('login-flow', async () => {
  await performLogin();
}));
```

### Lighthouse Performance

```bash
# Instalar Lighthouse CI
npm install -g @lhci/cli

# Crear configuración
cat > lighthouserc.json << EOF
{
  "ci": {
    "collect": {
      "url": ["http://localhost:3000/"],
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.8}],
        "categories:accessibility": ["error", {"minScore": 0.9}],
        "categories:best-practices": ["error", {"minScore": 0.9}],
        "categories:seo": ["error", {"minScore": 0.8}]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
EOF

# Ejecutar
lhci autorun

# Ver reporte
open .lighthouseci/report.html
```

### Performance Dashboard

```typescript
// scripts/generate-dashboard.js
const fs = require('fs');
const path = require('path');

function generateDashboard() {
  const metrics = JSON.parse(
    fs.readFileSync('test-results/metrics.json', 'utf8')
  );

  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Test Performance Dashboard</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    .metric-card { background: #f5f5f5; padding: 20px; margin: 10px 0; border-radius: 5px; }
    .chart-container { width: 80%; margin: 20px auto; }
  </style>
</head>
<body>
  <h1>Test Performance Dashboard</h1>

  <div class="metric-card">
    <h2>Total Tests: ${metrics.total}</h2>
    <h2>Passed: ${metrics.passed} | Failed: ${metrics.failed}</h2>
    <h2>Total Time: ${metrics.totalTime}ms</h2>
  </div>

  <div class="chart-container">
    <canvas id="durationChart"></canvas>
  </div>

  <script>
    const ctx = document.getElementById('durationChart').getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ${JSON.stringify(metrics.tests.map(t => t.name))},
        datasets: [{
          label: 'Duration (ms)',
          data: ${JSON.stringify(metrics.tests.map(t => t.duration))},
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  </script>
</body>
</html>
  `;

  fs.writeFileSync('test-results/dashboard.html', html);
  console.log('✅ Dashboard generated: test-results/dashboard.html');
}
```

---

## 4. Failure Analysis

### Common Failure Patterns

#### Pattern 1: Flaky Tests

```typescript
// ❌ Flaky test (depends on timing)
test('async operation', async () => {
  await clickButton();
  await waitFor(1000); // Brittle timing
  expect(isVisible('.success-message')).toBe(true);
});

// ✅ Fixed flaky test (proper waiting)
test('async operation', async ({ page }) => {
  await clickButton();
  await expect(page.locator('.success-message')).toBeVisible();
});
```

#### Pattern 2: Race Conditions

```typescript
// ❌ Race condition
test('user list updates', async () => {
  await addUser('John');
  const users = await getUsers();
  expect(users.length).toBe(1); // Might fail if update is slow
});

// ✅ Fixed race condition
test('user list updates', async () => {
  await addUser('John');
  await waitFor(async () => {
    const users = await getUsers();
    return users.length === 1;
  });
  const users = await getUsers();
  expect(users.length).toBe(1);
});
```

#### Pattern 3: Hardcoded Wait

```typescript
// ❌ Hardcoded wait
test('loading completes', async () => {
  await clickLoadButton();
  await new Promise(resolve => setTimeout(resolve, 5000)); // Bad!
  expect(loadingIndicator).not.toBeVisible();
});

// ✅ Proper waiting
test('loading completes', async ({ page }) => {
  await clickLoadButton();
  await expect(loadingIndicator).toBeHidden({ timeout: 10000 });
});
```

### Failure Investigation Workflow

```bash
#!/bin/bash
# scripts/investigate-failures.sh

echo "🔍 Investigating Test Failures"
echo "==============================="

# 1. Check last run results
echo
echo "1. Last run summary:"
if [ -f "test-results/results.json" ]; then
  cat test-results/results.json | grep -o '"status":"failed"[^}]*' | head -5
fi

# 2. Get failed test names
echo
echo "2. Failed tests:"
npx playwright test --listTests 2>/dev/null | grep FAILED || echo "No test list available"

# 3. Check recent failures
echo
echo "3. Failure frequency:"
git log --oneline --grep="FAIL" -10 2>/dev/null || echo "Not in git repo"

# 4. Performance outliers
echo
echo "4. Slow tests (potential flaky):"
grep -o "[0-9]*s" test-results/results.json | sort -rn | head -5 || echo "No timing data"

# 5. Resources
echo
echo "5. Debug resources:"
echo "   - Screenshots: $(find test-results -name '*.png' 2>/dev/null | wc -l) files"
echo "   - Videos: $(find test-results -name '*.webm' 2>/dev/null | wc -l) files"
echo "   - Traces: $(find test-results -name '*.zip' 2>/dev/null | wc -l) files"
```

### Auto-Retry Failed Tests

```typescript
// playwright.config.ts
export default defineConfig({
  retries: process.env.CI ? 2 : 0, // Retry 2 times in CI
  workers: process.env.CI ? 4 : undefined,

  reporter: [
    ['html'],
    [
      'json',
      {
        outputFile: 'test-results/results.json',
        // Include retries in report
        outputFolder: 'test-results',
      },
    ],
  ],
});
```

### Failure Categorization

```typescript
// tests/helpers/failure-analyzer.ts
export enum FailureType {
  ASSERTION = 'assertion',
  TIMEOUT = 'timeout',
  NAVIGATION = 'navigation',
  SELECTOR = 'selector',
  NETWORK = 'network',
  DATABASE = 'database',
  UNKNOWN = 'unknown',
}

export interface TestFailure {
  testName: string;
  error: Error;
  type: FailureType;
  retryCount: number;
  timestamp: number;
}

export const categorizeFailure = (error: Error): FailureType => {
  const message = error.message.toLowerCase();

  if (message.includes('timeout')) return FailureType.TIMEOUT;
  if (message.includes('selector') || message.includes('not found')) return FailureType.SELECTOR;
  if (message.includes('navigation') || message.includes('url')) return FailureType.NAVIGATION;
  if (message.includes('network') || message.includes('fetch')) return FailureType.NETWORK;
  if (message.includes('database') || message.includes('sql')) return FailureType.DATABASE;
  if (message.includes('expect') || message.includes('tobe')) return FailureType.ASSERTION;

  return FailureType.UNKNOWN;
};

export const generateFailureReport = (failures: TestFailure[]) => {
  console.log('\n📊 Failure Analysis');
  console.log('===================');

  const byType = failures.reduce((acc, f) => {
    acc[f.type] = (acc[f.type] || 0) + 1;
    return acc;
  }, {} as Record<FailureType, number>);

  Object.entries(byType).forEach(([type, count]) => {
    console.log(`${type}: ${count} failures`);
  });

  // Most common failures
  const byTest = failures.reduce((acc, f) => {
    acc[f.testName] = (acc[f.testName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('\nMost unstable tests:');
  Object.entries(byTest)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .forEach(([test, count]) => {
      console.log(`  ${test}: ${count} failures`);
    });
};
```

---

## 5. Test Health Monitoring

### Test Health Score

```typescript
// scripts/calculate-health-score.ts
interface TestMetrics {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  flaky: number;
  avgDuration: number;
  coverage: number;
}

const calculateHealthScore = (metrics: TestMetrics): number => {
  const passRate = metrics.passed / metrics.total;
  const coverageScore = metrics.coverage / 100;
  const performanceScore = Math.max(0, 1 - (metrics.avgDuration / 10000)); // Penalty if avg > 10s
  const stabilityScore = (metrics.total - metrics.flaky) / metrics.total;

  const score =
    passRate * 0.4 +
    coverageScore * 0.3 +
    performanceScore * 0.2 +
    stabilityScore * 0.1;

  return Math.round(score * 100);
};

const healthScore = calculateHealthScore({
  total: 100,
  passed: 95,
  failed: 3,
  skipped: 2,
  flaky: 1,
  avgDuration: 2500,
  coverage: 85,
});

console.log(`Test Health Score: ${healthScore}/100`);

if (healthScore >= 90) {
  console.log('✅ Excellent test suite health');
} else if (healthScore >= 70) {
  console.log('⚠️  Good test suite health, room for improvement');
} else {
  console.log('❌ Poor test suite health, needs attention');
}
```

### Test Trends

```bash
#!/bin/bash
# scripts/test-trends.sh

echo "📈 Test Trends (last 7 days)"
echo "============================"

# Get test history
for i in {0..6}; do
  date -d "$i days ago" +%Y-%m-%d
  # Query CI data or git history for test results
  # This is pseudo-code, adapt to your CI system
  # Example with Codecov:
  # curl -s "https://codecov.io/api/gh/owner/repo/commits?since=$(date -d "$i days ago" +%Y-%m-%d)" \
  #   | jq '.commit_totals.c'
done

# Generate trend chart
cat > test-trends.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
  <canvas id="trendChart"></canvas>
  <script>
    const ctx = document.getElementById('trendChart').getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Day -6', 'Day -5', 'Day -4', 'Day -3', 'Day -2', 'Day -1', 'Today'],
        datasets: [{
          label: 'Pass Rate %',
          data: [92, 94, 91, 95, 93, 96, 95],
          borderColor: 'rgb(75, 192, 192)',
        }, {
          label: 'Coverage %',
          data: [83, 84, 84, 85, 85, 86, 85],
          borderColor: 'rgb(255, 99, 132)',
        }]
      }
    });
  </script>
</body>
</html>
EOF

echo "Generated: test-trends.html"
```

---

## 6. Reports Integration

### Slack/Teams Notifications

```yaml
# GitHub Action - Slack notification
- name: Notify Slack on failure
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: failure
    text: '❌ Test suite failed! Check the results: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}'
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

### Email Reports

```typescript
// scripts/send-test-report.js
const nodemailer = require('nodemailer');

async function sendTestReport() {
  const metrics = JSON.parse(fs.readFileSync('test-results/metrics.json', 'utf8'));

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const html = `
    <h2>Test Report - ${new Date().toLocaleDateString()}</h2>
    <p><strong>Total Tests:</strong> ${metrics.total}</p>
    <p><strong>Passed:</strong> ${metrics.passed}</p>
    <p><strong>Failed:</strong> ${metrics.failed}</p>
    <p><strong>Coverage:</strong> ${metrics.coverage}%</p>
    <p><a href="${process.env.CI ? 'CI_URL' : 'LOCAL_URL'}">View full report</a></p>
  `;

  await transporter.sendMail({
    from: 'test-reports@company.com',
    to: 'dev-team@company.com',
    subject: 'Daily Test Report',
    html,
  });
}
```

---

## 7. Best Practices - Analysis

### ✅ Do's

1. **Review coverage reports** regularmente
2. **Track test duration trends** para detectar performance degradation
3. **Categorizar failures** para identificar patterns
4. **Usar visual reports** (HTML, dashboards)
5. **Alert on test health score** drops
6. **Archive test artifacts** (screenshots, videos, traces)
7. **Analyze flaky tests** y fix them
8. **Monitor test stability** over time

### ❌ Don'ts

1. No ignorar coverage reports
2. No publicar test reports públicos (contienen sensibles)
3. No usar screenshots/videos sin cleanup
4. No guardar reports indefinitely (cleanup old data)
5. No comparar apples-to-oranges (diff environments)
6. No usar visual tests para contenido dinámico
7. No hacer conclusiones sin data suficiente

### KPIs de Test Health

| KPI | Target | Warning | Critical |
|-----|--------|---------|----------|
| **Pass Rate** | ≥95% | <95% | <90% |
| **Coverage** | ≥80% | <80% | <70% |
| **Avg Duration** | <5s | >5s | >10s |
| **Flaky Rate** | 0% | >1% | >5% |
| **Health Score** | ≥90 | <90 | <70 |

---

**Estado**: Análisis completo implementado
**Coverage**: Jest + Playwright reporting
**Performance**: Metrics tracking y trending
**Failures**: Categorización y auto-retry
**Health**: Score y KPIs definidos
**Reports**: HTML, JSON, Slack integration
