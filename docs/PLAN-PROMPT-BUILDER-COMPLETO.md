# Plan: Prompt Builder Completo - Integración con startkit-main

**Fecha**: 2025-10-29  
**Basado en**: 
- `startkit-main/cloop-research/metacognicion/playbook-bmcc/promptcreate.md`
- `startkit-main/docs/prompts/templates/` y `meta/`
- `startkit-main/cloop-research/metacognicion/playbook-bmcc/templates/handoff-template-v2.md`

---

## 🎯 Objetivo

Crear un **generador completo de prompts** que:
1. ✅ **Garantice activación de skills** (heurística multi-señal ≥ 0.6)
2. ✅ **Incluya estructura CLOOP completa** (promptcreate.md)
3. ✅ **Use templates de handoff** para estructura profesional
4. ✅ **Siga meta-prompt universal** para adaptabilidad
5. ✅ **Valide automáticamente** con tests ejecutables

---

## 📋 Fases de Implementación

### FASE 1: Base Actual (✅ COMPLETADO)

**Estado**: Implementado y funcionando

**Componentes**:
- ✅ `packages/skills-cli/src/utils/prompt-builder.ts`
- ✅ `packages/skills-cli/src/commands/prompt-builder.ts`
- ✅ CLI: `skills prompt-builder <skill-id> "<descripción>"`

**Funcionalidades**:
- Genera prompt con keywords, intent, paths, content
- Calcula score esperado
- Sugiere archivos y contenido

---

### FASE 2: Integración promptcreate.md (Estructura CSE)

**Objetivo**: Generar prompts con estructura completa de `promptcreate.md`

**Componentes a integrar**:

#### 2.1 CSE Completo (Contexto + Especificación + Verificación)

**Contexto**:
- ROL_Y_PROPÓSITO: Extraer de skill.type y enforcement
- CONTEXTO_COMPLETO: Archivos relevantes, estado actual

**Especificación**:
- OBJETIVOS_ESPECÍFICOS: Generar según descripción + skill
- TAREAS_DETALLADAS: Dividir en pasos concretos

**Verificación**:
- VALIDACIONES: Comandos ejecutables según skill
- CRITERIOS_DE_ÉXITO: Métricas medibles

#### 2.2 TAGs Cobertura

**Generar automáticamente**:
- `[K:]` Conocimiento: Keywords del skill + contexto técnico
- `[C:]` Contexto: Path patterns + content patterns detectados
- `[U:]` Usuario: Tipo de actividad (backend/frontend/plan/guardrail)
- `[EVIDENCIA:]` Evidencias: Archivos relacionados, estado actual
- `[PROPUESTA:]` Propuestas: Cambios sugeridos

#### 2.3 Boundary Markers (35+ marcadores)

**Generar marcadores** distribuidos:
- Inicio de secciones: `## 🎯 OBJETIVO`
- Cambios de contexto: `---`
- Validaciones: `✅ VERIFICACIÓN:`
- Ejemplos: `📝 EJEMPLO:`
- Warning: `⚠️ ATENCIÓN:`

**Densidad**: Mínimo 1 marcador cada 10-15 líneas

#### 2.4 Frontmatter YAML

**Campos obligatorios**:
```yaml
---
skill_id: {skill-id}
version: 1.0.0
complexity: {low|medium|high|very-high}
duration: {Xh}
cse_structure: true
tags_coverage: true
boundary_markers: true
anti_drift: true
smart_objectives: true
tests_executable: true
---
```

#### 2.5 Anti-Drift (8 mecanismos)

**Implementar**:
1. Chain-of-Verification: Validaciones paso a paso
2. Boundary Markers: Límites explícitos
3. Criterios de éxito: Medibles y verificables
4. Tests ejecutables: Comandos bash/scripts
5. Evidencias: Referencias a archivos concretos
6. Validación incremental: Checks después de cada paso
7. Documentación: Registrar decisiones
8. Métricas: KPIs observables

#### 2.6 Objetivos SMART

**Generar 3-5 objetivos**:
- Specific: Específicos al skill y descripción
- Measurable: Métricas concretas
- Achievable: Realistas según skill.type
- Relevant: Alineados con propósito
- Time-bound: Duración estimada

#### 2.7 Tests Ejecutables

**Generar según skill.type**:
- **guideline**: `npm run lint`, `npm run test`
- **guardrail**: Validación de reglas, checks de seguridad
- **workflow**: Validación de pasos, estado final
- **generator**: Validación de output, formato correcto
- **analyst**: Validación de análisis, reportes

#### 2.8 Separación EVIDENCIA/PROPUESTA

