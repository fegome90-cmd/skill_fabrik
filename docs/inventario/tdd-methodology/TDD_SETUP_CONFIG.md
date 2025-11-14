# ⚙️ Configuración TDD: Jest, Estructura y Herramientas

## 📁 Estructura de Proyecto Recomendada

```
my-project/
├── src/
│   ├── routes/
│   │   ├── user.routes.js
│   │   ├── auth.routes.js
│   │   └── index.js
│   ├── controllers/
│   │   ├── user.controller.js
│   │   └── auth.controller.js
│   ├── services/
│   │   ├── user.service.js
│   │   ├── auth.service.js
│   │   └── email.service.js
│   ├── models/
│   │   └── user.model.js
│   ├── repositories/
│   │   └── user.repository.js
│   ├── workers/
│   │   ├── email.worker.js
│   │   └── image-processor.worker.js
│   ├── queues/
│   │   ├── email.queue.js
│   │   └── image.queue.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── validation.middleware.js
│   │   └── error-handler.middleware.js
│   ├── utils/
│   │   ├── validators.js
│   │   ├── errors.js
│   │   └── logger.js
│   ├── config/
│   │   ├── database.js
│   │   ├── redis.js
│   │   └── index.js
│   ├── app.js
│   └── server.js
├── tests/
│   ├── unit/
│   │   ├── controllers/
│   │   │   └── user.controller.test.js
│   │   ├── services/
│   │   │   └── user.service.test.js
│   │   ├── workers/
│   │   │   └── email.worker.test.js
│   │   ├── middleware/
│   │   │   └── validation.test.js
│   │   └── utils/
│   │       └── validators.test.js
│   ├── integration/
│   │   ├── api/
│   │   │   └── user.api.test.js
│   │   ├── repositories/
│   │   │   └── user.repository.test.js
│   │   └── queues/
│   │       └── email.queue.test.js
│   ├── e2e/
│   │   └── user-registration.e2e.test.js
│   ├── helpers/
│   │   ├── db.js
│   │   ├── redis.js
│   │   └── setup.js
│   ├── fixtures/
│   │   └── users.json
│   └── mocks/
│       ├── services/
│       └── repositories/
├── .env.test
├── jest.config.js
├── ecosystem.config.js
└── package.json
```

---

## 📦 package.json Completo

```json
{
  "name": "my-tdd-project",
  "version": "1.0.0",
  "description": "Node.js project with TDD",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "pm2:start": "pm2 start ecosystem.config.js",
    "pm2:stop": "pm2 stop ecosystem.config.js",
    "pm2:restart": "pm2 restart ecosystem.config.js",
    "pm2:reload": "pm2 reload ecosystem.config.js",
    "pm2:logs": "pm2 logs",
    "pm2:monit": "pm2 monit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest tests/unit",
    "test:integration": "jest tests/integration",
    "test:e2e": "jest tests/e2e",
    "test:verbose": "jest --verbose",
    "test:ci": "jest --ci --coverage --maxWorkers=2",
    "lint": "eslint src tests",
    "lint:fix": "eslint src tests --fix",
    "format": "prettier --write \"src/**/*.js\" \"tests/**/*.js\"",
    "db:migrate": "knex migrate:latest",
    "db:rollback": "knex migrate:rollback",
    "db:seed": "knex seed:run"
  },
  "keywords": ["tdd", "node", "express", "pm2"],
  "author": "Your Name",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.2",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    "dotenv": "^16.3.1",
    "winston": "^3.11.0",
    "knex": "^3.0.1",
    "pg": "^8.11.3",
    "bullmq": "^5.1.0",
    "ioredis": "^5.3.2",
    "express-validator": "^7.0.1",
    "helmet": "^7.1.0",
    "cors": "^2.8.5",
    "compression": "^1.7.4"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "supertest": "^6.3.3",
    "@faker-js/faker": "^8.3.1",
    "nock": "^13.4.0",
    "nodemon": "^3.0.2",
    "eslint": "^8.55.0",
    "prettier": "^3.1.1",
    "husky": "^8.0.3",
    "lint-staged": "^15.2.0",
    "sqlite3": "^5.1.6",
    "ioredis-mock": "^8.9.0"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

---

## ⚙️ jest.config.js

```javascript
module.exports = {
  // Entorno de ejecución
  testEnvironment: 'node',

  // Cobertura
  collectCoverageFrom: ['src/**/*.js', '!src/server.js', '!src/config/**', '!**/node_modules/**'],

  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  coverageReporters: ['text', 'lcov', 'html'],

  // Patrones de archivos
  testMatch: ['**/tests/**/*.test.js', '**/tests/**/*.spec.js'],

  // Ignorar
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/coverage/'],

  // Setup
  setupFilesAfterEnv: ['<rootDir>/tests/helpers/setup.js'],

  // Timeout
  testTimeout: 10000,

  // Verbose
  verbose: true,

  // Clear mocks
  clearMocks: true,

  // Module paths
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
  },

  // Transformaciones
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
};
```

---

## 🔧 tests/helpers/setup.js

```javascript
// Setup global para todos los tests
const dotenv = require('dotenv');

