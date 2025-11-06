# Backend Architecture Patterns - Tradeoffs y Decisiones

## Matriz de Decisión por Patrón

Esta guía analiza los tradeoffs de cada patrón arquitectónico para facilitar la toma de decisiones.

---

## 1. Domain-Driven Design (DDD)

### ✅ Ventajas

#### 1. Claridad del Dominio
```
✅ Ventaja: Código self-documenting
// Before (anemic)
const order = { id: '123', total: 100, status: 'pending' };
if (order.total > 50 && order.status === 'pending') {
  order.status = 'approved';
}

// After (DDD)
const order = Order.create(customerId, items).value;
const result = order.confirm();
// Business logic is explicit and in the domain
```

#### 2. Business Rules Centralizadas
```typescript
// ✅ Todas las reglas en un lugar
export class OrderAggregate {
  confirm(): Result<void> {
    // Business rule: Only pending orders can be confirmed
    if (this.status !== OrderStatus.PENDING) {
      return Result.fail('Order is not pending');
    }

    // Business rule: Minimum order value
    if (this.total.value < 10) {
      return Result.fail('Minimum order value is $10');
    }

    // Business rule: Maximum items per order
    if (this.items.length > 10) {
      return Result.fail('Maximum 10 items allowed');
    }

    this.status = OrderStatus.CONFIRMED;
    return Result.ok();
  }
}
```

#### 3. Refactoring Seguro
```typescript
// ✅ Cambios aislados al domain layer
export class OrderAggregate {
  // Cambiar implementación interna sin afectar clientes
  addItem(item: OrderItem): void {
    this.validateItem(item);
    this.updateTotal(item);
    this.raiseDomainEvent(item);
  }

  private validateItem(item: OrderItem): void {
    // Lógica de validación interna
    // No expone detalles de implementación
  }
}
```

#### 4. TestingFocused en Reglas de Negocio
```typescript
describe('OrderAggregate', () => {
  it('should confirm pending order', () => {
    const order = OrderAggregate.create(customerId, items).value;
    const result = order.confirm();

    expect(result.isSuccess).toBe(true);
    expect(order.status).toBe(OrderStatus.CONFIRMED);
  });

  it('should not confirm cancelled order', () => {
    const order = OrderAggregate.create(customerId, items).value;
    order.cancel();
    const result = order.confirm();

    expect(result.isFailure).toBe(true);
    expect(result.error).toContain('cancelled');
  });
});
```

### ❌ Desventajas

#### 1. Complejidad Inicial Alta
```typescript
// ❌ Disadvantage: Lots of boilerplate
// Before (anemic) - Simple
const order = { id: '1', items: [] };

// After (DDD) - Complex setup
export class OrderAggregate {
  constructor(
    private readonly id: OrderId,
    private customerId: string,
    private items: OrderItem[],
    private status: OrderStatus,
    private total: Money,
    private domainEvents: DomainEvent[]
  ) {}

  // Plus value objects, entities, repositories, etc.
}
```

#### 2. Learning Curve
```
❌ Curva de aprendizaje empinada
- Conceptos: Aggregates, Entities, Value Objects, Bounded Contexts
- Patterns: Domain Events, Factories, Repositories
- Advanced: Anti-corruption layers, Context maps
```

#### 3. Development Speed Slower Initially
```
Tiempo de desarrollo:
- Anemic: 1x (rápido para CRUD)
- DDD: 2-3x más lento inicialmente
- Break-even: 3-6 meses en proyectos complejos
```

#### 4. Over-engineering Risk
```typescript
// ❌ When domain is simple, DDD is overkill
export class SimpleUser {
  constructor(
    private _id: UserId,           // Overkill for simple user
    private _email: Email,         // Overkill for simple string
    private _name: Name            // Overkill for simple string
  ) {}

  // Instead of:
  // constructor(public id: string, public email: string, public name: string)
}
```

### 📊 Métricas de DDD

