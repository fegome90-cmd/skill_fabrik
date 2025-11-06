# Método: Análisis Extenso de Prompts - startkit-main

**Fecha**: 2025-10-29  
**Basado en**: Descubrimientos iniciales del catálogo y sistema de evaluación  
**Estado**: 🎯 Plan de acción listo para ejecución

---

## 📊 Hallazgos Iniciales

### Complejidad Descubierta

- **165+ prompts catalogados** solo en Sprint 1.3
- **8 categorías principales**: Clasificación (35), Síntesis (28), Análisis (25), Operacionales (22), Metodológicos (18), Técnicos (16), Especializados (12), Experimentales (9)
- **Sistema de evaluación v2.0.0** con **12 componentes críticos** (vs 8 anteriores)
- **Biblioteca Meta** con 5 templates agnósticos validados (scores 95.8-98.4)
- **Meta-prompts universales** con parámetros configurables
- **PAE System** integrado con handoffs
- **1,767 archivos .md** solo en `playbook-bmcc/`

---

## 🎯 Metodología de Análisis Propuesta

### Estrategia: Análisis en Capas

**Principio**: Comenzar por lo más general y bajar a detalles específicos

**Capas**:

1. **CAPA 0: Índices y Catálogos** (COMPLETADO ✅)
   - `CATALOGO-PROMPTS-COMPLETO.md` (165 prompts)
   - `INDEX.md` (biblioteca meta)
   - `MANIFEST.md` (templates disponibles)

2. **CAPA 1: Sistemas Core**
   - Sistema de Evaluación v2.0.0 (12 componentes)
   - PAE System (gates, validación)
   - Metodología 4D (auditoría)

3. **CAPA 2: Templates y Meta-Prompts**
   - Templates agnósticos (5 principales)
   - Meta-prompts universales
   - Templates especializados

4. **CAPA 3: Prompts por Categoría**
   - Clasificación (35)
   - Síntesis (28)
   - Análisis (25)
   - Operacionales (22)
   - Metodológicos (18)
   - Técnicos (16)
   - Especializados (12)
   - Experimentales (9)

5. **CAPA 4: Handoffs y Transferencia**
   - Templates v1.0/v2.0-PAE
   - Ejemplos reales
   - Integración PAE

6. **CAPA 5: Sistemas de Calibración**
   - Pre-sprint
   - BMCC (Bucle Metacognitivo)
   - Refinamiento continuo

---

## 📋 Plan de Lectura Sistemática

### FASE A: Fundamentos (Prioridad ALTA)

**Objetivo**: Entender los sistemas core antes de analizar prompts individuales

#### A1. Sistema de Evaluación v2.0.0

**Archivos a leer**:
1. ✅ `SISTEMA-EVALUACION-PROMPTS-ESTANDAR-v1.0.0.md` (ya iniciado)
2. `TESTS-COMANDOS-SISTEMA-EVALUACION-v1.0.0.md`
3. `evaluador-prompt-completo.sh` (script de evaluación)
4. `MAQUETA-PROMPT-AGNOSTICO-COMPLETO-v1.0.0.json` (schema)

**Componentes a extraer**:
- 12 componentes críticos (C1-C12)
- Umbrales adaptativos
- Niveles de calidad semánticos
- Exit codes estándar
- Modo degradado

#### A2. PAE System (Pre-Audit Extract)

**Archivos a leer**:
1. `pae-system/README.md`
2. `pae-system/PROMPT-PAE-EXTRACTOR-v1.0.0.md`
3. `pae-system/validate-pae-template.sh`
4. `pae-system/pae_agnostic.schema.json`
5. `pae_output_*.json` (ejemplos: sprint_1.8, sprint_15, sprint_16)

**Componentes a extraer**:
- Gates críticos (PRE, POST, EXECUTOR, CI, VCS, DELIVERABLES)
- Niveles de auditoría (1: Light, 2: Standard, 3: Exhaustive)
- Schema JSON completo
- Validación automática

#### A3. Metodología 4D

**Archivos a leer**:
1. `METODOLOGIA-AUDITORIA-4-DIMENSIONES.md`
2. `TEMPLATE-AUDITORIA-4-DIMENSIONES.md`
3. Ejemplos de auditorías reales

**Componentes a extraer**:
- 4 dimensiones (Completitud, Calidad, Impacto, Sostenibilidad)
- Pesos y cálculo de scores
- Criterios por dimensión
- Proceso de 6 pasos

---

### FASE B: Templates y Meta-Prompts (Prioridad ALTA)

#### B1. Biblioteca Meta (Templates Agnósticos)

