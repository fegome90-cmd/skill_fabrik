# Estructura de Pruebas - Patrones y Organización

## Jerarquía de Pruebas

```
src/
├── __tests__/
│   ├── unit/           # Pruebas unitarias aisladas
│   ├── integration/    # Pruebas de integración
│   └── e2e/           # Pruebas end-to-end
├── components/
│   └── Button.test.ts  # Co-ubicado con componente
└── services/
    └── UserService.test.ts  # Co-ubicado con servicio
```

## Patrones de Nomenclatura

### Archivos
- **Unitarias**: `Component.test.ts`, `service.test.ts`
- **Integración**: `workflow.integration.test.ts`
- **E2E**: `user-journey.e2e.test.ts`

### Tests
```typescript
describe('ComponentName', () => {
  describe('methodName', () => {
    it('should do X when Y', () => {});  // "should" + comportamiento
    it('returns expected value when input valid', () => {});
  });
});
```

## Estructura AAA (Arrange-Act-Assert)

```typescript
describe('Calculator', () => {
  it('should add two numbers correctly', () => {
    // Arrange - Preparar el escenario
    const calculator = new Calculator();
    const num1 = 5;
    const num2 = 3;

    // Act - Ejecutar la acción
    const result = calculator.add(num1, num2);

    // Assert - Verificar el resultado
    expect(result).toBe(8);
  });
});
```

## Patrones por Tipo de Test

### 1. Pruebas Unitarias

```typescript
describe('UserService', () => {
  let mockRepository: jest.Mocked<UserRepository>;
  let service: UserService;

  beforeEach(() => {
    mockRepository = {
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    } as any;
    service = new UserService(mockRepository);
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      // Arrange
      const userId = '123';
      const expectedUser = { id: userId, name: 'John' };
      mockRepository.findById.mockResolvedValue(expectedUser);

      // Act
      const result = await service.findById(userId);

      // Assert
      expect(result).toEqual(expectedUser);
      expect(mockRepository.findById).toHaveBeenCalledWith(userId);
    });
  });
});
```

### 2. Pruebas de Integración

```typescript
describe('User Registration Integration', () => {
  let app: Express;
  let db: TestDatabase;

  beforeAll(async () => {
    db = await TestDatabase.create();
    app = createApp({ database: db });
  });

  afterAll(async () => {
    await db.close();
  });

  it('should register user successfully', async () => {
    // Arrange
    const userData = {
      email: 'test@example.com',
      password: 'secure123',
      name: 'Test User'
    };

    // Act
    const response = await request(app)
      .post('/api/users/register')
      .send(userData)
      .expect(201);

    // Assert
    expect(response.body.user.email).toBe(userData.email);
    expect(response.body.user.password).toBeUndefined(); // No expuesto

    // Verificar en DB
    const dbUser = await db.users.findById(response.body.user.id);
    expect(dbUser).toBeTruthy();
  });
});
```

### 3. Pruebas E2E

```typescript
describe('User Journey E2E', () => {
  let page: Page;

  beforeEach(async () => {
    page = await browser.newPage();
  });

  it('should complete user registration flow', async () => {
    // Arrange - Navegar a página
    await page.goto('/register');

    // Act - Completar formulario
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'secure123');
    await page.click('[data-testid="submit"]');

    // Assert - Verificar redirección
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="welcome"]')).toBeVisible();
  });
});
```

## Matchers Comunes

### Números y valores
```typescript
expect(result).toBe(8);                    // Igualdad estricta
expect(result).toEqual({ id: 1 });        // Igualdad profunda
expect(result).toBeGreaterThan(5);        // Comparación
expect(result).toBeCloseTo(3.14, 2);      // Aproximación
```

### Strings y arrays
```typescript
expect(text).toContain('error');           // Substring
expect(array).toHaveLength(3);            // Longitud
expect(array).toContain('item');           // Contiene elemento
expect(object).toHaveProperty('name');     // Propiedad existe
```

### Promesas y async
```typescript
await expect(promise).resolves.toBe('value');
await expect(promise).rejects.toThrow('Error');
expect(promise).resolves.toBeDefined();
```

### Mocks y espías
```typescript
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
expect(mockFn).toHaveBeenCalledTimes(2);
```

## Configuración por Framework

### Jest
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### Vitest
```javascript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      threshold: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  }
});
```

## Buenas Prácticas

1. **Un test, una assertion**: Mantener tests simples y enfocados
2. **Nombres descriptivos**: El test debe explicar su propósito
3. **Independencia**: Tests no deben depender del orden de ejecución
4. **Datos de prueba consistentes**: Usar fixtures o factories
5. **Mock external dependencies**: Aislar el sistema bajo prueba
6. **Tests rápidos**: Tests unitarios < 100ms, integración < 1s