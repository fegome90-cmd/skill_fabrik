# AGENTE.md - Guía Fácil para Investigación Forense Skills Core

**🚀 GUÍA RÁPIDA PARA CUALQUIER AGENTE** **Objetivo**: Entender y continuar la investigación forense
del Skills Core **Última actualización**: 2025-11-13 **Estado**: Investigación 97% completa,
requiere correcciones menores

---

## 🎯 MISIÓN PRINCIPAL (1 minuto para entender)

**"Desarmar el repositorio Skills Core en componentes comprensibles sin modificar nada"**

Esta investigación forense tiene como objetivo crear una **base sólida y 100% confiable** para
decidir un refactor con riesgo casi cero.

## 📁 ESTRUCTURA CLAVE (Paths que necesitas conocer)

### 🏠 Workspace Principal

```
/Users/felipe/Developer/skills-fabrik/docs/inventario/architecture-analysis/forensic-analysis/
```

### 📋 Documentos GUÍA (Lee estos PRIMERO)

1. **`/dev-docs/plan.md`** - Plan maestro completo 📖
2. **`/dev-docs/context.md`** - Contexto técnico y reglas ⚖️
3. **`/dev-docs/tasks.md`** - Log de ejecución y progreso ✅
4. **`/rules_forense.json`** - 8 máximas + 5 prohibiciones 🚫

### 📊 Informes Completados (Resultados actuales)

1. **`/reports/phase-a-inventory.md`** - Inventario estructural completo 📦
2. **`/reports/phase-b-responsibilities.md`** - Mapa de responsabilidades 🔧
3. **`/reports/phase-c-testing.md`** - Testing y calidad 🧪
4. **`/reports/phase-d-runtime.md`** - Scripts y runtime ⚡
5. **`/reports/phase-e-prompts.md`** - Prompt builder y contratos 📝

### 🧪 Tests (Validación automática)

```
/Users/felipe/Developer/skills-fabrik/docs/inventario/architecture-analysis/forensic-analysis/tests/
├── phase-a.test.js  # Tests Fase A (15 tests)
├── phase-b.test.js  # Tests Fase B (16 tests)
├── phase-c.test.js  # Tests Fase C (20 tests)
├── phase-d.test.js  # Tests Fase D (39 tests)
└── phase-e.test.js  # Tests Fase E (43 tests)
```

## 🔥 ESTADO ACTUAL (Lo que está funcionando vs lo que necesita corrección)

### ✅ FUNCIONANDO PERFECTAMENTE

- **142/142 tests pasando** (100% success rate)
- **15/15 reglas forenses cumplidas**
- **5 fases completadas y documentadas**
- **Calidad de código perfecta** (cero errores linting)

### ⚠️ NECESITA CORRECCIÓN URGENTE (Problemas Críticos)

- **32 referencias sin contexto claro** en los informes
- **1 área incompleta** (dependencies en Phase B)
- **🚨 DATOS INCORRECTOS**: Phase C reporta "3 tests" pero existen múltiples
- **🚨 INCONSISTENCIAS**: Datos diferentes entre informes (ej. daemon 448KB)
- **🚨 ARCHIVOS FALTANTES**: phase-a-prompt.md no existe
- **🚨 CARACTERES PROBLEMÁTICOS**: Caracteres chinos en contenido
- **Impacto**: **NO APTO PARA USO** - requiere ~8 horas de corrección

Ver detalles: `/FALLENCIAS-ADICIONALES.md`

Ver detalles completos: `/FALLENCIAS-Y-CORRECCIONES.md`

## 🚀 ACCIONES INMEDIATAS (Si quieres ayudar/correrigir)

### Opción 1: Corregir Evidencia (2 horas)

```bash
cd /Users/felipe/Developer/skills-fabrik/docs/inventario/architecture-analysis/forensic-analysis

# Ver problemas actuales
npm run validate-evidence

# Editar informes para agregar contexto a referencias
# Ejemplo: Cambiar "/path/to/file" por "/path/to/file - Descripción del archivo"
```

### Opción 2: Completar Análisis (1 hora)

```bash
# Agregar área "dependencies" en phase-b-responsibilities.md
# Analizar dependencias entre daemon, router, skills-cli
```

### Opción 3: Continuar con Fases Avanzadas

Si prefieres continuar con nuevas áreas:

1. **Phase F**: Análisis de dependencias avanzado
2. **Phase G**: Análisis de seguridad
3. **Phase H**: Análisis de performance
4. **Dashboards**: Crear dashboards interactivos

## 🔧 COMANDOS ÚTILES

### Validación de Calidad

```bash
npm test                    # Ejecutar todos los tests (142 tests)
npm run validate-rules      # Validar reglas forenses (15/15)
npm run validate-evidence   # Validar evidencia (actual: 214/246)
npm run validate-completeness # Validar completitud (actual: 30/31)
```

### Calidad de Código

```bash
npm run lint               # Verificar calidad de código
npm run format:check       # Verificar formato
npm run format             # Formatear automáticamente
```

## 📋 HALLAZGOS CLAVE (Lo más importante ya descubierto)

### 1. Arquitectura Confirmada

- **Daemon**: "Big Ball of Mud" con múltiples responsabilidades ⚠️
- **Router**: Responsabilidad única y clara ✅
- **Skills CLI**: Interfaz limpia ✅
- **MCP**: Ecosistema externo independiente (96MB) 🌐

### 2. Problemas Críticos Detectados

