# Plan CLOOP para Implementación de 6 Handlers de Slash Commands

**Template v1.1.0** | **Fecha**: 2025-11-01 | **Sesión**: Skills Fabric CLI

---

## C1 - CLARIFY: Definición de Objetivos

### [K] CONTEXTO DEL PROYECTO
Skills Fabric es un monorepo multi-package para gestión de skills, workflows y automatización de desarrollo usando metodología CLOOP. El sistema de slash commands existente tiene una arquitectura base implementada con registry, parser, context manager y handler base.

### [U] USUARIO Y NECESIDAD
Desarrolladores del sistema Skills Fabric necesitan implementar 6 handlers de slash commands pendientes para completar la funcionalidad del sistema CLI. Los handlers deben integrarse con MemTech L1, skills-cli, router y cumplir con estándares de calidad TypeScript.

### [EVIDENCIA] ESTADO ACTUAL
- ✅ Arquitectura base completa (registry, parser, context, handler base)
- ✅ 1 handler implementado: `dev-docs-update`
- ❌ 6 handlers pendientes identificados en comentarios del código
- ✅ Tipos TypeScript definidos para cada handler
- ❌ Tests runtime no implementados
- ❌ Métricas KPI no definidas

### [PROPUESTA] OBJETIVO PRINCIPAL
Implementar los 6 handlers de slash commands pendientes con:
- Integración MemTech L1 para persistencia de contexto
- Calidad TypeScript estricta
- Tests runtime por cada handler
- Métricas KPI para monitoring
- Manejo de dependencias entre commands

---

## C2 - LAYOUT: Plan de Ejecución Mínimo Viable

### [K] ALCANCE DEL PLAN
Implementación secuencial de 6 handlers basados en su complejidad y dependencias:

#### Orden de Implementación (por complejidad y dependencias):
1. **/build-and-fix** (Foundation) - Baja complejidad, sin dependencias
2. **/compact** (Foundation) - Baja complejidad, sin dependencias
3. **/undo** (Foundation) - Media complejidad, sin dependencias
4. **/code-review** (Intermediate) - Media complejidad, depende de /build-and-fix
5. **/route-research-for-testing** (Advanced) - Alta complejidad
6. **/test-route** (Advanced) - Alta complejidad, depende de /route-research-for-testing
7. **/plugin** (Expert) - Máxima complejidad, depende de todos los anteriores

### [U] ESTRUCTURA TÉCNICA

#### Arquitectura por Handler:
```
packages/slash-commands/src/handlers/
├── build-and-fix.ts          # Integración con tools (prettier, tsc, jest)
├── compact.ts                # MemTech L1 + Git operations
├── undo.ts                   # Git operations + state restoration
├── code-review.ts            # Static analysis + guardrails integration
├── route-research-for-testing.ts # API discovery + OpenAPI parsing
├── test-route.ts             # Automated testing + auth profiles
└── plugin.ts                 # Dynamic plugin system + sandboxing
```

#### Dependencias del Sistema:
- **MemTech L1**: Para persistencia de contexto y estado
- **skills-cli**: Para ejecución de commands y validation
- **router**: Para integración con hooks y guardrails
- **TypeScript**: Strict mode + runtime validation
- **Jest**: Tests runtime por handler

### [EVIDENCIA] CRITERIOS DE ÉXITO
- [ ] Todos los 6 handlers implementados y funcionales
- [ ] Tests runtime con coverage > 80%
- [ ] Integración MemTech L1 operativa
- [ ] Métricas KPI recolectadas y visibles
- [ ] Documentación completa con ejemplos
- [ ] Performance: < 2s ejecución por handler
- [ ] Zero errores TypeScript en strict mode

### [PROPUESTA] ENTREGABLES POR FASE

#### Fase 1: Foundation (Handlers 1-3)
- `/build-and-fix` con integración tools
- `/compact` con MemTech L1
- `/undo` con Git operations
- Tests runtime para Foundation handlers

#### Fase 2: Intermediate (Handlers 4-5)
- `/code-review` con análisis estático
- `/route-research-for-testing` con descubrimiento API
- Tests runtime para Intermediate handlers

