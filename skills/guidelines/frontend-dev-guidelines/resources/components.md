# Components (Detalles)

## Estructura Base

```typescript
interface UserCardProps {
  user: User;
  onSelect?: (id: string) => void;
}

export function UserCard({ user, onSelect }: UserCardProps) {
  return (
    <div role="article" aria-label={`User ${user.name}`}>
      <h3>{user.name}</h3>
      {onSelect && (
        <button onClick={() => onSelect(user.id)}>
          Select
        </button>
      )}
    </div>
  );
}
```

## Reglas

- Props tipadas (TypeScript)
- Componentes puros cuando sea posible
- Hooks para efectos y estado
- Accesibilidad básica (roles, labels)
