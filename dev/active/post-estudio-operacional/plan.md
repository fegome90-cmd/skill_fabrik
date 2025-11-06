# Plan: Post-Estudio Operacional - Skills Fabrik

**ID**: post-estudio-operacional-20251029  
**Status**: DRAFT  
**Created**: 2025-10-29  
**Updated**: 2025-10-29

---

## Objetivo

Plan post-estudio operacional: operacionalizar patrones y templates aprendidos del análisis extenso, integrar PAE + Auditoría 4D como gates, activar skills de workflows/guardrails/guidelines, y generar tríada dev-docs completa.

## Fases

### 1. CLARIFY - Definir Alcance

**Pasos**:
  1. Leer documentos base completos (SINTESIS-GLOBAL-LECCIONES, METRICAS-VALIDACION-GLOBAL, ESTADO-ANALISIS-COMPLETO)
  2. Definir alcance operacional (IN/OUT explícito)
  3. Identificar skills críticos a activar (workflows, guardrails, guidelines)

### 2. LAYOUT - Diseñar Estructura

**Dependencias**: CLARIFY - Definir Alcance

**Pasos**:
  1. Aplicar Template v1.1.0 (8/8 componentes: Frontmatter YAML, ROL, CONTEXTO, OBJETIVOS SMART, TAREAS, VALIDACIÓN, ENTREGABLES, ANTI-DRIFT)
  2. Integrar PAE como gate obligatorio antes de auditoría (G1-G5: existencia, schema, tests, critical gates, checksum)
  3. Configurar Auditoría 4D (Completitud 30%, Calidad 30%, Impacto 25%, Sostenibilidad 15%) con threshold ≥7.0/10

### 3. OPERATE - Ejecutar Plan

**Dependencias**: LAYOUT - Diseñar Estructura

**Pasos**:
  1. Crear plan usando skills-cli
  2. Aprobar y guardar plan con --approve para activar workflow
  3. Verificar activación de skills (plan-save-workflow, database-verification, secrets-and-config)
  4. Validar MemTech L1 snapshot generado automáticamente en Redis
  5. Aplicar Template v1.1.0 a 1 prompt crítico (Restantes 2 en próximas iteraciones)

### 4. OBSERVE - Monitorear y Validar

**Dependencias**: OPERATE - Ejecutar Plan

**Pasos**:
  1. Ejecutar validación PAE (Gate A: validate-pae-template.sh)
  2. Ejecutar Auditoría 4D (Gate B: Score ≥7.0/10)
  3. Validar 8/8 componentes (Gate C: Templates v1.1.0)
  4. Verificar activación de skills (Gate D: ≥4 skills activados)
  5. Emitir KPIs consolidados (Gate E: policy_decision en events.jsonl)

### 5. REFLECT - Auditoría y Lecciones

**Dependencias**: OBSERVE - Monitorear y Validar

**Pasos**:
  1. Generar Auditoría 4D completa (Score consolidado con justificación)
  2. Documentar lecciones aprendidas (Aplicación práctica de patrones)
  3. Generar Handoff v2.0-PAE (Transferencia completa para próxima fase)

## Riesgos

### 1. Patrones y templates no operacionalizados pueden quedar solo como documentación

**Mitigación**: Aplicar Batch Creation (CAL-1.0-1) para operacionalizar múltiples patrones en paralelo, usar Checklist Pre-Creación (CAL-1.0-2) para validar 8/8 componentes antes de considerar completo

### 2. Skills no activados si el prompt no cumple con la heurística multi-señal

**Mitigación**: Usar prompt-builder para generar prompts con score ≥0.6, verificar keywords (20%), intent patterns (30%), path patterns (30%), content patterns (20%)

### 3. PAE + Auditoría 4D pueden ser bloqueantes si no se configuran correctamente

**Mitigación**: Configurar gates PAE (G1-G5) con fallback graceful, definir thresholds de Auditoría 4D ≥7.0/10 con justificación documentada

## Métricas

- Tokens esperados: 15000
- Latencia estimada: 180s

---

**Estado actual**: DRAFT

