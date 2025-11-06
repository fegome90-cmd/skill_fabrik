# WebApp Testing - Tipos de Testing

## Overview

Testing de aplicaciones web se organiza en **4 niveles jerárquicos**:
1. **Unit Tests** - Testing de componentes aislados
2. **Integration Tests** - Testing de interacciones
3. **E2E Tests** - Testing de flujos completos
4. **Visual Tests** - Testing de UI/UX

## 1. Unit Tests

### Propósito
Validar **funciones y componentes individuales** de forma aislada, sin dependencias externas.

### Cuándo Usar
- Lógica de negocio pura
- Utilidades y helpers
- Validaciones
- Cálculos y transformaciones
- Componentes React/Vue aisladamente

### Frameworks Recomendados
- **Jest** (JavaScript/TypeScript)
- **Vitest** (Vite + Jest)
- **Mocha + Chai** (alternativa)

### Ejemplo Estructura

```typescript
// tests/unit/validators.test.ts
import { validateEmail, validatePassword, formatUser } from '../../src/utils/validators';

describe('Validators', () => {
  // describe agrupa tests relacionados
  describe('validateEmail', () => {
    // it/test define test individual
    it('should accept valid email format', () => {
      // Arrange
      const email = 'user@example.com';

      // Act
      const result = validateEmail(email);

      // Assert
      expect(result).toBe(true);
    });

    it('should reject email without @', () => {
      expect(validateEmail('userexample.com')).toBe(false);
    });

    it('should reject email without domain', () => {
      expect(validateEmail('user@')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should accept strong password', () => {
      expect(validatePassword('StrongPass123!')).toBe(true);
    });

    it('should reject weak password (too short)', () => {
      expect(validatePassword('weak')).toBe(false);
    });

    it('should reject password without numbers', () => {
      expect(validatePassword('OnlyLetters!')).toBe(false);
    });

    it('should reject password without special chars', () => {
      expect(validatePassword('NoSpecial123')).toBe(false);
    });
  });

  describe('formatUser', () => {
    it('should format user with full name', () => {
      const user = { firstName: 'John', lastName: 'Doe', email: 'john@example.com' };
      const formatted = formatUser(user);

      expect(formatted).toBe('John Doe (john@example.com)');
    });

    it('should handle missing last name', () => {
      const user = { firstName: 'Jane', lastName: '', email: 'jane@example.com' };
      const formatted = formatUser(user);

      expect(formatted).toBe('Jane (jane@example.com)');
    });
  });
});
```

### Componente React Unit Test

```typescript
// tests/unit/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../../src/components/Button';

describe('Button Component', () => {
  it('should render with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should render with custom variant', () => {
    const { container } = render(<Button variant="primary">Click me</Button>);
    expect(container.firstChild).toHaveClass('btn-primary');
  });

  it('should match snapshot', () => {
    const { container } = render(<Button>Click me</Button>);
    expect(container.firstChild).toMatchSnapshot();
  });
});
```

### Métricas de Unit Tests
- **Velocidad**: < 100ms por test
- **Cobertura objetivo**: ≥80%
- **Dependencias**: Mockeadas
- **Setup/Teardown**: Mínimo

---

## 2. Integration Tests

### Propósito
Validar **interacciones entre componentes/servicios**, asegurando que trabajan correctamente juntos.

### Cuándo Usar
- APIs y endpoints
- Interacciones entre componentes
- Flujos de datos
- Integración con servicios externos (mockeados)
- Base de datos (con test DB)

### Frameworks Recomendados
- **Playwright** (UI integration)
- **Supertest** (API integration)
- **Jest** + library específica

### API Integration Test (Playwright)

```typescript
// tests/integration/auth.spec.ts
import { test, expect, request } from '@playwright/test';

test.describe('Auth API', () => {
  let apiContext;

  test.beforeAll(async ({}) => {
    apiContext = await request.newContext({
      baseURL: 'http://localhost:3000/api',
      extraHTTPHeaders: {
        'Content-Type': 'application/json',
      },
    });
  });

  test('should login with valid credentials', async () => {
    const response = await apiContext.post('/auth/login', {
      data: {
        email: 'test@example.com',
        password: 'password123',
      },
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.token).toBeDefined();
    expect(body.user.id).toBe('123');
  });

  test('should reject invalid credentials', async () => {
    const response = await apiContext.post('/auth/login', {
      data: {
        email: 'test@example.com',
        password: 'wrongpassword',
      },
    });

    expect(response.status()).toBe(401);

    const body = await response.json();
    expect(body.error).toContain('Invalid credentials');
  });

  test('should register new user', async () => {
    const response = await apiContext.post('/auth/register', {
      data: {
        email: `user${Date.now()}@example.com`,
        password: 'password123',
        name: 'Test User',
      },
    });

    expect(response.status()).toBe(201);

    const body = await response.json();
    expect(body.user.id).toBeDefined();
    expect(body.user.email).toBeTruthy();
  });
});
```

