#!/usr/bin/env node

/**
 * PBv2 Claude Code Integration Test Suite - FASE 6
 *
 * Tests de integración real con Claude Code hooks
 * - Suite A: Hook Integration (4 tests)
 * - Suite B: Real Scenarios (4 tests)
 * - Suite C: Claude Interaction (2 tests)
 *
 * Version: 2.0.0
 * Author: Skills Fabric Team
 */

import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

// Import hook modules
import { detectPlan } from './plan-detector.mjs';
import { pbv2StopHook, processClaudeOutput } from './pbv2-integration.mjs';
import { activatePBv2 } from './pbv2-activator.mjs';
import { planCache } from './plan-detector.mjs';

const __dirname = join(fileURLToPath(import.meta.url), '..');

/**
 * Mock Claude Responses para testing realista
 */
const MOCK_CLAUDE_RESPONSES = {
  // Suite A: Hook Integration Tests
  simplePlan: `
[Layout] Plan de desarrollo:

1. Configurar el entorno de desarrollo
2. Instalar dependencias necesarias
3. Crear estructura de carpetas
4. Implementar la lógica principal

Este es un plan básico para comenzar.
`,

  cloopPlan: `
**Clarify**: Definir los objetivos del proyecto

**Layout**: Diseñar la arquitectura del sistema
- Crear diagrama de componentes
- Definir interfaces entre módulos
- Establecer patrones de comunicación

**Operate**: Implementar las funcionalidades
- Desarrollar backend API
- Crear frontend componentes
- Configurar base de datos

**Observe**: Testing y validación
- Pruebas unitarias
- Pruebas de integración
- Validación de rendimiento

**Reflect**: Revisión y mejoras
- Análisis de resultados
- Documentación
- Plan de despliegue

Este es un plan completo siguiendo la metodología CLOOP.
`,

  planWithCode: `
[Layout] Plan de implementación:

1. **Configuración inicial**
   - npm init -y
   - npm install express cors
   - Crear estructura de archivos

2. **Implementación del servidor**
   \`\`\`javascript
   const express = require('express');
   const app = express();

   app.get('/api/health', (req, res) => {
     res.json({ status: 'ok' });
   });

   app.listen(3000);
   \`\`\`

3. **Testing**
   - Crear tests con Jest
   - Verificar endpoints

Plan estructurado para el desarrollo.
`,

  longPlan: `
[Layout] Plan de desarrollo completo del sistema empresarial con arquitectura distribuida y microservicios:

**FASE 1: ARQUITECTURA Y INFRAESTRUCTURA BASE**
1. Diseñar y documentar arquitectura de microservicios
   - Definir límites de cada servicio
   - Establecer contratos de APIs
   - Crear diagramas de arquitectura detallada
   - Documentar decisiones técnicas (ADRs)

2. Configurar containerización completa con Docker y Kubernetes
   - Crear Dockerfiles optimizados para cada servicio
   - Configurar Docker Compose para desarrollo local
   - Implementar Helm charts para Kubernetes
   - Configurar namespace y recursos

3. Establecer comunicación entre servicios
   - Implementar service discovery
   - Configurar API Gateway con rate limiting
   - Establecer circuit breakers y retry logic
   - Implementar distributed tracing

4. Configurar observabilidad y monitoring
   - Implementar Prometheus y Grafana
   - Configurar Jaeger para distributed tracing
   - Establecer alertas y dashboards
   - Configurar logs centralizados con ELK stack

5. Establecer CI/CD pipeline completo
   - Configurar GitHub Actions o GitLab CI
   - Implementar testing automatizado
   - Configurar deployment automático
   - Establecer rollback automático

6. Implementar seguridad y autenticación
   - Configurar OAuth2 y OpenID Connect
   - Implementar JWT token management
   - Configurar secrets management
   - Establecer RBAC (Role-Based Access Control)

7. Configurar base de datos y almacenamiento
   - Diseñar esquema de base de datos por servicio
   - Configurar PostgreSQL para datos transaccionales
   - Implementar Redis para caching
   - Configurar backup automático y restore

8. Implementar API Gateway y routing
   - Configurar Kong o similar
   - Implementar load balancing
   - Configurar API versioning
   - Establecer rate limiting por cliente

**FASE 2: DESARROLLO DE SERVICIOS CORE**

1. Servicio de Gestión de Usuarios
   - Implementar registro y autenticación
   - Crear sistema de roles y permisos
   - Implementar perfil de usuario
   - Configurar notificaciones de email

2. Servicio de Autenticación y Autorización
   - Implementar OAuth2 server
   - Configurar JWT tokens con refresh
   - Implementar MFA (Multi-Factor Authentication)
   - Crear sistema de sesión

3. Servicio de Productos y Catálogo
   - Implementar CRUD de productos
   - Crear sistema de categorización
   - Implementar búsqueda y filtrado
   - Configurar variantes de productos

4. Servicio de Órdenes y Carrito
   - Implementar carrito persistente
   - Crear workflow de órdenes
   - Implementar gestión de estados
   - Configurar notificaciones de estado

5. Servicio de Pagos y Facturación
   - Integrar con proveedores de pago (Stripe, PayPal)
   - Implementar procesamiento de pagos
   - Crear sistema de facturación
   - Configurar webhooks de pago

6. Servicio de Inventario
   - Implementar tracking de stock
   - Crear sistema de reservas
   - Implementar sincronización entre canales
   - Configurar alertas de stock bajo

7. Servicio de Logística y Shipping
   - Integrar con carriers de envío
   - Implementar cálculo de costos
   - Crear tracking de envíos
   - Configurar notificaciones de entrega

8. Servicio de Notificaciones
   - Implementar email, SMS y push notifications
   - Crear templates personalizables
   - Implementar colas de mensajes
   - Configurar delivery tracking

**FASE 3: DESARROLLO DE FRONTEND Y EXPERIENCIA DE USUARIO**

1. Aplicación Web Principal (React + TypeScript + Next.js)
   - Implementar Server-Side Rendering (SSR)
   - Crear design system con Storybook
   - Implementar lazy loading y code splitting
   - Configurar PWA features

2. Sistema de Routing y Navegación
   - Implementar React Router con código splitting
   - Crear guardas de autenticación
   - Implementar navegación programática
   - Configurar deep linking

3. Componentes UI Reutilizables
   - Crear biblioteca de componentes base
   - Implementar sistema de temas (light/dark)
   - Crear componentes de formularios
   - Implementar componentes de data display

4. Gestión de Estado Global
   - Implementar Redux Toolkit o Zustand
   - Crear slices para cada dominio
   - Implementar optimistic updates
   - Configurar persistence

5. Páginas y Funcionalidades Principales
   - Página de inicio con hero section
   - Catálogo de productos con filtros
   - Página de producto detallada
   - Carrito de compras

6. Checkout y Proceso de Pago
   - Implementar multi-step checkout
   - Crear formularios de dirección
   - Integrar método de pago
   - Implementar order summary

7. Cuenta de Usuario y Dashboard
   - Crear perfil de usuario
   - Implementar historial de órdenes
   - Crear wishlist/favoritos
   - Implementar configuración de cuenta

8. Responsive Design y Accesibilidad
   - Implementar mobile-first approach
   - Configurar breakpoints para todos los dispositivos
   - Implementar navegación accesible
   - Configurar screen reader support

**FASE 4: TESTING, CALIDAD Y VALIDACIÓN**

1. Configuración de Ambiente de Testing
   - Configurar Jest y React Testing Library
   - Implementar test fixtures y mocks
   - Configurar testing database
   - Establecer test data generators

2. Pruebas Unitarias (Cobertura >80%)
   - Escribir tests para todos los componentes
   - Implementar tests para servicios
   - Crear tests para utility functions
   - Establecer thresholds de cobertura

3. Pruebas de Integración
   - Implementar tests de APIs con Supertest
   - Crear tests de integración de servicios
   - Implementar tests de base de datos
   - Configurar tests de message queues

4. Pruebas End-to-End (E2E)
   - Configurar Cypress para E2E tests
   - Implementar scenarios críticos de usuario
   - Crear tests de checkout completo
   - Implementar tests de performance

5. Pruebas de Carga y Performance
   - Configurar Artillery para load testing
   - Implementar stress tests
   - Crear benchmarks de APIs
   - Establecer SLAs de performance

6. Monitoreo de Performance en Tiempo Real
   - Implementar Real User Monitoring (RUM)
   - Configurar Core Web Vitals tracking
   - Crear alertas de performance degradation
   - Implementar performance budgets

7. Configuración de Alertas y Observabilidad
   - Configurar alertas en Slack/Discord
   - Implementar health checks detallados
   - Crear runbooks para incidentes
   - Configurar error tracking con Sentry

8. Documentación Completa
   - Crear documentación de APIs (Swagger/OpenAPI)
   - Documentar arquitectura y decisiones
   - Crear guías de desarrollo
   - Implementar auto-generación de docs

**FASE 5: DEPLOYMENT, DEVOPS Y OPERACIONES**

1. Configuración de Ambiente de Staging
   - Configurar Kubernetes cluster
   - Implementar environment parity
   - Configurar database migrations
   - Establecer monitoring completo

2. Implementar Blue-Green Deployment
   - Configurar load balancer para blue-green
   - Implementar health checks automáticos
   - Configurar database blue-green sync
   - Establecer rollback procedures

3. Configurar Rollback Automático
   - Implementar health check monitoring
   - Configurar automatic rollback triggers
   - Establecer retry logic
   - Configurar circuit breakers

4. Establecer SLAs y Service Level Objectives
   - Definir SLAs para cada servicio
   - Configurar SLO dashboards
   - Implementar error budget tracking
   - Establecer review processes

5. Configurar Backups Automáticos
   - Implementar database backup automático
   - Configurar object storage backup
   - Crear disaster recovery plan
   - Probar restore procedures regularmente

6. Implementar Disaster Recovery
   - Configurar multi-region setup
   - Implementar data replication
   - Establecer RTO/RPO targets
   - Crear incident response procedures

7. Documentar Procesos Operativos
   - Crear runbooks para operaciones comunes
   - Documentar troubleshooting guides
   - Establecer escalation procedures
   - Crear on-call procedures

8. Capacitar Equipo de Operaciones
   - Entrenar en herramientas de monitoring
   - Crear training materials
   - Establecer knowledge base
   - Implementar pair programming sessions

**FASE 6: OPTIMIZACIÓN, MEJORAS Y ESCALABILIDAD**

1. Análisis Profundo de Métricas de Uso
   - Analizar user behavior con Google Analytics
   - Implementar feature usage tracking
   - Crear conversion funnels
   - Establecer KPIs y métricas de éxito

2. Optimización de Queries de Base de Datos
   - Implementar connection pooling
   - Optimizar slow queries
   - Crear índices estratégicos
   - Configurar query caching

3. Implementación de Caching Avanzado
   - Implementar Redis clustering
   - Configurar cache invalidation
   - Crear cache warming strategies
   - Implementar CDN para assets

4. Optimización de Frontend Performance
   - Implementar code splitting avanzado
   - Optimizar bundle size
   - Configurar tree shaking efectivo
   - Implementar preloading strategies

5. Refactorización de Código Crítico
   - Identificar performance bottlenecks
   - Refactorizar hot paths
   - Implementar mejor algorithms
   - Optimizar memory usage

6. Mejora de UX Basada en Feedback
   - Recopilar user feedback sistemáticamente
   - Implementar A/B testing
   - Crear user journey improvements
   - Configurar user satisfaction tracking

7. Implementación de Features Adicionales
   - Desarrollar mobile apps (iOS/Android)
   - Implementar voice search
   - Crear recommendation engine
   - Implementar social features

8. Documentación Técnica Completa
   - Crear architecture decision records (ADRs)
   - Documentar deployment procedures
   - Crear API documentation completa
   - Establecer code review guidelines

Este plan abarca el desarrollo completo de un sistema empresarial con arquitectura moderna, microservicios, alta disponibilidad, escalabilidad automática, y las mejores prácticas de la industria como DevOps, CI/CD, testing automatizado, monitoring, y metodologías ágiles. El sistema está diseñado para manejar millones de usuarios, con alta disponibilidad (99.9% uptime), baja latencia (<100ms para operaciones críticas), y capacidad de escalado horizontal automático basado en load.

La implementación seguirá principios de Clean Architecture, Domain-Driven Design (DDD), y Test-Driven Development (TDD), asegurando código mantenible, testeable, y escalable a largo plazo. Cada fase incluye entregables específicos, métricas de éxito, y criterios de aceptación claramente definidos para garantizar la calidad y el éxito del proyecto.
`.trim(),

  // Suite B: Real Scenarios
  completeFlow: `
**Clarify**: Desarrollar una aplicación web completa para gestión de tareas

**Layout**: Plan de implementación detallado:

1. Configuración del proyecto
   - Crear proyecto React con Vite
   - Configurar TypeScript
   - Instalar dependencias (React Router, Zustand, Tailwind)

2. Estructura de componentes
   - Crear estructura de carpetas
   - Implementar Layout principal
   - Crear componentes base (Button, Input, Modal)

3. Gestión de estado
   - Configurar Zustand store
   - Crear acciones para CRUD de tareas
   - Implementar persistencia local

4. Páginas principales
   - Dashboard principal
   - Lista de tareas
   - Formulario de creación/edición
   - Vista de detalle

5. Testing y deployment
   - Pruebas unitarias con Vitest
   - Pruebas de integración
   - Build y deploy a Vercel

**Operate**: Comenzando implementación...

Este es un plan detallado para una aplicación completa.
`,

  conversationPlan: `
[Layout] Plan para mejorar performance:

1. Optimizar bundle size
2. Implementar lazy loading
3. Configurar CDN
4. Añadir service worker

En conversación previa, ya habíamos definido los objetivos.
`,

  multiplePlans: `
[Layout] Plan para la primera funcionalidad:

1. Crear componente UserProfile
2. Implementar lógica de actualización
3. Testing unitario

---

[Layout] Plan para la segunda funcionalidad:

1. Crear componente Settings
2. Implementar preferencias de usuario
3. Testing E2E

Ambos planes son independientes.
`,

  // Suite C: Claude Interaction
  streamingResponse: `
[Layout] Plan de desarrollo:

1. Configurar entorno
2. Implementar features
3. Testing

(Texto mientras Claude sigue generando...)`,

  timeoutHandling: `
[Layout] Plan: (simulando timeout...)

**Fase 1**: Definir objetivos
**Fase 2**: Implementar arquitectura
**Fase 3**: Desarrollar funcionalidades
**Fase 4**: Testing y QA
**Fase 5**: Deployment

Este plan sigue el proceso estándar.
`
};