#### Fase 3: Advanced (Handlers 6-7)
- `/test-route` con testing automatizado
- `/plugin` con sistema dinámico
- Tests runtime para Advanced handlers
- KPI dashboard completo

---

## C3 - OPERATE: Flujo de Trabajo Detallado

### [K] METODOLOGÍA CLOOP POR HANDLER

#### Para cada handler seguir CLOOP:

**Clarify** → Definir requisitos específicos del handler
**Layout** → Diseñar implementación con TypeScript strict
**Operate** → Implementar handler + tests + integración
**Observe** → Medir performance + calidad + KPIs
**Reflect** → Optimizar basado en métricas

### [U] FLUJO DE IMPLEMENTACIÓN

#### Paso 1: Análisis de Requisitos (por handler)
- Leer tipos TypeScript definidos en `types.ts`
- Identificar dependencias de sistema (MemTech, CLI, router)
- Definir casos de uso y edge cases
- Especificar integraciones externas

#### Paso 2: Diseño de Arquitectura
- Extender `SlashCommandHandler` base
- Implementar métodos `validate()` y `handle()`
- Diseñar estrategia de persistencia MemTech L1
- Definir estrategia de testing runtime

#### Paso 3: Implementación
```typescript
// Template para cada handler
export class BuildAndFixHandler extends SlashCommandHandler {
  protected async validateCommand(
    parsedCommand: ParsedSlashCommand,
    context: SlashCommandContext
  ): Promise<{ valid: boolean; message?: string }> {
    // Validación específica del handler
  }

  protected async handle(
    parsedCommand: ParsedSlashCommand,
    context: SlashCommandContext
  ): Promise<Omit<SlashCommandResult, 'context' | 'metadata'>> {
    // Lógica principal del handler
  }

  protected getIntegrationType(): 'skill' | 'daemon' | 'cli' | 'native' {
    // Tipo de integración
  }
}
```

#### Paso 4: Integración MemTech L1
```typescript
// Persistencia de contexto
await this.contextManager.updateContext(sessionId, {
  state: {
    buildResults,
    fixedFiles,
    suggestions
  },
  metadata: {
    memtechL1Key: `build-and-fix:${Date.now()}`
  }
});
```

#### Paso 5: Tests Runtime
```typescript
describe('/build-and-fix command', () => {
  it('should fix TypeScript errors automatically', async () => {
    // Test con código que contiene errores
  });

  it('should integrate with prettier formatting', async () => {
    // Test de integración con herramientas
  });

  it('should persist results in MemTech L1', async () => {
    // Test de persistencia
  });
});
```

### [EVIDENCIA] PATRONES DE INTEGRACIÓN

#### Con skills-cli:
```typescript
import { execSync } from 'child_process';
const cliResult = execSync('skills-cli build --all', { encoding: 'utf-8' });
```

#### Con router:
```typescript
import { checkGuardrails } from '@skills-fabrik/router';
const guardrailResults = await checkGuardrails(code);
```

#### Con MemTech L1:
```typescript
import { SlashCommandContextManager } from '../context.js';
const memtechKey = await this.contextManager.persistContext(sessionId);
```

### [PROPUESTA] GESTIÓN DE ERROres

#### Estrategia de Error Handling:
- **Validation Errors**: Input inválido → 400 con detalles
- **Execution Errors**: Fallas de sistema → 500 con diagnóstico
- **Integration Errors**: Fallas externas → Retry + fallback
- **Timeout Errors**: Operaciones largas → 30s timeout
- **Permission Errors**: Auth requerida → 401 con instrucciones

---

## C4 - OBSERVE: Métricas y Monitoring

### [K] KPIs POR HANDLER

#### /build-and-fix:
- **Build Success Rate**: % de builds que pasan después del fix
- **Auto-fix Rate**: % de errores corregidos automáticamente
- **Execution Time**: Tiempo promedio de ejecución
- **Error Reduction**: Reducción de errores TypeScript pre/post

#### /compact:
- **Space Saved**: MB liberados por compactación
- **Cache Hit Rate**: % de hits en MemTech L1
- **Git Operations**:Número de operaciones Git optimizadas
- **Performance Improvement**: % de mejora en rendimiento

