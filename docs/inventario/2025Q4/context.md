# Context – Auditoría Skills Core 2025Q4

## Introducción

Este documento proporciona el contexto completo necesario para entender, ejecutar y dar continuidad a la auditoría de Skills Core 2025Q4. Incluye antecedentes del proyecto, arquitectura del repositorio, metodologías aplicadas, stakeholders involucrados y conocimiento esencial del dominio.

---

## 1. Contexto del Proyecto

### 1.1 ¿Qué es Skills Fabrik?

**Skills Fabrik** es un ecosistema de desarrollo agentico que permite:

- Activar "skills" (capacidades especializadas) mediante CLI
- Generar prompts enriquecidos para agentes IA (Claude, GPT, etc.)
- Mantener contratos formales entre componentes del sistema
- Gestionar planes de trabajo con metodología CLOOP

**Componentes principales:**

- **Router:** Orquestador de skills y gestor de sesiones
- **Daemon:** Proceso persistente para skills de larga duración
- **Skills:** Capacidades modulares con contrato `SKILL.md`
- **CLI:** Herramienta de línea de comandos (`skills-cli`)
- **Prompt Builder v2:** Generador de prompts contextualizados

### 1.2 Problema que Resuelve esta Auditoría

**Síntoma inicial:** Dificultad para localizar contratos oficiales y presencia de artefactos duplicados/obsoletos.

**Hipótesis:** La dispersión de documentos y falta de validación automatizada genera:

- Drift entre documentación y código
- Confusión sobre cuál es la versión correcta
- Riesgo de usar configuraciones obsoletas
- Deuda técnica acumulada sin visibilidad

**Objetivo de la auditoría:** Establecer Single Source of Truth y prevenir drift futuro mediante automatización.

---

## 2. Arquitectura del Repositorio

### 2.1 Estructura de Directorios

```
skills-fabrik/
├── packages/
│   ├── daemon/                    # Proceso daemon persistente
│   │   ├── src/
│   │   └── dist/
│   ├── router/                    # Orquestador principal
│   │   ├── src/
│   │   ├── scripts/
│   │   │   └── pm2/              # Configuraciones PM2
│   │   │       ├── router-ecosystem.cjs
│   │   │       └── router-ecosystem-old.cjs  ⚠️ F-001 (duplicado)
│   │   └── dist/
│   ├── skills-cli/                # CLI para activación
│   │   ├── src/
│   │   └── dist/
│   └── tools/                     # Utilidades compartidas
│
├── skills/                        # Catálogo de skills
│   ├── guidelines/
│   │   ├── backend-dev/
│   │   └── backend-dev-old/      ⚠️ F-003 (obsoleto)
│   ├── core/
│   └── registry/
│       └── index.json            # Índice de skills activos
│
├── docs/
│   ├── skills/                    # ⚠️ F-004: Solo README.md
│   │   ├── README.md
│   │   └── ROUTER-copy.md        ⚠️ F-002 (duplicado)
│   ├── API/                       # Contratos dispersos aquí
│   │   └── ROUTER.md
│   ├── inventario/
│   │   └── 2025Q4/               # 📍 Estamos aquí
│   └── processes/
│
├── scripts/                       # Scripts de automatización
│   ├── pm2/
│   └── audit/                     # A crear en FASE 5
│
├── dev/
│   └── active/
│       └── auditoria-skills-core-2025q4/
│           ├── plan.md           # Plan activo (triada)
│           ├── context.md
│           └── tasks.md
│
└── archived/                      # A crear para artefactos obsoletos
    ├── skills/
    └── pm2/
```

### 2.2 Componentes Críticos

#### Router

- **Responsabilidad:** Orquestación de skills, gestión de sesiones, routing de comandos
- **Contrato:** Debe estar en `docs/skills/ROUTER.md` (actualmente disperso)
- **Owner:** Router Lead
- **Archivos clave:**
  - `packages/router/src/index.ts`
  - `packages/router/scripts/pm2/router-ecosystem.cjs`

#### Daemon

- **Responsabilidad:** Proceso persistente para skills de larga duración
- **Contrato:** Debe estar en `docs/skills/DAEMON.md` (ausente)
- **Owner:** Daemon Lead
- **Archivos clave:**
  - `packages/daemon/src/index.ts`

#### Skills

- **Responsabilidad:** Capacidades modulares activables vía CLI
- **Contrato:** `SKILL.md` en cada directorio + contrato global en `docs/skills/SKILL-CONTRACT.md`
- **Owner:** Skills Curator
- **Registro:** `skills/registry/index.json`