### Component Integration Test

```typescript
// tests/integration/UserList.spec.ts
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { UserList } from '../../src/components/UserList';

const server = setupServer(
  rest.get('/api/users', (req, res, ctx) => {
    return res(
      ctx.json([
        { id: 1, name: 'John Doe', email: 'john@example.com' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
      ])
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('should load and display users', async () => {
  render(<UserList />);

  // Loading state
  expect(screen.getByText(/loading/i)).toBeInTheDocument();

  // Wait for users to load
  await waitFor(() => {
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });

  // Verify users are displayed
  expect(screen.getByText('John Doe')).toBeInTheDocument();
  expect(screen.getByText('Jane Smith')).toBeInTheDocument();
});

test('should handle search', async () => {
  const user = userEvent.setup();
  render(<UserList />);

  await waitFor(() => {
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  // Search for John
  const searchInput = screen.getByPlaceholderText(/search users/i);
  await user.type(searchInput, 'John');

  await waitFor(() => {
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
  });
});
```

### Database Integration Test

```typescript
// tests/integration/user-repository.test.ts
import { createTestDb, closeTestDb } from '../helpers/test-db';
import { UserRepository } from '../../src/repositories/UserRepository';

describe('User Repository', () => {
  let db;
  let userRepo;

  beforeEach(async () => {
    db = await createTestDb();
    userRepo = new UserRepository(db);
  });

  afterEach(async () => {
    await closeTestDb(db);
  });

  test('should create user', async () => {
    const userData = {
      email: 'test@example.com',
      name: 'Test User',
    };

    const user = await userRepo.create(userData);

    expect(user.id).toBeDefined();
    expect(user.email).toBe(userData.email);
    expect(user.name).toBe(userData.name);
    expect(user.createdAt).toBeDefined();
  });

  test('should find user by id', async () => {
    // Create user first
    const created = await userRepo.create({
      email: 'test@example.com',
      name: 'Test User',
    });

    // Find it
    const found = await userRepo.findById(created.id);

    expect(found).toBeDefined();
    expect(found.email).toBe('test@example.com');
  });

  test('should update user', async () => {
    const user = await userRepo.create({
      email: 'test@example.com',
      name: 'Test User',
    });

    const updated = await userRepo.update(user.id, {
      name: 'Updated Name',
    });

    expect(updated.name).toBe('Updated Name');
  });

  test('should delete user', async () => {
    const user = await userRepo.create({
      email: 'test@example.com',
      name: 'Test User',
    });

    await userRepo.delete(user.id);

    const found = await userRepo.findById(user.id);
    expect(found).toBeNull();
  });
});
```

### Métricas de Integration Tests
- **Velocidad**: 1-5 segundos por test
- **Cobertura objetivo**: ≥70%
- **Dependencias**:部分 reales (DB, API con mocks)
- **Setup/Teardown**: Test DB, mocks

---

## 3. End-to-End (E2E) Tests

### Propósito
Validar **flujos completos de usuario** desde la perspectiva del usuario final, probando toda la aplicación integrada.

### Cuándo Usar
- User journeys críticos
- Flujos de checkout/payment
- Autenticación completa
- Navegación compleja
- Features de negocio críticas

### Frameworks Recomendados
- **Playwright** (recomendado, más rápido)
- **Cypress** (buena UI, fáciles de escribir)

### Playwright E2E Test

