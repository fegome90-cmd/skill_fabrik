# WebApp Testing - Ejecución y CI/CD

## Overview de Ejecución

Ejecutar tests de forma eficiente requiere:
1. **Local execution**: Desarrollo y debugging
2. **CI/CD automation**: Pipeline de integración
3. **Parallel execution**: Optimización de tiempo
4. **Sharding**: Distribución de carga

## 1. Ejecución Local

### Comandos Básicos

```bash
# Ejecutar todos los tests
npm test

# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# E2E tests con UI visible
npm run test:e2e:headed

# Tests en modo watch (auto-reload)
npm run test:watch

# Tests con coverage
npm run test:coverage
```

### Playwright - Comandos Específicos

```bash
# Ejecutar todos los E2E tests
npx playwright test

# Ejecutar test específico
npx playwright test login.spec.ts

# Ejecutar tests por tag
npx playwright test --grep @smoke
npx playwright test --grep @regression

# Ejecutar en browser específico
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Modo debug
npx playwright test --debug

# Con tracing (para debugging)
npx playwright test --trace on

# Con screenshots en failure
npx playwright test --screenshot on

# Con video en failure
npx playwright test --video on

# Ejecutar en paralelo
npx playwright test --workers=4

# Ejecutar headed (UI visible)
npx playwright test --headed

# Generar tests (record)
npx playwright codegen http://localhost:3000

# Abrir UI de Playwright
npx playwright test --ui

# Ver reporte
npx playwright show-report

# Actualizar snapshots
npx playwright test --update-snapshots
```

### Cypress - Comandos Específicos

```bash
# Abrir Cypress Test Runner (UI)
npx cypress open

# Ejecutar tests headless
npx cypress run

# Ejecutar test específico
npx cypress run --spec "cypress/e2e/login.cy.ts"

# Ejecutar browser específico
npx cypress run --browser chrome
npx cypress run --browser firefox
npx cypress run --browser edge

# Ejecutar tests con tag
npx cypress run --env grep="@smoke"

# Ejecutar en paralelo (specify group)
npx cypress run --group "group-1"
npx cypress run --group "group-2"

# Generar video/screenshots
npx cypress run --spec "cypress/e2e/**/*.cy.ts"

# Recargar tests
npx cypress open --global
```

### Jest - Comandos Específicos

```bash
# Ejecutar todos los tests
npm test

# Tests específicos
npm test user.test.ts
npm test -- --testNamePattern="login"

# Tests en watch mode
npm test -- --watch
npm test -- --watchAll

# Tests específicos por archivo
npm test -- user service

# Coverage report
npm test -- --coverage
npm test -- --coverage --watchAll=false

# Tests serializados (no paralelos)
npm test -- --runInBand

# Tests con pattern
npm test -- --testPathPattern=integration

# Update snapshots
npm test -- -u

# Tests verbose
npm test -- --verbose

# Tests con bail (stop on first failure)
npm test -- --bail
```

---

## 2. Configuración de Parallelización

### Playwright Parallel

```typescript
// playwright.config.ts
export default defineConfig({
  // Workers (paralelización)
  workers: process.env.CI ? 4 : undefined, // Auto-detect en CI

  // Fully parallel
  fullyParallel: true,

  // Projects con parallel
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      fullyParallel: true,
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      fullyParallel: true,
    },
  ],
});
```

### Parallel Script

```bash
#!/bin/bash
# scripts/run-parallel-tests.sh

# Ejecutar tests en paralelo usando diferentes ports
PORT=3001 npm run dev &
SERVER1=$!

PORT=3002 npm run dev &
SERVER2=$!

PORT=3003 npm run dev &
SERVER3=$!

PORT=3004 npm run dev &
SERVER4=$!

# Esperar servers
sleep 10

# Ejecutar tests en paralelo
npx playwright test --workers=4

# Cleanup
kill $SERVER1 $SERVER2 $SERVER3 $SERVER4
```

### Cypress Parallel

```yaml
# cypress.config.js
module.exports = defineConfig({
  e2e: {
    // Configurar parallelization
    setupNodeEvents(on, config) {
      // implement node event listeners here
      // Circuit breaker for parallel runs
      on('before:browser:launch', (browser = {}, launchOptions) => {
        if (browser.family === 'chromium' && browser.name === 'electron') {
          launchOptions.preload = launchOptions.preload.replace(
            'enable-automation',
            'disable-features=EnableAutomation'
          );
        }
        return launchOptions;
      });
    },
  },
});
```

