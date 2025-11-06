# API Types - Comparación Detallada de REST, GraphQL y gRPC

## Overview de Tipos de API

Esta guía compara en profundidad los tres tipos principales de APIs, sus fortalezas, debilidades y casos de uso ideales.

---

## 1. REST (Representational State Transfer)

### Características Fundamentales

#### Arquitectura Client-Server
```typescript
// Resource-based URL design
const API_BASE = '/api/v1';

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

// HTTP Verbs
GET    ${API_BASE}/users        // Listar todos los usuarios
GET    ${API_BASE}/users/{id}   // Obtener usuario específico
POST   ${API_BASE}/users        // Crear nuevo usuario
PUT    ${API_BASE}/users/{id}   // Reemplazar usuario completo
PATCH  ${API_BASE}/users/{id}   // Actualizar parcialmente usuario
DELETE ${API_BASE}/users/{id}   // Eliminar usuario
```

#### Stateless Communication
```typescript
// Cada request es independiente - no hay sesión
app.get('/api/v1/users/:id', async (req, res) => {
  // El request contiene TODA la información necesaria
  const userId = req.params.id;           // En el URL
  const authToken = req.headers.authorization;  // En headers
  const acceptHeader = req.headers.accept;      // Para content negotiation

  // No rely on previous requests
  const user = await User.findById(userId);

  res.json({ data: user });
});
```

#### Resource Representation
```typescript
// Multiple representations
app.get('/api/v1/users/:id', (req, res) => {
  const { format = 'json' } = req.query;

  switch (format) {
    case 'json':
      res.json(user); // JSON
      break;
    case 'xml':
      res.xml(user);  // XML
      break;
    case 'csv':
      res.csv(user);  // CSV
      break;
  }
});

// Content negotiation via Accept header
app.get('/api/v1/users/:id', (req, res) => {
  const acceptHeader = req.headers.accept;

  if (acceptHeader.includes('application/json')) {
    res.json(user);
  } else if (acceptHeader.includes('application/xml')) {
    res.xml(user);
  }
});
```

### REST Best Practices

#### Resource Naming Conventions

```typescript
// ✅ Good: Nouns, plural, hierarchical
/users
/users/{id}
/users/{id}/posts
/users/{id}/posts/{postId}

// ❌ Bad: Verbs in URL
/getUsers
/getUserById
/createUser
/updateUser

// ✅ Good: Use HTTP verbs for actions
POST   /users     // Create
GET    /users     // Read all
GET    /users/1   // Read one
PUT    /users/1   // Replace
PATCH  /users/1   // Partial update
DELETE /users/1   // Delete
```

#### Idempotency

```typescript
// GET: Always idempotent (multiple calls = same result)
GET /api/v1/users/123
GET /api/v1/users/123  // Same result

// PUT: Idempotent (replace resource)
PUT /api/v1/users/123  // { name: "John" }
PUT /api/v1/users/123  // { name: "John" }  // Same result

// DELETE: Idempotent (resource deleted once, stays deleted)
DELETE /api/v1/users/123  // 204 No Content
DELETE /api/v1/users/123  // 204 No Content (not 404)

// POST: Not idempotent (creates new resource)
POST /api/v1/users        // Creates user #1
POST /api/v1/users        // Creates user #2 (different)
```

#### Status Codes

```typescript
// Success (2xx)
200 OK              // GET successful
201 Created         // POST created new resource
204 No Content      // DELETE successful, no body
206 Partial Content // GET with Range header

// Client Errors (4xx)
400 Bad Request     // Invalid request data
401 Unauthorized    // Not authenticated
403 Forbidden       // Authenticated but not authorized
404 Not Found       // Resource doesn't exist
409 Conflict        // Resource conflict (e.g., duplicate)
422 Unprocessable Entity  // Validation errors
429 Too Many Requests    // Rate limited

// Server Errors (5xx)
500 Internal Server Error
502 Bad Gateway
503 Service Unavailable
504 Gateway Timeout

// Example implementation
app.post('/api/v1/users', async (req, res) => {
  try {
    const user = await User.create(req.body);

    // 201 Created with Location header
    res.status(201)
       .location(`/api/v1/users/${user.id}`)
       .json({ data: user });
  } catch (error) {
    if (error.name === 'ValidationError') {
      // 422 for validation errors
      res.status(422).json({ errors: error.errors });
    } else {
      // 500 for unexpected errors
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});
```