#### PM2

- **Responsabilidad:** Gestión de procesos en producción
- **Configuración:** `packages/router/scripts/pm2/router-ecosystem.cjs`
- **Owner:** Router Lead

---

## 3. Metodología CLOOP

La auditoría sigue la metodología **CLOOP** (Clarify → Layout → Operate → Observe → Reflect):

### Clarify (Clarificar)

- **Qué:** Definir alcance, objetivos medibles, stakeholders, riesgos
- **Output:** Alcance documentado, criterios de éxito claros
- **En esta auditoría:** Identificar 4 dominios críticos, definir 100% cobertura como meta

### Layout (Diseñar)

- **Qué:** Diseñar arquitectura de solución, roadmap, entregables
- **Output:** Plan con fases, arquitectura de tests, quality gates
- **En esta auditoría:** 6 fases con TDD, quality gates definidos

### Operate (Ejecutar)

- **Qué:** Implementar tareas, ejecutar tests, producir entregables
- **Output:** Código, tests, documentación actualizada
- **En esta auditoría:** Consolidar contratos, eliminar duplicados, crear scripts

### Observe (Observar)

- **Qué:** Medir progreso, detectar desviaciones, actualizar métricas
- **Output:** Métricas actualizadas, hallazgos adicionales
- **En esta auditoría:** `metrics-2025-11-13.json`, seguimiento de cobertura

### Reflect (Reflexionar)

- **Qué:** Lecciones aprendidas, mejoras de proceso, cierre formal
- **Output:** Presprint con insights, backlog de mejoras
- **En esta auditoría:** `presprint.md` con lecciones y próximos pasos

---

## 4. Prompt Builder v2 (PBv2)

### 4.1 ¿Qué es PBv2?

Herramienta CLI que genera prompts enriquecidos para agentes IA, incluyendo:

- Contexto del proyecto (archivos relevantes)
- Plan activo (triada plan/context/tasks)
- Tags de conocimiento ([K:CONCEPT])
- Plantilla Startkit con metadata
- Score de calidad del prompt (0-1)

### 4.2 Flujo de Uso

```bash
# 1. Activar plan (si no existe)
node packages/skills-cli/dist/index.js plan create "nombre-plan" --v2

# 2. Generar prompt enriquecido
node packages/skills-cli/dist/index.js prompt-builder \
  "Auditor de repositorio" \
  "[Clarify] Ejecutar discovery sweep..." \
  --v2 \
  --include-template \
  --include-tags \
  --include-files \
  --include-plan-context \
  --show-score \
  > output.md

# 3. Enriquecer manualmente
# - Completar objetivos medibles
# - Añadir riesgos críticos
# - Definir criterios de éxito
# - Incluir métricas esperadas

# Score esperado: 0.72 tras enriquecimiento
```

### 4.3 Limitaciones Conocidas

⚠️ **Autocompletado limitado:** No infiere objetivos ni riesgos automáticamente  
⚠️ **Dependencia del IDE:** Requiere archivos abiertos para detectar plan activo  
⚠️ **CLI global inestable:** Usar siempre ruta local `node packages/skills-cli/dist/index.js`  
⚠️ **Parámetro incorrecto en docs:** Documentación dice `--files` pero es `--include-files`

---

## 5. Hallazgos Identificados

### F-001: Ecosistema PM2 Duplicado (P1)

**Ruta:** `packages/router/scripts/pm2/router-ecosystem-old.cjs`

**Contexto:**

- PM2 es gestor de procesos Node.js para producción
- `router-ecosystem.cjs` es la configuración activa
- Existe versión `-old` sin claridad sobre su propósito

**Riesgo:**

- Ejecución accidental del ecosistema incorrecto
- Confusión en deploys
- Mantenimiento duplicado

**Evidencia:**

```bash
$ find packages/router -name '*ecosystem*'
packages/router/scripts/pm2/router-ecosystem.cjs
packages/router/scripts/pm2/router-ecosystem-old.cjs
```

---

### F-002: Contrato ROUTER Duplicado (P1)

**Rutas:**

- `docs/skills/ROUTER-copy.md` (2025-05-10)
- `docs/API/ROUTER.md` (fecha original: 2025-04-12)

**Contexto:**

- Contrato define interfaz pública del Router
- Duplicado tiene fecha más reciente (posibles cambios no incorporados)
- Ubicación dispersa viola Single Source of Truth