**Estructura**:
```markdown
## [EVIDENCIA:] Estado Actual
- Archivo: `ruta/archivo.ts`
- Estado: Descripción actual
- Métricas: Valores actuales

## [PROPUESTA:] Cambios Sugeridos
- Modificar: `ruta/archivo.ts` para agregar X
- Resultado esperado: Descripción del resultado
```

---

### FASE 3: Templates Handoff (Estructura Profesional)

**Objetivo**: Usar estructura de handoff para prompts largos/complejos

**Aplicar cuando**:
- `complexity >= high`
- `description` contiene múltiples tareas
- Skill es `workflow` o `generator`

**Secciones a incluir**:
- ✅ Tareas Completadas (checklist)
- 📦 Artefactos Generados (archivos esperados)
- ⚠️ Issues Pendientes (riesgos)
- 🎯 Decisiones Técnicas
- 📊 Métricas
- 🔄 Checklist de Validación

---

### FASE 4: Meta-Prompt Universal (Adaptabilidad)

**Objetivo**: Hacer prompts adaptables con meta-prompt parameters

**Parámetros a agregar**:
```yaml
meta:
  mode: {build|execute|audit|optimize|plan}
  style: {concise|standard|verbose}
  tone: {neutral|technical|creative}
  strict_schema: {on|off}
  tags_c/m/u/d/k: {on|off}
  fileline_precision: {on|off}
```

**Generar bloque**:
```markdown
<BEGIN_META_PROMPT>
meta:
  mode: execute
  style: standard
  ...
```

---

### FASE 5: Validación Automática

**Objetivo**: Validar prompts generados automáticamente

**Checks**:
1. **Score heurística**: ≥ 0.6
2. **CSE structure**: Contexto + Especificación + Verificación presentes
3. **TAGs**: Mínimo 3 TAGs diferentes
4. **Boundary markers**: ≥ 25 marcadores
5. **Frontmatter**: Todos los campos obligatorios
6. **SMART objectives**: 3-5 objetivos con todas las letras
7. **Tests ejecutables**: ≥ 3 comandos de validación
8. **Anti-drift**: ≥ 6 de 8 mecanismos presentes

**Script de validación**:
```bash
skills prompt-builder validate <prompt-file>
```

---

## 🏗️ Arquitectura Propuesta

### Estructura de Archivos

```
packages/skills-cli/src/
├── utils/
│   ├── prompt-builder.ts          # Generador base (existente)
│   ├── prompt-builder-cse.ts       # NUEVO: Componentes CSE
│   ├── prompt-builder-handoff.ts   # NUEVO: Templates handoff
│   ├── prompt-builder-meta.ts     # NUEVO: Meta-prompt integration
│   └── prompt-validator.ts         # NUEVO: Validación completa
│
├── commands/
│   └── prompt-builder.ts           # Comando CLI (extender)
│
└── templates/
    ├── cse-structure.md            # Template CSE base
    ├── handoff-structure.md        # Template handoff
    ├── meta-prompt-block.md        # Meta-prompt block
    └── smart-objectives.md         # Template objetivos SMART
```

---

## 📝 Ejemplo de Output Esperado

### Input
```bash
skills prompt-builder backend-dev-guidelines "crear endpoint de autenticación" \
  --complexity high \
  --include-full-structure
```

### Output
```markdown
---
skill_id: backend-dev-guidelines
version: 1.0.0
complexity: high
duration: 4h
cse_structure: true
tags_coverage: true
boundary_markers: true
anti_drift: true
smart_objectives: true
tests_executable: true
mode: execute
style: standard
tone: technical
---

# 🎯 Crear Endpoint de Autenticación

## [K:] Conocimiento
- Backend: Express.js, TypeScript, Controller pattern
- Autenticación: JWT, bcrypt, middleware de validación

## [C:] Contexto
- Archivos relevantes: `backend/src/controllers/AuthController.ts`
- Estado: No existe endpoint de autenticación

## [EVIDENCIA:] Estado Actual
- Archivo: `backend/src/routes/auth.routes.ts`
- Estado: Archivo no existe

## [PROPUESTA:] Cambios Sugeridos
- Crear: `backend/src/controllers/AuthController.ts`
- Crear: `backend/src/services/AuthService.ts`
- Crear: `backend/src/routes/auth.routes.ts`
- Modificar: `backend/src/app.ts` para agregar rutas

---

## 📋 ESPECIFICACIÓN

### Objetivos SMART

1. **Specific**: Crear endpoint POST `/auth/login` que valida credenciales
2. **Measurable**: 
   - 1 endpoint funcional
   - Tests con coverage ≥ 80%
   - Latencia p95 < 200ms
3. **Achievable**: Implementable en 4h con skill backend-dev
4. **Relevant**: Necesario para sistema de autenticación
5. **Time-bound**: Completar en 4 horas

### Tareas Detalladas

1. **Crear AuthController**
   - Método `login(req, res)`
   - Validación de entrada
   - Manejo de errores

2. **Crear AuthService**
   - Lógica de autenticación
   - Hash de contraseñas
   - Generación de JWT

3. **Crear Routes**
   - POST `/auth/login`
   - Integración con Express

4. **Agregar Tests**
   - Tests unitarios Controller
   - Tests integración endpoint

---

## ✅ VERIFICACIÓN

### Tests Ejecutables

```bash
# 1. Validar estructura de archivos
test -f backend/src/controllers/AuthController.ts || echo "❌ FAIL: Controller missing"
test -f backend/src/services/AuthService.ts || echo "❌ FAIL: Service missing"