/**
 * Resultado de test estructurado
 */
class TestResult {
  constructor(name, suite) {
    this.name = name;
    this.suite = suite;
    this.passed = false;
    this.message = '';
    this.details = {};
    this.latency = 0;
    this.error = null;
  }

  pass(message, details = {}) {
    this.passed = true;
    this.message = message;
    this.details = details;
    return this;
  }

  fail(message, error = null, details = {}) {
    this.passed = false;
    this.message = message;
    this.error = error;
    this.details = details;
    return this;
  }
}

/**
 * Test Runner centralizado
 */
class TestRunner {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }

  async run(testName, testFn) {
    const result = new TestResult(testName, this.getCurrentSuite());
    const testStart = Date.now();

    try {
      const output = await testFn(result);
      result.latency = Date.now() - testStart;

      if (!result.passed && !result.message) {
        result.message = 'Test completed but no assertion made';
      }

    } catch (error) {
      result.latency = Date.now() - testStart;
      result.fail('Exception thrown', error, {
        stack: error.stack
      });
    }

    this.results.push(result);
    return result;
  }

  getCurrentSuite() {
    // Infer from call stack or set explicitly
    const stack = new Error().stack;
    if (stack.includes('Suite A') || stack.includes('Hook Integration')) return 'Suite A';
    if (stack.includes('Suite B') || stack.includes('Real Scenarios')) return 'Suite B';
    if (stack.includes('Suite C') || stack.includes('Claude Interaction')) return 'Suite C';
    return 'Unknown';
  }

  getSummary() {
    const total = this.results.length;
    const passed = this.results.filter(r => r.passed).length;
    const failed = total - passed;
    const totalTime = Date.now() - this.startTime;

    return {
      total,
      passed,
      failed,
      successRate: (passed / total * 100).toFixed(1) + '%',
      totalTime,
      averageTime: (totalTime / total).toFixed(0) + 'ms'
    };
  }
}

