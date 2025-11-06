# Plan: Analizar el CLI actual de Skills Fabrik comparándolo con las especificaciones detalladas en CLI-IA-Local-Documentacion.md

**ID**: mhjunqgz-76af0ef
**Status**: DRAFT
**Created**: 11/3/2025, 9:47:43 PM
**Updated**: 11/3/2025, 9:47:43 PM

---

## Objetivo

Analizar el CLI actual de Skills Fabrik comparándolo con las especificaciones detalladas en CLI-IA-Local-Documentacion.md, identificando brechas críticas y definiendo un roadmap de mejoras en 3 fases (6-9 meses total).

## Análisis Comparativo

### Estado Actual

| Componente | Estado Actual | Tecnología |
|------------|---------------|------------|
| **Framework CLI** | Commander.js + Chalk | TypeScript |
| **Comandos Slash** | 8 hardcodeados en TS | Static handlers |
| **IPC** | HTTP/REST en puertos | Daemon (7727), Router (3000), Discovery (8877) |
| **Seguridad** | Guardrails estáticos | Pattern-based detection |
| **Configuración** | .env files dispersos | development/production/testing |
| **TUI** | Colores básicos | Chalk |
| **Plugins** | Solo TypeScript | Monorepo |

### Estado Objetivo (según documento)

