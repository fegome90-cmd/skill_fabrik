# 🎯 Guía Práctica: Implementación TDD Paso a Paso

## 📖 Introducción

Esta guía proporciona ejemplos completos y prácticos de cómo implementar TDD en proyectos con Routers, Daemons y PM2.

Cada ejemplo sigue el ciclo Red-Green-Refactor y muestra el código real que escribirías.

---

## 🏃 Ejemplo 1: Endpoint de Registro de Usuario (Completo)

### Paso 1: Test de Contrato de API (RED)

```javascript
// tests/integration/user.api.test.js
const request = require('supertest');
const app = require('../../src/app');
const { setupTestDB, clearTestDB } = require('../helpers/db');

describe('POST /api/users/register', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await clearTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  it('should register new user and return 201 with user data', async () => {
    // Arrange
    const userData = {
      email: 'newuser@example.com',
      password: 'SecurePass123!',
      name: 'John Doe',
    };

    // Act
    const response = await request(app).post('/api/users/register').send(userData).expect(201);

    // Assert
    expect(response.body).toHaveProperty('id');
    expect(response.body.email).toBe('newuser@example.com');
    expect(response.body.name).toBe('John Doe');
    expect(response.body).not.toHaveProperty('password'); // No exponer password
    expect(response.body.createdAt).toBeDefined();
  });

  it('should return 400 when email is invalid', async () => {
    // Arrange
    const userData = {
      email: 'invalid-email',
      password: 'SecurePass123!',
      name: 'John Doe',
    };

    // Act
    const response = await request(app).post('/api/users/register').send(userData).expect(400);

    // Assert
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('email');
  });

  it('should return 409 when email already exists', async () => {
    // Arrange
    const userData = {
      email: 'existing@example.com',
      password: 'SecurePass123!',
      name: 'John Doe',
    };

    // First registration
    await request(app).post('/api/users/register').send(userData);

    // Act - Try to register again
    const response = await request(app).post('/api/users/register').send(userData).expect(409);

    // Assert
    expect(response.body.error).toBe('Email already exists');
  });
});
```

**Resultado**: Tests FALLAN (RED) ✅

---

### Paso 2: Implementar Ruta (GREEN - Mínimo)

```javascript
// src/routes/user.routes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { validateUserRegistration } = require('../middleware/validation');

router.post('/register', validateUserRegistration, userController.register);

module.exports = router;
```

```javascript
// src/app.js
const express = require('express');
const userRoutes = require('./routes/user.routes');

const app = express();

app.use(express.json());
app.use('/api/users', userRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

module.exports = app;
```

**Resultado**: Aún FALLAN (no hay controlador) ✅

---

### Paso 3: Test de Controlador (RED)

```javascript
// tests/unit/controllers/user.controller.test.js
const userController = require('../../../src/controllers/user.controller');

describe('UserController', () => {
  describe('register', () => {
    it('should call userService.register and return 201', async () => {
      // Arrange
      const mockService = {
        register: jest.fn().mockResolvedValue({
          id: '123',
          email: 'test@test.com',
          name: 'Test User',
          createdAt: new Date(),
        }),
      };

      const controller = userController(mockService);

      const req = {
        body: {
          email: 'test@test.com',
          password: 'password123',
          name: 'Test User',
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const next = jest.fn();

      // Act
      await controller.register(req, res, next);

      // Assert
      expect(mockService.register).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'password123',
        name: 'Test User',
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '123',
          email: 'test@test.com',
          name: 'Test User',
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error when service throws', async () => {
      // Arrange
      const mockError = new Error('Database error');
      const mockService = {
        register: jest.fn().mockRejectedValue(mockError),
      };

      const controller = userController(mockService);

      const req = { body: {} };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      // Act
      await controller.register(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(mockError);
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
```

**Resultado**: Tests FALLAN ✅

---

### Paso 4: Implementar Controlador (GREEN)

```javascript
// src/controllers/user.controller.js
module.exports = userService => {
  return {
    async register(req, res, next) {
      try {
        const { email, password, name } = req.body;

        const user = await userService.register({
          email,
          password,
          name,
        });

        res.status(201).json(user);
      } catch (error) {
        next(error);
      }
    },
  };
};
```

