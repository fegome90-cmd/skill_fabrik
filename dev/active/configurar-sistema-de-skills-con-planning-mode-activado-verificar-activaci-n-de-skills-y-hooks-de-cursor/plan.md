# Plan: Configuración y Verificación del Sistema de Skills con Planning Mode

**ID**: skills-planning-mode-configuration-v2
**Version**: 2.0.0
**Created**: 2025-11-02T11:00:00.000Z
**Updated**: 2025-11-02T11:00:00.000Z
**Status**: In Progress

**Approved by**: Skills Fabric Development Team
**Approved at**: 2025-11-02T11:00:00.000Z

---

## Executive Summary

Este plan establece la configuración completa del sistema de Skills Fabric con planning mode activado, verificando la correcta activación de skills y hooks de Cursor. El objetivo es asegurar que el sistema funcione de manera óptima con el modo de planificación habilitado, validando tanto la configuración técnica como la integración con el editor Cursor.

## Objectives

### Primary Goals
1. **Planning Mode Configuration**: Habilitar y configurar el modo de planificación del sistema
2. **Skills Activation Verification**: Validar que las skills se activen correctamente
3. **Cursor Integration**: Asegurar la integración completa con hooks de Cursor
4. **Quality Assurance**: Verificar el funcionamiento del sistema de calidad
5. **Documentation**: Documentar la configuración y procedimientos

### Success Criteria
- **100%** de los hooks de Cursor configurados y funcionando
- **95%** de skills clave activándose con thresholds apropiados
- **Planning mode** funcionando sin bloquear el desarrollo
- **Zero errores** en la configuración de skills y hooks
- **Complete documentation** de procedimientos y configuración

## CLOOP Methodology Implementation

### Clarify Phase
- **Problem**: Necesidad de configurar y verificar el sistema completo de skills con planning mode
- **Scope**: Configuración de CLI, skills, hooks de Cursor, y validación de activación
- **Success Metrics**: Configuración exitosa, activación de skills, integración funcional
- **Constraints**: No interrumpir el flujo de desarrollo actual

### Layout Phase
- **Architecture**: Configuración multi-capa (CLI → Skills → Router → Daemon → Cursor)
- **Technology Stack**: Node.js CLI, JSON configuration, JavaScript hooks
- **Integration Points**: Cursor IDE, skills registry, quality hooks
- **Configuration Management**: JSON configs, environment variables, hooks setup

### Operate Phase
- **Implementation**: Configuración gradual con validación en cada paso
- **Testing**: Verificación de activación de skills y funcionamiento de hooks
- **Validation**: Pruebas con prompts de prueba y escenarios reales
- **Documentation**: Registro de procedimientos y configuración

### Observe Phase
- **Metrics Collection**: Tasa de activación de skills, tiempos de respuesta
- **Performance Monitoring**: Latencia de hooks, uso de recursos
- **User Feedback**: Experiencia del desarrollador con planning mode
- **System Health**: Estado de los servicios y configuración

### Reflect Phase
- **Post-configuration Review**: Efectividad de la configuración
- **Process Optimization**: Mejora de procedimientos de configuración
- **Integration Assessment**: Evaluación de la integración Cursor-Skills
- **Future Planning**: Configuración avanzada y nuevos features

## Implementation Phases

### Phase 1: Environment Preparation (Day 1)
**Duration**: 4 hours
**Priority**: Critical

#### Tasks
1. **CLI Build and Setup**
   - Execute `pnpm install` for dependency installation
   - Execute `pnpm -w build` for latest CLI build
   - Verify CLI installation and global linking
   - Validate CLI commands functionality

2. **Cursor Hooks Installation**
   - Execute `node packages/skills-cli/dist/index.js hooks setup`
   - Validate `.cursor/hooks/` directory structure
   - Verify `userPromptSubmit.mjs`, `stop.mjs`, `hooks-config.json`
   - Test hook functionality with basic commands

3. **Environment Validation**
   - Check service dependencies (daemon, router)
   - Validate database connections
   - Verify configuration files integrity
   - Test system health endpoints

**Deliverables:**
- Updated CLI build
- Configured Cursor hooks
- Validated environment
- Health check report

### Phase 2: Skills Configuration (Day 1-2)
**Duration**: 6 hours
**Priority**: Critical

#### Tasks
1. **Skills Rules Validation**
   - Review `configs/skill-rules.json` configuration
   - Validate key skills are enabled (backend-dev-guidelines, database-verification)
   - Check enforcement levels and thresholds
   - Verify skill metadata and descriptions

2. **Skills Linting and Validation**
   - Execute `node packages/skills-cli/dist/index.js skills lint ./skills --strict`
   - Fix any linting issues found
   - Validate skill structure compliance
   - Check skill metadata completeness

3. **Skills Registry Generation**
   - Execute `node packages/skills-cli/dist/index.js skills index ./skills --out ./registry/index.json`
   - Validate registry generation
   - Check skill coverage in registry
   - Verify registry format and structure

**Deliverables:**
- Validated skills configuration
- Fixed linting issues
- Updated skills registry
- Skills configuration report

