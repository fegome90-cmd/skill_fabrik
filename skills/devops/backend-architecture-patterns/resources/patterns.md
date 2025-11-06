# Backend Architecture Patterns - Patrones Detallados

## Overview de Patterns

Este documento detalla los principales patrones arquitectónicos para backend, cuándo usarlos, y cómo se comparan entre sí.

---

## 1. Domain-Driven Design (DDD)

### Conceptos Fundamentales

#### Ubiquitous Language
- **Definición**: Lenguaje común entre developers y domain experts
- **Objetivo**: Eliminar ambigüedades en el código
- **Implementación**: Clases, métodos, variables con nombres del dominio

```typescript
// ❌ Sin ubiquitous language
class OrderController {
  async createOrder(data) {
    const o = new Order(data.cid, data.items);
    await this.repo.save(o);
  }
}

// ✅ Con ubiquitous language
class OrderController {
  async createOrder(request: CreateOrderRequest) {
    const customer = await this.customerRepository.findById(request.customerId);
    const order = Order.create(customer.id, request.items);

    await this.orderRepository.save(order);
  }
}
```

#### Aggregate Pattern

**Definición**: Cluster de objetos de dominio que se tratan como unidad.

**Reglas**:
1. Aggregate root tiene autoridad sobre el aggregate
2. Referencias externas solo via aggregate root
3. Invariantes de negocio enforced por aggregate root
4. Transacciones son boundary del aggregate

```typescript
// Aggregate Root
export class OrderAggregate {
  constructor(
    private readonly id: OrderId,
    private customerId: CustomerId,
    private items: OrderItem[],
    private status: OrderStatus,
    private total: Money
  ) {}

  // Único punto de modificación
  addItem(item: OrderItem): Result<void> {
    if (this.status !== OrderStatus.PENDING) {
      return Result.fail('Cannot modify confirmed order');
    }

    // Validación de invariantes
    if (this.items.length >= 10) {
      return Result.fail('Maximum 10 items allowed');
    }

    this.items.push(item);
    this.recalculateTotal();
    this.addDomainEvent(new OrderItemAddedEvent(this.id, item));
  }
}

// ❌ Violación: Acceso directo a items
export class OrderController {
  async addItem(orderId: string, item: OrderItem) {
    const order = await this.repository.findById(orderId);
    // ❌ Acceso directo a propiedad interna
    order.items.push(item); // Violates aggregate pattern!
  }
}
```

#### Entities vs Value Objects

**Entity**: Tiene identidad única

```typescript
export class OrderId {
  constructor(private value: string) {}

  equals(other: OrderId): boolean {
    return this.value === other.value;
  }
}

export class OrderEntity {
  constructor(
    private id: OrderId,  // Identidad única
    private customerId: CustomerId,
    private status: OrderStatus
  ) {}

  // Comportamiento asociado a la entidad
  confirm(): void {
    this.status = OrderStatus.CONFIRMED;
  }
}
```

**Value Object**: Sin identidad, inmutable

```typescript
export class Money {
  constructor(
    private value: number,
    private currency: Currency
  ) {}

  // Inmutable - returns new instance
  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('Currency mismatch');
    }
    return new Money(this.value + other.value, this.currency);
  }

  // Value objects are equal by value
  equals(other: Money): boolean {
    return this.value === other.value &&
           this.currency === other.currency;
  }
}

// ✅ Value object siempre inmutable
export class Address {
  constructor(
    private street: string,
    private city: string,
    private zipCode: string,
    private country: string
  ) {
    // Freeze object (Shallow freeze)
    Object.freeze(this);
  }
}
```

### Bounded Contexts

**Definición**: Límite donde el modelo es consistente.

```typescript
// Context 1: Sales
export interface SalesOrder {
  id: OrderId;
  items: LineItem[];
  total: Money;
}

// Context 2: Shipping
export interface ShippingOrder {
  orderNumber: string;
  deliveryAddress: Address;
  items: ShippableItem[];
}

// ❌ Confuso: Un modelo para múltiples contexts
export interface ConfusingOrder {
  id: string;
  items: any[]; // Mixed concerns
}

// ✅ Claro: Contexts separados
export interface SalesOrder {
  items: LineItem[]; // LineItem with pricing
}

export interface ShippingOrder {
  items: ShippableItem[]; // Item with dimensions
}
```

---

## 2. CQRS (Command Query Responsibility Segregation)

### Arquitectura CQRS

```typescript
// COMMAND (Write)
export interface CreateOrderCommand {
  customerId: string;
  items: OrderItemDTO[];
  shippingAddress: AddressDTO;
}

export class CreateOrderCommandHandler {
  constructor(
    private readonly orderRepository: OrderWriteRepository,
    private readonly eventBus: EventBus
  ) {}

  async handle(command: CreateOrderCommand): Promise<Result<void>> {
    // 1. Validate
    // 2. Create aggregate
    // 3. Save
    // 4. Publish events
  }
}

// QUERY (Read)
export interface GetOrderQuery {
  orderId: string;
}

export interface OrderViewDTO {
  orderId: string;
  customerName: string;
  items: OrderItemView[];
  total: number;
  status: string;
  estimatedDelivery?: Date;
}

export class GetOrderQueryHandler {
  constructor(
    private readonly orderViewRepository: OrderViewRepository
  ) {}

  async handle(query: GetOrderQuery): Promise<OrderViewDTO> {
    // Read optimized view
    return this.orderViewRepository.findById(query.orderId);
  }
}
```

