# API Design Principles - Principios de Diseño de APIs

## Principios Fundamentales

Esta guía establece los principios fundamentales para diseñar APIs robustas, consistentes y mantenibles.

---

## 1. Resource-Based Design

### Principio: Todo es un Recurso

```typescript
// ✅ Good: Resource-based URLs
/api/v1/users
/api/v1/users/{id}
/api/v1/orders
/api/v1/orders/{id}/items

// ❌ Bad: Action-based URLs
/api/v1/getUser
/api/v1/createUser
/api/v1/updateUser
/api/v1/deleteUser
```

### Resource Hierarchy

```typescript
// Nested resources for relationships
/users/{id}/posts              // Posts belonging to user
/users/{id}/posts/{postId}     // Specific post of user
/users/{id}/posts/{postId}/comments  // Comments on that post

// ✅ Good: Reflects ownership relationship
GET /users/123/posts           // Get all posts by user 123
POST /users/123/posts          // Create new post for user 123
GET /users/123/posts/456       // Get specific post 456 by user 123

// ❌ Bad: Flat structure without relationships
GET /users/123
GET /posts?userId=123          // No relationship in URL

// Alternative: Use query parameters for filtering
GET /posts?authorId=123        // Filter posts by author
GET /posts?status=published    // Filter by status
```

### Resource Naming Best Practices

```typescript
// ✅ Use plural nouns consistently
/users
/products
/orders
/items

// ✅ Use hierarchical relationships
/companies/{id}/employees
/companies/{id}/departments/{deptId}/employees

// ✅ Use sub-collections for related resources
/users/{id}/settings
/users/{id}/preferences
/users/{id}/activities

// ❌ Avoid
/userList              // Should be /users
/getAllUsers           // Should be /users
/customerInfo          // Should be /customers
/userUpdate            // Should use HTTP verb PATCH /users/{id}
```

---

## 2. HTTP Methods Semantics

### Principio: Usar Verbos HTTP Correctamente

#### GET - Retrieve Resource

```typescript
// ✅ Good: GET retrieves data
GET /users                    // List all users
GET /users/123                // Get specific user
GET /users/123/posts          // Get user's posts
GET /users?age=30             // Filter users
GET /users?sort=name&order=asc  // Sort users

// Must be idempotent and safe
// ✅ Idempotent: Multiple calls = same result
GET /users/123
GET /users/123  // Same result

// ❌ Don't use GET for operations that change state
GET /users/123/activate  // ❌ This modifies state!
```

#### POST - Create Resource

```typescript
// ✅ Good: POST creates new resource
POST /users
// Body: { "name": "John", "email": "john@example.com" }

POST /users/123/posts
// Body: { "title": "My Post", "content": "..." }

// Creates new resource each time (not idempotent)
POST /users
// Creates User #1

POST /users
// Creates User #2 (different resource)

// ✅ Return created resource
app.post('/users', async (req, res) => {
  const user = await User.create(req.body);

  // Return 201 Created with Location header
  res.status(201)
     .location(`/users/${user.id}`)
     .json({ data: user });
});
```

#### PUT - Replace Resource

```typescript
// ✅ Good: PUT replaces entire resource
PUT /users/123
// Body: { "name": "John", "email": "john@example.com", "age": 30 }

// Must send complete resource (all fields)
app.put('/users/:id', async (req, res) => {
  // All fields required
  const { name, email, age } = req.body;

  const user = await User.update(req.params.id, {
    name, email, age
  });

  res.json({ data: user });
});

// Idempotent: Same PUT request = same result
PUT /users/123 { "name": "John" }
PUT /users/123 { "name": "John" }  // Same result
```

#### PATCH - Partial Update

```typescript
// ✅ Good: PATCH updates part of resource
PATCH /users/123
// Body: { "email": "newemail@example.com" }

// Only sends fields to update
app.patch('/users/:id', async (req, res) => {
  const updates = req.body;  // Partial updates

  const user = await User.update(req.params.id, updates);

  res.json({ data: user });
});

// Idempotent
PATCH /users/123 { "email": "new@ex.com" }
PATCH /users/123 { "email": "new@ex.com" }  // Same result

// ❌ Don't use PATCH to create
// ❌ Don't use PATCH for full replacement (use PUT)
```

