# 🗓️ Roadmap de Implementación TDD - Plan de 4 Semanas

## 📋 Resumen Ejecutivo

Este roadmap te guía desde **cero hasta un proyecto completamente funcional con TDD** en 4 semanas.

**Dedicación sugerida**: 2-3 horas diarias  
**Nivel inicial**: Conocimientos básicos de Node.js  
**Nivel final**: TDD como práctica estándar

---

## 🎯 Objetivos por Semana

| Semana | Objetivo Principal  | Entregables                       |
| ------ | ------------------- | --------------------------------- |
| 1      | Setup y Fundamentos | Ambiente configurado, primer test |
| 2      | Features con TDD    | 3 endpoints completos con tests   |
| 3      | Workers y Async     | Workers funcionando con colas     |
| 4      | Producción          | Deploy con PM2 y CI/CD            |

---

## 📅 Semana 1: Setup y Fundamentos

### Día 1: Configuración Inicial (3 horas)

**AM - Setup del Proyecto**

```bash
# Tiempo: 1 hora
✓ Crear proyecto Node.js
✓ Instalar dependencias
✓ Configurar Git
✓ Crear estructura de carpetas
```

**Checklist**:

- [ ] `npm init -y`
- [ ] Instalar dependencies (`express`, `bcrypt`, etc.)
- [ ] Instalar devDependencies (`jest`, `supertest`, etc.)
- [ ] Crear estructura `/src` y `/tests`
- [ ] Git init y primer commit

**Referencias**:

- TDD_SETUP_CONFIG.md → Sección 1 (Estructura)
- TDD_SETUP_CONFIG.md → package.json

**PM - Configuración de Jest**

```bash
# Tiempo: 2 horas
✓ jest.config.js
✓ Helpers de test
✓ Primer test pasando
```

**Checklist**:

- [ ] Copiar `jest.config.js`
- [ ] Crear `tests/helpers/setup.js`
- [ ] Crear `tests/helpers/db.js`
- [ ] Escribir y correr primer test básico
- [ ] Verificar `npm test` funciona

**Referencias**:

- TDD_SETUP_CONFIG.md → Sección 2 (Configuración)
- TDD_SETUP_CONFIG.md → Sección 3 (Helpers)

**Entregable Día 1**: Proyecto configurado con Jest funcionando ✅

---

### Día 2: Primer Test Real (3 horas)

**AM - Entender TDD**

```bash
# Tiempo: 1 hora
✓ Leer metodología
✓ Entender ciclo Red-Green-Refactor
✓ Conocer las capas de testing
```

**Checklist**:

- [ ] Leer TDD_METHODOLOGY.md → Sección 1-2
- [ ] Entender el ciclo básico
- [ ] Identificar las 5 capas de testing

**Referencias**:

- TDD_METHODOLOGY.md → Ciclo TDD
- README.md → Workflow diario

**PM - Implementar Endpoint Simple**

```bash
# Tiempo: 2 horas
✓ Test de GET /health (RED)
✓ Implementar endpoint (GREEN)
✓ Refactorizar (REFACTOR)
```

**Checklist**:

- [ ] Escribir test de healthcheck
- [ ] Ver test fallar (RED)
- [ ] Implementar código mínimo
- [ ] Ver test pasar (GREEN)
- [ ] Refactorizar si necesario

**Referencias**:

- TDD_PRACTICAL_EXAMPLES.md → Plantillas

**Código Ejemplo**:

```javascript
// tests/integration/health.test.js
describe('GET /health', () => {
  it('should return 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

// src/app.js
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});
```

**Entregable Día 2**: Primer endpoint con test pasando ✅

---

### Día 3-4: Endpoint CRUD Básico (6 horas)

**Día 3 AM - Tests de Ruta y Controller**

```bash
# Tiempo: 3 horas
✓ Test de ruta POST /users (RED)
✓ Test de controller (RED)
✓ Implementar (GREEN)
```

