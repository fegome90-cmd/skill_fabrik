# 🧪 Metodología TDD para Routers, Daemons y PM2

## 📚 Filosofía del Método

Este método de trabajo TDD está diseñado específicamente para proyectos que implementan:

- **Routers** con arquitectura limpia
- **Daemons/Workers** para procesamiento asíncrono
- **Gestión con PM2** para producción

### Principios Fundamentales

1. **Test First, Always**: Escribir el test ANTES del código
2. **Red-Green-Refactor**: El ciclo sagrado de TDD
3. **Test de Integración vs Unitarios**: Saber cuándo usar cada uno
4. **Mocks Inteligentes**: Solo mockear dependencias externas
5. **Coverage != Calidad**: Buscar 80%+ pero con tests significativos

---

## 🔄 El Ciclo TDD Adaptado

### Ciclo Básico (Red-Green-Refactor)

```
┌─────────────┐
│   1. RED    │  ← Escribir test que FALLA
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  2. GREEN   │  ← Implementar código MÍNIMO para pasar
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 3. REFACTOR │  ← Mejorar sin cambiar funcionalidad
└──────┬──────┘
       │
       └──────► (repetir)
```

### Flujo de Trabajo Específico para Router/Daemon

```
1. Escribir test de contrato (API contract)
   ↓
2. Test de ruta (routing test)
   ↓
3. Test de controlador (controller test)
   ↓
4. Test de servicio (service test)
   ↓
5. Test de integración (integration test)
   ↓
6. Test de daemon/worker (daemon test)
   ↓
7. Test E2E (opcional para casos críticos)
```

---

## 🏗️ Estructura de Testing por Capas

### Layer 1: Tests de Routers

**Propósito**: Verificar que las rutas mapean correctamente a los controladores

**Estrategia**:

- Mock de controladores
- Verificar códigos HTTP
- Validar parámetros y query strings
- Comprobar middleware de validación

**Ejemplo de Test**:

```javascript
// tests/routes/users.test.js
describe('User Routes', () => {
  describe('GET /api/users/:id', () => {
    it('should call getUserById controller', async () => {
      const mockController = jest.fn().mockResolvedValue({});

      // Arrange
      const app = setupTestApp({
        getUserById: mockController,
      });

      // Act
      const res = await request(app).get('/api/users/123');

      // Assert
      expect(mockController).toHaveBeenCalledWith(
        expect.objectContaining({ params: { id: '123' } }),
        expect.anything(),
        expect.anything()
      );
    });
  });
});
```

**Checklist de Router Tests**:

- [ ] Todas las rutas tienen tests
- [ ] Códigos HTTP correctos (200, 201, 404, 500)
- [ ] Validación de parámetros
- [ ] Middleware se ejecuta en orden
- [ ] Rutas protegidas requieren autenticación

---

### Layer 2: Tests de Controladores

**Propósito**: Verificar orquestación y manejo de req/res

**Estrategia**:

- Mock de servicios
- No mock de req/res (usar objetos reales o supertest)
- Verificar llamadas a servicios
- Validar formato de respuestas

**Ejemplo de Test**:

```javascript
// tests/controllers/user.controller.test.js
describe('UserController', () => {
  describe('getUserById', () => {
    it('should return user data when found', async () => {
      // Arrange
      const mockService = {
        findById: jest.fn().mockResolvedValue({
          id: '123',
          name: 'John Doe',
          email: 'john@example.com',
        }),
      };

      const controller = UserController(mockService);
      const req = { params: { id: '123' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      // Act
      await controller.getUserById(req, res);

      // Assert
      expect(mockService.findById).toHaveBeenCalledWith('123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        id: '123',
        name: 'John Doe',
        email: 'john@example.com',
      });
    });

    it('should return 404 when user not found', async () => {
      // Arrange
      const mockService = {
        findById: jest.fn().mockResolvedValue(null),
      };

      const controller = UserController(mockService);
      const req = { params: { id: '999' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      // Act
      await controller.getUserById(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'User not found',
      });
    });
  });
});
```

**Checklist de Controller Tests**:

- [ ] Casos de éxito (happy path)
- [ ] Manejo de errores del servicio
- [ ] Validación de entrada
- [ ] Códigos de estado HTTP apropiados
- [ ] Formato de respuesta consistente
- [ ] No contiene lógica de negocio

---

### Layer 3: Tests de Servicios

**Propósito**: Verificar lógica de negocio pura

**Estrategia**:

- Mock de modelos/repositorios
- No mock de utilidades internas
- Foco en lógica de negocio
- Tests exhaustivos de edge cases

**Ejemplo de Test**:

