---
id: backend-architecture-patterns
version: 0.1.0
type: guideline
summary: 'Patrones arquitectónicos empresariales para backend: DDD, CQRS, Event Sourcing, Hexagonal Architecture. Implementa arquitecturas escalables, mantenibles y testeables.'
audience: senior-developers, architects
when_to_use: 'Al diseñar sistemas backend complejos, microservicios, o aplicaciones con alta carga. Usa en sistemas que requieren escalabilidad, mantenibilidad y separación de concerns.'
provides: 'Arquitectura escalable, dominio bien definido, separación de capas, testing aislado, flexibilidad tecnológica.'
resources:
  - resources/patterns.md
  - resources/implementation.md
  - resources/tradeoffs.md
  - resources/case-studies.md
scripts:
  - name: init-ddd
    run: mkdir -p src/{domain,application,infrastructure,interfaces} && touch src/domain/{entities,value-objects,repositories,domain-services}.ts
    note: Estructura básica DDD
  - name: init-cqrs
    run: mkdir -p src/{command,query}/{handlers,models} && mkdir -p src/{event-store,event-bus}
    note: Estructura básica CQRS
  - name: init-hexagonal
    run: mkdir -p src/{core,adapters} && touch src/{ports,adapters/{db,api,queue}}.ts
    note: Estructura básica Hexagonal Architecture
  - name: generate-diagram
    run: npx @mermaid-js/mermaid-cli -i architecture.mmd -o architecture.png
    note: Genera diagrama de arquitectura (requiere archivo .mmd)
limits: 'Requiere experiencia en patrones arquitectónicos. Impacto significativo en estructura del proyecto. Tiempo adicional de desarrollo inicial.'
---

## Objetivo

Implementar **patrones arquitectónicos empresariales** en backend para crear sistemas escalables, mantenibles y testeables que soporten crecimiento y cambio constante.

**Cuándo usar**:
- Aplicaciones con dominio de negocio complejo
- Sistemas que requieren alta escalabilidad
- Microservicios con boundaries bien definidos
- Aplicaciones que necesitan testing aislado
- Sistemas con múltiples equipos trabajando

**Cuándo NO usar**: Para proyectos simples, CRUD básicos, o aplicaciones con dominio trivial donde DDD sería over-engineering.

**Qué problema resuelve**: Elimina acoplamiento, mejora testabilidad, facilita cambios, define boundaries claros, habilita escalabilidad independiente.

## Procedimiento (resumen)

### Seleccionar Pattern

1. **Domain-Driven Design (DDD)**: Para dominio complejo
2. **CQRS**: Para separar reads/writes
3. **Event Sourcing**: Para auditabilidad
4. **Hexagonal Architecture**: Para independence de tecnologías
5. **Clean Architecture**: Para simplicidad y separación

### Definir Estructura

1. **Domain Layer**: Lógica de negocio pura
2. **Application Layer**: Casos de uso y orquestación
3. **Infrastructure Layer**: Datos, externos, frameworks
4. **Interface Layer**: APIs, UI, webhooks

### Implementar Boundaries

1. **Aggregate Roots**: Definir entidades principales
2. **Repositories**: Abstraer persistencia
3. **Domain Events**: Comunicación entre aggregates
4. **Application Services**: Coordinar flujos

## Patrones Arquitectónicos

### Domain-Driven Design (DDD)

**Core Concepts**:
- **Bounded Context**: Subdominios independientes
- **Aggregates**: Unidades de consistencia transaccional
- **Entities**: Objetos con identidad
- **Value Objects**: Objetos sin identidad
- **Domain Events**: Representan cambios significativos

**Estructura**:
```
src/domain/
├── aggregates/          # Aggregate roots
├── entities/            # Entities
├── value-objects/       # Value objects
├── repositories/        # Repository interfaces
├── domain-services/     # Lógica entre aggregates
└── events/              # Domain events
```

### CQRS (Command Query Responsibility Segregation)

**Separación**:
- **Commands**: Modifican estado
- **Queries**: Leen datos
- **Event Store**: Fuente de verdad para eventos
- **Projections**: Read models optimizados

**Estructura**:
```
src/
├── command/             # Write side
│   ├── handlers/        # Command handlers
│   ├── validators/      # Validación commands
│   └── models/          # Command models
├── query/               # Read side
│   ├── handlers/        # Query handlers
│   ├── models/          # Query models
│   └── projections/     # Read models
└── event-store/         # Event storage
```

### Event Sourcing

**Concepts**:
- **Events**: Hechos inmutables
- **Event Store**: Persistencia de eventos
- **Projections**: Rebuild estado desde eventos
- **Snapshots**: Optimización para eventos largos

### Hexagonal Architecture

**Ports & Adapters**:
- **Ports**: Interfaces (qué)
- **Adapters**: Implementaciones (cómo)
- **Core**: Lógica de negocio independiente
- **Outside**: Frameworks, DB, APIs

**Estructura**:
```
src/
├── core/
│   ├── ports/           # Interfaces
│   ├── entities/        # Domain entities
│   └── use-cases/       # Business logic
└── adapters/
    ├── database/        # DB adapters
    ├── api/             # API adapters
    └── queue/           # Message queue adapters
```

### Clean Architecture

**Layers**:
- **Entities**: Business objects
- **Use Cases**: Application rules
- **Interface Adapters**: Controllers, presenters
- **Frameworks & Drivers**: External concerns

## Checklist