```typescript
// tests/e2e/shopping-cart.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Shopping Cart Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should add product to cart', async ({ page }) => {
    // Navigate to products
    await page.goto('/products');

    // Add product to cart
    await page.click('[data-testid="product-1"]');
    await page.click('[data-testid="add-to-cart"]');

    // Verify cart count
    await expect(page.locator('[data-testid="cart-count"]'))
      .toContainText('1');

    // Go to cart
    await page.click('[data-testid="cart-link"]');

    // Verify product in cart
    await expect(page.locator('[data-testid="cart-item"]'))
      .toBeVisible();
    await expect(page.locator('[data-testid="cart-item-title"]'))
      .toContainText('Product Name');
  });

  test('should complete checkout', async ({ page }) => {
    // Add items to cart
    await page.goto('/products');
    await page.click('[data-testid="product-1"] [data-testid="add-to-cart"]');
    await page.click('[data-testid="product-2"] [data-testid="add-to-cart"]');

    // Go to cart
    await page.click('[data-testid="cart-link"]');

    // Proceed to checkout
    await page.click('[data-testid="checkout-button"]');

    // Fill shipping info
    await page.fill('[data-testid="shipping-name"]', 'John Doe');
    await page.fill('[data-testid="shipping-address"]', '123 Main St');
    await page.fill('[data-testid="shipping-city"]', 'New York');
    await page.fill('[data-testid="shipping-zip"]', '10001');
    await page.selectOption('[data-testid="shipping-country"]', 'US');

    // Select payment method
    await page.click('[data-testid="payment-cc"]');

    // Fill payment info
    await page.fill('[data-testid="cc-number"]', '4242424242424242');
    await page.fill('[data-testid="cc-exp"]', '12/25');
    await page.fill('[data-testid="cc-cvc"]', '123');

    // Place order
    await page.click('[data-testid="place-order"]');

    // Verify success
    await expect(page).toHaveURL(/order-confirmation/);
    await expect(page.locator('[data-testid="order-number"]'))
      .toBeVisible();
    await expect(page.locator('[data-testid="success-message"]'))
      .toContainText('Order placed successfully');
  });

  test('should handle out of stock', async ({ page }) => {
    await page.goto('/products');

    // Find out of stock product
    await expect(page.locator('[data-testid="product-3"]')).toContainText('Out of Stock');

    // Try to add (should be disabled)
    await expect(page.locator('[data-testid="product-3"] [data-testid="add-to-cart"]'))
      .toBeDisabled();
  });

  test('should persist cart after page reload', async ({ page }) => {
    await page.goto('/products');
    await page.click('[data-testid="product-1"] [data-testid="add-to-cart"]');

    // Verify in cart
    await expect(page.locator('[data-testid="cart-count"]'))
      .toContainText('1');

    // Reload page
    await page.reload();

    // Cart should persist
    await expect(page.locator('[data-testid="cart-count"]'))
      .toContainText('1');
  });
});
```

### Cypress E2E Test

```typescript
// cypress/e2e/user-registration.cy.ts
describe('User Registration', () => {
  it('should register new user successfully', () => {
    // Visit registration page
    cy.visit('/register');

    // Fill form
    cy.get('[data-testid="name"]').type('John Doe');
    cy.get('[data-testid="email"]').type('john.doe@example.com');
    cy.get('[data-testid="password"]').type('StrongPass123!');
    cy.get('[data-testid="confirm-password"]').type('StrongPass123!');
    cy.get('[data-testid="terms"]').check();

    // Submit
    cy.get('[data-testid="register-button"]').click();

    // Verify success
    cy.url().should('include', '/dashboard');
    cy.get('[data-testid="welcome-message"]').should('contain', 'Welcome John');
    cy.get('[data-testid="user-menu"]').should('be.visible');
  });

  it('should validate required fields', () => {
    cy.visit('/register');

    // Try submit empty form
    cy.get('[data-testid="register-button"]').click();

    // Verify validation errors
    cy.get('[data-testid="name-error"]').should('contain', 'Name is required');
    cy.get('[data-testid="email-error"]').should('contain', 'Email is required');
    cy.get('[data-testid="password-error"]').should('contain', 'Password is required');
  });

  it('should validate email format', () => {
    cy.visit('/register');

    cy.get('[data-testid="email"]').type('invalid-email');
    cy.get('[data-testid="register-button"]').click();

    cy.get('[data-testid="email-error"]').should('contain', 'Invalid email format');
  });
});
```

### E2E Test - Page Object Model

```typescript
// tests/e2e/pages/LoginPage.ts
import { Page, Locator } from '@playwright/test';

export class LoginPage {
  private page: Page;
  public emailInput: Locator;
  public passwordInput: Locator;
  public loginButton: Locator;
  public errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('[data-testid="email"]');
    this.passwordInput = page.locator('[data-testid="password"]');
    this.loginButton = page.locator('[data-testid="login-button"]');
    this.errorMessage = page.locator('[data-testid="error-message"]');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async expectError(message: string) {
    await expect(this.errorMessage).toContainText(message);
  }
}

// Usage in test
test('login with invalid credentials', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('test@example.com', 'wrongpassword');
  await loginPage.expectError('Invalid credentials');
});
```

### Métricas de E2E Tests
- **Velocidad**: 5-30 segundos por test
- **Cobertura objetivo**: User journeys críticos
- **Dependencias**: Reales (browser, servidor)
- **Setup/Teardown**: Database seed, browser setup

---

## 4. Visual Tests

### Propósito
Validar **aspectos visuales** de la aplicación (UI, responsive design, visual regressions).

