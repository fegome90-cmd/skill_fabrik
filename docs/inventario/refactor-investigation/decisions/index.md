# Architecture Decision Records (ADRs) - Skills Fabrik Refactorization

## Overview
Esta sección contiene las decisiones arquitectónicas que guían el proceso de refactorización de Skills Fabrik. Cada ADR sigue el formato estándar `000X` y está respaldado por la evidencia del análisis forense.

## ADR Index

### Core Refactoring Decisions

| ADR | Title | Status | Priority | Impact |
|-----|-------|---------|----------|
| [0001](./security/0001-extract-authentication-module.md) | Extract Authentication Module from Daemon | Proposed | 🔴 Critical |
| [0002](./security/0002-centralize-configuration-management.md) | Centralize Configuration Management | Proposed | 🟠 High |
| [0003](./quality/0003-implement-comprehensive-testing-strategy.md) | Implement Comprehensive Testing Strategy | Proposed | 🔴 Critical |

### Domain Navigation

#### 🔒 Security & Architecture Decisions
- [All Security ADRs](./security/) - Authentication, authorization, vulnerabilities
- [Current: 0001](./security/0001-extract-authentication-module.md)
- [Current: 0002](./security/0002-centralize-configuration-management.md)

#### ✅ Quality Assurance & Testing Decisions
- [All QA ADRs](./quality/) - Testing, quality gates, validation
- [Current: 0003](./quality/0003-implement-comprehensive-testing-strategy.md)

#### 🏗️ Architecture & System Design Decisions
- [All Architecture ADRs](./architecture/) - Structure, patterns, design
- [Coming soon]

#### ⚡ Performance & Optimization Decisions
- [All Performance ADRs](./performance/) - Speed, memory, optimization
- [Coming soon]

#### 🛠️ Development Process & Workflow Decisions
- [All Development ADRs](./development/) - Tools, workflows, practices
- [Coming soon]

---

## Process

1. **Proposal**: Creado en estado "Proposed" con ID correcto
2. **Review**: Discusión en Architecture Review
3. **Decision**: Aceptado/Rechazado/Superceded
4. **Implementation**: Seguimiento de implementación
5. **Retrospective**: Post-implementation review

## Evidence Links

Cada ADR está respaldado por evidencia del análisis forense:

- [Technical Debt Analysis](../analysis/technical-debt-analysis.md)
- [Security Risk Assessment](../analysis/security-risk-assessment.md)
- [Component Metrics](../analysis/component-metrics.md)
- [Full Analysis](../analysis/contenido-util-para-refactorizacion.txt)

## Quick Stats

- **Total ADRs**: 3 (todos propuestos)
- **Security Domain**: 2 (67%)
- **QA Domain**: 1 (33%)
- **Critical Priority**: 2 (67%)
- **High Priority**: 1 (33%)
- **Implementation Ready**: 3 (100%)

---

## Templates & Documentation

### 📋 Templates
Para crear nuevos ADRs, seguir el formato estándar:
```
# ADR: 000X - [Title]

## Status
Proposed

## Context
[Context and problem statement]

## Decision
[Clear architectural decision]

## Consequences
[Positive and negative consequences]

## Metadata
**ID**: 000X
**Domain**: Architecture Decision Record
**Author**: [Name]
**Date Proposed**: [Date]
**Status**: Proposed/Accepted/Rejected/Superseded
**Priority**: [🔴 Critical/🟠 High/🟡 Medium/🟢 Low]
**Related ADRs**: [List related ADRs]

## Evidence
[Supporting evidence and references]

## Implementation Notes
[Implementation details and timeline]
```

---

**Last Updated**: 2025-11-15
**Next Review**: 2025-11-21
**Owner**: Architecture Team
**Location**: `refactor-investigation/decisions/`