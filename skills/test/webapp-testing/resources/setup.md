# WebApp Testing - Setup y Configuración

## Overview de Setup

Configurar entorno de testing requiere:
1. **Herramientas**: Playwright, Cypress, Jest, testing libraries
2. **Configuración**: Archivos de config, test data, mocks
3. **Entornos**: Dev, staging, CI/CD
4. **Dependencies**: NPM packages, browsers, databases

## 1. Playwright Setup

### Instalación Inicial

```bash
# 1. Crear proyecto si no existe
mkdir my-webapp
cd my-webapp
npm init -y

# 2. Instalar Playwright
npm install -D @playwright/test

# 3. Instalar browsers
npx playwright install

# 4. Instalar system dependencies (Linux)
npx playwright install-deps

# 5. Verificar instalación
npx playwright test --version
```

### Configuración Básica

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Directorio de tests
  testDir: './tests',

  // Ejecutar tests en paralelo
  fullyParallel: true,

  // Fail build en CI si hay tests fallando
  forbidOnly: !!process.env.CI,

  // Reintentar tests fallidos
  retries: process.env.CI ? 2 : 0,

  // Workers (paralelización)
  workers: process.env.CI ? 4 : undefined,

  // Reporter
  reporter: [
    ['html'], // Reporte HTML
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],

  // Tests globales
  globalSetup: './tests/global-setup.ts',
  globalTeardown: './tests/global-teardown.ts',

  // Configuración por proyecto
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // Mobile testing
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // Web server para tests
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },

  // Output directory
  outputDir: 'test-results/',

  // Trace collection
  trace: 'on-first-retry',
});
```

### Tests Globales

```typescript
// tests/global-setup.ts
import { chromium } from '@playwright/test';

export default async () => {
  // Setup database test
  await setupTestDatabase();

  // Create test accounts
  await createTestUser('admin@example.com', 'password123', 'admin');
  await createTestUser('user@example.com', 'password123', 'user');

  // Setup test data
  await seedTestData();

  console.log('✅ Test setup complete');
};

// tests/global-teardown.ts
import { cleanupTestDatabase } from '../helpers/db';

export default async () => {
  // Cleanup test database
  await cleanupTestDatabase();

  // Cleanup test files
  await cleanupTestFiles();

  console.log('✅ Test teardown complete');
};
```

### Test Environment Variables

```bash
# .env.test
NODE_ENV=test
DATABASE_URL=postgresql://test:test@localhost:5432/testdb
API_BASE_URL=http://localhost:3000/api
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=password123
PLAYWRIGHT_BROWSERS_PATH=0
```

---

## 2. Cypress Setup

### Instalación

```bash
# Instalar Cypress
npm install -D cypress

# Abrir Cypress (crea configuración inicial)
npx cypress open

# Instalar dependencies adicionales
npm install -D @testing-library/cypress
```

### Configuración Básica

```javascript
// cypress.config.js
const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    // Base URL
    baseUrl: 'http://localhost:3000',

    // Viewport
    viewportWidth: 1280,
    viewportHeight: 720,

    // Test files pattern
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',

    // Support file
    supportFile: 'cypress/support/e2e.js',

    // Fixtures path
    fixturesFolder: 'cypress/fixtures',

    // Screenshots/videos
    screenshotsFolder: 'cypress/screenshots',
    videosFolder: 'cypress/videos',
    video: true,
    screenshotOnRunFailure: true,

    // Test settings
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 30000,

    // Retry
    retries: {
      runMode: 2,
      openMode: 0,
    },

    // Environment variables
    env: {
      apiUrl: 'http://localhost:3000/api',
      adminUser: 'admin@example.com',
      adminPass: 'password123',
    },

    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },

  component: {
    devServer: {
      framework: 'create-react-app',
      bundler: 'webpack',
    },
    specPattern: 'cypress/component/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/component.js',
  },
});
```

### Support File

```javascript
// cypress/support/e2e.js
import './commands';

// Custom command para login
Cypress.Commands.add('login', (email, password) => {
  cy.session([email, password], () => {
    cy.visit('/login');
    cy.get('[data-testid="email"]').type(email);
    cy.get('[data-testid="password"]').type(password);
    cy.get('[data-testid="login-button"]').click();
    cy.url().should('include', '/dashboard');
  });
});

// Custom command para crear usuario
Cypress.Commands.add('createUser', (userData) => {
  cy.request({
    method: 'POST',
    url: '/api/test/users',
    body: userData,
  });
});

