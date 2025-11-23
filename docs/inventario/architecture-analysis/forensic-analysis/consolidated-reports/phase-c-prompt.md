# Prompt para Agente Fase C: Testing, Calidad y Errores

## Contexto

Tienes acceso al repositorio Skills Core en `/Users/felipe/Developer/skills-fabrik/`. Ya completamos
la Fase A (inventario estructural) y Fase B (mapa de responsabilidades). Ahora necesito un análisis
profundo del estado actual de testing, calidad y deuda técnica.

## Restricciones CRÍTICAS (Reglas Forenses)

1. **NO MODIFICAR NADA** del repo original, solo observar y describir
2. **NO EJECUTAR** código del repo original bajo ninguna circunstancia
3. **NO PROPONER** cambios durante el análisis, solo recolectar evidencia
4. **NO MEZCLAR** observaciones con recomendaciones (separar estrictamente)
5. **TODA afirmación** debe tener evidencia concreta (rutas, archivos, patrones)
6. **PENSAR como detective**: recolectar evidencia, no hacer juicios sin datos

## Contexto de Fases Anteriores (Hallazgos Previos)

### Componentes Identificados (Fase A)

1. **packages/router** (512KB) - Motor de enrutamiento estable
2. **packages/daemon** (448KB) - Proceso principal con múltiples responsabilidades
3. **packages/skills-cli** (928KB) - Interfaz CLI principal
4. **mcp/** (96MB) - Sistema Model Context Protocol (componente más grande)
5. **skills/** (1.5MB) - 33 skills en 17 categorías funcionales
6. **configs/** - skill-rules.json (27KB) + slash-commands.json (6KB)

### Responsabilidades Confirmadas (Fase B)

- **Daemon como "Big Ball of Mud"**: Múltiples responsabilidades solapadas confirmadas
- **Router con Responsabilidad Clara**: Solo enrutamiento HTTP
- **MCP como Ecosistema Externo**: Sistema de integración independiente
- **Skills Autónomas**: 33 skills con orquestación centralizada por Daemon
- **Configuración Centralizada**: skill-rules.json como punto de gobernanza

## Tarea Específica Fase C: Análisis de Testing, Calidad y Errores

### 1. Inventario Completo de Tests Existentes

Para cada componente del sistema, analiza:

#### Tests por Componente

- **packages/router/**: ¿Qué tests existen? ¿Tipo de tests? ¿Cobertura?
- **packages/daemon/**: ¿Qué tests existen? ¿Tipo de tests? ¿Cobertura?
- **packages/skills-cli/**: ¿Qué tests existen? ¿Tipo de tests? ¿Cobertura?
- **skills/**: ¿Cómo se testean las 33 skills? ¿Tests individuales?
- **MCP/**: ¿Qué testing tiene el componente más grande?

#### Tipos de Tests Identificados

- **Unit Tests**: Jest, Mocha, o similares frameworks
- **Integration Tests**: Entre componentes del sistema
- **E2E Tests**: Playwright, Cypress, u otros
- **API Tests**: Testing de endpoints
- **CLI Tests**: Testing de comandos de línea

### 2. Análisis de Cobertura por Componente

#### Cobertura Cuantitativa

- **Número de tests** por componente
- **Líneas de código cubiertas** vs totales
- **Porcentaje de cobertura** estimado
- **Componentes sin cobertura** identificados

#### Cobertura Cualitativa

- **Flujos críticos testeados**: Startup, shutdown, errores
- **Casos borde evaluados**: Error handling, validaciones
- **Integraciones testeadas**: Componentes entre sí
- **Escenarios reales**: Casos de uso del sistema

### 3. Detección de Deuda Técnica

#### TODO/FIXME/HACK

- **Localización exacta**: `/path/to/file.ext:line_number`
- **Severidad estimada**: Blocker, Major, Minor
- **Contexto**: Qué hace falta y por qué
- **Impacto**: En qué afecta al sistema

#### Code Smells y Patrones Problemáticos

- **Código duplicado**: Patrones repetidos
- **Funciones largas**: Complejidad ciclomática
- **Acoplamiento fuerte**: Dependencias no deseadas
- **Nombres ambiguos**: Variables, funciones, clases

#### Configuraciones y Scripts

- **Scripts duplicados**: Variaciones de mismos comandos
- **Configs inconsistentes**: Diferentes formatos
- **Dependencias sin uso**: Package.json analysis
- **Versiones desactualizadas**: Security issues

### 4. Análisis de Calidad de Tests

#### Calidad de Test Code

- **Nombres descriptivos**: ¿Qué testea cada test?
- **Setup y Teardown**: Preparación adecuada?
- **Assertions claras**: ¿Qué se valida exactamente?
- **Tests frágiles**: Dependencias externas, timing

#### Patrones de Testing

- **Arrange-Act-Assert**: Estructura clara
- **Test Data Management**: Fixtures, mocks
- **Isolation**: Tests independientes
- **Documentation**: Comentarios en tests complejos

### 5. Identificación de Áreas Críticas sin Pruebas

#### Componentes Críticos sin Testing

- **Daemon core**: Gestión de estado, eventos
- **Router logic**: Enrutamiento, middlewares
- **Skills execution**: Ciclo de vida de skills
- **Error handling**: Excepciones, recuperación

#### Flujos de Negocio sin Cobertura

- **Skill discovery**: Registro y descubrimiento
- **Configuration loading**: skill-rules.json parsing
- **EventBus communication**: Publicación/suscripción
- **CLI orchestration**: Comando → Daemon interaction

## Formato del Informe

Usa exactamente esta estructura:

```markdown
# Informe Fase C: Testing, Calidad y Errores

## Metadata

- **Fase**: C
- **Nombre**: Testing, Calidad y Errores
- **Fecha**: YYYY-MM-DD
- **Status**: Completado
- **Quality Gates**: Validado con rules_forense.json
- **Método**: Análisis forense sin intervención del repo

## Resumen Ejecutivo

{10-15 líneas resumiendo estado del testing, deuda técnica y calidad}

## Evidencia Recopilada

### Área 1: Inventario de Tests Existentes

- **Hallazgo**: {descripción clara}
  - **Evidencia**: {ruta exacta, archivo, conteo específico}
  - **Análisis**: {qué significa este hallazgo}
  - **Impacto**: {implicaciones para la calidad}
  - **Contexto**: {relación con otros componentes}

### Área 2: Análisis de Cobertura por Componente

{mismo formato}

### Área 3: Detección de Deuda Técnica

{mismo formato}

### Área 4: Calidad de Tests Existentes

{mismo formato}

### Área 5: Áreas Críticas sin Pruebas

{mismo formato}

{continuar con otras áreas...}

## Hallazgos Clave

{Los 3-5 descubrimientos más importantes sobre testing y deuda técnica}

## Análisis Detallado

{Análisis completo por componente con métricas y patrones}

## Validación de Calidad

- **Lint**: ✅ Sin errores de sintaxis en análisis
- **Format**: ✅ Formato consistente en texto plano
- **Evidence**: ✅ Todos los hallazgos con rutas y datos específicos
- **Completeness**: ✅ Todas las áreas clave documentadas
- **Rules Compliance**: ✅ Cumple 100% de rules_forense.json

## Referencias Cruzadas

- **Fase A**: Evidencia complementaria de inventario estructural
- **Fase B**: Evidencia complementaria de responsabilidades
- **dev-docs/plan.md**: Planificación original de Fase C
- **dev-docs/context.md**: Contexto técnico y reglas

---

**Análisis completado respetando rules_forense.json** **Integridad del repositorio: 100%
preservada** **Evidence recolectada: Todas las afirmaciones con respaldo verificable**
```

## Prioridades de Análisis

1. **Testing en Daemon**: Componente más crítico con "Big Ball of Mud"
2. **Cobertura de Skills**: 33 skills individuales requieren análisis
3. **Testing en Router**: Componente estable pero con responsabilidades críticas
4. **Deuda Técnica en MCP**: Componente más grande (96MB) sin analizar previamente
5. **Integración Tests**: Testing entre componentes del sistema

## Métricas Específicas a Recolectar

### Testing Metrics

- **Total number of test files**
- **Lines of test code vs production code**
- **Test frameworks identified**
- **Coverage percentages by component**
- **Test execution time estimates**

### Deuda Técnica Metrics

- **Number of TODO/FIXME/HACK comments**
- **Files with duplicated code**
- **Functions exceeding complexity thresholds**
- **Unused dependencies**
- **Security vulnerabilities in dependencies**

### Quality Metrics

- **Code duplication percentage**
- **Average function length**
- **Files without any tests**
- **Critical untested paths**
- **Test flakiness indicators**

## Advertencia Final

Recuerda: Eres un detective forense, no un arquitecto de testing. Tu trabajo es recolectar evidencia
del estado actual del testing, no proponer mejoras. Cada afirmación debe tener una ruta, archivo o
patrón específico como respaldo.
