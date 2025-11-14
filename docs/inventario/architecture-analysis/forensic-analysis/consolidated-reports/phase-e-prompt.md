# Prompt para Agente Fase E: Prompt Builder y Contratos

## Contexto

Tienes acceso al repositorio Skills Core en `/Users/felipe/Developer/skills-fabrik/`. Ya completamos
las Fases A (inventario estructural), B (responsabilidades), C (testing y calidad) y D (CLI, runtime
y operaciones). Ahora necesito un análisis profundo del sistema de generación de prompts y contratos
del sistema.

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

- **Daemon como "Big Ball of Mud"**: Múltiples responsabilidades solapadas
- **Router con Responsabilidad Clara**: Solo enrutamiento HTTP
- **MCP como Ecosistema Externo**: Sistema de integración independiente
- **Skills Autónomas**: 33 skills con orquestación centralizada por Daemon
- **Configuración Centralizada**: skill-rules.json como punto de gobernanza

### Estado de Testing (Fase C)

- **Cobertura < 5%**: Solo 3 archivos tests Playwright vs ~100MB código
- **Deuda técnica**: 37 TODO/FIXME/HACK concentrados en daemon y MCP
- **Componentes críticos sin pruebas**: Daemon, Skills CLI, MCP, 33 skills

### Operación y Runtime (Fase D)

- **47 scripts npm/pnpm** distribuidos entre raíz y packages
- **Ausencia total PM2** - sin configuración de producción
- **Startup manual secuencial**: Database → Daemon → Router → CLI
- **33 comandos CLI** con implementaciones inconsistentes
- **Daemon como SPOF** - punto único de fallo crítico

## Tarea Específica Fase E: Análisis de Prompt Builder y Contratos

### 1. Análisis Exhaustivo del Sistema Prompt Builder

#### Localización del Prompt Builder

Busca y analiza TODOS los componentes del sistema de prompts:

- **Prompt Builder Engine**: Sistema central de generación de prompts
- **Template System**: Definiciones de plantillas y patrones
- **Prompt Generators**: Componentes especializados en creación de prompts
- **Configuration Files**: Archivos que definen reglas de generación
- **Validation Scripts**: Componentes que validan prompts generados

#### Funcionalidades del Prompt Builder

- **Tipos de prompts**: Qué clases de prompts genera el sistema
- **Parámetros configurables**: Qué aspectos se pueden personalizar
- **Proceso de generación**: Flujo completo de creación de prompts
- **Integraciones**: Cómo se conecta con otros componentes
- **Calidad y validación**: Cómo se asegura la calidad de los prompts

#### Análisis de Componentes

- **Estructura interna**: Organización de archivos y módulos
- **Dependencias**: Qué otros componentes utiliza
- **Configuraciones**: Archivos de settings y parámetros
- **Templates disponibles**: Plantillas predefinidas y sus usos
- **Mecanismos de extensión**: Cómo se pueden agregar nuevos tipos

### 2. Análisis Detallado de Contratos SKILL.md

#### Formato SKILL.md

Busca y documenta TODOS los aspectos del formato SKILL.md:

- **Estructura estándar**: Secciones y campos obligatorios
- **Variaciones detectadas**: Diferentes formatos o versiones
- **Campos específicos**: Qué información contiene cada sección
- **Validaciones**: Reglas que cumplen los archivos SKILL.md
- **Ejemplos reales**: Skills existentes y su formato

#### Consistencia de SKILL.md

- **Formato consistente**: Si todas las skills siguen el mismo patrón
- **Campos obligatorios vs opcionales**: Qué se requiere vs qué es opcional
- **Validaciones automáticas**: Si existe sistema de verificación
- **Errores de formato**: Inconsistencias o problemas detectados
- **Evolución del formato**: Cambios o versiones del formato

#### Relación con Prompt Builder

- **Generación automática**: Si Prompt Builder crea SKILL.md
- **Templates SKILL.md**: Plantillas específicas para skills
- **Validación cruzada**: Cómo interactúan ambos sistemas
- **Integración con skills**: Cómo se usa en las 33 skills existentes

