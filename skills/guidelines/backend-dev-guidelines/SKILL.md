---
id: backend-dev-guidelines
version: 0.1.0
type: guideline
summary: Patrones backend (rutas→controladores→servicios→repositorios), manejo de errores y pruebas.
audience: engineers
when_to_use: Al crear/editar endpoints, controladores, servicios o repositorios.
resources:
  - resources/controllers.md
  - resources/services.md
  - resources/repositories.md
  - resources/error-handling.md
  - resources/testing.md
scripts:
  - name: test-auth-route
    run: node scripts/test-auth-route.js <URL>
    note: Realiza request autenticado con token y cookie válidos.
limits: Mantener SRP y dependencias explícitas por capa.
---

## Procedimiento (resumen)

1. Rutas solo definen método/path → delegan a Controlador.

2. Controlador valida entrada, orquesta Servicio y mapea errores a HTTP.

3. Servicio contiene reglas de negocio puras; sin lógica de infra.

4. Repositorio encapsula ORM, transacciones y proyecciones.

5. Errores siempre registrados; nunca silenciados.

## Checklist

- [ ] DTO/Schema de entrada validado.
- [ ] Controlador sin lógica de negocio.
- [ ] Servicio testeable (unit).
- [ ] Consultas aisladas en repositorio.
- [ ] Pruebas de integración básicas para endpoint.

## Ejemplos

### ✅ Correcto

```typescript
// routes/users.ts
router.post('/users', UserController.create);

// controllers/UserController.ts
export class UserController {
  static async create(req: Request, res: Response) {
    const dto = UserSchema.parse(req.body);
    const user = await UserService.create(dto);
    res.status(201).json(user);
  }
}

// services/UserService.ts
export class UserService {
  static async create(dto: CreateUserDTO) {
    // Lógica de negocio pura
    const hashed = await hashPassword(dto.password);
    return await UserRepository.create({ ...dto, password: hashed });
  }
}
```

### ❌ Incorrecto

```typescript
// routes/users.ts - NO hacer esto
router.post('/users', async (req, res) => {
  const user = await prisma.user.create({ data: req.body }); // ❌ Acceso directo a BD
  res.json(user);
});
```

## Recursos (extractos)

### resources/error-handling.md

- Usar errores tipados (p.ej. DomainError, NotFoundError).
- Mapear a HTTP (400/404/409/500) de forma consistente.
- Registrar con requestId/correlationId.

### resources/testing.md

- Unit: servicios y utilidades puras.
- Integración: endpoints críticos con datos seed.
- Contrato: esquemas de request/response validados.
