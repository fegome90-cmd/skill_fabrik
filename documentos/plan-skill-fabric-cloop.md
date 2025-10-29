# Plan de Implementación: Skill Fabric (Versión CLOOP)

**Versión**: 2.0.0  
**Fecha**: 2025-01-27  
**Metodología**: CLOOP (Clarify → Layout → Operate → Observe → Reflect)  
**Base**: Análisis de 3 investigaciones sobre ecosistemas agénticos

---

## CLOOP: Clarify (Clarificar)

### Objetivo SMART

**Construir un ecosistema "skill-fabric" editor-agnostic que habilite auto-activación de skills, hooks de calidad post-respuesta, dev-docs estructurados, y debugging backend con PM2, siguiendo los principios de divulgación progresiva y contratos semánticos de alta calidad identificados en las investigaciones.**

- **Specific**: Sistema modular con packages (skills-cli, router, mcp-adapters, kpi), skills canónicos, registry indexado, hooks pre/post, guardrails multi-nivel
- **Measurable**: KPIs de activación (precision ≥90%, recall ≥85%), adherencia (≥80%), zero-errors-left-behind (≥95%)
- **Achievable**: Basado en patrones validados de Anthropic Skills y arquitecturas de referencia públicas
- **Relevant**: Resuelve "context rot", mejora calidad de código generado, reduce errores residuales
- **Time-bound**: 7-10 días (fases 0-6 definidas)

### Hipótesis Principales

1. **H1**: Divulgación progresiva (3 niveles) reduce consumo de tokens en 15-30% sin pérdida de efectividad
2. **H2**: Descripciones de alta calidad aumentan precisión de activación de skills a ≥90%
3. **H3**: Stop hook completo garantiza zero-errors-left-behind ≥95% en PRs
4. **H4**: Guardrails educativos (SUGGEST→WARN→BLOCK) previenen errores sin frustrar al desarrollador
5. **H5**: Planning mode duro evita "saltos" de pasos y mejora adherencia a metodología CLOOP

### Criterios de Éxito Cuantificables

#### Métricas de Activación

- `skill_activation_precision ≥ 90%` (skills activados correctamente)
- `skill_activation_recall ≥ 85%` (skills relevantes no omitidos)
- `false_positive_rate < 10%` (activaciones incorrectas)

#### Métricas de Calidad

- `skill_adherence_rate ≥ 80%` (respuestas que cumplen la guía activa)
- `zero_errors_left_behind_ratio ≥ 95%` (PRs sin errores residuales)
- `mean_fix_latency < 5 minutos` (tiempo desde detección hasta corrección)

#### Métricas de Eficiencia

- Reducción de `tokens_per_operation` en 15-30% vs. enfoque sin divulgación progresiva
- `mean_response_latency < 10s` para activaciones de skills

#### Métricas de Cumplimiento

- Gate Planning Mode: 100% de ediciones requieren plan aprobado (sin excepciones)
- Divulgación progresiva: 100% de skills cargan recursos on-demand (no en carga inicial)

---

## CLOOP: Layout (Planificar - MVP Ejecutable)

### Arquitectura Mínima

```
skill-fabric/
├─ packages/
│ ├─ skills-cli/       # CLI: init/lint/pack/install/list/run/mine
│ ├─ router/          # pre-invoke + stop hooks (editor/CLI agnostic)
│ ├─ mcp-adapters/    # fs, git, pm2, metrics (Zen Hub MCP)
│ └─ kpi/             # JSONL/Prometheus events
├─ skills/            # Biblioteca canónica (SKILL.md + resources + scripts)
│ ├─ guidelines/     # frontend-dev, backend-dev, api-contracts
│ ├─ guardrails/     # database-verification, secrets-and-config, migration-safety
│ ├─ workflows/      # plan-architect, plan-save-workflow, testing-plan-designer
│ ├─ analysts/       # repo-auditor, pr-reviewer, test-scaffolder
│ └─ generators/     # plan-architect, testing-plan-designer
├─ registry/         # Índices compilados
│ ├─ index.json      # Metadatos (name, description, tags) para carga rápida
│ └─ bundles/        # Paquetes listos (on-demand)
├─ configs/
│ ├─ skill-rules.schema.json  # Esquema validación
│ ├─ SKILL.template.md        # Plantilla ≤400 líneas
│ └─ repos.yaml              # Repos a minar (ADRs + patrones)
├─ scripts/pm2/ecosystem.config.cjs
├─ obs/kpi/events.jsonl       # Eventos de desempeño
└─ docs/
```