### 3. Análisis de dev-docs/contracts

#### Sistema de Contratos en dev-docs

Busca y analiza el sistema de contratos:

- **dev-docs/contracts**: Archivos de definición de contratos
- **Especificaciones**: Reglas y formatos definidos
- **Validaciones**: Mecanismos de verificación de cumplimiento
- **Documentación**: Guías y ejemplos de uso
- **Versiones**: Diferentes versiones de contratos

#### Integración con Prompt Builder

- **Contratos como templates**: Si se usan para generar prompts
- **Validación de prompts**: Cómo se verifican contra contratos
- **Generación automática**: Si Prompt Builder usa contratos
- **Consistencia**: Cómo se asegura consistencia entre sistemas

#### Relación con SKILL.md

- **Contratos para skills**: Especificaciones particulares para skills
- **Validación de formato**: Cómo se verifica SKILL.md contra contratos
- **Plantillas compartidas**: Elementos comunes entre sistemas
- **Gobernanza**: Cómo se mantienen sincronizados

### 4. Detección Exhaustiva de Conflictos

#### Conflictos Prompt Builder vs SKILL.md

- **Formatos inconsistentes**: Diferencias entre lo que genera Prompt Builder y lo que espera
  SKILL.md
- **Campos faltantes**: Elementos que debería tener uno pero no el otro
- **Validaciones cruzadas**: Si existen pero no se usan consistentemente
- **Versiones desincronizadas**: Cambios en un sistema no reflejados en el otro
- **Interpretaciones diferentes**: Mismo concepto manejado de forma distinta

#### Conflictos dev-docs vs Realidad

- **Contratos desactualizados**: Especificaciones que no coinciden con implementación
- **Prompts no validados**: Generados pero no verificados contra contratos
- **Skills inconsistentes**: SKILL.md que no cumplen con estándares documentados
- **Herramientas no integradas**: Sistemas que deberían conectarse pero no lo hacen

#### Impacto de Conflictos

- **Problemas operativos**: Cómo afectan al funcionamiento del sistema
- **Riesgos de calidad**: Posibles errores o inconsistencias
- **Mantenimiento complejo**: Dificultad para mantener consistencia
- **Experiencia de usuario**: Impacto en quienes usan el sistema

### 5. Análisis de Gobernanza Actual

#### Mecanismos de Control

- **Validaciones automáticas**: Sistemas que verifican calidad
- **Políticas de formato**: Reglas definidas y su cumplimiento
- **Procesos de revisión**: Cómo se aseguran cambios consistentes
- **Versionado**: Cómo se manejan cambios y evoluciones
- **Documentación**: Qué tan completa y actualizada está

#### Gobernanza de Contratos

- **Definición de estándares**: Quién define y cómo se mantienen
- **Proceso de aprobación**: Cómo se aceptan nuevos contratos
- **Compliance**: Cómo se verifica cumplimiento de estándares
- **Actualizaciones**: Cómo se propagan cambios
- **Retrocompatibilidad**: Cómo se manejan cambios que rompen

#### Gobernanza de Skills

- **Registro de skills**: Cómo se mantienen las 33 skills existentes
- **Validación de nuevas skills**: Proceso para agregar habilidades
- **Calidad de contenido**: Cómo se asegura calidad de SKILL.md
- **Categorización**: Cómo se organizan y clasifican
- **Deprecación**: Cómo se manejan skills obsoletas

## Formato del Informe

Usa exactamente esta estructura:

```markdown
# Informe Fase E: Prompt Builder y Contratos

## Metadata

- **Fase**: E
- **Nombre**: Prompt Builder y Contratos
- **Fecha**: YYYY-MM-DD
- **Status**: Completado
- **Quality Gates**: Validado con rules_forense.json
- **Método**: Análisis forense sin intervención del repo

## Resumen Ejecutivo

{10-15 líneas resumiendo estado de prompts, contratos y gobernanza}

## Evidencia Recopilada

### Área 1: Análisis del Sistema Prompt Builder

- **Hallazgo**: {descripción clara} - **Evidencia**: {ruta exacta, archivo, conteo específico}
  - **Análisis**: {qué significa este hallazgo}
  - **Impacto**: {implicaciones para la operación}
  - **Contexto**: {relación con otros componentes}

### Área 2: Análisis de Contratos SKILL.md

{mismo formato con hallazgos de contratos}

### Área 3: Análisis de dev-docs/contracts

{mismo formato con hallazgos de dev-docs}

### Área 4: Detección de Conflictos

{mismo formato con hallazgos de conflictos}

### Área 5: Análisis de Gobernanza Actual

{mismo formato con hallazgos de gobernanza}

## Hallazgos Clave

{Los 3-5 descubrimientos más importantes sobre prompts y contratos}

## Análisis Detallado

{Análisis completo por componente con flujos y métricas}

## Validación de Calidad

- **Lint**: ✅ Sin errores de sintaxis en análisis
- **Format**: ✅ Formato consistente en texto plano
- **Evidence**: ✅ Todos los hallazgos con rutas y datos específicos
- **Completeness**: ✅ Todas las áreas clave documentadas
- **Rules Compliance**: ✅ Cumple 100% de rules_forense.json

## Referencias Cruzadas

- **Fase A**: Evidencia complementaria de inventario estructural (33 skills, packages)
- **Fase B**: Evidencia complementaria de responsabilidades (Daemon como SPOF)
- **Fase C**: Evidencia complementaria de testing y calidad (<5% cobertura)
- **Fase D**: Evidencia complementaria de runtime y operaciones (CLI manual)
- **dev-docs/plan.md**: Planificación original de Fase E
- **dev-docs/context.md**: Contexto técnico y reglas

---

**Análisis completado respetando rules_forense.json** **Integridad del repositorio: 100%
preservada** **Evidence recolectada: Todas las afirmaciones con respaldo verificable**
```

## Prioridades de Análisis

1. **Sistema Prompt Builder**: Localización y análisis completo del motor de prompts
2. **Contratos SKILL.md**: Formato, consistencia y relación con skills reales
3. **dev-docs/contracts**: Sistema de contratos documentado vs implementación
4. **Detección de Conflictos**: Inconsistencias entre sistemas y componentes
5. **Gobernanza**: Mecanismos de control y calidad actuales

## Métricas Específicas a Recolectar

### Prompt Builder Metrics

- **Número de templates**: Plantillas y patrones disponibles
- **Tipos de prompts**: Categorías y clasificaciones
- **Integraciones**: Conexiones con otros componentes
- **Configuraciones**: Parámetros y opciones disponibles
- **Generaciones**: Procesos y flujos de creación

### Contratos Metrics

- **SKILL.md existentes**: Número y distribución de skills
- **Formato consistente**: Porcentaje de skills que siguen estándar
- **Campos obligatorios**: Especificaciones y cumplimiento
- **Validaciones automáticas**: Mecanismos de verificación
- **dev-docs contracts**: Archivos de especificación disponibles

### Conflictos Metrics

- **Inconsistencias detectadas**: Número y tipo de conflictos
- **Impacto operativo**: Efectos en funcionamiento del sistema
- **Riesgos de calidad**: Posibles problemas y su severidad
- **Mantenimiento**: Complejidad de gestión de inconsistencias

### Gobernanza Metrics

- **Mecanismos de control**: Sistemas de validación y calidad
- **Compliance**: Nivel de cumplimiento de estándares
- **Documentación**: Cobertura y actualización de guías
- **Procesos**: Flujos de revisión y aprobación

## Advertencia Final

Recuerda: Eres un detective forense, no un arquitecto de sistemas. Tu trabajo es recolectar
evidencia del estado actual de los prompts y contratos, no proponer optimizaciones. Cada afirmación
debe tener una ruta, archivo o patrón específico como respaldo. Utiliza herramientas de búsqueda y
análisis sistemático para ser exhaustivo.

FOCUS EN:

- Evidencia concreta de sistemas existentes
- Relaciones y dependencias entre componentes
- Conflictos e inconsistencias reales
- Estado actual de la gobernanza
- Análisis forense sin juicios ni recomendaciones
