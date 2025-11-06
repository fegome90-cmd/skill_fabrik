# API Best Practices - Mejores Prácticas

## Mejores Prácticas para APIs

Esta guía establece las mejores prácticas para diseñar, implementar y mantener APIs robustas.

---

## 1. Error Handling

### Principio: Manejo Consistente de Errores

#### Standardized Error Responses

```typescript
// ✅ Good: Consistent error format
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}

// Example errors
const ERROR_CODES = {
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  INVALID_VALUE: 'INVALID_VALUE',

  // Authentication/Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',

  // Resources
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',

  // Server
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED'
};

// Error handling middleware
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestId = req.headers['x-request-id'] || generateId();

  // Log error for debugging
  logger.error({
    error: error.message,
    stack: error.stack,
    requestId,
    url: req.url,
    method: req.method
  });

  // Determine error type
  let statusCode = 500;
  let errorCode = ERROR_CODES.INTERNAL_SERVER_ERROR;
  let message = 'An unexpected error occurred';
  let details: any = null;

  if (error instanceof ValidationError) {
    statusCode = 422;
    errorCode = ERROR_CODES.VALIDATION_ERROR;
    message = 'Validation failed';
    details = error.details;
  } else if (error instanceof NotFoundError) {
    statusCode = 404;
    errorCode = ERROR_CODES.RESOURCE_NOT_FOUND;
    message = error.message;
  } else if (error instanceof UnauthorizedError) {
    statusCode = 401;
    errorCode = ERROR_CODES.UNAUTHORIZED;
    message = 'Authentication required';
  } else if (error instanceof ForbiddenError) {
    statusCode = 403;
    errorCode = ERROR_CODES.FORBIDDEN;
    message = 'Access denied';
  } else if (error instanceof ConflictError) {
    statusCode = 409;
    errorCode = ERROR_CODES.RESOURCE_CONFLICT;
    message = error.message;
  }

  // Send error response
  res.status(statusCode).json({
    error: {
      code: errorCode,
      message,
      ...(details && { details })
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId
    }
  });
}
```

#### Validation Error Details

```typescript
// ✅ Good: Detailed validation errors
app.post('/users', async (req, res, next) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json({ data: user });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const details = Object.entries(error.errors).map(([field, err]) => ({
        field,
        message: err.message,
        value: err.value
      }));

      return res.status(422).json({
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Validation failed',
          details
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id']
        }
      });
    }

    next(error);
  }
});
```

#### Don't Expose Internal Details

```typescript
// ❌ Bad: Exposing sensitive information
app.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    res.json(user);
  } catch (error) {
    // ❌ Don't expose internal errors
    res.status(500).json({
      error: error.message,           // Contains stack trace!
      stack: error.stack,              // Exposes internals!
      database: process.env.DB_HOST    // SECURITY ISSUE!
    });
  }
});

// ✅ Good: Generic error messages
app.get('/users/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    res.json(user);
  } catch (error) {
    // ❌ Safe - generic message
    res.status(500).json({
      error: {
        code: ERROR_CODES.INTERNAL_SERVER_ERROR,
        message: 'An unexpected error occurred'
      }
    });
  }
});

// Log internally for debugging (don't send to client)
logger.error('Database error', {
  error: error.message,
  stack: error.stack,
  userId: req.params.id
});
```

---

## 2. Input Validation

### Principio: Validar Todos los Inputs

#### Schema-Based Validation

```typescript
// ✅ Good: Use validation schemas
import Joi from 'joi';

const userSchema = Joi.object({
  name: Joi.string().min(2).max(100).required()
    .messages({
      'string.empty': 'Name is required',
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name cannot exceed 100 characters'
    }),
  email: Joi.string().email().required()
    .messages({
      'string.email': 'Invalid email format',
      'string.empty': 'Email is required'
    }),
  age: Joi.number().integer().min(18).max(120).optional()
    .messages({
      'number.base': 'Age must be a number',
      'number.integer': 'Age must be an integer',
      'number.min': 'Must be at least 18 years old',
      'number.max': 'Age cannot exceed 120'
    }),
  role: Joi.string().valid('admin', 'user', 'moderator').default('user')
});

// Validation middleware
function validate(schema: Joi.Schema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true  // Remove unknown fields
    });

    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(422).json({
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Validation failed',
          details
        }
      });
    }

    // Replace request body with validated and sanitized data
    req.body = value;
    next();
  };
}

app.post('/users', validate(userSchema), async (req, res) => {
  const user = await User.create(req.body);
  res.status(201).json({ data: user });
});
```

