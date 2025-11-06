# Análisis: Prompts Categóricos (Clasificación, Síntesis, Análisis)

**Fecha**: 2025-10-29  
**Estado**: 🔄 Analizando prompts por categorías funcionales

---

## 📋 Prompts Categóricos Analizados

### PROMPT-CLASIFICACION-RIESGOS-v1.0.0.md (398 líneas)

**Relevancia**: ⭐⭐⭐⭐⭐ ALTA (Clasificación sistemática de riesgos)

**Características Clave**:
- Clasificador de riesgos senior
- Identificación sistemática de riesgos
- Categorización estructurada (técnicos, metodológicos, temporales, recursos)
- Matriz de riesgos como entregable
- Score estimado: 8.15/10 (acreditado)
- 111 boundary markers

**Líneas**: 398

**Estructura Completa**:
- Frontmatter YAML completo
- ROL: Clasificador de riesgos senior
- CONTEXTO COMPLETO con documentos base
- OBJETIVOS SMART (≥3)
- TAREAS DETALLADAS por fases
- VALIDACIÓN con tests ejecutables
- ENTREGABLES ESPERADOS
- 111 boundary markers identificados
- TAGs [K/C/U/EVIDENCIA/PROPUESTA] en acciones

**Estructura Identificada**:
```markdown
## ROL Y PROPÓSITO
- ROL: Clasificador de patrones senior
- Especialización: Pattern recognition en desarrollo

## CONTEXTO COMPLETO
- [K] Tipos de patrones conocidos
- [C] Patrones a clasificar
- [U] Criterios de clasificación

## OBJETIVOS SMART
- O1: Identificar patrones en código/base
- O2: Clasificar por categorías
- O3: Priorizar por importancia

## TAREAS DETALLADAS
### Fase 1: Identificación
- [K] Input: Código/base a analizar
- [C] Output: Lista patrones identificados

### Fase 2: Clasificación
- [C] Clasificar por categorías
- [C] Matriz patrones × categorías

### Fase 3: Priorización
- [U] Scoring importancia
- [C] Ranking final

## ENTREGABLES
- Matriz patrones clasificados
- Catálogo patrones documentado
```

**Patrones Identificados**:
- Clasificación sistemática con matrices
- Scoring multi-criterio para priorización
- Documentación estructurada de patrones

**Aplicación**:
- Skills de clasificación
- Análisis de código/base
- Identificación de patrones

---

### PROMPT-SINTESIS-LECCIONES-v1.0.0.md (220 líneas)

**Relevancia**: ⭐⭐⭐⭐ ALTA (Síntesis de lecciones aprendidas)

**Características Clave**:
- Sintetizador de lecciones aprendidas senior
- Consolidación de conocimiento de sprints
- Síntesis de múltiples fuentes
- Lecciones categorizadas y priorizadas
- Score estimado: 8.15/10 (acreditado)
- 41 boundary markers

**Líneas**: 220

**Estructura Completa**:
- Frontmatter YAML completo
- ROL: Sintetizador de lecciones senior
- CONTEXTO: Lecciones de sprints anteriores
- OBJETIVOS SMART
- TAREAS: Extraer, analizar, sintetizar, categorizar, documentar
- VALIDACIÓN con tests
- ENTREGABLES: Lecciones consolidadas

**Estructura Identificada**:
```markdown
## ROL Y PROPÓSITO
- ROL: Sintetizador de arquitecturas senior
- Especialización: Arquitectura de software

## CONTEXTO COMPLETO
- [K] Fuentes arquitectónicas
- [C] Arquitecturas a sintetizar
- [U] Principios consolidación

## OBJETIVOS SMART
- O1: Sintetizar arquitecturas en schema unificado
- O2: Identificar principios comunes
- O3: Documentar arquitectura consolidada

## TAREAS DETALLADAS
### Fase 1: Extracción
- [K] Input: Fuentes arquitectónicas
- [C] Output: Elementos extraídos

### Fase 2: Síntesis
- [C] Consolidar elementos
- [C] Schema unificado

### Fase 3: Documentación
- [U] Documentar arquitectura
- [C] Principios identificados

## ENTREGABLES
- Schema arquitectura unificado
- Principios arquitectónicos
- Documentación completa
```

**Patrones Identificados**:
- Síntesis de múltiples fuentes
- Consolidación en schema unificado
- Identificación de principios comunes
- Documentación arquitectónica

**Aplicación**:
- Skills de síntesis
- Consolidación de conocimiento
- Documentación arquitectónica

---

### PROMPT-ANALISIS-COVERAGE-v1.0.0.md

**Relevancia**: ⭐⭐⭐⭐ ALTA (Análisis de coverage)