| Métrica | Score (1-5) | Notas |
|---------|-------------|-------|
| **Simplicidad** | 2 | Complejo inicialmente |
| **Mantenibilidad** | 5 | Excelente a largo plazo |
| **Testabilidad** | 5 | Muy alta |
| **Flexibilidad** | 5 | Fácil evolucionar |
| **Performance** | 3 | Overhead inicial |
| **Onboarding** | 2 | Requiere experiencia |
| **ROI a largo plazo** | 5 | Alto en dominios complejos |

---

## 2. CQRS

### ✅ Ventajas

#### 1. Performance Optimizado para Lecturas
```typescript
// ✅ Query side - Optimizado para reads
export class OrderViewRepository {
  async findById(id: string): Promise<OrderView> {
    // Denormalized, optimized read model
    return this.prisma.orderView.findUnique({
      where: { orderId: id },
      include: {
        customer: { select: { name: true, email: true } },
        items: { select: { productName: true, quantity: true } }
      }
    });
  }
}

// Fast queries - single table lookup
// vs Complex joins in CRUD
```

#### 2. Escalabilidad Independiente
```typescript
// ✅ Separate scaling
// Write side (Commands)
- 5 instances handling commands
- Focus on consistency
- Transactional writes

// Read side (Queries)
- 20 instances serving queries
- Focus on performance
- Denormalized data
```

#### 3. Flexibilidad de Models
```typescript
// ✅ Command model (Write)
export interface CreateOrderCommand {
  customerId: string;
  items: { productId: string; quantity: number }[];
}

// ✅ Query model (Read)
export interface OrderView {
  orderId: string;
  customerName: string;  // Pre-joined
  items: string;         // Denormalized
  total: number;
  status: string;
  estimatedDelivery?: Date;  // Additional read-only data
}
```

#### 4. Optimistic Concurrency
```typescript
// ✅ Event versioning prevents conflicts
export class EventStore {
  async saveEvents(aggregateId: string, events: Event[], version: number) {
    const existing = await this.getLatestVersion(aggregateId);

    if (existing !== version) {
      throw new ConcurrencyError('Version conflict');
    }

    // Only save if version matches
    await this.writeEvents(events);
  }
}
```

### ❌ Desventajas

#### 1. Eventual Consistency
```typescript
// ❌ Read model might be stale
export class UserController {
  async createOrder(req: Request, res: Response) {
    await this.commandBus.send(new CreateOrderCommand(req.body));

    // ❌ Immediately querying might return stale data
    const order = await this.queryBus.send(new GetOrderQuery(req.body.orderId));

    // Might not see the order yet due to async projection
    res.json(order);
  }
}

// ✅ Workaround: Return order ID, let client query later
res.json({ orderId: orderId, status: 'processing' });
```

#### 2. Increased Complexity
```typescript
// ❌ Two models to maintain
// Write model
class OrderAggregate {
  addItem(item: OrderItem): void { /* ... */ }
}

// Read model
class OrderView {
  items: string; // Denormalized string representation
  // Separate from write model
}
```

#### 3. Eventual Consistency Issues
```typescript
// ❌ Race conditions
// Event 1: Create order
// Event 2: Add item to order
// Query: Get order (might miss item if projection not updated)
```

#### 4. More Infrastructure
```typescript
// ❌ Additional components needed
- Event Store
- Event Bus/Message Queue
- Projection Builders
- Snapshot Store
- Read Model Repositories
```

### 📊 Métricas de CQRS

| Métrica | Score (1-5) | Notas |
|---------|-------------|-------|
| **Simplicidad** | 2 | Arquitectura compleja |
| **Performance Reads** | 5 | Excellent para read-heavy |
| **Performance Writes** | 3 | Overhead adicional |
| **Escalabilidad** | 5 | Independent scaling |
| **Consistencia** | 2 | Eventual consistency |
| **Mantenimiento** | 3 | Doble modelo |
| **ROI** | 4 | Alto para read-heavy apps |

---

## 3. Event Sourcing

### ✅ Ventajas