#### DELETE - Remove Resource

```typescript
// ✅ Good: DELETE removes resource
DELETE /users/123

// Idempotent: Multiple deletes = same result
DELETE /users/123  // 204 No Content
DELETE /users/123  // 204 No Content (not 404)

app.delete('/users/:id', async (req, res) => {
  await User.delete(req.params.id);

  // Return 204 No Content (no body)
  res.status(204).send();
});

// ❌ Don't use DELETE for soft delete (use PATCH)
// DELETE is hard delete
```

---

## 3. Status Codes

### Principio: Usar Status Codes Significativos

#### Success Codes (2xx)

```typescript
// 200 OK - GET successful, PUT/PATCH/DELETE successful
app.get('/users/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  res.json({ data: user });  // 200 OK
});

// 201 Created - POST created new resource
app.post('/users', async (req, res) => {
  const user = await User.create(req.body);
  res.status(201)
     .location(`/users/${user.id}`)
     .json({ data: user });  // 201 Created
});

// 204 No Content - DELETE successful
app.delete('/users/:id', async (req, res) => {
  await User.delete(req.params.id);
  res.status(204).send();  // 204 No Content
});

// 206 Partial Content - GET with Range header
app.get('/users/:id/activities', async (req, res) => {
  const { range } = req.headers;
  const activities = await Activity.findByUser(req.params.id, range);
  res.json({ data: activities });  // 206 Partial Content
});
```

#### Client Error Codes (4xx)

```typescript
// 400 Bad Request - Invalid request data
app.post('/users', (req, res) => {
  if (!req.body.name || !req.body.email) {
    return res.status(400).json({
      error: 'Missing required fields: name, email'
    });
  }
});

// 401 Unauthorized - Not authenticated
app.get('/profile', authenticate, (req, res) => {
  // If not authenticated
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  res.json({ data: req.user });
});

// 403 Forbidden - Authenticated but not authorized
app.delete('/users/:id', authenticate, (req, res) => {
  // If user is not admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Admin privileges required'
    });
  }
  // Proceed with delete
});

// 404 Not Found - Resource doesn't exist
app.get('/users/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ data: user });
});

// 409 Conflict - Resource conflict
app.post('/users', async (req, res) => {
  const existingUser = await User.findByEmail(req.body.email);
  if (existingUser) {
    return res.status(409).json({
      error: 'User with this email already exists'
    });
  }
  // Create user
});

// 422 Unprocessable Entity - Validation errors
app.post('/users', (req, res) => {
  const { error } = userSchema.validate(req.body);
  if (error) {
    return res.status(422).json({
      error: 'Validation failed',
      details: error.details
    });
  }
  // Create user
});

// 429 Too Many Requests - Rate limited
app.get('/users', async (req, res) => {
  if (!rateLimiter.allow(req.ip)) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter: rateLimiter.retryAfter(req.ip)
    });
  }
  // Proceed
});
```

#### Server Error Codes (5xx)

```typescript
// 500 Internal Server Error - Unexpected errors
app.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    res.json({ data: user });
  } catch (error) {
    // Log error internally
    console.error(error);

    // Send generic error to client
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 502 Bad Gateway - Upstream service error
app.get('/external-data', async (req, res) => {
  try {
    const data = await externalService.fetch();
    res.json({ data });
  } catch (error) {
    if (error.code === 'SERVICE_UNAVAILABLE') {
      return res.status(502).json({
        error: 'External service unavailable'
      });
    }
  }
});

// 503 Service Unavailable - Maintenance mode
app.get('/users', (req, res) => {
  if (maintenanceMode) {
    return res.status(503).json({
      error: 'Service temporarily unavailable',
      message: 'Undergoing maintenance'
    });
  }
  // Normal response
});

// 504 Gateway Timeout - Upstream timeout
app.get('/external-data', async (req, res) => {
  try {
    const data = await Promise.race([
      externalService.fetch(),
      timeout(5000)  // 5 second timeout
    ]);
    res.json({ data });
  } catch (error) {
    if (error.name === 'TimeoutError') {
      return res.status(504).json({
        error: 'Request timeout'
      });
    }
  }
});
```

---

## 4. Consistent Response Format

### Principio: Responses Consistentes

#### Success Response Format

