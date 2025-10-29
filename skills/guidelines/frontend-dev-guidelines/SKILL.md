---
id: frontend-dev-guidelines
version: 0.1.0
type: guideline
summary: 'Patrones UI: componentes puros, fetching con cache, routing file-based y consistencia.'
audience: engineers
when_to_use: Al tocar componentes, hooks, data fetching o navegación.
resources:
  - resources/components.md
  - resources/data-fetching.md
  - resources/routing.md
  - resources/ui-consistency.md
---

## Procedimiento (resumen)

1. Componentes puros + hooks para efectos y datos.

2. Query lib: cache, reintentos, invalidación tras mutar.

3. Routing file-based; loaders claros; boundaries de error.

4. Tokens de diseño para tipografía/espaciado/colores.

## Checklist

- [ ] Props tipadas/documentadas.
- [ ] Loading/error visibles.
- [ ] Accesibilidad mínima (roles/labels/tabindex).
- [ ] Pruebas de interacción clave.

## Ejemplos

### ✅ Correcto

```typescript
// components/UserList.tsx
export function UserList({ users }: { users: User[] }) {
  return (
    <ul role="list">
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}

// hooks/useUsers.ts
export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    staleTime: 5 * 60 * 1000, // 5 min
  });
}
```

### ❌ Incorrecto

```typescript
// ❌ Lógica de fetching mezclada con UI
export function UserList() {
  const [users, setUsers] = useState([]);
  useEffect(() => {
    fetch('/api/users')
      .then(r => r.json())
      .then(setUsers);
  }, []);
  // ...
}
```