**Riesgo:**

- Desarrolladores usando versión incorrecta
- Drift entre documentación y código
- Cambios válidos perdidos

**Evidencia:**

```bash
$ find docs -name '*ROUTER*.md'
docs/skills/ROUTER-copy.md
docs/API/ROUTER.md
```

---

### F-003: Skill Obsoleto (P2)

**Ruta:** `skills/guidelines/backend-dev-old/SKILL.md`

**Contexto:**

- Skill con sufijo `-old` sugiere versión obsoleta
- No está en `skills/registry/index.json`
- Existe `skills/guidelines/backend-dev/` (versión actual)

**Riesgo:**

- Confusión sobre cuál skill usar
- Ocupación de espacio innecesaria
- Mantenimiento inadvertido

**Evidencia:**

```bash
$ find skills -name 'SKILL.md' | grep old
skills/guidelines/backend-dev-old/SKILL.md
```

---

### F-004: Contratos Oficiales Ausentes (P0 - CRÍTICO)

**Ubicación esperada:** `docs/skills/`  
**Estado actual:** Solo contiene `README.md`

**Contratos esperados (ausentes):**

- ❌ `ROUTER.md` (oficial)
- ❌ `DAEMON.md`
- ❌ `SKILL-CONTRACT.md` (contrato global para skills)
- ❌ `NMLB.md` (si aplica)

**Contratos dispersos (encontrados):**

- ✅ `docs/API/ROUTER.md` (versión alternativa)
- ✅ `docs/skills/ROUTER-copy.md` (duplicado)
- ❓ DAEMON, SKILL-CONTRACT, NMLB no localizados

**Contexto:**

- `docs/skills/` debe ser SSOT para contratos
- Dispersión genera confusión y drift
- Falta de estructura estándar

**Riesgo:**

- 🚨 **Crítico:** No hay fuente de verdad para contratos
- 🚨 Imposible validar consistencia implementación vs contrato
- 🚨 Desarrolladores no saben qué documentación seguir

**Evidencia:**

```bash
$ ls docs/skills/
README.md  ROUTER-copy.md

$ find docs -name 'DAEMON.md' -o -name 'SKILL-CONTRACT.md'
# (sin resultados)
```

---

## 6. Stakeholders

### Router Lead

- **Responsabilidad:** Router, PM2, configuraciones de infraestructura
- **Hallazgos asignados:** F-001 (PM2), F-002 (ROUTER)
- **Decisiones clave:** Qué hacer con `router-ecosystem-old.cjs`, validar contrato ROUTER consolidado

### Daemon Lead

- **Responsabilidad:** Daemon, contratos de procesos persistentes
- **Hallazgos asignados:** F-004 (crear DAEMON.md)
- **Decisiones clave:** Definir contrato oficial de Daemon

### Skills Curator

- **Responsabilidad:** Catálogo de skills, registry, SKILL.md
- **Hallazgos asignados:** F-003 (skill obsoleto), F-004 (SKILL-CONTRACT.md)
- **Decisiones clave:** Política de retiro de skills obsoletos

### DocOps

- **Responsabilidad:** Documentación, estructura `docs/`, SSOT
- **Hallazgos asignados:** F-002 (duplicado ROUTER), F-004 (consolidación contratos)
- **Decisiones clave:** Estructura final de `docs/skills/`, migración de contratos

### MemTech Steward

- **Responsabilidad:** Sistema de memoria técnica, snapshots
- **Tareas:** Preservar evidencia de auditoría, snapshots pre/post
- **Decisiones clave:** Cuándo guardar snapshots, formato de logs

---

## 7. Tecnologías y Herramientas

### Stack Principal

- **Runtime:** Node.js (≥18)
- **Gestor de paquetes:** pnpm (workspaces)
- **Lenguajes:** TypeScript, JavaScript
- **Gestor de procesos:** PM2
- **Testing:** Vitest (recomendado) o Jest
- **CI/CD:** GitHub Actions

### Herramientas de Auditoría

```bash
# Búsqueda de archivos
find <path> -name '<pattern>'
find . -type f -name '*.md'

# Búsqueda de contenido
rg <pattern> <path>                    # ripgrep (más rápido que grep)
rg -n "(old|copy|backup)" --glob '!node_modules/*'

# Comparación de archivos
diff file1.md file2.md
diff -u file1.md file2.md              # Formato unificado

# Listado de árboles
tree -L 2 -I 'node_modules|dist'

# Git para evidencia
git log --oneline --follow <file>
git diff <file1> <file2>
```

