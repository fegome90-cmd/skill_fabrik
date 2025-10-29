# Fase 2: Planning Mode Duro - Progreso

**Fecha**: 2025-01-27  
**Estado**: ✅ **EN PROGRESO - 75% COMPLETADO**

---

## ✅ Tareas Completadas

### 1. ✅ Slash-commands Implementados

- ✅ `skills plan create "<tarea>"` → crea plan y genera draft
- ✅ `skills plan save <plan-id>` → guarda tríada + snapshot MemTech L1 (TODO: snapshot)
- ✅ `skills plan approve <plan-id>` → aprueba plan
- ✅ `skills plan list` → lista todos los planes
- ✅ `skills dev-docs update` → actualiza tríada antes de compaction (mejorado)

### 2. ✅ Ciclo de Vida del Plan

- ✅ Estados definidos: `DRAFT → PENDING_APPROVAL → APPROVED → EXECUTING → COMPLETED`
- ✅ Plan como objeto estructurado (JSON) con validación
- ✅ Validación de esquema de Plan (`validatePlan`)
- ✅ Transiciones de estado con validaciones (`validateStatusTransition`)

### 3. ✅ Gate Obligatorio

- ✅ Pre-invoke hook verifica plan aprobado si `SKILLS_PLANNING_MODE` está habilitado
- ✅ Mensaje claro con CTA: instrucciones para crear/aprobar plan
- ✅ Bloqueo de edición sin plan aprobado
- ✅ Opción para deshabilitar: `SKILLS_PLANNING_MODE=false`

### 4. ✅ Tríada Dev-docs

- ✅ Generador automático de `plan.md` (objetivo, fases, riesgos, métricas)
- ✅ Generador automático de `context.md` (archivos clave, decisiones ADR, dependencias)
- ✅ Generador automático de `tasks.md` (checklist vivo desde fases del plan)
- ✅ Integración con `dev-docs update` para regenerar tríada

---

## 🔄 En Progreso / Pendientes

### 5. ⚠️ Integración MemTech L1

- ⚠️ TODO: Implementar snapshot MemTech L1 al aprobar plan
- ⚠️ Integración pendiente con sistema MemTech existente

### 6. ⚠️ Skills Generator/Workflow

- ⚠️ TODO: Crear skill `plan-architect` (generator) con meta-prompt CLOOP
- ⚠️ TODO: Crear skill `plan-save-workflow` que genera tríada + snapshot

---

## 📊 Archivos Creados/Modificados

### Nuevos Archivos

- `packages/skills-cli/src/types/plan.ts` - Tipos de Plan
- `packages/skills-cli/src/utils/plan-validator.ts` - Validación de planes
- `packages/skills-cli/src/utils/plan-generator.ts` - Generadores de markdown
- `packages/skills-cli/src/commands/plan.ts` - Comandos CLI de plan
- `packages/router/src/utils/plan-check.ts` - Utilidades de verificación de plan
- `packages/router/src/types.ts` - Actualizado con tipos de Plan

### Archivos Modificados

- `packages/skills-cli/src/index.ts` - Registro de comando plan
- `packages/skills-cli/src/commands/dev-docs.ts` - Mejorado para regenerar tríada
- `packages/router/src/pre-invoke.ts` - Gate de planning mode
- `packages/router/src/types.ts` - Tipos de Plan añadidos

---

## 🧪 Pruebas Necesarias

### Tests Unitarios

- [ ] Test de `validatePlan` con casos válidos/inválidos
- [ ] Test de `validateStatusTransition` con transiciones válidas/inválidas
- [ ] Test de generadores de markdown (plan.md, context.md, tasks.md)
- [ ] Test de gate en pre-invoke hook

### Tests Integración

- [ ] Flujo completo: `plan create` → `plan approve` → `plan save` → verificar tríada
- [ ] Gate bloquea edición sin plan aprobado
- [ ] Gate permite edición con plan aprobado

---

## 📝 Notas de Implementación

### Decisiones Técnicas

1. **ID de Plan**: Usa `timestamp-base36 + random-hex` para generar IDs únicos sin dependencias externas
2. **Validación**: Separada en `plan-validator.ts` para reutilización
3. **Generadores**: Cada tipo de markdown tiene su propia función para mantener modularidad
4. **Gate**: Verifica `dev/active/<task>/task.json` con `planPath` y valida que el plan esté `APPROVED` o `EXECUTING`

### Paths

- Plans: `dev/plans/<plan-id>.json` y `dev/plans/<plan-id>.md`
- Dev-docs: `dev/active/<task-name>/plan.md`, `context.md`, `tasks.md`, `task.json`

---

## ✅ Gate GO - Parcial

**Completado**:

- ✅ Slash-commands funcionando
- ✅ Ciclo de vida del plan implementado
- ✅ Gate de bloqueo activo
- ✅ Tríada dev-docs auto-generada

**Pendiente**:

- ⚠️ Integración MemTech L1 (snapshot)
- ⚠️ Skills generator/workflow

---

**Próximos Pasos**: Implementar skills `plan-architect` y `plan-save-workflow`, integrar MemTech L1 snapshot.
