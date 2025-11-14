# 📚 Triada de Plan - Auditoría Skills Core 2025Q4

## Resumen Ejecutivo

Se han creado los **tres documentos fundamentales** de la metodología CLOOP para la remediación de hallazgos de la auditoría Skills Core 2025Q4:

```
docs/inventario/2025Q4/
├── plan.md      ← Arquitectura y roadmap (519 líneas)
├── context.md   ← Contexto completo (646 líneas)
└── tasks.md     ← 92 mini-tasks (1,461 líneas)
```

**Estado:** ✅ Triada completa y lista para ejecución  
**Total:** 2,626 líneas de documentación estructurada  
**Estimación:** 40h de trabajo, 6 fases, 4 hallazgos críticos a resolver

---

## 📋 Índice de Contenidos

### 1. [plan.md](./plan.md) - Arquitectura y Roadmap

**Contenido principal:**

- ✅ Metadata del plan (stakeholders, duración, complejidad)
- ✅ Resumen ejecutivo con criterios de éxito
- ✅ Arquitectura de solución (principios SSOT, TDD, Zero Debt)
- ✅ Test suite structure completa
- ✅ Quality gates (pre-commit checks)
- ✅ **6 fases detalladas:**
  - **FASE 0:** Testing Framework (4h)
  - **FASE 1:** F-004 Contratos Oficiales (8h) - P0 CRÍTICO
  - **FASE 2:** F-001 Ecosistema PM2 (3h)
  - **FASE 3:** F-002 Contrato ROUTER Duplicado (2h)
  - **FASE 4:** F-003 Skill Obsoleto (2h)
  - **FASE 5:** Automatización y CI/CD (8h)
  - **FASE 6:** Documentación y Cierre (5h)
- ✅ Riesgos y mitigaciones
- ✅ Métricas de éxito (técnicas, proceso, calidad)
- ✅ Roadmap de ejecución (2 semanas)
- ✅ Criterios de cierre

**Características destacadas:**

- 🎯 Test-Driven Development (tests antes de código)
- 🔒 Quality gates automatizados
- 📊 Métricas pre/post comparativas
- 🚨 Hallazgo F-004 identificado como crítico bloqueante

---

### 2. [context.md](./context.md) - Contexto Completo

**Contenido principal:**

- ✅ **Sección 1:** Contexto del proyecto (qué es Skills Fabrik)
- ✅ **Sección 2:** Arquitectura del repositorio (directorios, componentes)
- ✅ **Sección 3:** Metodología CLOOP explicada
- ✅ **Sección 4:** Prompt Builder v2 (PBv2) y limitaciones
- ✅ **Sección 5:** Detalle de 4 hallazgos (F-001 a F-004)
- ✅ **Sección 6:** Stakeholders y responsabilidades
- ✅ **Sección 7:** Stack tecnológico y herramientas
- ✅ **Sección 8:** Insumos generados (raw files, prompts)
- ✅ **Sección 9:** Conceptos clave del dominio (SSOT, Drift, Contratos)
- ✅ **Sección 10:** Métricas y KPIs
- ✅ **Sección 11:** Glosario de términos
- ✅ **Sección 12:** Dependencias y prerequisitos
- ✅ **Sección 13:** Referencias y documentación
- ✅ **Sección 14:** Notas para continuidad
- ✅ **Sección 15:** Changelog

**Características destacadas:**

- 📖 Onboarding completo para nuevos colaboradores
- 🗺️ Mapa del repositorio con ubicaciones clave
- 🎓 Glosario de 13 términos técnicos
- 🔍 Análisis detallado de cada hallazgo con evidencia
- 🛠️ Comandos y herramientas específicas

---

### 3. [tasks.md](./tasks.md) - 92 Mini-Tasks

**Contenido principal:**

