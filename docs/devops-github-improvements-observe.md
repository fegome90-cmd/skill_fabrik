# CLOOP Phase: Observe - Métricas y Evidencia

**Fecha**: 2025-10-29  
**Fase**: Observe  
**Status**: ✅ CONFIGURADO

---

## Métricas Recolectadas

### Métricas Fase 1 - Automatización

| Métrica                        | Definición                                     | Umbral Éxito           | Método Recolección                                                 | Status         |
| ------------------------------ | ---------------------------------------------- | ---------------------- | ------------------------------------------------------------------ | -------------- |
| `dependabot_pr_rate`           | PRs creados por dependabot/día                 | ≥ 2/semana             | `gh pr list --author "app/dependabot"`                             | 📊 Configurado |
| `stale_issues_closed`          | Issues cerrados por stale bot/semana           | ≥ 5/semana (after 30d) | `gh issue list --label "stale" --state "closed"`                   | 📊 Configurado |
| `no_response_closed`           | Issues/PRs cerrados por falta respuesta/semana | ≥ 2/semana             | `gh issue list --label "status/need-information" --state "closed"` | 📊 Configurado |
| `maintenance_time_saved_hours` | Horas ahorradas vs manual                      | ≥ 2h/semana            | Estimación basada en PRs/issues gestionados                        | 📊 Manual      |

### Métricas Fase 2 - Estructura

| Métrica                       | Definición                                 | Umbral Éxito       | Método Recolección                           | Status         |
| ----------------------------- | ------------------------------------------ | ------------------ | -------------------------------------------- | -------------- |
| `pr_template_usage_rate`      | % PRs usando template completo             | ≥ 90%              | Análisis manual de PR body por secciones     | 📊 Manual      |
| `issue_template_usage_rate`   | % issues usando templates                  | ≥ 80%              | Verificar formato YAML en body               | 📊 Manual      |
| `codeowners_review_rate`      | % PRs que requieren CODEOWNERS approval    | 100% para críticos | `gh pr view --json reviewsRequiredBy`        | 📊 Configurado |
| `template_completeness_score` | Score promedio completitud templates (0-1) | ≥ 0.7              | Análisis automático de secciones completadas | 📊 Manual      |

### Métricas Fase 3 - CI/CD (Futuro)

| Métrica                    | Definición                           | Umbral Éxito | Método Recolección | Status         |
| -------------------------- | ------------------------------------ | ------------ | ------------------ | -------------- |
| `ci_pipeline_success_rate` | % workflows completando como success | ≥ 95%        | GitHub Actions API | 📊 Configurado |

---

## Script de Recolección

**Archivo**: `scripts/devops/metrics-collector.sh`

**Uso**:

```bash
./scripts/devops/metrics-collector.sh
```

**Output**: Métricas en formato legible + sugerencias para export JSON

---

## Evidencia a Recolectar

### Evidencia de Funcionamiento

1. **Dependabot**:
   - Screenshot de PR creado por dependabot
   - Log de ejecución (cuando esté disponible en GitHub)
   - Ejemplo de commit message con prefijo `chore(deps)`

2. **Stale Bot**:
   - Screenshot de issue con label `stale`
   - Comentario automático agregado
   - Issue cerrado después de 14 días adicionales

3. **No Response**:
   - Screenshot de issue/PR con label `status/need-information`
   - Issue/PR cerrado automáticamente

4. **CODEOWNERS**:
   - Screenshot de PR mostrando "Review required"
   - Badge de CODEOWNERS en PR UI

5. **Templates**:
   - Screenshot de PR template pre-filled
   - Screenshot de issue templates dropdown
   - Ejemplo de issue creado con template YAML

---

## Verificación de Métricas

### Línea Base (Antes de Implementación)

```
dependabot_pr_rate: 0
stale_issues_closed: 0
no_response_closed: 0
pr_template_usage_rate: ~50% (templates básicos anteriores)
issue_template_usage_rate: ~30% (templates básicos anteriores)
codeowners_review_rate: 0% (no configurado)
ci_pipeline_success_rate: ~90% (con continue-on-error)
```

### Targets Post-Implementación (30 días)

```
dependabot_pr_rate: ≥ 2/semana
stale_issues_closed: ≥ 5/semana
no_response_closed: ≥ 2/semana
pr_template_usage_rate: ≥ 90%
issue_template_usage_rate: ≥ 80%
codeowners_review_rate: 100% para archivos críticos
ci_pipeline_success_rate: ≥ 95%
```

---

## Métodos de Validación

### Automático (vía Script)

```bash
# Ejecutar script de recolección
./scripts/devops/metrics-collector.sh

# Exportar datos para análisis
gh pr list --repo fegome90-cmd/skill_fabrik --json number,title,author,createdAt --limit 100 > metrics-prs.json
gh issue list --repo fegome90-cmd/skill_fabrik --json number,title,labels,createdAt --limit 100 > metrics-issues.json
gh run list --repo fegome90-cmd/skill_fabrik --workflow "CI Pipeline" --limit 20 --json conclusion,status,createdAt > metrics-ci.json
```

### Manual (Revisión Periódica)

1. Revisar PRs semanales y verificar uso de template
2. Revisar issues creados y verificar uso de templates YAML
3. Verificar CODEOWNERS en PRs que modifican archivos críticos
4. Documentar casos de éxito con screenshots

---

## Reporting

**Frecuencia**: Semanal (cada lunes)

**Formato**: Actualizar este documento o crear reporte separado en `docs/devops-metrics-report-YYYY-MM-DD.md`

**Responsable**: DevOps team / maintainers

---

**Status**: ✅ Observe configurado  
**Siguiente**: Ejecutar tests de validación y recolectar evidencias iniciales