---

## 3. Test Sharding

### Playwright Sharding

```yaml
# GitHub Actions con sharding
- name: Run Playwright tests (shard 1 of 4)
  run: npx playwright test --shard 1/4

- name: Run Playwright tests (shard 2 of 4)
  run: npx playwright test --shard 2/4

- name: Run Playwright tests (shard 3 of 4)
  run: npx playwright test --shard 3/4

- name: Run Playwright tests (shard 4 of 4)
  run: npx playwright test --shard 4/4
```

### Shard Script

```bash
#!/bin/bash
# scripts/shard-tests.sh

TOTAL_SHARDS=$1
CURRENT_SHARD=$2

if [ -z "$TOTAL_SHARDS" ] || [ -z "$CURRENT_SHARD" ]; then
  echo "Usage: $0 <total_shards> <current_shard>"
  exit 1
fi

echo "Running shard $CURRENT_SHARD of $TOTAL_SHARDS"

npx playwright test \
  --shard $CURRENT_SHARD/$TOTAL_SHARDS \
  --reporter=json \
  --output-file=test-results/shard-$CURRENT_SHARD.json
```

---

## 4. CI/CD Pipelines

### GitHub Actions - Pipeline Completo

```yaml
# .github/workflows/test-suite.yml
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

env:
  NODE_VERSION: '18'

jobs:
  # Unit and Integration Tests
  unit-integration-tests:
    name: Unit & Integration Tests
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: testdb
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/testdb

      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/testdb

      - name: Generate coverage report
        run: npm run test:unit -- --coverage --watchAll=false

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          flags: unittests

  # E2E Tests
  e2e-tests:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: unit-integration-tests

    strategy:
      fail-fast: false
      matrix:
        shard: [1, 2, 3, 4]

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright Browsers
        run: npx playwright install --with-deps

      - name: Build application
        run: npm run build

      - name: Start application
        run: npm run start &
        env:
          NODE_ENV: test
          PORT: 3000

      - name: Wait for server
        run: npx wait-on http://localhost:3000 --timeout 120000

      - name: Run Playwright tests (Shard ${{ matrix.shard }})
        run: npx playwright test --shard ${{ matrix.shard }}/4
        env:
          CI: true

      - name: Upload test artifacts
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report-shard-${{ matrix.shard }}
          path: |
            playwright-report/
            test-results/
          retention-days: 30

  # Visual Tests
  visual-tests:
    name: Visual Tests
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install

      - name: Build application
        run: npm run build

      - name: Start application
        run: npm run start &
        env:
          NODE_ENV: test

      - name: Wait for server
        run: npx wait-on http://localhost:3000 --timeout 120000

      - name: Run visual tests
        run: npx playwright test visual.spec.ts

      - name: Upload visual diffs
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: visual-diffs
          path: test-results/
          retention-days: 7

  # Performance Tests
  performance-tests:
    name: Performance Tests
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build

      - name: Start application
        run: npm run start &
        env:
          NODE_ENV: production

      - name: Wait for server
        run: npx wait-on http://localhost:3000 --timeout 120000

      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli
          lhci autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
```

### GitLab CI Pipeline

```yaml
# .gitlab-ci.yml
stages:
  - install
  - test
  - e2e
  - visual

variables:
  NODE_VERSION: "18"
  NODE_ENV: test

cache:
  paths:
    - node_modules/

install:
  stage: install
  image: node:$NODE_VERSION
  script:
    - npm ci
  artifacts:
    paths:
      - node_modules/
    expire_in: 1 hour

unit-tests:
  stage: test
  image: node:$NODE_VERSION
  services:
    - postgres:13
  variables:
    DATABASE_URL: "postgresql://postgres:test@postgres:5432/testdb"
  script:
    - npm run test:unit
  coverage: '/Lines\s*:\s*(\d+\.\d+%)/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
    paths:
      - coverage/

integration-tests:
  stage: test
  image: node:$NODE_VERSION
  script:
    - npm run test:integration
  only:
    - merge_requests
    - main

e2e-tests:
  stage: e2e
  image: mcr.microsoft.com/playwright:v1.40.0-focal
  services:
    - postgres:13
  variables:
    DATABASE_URL: "postgresql://postgres:test@postgres:5432/testdb"
    CI: "true"
  script:
    - npx playwright install --with-deps
    - npm run build
    - npm run start &
    - npx wait-on http://localhost:3000
    - npx playwright test --reporter=html
  artifacts:
    when: always
    paths:
      - playwright-report/
      - test-results/
    expire_in: 1 week
  retry:
    max: 2
```

