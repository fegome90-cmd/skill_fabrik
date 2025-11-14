# Code Quality Upgrade Rules v2.0

## Overview
Este archivo contiene las reglas específicas para guiar el trabajo de agentes en la unificación de configuraciones de code quality, eliminando la deuda técnica mediante Clean Architecture y TDD.

## Core Rules

### Task Execution
- **Max Duration**: 120 minutos por tarea
- **Max Subtasks**: 8 por tarea  
- **TDD Mandatory**: Red-Green-Refactor obligatorio
- **Clean Architecture**: Single Responsibility, Dependency Inversion
- **Test Coverage**: Mínimo 80%
- **Documentation**: Requerida para cada cambio
- **Rules Validation**: Obligatorio revisar code-quality-rules.json antes de cada tarea
- **Configuration Review**: Validar que no hay rutas hardcodeadas

### Mandatory Validations (Antes de Cada Tarea)
- **Rules File Check**: Leer y entender code-quality-rules.json
- **Path Validation**: Verificar que no hay rutas hardcodeadas
- **Configuration Consistency**: Revisar que todas las rutas usan configuración dinámica
- **Environment Check**: Validar variables de entorno requeridas
- **Dependency Check**: Verificar que todas las dependencias están disponibles
- **Workspace Check**: Confirmar estructura de directorios según plan
- **Backup Creation**: Crear backup antes de cualquier cambio
- **Rollback Verification**: Validar que mecanismo de rollback funciona

### File Organization  
- **No Magic Numbers**: Todos los valores deben estar en constantes
- **No Hardcoded Values**: Usar variables de entorno o config
- **No Hardcoded Paths**: Usar config o path resolution dinámica
- **No Console Logs**: En código de producción
- **Naming Conventions**: camelCase para variables, PascalCase para clases
- **Consistent Indentation**: 2 espacios para TypeScript
- **Dynamic Path Resolution**: paths desde configuración centralizada

### Code Quality Gates
- **ESLint Validation**: Siempre requerida
- **Prettier Formatting**: Siempre requerida  
- **TypeScript Checking**: Sin errores de tipos
- **Security Validation**: Sin vulnerabilidades
- **Performance**: Quality gates <5 minutos
- **Tests**: Todos los tests pasando

### Architecture Compliance
- **Single Responsibility**: Una responsabilidad por clase
- **Dependency Inversion**: Usar interfaces y DI
- **Interface Segregation**: Interfaces pequeñas y específicas
- **Open/Closed**: Abierto para extensión, cerrado para modificación
- **Composition over Inheritance**: Preferir composición
- **No Circular Dependencies**: Verificar con herramientas

### Testing Requirements (TDD)
- **Red Phase**: Escribir test que falla
- **Green Phase**: Implementar mínima funcionalidad  
- **Refactor Phase**: Mejorar sin cambiar comportamiento
- **Coverage**: 90% unit, 80% integration, 70% e2e
- **Mock Usage**: Required para dependencias externas
- **Test Naming**: Descriptivo y siguiendo convenciones

### Security Rules
- **No Secrets**: Ni en código ni en configuración
- **No Hardcoded Credentials**: Usar variables de entorno
- **Input Validation**: Validar todos los inputs
- **Secure File Operations**: Verificar paths y permisos
- **Secure Command Execution**: Sanitizar comandos
- **Encoding Validation**: UTF-8 consistente

### Performance Requirements
- **Max Execution Time**: Quality gates <300 segundos
- **Max Memory Usage**: <512MB durante ejecución
- **Cache Configuration**: Usar cache para configs
- **Parallel Execution**: Cuando sea posible
- **Progressive Enhancement**: Mejorar gradualmente

### Documentation Requirements
- **Code Comments**: Para lógica compleja
- **API Documentation**: Para interfaces públicas
- **Migration Guide**: Para cambios de config
- **Developer Guidelines**: Para el equipo
- **Troubleshooting**: Problemas comunes y soluciones
- **README Updated**: Con nuevos comandos y procesos

### Migration Safety
- **Backup Before Changes**: Siempre crear backup
- **Rollback Mechanism**: Debe funcionar siempre
- **Gradual Rollout**: Por fases
- **Validation After Each Step**: En cada milestone
- **Version Control**: Tracking de todos los cambios

## Phases and Success Criteria

### Phase 0: Setup (16h)
- TDD framework configurado
- Estructura de proyecto creada
- Dependencias instaladas
- CI/CD pipeline funcionando