### Event Store

```typescript
// Event Store Interface
export interface EventStore {
  saveEvents(aggregateId: string, events: DomainEvent[], expectedVersion: number): void;
  getEvents(aggregateId: string, fromVersion?: number): DomainEvent[];
}

// PostgreSQL Implementation
export class PostgresEventStore implements EventStore {
  constructor(private readonly prisma: PrismaClient) {}

  async saveEvents(
    aggregateId: string,
    events: DomainEvent[],
    expectedVersion: number
  ): Promise<void> {
    const existingVersion = await this.getLatestVersion(aggregateId);

    if (existingVersion !== expectedVersion) {
      throw new ConcurrencyError(`Expected version ${expectedVersion}, got ${existingVersion}`);
    }

    // Save events atomically
    await this.prisma.$transaction(async (tx) => {
      for (const [index, event] of events.entries()) {
        await tx.event.create({
          data: {
            id: event.id,
            aggregateId,
            type: event.type,
            data: JSON.stringify(event.data),
            version: expectedVersion + index + 1,
            timestamp: event.timestamp
          }
        });
      }
    });
  }
}
```

### Projections

```typescript
export interface Projection<T> {
  project(event: DomainEvent, state: T): T;
}

export class OrderViewProjection implements Projection<OrderView> {
  project(event: DomainEvent, state: OrderView): OrderView {
    switch (event.type) {
      case 'OrderCreated':
        return {
          ...state,
          orderId: event.data.orderId,
          customerName: event.data.customerName,
          total: 0,
          items: []
        };

      case 'OrderItemAdded':
        return {
          ...state,
          items: [...state.items, event.data],
          total: state.total + event.data.price
        };

      case 'OrderConfirmed':
        return {
          ...state,
          status: 'CONFIRMED'
        };

      default:
        return state;
    }
  }
}

// Rebuild from events
export class ProjectionRebuilder {
  async rebuild(aggregateId: string, projection: Projection<any>) {
    const events = await this.eventStore.getEvents(aggregateId);
    let state = projection.getInitialState();

    for (const event of events) {
      state = projection.project(event, state);
    }

    await this.viewRepository.save(state);
  }
}
```

---

## 3. Event Sourcing

### Event Store Implementation

```typescript
// Domain Event
export abstract class DomainEvent {
  constructor(
    public readonly id: string,
    public readonly aggregateId: string,
    public readonly timestamp: Date,
    public readonly data: any
  ) {}
}

export class OrderCreatedEvent extends DomainEvent {
  constructor(
    id: string,
    aggregateId: string,
    public readonly customerId: string,
    public readonly total: number
  ) {
    super(id, aggregateId, new Date(), { customerId, total });
  }
}

// Reconstruct from events
export class OrderAggregate {
  static reconstruct(events: DomainEvent[]): OrderAggregate {
    const order = new OrderAggregate();
    // Apply all events to rebuild state
    events.forEach(event => order.applyEvent(event));
    return order;
  }

  private applyEvent(event: DomainEvent): void {
    switch (event.type) {
      case 'OrderCreated':
        this.customerId = event.data.customerId;
        this.total = event.data.total;
        this.status = OrderStatus.PENDING;
        break;
      // ... other events
    }
  }
}
```

### Snapshot Pattern

```typescript
export interface Snapshot {
  aggregateId: string;
  version: number;
  state: any;
  timestamp: Date;
}

export class SnapshotRepository {
  async save(snapshot: Snapshot): Promise<void> {
    await this.prisma.snapshot.create({
      data: {
        aggregateId: snapshot.aggregateId,
        version: snapshot.version,
        state: JSON.stringify(snapshot.state),
        timestamp: snapshot.timestamp
      }
    });
  }

  async load(aggregateId: string): Promise<Snapshot | null> {
    const snapshot = await this.prisma.snapshot.findFirst({
      where: { aggregateId },
      orderBy: { version: 'desc' }
    });

    return snapshot ? {
      aggregateId: snapshot.aggregateId,
      version: snapshot.version,
      state: JSON.parse(snapshot.state),
      timestamp: snapshot.timestamp
    } : null;
  }
}
```

---

## 4. Hexagonal Architecture

### Ports & Adapters

