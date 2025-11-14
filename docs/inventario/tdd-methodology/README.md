# 📋 TDD para Routers y Daemons - Resumen Ejecutivo

## 🎯 Objetivo

Este conjunto de documentos establece una **metodología TDD completa y práctica** para proyectos Node.js que implementan:

- **Routers** con arquitectura limpia (MVC/S)
- **Daemons/Workers** para procesamiento asíncrono
- **Gestión con PM2** para producción

---

## 📚 Documentos Disponibles

### 1. TDD_METHODOLOGY.md

**Propósito**: Framework teórico y metodológico

**Contenido**:

- Ciclo Red-Green-Refactor adaptado
- Testing por capas (Router → Controller → Service → Model → Worker)
- Estrategias de mocking
- Métricas y coverage
- Workflow día a día
- Principios y anti-patrones

**Cuándo usar**: Para entender la filosofía y el método general

---

### 2. TDD_PRACTICAL_EXAMPLES.md

**Propósito**: Implementación paso a paso

**Contenido**:

- Ejemplo completo de endpoint REST (11 pasos)
- Ejemplo de Worker con cola
- Ejemplo de Middleware de validación
- Código real con tests
- Ciclo Red-Green-Refactor en acción

**Cuándo usar**: Cuando vayas a implementar una nueva feature

---

### 3. TDD_SETUP_CONFIG.md

**Propósito**: Configuración y herramientas

**Contenido**:

- Estructura de carpetas
- package.json completo
- jest.config.js
- Helpers de test (DB, Redis)
- Mocks y fixtures
- CI/CD con GitHub Actions
- ESLint, Prettier, Husky
- PM2 ecosystem.config.js

**Cuándo usar**: Al iniciar un proyecto nuevo o configurar el ambiente

---

## 🚀 Quick Start

### Setup Inicial (5 minutos)

```bash
# 1. Crear proyecto
mkdir my-tdd-project && cd my-tdd-project
npm init -y

# 2. Instalar dependencias
npm install express bcrypt jsonwebtoken dotenv winston knex pg bullmq ioredis

# 3. Instalar dev dependencies
npm install -D jest supertest @faker-js/faker nock nodemon eslint prettier husky sqlite3 ioredis-mock

# 4. Copiar configuraciones
# - jest.config.js
# - .env.test
# - ecosystem.config.js
# - .eslintrc.js

# 5. Crear estructura de carpetas
mkdir -p src/{routes,controllers,services,models,repositories,workers,queues,middleware,utils,config}
mkdir -p tests/{unit,integration,e2e,helpers,fixtures,mocks}

# 6. Primer test
npm test
```

---

## 🔄 Workflow TDD Diario

```
1. Feature branch
   ↓
2. Escribir test (RED)
   ↓
3. Correr test → ❌ FALLA
   ↓
4. Código mínimo (GREEN)
   ↓
5. Correr test → ✅ PASA
   ↓
6. Refactorizar
   ↓
7. Tests siguen pasando → ✅
   ↓
8. Commit + Push
```

---

## 📊 Orden de Implementación por Feature

### Para un Endpoint REST:

```
1. Test de API (contrato)          → tests/integration/
2. Test de Router                  → tests/unit/routes/
3. Test de Controller              → tests/unit/controllers/
4. Test de Service                 → tests/unit/services/
5. Test de Repository              → tests/integration/repositories/
```

### Para un Worker:

```
1. Test de procesamiento           → tests/unit/workers/
2. Test de idempotencia            → tests/unit/workers/
3. Test de reintentos              → tests/unit/workers/
4. Test de DLQ                     → tests/unit/workers/
5. Test de integración con cola    → tests/integration/queues/
```

---

## 🎯 Principios Clave

### ✅ SIEMPRE

1. **Test First**: Escribir test ANTES del código
2. **Red-Green-Refactor**: Seguir el ciclo completo
3. **Tests pequeños**: Un concepto por test
4. **Nombres claros**: `it('should X when Y')`
5. **Arrange-Act-Assert**: Estructura consistente
6. **Mock externo**: Solo dependencias externas
7. **Tests rápidos**: < 1 segundo unitarios

### ❌ NUNCA

1. **Código antes del test**: Viola TDD
2. **Tests interdependientes**: Cada test aislado
3. **Mock código interno**: Solo externo
4. **Tests genéricos**: Sin valor
5. **Múltiples asserts**: Sin relación
6. **Ignorar tests fallidos**: Fix inmediato
7. **Tests sin asserts**: No verifican nada

---

## 📈 Métricas de Calidad

### Coverage Targets

| Capa        | Mínimo | Ideal |
| ----------- | ------ | ----- |
| Services    | 90%    | 95%+  |
| Controllers | 80%    | 90%+  |
| Workers     | 85%    | 95%+  |
| Routers     | 85%    | 90%+  |
| Utils       | 95%    | 100%  |

### Indicadores de Salud

✅ **Tests pasan** en < 10 segundos total  
✅ **Coverage** > 80% global  
✅ **Tests fallan** cuando código cambia  
✅ **CI/CD verde** en cada PR  
✅ **0 tests** ignorados o skipped

---

## 🛠️ Comandos Esenciales

```bash
# Testing
npm test                      # Todos los tests
npm run test:watch           # Watch mode
npm run test:coverage        # Con coverage
npm run test:unit            # Solo unitarios
npm run test:integration     # Solo integración
npm run test:ci              # Para CI/CD

# PM2
npm run pm2:start            # Iniciar
npm run pm2:reload           # Zero-downtime
npm run pm2:logs             # Ver logs
npm run pm2:monit            # Monitor

# Linting
npm run lint                 # Verificar
npm run lint:fix             # Corregir automático
npm run format               # Prettier

# Database
npm run db:migrate           # Migrar
npm run db:rollback          # Rollback
npm run db:seed              # Seed
```