---

## 5. Docker para Testing

### Docker Compose para Tests

```yaml
# docker-compose.test.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    command: npm run dev:test
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=test
      - DATABASE_URL=postgresql://test:test@db:5432/testdb
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:13
    environment:
      POSTGRES_PASSWORD: test
      POSTGRES_DB: testdb
    ports:
      - "5432:5432"
    volumes:
      - test-db:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U test"]
      interval: 10s
      timeout: 5s
      retries: 5

  test-runner:
    build:
      context: .
      dockerfile: Dockerfile.test
    environment:
      - CI=true
      - DATABASE_URL=postgresql://test:test@db:5432/testdb
    depends_on:
      - app
      - db
    command: npm run test:all

volumes:
  test-db:
```

### Dockerfile para Tests

```dockerfile
# Dockerfile.test
FROM mcr.microsoft.com/playwright:v1.40.0-focal

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npx playwright install --with-deps

CMD ["npm", "run", "test:all"]
```

---

## 6. Scripts de Ejecución Avanzados

### Test Runner Script

```bash
#!/bin/bash
# scripts/run-tests.sh

set -e

echo "🧪 Starting test suite..."

# Arguments parsing
TEST_TYPE=${1:-all}
PARALLEL=${2:-4}
BROWSER=${3:-chromium}

# Check environment
if [ "$CI" = "true" ]; then
  echo "Running in CI mode"
  export NODE_ENV=test
else
  echo "Running in local mode"
fi

# Start database if needed
if [[ "$TEST_TYPE" == "integration" || "$TEST_TYPE" == "all" ]]; then
  echo "Starting test database..."
  docker-compose up -d db
  sleep 5
fi

# Build application
if [ "$CI" = "true" ]; then
  echo "Building application..."
  npm run build
fi

# Run tests based on type
case $TEST_TYPE in
  unit)
    echo "Running unit tests..."
    npm run test:unit
    ;;
  integration)
    echo "Running integration tests..."
    npm run test:integration
    ;;
  e2e)
    echo "Starting application for E2E tests..."
    npm run start &
    SERVER_PID=$!
    sleep 10

    echo "Running E2E tests on $BROWSER..."
    npx playwright test --project=$BROWSER --workers=$PARALLEL

    kill $SERVER_PID
    ;;
  all)
    echo "Running all tests..."

    # Unit tests
    npm run test:unit

    # Integration tests
    npm run test:integration

    # E2E tests
    npm run start &
    SERVER_PID=$!
    sleep 10

    npx playwright test --workers=$PARALLEL
    kill $SERVER_PID
    ;;
  *)
    echo "Unknown test type: $TEST_TYPE"
    echo "Available: unit, integration, e2e, all"
    exit 1
    ;;
esac

# Cleanup
if [[ "$TEST_TYPE" == "integration" || "$TEST_TYPE" == "all" ]]; then
  echo "Stopping test database..."
  docker-compose down db
fi

echo "✅ Test suite completed successfully!"
```

### Performance Test Script

```bash
#!/bin/bash
# scripts/performance-test.sh

echo "🚀 Running performance tests..."

# Start application
npm run start:perf &
APP_PID=$!

# Wait for server
sleep 10

# Run Lighthouse
echo "Running Lighthouse CI..."
npm install -g @lhci/cli
lhci autorun --upload.target=temporary-public-storage

# Run Playwright performance tests
echo "Running Playwright performance tests..."
npx playwright test performance.spec.ts

# Cleanup
kill $APP_PID

echo "✅ Performance tests completed!"
```

---

## 7. Continuous Testing

### Pre-commit Hook

```bash
# .git/hooks/pre-commit
#!/bin/bash

echo "Running pre-commit tests..."

# Run unit tests (fast)
npm run test:unit -- --watchAll=false --bail

if [ $? -ne 0 ]; then
  echo "❌ Unit tests failed"
  exit 1
fi

# Run linting
npm run lint

if [ $? -ne 0 ]; then
  echo "❌ Linting failed"
  exit 1
fi

echo "✅ Pre-commit checks passed"
```

### GitHub Pre-commit Action

