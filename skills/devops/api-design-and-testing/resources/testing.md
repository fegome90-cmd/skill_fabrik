# API Testing Strategies - Estrategias de Testing para APIs

## Tipos de Testing para APIs

Esta guía cubre estrategias comprehensivas de testing para APIs REST, GraphQL y gRPC.

---

## 1. Testing Pyramid

### Principio: Múltiples Niveles de Testing

```
        /\
       /  \
      / E2E \          ← Few, slow, high-value
     /______\
    /        \
   /Integration\    ← Moderate, test interactions
  /____________\
 /               \
/   Unit Tests   \ ← Many, fast, low-level
/________________\
```

#### Unit Tests

```typescript
// ✅ Test business logic in isolation
import { UserService } from '../services/user.service';
import { UserRepository } from '../repositories/user.repository';

describe('UserService', () => {
  let userService: UserService;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockUserRepository = {
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    } as any;

    userService = new UserService(mockUserRepository);
  });

  it('should create user with valid data', async () => {
    // Arrange
    const userData = {
      name: 'John',
      email: 'john@example.com',
      age: 30
    };
    mockUserRepository.create.mockResolvedValue({ id: '1', ...userData });

    // Act
    const result = await userService.create(userData);

    // Assert
    expect(result.id).toBe('1');
    expect(result.name).toBe('John');
    expect(result.email).toBe('john@example.com');
    expect(mockUserRepository.create).toHaveBeenCalledWith(userData);
  });

  it('should throw error for invalid email', async () => {
    // Arrange
    const invalidData = {
      name: 'John',
      email: 'invalid-email',
      age: 30
    };

    // Act & Assert
    await expect(userService.create(invalidData))
      .rejects
      .toThrow('Invalid email format');
  });

  it('should validate age is positive', async () => {
    // Arrange
    const invalidData = {
      name: 'John',
      email: 'john@example.com',
      age: -5
    };

    // Act & Assert
    await expect(userService.create(invalidData))
      .rejects
      .toThrow('Age must be positive');
  });
});
```

#### Integration Tests

```typescript
// ✅ Test API endpoints with real dependencies
import request from 'supertest';
import { app } from '../app';
import { setupTestDB, cleanupTestDB } from './test-utils';

describe('Users API Integration Tests', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await cleanupTestDB();
  });

  describe('POST /api/users', () => {
    it('should create user with valid data', async () => {
      // Arrange
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      };

      // Act
      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);

      // Assert
      expect(response.body.data).toMatchObject({
        name: userData.name,
        email: userData.email,
        age: userData.age
      });
      expect(response.body.data.id).toBeDefined();
      expect(response.body.meta.timestamp).toBeDefined();
    });

    it('should return 422 for invalid email', async () => {
      // Arrange
      const invalidData = {
        name: 'John Doe',
        email: 'invalid-email',
        age: 30
      };

      // Act
      const response = await request(app)
        .post('/api/users')
        .send(invalidData)
        .expect(422);

      // Assert
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details).toContainEqual(
        expect.objectContaining({
          field: 'email',
          message: expect.stringContaining('email')
        })
      );
    });

    it('should return 409 for duplicate email', async () => {
      // Arrange
      const userData = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        age: 25
      };

      // Create user first
      await request(app).post('/api/users').send(userData);

      // Act - Try to create same email
      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(409);

      // Assert
      expect(response.body.error.code).toBe('CONFLICT');
      expect(response.body.error.message)
        .toContain('already exists');
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return user when exists', async () => {
      // Arrange - Create user
      const createResponse = await request(app)
        .post('/api/users')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          age: 25
        })
        .expect(201);

      const userId = createResponse.body.data.id;

      // Act
      const response = await request(app)
        .get(`/api/users/${userId}`)
        .expect(200);

      // Assert
      expect(response.body.data.id).toBe(userId);
      expect(response.body.data.name).toBe('Test User');
    });

    it('should return 404 when user not found', async () => {
      // Act
      const response = await request(app)
        .get('/api/users/nonexistent')
        .expect(404);

      // Assert
      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(response.body.error.message)
        .toContain('not found');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete user successfully', async () => {
      // Arrange - Create user
      const createResponse = await request(app)
        .post('/api/users')
        .send({
          name: 'To Delete',
          email: 'delete@example.com',
          age: 30
        })
        .expect(201);

      const userId = createResponse.body.data.id;

      // Act
      await request(app)
        .delete(`/api/users/${userId}`)
        .expect(204);

      // Assert - Verify deleted
      await request(app)
        .get(`/api/users/${userId}`)
        .expect(404);
    });

    it('should be idempotent', async () => {
      // Arrange - Create and delete user
      const createResponse = await request(app)
        .post('/api/users')
        .send({
          name: 'Idempotent',
          email: 'idem@example.com',
          age: 30
        })
        .expect(201);

      const userId = createResponse.body.data.id;

      // Delete twice
      await request(app).delete(`/api/users/${userId}`).expect(204);
      await request(app).delete(`/api/users/${userId}`).expect(204);
    });
  });
});
```