#### Sanitization

```typescript
// ✅ Good: Sanitize inputs
import DOMPurify from 'isomorphic-dompurify';
import xss from 'xss-clean';

// Prevent XSS attacks
function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  // Sanitize all string inputs
  for (const key in req.body) {
    if (typeof req.body[key] === 'string') {
      req.body[key] = xss(req.body[key]);
    }
  }

  // For HTML content
  if (req.body.description) {
    req.body.description = DOMPurify.sanitize(req.body.description);
  }

  next();
}

// Remove harmful characters
function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  const regex = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;

  for (const key in req.body) {
    if (typeof req.body[key] === 'string') {
      req.body[key] = req.body[key].replace(regex, '');
    }
  }

  next();
}
```

---

## 3. Security Headers

### Principio: Configurar Security Headers

#### Helmet Configuration

```typescript
// ✅ Good: Configure security headers
import helmet from 'helmet';

app.use(helmet());

// Custom helmet configuration
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:']
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  })
);

// CORS configuration
import cors from 'cors';

const corsOptions = {
  origin: function (origin: string, callback: Function) {
    const allowedOrigins = [
      'https://myapp.com',
      'https://admin.myapp.com',
      'http://localhost:3000'  // For development
    ];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining']
};

app.use('/api', cors(corsOptions));
```

---

## 4. Rate Limiting

### Principio: Prevenir Abuse

#### Multiple Rate Limits

```typescript
// ✅ Good: Different limits for different operations
import rateLimit from 'express-rate-limit';

// Strict limit for sensitive operations
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,                    // 5 attempts per window
  message: {
    error: {
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      message: 'Too many authentication attempts',
      retryAfter: '15 minutes'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Moderate limit for API operations
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,  // 100 requests per window
  message: {
    error: {
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      message: 'API rate limit exceeded'
    }
  },
  keyGenerator: (req) => req.ip + ':' + req.user?.id,  // Per user
  skip: (req) => req.user?.role === 'admin'  // Skip for admins
});

// Generous limit for public data
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000
});

// Apply limits
app.use('/api/auth/login', authLimiter);
app.use('/api', apiLimiter);
app.use('/api/public', publicLimiter);
```

#### Custom Rate Limiter with Redis

```typescript
// ✅ Good: Distributed rate limiting
import RedisStore from 'rate-limit-redis';
import IORedis from 'ioredis';

const redis = new IORedis(process.env.REDIS_URL);

const redisLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:'
  }),
  windowMs: 15 * 60 * 1000,
  max: 100,
  keyGenerator: (req) => req.ip + ':' + req.user?.id,
  handler: (req, res) => {
    res.status(429).json({
      error: {
        code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
        message: 'Rate limit exceeded'
      }
    });
  }
});

app.use('/api', redisLimiter);
```

---

## 5. Pagination

### Principio: Paginación para Colecciones Grandes

#### Cursor-Based Pagination