- ✅ **92 tareas granulares** (15-30min cada una)
- ✅ **FASE 0:** 14 tareas (Testing Framework)
- ✅ **FASE 1:** 24 tareas (F-004 Contratos)
- ✅ **FASE 2:** 10 tareas (F-001 PM2)
- ✅ **FASE 3:** 8 tareas (F-002 ROUTER)
- ✅ **FASE 4:** 8 tareas (F-003 Skill obsoleto)
- ✅ **FASE 5:** 16 tareas (Automatización)
- ✅ **FASE 6:** 12 tareas (Documentación)
- ✅ Checkboxes para tracking
- ✅ Comandos bash específicos listos para ejecutar
- ✅ Código TypeScript de tests incluido
- ✅ Estimaciones de tiempo por tarea
- ✅ Commits sugeridos

**Características destacadas:**

- ⚡ Anti-drift design (tareas pequeñas para evitar desviación)
- 📝 Cada tarea tiene criterio de aceptación claro
- 💻 Copy-paste ready (comandos y código listos)
- ✅ Checklist de cierre con verificación final
- 🎯 Orden de prioridad definido (P0 → P3)

**Ejemplo de estructura de tarea:**

````markdown
#### T0.1.1 - Instalar framework de testing (15min)

```bash
pnpm add -D vitest @vitest/ui
```
````

- [ ] Ejecutar comando
- [ ] Verificar instalación: `pnpm vitest --version`
- [ ] Commit: `chore: add vitest testing framework`

````

---

## 🎯 Cómo Usar Esta Triada

### Para empezar la remediación:

1. **Lee primero `context.md`** (30min)
   - Entiende el problema completo
   - Familiarízate con conceptos clave
   - Identifica stakeholders

2. **Revisa `plan.md`** (20min)
   - Comprende la arquitectura de solución
   - Revisa las 6 fases
   - Verifica quality gates

3. **Ejecuta `tasks.md` linealmente** (40h)
   - Comienza por FASE 0 (Testing Framework)
   - Una tarea a la vez
   - Marca checkboxes conforme avanzas
   - Commit después de cada tarea

### Durante la ejecución:

```bash
# 1. Preparar entorno
cd /Users/felipe/Developer/skills-fabrik
pnpm install --frozen-lockfile
pnpm -w build

# 2. Abrir tasks.md
code docs/inventario/2025Q4/tasks.md

# 3. Seguir tareas en orden
# T0.1.1 → T0.1.2 → T0.1.3 → ...

# 4. Si pierdes contexto:
# - Vuelve a context.md
# - Revisa hallazgos.json
# - Ejecuta: git log --oneline --since="2025-11-13"
````

### Para recuperar contexto después:

```bash
# Ver estado actual
cat docs/inventario/2025Q4/hallazgos.json | jq '.findings[] | select(.status=="pending")'

# Ver métricas
cat docs/inventario/2025Q4/metrics-2025-11-13.json

# Ver acciones pendientes
cat docs/inventario/2025Q4/acciones.md | grep pending

# Ver progreso en tasks
grep "^\- \[ \]" docs/inventario/2025Q4/tasks.md | wc -l  # Tareas pendientes
grep "^\- \[x\]" docs/inventario/2025Q4/tasks.md | wc -l  # Tareas completadas
```

---

## 📊 Estructura de los Hallazgos

### F-004: Contratos Oficiales Ausentes (P0 - CRÍTICO)

- **Impacto:** Viola Single Source of Truth
- **Ubicación esperada:** `docs/skills/`
- **Estado actual:** Solo `README.md` presente
- **Resolución:** FASE 1 (8h, 24 tareas)
- **Contratos a crear:**
  - `ROUTER.md`
  - `DAEMON.md`
  - `SKILL-CONTRACT.md`
  - `NMLB.md`

### F-001: Ecosistema PM2 Duplicado (P1)

- **Ruta:** `packages/router/scripts/pm2/router-ecosystem-old.cjs`
- **Resolución:** FASE 2 (3h, 10 tareas)
- **Acción:** Archivar o eliminar tras validación

### F-002: Contrato ROUTER Duplicado (P1)

- **Ruta:** `docs/skills/ROUTER-copy.md`
- **Resolución:** FASE 3 (2h, 8 tareas)
- **Acción:** Incorporar cambios válidos y eliminar duplicado

### F-003: Skill Obsoleto (P2)

- **Ruta:** `skills/guidelines/backend-dev-old/SKILL.md`
- **Resolución:** FASE 4 (2h, 8 tareas)
- **Acción:** Archivar en `archived/skills/2025-11/`

---

## 🏗️ Arquitectura de Tests (TDD)

### Test Suite Structure

```
tests/
├── contracts/
│   ├── contract-existence.test.ts
│   ├── contract-uniqueness.test.ts
│   └── contract-metadata.test.ts
├── artifacts/
│   ├── obsolete-detection.test.ts
│   ├── pm2-config.test.ts
│   └── skills-registry.test.ts
├── integration/
│   └── contract-impl-sync.test.ts
└── e2e/
    └── audit-workflow.test.ts