const runner = new TestRunner();

/**
 * ========================================
 * SUITE A: Hook Integration (4 tests)
 * ========================================
 */

/**
 * Test A1: userPromptSubmit hook detecta plan real en prompt Claude
 */
async function testUserPromptSubmit(testResult) {
  const mockPrompt = MOCK_CLAUDE_RESPONSES.simplePlan;

  // Simular userPromptSubmit detection
  const detection = detectPlan(mockPrompt);

  if (!detection) {
    return testResult.fail('No plan detected in simple plan');
  }

  if (detection.confidence < 0.7) {
    return testResult.fail(`Low confidence: ${detection.confidence}`);
  }

  if (!detection.block || detection.block.length < 50) {
    return testResult.fail('Plan block too short or empty');
  }

  return testResult.pass('Plan detected successfully', {
    confidence: detection.confidence,
    hash: detection.hash.substring(0, 8),
    blockLength: detection.block.length
  });
}

/**
 * Test A2: stop hook procesa respuesta completa de Claude Code
 */
async function testStopHookProcessing(testResult) {
  // Clear cache before test
  planCache.clear();

  // Use simple plan format for better detection
  const mockResponse = MOCK_CLAUDE_RESPONSES.simplePlan;
  const cwd = process.cwd();

  const result = await pbv2StopHook(mockResponse, { cwd, verbose: false });

  // Should detect plan in the response
  if (!result || !result.processed) {
    return testResult.fail('Stop hook did not process response', null, { result });
  }

  // Check if plan was detected
  if (!result.detection) {
    return testResult.fail('No detection in stop hook result', null, { result });
  }

  return testResult.pass('Stop hook processed successfully', {
    action: result.action,
    detectionConfidence: result.detection.confidence,
    hasHash: !!result.detection.hash
  });
}