### Ventajas de REST

```typescript
✅ Advantages:
1. Simple to understand and implement
2. HTTP caching works out of the box
3. Stateless - scalable
4. Wide tool support (Postman, curl, browsers)
5. Human-readable (JSON)
6. Mature ecosystem
7. Works with any client (browser, mobile, etc.)
8. Easy to debug (curl, network tab)
```

### Desventajas de REST

```typescript
❌ Disadvantages:
1. Over-fetching: GET /users returns all fields
2. Under-fetching: Need multiple requests for related data
   GET /users/1 → User data
   GET /users/1/posts → Separate request for posts
3. Multiple round trips for complex data
4. Versioning challenges (/v1, /v2)
5. No built-in real-time support
6. Fixed data structure (can't customize response)
7. Hard to evolve APIs without breaking changes
```

---

## 2. GraphQL

### Características Fundamentales

#### Single Endpoint

```typescript
// POST request to single endpoint
POST /graphql

// Always returns JSON
{
  "data": {
    "user": {
      "id": "1",
      "name": "John",
      "posts": [
        {
          "title": "GraphQL Basics",
          "comments": [
            {
              "content": "Great explanation!"
            }
          ]
        }
      ]
    }
  }
}
```

#### Client-Driven Queries

```typescript
// Client specifies exactly what data it wants
query {
  user(id: "1") {
    id
    name
    email
  }
}

// Response matches query structure exactly
{
  "data": {
    "user": {
      "id": "1",
      "name": "John",
      "email": "john@example.com"
    }
  }
}

// Client can request related data in same query
query {
  user(id: "1") {
    name
    posts {        // Nested
      title
      content
    }
  }
}

// Client can request multiple resources
query {
  user(id: "1") { ... }
  posts(limit: 5) { ... }
}
```

#### Schema Definition

```typescript
// Strongly typed schema
export const typeDefs = `#graphql
  type User {
    id: ID!
    name: String!
    email: String!
    age: Int
    posts: [Post!]!     # Array of Posts (non-null)
    postCount: Int!     # Computed field
    createdAt: String!
    updatedAt: String!
  }

  type Post {
    id: ID!
    title: String!
    content: String!
    author: User!        # Relationship
    comments: [Comment!]!
    published: Boolean!
    createdAt: String!
  }

  type Comment {
    id: ID!
    content: String!
    author: User!
    post: Post!
    createdAt: String!
  }

  # Input types for mutations
  input CreateUserInput {
    name: String!
    email: String!
    age: Int
  }

  input UpdateUserInput {
    name: String
    email: String
    age: Int
  }

  # Queries (read operations)
  type Query {
    users(limit: Int, offset: Int): [User!]!
    user(id: ID!): User
    posts(filter: PostFilter): [Post!]!
  }

  # Mutations (write operations)
  type Mutation {
    createUser(input: CreateUserInput!): User!
    updateUser(id: ID!, input: UpdateUserInput!): User!
    deleteUser(id: ID!): Boolean!
  }

  # Subscriptions (real-time)
  type Subscription {
    userCreated: User!
    postPublished(postId: ID!): Post!
    commentAdded(postId: ID!): Comment!
  }

  # Custom scalars
  scalar DateTime

  # Enums
  enum PostStatus {
    DRAFT
    PUBLISHED
    ARCHIVED
  }
`;
```

#### Resolvers Implementation

```typescript
export class UserResolver {
  constructor(
    private userService: UserService,
    private postService: PostService
  ) {}

  // Query resolver
  @Query()
  async user(@Arg('id') id: string): Promise<User | null> {
    return this.userService.findById(id);
  }

  @Query()
  async users(
    @Arg('limit', { nullable: true }) limit?: number,
    @Arg('offset', { nullable: true }) offset?: number
  ): Promise<User[]> {
    return this.userService.findAll({ limit, offset });
  }

  // Field resolver (computed field)
  @FieldResolver(() => Int)
  async postCount(@Root() user: User): Promise<number> {
    return this.postService.countByAuthor(user.id);
  }

  // Relation resolver
  @Resolver(() => User)
  @FieldResolver(() => [Post])
  async posts(@Root() user: User): Promise<Post[]> {
    return this.postService.findByAuthor(user.id);
  }

  // Mutation resolver
  @Mutation()
  async createUser(@Arg('input') input: CreateUserInput): Promise<User> {
    return this.userService.create(input);
  }

  // Subscription resolver (real-time)
  @Subscription()
  userCreated(): AsyncIterator<User> {
    return this.pubsub.asyncIterator('USER_CREATED');
  }
}
```