#### /undo:
- **Restore Success Rate**: % de restores exitosos
- **State Recovery**: Tiempo promedio de recuperación
- **Git Safety**: Número de operaciones safe-git
- **Data Integrity**: Validación de integridad de datos

#### /code-review:
- **Review Score**: Score promedio de calidad (0-100)
- **Guardrail Hits**: Número de violaciones detectadas
- **Issues Found**: Categorías de problemas encontrados
- **Fix Suggestions**: Sugerencias generadas

#### /route-research-for-testing:
- **Routes Discovered**: Número de rutas API descubiertas
- **Coverage Map**: Mapa de cobertura de endpoints
- **Auth Profiles**: Perfiles de autenticación identificados
- **Documentation Quality**: Calidad de documentación generada

#### /test-route:
- **Tests Generated**: Número de tests generados
- **Test Success Rate**: % de tests que pasan
- **Coverage Achieved**: % de cobertura de código
- **Auth Test Coverage**: Cobertura de casos auth

#### /plugin:
- **Plugins Loaded**: Número de plugins cargados
- **Plugin Security**: Validaciones de seguridad pasadas
- **Sandbox Compliance**: Cumplimiento de sandboxing
- **Dynamic Features**: Características dinámicas habilitadas

### [U] MÉTRICAS DEL SISTEMA

#### Performance Metrics:
- **Response Time**: < 2s por handler
- **Memory Usage**: < 512MB por operación
- **CPU Usage**: < 50% durante ejecución
- **Concurrent Users**: Soporte para 10+ usuarios

#### Quality Metrics:
- **Code Coverage**: > 80% por handler
- **TypeScript Strict**: Zero errores
- **Lint Pass**: Zero warnings
- **Security Scan**: Zero vulnerabilidades

#### Integration Metrics:
- **MemTech L1 Hit Rate**: > 90%
- **CLI Integration Success**: 100%
- **Router Integration**: 100%
- **Plugin Compatibility**: 95%

### [EVIDENCIA] INSTRUMENTACIÓN

#### Logging Structure:
```typescript
// Event structure para KPIs
interface KPIEvent {
  timestamp: string;
  command: string;
  sessionId: string;
  userId?: string;
  metrics: {
    executionTimeMs: number;
    success: boolean;
    errorType?: string;
    integrationType: string;
    memtechHits: number;
    customMetrics: Record<string, any>;
  };
}
```

#### Dashboard Components:
- **Real-time Metrics**: Ejecuciones en vivo
- **Historical Trends**: Tendencias de uso
- **Error Analytics**: Análisis de errores
- **Performance Heatmap**: Mapa de calor de rendimiento
- **Usage Patterns**: Patrones de uso

### [PROPUESTA] ALERTING Y MONITORING

#### Alert Levels:
- **Critical**: System down, security breach
- **Warning**: Performance degradation, error spikes
- **Info**: New features deployed, usage milestones

#### Monitoring Tools:
- **KPI Dashboard**: Interface en `/dashboard/kpi`
- **Log Aggregation**: JSONL events en `obs/kpi/events.jsonl`
- **Health Checks**: `/health` endpoint por service
- **Performance Profiling**: Built-in profiling por handler

---

## C5 - REFLECT: Optimización y Mejoras

### [K] LECCIONES APRENDIDAS ESPERADAS

#### De Implementación:
- **TypeScript Strict Mode**: Beneficios de tipado estricto
- **Error Boundaries**: Patrones de manejo de errores robustos
- **Async Patterns**: Mejores prácticas con async/await
- **Memory Management**: Optimización de uso de MemTech L1

#### De Integración:
- **MemTech Integration**: Patrones de persistencia eficientes
- **CLI Orchestration**: Coordinación con commands externos
- **Security Boundaries**: Sandbox y validación de inputs
- **Performance Optimization**: Caching y lazy loading

### [U] MECANISMOS DE MEJORA CONTINUA

#### Code Review Process:
- **Peer Review**: Review obligatorio por pares
- **Static Analysis**: Análisis automatizado de calidad
- **Security Review**: Validación de seguridad
- **Performance Review**: Análisis de rendimiento

