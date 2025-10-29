# DataGrid Layout (Detalles)

## Estructura de Columnas

```typescript
const columns = [
  {
    field: 'id',
    headerName: 'ID',
    type: 'number',
    width: 100,
  },
  {
    field: 'name',
    headerName: 'Nombre',
    type: 'string',
    flex: 1,
    valueFormatter: value => value?.toUpperCase(),
  },
];
```

## Reglas

- Tipos explícitos por columna
- Formatters para datos complejos
- Anchura flexible o fija según contenido
- Orden persistente en estado/URL
