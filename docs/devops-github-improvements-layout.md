# CLOOP Phase: Layout - Arquitectura MVP Ejecutable

**Fecha**: 2025-10-29  
**Fase**: Layout  
**Status**: ✅ COMPLETADO

---

## 1. Arquitectura Mínima

### Sistema de Workflows por Fases

```
.github/
├── dependabot.yml          # Fase 1.1: Automatización de dependencias
├── CODEOWNERS              # Fase 2.1: Code review requirements
├── pull_request_template.md # Fase 2.2: Template mejorado
├── ISSUE_TEMPLATE/
│   ├── config.yml          # Fase 2.3: Issue templates config
│   ├── bug_report.yml      # Template de bugs
│   └── feature_request.yml # Template de features
└── workflows/
    ├── stale.yml           # Fase 1.2: Stale issues/PRs
    ├── no-response.yml     # Fase 1.3: No response automation
    ├── ci.yml              # Mejoras incrementales (concurrency)
    └── security.yml        # Mejoras incrementales (CodeQL avanzado)
```

### Principios de Diseño

1. **Incremental**: Implementación por fases, testing continuo
2. **No-breaking**: Compatible con workflows existentes
3. **Configurable**: Permite ajustes sin modificar código
4. **Documentado**: Cada componente con casos de uso claros

---

## 2. Interfaces/Contratos

### 2.1 Dependabot Contract

**Archivo**: `.github/dependabot.yml`

**Contrato**:

```yaml
version: 2
updates:
  - package-ecosystem: 'npm'
    directory: '/'
    schedule:
      interval: 'daily'
    target-branch: 'main'
    commit-message:
      prefix: 'chore(deps)'
      include: 'scope'
    groups:
      npm-minor-patch:
        applies-to: 'version-updates'
        update-types:
          - 'minor'
          - 'patch'
    open-pull-requests-limit: 5

  - package-ecosystem: 'github-actions'
    directory: '/'
    schedule:
      interval: 'daily'
    target-branch: 'main'
    commit-message:
      prefix: 'chore(deps)'
      include: 'scope'
    open-pull-requests-limit: 3
```

**Validación**:

- ✅ YAML válido
- ✅ Actualiza npm y github-actions
- ✅ Agrupa minor/patch
- ✅ Major updates separados

---

### 2.2 Stale Bot Contract

**Archivo**: `.github/workflows/stale.yml`

**Contrato**:

```yaml
Input:
  - Issues/PRs sin actividad >60 días

Processing:
  - Agregar label 'stale'
  - Comentar mensaje automático
  - Esperar 14 días adicionales

Output:
  - Cerrar issue/PR si no hay respuesta

Exclusions:
  - Labels: 'pinned', 'security'
  - Issues con comentarios recientes
```

**Validación**:

- ✅ Ejecuta en schedule (diario 1:30 AM UTC)
- ✅ Detecta issues/PRs >60 días
- ✅ Excluye labels específicos
- ✅ Comenta y cierra automáticamente

---

### 2.3 No Response Contract

**Archivo**: `.github/workflows/no-response.yml`

**Contrato**:

```yaml
Input:
  - Issues/PRs con label 'status/need-information'
  - Sin respuesta >14 días

Processing:
  - Verificar label presente
  - Verificar última actividad

Output:
  - Cerrar issue/PR con mensaje automático
```

**Validación**:

- ✅ Detecta label 'status/need-information'
- ✅ Espera 14 días sin respuesta
- ✅ Cierra con mensaje apropiado

---

### 2.4 CODEOWNERS Contract

**Archivo**: `.github/CODEOWNERS`

**Contrato**:

```
Format: <pattern> <@team/owner>

Required Reviews:
  - .github/workflows/ → @maintainers
  - package.json → @maintainers
  - pnpm-lock.yaml → @maintainers
  - SECURITY.md → @maintainers
  - LICENSE → @maintainers
  - packages/*/package.json → @maintainers

Default:
  * @maintainers
```

**Validación**:

- ✅ GitHub detecta archivo automáticamente
- ✅ Requiere reviews para paths definidos
- ✅ Bloquea merges sin approval

---

### 2.5 PR Template Contract

**Archivo**: `.github/pull_request_template.md`

**Contrato**:

```markdown
Required Sections:

1. TLDR - Resumen breve
2. Dive Deeper - Detalles técnicos
3. Reviewer Test Plan - Cómo validar
4. Testing Matrix - Cross-platform (🍏 🪟 🐧)
5. Linked Issues - Referencias a issues

Optional:

- Breaking Changes
- Migration Guide
```