#### End-to-End Tests

```typescript
// ✅ Test complete user journeys
import { test, expect } from '@playwright/test';

test.describe('User Management E2E', () => {
  test('complete user registration and management flow', async ({ page }) => {
    // Navigate to registration page
    await page.goto('/register');

    // Fill form
    await page.fill('[name="name"]', 'E2E Test User');
    await page.fill('[name="email"]', 'e2e@example.com');
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.click('[type="submit"]');

    // Verify success
    await expect(page.locator('[data-testid="success-message"]'))
      .toContainText('Registration successful');

    // Navigate to user profile
    await page.click('[data-testid="profile-link"]');

    // Update profile
    await page.fill('[name="bio"]', 'Updated bio');
    await page.click('[data-testid="save-profile"]');

    // Verify update
    await expect(page.locator('[data-testid="profile-bio"]'))
      .toContainText('Updated bio');

    // Delete account
    await page.click('[data-testid="delete-account"]');
    await page.click('[data-testid="confirm-delete"]');

    // Verify deletion (redirected to login or homepage)
    await expect(page).toHaveURL(/(\/login|\/)/);
  });
});
```

---

## 2. Contract Testing

### Principio: Verificar API Schemas

#### Pact Testing

```typescript
// ✅ Consumer test (client defines expectations)
import { Pact } from '@pact-foundation/pact';
import { UserClient } from '../client';

describe('User Service Pact', () => {
  const provider = new Pact({
    consumer: 'user-frontend',
    provider: 'user-service',
    port: 1234
  });

  beforeAll(() => provider.setup());
  afterEach(() => provider.verify());
  afterAll(() => provider.finalize());

  it('should fetch user by id', async () => {
    // Arrange
    const expectedUser = {
      id: '123',
      name: 'Test User',
      email: 'test@example.com'
    };

    await provider
      .uponReceiving('a request to get user by id')
      .withRequest({
        method: 'GET',
        path: '/api/users/123',
        headers: {
          Accept: 'application/json'
        }
      })
      .willRespondWith({
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        },
        body: expectedUser
      });

    // Act
    const userClient = new UserClient('http://localhost:1234');
    const user = await userClient.getUser('123');

    // Assert
    expect(user).toEqual(expectedUser);
  });

  it('should create user', async () => {
    // Arrange
    const userRequest = {
      name: 'New User',
      email: 'new@example.com'
    };

    const expectedResponse = {
      id: '456',
      ...userRequest
    };

    await provider
      .uponReceiving('a request to create user')
      .withRequest({
        method: 'POST',
        path: '/api/users',
        headers: {
          'Content-Type': 'application/json'
        },
        body: userRequest
      })
      .willRespondWith({
        status: 201,
        headers: {
          'Content-Type': 'application/json',
          Location: '/api/users/456'
        },
        body: expectedResponse
      });

    // Act
    const userClient = new UserClient('http://localhost:1234');
    const user = await userClient.createUser(userRequest);

    // Assert
    expect(user).toEqual(expectedResponse);
  });
});

// Provider test (server verifies contract)
import { verifier } from '@pact-foundation/pact';

describe('User Service Provider', () => {
  it('should validate consumer expectations', async () => {
    // Start server in test mode
    const app = require('../app').default;
    const server = require('supertest')(app);

    // Verify with Pact broker
    await verifier.verifyProvider({
      providerBaseUrl: 'http://localhost:3000',
      pactBrokerUrl: 'https://pact-broker.example.com',
      provider: 'user-service',
      consumerVersionTag: 'main'
    });
  });
});
```