```

### Quality Gates (Bloqueantes)

1. ✅ **Contract Uniqueness** - Un solo archivo por contrato
2. ✅ **Obsolete Artifacts** - Cero archivos con sufijos `-old`, `-copy`
3. ✅ **Contract Metadata** - Version, date, owner obligatorios
4. ✅ **Test Coverage** - Mínimo 80%

---

## 📈 Métricas Esperadas

### Estado Inicial (Pre-remediación)

```json
{
  "contratos_duplicados": 2,
  "artefactos_obsoletos": 2,
  "contratos_dispersos": 4,
  "debt_score": 7.5,
  "test_coverage": 0,
  "quality_gates": 0
}
```

### Estado Final (Post-remediación)

```json
{
  "contratos_duplicados": 0,
  "artefactos_obsoletos": 0,
  "contratos_dispersos": 0,
  "debt_score": 0.0,
  "test_coverage": 85,
  "quality_gates": 4
}
```

**Mejora esperada:** 100% reducción de deuda técnica

---

## 🎓 Metodología CLOOP Aplicada

```
Clarify (Clarificar)
  ↓ Define alcance, objetivos, stakeholders
Layout (Diseñar)
  ↓ Arquitectura, tests, quality gates
Operate (Ejecutar)
  ↓ Implementar tareas, ejecutar tests
Observe (Observar)
  ↓ Métricas, hallazgos, progreso
Reflect (Reflexionar)
  ↓ Lecciones, presprint, próximos pasos
```

**Documentos de la triada mapean a fases:**

- `context.md` → Clarify (entender el problema)
- `plan.md` → Layout (diseñar la solución)
- `tasks.md` → Operate (ejecutar acciones)
- `metrics-*.json` → Observe (medir progreso)
- `presprint.md` → Reflect (aprender y mejorar)

---

## 🚀 Próximos Pasos Inmediatos

### 1. Validar la triada (15min)

```bash
# Verificar archivos creados
ls -lh docs/inventario/2025Q4/{plan,context,tasks}.md

# Contar líneas
wc -l docs/inventario/2025Q4/{plan,context,tasks}.md

# Verificar sintaxis markdown
npx markdownlint docs/inventario/2025Q4/{plan,context,tasks}.md
```

### 2. Compartir con stakeholders (30min)

- [ ] Router Lead → Revisar FASE 1 y 2
- [ ] DocOps → Revisar FASE 1 y 3
- [ ] Skills Curator → Revisar FASE 4
- [ ] Todos → Revisar FASE 0 y 5 (testing y CI/CD)

### 3. Comenzar ejecución (cuando se autorice)

```bash
# Iniciar con FASE 0
cd /Users/felipe/Developer/skills-fabrik
code docs/inventario/2025Q4/tasks.md