### Interfaces y Contratos

#### 1. SKILL.md Contract

```yaml
# Frontmatter YAML obligatorio
name: <skill-id> # slug, max 64 chars
description: <descripción orientada a acción, clara sobre cuándo usar/NO usar>
type: guideline|guardrail|workflow|analyst|generator
enforcement: suggest|require|block
version: 0.1.0
# Cuerpo Markdown ≤400 líneas
# - Objetivo
# - Procedimiento mínimo
# - Checklist (DoD)
# - Scripts reales (referencias)
# - Ejemplos mínimos (bien/mal)
# - Recursos (referencias on-demand)
```

#### 2. skill-rules.json Contract

```json
{
  "$schema": "skill-rules.schema.json",
  "<skill-id>": {
    "type": "guideline|guardrail|workflow|analyst|generator",
    "enforcement": "suggest|require|block",
    "priority": "critical|high|normal|low",
    "promptTriggers": {
      "keywords": ["..."],
      "intentPatterns": ["regex..."]
    },
    "fileTriggers": {
      "pathPatterns": ["glob..."],
      "contentPatterns": ["regex..."]
    },
    "resources": ["ruta/recursos.md"]
  }
}
```

#### 3. Pre-invoke Hook Contract

```typescript
interface PreHookInput {
  prompt: string;
  openFiles: string[];
  activeFileContent?: string; // Snapshot ≤2KB
  cwd: string;
}

interface PreHookOutput {
  injectedNote?: string; // "🎯 Skill Activation Check"
  activated: string[]; // Skills activados
  metadata: {
    scores: Record<string, number>; // Score de cada skill
    reasons: Record<string, string[]>; // Razones de activación
  };
}
```

#### 4. Stop Hook Contract

```typescript
interface StopHookInput {
  editLog: Array<{ file: string; repo: string; ts: number }>;
  reposChanged: Set<string>;
  cwd: string;
}

interface StopHookOutput {
  formatted: string[]; // Archivos formateados
  typecheck: {
    repo: string;
    errors: number;
    output: string;
  }[];
  hints?: string[]; // Sugerencias de errores
  autoResolved: boolean; // Si se auto-resolvió
  kpiEvent: KPIEvent; // Evento JSONL
}
```

#### 5. Plan Mode Contract

```typescript
interface Plan {
  id: string;
  task: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'EXECUTING' | 'COMPLETED';
  phases: Array<{
    name: string;
    steps: string[];
    dependencies: string[];
  }>;
  risks: Array<{ description: string; mitigation: string }>;
  metrics: {
    expected_tokens?: number;
    estimated_latency_s?: number;
  };
  approvedBy?: string;
  approvedAt?: string;
}
```

### Métricas a Recolectar (Observe)

#### Métricas de Activación (Velocidad)

- `skill_activation_rate`: % de prompts que activan al menos 1 skill
- `skill_activation_precision`: % de activaciones correctas
- `skill_activation_recall`: % de skills relevantes no omitidos
- `tokens_per_operation`: Tokens consumidos por tarea completada

#### Métricas de Calidad (Contramétricas)

- `skill_adherence_rate`: % respuestas que cumplen guía activa
- `zero_errors_left_behind_ratio`: % PRs sin errores residuales
- `mean_fix_latency_s`: Tiempo promedio corrección (segundos)
- `guardrail_effectiveness`: % errores preventivos vs. detectados post-facto

#### Métricas de Cumplimiento (Gates)

- `plan_approval_rate`: % ediciones con plan aprobado
- `progressive_disclosure_rate`: % recursos cargados on-demand (vs. upfront)
- `description_quality_score`: Score promedio descripciones (herramienta lint)

### Plan de Pruebas (Inputs/Outputs)

#### Prueba 1: Activación de Skill (Inputs)

