# Performance (Detalles)

## Virtualización

- Usar `react-window` o equivalente para listas largas
- Renderizar solo elementos visibles
- Memoizar componentes de fila

## Optimizaciones

- Debounce de filtros (300-500ms)
- Lazy loading de imágenes
- Code splitting de vistas pesadas
- Medir con React DevTools Profiler

## Métricas Objetivo

- First paint < 1s
- Interacción < 100ms
- No bloquear main thread > 16ms