### GraphQL Query Variations

#### Queries with Arguments

```typescript
// Filter results
query {
  posts(filter: { published: true, category: "tech" }) {
    id
    title
    author {
      name
    }
  }
}

// Pagination
query {
  users(limit: 10, offset: 20) {
    id
    name
  }
}

// Sorting
query {
  posts(orderBy: { field: "CREATED_AT", direction: "DESC" }) {
    id
    title
  }
}

// Nested filtering
query {
  user(id: "1") {
    posts(filter: { published: true }) {
      comments(filter: { flagged: false }) {
        content
        author { name }
      }
    }
  }
}
```

#### Mutations

```typescript
// Single resource mutation
mutation {
  createUser(input: { name: "John", email: "john@example.com" }) {
    id
    name
    email
  }
}

// Multiple mutations in one request
mutation {
  createUser(input: { name: "John", email: "john@example.com" }) {
    id
    name
  }
  createPost(input: { title: "Hello", authorId: "1" }) {
    id
    title
  }
}

// Optimistic UI pattern
mutation {
  likePost(postId: "1") {
    id
    likesCount
    likedByMe
  }
}
```

#### Subscriptions (Real-time)

```typescript
// Real-time updates
subscription {
  postPublished(category: "tech") {
    id
    title
    author {
      name
    }
  }
}

// Listen for specific events
subscription {
  commentAdded(postId: "123") {
    id
    content
    author {
      name
      avatar
    }
  }
}

// Client implementation
import { ApolloClient, InMemoryCache, split, HttpLink, GraphQLWsLink } from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';

const httpLink = new HttpLink({ uri: '/graphql' });
const wsLink = new GraphQLWsLink(createClient({ url: 'ws://localhost:4000/graphql' }));

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLink
);

const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache()
});

// Subscribe in component
import { useSubscription } from '@apollo/client';

function PostList() {
  const { data } = useSubscription(POST_PUBLISHED_SUBSCRIPTION);

  useEffect(() => {
    if (data) {
      // Update UI with new post
      setPosts(prev => [data.postPublished, ...prev]);
    }
  }, [data]);
}
```

### Ventajas de GraphQL

```typescript
✅ Advantages:
1. No over/under-fetching - client gets exactly what it needs
2. Single round trip for complex data
3. Strong typing with schema
4. Self-documenting (introspection)
5. Great developer tooling (GraphiQL, Playground)
6. Versionless - evolve API without breaking changes
7. Real-time subscriptions built-in
8. Union types, interfaces for flexible schemas
9. Batched queries (DataLoader pattern)
```

### Desventajas de GraphQL

```typescript
❌ Disadvantages:
1. Complexity - schema design requires planning
2. Caching is harder (single endpoint)
3. HTTP caching doesn't work well
4. File uploads need special handling
5. Query complexity can cause performance issues
6. No built-in rate limiting (need depth/complexity limits)
7. POST-only for all operations (no GET requests)
8. Learning curve steeper than REST
```

---

## 3. gRPC

### Características Fundamentales

#### Protocol Buffers (ProtoBuf)

