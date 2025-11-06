# MemTech L1 Snapshot Integration

## Estado Actual

**TODO**: Integración con sistema MemTech para crear snapshot L1 (Working Memory) al aprobar plan.

## Estructura Esperada

```json
{
  "type": "plan_snapshot",
  "level": "L1",
  "plan_id": "<plan-id>",
  "task_name": "<task-name>",
  "content": {
    "objective": "<task-description>",
    "phases": [...],
    "status": "APPROVED",
    "approved_at": "<iso-timestamp>"
  },
  "metadata": {
    "created_at": "<iso-timestamp>",
    "expires_at": "<iso-timestamp>",
    "tags": ["plan", "approved", "<task-type>"]
  }
}
```

## Integración Futura

Cuando MemTech esté integrado:

1. Al aprobar plan, crear snapshot L1
2. Snapshot contiene información esencial del plan
3. MemTech mantiene snapshot mientras tarea esté activa
4. Al completar, snapshot se archiva en L2/L3

## Placeholder Actual

Por ahora, el workflow prepara la estructura pero no crea el snapshot real. La integración se completará en la fase final.