```javascript
// tests/services/user.service.test.js
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with hashed password', async () => {
      // Arrange
      const mockRepository = {
        create: jest.fn().mockResolvedValue({
          id: '1',
          email: 'test@test.com',
          password: 'hashed_password',
        }),
        findByEmail: jest.fn().mockResolvedValue(null),
      };

      const service = UserService(mockRepository);

      // Act
      const result = await service.createUser({
        email: 'test@test.com',
        password: 'plain_password',
      });

      // Assert
      expect(mockRepository.findByEmail).toHaveBeenCalledWith('test@test.com');
      expect(mockRepository.create).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: expect.not.stringContaining('plain_password'),
      });
      expect(result.password).not.toBe('plain_password');
    });

    it('should throw error if email already exists', async () => {
      // Arrange
      const mockRepository = {
        findByEmail: jest.fn().mockResolvedValue({ id: '1' }),
      };

      const service = UserService(mockRepository);

      // Act & Assert
      await expect(
        service.createUser({
          email: 'existing@test.com',
          password: 'password',
        })
      ).rejects.toThrow('Email already exists');
    });
  });
});
```

**Checklist de Service Tests**:

- [ ] Lógica de negocio completa
- [ ] Casos edge (null, undefined, empty)
- [ ] Validaciones de negocio
- [ ] Transformaciones de datos
- [ ] Manejo de errores de repositorio
- [ ] Idempotencia cuando aplique

---

### Layer 4: Tests de Modelos/Repositorios

**Propósito**: Verificar interacción con BD

**Estrategia**:

- Usar BD en memoria (sqlite) o contenedor de prueba
- Tests de integración real con BD
- Verificar queries y constraints
- Limpiar BD entre tests

**Ejemplo de Test**:

```javascript
// tests/models/user.model.test.js
describe('User Model', () => {
  beforeEach(async () => {
    await setupTestDatabase();
  });

  afterEach(async () => {
    await clearTestDatabase();
  });

  describe('create', () => {
    it('should insert user into database', async () => {
      // Arrange
      const userData = {
        email: 'test@test.com',
        password: 'hashed_pw',
        name: 'Test User',
      };

      // Act
      const user = await UserModel.create(userData);

      // Assert
      expect(user.id).toBeDefined();
      expect(user.email).toBe('test@test.com');

      // Verify in DB
      const foundUser = await UserModel.findById(user.id);
      expect(foundUser).toBeTruthy();
    });

    it('should enforce unique email constraint', async () => {
      // Arrange
      await UserModel.create({
        email: 'duplicate@test.com',
        password: 'pw',
      });

      // Act & Assert
      await expect(
        UserModel.create({
          email: 'duplicate@test.com',
          password: 'pw',
        })
      ).rejects.toThrow();
    });
  });
});
```

**Checklist de Model Tests**:

- [ ] CRUD operations
- [ ] Constraints de BD (unique, foreign keys)
- [ ] Validaciones de esquema
- [ ] Queries complejas
- [ ] Transacciones si aplica

---

### Layer 5: Tests de Daemons/Workers

**Propósito**: Verificar procesamiento asíncrono

**Estrategia**:

- Mock de colas (o usar cola en memoria)
- Verificar idempotencia
- Simular reintentos
- Probar manejo de errores

**Ejemplo de Test**:

```javascript
// tests/workers/email.worker.test.js
describe('Email Worker', () => {
  describe('processEmailJob', () => {
    it('should send email and mark job as complete', async () => {
      // Arrange
      const mockEmailService = {
        send: jest.fn().mockResolvedValue(true),
      };

      const mockJob = {
        data: {
          to: 'user@example.com',
          subject: 'Test',
          body: 'Test email',
        },
        id: 'job-123',
        attemptsMade: 0,
      };

      const worker = EmailWorker(mockEmailService);

      // Act
      await worker.processEmailJob(mockJob);

      // Assert
      expect(mockEmailService.send).toHaveBeenCalledWith({
        to: 'user@example.com',
        subject: 'Test',
        body: 'Test email',
      });
    });

    it('should be idempotent - not send duplicate emails', async () => {
      // Arrange
      const mockEmailService = {
        send: jest.fn().mockResolvedValue(true),
        checkSent: jest.fn().mockResolvedValue(true), // Already sent
      };

      const mockJob = {
        data: {
          idempotencyKey: 'email-abc-123',
          to: 'user@example.com',
        },
      };

      const worker = EmailWorker(mockEmailService);

      // Act
      await worker.processEmailJob(mockJob);

      // Assert
      expect(mockEmailService.checkSent).toHaveBeenCalled();
      expect(mockEmailService.send).not.toHaveBeenCalled();
    });

    it('should retry on transient failures', async () => {
      // Arrange
      const mockEmailService = {
        send: jest
          .fn()
          .mockRejectedValueOnce(new Error('Temporary failure'))
          .mockResolvedValueOnce(true),
      };

      const mockJob = {
        data: { to: 'user@example.com' },
        attemptsMade: 0,
        retry: jest.fn(),
      };

      const worker = EmailWorker(mockEmailService);

      // Act
      try {
        await worker.processEmailJob(mockJob);
      } catch (e) {
        // Should throw to trigger retry
      }

      // Assert
      expect(mockJob.retry).toHaveBeenCalled();
    });
  });
});
```