### Scripts de Auditoría (a crear en FASE 5)

```bash
# Verificación de contratos
pnpm audit:contracts

# Detección de obsoletos
pnpm audit:obsolete

# Validación de registry
pnpm audit:registry

# Auditoría completa
pnpm audit:all
```

---

## 8. Insumos Generados

### Archivos Raw (Evidencia Primaria)

```
docs/inventario/2025Q4/
├── raw-files-packages.txt          # Listado de archivos en packages/
├── raw-skills.txt                  # Listado de SKILL.md
├── rg-content-20251113-1237.txt    # Búsqueda de patrones sospechosos
└── rg-filenames-20251113-1237.txt  # Archivos con sufijos old/copy/backup
```

**Comandos usados:**

```bash
find packages -type f > raw-files-packages.txt
find skills -name 'SKILL.md' > raw-skills.txt
rg -n "(old|copy|backup|deprecated)" > rg-content.txt
rg --files -g '*old*' > rg-filenames.txt
```

### Prompts PBv2 Generados

```
docs/inventario/2025Q4/outputs/
├── discovery-20251113-filled.md           # Prompt de discovery (enriquecido)
└── contract-consistency-20251113-filled.md # Prompt de contratos (enriquecido)
```

### Documentos de Trabajo

```
docs/inventario/2025Q4/
├── hallazgos.json                   # Hallazgos estructurados
├── acciones.md                      # Tabla de remediación
├── metrics-2025-11-13.json          # Métricas de progreso
├── skills-core-inventario.md        # Narrativa del inventario
└── presprint.md                     # Cierre y lecciones (pendiente)
```

---

## 9. Conceptos Clave del Dominio

### Single Source of Truth (SSOT)

- **Principio:** Una única fuente autorizada para cada pieza de información
- **En Skills Fabrik:** `docs/skills/` debe ser SSOT para contratos
- **Anti-patrón:** Contratos dispersos en múltiples ubicaciones

### Contrato (Contract)

- **Definición:** Documento formal que define interfaz pública de un componente
- **Contenido:** API, formatos, protocolos, versionado, ejemplos
- **Ubicación:** `docs/skills/<COMPONENT>.md`
- **Metadata requerida:**
  ```yaml
  ---
  version: 1.4.0
  date: 2025-11-13
  owner: Component Lead
  status: active
  ---
  ```

### Drift

- **Definición:** Divergencia entre documentación y código
- **Causas:** Falta de sincronización, múltiples fuentes de verdad
- **Prevención:** Tests automatizados, quality gates, auditorías periódicas

### Artefacto Obsoleto

- **Identificadores:** Sufijos `-old`, `-copy`, `-backup`, `-deprecated`
- **Riesgo:** Uso inadvertido, confusión sobre versión correcta
- **Gestión:** Política de retiro (archivar o eliminar) con evidencia

### Triada de Plan

- **Componentes:** `plan.md`, `context.md`, `tasks.md`
- **Propósito:** Contexto completo para PBv2 y continuidad de trabajo
- **Ubicación:** `dev/active/<plan-id>/`

### Quality Gate

- **Definición:** Validación automatizada que debe pasar antes de merge
- **Ejemplos:**
  - Tests con cobertura ≥80%
  - Cero contratos duplicados
  - Cero artefactos con sufijos sospechosos
- **Implementación:** Pre-commit hooks, CI/CD pipelines

---

## 10. Métricas y KPIs

### Métricas de Auditoría

```json
{
  "files_scanned": 524,
  "skills_reviewed": 68,
  "contracts_reviewed": 7,
  "hallazgos": {
    "critical": 1, // F-004
    "high": 2, // F-001, F-002
    "medium": 1, // F-003
    "info": 0
  }
}
```

### KPIs de Éxito

**Técnicos:**

- ✅ Test coverage: ≥80%
- ✅ Contratos duplicados: 0
- ✅ Artefactos obsoletos: 0
- ✅ Skills sin registro: 0
- ✅ Quality gates activos: 100%

**De Proceso:**

- ✅ Tiempo de auditoría automatizada: ≤2h
- ✅ Tiempo de remediación P0: ≤8h
- ✅ Hallazgos con owner asignado: 100%

**De Calidad:**

- ✅ Incidentes por contratos desactualizados: 0 (90 días post-remediación)
- ✅ Nuevos contratos siguiendo estándar: 100%
- ✅ Drift detection activo: Sí

---

## 11. Glosario