```protobuf
// User definition
syntax = "proto3";

package user;

service UserService {
  // Unary RPC - single request, single response
  rpc GetUser (GetUserRequest) returns (User);
  rpc CreateUser (CreateUserRequest) returns (User);

  // Server streaming - single request, multiple responses
  rpc ListUsers (ListUsersRequest) returns (stream User);

  // Client streaming - multiple requests, single response
  rpc CreateBulkUsers (stream CreateUserRequest) returns (CreateBulkUsersResponse);

  // Bidirectional streaming - multiple requests, multiple responses
  rpc ProcessUsers (stream ProcessUserRequest) returns (stream ProcessUserResponse);
}

message User {
  string id = 1;
  string name = 2;
  string email = 3;
  int32 age = 4;
  repeated string roles = 5;  // Array
  map<string, string> metadata = 6;  // Dictionary
  google.protobuf.Timestamp created_at = 7;
}

message GetUserRequest {
  string id = 1;
}

message CreateUserRequest {
  string name = 1;
  string email = 2;
  int32 age = 3;
}

message ListUsersRequest {
  int32 limit = 1;
  int32 offset = 2;
  string filter = 3;
}

message CreateBulkUsersResponse {
  int32 success_count = 1;
  int32 failure_count = 2;
  repeated string failure_messages = 3;
}
```

#### Code Generation

```bash
# Generate from .proto file
npx grpc_tools_node_protoc \
  --js_out=import_style=commonjs:dist \
  --grpc_out=dist \
  --plugin=protoc-gen-grpc=`which grpc_node_plugin` \
  --proto_path=proto \
  proto/user.proto

# Generates:
# - dist/user_pb.js (message types)
# - dist/user_grpc_pb.js (service definitions)
```

#### Server Implementation

```typescript
import { UserServiceService, UserServiceHandlers } from './user_grpc_pb';

export class UserGrpcService implements UserServiceHandlers {
  constructor(private userService: UserService) {}

  // Unary RPC
  async getUser(
    call: ServerUnaryCall<GetUserRequest, User>,
    callback: sendUnaryData<User>
  ): Promise<void> {
    try {
      const { id } = call.request;
      const user = await this.userService.findById(id);

      if (!user) {
        callback(
          {
            code: grpc.status.NOT_FOUND,
            message: 'User not found'
          },
          null
        );
        return;
      }

      callback(null, this.mapToProtoUser(user));
    } catch (error) {
      callback(
        {
          code: grpc.status.INTERNAL,
          message: error.message
        },
        null
      );
    }
  }

  // Server streaming RPC
  async listUsers(
    call: ServerWritableStream<ListUsersRequest, User>
  ): Promise<void> {
    const { limit, offset, filter } = call.request;

    const users = await this.userService.findAll({
      limit,
      offset,
      filter
    });

    for (const user of users) {
      call.write(this.mapToProtoUser(user));
    }

    call.end();
  }

  // Client streaming RPC
  async createBulkUsers(
    call: ServerReadableStream<CreateUserRequest, CreateBulkUsersResponse>,
    callback: sendUnaryData<CreateBulkUsersResponse>
  ): Promise<void> {
    let successCount = 0;
    let failureCount = 0;
    const failureMessages: string[] = [];

    for await (const request of call) {
      try {
        await this.userService.create({
          name: request.getName(),
          email: request.getEmail(),
          age: request.getAge()
        });
        successCount++;
      } catch (error) {
        failureCount++;
        failureMessages.push(error.message);
      }
    }

    const response = new CreateBulkUsersResponse();
    response.setSuccessCount(successCount);
    response.setFailureCount(failureCount);
    response.setFailureMessagesList(failureMessages);

    callback(null, response);
  }

  // Bidirectional streaming RPC
  async processUsers(
    call: ServerDuplexStream<ProcessUserRequest, ProcessUserResponse>
  ): Promise<void> {
    for await (const request of call) {
      const userId = request.getUserId();
      const action = request.getAction();

      try {
        switch (action) {
          case 'VALIDATE':
            const isValid = await this.userService.validate(userId);
            const response = new ProcessUserResponse();
            response.setUserId(userId);
            response.setSuccess(true);
            response.setResult(JSON.stringify({ isValid }));
            call.write(response);
            break;

          case 'ENABLE':
            await this.userService.enable(userId);
            const enableResponse = new ProcessUserResponse();
            enableResponse.setUserId(userId);
            enableResponse.setSuccess(true);
            enableResponse.setResult('User enabled');
            call.write(enableResponse);
            break;
        }
      } catch (error) {
        const errorResponse = new ProcessUserResponse();
        errorResponse.setUserId(userId);
        errorResponse.setSuccess(false);
        errorResponse.setResult(error.message);
        call.write(errorResponse);
      }
    }
  }

  private mapToProtoUser(user: User): User {
    const protoUser = new User();
    protoUser.setId(user.id);
    protoUser.setName(user.name);
    protoUser.setEmail(user.email);
    protoUser.setAge(user.age);
    protoUser.setRolesList(user.roles);
    protoUser.setCreatedAt(Timestamp.fromDate(new Date(user.createdAt)));
    return protoUser;
  }
}
```