**Resultado**: Tests de controlador PASAN ✅

---

### Paso 5: Test de Servicio (RED)

```javascript
// tests/unit/services/user.service.test.js
const UserService = require('../../../src/services/user.service');
const bcrypt = require('bcrypt');

jest.mock('bcrypt');

describe('UserService', () => {
  describe('register', () => {
    beforeEach(() => {
      bcrypt.hash.mockClear();
    });

    it('should hash password and create user', async () => {
      // Arrange
      const mockRepository = {
        findByEmail: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({
          id: '123',
          email: 'test@test.com',
          password: 'hashed_password',
          name: 'Test User',
          createdAt: new Date(),
        }),
      };

      bcrypt.hash.mockResolvedValue('hashed_password');

      const service = UserService(mockRepository);

      const userData = {
        email: 'test@test.com',
        password: 'plain_password',
        name: 'Test User',
      };

      // Act
      const result = await service.register(userData);

      // Assert
      expect(mockRepository.findByEmail).toHaveBeenCalledWith('test@test.com');
      expect(bcrypt.hash).toHaveBeenCalledWith('plain_password', 10);
      expect(mockRepository.create).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'hashed_password',
        name: 'Test User',
      });
      expect(result).toEqual({
        id: '123',
        email: 'test@test.com',
        name: 'Test User',
        createdAt: expect.any(Date),
      });
      expect(result).not.toHaveProperty('password');
    });

    it('should throw ConflictError when email exists', async () => {
      // Arrange
      const mockRepository = {
        findByEmail: jest.fn().mockResolvedValue({
          id: '456',
          email: 'existing@test.com',
        }),
      };

      const service = UserService(mockRepository);

      // Act & Assert
      await expect(
        service.register({
          email: 'existing@test.com',
          password: 'password',
          name: 'User',
        })
      ).rejects.toThrow('Email already exists');
    });

    it('should validate email format', async () => {
      // Arrange
      const mockRepository = {
        findByEmail: jest.fn(),
      };

      const service = UserService(mockRepository);

      // Act & Assert
      await expect(
        service.register({
          email: 'invalid-email',
          password: 'password',
          name: 'User',
        })
      ).rejects.toThrow('Invalid email format');

      expect(mockRepository.findByEmail).not.toHaveBeenCalled();
    });
  });
});
```

**Resultado**: Tests FALLAN ✅

---

### Paso 6: Implementar Servicio (GREEN)

```javascript
// src/services/user.service.js
const bcrypt = require('bcrypt');
const { ConflictError, ValidationError } = require('../utils/errors');

module.exports = userRepository => {
  const validateEmail = email => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError('Invalid email format');
    }
  };

  return {
    async register({ email, password, name }) {
      // Validate email
      validateEmail(email);

      // Check if user exists
      const existingUser = await userRepository.findByEmail(email);
      if (existingUser) {
        throw new ConflictError('Email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await userRepository.create({
        email,
        password: hashedPassword,
        name,
      });

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      return userWithoutPassword;
    },
  };
};
```

```javascript
// src/utils/errors.js
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.status = 400;
  }
}

class ConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConflictError';
    this.status = 409;
  }
}

module.exports = {
  ValidationError,
  ConflictError,
};
```

**Resultado**: Tests de servicio PASAN ✅

---

### Paso 7: Test de Repositorio (RED)

