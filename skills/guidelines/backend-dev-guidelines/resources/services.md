# Services (Detalles)

## Estructura Base

```typescript
export class UserService {
  constructor(private userRepo: UserRepository) {}

  async findById(id: string): Promise<User> {
    const user = await this.userRepo.findById(id);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }
}
```

## Reglas

- Puros (sin dependencias de HTTP/Express)
- Testeables (mock repositorios fácilmente)
- Reglas de negocio centralizadas
- Transacciones en repositorio, no en servicio