```typescript
// ✅ Good: Consistent JSON structure
{
  "data": { ... },           // Main resource/data
  "meta": {                  // Metadata about response
    "timestamp": "2024-01-01T00:00:00Z",
    "requestId": "req-123",
    "version": "v1"
  }
}

// For collections
{
  "data": [                  // Array of resources
    { "id": 1, "name": "John" },
    { "id": 2, "name": "Jane" }
  ],
  "meta": {
    "total": 100,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}

// Single resource
{
  "data": {
    "id": 1,
    "name": "John",
    "email": "john@example.com"
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

#### Error Response Format

```typescript
// ✅ Good: Consistent error structure
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      },
      {
        "field": "age",
        "message": "Must be greater than 0"
      }
    ]
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00Z",
    "requestId": "req-123"
  }
}

// Standardized error codes
const ErrorCodes = {
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_FIELD: 'MISSING_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',

  // Authentication/Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',

  // Resources
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',

  // Server
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  TIMEOUT: 'TIMEOUT',

  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED'
};

// Usage
{
  "error": {
    "code": ErrorCodes.VALIDATION_ERROR,
    "message": "Invalid input data",
    "details": [...]
  }
}
```

---

## 5. Pagination

### Principio: Implementar Paginación para Colecciones

#### Offset-Based Pagination

```typescript
// ✅ Good: Use query parameters
GET /users?limit=20&offset=0     // First 20 users
GET /users?limit=20&offset=20    // Next 20 users
GET /users?limit=20&offset=40    // Next 20 users

app.get('/users', async (req, res) => {
  const { limit = 10, offset = 0 } = req.query;

  const users = await User.find({
    limit: parseInt(limit as string),
    offset: parseInt(offset as string)
  });

  const total = await User.count();

  res.json({
    data: users,
    meta: {
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      hasMore: offset + users.length < total
    }
  });
});

// ❌ Don't use page numbers without limit
GET /users?page=2  // Ambiguous - how many per page?
```

#### Cursor-Based Pagination

```typescript
// ✅ Good: More efficient for large datasets
GET /users?cursor=eyJpZCI6MTB9
// Response
{
  "data": [...],
  "meta": {
    "cursor": "eyJpZCI6MzB9",    // For next page
    "hasMore": true
  }
}

app.get('/users', async (req, res) => {
  const { limit = 10, cursor } = req.query;

  const users = await User.find({
    limit: parseInt(limit as string),
    cursor: cursor ? parseCursor(cursor) : null
  });

  const nextCursor = users.length === parseInt(limit as string)
    ? createCursor(users[users.length - 1])
    : null;

  res.json({
    data: users,
    meta: {
      cursor: nextCursor,
      hasMore: !!nextCursor
    }
  });
});

// ❌ Offset is inefficient for large datasets
// SELECT * FROM users OFFSET 100000 LIMIT 10  // Scans 100,000 rows!
```

#### Filtering & Sorting

```typescript
// ✅ Good: Combine pagination with filtering
GET /users?status=active&sort=name&order=asc&limit=20&offset=0

// Multiple filters
GET /posts?category=tech&published=true&authorId=123&createdAfter=2024-01-01

app.get('/posts', async (req, res) => {
  const filters = {
    category: req.query.category,
    published: req.query.published === 'true',
    authorId: req.query.authorId,
    createdAfter: req.query.createdAfter
  };

  const posts = await Post.find({
    filters,
    sort: req.query.sort,
    order: req.query.order || 'asc',
    limit: parseInt(req.query.limit as string),
    offset: parseInt(req.query.offset as string)
  });

  res.json({ data: posts });
});
```

---

## 6. Versioning

### Principio: Versionar APIs para Evitar Breaking Changes

#### URI Versioning

```typescript
// ✅ Good: Version in URI
GET /api/v1/users
GET /api/v2/users

// Major version only (breaking changes)
app.use('/api/v1', routerV1);
app.use('/api/v2', routerV2);

// ❌ Don't version with date
GET /api/2024-01-01/users  // Hard to manage
```

#### Header Versioning

```typescript
// ✅ Good: Version in header (more flexible)
GET /api/users
Accept: application/vnd.myapi.v2+json

// Or custom header
GET /api/users
API-Version: 2