- **Input**: Prompt "crear controlador para endpoint /api/users", archivo activo `services/api/src/controllers/user.ts`
- **Output Esperado**:
  - `backend-dev-guidelines` activado (score >0.6)
  - `database-verification` activado (contentPattern: "prisma.")
  - Nota inyectada con razones claras

#### Prueba 2: Stop Hook Pipeline (Inputs)

- **Input**: 3 archivos editados en `services/api/`, 2 errores TypeScript detectados
- **Output Esperado**:
  - Archivos formateados con Prettier
  - TypeCheck ejecutado → 2 errores listados
  - Hints emitidos (sin auto-resolver, <5 errores)
  - Evento KPI en `obs/kpi/events.jsonl`

#### Prueba 3: Planning Mode Gate (Inputs)

- **Input**: Intento de editar sin plan aprobado
- **Output Esperado**:
  - Bloqueo con mensaje claro
  - CTA: "/plan → /plan-save"
  - No se permite edición hasta plan aprobado

#### Prueba 4: Guardrail Multi-nivel (Inputs)

- **Input**: Query `findMany()` sin `where`
- **Output Esperado**:
  - Modo SUGGEST: "¿Querías filtrar por tenant?"
  - Si persiste → WARN
  - Si es `deleteMany()` sin `where` → BLOCK directo

---

## CLOOP: Operate (Plan de Ejecución)

### Fase 0: Bootstrap y Fundamentos (1-2 días)

#### Tareas Concretas (Checklist)

**Estructura Base:**

- [ ] Crear monorepo `skill-fabric/` con estructura completa de carpetas
- [ ] Configurar `package.json` workspace con pnpm
- [ ] Crear `tsconfig.json` base para packages
- [ ] Configurar `.gitignore` apropiado

**Contratos y Schemas:**

- [ ] Crear `skill-rules.schema.json` con JSON Schema completo
- [ ] Crear `SKILL.template.md` con YAML frontmatter y secciones definidas
- [ ] Validar schema con ejemplo mínimo funcional
- [ ] Documentar contratos en `docs/contracts/`

**Hooks Mínimos:**

- [ ] Implementar `packages/router/src/pre-invoke.ts` con detección básica
- [ ] Implementar `packages/router/src/stop.ts` con prettier + typecheck básico
- [ ] Crear `packages/router/src/detectors.ts` (keywords, regex, globs)
- [ ] Tests unitarios para matchers de skills

**Herramienta de Validación:**

- [ ] Crear `packages/skills-cli/src/lint.ts` para validar descripciones
- [ ] Validar: longitud mínima, verbos de acción, ausencia de solapes
- [ ] Integrar en pipeline de CI

**Gate GO:** Pre-invoke muestra "🎯 Skill Activation Check", stop hook formatea y compila correctamente

---

### Fase 1: Skills Base con Divulgación Progresiva (2-3 días)

#### Tareas Concretas (Checklist)

**Skill 1: backend-dev-guidelines**

- [ ] Crear `skills/guidelines/backend-dev-guidelines/SKILL.md` (≤400 líneas)
- [ ] YAML frontmatter: name, description validada, type=guideline
- [ ] Recursos en `resources/`: routes.md, controllers.md, repositories.md
- [ ] Scripts reales en `scripts/`: validate-route.sh, test-endpoint.sh
- [ ] Ejemplos mínimos (bien/mal) en cuerpo
- [ ] Validar descripción con lint (pasa)

**Skill 2: frontend-dev-guidelines**

- [ ] Crear `skills/guidelines/frontend-dev-guidelines/SKILL.md` (≤400 líneas)
- [ ] Recursos: components.md, hooks.md, query-router.md
- [ ] Descripción validada

**Skill 3: database-verification (guardrail)**

- [ ] Crear `skills/guardrails/database-verification/SKILL.md`
- [ ] Reglas multi-nivel: SUGGEST (findMany sin where), WARN (update sin where), BLOCK (deleteMany sin where)
- [ ] Recursos: guardrails.md con criterios específicos
- [ ] Enforcement: block, priority: critical

**Skill 4: plan-architect (generator)**

- [ ] Crear `skills/generators/plan-architect/SKILL.md`
- [ ] Integrar meta-prompt CLOOP
- [ ] Genera plan estructurado con ciclo de vida

**Skill 5: plan-save-workflow (workflow)**

