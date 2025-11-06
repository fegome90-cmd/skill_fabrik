# Ejemplos Completos de TDD

## Ejemplo 1: Validador de Contraseñas

### RED - Primera Prueba
```typescript
describe('PasswordValidator', () => {
  it('should reject passwords shorter than 8 characters', () => {
    const validator = new PasswordValidator();

    expect(() => validator.validate('short')).toThrow('Password must be at least 8 characters');
  });
});
```

*Resultado: Error - PasswordValidator no existe*

### GREEN - Implementación Mínima
```typescript
class PasswordValidator {
  validate(password: string): void {
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }
  }
}
```

### RED - Siguiente Caso
```typescript
it('should require at least one uppercase letter', () => {
  const validator = new PasswordValidator();

  expect(() => validator.validate('nouppercase1')).toThrow('Password must contain at least one uppercase letter');
});
```

### GREEN - Añadir Validación
```typescript
validate(password: string): void {
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    throw new Error('Password must contain at least one uppercase letter');
  }
}
```

### REFACTOR - Extraer Validaciones
```typescript
class PasswordValidator {
  private readonly rules: ValidationRule[] = [
    new MinLengthRule(8),
    new UppercaseRule(),
    new NumberRule(),
    new SpecialCharRule()
  ];

  validate(password: string): ValidationResult {
    const errors = this.rules
      .map(rule => rule.validate(password))
      .filter(result => !result.isValid)
      .map(result => result.error);

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

interface ValidationRule {
  validate(password: string): { isValid: boolean; error?: string };
}
```

## Ejemplo 2: Carrito de Compras

### RED - Funcionalidad Básica
```typescript
describe('ShoppingCart', () => {
  it('should calculate total with items', () => {
    const cart = new ShoppingCart();
    cart.addItem(new Product('Book', 10, 2));
    cart.addItem(new Product('Pen', 2, 3));

    expect(cart.getTotal()).toBe(26);
  });
});
```

### GREEN - Implementación Simple
```typescript
class ShoppingCart {
  private items: Product[] = [];

  addItem(product: Product): void {
    this.items.push(product);
  }

  getTotal(): number {
    return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }
}
```

### RED - Descuentos
```typescript
it('should apply 10% discount for orders over $100', () => {
  const cart = new ShoppingCart();
  cart.addItem(new Product('Laptop', 50, 3)); // $150

  expect(cart.getTotalWithDiscount()).toBe(135);
});
```

### GREEN - Añadir Descuentos
```typescript
getTotalWithDiscount(): number {
  const total = this.getTotal();
  return total > 100 ? total * 0.9 : total;
}
```

### REFACTOR - Patrón Strategy
```typescript
interface DiscountStrategy {
  apply(total: number): number;
}

class NoDiscount implements DiscountStrategy {
  apply(total: number): number {
    return total;
  }
}

class PercentageDiscount implements DiscountStrategy {
  constructor(private percentage: number) {}

  apply(total: number): number {
    return total * (1 - this.percentage / 100);
  }
}

class ShoppingCart {
  private items: Product[] = [];
  private discountStrategy: DiscountStrategy = new NoDiscount();

  setDiscountStrategy(strategy: DiscountStrategy): void {
    this.discountStrategy = strategy;
  }

  getTotalWithDiscount(): number {
    const total = this.getTotal();
    return this.discountStrategy.apply(total);
  }
}
```

## Ejemplo 3: API Service

### RED - GET Request
```typescript
describe('UserAPIService', () => {
  let mockFetch: jest.MockedFunction<typeof fetch>;
  let service: UserAPIService;

  beforeEach(() => {
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    service = new UserAPIService();
  });

  it('should fetch user by ID', async () => {
    const mockUser = { id: '1', name: 'John Doe', email: 'john@example.com' };
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockUser
    } as Response);

    const result = await service.getUserById('1');

    expect(result).toEqual(mockUser);
    expect(mockFetch).toHaveBeenCalledWith('/api/users/1');
  });
});
```

### GREEN - Implementación Básica
```typescript
class UserAPIService {
  async getUserById(id: string): Promise<User> {
    const response = await fetch(`/api/users/${id}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch user: ${response.statusText}`);
    }

    return response.json();
  }
}
```

### RED - Manejo de Errores
```typescript
it('should throw error for non-existent user', async () => {
  mockFetch.mockResolvedValue({
    ok: false,
    status: 404,
    statusText: 'Not Found'
  } as Response);

  await expect(service.getUserById('999')).rejects.toThrow('User not found');
});
```

### GREEN - Mejorar Manejo de Errores
```typescript
async getUserById(id: string): Promise<User> {
  try {
    const response = await fetch(`/api/users/${id}`);

    if (response.status === 404) {
      throw new Error('User not found');
    }

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Network error');
  }
}
```

### REFACTOR - Inyección de Dependencias
```typescript
interface HTTPClient {
  get(url: string): Promise<any>;
}

class FetchHTTPClient implements HTTPClient {
  async get(url: string): Promise<any> {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    return response.json();
  }
}

class UserAPIService {
  constructor(private httpClient: HTTPClient = new FetchHTTPClient()) {}

  async getUserById(id: string): Promise<User> {
    try {
      return await this.httpClient.get(`/api/users/${id}`);
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        throw new Error('User not found');
      }
      throw error;
    }
  }
}
```

## Ejemplo 4: Componente React con TDD