**Validación**:

- ✅ Template aparece en PR body
- ✅ Secciones claramente marcadas
- ✅ Testing matrix completo

---

### 2.6 Issue Templates Contract

**Archivos**: `.github/ISSUE_TEMPLATE/*.yml`

**Contrato**:

```yaml
# bug_report.yml
name: Bug Report
description: Report a bug
body:
  - type: textarea
    id: description
    label: Description
  - type: textarea
    id: steps
    label: Steps to Reproduce
  - type: textarea
    id: expected
    label: Expected Behavior

# feature_request.yml
name: Feature Request
description: Suggest a feature
body:
  - type: textarea
    id: problem
    label: Problem Statement
  - type: textarea
    id: solution
    label: Proposed Solution
```

**Config Contract**:

```yaml
# config.yml
blank_issues_enabled: false
contact_links:
  - name: Questions
    url: https://github.com/org/repo/discussions
    about: Ask questions here
```

**Validación**:

- ✅ Templates aparecen en UI de GitHub
- ✅ Fields validados automáticamente
- ✅ Config redirige a discussions

---

## 3. Métricas a Recolectar (Observe)

### Fase 1 - Automatización

| Métrica                        | Definición                                     | Umbral Éxito           | Método Recolección                                                 |
| ------------------------------ | ---------------------------------------------- | ---------------------- | ------------------------------------------------------------------ |
| `dependabot_pr_rate`           | PRs creados por dependabot/día                 | ≥ 2/semana             | `gh pr list --author "app/dependabot"`                             |
| `stale_issues_closed`          | Issues cerrados por stale bot/semana           | ≥ 5/semana (after 30d) | `gh issue list --label "stale" --state "closed"`                   |
| `no_response_closed`           | Issues/PRs cerrados por falta respuesta/semana | ≥ 2/semana             | `gh issue list --label "status/need-information" --state "closed"` |
| `maintenance_time_saved_hours` | Horas ahorradas vs manual                      | ≥ 2h/semana            | Estimación basada en PRs/issues gestionados                        |

### Fase 2 - Estructura

| Métrica                       | Definición                                 | Umbral Éxito       | Método Recolección                           |
| ----------------------------- | ------------------------------------------ | ------------------ | -------------------------------------------- |
| `pr_template_usage_rate`      | % PRs usando template completo             | ≥ 90%              | Analizar PR body por secciones               |
| `issue_template_usage_rate`   | % issues usando templates                  | ≥ 80%              | Verificar formato YAML en body               |
| `codeowners_review_rate`      | % PRs que requieren CODEOWNERS approval    | 100% para críticos | `gh pr view --json reviewsRequiredBy`        |
| `template_completeness_score` | Score promedio completitud templates (0-1) | ≥ 0.7              | Análisis automático de secciones completadas |

### Fase 3 - CI/CD Avanzado (Futuro)

| Métrica                    | Definición                            | Umbral Éxito | Método Recolección                |
| -------------------------- | ------------------------------------- | ------------ | --------------------------------- |
| `e2e_test_coverage`        | % plataformas cubiertas por E2E tests | ≥ 80%        | Conteo de jobs en matrix          |
| `release_success_rate`     | % releases exitosos sin rollback      | ≥ 95%        | Tracking de releases vs rollbacks |
| `codeql_findings_rate`     | Security findings por scan            | Trend ↓      | CodeQL API                        |
| `ci_pipeline_success_rate` | % workflows completando como success  | ≥ 95%        | GitHub Actions API                |

---

## 4. Plan de Pruebas (Inputs/Outputs)

### Prueba 1: Dependabot Activation

**Input**:

- Repositorio con `package.json` con dependencias npm desactualizadas
- Push a branch `main`
- Dependabot habilitado

**Output Esperado**:

1. Dependabot crea PR con prefijo `chore(deps)` para updates disponibles
2. PR agrupa minor/patch updates en un solo PR
3. PRs de major version updates son separados
4. PR incluye changelog y información de versiones

**Verificación**:

```bash
gh pr list --author "app/dependabot" --limit 1 --json number,title
# Debe retornar PR con título "chore(deps): ..."
```

**Criterios de Éxito**:

- ✅ PR creado en <24 horas después de habilitar
- ✅ Prefijo correcto: `chore(deps)`
- ✅ Agrupación de minor/patch funciona

