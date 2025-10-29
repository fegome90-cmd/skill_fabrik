---
id: database-verification
version: 0.1.0
type: guardrail
enforcement: block
summary: Evita operaciones peligrosas o sin filtros; fuerza confirmación.
audience: engineers
when_to_use: Siempre que se editen repositorios/queries/migraciones.
resources:
  - resources/patterns.md
---

## Política (bloqueo)

- Prohibido `deleteMany(` o `updateMany(` sin `where` explícito.

- Prohibido `truncate`, `drop table` fuera de migraciones seguras.

- Cambios de esquema destructivos requieren `migration plan` con rollback.

## Excepciones

- Scripts de limpieza controlados deben incluir `--confirm` y `--dry-run`.

## Checklist

- [ ] Cada mutación masiva con `where`.
- [ ] Migración con plan de rollback validado.
- [ ] Logs de auditoría habilitados.
