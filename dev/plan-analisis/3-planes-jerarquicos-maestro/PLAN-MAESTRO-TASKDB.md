# 🗺️ Plan Maestro TaskDB — QuanNex/MCP

## 🎯 Objetivo General

Convertir a TaskDB en la única fuente de verdad antifrágil para el proyecto, garantizando:
- **Consistencia absoluta** en tareas, runs, gates, artifacts y reports.
- **Gobernanza de largo plazo** con políticas versionadas.
- **Integridad automatizada** y auditable.
- **Escalabilidad operativa** y developer-friendly.

---

## 📦 Arquitectura y Componentes

### 1. Entidades Núcleo

#### `task` - Unidad de Trabajo
```json
{
  "id": "uuid4",
  "title": "string",
  "description": "text",
  "status": "todo|doing|review|done|cancelled",
  "priority": "critical|high|medium|low",
  "policy_version": "semver",
  "created_at": "iso8601",
  "updated_at": "iso8601",
  "completed_at": "iso8601|null",
  "assigned_to": "string|null",
  "tags": ["string"],
  "metadata": {}
}
```

#### `run` - Ejecución Asociada
```json
{
  "id": "uuid4",
  "task_id": "uuid4",
  "status": "pending|running|completed|failed",
  "started_at": "iso8601",
  "completed_at": "iso8601|null",
  "duration_ms": "number|null",
  "tool_calls": [
    {
      "tool_name": "string",
      "args": {},
      "result": {},
      "duration_ms": "number"
    }
  ],
  "metrics": {
    "success_rate": "number",
    "error_count": "number",
    "latency_p50": "number",
    "latency_p95": "number"
  }
}
```

#### `gate` - Verificaciones
```json
{
  "id": "uuid4",
  "name": "string",
  "type": "lint|policy|truth|quality|security",
  "status": "pass|fail|pending",
  "checks": [
    {
      "name": "string",
      "status": "pass|fail|warning",
      "message": "string",
      "evidence": "string|null"
    }
  ],
  "policy_version": "semver",
  "run_id": "uuid4|null"
}
```

#### `artifact` - Outputs Verificables
```json
{
  "id": "uuid4",
  "name": "string",
  "type": "report|code|data|config",
  "uri": "string",
  "hash": "sha256",
  "size_bytes": "number",
  "created_at": "iso8601",
  "run_id": "uuid4",
  "metadata": {}
}
```

#### `event` - Timeline Inmutable
```json
{
  "id": "uuid4",
  "type": "task_created|task_updated|run_started|run_completed|gate_failed|artifact_created",
  "entity_id": "uuid4",
  "entity_type": "task|run|gate|artifact",
  "timestamp": "iso8601",
  "data": {},
  "source": "api|cli|agent|system"
}
```

#### `report` - Entregables con Provenance
```json
{
  "id": "uuid4",
  "title": "string",
  "type": "analysis|audit|metrics|summary",
  "status": "draft|published|retracted",
  "content": "text|object",
  "report_provenance": {
    "task_ids": ["uuid4"],
    "run_ids": ["uuid4"],
    "artifact_hashes": ["sha256"],
    "claims_validated": [
      {
        "claim": "string",
        "evidence": "string",
        "status": "validated|failed"
      }
    ],
    "verification_snapshot_ts": "iso8601"
  },
  "created_at": "iso8601",
  "published_at": "iso8601|null",
  "retracted_at": "iso8601|null"
}
```

### 2. Esquemas Clave

#### `task.policy_version`
- Fija reglas con las que nació la task
- Permite evolución de políticas sin romper tareas existentes
- Referencia a `taskdb.yaml` versionado

#### `status_derived`
- Calculado vía materialized view + triggers
- Actualización automática en cambios de run/gate
- Fuente única de verdad para estado computado

#### `report_provenance`
- Lista de IDs, hashes y claims validados
- Garantiza trazabilidad completa
- Validación activa contra TaskDB

### 3. Servicios Asociados

#### Provenance Verifier
- Valida procedencia activamente contra TaskDB
- Verifica existencia de IDs y hashes
- Valida claims contra status_derived
- Requiere verification_snapshot_ts

#### TaskDB Doctor
- Chequea integridad nightly/CI
- Modo --fix para corrección automática
- Detecta huérfanos, scores inválidos, hashes vacíos

#### Archivador
- Mueve eventos >180 días a storage frío
- Mantiene índices para consultas rápidas
- Compresión automática de datos históricos

#### Depurador de Provenance
- CLI debug para diffs esperados vs actuales
- Herramienta de diagnóstico para developers
- Validación de consistencia de reportes

---

## 🛡️ Pilares Antifrágiles