---

### Prueba 2: Stale Bot Workflow

**Input**:

- Issue abierta hace >60 días sin actividad
- Label `status/need-triage` presente
- Workflow `stale.yml` configurado

**Output Esperado**:

1. Workflow ejecuta en schedule (o manualmente)
2. Issue recibe label `stale` automáticamente
3. Comentario automático agregado con mensaje de advertencia
4. Después de 14 días sin respuesta, issue se cierra automáticamente

**Verificación**:

```bash
gh issue view <number> --json labels | jq '.labels[].name'
# Debe contener "stale"

gh issue view <number> --json comments | jq '.comments[-1].body'
# Debe contener mensaje de stale warning
```

**Criterios de Éxito**:

- ✅ Label `stale` agregado en <24h de ejecución
- ✅ Mensaje automático apropiado
- ✅ Cierre automático después de 14 días adicionales

---

### Prueba 3: CODEOWNERS Enforcement

**Input**:

- PR modificando `.github/workflows/ci.yml`
- CODEOWNERS configurado con `@maintainers` para `.github/workflows/`
- PR abierto sin approval de CODEOWNERS

**Output Esperado**:

1. GitHub detecta CODEOWNERS automáticamente
2. PR muestra "Review required" de CODEOWNERS
3. Merge bloqueado hasta approval
4. Badge en PR UI mostrando requerimiento

**Verificación**:

```bash
gh pr view <number> --json reviewsRequiredBy
# Debe mostrar @maintainers o team equivalente
```

**Criterios de Éxito**:

- ✅ CODEOWNERS requerido automáticamente
- ✅ Merge bloqueado sin approval
- ✅ UI muestra requerimiento claramente

---

### Prueba 4: PR Template Validation

**Input**:

- PR creado desde GitHub UI o CLI
- Template presente en `.github/pull_request_template.md`

**Output Esperado**:

1. Template aparece automáticamente en PR body
2. Secciones marcadas claramente (checkboxes o texto)
3. PR puede ser abierto incluso si template no completado (validación manual)
4. Secciones del template visibles: TLDR, Dive Deeper, Reviewer Test Plan, Testing Matrix, Linked Issues

**Verificación**:

```bash
gh pr view <number> --json body | jq '.body'
# Debe contener todas las secciones del template
```

**Criterios de Éxito**:

- ✅ Template aparece en PR body
- ✅ Todas las secciones presentes
- ✅ Formato legible y estructurado

---

### Prueba 5: Issue Template Usage

**Input**:

- Nuevo issue creado desde GitHub UI
- Templates configurados en `.github/ISSUE_TEMPLATE/`
- `config.yml` presente

**Output Esperado**:

1. Dropdown muestra templates disponibles: "Bug Report", "Feature Request"
2. Al seleccionar template, form se pre-fill con campos estructurados
3. Campos marcados como requeridos validan antes de submit
4. `config.yml` redirige preguntas generales a Discussions

**Verificación**:

```bash
gh issue view <number> --json body | jq '.body'
# Debe contener formato YAML estructurado del template
```

**Criterios de Éxito**:

- ✅ Templates aparecen en UI
- ✅ Formato YAML preservado en issue body
- ✅ Config redirige apropiadamente

---

## 5. Señales Stop/Go

### Señales de Stop (Rollback o Pausa)

1. **Workflows fallando >3 veces consecutivas**
   - Acción: Deshabilitar workflow temporalmente, revisar logs
2. **Métricas no alcanzando umbrales después de 4 semanas**
   - Acción: Revisar configuración, ajustar umbrales o mejorar documentación
3. **Falsos positivos >20% en automatizaciones**
   - Acción: Refinar reglas, excluir casos específicos
4. **Breaking changes en workflows existentes**
   - Acción: Rollback inmediato, revisar compatibilidad

### Señales de Go (Continuar Implementación)

1. **✅ Workflows ejecutándose exitosamente >1 semana**
   - Acción: Continuar con siguiente fase
2. **✅ Métricas alcanzando umbrales**
   - Acción: Documentar éxito, escalar a otras áreas
3. **✅ Feedback positivo de maintainers/contribuidores**
   - Acción: Expandir funcionalidad
4. **✅ 0 errores en CI por 1 semana**
   - Acción: Considerar producción-ready

---

**Status**: ✅ Layout completado  
**Siguiente Fase**: Operate (implementación de workflows)