#### Testing Strategy:
- **Unit Tests**: Tests de unidad por handler
- **Integration Tests**: Tests de integración entre componentes
- **E2E Tests**: Tests end-to-end del flujo completo
- **Performance Tests**: Tests de carga y estrés

#### Documentation:
- **API Docs**: Documentación automática de APIs
- **User Guides**: Guías de uso por command
- **Dev Docs**: Documentación técnica
- **Changelog**: Registro de cambios y mejoras

### [EVIDENCIA] MÉTRICAS DE ÉXITO

#### Quantitative Metrics:
- **Handler Success Rate**: > 95%
- **User Satisfaction**: > 4.5/5
- **Performance Targets**: < 2s response time
- **Quality Metrics**: Zero critical bugs

#### Qualitative Metrics:
- **Developer Experience**: Facilidad de uso
- **Code Maintainability**: Calidad del código
- **System Reliability**: Disponibilidad del servicio
- **Innovation Value**: Valor agregado al sistema

### [PROPUESTA] ROADMAP FUTURO

#### Short Term (1-2 semanas):
- Completar implementación de 6 handlers
- Lograr coverage > 80% en tests
- Integrar KPI dashboard básico
- Documentación inicial completa

#### Medium Term (1 mes):
- Optimización de performance basada en métricas
- Mejoras en UX basadas en feedback
- Integración con más servicios externos
- Advanced features para power users

#### Long Term (3 meses):
- Plugin ecosystem completo
- AI-powered enhancements
- Advanced analytics y ML insights
- Enterprise-ready features

---

## C6 - GATES: Validaciones y Aprobaciones

### [K] QUALITY GATES

#### Por Handler:
- [ ] **G1**: Build + TypeScript strict + Lint pass
- [ ] **G2**: Unit tests con coverage > 80%
- [ ] **G3**: Integration tests funcionando
- [ ] **G4**: Performance benchmarks cumplidos
- [ ] **G5**: Security scan aprobado
- [ ] **G6**: Documentation completa
- [ ] **G7**: KPIs recolectando correctamente
- [ ] **G8**: User acceptance testing

#### Por Fase:
- **Phase 1 (Foundation)**: Gates G1-G4 obligatorios
- **Phase 2 (Intermediate)**: Gates G1-G6 obligatorios
- **Phase 3 (Advanced)**: Todos los gates obligatorios

### [U] VALIDATION CRITERIA

#### Functional Validation:
- **Happy Path**: Casos de uso estándar funcionando
- **Edge Cases**: Casos límite manejados correctamente
- **Error Cases**: Errores manejados gracefulmente
- **Performance**: Tiempos de respuesta dentro de targets

#### Integration Validation:
- **MemTech L1**: Persistencia funcionando correctamente
- **skills-cli**: Commands ejecutándose sin errores
- **router**: Guardrails aplicándose correctamente
- **Cross-Handler**: Comunicación entre handlers funcionando

### [EVIDENCIA] TESTING STRATEGY

#### Test Pyramid:
```
E2E Tests (10%)
├── User workflows completos
└── Cross-system integration

Integration Tests (30%)
├── Handler ↔ MemTech L1
├── Handler ↔ skills-cli
├── Handler ↔ router
└── Cross-handler dependencies

Unit Tests (60%)
├── Handler logic
├── Validation rules
├── Error handling
└── Utility functions
```

#### Test Categories:
- **Smoke Tests**: Validación básica de funcionalidad
- **Regression Tests**: Prevenir bugs conocidos
- **Performance Tests**: Validación de targets
- **Security Tests**: Validación de vulnerabilidades

### [PROPUESTA] APPROVAL WORKFLOW

#### Code Review Process:
1. **Self-Review**: Developer valida criteria básicos
2. **Peer Review**: Otro developer revisa código
3. **Tech Lead Review**: Validación técnica y arquitectónica
4. **QA Review**: Validación funcional y de calidad
5. **Security Review**: Validación de seguridad
6. **Final Approval**: Merge y deployment

