# Repositories (Detalles)

## Estructura Base

```typescript
export class UserRepository {
  constructor(private db: Database) {}

  async findById(id: string): Promise<User | null> {
    return this.db.user.findUnique({ where: { id } });
  }

  async create(data: CreateUserData): Promise<User> {
    return this.db.user.create({ data });
  }
}
```

## Reglas

- Encapsular ORM/consultas
- Transacciones explícitas
- Consultas optimizadas (selects específicos)
- Sin lógica de negocio