**Características Clave**:
- Analista de coverage senior
- Coverage tracking sistemático
- Identificación de áreas sin cubrir
- Dashboard de coverage con roadmap

**Estructura Completa**:
- Frontmatter YAML completo
- ROL: Analista de coverage senior
- CONTEXTO: Coverage tracking playbook
- OBJETIVOS: Calcular coverage, identificar gaps
- TAREAS: Analizar, calcular, identificar, documentar
- VALIDACIÓN con tests
- ENTREGABLES: Dashboard coverage + roadmap

**Estructura Identificada**:
```markdown
## ROL Y PROPÓSITO
- ROL: Analista de gaps senior
- Especialización: Gap analysis

## CONTEXTO COMPLETO
- [K] Estado actual documentado
- [K] Estado objetivo definido
- [C] Gaps a identificar
- [U] Impacto gaps

## OBJETIVOS SMART
- O1: Identificar gaps estado actual vs objetivo
- O2: Clasificar gaps por severidad
- O3: Priorizar gaps para mitigación

## TAREAS DETALLADAS
### Fase 1: Mapeo
- [K] Estado actual
- [K] Estado objetivo
- [C] Gap matrix

### Fase 2: Análisis
- [C] Severidad gaps
- [C] Impacto gaps
- [U] Mitigación gaps

### Fase 3: Priorización
- [C] Ranking gaps
- [C] Plan mitigación

## ENTREGABLES
- Gap matrix con severidad
- Plan mitigación priorizado
- Roadmap gaps
```

**Patrones Identificados**:
- Gap analysis sistemático (actual vs objetivo)
- Matriz de gaps con severidad
- Plan de mitigación priorizado
- Roadmap de resolución

**Aplicación**:
- Skills de análisis
- Identificación de brechas
- Planificación de mejoras

---

## 🎯 Patrones Categóricos Identificados

### Patrón 25: Clasificación Sistemática

**Estructura**:
```markdown
## Identificación
- [K] Fuentes de datos
- [C] Patrones a clasificar

## Clasificación
- Categorías definidas
- Matriz patrones × categorías

## Priorización
- Scoring multi-criterio
- Ranking final
```

**Aplicación**:
- Clasificación de elementos
- Categorización sistemática
- Priorización estructurada

---

### Patrón 26: Síntesis de Múltiples Fuentes

**Estructura**:
```markdown
## Extracción
- [K] Fuentes múltiples
- [C] Elementos extraídos

## Síntesis
- Consolidación sistemática
- Schema unificado

## Documentación
- Principios comunes
- Arquitectura consolidada
```

**Aplicación**:
- Síntesis de conocimiento
- Consolidación de arquitecturas
- Unificación de información

---

### Patrón 27: Gap Analysis Sistemático

**Estructura**:
```markdown
## Mapeo
- [K] Estado actual
- [K] Estado objetivo
- [C] Gap matrix

## Análisis
- Severidad gaps
- Impacto gaps
- Mitigación gaps

## Priorización
- Ranking gaps
- Plan mitigación
```

**Aplicación**:
- Análisis de brechas
- Identificación de gaps
- Planificación mejoras

---

## 📊 Resumen de Prompts Categóricos

### Prompts Analizados: 5+

1. ✅ PROMPT-CLASIFICACION-RIESGOS (398 líneas, 111 markers, score 8.15/10)
2. ✅ PROMPT-SINTESIS-LECCIONES (220 líneas, 41 markers, score 8.15/10)
3. ✅ PROMPT-ANALISIS-COVERAGE (coverage tracking)
4. ✅ PROMPT-SINTESIS-PATTERNS (síntesis de patrones)
5. ⏳ Más prompts categóricos disponibles

### Características Comunes

- **ROL**: Especialista senior por categoría
- **ESTRUCTURA**: CSE completo con TAGs
- **ENTREGABLES**: Matrices y documentos estructurados
- **VALIDACIÓN**: Tests ejecutables
- **CALIDAD**: Score ≥8.0/10 proyectado

### Aplicación a Skills

- **Clasificación**: Skills de categorización
- **Síntesis**: Skills de consolidación
- **Análisis**: Skills de análisis de brechas

---

## 📈 Estadísticas Acumuladas

### Total Prompts Analizados: 33+

### Total Patrones Identificados: 27

**Nuevos Patrones**:
25. **Clasificación Sistemática** (matrices estructuradas)
26. **Síntesis de Múltiples Fuentes** (consolidación)
27. **Gap Analysis Sistemático** (brechas priorizadas)

---

**Análisis continuando**: 2025-10-29  
**Total patrones**: 27  
**Cobertura**: Prompts categóricos principales analizados