#### OpenAPI Schema Validation

```typescript
// ✅ Validate responses against OpenAPI schema
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import schema from './openapi.json';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

const validate = ajv.compile(schema);

describe('API Schema Validation', () => {
  it('should validate GET /users response', async () => {
    const response = await request(app).get('/api/users');
    const data = response.body;

    const valid = validate(data);

    if (!valid) {
      console.error('Schema validation errors:', validate.errors);
    }

    expect(valid).toBe(true);
  });

  it('should validate POST /users request', async () => {
    const invalidData = {
      name: 'John',
      email: 'invalid-email'  // Invalid format
    };

    await request(app)
      .post('/api/users')
      .send(invalidData)
      .expect(422);
  });
});
```

---

## 3. GraphQL Testing

### Unit Testing Resolvers

```typescript
// ✅ Test GraphQL resolvers
import { UserResolver } from '../resolvers/user.resolver';
import { UserService } from '../services/user.service';

describe('UserResolver', () => {
  let userResolver: UserResolver;
  let mockUserService: jest.Mocked<UserService>;

  beforeEach(() => {
    mockUserService = {
      findById: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    } as any;

    userResolver = new UserResolver(mockUserService);
  });

  describe('Query', () => {
    it('should return user by id', async () => {
      // Arrange
      const mockUser = {
        id: '1',
        name: 'John',
        email: 'john@example.com'
      };
      mockUserService.findById.mockResolvedValue(mockUser);

      // Act
      const result = await userResolver.user(null, { id: '1' });

      // Assert
      expect(result).toEqual(mockUser);
      expect(mockUserService.findById).toHaveBeenCalledWith('1');
    });

    it('should return null when user not found', async () => {
      // Arrange
      mockUserService.findById.mockResolvedValue(null);

      // Act
      const result = await userResolver.user(null, { id: '999' });

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('Mutation', () => {
    it('should create user with valid input', async () => {
      // Arrange
      const input = {
        name: 'Jane',
        email: 'jane@example.com'
      };
      const mockUser = {
        id: '2',
        ...input
      };
      mockUserService.create.mockResolvedValue(mockUser);

      // Act
      const result = await userResolver.createUser(input);

      // Assert
      expect(result).toEqual(mockUser);
      expect(mockUserService.create).toHaveBeenCalledWith(input);
    });

    it('should throw error for invalid email', async () => {
      // Arrange
      const input = {
        name: 'Invalid',
        email: 'not-an-email'
      };
      mockUserService.create.mockRejectedValue(
        new Error('Invalid email format')
      );

      // Act & Assert
      await expect(userResolver.createUser(input))
        .rejects
        .toThrow('Invalid email format');
    });
  });
});
```

#### Integration Testing with Apollo