### 🔍 1. Verificación Activa
- **Reportes no válidos** sin report_provenance
- **Provenance Verifier**:
  - Verifica existencia de IDs y hashes
  - Valida claims contra status_derived
  - Requiere verification_snapshot_ts → garantiza consistencia temporal

### 📑 2. Gobernanza a Largo Plazo
- **Versionado de políticas** en taskdb.yaml:
  - Tareas viejas siguen reglas de su época
- **Archivos de eventos**:
  - Log append-only
  - Archivado nocturno → S3/GCS → pruning en producción
- **Playbook de retractación**:
  - Retractar un informe crea una task de corrección dependiente

### 🩺 3. Integridad Automatizada
- **TaskDB Doctor**:
  - Chequea integridad, huérfanos, scores inválidos, hashes vacíos
  - CI/CD: bloquea merges si falla
  - Modo --fix: archiva huérfanos, normaliza policy_version

### 📘 4. Formalización Operativa
- **Runbooks**:
  - taskdb_recovery.md: pasos para restaurar integridad
- **Playbooks**:
  - report_retraction.md: proceso estandarizado de retractación
- **Todo incidente** produce artefactos y eventos trazables

---

## ⚡ Refinamientos de Escala

### 1. Timestamp de verificación
- `verification_snapshot_ts` asegura validación contra el mismo estado en que fue generado el informe

### 2. Vista materializada para status_derived
- Lecturas instantáneas, actualizadas por triggers en run/gate

### 3. Ciclo de corrección automático
- Cada retractación abre una nueva task tipo correction dependiente

### 4. Depurador de procedencia (CLI)
- `qn report:debug-provenance prov.json` → muestra diferencias claras entre lo declarado y TaskDB

---

## 📈 Métricas y Telemetría

### Métricas Prometheus
```
taskdb_tasks_total{status=...}
taskdb_runs_active
taskdb_gates_failed_total
taskdb_reports_without_provenance_total
taskdb_provenance_verifications_total{status}
taskdb_doctor_checks_total{status}
```

### Alarmas Críticas
- **Provenance fail rate** >5%
- **Doctor fail** en últimas 24h >0
- **Huérfanos detectados** >0

---

## 🚦 Roadmap de Ejecución

### Ola 1 — Robustez (semanas 1–3)
- [ ] Implementar DB (SQLite WAL → Postgres futuro)
- [ ] API CRUD de tasks/runs/gates/artifacts/events
- [ ] Provenance Verifier básico (sin snapshot_ts aún)
- [ ] TaskDB Doctor inicial
- [ ] Runbook + Playbook documentados
- [ ] CI/CD integridad + gates requeridos

### Ola 2 — Antifrágil (semanas 4–6)
- [ ] Añadir policy_version en tasks + YAML versionado
- [ ] Provenance Verifier con snapshot_ts
- [ ] Job archivador de eventos
- [ ] CLI qn report:validate, publish, retract
- [ ] Integración CI/CD con gates de proveniencia
- [ ] TaskDB Doctor con modo --fix

### Ola 3 — Escalamiento (semanas 7–9)
- [ ] Migrar a Postgres con triggers + MV para status_derived
- [ ] CLI qn report:debug-provenance
- [ ] Retractación → crea automáticamente task de corrección
- [ ] Prometheus/Grafana integrados con alertas
- [ ] Simulación de carga (100k tasks, 1M runs)

---

## 🏆 Resultado Final

Un TaskDB antifrágil y escalable que:
- **Hace cumplir** la veracidad de los informes automáticamente
- **Nunca pierde** trazabilidad ni contexto histórico
- **Es resiliente** a fallos de integridad y fácil de recuperar
- **Escala** de forma eficiente a cientos de miles de tasks
- **Ofrece** a devs herramientas rápidas de diagnóstico
- **Formaliza** todo en SOPs (runbooks/playbooks)

---

## 📊 Estado Actual del Proyecto

### Componentes Existentes
- ✅ **TaskDB Kernel**: Base implementada en `tools/scripts/taskdb-kernel.mjs`
- ✅ **TaskDB Protection**: Sistema de protección en `core/taskdb-protection.js`
- ✅ **Integrity Validator**: Validador de integridad en `core/integrity-validator.js`
- ✅ **Data Structure**: Estructura JSON existente en `data/taskdb.json`

### Próximos Pasos Inmediatos
1. **Migrar** estructura JSON existente a esquema antifrágil
2. **Implementar** entidades núcleo con policy_version
3. **Crear** Provenance Verifier básico
4. **Desarrollar** TaskDB Doctor inicial
5. **Documentar** runbooks y playbooks operativos

---

*Este plan maestro establece la base para un sistema TaskDB enterprise-grade que garantiza la integridad, trazabilidad y escalabilidad del proyecto QuanNex.*
