# ADR: 0001 - Extract Authentication Module from Daemon

## Status
Proposed

## Context
El Daemon actual presenta un patrón "Big Ball of Mud" con 50+ imports en un solo archivo, violando el Single Responsibility Principle. La autenticación está mezclada con business logic, configuration, y métricas, lo que crea:
- **Security vulnerabilities**: Hardcoded approvals en líneas 19, 27, 31
- **Testing complexity**: Imposible testear autenticación en forma aislada
- **Maintenance burden**: Cambios en autenticación afectan todo el Daemon
- **Code coupling**: Alta dependencia cruzada entre dominios

Evidencia: [Technical Debt F-001](../analysis/technical-debt.md#f001), [Security Risk Assessment](../analysis/security-risks.md#authentication-flaws)

## Decision
Extraer el sistema de autenticación del Daemon en un módulo separado y dedicado con las siguientes características:

**Nueva Arquitectura:**
```
packages/
├── authentication/
│   ├── src/
│   │   ├── auth-service.js        # Core authentication logic
│   │   ├── middleware/          # Express middleware
│   │   ├── validators/          # JWT validation
│   │   └── strategies/          # Auth strategies (JWT, OAuth, etc.)
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── security/
│   └── config/
│       └── auth-config.js         # Environment-based configuration
└── daemon/
    └── src/
        └── app.js               # Refactored to use auth module
```

**Configuración via Environment Variables:**
- `AUTH_STRATEGY`: jwt, oauth, session
- `JWT_SECRET`: Process environment (no hardcoded)
- `AUTH_APPROVAL_MODE`: manual, auto, hybrid
- `AUTH_LOG_LEVEL`: debug, info, error

## Consequences

### Positivas:
- **Security improvement**: Eliminación de hardcoded approvals
- **Testing facilitation**: Authentication puede ser testeado en forma aislada
- **Single Responsibility**: Cada módulo con responsabilidad clara
- **Reusability**: Authentication module puede ser usado por otros componentes
- **Maintainability**: Cambios en auth no afectan otras áreas

### Negativas:
- **Initial complexity**: Requiere refactorización del Daemon actual
- **Integration effort**: Consumir authentication module desde Daemon
- **Configuration migration**: Migrar de hardcoded a environment variables
- **Development time**: 2-3 semanas para implementación completa

Implementación:
- [Paso 1] Crear authentication module con tests >80%
- [Paso 2] Refactorizar Daemon para consumir auth module
- [Paso 3] Migrar configuración a environment variables
- [Paso 4] Integration testing + security testing
- [Paso 5] Characterization testing para preservación de comportamiento

---

## Metadata
**ID**: 0001
**Domain**: Architecture Decision Record
**Author**: Skills Fabrik Team
**Date Proposed**: 2025-11-15
**Status**: Proposed
**Decided By**: Pending Architecture Review
**Priority**: 🔴 Critical
**Related ADRs**: [0002](0002-centralize-configuration.md), [0003](../quality/0003-implement-comprehensive-testing-strategy.md)

## Evidence
- **Security Analysis**: Hardcoded user approvals [SECURITY-RISKS-CRITICAL]
- **Technical Debt**: Authentication bypass vulnerabilities [TECHNICAL-DEBT-F001]
- **Component Metrics**: Daemon coupling >50 imports [COMPONENT-METRICS-DAEMON]
- **Code Patterns**: Big Ball of Mud pattern [CODE-PATTERN-BIG-BALL-OF-MUD]

## Implementation Notes
Esta decisión es crítica porque resuelve vulnerabilidades de seguridad activas (F-001) y establece las bases para una arquitectura limpia. Es prerequisito para otras decisiones de refatorización.

## References
- [Original Analysis](../analysis/contenido-util-para-refactorizacion.txt#L153-L167)
- [Security Best Practices](https://owasp.org/www-project-secure-coding-practices/)
- [Single Responsibility Principle](https://en.wikipedia.org/wiki/Single_responsibility_principle)
- [Authentication Patterns](https://auth0.com/blog/authentication-patterns)