- [ ] Crear `skills/workflows/plan-save-workflow/SKILL.md`
- [ ] Genera tríada dev-docs (plan.md, context.md, tasks.md)
- [ ] Crea snapshot MemTech L1

**Router Mejorado:**

- [ ] Implementar heurística multi-señal con pesos (keywords 20%, intent 30%, path 30%, content 20%)
- [ ] Threshold de activación configurable (default: 0.6)
- [ ] Carga progresiva: Nivel 1 (metadatos) → Nivel 2 (SKILL.md) → Nivel 3 (recursos)
- [ ] Logging de decisiones de activación

**skill-rules.json Inicial:**

- [ ] Configurar reglas para 5 skills base
- [ ] Keywords, intentPatterns, pathPatterns, contentPatterns definidos
- [ ] Enforcement y priority asignados
- [ ] Validar contra schema

**Gate GO:** Router activa skills correctamente en casos de prueba, recursos se cargan on-demand, 0 falsos positivos >10%

---

### Fase 2: Planning Mode Duro (1 día)

#### Tareas Concretas (Checklist)

**Slash-commands:**

- [ ] Implementar `/plan "<tarea>"` → invoca plan-architect skill
- [ ] Implementar `/plan-save` → guarda tríada + snapshot MemTech L1
- [ ] Implementar `/devdocs-update` → actualiza tríada antes de compaction
- [ ] Integrar con CLI o snippets en Cursor

**Ciclo de Vida del Plan:**

- [ ] Definir estados: DRAFT → PENDING_APPROVAL → APPROVED → EXECUTING → COMPLETED
- [ ] Implementar Plan como objeto estructurado (JSON/YAML versionado)
- [ ] Validación de esquema de Plan
- [ ] Transiciones de estado con validaciones

**Gate Obligatorio:**

- [ ] Pre-invoke hook rechaza edición/ejecución sin plan aprobado
- [ ] Mensaje claro con CTA: "Ejecuta /plan → /plan-save"
- [ ] Logging de intentos de bypass

**Tríada Dev-docs:**

- [ ] Generador automático de `plan.md` (objetivo, fases, riesgos, métricas)
- [ ] Generador automático de `context.md` (archivos clave, decisiones ADR, dependencias)
- [ ] Generador automático de `tasks.md` (checklist vivo)
- [ ] Integración con snapshot MemTech L1 al aprobar plan

**Gate GO:** No se permite edición sin plan aprobado, tríada se genera automáticamente, snapshot MemTech funciona

---

### Fase 3: Stop Hook Completo (1 día)

#### Tareas Concretas (Checklist)

**Pipeline Obligatorio:**

- [ ] Parse edit log → detectar repos tocados
- [ ] Prettier → archivos editados únicamente
- [ ] TypeCheck por repo (`tsc --noEmit`)
- [ ] Error hints (si 1-4 errores TS)
- [ ] Auto-resolver si ≥5 errores (sugerir agente auto-fix)
- [ ] Emit KPIs en `obs/kpi/events.jsonl`

**Error Hints:**

- [ ] Listar errores TS de forma clara (si 1-4 errores)
- [ ] Recordar manejo de errores (logger/Sentry, BaseController, try/catch)
- [ ] Sugerencias específicas por tipo de error

**Auto-resolver:**

- [ ] Detectar cuando hay ≥5 errores
- [ ] Invocar agente auto-fix (MCP o interno)
- [ ] Validar correcciones
- [ ] Bloquear merge si quedan errores después

**Validación "Zero Errors Left Behind":**

- [ ] Bloquear merge si quedan errores después del stop hook
- [ ] Métrica: `zero_errors_left_behind_ratio` debe ser ≥95%
- [ ] Logging de PRs que pasan/fallan

**Gate GO:** 100% de PRs de prueba pasan sin errores residuales después de stop hook

---

### Fase 4: Guardrails Multi-nivel (1-2 días)

#### Tareas Concretas (Checklist)

**Sistema de Guardrails:**

- [ ] Implementar espectro: SUGGEST → WARN → BLOCK
- [ ] Database guardrails: SUGGEST (findMany sin where), WARN (update sin where), BLOCK (deleteMany sin where)
- [ ] Mensajes educativos, no solo bloqueadores
- [ ] Logging de eventos para análisis