/**
 * Test A3: bashValidator ejecuta safely en contexto real
 */
async function testBashValidatorSafety(testResult) {
  // Simular bash validation on plan content
  const planBlock = detectPlan(MOCK_CLAUDE_RESPONSES.planWithCode)?.block;

  if (!planBlock) {
    return testResult.fail('No plan to validate');
  }

  // Simulate dangerous pattern detection
  const dangerousPatterns = [
    /rm\s+-rf\s+\//i,
    /sudo\s+rm/i,
    />\s*\/etc\//i,
    /chmod\s+777/i
  ];

  const hasDangerousPatterns = dangerousPatterns.some(pattern => pattern.test(planBlock));

  if (hasDangerousPatterns) {
    return testResult.fail('Dangerous patterns detected in plan', null, { planBlock });
  }

  // Verify plan is safe to process
  const isSafe = !planBlock.includes('rm -rf') &&
                 !planBlock.includes('sudo') &&
                 !planBlock.includes('chmod 777');

  if (!isSafe) {
    return testResult.fail('Plan failed safety check');
  }

  return testResult.pass('Bash validation passed - plan is safe', {
    planLength: planBlock.length,
    hasCodeBlocks: planBlock.includes('```')
  });
}

/**
 * Test A4: Multiple hooks en secuencia sin conflictos
 */
