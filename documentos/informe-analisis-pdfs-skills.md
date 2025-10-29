# Informe: Análisis de Investigaciones sobre Skills y Ecosistema de Desarrollo Agéntico

## Fecha de Análisis

2025-01-27

## Resumen Ejecutivo

Este informe sintetiza tres investigaciones profundas sobre el ecosistema de desarrollo agéntico, con especial énfasis en Agent Skills, hooks, planning mode, guardrails, PM2 y KPIs. El objetivo es mejorar nuestro entendimiento de las Skills y refinar el plan de implementación del "skill-fabric".

---

## PDF 1: Análisis del Ecosistema de Desarrollo Agéntico de Anthropic

### Hallazgos Clave

#### 1. Filosofía de Diseño de Claude Code

- **Herramienta "de bajo nivel y sin opiniones preconcebidas"**: Acceso directo a capacidades sin flujos rígidos
- **Bucle agéntico**: Utiliza comandos bash estándar (grep, find, tail) para "búsqueda agéntica" transparente
- **Iteración continua**: Escribe → ejecuta → analiza errores → edita → repite

#### 2. Arquitectura de Agent Skills

**Anatomía de un Skill:**

- Directorio con `SKILL.md` (núcleo) + recursos opcionales
- Frontmatter YAML obligatorio: `name` (máx 64 chars, slug), `description` (crítico para descubribilidad)
- Campo `when_to_use` observado pero no documentado → incorporar en `description`

**Divulgación Progresiva (3 niveles):**

1. **Nivel 1 (Metadatos)**: Solo `name` y `description` en prompt del sistema
2. **Nivel 2 (Instrucciones)**: Si relevante, carga cuerpo completo del `SKILL.md` vía bash
3. **Nivel 3 (Recursos)**: Archivos adicionales se cargan on-demand según referencias

**Seguridad:**

- Ejecución en sandbox (máquina virtual aislada)
- Invocación vía bash (no API especial)
- Solo stdout/stderr entra al contexto (código de scripts nunca)
- Auditoría exhaustiva requerida antes de usar skills

#### 3. Mejores Prácticas

**Primacía de `name` y `description`:**

- `description` es la señal principal de activación
- Debe ser orientada a acción, clara sobre cuándo usar y NO usar
- Monitorear comportamiento real e iterar

**Skills vs Tools:**

- **Tools**: Operaciones discretas, síncronas (get_weather, cancel_subscription)
- **Skills**: Guían workflows complejos multi-paso, inyectan contexto/procedimientos

#### 4. Metodologías Probadas

**Flujo "Explorar → Planificar → Codificar → Confirmar":**

- Explorar base de código primero
- Formular plan antes de código
- Validación explícita al final

**TDD con Agentes:**

1. Escribir pruebas que fallen
2. Commit de pruebas
3. Implementar código
4. Iterar hasta pasar
5. Commit de implementación

---

## PDF 2: Marco Arquitectónico para Automatización Inteligente

### Hallazgos Clave

#### 1. Convergencia de Skills, Tools y Plugins

**Patrón Arquitectónico Común:**

- Todos usan "tool calling" / "function calling"
- Prompt del sistema aumenta con nombres y descripciones
- LLM decide cuándo invocar basándose en la descripción

**Contrato Semántico Crítico:**

- **Nombre, descripción y parámetros** son lo que el LLM razona
- La calidad de la descripción impacta directamente en la selección correcta
- El lenguaje natural es la interfaz principal entre "cerebro" y "manos"

**Divulgación Progresiva:**

- Ejemplo paradigmático: Anthropic (3+ niveles)
- Evita sobrecargar ventana de contexto

**Dos Tipos de Skills:**

1. **Procedurales** (SKILL.md): Enseñan cómo pensar sobre un problema
2. **Ejecutables** (Tools/Plugins): Acciones concretas deterministas

#### 2. Hooks de Automatización

**Espectro de Latencia y Aplicación:**

- IDE hooks (milisegundos) → forma más débil
- Pre-commit (segundos) → más fuerte, pero eludible
- Pre-push (minutos) → robusto, aún eludible
- CI/CD gates (minutos-horas) → más fuerte, no eludible

**Distribución Escalonada:**

- IDE: autoformateo
- Pre-commit: linting, escaneo de secretos
- Pre-push: pruebas unitarias críticas
- CI: suite completa, SAST, SCA

**Fusión con Skills:**

- Hooks tradicionales → herramientas deterministas
- Hooks emergentes → activan agentes con skills
- **Hooks son sensores, Skills son actuadores**

#### 3. Planning Mode y Aprobación Humana

**Arquitecturas:**

- **ReAct**: Bucle iterativo (pensar → actuar → observar → repetir)
- **Plan-and-Execute**: Separación explícita planificación/ejecución
- **Plan-and-Act**: Híbrido con replanificación sobre retroalimentación

