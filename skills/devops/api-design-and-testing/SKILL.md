---
id: api-design-and-testing
version: 0.1.0
type: guideline
summary: 'Diseño y testing de APIs REST, GraphQL y gRPC. Implementa APIs RESTful, diseña schemas GraphQL, configura gRPC, y crea suites de testing comprehensivas.'
audience: senior-developers, backend-engineers, api-architects
when_to_use: 'Al crear nuevas APIs, refactorizar APIs existentes, diseñar integraciones, o implementar testing para APIs. Usa en desarrollo backend, microservicios, o BFFs.'
provides: 'APIs bien diseñadas, contratos claros, testing automatizado, documentación completa, seguridad implementada.'
resources:
  - resources/api-types.md
  - resources/design-principles.md
  - resources/testing.md
  - resources/best-practices.md
scripts:
  - name: init-rest-api
    run: mkdir -p src/routes/{controllers,middleware,validators} && mkdir -p src/{schemas,tests}
    note: Estructura básica para API REST
  - name: init-graphql
    run: mkdir -p src/graphql/{resolvers,schemas,types} && touch src/graphql/{query,mutation,subscription}.{ts,js}
    note: Estructura básica para GraphQL
  - name: init-grpc
    run: mkdir -p proto && mkdir -p src/grpc/{services,clients} && npx grpc_tools_node_protoc --js_out=import_style=commonjs:src/grpc --grpc_out=src/grpc proto/*.proto
    note: Estructura básica para gRPC
  - name: run-api-tests
    run: npm test -- api/ || jest api/ || vitest run api/
    note: Ejecuta tests de API
limits: 'Requiere conocimiento de HTTP, JSON, protocolos de red. Testing requiere datos de prueba. gRPC requiere setup de protobuf.'
---

## Objetivo

Diseñar y desarrollar **APIs robustas y testeables** que sigan mejores prácticas, implementen seguridad adecuada, y proporcionen documentación clara para consumidores.

**Cuándo usar**:
- Al crear nuevas APIs o servicios
- Al refactorizar APIs existentes
- Al diseñar integraciones con terceros
- Al implementar testing automatizado
- Al desarrollar microservicios o BFFs

**Cuándo NO usar**: Para operaciones simples sin necesidad de API pública, o cuando GraphQL/REST no es apropiado (usar gRPC para microservicios internos).

**Qué problema resuelve**: APIs inconsistentes, falta de documentación, testing manual, problemas de seguridad, contratos poco claros.

## Procedimiento (resumen)

### Seleccionar Tipo de API

1. **REST**: Recursos, CRUD operations, HTTP verbs
2. **GraphQL**: Queries flexibles, typed schema, single endpoint
3. **gRPC**: High performance, protobuf, bidirectional streaming

### Diseñar API

1. **Definir endpoints/operations**
2. **Crear schemas/models**
3. **Implementar validation**
4. **Configurar authentication**
5. **Documentar API**

### Testing Strategy

1. **Unit tests**: Lógica de business
2. **Integration tests**: API endpoints
3. **Contract tests**: API schemas
4. **End-to-end tests**: Flujos completos

## Tipos de APIs

### REST (Representational State Transfer)

**Características**:
- **Resource-based**: /users, /orders, /products
- **HTTP Verbs**: GET, POST, PUT, PATCH, DELETE
- **Stateless**: Cada request contiene toda la información
- **JSON/XML**: Formatos de intercambio comunes

**Ejemplo de Endpoint**:
```
GET    /api/v1/users           # Listar usuarios
GET    /api/v1/users/{id}      # Obtener usuario
POST   /api/v1/users           # Crear usuario
PUT    /api/v1/users/{id}      # Actualizar usuario
PATCH  /api/v1/users/{id}      # Actualizar parcialmente
DELETE /api/v1/users/{id}      # Eliminar usuario
```

### GraphQL

**Características**:
- **Single Endpoint**: POST /graphql
- **Client-driven**: Cliente especifica qué datos quiere
- **Strongly Typed**: Schema defined con types
- **Real-time**: Subscriptions para updates

**Ejemplo de Schema**:
```graphql
type Query {
  user(id: ID!): User
  users(limit: Int, offset: Int): [User]
}

type Mutation {
  createUser(input: CreateUserInput!): User
  updateUser(id: ID!, input: UpdateUserInput!): User
}

type User {
  id: ID!
  name: String!
  email: String!
  posts: [Post]
}
```

### gRPC

**Características**:
- **Protocol Buffers**: Binary serialization
- **IDL**: Interface Definition Language
- **Streaming**: Unary, server streaming, client streaming, bidirectional
- **Performance**: Muy eficiente para microservicios

**Ejemplo de .proto**:
```protobuf
service UserService {
  rpc GetUser (GetUserRequest) returns (User);
  rpc ListUsers (ListUsersRequest) returns (ListUsersResponse);
  rpc CreateUser (CreateUserRequest) returns (User);
}

message User {
  string id = 1;
  string name = 2;
  string email = 3;
}
```

## Checklist

- [ ] Tipo de API seleccionado (REST/GraphQL/gRPC)
- [ ] Endpoints/operations definidos
- [ ] Schemas/models creados
- [ ] Validation rules implementadas
- [ ] Authentication configurada
- [ ] Error handling estructurado
- [ ] Rate limiting implementado
- [ ] Logging configurado
- [ ] Unit tests creados
- [ ] Integration tests creados
- [ ] Contract tests (OpenAPI/GraphQL SDL)
- [ ] API documentation generada
- [ ] Security headers configurados
- [ ] CORS configurado
- [ ] Versioning strategy definida

## Ejemplos

### ✅ Correcto - REST API (Express)

```typescript
// src/routes/users.controller.ts
import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { CreateUserDto, UpdateUserDto } from '../schemas/user.schema';
import { validate } from '../middleware/validation';

export class UsersController {
  constructor(private userService: UserService) {}

  async getAll(req: Request, res: Response): Promise<void> {
    const { limit = 10, offset = 0 } = req.query;
    const users = await this.userService.findAll({
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });

    res.json({
      data: users,
      meta: {
        total: users.length,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    });
  }

  async getById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const user = await this.userService.findById(id);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ data: user });
  }

  async create(req: Request, res: Response): Promise<void> {
    const validatedData = validate(CreateUserDto, req.body);
    const user = await this.userService.create(validatedData);

    res.status(201).json({ data: user });
  }
}

// src/routes/users.routes.ts
import { Router } from 'express';
import { UsersController } from './users.controller';
import { validate } from '../middleware/validation';

const router = Router();
const controller = new UsersController(new UserService());

router.get('/users', controller.getAll.bind(controller));
router.get('/users/:id', controller.getById.bind(controller));
router.post('/users', validate('body'), controller.create.bind(controller));

export { router };
```

### ✅ Correcto - GraphQL (Apollo)

```typescript
// src/graphql/resolvers/user.resolver.ts
import { Query, Mutation, Resolver, Arg } from 'type-graphql';
import { UserService } from '../services/user.service';
import { UserType } from '../types/user.type';
import { CreateUserInput, UpdateUserInput } from '../inputs/user.input';

@Resolver(() => UserType)
export class UserResolver {
  constructor(private userService: UserService) {}

  @Query(() => [UserType])
  async users(
    @Arg('limit', { nullable: true }) limit?: number,
    @Arg('offset', { nullable: true }) offset?: number
  ): Promise<UserType[]> {
    return this.userService.findAll({ limit, offset });
  }

  @Query(() => UserType, { nullable: true })
  async user(@Arg('id') id: string): Promise<UserType | null> {
    return this.userService.findById(id);
  }

  @Mutation(() => UserType)
  async createUser(@Arg('input') input: CreateUserInput): Promise<UserType> {
    return this.userService.create(input);
  }

  @Mutation(() => UserType)
  async updateUser(
    @Arg('id') id: string,
    @Arg('input') input: UpdateUserInput
  ): Promise<UserType> {
    return this.userService.update(id, input);
  }
}

// src/graphql/schema.ts
export const typeDefs = `#graphql
  type Query {
    users(limit: Int, offset: Int): [User]
    user(id: ID!): User
  }

  type Mutation {
    createUser(input: CreateUserInput!): User
    updateUser(id: ID!, input: UpdateUserInput!): User
    deleteUser(id: ID!): Boolean
  }

  type User {
    id: ID!
    name: String!
    email: String!
    createdAt: String!
    updatedAt: String!
  }

  input CreateUserInput {
    name: String!
    email: String!
  }

  input UpdateUserInput {
    name: String
    email: String
  }
`;
```

### ✅ Correcto - gRPC Server

```typescript
// src/grpc/user.service.ts
import { ServiceClient, ServiceDefinition } from '@grpc/grpc-js';
import { UserServiceHandlers } from '../../proto/user';

export class UserGrpcService implements UserServiceHandlers {
  constructor(private userService: UserService) {}

  async GetUser(
    call: any,
    callback: any
  ): Promise<void> {
    const { id } = call.request;
    const user = await this.userService.findById(id);

    if (!user) {
      callback({ code: 404, message: 'User not found' }, null);
      return;
    }

    callback(null, {
      id: user.id,
      name: user.name,
      email: user.email
    });
  }

  async ListUsers(call: any, callback: any): Promise<void> {
    const { limit, offset } = call.request;
    const users = await this.userService.findAll({ limit, offset });

    callback(null, {
      users: users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email
      }))
    });
  }
}

// src/server.ts
import { loadSync } from '@grpc/proto-loader';
import { Server } from '@grpc/grpc-js';

const packageDefinition = loadSync('proto/user.proto', {});
const userProto = grpc.loadPackageDefinition(packageDefinition);

const server = new Server();
server.addService(userProto.UserService.service, new UserGrpcService());

server.bindAsync('localhost:50051', ServerCredentials.createInsecure(), () => {
  console.log('gRPC server running on port 50051');
});
```

### ❌ Incorrecto

```typescript
// ❌ Inconsistent naming
router.post('/createUser', (req, res) => { });  // No RESTful
router.get('/getUsers', (req, res) => { });      // Verb in path

// ❌ Poor error handling
app.get('/users/:id', async (req, res) => {
  const user = await db.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
  res.json(user);  // May throw error if user not found
});

// ❌ No validation
app.post('/users', async (req, res) => {
  const user = await User.create(req.body);  // No validation!
  res.json(user);
});

// ❌ Unclear error responses
app.post('/users', (req, res) => {
  try {
    // ... logic
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });  // Generic
  }
});

// ❌ Mixed concerns
app.get('/users', async (req, res) => {
  const users = await db.query('SELECT * FROM users');
  // Business logic mixed with data access
  const activeUsers = users.filter(u => u.status === 'active');
  // Database queries mixed with presentation
  res.json(activeUsers);
});
```

## Herramientas y Comandos

### REST API Tools

```bash
# Initialize Express project
npm init -y
npm install express express-validator joi
