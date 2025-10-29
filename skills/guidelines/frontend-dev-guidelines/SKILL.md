---
id: frontend-dev-guidelines
version: 0.1.0
type: guideline
summary: Patrones UI, componentes, fetching, routing y consistencia visual.
audience: engineers
when_to_use: Edición de componentes, hooks, data fetching y navegación.
resources:
  - resources/components.md
  - resources/data-fetching.md
  - resources/routing.md
  - resources/ui-consistency.md
---

## Objetivo

UI consistente, predecible y testeable: componentes puros, estados claros y navegación estable.

## Procedimiento (resumen)

1. Componentes puros + hooks para efectos.

2. Data fetching con lib de queries (cache, reintentos, invalidación).

3. Routing file-based, loaders claros, manejo robusto de errores de UI.

4. Consistencia: tipografía, espaciado y tokens de diseño comunes.

## Checklist esencial

- [ ] Props tipadas y documentadas.
- [ ] Estados y efectos mínimos.
- [ ] Manejo de errores y loading explícitos.
- [ ] Accesibilidad básica (roles/labels).
- [ ] Prueba rápida de interacción clave.