**Checklist de Daemon Tests**:

- [ ] Procesamiento exitoso
- [ ] Idempotencia verificada
- [ ] Reintentos con backoff
- [ ] Manejo de Dead Letter Queue
- [ ] Errores transitorios vs permanentes
- [ ] Logging de eventos importantes

---

## 🎭 Estrategias de Mocking

### ¿Qué Mockear?

**✅ SIEMPRE mockear**:

- Servicios externos (APIs de terceros)
- Bases de datos (en tests unitarios)
- Colas de mensajes (en tests unitarios)
- Servicios de email/SMS
- Sistema de archivos
- Tiempo (Date.now, setTimeout)

**❌ NUNCA mockear**:

- Código propio (servicios internos)
- Utilidades puras (helpers, formatters)
- Objetos de dominio
- Request/Response en tests de controlador

### Patrones de Mock

**Dependency Injection**:

```javascript
// ✅ BUENO - Fácil de testear
function UserService(repository, emailService) {
  return {
    async createUser(data) {
      const user = await repository.create(data);
      await emailService.sendWelcome(user.email);
      return user;
    },
  };
}

// ❌ MALO - Difícil de testear
function UserService() {
  const repository = new UserRepository(); // Hard-coded
  return {
    async createUser(data) {
      return await repository.create(data);
    },
  };
}
```

---

## 📊 Métricas y Coverage

### Coverage Targets

| Capa        | Target | Crítico |
| ----------- | ------ | ------- |
| Routers     | 90%+   | ✅      |
| Controllers | 85%+   | ✅      |
| Services    | 95%+   | ✅✅    |
| Models      | 80%+   | ✅      |
| Workers     | 90%+   | ✅✅    |
| Utils       | 100%   | ✅      |

### Comandos de Coverage

```bash
# Coverage completo
npm test -- --coverage

# Coverage por capa
npm test tests/services -- --coverage
npm test tests/controllers -- --coverage

# Reporte HTML
npm test -- --coverage --coverageReporters=html

# Coverage watchdog
npm test -- --coverage --watchAll
```

### Interpretar Resultados

**Coverage NO es todo**:

- 100% coverage con tests malos = falsa seguridad
- 70% coverage con tests buenos > 90% coverage con tests malos

**Indicadores de calidad**:

- ✅ Tests fallan cuando el código cambia
- ✅ Tests son legibles y auto-documentan
- ✅ Tests no son frágiles (no rompen con cambios menores)
- ✅ Tests corren rápido (< 1 segundo unitarios)

---

## 🚀 Workflow de Desarrollo TDD

### Día a Día

```bash
# 1. Crear nueva feature branch
git checkout -b feature/user-registration

# 2. Escribir test (RED)
# tests/services/user.service.test.js
# describe('registerUser', () => { ... })

# 3. Correr test (debe fallar)
npm test -- tests/services/user.service.test.js

# 4. Implementar código mínimo (GREEN)
# src/services/user.service.js

# 5. Correr test (debe pasar)
npm test -- tests/services/user.service.test.js

# 6. Refactor
# Mejorar código sin cambiar funcionalidad

# 7. Correr todos los tests
npm test

# 8. Commit
git add .
git commit -m "feat: add user registration"

# 9. Repetir para siguiente pieza
```

### Pre-commit Hook

```bash
# .husky/pre-commit
#!/bin/sh

# Correr tests
npm test

# Verificar coverage
npm test -- --coverage --coverageThreshold='{"global":{"branches":80,"functions":80,"lines":80}}'

# Lint
npm run lint

# Si algo falla, no permitir commit
```

---

## 🎯 Casos de Uso Específicos

### Caso 1: Endpoint de API REST

**Orden de implementación TDD**:

1. **Test de contrato** (API contract)

```javascript
describe('POST /api/users', () => {
  it('should return 201 with user object', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ email: 'test@test.com', password: 'pass123' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('email', 'test@test.com');
    expect(res.body).not.toHaveProperty('password');
  });
});
```

2. **Test de ruta**

```javascript
describe('User Routes', () => {
  it('should route POST /api/users to createUser controller', () => {
    // ...
  });
});
```

3. **Test de controlador**

```javascript
describe('UserController.createUser', () => {
  it('should call service and return 201', () => {
    // ...
  });
});
```

4. **Test de servicio**

```javascript
describe('UserService.createUser', () => {
  it('should hash password and save user', () => {
    // ...
  });
});
```

5. **Test de modelo**

```javascript
describe('UserModel.create', () => {
  it('should insert user into database', () => {
    // ...
  });
});
```