**Archivos a leer**:
1. `README.md` (índice maestro) ✅
2. `QUICK-REFERENCE.md` (decision tree)
3. `GUIA-USO-VISUAL.md`
4. `templates/TEMPLATE-HANDOFF-SPRINT.md`
5. `templates/TEMPLATE-AUDITORIA-4-DIMENSIONES.md`
6. `templates/TEMPLATE-CALIBRACION-PRE-SPRINT.md`
7. `templates/TEMPLATE-PLAN-MANTENIMIENTO.md`
8. `templates/TEMPLATE-DECISIONES-TECNICAS.md`

**Componentes a extraer**:
- Estructura común
- Variables/placeholders
- Casos de uso
- Tiempos estimados
- Validación

#### B2. Meta-Prompts Universales

**Archivos a leer**:
1. `docs/prompts/meta/meta-prompt-generador.md`
2. `docs/prompts/meta/meta-prompt-investigador.md`
3. `docs/prompts/meta/meta-prompt-universal-v3.1.md` (si existe)
4. `docs/prompts/meta/ejemplos-meta-prompt-v3.1.md`
5. `cloop-research/meta/meta-prompts/META-PROMPT-AUDITORIA-*.md`

**Componentes a extraer**:
- Parámetros configurables (MODE, STYLE, TONE, etc.)
- Roles soportados
- Estructura universal
- Validación y sanitización

#### B3. Templates Playbook BMCC

**Archivos a leer**:
1. `templates/handoff-template-v2.md`
2. `templates/prompt-template-with-index.md`
3. `templates/adr-template-v2.md`
4. `sprint-1.1-template-v1.1.0-lite/TEMPLATE-LITE-v1.0.0.md`
5. `sprint-1.1-template-v1.1.0-lite/TEMPLATE-PROMPT-ESPECIALIZADO-v1.1.0.md`

---

### FASE C: Prompts por Categoría (Prioridad MEDIA)

#### C1. Ejecutores (Executors)

**Archivos clave a analizar** (muestreo representativo):
1. ✅ `PROMPT-SPRINT-1.7-BMCC-AUTOMATICO-ADR-v1.0.0.md` (ANALIZADO - Score 98.3/100)
2. `docs/prompts/sesiones/ejecucion-v3.3.1-20251008/ejecutor-chat-01.md`
3. `docs/prompts/sesiones/ejecucion-v3.3.1-20251008/ejecutor-chat-02.md`
4. `PROMPT-Sprint-Infraestructura-Production-Ready-v1.3.1.md`
5. `PROMPT-SPRINT-15-REFINAMIENTO-MEMTECH-v1.0.0-FINAL.md`
6. `PROMPT-SPRINT-1.9-INTEGRACION-AVANZADA-FINAL-v1.0.0.md`

**Análisis por prompt**:
- Estructura CSE
- TAGs usados
- Boundary markers (densidad)
- Frontmatter YAML
- Tests ejecutables
- Score y calidad

#### C2. Auditores

**Archivos clave**:
1. `META-PROMPT-AUDITORIA-TRABAJO-COMPLETO-v1.1.0-PAE-REQUIRED.md`
2. `AUDITORIA-SPRINT-1-v3.4.0.md`
3. `AUDITORIA-TRABAJO-COMPLETO-SPRINTS-1-3-v1.0.0.md`

#### C3. Investigadores

**Archivos clave**:
1. `meta-prompt-investigador.md` (v1.1.0)
2. `PROMPT-SPRINT-1-SCOPE-RESEARCH-v1.0.0.md`
3. `PROMPT-SPRINT-2-DEEP-DIVE-v1.0.0.md`

#### C4. Generadores

**Archivos clave**:
1. `promptcreate.md` ✅ (ya leído)
2. `meta-prompt-generador.md`

---

### FASE D: Handoffs y PAE (Prioridad MEDIA)

#### D1. Templates de Handoff

**Archivos**:
1. ✅ `template-handoff.md` (ya leído)
2. ✅ `template-handoff-v2.0-PAE.md` (ya leído)
3. `handoff-template-v2.md` (BMCC)
4. `HANDOFF-INDEX-MASTER.md`

#### D2. Ejemplos Reales

**Análisis muestral** (5-10 handoffs representativos):
- `HANDOFF-SPRINT-15-FINAL.md`
- `HANDOFF-SPRINT-16-FINAL.md`
- `HANDOFF-SPRINT-1.8-OPTIMIZACION-ESCALABILIDAD-FINAL.md`
- `HANDOFF-SPRINT-1.3-FINAL.md`
- `HANDOFF-CHAT-*.md` (sesiones ejecución)

