# Backend Architecture Patterns - Implementación Paso a Paso

## Guía de Implementación por Pattern

Esta guía proporciona pasos detallados para implementar cada patrón arquitectónico desde cero.

---

## 1. Implementar DDD (Domain-Driven Design)

### Paso 1: Identificar Domain y Subdomains

```bash
# Crear estructura inicial
mkdir -p src/domain/{aggregates,entities,value-objects,repositories,domain-services,events}
mkdir -p src/application/{services,handlers}
mkdir -p src/infrastructure/{database,external-services}
mkdir -p src/interfaces/{api,graphql}
```

### Paso 2: Crear Value Objects

```typescript
// src/domain/value-objects/money.value-object.ts
export class Money {
  private constructor(
    private _value: number,
    private _currency: string
  ) {
    Object.freeze(this); // Make immutable
  }

  static create(value: number, currency: string = 'USD'): Result<Money> {
    if (value < 0) {
      return Result.fail('Money value cannot be negative');
    }

    return Result.ok(new Money(value, currency));
  }

  static zero(currency: string = 'USD'): Money {
    return new Money(0, currency);
  }

  add(other: Money): Result<Money> {
    if (this._currency !== other._currency) {
      return Result.fail('Cannot add different currencies');
    }
    return Result.ok(new Money(this._value + other._value, this._currency));
  }

  multiply(factor: number): Money {
    return new Money(this._value * factor, this._currency);
  }

  // Getters
  get value(): number { return this._value; }
  get currency(): string { return this._currency; }
  get formatted(): string { return `${this._currency} ${this._value.toFixed(2)}`; }

  // Value objects are equal by value
  equals(other: Money): boolean {
    return this._value === other._value && this._currency === other._currency;
  }
}

// src/domain/value-objects/order-id.value-object.ts
export class OrderId {
  private constructor(private _value: string) {}

  static create(): OrderId {
    return new OrderId(crypto.randomUUID());
  }

  static fromString(value: string): OrderId {
    return new OrderId(value);
  }

  get value(): string { return this._value; }

  equals(other: OrderId): boolean {
    return this._value === other._value;
  }
}
```

### Paso 3: Crear Entities

```typescript
// src/domain/entities/order-item.entity.ts
export class OrderItem {
  private constructor(
    private _productId: string,
    private _quantity: number,
    private _price: Money
  ) {}

  static create(productId: string, quantity: number, price: Money): Result<OrderItem> {
    if (quantity <= 0) {
      return Result.fail('Quantity must be positive');
    }

    return Result.ok(new OrderItem(productId, quantity, price));
  }

  get total(): Money {
    return this._price.multiply(this._quantity);
  }

  // Properties
  get productId(): string { return this._productId; }
  get quantity(): number { return this._quantity; }
  get price(): Money { return this._price; }
}
```

### Paso 4: Crear Aggregate Root

