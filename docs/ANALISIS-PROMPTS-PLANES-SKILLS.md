# Análisis: Prompts para Integración Planes + Skills

**Fecha**: 2025-10-29  
**Objetivo**: Identificar prompts y estructuras que se usarán para generar interacción con planes y skills  
**Estado**: 🔄 En progreso

---

## 🎯 Prompt Crítico Identificado: PROMPT-SPRINT-1.7

**Archivo**: `PROMPT-SPRINT-1.7-BMCC-AUTOMATICO-ADR-v1.0.0.md`  
**Score**: 98.3/100  
**Relevancia**: ⭐⭐⭐⭐⭐ ALTA

### Por qué es relevante para Plans + Skills

1. **Estructura CLOOP completa**: Clarify → Layout → Operate → Observe → Reflect
   - ✅ Aplicable directamente a generación de planes
   - ✅ Fases estructuradas con dependencias
   - ✅ Métricas y criterios de éxito

2. **TAGs System profesional**: 97+ TAGs estructurados
   - ✅ [K:], [C:], [U:], [EVIDENCIA:], [PROPUESTA:]
   - ✅ Aplicable para skill activation context
   - ✅ Trazabilidad de decisiones

3. **Tests Ejecutables**: 12 tests completos
   - ✅ Validación automática de planes
   - ✅ Verificación de skills activados
   - ✅ Validación de integración

4. **Métricas Cuantificables**: 15+ métricas con umbrales
   - ✅ Aplicable a KPI de skills
   - ✅ Tracking de plan adherence
   - ✅ Métricas de activación

---

## 📋 Prompts Relevantes para Planes

### 1. PROMPT-SPRINT-0-ARQUITECTURA-v1.1.md

**Relevancia**: ⭐⭐⭐⭐ ALTA

**Características clave**:
- Estructura de planificación arquitectónica
- Metodología CLOOP aplicada
- Objetivos SMART con métricas
- Fases estructuradas con timeline

**Aplicable a**:
- Generación de planes arquitectónicos
- Planificación de features complejas
- Estructuración de proyectos

### 2. TEMPLATE-CALIBRACION-PRE-SPRINT.md

**Relevancia**: ⭐⭐⭐⭐⭐ ALTA

**Características clave**:
- Calibración antes de ejecución
- Lecciones aprendidas aplicables
- Métricas baseline y targets
- Estructura de fases con calibraciones

**Aplicable a**:
- Pre-flight checks de planes
- Validación antes de activar skills
- Calibración de umbrales de activación

### 3. PROMPT-SPRINT-CONSOLIDACION-FUNDAMENTAL-v1.0.0.md

**Relevancia**: ⭐⭐⭐ MEDIA

**Características clave**:
- Consolidación de fundamentos
- Estructura modular
- Integración de componentes

**Aplicable a**:
- Consolidación de planes complejos
- Integración de múltiples skills

---

## 🎯 Prompts Relevantes para Skills

### 1. ejecutor-chat-01.md y ejecutor-chat-02.md

**Relevancia**: ⭐⭐⭐⭐⭐ ALTA

**Características clave**:
- Estructura de ejecución paso a paso
- Validaciones incrementales
- Tests ejecutables después de cada fase
- Handoffs estructurados

**Aplicable a**:
- Ejecución de skills con validación
- Workflows de skills con checks
- Transferencia de contexto entre skills

### 2. PROMPT-SPRINT-1.7-BMCC-AUTOMATICO-ADR

**Relevancia**: ⭐⭐⭐⭐⭐ ALTA (ya analizado)

**Aplicable a**:
- Skills que requieren estructura CLOOP
- Skills de generación compleja
- Skills con múltiples fases

---

## 🔄 Estructuras de Handoff para Skills

### template-handoff-v2.0-PAE.md

**Relevancia**: ⭐⭐⭐⭐⭐ ALTA

**Características clave**:
- Transferencia de contexto entre sesiones
- Integración con PAE
- Métricas y evidencias
- Próximos pasos estructurados

**Aplicable a**:
- Transferencia de contexto entre skills
- Handoff de planes entre fases
- Transferencia de estado de skills

---

## 📊 Patrones Extraídos para Prompt Builder

### Patrón 1: Estructura CLOOP para Planes

```markdown
## CLOOP: Clarify
- Objetivo SMART
- Hipótesis
- Criterios de éxito

## CLOOP: Layout
- Arquitectura mínima
- Interfaces
- Métricas

## CLOOP: Operate
- Fases y pasos
- Dependencias

## CLOOP: Observe
- Métricas esperadas
- Evidencia

## CLOOP: Reflect
- Riesgos
- Señales Stop/Go
```

### Patrón 2: TAGs System para Contexto Skills

```markdown
[K:KNOWLEDGE-TOPIC] - Conocimiento específico
[C:CONTEXT-TYPE] - Contexto del skill
[U:USER-ACTION] - Acción del usuario
[EVIDENCIA:REFERENCE] - Evidencia de estado actual
[PROPUESTA:CHANGE] - Cambio propuesto
```

### Patrón 3: Tests Ejecutables por Fase

```bash
# Test Fase X
comando-validacion-fase-x
# Verificar: criterio-especifico
```

### Patrón 4: Métricas con Umbrales

```markdown
### Métricas de Desarrollo
- **Métrica**: ≥umbral (target: valor-objetivo) [TAG:CATEGORIA]
```

---

## 🔗 Integración con Prompt Builder

### 1. Templates a Generar

#### A. Template: Plan Generation Prompt

**Basado en**: PROMPT-SPRINT-0-ARQUITECTURA + CLOOP

**Estructura**:
- Frontmatter con plan metadata
- CSE completo (CLOOP)
- TAGs para contexto
- Objetivos SMART
- Fases estructuradas
- Tests ejecutables
- Métricas cuantificables

#### B. Template: Skill Activation Prompt

**Basado en**: ejecutor-chat-*.md + PROMPT-SPRINT-1.7

**Estructura**:
- Frontmatter con skill metadata
- Contexto del skill activado
- Especificación de acciones
- Verificación de activación
- Tests de validación
- KPIs de skill

#### C. Template: Plan-Skill Integration Prompt

**Basado en**: Handoff templates + PAE

**Estructura**:
- Contexto del plan activo
- Skills relevantes identificados
- Integración de acciones
- Validación conjunta
- Transferencia de estado

---

## 📝 Próximos Pasos del Análisis

### Continuar Lectura Sistemática

1. ✅ PROMPT-SPRINT-1.7 (ANALIZADO)
2. 🔄 PROMPT-SPRINT-0-ARQUITECTURA (en lectura)
3. ⏳ PROMPT-SPRINT-CONSOLIDACION-FUNDAMENTAL
4. ⏳ Ejecutores chat-01 y chat-02
5. ⏳ PAE System completo
6. ⏳ Templates de calibración

### Extraer Patrones Específicos

- Patrón de planificación CLOOP
- Patrón de skill activation
- Patrón de handoff entre skills
- Patrón de validación de planes

---

**Análisis continuando**: 2025-10-29  
**Estado**: 🔄 Fase 1 en progreso