### Frameworks Recomendados
- **Playwright Visual Testing**
- **Cypress Percy**
- **Chromatic** (Storybook)

### Playwright Visual Test

```typescript
// tests/visual/homepage.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Visual Tests', () => {
  test('homepage should match visual snapshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Take screenshot
    await expect(page).toHaveScreenshot('homepage.png', {
      fullPage: true,
    });
  });

  test('login page should match visual snapshot', async ({ page }) => {
    await page.goto('/login');

    await expect(page).toHaveScreenshot('login-page.png');
  });

  test('should match across different viewports', async ({ page }) => {
    const viewports = [
      { width: 1280, height: 720 },  // Desktop
      { width: 768, height: 1024 },  // Tablet
      { width: 375, height: 667 },   // Mobile
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('/');

      await expect(page).toHaveScreenshot(`homepage-${viewport.width}.png`);
    }
  });

  test('should detect visual regressions', async ({ page }) => {
    await page.goto('/products');

    // This will fail if visual regression is detected
    await expect(page).toHaveScreenshot('products-page.png', {
      maxDiffPixelRatio: 0.01, // Allow 1% difference
    });
  });
});
```

---

## Estrategia de Testing Pyramid

### Distribución Recomendada

```
        /\
       /  \          E2E Tests (5-10%)
      / E2E \
     /______\
    /        \
   / Integration \
  /   Tests     \
 /    (20-30%)   \
/________________\
 \      Unit      \
  \    Tests       \
   \  (60-70%)      \
    \________________\
```

### Por Componente

| Componente | Unit | Integration | E2E | Visual |
|------------|------|-------------|-----|--------|
| **Auth** | 70% | 20% | 10% | - |
| **Shopping Cart** | 40% | 35% | 20% | 5% |
| **Checkout** | 30% | 30% | 35% | 5% |
| **Dashboard** | 50% | 30% | 15% | 5% |
| **User Profile** | 60% | 25% | 10% | 5% |

### Cuándo Usar Cada Nivel

#### Prioridad Alta (Crítico para negocio)
- E2E tests para user journeys críticos
- Unit tests para lógica compleja
- Integration tests para APIs críticas

#### Prioridad Media (Importante)
- Unit tests para componentes principales
- Integration tests para integraciones
- E2E tests para features importantes

#### Prioridad Baja (Deseable)
- Unit tests para utilities/helpers
- Visual tests para UI components
- E2E tests para features secundarias

---

## Matriz de Decisión

| Criterio | Unit | Integration | E2E | Visual |
|----------|------|-------------|-----|--------|
| **Velocidad** | ⚡⚡⚡ | ⚡⚡ | ⚡ | ⚡⚡ |
| **Cobertura** | Alto | Medio | Bajo | Alto (UI) |
| **Mantenibilidad** | Fácil | Moderado | Difícil | Moderado |
| **Debugging** | Fácil | Moderado | Difícil | Fácil |
| **CI/CD Fit** | ✅ Excelente | ✅ Bueno | ⚠️ Lento | ✅ Bueno |
| **Mocking** | ✅ Fácil | ⚠️ Parcial | ❌ Difícil | ❌ No |
| **UI Coverage** | ❌ No | ⚠️ Parcial | ✅ Sí | ✅ Sí |
| **API Coverage** | ✅ Sí | ✅ Sí | ✅ Sí | ❌ No |

---

## Anti-patterns to Avoid

### ❌ Unit Tests
- Testing implementation details
- Testing external dependencies (mock them!)
- Tests depending on each other
- Test with multiple responsibilities

### ❌ Integration Tests
- Testing too much (use E2E)
- Not mocking slow external services
- Tests that fail intermittently

### ❌ E2E Tests
- Testing everything (focus on critical paths)
- Using brittle selectors
- Tests without proper setup/teardown
- Not parallelizing tests

### ❌ Visual Tests
- Testing dynamic content (timestamps, ads)
- Not accounting for animations
- Not using stable selectors

---

## Best Practices Summary

✅ **Unit Tests**
- Test behavior, not implementation
- One assertion per test (when possible)
- Use test doubles (mocks/stubs)
- Fast and isolated

✅ **Integration Tests**
- Test contracts between components
- Mock external services
- Clear setup and teardown
- Test real integration points

✅ **E2E Tests**
- Focus on critical user journeys
- Use stable, semantic selectors
- Parallelize tests
- Proper test data management

✅ **Visual Tests**
- Use semantic HTML
- Control animation timing
- Test across viewports
- Manage baseline screenshots

---

**Conclusión**: Una **estrategia balanceada** combinando todos los tipos de testing asegura calidad completa de la aplicación web.