// Custom command para limpiar data
Cypress.Commands.add('cleanDb', () => {
  cy.request({
    method: 'POST',
    url: '/api/test/cleanup',
  });
});

// Or use testing-library/cypress
import '@testing-library/cypress/add-commands';
```

---

## 3. Jest Setup (Unit/Integration)

### Instalación

```bash
# Instalar Jest
npm install -D jest @types/jest ts-jest

# O con Vite
npm install -D vitest jsdom @vitest/ui
```

### Configuración Jest

```javascript
// jest.config.js
module.exports = {
  // Test environment
  testEnvironment: 'jsdom',

  // Test files pattern
  testMatch: [
    '<rootDir>/tests/unit/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/tests/integration/**/*.test.{js,jsx,ts,tsx}',
  ],

  // Transform configuration
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },

  // Module name mapping
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // Module directories
  moduleDirectories: ['node_modules', '<rootDir>'],

  // Ignore patterns
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],

  // Coverage path ignore
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/',
    '/dist/',
  ],
};
```

### Setup Files

```typescript
// tests/setup.ts
import '@testing-library/jest-dom';

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Suppress console warnings in tests
const originalWarn = console.warn;
console.warn = (...args) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('ReactDOM.render is no longer supported')
  ) {
    return;
  }
  originalWarn.call(console, ...args);
};
```

---

## 4. Test Database Setup

### PostgreSQL Test Database

```typescript
// tests/helpers/db-setup.ts
import { Pool } from 'pg';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const setupTestDatabase = async () => {
  const { DATABASE_URL } = process.env;

  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL not set in environment');
  }

  // Create test database if not exists
  try {
    await execAsync(`createdb test_webapp`);
  } catch (error) {
    // Database might already exist
  }

  console.log('✅ Test database setup complete');
};

export const closeTestDatabase = async () => {
  // Cleanup connections
  console.log('✅ Test database connection closed');
};
```

### Prisma Test Setup

```typescript
// tests/helpers/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export const setupTestDb = async () => {
  // Enable foreign keys and clean database
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = OFF');
  await prisma.$executeRawUnsafe('DELETE FROM users');
  await prisma.$executeRawUnsafe('DELETE FROM products');
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON');
};

export const closeTestDb = async () => {
  await prisma.$disconnect();
};
```

---

## 5. Mocking y Test Doubles

### Jest Mocks

```typescript
// tests/mocks/handlers.ts
import { rest } from 'msw';

export const handlers = [
  // Login mock
  rest.post('/api/auth/login', (req, res, ctx) => {
    const { email, password } = req.body as any;

    if (email === 'test@example.com' && password === 'password123') {
      return res(
        ctx.status(200),
        ctx.json({
          token: 'fake-jwt-token',
          user: { id: '1', email: 'test@example.com', name: 'Test User' },
        })
      );
    }

    return res(
      ctx.status(401),
      ctx.json({ error: 'Invalid credentials' })
    );
  }),

  // Get users mock
  rest.get('/api/users', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        { id: '1', name: 'John Doe', email: 'john@example.com' },
        { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
      ])
    );
  }),
];
```

### MSW Setup (API Mocking)

```typescript
// tests/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Component Mocking

```typescript
// __mocks__/api.ts
export const api = {
  getUser: jest.fn(),
  createUser: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
};

// tests/unit/my-component.test.ts
import { api } from '../../src/api';

jest.mock('../../src/api');

test('should create user', async () => {
  api.createUser.mockResolvedValue({ id: '1', name: 'John' });

  const result = await createUser({ name: 'John' });

  expect(result.id).toBe('1');
  expect(api.createUser).toHaveBeenCalledWith({ name: 'John' });
});
```

---

## 6. Test Data Management

### Fixtures

```json
// cypress/fixtures/user.json
{
  "id": "1",
  "email": "test@example.com",
  "name": "Test User",
  "role": "user",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### Factory Pattern

```typescript
// tests/factories/userFactory.ts
interface UserData {
  email?: string;
  name?: string;
  role?: string;
}

export const createUser = (overrides: UserData = {}) => {
  const defaultUser = {
    id: '1',
    email: 'user@example.com',
    name: 'Test User',
    role: 'user',
  };

  return { ...defaultUser, ...overrides };
};

export const createAdmin = (overrides: UserData = {}) => {
  return createUser({ role: 'admin', ...overrides });
};

export const createRandomUser = () => {
  const id = Math.random().toString(36).substr(2, 9);
  return createUser({
    email: `user-${id}@example.com`,
    name: `User ${id}`,
  });
};
```

### Test Data Seeding

```typescript
// tests/helpers/seed.ts
import { prisma } from './prisma';