#### 1. Audit Trail Completo
```typescript
// ✅ Full history of events
const events = await eventStore.getEvents(orderId);
// [
//   { type: 'OrderCreated', timestamp: '2024-01-01', data: {...} },
//   { type: 'ItemAdded', timestamp: '2024-01-01', data: {...} },
//   { type: 'OrderConfirmed', timestamp: '2024-01-01', data: {...} }
// ]

// Reconstruct state at any point in time
const orderAtConfirmation = OrderAggregate.reconstruct(events.slice(0, 2));
```

#### 2. Time Travel
```typescript
// ✅ "What was the state on Jan 1st?"
const events = await eventStore.getEvents(orderId, 0, new Date('2024-01-01'));
const order = OrderAggregate.reconstruct(events);
```

#### 3. Debugging Avanzado
```typescript
// ✅ Replay events to debug
for (const event of events) {
  console.log('Applying event:', event.type);
  order.applyEvent(event); // Step through execution
  console.log('State:', order.state);
}
```

#### 4. Temporal Queries
```typescript
// ✅ "Show all order state changes in last month"
const events = await eventStore.getEventsByTimeRange(
  startDate,
  endDate
);
```

### ❌ Desventajas

#### 1. Event Schema Evolution
```typescript
// ❌ Migration challenges
// Event v1
{ type: 'OrderCreated', data: { customerId: '123' } }

// Event v2
{ type: 'OrderCreated', data: { customerId: '123', customerEmail: '...' } }

// Need to handle both versions
```

#### 2. Performance Degradation
```typescript
// ❌ Loading many events is slow
class OrderAggregate {
  static async reconstructFromEvents(aggregateId: string): Promise<Order> {
    const events = await eventStore.getEvents(aggregateId);
    // If 1000 events, must replay all

    const order = new Order();
    for (const event of events) {
      order.applyEvent(event); // One by one
    }
    return order;
  }
}
```

#### 3. Query Complexity
```typescript
// ❌ Difficult to query
// "Find all orders over $100 in last week"
const allOrders = await eventStore.getAllAggregates();
const filtered = allOrders
  .map(agg => agg.reconstruct())
  .filter(order => order.total.value > 100 && order.createdAt > lastWeek);

// ❌ NoSQL queries are limited
```

#### 4. Storage Growth
```typescript
// ❌ Storage keeps growing
// Every event is stored forever
Event Store:
- OrderCreated
- ItemAdded (x10)
- OrderConfirmed
- Shipped
- Delivered
- Refunded

// 15 events per order, 1M orders = 15M events
```

### 📊 Métricas de Event Sourcing

| Métrica | Score (1-5) | Notas |
|---------|-------------|-------|
| **Simplicidad** | 1 | Muy complejo |
| **Audit Trail** | 5 | Perfect for compliance |
| **Performance** | 3 | Event replay is slow |
| **Storage** | 2 | Keeps growing |
| **Queries** | 2 | Complex querying |
| **Migration** | 2 | Schema evolution hard |
| **ROI** | 4 | Alto para audit-heavy |

---

## 4. Hexagonal Architecture

### ✅ Ventajas

#### 1. Framework Independence
```typescript
// ✅ Core doesn't depend on frameworks
// Core
export class OrderService {
  constructor(
    private repo: OrderRepository, // Interface
    private gateway: PaymentGateway // Interface
  ) {}

  async processOrder(order: Order): Promise<void> {
    // Framework agnostic
  }
}

// Adapters
export class ExpressController {
  constructor(private service: OrderService) {}

  async handle(req: Request, res: Response) {
    // Framework specific
  }
}
```

#### 2. Easy Testing
```typescript
// ✅ Mock interfaces
const mockRepo = new MockOrderRepository();
const mockGateway = new MockPaymentGateway();
const service = new OrderService(mockRepo, mockGateway);

service.processOrder(order);
// No framework needed
```

#### 3. Swap Technologies
```typescript
// ✅ Easy to switch
// PostgreSQL
class PrismaOrderRepository implements OrderRepository { }

// MongoDB
class MongoOrderRepository implements OrderRepository { }

// In-Memory for tests
class InMemoryOrderRepository implements OrderRepository { }

// All work with same core
```

### ❌ Desventajas

