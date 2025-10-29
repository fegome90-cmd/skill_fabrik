---
id: database-verification
version: 0.1.0
type: guardrail
enforcement: block
summary: Bloquea mutaciones masivas sin filtro y operaciones destructivas inseguras.
audience: engineers
when_to_use: Cualquier cambio en repositorios/queries/migraciones.
resources:
  - resources/patterns.md
  - resources/migration-checklist.md
scripts:
  - name: safe-migrate
    run: pnpm ts-node scripts/db/safe-migrate.ts
    note: Ejecuta migración con pre-checks, respaldo y rollback plan.
---

## Política (bloqueo)

- Prohibido `deleteMany()`/`updateMany()` sin `where`.

- Prohibido `TRUNCATE`/`DROP TABLE` fuera de migraciones seguras.

- Migraciones destructivas sin plan de rollback → bloqueo.

## Checklist

- [ ] `where` presente en mutaciones.
- [ ] Plan de rollback redactado y probado.
- [ ] Log/auditoría de cambios habilitados.

## Ejemplos

### ❌ BLOQUEADO

```typescript
// ❌ deleteMany sin where
await prisma.user.deleteMany(); // BLOQUEADO

// ❌ updateMany sin where
await prisma.user.updateMany({ data: { status: 'inactive' } }); // BLOQUEADO
```

### ✅ PERMITIDO

```typescript
// ✅ Con where explícito
await prisma.user.deleteMany({
  where: { status: 'deleted', deletedAt: { lt: new Date() } },
});

// ✅ updateMany con where
await prisma.user.updateMany({
  where: { tenantId: currentTenant },
  data: { status: 'inactive' },
});
```

## Recursos (extractos)

### resources/patterns.md

Bloquear:

- `/\bdeleteMany\s*\(\s*\)/` # sin argumentos
- `/\bupdateMany\s*\(\s*\)/` # sin argumentos
- `/TRUNCATE\s+TABLE/i`
- `/DROP\s+TABLE/i`

### resources/migration-checklist.md

- Backup previo, verificado.
- Pruebas en snapshot staging.
- Plan de rollback scriptado.
- Ventana de mantenimiento definida.