export const seedTestData = async () => {
  // Create test users
  await prisma.user.createMany({
    data: [
      { email: 'user1@example.com', name: 'User 1', role: 'user' },
      { email: 'user2@example.com', name: 'User 2', role: 'user' },
      { email: 'admin@example.com', name: 'Admin', role: 'admin' },
    ],
  });

  // Create test products
  await prisma.product.createMany({
    data: [
      { name: 'Product 1', price: 100, stock: 10 },
      { name: 'Product 2', price: 200, stock: 20 },
      { name: 'Product 3', price: 300, stock: 0 },
    ],
  });

  console.log('✅ Test data seeded');
};
```

---

## 7. CI/CD Configuration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  unit-tests:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: testdb
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v2

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/testdb

      - name: Generate coverage report
        run: npm run test:unit -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v2

  e2e-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Build application
        run: npm run build

      - name: Start application
        run: npm run start &
        env:
          NODE_ENV: test

      - name: Wait for server
        run: npx wait-on http://localhost:3000

      - name: Run Playwright tests
        run: npx playwright test

      - name: Upload test results
        uses: actions/upload-artifact@v2
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

### Docker Compose for Testing

```yaml
# docker-compose.test.yml
version: '3.8'

services:
  app:
    build: .
    command: npm run dev
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=test
      - DATABASE_URL=postgresql://test:test@db:5432/testdb
    depends_on:
      - db

  db:
    image: postgres:13
    environment:
      POSTGRES_PASSWORD: test
      POSTGRES_DB: testdb
    ports:
      - "5432:5432"
    volumes:
      - test-db:/var/lib/postgresql/data

volumes:
  test-db:
```

---

## 8. Scripts de Package.json

```json
{
  "scripts": {
    "test": "npm run test:unit && npm run test:integration",
    "test:unit": "jest tests/unit --coverage",
    "test:integration": "jest tests/integration --runInBand",
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug",
    "test:all": "npm run test && npm run test:e2e",
    "test:ci": "npm run test:unit && npm run test:integration && npm run test:e2e -- --reporter=dot",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:clear": "jest --clearCache",
    "test:e2e:install": "playwright install",
    "test:e2e:install-deps": "playwright install-deps"
  }
}
```

---

## 9. Environment-Specific Config

### Development

```javascript
// jest.config.dev.js
module.exports = {
  ...require('./jest.config.js'),
  testEnvironment: 'jsdom',
  watchAll: true,
  verbose: true,
};
```

### CI

```javascript
// jest.config.ci.js
module.exports = {
  ...require('./jest.config.js'),
  testEnvironment: 'jsdom',
  ci: true,
  maxWorkers: 4,
  coverageDirectory: 'coverage',
  reporters: ['default', 'jest-junit'],
};
```

---

## 10. Troubleshooting Common Issues

### Issue: Playwright Browser Not Found

```bash
# Solución
npx playwright install
npx playwright install-deps
```

### Issue: Cypress Can't Connect to Server

```javascript
// cypress.config.js
e2e: {
  baseUrl: 'http://localhost:3000',
  supportFile: 'cypress/support/e2e.js',
  video: false, // Disable video for CI
  screenshotOnRunFailure: true,
}
```

### Issue: Jest CSS Imports

```javascript
// jest.config.js
moduleNameMapper: {
  '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
}
```

### Issue: Test Database Connection

```typescript
// tests/helpers/db.ts
export const getTestDbUrl = () => {
  const url = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/testdb';
  return url;
};
```

---

## 11. Best Practices Summary

### ✅ Setup Checklist

- [ ] Playwright installed and configured
- [ ] Cypress installed (if using)
- [ ] Jest configured for unit/integration
- [ ] Test database setup (dev + CI)
- [ ] Environment variables configured
- [ ] Mock servers configured (MSW)
- [ ] Fixtures and test data ready
- [ ] CI/CD pipeline configured
- [ ] Scripts in package.json
- [ ] Documentation updated

### ✅ Performance

- Run unit tests on every commit
- Run integration tests on PR
- Run E2E tests nightly
- Parallelize where possible
- Use test sharding for large suites
- Cache dependencies in CI

### ✅ Maintainability

- Centralized config files
- Reusable test helpers
- Page Object Model for E2E
- Test data factories
- Clear folder structure
- Descriptive test names

---

**Estado**: Setup completo para testing webapp
**Herramientas**: Playwright, Cypress, Jest, MSW
**CI/CD**: GitHub Actions, Docker Compose
**Performance**: Paralelización y caching configurado