```typescript
// src/domain/aggregates/order.aggregate.ts
export class OrderAggregate {
  private constructor(
    private readonly _id: OrderId,
    private _customerId: string,
    private _items: OrderItem[],
    private _status: OrderStatus,
    private _total: Money,
    private _domainEvents: DomainEvent[]
  ) {}

  static create(customerId: string, items: OrderItem[]): Result<OrderAggregate> {
    // Business rules
    if (items.length === 0) {
      return Result.fail('Order must have at least one item');
    }

    // Calculate total
    const total = items.reduce((sum, item) => {
      const itemTotal = item.total;
      return sum.add(itemTotal);
    }, Money.zero());

    const order = new OrderAggregate(
      OrderId.create(),
      customerId,
      items,
      OrderStatus.PENDING,
      total,
      []
    );

    // Raise domain event
    order.addDomainEvent(new OrderCreatedEvent(order._id, customerId, total));

    return Result.ok(order);
  }

  addItem(productId: string, quantity: number, price: Money): Result<void> {
    // Business rules
    if (this._status !== OrderStatus.PENDING) {
      return Result.fail('Cannot add items to a non-pending order');
    }

    if (this._items.length >= 10) {
      return Result.fail('Maximum 10 items allowed per order');
    }

    const itemResult = OrderItem.create(productId, quantity, price);
    if (itemResult.isFailure) {
      return Result.fail(itemResult.error);
    }

    this._items.push(itemResult.value);
    this.recalculateTotal();

    this.addDomainEvent(new OrderItemAddedEvent(this._id, productId, quantity, price));

    return Result.ok();
  }

  confirm(): Result<void> {
    if (this._status !== OrderStatus.PENDING) {
      return Result.fail('Only pending orders can be confirmed');
    }

    this._status = OrderStatus.CONFIRMED;
    this.addDomainEvent(new OrderConfirmedEvent(this._id));

    return Result.ok();
  }

  cancel(): Result<void> {
    if (this._status === OrderStatus.SHIPPED) {
      return Result.fail('Cannot cancel a shipped order');
    }

    this._status = OrderStatus.CANCELLED;
    this.addDomainEvent(new OrderCancelledEvent(this._id));

    return Result.ok();
  }

  private recalculateTotal(): void {
    this._total = this._items.reduce((sum, item) => {
      return sum.add(item.total);
    }, Money.zero());
  }

  private addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  // Properties
  get id(): OrderId { return this._id; }
  get customerId(): string { return this._customerId; }
  get items(): ReadonlyArray<OrderItem> { return this._items; }
  get status(): OrderStatus { return this._status; }
  get total(): Money { return this._total; }
  get domainEvents(): ReadonlyArray<DomainEvent> { return this._domainEvents; }
}
```

### Paso 5: Domain Events

```typescript
// src/domain/events/order-created.event.ts
export class OrderCreatedEvent extends DomainEvent {
  constructor(
    public readonly orderId: OrderId,
    public readonly customerId: string,
    public readonly total: Money
  ) {
    super('OrderCreated', { orderId: orderId.value, customerId, total: total.value });
  }
}

// src/domain/events/domain-event.ts
export abstract class DomainEvent {
  constructor(
    public readonly type: string,
    public readonly payload: any
  ) {}
}
```

### Paso 6: Repository Interface

```typescript
// src/domain/repositories/order.repository.ts
export interface OrderRepository {
  save(order: OrderAggregate): Promise<void>;
  findById(id: OrderId): Promise<OrderAggregate | null>;
  findByCustomer(customerId: string): Promise<OrderAggregate[]>;
}
```

### Paso 7: Application Service

```typescript
// src/application/services/create-order.service.ts
export class CreateOrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly productService: ProductService,
    private readonly eventBus: EventBus
  ) {}

  async execute(request: CreateOrderRequest): Promise<Result<string>> {
    try {
      // Load products
      const productResults = await Promise.all(
        request.items.map(item =>
          this.productService.findById(item.productId)
        )
      );

      if (productResults.some(result => result.isFailure)) {
        return Result.fail('One or more products not found');
      }

      // Create order items
      const orderItems: OrderItem[] = [];
      for (const [index, requestItem] of request.items.entries()) {
        const product = productResults[index].value;
        const moneyResult = Money.create(requestItem.price);
        if (moneyResult.isFailure) {
          return Result.fail(moneyResult.error);
        }

        const itemResult = OrderItem.create(
          requestItem.productId,
          requestItem.quantity,
          moneyResult.value
        );

        if (itemResult.isFailure) {
          return Result.fail(itemResult.error);
        }

        orderItems.push(itemResult.value);
      }

      // Create aggregate
      const orderResult = OrderAggregate.create(
        request.customerId,
        orderItems
      );

      if (orderResult.isFailure) {
        return Result.fail(orderResult.error);
      }

      // Persist
      await this.orderRepository.save(orderResult.value);

      // Publish events
      const events = orderResult.value.domainEvents;
      await this.eventBus.publish(events);

      return Result.ok(orderResult.value.id.value);
    } catch (error) {
      return Result.fail(error.message);
    }
  }
}
```

---

## 2. Implementar CQRS

### Paso 1: Estructura CQRS

