# ADR: 0002 - Centralize Configuration Management

## Status
Proposed

## Context
Configuración actual está dispersa y hardcoded en múltiples archivos:
- packages/skills-cli/dist/commands/plan.js: "approvedBy = 'user'"
- packages/daemon/src/app.ts: Multiple configuration TODOs
- Router y otros componentes: Configuración mezclada con business logic

Esto crea problemas de:
- **Security**: Secrets hardcoded
- **Maintainability**: Cambios requieren modificar múltiples archivos
- **Environment management**: Dificil configurar por environment
- **Testing**: Imposible mockear configuración consistentemente

## Decision
Centralizar toda la configuración en un sistema unificado con:

**Configuration Structure:**
```
config/
├── environments/
│   ├── development.json
│   ├── staging.json
│   ├── production.json
│   └── test.json
├── schemas/
│   ├── app-config.schema.json
│   ├── database-config.schema.json
│   └── auth-config.schema.json
└── index.js                # Environment-aware config loader
```

**Environment Variables:**
- `NODE_ENV`: development/staging/production/test
- `CONFIG_PATH`: Override path to config files
- `SECRET_KEY`: Environment-specific secrets
- `API_BASE_URL`: Environment-specific endpoints

## Consequences

### Positivas:
- **Security improvement**: Eliminación de hardcoded values
- **Maintainability**: Configuración centralizada
- **Environment management**: Fácil switching entre environments
- **Testing**: Consistent configuration mockable
- **Validation**: Schema validation para configuración

### Negativas:
- **Migration effort**: Requerir refactorización de archivos existentes
- **Initial complexity**: Nuevo sistema de configuración
- **Learning curve**: Equipo debe adaptarse al nuevo sistema

Implementación:
- [Paso 1] Crear estructura de configuración centralizada
- [Paso 2] Migrar hardcoded values a environment variables
- [Paso 3] Refactorizar componentes para usar config centralizada
- [Paso 4] Schema validation y testing
- [Paso 5] Documentation y training

---

## Metadata
**ID**: 0002
**Domain**: Architecture Decision Record
**Author**: Skills Fabrik Team
**Date Proposed**: 2025-11-15
**Status**: Proposed
**Decided By**: Pending Architecture Review
**Priority**: 🟠 High
**Related ADRs**: [0001](0001-extract-authentication-module.md), [0003](../quality/0003-implement-comprehensive-testing-strategy.md)

## Evidence
- **Configuration Analysis**: Hardcoded values discovered [SECURITY-RISKS-CRITICAL]
- **Technical Debt**: Configuration scattered across components [TECHNICAL-DEBT-F002]
- **Security Assessment**: Secrets hardcoded risks [SECURITY-RISKS-CONFIG]

## Implementation Notes
Esta decisión es complementaria a 0001 y es critical para eliminar configuraciones inseguras. Debe ser implementada en paralelo con la extracción del authentication module.

## References
- [Configuration Best Practices](https://12factor.net/config/)
- [Environment Variables Guide](https://nodejs.dev/learn/managing-environment-variables)
- [Schema Validation](https://json-schema.org/)
- [12-Factor App Configuration](https://12factor.net/)