### Caso 2: Worker de Cola

**Orden de implementación TDD**:

1. **Test de procesamiento básico**

```javascript
describe('ProcessImageWorker', () => {
  it('should process image job successfully', () => {
    // ...
  });
});
```

2. **Test de idempotencia**

```javascript
it('should not process same image twice', () => {
  // ...
});
```

3. **Test de reintentos**

```javascript
it('should retry on transient errors', () => {
  // ...
});
```

4. **Test de DLQ**

```javascript
it('should move to DLQ after max retries', () => {
  // ...
});
```

### Caso 3: Middleware de Validación

**Orden de implementación TDD**:

1. **Test de validación exitosa**

```javascript
describe('validateUserInput middleware', () => {
  it('should call next() when input is valid', () => {
    // ...
  });
});
```

2. **Test de validación fallida**

```javascript
it('should return 400 when email is invalid', () => {
  // ...
});
```

3. **Test de sanitización**

```javascript
it('should sanitize input before validation', () => {
  // ...
});
```

---

## 📚 Recursos y Referencias

### Librerías de Testing

**Esenciales**:

- **Jest**: Framework principal
- **Supertest**: Testing de APIs HTTP
- **@faker-js/faker**: Datos de prueba
- **nock**: Mock de HTTP requests

**Para Workers**:

- **bull-board**: UI para colas Bull
- **ioredis-mock**: Mock de Redis
- **testcontainers**: Contenedores Docker para tests

### Comandos npm Recomendados

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest tests/unit",
    "test:integration": "jest tests/integration",
    "test:e2e": "jest tests/e2e",
    "test:routes": "jest tests/routes",
    "test:controllers": "jest tests/controllers",
    "test:services": "jest tests/services",
    "test:workers": "jest tests/workers"
  }
}
```

### Estructura de Carpetas

```
project/
├── src/
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   ├── models/
│   ├── workers/
│   └── utils/
└── tests/
    ├── unit/
    │   ├── services/
    │   ├── controllers/
    │   └── utils/
    ├── integration/
    │   ├── routes/
    │   └── models/
    ├── workers/
    └── e2e/
```

---

## ✅ Checklist Final por Feature

Antes de considerar una feature completa:

**Tests**:

- [ ] Tests unitarios de servicio
- [ ] Tests de controlador
- [ ] Tests de ruta
- [ ] Tests de modelo (si aplica)
- [ ] Tests de worker (si aplica)
- [ ] Coverage > 80%

**Código**:

- [ ] Separation of concerns (MVC/S)
- [ ] Sin lógica de negocio en controladores
- [ ] Funciones puras donde sea posible
- [ ] Manejo de errores centralizado
- [ ] Logging estructurado

**Documentación**:

- [ ] JSDoc en funciones públicas
- [ ] README actualizado
- [ ] Swagger/OpenAPI actualizado
- [ ] Ejemplos de uso

**DevOps**:

- [ ] PM2 ecosystem.config.js actualizado
- [ ] Variables de entorno documentadas
- [ ] Healthcheck funcional
- [ ] Métricas expuestas

---

## 🎓 Principios para Recordar

1. **Test First**: El test ES la especificación
2. **Baby Steps**: Un test pequeño a la vez
3. **Red-Green-Refactor**: No saltar pasos
4. **Tests como documentación**: Deben ser legibles
5. **Mock lo externo**: No mock lo interno
6. **Tests rápidos**: < 1s unitarios, < 10s integración
7. **Un assert por test**: (o pocos relacionados)
8. **Nombres descriptivos**: `it('should X when Y')`
9. **Arrange-Act-Assert**: Estructura clara
10. **DRY en tests**: Pero prefiere claridad sobre brevedad

---

## 🚨 Anti-Patrones a Evitar

❌ **Tests que prueban implementación**:

```javascript
// MALO
expect(service.internalHelper).toHaveBeenCalled();

// BUENO
expect(result).toBe(expectedOutput);
```

❌ **Tests frágiles**:

```javascript
// MALO - Se rompe si cambia orden
expect(array[0]).toBe('first');

// BUENO
expect(array).toContain('first');
```

❌ **Tests sin asserts**:

```javascript
// MALO
it('should process data', async () => {
  await service.process(data);
  // ¿Y qué se espera?
});

// BUENO
it('should process data', async () => {
  const result = await service.process(data);
  expect(result.status).toBe('success');
});
```

❌ **Tests dependientes**:

```javascript
// MALO - Test 2 depende de Test 1
it('test 1: should create user', ...);
it('test 2: should find created user', ...);

// BUENO - Tests independientes
it('should create user', ...);
it('should find user when exists', ...);
```

---

**Última actualización**: 2025-01-13
**Versión**: 1.0.0
**Autor**: [Tu nombre]
**Licencia**: MIT
