# Prompt para Agente Fase D: CLI, Runtime, pm2 y Uso Real

## Contexto

Tienes acceso al repositorio Skills Core en `/Users/felipe/Developer/skills-fabrik/`. Ya completamos
la Fase A (inventario estructural), Fase B (mapa de responsabilidades) y Fase C (testing y calidad).
Ahora necesito un análisis profundo de los scripts, configuraciones y flujos operativos del sistema.

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
2. **packages/daemon** (448KB) - Proceso principal con múltiples responsabilidades ("Big Ball of
   Mud")
3. **packages/skills-cli** (928KB) - Interfaz CLI principal
4. **mcp/** (96MB) - Sistema Model Context Protocol (componente más grande)
5. **skills/** (1.5MB) - 33 skills en 17 categorías funcionales
6. **configs/** - skill-rules.json (27KB) + slash-commands.json (6KB)

### Responsabilidades Confirmadas (Fase B)

- **Daemon como "Big Ball of Mud"**: Múltiples responsabilidades solapadas (gestión de procesos,
  orquestación, eventos, estado)
- **Router con Responsabilidad Clara**: Solo enrutamiento HTTP, middleware de autenticación/logging
- **MCP como Ecosistema Externo**: Sistema de integración independiente
- **Skills Autónomas**: 33 skills con orquestación centralizada por Daemon
- **Configuración Centralizada**: skill-rules.json como punto de gobernanza

### Estado de Testing (Fase C)

- **Cobertura < 5%**: Solo 3 archivos tests Playwright vs ~100MB código
- **Deuda técnica**: 37 TODO/FIXME/HACK concentrados en daemon y MCP
- **Componentes críticos sin pruebas**: Daemon, Skills CLI, MCP, 33 skills
- **Riesgo operativo elevado**: Core EventBus, skill discovery sin testing

## Tarea Específica Fase D: Análisis de Scripts, Runtime y Operación

### 1. Análisis Exhaustivo de Scripts npm/pnpm

#### Scripts Principales del Sistema

Busca y documenta TODOS los scripts en package.json:

- **Scripts de desarrollo**: dev, start, build, serve, watch
- **Scripts de testing**: test, test:watch, test:coverage
- **Scripts de calidad**: lint, format, validate
- **Scripts de despliegue**: deploy, build:prod, start:prod
- **Scripts de operación**: setup, install, clean

#### Scripts por Componente

- **packages/**: Scripts específicos de cada paquete
- **skills/**: Scripts de skills individuales si existen
- **configs/**: Scripts de configuración
- **scripts/**: Scripts del proyecto principal

#### Análisis de Dependencias de Scripts

- **Secuencias de ejecución**: Qué scripts dependen de otros
- **Precondiciones**: Qué necesita ejecutarse antes
- **Side effects**: Qué efectos secundarios producen
- **Orden de ejecución**: Secuencia lógica requerida

### 2. Análisis Detallado de Configuraciones PM2

#### Archivos de Configuración PM2

Busca y analiza TODOS los archivos de configuración PM2:

- **ecosystem.config.js**: Configuración principal PM2
- **ecosystem.config.\*.js**: Variaciones por entorno
- **pm2.config.js**: Configuraciones alternativas
- **apps.json**: Definiciones de aplicaciones

#### Configuraciones de Procesos

- **Daemon process**: Configuración del proceso principal
- **Router process**: Configuración del motor de enrutamiento
- **CLI process**: Configuración de la interfaz CLI
- **Worker processes**: Procesos background si existen
- **Web/App processes**: Procesos de aplicación web si existen

#### Configuraciones de Runtime

- **Memory limits**: max_memory_restart, memory
- **CPU allocation**: instances, exec_mode
- **Environment variables**: NODE_ENV, PORT, etc.
- **Monitoring**: log files, error handling, watch
- **Cluster mode**: Configuraciones de escalado

### 3. Análisis de Flujos Operativos Reales

#### Flujo de Inicio del Sistema

- **Boot sequence**: Qué procesos inician y en qué orden
- **Dependencies**: Qué necesita cada proceso para iniciar
- **Health checks**: Verificaciones de salud durante startup
- **Error recovery**: Comportamiento ante fallos de inicio

#### Flujo de Operación Normal

- **User interaction**: Cómo interactúa el usuario normalmente
- **Skill execution**: Flujo completo de ejecución de skills
- **CLI workflows**: Flujos de trabajo comunes de la CLI
- **Daemon orchestration**: Cómo daemon gestiona operaciones

#### Flujo de Mantenimiento

- **Updates**: Cómo se actualiza el sistema
- **Configuration reload**: Recarga de configuraciones sin reiniciar
- **Logs management**: Rotación y limpieza de logs
- **Backup procedures**: Procesos de backup si existen

### 4. Análisis de Comandos CLI Específicos

#### Comandos Principales de skills-cli

Analiza los comandos disponibles en la interfaz CLI:

- **sf help/sf --help**: Comandos de ayuda y documentación
- **sf list**: Listado de skills disponibles
- **sf run**: Ejecución de skills específicas
- **sf config**: Configuración del sistema
- **sf status**: Estado del sistema
- **sf logs**: Visualización de logs

#### Parámetros y Opciones

- **Flags comunes**: --verbose, --debug, --help
- **Parámetros requeridos**: Obligatorios para cada comando
- **Opcionales**: Parámetros opcionales y defaults
- **Validaciones**: Qué validaciones realiza cada comando

#### Integración con Daemon

- **Comunicación HTTP**: Cómo CLI habla con Daemon
- **Protocolos**: Qué protocolos utiliza (REST, RPC, etc.)
- **Endpoints**: Qué endpoints del Daemon utiliza
- **Error handling**: Cómo maneja errores de comunicación

### 5. Detección de Redundancias y Optimizaciones

#### Scripts Duplicados

- **Scripts similares**: Comandos que hacen lo mismo
- **Configuraciones redundantes**: Múltiples formas de hacer lo mismo
- **Dependencies circulares**: Scripts que dependen mutuamente
- **Unused scripts**: Scripts que ya no se usan

#### Configuraciones PM2 Redundantes

- **Multiple configs**: Configuraciones PM2 duplicadas
- **Overlapping settings**: Mismos parámetros en diferentes archivos
- **Environment redundancy**: Variables duplicadas o no usadas
- **Process conflicts**: Configuraciones que se interfieren

#### Optimizaciones Posibles

- **Startup time**: Tiempo de inicio del sistema
- **Resource usage**: Uso de memoria y CPU
- **Parallel execution**: Scripts que podrían ejecutarse en paralelo
- **Caching opportunities**: Dónde podría agregarse caching

## Formato del Informe

Usa exactamente esta estructura:

```markdown
# Informe Fase D: CLI, Runtime, pm2 y Uso Real

## Metadata

- **Fase**: D
- **Nombre**: CLI, Runtime, pm2 y Uso Real
- **Fecha**: YYYY-MM-DD
- **Status**: Completado
- **Quality Gates**: Validado con rules_forense.json
- **Método**: Análisis forense sin intervención del repo

## Resumen Ejecutivo

{10-15 líneas resumiendo estado de scripts, runtime y operaciones}

## Evidencia Recopilada

### Área 1: Análisis de Scripts npm/pnpm

- **Hallazgo**: {descripción clara} - **Evidencia**: {ruta exacta, archivo, conteo específico}
  - **Análisis**: {qué significa este hallazgo}
  - **Impacto**: {implicaciones para la operación}
  - **Contexto**: {relación con otros componentes}

### Área 2: Configuraciones PM2

{mismo formato con hallazgos de PM2}

### Área 3: Flujos Operativos

{mismo formato con hallazgos de flujos}

### Área 4: Comandos CLI Específicos

{mismo formato con hallazgos de CLI}

### Área 5: Redundancias y Optimizaciones

{mismo formato con hallazgos de redundancias}

## Hallazgos Clave

{Los 3-5 descubrimientos más importantes sobre runtime y operaciones}

## Análisis Detallado

{Análisis completo por componente con flujos y métricas}

## Validación de Calidad

- **Lint**: ✅ Sin errores de sintaxis en análisis
- **Format**: ✅ Formato consistente en texto plano
- **Evidence**: ✅ Todos los hallazgos con rutas y datos específicos
- **Completeness**: ✅ Todas las áreas clave documentadas
- **Rules Compliance**: ✅ Cumple 100% de rules_forense.json

## Referencias Cruzadas

- **Fase A**: Evidencia complementaria de inventario estructural
- **Fase B**: Evidencia complementaria de responsabilidades
- **Fase C**: Evidencia complementaria de testing y calidad
- **dev-docs/plan.md**: Planificación original de Fase D
- **dev-docs/context.md**: Contexto técnico y reglas

---

**Análisis completado respetando rules_forense.json** **Integridad del repositorio: 100%
preservada** **Evidence recolectada: Todas las afirmaciones con respaldo verificable**
```

## Prioridades de Análisis

1. **Scripts del sistema principal**: package.json root con todos los scripts
2. **Configuraciones PM2**: ecosystem.config.\* y apps.json
3. **Comandos CLI**: skills-cli y sus comandos principales
4. **Flujo Daemon-CLI**: Cómo se comunican los componentes principales
5. **Redundancias**: Scripts y configuraciones duplicadas

## Métricas Específicas a Recolectar

### Scripts Metrics

- **Total number of scripts**: Número total de scripts npm/pnpm
- **Scripts por categoría**: Desarrollo, producción, testing, calidad
- **Dependencies graph**: Red de dependencias entre scripts
- **Execution time estimates**: Tiempo estimado de cada script

### PM2 Metrics

- **Number of PM2 configs**: Archivos de configuración PM2
- **Total processes configured**: Procesos gestionados por PM2
- **Memory/CPU allocations**: Límites y asignaciones de recursos
- **Uptime and restart policies**: Políticas de restart y monitoreo

### Operational Metrics

- **Startup sequence time**: Tiempo total de inicio del sistema
- **Command execution time**: Tiempo de ejecución de comandos CLI
- **Error rates**: Tasas de error en operaciones normales
- **Resource utilization**: Uso de memoria y CPU en operación

## Advertencia Final

Recuerda: Eres un detective forense, no un ingeniero de sistemas. Tu trabajo es recolectar evidencia
del estado actual de la operación, no proponer optimizaciones. Cada afirmación debe tener una ruta,
archivo o patrón específico como respaldo. Utiliza herramientas de búsqueda y análisis sistemático
para ser exhaustivo.