```typescript
// PORT (Interface - What)
export interface OrderRepository {
  save(order: Order): Promise<void>;
  findById(id: OrderId): Promise<Order | null>;
}

// ADAPTER (Implementation - How)
export class PrismaOrderRepository implements OrderRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(order: Order): Promise<void> {
    await this.prisma.order.create({
      data: {
        id: order.id.value,
        customerId: order.customerId.value,
        total: order.total.value,
        status: order.status
      }
    });
  }
}

// Inversion of Control
export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository, // Depends on interface
    private readonly paymentGateway: PaymentGateway
  ) {}

  async createOrder(request: CreateOrderRequest): Promise<Result<void>> {
    // Use ports, not concrete implementations
  }
}
```

### Core vs Adapters

```typescript
// CORE (Framework independent)
export namespace Core {
  export interface OrderRepository {
    save(order: Order): Promise<void>;
  }

  export interface PaymentGateway {
    charge(amount: number, paymentMethod: PaymentMethod): Promise<Result<void>>;
  }

  export class OrderService {
    constructor(
      private repo: OrderRepository,
      private gateway: PaymentGateway
    ) {}

    async processOrder(order: Order): Promise<Result<void>> {
      // Pure business logic
    }
  }
}

// ADAPTERS (Framework specific)
export namespace Adapters {
  export class ApiController {
    private readonly orderService: Core.OrderService;

    // Dependencies injected
    constructor(orderService: Core.OrderService) {
      this.orderService = orderService;
    }

    async createOrder(req: Request, res: Response) {
      // Web framework specific
    }
  }
}
```

---

## 5. Clean Architecture

### Layer Dependencies

```typescript
// ENTITIES (Inner circle - no dependencies)
export class User {
  constructor(
    private id: UserId,
    private email: Email,
    private name: Name
  ) {}

  changeEmail(newEmail: Email): void {
    if (!newEmail.isValid()) {
      throw new Error('Invalid email');
    }
    this.email = newEmail;
  }
}

// USE CASES (Depends on entities)
export class UserService {
  constructor(
    private userRepository: UserRepository
  ) {}

  async registerUser(request: RegisterUserRequest): Promise<Result<void>> {
    // Business rules
    const user = new User(
      UserId.create(),
      request.email,
      request.name
    );

    await this.userRepository.save(user);
    return Result.ok();
  }
}

// INTERFACE ADAPTERS (Depends on use cases)
export class UserController {
  constructor(private userService: UserService) {}

  async register(req: Request, res: Response) {
    const result = await this.userService.registerUser(req.body);
    res.json(result);
  }
}
```

---

## Pattern Comparison Matrix

| Aspect | DDD | CQRS | Event Sourcing | Hexagonal | Clean |
|--------|-----|------|----------------|-----------|-------|
| **Complexity** | High | High | Very High | Medium | Low |
| **Learning Curve** | Steep | Steep | Very Steep | Moderate | Gentle |
| **Best For** | Complex domains | Read-heavy | Audit trail | Tech flexibility | Simplicity |
| **Team Size** | Medium-Large | Medium-Large | Large | Any | Small-Medium |
| **Onboarding Time** | Long | Long | Very Long | Medium | Short |
| **Performance** | Medium | High | Medium | High | High |
| **Testability** | Excellent | Good | Good | Excellent | Excellent |
| **Flexibility** | High | High | Very High | Very High | Medium |
| **Maintenance** | Medium | Medium | Medium-High | Low | Low |
| **Scalability** | High | Very High | High | High | High |

## Decision Tree

```
START
  |
  ├─ ¿Dominio complejo?
  │  └─ NO → ¿Necesitas tech flexibility?
  │     ├─ NO → Clean Architecture
  │     └─ YES → Hexagonal Architecture
  │
  └─ YES → ¿Lecturas muy frecuentes?
     ├─ NO → ¿Necesitas audit trail?
     │  ├─ NO → DDD
     │  └─ YES → DDD + Event Sourcing
     │
     └─ YES → ¿Alta escalabilidad?
        ├─ NO → DDD + CQRS
        └─ YES → CQRS + Event Sourcing
```

## Anti-Patterns

### ❌ Big Ball of Mud
```
// Everything in one layer
class OrderController {
  async createOrder(req: Request) {
    // Controller logic
    const validator = new OrderValidator(); // Application logic
    await validator.validate(req.body);     // Domain logic
    await this.db.save(req.body);           // Infrastructure logic
    await this.email.send();                // External call
  }
}
```

### ❌ Anemic Domain Model
```typescript
export class Order {
  id: string;
  items: any[];
  total: number;
  // ❌ Only getters/setters, no behavior
}
```

### ❌ Anemic Architecture
```typescript
// Infrastructure drives everything
export class OrderService {
  constructor(private orm: PrismaORM) {}

  async createOrder(data: any) {
    // ORM defines the model
    // Domain logic scattered
    // Business rules in SQL
  }
}
```

---

**Estado**: Patrones detallados completados
**DDD**: Aggregate, Entities, Value Objects, Bounded Contexts
**CQRS**: Commands, Queries, Event Store, Projections
**Event Sourcing**: Event Store, Snapshots, Rebuilding
**Hexagonal**: Ports, Adapters, IoC
**Clean**: Layered Architecture, Dependency Rule