- [ ] Pattern seleccionado según contexto
- [ ] Bounded contexts definidos
- [ ] Aggregate roots identificados
- [ ] Entities vs Value Objects diferenciados
- [ ] Domain services creados
- [ ] Repository interfaces definidos
- [ ] Application services implementados
- [ ] Infrastructure adapters creados
- [ ] Unit tests por capa
- [ ] Integration tests entre capas
- [ ] Diagramas de arquitectura actualizados
- [ ] Documentación de patterns actualizada

## Ejemplos

### ✅ Correcto - DDD Aggregate

```typescript
// src/domain/aggregates/order.aggregate.ts
export class OrderAggregate {
  private constructor(
    private readonly id: OrderId,
    private items: OrderItem[],
    private status: OrderStatus,
    private total: Money
  ) {}

  static create(customerId: CustomerId, items: OrderItem[]): Result<OrderAggregate> {
    // Business rules
    if (items.length === 0) {
      return Result.fail('Order must have items');
    }

    const total = items.reduce((sum, item) => sum + item.price, Money.zero());
    const order = new OrderAggregate(
      OrderId.create(),
      items,
      OrderStatus.PENDING,
      total
    );

    // Raise domain event
    order.addDomainEvent(new OrderCreatedEvent(order.id, customerId, total));

    return Result.ok(order);
  }

  addItem(item: OrderItem): Result<void> {
    if (this.status !== OrderStatus.PENDING) {
      return Result.fail('Cannot add items to non-pending order');
    }

    this.items.push(item);
    this.total = this.total.add(item.price);
    this.addDomainEvent(new OrderItemAddedEvent(this.id, item));
  }

  confirm(): Result<void> {
    if (this.status !== OrderStatus.PENDING) {
      return Result.fail('Order is not pending');
    }

    this.status = OrderStatus.CONFIRMED;
    this.addDomainEvent(new OrderConfirmedEvent(this.id));
  }
}
```

### ✅ Correcto - CQRS Command Handler

```typescript
// src/command/handlers/create-order.handler.ts
export class CreateOrderHandler {
  constructor(
    private readonly repository: OrderRepository,
    private readonly eventBus: EventBus
  ) {}

  async handle(command: CreateOrderCommand): Promise<Result<string>> {
    // Validation
    const validator = new CreateOrderValidator();
    const validationResult = await validator.validate(command);

    if (!validationResult.isValid) {
      return Result.fail(validationResult.errors.join(', '));
    }

    // Create aggregate
    const orderResult = OrderAggregate.create(
      command.customerId,
      command.items
    );

    if (orderResult.isFailure) {
      return Result.fail(orderResult.error);
    }

    const order = orderResult.value;

    // Persist
    await this.repository.save(order);

    // Publish events
    const events = order.getDomainEvents();
    await this.eventBus.publish(events);

    return Result.ok(order.id.value);
  }
}
```

### ✅ Correcto - Hexagonal Port

```typescript
// src/core/ports/order-repository.port.ts
export interface OrderRepository {
  save(order: OrderAggregate): Promise<void>;
  findById(id: OrderId): Promise<OrderAggregate | null>;
  findByCustomer(customerId: CustomerId): Promise<OrderAggregate[]>;
}

// src/adapters/database/order-repository.adapter.ts
export class OrderRepositoryAdapter implements OrderRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(order: OrderAggregate): Promise<void> {
    // Convert aggregate to entities
    const orderEntity = {
      id: order.id.value,
      customerId: order.customerId.value,
      status: order.status,
      total: order.total.value,
      items: order.items.map(item => ({
        productId: item.productId.value,
        quantity: item.quantity,
        price: item.price.value
      }))
    };

    await this.prisma.order.create({
      data: orderEntity
    });

    // Publish domain events
    const events = order.getDomainEvents();
    for (const event of events) {
      await this.eventBus.publish(event);
    }
  }
}
```

### ❌ Incorrecto

```typescript
// ❌ Lógica de negocio en controlador
export class OrderController {
  async createOrder(req: Request, res: Response) {
    const items = req.body.items;

    // ❌ Lógica de negocio en controlador
    if (items.length === 0) {
      return res.status(400).json({ error: 'No items' });
    }

    const total = items.reduce((sum, item) => sum + item.price, 0);

    // ❌ Acceso directo a DB
    await prisma.order.create({
      data: {
        customerId: req.body.customerId,
        total,
        items
      }
    });

    res.json({ success: true });
  }
}

// ❌ Entidad anémica (sin comportamiento)
export class OrderEntity {
  id: string;
  customerId: string;
  items: any[];
  total: number;
  status: string;
  // ❌ Solo getters/setters, sin lógica
}
```

## Herramientas y Comandos

### Setup Inicial

```bash
# Crear estructura DDD
mkdir -p src/{domain,application,infrastructure,interfaces}
cd src/domain
mkdir -p {aggregates,entities,value-objects,repositories,domain-services,events}

# Crear estructura CQRS
mkdir -p src/{command,query}/{handlers,models}
mkdir -p src/{event-store,event-bus}

# Crear estructura Hexagonal
mkdir -p src/{core,adapters}
mkdir -p src/core/{ports,entities,use-cases}
mkdir -p src/adapters/{database,api,queue}
```

### Tools & Frameworks

```bash
# Event Store
npm install eventstore-client

# Event Bus
npm install @nestjs/event-emitter

# DDD Validation
npm install class-validator class-transformer

# Result Pattern
npm install neverthrow

# Prisma (infrastructure)
npm install prisma @prisma/client

# Testing
npm install -D vitest @testing-library/jest-dom
```

### Validation Commands

```bash
# Test domain layer (pure, no dependencies)
npm test -- domain/

# Test application layer
npm test -- application/

# Integration tests
npm test -- integration/

# Architecture validation
npm run check-architecture
```