### Phase 3: Planning Mode Configuration (Day 2)
**Duration**: 4 hours
**Priority**: High

#### Tasks
1. **Planning Mode Activation**
   - Set `SKILLS_PLANNING_MODE=true` environment variable
   - Configure planning mode parameters
   - Set up plan storage location
   - Initialize planning mode system

2. **Plan Management Setup**
   - Create plan directory structure
   - Configure plan templates
   - Set up plan approval workflow
   - Test plan creation and approval

3. **Integration Testing**
   - Test planning mode with CLI commands
   - Verify plan detection in pre-hooks
   - Validate plan approval workflow
   - Test plan execution flow

**Deliverables:**
- Activated planning mode
- Configured plan management
- Integration test results
- Planning mode documentation

### Phase 4: Cursor Integration Verification (Day 2-3)
**Duration**: 6 hours
**Priority**: Critical

#### Tasks
1. **Pre-Hook Testing**
   - Open Cursor with approved plan
   - Verify pre-hook recognizes active plan
   - Test plan injection in prompts
   - Validate skill activation with plan context

2. **Skill Activation Testing**
   - Test prompts that activate `backend-dev-guidelines`
   - Test prompts that activate `database-verification-*`
   - Verify skill activation with planning mode
   - Record activation evidence and metrics

3. **Stop Hook Testing**
   - Execute code changes in Cursor
   - Verify stop hook execution
   - Test quality gates with planning mode
   - Validate KPI emission and logging

**Deliverables:**
- Cursor integration verification
- Skill activation test results
- Quality hook validation
- Integration metrics report

### Phase 5: Quality Assurance and Documentation (Day 3)
**Duration**: 4 hours
**Priority**: High

#### Tasks
1. **Comprehensive Testing**
   - End-to-end workflow testing
   - Edge cases and error scenarios
   - Performance impact assessment
   - User experience validation

2. **Documentation Creation**
   - Configuration procedures documentation
   - Troubleshooting guide creation
   - Best practices documentation
   - Training materials preparation

3. **Final Validation**
   - Complete system health check
   - Configuration backup creation
   - Rollback procedures validation
   - Success criteria verification

**Deliverables:**
- Complete test suite
- Comprehensive documentation
- System validation report
- Backup and rollback procedures

## Technical Configuration

### Environment Variables
```bash
# Planning Mode Configuration
SKILLS_PLANNING_MODE=true
SKILLS_PLANNING_THRESHOLD=0.6
SKILLS_PLANNING_STORAGE=.sf/plans

# Skills Configuration
SKILLS_ACTIVATION_THRESHOLD=0.6
SKILLS_RULES_PATH=./configs/skill-rules.json
SKILLS_REGISTRY_PATH=./registry/index.json

# Service Configuration
SF_HOST=127.0.0.1
SF_PORT=7727
ROUTER_HOST=127.0.0.1
ROUTER_PORT=3000

# Integration Configuration
CURSOR_HOOKS_PATH=./.cursor/hooks
CURSOR_CONFIG_PATH=./.cursor/hooks/hooks-config.json
```

### Key Configuration Files

#### Skills Rules (`configs/skill-rules.json`)
```json
{
  "backend-dev-guidelines": {
    "promptTriggers": {
      "keywords": ["backend", "api", "server", "express", "fastify"],
      "intentPatterns": ["implement.*api", "create.*server", "build.*backend"],
      "severity": "suggest"
    },
    "fileTriggers": {
      "pathPatterns": ["src/server/**", "backend/**", "api/**"],
      "contentPatterns": ["express\\.", "fastify\\.", "app\\.listen"]
    }
  },
  "database-verification": {
    "promptTriggers": {
      "keywords": ["database", "sql", "migration", "query"],
      "severity": "warn"
    },
    "fileTriggers": {
      "pathPatterns": ["migrations/**", "**/*.sql", "**/db/**"],
      "contentPatterns": ["CREATE TABLE", "ALTER TABLE", "DROP TABLE", "SELECT\\s*\\*"]
    }
  }
}
```

#### Cursor Hooks Config (`.cursor/hooks/hooks-config.json`)
```json
{
  "userPromptSubmit": {
    "url": "http://127.0.0.1:3000/pre-invoke",
    "method": "POST",
    "headers": {
      "Content-Type": "application/json",
      "X-Cursor-Integration": "skills-fabric"
    }
  },
  "stop": {
    "url": "http://127.0.0.1:3000/stop",
    "method": "POST",
    "headers": {
      "Content-Type": "application/json",
      "X-Cursor-Integration": "skills-fabric"
    },
    "notifications": {
      "enabled": true,
      "onSuccess": true,
      "onError": true,
      "onWarning": true,
      "scriptPath": "scripts/hooks/notify.sh"
    }
  }
}
```

## Integration Architecture

### System Flow
```
Cursor IDE ──┐
            ├──► Pre-invoke Hook ──► Router (3000) ──► Skills Engine
            │                                           │
            │                                           ▼
            │                                   Planning Mode Check
            │                                           │
            │                                           ▼
            │                                    Skill Activation
            │                                           │
            │                                           ▼
            │                                   Daemon (7727)
            │
            └──► Stop Hook ─────────────► Router (3000) ──► Quality Pipeline
                                                        │
                                                        ▼
                                                 KPI Emission & Logging
```