```typescript
// ✅ Test GraphQL with Apollo Server
import { ApolloServer } from '@apollo/server';
import { buildSchema } from 'graphql';
import request from 'supertest';
import { typeDefs } from '../schema';
import { resolvers } from '../resolvers';

describe('GraphQL Integration Tests', () => {
  let server: ApolloServer;

  beforeAll(async () => {
    server = new ApolloServer({
      typeDefs,
      resolvers
    });
    await server.start();
  });

  afterAll(async () => {
    await server.stop();
  });

  describe('Query', () => {
    it('should fetch user', async () => {
      // Arrange
      const query = `
        query GetUser($id: ID!) {
          user(id: $id) {
            id
            name
            email
          }
        }
      `;
      const variables = { id: '1' };

      // Act
      const response = await request(`http://localhost:${server.port}`)
        .post('/graphql')
        .send({ query, variables })
        .expect(200);

      // Assert
      expect(response.body.data.user).toMatchObject({
        id: '1',
        name: expect.any(String),
        email: expect.any(String)
      });
    });

    it('should fetch all users', async () => {
      // Arrange
      const query = `
        query {
          users {
            id
            name
            email
          }
        }
      `;

      // Act
      const response = await request(`http://localhost:${server.port}`)
        .post('/graphql')
        .send({ query })
        .expect(200);

      // Assert
      expect(response.body.data.users).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            name: expect.any(String),
            email: expect.any(String)
          })
        ])
      );
    });
  });

  describe('Mutation', () => {
    it('should create user', async () => {
      // Arrange
      const mutation = `
        mutation CreateUser($input: CreateUserInput!) {
          createUser(input: $input) {
            id
            name
            email
          }
        }
      `;
      const variables = {
        input: {
          name: 'New User',
          email: 'new@example.com'
        }
      };

      // Act
      const response = await request(`http://localhost:${server.port}`)
        .post('/graphql')
        .send({ query: mutation, variables })
        .expect(200);

      // Assert
      expect(response.body.data.createUser).toMatchObject({
        name: 'New User',
        email: 'new@example.com'
      });
      expect(response.body.data.createUser.id).toBeDefined();
    });
  });

  describe('Subscription', () => {
    it('should receive userCreated events', async () => {
      // This test would use WebSocket connection
      // Example with graphql-ws or subscriptions-transport-ws
      const wsClient = createWSClient('ws://localhost:4000/graphql');

      const subscription = wsClient.subscribe({
        query: 'subscription { userCreated { id name email } }'
      });

      // Create user (triggers subscription)
      const mutation = `
        mutation {
          createUser(input: { name: "Sub Test", email: "sub@example.com" }) {
            id
          }
        }
      `;
      await request(`http://localhost:${server.port}`)
        .post('/graphql')
        .send({ query: mutation });

      // Wait for subscription event
      const event = await new Promise((resolve) => {
        subscription.subscribe({
          next: (data) => resolve(data),
          error: (err) => console.error(err),
          complete: () => {}
        });
      });

      expect(event.data.userCreated.name).toBe('Sub Test');
    });
  });
});
```

---

## 4. gRPC Testing

### Unit Testing Services

```typescript
// ✅ Test gRPC service handlers
import { UserServiceHandlers } from '../../proto/user';
import { UserService } from '../user.service';

describe('UserGrpcService', () => {
  let mockUserService: jest.Mocked<UserService>;
  let service: UserServiceHandlers;

  beforeEach(() => {
    mockUserService = {
      findById: jest.fn(),
      create: jest.fn(),
      findAll: jest.fn()
    } as any;

    service = new UserGrpcService(mockUserService);
  });

  describe('GetUser', () => {
    it('should return user when found', async () => {
      // Arrange
      const mockUser = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com'
      };
      mockUserService.findById.mockResolvedValue(mockUser);

      const call = {
        request: {
          getId: () => '1'
        }
      };

      const callback = jest.fn();

      // Act
      await service.getUser(call, callback);

      // Assert
      expect(mockUserService.findById).toHaveBeenCalledWith('1');
      expect(callback).toHaveBeenCalledWith(
        null,  // error
        expect.objectContaining({
          getId: expect.any(Function),
          getName: expect.any(Function),
          getEmail: expect.any(Function)
        })
      );
    });

    it('should return error when user not found', async () => {
      // Arrange
      mockUserService.findById.mockResolvedValue(null);

      const call = {
        request: {
          getId: () => '999'
        }
      };

      const callback = jest.fn();

      // Act
      await service.getUser(call, callback);

      // Assert
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 404,
          message: 'User not found'
        }),
        null
      );
    });
  });

  describe('CreateUser', () => {
    it('should create user with valid data', async () => {
      // Arrange
      const mockUser = {
        id: '2',
        name: 'New User',
        email: 'new@example.com'
      };
      mockUserService.create.mockResolvedValue(mockUser);

      const call = {
        request: {
          getName: () => 'New User',
          getEmail: () => 'new@example.com'
        }
      };

      const callback = jest.fn();

      // Act
      await service.createUser(call, callback);

      // Assert
      expect(mockUserService.create).toHaveBeenCalledWith({
        name: 'New User',
        email: 'new@example.com'
      });
      expect(callback).toHaveBeenCalledWith(
        null,
        expect.objectContaining({
          getId: expect.any(Function),
          getName: expect.any(Function),
          getEmail: expect.any(Function)
        })
      );
    });
  });
});
```

#### Integration Testing with gRPC

```typescript
// ✅ Test gRPC client-server integration
import * as grpc from '@grpc/grpc-js';
import { UserServiceClient } from '../client';
import { startTestServer } from './test-utils';