```typescript
// ✅ Good: Efficient cursor-based pagination
function createCursor(data: any[]): string | null {
  if (data.length === 0) return null;

  // Use last item's ID as cursor
  const lastItem = data[data.length - 1];
  const cursor = Buffer.from(JSON.stringify({
    id: lastItem.id,
    timestamp: lastItem.createdAt
  })).toString('base64');

  return cursor;
}

function parseCursor(cursor: string): { id: string; timestamp: Date } {
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
    const parsed = JSON.parse(decoded);
    return {
      id: parsed.id,
      timestamp: new Date(parsed.timestamp)
    };
  } catch (error) {
    throw new Error('Invalid cursor');
  }
}

app.get('/users', async (req, res) => {
  const { limit = 10, cursor } = req.query;

  // Parse cursor if provided
  let parsedCursor = null;
  if (cursor) {
    try {
      parsedCursor = parseCursor(cursor as string);
    } catch (error) {
      return res.status(400).json({
        error: {
          code: 'INVALID_CURSOR',
          message: 'Invalid cursor format'
        }
      });
    }
  }

  // Fetch users
  const users = await User.find({
    ...(parsedCursor && {
      $or: [
        { createdAt: { $gt: parsedCursor.timestamp } },
        {
          createdAt: parsedCursor.timestamp,
          id: { $gt: parsedCursor.id }
        }
      ]
    })
  })
    .sort({ createdAt: 1, id: 1 })
    .limit(parseInt(limit as string) + 1);  // Get one extra

  // Check if there are more results
  const hasMore = users.length > parseInt(limit as string);
  const data = hasMore ? users.slice(0, -1) : users;

  // Generate next cursor
  const nextCursor = hasMore ? createCursor(data) : null;

  res.json({
    data,
    meta: {
      limit: parseInt(limit as string),
      cursor: nextCursor,
      hasMore
    }
  });
});
```

#### Offset-Based Pagination (for small datasets)

```typescript
// ✅ Good: Offset for simple cases
app.get('/posts', async (req, res) => {
  const { limit = 10, offset = 0 } = req.query;

  // Validate pagination parameters
  const maxLimit = 100;
  const parsedLimit = Math.min(
    parseInt(limit as string),
    maxLimit
  );

  const parsedOffset = Math.max(0, parseInt(offset as string));

  // Get total count for metadata
  const total = await Post.countDocuments();

  // Fetch posts
  const posts = await Post.find()
    .skip(parsedOffset)
    .limit(parsedLimit)
    .sort({ createdAt: -1 });

  res.json({
    data: posts,
    meta: {
      total,
      limit: parsedLimit,
      offset: parsedOffset,
      hasMore: parsedOffset + posts.length < total
    }
  });
});
```

---

## 6. Authentication & Authorization

### Principio: Separar Autenticación de Autorización

#### JWT Authentication

```typescript
// ✅ Good: JWT-based authentication
import jwt from 'jsonwebtoken';

interface JWTPayload {
  id: string;
  email: string;
  role: string;
}

function generateToken(user: User): string {
  const payload: JWTPayload = {
    id: user.id,
    email: user.email,
    role: user.role
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '24h',
    issuer: 'my-api',
    subject: user.id
  });
}

function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: {
        code: ERROR_CODES.UNAUTHORIZED,
        message: 'Authentication required'
      }
    });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET) as JWTPayload;
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({
      error: {
        code: ERROR_CODES.TOKEN_EXPIRED,
        message: 'Invalid or expired token'
      }
    });
  }
}

// Usage
app.get('/profile', authenticate, (req, res) => {
  res.json({ data: req.user });
});
```

#### Role-Based Authorization

```typescript
// ✅ Good: Fine-grained permissions
const PERMISSIONS = {
  'user:read': ['admin', 'moderator', 'user'],
  'user:write': ['admin', 'moderator'],
  'user:delete': ['admin'],
  'admin:access': ['admin']
};

function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as JWTPayload;

    if (!user) {
      return res.status(401).json({
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Authentication required'
        }
      });
    }

    const allowedRoles = PERMISSIONS[permission] || [];

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        error: {
          code: ERROR_CODES.FORBIDDEN,
          message: 'Insufficient permissions'
        }
      });
    }

    next();
  };
}

// Usage
app.get('/users', authenticate, requirePermission('user:read'), ...);
app.post('/users', authenticate, requirePermission('user:write'), ...);
app.delete('/users/:id', authenticate, requirePermission('user:delete'), ...);

// ✅ Better: Resource-based authorization
function requireOwnership(req: Request, res: Response, next: NextFunction) {
  const user = req.user as JWTPayload;
  const resourceUserId = req.params.userId || req.body.userId;

  // Admin can access everything
  if (user.role === 'admin') {
    return next();
  }

  // Users can only access their own resources
  if (user.id !== resourceUserId) {
    return res.status(403).json({
      error: {
        code: ERROR_CODES.FORBIDDEN,
        message: 'You can only access your own resources'
      }
    });
  }

  next();
}

// Usage
app.get('/users/:userId', authenticate, requireOwnership, ...);
```