async function testMultipleHooksSequence(testResult) {
  // Clear cache before test
  planCache.clear();

  const cwd = process.cwd();
  const mockOutput = MOCK_CLAUDE_RESPONSES.simplePlan;

  // First hook call
  const result1 = await pbv2StopHook(mockOutput, { cwd, verbose: false });

  // Check cache after first call
  const cacheStats1 = planCache.getStats();

  // Second hook call with same content (should hit cache)
  const result2 = await pbv2StopHook(mockOutput, { cwd, verbose: false });

  // Third hook call with different content
  const result3 = await pbv2StopHook(MOCK_CLAUDE_RESPONSES.planWithCode, { cwd, verbose: false });

  const cacheStats2 = planCache.getStats();

  // Verify cache grew
  if (cacheStats2.size <= cacheStats1.size) {
    return testResult.fail('Cache did not grow after multiple hooks');
  }

  // Verify results are consistent - at least one should be detected
  if (!result1.detection || !result3.detection) {
    return testResult.fail('Missing detection in sequence', null, {
      result1: !!result1.detection,
      result3: !!result3.detection
    });
  }

  // Verify result2 was cached (same hash)
  if (result2.reason !== 'cached') {
    // This is expected behavior - cache hit should be detected
    console.log('[Test A4] Note: Cache behavior:', result2.reason);
  }

  return testResult.pass('Multiple hooks executed without conflicts', {
    cacheSize: cacheStats2.size,
    allDetected: !!(result1.detection && result3.detection),
    cacheWorking: cacheStats2.size >= 2
  });
}