| Término          | Definición                                                 |
| ---------------- | ---------------------------------------------------------- |
| **CLOOP**        | Metodología Clarify → Layout → Operate → Observe → Reflect |
| **PBv2**         | Prompt Builder v2 - Generador de prompts contextualizados  |
| **SSOT**         | Single Source of Truth - Fuente única de verdad            |
| **TDD**          | Test-Driven Development - Desarrollo guiado por tests      |
| **Quality Gate** | Validación automatizada pre-merge                          |
| **Drift**        | Divergencia entre documentación y código                   |
| **Triada**       | Conjunto plan.md + context.md + tasks.md                   |
| **Hallazgo**     | Issue identificado durante auditoría                       |
| **Presprint**    | Documento de cierre con lecciones aprendidas               |
| **MemTech**      | Sistema de memoria técnica (snapshots)                     |
| **Skill**        | Capacidad modular activable vía CLI                        |
| **Router**       | Componente orquestador principal                           |
| **Daemon**       | Proceso persistente de larga duración                      |
| **PM2**          | Gestor de procesos Node.js                                 |
| **Registry**     | Índice de skills activos                                   |

---

## 12. Dependencias y Prerequisitos

### Para ejecutar la remediación:

```bash
# 1. Clonar repositorio (si no está clonado)
git clone <repo-url> skills-fabrik
cd skills-fabrik

# 2. Instalar dependencias
pnpm install --frozen-lockfile

# 3. Compilar paquetes
pnpm -w build

# 4. Verificar CLI funciona
node packages/skills-cli/dist/index.js --help

# 5. Ejecutar tests existentes (baseline)
pnpm test

# 6. Revisar plan activo
cat dev/active/auditoria-skills-core-2025q4/plan.md
```

### Accesos necesarios:

- ✅ Repositorio Git (lectura/escritura)
- ✅ Permisos para crear branches
- ✅ Acceso a stakeholders (Router Lead, DocOps, etc.)
- ✅ CI/CD (GitHub Actions o equivalente)
- ⚠️ Opcional: MemTech (si se implementan snapshots)

---

## 13. Referencias y Documentación

### Documentos de esta Auditoría

- **Informe técnico:** `informe-activacion-skills.md`
- **Plan de remediación:** `plan.md` (este documento hermano)
- **Tareas detalladas:** `tasks.md` (este documento hermano)
- **Hallazgos:** `hallazgos.json`
- **Acciones:** `acciones.md`
- **Métricas:** `metrics-2025-11-13.json`

### Documentación Externa

- Skills Fabrik README: `../../README.md`
- Router README: `../../packages/router/README.md`
- Daemon README: `../../packages/daemon/README.md`
- Skills Registry: `../../skills/registry/index.json`

### Lecciones de Auditorías Anteriores

(A completar si existen auditorías previas)

---

## 14. Notas para Continuidad

### Si retomas este trabajo después:

1. **Lee primero:**
   - Este `context.md`
   - `plan.md` para entender fases
   - `tasks.md` para ver siguiente tarea

2. **Verifica estado actual:**

   ```bash
   cat hallazgos.json | jq '.findings[] | select(.status=="pending")'
   cat acciones.md | grep pending
   git log --oneline --since="2025-11-13"
   ```

3. **Actualiza métricas:**

   ```bash
   # Antes de continuar
   cp metrics-2025-11-13.json metrics-$(date +%Y-%m-%d).json
   # Actualiza progress en el nuevo archivo
   ```

4. **Consulta stakeholders:**
   - Router Lead: Decisiones sobre PM2 y ROUTER
   - DocOps: Estructura de docs/skills/
   - Skills Curator: Gestión de skills obsoletos

### Si algo no está claro:

1. Busca en evidencia: `raw-*.txt`, `rg-*.txt`
2. Revisa prompts generados: `outputs/discovery-*.md`
3. Consulta hallazgos: `hallazgos.json`
4. Pregunta a stakeholders (ver sección 6)

---

## 15. Changelog de este Documento

| Fecha      | Autor             | Cambio                                              |
| ---------- | ----------------- | --------------------------------------------------- |
| 2025-11-13 | Technical Auditor | Creación inicial con contexto completo de auditoría |

---

**Nota final:** Este documento es parte de la triada (plan.md, context.md, tasks.md) y debe mantenerse actualizado conforme avanza el proyecto. Cualquier decisión importante debe documentarse aquí para facilitar continuidad y onboarding de nuevos colaboradores.