**Integración con Skills:**

- [ ] Guardrails como skills tipo "guardrail" con enforcement configurable
- [ ] Integrar en skill-rules.json
- [ ] Activar según patrones de contenido

**PM2 Integration:**

- [ ] Crear `scripts/pm2/ecosystem.config.cjs` con servicios definidos
- [ ] Configurar cluster mode, max_memory_restart, log rotation
- [ ] Skill `pm2-monitor` con playbooks (logs, restart, monit)
- [ ] Comandos expuestos para agente

**Playbooks de Troubleshooting:**

- [ ] Documentar en `resources/ops/troubleshooting.md`
- [ ] Comandos estándar: `pm2 logs <svc> --lines 200`, `pm2 restart <svc>`, `pm2 monit`

**Gate GO:** 0 queries inseguras en tests, guardrails educan activamente, PM2 operativo

---

### Fase 5: Pipeline ADR → Skill (2 días)

#### Tareas Concretas (Checklist)

**ADR-Miner:**

- [ ] Extraer patrones de ADRs: reglas, DoD, anti-patrones, checklists
- [ ] Parsear ADRs en `docs/adr/*.md`
- [ ] Emitir `skill-candidates.json` (dominio, triggers, checklists, scripts)

**Curator:**

- [ ] Clasificar candidatos: guideline|guardrail|workflow|analyst|generator
- [ ] Proponer description única (validada con lint)
- [ ] Detectar duplicados y consolidar

**Builder:**

- [ ] Materializar SKILL.md + resources/ + scripts/ desde candidatos
- [ ] Validar contra template y schema
- [ ] Crear estructura de directorios

**Evaluator:**

- [ ] Ejecutar 2-3 escenarios reales por skill
- [ ] Medir activación, adherencia, latencia, errores
- [ ] Emitir KPIs de evaluación

**ADR-Writer:**

- [ ] Generar ADR "Adopción Skill X" con evidencia KPI
- [ ] Incluir DoD y métricas de éxito
- [ ] Versionar skill si pasa evaluación

**Gate GO:** 2 skills generados desde ADR con ADR de adopción y KPIs válidos

---

### Fase 6: KPIs y Dashboard (1 día)

#### Tareas Concretas (Checklist)

**KPIs con Contramétricas:**

- [ ] Definir pares: velocidad (skill_activation_rate, tokens_per_operation) + calidad (skill_adherence_rate, zero_errors_left_behind)
- [ ] Implementar cálculo de métricas
- [ ] Exportar a JSONL (`obs/kpi/events.jsonl`)

**Dashboard:**

- [ ] Presentar métricas en pares (velocidad + calidad)
- [ ] Interpretación holística: "¿Vamos más rápido Y con mejor calidad?"
- [ ] Alertas cuando contramétricas degradan
- [ ] Visualización básica (texto/markdown o gráfico simple)

**CI/CD Gates:**

- [ ] Job `skills-check`: valida skill-rules.json, recursos, scripts
- [ ] Gate de merge: adherencia ≥ umbral
- [ ] Job `no-mess`: 0 errores TS después de build
- [ ] Publicar artefactos KPI

**Documentación:**

- [ ] Documentar interpretación holística de métricas
- [ ] Guía de lectura del dashboard
- [ ] Umbrales y triggers de alertas

**Gate GO:** Dashboard con KPIs en pares, gates activos en CI, interpretación holística documentada

---

## CLOOP: Observe (Métricas y Evidencia)

### Métricas Esperadas y Umbrales

#### Métricas de Activación (Velocidad)

| Métrica                      | Umbral           | Medición                                                 |
| ---------------------------- | ---------------- | -------------------------------------------------------- |
| `skill_activation_precision` | ≥ 90%            | Skills activados correctamente / Total activados         |
| `skill_activation_recall`    | ≥ 85%            | Skills relevantes activados / Total relevantes           |
| `false_positive_rate`        | < 10%            | Activaciones incorrectas / Total activaciones            |
| `tokens_per_operation`       | Reducción 15-30% | Tokens por tarea vs. baseline sin divulgación progresiva |

#### Métricas de Calidad (Contramétricas)