**Análisis**:
- Completitud de secciones
- PAE integration
- Estructura seguida
- Calidad del handoff

---

### FASE E: Calibración y BMCC (Prioridad BAJA)

**Archivos**:
1. `TEMPLATE-CALIBRACION-PRE-SPRINT.md`
2. `CALIBRACION-PROMPT-SPRINT-0-v1.1.md`
3. `FRAMEWORK-BMCC-BUCLE-METACOGNITIVO-CALIBRACION.md`
4. `PLAYBOOK-BMCC-v1.0.md`

---

## 🔄 Workflow de Análisis por Archivo

Para cada archivo crítico:

### 1. Lectura Inicial
- Identificar propósito
- Identificar versión/fecha
- Identificar autor/contexto

### 2. Extracción Estructural
- **CSE**: ¿Tiene Contexto + Especificación + Verificación?
- **TAGs**: ¿Qué TAGs usa? ([K:], [C:], [U:], [EVIDENCIA:], [PROPUESTA:])
- **Boundary Markers**: Contar marcadores, calcular densidad
- **Frontmatter**: ¿Tiene YAML? ¿Qué campos?
- **Anti-Drift**: ¿Qué mecanismos usa? (1-8)

### 3. Extracción Funcional
- **Tipo**: Executor, Auditor, Investigador, Generador, Especializado
- **Propósito**: ¿Para qué se usa?
- **Parámetros**: ¿Configurable? (MODE, STYLE, TONE, etc.)
- **Tests**: ¿Tiene tests ejecutables?
- **Validación**: ¿Cómo se valida?

### 4. Documentación
- Registrar en catálogo estructurado
- Extraer patrones encontrados
- Identificar dependencias

---

## 📊 Deliverables del Análisis

### 1. Catálogo Estructurado Completo

**Formato**: Markdown con estructura jerárquica

**Estructura**:
```markdown
# Catálogo Completo de Prompts - startkit-main

## Por Tipo
### Executors
### Auditors
### Investigadores
### Generadores

## Por Categoría (BMCC)
### Clasificación (35)
### Síntesis (28)
### Análisis (25)
### Operacionales (22)
### Metodológicos (18)
### Técnicos (16)
### Especializados (12)
### Experimentales (9)

## Por Calidad
### Alta (9-10)
### Media (7-8)
### Baja (5-6)
### Crítica (<5)
```

### 2. Mapa de Estructuras

**Contenido**:
- Componentes CSE (variaciones encontradas)
- TAGs system (uso y frecuencia)
- Boundary Markers (tipos y densidades promedio)
- Frontmatter YAML (campos comunes)
- Anti-Drift (implementaciones encontradas)

### 3. Guía de Sistemas

**Contenido**:
- Sistema de Evaluación v2.0.0 (12 componentes)
- PAE System (gates, niveles, validación)
- Metodología 4D (dimensiones, criterios)
- BMCC (bucle metacognitivo)

### 4. Biblioteca de Templates

**Contenido**:
- Templates agnósticos (5 principales)
- Meta-prompts universales
- Templates especializados
- Handoffs (v1.0, v2.0-PAE)

### 5. Patrones y Best Practices

**Contenido**:
- Patrones comunes encontrados
- Best practices documentadas
- Anti-patrones identificados
- Recomendaciones

---

## ⏱️ Estimación Refinada

### FASE A: Fundamentos
- **Archivos**: ~15 archivos core
- **Tiempo**: 8-10 horas

### FASE B: Templates y Meta-Prompts
- **Archivos**: ~20 archivos
- **Tiempo**: 6-8 horas

### FASE C: Prompts por Categoría (muestreo)
- **Archivos**: ~30 archivos representativos
- **Tiempo**: 10-12 horas

### FASE D: Handoffs
- **Archivos**: ~15 archivos
- **Tiempo**: 5-6 horas

### FASE E: Calibración
- **Archivos**: ~10 archivos
- **Tiempo**: 3-4 horas

### Síntesis y Documentación
- **Tiempo**: 15-20 horas

**TOTAL**: ~47-60 horas de análisis sistemático

---

## 🎯 Próximo Paso Inmediato

**Ejecutar FASE A1**: Leer completamente `SISTEMA-EVALUACION-PROMPTS-ESTANDAR-v1.0.0.md` y documentos relacionados para entender los 12 componentes críticos.

---

**Plan creado**: 2025-10-29  
**Estado**: ✅ Listo para ejecución sistemática  
**Método**: Análisis en capas, priorización por fundamentos primero

