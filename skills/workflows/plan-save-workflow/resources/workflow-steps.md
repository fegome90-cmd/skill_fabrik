# Workflow Steps - Detalle

## Flujo Completo

```mermaid
graph TD
    A[plan save <id>] --> B{Plan exists?}
    B -->|No| C[Error: Plan not found]
    B -->|Yes| D{Plan valid?}
    D -->|No| E[Error: Validation failed]
    D -->|Yes| F{Plan approved?}
    F -->|No| G[Approve plan]
    G --> H[Generate triada]
    F -->|Yes| H
    H --> I[Create task directory]
    I --> J[Generate plan.md]
    J --> K[Generate context.md]
    K --> L[Generate tasks.md]
    L --> M[Create task.json]
    M --> N[Prepare MemTech snapshot]
    N --> O[Success]
```

## Verificaciones Post-Generación

Después de generar la tríada, verificar:

1. Todos los archivos existen
2. `plan.md` contiene toda la información del plan
3. `context.md` tiene estructura correcta
4. `tasks.md` tiene checklist derivado de fases
5. `task.json` referencia correctamente al plan

## Integración con Pre-invoke Hook

Una vez generada la tríada:
- Pre-invoke hook detecta `dev/active/<task>/task.json`
- Lee `planPath` y verifica que plan está APPROVED
- Permite ejecución si plan está aprobado
- Bloquea si no hay plan o plan no está aprobado

