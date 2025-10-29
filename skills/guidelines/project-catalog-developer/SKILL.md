---
id: project-catalog-developer
version: 0.1.0
type: guideline
summary: 'Catálogo (DataGrid): columnas tipadas, filtros con URL, virtualización y rendimiento.'
audience: engineers
when_to_use: Cambios en grid, layout, filtros o rendimiento.
resources:
  - resources/datagrid-layout.md
  - resources/performance.md
---

## Procedimiento

1. Columnas con tipos/formatters; keys únicas y estables.

2. Filtros controlados, debounced y persistidos en URL.

3. Virtualización para listas largas; no bloquear main thread.

4. Medición: FPS, long tasks, memoria.

## Checklist

- [ ] Columnas y filtros sincronizados con URL.
- [ ] Virtualización sin glitches visuales.
- [ ] No hay renders >16ms críticos.

## Ejemplos

### ✅ Correcto

```typescript
const columns = useMemo(() => [
  { key: 'id', header: 'ID', render: (v) => v },
  { key: 'name', header: 'Nombre', render: (v) => v.toUpperCase() },
], []);

function CatalogGrid({ data }) {
  const { filters, setFilters } = useSearchParams();
  return (
    <VirtualizedGrid
      columns={columns}
      data={data}
      filters={filters}
      onFiltersChange={setFilters}
    />
  );
}
```