| Métrica                         | Umbral  | Medición                                                       |
| ------------------------------- | ------- | -------------------------------------------------------------- |
| `skill_adherence_rate`          | ≥ 80%   | Respuestas que cumplen guía activa / Total respuestas          |
| `zero_errors_left_behind_ratio` | ≥ 95%   | PRs sin errores residuales / Total PRs                         |
| `mean_fix_latency_s`            | < 5 min | Tiempo promedio desde detección hasta corrección               |
| `guardrail_effectiveness`       | ≥ 90%   | Errores preventivos / Total errores (preventivos + post-facto) |

#### Métricas de Cumplimiento

| Métrica                       | Umbral | Medición                                        |
| ----------------------------- | ------ | ----------------------------------------------- |
| `plan_approval_rate`          | 100%   | Ediciones con plan aprobado / Total ediciones   |
| `progressive_disclosure_rate` | 100%   | Recursos cargados on-demand / Total recursos    |
| `description_quality_score`   | ≥ 8/10 | Score promedio descripciones (herramienta lint) |

### Evidencia a Recolectar

#### Por Fase

1. **Fase 0**: Screenshots de hooks funcionando, logs de activación
2. **Fase 1**: Ejemplos de skills activados correctamente, recursos cargados on-demand
3. **Fase 2**: Planes aprobados bloqueando ediciones, tríadas generadas
4. **Fase 3**: PRs sin errores residuales, eventos KPI emitidos
5. **Fase 4**: Queries inseguras bloqueadas/sugeridas, PM2 logs accesibles
6. **Fase 5**: Skills generados desde ADR, ADRs de adopción creados
7. **Fase 6**: Dashboard con métricas, gates CI funcionando

#### Formato de Evento KPI (JSONL)

```json
{
  "ts": "2025-01-27T12:00:01Z",
  "repo": "skills-fabrik",
  "task": "feature-x",
  "skills": ["backend-dev-guidelines", "database-verification"],
  "activated_by": {
    "keywords": true,
    "intent_regex": false,
    "path_globs": true,
    "content_patterns": true
  },
  "adherence": true,
  "errors_ts": 0,
  "auto_resolver_used": false,
  "latency_ms": 8200,
  "tokens_total": 24500,
  "zero_errors_left_behind": true,
  "progressive_disclosure": {
    "metadata_loaded": true,
    "skill_md_loaded": true,
    "resources_loaded": 1
  }
}
```

---

## CLOOP: Reflect (Riesgos, Lecciones, Señales)

### Riesgos y Mitigaciones

#### Riesgo 1: Falsos Positivos/Negativos en Activación

- **Probabilidad**: Media
- **Impacto**: Alto
- **Mitigación**:
  - Ajustar pesos de heurística basado en feedback
  - Threshold ajustable por skill
  - Logging extenso para análisis
  - Evaluación continua con casos reales

#### Riesgo 2: Consumo Excesivo de Tokens

- **Probabilidad**: Baja
- **Impacto**: Medio
- **Mitigación**:
  - Divulgación progresiva estricta (solo metadatos inicial)
  - Cachear recursos cargados
  - Validar que SKILL.md ≤400 líneas
  - Monitorear tokens_per_operation continuamente

#### Riesgo 3: "Skill Rot" (Desalineación)

- **Probabilidad**: Media
- **Impacto**: Medio
- **Mitigación**:
  - Evaluación mensual automatizada
  - ADR de revisión periódica
  - Comparar código real vs. guías de skills
  - Actualización continua basada en uso

#### Riesgo 4: Lock-in de Proveedor

- **Probabilidad**: Baja
- **Impacto**: Alto
- **Mitigación**:
  - Contratos neutrales (JSON/TS, no específicos de LLM)
  - Scripts reutilizables (PM2, tests)
  - Abstracción de hooks (compatible con múltiples IDEs)
  - Documentación agnóstica de proveedor

#### Riesgo 5: Fricción en Developer Experience

- **Probabilidad**: Media
- **Impacto**: Alto
- **Mitigación**:
  - Guardrails educativos (no solo bloqueadores)
  - Mensajes claros y accionables
  - Auto-resolver cuando sea posible
  - Feedback continuo y ajuste rápido

### Señales de Stop/Go

#### Señales de STOP (Detener y Replanificar)