# 2. Validar tests pasan
npm run test:auth || echo "❌ FAIL: Tests failing"

# 3. Validar endpoint funciona
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}' \
  | jq -e '.token' || echo "❌ FAIL: Endpoint not working"

# 4. Validar coverage
npm run test:coverage | grep -q "auth.*80%" || echo "❌ FAIL: Coverage < 80%"

# Expected: All ✅ PASS
```

### Criterios de Éxito

- ✅ Endpoint POST `/auth/login` responde 200 OK con token JWT válido
- ✅ Tests unitarios e integración pasan (≥80% coverage)
- ✅ Latencia p95 < 200ms
- ✅ Manejo de errores correcto (400, 401, 500)
- ✅ Contraseñas hasheadas con bcrypt

---

## 🔒 Anti-Drift Mechanisms

1. **Chain-of-Verification**: Validar cada paso antes del siguiente
2. **Boundary Markers**: Marcar límites de cada sección
3. **Criterios de éxito**: Métricas específicas y verificables
4. **Tests ejecutables**: Scripts bash con exit codes
5. **Evidencias**: Referencias a archivos concretos
6. **Validación incremental**: Checks después de cada tarea
7. **Documentación**: Registrar decisiones en ADRs si aplica
8. **Métricas**: Latencia, coverage, errores

---

## 📊 Métricas Esperadas

| Métrica | Target | Validación |
|---------|--------|------------|
| Endpoints creados | 1 | `grep -c "router.post" backend/src/routes/auth.routes.ts` |
| Tests coverage | ≥80% | `npm run test:coverage` |
| Latencia p95 | <200ms | Load test |
| Errores TS | 0 | `npm run typecheck` |

---

**Score heurística esperado**: 0.95/1.0
- Keywords (20%): ✅ backend, controller, service, endpoint, auth
- Intent (30%): ✅ "crear endpoint"
- Path (30%): ✅ archivos en `backend/src/**`
- Content (20%): ✅ patterns de router, controller, service

---

## 🔄 Checklist Final

- [ ] Prompt genera score ≥ 0.6
- [ ] CSE structure completa
- [ ] TAGs presentes (mínimo 3)
- [ ] Boundary markers ≥ 25
- [ ] Frontmatter completo
- [ ] SMART objectives (3-5)
- [ ] Tests ejecutables (≥3)
- [ ] Anti-drift (≥6/8 mecanismos)

---

**Generado**: 2025-10-29T{timestamp}  
**Skill activado**: backend-dev-guidelines  
**Score esperado**: 0.95/1.0 ✅
```

---

## 🚀 Priorización

### Prioridad ALTA (Implementar primero)
1. ✅ FASE 1: Base actual (COMPLETADO)
2. 🎯 FASE 2.1-2.3: CSE, TAGs, Boundary Markers (crítico para calidad)
3. 🎯 FASE 5: Validación automática (asegurar calidad)

### Prioridad MEDIA
4. FASE 2.4-2.6: Frontmatter, Anti-Drift, SMART
5. FASE 2.7-2.8: Tests ejecutables, EVIDENCIA/PROPUESTA

### Prioridad BAJA (Nice to have)
6. FASE 3: Templates Handoff (solo para prompts complejos)
7. FASE 4: Meta-Prompt Universal (optimización avanzada)

---

## 📈 Métricas de Éxito

- **Activation rate**: ≥90% de prompts generados activan skills (score ≥ 0.6)
- **CSE compliance**: 100% de prompts incluyen CSE completo
- **TAGs coverage**: ≥80% incluyen ≥3 TAGs diferentes
- **Boundary markers**: Promedio ≥30 marcadores por prompt
- **Validation pass rate**: ≥95% pasan validación automática

---

**Plan creado**: 2025-10-29  
**Próximo paso**: Implementar FASE 2.1 (CSE Completo)