---

## 7. Caching

### Principio: Cache para Performance

#### HTTP Caching with ETag

```typescript
// ✅ Good: ETag-based caching
app.get('/users/:id', async (req, res) => {
  const user = await User.findById(req.params.id);

  // Generate ETag based on user data
  const etag = `"user-${user.id}-${user.updatedAt.getTime()}"`;

  // Check If-None-Match header
  if (req.headers['if-none-match'] === etag) {
    return res.status(304).end();
  }

  // Set caching headers
  res.set('ETag', etag);
  res.set('Cache-Control', 'public, max-age=3600');  // 1 hour
  res.set('Vary', 'Accept-Encoding');

  res.json({ data: user });
});

// ✅ Good: Cache-Control headers for different resources
const CACHE_CONFIG = {
  public: 'public, max-age=3600',           // 1 hour
  user: 'private, no-cache',                 // Don't cache
  static: 'public, max-age=86400, immutable' // 1 day (immutable)
};

app.get('/config', (req, res) => {
  res.set('Cache-Control', CACHE_CONFIG.public);
  res.json({ data: config });
});
```

#### Application-Level Caching

```typescript
// ✅ Good: Redis for distributed caching
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

app.get('/users/:id', async (req, res) => {
  const cacheKey = `user:${req.params.id}`;

  // Try cache first
  const cached = await redis.get(cacheKey);

  if (cached) {
    return res.json(JSON.parse(cached));
  }

  // Cache miss - query database
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      error: { code: ERROR_CODES.RESOURCE_NOT_FOUND, message: 'User not found' }
    });
  }

  // Cache for 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify(user));

  res.json({ data: user });
});

// Invalidate cache on updates
app.patch('/users/:id', async (req, res) => {
  const user = await User.update(req.params.id, req.body);

  // Invalidate cache
  await redis.del(`user:${req.params.id}`);

  // Invalidate related caches
  await redis.del(`user:${req.params.id}:posts`);

  res.json({ data: user });
});
```

---

## 8. Logging

### Principio: Logging Estructurado

#### Structured Logging

```typescript
// ✅ Good: Use structured logging
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'user-service' },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Log API requests
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;

    logger.info('API Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
  });

  next();
});

// Log errors
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled Error', {
    error: error.message,
    stack: error.stack,
    method: req.method,
    url: req.url,
    body: req.body,
    userId: req.user?.id,
    ip: req.ip
  });

  next(error);
});
```

#### Request Tracing

```typescript
// ✅ Good: Trace requests across services
import { v4 as uuidv4 } from 'uuid';

function traceMiddleware(req: Request, res: Response, next: NextFunction) {
  // Generate or use existing trace ID
  const traceId = req.headers['x-trace-id'] as string || uuidv4();

  // Add to request object
  (req as any).traceId = traceId;

  // Add to response headers
  res.set('X-Trace-ID', traceId);

  // Log with trace ID
  logger.info('Request started', { traceId });

  next();
}

// Include trace ID in all logs
logger.info('User created', {
  traceId: req.traceId,
  userId: user.id
});
```

---

## 9. Documentation

### Principio: Documentar Completamente

#### OpenAPI Specification

```typescript
// ✅ Good: Comprehensive OpenAPI spec
/**
 * @openapi
 * /users:
 *   get:
 *     summary: List all users
 *     description: |
 *       Retrieve a paginated list of users.
 *
 *       Supports filtering by status, role, and search query.
 *       Results are sorted by creation date (newest first).
 *     tags:
 *       - Users
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, pending]
 *         description: Filter by user status
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, user, moderator]
 *         description: Filter by user role
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email (case-insensitive)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of users to return
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *         description: Cursor for pagination (base64-encoded)
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
 *                   type: object
 *                   properties:
 *                     limit:
 *                       type: integer
 *                     cursor:
 *                       type: string
 *                       nullable: true
 *                     hasMore:
 *                       type: boolean
 *       400:
 *         description: Invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - id
 *         - name
 *         - email
 *         - createdAt
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           example: "John Doe"
 *         email:
 *           type: string
 *           format: email
 *           example: "john@example.com"
 *         status:
 *           type: string
 *           enum: [active, inactive, pending]
 *           example: "active"
 *         role:
 *           type: string
 *           enum: [admin, user, moderator]
 *           example: "user"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-01T00:00:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-01T00:00:00Z"
 */
```