app.get('/users', (req, res) => {
  const version = req.headers['accept'].includes('v2') ? 'v2' : 'v1';

  if (version === 'v2') {
    res.json(transformV2(users));
  } else {
    res.json(usersV1);
  }
});
```

#### Versioning Strategy

```typescript
// Deprecation notice
app.get('/api/v1/users', (req, res) => {
  res.set('Deprecation', 'true');
  res.set('Sunset', 'Tue, 01 Jan 2025 00:00:00 GMT');
  res.set('Link', '</api/v2/users>; rel="successor-version"');

  // Return v1 response
  res.json(usersV1);
});

// Response headers
HTTP/1.1 200 OK
Deprecation: true
Sunset: Tue, 01 Jan 2025 00:00:00 GMT
Link: </api/v2/users>; rel="successor-version"
```

---

## 7. Security

### Principio: Implementar Seguridad desde el Diseño

#### Authentication

```typescript
// ✅ Good: Use standard Authorization header
GET /api/users
Authorization: Bearer eyJhbGciOi...

app.get('/users', authenticate, (req, res) => {
  // req.user is populated by middleware
  res.json({ data: users });
});

// Middleware
function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

#### Authorization

```typescript
// ✅ Good: Role-based access control
app.delete('/users/:id', authenticate, async (req, res) => {
  // Check if user has permission
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  // Check if user can modify this specific resource
  if (req.user.id !== req.params.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Cannot modify other users' });
  }

  await User.delete(req.params.id);
  res.status(204).send();
});

// ✅ Better: Use permission system
const permissions = {
  'user:read': ['admin', 'user'],
  'user:write': ['admin'],
  'user:delete': ['admin']
};

app.delete('/users/:id', authenticate, (req, res) => {
  if (!hasPermission(req.user, 'user:delete')) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
});
```

#### Input Validation

```typescript
// ✅ Good: Validate all inputs
import Joi from 'joi';

const userSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  age: Joi.number().integer().min(18).max(120),
  role: Joi.string().valid('admin', 'user', 'moderator').default('user')
});

app.post('/users', async (req, res) => {
  // Validate input
  const { error, value } = userSchema.validate(req.body);

  if (error) {
    return res.status(422).json({
      error: 'Validation failed',
      details: error.details.map(d => ({
        field: d.path.join('.'),
        message: d.message
      }))
    });
  }

  // Use validated data
  const user = await User.create(value);
  res.status(201).location(`/users/${user.id}`).json({ data: user });
});
```

#### Rate Limiting

```typescript
// ✅ Good: Prevent abuse
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Rate limit exceeded',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,      // Return rate limit info in headers
  legacyHeaders: false        // Disable X-RateLimit-* headers
});

app.use('/api', limiter);

// Different limits for different endpoints
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,  // Strict limit for sensitive operations
  message: { error: 'Too many attempts' }
});

app.use('/api/auth/login', strictLimiter);
```

#### Security Headers

```typescript
// ✅ Good: Configure security headers
import helmet from 'helmet';

app.use(helmet());  // Sets various security headers

// Custom CORS configuration
const corsOptions = {
  origin: ['https://myapp.com', 'https://admin.myapp.com'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use('/api', cors(corsOptions));

// API-specific CORS
app.get('/api/public-data', (req, res) => {
  res.json({ data: 'public' });
});

app.get('/api/private-data', authenticate, (req, res) => {
  res.json({ data: 'private' });
});
```

---

## 8. Idempotency

### Principio: Operaciones Idempotentes

```typescript
// ✅ GET is naturally idempotent
GET /users/123  // Always returns same user

// ✅ PUT is idempotent (full replacement)
PUT /users/123 { "name": "John" }
PUT /users/123 { "name": "John" }  // Same result

// ✅ DELETE is idempotent (resource deleted once)
DELETE /users/123  // 204 No Content
DELETE /users/123  // 204 No Content (not 404)

// POST is NOT idempotent (creates new resource)
// But we can make it idempotent with Idempotency-Key header
const idempotentPost = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.headers['idempotency-key'] || req.ip
});

app.post('/users', idempotentPost, async (req, res) => {
  const idempotencyKey = req.headers['idempotency-key'];

  // Check if request was already processed
  const cached = await cache.get(`idempotent:${idempotencyKey}`);
  if (cached) {
    return res.json(cached);
  }

  const user = await User.create(req.body);

  // Cache result for idempotency
  await cache.set(`idempotent:${idempotencyKey}`, user, 3600);

  res.status(201).location(`/users/${user.id}`).json({ data: user });
});

// Client usage
fetch('/api/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Idempotency-Key': 'unique-key-123'
  },
  body: JSON.stringify({ name: 'John' })
});
```

