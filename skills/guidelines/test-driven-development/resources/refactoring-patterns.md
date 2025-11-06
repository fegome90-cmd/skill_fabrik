# Refactoring Patterns - Técnicas Seguras de Mejora de Código

## Principios de Refactoring Seguro

1. **Tests verdes primero**: Nunca refactorizar con tests fallando
2. **Cambios pequeños**: Un cambio a la vez
3. **Frecuente commits**: Cada cambio seguro debe guardarse
4. **Baby steps**: Divisiones incrementales

## Patrones Comunes

### 1. Extract Method

```typescript
// Antes - método largo
class OrderProcessor {
  processOrder(order: Order): void {
    // Validar orden
    if (!order.customerId) {
      throw new Error('Customer ID required');
    }
    if (!order.items || order.items.length === 0) {
      throw new Error('Items required');
    }

    // Calcular total
    let total = 0;
    for (const item of order.items) {
      total += item.price * item.quantity;
    }

    // Aplicar descuento
    if (order.couponCode) {
      total *= 0.9;
    }

    // Procesar pago
    console.log(`Processing payment: ${total}`);
  }
}

// Después - extraer métodos
class OrderProcessor {
  processOrder(order: Order): void {
    this.validateOrder(order);
    const total = this.calculateTotal(order);
    const finalTotal = this.applyDiscount(order, total);
    this.processPayment(finalTotal);
  }

  private validateOrder(order: Order): void {
    if (!order.customerId) {
      throw new Error('Customer ID required');
    }
    if (!order.items || order.items.length === 0) {
      throw new Error('Items required');
    }
  }

  private calculateTotal(order: Order): number {
    return order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  private applyDiscount(order: Order, total: number): number {
    return order.couponCode ? total * 0.9 : total;
  }

  private processPayment(amount: number): void {
    console.log(`Processing payment: ${amount}`);
  }
}
```

### 2. Extract Class

```typescript
// Antes - clase con múltiples responsabilidades
class User {
  constructor(
    public id: string,
    public name: string,
    public email: string,
    public street: string,
    public city: string,
    public country: string,
    public postalCode: string
  ) {}

  getFullAddress(): string {
    return `${this.street}, ${this.city}, ${this.country} ${this.postalCode}`;
  }

  isValidEmail(): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email);
  }
}

// Después - separar responsabilidades
class User {
  constructor(
    public id: string,
    public name: string,
    public email: string,
    public address: Address
  ) {}

  isValidEmail(): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email);
  }
}

class Address {
  constructor(
    public street: string,
    public city: string,
    public country: string,
    public postalCode: string
  ) {}

  getFullAddress(): string {
    return `${this.street}, ${this.city}, ${this.country} ${this.postalCode}`;
  }
}
```

### 3. Replace Conditional with Polymorphism

```typescript
// Antes - condicionales complejos
class NotificationSender {
  sendNotification(type: string, message: string, recipient: string): void {
    if (type === 'email') {
      console.log(`Sending email to ${recipient}: ${message}`);
    } else if (type === 'sms') {
      console.log(`Sending SMS to ${recipient}: ${message}`);
    } else if (type === 'push') {
      console.log(`Sending push notification to ${recipient}: ${message}`);
    } else {
      throw new Error(`Unknown notification type: ${type}`);
    }
  }
}

// Después - polimorfismo
interface NotificationChannel {
  send(message: string, recipient: string): void;
}

class EmailChannel implements NotificationChannel {
  send(message: string, recipient: string): void {
    console.log(`Sending email to ${recipient}: ${message}`);
  }
}

class SMSChannel implements NotificationChannel {
  send(message: string, recipient: string): void {
    console.log(`Sending SMS to ${recipient}: ${message}`);
  }
}

class PushChannel implements NotificationChannel {
  send(message: string, recipient: string): void {
    console.log(`Sending push notification to ${recipient}: ${message}`);
  }
}

class NotificationSender {
  private channels: Map<string, NotificationChannel> = new Map([
    ['email', new EmailChannel()],
    ['sms', new SMSChannel()],
    ['push', new PushChannel()]
  ]);

  sendNotification(type: string, message: string, recipient: string): void {
    const channel = this.channels.get(type);
    if (!channel) {
      throw new Error(`Unknown notification type: ${type}`);
    }
    channel.send(message, recipient);
  }
}
```

