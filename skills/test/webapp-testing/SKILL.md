---
id: webapp-testing
version: 0.1.0
type: guideline
summary: 'Testing automatizado de aplicaciones web con Playwright y Cypress. Crea suites E2E, integration y unit tests para validar funcionalidad completa.'
audience: engineers, qa
when_to_use: 'Al crear suite de testing para aplicaciones web nuevas o existentes. Usa antes de deploy, en CI/CD, o para regression testing.'
provides: 'Suites de test automatizadas, configuración de entornos, ejecución paralela, reportes detallados, integración CI/CD.'
resources:
  - resources/test-types.md
  - resources/setup.md
  - resources/execution.md
  - resources/analysis.md
scripts:
  - name: init-tests
    run: npx playwright install && npx cypress install
    note: Instala Playwright y Cypress
  - name: run-e2e
    run: npx playwright test
    note: Ejecuta tests E2E con Playwright
  - name: run-integration
    run: npm run test:integration
    note: Ejecuta tests de integración
  - name: generate-report
    run: npx playwright show-report
    note: Genera reporte HTML de resultados
limits: 'Requiere Node.js ≥16. Playwright y Cypress deben estar instalados. Tests requieren app corriendo en puerto específico.'
---

## Objetivo

Crear y ejecutar **suites de testing automatizadas** para aplicaciones web, cubriendo diferentes niveles: unit, integration y end-to-end (E2E).

**Cuándo usar**:
- Al desarrollar nueva aplicación web
- Antes de deploy a producción
- Para regression testing
- En CI/CD pipelines
- Para validar funcionalidades críticas

**Cuándo NO usar**: Para testing de APIs puras sin UI (usar herramientas especializadas de API testing).

**Qué problema resuelve**: Automatiza testing, previene regresiones, valida UX, acelera feedback loop, garantiza calidad antes de deploy.

## Procedimiento (resumen)

### Setup Inicial

1. **Instalar herramientas**: Playwright y/o Cypress según necesidad
2. **Configurar entornos**: Development, staging, production
3. **Definir test strategy**: Qué testear, qué priorizar

### Crear Test Suites

1. **Unit Tests**: Lógica de negocio, funciones puras
2. **Integration Tests**: Interacciones entre componentes
3. **E2E Tests**: Flujos completos de usuario

### Ejecutar y Validar

1. **Local execution**: Tests en entorno local
2. **CI/CD integration**: Automatización en pipeline
3. **Report generation**: Reportes detallados de resultados

## Tipos de Testing

### Unit Tests
- **Scope**: Funciones individuales, componentes aislados
- **Velocidad**: Muy rápida (< 1s por test)
- **Dependencias**: Mockeadas
- **Framework**: Jest, Vitest

### Integration Tests
- **Scope**: Interacción entre componentes/servicios
- **Velocidad**: Moderada (1-5s por test)
- **Dependencias**:部分 reales
- **Framework**: Jest + Supertest, Playwright

### E2E Tests
- **Scope**: Flujos completos de usuario
- **Velocidad**: Lenta (5-30s por test)
- **Dependencias**: Reales, browser/servidor
- **Framework**: Playwright, Cypress

## Checklist

- [ ] Herramientas instaladas (Playwright, Cypress, Jest)
- [ ] Test strategy definida
- [ ] Unit tests para lógica crítica
- [ ] Integration tests para componentes
- [ ] E2E tests para user journeys
- [ ] Tests ejecutan en CI/CD
- [ ] Reportes configurados
- [ ] Coverage threshold definido (≥80%)
- [ ] Test data management setup
- [ ] Parallel execution configurado

## Ejemplos

### ✅ Correcto - Unit Test

```typescript
// tests/unit/user-validator.test.ts
import { validateEmail, validatePassword } from '../utils/validators';

describe('User Validation', () => {
  describe('validateEmail', () => {
    it('should accept valid email', () => {
      expect(validateEmail('user@example.com')).toBe(true);
    });

    it('should reject invalid email', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should accept strong password', () => {
      expect(validatePassword('StrongPass123!')).toBe(true);
    });

    it('should reject weak password', () => {
      expect(validatePassword('weak')).toBe(false);
      expect(validatePassword('123456')).toBe(false);
      expect(validatePassword('password')).toBe(false);
    });
  });
});
```

### ✅ Correcto - Integration Test (Playwright)

```typescript
// tests/integration/user-login.spec.ts
import { test, expect } from '@playwright/test';

test.describe('User Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should login with valid credentials', async ({ page }) => {
    // Fill login form
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');

    // Verify redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="user-name"]')).toContainText('Test User');
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'wrongpassword');
    await page.click('[data-testid="login-button"]');

    // Verify error message
    await expect(page.locator('[data-testid="error-message"]'))
      .toContainText('Invalid credentials');
  });

  test('should validate required fields', async ({ page }) => {
    // Try submit without filling
    await page.click('[data-testid="login-button"]');

    // Verify validation errors
    await expect(page.locator('[data-testid="email-error"]'))
      .toContainText('Email is required');
    await expect(page.locator('[data-testid="password-error"]'))
      .toContainText('Password is required');
  });
});
```