---

## 9. Caching

### Principio: Usar Caching Efectivamente

```typescript
// ✅ Good: HTTP caching with ETags
app.get('/users/:id', async (req, res) => {
  const user = await User.findById(req.params.id);

  // Generate ETag based on user data
  const etag = `"user-${user.id}-${user.updatedAt}"`;

  // Check If-None-Match header
  if (req.headers['if-none-match'] === etag) {
    return res.status(304).end();  // Not Modified
  }

  res.set('ETag', etag);
  res.set('Cache-Control', 'public, max-age=3600');  // Cache for 1 hour

  res.json({ data: user });
});

// Client
const response = await fetch('/api/users/123');
if (response.status === 304) {
  // Use cached version
  console.log('Not modified - using cache');
}
```

#### Application-Level Caching

```typescript
// ✅ Good: Cache expensive operations
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 600 });  // 10 minutes

app.get('/users/:id/posts', async (req, res) => {
  const cacheKey = `user:${req.params.id}:posts`;

  // Try cache first
  let posts = cache.get(cacheKey);

  if (!posts) {
    // Cache miss - query database
    posts = await Post.findByUser(req.params.id);

    // Cache result
    cache.set(cacheKey, posts, 300);  // 5 minutes
  }

  res.json({ data: posts });
});

// Invalidate cache on updates
app.post('/users/:id/posts', async (req, res) => {
  const post = await Post.create({
    ...req.body,
    userId: req.params.id
  });

  // Invalidate cache
  cache.del(`user:${req.params.id}:posts`);

  res.status(201).json({ data: post });
});
```

---

## 10. Documentation

### Principio: Documentar APIs Completamente

#### OpenAPI/Swagger

```typescript
// ✅ Good: Use OpenAPI specification
/**
 * @openapi
 * /users:
 *   get:
 *     summary: List users
 *     tags:
 *       - Users
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of users to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Number of users to skip
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "123"
 *         name:
 *           type: string
 *           example: "John Doe"
 *         email:
 *           type: string
 *           example: "john@example.com"
 */

app.get('/users', async (req, res) => {
  const users = await User.findAll({
    limit: parseInt(req.query.limit as string),
    offset: parseInt(req.query.offset as string)
  });

  res.json({ data: users });
});
```

#### GraphQL Schema

```typescript
// ✅ Good: Self-documenting GraphQL schema
const typeDefs = `#graphql
  """
  User represents a registered user in the system
  """
  type User {
    """
    Unique identifier
    """
    id: ID!
    """
    Full name
    """
    name: String!
    """
    Email address (must be unique)
    """
    email: String!
    """
    User's age
    """
    age: Int
    """
    When user was created
    """
    createdAt: DateTime!

    """
    List of posts by this user
    """
    posts: [Post!]!

    """
    Number of posts by this user
    """
    postCount: Int!
  }

  input CreateUserInput {
    name: String!
    email: String!
    age: Int
  }

  """
  Query users with pagination
  """
  type Query {
    users(limit: Int = 10, offset: Int = 0): [User!]!
    user(id: ID!): User
  }

  """
  Create a new user
  """
  type Mutation {
    createUser(input: CreateUserInput!): User!
  }
`;
```

---

**Estado**: Principios de diseño completados
**Resource-Based**: URLs noun-based, hierarchical structure
**HTTP Methods**: GET, POST, PUT, PATCH, DELETE semantics
**Status Codes**: 2xx success, 4xx client errors, 5xx server errors
**Consistency**: Standardized response/error formats
**Pagination**: Offset/cursor-based, filtering, sorting
**Versioning**: URI or header-based versioning strategies
**Security**: Authentication, authorization, validation, rate limiting
**Idempotency**: GET/PUT/DELETE are idempotent, POST can be made idempotent
**Caching**: HTTP caching (ETags), application-level caching
**Documentation**: OpenAPI, GraphQL introspection