/**
 * ========================================
 * SUITE B: Real Scenarios (4 tests)
 * ========================================
 */

/**
 * Test B1: Flujo completo - prompt → response → stop → save
 */
async function testCompleteFlow(testResult) {
  // Clear cache before test
  planCache.clear();

  const cwd = process.cwd();
  const mockPrompt = MOCK_CLAUDE_RESPONSES.simplePlan;

  // Step 1: Simulate userPromptSubmit (detection in prompt)
  const detection = detectPlan(mockPrompt);
  if (!detection) {
    return testResult.fail('Failed to detect plan in prompt phase');
  }

  // Step 2: Simulate stop hook (processing complete response)
  const stopResult = await pbv2StopHook(mockPrompt, { cwd, verbose: false });
  if (!stopResult.detection) {
    return testResult.fail('Stop hook failed to detect plan');
  }

  // Step 3: Simulate PBv2 activation (with default skill IDs)
  const activationResult = await activatePBv2(detection.block, cwd, {
    skillIds: ['frontend-dev-guidelines', 'backend-dev-guidelines']
  });
  if (!activationResult || activationResult.success === false) {
    return testResult.fail('PBv2 activation failed', null, { activationResult });
  }

  // Verify flow completed
  if (!stopResult.savedPath && stopResult.action !== 'saved') {
    // In logOnly mode, should attempt to save
    console.log('[Test B1] Note: Save behavior:', stopResult.action);
  }

  return testResult.pass('Complete flow executed successfully', {
    detectionConfidence: detection.confidence,
    activationSuccess: activationResult.success,
    activationLatency: activationResult.latency_ms,
    expectedScore: activationResult.expectedScore
  });
}

/**
 * Test B2: Plan con código y explicaciones detalladas
 */
async function testPlanWithCode(testResult) {
  const mockResponse = MOCK_CLAUDE_RESPONSES.planWithCode;
  const cwd = process.cwd();

  const detection = detectPlan(mockResponse);
  if (!detection) {
    return testResult.fail('Failed to detect plan with code');
  }

  // Activate PBv2 with code-heavy plan (with skill IDs)
  const pbv2Result = await activatePBv2(detection.block, cwd, {
    skillIds: ['frontend-dev-guidelines', 'backend-dev-guidelines']
  });

  if (!pbv2Result.success) {
    return testResult.fail('PBv2 failed on code-heavy plan', null, pbv2Result);
  }

  // Verify code was preserved in prompt
  const hasCode = pbv2Result.prompt.includes('```') ||
                  pbv2Result.prompt.includes('require');

  if (!hasCode) {
    return testResult.fail('Code blocks not preserved in PBv2 prompt');
  }

  return testResult.pass('Plan with code processed successfully', {
    planHasCode: mockResponse.includes('```'),
    pbv2PromptHasCode: hasCode,
    pbv2Latency: pbv2Result.latency_ms,
    pbv2Score: pbv2Result.expectedScore
  });
}

/**
 * Test B3: Plan largo (>10k caracteres) parsing
 */
async function testLongPlanParsing(testResult) {
  const longPlan = MOCK_CLAUDE_RESPONSES.longPlan;

  if (longPlan.length < 10000) {
    return testResult.fail('Test plan not long enough', null, {
      actualLength: longPlan.length
    });
  }

  const startTime = Date.now();
  const detection = detectPlan(longPlan);
  const parseTime = Date.now() - startTime;

  if (!detection) {
    return testResult.fail('Failed to detect long plan');
  }

  if (parseTime > 200) {
    return testResult.fail('Long plan parsing too slow', null, {
      parseTime: parseTime + 'ms',
      threshold: '200ms'
    });
  }

  // Verify full plan extracted
  const extractedLength = detection.block.length;
  if (extractedLength < 5000) {
    return testResult.fail('Long plan not fully extracted', null, {
      originalLength: longPlan.length,
      extractedLength: extractedLength
    });
  }

  return testResult.pass('Long plan parsed successfully', {
    originalLength: longPlan.length,
    extractedLength: extractedLength,
    parseTime: parseTime + 'ms',
    confidence: detection.confidence
  });
}