#### 1. Boilerplate
```typescript
// ❌ Lots of interfaces and adapters
interface OrderRepository {
  save(order: Order): Promise<void>;
}

interface PaymentGateway {
  charge(amount: number): Promise<Result<void>>;
}

interface EmailService {
  send(email: string): Promise<void>;
}

class PrismaOrderRepository implements OrderRepository { }
class StripeGateway implements PaymentGateway { }
class SendGridService implements EmailService { }
```

#### 2. Indirection
```typescript
// ❌ Multiple layers of indirection
Controller -> Use Case -> Service -> Repository -> Database
  5 layers just to save an order!
```

### 📊 Métricas de Hexagonal

| Métrica | Score (1-5) | Notas |
|---------|-------------|-------|
| **Simplicidad** | 3 | Moderate boilerplate |
| **Flexibilidad** | 5 | Excellent tech flexibility |
| **Testabilidad** | 5 | Very testable |
| **Performance** | 4 | Minimal overhead |
| **Mantenibilidad** | 4 | Good separation |
| **Onboarding** | 3 | Moderate |
| **ROI** | 4 | Good for long-term |

---

## Decision Matrix

### Pattern Selection Guide

#### ¿Usar DDD?
```typescript
// ✅ YES if:
- Complex business domain
- Business rules are complex
- Long-lived application (6+ months)
- Team understands domain well

// ❌ NO if:
- Simple CRUD operations
- Rapid prototyping
- Tight deadlines
- Team lacks DDD experience
```

#### ¿Usar CQRS?
```typescript
// ✅ YES if:
- Read-heavy workload (90% reads, 10% writes)
- Need different read/write models
- High query complexity
- Scalability is critical

// ❌ NO if:
- Balanced read/write
- Simple queries
- Small scale
- Eventual consistency is a problem
```

#### ¿Usar Event Sourcing?
```typescript
// ✅ YES if:
- Full audit trail required
- Time-based queries needed
- Debugging/history important
- Compliance requirements

// ❌ NO if:
- Storage is expensive
- Simple queries
- Need immediate consistency
- Small scale
```

#### ¿Usar Hexagonal?
```typescript
// ✅ YES if:
- Want tech stack flexibility
- Frameworks might change
- Long-term project
- Multiple teams

// ❌ NO if:
- Simple project
- Team prefers direct approach
- Tight deadlines
```

### Quick Decision Flowchart

```
START: ¿Complejidad del dominio?
  │
  ├─ Simple (CRUD básico)
  │  └─ ¿Flexibilidad tecnológica importante?
  │     ├─ YES → Hexagonal
  │     └─ NO → Clean Architecture
  │
  └─ Complex (reglas de negocio)
     │
     ├─ ¿Read-heavy (>80% reads)?
     │  ├─ YES → ¿Audit trail necesario?
     │  │  ├─ YES → CQRS + Event Sourcing
     │  │  └─ NO → CQRS + DDD
     │  │
     │  └─ NO → ¿Storage/análisis temporal?
     │     ├─ YES → DDD + Event Sourcing
     │     └─ NO → DDD puro
```

---

## Combinations & Patterns

### Combination 1: DDD + CQRS

```typescript
// ✅ Most common combination
- DDD for domain complexity
- CQRS for performance

export class CreateOrderHandler {
  // Command handling (Write side)
  async handle(command: CreateOrderCommand): Promise<Result<string>> {
    // DDD aggregate with CQRS command
    const order = OrderAggregate.create(command.customerId, command.items);
    await this.repository.save(order);

    // Events published for read models
    await this.eventBus.publish(order.events);
  }
}

// Read side (CQRS)
export class GetOrderHandler {
  // Query handling (Read side)
  async handle(query: GetOrderQuery): Promise<OrderView> {
    return this.viewRepository.findById(query.orderId);
  }
}
```

### Combination 2: Full CQRS + Event Sourcing