**Plan como Artefacto de Primera Clase:**

- Objeto estructurado: inspeccionable, aprobable, serializable, auditable
- Ciclo de vida: DRAFT → PENDING_APPROVAL → APPROVED → EXECUTING → COMPLETED
- Esquema definido, versionado

#### 4. Guardrails Sistémicos

**Espectro de Aplicación:**

- BLOCK: Bloqueo duro (OPA en CI/CD, Prisma para comandos destructivos)
- WARN: Advertencia con sugerencia
- SUGGEST: Retroalimentación educativa proactiva

**Ejemplo Inteligente:**

- "Veo que intentas eliminar todos los usuarios. ¿Querías añadir una cláusula WHERE para acotar esto a un tenant específico?"
- Enseña mejores prácticas, no solo previene errores

**Política como Código (OPA):**

- Desacopla toma de decisiones de su aplicación
- Políticas en Rego (lenguaje declarativo)

#### 5. PM2 y Observabilidad

**Características Clave:**

- Auto-restart, cluster mode, gestión de logs, monitoreo
- `@pm2/io` para métricas personalizadas
- Integración con Prometheus/Grafana

**KPIs Necesitan Fuentes de Datos:**

- PM2 proporciona instrumentación para "tokens/op", "mean-fix-latency"
- Servicios de backend deben emitir métricas personalizadas

#### 6. KPIs DORA y Extendidos

**DORA (4 métricas):**

- Velocidad: Frecuencia de Despliegue, Tiempo de Entrega
- Estabilidad: Tasa de Fallo, MTTR

**KPIs de Impacto de IA:**

- Utilización: Tasa de Adopción, Ratio DAU/WAU, Mix de Características
- Impacto: Delta de Rendimiento PR, Reducción de Tiempo, Confianza en Mantenibilidad

**Principio de Contramétricas:**

- Siempre medir velocidad Y calidad
- Presentar métricas en pares/grupos
- Evitar incentivos perversos

---

## PDF 3: Plan Ejecutable para "Skill Fabric"

### Hallazgos Clave

#### 1. Arquitectura Propuesta

**Estructura del Repo Global `skill-fabric/`:**

```
packages/
  ├─ skills-cli/       # init/lint/pack/install/list/run/mine
  ├─ router/          # pre-invoke + stop hooks
  ├─ mcp-adapters/    # fs, git, pm2, metrics
  └─ kpi/             # JSONL/Prometheus events

skills/               # Biblioteca canónica
registry/             # Índices compilados
configs/              # Schemas, templates, repos.yaml
```

**Skill Auto-activación:**

- Match heurístico: keywords, intent regex, path globs, content patterns
- Inyecta nota compacta: "🎯 Skill Activation Check"
- Carga progresiva: metadatos → SKILL.md → recursos on-demand

**No-mess-left-behind (Stop Hook):**

1. Prettier → archivos editados
2. Typecheck/build por repo afectado
3. Hints de manejo de errores
4. Auto-resolver opcional (si ≥N errores)
5. KPIs → events.jsonl

#### 2. Pipeline ADR → Skill

**Minado Multi-repo:**

- ADR-Miner: extrae reglas, DoD, anti-patrones, checklists
- Pattern-Miner: busca "smells" y convenciones en código
- Curator: deduplica, clasifica (guideline|guardrail|workflow|analyst|generator)
- Builder: materializa SKILL.md + resources + scripts
- Evaluator: escenarios reales, KPIs

#### 3. Biblioteca Mínima de Skills

**Workflows/Generators:**

- plan-architect, plan-save-workflow, testing-plan-designer, pm2-monitor

**Guidelines:**

- frontend-dev-guidelines, backend-dev-guidelines, api-contracts-guidelines

**Guardrails:**

- database-verification (block), secrets-and-config (require), migration-safety (require)

**Analysts:**

- repo-auditor, pr-reviewer, test-scaffolder, error-fixer, dep-risk-advisor, dead-code-pruner

#### 4. Planning Mode Duro

- Slash-commands: `/plan`, `/plan-save`, `/devdocs-update`
- Pre-hook bloquea ejecución sin plan aprobado
- Tríada: `plan.md`, `context.md`, `tasks.md`

---

## Insights Críticos para Nuestro Plan

### 1. Descripción es TODO

**Hallazgo común en los 3 PDFs:**

- El campo `description` es la señal principal de activación
- La calidad de la descripción determina la efectividad del skill
- Debe ser orientada a acción, clara sobre cuándo usar/NO usar

**Impacto en nuestro plan:**

- Crear herramienta de validación de descripciones (lint)
- Requerir revisión por pares de descripciones
- Incluir ejemplos en plantilla SKILL.md