### RED - Renderizado Básico
```typescript
import { render, screen } from '@testing-library/react';
import { Counter } from './Counter';

describe('Counter', () => {
  it('should display initial count of 0', () => {
    render(<Counter />);

    expect(screen.getByText('Count: 0')).toBeInTheDocument();
  });
});
```

### GREEN - Implementación Mínima
```typescript
import React, { useState } from 'react';

export function Counter(): JSX.Element {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
    </div>
  );
}
```

### RED - Increment Functionality
```typescript
it('should increment count when button is clicked', async () => {
  render(<Counter />);

  const button = screen.getByText('Increment');
  await userEvent.click(button);

  expect(screen.getByText('Count: 1')).toBeInTheDocument();
});
```

### GREEN - Añadir Botón
```typescript
export function Counter(): JSX.Element {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
```

### RED - Props Personalizadas
```typescript
it('should use custom initial count', () => {
  render(<Counter initialCount={5} />);

  expect(screen.getByText('Count: 5')).toBeInTheDocument();
});

it('should call onCountChange when count changes', async () => {
  const onCountChange = jest.fn();
  render(<Counter initialCount={0} onCountChange={onCountChange} />);

  await userEvent.click(screen.getByText('Increment'));

  expect(onCountChange).toHaveBeenCalledWith(1);
});
```

### GREEN - Añadir Props
```typescript
interface CounterProps {
  initialCount?: number;
  onCountChange?: (count: number) => void;
}

export function Counter({ initialCount = 0, onCountChange }: CounterProps): JSX.Element {
  const [count, setCount] = useState(initialCount);

  const handleIncrement = () => {
    const newCount = count + 1;
    setCount(newCount);
    onCountChange?.(newCount);
  };

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={handleIncrement}>Increment</button>
    </div>
  );
}
```

### REFACTOR - Custom Hook
```typescript
function useCounter(initialCount = 0, onChange?: (count: number) => void) {
  const [count, setCount] = useState(initialCount);

  const increment = () => {
    const newCount = count + 1;
    setCount(newCount);
    onChange?.(newCount);
  };

  const decrement = () => {
    const newCount = count - 1;
    setCount(newCount);
    onChange?.(newCount);
  };

  return { count, increment, decrement };
}

export function Counter({ initialCount = 0, onCountChange }: CounterProps): JSX.Element {
  const { count, increment, decrement } = useCounter(initialCount, onCountChange);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>Increment</button>
      <button onClick={decrement}>Decrement</button>
    </div>
  );
}
```

## Ejemplo 5: Integración con Base de Datos

### RED - Guardar Usuario
```typescript
describe('UserRepository', () => {
  let repository: UserRepository;
  let testDb: TestDatabase;

  beforeAll(async () => {
    testDb = await TestDatabase.create();
    repository = new UserRepository(testDb.connection);
  });

  afterAll(async () => {
    await testDb.close();
  });

  beforeEach(async () => {
    await testDb.clear();
  });

  it('should save user to database', async () => {
    const user = new User('John Doe', 'john@example.com');

    const savedUser = await repository.save(user);

    expect(savedUser.id).toBeDefined();

    // Verificar en base de datos
    const dbUser = await testDb.connection('users').where('id', savedUser.id).first();
    expect(dbUser.name).toBe('John Doe');
    expect(dbUser.email).toBe('john@example.com');
  });
});
```

### GREEN - Implementación
```typescript
class UserRepository {
  constructor(private db: Knex) {}

  async save(user: User): Promise<User> {
    const [id] = await this.db('users').insert({
      name: user.name,
      email: user.email,
      created_at: new Date()
    });

    return new User(user.name, user.email, id);
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.db('users').where('id', id).first();

    if (!row) {
      return null;
    }

    return new User(row.name, row.email, row.id);
  }
}
```

### RED - Validación Única de Email
```typescript
it('should throw error for duplicate email', async () => {
  const user1 = new User('John Doe', 'john@example.com');
  const user2 = new User('Jane Doe', 'john@example.com');

  await repository.save(user1);

  await expect(repository.save(user2)).rejects.toThrow('Email already exists');
});
```

### GREEN - Añadir Validación
```typescript
async save(user: User): Promise<User> {
  const existing = await this.db('users').where('email', user.email).first();

  if (existing) {
    throw new Error('Email already exists');
  }

  const [id] = await this.db('users').insert({
    name: user.name,
    email: user.email,
    created_at: new Date()
  });

  return new User(user.name, user.email, id);
}
```

### REFACTOR - Transacciones
```typescript
class UserRepository {
  constructor(private db: Knex) {}

  async save(user: User): Promise<User> {
    return await this.db.transaction(async (trx) => {
      const existing = await trx('users').where('email', user.email).first();

      if (existing) {
        throw new Error('Email already exists');
      }

      const [id] = await trx('users').insert({
        name: user.name,
        email: user.email,
        created_at: new Date()
      });

      // Log de auditoría
      await trx('audit_logs').insert({
        action: 'user_created',
        user_id: id,
        timestamp: new Date()
      });

      return new User(user.name, user.email, id);
    });
  }
}
```

## Tips para Ejemplos Prácticos

1. **Empezar simple**: El primer test debe ser lo más básico posible
2. **Baby steps**: Añadir complejidad gradualmente
3. **Red-Green-Refactor**: Seguir el ciclo estrictamente
4. **Tests descriptivos**: Los nombres deben explicar el comportamiento
5. **Cobertura de casos edge**: No olvidar casos límite y errores
6. **Refactoring constante**: Buscar oportunidades de mejorar el diseño