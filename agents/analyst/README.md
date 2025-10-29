# Analyst Agent Base

Esta carpeta contiene la base inicial para el futuro **Agente Analista**. Se proveen stubs, estructura de directorios, pruebas placeholder y herramientas mínimas para que otro agente (o humano) consolide la implementación completa siguiendo los planes definidos en `docs/AGENTE_ANALISTA_PLAN.md` y la guía agnóstica `docs/AGENTE_AGNOSTICO.md`.

## Estructura actual

```
agents/analyst/
├── README.md                      # Este documento
├── config/
│   └── analyst.config.yaml        # Configuración declarativa (stub)
├── orchestrator/
│   └── orchestrator.py            # Clase Orchestrator (esqueleto)
├── tools/
│   ├── __init__.py
│   ├── pipeline_adapter.py        # Wrapper stub para pipelines existentes
│   ├── memory_client.py           # Cliente MemTech vía backend `/api/memtech/*`
│   └── feedback_queue.py          # Interfaz para loop de feedback humano
├── scripts/
│   └── run_agent.py               # Punto de entrada CLI stub
└── tests/
    ├── __init__.py
    └── test_orchestrator.py       # Pytest placeholder (xfail)
```

## Requisitos previos

- Backend FastAPI funcionando (`start-backend.sh`) con endpoints `/api/memtech/*` ya operativos.
- MemTech CLI/bridge configurados (`memtech/cli/memtech_cli.mjs`, `backend/services/memtech_bridge.py`).
- Pipelines Snickers listos (`tools/run_all.py`, `tools/pipeline_tidy_strict.py`).

## Siguientes pasos sugeridos

1. **Implementar adaptadores reales** en `tools/pipeline_adapter.py` y `tools/memory_client.py` usando las interfaces definidas en la guía agnóstica.
2. **Completar el Orchestrator** (`orchestrator/orchestrator.py`) con estados, paralelización controlada y loop de feedback descritos en el plan.
3. **Agregar pruebas reales** en `tests/` que cubran:
   - Ejecución happy-path con mocks de pipeline y memoria
   - Retries y degradación ante fallos (OCR/parse)
   - Feedback humano (`feedback_queue`)
4. **Conectar con MemTech** para persistir checkpoints/ADRs mediante los bridges.
5. **Documentar** cualquier extensión en este README y/o en la documentación global.

Cada archivo contiene comentarios `TODO` con instrucciones adicionales para el agente responsable.