#### Auto-Generate Documentation

```typescript
// ✅ Good: Auto-generate from code
import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'User API',
      version: '1.0.0',
      description: 'API for managing users',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Development server'
      },
      {
        url: 'https://api.example.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./routes/*.ts']  // Scan route files for annotations
};

const swaggerSpec = swaggerJSDoc(options);

// Serve documentation
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerSpec));
```

---

## 10. Monitoring & Observability

### Principio: Monitorear API Health

#### Health Checks

```typescript
// ✅ Good: Health check endpoint
app.get('/health', async (req, res) => {
  const checks = {
    database: 'ok',
    redis: 'ok',
    externalService: 'ok'
  };

  try {
    // Check database
    await mongoose.connection.db.admin().ping();
    checks.database = 'ok';
  } catch (error) {
    checks.database = 'error';
  }

  try {
    // Check Redis
    await redis.ping();
    checks.redis = 'ok';
  } catch (error) {
    checks.redis = 'error';
  }

  try {
    // Check external service
    await axios.get('https://external-service.com/health');
    checks.externalService = 'ok';
  } catch (error) {
    checks.externalService = 'error';
  }

  // Return 200 if all checks pass, 503 if any fail
  const allOk = Object.values(checks).every(status => status === 'ok');
  const statusCode = allOk ? 200 : 503;

  res.status(statusCode).json({
    status: allOk ? 'healthy' : 'unhealthy',
    checks,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

#### Metrics Collection

```typescript
// ✅ Good: Collect and expose metrics
import promClient from 'prom-client';

const httpDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code']
});

const httpRequests = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const activeConnections = new promClient.Gauge({
  name: 'http_active_connections',
  help: 'Number of active HTTP connections'
});

// Collect metrics
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;

    const route = req.route?.path || req.path;

    httpDuration
      .labels(req.method, route, res.statusCode.toString())
      .observe(duration);

    httpRequests
      .labels(req.method, route, res.statusCode.toString())
      .inc();
  });

  next();
});

// Expose metrics
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(await promClient.register.metrics());
});
```

---

## Summary Checklist

### ✅ Do's

1. **Use proper HTTP status codes** (200, 201, 204, 400, 401, 403, 404, 422, 500, etc.)
2. **Validate all inputs** with schemas (Joi, Yup, Zod)
3. **Sanitize inputs** to prevent XSS attacks
4. **Use consistent error format** across all endpoints
5. **Implement rate limiting** to prevent abuse
6. **Document APIs** with OpenAPI/Swagger
7. **Use caching** (HTTP caching, Redis, etc.)
8. **Log structured data** with trace IDs
9. **Implement authentication** with JWT
10. **Use proper authorization** (RBAC, ABAC)
11. **Monitor health** with /health endpoints
12. **Collect metrics** for observability
13. **Version APIs** properly
14. **Paginate large collections**
15. **Return meaningful error messages**

### ❌ Don'ts

1. **Don't expose internal errors** to clients
2. **Don't leak sensitive information** in error messages
3. **Don't validate on the client only** - always validate on server
4. **Don't use generic error messages** (e.g., always return 500)
5. **Don't ignore security headers** (helmet, CORS, etc.)
6. **Don't skip rate limiting**
7. **Don't forget to escape output**
8. **Don't hardcode secrets** in code
9. **Don't trust client input** (always validate and sanitize)
10. **Don't use query parameters for sensitive operations**
11. **Don't return stack traces** in production
12. **Don't forget to test error cases**
13. **Don't skip pagination** for large datasets
14. **Don't expose implementation details** in URLs or responses

---

**Estado**: Mejores prácticas completadas
**Error Handling**: Standardized error format, proper status codes
**Validation**: Schema-based validation, sanitization
**Security**: Headers, rate limiting, authentication, authorization
**Pagination**: Cursor-based and offset-based strategies
**Caching**: HTTP caching, application-level caching
**Documentation**: OpenAPI specs, auto-generated docs
**Monitoring**: Health checks, metrics, observability