#### Sign-off Requirements:
- **Developer**: Código implementa requirements
- **Tech Lead**: Arquitectura y patterns correctos
- **QA**: Funcionalidad y calidad validadas
- **Security**: Seguridad validada
- **Product Owner**: User value confirmado

---

## C7 - RISK MANAGEMENT: Identificación y Mitigación

### [K] RISKS TÉCNICOS

#### High Risk:
- **MemTech L1 Integration**: Fallos en persistencia
  - **Mitigation**: Fallback a filesystem local
  - **Monitoring**: Health checks cada 5min
  - **Recovery**: Auto-retry con exponential backoff

- **TypeScript Strict Mode**: Errores de tipado complejos
  - **Mitigation**: Incremental strict adoption
  - **Monitoring**: Build status en tiempo real
  - **Recovery**: Rollback a última versión estable

#### Medium Risk:
- **Performance Degradation**: Handlers lentos
  - **Mitigation**: Async processing + timeouts
  - **Monitoring**: Performance metrics en dashboard
  - **Recovery**: Queue system + retry logic

- **Security Vulnerabilities**: Code injection en handlers
  - **Mitigation**: Sandboxing + input validation
  - **Monitoring**: Security scans automáticos
  - **Recovery**: Hot patches + security updates

### [U] RISKS DE INTEGRACIÓN

#### Dependency Risks:
- **skills-cli Changes**: Breaking changes en CLI
  - **Mitigation**: Version locking + compatibility tests
  - **Monitoring**: Integration tests en CI/CD
  - **Recovery**: Fallback a version anterior

- **Router Integration**: Guardrails changes
  - **Mitigation**: Contract testing + versioning
  - **Monitoring**: Contract compliance checks
  - **Recovery**: Feature flags + gradual rollout

#### External Dependencies:
- **Node.js Version**: Compatibility issues
  - **Mitigation**: Docker containerization
  - **Monitoring**: Version compatibility matrix
  - **Recovery**: Multi-version support

- **OS Dependencies**: System tools requirements
  - **Mitigation**: Containerized dependencies
  - **Monitoring**: Dependency health checks
  - **Recovery**: Graceful degradation

### [EVIDENCIA] CONTINGENCY PLANNING

#### System Downtime:
- **Detection**: Health checks + monitoring alerts
- **Response**: Auto-failover + backup systems
- **Recovery**: Point-in-time restore + validation
- **Communication**: Status page + user notifications

#### Data Loss:
- **Prevention**: Redundant backups + validation
- **Detection**: Integrity checks + monitoring
- **Response**: Immediate backup restore
- **Recovery**: Data validation + consistency checks

#### Security Breach:
- **Prevention**: Security scanning + access controls
- **Detection**: Intrusion detection + monitoring
- **Response**: Immediate isolation + investigation
- **Recovery**: Patch + security audit + monitoring

### [PROPUESTA] MONITORING DE RIESGOS

#### Risk Dashboard:
- **System Health**: Status de todos los componentes
- **Performance Metrics**: Tiempos de respuesta y throughput
- **Error Rates**: Tasas de error por handler
- **Security Status**: Resultados de security scans

#### Alert Thresholds:
- **Critical**: System down, security breach
- **Warning**: Performance > 2s, error rate > 5%
- **Info**: New deployment, usage milestones

---

## C8 - SUCCESS METRICS: Definición de Éxito

### [K] DEFINICIÓN DE ÉXITO POR HANDLER

#### /build-and-fix:
- **Functional**: Auto-fix 90% de errores TypeScript comunes
- **Performance**: Ejecución < 5s para proyectos medianos
- **Quality**: Zero nuevos errores introducidos
- **User Experience**: Feedback positivo de developers

#### /compact:
- **Functional**: Reduce repositorio size en 20%+
- **Performance**: Operación < 30s
- **Reliability**: Zero data loss durante compactación
- **Integration**: Seamless Git workflow

#### /undo:
- **Functional**: Restore 100% de estados válidos
- **Safety**: Zero operaciones destructivas sin confirmación
- **Performance**: Restore < 10s
- **User Trust**: Confianza en operaciones de reversión

#### /code-review:
- **Functional**: Detecta 95% de issues conocidos
- **Accuracy**: < 5% false positives
- **Speed**: Review completo < 2min
- **Actionability**: 80% de suggestions aplicables