```bash
mkdir -p src/{command,query,event-store,event-bus}
mkdir -p src/command/{handlers,validators,models}
mkdir -p src/query/{handlers,models,projections}
```

### Paso 2: Commands

```typescript
// src/command/models/create-order.command.ts
export interface CreateOrderCommand {
  customerId: string;
  items: {
    productId: string;
    quantity: number;
    price: number;
  }[];
  shippingAddress: Address;
}

export class CreateOrderCommandValidator {
  validate(command: CreateOrderCommand): ValidationResult {
    const errors: string[] = [];

    if (!command.customerId) {
      errors.push('Customer ID is required');
    }

    if (!command.items || command.items.length === 0) {
      errors.push('Order must have items');
    }

    command.items.forEach((item, index) => {
      if (!item.productId) {
        errors.push(`Item ${index}: Product ID is required`);
      }
      if (item.quantity <= 0) {
        errors.push(`Item ${index}: Quantity must be positive`);
      }
      if (item.price < 0) {
        errors.push(`Item ${index}: Price cannot be negative`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
```

### Paso 3: Command Handler

```typescript
// src/command/handlers/create-order.handler.ts
export class CreateOrderHandler {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly validator: CreateOrderCommandValidator,
    private readonly eventBus: EventBus
  ) {}

  async handle(command: CreateOrderCommand): Promise<Result<string>> {
    // 1. Validate
    const validation = this.validator.validate(command);
    if (!validation.isValid) {
      return Result.fail(validation.errors.join(', '));
    }

    // 2. Create aggregate (or use DDD aggregate)
    const orderResult = OrderAggregate.create(
      command.customerId,
      command.items.map(item => OrderItem.create(
        item.productId,
        item.quantity,
        Money.create(item.price).value
      ))
    );

    if (orderResult.isFailure) {
      return Result.fail(orderResult.error);
    }

    const order = orderResult.value;

    // 3. Persist
    await this.orderRepository.save(order);

    // 4. Publish events
    await this.eventBus.publish(order.domainEvents);

    return Result.ok(order.id.value);
  }
}
```

### Paso 4: Queries

```typescript
// src/query/models/get-order.query.ts
export interface GetOrderQuery {
  orderId: string;
}

export interface OrderView {
  orderId: string;
  customerName: string;
  items: {
    productId: string;
    quantity: number;
    price: number;
    total: number;
  }[];
  total: number;
  status: string;
  createdAt: Date;
  estimatedDelivery?: Date;
}
```

### Paso 5: Query Handler

```typescript
// src/query/handlers/get-order.handler.ts
export class GetOrderHandler {
  constructor(
    private readonly orderViewRepository: OrderViewRepository
  ) {}

  async handle(query: GetOrderQuery): Promise<OrderView | null> {
    return this.orderViewRepository.findById(query.orderId);
  }
}
```

### Paso 6: Event Store

```typescript
// src/event-store/event-store.ts
export class EventStore {
  constructor(private readonly prisma: PrismaClient) {}

  async saveEvents(
    aggregateId: string,
    events: DomainEvent[],
    expectedVersion: number
  ): Promise<void> {
    // Optimistic concurrency control
    const latestEvent = await this.prisma.event.findFirst({
      where: { aggregateId },
      orderBy: { version: 'desc' }
    });

    const currentVersion = latestEvent?.version ?? 0;

    if (currentVersion !== expectedVersion) {
      throw new ConcurrencyError(
        `Version conflict: expected ${expectedVersion}, got ${currentVersion}`
      );
    }

    // Save events
    await this.prisma.$transaction(async (tx) => {
      for (const [index, event] of events.entries()) {
        await tx.event.create({
          data: {
            id: event.id,
            aggregateId,
            type: event.type,
            data: JSON.stringify(event.payload),
            version: expectedVersion + index + 1,
            timestamp: new Date()
          }
        });
      }
    });
  }

  async getEvents(aggregateId: string, fromVersion: number = 0): Promise<DomainEvent[]> {
    const events = await this.prisma.event.findMany({
      where: {
        aggregateId,
        version: { gt: fromVersion }
      },
      orderBy: { version: 'asc' }
    });

    return events.map(event => this.deserializeEvent(event));
  }

  private deserializeEvent(event: any): DomainEvent {
    // Deserialize based on type
    switch (event.type) {
      case 'OrderCreated':
        return new OrderCreatedEvent(
          OrderId.fromString(event.data.orderId),
          event.data.customerId,
          Money.create(event.data.total).value
        );
      default:
        throw new Error(`Unknown event type: ${event.type}`);
    }
  }
}
```

