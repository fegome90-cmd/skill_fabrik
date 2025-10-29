---
id: project-catalog-developer
version: 0.1.0
type: guideline
summary: Desarrollo de la vista catálogo (DataGrid grande): layout, columnas, filtros, virtualización y rendimiento.
audience: engineers
when_to_use: Cambios en componentes de catálogo o su layout/columnas/filtros.
resources:
  - resources/datagrid-layout.md
  - resources/performance.md
---

## Procedimiento (resumen)

1. Definir columnas con tipos y formatters.

2. Virtualización activada para listas largas.

3. Filtros controlados, debounced, persistentes por URL.

4. Paginación y orden estable; pruebas de rendimiento.

## Checklist esencial

- [ ] Columnas tipadas y únicas.
- [ ] Filtros sincronizados con URL.
- [ ] Virtualización funcionando sin glitches.
- [ ] No bloquear main thread (>16ms).