describe('gRPC User Service Integration', () => {
  let server: grpc.Server;
  let client: UserServiceClient;

  beforeAll(async () => {
    const { port, serverInstance } = await startTestServer();
    server = serverInstance;
    client = new UserServiceClient(
      `localhost:${port}`,
      grpc.credentials.createInsecure()
    );
  });

  afterAll(async () => {
    await server.forceShutdown();
  });

  describe('Unary RPC', () => {
    it('should get user by id', (done) => {
      // Arrange
      const request = new GetUserRequest();
      request.setId('1');

      // Act
      const call = client.getUser(request);

      // Assert
      call.on('data', (response: User) => {
        expect(response.getId()).toBe('1');
        expect(response.getName()).toBe('Test User');
        done();
      });

      call.on('error', (error) => {
        done(error);
      });

      call.on('end', () => {
        // Request completed
      });
    });

    it('should create user', (done) => {
      // Arrange
      const request = new CreateUserRequest();
      request.setName('Integration Test');
      request.setEmail('integration@example.com');

      // Act
      const call = client.createUser(request);

      // Assert
      call.on('data', (response: User) => {
        expect(response.getName()).toBe('Integration Test');
        expect(response.getEmail()).toBe('integration@example.com');
        expect(response.getId()).toBeDefined();
        done();
      });

      call.on('error', (error) => {
        done(error);
      });
    });
  });

  describe('Server Streaming RPC', () => {
    it('should list multiple users', (done) => {
      // Arrange
      const request = new ListUsersRequest();
      request.setLimit(5);

      const users: User[] = [];

      // Act
      const call = client.listUsers(request);

      // Assert
      call.on('data', (user: User) => {
        users.push(user);
      });

      call.on('end', () => {
        expect(users.length).toBeGreaterThan(0);
        expect(users.length).toBeLessThanOrEqual(5);
        done();
      });

      call.on('error', (error) => {
        done(error);
      });
    });
  });

  describe('Client Streaming RPC', () => {
    it('should create multiple users', (done) => {
      // Arrange
      const request = new CreateUserRequest();
      request.setName('Bulk User');
      request.setEmail('bulk@example.com');

      // Act
      const call = client.createBulkUsers((error, response) => {
        // Assert
        expect(error).toBeNull();
        expect(response.getSuccessCount()).toBe(2);
        expect(response.getFailureCount()).toBe(0);
        done();
      });

      // Send multiple requests
      call.write(request);
      request.setName('Bulk User 2');
      call.write(request);

      call.end();
    });
  });

  describe('Bidirectional Streaming RPC', () => {
    it('should process users bidirectionally', (done) => {
      // Arrange
      const results: ProcessUserResponse[] = [];
      const request = new ProcessUserRequest();

      // Act
      const call = client.processUsers();

      call.on('data', (response: ProcessUserResponse) => {
        results.push(response);
        if (results.length >= 2) {
          // Assert
          expect(results[0].getSuccess()).toBe(true);
          done();
        }
      });

      call.on('error', (error) => {
        done(error);
      });

      // Send requests
      request.setUserId('1');
      request.setAction('VALIDATE');
      call.write(request);

      request.setUserId('2');
      request.setAction('ENABLE');
      call.write(request);

      call.end();
    });
  });
});
```

---

## 5. Performance Testing

### Load Testing with k6

```javascript
// ✅ Test API under load
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 200 },  // Ramp up to 200 users
    { duration: '5m', target: 200 },  // Stay at 200 users
    { duration: '2m', target: 0 }     // Ramp down
  ]
};

export default function() {
  // Test GET /users
  const getUsers = http.get('http://localhost:3000/api/users');
  check(getUsers, {
    'GET /users status is 200': (r) => r.status === 200,
    'GET /users has data': (r) => JSON.parse(r.body).data.length > 0
  });

  sleep(1);

  // Test POST /users
  const createUser = http.post(
    'http://localhost:3000/api/users',
    JSON.stringify({
      name: `User ${Math.random()}`,
      email: `test${Math.random()}@example.com`
    }),
    {
      headers: { 'Content-Type': 'application/json' }
    }
  );

  check(createUser, {
    'POST /users status is 201': (r) => r.status === 201,
    'POST /users returns user id': (r) => {
      const userId = JSON.parse(r.body).data.id;
      return userId !== undefined;
    }
  });

  sleep(1);
}
```

#### k6 Results

```bash
# Run load test
k6 run load-test.js

