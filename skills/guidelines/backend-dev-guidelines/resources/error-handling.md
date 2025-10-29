# Manejo de errores (resumen)

- Capturar en controlador y registrar.
- Mapear errores a códigos HTTP consistentes.
- No filtrar silenciosamente; devolver mensajes seguros.
- Adjuntar `requestId` para trazabilidad.

## Ejemplo

```typescript
function handleError(error: Error, req: Request, res: Response) {
  logger.error({ error, requestId: req.id }, 'Request failed');

  if (error instanceof NotFoundError) {
    res.status(404).json({ error: 'Resource not found' });
  } else if (error instanceof ValidationError) {
    res.status(400).json({ error: error.message });
  } else {
    res.status(500).json({ error: 'Internal server error' });
  }
}
```