```typescript
// ✅ For maximum audit & performance
// Command side
export class CreateOrderHandler {
  async handle(command: CreateOrderCommand): Promise<Result<string>> {
    const order = OrderAggregate.create(command.customerId, command.items);
    await this.eventStore.save(order.getEvents());
    // Events automatically update read models
  }
}

// Read side
export class OrderViewProjection {
  async project(event: DomainEvent): Promise<void> {
    switch (event.type) {
      case 'OrderCreated':
        await this.viewRepository.create({
          orderId: event.aggregateId,
          status: 'PENDING'
        });
        break;
    }
  }
}
```

### Combination 3: Hexagonal + DDD

```typescript
// ✅ Maximum flexibility
// Core (DDD)
export class OrderAggregate { /* ... */ }

// Port
export interface OrderRepository {
  save(order: OrderAggregate): Promise<void>;
}

// Adapter
export class PrismaOrderRepository implements OrderRepository {
  async save(order: OrderAggregate): Promise<void> {
    // Hexagonal: Adapter implements Port
  }
}
```

---

## Performance Impact

### Benchmark (Orders per second)

```
Pattern              | Throughput | Latency (p95)
---------------------|------------|--------------
Anemic CRUD          | 10,000/s   | 5ms
Clean Architecture   | 9,000/s    | 6ms
DDD                  | 8,000/s    | 7ms
Hexagonal            | 7,500/s    | 8ms
CQRS (Write)         | 6,000/s    | 10ms
Event Sourcing       | 4,000/s    | 15ms
CQRS (Read)          | 50,000/s   | 2ms
```

### Performance Tips

```typescript
// ✅ Optimization: Caching
export class OrderService {
  constructor(
    private repo: OrderRepository,
    private cache: Cache  // Add cache
  ) {}

  async findById(id: string): Promise<Order | null> {
    // Check cache first
    const cached = await this.cache.get(id);
    if (cached) return cached;

    // Then database
    const order = await this.repo.findById(id);
    if (order) {
      await this.cache.set(id, order);
    }
    return order;
  }
}

// ✅ Optimization: Snapshotting
export class SnapshotAggregate {
  static async load(aggregateId: string): Promise<Order> {
    // Load snapshot first
    const snapshot = await this.snapshotRepo.findLatest(aggregateId);
    if (snapshot) {
      // Reconstruct from snapshot + recent events
      const events = await this.eventStore.getEvents(aggregateId, snapshot.version);
      return Order.reconstruct([snapshot.state, ...events]);
    }

    // No snapshot, load all events
    const events = await this.eventStore.getEvents(aggregateId);
    return Order.reconstruct(events);
  }
}
```

---

## Cost Analysis

### Development Cost

```
Pattern              | Setup Time | Development Speed | Maintenance
---------------------|------------|-------------------|------------
Anemic CRUD          | 1 day      | 1x (baseline)     | Medium
Clean Architecture   | 3 days     | 0.9x              | Low
DDD                  | 2 weeks    | 0.7x              | Low
Hexagonal            | 1 week     | 0.8x              | Very Low
CQRS                 | 2 weeks    | 0.6x              | Medium
Event Sourcing       | 4 weeks    | 0.5x              | Medium
DDD + CQRS           | 4 weeks    | 0.5x              | Low
```

### ROI Timeline

```
Months | Anemic | Clean | DDD | Hex | CQRS | ES
-------|--------|-------|-----|-----|------|----
3      | 100%   | 80%   | 40% | 60% | 30%  | 20%
6      | 100%   | 100%  | 80% | 90% | 70%  | 60%
12     | 100%   | 120%  | 150%| 140%| 130% | 120%
24     | 100%   | 140%  | 250%| 200%| 200% | 180%
```

---

**Estado**: Análisis de tradeoffs completo
**DDD**: Ventajas/Desventajas, Métricas detalladas
**CQRS**: Performance vs Complexity, Eventual Consistency
**Event Sourcing**: Audit vs Performance, Schema Evolution
**Hexagonal**: Flexibility vs Boilerplate
**Decisiones**: Matrix completa, Flowchart, Combinations
**Performance**: Benchmarks, Optimizaciones
**Cost**: ROI Timeline, Development Cost Analysis