```javascript
// tests/integration/repositories/user.repository.test.js
const UserRepository = require('../../../src/repositories/user.repository');
const { setupTestDB, clearTestDB, getDB } = require('../../helpers/db');

describe('UserRepository', () => {
  let repository;
  let db;

  beforeAll(async () => {
    db = await setupTestDB();
    repository = UserRepository(db);
  });

  afterAll(async () => {
    await clearTestDB();
  });

  afterEach(async () => {
    await db('users').del();
  });

  describe('create', () => {
    it('should insert user into database', async () => {
      // Arrange
      const userData = {
        email: 'test@test.com',
        password: 'hashed_password',
        name: 'Test User',
      };

      // Act
      const user = await repository.create(userData);

      // Assert
      expect(user).toHaveProperty('id');
      expect(user.email).toBe('test@test.com');
      expect(user.name).toBe('Test User');
      expect(user.createdAt).toBeDefined();

      // Verify in database
      const dbUser = await db('users').where({ id: user.id }).first();

      expect(dbUser).toBeTruthy();
      expect(dbUser.email).toBe('test@test.com');
    });
  });

  describe('findByEmail', () => {
    it('should return user when exists', async () => {
      // Arrange
      await db('users').insert({
        email: 'existing@test.com',
        password: 'hashed',
        name: 'Existing User',
      });

      // Act
      const user = await repository.findByEmail('existing@test.com');

      // Assert
      expect(user).toBeTruthy();
      expect(user.email).toBe('existing@test.com');
    });

    it('should return null when user does not exist', async () => {
      // Act
      const user = await repository.findByEmail('nonexistent@test.com');

      // Assert
      expect(user).toBeNull();
    });
  });
});
```

**Resultado**: Tests FALLAN ✅

---

### Paso 8: Implementar Repositorio (GREEN)

```javascript
// src/repositories/user.repository.js
module.exports = db => {
  return {
    async create(userData) {
      const [id] = await db('users')
        .insert({
          ...userData,
          created_at: db.fn.now(),
        })
        .returning('id');

      return this.findById(id);
    },

    async findById(id) {
      const user = await db('users').where({ id }).first();

      if (!user) return null;

      return {
        id: user.id,
        email: user.email,
        password: user.password,
        name: user.name,
        createdAt: user.created_at,
      };
    },

    async findByEmail(email) {
      const user = await db('users').where({ email }).first();

      if (!user) return null;

      return {
        id: user.id,
        email: user.email,
        password: user.password,
        name: user.name,
        createdAt: user.created_at,
      };
    },
  };
};
```

**Resultado**: Todos los tests PASAN ✅✅✅

---

### Paso 9: REFACTOR

Ahora que todos los tests pasan, podemos refactorizar:

```javascript
// src/services/user.service.js (REFACTORED)
const bcrypt = require('bcrypt');
const { ConflictError, ValidationError } = require('../utils/errors');
const { validateEmail } = require('../utils/validators');

const SALT_ROUNDS = 10;

module.exports = userRepository => {
  const checkUserExists = async email => {
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictError('Email already exists');
    }
  };

  const hashPassword = async password => {
    return bcrypt.hash(password, SALT_ROUNDS);
  };

  const removePassword = user => {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  };

  return {
    async register({ email, password, name }) {
      // Validate
      validateEmail(email);

      // Check existence
      await checkUserExists(email);

      // Process
      const hashedPassword = await hashPassword(password);

      // Persist
      const user = await userRepository.create({
        email,
        password: hashedPassword,
        name,
      });

      // Clean and return
      return removePassword(user);
    },
  };
};
```

```javascript
// src/utils/validators.js (NEW)
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.status = 400;
  }
}

const validateEmail = email => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format');
  }
};

const validatePassword = password => {
  if (password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters');
  }

  if (!/[A-Z]/.test(password)) {
    throw new ValidationError('Password must contain uppercase letter');
  }

  if (!/[0-9]/.test(password)) {
    throw new ValidationError('Password must contain number');
  }
};

module.exports = {
  validateEmail,
  validatePassword,
};
```

**Resultado**: Tests siguen PASANDO después del refactor ✅

---

## 🔄 Ejemplo 2: Worker de Procesamiento de Imágenes

### Paso 1: Test de Worker (RED)