// Cargar variables de entorno de test
dotenv.config({ path: '.env.test' });

// Configurar timeout global
jest.setTimeout(10000);

// Mock de console para tests más limpios
global.console = {
  ...console,
  // Dejar solo error y warn en tests
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  // Mantener error y warn para debugging
  // error: jest.fn(),
  // warn: jest.fn(),
};

// Setup global antes de todos los tests
beforeAll(async () => {
  // Inicialización global si es necesaria
});

// Cleanup global después de todos los tests
afterAll(async () => {
  // Cerrar conexiones, limpiar recursos
});

// Cleanup después de cada test
afterEach(() => {
  // Limpiar mocks
  jest.clearAllMocks();
});
```

---

## 🗄️ tests/helpers/db.js

```javascript
const knex = require('knex');
const { join } = require('path');

let db;

const setupTestDB = async () => {
  // Usar SQLite en memoria para tests
  db = knex({
    client: 'sqlite3',
    connection: ':memory:',
    useNullAsDefault: true,
    migrations: {
      directory: join(__dirname, '../../src/database/migrations'),
    },
  });

  // Ejecutar migraciones
  await db.migrate.latest();

  return db;
};

const clearTestDB = async () => {
  if (!db) return;

  // Obtener todas las tablas
  const tables = await db.raw(`
    SELECT name FROM sqlite_master 
    WHERE type='table' 
    AND name NOT LIKE 'sqlite_%'
    AND name NOT LIKE 'knex_%'
  `);

  // Limpiar cada tabla
  for (const { name } of tables) {
    await db(name).del();
  }
};

const closeTestDB = async () => {
  if (db) {
    await db.destroy();
    db = null;
  }
};

const getDB = () => db;

module.exports = {
  setupTestDB,
  clearTestDB,
  closeTestDB,
  getDB,
};
```

---

## 📮 tests/helpers/redis.js

```javascript
const RedisMock = require('ioredis-mock');

let redisClient;

const setupTestRedis = () => {
  redisClient = new RedisMock();
  return redisClient;
};

const clearTestRedis = async () => {
  if (redisClient) {
    await redisClient.flushall();
  }
};

const closeTestRedis = async () => {
  if (redisClient) {
    await redisClient.disconnect();
    redisClient = null;
  }
};

const getRedis = () => redisClient;

module.exports = {
  setupTestRedis,
  clearTestRedis,
  closeTestRedis,
  getRedis,
};
```

---

## 🔐 .env.test

```bash
# Environment
NODE_ENV=test

# Server
PORT=3001

# Database
DB_CLIENT=sqlite3
DB_CONNECTION=:memory:

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=test-secret-key-change-in-production
JWT_EXPIRES_IN=1h

# Email (Mock)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=test
SMTP_PASS=test

# Logging
LOG_LEVEL=error
```

---

## 🔨 ecosystem.config.js (PM2)

```javascript
module.exports = {
  apps: [
    {
      name: 'api',
      script: 'src/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      max_memory_restart: '1G',
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s',
    },
    {
      name: 'worker-email',
      script: 'src/workers/email.worker.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
      max_memory_restart: '512M',
      error_file: './logs/worker-email-error.log',
      out_file: './logs/worker-email-out.log',
      merge_logs: true,
      autorestart: true,
      watch: false,
    },
    {
      name: 'worker-image',
      script: 'src/workers/image-processor.worker.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
      max_memory_restart: '2G',
      error_file: './logs/worker-image-error.log',
      out_file: './logs/worker-image-out.log',
      autorestart: true,
      watch: false,
    },
  ],
};
```

---

## 🎭 Mocks Útiles

### Mock de Express Request/Response

```javascript
// tests/mocks/express.js
const mockRequest = (data = {}) => {
  return {
    body: data.body || {},
    params: data.params || {},
    query: data.query || {},
    headers: data.headers || {},
    user: data.user || null,
    get: jest.fn(name => data.headers?.[name]),
  };
};

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.set = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = () => jest.fn();