#### /route-research-for-testing:
- **Functional**: Descubre 100% de rutas API
- **Accuracy**: 95% precisión en detección
- **Coverage**: Mapeo completo de auth requirements
- **Documentation**: Genera docs útiles para testing

#### /test-route:
- **Functional**: Genera tests para 90% de rutas
- **Quality**: 95% de tests passing
- **Coverage**: > 80% code coverage
- **Auth Coverage**: 100% de auth scenarios testeados

#### /plugin:
- **Functional**: Carga plugins dinámicamente
- **Security**: 100% sandboxing compliance
- **Performance**: < 100ms plugin load time
- **Extensibility**: API completa para plugins

### [U] MÉTRICAS DEL SISTEMA COMPLETO

#### Technical Excellence:
- **Code Quality**: 0 errores TypeScript, 0 warnings ESLint
- **Test Coverage**: > 80% coverage promedio
- **Performance**: < 2s response time promedio
- **Reliability**: > 99.9% uptime

#### User Experience:
- **Ease of Use**: < 3 comandos para tareas comunes
- **Documentation**: 100% de comandos documentados
- **Error Handling**: Mensajes de error claros y accionables
- **Learning Curve**: < 30min para onboard básico

#### Business Value:
- **Productivity**: 50%+ reducción en tiempo de tareas comunes
- **Quality**: 80%+ reducción en bugs post-deployment
- **Consistency**: 100% estandarización de workflows
- **Innovation**: Base para futuras automatizaciones

### [EVIDENCIA] KPI DASHBOARD

#### Real-time Metrics:
```
Slash Commands Live Dashboard
├── Commands/sec: Real-time throughput
├── Success Rate: % ejecuciones exitosas
├── Avg Response Time: Tiempo promedio
├── Error Rate: % de errores
├── Active Users: Usuarios concurrentes
└── System Health: Status general
```

#### Historical Analytics:
- **Usage Trends**: Patrones de uso temporal
- **Popular Commands**: Top commands más usados
- **Error Patterns**: Patrones de errores comunes
- **Performance Trends**: Evolución de rendimiento
- **User Journey**: Flujos de uso comunes

### [PROPUESTA] SUCCESS VALIDATION

#### Validation Methods:
- **Quantitative Analysis**: Métricas numéricas vs targets
- **Qualitative Feedback**: Encuestas de satisfacción
- **A/B Testing**: Comparación vs workflows anteriores
- **Case Studies**: Historias de éxito reales
- **Peer Reviews**: Validación por expertos

#### Success Criteria Checklist:
- [ ] Todos los 6 handlers implementados
- [ ] Coverage > 80% en tests
- [ ] Performance targets cumplidos
- [ ] Zero security vulnerabilities
- [ ] User satisfaction > 4.5/5
- [ ] Business metrics cumplidas
- [ ] System reliability > 99.9%
- [ ] Documentation completa

---

## NEXT ACTIONS

### Inmediato (Hoy):
- [ ] Setup del repository y workspace
- [ ] Validación de dependencias (MemTech, CLI, router)
- [ ] Implementación de `/build-and-fix` handler base
- [ ] Setup de test infrastructure

### Corto Plazo (3 días):
- [ ] Completar Foundation handlers (1-3)
- [ ] Implementar tests runtime para Foundation
- [ ] Integración MemTech L1 funcional
- [ ] KPI básicos recolectando

### Mediano Plazo (1 semana):
- [ ] Completar Intermediate handlers (4-5)
- [ ] Implementar Advanced handlers (6-7)
- [ ] Full test coverage achieved
- [ ] KPI dashboard completo

### Largo Plazo (2 semanas):
- [ ] Optimization basada en métricas
- [ ] Documentation completa con ejemplos
- [ ] User training y onboard
- [ ] Production deployment listo

---

**Tags System**: [K] CONTEXTO | [U] USUARIO | [EVIDENCIA] EVIDENCIA | [PROPUESTA] PROPUESTA | [CLOOP] Metodología | [TYPE] Implementation Plan | [PRIORITY] High | [COMPLEXITY] Advanced