#### Client Implementation

```typescript
import { UserServiceClient } from './user_grpc_pb';
import * as grpc from '@grpc/grpc-js';

class UserGrpcClient {
  private client: UserServiceClient;

  constructor() {
    this.client = new UserServiceClient(
      'localhost:50051',
      grpc.credentials.createInsecure()
    );
  }

  // Unary call
  async getUser(id: string): Promise<User | null> {
    return new Promise((resolve, reject) => {
      const request = new GetUserRequest();
      request.setId(id);

      this.client.getUser(request, (error, response) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(this.mapFromProtoUser(response));
      });
    });
  }

  // Server streaming call
  async *listUsers(limit: number = 10): AsyncIterable<User> {
    const request = new ListUsersRequest();
    request.setLimit(limit);

    const stream = this.client.listUsers(request);

    return {
      [Symbol.asyncIterator]: () => {
        return {
          next: (): Promise<IteratorResult<User>> => {
            return new Promise((resolve) => {
              stream.once('data', (user: User) => {
                resolve({ value: this.mapFromProtoUser(user), done: false });
              });

              stream.once('end', () => {
                resolve({ value: undefined, done: true });
              });

              stream.once('error', (error) => {
                reject(error);
              });
            });
          }
        };
      }
    } as AsyncIterable<User>;
  }

  // Client streaming call
  async createBulkUsers(users: CreateUserInput[]): Promise<BulkResult> {
    return new Promise((resolve, reject) => {
      const request = new CreateBulkUsersResponse();
      const stream = this.client.createBulkUsers((error, response) => {
        if (error) {
          reject(error);
          return;
        }
        resolve({
          successCount: response.getSuccessCount(),
          failureCount: response.getFailureCount(),
          failureMessages: response.getFailureMessagesList()
        });
      });

      users.forEach(user => {
        const request = new CreateUserRequest();
        request.setName(user.name);
        request.setEmail(user.email);
        request.setAge(user.age);
        stream.write(request);
      });

      stream.end();
    });
  }

  // Bidirectional streaming call
  async processUsersStream(
    operations: ProcessOperation[]
  ): Promise<ProcessResult[]> {
    return new Promise((resolve, reject) => {
      const stream = this.client.processUsers();

      const results: ProcessResult[] = [];

      stream.on('data', (response: ProcessUserResponse) => {
        results.push({
          userId: response.getUserId(),
          success: response.getSuccess(),
          result: response.getResult()
        });
      });

      stream.on('end', () => resolve(results));
      stream.on('error', (error) => reject(error));

      operations.forEach(op => {
        const request = new ProcessUserRequest();
        request.setUserId(op.userId);
        request.setAction(op.action);
        stream.write(request);
      });

      stream.end();
    });
  }
}
```

### Ventajas de gRPC

```typescript
✅ Advantages:
1. Very high performance (binary Protocol Buffers)
2. Built-in code generation from IDL
3. Strong typing (compile-time safety)
4. Streaming support (4 types)
5. Bidirectional streaming
6. Efficient serialization
7. Built-in authentication (TLS)
8. Load balancing built-in
9. Multi-language support
10. Protocol buffers are backward compatible
```

### Desventajas de gRPC

```typescript
❌ Disadvantages:
1. Binary format (not human-readable)
2. Browser support limited (need gRPC-Web)
3. Steeper learning curve (proto files, streaming)
4. Less tool support compared to REST
5. Harder to debug (can't use curl easily)
6. Not all HTTP features available
7. Requires .proto files and code generation
8. No built-in caching
```

---

## Comparison Matrix

### Performance

| Aspect | REST | GraphQL | gRPC |
|--------|------|---------|------|
| **Serialization** | JSON (text) | JSON (text) | Protocol Buffers (binary) |
| **Speed** | Medium | Medium | Very Fast |
| **Payload Size** | Larger | Variable | Small |
| **Network Overhead** | Medium | Medium | Low |
| **Benchmark** | 10K req/s | 8K req/s | 50K req/s |