**Día 3 PM - Tests de Service**

```bash
# Tiempo: 3 horas
✓ Test de service (RED)
✓ Implementar lógica de negocio (GREEN)
✓ Refactorizar
```

**Día 4 - Repository y Coverage**

```bash
# Tiempo: 6 horas (dividir AM/PM)
✓ Test de repository con DB
✓ Implementar queries
✓ Integración completa
✓ Coverage > 80%
```

**Referencias**:

- TDD_PRACTICAL_EXAMPLES.md → Ejemplo 1 (completo)
- TDD_METHODOLOGY.md → Layers 1-4

**Entregable Día 3-4**: Endpoint completo con tests en todas las capas ✅

---

### Día 5: Review y Consolidación (3 horas)

**AM - Refactor y Mejoras**

```bash
# Tiempo: 1.5 horas
✓ Refactorizar código
✓ Mejorar coverage
✓ Eliminar duplicación
```

**PM - Documentación**

```bash
# Tiempo: 1.5 horas
✓ README del proyecto
✓ Documentar API
✓ Diagramas básicos
```

**Checklist**:

- [ ] Tests pasando ✅
- [ ] Coverage > 80% ✅
- [ ] Código limpio ✅
- [ ] README.md del proyecto ✅
- [ ] Commit y push ✅

**Entregable Semana 1**: Proyecto base con TDD funcionando ✅✅✅

---

## 📅 Semana 2: Features con TDD

### Día 6-7: Autenticación (6 horas)

**Feature**: Sistema de login y JWT

**Tasks**:

```bash
Día 6:
✓ POST /auth/register
  - Test de controller
  - Test de service (hash password)
  - Test de repository

Día 7:
✓ POST /auth/login
  - Test de validación
  - Test de generación JWT
  - Test de error cases
```

**Checklist**:

- [ ] Tests de registro completos
- [ ] Tests de login completos
- [ ] Validación de email/password
- [ ] Hash de passwords (bcrypt)
- [ ] Generación de JWT
- [ ] Middleware de auth testeado
- [ ] Coverage > 85%

**Referencias**:

- TDD_PRACTICAL_EXAMPLES.md → Ejemplo 1
- TDD_METHODOLOGY.md → Layer 3 (Services)

---

### Día 8-9: CRUD Completo (6 horas)

**Feature**: Gestión de recursos (ej: Products)

**Tasks**:

```bash
Día 8:
✓ GET /products (list)
✓ GET /products/:id (detail)
✓ Tests de paginación
✓ Tests de filtros

Día 9:
✓ POST /products (create)
✓ PUT /products/:id (update)
✓ DELETE /products/:id (delete)
✓ Tests de autorización
```

**Checklist**:

- [ ] 5 endpoints CRUD
- [ ] Tests de todas las capas
- [ ] Validación de entrada
- [ ] Manejo de errores
- [ ] Paginación funcional
- [ ] Coverage > 85%

---

### Día 10: Middleware y Validación (3 horas)

**Feature**: Sistema de validación robusto

**Tasks**:

```bash
✓ Middleware de validación genérico
✓ Sanitización de inputs
✓ Rate limiting
✓ Logging estructurado
```

**Checklist**:

- [ ] Tests de validación completos
- [ ] Tests de sanitización
- [ ] Tests de rate limiting
- [ ] Middleware reutilizable
- [ ] Coverage 100% en middleware

**Referencias**:

- TDD_PRACTICAL_EXAMPLES.md → Ejemplo 3
- TDD_METHODOLOGY.md → Middleware

**Entregable Semana 2**: API funcional con 8+ endpoints testeados ✅✅✅

---

## 📅 Semana 3: Workers y Async

### Día 11-12: Setup de Colas (6 horas)

**Feature**: Sistema de colas con BullMQ

**Tasks**:

```bash
Día 11:
✓ Configurar Redis
✓ Configurar BullMQ
✓ Primer worker simple
✓ Tests de cola

Día 12:
✓ Queue manager
✓ Worker manager
✓ Dashboard de monitoreo
✓ Tests de integración
```