### 2. Divulgación Progresiva es Fundamental

**Por qué importa:**

- Reduce tokens y latencia
- Escala a bibliotecas grandes
- Mejora foco contextual

**Implementación:**

- Solo metadatos (name + description) siempre visible
- SKILL.md se carga cuando hay match fuerte
- Recursos se cargan on-demand según referencias explícitas

### 3. Hooks y Skills son Inseparables

**Paradigma emergente:**

- Hooks = sistema sensorial (detectan eventos)
- Skills = actuadores (ejecutan acciones)
- Router = conecta hooks con skills

**Arquitectura:**

- Pre-invoke hook → detecta intención/ruta/contenido → activa skills
- Stop hook → validaciones post-respuesta → sugiere skills de corrección

### 4. Plan Mode como Gate Obligatorio

**Enfoque "duro":**

- Sin plan aprobado → NO se permite edición/ejecución
- Plan es artefacto estructurado con ciclo de vida
- Integración con CLOOP natural

### 5. Guardrails en Espectro (BLOCK/WARN/SUGGEST)

**No todo debe ser bloqueo binario:**

- BLOCK: Acciones destructivas sin confirmación
- WARN: Acciones riesgosas que requieren atención
- SUGGEST: Mejores prácticas educativas

**Ejemplo:**

- Database query sin WHERE → SUGGEST primero ("¿Querías filtrar por tenant?")
- Si persiste → WARN
- Si es DELETE sin WHERE → BLOCK

### 6. KPIs Requieren Contramétricas

**Principio:**

- Siempre medir velocidad Y calidad
- Presentar métricas en pares
- Evitar incentivos perversos

**Métricas propuestas:**

- skill_activation_recall/precision
- skill_adherence_rate
- zero_errors_left_behind
- mean_fix_latency
- tokens_per_operation

---

## Recomendaciones Concretas para el Plan

### 1. Estructura de Skills (Alta Prioridad)

```markdown
skills/<domain>/<skill-id>/
├─ SKILL.md # ≤400 líneas, YAML frontmatter
├─ resources/ # On-demand
│ ├─ reference.md
│ ├─ examples.md
│ └─ checklist.md
├─ scripts/ # Ejecutables en sandbox
│ └─ validate.sh
└─ tests/ # Smoke tests
```

**Criticidad:** ALTA - Define la base de todo el sistema

### 2. Skill Router con Matchers Múltiples

**Heurística de activación:**

```typescript
interface SkillMatch {
  score: number;
  reasons: string[];
  activated: boolean;
}

// Combinar múltiples señales:
- keywords match (weight: 0.2)
- intent regex match (weight: 0.3)
- path glob match (weight: 0.3)
- content pattern match (weight: 0.2)

// Threshold: score >= 0.6 → activar
```

**Criticidad:** ALTA - Determina efectividad del sistema

### 3. Stop Hook Completo

**Pipeline obligatorio:**

```
1. Parse edit log → detectar repos tocados
2. Prettier → archivos editados
3. TypeCheck por repo (tsc --noEmit)
4. Error hints (si 1-4 errores TS)
5. Auto-resolver si ≥5 errores
6. Emit KPIs
```

**Criticidad:** ALTA - Garantiza "zero-errors-left-behind"

### 4. Sistema de Guardrails Multi-nivel

**Implementación sugerida:**

```json
{
  "database-verification": {
    "type": "guardrail",
    "enforcement": "block",
    "rules": {
      "findMany_without_where": { "level": "suggest" },
      "update_without_where": { "level": "warn" },
      "deleteMany_without_where": { "level": "block" }
    }
  }
}
```

**Criticidad:** ALTA - Prevención de errores catastróficos

### 5. Pipeline ADR → Skill Automatizado

**Flujo:**

1. ADR-Miner → extrae patrones
2. Curator → clasifica y estructura
3. Builder → materializa SKILL.md + recursos
4. Evaluator → valida con escenarios reales
5. Writer → genera ADR de adopción

**Criticidad:** MEDIA - Escalabilidad del sistema

### 6. KPIs con Contramétricas

**Dashboard sugerido:**

```
Métricas de Velocidad:
- skill_activation_rate (+)
- tokens_per_operation (-)

Contramétricas:
- skill_adherence_rate (+)
- zero_errors_left_behind (+)
```

**Criticidad:** MEDIA - Medición de efectividad

---

## Mejoras al Plan Original

### Cambios Recomendados

#### 1. Enfatizar Divulgación Progresiva

- **Antes:** "SKILL.md ligero (300-400 líneas)"
- **Ahora:** "SKILL.md ≤400 líneas + recursos on-demand con carga diferida de 3 niveles"

#### 2. Priorizar Calidad de Descripciones