---

## 🎓 Patrones Comunes

### Test de Controller

```javascript
describe('UserController', () => {
  it('should call service and return 201', async () => {
    // Arrange
    const mockService = { register: jest.fn().mockResolvedValue(user) };
    const controller = UserController(mockService);

    // Act
    await controller.register(req, res, next);

    // Assert
    expect(mockService.register).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });
});
```

### Test de Service

```javascript
describe('UserService', () => {
  it('should hash password and create user', async () => {
    // Arrange
    const mockRepo = { create: jest.fn(), findByEmail: jest.fn() };
    const service = UserService(mockRepo);

    // Act
    const result = await service.register(userData);

    // Assert
    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        password: expect.not.stringContaining('plain'),
      })
    );
  });
});
```

### Test de Worker

```javascript
describe('EmailWorker', () => {
  it('should be idempotent', async () => {
    // Arrange
    const mockCache = { get: jest.fn().mockResolvedValue('sent') };
    const mockEmail = { send: jest.fn() };
    const worker = EmailWorker({ cache: mockCache, email: mockEmail });

    // Act
    await worker.process(job);

    // Assert
    expect(mockEmail.send).not.toHaveBeenCalled();
  });
});
```

---

## 🚨 Troubleshooting Común

### Tests muy lentos

**Problema**: Tests toman > 30 segundos  
**Solución**:

- Usar SQLite en memoria
- Mock de servicios externos
- Separar unit vs integration
- Correr en paralelo

### Coverage bajo

**Problema**: Coverage < 70%  
**Solución**:

- Identificar capas sin tests
- Focus en services primero
- Agregar edge cases
- Tests de error handling

### Tests frágiles

**Problema**: Se rompen con cambios menores  
**Solución**:

- No testear implementación
- Mock solo externo
- Usar `expect.objectContaining`
- Tests de comportamiento, no estructura

### Mocks complejos

**Problema**: Setup de mocks muy largo  
**Solución**:

- Crear factory de mocks
- Usar fixtures
- Dependency injection
- Helpers reutilizables

---

## 📚 Referencias Rápidas

### Documentación Completa

1. **TDD_METHODOLOGY.md**: Teoría y principios
2. **TDD_PRACTICAL_EXAMPLES.md**: Código real
3. **TDD_SETUP_CONFIG.md**: Configuración

### Documentos Base del Proyecto

1. **Router-2.docx**: Arquitectura de routers
2. **Routers, Daemons y PM2.docx**: Guía completa

### Herramientas

- **Jest**: Testing framework
- **Supertest**: API testing
- **Faker**: Test data
- **PM2**: Process management
- **BullMQ**: Job queues

---

## ✅ Checklist Pre-Production

### Tests

- [ ] Coverage > 80%
- [ ] Todos los tests pasan
- [ ] 0 tests skipped
- [ ] CI/CD configurado
- [ ] Tests de integración
- [ ] Tests E2E críticos

### Código

- [ ] ESLint sin errores
- [ ] Prettier aplicado
- [ ] Sin console.log
- [ ] Error handling completo
- [ ] Logging estructurado
- [ ] Separation of concerns

### PM2

- [ ] ecosystem.config.js
- [ ] Cluster mode para API
- [ ] Workers configurados
- [ ] Logs rotativos
- [ ] Max memory restart
- [ ] Healthchecks

### DevOps

- [ ] Variables de entorno
- [ ] Secrets seguros
- [ ] Backups de BD
- [ ] Monitoreo activo
- [ ] Alertas configuradas
- [ ] Documentación actualizada

---

## 🎯 Próximos Pasos

1. **Día 1**: Configurar ambiente
   - Instalar dependencias
   - Copiar configs
   - Crear estructura

2. **Día 2-3**: Primer feature con TDD
   - Seguir TDD_PRACTICAL_EXAMPLES.md
   - Implementar endpoint completo
   - Verificar coverage

3. **Día 4-5**: Workers y colas
   - Implementar primer worker
   - Tests de idempotencia
   - Integrar con PM2

4. **Semana 2**: Consolidar
   - Refactorizar código
   - Mejorar coverage
   - Documentar patrones

5. **Ongoing**: Mantener disciplina
   - Test first siempre
   - Review de PRs estricto
   - Monitorear métricas

---

## 💡 Tips Finales

1. **Empieza pequeño**: Un endpoint a la vez
2. **Consistencia > Perfección**: Mejor 80% coverage real que 100% falso
3. **Tests son documentación**: Escribe tests legibles
4. **Refactor con confianza**: Los tests te protegen
5. **CI/CD obligatorio**: No merge sin tests verdes
6. **Review de tests**: Tan importante como review de código
7. **Aprender de fallos**: Cada bug es un test missing

---

## 🎓 Recursos Adicionales

### Libros Recomendados

- Test Driven Development: By Example (Kent Beck)
- Clean Code (Robert C. Martin)
- The Art of Unit Testing (Roy Osherove)

### Cursos

- Jest Crash Course
- TDD with Node.js
- PM2 Production Deployment

### Comunidad

- Stack Overflow: [jest] [tdd]
- Reddit: r/node, r/javascript
- Discord: Node.js, Jest

---

**¡Éxito con TDD! 🚀**

_Última actualización: 2025-01-13_  
_Versión: 1.0.0_  
_Proyecto: skills-fabrik/inventario_