### Flexibility

| Aspect | REST | GraphQL | gRPC |
|--------|------|---------|------|
| **Client Control** | Low | Very High | Medium |
| **Response Format** | Fixed | Customizable | Fixed |
| **Schema Evolution** | Versioning | Schema changes | Backward compatible |
| **Real-time** | WebSockets separate | Subscriptions built-in | Streaming built-in |
| **Caching** | Excellent | Limited | No built-in |

### Development Experience

| Aspect | REST | GraphQL | gRPC |
|--------|------|---------|------|
| **Learning Curve** | Gentle | Moderate | Steep |
| **Documentation** | OpenAPI | Introspection | .proto files |
| **Tooling** | Extensive | Good | Limited |
| **Debugging** | Easy (curl, browser) | GraphiQL, Playground | Harder (binary) |
| **Code Generation** | Optional | Optional | Required |
| **Testing** | Established patterns | Need GraphQL testing | Established patterns |

---

## Decision Guide

### Use REST When:

```typescript
// ✅ Best for:
- CRUD operations on resources
- Simple data models
- Need HTTP caching
- Broad client compatibility (browsers, mobile)
- Public APIs
- Simple, well-defined use cases
- Team is familiar with REST

// Examples:
- User management API
- Product catalog
- Blog posts API
- Simple CRUD operations
```

### Use GraphQL When:

```typescript
// ✅ Best for:
- Complex data relationships
- Different clients need different data
- Want to avoid multiple REST requests
- Need real-time subscriptions
- Strongly typed schema is valuable
- Data-driven applications
- Mobile apps with limited bandwidth

// Examples:
- Social media feeds (complex nested data)
- Dashboards with various widgets
- Mobile apps (reduce network requests)
- Content management systems
```

### Use gRPC When:

```typescript
// ✅ Best for:
- Microservices communication
- High-performance requirements
- Real-time bidirectional communication
- Strongly typed contracts
- Internal services (not public APIs)
- Need streaming (server/client/bidirectional)
- Polyglot architecture

// Examples:
- Microservices data pipeline
- Real-time video streaming
- Multiplayer game backend
- High-frequency trading systems
- IoT device communication
```

---

## Migration Strategies

### REST → GraphQL

```typescript
// Step 1: Analyze existing REST endpoints
const restEndpoints = [
  { path: '/users', method: 'GET', response: [...] },
  { path: '/users/:id', method: 'GET', response: {...} },
  { path: '/users/:id/posts', method: 'GET', response: [...] }
];

// Step 2: Create GraphQL schema from REST
const schema = `#graphql
  type Query {
    users: [User]
    user(id: ID!): User
  }
  type User {
    id: ID!
    name: String!
    posts: [Post]
  }
`;

// Step 3: Implement resolvers that call REST
const resolvers = {
  Query: {
    users: async () => {
      const response = await fetch('/api/users');
      return response.json();
    },
    user: async (_, { id }) => {
      const response = await fetch(`/api/users/${id}`);
      return response.json();
    }
  },
  User: {
    posts: async (parent) => {
      const response = await fetch(`/api/users/${parent.id}/posts`);
      return response.json();
    }
  }
};
```

### REST → gRPC

```typescript
// Step 1: Define proto file based on REST API
// proto/user_service.proto
service UserService {
  rpc ListUsers (ListUsersRequest) returns (ListUsersResponse);
  rpc GetUser (GetUserRequest) returns (User);
  rpc CreateUser (CreateUserRequest) returns (User);
}

// Step 2: Migrate REST handlers to gRPC service
class UserGrpcService {
  // Convert REST handler to gRPC
  async getUser(call) {
    const user = await User.findById(call.request.id);
    return this.mapToProto(user);
  }
}
```

---

**Estado**: Comparación completa de tipos de APIs
**REST**: Resource-based, HTTP verbs, stateless, caching
**GraphQL**: Single endpoint, client-driven, strongly typed
**gRPC**: Protocol Buffers, high performance, streaming
**Decisión**: Guide para elegir tipo apropiado