| Componente | Estado Objetivo | Tecnología |
|------------|-----------------|------------|
| **Framework CLI** | oclif + Ink | TypeScript |
| **Comandos Slash** | TOML declarativo | .agent/commands/*.toml |
| **IPC** | JSON-RPC stdio | Sin puertos |
| **Seguridad** | Zero-Trust + Confirmaciones | Interactive prompts |
| **Configuración** | TOML centralizado | ~/.config/agent/settings.toml |
| **TUI** | React-like declarative UI | Ink |
| **Plugins** | Multi-lenguaje | TS, Python, Java |

---

## Fases de Implementación

### 1. ✅ **Análisis Comparativo Actual**

**Pasos Completados**:
- ✅ Leer documentación CLI-IA-Local-Documentacion.md (completa, 1526 líneas)
- ✅ Analizar estructura CLI actual (Commander.js, 8 comandos hardcodeados)
- ✅ Evaluar sistema IPC actual (HTTP/REST en puertos 7727, 3000, 8877)
- ✅ Revisar modelo de seguridad actual (guardrails estáticos)
- ✅ Documentar brechas críticas identificadas
- ✅ Evaluar framework CLI (Commander.js + Chalk vs oclif + Ink)

**Hallazgos Clave**:
- 6 mejoras críticas identificadas
- Roadmap de 3 fases definido
- 6-9 meses estimado para implementación completa

---

### 2. **Fase 1: Quick Wins (1 mes)**

**Objetivo**: Obtener victorias rápidas con bajo esfuerzo/alto impacto

**Pasos**:
1. **Migrar configuración .env → ~/.config/agent/settings.toml**
   - Centralizar configuración dispersa
   - Estructura TOML clara: [general], [security], [ipc], [ui], [performance]
   - Tiempo estimado: 1-2 semanas

2. **Implementar TUI enriquecida con Ink**
   - Agregar spinners para operaciones largas
   - Progress bars para tareas secuenciales
   - Layouts enriquecidos con colores y estructura
   - Tiempo estimado: 2-3 semanas

3. **Agregar variables de plantilla básicas**
   - Implementar `{{target_path}}`, `{{target_content}}`
   - Contexto automático: git_diff, clipboard_content
   - Tiempo estimado: 1 semana

4. **Mejorar UX con syntax highlighting**
   - Código en bloques formateados
   - Mensajes estructurados
   - Documentar cambios realizados

**Métricas Fase 1**:
- Config migration: 1-2 semanas
- TUI enhancement: 2-3 semanas
- Template variables: 1 semana
- **Total esfuerzo**: 1 mes

---

### 3. **Fase 2: Refactor Core (2-3 meses)**

**Objetivo**: Cambios estructurales en el núcleo del sistema

**Pasos**:

1. **Implementar sistema de comandos TOML** (6-8 semanas)
   - Crear parser para .agent/commands/*.toml
   - Soporte para args, flags, templates
   - Ubicaciones: `.agent/commands/` (proyecto) + `~/.config/agent/commands/` (global)
   - Sistema de nomenclatura: `review.toml` → `/review`

2. **Migrar framework CLI de Commander.js → oclif** (4-6 semanas)
   - Autocompletado nativo
   - Plugin system built-in
   - Mejor DX para desarrolladores
   - Mantener compatibilidad con comandos existentes

3. **Implementar seguridad zero-trust** (4-6 semanas)
   - **Confirmaciones interactivas obligatorias**: Para modificaciones de archivos
   - **CWD Jail**: Aislamiento de directorio de trabajo
   - **Allow-list**: Comandos seguros configurables
   - **Modo --dry-run**: Preview por defecto
   - **No-Mess-Left-Behind**: Limpieza automática de temporales

4. **Integrar autocompletado nativo**
   - Comando: `skills-cli autocomplete`
   - Integración con zsh/bash

5. **Testing exhaustivo del nuevo sistema**
   - Tests de regresión
   - Validación de TOML commands
   - Testing de seguridad

**Métricas Fase 2**:
- TOML commands: 6-8 semanas
- Framework migration: 4-6 semanas
- Security model: 4-6 semanas
- **Total esfuerzo**: 2-3 meses

---

### 4. **Fase 3: Arquitectura Avanzada (3-4 meses)**

**Objetivo**: Arquitectura moderna multi-lenguaje

**Pasos**:

1. **Migrar IPC: HTTP/REST → JSON-RPC 2.0 sobre stdio** (8-10 semanas)
   - Eliminar puertos 7727, 3000, 8877
   - Implementar JSON-RPC client/server
   - Protocolo: UTF-8 JSON lines sobre stdio
   - Métodos: agent/invoke, agent/streamChunk, agent/cancel
   - Ventajas: Sin conflictos, más seguro, patrón LSP/MCP

2. **Implementar arquitectura de plugins multi-lenguaje** (6-8 semanas)
   - **Plugin Host**: Detección automática de lenguaje
   - **Plugins TypeScript**: Node.js con stdio
   - **Plugins Python**: Typer + Rich + Prompt Toolkit
   - **Plugins Java**: Cobra (futuro)
   - **Comunicación**: JSON-RPC stdio
   - **Gestión**: Lanzamiento como subprocesos

3. **Integración completa con MemTech como agente backend**
   - Conectar CLI con sistema de memoria
   - Context persistence
   - Session management

4. **Documentación completa de arquitectura**
   - Guías de desarrollo de plugins
   - API reference
   - Migration guide

5. **Migración y validación de comandos existentes**
   - Convertir 8 comandos actuales a TOML
   - Validar funcionamiento
   - Deprecación gradual de old system

**Métricas Fase 3**:
- IPC migration: 8-10 semanas
- Plugin architecture: 6-8 semanas
- MemTech integration: 4-6 semanas
- **Total esfuerzo**: 3-4 meses

---

## Mejoras Identificadas (Prioridad)

### 1. ⚠️ **CRÍTICO - Sistema de Comandos TOML**
- **Impacto**: ⭐⭐⭐⭐⭐
- **Esfuerzo**: Medio
- **Tiempo**: 2-3 meses
- **Descripción**: Migrar de hardcodeado TS → .agent/commands/*.toml con variables de plantilla

### 2. ⚠️ **CRÍTICO - Modelo de Seguridad Zero-Trust**
- **Impacto**: ⭐⭐⭐⭐⭐
- **Esfuerzo**: Medio
- **Tiempo**: 1-2 meses
- **Descripción**: Confirmaciones interactivas + CWD jail + Allow-list

### 3. ⚠️ **CRÍTICO - Migración IPC**
- **Impacto**: ⭐⭐⭐⭐⭐
- **Esfuerzo**: Alto
- **Tiempo**: 3-4 meses
- **Descripción**: HTTP/REST → JSON-RPC stdio (eliminar conflictos de puertos)

### 4. **ALTO - Framework CLI**
- **Impacto**: ⭐⭐⭐⭐
- **Esfuerzo**: Medio
- **Tiempo**: 2 meses
- **Descripción**: Commander.js + Chalk → oclif + Ink (autocompletado + TUI)

### 5. **MEDIO - TUI Enriquecida**
- **Impacto**: ⭐⭐⭐
- **Esfuerzo**: Bajo
- **Tiempo**: 2-3 semanas
- **Descripción**: Ink para spinners, progress bars, layouts React-like

### 6. **MEDIO - Configuración TOML**
- **Impacto**: ⭐⭐⭐
- **Esfuerzo**: Bajo
- **Tiempo**: 1-2 semanas
- **Descripción**: .env dispersos → ~/.config/agent/settings.toml centralizado

---

## Riesgos y Mitigaciones

### 1. **Fragmentación ecosistema agentes locales**
- **Probabilidad**: Alta
- **Impacto**: Medio
- **Mitigación**: Contrato IPC simple (JSON-RPC), bien documentado. Agente de referencia para desarrollo.

### 2. **Bajo rendimiento en hardware modesto**
- **Probabilidad**: Media
- **Impacto**: Alto
- **Mitigación**: Timeouts configurables. Límites de recursos. Promover modelos cuantizados.

### 3. **Complejidad dependencias multi-lenguaje**
- **Probabilidad**: Media
- **Impacto**: Medio
- **Mitigación**: Usar pipx y npm -g para aislar deps. Documentar runtimes requeridos.

### 4. **Adopción lenta desarrolladores**
- **Probabilidad**: Media
- **Impacto**: Alto
- **Mitigación**: Priorizar DX: instalación fácil, autocompletado robusto, docs claras.

---

## Métricas del Proyecto

### Fase 1
- Config migration: 1-2 semanas
- TUI enhancement: 2-3 semanas
- Template variables: 1 semana
- **Total esfuerzo**: 1 mes

### Fase 2
- TOML commands: 6-8 semanas
- Security model: 4-6 semanas
- Framework migration: 4-6 semanas
- **Total esfuerzo**: 2-3 meses

### Fase 3
- IPC migration: 8-10 semanas
- Plugin architecture: 6-8 semanas
- MemTech integration: 4-6 semanas
- **Total esfuerzo**: 3-4 meses

### Total Proyecto
- **Tiempo estimado**: 6-9 meses
- **Fases**: 3
- **Mejoras críticas**: 3
- **Prioridad alta**: 3

---

## Estado actual

**Estado actual**: DRAFT

**Próximos pasos**:
1. ✅ Plan actualizado con análisis completo
2. [ ] Decidir por qué fase empezar (recomendado: Fase 1 Quick Wins)
3. [ ] Ejecutar fase seleccionada
4. [ ] Review y save del plan: `skills plan save mhjunqgz-76af0ef`