---

## 3. Implementar Hexagonal Architecture

### Paso 1: Estructura Hexagonal

```bash
mkdir -p src/{core,adapters}
mkdir -p src/core/{ports,entities,use-cases}
mkdir -p src/adapters/{database,api,queue,external-services}
```

### Paso 2: Core Ports

```typescript
// src/core/ports/order-repository.port.ts
export interface OrderRepository {
  save(order: Order): Promise<void>;
  findById(id: OrderId): Promise<Order | null>;
  findByCustomer(customerId: string): Promise<Order[]>;
}

// src/core/ports/payment-gateway.port.ts
export interface PaymentGateway {
  charge(amount: number, paymentMethod: PaymentMethod): Promise<Result<void>>;
  refund(transactionId: string): Promise<Result<void>>;
}

// src/core/ports/email-service.port.ts
export interface EmailService {
  sendOrderConfirmation(order: Order): Promise<void>;
  sendShippingNotification(order: Order): Promise<void>;
}
```

### Paso 3: Core Use Cases

```typescript
// src/core/use-cases/create-order.use-case.ts
export class CreateOrderUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly paymentGateway: PaymentGateway,
    private readonly emailService: EmailService
  ) {}

  async execute(request: CreateOrderRequest): Promise<Result<string>> {
    try {
      // 1. Create order (domain logic)
      const order = Order.create(request.customerId, request.items);
      if (order.isFailure) {
        return Result.fail(order.error);
      }

      // 2. Process payment
      const paymentResult = await this.paymentGateway.charge(
        order.value.total.value,
        request.paymentMethod
      );

      if (paymentResult.isFailure) {
        return Result.fail('Payment failed: ' + paymentResult.error);
      }

      // 3. Save order
      await this.orderRepository.save(order.value);

      // 4. Send confirmation
      await this.emailService.sendOrderConfirmation(order.value);

      return Result.ok(order.value.id.value);
    } catch (error) {
      return Result.fail(error.message);
    }
  }
}
```

### Paso 4: Database Adapter

```typescript
// src/adapters/database/order-repository.adapter.ts
export class PrismaOrderRepository implements OrderRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(order: Order): Promise<void> {
    await this.prisma.order.create({
      data: {
        id: order.id.value,
        customerId: order.customerId,
        total: order.total.value,
        currency: order.total.currency,
        status: order.status,
        items: {
          create: order.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price.value
          }))
        }
      }
    });
  }

  async findById(id: OrderId): Promise<Order | null> {
    const orderEntity = await this.prisma.order.findUnique({
      where: { id: id.value },
      include: { items: true }
    });

    if (!orderEntity) {
      return null;
    }

    // Reconstruct aggregate from data
    return Order.reconstruct(orderEntity);
  }
}
```

### Paso 5: API Adapter

```typescript
// src/adapters/api/order.controller.ts
export class OrderController {
  constructor(
    private readonly createOrderUseCase: CreateOrderUseCase
  ) {}

  async createOrder(req: Request, res: Response): Promise<void> {
    const request: CreateOrderRequest = {
      customerId: req.body.customerId,
      items: req.body.items,
      paymentMethod: req.body.paymentMethod
    };

    const result = await this.createOrderUseCase.execute(request);

    if (result.isFailure) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.status(201).json({ orderId: result.value });
  }
}
```

---

## 4. Dependency Injection Setup

### Inversify IoC Container