- **Antes:** Descripción mencionada de pasada
- **Ahora:** Herramienta de validación obligatoria, revisión por pares, plantilla con ejemplos

#### 3. Guardrails en Espectro

- **Antes:** "block" o "suggest"
- **Ahora:** BLOCK/WARN/SUGGEST con criterios específicos por tipo de operación

#### 4. Plan Mode como Artefacto Estructurado

- **Antes:** Plan como documento markdown simple
- **Ahora:** Plan con ciclo de vida (DRAFT → APPROVED → EXECUTING), esquema versionado

#### 5. KPIs con Contexto de Contramétricas

- **Antes:** Lista de KPIs
- **Ahora:** KPIs en pares (velocidad + calidad), con interpretación holística

#### 6. Integración Hooks + Skills Explícita

- **Antes:** Hooks y Skills como componentes separados
- **Ahora:** Hooks como sensores, Skills como actuadores, Router como orquestador

---

## Checklist de Validación del Plan

### Fase 0: Bootstrap

- [ ] `SKILL.template.md` con YAML frontmatter completo
- [ ] `skill-rules.schema.json` validado
- [ ] Pre-invoke hook muestra "Skill Activation Check"
- [ ] Stop hook formatea y compila

### Fase 1: Skills Base

- [ ] 5 skills base creados con divulgación progresiva
- [ ] `description` de cada skill validada (herramienta de lint)
- [ ] Router activa skills correctamente en casos de prueba
- [ ] Recursos se cargan on-demand según referencias

### Fase 2: Planning Mode

- [ ] Plan mode bloquea edición sin plan aprobado
- [ ] Plan tiene ciclo de vida estructurado
- [ ] Tríada dev-docs se genera automáticamente
- [ ] Snapshot en MemTech (L1) al aprobar plan

### Fase 3: Stop Hook Completo

- [ ] Prettier → TypeCheck → Hints funcionando
- [ ] Auto-resolver activa si ≥5 errores
- [ ] "Zero-errors-left-behind" = 100% en PRs de prueba
- [ ] KPIs se emiten en events.jsonl

### Fase 4: Guardrails Multi-nivel

- [ ] Database guardrails: SUGGEST → WARN → BLOCK
- [ ] PM2 playbooks operativos
- [ ] 0 queries inseguras en tests
- [ ] Guardrails educan, no solo previenen

### Fase 5: Pipeline ADR → Skill

- [ ] ADR-Miner extrae patrones correctamente
- [ ] Curator clasifica skills (guideline|guardrail|workflow|analyst|generator)
- [ ] Builder materializa SKILL.md + recursos
- [ ] Evaluator valida con escenarios reales
- [ ] ADR-Writer genera ADR de adopción

### Fase 6: KPIs y Dashboard

- [ ] Métricas en pares (velocidad + calidad)
- [ ] Dashboard muestra contramétricas
- [ ] Gates en CI validan adherencia
- [ ] Interpretación holística documentada

---

## Referencias Clave

### PDF 1

- Divulgación progresiva (3 niveles)
- Primacía de `description` para descubribilidad
- Ejecución en sandbox via bash
- Flujo "Explorar → Planificar → Codificar → Confirmar"

### PDF 2

- Hooks como espectro de latencia/aplicación
- Plan como artefacto estructurado con ciclo de vida
- Guardrails en espectro (BLOCK/WARN/SUGGEST)
- KPIs con contramétricas

### PDF 3

- Arquitectura skill-fabric completa
- Pipeline ADR → Skill automatizado
- Biblioteca mínima de skills categorizados
- Integración con CLOOP/BMCC/MemTech

---

## Conclusión

Los tres PDFs proporcionan una base sólida y complementaria:

1. **PDF 1** establece la filosofía y arquitectura de Skills (Anthropic)
2. **PDF 2** amplía con patrones arquitectónicos y límites (aplicable a cualquier ecosistema)
3. **PDF 3** proporciona un plan ejecutable específico para nuestro contexto

**Insight principal:** Las Skills no son solo "plugins", son **sistemas de conocimiento procedimental modulares** que requieren:

- Descripciones de alta calidad
- Carga progresiva inteligente
- Integración profunda con hooks
- Medición holística (velocidad + calidad)
- Guardrails educativos, no solo bloqueadores

**Próximos pasos inmediatos:**

1. Validar/mejorar `description` de skills existentes
2. Implementar divulgación progresiva en router
3. Diseñar guardrails multi-nivel (BLOCK/WARN/SUGGEST)
4. Estructurar Plan Mode con ciclo de vida
5. Configurar KPIs con contramétricas

---

**Documento generado:** 2025-01-27
**Autor del análisis:** Asistente IA
**Fuentes:** 3 PDFs en carpeta `investigaciones/`
