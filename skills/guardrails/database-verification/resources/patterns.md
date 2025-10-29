# Patrones a bloquear

## Regex Patterns

- `/deleteMany\s*\(\s*\)/` - deleteMany sin where
- `/updateMany\s*\(\s*\)/` - updateMany sin where
- `/DROP\s+TABLE/i` - DROP TABLE fuera de migraciones
- `/TRUNCATE\s+TABLE/i` - TRUNCATE sin confirmación explícita

## Ejemplos Bloqueados

```typescript
// ❌ BLOQUEADO
await db.user.deleteMany();

// ✅ PERMITIDO
await db.user.deleteMany({ where: { archived: true } });

// ❌ BLOQUEADO
await db.user.updateMany({ data: { status: 'active' } });

// ✅ PERMITIDO
await db.user.updateMany({
  where: { lastLogin: { lt: yesterday } },
  data: { status: 'inactive' },
});
```