```javascript
// tests/unit/workers/image-processor.worker.test.js
const ImageProcessorWorker = require('../../../src/workers/image-processor.worker');

describe('ImageProcessorWorker', () => {
  describe('processJob', () => {
    it('should resize image and upload to storage', async () => {
      // Arrange
      const mockImageService = {
        download: jest.fn().mockResolvedValue(Buffer.from('image-data')),
        resize: jest.fn().mockResolvedValue(Buffer.from('resized-image')),
      };

      const mockStorageService = {
        upload: jest.fn().mockResolvedValue({
          url: 'https://cdn.example.com/resized-image.jpg',
        }),
      };

      const worker = ImageProcessorWorker({
        imageService: mockImageService,
        storageService: mockStorageService,
      });

      const job = {
        id: 'job-123',
        data: {
          imageUrl: 'https://example.com/original.jpg',
          width: 800,
          height: 600,
          userId: 'user-456',
        },
      };

      // Act
      const result = await worker.processJob(job);

      // Assert
      expect(mockImageService.download).toHaveBeenCalledWith('https://example.com/original.jpg');
      expect(mockImageService.resize).toHaveBeenCalledWith(Buffer.from('image-data'), {
        width: 800,
        height: 600,
      });
      expect(mockStorageService.upload).toHaveBeenCalledWith(
        Buffer.from('resized-image'),
        expect.objectContaining({
          userId: 'user-456',
        })
      );
      expect(result).toEqual({
        success: true,
        url: 'https://cdn.example.com/resized-image.jpg',
      });
    });

    it('should be idempotent - skip if already processed', async () => {
      // Arrange
      const mockCache = {
        get: jest.fn().mockResolvedValue('already-processed-url'),
      };

      const mockImageService = {
        download: jest.fn(),
      };

      const worker = ImageProcessorWorker({
        cache: mockCache,
        imageService: mockImageService,
      });

      const job = {
        id: 'job-123',
        data: {
          imageUrl: 'https://example.com/original.jpg',
          idempotencyKey: 'image-123',
        },
      };

      // Act
      const result = await worker.processJob(job);

      // Assert
      expect(mockCache.get).toHaveBeenCalledWith('image-123');
      expect(mockImageService.download).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        url: 'already-processed-url',
        cached: true,
      });
    });

    it('should retry on transient error', async () => {
      // Arrange
      const mockImageService = {
        download: jest.fn().mockRejectedValue(new Error('Network timeout')),
      };

      const worker = ImageProcessorWorker({
        imageService: mockImageService,
      });

      const job = {
        id: 'job-123',
        data: { imageUrl: 'https://example.com/img.jpg' },
        attemptsMade: 1,
        opts: {
          attempts: 3,
        },
      };

      // Act & Assert
      await expect(worker.processJob(job)).rejects.toThrow('Network timeout');

      // Should allow retry
      expect(job.attemptsMade).toBeLessThan(job.opts.attempts);
    });
  });
});
```

**Resultado**: Tests FALLAN ✅

---

### Paso 2: Implementar Worker (GREEN)

```javascript
// src/workers/image-processor.worker.js
module.exports = ({ imageService, storageService, cache }) => {
  return {
    async processJob(job) {
      const { imageUrl, width, height, userId, idempotencyKey } = job.data;

      // Check idempotency
      if (idempotencyKey && cache) {
        const cachedResult = await cache.get(idempotencyKey);
        if (cachedResult) {
          return {
            success: true,
            url: cachedResult,
            cached: true,
          };
        }
      }

      try {
        // Download original image
        const imageBuffer = await imageService.download(imageUrl);

        // Resize image
        const resizedBuffer = await imageService.resize(imageBuffer, {
          width,
          height,
        });

        // Upload to storage
        const uploadResult = await storageService.upload(resizedBuffer, {
          userId,
          filename: `resized-${width}x${height}.jpg`,
        });

        // Cache result
        if (idempotencyKey && cache) {
          await cache.set(idempotencyKey, uploadResult.url, 3600);
        }

        return {
          success: true,
          url: uploadResult.url,
        };
      } catch (error) {
        // Log error
        console.error('Image processing failed:', error);

        // Rethrow to trigger retry
        throw error;
      }
    },
  };
};
```

**Resultado**: Tests PASAN ✅

---

### Paso 3: Configurar Cola con BullMQ

```javascript
// src/queues/image.queue.js
const { Queue, Worker } = require('bullmq');
const ImageProcessorWorker = require('../workers/image-processor.worker');
const imageService = require('../services/image.service');
const storageService = require('../services/storage.service');
const cache = require('../services/cache.service');

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
};

// Create queue
const imageQueue = new Queue('image-processing', { connection });

// Create worker
const worker = new Worker(
  'image-processing',
  async job => {
    const processor = ImageProcessorWorker({
      imageService,
      storageService,
      cache,
    });

    return await processor.processJob(job);
  },
  {
    connection,
    concurrency: 5,
    limiter: {
      max: 10,
      duration: 1000,
    },
  }
);

// Event handlers
worker.on('completed', job => {
  console.log(`Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err.message);
});