### 4. Introduce Parameter Object

```typescript
// Antes - muchos parámetros
class ReportGenerator {
  generateReport(
    startDate: Date,
    endDate: Date,
    department: string,
    includeInactive: boolean,
    format: 'pdf' | 'excel',
    emailTo: string
  ): void {
    // Lógica compleja...
  }
}

// Después - objeto de parámetros
class ReportParameters {
  constructor(
    public readonly dateRange: { start: Date; end: Date },
    public readonly department: string,
    public readonly options: {
      includeInactive: boolean;
      format: 'pdf' | 'excel';
      emailTo: string;
    }
  ) {}
}

class ReportGenerator {
  generateReport(params: ReportParameters): void {
    // Lógica más limpia...
  }
}
```

## Secuencia de Refactoring Típica

### 1. Identificar Code Smells
- **Métodos largos**: > 20 líneas
- **Clases grandes**: > 200 líneas
- **Parámetros muchos**: > 3-4 parámetros
- **Duplicación**: Código similar en múltiples lugares
- **Complejidad ciclamática**: > 10

### 2. Preparar Tests
```typescript
// Asegurar cobertura completa
describe('LegacyCode', () => {
  it('should maintain existing behavior', () => {
    const input = { /* datos complejos */ };
    const expected = { /* resultado esperado */ };

    const result = legacyFunction(input);

    expect(result).toEqual(expected);
  });
});
```

### 3. Refactor Step-by-Step
```typescript
// Step 1: Extract method más pequeño
private calculateSubtotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

// Step 2: Test y commit
// Step 3: Extraer siguiente método
// Step 4: Test y commit
// Continuar hasta que el código esté limpio
```

## Herramientas de Refactoring

### IDE Support
- **VS Code**: Refactoring automático con F2 (rename), Ctrl+. (quick fix)
- **WebStorm**: Refactor menu con extract method, inline variable, etc.
- **IntelliJ**: Refactoring avanzado con change signature, extract superclass

### Automated Tools
```bash
# TypeScript compiler para errores
npx tsc --noEmit

# ESLint para code smells
npx eslint src/ --fix

# Prettier para formatting
npx prettier --write src/

# Type coverage
npx type-coverage
```

## Refactoring Katas (Práctica)

### 1. String Calculator
- Empezar con método simple que procesa string vacío
- Añadir soporte para un número
- Añadir soporte para múltiples números separados por comas
- Añadir soporte para delimitadores personalizados
- Añadir manejo de números negativos

### 2. Game of Life
- Implementar reglas básicas
- Refactorizar para usar patrón Strategy
- Añadir optimizaciones de rendimiento
- Extraer componentes UI separados

### 3. Shopping Cart
- Comenzar con funcionalidad básica
- Extraer cálculos a clases separadas
- Implementar patrones de descuento
- Añadir persistencia y validación

## Métricas de Refactoring Exitoso

- **Todos los tests pasan** antes y después
- **Code coverage mantiene o mejora**
- **Complejidad reducida** (métricas ciclomaticas)
- **Lines of code reducidas** sin perder funcionalidad
- **Número de métodos/clases** apropiado para el dominio
- **Reviews positivas** del equipo

## Anti-patterns a Evitar

- **Refactoring sin tests**: Cambios peligrosos sin seguridad
- **Grandes refactorings**: Demasiados cambios a la vez
- **Over-engineering**: Simplificar demasiado, añadir complejidad innecesaria
- **Premature optimization**: Optimizar antes de medir rendimiento real