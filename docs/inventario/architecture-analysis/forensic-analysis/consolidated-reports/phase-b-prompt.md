# Prompt para Agente Fase B: Mapa de Responsabilidades y Arquitectura Real

## Contexto

Tienes acceso al repositorio Skills Core en `/Users/felipe/Developer/skills-fabrik/`. Ya completamos
la Fase A con un inventario estructural completo. Ahora necesito un análisis profundo de
responsabilidades.

## Restricciones CRÍTICAS (Reglas Forenses)

1. **NO MODIFICAR NADA** del repo original, solo observar y describir
2. **NO EJECUTAR** código del repo original bajo ninguna circunstancia
3. **NO PROPONER** cambios durante el análisis, solo recolectar evidencia
4. **NO MEZCLAR** observaciones con recomendaciones (separar estrictamente)
5. **TODA afirmación** debe tener evidencia concreta (rutas, archivos, patrones)
6. **PENSAR como detective**: recolectar evidencia, no hacer juicios sin datos

## Contexto de Fase A (Hallazgos Previos)

### Componentes Identificados y Sus Tamaños

1. **packages/router** (512KB) - Motor de enrutamiento estable
2. **packages/daemon** (448KB) - Proceso principal con logging extensivo
3. **packages/skills-cli** (928KB) - Interfaz CLI principal
4. **packages/shared** - Herramientas compartidas
5. **mcp/** (96MB) - Sistema Model Context Protocol (componente más grande)
6. **skills/** (1.5MB) - 33 skills en 17 categorías funcionales
7. **configs/skill-rules.json** (27KB) - Punto de control central
8. **configs/slash-commands.json** (6KB) - Sistema de comandos

### Hipótesis a Validar

La documentación existente sugiere una arquitectura "Big Ball of Mud" con:

- Router y Daemon con superposición de responsabilidades
- Dashboard React incorrectamente tratado como core
- Contratos duplicados y divergentes
- Skills heterogéneos sin formato estándar
- Ausencia de gobernanza centralizada

## Tarea Específica Fase B: Análisis de Responsabilidades

### 1. Análisis de Componentes Core

Para cada uno de estos componentes, analiza sus responsabilidades reales:

#### packages/router (512KB)

- ¿Qué hace realmente este paquete?
- ¿Cuáles son sus responsabilidades primarias?
- ¿Qué archivos clave definen su comportamiento?
- ¿Cómo interactúa con otros componentes?

#### packages/daemon (448KB)

- ¿Qué responsabilidades tiene el daemon?
- ¿Hay solapamiento con router?
- ¿Cuál es el flujo de ejecución principal?
- ¿Cómo gestiona las skills?

#### packages/skills-cli (928KB)

- ¿Dónde termina la CLI y empieza el core?
- ¿Es solo una interfaz o tiene lógica de negocio?
- ¿Cómo se integra con daemon/router?

### 2. MCP Integration (96MB - Componente Más Grande)

- ¿Qué es exactamente MCP en este contexto?
- ¿Cómo se integra con el core system?
- ¿Es un componente separado o integral?
- ¿Qué dependencias tiene con otros componentes?

### 3. Sistema de Skills (33 skills en 17 categorías)

- ¿Quién orquesta realmente las skills?
- ¿Cómo se selecciona y ejecuta una skill?
- ¿Cuál es el ciclo de vida de una skill?
- ¿Qué rol juegan skill-rules.json y slash-commands.json?

### 4. Flujo de Configuración y Gobernanza

- ¿Cómo fluyen las reglas de skill-rules.json (27KB) al sistema?
- ¿Quién tiene la autoridad final en decisiones?
- ¿Hay múltiples sistemas de configuración compitiendo?

### 5. Detección de Solapamientos y Mezclas

- ¿Router vs Daemon realmente tienen responsabilidades mixtas?
- ¿Hay componentes duplicando funcionalidad?
- ¿Dónde están los límites entre responsabilidades?

## Formato del Informe

Usa exactamente esta estructura:

```markdown
# Informe Fase B: Mapa de Responsabilidades y Arquitectura Real

## Metadata

- **Fase**: B
- **Nombre**: Mapa de Responsabilidades y Arquitectura Real
- **Fecha**: YYYY-MM-DD
- **Status**: Completado
- **Quality Gates**: Validado con rules_forense.json
- **Método**: Análisis forense sin intervención del repo

## Resumen Ejecutivo

{10-15 líneas resumiendo hallazgos principales de responsabilidades}

## Evidencia Recopilada

### Área 1: Análisis de Router (512KB)

- **Hallazgo**: {descripción clara}
  - **Evidencia**: {ruta exacta, archivo, función específica}
  - **Análisis**: {qué significa este hallazgo}
  - **Impacto**: {implicaciones para la arquitectura}
  - **Contexto**: {relación con otros componentes}

### Área 2: Análisis de Daemon (448KB)

{mismo formato}

### Área 3: MCP Integration (96MB)

{mismo formato}

{continuar con otras áreas...}

## Hallazgos Clave

{Los 3-5 descubrimientos más importantes sobre responsabilidades}

## Análisis Detallado

{Análisis completo por componente con flujo de datos}

## Validación de Calidad

- **Lint**: ✅ Sin errores de sintaxis en análisis
- **Format**: ✅ Formato consistente en texto plano
- **Evidence**: ✅ Todos los hallazgos con rutas y tamaños específicos
- **Completeness**: ✅ Todas las áreas clave documentadas
- **Rules Compliance**: ✅ Cumple 100% de rules_forense.json

## Referencias Cruzadas

- **Fase A**: Evidencia complementaria de inventario estructural
- **dev-docs/plan.md**: Planificación original de Fase B
- **dev-docs/context.md**: Contexto técnico y reglas

---

**Análisis completado respetando rules_forense.json** **Integridad del repositorio: 100%
preservada** **Evidence recolectada: Todas las afirmaciones con respaldo verificable**
```

## Prioridades de Análisis

1. **Router vs Daemon overlap** - Crítico según hipótesis "Big Ball of Mud"
2. **MCP Integration** - Componente más grande (96MB) requiere comprensión
3. **Skills Orchestration** - Entender quién controla el sistema de skills
4. **Configuration Flow** - skill-rules.json como punto de control
5. **CLI vs Core boundaries** - skills-cli (928KB) análisis de límites

## Advertencia Final

Recuerda: Eres un detective forense, no un arquitecto. Tu trabajo es recolectar evidencia de lo que
existe, no proponer mejoras. Cada afirmación debe tener una ruta, archivo o patrón específico como
respaldo.