```yaml
# .github/workflows/pre-commit.yml
name: Pre-commit

on:
  - pull_request

jobs:
  pre-commit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run pre-commit checks
        run: |
          npm run lint
          npm run test:unit -- --watchAll=false
```

---

## 8. Execution Monitoring

### Test Execution Metrics

```typescript
// tests/helpers/metrics.ts
export const trackTestMetrics = async () => {
  const startTime = Date.now();

  return {
    end: () => {
      const duration = Date.now() - startTime;
      console.log(`⏱️  Test execution took ${duration}ms`);

      // Send to analytics
      if (process.env.CI) {
        console.log(`::notice::Test duration: ${duration}ms`);
      }

      return duration;
    },
  };
};

// Usage in test
test('should perform action', async () => {
  const tracker = await trackTestMetrics();

  await performAction();

  tracker.end();
});
```

### CI Test Summary

```bash
#!/bin/bash
# scripts/test-summary.sh

echo "📊 Test Summary"
echo "=============="

# Unit tests
echo "Unit Tests:"
npm run test:unit -- --coverage --watchAll=false 2>&1 | grep -E "Tests:|Suites:|Time:"

# Integration tests
echo
echo "Integration Tests:"
npm run test:integration 2>&1 | grep -E "Tests:|Suites:|Time:"

# E2E tests
echo
echo "E2E Tests:"
npx playwright test --reporter=line 2>&1 | grep -E "Tests:|Time:"

echo
echo "✅ Test execution completed"
```

---

## 9. Troubleshooting Execution

### Debug Test Failures

```bash
# Verbose output
npm test -- --verbose

# Stop on first failure
npm test -- --bail

# Run specific test
npm test -- --testNamePattern="login"

# Debug specific file
node --inspect-brk node_modules/.bin/jest --runInBand user.test.ts

# Playwright debug
npx playwright test --debug

# Cypress debug
DEBUG=cypress:* npx cypress run
```

### Common Issues

#### Issue: Tests Timeout

```typescript
// jest.config.js
module.exports = {
  testTimeout: 30000, // Increase timeout
};

// Playwright
test('long test', async ({ page }) => {
  test.setTimeout(60000); // Per test timeout
});
```

#### Issue: Database Connection in Tests

```typescript
// tests/helpers/db.ts
const setupDb = async () => {
  // Retry logic
  let retries = 5;
  while (retries > 0) {
    try {
      await prisma.$connect();
      return;
    } catch (error) {
      retries--;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  throw new Error('Failed to connect to database');
};
```

#### Issue: Flaky E2E Tests

```typescript
// Add retries
test('flaky test', async ({ page }) => {
  test.flaky(); // Mark as flaky

  // Or add manual retry
  for (let i = 0; i < 3; i++) {
    try {
      await page.click('[data-testid="button"]');
      break;
    } catch (error) {
      if (i === 2) throw error;
      await page.waitForTimeout(1000);
    }
  }
});
```

---

## 10. Best Practices - Execution

### ✅ Do's

1. **Parallelizar tests** cuando sea posible
2. **Usar sharding** en CI para suites grandes
3. **Retry flaky tests** con límites
4. **Separar environments** (dev/staging/CI)
5. **Cache dependencies** en CI
6. **Fail fast** en errores críticos
7. **Upload artifacts** para debugging
8. **Monitor test duration** trends
9. **Use test tags** para selective execution
10. **Clean up resources** después de tests

### ❌ Don'ts

1. No ejecutar E2E tests en pre-commit (muy lentos)
2. No usar producción database para tests
3. No usar --watch en CI
4. No comentar tests fallidos (arreglar!)
5. No ejecutar todos los browsers en cada PR (usar matrix)
6. No hacer tests dependientes entre sí
7. No usar timeouts muy largos (slow tests = bad tests)
8. No ignorar warnings en tests

### Performance Targets

| Tipo de Test | Tiempo Objetivo | Máximo Tolerable |
|--------------|-----------------|------------------|
| **Unit** | < 1s | 5s |
| **Integration** | 1-5s | 10s |
| **E2E** | 5-15s | 30s |
| **Suite Completa** | < 5min | 10min |

---

**Estado**: Ejecución optimizada y automatizada
**CI/CD**: GitHub Actions, GitLab CI
**Paralelización**: Playwright, Jest configurados
**Performance**: Sharding y caching implementado
**Monitoring**: Métricas y tracking activos