### ✅ Correcto - E2E Test (Cypress)

```typescript
// cypress/e2e/shopping-cart.cy.ts
describe('Shopping Cart Flow', () => {
  it('should complete purchase', () => {
    // Login
    cy.visit('/login');
    cy.get('[data-testid="email"]').type('user@example.com');
    cy.get('[data-testid="password"]').type('password123');
    cy.get('[data-testid="login-button"]').click();

    // Add product to cart
    cy.visit('/products');
    cy.get('[data-testid="product-1"]').click();
    cy.get('[data-testid="add-to-cart"]').click();

    // Verify cart
    cy.get('[data-testid="cart-count"]').should('contain', '1');

    // Checkout
    cy.visit('/cart');
    cy.get('[data-testid="checkout"]').click();
    cy.fillShippingInfo({
      name: 'John Doe',
      address: '123 Main St',
      city: 'New York',
      zip: '10001'
    });
    cy.get('[data-testid="place-order"]').click();

    // Verify success
    cy.url().should('include', '/order-confirmation');
    cy.get('[data-testid="order-number"]').should('be.visible');
  });
});
```

### ❌ Incorrecto

```typescript
// ❌ Test sin aserciones
test('user login', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[data-testid="email"]', 'test@example.com');
  await page.fill('[data-testid="password"]', 'password123');
  await page.click('[data-testid="login-button"]');
  // Falta verificación - test no valida nada
});

// ❌ Test flakio (dependiente de timing no controlado)
test('async operation', async () => {
  setTimeout(() => {
    expect(something).toBe(true); // Timing unpredictible
  }, 1000);
});

// ❌ Test con dependencias externas no mockeadas
test('fetch user data', async () => {
  const user = await fetch('https://api.external.com/user/123');
  // Depende de servicio externo - puede fallar
  expect(user.id).toBe('123');
});
```

## Herramientas y Comandos

### Playwright Setup

```bash
# Inicializar proyecto
npm init -y

# Instalar Playwright
npm install -D @playwright/test
npx playwright install

# Configuración inicial
npx playwright install-deps  # Instalar browsers system deps

# Crear tests
npx playwright test  # Ejecutar todos los tests
npx playwright test --headed  # Con UI visible
npx playwright test --debug  # Modo debug
npx playwright test --trace on  # Con traces
```

### Cypress Setup

```bash
# Instalar Cypress
npm install -D cypress
npx cypress install

# Abrir Cypress Test Runner
npx cypress open

# Ejecutar tests
npx cypress run  # Headless
npx cypress run --spec "cypress/e2e/**/*.cy.ts"  # Especificar tests
```

### Jest (Unit/Integration)

```bash
# Instalar Jest
npm install -D jest @types/jest ts-jest

# Ejecutar tests
npm test  # Ejecutar todos
npm test -- --coverage  # Con coverage
npm test -- --watch  # Watch mode
```

### Scripts Combinados

```json
{
  "scripts": {
    "test": "npm run test:unit && npm run test:integration",
    "test:unit": "jest tests/unit --coverage",
    "test:integration": "jest tests/integration --runInBand",
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed",
    "test:all": "npm run test && npm run test:e2e",
    "test:ci": "npm run test:unit && npm run test:integration && npm run test:e2e -- --reporter=dot"
  }
}
```

## Recursos

Ver `resources/` para:
- `test-types.md`: Tipos de testing detallados y cuándo usar cada uno
- `setup.md`: Configuración completa de entornos y herramientas
- `execution.md`: Ejecución de tests y CI/CD integration
- `analysis.md`: Análisis de resultados y métricas

### Frameworks por Tipo

| Tipo | Framework | Velocidad | Best For |
|------|-----------|-----------|----------|
| **Unit** | Jest, Vitest | ⚡⚡⚡ | Lógica pura, funciones |
| **Integration** | Playwright, Jest+Supertest | ⚡⚡ | APIs, componentes |
| **E2E** | Playwright, Cypress | ⚡ | User journeys, UX |

### Best Practices

✅ **Al crear tests**:
- Tests independientes y aislados
- Nombres descriptivos (describe/it)
- Una responsabilidad por test
- Datos de test organizados
- Cleanup después de cada test
- Coverage ≥80%
- Parallel execution cuando posible

❌ **Evitar**:
- Tests sin aserciones
- Dependencias externas no mockeadas
- Timing dependencies (sleep/wait)
- Test Brittle (selector frágil)
- Test data hardcodeado en múltiples lugares
- No cleanup entre tests