**Checklist**:

- [ ] Redis en memoria para tests
- [ ] BullMQ configurado
- [ ] Primer job procesándose
- [ ] Tests de encolado
- [ ] Tests de procesamiento
- [ ] Dashboard bull-board

**Referencias**:

- TDD_PRACTICAL_EXAMPLES.md → Ejemplo 2
- TDD_SETUP_CONFIG.md → Redis helper

---

### Día 13-14: Workers Complejos (6 horas)

**Feature**: Workers de procesamiento

**Tasks**:

```bash
Día 13:
✓ Email worker
  - Tests de envío
  - Tests de idempotencia
  - Tests de reintentos

Día 14:
✓ Image processor worker
  - Tests de procesamiento
  - Tests de errores
  - Tests de DLQ
```

**Checklist**:

- [ ] Email worker funcionando
- [ ] Image worker funcionando
- [ ] Idempotencia verificada
- [ ] Reintentos con backoff
- [ ] Dead Letter Queue
- [ ] Tests de integración con cola
- [ ] Coverage > 90% en workers

**Referencias**:

- TDD_METHODOLOGY.md → Layer 5 (Workers)
- TDD_PRACTICAL_EXAMPLES.md → Worker example

---

### Día 15: Integración API + Workers (3 horas)

**Feature**: Flujo completo async

**Tasks**:

```bash
✓ Endpoint encola job
✓ Worker procesa job
✓ Notificación de resultado
✓ Tests E2E
```

**Checklist**:

- [ ] POST /jobs/email encola correctamente
- [ ] Worker procesa y envía email
- [ ] Callback de resultado funciona
- [ ] Test E2E completo
- [ ] Logs estructurados

**Entregable Semana 3**: Sistema async funcionando end-to-end ✅✅✅

---

## 📅 Semana 4: Producción

### Día 16-17: PM2 Setup (6 horas)

**Feature**: Gestión de procesos con PM2

**Tasks**:

```bash
Día 16:
✓ ecosystem.config.js
✓ Cluster mode para API
✓ Fork mode para workers
✓ Log rotation

Día 17:
✓ Zero-downtime deploys
✓ Max memory restart
✓ Healthchecks
✓ Monitoreo
```

**Checklist**:

- [ ] ecosystem.config.js completo
- [ ] API en cluster mode
- [ ] Workers configurados
- [ ] pm2-logrotate instalado
- [ ] pm2 reload funciona
- [ ] Healthchecks respondiendo
- [ ] Monitoreo activo

**Referencias**:

- TDD_SETUP_CONFIG.md → ecosystem.config.js
- Documentos base → PM2 sección

---

### Día 18: CI/CD (3 horas)

**Feature**: Pipeline automatizado

**Tasks**:

```bash
✓ GitHub Actions setup
✓ Tests en CI
✓ Coverage reporting
✓ Auto-deploy
```

**Checklist**:

- [ ] `.github/workflows/test.yml`
- [ ] Tests corren en PR
- [ ] Coverage en Codecov
- [ ] Badge de coverage
- [ ] Deploy automático

**Referencias**:

- TDD_SETUP_CONFIG.md → CI/CD section
- README.md → GitHub Actions

---

### Día 19: Linting y Pre-commit (3 horas)

**Feature**: Quality gates

**Tasks**:

```bash
✓ ESLint config
✓ Prettier config
✓ Husky pre-commit
✓ Lint-staged
```

**Checklist**:

- [ ] ESLint sin errores
- [ ] Prettier aplicado
- [ ] Husky instalado
- [ ] Pre-commit hook funciona
- [ ] No se puede commit con tests rojos

**Referencias**:

- TDD_SETUP_CONFIG.md → ESLint y Prettier

---

### Día 20: Documentación Final (3 horas)

**Feature**: Documentación completa

**Tasks**:

```bash
✓ README.md exhaustivo
✓ API documentation (Swagger)
✓ Diagramas de arquitectura
✓ Runbook de operaciones
```

**Checklist**:

- [ ] README completo
- [ ] Swagger/OpenAPI
- [ ] Diagramas actualizados
- [ ] Guía de deployment
- [ ] Troubleshooting guide

**Entregable Semana 4**: Proyecto production-ready ✅✅✅

---

## 📊 Métricas Finales

Al terminar las 4 semanas, deberías tener:

### Código

- ✅ 10+ endpoints REST
- ✅ 3+ workers asíncronos
- ✅ 200+ tests
- ✅ 85%+ coverage
- ✅ 0 tests skipped

### Infraestructura

- ✅ PM2 configurado
- ✅ CI/CD funcionando
- ✅ Logs rotando
- ✅ Monitoreo activo
- ✅ Zero-downtime deploys

### Proceso

- ✅ TDD como práctica estándar
- ✅ Pre-commit hooks
- ✅ Code review con tests
- ✅ Documentación completa

---

## 🎯 Próximos Pasos

### Después de las 4 Semanas

**Mes 2: Consolidar**

- Refactorizar código
- Mejorar coverage a 90%+
- Optimizar performance
- Agregar más features

**Mes 3: Escalar**

- Microservicios
- Docker y Kubernetes
- Monitoreo avanzado
- Métricas de negocio

**Ongoing: Mantener**

- TDD en todas las features
- Refactor continuo
- Actualizar dependencias
- Mentorear al equipo

---

## ⚠️ Posibles Bloqueos

### Problema 1: Tests muy lentos

**Síntoma**: Tests toman > 30 segundos  
**Solución**:

- Usar SQLite en memoria
- Mock servicios externos
- Correr tests en paralelo

**Tiempo perdido típico**: 2 horas  
**Prevención**: Leer TDD_SETUP_CONFIG.md desde día 1

### Problema 2: Coverage bajo

**Síntoma**: No llegas a 80%  
**Solución**:

- Focus en services primero
- Agregar edge cases
- Tests de error handling

**Tiempo perdido típico**: 4 horas  
**Prevención**: Revisar checklist de cada capa

### Problema 3: PM2 no funciona

**Síntoma**: Procesos no inician  
**Solución**:

- Revisar ecosystem.config.js
- Verificar paths
- Check logs de PM2

**Tiempo perdido típico**: 3 horas  
**Prevención**: Copiar config exacta de TDD_SETUP_CONFIG.md

---

## 📈 Seguimiento de Progreso

### Daily Checklist

Cada día al terminar:

- [ ] Tests pasan ✅
- [ ] Commit realizado ✅
- [ ] Coverage mantenido ✅
- [ ] Documentación actualizada ✅
- [ ] Aprendizaje registrado ✅

### Weekly Review

Cada domingo:

- [ ] Revisar objetivos de la semana
- [ ] Identificar bloqueos
- [ ] Planificar semana siguiente
- [ ] Actualizar este roadmap si necesario

---

## 🎓 Recursos por Semana

### Semana 1

- TDD_SETUP_CONFIG.md (completo)
- TDD_METHODOLOGY.md (Secciones 1-2)
- README.md

### Semana 2

- TDD_PRACTICAL_EXAMPLES.md (Ejemplos 1-3)
- TDD_METHODOLOGY.md (Secciones 3-4)

### Semana 3

- TDD_METHODOLOGY.md (Sección 5)
- TDD_PRACTICAL_EXAMPLES.md (Ejemplo 2)

### Semana 4

- TDD_SETUP_CONFIG.md (CI/CD)
- Documentos base del proyecto

---

**¡Éxito en tu viaje TDD! 🚀**

_Este roadmap es flexible - ajústalo según tu ritmo y necesidades_

_Última actualización: 2025-01-13_  
_Versión: 1.0.0_  
_Proyecto: skills-fabrik/inventario_