- ❌ `skill_activation_precision < 80%` por más de 3 días consecutivos
- ❌ `zero_errors_left_behind_ratio < 90%` en PRs de prueba
- ❌ Más del 15% de desarrolladores eludiendo planning mode
- ❌ Consumo de tokens aumenta >20% vs. baseline
- ❌ Bloqueos de guardrails causan >3 quejas/semana

#### Señales de GO (Continuar a Siguiente Fase)

- ✅ `skill_activation_precision ≥ 90%` en casos de prueba
- ✅ `zero_errors_left_behind_ratio = 100%` en PRs de prueba
- ✅ 100% de ediciones tienen plan aprobado (gate funcionando)
- ✅ Recursos se cargan on-demand (0 recursos en carga inicial)
- ✅ Guardrails educan sin frustrar (0 quejas, feedback positivo)

### Lecciones Aprendidas (a Documentar)

Al finalizar cada fase, documentar:

1. **Top 3 insights técnicos**: Qué funcionó bien, qué no
2. **Problemas e incidencias**: Causa raíz + mitigación aplicada
3. **Lecciones aplicables**: 3-5 lecciones para próximas fases
4. **Mejoras identificadas**: Optimizaciones para futuras iteraciones

---

## Integración con Ecosistema Existente

### MemTech (Memoria Jerárquica)

- **L1 (Working Memory)**: Snapshot de planes aprobados al cerrar ciclo
- **L2 (Context Memory)**: Índice de skills activos por tarea
- **L3 (Long-term)**: ADRs de adopción de skills, métricas históricas

### CLOOP Metodología

- **Clarify**: Este plan documenta objetivos SMART, hipótesis, criterios
- **Layout**: Arquitectura, contratos, métricas, plan de pruebas definidos
- **Operate**: Tareas concretas en checklist por fase
- **Observe**: Métricas, umbrales, evidencia a recolectar
- **Reflect**: Riesgos, mitigaciones, señales stop/go

### BMCC (Métricas Epistémicas)

- `skill_adherence_rate` → feed a S-qual (calidad de adherencia)
- `skill_activation_precision` → feed a métricas de sorpresa (cuando se activa incorrectamente)
- Guardrails educativos → correlación con reducción de drift epistémico

---

## Entregables por Fase

### Fase 0

- Estructura monorepo completa
- `skill-rules.schema.json` validado
- `SKILL.template.md` con ejemplos
- Hooks básicos operativos
- Herramienta de lint de descripciones

### Fase 1

- 5 skills base completos (SKILL.md + recursos + scripts)
- Router con carga progresiva
- `skill-rules.json` inicial configurado

### Fase 2

- Slash-commands funcionando
- Ciclo de vida del plan implementado
- Gate de bloqueo activo
- Tríada dev-docs auto-generada

### Fase 3

- Pipeline stop hook completo
- Auto-resolver integrado
- Eventos KPI emitiendo

### Fase 4

- Guardrails multi-nivel operativos
- PM2 configurado y monitoreo funcionando

### Fase 5

- Pipeline ADR → Skill completo
- Herramientas de minado/curator/builder/evaluator/writer

### Fase 6

- Dashboard de KPIs
- Gates de CI/CD activos
- Documentación de interpretación holística

---

## Validación Final (Presprint Checklist)

Al finalizar implementación, ejecutar presprint con:

### Resumen Ejecutivo

- Status: PASS/FAIL
- Duración real vs. estimada
- Artefactos entregados

### Hallazgos Clave

- Top 3 insights técnicos del proceso
- Validación de hipótesis (H1-H5)
- Métricas finales vs. umbrales

### Problemas e Incidencias

- Causa raíz de problemas encontrados
- Mitigaciones aplicadas
- Problemas no resueltos

### Lecciones Aprendidas

- 3-5 lecciones aplicables a futuros proyectos
- Patrones exitosos identificados
- Anti-patrones a evitar

### Próximos Pasos

- Acciones priorizadas (Alta/Media/Baja)
- Mejoras para próxima iteración
- Roadmap de optimización continua

---

**Status**: 📋 PLAN ACTIVO  
**Siguiente Acción**: Iniciar Fase 0 (Bootstrap)  
**Revisión**: Al finalizar cada fase según CLOOP Reflect