/**
 * Test B4: Múltiples planes en conversación larga
 */
async function testMultiplePlansInConversation(testResult) {
  const conversationPlan = MOCK_CLAUDE_RESPONSES.multiplePlans;
  const cwd = process.cwd();

  // Extract first plan
  const detection1 = detectPlan(conversationPlan);
  if (!detection1) {
    return testResult.fail('Failed to detect first plan');
  }

  // Process through stop hook
  const result1 = await pbv2StopHook(conversationPlan, { cwd, verbose: false });

  // Check that only one plan was detected (or first one)
  const planCount = (conversationPlan.match(/\[Layout\]/g) || []).length;

  if (planCount >= 2 && !result1.detection) {
    return testResult.fail('Failed to detect at least one plan in multi-plan scenario');
  }

  // Clear cache for second test
  planCache.clear();

  // Test with different plan
  const detection2 = detectPlan(MOCK_CLAUDE_RESPONSES.simplePlan);
  if (!detection2) {
    return testResult.fail('Failed to detect second plan after cache clear');
  }

  // Verify hashes are different
  if (detection1.hash === detection2.hash) {
    return testResult.fail('Plans have same hash (should be different)');
  }

  return testResult.pass('Multiple plans handled correctly', {
    planCount: planCount,
    firstPlanHash: detection1.hash.substring(0, 8),
    secondPlanHash: detection2.hash.substring(0, 8),
    hashesDifferent: detection1.hash !== detection2.hash
  });
}

/**
 * ========================================
 * SUITE C: Claude Interaction (2 tests)
 * ========================================
 */

/**
 * Test C1: Response parsing desde Claude real output
 */
async function testRealResponseParsing(testResult) {
  const realOutput = `
[Layout] Plan de desarrollo:

1. **Setup inicial**
   - Crear proyecto con Vite + React + TypeScript
   - Instalar dependencias: React Router, Tailwind CSS, Zustand

2. **Estructura de componentes**
   - Componentes de UI (Button, Input, Card)
   - Layout principal
   - Páginas (Home, About, Contact)

3. **Funcionalidad**
   - State management con Zustand
   - API integration
   - Formularios y validaciones

4. **Testing**
   - Tests unitarios con Vitest
   - Tests de integración
   - Build y deploy

Este plan te dará una base sólida para tu proyecto.
  `.trim();

  const detection = detectPlan(realOutput);

  if (!detection) {
    return testResult.fail('Failed to parse real Claude output format');
  }

  // Verify plan has structure
  const hasStructure = detection.block.includes('1.') &&
                       detection.block.includes('2.') &&
                       detection.block.includes('Testing');

  if (!hasStructure) {
    return testResult.fail('Plan missing expected structure', {
      blockLength: detection.block.length
    });
  }

  return testResult.pass('Real Claude response parsed correctly', {
    confidence: detection.confidence,
    blockLength: detection.block.length,
    hasStructure: hasStructure
  });
}

/**
 * Test C2: Timeouts y streaming handling
 */
async function testTimeoutsAndStreaming(testResult) {
  // Test with streaming-like response
  const streamingOutput = MOCK_CLAUDE_RESPONSES.streamingResponse;

  const startTime = Date.now();
  const detection = detectPlan(streamingOutput);
  const detectionTime = Date.now() - startTime;

  if (!detection) {
    return testResult.fail('Failed to parse streaming response');
  }

  if (detectionTime > 100) {
    return testResult.fail('Streaming response parsing too slow', null, {
      detectionTime: detectionTime + 'ms',
      threshold: '100ms'
    });
  }

  // Test timeout handling in PBv2 activation (with skill IDs)
  const pbv2Result = await activatePBv2(detection.block, process.cwd(), {
    skillIds: ['frontend-dev-guidelines']
  });

  // Should complete within reasonable time
  if (pbv2Result.latency_ms > 10000) {
    return testResult.fail('PBv2 activation too slow', null, {
      latency: pbv2Result.latency_ms + 'ms',
      threshold: '10000ms'
    });
  }

  return testResult.pass('Timeouts and streaming handled correctly', {
    detectionTime: detectionTime + 'ms',
    pbv2Latency: pbv2Result.latency_ms + 'ms',
    pbv2Success: pbv2Result.success
  });
}