# Results
     data_received.............. 2.3 MB
     data_sent................. 512 KB
     http_req_blocked.......... avg=12ms   min=0      max=245ms   med=1ms    p(95)=45ms   p(99)=150ms
     http_req_connecting....... avg=8ms    min=0      max=220ms   med=1ms    p(95)=30ms   p(99)=120ms

     http_req_duration......... avg=156ms  min=85ms   max=1200ms  med=120ms  p(95)=380ms  p(99)=750ms

     http_req_receiving........ avg=2ms    min=0      max=50ms    med=1ms    p(95)=8ms    p(99)=25ms
     http_req_sending.......... avg=1ms    min=0      max=25ms    med=0ms    p(95)=5ms    p(99)=15ms
     http_req_waiting.......... avg=153ms  min=85ms   max=1200ms  med=118ms  p(95)=370ms  p(99)=745ms

     http_reqs................. 5,420
     checks.................... 10,840

     vus....................... 200
     vus_max................... 200
```

---

## 6. Test Utilities

### Test Database Setup

```typescript
// ✅ Common test utilities
import { setupTestDB, cleanupTestDB, seedTestData } from './test-utils';

describe('API Tests', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  beforeEach(async () => {
    await seedTestData();
  });

  afterEach(async () => {
    await cleanupTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });
});

// test-utils.ts
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer: MongoMemoryServer;

export async function setupTestDB() {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  await mongoose.connect(uri);
}

export async function cleanupTestDB() {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
}

export async function seedTestData() {
  const User = mongoose.model('User');
  await User.create([
    { name: 'Test User 1', email: 'test1@example.com' },
    { name: 'Test User 2', email: 'test2@example.com' }
  ]);
}

export async function closeTestDB() {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
}
```

#### HTTP Test Client

```typescript
// ✅ Common HTTP test helpers
import request from 'supertest';

class ApiTester {
  constructor(private app: any) {}

  get(endpoint: string) {
    return request(this.app).get(endpoint);
  }

  post(endpoint: string, data?: any) {
    return request(this.app)
      .post(endpoint)
      .send(data);
  }

  put(endpoint: string, data?: any) {
    return request(this.app)
      .put(endpoint)
      .send(data);
  }

  patch(endpoint: string, data?: any) {
    return request(this.app)
      .patch(endpoint)
      .send(data);
  }

  delete(endpoint: string) {
    return request(this.app).delete(endpoint);
  }

  // Auth helpers
  authenticate(userId: string) {
    const token = this.generateJWT(userId);
    return this.authenticatedRequest(token);
  }

  private authenticatedRequest(token: string) {
    const authReq = request(this.app).get.bind(request(this.app));
    return {
      ...authReq('/'),
      set: function (header: string, value: string) {
        request.Test.prototype.set.call(this, header, value);
        return this;
      }
    };
  }
}

// Usage
describe('Users API', () => {
  const api = new ApiTester(app);

  it('should create user', async () => {
    const response = await api.post('/api/users', {
      name: 'John',
      email: 'john@example.com'
    }).expect(201);

    expect(response.body.data.id).toBeDefined();
  });

  it('should require authentication', async () => {
    await api.get('/api/profile').expect(401);
  });

  it('should access protected route', async () => {
    const response = await api
      .authenticate('user-id')
      .get('/api/profile');

    expect(response.body.data.id).toBe('user-id');
  });
});
```

---

**Estado**: Estrategias de testing completadas
**Testing Pyramid**: Unit, Integration, E2E tests
**Contract Testing**: Pact, OpenAPI schema validation
**GraphQL Testing**: Resolver testing, integration testing, subscriptions
**gRPC Testing**: Service handlers, streaming RPCs
**Performance**: Load testing con k6
**Test Utils**: Database setup, HTTP clients, authentication helpers
