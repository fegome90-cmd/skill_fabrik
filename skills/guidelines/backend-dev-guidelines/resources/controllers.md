# Controllers (Detalles)

## Estructura Base

```typescript
export class UserController {
  constructor(private userService: UserService) {}

  async getById(req: Request, res: Response) {
    try {
      // 1. Validar input (DTO/schema)
      const { id } = await validateParams(req.params, getUserByIdSchema);

      // 2. Llamar servicio
      const user = await this.userService.findById(id);

      // 3. Responder
      res.json(user);
    } catch (error) {
      handleError(error, req, res);
    }
  }
}
```

## Reglas

- Sin lógica de negocio (solo validación + orquestación)
- Manejo centralizado de errores
- Tipos explícitos en request/response
- Logging de requests críticos