# Ejecutar tarea T0.1.1
pnpm add -D vitest @vitest/ui
```

---

## 📚 Referencias Cruzadas

### Documentos relacionados en 2025Q4/

| Documento                      | Propósito                | Relacionado con                      |
| ------------------------------ | ------------------------ | ------------------------------------ |
| `hallazgos.json`               | Estado de hallazgos      | F-001 a F-004 en `context.md`        |
| `acciones.md`                  | Tabla de remediación     | Fases en `plan.md`                   |
| `metrics-2025-11-13.json`      | Progreso cuantificado    | Métricas en `plan.md` y `context.md` |
| `skills-core-inventario.md`    | Narrativa del inventario | Resumen de toda la triada            |
| `presprint.md`                 | Lecciones y cierre       | FASE 6 en `plan.md` y `tasks.md`     |
| `informe-activacion-skills.md` | Informe original         | Base de `context.md`                 |

### Comandos útiles

```bash
# Ver índice de plan
grep "^##" docs/inventario/2025Q4/plan.md

# Ver índice de context
grep "^##" docs/inventario/2025Q4/context.md

# Ver índice de tasks
grep "^##" docs/inventario/2025Q4/tasks.md

# Buscar término específico en triada
rg -i "quality gate" docs/inventario/2025Q4/{plan,context,tasks}.md

# Ver todas las tareas de FASE 1
grep "^####" docs/inventario/2025Q4/tasks.md | grep "T1\."
```

---

## ✅ Checklist de Validación de la Triada

- [x] ✅ `plan.md` creado (519 líneas)
- [x] ✅ `context.md` creado (646 líneas)
- [x] ✅ `tasks.md` creado (1,461 líneas)
- [x] ✅ Metadata incluida en cada archivo
- [x] ✅ Referencias cruzadas entre documentos
- [x] ✅ 6 fases definidas con tareas
- [x] ✅ 92 mini-tasks con checkboxes
- [x] ✅ Quality gates definidos
- [x] ✅ Test suite structure documentada
- [x] ✅ Comandos bash listos para ejecutar
- [x] ✅ Código TypeScript de tests incluido
- [x] ✅ Estimaciones de tiempo por fase
- [x] ✅ Criterios de cierre definidos
- [x] ✅ Métricas pre/post documentadas
- [x] ✅ Glosario y conceptos clave incluidos

**Estado:** ✅ Triada validada y completa

---

## 🎯 Criterios de Éxito Global

La remediación se considera exitosa cuando:

1. ✅ **Técnico:**
   - 100% tests pasan
   - Coverage ≥80%
   - 0 contratos duplicados
   - 0 artefactos obsoletos
   - Quality gates activos en CI/CD

2. ✅ **Proceso:**
   - 4/4 hallazgos resueltos
   - Presprint completado
   - Métricas finales publicadas
   - Snapshot MemTech guardado

3. ✅ **Calidad:**
   - Debt score: 7.5 → 0.0
   - Contratos en `docs/skills/` con metadata
   - Documentación actualizada
   - CI/CD con quality gates

---

## 📝 Notas Finales

### Fortalezas de esta triada:

✅ **Granularidad extrema** - 92 tareas vs 6 fases  
✅ **Copy-paste ready** - Comandos y código listos  
✅ **Anti-drift design** - Tareas 15-30min previenen desviación  
✅ **Test-driven** - Tests antes de implementación  
✅ **Trazabilidad completa** - Cada hallazgo → fase → tareas  
✅ **Contexto exhaustivo** - 646 líneas de documentación de dominio

### Para mantener actualizada:

```bash
# Actualizar métricas después de cada fase
vi docs/inventario/2025Q4/metrics-2025-11-13.json

# Marcar hallazgos resueltos
vi docs/inventario/2025Q4/hallazgos.json

# Actualizar presprint con lecciones
vi docs/inventario/2025Q4/presprint.md

# Commit de progreso
git add docs/inventario/2025Q4/
git commit -m "audit: update phase X completion status"
```

---

**Creado:** 2025-11-13  
**Autor:** Technical Auditor (Claude)  
**Versión:** 1.0.0  
**Total de líneas:** 2,626 (plan + context + tasks)  
**Estimación total:** 40 horas, 6 fases, 92 tareas

🎉 **La triada está completa y lista para ejecutarse.**