```typescript
// src/infrastructure/ioc/container.ts
import { Container } from 'inversify';
import { OrderRepository } from '../../domain/repositories/order.repository';
import { PrismaOrderRepository } from '../database/prisma-order.repository';
import { CreateOrderService } from '../../application/services/create-order.service';

const container = new Container();

// Bind interfaces to implementations
container.bind<OrderRepository>('OrderRepository').to(PrismaOrderRepository);
container.bind<CreateOrderService>('CreateOrderService').to(CreateOrderService);

// For CQRS
container.bind<CreateOrderHandler>('CreateOrderHandler').to(CreateOrderHandler);
container.bind<GetOrderHandler>('GetOrderHandler').to(GetOrderHandler);

export { container };
```

### Express Integration

```typescript
// src/interfaces/api/server.ts
import express from 'express';
import { container } from '../../infrastructure/ioc/container';
import { OrderController } from '../controllers/order.controller';

const app = express();
app.use(express.json());

// Get controller from container
const orderController = container.get<OrderController>(OrderController);

// Routes
app.post('/orders', (req, res) => orderController.createOrder(req, res));
app.get('/orders/:id', (req, res) => orderController.getOrder(req, res));

app.listen(3000);
```

---

## Testing Strategy

### Unit Tests (Domain)

```typescript
// src/domain/__tests__/order.aggregate.spec.ts
describe('OrderAggregate', () => {
  it('should create order with valid items', () => {
    const customerId = 'customer-123';
    const items = [
      OrderItem.create('product-1', 2, Money.create(10).value).value
    ];

    const orderResult = OrderAggregate.create(customerId, items);

    expect(orderResult.isSuccess).toBe(true);
    expect(orderResult.value.status).toBe(OrderStatus.PENDING);
  });

  it('should not allow adding items to confirmed order', () => {
    const order = OrderAggregate.create('customer-123', [
      OrderItem.create('product-1', 1, Money.create(10).value).value
    ]).value;

    order.confirm();
    const addResult = order.addItem('product-2', 1, Money.create(10).value);

    expect(addResult.isFailure).toBe(true);
    expect(addResult.error).toBe('Cannot add items to a non-pending order');
  });
});
```

### Integration Tests (Application)

```typescript
// src/application/__tests__/create-order.service.spec.ts
describe('CreateOrderService', () => {
  it('should create order successfully', async () => {
    // Arrange
    const mockRepo = new MockOrderRepository();
    const mockProductService = new MockProductService();
    const service = new CreateOrderService(mockRepo, mockProductService);

    const request: CreateOrderRequest = {
      customerId: 'customer-123',
      items: [
        { productId: 'product-1', quantity: 2, price: 10 }
      ]
    };

    // Act
    const result = await service.execute(request);

    // Assert
    expect(result.isSuccess).toBe(true);
    expect(mockRepo.savedOrders).toHaveLength(1);
  });
});
```

---

## Migration from Anemic to DDD

### Step-by-Step Migration

1. **Identify Domain Concepts**
```bash
# Run this to find business logic in controllers
grep -r "if.*status" src/controllers/
```

2. **Extract Value Objects**
```typescript
// Before
class Order {
  total: number; // Just a number
  // ...
}

// After
class Order {
  private _total: Money; // Rich value object
  // ...
}
```

3. **Create Aggregates**
```typescript
// Before
class Order {
  items: any[]; // Array of plain objects
  addItem(item: any) { /* Logic */ }
}

// After
class OrderAggregate {
  private _items: OrderItem[]; // Rich entities
  addItem(item: OrderItem) { /* Domain logic */ }
}
```

4. **Move Business Logic**
```typescript
// Before (in controller)
if (order.total > 100 && order.status === 'PENDING') {
  order.status = 'APPROVED';
}

// After (in aggregate)
confirm(): void {
  if (this.total.value > 100 && this.status === OrderStatus.PENDING) {
    this.status = OrderStatus.APPROVED;
  }
}
```

---

**Estado**: Implementación detallada completada
**DDD**: Value Objects, Entities, Aggregates, Repositories, Services
**CQRS**: Commands, Handlers, Queries, Event Store, Projections
**Hexagonal**: Ports, Use Cases, Adapters, IoC
**Testing**: Unit tests, Integration tests
**Migration**: Step-by-step guide from anemic to DDD