### Phase 1: Fundamentals (30h)  
- ESLint configuration unificada
- Prettier configuration unificada
- Scripts de migración creados
- Documentación completa

### Phase 2: Quality Gates (35h)
- Quality gates core implementados
- Husky hooks migrados
- Integration tests pasando
- Performance benchmarks cumplidos

### Phase 3: Advanced Scripts (35h)
- Evidence validation scripts
- Metrics consistency scripts  
- Quality gates orchestration
- Migration automation completa

### Phase 4: Validation (20h)
- E2E tests pasando
- Performance optimizado
- Team training completo
- Zero technical debt achieved

## Quality Metrics

- **Configuration Consistency**: 100%
- **Test Coverage**: 90%
- **Performance Improvement**: 50%
- **Technical Debt**: 0 hours
- **Team Adoption**: 100%

## Agent Guidelines

### Task Execution
- Work en chunks pequeños
- Commit frecuentemente  
- Test después de cada cambio
- Document decisiones importantes
- **Pre-Task Checklist**: Siempre revisar code-quality-rules.json antes de empezar
- **Path Review**: Verificar que ninguna ruta está hardcodeada en el código
- **Configuration Validation**: Usar paths dinámicos desde configuración centralizada

### Problem Solving
- Identificar root cause
- Proponer múltiples soluciones
- Validar soluciones
- Documentar trade-offs

### Quality Assurance
- Self review obligatorio
- Peer review para cambios críticos
- Automated validation siempre
- Continuous improvement mindset

### Pre-Task Validation Checklist (OBLIGATORIO)
Antes de ejecutar cualquier tarea, el agente debe:

1. **Leer** code-quality-rules.json completamente
2. **Validar** que no existen rutas hardcodeadas en el código
3. **Revisar** la configuración de paths del proyecto
4. **Confirmar** que todas las rutas usan resolución dinámica
5. **Verificar** variables de entorno y configuración
6. **Crear backup** del estado actual
7. **Documentar** cualquier configuración especial requerida

### Path Management Guidelines
**PROHIBIDO - Rutas Hardcodeadas (NUNCA usar)**:
- `/Users/felipe/Developer/skills-fabrik/` (path específico del usuario)
- `/home/user/` (path genérico Unix)
- `/usr/local/bin/` (paths del sistema)
- `C:\Users\` (paths de Windows)
- Rutas absolutas específicas del entorno
- Paths que contienen nombres de usuario

**REQUERIDO - Path Resolution Dinámica**:
- Usar `process.cwd()` para directorio actual
- Usar `path.resolve()` para resolución de paths
- Usar `path.join()` para construcción de paths
- Usar configuración centralizada (JSON/YAML)
- Usar variables de entorno para paths externos
- Usar paths relativos desde la raíz del proyecto

**Ejemplo CORRECTO**:
```typescript
// ✅ Correcto - Uso de configuración
import * as path from 'path';
import * as config from './config/project-config.json';

const projectRoot = process.cwd();
const configPath = path.join(projectRoot, config.paths.src);
const targetFile = path.resolve(configPath, 'target-file.ts');

// ✅ Correcto - Variables de entorno
const workspacePath = process.env.WORKSPACE_PATH || path.resolve(process.cwd());
const outputPath = path.join(workspacePath, 'output');

// ✅ Correcto - Path resolution dinámica
const fullPath = path.resolve(__dirname, '..', 'config', 'settings.json');
```

**Ejemplo INCORRECTO**:
```typescript
// ❌ INCORRECTO - Rutas hardcodeadas
const configPath = '/Users/felipe/Developer/skills-fabrik/code-quality-upgrade/src/config';

// ❌ INCORRECTO - Paths específicos de sistema
const binaryPath = '/usr/local/bin/some-tool';

// ❌ INCORRECTO - Paths con nombre de usuario
const homePath = '/Users/felipe/Documents/project';
```

## Deliverables

### Code
- src/config/eslint.config.ts
- src/config/prettier.config.ts  
- src/gates/ (quality gates)
- src/core/ (orchestration)
- scripts/ (migration)
- test/ (complete test suite)

### Documentation
- dev-docs/context.md
- dev-docs/plan.md
- dev-docs/task.md
- docs/developer-guidelines.md
- docs/migration-guide.md

### Validation
- test/unit/ (unit tests)
- test/integration/ (integration tests)
- test/e2e/ (end-to-end tests)
- test/performance/ (performance tests)
- test/security/ (security tests)