### Data Flow
1. **User Input** → Cursor IDE
2. **Pre-invoke Hook** → Router service → Skills activation
3. **Planning Mode Check** → Plan validation/approval
4. **Skill Execution** → Daemon service
5. **Code Changes** → Stop hook → Quality pipeline
6. **Results** → KPI emission → Notification system

## Quality Assurance

### Testing Strategy

#### Unit Tests
- CLI command functionality
- Skills rule processing
- Hook execution logic
- Planning mode validation

#### Integration Tests
- Cursor hook communication
- Router service integration
- Daemon service coordination
- End-to-end workflow validation

#### User Acceptance Tests
- Developer workflow validation
- Planning mode usability
- Skill activation accuracy
- Quality enforcement effectiveness

### Success Metrics

#### Technical Metrics
- **Hook Response Time**: <200ms for pre-invoke and stop hooks
- **Skill Activation Rate**: ≥95% for configured skills
- **Planning Mode Accuracy**: 100% plan detection and validation
- **System Uptime**: ≥99.5% for all services

#### User Experience Metrics
- **Configuration Success Rate**: 100% successful setup
- **Skill Relevance**: ≥90% relevant skill activation
- **Quality Gate Effectiveness**: 100% policy enforcement
- **Developer Satisfaction**: ≥4.5/5 user experience rating

## Risk Management

### Technical Risks
1. **Hook Failure**: Cursor hooks not executing properly
2. **Service Dependencies**: Router or daemon services unavailable
3. **Configuration Issues**: Invalid skill rules or planning mode settings
4. **Performance Impact**: Planning mode adding unacceptable latency

### Mitigation Strategies
1. **Hook Validation**: Comprehensive hook testing and validation
2. **Service Monitoring**: Real-time service health monitoring
3. **Configuration Validation**: Schema validation and testing
4. **Performance Optimization**: Efficient planning mode implementation

### Rollback Procedures
1. **Configuration Backup**: Complete configuration backup before changes
2. **Service Restoration**: Service restart and configuration restoration
3. **Hook Restoration**: Cursor hooks reinstallation
4. **Validation Testing**: Post-rollback validation testing

## Monitoring and Observability

### Key Metrics
- Hook execution success rate
- Skill activation frequency
- Planning mode usage statistics
- Quality gate enforcement metrics
- System performance indicators

### Alerting
- Hook failure notifications
- Service unavailability alerts
- Configuration error notifications
- Performance degradation alerts

### Logging
- Hook execution logs
- Skill activation logs
- Planning mode decision logs
- Quality enforcement logs
- System error logs

## Success Criteria Validation

### Functional Requirements
✅ Planning mode activated and functional
✅ Skills activating correctly with appropriate thresholds
✅ Cursor hooks installed and working
✅ Quality enforcement pipeline functional
✅ CLI commands working properly

### Non-Functional Requirements
✅ System performance within acceptable limits
✅ Configuration properly documented
✅ Monitoring and alerting functional
✅ Backup and rollback procedures validated
✅ User training materials prepared

## Dependencies

### Internal Dependencies
- **Skills CLI**: Latest build with planning mode support
- **Router Service**: Pre-invoke and stop hook endpoints
- **Daemon Service**: Skill execution and policy enforcement
- **Configuration Files**: Skills rules and registry files

### External Dependencies
- **Cursor IDE**: Hook support and integration
- **Node.js**: Runtime environment (≥18)
- **pnpm**: Package manager
- **PostgreSQL**: Planning mode storage (optional)

## Timeline

### Day 1 (8 hours)
- **Morning**: Environment preparation and CLI setup
- **Afternoon**: Skills configuration and validation

### Day 2 (8 hours)
- **Morning**: Planning mode configuration
- **Afternoon**: Cursor integration verification

### Day 3 (8 hours)
- **Morning**: Quality assurance and testing
- **Afternoon**: Documentation and final validation

## Resource Allocation

### Personnel
- **DevOps Engineer**: 100% allocation (configuration and setup)
- **Backend Developer**: 60% allocation (integration and testing)
- **QA Engineer**: 40% allocation (validation and documentation)

### Tools and Environment
- **Development Environment**: Skills Fabric development setup
- **Cursor IDE**: Latest version with hook support
- **Testing Environment**: Isolated testing configuration
- **Monitoring Tools**: System monitoring and logging

## Deliverables

1. **Configuration Package**: Complete configuration files and scripts
2. **Documentation**: User guides and troubleshooting documentation
3. **Test Suite**: Comprehensive test coverage
4. **Monitoring Setup**: Dashboards and alerting configuration
5. **Backup Procedures**: Configuration backup and restoration scripts

## Next Steps

1. **Immediate**: Execute environment preparation phase
2. **Short-term**: Complete skills configuration
3. **Medium-term**: Implement planning mode
4. **Long-term**: Optimize and monitor system performance

---

*Last Updated: 2025-11-02T11:00:00.000Z*
*Next Review: 2025-11-05T11:00:00.000Z*