module.exports = {
  imageQueue,
  worker,
};
```

---

## 📊 Ejemplo 3: Middleware de Validación

### Paso 1: Test de Middleware (RED)

```javascript
// tests/unit/middleware/validation.test.js
const { validateUserRegistration } = require('../../../src/middleware/validation');

describe('Validation Middleware', () => {
  describe('validateUserRegistration', () => {
    it('should call next() when data is valid', () => {
      // Arrange
      const req = {
        body: {
          email: 'test@test.com',
          password: 'SecurePass123!',
          name: 'John Doe',
        },
      };
      const res = {};
      const next = jest.fn();

      // Act
      validateUserRegistration(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith();
    });

    it('should return 400 when email is missing', () => {
      // Arrange
      const req = {
        body: {
          password: 'SecurePass123!',
          name: 'John Doe',
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      // Act
      validateUserRegistration(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Email is required',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should sanitize email before validation', () => {
      // Arrange
      const req = {
        body: {
          email: '  TEST@TEST.COM  ',
          password: 'SecurePass123!',
          name: 'John Doe',
        },
      };
      const res = {};
      const next = jest.fn();

      // Act
      validateUserRegistration(req, res, next);

      // Assert
      expect(req.body.email).toBe('test@test.com');
      expect(next).toHaveBeenCalled();
    });
  });
});
```

**Resultado**: Tests FALLAN ✅

---

### Paso 2: Implementar Middleware (GREEN)

```javascript
// src/middleware/validation.js
const validateUserRegistration = (req, res, next) => {
  const { email, password, name } = req.body;

  // Validate email
  if (!email) {
    return res.status(400).json({
      error: 'Email is required',
    });
  }

  // Sanitize email
  req.body.email = email.trim().toLowerCase();

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(req.body.email)) {
    return res.status(400).json({
      error: 'Invalid email format',
    });
  }

  // Validate password
  if (!password) {
    return res.status(400).json({
      error: 'Password is required',
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      error: 'Password must be at least 8 characters',
    });
  }

  // Validate name
  if (!name) {
    return res.status(400).json({
      error: 'Name is required',
    });
  }

  next();
};

module.exports = {
  validateUserRegistration,
};
```

**Resultado**: Tests PASAN ✅

---

## 🎓 Lecciones Aprendidas

### DO's ✅

1. **Escribir test primero SIEMPRE**
2. **Test pequeños e independientes**
3. **Nombres descriptivos** (`it('should X when Y')`)
4. **Un concepto por test**
5. **Arrange-Act-Assert** claro
6. **Mock solo dependencias externas**
7. **Tests rápidos** (< 1 segundo)

### DON'Ts ❌

1. **No escribir código antes del test**
2. **No tests interdependientes**
3. **No mockear código interno**
4. **No tests genéricos** ('should work')
5. **No múltiples asserts no relacionados**
6. **No tests sin asserts**
7. **No ignorar tests que fallan**

---

## 📚 Plantillas Útiles

### Plantilla de Test Unitario

```javascript
describe('ComponentName', () => {
  describe('methodName', () => {
    it('should [expected behavior] when [condition]', () => {
      // Arrange
      const input = ...;
      const expected = ...;

      // Act
      const result = methodName(input);

      // Assert
      expect(result).toBe(expected);
    });
  });
});
```

### Plantilla de Test de Integración

```javascript
describe('Feature Integration', () => {
  beforeAll(async () => {
    await setupTestEnvironment();
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  beforeEach(async () => {
    await clearTestData();
  });

  it('should [complete workflow description]', async () => {
    // Arrange
    await seedTestData();

    // Act
    const result = await performIntegrationAction();

    // Assert
    expect(result).toMatchObject(expectedShape);
    await verifyDatabaseState();
  });
});
```

---

**Fin de la Guía Práctica**

Para más ejemplos, consulta: `/docs/inventario/tdd-methodology/`