module.exports = {
  mockRequest,
  mockResponse,
  mockNext,
};
```

### Mock de Servicios

```javascript
// tests/mocks/services/user.service.mock.js
const createMockUserService = (overrides = {}) => {
  return {
    register: jest.fn().mockResolvedValue({
      id: '123',
      email: 'test@test.com',
      name: 'Test User',
      createdAt: new Date(),
    }),
    findById: jest.fn().mockResolvedValue(null),
    findByEmail: jest.fn().mockResolvedValue(null),
    updateUser: jest.fn().mockResolvedValue({}),
    deleteUser: jest.fn().mockResolvedValue(true),
    ...overrides,
  };
};

module.exports = { createMockUserService };
```

---

## 🧪 Fixtures para Tests

```javascript
// tests/fixtures/users.js
const { faker } = require('@faker-js/faker');

const generateUser = (overrides = {}) => {
  return {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.fullName(),
    password: 'hashed_password',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
};

const generateUsers = (count = 5, overrides = {}) => {
  return Array.from({ length: count }, () => generateUser(overrides));
};

module.exports = {
  generateUser,
  generateUsers,
};
```

---

## 🔍 Utilidades para Tests

```javascript
// tests/helpers/utils.js
const waitFor = ms => new Promise(resolve => setTimeout(resolve, ms));

const expectToThrowAsync = async (fn, errorMessage) => {
  try {
    await fn();
    throw new Error('Expected function to throw');
  } catch (error) {
    if (errorMessage) {
      expect(error.message).toContain(errorMessage);
    }
  }
};

const createTestUser = async (db, userData = {}) => {
  const [id] = await db('users')
    .insert({
      email: 'test@test.com',
      password: 'hashed_password',
      name: 'Test User',
      ...userData,
    })
    .returning('id');

  return db('users').where({ id }).first();
};

module.exports = {
  waitFor,
  expectToThrowAsync,
  createTestUser,
};
```

---

## 🚀 Scripts de CI/CD

### .github/workflows/test.yml

```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run tests
        run: npm run test:ci
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
          REDIS_URL: redis://localhost:6379

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          fail_ci_if_error: true
```

---

## 🎯 Husky + Lint-Staged

### .husky/pre-commit

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm run lint-staged
npm test
```

### package.json (lint-staged config)

```json
{
  "lint-staged": {
    "*.js": ["eslint --fix", "prettier --write", "jest --bail --findRelatedTests"]
  }
}
```

---

## 📊 Coverage Reports

### Configurar Codecov

```yaml
# codecov.yml
coverage:
  status:
    project:
      default:
        target: 80%
        threshold: 1%
    patch:
      default:
        target: 80%
        threshold: 1%
```

---

## 🔐 ESLint Config

```javascript
// .eslintrc.js
module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-var': 'error',
    'prefer-const': 'error',
    eqeqeq: ['error', 'always'],
    curly: ['error', 'all'],
  },
};
```

---

## 🎨 Prettier Config

```javascript
// .prettierrc.js
module.exports = {
  semi: true,
  trailingComma: 'es5',
  singleQuote: true,
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,
  arrowParens: 'always',
  endOfLine: 'lf',
};
```

---

## ✅ Checklist de Configuración Inicial

- [ ] Instalar dependencias: `npm install`
- [ ] Configurar Jest: `jest.config.js`
- [ ] Crear helpers de test: `tests/helpers/`
- [ ] Configurar DB de test: `tests/helpers/db.js`
- [ ] Configurar Redis de test: `tests/helpers/redis.js`
- [ ] Crear fixtures: `tests/fixtures/`
- [ ] Configurar ESLint: `.eslintrc.js`
- [ ] Configurar Prettier: `.prettierrc.js`
- [ ] Configurar Husky: `.husky/pre-commit`
- [ ] Configurar PM2: `ecosystem.config.js`
- [ ] Crear `.env.test`
- [ ] Configurar CI/CD: `.github/workflows/`
- [ ] Verificar scripts npm: `package.json`
- [ ] Primer test: `npm test`
- [ ] Coverage: `npm run test:coverage`

---

**Configuración completa y lista para TDD! 🚀**