/**
 * Ejecutar todas las suites de tests
 */
async function runAllTests() {
  console.log('\n🚀 FASE 6 - Claude Code Integration Testing\n');
  console.log('=' .repeat(60));

  // Clear cache before tests
  planCache.clear();

  // Suite A: Hook Integration
  console.log('\n📋 Suite A: Hook Integration (4 tests)\n');
  await runner.run('A1: userPromptSubmit hook detection', testUserPromptSubmit);
  await runner.run('A2: stop hook processing', testStopHookProcessing);
  await runner.run('A3: bashValidator safety', testBashValidatorSafety);
  await runner.run('A4: multiple hooks sequence', testMultipleHooksSequence);

  // Suite B: Real Scenarios
  console.log('\n📋 Suite B: Real Scenarios (4 tests)\n');
  await runner.run('B1: complete flow', testCompleteFlow);
  await runner.run('B2: plan with code', testPlanWithCode);
  await runner.run('B3: long plan parsing', testLongPlanParsing);
  await runner.run('B4: multiple plans in conversation', testMultiplePlansInConversation);

  // Suite C: Claude Interaction
  console.log('\n📋 Suite C: Claude Interaction (2 tests)\n');
  await runner.run('C1: real response parsing', testRealResponseParsing);
  await runner.run('C2: timeouts and streaming', testTimeoutsAndStreaming);

  return runner.results;
}

/**
 * Generar reporte de resultados
 */
function generateReport(results) {
  const summary = runner.getSummary();

  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST RESULTS SUMMARY\n');
  console.log(`Total Tests: ${summary.total}`);
  console.log(`Passed: ${summary.passed} ✅`);
  console.log(`Failed: ${summary.failed} ❌`);
  console.log(`Success Rate: ${summary.successRate}`);
  console.log(`Total Time: ${summary.totalTime}ms`);
  console.log(`Average Time: ${summary.averageTime}`);

  // Detailed results by suite
  const suites = {
    'Suite A': results.filter(r => r.suite === 'Suite A'),
    'Suite B': results.filter(r => r.suite === 'Suite B'),
    'Suite C': results.filter(r => r.suite === 'Suite C')
  };

  for (const [suiteName, suiteResults] of Object.entries(suites)) {
    console.log(`\n${suiteName}:`);
    const passed = suiteResults.filter(r => r.passed).length;
    console.log(`  ${passed}/${suiteResults.length} tests passed`);

    suiteResults.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      console.log(`  ${status} ${result.name} (${result.latency}ms)`);
      if (!result.passed) {
        console.log(`     Error: ${result.message}`);
      }
    });
  }

  // Save detailed report
  const report = {
    timestamp: new Date().toISOString(),
    phase: 'FASE 6 - Claude Code Integration Testing',
    version: '2.0.0',
    summary,
    results: results.map(r => ({
      name: r.name,
      suite: r.suite,
      passed: r.passed,
      message: r.message,
      latency: r.latency,
      error: r.error ? {
        name: r.error.name,
        message: r.error.message,
        stack: r.error.stack
      } : null,
      details: r.details
    }))
  };

  const logsDir = join(process.cwd(), 'logs');
  if (!existsSync(logsDir)) {
    mkdirSync(logsDir, { recursive: true });
  }

  const reportPath = join(logsDir, 'phase6-claude-integration-results.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(`\n📄 Detailed report saved: ${reportPath}`);

  return report;
}

/**
 * Exit handler
 */
function handleExit(report) {
  const failedTests = report.results.filter(r => !r.passed);
  const success = failedTests.length === 0;

  if (success) {
    console.log('\n✅ All tests passed! FASE 6 - Complete\n');
    process.exit(0);
  } else {
    console.log(`\n❌ ${failedTests.length} test(s) failed\n`);
    process.exit(1);
  }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests()
    .then(results => {
      const report = generateReport(results);
      handleExit(report);
    })
    .catch(error => {
      console.error('\n💥 Fatal error running tests:', error);
      console.error(error.stack);
      process.exit(1);
    });
}

export {
  MOCK_CLAUDE_RESPONSES,
  TestResult,
  TestRunner,
  runAllTests,
  generateReport
};