- **Testing**: <5% cobertura en sistema de ~100MB 🚨
- **Technical Debt**: 37 TODO/FIXME/HACK concentrados en daemon/MCP 📝
- **Runtime**: Ausencia total de configuración PM2 ⚙️
- **Prompt Builder**: Conflictos detectados en contratos 🔄

### 3. Componentes Principales Mapeados

- **10 packages** identificados y analizados
- **33 skills** en 17 categorías funcionales
- **3,510 MD files** de documentación
- **47 scripts npm/pnpm** documentados

## 🎯 SI QUIERES CONTINUAR LA INVESTIGACIÓN

### Fases Disponibles para Desarrollo:

1. **Phase F (Dependency Analysis)** - Análisis profundo de dependencias
2. **Phase G (Security Analysis)** - Evaluación de seguridad
3. **Phase H (Performance Analysis)** - Análisis de rendimiento
4. **Dashboards** - Creación de dashboards interactivos

### Para cada nueva fase:

1. **Leer `/prompts/phase-X-prompt.md`** - Instrucciones específicas
2. **Crear tests en `/tests/phase-X.test.js`** - Tests TDD primero
3. **Ejecutar análisis y generar informe** - Seguir forensic rules
4. **Validar con `npm test` y `npm run validate-evidence`**

## 📞 REFERENCIAS RÁPIDAS

### Sistema Skills Core (El repositorio being analyzed)

```
/Users/felipe/Developer/skills-fabrik/
├── packages/
│   ├── daemon/              # Motor principal (448KB) - "Big Ball of Mud"
│   ├── router/              # Enrutamiento (512KB) - Single Responsibility ✅
│   ├── skills-cli/          # CLI interface (928KB)
│   └── [otros paquetes]
├── skills/                   # 33 skills en 17 categorías (1.5MB)
├── mcp/                      # Model Context Protocol (96MB) 🌐
├── configs/                  # skill-rules.json (27KB) + slash-commands.json
└── [otros]
```

### Inventario Existente (Contexto previo)

```
/Users/felipe/Developer/skills-fabrik/docs/inventario/
├── architecture-analysis/
│   ├── skills-core-architecture.md   # Arquitectura objetivo
│   ├── mermaid-diagrams.md           # Diagramas "antes vs después"
│   └── forensic-analysis/            # 🏠 Este directorio
├── daemon-arquitectura-calidad.md     # Análisis daemon previo
├── router-arquitectura-calidad.md      # Análisis router previo
└── [otros documentos]
```

## 🏆 CRITERIOS DE ÉXITO

### Para considerarse "COMPLETADO":

- [ ] **100% tests pasando** (actualmente 142/142 ✅)
- [ ] **100% evidencia validada** (actualmente 214/246 ⚠️)
- [ ] **100% completitud** (actualmente 30/31 ⚠️)
- [ ] **Cero errores de calidad** (actualmente 0 ✅)
- [ ] **🚨 DATOS VERIFICADOS** (actualmente ~60% correctos ⚠️)
- [ ] **🚨 CONSISTENCIA COMPLETA** (actualmente ~70% consistente ⚠️)
- [ ] **🚨 CERO ERRORES CRÍTICOS** (actualmente múltiples errores ⚠️)

### Para continuar con nuevas fases:

- [ ] **🚨 CORRECCIÓN CRÍTICA**: Datos incorrectos en Phase C (tests)
- [ ] **🚨 VERIFICACIÓN COMPLETA**: Todas las métricas cuantitativas
- [ ] **🚨 LIMPIEZA**: Caracteres no-ASCII y consistencia
- [ ] Corregir los **32 problemas de evidencia**
- [ ] Completar el **área dependencies** en Phase B
- [ ] Alcanzar **100% quality gates**

### ⚠️ ADVERTENCIA IMPORTANTE:

**La investigación actual NO ES APTA para decisiones de arquitectura hasta corregir todos los
errores críticos detectados.**

## 🚨 REGLAS DE ORO (No violar estas)

### PROHIBIDO (5 reglas críticas):

1. **NO MODIFICAR NADA** del repo original
2. **NO EJECUTAR** código del repo original
3. **NO PROPONER** cambios durante análisis
4. **NO MEZCLAR** observaciones con recomendaciones
5. **TODA afirmación** debe tener evidencia concreta

### OBLIGATORIO (6 requerimientos):

1. **Cada hallazgo** con ruta exacta y contexto
2. **Formato consistente** en todos los informes
3. **Validación automática** con scripts
4. **Integración** con inventario existente
5. **Máxima claridad** sin jerga ambigua
6. **Enfoque forense** (detective mode)

---

## 🎯 LISTO PARA EMPEZAR

**Si quieres continuar/correrigir:**

1. **Lee primero**: `/dev-docs/plan.md` y `/FALLENCIAS-Y-CORRECCIONES.md`
2. **Decide tu acción**: Corregir evidencia (2h) o continuar con fases nuevas
3. **Ejecuta comandos**: `npm test` para validar estado actual
4. **Contacta si tienes dudas**: Todo está documentado para ser auto-suficiente

**Estado actual: 60% confiable, datos incorrectos detectados, requiere corrección urgente (~8
horas)**

_Esta guía está diseñada para que cualquier agente pueda entender y continuar la investigación sin
necesidad de contexto adicional adicional._

---

**🚀 INVESTIGACIÓN FORENSE SKILLS CORE - GUÍA COMPLETA** **Creado para ser auto-suficiente y fácil
de seguir** **Última actualización: 2025-11-13**
